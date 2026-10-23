/* 航天简史 · 引擎层
 * 1920×1080 逻辑画布；画质档位只改内部像素与帧率。
 * 视觉：深蓝图纸 + 细网格 + 工程标注 + 真实素材窗口 + 胶片质感。
 */
'use strict';
const W = 1920, H = 1080;
const FONT_CN = '"Microsoft YaHei","Noto Sans SC","Source Han Sans SC","PingFang SC",sans-serif';
const FONT_EN = '"Helvetica Neue","Arial","Segoe UI",sans-serif';
const FONT_MONO = '"Consolas","Cascadia Mono","SFMono-Regular",monospace';
const FONT_SERIF = '"Times New Roman",Georgia,serif';

let RS = 1;

// 当前帧出现过的视频（mv.js 每帧清空，plate() 登记）
if (typeof window !== 'undefined') window.__ACTIVE_VIDS = new Set();

const C = {
  bg: '#0b1826', bg2: '#0e2234', ink: '#050b12', deep: '#071019',
  paper: '#dfe9ef', white: '#f2f8fb',
  line: 'rgba(176,212,232,0.13)', line2: 'rgba(176,212,232,0.07)',
  edge: 'rgba(206,234,246,0.34)', edge2: 'rgba(206,234,246,0.14)',
  dim: 'rgba(198,220,232,0.62)', dim2: 'rgba(186,212,226,0.36)',
  faint: 'rgba(186,212,226,0.18)',
  amber: '#ff7a33', amber2: '#ffb37a', red: '#e2503a',
  cyan: '#a7dcec', gold: '#e7c27c', steel: '#9fb4c4',
};

const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
const easeOut = p => 1 - Math.pow(1 - clamp(p), 3);
const easeIn = p => Math.pow(clamp(p), 3);
const inv = (a, b, v) => clamp((v - a) / (b - a));
const isCJK = ch => {
  const o = ch.codePointAt(0);
  return (o >= 0x3400 && o <= 0x9fff) || (o >= 0xf900 && o <= 0xfaff) ||
         (o >= 0x3000 && o <= 0x303f) || (o >= 0xff00 && o <= 0xff65) || ch === '—' || ch === '…' || ch === '·';
};
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

/* ---------------------------------------------------------------- 纹理 */

// ---------------------------------------------------------------- 图层缓存
// 每帧都一样的整屏内容（底图/纸纹/HUD 网格）烘一层，之后每帧只 blit 一次。
const _layers = new Map();
function clearLayerCaches() { _layers.clear(); }
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
function drawLayer(g, key, build, scale) { g.drawImage(layerCanvas(key, build, scale), 0, 0, W, H); }

