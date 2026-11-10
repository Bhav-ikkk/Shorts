import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getProjectDir, getProjectBuildDir, getNodeModulesDir, getRootDir } from '../core/paths.js';
import { layoutCss, layoutJs } from './layout.js';
import { motionKitCss, motionKitJs } from './motion-kit.js';

// Import all standard archetypes
import * as contrastHook from './archetypes/contrast-hook.js';
import * as evidenceZoom from './archetypes/evidence-zoom.js';
import * as splitCompare from './archetypes/split-compare.js';
import * as metaphorIcon from './archetypes/metaphor-icon.js';
import * as typeToCommand from './archetypes/type-to-command.js';
import * as dualCheckGauge from './archetypes/dual-check-gauge.js';
import * as tileProof from './archetypes/tile-proof.js';
import * as kineticCta from './archetypes/kinetic-cta.js';
import * as metricsCount from './archetypes/metrics-count.js';
import * as terminalRun from './archetypes/terminal-run.js';

const ARCHETYPES = {
  'contrast-hook': contrastHook,
  'evidence-zoom': evidenceZoom,
  'split-compare': splitCompare,
  'metaphor-icon': metaphorIcon,
  'type-to-command': typeToCommand,
  'dual-check-gauge': dualCheckGauge,
  'tile-proof': tileProof,
  'kinetic-cta': kineticCta,
  'metrics-count': metricsCount,
  'terminal-run': terminalRun
};

