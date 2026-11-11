/**
 * Blocky Story Engine — Actions & Rig v2 Test Suite
 * Validates action registration, joint amplitudes, and physiological limits.
 */

const path = require('node:path');
const fs = require('node:fs');

async function runActionsTest() {
  console.log('[Actions Test] Validating Rig v2 actions and biomechanical constraints...');
  const charModule = await import('../runtime/char.js');
  const ACTIONS = charModule.ACTIONS;
  const J0 = charModule.J0();
  const vocabPath = path.join(__dirname, '..', 'director', 'vocabulary.json');
  const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

  const results = [];
  let allPass = true;

  console.log(`\nValidating ${vocab.actions.length} actions from vocabulary.json:`);
  console.log('------------------------------------------------------------');

  for (const name of vocab.actions) {
    if (typeof ACTIONS[name] !== 'function') {
      console.error(`✗ FAIL: Action "${name}" is registered in vocabulary.json but missing in ACTIONS`);
      allPass = false;
      continue;
    }

    // Evaluate action at t=0.5s with standard options
    const J = ACTIONS[name](0.5, { t0: 0, dur: 1.0, env: 0.8, amp: 1.0, k: 0.8 });

    // Compute joint displacement magnitude from rest pose
    let totalDelta = 0;
    for (const k in J0) {
      const val = typeof J[k] === 'number' ? J[k] : J0[k];
      totalDelta += Math.abs(val - J0[k]);
    }

    // Check physiological limits
    const checks = [];
    if (name !== 'idle' && totalDelta < 0.1) {
      checks.push(`Displacement too small (${totalDelta.toFixed(3)})`);
    }

    // Check knee flexion (knees should bend forward, not backward)
    if (J.lkl < -0.1 || J.lkr < -0.1) {
      checks.push('Knee hyperextension detected');
    }

    // Check squash & stretch bounds
    if (J.sq && (J.sq < -0.3 || J.sq > 0.3)) {
      checks.push(`Squash/stretch out of bounds: ${J.sq}`);
    }

    const passed = checks.length === 0;
    if (!passed) allPass = false;

    console.log(
      `${passed ? '✓ PASS' : '✗ FAIL'} | ${name.padEnd(14)} | delta: ${totalDelta.toFixed(3).padStart(5)} | ${checks.join(', ') || 'OK'}`
    );
  }

  console.log('------------------------------------------------------------');
  if (allPass) {
    console.log('>>> ACTIONS & RIG V2 TEST PASSED: All actions animated and physiologically compliant. <<<\n');
    return true;
  } else {
    throw new Error('Actions test failed with errors flagged above.');
  }
}

module.exports = { runActionsTest };

if (require.main === module) {
  runActionsTest().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