const TEX = {};
function valueNoise(w, h, cell, seed) {
  const r = mulberry(seed);
  const gw = Math.ceil(w / cell) + 2, gh = Math.ceil(h / cell) + 2;
  const g = new Float32Array(gw * gh);
  for (let i = 0; i < g.length; i++) g[i] = r();
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / cell, y0 = Math.floor(fy), ty = smooth(fy - y0);
    for (let x = 0; x < w; x++) {
      const fx = x / cell, x0 = Math.floor(fx), tx = smooth(fx - x0);
      const a = g[y0 * gw + x0], b = g[y0 * gw + x0 + 1];
      const c = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
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
  TEX.paper = noiseCanvas(560, 380, 90, 5, 11, [26, 46, 64], [86, 116, 138], 0.8);
  TEX.grain = [0, 1, 2, 3].map(k => {
    const w = 256, h = 256, cv = mk(w, h), g = cv.getContext('2d');
    const im = g.createImageData(w, h), r = mulberry(700 + k);
    for (let i = 0; i < w * h; i++) {
      const v = 128 + (r() - 0.5) * 190;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  });
  TEX.scan = (() => {
    const cv = mk(1, 3), g = cv.getContext('2d');
    g.fillStyle = 'rgba(0,0,0,1)'; g.fillRect(0, 0, 1, 1);
    return cv;
  })();
  TEX.glow = (() => {
    const s = 64, cv = mk(s, s), g = cv.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,250,240,1)');
    gr.addColorStop(0.3, 'rgba(255,210,160,0.42)');
    gr.addColorStop(1, 'rgba(255,190,130,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return cv;
  })();
}

/* ---------------------------------------------------------------- 文字 */
const _textCache = new Map();
function textSprite(str, o) {
  const size = o.size, weight = o.weight || 700, color = o.color || C.white;
  const ls = o.ls || 0, font = o.font || FONT_CN, glow = o.glow === undefined ? 0 : o.glow;
  const key = [str, size, weight, color, ls, font, glow, o.italic || 0, o.alpha || 1, RS].join('|');
  let hit = _textCache.get(key);
  if (hit) return hit;
  const pad = Math.ceil((glow * 2.4 + size * 0.25) * RS) + 4;
  const fontStr = `${o.italic ? 'italic ' : ''}${weight} ${size * RS}px ${font}`;
  const m0 = mk(10, 10).getContext('2d');
  m0.font = fontStr; m0.letterSpacing = ls * RS + 'px';
  const tw = m0.measureText(str).width;
  const cv = mk(tw + pad * 2, size * 1.5 * RS + pad * 2);
  const g = cv.getContext('2d');
  g.font = fontStr; g.letterSpacing = ls * RS + 'px';
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const y = cv.height / 2;
  if (glow) {
    g.fillStyle = o.glowColor || color; g.shadowColor = o.glowColor || color; g.shadowBlur = glow * RS;
    g.fillText(str, pad, y); g.fillText(str, pad, y);
  }
  g.shadowBlur = 0; g.fillStyle = color; g.fillText(str, pad, y);
  hit = { cv, w: tw / RS, h: size, pad: pad / RS };
  _textCache.set(key, hit);
  return hit;
}

function txt(g, str, x, y, o = {}) {
  if (str === undefined || str === null || str === '') return 0;
  const sp = textSprite(String(str), o);
  const align = o.align || 'left';
  const ax = align === 'center' ? x - sp.w / 2 : align === 'right' ? x - sp.w : x;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha *= o.alpha;
  if (o.blend) g.globalCompositeOperation = o.blend;
  g.drawImage(sp.cv, ax - sp.pad, y - sp.cv.height / 2 / RS, sp.cv.width / RS, sp.cv.height / RS);
  g.restore();
  return sp.w;
}

// 小字：等宽、拉开字距
function mono(g, str, x, y, o = {}) {
  return txt(g, str, x, y, Object.assign({ font: FONT_MONO, weight: 500, size: o.size || 15, ls: o.ls === undefined ? 2.2 : o.ls, color: o.color || C.dim }, o));
}
function caps(g, str, x, y, o = {}) {
  return txt(g, str.toUpperCase(), x, y, Object.assign({ font: FONT_EN, weight: 600, size: o.size || 14, ls: o.ls === undefined ? 3.2 : o.ls, color: o.color || C.dim }, o));
}

/* ---------------------------------------------------------------- 素材 */
const ASSET_STATE = { total: 0, loaded: 0, failed: [], imgs: {}, vids: {} };
function loadAssets(done) {
  const keys = Object.keys(ASSETS);
  ASSET_STATE.total = keys.length;
  let left = keys.length;
  const tick = () => { if (--left <= 0 && done) done(ASSET_STATE.failed); };
  for (const k of keys) {
    const a = ASSETS[k];
    if (a.kind === 'vid') {
      const v = document.createElement('video');
      v.src = a.src; v.muted = true; v.loop = false; v.playsInline = true;
      v.preload = 'auto'; v.crossOrigin = 'anonymous';
      v.addEventListener('loadeddata', () => { ASSET_STATE.loaded++; tick(); });
      v.addEventListener('error', () => { ASSET_STATE.failed.push(k); tick(); });
      ASSET_STATE.vids[k] = v;
    } else {
      const im = new Image();
      im.onload = () => { ASSET_STATE.loaded++; tick(); };
      im.onerror = () => { ASSET_STATE.failed.push(k); tick(); };
      im.src = a.src;
      ASSET_STATE.imgs[k] = im;
    }
  }
  if (!keys.length && done) done([]);
}

function mediaOf(key) {
  return ASSET_STATE.vids[key] || ASSET_STATE.imgs[key] || null;
}
function srcSize(m) {
  if (!m) return [1, 1];
  return m.videoWidth ? [m.videoWidth, m.videoHeight] : [m.naturalWidth || m.width || 1, m.naturalHeight || m.height || 1];
}
function drawCover(g, m, x, y, w, h, o = {}) {
  if (!m) return;
  const [iw, ih] = srcSize(m);
  const zoom = o.zoom || 1, panX = o.panX || 0, panY = o.panY || 0;
  const s = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * s, dh = ih * s;
  const dx = x + (w - dw) / 2 + panX * (dw - w) / 2;
  const dy = y + (h - dh) / 2 + panY * (dh - h) / 2;
  g.drawImage(m, dx, dy, dw, dh);
}

// 照片/视频窗口：裁切 + 调色 + 框
function plate(g, key, x, y, w, h, o = {}) {
  if (!window.__NO_VIDEO__ && ASSET_STATE.vids[key] && window.__ACTIVE_VIDS) window.__ACTIVE_VIDS.add(key);
  const m = window.__NO_VIDEO__ ? (ASSET_STATE.imgs[key + '_poster'] || ASSET_STATE.imgs[o.poster || key]) : mediaOf(key);
  if (!m) {
    g.save(); g.fillStyle = 'rgba(9,20,30,.75)'; g.fillRect(x, y, w, h);
    g.strokeStyle = C.edge2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    mono(g, 'FOOTAGE LOST', x + 16, y + h / 2, { size: 13, color: C.dim2 });
    g.restore(); return;
  }
  g.save();
  const ga = g.globalAlpha;            // 外层淡入淡出要能被继承
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  const bw = o.bw === undefined ? 1 : o.bw;
  const sat = o.sat === undefined ? (bw ? 0 : 1.02) : o.sat;
  const con = o.con === undefined ? 1.08 : o.con;
  g.filter = `grayscale(${bw}) contrast(${con}) brightness(${o.bright === undefined ? 0.98 : o.bright}) saturate(${sat})`;
  drawCover(g, m, x, y, w, h, o);
  g.filter = 'none';
  // 冷调
  if (o.tone !== false) {
    g.globalCompositeOperation = 'color';
    g.fillStyle = o.toneColor || (bw ? '#2d566e' : '#1e4a60');
    g.globalAlpha = ga * (bw ? 0.34 : 0.13);
    g.fillRect(x, y, w, h);
    g.globalAlpha = ga;
  }
  // 压暗 + 暖高光
  g.globalCompositeOperation = 'multiply';
  const gr = g.createLinearGradient(x, y, x, y + h);
  gr.addColorStop(0, 'rgba(236,226,214,1)');
  gr.addColorStop(0.55, 'rgba(206,206,206,1)');
  gr.addColorStop(1, 'rgba(150,158,170,1)');
  g.fillStyle = gr; g.globalAlpha = ga * (o.wash === undefined ? 0.5 : o.wash); g.fillRect(x, y, w, h);
  g.globalAlpha = ga; g.globalCompositeOperation = 'source-over';
  // 暗角
  if (o.vig !== false) {
    const vg = g.createRadialGradient(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, x + w / 2, y + h / 2, Math.max(w, h) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(2,8,14,${o.vig === undefined ? 0.5 : o.vig})`);
    g.fillStyle = vg; g.fillRect(x, y, w, h);
  }
  g.restore();
  if (o.frame !== false) {
    g.save(); g.globalAlpha = ga;
    g.strokeStyle = o.frameColor || 'rgba(228,244,251,0.62)'; g.lineWidth = o.frameW || 2;
    g.strokeRect(x + 1, y + 1, w - 2, h - 2); g.restore();
  }
}

/* ---------------------------------------------------------------- 底 */
function bgBase(g, t, o = {}) {
  const warm = o.warm === undefined ? 0.5 : o.warm;
  const cx = o.cx ?? 0.42, cy = o.cy ?? 0.4;
  drawLayer(g, 'base|' + warm + '|' + cx + '|' + cy, lg => {
    lg.fillStyle = '#08131f';
    lg.fillRect(0, 0, W, H);
    let gr = lg.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, Math.max(W, H) * 0.92);
    gr.addColorStop(0, `rgba(${34 + 20 * warm | 0},${62 + 16 * warm | 0},${84 + 8 * warm | 0},1)`);
    gr.addColorStop(0.45, `rgba(${20 + 10 * warm | 0},${40 + 8 * warm | 0},${58},1)`);
    gr.addColorStop(1, 'rgba(5,11,18,1)');
    lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
    // 左上光晕
    const lx = W * 0.14, ly = H * 0.18;
    gr = lg.createRadialGradient(lx, ly, 0, lx, ly, W * 0.55);
    gr.addColorStop(0, `rgba(150,190,215,${0.10 * warm + 0.04})`);
    gr.addColorStop(1, 'rgba(150,190,215,0)');
    lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
    // 纸纹（原来是每帧拿两张 700×440 贴图铺满 + overlay，撑不住 4K；烘成静的）
    lg.save();
    lg.globalCompositeOperation = 'overlay'; lg.globalAlpha = 0.10;
    const sw = TEX.paper.width * 1.6, sh = TEX.paper.height * 1.6;
    for (let y = -sh; y < H + sh; y += sh) for (let x = -sw; x < W + sw; x += sw) lg.drawImage(TEX.paper, x, y, sw, sh);
    lg.restore();
    // 底部压深
    gr = lg.createLinearGradient(0, H * 0.62, 0, H);
    gr.addColorStop(0, 'rgba(4,10,17,0)'); gr.addColorStop(1, 'rgba(3,8,14,0.82)');
    lg.fillStyle = gr; lg.fillRect(0, H * 0.6, W, H * 0.4);
  }, 2);
}

function bgSpace(g, t, o = {}) {
  g.fillStyle = '#03070d'; g.fillRect(0, 0, W, H);
  const cx = W * (o.cx ?? 0.5), cy = H * (o.cy ?? 0.5);
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
  gr.addColorStop(0, `rgba(30,58,86,${o.glow === undefined ? 0.4 : o.glow})`);
  gr.addColorStop(0.55, 'rgba(10,20,32,0.35)');
  gr.addColorStop(1, 'rgba(2,5,9,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  stars(g, t, o);
}

function stars(g, t, o = {}) {
  const n = o.n || 260, seed = o.seed || 21;
  const r = mulberry(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * H, ph = r() * 6.28, sp = 0.5 + r() * 1.6, sz = r();
    const a = (o.alpha || 0.8) * (0.2 + 0.7 * (0.5 + 0.5 * Math.sin(t * sp + ph)));
    g.globalAlpha = a;
    g.fillStyle = 'rgba(226,238,250,0.95)';
    g.beginPath(); g.arc(x, y, 0.5 + sz * 1.5, 0, 6.2832); g.fill();
    if (sz > 0.95) {
      g.globalAlpha = a * 0.5;
      g.drawImage(TEX.glow, x - 9, y - 9, 18, 18);
    }
  }
  g.restore();
}

/* ---------------------------------------------------------------- HUD */
function grid(g, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  g.save();
  g.globalAlpha = a;
  g.strokeStyle = o.color || C.line; g.lineWidth = 1;
  for (let i = 1; i < 12; i++) {
    const x = Math.round(W * i / 12) + .5;
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke();
  }
  for (let i = 1; i < 10; i++) {
    const y = Math.round(H * i / 10) + .5;
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  // 中线加亮
  g.strokeStyle = o.mid || C.line2;
  g.beginPath(); g.moveTo(W / 2 + .5, 0); g.lineTo(W / 2 + .5, H); g.stroke();
  g.beginPath(); g.moveTo(0, H / 2 + .5); g.lineTo(W, H / 2 + .5); g.stroke();
  // 外框
  g.globalAlpha = a; g.strokeStyle = C.edge2; g.lineWidth = 1.5;
  g.strokeRect(26.5, 26.5, W - 53, H - 53);
  g.restore();
}

function rulers(g, o = {}) {
  const a = o.alpha === undefined ? 1 : o.alpha;
  g.save(); g.globalAlpha = a;
  g.fillStyle = o.color || 'rgba(196,222,236,0.42)';
  g.font = `500 ${11}px ${FONT_MONO}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let i = 1; i <= 12; i++) {
    const x = W * (i - 0.5) / 12;
    g.fillText(String(i), x, 14);
    g.fillText(String(i), x, H - 14);
    g.strokeStyle = o.color || 'rgba(196,222,236,0.30)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, 24); g.lineTo(x, 30); g.stroke();
    g.beginPath(); g.moveTo(x, H - 30); g.lineTo(x, H - 24); g.stroke();
  }
  const rows = 'ABCDEFGHIJ';
  g.textAlign = 'left';
  for (let i = 0; i < 10; i++) {
    const y = H * (i + 0.5) / 10;
    g.fillText(rows[i], 10, y);
    g.textAlign = 'right'; g.fillText(rows[i], W - 10, y); g.textAlign = 'left';
    g.strokeStyle = o.color || 'rgba(196,222,236,0.30)';
    g.beginPath(); g.moveTo(24, y); g.lineTo(30, y); g.stroke();
    g.beginPath(); g.moveTo(W - 30, y); g.lineTo(W - 24, y); g.stroke();
  }
  g.restore();
}

// 每帧都一样的 HUD 骨架（网格/标尺/外框）烘一层
function hudStatic(g) {
  drawLayer(g, 'hud', lg => {
    grid(lg, { alpha: 0.85 });
    rulers(lg, { alpha: 0.8 });
  });
}

function timecode(g, t, label) {
  const s = t % 3600;
  const tc = `T+${pad2(Math.floor(s / 60))}:${pad2(Math.floor(s % 60))}.${Math.floor((s % 1) * 10)}`;
  g.save();
  mono(g, label || 'MISSION ELAPSED', 52, 54, { size: 11, ls: 3.4, color: 'rgba(190,220,234,0.42)' });
  mono(g, tc, 52, 78, { size: 25, ls: 1.2, color: 'rgba(232,246,252,0.86)' });
  g.restore();
}

function sheetBlock(g, o = {}) {
  const lines = o.lines || [];
  const x = W - 52, y = H - 132;
  g.save();
  g.textAlign = 'right';
  g.strokeStyle = 'rgba(190,220,234,0.30)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x - 300, y - 12); g.lineTo(x, y - 12); g.stroke();
  lines.forEach((ln, i) => {
    mono(g, ln, x, y + i * 19, { size: 12, ls: 2.0, color: i === 0 ? 'rgba(226,242,249,0.72)' : 'rgba(190,214,228,0.40)', align: 'right' });
  });
  g.restore();
}

function progress(g, t, dur) {
  const y = H - 40;
  g.save();
  g.strokeStyle = 'rgba(190,220,234,0.22)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(52, y); g.lineTo(W - 52, y); g.stroke();
  const p = clamp(t / dur);
  g.strokeStyle = 'rgba(255,122,51,0.85)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(52, y); g.lineTo(52 + (W - 104) * p, y); g.stroke();
  for (let i = 0; i <= 20; i++) {
    const x = 52 + (W - 104) * i / 20;
    g.strokeStyle = 'rgba(190,220,234,0.28)';
    g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x, y + 9); g.stroke();
  }
  g.fillStyle = 'rgba(255,140,80,0.9)';
  g.beginPath(); g.arc(52 + (W - 104) * p, y, 3.4, 0, 6.2832); g.fill();
  g.restore();
}

function watermark(g) {
  g.save();
  caps(g, '小黑鱼 · 代码复刻', W - 52, 56, { size: 12, ls: 2.6, color: 'rgba(200,224,236,0.38)', align: 'right' });
  caps(g, 'A SHORT HISTORY OF AEROSPACE', W - 52, 76, { size: 10, ls: 3.0, color: 'rgba(200,224,236,0.24)', align: 'right' });
  g.restore();
}

function yearTag(g, year, zh, en, o = {}) {
  const x = o.x || 64, y = o.y || 108;
  g.save();
  txt(g, String(year), x - 6, y + 64, { size: o.size || 106, weight: 900, font: FONT_EN, color: o.color || 'rgba(240,249,253,0.96)', ls: -5, glow: 14, glowColor: 'rgba(120,190,220,0.35)' });
  if (en) mono(g, en.toUpperCase(), x, y + 152, { size: 16, ls: 2.6, color: 'rgba(228,242,250,0.82)' });
  if (zh) {
    g.fillStyle = 'rgba(8,18,28,0.55)';
    g.fillRect(x - 2, y + 166, Math.max(200, zh.length * 17 + 20), 26);
    txt(g, zh, x + 8, y + 179, { size: 17, weight: 500, color: 'rgba(226,240,248,0.9)' });
  }
  g.restore();
}

/* ---------------------------------------------------------------- 字幕 */
function lyric(g, line, e, o = {}) {
  if (!line) return;
  const t0 = 0, ai = 0.14;
  const ap = clamp(e / ai);
  const zh = line.zh, en = line.en || '';
  const y = o.y || 902, size = o.size || 44;
  g.save();
  g.globalAlpha = ap;
  g.font = `800 ${size}px ${FONT_CN}`;
  const total = g.measureText(zh).width;
  const x0 = W / 2 - total / 2;
  const accent = line.accent || '';
  const ai0 = accent ? zh.indexOf(accent) : -1;
  let accX0 = 0, accW = 0;
  if (ai0 >= 0) {
    g.font = `800 ${size}px ${FONT_CN}`;
    accX0 = g.measureText(zh.slice(0, ai0)).width;
    accW = g.measureText(accent).width;
  }
  // 底衬
  const sh = g.createRadialGradient(W / 2, y + 6, 0, W / 2, y + 6, 700);
  sh.addColorStop(0, 'rgba(4,9,15,0.55)'); sh.addColorStop(1, 'rgba(4,9,15,0)');
  g.save(); g.translate(W / 2, y + 6); g.scale(1, 0.22);
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 700, 0, 6.2832); g.fill(); g.restore();
  // 中文
  g.fillStyle = 'rgba(246,251,254,0.98)';
  g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 14;
  g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText(zh, x0, y);
  g.shadowBlur = 0;
  if (ai0 >= 0) {
    g.fillStyle = C.amber;
    g.fillText(zh.slice(ai0, ai0 + accent.length), x0 + accX0, y);
  }
  // 橙色下划线
  if (ai0 >= 0) {
    g.strokeStyle = 'rgba(255,122,51,0.92)'; g.lineWidth = 3;
    const uy = y + size * 0.62;
    g.beginPath(); g.moveTo(x0 + accX0 - 2, uy); g.lineTo(x0 + accX0 + accW + 2, uy); g.stroke();
  }
  // 英文
  if (en) {
    g.globalAlpha = ap * clamp((e - 0.05) / 0.2);
    const es = o.ensize || 19;
    g.font = `500 ${es}px ${FONT_MONO}`; g.letterSpacing = '2.4px';
    const ew = g.measureText(en).width;
    const ex = W / 2 - ew / 2, ey = y + 62;
    g.fillStyle = 'rgba(206,224,236,0.82)';
    g.fillText(en, ex, ey);
    if (line.enAccent) {
      const idx = en.toUpperCase().indexOf(line.enAccent.toUpperCase());
      if (idx >= 0) {
        const pre = g.measureText(en.slice(0, idx)).width;
        g.fillStyle = C.amber;
        g.fillText(en.slice(idx, idx + line.enAccent.length), ex + pre, ey);
      }
    }
    g.letterSpacing = '0px';
  }
  g.restore();
}

/* ---------------------------------------------------------------- 基础图形 */
function globe(g, cx, cy, r, o = {}) {
  const lon0 = o.lon0 || 0;
  g.save();
  // 球体
  const gr = g.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
  gr.addColorStop(0, o.light || 'rgba(70,110,132,0.55)');
  gr.addColorStop(0.75, 'rgba(20,44,62,0.55)');
  gr.addColorStop(1, 'rgba(8,18,28,0.72)');
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fillStyle = gr; g.fill();
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.clip();
  // 海陆
  drawGlobeLands(g, cx, cy, r, lon0, {
    fill: o.landFill || 'rgba(140,180,200,0.10)',
    line: o.land || 'rgba(190,225,240,0.55)',
    lw: o.lw || 1.1,
  });
  // 经纬网
  globeGrid(g, cx, cy, r, lon0, { col: o.grid || 'rgba(160,200,220,0.14)', lw: 0.8 });
  g.restore();
  // 外圈
  g.save();
  g.strokeStyle = o.rim || 'rgba(214,238,248,0.65)'; g.lineWidth = o.rimW || 1.6;
  g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.stroke();
  g.restore();
}

// 轨迹椭圆（倾斜视角）
function orbitPath(g, cx, cy, rx, ry, rot, o = {}) {
  g.save();
  g.translate(cx, cy); g.rotate(rot || 0);
  g.strokeStyle = o.color || 'rgba(200,228,240,0.35)';
  g.lineWidth = o.w || 1.2;
  if (o.dash) g.setLineDash(o.dash);
  g.beginPath(); g.ellipse(0, 0, rx, ry, 0, o.a0 === undefined ? 0 : o.a0, o.a1 === undefined ? 6.2832 : o.a1); g.stroke();
  g.restore();
}

function dotGlow(g, x, y, r, color = '255,200,150', a = 0.8) {
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  g.drawImage(TEX.glow, x - r * 3, y - r * 3, r * 6, r * 6);
  g.fillStyle = 'rgba(255,245,230,0.95)';
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.restore();
}

// 引导线 + 标注框
function callout(g, x, y, tx, ty, zh, en, o = {}) {
  const bw = Math.max(zh ? zh.length * 20 : 0, en ? en.length * 10.6 : 0) + 40;
  const bh = en ? 58 : 36;
  const bx = o.right ? x - bw : x;
  g.save();
  g.strokeStyle = 'rgba(226,242,250,0.55)'; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(tx, ty); g.lineTo(bx + (o.right ? bw : 0), ty); g.stroke();
  g.beginPath(); g.arc(tx, ty, 3, 0, 6.2832); g.fillStyle = 'rgba(240,250,255,0.9)'; g.fill();
  g.fillStyle = 'rgba(10,22,33,0.72)';
  g.fillRect(bx, y, bw, bh);
  g.strokeStyle = 'rgba(226,242,250,0.28)';
  g.strokeRect(bx + .5, y + .5, bw - 1, bh - 1);
  if (en) mono(g, en, bx + 14, y + 20, { size: 13, ls: 1.8, color: 'rgba(238,249,254,0.88)' });
  if (zh) txt(g, zh, bx + 14, y + (en ? 43 : 19), { size: 15, weight: 500, color: 'rgba(220,236,246,0.86)' });
  g.restore();
}

// V-2 矢量
function rocketV2(g, x, y, s, o = {}) {
  g.save();
  g.translate(x, y); g.scale(s, s);
  const ink = o.ink || 'rgba(12,22,32,0.92)';
  const ln = o.line || 'rgba(210,234,246,0.8)';
  g.lineWidth = 1.4 / s * 1.2;
  // 弹体
  g.beginPath();
  g.moveTo(0, -230);
  g.bezierCurveTo(10, -220, 13, -190, 13, -150);
  g.lineTo(13, 60);
  g.lineTo(-13, 60);
  g.lineTo(-13, -150);
  g.bezierCurveTo(-13, -190, -10, -220, 0, -230);
  g.closePath();
  g.fillStyle = ink; g.fill();
  g.strokeStyle = ln; g.stroke();
  // 棋盘环
  g.save(); g.beginPath(); g.rect(-13, -128, 26, 34); g.clip();
  for (let i = 0; i < 4; i++) {
    g.fillStyle = i % 2 ? 'rgba(225,240,248,0.92)' : 'rgba(20,32,44,0.95)';
    g.fillRect(-13, -128 + i * 8.5, 26, 8.5);
  }
  g.restore();
  g.strokeStyle = ln; g.strokeRect(-13, -128, 26, 34);
  // 尾翼
  for (const sx of [-1, 1]) {
    g.beginPath();
    g.moveTo(13 * sx, -20);
    g.lineTo(40 * sx, 62);
    g.lineTo(13 * sx, 56);
    g.closePath();
    g.fillStyle = ink; g.fill(); g.strokeStyle = ln; g.stroke();
  }
  // 喷口
  g.beginPath(); g.moveTo(-9, 60); g.lineTo(9, 60); g.lineTo(13, 76); g.lineTo(-13, 76); g.closePath();
  g.fillStyle = 'rgba(30,40,52,0.95)'; g.fill(); g.strokeStyle = ln; g.stroke();
  // 红色标记
  if (o.red !== false) {
    g.fillStyle = 'rgba(226,80,58,0.9)';
    g.beginPath(); g.arc(0, -190, 4, 0, 6.2832); g.fill();
  }
  g.restore();
}

// 土星五号剪影
function rocketSaturn(g, x, y, s, o = {}) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const ln = o.line || 'rgba(220,240,250,0.8)';
  g.fillStyle = o.ink || 'rgba(220,238,248,0.10)';
  g.strokeStyle = ln; g.lineWidth = 1.2 / s;
  g.beginPath();
  g.moveTo(0, -300); g.lineTo(9, -280); g.lineTo(15, -230); g.lineTo(15, 160);
  g.lineTo(-15, 160); g.lineTo(-15, -230); g.lineTo(-9, -280); g.closePath();
  g.fill(); g.stroke();
  for (const yy of [-190, -120, -40, 60]) {
    g.beginPath(); g.moveTo(-15, yy); g.lineTo(15, yy); g.stroke();
  }
  g.beginPath(); g.moveTo(-15, 160); g.lineTo(-26, 190); g.lineTo(-15, 185); g.stroke();
  g.beginPath(); g.moveTo(15, 160); g.lineTo(26, 190); g.lineTo(15, 185); g.stroke();
  g.restore();
}

