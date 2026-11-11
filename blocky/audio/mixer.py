"""
Blocky Story Engine — Audio v2: Master Audio Mixer
Blends dialogue, procedural SFX library, and dynamic music beds with sidechain ducking.
No samples, no API keys.
"""

import json, sys, os
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

import soften
from audio.sfx import generate_sfx, SFX_REGISTRY
from audio.music import render_mood, MOOD_REGISTRY

SR = 44100
NAME = os.environ.get('NAME', 'blocky-ep2')
data_dir = BASE_DIR / 'data'
out_dir = BASE_DIR / 'out'
vo_dir = BASE_DIR / 'vo'
out_dir.mkdir(parents=True, exist_ok=True)

def lp(x, fc, o=2):
    b, a = butter(o, np.clip(fc / (SR / 2), 0.001, 0.99), 'low')
    return lfilter(b, a, x)

def hp(x, fc, o=2):
    b, a = butter(o, np.clip(fc / (SR / 2), 0.001, 0.99), 'high')
    return lfilter(b, a, x)

def add(buf, t, sig, amp=1.0):
    i = int(t * SR)
    N = len(buf)
    if 0 <= i < N:
        j = min(N, i + len(sig))
        buf[i:j] += sig[:j - i] * amp

def mix_audio():
    print(f"[Mixer v2] Loading events and anchor timelines...")
    events_file = data_dir / 'events.json'
    anchors_file = data_dir / 'anchors.json'

    if not events_file.exists():
        raise FileNotFoundError(f"events.json not found at {events_file}")
    if not anchors_file.exists():
        raise FileNotFoundError(f"anchors.json not found at {anchors_file}")

    ev = json.load(open(events_file, encoding='utf-8'))
    A = json.load(open(anchors_file, encoding='utf-8'))
    DUR = ev.get('total', A.get('total', 30.0))
    N = int(SR * DUR)
    rng = np.random.default_rng(7)

    # 1. Dialogue Layer
    print(f"  -> Processing dialogue tracks ({len(A['lines'])} lines)...")
    vo = np.zeros(N, dtype=np.float32)
    for k, L in A['lines'].items():
        wav_path = vo_dir / f'{k}.wav'
        if not wav_path.exists():
            continue
        sr, s = wavfile.read(str(wav_path))
        s = s.astype(np.float32)
        if np.abs(s).max() > 2.0:
            s /= 32768.0
        if sr != SR:
            s = resample_poly(s, SR, sr)

        # Softening & de-essing chain
        s = soften.new_chain(s)

        if L.get('style') == 'whisper':
            # Breathy whisper style
            e_env = lp(np.abs(s), 40, 1)
            e_env /= (e_env.max() + 1e-9)
            br = hp(lp(rng.standard_normal(len(s)), 6000), 1800)
            s = hp(s, 200) * 0.62 + br * e_env * 0.22

        # Micro edge fade
        fi = int(0.012 * SR)
        s[:fi] *= np.linspace(0, 1, fi)
        s[-fi:] *= np.linspace(1, 0, fi)
        add(vo, L['start'], s)

    # 2. Procedural SFX Layer
    print(f"  -> Synthesizing procedural SFX events...")
    fx = np.zeros(N, dtype=np.float32)
    for item in ev.get('events', []):
        name, t_sec, opts = item[0], item[1], item[2]
        if name in SFX_REGISTRY:
            amp = opts.get('a', 1.0)
            try:
                sig = generate_sfx(name)
                add(fx, t_sec, sig, amp)
            except Exception as e:
                print(f"    [WARN] SFX {name} error: {e}")

    # Subtle spatial impulse response on SFX
    ir_t = np.arange(int(0.8 * SR)) / SR
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.5)
    ir = lp(ir, 2800)
    ir /= (np.abs(ir).sum() * 0.15 + 1e-9)
    fx = fx * 0.88 + fftconvolve(fx, ir)[:N] * 0.25

    # 3. Procedural Music Bed Layer
    print(f"  -> Synthesizing dynamic music beds...")
    cues = sorted([(e[1], e[2]['pattern']) for e in ev.get('events', []) if e[0] == 'music'])
    if not cues:
        # Default to playful if no music events are declared
        cues = [(0.0, 'playful')]

    secs = [(c[0], cues[i + 1][0] if i + 1 < len(cues) else DUR, c[1]) for i, c in enumerate(cues)]
    mus = np.zeros(N, dtype=np.float32)
    for a, b, p in secs:
        pattern = p if p in MOOD_REGISTRY else 'playful'
        mus += render_mood(pattern, a, b, N)

    # Tail fade on music
    t_axis = np.arange(N) / SR
    mus *= np.clip((DUR - t_axis) / 1.2, 0, 1)

    # 4. Sidechain Ducking
    print(f"  -> Applying dynamic sidechain ducking...")
    e = np.abs(vo)
    b_, a_ = butter(1, 5 / (SR / 2))
    e = lfilter(b_, a_, e)
    e /= (e.max() + 1e-9)

    # Duck SFX by -5 dB and Music by -8 dB during speech
    dfx = 1.0 - 0.45 * np.clip(e * 3.0, 0, 1.0)
    dmu = 1.0 - 0.60 * np.clip(e * 3.0, 0, 1.0)

    mix = vo * 1.0 + (fx * dfx) * 0.60 + (mus * dmu) * 0.95

    # Soft-saturation & peak normalization
    mix = np.tanh(mix)
    peak = np.abs(mix).max()
    if peak > 0:
        mix /= (peak / 0.88)

    # Export 16-bit stereo PCM
    stereo_mix = np.stack([mix, mix], axis=1)
    out_wav = out_dir / 'mix.wav'
    wavfile.write(str(out_wav), SR, (stereo_mix * 32767).astype(np.int16))
    print(f"[Mixer v2] Master stereo mix written -> {out_wav} ({DUR:.2f}s)")

    # 5. Export SRT Subtitles
    def ts(x):
        x = max(0, x)
        return f"{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int(round((x-int(x))*1000)):03d}"

    srt_path = out_dir / f'{NAME}.srt'
    with open(srt_path, 'w', encoding='utf-8') as f:
        for i, (k, L) in enumerate(A['lines'].items(), 1):
            f.write(f"{i}\n{ts(L['start'])} --> {ts(L['end'] + 0.15)}\n{L['text']}\n\n")
    print(f"[Mixer v2] Synchronized SRT subtitles generated -> {srt_path}")

    return str(out_wav)

if __name__ == '__main__':
    mix_audio()

