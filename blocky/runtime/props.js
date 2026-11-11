// Blocky Story Engine — 40+ Procedural Primitive Props Library
// 100% offline, zero API keys, low-RAM, shared geometries & materials.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const matCache = new Map();
export const getMat = (color, roughness = 0.6, metalness = 0.0, emissive = 0x000000) => {
  const key = `${color}_${roughness}_${metalness}_${emissive}`;
  let m = matCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive });
    matCache.set(key, m);
  }
  return m;
};

const geoCache = new Map();
const getBoxGeo = (w, h, d, r = 0.04) => {
  const key = `box_${w}_${h}_${d}_${r}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new RoundedBoxGeometry(w, h, d, 2, r);
    geoCache.set(key, g);
  }
  return g;
};

const getCylGeo = (r1, r2, h, seg = 24) => {
  const key = `cyl_${r1}_${r2}_${h}_${seg}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.CylinderGeometry(r1, r2, h, seg);
    geoCache.set(key, g);
  }
  return g;
};

const boxMesh = (w, h, d, c, x = 0, y = 0, z = 0, parent = null, r = 0.04, matOpts = {}) => {
  const m = new THREE.Mesh(getBoxGeo(w, h, d, r), getMat(c, matOpts.roughness ?? 0.6, matOpts.metalness ?? 0.0, matOpts.emissive ?? 0x000000));
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
};

const cylMesh = (r1, r2, h, c, x = 0, y = 0, z = 0, seg = 24, parent = null, matOpts = {}) => {
  const m = new THREE.Mesh(getCylGeo(r1, r2, h, seg), getMat(c, matOpts.roughness ?? 0.6, matOpts.metalness ?? 0.0, matOpts.emissive ?? 0x000000));
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
};

/* =========================================================================
   CATEGORY 1: FOOD & DRINK (10 PROPS)
   ========================================================================= */

// 1. Cookie
export function makeCookie(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.24, 0.24, 0.06, 0xc98a4b, 0, 0.03, 0, 20, g);
  for (const [x, z] of [[-0.08, 0.06], [0.09, -0.05], [0.02, 0.1], [-0.09, -0.08], [0.11, 0.07]]) {
    boxMesh(0.05, 0.04, 0.05, 0x4a2a14, x, 0.065, z, g, 0.01);
  }
  g.scale.setScalar(scale);
  return g;
}

// 2. Plate
export function makePlate(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.55, 0.45, 0.06, 0xffffff, 0, 0.03, 0, 32, g, { roughness: 0.3 });
  cylMesh(0.42, 0.42, 0.02, 0xe2e8f0, 0, 0.06, 0, 32, g);
  g.scale.setScalar(scale);
  return g;
}

// 3. Pizza Slice
export function makePizzaSlice(scale = 1) {
  const g = new THREE.Group();
  // Triangular pizza base
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(-0.25, 0.6);
  shape.lineTo(0.25, 0.6);
  shape.closePath();
  const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.04, bevelEnabled: false });
  const base = new THREE.Mesh(geom, getMat(0xf6ad55, 0.6));
  base.rotation.x = -Math.PI / 2;
  g.add(base);
  // Crust
  boxMesh(0.54, 0.07, 0.08, 0xc05621, 0, 0.04, 0.6, g, 0.02);
  // Pepperonis
  for (const [x, z] of [[0, 0.25], [-0.09, 0.42], [0.08, 0.45]]) {
    cylMesh(0.05, 0.05, 0.02, 0x9b2c2c, x, 0.05, z, 16, g);
  }
  g.scale.setScalar(scale);
  return g;
}

// 4. Soda Can
export function makeSodaCan(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.12, 0.12, 0.36, 0xe53e3e, 0, 0.18, 0, 24, g, { metalness: 0.3, roughness: 0.3 });
  cylMesh(0.11, 0.11, 0.03, 0xcbd5e1, 0, 0.37, 0, 24, g, { metalness: 0.8 });
  cylMesh(0.11, 0.11, 0.02, 0xcbd5e1, 0, 0.01, 0, 24, g, { metalness: 0.8 });
  boxMesh(0.05, 0.01, 0.08, 0x94a3b8, 0.02, 0.39, 0.01, g, 0.01, { metalness: 0.9 });
  g.scale.setScalar(scale);
  return g;
}

