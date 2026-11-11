/**
 * Blocky Story Engine — Action Showcase Runner
 * Renders the 12-action Rig v2 showcase film, captures stills, and generates contact sheet.
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
      if (p === '/') p = '/showcase/showcase.html';
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
    s.listen(0, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}/showcase/showcase.html` }));
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

async function renderShowcase() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const srv = await serve(BASE_DIR);
  console.log('[Showcase] Starting Rig v2 Action Showcase render...');

  const br = await launchBrowser();
  const p = await br.newPage({ viewport: { width: W, height: H } });
  await p.goto(srv.url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });

  const total = await p.evaluate(() => window.TOTAL || 18);
  const totalFrames = Math.round(total * FPS);
  console.log(`[Showcase] Rendering ${totalFrames} frames (${total}s) @ 1080x1920 30fps...`);

  const showcaseMp4 = path.join(OUT_DIR, 'action-showcase.mp4');
  const ff = spawn(FFMPEG, [
    '-y', '-v', 'error',
    '-f', 'image2pipe',
    '-framerate', String(FPS),
    '-c:v', 'mjpeg',
    '-i', '-',
    '-c:v', 'libx264',
    '-crf', '17',
    '-preset', 'veryfast',
    '-pix_fmt', 'yuv420p',
    '-r', String(FPS),
    '-g', '30',
    '-movflags', '+faststart',
    showcaseMp4
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const done = new Promise(r => ff.on('close', r));
  const t0 = Date.now();

  for (let i = 0; i < totalFrames; i++) {
    await p.evaluate(t => window.seek(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0 && i > 0) {
      const elapsed = (Date.now() - t0) / 1000;
      console.log(`  progress: ${i}/${totalFrames} frames (${(i / elapsed).toFixed(1)} fps)`);
    }
  }
  ff.stdin.end();
  await done;

  const wallSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[Showcase] Render complete in ${wallSec}s -> ${showcaseMp4}`);

  // Capture 12 action showcase stills
  console.log('[Showcase] Capturing 12 stills at midpoint of each action...');
  const actionMidpoints = [];
  for (let i = 0; i < 12; i++) {
    actionMidpoints.push(i * 1.5 + 0.75);
  }

  for (let i = 0; i < actionMidpoints.length; i++) {
    const t = actionMidpoints[i];
    await p.evaluate(time => window.seek(time), t);
    const stillPath = path.join(OUT_DIR, `action_${i + 1}.png`);
    await p.screenshot({ path: stillPath });
  }

  await br.close();
  srv.server.close();

  // Compose showcase contact sheet
  console.log('[Showcase] Composing contact sheet...');
  const sheetScript = path.join(BASE_DIR, 'sheet.py');
  const sheetPng = path.join(OUT_DIR, 'action-showcase-sheet.png');
  spawnSync('python', [
    '-c',
    `
import sys
from pathlib import Path
from PIL import Image, ImageDraw

out_dir = Path(r"${OUT_DIR.replace(/\\/g, '/')}")
files = [out_dir / f"action_{i}.png" for i in range(1, 13)]
w, h = 324, 576
cols = 4
rows = (len(files) + cols - 1) // cols
im = Image.new('RGB', (cols * w, rows * h), 'black')
labels = ['WALK', 'SNEAK', 'TIPTOE', 'RUN', 'CELEBRATE', 'DANCE', 'WAVE', 'SHRUG', 'FACEPALM', 'HANDS-HIPS', 'RECOIL', 'JUMP']

for i, f in enumerate(files):
    if f.exists():
        a = Image.open(f).convert('RGB').resize((w, h))
        ImageDraw.Draw(a).text((12, 12), f"{i+1}. {labels[i]}", fill='yellow')
        im.paste(a, ((i % cols) * w, (i // cols) * h))

out_path = out_dir / 'action-showcase-sheet.png'
im.save(str(out_path))
print(f"Showcase sheet saved -> {out_path}")
    `
  ], { stdio: 'inherit' });

  console.log(`[Showcase] Action showcase sheet ready -> ${sheetPng}`);
  return { showcaseMp4, sheetPng };
}

if (require.main === module) {
  renderShowcase().catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { renderShowcase };

