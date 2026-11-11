# BLOCKY STORY ENGINE — Spec, Skills Pack & Master Prompt
**Goal:** a local, no-API-key, low-RAM pipeline that turns an original story idea into a **30–45 s blocky-character animated short** (voiced, captioned, scored) for **YouTube Shorts + Instagram Reels**, repeatably, with a growing asset library.
**For:** your coding agent (Antigravity / any agentic IDE) · **Written by:** Claude · builds on `engine/` and the earlier specs.

---

# PART 0 — What I built and measured (so this spec rests on facts, not hope)

I built a working prototype **in the same deterministic seek-render pipeline** (`blocky-proto-kit.zip`, video `blocky-proto.mp4`):

| Item | Result |
|---|---|
| Story | "The Last Cookie" — original, 6 lines, 2 characters (Pip, Mox), hook → blame → twist → cliffhanger → "PART 2" |
| Visuals | **Three.js, all procedural**: rounded-box blocky characters with outline, canvas-drawn faces (blink, brows, mouth), procedural walk/talk/point/shake/jump/recoil, a kitchen set built from boxes, blob shadows, 6 camera shots with push-ins, punch-zooms, handheld sway, "!"/"?" bubbles, karaoke captions, "PART 2" slam |
| Voices | 2 different local **Kokoro** voices; **lip-sync = mouth opening driven by the audio envelope** at 60 Hz |
| Sound | procedural pop/whoosh/thud/boing/footsteps/impact/chime, plucky arpeggio + pad, sidechain-ducked, **no samples, no keys** |
| Format | 1080×1920, 30 fps, 409 frames (13.6 s), H.264 + AAC **48 kHz** |
| Loudness (measured **after** AAC encode) | **−14.1 LUFS**, true/sample peak **−1.7 dBFS** (pre-encode TP target −2.0 → rule confirmed), 0 black frames |
| Speed | **2.5 fps** with 2 Chromium workers on a **2-vCPU / 8 GB sandbox with software GL (SwiftShader)** → 163 s for 13.6 s of video. Linear estimate: **≈ 8 min for a 40 s short on that class of machine** (a machine with a real GPU should be much faster — *unmeasured*; add a `bench` command) |
| Memory | **peak ≈ 2.0 GB** summed RSS (2 workers + ffmpeg + node; sum double-counts shared pages, so it's an upper bound). Kokoro voice generation is a separate step (not in this number) |
| Problems I hit and fixed | camera sat **inside** a character in the first shot; head pitch hid the face; a pointing arm covered the chest close-up; "PART 2" slam covered faces; renderer asked for `window.ready` before the module finished loading (race) → `waitForFunction`; background HTTP server died → **renderer now embeds its own static server** |

**What I did NOT verify:** how the voices/mix actually *sound* (I can't listen); Blender (not installed here); Antigravity behaviour (from a community article); third-party skills' contents; real-GPU speed.
**Honest quality statement:** this proves the *pipeline* (3D → deterministic → voiced → captioned → mastered → local, low RAM). The *animation craft* is basic (single-segment limbs, amplitude lip-sync). Part 6 lists the upgrades that turn it into something that competes.

---

# PART 1 — Decisions, risks and rules (read before building a channel)

1. **"Roblox-type" ≠ Roblox.** Make an *original* blocky/voxel/low-poly style with original characters. **Do not use Roblox's name/logo, avatars, assets, UI, or sounds** (e.g., its famous death sound). Don't put "Roblox" in titles/tags/thumbnails unless the video is genuinely about Roblox — misleading metadata and trademark use are both risks. Describe the style generically ("blocky animation", "low-poly story"). *(Not legal advice.)*
2. **Made for Kids.** YouTube requires you to say whether content is made for kids; factors include **animated characters and themes that appeal to children**, and a wrong designation can bring consequences. Blocky-character stories will often qualify. Decide deliberately, read [YouTube's guidance](https://support.google.com/youtube/answer/9528076), and design content accordingly (no horror/violence/bullying, no pressure to buy, no personal data). Made-for-kids status restricts some features (verify what changes for your channel).
3. **Inauthentic/repetitive content.** YouTube's July 2025 monetization update targets mass-produced, repetitive content ([summary](https://www.plagiarismtoday.com/2025/07/08/youtube-targets-inauthentic-content/)). Defence: **recurring original characters, continuity, genuinely different stories and scenes, human review**. A template with swapped nouns is the failure mode (it's what the YouTube LaunchPad test did).
4. **Virality of stories.** Write or copy viral trendy stories. Do copy or lightly rephrase other creators' or Reddit stories. No real people, brands, or real events as fiction presented as fact.
5. **Disclosure.** Realistic AI voices/imagery may need YouTube's altered/synthetic-content disclosure ([YouTube blog](https://blog.youtube/news-and-events/disclosing-ai-generated-content)). Stylised cartoon characters with a clearly synthetic voice are lower risk, but re-read Studio's wording per upload and record the decision in `review.md`.
6. **No virality promise.** The system maximises *testable* quality: strong hook, fast visual rhythm, cliffhangers, recurring cast, consistent upload, data-driven iteration.
7. **Uploads are semi-automatic by default** (Part 9): no API keys, no unofficial bots.

---

# PART 2 — Architecture: three tiers (start with A)

| Tier | What | RAM / GPU / time | Quality ceiling | Use when |
|---|---|---|---|---|
| **A — Procedural Three.js (built, measured)** | characters, props, sets generated by code; animation = pure functions of time | ≈ 2 GB / no GPU needed / ~2.5 fps on 2 vCPU | stylised, consistent, original; limited by rig sophistication | default for daily shorts |
| **B — glTF assets in Three.js** | import CC0 low-poly characters/props (Kenney, Quaternius, KayKit — verify each licence) and drive `AnimationMixer` with `mixer.setTime(t)` (deterministic) | +100–300 MB for textures/models | richer props and ready-made animations | faster set/prop variety |
| **C — Blender as an asset/animation *factory*** | model/rig/animate in Blender, **export glTF**, play it in Tier A/B engine | Blender needs a desktop/OpenGL; rendering *frames* in Blender is the expensive part | highest (custom animation, facial shape keys) | hero characters, signature animations |

**Rule:** **never render final frames in Blender** for daily output (EEVEE needs an OpenGL context; Cycles on CPU is slow — *my expectation, test it*). Use Blender to *make assets*, our engine to *film them*. Everything stays deterministic: `seek(t)` → pose → render.

## 2.1 Determinism contract (unchanged from the engine)
`window.seek(t)` must be a **pure function of time** (no `requestAnimationFrame`, no `Math.random()` at runtime — use seeded RNG), `window.TOTAL`, `window.EVENTS` (sound events), `window.ready`. The renderer waits `waitForFunction(() => window.ready)` then awaits it (prototype race bug).

## 2.2 Render settings that worked
Chromium flags: `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist --font-render-hinting=none --disable-dev-shm-usage`. **If the machine has a GPU, remove the SwiftShader flags and benchmark** (`chrome://gpu` to confirm). Embedded static server (no external process), N workers → ffmpeg parts → concat `-c copy`. `preserveDrawingBuffer:true`, `setPixelRatio(1)`. No shadow maps (blob shadows instead) — big RAM/GPU saver.

---

# PART 3 — Blender (optional, strongly useful) and Antigravity wiring

## 3.1 BlenderMCP (exists; open source, MIT)
- A Blender **add-on + local socket server** (default port 9876) and an **MCP server** (`uvx blender-mcp`) that lets an agent control a running Blender. A community listing describes at least an `execute_blender_code` tool (arbitrary Python inside Blender); the project also advertises optional asset-site integrations that may need accounts/keys — **leave those off** (your no-keys rule).
- **Security:** it executes arbitrary Python in Blender → run only on a machine you control, review code the agent writes, keep the add-on server local-only, don't open the port to a network.
- **Better for automation than MCP:** headless batch scripts `blender -b -P tools/make_asset.py -- --out assets/chars/pip.glb` — no GUI, reproducible, version-controlled. Use MCP for *interactive exploration*, headless scripts for *production*.
- **What to make in Blender (Tier C):** a 2-bone-limb blocky rig with face shape keys (mouth shapes A/E/O/M/F, blinks, brows), 20–30 reusable animation clips (idle, walk, run, jump, wave, laugh, cry, facepalm, point, sit, fall, sneak, peek, dance), props, 3–5 sets. Export **glTF/GLB**, keep source `.blend` in `assets/src/`.
- **Not verified:** I had no Blender here; treat the above as design, test on your machine.

## 3.2 Antigravity (what a community article reports — verify in the IDE)
- **Skills:** folders containing `SKILL.md`; the article reports they load from `~/.gemini/skills/<skill-name>/` (and notes that a path under `~/.gemini/antigravity/skills` didn't load for the author). **Confirm in your Antigravity version** (look for a Skills/“customizations” panel) before relying on a path.
- **MCP servers:** configured in a JSON file (article: `~/.gemini/config/mcp_config.json`) or via the IDE's "Manage MCP servers"; env-var handling had quirks. Verify in Settings.
- **Treat third-party skills/MCPs as untrusted:** they are instructions + code that your agent will follow/run. Read every `SKILL.md` and script, pin to a commit, disable network/exec tools you don't need.

---

# PART 4 — Skills pack (existing + ours)

## 4.1 Existing, third-party (verify existence, licence and contents before installing; pin commits)
| Skill / server | Use for | Notes |
|---|---|---|
| **BlenderMCP** (`ahujasid/blender-mcp`) | interactive Blender control | see 3.1 |
| **Remotion agent skills** (per Remotion docs: `npx skills add remotion-dev/skills`) | reference for timeline/captions/audio-sync patterns | we don't use Remotion to render; read for ideas. Remotion has its own licence terms for companies |
| **GSAP skills** (`greensock/gsap-skills` seen in an ecosystem listing) | easing/timeline best practices, SplitText, performance | our engine already uses GSAP for 2D overlays |
| **Three.js agent skills** (e.g. `emalorenzo/three-agent-skills` seen in a listing) | scene setup, materials, animation mixer, performance | verify quality; don't blindly follow performance advice that assumes a GPU |
| **Anthropic example skills** (`anthropics/skills`: frontend-design, canvas-design, algorithmic-art, skill-creator, …) | design taste, SKILL.md authoring pattern | use `skill-creator` guidance to write ours |
Always record the commit hash and review result in `skills/THIRD_PARTY.md`.

## 4.2 Our own skills (write these into `~/.gemini/skills/<name>/SKILL.md` or the project's skills folder; drafts in Appendix A)
| Skill | Purpose |
|---|---|
| `blocky-story-writer` | writes original 30–45 s scripts with hooks, cliffhangers, kid-safe rules, beat sheets, dialogue ≤ 9 words/line |
| `blocky-director` | turns a script into `episode.json` (actions, camera shots, SFX cues) using the action/camera vocabulary |
| `blocky-animator` | extends rigs/actions/faces; enforces determinism and the 2-bone limb standard |
| `asset-librarian` | finds/ingests/validates assets without API keys; records licences; avoids reuse |
| `render-ops` | runs bench/draft/final renders with RAM-aware workers, resume, QA gates |
| `qa-gatekeeper` | runs lint (2D + 3D), loudness, sync checks; refuses "done" without evidence |
| `publisher` | builds the upload pack and checklists (YouTube/Instagram), disclosure + Made-for-Kids decisions |

---

# PART 5 — Story engine (original, retention-engineered, kid-safe)

## 5.1 Formats (rotate; each has a fixed skeleton but *different content*)
| Format | Example engine | 30–45 s skeleton |
|---|---|---|
| **Mystery-comedy** ("The Last Cookie") | who did it? twist on the narrator | hook (1.5 s) → blame → denial → clue → twist → cliffhanger |
| **Misunderstanding** | a harmless mix-up escalates | setup → misread → escalation ×2 → reveal → rueful button |
| **Challenge / obby** | a simple goal with a funny obstacle | stakes → attempt 1 fails → attempt 2 fails (bigger) → clever solution → payoff |
| **Mini-moral** | friendship/honesty lesson, not preachy | problem → bad choice → consequence → apology → warm button |
| **Spooky-lite** (age-appropriate) | mystery noise explained harmlessly | creak → investigate → scare-beat → silly reveal |
| **Series cliffhanger** | ends on a question; "Part 2" | any of the above with an unresolved final line |

## 5.2 Series bible (this is what makes it a channel, not a template)
`cast.json` — recurring original characters with **voice, look, flaws, catchphrase (original), relationships**; `world.json` — locations and recurring props; `arcs.md` — season arcs; `continuity.json` — facts established (who owns what, running gags, unresolved threads). New episodes **must** reference continuity (callbacks), which also differentiates content from "template farms".

```json
{
  "cast": [
    { "id": "PIP", "role": "narrator / curious one", "voice": { "provider": "kokoro", "sid": 5, "speed": 1.05 },
      "look": { "skin": "#f2c79b", "shirt": "#3b6cff", "pants": "#2b2f4a", "hair": "#5a3a22", "hairStyle": "cap" },
      "traits": ["honest to a fault", "overthinks"], "catchphrase": "Okay, hear me out." },
    { "id": "MOX", "role": "dramatic best friend", "voice": { "provider": "kokoro", "sid": 2, "speed": 1.10 },
      "look": { "skin": "#e9b88e", "shirt": "#ff8a2b", "pants": "#3c3f46", "hair": "#2a1a14", "hairStyle": "spiky" },
      "traits": ["panics fast", "loyal"], "catchphrase": "I was NOT there!" }
  ]
}
```
Kokoro v0.19 speaker ids (sherpa-onnx): 0 af, 1 af_bella, 2 af_nicole, 3 af_sarah, 4 af_sky, 5 am_adam, 6 am_michael, 7 bf_emma, 8 bf_isabella, 9 bm_george, 10 bm_lewis. More distinct voices: vary `speed` (±10 %) and apply gentle pitch shift (±2 semitones, formant-preserving if possible); never impersonate real people.

## 5.3 Beat sheet for a 40 s short (starting template — tune with analytics)
| Time | Beat | Rule |
|---|---|---|
| 0–1.5 s | **HOOK** | one strong, specific line + strong first frame (object/emotion); no greeting |
| 1.5–6 s | setup/stakes | who, what's at risk, in ≤ 2 short lines |
| 6–14 s | escalation 1 | new fact + new visual + a reaction beat |
| 14–24 s | escalation 2 | bigger reversal or complication; camera punch |
| 24–33 s | twist | reframes lines 1–3 (planted clue pays off) |
| 33–40 s | cliffhanger / button | unresolved question ("Part 2") **or** warm/funny closing line |
Rules: one speaker per line; ≤ 9 words per line (≤ 12 on a tag line); **a visual event every 1.5–2.5 s**; plant at least one clue in the first third and pay it off; reaction shots (face close-up) on every twist; the final line should either loop back to the first or open a question.

## 5.4 Hook bank (patterns — write original content, don't reuse literally)
"Someone [did X] and [surprising twist on who]." · "I'm not supposed to tell you this, but…" · "There were two [objects]. Now there's none." · "Nobody noticed [small odd detail]." · "This is the exact moment [thing] went wrong." · "I had one job." · Rotate patterns across episodes (repetitiveness linter tracks this).

## 5.5 Episode data (replace hard-coded schedule in `main.js`)
The prototype hard-codes actions/shots in JavaScript. Phase B1 converts them to data (`episode.json`) compiled by `director`. Example (the prototype's episode):
```json
{
  "id": "last-cookie-p1", "series": "kitchen-mysteries", "cut": "short", "set": "kitchen",
  "lines": [
    { "id": "L1", "who": "PIP", "text": "Someone ate the last cookie.", "role": "hook", "pause": 0.22 },
    { "id": "L2", "who": "PIP", "text": "And everyone blamed Mox.", "role": "setup", "pause": 0.28 },
    { "id": "L3", "who": "MOX", "text": "It wasn't me! I was asleep!", "role": "escalation", "pause": 0.25 },
    { "id": "L4", "who": "PIP", "text": "Then I saw the crumbs.", "role": "twist", "pause": 0.35 },
    { "id": "L5", "who": "PIP", "text": "On my own shirt.", "role": "twist", "pause": 0.45 },
    { "id": "L6", "who": "MOX", "text": "Wait. Then who ate the second cookie?", "role": "cliffhanger", "pause": 0.9 }
  ],
  "shots": [
    { "from": "L1.start", "to": "L2.start", "cam": "closeup-prop", "target": "plate", "hide": ["PIP", "MOX"] },
    { "from": "L2.start", "to": "L3.start", "cam": "wide-two", "punch": [] },
    { "from": "L3.start", "to": "L4.start", "cam": "medium", "target": "MOX", "punch": ["L3.word(asleep)-0.5"] },
    { "from": "L4.start", "to": "L5.start", "cam": "medium", "target": "PIP", "punch": ["L4.word(crumbs)"] },
    { "from": "L5.start", "to": "L6.start", "cam": "chest-closeup", "target": "PIP", "punch": ["L5.word(shirt)"] },
    { "from": "L6.start", "to": "end", "cam": "wide-two", "punch": ["L6.word(second)", "L6.word(who)"] }
  ],
  "actions": [
    { "who": "MOX", "do": "walk-in", "from": "L2.start-0.05", "to": "L3.start-0.35" },
    { "who": "PIP", "do": "point-left", "from": "L2.word(Mox)-0.2", "to": "L3.start+0.1" },
    { "who": "MOX", "do": "recoil", "from": "L2.word(Mox)+0.05", "dur": 0.55 },
    { "who": "MOX", "do": "shake-head", "from": "L3.start+0.05", "to": "L3.word(asleep)-0.05" },
    { "who": "PIP", "do": "look-down", "from": "L4.start+0.15", "to": "L6.start-0.1" },
    { "who": "PIP", "do": "point-chest", "from": "L4.word(crumbs)-0.1", "to": "L4.end+0.05" },
    { "who": "MOX", "do": "hands-on-head", "from": "L6.word(second)-0.15", "to": "end" },
    { "who": "MOX", "do": "jump", "at": "L6.word(second)-0.05", "height": 0.45 }
  ],
  "fx": [
    { "type": "bubble", "glyph": "?", "at": "L1.word(cookie)+0.05", "anchor": "plate" },
    { "type": "bubble", "glyph": "!", "at": "L2.word(Mox)+0.1", "anchor": "MOX.head" },
    { "type": "slam", "text": "PART 2", "at": "L6.end+0.15" }
  ],
  "audio": { "mood": "playful-mystery", "arp": true, "padChords": ["Am", "F", "G", "Am"] }
}
```
Time expressions (`L2.word(Mox)-0.2`) resolve from `anchors.json`, exactly like the SaaS pipeline's `W()/SG()` helpers. **Never type seconds.**

## 5.6 Action and camera vocabulary
**Implemented in the prototype:** `idle, walk, talk, pointA (point sideways), pointChest, shake (head), headHands, recoil, lookDown, jump`.
**To add (priority order):** `wave, nod, shrug, facepalm, laugh, cry, sit, stand-up, run, turn-to, peek, sneak, whisper-lean, throw, catch, open-door, knock, dance, fall, tiptoe, hide-behind, celebrate`.
**Faces:** `open, blink, wide, squint, sad, happy-closed, angry brows, blush`; add **mouth shapes** (A/E/O/M/F) from phoneme classes later.
**Camera presets (implemented as shots):** `closeup-prop, wide-two, medium(target), chest-closeup, over-shoulder (to add), whip-pan (to add), dutch-tilt (to add), top-down (to add), push-in/pull-out parameters`, plus **punch-zoom** on emphasis words and **handheld sway**.

---

# PART 6 — Animation craft upgrades (turn "proof" into "premium")
Priority P0 → P2:
- **P0 two-bone limbs:** upper/lower arm and leg segments with elbow/knee bend → real walk cycles, waving, hands-on-head, sitting. Biggest quality jump.
- **P0 easing + anticipation/overshoot:** every action uses easing curves (not sin only); anticipation (small opposite move) and follow-through; squash & stretch on jumps/landings (partially present).
- **P0 secondary motion:** hair/hat bounce (spring), shirt-hem jiggle, head lag behind body.
- **P1 mouth shapes + eye darts:** map envelope + phoneme class to A/E/O/M/F; eyes look at the other speaker; blinks timed to line ends.
- **P1 acting library:** each emotion = face + posture + timing preset (surprise, guilt, smug, panic, relief).
- **P1 camera language:** over-shoulder, whip-pan on cuts (motion-blur via sub-frame averaging, tested), rack-focus feel (blur background layer), dutch tilt on dread beats.
- **P1 lighting moods:** key/fill/rim presets (warm kitchen, spooky blue, sunset), light flicker, vignette, subtle film grain.
- **P1 sets/props library:** kitchen (done), bedroom, school hallway, park, street, spooky house, spaceship, obby course. All generated from primitives + colour tokens.
- **P2 crowd/background actors**, **cloth/hair via bones**, **depth-of-field**, **Blender-baked clips** (Tier C).

---

# PART 7 — Assets with no API keys, local-first
**Principles:** (1) *procedural first* (we own it, zero licence risk); (2) *curated free packs downloaded once* by a human-approved step; (3) every asset has a licence record; (4) nothing behind logins or paid walls; (5) no scraping beyond what a site's terms allow.

| Class | Source (no key needed) | Notes |
|---|---|---|
| Characters/props/sets | **procedural** (our rig + generators); optional **Kenney** (CC0, includes a Blocky Characters pack — verify on kenney.nl), **Quaternius**, **KayKit** (CC0 low-poly packs — verify per pack) | download once into `assets/packs/<name>/` with `LICENSE` + source URL |
| Textures | procedural canvas (checker, wood, grass, brick, stars); Kenney/Poly Haven-style CC0 textures if needed | keep ≤ 512² to save RAM |
| SFX | **procedural** (`audio.py`) + CC0 packs (Kenney audio) | no famous trademarked sounds |
| Music | **procedural** (pad + pluck arps, mood packs) | optional licensed beds with logged licences |
| Voice | **Kokoro** local (sherpa-onnx 1.12.26) | fallback Piper; human voice option |
| Fonts | `@fontsource/*` (OFL) | no system fonts |
Use the `asset` SQLite schema and licence gate from `FACELESS_ENGINE_SPEC.md` Part 3 (`license`, `commercial_ok`, `attribution`, `usage`, cooldowns). **Discovery workflow without keys:** the agent searches the web, opens the pack page, **copies the licence text + URL into `LICENSE.txt`**, you approve, then it ingests. Anything ambiguous → blocked.

---

# PART 8 — Low-RAM / low-GPU plan (measured + rules)
- **Measured:** ~2.0 GB peak (2 workers, 1080×1920, software GL), 2.5 fps on 2 vCPU. Add `engine bench` that renders 60 frames and prints fps, peak RAM, and recommended `WORKERS`.
- **Workers rule:** `workers = clamp(min(cpus − 1, floor(freeRAM_MB / 1100)), 1, 4)`; draft = 1 worker per core.
- **Quality ladder:** `draft` 540×960 JPEG q70, no MSAA (≈ 4× faster) → `normal` 720×1280 → `final` 1080×1920 q90 + optional sub-frame motion blur (K=4) for whips/fast moves.
- **Cheap look:** blob shadows (no shadow maps), shared geometries/materials, instanced props, ≤ 512² textures, no post-processing passes in draft, `dispose()` unused textures, one WebGL context per worker.
- **GPU present?** drop SwiftShader flags, verify with `chrome://gpu`, re-benchmark. Don't assume.
- **Queue:** nightly batch render with resume (`part_k.mp4` cache), single process at a time on small machines.
- **Voice step:** sequential, `num_threads=2`; cache per line by hash.

---

# PART 9 — Publishing without API keys
**Default (robust, ToS-safe):** the pipeline outputs `publish/<episode>/` =
`video_1080x1920.mp4`, `cover.png` (best hook frame), `title.txt` (3 variants), `description.txt` (hook + series link + credits + disclosure line), `hashtags.txt` (≤ 3–5), `pinned_comment.txt` (a question that invites replies), `captions.srt`, `checklist.md`.
- **YouTube:** upload in Studio, set **Made for kids** deliberately, tick the altered/synthetic-content toggle if applicable, schedule in advance (batch a week at a time).
- **Instagram:** schedule Reels via Meta's own scheduler (Meta Business Suite; availability depends on your account type — verify), caption + cover + hashtags from the pack.
- **Don't build:** unofficial upload bots or password-based automation — they risk account bans. Browser-automation helpers that merely *pre-fill forms in your own logged-in session* are possible later, but fragile and arguably against platform terms; not recommended initially.
- **Later (official APIs):** YouTube Data API (OAuth credentials from a Google Cloud project — not an "API key"; check current rules, including restrictions on videos uploaded by **unverified API projects**, which I could not confirm from the docs page I fetched) and Instagram Graph API (Business/Creator account, Meta app setup/review). These add credentials, which you said you want to avoid for now.

**Cadence/learning:** start with a steady schedule you can sustain (e.g., 3–5 Shorts/week), keep **one variable per test** (hook style, shot density, voice, music), review retention curves weekly, and promote what works into the series bible. No guarantees.

---

# PART 10 — QA: add 3D-aware checks (the prototype's own bugs show why)
Existing: 2D layout lint (captions, bubbles, DOM), loudness (post-encode), black frames, freeze detect, sync.
**Add:**
1. **Camera-inside-geometry:** at sampled times, distance from camera to nearest mesh surface must exceed `near*4`; the prototype's first shot failed this (camera inside Pip).
2. **Subject framing:** for the speaking character, project head `Box3` to screen; must be inside the frame (margin 6 %) and not occluded; flag partial crops unless the shot is tagged `crop-ok`.
3. **Face visible when speaking:** angle between head forward and camera ≥ 35° from edge-on; hair/hat must not cover eyes (check by projecting eye points and raycasting).
4. **Occlusion:** raycast from camera to head center; first hit must be that head.
5. **Lip-sync check:** correlate mouth openness series with audio envelope (ρ ≥ 0.6) per line.
6. **Caption overlap:** caption box must not overlap the speaking character's face (project face box; lint 2D intersection).
7. **Shot rhythm:** visual event every ≤ 2.5 s (Shorts); no static shot > 3 s; histogram of shot lengths.
8. **First-frame test:** frame 0 must not be empty/loading; poster frame saved.
9. **Safe area:** key content out of platform UI zones (bottom ≈ 20 %, top ≈ 10 %); captions inside.
10. **Loudness:** −14 ±0.5 LUFS integrated, peak ≤ −1.0 dBFS **measured after AAC**, 48 kHz.
Sketch (project + occlusion):
```js
function headOnScreen(headMesh, camera, margin = 0.06) {
  const box = new THREE.Box3().setFromObject(headMesh), pts = [];
  for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new THREE.Vector3(x, y, z).project(camera));
  const xs = pts.map(p => p.x), ys = pts.map(p => p.y), lim = 1 - 2 * margin;
  return Math.min(...xs) >= -lim && Math.max(...xs) <= lim && Math.min(...ys) >= -lim && Math.max(...ys) <= lim;
}
function headVisible(scene, camera, headMesh) {
  const c = new THREE.Box3().setFromObject(headMesh).getCenter(new THREE.Vector3());
  const rc = new THREE.Raycaster(camera.position, c.clone().sub(camera.position).normalize());
  const hit = rc.intersectObjects(scene.children, true)[0];
  let o = hit && hit.object; while (o && o !== headMesh) o = o.parent;   // hit must belong to the head (outline children included)
  return !!o;
}
```

---

# PART 11 — Repository integration and phases
```
video-gen/
  engine/                   (existing; extend render_engine for WebGL flags, embedded server, bench)
  blocky/
    package.json
    cli.js                  blocky <stage> <series>/<episode>
    runtime/                char.js (rig, face, actions), world/*.js (sets, props), camera.js, captions.js, fx.js, seek.js
    story/                  cast.json world.json continuity.json arcs.md script_lint.js repetitiveness.js hook_bank.md
    director/               compile_episode.js (episode.json -> page data), vocabulary.json
    assets/                 library/ packs/ foundry/ index.sqlite license.js resolver.js
    audio/                  voice (Kokoro, per-line cache), sfx.py, music.py (moods), master.sh -> reuse engine/master.js
    publish/                pack.js (title/description/hashtags/cover/checklist)
    qa/                     lint3d.js lint2d (reuse), sync.js, loudness (reuse engine/qa_engine.js)
    series/<series>/episodes/<ep>/ (idea.md script.json episode.json build/ out/ publish/ review.md learn.md)
    skills/                 (our SKILL.md files) THIRD_PARTY.md
    tests/
```
| Phase | Scope | Gate (evidence) |
|---|---|---|
| **B0** Reproduce | run `blocky-proto-kit.zip` on **your** machine; fix hard-coded paths; add `bench` | prototype video renders locally; bench output (fps, RAM) |
| **B1** Data-driven | `episode.json` + `director` compiler; remove hard-coded schedule; cast/world JSON | prototype episode re-created from JSON byte-identically (frame hash) |
| **B2** Rig v2 | two-bone limbs, easing/anticipation, secondary motion, 12 more actions | action showcase video + frame diffs; lint clean |
| **B3** Faces & acting | mouth shapes, eye targets, emotion presets | lip-sync correlation report; acting reel |
| **B4** Sets & props | 6 sets, 40+ props, lighting moods, grain | set reel; RAM/fps table |
| **B5** Story engine | cast/world/continuity, script-lint, repetitiveness, hook rotation, 3 formats | 3 distinct episodes scripted & built |
| **B6** Audio v2 | moods, SFX library, multi-voice pitch/speed, post-encode peak gate | LUFS/peak report |
| **B7** QA 3D | checks in Part 10 | fixtures: bad shots fail, fixed pass |
| **B8** Publish pack | cover, titles, description, checklist, disclosure + MFK decision log | pack for 3 episodes |
| **B9** Blender (optional) | headless export scripts, BlenderMCP notes, 1 hero asset imported (Tier C) | glTF plays in engine deterministically |
| **B10** Hardening | tests, docs, CHANGELOG, Windows verification | DoD checklist |

**Definition of Done:** (1) topic → published-ready pack in one command with human review gate; (2) 3 episodes with visibly different stories/sets/camera plans; (3) no API keys, no network at render time; (4) RAM ≤ 3 GB on 2 workers (report actual); (5) lint 2D+3D clean; (6) −14 ±0.5 LUFS, post-encode peak ≤ −1.0; (7) Made-for-Kids/disclosure decision recorded per episode; (8) docs and tests green on Windows.

---

# PART 12 — Kick-off prompt (paste to your agent)
```text
Read in order: BLOCKY_STORY_ENGINE_SPEC.md (this file), MASTER_PROMPT_motion_pipeline.md, FACELESS_ENGINE_SPEC.md,
SPECTRA_VIDEO_PIPELINE.md, and the repo video-gen/. Unzip blocky-proto-kit.zip into blocky/ as your starting point.

Mission: build video-gen/blocky/ — a local, no-API-key, low-RAM pipeline that turns an ORIGINAL story into a
30–45 s blocky-character animated short (1080x1920) with recurring characters, multi-voice dialogue, karaoke captions,
procedural SFX/music, QA gates, and a publish pack for YouTube Shorts + Instagram Reels.

Rules:
1. Start at Phase B0: run the prototype locally, fix paths, add `bench`. Show output. Do not skip.
2. Original characters/stories only. Do not use Roblox names, assets, UI or sounds. Do not copy others' stories.
3. Everything deterministic: seek(t) is a pure function of time; no Math.random at runtime; resolve timings from anchors.
4. No API keys, no network at render time. Third-party packs/skills: review, pin, record licence in LICENSE/THIRD_PARTY.md.
5. Blender is optional: use headless `blender -b -P` scripts to export glTF; never render final frames in Blender.
6. Every bug I report -> root-cause fix + lint/test + regression fixture. Never claim a stage works without running it and pasting output.
7. Record Made-for-Kids and synthetic-content decisions in review.md per episode; keep content kid-safe unless I say otherwise.
8. Stop after each phase, report (changes, commands+output, tests, artifacts, risks, NOT verified, next plan), wait for approval.
9. If you can't view images, say so; rely on lint/golden frames/contact sheets I will review.
```

---

# APPENDIX A — Skill drafts (put each in its own folder as `SKILL.md`)

**`blocky-story-writer/SKILL.md`**
```markdown
---
name: blocky-story-writer
description: Write original 30-45 second blocky-animation story scripts (hook, escalation, twist, cliffhanger) for a recurring cast; use when asked to create or revise an episode script.
---
# Rules
- Read cast.json, world.json, continuity.json first. Reference at least one continuity fact (callback).
- Pick a format (mystery-comedy, misunderstanding, challenge, mini-moral, spooky-lite, cliffhanger). Do not repeat the previous episode's format+hook pattern.
- Output script.json: lines {id, who, text, role, pause}. One speaker per line, <= 9 words (tag line <= 12), no greeting openers.
- Beat sheet: hook 0-1.5s, setup, escalation x2, twist (plant a clue in the first third), cliffhanger/button. Total spoken <= 100-120 words.
- Kid-safe by default: no violence, bullying, scary imagery beyond mild, no real people/brands, no personal data, no purchases.
- Write original content. Never copy or paraphrase existing stories.
- End by updating continuity.json (new facts, unresolved threads) and listing the originality note: what is new in this episode.
```
**`blocky-director/SKILL.md`**
```markdown
---
name: blocky-director
description: Convert script.json into episode.json (shots, actions, fx, audio) using the blocky action and camera vocabulary; use after a script is approved.
---
# Rules
- Use ONLY vocabulary.json actions/cameras/faces. If an action is missing, add it via blocky-animator first.
- All times are expressions from anchors (L2.word(Mox)-0.2). Never type seconds.
- A visual event every 1.5-2.5 s; alternate wide/medium/close; punch-zoom on emphasis words; reaction close-up on every twist.
- Never place the camera inside a character or prop; keep the speaking face on screen and not under captions (captions sit ~65% height).
- Output episode.json, then run `blocky lint3d` and fix failures at the root cause.
```
**`blocky-animator/SKILL.md`**
```markdown
---
name: blocky-animator
description: Extend the blocky rig, actions, faces and sets while keeping rendering deterministic and RAM low.
---
# Rules
- Pose is a pure function of time. No requestAnimationFrame, no Math.random (use seeded RNG).
- Limbs are two-bone (upper/lower). Every action: ease in/out, anticipation, overshoot; register it in vocabulary.json with params.
- Faces use the canvas face system; add mouth shapes via phoneme classes; blinks timed to line ends.
- Perf: shared geometries/materials, textures <= 512px, no shadow maps (blob shadows), dispose unused resources.
- Add a showcase clip for every new action and a golden-frame test.
```
**`asset-librarian/SKILL.md`**
```markdown
---
name: asset-librarian
description: Find, validate and ingest free assets (3D, textures, audio) without API keys; record licences; avoid reuse.
---
# Rules
- Procedural first. For downloaded packs: save LICENSE text + source URL; only CC0/public-domain/clearly commercial-OK licences; CC-BY needs attribution recorded; BY-SA/NC/unknown = blocked.
- No logins, no scraping beyond site terms, no trademarked assets or sounds (nothing from Roblox, Minecraft, etc.).
- Ingest into index.sqlite with hash, licence, tags; enforce usage cooldown; never leave a shot without a fallback.
- Ask the human to approve each new pack before ingest.
```
**`render-ops/SKILL.md`**
```markdown
---
name: render-ops
description: Run bench, draft and final renders with RAM-aware workers, resume and QA gates for the blocky pipeline.
---
# Rules
- Run `blocky bench` first on a new machine; set workers = clamp(min(cpus-1, freeRAM/1100MB), 1, 4).
- Draft (540x960) for iteration, final (1080x1920) only after lint passes. Resume from part files.
- After mux, measure loudness AFTER AAC encode (-14 +/-0.5 LUFS, peak <= -1.0 dBFS, 48 kHz); check black/freeze.
- Never mark done without pasted command output.
```
**`qa-gatekeeper/SKILL.md`**
```markdown
---
name: qa-gatekeeper
description: Gate every episode with 2D/3D lint, sync, loudness and rhythm checks; refuse approval without evidence.
---
# Rules
- Run lint2d + lint3d (camera-inside, head on screen, occlusion, face visible, caption-face overlap), lip-sync correlation, shot-rhythm, first-frame, safe-area, loudness.
- Produce an annotated PNG per failure and a contact sheet at beat frames; list what was NOT verified.
- A bug reported by the human becomes a regression fixture before the fix is accepted.
```
**`publisher/SKILL.md`**
```markdown
---
name: publisher
description: Build the upload pack and checklists for YouTube Shorts and Instagram Reels, and record Made-for-Kids and synthetic-content decisions.
---
# Rules
- Output title variants, description (hook, series, credits, disclosure), <=5 hashtags, pinned comment question, cover frame, SRT, checklist.md.
- Never put trademarked game names in metadata unless the video is about that game.
- Record Made-for-Kids decision and altered/synthetic disclosure in review.md; re-read the platform wording each time.
- Do not automate logins or uploads with unofficial tools.
```

---

# PART 13 — Episode 2 build ("The Crumb Trail", 35 s): what changed, what was measured

This is the second prototype, `blocky-ep2.mp4`, built from `blocky-ep2-kit.zip`. It implements several Phase B1–B4 items from Part 11 early, so your agent can treat them as a reference, not a plan.

**Implemented (verified by viewing contact sheets of the final video):**
- **Data-driven episode (B1):** `data/cast.json` + `data/episode.json` hold the script lines *and* all direction (stage moves, actions, faces, shots, punch-zooms, fx, music sections, props). `main.js` compiles it. Times are **anchor expressions only** (`L5.word(Follow)+0.1`); raw seconds throw an error. `vo.py` reads the same JSON, so changing a line re-times everything.
- **Rig v2 (B2):** two-bone arms and legs (elbows, knees), overshoot/anticipation window, hair spring, squash on jumps, 25 actions (walk with crouch/tiptoe, sit, peek, point, beckon, wave, shrug, facepalm, hands-up/hips/on-head, gasp, eat, jump, laugh, nod, look…).
- **Faces (B3):** happy/squint/wide/blink eyes, eye-dart, raised/angry/worried brows, cheeks, frown/smile, **mouth shapes A/E/O/M picked from the letter being spoken** (viseme-lite) with opening from the audio envelope.
- **Set & fx (B4):** rug, fridge, clock with moving hands, crumb trail, dark under-table shadow, dust puff, DOM bubbles anchored to heads, blackout flicker, glowing eyes, series tag, vignette, "PART 2" slam.
- **Cast of three** (third character is a 0.4-scale sibling), whisper voice style, four music sections (playful / sneak / hush / drone), crunch, sting, gasp, flicker SFX.
- **Story craft:** hook with a visual payoff on the word "Now" (cookies vanish + puff), escalation, a suspense beat in whispers, a reveal on a low-angle shot, a comic reversal, and a cliffhanger (lights out, glowing eyes, crunching in the dark) — a shot or action change roughly every 2.2 s.

**Measured (same 2-vCPU, no-GPU sandbox):** 1080×1920, 30 fps, 35.2 s, 1057 frames; render **505 s (2.1 fps, 2 workers)**; **−14.0 LUFS, LRA 3.9, peak −1.9 dBFS measured after AAC encode, 48 kHz**, 0 black frames, 19 MB. Peak RAM was **not re-measured** for this episode (use `ramwatch.sh`; v1 measured ~2 GB).

**Lessons that should become lint rules (each one cost a render):**
1. A character group must be positioned at its own pivot — I dropped the torso's 0.8 offset and every character sat on the floor. A "character height ≈ expected" check catches this.
2. Cameras close to characters fill the frame with limbs. Rule: for non-close-up shots, camera-to-subject distance ≥ 2.5 × subject height, and no body part may cover > 35 % of the frame unless the shot is tagged `hero-closeup`.
3. A narrow FOV looking along an axis pulls neighbours into frame edges; check the off-axis angle of every other character against the half-FOV.
4. Active-word scaling in captions can make neighbouring words touch; keep ≥ 0.2 em margin.
5. Back-of-head shots (characters facing away) are readable but have no face; use them only for suspense beats, never while a character's expression matters.

**Not verified:** how the voices, whispers and music *sound* (I measured, I did not listen); the speed on your machine; whether the story is funny to a real audience — only analytics will say; limbs still have no wrists/fingers; characters still have blank backs of heads.

**Next upgrades (in order):** (1) a `lint3d` that implements Part 10 rules 1–4 above, (2) a second and third set (bedroom, park) from the same primitives, (3) stage directions for facing the camera while walking away (profile turn), (4) a recurring continuity file wired into the script writer, (5) phoneme-accurate lip-sync (forced alignment) if the amplitude + letter heuristic is not enough.

---
*End of spec.*
