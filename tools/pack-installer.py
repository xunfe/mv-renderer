#!/usr/bin/env python3
"""把插件打成分发用的 zip：安装.sh + 使用说明.md + package/*.tgz。

用法：python3 tools/pack-installer.py
前置：先在 plugin/ 里 npm pack 出 dist/dsh-mv-hub-<版本>.tgz。
产物：dist/dsh-mv-hub-<版本>.zip（解压后第一层是 dsh-mv-hub-<版本>/）
"""
import json
import os
import shutil
import sys
import tempfile
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# 两种布局：外层 mv110/（plugin/ + tools/），或插件仓根目录（package.json + tools/）
if os.path.isfile(os.path.join(ROOT, 'plugin', 'package.json')):
    PLUGIN = os.path.join(ROOT, 'plugin')
else:
    PLUGIN = ROOT
DIST = os.path.join(ROOT, 'dist')
TPL = os.path.join(ROOT, 'tools', 'installer')
NAME = 'dsh-mv-hub'
os.makedirs(DIST, exist_ok=True)

version = json.load(open(os.path.join(PLUGIN, 'package.json'), encoding='utf-8'))['version']
tgz = os.path.join(DIST, f'{NAME}-{version}.tgz')
if not os.path.isfile(tgz):
    sys.exit(f'缺少 {tgz}，先在 plugin/ 里执行：npm pack --pack-destination ../dist')

out = os.path.join(DIST, f'{NAME}-{version}.zip')
stage = tempfile.mkdtemp(prefix='mvhub-zip-')
top = os.path.join(stage, f'{NAME}-{version}')

def put(src, rel, mode=0o644):
    dst = os.path.join(top, rel)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    text = open(src, encoding='utf-8').read().replace('__VERSION__', version)
    with open(dst, 'w', encoding='utf-8') as f:
        f.write(text)
    os.chmod(dst, mode)

put(os.path.join(TPL, '安装.sh'), '安装.sh', 0o755)
put(os.path.join(TPL, '使用说明.md'), '使用说明.md', 0o644)
os.makedirs(os.path.join(top, 'package'), exist_ok=True)
shutil.copy2(tgz, os.path.join(top, 'package', os.path.basename(tgz)))

with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
    for base, _dirs, files in os.walk(top):
        for f in sorted(files):
            full = os.path.join(base, f)
            rel = os.path.relpath(full, stage).replace(os.sep, '/')
            info = zipfile.ZipInfo(rel, (2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (0o755 if os.access(full, os.X_OK) else 0o644) << 16
            with open(full, 'rb') as fh:
                z.writestr(info, fh.read())

shutil.rmtree(stage, ignore_errors=True)
print(f'已生成 {out}（{os.path.getsize(out) / 1e6:.1f} MB）')
print(f'解压后第一层：{NAME}-{version}/')
print('  ├── 安装.sh')
print('  ├── 使用说明.md')
print(f'  └── package/{os.path.basename(tgz)}')
