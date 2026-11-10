/**
 * Archetype: dual-check-gauge (Master Prompt Part 7)
 * Two independent checks, counters, gauge to value, verdict chip, fix & re-check.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const checkA = p.checkA || "finds the shape · SAM 3.1";
  const checkB = p.checkB || "matches the picture · PIXEL MATCH";
  const tolerance = p.tolerance || "1.35%";

  return `
  <div class="scene paper" id="${id}">
    <div class="dcg-header" id="${id}_hdr">
      <div class="hw" id="${id}_h1"><span class="step-chip">STEP 2</span>Two eyes look. Both must agree.</div>
      <div class="hw" id="${id}_h2" style="color:var(--bad, #F2432D); opacity:0;">9.6% hidden. Rejected.</div>
      <div class="hw" id="${id}_h3" style="color:var(--good, #12A66B); opacity:0;"><span class="step-chip">STEP 3</span>Fix it. Zero hidden. Approved.</div>
    </div>

    <div class="dcg-body">
      <!-- Left side: Viewport preview -->
      <div class="dcg-preview" id="${id}_vp">
        <div class="vp-bar">
          <span class="vtag">CUSTOMER VIEWPORT</span>
          <span class="vstatus" id="${id}_vstat">CHECKING</span>
        </div>
        <div class="vp-canvas" id="${id}_canvas">
          <div class="vp-mock-btn">PAY BUTTON</div>
          <div class="vp-obstruction" id="${id}_obstr"></div>
        </div>
      </div>

      <!-- Right side: Dual Inspector Panel -->
      <div class="inspector-panel" id="${id}_panel">
        <div class="ph">
          <span>INDEPENDENT INSPECTION</span>
          <span class="ck n" id="${id}_agreeChip">BOTH MUST AGREE</span>
        </div>

        <div class="eye-row" id="${id}_eye1">
          <div class="eye-meta">
            <span class="eye-badge">EYE 1</span>
            <span class="eye-desc">${checkA}</span>
          </div>
          <div class="big num" id="${id}_valA">0<small>px</small></div>
        </div>

        <div class="eye-row" id="${id}_eye2">
          <div class="eye-meta">
            <span class="eye-badge">EYE 2</span>
            <span class="eye-desc">${checkB}</span>
          </div>
          <div class="big num" id="${id}_valB">0.00<small>%</small></div>
        </div>

        <div class="gauge-box" id="${id}_gauge">
          <div class="gauge-header">
            <span>MEASURED HIDDEN</span>
            <span class="gauge-val num" id="${id}_gval">0.00%</span>
          </div>
          <div class="gauge-track">
            <div class="gauge-fill" id="${id}_gfill"></div>
            <div class="gauge-tolerance" style="left: 15%;"></div>
          </div>
          <div class="gauge-sub">tolerance threshold: up to ${tolerance}</div>
        </div>

        <div class="verdict-banner" id="${id}_verdict">
          <div class="vb-rej" id="${id}_vRej">REJECTED · 9.6% HIDDEN</div>
          <div class="vb-app" id="${id}_vApp" style="display:none;">APPROVED · 0% HIDDEN</div>
        </div>
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
  }

  #${id}_hdr {
    margin-top: 60px;
    height: 80px;
    position: relative;
    width: 100%;
    max-width: 1728px;
  }

  .step-chip {
    font-family: var(--font-mono, monospace);
    font-size: 20px;
    font-weight: 700;
    background: var(--ink, #0E0F13);
    color: #FFF;
    padding: 6px 14px;
    border-radius: 4px;
    margin-right: 16px;
  }

  .dcg-body {
    display: flex;
    gap: 40px;
    width: 100%;
    max-width: 1728px;
    margin-top: 20px;
  }

  .dcg-preview {
    flex: 1.1;
    height: 640px;
    background: #FFFFFF;
    border-radius: 16px;
    box-shadow: 0 16px 48px rgba(14, 15, 19, 0.08);
    overflow: hidden;
    border: 1px solid rgba(14, 15, 19, 0.08);
  }

  .vp-bar {
    height: 48px;
    background: #F6F4EE;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 20px;
    border-bottom: 1px solid #ECE7DD;
    font-family: var(--font-mono, monospace);
    font-size: 14px;
    font-weight: 700;
  }

  .vp-canvas {
    position: relative;
    height: calc(100% - 48px);
    background: #FAF8F5;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vp-mock-btn {
    width: 320px;
    height: 68px;
    background: #2F4BFF;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-ui, sans-serif);
    font-weight: 700;
    font-size: 20px;
    border-radius: 8px;
  }

  .vp-obstruction {
    position: absolute;
    width: 220px;
    height: 54px;
    background: var(--bad, #F2432D);
    bottom: 260px;
    border-radius: 6px;
    box-shadow: 0 8px 24px rgba(242, 67, 45, 0.3);
  }

  .inspector-panel {
    flex: 1;
    height: 640px;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 36px;
    box-sizing: border-box;
    box-shadow: 0 16px 48px rgba(14, 15, 19, 0.08);
    border: 1px solid rgba(14, 15, 19, 0.08);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .inspector-panel .ph {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    font-weight: 700;
    color: #888;
    border-bottom: 1px solid #ECE7DD;
    padding-bottom: 16px;
  }

  .eye-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
  }

  .eye-badge {
    display: inline-block;
    font-family: var(--font-mono, monospace);
    font-weight: 800;
    font-size: 14px;
    background: var(--ink, #0E0F13);
    color: #FFF;
    padding: 4px 10px;
    border-radius: 4px;
    margin-bottom: 6px;
  }

  .eye-desc {
    display: block;
    font-family: var(--font-ui, sans-serif);
    font-size: 18px;
    color: #666;
  }

  .eye-row .big {
    font-family: var(--font-display, sans-serif);
    font-size: 48px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
  }

  .gauge-box {
    background: #FAF8F5;
    padding: 20px;
    border-radius: 10px;
  }

  .gauge-header {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    font-weight: 700;
    margin-bottom: 10px;
  }

  .gauge-track {
    position: relative;
    height: 12px;
    background: #ECE7DD;
    border-radius: 6px;
    overflow: hidden;
  }

  .gauge-fill {
    height: 100%;
    width: 0%;
    background: var(--bad, #F2432D);
    border-radius: 6px;
  }

  .gauge-sub {
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    color: #888;
    margin-top: 8px;
  }

  .verdict-banner {
    border-radius: 8px;
    overflow: hidden;
  }

  .vb-rej {
    background: var(--bad, #F2432D);
    color: #FFF;
    font-family: var(--font-mono, monospace);
    font-size: 20px;
    font-weight: 800;
    padding: 16px;
    text-align: center;
    border-radius: 8px;
  }

  .vb-app {
    background: var(--good, #12A66B);
    color: #FFF;
    font-family: var(--font-mono, monospace);
    font-size: 20px;
    font-weight: 800;
    padding: 16px;
    text-align: center;
    border-radius: 8px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const lines = params.lines || ["L8", "L9", "L10"];
  const t8 = ctx.st(lines[0]) || 12.0;
  const t9 = ctx.st(lines[1]) || (t8 + 2.5);
  const t10 = ctx.st(lines[2]) || (t9 + 2.5);

  // L8: Two eyes look
  tl.fromTo(`#${id}_panel`,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: ctx.motionKit.eases.enter },
    t8
  );

  // Animate Eye counters and gauge fill to 9.6%
  if (ctx.emitSfx) ctx.emitSfx('ticks', t8 + 0.4, { n: 8, dt: 0.05 });
  const gaugeObj = { val: 0 };
  tl.to(gaugeObj, {
    val: 9.6,
    duration: 1.0,
    ease: "power2.out",
    onUpdate: () => {
      const gval = document.querySelector(`#${id}_gval`);
      const gfill = document.querySelector(`#${id}_gfill`);
      const valB = document.querySelector(`#${id}_valB`);
      if (gval) gval.textContent = gaugeObj.val.toFixed(2) + '%';
      if (gfill) gfill.style.width = (gaugeObj.val * 8) + '%';
      if (valB) valB.innerHTML = gaugeObj.val.toFixed(2) + '<small>%</small>';
    }
  }, t8 + 0.4);

  // L9: 9.6% rejected
  if (ctx.emitSfx) ctx.emitSfx('pop', t9);
  tl.to(`#${id}_h1`, { opacity: 0, duration: 0.2 }, t9);
  tl.to(`#${id}_h2`, { opacity: 1, duration: 0.3 }, t9 + 0.1);

  // L10: Fix it -> 0% approved
  if (ctx.emitSfx) {
    ctx.emitSfx('pop', t10);
    ctx.emitSfx('chime', t10 + 0.6);
  }
  tl.to(`#${id}_h2`, { opacity: 0, duration: 0.2 }, t10);
  tl.to(`#${id}_h3`, { opacity: 1, duration: 0.3 }, t10 + 0.1);

  // Obstruction removed
  tl.to(`#${id}_obstr`, { scale: 0, opacity: 0, duration: 0.3 }, t10 + 0.2);

  // Gauge drops to 0% and verdict switches to approved
  tl.to(gaugeObj, {
    val: 0,
    duration: 0.6,
    ease: "power2.out",
    onUpdate: () => {
      const gval = document.querySelector(`#${id}_gval`);
      const gfill = document.querySelector(`#${id}_gfill`);
      const valB = document.querySelector(`#${id}_valB`);
      if (gval) gval.textContent = '0.00%';
      if (gfill) gfill.style.width = '0%';
      if (valB) valB.innerHTML = '0.00<small>%</small>';
    }
  }, t10 + 0.3);

  tl.set(`#${id}_vRej`, { display: 'none' }, t10 + 0.6);
  tl.set(`#${id}_vApp`, { display: 'block' }, t10 + 0.6);
  tl.fromTo(`#${id}_vApp`,
    { scale: 0.9, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.35, ease: ctx.motionKit.eases.pop },
    t10 + 0.6
  );
}
