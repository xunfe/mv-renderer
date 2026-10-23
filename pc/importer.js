'use strict';
// 导入 zip：解到 <mvRoot>/<id>/，自动剥掉唯一的外层文件夹，拒绝目录穿越
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const AdmZip = require('adm-zip');

async function importZip(zipPath, mvRoot) {
  const raw = path.basename(zipPath, path.extname(zipPath));
  let id = raw.replace(/[^A-Za-z0-9._-]/g, '_');
  if (!id) id = 'mv' + Date.now();
  const dir = path.join(mvRoot, id);
  await fsp.rm(dir, { recursive: true, force: true });
  await fsp.mkdir(dir, { recursive: true });

  const zip = new AdmZip(zipPath);
  for (const ent of zip.getEntries()) {
    if (ent.isDirectory) continue;
    const rel = ent.entryName.replace(/\\/g, '/');
    const dst = path.resolve(dir, rel);
    if (dst !== dir && !dst.startsWith(dir + path.sep)) throw new Error('压缩包里有非法路径');
    await fsp.mkdir(path.dirname(dst), { recursive: true });
    await fsp.writeFile(dst, ent.getData());
  }

  // index.html 藏在唯一一级目录里 → 提上来
  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    const top = await fsp.readdir(dir, { withFileTypes: true });
    if (top.length === 1 && top[0].isDirectory()) {
      const inner = path.join(dir, top[0].name);
      for (const f of await fsp.readdir(inner)) {
        await fsp
          .rename(path.join(inner, f), path.join(dir, f))
          .catch(() => fsp.cp(path.join(inner, f), path.join(dir, f), { recursive: true }));
      }
      await fsp.rm(inner, { recursive: true, force: true });
    }
  }

  if (!fs.existsSync(path.join(dir, 'index.html'))) {
    await fsp.rm(dir, { recursive: true, force: true });
    throw new Error('包里找不到 index.html');
  }
  return id;
}

module.exports = { importZip };
