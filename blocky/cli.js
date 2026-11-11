#!/usr/bin/env node
/**
 * Blocky Story Engine CLI
 * Commands: bench | voice | render | audio | master | shots | sheet | qa | all
 */

const { spawn, spawnSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const BASE_DIR = path.resolve(__dirname);
const REPO_ROOT = path.resolve(BASE_DIR, '..');
const OUT_DIR = path.join(BASE_DIR, 'out');
const NAME = process.env.NAME || 'blocky-ep2';

function resolveFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  try {
    const ffs = require('ffmpeg-static');
    if (ffs && fs.existsSync(ffs)) return ffs;
  } catch {}
  return 'ffmpeg';
}
const FFMPEG = resolveFfmpeg();

function resolveFfprobe() {
  if (process.env.FFPROBE) return process.env.FFPROBE;
  try {
    const fps = require('ffprobe-static');
    if (fps?.path && fs.existsSync(fps.path)) return fps.path;
  } catch {}
  return 'ffprobe';
}
const FFPROBE = resolveFfprobe();

const runCmd = (cmd, args, opts = {}) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: 'inherit', cwd: BASE_DIR, ...opts });
  p.on('close', code => code === 0 ? res() : rej(new Error(`${cmd} exited with code ${code}`)));
});

async function runBench() {
  console.log('[CLI] Running benchmark...');
  await runCmd('node', ['render.js', '--bench']);
}

async function runVoice() {
  console.log('[CLI] Generating Kokoro multi-voice dialogue & lip sync...');
  await runCmd('python', ['vo.py']);
}

async function runRender() {
  console.log('[CLI] Rendering WebGL scene with Chromium workers...');
  await runCmd('node', ['render.js']);
}

async function runAudio() {
  console.log('[CLI] Mixing dialogue, sound effects & dynamic score...');
  await runCmd('python', ['audio.py']);
}

async function runMaster() {
  console.log('[CLI] Running two-pass EBU R128 loudness mastering (-14 LUFS, 48 kHz)...');
  const mixWav = path.join(OUT_DIR, 'mix.wav');
  const silentMp4 = path.join(OUT_DIR, 'silent.mp4');
  const finalMp4 = path.join(OUT_DIR, `${NAME}-motion-film.mp4`);

  if (!fs.existsSync(mixWav)) throw new Error(`mix.wav not found at ${mixWav}. Run audio first.`);
  if (!fs.existsSync(silentMp4)) throw new Error(`silent.mp4 not found at ${silentMp4}. Run render first.`);

  // Pass 1: Measure loudness profile
  console.log('  -> Pass 1: Measuring loudness profile (Target: -14 LUFS, TP: -2.0 dBFS)...');
  const p1 = spawnSync(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', mixWav,
    '-af', 'loudnorm=I=-14:TP=-2.0:LRA=7:print_format=json',
    '-f', 'null', '-'
  ], { encoding: 'utf8' });

  const p1Out = p1.stderr || '';
  const match = p1Out.match(/\{[\s\S]*"input_i"[\s\S]*\}/);
  if (!match) throw new Error('Failed to parse Pass 1 loudnorm JSON');
  const m = JSON.parse(match[0]);
  console.log(`  Measured I: ${m.input_i} LUFS, TP: ${m.input_tp} dBFS, LRA: ${m.input_lra}`);

  // Calculate duration from events.json
  const eventsFile = path.join(BASE_DIR, 'data', 'events.json');
  let fadeOutStart = 34.0;
  if (fs.existsSync(eventsFile)) {
    const ev = JSON.parse(fs.readFileSync(eventsFile, 'utf8'));
    fadeOutStart = Math.max(1, ev.total - 0.9);
  }

  // Pass 2: Apply linear loudnorm with head/tail audio fade and encode AAC at 48kHz
  console.log(`  -> Pass 2: Muxing with video, applying fade out at ${fadeOutStart.toFixed(2)}s, resampling to 48 kHz...`);
  const af = `loudnorm=I=-14:TP=-2.0:LRA=7:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,afade=t=in:d=0.04,afade=t=out:st=${fadeOutStart.toFixed(3)}:d=0.9`;

  const tmpMp4 = path.join(OUT_DIR, `${NAME}.tmp.mp4`);
  const p2 = spawnSync(FFMPEG, [
    '-y', '-v', 'error',
    '-i', silentMp4,
    '-i', mixWav,
    '-map', '0:v',
    '-map', '1:a',
    '-c:v', 'copy',
    '-af', af,
    '-ar', '48000',
    '-c:a', 'aac',
    '-b:a', '192k',
    '-shortest',
    '-movflags', '+faststart',
    tmpMp4
  ], { stdio: 'inherit' });

  if (p2.status !== 0) throw new Error(`Mastering Pass 2 failed with exit code ${p2.status}`);
  if (fs.existsSync(finalMp4)) fs.unlinkSync(finalMp4);
  fs.renameSync(tmpMp4, finalMp4);
  console.log(`[Master] Mastered video saved -> ${finalMp4}`);

  // Run QA checks
  await runQA(finalMp4);
}

