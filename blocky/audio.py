"""
Blocky Story Engine — Audio Pipeline Entrypoint
Delegates to modular Audio v2 Mixer (procedural SFX + procedural music beds + Kokoro VO).
"""
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from audio.mixer import mix_audio

if __name__ == '__main__':
    mix_audio()
