# Motion Video Generation — Execution & Traceability Log

**Repository:** `video-gen/` (Remote: [https://github.com/Bhav-ikkk/Shorts.git](https://github.com/Bhav-ikkk/Shorts.git))  
**Target Format:** YouTube Shorts & Instagram Reels (1080×1920 vertical, 30 fps, broadcast mastered to −14 LUFS, peak $\le$ −1.0 dBFS)  
**Core Principles:** 100% offline, zero-API-key, low-RAM, pure deterministic seek rendering (`window.seek(t)`), no unseeded `Math.random` at runtime, no large media files committed to git.

---

## Phase Matrix & Status

| Phase | Subsystem / Focus | Core Deliverables | Status | Git Commit |
|---|---|---|---|---|
| **B0** | **Reproduce & Plumb** | Path fixes, local Kokoro TTS, GPU acceleration benchmarking, loudnorm audio mastering | **COMPLETED** | `8f610e5` |
| **B1** | **Data-Driven Architecture** | `compile_episode.js`, `vocabulary.json`, `cast.json`, `continuity.json`, relative anchors only, SHA-256 byte-identical determinism test | **COMPLETED** | `081597d` |
| **B2** | **Rig v2 & Character Actions** | Two-bone limb kinematics (elbows/knees), squash & stretch, inertial hair spring, 34 validated actions, 3D spatial QA lint (`lint3d`), action showcase film | **COMPLETED** | `77f9d55` |
| **B3** | **Faces & Acting** | 10 emotion presets, 8 phoneme mouth visemes (`A`,`E`,`O`,`U`,`M`,`F`,`L`,`S`), eye gaze tracking (`setLookAt`), Pearson lip-sync correlation gate ($\rho \ge 0.6$), acting showcase film | **COMPLETED** | `5a245c3` |
| **B4** | **Sets & Props** | 6 procedural sets (Kitchen, Bedroom, Hallway, Park, Spooky House, Obby), 40+ low-poly props, 4 lighting moods, sets showcase film & contact sheet | **COMPLETED** | `c714b79` |
| **B5** | **Story Engine** | Multi-episode scripting, continuity callbacks, hook rotation, script-lint, repetitiveness scoring | PENDING | — |
| **B6** | **Audio v2** | Mood scoring engine, procedural SFX library, pitch/speed variance, post-encode peak gate | PENDING | — |
| **B7** | **QA 3D Hardening** | Full spatial/visual regression test suite, occlusion raycasting, camera-in-mesh gates | PENDING | — |
| **B8** | **Publish Pack** | Automated metadata pack: titles, descriptions, hashtags, pinned comments, cover frame, SRT | PENDING | — |
| **B9** | **Blender (Optional)** | Headless `blender -b -P` glTF export pipeline for hero assets | PENDING | — |
| **B10**| **Hardening & Verification** | Multi-platform verification, docs, DoD checklist | PENDING | — |

---

## Phase B0: Reproduce & Infrastructure

### Objectives
- Run prototype locally without network dependencies or paid APIs.
- Fix hardcoded POSIX/sandbox paths in `vo.py`, `audio.py`, `render.js`, `shots.js`.
- Establish hardware-accelerated Chromium rendering vs software SwiftShader.
- Master multi-voice Kokoro audio to broadcast standard (−14 LUFS, peak $\le$ −1.0 dBFS).

### Actions Taken & Technical Solutions
1. **Path Normalization**:
   - Replaced POSIX `/sandbox/...` strings with dynamic `path.resolve` and `Path(__file__).resolve().parent`.
   - Used platform-native static FFmpeg/FFprobe binaries (`ffmpeg-static`, `ffprobe-static`).
2. **GPU Acceleration Discovery**:
   - Dropped `--disable-gpu` / SwiftShader flags in favor of `--ignore-gpu-blocklist --enable-gpu-rasterization`.
   - Render throughput on Intel HD Graphics 620 surged from **1.47 fps to 11.5–12.5 fps** (~8.5× speedup) with only **135 MB RSS**.
3. **Dialogue Synthesis**:
   - Synthesized all 17 lines across Pip, Mox, and June using local Kokoro ONNX weights.
4. **Broadcast Mastering**:
   - Two-pass EBU R128 loudnorm with target true peak −2.0 dBFS pre-encode to absorb AAC encoder overshoot.
   - Measured output: **−14.0 LUFS**, **True Peak −1.7 dBFS**, 48 kHz AAC, 0 black frames.
5. **Git Commit**: `8f610e5` pushed to `main`.

---

## Phase B1: Data-Driven Architecture

### Objectives
- Eliminate hardcoded timelines and monolithic `main.js`.
- Establish declarative schema in `vocabulary.json` and `episode.json`.
- Enforce anchor expressions (e.g. `L5.word(Follow)+0.1`); reject raw numeric seconds.
- Modularize runtime into dedicated modules (`char.js`, `world.js`, `camera.js`, `captions.js`, `fx.js`).
- Verify determinism: multi-pass frame rendering must yield identical SHA-256 hashes.

### Actions Taken & Technical Solutions
1. **Director Compiler (`blocky/director/compile_episode.js`)**:
   - Validates cast, actions, cameras, faces, FX, and music cues against vocabulary.
   - Enforces anchor regex `^(end|L\d+\.(?:start|end|word\(.+?\)))([+-]\d*\.?\d+)?$`.
2. **Runtime Modularization**:
   - Extracted camera rigs, world construction, character kinematics, kinetic captions, and visual FX into modular files under `blocky/runtime/`.
3. **Determinism Gate (`blocky/tests/determinism.test.js`)**:
   - Rendered 6 sampled timestamps across independent browser passes.
   - Achieved **100% SHA-256 byte-identical matching**.
4. **Git Commit**: `081597d` pushed to `main`.

---

## Phase B2: Rig v2 & Character Actions

### Objectives
- Upgrade single-box limbs to biologically plausible two-bone skeletal hierarchies (elbows, knees, feet, hands).
- Implement secondary motion: harmonic spring bounce on hair/hats and head rotation lag.
- Implement squash-and-stretch ($J.sq$) during impacts, jumps, and recoils.
- Expand action library to $\ge 25$ expressive actions (built 34 actions).
- Build 3D spatial QA linter (`blocky/qa/lint3d.js`) enforcing camera-inside-mesh, actor framing, and floor penetration checks.
- Produce turntable showroom film (`action-showcase.mp4`) and 12-action contact sheet.

### Actions Taken & Technical Solutions
1. **Kinematic Hierarchy**:
   - Rebuilt `blocky/runtime/char.js`:
     - Legs: `hip` $\to$ `thigh` $\to$ `knee` $\to$ `shin` $\to$ `foot`.
     - Arms: `shoulder` $\to$ `upper arm` $\to$ `elbow` $\to$ `forearm` $\to$ `hand`.
   - Secondary inertia: tracked velocity deltas between $t-0.05$ and $t$ applied to `hairG`.
2. **Action Validation (`blocky/tests/actions.test.js`)**:
   - Mathematically verified all 34 actions exceed displacement threshold ($\Delta > 0.1$) within joint limits.
3. **3D Spatial QA Linter (`blocky/qa/lint3d.js`)**:
   - Evaluated 35 checkpoints (105 spatial constraints): **0 violations**.
4. **Showcase Render**:
   - Rendered 540 frames (18.0s) in 53.4s (~10 fps) with overhead HUD labels.
5. **Git Commit**: `77f9d55` pushed to `main`.

---

## Phase B3: Faces & Acting

### Objectives
- Expand facial canvas texture with 10 high-level emotion presets.
- Build 8-viseme phoneme mouth system with teeth, tongue, and lip geometry.
- Implement dynamic 3D gaze tracking (`setLookAt`): head yaw/pitch + pupil offset.
- Build lip-sync acoustic correlation QA gate (`blocky/qa/lip_sync.js`) asserting Pearson $\rho \ge 0.60$.
- Render acting showcase film (`acting-showcase.mp4`) and 12-preset contact sheet.

### Actions Taken & Technical Solutions
1. **Emotion Presets**:
   - Implemented `neutral`, `happy`, `suspicious`, `guilt`, `panic`, `smug`, `shock`, `angry`, `relief`, `devious` in `char.js`.
   - Added asymmetric brow raises, forehead furrow ticks, flushed cheek ellipses, and cyan sweat teardrops.
2. **8-Viseme System**:
   - Implemented `A`, `E`, `O`, `U`, `M`, `F`, `L`, `S`.
   - `F`: Labiodental upper incisor block resting over lower lip curve.
   - `L`: Lingual cavity with tongue tip elevated against upper palate.
   - `S`: Sibilant clenched white teeth grid with divider line.
3. **Gaze Tracking Mechanics**:
   - 3D target vector $\to$ head pitch/yaw (55%) + canvas pupil offset $(dx, dy)$ (45%).
4. **Lip-Sync Correlation QA**:
   - Correlated character mouth openness series against Kokoro audio envelopes across all 17 dialogue lines.
   - Measured Pearson correlation: **$0.985 \le \rho \le 0.999$** (**17/17 PASS**).
5. **Acting Showcase Render**:
   - Rendered 540 frames (18.0s) in 107.4s (5.0 fps) to `blocky/out/acting-showcase.mp4` and composed `acting-showcase-sheet.png`.
6. **Git Commit**: `5a245c3` pushed to `main`.

---

## Phase B4: Sets & Props (Active)

### Objectives
- Create 6 modular procedural sets:
  1. **Kitchen**: (table, fridge, clock, rug, chairs, cookies, crumbs).
  2. **Bedroom**: (bed with pillow/blanket, study desk, chair, table lamp, bookshelf with books, laptop, wall posters, rug).
  3. **School Hallway**: (lockers with vents/latches, classroom doors, drinking fountain, bulletin board, floor tiles, overhead fluorescent fixtures).
  4. **Park / Outdoors**: (grass terrain, stone pathway, low-poly pine & oak trees, wooden park bench, street lamp, boulders, flowers).
  5. **Spooky House / Attic**: (creaky dark floorboards, cobweb corners, attic chest/trunk, boarded window, tilted vintage picture frames, dust motes).
  6. **Obby Course**: (neon cyber floating platforms, glowing lava hazard floor, checkpoint respawn pads, jump boost arrows, floating spinners).
- Create 40+ low-poly primitive props with shared geometries and materials:
  - *Food/Drink (10)*: cookie, plate, pizza slice, soda can, burger, coffee mug, apple, cake, ice cream cone, juice box.
  - *Tools/Gadgets (10)*: flashlight, laptop, smartphone, walkie-talkie, key, magnifying glass, wrench, gaming controller, vintage camera, battery.
  - *School/Office (10)*: backpack, pencil, notebook, book stack, golden trophy, desk globe, wall clock, document folder, scissors, wooden ruler.
  - *Furniture/Decor (10)*: dining table, wooden chair, bed, desk lamp, study desk, area rug, wall portrait, bookshelf, potted plant, wooden crate.
- Implement 4 lighting moods with background atmospheres:
  1. `day`: Bright sky blue, high warm directional sunlight, soft ambient bounce.
  2. `sunset`: Golden hour warm amber sun, soft purple-pink ambient, long shadows.
  3. `night`: Deep navy/black sky, cool blue moonlight, warm local flashlight/interior glow.
  4. `obby`: Dark cyberpunk void with glowing neon emissive hazard planes.
- Build Sets Showcase runner (`blocky/showcase/sets.html`, `sets.js`, `run_sets.js`) cycling through all 6 sets and props.
- Measure RAM and render throughput per set.
- Produce 12-frame contact sheet `set-showcase-sheet.png` and report.

### Actions Taken & Technical Solutions
1. **Procedural Prop Library (`blocky/runtime/props.js`)**:
   - Engineered 40 primitive low-poly props categorized into Food/Drink (10), Tools/Gadgets (10), School/Office (10), and Furniture/Decor (10).
   - Utilized shared geometry and material caches (`getMat`, `getBoxGeo`, `getCylGeo`) ensuring low memory overhead.
   - Verified 100% instantiation and positive volumetric bounds via `blocky/tests/props.test.js`.
2. **6 Procedural Environments (`blocky/runtime/world.js`)**:
   - Implemented modular world builders: `buildKitchenSet`, `buildBedroomSet`, `buildHallwaySet`, `buildParkSet`, `buildSpookyHouseSet`, and `buildObbyCourseSet`.
   - Node SSR safe: Added fallback material branching for environments running outside browser DOM.
   - Implemented 4 lighting moods: `day`, `sunset`, `night`, `obby`.
   - Verified all 24 set/mood combinations pass density and lighting gates via `blocky/tests/sets.test.js`.
3. **Showcase Film & Benchmarking**:
   - Rendered 540 frames (18.0s) to `blocky/out/set-showcase.mp4` in **42.8s** with average throughput of **12.6 fps**.
   - Performance per set:
     - Kitchen (Day): 11.2 fps (8.0s)
     - Bedroom (Sunset): 13.0 fps (6.9s)
     - Hallway (Day): 12.7 fps (7.1s)
     - Park (Day): 13.6 fps (6.6s)
     - Spooky House (Night): 12.7 fps (7.1s)
     - Obby Course (Cyber): 13.4 fps (6.7s)
   - Composed 12-frame contact sheet `set-showcase-sheet.png`.

---

## [2026-11-11] — Phase B5: Story Engine (COMPLETED)

### Objective
Build the complete offline Story Engine for multi-episode script generation, anti-repetitiveness gating ($J \le 0.25$), trademark compliance scanning, beat sheet validation ($\le 9$ words/line), and author 3 distinct production episode packages with full platform compliance reviews (Made for Kids, synthetic content disclosure).

### Actions Taken & Technical Solutions
1. **Script Pacing & Trademark Linter (`blocky/story/script_lint.js`)**:
   - Enforced retention word limit: standard dialogue lines $\le 9$ words, final tag/button lines $\le 12$ words.
   - Beat sheet validation: verifies narrative sequence starting with `hook` (at $t=0$), through `setup`, `escalation`, `twist`/`reveal`, and concluding with `cliffhanger` or `button`.
   - Trademark & copyright blacklist scanner: blocked words like `roblox`, `minecraft`, `blox`, `fortnite`, `lego`, `robux`, `v-bucks`, `bacon hair`, etc.
   - Verified speaker attribution against `cast.json`.
2. **Anti-Repetitiveness Linter (`blocky/story/repetitiveness.js`)**:
   - Tokenizes dialogue lines with stop-word filtering.
   - Computes pairwise vocabulary Jaccard similarity ($J(A, B) \le 0.25$).
   - Extracts and checks 3-gram overlap ($\le 0.10$).
   - Detects consecutive hook stem repetitions.
   - Verifies format diversity and environment rotation.
3. **Series Bible & Continuity**:
   - `blocky/story/cast.json`: Enriched character profiles for Pip, Mox, and June with voice IDs, traits, flaws, and signature catchphrases.
   - `blocky/story/world.json`: Registered all 6 environments (`kitchen`, `bedroom`, `hallway`, `park`, `spookyHouse`, `obby`).
   - `blocky/story/continuity.json`: Documented 7 established facts, 3 running gags, and episode continuity threads.
   - `blocky/story/arcs.md`: Defined Season 1 narrative arcs (Kitchen Heists, Living Room Hazard Games, Midnight Attic Expeditions).
   - `blocky/story/hook_bank.md`: Formulated 6 core retention hook patterns (H1–H6) with rotation schedules.
4. **Three Production Episode Packages (`blocky/series/the-blockies/`)**:
   - **EP 01 (`ep01-crumb-trail`)**: Mystery-Comedy set in `kitchen` (Day). Hook: *"Two cookies. One plate. Now? Nothing."* (8 lines, 46 words, 5.8 w/line).
   - **EP 02 (`ep02-floor-is-lava`)**: Challenge/Obby set in `obby` (Obby/Neon). Hook: *"The floor just turned into molten lava!"* (7 lines, 46 words, 6.6 w/line).
   - **EP 03 (`ep03-secret-attic`)**: Suspense-Comedy set in `spookyHouse` (Night). Hook: *"Midnight. Strange scraping sounds above our ceiling."* (7 lines, 46 words, 6.6 w/line).
   - Each package contains complete `script.json`, director-ready `episode.json`, and human sign-off `review.md`.
5. **Director Integration & Story Engine Coordinator (`blocky/story/story_engine.js`)**:
   - Created `blocky/story/estimate_anchors.js` for scratch track pre-visualization.
   - Enhanced `blocky/director/compile_episode.js` to support optional prop durations and `at` triggers.
   - Unified series validation pipeline compiling all director timelines cleanly.
   - Added `blocky/tests/story.test.js` with 34 test assertions (positive & negative QA).
   - Integrated `story` and test commands into `blocky/cli.js`.

### Measured Results & Verification Evidence
- **Story Test Suite**: 34/34 passed (`node blocky/tests/story.test.js`).
- **Full Regression Test Suite**: Story (34), Actions (34), Faces (10), Props (40), Sets (24), Determinism (6) — **100% Passed**.
- **Pairwise Jaccard Similarity**:
  - Ep 01 vs Ep 02: **0.022** (Limit: 0.25) | Trigram Overlap: **0.0%**
  - Ep 01 vs Ep 03: **0.000** (Limit: 0.25) | Trigram Overlap: **0.0%**
  - Ep 02 vs Ep 03: **0.038** (Limit: 0.25) | Trigram Overlap: **0.0%**
- **Word Count Limits**: Ep 1 (avg 5.8 w/l), Ep 2 (avg 6.6 w/l), Ep 3 (avg 6.6 w/l) — all well below $\le 9$ words limit.
- **Trademark Clearance**: 0 forbidden words detected across all titles, lines, and metadata.


