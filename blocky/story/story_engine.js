#!/usr/bin/env node
/**
 * Blocky Story Engine — Master Story Coordinator
 * Manages series bibles, lints scripts, checks repetitiveness, verifies continuity,
 * and compiles director-ready production timelines.
 */

const fs = require('node:fs');
const path = require('node:path');
const { lintScript } = require('./script_lint');
const { checkRepetitiveness } = require('./repetitiveness');
const { estimateAnchors } = require('./estimate_anchors');
const { EpisodeCompiler } = require('../director/compile_episode');

const BASE_DIR = path.resolve(__dirname, '..');
const STORY_DIR = path.resolve(BASE_DIR, 'story');
const SERIES_DIR = path.resolve(BASE_DIR, 'series');

class StoryEngine {
  constructor(options = {}) {
    this.baseDir = options.baseDir || BASE_DIR;
    this.storyDir = options.storyDir || STORY_DIR;
    this.seriesDir = options.seriesDir || SERIES_DIR;

    this.cast = this.loadJSON(path.join(this.storyDir, 'cast.json'));
    this.world = this.loadJSON(path.join(this.storyDir, 'world.json'));
    this.continuity = this.loadJSON(path.join(this.storyDir, 'continuity.json'));

    this.compiler = new EpisodeCompiler({ baseDir: this.baseDir, cast: this.cast.cast || this.cast });
  }

  loadJSON(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`[StoryEngine] File not found: ${filePath}`);
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  findEpisodes(seriesName = null) {
    const episodes = [];
    if (!fs.existsSync(this.seriesDir)) return episodes;

    const seriesFolders = fs.readdirSync(this.seriesDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const s of seriesFolders) {
      if (seriesName && s !== seriesName) continue;
      const sPath = path.join(this.seriesDir, s);
      const epFolders = fs.readdirSync(sPath, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

      for (const ep of epFolders) {
        const epDir = path.join(sPath, ep);
        const scriptPath = path.join(epDir, 'script.json');
        const episodePath = path.join(epDir, 'episode.json');
        const reviewPath = path.join(epDir, 'review.md');

        if (fs.existsSync(scriptPath)) {
          episodes.push({
            series: s,
            slug: ep,
            dir: epDir,
            scriptPath,
            episodePath: fs.existsSync(episodePath) ? episodePath : null,
            reviewPath: fs.existsSync(reviewPath) ? reviewPath : null,
            script: JSON.parse(fs.readFileSync(scriptPath, 'utf8')),
            episode: fs.existsSync(episodePath) ? JSON.parse(fs.readFileSync(episodePath, 'utf8')) : null
          });
        }
      }
    }

    return episodes;
  }

  validateSeries(seriesName = null) {
    const episodes = this.findEpisodes(seriesName);
    if (episodes.length === 0) {
      return { pass: false, error: 'No episodes found to validate.' };
    }

    console.log(`\n========================================================`);
    console.log(`  BLOCKY STORY ENGINE: SERIES VALIDATION PIPELINE`);
    console.log(`  Found ${episodes.length} episode package(s)`);
    console.log(`========================================================\n`);

    const results = {
      episodes: [],
      lintResults: [],
      repetitiveness: null,
      compilations: [],
      pass: true
    };

    // 1. Script Linting
    console.log(`--- [1/3] Script Pacing, Word Limits & Trademark QA ---`);
    const scripts = [];
    for (const ep of episodes) {
      const lint = lintScript(ep.script, { cast: this.cast.cast || this.cast });
      results.lintResults.push({ id: ep.script.id, slug: ep.slug, ...lint });
      scripts.push(ep.script);

      const statusTag = lint.valid ? '[PASS]' : '[FAIL]';
      console.log(`${statusTag} ${ep.slug} (${ep.script.title})`);
      console.log(`       Lines: ${lint.stats.totalLines} | Words: ${lint.stats.totalWords} (avg ${lint.stats.avgWordsPerLine}/line) | Beats: ${lint.stats.beats.join(' -> ')}`);
      if (lint.warnings.length > 0) {
        lint.warnings.forEach(w => console.log(`       [WARN] ${w}`));
      }
      if (lint.errors.length > 0) {
        results.pass = false;
        lint.errors.forEach(e => console.log(`       [ERROR] ${e}`));
      }
    }

    // 2. Repetitiveness & Similarity Checks
    console.log(`\n--- [2/3] Anti-Repetitiveness & Similarity QA (Limit ≤ 0.25) ---`);
    const rep = checkRepetitiveness(scripts);
    results.repetitiveness = rep;
    rep.comparisons.forEach(c => {
      console.log(`[${c.status}] ${c.epA} vs ${c.epB}`);
      console.log(`       Jaccard: ${c.jaccard} (Limit: 0.25) | Trigram Overlap: ${(c.triOverlap * 100).toFixed(1)}%`);
      if (c.sharedWords.length > 0) {
        console.log(`       Shared non-stop words: ${c.sharedWords.join(', ')}`);
      }
    });
    if (!rep.pass) {
      results.pass = false;
      rep.errors.forEach(e => console.log(`       [ERROR] ${e}`));
    }
    if (rep.warnings.length > 0) {
      rep.warnings.forEach(w => console.log(`       [WARN] ${w}`));
    }

    // 3. Director Compilation Verification
    console.log(`\n--- [3/3] Director Staging & Timeline Compilation ---`);
    for (const ep of episodes) {
      if (!ep.episode) {
        console.log(`[SKIP] ${ep.slug} (No episode.json present)`);
        continue;
      }

      try {
        // Generate anchors via estimator if no real audio anchors file exists
        const syntheticAnchors = estimateAnchors(ep.episode.lines);
        const compiled = this.compiler.compile(ep.episode, syntheticAnchors);
        const epData = compiled.compiled;
        results.compilations.push({ slug: ep.slug, id: ep.episode.id, valid: true });
        console.log(`[PASS] ${ep.slug}: Compiled cleanly (${epData.shots.length} shots, ${epData.actions.length} actions, ${epData.faces.length} faces, ${epData.fx.length} fx)`);
      } catch (err) {
        results.pass = false;
        results.compilations.push({ slug: ep.slug, id: ep.episode.id, valid: false, error: err.message });
        console.log(`[FAIL] ${ep.slug}: Compilation failed:\n  ${err.message}`);
      }
    }

    console.log(`\n========================================================`);
    console.log(`  STORY ENGINE SUMMARY: ${results.pass ? 'ALL QA GATES PASSED (Ready for Production)' : 'QA FAILURES DETECTED'}`);
    console.log(`========================================================\n`);

    return results;
  }
}

// CLI Support
if (require.main === module) {
  try {
    const engine = new StoryEngine();
    const res = engine.validateSeries();
    process.exit(res.pass ? 0 : 1);
  } catch (err) {
    console.error('[StoryEngine Fatal]', err.message);
    process.exit(1);
  }
}

module.exports = { StoryEngine };
