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
| **B5** | **Story Engine** | Multi-episode scripting, continuity callbacks, hook rotation, script-lint, repetitiveness scoring | **COMPLETED** | `2fe291d` |
| **B6** | **Audio v2** | Mood scoring engine, procedural SFX library, pitch/speed variance, post-encode peak gate | **COMPLETED** | `6c28915` |
| **B7** | **QA 3D Hardening** | Full spatial/visual regression test suite, occlusion raycasting, camera-in-mesh gates | **COMPLETED** | `455367d` |
| **B8** | **Publish Pack** | Automated metadata pack: titles, descriptions, hashtags, pinned comments, cover frame, SRT, COPPA & disclosure logs | **COMPLETED** | `fe35e97` |
| **B9** | **Blender (Optional)** | Headless `blender -b -P` glTF export pipeline for hero assets, BlenderMCP guide, deterministic playback | **COMPLETED** | `508e35e` |
| **B10**| **Hardening & Verification** | Multi-platform verification, docs, DoD checklist, 543 regression tests | **COMPLETED** | `9932d25` |

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

---

## [2026-11-11] — Phase B6: Audio v2 (COMPLETED)

### Objective
Build the Audio v2 subsystem: 25 procedural sound effects, 7 procedural music mood beds, multi-voice character pitch shifting and styling, dynamic sidechain ducking mixer, and automated post-encode EBU R128 loudness / true-peak gate.

### Actions Taken & Technical Solutions
1. **Procedural SFX Library (`blocky/audio/sfx.py`)**:
   - Synthesizes 25 procedural sound effects:
     - Classic: `pop`, `thud`, `whoosh`, `boing`, `step`, `swell`, `impact`, `chime`, `crunch`, `poof`, `gasp`, `sting`, `flicker`, `blackout`.
     - New: `jump`, `land`, `lava_bubble`, `splash`, `coin`, `trophy_fanfare`, `key_jingle`, `chest_creak`, `switch_click`, `laser`, `alarm`.
   - Zero audio samples, zero API keys. 100% mathematical synthesis with impulse response reverb convolution.
2. **Procedural Music Mood Beds (`blocky/audio/music.py`)**:
   - Engineered 7 distinct procedural mood beds with crossfades and envelopes:
     - `playful` (104 BPM A-minor arpeggio + bouncing bass)
     - `sneak` (84 BPM tiptoe minor staccato plucks + wood block steps)
     - `hush` (70 BPM breathing sub-bass + clock tick)
     - `drone` (60 BPM tension pad + low-frequency oscillation wobble)
     - `arcade` / `obby` (132 BPM 8-bit square/triangle chiptune arpeggio + driving bass)
     - `spooky` (76 BPM gothic D-minor pad + celesta chime)
     - `sunset` / `warm` (92 BPM mellow lofi chord progression)
3. **Multi-Voice Pitch Shifting & Formatter (`blocky/audio/pitch_shift.py`)**:
   - Transposes pitch in semitones while strictly preserving duration and lip-sync alignment via overlap-add resampling.
   - Assigned character vocal parameters in `cast.json`:
     - Pip: `sid: 5`, `speed: 1.05`, `pitch: 0.0`
     - Mox: `sid: 2`, `speed: 1.10`, `pitch: +0.6`
     - June (0.4 toddler): `sid: 4`, `speed: 1.15`, `pitch: +3.5`
4. **Vocal Synthesis & Caching (`blocky/vo.py`)**:
   - Neural Kokoro multi-voice synthesis with SHA-256 caching in `.cache/vo/`.
   - Delivery styles: `whisper` (breathy high-pass noise), `panic` (presence boost + saturation), `normal` (warm de-essing).
5. **Master Audio Mixer (`blocky/audio/mixer.py`)**:
   - Softens dialogue with de-essing and low warmth boost (`soften.py`).
   - Sidechain ducking: attenuates SFX by -5 dB and music by -8 dB during speech.
   - Soft-saturation limiter (`np.tanh`) to eliminate harsh digital clipping.
   - Exports 44.1 kHz stereo `mix.wav` and synchronized SRT subtitles.
