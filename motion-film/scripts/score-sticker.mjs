import { writeFileSync } from "node:fs";

const rate = 48000;
const seconds = 16;
const n = rate * seconds;
const L = new Float64Array(n);
const R = new Float64Array(n);

let seed = 7;
const rand = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

const add = (t, dur, fn, amp = 1, pan = 0) => {
  const a = Math.max(0, Math.floor(t * rate));
  const b = Math.min(n, a + Math.floor(dur * rate));
  for (let i = a; i < b; i++) {
    const s = fn((i - a) / rate) * amp;
    L[i] += s * (1 - pan);
    R[i] += s * (1 + pan);
  }
};

const env = (u, a, d) => (u < a ? u / a : Math.exp(-(u - a) / d));

const pluck = (t, freq, amp = 0.16, pan = 0) =>
  add(t, 0.22, (u) => Math.sin(2 * Math.PI * freq * u) * env(u, 0.004, 0.07), amp, pan);

const slap = (t) => {
  add(t, 0.05, (u) => (rand() * 2 - 1) * Math.exp(-u / 0.008), 0.55);
  add(t, 0.09, (u) => Math.sin(2 * Math.PI * 210 * u) * env(u, 0.002, 0.03), 0.45);
};

const whoosh = (t, pan) =>
  add(t, 0.22, (u) => (rand() * 2 - 1) * Math.sin(Math.PI * (u / 0.22)) * (0.4 + u * 4), 0.22, pan);

const tick = (t) => add(t, 0.04, (u) => Math.sin(2 * Math.PI * 1480 * u) * Math.exp(-u / 0.012), 0.22);

// Light pulse so the track has a body, not just hits.
for (let i = 0; i < 32; i++) {
  const t = i * 0.5;
  pluck(t, i % 2 === 0 ? 220 : 277.18, 0.07, i % 2 === 0 ? -0.15 : 0.15);
}

// Window in.
add(0.04, 0.28, (u) => Math.sin(2 * Math.PI * 74 * u) * env(u, 0.003, 0.07), 0.7);
// Sticker slap on "9.6% still hidden" (frame 16).
slap(16 / 30);
// Slide into the number.
whoosh(72 / 30, 0.35);
// Count, then land.
for (let i = 0; i < 7; i++) tick(88 / 30 + i * 0.13);
slap(118 / 30);
// Screenshot slides in from the left.
whoosh(156 / 30, -0.4);
add(156 / 30, 0.18, (u) => Math.sin(2 * Math.PI * 180 * u) * env(u, 0.004, 0.06), 0.22);
// Bars.
tick(292 / 30);
tick(300 / 30);
tick(308 / 30);
slap(312 / 30);
// End mark, word, URL, then a short chord that holds.
slap(396 / 30);
pluck(404 / 30, 392, 0.28);
pluck(412 / 30, 523.25, 0.22);
add(414 / 30, 1.5, (u) => {
  const chord = Math.sin(2 * Math.PI * 261.63 * u) + Math.sin(2 * Math.PI * 329.63 * u) * 0.7 + Math.sin(2 * Math.PI * 392 * u) * 0.55;
  return chord * env(u, 0.02, 0.45);
}, 0.28);

let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.86 / Math.max(peak, 0.001);
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
  data.writeInt16LE(Math.max(-1, Math.min(1, L[i] * gain)) * 32767, 44 + i * 4);
  data.writeInt16LE(Math.max(-1, Math.min(1, R[i] * gain)) * 32767, 46 + i * 4);
}
writeFileSync(new URL("../public/audio/sticker-score.wav", import.meta.url), data);
console.log("sticker-score.wav", seconds + "s");
