# Universal Code-Driven Motion Design Video Pipeline

A deterministic, code-driven video generation engine that transforms any product brief into a studio-grade 1080p motion design film with synchronized neural voiceover, procedurally synthesized SFX, and broadcast-ready mastering.

---

## 1. Why the Old Way Broke vs. How the Engine Works

### What Went Wrong Before
1. **The Remotion Static Cards Trap**: In the legacy setup (`motion-film/`), static screenshot PNGs were translated and faded on hardcoded frame numbers. There was no real kinetic motion graphics, and any script edit broke the entire timeline.
2. **Environment & Path Incompatibility**: Claude's original reference files were hardcoded to a Linux VM (`/home/claude/...`). Running them on Windows caused instant crashes.
3. **No Acoustic Sync**: Decoupling animations from the spoken voice caused animations to drift and stutter.

### The New Architecture
1. **HTML5 + CSS3 + GSAP 3 Motion Canvas**: Web standards provide high-DPI vector rendering, typography, gradients, clip-paths, and SVG filters.
2. **Acoustic Voice Anchoring (`voice_engine.py`)**: Neural TTS generates studio voice tracks. RMS energy segmentation (10ms windows) and letter-weighted onset estimation produce `anchors.json` and `anchors.js`. Visual elements anticipate word onsets by 50–80ms.
3. **Deterministic Offline Seeking (`render_engine.js`)**: Playwright loads the canvas, pauses the GSAP timeline, and seeks `window.seek(i / 30)` for every single frame. Screenshots are streamed directly to FFmpeg (`image2pipe`) via libx264 CRF 18. **Zero frame drops. Zero latency stutter.**
4. **Procedural Sound Synthesis & Dynamic Ducking (`audio_engine.py`)**: Animation triggers emit sound markers (`ev('tap', t)`), which NumPy/SciPy synthesizes into low-mid UI SFX. An ambient 5-chord pad resolves under the final brand, and dynamic sidechain ducking attenuates background SFX whenever the voice is active.
5. **Broadcast Mastering (`mux_engine.js`)**: Muxes audio and video with EBU R128 loudness normalization (`-14 LUFS`, peak $\le -1.5\text{ dBFS}$) and exports synchronized `.srt` subtitles.

---

## 2. Project Directory Structure

```
video-gen/
├── package.json                   # Root package & npm script shortcuts
├── PIPELINE_GUIDE.md              # This documentation guide
├── engine/                        # Universal Core Pipeline Engine
│   ├── cli.js                     # Unified CLI runner (voice, build, shots, audio, render, mux, qa, all)
│   ├── ffmpeg_resolver.js         # Cross-platform FFmpeg/FFprobe binary detector
│   ├── voice_engine.py            # Neural TTS & acoustic energy/word segmentation
│   ├── soften.py                  # DSP chain (de-esser, warmth EQ, RMS leveller, room reverb)
│   ├── scene_composer.js          # Motion canvas compiler & font resolver
│   ├── event_dumper.js            # Playwright event & duration extractor
│   ├── shots.js                   # Instant inspection frame capture
│   ├── audio_engine.py            # Procedural SFX, chord pad & dynamic ducking mix
│   ├── render_engine.js           # Deterministic frame-by-frame Playwright seek-renderer
│   ├── mux_engine.js              # FFmpeg audio-video muxer & loudnorm mastering
│   └── qa_engine.js               # ffprobe, blackdetect & ebur128 QA gating
├── projects/                      # Product Projects
│   ├── spectra/                   # Reference implementation (Spectra V3.0)
│   │   ├── project.json           # Metadata, theme, script, voice config
│   │   ├── scenes/                # style.css, body.html, choreography.js
│   │   ├── audio/                 # Generated voice tracks (L1..L13.wav)
│   │   └── build/                 # Compiled canvas, mix.wav, anchors.js, shots/
│   └── template/                  # Starter template for ANY product
│       ├── project.json           # Clean declarative configuration
│       ├── scenes/                # Modular scene templates
│       └── README.md              # Quick start guide
└── out/                           # Production deliverables
    ├── spectra-motion-film.mp4    # 1080p30 studio master video
    └── spectra-motion-film.srt    # Synchronized subtitle track
```

