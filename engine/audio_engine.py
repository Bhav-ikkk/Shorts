"""Audio Engine.
Synthesizes procedural sound design (UI SFX), warm harmonic chord pads,
applies the softening DSP chain to voice tracks, executes dynamic sidechain ducking,
and generates platform subtitles (.srt).
"""
import sys, os, json
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile

from soften import soften_voice

SR = 44100

def tt(d): return np.arange(int(d * SR)) / SR
def lp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def soft_env(t, att=0.012, dec=8.0):
    return (1 - np.exp(-t / att)) * np.exp(-t * dec)
def add_signal(buf, t, sig, amp=1.0):
    n = len(buf)
    i = int(t * SR)
    if i >= n or i < 0: return
    j = min(n, i + len(sig))
    buf[i:j] += sig[: j - i] * amp

# Procedural SFX Instruments
def tone(f, d, a=0.3, att=0.02, dec=5.0, harm=((1, 1), (2, 0.12))):
    t = tt(d)
    s = sum(g * np.sin(2 * np.pi * f * h * t) for h, g in harm)
    return s * soft_env(t, att, dec) * a

def tap(a=0.22):
    return tone(520, 0.09, a, 0.004, 38, ((1, 1), (2.4, 0.1)))

def pop(a=0.28):
    t = tt(0.2)
    f = 330 + 190 * (1 - np.exp(-t * 22))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * soft_env(t, 0.01, 15) * a

def click(a=0.14):
    return lp(tone(380, 0.07, a, 0.003, 45, ((1, 1), (3, 0.05))), 1500)

def thud(a=0.55, f0=105, f1=48, d=0.9):
    t = tt(d)
    f = f1 + (f0 - f1) * np.exp(-t * 14)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * soft_env(t, 0.006, 5.2) * a

def impact(a=0.4):
    return thud(a, 96, 42, 1.3) + tone(130.8, 1.3, a * 0.22, 0.02, 3.6) + tone(196, 1.3, a * 0.1, 0.03, 4)

def whoosh(rng, a=0.5, d=0.75, rev=False, hi=1800):
    t = tt(d)
    n = rng.standard_normal(len(t))
    n = lp(n, hi, 2)
    n = hp(n, 150, 1)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2
    if rev:
        env = env[::-1] * np.clip(t / 0.05, 0, 1)
    return n * env * a * 0.55

def swell(d=0.8, a=0.22, down=False):
    t = tt(d)
    u = t / d
    f = (200 + 160 * u) if not down else (360 - 160 * u)
    ph = 2 * np.pi * np.cumsum(f) / SR
    env = np.sin(np.pi * u) ** 1.8
    return (np.sin(ph) + 0.3 * np.sin(2 * ph)) * env * a

def chime(f, a=0.2, d=2.2):
    t = tt(d)
    s = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * f * 2.0 * t) + 0.08 * np.sin(2 * np.pi * f * 3.0 * t)
    return lp(s * soft_env(t, 0.012, 2.4) * a, 3200)

