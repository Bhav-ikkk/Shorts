# Changelog — Blocky Story Engine & Motion Video Pipeline

All notable changes to the Blocky Story Engine and Motion Video Generation Pipeline will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-11 — The Blocky Story Engine (Phases B0–B10 Complete)

### Added
- **Phase B0: Infrastructure & Reproducibility (`8f610e5`)**:
  - Normalized all hardcoded file and model paths across Python and Node.js (`path.resolve`, `pathlib.Path`).
  - Switched from CPU SwiftShader to hardware-accelerated Chromium GPU rasterization (`--enable-gpu-rasterization`, `--ignore-gpu-blocklist`), speeding up rendering from 1.47 fps to 11.5–12.5 fps (~8.5× speedup) with only 135 MB RSS.
  - Synthesized all lines locally using Kokoro ONNX neural TTS at 48 kHz.
  - Implemented two-pass EBU R128 loudnorm audio mastering with -2.0 dBFS pre-encode target, producing -14.0 LUFS and -1.7 dBFS true peak post-encode.
- **Phase B1: Data-Driven Architecture (`081597d`)**:
  - Implemented Director Episode Compiler (`compile_episode.js`) and schema vocabulary (`vocabulary.json`).
  - Enforced pure relative anchor expressions (`L5.word(Follow)+0.1`); rejected raw numeric seconds.
  - Modularized monolithic runtime into `runtime/char.js`, `world.js`, `camera.js`, `captions.js`, and `fx.js`.
  - Implemented multi-pass SHA-256 byte-identical determinism test (`tests/determinism.test.js`).
- **Phase B2: Rig v2 & Character Actions (`77f9d55`)**:
  - Upgraded character limbs to biologically plausible two-bone skeletal hierarchies (elbows, knees, feet, hands).
  - Implemented secondary motion: harmonic spring bounce on hair and head rotation lag.
  - Implemented squash-and-stretch ($J.sq$) during impacts and recoils.
  - Validated 34 kinematic character actions ($\Delta > 0.1$) via `tests/actions.test.js`.
  - Built initial 3D spatial QA linter (`qa/lint3d.js`) evaluating 35 checkpoints (105 constraints clean).
  - Rendered 18.0s showroom film `action-showcase.mp4` (~10 fps) and composed 12-action contact sheet.
- **Phase B3: Faces & Acting (`5a245c3`)**:
  - Implemented 10 emotion presets (`neutral`, `happy`, `suspicious`, `guilt`, `panic`, `smug`, `shock`, `angry`, `relief`, `devious`).
  - Implemented 8-viseme phoneme mouth system (`A`, `E`, `O`, `U`, `M`, `F`, `L`, `S`) with teeth, tongue, and lip geometry.
  - Added dynamic 3D eye gaze tracking (`setLookAt`) combining head yaw/pitch and pupil canvas offsets.
  - Implemented Pearson acoustic correlation gate (`qa/lip_sync.js`) asserting $\rho \ge 0.60$; measured $0.985 \le \rho \le 0.999$ across 17/17 lines.
  - Rendered 18.0s acting reel `acting-showcase.mp4` and composed 12-preset contact sheet.
- **Phase B4: Sets & Props (`c714b79` / `6d81e03`)**:
  - Built 6 procedural environments in `runtime/world.js` (`kitchen`, `bedroom`, `hallway`, `park`, `spookyHouse`, `obby`).
  - Built 40 low-poly props in `runtime/props.js` across Food/Drink, Tools/Gadgets, School/Office, and Furniture/Decor.
  - Implemented 4 lighting moods (`day`, `sunset`, `night`, `obby`).
  - Rendered 18.0s Sets Showcase `set-showcase.mp4` in 42.8s at 12.6 fps and composed 12-frame contact sheet.
- **Phase B5: Story Engine (`2fe291d`)**:
  - Built script pacing and trademark linter (`story/script_lint.js`) enforcing $\le 9$ words/line and trademark blacklist scanning.
  - Built anti-repetitiveness linter (`story/repetitiveness.js`) enforcing pairwise Jaccard similarity $\le 0.25$ (measured $0.000$ to $0.038$).
  - Authored Series Bible (`cast.json`, `world.json`, `continuity.json`, `arcs.md`, `hook_bank.md`).
  - Authored 3 full production episode packages (`ep01-crumb-trail`, `ep02-floor-is-lava`, `ep03-secret-attic`) with human review sign-offs (`review.md`).
