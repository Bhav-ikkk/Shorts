# MASTER PROMPT — Build a Local, Product-Agnostic Motion-Film Pipeline
**For:** your coding agent (anti-gravity / any agentic IDE) · **Written by:** Claude · **Goal:** generate premium SaaS motion-design videos for *any* product, locally, repeatably, with fast iteration — without depending on any chat session.

> **How to use this file**
> 1. Put these in the agent's workspace: this file, `SPECTRA_VIDEO_PIPELINE.md` (the earlier guide), `spectra-video-pipeline.zip` (the reference project that produced the final Spectra videos), and the agent's own current `video-gen/` repo.
> 2. Paste **Part 1** as the first message. Tell the agent that **Part 2 onwards is the binding specification**.
> 3. Make the agent work phase by phase (Part 12). It must show *evidence* at every gate. Do not accept "done" without logs, screenshots and test output.

---

# PART 1 — Paste this first (kick-off message)

```text
You are the lead engineer for a LOCAL motion-film pipeline. Read, in this order:
  1. MASTER_PROMPT_motion_pipeline.md  (binding spec — this file)
  2. SPECTRA_VIDEO_PIPELINE.md          (how the reference videos were made, with full source)
  3. spectra-video-pipeline.zip         (the reference project: working code)
  4. the current repo video-gen/        (your previous implementation)

Mission: turn video-gen/ into a robust, cross-platform (Windows-first), product-agnostic engine that
produces premium motion-design SaaS videos from a declarative project.json, and lets me iterate
(edit script/theme/scenes -> rebuild in seconds -> re-render only what changed).

Hard rules:
 - Do NOT trust the existing implementation or its own report. Audit it first (Part 3) and write AUDIT.md
   with evidence (commands + outputs). Fix what is broken before adding features.
 - No hardcoded absolute paths. No Linux-only assumptions. Everything via node:path / pathlib / config.
 - Everything free/local by default. Optional online providers must be opt-in and clearly flagged.
 - The pipeline must be deterministic: same inputs -> byte-identical frames.
 - You may not claim a stage works unless you ran it in this session and pasted the output.
 - Every layout/clipping/overlap bug I report becomes (a) a root-cause fix, (b) a lint rule or test that
   would have caught it, (c) a regression fixture. Never fix a collision by nudging one pixel value only.
 - Work in the phases of Part 12. At the end of each phase STOP and report using the format in Part 13.
 - If you cannot view images, say so, and rely on the layout linter + golden-frame diffs + contact sheets
   I will review manually. Never claim you "looked" at a frame if you did not.

Start with Phase 0 (audit + doctor). Do not skip ahead.
```

---

# PART 2 — Context the agent must understand

## 2.1 What a "premium motion film" is here
- **A web page is the motion canvas** (HTML + CSS + inline SVG + GSAP timeline, optionally WebGL). A headless browser *films it deterministically*: pause the timeline, `seek(t)`, screenshot, pipe to ffmpeg. No screen recording, no video editor, no AI video model.
- **Voice-first timing:** speech is generated and *measured*; every visual is attached to measured word/phrase times. Visuals lead the ear by 50–100 ms.
- **Procedural audio:** voice (TTS + softening chain) + sound effects emitted by the same animation code + a chord pad bed, sidechain-ducked, loudness-mastered.
- **One component system** and **semantic colour** across the entire film; one idea per scene; plain words; prove with one number.

## 2.2 Facts established while building the Spectra films (keep these true)
- Final reference: `spectra-simple-v4.mp4`, 42.0 s, 1920×1080, 30 fps, 13 spoken lines, 86 sound events, render ≈ 2 min single-process for 1260 frames (≈ 10 fps capture).
- Measured on that file: **−14.6 LUFS** (target was −14: single-pass `loudnorm` drifts), peak −1.3 dBFS, **audio stream came out at 96 kHz** (loudnorm up-samples) → **new rule: always `-ar 48000` and two-pass loudnorm** (tested: two-pass gives −14.1 LUFS, −1.5 dBFS).
- Word onsets in the reference were *estimated* (letter-weighted inside measured phrase segments). They are good to ~±60 ms. **Upgrade this** (Part 6.2).
- Collision/clipping bugs were found *by human eyes after delivery* in v3, v3.1, v3.2 and v4. **This must become automated** (Part 9).

## 2.3 Review of the previous agent's report (verify each claim — do not assume)
| Claim in its report | Concern | Required action |
|---|---|---|
| "Duration exactly 49.60 s", script "13 lines" | Reference was 42 s; confirm what script/pauses produced 49.6 s and that nothing drifted | Print `anchors.json` totals vs `ffprobe` duration in QA |
| "AAC audio (96 kHz stereo)" | 96 kHz is an accident of `loudnorm`; some platforms re-encode badly | Force `-ar 48000`; assert in QA |
| "−14.0 LUFS, TP ≤ −1.5" | Single-pass loudnorm rarely hits −14.0 exactly | Two-pass; QA fails if \|I−target\| > 0.5 |
| Uses `edge-tts` as primary voice | Unofficial client of an online Microsoft service: needs internet, can break or change terms, not suitable as the only/default engine | Make **Kokoro (local)** default; `edge-tts` optional; provider interface (Part 6.1) |
| FFmpeg taken from `node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe` | Fragile (depends on a package we are removing) | Resolver order: env `FFMPEG_PATH` → `ffmpeg-static` npm → system PATH → fail with instructions |
| "Reference implementation = Spectra V3.0" | Final approved cut is the **v4 Simple** cut | Port v4 (`body4.html/css4.css/script_*.js`) as the reference project |
| "template with resilient helpers" | Unspecified | Define archetype library + schema (Part 7) and prove with a 2nd product |
| "Zero clipping/overlap" | Claimed from inspection frames only | Replace with the automated layout linter (Part 9) |

---

# PART 3 — Phase 0: audit & `doctor` (required before any feature work)

Create `AUDIT.md` containing, with pasted command output:
1. `node -v`, `python --version`, `ffmpeg -version`, Playwright version, `npx playwright --version`, browser used (bundled Chromium / Chrome / Edge channel).
2. Run the **existing** pipeline end-to-end on the Spectra project. Record: time per stage, any errors, output specs (`ffprobe`), loudness (`ebur128`), black frames.
3. Grep for **hardcoded paths** (`/home/`, `/tmp/`, `C:\\`, `claude`): list each hit.
4. Grep for **Spectra-specific strings** inside `engine/` (should be zero).
5. List every place a **timestamp is typed by hand** (should be derived from anchors).
6. Determinism check: render frame at t=17.3 twice (separate browser launches) → compare SHA-256 of PNGs.