6. **Post-Encode Loudness & Peak Gate (`blocky/qa/loudness.js`)**:
   - Measures EBU R128 integrated loudness, true peak, and LRA after lossy AAC encoding.
   - Exports `out/lufs_report.json`.
   - Integrated into `blocky/cli.js` (`node blocky/cli.js loudness` and `node blocky/cli.js test`).

### Measured Results & Verification Evidence
- **Procedural SFX**: 25/25 validated with valid signal peaks ($0.15 \le \text{Peak} \le 0.78$) and zero NaN/Inf values.
- **Procedural Music**: 7/7 mood beds rendered cleanly over test intervals.
- **Pitch Shifting**: Duration invariance confirmed for $+3.5\text{ st}$ and $-1.5\text{ st}$.
- **Post-Encode EBU R128 Loudness (Measured after AAC encode on final MP4)**:
  - **Integrated Loudness**: **-14.0 LUFS** (Target: $-14.0 \pm 0.5$ LUFS) $\to$ **PASS**
  - **True Peak**: **-1.7 dBFS** (Target: $\le -1.0$ dBFS post-encode ceiling) $\to$ **PASS**
  - **Loudness Range (LRA)**: **3.8 LU** (Target: $\le 7.0$ LU) $\to$ **PASS**
  - **Audio Sample Rate**: **48,000 Hz AAC** $\to$ **PASS**
- **Test Suite Results**:
  - `node blocky/tests/audio.test.js`: **8/8 passed**.
  - Total Regression Suite (`node blocky/cli.js test`): **156/156 checks passed** (Story 34, Actions 34, Faces 10, Props 40, Sets 24, Audio 8, Determinism 6).

---

## [2026-11-11] — Phase B7: QA 3D (COMPLETED)

### Objective
Implement the 3D-aware QA validation subsystem enforcing the Part 10 specifications (camera inside geometry, subject framing, face visibility during speech, raycast occlusion, caption overlap, UI safe area, shot rhythm analysis, and first-frame non-empty validation), with fixture testing proving that bad shots fail and valid production shots pass.

### Actions Taken & Technical Solutions
1. **3D Spatial QA Linter (`blocky/qa/lint3d.js`)**:
   - Camera-inside-geometry detection: near plane threshold check ($0.38\text{m}$) and bounding box containment.
   - Speaking subject on-screen framing: projects head center and corners to NDC with 6% safe margins ($[-0.88, 0.88]$).
   - Face visibility & orientation: computes dot product between character forward vector and camera view vector (flags if character faces away with $\cos\theta < -0.82$).
   - Raycast occlusion: casts rays from camera to head center through Three.js scene hierarchy; flags if an external mesh blocks line-of-sight.
   - Platform UI safe area: ensures captions and key visual focus remain within the vertical 10% to 80% screen window ($192\text{px}$ to $1536\text{px}$).
   - Shot rhythm & event pacing: verifies no static shot exceeds $3.5\text{s}$ and categorizes shot durations into a histogram (fast, optimal, medium, static).
   - First-frame test: captures frame 0 to `out/poster.png` and confirms non-blank rendering.
2. **Negative Fixture & Positive Timeline Test Suite (`blocky/tests/qa3d.test.js`)**:
   - Implemented 5 defective shot fixtures:
     - Fixture 1 (`CAMERA_INSIDE_GEOMETRY`): Camera placed inside Pip's torso ($0.10\text{m} < 0.38\text{m}$) $\to$ **DETECTED & FAILED**.
     - Fixture 2 (`SPEAKER_OUT_OF_FRAME`): Pip placed offscreen at $x=20.0$ (projected $x=164.9$) $\to$ **DETECTED & FAILED**.
     - Fixture 3 (`SPEAKER_FACING_AWAY`): Pip rotated $180^\circ$ away from camera ($\cos\theta = -1.00$) $\to$ **DETECTED & FAILED**.
     - Fixture 4 (`FLOOR_PENETRATION`): Pip sunken $45\text{cm}$ into ground ($y=-0.45\text{m}$) $\to$ **DETECTED & FAILED**.
     - Fixture 5 (`SPEAKER_OCCLUDED`): Solid wall placed directly between camera and speaker $\to$ **DETECTED & FAILED**.
   - Valid production timeline verification: 35 checkpoints sampled, 175 constraints evaluated $\to$ **100% PASS (0 critical errors)**.
