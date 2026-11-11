/**
 * Blocky Story Engine — glTF Asset & Deterministic Animation Controller (Phase B9)
 * Integrates Tier C glTF/GLB models with Three.js AnimationMixer.
 * Guarantees 100% determinism: seek(t) is a pure function of time.
 */

export class GltfAsset {
  constructor(gltf, options = {}) {
    this.gltf = gltf;
    this.scene = gltf.scene;
    this.root = gltf.scene;
    this.animations = gltf.animations || [];
    this.options = options;

    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.clipDuration = 0;

    if (this.animations.length > 0) {
      // In Three.js, AnimationMixer requires the THREE library or is instantiated from THREE
      const THREE = options.THREE || (typeof window !== 'undefined' && window.THREE) || null;
      if (THREE) {
        this.mixer = new THREE.AnimationMixer(this.scene);
        this.animations.forEach(clip => {
          const action = this.mixer.clipAction(clip);
          this.actions[clip.name] = action;
          action.play();
          if (!this.activeAction) {
            this.activeAction = action;
            this.clipDuration = clip.duration;
          }
        });
      }
    }

    if (options.position) {
      this.root.position.set(...options.position);
    }
    if (options.scale !== undefined) {
      if (typeof options.scale === 'number') {
        this.root.scale.setScalar(options.scale);
      } else if (Array.isArray(options.scale)) {
        this.root.scale.set(...options.scale);
      }
    }
  }

  /**
   * Deterministic seek: sets model animation pose strictly by timestamp t.
   * Pure function of time — zero drift, zero dependency on frame deltas.
   */
  seek(t) {
    if (!this.mixer || this.clipDuration <= 0) return;
    const loopT = this.clipDuration > 0 ? (t % this.clipDuration) : t;
    this.mixer.setTime(loopT);
    this.root.updateMatrixWorld(true);
  }

  /**
   * Sets world transformation.
   */
  setPosition(x, y, z) {
    this.root.position.set(x, y, z);
    this.root.updateMatrixWorld(true);
  }

  setRotationY(rad) {
    this.root.rotation.y = rad;
    this.root.updateMatrixWorld(true);
  }

  setScale(s) {
    if (typeof s === 'number') this.root.scale.setScalar(s);
    else this.root.scale.set(...s);
    this.root.updateMatrixWorld(true);
  }

  /**
   * Factory loader from an ArrayBuffer.
   */
  static parseFromBuffer(arrayBuffer, THREE, GLTFLoader, options = {}) {
    return new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.parse(
        arrayBuffer,
        '',
        gltf => {
          const asset = new GltfAsset(gltf, { THREE, ...options });
          resolve(asset);
        },
        error => reject(error)
      );
    });
  }
}

