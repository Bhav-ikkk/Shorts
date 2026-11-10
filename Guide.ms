# Code-Driven Motion-Design Video Pipeline
### How the Spectra videos (v2 → v4 "Simple") were made — reproducible by any coding agent

> Written by Claude, from the real project files. Every code block in Part C is copied verbatim from the files that produced the final video (`spectra-simple-v4.mp4`, 42 s, 1920×1080, 30 fps). Where something is a *method* I followed rather than a file, it is labelled as such. Where I cannot verify something, it says so (see §A.9).

---

## 0. The 60-second version

1. **There is no video editor, no AI video model, no stock footage, no stock music.** The video is a *web page* (HTML + CSS + inline SVG + GSAP timeline) that is *filmed frame by frame* by a headless browser.
2. **Voice first, picture second.** The script is turned into speech first. The speech is *measured* (start, end, pauses, word onsets). Every animation is then attached to those measured numbers. That is why picture and voice are frame-locked.
3. **Offline rendering, not screen recording.** The GSAP timeline is *paused*. For frame *i* the renderer calls `seek(i/30)`, takes a screenshot, pipes it into ffmpeg. Nothing is real-time, so nothing can stutter or drop frames. This is the "latency-free smoothness".
4. **Audio is synthesized with numpy**, not downloaded: Kokoro TTS voice → softening filter chain; SFX are sine/filtered-noise "instruments" triggered by an `EVENTS` list that the *same animation code* emits; the "background song" is a 5-chord sine pad written in code. Sidechain-ducked under the voice.
5. **The agent loop is the secret ingredient:** write → render a few frames → **look at the PNGs** → fix → repeat → full render → measure (loudness, black frames) → look at a contact sheet → deliver. Almost every quality gain in v3→v4 came from *looking at frames and listening to the user's feedback*, not from a clever prompt.
6. **Story rule:** one idea per scene, plain words, show the *problem* before the *product*, prove it with one number.

---

## PART A — How I think (the method, step by step)

### A.1 Read the brief as a *viewer problem*, not a feature list
Spectra's feature list (SAM 3.1 mask area, Pixel Template Match NCC, `.spectra/invariants.json`, MCP, CI…) is true but meaningless to most viewers. The first thing I do is rewrite the product as a **one-sentence story the viewer already feels**:

| Audience | The story I chose | Why |
|---|---|---|
| X / builders (v2) | "Your test says PASS. The button is hidden." | Developers feel false-green pain instantly; fast, punchy, ~19 s |
| LinkedIn (v3.x) | Same story, slower, lead with business stakes, explain *two checks agree* | Longer dwell time, muted autoplay → strong captions, 40 s |
| Non-technical (v4 "Simple") | "Everything said all good. But customers couldn't pay." → *list vs screen* → *say a rule* → *two eyes* → *18 buttons* | Feedback: "good video, didn't catch the idea". Removed jargon, added analogies |

**Lesson from v3.3 → v4:** "10/10 visual, 10/10 voice" can still fail on *comprehension*. Always test the cut on one non-expert and ask "what did it do?" before you consider it finished.

### A.2 The storyline template that worked (hook → pain → insight → mechanism → proof → CTA)

| Beat | Time (v4) | Voice line | Screen idea | Purpose |
|---|---|---|---|---|
| Hook | 0.25–3.6 | "Everything said: all good. But customers couldn't pay." | Big type, green ✓ flips to red ✕ on "couldn't"; checklist card says ALL PASSED | Contradiction = curiosity |
| Pain, made concrete | 3.9–6.3 | "A bar was covering part of the Pay button." | Phone/checkout mock zooms 2.7× to the covered button; red hatch + chip "Pay button covered" | Make the abstract bug visible |
| Why old way fails | 7.1–11.7 | "Normal checks just read a list of parts. They never see what customers see." | Two cards: *what the software reads* (all ✓) vs *what the customer sees* (covered) | **The analogy** (list vs screen) — this is the idea |
| Product in one line | 12.6–14.9 | "Spectra looks at the screen, like a person." | Eye icon, blue viewfinder corners, scan line | Name the solution only after the pain |
| Step 1 | 15.5–18.4 | "Say a rule: the Pay button must always be visible." | Mic, waveform, typewriter transcript → "RULE SAVED ✓" card | Shows the *input* is plain English |
| Step 2 | 19.0–25.2 | "Two different eyes look. Both must agree. 9.6% hidden. Rejected, with proof." | Split panel: EYE 1 (SAM 3.1) EYE 2 (pixel match), counters, gauge to 9.6 %, REJECTED chip | The mechanism, with real numbers |
| Step 3 | 25.6–29.1 | "Fix it. Check again. Zero hidden. Approved." | Cursor clicks "After fix" tab, scan sweeps, gauge drains, before/after split | Closed loop = trust |
| Proof | 30.1–34.8 | "18 hidden buttons. Normal checks caught one. Spectra caught all eighteen." | Two rows of 18 tiles flipping ✕/✓, big `1/18` vs `18/18` | One number a child can read |
| CTA | 35.9–40.6 | "Catch it before your customers do. Spectra. See what your customers see." | Kinetic headline → logo + URL typed in → small dev chips | Memorable line + where to go |

Duration rule I used: ~13 short sentences, 41.4 s of speech+pauses. ~2.5–3 words/second is "soothing"; X version was ~4 words/s and the user said it was too fast.

### A.3 Script-writing rules (what I actually did to the words)
1. **One claim per sentence, ≤ 9 words** where possible. Count syllables if it will be spoken.
2. **Ban jargon in the voice**; keep it only as *small secondary text on screen* (e.g. `SAM 3.1` in 18 px mono under "finds the shape").
3. **Spoken text ≠ caption text.** TTS reads "Nine point six percent hidden"; caption shows `9.6% hidden.` (see `gen4.py`, the 2nd/3rd tuple fields). Write numbers out for TTS.
4. **Pauses are part of the script** — the 4th tuple field is the pause after each line (0.3 s between related sentences, 0.9–1.1 s before a scene change). Those pauses are where the wipes/transitions live.
5. **Repeat the product's key phrase twice** — "what customers see" appears in L5, the headline, and the final tagline.
6. **Prefer verbs the picture can do:** *looks, say, fix, check, catch*. Each verb has a visual action.
7. **Don't overclaim.** "1 of 18" is specifically "standard DOM hit-test caught 1 of 18 occluded clips"; the wording says "normal checks". The covered strip was ~9.6% of the button, so copy says *part of* the Pay button, not "the whole button".

