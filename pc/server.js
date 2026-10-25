'use strict';
/*
 * 极简本地 HTTP 服务器（PC 版，行为与 Android 的 AssetServer.java 一致）
 *   /                 -> web/index.html
 *   /assets /fonts …  -> web/…
 *   /execute/…        -> web/execute/…（song.flac / song.m4a 优先用用户自选音频）
 *   /engine/…         -> web/engine/…
 *   /space/…          -> web/space/…
 *   /custom/<id>/…    -> <userData>/mv/<id>/…
 *   GET  /__imports   -> 已导入 MV 列表
 *   POST /__delete?id=
 *   POST /__rec?name= -> 录制结果落盘到系统「下载」目录
 */
const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const dl = require('./mv-dl.cjs');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
};

function mimeOf(p) {
  return MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
}

function safeId(s) {
  return typeof s === 'string' && /^[A-Za-z0-9._-]+$/.test(s);
}

function rmrf(p) {
  return fsp.rm(p, { recursive: true, force: true });
}

function json(res, obj) {
  const body = Buffer.from(JSON.stringify(obj), 'utf8');
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': body.length,
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}

function text(res, code, body) {
  const b = Buffer.from(String(body), 'utf8');
  res.writeHead(code, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Content-Length': b.length,
    'Cache-Control': 'no-cache',
  });
  res.end(b);
}

/** 带 Range 的静态文件响应（音频拖动进度、大 FLAC 都走这里） */
async function serveFile(req, res, file) {
  let st;
  try {
    st = await fsp.stat(file);
  } catch (e) {
    return text(res, 404, '404 not found: ' + file);
  }
  if (!st.isFile()) return text(res, 404, '404 not found: ' + file);

  const total = st.size;
  let start = 0;
  let end = total - 1;
  const range = req.headers.range;
  let partial = false;

  if (range && range.startsWith('bytes=')) {
    const spec = range.slice(6).split(',')[0].trim();
    const [a, b] = spec.split('-');
    try {
      if (a === '') {
        const n = parseInt(b, 10);
        start = Math.max(0, total - n);
      } else {
        start = parseInt(a, 10);
        if (b !== undefined && b !== '') end = Math.min(parseInt(b, 10), total - 1);
      }
    } catch (e) {
      start = 0;
      end = total - 1;
    }
    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= total) {
      res.writeHead(416, { 'Content-Range': 'bytes */' + total });
      return res.end();
    }
    partial = true;
  }

  // HTML：注入 mv-pre.js（WebGL 保留绘制缓冲）+ mp4-muxer + mv-export.js（HUD / 渲染输出）
  if (/\.html?$/i.test(file)) {
    let html = fs.readFileSync(file, 'utf8');
    if (!html.includes('/mv-pre.js') && html.includes('<head>')) {
      html = html.replace('<head>', '<head><script src="/mv-pre.js"></script>');
    }
    if (!html.includes('/mv-export.js') && html.includes('</body>')) {
      html = html.replace('</body>', '<script src="/mp4-muxer.js"></script><script src="/mv-export.js"></script>\n</body>');
    }
    const buf = Buffer.from(html, 'utf8');
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Content-Length': buf.length,
    });
    if (req.method === 'HEAD') return res.end();
    return res.end(buf);
  }

  const headers = {
    'Content-Type': mimeOf(file),
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'no-cache',
    'Content-Length': end - start + 1,
  };
  if (partial) headers['Content-Range'] = `bytes ${start}-${end}/${total}`;
  res.writeHead(partial ? 206 : 200, headers);
  if (req.method === 'HEAD') return res.end();

  const rs = fs.createReadStream(file, { start, end });
  rs.on('error', () => res.destroy());
  rs.pipe(res);
}

let recFd = null, recPath = null, recName = null;

