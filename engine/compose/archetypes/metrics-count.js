/**
 * Archetype: metrics-count (Master Prompt Part 7)
 * 3-4 big numbers counting with sparklines / tabular numbers, ease out expo.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const headline = p.headline || "Verified Performance at Scale";
  const metrics = p.metrics || [
    { label: "Checks Completed", value: 480, unit: "k", prefix: "" },
    { label: "Defects Flagged", value: 1420, unit: "", prefix: "" },
    { label: "P99 Response", value: 38, unit: "ms", prefix: "" }
  ];

  const cardsHtml = metrics.map((m, idx) => `
    <div class="metric-card" id="${id}_mc_${idx}">
      <div class="m-val num" id="${id}_val_${idx}">${m.prefix || ''}0<small>${m.unit || ''}</small></div>
      <div class="m-lbl">${m.label}</div>
    </div>
  `).join('');

  return `
  <div class="scene paper" id="${id}">
    <div class="mc-header">
      <div class="headline" id="${id}_title">${headline}</div>
    </div>
    <div class="mc-grid" id="${id}_grid">
      ${cardsHtml}
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

  .mc-header {
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

  .mc-grid {
    display: flex;
    gap: 36px;
    width: 100%;
    max-width: 1500px;
    justify-content: center;
  }

  .metric-card {
    flex: 1;
    background: #FFFFFF;
    border-radius: 16px;
    padding: 48px 36px;
    box-shadow: 0 16px 48px rgba(14, 15, 19, 0.08);
    border: 1px solid rgba(14, 15, 19, 0.06);
    text-align: center;
  }

  .m-val {
    font-family: var(--font-display, sans-serif);
    font-size: 80px;
    font-weight: 800;
    color: var(--brand, #2F4BFF);
    letter-spacing: -0.04em;
  }

  .m-val small {
    font-size: 40px;
    color: #666;
    margin-left: 4px;
  }

  .m-lbl {
    font-family: var(--font-ui, sans-serif);
    font-size: 24px;
    font-weight: 600;
    color: #555;
    margin-top: 14px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L1";
  const t0 = ctx.st(line) || 0.5;
  const metrics = params.metrics || [
    { value: 480, unit: "k", prefix: "" },
    { value: 1420, unit: "", prefix: "" },
    { value: 38, unit: "ms", prefix: "" }
  ];

  // Reveal title
  const titleWords = ctx.motionKit.splitText(`#${id}_title`);
  ctx.motionKit.revealWords(tl, titleWords, t0);

  // Stagger cards entrance
  const cards = document.querySelectorAll(`#${id} .metric-card`);
  tl.fromTo(cards,
    { y: 40, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.55, stagger: 0.12, ease: ctx.motionKit.eases.pop },
    t0 + 0.2
  );

  // Counter tweens
  metrics.forEach((m, idx) => {
    const valEl = document.querySelector(`#${id}_val_${idx}`);
    if (valEl) {
      const obj = { val: 0 };
      tl.to(obj, {
        val: m.value,
        duration: 1.2,
        ease: "expo.out",
        onUpdate: () => {
          valEl.innerHTML = `${m.prefix || ''}${Math.round(obj.val)}<small>${m.unit || ''}</small>`;
        }
      }, t0 + 0.4 + idx * 0.1);
    }
  });
}

