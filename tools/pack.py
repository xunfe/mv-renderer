#!/usr/bin/env python3
"""Build the R2 download packages for MV渲染器 1.1.0.

Each package is a self-contained mini web root. Absolute runtime paths are
rewritten to /custom/<pkg>/..., which is where both the app (AssetServer /
server.js) and the DSH plugin mount downloaded packages.
"""
import hashlib, json, os, re, shutil, sys, zipfile
from pathlib import Path

ROOT = Path('/sdcard/我的文件/Dsh')
SRC = ROOT / 'work107/web'
OUT = ROOT / 'mv110/dist'
REF = ROOT / 'mv110/ref'

GROUPS = {
    'ai': {
        'title': 'AI娘角色主题曲MV',
        'items': ['world', 'world2', 'flip', 'future', 'flip2', 'future2'],
        'dirs': ['mv/world', 'mv/world2', 'mv/flip', 'mv/future', 'mv/flip2', 'mv/future2'],
    },
    'science': {
        'title': '科普简史',
        'items': ['math', 'chemistry', 'hangtian', 'shadow'],
        'dirs': ['mv/math', 'mv/chemistry', 'mv/hangtian', 'mv/shadow'],
    },
    'letters': {
        'title': '大肥鱼的情书',
        'items': ['deepseek'],
        'dirs': ['mv/deepseek'],
    },
    'execute': {
        'title': 'word excuse me',
        'items': ['execute'],
        'dirs': ['execute'],
    },
}

ROOT_FILES = ['mv-start.js', 'mv-return.js', 'mv-quality.js', 'mv-progress.js',
              'mv-player.js', 'rec-ui.js']
TEXT_EXT = {'.html', '.js', '.mjs', '.css', '.svg'}
PREFIX_RE = re.compile(
    r'(?<=["\'(`])/(mv|fonts|assets|audio|data|covers|space|plates|execute|dshpv)/')
ROOT_SCRIPT_RE = re.compile(
    r'(?<=["\'(`])/(mv-start|mv-return|mv-quality|mv-progress|mv-player|rec-ui)\.js')


def rewrite(text, pkg):
    base = f'/custom/{pkg}/'
    text = PREFIX_RE.sub('\\g<0>' if False else base + r'\1/', text)
    text = ROOT_SCRIPT_RE.sub(base + r'\1.js', text)
    return text


def iter_files(base: Path, rel: str):
    p = base / rel
    if p.is_file():
        yield rel
        return
    for dirpath, _dirs, files in os.walk(p):
        for f in files:
            yield os.path.relpath(os.path.join(dirpath, f), base).replace(os.sep, '/')


def build_group(gid, spec, tmp: Path):
    base = tmp / gid
    if base.exists():
        shutil.rmtree(base)
    base.mkdir(parents=True)
    for rel in spec['dirs']:
        srcp = SRC / rel
        for f in iter_files(SRC, rel):
            dst = base / f
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(srcp if srcp.is_file() else SRC / f, dst)
    for f in ROOT_FILES:
        s = SRC / f
        if s.exists():
            shutil.copy2(s, base / f)
    # root-level pkg manifest
    meta = {
        'format': 2,
        'id': gid,
        'title': spec['title'],
        'version': '1.1.0',
        'items': spec['items'],
        'mount': f'/custom/{gid}/',
    }
    (base / 'pkg.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding='utf-8')

    # rewrite absolute refs in text files
    n = 0
    for dirpath, _dirs, files in os.walk(base):
        for f in files:
            p = Path(dirpath) / f
            if p.suffix.lower() not in TEXT_EXT:
                continue
            try:
                s = p.read_text(encoding='utf-8')
            except UnicodeDecodeError:
                continue
            ns = rewrite(s, gid)
            if gid == 'execute' and f == 'mv-return.js':
                pass
            if ns != s:
                p.write_text(ns, encoding='utf-8')
                n += 1
    print(f'  rewrite: {n} text files')
    return base


def zip_group(base: Path, zpath: Path):
    zpath.parent.mkdir(parents=True, exist_ok=True)
    if zpath.exists():
        zpath.unlink()
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as z:
        for dirpath, _dirs, files in os.walk(base):
            for f in files:
                p = Path(dirpath) / f
                z.write(p, p.relative_to(base).as_posix())


def sha256(p: Path):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for b in iter(lambda: f.read(1 << 20), b''):
            h.update(b)
    return h.hexdigest()


def collect_ref():
    """Source code + a short README for each MV, used by the DSH study API."""
    for gid, spec in GROUPS.items():
        for mv in spec['items']:
            src_mv = SRC / ('execute' if mv == 'execute' else f'mv/{mv}')
            dst = REF / 'code' / mv
            if dst.exists():
                shutil.rmtree(dst)
            dst.mkdir(parents=True)
            for dirpath, dirs, files in os.walk(src_mv):
                dirs[:] = [d for d in dirs if d not in ('assets', 'song', 'audio', 'fonts', 'node_modules', '__pycache__', 'tools', 'analysis')]
                for f in files:
                    if not f.endswith(('.js', '.mjs', '.html', '.json', '.md', '.css')):
                        continue
                    p = Path(dirpath) / f
                    if p.stat().st_size > 400_000:
                        continue
                    rel = p.relative_to(src_mv)
                    (dst / rel).parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(p, dst / rel)
            print(f'  ref code {mv}: {sum(1 for _ in dst.rglob("*") if _.is_file())} files')


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    REF.mkdir(parents=True, exist_ok=True)
    tmp = Path('/root/work/mv110_pack')
    if tmp.exists():
        shutil.rmtree(tmp)
    man = {'version': '1.1.0', 'generated': '2026-10-24', 'packages': {}}
    for gid, spec in GROUPS.items():
        print('==', gid)
        base = build_group(gid, spec, tmp)
        z = OUT / f'{gid}.zip'
        zip_group(base, z)
        size = z.stat().st_size
        man['packages'][gid] = {
            'id': gid, 'title': spec['title'], 'items': spec['items'],
            'file': f'{gid}.zip', 'bytes': size,
            'sha256': sha256(z), 'path': f'mv/1.1.0/{gid}.zip',
        }
        print(f'  {z} {size/1e6:.1f} MB')
    (OUT / 'manifest.json').write_text(json.dumps(man, ensure_ascii=False, indent=2), encoding='utf-8')
    collect_ref()
    shutil.rmtree(tmp, ignore_errors=True)
    print('manifest:', OUT / 'manifest.json')


if __name__ == '__main__':
    main()
