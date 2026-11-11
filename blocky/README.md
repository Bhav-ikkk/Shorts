# blocky story engine — v2 (Episode 2 "The Crumb Trail", ~35 s, 1080x1920)
No API keys. Local Kokoro voices. Everything else is procedural. Deterministic: `seek(t)` is a pure function of time.

## Data-driven
- `data/cast.json`     characters: voice (Kokoro sid + speed), scale, colours, hair style
- `data/episode.json`  lines + direction: stage (positions/turns), actions, faces, shots (cameras), punch-zooms, fx (bubbles, puff, dark, eyes, slam, sfx), music sections, props
- Every time is an anchor expression (`L5.word(Follow)+0.1`, `L10.end`, `end`). Raw seconds are rejected by the loader.

## Run
    npm i && npx playwright install chromium
    pip install numpy scipy sherpa-onnx==1.12.26     # + Kokoro model dir (vo.py: M=...)
    python vo.py          # wavs + data/anchors.json + data/lip.json   (reads cast.json + episode.json)
    OUT=out/s node shots.js 3.5 12.4 19.4            # stills for visual QA (python sheet.py out/s out/sheet.png 6)
    WORKERS=2 node render.js                         # out/silent.mp4 + data/events.json
    python audio.py                                  # out/mix.wav + out/<NAME>.srt
    NAME=blocky-ep2 bash master.sh                   # two-pass loudnorm, 48 kHz AAC, post-encode QA numbers

## Files
index.html (overlays) · char.js (two-bone rig, face with mouth shapes, 25 actions, hair spring) · main.js (set, compiler for episode.json, camera, captions, fx, seek) ·
render.js (embedded server, N Chromium workers, ffmpeg parts, concat) · vo.py · audio.py (SFX, whisper style, 4 music sections) · master.sh · shots.js · sheet.py · ramwatch.sh

## Notes
- `vo.py` Kokoro path and `audio.py` `soften` path are hard-coded to the build sandbox: make them config.
- Chromium flags in render.js force software GL (SwiftShader). On a machine with a GPU remove them and benchmark.
- No Roblox assets, names or sounds. Characters and story are original.
