"""Spoken and Caption Text Normalizer and Alignment Mapper.
Maps caption tokens to spoken words when words are spelled out (e.g. 9.6% -> Nine point six percent).
"""
import re
import difflib

NUMBER_WORDS = {
    '0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four',
    '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine',
    '10': 'ten', '11': 'eleven', '12': 'twelve', '13': 'thirteen', '14': 'fourteen',
    '15': 'fifteen', '16': 'sixteen', '17': 'seventeen', '18': 'eighteen', '19': 'nineteen',
    '20': 'twenty', '30': 'thirty', '40': 'forty', '50': 'fifty',
    '60': 'sixty', '70': 'seventy', '80': 'eighty', '90': 'ninety',
    '100': 'hundred', '1000': 'thousand', '%': 'percent', '$': 'dollars'
}

def clean_token(token):
    return re.sub(r'[^a-zA-Z0-9%]', '', token).lower()

def map_caption_to_spoken_words(caption_text, spoken_words):
    """
    caption_text: e.g. "9.6% hidden. Rejected, with proof."
    spoken_words: list of dicts/tuples: [{"w": "Nine", "t0": 0.1, "t1": 0.45}, ...]
    Returns list of caption word dicts with aligned onset (t0) and end (t1).
    """
    cap_tokens = caption_text.split()
    if not spoken_words:
        # Proportional fallback
        return []

    # If counts match exactly
    if len(cap_tokens) == len(spoken_words):
        out = []
        for i, ct in enumerate(cap_tokens):
            sw = spoken_words[i]
            t0 = sw.get('t0', sw[1] if isinstance(sw, (list, tuple)) else 0)
            t1 = sw.get('t1', sw[2] if isinstance(sw, (list, tuple)) else t0 + 0.2)
            out.append({"w": ct, "t0": round(t0, 3), "t1": round(t1, 3)})
        return out

    # If count doesn't match, map via SequenceMatcher or token spans
    # Create normalized representation
    out = []
    num_sp = len(spoken_words)
    num_cap = len(cap_tokens)
    
    # Assign proportional times bounded by spoken word span
    start_t = spoken_words[0]['t0'] if isinstance(spoken_words[0], dict) else spoken_words[0][1]
    end_t = spoken_words[-1]['t1'] if isinstance(spoken_words[-1], dict) else spoken_words[-1][2]
    total_span = max(0.1, end_t - start_t)

    # Calculate letter weights
    lengths = [max(1, len(clean_token(t))) for t in cap_tokens]
    total_len = sum(lengths)
    
    curr = start_t
    for i, (tok, l) in enumerate(zip(cap_tokens, lengths)):
        dur = total_span * (l / total_len)
        out.append({
            "w": tok,
            "t0": round(curr, 3),
            "t1": round(curr + dur, 3)
        })
        curr += dur

    return out

