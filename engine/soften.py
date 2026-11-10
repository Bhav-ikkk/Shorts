"""Voice softening filter chain.
Softens neural TTS voices: de-ess, tame 3-8kHz harshness, add low-end warmth,
gentle RMS dynamics leveling, and subtle acoustic room ambience.
Based on the measured DSP chain from the motion design guide.
"""
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile

SR = 44100

def lp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'low')
    return lfilter(b, a, x)

def hp(x, fc, o=2):
    b, a = butter(o, fc / (SR / 2), 'high')
    return lfilter(b, a, x)

def bp(x, lo, hi, o=2):
    b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band')
    return lfilter(b, a, x)

def load_wav(path, target_sr=SR):
    sr, s = wavfile.read(path)
    s = s.astype(np.float32)
    if len(s.shape) > 1:
        s = s.mean(axis=1)
    if np.abs(s).max() > 2:
        s = s / 32768.0
    if sr != target_sr:
        # resample to target_sr
        import math
        gcd = math.gcd(int(target_sr), int(sr))
        up = int(target_sr // gcd)
        down = int(sr // gcd)
        s = resample_poly(s, up, down)
    return s

def deess(s, lo=4500, hi=9500, thr=0.035, ratio=0.55):
    band = bp(s, lo, hi)
    env = lp(np.abs(band), 60, 1)
    over = np.clip(env / thr - 1, 0, 3)
    g = 1 / (1 + ratio * over * 3)
    g = lp(g, 120, 1)
    return s - (1 - g) * band

def room(s, wet=0.07, t60=0.5):
    rng = np.random.default_rng(5)
    n = int(SR * t60)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * 7.0 / t60 * 1.0)
    ir = lp(ir, 3000)
    ir[:int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
    ir /= np.sqrt((ir ** 2).sum()) + 1e-12
    r = fftconvolve(s, ir)[:len(s)]
    return s * (1 - wet * 0.5) + r * wet * 1.1

def soften_voice(s):
    s = hp(s, 70)
    s = deess(s)
    hi = s - lp(s, 3200, 2)
    s = s - 0.27 * hi  # gentle high shelf, about -4 dB above 3.2k
    s = lp(s, 9500, 2)  # avoid brittle air
    s = s + 0.26 * lp(s, 190, 2)  # warmth, +3 dB low shelf
    # gentle dynamics: slow RMS leveller
    env = lp(np.abs(s), 6, 1) + 1e-4
    tgt = 0.11
    g = np.clip((tgt / env) ** 0.35, 0.6, 1.6)
    s = s * lp(g, 4, 1)
    s = room(s)
    max_val = np.abs(s).max()
    if max_val > 0:
        s = s / max_val * 0.9
    return s

def metrics(s):
    x = s[np.abs(s) > 0.02 * np.abs(s).max()] if np.abs(s).max() > 0 else s
    if len(x) == 0:
        return 0, 0.0, 0.0, 0.0
    X = np.abs(np.fft.rfft(x * np.hanning(len(x)))) ** 2
    f = np.fft.rfftfreq(len(x), 1 / SR)
    tot = X.sum() + 1e-12
    cen = (f * X).sum() / tot
    hf = X[(f >= 3000) & (f < 10000)].sum() / tot
    sib = X[(f >= 5000) & (f < 10000)].sum() / tot
    crest = 20 * np.log10(np.abs(s).max() / (np.sqrt((s ** 2).mean()) + 1e-12) + 1e-12)
    return round(cen), round(10 * np.log10(hf + 1e-12), 1), round(10 * np.log10(sib + 1e-12), 1), round(crest, 1)

