/**
 * Blocky Story Engine — 6 Sets & 4 Lighting Moods Validation Test
 * Instantiates all 6 procedural environments and asserts mesh counts, light setups, and zero errors.
 */

import * as THREE from 'three';
import { SETS_REGISTRY, buildSet } from '../runtime/world.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vocab = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'director', 'vocabulary.json'), 'utf8'));

async function testSets() {
  console.log('[Sets Test] Validating 6 procedural sets across 4 lighting moods...');

  const sets = vocab.sets;
  const moods = vocab.lightingMoods;

  let failures = 0;
  let count = 0;

  console.log('\n------------------------------------------------------------');
  for (const setName of sets) {
    for (const mood of moods) {
      count++;
      try {
        const scene = new THREE.Scene();
        const world = buildSet(setName, scene, mood);

        if (scene.children.length < 3) {
          throw new Error(`Set "${setName}" in mood "${mood}" generated too few objects (${scene.children.length})`);
        }

        // Count meshes and lights
        let meshes = 0;
        let lights = 0;
        scene.traverse(obj => {
          if (obj.isMesh) meshes++;
          if (obj.isLight) lights++;
        });

        if (meshes < 5) {
          throw new Error(`Set "${setName}" has insufficient mesh density (${meshes} meshes)`);
        }
        if (lights < 2) {
          throw new Error(`Set "${setName}" has insufficient lighting (${lights} lights)`);
        }

        const pSet = setName.padEnd(12);
        const pMood = mood.padEnd(7);
        console.log(`✓ PASS [${String(count).padStart(2)}/24] | Set: ${pSet} | Mood: ${pMood} | Meshes: ${String(meshes).padStart(3)} | Lights: ${lights} | OK`);
      } catch (err) {
        console.error(`✗ FAIL [${String(count).padStart(2)}/24] | Set: ${setName} | Mood: ${mood} | Error: ${err.message}`);
        failures++;
      }
    }
  }
  console.log('------------------------------------------------------------');

  if (failures > 0) {
    console.error(`>>> SETS TEST FAILED: ${failures} set/mood combinations failed. <<<`);
    process.exit(1);
  } else {
    console.log(`>>> SETS TEST PASSED: All 6 sets and 4 lighting moods validated (${count}/24 combinations). <<<`);
  }
}

testSets().catch(err => {
  console.error('[Sets Test Error]', err);
  process.exit(1);
});