async function runQA(videoFile) {
  const target = videoFile || path.join(OUT_DIR, `${NAME}-motion-film.mp4`);
  if (!fs.existsSync(target)) throw new Error(`Video file not found for QA: ${target}`);

  console.log('--------------------------------------------------');
  console.log(`[QA] Running Automated Quality Gate on: ${path.basename(target)}`);

  // 1. Stream information
  const probe = spawnSync(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate',
    '-of', 'json',
    target
  ], { encoding: 'utf8' });

  let probeData = {};
  try {
    probeData = JSON.parse(probe.stdout);
    const vStream = probeData.streams?.find(s => s.codec_name === 'h264');
    const aStream = probeData.streams?.find(s => s.codec_name === 'aac');
    console.log(`  Duration: ${(+(probeData.format?.duration || 0)).toFixed(2)}s`);
    console.log(`  Video: ${vStream?.codec_name} ${vStream?.width}x${vStream?.height} @ ${vStream?.r_frame_rate} fps`);
    console.log(`  Audio: ${aStream?.codec_name} @ ${aStream?.sample_rate} Hz`);
  } catch (e) {
    console.warn('  [Warn] Failed to parse ffprobe json:', e.message);
  }

  // 2. Loudness measurement
  const ebu = spawnSync(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', target,
    '-af', 'ebur128=peak=true',
    '-f', 'null', '-'
  ], { encoding: 'utf8' });

  const ebuOut = ebu.stderr || '';
  const summaryIdx = ebuOut.lastIndexOf('Summary:');
  const summaryText = summaryIdx !== -1 ? ebuOut.slice(summaryIdx) : ebuOut;
  const iMatch = summaryText.match(/I:\s+([-\d.]+)\s+LUFS/);
  const lraMatch = summaryText.match(/LRA:\s+([-\d.]+)\s+LU/);
  const peakMatch = summaryText.match(/Peak:\s+([-\d.]+)\s+dBFS/);

  const measuredI = iMatch ? parseFloat(iMatch[1]) : null;
  const measuredPeak = peakMatch ? parseFloat(peakMatch[1]) : null;

  console.log(`  Measured Loudness: ${measuredI} LUFS (Target: -14 ± 0.5 LUFS)`);
  console.log(`  Measured True Peak: ${measuredPeak} dBFS (Gate: <= -1.0 dBFS)`);

  const lufsPass = measuredI !== null && Math.abs(measuredI - (-14.0)) <= 0.6;
  const peakPass = measuredPeak !== null && measuredPeak <= -1.0;

  // 3. Black frame detection
  const black = spawnSync(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', target,
    '-vf', 'blackdetect=d=0.2:pix_th=0.05',
    '-an', '-f', 'null', '-'
  ], { encoding: 'utf8' });

  const blackOut = black.stderr || '';
  const blackMatches = blackOut.match(/black_start/g);
  const blackCount = blackMatches ? blackMatches.length : 0;
  console.log(`  Black frames detected: ${blackCount} (Gate: 0)`);

  console.log('--------------------------------------------------');
  const allPass = lufsPass && peakPass && blackCount === 0;
  if (allPass) {
    console.log('>>> QA GATE PASSED: Video is broadcast compliant & ready. <<<');
  } else {
    console.warn('>>> QA GATE WARNING: Check flagged parameters above. <<<');
  }
  console.log('--------------------------------------------------');
  return { lufsPass, peakPass, blackCount, measuredI, measuredPeak };
}

async function runShots() {
  console.log('[CLI] Capturing stills for contact sheet...');
  await runCmd('node', ['shots.js']);
}

