import { writeFileSync } from "node:fs";

const rate = 48000;
const seconds = 15;
const n = rate * seconds;
const left = new Float64Array(n);
const right = new Float64Array(n);

const add = (t, dur, fn, amp = 1, pan = 0) => {
  const a = Math.floor(t * rate);
  const b = Math.min(n, a + Math.floor(dur * rate));
  for (let i = a; i < b; i++) {
    const u = (i - a) / rate;
    const s = fn(u) * amp;
    left[i] += s * (1 - pan);
    right[i] += s * (1 + pan);
  }
};

const env = (u, attack, dur) => {
  if (u < attack) return u / attack;
  return Math.exp(-((u - attack) / dur));
};

// Tonal bed. Quiet fifth, present the whole film.
add(0, 15, (u) => {
  const gate = Math.min(1, u / 0.45) * Math.min(1, (15 - u) / 0.6);
  return gate * (Math.sin(2 * Math.PI * 98 * u) * 0.045 + Math.sin(2 * Math.PI * 146.83 * u) * 0.02);
});

// Opening mechanical impact, soft.
add(0.04, 0.45, (u) => Math.sin(2 * Math.PI * 62 * u) * env(u, 0.004, 0.11) + Math.sin(2 * Math.PI * 124 * u) * env(u, 0.002, 0.05) * 0.3);

// Status click as FIXED. settles (~0.62s).
add(0.6, 0.06, (u) => (Math.random() * 2 - 1) * Math.exp(-u / 0.008));

// Optical scan under the push-in.
add(1.35, 2.5, (u) => {
  const tone = Math.sin(2 * Math.PI * (740 + u * 180) * u);
  return tone * 0.035 * (0.55 + 0.45 * Math.sin(2 * Math.PI * 6 * u));
});

// Two instrument ticks.
for (const t of [4.35, 5.45]) {
  add(t, 0.09, (u) => Math.sin(2 * Math.PI * 880 * u) * Math.exp(-u / 0.02));
}
// They meet.
add(6.35, 0.22, (u) => Math.sin(2 * Math.PI * 440 * u) * env(u, 0.005, 0.08) * 0.7);

// Dry rejection. Short, not a trailer hit.
add(7.0, 0.18, (u) => Math.sin(2 * Math.PI * 168 * u) * env(u, 0.002, 0.045));

// Servo for the curtain.
add(9.35, 1.7, (u) => Math.sin(2 * Math.PI * (180 + Math.sin(u * 3) * 12) * u) * 0.03 * Math.sin(Math.PI * Math.min(1, u / 1.7)));

// Verification.
add(11.05, 0.4, (u) => (Math.sin(2 * Math.PI * 523.25 * u) + Math.sin(2 * Math.PI * 659.25 * u) * 0.6) * env(u, 0.008, 0.16));

// Sonic mark.
add(12.45, 0.7, (u) => Math.sin(2 * Math.PI * 110 * u) * env(u, 0.01, 0.28) + Math.sin(2 * Math.PI * 1760 * u) * env(u, 0.001, 0.03) * 0.45);

let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
const gain = 0.72 / peak;

const data = Buffer.alloc(44 + n * 4);
data.write("RIFF", 0);
data.writeUInt32LE(36 + n * 4, 4);
data.write("WAVE", 8);
data.write("fmt ", 12);
data.writeUInt32LE(16, 16);
data.writeUInt16LE(1, 20);
data.writeUInt16LE(2, 22);
data.writeUInt32LE(rate, 24);
data.writeUInt32LE(rate * 4, 28);
data.writeUInt16LE(4, 32);
data.writeUInt16LE(16, 34);
data.write("data", 36);
data.writeUInt32LE(n * 4, 40);
for (let i = 0; i < n; i++) {
  const l = Math.max(-1, Math.min(1, left[i] * gain));
  const r = Math.max(-1, Math.min(1, right[i] * gain));
  data.writeInt16LE((l * 32767) | 0, 44 + i * 4);
  data.writeInt16LE((r * 32767) | 0, 46 + i * 4);
}
writeFileSync(new URL("../public/audio/score.wav", import.meta.url), data);
console.log("score.wav", data.length, "peak-normalized");
