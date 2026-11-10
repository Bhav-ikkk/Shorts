/**
 * Archetype: contrast-hook (Master Prompt Part 7)
 * Positive claim -> hard flip to negative ("all good" -> "couldn't")
 * Masked word slide-up, scale-in 2.1x -> 1 on the flip word, flash, shake, thud.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const positive = p.positive || "Everything said: all good.";
  const flip = p.flip || "couldn't.";
  const sub = p.sub || "Today's automated tests";
  const items = p.items || [
    { text: "Page loads", pass: true },
    { text: "Pay button is there", pass: true },
    { text: "No console errors", pass: true }
  ];

  const rowsHtml = items.map((it, idx) => `
    <div class="dr" id="${id}_dr${idx}"><i>✓</i>${it.text}</div>
  `).join('');

  return `
  <div class="scene paper" id="${id}">
    <div class="hook-box" id="${id}_box">
      <div class="tA" id="${id}_tA">
        <div class="headline" id="${id}_pos">${positive}</div>
      </div>
      
      <div class="dash-card" id="${id}_dash">
        <div class="dh">
          <span>${sub.toUpperCase()}</span>
          <span class="ck g" id="${id}_passChip">ALL PASSED</span>
        </div>
        ${rowsHtml}
      </div>

      <div class="tB" id="${id}_tB">
        <div class="headline flip-target" id="${id}_neg">
          <span class="acc-serif" id="${id}_flipWord">${flip}</span>
        </div>
      </div>
    </div>
    <div class="flash-overlay" id="${id}_flash"></div>
  </div>
  `;
}

export function styles(params, theme, id) {
  return `
  #${id} {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--paper, #F2EDE2);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #${id}_box {
    position: relative;
    width: 100%;
    height: 100%;
  }

  #${id}_tA {
    position: absolute;
    top: 140px;
    left: 96px;
    right: 96px;
  }

  #${id}_pos {
    font-family: var(--font-display, sans-serif);
    font-size: 88px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  #${id}_dash {
    position: absolute;
    top: 380px;
    left: 96px;
    width: 580px;
    background: #FFFFFF;
    border-radius: 12px;
    padding: 24px 32px;
    box-shadow: 0 12px 36px rgba(14, 15, 19, 0.08);
    box-sizing: border-box;
  }

  #${id}_dash .dh {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono, monospace);
    font-size: 18px;
    font-weight: 700;
    color: #666;
    margin-bottom: 20px;
    border-bottom: 1px solid #ECE7DD;
    padding-bottom: 12px;
  }

  #${id}_dash .dr {
    display: flex;
    align-items: center;
    font-family: var(--font-ui, sans-serif);
    font-size: 26px;
    font-weight: 600;
    color: var(--ink, #0E0F13);
    margin: 14px 0;
  }

  #${id}_dash .dr i {
    font-style: normal;
    color: var(--good, #12A66B);
    font-weight: 800;
    margin-right: 14px;
  }

  #${id}_tB {
    position: absolute;
    top: 660px;
    left: 96px;
    right: 96px;
    opacity: 0;
  }

  #${id}_neg {
    font-family: var(--font-display, sans-serif);
    font-size: 108px;
    font-weight: 800;
    color: var(--bad, #F2432D);
    line-height: 1.05;
    letter-spacing: -0.04em;
  }

  #${id}_flash {
    position: absolute;
    inset: 0;
    background: var(--bad, #F2432D);
    opacity: 0;
    pointer-events: none;
    z-index: 100;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const lines = params.lines || ["L1", "L2"];
  const t1 = ctx.st(lines[0]) || 0.25;
  const t2 = ctx.st(lines[1]) || (t1 + 2.5);

  // L1: Positive claim revealed with SplitText slide-up
  if (ctx.emitSfx) ctx.emitSfx('whoosh', t1);
  const posWords = ctx.motionKit.splitText(`#${id}_pos`);
  ctx.motionKit.revealWords(tl, posWords, t1, { y: 60, stagger: 0.05 });

  // Dash card pop
  if (ctx.emitSfx) ctx.emitSfx('pop', t1 + 0.4);
  tl.fromTo(`#${id}_dash`,
    { y: 40, opacity: 0, scale: 0.95 },
    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: ctx.motionKit.eases.pop },
    t1 + 0.4
  );

  // Stagger dash rows
  const rowEls = document.querySelectorAll(`#${id}_dash .dr`);
  if (rowEls.length) {
    tl.fromTo(rowEls,
      { x: -20, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, stagger: 0.1, ease: ctx.motionKit.eases.enter },
      t1 + 0.6
    );
  }

  // L2: Flip to negative with scale 2.1x -> 1, screen shake, and flash
  tl.set(`#${id}_tB`, { opacity: 1 }, t2);
  const flipEl = document.querySelector(`#${id}_flipWord`);
  if (flipEl) {
    tl.fromTo(flipEl,
      { scale: 2.1, opacity: 0, y: -20 },
      { scale: 1, opacity: 1, y: 0, duration: 0.45, ease: ctx.motionKit.eases.pop },
      t2
    );
  }

  // Camera impact shake
  if (ctx.emitSfx) {
    ctx.emitSfx('impact', t2);
    ctx.emitSfx('thud', t2 + 0.1);
  }
  ctx.motionKit.impact(tl, `#${id}_box`, t2, { intensity: 14 });

  // Red flash
  tl.fromTo(`#${id}_flash`,
    { opacity: 0.35 },
    { opacity: 0, duration: 0.3, ease: "power2.out" },
    t2
  );

  // Living hold drift
  ctx.motionKit.drift(tl, `#${id}_box`, t1, (ctx.en(lines[1]) || (t2 + 2.5)) - t1);
}
