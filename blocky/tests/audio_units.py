"""
Blocky Audio v2 Unit Test Suite (Python Native)
Validates SFX generation, Music mood beds, Pitch shifting, and Audio mixing.
"""
import sys, os
from pathlib import Path
import numpy as np

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from audio.sfx import SFX_REGISTRY, generate_sfx
from audio.music import MOOD_REGISTRY, render_mood, SR
from audio.pitch_shift import pitch_shift
from audio.mixer import mix_audio

def run_tests():
    print("[Audio Units] Starting Python native audio test suite...")

    # 1. SFX Library
    print(f"--- 1. Testing {len(SFX_REGISTRY)} Procedural SFX Generators ---")
    for name in SFX_REGISTRY:
        s = generate_sfx(name)
        assert len(s) > 0, f"Empty audio for {name}"
        assert not np.isnan(s).any(), f"NaN in {name}"
        assert not np.isinf(s).any(), f"Inf in {name}"
        assert np.abs(s).max() > 0.05, f"Signal too quiet for {name}"
        assert len(s) / SR <= 3.0, f"Sound effect {name} too long ({len(s)/SR:.2f}s)"
        print(f"  ✓ SFX '{name}': {len(s)/SR:.2f}s (Peak: {np.abs(s).max():.3f})")

    # 2. Music Mood Beds
    print(f"\n--- 2. Testing 7 Unique Procedural Music Moods ---")
    moods = ['playful', 'sneak', 'hush', 'drone', 'arcade', 'spooky', 'sunset']
    N = int(4.0 * SR)
    for m in moods:
        buf = render_mood(m, 0.5, 3.5, N)
        assert len(buf) == N, f"Length mismatch for {m}"
        assert not np.isnan(buf).any(), f"NaN in mood {m}"
        assert np.abs(buf).max() > 0.01, f"Mood {m} is silent"
        print(f"  ✓ Mood '{m}': 4.0s buffer rendered (Peak: {np.abs(buf).max():.3f})")

    # 3. Pitch Shift
    print(f"\n--- 3. Testing Pitch Shifting & Duration Invariance ---")
    sr = 44100
    t = np.arange(int(0.5 * sr)) / sr
    test_sig = np.sin(2 * np.pi * 300.0 * t)

    shifted_up = pitch_shift(test_sig, 3.5, sr)
    assert len(shifted_up) == len(test_sig), "Length changed on pitch shift up"

    shifted_down = pitch_shift(test_sig, -1.5, sr)
    assert len(shifted_down) == len(test_sig), "Length changed on pitch shift down"
    print("  ✓ Pitch Shift: +3.5 st and -1.5 st duration invariance confirmed")

    # 4. Master Mixer
    print(f"\n--- 4. Testing Master Mixer Pipeline ---")
    out_wav = mix_audio()
    assert os.path.exists(out_wav), f"Output mix.wav not found at {out_wav}"
    print(f"  ✓ Master mixer exported: {out_wav}")

    print("\n>>> ALL PYTHON AUDIO UNIT TESTS PASSED (100%) <<<")

if __name__ == '__main__':
    run_tests()