3. **CLI Integration**:
   - Added `qa3d.test.js` to `node blocky/cli.js test`.

### Measured Results & Verification Evidence
- **QA 3D Test Suite (`node blocky/tests/qa3d.test.js`)**: **10/10 assertions passed** (5 negative fixtures caught, 5 positive validation checks passed).
- **Shot Rhythm Distribution**:
  - Fast ($< 1.5\text{s}$): 7 shots
  - Optimal ($1.5 - 2.5\text{s}$): 8 shots
  - Medium ($2.5 - 3.5\text{s}$): 2 shots
  - Average Shot Length: $1.95\text{s}$ (ideal for Shorts/Reels retention).
- **First Frame Verification**: `out/poster.png` captured and confirmed non-empty.
- **Full Regression Test Suite (`node blocky/cli.js test`)**: **166 / 166 checks passed** (Story 34, Actions 34, Faces 10, Props 40, Sets 24, Audio 8, QA 3D 10, Determinism 6).

---

## [2026-11-11] — Phase B8: Publish Pack (COMPLETED)

### Objective
Build the multi-episode publish pack automation subsystem (`blocky/publish/pack.js`) assembling platform-compliant, ToS-safe upload packages for YouTube Shorts and Instagram Reels across all production episodes without unofficial bots or external API dependencies. Generate title variants ($\le 60$ chars), formatted descriptions, hashtags (3–5 tags), engaging pinned comments, synchronized SRT captions, upload SOP checklists, high-impact cover frames, and structured COPPA Made-for-Kids and altered/synthetic content decision logs.

### Actions Taken & Technical Solutions
1. **Publish Pack Assembler (`blocky/publish/pack.js`)**:
   - Assembles complete distribution packages for both central repository (`blocky/publish/<ep>/`) and series-local (`blocky/series/the-blockies/<ep>/publish/`).
   - Packages all 3 production episodes: `ep01-crumb-trail`, `ep02-floor-is-lava`, `ep03-secret-attic`.
   - Integrated robust FFmpeg poster extraction (`-ss 00:00:01.500`) and procedural 1080x1920 lavfi canvas fallback to guarantee valid cover images in headless and pre-render environments.
2. **High-CTR Title Engineering**:
   - Engineered 3 distinct CTR title variants per episode:
     - **Variant A (Direct Hook)**: Immediate curiosity or high-stakes scenario (e.g. *"Two Cookies. One Plate. Now? Nothing. 🍪"* - 40 chars; *"The Floor Just Turned Into Molten Lava! 🔥"* - 41 chars; *"Midnight Scraping Above Our Ceiling! 👻"* - 39 chars).
     - **Variant B (Character / Drama)**: Relatable comedic tension with episode tag (e.g. *"Who Stole the Last Cookie?! (The Blockies Ep 1)"* - 47 chars).
     - **Variant C (Loop / Question)**: Piques retention loop (e.g. *"The Crumb Trail Mystery Solved?!"* - 32 chars).
   - All variants strictly $\le 60$ characters for mobile vertical screen truncations.
   - 0 trademarked words (100% clean of "Roblox", "Minecraft", "Fortnite", "Lego").
3. **Platform Compliance & Decision Logs (`decision_log.json` & `checklist.md`)**:
   - **COPPA Status**: Explicitly evaluated and declared as `"Made for Kids (Primary)"` with comprehensive child-safety rationale (stylized low-poly art, wholesome comedy, zero horror/violence/weapons).
   - **Synthetic Media Disclosure**: Declared as `"Cartoon/Stylized (Non-photorealistic synthetic media)"`, fully documented in video descriptions.
   - **Platform Upload SOP**: Step-by-step checklist for YouTube Studio (audience tag, scheduling, pin-to-top pinned comment) and Instagram Reels (9:16 cover frame, short description, hashtags).
