#!/usr/bin/env node
/**
 * Blocky Story Engine — Script Linter
 * Enforces YouTube Shorts pacing, word limits, beat structure & trademark safety.
 */

const fs = require('node:fs');
const path = require('node:path');

const FORBIDDEN_WORDS = [
  'roblox', 'minecraft', 'blox', 'bloxy', 'robux',
  'fortnite', 'v-bucks', 'vbucks',
  'lego', 'minifigure',
  'bacon hair', 'noob skin', 'steve', 'creeper'
];

const VALID_BEATS = new Set([
  'hook',
  'setup',
  'escalation',
  'twist',
  'payoff',
  'reveal',
  'cliffhanger',
  'button'
]);

const DEFAULT_CAST_PATH = path.resolve(__dirname, 'cast.json');

function countWords(str) {
  if (!str || typeof str !== 'string') return 0;
  const cleaned = str.trim().replace(/[^\w\s'-]/g, ' ');
  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  return words.length;
}

function lintScript(scriptInput, options = {}) {
  const errors = [];
  const warnings = [];

  let script;
  if (typeof scriptInput === 'string') {
    if (!fs.existsSync(scriptInput)) {
      throw new Error(`[ScriptLint] Script file not found: ${scriptInput}`);
    }
    script = JSON.parse(fs.readFileSync(scriptInput, 'utf8'));
  } else if (typeof scriptInput === 'object' && scriptInput !== null) {
    script = scriptInput;
  } else {
    throw new Error(`[ScriptLint] Invalid scriptInput. Expected filepath or JSON object.`);
  }

  // Load Cast
  let cast = options.cast;
  if (!cast) {
    const castPath = options.castPath || DEFAULT_CAST_PATH;
    if (fs.existsSync(castPath)) {
      const castData = JSON.parse(fs.readFileSync(castPath, 'utf8'));
      cast = castData.cast || castData;
    } else {
      cast = {};
    }
  }

  // 1. Basic Metadata
  if (!script.id) errors.push('Missing required field: "id"');
  if (!script.title) errors.push('Missing required field: "title"');
  if (!Array.isArray(script.lines) || script.lines.length === 0) {
    errors.push('Missing or empty "lines" array.');
    return { valid: false, errors, warnings, stats: {} };
  }

  // 2. Line Length and Character Count Bounds
  const lines = script.lines;
  if (lines.length < 4) {
    warnings.push(`Script has only ${lines.length} lines. Minimum recommended for a 30s short is 5-7 lines.`);
  } else if (lines.length > 18) {
    warnings.push(`Script has ${lines.length} lines. Maximum recommended for a 45s short is 16 lines.`);
  }

  // 3. Trademark & Forbidden Words Scanner
  const fullTextToScan = [
    script.title || '',
    script.id || '',
    script.hook || '',
    ...lines.map(l => l.text || '')
  ].join(' ').toLowerCase();

  for (const forbidden of FORBIDDEN_WORDS) {
    const regex = new RegExp(`\\b${forbidden}\\b`, 'i');
    if (regex.test(fullTextToScan)) {
      errors.push(`CRITICAL IP VIOLATION: Forbidden trademark/copyright word "${forbidden}" found in script. Protect original IP.`);
    }
  }

  // 4. Line-by-line checks
  const beatSequence = [];
  const speakerCounts = {};
  let totalWords = 0;

  lines.forEach((line, idx) => {
    const lineId = line.id || `L${idx + 1}`;
    const isFinalLine = idx === lines.length - 1;

    // Check Speaker
    if (!line.who) {
      errors.push(`Line ${lineId}: Missing speaker "who".`);
    } else {
      speakerCounts[line.who] = (speakerCounts[line.who] || 0) + 1;
      if (Object.keys(cast).length > 0 && !cast[line.who]) {
        errors.push(`Line ${lineId}: Speaker "${line.who}" is not registered in cast.json.`);
      }
    }

    // Check Text & Word Count
    if (!line.text || typeof line.text !== 'string' || line.text.trim().length === 0) {
      errors.push(`Line ${lineId}: Dialogue text is empty.`);
    } else {
      const words = countWords(line.text);
      totalWords += words;

      const maxWords = isFinalLine ? 12 : 9;
      if (words > maxWords) {
        errors.push(`Line ${lineId}: Exceeds word limit (${words} words > ${maxWords} allowed). Rule: ≤ 9 words/line (≤ 12 for final tag line). Text: "${line.text}"`);
      }
    }

    // Check Beat Attribution
    const beat = (line.beat || line.role || '').toLowerCase();
    if (!beat) {
      warnings.push(`Line ${lineId}: No beat/role defined. Recommended beats: [hook, setup, escalation, twist, payoff, cliffhanger, button]`);
    } else {
      if (!VALID_BEATS.has(beat)) {
        errors.push(`Line ${lineId}: Invalid beat "${beat}". Must be one of: [${Array.from(VALID_BEATS).join(', ')}]`);
      } else {
        beatSequence.push(beat);
      }
    }

    // Check Pause bounds
    if (typeof line.pause === 'number') {
      if (line.pause < 0.1) {
        warnings.push(`Line ${lineId}: Pause ${line.pause}s is very short (< 0.1s). May cause rushed audio delivery.`);
      } else if (line.pause > 1.5) {
        warnings.push(`Line ${lineId}: Pause ${line.pause}s is too long (> 1.5s). May drop retention.`);
      }
    }
  });

  // 5. Beat Sheet Structure Verification
  if (beatSequence.length > 0) {
    if (beatSequence[0] !== 'hook') {
      errors.push(`Narrative Structure Error: First line beat must be "hook", found "${beatSequence[0]}". Shorts must hook in first 1.5s.`);
    }

    const hasSetup = beatSequence.includes('setup');
    const hasEscalation = beatSequence.includes('escalation');
    const hasTwist = beatSequence.includes('twist') || beatSequence.includes('reveal');
    const lastBeat = beatSequence[beatSequence.length - 1];
    const hasEnding = lastBeat === 'cliffhanger' || lastBeat === 'button' || lastBeat === 'payoff';

    if (!hasSetup) warnings.push('Missing "setup" beat in narrative arc.');
    if (!hasEscalation) warnings.push('Missing "escalation" beat in narrative arc.');
    if (!hasTwist) errors.push('Narrative Structure Error: Missing "twist" or "reveal" beat. Shorts require a twist or perspective shift.');
    if (!hasEnding) {
      warnings.push(`Final beat is "${lastBeat}". Recommended final beat: "cliffhanger" or "button".`);
    }
  }

  // 6. Dialogue Balance
  const totalLines = lines.length;
  for (const [speaker, count] of Object.entries(speakerCounts)) {
    const pct = (count / totalLines) * 100;
    if (totalLines >= 6 && pct > 75) {
      warnings.push(`Dialogue imbalance: Speaker "${speaker}" speaks ${pct.toFixed(0)}% of lines. Monologue risk.`);
    }
  }

  const stats = {
    totalLines,
    totalWords,
    avgWordsPerLine: +(totalWords / (totalLines || 1)).toFixed(1),
    speakerCounts,
    beats: beatSequence
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats
  };
}

// CLI Support
if (require.main === module) {
  const target = process.argv[2];
  if (!target) {
    console.log('Usage: node script_lint.js <path/to/script.json>');
    process.exit(1);
  }

  try {
    const res = lintScript(target);
    console.log(`\n=== SCRIPT LINT REPORT: ${target} ===`);
    console.log(`Status: ${res.valid ? 'PASSED' : 'FAILED'}`);
    console.log(`Total Lines: ${res.stats.totalLines} | Total Words: ${res.stats.totalWords} (Avg: ${res.stats.avgWordsPerLine} w/line)`);
    console.log(`Beats: ${res.stats.beats.join(' -> ')}`);
    console.log(`Speakers: ${JSON.stringify(res.stats.speakerCounts)}`);

    if (res.warnings.length > 0) {
      console.log(`\nWarnings (${res.warnings.length}):`);
      res.warnings.forEach(w => console.log(`  [!] ${w}`));
    }

    if (res.errors.length > 0) {
      console.log(`\nErrors (${res.errors.length}):`);
      res.errors.forEach(e => console.log(`  [x] ${e}`));
      process.exit(1);
    } else {
      console.log('\nAll QA script lint constraints satisfied.');
    }
  } catch (err) {
    console.error('[ScriptLint Fatal Error]', err.message);
    process.exit(1);
  }
}

module.exports = { lintScript, FORBIDDEN_WORDS, VALID_BEATS };
