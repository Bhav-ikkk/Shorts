"""Helper script to download official Sherpa-ONNX Kokoro-v0.19 model for 100% offline TTS.
"""
import os
import sys
import tarfile
import urllib.request
from pathlib import Path

MODEL_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/kokoro-en-v0_19.tar.bz2"
TARGET_DIR = Path(__file__).resolve().parent / "models"

def download_kokoro():
    TARGET_DIR.mkdir(parents=True, exist_ok=True)
    archive_path = TARGET_DIR / "kokoro-en-v0_19.tar.bz2"
    extracted_dir = TARGET_DIR / "kokoro-en-v0_19"

    if (extracted_dir / "model.onnx").is_file():
        print(f"[Kokoro] Model files already exist in {extracted_dir}")
        return True

    print(f"[Kokoro] Downloading Kokoro-en-v0_19 model (approx 319 MB)...")
    print(f"  URL: {MODEL_URL}")
    print(f"  Destination: {archive_path}")

    def progress(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size)
        sys.stdout.write(f"\r  Downloading: {percent}% ({count * block_size // (1024*1024)} MB / {total_size // (1024*1024)} MB)")
        sys.stdout.flush()

    urllib.request.urlretrieve(MODEL_URL, str(archive_path), reporthook=progress)
    print("\n[Kokoro] Extracting archive...")
    with tarfile.open(str(archive_path), "r:bz2") as tar:
        tar.extractall(path=str(TARGET_DIR))

    if archive_path.is_file():
        archive_path.unlink()

    print(f"[Kokoro] Model successfully installed to {extracted_dir}")
    return True

if __name__ == "__main__":
    download_kokoro()

