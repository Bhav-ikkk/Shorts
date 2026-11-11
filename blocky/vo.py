"""Two-voice dialogue -> wavs + anchors.json (timing) + lip.json (mouth envelope). Local Kokoro via sherpa-onnx. No API keys."""
import sys, json, re, os
from pathlib import Path
import numpy as np, sherpa_onnx
from scipy.io import wavfile

BASE_DIR = Path(__file__).resolve().parent
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
vo_dir = BASE_DIR / 'vo'
vo_dir.mkdir(parents=True, exist_ok=True)

EP = json.load(open(data_dir / 'episode.json', encoding='utf-8'))
CAST = json.load(open(data_dir / 'cast.json', encoding='utf-8'))['cast']
VOICES = {k: v['voice'] for k, v in CAST.items()}
L = [(l['id'], l['who'], l.get('spoken', l['text']), l['text'], l.get('pause', .3), l.get('style', '')) for l in EP['lines']]
out = {}; lip = {}; t = .2

for k, spk, spoken, cap, gap, style in L:
    v = VOICES[spk]
    a = tts.generate(spoken, sid=v['sid'], speed=v['speed'])
    s = np.array(a.samples, dtype=np.float32)
    sr = a.sample_rate
    idx = np.where(np.abs(s) > .012)[0]
    if len(idx) > 0:
        s = s[max(0, idx[0] - int(.02 * sr)):idx[-1] + int(.06 * sr)]
    wavfile.write(str(vo_dir / f'{k}.wav'), sr, s)
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

    # word onsets (letter-weighted proportional, sentence-aware when segments match sentences)
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

    # mouth envelope @60Hz (0..1), smoothed
    hop = int(sr / 60)
    m = len(s) // hop
    if m > 0:
        env = np.sqrt((s[:m * hop].reshape(m, hop) ** 2).mean(1))
        env = env / (np.percentile(env, 95) + 1e-9)
        env = np.clip(env, 0, 1)
        env = np.convolve(env, np.ones(3) / 3, 'same')
        lip[k] = [round(float(x), 3) for x in env]
    else:
        lip[k] = []

    out[k] = dict(speaker=spk, text=cap, start=round(t, 3), dur=round(d, 3), end=round(t + d, 3), segs=segs, words=words, gap=gap, style=style)
    t += d + gap

total = round(t + 2.3, 2)
json.dump(dict(lines=out, total=total), open(data_dir / 'anchors.json', 'w', encoding='utf-8'), indent=2)
json.dump(lip, open(data_dir / 'lip.json', 'w', encoding='utf-8'))
for k, v in out.items():
    print(k, v['speaker'], v['start'], '->', v['end'], 'dur', v['dur'])
print('total', total)
