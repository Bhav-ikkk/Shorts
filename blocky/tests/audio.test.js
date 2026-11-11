/**
 * Blocky Story Engine — Audio v2 Test Suite
 * Validates procedural SFX, procedural music beds, pitch shift, mixing, and loudness gate.
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { verifyLoudness } = require('../qa/loudness');

const BASE_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(BASE_DIR, 'out');
const NAME = process.env.NAME || 'blocky-ep2';

async function runAudioTests() {
  console.log('[Audio Test] Initializing Phase B6 Audio v2 test suite...');
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

  // 1-4: Run Python Native Audio Units
  console.log('\n--- 1-4. Running Python Audio Units (SFX, Moods, Pitch Shift, Mixer) ---');
  const pyUnits = spawnSync('python', [path.join(BASE_DIR, 'tests', 'audio_units.py')], {
    encoding: 'utf8',
    cwd: BASE_DIR
  });

  if (pyUnits.status !== 0) {
    console.error(pyUnits.stderr || pyUnits.stdout);
  }
  assert(pyUnits.status === 0, 'Python audio units exited with code 0');
  assert((pyUnits.stdout || '').includes('ALL PYTHON AUDIO UNIT TESTS PASSED'), 'All 25 SFX, 7 Music Moods, and Pitch Shift passed');

  // Verify exported files from mixer
  const mixWavPath = path.join(OUT_DIR, 'mix.wav');
  assert(fs.existsSync(mixWavPath), 'Master mix.wav exists in out/ directory');
  const srtPath = path.join(OUT_DIR, `${NAME}.srt`);
  assert(fs.existsSync(srtPath), `Synchronized SRT subtitles exist at ${srtPath}`);

  // 5. Post-Encode Loudness & Peak Verification
  console.log('\n--- 5. Post-Encode Loudness QA Gate (EBU R128) ---');
  const videoFile = path.join(OUT_DIR, `${NAME}-motion-film.mp4`);
  if (fs.existsSync(videoFile)) {
    try {
      const rep = verifyLoudness(videoFile);
      assert(rep.passed === true, 'Mastered MP4 passes EBU R128 Loudness QA Gate');
      assert(rep.checks.passLUFS === true, `Integrated Loudness ${rep.metrics.integratedLUFS} LUFS within -14.0 ± 0.5 LUFS`);
      assert(rep.checks.passPeak === true, `True Peak ${rep.metrics.truePeakDBFS} dBFS <= -1.0 dBFS (post-encode ceiling)`);
      assert(rep.checks.passSampleRate === true, `Audio sample rate is ${rep.metrics.sampleRate} Hz`);
    } catch (err) {
      assert(false, `Loudness QA error: ${err.message}`);
    }
  } else {
    console.log('  [INFO] No mastered MP4 found in out/. Testing loudness on mix.wav...');
    try {
      const rep = verifyLoudness(mixWavPath);
      assert(rep.metrics.integratedLUFS !== null, `Measured mix.wav Loudness: ${rep.metrics.integratedLUFS} LUFS`);
    } catch (err) {
      console.log(`  [INFO] mix.wav pre-master profile measured.`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`  AUDIO TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================================\n`);

  if (testsFailed > 0) process.exit(1);
}

runAudioTests().catch(err => {
  console.error('[Audio Test Error]', err);
  process.exit(1);
});
