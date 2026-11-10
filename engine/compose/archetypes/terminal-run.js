/**
 * Archetype: terminal-run (Master Prompt Part 7)
 * CLI window typing a command, streaming output lines, success summary.
 */

export function markup(params, theme, id) {
  const p = params || {};
  const headline = p.headline || "Runs anywhere. Instantly in CI.";
  const command = p.command || "npx spectra test --ci --strict";
  const outputLines = p.lines || [
    "Compiling 14 screen invariants...",
    "Found 14 DOM elements mapped to visual viewport",
    "Running Dual Neural Verification across 1080p canvas",
    "✓ All 14 visual checks verified (0 regressions)"
  ];

  const linesHtml = outputLines.map((l, i) => `
    <div class="term-line" id="${id}_tl_${i}">${l}</div>
  `).join('');

  return `
  <div class="scene dark" id="${id}">
    <div class="tr-header">
      <div class="headline" id="${id}_title">${headline}</div>
    </div>

    <div class="terminal-window" id="${id}_window">
      <div class="term-bar">
        <span class="dot r"></span><span class="dot y"></span><span class="dot g"></span>
        <span class="term-title">bash — 80×24</span>
      </div>
      <div class="term-body">
        <div class="prompt-line">
          <span class="prompt-sym">$ </span>
          <span class="prompt-cmd" id="${id}_cmd"></span>
          <span class="term-cursor" id="${id}_cur">_</span>
        </div>
        <div class="term-output">
          ${linesHtml}
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
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }

  .tr-header {
    margin-bottom: 50px;
    text-align: center;
  }

  #${id}_title {
    font-family: var(--font-display, sans-serif);
    font-size: 72px;
    font-weight: 800;
    color: #FFFFFF;
    letter-spacing: -0.035em;
  }

  .terminal-window {
    width: 1200px;
    background: #18191E;
    border-radius: 12px;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: hidden;
  }

  .term-bar {
    height: 40px;
    background: #23242B;
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }

  .term-bar .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  .term-bar .dot.r { background: #FF5F56; }
  .term-bar .dot.y { background: #FFBD2E; }
  .term-bar .dot.g { background: #27C93F; }

  .term-title {
    margin-left: 16px;
    font-family: var(--font-mono, monospace);
    font-size: 13px;
    color: #888;
  }

  .term-body {
    padding: 28px 36px;
    font-family: var(--font-mono, monospace);
    font-size: 22px;
    line-height: 1.6;
    color: #ECE7DD;
  }

  .prompt-sym {
    color: var(--brand, #2F4BFF);
    font-weight: 700;
  }

  .prompt-cmd {
    color: #FFFFFF;
    font-weight: 600;
  }

  .term-cursor {
    color: var(--brand, #2F4BFF);
    font-weight: 700;
    animation: blink 0.8s infinite;
  }

  .term-output {
    margin-top: 20px;
  }

  .term-line {
    opacity: 0;
    color: #AAA;
  }

  .term-line:last-child {
    color: var(--good, #12A66B);
    font-weight: 700;
    margin-top: 12px;
  }
  `;
}

export function choreography(tl, ctx, params, id) {
  const line = (params.lines && params.lines[0]) || "L1";
  const t0 = ctx.st(line) || 0.5;
  const fullCmd = params.command || "npx spectra test --ci --strict";

  // Reveal title
  const titleWords = ctx.motionKit.splitText(`#${id}_title`);
  ctx.motionKit.revealWords(tl, titleWords, t0);

  // Terminal window pop
  tl.fromTo(`#${id}_window`,
    { y: 40, opacity: 0, scale: 0.96 },
    { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: ctx.motionKit.eases.pop },
    t0 + 0.2
  );

  // Typewriter command
  const cmdTarget = document.querySelector(`#${id}_cmd`);
  const typeDuration = 0.9;
  const typeStart = t0 + 0.5;
  const obj = { count: 0 };

  tl.to(obj, {
    count: fullCmd.length,
    duration: typeDuration,
    ease: "none",
    onUpdate: () => {
      if (cmdTarget) cmdTarget.textContent = fullCmd.slice(0, Math.floor(obj.count));
    }
  }, typeStart);

  // Stream output lines
  const lines = document.querySelectorAll(`#${id} .term-line`);
  lines.forEach((l, idx) => {
    tl.to(l, { opacity: 1, duration: 0.1 }, typeStart + typeDuration + 0.2 + idx * 0.15);
  });
}

