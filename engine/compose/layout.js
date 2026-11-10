/**
 * Layout System & fitText Helper (Master Prompt 8.10)
 * 12-column grid at 1920 (margin 96, gutter 24), baseline 8, slot positioning,
 * container bounds, tabular numbers, and dynamic binary-search fitText.
 */

export const layoutCss = `
:root {
  --grid-margin: 96px;
  --grid-gutter: 24px;
  --baseline: 8px;
  --col-w: calc((1920px - (2 * var(--grid-margin)) - (11 * var(--grid-gutter))) / 12);
}

.num, .stat, .tabular {
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
}

/* Chip component (.ck) specification from Master Prompt 11.3 */
.ck {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono, monospace);
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 1px;
  padding: 8px 18px;
  border-width: 1.5px;
  border-style: solid;
  white-space: nowrap;
  box-sizing: border-box;
  max-width: 100%;
}

/* Light theme variants */
.ck.b  { background: rgba(47, 75, 255, 0.12); border-color: rgba(47, 75, 255, 0.4); color: #2F4BFF; }
.ck.g  { background: rgba(18, 166, 107, 0.12); border-color: rgba(18, 166, 107, 0.4); color: #12A66B; }
.ck.r  { background: rgba(242, 67, 45, 0.12); border-color: rgba(242, 67, 45, 0.4); color: #F2432D; }
.ck.n  { background: rgba(14, 15, 19, 0.08); border-color: rgba(14, 15, 19, 0.25); color: #0E0F13; }

/* Dark theme variants */
.ck.rd { background: rgba(255, 142, 125, 0.16); border-color: rgba(255, 142, 125, 0.5); color: #FF8E7D; }
.ck.gd { background: rgba(95, 224, 168, 0.16); border-color: rgba(95, 224, 168, 0.5); color: #5FE0A8; }
`;

export const layoutJs = `
window.layout = (function() {
  /**
   * fitText: Binary-search the largest font-size (in px) such that el.scrollWidth <= maxW
   */
  function fitText(el, maxW, options = {}) {
    if (!el) return;
    const minSize = options.min || 16;
    const maxSize = options.max || 120;
    
    let low = minSize;
    let high = maxSize;
    let best = low;

    // Save initial styles
    const prevWhiteSpace = el.style.whiteSpace;
    const prevDisplay = el.style.display;
    el.style.whiteSpace = 'nowrap';
    if (getComputedStyle(el).display === 'inline') {
      el.style.display = 'inline-block';
    }

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      el.style.fontSize = mid + 'px';
      if (el.scrollWidth <= maxW) {
        best = mid;
        low = mid + 1; // try bigger
      } else {
        high = mid - 1; // too big
      }
    }

    el.style.fontSize = best + 'px';
    if (prevWhiteSpace) el.style.whiteSpace = prevWhiteSpace;
    if (prevDisplay) el.style.display = prevDisplay;
    return best;
  }

  function autoFitAll() {
    document.querySelectorAll('[data-fit]').forEach(el => {
      const maxW = parseFloat(el.dataset.fit) || el.parentElement.clientWidth || 600;
      fitText(el, maxW);
    });
  }

  return {
    fitText,
    autoFitAll
  };
})();
`;

