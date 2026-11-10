import ffmpeg from 'ffmpeg-static';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

const outDir = '.inspect-demo';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Extract 1 frame every 5 seconds
execSync(`"${ffmpeg}" -y -i demo-walkthrough.mp4 -vf fps=1/5 "${outDir}/frame_%03d.png"`);
console.log('Extracted frames:', fs.readdirSync(outDir));
