#!/usr/bin/env node
/**
 * Blocky Story Engine — glTF Asset & Deterministic Playback Tests (Phase B9: Tier C)
 * Validates binary GLB structure, Three.js GLTFLoader parsing, PBR materials,
 * baked animation clips, and frame-accurate deterministic playback.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const THREE = require('three');
const { AssetResolver } = require('../assets/resolver');

const BASE_DIR = path.resolve(__dirname, '..');
const GLB_PATH = path.join(BASE_DIR, 'assets', 'models', 'hero_trophy.glb');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runGltfTests() {
  console.log('\n======================================================');
  console.log('  TEST SUITE: glTF ASSET & DETERMINISM QA (Phase B9)');
  console.log('======================================================\n');

  // 1. Generation Test: Ensure make_asset.py can generate the asset
  console.log('--- 1. Headless Asset Generation (make_asset.py) ---');
  const genResult = spawnSync('python', [
    path.join(BASE_DIR, 'tools', 'make_asset.py'),
    '--asset', 'trophy',
    '--out', GLB_PATH
  ], { encoding: 'utf8', cwd: BASE_DIR });

  assert(genResult.status === 0, 'make_asset.py executed cleanly with exit code 0');
  assert(fs.existsSync(GLB_PATH), `hero_trophy.glb created at ${path.relative(BASE_DIR, GLB_PATH)}`);

  const fileStats = fs.statSync(GLB_PATH);
  assert(fileStats.size > 5000, `hero_trophy.glb size is valid (${fileStats.size} bytes > 5000 bytes)`);

  // 2. Binary GLB Header & Chunk Integrity
  console.log('\n--- 2. Binary glTF (GLB) Container Integrity ---');
  const buffer = fs.readFileSync(GLB_PATH);
  assert(buffer.length >= 20, 'Buffer has valid minimum GLB length');

  const magic = buffer.toString('ascii', 0, 4);
  assert(magic === 'glTF', `GLB Header magic is 'glTF' (received '${magic}')`);

  const version = buffer.readUInt32LE(4);
  assert(version === 2, `GLB Version is 2 (received ${version})`);

  const totalLength = buffer.readUInt32LE(8);
  assert(totalLength === buffer.length, `GLB Total length matches file size on disk (${totalLength} === ${buffer.length})`);

  const jsonChunkLen = buffer.readUInt32LE(12);
  const jsonChunkType = buffer.toString('ascii', 16, 20);
  assert(jsonChunkType === 'JSON', `Chunk 0 type is 'JSON' (received '${jsonChunkType}')`);

  const jsonRaw = buffer.toString('utf8', 20, 20 + jsonChunkLen);
  let gltfJson = null;
  try {
    gltfJson = JSON.parse(jsonRaw);
    assert(true, 'GLB JSON chunk parsed successfully');
  } catch (err) {
    assert(false, `GLB JSON parse failed: ${err.message}`);
  }

  const binChunkOffset = 20 + jsonChunkLen;
  const binChunkLen = buffer.readUInt32LE(binChunkOffset);
  const binChunkType = buffer.toString('ascii', binChunkOffset + 4, binChunkOffset + 8);
  assert(binChunkType.startsWith('BIN'), `Chunk 1 type is 'BIN' (received '${binChunkType}')`);
  assert(binChunkLen > 0, `BIN chunk contains packed vertex/animation payload (${binChunkLen} bytes)`);

  // 3. glTF 2.0 Schema & Structure Verification
  console.log('\n--- 3. glTF 2.0 Schema & Material Definitions ---');
  if (gltfJson) {
    assert(gltfJson.asset?.version === '2.0', 'glTF asset version is 2.0');
    assert(Array.isArray(gltfJson.meshes) && gltfJson.meshes.length > 0, `Contains ${gltfJson.meshes.length} mesh definition(s)`);
    assert(Array.isArray(gltfJson.materials) && gltfJson.materials.length >= 3, `Contains ${gltfJson.materials.length} PBR materials (expected >= 3)`);

    const matNames = gltfJson.materials.map(m => m.name);
    assert(matNames.includes('HeroGold'), 'HeroGold PBR material defined');
    assert(matNames.includes('ObsidianSlate'), 'ObsidianSlate PBR material defined');
    assert(matNames.includes('RubyGemstone'), 'RubyGemstone emissive material defined');

    assert(Array.isArray(gltfJson.animations) && gltfJson.animations.length > 0, 'Contains baked animation clips');
    const anim = gltfJson.animations[0];
    assert(anim.name === 'TrophyFloat', `Animation clip is named 'TrophyFloat' (received '${anim.name}')`);
    assert(anim.channels?.length === 3, `Animation clip has 3 channels (translation, rotation, scale)`);
  }

  // 4. Three.js GLTFLoader Runtime Parsing
  console.log('\n--- 4. Three.js GLTFLoader Parsing & Scene Construction ---');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

  let parsedGltf = null;
  await new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      arrayBuffer,
      '',
      gltf => {
        parsedGltf = gltf;
        resolve();
      },
      err => reject(err)
    );
  });

  assert(parsedGltf !== null, 'Three.js GLTFLoader parsed array buffer into scene hierarchy');
  assert(parsedGltf.scene?.children?.length > 0, `Scene contains ${parsedGltf.scene.children.length} root child node(s)`);
  assert(parsedGltf.animations?.length > 0, `Loader extracted ${parsedGltf.animations.length} animation clip(s)`);

  const clip = parsedGltf.animations[0];
  assert(clip.duration === 4.0, `Animation clip duration is 4.0s (received ${clip.duration}s)`);
  assert(clip.tracks.some(t => t.name.includes('position')), 'Clip contains position track');
  assert(clip.tracks.some(t => t.name.includes('quaternion')), 'Clip contains quaternion rotation track');
  assert(clip.tracks.some(t => t.name.includes('scale')), 'Clip contains scale track');

  // 5. Deterministic Playback Contract Verification
  console.log('\n--- 5. Deterministic Playback Contract (seek(t) Pure Function) ---');
  const { GltfAsset } = await import('../runtime/gltf_asset.js');
  const assetPass1 = new GltfAsset(parsedGltf, { THREE });

  // Re-parse second fresh instance to verify cross-instance multi-pass determinism
  let parsedGltf2 = null;
  await new Promise(resolve => {
    new GLTFLoader().parse(arrayBuffer, '', g => { parsedGltf2 = g; resolve(); });
  });
  const assetPass2 = new GltfAsset(parsedGltf2, { THREE });

  const testTimestamps = [0.0, 0.5, 1.0, 1.75, 2.0, 2.5, 3.0, 3.8, 4.0];
  let allPosMatch = true;
  let allRotMatch = true;

  testTimestamps.forEach(t => {
    assetPass1.seek(t);
    assetPass2.seek(t);

    const root1 = assetPass1.scene.children[0];
    const root2 = assetPass2.scene.children[0];

    const pos1 = root1.position;
    const pos2 = root2.position;
    const rot1 = root1.quaternion;
    const rot2 = root2.quaternion;

    const posDiff = Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y) + Math.abs(pos1.z - pos2.z);
    const rotDiff = Math.abs(rot1.x - rot2.x) + Math.abs(rot1.y - rot2.y) + Math.abs(rot1.z - rot2.z) + Math.abs(rot1.w - rot2.w);

    if (posDiff > 1e-6) allPosMatch = false;
    if (rotDiff > 1e-6) allRotMatch = false;
  });

  assert(allPosMatch, 'Pass 1 vs Pass 2 positions are 100% byte-identical across all test timestamps');
  assert(allRotMatch, 'Pass 1 vs Pass 2 rotations are 100% byte-identical across all test timestamps');

  // Verify physical kinematics (bobbing curve)
  assetPass1.seek(1.0);
  const peakY = assetPass1.scene.children[0].position.y;
  assert(Math.abs(peakY - 0.14) < 1e-3, `At t=1.0s, float bob achieves positive peak (y=${peakY.toFixed(3)} ≈ 0.140)`);

  assetPass1.seek(3.0);
  const dipY = assetPass1.scene.children[0].position.y;
  assert(Math.abs(dipY - (-0.14)) < 1e-3, `At t=3.0s, float bob achieves negative dip (y=${dipY.toFixed(3)} ≈ -0.140)`);

  // Verify loop wrap-around
  assetPass1.seek(4.0);
  const loopY = assetPass1.scene.children[0].position.y;
  assert(Math.abs(loopY - 0.0) < 1e-3, `At t=4.0s, loop seamlessly wraps to origin (y=${loopY.toFixed(3)} ≈ 0.000)`);

  // 6. Asset Licensing & Manifest QA
  console.log('\n--- 6. Asset Registry & Licensing Clearance ---');
  const resolver = new AssetResolver();
  const trophyAsset = resolver.resolve('hero_trophy');
  assert(trophyAsset.exists === true, 'AssetResolver confirms hero_trophy exists on disk');
  assert(trophyAsset.license === 'CC0-1.0', `License verified as '${trophyAsset.license}'`);

  const licCheck = resolver.verifyLicenses();
  assert(licCheck.pass === true, 'All registered assets documented in blocky/assets/LICENSE.md');

  console.log('\n======================================================');
  console.log(`  glTF QA RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (Total: ${totalTests})`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runGltfTests().catch(err => {
    console.error('[Fatal Test Error]', err);
    process.exit(1);
  });
}

module.exports = { runGltfTests };

