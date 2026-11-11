// Blocky story engine runtime: episode.json (data) -> deterministic scene. seek(t) is a pure function of time.
import * as THREE from 'three';
import { makeChar, compose, win } from './char.js';
const [A, LIP, EP, CASTF] = await Promise.all(['data/anchors.json', 'data/lip.json', 'data/episode.json', 'data/cast.json'].map(u => fetch(u).then(r => r.json())));
const AN = A.lines, TOTAL = A.total, W = 1080, H = 1920, CAST = CASTF.cast;
const nrm = s => s.toLowerCase().replace(/[^a-z0-9']/g, '');
const wordT = (k, w) => { const e = AN[k].words.find(x => nrm(x[0]) === nrm(w)); if (!e) throw new Error(`no word "${w}" in ${k}`); return AN[k].start + e[1]; };
// time expressions only: "L2.start", "L3.end", "L4.word(Mox)", "end", each with optional +/-offset. Raw seconds are rejected.
function T(x) {
  if (typeof x !== 'string') throw new Error('raw seconds are forbidden, use an anchor expression: ' + x);
  const m = /^(end|L\d+\.(?:start|end|word\(.+?\)))([+-]\d*\.?\d+)?$/.exec(x); if (!m) throw new Error('bad time expression: ' + x);
  let t; if (m[1] === 'end') t = TOTAL; else { const i = m[1].indexOf('.'), k = m[1].slice(0, i), r = m[1].slice(i + 1); if (!AN[k]) throw new Error('unknown line ' + k); t = r === 'start' ? AN[k].start : r === 'end' ? AN[k].end : wordT(k, r.slice(5, -1)); }
  return t + (m[2] ? parseFloat(m[2]) : 0);
}
window.EVENTS = []; const ev = (n, t, o) => EVENTS.push([n, +t.toFixed(3), o || {}]);
const lerp = (a, b, u) => a + (b - a) * u, sm = u => u * u * (3 - 2 * u);

/* ---------- renderer / world ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H); renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x9fd8e8);
const cam = new THREE.PerspectiveCamera(45, W / H, .1, 80);
scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b79a, 1.05));
const sun = new THREE.DirectionalLight(0xfff3dc, 2.1); sun.position.set(4, 9, 7); scene.add(sun);
const mcache = new Map(); const M = c => { let m = mcache.get(c); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: .7 }); mcache.set(c, m); } return m; };
const box = (w, h, d, c, x, y, z, parent = scene) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(c)); m.position.set(x, y, z); parent.add(m); return m; };
const cyl = (r1, r2, h, c, x, y, z, seg = 32, parent = scene) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), M(c)); m.position.set(x, y, z); parent.add(m); return m; };
{ const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  x.fillStyle = '#E9C99B'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#DDB57F'; x.fillRect(0, 0, 128, 128); x.fillRect(128, 128, 128, 128);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(10, 10); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: t, roughness: .9 })); f.rotation.x = -Math.PI / 2; scene.add(f); }
box(30, 8, .3, 0x55c7b6, 0, 4, -2.7); box(30, .28, .4, 0x2f8f84, 0, .14, -2.5);                 // back wall + baseboard
box(1.9, 1.6, .12, 0x3a2a1e, 1.15, 3.05, -2.52); box(1.7, 1.4, .1, 0xbfe9ff, 1.15, 3.05, -2.44); box(.1, 1.4, .12, 0x3a2a1e, 1.15, 3.05, -2.4); box(1.7, .1, .12, 0x3a2a1e, 1.15, 3.05, -2.4);
box(1.4, 2.2, .7, 0xb7794a, -2.2, 1.1, -2.2); box(1.3, .1, .72, 0x8a5a36, -2.2, 1.5, -2.2);     // cabinet
box(.5, .5, .5, 0xe86a5a, -2.2, 2.45, -2.2); box(.12, .5, .12, 0x3fae5a, -2.2, 2.9, -2.2);       // pot + stem
box(1.7, 4.2, 1.3, 0xe8f1f5, 3.6, 2.1, -1.9); box(.08, 1.2, .1, 0x8a98a5, 2.82, 2.7, -1.2); box(.08, .8, .1, 0x8a98a5, 2.82, 1.2, -1.2); box(1.7, .06, 1.32, 0xc7d4dc, 3.6, 2.95, -1.9); // fridge
box(.45, .45, .06, 0xffd21f, 3.3, 3.6, -1.22); box(.4, .5, .06, 0xff6b6b, 3.95, 3.3, -1.22);   // magnets
// wall clock with hands (hands are a pure function of time)
const clockG = new THREE.Group(); clockG.position.set(-.6, 5.1, -2.52); scene.add(clockG);
{ const face = cyl(.75, .75, .12, 0xffffff, 0, 0, 0, 40, clockG); face.rotation.x = Math.PI / 2; const rim = cyl(.82, .82, .1, 0x2a2a38, 0, 0, -.02, 40, clockG); rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(.07, i % 3 ? .1 : .18, .05, 0x2a2a38, Math.sin(a) * .6, Math.cos(a) * .6, .08, clockG).rotation.z = -a; } }
const hMin = new THREE.Group(), hHr = new THREE.Group(); clockG.add(hMin, hHr); box(.06, .5, .05, 0x2a2a38, 0, .22, .1, hMin); box(.08, .34, .05, 0xe86a5a, 0, .15, .12, hHr);
// rug + table + plate
{ const r = cyl(2.9, 2.9, .03, 0xd96a5a, 0, .015, 1.2, 48); r.scale.set(1, 1, .72); const r2 = cyl(2.5, 2.5, .035, 0xf2b8a8, 0, .02, 1.2, 48); r2.scale.set(1, 1, .72); }
box(3.4, .22, 1.7, 0xc78a52, 0, 1.12, -1.0); for (const [x, z] of [[-1.5, -.4], [1.5, -.4], [-1.5, -1.6], [1.5, -1.6]]) box(.22, 1.0, .22, 0x9c6a3b, x, .5, z);
cyl(.62, .55, .07, 0xffffff, 0, 1.27, -1.0, 40); cyl(.64, .64, .02, 0xdfe9f5, 0, 1.235, -1.0, 40);
const cookies = new THREE.Group(); scene.add(cookies);
for (const [x, z, r] of [[-.2, -1.05, .27], [.24, -.92, .25]]) { const d = cyl(r, r, .09, 0xc98a4b, x, 1.36, z, 24, cookies); for (let i = 0; i < 5; i++) box(.07, .05, .07, 0x4a2a14, x + Math.cos(i * 1.7) * r * .55, 1.42, z + Math.sin(i * 1.7) * r * .55, cookies); }
const tableCrumbs = new THREE.Group(); scene.add(tableCrumbs);
for (const [x, z, s] of [[-.2, -.9, .07], [.1, -1.1, .06], [.25, -.8, .05], [-.05, -1.2, .05], [.35, -1.05, .06], [-.3, -1.1, .04]]) { const c = box(s, s * .8, s, 0x6b3d1d, x, 1.31, z, tableCrumbs); c.rotation.y = x * 7; }
// crumb trail on the floor, winding toward the table (deterministic jitter)
{ const pts = [[-1.2, 3.4], [-.9, 2.8], [-.5, 2.3], [-.1, 1.9], [.25, 1.5], [.35, 1.1], [.15, .7], [0, .3], [0, -.1], [0, -.5]]; let q = 0;
  for (let i = 0; i < pts.length; i++) for (let j = 0; j < 2; j++) { const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], u = j * .5; q++; const s = .06 + ((q * 37) % 5) * .012;
    const c = box(s, s * .7, s, 0x6b3d1d, lerp(a[0], b[0], u) + (((q * 53) % 7) - 3) * .035, s * .35, lerp(a[1], b[1], u) + (((q * 29) % 7) - 3) * .035); c.rotation.y = q; } }
// blob shadows (cheap, no shadow maps => low RAM/GPU)
const shT = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); const g = x.createRadialGradient(64, 64, 4, 64, 64, 62); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(shT_c = c); })(); var shT_c;
const blob = (x, z, w, d = w, a = 1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false, opacity: a })); m.rotation.x = -Math.PI / 2; m.scale.set(w, d, 1); m.position.set(x, .02, z); scene.add(m); return m; };
blob(0, -.95, 4.4, 2.2, .75);   // dark space under the table
// puff (dust cloud) = cubes flying out, function of time
const puff = new THREE.Group(); scene.add(puff); puff.visible = false;
const puffDirs = Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return [Math.cos(a), (i % 3) * .35 + .2, Math.sin(a) * .6]; });
puffDirs.forEach((_, i) => { const b = box(.14, .14, .14, i % 2 ? 0xffffff : 0xf4e9d2, 0, 0, 0, puff); });

/* ---------- cast ---------- */
const CH = {};
for (const id in CAST) { const c = CAST[id], L = c.look, hx = s => parseInt(s.slice(1), 16);
  const ch = makeChar({ skin: hx(L.skin), shirt: hx(L.shirt), pants: hx(L.pants), hair: hx(L.hair), hairStyle: L.hairStyle }, c.scale || 1); scene.add(ch.root);
  CH[id] = { ch, scale: c.scale || 1, blob: blob(0, 0, 1.9 * (c.scale || 1)), blinkPh: id.length * 1.37 }; }

/* ---------- compile the episode ---------- */
const range = r => [T(r[0]), T(r[1])];
const SHOW = {}; for (const id in EP.show || {}) SHOW[id] = EP.show[id].map(range);
const shown = (id, t) => !SHOW[id] || SHOW[id].some(([a, b]) => t >= a && t <= b);
const STAGE = {}; EP.stage.forEach(s => (STAGE[s.who] ||= []).push({ t: T(s.t), x: s.x, z: s.z, ry: s.ry, lin: s.e === 'lin' })); for (const id in STAGE) STAGE[id].sort((a, b) => a.t - b.t);
const place = (id, t) => { const k = STAGE[id]; if (t <= k[0].t) return k[0]; for (let i = 0; i < k.length - 1; i++) if (t < k[i + 1].t) { let u = (t - k[i].t) / (k[i + 1].t - k[i].t); if (!k[i + 1].lin) u = sm(u); return { x: lerp(k[i].x, k[i + 1].x, u), z: lerp(k[i].z, k[i + 1].z, u), ry: lerp(k[i].ry, k[i + 1].ry, u) }; } return k.at(-1); };
const SCH = {}; for (const a of EP.actions) { const t0 = T(a.from), t1 = a.to ? T(a.to) : t0 + (a.dur || .6); (SCH[a.who] ||= []).push({ a: a.do, t0, t1, fi: a.fi ?? .15, fo: a.fo ?? .2, ob: a.ob, ...(a.o || {}) });
  if (a.do === 'walk' && !(a.o && a.o.sound === false)) { const sp = (a.o && a.o.spd) || 2.4, am = a.o && a.o.amp ? a.o.amp : 1; for (let t = t0 + .1; t < t1 - .05; t += 1 / (sp * 2)) ev('step', t, { a: .5 * am }); }
  if (a.do === 'jump') ev('boing', t0 + .12 - .02, { a: .5 }); if (a.do === 'gasp') ev('gasp', t0, { a: .5 }); }
const FACES = (EP.faces || []).map(f => ({ who: f.who, t0: T(f.from), t1: T(f.to), face: f.face }));
const DEF = { eye: 'open', brow: 0, smile: .4, raise: 0, dx: 0, cheeks: 0 };
const faceOf = (id, t) => { const f = { ...DEF }; for (const e of FACES) if (e.who === id && t >= e.t0 && t < e.t1) Object.assign(f, e.face); return f; };
const speechSpans = id => Object.values(AN).filter(l => l.speaker === id).map(l => [l.start, l.end + .05]);
for (const e of FACES) if (e.face.munch) { const sp = speechSpans(e.who); for (let t = e.t0 + .2; t < e.t1; t += .3) if (!sp.some(([a, b]) => t >= a && t <= b)) ev('crunch', t, { a: .6 }); }
const PROPS = (EP.props || []).map(p => ({ who: p.who, name: p.name, t0: T(p.from), t1: T(p.to) }));
// cameras
const SHOTS = EP.shots.map(s => ({ t0: T(s.from), a: s.a, b: s.b, roll: s.roll || [0, 0] })).sort((a, b) => a.t0 - b.t0); SHOTS.forEach((s, i) => s.t1 = i + 1 < SHOTS.length ? SHOTS[i + 1].t0 : TOTAL + 1);
SHOTS.forEach((s, i) => ev('whoosh', s.t0, { a: i ? .5 : .35 }));
const PUNCH = EP.punch.map(p => [T(p.at), p.a]); PUNCH.forEach(([t]) => ev('thud', t, { a: .4 }));
const V = a => new THREE.Vector3(...a), ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
// fx
const bubblesEl = document.getElementById('bubbles'); const BUB = []; const toggles = []; let PUFF = null, DARK = null, EYES = null, SLAM = null;
for (const f of EP.fx) { const t = T(f.at);
  if (f.type === 'bubble') { const el = document.createElement('div'); el.className = 'bub'; el.textContent = f.glyph; bubblesEl.appendChild(el); BUB.push({ el, t0: t, t1: t + (f.dur || 1), anchor: f.anchor }); ev('pop', t); }
  else if (f.type === 'toggle') toggles.push({ t, target: f.target, visible: f.visible });
  else if (f.type === 'puff') { PUFF = { t, at: f.anchor }; ev('poof', t); }
  else if (f.type === 'sfx') for (let i = 0; i < (f.rep || 1); i++) ev(f.name, t + i * (f.dt || 0), f.a ? { a: f.a } : {});
  else if (f.type === 'dark') { DARK = { t, seg: [[0, .1, .85], [.1, .2, .05], [.2, .32, .9], [.32, .38, .1], [.38, 99, .93]] }; ev('blackout', t); DARK.seg.slice(1, 4).forEach(s => ev('flicker', t + s[0])); }
  else if (f.type === 'eyes') EYES = { t };
  else if (f.type === 'slam') { SLAM = { t, text: f.text }; ev('swell', t - .5, { d: .5 }); ev('impact', t); ev('chime', t + .1); } }
for (const m of EP.music || []) ev('music', T(m.at), { pattern: m.pattern });
// captions (karaoke chunks)
const words = []; for (const k in AN) AN[k].words.forEach((w, i, arr) => words.push({ w: w[0], t0: AN[k].start + w[1], t1: i + 1 < arr.length ? AN[k].start + arr[i + 1][1] : AN[k].end, line: k }));
const chunks = []; { let cur = []; const flush = () => { if (cur.length) { chunks.push({ t0: cur[0].t0, t1: cur.at(-1).t1, ws: cur }); cur = []; } };
  for (const w of words) { const ch = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length; if (cur.length && (cur.length >= 3 || ch > 15 || cur[0].line !== w.line)) flush(); cur.push(w); if (/[.!?]$/.test(w.w)) flush(); } flush(); }
chunks.forEach((c, i) => { c.end = i + 1 < chunks.length && chunks[i + 1].t0 < c.t1 + .4 ? chunks[i + 1].t0 : c.t1 + .22; });
const capEl = document.getElementById('cap'); let capIdx = -2;
document.getElementById('series').textContent = `${CASTF.series} · ${EP.episodeTag || ''}`;
// mouth: opening from audio envelope, shape from the letter being spoken (viseme-lite)
const lineOf = (id, t) => { for (const k in AN) if (AN[k].speaker === id && t >= AN[k].start && t <= AN[k].end + .05) return k; return null; };
const mouth = (id, t) => { const k = lineOf(id, t); if (!k) return 0; const arr = LIP[k], x = (t - AN[k].start) * 60, i = x | 0, f = x - i; return Math.min(1, ((arr[i] || 0) * (1 - f) + (arr[i + 1] || 0) * f) * 1.15); };
const shapeOf = (id, t) => { const k = lineOf(id, t); if (!k) return 'A'; const L = AN[k], loc = t - L.start; let wi = 0; for (let i = 0; i < L.words.length; i++) if (L.words[i][1] <= loc) wi = i;
  const w = L.words[wi], t1 = wi + 1 < L.words.length ? L.words[wi + 1][1] : L.dur, p = Math.min(.999, Math.max(0, (loc - w[1]) / Math.max(.05, t1 - w[1]))), ls = w[0].toLowerCase().replace(/[^a-z]/g, ''); if (!ls) return 'A';
  const c = ls[Math.floor(p * ls.length)]; return 'aeiy'.includes(c) ? (c === 'a' ? 'A' : 'E') : 'ouw'.includes(c) ? 'O' : 'mbp'.includes(c) ? 'M' : 'E'; };
const blink = (t, ph) => ((t + ph) % 3.1) < .12;
const schedAt = (id, t) => [...(SCH[id] || []), { a: 'talk', t0: 0, t1: TOTAL, env: mouth(id, t), fi: .01, fo: .01 }];
const projEl = (el, v, W_ = W, H_ = H) => { const p = v.clone().project(cam); el.style.left = ((p.x * .5 + .5) * W_) + 'px'; el.style.top = ((-p.y * .5 + .5) * H_) + 'px'; return p; };
const tmpV = new THREE.Vector3();

/* ---------- seek(t): pure function of time ---------- */
window.seek = t => {
  t = Math.min(t, TOTAL - .001);
  for (const id in CH) { const { ch, blob: bl, blinkPh } = CH[id], pl = place(id, t), vis = shown(id, t);
    const J = compose(t, schedAt(id, t), { phase: id.length }), Jp = compose(t - .05, schedAt(id, t - .05), { phase: id.length });
    ch.root.position.set(pl.x, 0, pl.z); ch.root.rotation.y = pl.ry; ch.root.visible = vis; bl.visible = vis; bl.position.set(pl.x, .02, pl.z);
    ch.apply(J, Jp);
    const f = faceOf(id, t); let open = mouth(id, t); const sh = shapeOf(id, t);
    if (!open && f.munch) open = .22 + .22 * Math.sin(t * 13);
    ch.setFace({ ...f, eye: (f.eye === 'open' || f.eye === 'wide') && blink(t, blinkPh) ? 'blink' : f.eye, open: sh === 'M' ? open * .2 : open, shape: sh });
    ch.cookie.visible = PROPS.some(p => p.who === id && p.name === 'cookie' && t >= p.t0 && t <= p.t1);
  }
  CH.PIP && (CH.PIP.ch.crumbs.visible = false);
  for (const tg of toggles) if (tg.target === 'cookies') cookies.visible = tg.visible ? t >= tg.t : t < tg.t;
  // puff
  if (PUFF) { const u = (t - PUFF.t) / .55; puff.visible = u > 0 && u < 1; if (puff.visible) puff.children.forEach((b, i) => { const d = puffDirs[i], r = Math.sqrt(u) * 1.1; b.position.set(PUFF.at[0] + d[0] * r, PUFF.at[1] + d[1] * r * .8 + u * .3, PUFF.at[2] + d[2] * r); b.scale.setScalar(Math.max(.01, 1 - u) * (1 + (i % 3) * .3)); b.rotation.set(u * 5 + i, u * 4, 0); }); }
  // clock
  hMin.rotation.z = -t * .35; hHr.rotation.z = -t * .03;
  // camera
  const s = SHOTS.find(s => t >= s.t0 && t < s.t1) || SHOTS.at(-1), u = ease(Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0))));
  const p = V(s.a.p).lerp(V(s.b.p), u), l = V(s.a.l).lerp(V(s.b.l), u); let f = lerp(s.a.f, s.b.f, u);
  for (const [tp, a] of PUNCH) if (t > tp) f *= 1 - a * Math.exp(-(t - tp) * 9);
  p.x += Math.sin(t * 1.3) * .02; p.y += Math.sin(t * 1.9 + 1) * .015; l.x += Math.sin(t * 1.1 + 2) * .015;
  cam.fov = f; cam.updateProjectionMatrix(); cam.position.copy(p); cam.lookAt(l); cam.rotateZ(lerp(s.roll[0], s.roll[1], u));
  renderer.render(scene, cam);
  // bubbles (DOM, projected from 3D)
  BUB.forEach(b => { const k = win(t, b.t0, b.t1, .12, .15);
    if (k <= 0) { b.el.style.visibility = 'hidden'; return; }
    let a = b.anchor; if (typeof a === 'string') { const [id, what] = a.split('.'); const c = CH[id]; c.ch.head.getWorldPosition(tmpV); a = [tmpV.x, tmpV.y + 1.45 * c.scale + (what === 'head' ? 0 : 0), tmpV.z]; }
    projEl(b.el, V(a)); b.el.style.visibility = 'visible'; const o = 1 + .25 * Math.sin(Math.min(1, (t - b.t0) / .25) * Math.PI); b.el.style.transform = `translate(-50%,-100%) scale(${k * o}) rotate(${(1 - k) * -14}deg)`; });
  // captions
  const ci = chunks.findIndex(c => t >= c.t0 - .03 && t < c.end);
  if (ci !== capIdx) { capIdx = ci; capEl.innerHTML = ci < 0 ? '' : chunks[ci].ws.map(w => `<span class="w">${w.w}</span>`).join(' '); }
  capEl.style.visibility = ci < 0 ? 'hidden' : 'visible';
  if (ci >= 0) [...capEl.children].forEach((e, i) => { const w = chunks[ci].ws[i]; e.className = 'w ' + (t >= w.t1 ? 'done' : t >= w.t0 - .02 ? 'on' : ''); });
  // blackout + glowing eyes
  let dk = 0; if (DARK && t >= DARK.t) { const r = t - DARK.t; for (const [a, b, o] of DARK.seg) if (r >= a && r < b) dk = o; }
  document.getElementById('dark').style.opacity = dk;
  const eyes = document.getElementById('eyes'); const ek = EYES ? win(t, EYES.t, TOTAL + 1, .2, .01) : 0;
  if (ek > 0) { const q = projEl(eyes, V([0, 1.62, -1.6])); eyes.style.visibility = 'visible'; const bl = ((t - EYES.t) % 1.7) > 1.55 ? .1 : 1; eyes.style.opacity = ek; eyes.style.transform = `translate(-50%,-50%) scale(${ek}, ${bl})`; } else eyes.style.visibility = 'hidden';
  // PART 2 slam
  const p2 = document.getElementById('part2'); if (SLAM) { p2.textContent = SLAM.text; const q = (t - SLAM.t) / .3;
    p2.style.visibility = q > 0 ? 'visible' : 'hidden'; const sc = q < 1 ? 1.9 - .9 * (q * q * (3 - 2 * q)) : 1; p2.style.transform = `scale(${Math.max(1, sc)}) rotate(${q < 1 ? (1 - q) * 6 : -3}deg)`;
    document.getElementById('flash').style.opacity = (t > SLAM.t && t < SLAM.t + .1) ? .55 * (1 - (t - SLAM.t) / .1) : 0; }
};
window.TOTAL = TOTAL;
window.ready = document.fonts.load('800 80px BR').then(() => { seek(0); return true; });
