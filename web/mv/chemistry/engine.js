/* 元素之歌 · 引擎层（1920×1080 逻辑画布，实时 Canvas 2D 渲染）
 * 视觉：深墨蓝档案纸 + 真实照片双色调 + 周期表/时间尺/元素计数 HUD。
 * 画质档位只改变内部像素与帧率，逻辑坐标永远 1920×1080。
 */
'use strict';
const W = 1920, H = 1080;
const FONT_CN = '"Noto Sans SC","Noto Sans CJK SC","Source Han Sans SC","Microsoft YaHei",sans-serif';
const FONT_CN_SERIF = '"Noto Serif SC","Noto Serif CJK SC","Source Han Serif SC","SimSun",serif';
const FONT_EN = '"Helvetica Neue","Segoe UI","Inter",sans-serif';
const FONT_EN_SERIF = '"Times New Roman",Georgia,"Noto Serif",serif';
const FONT_MONO = '"JetBrains Mono","Consolas","SFMono-Regular",monospace';

let RS = 1; // 1 = 1080p, 2 = 4K, 2/3 = 720p

const C = {
  ink: '#050a12', ink2: '#08101c', navy: '#0b1a2b', navy2: '#10263c',
  paper: '#e9e2cf', paper2: '#cfc6ae', dim: '#8b97a4', dim2: '#5c6a78',
  cyan: '#7fd4e6', cyan2: '#b7ecf4', amber: '#e2a45e', amber2: '#f5cf92',
  red: '#d2604c', green: '#7fbf9a', violet: '#a99ad8', blue: '#6f9fd8',
  line: 'rgba(150,200,220,0.20)',
};

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
const easeOut = p => 1 - Math.pow(1 - clamp(p), 3);
const easeIn = p => Math.pow(clamp(p), 3);
const inv = (a, b, v) => clamp((v - a) / (b - a));
const isCJK = ch => { const o = ch.codePointAt(0); return (o >= 0x3400 && o <= 0x9fff) || (o >= 0xf900 && o <= 0xfaff) || (o >= 0x3000 && o <= 0x303f); };
const pad2 = n => String(n).padStart(2, '0');

