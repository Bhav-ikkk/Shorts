// Blocky Story Engine — Runtime World & Set Loader
// Generates 6 procedural 3D environments, sets, and props deterministically.
import * as THREE from 'three';
import { getMat } from './props.js';

const mcache = new Map();
export const getMaterial = (c, roughness = .7, metalness = 0, emissive = 0x000000) => {
  const key = `${c}_${roughness}_${metalness}_${emissive}`;
  let m = mcache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color: c, roughness, metalness, emissive });
    mcache.set(key, m);
  }
  return m;
};

export const box = (w, h, d, c, x, y, z, parent = null, roughness = .7, metalness = 0, emissive = 0x000000) => {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), getMaterial(c, roughness, metalness, emissive));
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
};

export const cyl = (r1, r2, h, c, x, y, z, seg = 24, parent = null, roughness = .7, metalness = 0, emissive = 0x000000) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), getMaterial(c, roughness, metalness, emissive));
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
};

const lerp = (a, b, u) => a + (b - a) * u;

// Shared Blob Shadow Generator
export function createBlobShadowFactory(scene) {
  let shT = null;
  const getTexture = () => {
    if (typeof document === 'undefined') return null;
    if (!shT) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 62);
      g.addColorStop(0, 'rgba(0,0,0,.45)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      shT = new THREE.CanvasTexture(cv);
    }
    return shT;
  };

  return (x, z, w, d = w, a = 1) => {
    const tex = getTexture();
    const mat = tex
      ? new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: a })
      : new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: a * 0.4 });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.rotation.x = -Math.PI / 2;
    m.scale.set(w, d, 1);
    m.position.set(x, .02, z);
    scene.add(m);
    return m;
  };
}

// 4 Lighting Moods
export function applyLightingMood(scene, mood = 'day') {
  if (mood === 'sunset') {
    scene.background = new THREE.Color(0xf472b6);
    scene.add(new THREE.HemisphereLight(0xfdf2f8, 0x831843, 0.95));
    const sun = new THREE.DirectionalLight(0xf97316, 2.4);
    sun.position.set(7, 3.5, 5);
    scene.add(sun);
  } else if (mood === 'night') {
    scene.background = new THREE.Color(0x090d16);
    scene.add(new THREE.HemisphereLight(0x1e293b, 0x020617, 0.45));
    const moon = new THREE.DirectionalLight(0x60a5fa, 1.2);
    moon.position.set(-4, 8, 4);
    scene.add(moon);
    const warm = new THREE.PointLight(0xfbbf24, 1.5, 6);
    warm.position.set(0, 2.2, 0);
    scene.add(warm);
  } else if (mood === 'obby') {
    scene.background = new THREE.Color(0x030712);
    scene.add(new THREE.HemisphereLight(0x312e81, 0x09090b, 0.7));
    const cyber = new THREE.DirectionalLight(0x06b6d4, 1.8);
    cyber.position.set(0, 7, 5);
    scene.add(cyber);
    const lavaBounce = new THREE.DirectionalLight(0xef4444, 1.4);
    lavaBounce.position.set(0, -2, 0);
    scene.add(lavaBounce);
  } else {
    // Default 'day'
    scene.background = new THREE.Color(0x9fd8e8);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc9b79a, 1.05));
    const sun = new THREE.DirectionalLight(0xfff3dc, 2.1);
    sun.position.set(4, 9, 7);
    scene.add(sun);
  }
}

/* =========================================================================
   SET 1: KITCHEN (Classic Episode 2 Prototype Set)
   ========================================================================= */