Implement `node engine/cli.js doctor` that checks and prints PASS/FAIL (with fix hints) for: Node ≥ 20, Python 3.10–3.12, ffmpeg+ffprobe resolvable, Chromium launchable, fonts present in `node_modules/@fontsource`, TTS model files present, write permission to `out/`, disk space ≥ 2 GB, CPU count (to choose workers).

---

# PART 4 — Target architecture

```
video-gen/
  package.json                    scripts: film:doctor film:dev film:voice film:build film:shots film:lint
                                           film:audio film:render film:mux film:qa film:all film:export test
  PIPELINE_GUIDE.md               human manual (keep updated)
  engine/
    cli.js                        one entry: `node engine/cli.js <stage> <project> [opts]`
    core/
      paths.js                    project/build/out paths from a single root (no absolutes)
      ffmpeg.js                   resolver + `run()` with logging
      hash.js                     content hashing for caches
      log.js                      structured logs -> build/logs/*.jsonl
    voice/
      provider.js                 interface; providers/{kokoro,piper,edge_tts,file}.py|js
      align.py                    word timing: provider-native → faster-whisper → proportional
      soften.py                   voice DSP chain (from reference)
      anchors.js                  writes anchors.json + anchors.js (browser-side)
    compose/
      compose.js                  assemble page from theme + archetypes + choreography
      fonts.js                    resolve @fontsource files, emit @font-face, preload list
      motion-kit.js               browser-side helpers (hdr,pop,wipe,count,ring,cam,splitText,drift…)
      layout.js                   browser-side layout system: slots, fitText, safe areas
      archetypes/                 reusable scene modules (Part 7)
    audio/
      audio_engine.py             SFX synth, pad, ducking, mix; moods; stereo
      master.js                   two-pass loudnorm, 48 kHz
    render/
      render_engine.js            parallel workers, optional motion blur, segment concat
      mux.js
    qa/
      lint_layout.js              overlap/clip/offscreen/contrast linter (Part 9)
      qa_media.js                 ffprobe, blackdetect, freezedetect, ebur128, sync checks
      golden.js                   golden-frame visual regression (pixelmatch)
      contact_sheet.js
    dev/
      dev_server.js               live preview with scrubber, guides, lint overlay (Part 10)
  projects/
    spectra/                      reference project = v4 Simple cut (ported)
    sample-saas/                  a SECOND, different product proving generality
    template/                     clean starter
  tests/                          unit + integration + golden + determinism + lint fixtures
  out/                            deliverables (versioned: <name>-vN.mp4/.srt/.json)
```

**Stage graph & caching** (each stage reads/writes `projects/<p>/build/…`, and records an input hash in `build/manifest.json`; skip a stage when hashes match, `--force` overrides):
`voice (per-line cache) → anchors → compose → events → lint/shots → audio → render → mux → qa → export`

**Editing one line must only re-synthesize that line** (`sha1(provider|voice|rate|spoken)` filename cache).

---

# PART 5 — `project.json` schema (declarative, product-agnostic)

```jsonc
{
  "schemaVersion": 2,
  "product": { "name": "Acme", "url": "acme.io", "tagline": "…", "oneLine": "What it does in 12 words" },
  "brief": "projects/acme/brief.md",              // audience, fear, belief, proof, CTA
  "format": { "preset": "landscape-1080", "fps": 30 },   // landscape-1080 | square-1080 | portrait-4x5 | vertical-9x16
  "theme": {
    "tokens": { "paper": "#F2EDE2", "ink": "#0E0F13", "brand": "#2F4BFF", "bad": "#F2432D", "good": "#12A66B" },
    "mode": "paper-ink",                           // or "ink-paper"
    "radius": { "chip": 1, "card": 20 },
    "grid": { "margin": 96, "gutter": 24, "baseline": 8 }
  },
  "typography": { "display": "bricolage-grotesque", "accent": "instrument-serif", "ui": "inter", "mono": "jetbrains-mono" },
  "voice": { "provider": "kokoro", "voice": "am_michael", "speed": 1.02, "soften": true },
  "audio": { "mood": "calm-confident", "padChords": "auto", "sfxDensity": "medium", "targetLUFS": -14, "truePeak": -1.5, "sampleRate": 48000 },
  "captions": { "burnIn": true, "style": "plate", "maxChars": 42, "srt": true },
  "script": [
    { "id": "L1", "spoken": "Everything said: all good.", "caption": "Everything said: all good.", "pauseAfter": 0.30, "beat": "hook" }
    // … 11–15 lines; "spoken" may differ from "caption" (numbers spelled out for TTS)
  ],
  "scenes": [
    { "id": "hook",  "archetype": "contrast-hook",   "lines": ["L1","L2"], "params": { "positive": "all good", "flip": "couldn't" } },
    { "id": "pain",  "archetype": "evidence-zoom",   "lines": ["L3"],      "params": { "mock": "checkout", "highlight": "pay-button", "chip": "Pay button covered" } },
    { "id": "why",   "archetype": "split-compare",   "lines": ["L4","L5"], "params": { "left": "What the software reads", "right": "What the customer sees" } },
    { "id": "idea",  "archetype": "metaphor-icon",   "lines": ["L6"],      "params": { "icon": "eye" } },
    { "id": "step1", "archetype": "type-to-command", "lines": ["L7"],      "params": { "text": "The Pay button must always be visible." } },
    { "id": "step2", "archetype": "dual-check-gauge","lines": ["L8","L9","L10"], "params": { "checkA": "…", "checkB": "…", "tolerance": 1.35 } },
    { "id": "proof", "archetype": "tile-proof",      "lines": ["L11"],     "params": { "total": 18, "baseline": 1, "ours": 18 } },
    { "id": "cta",   "archetype": "kinetic-cta",     "lines": ["L12","L13"], "params": { "chips": ["RUNS IN YOUR CLI","WORKS IN CI"] } }
  ],
  "custom": { "choreography": "projects/acme/scenes/choreography.js" }   // escape hatch for bespoke moments
}
```
Validate with JSON Schema (ajv) and **fail fast with human-readable errors**.

---

# PART 6 — Engine specifications