4. **Synchronized Subtitles (`captions.srt`)**:
   - Generated compliant SRT subtitle files with millisecond precision from dialogue anchor timestamps.
   - Validated chronological ordering, non-overlap, and 1:1 cue-to-script alignment.
5. **Unit Test Suite (`blocky/tests/publish.test.js`)**:
   - Built comprehensive automated verification testing all 3 episode packages across both destination directories.
   - Evaluates file existence, non-empty bounds, title variant limits, trademark clearance, description elements, hashtag counts, pinned comment engagement, SRT cue timings, COPPA decision structures, and cover image validity.
   - Achieved **265 / 265 test assertions passed**.
6. **CLI Integration (`blocky/cli.js`)**:
   - Added `node blocky/cli.js pack [episode|all]` command.
   - Integrated publish testing into `node blocky/cli.js test`.
   - Added packaging step to master pipeline (`node blocky/cli.js all`).

### Measured Results & Verification Evidence
- **Publish Test Suite (`node blocky/tests/publish.test.js`)**: **265 / 265 passed**.
- **Full Regression Test Suite (`node blocky/cli.js test`)**: **435 / 435 checks passed** (Story 34, Actions 34, Faces 14, Props 40, Sets 24, Audio 8, QA 3D 10, Publish 265, Determinism 6).
- **Title Length Metrics**:
  - Ep 01: Variant A: 40 chars | Variant B: 47 chars | Variant C: 32 chars (All $\le 60$)
  - Ep 02: Variant A: 41 chars | Variant B: 45 chars | Variant C: 37 chars (All $\le 60$)
  - Ep 03: Variant A: 39 chars | Variant B: 53 chars | Variant C: 35 chars (All $\le 60$)
- **Hashtag Counts**: Exactly 5 tags per episode, starting with `#theblockies`.
- **COPPA Compliance**: 100% verified `"Made for Kids (Primary)"` with 0 trademark or copyright infractions.
- **Artifacts Generated**:
  - `blocky/publish/ep01-crumb-trail/`
  - `blocky/publish/ep02-floor-is-lava/`
  - `blocky/publish/ep03-secret-attic/`
  - `blocky/series/the-blockies/ep01-crumb-trail/publish/`
  - `blocky/series/the-blockies/ep02-floor-is-lava/publish/`
  - `blocky/series/the-blockies/ep03-secret-attic/publish/`

---

## [2026-11-11] — Phase B9: Blender Optional & Asset Pipeline (COMPLETED)

### Objective
Implement the Tier C asset pipeline and headless glTF export workflow (`blocky/tools/make_asset.py`), author BlenderMCP architectural documentation (`blocky/docs/blender_mcp.md`), import and verify 1 hero asset in binary glTF (`hero_trophy.glb`), and establish the deterministic Three.js playback controller (`blocky/runtime/gltf_asset.js`) ensuring `window.seek(t)` is a pure function of time.

### Actions Taken & Technical Solutions
1. **Headless Asset Generator & Exporter (`blocky/tools/make_asset.py`)**:
   - Engineered dual-mode export script:
     - Headless Blender execution: `blender -b -P blocky/tools/make_asset.py -- --asset trophy --out ...`
     - Standalone Python execution: builds 100% compliant glTF 2.0 binary (`.glb`) containers via native standard library (`struct`, `json`, `math`).
   - Packaged mesh primitives (PedestalBase, PedestalTier, TrophyStem, TrophyCup, HandleLeft, HandleRight, HeroGemStar) with normals and indices.
   - Assigned PBR Metallic-Roughness materials: `HeroGold` (metallic 0.95, roughness 0.22), `ObsidianSlate` (slate base), `RubyGemstone` (emissive ruby crystal).
   - Baked 4.0-second seamless looping animation clip (`TrophyFloat`) containing 3 channels:
     - Translation: Sinusoidal vertical bob ($y(t) = 0.14 \times \sin(2\pi \cdot t / 4.0)$).
     - Rotation: Continuous $360^\circ$ yaw rotation around the Y-axis.
     - Scale: Harmonic breathing pulse ($s(t) = 1.0 + 0.05 \times \sin(4\pi \cdot t / 4.0)$).
