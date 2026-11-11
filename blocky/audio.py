"""Mix v2: softened multi-voice dialogue (+whisper style) + procedural cartoon SFX (page EVENTS) + music sections (playful/sneak/hush/drone) + sidechain duck. No samples, no API keys."""
import json, sys, os
from pathlib import Path
import numpy as np
from scipy.signal import butter, lfilter, resample_poly, fftconvolve
from scipy.io import wavfile

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
import soften

SR = 44100
NAME = os.environ.get('NAME', 'blocky-ep2')
data_dir = BASE_DIR / 'data'
out_dir = BASE_DIR / 'out'
vo_dir = BASE_DIR / 'vo'
out_dir.mkdir(parents=True, exist_ok=True)

ev = json.load(open(data_dir / 'events.json', encoding='utf-8'))
A = json.load(open(data_dir / 'anchors.json', encoding='utf-8'))
DUR = ev['total']
N = int(SR * DUR)
rng = np.random.default_rng(7)
tt = lambda d: np.arange(int(d * SR)) / SR
def lp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), 'low'); return lfilter(b, a, x)
def hp(x, fc, o=2): b, a = butter(o, fc / (SR / 2), 'high'); return lfilter(b, a, x)
def bp(x, lo, hi, o=2): b, a = butter(o, [lo / (SR / 2), hi / (SR / 2)], 'band'); return lfilter(b, a, x)
env_ = lambda t, att=.01, dec=8: (1 - np.exp(-t / att)) * np.exp(-t * dec)
def add(buf, t, sig, amp=1.0):
    i = int(t * SR)
    if 0 <= i < N: j = min(N, i + len(sig)); buf[i:j] += sig[:j - i] * amp

# --- dialogue ---
vo = np.zeros(N)
for k, L in A['lines'].items():
    wav_path = str(vo_dir / f'{k}.wav')
    if not os.path.exists(wav_path):
        continue
    sr, s = wavfile.read(wav_path)
    s = s.astype(np.float32)
    s = s / 32768 if np.abs(s).max() > 2 else s
    s = soften.new_chain(resample_poly(s, 147, 80) if sr == 24000 else s)
    if L.get('style') == 'whisper':   # breathy, quieter: add shaped noise, lose some body
        e = lp(np.abs(s), 40, 1)
        e /= e.max() + 1e-9
        br = hp(lp(rng.standard_normal(len(s)), 6000), 1800)
        s = hp(s, 200) * .62 + br * e * .22
    fi = int(.012 * SR)
    s[:fi] *= np.linspace(0, 1, fi)
    s[-fi:] *= np.linspace(1, 0, fi)
    add(vo, L['start'], s)

