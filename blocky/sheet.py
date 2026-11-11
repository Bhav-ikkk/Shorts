import sys, os
from pathlib import Path
from PIL import Image, ImageDraw

d = Path(sys.argv[1])
out = Path(sys.argv[2])
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4

files = sorted(list(d.glob('t_*.png')), key=lambda p: float(p.stem.split('t_')[1]))
if not files:
    print('No t_*.png stills found')
    sys.exit(0)

w, h = 324, 576
rows = (len(files) + cols - 1) // cols
im = Image.new('RGB', (cols * w, rows * h), 'black')

for i, f in enumerate(files):
    t_str = f.stem.split('t_')[1]
    a = Image.open(f).convert('RGB').resize((w, h))
    ImageDraw.Draw(a).text((10, 10), f"{t_str}s", fill='yellow')
    im.paste(a, ((i % cols) * w, (i // cols) * h))

out.parent.mkdir(parents=True, exist_ok=True)
im.save(str(out))
print(f'Contact sheet saved: {len(files)} stills -> {out}')
