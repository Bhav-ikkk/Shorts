/**
 * Blocky Story Engine — Asset Resolver & Manifest Manager
 * Resolves local file paths, checks offline licenses, and manages asset manifests.
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.resolve(__dirname);
const MODELS_DIR = path.join(ASSETS_DIR, 'models');
const PACKS_DIR = path.join(ASSETS_DIR, 'packs');
const LICENSE_FILE = path.join(ASSETS_DIR, 'LICENSE.md');

const ASSET_MANIFEST = {
  'hero_trophy': {
    name: 'Hero Golden Trophy',
    type: 'model/gltf-binary',
    relPath: 'models/hero_trophy.glb',
    license: 'CC0-1.0',
    creator: 'Original Procedural / make_asset.py',
    hasAnimations: true,
    animationClip: 'TrophyFloat'
  }
};

class AssetResolver {
  constructor(baseDir = ASSETS_DIR) {
    this.baseDir = baseDir;
    this.modelsDir = path.join(this.baseDir, 'models');
    this.packsDir = path.join(this.baseDir, 'packs');
  }

  resolve(assetId) {
    const meta = ASSET_MANIFEST[assetId];
    if (!meta) {
      throw new Error(`[AssetResolver] Unknown asset ID: "${assetId}"`);
    }

    const fullPath = path.join(this.baseDir, meta.relPath);
    const exists = fs.existsSync(fullPath);
    const fileSize = exists ? fs.statSync(fullPath).size : 0;

    return {
      id: assetId,
      ...meta,
      fullPath,
      exists,
      fileSize
    };
  }

  listAssets() {
    return Object.keys(ASSET_MANIFEST).map(id => this.resolve(id));
  }

  verifyLicenses() {
    if (!fs.existsSync(LICENSE_FILE)) {
      return { pass: false, error: 'LICENSE.md registry not found' };
    }
    const content = fs.readFileSync(LICENSE_FILE, 'utf8');
    const allKnown = Object.values(ASSET_MANIFEST).every(m => content.includes(m.relPath) || content.includes(m.name));
    return {
      pass: allKnown,
      licenseFile: LICENSE_FILE,
      assetCount: Object.keys(ASSET_MANIFEST).length
    };
  }
}

module.exports = { AssetResolver, ASSET_MANIFEST, ASSETS_DIR };

