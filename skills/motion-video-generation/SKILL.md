---
name: motion-video-generation
description: Automated code-driven motion design video pipeline. Compiles declarative project.json files into broadcast-quality 1080p films and vertical Shorts using local Kokoro neural voice synthesis, kinetic captions, procedural DSP audio, and deterministic offline parallel rendering.
---

# Motion Video Generation Skill

Use this skill to create, script, lint, render, and package high-retention motion design videos and Shorts from declarative data.

## Pipeline Commands

Always execute commands through `engine/cli.js`:

```bash
# Diagnostic health check
node engine/cli.js doctor

# Synthesize neural voice and acoustic anchors (Kokoro 100% offline default)
node engine/cli.js voice <projectName>

# Compile declarative archetypes to motion canvas
node engine/cli.js build <projectName>

# Dense spatial & temporal collision check
node engine/cli.js lint <projectName>

# Procedural SFX & harmonic audio synthesis
node engine/cli.js audio <projectName>

# Two-pass loudnorm mastering (-14 LUFS, 48kHz)
node engine/cli.js master <projectName>

# Deterministic parallel frame rendering
node engine/cli.js render <projectName>

# Mux final video and audio
node engine/cli.js mux <projectName>

# Quality assurance gate & contact sheet export
node engine/cli.js qa <projectName>

# Run full pipeline end-to-end
node engine/cli.js all <projectName>
```

## Creating a New Project

1. Create directory `projects/<name>/`.
2. Define `project.json` using Schema v2:
   - `schemaVersion`: 2
   - `format`: `"short"` (for 9:16 vertical 1080x1920) or `"standard"` (for 16:9 1920x1080)
   - `voice`: `{"provider": "kokoro", "voice": "am_michael", "rate": "+6%"}`
   - `script`: array of lines with `id`, `spoken`, `caption`, `pause_after`
   - `scenes`: array of archetypes (`contrast-hook`, `metrics-count`, `split-compare`, `terminal-run`, `tile-proof`, `kinetic-cta`, etc.)
3. Run `node engine/cli.js all <name>`.
4. Review generated QA metrics in `out/<name>-qa.json` and visual frames in `out/<name>-contact-sheet.png`.
