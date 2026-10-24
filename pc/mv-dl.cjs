'use strict';
/* MV 扩展包下载 / 解压（Node 18+，无第三方依赖）
 * 路由：
 *   POST /__dl?pkg=ai&u=<url>&sha=<sha256>&size=<bytes>
 *   GET  /__dl/status?id=ai
 *   POST /__dl/cancel?id=ai
 */
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { pipeline } = require('stream/promises');
const { Transform, Readable } = require('stream');

const states = new Map();

function safePkg(p) { return typeof p === 'string' && /^[a-z0-9][a-z0-9._-]{0,40}$/i.test(p); }
function json(res, obj, code = 200) {
  const b = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Length': b.length, 'Cache-Control': 'no-store' });
  res.end(b);
}

function readU16(b, o) { return b.readUInt16LE(o); }
function readU32(b, o) { return b.readUInt32LE(o); }

async function entriesOf(zipPath) {
  const fh = await fsp.open(zipPath, 'r');
  try {
    const st = await fh.stat();
    const tailLen = Math.min(st.size, 65557);
    const tail = Buffer.alloc(tailLen);
    await fh.read(tail, 0, tailLen, st.size - tailLen);
    let eocd = -1;
    for (let i = tailLen - 22; i >= 0; i--) { if (tail.readUInt32LE(i) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error('不是有效的 zip（找不到 EOCD）');
    const count = readU16(tail, eocd + 10);
    const cdSize = readU32(tail, eocd + 12);
    const cdOff = readU32(tail, eocd + 16);
    const cd = Buffer.alloc(cdSize);
    await fh.read(cd, 0, cdSize, cdOff);
    const out = [];
    let p = 0;
    for (let i = 0; i < count; i++) {
      if (readU32(cd, p) !== 0x02014b50) throw new Error('zip 中央目录损坏');
      const flags = readU16(cd, p + 8);
      const method = readU16(cd, p + 10);
      const csize = readU32(cd, p + 20);
      const usize = readU32(cd, p + 24);
      const nlen = readU16(cd, p + 28);
      const elen = readU16(cd, p + 30);
      const clen = readU16(cd, p + 32);
      const lho = readU32(cd, p + 42);
      const nameBuf = cd.subarray(p + 46, p + 46 + nlen);
      const name = (flags & 0x800) ? nameBuf.toString('utf8') : nameBuf.toString('latin1');
      out.push({ name, method, csize, usize, lho });
      p += 46 + nlen + elen + clen;
    }
    return { fh, entries: out, size: st.size };
  } catch (e) {
    await fh.close();
    throw e;
  }
}

async function unzip(zipPath, dest, onProgress) {
  const { fh, entries } = await entriesOf(zipPath);
  const root = path.resolve(dest);
  await fsp.mkdir(root, { recursive: true });
  let done = 0;
  try {
    for (const e of entries) {
      if (e.name.endsWith('/')) continue;
      const target = path.resolve(root, e.name);
      if (target !== root && !target.startsWith(root + path.sep)) continue;
      await fsp.mkdir(path.dirname(target), { recursive: true });
      // local header: skip name+extra
      const lh = Buffer.alloc(30);
      await fh.read(lh, 0, 30, e.lho);
      if (lh.readUInt32LE(0) !== 0x04034b50) throw new Error('zip 本地头损坏: ' + e.name);
      const nlen = lh.readUInt16LE(26), elen = lh.readUInt16LE(28);
      const start = e.lho + 30 + nlen + elen;
      const end = start + e.csize - 1;
      const rs = fs.createReadStream(zipPath, { start, end });
      const ws = fs.createWriteStream(target);
      if (e.method === 0) await pipeline(rs, ws);
      else if (e.method === 8) await pipeline(rs, zlib.createInflateRaw(), ws);
      else throw new Error('不支持的压缩方式 ' + e.method + ': ' + e.name);
      done++;
      if (onProgress && done % 40 === 0) onProgress(done, entries.length);
    }
  } finally {
    await fh.close();
  }
}

async function sha256File(p) {
  const h = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(p), new Transform({ transform(c, _e, cb) { h.update(c); cb(); } }));
  return h.digest('hex');
}

async function rmrf(p) { await fsp.rm(p, { recursive: true, force: true }); }

function startDownload({ pkg, url, sha256, size, mvRoot }) {
  if (!safePkg(pkg)) throw new Error('非法包名');
  if (!/^https?:\/\//.test(url || '')) throw new Error('非法下载地址');
  if (states.get(pkg) && states.get(pkg).state === 'downloading') return states.get(pkg);
  const st = { state: 'downloading', got: 0, total: Number(size) || 0, error: null, at: Date.now() };
  states.set(pkg, st);
  const tmp = path.join(mvRoot, `.dl-${pkg}.zip`);
  const tmpDir = path.join(mvRoot, `.dl-${pkg}.dir`);
  const ab = new AbortController();
  st.abort = ab;
  (async () => {
    try {
      await fsp.mkdir(mvRoot, { recursive: true });
      const r = await fetch(url, { signal: ab.signal });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const len = Number(r.headers.get('content-length')) || st.total;
      if (len) st.total = len;
      const counter = new Transform({
        transform(chunk, _enc, cb) { st.got += chunk.length; cb(null, chunk); },
      });
      await pipeline(Readable.fromWeb(r.body), counter, fs.createWriteStream(tmp));
      if (st.total && st.got && st.got !== st.total) throw new Error('下载不完整');
      st.state = 'unzipping';
      if (sha256) {
        const got = await sha256File(tmp);
        if (got.toLowerCase() !== String(sha256).toLowerCase()) throw new Error('校验失败（sha256 不一致）');
      }
      await rmrf(tmpDir);
      await unzip(tmp, tmpDir, (a, b) => { st.unzip = [a, b]; });
      await rmrf(path.join(mvRoot, pkg));
      await fsp.rename(tmpDir, path.join(mvRoot, pkg));
      st.state = 'done'; st.got = st.total || st.got;
      await rmrf(tmp);
    } catch (e) {
      st.state = st.abort.signal.aborted ? 'canceled' : 'error';
      st.error = e && e.message ? e.message : String(e);
      try { await rmrf(tmp); } catch (_) {}
      try { await rmrf(tmpDir); } catch (_) {}
    } finally {
      delete st.abort;
    }
  })();
  return st;
}

function status(pkg) {
  const s = states.get(pkg);
  if (!s) return { state: 'idle', got: 0, total: 0, error: null };
  return { state: s.state, got: s.got, total: s.total, error: s.error, unzip: s.unzip || null };
}

function cancel(pkg) {
  const s = states.get(pkg);
  if (s && s.abort) { s.abort.abort(); return true; }
  return false;
}

/** 挂到普通 http server；返回 true 表示已处理 */
async function handle(req, res, url, opts) {
  const p = url.pathname;
  if (!p.startsWith('/__dl')) return false;
  const q = url.searchParams;
  if (p === '/__dl/status') { json(res, status(q.get('id'))); return true; }
  if (p === '/__dl/cancel') { json(res, { ok: cancel(q.get('id')) }); return true; }
  if (p === '/__dl' && req.method === 'POST') {
    try {
      const pkg = q.get('pkg');
      const st = startDownload({ pkg, url: q.get('u'), sha256: q.get('sha'), size: q.get('size'), mvRoot: opts.mvRoot });
      json(res, { ok: true, state: st.state });
    } catch (e) { json(res, { ok: false, error: e.message }, 400); }
    return true;
  }
  json(res, { ok: false, error: 'not found' }, 404);
  return true;
}

module.exports = { handle, startDownload, status, cancel, unzip, safePkg };