export async function composeProject(projectName = 'spectra') {
  const projectDir = getProjectDir(projectName);
  const buildDir = getProjectBuildDir(projectName);
  fs.mkdirSync(buildDir, { recursive: true });

  const configPath = path.join(projectDir, 'project.json');
  if (!fs.existsSync(configPath)) {
    throw new Error(`project.json not found at ${configPath}`);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const nodeModulesDir = getNodeModulesDir();

  const isShort = config.format === 'short' || config.aspectRatio === '9:16' || config.format === 'vertical';
  const width = config.width || (isShort ? 1080 : 1920);
  const height = config.height || (isShort ? 1920 : 1080);

  // Resolve fonts
  const fontFaceCss = resolveFontFaces(nodeModulesDir);

  // Theme tokens
  const theme = config.theme?.tokens || config.theme || {};
  const paper = theme.paper || '#F2EDE2';
  const ink = theme.ink || '#0E0F13';
  const brand = theme.brand || '#2F4BFF';
  const bad = theme.bad || theme.defect || '#F2432D';
  const good = theme.good || theme.verified || '#12A66B';

  const themeVarsCss = `
  :root {
    --paper: ${paper};
    --ink: ${ink};
    --brand: ${brand};
    --bad: ${bad};
    --good: ${good};
    --font-display: 'Bricolage Grotesque', sans-serif;
    --font-accent: 'Instrument Serif', serif;
    --font-ui: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
  }
  `;

  // Global base CSS
  const baseCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body, html {
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: ${ink};
    font-family: var(--font-ui, sans-serif);
    -webkit-font-smoothing: antialiased;
    text-rendering: geometricPrecision;
  }

  #stage {
    position: relative;
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    background: ${paper};
    transform-origin: 0 0;
  }

  .scene {
    position: absolute;
    inset: 0;
    width: ${width}px;
    height: ${height}px;
    opacity: 0;
    pointer-events: none;
    overflow: hidden;
  }

  .scene.active {
    opacity: 1;
    pointer-events: auto;
  }

  /* Captions Plate */
  #capw {
    position: absolute;
    bottom: ${isShort ? '240px' : '48px'};
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 9990;
  }

  #cap {
    background: rgba(14, 15, 19, 0.92);
    backdrop-filter: blur(10px);
    color: #F8F9FA;
    padding: ${isShort ? '16px 36px' : '12px 28px'};
    border-radius: ${isShort ? '14px' : '8px'};
    font-family: var(--font-display, var(--font-ui, sans-serif));
    font-size: ${isShort ? '44px' : '32px'};
    font-weight: 800;
    letter-spacing: -0.02em;
    max-width: ${isShort ? '960px' : '1200px'};
    text-align: center;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.45);
    border: 1px solid rgba(255, 255, 255, 0.16);
    opacity: 0;
    transition: opacity 0.1s ease;
  }

  #cap .active-word {
    color: var(--brand, #FFD600);
    text-shadow: 0 0 14px rgba(255, 214, 0, 0.7);
    display: inline-block;
    transform: scale(1.08);
  }
  `;

  // Compile scenes markup, styles, and choreography calls
  const scenes = config.scenes || [];
  let scenesMarkup = '';
  let scenesStyles = '';
  let choreographyCalls = '';

  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    const archName = sc.archetype;
    const arch = ARCHETYPES[archName];
    if (!arch) {
      console.warn(`[Composer] Unknown archetype '${archName}' for scene '${sc.id}'`);
      continue;
    }

    // Merge scene params with config data
    const params = {
      ...sc.params,
      name: config.product?.name || config.name,
      tagline: config.product?.tagline || config.tagline,
      url: config.product?.url || config.url,
      badges: config.badges || [],
      lines: sc.lines || []
    };

    scenesMarkup += `\n<!-- SCENE: ${sc.id} (${archName}) -->\n` + arch.markup(params, theme, sc.id);
    scenesStyles += `\n/* Archetype: ${archName} (#${sc.id}) */\n` + arch.styles(params, theme, sc.id);

    choreographyCalls += `
    // Scene: ${sc.id} (${archName})
    (function() {
      const sceneEl = document.getElementById('${sc.id}');
      const startT = ${sc.lines && sc.lines[0] ? `ctx.st('${sc.lines[0]}') || 0` : `${i * 4}`};
      const endT = ${sc.lines && sc.lines.length ? `ctx.en('${sc.lines[sc.lines.length - 1]}') || (startT + 4)` : `${(i + 1) * 4}`};

      // Visibility toggle in timeline
      tl.set(sceneEl, { opacity: 1, pointerEvents: 'auto' }, startT);
      if (${i < scenes.length - 1}) {
        tl.set(sceneEl, { opacity: 0, pointerEvents: 'none' }, endT);
      }

      // Run archetype choreography
      const archChoreo = ARCHETYPES['${archName}']?.choreography;
      if (archChoreo) {
        archChoreo(tl, ctx, ${JSON.stringify(params)}, '${sc.id}');
      }
    })();
    `;
  }

  // Check for bespoke choreography escape hatch if present
  let customChoreoScript = '';
  if (config.custom?.choreography) {
    const customFile = path.resolve(getRootDir(), config.custom.choreography);
    if (fs.existsSync(customFile)) {
      customChoreoScript = fs.readFileSync(customFile, 'utf8');
      console.log(`[Composer] Loaded custom choreography from ${config.custom.choreography}`);
    }
  }

  const gsapUrl = pathToFileURL(path.join(nodeModulesDir, 'gsap', 'dist', 'gsap.min.js')).href;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${config.product?.name || config.name || 'Motion Film'}</title>
<style>
${fontFaceCss}
${themeVarsCss}
${baseCss}
${layoutCss}
${motionKitCss}
${scenesStyles}
</style>
</head>
<body>
<div id="stage">
  ${scenesMarkup}
  
  <!-- Captions Plate -->
  <div id="capw"><div id="cap"><span id="capText"></span></div></div>
  <div id="vignette"></div>
  <div id="grainOverlay"></div>
</div>

<script src="${gsapUrl}"></script>
<script src="anchors.js"></script>
<script>
${layoutJs}
</script>
<script>
${motionKitJs}
</script>
<script>
// Bundled Archetype Logic in Browser
window.ARCHETYPES = {
${Object.keys(ARCHETYPES).map(k => `'${k}': { choreography: ${ARCHETYPES[k].choreography.toString()} }`).join(',\n')}
};

// Main Timeline Construction
(function() {
  const tl = gsap.timeline({ paused: true });
  window.TL = tl;

  const A = (window.ANCH && window.ANCH.lines) ? window.ANCH.lines : {};
  window.TOTAL = (window.ANCH && window.ANCH.total) ? window.ANCH.total : 42;
  window.EVENTS = [];

  function round3(n) { return Math.round(n * 1000) / 1000; }

  // Acoustic Timing API
  function st(k) { return A[k] ? A[k].start : 0; }
  function en(k) { return A[k] ? A[k].end : 0; }
  function dur(k) { return A[k] ? A[k].dur : 0; }
  
  function W(k, word) {
    if (!A[k] || !A[k].words) return st(k);
    const item = A[k].words.find(w => (w[0] || '').toLowerCase().includes(word.toLowerCase()));
    return item ? round3(st(k) + item[1]) : st(k);
  }

  function WI(k, i) {
    if (!A[k] || !A[k].words || !A[k].words[i]) return st(k);
    return round3(st(k) + A[k].words[i][1]);
  }

  function WE(k, i) {
    if (!A[k] || !A[k].words || !A[k].words[i]) return en(k);
    const w = A[k].words[i];
    return round3(st(k) + (w[2] !== undefined ? w[2] : (w[1] + 0.2)));
  }

  function SS(k) { return A[k] && A[k].segs && A[k].segs[0] ? round3(st(k) + A[k].segs[0][0]) : st(k); }
  function SSo(k, i) { return A[k] && A[k].segs && A[k].segs[i] ? round3(st(k) + A[k].segs[i][0]) : st(k); }
  function SG(k, i) { return A[k] ? A[k].gap : 0.5; }

  function emitSfx(name, t, opts = {}) {
    window.EVENTS.push([name, round3(t), opts]);
  }

  window.st = st;
  window.en = en;
  window.dur = dur;
  window.W = W;
  window.WI = WI;
  window.WE = WE;
  window.SS = SS;
  window.SSo = SSo;
  window.SG = SG;

  const ctx = {
    st,
    en,
    dur,
    W,
    WI,
    WE,
    SS,
    SSo,
    SG,
    emitSfx,
    motionKit: window.motionKit,
    layout: window.layout
  };

  // Scene-by-scene choreography
  ${choreographyCalls}

  // Custom choreography hook
  ${customChoreoScript}

  // Sort events by timestamp
  window.EVENTS.sort((a, b) => a[1] - b[1]);

  window.WIDTH = ${width};
  window.HEIGHT = ${height};

  // Captions live updater
  const capBox = document.getElementById('cap');
  const capText = document.getElementById('capText');
  const linesList = Object.values(A.lines || {});

  function updateCaptions(t) {
    if (!capBox || !capText) return;
    const active = linesList.find(l => t >= l.start && t <= (l.end + (l.gap || 0.25)));
    if (active) {
      if (active.words && active.words.length > 0) {
        const relT = t - active.start;
        const html = active.words.map(([w, t0, t1]) => {
          const isCurrent = relT >= (t0 - 0.04) && relT <= (t1 + 0.05);
          return isCurrent ? ('<span class="active-word">' + w + '</span>') : ('<span>' + w + '</span>');
        }).join(' ');
        capText.innerHTML = html;
      } else {
        capText.textContent = active.text;
      }
      capBox.style.opacity = '1';
    } else {
      capBox.style.opacity = '0';
    }
  }

  // Pure seek(t) function
  window.seek = function(t) {
    tl.time(t, false);
    updateCaptions(t);
  };

  window.seekAsync = async function(t) {
    window.seek(t);
  };

  // window.ready promise: resolves after fonts and layout fitText pass
  window.ready = (async function() {
    if (document.fonts) {
      await document.fonts.ready;
    }
    if (window.layout && window.layout.autoFitAll) {
      window.layout.autoFitAll();
    }
    window.seek(0);
    return true;
  })();
})();
</script>
</body>
</html>`;

  const outputPath = path.join(buildDir, 'index.html');
  fs.writeFileSync(outputPath, html, 'utf8');
  console.log(`[Composer] Declarative project.json compiled to: ${outputPath} (${html.length} bytes)`);
  return outputPath;
}

function resolveFontFaces(nodeModulesDir) {
  const fonts = [
    { name: 'Bricolage Grotesque', file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2', weight: 800 },
    { name: 'Bricolage Grotesque', file: '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-700-normal.woff2', weight: 700 },
    { name: 'Instrument Serif', file: '@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', weight: 400, style: 'italic' },
    { name: 'Inter', file: '@fontsource/inter/files/inter-latin-600-normal.woff2', weight: 600 },
    { name: 'Inter', file: '@fontsource/inter/files/inter-latin-700-normal.woff2', weight: 700 },
    { name: 'JetBrains Mono', file: '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2', weight: 700 },
    { name: 'Space Grotesk', file: '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2', weight: 700 }
  ];

  let css = '';
  for (const f of fonts) {
    const fullPath = path.join(nodeModulesDir, f.file);
    if (fs.existsSync(fullPath)) {
      const url = pathToFileURL(fullPath).href;
      css += `
      @font-face {
        font-family: '${f.name}';
        src: url('${url}') format('woff2');
        font-weight: ${f.weight};
        font-style: ${f.style || 'normal'};
        font-display: block;
      }
      `;
    }
  }
  return css;
}