function startServer({ root, userData, downloads }) {
  const webRoot = path.resolve(root);
  const mvRoot = path.join(userData, 'mv');
  const audioRoot = path.join(userData, 'audio');
  fs.mkdirSync(mvRoot, { recursive: true });
  fs.mkdirSync(audioRoot, { recursive: true });
  const downloadRoot = downloads || path.join(userData, 'downloads');
  fs.mkdirSync(downloadRoot, { recursive: true });

  function userAudio(id) {
    let names;
    try {
      names = fs.readdirSync(audioRoot);
    } catch (e) {
      return null;
    }
    const hit = names.find((n) => n.startsWith(id + '.'));
    return hit ? path.join(audioRoot, hit) : null;
  }

  function listImports() {
    let dirs = [];
    try {
      dirs = fs.readdirSync(mvRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
    } catch (e) {
      return [];
    }
    dirs.sort((a, b) => a.name.localeCompare(b.name));
    return dirs
      .filter((d) => fs.existsSync(path.join(mvRoot, d.name, 'index.html')))
      .map((d) => ({ id: d.name, name: d.name.replace(/_/g, ' ') }));
  }

  async function saveRecording(req, res, query) {
    let name = 'pdoom-render-' + new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const q = (query.get('name') || '').replace(/[^A-Za-z0-9._-]/g, '_');
    if (q) name = q;
    let dst = path.join(downloadRoot, name);
    // 同名文件不覆盖，追加 -2 -3 …
    const ext = path.extname(name);
    const stem = path.basename(name, ext);
    for (let i = 2; fs.existsSync(dst); i++) dst = path.join(downloadRoot, `${stem}-${i}${ext}`);

    const tmp = dst + '.part';
    await new Promise((resolve, reject) => {
      const ws = fs.createWriteStream(tmp);
      req.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
      req.on('error', reject);
    });
    await fsp.rename(tmp, dst);
    text(res, 200, '已保存到 ' + dst);
  }

  // 变更推送（SSE）：用户导入/删除 MV 后首页立刻刷新，不靠 2 秒轮询兜底
  const sseClients = new Set();
  let sseTimer = null;
  try {
    const watcher = fs.watch(mvRoot, { recursive: true }, () => {
      clearTimeout(sseTimer);
      sseTimer = setTimeout(() => {
        for (const c of sseClients) {
          try { c.write('data: change\n\n'); } catch (e) {}
        }
      }, 120);
    });
    watcher.on('error', () => {});
  } catch (e) {}

  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url, 'http://127.0.0.1');
      let p = decodeURIComponent(u.pathname);
      if (await dl.handle(req, res, u, { mvRoot })) return;

      if (p === '/__events') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('retry: 2000\n\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
      }

      if (req.method === 'POST' && p === '/__rec') return saveRecording(req, res, u.searchParams);

      // 渲染输出的分块写盘（安卓端同名接口的 PC 版）
      if (p === '/__keepawake') return json(res, { keep: true });
      if (req.method === 'POST' && p === '/__recBegin') {
        const name = (u.searchParams.get('name') || 'mv-render.mp4').replace(/[^A-Za-z0-9._-]/g, '_');
        try { if (recFd !== null) fs.closeSync(recFd); } catch (e) {}
        recPath = path.join(userData, 'stream-' + name);
        recName = name;
        recFd = fs.openSync(recPath, 'w+');
        return json(res, { ok: true, name });
      }
      if (req.method === 'POST' && p === '/__recWrite') {
        if (recFd === null) return text(res, 409, 'no session');
        const pos = parseInt(u.searchParams.get('pos') || '0', 10) || 0;
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const buf = Buffer.concat(chunks);
        fs.writeSync(recFd, buf, 0, buf.length, pos);
        return json(res, { ok: true });
      }
      if (req.method === 'POST' && p === '/__recEnd') {
        if (recFd === null) return text(res, 409, 'no session');
        const size = fs.fstatSync(recFd).size;
        try { fs.closeSync(recFd); } catch (e) {}
        recFd = null;
        let saved = '';
        try {
          const dl = downloads || path.join(require('os').homedir(), 'Downloads');
          fs.mkdirSync(dl, { recursive: true });
          const target = path.join(dl, recName || 'mv-render.mp4');
          fs.copyFileSync(recPath, target);
          fs.unlinkSync(recPath);
          saved = target;
        } catch (e) { saved = ''; }
        return json(res, { ok: true, bytes: size, path: saved });
      }
      if (p === '/__imports') return json(res, listImports());
      if (req.method === 'POST' && p === '/__delete') {
        const id = u.searchParams.get('id');
        let ok = false;
        if (safeId(id)) {
          await rmrf(path.join(mvRoot, id));
          ok = true;
        }
        return json(res, { ok });
      }

      if (p === '/') p = '/index.html';

      // 用户导入的 MV
      if (p.startsWith('/custom/')) {
        const rest = p.slice('/custom/'.length).split('/');
        const id = rest.shift();
        if (!safeId(id)) return text(res, 403, '403 forbidden');
        let rel = rest.join('/') || 'index.html';
        if (rel.endsWith('/')) rel += 'index.html';
        const base = path.resolve(mvRoot, id);
        const file = path.resolve(base, rel);
        if (file !== base && !file.startsWith(base + path.sep)) return text(res, 403, '403 forbidden');
        return serveFile(req, res, file);
      }

      // world.execute (me) 离线版：用户自备音频优先
      if (p.startsWith('/execute/')) {
        const rel = p.slice('/execute/'.length);
        if (rel === 'song.flac' || rel === 'song.m4a') {
          const ua = userAudio('world-execute');
          if (ua) return serveFile(req, res, ua);
        }
        return serveFile(req, res, path.join(webRoot, 'execute', rel));
      }

      if (p.startsWith('/engine/')) return serveFile(req, res, path.join(webRoot, 'engine', p.slice(8)));
      if (p.startsWith('/space/')) return serveFile(req, res, path.join(webRoot, 'space', p.slice(7)));

      const file = path.resolve(webRoot, '.' + p);
      if (file !== webRoot && !file.startsWith(webRoot + path.sep)) return text(res, 403, '403 forbidden');
      return serveFile(req, res, file);
    } catch (e) {
      try {
        text(res, 500, '500 ' + e.message);
      } catch (_) {}
    }
  });

  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({
        port: server.address().port,
        close: () => new Promise((r) => server.close(r)),
        mvRoot,
        audioRoot,
        downloadRoot,
      });
    });
  });
}

module.exports = { startServer, safeId, rmrf };
