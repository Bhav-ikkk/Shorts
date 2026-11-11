// Blocky Story Engine: Data-driven runtime conductor.
// Consumes episode.json + anchors.json. seek(t) is a pure function of time.
import * as THREE from 'three';
import { makeChar, compose, win } from './runtime/char.js';
import { buildKitchenSet } from './runtime/world.js';
import { createCamera, updateCamera } from './runtime/camera.js';
import { prepareCaptionChunks, updateCaptions } from './runtime/captions.js';
import { updateFx, projectToScreen } from './runtime/fx.js';

const [A, LIP, EP, CASTF] = await Promise.all([
  'data/anchors.json',
  'data/lip.json',
  'data/episode.json',
  'data/cast.json'
].map(u => fetch(u).then(r => r.json())));

const AN = A.lines, TOTAL = A.total, W = 1080, H = 1920, CAST = CASTF.cast;
const nrm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const wordT = (k, w) => {
  const e = AN[k].words.find(x => nrm(x[0]) === nrm(w));
  if (!e) throw new Error(`no word "${w}" in ${k}`);
  return AN[k].start + e[1];
};

// Anchor expression resolver (raw seconds are strictly forbidden)
function T(x) {
  if (typeof x !== 'string') throw new Error('raw seconds are forbidden, use an anchor expression: ' + x);
  const m = /^(end|L\d+\.(?:start|end|word\(.+?\)))([+-]\d*\.?\d+)?$/.exec(x);
  if (!m) throw new Error('bad time expression: ' + x);
  let t;
  if (m[1] === 'end') t = TOTAL;
  else {
    const i = m[1].indexOf('.'), k = m[1].slice(0, i), r = m[1].slice(i + 1);
    if (!AN[k]) throw new Error('unknown line ' + k);
    t = r === 'start' ? AN[k].start : r === 'end' ? AN[k].end : wordT(k, r.slice(5, -1));
  }
  return t + (m[2] ? parseFloat(m[2]) : 0);
}

window.EVENTS = [];
const ev = (n, t, o) => EVENTS.push([n, +t.toFixed(3), o || {}]);
const lerp = (a, b, u) => a + (b - a) * u, sm = u => u * u * (3 - 2 * u);

/* ---------- Renderer & Scene Setup ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
const cam = createCamera(W, H);

/* ---------- Procedural Set & World ---------- */
const world = buildKitchenSet(scene);

/* ---------- Cast Initialization ---------- */
const CH = {};
for (const id in CAST) {
  const c = CAST[id], L = c.look, hx = s => parseInt(s.slice(1), 16);
  const ch = makeChar({ skin: hx(L.skin), shirt: hx(L.shirt), pants: hx(L.pants), hair: hx(L.hair), hairStyle: L.hairStyle }, c.scale || 1);
  scene.add(ch.root);
  CH[id] = { ch, scale: c.scale || 1, blob: world.blob(0, 0, 1.9 * (c.scale || 1)), blinkPh: id.length * 1.37 };
}

/* ---------- Compile Episode Data ---------- */
const range = r => [T(r[0]), T(r[1])];
const SHOW = {};
for (const id in EP.show || {}) SHOW[id] = EP.show[id].map(range);
const shown = (id, t) => !SHOW[id] || SHOW[id].some(([a, b]) => t >= a && t <= b);

const STAGE = {};
EP.stage.forEach(s => (STAGE[s.who] ||= []).push({ t: T(s.t), x: s.x, z: s.z, ry: s.ry, lin: s.e === 'lin' }));
for (const id in STAGE) STAGE[id].sort((a, b) => a.t - b.t);

const place = (id, t) => {
  const k = STAGE[id];
  if (t <= k[0].t) return k[0];
  for (let i = 0; i < k.length - 1; i++) {
    if (t < k[i + 1].t) {
      let u = (t - k[i].t) / (k[i + 1].t - k[i].t);
      if (!k[i + 1].lin) u = sm(u);
      return { x: lerp(k[i].x, k[i + 1].x, u), z: lerp(k[i].z, k[i + 1].z, u), ry: lerp(k[i].ry, k[i + 1].ry, u) };
    }
  }
  return k.at(-1);
};