# --- sfx voices ---
def tone(f, d, a=.3, att=.01, dec=6, h=((1, 1), (2, .12))): t = tt(d); return sum(g * np.sin(2 * np.pi * f * k * t) for k, g in h) * env_(t, att, dec) * a
def pop(a=.3): t = tt(.18); f = 360 + 220 * (1 - np.exp(-t * 26)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_(t, .006, 17) * a
def thud(a=.5): t = tt(.5); f = 45 + 70 * np.exp(-t * 18); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_(t, .004, 8) * a
def whoosh(a=.4, d=.45): t = tt(d); n = hp(lp(rng.standard_normal(len(t)), 2200), 180, 1); return n * np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * a * .5
def boing(a=.3): t = tt(.55); f = 220 * np.exp(.9 * t) + 40 * np.sin(2 * np.pi * 14 * t) * np.exp(-t * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_(t, .01, 5) * a
def step(a=.3): t = tt(.07); return lp(rng.standard_normal(len(t)), 900) * env_(t, .002, 55) * a * 1.4
def swell(d=.5, a=.2): t = tt(d); u = t / d; f = 180 + 340 * u ** 1.4; return (np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * u) ** 1.6 * a
def impact(a=.5):
    s = tone(98, 1.1, a * .25, .02, 3.2); th = thud(a); s[:len(th)] += th; return s
def chime(f, a=.2, d=2.0): t = tt(d); return lp((np.sin(2 * np.pi * f * t) + .25 * np.sin(2 * np.pi * 2 * f * t)) * env_(t, .01, 2.6) * a, 3200)
def crunch(a=.5):   # a few crisp noise bursts + soft low body
    s = np.zeros(int(.34 * SR))
    for i, off in enumerate((0, .07, .15)):
        t = tt(.05); b = bp(rng.standard_normal(len(t)), 1400, 5200) * env_(t, .001, 70) * (1 - i * .18); j = int(off * SR); s[j:j + len(b)] += b
    t = tt(.2); s[:len(t)] += np.sin(2 * np.pi * 140 * t) * env_(t, .003, 26) * .25; return s * a * 1.3
def poof(a=.4): t = tt(.35); n = lp(rng.standard_normal(len(t)), 1500) * env_(t, .01, 10) * a * .8; p = pop(a * .8); n[:len(p)] += p; return n
def gasp(a=.4): t = tt(.28); n = bp(rng.standard_normal(len(t)), 700, 3200) * np.sin(np.pi * np.clip(t / .28, 0, 1)) ** 1.5 * a * .6; return n
def sting(a=.45):   # "dun-DUN": two plucked minor notes + swell
    s = np.zeros(int(1.2 * SR)); add_ = lambda t0, sg: s.__setitem__(slice(int(t0 * SR), int(t0 * SR) + len(sg)), s[int(t0 * SR):int(t0 * SR) + len(sg)] + sg[:len(s) - int(t0 * SR)])
    add_(0, tone(220, .5, a * .6, .004, 7, ((1, 1), (2, .3), (3, .1)))); add_(.16, tone(164.8, .9, a * .8, .004, 4, ((1, 1), (2, .3), (3, .1)))); add_(.16, thud(a * .5)); return s
def flicker(a=.3): t = tt(.09); return lp(np.sign(np.sin(2 * np.pi * 110 * t)) * env_(t, .001, 28) * a * .5 + rng.standard_normal(len(t)) * env_(t, .001, 60) * a * .2, 2500)
def blackout(a=.5): t = tt(.7); f = 260 - 190 * (t / .7); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_(t, .01, 5) * a * .7
fx = np.zeros(N); nch = 0
F = {'pop': lambda t, o, a: add(fx, t, pop()), 'thud': lambda t, o, a: add(fx, t, thud(.5 * a)), 'whoosh': lambda t, o, a: add(fx, t, whoosh(.8 * a)), 'boing': lambda t, o, a: add(fx, t, boing(.3 * a)),
     'step': lambda t, o, a: add(fx, t, step(.4 * a)), 'swell': lambda t, o, a: add(fx, t, swell(o.get('d', .5))), 'impact': lambda t, o, a: add(fx, t, impact()),
     'chime': lambda t, o, a: (add(fx, t, chime(523.25, .18)), add(fx, t + .1, chime(783.99, .13))), 'crunch': lambda t, o, a: add(fx, t, crunch(.5 * a)),
     'poof': lambda t, o, a: add(fx, t, poof()), 'gasp': lambda t, o, a: add(fx, t, gasp(.5 * a)), 'sting': lambda t, o, a: add(fx, t, sting()),
     'flicker': lambda t, o, a: add(fx, t, flicker()), 'blackout': lambda t, o, a: add(fx, t, blackout()), 'music': lambda t, o, a: None}
for n, t, o in ev['events']:
    if n in F:
        F[n](t, o, o.get('a', 1))
ir_t = tt(1.0); ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 4.2); ir = lp(ir, 2600); ir /= np.abs(ir).sum() * .12; fx = fx * .85 + fftconvolve(fx, ir)[:N] * .35

# --- music sections ---
t = np.arange(N) / SR
cues = sorted([(e[1], e[2]['pattern']) for e in ev['events'] if e[0] == 'music']); secs = [(c[0], cues[i + 1][0] if i + 1 < len(cues) else DUR, c[1]) for i, c in enumerate(cues)]
def sec_env(a, b, fi=.25, fo=.4): return np.clip((t - a) / fi, 0, 1) * np.clip((b - t) / fo, 0, 1)
mus = np.zeros(N)
def playful(a, b):
    bpm = 104; beat = 60 / bpm / 2; notes = [220, 261.63, 329.63, 392, 440, 392, 329.63, 261.63]; arp = np.zeros(N); i = 0
    while a + i * beat < b: f = notes[i % 8] * (2 if (i // 8) % 2 else 1); add(arp, a + i * beat, tone(f, .35, .5 if i % 2 == 0 else .3, .004, 9, ((1, 1), (2, .2), (3, .06)))); i += 1
    bass = np.zeros(N); j = 0
    while a + j * beat * 2 < b: add(bass, a + j * beat * 2, tone([110, 87.31, 98, 110][(j // 2) % 4], .4, .5, .005, 6, ((1, 1), (2, .15)))); j += 1
    return (lp(arp, 2800) * .09 + lp(bass, 400) * .12) * sec_env(a, b)
def sneak(a, b):
    beat = 60 / 84; m = np.zeros(N); j = 0; seq = [110, 123.47, 110, 130.81, 110, 103.83, 110, 98]
    while a + j * beat < b: add(m, a + j * beat, tone(seq[j % 8], .22, .6, .004, 14, ((1, 1), (2, .25), (3, .08)))); add(m, a + j * beat + beat / 2, step(.25)); j += 1
    return lp(m, 2200) * .13 * sec_env(a, b, .2, .15)
def hush(a, b):
    d = np.sin(2 * np.pi * 55 * t) + .5 * np.sin(2 * np.pi * 82.4 * t * (1 + .002 * np.sin(2 * np.pi * .3 * t))); m = d * .045 * sec_env(a, b, .5, .3)
    for j in range(int((b - a) / .9)): add(m, a + .6 + j * .9, step(.2))
    return m
def drone(a, b):
    d = np.sin(2 * np.pi * 55 * t) + .6 * np.sin(2 * np.pi * 58 * t) + .3 * np.sin(2 * np.pi * 82.4 * t); return d * .07 * sec_env(a, b, .3, 1.2) * (.7 + .3 * np.sin(2 * np.pi * 5 * t))
for a, b, p in secs: mus += {'playful': playful, 'sneak': sneak, 'hush': hush, 'drone': drone}[p](a, b)
mus *= np.clip((DUR - t) / 1.2, 0, 1)

# --- sidechain duck + mix ---
e = np.abs(vo); b_, a_ = butter(1, 5 / (SR / 2)); e = lfilter(b_, a_, e); e /= e.max() + 1e-9
dfx = 1 - .45 * np.clip(e * 3, 0, 1); dmu = 1 - .55 * np.clip(e * 3, 0, 1)
mix = vo * 1.0 + fx * dfx * .55 + mus * dmu * 1.0
mix = np.tanh(mix); mix /= np.abs(mix).max() / .85
wavfile.write(str(out_dir / 'mix.wav'), SR, (np.stack([mix, mix], 1) * 32767).astype(np.int16))
def ts(x): x = max(0, x); return f'{int(x//3600):02d}:{int(x%3600//60):02d}:{int(x%60):02d},{int(round((x-int(x))*1000)):03d}'
with open(out_dir / f'{NAME}.srt', 'w', encoding='utf-8') as f:
    for i, (k, L) in enumerate(A['lines'].items(), 1): f.write(f"{i}\n{ts(L['start'])} --> {ts(L['end'] + .15)}\n{L['text']}\n\n")
print('mix ok', DUR, 'sections', secs)
