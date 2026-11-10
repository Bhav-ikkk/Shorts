import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { getFfmpegPath } from '../core/ffmpeg.js';
import { getProjectBuildDir } from '../core/paths.js';

export async function renderFrames(projectName = 'spectra', options = {}) {
  const FPS = options.fps || 30;
  const buildDir = getProjectBuildDir(projectName);
  const htmlPath = path.join(buildDir, 'index.html');
  const tmpVideo = path.join(buildDir, 'video_silent.tmp.mp4');
  const finalVideo = path.join(buildDir, 'video_silent.mp4');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`index.html not found at ${htmlPath}. Run build step first.`);
  }

  const ffmpegBin = getFfmpegPath();
  const cpus = os.cpus().length;
  // Default to 2-3 workers on a 4-core machine to prevent CPU thrashing
  const workers = options.workers || Math.max(1, Math.min(3, cpus - 1));

  console.log(`[Render] Starting deterministic render with ${workers} worker(s)...`);
  console.log(`  FFmpeg binary: ${ffmpegBin}`);

  // Probe total duration and canvas dimensions
  let probeBrowser;
  try {
    probeBrowser = await chromium.launch({ channel: 'chrome' });
  } catch {
    probeBrowser = await chromium.launch({ channel: 'msedge' });
  }
  const probePage = await probeBrowser.newPage({ viewport: { width: 1920, height: 1080 } });
  await probePage.goto(pathToFileURL(htmlPath).href);
  await probePage.evaluate(() => window.ready);
  const { total, width, height } = await probePage.evaluate(() => ({
    total: window.TOTAL || 42,
    width: window.WIDTH || 1920,
    height: window.HEIGHT || 1080
  }));
  await probeBrowser.close();

  const frames = Math.round(total * FPS);
  console.log(`  Total duration: ${total}s (${frames} frames at ${FPS} fps, ${width}x${height})`);

  if (workers === 1) {
    await renderWorker({
      workerId: 0,
      startFrame: 0,
      endFrame: frames,
      totalFrames: frames,
      FPS,
      width,
      height,
      htmlPath,
      ffmpegBin,
      outFile: tmpVideo
    });
  } else {
    const perWorker = Math.ceil(frames / workers);
    const workerPromises = [];
    const partFiles = [];

    for (let w = 0; w < workers; w++) {
      const start = w * perWorker;
      const end = Math.min(frames, (w + 1) * perWorker);
      if (start >= end) continue;

      const partTmp = path.join(buildDir, `part_${w}.tmp.mp4`);
      const partFinal = path.join(buildDir, `part_${w}.mp4`);
      partFiles.push(partFinal);

      workerPromises.push(
        renderWorker({
          workerId: w,
          startFrame: start,
          endFrame: end,
          totalFrames: frames,
          FPS,
          width,
          height,
          htmlPath,
          ffmpegBin,
          outFile: partTmp
        }).then(() => {
          if (fs.existsSync(partTmp)) {
            fs.renameSync(partTmp, partFinal);
          }
        })
      );
    }

    await Promise.all(workerPromises);

    // Concat parts with FFmpeg
    console.log(`[Render] Concatenating ${partFiles.length} parts into final stream...`);
    const partsListFile = path.join(buildDir, 'parts.txt');
    const partsContent = partFiles.map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n');
    fs.writeFileSync(partsListFile, partsContent, 'utf8');

    const concatArgs = [
      '-y', '-v', 'error',
      '-f', 'concat',
      '-safe', '0',
      '-i', partsListFile,
      '-c', 'copy',
      tmpVideo
    ];

    await new Promise((resolve, reject) => {
      const proc = spawn(ffmpegBin, concatArgs, { stdio: 'inherit' });
      proc.on('close', code => (code === 0 ? resolve() : reject(new Error(`Concat failed: code ${code}`))));
    });

    // Cleanup part files
    for (const f of partFiles) {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    }
    if (fs.existsSync(partsListFile)) fs.unlinkSync(partsListFile);
  }

  if (fs.existsSync(tmpVideo)) {
    fs.renameSync(tmpVideo, finalVideo);
    console.log(`[Render] Successfully produced silent video:\n  -> ${finalVideo}`);
    return finalVideo;
  } else {
    throw new Error('Video rendering failed to produce output.');
  }
}

async function renderWorker({ workerId, startFrame, endFrame, totalFrames, FPS, width, height, htmlPath, ffmpegBin, outFile }) {
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      args: ['--font-render-hinting=medium', '--force-color-profile=srgb']
    });
  } catch {
    browser = await chromium.launch({
      channel: 'msedge',
      args: ['--font-render-hinting=medium', '--force-color-profile=srgb']
    });
  }

  const page = await browser.newPage({
    viewport: { width: width || 1920, height: height || 1080 },
    deviceScaleFactor: 1
  });
  page.on('pageerror', err => console.log(`[Worker ${workerId}] PAGEERR:`, err.message));

  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => window.ready);

  const ffArgs = [
    '-y', '-v', 'error',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-c:v', 'mjpeg',
    '-i', '-',
    '-c:v', 'libx264',
    '-crf', '16',
    '-preset', 'medium',
    '-pix_fmt', 'yuv420p',
    '-colorspace', 'bt709',
    '-color_primaries', 'bt709',
    '-color_trc', 'bt709',
    '-r', String(FPS),
    '-movflags', '+faststart',
    outFile
  ];

  const ff = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((resolve, reject) => {
    ff.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg worker ${workerId} exited with error ${code}`));
    });
  });

  const count = endFrame - startFrame;
  for (let i = startFrame; i < endFrame; i++) {
    const t = i / FPS;
    await page.evaluate(time => window.seek(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 98 });
    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once('drain', r));
    }
    if ((i - startFrame) % 75 === 0 || i === endFrame - 1) {
      const pct = (((i - startFrame + 1) / count) * 100).toFixed(1);
      console.log(`  [Worker ${workerId}] Frame ${i}/${endFrame} (${pct}%)`);
    }
  }

  ff.stdin.end();
  await ffDone;
  await browser.close();
}

if (process.argv[1] && process.argv[1].endsWith('render_engine.js')) {
  const p = process.argv[2] || 'spectra';
  renderFrames(p);
}

