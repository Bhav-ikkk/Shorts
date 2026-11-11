/**
 * Blocky Story Engine — 40+ Props Validation Test
 * Asserts all 40 props instantiate without error, have valid geometries, and positive bounding volumes.
 */

import * as THREE from 'three';
import { PROPS_REGISTRY, spawnProp } from '../runtime/props.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const vocab = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'director', 'vocabulary.json'), 'utf8'));

async function testProps() {
  console.log('[Props Test] Validating 40+ primitive props library against vocabulary.json...');

  const vocabProps = vocab.props;
  console.log(`Registered in vocabulary: ${vocabProps.length} props`);
  console.log(`Implemented in runtime:   ${Object.keys(PROPS_REGISTRY).length} props`);

  let failures = 0;
  let count = 0;

  console.log('\n------------------------------------------------------------');
  for (const name of vocabProps) {
    count++;
    try {
      const prop = spawnProp(name, 1.0);
      if (!(prop instanceof THREE.Group)) {
        throw new Error(`spawnProp("${name}") did not return a THREE.Group`);
      }
      if (prop.children.length === 0) {
        throw new Error(`Prop "${name}" has 0 children meshes`);
      }

      // Compute bounding box
      const box = new THREE.Box3().setFromObject(prop);
      const size = new THREE.Vector3();
      box.getSize(size);
      const vol = size.x * size.y * size.z;

      if (vol <= 0 || isNaN(vol)) {
        throw new Error(`Prop "${name}" has invalid/zero volume (${vol})`);
      }

      const pName = name.padEnd(16);
      const pParts = String(prop.children.length).padStart(2);
      const pDim = `${size.x.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}m`;
      console.log(`✓ PASS [${String(count).padStart(2)}/40] | ${pName} | parts: ${pParts} | size: ${pDim.padEnd(14)} | OK`);
    } catch (err) {
      console.error(`✗ FAIL [${String(count).padStart(2)}/40] | ${name} | Error: ${err.message}`);
      failures++;
    }
  }
  console.log('------------------------------------------------------------');

  if (failures > 0) {
    console.error(`>>> PROPS TEST FAILED: ${failures} props failed validation. <<<`);
    process.exit(1);
  } else {
    console.log(`>>> PROPS TEST PASSED: All ${count} primitive props successfully validated. <<<`);
  }
}

testProps().catch(err => {
  console.error('[Props Test Error]', err);
  process.exit(1);
});
