/**
 * Blocky Story Engine — Sets & Props Showcase Runner
 * Renders the 6-set / 4-mood showcase film, captures 12 keyframes, and composes contact sheet.
 */

const { chromium } = require('playwright');
const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const http = require('http');

const FPS = 30, W = 1080, H = 1920;
const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const OUT_DIR = path.join(BASE_DIR, 'out');

function resolveFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    const ffs = require('ffmpeg-static');
    if (ffs && fs.existsSync(ffs)) return ffs;
  } catch {}
  return 'ffmpeg';
}
const FFMPEG = resolveFfmpeg();

function serve(root) {
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.woff2': 'font/woff2',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg'
  };
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      if (p === '/favicon.ico') {
        r.writeHead(204);
        return r.end();
      }
      if (p === '/') p = '/showcase/sets.html';
      let f = path.join(root, path.normalize(p));
      if (!fs.existsSync(f) && p.startsWith('/node_modules')) {
        f = path.join(REPO_ROOT, path.normalize(p));
      }
      fs.readFile(f, (e, d) => {
        if (e) {
          r.writeHead(404);
          return r.end();
        }
        r.writeHead(200, { 'content-type': mime[path.extname(f)] || 'application/octet-stream' });
        r.end(d);
      });
    });
    s.listen(0, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}/showcase/sets.html` }));
  });
}

const ARGS = [
  '--ignore-gpu-blocklist',
  '--enable-gpu-rasterization',
  '--font-render-hinting=medium',
  '--disable-dev-shm-usage'
];

async function launchBrowser() {
  const options = { args: ARGS };
  try {
    return await chromium.launch({ ...options, channel: 'chrome' });
  } catch {
    try {
      return await chromium.launch({ ...options, channel: 'msedge' });
    } catch {
      return await chromium.launch(options);
    }
  }
}

async function renderSetsShowcase() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const srv = await serve(BASE_DIR);
  console.log('[Sets Showcase] Starting Sets & Props Showcase render...');

  const br = await launchBrowser();
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto(srv.url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });

  const total = await p.evaluate(() => window.TOTAL || 18);
  const totalFrames = Math.round(total * FPS);
  console.log(`[Sets Showcase] Rendering ${totalFrames} frames (${total}s across 6 sets) @ 1080x1920 30fps...`);

  const showcaseMp4 = path.join(OUT_DIR, 'set-showcase.mp4');
  const ff = spawn(FFMPEG, [
    '-y', '-v', 'error',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-i', '-',
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'veryfast',
    '-crf', '18',
    showcaseMp4
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  const setBench = [];
  const setNames = ['Kitchen', 'Bedroom', 'Hallway', 'Park', 'Spooky House', 'Obby Course'];

  for (let sIdx = 0; sIdx < 6; sIdx++) {
    const sStartFrame = sIdx * 90;
    const sEndFrame = (sIdx + 1) * 90;
    const setT0 = Date.now();

    for (let f = sStartFrame; f < sEndFrame; f++) {
      const t = f / FPS;
      await p.evaluate(time => window.seek(time), t);
      const buf = await p.screenshot({ type: 'jpeg', quality: 90 });
      ff.stdin.write(buf);

      if (f % 30 === 0 || f === totalFrames - 1) {
        const el = ((Date.now() - t0) / 1000).toFixed(1);
        const fps = (f / (el || 1)).toFixed(1);
        process.stdout.write(`\r  Frame ${f + 1}/${totalFrames} (${((f / totalFrames) * 100).toFixed(1)}%) | ${el}s @ ${fps} fps`);
      }
    }

    const setDur = (Date.now() - setT0) / 1000;
    const setFps = (90 / setDur).toFixed(1);
    setBench.push({ name: setNames[sIdx], fps: setFps, time: setDur.toFixed(1) });
  }

  await new Promise(r => ff.stdin.end(r));
  await new Promise((res, rej) => {
    ff.on('close', code => (code === 0 ? res() : rej(new Error(`ffmpeg exited with code ${code}`))));
  });

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  const avgFps = (totalFrames / totalTime).toFixed(1);
  console.log(`\n[Sets Showcase] Video rendered -> ${showcaseMp4} in ${totalTime}s (${avgFps} fps)`);

  // Capture 12 representative stills (2 per set: t = s*3.0 + 0.8s, and t = s*3.0 + 2.2s)
  console.log('[Sets Showcase] Capturing 12 representative stills (2 per set)...');
  const stillTimes = [];
  for (let s = 0; s < 6; s++) {
    stillTimes.push(+(s * 3.0 + 0.8).toFixed(2));
    stillTimes.push(+(s * 3.0 + 2.2).toFixed(2));
  }

  const tmpDir = path.join(OUT_DIR, 'set_stills');
  fs.mkdirSync(tmpDir, { recursive: true });

  for (let i = 0; i < stillTimes.length; i++) {
    const t = stillTimes[i];
    await p.evaluate(time => window.seek(time), t);
    const stillPath = path.join(tmpDir, `t_${String(i + 1).padStart(2, '0')}.png`);
    await p.screenshot({ path: stillPath, type: 'png' });
  }

  await br.close();
  srv.server.close();

  // Compose Contact Sheet using sheet.py
  console.log('[Sets Showcase] Composing 12-frame contact sheet...');
  const sheetPng = path.join(OUT_DIR, 'set-showcase-sheet.png');
  const py = spawnSync('python', [path.join(BASE_DIR, 'sheet.py'), tmpDir, sheetPng, '4'], { encoding: 'utf8' });
  if (py.status === 0) {
    console.log(`[Sets Showcase] Contact sheet composed -> ${sheetPng}`);
  } else {
    console.warn(`[Sets Showcase] sheet.py output: ${py.stderr || py.stdout}`);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });

  console.log('\n--- Sets Benchmark Summary ---');
  console.log('Set Name         | Render Time | Throughput');
  console.log('-----------------+-------------+-----------');
  for (const b of setBench) {
    console.log(`${b.name.padEnd(16)} | ${b.time.padStart(9)}s | ${b.fps.padStart(8)} fps`);
  }
  console.log('-------------------------------------------');
  console.log(`Overall Average Throughput: ${avgFps} fps`);
  console.log('>>> SETS & PROPS SHOWCASE COMPLETE: All 6 environments rendered. <<<');
}

renderSetsShowcase().catch(err => {
  console.error('[Sets Showcase Error]', err);
  process.exit(1);
});

