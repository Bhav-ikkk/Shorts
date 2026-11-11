/**
 * Blocky Story Engine — Faces & Acting Showcase Runner
 * Renders the 12-scene Faces & Acting showcase film, captures stills, and composes contact sheet.
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
      if (p === '/') p = '/showcase/acting.html';
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
    s.listen(0, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}/showcase/acting.html` }));
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

async function renderActingShowcase() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const srv = await serve(BASE_DIR);
  console.log('[Acting Showcase] Starting Faces & Acting Showcase render...');

  const br = await launchBrowser();
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto(srv.url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });

  const total = await p.evaluate(() => window.TOTAL || 18);
  const totalFrames = Math.round(total * FPS);
  console.log(`[Acting Showcase] Rendering ${totalFrames} frames (${total}s) @ 1080x1920 30fps...`);

  const showcaseMp4 = path.join(OUT_DIR, 'acting-showcase.mp4');
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
  for (let f = 0; f < totalFrames; f++) {
    const t = f / FPS;
    await p.evaluate(time => window.seek(time), t);
    const buf = await p.screenshot({ type: 'jpeg', quality: 90 });
    ff.stdin.write(buf);

    if (f % 60 === 0 || f === totalFrames - 1) {
      const el = ((Date.now() - t0) / 1000).toFixed(1);
      const fps = (f / (el || 1)).toFixed(1);
      process.stdout.write(`\r  Frame ${f + 1}/${totalFrames} (${((f / totalFrames) * 100).toFixed(1)}%) | ${el}s @ ${fps} fps`);
    }
  }

  await new Promise(r => ff.stdin.end(r));
  await new Promise((res, rej) => {
    ff.on('close', code => (code === 0 ? res() : rej(new Error(`ffmpeg exited with code ${code}`))));
  });

  const totalTime = ((Date.now() - t0) / 1000).toFixed(1);
  const avgFps = (totalFrames / totalTime).toFixed(1);
  console.log(`\n[Acting Showcase] Video rendered -> ${showcaseMp4} in ${totalTime}s (${avgFps} fps)`);

  // Capture stills at midpoints of all 12 acting presets
  console.log('[Acting Showcase] Capturing 12 representative acting stills...');
  const stillTimes = [];
  for (let i = 0; i < 12; i++) {
    stillTimes.push(+(i * 1.5 + 0.75).toFixed(2));
  }

  const stillFiles = [];
  for (let i = 0; i < stillTimes.length; i++) {
    const t = stillTimes[i];
    await p.evaluate(time => window.seek(time), t);
    const stillPath = path.join(OUT_DIR, `acting_${i + 1}.png`);
    await p.screenshot({ path: stillPath, type: 'png' });
    stillFiles.push(stillPath);
  }

  await br.close();
  srv.server.close();

  // Compose Contact Sheet using sheet.py
  console.log('[Acting Showcase] Composing 12-preset contact sheet...');
  const sheetPng = path.join(OUT_DIR, 'acting-showcase-sheet.png');

  // Temporarily place stills in a dedicated dir or direct python script
  const tmpDir = path.join(OUT_DIR, 'acting_stills');
  fs.mkdirSync(tmpDir, { recursive: true });
  for (let i = 0; i < stillFiles.length; i++) {
    const target = path.join(tmpDir, `t_${String(i + 1).padStart(2, '0')}.png`);
    fs.copyFileSync(stillFiles[i], target);
  }

  const py = spawnSync('python', [path.join(BASE_DIR, 'sheet.py'), tmpDir, sheetPng, '4'], { encoding: 'utf8' });
  if (py.status === 0) {
    console.log(`[Acting Showcase] Contact sheet composed -> ${sheetPng}`);
  } else {
    console.warn(`[Acting Showcase] sheet.py output: ${py.stderr || py.stdout}`);
  }

  // Cleanup temporary folder
  fs.rmSync(tmpDir, { recursive: true, force: true });
  for (const sf of stillFiles) {
    if (fs.existsSync(sf)) fs.unlinkSync(sf);
  }

  console.log('>>> ACTING SHOWCASE COMPLETE: All 12 emotional/viseme states rendered. <<<');
}

renderActingShowcase().catch(err => {
  console.error('[Acting Showcase Error]', err);
  process.exit(1);
});
