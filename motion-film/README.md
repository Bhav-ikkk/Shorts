# Spectra — 15-second X launch film

Isolated from the Spectra application. The workbench code is not imported.

## Preview

```bash
cd motion-film
pnpm dev
```

Opens Remotion Studio on `SpectraXLaunch` (1080×1080, 30 fps, 450 frames).

## Render

```bash
pnpm score     # rebuild the original soundtrack
pnpm render    # motion-film/out/spectra-x-launch-15s.mp4
pnpm poster    # motion-film/out/spectra-x-launch-poster.png
```

## Replace a screenshot

Put the new file in `public/spectra/` under the same name. Do not redraw the interface in code. Timing lives in `src/timing.ts` and in the `progress()` calls inside each scene.

## Sound

`public/audio/score.wav` is original synthesis. The Sonniss archive was not on disk. See `ASSET_CREDITS_AND_LICENSES.md`.