## 6.1 Voice (provider interface)
```ts
interface TTSProvider { id: string; synth(text: string, opts): Promise<{wavPath: string; words?: {w:string;t0:number;t1:number}[]}>; }
```
Providers: **kokoro** (default, local, sherpa-onnx pinned `1.12.26`; `kokoro-onnx` as alternative), **piper** (local, light), **edge_tts** (opt-in, online), **file** (user-supplied recorded WAV per line — lets a human voice replace TTS).
Post-process every line: trim silence (threshold 0.012 abs, keep 20 ms head / 60 ms tail), resample to 44.1/48 kHz, apply `soften.new_chain` if `voice.soften`.
Reference voice: Kokoro v0.19, speaker `am_michael` (sid 6), speed 1.02. Other ids: 0 af, 1 af_bella, 2 af_nicole, 3 af_sarah, 4 af_sky, 5 am_adam, 7 bf_emma, 8 bf_isabella, 9 bm_george, 10 bm_lewis.
On Windows ensure `espeak-ng-data` path is passed explicitly; model files live in `engine/voice/models/` (git-ignored) with a `doctor` hint to download.

## 6.2 Word-level timing — the biggest sync upgrade
Resolution ladder (use the first that works, record which in `anchors.json.method`):
1. **Provider-native word boundaries** (e.g. `edge-tts` with `boundary="WordBoundary"`; offsets are 100-ns ticks → seconds = offset/1e7).
2. **Forced alignment with `faster-whisper`** (free, local; downloads weights from Hugging Face on first run — works on your machine even though it was blocked in my sandbox):
```python
from faster_whisper import WhisperModel
m = WhisperModel("base.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(wav_path, word_timestamps=True, language="en", vad_filter=False)
words = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words]
```
   Because `spoken` ≠ `caption` ("Nine point six percent" vs "9.6%"), map caption tokens → spoken tokens via a small normaliser (digits↔words table) + `difflib.SequenceMatcher`; unmapped tokens interpolate between neighbours.
3. **Fallback** = the reference method: 10 ms RMS energy segments (`>max(.02*max,.004)`, merge gaps < 70 ms), letter-weighted proportional onsets, sentence-aware when segment count = sentence count.

`anchors.json` per line: `{text, start, dur, end, segs[[a,b]], words[[w,relOnset,relEnd]], gap, method}`; `anchors.js` = `window.ANCH = {...}` for the page.
**Timing API in the page (keep names):** `st(k) en(k) W(k,'word') WI(k,i) SS(k) SSo(k,i) SG(k,i)`; plus new `WE(k,i)` (word end).
**Rule:** any visual illustrating a word is placed at `onset − 0.05…0.10 s`. No hand-typed seconds for anything voice-related; `lint` greps scene files for numeric literals passed as time and warns.

## 6.3 Compose
Build one HTML: theme CSS variables → fonts → base CSS → motion-kit → layout system → archetype markup+choreography (in order of `scenes`) → custom choreography → captions → `window.TOTAL`, `window.seek`, `window.ready`, `window.EVENTS`.
`window.seek(t)` must be **pure** (any t in any order gives the same frame). `window.ready` resolves after **all** font faces are loaded (`document.fonts.load` per face/weight) **and** after `fitText` pass.
Make seek **async-capable**: `window.seekAsync = async t => { tl.time(t,false); for (const h of window.beforeFrame||[]) await h(t); }` (needed for `<video>` layers and WebGL; see 8.6).

## 6.4 Audio engine (v2 improvements over the reference)
- Keep: soft low-mid SFX voices (`tap, pop, click, thud, impact, whoosh, swell, ticks, chime`), reverb bus, chord pad (Am F C G C progression for "calm-confident"), sidechain ducking (SFX −50 %, pad −35 % under voice), `soften` chain.
- **Moods** (preset tables of chord progression, tempo-free pad register, SFX brightness, reverb size): `calm-confident`, `bright-optimistic`, `serious-enterprise`, `playful-dev`. Pad chords change on beat boundaries from `script[].beat`, not hard-coded seconds.
- **Stereo:** voice centre; SFX with per-event pan (`o.pan`) and short Haas widening on `whoosh`; pad slightly decorrelated L/R.
- **Low-end:** add a sub-thump layer under `impact` (40–55 Hz, 0.5–0.9 s) — high-end ads feel "expensive" because of controlled low end; high-pass everything else at 70 Hz.
- **Room tone:** −60 dB pink noise bed (1–2 dB below pad) so silences never feel digital-dead.
- **Optional licensed music slot:** `audio.music = {file, license, gainDb}`; the pipeline ducks it, logs the licence in `build/credits.json`, and refuses files without a licence string. Procedural pad remains the default.
- **Mastering (`master.js`)**: two-pass `loudnorm` (measure → apply with `measured_*`, `linear=true`) → `-ar 48000`, AAC 192k, 40 ms fade-in, 1.0–1.2 s fade-out ending exactly at `TOTAL`. QA gate: `|I − target| ≤ 0.5`, TP ≤ −1.0 dBFS, no samples at full scale before mastering.
```js
// pass 1
ffmpeg -i mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json -f null -
// pass 2 (fill from JSON)
ffmpeg -i mix.wav -af "loudnorm=I=-14:TP=-1.5:LRA=7:measured_I=…:measured_TP=…:measured_LRA=…:measured_thresh=…:offset=…:linear=true" -ar 48000 master.wav
```

## 6.5 Render engine (faster than the reference, same determinism)
- **Parallel workers:** split `[0, frames)` into N contiguous ranges (N = min(cpu−2, 6)); each worker owns a Chromium page and its own ffmpeg pipe writing `part_k.tmp.mp4` (identical encoder settings), rename on exit code 0, then concat with the demuxer and `-c copy`.
- Chromium args: `--font-render-hinting=none --disable-lcd-text --force-color-profile=srgb`; `deviceScaleFactor: 1` (or 2 with downscale for crisper edges — configurable `supersample`).
- Encoder: `libx264 -crf 18 -preset veryfast -pix_fmt yuv420p -r <fps> -movflags +faststart` (final-quality profile may use `-preset slow -crf 16`). Add `-colorspace bt709 -color_primaries bt709 -color_trc bt709` and tag `-vf scale=out_color_matrix=bt709` for correct colours on LinkedIn/X.
- **Optional motion blur (sub-frame accumulation):** capture K sub-frames per output frame at `t = (i + shutter*((j+.5)/K − .5)) / fps` (shutter 0.5 ≈ 180°; clamp ≥ 0), feed at `fps*K`, and average in ffmpeg (tested):
```text
-vf "tmix=frames=4:weights='1 1 1 1',select='eq(mod(n\,4)\,3)',setpts=N/(30*TB)" -r 30
```
  Costs K× capture time; enable per project (`render.motionBlur: {k:4, shutter:.5}`) and for the final export only. It visibly smooths fast wipes, scans and camera pushes.
