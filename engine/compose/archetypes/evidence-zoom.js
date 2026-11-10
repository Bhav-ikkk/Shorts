/**
 * Archetype: evidence-zoom (Master Prompt Part 7)
 * Live mock UI, camera pushes into the defect, hatch + label, chip pop.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const title = p.title || "The defect was hidden in plain sight.";
  const chip = p.chip || "PAY BUTTON COVERED";
  const sublabel = p.sublabel || "Viewport obstruction detected";

  return `
  <div class="scene paper" id="${id}">
    <div class="ez-header" id="${id}_hdr">
      <div class="headline" id="${id}_title">${title}</div>
    </div>
    
    <div class="ez-cam" id="${id}_cam">
      <div class="mock-device" id="${id}_device">
        <div class="device-bar">
          <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
          <span class="url-bar">checkout.store.internal/pay</span>
        </div>
        <div class="device-screen" id="${id}_screen">
          <div class="mock-ui">
            <div class="mock-nav"></div>
            <div class="mock-content">
              <div class="mock-product"></div>
              <div class="mock-summary"></div>
            </div>
            <div class="mock-footer" id="${id}_defectArea">
              <div class="mock-button" id="${id}_btn">COMPLETE ORDER · $49.00</div>
              <div class="defect-hatch" id="${id}_hatch"></div>
              <div class="defect-banner" id="${id}_banner">OVERLAPPING BANNER</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="defect-callout" id="${id}_callout">
      <span class="ck rd" id="${id}_chip">${chip}</span>
      <div class="callout-sub">${sublabel}</div>
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
  }

  #${id}_hdr {
    position: absolute;
    top: 96px;
    left: 96px;
    right: 96px;
    z-index: 10;
  }

  #${id}_title {
    font-family: var(--font-display, sans-serif);
    font-size: 64px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    letter-spacing: -0.03em;
  }

  #${id}_cam {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-origin: 65% 75%;
  }

  #${id}_device {
    width: 1100px;
    height: 640px;
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 24px 64px rgba(14, 15, 19, 0.12);
    overflow: hidden;
    border: 1px solid rgba(14, 15, 19, 0.08);
  }

  .device-bar {
    height: 44px;
    background: #F6F4EE;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
    border-bottom: 1px solid #ECE7DD;
  }

  .device-bar .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .device-bar .dot.r { background: #FF5F56; }
  .device-bar .dot.y { background: #FFBD2E; }
  .device-bar .dot.g { background: #27C93F; }

  .device-bar .url-bar {
    margin-left: 20px;
    font-family: var(--font-mono, monospace);
    font-size: 14px;
    color: #888;
    background: #EAE6DC;
    padding: 4px 16px;
    border-radius: 6px;
  }

  .device-screen {
    position: relative;
    height: calc(100% - 44px);
    background: #FAF8F5;
    padding: 32px;
    box-sizing: border-box;
  }

  .mock-nav {
    height: 32px;
    background: #ECE7DD;
    border-radius: 6px;
    margin-bottom: 24px;
  }

  .mock-content {
    display: flex;
    gap: 24px;
    height: 360px;
  }

  .mock-product {
    flex: 2;
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #ECE7DD;
  }

  .mock-summary {
    flex: 1;
    background: #FFFFFF;
    border-radius: 8px;
    border: 1px solid #ECE7DD;
  }

  .mock-footer {
    position: relative;
    margin-top: 24px;
    height: 64px;
  }

  .mock-button {
    height: 56px;
    background: #2F4BFF;
    color: #FFFFFF;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-ui, sans-serif);
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.04em;
  }

  .defect-hatch {
    position: absolute;
    top: -4px;
    left: 20%;
    right: 20%;
    height: 64px;
    border: 2px dashed #F2432D;
    background: rgba(242, 67, 45, 0.15);
    border-radius: 6px;
    opacity: 0;
  }

  .defect-banner {
    position: absolute;
    top: 20px;
    left: 15%;
    right: 15%;
    height: 48px;
    background: #0E0F13;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono, monospace);
    font-size: 14px;
    font-weight: 700;
    border-radius: 4px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  #${id}_callout {
    position: absolute;
    bottom: 96px;
    right: 120px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    opacity: 0;
    z-index: 20;
  }

  .callout-sub {
    font-family: var(--font-mono, monospace);
    font-size: 18px;
    color: var(--bad, #F2432D);
    margin-top: 8px;
    font-weight: 700;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L3";
  const t0 = ctx.st(line) || 3.0;

  // Reveal title
  const titleWords = ctx.motionKit.splitText(`#${id}_title`);
  ctx.motionKit.revealWords(tl, titleWords, t0);

  // Device entrance
  tl.fromTo(`#${id}_device`,
    { y: 60, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.6, ease: ctx.motionKit.eases.enter },
    t0 + 0.1
  );

  // Camera pushes into defect area
  if (ctx.emitSfx) ctx.emitSfx('whoosh', t0 + 0.8);
  ctx.motionKit.camTo(tl, `#${id}_cam`, t0 + 0.8, { scale: 1.65, x: -160, y: -120 }, 0.9);

  // Defect hatch blink and pop
  if (ctx.emitSfx) ctx.emitSfx('pop', t0 + 1.2);
  tl.fromTo(`#${id}_hatch`,
    { opacity: 0, scale: 0.95 },
    { opacity: 1, scale: 1, duration: 0.35, ease: ctx.motionKit.eases.pop },
    t0 + 1.2
  );

  // Chip callout pop
  tl.fromTo(`#${id}_callout`,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.45, ease: ctx.motionKit.eases.pop },
    t0 + 1.4
  );
}
