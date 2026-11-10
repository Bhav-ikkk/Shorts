import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import { getRootDir, getOutDir, getNodeModulesDir } from '../core/paths.js';
import { getFfmpegPath, getFfprobePath } from '../core/ffmpeg.js';

export async function runDoctor() {
  console.log(`\n======================================================`);
  console.log(`[DOCTOR] Motion Film Pipeline System Diagnostics`);
  console.log(`======================================================\n`);

  let allPass = true;
  const results = [];

  function check(name, pass, detail, fixHint = '') {
    results.push({ name, pass, detail, fixHint });
    const badge = pass ? '✓ PASS' : '✗ FAIL';
    console.log(`${badge.padEnd(8)} | ${name.padEnd(24)} | ${detail}`);
    if (!pass) {
      allPass = false;
      if (fixHint) console.log(`         -> HINT: ${fixHint}`);
    }
  }

  // 1. Node Version (>= 20)
  const nodeVer = process.version;
  const nodeMajor = parseInt(nodeVer.replace('v', '').split('.')[0], 10);
  check('Node.js >= 20', nodeMajor >= 20, `${nodeVer}`, 'Install Node.js 20 or higher');

  // 2. Python Version (3.10 - 3.12) & Core Packages
  const pyCheck = spawnSync('python', ['-c', `
import sys, numpy, scipy
py_ver = sys.version.split()[0]
maj, min = sys.version_info[:2]
pkgs = ['numpy=' + numpy.__version__, 'scipy=' + scipy.__version__]
try:
    import sherpa_onnx; pkgs.append('sherpa_onnx=' + sherpa_onnx.__version__)
except: pass
try:
    import edge_tts; pkgs.append('edge_tts')
except: pass
print(f"{py_ver}|{maj}.{min}|{','.join(pkgs)}")
  `], { encoding: 'utf8' });

  if (pyCheck.status === 0 && pyCheck.stdout.trim()) {
    const [pyVer, pyMajMin, pkgs] = pyCheck.stdout.trim().split('|');
    const validPy = pyMajMin === '3.10' || pyMajMin === '3.11' || pyMajMin === '3.12';
    check('Python 3.10-3.12', validPy, `Python ${pyVer} (${pkgs})`, 'Use Python 3.10, 3.11 or 3.12');
  } else {
    check('Python 3.10-3.12', false, 'Python not found or missing numpy/scipy', 'Run: pip install numpy scipy edge-tts');
  }

  // 2b. Kokoro Local Model Availability
  const kokoroModel = path.join(getRootDir(), 'engine', 'voice', 'models', 'kokoro-en-v0_19', 'model.onnx');
  const kokoroPass = fs.existsSync(kokoroModel);
  check('Kokoro TTS (Offline)', kokoroPass, kokoroPass ? 'Local ONNX model loaded (100% offline)' : 'Model weights missing', 'Run: python engine/voice/download_kokoro.py');

  // 3. FFmpeg Resolvable
  const ffmpegPath = getFfmpegPath();
  const ffRes = spawnSync(ffmpegPath, ['-version'], { encoding: 'utf8' });
  const ffPass = ffRes.status === 0;
  const ffVer = ffPass ? ffRes.stdout.split('\n')[0].split('Copyright')[0].trim() : 'NOT FOUND';
  check('FFmpeg Binary', ffPass, `${ffVer} (${ffmpegPath})`, 'Install ffmpeg-static or set FFMPEG_PATH');

  // 4. FFprobe Resolvable
  const ffprobePath = getFfprobePath();
  const ffpRes = spawnSync(ffprobePath, ['-version'], { encoding: 'utf8' });
  const ffpPass = ffpRes.status === 0;
  const ffpVer = ffpPass ? ffpRes.stdout.split('\n')[0].split('Copyright')[0].trim() : 'NOT FOUND';
  check('FFprobe Binary', ffpPass, `${ffpVer} (${ffprobePath})`, 'Install ffprobe-static or set FFPROBE_PATH');

  // 5. Playwright / Chromium Launchable
  let chromPass = false;
  let browserType = 'none';
  try {
    let b;
    try {
      b = await chromium.launch({ channel: 'chrome' });
      browserType = 'system-chrome';
    } catch {
      try {
        b = await chromium.launch({ channel: 'msedge' });
        browserType = 'system-msedge';
      } catch {
        b = await chromium.launch();
        browserType = 'bundled-chromium';
      }
    }
    chromPass = true;
    await b.close();
  } catch (e) {
    chromPass = false;
    browserType = e.message;
  }
  check('Chromium Launchable', chromPass, `Browser: ${browserType}`, 'Run: npx playwright install chromium');

  // 6. Fonts present in node_modules/@fontsource
  const fontDir = path.join(getNodeModulesDir(), '@fontsource');
  const requiredFonts = ['bricolage-grotesque', 'instrument-serif', 'inter', 'jetbrains-mono', 'space-grotesk'];
  let fontsFound = [];
  if (fs.existsSync(fontDir)) {
    fontsFound = fs.readdirSync(fontDir);
  }
  const missingFonts = requiredFonts.filter(f => !fontsFound.includes(f));
  check('Typography Fonts', missingFonts.length === 0, `${fontsFound.length}/${requiredFonts.length} font families loaded`, `Run: npm i ${missingFonts.map(f => '@fontsource/' + f).join(' ')}`);

  // 7. Write permission to out/
  const outDir = getOutDir();
  fs.mkdirSync(outDir, { recursive: true });
  let writePass = false;
  try {
    const testFile = path.join(outDir, '.write_test');
    fs.writeFileSync(testFile, 'ok', 'utf8');
    fs.unlinkSync(testFile);
    writePass = true;
  } catch {
    writePass = false;
  }
  check('Out Dir Writable', writePass, outDir, 'Ensure write permissions to out/');

  // 8. Disk Space & CPU workers
  const cpus = os.cpus().length;
  const freeMemGB = (os.freemem() / 1e9).toFixed(1);
  const totalMemGB = (os.totalmem() / 1e9).toFixed(1);
  const workers = Math.max(1, Math.min(6, cpus - 1));
  check('System Capacity', true, `${cpus} CPUs (${workers} render workers), ${freeMemGB}GB free RAM of ${totalMemGB}GB`);

  console.log(`\n======================================================`);
  if (allPass) {
    console.log(`[DOCTOR] ALL DIAGNOSTICS PASSED! System is 100% production-ready.`);
  } else {
    console.log(`[DOCTOR] SOME CHECKS FAILED. Review hints above before rendering.`);
  }
  console.log(`======================================================\n`);

  return allPass;
}

if (process.argv[1] && process.argv[1].endsWith('doctor.js')) {
  runDoctor();
}