---

## 3. How to Create a Video for ANY Product (3 Steps)

### Step 1: Clone the Template
```bash
cp -r projects/template projects/my-saas
```

### Step 2: Configure `projects/my-saas/project.json`
Fill in your product metadata, brand palette, and 13-line script:
```json
{
  "name": "AcmeAI",
  "tagline": "Autonomous code verification for modern teams.",
  "url": "acme.ai",
  "theme": {
    "paper": "#F2EDE2",
    "ink": "#0E0F13",
    "brand": "#2F4BFF",
    "defect": "#F2432D",
    "verified": "#12A66B"
  },
  "voice": {
    "provider": "edge-tts",
    "voice": "en-US-ChristopherNeural",
    "rate": "-4%"
  },
  "badges": [
    "OPEN SOURCE",
    "CI/CD READY",
    "MCP POWERED"
  ],
  "script": [
    { "id": "L1", "spoken": "Everything said: all good.", "caption": "Everything said: all good.", "pause_after": 0.30 },
    { "id": "L2", "spoken": "But customers couldn't checkout.", "caption": "But customers couldn't checkout.", "pause_after": 0.35 }
    ...
  ]
}
```

### Step 3: Run the Pipeline
Run a single command from the project root:
```bash
node engine/cli.js all my-saas
```
The finished video is written to:
`out/my-saas-motion-film.mp4`

---

## 4. Modular CLI Commands

You can run individual stages of the pipeline whenever tweaking copy, timing, or layouts:

| Command | Description |
| :--- | :--- |
| `npm run film:voice -- --project=<name>` | Generates speech, trims silence, measures word onsets $\to$ `anchors.json` |
| `npm run film:build -- --project=<name>` | Compiles `index.html` motion canvas and dumps sound events to `events.json` |
| `npm run film:shots -- --project=<name>` | Captures high-res inspection frames at key timestamps for instant visual review |
| `npm run film:audio -- --project=<name>` | Synthesizes procedural SFX, musical bed, softened voice, and dynamic ducking |
| `npm run film:render -- --project=<name>` | Seeks Playwright frame-by-frame at 30 fps and pipes to FFmpeg libx264 |
| `npm run film:mux -- --project=<name>` | Muxes video + audio with `-14 LUFS` EBU R128 loudness mastering |
| `npm run film:qa -- --project=<name>` | Runs `ffprobe`, `blackdetect` (0 black frames), and `ebur128` verification |
| `npm run film:all -- --project=<name>` | Executes all 7 stages sequentially in one automated run |

---

## 5. Design & Motion Guidelines

### Kinetic Typography
- **Headlines & Numbers**: **Bricolage Grotesque 800** (`tracking: -0.03em`).
- **Accent Words**: **Instrument Serif (italic)** at $\approx 1.7\times$ size of the sans for key punch words (`couldn't`, `screen`, `customers`).
- **UI Copy**: **Inter 500/600/700**.
- **Micro-labels & Badges**: **JetBrains Mono 700** (`letter-spacing: 0.08em`, uppercase).

### Semantic Color System
- **Paper (`#F2EDE2`)**: Warm neutral canvas with subtle 30px dot grid (`radial-gradient`).
- **Ink (`#0E0F13`)**: Text, dark scenes, and transition wipe slabs.
- **Defect (`#F2432D`)**: Bugs, failures, occlusions, rejections.
- **Verified (`#12A66B`)**: Approvals, passes, checks, zero hidden.
- **Brand (`#2F4BFF`)**: The product accent color.

### Motion Grammar
- **Entrances**: `power4.out` ($0.45\text{--}0.6\text{s}$) — fast start with a long settle.
- **Pops (Chips & Badges)**: `back.out(2.2)` ($0.35\text{--}0.4\text{s}$) — crisp overshoot.
- **Transitions**: Fullscreen ink slabs (`wipe()`) with a 40px colored leading edge.
- **Camera Movement**: Smooth zoom into evidence (`#zin` scale $1 \to 1.8 \to 2$ with `power3.inOut`).
- **Impact Beats**: Shake ($14\text{px}$ horizontal, yoyo) + flash on failure words.

