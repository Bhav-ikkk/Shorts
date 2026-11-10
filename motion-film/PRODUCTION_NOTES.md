# Spectra X — 15-second launch film

## Intent

A square product film for an organic X post. The genuine workbench is the picture. Type only names what the screenshot already proves.

Motion personality: Premium. Signature curve `cubic-bezier(0.4, 0, 0.2, 1)`. Entrances decelerate. Camera moves use ease-in-out. Overshoot is 0. No springs.

Duration palette: quick 10 frames (status), standard 16 frames (type), slow 70–80 frames (camera).

## Shot list (30 fps, 450 frames, 1080×1080)

| Frames | Time | Hero | Motion | Copy |
|---|---|---|---|---|
| 0–38 | 0.00–1.27 | The word FIXED. | Hairline draws, label rises 10px, title settles. No typewriter. | AI AGENT / STATUS: COMPLETE / FIXED. |
| 39–122 | 1.30–4.07 | `01-optical-viewport-occlusion.png` | One ease-in-out push toward the real hashed checkout edge. Coral corner bracket draws on that edge. | 9.6% VISIBILITY LOSS |
| 123–203 | 4.10–6.77 | `02-referee-rejection-metrics.png` | Panel rests. Labels change once, then align to one line. Scale never exceeds 1.06. | SAM 3.1 · PIXEL MATCH · TWO INSTRUMENTS. ONE VERDICT. |
| 204–275 | 6.80–9.17 | Same rejection panel | 8-frame settle toward the real REJECTED row. Band changes color. No stamp. | REJECTED. / 9.60% LOSS > 1.35% 3σ |
| 276–362 | 9.20–12.07 | `03` then `04` | Split curtain eases across asset 03. Dissolves to the real verified panel. | VERIFY → PATCH → RE-VERIFY / 0.00% LOSS · VERIFIED |
| 363–449 | 12.10–15.00 | `spectra-logo.svg` | Mark and wordmark enter, then hold still from frame 412. | SPECTRA V3.0 / DON'T TRUST "DONE." MEASURE IT. / spectra-lyart.vercel.app |

## Asset map

Copied from `out/Spectra_X_Motion_Design_Kit/assets/` into `motion-film/public/spectra/`. Unmodified.

- 01 — occlusion viewport, 1143×720. Checkout green measured at x825–1065, y569–627. Hashed loss measured at x825–1065, y622–681.
- 02 — rejection panel, 478×545. Shown near native size so the type stays sharp.
- 03 — split view, 1143×720. Broken banner x194–472. Repaired banner x794–1072.
- 04 — verified panel, 478×545.
- Logo — `assets/spectra-logo.svg` from the product repo. Not redrawn.

Assets 05–07 are in the folder and unused. Fifteen seconds cannot carry them cleanly.

## Probe of the delivered file

`ffprobe` on `out/spectra-x-launch-15s.mp4`:

- H.264, yuv420p, 1080×1080, 30/1 fps, 450 frames
- AAC-LC, stereo, 48 kHz
- Video bitrate about 5.7 Mbps at the 8 Mbps target (the picture is mostly flat color, so the encoder stays under the cap)
- Container duration 15.019s. The picture is exactly 15.000s. The extra 19ms is the AAC packet.

## Sound

Searched Downloads, Documents, Desktop, Music, Videos, OneDrive top level, and `D:\Bhavik`. No Sonniss / GDC archive is on this machine. The bed in `public/audio/score.wav` is original synthesis for this film, not a substitute archive file. See `ASSET_CREDITS_AND_LICENSES.md`.