- **60 fps export** option (`format.fps: 60`) for platforms that keep it; the same code path.
- **Resume:** if `part_k.mp4` exists and hash matches, skip.
- **Preview quality:** `--quality draft` = 960×540, JPEG q70, crf 28, no blur, 1 worker per core → < 20 s for a 40 s film.
- Always write to `*.tmp.mp4` then rename; never leave a truncated playable file.

## 6.6 Mux / export
`mux`: video `-c:v copy` + mastered audio → `out/<name>-vN.mp4` (auto-increment N, write `<name>-vN.json` with input hashes, tool versions, durations, QA results).
`export` presets from the same timeline: **16:9 1920×1080**, **1:1 1080×1080**, **4:5 1080×1350**, **9:16 1080×1920** (needs portrait layouts; Part 8.9), plus `poster.png` (best "hook" frame, default t = first impact beat), `preview.gif/webp` (≤ 6 s, 720 px), `captions.srt`, `captions.vtt`.
Platform checks: X (≤ 2:20, ≤ 512 MB), LinkedIn (≤ 10 min, ≤ 5 GB, 3 s–30 min) — warn, do not hard-fail (limits change; verify).

---

# PART 7 — Scene archetype library (replace "cards" with real motion)

Each archetype = `{ markup(params, theme), choreography(tl, ctx, params), lint: { required: [...] }, portrait?: {...} }`, receiving timing via `ctx.st/en/W/SG…`. Ship at least:

| Archetype | What it does | Motion ingredients |
|---|---|---|
| `contrast-hook` | Positive claim → hard flip to negative ("all good" ✓→✕ / "couldn't") | masked word slide-up, scale-in 2.1×→1 on the flip word, flash, shake, thud |
| `evidence-zoom` | Live mock UI, camera pushes into the defect, hatch + label | camera rig (scale/translate), strip blink, chip pop, ticks |
| `split-compare` | Two panels: "what it reads" vs "what the human sees" | staggered rows, dim left / reveal right, header swap |
| `metaphor-icon` | One SVG icon draws itself (stroke-dashoffset), rotates in, viewfinder + scan | DrawSVG, back.out pop, scan line |
| `type-to-command` | Mic/waveform → typed text → "saved" card | waveform driven by progress, char-index typewriter, ticks |
| `dual-check-gauge` | Two independent checks, counters, gauge to value, verdict chip, fix & re-check, before/after split | `count()`, gauge with tolerance tick, pulse ring, cursor path, wipe reveal |
| `tile-proof` | N tiles flip red/green; big X/N counters | stagger, flip, ring shockwave, count-up |
| `kinetic-cta` | Two-line kinetic headline → logo → tagline words → URL typed → chips | mask reveals, logo spin-in, Lottie ring, typed URL |
| `metrics-count` (new) | 3–4 big numbers counting with sparkline/draw-in | tabular-nums, ease out expo |
| `terminal-run` (new) | CLI window typing a command, streaming output lines, success summary | char tween, line stagger, caret blink |
| `dashboard-pan` (new) | Real or mock dashboard; camera pans/zooms to 3 callouts | camera path, callout connectors drawn |
| `workflow-steps` (new) | 3 steps connected by a drawn path; active step glows | path draw, step pop, progress |
| `before-after-wipe` (new) | Same UI, draggable divider reveals the change | clip-path wipe, divider handle |

**Mocks:** provide `mock/*.js` generators for common UIs (checkout, dashboard, chat, form, table, terminal, code diff) as DOM, parameterised by data. Also support **real UI**: 2× screenshots of the actual product states (Playwright `page.screenshot`) placed inside a device frame with animated cursor/highlights, and optionally a `<video>` layer (8.6).
**Escape hatch:** `custom.choreography` may add bespoke tweens; it must use the same helpers and obey the linter.

---

# PART 8 — Motion-design upgrade pack ("what you don't know yet")

Priority: **P0** = do in the core, **P1** = ship in v2, **P2** = stretch. Honest note: I did not study OpenAI/xAI ads frame-by-frame here; the traits below are general characteristics of restrained, premium tech ads — treat as direction, never copy anyone's brand, artwork or footage.

**8.1 (P0) Direction principles of premium tech ads**
Restraint: very large type, generous whitespace, one idea per shot, monochrome + one accent, slow confident camera, tactile micro-interactions (press, snap, settle), crisp sound design with silence used as punctuation. **Cut the card gallery; show the mechanism as a single evolving object.**

**8.2 (P0) Motion budget & never-dead frames**
Every second must contain either a meaningful change or a *living hold*: add a ±1.5–3 % slow scale drift or parallax (`drift(el, dur, amount)`) on holds, subtle grain, and a 1 px line/cursor/caret motion. QA flags ≥ 1.2 s windows with near-zero frame difference unless the beat is tagged `hold:true`.

**8.3 (P0) Easing system, not ad-hoc easings**
Presets in `motion-kit`: `enter` (power4.out 0.5 s), `exit` (power2.in 0.25 s), `pop` (back.out(2.2) 0.38 s), `camera` (power3.inOut 0.55–0.8 s), `settle` (expo.out 0.9 s), `impact` (shake 6×45 ms + flash). Define **durations by distance/importance**, ease-in for exits, ease-out for entrances, **anticipation** (4–6 px counter-move before a big move) and **follow-through** (2–4 % overshoot). GSAP **CustomEase** for brand-specific curves.

