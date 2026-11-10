import ffprobe from 'ffprobe-static';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const files = [
  'demo-walkthrough.mp4',
  'spectra-x-teaser.mp4',
  'spectra-x-viral.mp4',
  'assets/screenshots/01-arena-the-catch.png',
  'assets/screenshots/02-arena-split-curtain.png',
  'assets/screenshots/03-benchmark-matrix.png',
  'assets/screenshots/04-live-dropzone.png',
  'assets/screenshots/05-voice-and-lens.png',
  'assets/screenshots/06-cli-mcp-control-panel.png'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    try {
      const res = execSync(`"${ffprobe.path}" -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate -of json "${f}"`);
      console.log(f, JSON.parse(res.toString()).streams[0]);
    } catch(e) {
      console.log(f, e.message);
    }
  } else {
    console.log(f, 'NOT FOUND');
  }
}
