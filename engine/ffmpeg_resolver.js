import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function getFfmpegPath() {
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }

  const candidatePaths = [
    path.join(rootDir, 'motion-film', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    path.join(rootDir, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffmpeg.exe'),
    'ffmpeg'
  ];

  for (const p of candidatePaths) {
    if (p === 'ffmpeg' || fs.existsSync(p)) {
      return p;
    }
  }
  return 'ffmpeg';
}

export function getFfprobePath() {
  if (process.env.FFPROBE_PATH && fs.existsSync(process.env.FFPROBE_PATH)) {
    return process.env.FFPROBE_PATH;
  }

  const candidatePaths = [
    path.join(rootDir, 'motion-film', 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe'),
    path.join(rootDir, 'node_modules', '@remotion', 'compositor-win32-x64-msvc', 'ffprobe.exe'),
    'ffprobe'
  ];

  for (const p of candidatePaths) {
    if (p === 'ffprobe' || fs.existsSync(p)) {
      return p;
    }
  }
  return 'ffprobe';
}