function mulberry(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
let _seed = 20261023;
function rnd() { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; }
function reseed(s) { _seed = s; }

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// ---------------------------------------------------------------- 纹理

// ---------------------------------------------------------------- 图层缓存
// 4K 下每帧重画全屏渐变/纹理/网点太贵：这里把「每帧都一样的整屏图层」烘一次，
// 之后每帧只 drawImage 一次。RS 变了（切画质）由 clearLayerCaches() 清空。
const FX_RES = { cheap: false };
const _layers = new Map();
function clearLayerCaches() { _layers.clear(); FX.halfLayer = null; }
// scale=2 表示这层按一半物理像素烘（渐变/纹理看不出差别，显存省 4 倍）
function layerCanvas(key, build, scale) {
  const sc = scale || 1;
  const k = key + '|' + RS + '|' + sc;
  let cv = _layers.get(k);
  if (cv) return cv;
  cv = mk(Math.max(1, Math.round(W * RS / sc)), Math.max(1, Math.round(H * RS / sc)));
  const lg = cv.getContext('2d');
  lg.setTransform(RS / sc, 0, 0, RS / sc, 0, 0);
  try { build(lg); } catch (e) { console.log('layer build err', key, e && e.message); }
  if (_layers.size > 16) _layers.delete(_layers.keys().next().value);
  _layers.set(k, cv);
  return cv;
}
function drawLayer(g, key, build, scale) {
  g.drawImage(layerCanvas(key, build, scale), 0, 0, W, H);
}

// 12px 半调网点整屏烘一层：
// 原来每块图版都用 createPattern(12×12) + overlay 现铺，实测 1080P 下每块要 40ms+（Skia 慢路径），
// 4K 更糟。改成整屏图层 + 一次 drawImage，视觉不变。
function halftoneLayer() {
  if (!FX.halfLayer) {
    const cv = mk(Math.round(W * RS), Math.round(H * RS));
    const hg = cv.getContext('2d');
    hg.setTransform(RS, 0, 0, RS, 0, 0);
    hg.fillStyle = 'rgba(255,255,255,0.9)';
    for (let y = 3; y < H + 12; y += 12) {
      for (let x = 3; x < W + 12; x += 12) {
        hg.beginPath(); hg.arc(x, y, 1.15, 0, 6.2832); hg.fill();
      }
    }
    FX.halfLayer = cv;
  }
  return FX.halfLayer;
}

const TEX = {};
function valueNoise(w, h, cell, seed) {
  const r = mulberry(seed);
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
  const gr = new Float32Array(gw * gh);
  for (let i = 0; i < gr.length; i++) gr[i] = r();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cell, y0 = Math.floor(fy), ty = smooth(fy - y0);
    for (let x = 0; x < w; x++) {
      const fx = x / cell, x0 = Math.floor(fx), tx = smooth(fx - x0);
      const a = gr[y0 * gw + x0], b = gr[y0 * gw + x0 + 1];
      const c = gr[(y0 + 1) * gw + x0], d = gr[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
    }
  }
  return out;
}
function fbm(w, h, base, oct, seed) {
  const out = new Float32Array(w * h);
  let amp = 1, tot = 0, cell = base;
  for (let o = 0; o < oct; o++) {
    const n = valueNoise(w, h, cell, seed + o * 977);
    for (let i = 0; i < out.length; i++) out[i] += n[i] * amp;
    tot += amp; amp *= 0.5; cell = Math.max(2, cell * 0.5);
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function noiseCanvas(w, h, base, oct, seed, c0, c1, contrast = 1) {
  const n = fbm(w, h, base, oct, seed);
  const cv = mk(w, h), g = cv.getContext('2d');
  const im = g.createImageData(w, h);
  for (let i = 0; i < n.length; i++) {
    const v = clamp((n[i] - 0.5) * contrast + 0.5);
    im.data[i * 4] = lerp(c0[0], c1[0], v);
    im.data[i * 4 + 1] = lerp(c0[1], c1[1], v);
    im.data[i * 4 + 2] = lerp(c0[2], c1[2], v);
    im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv;
}

function buildTextures() {
  TEX.paper = noiseCanvas(640, 400, 70, 5, 17, [198, 190, 172], [250, 246, 236], 1.0);
  TEX.blue = noiseCanvas(700, 440, 100, 5, 29, [8, 16, 26], [26, 44, 62], 0.9);
  TEX.grain = [0, 1, 2, 3].map(k => {
    const w = 256, h = 256, cv = mk(w, h), g = cv.getContext('2d');
    const im = g.createImageData(w, h), r = mulberry(700 + k);
    for (let i = 0; i < w * h; i++) {
      const v = 128 + (r() - 0.5) * 90;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  });
  TEX.halftone = (() => {
    const s = 12, cv = mk(s, s), g = cv.getContext('2d');
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath(); g.arc(3, 3, 1.15, 0, 6.2832); g.fill();
    return cv;
  })();
  TEX.scratch = (() => {
    const cv = mk(600, 340), g = cv.getContext('2d'), r = mulberry(331);
    for (let i = 0; i < 26; i++) {
      g.strokeStyle = `rgba(240,235,220,${0.03 + r() * 0.09})`;
      g.lineWidth = 0.6 + r();
      g.beginPath();
      let x = r() * 600, y = r() * 340;
      g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { x += (r() - 0.5) * 70; y += (r() - 0.5) * 60; g.lineTo(x, y); }
      g.stroke();
    }
    return cv;
  })();
  TEX.dust = (() => {
    const s = 64, cv = mk(s, s), g = cv.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,246,225,1)');
    gr.addColorStop(0.25, 'rgba(255,228,176,0.55)');
    gr.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return cv;
  })();
}

// ---------------------------------------------------------------- 素材
const ASSET_KEYS = ['lavoisier','dalton','mendeleev','curie','kekule','alchemist','bronze','gunpowder','phosphorus',
  'tiangong','mendeleev_table','fraunhofer','eclipse','copper','sulfur','gallium','germanium','battery',
  'insulin_crystals','insulin_4ins','artemisia','bencao','cyanotype','flames','bunsen','prism','pitchblende',
  'oppau','nacl','fire','candle'];
const RAW = {};       // key -> Image / canvas
const TONED = {};     // key -> duotone canvas
const ASSET_STATE = { loaded: 0, failed: [] };

function duotone(src, dark, light, w, h) {
  const cv = mk(w, h), g = cv.getContext('2d');
  g.drawImage(src, 0, 0, w, h);
  let im;
  try { im = g.getImageData(0, 0, w, h); } catch (e) { return cv; }
  const d = im.data;
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) / 255;
    const k = Math.pow(l, 0.92);
    d[i] = lerp(dark[0], light[0], k);
    d[i + 1] = lerp(dark[1], light[1], k);
    d[i + 2] = lerp(dark[2], light[2], k);
  }
  g.putImageData(im, 0, 0);
  return cv;
}

function loadAssets(onDone) {
  let left = ASSET_KEYS.length;
  const done = () => {
    left--;
    if (left <= 0 && onDone) onDone(ASSET_STATE.failed.length);
  };
  for (const key of ASSET_KEYS) {
    const im = new Image();
    im.onload = () => {
      const src = im._img || im;
      RAW[key] = src;
      const maxW = 1100;
      const k = Math.min(1, maxW / src.width);
      const w = Math.max(1, Math.round(src.width * k)), h = Math.max(1, Math.round(src.height * k));
      TONED[key] = key === 'cyanotype'
        ? duotone(src, [8, 22, 42], [120, 178, 205], w, h)
        : duotone(src, [8, 16, 26], [236, 229, 210], w, h);
      ASSET_STATE.loaded++;
      done();
    };
    im.onerror = () => {
      if (!im._triedPng) {
        im._triedPng = true;
        im.src = 'assets/' + key + '.png';
        return;
      }
      ASSET_STATE.failed.push(key); done();
    };
    im.src = 'assets/' + key + '.jpg';
  }
}

function hasAsset(k) { return !!TONED[k]; }

// 把图按 cover 方式画进矩形
function coverRect(g, src, x, y, w, h, z = 1, ox = 0.5, oy = 0.5) {
  const sw = src.width, sh = src.height;
  const s = Math.max(w / sw, h / sh) * z;
  const dw = sw * s, dh = sh * s;
  g.drawImage(src, x + (w - dw) * ox, y + (h - dh) * oy, dw, dh);
}

// ---------------------------------------------------------------- 光与线
function glowLine(g, pts, o = {}) {
  const { w = 3, color = C.cyan, glow = 18, alpha = 1, close = false, dash = null, core = true } = o;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const path = () => {
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    if (close) g.closePath();
  };
  if (glow) {
    g.strokeStyle = color; g.lineWidth = w * 1.1;
    g.globalAlpha = alpha * 0.5; g.shadowColor = color; g.shadowBlur = glow;
    if (dash) g.setLineDash(dash);
    path(); g.stroke();
  }
  g.setLineDash(dash || []);
  g.globalAlpha = alpha; g.shadowBlur = glow * 0.3;
  g.strokeStyle = color; g.lineWidth = w;
  path(); g.stroke();
  if (core) {
    g.shadowBlur = 0; g.strokeStyle = 'rgba(255,252,244,0.92)'; g.lineWidth = Math.max(0.8, w * 0.32);
    path(); g.stroke();
  }
  g.restore();
}
function glowDot(g, x, y, r, o = {}) {
  const { color = '180,235,245', a = 1, core = true } = o;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 4.5);
  gr.addColorStop(0, 'rgba(255,255,250,1)');
  gr.addColorStop(0.14, `rgba(${color},0.85)`);
  gr.addColorStop(0.45, `rgba(${color},0.2)`);
  gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 4.5, 0, 6.2832); g.fill();
  if (core) { g.fillStyle = '#fffefa'; g.beginPath(); g.arc(x, y, Math.max(0.7, r * 0.7), 0, 6.2832); g.fill(); }
  g.restore();
}
function softGlow(g, x, y, r, rgb = '120,190,220', a = 0.45) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.45, `rgba(${rgb},${a * 0.3})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- 文字
const _textCache = new Map();
function textSprite(str, o) {
  const size = o.size, weight = o.weight || 600, color = o.color || C.paper;
  const ls = o.ls || 0, font = o.font || FONT_CN_SERIF, glow = o.glow === undefined ? 0 : o.glow;
  const key = [str, size, weight, color, ls, font, glow, o.italic ? 1 : 0, RS, o.align || 'left'].join('|');
  const hit0 = _textCache.get(key);
  if (hit0) return hit0;
  const pad = Math.ceil((glow * 2.2 + size * 0.3) * RS);
  const fontStr = `${o.italic ? 'italic ' : ''}${weight} ${size * RS}px ${font}`;
  const m0 = mk(10, 10).getContext('2d');
  m0.font = fontStr;
  if ('letterSpacing' in m0) m0.letterSpacing = ls * RS + 'px';
  const tw = m0.measureText(str).width;
  const cv = mk(tw + pad * 2, size * 1.5 * RS + pad * 2);
  const g = cv.getContext('2d');
  g.font = fontStr;
  if ('letterSpacing' in g) g.letterSpacing = ls * RS + 'px';
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const y = cv.height / 2;
  const draw = a => { g.globalAlpha = a; g.fillText(str, pad, y); };
  if (glow) {
    g.fillStyle = o.glowColor || color; g.shadowColor = o.glowColor || color; g.shadowBlur = glow * RS;
    draw(0.85); draw(0.85);
  }
  g.shadowBlur = 0; g.fillStyle = color; draw(1);
  const hit = { cv, w: tw / RS, h: size, pad: pad / RS };
  _textCache.set(key, hit);
  return hit;
}
function text(g, str, x, y, o = {}) {
  if (str === undefined || str === null || str === '') return 0;
  if (window.__PF && window.__PF.text === 0) return 0;
  const sp = textSprite(str, o);
  const ax = o.align === 'center' ? x - sp.w / 2 : o.align === 'right' ? x - sp.w : x;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  if (o.blend) g.globalCompositeOperation = o.blend;
  g.drawImage(sp.cv, ax - sp.pad, y - sp.cv.height / 2 / RS, sp.cv.width / RS, sp.cv.height / RS);
  g.restore();
  return sp.w;
}
function caps(g, str, x, y, o = {}) {
  if (window.__PF && window.__PF.text === 0) return 0;
  const size = o.size || 13, ls = o.ls === undefined ? 2.6 : o.ls;
  const color = o.color || 'rgba(190,215,228,0.62)';
  g.save();
  g.fillStyle = color; g.textBaseline = 'middle';
  g.textAlign = o.align === 'right' ? 'right' : 'left';
  let cx = x, total = 0;
  const chars = [...str];
  for (const ch of chars) { total += (isCJK(ch) ? size * 0.98 : size * 0.62) + (isCJK(ch) ? ls * 0.45 : ls); }
  if (o.align === 'right') cx = x - total;
  for (const ch of chars) {
    const cjk = isCJK(ch);
    g.font = cjk ? `500 ${size}px ${FONT_CN}` : `600 ${size}px ${o.font || FONT_EN}`;
    g.fillText(ch, cx, y);
    cx += (cjk ? size * 0.98 : g.measureText(ch).width) + (cjk ? ls * 0.45 : ls);
  }
  g.restore();
  return total;
}
function mono(g, str, x, y, o = {}) {
  if (window.__PF && window.__PF.text === 0) return;
  g.save();
  g.fillStyle = o.color || 'rgba(190,215,228,0.7)';
  const cjk = /[\u3400-\u9fff]/.test(str);
  g.font = `${o.weight || 500} ${o.size || 12}px ${cjk ? FONT_CN : FONT_MONO}`;
  g.textBaseline = 'middle'; g.textAlign = o.align || 'left';
  g.fillText(str, x, y);
  g.restore();
}
function measureMixed(str, size) {
  const c = mk(10, 10).getContext('2d');
  let w = 0;
  for (const ch of str) {
    const cjk = isCJK(ch);
    c.font = `600 ${cjk ? size : size * 0.66}px ${cjk ? FONT_CN_SERIF : FONT_EN_SERIF}`;
    w += c.measureText(ch).width;
  }
  return w;
}

// ---------------------------------------------------------------- 背景
function bgInk(g, t, o = {}) {
  const { warm = 0, cx = 0.5, cy = 0.36, ghost = '' } = o;
  // 底色 + 径向渐变 + 纸纹 + 幽灵字：整屏都不随时间变，烘一层
  drawLayer(g, 'ink|' + warm + '|' + cx + '|' + cy, lg => {
    lg.fillStyle = C.ink; lg.fillRect(0, 0, W, H);
    const gr = lg.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, Math.max(W, H) * 0.82);
    gr.addColorStop(0, `rgba(${20 + warm * 14 | 0},${38 + warm * 10 | 0},${56 + warm * 4 | 0},0.9)`);
    gr.addColorStop(0.52, 'rgba(10,22,36,0.55)');
    gr.addColorStop(1, 'rgba(3,6,10,0)');
    lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
    lg.globalAlpha = 0.16; lg.globalCompositeOperation = 'overlay';
    const sw = TEX.blue.width, sh = TEX.blue.height;
    for (let y = 0; y < H + sh; y += sh) for (let x = 0; x < W + sw; x += sw) lg.drawImage(TEX.blue, x, y, sw, sh);
    lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1;
  }, 2);
  if (ghost) text(g, ghost, W * 0.5, H * 0.5, { size: 420, weight: 700, font: FONT_EN_SERIF, color: 'rgba(120,180,200,0.045)', align: 'center' });
  // 网格是动的，留在外面每帧画（只有几十条细线，便宜）
  g.save();
  g.strokeStyle = 'rgba(120,180,205,0.055)'; g.lineWidth = 1;
  const off = (t * 2.2) % 96;
  const x0 = -96 + off;
  g.beginPath();
  for (let x = x0; x < W + 96; x += 96) { g.moveTo(x, 0); g.lineTo(x, H); }
  for (let y = 0; y < H; y += 72) { g.moveTo(0, y); g.lineTo(W, y); }
  g.stroke();
  // 网格交点
  g.fillStyle = 'rgba(150,205,225,0.10)';
  for (let x = x0; x < W + 96; x += 288) for (let y = 0; y < H; y += 288) g.fillRect(x - 1, y - 1, 2, 2);
  g.restore();
}

function bgPaper(g, t, o = {}) {
  drawLayer(g, 'paper', lg => {
    lg.fillStyle = '#cfc6ae'; lg.fillRect(0, 0, W, H);
    const gr = lg.createRadialGradient(W * 0.5, H * 0.45, 0, W * 0.5, H * 0.45, W * 0.8);
    gr.addColorStop(0, 'rgba(250,246,235,1)');
    gr.addColorStop(0.6, 'rgba(233,226,207,1)');
    gr.addColorStop(1, 'rgba(176,166,142,1)');
    lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
    lg.globalAlpha = 0.22; lg.globalCompositeOperation = 'multiply';
    const sw = TEX.paper.width, sh = TEX.paper.height;
    for (let y = 0; y < H + sh; y += sh) for (let x = 0; x < W + sw; x += sw) lg.drawImage(TEX.paper, x, y, sw, sh);
    lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1;
  }, 2);
}

// ---------------------------------------------------------------- 照片图版
function plate(g, key, x, y, w, h, o = {}) {
  const { z = 1, ox = 0.5, oy = 0.5, alpha = 1, frame = true, label = '', caption = '', tint = 0.5,
    dark = [], light = [], halftone = 0.12, rotate = 0, lighten = 0 } = o;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x + w / 2, y + h / 2); if (rotate) g.rotate(rotate); g.translate(-w / 2, -h / 2);
  g.save();
  g.beginPath(); g.rect(0, 0, w, h); g.clip();
  const PF = window.__PF || {};
  if (hasAsset(key) && PF.photo !== 0) {
    coverRect(g, TONED[key], 0, 0, w, h, z, ox, oy);
    if (dark.length && PF.dark !== 0) {
      g.globalCompositeOperation = 'multiply';
      g.fillStyle = `rgba(${dark[0]},${dark[1]},${dark[2]},${tint * 0.5})`;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    }
    if (light.length) {
      g.globalCompositeOperation = 'screen';
      g.fillStyle = `rgba(${light[0]},${light[1]},${light[2]},${lighten})`;
      g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'source-over';
    }
  } else {
    g.fillStyle = 'rgba(40,60,78,0.9)'; g.fillRect(0, 0, w, h);
    mono(g, 'NO PLATE / ' + key, 12, h / 2, { color: 'rgba(220,230,235,0.6)' });
  }
  // 档案调色：压一层深墨，让纸本扫描与照片统一
  if (PF.tint !== 0) { g.fillStyle = 'rgba(3,7,12,0.17)'; g.fillRect(0, 0, w, h); }
  // 半调网点
  if (halftone > 0 && PF.halftone !== 0) {
    g.globalAlpha = halftone; g.globalCompositeOperation = 'overlay';
    g.drawImage(halftoneLayer(), 0, 0, W, H);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  }
  // 划痕 + 灰
  g.globalAlpha = 0.55; g.globalCompositeOperation = 'screen';
  g.drawImage(TEX.scratch, -20, -10, w + 40, h + 20);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  // 顶部/底部渐暗
  if (PF.grad !== 0) {
  const gb = g.createLinearGradient(0, h * 0.6, 0, h);
  gb.addColorStop(0, 'rgba(4,8,14,0)');
  gb.addColorStop(1, 'rgba(4,8,14,0.62)');
  g.fillStyle = gb; g.fillRect(0, h * 0.6, w, h * 0.4);
  }
  g.restore();
  if (frame) {
    g.strokeStyle = 'rgba(180,220,235,0.28)'; g.lineWidth = 1;
    g.strokeRect(0.5, 0.5, w - 1, h - 1);
    g.strokeStyle = 'rgba(226,164,94,0.55)'; g.lineWidth = 2;
    const L = 18;
    const corners = [[0, 0, 1, 1], [w, 0, -1, 1], [0, h, 1, -1], [w, h, -1, -1]];
    for (const [cx, cy, sx, sy] of corners) {
      g.beginPath(); g.moveTo(cx, cy + sy * L); g.lineTo(cx, cy); g.lineTo(cx + sx * L, cy); g.stroke();
    }
  }
  if (label) caps(g, label, 10, h + 18, { size: 10.5, ls: 2.0, color: 'rgba(200,225,235,0.58)' });
  if (caption) text(g, caption, 0, h + 42, { size: 14, color: 'rgba(228,236,240,0.78)', font: FONT_CN });
  if (o.source !== false && CREDITS[key]) text(g, CREDITS[key], 0, h + 62, { size: 9.5, font: FONT_EN, color: 'rgba(160,185,198,0.45)' });
  g.restore();
}

// 全屏照片背景（暗化 + 边角）
function bgPhoto(g, key, t, o = {}) {
  const { z = 1.02 + t * 0.0016, dim = 0.62, y = 0.42, tint = 0.6 } = o;
  g.save();
  g.fillStyle = C.ink; g.fillRect(0, 0, W, H);
  if (hasAsset(key)) coverRect(g, TONED[key], 0, 0, W, H, z, 0.5, y);
  g.fillStyle = `rgba(4,8,14,${dim})`; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, H * 0.35, 0, H);
  gr.addColorStop(0, 'rgba(4,8,14,0.1)');
  gr.addColorStop(1, 'rgba(4,7,12,0.92)');
  g.fillStyle = gr; g.fillRect(0, H * 0.35, W, H * 0.65);
  g.restore();
}

// ---------------------------------------------------------------- 元件
function elemChip(g, sym, x, y, s = 1, o = {}) {
  const e = BY_SYM[sym];
  if (!e) return;
  const w = 210 * s, h = 250 * s;
  g.save();
  g.fillStyle = o.fill || 'rgba(10,22,36,0.84)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = o.stroke || 'rgba(180,220,235,0.42)'; g.lineWidth = 1.2 * s;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cc = CAT_COLOR[e.cat] || C.dim;
  g.fillStyle = cc; g.fillRect(x, y, 4 * s, h);
  mono(g, String(e.z), x + 14 * s, y + 20 * s, { size: 13 * s, color: cc });
  text(g, e.sym, x + w - 14 * s, y + 56 * s, { size: 92 * s, weight: 400, font: FONT_EN_SERIF, color: C.paper, align: 'right' });
  text(g, e.cn, x + w - 14 * s, y + 146 * s, { size: 44 * s, weight: 600, font: FONT_CN_SERIF, color: C.paper, align: 'right' });
  text(g, e.en, x + 14 * s, y + h - 48 * s, { size: 16 * s, color: 'rgba(225,232,235,0.66)', font: FONT_EN });
  mono(g, e.mass + '', x + 14 * s, y + h - 22 * s, { size: 13 * s, color: 'rgba(190,215,228,0.6)' });
  mono(g, e.year > 0 ? 'A.D. ' + e.year : 'B.C.E.', x + w - 14 * s, y + h - 22 * s, { size: 11 * s, color: 'rgba(190,215,228,0.5)', align: 'right' });
  g.restore();
}

// 周期表。opt: cell, x, y, highlight:Set/array, dim, fillByYear
function periodicTable(g, x, y, cell, o = {}) {
  const gap = o.gap === undefined ? 2 : o.gap;
  const cw = cell, ch = cell * 1.06;
  const hi = new Set(o.highlight || []);
  const now = o.year !== undefined ? o.year : 2026;
  g.save();
  for (const e of ELEM) {
    const p = TABLE_LAYOUT[e.sym];
    if (!p) continue;
    const cx = x + (p.col - 1) * (cw + gap);
    const cy = p.row > 7
      ? y + (7 + (p.row - 8)) * (ch + gap) + 18
      : y + (p.row - 1) * (ch + gap);
    const known = e.year <= now;
    const isHi = hi.has(e.sym);
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    g.fillStyle = isHi ? 'rgba(226,164,94,0.24)' : known ? 'rgba(90,140,165,0.10)' : 'rgba(30,44,58,0.10)';
    g.fillRect(cx, cy, cw, ch);
    g.strokeStyle = isHi ? 'rgba(245,207,146,0.9)' : known ? 'rgba(150,200,220,0.26)' : 'rgba(120,150,170,0.14)';
    g.lineWidth = isHi ? 1.6 : 0.8;
    g.strokeRect(cx + 0.5, cy + 0.5, cw - 1, ch - 1);
    if (cw >= 26) {
      text(g, e.sym, cx + cw / 2, cy + ch * 0.44, {
        size: cw * 0.42, font: FONT_EN_SERIF, weight: 400,
        color: isHi ? C.amber2 : known ? 'rgba(225,236,240,0.9)' : 'rgba(150,180,195,0.28)', align: 'center',
      });
      if (cw >= 40) mono(g, String(e.z), cx + 4, cy + ch - 8, { size: cw * 0.14, color: 'rgba(190,215,228,0.4)' });
    } else if (isHi) {
      g.fillStyle = C.amber2; g.fillRect(cx + cw * 0.4, cy + ch * 0.4, cw * 0.2, ch * 0.2);
    }
  }
  if (o.labels) {
    for (let c = 1; c <= 18; c++) mono(g, String(c), x + (c - 1) * (cw + gap) + cw / 2, y - 14, { size: 9, align: 'center', color: 'rgba(160,195,210,0.4)' });
    for (let r = 1; r <= 7; r++) mono(g, String(r), x - 14, y + (r - 1) * (ch + gap) + ch / 2, { size: 9, align: 'center', color: 'rgba(160,195,210,0.4)' });
  }
  g.restore();
}

// ---------------------------------------------------------------- HUD
const HUD_YEAR_NODES = [
  [-400000, '40万年前'], [-5000, '前5000'], [-3000, '前3000'], [850, '850'], [1669, '1669'],
  [1807, '1807'], [1859, '1859'], [1869, '1869'], [1898, '1898'], [1913, '1913'],
  [1953, '1953'], [1972, '1972'], [1991, '1991'], [2010, '2010'], [2026, '2026'],
];

function hudFrame(g, t, sc) {
  const m = 30;
  g.save();
  g.strokeStyle = 'rgba(150,200,220,0.14)'; g.lineWidth = 1;
  g.strokeRect(m, m, W - m * 2, H - m * 2);
  const L = 30;
  g.strokeStyle = 'rgba(226,164,94,0.5)'; g.lineWidth = 1.6;
  for (const [x, y, sx, sy] of [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]]) {
    g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke();
  }
  // 顶部横线
  g.strokeStyle = 'rgba(150,200,220,0.18)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(m + 24, 112); g.lineTo(W - m - 24, 112); g.stroke();
  g.restore();

  // 左上标题
  caps(g, 'A BRIEF HISTORY OF CHEMISTRY', 66, 62, { size: 13, ls: 2.4, color: 'rgba(210,228,235,0.72)' });
  text(g, '化学简史', 66, 88, { size: 22, weight: 600, font: FONT_CN_SERIF, color: 'rgba(235,240,240,0.9)' });
  caps(g, '· ' + (sc.fig || '000') + ' · ' + (sc.tag || ''), 190, 88, { size: 11.5, ls: 2.0, color: 'rgba(226,164,94,0.82)' });

  // 左下年份说明（原片第二行）
  const ytxt = sc.year < 0 ? `公元前 ${Math.abs(sc.year).toLocaleString('en-US')} 年` : `公元 ${sc.year} 年`;
  caps(g, ytxt, 66, 136, { size: 14, ls: 1.2, color: 'rgba(226,164,94,0.9)' });
  text(g, hudSceneCN(sc), 220, 136, { size: 14, weight: 500, font: FONT_CN, color: 'rgba(220,232,238,0.72)' });

  // 右侧元素计数
  const known = knownByYear(sc.year);
  text(g, String(known), W - 260, 66, { size: 52, weight: 300, font: FONT_EN_SERIF, color: C.amber2, align: 'right' });
  caps(g, '人类已知元素', W - 64, 58, { size: 11, ls: 1.6, color: 'rgba(220,232,238,0.66)', align: 'right' });
  mono(g, '/ 118', W - 64, 82, { size: 14, color: 'rgba(190,215,228,0.55)', align: 'right' });
  // 118 格小矩阵
  const gx = W - 64 - 12 * 9, gy = 98;
  for (let i = 0; i < 118; i++) {
    const col = i % 12, row = Math.floor(i / 12);
    g.fillStyle = i < known ? 'rgba(226,164,94,0.75)' : 'rgba(120,160,180,0.16)';
    g.fillRect(gx + col * 9, gy + row * 7, 5.4, 4);
  }
  // 顶部进度细线
  const pw = (W - 180) * clamp(t / DUR);
  g.save(); g.globalCompositeOperation = 'lighter';
  const pg = g.createLinearGradient(90, 0, W - 90, 0);
  pg.addColorStop(0, 'rgba(127,212,230,0.1)');
  pg.addColorStop(0.7, 'rgba(127,212,230,0.35)');
  pg.addColorStop(1, 'rgba(226,164,94,0.6)');
  g.fillStyle = pg; g.fillRect(90, 112, pw, 1.4);
  g.restore();

  // 左侧时间尺
  drawTimeRail(g, t, sc);

  // 底部
  g.strokeStyle = 'rgba(150,200,220,0.16)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(66, H - 64); g.lineTo(W - 66, H - 64); g.stroke();
  mono(g, 'FIG. ' + (sc.fig || '000') + ' · ' + (sc.tag || ''), 66, H - 42, { size: 11, color: 'rgba(200,222,232,0.7)' });
  mono(g, `SCALE 1:0.${String(60 + (sc.i * 7) % 39).padStart(2, '0')}   T ${t.toFixed(2).padStart(6, '0')} s   DATA: IUPAC · NIST · PDB`, W - 66, H - 42,
    { size: 10.5, color: 'rgba(200,222,232,0.55)', align: 'right' });
  // 原点准星
  g.save(); g.strokeStyle = 'rgba(226,164,94,0.5)'; g.lineWidth = 1;
  g.beginPath(); g.arc(W - 96, H * 0.5, 7, 0, 6.2832); g.moveTo(W - 112, H * 0.5); g.lineTo(W - 80, H * 0.5); g.stroke();
  g.restore();
}
const SCENE_CN = {
  lattice: '序 · 石墨', intro: '序 · 一张表', fire: '火', bronze: '青铜', alchemy: '丹炉', powder: '火药',
  brand: '磷 · 1669', glow: '冷光', replicate: '可重复', change1: '变化', color: '颜色', mass: '质量守恒',
  change2: '变化', change3: '本生灯', inter1: '间奏 · 光', davy: '电解', wohler: '尿素', prism: '棱镜',
  lines: '谱线', helium: '氦', benzene: '苯环', mendeleev: '空格', filled: '填满', naming: '命名',
  change4: '变化', flame: '焰色', radium: '镭', haber: '合成氨', inter2: '间奏 · 键', inter3: '间奏 · 原子',
  bond: '化学键', orbital: '电子云', dna: 'DNA', insulin: '胰岛素', book: '古书', cold: '低温',
  sample191: '第191号', malaria: '青蒿素', change5: '变化', lithium: '锂', full: '118', beyond: '空格',
  finale0: '终章', finale1: '终章', finale2: '终章', finale3: '终章', finale4: '终章', finale5: '终章', finale6: '终章',
  coda: '尾声 · 蓝晒',
};
function hudSceneCN(sc) { return SCENE_CN[sc.scene] || ''; }

function drawTimeRail(g, t, sc) {
  const x = 44, y0 = 250, y1 = H - 150;
  g.save();
  g.strokeStyle = 'rgba(150,200,220,0.22)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
  // 按场景年份的非等距节点
  const years = [...new Set(SCENES.map(s => s.year))].sort((a, b) => a - b);
  const idx = Math.max(0, years.indexOf(sc.year));
  const markY = lerp(y0 + 30, y1 - 30, idx / (years.length - 1));
  // 刻度
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const yy = lerp(y0, y1, i / N);
    const big = i % 7 === 0;
    g.strokeStyle = big ? 'rgba(190,220,232,0.38)' : 'rgba(150,200,220,0.15)';
    g.beginPath(); g.moveTo(x - (big ? 7 : 4), yy); g.lineTo(x, yy); g.stroke();
  }
  // 三个关键年份（避免挤在一起）
  const marks = [0, Math.floor(years.length / 2), years.length - 1];
  for (const mi of marks) {
    const yy = lerp(y0 + 30, y1 - 30, mi / (years.length - 1));
    const yr = years[mi];
    mono(g, yr < 0 ? `${Math.abs(yr)} BCE` : String(yr), x + 12, yy, { size: 8, color: 'rgba(170,200,214,0.38)' });
  }
  // 当前标记
  glowDot(g, x, markY, 2.2, { a: 0.75, color: '226,164,94' });
  g.strokeStyle = 'rgba(226,164,94,0.8)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(x + 4, markY); g.lineTo(x + 16, markY - 5); g.lineTo(x + 16, markY + 5); g.closePath(); g.stroke();
  g.save(); g.translate(x - 9, y0 - 14); g.rotate(-Math.PI / 2);
  mono(g, 'TIME / 非等距', 0, 0, { size: 9, align: 'center', color: 'rgba(226,164,94,0.55)' });
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- 字幕
function lyric(g, sc, e) {
  if (!sc.cn) return;
  const cn = sc.cn, en = sc.en;
  const size = cn.length >= 15 ? 44 : 52;
  const a = smooth(clamp(e / 0.22));
  const rise = (1 - a) * 12;
  const y = 902;
  g.save();
  // 柔光底衬
  const sh = g.createRadialGradient(W / 2, y + 6, 0, W / 2, y + 6, 720);
  sh.addColorStop(0, 'rgba(3,6,10,0.62)');
  sh.addColorStop(0.62, 'rgba(3,6,10,0.24)');
  sh.addColorStop(1, 'rgba(3,6,10,0)');
  g.save(); g.translate(W / 2, y + 6); g.scale(1, 0.26);
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 720, 0, 6.2832); g.fill();
  g.restore();
  text(g, cn, W / 2, y + rise, {
    size, weight: 600, font: FONT_CN_SERIF, color: '#f4efe2',
    glow: 10, glowColor: 'rgba(127,212,230,0.85)', alpha: a, align: 'center',
  });
  const tw = measureMixed(cn, size);
  const prog = smooth(clamp(e / Math.max(0.5, (sc.t1 - sc.t0) * 0.92)));
  const x0 = W / 2 - tw / 2, yy = y + 46;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(127,212,230,0.2)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + tw, yy); g.stroke();
  const lg = g.createLinearGradient(x0, 0, x0 + tw, 0);
  lg.addColorStop(0, 'rgba(127,212,230,0.8)');
  lg.addColorStop(1, 'rgba(226,164,94,0.9)');
  g.strokeStyle = lg; g.lineWidth = 1.7; g.shadowColor = C.amber; g.shadowBlur = 6;
  g.beginPath(); g.moveTo(x0, yy); g.lineTo(x0 + tw * prog, yy); g.stroke();
  g.restore();
  if (en) text(g, en, W / 2, y + 74, {
    size: 23, weight: 400, font: FONT_EN_SERIF, color: 'rgba(206,226,232,0.93)',
    glow: 6, glowColor: 'rgba(127,212,230,0.5)', ls: 0.3, alpha: smooth(clamp((e - 0.1) / 0.3)), align: 'center', italic: true,
  });
  g.restore();
}

// 非歌词的小注释（间奏、档案说明）
function annotation(g, cn, en, x, y, a = 1) {
  g.save(); g.globalAlpha = a;
  g.fillStyle = 'rgba(8,18,28,0.55)';
  text(g, cn, x, y, { size: 26, weight: 500, font: FONT_CN_SERIF, color: 'rgba(235,240,238,0.88)' });
  if (en) text(g, en, x, y + 32, { size: 15, weight: 400, font: FONT_EN_SERIF, color: 'rgba(170,205,218,0.75)', italic: true });
  g.restore();
}

// ---------------------------------------------------------------- 后期
const FX = {};
function initFX() {
  FX.small = mk(W / 4, H / 4);
  FX.sg = FX.small.getContext('2d');
}
function bloom(g, amount = 0.22) {
  // 旧版在全屏尺寸上做两次 filter blur，4K 下来回拷 33MB×2，最贵的就是这里。
  // 现在：4K 画面 → 小图 → 在小图里模糊（130k 像素）→ 放大叠回一次。
  if (!FX.small) initFX();
  const sg = FX.sg, sw = FX.small.width, sh = FX.small.height;
  if (!FX.blurSmall) { FX.blurSmall = mk(sw, sh); FX.bsg = FX.blurSmall.getContext('2d'); }
  const bg = FX.bsg;
  sg.filter = 'none';
  sg.clearRect(0, 0, sw, sh);
  sg.drawImage(g.canvas, 0, 0, sw, sh);
  bg.clearRect(0, 0, sw, sh);
  bg.filter = 'blur(' + (2.6 * (RS > 1.4 ? 1.6 : 1)).toFixed(1) + 'px)';
  bg.drawImage(FX.small, 0, 0);
  bg.filter = 'none';
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = amount * 1.15;
  g.drawImage(FX.blurSmall, 0, 0, W, H);
  g.restore();
}
const _pat = {};
function grainPat(g, gi) { return _pat['g' + gi] || (_pat['g' + gi] = g.createPattern(TEX.grain[gi], 'repeat')); }
function grain(g, t, amount = 0.07) {
  const gi = Math.floor(t * 30) % 4;
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount;
  g.fillStyle = grainPat(g, gi);
  g.translate(-((t * 97) % 256), -((t * 61) % 256));
  g.fillRect(0, 0, W + 256, H + 256);
  g.restore();
}
function vignette(g, o = {}) {
  const { a = 0.78, cx = 0.5, cy = 0.46 } = o;
  drawLayer(g, 'vig|' + a + '|' + cx + '|' + cy, lg => {
    const gr = lg.createRadialGradient(W * cx, H * cy, Math.min(W, H) * 0.2, W * cx, H * cy, Math.max(W, H) * 0.8);
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.62, `rgba(0,0,0,${a * 0.2})`);
    gr.addColorStop(1, `rgba(0,0,0,${a})`);
    lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
  }, 2);
}
function dust(g, t, o = {}) {
  const { n = 90, alpha = 0.5, seed = 9, size = 2 } = o;
  const r = mulberry(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), ph = r() * 6.28, sp = 0.4 + r();
    const x = ((bx * W + Math.sin(t * 0.2 * sp + ph) * 30 + t * 5 * (bx - 0.5)) % W + W) % W;
    const y = ((by * H - t * 9 * sp + Math.sin(t * 0.15 + ph) * 18) % H + H) % H;
    const a = alpha * (0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.5 * sp + ph), 3));
    const s = size * (4 + r() * 6);
    g.globalAlpha = a;
    g.drawImage(TEX.dust, x - s / 2, y - s / 2, s, s);
  }
  g.restore();
}
function atmosphere(g, t, o = {}) {
  const { warm = 0.4, dim = 0.3 } = o;
  // 静态的 soft-light 分级层：烘一次
  drawLayer(g, 'atm|' + dim, lg => {
    lg.globalCompositeOperation = 'soft-light';
    const gd = lg.createLinearGradient(0, 0, 0, H);
    gd.addColorStop(0, `rgba(180,220,240,${0.10})`);
    gd.addColorStop(0.55, 'rgba(180,132,80,0.03)');
    gd.addColorStop(1, `rgba(6,10,16,${0.3 + dim * 0.2})`);
    lg.fillStyle = gd; lg.fillRect(0, 0, W, H);
    lg.globalCompositeOperation = 'source-over';
  }, 2);
  // 会飘的暖色漏光：小范围渐变，便宜，留着
  g.save();
  g.globalCompositeOperation = 'lighter';
  const lx = W * (0.1 + 0.02 * Math.sin(t * 0.1)), ly = H * (0.28 + 0.08 * Math.sin(t * 0.07 + 1));
  const gr = g.createRadialGradient(lx, ly, 0, lx, ly, W * 0.5);
  gr.addColorStop(0, `rgba(255,186,110,${0.03 * warm})`);
  gr.addColorStop(1, 'rgba(255,186,110,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
}
function scanlines(g, a = 0.05) {
  // 实测：45°以外的路径里，1×6 像素小图案铺满 4K 反而最慢（Skia 走慢路径）。
  // 保持细条 fillRect —— Skia 会把相邻条合批，比 pattern 快两个数量级。
  g.save(); g.globalAlpha = a;
  for (let y = 0; y < H; y += 3) {
    g.fillStyle = y % 6 === 0 ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.06)';
    g.fillRect(0, y, W, 1);
  }
  g.restore();
}

// 通用：居中标题块
function titleBlock(g, cn, en, sub, x, y, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  g.save(); g.globalAlpha = a;
  text(g, cn, x, y, { size: o.size || 86, weight: 600, font: FONT_CN_SERIF, color: o.color || C.paper, align: 'center', glow: 14, glowColor: 'rgba(127,212,230,0.4)' });
  if (en) caps(g, en, x, y + (o.size || 86) * 0.62, { size: 15, ls: 4, color: o.enColor || 'rgba(226,164,94,0.85)', align: 'center' });
  if (sub) text(g, sub, x, y + (o.size || 86) * 0.62 + 40, { size: 17, weight: 400, font: FONT_CN, color: 'rgba(210,228,236,0.66)', align: 'center' });
  g.restore();
}

// 化学式排版（下标用较小字号，逐字符绘制）
function formula(g, str, x, y, o = {}) {
  const size = o.size || 30, color = o.color || C.paper;
  const font = o.font || FONT_EN_SERIF;
  const chars = [...str];
  let cx = x;
  const total = (() => {
    let w = 0, tmp = mk(10, 10).getContext('2d');
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      const sub = /[0-9]/.test(ch) && i > 0 && /[A-Za-z)\]]/.test(chars[i - 1]);
      tmp.font = `${o.weight || 400} ${sub ? size * 0.62 : size}px ${font}`;
      w += tmp.measureText(ch).width;
    }
    return w;
  })();
  if (o.align === 'center') cx = x - total / 2;
  if (o.align === 'right') cx = x - total;
  g.save(); g.fillStyle = color; g.textBaseline = 'middle';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const sub = /[0-9]/.test(ch) && i > 0 && /[A-Za-z)\]]/.test(chars[i - 1]);
    g.font = `${o.weight || 400} ${sub ? size * 0.62 : size}px ${font}`;
    const yy = sub ? y + size * 0.22 : y;
    g.fillText(ch, cx, yy);
    cx += g.measureText(ch).width;
  }
  g.restore();
  return total;
}




