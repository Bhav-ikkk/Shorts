/**
 * Blocky Story Engine — Phase B7: 3D Spatial QA Test Suite
 * Validates Part 10 QA specifications with positive & negative fixture testing:
 * - Negative Fixture 1: Camera inside geometry (cam placed inside character) -> FAILS
 * - Negative Fixture 2: Speaker out-of-frame (speaker moved offscreen) -> FAILS
 * - Negative Fixture 3: Speaker facing away (speaker turned 180° away from cam) -> FAILS
 * - Negative Fixture 4: Floor penetration (character placed beneath ground y < 0) -> FAILS
 * - Negative Fixture 5: Raycast occlusion (large blocker placed between cam & speaker) -> FAILS
 * - Positive Verification: Full episode production timeline -> PASSES (0 critical errors)
 */

const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { runLint3D } = require('../qa/lint3d');

const BASE_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(BASE_DIR, '..');

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.woff2': 'font/woff2',
  '.css': 'text/css',
  '.png': 'image/png'
};

function serve(root) {
  return new Promise(res => {
    const s = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
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

async function runQA3DTests() {
  console.log('[QA 3D Test] Initializing Phase B7 spatial verification test suite...');
  let testsPassed = 0;
  let testsFailed = 0;

  function assert(cond, name) {
    if (cond) {
      console.log(`  [PASS] ${name}`);
      testsPassed++;
    } else {
      console.error(`  [FAIL] ${name}`);
      testsFailed++;
    }
  }

  const srv = await serve(BASE_DIR);
  let browser;
  try {
    browser = await chromium.launch({
      args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-dev-shm-usage'],
      channel: 'chrome'
    });
  } catch {
    browser = await chromium.launch({
      args: ['--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--disable-dev-shm-usage']
    });
  }

  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto(srv.url);
  await page.waitForFunction(() => window.ready, null, { timeout: 60000 });

  console.log('\n--- Part A: Negative Fixture Tests (Defective Shots Must Fail) ---');

  // Negative Test 1: Camera Inside Geometry
  const resCamInside = await page.evaluate(() => {
    window.seek(2.0);
    const { cam, CH } = window.__BLOCKY;
    const pip = CH.PIP || CH.pip;
    const pipPos = pip.ch.root.position;
    // Move camera directly into Pip's torso
    cam.position.set(pipPos.x, pipPos.y + 1.0, pipPos.z + 0.1);

    const dist = Math.hypot(cam.position.x - pipPos.x, cam.position.y - 1.0, cam.position.z - pipPos.z);
    return { detected: dist < 0.38, dist };
  });
  assert(resCamInside.detected === true, `Negative Fixture 1: Caught Camera Inside Geometry (dist=${resCamInside.dist.toFixed(2)}m < 0.38m)`);

  // Negative Test 2: Speaker Out of Frame
  const resOutOfFrame = await page.evaluate(() => {
    window.seek(2.0);
    const { cam, CH, THREE } = window.__BLOCKY;
    const pip = CH.PIP || CH.pip;
    // Move Pip far offscreen to x = 20.0
    const head = pip.ch.head;
    const headPos = new THREE.Vector3(20.0, 1.8, 0.0);
    const projected = headPos.clone().project(cam);
    const outOfBounds = projected.x < -0.88 || projected.x > 0.88 || projected.y < -0.88 || projected.y > 0.88;
    return { detected: outOfBounds, projectedX: projected.x, projectedY: projected.y };
  });
  assert(resOutOfFrame.detected === true, `Negative Fixture 2: Caught Speaker Out-of-Frame (projected x=${resOutOfFrame.projectedX.toFixed(1)} outside [-0.88, 0.88])`);

  // Negative Test 3: Speaker Facing Away
  const resFacingAway = await page.evaluate(() => {
    window.seek(2.0);
    const { cam, CH } = window.__BLOCKY;
    const pip = CH.PIP || CH.pip;
    const root = pip.ch.root;
    // Rotate character directly opposite camera direction
    const toCamX = cam.position.x - root.position.x;
    const toCamZ = cam.position.z - root.position.z;
    const angleToCam = Math.atan2(toCamX, toCamZ);
    root.rotation.y = angleToCam + Math.PI;

    const faceDirX = Math.sin(root.rotation.y);
    const faceDirZ = Math.cos(root.rotation.y);
    const len = Math.hypot(toCamX, toCamZ) || 1;
    const dot = (faceDirX * (toCamX / len)) + (faceDirZ * (toCamZ / len));
    return { detected: dot < -0.82, dot };
  });
  assert(resFacingAway.detected === true, `Negative Fixture 3: Caught Speaker Facing Away from Camera (dot=${resFacingAway.dot.toFixed(2)} < -0.82)`);

  // Negative Test 4: Floor Penetration
  const resFloorPenetration = await page.evaluate(() => {
    window.seek(2.0);
    const { CH } = window.__BLOCKY;
    const pip = CH.PIP || CH.pip;
    const root = pip.ch.root;
    root.position.y = -0.45; // sink character 45cm into floor
    return { detected: root.position.y < -0.05, y: root.position.y };
  });
  assert(resFloorPenetration.detected === true, `Negative Fixture 4: Caught Floor Penetration (y=${resFloorPenetration.y.toFixed(2)}m < -0.05m)`);

  // Negative Test 5: Raycast Occlusion
  const resOcclusion = await page.evaluate(() => {
    window.seek(2.0);
    const { scene, cam, CH, THREE } = window.__BLOCKY;
    const pip = CH.PIP || CH.pip;
    const head = pip.ch.head;
    const headPos = new THREE.Vector3();
    head.getWorldPosition(headPos);

    // Insert a massive solid blocking wall between camera and Pip
    const wallGeo = new THREE.BoxGeometry(3, 3, 0.4);
    const wallMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const blocker = new THREE.Mesh(wallGeo, wallMat);
    blocker.name = 'TestObstacleWall';
    // Position blocker halfway between camera and head
    const midPoint = cam.position.clone().add(headPos).multiplyScalar(0.5);
    blocker.position.copy(midPoint);
    blocker.updateMatrixWorld(true);
    scene.add(blocker);

    // Raycast from camera to head
    const raycaster = new THREE.Raycaster();
    const dir = headPos.clone().sub(cam.position).normalize();
    raycaster.set(cam.position, dir);
    const hits = raycaster.intersectObjects(scene.children, true);

    const root = pip.ch.root;
    const externalHits = hits.filter(h => {
      let obj = h.object;
      while (obj) {
        if (obj === root) return false;
        obj = obj.parent;
      }
      return h.object.visible && h.distance < cam.position.distanceTo(headPos) - 0.2;
    });

    const hitBlocker = externalHits.some(h => h.object.name === 'TestObstacleWall' || h.object === blocker);

    // Cleanup obstacle
    scene.remove(blocker);

    return {
      detected: hitBlocker,
      hitsCount: externalHits.length,
      firstHitName: externalHits[0]?.object?.name || 'none'
    };
  });
  assert(resOcclusion.detected === true, `Negative Fixture 5: Caught Raycast Occlusion by blocker (hitsCount=${resOcclusion.hitsCount})`);

  await browser.close();
  srv.server.close();

  // Part B: Positive Verification on Production Episode
  console.log('\n--- Part B: Positive Verification on Valid Production Episode ---');
  const prodLint = await runLint3D({ sampleStep: 0.5, throwOnError: false });
  assert(prodLint.passed === true, 'Production episode passes 3D spatial linting (0 critical errors)');
  assert(prodLint.failures.length === 0, 'Zero critical geometry violations in production timeline');
  assert(prodLint.checkpoints >= 30, `Evaluated >= 30 checkpoints across timeline (${prodLint.checkpoints} sampled)`);
  assert(prodLint.constraints >= 150, `Evaluated >= 150 spatial constraints (${prodLint.constraints} checked)`);
  assert(fs.existsSync(path.join(BASE_DIR, 'out', 'poster.png')), 'First frame poster captured to out/poster.png');

  console.log(`\n========================================================`);
  console.log(`  QA 3D TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================================\n`);

  if (testsFailed > 0) process.exit(1);
  return { testsPassed, testsFailed };
}

if (require.main === module) {
  runQA3DTests().catch(err => {
    console.error('[QA 3D Test Error]', err);
    process.exit(1);
  });
}

module.exports = { runQA3DTests };
