import subprocess, os, glob
from PIL import Image
DUR = {'world':203.8,'world2':203.8,'flip':119,'future':156,'flip2':119,'future2':156,
       'math':160,'chemistry':218,'hangtian':250,'shadow':174,'deepseek':134}
FR = [0.10, 0.26, 0.42, 0.58, 0.74, 0.88]
OUT = '/sdcard/我的文件/Dsh/mv110/ref/frames'
os.makedirs(OUT, exist_ok=True)
for mv, dur in DUR.items():
    times = ','.join(f'{dur*f:.1f}' for f in FR)
    d = f'/tmp/fr_{mv}'
    os.makedirs(d, exist_ok=True)
    r = subprocess.run(['node', 'render110.mjs', mv, d, times, '1'], cwd='/root/work/cvtest',
                       capture_output=True, text=True, timeout=300)
    pngs = sorted(glob.glob(d + '/*.png'))
    if not pngs:
        print(mv, 'FAILED', r.stderr[-300:]); continue
    dst = os.path.join(OUT, mv); os.makedirs(dst, exist_ok=True)
    for i, p in enumerate(pngs):
        im = Image.open(p).convert('RGB').resize((960, 540), Image.LANCZOS)
        im.save(os.path.join(dst, f'{i+1}.webp'), 'WEBP', quality=82, method=5)
    print(mv, len(pngs), 'frames ok')
