// 离线对帧：node tools/render.mjs <mv相对路径> <输出目录> <秒,秒,...> [ss]
// 用 @napi-rs/canvas（Skia）跑页面里同一份 main.js，浏览器 API 打桩。
import fs from 'node:fs';
import path from 'node:path';
import { createCanvas, GlobalFonts, Image as NImage } from '@napi-rs/canvas';
import { pathToFileURL } from 'node:url';

const WEB = '/sdcard/我的文件/Dsh/work107/web';
const MV = process.argv[2];
const OUT = process.argv[3] || '/sdcard/我的文件/Dsh/work107/preview';
const TIMES = (process.argv[4] || '0').split(',').map(Number);
const SS = Number(process.argv[5] || 1);
fs.mkdirSync(OUT, { recursive: true });

// ---- 字体
const fontDir = path.join(WEB, 'mv/world/fonts');
for (const [f, fam] of [['NotoSerifSC-VF.ttf', 'Noto Serif SC'], ['NotoSansSC-VF.ttf', 'Noto Sans SC']]) {
  const p = path.join(fontDir, f);
  if (fs.existsSync(p)) { try { GlobalFonts.registerFromPath(p, fam); } catch (e) { console.error('font', f, e.message); } }
}
for (const [f, fam] of [['NotoSansCJK-Regular.ttc', 'Noto Sans CJK SC'], ['NotoSerifCJK-Regular.ttc', 'Noto Serif CJK SC']]) {
  const p = '/usr/share/fonts/opentype/noto/' + f;
  if (fs.existsSync(p)) { try { GlobalFonts.registerFromPath(p, fam); } catch (e) { } }
}

// ---- DOM 打桩
const canvas = createCanvas(1920, 1080);
const stub = (id) => ({ id, style: {}, textContent: '', value: '0', className: '',
  classList: { add() { }, remove() { }, toggle() { }, contains() { return false; } },
  addEventListener() { }, appendChild() { }, remove() { }, setAttribute() { }, getAttribute() { return null; },
  querySelector() { return null; }, querySelectorAll() { return []; }, closest() { return null; }, focus() { } });
const els = {};
const document = {
  getElementById(id) { if (id === 'c') return canvas; if (!els[id]) els[id] = stub(id); return els[id]; },
  createElement(t) { if (t === 'canvas') return createCanvas(4, 4); return stub(t); },
  querySelector(s) { return stub(s); },
  body: stub('body'), documentElement: stub('html'), title: '',
  fonts: { add() { }, ready: Promise.resolve() },
  addEventListener() { },
  head: stub('head'), createTextNode() { return {}; },
};
const loc = new URL('http://x/' + (MV || '') + '/index.html?render&ss=' + SS);
globalThis.document = document;
globalThis.window = globalThis;
globalThis.location = loc;
globalThis.navigator = { userAgent: 'node', language: 'zh-CN' };
globalThis.devicePixelRatio = 1;
globalThis.addEventListener = () => { };
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => { };
globalThis.FontFace = class FontFace { constructor(fam) { this.family = fam; } load() { return Promise.resolve(this); } };
globalThis.Audio = class Audio { constructor(src) { this.src = src; this.paused = true; this.currentTime = 0; } addEventListener() { } play() { return Promise.resolve(); } pause() { } };
class IMG extends NImage {
  set src(v) {
    let p = v;
    if (v.startsWith('/')) p = path.join(WEB, v);
    else if (!v.startsWith('file:') && !path.isAbsolute(v)) p = path.join(WEB, 'mv', MV, v);
    super.src = p;
  }
  get src() { return super.src; }
}
globalThis.Image = IMG;
globalThis.fetch = async (u) => {
  let p = String(u);
  if (p.startsWith('http')) p = new URL(p).pathname;
  const file = p.startsWith('/') ? path.join(WEB, p) : path.join(WEB, 'mv', MV, p);
  const buf = fs.readFileSync(file);
  return { ok: true, status: 200, url: p, json: async () => JSON.parse(buf.toString('utf8')), text: async () => buf.toString('utf8'), arrayBuffer: async () => buf };
};
globalThis.__mvRenderScale = SS;

// ---- 加载影片模块
const mainFile = path.join(WEB, 'mv', MV, 'src/main.js');
const t0 = performance.now();
await import(pathToFileURL(mainFile).href);
if (globalThis.__ready) await globalThis.__ready;
console.log('loaded in', ((performance.now() - t0) / 1000).toFixed(2), 's');

// ---- 逐帧输出
for (const t of TIMES) {
  globalThis.seek(t);
  const file = path.join(OUT, `${MV.replace(/\//g, '_')}-${t.toFixed(2)}.png`);
  fs.writeFileSync(file, canvas.toBuffer('image/png'));
  console.log(file);
}