export function buildKitchenSet(scene, mood = 'day') {
  applyLightingMood(scene, mood);

  // Floor with procedural checkered tiles
  let fMat;
  if (typeof document !== 'undefined') {
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
    fMat = new THREE.MeshStandardMaterial({ map: t, roughness: .9 });
  } else {
    fMat = getMaterial(0xddb57f, 0.9);
  }
  const f = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), fMat);
  f.rotation.x = -Math.PI / 2;
  scene.add(f);

  // Back Wall & Window
  box(30, 8, .3, 0x55c7b6, 0, 4, -2.7, scene);
  box(30, .28, .4, 0x2f8f84, 0, .14, -2.5, scene);
  box(1.9, 1.6, .12, 0x3a2a1e, 1.15, 3.05, -2.52, scene);
  box(1.7, 1.4, .1, 0xbfe9ff, 1.15, 3.05, -2.44, scene);
  box(.1, 1.4, .12, 0x3a2a1e, 1.15, 3.05, -2.4, scene);
  box(1.7, .1, .12, 0x3a2a1e, 1.15, 3.05, -2.4, scene);

  // Cabinet & Fridge
  box(1.4, 2.2, .7, 0xb7794a, -2.2, 1.1, -2.2, scene);
  box(1.3, .1, .72, 0x8a5a36, -2.2, 1.5, -2.2, scene);
  box(.5, .5, .5, 0xe86a5a, -2.2, 2.45, -2.2, scene);
  box(.12, .5, .12, 0x3fae5a, -2.2, 2.9, -2.2, scene);
  box(1.7, 4.2, 1.3, 0xe8f1f5, 3.6, 2.1, -1.9, scene);
  box(.08, 1.2, .1, 0x8a98a5, 2.82, 2.7, -1.2, scene);
  box(.08, .8, .1, 0x8a98a5, 2.82, 1.2, -1.2, scene);
  box(1.7, .06, 1.32, 0xc7d4dc, 3.6, 2.95, -1.9, scene);
  box(.45, .45, .06, 0xffd21f, 3.3, 3.6, -1.22, scene);
  box(.4, .5, .06, 0xff6b6b, 3.95, 3.3, -1.22, scene);

  // Clock
  const clockG = new THREE.Group();
  clockG.position.set(-.6, 5.1, -2.52);
  scene.add(clockG);
  const face = cyl(.75, .75, .12, 0xffffff, 0, 0, 0, 32, clockG);
  face.rotation.x = Math.PI / 2;
  const rim = cyl(.82, .82, .1, 0x2a2a38, 0, 0, -.02, 32, clockG);
  rim.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * Math.PI * 2;
    box(.07, i % 3 ? .1 : .18, .05, 0x2a2a38, Math.sin(a) * .6, Math.cos(a) * .6, .08, clockG).rotation.z = -a;
  }
  const hMin = new THREE.Group(), hHr = new THREE.Group();
  clockG.add(hMin, hHr);
  box(.06, .5, .05, 0x2a2a38, 0, .22, .1, hMin);
  box(.08, .34, .05, 0xe86a5a, 0, .15, .12, hHr);

  // Table & Rug
  const r = cyl(2.9, 2.9, .03, 0xd96a5a, 0, .015, 1.2, 36, scene);
  r.scale.set(1, 1, .72);
  const r2 = cyl(2.5, 2.5, .035, 0xf2b8a8, 0, .02, 1.2, 36, scene);
  r2.scale.set(1, 1, .72);
  box(3.4, .22, 1.7, 0xc78a52, 0, 1.12, -1.0, scene);
  for (const [x, z] of [[-1.5, -.4], [1.5, -.4], [-1.5, -1.6], [1.5, -1.6]]) {
    box(.22, 1.0, .22, 0x9c6a3b, x, .5, z, scene);
  }

  // Plate & Cookies
  cyl(.62, .55, .07, 0xffffff, 0, 1.27, -1.0, 32, scene);
  cyl(.64, .64, .02, 0xdfe9f5, 0, 1.235, -1.0, 32, scene);
  const cookies = new THREE.Group();
  scene.add(cookies);
  for (const [x, z, rad] of [[-.2, -1.05, .27], [.24, -.92, .25]]) {
    cyl(rad, rad, .09, 0xc98a4b, x, 1.36, z, 20, cookies);
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

  const blob = createBlobShadowFactory(scene);
  blob(0, -.95, 4.4, 2.2, .75);

  const puff = new THREE.Group();
  scene.add(puff);
  puff.visible = false;
  const puffDirs = Array.from({ length: 12 }, (_, i) => {
    const a = i / 12 * Math.PI * 2;
    return [Math.cos(a), (i % 3) * .35 + .2, Math.sin(a) * .6];
  });
  puffDirs.forEach((_, i) => box(.14, .14, .14, i % 2 ? 0xffffff : 0xf4e9d2, 0, 0, 0, puff));

  return { cookies, tableCrumbs, hMin, hHr, blob, puff, puffDirs };
}

