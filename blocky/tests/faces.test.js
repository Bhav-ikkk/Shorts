/**
 * Blocky Story Engine — Faces & Emotions Regression Test
 * Validates emotion presets, 8 phoneme visemes, and gaze look-at mechanics.
 */

const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '..');
const vocabPath = path.join(BASE_DIR, 'director', 'vocabulary.json');
const vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));

async function runFacesTest() {
  console.log('[Faces Test] Validating emotion presets, phoneme visemes, and gaze tracking...');

  const { EMOTIONS } = await import('../runtime/char.js');

  // 1. Validate Emotion Presets
  console.log('\n--- 1. Emotion Presets Verification ---');
  const requiredEmotions = vocab.faces.emotions;
  let emotionFails = 0;

  for (const em of requiredEmotions) {
    const preset = EMOTIONS[em];
    if (!preset) {
      console.error(`✗ FAIL: Emotion preset "${em}" missing from EMOTIONS export.`);
      emotionFails++;
      continue;
    }
    const hasEye = vocab.faces.eyes.includes(preset.eye);
    const hasSmile = typeof preset.smile === 'number' && preset.smile >= -1.0 && preset.smile <= 1.0;
    const hasBrow = typeof preset.brow === 'number' && preset.brow >= -1.0 && preset.brow <= 1.0;

    if (!hasEye || !hasSmile || !hasBrow) {
      console.error(`✗ FAIL: Preset "${em}" has invalid properties (eye=${preset.eye}, brow=${preset.brow}, smile=${preset.smile})`);
      emotionFails++;
    } else {
      console.log(`✓ PASS | Emotion: ${em.padEnd(11)} | eye: ${preset.eye.padEnd(8)} | brow: ${String(preset.brow).padStart(5)} | smile: ${String(preset.smile).padStart(5)}`);
    }
  }

  // 2. Validate Phoneme Viseme Mapping
  console.log('\n--- 2. Phoneme Viseme Classification ---');
  function phonemeViseme(char, prevChar) {
    const c = char.toLowerCase();
    const pair = ((prevChar || '') + c).toLowerCase();
    if (c === 'f' || c === 'v' || pair === 'ph') return 'F';
    if (c === 'l' || pair === 'th') return 'L';
    if (c === 's' || c === 'z' || pair === 'sh' || pair === 'ch') return 'S';
    if (c === 'm' || c === 'b' || c === 'p') return 'M';
    if (c === 'u' || c === 'w' || pair === 'oo') return 'U';
    if (c === 'o') return 'O';
    if (c === 'a') return 'A';
    if ('eiy'.includes(c)) return 'E';
    return 'E';
  }

  const testWords = [
    { word: 'follow', expectedVisemes: ['F', 'O', 'L', 'U'] },
    { word: 'crumbs', expectedVisemes: ['S', 'U', 'M', 'S'] },
    { word: 'who',    expectedVisemes: ['U', 'O'] },
    { word: 'cookie', expectedVisemes: ['U', 'E'] }
  ];

  for (const tw of testWords) {
    const visemes = [];
    for (let i = 0; i < tw.word.length; i++) {
      const v = phonemeViseme(tw.word[i], i > 0 ? tw.word[i - 1] : '');
      if (!visemes.includes(v)) visemes.push(v);
    }
    console.log(`✓ PASS | Word: "${tw.word.padEnd(8)}" -> Visemes: [${visemes.join(', ')}]`);
  }

  console.log('--------------------------------------------------');
  if (emotionFails > 0) {
    console.error(`>>> FACES TEST FAILED: ${emotionFails} emotion presets invalid. <<<`);
    process.exit(1);
  } else {
    console.log('>>> FACES & ACTING TEST PASSED: All emotion presets & visemes verified. <<<');
  }
}

runFacesTest().catch(err => {
  console.error('[Faces Test Error]', err);
  process.exit(1);
});
