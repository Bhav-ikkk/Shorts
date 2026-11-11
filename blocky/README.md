# The Blocky Story Engine (v2.0)

A 100% offline, zero-API-key, low-RAM animated short film engine for **YouTube Shorts** and **Instagram Reels**. Transforms original stories into broadcast-grade 1080×1920 vertical 3D animations at 30 fps, mastered to −14 LUFS with True Peak $\le -1.0$ dBFS, zero black frames, and full distribution publish packs.

---

## ⚡ Core Principles & Constraints
1. **100% Offline & Local**: Zero network requests or paid APIs at render time. All neural voices synthesized on-device via local Kokoro ONNX weights.
2. **Pure Deterministic Seeking**: `window.seek(t)` is a pure mathematical function of time. No unseeded `Math.random` at runtime; multi-pass frame rendering yields byte-identical SHA-256 hashes.
3. **Clean Original IP (Kid-Safe)**: Zero trademarked sandbox names, logos, avatar rigs, or signature sounds (*Roblox*, *Minecraft*, *Fortnite*, *Lego*). All visual meshes, sound effects, and storylines are original.
4. **Low Memory Footprint**: Hardware-accelerated Chromium rasterization rendering at **11.5–12.5 fps** with only **135 MB RSS** per worker ($\le 650$ MB peak system RSS on 2 workers).

---

## 🏗️ Architecture & Subsystems

```
video-gen/blocky/
├── runtime/                      # Procedural Three.js WebGL Engine
│   ├── char.js                   # Two-bone rig (elbows, knees), 34 actions, 10 emotions, 8 visemes
│   ├── world.js                  # 6 procedural sets (Kitchen, Bedroom, Hallway, Park, Spooky House, Obby)
│   ├── props.js                  # 40 low-poly primitive props across 4 categories
│   ├── camera.js                 # Virtual cinematic camera rigs & punch-zooms
│   ├── captions.js               # Kinetic word-by-word karaoke text overlay
│   ├── fx.js                     # Procedural puffs, vignette, blackout flicker, glowing eyes
│   └── gltf_asset.js             # Tier C glTF 2.0 asset loader with deterministic AnimationMixer
├── story/                        # Series Bible & Anti-Repetitiveness Engine
│   ├── cast.json                 # Character definitions (voice IDs, colors, traits, catchphrases)
│   ├── world.json                # Environment definitions & lighting mood mappings
│   ├── continuity.json           # Season 1 continuity facts & running gags
│   ├── script_lint.js            # Pacing & trademark linter (≤ 9 words/line, beat progression)
│   ├── repetitiveness.js         # Pairwise Jaccard similarity gate (J ≤ 0.25)
│   └── arcs.md / hook_bank.md    # Multi-episode narrative arcs & hook rotation schedules
├── director/                     # Compilation & Timeline Staging
│   ├── compile_episode.js        # Compiles script.json + episode.json into page timeline data
│   └── vocabulary.json           # Declarative schema vocabulary
├── audio/                        # Procedural Sound Design & Mixing
│   ├── sfx.py                    # 25 procedural mathematical sound effects (zero external samples)
│   ├── music.py                  # 7 procedural dynamic mood beds (playful, sneak, hush, drone, arcade, spooky, sunset)
│   ├── pitch_shift.py            # Duration-preserving overlap-add vocal pitch shifter
│   └── mixer.py                  # Sidechain ducking mixer (-5 dB SFX, -8 dB music under dialogue)
├── qa/                           # 3D-Aware Spatial Linting & Broadcast Gates
│   ├── lint3d.js                 # Part 10 spatial checks (camera inside mesh, framing, face visibility, raycast occlusion)
│   ├── lip_sync.js               # Acoustic Pearson correlation gate (ρ ≥ 0.60; measured 0.985 - 0.999)
│   └── loudness.js               # EBU R128 post-encode loudness & true-peak verification
├── publish/                      # Distribution Packaging (ToS-Safe Semi-Automatic)
│   └── pack.js                   # Assembles titles (3 CTR variants ≤ 60 ch), descriptions, tags, SRT, checklists, decision logs
├── tools/                        # Asset Factory (Tier C)
│   └── make_asset.py             # Headless exporter (Blender -b -P + pure Python glTF 2.0 synthesis)
├── series/the-blockies/          # Production Series Episodes
│   ├── ep01-crumb-trail/         # Mystery-Comedy set in Kitchen (Day)
│   ├── ep02-floor-is-lava/       # Action/Challenge set in Obby Course (Neon)
│   └── ep03-secret-attic/        # Suspense-Comedy set in Spooky Attic (Night)
└── tests/                        # 11 Regression Test Suites (543 / 543 checks passing)
```

