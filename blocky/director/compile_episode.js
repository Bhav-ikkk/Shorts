/**
 * Blocky Director — Data-Driven Episode Compiler
 * Validates episode.json against vocabulary.json, cast.json & anchors.json
 * Replaces hardcoded schedules with pure data-driven timelines.
 */

const fs = require('node:fs');
const path = require('node:path');

const ANCHOR_REGEX = /^(end|L\d+\.(?:start|end|word\(.+?\)))([+-]\d*\.?\d+)?$/;

function normalizeWord(s) {
  return s.toLowerCase().replace(/[^a-z0-9']/g, '');
}

class EpisodeCompiler {
  constructor(options = {}) {
    this.baseDir = options.baseDir || path.resolve(__dirname, '..');
    this.dataDir = path.join(this.baseDir, 'data');
    this.directorDir = path.join(this.baseDir, 'director');
    this.storyDir = path.join(this.baseDir, 'story');

    this.vocab = JSON.parse(fs.readFileSync(path.join(this.directorDir, 'vocabulary.json'), 'utf8'));
    this.cast = options.cast || this.loadCast();
  }

  loadCast() {
    const castPath = fs.existsSync(path.join(this.storyDir, 'cast.json'))
      ? path.join(this.storyDir, 'cast.json')
      : path.join(this.dataDir, 'cast.json');
    return JSON.parse(fs.readFileSync(castPath, 'utf8')).cast;
  }

  resolveAnchor(expr, anchors, total) {
    if (typeof expr === 'number') {
      throw new Error(`[Director Error] Raw numeric seconds forbidden: "${expr}". Must use an anchor expression like "L1.start+0.2".`);
    }
    if (typeof expr !== 'string') {
      throw new Error(`[Director Error] Invalid time expression type: ${typeof expr}`);
    }

    const match = ANCHOR_REGEX.exec(expr);
    if (!match) {
      throw new Error(`[Director Error] Malformed anchor expression: "${expr}". Expected pattern like "L3.start", "L2.end+0.1", "L4.word(Crumbs)", or "end-0.5".`);
    }

    let t;
    if (match[1] === 'end') {
      t = total;
    } else {
      const dotIdx = match[1].indexOf('.');
      const lineId = match[1].slice(0, dotIdx);
      const target = match[1].slice(dotIdx + 1);

      const line = anchors[lineId];
      if (!line) {
        throw new Error(`[Director Error] Anchor refers to non-existent line ID: "${lineId}" in expression "${expr}"`);
      }

      if (target === 'start') {
        t = line.start;
      } else if (target === 'end') {
        t = line.end;
      } else if (target.startsWith('word(') && target.endsWith(')')) {
        const wordName = target.slice(5, -1);
        const norm = normalizeWord(wordName);
        const found = line.words.find(w => normalizeWord(w[0]) === norm);
        if (!found) {
          const available = line.words.map(w => w[0]).join(', ');
          throw new Error(`[Director Error] Word "${wordName}" not found in line "${lineId}". Available words: [${available}]`);
        }
        t = line.start + found[1];
      } else {
        throw new Error(`[Director Error] Unknown anchor target "${target}" in expression "${expr}"`);
      }
    }

    const offset = match[2] ? parseFloat(match[2]) : 0;
    return +(t + offset).toFixed(3);
  }

  compile(episodeData, anchorsData) {
    const lines = anchorsData.lines;
    const total = anchorsData.total;
    const errors = [];
    const warnings = [];

    // 1. Validate Cast Members
    for (const line of episodeData.lines || []) {
      if (!this.cast[line.who]) {
        errors.push(`Line ${line.id}: Speaker "${line.who}" is not defined in cast.json`);
      }
    }

    // 2. Validate Actions against Vocabulary
    for (const act of episodeData.actions || []) {
      if (!this.vocab.actions.includes(act.do)) {
        errors.push(`Action "${act.do}" by ${act.who} is not in vocabulary.json actions list.`);
      }
      if (!this.cast[act.who]) {
        errors.push(`Action "${act.do}": Actor "${act.who}" is not in cast.json`);
      }
    }

    // 3. Resolve Staging Movements
    const resolvedStage = [];
    for (const s of episodeData.stage || []) {
      try {
        const t = this.resolveAnchor(s.t, lines, total);
        resolvedStage.push({ ...s, tResolved: t });
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 4. Resolve Actions Timelines
    const resolvedActions = [];
    for (const a of episodeData.actions || []) {
      try {
        const t0 = this.resolveAnchor(a.from, lines, total);
        const t1 = a.to ? this.resolveAnchor(a.to, lines, total) : +(t0 + (a.dur || 0.6)).toFixed(3);
        if (t1 <= t0) {
          warnings.push(`Action "${a.do}" for ${a.who} has non-positive duration (${t0} -> ${t1})`);
        }
        resolvedActions.push({ ...a, t0Resolved: t0, t1Resolved: t1 });
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 5. Resolve Camera Shots & Pacing
    const resolvedShots = [];
    let lastShotTime = 0;
    for (let i = 0; i < (episodeData.shots || []).length; i++) {
      const shot = episodeData.shots[i];
      try {
        const t0 = this.resolveAnchor(shot.from, lines, total);
        if (i > 0 && (t0 - lastShotTime) > 3.5) {
          warnings.push(`Pacing warning: Shot ${i} gap is ${(t0 - lastShotTime).toFixed(2)}s (> 3.5s). Consider a cut or punch-zoom to maintain retention.`);
        }
        lastShotTime = t0;
        resolvedShots.push({ ...shot, t0Resolved: t0 });
      } catch (err) {
        errors.push(err.message);
      }
    }

    // Sort shots and assign t1
    resolvedShots.sort((a, b) => a.t0Resolved - b.t0Resolved);
    for (let i = 0; i < resolvedShots.length; i++) {
      resolvedShots[i].t1Resolved = i + 1 < resolvedShots.length ? resolvedShots[i + 1].t0Resolved : total + 1;
    }

    // 6. Resolve Facial Expressions
    const resolvedFaces = [];
    for (const f of episodeData.faces || []) {
      try {
        const t0 = this.resolveAnchor(f.from, lines, total);
        const t1 = this.resolveAnchor(f.to, lines, total);
        resolvedFaces.push({ ...f, t0Resolved: t0, t1Resolved: t1 });
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 7. Resolve FX & SFX
    const resolvedFx = [];
    for (const f of episodeData.fx || []) {
      try {
        const t = this.resolveAnchor(f.at, lines, total);
        if (f.type === 'sfx' && !this.vocab.soundEffects.includes(f.name)) {
          warnings.push(`SFX "${f.name}" at ${f.at} not in standard vocabulary soundEffects`);
        }
        resolvedFx.push({ ...f, tResolved: t });
      } catch (err) {
        errors.push(err.message);
      }
    }

    // 8. Resolve Music Cues
    const resolvedMusic = [];
    for (const m of episodeData.music || []) {
      try {
        const t = this.resolveAnchor(m.at, lines, total);
        if (!this.vocab.musicPatterns.includes(m.pattern)) {
          errors.push(`Music pattern "${m.pattern}" is not in vocabulary.json musicPatterns`);
        }
        resolvedMusic.push({ ...m, tResolved: t });
      } catch (err) {
        errors.push(err.message);
      }
    }

    if (errors.length > 0) {
      const errHeader = `Director Compilation Failed with ${errors.length} error(s):\n`;
      throw new Error(errHeader + errors.map(e => `  - ${e}`).join('\n'));
    }

    return {
      id: episodeData.id,
      title: episodeData.title,
      episodeTag: episodeData.episodeTag || '',
      totalDuration: total,
      compiled: {
        stage: resolvedStage,
        actions: resolvedActions,
        shots: resolvedShots,
        faces: resolvedFaces,
        fx: resolvedFx,
        music: resolvedMusic,
        punch: (episodeData.punch || []).map(p => ({
          atResolved: this.resolveAnchor(p.at, lines, total),
          a: p.a
        })),
        props: (episodeData.props || []).map(p => ({
          who: p.who,
          name: p.name,
          t0Resolved: this.resolveAnchor(p.from, lines, total),
          t1Resolved: this.resolveAnchor(p.to, lines, total)
        })),
        show: episodeData.show || {}
      },
      warnings
    };
  }
}

function compileFile(episodeJsonPath, anchorsJsonPath, outputPath) {
  const compiler = new EpisodeCompiler();
  const ep = JSON.parse(fs.readFileSync(episodeJsonPath, 'utf8'));
  const an = JSON.parse(fs.readFileSync(anchorsJsonPath, 'utf8'));

  const result = compiler.compile(ep, an);
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`[Director] Compiled episode -> ${outputPath}`);
  }
  if (result.warnings.length) {
    console.log(`[Director Warnings] ${result.warnings.length} warning(s):`);
    result.warnings.forEach(w => console.log(`  * ${w}`));
  }
  return result;
}

module.exports = {
  EpisodeCompiler,
  compileFile
};

if (require.main === module) {
  const epFile = process.argv[2] || path.join(__dirname, '..', 'data', 'episode.json');
  const anFile = process.argv[3] || path.join(__dirname, '..', 'data', 'anchors.json');
  const outFile = process.argv[4] || path.join(__dirname, '..', 'data', 'compiled_episode.json');
  try {
    compileFile(epFile, anFile, outFile);
    console.log('[Director] Compilation successful! All anchors and vocabulary validated.');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
}

