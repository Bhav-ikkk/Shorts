// Blocky Story Engine — Sets & Props Showcase Runner
import * as THREE from 'three';
import { makeChar, compose, EMOTIONS } from '../runtime/char.js';
import { buildSet } from '../runtime/world.js';
import { spawnProp } from '../runtime/props.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);

const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 100);

// Pre-create the 6 isolated scenes and sets for seamless deterministic time-seeking
const SETS_DATA = [
  {
    id: 'kitchen',
    name: 'KITCHEN SET',
    mood: 'day',
    badge: 'DINING TABLE · FRIDGE · WALL CLOCK · COOKIES & CRUMBS',
    camPos: [0, 2.2, 5.8],
    camTarget: [0, 1.2, -0.6],
    setup: (scene, pip, mox) => {
      const world = buildSet('kitchen', scene, 'day');
      pip.root.position.set(-1.0, 0, 0.4);
      pip.root.rotation.y = 0.5;
      pip.setFace(EMOTIONS.happy);

      mox.root.position.set(1.0, 0, 0.4);
      mox.root.rotation.y = -0.5;
      mox.setFace(EMOTIONS.suspicious);

      // Props on table
      const burger = spawnProp('burger', 1.2);
      burger.position.set(-0.6, 1.23, -0.9);
      scene.add(burger);

      const soda = spawnProp('sodaCan', 1.1);
      soda.position.set(0.6, 1.23, -0.9);
      scene.add(soda);

      return world;
    }
  },
  {
    id: 'bedroom',
    name: 'BEDROOM SET',
    mood: 'sunset',
    badge: 'STUDY DESK · LAPTOP · LAMP · BED & BLANKET · BOOKSHELF',
    camPos: [0, 2.2, 5.2],
    camTarget: [0, 1.3, -0.8],
    setup: (scene, pip, mox) => {
      const world = buildSet('bedroom', scene, 'sunset');
      pip.root.position.set(-1.2, 0, 0.6);
      pip.root.rotation.y = 0.35;
      pip.setFace(EMOTIONS.relief);

      mox.root.position.set(1.1, 0, 0.5);
      mox.root.rotation.y = -0.4;
      mox.setFace(EMOTIONS.smug);

      // Backpack on floor
      const bag = spawnProp('backpack', 1.1);
      bag.position.set(-0.2, 0, 0.8);
      scene.add(bag);

      // Coffee mug on desk
      const mug = spawnProp('coffeeMug', 1.0);
      mug.position.set(1.5, 1.05, -1.0);
      scene.add(mug);

      return world;
    }
  },
  {
    id: 'hallway',
    name: 'SCHOOL HALLWAY SET',
    mood: 'day',
    badge: 'METAL LOCKERS · CLASSROOM DOOR · WATER FOUNTAIN · TILES',
    camPos: [0, 2.0, 5.5],
    camTarget: [0, 1.3, -1.0],
    setup: (scene, pip, mox) => {
      const world = buildSet('hallway', scene, 'day');
      pip.root.position.set(-1.1, 0, -0.8);
      pip.root.rotation.y = 0.4;
      pip.setFace(EMOTIONS.neutral);

      mox.root.position.set(1.2, 0, -0.8);
      mox.root.rotation.y = -0.45;
      mox.setFace(EMOTIONS.happy);

      // Trophy near fountain
      const trophy = spawnProp('trophy', 1.0);
      trophy.position.set(0.4, 1.16, -2.4);
      scene.add(trophy);

      // Notebook on floor
      const nb = spawnProp('notebook', 1.0);
      nb.position.set(-0.2, 0.02, 0.2);
      scene.add(nb);

      return world;
    }
  },
  {
    id: 'park',
    name: 'OUTDOOR PARK SET',
    mood: 'day',
    badge: 'PINE & OAK TREES · STONE PATHWAY · BENCH · STREET LAMP',
    camPos: [0, 2.4, 6.2],
    camTarget: [0, 1.2, 0],
    setup: (scene, pip, mox) => {
      const world = buildSet('park', scene, 'day');
      pip.root.position.set(1.8, 0.55, 0.5); // seated on bench
      pip.root.rotation.y = -0.4;
      pip.setFace(EMOTIONS.happy);

      mox.root.position.set(-0.4, 0, 1.0);
      mox.root.rotation.y = 0.2;
      mox.setFace(EMOTIONS.devious);

      // Game controller in Mox's hands / nearby
      const ctrl = spawnProp('controller', 1.0);
      ctrl.position.set(-0.4, 0.85, 0.6);
      scene.add(ctrl);

      return world;
    }
  },
  {
    id: 'spookyHouse',
    name: 'SPOOKY HOUSE ATTIC',
    mood: 'night',
    badge: 'CREAKY FLOORBOARDS · BOARDED WINDOW · TRUNK · CANDELABRA',
    camPos: [0, 2.1, 5.2],
    camTarget: [0, 1.3, -1.0],
    setup: (scene, pip, mox) => {
      const world = buildSet('spookyHouse', scene, 'night');
      pip.root.position.set(-0.7, 0, -0.2);
      pip.root.rotation.y = 0.45;
      pip.setFace(EMOTIONS.panic);

      mox.root.position.set(0.9, 0, -0.2);
      mox.root.rotation.y = -0.4;
      mox.setFace(EMOTIONS.shock);

      // Flashlight on floor illuminating trunk
      const fl = spawnProp('flashlight', 1.2);
      fl.position.set(-0.2, 0.08, -0.5);
      fl.rotation.y = -0.7;
      scene.add(fl);

      return world;
    }
  },
  {
    id: 'obby',
    name: 'OBBY COURSE SET',
    mood: 'obby',
    badge: 'LAVA HAZARD · NEON FLOATING PADS · CHECKPOINT · SPINNER',
    camPos: [0, 2.4, 5.6],
    camTarget: [0, 1.0, -0.8],
    setup: (scene, pip, mox) => {
      const world = buildSet('obby', scene, 'obby');
      pip.root.position.set(0, 0, 2.0); // on cyan spawn pad
      pip.root.rotation.y = 0;
      pip.setFace(EMOTIONS.smug);

      mox.root.position.set(-1.4, 0.4, 0.4); // on first floating diamond
      mox.root.rotation.y = 0.25;
      mox.setFace(EMOTIONS.happy);

      return world;
    }
  }
];

