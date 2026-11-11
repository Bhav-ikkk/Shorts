"""
Blocky Story Engine — Audio v2: Procedural Music Beds
Synthesizes 7 distinct procedural mood tracks without audio samples or keys.
"""

import numpy as np
from scipy.signal import butter, lfilter
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(101)

def tt(d):
    return np.arange(int(d * SR)) / SR

def lp(x, fc, o=2):
    b, a = butter(o, np.clip(fc / (SR / 2), 0.001, 0.99), 'low')
    return lfilter(b, a, x)

def bp(x, lo, hi, o=2):
    w1 = np.clip(lo / (SR / 2), 0.001, 0.99)
    w2 = np.clip(hi / (SR / 2), w1 + 0.001, 0.99)
    b, a = butter(o, [w1, w2], 'band')
    return lfilter(b, a, x)

def env(t, att=0.01, dec=8):
    return (1 - np.exp(-t / max(att, 1e-4))) * np.exp(-t * dec)

def tone(f, d, a=0.3, att=0.01, dec=6, h=((1, 1), (2, 0.12))):
    t = tt(d)
    sig = sum(g * np.sin(2 * np.pi * f * k * t) for k, g in h)
    return sig * env(t, att, dec) * a

def square_wave(f, d, a=0.2, att=0.005, dec=8):
    t = tt(d)
    sig = np.sign(np.sin(2 * np.pi * f * t))
    return sig * env(t, att, dec) * a

def triangle_wave(f, d, a=0.25, att=0.005, dec=6):
    t = tt(d)
    sig = 2 * np.abs(2 * (f * t - np.floor(f * t + 0.5))) - 1
    return sig * env(t, att, dec) * a

def add(buf, t, sig, amp=1.0):
    i = int(t * SR)
    N = len(buf)
    if 0 <= i < N:
        j = min(N, i + len(sig))
        buf[i:j] += sig[:j - i] * amp

def sec_env(t, a, b, fi=0.25, fo=0.4):
    """Smooth ramp-in and ramp-out envelope for a time section [a, b]."""
    return np.clip((t - a) / max(fi, 1e-4), 0, 1) * np.clip((b - t) / max(fo, 1e-4), 0, 1)

# --- The 7 Procedural Mood Beds ---

