/**
 * Blocky Story Engine — Pure Determinism Test
 * Validates that seek(t) is a pure function of time:
 * Renders identical frames across separate passes and asserts byte-identical SHA-256 hashes.
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..');

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
  } catch {
    try {
      return await chromium.launch({ ...options, channel: 'msedge' });
    } catch {
      return await chromium.launch(options);
    }
  }
}

async function capturePass(url, timestamps) {
  const b = await launchBrowser();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(url);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });

  const hashes = [];
  for (const t of timestamps) {
    await p.evaluate(time => window.seek(time), t);
    const buf = await p.screenshot({ type: 'png' });
    const hash = crypto.createHash('sha256').update(buf).digest('hex');
    hashes.push({ t, hash });
  }
  await b.close();
  return hashes;
}

async function runDeterminismTest() {
  console.log('[Determinism Test] Starting multi-pass frame hash verification...');
  const srv = await serve(BASE_DIR);
  const timestamps = [1.0, 3.5, 6.0, 12.0, 20.0, 30.0];

  console.log(`  -> Pass 1: Sampling ${timestamps.length} frame hashes...`);
  const pass1 = await capturePass(srv.url, timestamps);

  console.log(`  -> Pass 2: Re-sampling same ${timestamps.length} frame hashes in fresh browser context...`);
  const pass2 = await capturePass(srv.url, timestamps);

  srv.server.close();

  console.log('\n--- Determinism Results (SHA-256) ---');
  let allMatch = true;
  for (let i = 0; i < timestamps.length; i++) {
    const t = timestamps[i];
    const h1 = pass1[i].hash;
    const h2 = pass2[i].hash;
    const match = h1 === h2;
    console.log(`t=${t.toFixed(1)}s | Pass 1: ${h1.slice(0, 16)}... | Pass 2: ${h2.slice(0, 16)}... | ${match ? 'MATCH ✓' : 'DIFF ✗'}`);
    if (!match) allMatch = false;
  }

  console.log('------------------------------------');
  if (allMatch) {
    console.log('>>> DETERMINISM GATE PASSED: All frames are byte-identical across runs. <<<\n');
    return true;
  } else {
    throw new Error('Determinism Gate Failed: One or more frames had diverging SHA-256 hashes.');
  }
}

module.exports = { runDeterminismTest };

if (require.main === module) {
  runDeterminismTest().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
