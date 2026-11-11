#!/bin/bash
max=0; while pgrep -f "node render.js" >/dev/null; do s=$(ps -eo rss,args | grep -E "chrom|headless_shell|ffmpeg|node render" | grep -v grep | awk '{s+=$1} END{print s+0}'); [ "$s" -gt "$max" ] && max=$s; sleep .5; done; echo "PEAK_RSS_MB=$((max/1024))" > out/ram.txt