// 5. Burger
export function makeBurger(scale = 1) {
  const g = new THREE.Group();
  // Bottom bun
  cylMesh(0.24, 0.22, 0.08, 0xdd6b20, 0, 0.04, 0, 24, g);
  // Patty
  cylMesh(0.25, 0.25, 0.06, 0x4a2a14, 0, 0.11, 0, 24, g);
  // Cheese
  const ch = boxMesh(0.32, 0.02, 0.32, 0xf6e05e, 0, 0.14, 0, g);
  ch.rotation.y = Math.PI / 4;
  // Lettuce
  cylMesh(0.26, 0.26, 0.02, 0x38a169, 0, 0.17, 0, 16, g);
  // Top bun
  cylMesh(0.24, 0.2, 0.1, 0xdd6b20, 0, 0.23, 0, 24, g);
  g.scale.setScalar(scale);
  return g;
}

// 6. Coffee Mug
export function makeCoffeeMug(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.15, 0.14, 0.3, 0x3182ce, 0, 0.15, 0, 24, g);
  cylMesh(0.13, 0.13, 0.02, 0x3d2314, 0, 0.28, 0, 20, g); // coffee liquid
  // Handle
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.03, 8, 16, Math.PI), getMat(0x3182ce));
  h.position.set(0.16, 0.15, 0);
  h.rotation.z = -Math.PI / 2;
  g.add(h);
  g.scale.setScalar(scale);
  return g;
}

// 7. Apple
export function makeApple(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.22, 0.24, 0.22, 0xe53e3e, 0, 0.12, 0, g, 0.08);
  cylMesh(0.02, 0.02, 0.09, 0x5a3a22, 0, 0.26, 0, 8, g); // stem
  boxMesh(0.06, 0.02, 0.04, 0x38a169, 0.04, 0.28, 0, g, 0.01); // leaf
  g.scale.setScalar(scale);
  return g;
}

// 8. Cake
export function makeCake(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.38, 0.38, 0.22, 0xfce7f3, 0, 0.11, 0, 32, g); // cake sponge
  cylMesh(0.39, 0.39, 0.05, 0xec4899, 0, 0.22, 0, 32, g); // icing
  // Candle
  cylMesh(0.02, 0.02, 0.14, 0x38bdf8, 0, 0.31, 0, 10, g);
  // Flame
  boxMesh(0.03, 0.05, 0.03, 0xfbbf24, 0, 0.4, 0, g, 0.01, { emissive: 0xf59e0b });
  g.scale.setScalar(scale);
  return g;
}

// 9. Ice Cream Cone
export function makeIceCream(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.12, 0.02, 0.32, 0xd97706, 0, 0.16, 0, 16, g); // cone
  boxMesh(0.22, 0.22, 0.22, 0xf472b6, 0, 0.38, 0, g, 0.09); // pink scoop
  boxMesh(0.06, 0.06, 0.06, 0xb91c1c, 0, 0.51, 0, g, 0.02); // cherry
  g.scale.setScalar(scale);
  return g;
}

// 10. Juice Box
export function makeJuiceBox(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.18, 0.28, 0.12, 0xf97316, 0, 0.14, 0, g, 0.02); // box
  cylMesh(0.012, 0.012, 0.16, 0xffffff, 0.04, 0.32, 0, 8, g); // straw
  cylMesh(0.012, 0.012, 0.06, 0xffffff, 0.06, 0.38, 0, 8, g).rotation.z = Math.PI / 4;
  g.scale.setScalar(scale);
  return g;
}

/* =========================================================================
   CATEGORY 2: TOOLS & GADGETS (10 PROPS)
   ========================================================================= */

// 11. Flashlight
export function makeFlashlight(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.05, 0.05, 0.28, 0x1e293b, 0, 0.14, 0, 16, g, { metalness: 0.5 });
  cylMesh(0.09, 0.06, 0.1, 0x3b82f6, 0, 0.31, 0, 16, g); // head
  cylMesh(0.08, 0.08, 0.02, 0xfef08a, 0, 0.36, 0, 16, g, { emissive: 0xfef08a }); // lens
  boxMesh(0.03, 0.04, 0.02, 0xef4444, 0, 0.18, 0.05, g, 0.01); // switch
  g.scale.setScalar(scale);
  return g;
}

