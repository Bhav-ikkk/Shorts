#!/usr/bin/env node
/**
 * Blocky Story Engine — Post-Encode Loudness & Peak Gate (EBU R128)
 * Verifies that mastered output meets broadcast & mobile platform specs:
 * - Integrated Loudness: -14.0 ± 0.5 LUFS
 * - True Peak / Sample Peak: ≤ -1.0 dBFS (measured after lossy AAC encoding)
 * - Loudness Range (LRA): ≤ 7.0 LU
 * - Audio Sample Rate: 48,000 Hz
 */

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const BASE_DIR = path.resolve(__dirname, '..');
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

function resolveFfprobe() {
  if (process.env.FFPROBE) return process.env.FFPROBE;
  try {
    const fps = require('ffprobe-static');
    if (fps?.path && fs.existsSync(fps.path)) return fps.path;
  } catch {}
  return 'ffprobe';
}

const FFMPEG = resolveFfmpeg();
const FFPROBE = resolveFfprobe();

function verifyLoudness(targetFile = null) {
  const filePath = targetFile || path.join(OUT_DIR, `${NAME}-motion-film.mp4`);

  if (!fs.existsSync(filePath)) {
    throw new Error(`[Loudness QA] Target file does not exist: ${filePath}`);
  }

  console.log(`\n======================================================`);
  console.log(`[Loudness QA Gate] Measuring EBU R128 Loudness on:`);
  console.log(`  ${filePath}`);
  console.log(`======================================================\n`);

  // 1. Probe audio stream format (Sample Rate & Codec)
  const probe = spawnSync(FFPROBE, [
    '-v', 'error',
    '-show_entries', 'stream=codec_name,sample_rate,channels',
    '-of', 'json',
    filePath
  ], { encoding: 'utf8' });

  let sampleRate = null;
  let audioCodec = null;
  if (probe.status === 0) {
    try {
      const pData = JSON.parse(probe.stdout);
      const aStream = pData.streams?.find(s => s.sample_rate);
      if (aStream) {
        sampleRate = parseInt(aStream.sample_rate, 10);
        audioCodec = aStream.codec_name;
      }
    } catch {}
  }

  // 2. Run FFmpeg ebur128 analysis
  const res = spawnSync(FFMPEG, [
    '-hide_banner', '-nostats',
    '-i', filePath,
    '-af', 'ebur128=peak=true',
    '-f', 'null', '-'
  ], { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

  const output = res.stderr || '';
  const summaryPart = output.split(/Summary:/i).pop() || '';

  let integratedLUFS = null;
  let truePeakDBFS = null;
  let lraLU = null;

  const iMatch = summaryPart.match(/I:\s*([-\d.]+)\s*LUFS/);
  if (iMatch) integratedLUFS = parseFloat(iMatch[1]);

  const tpMatch = summaryPart.match(/Peak:\s*([-\d.]+)\s*dBFS/);
  if (tpMatch) truePeakDBFS = parseFloat(tpMatch[1]);

  const lraMatch = summaryPart.match(/LRA:\s*([-\d.]+)\s*LU/);
  if (lraMatch) lraLU = parseFloat(lraMatch[1]);

  // Validation bounds
  const TARGET_LUFS = -14.0;
  const LUFS_TOLERANCE = 0.5;
  const MAX_TRUE_PEAK = -1.0;
  const MAX_LRA = 7.0;

  const passLUFS = integratedLUFS !== null && Math.abs(integratedLUFS - TARGET_LUFS) <= LUFS_TOLERANCE;
  const passPeak = truePeakDBFS !== null && truePeakDBFS <= MAX_TRUE_PEAK;
  const passLRA = lraLU !== null && lraLU <= MAX_LRA;
  const passSampleRate = !sampleRate || sampleRate === 48000;

  const allPassed = passLUFS && passPeak && passLRA && passSampleRate;

  console.log(`--- EBU R128 Loudness Analysis Results ---`);
  console.log(`  Integrated Loudness : ${integratedLUFS !== null ? integratedLUFS + ' LUFS' : 'N/A'} (Target: -14.0 ± 0.5 LUFS) -> ${passLUFS ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  True / Sample Peak  : ${truePeakDBFS !== null ? truePeakDBFS + ' dBFS' : 'N/A'} (Target: ≤ -1.0 dBFS)      -> ${passPeak ? '✓ PASS' : '✗ FAIL'}`);
  console.log(`  Loudness Range (LRA): ${lraLU !== null ? lraLU + ' LU' : 'N/A'}       (Target: ≤ 7.0 LU)        -> ${passLRA ? '✓ PASS' : '✗ FAIL'}`);
  if (sampleRate) {
    console.log(`  Audio Sample Rate   : ${sampleRate} Hz (${audioCodec})   (Target: 48000 Hz)        -> ${passSampleRate ? '✓ PASS' : '✗ FAIL'}`);
  }

  const report = {
    file: filePath,
    timestamp: new Date().toISOString(),
    metrics: {
      integratedLUFS,
      truePeakDBFS,
      lraLU,
      sampleRate,
      audioCodec
    },
    targets: {
      targetLUFS: TARGET_LUFS,
      lufsTolerance: LUFS_TOLERANCE,
      maxTruePeak: MAX_TRUE_PEAK,
      maxLRA: MAX_LRA,
      targetSampleRate: 48000
    },
    checks: {
      passLUFS,
      passPeak,
      passLRA,
      passSampleRate
    },
    passed: allPassed
  };

  const reportPath = path.join(OUT_DIR, 'lufs_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n[Loudness QA] Verification report saved -> ${reportPath}`);

  if (!allPassed) {
    console.error(`\n[Loudness QA Error] Mastered audio does not meet platform broadcast constraints.`);
    process.exit(1);
  }

  console.log(`\n>>> LOUDNESS QA GATE PASSED: Master meets YouTube/Instagram broadcast audio standards. <<<\n`);
  return report;
}

if (require.main === module) {
  const target = process.argv[2] || null;
  verifyLoudness(target);
}

module.exports = { verifyLoudness };