function sputnik(g, x, y, r, o = {}) {
  g.save();
  const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  gr.addColorStop(0, 'rgba(226,240,248,0.35)');
  gr.addColorStop(0.6, 'rgba(120,160,185,0.18)');
  gr.addColorStop(1, 'rgba(6,14,22,0.65)');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(226,244,252,0.8)'; g.lineWidth = 1.4;
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke();
  // 经线弧
  g.save(); g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.clip();
  g.strokeStyle = 'rgba(226,244,252,0.22)'; g.lineWidth = 1;
  for (let i = -2; i <= 2; i++) {
    g.beginPath(); g.ellipse(x, y, Math.abs(i) * r * 0.42 + r * 0.06, r, 0, 0, 6.2832); g.stroke();
  }
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.restore();
  // 天线
  g.strokeStyle = 'rgba(226,244,252,0.7)'; g.lineWidth = 1.6;
  for (const a of [-2.55, -2.15, -0.99, -0.58]) {
    g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9);
    g.lineTo(x + Math.cos(a) * r * 2.2, y + Math.sin(a) * r * 2.2); g.stroke();
  }
  g.restore();
}

function recordDisc(g, x, y, r, rot, o = {}) {
  g.save(); g.translate(x, y); g.rotate(rot || 0);
  const gold = o.gold || ['#f0cf82', '#b9893f', '#7a5522'];
  const gr = g.createRadialGradient(0, 0, r * 0.1, 0, 0, r);
  gr.addColorStop(0, gold[1]); gr.addColorStop(0.55, gold[0]); gr.addColorStop(1, gold[2]);
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(70,44,14,0.35)'; g.lineWidth = 0.8;
  for (let i = 1; i < 42; i++) {
    g.beginPath(); g.arc(0, 0, r * (0.18 + i / 48), 0, 6.2832); g.stroke();
  }
  // 中心标签
  g.fillStyle = 'rgba(240,214,150,0.95)';
  g.beginPath(); g.arc(0, 0, r * 0.24, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(60,40,12,0.5)'; g.stroke();
  g.beginPath(); g.arc(0, 0, r * 0.035, 0, 6.2832); g.fillStyle = '#1a1206'; g.fill();
  // 封面蚀刻：脉冲星图
  if (o.cover) {
    g.strokeStyle = 'rgba(52,34,10,0.8)'; g.lineWidth = 1.1;
    for (let i = 0; i < 14; i++) {
      const a = i / 14 * 6.2832;
      g.beginPath(); g.moveTo(Math.cos(a) * r * 0.62, Math.sin(a) * r * 0.62);
      g.lineTo(Math.cos(a) * r * (0.66 + (i % 5) * 0.05), Math.sin(a) * r * (0.66 + (i % 5) * 0.05)); g.stroke();
    }
  }
  g.restore();
}

function filmGate(g, x, y, w, h, t, seed = 1) {
  const r = mulberry(seed + Math.floor(t * 3));
  g.save();
  g.beginPath(); g.rect(x, y, w, h); g.clip();
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = `rgba(240,246,250,${0.03 + r() * 0.05})`;
    g.lineWidth = 1;
    const sx = x + r() * w;
    g.beginPath(); g.moveTo(sx, y); g.lineTo(sx + (r() - 0.5) * 6, y + h); g.stroke();
  }
  g.globalAlpha = 0.10;
  const fl = 0.96 + 0.04 * Math.sin(t * 13.1);
  g.fillStyle = `rgba(255,248,236,${1 - fl})`; g.fillRect(x, y, w, h);
  g.restore();
}

