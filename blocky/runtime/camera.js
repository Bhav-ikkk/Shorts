// Blocky Story Engine — Runtime Camera System
// Smooth camera transitions, punch-zooms, and subtle handheld sway. Pure function of time.
import * as THREE from 'three';

const V = a => new THREE.Vector3(...a);
const lerp = (a, b, u) => a + (b - a) * u;
const ease = u => u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;

export function createCamera(width = 1080, height = 1920) {
  return new THREE.PerspectiveCamera(45, width / height, .1, 80);
}

export function updateCamera(cam, t, shots, punchList) {
  const s = shots.find(x => t >= x.t0 && t < x.t1) || shots.at(-1);
  const u = ease(Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0))));

  const p = V(s.a.p).lerp(V(s.b.p), u);
  const l = V(s.a.l).lerp(V(s.b.l), u);
  let f = lerp(s.a.f, s.b.f, u);

  // Punch zooms
  for (const [tp, a] of punchList) {
    if (t > tp) {
      f *= 1 - a * Math.exp(-(t - tp) * 9);
    }
  }

  // Handheld camera sway
  p.x += Math.sin(t * 1.3) * .02;
  p.y += Math.sin(t * 1.9 + 1) * .015;
  l.x += Math.sin(t * 1.1 + 2) * .015;

  cam.fov = f;
  cam.updateProjectionMatrix();
  cam.position.copy(p);
  cam.lookAt(l);
  cam.rotateZ(lerp(s.roll[0], s.roll[1], u));
}