// 12. Laptop
export function makeLaptop(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.5, 0.02, 0.36, 0x94a3b8, 0, 0.01, 0, g, 0.01, { metalness: 0.7 }); // base
  boxMesh(0.42, 0.01, 0.16, 0x1e293b, 0, 0.025, 0.04, g, 0.01); // keyboard
  // Screen
  const screen = new THREE.Group();
  screen.position.set(0, 0.02, -0.17);
  boxMesh(0.5, 0.34, 0.02, 0x94a3b8, 0, 0.17, 0, screen, 0.01, { metalness: 0.7 });
  boxMesh(0.46, 0.3, 0.01, 0x38bdf8, 0, 0.17, 0.012, screen, 0.01, { emissive: 0x0284c7 });
  screen.rotation.x = 0.25;
  g.add(screen);
  g.scale.setScalar(scale);
  return g;
}

// 13. Smartphone
export function makeSmartphone(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.18, 0.36, 0.02, 0x0f172a, 0, 0.18, 0, g, 0.02, { metalness: 0.8 }); // body
  boxMesh(0.16, 0.33, 0.005, 0x38bdf8, 0, 0.18, 0.011, g, 0.01, { emissive: 0x0369a1 }); // screen
  boxMesh(0.04, 0.08, 0.008, 0x334155, -0.05, 0.3, -0.011, g, 0.01); // camera bump
  g.scale.setScalar(scale);
  return g;
}

// 14. Walkie-Talkie
export function makeWalkieTalkie(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.16, 0.32, 0.08, 0x334155, 0, 0.16, 0, g, 0.02);
  cylMesh(0.015, 0.01, 0.24, 0x0f172a, 0.05, 0.44, 0, 12, g); // antenna
  cylMesh(0.025, 0.025, 0.04, 0x0f172a, -0.04, 0.34, 0, 12, g); // knob
  boxMesh(0.1, 0.08, 0.01, 0x475569, 0, 0.22, 0.041, g, 0.01); // speaker grill
  g.scale.setScalar(scale);
  return g;
}

// 15. Key
export function makeKey(scale = 1) {
  const g = new THREE.Group();
  // Key ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 20), getMat(0xf59e0b, 0.3, 0.9));
  ring.position.set(0, 0.08, 0);
  g.add(ring);
  // Shaft
  cylMesh(0.02, 0.02, 0.24, 0xf59e0b, 0, 0.24, 0, 12, g, { metalness: 0.9, roughness: 0.3 });
  // Teeth
  boxMesh(0.04, 0.03, 0.02, 0xf59e0b, 0.03, 0.32, 0, g, 0.01, { metalness: 0.9 });
  boxMesh(0.03, 0.03, 0.02, 0xf59e0b, 0.025, 0.26, 0, g, 0.01, { metalness: 0.9 });
  g.scale.setScalar(scale);
  return g;
}

// 16. Magnifying Glass
export function makeMagnifyingGlass(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.025, 0.025, 0.28, 0x854d0e, 0, 0.14, 0, 12, g); // handle
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.02, 10, 24), getMat(0xd97706, 0.3, 0.8));
  rim.position.set(0, 0.41, 0);
  g.add(rim);
  cylMesh(0.14, 0.14, 0.01, 0xbae6fd, 0, 0.41, 0, 24, g, { roughness: 0.1, transparent: true, opacity: 0.7 });
  g.scale.setScalar(scale);
  return g;
}

// 17. Wrench
export function makeWrench(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.06, 0.42, 0.03, 0x94a3b8, 0, 0.21, 0, g, 0.01, { metalness: 0.85, roughness: 0.3 });
  // Jaw
  const jaw = cylMesh(0.09, 0.09, 0.03, 0x94a3b8, 0, 0.44, 0, 16, g, { metalness: 0.85 });
  boxMesh(0.08, 0.08, 0.04, 0x000000, 0, 0.46, 0, g); // cutout
  g.scale.setScalar(scale);
  return g;
}

