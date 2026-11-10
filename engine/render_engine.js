import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';
import { getFfmpegPath } from './ffmpeg_resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function renderFrames(projectName = 'spectra', options = {}) {
  const FPS = options.fps || 30;
  const projectDir = path.resolve(rootDir, 'projects', projectName);
  const htmlPath = path.join(projectDir, 'build', 'index.html');
  const tmpVideo = path.join(projectDir, 'build', 'video_silent_tmp.mp4');
  const finalVideo = path.join(projectDir, 'build', 'video_silent.mp4');

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`index.html not found at ${htmlPath}`);
  }

  const ffmpegBin = getFfmpegPath();
  console.log(`[Render] Deterministic seek-render using FFmpeg: ${ffmpegBin}`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ channel: 'msedge' });
  }

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', err => console.log('PAGEERR:', err.message));

  console.log(`[Render] Loading motion canvas: ${htmlPath}`);
  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => window.ready);

  const total = await page.evaluate(() => window.TOTAL);
  const frames = Math.round(total * FPS);
  console.log(`[Render] Canvas ready! Total duration: ${total}s (${frames} frames at ${FPS} fps)`);

  const ffArgs = [
    '-y', '-v', 'error',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-c:v', 'mjpeg',
    '-i', '-',
    '-c:v', 'libx264',
    '-crf', '18',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-movflags', '+faststart',
    tmpVideo
  ];

  const ff = spawn(ffmpegBin, ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const ffDone = new Promise((resolve, reject) => {
    ff.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg exited with error code ${code}`));
    });
  });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await page.evaluate(time => window.seek(time), t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) {
      await new Promise(r => ff.stdin.once('drain', r));
    }
    if (i % 100 === 0 || i === frames - 1) {
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
      const pct = ((i / frames) * 100).toFixed(1);
      console.log(`  [Frame ${i}/${frames}] ${pct}% (${elapsed}s elapsed)`);
    }
  }

  ff.stdin.end();
  await ffDone;
  await browser.close();

  if (fs.existsSync(tmpVideo)) {
    fs.renameSync(tmpVideo, finalVideo);
    console.log(`[Render] Successfully rendered silent video to:\n  ${finalVideo}`);
    return finalVideo;
  } else {
    throw new Error('Silent video output was not created.');
  }
}

if (process.argv[1] && process.argv[1].endsWith('render_engine.js')) {
  const p = process.argv[2] || 'spectra';
  renderFrames(p);
}

