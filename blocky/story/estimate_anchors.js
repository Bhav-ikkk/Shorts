/**
 * Blocky Story Engine — Anchor Estimator
 * Generates synthetic speech & word timings for script animatics & pre-visualization.
 */

function cleanWord(w) {
  return w.replace(/[^\w']/g, '');
}

function estimateAnchors(lines, options = {}) {
  const wordsPerMinute = options.wordsPerMinute || 155;
  const leadIn = options.leadIn || 0.15;

  const anchors = {
    lines: {},
    total: 0
  };

  let currentTime = leadIn;

  lines.forEach((line, idx) => {
    const rawWords = (line.text || '').trim().split(/\s+/).filter(w => w.length > 0);
    const lineStart = +(currentTime).toFixed(3);

    const wordsData = [];
    let wordCursor = 0;

    rawWords.forEach((word) => {
      const clean = cleanWord(word);
      wordsData.push([clean, +(wordCursor).toFixed(3)]);

      // Estimate word duration by character length and syllable heuristic
      const len = Math.max(clean.length, 2);
      const estDur = Math.max(0.22, +(len * 0.055).toFixed(3));
      wordCursor += estDur;
    });

    const lineDuration = Math.max(0.8, wordCursor);
    const lineEnd = +(lineStart + lineDuration).toFixed(3);

    anchors.lines[line.id || `L${idx + 1}`] = {
      start: lineStart,
      end: lineEnd,
      words: wordsData,
      who: line.who,
      text: line.text
    };

    const pause = typeof line.pause === 'number' ? line.pause : 0.3;
    currentTime = lineEnd + pause;
  });

  anchors.total = +(currentTime + 0.5).toFixed(3);
  return anchors;
}

module.exports = { estimateAnchors };

