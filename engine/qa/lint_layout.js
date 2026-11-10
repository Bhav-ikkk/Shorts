import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { getProjectBuildDir, getProjectDir } from '../core/paths.js';

  export async function lintLayout(projectName = 'spectra', options = {}) {
    const buildDir = getProjectBuildDir(projectName);
    const projectDir = getProjectDir(projectName);
    const htmlPath = path.join(buildDir, 'index.html');
    const lintDir = path.join(buildDir, 'lint');
    fs.mkdirSync(lintDir, { recursive: true });

    if (!fs.existsSync(htmlPath)) {
      throw new Error(`index.html not found at ${htmlPath}`);
    }

    const isDense = options.dense !== false; // default dense=true
    console.log(`[Linter] Starting layout & collision linter for '${projectName}' (dense: ${isDense})...`);

    let browser;
    try {
      browser = await chromium.launch({ channel: 'chrome', args: ['--font-render-hinting=none', '--disable-lcd-text'] });
    } catch {
      browser = await chromium.launch({ channel: 'msedge', args: ['--font-render-hinting=none', '--disable-lcd-text'] });
    }

    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(pathToFileURL(htmlPath).href);
    await page.evaluate(() => window.ready);

    const { total, width: cW, height: cH } = await page.evaluate(() => ({
      total: window.TOTAL || 42,
      width: window.WIDTH || 1920,
      height: window.HEIGHT || 1080
    }));
    await page.setViewportSize({ width: cW, height: cH });

    let times = [];
    if (options.sampleTimes && options.sampleTimes.length > 0) {
      times = options.sampleTimes;
    } else {
      const timeSet = new Set();
      const anchorsFile = path.join(projectDir, 'anchors.json');
      if (fs.existsSync(anchorsFile)) {
        try {
          const anch = JSON.parse(fs.readFileSync(anchorsFile, 'utf8'));
          const lines = anch.lines || {};
          for (const k of Object.keys(lines)) {
            const l = lines[k];
            if (l.start) timeSet.add(Math.round((l.start + 0.15) * 100) / 100);
            if (l.end) timeSet.add(Math.round((l.end - 0.1) * 100) / 100);
          }
        } catch { }
      }

      if (isDense) {
        for (let t = 0.5; t < total - 0.2; t += 0.5) {
          timeSet.add(Math.round(t * 100) / 100);
        }
      } else {
        for (let t = 1.0; t < total - 0.5; t += 2.0) {
          timeSet.add(Math.round(t * 100) / 100);
        }
      }
      timeSet.add(Math.round(Math.max(0.5, total - 0.5) * 100) / 100);
      times = Array.from(timeSet).sort((a, b) => a - b);
    }

    console.log(`  Evaluating ${times.length} dense checkpoints across ${total}s...`);

    const report = {
      projectName,
      totalDuration: total,
      mode: isDense ? 'dense (>=0.5s + settled)' : 'standard',
      sampledTimestampsCount: times.length,
      sampledTimestamps: times,
      issuesByTime: {},
      totalErrors: 0,
    totalWarnings: 0,
      clean: true
    };

    const W = 1920, H = 1080;

    for (const t of times) {
      const issues = await page.evaluate((currT) => {
        window.seek(currT);

              function isVisible(el) {
                const scene = el.closest('.scene');
                if (scene) {
                  const scs = getComputedStyle(scene);
                  if (scs.display === 'none' || scs.visibility === 'hidden' || parseFloat(scs.opacity) < 0.2) return false;
                }
              const cs = getComputedStyle(el);
              if (cs.display === 'none' || cs.visibility === 'hidden' || parseFloat(cs.opacity) < 0.2) return false;
              const b = el.getBoundingClientRect();
              return b.width > 0 && b.height > 0;
            }

            const selectors = '[data-lint], .ck, .hw, .vcard, .stat, #dash, #panel, .headline, .label, .chip';
            const rawEls = [...document.querySelectorAll(selectors)];
            const activeEls = rawEls.filter(e => isVisible(e) && e.textContent.trim());

            const items = activeEls.map(e => {
              const r = e.getBoundingClientRect();
              return {
                el: e,
                id: e.id ? `#${e.id}` : `.${e.className.split(' ').filter(Boolean).join('.')}`,
                sceneId: e.closest('.scene')?.id || 'global',
                box: { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height },
                scrollW: e.scrollWidth,
                clientW: e.clientWidth,
                fontSize: parseFloat(getComputedStyle(e).fontSize) || 0,
                allow: (e.dataset.lintAllow || '').split(',').map(s => s.trim())
              };
            });

            const out = [];

            const W = window.WIDTH || 1920;
            const H = window.HEIGHT || 1080;

            for (const a of items) {
                // Offscreen check
                if (a.box.left < -20 || a.box.top < -20 || a.box.right > (W + 20) || a.box.bottom > (H + 20)) {
                  out.push({
                    type: 'offscreen',
                    id: a.id,
                    details: `Bounds: [${Math.round(a.box.left)}, ${Math.round(a.box.top)}, ${Math.round(a.box.right)}, ${Math.round(a.box.bottom)}]`
                  });
                }

                  // Clipped text check
                  if (a.scrollW > a.clientW + 4) {
                    out.push({
                      type: 'clipped-x',
                      id: a.id,
                      details: `scrollW: ${a.scrollW} > clientW: ${a.clientW}`
                    });
                  }

                    // Min font warning
                    if (a.fontSize > 0 && a.fontSize < 18) {
                      out.push({
                        type: 'min-font-warn',
                        id: a.id,
                        details: `Font size: ${a.fontSize}px < 18px`
                      });
                    }
                  }

                  // Overlap between items in same scene (excluding parent/child)
                  for (let i = 0; i < items.length; i++) {
                    for (let j = i + 1; j < items.length; j++) {
                      const A = items[i], B = items[j];
                      if (A.sceneId !== B.sceneId) continue;
                      if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
                      if (A.allow.includes(B.id) || B.allow.includes(A.id)) continue;

                      const gap = 8;
                      const xOverlap = Math.min(A.box.right, B.box.right) - Math.max(A.box.left, B.box.left) + gap;
                      const yOverlap = Math.min(A.box.bottom, B.box.bottom) - Math.max(A.box.top, B.box.top) + gap;

                      if (xOverlap > 16 && yOverlap > 16) {
                        out.push({
                          type: 'overlap',
                          idA: A.id,
                          idB: B.id,
                          details: `Collision: dx=${Math.round(xOverlap)}, dy=${Math.round(yOverlap)}`
                        });
                      }
                    }
                  }

                  return out;
      }, t);

      if (issues.length > 0) {
        report.issuesByTime[t.toFixed(2)] = issues;
        issues.forEach(iss => {
          if (iss.type === 'min-font-warn') report.totalWarnings++;
          else report.totalErrors++;
        });
      }
    }

    await browser.close();

    report.clean = report.totalErrors === 0;
    const reportFile = path.join(lintDir, 'report.json');
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf8');

    console.log(`[Linter] Dense audit complete across ${times.length} checkpoints:`);
    console.log(`  Errors  : ${report.totalErrors}`);
    console.log(`  Warnings: ${report.totalWarnings}`);
      if (report.clean) {
        console.log(`  ✓ LINT PASS: 100% clean across ${times.length} dense checkpoints.`);
      } else {
        console.log(`  ✗ LINT ISSUES DETECTED: Review ${reportFile}`);
        Object.entries(report.issuesByTime).forEach(([time, list]) => {
          console.log(`    at t=${time}s:`, list);
        });
      }

      return report;
    }

    if (process.argv[1] && process.argv[1].endsWith('lint_layout.js')) {
      const p = process.argv[2] || 'spectra';
      lintLayout(p);
    }
