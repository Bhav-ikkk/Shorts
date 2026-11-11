"""
Blocky Story Engine — Audio v2: Multi-Voice Kokoro Synthesis
Multi-voice dialogue -> wavs + anchors.json (timing) + lip.json (mouth envelope).
Supports pitch transposition, delivery styles (whisper, panic, normal), and line caching.
Zero external API calls.
"""
import sys, json, re, os, hashlib
from pathlib import Path
import numpy as np, sherpa_onnx
from scipy.io import wavfile

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))
from audio.pitch_shift import pitch_shift

M = str(BASE_DIR.parent / 'engine' / 'voice' / 'models' / 'kokoro-en-v0_19')
if not os.path.exists(f'{M}/model.onnx'):
    raise FileNotFoundError(f'Kokoro model not found at {M}')

cfg = sherpa_onnx.OfflineTtsConfig(
    model=sherpa_onnx.OfflineTtsModelConfig(
        kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
            model=f'{M}/model.onnx',
            voices=f'{M}/voices.bin',
            tokens=f'{M}/tokens.txt',
            data_dir=f'{M}/espeak-ng-data'
        ),
        num_threads=2,
        provider='cpu'
    ),
    max_num_sentences=1
)
tts = sherpa_onnx.OfflineTts(cfg)

data_dir = BASE_DIR / 'data'
story_dir = BASE_DIR / 'story'
vo_dir = BASE_DIR / 'vo'
cache_dir = BASE_DIR / '.cache' / 'vo'
vo_dir.mkdir(parents=True, exist_ok=True)
cache_dir.mkdir(parents=True, exist_ok=True)

# Load Episode Data
EP = json.load(open(data_dir / 'episode.json', encoding='utf-8'))

# Load Cast Data (from story/cast.json if available, else data/cast.json)
cast_file = story_dir / 'cast.json' if (story_dir / 'cast.json').exists() else data_dir / 'cast.json'
CAST = json.load(open(cast_file, encoding='utf-8'))['cast']
VOICES = {k: v['voice'] for k, v in CAST.items()}

L = [(l['id'], l['who'], l.get('spoken', l['text']), l['text'], l.get('pause', .3), l.get('style', '')) for l in EP['lines']]
out = {}; lip = {}; t = .2

print(f"[Voice Engine] Synthesizing {len(L)} dialogue line(s) for '{EP.get('id', 'episode')}'...")

for k, spk, spoken, cap, gap, style in L:
    v = VOICES[spk]
    sid = v.get('sid', 0)
    speed = v.get('speed', 1.0)
    pitch = v.get('pitch', 0.0)

    # Compute cache key from line parameters
    cache_str = f"{spoken}_{sid}_{speed}_{pitch}_{style}"
    cache_hash = hashlib.sha256(cache_str.encode('utf-8')).hexdigest()[:16]
    cache_wav = cache_dir / f"{cache_hash}.wav"
    target_wav = vo_dir / f"{k}.wav"

    if cache_wav.exists():
        sr, s = wavfile.read(str(cache_wav))
        s = s.astype(np.float32)
        if np.abs(s).max() > 2.0:
            s /= 32768.0
        wavfile.write(str(target_wav), sr, s)
        print(f"  ✓ {k:<4} [{spk:<4} sid={sid} pitch={pitch:+.1f} st] CACHE HIT")
    else:
        # Synthesize via Kokoro neural TTS
        a = tts.generate(spoken, sid=sid, speed=speed)
        s = np.array(a.samples, dtype=np.float32)
        sr = a.sample_rate

        # Trim leading/trailing silence
        idx = np.where(np.abs(s) > .012)[0]
        if len(idx) > 0:
            s = s[max(0, idx[0] - int(.02 * sr)):idx[-1] + int(.06 * sr)]

        # Apply pitch shift if configured (e.g. Toddler character +3.5 st)
        if abs(pitch) > 0.05:
            s = pitch_shift(s, pitch, sr)

        # Style delivery adjustment
        if style == 'whisper':
            # Attenuate low end, boost high air
            from scipy.signal import butter, lfilter
            b_hp, a_hp = butter(2, 250 / (sr / 2), 'high')
            s = lfilter(b_hp, a_hp, s) * 0.75
        elif style in ('panic', 'shout'):
            # Presence boost (2.5k - 4.5k) + mild saturation
            s = np.tanh(s * 1.25) / 1.25

        # Normalize and save to cache & target
        s = s / (np.abs(s).max() + 1e-9) * 0.92
        wavfile.write(str(cache_wav), sr, (s * 32767).astype(np.int16))
        wavfile.write(str(target_wav), sr, s)
        print(f"  ✓ {k:<4} [{spk:<4} sid={sid} pitch={pitch:+.1f} st] SYNTHESIZED ({len(s)/sr:.2f}s)")

    d = len(s) / sr
    w = int(.01 * sr)
    n = len(s) // w
    if n > 0:
        e = np.sqrt((s[:n * w].reshape(n, w) ** 2).mean(1))
        on = e > max(.02 * e.max(), .004)
        segs = []; i = 0
        while i < n:
            if on[i]:
                j = i
                while j < n and (on[j] or (j + 1 < n and on[j + 1:j + 8].any())): j += 1
                segs.append([round(i * .01, 2), round(j * .01, 2)]); i = j
            else: i += 1
    else:
        segs = []

    # Word onsets (letter-weighted proportional)
    sents = [x for x in re.split(r'(?<=[.?!])\s+', cap) if x]
    words = []
    def prop(ws, a0, a1):
        lets = [max(1, len(re.sub(r'[^A-Za-z0-9]', '', x))) for x in ws]
        tot = sum(lets)
        c = 0
        for x, l in zip(ws, lets):
            words.append([x, round(a0 + (a1 - a0) * c / tot, 3)])
            c += l

    if len(segs) == len(sents) and len(sents) > 1:
        for sent, (a0, a1) in zip(sents, segs):
            prop(sent.split(), a0, a1)
    else:
        prop(cap.split(), 0.02, d - .08)

    # Mouth envelope @60Hz (0..1), smoothed
    hop = int(sr / 60)
    m = len(s) // hop
    if m > 0:
        env_arr = np.sqrt((s[:m * hop].reshape(m, hop) ** 2).mean(1))
        env_arr = env_arr / (np.percentile(env_arr, 95) + 1e-9)
        env_arr = np.clip(env_arr, 0, 1)
        env_arr = np.convolve(env_arr, np.ones(3) / 3, 'same')
        lip[k] = [round(float(x), 3) for x in env_arr]
    else:
        lip[k] = []

    out[k] = dict(speaker=spk, text=cap, start=round(t, 3), dur=round(d, 3), end=round(t + d, 3), segs=segs, words=words, gap=gap, style=style)
    t += d + gap

total = round(t + 2.3, 2)
json.dump(dict(lines=out, total=total), open(data_dir / 'anchors.json', 'w', encoding='utf-8'), indent=2)
json.dump(lip, open(data_dir / 'lip.json', 'w', encoding='utf-8'))
print(f"[Voice Engine] Multi-voice anchors & lip sync completed. Total runtime: {total}s")
