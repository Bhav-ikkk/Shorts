import fs from 'node:fs';
import path from 'node:path';

export function synthesizeLaunchSoundtrack(outputPath, durationSeconds = 18.0, sampleRate = 44100) {
  console.log(`[Soundtrack] Synthesizing ${durationSeconds}s 44.1kHz 16-bit stereo mechanical soundtrack...`);
  const numFrames = Math.floor(sampleRate * durationSeconds);
  const left = new Float32Array(numFrames);
  const right = new Float32Array(numFrames);

  const add = (channel, idx, val) => {
    if (idx >= 0 && idx < numFrames) {
      channel[idx] += val;
    }
  };

  // -------------------------------------------------------------
  // 1. Warm Analog Sub-Pad Drone (0.0s – 18.0s)
  // Low-pass filtered warm drone at 110Hz (A2) + 164.81Hz (E3)
  // -------------------------------------------------------------
  const droneCutoff = 260;
  const droneRc = 1 / (2 * Math.PI * droneCutoff);
  const droneDt = 1 / sampleRate;
  const droneAlpha = droneDt / (droneRc + droneDt);
  let lpL1 = 0, lpL2 = 0, lpR1 = 0, lpR2 = 0;

  for (let i = 0; i < numFrames; i++) {
    const t = i / sampleRate;
    const f1L = 110.0 + 0.2 * Math.sin(0.3 * t);
    const f1R = 110.0 - 0.2 * Math.sin(0.3 * t);
    const f2L = 164.81 + 0.25 * Math.cos(0.4 * t);
    const f2R = 164.81 - 0.25 * Math.cos(0.4 * t);

    // Warm triangle
    const tri1L = 2 * Math.abs(2 * ((t * f1L) % 1) - 1) - 1;
    const tri1R = 2 * Math.abs(2 * ((t * f1R) % 1) - 1) - 1;
    const tri2L = 2 * Math.abs(2 * ((t * f2L) % 1) - 1) - 1;
    const tri2R = 2 * Math.abs(2 * ((t * f2R) % 1) - 1) - 1;

    // Fade out smoothly over last 1.5 seconds
    const masterFade = t > 16.5 ? Math.max(0, (18.0 - t) / 1.5) : 1.0;

    const rawL = (tri1L * 0.65 + tri2L * 0.35) * 0.10 * masterFade;
    const rawR = (tri1R * 0.65 + tri2R * 0.35) * 0.10 * masterFade;

    lpL1 += droneAlpha * (rawL - lpL1);
    lpL2 += droneAlpha * (lpL1 - lpL2);
    lpR1 += droneAlpha * (rawR - lpR1);
    lpR2 += droneAlpha * (lpR1 - lpR2);

    const airL = (Math.random() * 2 - 1) * 0.002 * masterFade;
    const airR = (Math.random() * 2 - 1) * 0.002 * masterFade;

    left[i] += lpL2 + airL;
    right[i] += lpR2 + airR;
  }

  // -------------------------------------------------------------
  // 2. Tactile Mechanical Clicks / Leica Shutter
  // -------------------------------------------------------------
  function addMechanicalClick(timeSec, pan = 0.0, pitch = 1.0, gain = 1.0) {
    const startIdx = Math.floor(timeSec * sampleRate);
    const clickFrames = Math.floor(0.024 * sampleRate);

    for (let n = 0; n < clickFrames; n++) {
      const tau = n / sampleRate;
      const idx = startIdx + n;
      const attack = tau < 0.0003 ? tau / 0.0003 : Math.exp(-650 * (tau - 0.0003));
      const noise = (Math.random() * 2 - 1) * attack * 0.38;
      const thudFreq = (60 + 80 * Math.exp(-250 * tau)) * pitch;
      const thud = Math.sin(2 * Math.PI * thudFreq * tau) * Math.exp(-190 * tau) * 0.35;
      const latch = Math.sin(2 * Math.PI * (2800 * pitch) * tau) * Math.exp(-400 * tau) * 0.22;

      const sample = (noise + thud + latch) * gain;
      const panL = (1 - pan) * 0.5;
      const panR = (1 + pan) * 0.5;

      add(left, idx, sample * panL * 2);
      add(right, idx, sample * panR * 2);
    }
  }

  // -------------------------------------------------------------
  // 3. Deep Cinematic Sub Impact
  // -------------------------------------------------------------
  function addSubDrop(timeSec, gain = 0.6) {
    const startIdx = Math.floor(timeSec * sampleRate);
    const dropFrames = Math.floor(0.70 * sampleRate);

    for (let n = 0; n < dropFrames; n++) {
      const tau = n / sampleRate;
      const idx = startIdx + n;
      const f = 36 + 60 * Math.exp(-7.5 * tau);
      const phase = 2 * Math.PI * (36 * tau + (60 / -7.5) * (Math.exp(-7.5 * tau) - 1));
      const env = Math.exp(-4.0 * tau);
      const raw = Math.sin(phase) * env * gain;
      const sub = Math.tanh(raw * 1.3) * 0.9;
      const sub2 = Math.sin(phase * 2) * env * 0.24;

      add(left, idx, sub + sub2);
      add(right, idx, sub + sub2);
    }
  }

  // -------------------------------------------------------------
  // 4. Optical Laser Scan Sweep
  // -------------------------------------------------------------
  function addLaserScanWhoosh(startSec, endSec, gain = 0.3) {
    const startIdx = Math.floor(startSec * sampleRate);
    const totalDur = endSec - startSec;
    const totalFrames = Math.floor(totalDur * sampleRate);
    let bL1 = 0, bL2 = 0, bR1 = 0, bR2 = 0;

    for (let n = 0; n < totalFrames; n++) {
      const tau = n / sampleRate;
      const idx = startIdx + n;
      const p = tau / totalDur;
      const sweepFreq = 300 + 950 * Math.sin(Math.PI * p);
      const pan = -0.7 + 1.4 * p;
      const noise = (Math.random() * 2 - 1) * 0.26;
      const q = 0.88;
      const omega = (2 * Math.PI * sweepFreq) / sampleRate;
      const sinO = Math.sin(omega);

      bL1 += sinO * (noise - bL1 - q * bL2);
      bL2 += sinO * bL1;
      bR1 += sinO * (noise - bR1 - q * bR2);
      bR2 += sinO * bR1;

      const env = Math.sin(Math.PI * p) * gain;
      const tone = Math.sin(2 * Math.PI * sweepFreq * tau) * 0.12 * env;

      const panL = (1 - pan) * 0.5;
      const panR = (1 + pan) * 0.5;

      add(left, idx, (bL1 * 0.6 + tone) * env * panL * 2);
      add(right, idx, (bR1 * 0.6 + tone) * env * panR * 2);
    }
  }

  // -------------------------------------------------------------
  // 5. Rejection Buzz / Dissonant Warning Thud
  // -------------------------------------------------------------
  function addRejectionSound(timeSec, gain = 0.5) {
    const startIdx = Math.floor(timeSec * sampleRate);
    const durFrames = Math.floor(0.45 * sampleRate);

    for (let n = 0; n < durFrames; n++) {
      const tau = n / sampleRate;
      const idx = startIdx + n;
      const env = Math.exp(-6.5 * tau) * gain;

      // Tritone / dissonant square buzzer pulse
      const f1 = 110; // A2
      const f2 = 155.56; // Eb3 (diminished fifth / tritone)
      const pulse1 = Math.sign(Math.sin(2 * Math.PI * f1 * tau));
      const pulse2 = Math.sign(Math.sin(2 * Math.PI * f2 * tau));
      const thud = Math.sin(2 * Math.PI * 75 * Math.exp(-15 * tau) * tau);

      const sample = (pulse1 * 0.35 + pulse2 * 0.35 + thud * 0.6) * env;
      add(left, idx, sample * 0.95);
      add(right, idx, sample * 0.95);
    }
  }

  // -------------------------------------------------------------
  // 6. Warm Emerald Verification Chord (Fmaj9 Rhodes-style)
  // -------------------------------------------------------------
  function addEmeraldChord(timeSec, gain = 0.28) {
    const startIdx = Math.floor(timeSec * sampleRate);
    const chordFrames = Math.floor(2.6 * sampleRate);
    const chordFreqs = [174.61, 261.63, 329.63, 392.00, 523.25];
    const haasFrames = Math.floor(0.018 * sampleRate);

    for (let n = 0; n < chordFrames; n++) {
      const tau = n / sampleRate;
      const idxL = startIdx + n;
      const idxR = startIdx + n + haasFrames;
      const attack = tau < 0.008 ? tau / 0.008 : 1.0;
      const decay = Math.exp(-2.0 * tau);
      const env = attack * decay * gain;

      let sumL = 0;
      let sumR = 0;

      for (let k = 0; k < chordFreqs.length; k++) {
        const f = chordFreqs[k];
        const fundamental = Math.sin(2 * Math.PI * f * tau);
        const chime = Math.sin(2 * Math.PI * (f * 3.8) * tau) * Math.exp(-5.0 * tau) * 0.15;
        const voice = fundamental + chime;
        const spread = (k / (chordFreqs.length - 1)) * 0.6 - 0.3;
        sumL += voice * (0.5 - spread);
        sumR += voice * (0.5 + spread);
      }

      add(left, idxL, sumL * env);
      add(right, idxR, sumR * env);
    }
  }

  // -------------------------------------------------------------
  // TIMELINE FOLEY SYNCHRONIZATION (0.0s – 18.0s)
  // -------------------------------------------------------------

  // === SCENE 01: THE CLAIM (0.0s – 3.0s) ===
  addSubDrop(0.05, 0.62);
  addMechanicalClick(0.06, 0.0, 1.0, 1.3);

  // Terminal typing for "AI AGENT: FIXED."
  addMechanicalClick(0.35, -0.3, 1.2, 0.7);
  addMechanicalClick(0.55, -0.2, 1.25, 0.75);
  addMechanicalClick(0.75, -0.1, 1.15, 0.8);
  addMechanicalClick(0.95, 0.0, 1.3, 0.85);

  // Glitch cut for "BUT IS IT?" at 1.8s
  addSubDrop(1.80, 0.55);
  addMechanicalClick(1.80, 0.4, 0.8, 1.4);
  addMechanicalClick(1.83, -0.4, 1.6, 0.9);

  // === SCENE 02: THE FAILURE (3.0s – 6.0s) ===
  // UI reveal camera zoom
  addSubDrop(3.00, 0.58);
  addMechanicalClick(3.00, 0.0, 0.95, 1.2);
  addLaserScanWhoosh(3.1, 4.0, 0.2);

  // Optical detection ticks as red box locks
  addMechanicalClick(3.8, 0.2, 1.4, 0.6);
  addMechanicalClick(4.1, 0.25, 1.45, 0.65);
  addMechanicalClick(4.4, 0.3, 1.5, 0.7);
  // Stamp "9.6% VISIBILITY LOSS" at 4.8s
  addSubDrop(4.80, 0.65);
  addMechanicalClick(4.80, 0.3, 0.85, 1.4);

  // === SCENE 03: THE TWO INSTRUMENTS (6.0s – 11.0s) ===
  // Instrument 1: SAM 3.1 reveal at 6.0s
  addSubDrop(6.00, 0.55);
  addMechanicalClick(6.00, -0.4, 1.1, 1.2);

  // SAM 8-frame temporal tracking ticks
  for (let t = 6.4; t <= 7.8; t += 0.2) {
    addMechanicalClick(t, -0.3 + 0.05 * (t - 6.4), 1.0 + 0.1 * (t - 6.4), 0.55);
  }

  // Instrument 2: Pixel Template Match reveal at 8.5s
  addSubDrop(8.50, 0.52);
  addMechanicalClick(8.50, 0.4, 1.15, 1.2);
  addLaserScanWhoosh(8.6, 9.8, 0.22);

  // Convergence: "TWO INSTRUMENTS. ONE VERDICT." at 10.0s
  addSubDrop(10.00, 0.6);
  addMechanicalClick(10.00, 0.0, 0.9, 1.3);

  // === SCENE 04: THE VERDICT AND REPAIR (11.0s – 15.0s) ===
  // "REJECTED." stamp slam at 11.0s
  addSubDrop(11.02, 0.72);
  addRejectionSound(11.02, 0.65);
  addMechanicalClick(11.02, 0.0, 0.75, 1.5);

  // Repair pipeline clicks: VERIFY -> PATCH -> RE-VERIFY at 12.0s
  addMechanicalClick(12.00, -0.3, 1.3, 0.7);
  addMechanicalClick(12.18, 0.0, 1.35, 0.75);
  addMechanicalClick(12.36, 0.3, 1.4, 0.8);

  // Split-curtain wipe across checkout button (12.6s - 14.2s)
  addLaserScanWhoosh(12.6, 14.2, 0.32);

  // Emerald chord on 100.0% RESTORED at 13.5s
  addEmeraldChord(13.50, 0.36);
  addMechanicalClick(13.50, 0.0, 1.1, 1.2);

  // === SCENE 05: THE BRAND REVEAL (15.0s – 18.0s) ===
  // Spectra Logo reveal at 15.0s
  addSubDrop(15.00, 0.68);
  addMechanicalClick(15.00, 0.0, 0.88, 1.4);
  addEmeraldChord(15.10, 0.30);

  // Final lock at 16.2s
  addMechanicalClick(16.20, 0.0, 1.05, 1.1);

  // -------------------------------------------------------------
  // Master Soft Limiting & 16-Bit PCM WAV Writing
  // -------------------------------------------------------------
  const byteRate = sampleRate * 2 * 2;
  const blockAlign = 4;
  const dataSize = numFrames * blockAlign;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(2, 22); // Stereo
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(16, 34); // 16-bit
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  const pcm = Buffer.alloc(dataSize);
  for (let i = 0; i < numFrames; i++) {
    const sampleL = Math.tanh(left[i] * 1.1) * 0.94;
    const sampleR = Math.tanh(right[i] * 1.1) * 0.94;

    const intL = Math.max(-32768, Math.min(32767, Math.floor(sampleL * 32767)));
    const intR = Math.max(-32768, Math.min(32767, Math.floor(sampleR * 32767)));

    pcm.writeInt16LE(intL, i * 4);
    pcm.writeInt16LE(intR, i * 4 + 2);
  }

  fs.writeFileSync(outputPath, Buffer.concat([header, pcm]));
  console.log(`[Soundtrack] Success! Written to ${outputPath}`);
}

// Generate to both public directories
synthesizeLaunchSoundtrack('public/assets/spectra-soundtrack.wav', 18.0);
synthesizeLaunchSoundtrack('packages/launch-film/public/assets/spectra-soundtrack.wav', 18.0);
