"""Soften the Kokoro voice: no saturation, de-ess, tame 3-8k, add warmth, tiny room."""
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile
SR = 44100
def lp(x, fc, o=2): b, a = butter(o, fc/(SR/2), 'low'); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc/(SR/2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo/(SR/2), hi/(SR/2)], 'band'); return lfilter(b, a, x)

def load(path):
    sr, s = wavfile.read(path); s = s.astype(np.float32)
    if np.abs(s).max() > 2: s = s/32768.0
    return resample_poly(s, 147, 80)

def old_chain(s):
    s = hp(s, 80); s = np.tanh(s*1.8)/np.tanh(1.8); return s/np.abs(s).max()*.9

def deess(s, lo=4500, hi=9500, thr=.035, ratio=.55):
    band = bp(s, lo, hi); env = lp(np.abs(band), 60, 1)
    over = np.clip(env/thr - 1, 0, 3); g = 1/(1 + ratio*over*3)
    g = lp(g, 120, 1)
    return s - (1 - g)*band

def room(s, wet=.07, t60=.5):
    rng = np.random.default_rng(5); n = int(SR*t60)
    ir = rng.standard_normal(n)*np.exp(-np.arange(n)/SR*7.0/t60*1.0); ir = lp(ir, 3000)
    ir[:int(.012*SR)] *= np.linspace(0, 1, int(.012*SR)); ir /= np.sqrt((ir**2).sum())
    r = fftconvolve(s, ir)[:len(s)]
    return s*(1 - wet*.5) + r*wet*1.1

def new_chain(s):
    s = hp(s, 70)
    s = deess(s)
    hi = s - lp(s, 3200, 2); s = s - .27*hi                  # gentle high shelf, about -4 dB above 3.2k
    s = lp(s, 9500, 2)                                        # no brittle air
    s = s + .26*lp(s, 190, 2)                                 # warmth, about +3 dB low shelf
    # gentle dynamics: slow RMS leveller instead of tanh clipping
    env = lp(np.abs(s), 6, 1) + 1e-4; tgt = .11; g = np.clip((tgt/env)**.35, .6, 1.6); s = s*lp(g, 4, 1)
    s = room(s)
    return s/np.abs(s).max()*.9

def metrics(s):
    x = s[np.abs(s) > .02*np.abs(s).max()]
    X = np.abs(np.fft.rfft(x*np.hanning(len(x))))**2; f = np.fft.rfftfreq(len(x), 1/SR)
    cen = (f*X).sum()/X.sum(); hf = X[(f >= 3000) & (f < 10000)].sum()/X.sum(); sib = X[(f >= 5000) & (f < 10000)].sum()/X.sum()
    return round(cen), round(10*np.log10(hf+1e-12), 1), round(10*np.log10(sib+1e-12), 1), round(20*np.log10(np.abs(s).max()/np.sqrt((s**2).mean())), 1)

if __name__ == '__main__':
    import sys
    for k in ['L2', 'L6', 'L8', 'L11']:
        s = load(f'/home/claude/vo3/{k}.wav')
        print(k, 'OLD centroid/HF3-10k dB/sib5-10k dB/crest', metrics(old_chain(s)), '| NEW', metrics(new_chain(s)))