### A.4 Using a reference video (method)
*(The very first session's reference-analysis commands are no longer in the log I could re-read, so this is the method to follow, not a replay.)*

1. Extract frames: `ffmpeg -i ref.mp4 -vf "fps=2,scale=640:-1" ref_%03d.png`, then tile into a contact sheet and **view it** (agents that can read images should; others should use a vision model).
2. Write a **motion grammar** in plain words for each reference: pacing (cuts per second), what moves first, easing feel (snappy-in / slow-out), how text enters (masked slide-up vs fade), transitions (wipes with colored edge), camera moves (zoom into the detail), where hero numbers land.
3. **Copy the grammar, never the pixels or brand.** Translate it into your own palette, copy and layout.
4. Turn the grammar into reusable helpers (`hdr`, `pop`, `wipe`, `count`, `ring` in Part C) so every scene speaks the same motion language.
5. Remove everything that reads as "generic AI slop": floating cards bobbing up/down, gradient blobs, glassmorphism everywhere, centered sans headlines on dark purple. Replace with **a specific visual metaphor per scene** (a *list* card vs a *screen* card; a viewfinder; a gauge with a tolerance tick; 18 tiles).

### A.5 Visual language ("why the typography looks good")
**Color = meaning, never decoration** (this is also the "color psychology" answer):

| Token | Hex | Used only for |
|---|---|---|
| Paper | `#F2EDE2` | warm calm background (dot grid `radial-gradient` 30 px) |
| Ink | `#0E0F13` | text, dark scenes, wipes |
| Red | `#F2432D` | defect / rejected / covered — *nothing else* |
| Green | `#12A66B` (light text `#5FE0A8` on dark) | verified / approved — *nothing else* |
| Cobalt | `#2F4BFF` | Spectra / brand / "looking" |

**Type system (all free, npm `@fontsource`, OFL licensed):**
- **Bricolage Grotesque 700/800** — headlines, big numbers, tight tracking `-0.03em`.
- **Instrument Serif *italic*** — *one accent word per headline* (`couldn't`, `list`, `screen`, `customers`) at ~1.7× the size of the sans. The sans/serif contrast is what makes it look "designed".
- **Inter 500/600/700** — UI copy inside mock cards.
- **JetBrains Mono 400/700** — micro-labels (`SAM 3.1`, `PIXEL MATCH`), chips, URLs, with `letter-spacing:.08em` uppercase.
- Hero size 104–156 px at 1080p; captions 44 px; chips 22–28 px. Never more than ~8 words in a headline.

**Components:** chips = 1 px radius, light tinted fill + 1.5 px tinted border (red/green/blue/neutral variants `.ck.r/.g/.b/.n`); dark-scene variants `.rd/.gd`. Progress bars = 1 px radius, tick marks, one tolerance marker line. All timelines use the *same* chip/bar classes so the video feels like one product. **One component system across the whole video is the single biggest "not AI slop" lever** (user feedback in v3.3: "make all chips the same").

**Layout rules learned the hard way:** keep ≥ 40 px between any two text blocks; never let two badges share a bounding box (v3.1 fix); give every label a fixed box and shrink the *font*, not the content, if it touches an edge (the REJECTED chip fix in v4); verify at the densest frame, not the first.

### A.6 Motion language (the "feel")
- **Entrances:** `power4.out` 0.45–0.6 s (fast start, long settle) — cards, panels, headlines.
- **Pops (chips, icons):** `back.out(2.2)` 0.35–0.4 s from `scale 0` — satisfying overshoot.
- **Headline swaps:** header slides/scales from 1.1→1 with 10 px rise in 0.22 s (`hdr()`), previous header hard-`set` to hidden at the same instant — one idea on screen at a time.
- **Camera:** animate a wrapper's `scale/x/y` with `power3.inOut` (`#zin` zooms 1→1.8→2 into the button, then back out). Zooming into the evidence is the cheapest way to look "directed".
- **Impact beats:** on the word "couldn't": scale-in from 2.1×, red flash (4 × 0.06 s yoyo), 14 px horizontal shake (6 × 0.045 s), deep thud SFX. Same trick on REJECTED (panel shake 7 px + red pulse ring + impact).
- **Counting numbers:** tween a plain object and write text each tick (`count()`); 15,759 px, 90.00 %, gauge 9.60 %.
- **Typewriter:** tween a char index; `ticks` SFX one per ~40 ms.
- **Transitions:** a full-screen ink slab sweeps across with a 40 px colored leading edge (`wipe()`), 0.30 s in / 0.34 s out, with a whoosh. Only between *chapters*; inside a chapter use fades.
- **Stagger:** tiles 35 ms apart, list rows 400 ms apart (tied to speech), Spectra row slower (75 ms) than the failing row (48 ms) so the eye reads "careful vs sloppy".
- **Holds:** after each payoff, leave 0.4–1.0 s of stillness (the pause in the script). Soothing = *space*, not slowness everywhere.

### A.7 Audio design (what the sound is and where it comes from)
Nothing is downloaded. Everything is generated in `audio4.py`:

| Layer | Source | Notes |
|---|---|---|
| Voice | **Kokoro v0.19** open-weights TTS, run on CPU through **sherpa-onnx 1.12.26**, voice `am_michael` (sid 6), speed 1.02 | Model obtained from the sherpa-onnx GitHub release assets (Hugging Face was blocked in my sandbox). sherpa-onnx 2.0.1 was broken ("No lexicon available") → pinned 1.12.26 |
| Voice softening | `soften.new_chain` | HP 70 Hz → de-esser (4.5–9.5 kHz) → −27 % shelf above 3.2 kHz → LP 9.5 kHz → +26 % low shelf < 190 Hz → slow RMS leveller (no saturation) → 7 % light room reverb. Measured: spectral centroid ~960→~650 Hz, 3–10 kHz energy −3 dB, sibilance −4 dB |
| UI SFX | additive sine / filtered noise "instruments" (`tap, pop, click, thud, impact, whoosh, swell, ticks, chime`) | soft attacks, low-mid only, lowpassed 3.6 kHz, 25 % room reverb on the bus |
| "Background song" | **Not a song and not a sample.** A 5-note sine pad (+2nd harmonic, slight detune and vibrato) cross-fading through chords **Am → F → C → G → C** at 0 / 10.5 / 21 / 31.5 / 38 s, lowpassed 1.4 kHz, level ~0.1 | Royalty-free by construction; resolves to C major on the logo |
| Mix | voice 1.0 · SFX 0.42 · pad 1.0 (already quiet) | **Sidechain ducking:** SFX −50 %, pad −35 % whenever the voice envelope is up |
| Master | ffmpeg `loudnorm=I=-14:TP=-1.5:LRA=7`, AAC 192k, 1.1 s fade-out at 40.9 s | Result: −14.6 LUFS integrated, −1.3 dBFS peak, LRA 3.0 |

**SFX are triggered from the animation code.** Each animation call also does `ev('pop', t)` etc. `dump4.js` loads the page and dumps `window.EVENTS` to `events.json`; `audio4.py` renders them. So **if you move a visual, its sound moves with it**, and v4 has 86 events (tap 28, pop 15, whoosh 13, ticks 8, chime 8, swell 5, impact 4, click 3, thud 2).

**Honest limit:** I cannot listen. Voice softness and mix are verified by *measurements* (spectral centroid, sibilance band energy, LUFS/peak), plus the user's ears across 4 iterations ("too hard and AI" → softened chain → "soothing and great"). Treat any new voice/mix as unverified until a human listens.

### A.8 Why it is "latency-free smooth" — the actual technical reasons
1. **Deterministic seek-render.** `tl.time(t,false)` evaluates the whole timeline at an exact time. Frame *i* is always identical, independent of CPU speed. Screen-recording a live page would stutter; this cannot.
2. **Constant frame grid.** 30 fps exactly; `ffmpeg -framerate 30 … -r 30`; `yuv420p` for compatibility; `+faststart`.
3. **GPU-friendly properties only.** Animate `transform`, `opacity` (via `autoAlpha`), `clip-path`; avoid animating `top/left/width` in hot paths.
4. **Single source of timing.** `anchors.js` (from the measured voice) is the only clock. No hand-typed timestamps for anything voice-related.
5. **State changes use `tl.set`, not `tl.call`**, so seeking forward/backward or screenshotting any frame out of order is always correct (this is how I could screenshot t=24.9 without playing from 0).
6. **`immediateRender:false`** on any later `fromTo` for an element that already has an earlier tween — otherwise its start state appears at t=0.
7. **No `!important` on states GSAP changes** (it blocked tab highlight changes in v3.2).
8. **Fonts are awaited before frame 0** (`document.fonts.load` for every face) — otherwise frame 1 renders in a fallback font.
9. **Encode once.** JPEG q92 screenshots piped straight to libx264 CRF 18 `-preset veryfast`; audio muxed afterwards with `-c:v copy` (no second video encode).
10. **Temp-name-then-rename** so a stopped render never leaves a playable-but-truncated file.

### A.9 What I can and cannot vouch for
- **Verified from files/measurements:** everything in Part C; durations; loudness/peak; zero black frames (`blackdetect`); rendered frames viewed at every scene.
- **Not verified:** how any voice/mix *sounds*; the optional "HOL asked to integrate Spectra" line in post copy (user-reported, unconfirmed); the Muse Spark benchmark rows from earlier cuts (removed from v4 because I couldn't verify them); the first-session reference-video analysis details (method given instead).
- **Credit:** the post-copy line "Video made with help from Claude (Anthropic)" is the user's choice; I did not burn any Anthropic branding into the video.

---

## PART B — The harness: what tools do the work (and why the loop matters)

### B.1 Environment (everything free)
- Linux sandbox with **Node**, **Python 3**, **ffmpeg 6.1**, **Chromium + Playwright 1.63** (pre-installed).
- npm: `gsap@3.12.5`, `lottie-web@5.12.2`, `@fontsource/{bricolage-grotesque,instrument-serif,inter,jetbrains-mono,space-grotesk}`.
- pip: `numpy`, `scipy`, `sherpa-onnx==1.12.26` (`--break-system-packages` in the sandbox).
- Network was allow-listed (PyPI, npm, GitHub release assets OK; Hugging Face blocked). **Design every dependency to come from npm/PyPI/GitHub releases** and the pipeline works in locked-down environments.

### B.2 Agent tool calls (what kinds, and for what)
| Tool | Used for |
|---|---|
| **Skill** (`video-making`) | Loaded the video-rendering guidance: draw a few full-size frames at the busiest moments *before* the first full render; one encoded file per scene is the safe option; write to temp name and rename; JPEG q92 for page capture; changed audio only → `-c:v copy` |
| **TaskCreate / TaskUpdate** | Visible checklist: script → voice → page → frames check → render → audio → QA → deliver. Last item is always *check the work* |
| **Write / Edit / Read** | Author `index*.html`, CSS, JS, Python; `Edit` for surgical fixes; **`Read` on PNG screenshots to actually see frames** |
| **Bash** | `npm i`, `pip install`, run TTS, `node render.js`, `ffmpeg` mux, `ffprobe`, `blackdetect`, `ebur128`, contact sheets (PIL) |
| **Grep** | find class names / timing variables when patching |
| **SendUserFile** | deliver `.mp4` + `.srt` |
| (no sub-agents needed) | The work is sequential: each step depends on the previous measurement |

### B.3 The loop (this is what the failed attempts in other editors most likely lack)
```
write script ──► TTS ──► measure anchors.json ──► write page (timeline hangs off anchors)
      ▲                                                        │
      │                                                        ▼
 user feedback ◄── deliver ◄── QA ◄── mux audio ◄── render ◄── screenshot densest frames & LOOK
                                  (ffprobe, blackdetect,         (fix overlaps/clipping, re-shoot)
                                   ebur128, contact sheet)
```
Typical micro-iteration (v4): build → `node shots4.js 24.9` → view PNG → spot REJECTED chip touching the panel edge → add one CSS line → rebuild → re-shoot → only then run the 2-minute full render. **One full render per verified fix**, not per guess.

Hypothesis (not proven): editors that only emit code and never render+inspect their own frames cannot catch overlaps, clipped text, early-visible states or mistimed beats — which is exactly what 80 % of my fixes were.

### B.4 Version history = the lesson list
| Ver | User feedback | Fix | Rule extracted |
|---|---|---|---|
| v1→v2 | "looks a little AI-generated; add voice; do a critique" | semantic palette, serif accent words, voiceover, self-critique pass | design with meaning, not decoration |
| v3 | "too fast; background sound too high; didn't get the core idea; 30–45 s is ok" | slower voice (speed 1.02), 41 s, SFX redesign soft, pad quiet, ducking, explain mechanism | pace for comprehension; SFX never compete with voice |
| v3.1 | "badges overlap, not clean" | non-overlapping layout in referee scene | one box per element; test the densest frame |
| v3.2 | "SAM/NCC card cut and overlapping; chips radius 1 + light skin" | spacing + chip system | unify components |
| v3.3 | "same chips everywhere; better progress bars; voice too hard/AI" | bars redesigned, voice chain rebuilt (de-ess, shelf, warmth, room) | fix the *root* (voice spectrum), not the volume |
| v4 | "sister (non-tech) didn't catch the idea" | rewrote script and visuals: list vs screen, two eyes, 18 tiles | test with a non-expert; analogy beats accuracy |

---

## PART C — Reproduce it: files, commands, full source

### C.1 Project layout
```
spectra-video/
  package.json                  (gsap, lottie-web, @fontsource/*)
  node_modules/
  v4/
    body4.html                  scene markup
    css4.css                    v4 overrides on top of the base CSS
    script_head.js              helpers + key-time constants from anchors
    script_tail.js              all choreography + captions
    build4.py                   concatenates base CSS/helpers + v4 parts -> index4.html
    anchors.js                  (generated) window.ANCH from the measured voice
    events.json                 (generated) SFX events dumped from the page
  index4.html                   (generated) the whole video as one page
  index3.html                   base CSS + app-mock + lottie-ring helper source used by build4.py
  render4.js                    frame-by-frame capture -> ffmpeg
  shots4.js                     screenshot arbitrary times (for QA)
  dump4.js                      dump EVENTS + anchors
  audio4.py                     mix voice + SFX + pad, write .srt
/home/claude/vo4/gen4.py        TTS + anchor measurement (writes L1..L13.wav, anchors.json, v4/anchors.js)
/home/claude/vo3/soften.py      voice softening chain
```
`/home/claude/vo/model/kokoro-en-v0_19/` holds `model.onnx, voices.bin, tokens.txt, espeak-ng-data/` from the sherpa-onnx Kokoro release.

### C.2 Run order (exact commands)
```bash
# 0. deps
cd spectra-video && npm i gsap@3.12.5 lottie-web@5.12.2 @fontsource/bricolage-grotesque @fontsource/instrument-serif @fontsource/inter @fontsource/jetbrains-mono @fontsource/space-grotesk
pip install --break-system-packages numpy scipy sherpa-onnx==1.12.26
# 1. voice + measured anchors  (writes v4/anchors.js)
cd /home/claude/vo4 && python3 gen4.py 1.02
# 2. build the page
cd /home/claude/spectra-video && python3 v4/build4.py
# 3. LOOK at the busiest frames (view the PNGs!)
node shots4.js 3.0 10.8 24.9 34.9 39.9
# 4. dump SFX events, mix audio, write srt
node dump4.js && python3 audio4.py
# 5. render silent video (~2 min for 1260 frames)
node render4.js
# 6. mux + loudness + fade
ffmpeg -y -i video4_silent.mp4 -i mix4.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k \
  -af "loudnorm=I=-14:TP=-1.5:LRA=7,afade=t=out:st=40.9:d=1.1" -shortest -movflags +faststart out/spectra-simple-v4.mp4
# 7. QA
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate -of compact out/spectra-simple-v4.mp4
ffmpeg -hide_banner -nostats -i out/spectra-simple-v4.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
ffmpeg -hide_banner -nostats -i out/spectra-simple-v4.mp4 -vf blackdetect=d=0.2:pix_th=0.05 -an -f null - 2>&1 | grep -c black_start
```
Note: `build4.py` currently reads CSS and helpers from `index3.html`; that file is included in the zip. For a new project, copy the CSS base and the `appHTML`/`ringJSON`/`mkRing` helpers into your own template and drop that dependency.

### C.3 Timing contract (the thing every agent must reproduce)
`gen4.py` writes for each line `Lk`: `start, dur, end, segs (energy segments = phrase onsets), words (relative onset per word), gap`. The page exposes helpers:

- `st(k)`, `en(k)` — line start / end
- `W(k,'word')`, `WI(k,i)` — onset of a word (proportional by letter count, sentence-aware when segment count matches sentence count)
- `SS(k)`, `SSo(k,i)`, `SG(k,i)` — i-th phrase segment (≥ 0.12 s), its relative onset, and its absolute time

**Rule:** a visual that illustrates a spoken word is placed at `W(...)`/`SG(...)` *minus 0.05–0.10 s* (eye reads before ear), never at a hand-typed number.

Beat table (from the measured v4 voice): L1 0.25–1.84 · L2 2.14–3.57 · L3 3.92–6.25 · L4 7.15–9.58 · L5 9.88–11.75 · L6 12.65–14.93 · L7 15.48–18.44 · L8 19.04–21.57 · L9 22.02–25.25 · L10 25.65–29.15 · L11 30.15–34.84 · L12 35.94–37.68 · L13 38.18–40.60 · total 41.4 s speech timeline → 42.0 s video (1.4 s tail).

### C.4 Generic prompt you can give your coding agent (anti-gravity)
> Build a deterministic, code-driven motion-design video pipeline for a SaaS product. Requirements:
> 1. **Inputs:** `brief.md` (product, audience, platform, 3 proof points), optional reference-video frames. **Output:** 1920×1080/30 fps MP4 + SRT.
> 2. **Step 1 – Story:** write a hook→pain→insight→mechanism→proof→CTA script of ≤ 13 sentences, ≤ 9 words each, plain language, jargon only as small on-screen secondary text. Output `script.json` with fields `id, spoken, caption, pause_after`.
> 3. **Step 2 – Voice:** synthesize each line with Kokoro (sherpa-onnx 1.12.26, CPU), trim silence, measure `start/dur/end/segments/word onsets`, write `anchors.js`.
> 4. **Step 3 – Page:** one HTML page, 1920×1080, GSAP paused timeline, `window.seek(t)`, `window.ready` (fonts loaded). All timings derive from `anchors.js`. Use a single component system and the semantic palette. Use only `transform/opacity/clip-path` animation. Use `tl.set` for state changes and `immediateRender:false` on later `fromTo`.
> 5. **Step 4 – Events:** every animation call also emits a sound event; dump `EVENTS` via Playwright.
> 6. **Step 5 – Audio:** numpy-synthesized soft SFX + chord-pad + softened voice chain + sidechain duck; loudnorm to −14 LUFS; write SRT.
> 7. **Step 6 – Render:** Playwright seek → JPEG q92 screenshot → ffmpeg image2pipe → libx264 CRF 18 veryfast yuv420p; temp-name-then-rename; mux audio with `-c:v copy`.
> 8. **Step 7 – QA gate (must pass before delivery):** screenshot the 6 busiest frames and *inspect them visually* for overlap/clipping; `ffprobe` specs; `blackdetect` = 0; `ebur128` I≈−14 LUFS, TP ≤ −1; contact sheet reviewed.
> 9. **Step 8 – Comprehension test:** produce a 3-sentence plain-language summary of what the video says; if a non-expert could not repeat the product's value from it, rewrite the script.
> Use only free tools. No stock footage/music. Never reproduce a third party's brand or artwork.

### C.5 Reuse checklist for a *new* product
1. Fill the 5 questions: *Who is the viewer? What do they fear? What do they currently believe? What is the one picture that proves otherwise? What single number proves it?*
2. Write the 13-line script; read aloud; cut every word you wouldn't say to a friend.
3. Choose **one metaphor** for the mechanism (list vs screen, two eyes) and **one proof visual** (18 tiles).
4. Pick the 3 semantic colors for *bad / good / brand*. Keep paper + ink.
5. Generate voice → anchors → build scenes → shoot busiest frames → fix → render → audio → QA → test on a non-expert.
6. Keep the tech cut and the simple cut as two versions of the same pipeline (script file differs, components identical).

### C.6 Common failure modes (and the line that fixes each)
| Symptom | Cause | Fix |
|---|---|---|
| Element visible at t=0 before its entrance | later `fromTo` renders start state immediately | `immediateRender:false` |
| Tab/state won't change | CSS `!important` beats GSAP inline | remove `!important` |
| Screen covered by a black slab | unused `.wipe` left at `x=0` | delete unused wipes or start at `x:-1970` |
| Stat number clipped on the right | absolute `left` too large | shrink tiles, move `left` |
| Chip text touches container edge | fixed font too large | reduce font-size/padding on that class |
| Frame 1 uses wrong font | fonts not loaded | `await window.ready` before the first screenshot |
| Voice harsh / "AI" | tanh saturation + bright 3–8 kHz | `soften.new_chain` |
| TTS crash "No lexicon available" | sherpa-onnx 2.0.1 | pin `sherpa-onnx==1.12.26` |
| `np.add` shape mismatch in SFX | tone lengths differ (1.2 vs 1.3 s) | make partial lengths equal |
| Wrong picture timing after edit | hand-typed timestamps | derive from `anchors.js` helpers |

---

## PART D — SVG, Lottie and other visual assets (exactly what is in v4)

- **All SVG is hand-written inline** (no icon pack, no downloads):
  - *Spectra logo / eye icon:* two concentric circles (r 104, r 68), four 40-unit tick marks (N/E/S/W), filled cobalt centre dot r 26; `stroke-width` 13–15, round caps (`#logoIc`, `#eyeIc`).
  - *Microphone:* rounded-rect capsule + arc + stand (`#mic`).
  - *Arrow:* chevron line (`#arrow`), *shield + check* for "RULE SAVED", *✓ / ✕* paths inside the hook circle.
  - *Cursor:* polygon path with white stroke (`#cursor`).
  - *Viewfinder:* four CSS corner brackets (`#vf i`).
  - *Waveform:* 14 `<i>` bars whose heights are driven by a sine function of progress.
- **Lottie:** two *procedurally generated* shockwave rings (function `ringJSON` builds the Lottie JSON in code: two ellipse strokes, scale 14→100 %, opacity 80→0 over 26 frames). `mkRing` loads it with `lottie-web`'s SVG renderer, paused; the GSAP timeline scrubs it with `goToAndStop(frame,true)` — so Lottie is frame-exact too. (No `.lottie` files were downloaded for v4.)
- **App mock** (`appHTML(repaired)`): a fake dark checkout page built from divs; `repaired=false` includes the covering `.a-occ` "Quick Pay" bar, `true` omits it. The same function feeds 4 places: hook phone, S2 cropped view, S3c "Before fix", "After fix".
- **Hatch/strip overlays:** `repeating-linear-gradient(45deg…)` for the red "covered" hatch and the candy-stripe edge.

---

## PART E — Complete source (verbatim from the final build)

The following appendices are the real files. A coding agent can paste them into the layout above.

#### E.1 `gen4.py` — script → voice → measured anchors

```python
import sys, json, re, numpy as np, sherpa_onnx
from scipy.io import wavfile
M='/home/claude/vo/model/kokoro-en-v0_19'
cfg=sherpa_onnx.OfflineTtsConfig(model=sherpa_onnx.OfflineTtsModelConfig(
    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(model=f'{M}/model.onnx',voices=f'{M}/voices.bin',tokens=f'{M}/tokens.txt',data_dir=f'{M}/espeak-ng-data'),
    num_threads=4,provider='cpu'),max_num_sentences=1)
tts=sherpa_onnx.OfflineTts(cfg)
SID=6; SPEED=float(sys.argv[1]) if len(sys.argv)>1 else 1.0
# id: (spoken text for TTS, caption/word text, pause after in seconds)
L=[('L1',"Everything said: all good.","Everything said: all good.",.30),
   ('L2',"But customers couldn't pay.","But customers couldn't pay.",.35),
   ('L3',"A bar was covering part of the pay button.","A bar was covering part of the Pay button.",.90),
   ('L4',"Normal checks just read a list of parts.","Normal checks just read a list of parts.",.30),
   ('L5',"They never see what customers see.","They never see what customers see.",.90),
   ('L6',"Spectra looks at the screen, like a person.","Spectra looks at the screen, like a person.",.55),
   ('L7',"Say a rule: the pay button must always be visible.","Say a rule: the Pay button must always be visible.",.60),
   ('L8',"Two different eyes look. Both must agree.","Two different eyes look. Both must agree.",.45),
   ('L9',"Nine point six percent hidden. Rejected, with proof.","9.6% hidden. Rejected, with proof.",.40),
   ('L10',"Fix it. Check again. Zero hidden. Approved.","Fix it. Check again. Zero hidden. Approved.",1.00),
   ('L11',"Eighteen hidden buttons. Normal checks caught one. Spectra caught all eighteen.","18 hidden buttons. Normal checks caught one. Spectra caught all 18.",1.10),
   ('L12',"Catch it before your customers do.","Catch it before your customers do.",.50),
   ('L13',"Spectra. See what your customers see.","Spectra. See what your customers see.",.80)]
out={}; t=.25
for k,spoken,cap,gap in L:
    a=tts.generate(spoken,sid=SID,speed=SPEED)
    s=np.array(a.samples,dtype=np.float32); sr=a.sample_rate
    idx=np.where(np.abs(s)>.012)[0]; s=s[max(0,idx[0]-int(.02*sr)):idx[-1]+int(.06*sr)]
    wavfile.write(f'{k}.wav',sr,s); d=len(s)/sr
    # energy segments
    w=int(.01*sr); n=len(s)//w; e=np.sqrt((s[:n*w].reshape(n,w)**2).mean(1)); on=e>max(.02*e.max(),.004)
    segs=[];i=0
    while i<n:
        if on[i]:
            j=i
            while j<n and (on[j] or (j+1<n and on[j+1:j+8].any())): j+=1
            segs.append([i*.01,j*.01]); i=j
        else: i+=1
    # word onsets (proportional; sentence-aware when segments match sentences)
    sents=[x for x in re.split(r'(?<=[.?!])\s+',cap) if x]
    words=[]; 
    def prop(sent_words,a0,a1):
        lets=[max(1,len(re.sub(r'[^A-Za-z0-9%]','',w_))) for w_ in sent_words]; tot=sum(lets); c=0
        for w_,l_ in zip(sent_words,lets):
            words.append((w_, round(a0+(a1-a0)*(c/tot),3))); c+=l_
    if len(segs)==len(sents) and len(sents)>1:
        for sent,(a0,a1) in zip(sents,segs): prop(sent.split(),a0,a1)
    else:
        prop(cap.split(),0.02,d-.1)
    out[k]=dict(text=cap,start=round(t,3),dur=round(d,3),end=round(t+d,3),segs=segs,words=words,gap=gap)
    t=t+d+gap
total=round(t,2)
json.dump(dict(lines=out,total=total),open('anchors.json','w'),indent=1)
open('/home/claude/spectra-video/v4/anchors.js','w').write('window.ANCH='+json.dumps(dict(lines=out,total=total))+';')
print('speed',SPEED,'total',total)
for k,v in out.items(): print(k,v['start'],'->',v['end'],f"dur {v['dur']}",'segs',len(v['segs']),[(w,o) for w,o in v['words']][:0], [[round(a,2),round(b,2)] for a,b in v['segs']])
```

#### E.2 `soften.py` — voice softening chain

```python
"""Soften the Kokoro voice: no saturation, de-ess, tame 3-8k, add warmth, tiny room."""
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile
SR = 44100
def lp(x, fc, o=2): b, a = butter(o, fc/(SR/2), 'low'); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc/(SR/2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo/(SR/2), hi/(SR/2)], 'band'); return lfilter(b, a, x)

def load(path):
    sr, s = wavfile.read(path); s = s.astype(np.float32)
    if np.abs(s).max() > 2: s = s/32768.0
    return resample_poly(s, 147, 80)

def old_chain(s):
    s = hp(s, 80); s = np.tanh(s*1.8)/np.tanh(1.8); return s/np.abs(s).max()*.9

def deess(s, lo=4500, hi=9500, thr=.035, ratio=.55):
    band = bp(s, lo, hi); env = lp(np.abs(band), 60, 1)
    over = np.clip(env/thr - 1, 0, 3); g = 1/(1 + ratio*over*3)
    g = lp(g, 120, 1)
    return s - (1 - g)*band

def room(s, wet=.07, t60=.5):
    rng = np.random.default_rng(5); n = int(SR*t60)
    ir = rng.standard_normal(n)*np.exp(-np.arange(n)/SR*7.0/t60*1.0); ir = lp(ir, 3000)
    ir[:int(.012*SR)] *= np.linspace(0, 1, int(.012*SR)); ir /= np.sqrt((ir**2).sum())
    r = fftconvolve(s, ir)[:len(s)]
    return s*(1 - wet*.5) + r*wet*1.1

def new_chain(s):
    s = hp(s, 70)
    s = deess(s)
    hi = s - lp(s, 3200, 2); s = s - .27*hi                  # gentle high shelf, about -4 dB above 3.2k
    s = lp(s, 9500, 2)                                        # no brittle air
    s = s + .26*lp(s, 190, 2)                                 # warmth, about +3 dB low shelf
    # gentle dynamics: slow RMS leveller instead of tanh clipping
    env = lp(np.abs(s), 6, 1) + 1e-4; tgt = .11; g = np.clip((tgt/env)**.35, .6, 1.6); s = s*lp(g, 4, 1)
    s = room(s)
    return s/np.abs(s).max()*.9

def metrics(s):
    x = s[np.abs(s) > .02*np.abs(s).max()]
    X = np.abs(np.fft.rfft(x*np.hanning(len(x))))**2; f = np.fft.rfftfreq(len(x), 1/SR)
    cen = (f*X).sum()/X.sum(); hf = X[(f >= 3000) & (f < 10000)].sum()/X.sum(); sib = X[(f >= 5000) & (f < 10000)].sum()/X.sum()
    return round(cen), round(10*np.log10(hf+1e-12), 1), round(10*np.log10(sib+1e-12), 1), round(20*np.log10(np.abs(s).max()/np.sqrt((s**2).mean())), 1)

if __name__ == '__main__':
    import sys
    for k in ['L2', 'L6', 'L8', 'L11']:
        s = load(f'/home/claude/vo3/{k}.wav')
        print(k, 'OLD centroid/HF3-10k dB/sib5-10k dB/crest', metrics(old_chain(s)), '| NEW', metrics(new_chain(s)))
```

#### E.3 `audio4.py` — SFX, pad, ducking, mix, SRT

```python
"""v3 (LinkedIn) mix: calm, soft, soothing.
- every SFX is a low-mid sine/filtered-noise voice, lowpassed, with soft attacks (no buzz, no bright bells, no clicks)
- slow warm pad with a gentle chord progression
- room reverb on the sound bus, sidechain ducking under the voice
"""
import json, sys
sys.path.insert(0, '/home/claude/vo3')
import soften
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile

SR = 44100
ev = json.load(open('/home/claude/spectra-video/v4/events.json'))
DUR = ev['total']
N = int(SR * DUR)
rng = np.random.default_rng(23)
anch = json.load(open('/home/claude/vo4/anchors.json'))['lines']

def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def soft_env(t, att=.012, dec=8.0):
    return (1 - np.exp(-t / att)) * np.exp(-t * dec)
def add(buf, t, sig, amp=1.0):
    i = int(t * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig)); buf[i:j] += sig[: j - i] * amp

# ---------------- voice ----------------
vo = np.zeros(N)
vo_len = {}
for k in anch:
    sr, s = wavfile.read(f'/home/claude/vo4/{k}.wav')
    s = s.astype(np.float32)
    if np.abs(s).max() > 2: s = s / 32768.0
    s = soften.new_chain(resample_poly(s, 147, 80))   # soft voice: de-ess, gentler highs, warmth, light room
    fi = int(.015 * SR); s[:fi] *= np.linspace(0, 1, fi); s[-fi:] *= np.linspace(1, 0, fi)
    add(vo, anch[k]['start'], s); vo_len[k] = len(s) / SR

# ---------------- soft SFX voices ----------------
def tone(f, d, a=.3, att=.02, dec=5.0, harm=((1, 1), (2, .12))):
    t = tt(d); s = sum(g * np.sin(2 * np.pi * f * h * t) for h, g in harm)
    return s * soft_env(t, att, dec) * a
def tap(a=.22):                      # soft wooden "tick": low sine, slow-ish attack
    return tone(520, .09, a, .004, 38, ((1, 1), (2.4, .1)))
def pop(a=.28):                      # round "bloop" rising a little
    t = tt(.2); f = 330 + 190 * (1 - np.exp(-t * 22)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * soft_env(t, .01, 15) * a
def click(a=.14):                    # muted press
    return lp(tone(380, .07, a, .003, 45, ((1, 1), (3, .05))), 1500)
def thud(a=.55, f0=105, f1=48, d=.9):
    t = tt(d); f = f1 + (f0 - f1) * np.exp(-t * 14); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * soft_env(t, .006, 5.2) * a
def impact(a=.4):                    # the "didn't" / big beats: deep soft boom + warm fifth, no buzz
    return thud(a, 96, 42, 1.3) + tone(130.8, 1.3, a * .22, .02, 3.6) + tone(196, 1.3, a * .1, .03, 4)
def whoosh(a=.5, d=.75, rev=False, hi=1800):
    t = tt(d); n = rng.standard_normal(len(t)); n = lp(n, hi, 2); n = hp(n, 150, 1)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2
    if rev: env = env[::-1] * np.clip(t / .05, 0, 1)
    return n * env * a * .55
def swell(d=.8, a=.22, down=False):
    t = tt(d); u = t / d
    f = (200 + 160 * u) if not down else (360 - 160 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR; env = np.sin(np.pi * u) ** 1.8
    return (np.sin(ph) + .3 * np.sin(2 * ph)) * env * a
def chime(f, a=.2, d=2.2):           # soft glassy-but-warm bell: low partials only, slow decay
    t = tt(d); s = np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * f * 2.0 * t) + .08 * np.sin(2 * np.pi * f * 3.0 * t)
    return lp(s * soft_env(t, .012, 2.4) * a, 3200)

CH = [392.00, 523.25, 659.25, 783.99]   # G4 C5 E5 G5 (pentatonic, consonant)
fx = np.zeros(N)
nchime = 0
for name, t, o in ev['events']:
    a = o.get('a', 1)
    if name == 'tap':      add(fx, t, tap())
    elif name == 'click':  add(fx, t, click())
    elif name == 'pop':    add(fx, t, pop())
    elif name == 'thud':   add(fx, t, thud(.45 * (a / .4 if a else 1) * .6))
    elif name == 'impact': add(fx, t, impact())
    elif name == 'whoosh': add(fx, t, whoosh(.5 * a, .8 if a >= .5 else .6, bool(o.get('rev'))))
    elif name == 'swell':  add(fx, t, swell(o.get('d', .8), .2, bool(o.get('down'))))
    elif name == 'ticks':
        for i in range(int(o['n'])):
            add(fx, t + i * o['dt'], tone(420 + (i % 7) * 38, .06, min(.16, o.get('a', .06) * 2.2), .004, 55, ((1, 1),)))
    elif name == 'chime':
        add(fx, t, chime(CH[min(nchime, 3)] if nchime < 3 else CH[1], .2)); add(fx, t + .09, chime(CH[min(nchime + 1, 3)], .13))
        nchime += 1
# final resolving chord (C major, soft) under the logo / URL
tend = ev['events'][-1][1]
for k, f in enumerate((261.63, 392.0, 523.25)): add(fx, tend + .02 + k * .12, chime(f, .16, 3.2))

# room reverb on the whole SFX bus (soft, 25% wet)
ir_t = tt(1.4); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.6); ir = lp(ir, 2600); ir /= np.abs(ir).sum() * .12
fx = fx * .78 + fftconvolve(fx, ir)[:N] * .5
fx = lp(fx, 3600, 2)

# ---------------- warm pad ----------------
t = np.arange(N) / SR
chords = [  # (start, notes)
    (0.0,  [110.0, 164.81, 220.0, 261.63, 329.63]),    # Am
    (10.5, [87.31, 130.81, 174.61, 220.0, 261.63]),    # F
    (21.0, [130.81, 196.0, 261.63, 329.63, 392.0]),    # C
    (31.5, [98.0, 146.83, 196.0, 246.94, 293.66]),     # G
    (38.0, [130.81, 196.0, 261.63, 329.63, 392.0]),    # C (home)
]
pad = np.zeros(N)
for ci, (c0, notes) in enumerate(chords):
    c1 = chords[ci + 1][0] if ci + 1 < len(chords) else DUR + 1
    xf = 2.2
    env = np.clip((t - c0) / xf, 0, 1) * np.clip((c1 + xf * .5 - t) / xf, 0, 1)
    env = np.where(t < c0 - .01, 0, env) if ci else np.clip(t / 2.5, 0, 1) * np.clip((c1 + xf * .5 - t) / xf, 0, 1)
    for i, f in enumerate(notes):
        det = 1 + (i - 2) * .0009
        vib = 1 + .0018 * np.sin(2 * np.pi * (.17 + .03 * i) * t + i)
        ph = 2 * np.pi * np.cumsum(f * det * vib) / SR
        pad += (np.sin(ph) + .22 * np.sin(2 * ph)) * env * (.9 if f < 200 else .6) / len(notes)
pad = lp(pad, 1400, 2) * .1
pad *= np.clip(t / 2.0, 0, 1) * np.clip((DUR - t) / 2.2, 0, 1)

# ---------------- sidechain ducking under the voice ----------------
env = np.abs(vo); b, a = butter(1, 5 / (SR / 2)); env = lfilter(b, a, env); env /= env.max() + 1e-9
duck_fx = 1 - .5 * np.clip(env * 3.0, 0, 1)
duck_pad = 1 - .35 * np.clip(env * 3.0, 0, 1)

mix = vo * 1.0 + fx * duck_fx * .42 + pad * duck_pad * 1.0
mix = np.tanh(mix * 1.0)
mix /= np.abs(mix).max() / .9
wavfile.write('/home/claude/spectra-video/mix4.wav', SR, (np.stack([mix, mix], 1) * 32767).astype(np.int16))
print('mix ok', DUR)

# ---------------- captions (.srt), full sentences for platform captioning ----------------
def ts(x):
    x = max(0, x); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f'{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)):03d}'
text = {
 'L1': 'Everything said: all good.', 'L2': "But customers couldn't pay.", 'L3': 'A bar was covering part of the Pay button.',
 'L4': 'Normal checks just read a list of parts.', 'L5': 'They never see what customers see.',
 'L6': 'Spectra looks at the screen, like a person.', 'L7': 'Say a rule: the Pay button must always be visible.',
 'L8': 'Two different eyes look. Both must agree.', 'L9': '9.6% hidden. Rejected, with proof.',
 'L10': 'Fix it. Check again. Zero hidden. Approved.',
 'L11': '18 hidden buttons. Normal checks caught one. Spectra caught all 18.',
 'L12': 'Catch it before your customers do.', 'L13': 'Spectra. See what your customers see.'}
with open('/home/claude/spectra-video/out/spectra-simple-v4.srt', 'w') as f:
    for i, k in enumerate(anch, 1):
        f.write(f"{i}\n{ts(anch[k]['start'])} --> {ts(anch[k]['end'] + .15)}\n{text[k]}\n\n")
print('srt ok')
```

#### E.4 `render4.js` — deterministic frame capture → ffmpeg

```javascript
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const FPS = 30;
  const tmp = '/home/claude/spectra-video/video4_tmp.mp4';
  const final = '/home/claude/spectra-video/video4_silent.mp4';
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file:///home/claude/spectra-video/index4.html');
  await p.evaluate(() => window.ready);
  const total = await p.evaluate(() => window.TOTAL);
  const frames = Math.round(total * FPS);
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-crf', '18', '-preset', 'veryfast', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-movflags', '+faststart', tmp],
    { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(res => ff.on('close', res));
  for (let i = 0; i < frames; i++) {
    await p.evaluate(t => window.seek(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 100 === 0) console.log('frame', i, '/', frames);
  }
  ff.stdin.end();
  const code = await done;
  await b.close();
  if (code === 0) { fs.renameSync(tmp, final); console.log('rendered', final); } else { console.log('ffmpeg failed', code); process.exit(1); }
})();
```

#### E.5 `shots4.js` — screenshot any timestamps for visual QA

```javascript
const { chromium } = require('playwright');
(async () => {
  const times = process.argv.slice(2).map(Number);
  const out = '/tmp/claude-0/-home-claude/1217a952-1da8-5d5a-bc10-1b28ba0e4770/scratchpad/shots4';
  require('fs').mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  p.on('console', m => { if (m.type()==='error') console.log('ERR', m.text()); });
  p.on('pageerror', e => console.log('PAGEERR', e.message));
  await p.goto('file:///home/claude/spectra-video/index4.html');
  await p.evaluate(() => window.ready);
  for (const t of times) {
    await p.evaluate(t => window.seek(t), t);
    await p.screenshot({ path: `${out}/t_${t.toFixed(2)}.png` });
  }
  await b.close();
})();
```

#### E.6 `dump4.js` — dump SFX events + anchors

```javascript
const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
await p.goto('file:///home/claude/spectra-video/index4.html');await p.evaluate(()=>window.ready);
const d=await p.evaluate(()=>({total:window.TOTAL,events:window.EVENTS,anch:window.ANCH}));
require('fs').writeFileSync('v4/events.json',JSON.stringify(d,null,1));
console.log(d.total,d.events.length);await b.close();})();
```

#### E.7 `build4.py` — assemble the page

```python
src=open('/home/claude/spectra-video/index3.html').read()
css=src[src.index('<style>')+7:src.index('</style>')]
css=css.replace("#s2,#s3a,#s3b,#s3c,#s4,#s5{visibility:hidden}","#s2,#s3b,#s3c,#s4,#s5{visibility:hidden}")
css+=open('/home/claude/spectra-video/v4/css4.css').read()
# helpers copied verbatim from v3 (app mock + lottie ring maker)
js=src[src.index('function appHTML'):src.index('const rS=mkRing')]
html=('<!doctype html>\n<html>\n<head>\n<meta charset="utf-8">\n<title>Spectra — Simple cut v4</title>\n<style>\n'+css+'\n</style>\n</head>\n<body>\n'
      +open('/home/claude/spectra-video/v4/body4.html').read()+'\n'
      +open('/home/claude/spectra-video/v4/script_head.js').read()+js
      +open('/home/claude/spectra-video/v4/script_tail.js').read())
open('/home/claude/spectra-video/index4.html','w').write(html)
print('built',len(html))
```

#### E.8 `script_head.js` — helpers + key times

```html
<script src="node_modules/gsap/dist/gsap.min.js"></script>
<script src="node_modules/lottie-web/build/player/lottie.min.js"></script>
<script src="v4/anchors.js"></script>
<script>
gsap.ticker.lagSmoothing(0);
const $=s=>document.querySelector(s);
const AN=ANCH.lines, st=k=>AN[k].start, en=k=>AN[k].end;
const nrm=s=>s.toLowerCase().replace(/[^a-z0-9%']/g,'');
const W=(k,w)=>{const f=AN[k].words.find(x=>nrm(x[0])===nrm(w));if(!f)throw new Error('word '+k+' '+w);return AN[k].start+f[1]};
const WI=(k,i)=>AN[k].start+AN[k].words[i][1];
const SS=k=>AN[k].segs.filter(s=>s[1]-s[0]>=.12);
const SSo=(k,i)=>{const s=SS(k);return (s[i]||s[s.length-1])[0]};
const SG=(k,i)=>AN[k].start+SSo(k,i);
const TOTAL=+(en('L13')+1.4).toFixed(2);
window.EVENTS=[];const ev=(n,t,o)=>window.EVENTS.push([n,+(+t).toFixed(3),o||{}]);

/* ---- key times from the measured voice ---- */
const DID=W('L2',"couldn't"), PAY=W('L3','pay');
const BOTH=SG('L8',1), REJ=SG('L9',1), PROOF=SG('L9',2)+.25;
const PT=st('L10'), VERIFY=SG('L10',1), ZERO=SG('L10',2), APPR=SG('L10',3);
const SP11A=SG('L11',1), SP11B=SG('L11',2);
const W1=en('L3')+.45,SW1=W1+.30, X1=en('L6')+.15, X2=en('L7')+.5, W4=en('L10')+.55,SW4=W4+.30, W5=en('L11')+.75,SW5=W5+.30;
```

#### E.9 `script_tail.js` — full choreography + captions

```javascript
$('#cvApp').innerHTML=appHTML(false)+'<div class="cvh"></div><div class="cvs"></div><div class="cvx"></div>';
const rS=mkRing('#lotS',[.12,.65,.42,1]),rLogo=mkRing('#lotLogo',[.18,.29,1,1]);

const rc=id=>{const r=document.getElementById(id).getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2}};
const T2=rc('tab2'),TS=rc('tabS');

const tl=gsap.timeline({paused:true,defaults:{ease:'power3.out'}});
const fmtInt=v=>Math.round(v).toLocaleString('en-US');
function count(sel,from,to,t,dur,fmt,ease){const el=$(sel);const o={v:from};el.innerHTML=fmt(from);tl.to(o,{v:to,duration:dur,ease:ease||'power2.out',onUpdate(){el.innerHTML=fmt(o.v)}},t)}
function ring(b,t){tl.set(b.el,{autoAlpha:1},t);tl.fromTo(b.o,{f:0},{f:39,duration:1.3,ease:'none',onUpdate(){b.anim.goToAndStop(b.o.f,true)}},t);tl.set(b.el,{autoAlpha:0},t+1.32)}
function wipe(id,t0){tl.fromTo(id,{x:-1970},{x:0,duration:.30,ease:'power3.in'},t0).to(id,{x:1970,duration:.34,ease:'power3.out'},t0+.30);ev('whoosh',t0,{a:1})}
const pop=(sel,t,rot)=>{tl.fromTo(sel,{scale:0,autoAlpha:0,rotation:rot||0},{scale:1,autoAlpha:1,rotation:0,duration:.4,ease:'back.out(2.2)'},t);ev('pop',t)};
function hdr(sel,t,t2){tl.fromTo(sel,{autoAlpha:1,scale:1.1,y:10,transformOrigin:'0 50%'},{autoAlpha:1,scale:1,y:0,duration:.22,ease:'power3.out',immediateRender:false},t);if(t2)tl.set(sel,{autoAlpha:0},t2)}

/* ===================== S1 : hook — "everything said all good… but customers couldn't pay" ===================== */
gsap.set('#b1',{yPercent:112});gsap.set('#didnt',{autoAlpha:0});gsap.set('#chkR',{scaleX:0});
gsap.set(['#h1hatch','#h1box','#h1strip','#chip1'],{autoAlpha:0});
tl.from('#tA',{x:-26,duration:.6,ease:'power4.out'},0);
tl.from('#dash',{x:-26,duration:.6,ease:'power4.out'},0);
tl.from('#m1',{y:44,duration:.65,ease:'power4.out'},0);
ev('thud',0,{a:.4});
['#d1 i','#d2 i','#d3 i'].forEach((s,i)=>{tl.fromTo(s,{scale:1.7},{scale:1,duration:.28,ease:'back.out(2.4)',immediateRender:false},.35+i*.3);ev('tap',.35+i*.3)});
tl.to('#chk',{scale:1.18,duration:.16,yoyo:true,repeat:1,ease:'power2.out',transformOrigin:'50% 50%'},WI('L1',3));ev('pop',WI('L1',3));
tl.to('#b1',{yPercent:0,duration:.5,ease:'power4.out'},st('L2')-.05);ev('whoosh',st('L2')-.05,{a:.5});
tl.fromTo('#didnt',{autoAlpha:0,scale:2.1,rotation:-4},{autoAlpha:1,scale:1,rotation:0,duration:.24,ease:'power4.in'},DID-.1);
tl.to('#chkG',{scaleX:0,duration:.08,ease:'power2.in'},DID).to('#chkR',{scaleX:1,duration:.18,ease:'back.out(3)'},DID+.06);
tl.fromTo('#flash1',{opacity:0},{opacity:.18,duration:.06,yoyo:true,repeat:3,ease:'none'},DID+.1);
tl.to('#s1',{x:-14,duration:.045,yoyo:true,repeat:5,ease:'none'},DID+.1).set('#s1',{x:0},DID+.4);
tl.to('#dash',{opacity:.45,duration:.4},DID+.3);
ev('impact',DID);
tl.fromTo('#punchBg',{autoAlpha:0},{autoAlpha:1,duration:.35,ease:'none'},st('L3'));
tl.to(['#tA','#tB','#dash'],{autoAlpha:0,duration:.25,ease:'power2.in'},st('L3'));
tl.set('#m1',{boxShadow:'none'},st('L3'));
tl.to('#m1',{scale:2.7,x:-746,y:-170,duration:.75,ease:'power4.out'},st('L3'));ev('swell',st('L3'),{d:.8});
tl.to(['#h1hatch','#h1box'],{autoAlpha:1,duration:.15},st('L3')+.8);
tl.fromTo('#h1strip',{autoAlpha:0},{autoAlpha:1,duration:.12,yoyo:true,repeat:5,ease:'none'},st('L3')+.9).set('#h1strip',{autoAlpha:1},st('L3')+1.62);
ev('ticks',st('L3')+.9,{n:5,dt:.12,a:.07});
tl.fromTo('#chip1',{autoAlpha:0,x:60,scale:.8},{autoAlpha:1,x:0,scale:1,duration:.35,ease:'back.out(2.2)'},PAY);ev('pop',PAY);
wipe('#w1',W1);
tl.set('#s1',{autoAlpha:0},SW1).set('#s2',{autoAlpha:1},SW1);

/* ===================== S2 : what the software reads  vs  what the customer sees ===================== */
gsap.set(['#hs1','#hs2','#hs3','#eyeIc','#cL','#cR','#li1','#li2','#li3','#li4','#cLchip','#cvChip'],{autoAlpha:0});
tl.fromTo('#cL',{autoAlpha:0,y:60},{autoAlpha:1,y:0,duration:.5,ease:'power4.out'},st('L4')-.05);ev('whoosh',st('L4')-.05,{a:.3});
hdr('#hs1',st('L4')-.05,SG('L5',1)-.1);
['#li1','#li2','#li3','#li4'].forEach((s,i)=>{const t=st('L4')+.5+i*.4;tl.fromTo(s,{autoAlpha:0,x:-30},{autoAlpha:1,x:0,duration:.3},t);ev('tap',t)});
tl.fromTo('#cLchip',{autoAlpha:0,scale:.7},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.2)'},st('L4')+2.15);ev('chime',st('L4')+2.15);
// the customer's view
tl.to('#cL',{opacity:.38,duration:.4},st('L5'));
tl.fromTo('#cR',{autoAlpha:0,x:80},{autoAlpha:1,x:0,duration:.55,ease:'power4.out'},st('L5')+.02);ev('whoosh',st('L5')+.02,{a:.35});
hdr('#hs2',SG('L5',1)-.1,st('L6')-.05);
tl.fromTo('#cvApp .cvh',{opacity:0},{opacity:1,duration:.25},SG('L5',1)+.35);
tl.fromTo('#cvApp .cvs',{opacity:0},{opacity:1,duration:.12,yoyo:true,repeat:5,ease:'none'},SG('L5',1)+.45).set('#cvApp .cvs',{opacity:1},SG('L5',1)+1.17);
tl.fromTo('#cvApp .cvx',{opacity:0},{opacity:1,duration:.2},SG('L5',1)+.3);
ev('ticks',SG('L5',1)+.45,{n:5,dt:.12,a:.07});
tl.fromTo('#cvChip',{autoAlpha:0,scale:.7},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.2)'},SG('L5',1)+.9);ev('pop',SG('L5',1)+.9);
// Spectra looks
const LOOK=st('L6');
tl.to('#cL',{autoAlpha:0,x:-120,duration:.45,ease:'power3.in'},LOOK-.05);
tl.to('#cR',{x:-452,duration:.7,ease:'power3.inOut'},LOOK);ev('whoosh',LOOK,{a:.35});
tl.fromTo('#eyeIc',{autoAlpha:0,scale:.5,rotation:-90},{autoAlpha:1,scale:1,rotation:0,duration:.55,ease:'back.out(1.8)',transformOrigin:'50% 50%'},LOOK+.1);ev('pop',LOOK+.1);
hdr('#hs3',LOOK+.05,X1-.05);
tl.set('#cRlab',{textContent:'SPECTRA · LOOKING',color:'#2F4BFF',backgroundColor:'rgba(47,75,255,.09)',borderColor:'rgba(47,75,255,.38)'},LOOK+.3);
tl.to('#vf',{opacity:1,duration:.3},LOOK+.5);ev('pop',LOOK+.5);
tl.fromTo('#cvScan',{y:0},{y:490,duration:.9,ease:'power1.inOut'},LOOK+.6);ev('swell',LOOK+.6,{d:.9});
tl.fromTo('#cvScan',{y:0},{y:490,duration:.9,ease:'power1.inOut',immediateRender:false},LOOK+1.5);ev('swell',LOOK+1.5,{d:.9});
tl.fromTo('#s3b',{autoAlpha:0},{autoAlpha:1,duration:.3,ease:'none'},X1);
tl.to('#s2',{autoAlpha:0,duration:.3,ease:'none'},X1+.05);

/* ===================== S3b : step 1 — say a rule ===================== */
gsap.set(['#mic','#wave','#tr','#arrow','#arrowL','#ct','#ctChip'],{autoAlpha:0});
tl.fromTo('#hb1',{autoAlpha:1,scale:1.1,y:10,transformOrigin:'0 50%'},{autoAlpha:1,scale:1,y:0,duration:.25,immediateRender:false},X1+.1);
tl.fromTo('#mic',{autoAlpha:0,scale:.6},{autoAlpha:1,scale:1,duration:.45,ease:'back.out(2)'},st('L7')-.05);ev('pop',st('L7')-.05);
tl.fromTo('#wave',{autoAlpha:0},{autoAlpha:1,duration:.2},st('L7')+.05);
const WVD=en('L7')-.5-(st('L7')+.05),wv={p:0};
tl.to(wv,{p:1,duration:WVD,ease:'none',onUpdate(){const bars=document.querySelectorAll('#wave i');const amp=Math.max(0,1-Math.max(0,wv.p-.78)*4.2);bars.forEach((b,i)=>{b.style.height=(14+110*amp*Math.abs(Math.sin(wv.p*34+i*.8))*(.55+.45*Math.sin(i*1.3)))+'px'})}},st('L7')+.05);
tl.set('#wave',{autoAlpha:.25},en('L7')-.45);
tl.fromTo('#tr',{autoAlpha:0,x:50},{autoAlpha:1,x:0,duration:.4,ease:'power4.out'},st('L7')+.05);ev('tap',st('L7')+.05);
const TXT='The Pay button must always be visible.',to={n:0},TY0=SG('L7',1),CARD=en('L7')-.3;
tl.to(to,{n:TXT.length,duration:CARD-.05-TY0,ease:'none',onUpdate(){$('#trTxt').textContent=TXT.slice(0,Math.round(to.n))}},TY0);
ev('ticks',TY0,{n:30,dt:.042,a:.06});
tl.fromTo(['#arrow','#arrowL'],{autoAlpha:0,y:-16},{autoAlpha:1,y:0,duration:.35},CARD-.15);ev('pop',CARD-.1);
tl.fromTo('#ct',{autoAlpha:0,y:80},{autoAlpha:1,y:0,duration:.5,ease:'power4.out'},CARD);ev('whoosh',CARD,{a:.4});
tl.fromTo('#ctChip',{autoAlpha:0,scale:.6},{autoAlpha:1,scale:1,duration:.35,ease:'back.out(2.4)'},CARD+.4);ev('chime',CARD+.4);
tl.fromTo('#s3c',{autoAlpha:0},{autoAlpha:1,duration:.3,ease:'none'},X2);
tl.to('#s3b',{autoAlpha:0,duration:.3,ease:'none'},X2+.05);

/* ===================== S3c : two eyes → rejected → fix → approved ===================== */
gsap.set(['#splitL','#splitR'],{opacity:0});gsap.set(['#bRej','#bVer','#bbox','#bhatch','#bstrip','#bclip','#cursor','#agree','#gauge'],{autoAlpha:0});
const hc=(i,t,t2)=>hdr('#hc'+i,t,t2);
hc(1,st('L8')-.08,BOTH-.08);hc(2,BOTH-.08,st('L9')-.06);hc(3,st('L9')-.06,REJ-.05);hc(4,REJ-.05,st('L10')-.06);
hc(5,st('L10')-.06,VERIFY-.05);hc(6,VERIFY-.05,ZERO-.05);hc(7,ZERO-.05,APPR-.05);hc(8,APPR-.05,W4);
tl.from('#ruler',{autoAlpha:0,duration:.4},X2);
tl.from('#vp',{scale:.92,autoAlpha:0,duration:.45,ease:'power4.out',transformOrigin:'50% 50%'},X2+.05);ev('thud',X2+.1,{a:.4});
tl.from('#panel',{x:-130,autoAlpha:0,duration:.45,ease:'power4.out'},st('L8')-.1);ev('whoosh',st('L8')-.1,{a:.35});
gsap.set(['#chA','#chB'],{autoAlpha:0});
pop('#chA',st('L8')+.05,-8);pop('#chB',st('L8')+.5,8);
tl.fromTo('#scan',{y:0},{y:860,duration:.95,ease:'power1.inOut'},st('L8')+.1);ev('swell',st('L8')+.1,{d:.9});
count('#nA',0,15759,st('L8')+.5,1.1,v=>fmtInt(v)+'<u>px</u>');
count('#nB',0,90,st('L8')+.65,1.0,v=>v.toFixed(2)+'<u>%</u>');
ev('ticks',st('L8')+.5,{n:14,dt:.08,a:.06});
// lock on + zoom into the button
const LOCK=st('L8')+.95;
tl.to('#bbox',{autoAlpha:1,duration:.01},LOCK);tl.from('#bbox',{scale:1.2,duration:.3,transformOrigin:'50% 50%'},LOCK);ev('click',LOCK);
tl.fromTo('#bhatch',{autoAlpha:0},{autoAlpha:1,duration:.25},LOCK+.15);
tl.fromTo('#bstrip',{autoAlpha:0},{autoAlpha:1,duration:.12,yoyo:true,repeat:3,ease:'none'},LOCK+.3).set('#bstrip',{autoAlpha:1},LOCK+.78);
tl.fromTo('#bclip',{autoAlpha:0,y:-14},{autoAlpha:1,y:0,duration:.3,ease:'back.out(2)'},LOCK+.55);ev('pop',LOCK+.55);
tl.to('#zin',{scale:1.8,x:-1024,y:-576,duration:.55,ease:'power3.inOut'},LOCK-.1);ev('whoosh',LOCK-.1,{a:.4});
tl.to('#zin',{scale:2,x:-1280,y:-720,duration:PT-.45-(LOCK+.45),ease:'sine.inOut'},LOCK+.45);
// both eyes agree
tl.fromTo('#agree',{autoAlpha:0,x:30},{autoAlpha:1,x:0,duration:.4,ease:'power4.out'},BOTH);ev('chime',BOTH);
// 9.6% hidden → gauge
tl.fromTo('#gauge',{autoAlpha:0,y:20},{autoAlpha:1,y:0,duration:.4},st('L9')-.1);
const PX=554/12,gg={v:0};
tl.to(gg,{v:9.6,duration:1.2,ease:'power2.out',onUpdate(){$('#gfill').style.width=(gg.v*PX)+'px';$('#gval').textContent=gg.v.toFixed(2)}},st('L9')+.05);
ev('ticks',st('L9')+.05,{n:15,dt:.08,a:.06});
// rejected
tl.to('#bAna',{autoAlpha:0,duration:.05},REJ);
tl.fromTo('#bRej',{autoAlpha:0,scale:1.6,transformOrigin:'0% 50%'},{autoAlpha:1,scale:1,duration:.3,ease:'back.out(2)'},REJ);
tl.to('#panel',{x:7,duration:.045,yoyo:true,repeat:5,ease:'none'},REJ+.02).set('#panel',{x:0},REJ+.3);
tl.set('#pulse',{borderColor:'#F2432D'},REJ);tl.fromTo('#pulse',{opacity:.9,scale:1},{opacity:0,scale:1.09,duration:.7,ease:'power2.out',immediateRender:false},REJ);ev('impact',REJ);
// proof
tl.set('#gnote',{textContent:'Too much: 9.60% > 1.35% allowed',color:'#F2432D'},PROOF);
tl.fromTo('#gtick',{scaleY:1},{scaleY:1.5,duration:.2,yoyo:true,repeat:3,ease:'none'},PROOF);ev('tap',PROOF);
// zoom out → cursor → "Fix it."
tl.to('#zin',{scale:1,x:0,y:0,duration:.5,ease:'power3.inOut'},PT-.45);ev('whoosh',PT-.45,{a:.35,rev:1});
tl.set('#cursor',{x:1560,y:1010,autoAlpha:1},PT-.45);
tl.fromTo('#cursor',{x:1560,y:1010},{x:T2.x-4,y:T2.y+4,duration:.6,ease:'power2.inOut'},PT-.45);
tl.to('#cursor',{scale:.82,duration:.07,yoyo:true,repeat:1},PT+.25);tl.to('#tab2',{scale:.93,duration:.07,yoyo:true,repeat:1},PT+.25);ev('click',PT+.25);
tl.set('#tab1',{backgroundColor:'#F8F4EA',color:'#4A4639',borderColor:'#B9B19B'},PT+.3).set('#tab2',{backgroundColor:'rgba(14,15,19,.10)',color:'#0E0F13',borderColor:'#0E0F13'},PT+.3);
tl.fromTo('#scan',{y:0},{y:860,duration:.5,ease:'power1.inOut'},PT+.32);ev('swell',PT+.32,{d:.5,down:1});
tl.fromTo('#rep',{clipPath:'inset(0px 0px 720px 0px)'},{clipPath:'inset(0px 0px 0px 0px)',duration:.5,ease:'power1.inOut'},PT+.32);
tl.set(['#bbox','#bhatch','#bstrip','#bclip'],{autoAlpha:0},PT+.5);
tl.to('#bRej',{autoAlpha:0,duration:.05},PT+.3);tl.set('#bAna',{autoAlpha:1,textContent:'LOOKING AGAIN…'},PT+.3);
// "Check again."  → gauge drains
count('#nA',15759,17299,VERIFY,.7,v=>fmtInt(v)+'<u>px</u>');
count('#nB',90,100,VERIFY,.7,v=>v.toFixed(2)+'<u>%</u>');
tl.to(gg,{v:0,duration:.8,ease:'power2.inOut',onUpdate(){$('#gfill').style.width=(gg.v*PX)+'px';$('#gval').textContent=gg.v.toFixed(2)}},VERIFY);
tl.to('#gfill',{backgroundColor:'#22AB78',duration:.4},VERIFY);
tl.set('#gnote',{textContent:'0.00% < 1.35% allowed → OK',color:'#12A66B'},VERIFY+.5);
ev('ticks',VERIFY,{n:10,dt:.07,a:.06});
// "Zero hidden."
tl.fromTo('#gval',{scale:1.3},{scale:1,duration:.4,ease:'back.out(2)',transformOrigin:'100% 50%'},ZERO);ev('tap',ZERO);
tl.to('#cursor',{x:TS.x-4,y:TS.y+4,duration:.3,ease:'power2.inOut'},ZERO+.05);
tl.to('#cursor',{scale:.82,duration:.07,yoyo:true,repeat:1},ZERO+.4);tl.to('#tabS',{scale:.93,duration:.07,yoyo:true,repeat:1},ZERO+.4);ev('click',ZERO+.4);
tl.set('#tabS',{backgroundColor:'rgba(14,15,19,.10)',color:'#0E0F13',borderColor:'#0E0F13'},ZERO+.46).set('#tab2',{backgroundColor:'#F8F4EA',color:'#4A4639',borderColor:'#B9B19B'},ZERO+.46);
const HX=754,HY=220+(48+360)*.8,SC=.8,sp={L:0};
const applyL=()=>{$('#rep').style.clipPath=`inset(0px 0px 0px ${sp.L}px)`;$('#sdiv').style.left=sp.L+'px'};
tl.set('#sdiv',{visibility:'visible'},ZERO+.5);
tl.to(sp,{L:1280,duration:.25,ease:'power2.in',onUpdate:applyL},ZERO+.52);
tl.to('#cursor',{x:HX+1280*SC-4,y:HY+4,duration:.25,ease:'power2.in'},ZERO+.52);ev('whoosh',ZERO+.52,{a:.3});
tl.to(sp,{L:620,duration:.7,ease:'power3.out',onUpdate:applyL},ZERO+.8);
tl.to('#cursor',{x:HX+620*SC-4,y:HY+4,duration:.7,ease:'power3.out'},ZERO+.8);
tl.to(['#splitL','#splitR'],{opacity:1,duration:.3},ZERO+.95);tl.from(['#splitL','#splitR'],{y:10,duration:.3},ZERO+.95);ev('whoosh',ZERO+.8,{a:.3,rev:1});
// "Approved."
tl.to('#bAna',{autoAlpha:0,duration:.05},APPR);
tl.fromTo('#bVer',{autoAlpha:0,scale:1.6,transformOrigin:'0% 50%'},{autoAlpha:1,scale:1,duration:.3,ease:'back.out(2)'},APPR);
tl.set('#pulse',{borderColor:'#12A66B'},APPR);tl.fromTo('#pulse',{opacity:.9,scale:1},{opacity:0,scale:1.09,duration:.8,ease:'power2.out',immediateRender:false},APPR);ev('chime',APPR);
wipe('#w4',W4);
tl.set('#s3c',{autoAlpha:0},SW4).set('#s4',{autoAlpha:1},SW4);

/* ===================== S4 : the 18 hidden buttons ===================== */
const mkTiles=id=>{$(id+' .tiles').innerHTML=Array.from({length:18},()=>'<div class="tile"><b></b><i></i><s></s></div>').join('')};
mkTiles('#rA');mkTiles('#rB');
gsap.set(['#h4','#rA','#rB'],{autoAlpha:0});gsap.set('.tile',{autoAlpha:0});
tl.fromTo('#h4',{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.5},SW4+.05);ev('tap',SW4+.05);
tl.fromTo(['#rA','#rB'],{autoAlpha:0},{autoAlpha:1,duration:.4,stagger:.12},SW4+.2);
const TP=st('L11')+.1;
['#rA','#rB'].forEach((id,r)=>{document.querySelectorAll(id+' .tile').forEach((el,i)=>{tl.fromTo(el,{autoAlpha:0,scale:.6,y:14},{autoAlpha:1,scale:1,y:0,duration:.25,ease:'back.out(2)'},TP+i*.035+r*.02)})});
ev('ticks',TP,{n:18,dt:.035,a:.05});
const RED=['rgba(242,67,45,.16)','rgba(242,67,45,.6)','#FF9A8A','✕'], GRN=['rgba(18,166,107,.18)','rgba(18,166,107,.65)','#5FE0A8','✓'];
function flip(el,t,c){tl.set(el,{backgroundColor:c[0],borderColor:c[1]},t);tl.set(el.querySelector('s'),{opacity:1,color:c[2],textContent:c[3]},t);tl.set([el.querySelector('b'),el.querySelector('i')],{opacity:0},t)}
const OKI=7,TA=SP11A+.05;
document.querySelectorAll('#rA .tile').forEach((el,i)=>{
  const t=TA+i*.048;
  if(i===OKI){flip(el,t,GRN);tl.fromTo(el,{scale:1.3},{scale:1,duration:.3,ease:'back.out(2)',immediateRender:false},t);tl.set('#rA .sv',{textContent:'1'},t);ev('chime',t)}
  else{flip(el,t,RED);if(i%3===0)ev('tap',t)}
});
tl.fromTo('#rA .stat',{scale:1.25},{scale:1,duration:.35,ease:'back.out(2)',immediateRender:false},TA+OKI*.048);
const TB=SP11B+.12;
document.querySelectorAll('#rB .tile').forEach((el,i)=>{
  const t=TB+i*.075;flip(el,t,GRN);tl.set('#rB .sv',{textContent:String(i+1)},t);
  if(i%2===0)ev('tap',t);
});
const TB_END=TB+17*.075;
tl.fromTo('#rB .stat',{scale:1.35},{scale:1,duration:.4,ease:'back.out(2)',immediateRender:false},TB_END);
ring(rS,TB_END);ev('impact',TB_END);ev('chime',TB_END+.02);
wipe('#w5',W5);
tl.set('#s4',{autoAlpha:0},SW5).set('#s5',{autoAlpha:1},SW5);

/* ===================== S5 : close ===================== */
gsap.set(['#logoIc','#brand','#tag','#url','#devrow'],{autoAlpha:0});gsap.set(['#wd1','#wd2','#wd3','#wd4','#wd5','#dv1','#dv2','#dv3'],{autoAlpha:0});
gsap.set(['#ct1','#ct2'],{yPercent:112});
tl.to('#ct1',{yPercent:0,duration:.5,ease:'power4.out'},st('L12'));ev('tap',st('L12'));
tl.to('#ct2',{yPercent:0,duration:.5,ease:'power4.out'},WI('L12',3)-.1);ev('tap',WI('L12',3)-.1);
tl.to('#catch',{autoAlpha:0,y:-60,duration:.35,ease:'power2.in'},st('L13')-.25);
const E=st('L13');
tl.fromTo('#logoIc',{autoAlpha:0,scale:0,rotation:-100},{autoAlpha:1,scale:1,rotation:0,duration:.6,ease:'back.out(1.8)',transformOrigin:'50% 50%'},E);
ring(rLogo,E+.05);ev('impact',E+.02);ev('chime',E+.05);
tl.set('#brand',{autoAlpha:1},E);
tl.from('#brand span',{yPercent:70,autoAlpha:0,duration:.4,stagger:.05,ease:'back.out(2)'},E+.02);
[['#wd1',1],['#wd2',2],['#wd3',3],['#wd4',4],['#wd5',5]].forEach(([s,i])=>{const t=WI('L13',i);tl.fromTo(s,{autoAlpha:0,y:34,scale:.9},{autoAlpha:1,y:0,scale:1,duration:.3,ease:'back.out(2)'},t-.05);ev('pop',t-.05)});
tl.set('#tag',{autoAlpha:1},E);
const UT=WI('L13',4)-.15;
tl.fromTo('#url',{autoAlpha:0,y:50},{autoAlpha:1,y:0,duration:.45,ease:'back.out(1.8)'},UT);
const URL_='spectra-lyart.vercel.app',uo={n:0};
tl.to(uo,{n:URL_.length,duration:.8,ease:'none',onUpdate(){$('#urltxt').textContent=URL_.slice(0,Math.round(uo.n))}},UT+.25);
ev('ticks',UT+.25,{n:24,dt:.033,a:.05});
tl.fromTo('#caret',{opacity:1},{opacity:0,duration:.2,yoyo:true,repeat:9,ease:'steps(1)'},UT+.25);
tl.set('#devrow',{autoAlpha:1},en('L13')-.7);
tl.fromTo(['#dv1','#dv2','#dv3'],{autoAlpha:0,y:16},{autoAlpha:1,y:0,duration:.35,stagger:.14},en('L13')-.7);
tl.to('#urlbox',{scale:1.035,duration:.3,yoyo:true,repeat:1,ease:'sine.inOut'},en('L13')+.15);
ev('chime',en('L13')+.15);

/* ===================== captions ===================== */
const CAPS=[
 ['L3',[[0,'A bar was covering part of the Pay button.']]],
 ['L4',[[0,'Normal checks just read a list of parts.']]],
 ['L5',[[0,'They never see what customers see.']]],
 ['L6',[[0,'Spectra looks at the screen, like a person.']]],
 ['L7',[[0,'Say a rule:'],[SSo('L7',1),'the Pay button must always be visible.']]],
 ['L8',[[0,'Two different eyes look.'],[SSo('L8',1),'Both must agree.']]],
 ['L9',[[0,'9.6% hidden.'],[SSo('L9',1),'Rejected, with proof.']]],
 ['L10',[[0,'Fix it.'],[SSo('L10',1),'Check again.'],[SSo('L10',2),'Zero hidden.'],[SSo('L10',3),'Approved.']]],
 ['L11',[[0,'18 hidden buttons.'],[SSo('L11',1),'Normal checks caught one.'],[SSo('L11',2),'Spectra caught all 18.']]]
];
CAPS.forEach(([k,chunks])=>chunks.forEach(([off,txt],i)=>{
  const t0=st(k)+off-.03, t1=(i+1<chunks.length?st(k)+chunks[i+1][0]-.06:en(k)+.18);
  tl.set('#capT',{textContent:txt},t0);
  tl.fromTo('#cap',{autoAlpha:0,y:12},{autoAlpha:1,y:0,duration:.16,ease:'power2.out',immediateRender:false},t0);
  tl.to('#cap',{autoAlpha:0,duration:.14,ease:'power1.in'},t1-.02);
}));

tl.to({},{duration:.01},TOTAL-.01);
window.TOTAL=TOTAL;
window.seek=t=>{tl.time(Math.min(t,TOTAL-.001),false)};
window.ready=document.fonts.ready.then(()=>Promise.all(['800 80px BR','700 80px BR','italic 400 80px IS','400 20px JB','700 20px JB','500 20px IN','600 20px IN','700 20px IN','700 20px SG'].map(f=>document.fonts.load(f))));
</script>
</body>
</html>
```

#### E.10 `css4.css` — v4 style overrides (chips, cards, tiles, close)

```css

/* =================== v4 "Simple" overrides =================== */
.ck{display:inline-block;font:700 22px/1 'JB';letter-spacing:.08em;padding:9px 16px;border:1.5px solid;border-radius:var(--chipr);white-space:nowrap}
.ck.b{background:rgba(47,75,255,.09);color:var(--blue);border-color:rgba(47,75,255,.38)}
.ck.g{background:rgba(18,166,107,.12);color:#0B8A57;border-color:rgba(18,166,107,.55)}
.ck.r{background:rgba(242,67,45,.10);color:#D92E19;border-color:rgba(242,67,45,.5)}
.ck.n{background:rgba(110,106,90,.10);color:#6A6657;border-color:rgba(110,106,90,.4)}

/* ---- S1 hook ---- */
#tA{top:52px}#tB{top:290px}
#tA .ln{height:112px}#tA .ln>span{font:800 104px/112px 'BR';letter-spacing:-.03em}
#b1w{height:112px}#b1w>span{font:800 104px/112px 'BR';letter-spacing:-.03em}
#b2w{height:200px;overflow:visible}
#didnt{font:400 208px/200px 'IS';font-style:italic;color:var(--red);letter-spacing:-.02em}
#chk{width:88px;height:88px;margin-left:20px;vertical-align:-8px}
#chk .f{width:88px;height:88px}
#dash{position:absolute;left:96px;top:650px;width:790px;background:#FBF8F0;border:3px solid var(--ink);border-radius:20px;padding:20px 30px 22px;z-index:2;box-shadow:0 18px 40px rgba(14,15,19,.14)}
#dash .dh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
#dash .dh>span:first-child{font:700 22px 'JB';letter-spacing:.1em;color:#6A6657}
#dash .dr{display:flex;align-items:center;gap:18px;font:600 33px/1.55 'IN';color:var(--ink)}
#dash .dr i{font:800 32px/1 'BR';font-style:normal;color:var(--green);width:34px}
#chip1{left:1290px;font:800 46px/1 'BR';padding:14px 24px}

/* ---- S2 list vs screen ---- */
.vcard{position:absolute;top:268px;height:600px;background:#FBF8F0;border:3px solid var(--ink);border-radius:24px;box-shadow:0 20px 40px rgba(14,15,19,.12);z-index:3}
#cL{left:96px;width:780px}#cR{left:1000px;width:824px}
.vcard .lab{position:absolute;left:34px;top:28px}
#cL .li{position:absolute;left:34px;width:712px;height:88px;border-top:2px solid #DAD3C0;font:600 44px/88px 'IN';color:var(--ink)}
#cL .li b{position:absolute;right:0;top:0;font:800 46px/88px 'BR';color:var(--green)}
#cR .crop{position:absolute;left:22px;top:92px;width:776px;height:360px;overflow:hidden;border-radius:10px;background:#0b1020;box-shadow:0 0 0 2px var(--ink)}
#cvApp{position:absolute;left:0;top:0;width:1280px;height:720px;transform-origin:0 0;transform:translate(-1690px,-1043px) scale(1.95)}
#cvApp .cvh{position:absolute;left:910px;top:600px;width:340px;height:50px;background:repeating-linear-gradient(45deg,rgba(242,67,45,.55) 0 5px,transparent 5px 11px);z-index:9;opacity:0}
#cvApp .cvs{position:absolute;left:910px;top:643px;width:340px;height:7px;background:repeating-linear-gradient(45deg,#F2432D 0 4px,#fff 4px 8px);z-index:11;opacity:0}
#cvApp .cvx{position:absolute;left:910px;top:600px;width:340px;height:50px;border:3px dashed #F2432D;border-radius:5px;z-index:10;opacity:0}
#cvScan{position:absolute;left:0;top:-120px;width:100%;height:120px;background:linear-gradient(to bottom,rgba(47,75,255,0),rgba(47,75,255,.30));border-bottom:4px solid var(--blue);z-index:20}
#cR .cnote{position:absolute;left:34px;top:490px;font:600 34px/1.25 'IN';color:#5b584b}
#vf{position:absolute;left:-20px;top:-20px;right:-20px;bottom:-20px;pointer-events:none;opacity:0}
#vf i{position:absolute;width:64px;height:64px;border:7px solid var(--blue)}
#vf i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}
#vf i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
#vf i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}
#vf i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
#eyeIc{position:absolute;left:96px;top:46px;width:112px;height:112px;visibility:hidden;z-index:45}

/* ---- S3b rule ---- */
#ct{height:300px}
#ct .rb{position:absolute;left:38px;top:92px;display:flex;align-items:center;gap:30px}
#ct .rb svg{width:116px;height:116px;flex:none}
#ct .rt{font:800 62px/1.1 'BR';color:#F2EDE2;letter-spacing:-.03em;width:1180px}
#ct .rs{position:absolute;left:38px;top:238px;font:400 25px 'JB';color:#8E93A3}
#ctChip{font:700 24px/1 'JB';letter-spacing:.08em;padding:10px 18px}

/* ---- S3c plain labels ---- */
.vb{font-size:36px;padding:22px 26px}
#bAna{font-size:32px;padding:24px 26px}
.ins .ch{font-size:24px}
.ins .sb{left:200px;top:12px;font:600 26px/1.15 'IN';color:#3b382f}
.ins .sb small{display:block;font:400 18px 'JB';color:#8A8571;margin-top:3px;letter-spacing:.02em}
.ins .big u{font-size:26px;margin-left:10px}
#gauge .gl{font-size:22px}

/* ---- S4 the 18 buttons ---- */
#h4{position:absolute;left:96px;top:44px;font:800 88px/1.05 'BR';color:var(--paper);letter-spacing:-.035em;white-space:nowrap;visibility:hidden}
#h4 em{font:400 100px/1 'IS';font-style:italic;color:#FF8E7D;letter-spacing:-.01em}
.r18{position:absolute;left:96px;width:1728px;height:290px}
.r18 .t{position:absolute;left:0;top:0;font:800 48px/1 'BR';color:var(--paper);letter-spacing:-.02em;white-space:nowrap}
.r18 .t small{font:400 24px 'JB';color:#8B91A1;margin-left:20px;letter-spacing:0}
.r18 .tiles{position:absolute;left:0;top:88px;display:flex;gap:12px}
.tile{position:relative;width:60px;height:100px;flex:none;border:1.5px solid rgba(255,255,255,.22);background:rgba(255,255,255,.04);border-radius:var(--chipr)}
.tile b{position:absolute;left:9px;top:36px;width:40px;height:15px;background:#2f7f5d;border-radius:1px}
.tile i{position:absolute;left:3px;top:46px;width:52px;height:13px;background:#B8473A;border-radius:1px}
.tile s{position:absolute;left:0;top:0;width:100%;height:100%;text-decoration:none;font:800 42px/100px 'BR';text-align:center;opacity:0}
.r18 .stat{position:absolute;left:1336px;top:60px;font:800 132px/1 'BR';letter-spacing:-.05em;white-space:nowrap;transform-origin:0 60%}
.r18 .stat u{text-decoration:none;font-size:66px;letter-spacing:-.02em;color:#8B91A1;margin-left:2px}
.r18 .ssub{position:absolute;left:1340px;top:208px;font:700 26px 'JB';letter-spacing:.06em}
#rA .stat{color:#FF8E7D}#rA .ssub{color:#FF8E7D}
#rB .stat{color:#5FE0A8}#rB .ssub{color:#5FE0A8}

/* ---- S5 close ---- */
#catch{position:absolute;left:0;top:296px;width:1920px;text-align:center;font:800 156px/1.02 'BR';color:var(--ink);letter-spacing:-.04em}
#catch .ln{height:172px}
#catch .ln>span{font:800 156px/172px 'BR';letter-spacing:-.04em}
#catch em{font:400 176px/172px 'IS';font-style:italic;color:var(--blue);letter-spacing:-.01em}
#devrow{position:absolute;left:0;top:926px;width:1920px;text-align:center}
#devrow .ck{margin:0 10px;font-size:28px;padding:11px 18px}
#url{top:790px}
#bRej,#bVer{font-size:30px;padding:24px 20px;letter-spacing:-.02em}
```

#### E.11 `body4.html` — scene markup

```html
<div id="stage">

  <!-- S1 HOOK -->
  <div class="scene paper" id="s1">
    <div id="punchBg"></div>
    <div id="tA">
      <span class="ln"><span id="a1">Everything</span></span>
      <span class="ln"><span id="a2">said <span class="okc">all good</span><span id="chk"><span class="f" id="chkG"><svg width="88" height="88" viewBox="0 0 104 104"><path d="M28 54 L45 71 L77 35" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="f" id="chkR"><svg width="88" height="88" viewBox="0 0 104 104"><path d="M33 33 L71 71 M71 33 L33 71" fill="none" stroke="#fff" stroke-width="11" stroke-linecap="round"/></svg></span></span></span></span>
    </div>
    <div id="tB">
      <div class="ln" id="b1w"><span id="b1">But customers</span></div>
      <div id="b2w"><span id="didnt">couldn’t.</span></div>
    </div>
    <div id="dash">
      <div class="dh"><span>TODAY’S CHECKS</span><span class="ck g" id="dChip">ALL PASSED</span></div>
      <div class="dr" id="d1"><i>✓</i>Page loads</div>
      <div class="dr" id="d2"><i>✓</i>Pay button is there</div>
      <div class="dr" id="d3"><i>✓</i>No errors</div>
    </div>
    <div id="m1"><div class="scaler" id="m1s"><div id="h1hatch"></div><div id="h1strip"></div><div id="h1box"></div></div></div>
    <div id="chip1" class="ck rd">Pay button covered</div>
    <div id="flash1"></div>
  </div>

  <!-- S2 THE LIST vs THE SCREEN -->
  <div class="scene paper" id="s2">
    <div class="hw" id="hs1" style="left:96px">They read a <em>list.</em></div>
    <div class="hw" id="hs2" style="left:96px">Customers see the <em>screen.</em></div>
    <svg id="eyeIc" viewBox="0 0 300 300"><g fill="none" stroke="#0E0F13" stroke-width="15" stroke-linecap="round"><circle cx="150" cy="150" r="104"/><circle cx="150" cy="150" r="68"/><path d="M150 12 V52"/><path d="M150 248 V288"/><path d="M12 150 H52"/><path d="M248 150 H288"/></g><circle cx="150" cy="150" r="26" fill="#2F4BFF"/></svg>
    <div class="hw" id="hs3" style="left:236px">Spectra <em>looks</em> at the screen.</div>

    <div class="vcard" id="cL"><span class="ck n lab">WHAT THE SOFTWARE READS</span>
      <div class="li" id="li1" style="top:92px">Page header<b>✓</b></div>
      <div class="li" id="li2" style="top:180px">Product cards<b>✓</b></div>
      <div class="li" id="li3" style="top:268px">Pay button<b>✓</b></div>
      <div class="li" id="li4" style="top:356px">Footer<b>✓</b></div>
      <span class="ck g" id="cLchip" style="position:absolute;left:34px;top:490px">ALL FOUND · ALL PASS</span>
    </div>
    <div class="vcard" id="cR"><span class="ck n lab" id="cRlab">WHAT THE CUSTOMER SEES</span><span class="ck r" id="cvChip" style="position:absolute;right:34px;top:28px">✕ PART IS HIDDEN</span>
      <div class="crop"><div id="cvApp"></div><div id="cvScan"></div></div>
      <div class="cnote">A bar sits on top of the Pay button.</div>
      <div id="vf"><i></i><i></i><i></i><i></i></div>
    </div>
  </div>

  <!-- S3b SAY A RULE -->
  <div class="scene paper" id="s3b">
    <div class="hw" id="hb1" style="left:70px"><span class="stp">STEP 1</span>Say a rule.</div>
    <div id="mic"><svg viewBox="0 0 100 114" fill="none" stroke="#F2EDE2" stroke-width="8" stroke-linecap="round"><rect x="32" y="4" width="36" height="62" rx="18"/><path d="M14 54 C14 90 86 90 86 54"/><path d="M50 90 V110 M32 110 H68"/></svg></div>
    <div id="wave"></div>
    <div id="tr"><div class="lb">YOU SAY</div><div id="trT"><span id="trTxt"></span><i class="cur"></i></div></div>
    <svg id="arrow" viewBox="0 0 120 80" fill="none" stroke="#2F4BFF" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M60 6 V62 M34 40 L60 66 L86 40"/></svg>
    <div id="arrowL">Spectra remembers it</div>
    <div id="ct"><div class="fn">RULE SAVED</div><div id="ctChip" class="ck gd">✓ ACTIVE</div>
      <div class="rb"><svg viewBox="0 0 100 100" fill="none" stroke="#5FE0A8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M50 8 L86 22 V50 C86 74 68 88 50 94 C32 88 14 74 14 50 V22 Z"/><path d="M32 52 L45 65 L70 38"/></svg><div class="rt">The Pay button must always be visible.</div></div>
      <div class="rs">checked on every screen · .spectra/invariants.json</div>
    </div>
  </div>

  <!-- S3c VIEWPORT -->
  <div class="scene paper" id="s3c">
    <div id="ruler"></div>
    <div class="hw" id="hc1" style="left:96px"><span class="stp">STEP 2</span>Two eyes look.</div>
    <div class="hw" id="hc2" style="left:96px">Both must agree.</div>
    <div class="hw" id="hc3" style="left:96px;color:var(--red)">9.6% hidden.</div>
    <div class="hw" id="hc4" style="left:96px;color:var(--red)">Rejected.</div>
    <div class="hw" id="hc5" style="left:96px"><span class="stp">STEP 3</span>Fix it.</div>
    <div class="hw" id="hc6" style="left:96px">Check again.</div>
    <div class="hw" id="hc7" style="left:96px;color:var(--green)">Zero hidden.</div>
    <div class="hw" id="hc8" style="left:96px;color:var(--green)">Approved.</div>

    <div class="cam" id="cam">
      <div id="vp">
        <div id="chrome">
          <i class="dot" style="left:20px;background:#ff5f57"></i><i class="dot" style="left:40px;background:#febc2e"></i><i class="dot" style="left:60px;background:#28c840"></i>
          <span class="ttl">What the customer sees</span>
          <span class="tab on" id="tab1" style="left:474px">Before fix</span>
          <span class="tab" id="tab2" style="left:610px">After fix</span>
          <span class="tab" id="tabS" style="left:732px">Compare</span>
        </div>
        <div id="scr">
          <div id="zin"><div id="appB"></div>
          <div id="rep"></div>
          <div id="bhatch"></div><div id="bstrip"></div><div id="bbox"></div><div id="bclip" class="ck rd">COVERED</div>
          <div id="scan"></div>
          <div id="sdiv"><i></i><div class="hd"></div></div></div>
        </div>
      </div>
    </div>

    <div id="panel">
      <div class="ph"><span>SPECTRA</span><i class="chip">Rule: Pay button visible</i></div>
      <div id="vz">
        <div class="vb" id="bAna">LOOKING…</div>
        <div class="vb" id="bRej">REJECTED · 9.6% HIDDEN</div>
        <div class="vb" id="bVer">APPROVED · 0% HIDDEN</div>
      </div>
      <div class="ins" style="top:160px"><span class="ch" id="chA">EYE 1</span><span class="sb">finds the shape<small>SAM 3.1</small></span><div class="big" id="nA">0<u>px</u></div></div>
      <div class="ins" style="top:298px"><span class="ch" id="chB">EYE 2</span><span class="sb">matches the picture<small>PIXEL MATCH</small></span><div class="big" id="nB">0.00<u>%</u></div></div>
      <div id="agree"><span>both eyes</span><b>✓ AGREE</b></div>
      <div id="gauge"><div class="gl">HIDDEN</div><div class="gv"><span id="gval">0.00</span><u>%</u></div><div class="gt"><div id="gfill"></div><div id="gtick"></div></div><div id="gnote">allowed: up to 1.35%</div></div>
    </div>

    <div id="pulse"></div>
    <div class="sl" id="splitL"><span class="rs">BEFORE · COVERED</span></div><div class="sl" id="splitR"><span class="gs">AFTER · CLEAR</span></div>
    <svg id="cursor" viewBox="0 0 46 46"><path d="M4 3 L4 32 L12 25 L18 39 L24 36.5 L18 23 L29 23 Z" fill="#0E0F13" stroke="#fff" stroke-width="3" stroke-linejoin="round"/></svg>
  </div>

  <!-- S4 PROOF: 18 hidden buttons -->
  <div class="scene dark" id="s4">
    <div id="h4">18 hidden buttons. <em>Who spots them?</em></div>
    <div class="r18" id="rA" style="top:236px"><div class="t">Normal checks<small>standard DOM test</small></div><div class="tiles"></div><div class="stat"><span class="sv">0</span><u>/18</u></div><div class="ssub">CAUGHT</div></div>
    <div class="r18" id="rB" style="top:610px"><div class="t">Spectra<small>~480 ms per check</small></div><div class="tiles"></div><div class="stat"><span class="sv">0</span><u>/18</u></div><div class="ssub">CAUGHT</div></div>
    <div class="lottie" id="lotS" style="left:1432px;top:536px;transform:scale(1.2)"></div>
  </div>

  <!-- S5 CLOSE -->
  <div class="scene paper" id="s5">
    <div id="catch"><div class="ln"><span id="ct1">Catch it before</span></div><div class="ln"><span id="ct2"><em>your customers</em> do.</span></div></div>
    <svg id="logoIc" viewBox="0 0 300 300">
      <g fill="none" stroke="#0E0F13" stroke-width="13" stroke-linecap="round">
        <circle cx="150" cy="150" r="104"/><circle cx="150" cy="150" r="68"/>
        <path d="M150 12 V52"/><path d="M150 248 V288"/><path d="M12 150 H52"/><path d="M248 150 H288"/>
      </g>
      <circle cx="150" cy="150" r="26" fill="#2F4BFF"/>
    </svg>
    <div id="brand"></div>
    <div id="tag"><span class="wd" id="wd1">See</span><span class="wd" id="wd2">what</span><span class="wd" id="wd3">your</span><span class="wd acc" id="wd4">customers</span><span class="wd" id="wd5">see.</span></div>
    <div id="url"><div id="urlbox"><i class="dt5"></i><span id="urltxt"></span><i id="caret"></i></div></div>
    <div id="devrow"><span class="ck b" id="dv1">RUNS IN YOUR CLI</span><span class="ck b" id="dv2">WORKS IN CI</span><span class="ck b" id="dv3">MCP FOR CODING AGENTS</span></div>
    <div class="lottie" id="lotLogo" style="left:760px;top:6px"></div>
  </div>

  <div id="capw"><div id="cap"><span id="capT"></span></div></div>
  <div class="wipe" id="w1"></div><div class="wipe" id="w4"></div><div class="wipe" id="w5"></div>
</div>
```

The base CSS (`:root` tokens, `.scene`, `.paper` dot grid, `.wipe`, captions, app-mock styles, chip/bar system) and the helper functions (`appHTML`, `ringJSON`, `mkRing`) live in `index4.html`, which is included in the zip as the single self-contained reference build.

---
*End of guide. If you hand this to another agent, hand it the zip too: it contains the exact working project (minus `node_modules` and model weights, which the commands above reinstall).*