/* ---------------------------------------------------------------- 后期 */
const FX = {};
function initFX() {
  FX.small = mk(W / 4, H / 4);
  FX.sg = FX.small.getContext('2d');
}
function grain(g, t, amount = 0.06) {
  const gi = Math.floor(t * 24) % 4;
  if (!TEX._grainPat) TEX._grainPat = [];
  const pat = TEX._grainPat[gi] || (TEX._grainPat[gi] = g.createPattern(TEX.grain[gi], 'repeat'));
  g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = amount;
  g.fillStyle = pat;
  g.translate(-(t * 137) % 256, -(t * 91) % 256);
  g.fillRect(0, 0, W + 256, H + 256);
  g.restore();
}
function vignette(g, o = {}) {
  const a = o.a === undefined ? 0.7 : o.a;
  const gr = g.createRadialGradient(W * (o.cx ?? 0.5), H * (o.cy ?? 0.46), Math.min(W, H) * 0.3, W * (o.cx ?? 0.5), H * (o.cy ?? 0.46), Math.max(W, H) * 0.8);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(0.65, `rgba(0,0,0,${a * 0.2})`);
  gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
function scanlines(g, a = 0.03) {
  // 实测 4K 下图案铺满比细条慢两个数量级（Skia 会把相邻 fillRect 合批）
  g.save(); g.globalAlpha = a;
  for (let y = 0; y < H; y += 3) {
    g.fillStyle = 'rgba(0,0,0,0.55)';
    g.fillRect(0, y, W, 1);
  }
  g.restore();
}
function flash(g, p, color = '255,245,235') {
  if (p <= 0) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = `rgba(${color},${0.9 * p})`; g.fillRect(0, 0, W, H);
  g.restore();
}

/* ---------------------------------------------------------------- 转场（渲染层调用） */
function transitionMask(g, prev, kind, p) {
  if (!prev || p >= 1) return;
  const k = clamp(p);
  g.save();
  if (kind === 'wipe') {
    g.beginPath(); g.rect(0, 0, W * (1 - k), H); g.clip();
    g.drawImage(prev, 0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W * (1 - k), 0); g.lineTo(W * (1 - k), H); g.stroke();
  } else if (kind === 'iris') {
    g.beginPath(); g.arc(W / 2, H / 2, Math.max(W, H) * k, 0, 6.2832); g.clip();
    g.drawImage(prev, 0, 0, W, H);
  } else if (kind === 'zoom') {
    const z = 1 + k * 0.5;
    g.globalAlpha = 1 - k;
    g.drawImage(prev, W / 2 - W * z / 2, H / 2 - H * z / 2, W * z, H * z);
  } else if (kind === 'whip') {
    g.globalAlpha = 1 - k;
    g.drawImage(prev, -W * k, 0, W, H);
    g.globalAlpha = 0.4 * (1 - k);
    g.drawImage(prev, -W * k * 1.15, 0, W, H);
  } else if (kind === 'glitch') {
    g.globalAlpha = 1 - k;
    const off = 14 * k;
    g.globalCompositeOperation = 'lighter';
    g.drawImage(prev, -off, 0, W, H);
    g.drawImage(prev, off, 0, W, H);
    g.globalCompositeOperation = 'source-over';
  } else {
    g.globalAlpha = 1 - k;
    g.drawImage(prev, 0, 0, W, H);
  }
  g.restore();
}