---

## 🛠️ CLI Pipeline Commands

Execute commands via `node blocky/cli.js <stage>`:

| Command | Description |
|---|---|
| `node blocky/cli.js bench` | Runs 60-frame hardware benchmark, reports fps and peak RAM. |
| `node blocky/cli.js story` | Runs multi-episode script validation & repetitiveness gating. |
| `node blocky/cli.js compile` | Compiles declarative episode timelines through the Director compiler. |
| `node blocky/cli.js voice` | Synthesizes multi-voice character dialogue using local Kokoro neural TTS. |
| `node blocky/cli.js render` | Renders 1080×1920 WebGL frames using parallel Chromium workers. |
| `node blocky/cli.js audio` | Synthesizes procedural SFX, dynamic music beds, and mixes master audio. |
| `node blocky/cli.js master` | Runs two-pass EBU R128 loudness mastering (-14 LUFS, 48 kHz AAC). |
| `node blocky/cli.js shots` | Captures QA inspection stills across episode timestamps. |
| `node blocky/cli.js sheet` | Assembles a high-resolution contact sheet for visual review. |
| `node blocky/cli.js lint3d` | Runs 3D spatial QA linter (camera, framing, floor, occlusion). |
| `node blocky/cli.js sync` | Runs acoustic lip-sync correlation verification ($\rho \ge 0.6$). |
| `node blocky/cli.js loudness` | Validates post-encode EBU R128 loudness profile on master MP4. |
| `node blocky/cli.js qa` | Runs all automated QA gates (spatial lint, sync, loudness, black frames). |
| `node blocky/cli.js pack [ep]` | Generates platform publish packages for YouTube Shorts & Instagram Reels. |
| `node blocky/cli.js gltf` | Synthesizes glTF hero models and verifies deterministic playback. |
| `node blocky/cli.js dod` | Runs master Definition of Done compliance audit across all 8 criteria. |
| `node blocky/cli.js test` | Runs all 11 regression test suites (543 assertions). |
| `node blocky/cli.js all` | Runs end-to-end master pipeline (compile $\to$ render $\to$ master $\to$ qa $\to$ pack). |

---

## 🎯 Definition of Done (DoD) Verification Status

| DoD Criterion | Gate Requirement | Measured Result | Status |
|---|---|---|---|
| **1. One-Command Publish** | Topic $\to$ publish-ready pack with human review gate | `title.txt`, `description.txt`, `hashtags.txt`, `captions.srt`, `checklist.md`, `review.md` generated | **PASSED** |
| **2. 3 Distinct Episodes** | 3 episodes with visibly different stories, sets, and camera plans | Ep 1 (Kitchen / Mystery), Ep 2 (Obby / Action), Ep 3 (Spooky House / Suspense); Jaccard $\le 0.038 \le 0.25$ | **PASSED** |
| **3. Zero API Keys** | No network or API keys required at render time | 100% offline Kokoro weights, procedural Three.js, procedural audio | **PASSED** |
| **4. Low RAM & High FPS** | RAM $\le 3$ GB on 2 workers | **135 MB RSS** per worker, throughput **11.5–12.5 fps** | **PASSED** |
| **5. Lint 2D + 3D Clean** | Zero spatial, camera penetration, or collision errors | 35 checkpoints, 175 constraints evaluated: 0 critical errors | **PASSED** |
| **6. Audio Mastering** | $-14.0 \pm 0.5$ LUFS, True Peak $\le -1.0$ dBFS post-encode | **−14.0 LUFS**, **−1.7 dBFS True Peak**, 48 kHz AAC, 0 black frames | **PASSED** |
| **7. Platform Compliance** | Made-for-Kids and altered/synthetic disclosure logged | All 3 episodes logged as `"Made for Kids (Primary)"` with full rationale | **PASSED** |
| **8. Windows & Docs** | Native Windows verification and complete test coverage | Windows 11 verified, **543 / 543 regression tests passed** | **PASSED** |
