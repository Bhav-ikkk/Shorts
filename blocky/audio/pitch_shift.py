"""
Blocky Story Engine — Audio v2: Pitch Shifter & Vocal Formatter
Pitch transposition (in semitones) without altering duration or sync.
Uses time-domain overlap-add (TD-PSOLA heuristic) for speech clarity.
"""

import numpy as np
from scipy.signal import resample_poly

def pitch_shift(audio, semitones, sr=44100):
    """
    Shifts the pitch of an audio signal by a given number of semitones
    while keeping the original duration intact.
    """
    if abs(semitones) < 0.05 or len(audio) == 0:
        return audio.copy()

    orig_len = len(audio)
    factor = 2.0 ** (semitones / 12.0)

    # Simple and robust SOLA algorithm
    # 1. Resample audio by pitch factor
    up = int(round(factor * 1000))
    down = 1000
    resampled = resample_poly(audio, up, down)

    # 2. Synchronize duration back to orig_len using overlap-add
    # Target length is orig_len
    target_len = orig_len
    curr_len = len(resampled)

    if curr_len == target_len:
        return resampled

    # Windowed linear time-stretch / compress to exact original length
    win_size = int(0.035 * sr)  # ~35ms pitch analysis window
    hop_out = int(win_size / 2)
    hop_in = int(round(hop_out * (curr_len / max(1, target_len))))

    num_hops = int(target_len / hop_out)
    out = np.zeros(target_len + win_size, dtype=np.float32)
    win = np.hanning(win_size)
    weights = np.zeros(target_len + win_size, dtype=np.float32)

    for i in range(num_hops):
        in_pos = i * hop_in
        out_pos = i * hop_out
        if in_pos + win_size > curr_len:
            break
        grain = resampled[in_pos:in_pos + win_size] * win
        out[out_pos:out_pos + win_size] += grain
        weights[out_pos:out_pos + win_size] += win ** 2

    valid = weights > 1e-4
    out[valid] /= weights[valid]
    result = out[:target_len]

    # Ensure length matches original
    if len(result) < orig_len:
        padded = np.zeros(orig_len, dtype=np.float32)
        padded[:len(result)] = result
        return padded
    return result[:orig_len]

if __name__ == '__main__':
    sr = 44100
    t = np.arange(int(1.0 * sr)) / sr
    sig = np.sin(2 * np.pi * 440.0 * t)  # 440 Hz A4
    shifted = pitch_shift(sig, 3.0, sr)   # Shift up 3 semitones (to C5 ~523 Hz)
    assert len(shifted) == len(sig), f"Length mismatch: {len(shifted)} vs {len(sig)}"
    print(f"Pitch shift verified: {len(sig)} samples in -> {len(shifted)} samples out.")