**8.4 (P0) Kinetic typography done right**
Use GSAP SplitText (all GSAP plugins became free from v3.13 per GSAP's announcement — read the licence text before commercial use) for line/word/char masks; headline words appear at word onsets; accent word in serif italic ~1.6–1.8× size; **tabular-nums** for all counters (prevents digit jitter — the reference did not do this; it should); `text-wrap:balance` on multi-line headlines; optical size for big display text (negative tracking −0.03…−0.045 em).

**8.5 (P1) Virtual camera rig**
One `#cam` wrapper per scene with `camTo({x,y,scale,rot}, t, ease)` + parallax layers (background dots move 0.6×, midground 1×, foreground 1.15×). Zoom into evidence, then pull back. Add 3D (`perspective: 1600px`, `rotateX/Y` ±6°) for device frames to get depth without WebGL.

**8.6 (P1) Real product footage layers**
- `<video>` layer: set `video.currentTime = t - t0`, `await 'seeked'` inside `seekAsync` hook; encode source as all-intra or short-GOP H.264/VP9 for accurate seeking. Needed so footage is frame-exact in a deterministic render.
- Scripted capture: Playwright drives the real product, saving 2× screenshots per state and (optionally) a `.webm`; archetypes consume them.
- Add cursor choreography on real UI: cubic-Bézier path (not straight lines), micro-overshoot, click ripple, hover states.

**8.7 (P1) Shared-element transitions & morphs**
FLIP (record → move → animate delta) so a chip *becomes* the verdict badge, a number *becomes* a gauge value, a card *becomes* the next scene's panel — continuity is what separates motion design from slideshow. GSAP MorphSVG/DrawSVG for icons and connector lines.

**8.8 (P1) Depth & finish**
Soft layered shadows (2 shadows: tight + wide), 1 px inner highlights, **film grain** overlay (pre-generated 256² noise PNG, translated per frame by `floor(t*24)`), subtle vignette, **light sweep/glint** across hero object (gradient masked with `mix-blend-mode`), colour-grade lift via CSS filters on the stage (±3 %). Keep the semantic palette; never add decorative gradients that carry meaning.

**8.9 (P1) Multi-format layouts**
Author in "slots" (Part 8.10), provide `portrait` variants per archetype (stacked layout, ≥ 28 px minimum label, safe area: keep key content inside the central ~85 % and away from bottom ≈ 20 % / top ≈ 10 % where platform UI sits — verify per platform). Captions plate moves with format.

**8.10 (P0) Layout system (the root fix for collisions)**
- 12-column grid at 1920 (margin 96, gutter 24), 8 px baseline; every element placed by **slot name** (`slot('A')`, `slot('B1')`) not absolute pixels.
- **`fitText(el, maxW, {min,max})`** — binary-search the largest font-size that fits (nowrap, `scrollWidth ≤ maxW`); applied to chips, verdicts, headlines after fonts load; **never** rely on a pixel-tuned font-size.
- **Containers own their children:** chip/verdict containers are `display:inline-flex` with `padding` and `max-width`, text can't exceed them; numbers sit in a fixed-width tabular box.
- **Minimum clearance:** 24 px between any two text blocks, 16 px between chips; enforced by the linter.

**8.11 (P2) WebGL / shader backgrounds & 3D hero**
Three.js or a fragment shader with `uTime = seek time` (render only inside `seekAsync`, never `requestAnimationFrame`) for animated gradient meshes, soft particles, depth-of-field blur on background. Headless Chromium needs software GL flags (`--use-gl=angle --use-angle=swiftshader` / `--enable-unsafe-swiftshader`) — test determinism; fall back to CSS if flaky.

**8.12 (P2) Lottie/Rive assets**
Procedural Lottie (as in the reference ring) is guaranteed deterministic. If importing LottieFiles assets: record each licence in `credits.json`, drive with `goToAndStop(frame,true)` only.

**8.13 (P1) Social-native craft**
First frame must work as a still (poster) and in muted autoplay: **big headline in the first 1.0 s**, caption plate always on, **hook within 1.5 s**, loop-friendly last frame, no important info in the last 0.4 s, captions ≤ 2 lines, ≤ 42 chars per line.

---

# PART 9 — Collision & clipping playbook (history → root cause → automated defence)

## 9.1 What went wrong, and how it was fixed in the reference
| # | Symptom (as reported / found) | Root cause | Fix applied | Generalised rule → automated check |
|---|---|---|---|---|
| 1 | v3.1: "badges come in between and overlap" | Absolutely-positioned chips from different beats shared the same area; some hadn't exited | Re-laid the referee scene into non-overlapping columns; one box per element | **Linter: no two visible text boxes may intersect** (except declared) |
| 2 | v3.2: "SAM 3.1 / NCC card cutting and overlapping data (21–29 s)" | Fixed-height rows too small for content; labels collided with big numbers | Increased row spacing, split label vs value into separate boxes, tighter secondary type | Linter: **clipped-x/clipped-y** (scrollWidth/Height > client); row heights from content |
| 3 | "Chips radius 1, light skin, same everywhere" | Three visual dialects of chips accumulated over versions | One `.ck` component with variants (`b g r n` light, `rd gd` dark), 1 px radius, 1.5 px tinted border | Lint: **only whitelisted component classes may style chips**; visual-diff of component sheet |
| 4 | "Progress bars awful" | Default rounded bars, unclear scale | 1 px radius, tick scale, tolerance marker, soft coral gradient + end cap | Component test page with golden image |
| 5 | v4: "18/18" stat clipped on right | Absolute `left` beyond viewport after tiles widened | Shrunk tiles (60×100, gap 12), moved stat left | Linter **offscreen** check at settled frames |
| 6 | v4: dev chips unreadably small | Fixed 22 px font on a 1920 canvas | 28 px | Linter **min font size** (≥ 24 px at 1080p; ≥ 28 px portrait) |
| 7 | v4: `REJECTED · 9.6% HIDDEN` touching panel edge | Chip text wider than its container | Reduced font/padding | `fitText` + linter **inner padding ≥ 12 px** between text and container edge |
| 8 | Stacked header words | Header elements from adjacent beats visible together | `hdr(sel,t,t2)` sets previous header hidden at the same instant | Linter group rule: `data-lint-group="header"` → at most 1 visible |
| 9 | Header hidden behind zoom | z-index / transform stacking | explicit z-order scale | Linter **occlusion** check via `elementFromPoint` at text centre |
| 10 | Black slab stuck on screen | Unused `.wipe` element left at `x=0` | Remove unused wipes; wipes start at `x:-1970` | Linter: any full-viewport opaque element visible > 0.6 s outside a wipe beat |
| 11 | Pulse border visible before its beat | `fromTo` renders start state immediately | `immediateRender:false` on later `fromTo`s | **Static check:** page-load at t=0 must match golden "t=0" (nothing unexpected visible) |
| 12 | Tab state wouldn't update | CSS `!important` beat GSAP inline styles | Remove `!important` | Static check: forbid `!important` on properties animated by GSAP |
| 13 | Counter/gauge text jitter | proportional digits | (not fixed in reference) | `tabular-nums` enforced on `.num` |

## 9.2 Layout linter (implement as `engine/qa/lint_layout.js`)
Run at **settled sample times** (beat ends, +0.15 s after each entrance, mid-hold) plus every 0.5 s; ignore elements with active tweens (`gsap.getTweensOf(el).some(t=>t.isActive())`) to avoid false positives while things are mid-motion. Mark lintable elements with `data-lint`; groups with `data-lint-group`; allowed overlaps with `data-lint-allow="idA,idB"` (e.g., chip over its own image).
```js
// sketch — run inside page.evaluate at each sampled time
const W = 1920, H = 1080;
const eff = el => { let o = 1, n = el; while (n && n.nodeType === 1) { const cs = getComputedStyle(n); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; o *= +cs.opacity; n = n.parentElement; } return o; };
const textBox = el => { const r = document.createRange(); r.selectNodeContents(el); const b = r.getBoundingClientRect(); return b.width ? b : el.getBoundingClientRect(); };
const els = [...document.querySelectorAll('[data-lint]')].filter(e => eff(e) > .6 && !gsap.getTweensOf(e).some(t => t.isActive()));
const items = els.map(e => ({ e, id: e.id || e.className, b: textBox(e), box: e.getBoundingClientRect(), allow: (e.dataset.lintAllow || '').split(',') }));
const issues = [];
for (const a of items) {
  if (a.box.left < 0 || a.box.top < 0 || a.box.right > W || a.box.bottom > H) issues.push(['offscreen', a.id]);
  const cs = getComputedStyle(a.e);
  if (a.e.scrollWidth > a.e.clientWidth + 1 && cs.overflow !== 'visible') issues.push(['clipped-x', a.id]);
  if (parseFloat(cs.fontSize) < 24) issues.push(['min-font', a.id, cs.fontSize]);
  const par = a.e.closest('.ck,.vcard,#panel,.card');
  if (par && par !== a.e) { const p = par.getBoundingClientRect(); const pad = Math.min(a.b.left - p.left, p.right - a.b.right); if (pad < 12) issues.push(['tight-padding', a.id, pad]); }
  const cx = a.b.left + a.b.width / 2, cy = a.b.top + a.b.height / 2, top = document.elementFromPoint(cx, cy);
  if (top && !a.e.contains(top) && !top.contains(a.e)) issues.push(['occluded', a.id, top.id || top.className]);
}
for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
  const A = items[i], B = items[j];
  if (A.e.contains(B.e) || B.e.contains(A.e) || A.allow.includes(B.id) || B.allow.includes(A.id)) continue;
  const gap = 8; // text blocks must keep clearance
  const x = Math.min(A.b.right, B.b.right) - Math.max(A.b.left, B.b.left) + gap, y = Math.min(A.b.bottom, B.b.bottom) - Math.max(A.b.top, B.b.top) + gap;
  if (x > 0 && y > 0) issues.push(['overlap', A.id, B.id]);
}
return issues;
```
Output: `build/lint/report.json` + an **annotated PNG** per failing time (red boxes around offenders) so a human (or a vision-capable agent) sees the problem instantly. `film:build` **fails** on any `error`; warnings (min-font, tight-padding) are shown but don't fail unless `--strict`.

## 9.3 Change-request protocol (how to react when *I* say "X collides at 21–29 s")
1. `film:lint --range 21 29` → reproduce; save annotated frames.
2. Identify **root cause** (container too small / absolute position / stacking / unfit text), not the pixel.
3. Fix at the component or layout level (slot, `fitText`, container padding).
4. Add a **regression fixture** (tiny project that reproduces it) under `tests/fixtures/` and a lint/golden test that fails before the fix and passes after.
5. Re-render **only** the affected range (`film:render --range 20 30`) → patch into the full video via segment concat.
6. Write the change into `CHANGELOG.md` (what was reported, root cause, fix, test).

---

# PART 10 — Developer experience (so iteration costs seconds, not hours)

- **`film:dev <project>`**: local server (plain `http` or Vite) serving the composed page with a control bar: play/pause, **scrubber with beat markers from anchors**, frame-step (←/→), loop region, 0.25× slow-mo, toggle **safe-area & grid guides**, toggle **lint overlay**, toggle captions, show current time/line id. Audio plays from `mix.wav`, synced to the timeline (`audio.currentTime = tl.time()` with drift correction when |Δ| > 40 ms). **Hot reload on save, keeping the playhead.**
- **`film:shots <project> t1 t2 …`** and **`--beats`** (auto-pick the end-of-entrance frame of every beat) → contact sheet PNG.
- **`film:render --range a b`** and **`--quality draft`**.
- **Versioned outputs** and `film:diff v3 v4` (side-by-side contact sheets at beat frames + metrics diff).
- **Structured logs** to `build/logs/` with timings per stage; a final `SUMMARY.md` after `film:all`.

---

# PART 11 — Typography & visual tokens

## 11.1 Font stack (all free, OFL; install via `@fontsource/*` or `@fontsource-variable/*`; never rely on system fonts)
| Role | Primary | Why | Alternatives |
|---|---|---|---|
| Display / headlines / numbers | **Bricolage Grotesque** 700/800 | characterful grotesque; stands out from default sans | **Geist**, **Inter Tight** (cleaner, more "lab-like"), **Manrope**, **Space Grotesk** |
| Accent word (1 per headline) | **Instrument Serif** *italic* 400 | high contrast, elegant, pairs with grotesque | **Fraunces** italic (soft, variable), **Newsreader** italic |
| UI copy inside mocks | **Inter** 500/600/700 | neutral, excellent small sizes | **Geist**, **IBM Plex Sans** |
| Labels / chips / code / URLs | **JetBrains Mono** 400/700 | tech credibility, tabular | **Geist Mono**, **IBM Plex Mono** |

Rules: **≤ 3 families per film** (display + accent + mono; UI can reuse display or Inter). Display tracking −0.03…−0.045 em; mono uppercase labels +0.08 em; line-height 1.02–1.08 for display; `font-variant-numeric: tabular-nums` on every number; `text-rendering: geometricPrecision`; `text-wrap: balance` for headlines.

## 11.2 Type scale @1080p (landscape)
Hero 128–176 px · Headline 88–112 px · Sub 44–56 px · Body/UI 28–36 px · Chip 24–30 px · Micro mono label ≥ 22 px (never < 22) · Captions 44 px. Portrait: multiply body/labels by ≥ 1.15.

## 11.3 Colour tokens (semantic; never decorative)
`paper #F2EDE2` · `ink #0E0F13` · `brand #2F4BFF` · `bad #F2432D` · `good #12A66B` (light-on-dark variants `#FF8E7D`, `#5FE0A8`). Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text — linter computes it from computed colours. Dark scenes use `#0E0F13` with light text `#F2EDE2`.
Chips: **1 px radius, light tinted fill (≈ 10–12 % alpha), 1.5 px tinted border**, uppercase mono, variants `b g r n` (light) and `rd gd` (dark). Bars: 1 px radius, tick scale, tolerance marker line.

---

# PART 12 — Work plan with gates (the agent must stop and report after each phase)

| Phase | Scope | Gate (evidence required) |
|---|---|---|
| **0** Audit & doctor | Part 3 | `AUDIT.md`, `doctor` PASS on my Windows machine, determinism hash match |
| **1** Robust core | paths, ffmpeg resolver, parallel render, 48 kHz, two-pass loudnorm, temp-rename, manifest/caching | Spectra renders end-to-end; timing table before/after; QA JSON |
| **2** Voice & timing | provider interface, Kokoro default, per-line cache, word-level alignment ladder | anchors with `method`, ±-error report vs. proportional baseline on 5 lines |
| **3** Layout & lint | slots, `fitText`, tabular-nums, linter + annotated PNGs, golden frames | lint fixtures: *bad* fails, *good* passes; Spectra lint report clean |
| **4** Archetypes & generality | archetype library, port **v4 Spectra** as reference, build **sample-saas** (different product) from template only via `project.json` | two finished MP4s + both lint-clean + storyboard contact sheets |
| **5** Motion pack | camera rig, SplitText, easing presets, drift/grain/vignette/glint, FLIP, optional motion blur | before/after contact sheets; motion-blur A/B on one wipe; render-time table |
| **6** Audio v2 | moods, stereo, sub-thump, room tone, optional music slot, mastering gate | LUFS/TP/LRA report; 48 kHz assertion; spectrogram PNG |
| **7** DX & exports | `film:dev`, `--range`, `--quality draft`, export presets (16:9, 1:1, 4:5, 9:16), poster/GIF, versioned outputs | screen capture or description of dev UI; exported files list; `film:diff` output |
| **8** Hardening | full test suite, docs, `CHANGELOG`, template README, CI-style `npm test` | all tests green, Windows + (if available) Linux logs, final acceptance run |

---

# PART 13 — Reporting format (after every phase)
```
PHASE N REPORT
- What changed (files)
- Commands run + key output (paste)
- Tests added/updated (names) + results
- Artifacts (paths): videos, PNGs, JSON
- Known issues / risks
- What I did NOT verify (be explicit)
- Next phase plan
```

---

# PART 14 — Testing & Definition of Done

## 14.1 Tests (all runnable with `npm test`)
- **Unit:** config schema validation (good/bad), caption/spoken normaliser, word alignment mapper, anchors writer, SRT/VTT writer, path resolution on Windows and POSIX styles, loudnorm JSON parser.
- **Determinism:** frame at t=17.3 rendered in two separate browser launches and with 1 vs N workers → identical SHA-256.
- **Integration:** 3-second dummy project (3 scenes) → frames = `fps*total`, `ffprobe` = H.264 1920×1080 30 fps, AAC 48 kHz, duration within ±1 frame of `TOTAL`.
- **Lint fixtures:** `overlap`, `clipped`, `offscreen`, `tight-padding`, `stacked-headers`, `stuck-wipe`, `early-visible` fixtures must **fail**; their fixed twins must **pass**.
- **Golden:** component sheet (chips, bars, tiles, headers) + 6 beat frames of `spectra` compared with `pixelmatch` (tolerance 0.1 %); update only with `--update-golden` and a reason.
- **Audio:** integrated loudness within ±0.5 LU of target, TP ≤ −1.0 dBFS, sidechain depth ≥ 4 dB under voice (measure SFX bus level with/without voice), no NaN/Inf, 48 kHz.
- **Sync:** for ≥ 10 events tagged with an anchor, animation start − word onset ∈ [−120 ms, −20 ms].
- **Motion energy:** no ≥ 1.2 s window with mean frame difference below ε unless tagged `hold`.
- **Cross-platform:** run `doctor` + integration test on Windows; POSIX if available.

## 14.2 Definition of Done (all must be true)
1. `node engine/cli.js all spectra` and `all sample-saas` finish on my Windows machine with zero manual steps beyond `npm i` / `pip install -r`.
2. Both videos are lint-clean, QA-clean (LUFS ±0.5, TP ≤ −1, 48 kHz, 0 black frames, 0 freeze > 1.2 s).
3. Changing one script line re-synthesizes **only** that line and the full build completes in < 3 min on my machine (report actual).
4. `film:dev` previews with sound and a scrubber; saving a file reloads in < 2 s.
5. A new product can be created with `Copy-Item projects\template projects\x`, editing only `project.json` (+ optional `brief.md`), and produces a coherent film.
6. No hardcoded absolute paths (grep proves it), no Spectra strings in `engine/` (grep proves it).
7. Docs updated: `PIPELINE_GUIDE.md`, `projects/template/README.md`, `CHANGELOG.md`.

---

# PART 15 — Story & script engine (so *any* product gets a good film)

**Brief → script flow** (an LLM or human writes it; the pipeline validates it):
1. `brief.md` answers: *Who is the viewer? What do they fear? What do they currently believe? What single picture proves otherwise? What single number proves it? What is the CTA/URL?*
2. Pick a **beat template** (default 6 beats): Hook → Pain → Contrast (the analogy) → Mechanism (3 steps) → Proof (one number) → CTA.
3. Write 11–15 lines. `film:validate-script` enforces:
   - ≤ 9 words per sentence (warn > 12), total speech 30–45 s (LinkedIn) / 15–25 s (X) at the chosen speed;
   - no jargon from `jargon.txt` in `spoken` (SAM, NCC, DOM, MCP, CI, LLM … configurable) — jargon allowed only in `caption`-adjacent micro-labels;
   - numbers written out in `spoken`, digits in `caption`;
   - each sentence has a *visual verb* mapped to an archetype action;
   - exactly one proof number; CTA line contains product name; last line repeats the tagline.
4. **Comprehension test (mandatory):** produce a 3-sentence plain-language summary from the **captions only**; a human who knows nothing about the product must be able to restate what it does. If not, rewrite (this exact test failed on the v3.3 cut: "good video, didn't catch the idea").
5. Keep **two cuts** from the same project: `cut: "builder"` (jargon-friendly) and `cut: "simple"` (plain language) — only the script and archetype params differ, never the component system.

**Rules for honest copy:** don't overclaim; tie every number to its exact measurement ("standard DOM check caught 1 of 18"); mark unverified claims in `brief.md` and keep them out of the film.

---

# PART 16 — Local environment (Windows-first) requirements
- Node ≥ 20, Python 3.10–3.12 (venv), `pip install numpy scipy sherpa-onnx==1.12.26 faster-whisper` (+ `edge-tts` optional). Pin `sherpa-onnx` — version 2.0.1 failed with "No lexicon available".
- Browser: Playwright Chromium (`npx playwright install chromium`) or system Chrome/Edge via `channel`.
- ffmpeg/ffprobe: resolver order `FFMPEG_PATH` → `ffmpeg-static` → PATH.
- Use `node:path`, `pathToFileURL`, `fs.rename` (not `mv`); avoid shell string concatenation; pass argv arrays to `spawn`.
- Long renders: show progress (fps, ETA), allow Ctrl-C and resume.
- Git-ignore: `node_modules`, `projects/*/build`, `engine/voice/models`, `out/`.
- Keep Windows path length in mind; use short build dir names.

---

# PART 17 — Things the agent must NOT do
- Do not reintroduce Remotion static-PNG "card" scenes as the primary visual language.
- Do not use stock footage, stock music, brand logos or artwork of other companies; no look-alike of any real brand.
- Do not paper over a failing check by loosening the check; fix the cause or document an exception with a reason.
- Do not delete user files; do not write outside the repo and `out/`.
- Do not claim audio sounds good — measure it and ask me to listen.
- Do not make visual changes when I ask for a script change (and vice-versa): "keep the script, fix the layout" means scripts/anchors stay byte-identical (the pipeline should assert this by comparing `anchors.json` hashes before/after).

---

# APPENDIX A — Parallel render sketch (verify & harden)
```js
// engine/render/render_engine.js
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { rename, writeFile } from 'node:fs/promises';
import os from 'node:os';

export async function render({ url, fps, total, outDir, ffmpeg, width = 1920, height = 1080,
  workers = Math.max(1, Math.min(6, os.cpus().length - 2)), motionBlur = null, crf = 18, preset = 'veryfast' }) {
  const frames = Math.round(total * fps), per = Math.ceil(frames / workers);
  const K = motionBlur?.k ?? 1, shutter = motionBlur?.shutter ?? 0;
  const jobs = [];
  for (let w = 0; w < workers; w++) {
    const a = w * per, b = Math.min(frames, (w + 1) * per);
    if (a < b) jobs.push(renderRange({ url, fps, a, b, w, outDir, ffmpeg, width, height, K, shutter, crf, preset }));
  }
  const parts = await Promise.all(jobs);
  const list = join(outDir, 'parts.txt');
  await writeFile(list, parts.map(p => `file '${p.replace(/\\/g, '/')}'`).join('\n'));
  const out = join(outDir, 'video_silent.tmp.mp4');
  await run(ffmpeg, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out]);
  await rename(out, join(outDir, 'video_silent.mp4'));
}

async function renderRange({ url, fps, a, b, w, outDir, ffmpeg, width, height, K, shutter, crf, preset }) {
  const browser = await chromium.launch({ args: ['--font-render-hinting=none', '--disable-lcd-text', '--force-color-profile=srgb'] });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(url); await page.evaluate(() => window.ready);
  const tmp = join(outDir, `part_${w}.tmp.mp4`), fin = join(outDir, `part_${w}.mp4`);
  const vf = K > 1 ? ['-vf', `tmix=frames=${K}:weights='${Array(K).fill(1).join(' ')}',select='eq(mod(n\\,${K})\\,${K - 1})',setpts=N/(${fps}*TB)`] : [];
  const ff = spawn(ffmpeg, ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps * K), '-c:v', 'mjpeg', '-i', '-', ...vf,
    '-c:v', 'libx264', '-crf', String(crf), '-preset', preset, '-pix_fmt', 'yuv420p', '-r', String(fps), '-movflags', '+faststart', tmp], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(res => ff.on('close', res));
  for (let i = a; i < b; i++) for (let j = 0; j < K; j++) {
    const t = Math.max(0, K === 1 ? i / fps : (i + shutter * ((j + .5) / K - .5)) / fps);
    await page.evaluate(async t => { await (window.seekAsync ? window.seekAsync(t) : window.seek(t)); }, t);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); const code = await done; await browser.close();
  if (code !== 0) throw new Error(`ffmpeg part ${w} failed (${code})`);
  await rename(tmp, fin); return fin;
}
const run = (cmd, args) => new Promise((res, rej) => spawn(cmd, args, { stdio: 'inherit' }).on('close', c => c === 0 ? res() : rej(new Error(cmd + ' exit ' + c))));
```

# APPENDIX B — `fitText` and tabular numbers (browser-side)
```js
export function fitText(el, maxW, { min = 22, max = 160 } = {}) {
  el.style.whiteSpace = 'nowrap'; el.style.display = 'inline-block';
  let lo = min, hi = max;
  while (hi - lo > .5) { const m = (lo + hi) / 2; el.style.fontSize = m + 'px'; (el.scrollWidth <= maxW) ? lo = m : hi = m; }
  el.style.fontSize = lo + 'px';
}
// CSS
// .num { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }
```

# APPENDIX C — Timing helpers contract (browser-side, unchanged names)
```js
const AN = ANCH.lines, st = k => AN[k].start, en = k => AN[k].end;
const W  = (k, w) => AN[k].start + AN[k].words.find(x => nrm(x[0]) === nrm(w))[1];
const WI = (k, i) => AN[k].start + AN[k].words[i][1];
const SS = k => AN[k].segs.filter(s => s[1] - s[0] >= .12);
const SSo = (k, i) => (SS(k)[i] || SS(k).at(-1))[0];
const SG = (k, i) => AN[k].start + SSo(k, i);
// every time-bearing call must be derived from these; sounds: ev('tap', t) next to the tween that causes them
```

# APPENDIX D — Quality bar checklist (use before showing me any video)
- [ ] Hook is readable as a still frame; first 1.5 s has a clear contrast/question.
- [ ] One idea on screen at a time; headline ≤ 8 words; one accent word.
- [ ] Only red = bad, green = good, blue = product; one chip system; 1 px radius.
- [ ] Lint clean; min font ≥ 24 px; clearance ≥ 24 px; nothing within 40 px of edges except full-bleed.
- [ ] No frozen segment > 1.2 s; every hold has drift.
- [ ] Every number on screen is spoken or captioned; every claim is tied to evidence.
- [ ] Audio: −14 ±0.5 LUFS, TP ≤ −1, 48 kHz; voice never masked; I listened or asked the human to.
- [ ] A non-expert can restate the product's value after one viewing.

*End of master prompt.*