import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getFfmpegPath } from './ffmpeg_resolver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function muxVideo(projectName = 'spectra') {
  const projectDir = path.resolve(rootDir, 'projects', projectName);
  const buildDir = path.join(projectDir, 'build');
  const outDir = path.resolve(rootDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const silentVideo = path.join(buildDir, 'video_silent.mp4');
  const mixAudio = path.join(buildDir, 'mix.wav');
  const srtFile = path.join(buildDir, `${projectName}.srt`);
  const finalMp4 = path.join(outDir, `${projectName}-motion-film.mp4`);

  if (!fs.existsSync(silentVideo)) {
    throw new Error(`Silent video not found at ${silentVideo}. Run render step first.`);
  }
  if (!fs.existsSync(mixAudio)) {
    throw new Error(`Mix audio not found at ${mixAudio}. Run audio synthesis step first.`);
  }

  const eventsFile = path.join(buildDir, 'events.json');
  let totalDur = 42.0;
  if (fs.existsSync(eventsFile)) {
    const evData = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    totalDur = evData.total || 42.0;
  }
  const fadeStart = Math.max(0, totalDur - 1.2).toFixed(2);

  const ffmpegBin = getFfmpegPath();
  console.log(`[Mux] Muxing video and audio with loudnorm mastering...`);
  console.log(`  Video: ${silentVideo}`);
  console.log(`  Audio: ${mixAudio}`);
  console.log(`  Output: ${finalMp4}`);

  const args = [
    '-y',
    '-i', silentVideo,
    '-i', mixAudio,
    '-map', '0:v',
    '-map', '1:a',
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-af', 'loudnorm=I=-14:TP=-1.5:LRA=7',
    '-shortest',
    '-movflags', '+faststart',
    finalMp4
  ];

  const res = spawnSync(ffmpegBin, args, { stdio: 'inherit' });
  if (res.status !== 0) {
    throw new Error(`FFmpeg muxing failed with status ${res.status}`);
  }

  if (fs.existsSync(srtFile)) {
    const outSrt = path.join(outDir, `${projectName}-motion-film.srt`);
    fs.copyFileSync(srtFile, outSrt);
    console.log(`  Subtitles copied: ${outSrt}`);
  }

  console.log(`[Mux] Successfully produced final motion design film:\n  -> ${finalMp4}`);
  return finalMp4;
}

if (process.argv[1] && process.argv[1].endsWith('mux_engine.js')) {
  const p = process.argv[2] || 'spectra';
  muxVideo(p);
}
