"""Contact Sheet Generator.
Extracts 12 key frames across the rendered video and stitches them into
a high-resolution 4x3 contact sheet for visual inspection and review.
"""
import sys, os, subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

def get_ffmpeg_path():
    root = Path(__file__).resolve().parent.parent
    cands = [
        os.environ.get("FFMPEG_PATH"),
        str(root / "node_modules" / "ffmpeg-static" / "ffmpeg.exe"),
        str(root / "motion-film" / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"),
        str(root / "node_modules" / "@remotion" / "compositor-win32-x64-msvc" / "ffmpeg.exe"),
        "ffmpeg"
    ]
    for c in cands:
        if c and (c == "ffmpeg" or Path(c).is_file()):
            return c
    return "ffmpeg"

FFMPEG = get_ffmpeg_path()

def generate_contact_sheet(projectName="spectra", num_frames=12):
    root = Path(__file__).resolve().parent.parent
    if "/" in str(projectName) or "\\" in str(projectName):
        projectName = Path(projectName).name
    video_path = root / "out" / f"{projectName}-motion-film.mp4"
    if not video_path.is_file():
        # Fallback to silent video if muxed video not found yet
        video_path = root / "projects" / projectName / "build" / "video_silent.mp4"
    if not video_path.is_file():
        raise FileNotFoundError(f"Video file not found: {video_path}")

    # Read duration via ffprobe or default to 45s
    # Extract timestamps
    tmp_dir = root / "projects" / projectName / "build" / "cs_tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    # Clean old files
    for f in tmp_dir.glob("*.jpg"):
        f.unlink()

    # Get video duration using ffmpeg
    dur_cmd = [FFMPEG, "-i", str(video_path)]
    p = subprocess.run(dur_cmd, stderr=subprocess.PIPE, stdout=subprocess.DEVNULL, text=True)
    import re
    m = re.search(r"Duration:\s*(\d+):(\d+):([\d\.]+)", p.stderr)
    if m:
        dur = int(m.group(1)) * 3600 + int(m.group(2)) * 60 + float(m.group(3))
    else:
        dur = 45.0

    times = [round((i + 0.5) * (dur / num_frames), 2) for i in range(num_frames)]
    frame_paths = []

    print(f"[ContactSheet] Extracting {num_frames} frames from {video_path.name} (dur: {dur:.1f}s)...")
    for idx, t in enumerate(times):
        out_jpg = tmp_dir / f"f_{idx:02d}.jpg"
        cmd = [
            FFMPEG, "-y", "-ss", str(t), "-i", str(video_path),
            "-vframes", "1", "-q:v", "2", "-vf", "scale=640:360",
            str(out_jpg)
        ]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        if out_jpg.is_file():
            frame_paths.append((t, out_jpg))

    if not frame_paths:
        print("Error: No frames extracted.")
        return

    # Stitch into 4 columns x 3 rows grid
    cols = 4
    rows = (len(frame_paths) + cols - 1) // cols
    w, h = 640, 360
    pad = 16
    header = 60
    canvas_w = cols * w + (cols + 1) * pad
    canvas_h = rows * h + (rows + 1) * pad + header

    sheet = Image.new("RGB", (canvas_w, canvas_h), color=(14, 15, 19))
    draw = ImageDraw.Draw(sheet)

    # Title header
    draw.text((pad, 18), f"{projectName.upper()} MOTION FILM — CONTACT SHEET ({num_frames} FRAMES, 1080p, 30 FPS)", fill=(242, 237, 226))

    for idx, (t, fpath) in enumerate(frame_paths):
        c = idx % cols
        r = idx // cols
        x = pad + c * (w + pad)
        y = header + pad + r * (h + pad)

        im = Image.open(fpath)
        sheet.paste(im, (x, y))

        # Time label badge
        label = f"t = {t:.2f}s (frame {int(t*30)})"
        draw.rectangle([x + 10, y + 10, x + 160, y + 34], fill=(0, 0, 0, 180))
        draw.text((x + 16, y + 14), label, fill=(242, 237, 226))

    out_sheet = root / "out" / f"{projectName}-contact-sheet.png"
    sheet.save(out_sheet, quality=95)
    print(f"[ContactSheet] Contact sheet saved: {out_sheet}")

    # Clean up tmp_dir
    for f in tmp_dir.glob("*.jpg"):
        f.unlink()
    tmp_dir.rmdir()
    return str(out_sheet)

if __name__ == "__main__":
    p_name = sys.argv[1] if len(sys.argv) > 1 else "spectra"
    generate_contact_sheet(p_name)