def render_playful(a, b, total_n):
    """Playful A-minor arpeggio + bouncing electric bass (104 BPM)."""
    t = np.arange(total_n) / SR
    bpm = 104
    beat = 60 / bpm / 2
    notes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63]
    arp = np.zeros(total_n)
    i = 0
    while a + i * beat < b:
        f = notes[i % 8] * (2 if (i // 8) % 2 else 1)
        amp = 0.45 if i % 2 == 0 else 0.28
        add(arp, a + i * beat, tone(f, 0.35, amp, 0.004, 9, ((1, 1), (2, 0.2), (3, 0.06))))
        i += 1

    bass = np.zeros(total_n)
    j = 0
    bass_notes = [110, 87.31, 98, 110]
    while a + j * beat * 2 < b:
        f = bass_notes[(j // 2) % 4]
        add(bass, a + j * beat * 2, tone(f, 0.4, 0.5, 0.005, 6, ((1, 1), (2, 0.15))))
        j += 1

    mix = lp(arp, 2800) * 0.09 + lp(bass, 450) * 0.12
    return mix * sec_env(t, a, b, 0.25, 0.35)

def render_sneak(a, b, total_n):
    """Stealthy tiptoe staccato plucks (84 BPM)."""
    t = np.arange(total_n) / SR
    beat = 60 / 84
    m = np.zeros(total_n)
    seq = [110, 123.47, 110, 130.81, 110, 103.83, 110, 98]
    j = 0
    while a + j * beat < b:
        add(m, a + j * beat, tone(seq[j % 8], 0.22, 0.55, 0.004, 14, ((1, 1), (2, 0.25), (3, 0.08))))
        # Soft wood block step
        t_step = tt(0.06)
        step_sig = lp(rng.standard_normal(len(t_step)), 850) * env(t_step, 0.002, 50) * 0.18
        add(m, a + j * beat + beat / 2, step_sig)
        j += 1
    return lp(m, 2400) * 0.13 * sec_env(t, a, b, 0.2, 0.25)

def render_hush(a, b, total_n):
    """Sub-bass breathing drone for whisper & suspense scenes (70 BPM)."""
    t = np.arange(total_n) / SR
    d = np.sin(2 * np.pi * 55 * t) + 0.5 * np.sin(2 * np.pi * 82.4 * t * (1 + 0.002 * np.sin(2 * np.pi * 0.3 * t)))
    m = d * 0.045 * sec_env(t, a, b, 0.4, 0.3)
    # Gentle clock ticks
    step_t = tt(0.04)
    tick = lp(rng.standard_normal(len(step_t)), 1600) * env(step_t, 0.001, 75) * 0.12
    for j in range(int((b - a) / 0.85)):
        add(m, a + 0.4 + j * 0.85, tick)
    return m

def render_drone(a, b, total_n):
    """Tension drone with low-frequency wobble for cliffhangers."""
    t = np.arange(total_n) / SR
    d = np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 58 * t) + 0.35 * np.sin(2 * np.pi * 82.4 * t)
    wobble = 0.7 + 0.3 * np.sin(2 * np.pi * 4.5 * t)
    return d * 0.065 * sec_env(t, a, b, 0.3, 1.0) * wobble

def render_arcade(a, b, total_n):
    """Upbeat 8-bit chiptune obstacle course arpeggio (132 BPM)."""
    t = np.arange(total_n) / SR
    bpm = 132
    beat = 60 / bpm / 2
    # E minor pentatonic chiptune riff: E4, G4, A4, B4, D5, E5, D5, B4
    chip_notes = [329.63, 392.00, 440.00, 493.88, 587.33, 659.25, 587.33, 493.88]
    arp = np.zeros(total_n)
    i = 0
    while a + i * beat < b:
        f = chip_notes[i % 8]
        sq = square_wave(f, 0.22, 0.25, 0.003, 12)
        add(arp, a + i * beat, lp(sq, 3500))
        i += 1

    # Punchy triangle bass
    bass = np.zeros(total_n)
    bass_notes = [82.41, 98.00, 110.00, 123.47]
    j = 0
    while a + j * beat * 2 < b:
        fb = bass_notes[(j // 2) % 4]
        tri = triangle_wave(fb, 0.35, 0.45, 0.004, 7)
        add(bass, a + j * beat * 2, tri)
        j += 1

    mix = arp * 0.08 + bass * 0.11
    return mix * sec_env(t, a, b, 0.2, 0.3)

def render_spooky(a, b, total_n):
    """Gothic D-minor haunted celesta & wind flutter (76 BPM)."""
    t = np.arange(total_n) / SR
    # Eerie D minor pad chords: D3, F3, A3, C4
    d_pad = (np.sin(2 * np.pi * 146.83 * t) +
             0.8 * np.sin(2 * np.pi * 174.61 * t) +
             0.7 * np.sin(2 * np.pi * 220.00 * t) +
             0.4 * np.sin(2 * np.pi * 261.63 * t))
    pad_sig = lp(d_pad, 650) * 0.05 * sec_env(t, a, b, 0.5, 0.6)

    # Detuned celesta bells
    bell = np.zeros(total_n)
    bell_notes = [587.33, 698.46, 880.00, 523.25]
    k = 0
    beat = 60 / 76
    while a + k * beat * 2 < b:
        f_bell = bell_notes[k % 4]
        t_bell = tt(1.4)
        b_sig = (np.sin(2 * np.pi * f_bell * t_bell) +
                 0.3 * np.sin(2 * np.pi * (f_bell * 2.01) * t_bell)) * env(t_bell, 0.01, 2.5) * 0.18
        add(bell, a + k * beat * 2, lp(b_sig, 3000))
        k += 1

    return (pad_sig + bell * 0.07) * sec_env(t, a, b, 0.3, 0.4)

def render_sunset(a, b, total_n):
    """Warm lofi chord progression & mellow pluck (92 BPM)."""
    t = np.arange(total_n) / SR
    beat = 60 / 92
    # Fmaj7 -> Em7 -> Dm7 -> Cmaj7
    chords = [
        [174.61, 220.0, 261.63, 329.63],
        [164.81, 196.0, 246.94, 293.66],
        [146.83, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 246.94]
    ]
    m = np.zeros(total_n)
    k = 0
    while a + k * beat * 4 < b:
        chord = chords[k % len(chords)]
        t_chord = tt(beat * 4)
        c_sig = sum(np.sin(2 * np.pi * freq * t_chord) for freq in chord) * env(t_chord, 0.05, 1.2) * 0.04
        add(m, a + k * beat * 4, lp(c_sig, 1200))
        k += 1
    return m * sec_env(t, a, b, 0.4, 0.5)

MOOD_REGISTRY = {
    'playful': render_playful,
    'sneak': render_sneak,
    'hush': render_hush,
    'drone': render_drone,
    'arcade': render_arcade,
    'obby': render_arcade,
    'spooky': render_spooky,
    'sunset': render_sunset,
    'warm': render_sunset
}

def render_mood(pattern, start_t, end_t, total_n):
    """Synthesize a named procedural mood bed over a given time interval."""
    if pattern not in MOOD_REGISTRY:
        raise ValueError(f"Unknown music mood: '{pattern}'. Available: {list(MOOD_REGISTRY.keys())}")
    return MOOD_REGISTRY[pattern](start_t, end_t, total_n)

if __name__ == '__main__':
    print(f"[Music Engine] Validated {len(MOOD_REGISTRY)} procedural mood generators:")
    total_samples = int(10.0 * SR)
    for name in ['playful', 'sneak', 'hush', 'drone', 'arcade', 'spooky', 'sunset']:
        buf = render_mood(name, 0.5, 9.5, total_samples)
        assert len(buf) == total_samples
        assert not np.isnan(buf).any()
        peak = np.abs(buf).max()
        print(f"  ✓ {name:<12} : 0.5s -> 9.5s | Peak: {peak:.3f}")
