const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const dl = require('../lib/mv-dl.cjs');
const WEB = path.resolve(__dirname, '../web');
const MVROOT = process.env.MVROOT || '/root/.dsh/mv-hub/pkgs';
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.flac': 'audio/flac', '.mp4': 'video/mp4', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2' };
const mime = (p) => MIME[path.extname(p).toLowerCase()] || 'application/octet-stream';
function serve(req, res, file) {
  fs.stat(file, (e, st) => {
    if (e || !st.isFile()) { res.writeHead(404); res.end('404'); return; }
    const total = st.size; let start = 0, end = total - 1, code = 200;
    const range = req.headers.range;
    if (range && range.startsWith('bytes=')) {
      const [a, b] = range.slice(6).split(',').shift().split('-');
      if (a === '') { start = Math.max(0, total - parseInt(b, 10)); } else { start = parseInt(a, 10); if (b) end = Math.min(parseInt(b, 10), total - 1); }
      code = 206;
    }
    res.writeHead(code, { 'Content-Type': mime(file), 'Content-Length': end - start + 1, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache', ...(code === 206 ? { 'Content-Range': `bytes ${start}-${end}/${total}` } : {}) });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file, { start, end }).pipe(res);
  });
}
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://127.0.0.1');
  let p = decodeURIComponent(u.pathname);
  try {
    if (await dl.handle(req, res, u, { mvRoot: MVROOT })) return;
    if (p.startsWith('/custom/')) {
      const rel = p.slice(8).split('/');
      const id = rel.shift();
      if (!/^[a-z0-9._-]+$/i.test(id)) { res.writeHead(403); return res.end(); }
      let f = path.resolve(MVROOT, id, rel.join('/') || 'index.html');
      if (!f.startsWith(path.resolve(MVROOT, id))) { res.writeHead(403); return res.end(); }
      return serve(req, res, f);
    }
    if (p === '/') p = '/home.html';
    const f = path.resolve(WEB, '.' + p);
    if (!f.startsWith(WEB)) { res.writeHead(403); return res.end(); }
    serve(req, res, f);
  } catch (e) { res.writeHead(500); res.end(String(e)); }
});
const PORT = Number(process.env.PORT || 8160);
server.listen(PORT, '127.0.0.1', () => console.log('http://127.0.0.1:' + PORT + '/home.html'));
