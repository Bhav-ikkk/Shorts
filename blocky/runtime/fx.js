// Blocky Story Engine — Runtime Visual Effects
// Speech bubbles, dust puff, blackout flicker, glowing eyes, and title slam.
import * as THREE from 'three';
import { win } from './char.js';

const V = a => new THREE.Vector3(...a);
const tmpV = new THREE.Vector3();

export function projectToScreen(el, v, cam, W = 1080, H = 1920) {
  const p = v.clone().project(cam);
  el.style.left = ((p.x * .5 + .5) * W) + 'px';
  el.style.top = ((-p.y * .5 + .5) * H) + 'px';
  return p;
}

export function updateFx(t, state) {
  const { bubbles, puff, puffDirs, dark, eyes, slam, characters, cam, total } = state;

  // 1. Speech Bubbles
  bubbles.forEach(b => {
    const k = win(t, b.t0, b.t1, .12, .15);
    if (k <= 0) {
      b.el.style.visibility = 'hidden';
      return;
    }
    let a = b.anchor;
    if (typeof a === 'string') {
      const [id, what] = a.split('.');
      const c = characters[id];
      c.ch.head.getWorldPosition(tmpV);
      a = [tmpV.x, tmpV.y + 1.45 * c.scale + (what === 'head' ? 0 : 0), tmpV.z];
    }
    projectToScreen(b.el, V(a), cam);
    b.el.style.visibility = 'visible';
    const o = 1 + .25 * Math.sin(Math.min(1, (t - b.t0) / .25) * Math.PI);
    b.el.style.transform = `translate(-50%,-100%) scale(${k * o}) rotate(${(1 - k) * -14}deg)`;
  });

  // 2. Dust Puff
  if (puff && state.puffConfig) {
    const u = (t - state.puffConfig.t) / .55;
    puff.visible = u > 0 && u < 1;
    if (puff.visible) {
      puff.children.forEach((b, i) => {
        const d = puffDirs[i], r = Math.sqrt(u) * 1.1;
        b.position.set(state.puffConfig.at[0] + d[0] * r, state.puffConfig.at[1] + d[1] * r * .8 + u * .3, state.puffConfig.at[2] + d[2] * r);
        b.scale.setScalar(Math.max(.01, 1 - u) * (1 + (i % 3) * .3));
        b.rotation.set(u * 5 + i, u * 4, 0);
      });
    }
  }

  // 3. Blackout flicker
  let dk = 0;
  if (dark && t >= dark.t) {
    const r = t - dark.t;
    for (const [a, b, o] of dark.seg) {
      if (r >= a && r < b) dk = o;
    }
  }
  document.getElementById('dark').style.opacity = dk;

  // 4. Glowing eyes in the dark
  const eyesEl = document.getElementById('eyes');
  const ek = eyes ? win(t, eyes.t, total + 1, .2, .01) : 0;
  if (ek > 0) {
    projectToScreen(eyesEl, V([0, 1.62, -1.6]), cam);
    eyesEl.style.visibility = 'visible';
    const bl = ((t - eyes.t) % 1.7) > 1.55 ? .1 : 1;
    eyesEl.style.opacity = ek;
    eyesEl.style.transform = `translate(-50%,-50%) scale(${ek}, ${bl})`;
  } else {
    eyesEl.style.visibility = 'hidden';
  }

  // 5. Title Slam ("PART 2")
  const p2 = document.getElementById('part2');
  if (slam) {
    p2.textContent = slam.text;
    const q = (t - slam.t) / .3;
    p2.style.visibility = q > 0 ? 'visible' : 'hidden';
    const sc = q < 1 ? 1.9 - .9 * (q * q * (3 - 2 * q)) : 1;
    p2.style.transform = `scale(${Math.max(1, sc)}) rotate(${q < 1 ? (1 - q) * 6 : -3}deg)`;
    document.getElementById('flash').style.opacity = (t > slam.t && t < slam.t + .1) ? .55 * (1 - (t - slam.t) / .1) : 0;
  }
}

