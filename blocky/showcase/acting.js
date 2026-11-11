// Blocky Story Engine — Faces & Acting Showcase Runner
import * as THREE from 'three';
import { makeChar, compose, EMOTIONS } from '../runtime/char.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0e131f);

const cam = new THREE.PerspectiveCamera(36, W / H, 0.1, 80);
cam.position.set(0, 1.45, 4.2);
cam.lookAt(0, 1.25, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.3));
const keyLight = new THREE.DirectionalLight(0xfff1e6, 2.2);
keyLight.position.set(2.5, 6, 4.5);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
rimLight.position.set(-3, 4, -2);
scene.add(rimLight);

// Pedestal Stage
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(2.2, 2.4, 0.2, 48),
  new THREE.MeshStandardMaterial({ color: 0x182030, roughness: 0.5 })
);
pedestal.position.y = -0.1;
scene.add(pedestal);

// Character 1: Pip (Blue hoodie)
const pip = makeChar({
  skin: 0xf2c79b,
  shirt: 0x3b6cff,
  pants: 0x2b2f4a,
  hair: 0x5a3a22,
  hairStyle: 'cap'
}, 1.0);
pip.root.position.set(-0.65, 0, 0);
pip.root.rotation.y = 0.25;
scene.add(pip.root);

// Character 2: Mox (Green hoodie)
const mox = makeChar({
  skin: 0xffd2a6,
  shirt: 0x2db86a,
  pants: 0x20322b,
  hair: 0x241c18,
  hairStyle: 'spiky'
}, 1.0);
mox.root.position.set(0.65, 0, 0);
mox.root.rotation.y = -0.25;
scene.add(mox.root);

// 12 Rich Acting Scenes (1.5s each = 18.0s)
const SCENES = [
  {
    name: 'NEUTRAL & BLINK',
    badge: 'BALANCED IDLE · NATURAL BLINK CADENCE',
    pipAct: 'idle',
    moxAct: 'idle',
    pipFace: EMOTIONS.neutral,
    moxFace: EMOTIONS.neutral
  },
  {
    name: 'HAPPY & JOY',
    badge: 'CRESCENT EYES · WARM SMILE · BLUSH CHEEKS',
    pipAct: 'celebrate',
    moxAct: 'nod',
    pipFace: EMOTIONS.happy,
    moxFace: EMOTIONS.happy
  },
  {
    name: 'SUSPICIOUS & SIDE-EYE',
    badge: 'ASYMMETRIC BROW LIFT · LATERAL GAZE SHIFT',
    pipAct: 'peek',
    moxAct: 'shrug',
    pipFace: EMOTIONS.suspicious,
    moxFace: { ...EMOTIONS.suspicious, dx: -0.6 }
  },
  {
    name: 'GUILT & SWEAT',
    badge: 'WORRIED BROWS · AVERTED EYES · CYAN SWEAT DROP',
    pipAct: 'recoil',
    moxAct: 'pointChest',
    pipFace: EMOTIONS.guilt,
    moxFace: { ...EMOTIONS.suspicious, dx: -0.4 }
  },
  {
    name: 'PANIC & TERROR',
    badge: 'WIDE SCLERA · DILATED PUPILS · DROPPED JAW',
    pipAct: 'headHands',
    moxAct: 'gasp',
    pipFace: EMOTIONS.panic,
    moxFace: EMOTIONS.panic
  },
  {
    name: 'SMUG & CONFIDENT',
    badge: 'HALF-LIDDED GAZE · ASYMMETRIC SMIRK',
    pipAct: 'handsHips',
    moxAct: 'facepalm',
    pipFace: EMOTIONS.smug,
    moxFace: { eye: 'blink', brow: 0.8, smile: -0.6 }
  },
  {
    name: 'SHOCK & AWE',
    badge: 'HAIRLINE BROWS · O-SHAPE VISUAL PAYOFF',
    pipAct: 'gasp',
    moxAct: 'recoil',
    pipFace: EMOTIONS.shock,
    moxFace: EMOTIONS.shock
  },
  {
    name: 'ANGRY & FURIOUS',
    badge: 'V-BROWS · FOREHEAD FURROWS · S-VISEME CLENCH',
    pipAct: 'shake',
    moxAct: 'handsHips',
    pipFace: EMOTIONS.angry,
    moxFace: { ...EMOTIONS.angry, eye: 'angry' }
  },
  {
    name: 'RELIEF & SIGH',
    badge: 'DOWNWARD CRESCENTS · RELAXED SIGH MOUTH',
    pipAct: 'nod',
    moxAct: 'nod',
    pipFace: EMOTIONS.relief,
    moxFace: EMOTIONS.relief
  },
  {
    name: 'DEVIOUS & SCHEMING',
    badge: 'NARROW SQUINT · CAT SMIRK · FORWARD LEAN',
    pipAct: 'whisperLean',
    moxAct: 'look',
    pipFace: EMOTIONS.devious,
    moxFace: { ...EMOTIONS.suspicious, dx: -0.5 }
  },
  {
    name: 'VISEME F & L (SPEECH)',
    badge: 'LABIODENTAL UPPER TEETH (F) · PALATAL TONGUE (L)',
    pipAct: 'talk',
    moxAct: 'talk',
    pipFace: { eye: 'open', brow: 0.2, open: 0.85, shape: 'F', smile: 0.2 },
    moxFace: { eye: 'open', brow: 0.3, open: 0.85, shape: 'L', smile: 0.3 }
  },
  {
    name: 'DYNAMIC GAZE TRACKING',
    badge: 'INTER-CHARACTER EYE FOCUS -> SNAP TO CAMERA',
    pipAct: 'idle',
    moxAct: 'idle',
    pipFace: { eye: 'open', brow: 0.1, smile: 0.5 },
    moxFace: { eye: 'open', brow: 0.1, smile: 0.5 },
    trackGaze: true
  }
];

