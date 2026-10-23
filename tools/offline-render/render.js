// 离线预览：用 @napi-rs/canvas 直接跑 mv 的绘制代码出 PNG（不依赖浏览器）
// 用法：node tools/render.js 40.5 out.png
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

const mainCanvas = createCanvas(1652, 1080);
const errs = [];
const stubEl = (id) => {
  const el = { id, style: {}, textContent: '', value: '0', classList: { toggle() { }, add() { }, remove() { }, contains() { return false; } }, addEventListener() { }, closest() { return null; } };
  return el;
};
const els = {};
const document = {
  getElementById(id) {
    if (id === 'c') return mainCanvas;
    if (!els[id]) els[id] = stubEl(id);
    return els[id];
  },
  createElement(tag) { return tag === 'canvas' ? createCanvas(1, 1) : stubEl(tag); },
  body: stubEl('body'),
  title: '',
  addEventListener() { },
};
const window = { devicePixelRatio: 1 };
const addEventListener = () => { };
const requestAnimationFrame = () => 0;
const performance = { now: () => Date.now() };
const fetch = () => Promise.reject(new Error('no net'));
const location = { search: '', href: '', pathname: '/index.html', replace() { } };
const setTimeout_ = (fn, t) => 0;
const Audio = function () { };

const src = ['engine.js', 'scenes.js', 'mv.js'].map(f => fs.readFileSync(path.join(MV, f), 'utf8')).join('\n;\n');
const fn = new Function('document', 'window', 'addEventListener', 'requestAnimationFrame', 'performance',
  'fetch', 'location', 'setTimeout', 'Audio', 'Image', 'console',
  src + '\n; return { drawSafe, DUR, SCENES, applyQuality };');
const { loadImage } = require('@napi-rs/canvas');
globalThis.__MEMES = {};
(async () => {
try { globalThis.__LOGO = await loadImage(fs.readFileSync(path.resolve(__dirname, '..', 'memes', 'logo.png'))); globalThis.__LOGO_R = await loadImage(fs.readFileSync(path.resolve(__dirname, '..', 'memes', 'logo_r.png'))); } catch (e) { }
for (const k of ['a', 'b', 'c']) {
  try { globalThis.__MEMES[k] = await loadImage(fs.readFileSync(path.resolve(__dirname, '..', 'memes', k + '.png'))); } catch (e) { }
}
const api = fn(document, window, addEventListener, requestAnimationFrame, performance, fetch, location, setTimeout_, Audio,
  function () { }, console);

const t = parseFloat(process.argv[2] || '20');
const out = process.argv[3] || '/tmp/frame.png';
const sk = (process.argv.find(a => a.startsWith('--skip=')) || '').slice(7);
globalThis.__SKIP = {}; if (sk.includes('dbg')) globalThis.__DBG = 1; for (const k of ['bloom','grain','vig','atm','dbg']) if (sk.includes(k)) globalThis.__SKIP[k] = 1;
const qa = process.argv.find(a => a.startsWith('--q='));
if (qa) api.applyQuality(qa.slice(4), false);
api.drawSafe(t);
fs.writeFileSync(out, mainCanvas.toBuffer('image/png'));
const err = els.err && els.err.textContent;
if (err) { console.error('PAGE ERR:', err); process.exitCode = 2; }
console.log('wrote', out, 't=' + t, 'scenes=' + api.SCENES.length, 'dur=' + api.DUR, 'size=' + mainCanvas.width + 'x' + mainCanvas.height);
})();