/* =========================================================================
   SET 2: BEDROOM (Cozy Study & Sleeping Quarters)
   ========================================================================= */
export function buildBedroomSet(scene, mood = 'day') {
  applyLightingMood(scene, mood);

  // Oak Parquet Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), getMaterial(0x854d0e, 0.8));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Soft Blue Walls
  box(24, 8, .3, 0x7dd3fc, 0, 4, -3.2, scene);
  box(24, .3, .4, 0x0369a1, 0, .15, -3.0, scene); // baseboard

  // Window overlooking sky
  box(2.2, 2.2, .14, 0x475569, 1.6, 3.4, -3.05, scene);
  box(2.0, 2.0, .1, 0xbae6fd, 1.6, 3.4, -3.0, scene);
  box(.1, 2.0, .12, 0x475569, 1.6, 3.4, -2.95, scene);
  box(2.0, .1, .12, 0x475569, 1.6, 3.4, -2.95, scene);

  // Bed with Mattress, Blanket and Pillow
  const bedG = new THREE.Group();
  bedG.position.set(-2.4, 0, -1.6);
  box(1.8, 0.36, 2.6, 0x78350f, 0, 0.18, 0, bedG, 0.04); // frame
  box(1.68, 0.28, 2.48, 0xf8fafc, 0, 0.45, 0, bedG, 0.05); // mattress
  box(1.7, 0.14, 1.7, 0x3b82f6, 0, 0.54, 0.36, bedG, 0.04); // blanket
  box(1.0, 0.12, 0.5, 0xe2e8f0, 0, 0.62, -0.82, bedG, 0.06); // pillow
  box(1.8, 1.0, 0.12, 0x78350f, 0, 0.65, -1.3, bedG, 0.04); // headboard
  scene.add(bedG);

  // Study Desk with Laptop & Lamp
  const deskG = new THREE.Group();
  deskG.position.set(2.0, 0, -1.2);
  box(2.0, 0.1, 1.0, 0xd97706, 0, 1.0, 0, deskG); // top
  box(0.1, 0.95, 0.9, 0xb45309, -0.95, 0.475, 0, deskG);
  box(0.1, 0.95, 0.9, 0xb45309, 0.95, 0.475, 0, deskG);
  // Laptop on desk
  box(0.5, 0.02, 0.36, 0x94a3b8, -0.2, 1.06, 0.1, deskG, 0.01, 0.7);
  const scr = box(0.5, 0.34, 0.02, 0x94a3b8, -0.2, 1.23, -0.07, deskG, 0.01, 0.7);
  scr.rotation.x = 0.25;
  box(0.46, 0.3, 0.01, 0x38bdf8, -0.2, 1.23, -0.06, deskG, 0.01, 0, 0x0284c7).rotation.x = 0.25;
  // Desk Lamp
  cyl(0.12, 0.14, 0.03, 0x1e293b, 0.6, 1.065, -0.2, 20, deskG);
  cyl(0.02, 0.02, 0.3, 0x94a3b8, 0.6, 1.215, -0.2, 12, deskG, 0.8);
  cyl(0.12, 0.06, 0.14, 0xf59e0b, 0.6, 1.38, -0.2, 20, deskG);
  cyl(0.05, 0.05, 0.02, 0xfef08a, 0.6, 1.34, -0.2, 16, deskG, 0, 0, 0xfef08a); // bulb glow
  scene.add(deskG);

  // Bookshelf against left wall
  const shelf = new THREE.Group();
  shelf.position.set(-0.2, 0, -2.8);
  box(1.6, 2.6, 0.4, 0x78350f, 0, 1.3, 0, shelf);
  for (const y of [0.7, 1.3, 1.9]) box(1.5, 0.06, 0.38, 0x92400e, 0, y, 0, shelf);
  const colors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706, 0x7c3aed, 0x0ea5e9];
  for (let i = 0; i < 6; i++) {
    box(0.07, 0.36, 0.3, colors[i], -0.5 + i * 0.14, 1.51, 0, shelf, 0.01);
  }
  scene.add(shelf);

  // Area Rug on floor
  box(3.2, 0.02, 2.2, 0xbe123c, 0, 0.01, 0.6, scene);
  box(2.8, 0.025, 1.8, 0xfef3c7, 0, 0.012, 0.6, scene);

  const blob = createBlobShadowFactory(scene);
  blob(-2.4, -1.6, 2.6, 3.2, 0.7); // under bed
  blob(2.0, -1.2, 2.4, 1.4, 0.65); // under desk

  return { blob };
}

