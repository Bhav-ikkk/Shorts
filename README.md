# Motion Video Generation (MPX Engine & Skill)

A high-performance, code-driven motion design and automated video generation engine. Turns structured topics and declarative scene configurations (`project.json`) into broadcast-grade 1080p videos (widescreen 16:9 and vertical 9:16 Shorts) with 100% local neural voice synthesis, word-level kinetic captions, and procedural DSP audio mastering.

Built as an **MPX Skill** and autonomous agent pipeline.

---

## ⚡ Key Highlights

- **100% Local & Offline**: Zero HTTPS dependencies during video rendering. Neural voice synthesis runs completely on-device via **Kokoro ONNX** (`sherpa-onnx`) at 48 kHz.
- **Declarative Archetypes**: No bespoke HTML/CSS per episode. Projects are compiled from a single declarative `project.json` composing reusable motion archetypes (`contrast-hook`, `metrics-count`, `split-compare`, `terminal-run`, `tile-proof`, `kinetic-cta`, etc.).
- **Kinetic Word-Level Captions**: Live word-by-word synchronized caption animation driven by acoustic onset/offset timestamps.
- **Motion Kit & Camera Rig**: Cinematic easing curves (`enter`, `exit`, `pop`, `camera`, `settle`, `impact`), SplitText word animation, living-hold procedural drift, and virtual camera zooms.
- **Procedural Sound Design**: Automated SFX emission (whooshes, pops, thuds, impact drops) with dynamic sidechain voice ducking and harmonic chord beds.
- **Broadcast EBU R128 Loudnorm**: Two-pass audio mastering strictly gating $-14 \pm 0.5\text{ LUFS}$ integrated loudness, $\text{TP} \le -1.0\text{ dBFS}$ True Peak, and $48\text{ kHz}$ sample rate.
- **Dense Layout & Collision Linter**: Automated browser-based spatial and temporal verification checking for bounding box collisions, text clipping, and offscreen spills across $\ge 0.5\text{ s}$ checkpoints.
- **Deterministic Parallel Renderer**: Multi-worker Playwright rendering producing frame-accurate $30\text{ fps}$ video at CRF 16 with x264 medium preset.

---

## 🏗️ Architecture Overview

```
                      [ Topic / Script ]
                              │
                              ▼
                       [ project.json ]
                              │
          ┌───────────────────┴───────────────────┐
          ▼                                       ▼
  [ Kokoro Neural TTS ]                  [ Motion Composer ]
 (100% Offline ONNX 48kHz)              (Declarative Archetypes)
          │                                       │
          ▼                                       ▼
   [ anchors.json ] ──────────────► [ index.html + Motion Kit ]
(Word-Level Acoustic Ladder)           (Captions, Camera Rig, GSAP)
          │                                       │
          ▼                                       ▼
   [ Procedural Audio ]                   [ Dense Layout Linter ]
 (SFX Bus, Ducking, Bed)               (100+ Checkpoints, Overlap Check)
          │                                       │
          ▼                                       ▼
[ Two-Pass EBU R128 Master ]           [ Parallel Frame Renderer ]
 (-14 LUFS, TP <= -1.0 dBFS)           (Multi-Worker Headless Chromium)
          │                                       │
          └───────────────────┬───────────────────┘
                              ▼
                     [ FFmpeg Muxer ]
                              │
                              ▼
                    [ Broadcast QA Gate ]
               (Black Detect, Freeze Detect)
                              │
                              ▼
              [ Release Video & Contact Sheet ]
```

---

## 🚀 Quickstart

### 1. Prerequisites
- **Node.js**: $\ge 20.0.0$
- **Python**: $3.10 - 3.12$ with `numpy`, `scipy`, `sherpa-onnx`
- **FFmpeg**: Bundled automatically via `ffmpeg-static` / `ffprobe-static`

### 2. Setup
```bash
# Clone the repository
git clone https://github.com/Bhav-ikkk/Shorts.git
cd Shorts

# Install Node dependencies
npm install

# Install Python requirements
pip install numpy scipy sherpa-onnx edge-tts

# Download the local Kokoro ONNX model (~319 MB, run once)
python engine/voice/download_kokoro.py

# Verify system readiness
npm test
```

---

## 🛠️ CLI Pipeline Commands

You can run individual stages or execute the full automated pipeline for any project in `projects/<project-name>`:

| Command | Description |
| :--- | :--- |
| `npm test` | Runs comprehensive system diagnostics (`film:doctor`). |
| `npm run film:voice -- <project>` | Synthesizes neural voice & generates word-level acoustic anchors. |
| `npm run film:build -- <project>` | Compiles `project.json` into the deterministic motion canvas (`index.html`). |
| `npm run film:lint -- <project>` | Runs the dense layout and collision linter across all keyframe timestamps. |
| `npm run film:audio -- <project>` | Synthesizes procedural SFX, dynamic ducking, and subtitles (`.srt`). |
| `npm run film:master -- <project>` | Runs two-pass EBU R128 loudness normalization ($48\text{ kHz}$). |
| `npm run film:render -- <project>` | Deterministically renders frames across parallel browser workers. |
| `npm run film:mux -- <project>` | Muxes video and mastered audio into final MP4. |
| `npm run film:qa -- <project>` | Verifies broadcast specs and exports a 12-frame contact sheet. |
| `npm run film:all -- <project>` | Executes the entire end-to-end production pipeline in one command. |

---

## 📦 Projects & Samples

- **`roblox-blackout`**: Fast-paced high-retention faceless explainer detailing the 73-hour October 2021 platform outage. Uses Kokoro neural TTS, fast contrast hooks, metric tickers, and terminal simulation.
- **`sample-saas`**: Fictional SaaS product film ("PulseFlow") demonstrating split-comparisons, metric counts, and tile proofs.
- **`spectra`**: Flagship visual verification film demonstrating 8 coordinated archetypes.
- **`template`**: Blank starter template for rapid creation of new videos.

---

## 📄 License

MIT License. Designed and maintained for modern motion design automation.