- **Phase B6: Audio v2 (`6c28915`)**:
  - Built procedural sound effects library (`audio/sfx.py`) synthesizing 25 mathematical sound effects without audio samples.
  - Built procedural music bed generator (`audio/music.py`) synthesizing 7 dynamic mood beds.
  - Built overlap-add pitch shifter (`audio/pitch_shift.py`) preserving duration and lip-sync alignment.
  - Added character voice pitch profiles: June +3.5st, Mox +0.6st, Pip 0.0st; vocal styling (whisper, panic, normal).
  - Built dynamic mixer (`audio/mixer.py`) with sidechain ducking (-5 dB SFX, -8 dB music under speech).
  - Built post-encode loudness verification gate (`qa/loudness.js`): -14.0 LUFS, -1.7 dBFS true peak, 48 kHz AAC.
- **Phase B7: QA 3D Hardening (`455367d`)**:
  - Implemented Part 10 spatial checks in `qa/lint3d.js`: camera-inside-geometry ($> 0.38\text{m}$), subject framing (6% safe margin), face visibility ($\cos\theta \ge -0.82$), raycast occlusion, floor penetration, UI safe area (10%–80%), and shot rhythm ($ASL = 1.95\text{s}$).
  - Built negative fixture suite (`tests/qa3d.test.js`) validating 5 defective shots fail and production shots pass.
- **Phase B8: Publish Pack (`fe35e97` / `d4d02af`)**:
  - Built multi-episode publish pack generator (`publish/pack.js`) assembling upload bundles for YouTube Shorts and Instagram Reels.
  - Engineered 3 high-CTR title variants per episode ($\le 60$ chars optimal for mobile, 0 forbidden words).
  - Generated descriptions, 5 hashtags, pinned comment questions, synchronized SRT subtitles, and upload SOP checklists.
  - Structured machine-readable COPPA Made-for-Kids (`"Made for Kids (Primary)"`) and synthetic content decision logs (`decision_log.json`).
  - Added 265 unit test assertions in `tests/publish.test.js`.
- **Phase B9: Blender Optional & glTF Asset Pipeline (`952131a` / `508e35e`)**:
  - Built headless asset exporter (`tools/make_asset.py`) with dual execution: Blender headless (`blender -b -P`) and standalone pure Python GLB synthesis.
  - Created hero model `assets/models/hero_trophy.glb` (10,332 bytes) with PBR materials and baked 4.0s `TrophyFloat` animation.
  - Authored BlenderMCP architecture guide (`docs/blender_mcp.md`) and asset licensing registry (`assets/LICENSE.md`).
  - Built Three.js `GltfAsset` runtime controller with deterministic `seek(t)` (`mixer.setTime(loopT)`).
  - Added 35 unit test assertions in `tests/gltf.test.js`.
- **Phase B10: Hardening & Definition of Done Verification**:
  - Created automated Definition of Done test suite (`tests/dod.test.js`) validating all 8 DoD criteria programmatically (73/73 checks passed).
  - Updated CLI command runner (`cli.js`) unifying bench, story, compile, voice, render, audio, master, shots, sheet, lint3d, sync, loudness, qa, pack, gltf, dod, and all commands.
  - Updated comprehensive documentation across `README.md`, `blocky/README.md`, and `EXECUTION_LOG.md`.
  - Achieved **543 / 543 total regression tests passed**.

---

## [1.0.0] - 2026-11-10 — Spectra Motion Design Engine

### Added
- Core 2D motion design pipeline (`engine/`) for SaaS product videos (1920×1080).
- Declarative project archetypes (`contrast-hook`, `metrics-count`, `split-compare`, `terminal-run`, `tile-proof`, `kinetic-cta`).
- Offline Kokoro neural TTS synthesis with word-level acoustic alignment.
- Procedural audio mixing with sidechain ducking and two-pass EBU R128 mastering.
- Dense layout and collision linter for 2D DOM elements.
- Multi-worker Chromium frame renderer producing 30 fps video.
