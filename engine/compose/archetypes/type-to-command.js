/**
 * Archetype: type-to-command (Master Prompt Part 7)
 * Mic / waveform -> typed text -> "saved" card.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const stepLabel = p.step || "STEP 1";
  const headline = p.headline || "Say a rule.";
  const typedText = p.text || "The Pay button must always be visible.";
  const savedChip = p.chip || "✓ ACTIVE";

  return `
  <div class="scene paper" id="${id}">
    <div class="ttc-header">
      <div class="headline" id="${id}_title">
        <span class="step-chip">${stepLabel}</span>
        ${headline}
      </div>
    </div>

    <div class="ttc-content">
      <div class="type-box" id="${id}_typeBox">
        <div class="type-label">YOU SAY</div>
        <div class="type-line">
          <span class="typed-text" id="${id}_typed"></span>
          <span class="cursor" id="${id}_caret">|</span>
        </div>
      </div>

      <div class="saved-card" id="${id}_saved">
        <div class="sc-top">
          <span class="fn">RULE SAVED</span>
          <span class="ck gd" id="${id}_activeChip">${savedChip}</span>
        </div>
        <div class="sc-body">
          <div class="sc-rule-text">${typedText}</div>
        </div>
        <div class="sc-sub">checked on every screen · active invariant</div>
      </div>
    </div>
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
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .ttc-header {
    margin-bottom: 50px;
  }

  #${id}_title {
    font-family: var(--font-display, sans-serif);
    font-size: 72px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    letter-spacing: -0.03em;
    display: flex;
    align-items: center;
    gap: 24px;
  }

  .step-chip {
    font-family: var(--font-mono, monospace);
    font-size: 24px;
    font-weight: 700;
    background: var(--ink, #0E0F13);
    color: #FFF;
    padding: 6px 16px;
    border-radius: 4px;
  }

  .ttc-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 36px;
    width: 1000px;
  }

  .type-box {
    width: 100%;
    background: #FFFFFF;
    border-radius: 12px;
    padding: 28px 36px;
    box-shadow: 0 12px 36px rgba(14, 15, 19, 0.06);
    border: 1px solid rgba(14, 15, 19, 0.08);
    box-sizing: border-box;
  }

  .type-label {
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    font-weight: 700;
    color: #888;
    margin-bottom: 12px;
  }

  .type-line {
    font-family: var(--font-display, sans-serif);
    font-size: 40px;
    font-weight: 700;
    color: var(--ink, #0E0F13);
    min-height: 52px;
    display: flex;
    align-items: center;
  }

  .cursor {
    color: var(--brand, #2F4BFF);
    font-weight: 300;
    animation: blink 0.8s infinite;
  }

  @keyframes blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0; } }

  .saved-card {
    width: 100%;
    background: #0E0F13;
    color: #F2EDE2;
    border-radius: 12px;
    padding: 28px 36px;
    box-shadow: 0 16px 48px rgba(14, 15, 19, 0.2);
    box-sizing: border-box;
    opacity: 0;
  }

  .sc-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .sc-top .fn {
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    letter-spacing: 0.1em;
    color: #888;
  }

  .sc-rule-text {
    font-family: var(--font-display, sans-serif);
    font-size: 32px;
    font-weight: 700;
    color: #FFFFFF;
  }

  .sc-sub {
    font-family: var(--font-mono, monospace);
    font-size: 14px;
    color: #666;
    margin-top: 14px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L7";
  const t0 = ctx.st(line) || 10.5;
  const fullText = params.text || "The Pay button must always be visible.";

  // Title entrance
  tl.fromTo(`#${id}_title`,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: ctx.motionKit.eases.enter },
    t0
  );

  // Type box entrance
  if (ctx.emitSfx) ctx.emitSfx('ticks', t0 + 0.5, { n: 12, dt: 0.05 });
  tl.fromTo(`#${id}_typeBox`,
    { scale: 0.95, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.45, ease: ctx.motionKit.eases.pop },
    t0 + 0.2
  );

  // Typewriter tween: typing character by character
  const target = document.querySelector(`#${id}_typed`);
  const typeDuration = 1.2;
  const typeStart = t0 + 0.5;
  const obj = { count: 0 };

  tl.to(obj, {
    count: fullText.length,
    duration: typeDuration,
    ease: "none",
    onUpdate: () => {
      if (target) {
        target.textContent = fullText.slice(0, Math.floor(obj.count));
      }
    }
  }, typeStart);

  // Saved card snaps in
  if (ctx.emitSfx) ctx.emitSfx('pop', typeStart + typeDuration + 0.2);
  tl.fromTo(`#${id}_saved`,
    { y: 40, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: ctx.motionKit.eases.pop },
    typeStart + typeDuration + 0.2
  );
}