/* =========================================================================
   SET 3: SCHOOL HALLWAY (Lockers, Classroom Doors, Fountain)
   ========================================================================= */
export function buildHallwaySet(scene, mood = 'day') {
  applyLightingMood(scene, mood);

  // Shiny Checkered Linoleum Floor
  let floorMat;
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#f1f5f9';
    x.fillRect(0, 0, 256, 256);
    x.fillStyle = '#cbd5e1';
    x.fillRect(0, 0, 128, 128);
    x.fillRect(128, 128, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(8, 8);
    floorMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.3 });
  } else {
    floorMat = getMaterial(0xcbd5e1, 0.4);
  }
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Hallway Back Wall & Baseboard
  box(24, 7, .3, 0xf8fafc, 0, 3.5, -2.8, scene);
  box(24, .3, .4, 0x0284c7, 0, .15, -2.6, scene);

  // Bank of Metal Lockers (Left Side)
  const lockers = new THREE.Group();
  lockers.position.set(-2.5, 0, -2.4);
  for (let i = 0; i < 5; i++) {
    const lx = (i - 2) * 0.65;
    box(0.62, 3.2, 0.5, 0x0284c7, lx, 1.6, 0, lockers, 0.02, 0.4); // locker body
    box(0.04, 0.3, 0.06, 0x0f172a, lx + 0.22, 1.6, 0.28, lockers); // handle
    // Vents
    for (let v = 0; v < 3; v++) {
      box(0.3, 0.02, 0.01, 0x0369a1, lx, 2.8 - v * 0.06, 0.26, lockers);
    }
  }
  scene.add(lockers);

  // Classroom Door (Right Side)
  const doorG = new THREE.Group();
  doorG.position.set(2.4, 0, -2.6);
  box(1.5, 3.4, 0.12, 0x78350f, 0, 1.7, 0, doorG, 0.02); // door frame
  box(1.36, 3.26, 0.08, 0x9a3412, 0, 1.7, 0.02, doorG, 0.02); // wood door
  cyl(0.04, 0.04, 0.06, 0xf59e0b, 0.5, 1.6, 0.08, 16, doorG, 0.8); // brass knob
  box(0.4, 0.16, 0.02, 0xf8fafc, 0, 2.7, 0.07, doorG); // room plaque
  box(0.3, 0.06, 0.025, 0x0f172a, 0, 2.7, 0.075, doorG); // "101"
  scene.add(doorG);

  // Water Fountain
  const fountain = new THREE.Group();
  fountain.position.set(0.4, 0, -2.4);
  box(0.5, 1.1, 0.4, 0x64748b, 0, 0.55, 0, fountain, 0.02, 0.5); // base
  box(0.55, 0.12, 0.45, 0x94a3b8, 0, 1.14, 0, fountain, 0.02, 0.7); // basin
  cyl(0.02, 0.02, 0.08, 0xcbd5e1, 0, 1.22, -0.1, 12, fountain, 0.9); // spout
  scene.add(fountain);

  // Overhead Fluorescent Lights
  for (const z of [-1.5, 1.0]) {
    box(2.0, 0.08, 0.6, 0xffffff, 0, 5.2, z, scene, 0.01, 0, 0xffffff);
  }

  const blob = createBlobShadowFactory(scene);
  blob(-2.5, -2.4, 3.6, 0.8, 0.7);

  return { blob };
}