// 18. Game Controller
export function makeController(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.38, 0.18, 0.06, 0x1e293b, 0, 0.09, 0, g, 0.04);
  // Grips
  boxMesh(0.08, 0.14, 0.06, 0x1e293b, -0.16, 0.02, 0, g, 0.03).rotation.z = 0.25;
  boxMesh(0.08, 0.14, 0.06, 0x1e293b, 0.16, 0.02, 0, g, 0.03).rotation.z = -0.25;
  // D-pad & Buttons
  boxMesh(0.06, 0.02, 0.02, 0x475569, -0.09, 0.11, 0.035, g);
  boxMesh(0.02, 0.06, 0.02, 0x475569, -0.09, 0.11, 0.035, g);
  for (const [x, y, c] of [[0.07, 0.13, 0xef4444], [0.11, 0.11, 0x3b82f6], [0.07, 0.09, 0x10b981], [0.03, 0.11, 0xfbbf24]]) {
    cylMesh(0.015, 0.015, 0.01, c, x, y, 0.035, 12, g);
  }
  g.scale.setScalar(scale);
  return g;
}

// 19. Camera
export function makeCamera(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.36, 0.22, 0.14, 0x334155, 0, 0.11, 0, g, 0.03); // body
  boxMesh(0.36, 0.06, 0.142, 0x94a3b8, 0, 0.19, 0, g, 0.02, { metalness: 0.8 }); // silver top plate
  cylMesh(0.08, 0.08, 0.1, 0x0f172a, 0, 0.11, 0.1, 24, g); // lens cylinder
  cylMesh(0.06, 0.06, 0.01, 0x38bdf8, 0, 0.11, 0.155, 24, g, { emissive: 0x0284c7 }); // lens glass
  cylMesh(0.025, 0.025, 0.03, 0xef4444, 0.1, 0.23, 0, 12, g); // shutter
  g.scale.setScalar(scale);
  return g;
}

// 20. Battery
export function makeBattery(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.06, 0.06, 0.2, 0x16a34a, 0, 0.1, 0, 16, g); // body
  cylMesh(0.06, 0.06, 0.06, 0xca8a04, 0, 0.18, 0, 16, g, { metalness: 0.8 }); // gold top
  cylMesh(0.02, 0.02, 0.03, 0x94a3b8, 0, 0.22, 0, 12, g, { metalness: 0.9 }); // positive terminal
  g.scale.setScalar(scale);
  return g;
}

/* =========================================================================
   CATEGORY 3: SCHOOL & OFFICE (10 PROPS)
   ========================================================================= */

// 21. Backpack
export function makeBackpack(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.42, 0.54, 0.26, 0x2563eb, 0, 0.27, 0, g, 0.08); // main bag
  boxMesh(0.32, 0.26, 0.12, 0x1d4ed8, 0, 0.16, 0.16, g, 0.05); // front pocket
  boxMesh(0.06, 0.36, 0.02, 0x1e3a8a, -0.12, 0.28, -0.14, g); // strap L
  boxMesh(0.06, 0.36, 0.02, 0x1e3a8a, 0.12, 0.28, -0.14, g); // strap R
  g.scale.setScalar(scale);
  return g;
}

// 22. Pencil
export function makePencil(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.02, 0.02, 0.38, 0xeab308, 0, 0.19, 0, 6, g); // yellow shaft
  cylMesh(0.02, 0.002, 0.08, 0xfde047, 0, 0.42, 0, 6, g); // wood tip
  cylMesh(0.006, 0.001, 0.03, 0x1e293b, 0, 0.45, 0, 6, g); // graphite
  cylMesh(0.021, 0.021, 0.04, 0x94a3b8, 0, 0.02, 0, 12, g, { metalness: 0.8 }); // ferrule
  cylMesh(0.02, 0.02, 0.04, 0xf43f5e, 0, -0.02, 0, 12, g); // eraser
  g.scale.setScalar(scale);
  return g;
}

// 23. Notebook
export function makeNotebook(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.34, 0.44, 0.04, 0x0ea5e9, 0, 0.22, 0, g, 0.02); // cover
  boxMesh(0.32, 0.42, 0.035, 0xffffff, 0.01, 0.22, 0, g); // pages
  cylMesh(0.015, 0.015, 0.44, 0x334155, -0.17, 0.22, 0, 12, g, { metalness: 0.7 }); // spiral
  g.scale.setScalar(scale);
  return g;
}

