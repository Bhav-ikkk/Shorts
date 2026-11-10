import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { getFfmpegPath, getFfprobePath } from './core/ffmpeg.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

export function runQA(projectName = 'spectra') {
  const outDir = path.resolve(rootDir, 'out');
  const finalMp4 = path.join(outDir, `${projectName}-motion-film.mp4`);

  if (!fs.existsSync(finalMp4)) {
    throw new Error(`Video file not found at ${finalMp4}`);
  }

  const ffprobeBin = getFfprobePath();
  const ffmpegBin = getFfmpegPath();

  console.log(`\n======================================================`);
  console.log(`[QA Gate] Running Comprehensive Verification on:`);
  console.log(`  ${finalMp4}`);
  console.log(`======================================================\n`);

  // 1. FFprobe stream specs
  console.log(`--- 1. Stream & Container Specs ---`);
  const probeArgs = [
    '-v', 'error',
    '-show_entries', 'format=duration,size,bit_rate:stream=codec_name,width,height,r_frame_rate,sample_rate',
    '-of', 'json',
    finalMp4
  ];
  let probeData = {};
  let videoStream = null;
  let audioStream = null;

  const probeRes = spawnSync(ffprobeBin, probeArgs, { encoding: 'utf8' });
  if (probeRes.status === 0) {
    try {
      probeData = JSON.parse(probeRes.stdout);
      videoStream = probeData.streams?.find(s => s.width);
      audioStream = probeData.streams?.find(s => s.sample_rate);
      console.log(`  Video Codec : ${videoStream?.codec_name}`);
      console.log(`  Resolution  : ${videoStream?.width}x${videoStream?.height}`);
      console.log(`  Framerate   : ${videoStream?.r_frame_rate} fps`);
      console.log(`  Audio Codec : ${audioStream?.codec_name} (${audioStream?.sample_rate} Hz)`);
      console.log(`  Duration    : ${parseFloat(probeData.format?.duration).toFixed(2)}s`);
      console.log(`  File Size   : ${(parseInt(probeData.format?.size, 10) / (1024 * 1024)).toFixed(2)} MB`);
    } catch {
      console.log(probeRes.stdout);
    }
  } else {
    console.log(`  (ffprobe warning: ${probeRes.stderr})`);
  }

  // 2. Black frame detection
  console.log(`\n--- 2. Black Frame Detection (blackdetect) ---`);
  const blackArgs = [
    '-hide_banner', '-nostats',
    '-i', finalMp4,
    '-vf', 'blackdetect=d=0.2:pix_th=0.05',
    '-an',
    '-f', 'null',
    '-'
  ];
  const blackRes = spawnSync(ffmpegBin, blackArgs, { encoding: 'utf8' });
  const blackOutput = blackRes.stderr || '';
  const blackMatches = (blackOutput.match(/black_start/g) || []).length;
  if (blackMatches === 0) {
    console.log(`  [PASS] 0 black frames detected. All scenes transitions are clean.`);
  } else {
    console.log(`  [WARN] ${blackMatches} black segments detected. Check transition wipes.`);
  }

  // 3. EBU R128 Loudness Verification (Post-AAC encode measurement)
  console.log(`\n--- 3. Broadcast Loudness (ebur128) ---`);
  const loudArgs = [
    '-hide_banner', '-nostats',
    '-i', finalMp4,
    '-af', 'ebur128=peak=true',
    '-f', 'null',
    '-'
  ];
  const loudRes = spawnSync(ffmpegBin, loudArgs, { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });
  const loudOutput = loudRes.stderr || '';
  const summaryMatch = loudOutput.match(/Summary:[\s\S]+/);
  if (summaryMatch) {
    console.log(summaryMatch[0].trim());
  } else {
    console.log(`  Loudness analysis complete.`);
  }

  // Parse loudness metrics from the final Summary section
  let integratedLUFS = null;
  let truePeakDBFS = null;
  let lraLU = null;

  const summaryPart = loudOutput.split(/Summary:/i).pop() || '';

  const iMatch = summaryPart.match(/I:\s*([-\d.]+)\s*LUFS/);
  if (iMatch) integratedLUFS = parseFloat(iMatch[1]);

  const tpMatch = summaryPart.match(/Peak:\s*([-\d.]+)\s*dBFS/);
  if (tpMatch) truePeakDBFS = parseFloat(tpMatch[1]);

  const lraMatch = summaryPart.match(/LRA:\s*([-\d.]+)\s*LU/);
  if (lraMatch) lraLU = parseFloat(lraMatch[1]);

  // 4. Freeze Detection
  console.log(`\n--- 4. Freeze Detection (freezedetect d=1.2s) ---`);
  const freezeArgs = [
    '-hide_banner', '-nostats',
    '-i', finalMp4,
    '-vf', 'freezedetect=n=-60dB:d=1.2',
    '-an',
    '-f', 'null',
    '-'
  ];
  const freezeRes = spawnSync(ffmpegBin, freezeArgs, { encoding: 'utf8' });
  const freezeOutput = freezeRes.stderr || '';
  const freezeMatches = (freezeOutput.match(/freeze_start/g) || []).length;
  console.log(`  ${freezeMatches === 0 ? '[PASS] 0 freezes > 1.2s detected' : `[WARN] ${freezeMatches} freeze periods > 1.2s detected`}`);

  // Verification assertions
  const checks = {
    audioSampleRate48k: audioStream?.sample_rate === 48000 || audioStream?.sample_rate === '48000',
    targetLUFS: integratedLUFS !== null ? Math.abs(integratedLUFS - (-14.0)) <= 0.5 : false,
    truePeakPostEncode: truePeakDBFS !== null ? truePeakDBFS <= -1.0 : false,
    zeroBlackFrames: blackMatches === 0,
    video1080p: (videoStream?.width === 1920 && videoStream?.height === 1080) || (videoStream?.width === 1080 && videoStream?.height === 1920)
  };

  const allPassed = Object.values(checks).every(Boolean);

  console.log(`\n--- Verification Summary ---`);
  console.log(`  Audio 48 kHz         : ${checks.audioSampleRate48k ? '✓ PASS' : '✗ FAIL'} (${audioStream?.sample_rate} Hz)`);
  console.log(`  Loudness -14±0.5 LUFS: ${checks.targetLUFS ? '✓ PASS' : '✗ FAIL'} (${integratedLUFS} LUFS)`);
  console.log(`  True Peak <= -1.0    : ${checks.truePeakPostEncode ? '✓ PASS' : '✗ FAIL'} (${truePeakDBFS} dBFS)`);
  console.log(`  Zero Black Frames    : ${checks.zeroBlackFrames ? '✓ PASS' : '✗ FAIL'} (${blackMatches} segments)`);
  console.log(`  Resolution Standard  : ${checks.video1080p ? '✓ PASS' : '✗ FAIL'} (${videoStream?.width}x${videoStream?.height})`);

  const qaReport = {
    projectName,
    file: finalMp4,
    timestamp: new Date().toISOString(),
    specs: {
      videoCodec: videoStream?.codec_name,
      width: videoStream?.width,
      height: videoStream?.height,
      fps: videoStream?.r_frame_rate,
      audioCodec: audioStream?.codec_name,
      audioSampleRate: audioStream?.sample_rate,
      durationSec: parseFloat(probeData.format?.duration || 0),
      fileSizeBytes: parseInt(probeData.format?.size || 0, 10)
    },
    loudness: {
      integratedLUFS,
      targetLUFS: -14.0,
      lraLU,
      truePeakDBFS,
      truePeakGateDBFS: -1.0
    },
    blackFramesDetected: blackMatches,
    freezesDetected: freezeMatches,
    checks,
    allPassed
  };

  const projectBuildDir = path.resolve(rootDir, 'projects', projectName, 'build');
  fs.mkdirSync(projectBuildDir, { recursive: true });
  fs.writeFileSync(path.join(projectBuildDir, 'qa.json'), JSON.stringify(qaReport, null, 2), 'utf8');
  fs.writeFileSync(path.join(outDir, `${projectName}-qa.json`), JSON.stringify(qaReport, null, 2), 'utf8');

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`[QA Gate] ✓ VERIFICATION PASSED! Video meets broadcast specifications.`);
  } else {
    console.log(`[QA Gate] ✗ VERIFICATION FAILED! Review criteria failures above.`);
    throw new Error(`QA Gate checks failed for ${projectName}. TruePeak=${truePeakDBFS} dBFS (gate <= -1.0), I=${integratedLUFS} LUFS (gate -14±0.5)`);
  }
  console.log(`======================================================\n`);
  return qaReport;
}

if (process.argv[1] && process.argv[1].endsWith('qa_engine.js')) {
  const p = process.argv[2] || 'spectra';
  runQA(p);
}

