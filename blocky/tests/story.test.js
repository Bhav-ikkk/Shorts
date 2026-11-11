/**
 * Blocky Story Engine — Test Suite
 * Validates script linting, anti-repetitiveness gating, continuity, and director compilation.
 */

const fs = require('node:fs');
const path = require('node:path');
const { lintScript } = require('../story/script_lint');
const { checkRepetitiveness, jaccardSimilarity, tokenize } = require('../story/repetitiveness');
const { StoryEngine } = require('../story/story_engine');

const BASE_DIR = path.resolve(__dirname, '..');

async function runStoryTests() {
  console.log('[Story Test] Initializing Phase B5 Story Engine test suite...');
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

  const engine = new StoryEngine({ baseDir: BASE_DIR });
  const episodes = engine.findEpisodes();

  // Test 1: Episode Discovery
  console.log('\n--- 1. Episode Discovery ---');
  assert(episodes.length >= 3, `Discovered at least 3 production episode packages (found ${episodes.length})`);
  const slugs = episodes.map(e => e.slug).sort();
  assert(slugs.includes('ep01-crumb-trail'), 'Found ep01-crumb-trail');
  assert(slugs.includes('ep02-floor-is-lava'), 'Found ep02-floor-is-lava');
  assert(slugs.includes('ep03-secret-attic'), 'Found ep03-secret-attic');
  if (slugs.includes('ep04-red-streetlamp')) {
    assert(true, 'Found ep04-red-streetlamp');
  }

  // Test 2: Script Linting on Valid Episodes
  console.log('\n--- 2. Script Linting on Production Episodes ---');
  for (const ep of episodes) {
    const res = lintScript(ep.script, { cast: engine.cast.cast });
    assert(res.valid === true, `Script ${ep.slug} passes all lint rules (0 errors)`);
    assert(res.stats.avgWordsPerLine <= 9, `Script ${ep.slug} average words/line (${res.stats.avgWordsPerLine}) <= 9`);
    assert(res.stats.beats[0] === 'hook', `Script ${ep.slug} starts with hook beat`);
  }

  // Test 3: Script Linting on Defective Fixture (Negative Testing)
  console.log('\n--- 3. Negative Testing: Catching Rule Violations ---');
  const defectiveScript = {
    id: 'defective-test-ep',
    title: 'Defective Roblox Episode',
    lines: [
      { id: 'L1', who: 'GUEST_999', text: 'Hey guys welcome back today we play roblox obby together right now!', beat: 'chat' },
      { id: 'L2', who: 'PIP', text: 'This line is way too long because it has more than nine words in a single sentence which violates the strict retention rule.', beat: 'setup' },
      { id: 'L3', who: 'PIP', text: 'A normal line.', beat: 'setup' }
    ]
  };

  const badRes = lintScript(defectiveScript, { cast: engine.cast.cast });
  assert(badRes.valid === false, 'Defective script correctly fails validation');
  assert(badRes.errors.some(e => e.includes('CRITICAL IP VIOLATION') && e.includes('roblox')), 'Detected forbidden trademark "roblox"');
  assert(badRes.errors.some(e => e.includes('Exceeds word limit')), 'Detected line exceeding word count limit');
  assert(badRes.errors.some(e => e.includes('GUEST_999')), 'Detected unregistered cast speaker GUEST_999');
  assert(badRes.errors.some(e => e.includes('First line beat must be "hook"')), 'Detected missing initial hook beat');

  // Test 4: Anti-Repetitiveness & Similarity
  console.log('\n--- 4. Anti-Repetitiveness & Lexical Diversity ---');
  const scripts = episodes.map(e => e.script);
  const rep = checkRepetitiveness(scripts);
  assert(rep.pass === true, 'All pairwise comparisons satisfy repetitiveness gate (pass === true)');

  for (const comp of rep.comparisons) {
    assert(comp.jaccard <= 0.25, `${comp.epA} vs ${comp.epB}: Jaccard ${comp.jaccard} <= 0.25 threshold`);
    assert(comp.triOverlap <= 0.10, `${comp.epA} vs ${comp.epB}: Trigram overlap ${(comp.triOverlap * 100).toFixed(1)}% <= 10%`);
  }

  // Negative Repetitiveness Test: Duplicate scripts must fail
  const clonedScript = JSON.parse(JSON.stringify(scripts[0]));
  clonedScript.id = 'cloned-crumb-trail';
  const duplicateRep = checkRepetitiveness([scripts[0], clonedScript]);
  assert(duplicateRep.pass === false, 'Duplicate script comparison correctly fails repetitiveness gate');

  // Test 5: Director Compilation & Continuity Integration
  console.log('\n--- 5. Director Timeline Compilation & World Consistency ---');
  const seriesValidation = engine.validateSeries();
  assert(seriesValidation.pass === true, 'Master series validation pipeline completed with 100% PASS');
  assert(seriesValidation.compilations.length === episodes.length, `Compiled all ${episodes.length} director timelines successfully`);

  // Verify World & Sets
  const worldSets = Object.keys(engine.world.sets);
  for (const ep of episodes) {
    assert(worldSets.includes(ep.script.set), `Episode ${ep.slug} set "${ep.script.set}" exists in world.json`);
    assert(fs.existsSync(ep.reviewPath), `Episode ${ep.slug} has human review & compliance sign-off document`);
  }

  console.log(`\n========================================================`);
  console.log(`  STORY TEST RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runStoryTests().catch(err => {
  console.error('[Story Test Error]', err);
  process.exit(1);
});