// Instantiate each scene container once
const BUILT_SETS = SETS_DATA.map(sd => {
  const sc = new THREE.Scene();
  const pip = makeChar({ skin: 0xf2c79b, shirt: 0x3b6cff, pants: 0x2b2f4a, hair: 0x5a3a22, hairStyle: 'cap' }, 1.0);
  const mox = makeChar({ skin: 0xffd2a6, shirt: 0x2db86a, pants: 0x20322b, hair: 0x241c18, hairStyle: 'spiky' }, 1.0);
  sc.add(pip.root, mox.root);
  const world = sd.setup(sc, pip, mox);
  return { ...sd, scene: sc, pip, mox, world };
});

const SET_DUR = 3.0; // 3.0s per set = 18.0s total
const TOTAL = BUILT_SETS.length * SET_DUR;

const labelEl = document.getElementById('label');
const counterEl = document.getElementById('counter');
const badgeEl = document.getElementById('badge');

window.seek = t => {
  t = Math.min(t, TOTAL - 0.001);
  const idx = Math.min(BUILT_SETS.length - 1, Math.floor(t / SET_DUR));
  const cur = BUILT_SETS[idx];
  const localT = t - idx * SET_DUR;

  labelEl.textContent = cur.name;
  counterEl.textContent = `SET ${idx + 1} OF ${BUILT_SETS.length} · ${cur.mood.toUpperCase()} MOOD`;
  badgeEl.textContent = cur.badge;

  // Gentle camera sway
  const camAngle = localT * 0.12 - 0.18;
  cam.position.set(
    cur.camPos[0] + Math.sin(camAngle) * 0.6,
    cur.camPos[1] + Math.cos(localT * 0.5) * 0.08,
    cur.camPos[2]
  );
  cam.lookAt(cur.camTarget[0], cur.camTarget[1], cur.camTarget[2]);

  // Subtle breathing / idle motion for characters
  const idleSched = [{ a: 'idle', t0: 0, t1: SET_DUR, dur: SET_DUR }];
  const Jpip = compose(localT, idleSched, { phase: 1 });
  const Jpipp = compose(localT - 0.04, idleSched, { phase: 1 });
  cur.pip.apply(Jpip, Jpipp);

  const Jmox = compose(localT, idleSched, { phase: 2 });
  const Jmoxp = compose(localT - 0.04, idleSched, { phase: 2 });
  cur.mox.apply(Jmox, Jmoxp);

  // Animate dynamic set elements if present (e.g. clock hands, obby spinner)
  if (cur.world.hMin) cur.world.hMin.rotation.z = -t * 0.35;
  if (cur.world.hHr) cur.world.hHr.rotation.z = -t * 0.03;
  if (cur.world.spinner) cur.world.spinner.rotation.y = localT * 2.2;

  renderer.render(cur.scene, cam);
};

window.TOTAL = TOTAL;
window.ready = document.fonts.load('800 84px BR').then(() => {
  seek(0);
  return true;
});

