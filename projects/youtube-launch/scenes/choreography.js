gsap.ticker.lagSmoothing(0);
const $ = s => document.querySelector(s);
const AN = ANCH.lines, st = k => (AN[k] ? AN[k].start : 0), en = k => (AN[k] ? AN[k].end : 0);
const nrm = s => String(s).toLowerCase().replace(/[^a-z0-9%']/g, '');

const W = (k, w, fallbackFrac = 0.5) => {
  if (!AN[k] || !AN[k].words || AN[k].words.length === 0) return st(k);
  const f = AN[k].words.find(x => nrm(x[0]) === nrm(w));
  if (f) return AN[k].start + f[1];
  return AN[k].start + (AN[k].end - AN[k].start) * fallbackFrac;
};

const WI = (k, i) => {
  if (!AN[k] || !AN[k].words || AN[k].words.length === 0) return st(k);
  const idx = Math.min(Math.max(0, i), AN[k].words.length - 1);
  return AN[k].start + AN[k].words[idx][1];
};

const SS = k => (AN[k] && AN[k].segs ? AN[k].segs.filter(s => s[1] - s[0] >= 0.12) : []);
const SSo = (k, i) => { const s = SS(k); if (!s || s.length === 0) return 0.02; return (s[i] || s[s.length - 1])[0]; };
const SG = (k, i) => (AN[k] ? AN[k].start + SSo(k, i) : 0);

const lastK = Object.keys(AN).pop() || 'L13';
const TOTAL = +(en(lastK) + 1.2).toFixed(2);
window.TOTAL = TOTAL;
window.EVENTS = [];
const ev = (n, t, o) => window.EVENTS.push([n, +(+t).toFixed(3), o || {}]);

// Populate proof tiles dynamically
const tNorm = $('#tilesNormal'), tLP = $('#tilesLaunchPad');
if (tNorm && tLP) {
  for (let i = 1; i <= 20; i++) {
    const elA = document.createElement('div');
    elA.className = 'p-tile' + (i === 1 ? ' hit' : ' miss');
    elA.textContent = i === 1 ? '✓' : '✕';
    tNorm.appendChild(elA);

    const elB = document.createElement('div');
    elB.className = 'p-tile';
    elB.id = 'tileLP_' + i;
    elB.textContent = '·';
    tLP.appendChild(elB);
  }
}

// Master GSAP Timeline
const tl = gsap.timeline({ paused: true });

// Captions sync
Object.keys(AN).forEach(k => {
  const line = AN[k];
  tl.set('#capT', { textContent: line.text }, line.start);
  tl.set('#cap', { visibility: 'visible' }, line.start);
  tl.set('#cap', { visibility: 'hidden' }, line.end + 0.12);
});

// Initial scene states
gsap.set('#s1', { visibility: 'visible' });
gsap.set(['#s2', '#s3', '#s4', '#s5', '#s6'], { visibility: 'hidden' });
gsap.set(['#a1', '#a2'], { y: 140 });
gsap.set('#ytStudioCard', { opacity: 0, y: 40, scale: 0.95 });
gsap.set('#b1', { y: 140 });
gsap.set('#didnt', { opacity: 0, scale: 0.7 });
gsap.set('#cardZero', { opacity: 0, y: 50, scale: 0.92 });

// ==================== BEAT 1: HOOK (L1, L2) ====================
// L1: "Everything said: ready to blow up."
tl.to('#a1', { y: 0, duration: 0.45, ease: 'power3.out' }, st('L1') - 0.05);
tl.to('#a2', { y: 0, duration: 0.45, ease: 'power3.out' }, W('L1', 'ready') - 0.1);
tl.to('#ytStudioCard', { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.2)' }, W('L1', 'ready'));
ev('pop', W('L1', 'ready'));

// L2: "But nobody clicked."
tl.to('#b1', { y: 0, duration: 0.4, ease: 'power3.out' }, st('L2') - 0.05);
tl.to('#didnt', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.8)' }, W('L2', 'clicked') - 0.08);
tl.to('#cardZero', { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'power3.out' }, W('L2', 'clicked'));
ev('thud', st('L2'), { a: 0.5 });
ev('impact', W('L2', 'clicked'));

// Wipe 1: S1 -> S2
const w1Start = en('L2') + 0.15;
ev('whoosh', w1Start, { a: 0.6 });
tl.fromTo('#w1', { x: 1920 }, { x: -1920, duration: 0.65, ease: 'power2.inOut' }, w1Start);
tl.set('#s1', { visibility: 'hidden' }, w1Start + 0.32);
tl.set('#s2', { visibility: 'visible' }, w1Start + 0.32);

// ==================== BEAT 2: PAIN (L3) ====================
// L3: "The title was cut off. The hook was buried."
gsap.set('#h2Pain', { opacity: 0, y: 30 });
gsap.set('#ytFeedMock', { opacity: 0, scale: 0.94, y: 30 });

tl.to('#h2Pain', { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, st('L3') - 0.05);
tl.to('#ytFeedMock', { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'power3.out' }, st('L3') + 0.1);

ev('click', W('L3', 'cut'));
tl.to('.cutoff-flag', { scale: 1.15, yoyo: true, repeat: 1, duration: 0.25 }, W('L3', 'cut'));

tl.to('#occludeBox', { opacity: 1, duration: 0.3, ease: 'power2.out' }, W('L3', 'buried') - 0.1);
tl.to('#occludeTag', { opacity: 1, x: -10, duration: 0.35, ease: 'back.out(1.5)' }, W('L3', 'buried'));
ev('thud', W('L3', 'buried'), { a: 0.5 });

// Wipe 2: S2 -> S3
const w2Start = en('L3') + 0.35;
ev('whoosh', w2Start, { a: 0.6 });
tl.fromTo('#w2', { x: 1920 }, { x: -1920, duration: 0.65, ease: 'power2.inOut' }, w2Start);
tl.set('#s2', { visibility: 'hidden' }, w2Start + 0.32);
tl.set('#s3', { visibility: 'visible' }, w2Start + 0.32);

// ==================== BEAT 3: CONTRAST (L4, L5) ====================
// L4: "Normal checks just read file formats and tags."
gsap.set('#h3Left', { opacity: 0, y: 20 });
gsap.set('#h3Right', { opacity: 0, y: 20 });
gsap.set(['#cardNormal', '#cardViewer'], { opacity: 0, y: 40 });

tl.to('#h3Left', { opacity: 1, y: 0, duration: 0.4 }, st('L4') - 0.05);
tl.to('#cardNormal', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, st('L4') + 0.1);
ev('tap', st('L4') + 0.1);

// L5: "They never see what viewers see."
tl.to('#h3Right', { opacity: 1, y: 0, duration: 0.4 }, st('L5') - 0.05);
tl.to('#cardViewer', { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, st('L5') + 0.1);
ev('swell', st('L5') + 0.1, { d: 0.8 });

// Animate reticle scanning
tl.fromTo('#reticle', { x: -80, y: -40 }, { x: 40, y: 20, duration: 1.2, ease: 'power1.inOut' }, W('L5', 'viewers') - 0.2);

// Wipe 3: S3 -> S4
const w3Start = en('L5') + 0.35;
ev('whoosh', w3Start, { a: 0.6 });
tl.fromTo('#w3', { x: 1920 }, { x: -1920, duration: 0.65, ease: 'power2.inOut' }, w3Start);
tl.set('#s3', { visibility: 'hidden' }, w3Start + 0.32);
tl.set('#s4', { visibility: 'visible' }, w3Start + 0.32);

// ==================== BEAT 4: MECHANISM & DUAL CHECK (L6, L7, L8, L9) ====================
// L6: "YouTube LaunchPad watches the first five seconds, like a viewer."
// L7: "Say a rule: the thumbnail hook must always be visible."
gsap.set('#h4Step1', { opacity: 0, y: 20 });
gsap.set('#h4Step2', { opacity: 0, y: 20 });
gsap.set('#ruleCard', { opacity: 0, x: -40 });
gsap.set('#telemetryPanel', { opacity: 0, x: 40 });
gsap.set('#agreeBadge', { opacity: 0, scale: 0.9 });
gsap.set('#verdictBanner', { opacity: 0, scale: 0.95 });

tl.to('#h4Step1', { opacity: 1, y: 0, duration: 0.4 }, st('L7') - 0.05);
tl.to('#ruleCard', { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, st('L7') + 0.1);
ev('pop', st('L7') + 0.1);

// L8: "Two independent neural models score retention. Both must agree."
tl.to('#h4Step2', { opacity: 1, y: 0, duration: 0.4 }, st('L8') - 0.05);
tl.to('#telemetryPanel', { opacity: 1, x: 0, duration: 0.5, ease: 'power3.out' }, st('L8') + 0.1);
ev('tap', st('L8') + 0.1);

tl.to('#agreeBadge', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.4)' }, W('L8', 'agree') - 0.1);
ev('chime', W('L8', 'agree'));

// L9: "Nine point six percent CTR drop. Rejected, with proof."
const gObj = { val: 0.0 };
tl.to(gObj, {
  val: 9.6,
  duration: 1.1,
  ease: 'power2.out',
  onUpdate: () => {
    $('#gaugeVal').textContent = gObj.val.toFixed(1);
    $('#gwFill').style.width = (gObj.val / 12 * 100) + '%';
  }
}, st('L9'));
ev('impact', st('L9') + 0.2);

tl.to('#verdictBanner', { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(1.5)' }, W('L9', 'rejected') - 0.08);
ev('thud', W('L9', 'rejected'), { a: 0.6 });

// ==================== BEAT 5A: FIX & APPROVAL (L10) ====================
// L10: "Fix the crop. Test again. Zero drop. Approved."
ev('click', W('L10', 'fix'));

// Re-scoring: Drop back to 0.0%
tl.to(gObj, {
  val: 0.0,
  duration: 1.0,
  ease: 'power3.out',
  onUpdate: () => {
    $('#gaugeVal').textContent = gObj.val.toFixed(1);
    $('#gwFill').style.width = (gObj.val / 12 * 100) + '%';
  }
}, W('L10', 'zero') - 0.2);
ev('swell', W('L10', 'zero'), { down: true });

// Verdict flips to Approved
tl.call(() => {
  const vb = $('#verdictBanner');
  if (vb) {
    vb.textContent = 'APPROVED · 0.0% CTR DROP';
    vb.className = 'verdict-appr';
  }
}, null, W('L10', 'approved'));
ev('chime', W('L10', 'approved'));

// Wipe 4: S4 -> S5 (Dark mode proof arena)
const w4Start = en('L10') + 0.35;
ev('whoosh', w4Start, { a: 0.7 });
tl.fromTo('#w4', { x: 1920 }, { x: -1920, duration: 0.65, ease: 'power2.inOut' }, w4Start);
tl.set('#s4', { visibility: 'hidden' }, w4Start + 0.32);
tl.set('#s5', { visibility: 'visible' }, w4Start + 0.32);

// ==================== BEAT 5B: AGGREGATE PROOF (L11) ====================
// L11: "Twenty creator uploads. Normal checks caught one. LaunchPad caught all twenty."
gsap.set('#h5Head', { opacity: 0, y: 20 });
gsap.set(['#rowNormal', '#rowLaunchPad'], { opacity: 0, y: 30 });

tl.to('#h5Head', { opacity: 1, y: 0, duration: 0.4 }, st('L11') - 0.05);
tl.to('#rowNormal', { opacity: 1, y: 0, duration: 0.4 }, st('L11') + 0.15);
tl.to('#rowLaunchPad', { opacity: 1, y: 0, duration: 0.4 }, W('L11', 'launchpad', 0.45) - 0.1);

// Cascade 20 LaunchPad tiles
const cascadeStart = W('L11', 'twenty', 0.62);
ev('ticks', cascadeStart, { n: 20, dt: 0.07, a: 0.12 });

const counterObj = { count: 0 };
tl.to(counterObj, {
  count: 20,
  duration: 1.4,
  ease: 'power1.out',
  onUpdate: () => {
    const val = Math.floor(counterObj.count);
    const numEl = $('#statLPNum');
    if (numEl) numEl.textContent = val;
    for (let i = 1; i <= val; i++) {
      const tile = $('#tileLP_' + i);
      if (tile && !tile.classList.contains('hit')) {
        tile.classList.add('hit');
        tile.textContent = '✓';
      }
    }
  }
}, cascadeStart);

ev('chime', cascadeStart + 1.45);

// Wipe 5: S5 -> S6 (Resolution / CTA)
const w5Start = en('L11') + 0.40;
ev('whoosh', w5Start, { a: 0.6 });
tl.fromTo('#w5', { x: 1920 }, { x: -1920, duration: 0.65, ease: 'power2.inOut' }, w5Start);
tl.set('#s5', { visibility: 'hidden' }, w5Start + 0.32);
tl.set('#s6', { visibility: 'visible' }, w5Start + 0.32);

// ==================== BEAT 6: CTA & RESOLUTION (L12, L13) ====================
// L12: "Hook your viewers before they scroll away."
gsap.set(['#ctaL1', '#ctaL2'], { y: 110 });
gsap.set('#heroLockup', { opacity: 0, y: 40, scale: 0.94 });
gsap.set('.badge-item', { opacity: 0, y: 20 });

tl.to('#ctaL1', { y: 0, duration: 0.4, ease: 'power3.out' }, st('L12') - 0.05);
tl.to('#ctaL2', { y: 0, duration: 0.4, ease: 'power3.out' }, W('L12', 'scroll') - 0.15);

// L13: "YouTube LaunchPad. See what your viewers see."
tl.to('#ctaHead', { opacity: 0, y: -20, duration: 0.4 }, st('L13') - 0.1);
tl.to('#heroLockup', { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: 'back.out(1.2)' }, st('L13') - 0.05);
ev('pop', st('L13'));

// Typewriter URL
const urlString = 'youtube.com/launchpad';
const urlObj = { len: 0 };
tl.to(urlObj, {
  len: urlString.length,
  duration: 1.2,
  ease: 'linear',
  onUpdate: () => {
    const el = $('#urlText');
    if (el) el.textContent = urlString.slice(0, Math.floor(urlObj.len));
  }
}, W('L13', 'see') - 0.1);

tl.to('.badge-item', { opacity: 1, y: 0, stagger: 0.12, duration: 0.4, ease: 'back.out(1.4)' }, W('L13', 'see') + 0.4);
ev('chime', W('L13', 'see') + 0.6);

// Final fade-out
tl.to('#stage', { opacity: 0, duration: 0.8, ease: 'power2.in' }, TOTAL - 0.8);
tl.to({}, { duration: 0.01 }, TOTAL - 0.01);

window.__tl = tl;
window.TOTAL = TOTAL;
window.seek = t => { tl.time(Math.min(t, TOTAL - 0.001), false); };
window.ready = document.fonts.ready.then(() =>
  Promise.all([
    '800 80px BR', '700 80px BR',
    'italic 400 80px IS',
    '400 20px JB', '700 20px JB',
    '500 20px IN', '600 20px IN', '700 20px IN'
  ].map(f => document.fonts.load(f)))
);
