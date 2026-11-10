import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getFfmpegPath } from '../core/ffmpeg.js';
import { getProjectBuildDir, getOutDir } from '../core/paths.js';

export function muxVideo(projectName = 'spectra') {
  const buildDir = getProjectBuildDir(projectName);
  const outDir = getOutDir();
  fs.mkdirSync(outDir, { recursive: true });

  const silentVideo = path.join(buildDir, 'video_silent.mp4');
  const masterAudio = path.join(buildDir, 'master.wav');
  const srtFile = path.join(buildDir, `${projectName}.srt`);
  const finalMp4 = path.join(outDir, `${projectName}-motion-film.mp4`);

  if (!fs.existsSync(silentVideo)) {
    throw new Error(`Silent video not found at ${silentVideo}. Run render step first.`);
  }
  if (!fs.existsSync(masterAudio)) {
    throw new Error(`Mastered audio not found at ${masterAudio}. Run master step first.`);
  }

  const ffmpegBin = getFfmpegPath();
  console.log(`[Mux] Muxing video and mastered 48kHz audio into final release MP4...`);
  console.log(`  Video : ${silentVideo}`);
  console.log(`  Audio : ${masterAudio}`);
  console.log(`  Target: ${finalMp4}`);

  const args = [
    '-y',
    '-i', silentVideo,
    '-i', masterAudio,
    '-c:v', 'copy',
    '-c:a', 'aac',
    '-b:a', '192k',
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

  console.log(`[Mux] Successfully generated final master film:\n  -> ${finalMp4}`);
  return finalMp4;
}

if (process.argv[1] && process.argv[1].endsWith('mux.js')) {
  const p = process.argv[2] || 'spectra';
  muxVideo(p);
}