/* =========================================================================
   SET 4: PARK / OUTDOORS (Rolling Grass, Trees, Path, Bench, Lamp)
   ========================================================================= */
export function buildParkSet(scene, mood = 'day') {
  applyLightingMood(scene, mood);

  // Vast Green Grass Terrain
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(32, 32), getMaterial(0x22c55e, 0.9));
  grass.rotation.x = -Math.PI / 2;
  scene.add(grass);

  // Winding Stone Cobblestone Path
  for (let z = -6; z <= 6; z += 0.8) {
    const x = Math.sin(z * 0.3) * 0.8;
    box(1.8, 0.04, 0.75, 0x94a3b8, x, 0.02, z, scene, 0.02);
  }

  // Helper: Low-poly Pine Tree
  const makePine = (px, pz, scale = 1) => {
    const tg = new THREE.Group();
    tg.position.set(px, 0, pz);
    cyl(0.18, 0.22, 1.2, 0x78350f, 0, 0.6, 0, 12, tg); // trunk
    cyl(0.1, 1.4, 1.4, 0x15803d, 0, 1.8, 0, 8, tg); // bottom foliage
    cyl(0.08, 1.1, 1.2, 0x16a34a, 0, 2.7, 0, 8, tg); // mid foliage
    cyl(0.02, 0.7, 1.0, 0x22c55e, 0, 3.5, 0, 8, tg); // top foliage
    tg.scale.setScalar(scale);
    scene.add(tg);
  };

  // Helper: Low-poly Oak Tree
  const makeOak = (px, pz, scale = 1) => {
    const tg = new THREE.Group();
    tg.position.set(px, 0, pz);
    cyl(0.24, 0.28, 1.4, 0x78350f, 0, 0.7, 0, 12, tg); // trunk
    box(2.2, 1.8, 2.2, 0x15803d, 0, 2.2, 0, tg, 0.4); // leafy cube
    box(1.6, 1.4, 1.6, 0x16a34a, 0, 3.1, 0, tg, 0.3);
    tg.scale.setScalar(scale);
    scene.add(tg);
  };

  makePine(-3.6, -3.2, 1.2);
  makePine(-4.2, 1.0, 1.0);
  makeOak(3.8, -2.8, 1.1);
  makePine(4.0, 2.2, 0.9);

  // Park Bench
  const bench = new THREE.Group();
  bench.position.set(1.8, 0, 0.5);
  bench.rotation.y = -0.4;
  box(2.0, 0.08, 0.6, 0xb45309, 0, 0.55, 0, bench, 0.02); // seat slats
  box(2.0, 0.5, 0.08, 0xb45309, 0, 0.85, -0.26, bench, 0.02); // backrest
  box(0.08, 0.55, 0.56, 0x1e293b, -0.9, 0.275, 0, bench); // iron leg L
  box(0.08, 0.55, 0.56, 0x1e293b, 0.9, 0.275, 0, bench); // iron leg R
  scene.add(bench);

  // Classic Street Lamp
  const lamp = new THREE.Group();
  lamp.position.set(-1.8, 0, 0.8);
  cyl(0.16, 0.2, 0.2, 0x0f172a, 0, 0.1, 0, 16, lamp); // base
  cyl(0.06, 0.06, 3.2, 0x0f172a, 0, 1.7, 0, 12, lamp); // pole
  box(0.4, 0.6, 0.4, 0x0f172a, 0, 3.4, 0, lamp, 0.05); // lantern frame
  const glowColor = mood === 'night' ? 0xff2222 : 0xfef08a;
  box(0.3, 0.45, 0.3, glowColor, 0, 3.4, 0, lamp, 0.02, 0, glowColor); // lantern glow
  scene.add(lamp);

  if (mood === 'night') {
    const lampLight = new THREE.PointLight(0xff2222, 2.8, 7);
    lampLight.position.set(-1.8, 3.4, 0.8);
    scene.add(lampLight);
  }

  // Scattered boulders & flowers
  box(0.6, 0.45, 0.7, 0x64748b, -2.8, 0.22, -1.2, scene, 0.1);
  box(0.4, 0.3, 0.45, 0x475569, 2.6, 0.15, -1.8, scene, 0.08);

  const blob = createBlobShadowFactory(scene);
  blob(1.8, 0.5, 2.2, 1.0, 0.6);
  blob(-1.8, 0.8, 0.8, 0.8, 0.65);

  return { blob };
}

