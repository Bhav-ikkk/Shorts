// Blocky Story Engine — Runtime Kinetic Captions System
// Groups words into rhythmic chunks with active word zoom and color shift.

export function prepareCaptionChunks(anchors) {
  const words = [];
  for (const k in anchors) {
    anchors[k].words.forEach((w, i, arr) => {
      words.push({
        w: w[0],
        t0: anchors[k].start + w[1],
        t1: i + 1 < arr.length ? anchors[k].start + arr[i + 1][1] : anchors[k].end,
        line: k
      });
    });
  }

  const chunks = [];
  let cur = [];
  const flush = () => {
    if (cur.length) {
      chunks.push({ t0: cur[0].t0, t1: cur.at(-1).t1, ws: cur });
      cur = [];
    }
  };

  for (const w of words) {
    const ch = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= 3 || ch > 15 || cur[0].line !== w.line)) {
      flush();
    }
    cur.push(w);
    if (/[.!?]$/.test(w.w)) flush();
  }
  flush();

  chunks.forEach((c, i) => {
    c.end = i + 1 < chunks.length && chunks[i + 1].t0 < c.t1 + .4 ? chunks[i + 1].t0 : c.t1 + .22;
  });

  return chunks;
}

export function updateCaptions(capEl, chunks, t, state) {
  const ci = chunks.findIndex(c => t >= c.t0 - .03 && t < c.end);
  if (ci !== state.lastIndex) {
    state.lastIndex = ci;
    capEl.innerHTML = ci < 0 ? '' : chunks[ci].ws.map(w => `<span class="w">${w.w}</span>`).join(' ');
  }
  capEl.style.visibility = ci < 0 ? 'hidden' : 'visible';
  if (ci >= 0) {
    [...capEl.children].forEach((e, i) => {
      const w = chunks[ci].ws[i];
      e.className = 'w ' + (t >= w.t1 ? 'done' : t >= w.t0 - .02 ? 'on' : '');
    });
  }
}