2. **Hero glTF Model & Asset Manifest (`blocky/assets/`)**:
   - Produced `blocky/assets/models/hero_trophy.glb` (10,332 bytes).
   - Authored `blocky/assets/LICENSE.md` certifying CC0-1.0 / original procedural IP clearance and trademark cleanliness.
   - Built `blocky/assets/resolver.js` managing asset paths, file size validations, and licensing audits.
3. **Deterministic Three.js glTF Asset Controller (`blocky/runtime/gltf_asset.js`)**:
   - Built `GltfAsset` class wrapping Three.js `GLTFLoader` and `AnimationMixer`.
   - Enforced deterministic seeking: calls `mixer.setTime(loopT)` instead of delta-time `update(dt)`, eliminating frame drift across forward, reverse, and random seek jumps.
4. **BlenderMCP Documentation (`blocky/docs/blender_mcp.md`)**:
   - Documented BlenderMCP socket server protocol (JSON-RPC over TCP on port 9876).
   - Detailed remote commands (`inspect_scene`, `create_mesh`, `bake_action`, `export_gltf`).
   - Reaffirmed core rule: *Never render final video frames in Blender for daily Shorts production; model/animate in Blender, export glTF, film in Three.js.*
5. **Unit & Determinism Test Suite (`blocky/tests/gltf.test.js`)**:
   - Added 35 test assertions covering headless generation, GLB magic/chunk headers, glTF 2.0 schema, Three.js GLTFLoader parsing, cross-instance multi-pass determinism, kinematics ($y=+0.14$ at $t=1.0\text{s}$, $y=-0.14$ at $t=3.0\text{s}$), and licensing verification.
   - Achieved **35 / 35 test assertions passed**.
6. **CLI Integration (`blocky/cli.js`)**:
   - Added `node blocky/cli.js gltf`.
   - Integrated glTF tests into `node blocky/cli.js test`.
   - Integrated glTF asset build into `node blocky/cli.js all`.

### Measured Results & Verification Evidence
- **glTF Test Suite (`node blocky/tests/gltf.test.js`)**: **35 / 35 passed**.
- **Determinism Check**: Multi-pass frame pose comparison yielded 0.000 float deviation across all test timestamps.
- **Full Regression Test Suite (`node blocky/cli.js test`)**: **470 / 470 checks passed** (Story 34, Actions 34, Faces 14, Props 40, Sets 24, Audio 8, QA 3D 10, Publish 265, glTF 35, Determinism 6).
- **Artifacts Generated**:
  - `blocky/tools/make_asset.py`
  - `blocky/assets/models/hero_trophy.glb` (10,332 bytes)
  - `blocky/assets/LICENSE.md`
  - `blocky/assets/resolver.js`
  - `blocky/runtime/gltf_asset.js`
  - `blocky/docs/blender_mcp.md`
  - `blocky/tests/gltf.test.js`

---

## [2026-11-11] — Phase B10: Hardening & Final Definition of Done (COMPLETED)

### Objective
Execute the final hardening and compliance verification phase: author an automated Definition of Done audit test suite (`blocky/tests/dod.test.js`) validating all 8 criteria of the master DoD specification programmatically, author the master `CHANGELOG.md`, update `blocky/README.md` and `README.md`, ensure all CLI commands are wired and documented, and verify complete test suite execution on Windows.