/* =========================================================================
   SET 5: SPOOKY HOUSE / ATTIC (Creaky Wood, Chest, Boarded Window)
   ========================================================================= */
export function buildSpookyHouseSet(scene, mood = 'night') {
  applyLightingMood(scene, mood);

  // Weathered Creaky Floorboards
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), getMaterial(0x27272a, 0.9));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  // Decayed Wood Walls
  box(24, 8, .3, 0x18181b, 0, 4, -3.0, scene);
  box(24, .3, .4, 0x09090b, 0, .15, -2.8, scene);

  // Boarded-up Window with Moonlight streaming in
  const winG = new THREE.Group();
  winG.position.set(0, 3.5, -2.8);
  box(2.2, 2.2, 0.1, 0x09090b, 0, 0, 0, winG);
  box(2.0, 2.0, 0.05, 0x1e3a8a, 0, 0, 0.04, winG, 0, 0, 0x1e3a8a); // night glass
  // Wooden Planks nailed diagonally across
  box(2.5, 0.22, 0.08, 0x78350f, 0, 0.4, 0.08, winG).rotation.z = 0.25;
  box(2.4, 0.2, 0.08, 0x78350f, 0, -0.3, 0.08, winG).rotation.z = -0.2;
  scene.add(winG);

  // Antique Dusty Trunk / Chest
  const trunk = new THREE.Group();
  trunk.position.set(-1.8, 0, -1.2);
  trunk.rotation.y = 0.35;
  box(1.4, 0.6, 0.9, 0x451a03, 0, 0.3, 0, trunk, 0.04); // body
  box(1.44, 0.18, 0.94, 0x291001, 0, 0.65, 0, trunk, 0.04); // lid
  box(1.46, 0.06, 0.96, 0x71717a, 0, 0.3, 0, trunk, 0, 0.8); // iron strap
  box(0.12, 0.14, 0.04, 0xf59e0b, 0, 0.45, 0.48, trunk, 0.01, 0.9); // keyhole clasp
  scene.add(trunk);

  // Candelabra with Flickering Candle Flames
  const cand = new THREE.Group();
  cand.position.set(1.8, 0, -1.4);
  cyl(0.2, 0.24, 0.04, 0xca8a04, 0, 0.02, 0, 16, cand, 0.8); // stand
  cyl(0.04, 0.04, 1.2, 0xca8a04, 0, 0.62, 0, 12, cand, 0.8); // stem
  for (const [x, h] of [[-0.25, 1.2], [0, 1.35], [0.25, 1.2]]) {
    cyl(0.03, 0.03, 0.2, 0xfef3c7, x, h, 0, 12, cand); // candle wax
    box(0.04, 0.08, 0.04, 0xf59e0b, x, h + 0.14, 0, cand, 0.01, 0, 0xf59e0b); // flame
  }
  scene.add(cand);

  // Tilted Portrait on wall
  const pic = new THREE.Group();
  pic.position.set(-2.4, 3.6, -2.75);
  box(0.8, 1.1, 0.06, 0x27272a, 0, 0, 0, pic);
  box(0.68, 0.98, 0.02, 0x3f3f46, 0, 0, 0.035, pic);
  pic.rotation.z = -0.18; // crooked tilt!
  scene.add(pic);

  const blob = createBlobShadowFactory(scene);
  blob(-1.8, -1.2, 1.8, 1.2, 0.85);

  return { blob, trunk, cand };
}

