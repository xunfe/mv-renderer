#!/usr/bin/env python3
"""把仓库根目录的 web/ 摊进安卓工程的 assets。

AssetServer 的映射关系（见 android/app/src/main/java/com/dsha/xmmv/AssetServer.java）：
    /            -> assets/www
    /engine/...  -> assets/engine
    /execute/... -> assets/execute

PC 独有的 dshpv/、space/ 不打进 APK。
world.execute (me) 的原曲（song.flac）因为只在个人设备上使用，不随仓库分发，
需要的话自己放一份到 web/execute/song.flac（或 m4a）再跑本脚本。
"""
import os
import shutil
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web')
ASSETS = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'assets')
SKIP = {'dshpv', 'space'}


def copy_tree(src, dst, skip=()):
    os.makedirs(dst, exist_ok=True)
    for name in sorted(os.listdir(src)):
        if name in skip:
            continue
        s = os.path.join(src, name)
        d = os.path.join(dst, name)
        if os.path.isdir(s):
            copy_tree(s, d)
        else:
            shutil.copy2(s, d)


def main():
    if not os.path.isdir(WEB):
        sys.exit('找不到 web/，请在仓库根目录运行')
    www = os.path.join(ASSETS, 'www')
    for d in ('www', 'engine', 'execute'):
        shutil.rmtree(os.path.join(ASSETS, d), ignore_errors=True)
    os.makedirs(www, exist_ok=True)
    for name in sorted(os.listdir(WEB)):
        if name in SKIP or name in ('engine', 'execute'):
            continue
        s = os.path.join(WEB, name)
        d = os.path.join(www, name)
        if os.path.isdir(s):
            copy_tree(s, d)
        else:
            shutil.copy2(s, d)
    copy_tree(os.path.join(WEB, 'engine'), os.path.join(ASSETS, 'engine'))
    copy_tree(os.path.join(WEB, 'execute'), os.path.join(ASSETS, 'execute'))
    flac = os.path.join(ASSETS, 'execute', 'song.flac')
    if not os.path.exists(flac):
        print('提示：assets/execute/song.flac 不存在，world.execute (me) 离线版将没有声音')
    total = sum(
        os.path.getsize(os.path.join(r, f))
        for r, _, fs in os.walk(ASSETS) for f in fs
    )
    print('assets 生成完成: %.1f MB' % (total / 1e6))


if __name__ == '__main__':
    main()
