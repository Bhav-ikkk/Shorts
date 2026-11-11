"""
Blocky Story Engine — Audio v2: Procedural SFX Library
Zero audio samples, zero API keys, 100% mathematical synthesis.
"""

import numpy as np
from scipy.signal import butter, lfilter, fftconvolve
from scipy.io import wavfile
import os
from pathlib import Path

SR = 44100
rng = np.random.default_rng(42)

def tt(d):
    """Generate time vector of duration d in seconds."""
    return np.arange(int(d * SR)) / SR

def lp(x, fc, o=2):
    b, a = butter(o, np.clip(fc / (SR / 2), 0.001, 0.99), 'low')
    return lfilter(b, a, x)

def hp(x, fc, o=2):
    b, a = butter(o, np.clip(fc / (SR / 2), 0.001, 0.99), 'high')
    return lfilter(b, a, x)

def bp(x, lo, hi, o=2):
    w1 = np.clip(lo / (SR / 2), 0.001, 0.99)
    w2 = np.clip(hi / (SR / 2), w1 + 0.001, 0.99)
    b, a = butter(o, [w1, w2], 'band')
    return lfilter(b, a, x)

def env(t, att=0.01, dec=8):
    """Exponential attack-decay envelope."""
    return (1 - np.exp(-t / max(att, 1e-4))) * np.exp(-t * dec)

def tone(f, d, a=0.3, att=0.01, dec=6, h=((1, 1), (2, 0.12))):
    t = tt(d)
    sig = sum(g * np.sin(2 * np.pi * f * k * t) for k, g in h)
    return sig * env(t, att, dec) * a

# --- Classic Blocky Cartoon Transients ---

def pop(a=0.3):
    t = tt(0.18)
    f = 360 + 220 * (1 - np.exp(-t * 26))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.006, 17) * a

def thud(a=0.5):
    t = tt(0.5)
    f = 45 + 70 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.004, 8) * a

def whoosh(a=0.4, d=0.45):
    t = tt(d)
    n = hp(lp(rng.standard_normal(len(t)), 2200), 180, 1)
    return n * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * a * 0.5

def boing(a=0.3):
    t = tt(0.55)
    f = 220 * np.exp(0.9 * t) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.01, 5) * a

def step(a=0.3):
    t = tt(0.07)
    return lp(rng.standard_normal(len(t)), 900) * env(t, 0.002, 55) * a * 1.4

def swell(d=0.5, a=0.2):
    t = tt(d)
    u = t / d
    f = 180 + 340 * (u ** 1.4)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * (np.sin(np.pi * u) ** 1.6) * a

def impact(a=0.5):
    s = tone(98, 1.1, a * 0.25, 0.02, 3.2)
    th = thud(a)
    s[:len(th)] += th
    return s

def chime(f=523.25, a=0.2, d=2.0):
    t = tt(d)
    sig = (np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)) * env(t, 0.01, 2.6) * a
    return lp(sig, 3200)

def crunch(a=0.5):
    s = np.zeros(int(0.34 * SR))
    for i, off in enumerate((0, 0.07, 0.15)):
        t = tt(0.05)
        b = bp(rng.standard_normal(len(t)), 1400, 5200) * env(t, 0.001, 70) * (1 - i * 0.18)
        j = int(off * SR)
        s[j:j + len(b)] += b
    t = tt(0.2)
    s[:len(t)] += np.sin(2 * np.pi * 140 * t) * env(t, 0.003, 26) * 0.25
    return s * a * 1.3

def poof(a=0.4):
    t = tt(0.35)
    n = lp(rng.standard_normal(len(t)), 1500) * env(t, 0.01, 10) * a * 0.8
    p = pop(a * 0.8)
    n[:len(p)] += p
    return n

def gasp(a=0.4):
    t = tt(0.28)
    n = bp(rng.standard_normal(len(t)), 700, 3200) * (np.sin(np.pi * np.clip(t / 0.28, 0, 1)) ** 1.5) * a * 0.6
    return n

def sting(a=0.45):
    s = np.zeros(int(1.2 * SR))
    t1 = tone(220, 0.5, a * 0.6, 0.004, 7, ((1, 1), (2, 0.3), (3, 0.1)))
    s[:len(t1)] += t1
    off = int(0.16 * SR)
    t2 = tone(164.8, 0.9, a * 0.8, 0.004, 4, ((1, 1), (2, 0.3), (3, 0.1)))
    s[off:off + len(t2)] += t2
    th = thud(a * 0.5)
    s[off:off + len(th)] += th
    return s

def flicker(a=0.3):
    t = tt(0.09)
    return lp(np.sign(np.sin(2 * np.pi * 110 * t)) * env(t, 0.001, 28) * a * 0.5 +
              rng.standard_normal(len(t)) * env(t, 0.001, 60) * a * 0.2, 2500)

def blackout(a=0.5):
    t = tt(0.7)
    f = 260 - 190 * (t / 0.7)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.01, 5) * a * 0.7

# --- New Phase B6 Expanded SFX Suite ---

def jump(a=0.4):
    """Snappy cartoon character jump ascent."""
    t = tt(0.22)
    f = 140 + 280 * (t / 0.22) ** 0.8
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.005, 14) * a
    return lp(sig, 4000)

