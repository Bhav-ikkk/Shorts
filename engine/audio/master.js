import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getFfmpegPath } from '../core/ffmpeg.js';
import { getProjectBuildDir } from '../core/paths.js';

export function masterAudio(projectName = 'spectra') {
  const buildDir = getProjectBuildDir(projectName);
  const mixWav = path.join(buildDir, 'mix.wav');
  const masterWav = path.join(buildDir, 'master.wav');

  if (!fs.existsSync(mixWav)) {
    throw new Error(`mix.wav not found at ${mixWav}. Run audio synthesis first.`);
  }

  const ffmpegBin = getFfmpegPath();
  console.log(`[Mastering] Running two-pass EBU R128 loudness mastering (-14 LUFS, 48 kHz)...`);

  // Pass 1: Measure loudness profile with TP target -2.0 dBFS to prevent AAC post-encode overshoot
  console.log(`  -> Pass 1: Measuring loudness profile (Target: -14 LUFS, TP: -2.0 dBFS)...`);
  const pass1Args = [
    '-hide_banner', '-nostats',
    '-i', mixWav,
    '-af', 'loudnorm=I=-14:TP=-2.0:LRA=7:print_format=json',
    '-f', 'null',
    '-'
  ];
  const p1 = spawnSync(ffmpegBin, pass1Args, { encoding: 'utf8' });
  const p1Out = p1.stderr || '';

  // Extract JSON output from loudnorm
  const jsonMatch = p1Out.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
  if (!jsonMatch) {
    console.warn(`  [Warn] Failed to parse Pass 1 JSON. Using standard single-pass.`);
    const fallbackArgs = [
      '-y', '-i', mixWav,
      '-af', 'loudnorm=I=-14:TP=-2.0:LRA=7',
      '-ar', '48000',
      masterWav
    ];
    spawnSync(ffmpegBin, fallbackArgs, { stdio: 'inherit' });
    return masterWav;
  }

  const measured = JSON.parse(jsonMatch[0]);
  console.log(`  Measured I: ${measured.input_i} LUFS, TP: ${measured.input_tp} dBFS, LRA: ${measured.input_lra}`);

  // Pass 2: Apply linear normalization to target -14 LUFS, TP -2.0 and 48 kHz
  console.log(`  -> Pass 2: Applying linear normalization and resampling to 48000 Hz...`);
  const loudnormFilter = `loudnorm=I=-14:TP=-2.0:LRA=7:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}:offset=${measured.target_offset}:linear=true`;

  const pass2Args = [
    '-y',
    '-i', mixWav,
    '-af', loudnormFilter,
    '-ar', '48000',
    masterWav
  ];

  const p2 = spawnSync(ffmpegBin, pass2Args, { stdio: 'inherit' });
  if (p2.status !== 0) {
    throw new Error(`Mastering Pass 2 failed with exit code ${p2.status}`);
  }

  console.log(`[Mastering] Audio mastered successfully -> ${masterWav}`);
  return masterWav;
}

if (process.argv[1] && process.argv[1].endsWith('master.js')) {
  const p = process.argv[2] || 'spectra';
  masterAudio(p);
}