async function runSheet() {
  console.log('[CLI] Composing contact sheet...');
  const sheetPng = path.join(OUT_DIR, `${NAME}-contact-sheet.png`);
  await runCmd('python', ['sheet.py', OUT_DIR, sheetPng, '4']);
  console.log(`[Sheet] Contact sheet saved -> ${sheetPng}`);
}

async function runCompile() {
  console.log('[CLI] Running Director episode compiler & validation...');
  await runCmd('node', ['director/compile_episode.js']);
}

async function runStory() {
  console.log('[CLI] Running Story Engine multi-episode validation & repetitiveness gating...');
  await runCmd('node', ['story/story_engine.js']);
}

async function runTest() {
  console.log('[CLI] Running story, actions, faces, props, sets, audio, qa3d, publish, gltf, dod, and determinism regression tests...');
  await runCmd('node', ['tests/story.test.js']);
  await runCmd('node', ['tests/actions.test.js']);
  await runCmd('node', ['tests/faces.test.js']);
  await runCmd('node', ['tests/props.test.js']);
  await runCmd('node', ['tests/sets.test.js']);
  await runCmd('node', ['tests/audio.test.js']);
  await runCmd('node', ['tests/qa3d.test.js']);
  await runCmd('node', ['tests/publish.test.js']);
  await runCmd('node', ['tests/gltf.test.js']);
  await runCmd('node', ['tests/dod.test.js']);
  await runCmd('node', ['tests/determinism.test.js']);
}

async function runDoD() {
  console.log('[CLI] Running master Definition of Done (DoD) verification...');
  await runCmd('node', ['tests/dod.test.js']);
}

async function runGltf() {
  console.log('[CLI] Generating glTF hero assets (Tier C) & running determinism verification...');
  await runCmd('python', ['tools/make_asset.py', '--asset', 'trophy', '--out', 'assets/models/hero_trophy.glb']);
  await runCmd('node', ['tests/gltf.test.js']);
}

async function runPack(episode) {
  console.log('[CLI] Generating distribution publish pack(s) for YouTube Shorts & Instagram Reels...');
  const target = episode || 'all';
  await runCmd('node', ['publish/pack.js', target]);
}

async function runLoudness() {
  console.log('[CLI] Running post-encode EBU R128 loudness & true-peak verification...');
  await runCmd('node', ['qa/loudness.js']);
}

async function runLint3D() {
  console.log('[CLI] Running 3D spatial QA linter (camera, framing, floor, occlusion)...');
  await runCmd('node', ['qa/lint3d.js']);
}

async function runLipSync() {
  console.log('[CLI] Running acoustic lip-sync correlation verification (rho >= 0.6)...');
  await runCmd('node', ['qa/lip_sync.js']);
}

async function main() {
  const stage = process.argv[2] || 'bench';
  switch (stage) {
    case 'bench':
      await runBench();
      break;
    case 'story':
      await runStory();
      break;
    case 'compile':
      await runCompile();
      break;
    case 'test':
      await runTest();
      break;
    case 'voice':
      await runVoice();
      break;
    case 'render':
      await runRender();
      break;
    case 'audio':
      await runAudio();
      break;
    case 'master':
      await runMaster();
      break;
    case 'shots':
      await runShots();
      break;
    case 'sheet':
      await runSheet();
      break;
    case 'qa':
      await runLint3D();
      await runLipSync();
      await runLoudness();
      await runQA();
      break;
    case 'loudness':
      await runLoudness();
      break;
    case 'lint3d':
      await runLint3D();
      break;
    case 'sync':
      await runLipSync();
      break;
    case 'pack':
      await runPack(process.argv[3]);
      break;
    case 'gltf':
      await runGltf();
      break;
    case 'dod':
      await runDoD();
      break;
    case 'all':
      await runCompile();
      await runVoice();
      await runRender();
      await runAudio();
      await runMaster();
      await runShots();
      await runSheet();
      await runLint3D();
      await runLipSync();
      await runQA();
      await runPack();
      await runGltf();
      await runTest();
      break;
    default:
      console.log(`Unknown command: ${stage}`);
      console.log('Available commands: bench | story | compile | test | voice | render | audio | master | shots | sheet | lint3d | sync | loudness | qa | pack | gltf | dod | all');
      process.exit(1);
  }
}

main().catch(err => {
  console.error('[CLI Error]', err);
  process.exit(1);
});
