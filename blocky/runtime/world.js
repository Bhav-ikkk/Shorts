// Blocky Story Engine — Runtime World & Set Loader
// Generates procedural 3D environments, sets, and props deterministically.
import * as THREE from 'three';

const mcache = new Map();
export const getMaterial = (c, roughness = .7) => {
  const key = `${c}_${roughness}`;
  let m = mcache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, roughness });
    mcache.set(key, m);
  }
  return m;
};

export const box = (w, h, d, c, x, y, z, parent) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), getMaterial(c));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
};

export const cyl = (r1, r2, h, c, x, y, z, seg = 32, parent) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), getMaterial(c));
  m.position.set(x, y, z);
  parent.add(m);
  return m;
};

const lerp = (a, b, u) => a + (b - a) * u;

export function buildKitchenSet(scene) {
  // 1. Lighting
  scene.background = new THREE.Color(0x9fd8e8);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b79a, 1.05));
  const sun = new THREE.DirectionalLight(0xfff3dc, 2.1);
  sun.position.set(4, 9, 7);
  scene.add(sun);

  // 2. Floor with procedural checkered wood tiles
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const x = c.getContext('2d');
  x.fillStyle = '#E9C99B';
  x.fillRect(0, 0, 256, 256);
  x.fillStyle = '#DDB57F';
  x.fillRect(0, 0, 128, 128);
  x.fillRect(128, 128, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshStandardMaterial({ map: t, roughness: .9 }));
  f.rotation.x = -Math.PI / 2;
  scene.add(f);

  // 3. Walls & Architecture
  box(30, 8, .3, 0x55c7b6, 0, 4, -2.7, scene);
  box(30, .28, .4, 0x2f8f84, 0, .14, -2.5, scene); // back wall + baseboard
  box(1.9, 1.6, .12, 0x3a2a1e, 1.15, 3.05, -2.52, scene);
  box(1.7, 1.4, .1, 0xbfe9ff, 1.15, 3.05, -2.44, scene);
  box(.1, 1.4, .12, 0x3a2a1e, 1.15, 3.05, -2.4, scene);
  box(1.7, .1, .12, 0x3a2a1e, 1.15, 3.05, -2.4, scene); // window frame

  // 4. Kitchen Cabinet & Fridge
  box(1.4, 2.2, .7, 0xb7794a, -2.2, 1.1, -2.2, scene);
  box(1.3, .1, .72, 0x8a5a36, -2.2, 1.5, -2.2, scene); // cabinet
  box(.5, .5, .5, 0xe86a5a, -2.2, 2.45, -2.2, scene);
  box(.12, .5, .12, 0x3fae5a, -2.2, 2.9, -2.2, scene); // pot + plant stem
  box(1.7, 4.2, 1.3, 0xe8f1f5, 3.6, 2.1, -1.9, scene);
  box(.08, 1.2, .1, 0x8a98a5, 2.82, 2.7, -1.2, scene);
  box(.08, .8, .1, 0x8a98a5, 2.82, 1.2, -1.2, scene);
  box(1.7, .06, 1.32, 0xc7d4dc, 3.6, 2.95, -1.9, scene); // fridge + handles
  box(.45, .45, .06, 0xffd21f, 3.3, 3.6, -1.22, scene);
  box(.4, .5, .06, 0xff6b6b, 3.95, 3.3, -1.22, scene); // fridge magnets

  // 5. Wall Clock with time-driven hands
  const clockG = new THREE.Group();
  clockG.position.set(-.6, 5.1, -2.52);
  scene.add(clockG);
  const face = cyl(.75, .75, .12, 0xffffff, 0, 0, 0, 40, clockG);
  face.rotation.x = Math.PI / 2;
  const rim = cyl(.82, .82, .1, 0x2a2a38, 0, 0, -.02, 40, clockG);
  rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    box(.07, i % 3 ? .1 : .18, .05, 0x2a2a38, Math.sin(a) * .6, Math.cos(a) * .6, .08, clockG).rotation.z = -a;
  }
  const hMin = new THREE.Group(), hHr = new THREE.Group();
  clockG.add(hMin, hHr);
  box(.06, .5, .05, 0x2a2a38, 0, .22, .1, hMin);
  box(.08, .34, .05, 0xe86a5a, 0, .15, .12, hHr);

  // 6. Dining Table & Rug
  const r = cyl(2.9, 2.9, .03, 0xd96a5a, 0, .015, 1.2, 48, scene);
  r.scale.set(1, 1, .72);
  const r2 = cyl(2.5, 2.5, .035, 0xf2b8a8, 0, .02, 1.2, 48, scene);
  r2.scale.set(1, 1, .72);
  box(3.4, .22, 1.7, 0xc78a52, 0, 1.12, -1.0, scene);
  for (const [x, z] of [[-1.5, -.4], [1.5, -.4], [-1.5, -1.6], [1.5, -1.6]]) {
    box(.22, 1.0, .22, 0x9c6a3b, x, .5, z, scene);
  }

  // 7. Plate, Cookies & Crumbs
  cyl(.62, .55, .07, 0xffffff, 0, 1.27, -1.0, 40, scene);
  cyl(.64, .64, .02, 0xdfe9f5, 0, 1.235, -1.0, 40, scene);

  const cookies = new THREE.Group();
  scene.add(cookies);
  for (const [x, z, rad] of [[-.2, -1.05, .27], [.24, -.92, .25]]) {
    const d = cyl(rad, rad, .09, 0xc98a4b, x, 1.36, z, 24, cookies);
    for (let i = 0; i < 5; i++) {
      box(.07, .05, .07, 0x4a2a14, x + Math.cos(i * 1.7) * rad * .55, 1.42, z + Math.sin(i * 1.7) * rad * .55, cookies);
    }
  }

  const tableCrumbs = new THREE.Group();
  scene.add(tableCrumbs);
  for (const [x, z, s] of [[-.2, -.9, .07], [.1, -1.1, .06], [.25, -.8, .05], [-.05, -1.2, .05], [.35, -1.05, .06], [-.3, -1.1, .04]]) {
    const cr = box(s, s * .8, s, 0x6b3d1d, x, 1.31, z, tableCrumbs);
    cr.rotation.y = x * 7;
  }

  // Floor crumb trail winding toward table
  const pts = [[-1.2, 3.4], [-.9, 2.8], [-.5, 2.3], [-.1, 1.9], [.25, 1.5], [.35, 1.1], [.15, .7], [0, .3], [0, -.1], [0, -.5]];
  let q = 0;
  for (let i = 0; i < pts.length; i++) {
    for (let j = 0; j < 2; j++) {
      const a = pts[i], b = pts[Math.min(i + 1, pts.length - 1)], u = j * .5;
      q++;
      const s = .06 + ((q * 37) % 5) * .012;
      const cr = box(s, s * .7, s, 0x6b3d1d, lerp(a[0], b[0], u) + (((q * 53) % 7) - 3) * .035, s * .35, lerp(a[1], b[1], u) + (((q * 29) % 7) - 3) * .035, scene);
      cr.rotation.y = q;
    }
  }

  // Blob shadows (cheap, low RAM/GPU)
  const shT = (() => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const ctx = cv.getContext('2d');
    const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,.45)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(cv);
  })();

  const blob = (x, z, w, d = w, a = 1) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shT, transparent: true, depthWrite: false, opacity: a }));
    m.rotation.x = -Math.PI / 2;
    m.scale.set(w, d, 1);
    m.position.set(x, .02, z);
    scene.add(m);
    return m;
  };
  blob(0, -.95, 4.4, 2.2, .75); // under table shadow

  // Puff (dust explosion cubes)
  const puff = new THREE.Group();
  scene.add(puff);
  puff.visible = false;
  const puffDirs = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * Math.PI * 2;
    return [Math.cos(a), (i % 3) * .35 + .2, Math.sin(a) * .6];
  });
  puffDirs.forEach((_, i) => {
    box(.14, .14, .14, i % 2 ? 0xffffff : 0xf4e9d2, 0, 0, 0, puff);
  });

  return {
    cookies,
    tableCrumbs,
    hMin,
    hHr,
    blob,
    puff,
    puffDirs
  };
}
