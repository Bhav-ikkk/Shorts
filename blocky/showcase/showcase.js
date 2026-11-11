// Blocky Story Engine — Action Showcase Runner
import * as THREE from 'three';
import { makeChar, compose } from '../runtime/char.js';

const W = 1080, H = 1920;
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x131722);

const cam = new THREE.PerspectiveCamera(40, W / H, 0.1, 80);
cam.position.set(0, 1.6, 5.2);
cam.lookAt(0, 1.2, 0);

scene.add(new THREE.HemisphereLight(0xffffff, 0x1e293b, 1.2));
const sun = new THREE.DirectionalLight(0xffedd5, 2.0);
sun.position.set(3, 7, 5);
scene.add(sun);

// Circular showroom pedestal
const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(2.4, 2.6, 0.25, 48),
  new THREE.MeshStandardMaterial({ color: 0x1e2638, roughness: 0.6 })
);
pedestal.position.y = -0.125;
scene.add(pedestal);

const ring = new THREE.Mesh(
  new THREE.RingGeometry(2.35, 2.45, 48),
  new THREE.MeshBasicMaterial({ color: 0xffd21f, side: THREE.DoubleSide })
);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.005;
scene.add(ring);

// Character Setup (Pip)
const pip = makeChar({
  skin: 0xf2c79b,
  shirt: 0x3b6cff,
  pants: 0x2b2f4a,
  hair: 0x5a3a22,
  hairStyle: 'cap'
}, 1.0);
scene.add(pip.root);

// Showcase Actions Sequence (12 actions, 1.5s each = 18s)
const ACTIONS_LIST = [
  { name: 'WALK', action: 'walk', face: { eye: 'open', brow: 0, smile: 0.4 } },
  { name: 'SNEAK', action: 'sneak', face: { eye: 'squint', brow: -0.3, smile: -0.2 } },
  { name: 'TIPTOE', action: 'tiptoe', face: { eye: 'wide', brow: 0.2, smile: 0.1 } },
  { name: 'RUN', action: 'run', face: { eye: 'open', brow: 0.5, smile: 0.6 } },
  { name: 'CELEBRATE', action: 'celebrate', face: { eye: 'happy', brow: 0.4, smile: 0.9, cheeks: 0.8 } },
  { name: 'DANCE', action: 'dance', face: { eye: 'happy', brow: 0.2, smile: 0.8 } },
  { name: 'WAVE', action: 'wave', face: { eye: 'open', brow: 0.1, smile: 0.6 } },
  { name: 'SHRUG', action: 'shrug', face: { eye: 'open', brow: -0.4, smile: -0.3 } },
  { name: 'FACEPALM', action: 'facepalm', face: { eye: 'blink', brow: 0.8, smile: -0.7 } },
  { name: 'HANDS ON HIPS', action: 'handsHips', face: { eye: 'open', brow: 0.4, smile: 0.3 } },
  { name: 'RECOIL', action: 'recoil', face: { eye: 'wide', brow: -0.6, smile: -0.5 } },
  { name: 'JUMP', action: 'jump', face: { eye: 'happy', brow: 0.3, smile: 0.7 } }
];

const ACTION_DUR = 1.5;
const TOTAL = ACTIONS_LIST.length * ACTION_DUR;

const labelEl = document.getElementById('label');
const counterEl = document.getElementById('counter');

window.seek = t => {
  t = Math.min(t, TOTAL - 0.001);
  const idx = Math.min(ACTIONS_LIST.length - 1, Math.floor(t / ACTION_DUR));
  const cur = ACTIONS_LIST[idx];
  const localT = t - idx * ACTION_DUR;

  labelEl.textContent = cur.name;
  counterEl.textContent = `ACTION ${idx + 1} OF ${ACTIONS_LIST.length}`;

  const sched = [{
    a: cur.action,
    t0: 0,
    t1: ACTION_DUR,
    fi: 0.12,
    fo: 0.15,
    spd: cur.action === 'run' ? 3.8 : cur.action === 'sneak' ? 1.6 : 2.4,
    dur: ACTION_DUR,
    h: 0.45
  }];

  const J = compose(localT, sched);
  const Jp = compose(localT - 0.04, sched);

  pip.apply(J, Jp);
  pip.setFace(cur.face);

  // Subtle showroom camera turntable orbit
  const camAngle = t * 0.15 - 0.3;
  cam.position.x = Math.sin(camAngle) * 5.2;
  cam.position.z = Math.cos(camAngle) * 5.2;
  cam.lookAt(0, 1.2, 0);

  renderer.render(scene, cam);
};

window.TOTAL = TOTAL;
window.ready = document.fonts.load('800 48px BR').then(() => {
  seek(0);
  return true;
});

