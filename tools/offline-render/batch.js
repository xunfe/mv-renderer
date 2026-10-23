// 批量离线渲染：node tools/batch.js <起帧> <止帧> <输出目录> [fps]
// 一个进程连续渲染一段，避免每帧重启 node；直接出 JPEG。
'use strict';
const fs = require('fs');
const path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');

const MV = path.resolve(__dirname, '..');
for (const f of [
  '/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc',
  '/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
  '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
]) {
  if (fs.existsSync(f)) {
    try { GlobalFonts.registerFromPath(f, path.basename(f).includes('Serif') ? 'Noto Serif CJK SC' : 'Noto Sans CJK SC'); } catch (e) { }
  }
}
for (const f of ['/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf']) {
  if (fs.existsSync(f)) { try { GlobalFonts.registerFromPath(f, 'DejaVu Serif'); } catch (e) { } }
}

const start = parseInt(process.argv[2] || '0', 10);
const end = parseInt(process.argv[3] || '1', 10);
const outDir = process.argv[4] || '/tmp/frames';
const FPS = parseFloat(process.argv[5] || '30');
fs.mkdirSync(outDir, { recursive: true });

const mainCanvas = createCanvas(1920, 1080);
const els = {};
const stubEl = (id) => ({
  id, style: {}, textContent: '', value: '0',
  classList: { toggle() { }, add() { }, remove() { }, contains() { return false; } },
  addEventListener() { }, closest() { return null; },
});
const document = {
  getElementById(id) {
    if (id === 'c') return mainCanvas;
    if (!els[id]) els[id] = stubEl(id);
    return els[id];
  },
  createElement(tag) { return tag === 'canvas' ? createCanvas(1, 1) : stubEl(tag); },
  body: stubEl('body'), title: '', addEventListener() { },
};
const window = { devicePixelRatio: 1, innerWidth: 1920, innerHeight: 1080 };
const fn = new Function('document', 'window', 'addEventListener', 'requestAnimationFrame', 'performance',
  'fetch', 'location', 'setTimeout', 'Audio', 'Image', 'console',
  ['engine.js', 'scenes.js', 'mv.js'].map(f => fs.readFileSync(path.join(MV, f), 'utf8')).join('\n;\n')
  + '\n; return { drawSafe, DUR, SCENES };');
const api = fn(document, window, () => { }, () => 0, { now: () => Date.now() },
  () => Promise.reject(new Error('no net')), { search: '', href: '', pathname: '/index.html', replace() { } },
  () => 0, function () { }, function () { }, console);

const { loadImage } = require('@napi-rs/canvas');
globalThis.__MEMES = {};
const t0 = Date.now();
(async () => {
try { globalThis.__LOGO = await loadImage(fs.readFileSync(path.join(MV, 'memes', 'logo.png'))); globalThis.__LOGO_R = await loadImage(fs.readFileSync(path.join(MV, 'memes', 'logo_r.png'))); } catch (e) { }
for (const k of ['a', 'b', 'c']) {
  try { globalThis.__MEMES[k] = await loadImage(fs.readFileSync(path.join(MV, 'memes', k + '.png'))); } catch (e) { }
}
for (let i = start; i < end; i++) {
  const t = i / FPS;
  api.drawSafe(t);
  const buf = mainCanvas.toBuffer('image/jpeg', 93);
  fs.writeFileSync(path.join(outDir, String(i).padStart(5, '0') + '.jpg'), buf);
  if ((i - start) % 100 === 0) {
    const el = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`[${start}-${end}] ${i}/${end} t=${t.toFixed(2)} ${el}s`);
  }
}
console.log(`[${start}-${end}] done ${((Date.now() - t0) / 1000).toFixed(1)}s`);
})();
