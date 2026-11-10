# Creating a Motion Design Film for Any Product

This pipeline turns any product into a high-end, 42-second kinetic motion design film.

## 3 Simple Steps:

### 1. Create Your Project Folder
Copy this `template` folder to `projects/<your-product-name>`:
```bash
cp -r projects/template projects/my-saas
```

### 2. Configure `project.json`
Edit `projects/my-saas/project.json`:
- **`name`**: Your product name.
- **`tagline`**: Closing tagline.
- **`url`**: Your website/domain.
- **`theme`**: Brand hex colors (`paper`, `ink`, `brand`, `defect`, `verified`).
- **`badges`**: 3 developer chips shown at the end (e.g. `["RUNS LOCALLY", "CI/CD READY", "OPEN SOURCE"]`).
- **`script`**: 13 concise sentences (≤9 words each) following the narrative arc:
  1. **L1–L3 (Hook & Pain)**: The unexpected contradiction and failure.
  2. **L4–L5 (Insight)**: Why legacy approaches fail vs what users actually experience.
  3. **L6–L7 (Mechanism Step 1)**: How your product works in plain language.
  4. **L8–L10 (Mechanism Step 2 & 3)**: Dual verification, rejection of the bug, fix and approval.
  5. **L11 (Empirical Proof)**: The undeniable benchmark number (e.g. "18 hidden buttons. Normal caught 1. Spectra caught 18.").
  6. **L12–L13 (CTA & Tagline)**: Catch it before your customers do + brand reveal.

### 3. Generate the Film
Run one command from the project root:
```bash
node engine/cli.js all my-saas
```
The finished 1080p video will be in `out/my-saas-motion-film.mp4` with `out/my-saas-motion-film.srt`.

---

## Modular Commands:
- `node engine/cli.js voice my-saas` - Generate speech & measure acoustic word onsets (`anchors.json`).
- `node engine/cli.js build my-saas` - Compile the motion canvas & dump sound events.
- `node engine/cli.js shots my-saas` - Capture key inspection frames to visually review layout.
- `node engine/cli.js audio my-saas` - Synthesize UI SFX, musical pad, softened voice, and master mix.
- `node engine/cli.js render my-saas` - Deterministic offline seek-render (Playwright $\to$ FFmpeg).
- `node engine/cli.js mux my-saas` - Mux video and audio with broadcast loudness normalization (-14 LUFS).
- `node engine/cli.js qa my-saas` - Run `ffprobe`, `blackdetect`, and `ebur128` quality assurance.

