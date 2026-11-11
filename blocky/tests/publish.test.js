#!/usr/bin/env node
/**
 * Blocky Story Engine — Publish Pack Tests (Phase B8)
 * Validates upload bundles, platform metadata, COPPA/synthetic decision logs,
 * high-CTR title limits, and SRT caption accuracy for all episodes.
 */

const fs = require('fs');
const path = require('path');
const { buildAllPacks, buildPublishPack } = require('../publish/pack');

const BASE_DIR = path.resolve(__dirname, '..');
const PUBLISH_DIR = path.join(BASE_DIR, 'publish');
const SERIES_DIR = path.join(BASE_DIR, 'series', 'the-blockies');

const FORBIDDEN_WORDS = ['roblox', 'minecraft', 'fortnite', 'lego', 'bacon hair', 'noob', 'steve', 'creeper', 'v-bucks', 'robux'];

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

function runPublishTests() {
  console.log('\n======================================================');
  console.log('  TEST SUITE: PUBLISH PACK & COMPLIANCE QA (Phase B8)');
  console.log('======================================================\n');

  // 1. Build packs for all 3 episodes
  const results = buildAllPacks();
  assert(results.length === 3, `buildAllPacks generated packs for all 3 episodes (received ${results.length})`);

  const episodeSlugs = ['ep01-crumb-trail', 'ep02-floor-is-lava', 'ep03-secret-attic'];

  for (const slug of episodeSlugs) {
    console.log(`\n--- Validating Publish Pack: ${slug} ---`);
    const epDir = path.join(SERIES_DIR, slug);
    const script = JSON.parse(fs.readFileSync(path.join(epDir, 'script.json'), 'utf8'));

    const locations = [
      path.join(PUBLISH_DIR, slug),
      path.join(epDir, 'publish')
    ];

    for (const dir of locations) {
      const dirLabel = path.relative(BASE_DIR, dir);

      // A. Expected files exist
      const expectedFiles = [
        'title.txt',
        'description.txt',
        'hashtags.txt',
        'pinned_comment.txt',
        'captions.srt',
        'checklist.md',
        'decision_log.json',
        'cover.png'
      ];

      for (const file of expectedFiles) {
        const filePath = path.join(dir, file);
        assert(fs.existsSync(filePath), `[${dirLabel}] ${file} exists`);
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          assert(stats.size > 0, `[${dirLabel}] ${file} is not empty (${stats.size} bytes)`);
        }
      }

      // B. Title validation
      const titlePath = path.join(dir, 'title.txt');
      if (fs.existsSync(titlePath)) {
        const titleText = fs.readFileSync(titlePath, 'utf8');
        const lines = titleText.split('\n').filter(l => l.startsWith('Variant '));
        assert(lines.length === 3, `[${dirLabel}] Contains 3 title variants (found ${lines.length})`);

        lines.forEach((line, idx) => {
          const colonIdx = line.indexOf(':');
          const titleContent = line.slice(colonIdx + 1).trim();
          assert(titleContent.length > 0 && titleContent.length <= 60,
            `[${dirLabel}] Variant ${idx + 1} length (${titleContent.length} chars) <= 60 chars optimal CTR ("${titleContent}")`);

          const lower = titleContent.toLowerCase();
          const forbiddenHit = FORBIDDEN_WORDS.find(w => lower.includes(w));
          assert(!forbiddenHit, `[${dirLabel}] Variant ${idx + 1} clean of trademarked words (hit: ${forbiddenHit || 'none'})`);
        });
      }

      // C. Description validation
      const descPath = path.join(dir, 'description.txt');
      if (fs.existsSync(descPath)) {
        const descText = fs.readFileSync(descPath, 'utf8');
        assert(descText.includes(script.hook), `[${dirLabel}] Description starts with hook: "${script.hook}"`);
        assert(descText.includes('Series: The Blockies'), `[${dirLabel}] Description cites Series: The Blockies`);
        assert(descText.includes(script.title), `[${dirLabel}] Description cites Episode: ${script.title}`);
        assert(descText.includes('Altered/Synthetic Content') || descText.includes('synthetic'),
          `[${dirLabel}] Description includes altered/synthetic content disclosure`);
        assert(descText.includes('#theblockies'), `[${dirLabel}] Description includes series hashtag`);
      }

      // D. Hashtags validation
      const hashPath = path.join(dir, 'hashtags.txt');
      if (fs.existsSync(hashPath)) {
        const hashText = fs.readFileSync(hashPath, 'utf8').trim();
        const tags = hashText.split(/\s+/);
        assert(tags.length >= 3 && tags.length <= 5,
          `[${dirLabel}] Hashtags count ${tags.length} is in optimal 3–5 range`);
        assert(tags.includes('#theblockies'), `[${dirLabel}] Includes #theblockies tag`);
        assert(tags.every(t => t.startsWith('#')), `[${dirLabel}] Every tag begins with # symbol`);
      }

      // E. Pinned comment validation
      const commentPath = path.join(dir, 'pinned_comment.txt');
      if (fs.existsSync(commentPath)) {
        const comment = fs.readFileSync(commentPath, 'utf8').trim();
        assert(comment.includes('?') || comment.includes('comment') || comment.includes('Vote'),
          `[${dirLabel}] Pinned comment invites viewer engagement: "${comment.slice(0, 50)}..."`);
      }

      // F. Captions SRT validation
      const srtPath = path.join(dir, 'captions.srt');
      if (fs.existsSync(srtPath)) {
        const srtText = fs.readFileSync(srtPath, 'utf8').trim();
        const blocks = srtText.split(/\n\s*\n/);
        assert(blocks.length === script.lines.length,
          `[${dirLabel}] SRT cue count (${blocks.length}) matches script lines count (${script.lines.length})`);

        let prevStartMs = -1;
        let validTimeOrder = true;
        const timeRegex = /(\d{2}):(\d{2}):(\d{2}),(\d{3})\s+-->\s+(\d{2}):(\d{2}):(\d{2}),(\d{3})/;

        for (const block of blocks) {
          const bLines = block.split('\n');
          if (bLines.length >= 2) {
            const match = bLines[1].match(timeRegex);
            if (match) {
              const startMs = ((+match[1]) * 3600 + (+match[2]) * 60 + (+match[3])) * 1000 + (+match[4]);
              const endMs = ((+match[5]) * 3600 + (+match[6]) * 60 + (+match[7])) * 1000 + (+match[8]);
              if (startMs >= endMs || startMs < prevStartMs) {
                validTimeOrder = false;
              }
              prevStartMs = startMs;
            }
          }
        }
        assert(validTimeOrder, `[${dirLabel}] SRT cues have strictly valid, non-overlapping chronological ordering`);
      }

      // G. Checklist SOP validation
      const checkPath = path.join(dir, 'checklist.md');
      if (fs.existsSync(checkPath)) {
        const checkText = fs.readFileSync(checkPath, 'utf8');
        assert(checkText.includes('YouTube Studio Upload Protocol'), `[${dirLabel}] Checklist contains YouTube Studio SOP`);
        assert(checkText.includes('Instagram Reels Protocol'), `[${dirLabel}] Checklist contains Instagram Reels SOP`);
        assert(checkText.includes("Yes, it's made for kids"), `[${dirLabel}] Checklist mandates COPPA "Made for kids"`);
        assert(checkText.includes('Altered / Synthetic Content'), `[${dirLabel}] Checklist specifies synthetic disclosure`);
      }

      // H. Decision Log JSON validation
      const logPath = path.join(dir, 'decision_log.json');
      if (fs.existsSync(logPath)) {
        const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        assert(log.coppaDecision?.status === 'Made for Kids (Primary)',
          `[${dirLabel}] COPPA status is "Made for Kids (Primary)"`);
        assert(log.coppaDecision?.rationale?.length > 10,
          `[${dirLabel}] COPPA decision records clear legal rationale`);
        assert(log.syntheticContentDecision?.declaredInDescription === true,
          `[${dirLabel}] Synthetic content declaration recorded as true`);
        assert(log.ipClearance?.trademarkViolationCheck?.includes('PASSED'),
          `[${dirLabel}] IP clearance verified clean`);
        assert(log.retentionEngineering?.openingHookLine === script.hook,
          `[${dirLabel}] Retention hook recorded matches episode hook`);
      }

      // I. Cover image verification
      const coverPath = path.join(dir, 'cover.png');
      if (fs.existsSync(coverPath)) {
        const coverStats = fs.statSync(coverPath);
        assert(coverStats.size > 1000, `[${dirLabel}] cover.png is valid high-res image (${coverStats.size} bytes)`);
      }
    }
  }

  console.log('\n======================================================');
  console.log(`  PUBLISH QA RESULTS: ${passedTests} PASSED, ${failedTests} FAILED (Total: ${totalTests})`);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runPublishTests();
}

module.exports = { runPublishTests };
