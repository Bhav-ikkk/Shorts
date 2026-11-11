// Playwright stills at given times (uses an embedded static server). usage: node shots.js 1.0 2.5 ...   OUT=dir
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const dir = process.env.OUT || path.join(BASE_DIR, 'out');
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg'
};

function serve(root) {
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
  } catch (e1) {
    try {
      return await chromium.launch({ ...options, channel: 'msedge' });
    } catch (e2) {
      return await chromium.launch(options);
    }
  }
}

(async () => {
  const srv = await serve(BASE_DIR);
  const b = await launchBrowser();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await p.goto(srv.url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  await p.evaluate(() => window.ready);

  fs.mkdirSync(dir, { recursive: true });
  const rawTimestamps = process.argv.slice(2);
  const timestamps = rawTimestamps.length
    ? rawTimestamps.map(Number)
    : [1.0, 3.5, 6.0, 9.5, 12.0, 16.0, 20.0, 23.0, 27.0, 30.0, 33.0, 34.5];

  console.log(`[Shots] Capturing ${timestamps.length} frame stills...`);
  for (const t of timestamps) {
    await p.evaluate(t => window.seek(t), t);
    const shotPath = path.join(dir, `t_${t.toFixed(2)}.png`);
    await p.screenshot({ path: shotPath });
  }
  await b.close();
  srv.server.close();
  console.log(`[Shots] Saved ${timestamps.length} stills to ${dir}`);
})();