def land(a=0.45):
    """Solid floor impact + soft dust puff."""
    s = np.zeros(int(0.25 * SR))
    th = thud(a * 0.7)[:len(s)]
    s += th
    t = tt(0.15)
    puff = lp(rng.standard_normal(len(t)), 800) * env(t, 0.003, 30) * a * 0.5
    s[:len(puff)] += puff
    return s

def lava_bubble(a=0.35):
    """Molten bubbling lava pop."""
    t = tt(0.16)
    f = 120 + 260 * np.sin(np.pi * (t / 0.16) ** 0.7)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    return sig * env(t, 0.008, 18) * a

def splash(a=0.4):
    """Water / liquid splash."""
    t = tt(0.38)
    n = bp(rng.standard_normal(len(t)), 400, 2800) * env(t, 0.004, 9) * a
    return n

def coin(a=0.35):
    """Two-tone arcade coin pickup (B5 -> E6)."""
    s = np.zeros(int(0.35 * SR))
    c1 = chime(987.77, a * 0.6, 0.25)
    s[:len(c1)] += c1
    off = int(0.08 * SR)
    c2 = chime(1318.51, a * 0.8, 0.25)
    s[off:off + len(c2)] += c2
    return s

def trophy_fanfare(a=0.4):
    """Quick victory brass fanfare."""
    s = np.zeros(int(0.7 * SR))
    notes = [523.25, 659.25, 783.99]  # C5, E5, G5
    for i, freq in enumerate(notes):
        off = int(i * 0.12 * SR)
        dur = 0.4 if i == 2 else 0.15
        h = ((1, 1), (2, 0.5), (3, 0.25))
        t = tone(freq, dur, a, 0.01, 6, h)
        s[off:off + len(t)] += t
    return lp(s, 5000)

def key_jingle(a=0.3):
    """Metallic key rattle / brass clink."""
    s = np.zeros(int(0.3 * SR))
    for off_s, freq in [(0.0, 3800), (0.05, 5200), (0.11, 4600)]:
        t = tt(0.06)
        sig = hp(np.sin(2 * np.pi * freq * t) * env(t, 0.001, 45) * a, 2000)
        off = int(off_s * SR)
        s[off:off + len(sig)] += sig
    return s

def chest_creak(a=0.4):
    """Slow wooden lid creak (FM synthesis)."""
    t = tt(0.55)
    carrier = 95 + 65 * (t / 0.55)
    modulator = 25 * np.sin(2 * np.pi * 18 * t)
    f = carrier + modulator
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.02, 3.5) * a
    return lp(sig, 1800)

def switch_click(a=0.3):
    """Crisp mechanical button or toggle switch click."""
    t = tt(0.04)
    hi = hp(rng.standard_normal(len(t)), 4000) * env(t, 0.001, 80) * a * 0.7
    lo = np.sin(2 * np.pi * 320 * t) * env(t, 0.001, 60) * a * 0.5
    return hi + lo

def laser(a=0.35):
    """Retro cyber laser shot."""
    t = tt(0.24)
    f = 1800 * np.exp(-t * 22) + 120
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.002, 12) * a
    return lp(sig, 6000)

def alarm(a=0.3):
    """Alternating dual-tone warning buzzer."""
    t = tt(0.5)
    f = np.where(np.sin(2 * np.pi * 5 * t) > 0, 880, 660)
    sig = np.sin(2 * np.pi * np.cumsum(f) / SR) * env(t, 0.01, 3) * a
    return lp(sig, 3000)

# Master SFX Registry Dictionary
SFX_REGISTRY = {
    'pop': pop,
    'thud': thud,
    'whoosh': whoosh,
    'boing': boing,
    'step': step,
    'swell': swell,
    'impact': impact,
    'chime': chime,
    'crunch': crunch,
    'poof': poof,
    'gasp': gasp,
    'sting': sting,
    'flicker': flicker,
    'blackout': blackout,
    'jump': jump,
    'land': land,
    'lava_bubble': lava_bubble,
    'splash': splash,
    'coin': coin,
    'trophy_fanfare': trophy_fanfare,
    'key_jingle': key_jingle,
    'chest_creak': chest_creak,
    'switch_click': switch_click,
    'laser': laser,
    'alarm': alarm
}

def generate_sfx(name, **kwargs):
    """Generate a sound effect by name with optional parameter overrides."""
    if name not in SFX_REGISTRY:
        raise ValueError(f"Unknown SFX: '{name}'. Available: {list(SFX_REGISTRY.keys())}")
    return SFX_REGISTRY[name](**kwargs)

if __name__ == '__main__':
    print(f"[SFX Engine] Validated {len(SFX_REGISTRY)} procedural sound effect generators:")
    for name in sorted(SFX_REGISTRY.keys()):
        sample = generate_sfx(name)
        assert len(sample) > 0, f"Empty sample for {name}"
        assert not np.isnan(sample).any(), f"NaN detected in {name}"
        print(f"  ✓ {name:<16} : {len(sample)/SR:.2f}s | Peak: {np.abs(sample).max():.3f}")

