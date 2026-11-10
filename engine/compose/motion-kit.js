/**
 * Motion Design Upgrade Pack (Master Prompt Part 8)
 * Easing system, kinetic typography (SplitText), virtual camera rig with parallax,
 * FLIP shared-element morphing, living-hold drift, and procedural film grain.
 */

export const motionKitCss = `
/* Grain overlay */
#grainOverlay {
  position: fixed;
  top: -50px;
  left: -50px;
  width: calc(100% + 100px);
  height: calc(100% + 100px);
  pointer-events: none;
  z-index: 99990;
  opacity: 0.055;
  mix-blend-mode: overlay;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

/* Vignette */
#vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 99980;
  background: radial-gradient(circle at 50% 50%, transparent 65%, rgba(14, 15, 19, 0.18) 100%);
}

/* SplitText Mask Wrappers */
.split-mask {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
}

.split-word {
  display: inline-block;
  will-change: transform, opacity;
}

/* Accent Serif Word Styling */
.acc-serif {
  font-family: var(--font-accent, serif) !important;
  font-style: italic !important;
  font-weight: 400 !important;
  font-size: 1.15em;
  letter-spacing: -0.01em;
}
`;

export const motionKitJs = `
window.motionKit = (function() {
  // 8.3 Easing Presets
  const eases = {
    enter: "power4.out",
    exit: "power2.in",
    pop: "back.out(2.2)",
    camera: "power3.inOut",
    settle: "expo.out"
  };

  /**
   * 8.4 SplitText: Wraps words/lines in masked spans for kinetic typography reveals
   */
  function splitText(selectorOrEl, options = {}) {
    const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el || el._splitDone) return el ? el.querySelectorAll('.split-word') : [];

    const text = el.textContent.trim();
    const words = text.split(/\\s+/);
    el.innerHTML = '';
    
    const wordEls = [];
    words.forEach((w, i) => {
      const mask = document.createElement('span');
      mask.className = 'split-mask';
      const word = document.createElement('span');
      word.className = 'split-word';
      word.textContent = w;

      if (options.accentWord && w.toLowerCase().includes(options.accentWord.toLowerCase())) {
        word.classList.add('acc-serif');
      }

      mask.appendChild(word);
      el.appendChild(mask);
      if (i < words.length - 1) {
        el.appendChild(document.createTextNode(' '));
      }
      wordEls.push(word);
    });

    el._splitDone = true;
    return wordEls;
  }

  /**
   * Reveal split words with masked slide-up
   */
  function revealWords(tl, wordEls, startTime, options = {}) {
    if (!wordEls || !wordEls.length) return;
    const dur = options.duration || 0.45;
    const stagger = options.stagger !== undefined ? options.stagger : 0.045;
    const yOffset = options.y || 48;

    tl.fromTo(wordEls, 
      { y: yOffset, opacity: 0 },
      { y: 0, opacity: 1, duration: dur, stagger, ease: eases.enter },
      startTime
    );
  }

  /**
   * 8.2 Living Hold: Subtle scale/drift to prevent dead frames during narration
   */
  function drift(tl, selectorOrEl, startTime, duration, amount = 0.02) {
    const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el) return;
    tl.to(el, {
      scale: 1 + amount,
      y: -8,
      duration: duration,
      ease: "sine.inOut"
    }, startTime);
  }

  /**
   * 8.3 Impact: Camera/screen shake + optional flash
   */
  function impact(tl, selectorOrEl, startTime, options = {}) {
    const el = typeof selectorOrEl === 'string' ? document.querySelector(selectorOrEl) : selectorOrEl;
    if (!el) return;
    const intensity = options.intensity || 12;
    // 6 shakes x 45ms = 270ms
    const step = 0.045;
    const shakes = [
      { x: -intensity, y: intensity * 0.7 },
      { x: intensity * 0.8, y: -intensity * 0.6 },
      { x: -intensity * 0.6, y: intensity * 0.4 },
      { x: intensity * 0.4, y: -intensity * 0.3 },
      { x: -intensity * 0.2, y: intensity * 0.15 },
      { x: 0, y: 0 }
    ];

    shakes.forEach((s, idx) => {
      tl.to(el, { x: s.x, y: s.y, duration: step, ease: "none" }, startTime + idx * step);
    });
  }

  /**
   * 8.5 Virtual Camera Rig: Moves camera with parallax layer offsets
   */
  function camTo(tl, camSelector, startTime, transform, duration = 0.65, ease = eases.camera) {
    const cam = typeof camSelector === 'string' ? document.querySelector(camSelector) : camSelector;
    if (!cam) return;
    tl.to(cam, {
      x: transform.x || 0,
      y: transform.y || 0,
      scale: transform.scale || 1,
      rotation: transform.rot || 0,
      duration,
      ease
    }, startTime);
  }

  /**
   * 8.7 Shared-Element FLIP Morph (First, Last, Invert, Play)
   */
  function flip(tl, fromEl, toEl, startTime, duration = 0.5, ease = eases.pop) {
    const f = typeof fromEl === 'string' ? document.querySelector(fromEl) : fromEl;
    const t = typeof toEl === 'string' ? document.querySelector(toEl) : toEl;
    if (!f || !t) return;

    const rFrom = f.getBoundingClientRect();
    const rTo = t.getBoundingClientRect();

    const dx = rFrom.left + rFrom.width / 2 - (rTo.left + rTo.width / 2);
    const dy = rFrom.top + rFrom.height / 2 - (rTo.top + rTo.height / 2);
    const sx = rFrom.width / Math.max(1, rTo.width);
    const sy = rFrom.height / Math.max(1, rTo.height);

    tl.fromTo(t, 
      { x: dx, y: dy, scaleX: sx, scaleY: sy, opacity: 0 },
      { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration, ease },
      startTime
    );
    tl.to(f, { opacity: 0, duration: duration * 0.4 }, startTime);
  }

  return {
    eases,
    splitText,
    revealWords,
    drift,
    impact,
    camTo,
    flip
  };
})();
`;

