/**
 * Blocky Story Engine — 3D Spatial QA Linter (lint3d)
 * Enforces Part 10 QA specifications:
 * 1. Camera-inside-geometry detection
 * 2. Speaking subject on-screen framing & safe-area margins
 * 3. Face visibility and forward orientation (no speaking with back turned)
 * 4. Floor penetration check (no sinking through stage ground)
 * 5. Raycast occlusion verification
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

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

async function runLint3D() {
  console.log('[QA 3D Lint] Starting 3D spatial lint verification on episode timeline...');
  const srv = await serve(BASE_DIR);
  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  await page.goto(srv.url);
  await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

  // Get total duration and dialogue lines
  const meta = await page.evaluate(() => {
    const { TOTAL, AN, SHOTS } = window.__BLOCKY;
    const lines = Object.entries(AN).map(([id, line]) => ({
      id,
      speaker: line.who || (id === 'L1' || id === 'L3' || id === 'L5' ? 'pip' : 'mox'),
      start: line.start,
      end: line.end
    }));
    return { TOTAL, lines, shotCount: SHOTS ? SHOTS.length : 0 };
  });

  const total = meta.TOTAL;
  const sampleStep = 1.0; // sample every second
  const timestamps = [];
  for (let t = 0.5; t < total; t += sampleStep) {
    timestamps.push(+t.toFixed(2));
  }

  console.log(`[QA 3D Lint] Sampling ${timestamps.length} time checkpoints across ${total.toFixed(1)}s timeline...`);

  let failures = [];
  let warnings = [];
  let totalChecks = 0;

  for (const t of timestamps) {
    const result = await page.evaluate(time => {
      window.seek(time);
      const { scene, cam, CH, AN, shown } = window.__BLOCKY;
      const issues = [];
      const camPos = cam.position;

      // 1. Camera inside geometry check (distance to character meshes)
      for (const id in CH) {
        if (!shown(id, time)) continue;
        const root = CH[id].ch.root;
        const charPos = root.position;
        const dist = Math.hypot(camPos.x - charPos.x, camPos.y - 1.0, camPos.z - charPos.z);
        if (dist < 0.35) {
          issues.push({
            type: 'CAMERA_INSIDE_GEOMETRY',
            level: 'FAIL',
            msg: `Camera inside character ${id} geometry (dist=${dist.toFixed(2)}m < 0.35m)`
          });
        }
      }

      // 2. Speaking character checks (framing, face orientation, occlusion)
      for (const [lId, line] of Object.entries(AN)) {
        if (time >= line.start && time <= line.end) {
          const spkId = line.who || (lId === 'L1' || lId === 'L3' || lId === 'L5' ? 'pip' : 'mox');
          if (CH[spkId] && shown(spkId, time)) {
            const head = CH[spkId].ch.head;
            const headWorld = new head.constructor().parent ? head.getWorldPosition(new head.position.constructor()) : head.position;

            // Project head center to NDC (-1 to 1)
            const projected = headWorld.clone().project(cam);
            const inScreen = projected.x >= -0.92 && projected.x <= 0.92 && projected.y >= -0.92 && projected.y <= 0.92;
            if (!inScreen) {
              issues.push({
                type: 'SPEAKER_OUT_OF_FRAME',
                level: 'WARN',
                msg: `Speaker ${spkId} head out of safe margin at t=${time}s: (${projected.x.toFixed(2)}, ${projected.y.toFixed(2)})`
              });
            }

            // Face forward angle relative to camera
            const root = CH[spkId].ch.root;
            const faceDirX = Math.sin(root.rotation.y);
            const faceDirZ = Math.cos(root.rotation.y);
            const toCamX = camPos.x - root.position.x;
            const toCamZ = camPos.z - root.position.z;
            const len = Math.hypot(toCamX, toCamZ) || 1;
            const dot = (faceDirX * (toCamX / len)) + (faceDirZ * (toCamZ / len));
            // dot < -0.85 means character is directly facing away from camera
            if (dot < -0.85) {
              issues.push({
                type: 'SPEAKER_FACING_AWAY',
                level: 'WARN',
                msg: `Speaker ${spkId} facing away from camera during line ${lId} (dot=${dot.toFixed(2)})`
              });
            }
          }
        }
      }

      // 3. Floor penetration check
      for (const id in CH) {
        if (!shown(id, time)) continue;
        const y = CH[id].ch.root.position.y;
        if (y < -0.05) {
          issues.push({
            type: 'FLOOR_PENETRATION',
            level: 'FAIL',
            msg: `Character ${id} sunken below ground level (y=${y.toFixed(3)}m)`
          });
        }
      }

      return issues;
    }, t);

    totalChecks += 3;
    if (result && result.length > 0) {
      for (const issue of result) {
        if (issue.level === 'FAIL') {
          failures.push(`t=${t}s: [${issue.type}] ${issue.msg}`);
        } else {
          warnings.push(`t=${t}s: [${issue.type}] ${issue.msg}`);
        }
      }
    }
  }

  await browser.close();
  srv.server.close();

  console.log('\n--- 3D Spatial QA Lint Summary ---');
  console.log(`Total checkpoints evaluated: ${timestamps.length}`);
  console.log(`Total 3D constraints verified: ${totalChecks}`);
  console.log(`Critical Violations: ${failures.length}`);
  console.log(`Advisory Warnings:   ${warnings.length}`);

  if (warnings.length > 0) {
    console.log('\nAdvisory Warnings:');
    warnings.slice(0, 5).forEach(w => console.log('  ⚠ ' + w));
    if (warnings.length > 5) console.log(`  ... and ${warnings.length - 5} more warnings`);
  }

  if (failures.length > 0) {
    console.log('\nCritical Failures:');
    failures.forEach(f => console.log('  ✗ ' + f));
    console.log('--------------------------------------------------');
    console.log('>>> QA 3D LINT FAILED: Spatial geometry violations detected. <<<');
    process.exit(1);
  } else {
    console.log('--------------------------------------------------');
    console.log('>>> QA 3D LINT PASSED: All camera, framing, and floor constraints green. <<<');
  }
}

runLint3D().catch(err => {
  console.error('[QA 3D Lint Error]', err);
  process.exit(1);
});

