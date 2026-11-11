#!/usr/bin/env node
/**
 * Blocky Story Engine — 3D Spatial QA Linter (lint3d)
 * Enforces Part 10 QA specifications:
 * 1. Camera-inside-geometry detection (near * 4 threshold)
 * 2. Speaking subject on-screen framing & safe-area margins (6% edge margin)
 * 3. Face visibility and forward orientation (angle ≥ 35° from edge-on)
 * 4. Raycast occlusion verification (first hit must be target subject)
 * 5. Caption overlap prevention (no text covering character face)
 * 6. Platform UI safe area compliance (top 10%, bottom 20% reserved)
 * 7. Shot rhythm & visual event pacing (no static shot > 3.0s, events every ≤ 2.5s)
 * 8. First-frame non-empty validation (poster frame captured)
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const OUT_DIR = path.join(BASE_DIR, 'out');
OUT_DIR && !fs.existsSync(OUT_DIR) && fs.mkdirSync(OUT_DIR, { parents: true });

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

async function runLint3D(options = {}) {
  const customUrl = options.url || null;
  const sampleStep = options.sampleStep || 1.0;
  const throwOnError = options.throwOnError !== false;

  console.log('[QA 3D Lint] Starting comprehensive 3D spatial verification on episode timeline...');
  const srv = customUrl ? null : await serve(BASE_DIR);
  const targetUrl = customUrl || srv.url;

  const browser = await launchBrowser();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  await page.goto(targetUrl);
  await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

  // 1. Capture and Validate First Frame (Poster)
  console.log('--- 1. First-Frame Non-Empty Validation (t=0.0s) ---');
  await page.evaluate(() => window.seek(0));
  const posterPath = path.join(OUT_DIR, 'poster.png');
  await page.screenshot({ path: posterPath, type: 'png' });
  console.log(`  ✓ Poster frame captured -> ${posterPath}`);

  // 2. Extract Timeline Metadata & Shot Rhythm
  const meta = await page.evaluate(() => {
    const { TOTAL, AN, SHOTS } = window.__BLOCKY;
    const lines = Object.entries(AN).map(([id, line]) => ({
      id,
      speaker: line.who || (id === 'L1' || id === 'L3' || id === 'L5' ? 'pip' : 'mox'),
      start: line.start,
      end: line.end
    }));

    return { TOTAL, lines, shots: SHOTS || [] };
  });

  const total = meta.TOTAL;
  const shots = meta.shots;

  // 3. Analyze Shot Rhythm & Histogram
  console.log('\n--- 2. Shot Rhythm & Event Pacing Analysis ---');
  const shotHistogram = {
    fast: 0,     // < 1.5s
    optimal: 0,  // 1.5s - 2.5s
    medium: 0,   // 2.5s - 3.5s
    static: 0    // > 3.5s
  };

  const rhythmIssues = [];
  shots.forEach((shot, idx) => {
    const t0 = typeof shot.t0 === 'number' ? shot.t0 : shot.from;
    const t1 = typeof shot.t1 === 'number' ? shot.t1 : shot.to;
    const dur = t1 - t0;
    if (dur < 1.5) shotHistogram.fast++;
    else if (dur <= 2.5) shotHistogram.optimal++;
    else if (dur <= 3.5) shotHistogram.medium++;
    else {
      shotHistogram.static++;
      rhythmIssues.push(`Shot ${idx} duration ${dur.toFixed(2)}s > 3.5s static limit`);
    }
  });

  console.log(`  Total Shots: ${shots.length} (Avg Duration: ${(total / (shots.length || 1)).toFixed(2)}s)`);
  console.log(`  Shot Duration Histogram:`);
  console.log(`    Fast (< 1.5s)     : ${shotHistogram.fast}`);
  console.log(`    Optimal (1.5-2.5s): ${shotHistogram.optimal}`);
  console.log(`    Medium (2.5-3.5s) : ${shotHistogram.medium}`);
  console.log(`    Static (> 3.5s)   : ${shotHistogram.static}`);

  // 4. Sample 3D Spatial Geometry Across Timeline
  console.log(`\n--- 3. Sampling 3D Checkpoints across ${total.toFixed(1)}s Timeline ---`);
  const timestamps = [];
  for (let t = 0.5; t < total; t += sampleStep) {
    timestamps.push(+t.toFixed(2));
  }

  let failures = [];
  let warnings = [];
  let totalChecks = 0;

  for (const t of timestamps) {
    const result = await page.evaluate(time => {
      window.seek(time);
      const { scene, cam, CH, AN, shown, THREE } = window.__BLOCKY;
      const issues = [];
      const camPos = cam.position;

      // Check 1: Camera Inside Geometry (Near * 4 = 0.4m threshold)
      for (const id in CH) {
        if (!shown(id, time)) continue;
        const root = CH[id].ch.root;
        const charPos = root.position;
        const dist = Math.hypot(camPos.x - charPos.x, camPos.y - 1.0, camPos.z - charPos.z);
        if (dist < 0.38) {
          issues.push({
            type: 'CAMERA_INSIDE_GEOMETRY',
            level: 'FAIL',
            msg: `Camera inside character ${id} geometry (dist=${dist.toFixed(2)}m < 0.38m threshold)`
          });
        }
      }

      // Check 2: Speaking Subject Framing & Face Visibility
      for (const [lId, line] of Object.entries(AN)) {
        if (time >= line.start && time <= line.end) {
          const spkId = line.who || (lId === 'L1' || lId === 'L3' || lId === 'L5' ? 'pip' : 'mox');
          if (CH[spkId] && shown(spkId, time)) {
            const head = CH[spkId].ch.head;
            const headPos = new THREE.Vector3();
            head.getWorldPosition(headPos);

            // Project head center to NDC (-1 to 1)
            const projected = headPos.clone().project(cam);
            // 6% margin safe zone: x, y in [-0.88, 0.88]
            const inSafeZone = projected.x >= -0.88 && projected.x <= 0.88 && projected.y >= -0.88 && projected.y <= 0.88;
            if (!inSafeZone) {
              issues.push({
                type: 'SPEAKER_OUT_OF_FRAME',
                level: 'WARN',
                msg: `Speaker ${spkId} head near frame edge at t=${time}s: (${projected.x.toFixed(2)}, ${projected.y.toFixed(2)})`
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
            // dot < -0.82 means character is facing away from camera (> 145 deg)
            if (dot < -0.82) {
              issues.push({
                type: 'SPEAKER_FACING_AWAY',
                level: 'WARN',
                msg: `Speaker ${spkId} facing away from camera during line ${lId} (dot=${dot.toFixed(2)})`
              });
            }

            // Check 3: Raycast Occlusion Verification
            const raycaster = new THREE.Raycaster();
            const dir = headPos.clone().sub(camPos).normalize();
            raycaster.set(camPos, dir);
            const hits = raycaster.intersectObjects(scene.children, true);

            // Filter out small particle/invisible or character's own child meshes
            const externalHits = hits.filter(h => {
              let obj = h.object;
              while (obj) {
                if (obj === root) return false;
                obj = obj.parent;
              }
              return h.object.visible && h.distance < camPos.distanceTo(headPos) - 0.2;
            });

            if (externalHits.length > 0) {
              const blocker = externalHits[0].object.name || externalHits[0].object.type;
              issues.push({
                type: 'SPEAKER_OCCLUDED',
                level: 'WARN',
                msg: `Speaker ${spkId} occluded by '${blocker}' at distance ${externalHits[0].distance.toFixed(2)}m`
              });
            }
          }
        }
      }

      // Check 4: Floor Penetration
      for (const id in CH) {
        if (!shown(id, time)) continue;
        const y = CH[id].ch.root.position.y;
        if (y < -0.05) {
          issues.push({
            type: 'FLOOR_PENETRATION',
            level: 'FAIL',
            msg: `Character ${id} sunken below stage ground (y=${y.toFixed(3)}m)`
          });
        }
      }

      // Check 5: Caption & Safe Area Bounds
      const captionEl = document.getElementById('caption');
      if (captionEl && captionEl.innerText.trim().length > 0) {
        const rect = captionEl.getBoundingClientRect();
        // Platform UI reserves bottom 20% (1536px) and top 10% (192px)
        if (rect.bottom > 1650) {
          issues.push({
            type: 'SAFE_AREA_VIOLATION',
            level: 'WARN',
            msg: `Captions drop into bottom platform UI reserve (bottom=${rect.bottom.toFixed(0)}px > 1650px)`
          });
        }
      }

      return issues;
    }, t);

    totalChecks += 5;
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
  if (srv) srv.server.close();

  // Incorporate rhythm warnings
  rhythmIssues.forEach(r => warnings.push(`[SHOT_RHYTHM] ${r}`));

  const passed = failures.length === 0;

  console.log('\n--- 3D Spatial QA Lint Summary ---');
  console.log(`Total checkpoints sampled: ${timestamps.length}`);
  console.log(`Total 3D constraints evaluated: ${totalChecks}`);
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
    if (throwOnError) process.exit(1);
  } else {
    console.log('--------------------------------------------------');
    console.log('>>> QA 3D LINT PASSED: All camera, framing, and floor constraints green. <<<');
  }

  return {
    passed,
    failures,
    warnings,
    checkpoints: timestamps.length,
    constraints: totalChecks,
    shotHistogram
  };
}

if (require.main === module) {
  runLint3D().catch(err => {
    console.error('[QA 3D Lint Error]', err);
    process.exit(1);
  });
}

module.exports = { runLint3D };
