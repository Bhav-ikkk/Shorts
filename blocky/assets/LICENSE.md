# Asset Licensing & IP Clearance Registry

**Subsystem:** `video-gen/blocky/assets/`  
**Governing Policy:** 100% Offline, Zero-API-Key, Kid-Safe, Clean Original IP  
**Last Updated:** 2026-11-11  

---

## 1. Licensing Principles
All visual models, audio samples, and textures utilized within the Blocky Story Engine must conform to the following strict criteria:
1. **Procedural First**: Assets authored directly via code algorithms or procedural geometry generators are inherently original intellectual property (zero third-party copyright liability).
2. **Curated Open Models**: Any external 3D models or textures must be dedicated to the public domain under **Creative Commons Zero (CC0 1.0 Universal)** or permissive open-source licenses (MIT, Apache-2.0, OFL).
3. **Trademark Cleanliness**: Zero incorporation of trademarked names, logos, avatar rigs, or signature sounds from commercial sandbox titles (e.g. *Roblox*, *Minecraft*, *Fortnite*, *Lego*).
4. **Offline Local Storage**: All models and materials are bundled in the repository or generated locally via headless scripts without external network fetches at build or render time.

---

## 2. Ingested Asset Inventory

| Asset Name | Relative Path | Source / Creator | License | Commercial Use | Attribution Required | Usage Description |
|---|---|---|---|---|---|---|
| **Hero Golden Trophy** | `models/hero_trophy.glb` | Original / `make_asset.py` | Original IP / CC0 | YES | NO | Tier C hero prop with baked `TrophyFloat` animation clip |
| **Bricolage Grotesque** | `node_modules/@fontsource/bricolage-grotesque` | Mathieu Triay | SIL Open Font License (OFL-1.1) | YES | NO | Master display font for captions, kinetic text, and HUD overlays |
| **Procedural Set Models** | `blocky/runtime/world.js` | Original Procedural Three.js | Original IP | YES | NO | 6 modular environments (Kitchen, Bedroom, Hallway, Park, Spooky House, Obby) |
| **Procedural Character Rigs**| `blocky/runtime/char.js` | Original Procedural Three.js | Original IP | YES | NO | Two-bone skeletal hierarchy with 10 emotion presets & 8 visemes |
| **Procedural SFX & Music** | `blocky/audio/sfx.py`, `music.py` | Original Mathematical Synthesis | Original IP | YES | NO | 25 sound effects and 7 dynamic mood beds |

---

## 3. Tier C Headless Export Protocol
Assets modeled in external DCC packages (such as Blender) must be exported through the headless export tool:
```bash
blender -b -P blocky/tools/make_asset.py -- --asset <name> --out blocky/assets/models/<name>.glb
```
No binary frames are rendered in Blender. Only binary glTF containers (`.glb`) containing geometry meshes, PBR materials, and baked animation curves are exported for deterministic playback in Three.js.

