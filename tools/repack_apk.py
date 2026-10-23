#!/usr/bin/env python3
"""快速重打包 APK：只改 AndroidManifest.xml 的 versionCode/versionName，
再用给定的 keystore 重新签名（v2/v3）。

这个脚本是给「手上只有一个已签名的基线 APK，SDK 的 aapt2 又太老」的场景用的：
它不重编 dex/res，而是流式复制 zip 条目，保持 STORED 条目的压缩方式（媒体要 STORED
才能走 Range），最后 zipalign + apksigner。

用法：
  python3 tools/repack_apk.py --base base.apk --name 1.0.0 --code 10000 \
      --ks path/to/ks.jks --ks-pass android --ks-alias k --out out.apk

注意：
  * versionName 是在字符串池里按原长度原位替换的，新名字必须和旧名字等长（UTF-16 字节数）。
  * 会剔除旧的 META-INF 签名文件，重新签；证书不变才能覆盖安装。
"""
import argparse
import os
import shutil
import struct
import subprocess
import sys
import tempfile
import zipfile

ANDROID_NS = 0x0102
STRING_POOL = 0x0001


def _decode_pool(d, pos):
    t, hdr, size = struct.unpack('<HHI', d[pos:pos + 8])
    count, scount, flags, sstart, sstyles = struct.unpack('<IIIII', d[pos + 8:pos + 28])
    offs = struct.unpack('<%dI' % count, d[pos + hdr:pos + hdr + 4 * count])
    utf8 = bool(flags & 0x100)
    items = []
    for o in offs:
        p = pos + sstart + o
        if utf8:
            n1 = d[p]
            p2 = p + 1
            if n1 & 0x80:
                n1 = ((n1 & 0x7f) << 8) | d[p2]
                p2 += 1
            n2 = d[p2]
            p2 += 1
            if n2 & 0x80:
                n2 = ((n2 & 0x7f) << 8) | d[p2]
                p2 += 1
            items.append((p2, n2, d[p2:p2 + n2].decode('utf-8', 'replace'), 'utf8'))
        else:
            n = struct.unpack('<H', d[p:p + 2])[0]
            p2 = p + 2
            if n & 0x8000:
                n = ((n & 0x7fff) << 16) | struct.unpack('<H', d[p2:p2 + 2])[0]
                p2 += 2
            items.append((p2, n * 2, d[p2:p2 + n * 2].decode('utf-16-le', 'replace'), 'utf16'))
    return items


def patch_manifest(data, new_name, new_code):
    d = bytearray(data)
    strings = None
    pos = 8
    while pos < len(d):
        t, hdr, size = struct.unpack('<HHI', d[pos:pos + 8])
        if t == STRING_POOL:
            strings = _decode_pool(d, pos)
            break
        pos += size
    if strings is None:
        sys.exit('AndroidManifest.xml 里没有字符串池')
    idx = {s: i for i, (_, _, s, _) in enumerate(strings)}
    try:
        vn_idx = idx['versionName']
        vc_idx = idx['versionCode']
    except KeyError:
        sys.exit('manifest 里没有 versionName / versionCode')

    pos = 8
    vn_value = None
    code_attr_pos = None
    while pos < len(d):
        t, hdr, size = struct.unpack('<HHI', d[pos:pos + 8])
        if t == ANDROID_NS:
            a_start, a_size, a_count = struct.unpack('<HHH', d[pos + 24:pos + 30])
            base = pos + 16 + a_start
            for i in range(a_count):
                ap = base + i * a_size
                aname = struct.unpack('<I', d[ap + 4:ap + 8])[0]
                raw = struct.unpack('<I', d[ap + 8:ap + 12])[0]
                dtype = d[ap + 15]
                if aname == vc_idx and dtype == 0x10:
                    code_attr_pos = ap
                elif aname == vn_idx and raw != 0xFFFFFFFF:
                    vn_value = raw
            if code_attr_pos is not None and vn_value is not None:
                break
        pos += size

    if code_attr_pos is None:
        sys.exit('没找到 versionCode 属性')
    struct.pack_into('<I', d, code_attr_pos + 16, new_code)
    if vn_value is None:
        sys.exit('没找到 versionName 属性')

    off, ln, old, enc = strings[vn_value]
    bts = new_name.encode('utf-8') if enc == 'utf8' else new_name.encode('utf-16-le')
    if len(bts) != ln:
        sys.exit('versionName 长度不一致：旧 %r（%d 字节）→ 新 %r（%d 字节）' % (old, ln, new_name, len(bts)))
    d[off:off + ln] = bts
    print('versionCode ->', new_code, ' versionName %r -> %r' % (old, new_name))
    return bytes(d)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--base', required=True)
    ap.add_argument('--name', required=True)
    ap.add_argument('--code', type=int, required=True)
    ap.add_argument('--ks', required=True)
    ap.add_argument('--ks-pass', required=True)
    ap.add_argument('--ks-alias', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--home', help='可选：用这个 home.html 替换 assets/www/home.html')
    a = ap.parse_args()

    tmp = tempfile.mkdtemp(prefix='repack-')
    unsigned = os.path.join(tmp, 'unsigned.apk')
    aligned = os.path.join(tmp, 'aligned.apk')
    zin = zipfile.ZipFile(a.base)
    man = patch_manifest(zin.read('AndroidManifest.xml'), a.name, a.code)
    zout = zipfile.ZipFile(unsigned, 'w', zipfile.ZIP_DEFLATED, allowZip64=True)
    for item in zin.infolist():
        n = item.filename
        if n.startswith('META-INF/') and n.split('.')[-1] in ('SF', 'RSA', 'MF', 'DSA', 'EC'):
            continue
        if n == 'AndroidManifest.xml':
            data = man
        elif n == 'assets/www/home.html' and a.home:
            data = open(a.home, 'rb').read()
        else:
            data = zin.read(n)
        zi = zipfile.ZipInfo(n, item.date_time)
        zi.compress_type = item.compress_type
        zi.external_attr = item.external_attr
        zi.create_system = item.create_system
        zout.writestr(zi, data)
    zout.close()
    subprocess.check_call(['zipalign', '-f', '-p', '4', unsigned, aligned])
    subprocess.check_call([
        'apksigner', 'sign', '--ks', a.ks, '--ks-pass', 'pass:' + a.ks_pass,
        '--ks-key-alias', a.ks_alias, '--v1-signing-enabled', 'false',
        '--v2-signing-enabled', 'true', '--v3-signing-enabled', 'true',
        '--out', a.out, aligned,
    ])
    shutil.rmtree(tmp, ignore_errors=True)
    print('已签名:', a.out, os.path.getsize(a.out), 'bytes')


if __name__ == '__main__':
    main()
