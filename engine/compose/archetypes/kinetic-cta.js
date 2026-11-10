/**
 * Archetype: kinetic-cta (Master Prompt Part 7)
 * Two-line kinetic headline -> logo -> tagline words -> URL typed -> chips.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const headline1 = p.headline1 || "Catch it before";
  const headline2 = p.headline2 || "your customers do.";
  const brandName = p.name || "Spectra";
  const tagline = p.tagline || "See what your customers see.";
  const url = p.url || "spectra-lyart.vercel.app";
  const chips = p.chips || ["RUNS IN YOUR CLI", "WORKS IN CI", "MCP FOR CODING AGENTS"];

  const chipsHtml = chips.map((c, i) => `
    <span class="ck b" id="${id}_chip${i}">${c}</span>
  `).join('');

  return `
  <div class="scene paper" id="${id}">
    <div class="cta-headline" id="${id}_catch">
      <div class="ln"><span id="${id}_ct1">${headline1}</span></div>
      <div class="ln"><span id="${id}_ct2">${headline2}</span></div>
    </div>

    <div class="cta-brand-wrap" id="${id}_brandWrap">
      <div class="brand-logo" id="${id}_logo">
        <svg viewBox="0 0 100 100" width="120" height="120">
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--ink, #0E0F13)" stroke-width="8"/>
          <circle cx="50" cy="50" r="16" fill="var(--brand, #2F4BFF)"/>
        </svg>
      </div>
      <div class="brand-title" id="${id}_brandTitle">${brandName}</div>
      <div class="brand-tagline" id="${id}_tagline">${tagline}</div>
      
      <div class="url-card" id="${id}_urlCard">
        <span class="url-text" id="${id}_url">${url}</span>
      </div>

      <div class="chips-row" id="${id}_chipsRow">
        ${chipsHtml}
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

  .cta-headline {
    text-align: center;
    position: absolute;
    top: 140px;
  }

  .cta-headline .ln {
    font-family: var(--font-display, sans-serif);
    font-size: 80px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    line-height: 1.1;
    letter-spacing: -0.035em;
  }

  .cta-brand-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0;
  }

  .brand-title {
    font-family: var(--font-display, sans-serif);
    font-size: 96px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    letter-spacing: -0.04em;
    margin-top: 16px;
  }

  .brand-tagline {
    font-family: var(--font-ui, sans-serif);
    font-size: 32px;
    color: #666;
    margin-top: 8px;
  }

  .url-card {
    margin-top: 36px;
    background: #FFFFFF;
    border-radius: 8px;
    padding: 16px 36px;
    border: 1px solid rgba(14, 15, 19, 0.1);
    box-shadow: 0 8px 24px rgba(14, 15, 19, 0.06);
  }

  .url-text {
    font-family: var(--font-mono, monospace);
    font-size: 28px;
    font-weight: 700;
    color: var(--brand, #2F4BFF);
  }

  .chips-row {
    margin-top: 40px;
    display: flex;
    gap: 20px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const lines = params.lines || ["L12", "L13"];
  const t12 = ctx.st(lines[0]) || 20.0;
  const t13 = ctx.st(lines[1]) || (t12 + 2.5);

  // L12: Headline reveal
  if (ctx.emitSfx) ctx.emitSfx('whoosh', t12);
  const ct1Words = ctx.motionKit.splitText(`#${id}_ct1`);
  const ct2Words = ctx.motionKit.splitText(`#${id}_ct2`);
  ctx.motionKit.revealWords(tl, ct1Words, t12, { y: 40 });
  ctx.motionKit.revealWords(tl, ct2Words, t12 + 0.3, { y: 40 });

  // Fade headline out before brand entrance
  tl.to(`#${id}_catch`, { opacity: 0, duration: 0.4 }, t13 - 0.2);

  // L13: Brand logo + name + tagline + URL
  if (ctx.emitSfx) {
    ctx.emitSfx('pop', t13);
    ctx.emitSfx('chime', t13 + 0.4);
  }
  tl.fromTo(`#${id}_brandWrap`,
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.6, ease: ctx.motionKit.eases.pop },
    t13
  );

  // Logo spin-in
  tl.fromTo(`#${id}_logo`,
    { rotation: -90, scale: 0.5 },
    { rotation: 0, scale: 1, duration: 0.6, ease: ctx.motionKit.eases.pop },
    t13
  );

  // Chips stagger
  const chips = document.querySelectorAll(`#${id}_chipsRow .ck`);
  if (chips.length) {
    tl.fromTo(chips,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, stagger: 0.1, ease: ctx.motionKit.eases.pop },
      t13 + 0.4
    );
  }
}
