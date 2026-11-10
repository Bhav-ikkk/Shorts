/**
 * Archetype: tile-proof (Master Prompt Part 7)
 * N tiles flip red/green; big X/N counters comparing baseline vs ours.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const total = p.total || 18;
  const headline = p.headline || "18 hidden defects. Who spots them?";
  const baselineLabel = p.baselineLabel || "Standard automated tests";
  const baselineSub = p.baselineSub || "Legacy infrastructure";
  const baselineCount = p.baselineCount || 1;
  const oursLabel = p.oursLabel || "Core Engine";
  const oursSub = p.oursSub || "Restored nodes";
  const oursCount = p.oursCount || 18;

  const tilesA = Array.from({ length: total }, (_, i) => `
    <div class="tile tile-a" id="${id}_ta_${i}"></div>
  `).join('');

  const tilesB = Array.from({ length: total }, (_, i) => `
    <div class="tile tile-b" id="${id}_tb_${i}"></div>
  `).join('');

  return `
  <div class="scene dark" id="${id}">
    <div class="tp-header">
      <div class="headline" id="${id}_title">${headline}</div>
    </div>

    <div class="tp-content">
      <!-- Baseline Row -->
      <div class="proof-row" id="${id}_rowA">
        <div class="row-meta">
          <span class="row-name">${baselineLabel}</span>
          <span class="row-sub">${baselineSub}</span>
        </div>
        <div class="tiles-track">
          ${tilesA}
        </div>
        <div class="stat num" id="${id}_statA">
          <span class="sv" id="${id}_countA">0</span><u>/${total}</u>
        </div>
      </div>

      <!-- Our Engine Row -->
      <div class="proof-row" id="${id}_rowB">
        <div class="row-meta">
          <span class="row-name">${oursLabel}</span>
          <span class="row-sub">${oursSub}</span>
        </div>
        <div class="tiles-track">
          ${tilesB}
        </div>
        <div class="stat num" id="${id}_statB">
          <span class="sv" id="${id}_countB">0</span><u>/${total}</u>
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
    background: #0E0F13;
    color: #F2EDE2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .tp-header {
    margin-bottom: 60px;
    text-align: center;
  }

  #${id}_title {
    font-family: var(--font-display, sans-serif);
    font-size: 72px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.035em;
  }

  .tp-content {
    display: flex;
    flex-direction: column;
    gap: 48px;
    width: 100%;
    max-width: 1600px;
  }

  .proof-row {
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 32px 40px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .row-meta {
    width: 320px;
  }

  .row-name {
    display: block;
    font-family: var(--font-display, sans-serif);
    font-size: 32px;
    font-weight: 700;
    color: #FFFFFF;
  }

  .row-sub {
    display: block;
    font-family: var(--font-mono, monospace);
    font-size: 16px;
    color: #888;
    margin-top: 6px;
  }

  .tiles-track {
    display: flex;
    gap: 6px;
    flex: 1;
    min-width: 0;
    margin: 0 32px;
    justify-content: center;
  }

  .tile {
    flex: 1;
    max-width: 44px;
    min-width: 12px;
    height: 72px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    transition: background 0.3s;
  }

  .tile.red {
    background: var(--bad, #F2432D);
    box-shadow: 0 0 12px rgba(242, 67, 45, 0.4);
  }

  .tile.green {
    background: var(--good, #12A66B);
    box-shadow: 0 0 12px rgba(18, 166, 107, 0.4);
  }

  .stat {
    width: 200px;
    text-align: right;
    font-family: var(--font-display, sans-serif);
    font-size: 72px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.04em;
  }

  .stat u {
    text-decoration: none;
    font-size: 36px;
    color: #666;
    margin-left: 4px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L11";
  const t0 = ctx.st(line) || 16.0;
  const total = params.total || 18;
  const baselineCount = params.baselineCount !== undefined ? params.baselineCount : 1;
  const oursCount = params.oursCount !== undefined ? params.oursCount : 18;

  // Title reveal
  const titleWords = ctx.motionKit.splitText(`#${id}_title`);
  ctx.motionKit.revealWords(tl, titleWords, t0);

  // Rows entrance
  tl.fromTo(`#${id}_rowA`,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: ctx.motionKit.eases.enter },
    t0 + 0.2
  );
  tl.fromTo(`#${id}_rowB`,
    { y: 30, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.5, ease: ctx.motionKit.eases.enter },
    t0 + 0.35
  );

  // Row A: 1 green, rest red
  if (ctx.emitSfx) ctx.emitSfx('ticks', t0 + 0.6, { n: 18, dt: 0.04 });
  const tilesA = document.querySelectorAll(`#${id} .tile-a`);
  tl.to(tilesA[0], { className: "tile tile-a green", duration: 0.2 }, t0 + 0.6);
  for (let i = 1; i < tilesA.length; i++) {
    tl.to(tilesA[i], { className: "tile tile-a red", duration: 0.1 }, t0 + 0.6 + i * 0.03);
  }
  const countAEl = document.querySelector(`#${id}_countA`);
  if (countAEl) {
    tl.to({ val: 0 }, {
      val: baselineCount,
      duration: 0.4,
      onUpdate: function () { countAEl.textContent = Math.round(this.targets()[0].val); }
    }, t0 + 0.6);
  }

  // Row B: all green
  const tilesB = document.querySelectorAll(`#${id} .tile-b`);
  tilesB.forEach((tile, i) => {
    tl.to(tile, { className: "tile tile-b green", duration: 0.1 }, t0 + 1.2 + i * 0.04);
  });
  const countBEl = document.querySelector(`#${id}_countB`);
  if (countBEl) {
    tl.to({ val: 0 }, {
      val: oursCount,
      duration: 1.0,
      ease: "power2.out",
      onUpdate: function () { countBEl.textContent = Math.round(this.targets()[0].val); }
    }, t0 + 1.2);
  }
}