def format_timestamp(x):
    x = max(0, x)
    h = int(x // 3600)
    m = int(x % 3600 // 60)
    s = x % 60
    ms = int(round((s - int(s)) * 1000))
    return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"

def synthesize_audio_for_project(project_dir):
    p_dir = Path(project_dir).resolve()
    conf_file = p_dir / "project.json"
    events_file = p_dir / "build" / "events.json"
    anchors_file = p_dir / "anchors.json"

    if not conf_file.is_file():
        raise FileNotFoundError(f"Missing project.json in {p_dir}")
    if not events_file.is_file():
        raise FileNotFoundError(f"Missing events.json in {p_dir / 'build'}. Run build/render step first.")
    if not anchors_file.is_file():
        raise FileNotFoundError(f"Missing anchors.json in {p_dir}. Run voice step first.")

    with open(conf_file, "r", encoding="utf-8") as f:
        conf = json.load(f)
    with open(events_file, "r", encoding="utf-8") as f:
        ev_data = json.load(f)
    with open(anchors_file, "r", encoding="utf-8") as f:
        anch_data = json.load(f)["lines"]

    DUR = ev_data.get("total", 42.0)
    N = int(SR * DUR)
    rng = np.random.default_rng(23)

    proj_name = conf.get('name') or conf.get('product', {}).get('name') or conf.get('title') or p_dir.name
    print(f"[Audio] Synthesizing soundtrack for '{proj_name}' (duration: {DUR:.2f}s, {N} samples)...")

    # 1. Voice Track with Softening
    print("  -> Processing voice lines with softening filter chain...")
    vo = np.zeros(N, dtype=np.float32)
    audio_dir = p_dir / "audio"
    for k in anch_data:
        wav_p = audio_dir / f"{k}.wav"
        if not wav_p.is_file():
            print(f"Warning: {wav_p} not found, skipping.")
            continue
        sr, s = wavfile.read(wav_p)
        s = s.astype(np.float32)
        if len(s.shape) > 1: s = s.mean(axis=1)
        if np.abs(s).max() > 2: s = s / 32768.0
        if sr != SR:
            import math
            gcd = math.gcd(SR, sr)
            s = resample_poly(s, SR // gcd, sr // gcd)
        s = soften_voice(s)
        fi = int(0.015 * SR)
        if len(s) > 2 * fi:
            s[:fi] *= np.linspace(0, 1, fi)
            s[-fi:] *= np.linspace(1, 0, fi)
        add_signal(vo, anch_data[k]["start"], s)

    # 2. Procedural SFX Bus
    print(f"  -> Synthesizing procedural SFX bus ({len(ev_data.get('events', []))} events)...")
    fx = np.zeros(N, dtype=np.float32)
    CH = [392.00, 523.25, 659.25, 783.99]  # G4 C5 E5 G5
    nchime = 0

    for name, t, o in ev_data.get("events", []):
        a = o.get("a", 1.0)
        if name == "tap":
            add_signal(fx, t, tap())
        elif name == "click":
            add_signal(fx, t, click())
        elif name == "pop":
            add_signal(fx, t, pop())
        elif name == "thud":
            add_signal(fx, t, thud(0.45 * (a / 0.4 if a else 1) * 0.6))
        elif name == "impact":
            add_signal(fx, t, impact())
        elif name == "whoosh":
            add_signal(fx, t, whoosh(rng, 0.5 * a, 0.8 if a >= 0.5 else 0.6, bool(o.get("rev"))))
        elif name == "swell":
            add_signal(fx, t, swell(o.get("d", 0.8), 0.2, bool(o.get("down"))))
        elif name == "ticks":
            n_ticks = int(o.get("n", 10))
            dt = o.get("dt", 0.04)
            for i in range(n_ticks):
                add_signal(fx, t + i * dt, tone(420 + (i % 7) * 38, 0.06, min(0.16, o.get("a", 0.06) * 2.2), 0.004, 55, ((1, 1),)))
        elif name == "chime":
            add_signal(fx, t, chime(CH[min(nchime, 3)] if nchime < 3 else CH[1], 0.2))
            add_signal(fx, t + 0.09, chime(CH[min(nchime + 1, 3)], 0.13))
            nchime += 1

    # Final resolving chord under the logo/URL
    if ev_data.get("events"):
        tend = ev_data["events"][-1][1]
        for k_idx, freq in enumerate((261.63, 392.0, 523.25)):
            add_signal(fx, tend + 0.02 + k_idx * 0.12, chime(freq, 0.16, 3.2))

    # Room reverb on SFX bus
    ir_t = tt(1.4)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.6)
    ir = lp(ir, 2600)
    ir /= (np.abs(ir).sum() * 0.12 + 1e-12)
    fx = fx * 0.78 + fftconvolve(fx, ir)[:N] * 0.5
    fx = lp(fx, 3600, 2)

    # 3. Procedural Harmonic Background Pad
    print("  -> Synthesizing procedural harmonic bed...")
    t_arr = np.arange(N) / SR
    chords = [
        (0.0,  [110.0, 164.81, 220.0, 261.63, 329.63]),    # Am
        (10.5, [87.31, 130.81, 174.61, 220.0, 261.63]),    # F
        (21.0, [130.81, 196.0, 261.63, 329.63, 392.0]),    # C
        (31.5, [98.0, 146.83, 196.0, 246.94, 293.66]),     # G
        (38.0, [130.81, 196.0, 261.63, 329.63, 392.0]),    # C (home)
    ]
    pad = np.zeros(N, dtype=np.float32)
    for ci, (c0, notes) in enumerate(chords):
        c1 = chords[ci + 1][0] if ci + 1 < len(chords) else DUR + 1.0
        xf = 2.2
        env = np.clip((t_arr - c0) / xf, 0, 1) * np.clip((c1 + xf * 0.5 - t_arr) / xf, 0, 1)
        if ci != 0:
            env = np.where(t_arr < c0 - 0.01, 0, env)
        else:
            env = np.clip(t_arr / 2.5, 0, 1) * np.clip((c1 + xf * 0.5 - t_arr) / xf, 0, 1)
        for i_note, f_note in enumerate(notes):
            det = 1 + (i_note - 2) * 0.0009
            vib = 1 + 0.0018 * np.sin(2 * np.pi * (0.17 + 0.03 * i_note) * t_arr + i_note)
            ph = 2 * np.pi * np.cumsum(f_note * det * vib) / SR
            pad += (np.sin(ph) + 0.22 * np.sin(2 * ph)) * env * (0.9 if f_note < 200 else 0.6) / len(notes)

    pad = lp(pad, 1400, 2) * 0.1
    pad *= np.clip(t_arr / 2.0, 0, 1) * np.clip((DUR - t_arr) / 2.2, 0, 1)

    # 4. Dynamic Sidechain Ducking
    print("  -> Applying dynamic sidechain ducking...")
    env_vo = np.abs(vo)
    b_duck, a_duck = butter(1, 5 / (SR / 2))
    env_vo = lfilter(b_duck, a_duck, env_vo)
    env_max = env_vo.max() + 1e-9
    env_vo /= env_max

    duck_fx = 1 - 0.50 * np.clip(env_vo * 3.0, 0, 1)
    duck_pad = 1 - 0.35 * np.clip(env_vo * 3.0, 0, 1)

    mix = vo * 1.0 + fx * duck_fx * 0.42 + pad * duck_pad * 1.0
    mix = np.tanh(mix * 1.0)
    # Apply master fade-out in Python (sample-exact)
    fade_len = int(1.1 * SR)
    if len(mix) > fade_len:
        mix[-fade_len:] *= np.linspace(1, 0, fade_len)
    max_peak = np.abs(mix).max()
    if max_peak > 0:
        mix = mix / max_peak * 0.9

    mix_wav_path = p_dir / "build" / "mix.wav"
    mix_stereo = (np.stack([mix, mix], 1) * 32767).astype(np.int16)
    wavfile.write(str(mix_wav_path), SR, mix_stereo)
    print(f"[Audio] Mix saved: {mix_wav_path}")

    # 5. Generate Captions (.srt)
    srt_path = p_dir / "build" / f"{p_dir.name}.srt"
    with open(srt_path, "w", encoding="utf-8") as f:
        for idx, k in enumerate(anch_data, 1):
            st_str = format_timestamp(anch_data[k]["start"])
            en_str = format_timestamp(anch_data[k]["end"] + 0.15)
            text_str = anch_data[k].get("text", "")
            f.write(f"{idx}\n{st_str} --> {en_str}\n{text_str}\n\n")
    print(f"[Audio] Subtitles saved: {srt_path}")

    return str(mix_wav_path)

if __name__ == "__main__":
    proj = sys.argv[1] if len(sys.argv) > 1 else "projects/spectra"
    synthesize_audio_for_project(proj)
