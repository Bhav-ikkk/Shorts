// Deterministic parallel seek-render: N Chromium workers -> JPEG frames -> ffmpeg parts -> concat (-c copy). Windows-safe argv spawning.
const { chromium } = require('playwright');
const { spawn } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const http = require('http');

const FPS = 30, W = 1080, H = 1920;
const BASE_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const OUT = process.env.OUT || path.join(BASE_DIR, 'out');
const Q = +(process.env.Q || 92);

function resolveFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const staticPath = path.resolve(REPO_ROOT, 'node_modules', 'ffmpeg-static', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(staticPath)) return staticPath;
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
      if (p === '/') p = '/index.html';
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
    s.listen(0, '127.0.0.1', () => res({ server: s, url: `http://127.0.0.1:${s.address().port}/index.html` }));
  });
}

// Hardware-accelerated GPU flags for high-performance rendering (verified 12.5 fps on Intel HD Graphics vs 1.4 fps SwiftShader)
const ARGS = [
  '--ignore-gpu-blocklist',
  '--enable-gpu-rasterization',
  '--font-render-hinting=medium',
  '--disable-dev-shm-usage'
];

async function launchBrowser(opts = {}) {
  const launchOptions = {
    args: ARGS,
    ...opts
  };
  try {
    return await chromium.launch({ ...launchOptions, channel: 'chrome' });
  } catch (e1) {
    try {
      return await chromium.launch({ ...launchOptions, channel: 'msedge' });
    } catch (e2) {
      return await chromium.launch(launchOptions);
    }
  }
}

const run = (c, a) => new Promise((res, rej) => spawn(c, a, { stdio: 'inherit' }).on('close', k => k === 0 ? res() : rej(new Error(c + ' exit ' + k))));

async function range(url, a, b, w, total) {
  const fin = path.join(OUT, `part_${w}.mp4`);
  if (fs.existsSync(fin) && fs.statSync(fin).size > 10000) {
    console.log(`worker ${w}: part_${w}.mp4 already cached, skipping.`);
    return fin;
  }

  const br = await launchBrowser();
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.goto(url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  await p.evaluate(() => window.ready);

  const tmp = path.join(OUT, `part_${w}.tmp.mp4`);
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
    tmp
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const done = new Promise(r => ff.on('close', r));
  const t0 = Date.now();
  for (let i = a; i < b; i++) {
    await p.evaluate(t => window.seek(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: Q });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 30 === 0 && (i - a) > 0) {
      const elapsed = (Date.now() - t0) / 1000;
      console.log(`worker ${w}: ${i - a}/${b - a} (${((i - a + 1) / elapsed).toFixed(1)} fps)`);
    }
  }
  ff.stdin.end();
  const code = await done;
  await br.close();
  if (code) throw new Error('ffmpeg part ' + w);
  if (fs.existsSync(fin)) fs.unlinkSync(fin);
  fs.renameSync(tmp, fin);
  return fin;
}

async function runBench(url) {
  console.log('[Bench] Running 60-frame benchmark (1080x1920 @ 30 fps) with hardware acceleration...');
  const br = await launchBrowser();
  const p = await br.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await p.goto(url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  await p.evaluate(() => window.ready);

  const t0 = Date.now();
  let peakRss = process.memoryUsage().rss;
  for (let i = 0; i < 60; i++) {
    await p.evaluate(t => window.seek(t), i / FPS);
    await p.screenshot({ type: 'jpeg', quality: Q });
    const curRss = process.memoryUsage().rss;
    if (curRss > peakRss) peakRss = curRss;
  }
  const wallSec = (Date.now() - t0) / 1000;
  const fps = +(60 / wallSec).toFixed(2);
  await br.close();

  const cpus = os.cpus().length;
  const freeMemMB = Math.round(os.freemem() / (1024 * 1024));
  const totalMemMB = Math.round(os.totalmem() / (1024 * 1024));
  const peakRssMB = Math.round(peakRss / (1024 * 1024));
  // Workers rule: clamp(min(cpus - 1, floor(freeRAM_MB / 1100)), 1, 4)
  const recWorkers = Math.max(1, Math.min(4, Math.min(cpus - 1, Math.floor(freeMemMB / 1100))));

  const benchResult = {
    frames: 60,
    wallSec,
    fps,
    peakRssMB,
    system: {
      cpus,
      freeMemMB,
      totalMemMB
    },
    recommendedWorkers: recWorkers
  };

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'bench.json'), JSON.stringify(benchResult, null, 2));

  console.log('--------------------------------------------------');
  console.log(`[Bench] Completed: 60 frames in ${wallSec.toFixed(2)}s (${fps} fps)`);
  console.log(`[Bench] Peak Process RSS: ${peakRssMB} MB`);
  console.log(`[Bench] System: ${cpus} CPUs, ${freeMemMB} MB free / ${totalMemMB} MB total`);
  console.log(`[Bench] Recommended WORKERS: ${recWorkers}`);
  console.log('--------------------------------------------------');
  return benchResult;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const sv = await serve(BASE_DIR);
  const URL = sv.url;

  if (process.argv.includes('--bench')) {
    await runBench(URL);
    sv.server.close();
    process.exit(0);
  }

  // Pre-flight: read TOTAL and sound EVENTS from page
  const b0 = await launchBrowser();
  const p0 = await b0.newPage({ viewport: { width: W, height: H } });
  await p0.goto(URL);
  await p0.waitForFunction(() => window.ready, null, { timeout: 60000 });
  const total = await p0.evaluate(() => window.TOTAL);
  const events = await p0.evaluate(() => window.EVENTS);
  fs.writeFileSync(path.join(BASE_DIR, 'data', 'events.json'), JSON.stringify({ total, events }, null, 2));
  await b0.close();

  const cpus = os.cpus().length;
  // Use 2 workers with GPU acceleration for optimal throughput
  const autoWorkers = Math.max(1, Math.min(2, cpus - 1));
  const WORKERS = +(process.env.WORKERS || autoWorkers);

  const frames = Math.round(total * FPS);
  const per = Math.ceil(frames / WORKERS);
  const t0 = Date.now();
  console.log(`[Render] Starting render: ${frames} frames (${total.toFixed(2)}s) with ${WORKERS} workers...`);

  const jobs = [];
  for (let w = 0; w < WORKERS; w++) {
    const a = w * per, b = Math.min(frames, (w + 1) * per);
    if (a < b) jobs.push(range(URL, a, b, w, frames));
  }
  const parts = await Promise.all(jobs);

  const partsTxt = path.join(OUT, 'parts.txt');
  fs.writeFileSync(partsTxt, parts.map(p => `file '${path.basename(p)}'`).join('\n'));

  const silentTmp = path.join(OUT, 'silent.tmp.mp4');
  const silentFin = path.join(OUT, 'silent.mp4');
  await run(FFMPEG, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', partsTxt, '-c', 'copy', silentTmp]);
  if (fs.existsSync(silentFin)) fs.unlinkSync(silentFin);
  fs.renameSync(silentTmp, silentFin);

  const wallSec = (Date.now() - t0) / 1000;
  const avgFps = (frames / wallSec).toFixed(1);
  console.log(`[Render] DONE frames=${frames} workers=${WORKERS} wall=${wallSec.toFixed(1)}s avg=${avgFps}fps cpus=${cpus}`);

  sv.server.close();
  process.exit(0);
})().catch(err => {
  console.error('[Render Error]', err);
  process.exit(1);
});
