#!/usr/bin/env python3
"""从 brand/source-icon-1024.png 生成所有平台图标。
把人物脸部往画面中心挪（+70, -50），再派生安卓 mipmap / 自适应层 / PC ico。
"""
import os
import shutil
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BRAND = os.path.join(ROOT, 'brand')
SRC = os.path.join(BRAND, 'source-icon-1024.png')
BG = os.path.join(BRAND, 'ic_bg.png')
DX, DY = 80, -15
SCALE = 0.96
FEATHER = 16

src = Image.open(SRC).convert('RGBA')
bg = Image.open(BG).convert('RGBA')

# 缩放一点，再往右/上挪，让脸部落到画面中心附近
size = round(1024 * SCALE)
art = src.resize((size, size), Image.LANCZOS)
# 边缘羽化，避免缩放后的方形边缘在渐变背景上露出硬边
m = Image.new('L', (size, size), 0)
ImageDraw.Draw(m).rectangle((FEATHER, FEATHER, size - 1 - FEATHER, size - 1 - FEATHER), fill=255)
m = m.filter(ImageFilter.GaussianBlur(FEATHER / 2))
art.putalpha(ImageChops.multiply(art.getchannel('A'), m))
fg = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
fg.alpha_composite(art, ((1024 - size) // 2 + DX, (1024 - size) // 2 + DY))
fg.save(os.path.join(BRAND, 'ic_fg.png'))

# 主图：背景 + 前景
master = bg.copy()
master.alpha_composite(fg)
master.convert('RGB').save(os.path.join(BRAND, 'icon-1024.png'))
master.resize((256, 256), Image.LANCZOS).save(os.path.join(BRAND, 'icon-256.png'))

def rounded(im, radius_ratio=0.22):
    w, h = im.size
    r = int(w * radius_ratio)
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w - 1, h - 1), r, fill=255)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out

def circle(im):
    w, h = im.size
    mask = Image.new('L', (w, h), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, w - 1, h - 1), fill=255)
    out = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out

# 圆形图标
rounded(master.convert('RGBA')).save(os.path.join(BRAND, 'ic_launcher.png'))
circle(master.convert('RGBA')).save(os.path.join(BRAND, 'ic_round.png'))

# 安卓 mipmap
RES = os.path.join(ROOT, '..', 'mv-renderer', 'android', 'app', 'src', 'main', 'res')
sizes = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
for dpi, size in sizes.items():
    d = os.path.join(RES, 'mipmap-' + dpi)
    im = master.convert('RGBA').resize((size, size), Image.LANCZOS)
    rounded(im).save(os.path.join(d, 'ic_launcher.png'))
    circle(im).save(os.path.join(d, 'ic_launcher_round.png'))
# 自适应前景（1024）
fg.save(os.path.join(RES, 'drawable', 'ic_fg.png'))
shutil.copyfile(BG, os.path.join(RES, 'drawable', 'ic_bg.png'))

# PC
PC = os.path.join(ROOT, '..', 'mv-renderer', 'pc')
master.resize((256, 256), Image.LANCZOS).save(os.path.join(PC, 'icon.png'))
master.save(os.path.join(PC, 'icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print('icons generated')
