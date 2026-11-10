import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export async function dumpEvents(projectName = 'spectra') {
  const projectDir = path.resolve(rootDir, 'projects', projectName);
  const htmlPath = path.join(projectDir, 'build', 'index.html');
  if (!fs.existsSync(htmlPath)) {
    throw new Error(`index.html not found at ${htmlPath}. Run composeScene first.`);
  }

  console.log(`[Events] Opening motion canvas to dump sound events...`);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome' });
  } catch {
    browser = await chromium.launch({ channel: 'msedge' });
  }

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  page.on('pageerror', err => console.log('PAGEERR:', err.message));

  await page.goto(pathToFileURL(htmlPath).href);
  await page.evaluate(() => window.ready);

  const data = await page.evaluate(() => ({
    total: window.TOTAL,
    events: window.EVENTS,
    anch: window.ANCH
  }));

  const eventsFile = path.join(projectDir, 'build', 'events.json');
  fs.writeFileSync(eventsFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`[Events] Dumped ${data.events.length} SFX events (total duration: ${data.total}s) -> ${eventsFile}`);

  await browser.close();
  return data;
}

if (process.argv[1] && process.argv[1].endsWith('event_dumper.js')) {
  const p = process.argv[2] || 'spectra';
  dumpEvents(p);
}

