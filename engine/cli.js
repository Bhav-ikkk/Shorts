import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { composeScene } from './scene_composer.js';
import { dumpEvents } from './event_dumper.js';
import { captureShots } from './shots.js';
import { renderFrames } from './render/render_engine.js';
import { masterAudio } from './audio/master.js';
import { muxVideo } from './render/mux.js';
import { runQA } from './qa_engine.js';
import { lintLayout } from './qa/lint_layout.js';
import { runDoctor } from './qa/doctor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Parse CLI args: e.g. node cli.js <command> [projectName]
const args = process.argv.slice(2);
const command = args[0] || 'all';

// Look for --project=xyz or second arg
let projectName = 'spectra';
for (let i = 1; i < args.length; i++) {
  if (args[i].startsWith('--project=')) {
    projectName = args[i].split('=')[1];
  } else if (!args[i].startsWith('-')) {
    projectName = args[i];
    break;
  }
}

function runPython(scriptName, ...extraArgs) {
  const scriptPath = path.join(__dirname, scriptName);
  const projectDir = path.join(rootDir, 'projects', projectName);
  const res = spawnSync('python', [scriptPath, projectDir, ...extraArgs], {
    stdio: 'inherit',
    cwd: __dirname
  });
  if (res.status !== 0) {
    throw new Error(`Python script ${scriptName} failed with exit code ${res.status}`);
  }
}

async function main() {
  console.log(`[Pipeline] Running command '${command}' for project: '${projectName}'`);

  switch (command) {
    case 'doctor':
      await runDoctor();
      break;

    case 'voice':
      console.log(`\n=== STEP 1: VOICE & ACOUSTIC TIMINGS ===`);
      runPython('voice_engine.py');
      break;

    case 'build':
      console.log(`\n=== STEP 2: BUILD MOTION CANVAS ===`);
      await composeScene(projectName);
      await dumpEvents(projectName);
      break;

    case 'lint':
      console.log(`\n=== STEP 2.4: LAYOUT & COLLISION LINTER ===`);
      await lintLayout(projectName);
      break;

    case 'shots':
      console.log(`\n=== STEP 2.5: CAPTURE INSPECTION FRAMES ===`);
      const times = args.slice(2).map(Number).filter(n => !isNaN(n));
      await captureShots(projectName, times.length > 0 ? times : undefined);
      break;

    case 'audio':
      console.log(`\n=== STEP 3: PROCEDURAL AUDIO & SFX SYNTHESIS ===`);
      runPython('audio_engine.py');
      break;

    case 'master':
      console.log(`\n=== STEP 3.5: TWO-PASS LOUDNORM MASTERING (48kHz) ===`);
      masterAudio(projectName);
      break;

    case 'render':
      console.log(`\n=== STEP 4: OFFLINE FRAME RENDERING ===`);
      await renderFrames(projectName);
      break;

    case 'mux':
      console.log(`\n=== STEP 5: AUDIO-VIDEO MUXING & MASTERING ===`);
      masterAudio(projectName);
      muxVideo(projectName);
      break;

    case 'qa':
      console.log(`\n=== STEP 6: QUALITY ASSURANCE VERIFICATION ===`);
      runQA(projectName);
      try {
        runPython('contact_sheet.py');
      } catch (err) {
        console.warn(`[QA] Contact sheet warning:`, err.message);
      }
      break;

    case 'all':
      console.log(`\n=== STARTING FULL PRODUCTION PIPELINE FOR: ${projectName} ===`);
      console.log(`\n--- STEP 1: Voice Generation & Acoustic Alignment ---`);
      runPython('voice_engine.py');

      console.log(`\n--- STEP 2: Motion Canvas Composition & Event Dump ---`);
      await composeScene(projectName);
      await dumpEvents(projectName);

      console.log(`\n--- STEP 2.5: Layout Linter ---`);
      try {
        await lintLayout(projectName);
      } catch (e) {
        console.warn('[Linter Warning]:', e.message);
      }

      console.log(`\n--- STEP 3: Frame Stills Inspection (QA) ---`);
      await captureShots(projectName);

      console.log(`\n--- STEP 4: Procedural SFX & Music Synthesis ---`);
      runPython('audio_engine.py');

      console.log(`\n--- STEP 4.5: Audio Mastering (Two-Pass -14 LUFS, 48kHz) ---`);
      masterAudio(projectName);

      console.log(`\n--- STEP 5: Deterministic Offline Video Rendering ---`);
      await renderFrames(projectName);

      console.log(`\n--- STEP 6: Final Audio-Video Muxing ---`);
      muxVideo(projectName);

      console.log(`\n--- STEP 7: Quality Assurance Verification & Contact Sheet ---`);
      runQA(projectName);
      try {
        runPython('contact_sheet.py');
      } catch (err) {
        console.warn(`[QA] Contact sheet warning:`, err.message);
      }

      console.log(`\n>>> FULL PRODUCTION RUN COMPLETE! Check out/${projectName}-motion-film.mp4 <<<`);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(`Available commands: voice, build, lint, shots, audio, master, render, mux, qa, all`);
      process.exit(1);
  }
}

main().catch(err => {
  console.error('\n[Pipeline Error]:', err.message);
  process.exit(1);
});