// 24. Book Stack
export function makeBookStack(scale = 1) {
  const g = new THREE.Group();
  const colors = [0xd97706, 0x2563eb, 0xdc2626];
  for (let i = 0; i < 3; i++) {
    const b = boxMesh(0.36, 0.07, 0.48, colors[i], 0, 0.035 + i * 0.075, 0, g, 0.02);
    b.rotation.y = (i - 1) * 0.08;
  }
  g.scale.setScalar(scale);
  return g;
}

// 25. Trophy
export function makeTrophy(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.24, 0.12, 0.24, 0x1e293b, 0, 0.06, 0, g, 0.02); // base
  cylMesh(0.04, 0.06, 0.12, 0xf59e0b, 0, 0.18, 0, 16, g, { metalness: 0.9, roughness: 0.2 }); // stem
  cylMesh(0.18, 0.12, 0.26, 0xfbbf24, 0, 0.35, 0, 24, g, { metalness: 0.9, roughness: 0.2 }); // cup
  // Handles
  for (const s of [-1, 1]) {
    const h = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI), getMat(0xfbbf24, 0.2, 0.9));
    h.position.set(s * 0.18, 0.36, 0);
    h.rotation.z = s * Math.PI / 2;
    g.add(h);
  }
  g.scale.setScalar(scale);
  return g;
}

// 26. Desk Globe
export function makeGlobe(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.14, 0.16, 0.04, 0x475569, 0, 0.02, 0, 20, g, { metalness: 0.6 }); // base
  cylMesh(0.02, 0.02, 0.18, 0x94a3b8, 0, 0.11, 0, 12, g, { metalness: 0.8 }); // arm
  // Sphere
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 20), getMat(0x0284c7, 0.4));
  sphere.position.set(0, 0.3, 0);
  g.add(sphere);
  // Continents (procedural green patches)
  boxMesh(0.1, 0.08, 0.19, 0x16a34a, 0, 0.32, 0.05, g, 0.02);
  g.scale.setScalar(scale);
  return g;
}

// 27. Wall Clock
export function makeWallClock(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.38, 0.38, 0.06, 0xffffff, 0, 0, 0, 32, g); // face
  cylMesh(0.41, 0.41, 0.05, 0x1e293b, 0, 0, -0.01, 32, g); // frame
  boxMesh(0.02, 0.18, 0.01, 0x0f172a, 0, 0.08, 0.035, g); // minute hand
  boxMesh(0.025, 0.12, 0.01, 0xef4444, 0.04, 0.04, 0.036, g); // hour hand
  g.scale.setScalar(scale);
  return g;
}

// 28. Document Folder
export function makeFolder(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.34, 0.44, 0.03, 0xf59e0b, 0, 0.22, 0, g, 0.02);
  boxMesh(0.1, 0.06, 0.03, 0xf59e0b, 0.1, 0.46, 0, g, 0.01); // tab
  boxMesh(0.3, 0.4, 0.01, 0xffffff, 0, 0.22, 0.016, g); // paper
  g.scale.setScalar(scale);
  return g;
}

// 29. Scissors
export function makeScissors(scale = 1) {
  const g = new THREE.Group();
  // Blades
  boxMesh(0.03, 0.24, 0.01, 0xcbd5e1, 0.02, 0.22, 0, g, 0.005, { metalness: 0.9 }).rotation.z = -0.15;
  boxMesh(0.03, 0.24, 0.01, 0xcbd5e1, -0.02, 0.22, 0.005, g, 0.005, { metalness: 0.9 }).rotation.z = 0.15;
  // Handles
  for (const [x, s] of [[-0.06, 1], [0.06, -1]]) {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 8, 16), getMat(0xef4444));
    loop.position.set(x, 0.05, 0);
    g.add(loop);
  }
  g.scale.setScalar(scale);
  return g;
}

// 30. Wooden Ruler
export function makeRuler(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.08, 0.6, 0.01, 0xd97706, 0, 0.3, 0, g, 0.01);
  for (let i = 0; i < 10; i++) {
    boxMesh(0.03, 0.005, 0.005, 0x451a03, 0.02, 0.06 + i * 0.055, 0.006, g);
  }
  g.scale.setScalar(scale);
  return g;
}

/* =========================================================================
   CATEGORY 4: FURNITURE & DECOR (10 PROPS)
   ========================================================================= */