const SCH = {};
for (const a of EP.actions) {
  const t0 = T(a.from), t1 = a.to ? T(a.to) : t0 + (a.dur || .6);
  (SCH[a.who] ||= []).push({ a: a.do, t0, t1, fi: a.fi ?? .15, fo: a.fo ?? .2, ob: a.ob, ...(a.o || {}) });
  if (a.do === 'walk' && !(a.o && a.o.sound === false)) {
    const sp = (a.o && a.o.spd) || 2.4, am = a.o && a.o.amp ? a.o.amp : 1;
    for (let t = t0 + .1; t < t1 - .05; t += 1 / (sp * 2)) ev('step', t, { a: .5 * am });
  }
  if (a.do === 'jump') ev('boing', t0 + .12 - .02, { a: .5 });
  if (a.do === 'gasp') ev('gasp', t0, { a: .5 });
}

const FACES = (EP.faces || []).map(f => ({ who: f.who, t0: T(f.from), t1: T(f.to), face: f.face }));
const DEF = { eye: 'open', brow: 0, smile: .4, raise: 0, dx: 0, cheeks: 0 };
const faceOf = (id, t) => {
  const f = { ...DEF };
  for (const e of FACES) if (e.who === id && t >= e.t0 && t < e.t1) Object.assign(f, e.face);
  return f;
};

const speechSpans = id => Object.values(AN).filter(l => l.speaker === id).map(l => [l.start, l.end + .05]);
for (const e of FACES) {
  if (e.face.munch) {
    const sp = speechSpans(e.who);
    for (let t = e.t0 + .2; t < e.t1; t += .3) {
      if (!sp.some(([a, b]) => t >= a && t <= b)) ev('crunch', t, { a: .6 });
    }
  }
}

const PROPS = (EP.props || []).map(p => ({ who: p.who, name: p.name, t0: T(p.from), t1: T(p.to) }));

// Cameras
const SHOTS = EP.shots.map(s => ({ t0: T(s.from), a: s.a, b: s.b, roll: s.roll || [0, 0] })).sort((a, b) => a.t0 - b.t0);
SHOTS.forEach((s, i) => s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : TOTAL + 1);
SHOTS.forEach((s, i) => ev('whoosh', s.t0, { a: i ? .5 : .35 }));

const PUNCH = EP.punch.map(p => [T(p.at), p.a]);
PUNCH.forEach(([t]) => ev('thud', t, { a: .4 }));

// FX configuration
const bubblesEl = document.getElementById('bubbles');
const BUB = [];
const toggles = [];
let PUFF_CFG = null, DARK_CFG = null, EYES_CFG = null, SLAM_CFG = null;

for (const f of EP.fx) {
  const t = T(f.at);
  if (f.type === 'bubble') {
    const el = document.createElement('div');
    el.className = 'bub';
    el.textContent = f.glyph;
    bubblesEl.appendChild(el);
    BUB.push({ el, t0: t, t1: t + (f.dur || 1), anchor: f.anchor });
    ev('pop', t);
  } else if (f.type === 'toggle') {
    toggles.push({ t, target: f.target, visible: f.visible });
  } else if (f.type === 'puff') {
    PUFF_CFG = { t, at: f.anchor };
    ev('poof', t);
  } else if (f.type === 'sfx') {
    for (let i = 0; i < (f.rep || 1); i++) ev(f.name, t + i * (f.dt || 0), f.a ? { a: f.a } : {});
  } else if (f.type === 'dark') {
    DARK_CFG = { t, seg: [[0, .1, .85], [.1, .2, .05], [.2, .32, .9], [.32, .38, .1], [.38, 99, .93]] };
    ev('blackout', t);
    DARK_CFG.seg.slice(1, 4).forEach(s => ev('flicker', t + s[0]));
  } else if (f.type === 'eyes') {
    EYES_CFG = { t };
  } else if (f.type === 'slam') {
    SLAM_CFG = { t, text: f.text };
    ev('swell', t - .5, { d: .5 });
    ev('impact', t);
    ev('chime', t + .1);
  }
}

for (const m of EP.music || []) ev('music', T(m.at), { pattern: m.pattern });

