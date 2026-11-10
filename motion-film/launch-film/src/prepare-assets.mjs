import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';

const dirs = ['public/assets', 'packages/launch-film/public/assets'];

for (const dir of dirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  // 1. Copy logo
  fs.copyFileSync('assets/spectra-logo.svg', path.join(dir, 'spectra-logo.svg'));

  // 2. Copy clean UI screenshot
  fs.copyFileSync('assets/screenshots/01-arena-the-catch.png', path.join(dir, 'spectra-clean-ui.png'));

  // 3. Copy repaired UI screenshot
  fs.copyFileSync('assets/screenshots/02-arena-split-curtain.png', path.join(dir, 'spectra-repaired-ui.png'));

  // 4. Copy benchmark matrix screenshot
  fs.copyFileSync('assets/screenshots/03-benchmark-matrix.png', path.join(dir, 'spectra-benchmark-ui.png'));

  // 5. Copy canonical clip for S3
  if (fs.existsSync('benchmark/clips/dom_catch_010_v1.mp4')) {
    fs.copyFileSync('benchmark/clips/dom_catch_010_v1.mp4', path.join(dir, 's3-clip.mp4'));
  }
}

// 6. Extract high-quality clean demo clip from demo-walkthrough.mp4 (e.g. 3.0s to 13.0s, 10s)
const demoTarget = 'public/assets/spectra-demo.mp4';
const demoTargetPkg = 'packages/launch-film/public/assets/spectra-demo.mp4';

console.log('Extracting demo clip from demo-walkthrough.mp4...');
execSync(`"${ffmpeg}" -y -ss 00:00:03 -i demo-walkthrough.mp4 -t 10 -c:v libx264 -pix_fmt yuv420p -an "${demoTarget}"`);
fs.copyFileSync(demoTarget, demoTargetPkg);

console.log('Assets prepared successfully!');
