#!/usr/bin/env node
/**
 * Blocky Story Engine — Repetitiveness Linter
 * Ensures episodes do not trigger YouTube's inauthentic/repetitive content filters.
 * Computes vocabulary Jaccard similarity (limit ≤ 0.25) and N-gram overlap.
 */

const fs = require('node:fs');
const path = require('node:path');

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'else', 'when',
  'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'once',
  'here', 'there', 'all', 'any', 'both', 'each', 'few', 'more', 'most',
  'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so',
  'than', 'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should',
  'now', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you',
  'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself',
  'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them',
  'their', 'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this',
  'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing'
]);

function tokenize(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
}

function getVocabularySet(script) {
  const lines = script.lines || [];
  const tokens = [];
  lines.forEach(l => {
    tokens.push(...tokenize(l.text || ''));
  });
  return new Set(tokens);
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) intersectionCount++;
  }
  const unionCount = setA.size + setB.size - intersectionCount;
  return unionCount === 0 ? 0 : +(intersectionCount / unionCount).toFixed(3);
}

function extractNgrams(script, n = 3) {
  const lines = script.lines || [];
  const words = [];
  lines.forEach(l => {
    const rawWords = (l.text || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 0);
    words.push(...rawWords);
  });

  const ngrams = new Set();
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.add(words.slice(i, i + n).join(' '));
  }
  return ngrams;
}

function ngramOverlap(ngramsA, ngramsB) {
  if (ngramsA.size === 0 && ngramsB.size === 0) return 0;
  let overlap = 0;
  for (const gram of ngramsA) {
    if (ngramsB.has(gram)) overlap++;
  }
  const maxPossible = Math.max(ngramsA.size, ngramsB.size);
  return maxPossible === 0 ? 0 : +(overlap / maxPossible).toFixed(3);
}

function checkRepetitiveness(scripts, options = {}) {
  const maxJaccard = options.maxJaccard || 0.25;
  const maxNgramOverlap = options.maxNgramOverlap || 0.10;

  const errors = [];
  const warnings = [];
  const comparisons = [];

  const n = scripts.length;
  if (n < 2) {
    return {
      pass: true,
      errors: [],
      warnings: ['Need at least 2 scripts to compare repetitiveness.'],
      comparisons: []
    };
  }

  // Precompute vocabularies and n-grams
  const vocabs = scripts.map(s => getVocabularySet(s));
  const trigrams = scripts.map(s => extractNgrams(s, 3));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sA = scripts[i];
      const sB = scripts[j];
      const jaccard = jaccardSimilarity(vocabs[i], vocabs[j]);
      const triOverlap = ngramOverlap(trigrams[i], trigrams[j]);

      // Shared words
      const sharedWords = [];
      for (const w of vocabs[i]) {
        if (vocabs[j].has(w)) sharedWords.push(w);
      }

      const comp = {
        epA: sA.id || `Episode ${i + 1}`,
        epB: sB.id || `Episode ${j + 1}`,
        jaccard,
        triOverlap,
        sharedWords: sharedWords.slice(0, 10),
        status: jaccard <= maxJaccard ? 'PASS' : 'FAIL'
      };
      comparisons.push(comp);

      if (jaccard > maxJaccard) {
        errors.push(
          `Repetitiveness Violation: Episodes "${comp.epA}" and "${comp.epB}" have Jaccard similarity ${jaccard} > ${maxJaccard} limit. ` +
          `Shared vocabulary: [${sharedWords.join(', ')}]. Differentiate story content!`
        );
      } else if (jaccard > 0.20) {
        warnings.push(
          `Borderline similarity: "${comp.epA}" vs "${comp.epB}" Jaccard is ${jaccard} (threshold ${maxJaccard}).`
        );
      }

      if (triOverlap > maxNgramOverlap) {
        errors.push(
          `N-Gram Overlap Violation: "${comp.epA}" and "${comp.epB}" share ${triOverlap * 100}% of 3-grams (> ${(maxNgramOverlap * 100).toFixed(0)}% max).`
        );
      }

      // Check consecutive hook stem repetition
      if (j === i + 1) {
        const hookA = ((sA.lines && sA.lines[0]?.text) || sA.hook || '').trim().toLowerCase();
        const hookB = ((sB.lines && sB.lines[0]?.text) || sB.hook || '').trim().toLowerCase();
        const firstWordsA = hookA.split(/\s+/).slice(0, 2).join(' ');
        const firstWordsB = hookB.split(/\s+/).slice(0, 2).join(' ');
        if (firstWordsA && firstWordsA === firstWordsB) {
          warnings.push(
            `Consecutive Hook Repetition: Episode "${comp.epA}" and "${comp.epB}" start with similar words ("${firstWordsA}..."). Rotate hook openings!`
          );
        }
      }
    }
  }

  // Format diversity check
  const formats = new Set(scripts.map(s => s.format).filter(Boolean));
  if (n >= 3 && formats.size < 2) {
    warnings.push(`Low format diversity: All ${n} episodes use format "${Array.from(formats)[0]}". Rotate formats!`);
  }

  // Environment/Set diversity check
  const sets = new Set(scripts.map(s => s.set).filter(Boolean));
  if (n >= 3 && sets.size < 2) {
    warnings.push(`Low environment diversity: All ${n} episodes are set in "${Array.from(sets)[0]}". Rotate locations!`);
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    comparisons
  };
}

// CLI Support
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.log('Usage: node repetitiveness.js <script1.json> <script2.json> [script3.json ...]');
    process.exit(1);
  }

  const scripts = args.map(f => {
    if (!fs.existsSync(f)) {
      console.error(`File not found: ${f}`);
      process.exit(1);
    }
    return JSON.parse(fs.readFileSync(f, 'utf8'));
  });

  const res = checkRepetitiveness(scripts);
  console.log('\n=== REPETITIVENESS LINTER REPORT ===');
  console.log('Target: Pairwise Jaccard Similarity ≤ 0.25 (25%)');
  console.log('---------------------------------------------------------');
  res.comparisons.forEach(c => {
    console.log(`[${c.status}] ${c.epA}  vs  ${c.epB}`);
    console.log(`       Jaccard: ${c.jaccard} | Trigram Overlap: ${(c.triOverlap * 100).toFixed(1)}%`);
    if (c.sharedWords.length > 0) {
      console.log(`       Shared terms: ${c.sharedWords.join(', ')}`);
    }
  });

  if (res.warnings.length > 0) {
    console.log(`\nWarnings (${res.warnings.length}):`);
    res.warnings.forEach(w => console.log(`  [!] ${w}`));
  }

  if (res.errors.length > 0) {
    console.log(`\nErrors (${res.errors.length}):`);
    res.errors.forEach(e => console.log(`  [x] ${e}`));
    process.exit(1);
  } else {
    console.log('\nAll episodes demonstrate strong lexical, structural & visual diversity.');
  }
}

module.exports = { checkRepetitiveness, jaccardSimilarity, tokenize, getVocabularySet };

