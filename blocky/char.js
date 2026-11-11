// Blocky character rig v2: two-bone limbs (elbows/knees), outline hull, canvas face with mouth shapes, hair spring.
// Everything is a pure function of time => deterministic.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
const OUT = new THREE.MeshBasicMaterial({ color: 0x0f0f18, side: THREE.BackSide });
const matCache = new Map(), geoCache = new Map();
const mat = c => { let m = matCache.get(c); if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: .55, metalness: 0 }); matCache.set(c, m); } return m; };
function part(w, h, d, color, r = .07, outline = 1.07) {
  const key = [w, h, d, r].join(); let g = geoCache.get(key); if (!g) { g = new RoundedBoxGeometry(w, h, d, 3, r); geoCache.set(key, g); }
  const m = new THREE.Mesh(g, mat(color)); if (outline) { const o = new THREE.Mesh(g, OUT); o.scale.setScalar(outline); m.add(o); } return m;
}
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); };
const INK = '#17171d';
// f: {eye:'open|blink|wide|squint|happy', dx, brow(-1 worried .. +1 angry), raise, open(0..1), shape:'A|O|E|M', smile(-1..1), cheeks}
export function drawFace(c, f) {
  c.clearRect(0, 0, 256, 256); const ey = 112, dx = (f.dx || 0) * 10; c.lineCap = 'round'; c.strokeStyle = INK;
  for (const x0 of [86, 170]) {
    const x = x0 + dx; c.fillStyle = INK;
    if (f.eye === 'blink') rr(c, x - 16, ey - 3, 32, 7, 3);
    else if (f.eye === 'wide') { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, ey, 27, 34, 0, 0, 7); c.fill(); c.lineWidth = 6; c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(x + (f.dx || 0) * 8, ey, 9, 0, 7); c.fill(); }
    else if (f.eye === 'squint') { c.lineWidth = 9; c.beginPath(); c.arc(x, ey + 10, 20, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    else if (f.eye === 'happy') { c.lineWidth = 9; c.beginPath(); c.arc(x, ey + 16, 20, Math.PI * 1.12, Math.PI * 1.88); c.stroke(); }
    else { rr(c, x - 13, ey - 26, 26, 52, 13); c.fillStyle = '#fff'; c.beginPath(); c.arc(x + 4, ey - 12, 6, 0, 7); c.fill(); }
  }
  c.strokeStyle = INK; c.lineWidth = 9;
  for (const [x, s] of [[86, -1], [170, 1]]) { const r = (f.raise || 0) * 14; c.beginPath(); c.moveTo(x - 24, ey - 52 + f.brow * s * 8 - r); c.lineTo(x + 24, ey - 52 - f.brow * s * 8 - r); c.stroke(); }
  c.fillStyle = `rgba(255,90,110,${.28 + (f.cheeks || 0) * .3})`; c.beginPath(); c.ellipse(52, 158, 20 + (f.cheeks || 0) * 8, 12 + (f.cheeks || 0) * 5, 0, 0, 7); c.ellipse(204, 158, 20 + (f.cheeks || 0) * 8, 12 + (f.cheeks || 0) * 5, 0, 0, 7); c.fill();
  const my = 186, o = f.open, sh = f.shape || 'A';
  if (o > .07) {
    const P = { A: [26 + 16 * o, 8 + 44 * o], O: [15 + 9 * o, 10 + 40 * o], E: [34 + 14 * o, 5 + 24 * o], M: [30, 4] }[sh] || [26, 10];
    c.fillStyle = '#4a1d22'; c.beginPath(); c.ellipse(128, my, P[0], P[1], 0, 0, 7); c.fill();
    if (sh !== 'M') { c.fillStyle = '#e8737f'; c.beginPath(); c.ellipse(128, my + P[1] * .45, P[0] * .5, P[1] * .38, 0, 0, 7); c.fill(); }
  } else {
    c.lineWidth = 9; c.beginPath();
    if (f.smile >= 0) c.arc(128, my - 14 - f.smile * 6, 30, Math.PI * (.15 + .1 * (1 - f.smile)), Math.PI * (.85 - .1 * (1 - f.smile)));
    else c.arc(128, my + 22, 28, Math.PI * (1.15 - .05 * -f.smile), Math.PI * (1.85 + .05 * -f.smile));
    c.stroke();
  }
}
export function makeChar({ skin, shirt, pants, hair, hairStyle = 'cap', shoe = 0x23232b }, scale = 1) {
  const root = new THREE.Group(), body = new THREE.Group(); root.add(body); root.scale.setScalar(scale);
  const torso = new THREE.Group(), head = new THREE.Group(), hairG = new THREE.Group(); torso.position.y = .8;
  const mkLeg = x => { const hip = new THREE.Group(), knee = new THREE.Group(); hip.position.set(x, .8, 0);
    const th = part(.42, .42, .42, pants); th.position.y = -.2; hip.add(th); knee.position.y = -.4; hip.add(knee);
    const sh = part(.4, .42, .4, pants); sh.position.y = -.2; knee.add(sh); const ft = part(.44, .14, .6, shoe, .05); ft.position.set(0, -.34, .08); knee.add(ft); return { hip, knee }; };
  const mkArm = x => { const sh = new THREE.Group(), el = new THREE.Group(), hand = new THREE.Group(); sh.position.set(x, .92, 0);
    const up = part(.34, .5, .36, shirt, .06); up.position.y = -.2; sh.add(up); el.position.y = -.44; sh.add(el);
    const lo = part(.32, .52, .34, skin, .06); lo.position.y = -.22; el.add(lo); hand.position.set(0, -.5, .02); el.add(hand); return { sh, el, hand }; };
  const LA = mkLeg(-.23), LB = mkLeg(.23), AA = mkArm(-.7), AB = mkArm(.7);
  const tm = part(.98, 1.0, .56, shirt); tm.position.y = .5; torso.add(tm);
  head.position.y = 1.02; const hm = part(.8, .78, .78, skin, .16); hm.position.y = .4; head.add(hm); head.add(hairG);
  const H = (w, h, d, x, y, z, r = .08) => { const p = part(w, h, d, hair, r); p.position.set(x, y, z); hairG.add(p); return p; };
  if (hairStyle === 'cap') { H(.86, .24, .86, 0, .74, 0, .1); H(.7, .1, .34, 0, .66, .52, .04); }
  else if (hairStyle === 'spiky') { H(.82, .36, .82, 0, .78, 0, .12); for (const [x, z] of [[-.25, 0], [0, .1], [.25, 0]]) H(.2, .3, .2, x, 1.02, z, .05); }
  else if (hairStyle === 'pigtails') { H(.86, .26, .86, 0, .74, 0, .1); for (const s of [-1, 1]) { H(.2, .5, .22, s * .52, .4, -.05, .06); H(.14, .14, .14, s * .52, .74, .2, .04); } }
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const face = new THREE.Mesh(new THREE.PlaneGeometry(.74, .74), new THREE.MeshBasicMaterial({ map: tex, transparent: true })); face.position.set(0, .4, .396); head.add(face);
  torso.add(AA.sh, AB.sh, head); body.add(LA.hip, LB.hip, torso);
  const crumbs = new THREE.Group(); crumbs.visible = false;
  for (const [x, y, s] of [[-.22, .62, .07], [.12, .46, .06], [.26, .68, .05], [-.05, .3, .06], [-.3, .38, .05]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(s, s, s * .6), mat(0x6b3d1d)); c.position.set(x, y, .3); c.rotation.z = x * 4; crumbs.add(c); }
  torso.add(crumbs);
  const cookie = new THREE.Group(); { const d = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .06, 20), mat(0xc98a4b)); d.rotation.x = Math.PI / 2; cookie.add(d);
    for (const [x, y] of [[-.06, .05], [.07, -.04], [.02, .09], [-.08, -.07]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, .05), mat(0x4a2a14)); c.position.set(x, y, .04); cookie.add(c); } }
  cookie.position.set(0, -.04, .12); cookie.visible = false; AB.hand.add(cookie);
  let last = '';
  return { root, body, head, crumbs, cookie,
    setFace(f) { const k = [f.eye, f.brow.toFixed(1), (f.open * 8 | 0), f.smile.toFixed(1), f.dx || 0, (f.raise || 0).toFixed(1), f.shape || 'A', (f.cheeks || 0).toFixed(1)].join(); if (k === last) return; last = k; drawFace(cx, f); tex.needsUpdate = true; },
    apply(J, Jp) {
      body.position.y = J.bob; body.rotation.set(J.lean, J.ry, 0); body.scale.set(1 + J.sq * .5, 1 - J.sq, 1 + J.sq * .5);
      torso.rotation.set(J.tx, J.ty, 0); head.rotation.set(J.hx, J.hy, J.hz);
      AA.sh.rotation.set(-J.alx, 0, -J.alz); AA.el.rotation.set(-J.ale, 0, -J.alez);
      AB.sh.rotation.set(-J.arx, 0, J.arz); AB.el.rotation.set(-J.are, 0, J.arez);
      LA.hip.rotation.x = -J.llx; LA.knee.rotation.x = J.lkl; LB.hip.rotation.x = -J.lrx; LB.knee.rotation.x = J.lkr;
      const cl = (x, m) => Math.max(-m, Math.min(m, x)); // hair spring: lags head/body motion
      hairG.position.y = cl(-(J.bob - Jp.bob) * 1.1, .06); hairG.rotation.x = cl((Jp.hx - J.hx) * 1.2 + (Jp.tx - J.tx), .25); hairG.rotation.z = cl((Jp.hz - J.hz) * 1.2, .2);
    } };
}
// ---------- actions: each returns joint deltas; summed with weights ----------
export const J0 = () => ({ hx: 0, hy: 0, hz: 0, tx: 0, ty: 0, alx: 0, alz: 0, ale: 0, alez: 0, arx: 0, arz: 0, are: 0, arez: 0, llx: 0, lrx: 0, lkl: 0, lkr: 0, bob: 0, ry: 0, sq: 0, lean: 0 });
const S = Math.sin, C = Math.cos, mx = Math.max, sm = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// window with optional overshoot on the way in (ob>0 => anticipation/pop)
export const win = (t, a, b, fi = .15, fo = .2, ob = 0) => { const u = Math.min(1, Math.max(0, (t - a) / fi)); let r = sm(u); if (ob && u > 0 && u < 1) r = 1 + (1 + 1.7 * ob) * Math.pow(u - 1, 3) + 1.7 * ob * Math.pow(u - 1, 2); return r * (1 - sm((t - (b - fo)) / fo)); };
const add = (J, o, w = 1) => { for (const k in o) J[k] += o[k] * w; };
const crouchD = k => -.82 * (1 - C(k));
export const ACTIONS = {
  idle: (t, p = 0) => ({ bob: S(t * 2.2 + p) * .012, alz: .07 + S(t * 1.6 + p) * .02, arz: .07 + S(t * 1.6 + p + 1) * .02, ale: .12, are: .12, hy: S(t * .9 + p) * .05 }),
  walk: (t, o) => { const sp = o.spd || 2.4, ph = t * sp * Math.PI * 2, s = S(ph), c = C(ph), k = o.crouch || 0, A = o.amp || 1;
    return { llx: s * .7 * A + k, lrx: -s * .7 * A + k, lkl: mx(0, c) * .9 * A + 2 * k, lkr: mx(0, -c) * .9 * A + 2 * k, alx: -s * .5 * A, arx: s * .5 * A, ale: .35 + mx(0, -s) * .3, are: .35 + mx(0, s) * .3, bob: Math.abs(s) * .06 * A + crouchD(k), lean: o.lean ?? .05, tx: o.tx || 0 }; },
  talk: (t, o) => { const e = o.env || 0; return { hx: e * .07 * S(t * 9), hy: e * .08 * S(t * 5), arx: e * .25 * mx(0, S(t * 6)), alx: e * .2 * mx(0, S(t * 6 + 2)), ale: e * .35 * mx(0, S(t * 6 + 1)), are: e * .4 * mx(0, S(t * 6 + 2.5)), bob: e * .02 }; },
  crouch: (t, o) => { const k = o.k || .8; return { llx: k, lrx: k, lkl: 2 * k, lkr: 2 * k, bob: crouchD(k), tx: o.tx || 0, hx: o.hx || 0 }; },
  sit: () => ({ llx: 1.45, lrx: 1.45, lkl: .25, lkr: .25, bob: -.62, alx: .35, arx: .35, ale: .5, are: .5 }),
  peek: () => ({ llx: .3, lrx: .3, lkl: .6, lkr: .6, bob: crouchD(.3), tx: .5, hx: .2, alx: .8, arx: .8, ale: .2, are: .2 }),
  pointA: () => ({ alz: 1.45, alx: .25, ale: .05, hy: -.35 }),
  pointB: () => ({ arz: 1.45, arx: .25, are: .05, hy: .35 }),
  pointDown: () => ({ arx: .95, are: .08, arz: .12, hx: .25, tx: .1 }),
  pointChest: () => ({ arx: .95, arz: -.5, are: 1.3 }),
  beckon: t => ({ arx: 1.25, arz: .2, are: 1.0 + S(t * 10) * .5, hy: -.2 }),
  wave: t => ({ arx: 1.0, arz: .55, are: 1.6 + S(t * 14) * .35 }),
  shrug: t => ({ alz: .5, arz: .5, ale: 1.0, are: 1.0, alez: .5, arez: .5, hz: .12, bob: .03, hy: S(t * 3) * .1 }),
  facepalm: () => ({ arx: 1.15, are: 2.45, hx: .28, tx: .1 }),
  handsUp: () => ({ alz: .8, arz: .8, ale: .35, are: .35, alez: -.9, arez: -.9 }),
  handsHips: () => ({ alz: .65, arz: .65, alez: -1.55, arez: -1.55, ale: -.1, are: -.1 }),
  headHands: () => ({ alz: 2.75, arz: 2.75, alx: -.2, arx: -.2, hx: -.12, ale: .5, are: .5 }),
  gasp: () => ({ alx: 1.1, arx: 1.1, ale: 2.1, are: 2.1, alz: .2, arz: .2, hx: -.1, lean: -.1 }),
  eat: t => ({ arx: 1.25, are: 2.0 + .12 * S(t * 14), arz: .1, hx: .08 + .04 * S(t * 14) }),
  recoil: () => ({ lean: -.22, hx: -.1, bob: .02 }),
  lookDown: () => ({ hx: .3 }),
  look: (t, o) => ({ hy: o.hy || 0, hx: o.hx || 0 }),
  shake: t => ({ hy: S(t * 22) * .42, alz: .5, arz: .5, hz: S(t * 11) * .08, ry: S(t * 22) * .05 }),
  nod: t => ({ hx: .18 * S(t * 14) }),
  laugh: t => ({ hx: -.2 + S(t * 20) * .08, bob: Math.abs(S(t * 10)) * .05, tx: -.1, alx: .3, arx: .3, ale: .8, are: .8 }),
  jump: (t, o) => { const t0 = o.t0 + .12, d = o.dur || .55, u = (t - t0) / d, h = o.h || .4; let bob = 0, sq = 0, tk = 0;
    if (u < 0) sq = .12 * mx(0, 1 + u / .12); else if (u < 1) { bob = 4 * h * u * (1 - u); tk = S(Math.PI * u); } else sq = .12 * mx(0, 1 - (u - 1) / .12);
    return { bob, sq, llx: .5 * tk, lrx: .5 * tk, lkl: 1.0 * tk, lkr: 1.0 * tk }; },
};
export function compose(t, sched, base = {}) {
  const J = J0(); add(J, ACTIONS.idle(t, base.phase || 0));
  for (const s of sched) { const w = win(t, s.t0, s.t1, s.fi, s.fo, s.ob || 0); if (w <= 0) continue; add(J, ACTIONS[s.a](t, s), w); }
  return J;
}