// 31. Dining Table
export function makeTable(scale = 1) {
  const g = new THREE.Group();
  boxMesh(2.4, 0.14, 1.4, 0xb45309, 0, 1.0, 0, g, 0.04); // surface
  for (const [x, z] of [[-1.0, -0.5], [1.0, -0.5], [-1.0, 0.5], [1.0, 0.5]]) {
    boxMesh(0.12, 0.93, 0.12, 0x92400e, x, 0.465, z, g, 0.02);
  }
  g.scale.setScalar(scale);
  return g;
}

// 32. Wooden Chair
export function makeChair(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.65, 0.08, 0.65, 0xb45309, 0, 0.54, 0, g, 0.02); // seat
  for (const [x, z] of [[-0.26, -0.26], [0.26, -0.26], [-0.26, 0.26], [0.26, 0.26]]) {
    boxMesh(0.08, 0.5, 0.08, 0x92400e, x, 0.25, z, g); // legs
  }
  // Backrest
  boxMesh(0.65, 0.6, 0.08, 0xb45309, 0, 0.88, -0.28, g, 0.02);
  g.scale.setScalar(scale);
  return g;
}

// 33. Bed
export function makeBed(scale = 1) {
  const g = new THREE.Group();
  boxMesh(1.6, 0.32, 2.4, 0x78350f, 0, 0.16, 0, g, 0.04); // wood frame
  boxMesh(1.48, 0.24, 2.28, 0xf8fafc, 0, 0.4, 0, g, 0.05); // mattress
  boxMesh(1.5, 0.12, 1.6, 0x3b82f6, 0, 0.47, 0.34, g, 0.04); // blue blanket
  boxMesh(0.9, 0.1, 0.46, 0xe2e8f0, 0, 0.55, -0.76, g, 0.06); // pillow
  boxMesh(1.6, 0.8, 0.1, 0x78350f, 0, 0.55, -1.2, g, 0.04); // headboard
  g.scale.setScalar(scale);
  return g;
}

// 34. Desk Lamp
export function makeDeskLamp(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.12, 0.14, 0.03, 0x1e293b, 0, 0.015, 0, 20, g); // base
  cylMesh(0.02, 0.02, 0.28, 0x94a3b8, 0, 0.15, 0, 12, g, { metalness: 0.8 }); // arm
  cylMesh(0.12, 0.06, 0.14, 0x38bdf8, 0, 0.32, 0, 20, g); // lampshade
  cylMesh(0.04, 0.04, 0.02, 0xfef08a, 0, 0.28, 0, 16, g, { emissive: 0xfef08a }); // bulb
  g.scale.setScalar(scale);
  return g;
}

// 35. Study Desk
export function makeStudyDesk(scale = 1) {
  const g = new THREE.Group();
  boxMesh(1.8, 0.1, 0.9, 0xd97706, 0, 0.95, 0, g, 0.03); // desktop
  boxMesh(0.1, 0.9, 0.8, 0xb45309, -0.85, 0.45, 0, g); // side leg L
  boxMesh(0.1, 0.9, 0.8, 0xb45309, 0.85, 0.45, 0, g); // side leg R
  boxMesh(0.5, 0.5, 0.75, 0x92400e, 0.55, 0.65, 0, g, 0.02); // drawers
  boxMesh(0.12, 0.03, 0.03, 0x1e293b, 0.55, 0.75, 0.39, g); // handle 1
  boxMesh(0.12, 0.03, 0.03, 0x1e293b, 0.55, 0.55, 0.39, g); // handle 2
  g.scale.setScalar(scale);
  return g;
}

// 36. Area Rug
export function makeAreaRug(scale = 1) {
  const g = new THREE.Group();
  boxMesh(2.2, 0.02, 1.6, 0x991b1b, 0, 0.01, 0, g, 0.04);
  boxMesh(1.9, 0.025, 1.3, 0xfef3c7, 0, 0.012, 0, g, 0.02);
  g.scale.setScalar(scale);
  return g;
}

// 37. Wall Portrait
export function makeWallPortrait(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.8, 1.1, 0.06, 0x78350f, 0, 0.55, 0, g, 0.03); // frame
  boxMesh(0.68, 0.98, 0.01, 0x38bdf8, 0, 0.55, 0.035, g); // art canvas
  boxMesh(0.4, 0.3, 0.012, 0x16a34a, 0, 0.45, 0.036, g); // mountains
  cylMesh(0.08, 0.08, 0.012, 0xfbbf24, 0.16, 0.75, 0.036, 16, g); // sun
  g.scale.setScalar(scale);
  return g;
}