/* =========================================================================
   SET 6: OBBY COURSE (Neon Void, Lava Floor, Floating Platforms, Checkpoint)
   ========================================================================= */
export function buildObbyCourseSet(scene, mood = 'obby') {
  applyLightingMood(scene, mood);

  // Boiling Red/Orange Lava Hazard Floor below
  const lava = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.2, emissive: 0xdc2626, emissiveIntensity: 0.85 })
  );
  lava.rotation.x = -Math.PI / 2;
  lava.position.y = -2.2;
  scene.add(lava);

  // Checkpoint Spawn Pad (Neon Cyan)
  const spawnPad = new THREE.Group();
  spawnPad.position.set(0, 0, 2.0);
  box(2.8, 0.3, 2.8, 0x0f172a, 0, -0.15, 0, spawnPad, 0.05); // dark base
  box(2.6, 0.04, 2.6, 0x06b6d4, 0, 0.02, 0, spawnPad, 0.02, 0, 0x06b6d4); // neon cyan top
  // Arrow direction marker
  box(0.4, 0.05, 1.2, 0xffffff, 0, 0.03, -0.2, spawnPad, 0.01, 0, 0xffffff);
  scene.add(spawnPad);

  // Floating Diamond Step Blocks (Magenta / Yellow)
  const steps = [
    { x: -1.4, y: 0.4, z: 0.4, color: 0xd946ef },
    { x: 0,    y: 0.8, z: -0.8, color: 0xeab308 },
    { x: 1.4,  y: 1.2, z: -2.0, color: 0x10b981 },
    { x: -0.8, y: 1.6, z: -3.2, color: 0xec4899 }
  ];

  for (const s of steps) {
    const pad = box(1.2, 0.25, 1.2, 0x1e1b4b, s.x, s.y - 0.125, s.z, scene, 0.04);
    box(1.1, 0.04, 1.1, s.color, s.x, s.y + 0.02, s.z, scene, 0.02, 0, s.color);
  }

  // Goal / Checkpoint Flag Pillar
  const goalG = new THREE.Group();
  goalG.position.set(0, 2.0, -4.6);
  box(2.4, 0.3, 2.4, 0x0f172a, 0, -0.15, 0, goalG, 0.05);
  box(2.2, 0.04, 2.2, 0x10b981, 0, 0.02, 0, goalG, 0.02, 0, 0x10b981); // neon green
  cyl(0.06, 0.06, 2.4, 0xf8fafc, -0.8, 1.2, 0.8, 12, goalG, 0.8); // flag pole
  box(0.8, 0.5, 0.02, 0xef4444, -0.4, 2.0, 0.8, goalG, 0.01, 0, 0xef4444); // red flag
  scene.add(goalG);

  // Rotating Hazard Spinner Bar (can be animated deterministically)
  const spinner = new THREE.Group();
  spinner.position.set(0, 0.8, -0.8);
  cyl(0.2, 0.2, 0.6, 0x334155, 0, 0.3, 0, 16, spinner);
  const bar = box(2.6, 0.2, 0.2, 0xef4444, 0, 0.5, 0, spinner, 0.02, 0, 0xef4444);
  scene.add(spinner);

  const blob = createBlobShadowFactory(scene);

  return { blob, spinner, spawnPad, goalG };
}

/* =========================================================================
   MASTER WORLD BUILDER DISPATCHER
   ========================================================================= */
export const SETS_REGISTRY = {
  kitchen: buildKitchenSet,
  bedroom: buildBedroomSet,
  hallway: buildHallwaySet,
  park: buildParkSet,
  spookyHouse: buildSpookyHouseSet,
  obby: buildObbyCourseSet
};

export function buildSet(name, scene, mood = 'day') {
  const builder = SETS_REGISTRY[name];
  if (!builder) {
    throw new Error(`[World System] Unknown set: "${name}". Available sets: ${Object.keys(SETS_REGISTRY).join(', ')}`);
  }
  return builder(scene, mood);
}