// Captions
const captionChunks = prepareCaptionChunks(AN);
const capEl = document.getElementById('cap');
const captionState = { lastIndex: -2 };
document.getElementById('series').textContent = `${CASTF.series} · ${EP.episodeTag || ''}`;

// Mouth envelopes & shapes
const lineOf = (id, t) => {
  for (const k in AN) if (AN[k].speaker === id && t >= AN[k].start && t <= AN[k].end + .05) return k;
  return null;
};

const mouth = (id, t) => {
  const k = lineOf(id, t);
  if (!k) return 0;
  const arr = LIP[k], x = (t - AN[k].start) * 60, i = x | 0, f = x - i;
  return Math.min(1, ((arr[i] || 0) * (1 - f) + (arr[i + 1] || 0) * f) * 1.15);
};

const shapeOf = (id, t) => {
  const k = lineOf(id, t);
  if (!k) return 'A';
  const L = AN[k], loc = t - L.start;
  let wi = 0;
  for (let i = 0; i < L.words.length; i++) if (L.words[i][1] <= loc) wi = i;
  const w = L.words[wi], t1 = wi + 1 < L.words.length ? L.words[wi + 1][1] : L.dur;
  const p = Math.min(.999, Math.max(0, (loc - w[1]) / Math.max(.05, t1 - w[1])));
  const ls = w[0].toLowerCase().replace(/[^a-z]/g, '');
  if (!ls) return 'A';
  const c = ls[Math.floor(p * ls.length)];
  return 'aeiy'.includes(c) ? (c === 'a' ? 'A' : 'E') : 'ouw'.includes(c) ? 'O' : 'mbp'.includes(c) ? 'M' : 'E';
};

const blink = (t, ph) => ((t + ph) % 3.1) < .12;
const schedAt = (id, t) => [...(SCH[id] || []), { a: 'talk', t0: 0, t1: TOTAL, env: mouth(id, t), fi: .01, fo: .01 }];

/* ---------- seek(t): Pure Deterministic Timeline Function ---------- */
window.seek = t => {
  t = Math.min(t, TOTAL - .001);

  // 1. Update Characters
  for (const id in CH) {
    const { ch, blob: bl, blinkPh } = CH[id];
    const pl = place(id, t), vis = shown(id, t);
    const J = compose(t, schedAt(id, t), { phase: id.length });
    const Jp = compose(t - .05, schedAt(id, t - .05), { phase: id.length });

    ch.root.position.set(pl.x, 0, pl.z);
    ch.root.rotation.y = pl.ry;
    ch.root.visible = vis;
    bl.visible = vis;
    bl.position.set(pl.x, .02, pl.z);

    ch.apply(J, Jp);

    const f = faceOf(id, t);
    let open = mouth(id, t);
    const sh = shapeOf(id, t);
    if (!open && f.munch) open = .22 + .22 * Math.sin(t * 13);
    ch.setFace({
      ...f,
      eye: (f.eye === 'open' || f.eye === 'wide') && blink(t, blinkPh) ? 'blink' : f.eye,
      open: sh === 'M' ? open * .2 : open,
      shape: sh
    });

    ch.cookie.visible = PROPS.some(p => p.who === id && p.name === 'cookie' && t >= p.t0 && t <= p.t1);
  }

  // 2. Toggles & World Props
  for (const tg of toggles) {
    if (tg.target === 'cookies') world.cookies.visible = tg.visible ? t >= tg.t : t < tg.t;
  }
  world.hMin.rotation.z = -t * .35;
  world.hHr.rotation.z = -t * .03;

  // 3. Camera
  updateCamera(cam, t, SHOTS, PUNCH);
  renderer.render(scene, cam);

  // 4. Kinetic Captions
  updateCaptions(capEl, captionChunks, t, captionState);

  // 5. Visual FX
  updateFx(t, {
    bubbles: BUB,
    puff: world.puff,
    puffDirs: world.puffDirs,
    puffConfig: PUFF_CFG,
    dark: DARK_CFG,
    eyes: EYES_CFG,
    slam: SLAM_CFG,
    characters: CH,
    cam,
    total: TOTAL
  });
};

window.TOTAL = TOTAL;
window.ready = document.fonts.load('800 80px BR').then(() => {
  seek(0);
  return true;
});
