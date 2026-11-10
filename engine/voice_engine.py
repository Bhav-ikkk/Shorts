"""Voice Engine Entry Point.
Delegates to engine/voice/voice_pipeline.py
"""
import sys
import asyncio
from pathlib import Path

# Add voice subdir to path
voice_dir = Path(__file__).resolve().parent / "voice"
sys.path.insert(0, str(voice_dir))

from voice_pipeline import generate_voice

if __name__ == "__main__":
    proj = sys.argv[1] if len(sys.argv) > 1 else "projects/spectra"
    asyncio.run(generate_voice(proj))