// 38. Bookshelf
export function makeBookshelf(scale = 1) {
  const g = new THREE.Group();
  boxMesh(1.4, 2.2, 0.4, 0x78350f, 0, 1.1, 0, g, 0.04); // frame
  // Shelves
  for (const y of [0.6, 1.1, 1.6]) {
    boxMesh(1.3, 0.06, 0.38, 0x92400e, 0, y, 0, g);
  }
  // Books on middle shelf
  const colors = [0xdc2626, 0x2563eb, 0x16a34a, 0xd97706, 0x7c3aed];
  for (let i = 0; i < 5; i++) {
    boxMesh(0.06, 0.32, 0.3, colors[i], -0.4 + i * 0.12, 1.28, 0, g, 0.01);
  }
  g.scale.setScalar(scale);
  return g;
}

// 39. Potted Plant
export function makePottedPlant(scale = 1) {
  const g = new THREE.Group();
  cylMesh(0.2, 0.14, 0.3, 0xc2410c, 0, 0.15, 0, 20, g); // terracotta pot
  cylMesh(0.18, 0.18, 0.04, 0x3f2e21, 0, 0.28, 0, 16, g); // soil
  // Leaves
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const leaf = boxMesh(0.14, 0.28, 0.02, 0x15803d, Math.sin(a) * 0.1, 0.4, Math.cos(a) * 0.1, g, 0.02);
    leaf.rotation.set(Math.cos(a) * 0.4, a, Math.sin(a) * 0.4);
  }
  g.scale.setScalar(scale);
  return g;
}

// 40. Wooden Crate
export function makeWoodenCrate(scale = 1) {
  const g = new THREE.Group();
  boxMesh(0.7, 0.7, 0.7, 0xb45309, 0, 0.35, 0, g, 0.04);
  // Cross slats
  boxMesh(0.72, 0.1, 0.72, 0x92400e, 0, 0.35, 0, g, 0.02);
  boxMesh(0.1, 0.72, 0.72, 0x92400e, 0, 0.35, 0, g, 0.02);
  g.scale.setScalar(scale);
  return g;
}

/* =========================================================================
   PROPS REGISTRY DICTIONARY
   ========================================================================= */
export const PROPS_REGISTRY = {
  // Food & Drink
  cookie: makeCookie,
  plate: makePlate,
  pizzaSlice: makePizzaSlice,
  sodaCan: makeSodaCan,
  burger: makeBurger,
  coffeeMug: makeCoffeeMug,
  apple: makeApple,
  cake: makeCake,
  iceCream: makeIceCream,
  juiceBox: makeJuiceBox,

  // Tools & Gadgets
  flashlight: makeFlashlight,
  laptop: makeLaptop,
  smartphone: makeSmartphone,
  walkieTalkie: makeWalkieTalkie,
  key: makeKey,
  magnifyingGlass: makeMagnifyingGlass,
  wrench: makeWrench,
  controller: makeController,
  camera: makeCamera,
  battery: makeBattery,

  // School & Office
  backpack: makeBackpack,
  pencil: makePencil,
  notebook: makeNotebook,
  bookStack: makeBookStack,
  trophy: makeTrophy,
  globe: makeGlobe,
  wallClock: makeWallClock,
  folder: makeFolder,
  scissors: makeScissors,
  ruler: makeRuler,

  // Furniture & Decor
  table: makeTable,
  chair: makeChair,
  bed: makeBed,
  deskLamp: makeDeskLamp,
  studyDesk: makeStudyDesk,
  areaRug: makeAreaRug,
  wallPortrait: makeWallPortrait,
  bookshelf: makeBookshelf,
  pottedPlant: makePottedPlant,
  woodenCrate: makeWoodenCrate
};

export function spawnProp(name, scale = 1) {
  const factory = PROPS_REGISTRY[name];
  if (!factory) {
    throw new Error(`[Prop System] Unknown prop: "${name}". Available: ${Object.keys(PROPS_REGISTRY).join(', ')}`);
  }
  return factory(scale);
}
