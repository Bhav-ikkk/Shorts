#!/bin/bash
# two-pass loudnorm (pre-encode TP -2.0), 48 kHz, then mux and MEASURE AFTER AAC encode
NAME=${NAME:-blocky-ep2}; set -e; cd "$(dirname "$0")/out"
J=$(ffmpeg -hide_banner -nostats -i mix.wav -af loudnorm=I=-14:TP=-2.0:LRA=7:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
g(){ echo "$J" | python3 -c "import sys,json;print(json.load(sys.stdin)['$1'])"; }
TOT=$(python3 -c "import json;print(json.load(open('../data/events.json'))['total']-.9)")
AF="loudnorm=I=-14:TP=-2.0:LRA=7:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true,afade=t=in:d=0.04,afade=t=out:st=$TOT:d=0.9"
ffmpeg -y -v error -i silent.mp4 -i mix.wav -map 0:v -map 1:a -c:v copy -af "$AF" -ar 48000 -c:a aac -b:a 192k -shortest -movflags +faststart ${NAME}.tmp.mp4 && mv ${NAME}.tmp.mp4 ${NAME}.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height,r_frame_rate,sample_rate -of compact ${NAME}.mp4
ffmpeg -hide_banner -nostats -i ${NAME}.mp4 -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):"
echo -n "black frames: "; ffmpeg -hide_banner -nostats -i ${NAME}.mp4 -vf blackdetect=d=0.2:pix_th=0.05 -an -f null - 2>&1 | grep -c black_start || true
