"""Unified Voice & Acoustic Pipeline with Provider Interface, Caching, and Alignment Ladder.
Supports Kokoro (local sherpa-onnx), Edge-TTS (with native word boundaries), and File/Custom audio.
"""
import sys
import os
import json
import re
import hashlib
import asyncio
import subprocess
from pathlib import Path
import numpy as np
from scipy.io import wavfile

from normalizer import map_caption_to_spoken_words

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
ENGINE_DIR = Path(__file__).resolve().parent.parent

def get_ffmpeg_path():
    cands = [
        os.environ.get("FFMPEG_PATH"),
        str(ROOT_DIR / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"),
        str(ROOT_DIR / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"),
        "ffmpeg"
    ]
    for c in cands:
        if c and (c == "ffmpeg" or Path(c).is_file()):
            return c
    return "ffmpeg"

FFMPEG = get_ffmpeg_path()

def line_hash(provider, voice, rate, spoken):
    s = f"{provider}|{voice}|{rate}|{spoken}".encode("utf-8")
    return hashlib.sha1(s).hexdigest()

class TTSProvider:
    async def synth(self, spoken, voice, rate, out_wav):
        raise NotImplementedError

class EdgeTTSProvider(TTSProvider):
    async def synth(self, spoken, voice, rate, out_wav):
        import edge_tts
        tmp_mp3 = out_wav.with_suffix(".tmp.mp3")
        words = []
        comm = edge_tts.Communicate(spoken, voice, rate=rate, boundary="WordBoundary")
        
        with open(tmp_mp3, "wb") as f:
            async for chunk in comm.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    t0 = chunk["offset"] / 1e7
                    dur = chunk["duration"] / 1e7
                    words.append({"w": chunk["text"], "t0": round(t0, 3), "t1": round(t0 + dur, 3)})

        # Convert mp3 to 48kHz mono wav
        cmd = [FFMPEG, "-y", "-v", "error", "-i", str(tmp_mp3), "-ar", "48000", "-ac", "1", str(out_wav)]
        subprocess.run(cmd, check=True)
        if tmp_mp3.exists():
            tmp_mp3.unlink()
        return words, "provider-native"

class KokoroProvider(TTSProvider):
    def __init__(self):
        self.model_dir = ENGINE_DIR / "voice" / "models" / "kokoro-en-v0_19"
        self._tts = None

    def is_available(self):
        model_file = self.model_dir / "model.onnx"
        voices_file = self.model_dir / "voices.bin"
        tokens_file = self.model_dir / "tokens.txt"
        return model_file.is_file() and voices_file.is_file() and tokens_file.is_file()

    def _init_tts(self):
        if self._tts is None:
            import sherpa_onnx
            tts_config = sherpa_onnx.OfflineTtsConfig(
                model=sherpa_onnx.OfflineTtsModelConfig(
                    kokoro=sherpa_onnx.OfflineTtsKokoroModelConfig(
                        model=str(self.model_dir / "model.onnx"),
                        voices=str(self.model_dir / "voices.bin"),
                        tokens=str(self.model_dir / "tokens.txt"),
                        data_dir=str(self.model_dir / "espeak-ng-data")
                    ),
                    provider="cpu",
                    num_threads=2
                )
            )
            self._tts = sherpa_onnx.OfflineTts(tts_config)

    async def synth(self, spoken, voice, rate, out_wav):
        self._init_tts()
        # speaker id mapping
        sid = 6 # am_michael default
        if voice == "am_adam": sid = 5
        elif voice == "af_bella": sid = 1
        elif voice == "af_nicole": sid = 2
        elif voice == "af_sarah": sid = 3
        elif voice == "af_sky": sid = 4
        elif voice == "bf_emma": sid = 7

        speed = 1.06
        if rate:
            m = re.match(r'([+-]?\d+)%', rate)
            if m:
                speed = 1.0 + int(m.group(1)) / 100.0

        audio = self._tts.generate(spoken, sid=sid, speed=speed)
        samples = np.array(audio.samples, dtype=np.float32)
        sr = audio.sample_rate

        # Resample to 48kHz mono
        if sr != 48000:
            import math
            from scipy.signal import resample_poly
            gcd = math.gcd(48000, sr)
            samples = resample_poly(samples, 48000 // gcd, sr // gcd)
            sr = 48000

        max_val = np.abs(samples).max()
        if max_val > 1e-4:
            samples = samples / max_val * 0.92

        wavfile.write(str(out_wav), sr, (samples * 32767).astype(np.int16))
        return None, "proportional-rms"

class FileProvider(TTSProvider):
    async def synth(self, spoken, voice, rate, out_wav):
        # Audio file already exists in audio dir
        if not out_wav.is_file():
            raise FileNotFoundError(f"Source audio wav not found: {out_wav}")
        return None, "proportional-rms"

def trim_silence_and_offset_words(wav_path, native_words):
    sr, s = wavfile.read(wav_path)
    s = s.astype(np.float32)
    if len(s.shape) > 1:
        s = s.mean(axis=1)
    if np.abs(s).max() > 2:
        s = s / 32768.0

    idx = np.where(np.abs(s) > 0.012)[0]
    lead_sec = 0.0
    if len(idx) > 0:
        lead_samples = max(0, idx[0] - int(0.02 * sr))
        trail_samples = min(len(s), idx[-1] + int(0.06 * sr))
        lead_sec = lead_samples / sr
        s = s[lead_samples:trail_samples]
    else:
        s = s[:int(0.5 * sr)]

    wavfile.write(wav_path, sr, (s * 32767).astype(np.int16))
    dur = len(s) / sr

    # Adjust native words onset by lead silence trimmed
    adjusted_words = []
    if native_words:
        for w in native_words:
            t0 = max(0.01, w["t0"] - lead_sec)
            t1 = max(t0 + 0.05, min(dur, w["t1"] - lead_sec))
            adjusted_words.append({"w": w["w"], "t0": round(t0, 3), "t1": round(t1, 3)})

    # Energy segments (10ms windows)
    w_size = int(0.01 * sr)
    n = len(s) // w_size
    segs = []
    if n > 0:
        e = np.sqrt((s[:n*w_size].reshape(n, w_size)**2).mean(1))
        on = e > max(0.02 * e.max(), 0.004)
        i = 0
        while i < n:
            if on[i]:
                j = i
                while j < n and (on[j] or (j + 1 < n and on[j+1:j+8].any())):
                    j += 1
                segs.append([round(i * 0.01, 3), round(j * 0.01, 3)])
                i = j
            else:
                i += 1
    if not segs:
        segs = [[0.02, round(dur - 0.02, 3)]]

    return dur, segs, adjusted_words

async def generate_voice(project_dir):
    p_dir = Path(project_dir).resolve()
    conf_file = p_dir / "project.json"
    if not conf_file.is_file():
        raise FileNotFoundError(f"Missing project.json in {p_dir}")

    with open(conf_file, "r", encoding="utf-8") as f:
        conf = json.load(f)

    audio_dir = p_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    build_dir = p_dir / "build"
    build_dir.mkdir(parents=True, exist_ok=True)
    cache_dir = build_dir / "cache" / "voice"
    cache_dir.mkdir(parents=True, exist_ok=True)

    v_conf = conf.get("voice", {})
    provider_name = v_conf.get("provider", "kokoro")
    voice_name = v_conf.get("voice", "am_michael")
    rate = v_conf.get("rate", "-4%")
    script = conf.get("script", [])

    # Instantiate provider (Kokoro local ONNX default)
    kokoro = KokoroProvider()
    if (provider_name == "kokoro" or not provider_name or provider_name == "default") and kokoro.is_available():
        provider = kokoro
        if not voice_name or voice_name.startswith("en-US"):
            voice_name = "am_michael"
    elif provider_name == "edge-tts":
        provider = EdgeTTSProvider()
    elif provider_name == "kokoro" and not kokoro.is_available():
        print("[Voice] Kokoro model not found in models/kokoro-en-v0_19. Falling back to edge-tts.")
        voice_name = "en-US-ChristopherNeural"
        provider = EdgeTTSProvider()
    elif provider_name == "custom" or provider_name == "file":
        provider = FileProvider()
    else:
        provider = kokoro if kokoro.is_available() else EdgeTTSProvider()

    print(f"[Voice] Generating voice using {type(provider).__name__} ({voice_name})...")

    lines_out = {}
    current_t = 0.25

    for item in script:
        k = item["id"]
        spoken = item["spoken"]
        cap = item.get("caption", spoken)
        pause = item.get("pause_after", item.get("pauseAfter", 0.5))
        wav_path = audio_dir / f"{k}.wav"

        # Check per-line cache
        l_hash = line_hash(type(provider).__name__, voice_name, rate, spoken)
        cached_wav = cache_dir / f"{l_hash}.wav"
        cached_meta = cache_dir / f"{l_hash}.json"

        native_words = None
        method = "proportional-rms"

        if cached_wav.is_file() and cached_meta.is_file():
            print(f"  {k}: [CACHE HIT] {l_hash[:8]}")
            import shutil
            shutil.copyfile(str(cached_wav), str(wav_path))
            with open(cached_meta, "r", encoding="utf-8") as mf:
                m_data = json.load(mf)
                native_words = m_data.get("words")
                method = m_data.get("method", "provider-native")
        else:
            if isinstance(provider, FileProvider) and wav_path.is_file():
                # Keep existing file
                pass
            else:
                native_words, method = await provider.synth(spoken, voice_name, rate, wav_path)

        # Process trimming & onsets
        dur, segs, adjusted_words = trim_silence_and_offset_words(wav_path, native_words)

        # Map to caption tokens
        if adjusted_words:
            mapped_words = map_caption_to_spoken_words(cap, adjusted_words)
            method = "provider-native"
        else:
            # Proportional fallback
            cap_words = cap.split()
            lengths = [max(1, len(re.sub(r'[^A-Za-z0-9%]', '', w_))) for w_ in cap_words]
            total_l = sum(lengths)
            mapped_words = []
            c = 0.0
            a0 = 0.02
            a1 = max(0.04, dur - 0.08)
            for w_, l_ in zip(cap_words, lengths):
                mapped_words.append({
                    "w": w_,
                    "t0": round(a0 + (a1 - a0) * (c / total_l), 3),
                    "t1": round(a0 + (a1 - a0) * ((c + l_) / total_l), 3)
                })
                c += l_
            method = "proportional-rms"

        # Save to cache
        if not cached_wav.is_file():
            import shutil
            shutil.copyfile(str(wav_path), str(cached_wav))
            with open(cached_meta, "w", encoding="utf-8") as mf:
                json.dump({"words": adjusted_words, "method": method}, mf)

        # Convert words to the engine format: [word, relOnset, relEnd]
        words_arr = [[w["w"], w["t0"], w["t1"]] for w in mapped_words]

        line_data = {
            "text": cap,
            "spoken": spoken,
            "start": round(current_t, 3),
            "dur": round(dur, 3),
            "end": round(current_t + dur, 3),
            "segs": segs,
            "words": words_arr,
            "gap": round(pause, 3),
            "method": method
        }

        lines_out[k] = line_data
        print(f"  {k} [{method}]: {line_data['start']}s -> {line_data['end']}s (dur {line_data['dur']}s, {len(words_arr)} words)")
        current_t = round(current_t + dur + pause, 3)

    total_time = round(current_t, 2)
    anchors_payload = {
        "lines": lines_out,
        "total": total_time
    }

    # Save anchors.json
    anchors_json_path = p_dir / "anchors.json"
    with open(anchors_json_path, "w", encoding="utf-8") as f:
        json.dump(anchors_payload, f, indent=2)

    # Save anchors.js with browser timing API
    anchors_js_path = build_dir / "anchors.js"
    with open(anchors_js_path, "w", encoding="utf-8") as f:
        f.write(f"""// Generated Anchors & Acoustic Timing API
window.ANCH = {json.dumps(anchors_payload, indent=2)};

(function() {{
  const A = window.ANCH.lines;
  window.st = function(k) {{ return A[k] ? A[k].start : 0; }};
  window.en = function(k) {{ return A[k] ? A[k].end : 0; }};
  window.dur = function(k) {{ return A[k] ? A[k].dur : 0; }};
  
  // Word onset relative to line or absolute
  window.W = function(k, word) {{
    if (!A[k] || !A[k].words) return window.st(k);
    const item = A[k].words.find(w => w[0].toLowerCase().includes(word.toLowerCase()));
    return item ? round3(A[k].start + item[1]) : window.st(k);
  }};
  
  // Word by index: WI(k, i) returns onset relative to video
  window.WI = function(k, i) {{
    if (!A[k] || !A[k].words || !A[k].words[i]) return window.st(k);
    return round3(A[k].start + A[k].words[i][1]);
  }};

  // Word end by index: WE(k, i) returns end relative to video
  window.WE = function(k, i) {{
    if (!A[k] || !A[k].words || !A[k].words[i]) return window.en(k);
    return round3(A[k].start + A[k].words[i][2]);
  }};

  window.SS = function(k) {{ return A[k] && A[k].segs && A[k].segs[0] ? round3(A[k].start + A[k].segs[0][0]) : window.st(k); }};
  window.SSo = function(k, i) {{ return A[k] && A[k].segs && A[k].segs[i] ? round3(A[k].start + A[k].segs[i][0]) : window.st(k); }};
  window.SG = function(k, i) {{ return A[k] ? A[k].gap : 0.5; }};

  function round3(n) {{ return Math.round(n * 1000) / 1000; }}
}})();
""")

    print(f"[Voice] Complete. Total duration: {total_time}s")
    print(f"[Voice] Anchors written to {anchors_json_path}")
    return anchors_payload

if __name__ == "__main__":
    proj = sys.argv[1] if len(sys.argv) > 1 else "projects/spectra"
    asyncio.run(generate_voice(proj))