const SCENE_DUR = 1.5;
const TOTAL = SCENES.length * SCENE_DUR;

const labelEl = document.getElementById('label');
const counterEl = document.getElementById('counter');
const badgeEl = document.getElementById('badge');

window.seek = t => {
  t = Math.min(t, TOTAL - 0.001);
  const idx = Math.min(SCENES.length - 1, Math.floor(t / SCENE_DUR));
  const cur = SCENES[idx];
  const localT = t - idx * SCENE_DUR;

  labelEl.textContent = cur.name;
  counterEl.textContent = `PRESET ${idx + 1} OF ${SCENES.length}`;
  badgeEl.textContent = cur.badge;

  const mkSched = act => [{
    a: act,
    t0: 0,
    t1: SCENE_DUR,
    fi: 0.1,
    fo: 0.1,
    dur: SCENE_DUR
  }];

  const Jpip = compose(localT, mkSched(cur.pipAct), { phase: 1 });
  const Jpipp = compose(localT - 0.04, mkSched(cur.pipAct), { phase: 1 });
  pip.apply(Jpip, Jpipp);

  const Jmox = compose(localT, mkSched(cur.moxAct), { phase: 2 });
  const Jmoxp = compose(localT - 0.04, mkSched(cur.moxAct), { phase: 2 });
  mox.apply(Jmox, Jmoxp);

  let pipGaze = { dx: 0, dy: 0 };
  let moxGaze = { dx: 0, dy: 0 };

  if (cur.trackGaze) {
    if (localT < 0.9) {
      // Look at each other
      pipGaze = pip.setLookAt(new THREE.Vector3(0.65, 1.25, 0));
      moxGaze = mox.setLookAt(new THREE.Vector3(-0.65, 1.25, 0));
    } else {
      // Snap gaze to camera
      pipGaze = pip.setLookAt(cam.position);
      moxGaze = mox.setLookAt(cam.position);
    }
  }

  pip.setFace({
    ...cur.pipFace,
    dx: (cur.pipFace.dx || 0) + pipGaze.dx,
    dy: (cur.pipFace.dy || 0) + pipGaze.dy
  });

  mox.setFace({
    ...cur.moxFace,
    dx: (cur.moxFace.dx || 0) + moxGaze.dx,
    dy: (cur.moxFace.dy || 0) + moxGaze.dy
  });

  renderer.render(scene, cam);
};

window.TOTAL = TOTAL;
window.ready = document.fonts.load('800 86px BR').then(() => {
  seek(0);
  return true;
});
