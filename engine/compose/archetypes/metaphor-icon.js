/**
 * Archetype: metaphor-icon (Master Prompt Part 7)
 * One SVG icon draws itself (stroke-dashoffset), rotates in, viewfinder + scan line.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const label = p.label || "Looks at the screen, like a person.";
  const icon = p.icon || "eye";

  return `
  <div class="scene paper" id="${id}">
    <div class="mi-header">
      <div class="headline" id="${id}_title">${label}</div>
    </div>

    <div class="mi-center" id="${id}_center">
      <div class="viewfinder" id="${id}_vf">
        <i class="c tl"></i><i class="c tr"></i><i class="c bl"></i><i class="c br"></i>
      </div>
      
      <svg class="hero-icon" id="${id}_svg" viewBox="0 0 300 300">
        <g class="draw-paths" fill="none" stroke="var(--ink, #0E0F13)" stroke-width="12" stroke-linecap="round">
          <circle cx="150" cy="150" r="104"/>
          <circle cx="150" cy="150" r="68"/>
          <path d="M150 16 V50"/>
          <path d="M150 250 V284"/>
          <path d="M16 150 H50"/>
          <path d="M250 150 H284"/>
        </g>
        <circle class="core-pupil" cx="150" cy="150" r="28" fill="var(--brand, #2F4BFF)"/>
      </svg>

      <div class="scan-beam" id="${id}_beam"></div>
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

  .mi-header {
    margin-bottom: 60px;
    text-align: center;
  }

  #${id}_title {
    font-family: var(--font-display, sans-serif);
    font-size: 72px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    letter-spacing: -0.035em;
  }

  .mi-center {
    position: relative;
    width: 400px;
    height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .hero-icon {
    width: 320px;
    height: 320px;
  }

  .viewfinder {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
  }

  .viewfinder .c {
    position: absolute;
    width: 32px;
    height: 32px;
    border: 3px solid var(--brand, #2F4BFF);
  }

  .viewfinder .c.tl { top: 0; left: 0; border-right: none; border-bottom: none; }
  .viewfinder .c.tr { top: 0; right: 0; border-left: none; border-bottom: none; }
  .viewfinder .c.bl { bottom: 0; left: 0; border-right: none; border-top: none; }
  .viewfinder .c.br { bottom: 0; right: 0; border-left: none; border-top: none; }

  .scan-beam {
    position: absolute;
    left: 20px;
    right: 20px;
    height: 3px;
    background: var(--brand, #2F4BFF);
    box-shadow: 0 0 16px var(--brand, #2F4BFF);
    top: 40px;
    opacity: 0;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L6";
  const t0 = ctx.st(line) || 8.0;

  // Title reveal
  const titleWords = ctx.motionKit.splitText(`#${id}_title`);
  ctx.motionKit.revealWords(tl, titleWords, t0);

  // SVG rotation and scale-in
  if (ctx.emitSfx) ctx.emitSfx('whoosh', t0 + 0.1);
  tl.fromTo(`#${id}_svg`,
    { scale: 0.4, rotation: -90, opacity: 0 },
    { scale: 1, rotation: 0, opacity: 1, duration: 0.8, ease: ctx.motionKit.eases.pop },
    t0 + 0.1
  );

  // Viewfinder pops in
  tl.fromTo(`#${id}_vf`,
    { scale: 1.15, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.4, ease: ctx.motionKit.eases.pop },
    t0 + 0.5
  );

  // Scan beam moves down
  tl.fromTo(`#${id}_beam`,
    { top: 40, opacity: 0 },
    { top: 360, opacity: 0.9, duration: 0.9, ease: "power1.inOut" },
    t0 + 0.6
  );
  tl.to(`#${id}_beam`, { opacity: 0, duration: 0.2 }, t0 + 1.5);
}
