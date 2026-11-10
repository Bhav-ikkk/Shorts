/**
 * Archetype: split-compare (Master Prompt Part 7)
 * Two panels: "What the software reads" vs "What the customer sees"
 * Staggered rows, dim left / reveal right, header swap.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const leftTitle = p.left || "WHAT THE SOFTWARE READS";
  const rightTitle = p.right || "WHAT THE CUSTOMER SEES";
  const leftRows = p.leftRows || ["Page header", "Product cards", "Pay button", "Footer"];
  const leftVerdict = p.leftVerdict || "ALL FOUND · ALL PASS";
  const rightVerdict = p.rightVerdict || "✕ PART IS HIDDEN";

  const rowsHtml = leftRows.map((r, i) => `
    <div class="li" id="${id}_li${i}"><span>${r}</span><b>✓</b></div>
  `).join('');

  return `
  <div class="scene paper" id="${id}">
    <div class="sc-header" id="${id}_hdr">
      <div class="hw" id="${id}_hw1">They read a <em class="acc-serif">list.</em></div>
      <div class="hw" id="${id}_hw2">Customers see the <em class="acc-serif">screen.</em></div>
    </div>

    <div class="compare-container" id="${id}_wrap">
      <!-- Left Card: What it reads -->
      <div class="vcard left-card" id="${id}_cardL">
        <span class="ck n lab">${leftTitle}</span>
        <div class="list-items">
          ${rowsHtml}
        </div>
        <div class="card-footer">
          <span class="ck g">${leftVerdict}</span>
        </div>
      </div>

      <!-- Right Card: What the customer sees -->
      <div class="vcard right-card" id="${id}_cardR">
        <div class="card-head">
          <span class="ck n lab">${rightTitle}</span>
          <span class="ck r">${rightVerdict}</span>
        </div>
        <div class="crop-area">
          <div class="screen-mock">
            <div class="sm-btn">PAY NOW</div>
            <div class="sm-overlay">FLOATING POPUP BANNER</div>
          </div>
        </div>
        <div class="cnote">A banner sits on top of the Pay button.</div>
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
    margin-top: 80px;
    height: 90px;
    position: relative;
    width: 100%;
    max-width: 1728px;
  }

  .hw {
    position: absolute;
    left: 96px;
    font-family: var(--font-display, sans-serif);
    font-size: 64px;
    font-weight: 800;
    color: var(--ink, #0E0F13);
    letter-spacing: -0.03em;
  }

  #${id}_hw2 {
    opacity: 0;
  }

  .compare-container {
    display: flex;
    gap: 48px;
    margin-top: 40px;
    width: 100%;
    max-width: 1728px;
    justify-content: center;
  }

  .vcard {
    width: 780px;
    height: 640px;
    background: #FFFFFF;
    font-size: 18px;
    border-radius: 16px;
    padding: 36px;
    box-sizing: border-box;
    box-shadow: 0 16px 48px rgba(14, 15, 19, 0.08);
    border: 1px solid rgba(14, 15, 19, 0.06);
    position: relative;
    overflow: hidden;
  }

  .vcard .lab {
    margin-bottom: 24px;
  }

  .list-items {
    margin-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .list-items .li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-family: var(--font-ui, sans-serif);
    font-size: 28px;
    font-weight: 600;
    color: var(--ink, #0E0F13);
    padding: 16px 20px;
    background: #FAF8F5;
    border-radius: 8px;
  }

  .list-items .li b {
    color: var(--good, #12A66B);
  }

  .card-footer {
    position: absolute;
    bottom: 36px;
    left: 36px;
  }

  .card-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    width: 100%;
  }

  .card-head .ck {
    font-size: 18px;
    padding: 6px 12px;
    white-space: nowrap;
  }

  .crop-area {
    margin-top: 24px;
    height: 400px;
    background: #FAF8F5;
    border-radius: 12px;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .screen-mock {
    position: relative;
    width: 80%;
    height: 240px;
    background: #FFFFFF;
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sm-btn {
    width: 240px;
    height: 60px;
    background: #2F4BFF;
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-ui, sans-serif);
    font-weight: 700;
    border-radius: 6px;
  }

  .sm-overlay {
    position: absolute;
    bottom: 40px;
    width: 280px;
    height: 50px;
    background: var(--bad, #F2432D);
    color: #FFF;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-mono, monospace);
    font-size: 14px;
    font-weight: 700;
    border-radius: 4px;
  }

  .cnote {
    margin-top: 18px;
    font-family: var(--font-mono, monospace);
    font-size: 20px;
    color: var(--bad, #F2432D);
    font-weight: 700;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const lines = params.lines || ["L4", "L5"];
  const t1 = ctx.st(lines[0]) || 5.0;
  const t2 = ctx.st(lines[1]) || (t1 + 2.5);

  // Left card entrance
  if (ctx.emitSfx) ctx.emitSfx('tap', t1);
  tl.fromTo(`#${id}_cardL`,
    { x: -40, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.55, ease: ctx.motionKit.eases.enter },
    t1
  );

  // Stagger left items
  const items = document.querySelectorAll(`#${id}_cardL .li`);
  if (items.length) {
    tl.fromTo(items,
      { x: -15, opacity: 0 },
      { x: 0, opacity: 1, duration: 0.35, stagger: 0.08, ease: ctx.motionKit.eases.enter },
      t1 + 0.3
    );
  }

  // Swap header at t2
  tl.to(`#${id}_hw1`, { opacity: 0, duration: 0.25 }, t2);
  tl.fromTo(`#${id}_hw2`,
    { y: 20, opacity: 0 },
    { y: 0, opacity: 1, duration: 0.45, ease: ctx.motionKit.eases.enter },
    t2 + 0.1
  );

  // Dim left card, pop right card
  if (ctx.emitSfx) {
    ctx.emitSfx('whoosh', t2);
    ctx.emitSfx('pop', t2 + 0.2);
  }
  tl.to(`#${id}_cardL`, { opacity: 0.45, scale: 0.98, duration: 0.5 }, t2);
  tl.fromTo(`#${id}_cardR`,
    { x: 40, opacity: 0, scale: 0.95 },
    { x: 0, opacity: 1, scale: 1, duration: 0.6, ease: ctx.motionKit.eases.pop },
    t2 + 0.1
  );
}
