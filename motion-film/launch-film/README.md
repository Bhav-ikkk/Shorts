# SPECTRA V3.0 — 18-Second Launch Film (Remotion)

> "Don't trust 'done.' Measure it."

A cinematic 18-second product introduction film for **Spectra V3.0 — An Optical Visual Referee for AI Coding Agents**, engineered specifically for X (Twitter) using **Remotion**, React 19, and TypeScript.

---

## 🎞️ Deliverables

- **Video:** `out/spectra-x-intro.mp4` (1920 × 1080, 30 FPS, 540 frames, H.264 / AAC)
- **Thumbnail:** `out/spectra-x-intro-thumbnail.png` (1920 × 1080 still from Frame 480)
- **Source Package:** `packages/launch-film/`

---

## ⏱️ Storyboard & Frame Budget (540 Frames @ 30 FPS)

| Scene | Seconds | Frame Range | Focus & Action |
|---|---|---|---|
| **01 // The Claim** | 0.0s – 3.0s | `0 – 90` | Terminal agent command finishes with `AI AGENT: FIXED.` Glitch cut at 1.5s (f45) introduces the visual interruption: `BUT IS IT?` |
| **02 // The Failure** | 3.0s – 6.0s | `90 – 180` | Smooth camera push into genuine Spectra UI. Laser red mask draws over checkout button partially occluded by sticky cart drawer. Stamped HUD: `9.6% VISIBILITY LOSS`. Center-pixel false pass explained. |
| **03 // The Two Instruments** | 6.0s – 11.0s | `180 – 330` | Dual-instrument split telemetry: **SAM 3.1** tracking 8-frame area drop (`t0: 17,299px` → `t7: 15,708px`, -9.2%) vs **Pixel Template Match** deterministic NCC matrix (`1,700px` loss, 10.0%). Converges at `TWO INSTRUMENTS. ONE VERDICT.` |
| **04 // Verdict & Repair** | 11.0s – 15.0s | `330 – 450` | Referee stamp slam: `REJECTED.` Autonomous closed-loop repair pipeline triggers: `VERIFY → PATCH → RE-VERIFY`. Split-curtain laser wipe restores button with `100.0% VISIBILITY RESTORED` (Documented demonstrated repair scenario). |
| **05 // Brand Reveal** | 15.0s – 18.0s | `450 – 540` | Genuine Spectra optical rangefinder logo reveal with glowing crosshair. Tagline: `DON'T TRUST 'DONE.' MEASURE IT.` Benchmark badge (`18/18 occlusions caught · 0.0% false-pass rate`). Clear CTA to `https://spectra-lyart.vercel.app/`. |

---

## 🎨 Art Direction & Design System

- **Palette:**
  - Deep obsidian canvas (`#090A0F`) with faint 48px millimeter alignment grid
  - Technical surfaces (`#11141F`, `#181816`, `#EAE7DF`)
  - Status indicators: Spectra Cyan (`#06B6D4`), Warning Coral (`#E05246` / `#EF4444`), Emerald Verified (`#10B981` / `#2E7D52`)
- **Typography:** Premium geometric sans-serif with high contrast headlines, paired with monospace JetBrains Mono for telemetry readouts.
- **Genuine Product Evidence:** Built exclusively with authentic Spectra screenshots, measured canonical benchmarks (Scenario S3, 9.6% edge occlusion), and the official rangefinder hardware emblem.

---

## 🔊 Sound Design

Soundtrack synthesized at 44.1kHz 16-bit stereo PCM with zero copyrighted assets:
- **0.0s – 18.0s:** Low-frequency warm analog sub-drone (110Hz + 164.81Hz)
- **0.05s:** Deep cinematic sub-bass impact drop (36Hz – 60Hz)
- **0.35s – 1.0s:** Tactile mechanical keycap clicks for terminal typing
- **1.8s:** Metallic latch & glitch tension drop for "BUT IS IT?"
- **3.0s – 4.8s:** Optical laser scan whoosh + warning measurement ticks
- **6.0s – 10.0s:** SAM 3.1 temporal tracking step clicks (t_0 through t_7)
- **11.0s:** Heavy rejection buzzer + woody latch thud for "REJECTED."
- **12.6s – 14.0s:** Split-curtain wipe laser sweep + warm Fmaj9 Rhodes verification chord for "100.0% RESTORED"
- **15.0s – 18.0s:** Confident cinematic hit and sustained chime for the final brand reveal

---

## X feed cut

`out/spectra-x-feed.mp4` is a separate 20-second, 1080×1920 film (`SpectraXFeed`). It is built for a muted phone timeline: the claim is on screen in the first two seconds, every number is from the measured v1 benchmark, and the type is large enough to read without sound.

```bash
pnpm film:render:x
```

## 🚀 Commands

### 1. Interactive Studio Preview
```bash
# From workspace root:
pnpm film:dev

# Or inside packages/launch-film:
cd packages/launch-film
npx remotion studio src/index.ts
```

### 2. Render Full MP4 (H.264 / AAC)
```bash
# From workspace root:
pnpm film:render

# Or inside packages/launch-film:
cd packages/launch-film
npx remotion render src/index.ts SpectraLaunchFilm ../../out/spectra-x-intro.mp4
```

### 3. Generate Thumbnail Still
```bash
# From workspace root:
pnpm film:thumbnail

# Or inside packages/launch-film:
cd packages/launch-film
npx remotion still src/index.ts SpectraLaunchFilm ../../out/spectra-x-intro-thumbnail.png --frame=480
```

### 4. Regenerate Synchronized Soundtrack
```bash
node scripts/synth-launch-audio.mjs
```
