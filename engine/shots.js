import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function captureShots(projectName = 'spectra', timestamps = [3.0, 10.8, 24.9, 34.9, 39.9]) {
  const projectDir = path.resolve(rootDir, 'projects', projectName);
  const htmlPath = path.join(projectDir, 'build', 'index.html');
  const shotsDir = path.join(projectDir, 'build', 'shots');
  fs.mkdirSync(shotsDir, { recursive: true });

  if (!fs.existsSync(htmlPath)) {
    throw new Error(`index.html not found at ${htmlPath}`);
  }

  console.log(`[Shots] Capturing QA inspection frames at times: ${timestamps.join(', ')}s...`);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ channel: 'msedge' });
  }

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('console', m => { if (m.type() === 'error') console.log('PAGE LOG ERR:', m.text()); });
  page.on('pageerror', err => console.log('PAGEERR:', err.message));

  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => window.ready);

  for (const t of timestamps) {
    await page.evaluate(time => window.seek(time), t);
    const outPng = path.join(shotsDir, `frame_${t.toFixed(2)}s.png`);
    await page.screenshot({ path: outPng });
    console.log(`  -> Captured frame at t=${t.toFixed(2)}s -> ${outPng}`);
  }

  await browser.close();
  console.log(`[Shots] Complete. Captured ${timestamps.length} inspection frames in ${shotsDir}`);
}

if (process.argv[1] && process.argv[1].endsWith('shots.js')) {
  const p = process.argv[2] || 'spectra';
  const times = process.argv.slice(3).map(Number).filter(n => !isNaN(n));
  captureShots(p, times.length > 0 ? times : undefined);
}