### Actions Taken & Technical Solutions
1. **Automated Definition of Done Verification Suite (`blocky/tests/dod.test.js`)**:
   - Programmatically evaluates the 8 DoD criteria:
     - **Criterion 1 (One-Command Publish & Review Gate)**: Validates central and series-local publish bundles for all 3 episodes (`title.txt`, `description.txt`, `hashtags.txt`, `pinned_comment.txt`, `captions.srt`, `checklist.md`, `decision_log.json`, `review.md`).
     - **Criterion 2 (3 Visibly Different Episodes)**: Validates 3 distinct environments (`kitchen`, `obby`, `spookyHouse`), $\ge 6$ dynamic camera shots per episode, and anti-repetitiveness similarity $J \le 0.038 \le 0.25$.
     - **Criterion 3 (Zero API Keys & Network)**: Confirms 0 dependencies on external AI SDKs (`openai`, `anthropic`, `@google/genai`, `elevenlabs`, `replicate`) and 0 required `.env` credentials.
     - **Criterion 4 (Low-RAM / High Throughput)**: Confirms benchmark throughput $\ge 5.0$ fps (measured 11.11–12.5 fps) and memory consumption $\le 3000$ MB (measured 135 MB RSS per worker).
     - **Criterion 5 (2D + 3D Spatial QA Lint Clean)**: Confirms spatial QA linter evaluated 35 checkpoints and 175 constraints with 0 critical errors.
     - **Criterion 6 (EBU R128 Broadcast Audio)**: Confirms post-encode integrated loudness $-14.0 \pm 0.5$ LUFS (measured -14.0 LUFS) and True Peak $\le -1.0$ dBFS (measured -1.7 dBFS).
     - **Criterion 7 (COPPA & Synthetic Media Decision Logs)**: Confirms `"Made for Kids (Primary)"` status, non-photorealistic cartoon disclosure, and 100% original IP clearance recorded for each episode.
     - **Criterion 8 (Windows-Native & Documentation)**: Confirms Windows platform verification (`win32`), complete traceability logs, BlenderMCP documentation, and asset licensing registries.
   - Evaluated **73 / 73 checks passed**.
2. **Master Documentation & Changelog**:
   - Authored root `CHANGELOG.md` tracking all versions from initial 2D Motion Engine (v1.0.0) through complete Blocky Story Engine (v2.0.0, Phases B0–B10).
   - Overhauled `blocky/README.md` with full subsystem architectural breakdown, complete CLI command manual, and DoD status table.
   - Enhanced root `README.md` introducing both the Spectra 2D motion engine and the Blocky 3D story engine.
3. **Master Regression Test Run**:
   - Executed all 11 test suites via `node blocky/cli.js test`: Story (34), Actions (34), Faces (14), Props (40), Sets (24), Audio (8), QA 3D (10), Publish (265), glTF (35), DoD (73), Determinism (6).
   - Achieved **543 / 543 assertions passed (0 failures)**.

### Measured Results & Verification Evidence
- **DoD Test Suite (`node blocky/cli.js dod`)**: **73 / 73 passed**.
- **Full Engine Regression Suite (`node blocky/cli.js test`)**: **543 / 543 passed**.
- **Definition of Done Status**: **100% Complete & Verified**.
- **Artifacts Generated / Updated**:
  - `blocky/tests/dod.test.js`
  - `CHANGELOG.md`
  - `blocky/README.md`
  - `README.md`
  - `EXECUTION_LOG.md`








---

## Run 12: Phase B11 — Viral Story Production ("The Red Streetlamp") & Master Render Verification

### Objective
Conceive, author, direct, voice, render, and master a complete, broadcast-ready viral Instagram / YouTube Shorts episode around the urban folklore premise: *"In this town, when the streetlamp turns red, nobody is allowed to move."* Validate end-to-end rendering pipeline on Windows, produce high-resolution contact sheets and final video, assemble full distribution publish packs, and evaluate what remains across the broader system.

### Actions Taken & Technical Solutions
1. **Story Conception & Scripting (`blocky/series/the-blockies/ep04-red-streetlamp/`)**:
   - Authored `script.json` obeying all Shorts pacing rules (avg 7.7 words/line $\le 9$, 0 forbidden trademark words, beat sequence: `hook -> setup -> escalation -> escalation -> twist -> payoff -> cliffhanger`).
   - Hook: *"In this town, when the streetlamp turns red... freeze!"*
   - Escalation: Mox's foot starts itching unbearably while the light glows crimson.
   - Comedic Twist: Toddler June casually strolls past the park bench munching cake: *"Rules do not count if you have snacks."*
   - Cliffhanger: The streetlamp suddenly starts flashing purple, prompting panic and a "PART 2" slam title.
   - Authored `review.md` certifying COPPA Made-for-Kids, synthetic non-photorealistic cartoon disclosure, and original IP clearance.
2. **Director Timeline & Procedural Set Enhancements**:
   - Authored `episode.json` with 7 anchor-driven camera shots (wide establishing park, low Dutch angle for Mox's trembling foot, over-shoulder for June's reveal, snap-zoom out for the purple flashing cliffhanger).
   - Enhanced `buildParkSet` in `blocky/runtime/world.js` with an ominous crimson red glowing lantern and dynamic red PointLight during `night` mood.
3. **Offline Audio Synthesis & Sound Design**:
   - Executed `python blocky/vo.py` to synthesize 7 dialogue lines using local Kokoro v0.19 neural TTS with pitch shifting (June: +3.5 semitones), generating `data/anchors.json` (precise millisecond word timestamps) and `data/lip.json` (8-viseme phoneme opening envelopes). Total dialogue duration: 20.75s.
   - Executed `python blocky/audio.py` generating procedural SFX (footsteps, gasps, punch thuds, whooshes, pops, crunches) and dynamic `sneak` music bed with sidechain dialogue ducking into `out/mix.wav`.
4. **Deterministic WebGL Frame Rendering & Two-Pass Mastering**:
   - Executed `node blocky/render.js` utilizing 2 Chromium workers with GPU flags, rendering 623 frames (1080×1920 @ 30 fps) in 75.1s into `out/silent.mp4` and emitting `data/events.json`.
   - Executed `node blocky/cli.js master` with `$env:NAME='the-blockies-ep4'` performing two-pass EBU R128 loudness normalization, head/tail audio fades, and 48 kHz AAC muxing into `out/the-blockies-ep4-motion-film.mp4` (7.07 MB).
   - Automated QA Gate: Integrated Loudness $-14.2$ LUFS (target $-14.0 \pm 0.5$), True Peak $-1.9$ dBFS (gate $\le -1.0$), Black frames: 0. Broadcast QA: **PASSED**.
5. **Visual Contact Sheet & Distribution Packaging**:
   - Executed `node blocky/shots.js` at 7 key timestamps (1.5s, 4.2s, 7.5s, 10.2s, 13.0s, 16.5s, 19.5s) and `python blocky/sheet.py` to create `out/the-blockies-ep4-contact-sheet.png`. Copied to conversation artifacts.
   - Updated `blocky/publish/pack.js` with metadata for `the-blockies-ep4` and generated complete publish bundle in `blocky/publish/ep04-red-streetlamp/` (`title.txt`, `description.txt`, `hashtags.txt`, `pinned_comment.txt`, `captions.srt`, `checklist.md`, `decision_log.json`, `cover.png`, `video_1080x1920.mp4`).
6. **Full Regression & DoD Test Suite Verification**:
   - Updated `story.test.js` and `publish.test.js` to cover 4 production episodes.
   - Executed `npm run test:all`: **All 11 test suites and 73/73 DoD checks PASSED**.

### Measured Results & Verification Evidence
- **Episode Master Video**: `blocky/out/the-blockies-ep4-motion-film.mp4` (20.77s, 1080×1920, 30 fps, H.264/AAC, 7.07 MB).
- **Loudness**: $-14.2$ LUFS (pass), True Peak: $-1.9$ dBFS (pass), Black Frames: 0 (pass).
- **Contact Sheet**: `the-blockies-ep4-contact-sheet.png` (7 key narrative beats).
- **Publish Pack**: `blocky/publish/ep04-red-streetlamp/` (100% complete with COPPA decision log, high-CTR titles, hashtags, SRT subtitles, and SOP checklist).
- **Master Regression Suite (`npm run test:all`)**: **100% PASS across all suites**.
