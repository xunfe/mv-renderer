/* 一封情书 · 引擎层
 * 1920x1080 画布，全部画面实时生成：石纹/星野背景、金色发光线、玻璃卡片、
 * HSB 后期（bloom / halation / grain / vignette）、顶部 HUD、卡拉OK 字幕。
 */
'use strict';
const W = 1920, H = 1080;
const FONT_CN = '"Noto Sans CJK SC","Source Han Sans SC","PingFang SC","Microsoft YaHei",sans-serif';
const FONT_EN = '"Helvetica Neue","Inter","Roboto",sans-serif';
const FONT_SERIF = '"Times New Roman",Georgia,serif';
const FONT_SERIF_CN = '"Noto Serif CJK SC","Source Han Serif SC","Noto Serif",serif';

let RS = 1; // 渲染倍率：1=1080p，2=4K（画布内部像素），文字精灵按 RS 重绘

const PALETTE = {
  gold: '#e7bb72', goldHi: '#ffdca0', goldDeep: '#b98a44', goldDim: '#8a6a3c',
  ivory: '#f2eee4', ivory2: '#ddd5c6', dim: '#a89880', dim2: '#6d6152',
  ink: '#07070a', ink2: '#0c0b0e', brown: '#1a1109', warm: '#3a2413',
};

// ------------------------------------------------------------------ 工具
const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const isCJK = ch => { const o = ch.codePointAt(0); return (o >= 0x3400 && o <= 0x9fff) || (o >= 0xf900 && o <= 0xfaff) || (o >= 0xff00 && o <= 0xff65) || (o >= 0x3000 && o <= 0x303f) || ch === '—' || ch === '…'; };
const lerp = (a, b, p) => a + (b - a) * p;
const smooth = p => { p = clamp(p); return p * p * (3 - 2 * p); };
const easeOut = p => 1 - Math.pow(1 - clamp(p), 3);
const easeIn = p => Math.pow(clamp(p), 3);
const inv = (a, b, v) => clamp((v - a) / (b - a));

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
let _seed = 1234567;
function rnd() { // 每帧可复现的伪随机（按调用顺序）
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function reseed(s) { _seed = s; }

function mk(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h));
  return c;
}

// ------------------------------------------------------------------ 噪声/纹理
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
      const c2 = g[(y0 + 1) * gw + x0], d = g[(y0 + 1) * gw + x0 + 1];
      out[y * w + x] = lerp(lerp(a, b, tx), lerp(c2, d, tx), ty);
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
    tot += amp; amp *= 0.5; cell = Math.max(2, cell * 0.52);
  }
  for (let i = 0; i < out.length; i++) out[i] /= tot;
  return out;
}
function noiseCanvas(w, h, base, oct, seed, c0, c1, contrast = 1) {
  const n = fbm(w, h, base, oct, seed);
  const cv = mk(w, h), g = cv.getContext('2d');
  const im = g.createImageData(w, h);
  for (let i = 0; i < n.length; i++) {
    let v = clamp((n[i] - 0.5) * contrast + 0.5);
    im.data[i * 4] = lerp(c0[0], c1[0], v);
    im.data[i * 4 + 1] = lerp(c0[1], c1[1], v);
    im.data[i * 4 + 2] = lerp(c0[2], c1[2], v);
    im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv;
}

// 预生成纹理（启动时一次）
const TEX = {};
function buildTextures() {
  // 石纹：暖黑 + 云状起伏
  TEX.stone = noiseCanvas(560, 360, 90, 5, 11, [22, 16, 12], [70, 52, 36], 0.85);
  // 深空：几乎纯黑的蓝灰
  TEX.star = noiseCanvas(560, 360, 70, 5, 23, [6, 7, 11], [21, 23, 33], 0.9);
  // 白纸：亮灰
  TEX.paper = noiseCanvas(520, 340, 60, 5, 37, [196, 190, 180], [248, 245, 238], 1.1);
  // 胶片颗粒
  TEX.grain = [0, 1, 2, 3].map(k => {
    const w = 256, h = 256, cv = mk(w, h), g = cv.getContext('2d');
    const im = g.createImageData(w, h), r = mulberry(900 + k);
    for (let i = 0; i < w * h; i++) {
      const v = 128 + (r() - 0.5) * 200;
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v;
      im.data[i * 4 + 3] = 255;
    }
    g.putImageData(im, 0, 0);
    return cv;
  });
  // 尘埃光点
  TEX.dust = (() => {
    const s = 64, cv = mk(s, s), g = cv.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,246,225,1)');
    gr.addColorStop(0.25, 'rgba(255,228,176,0.55)');
    gr.addColorStop(1, 'rgba(255,210,150,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return cv;
  })();
  // 冷光点
  TEX.dotC = (() => {
    const s = 32, cv = mk(s, s), g = cv.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(214,232,255,0.35)');
    gr.addColorStop(1, 'rgba(160,200,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    return cv;
  })();
}

// ------------------------------------------------------------------ 背景基座
function bgStone(g, t, o = {}) {
  const { warm = 1, dark = 0.5, dy = 0, zoom = 1 } = o;
  g.save();
  g.fillStyle = '#080605'; g.fillRect(0, 0, W, H);
  const cx = W * (o.cx ?? 0.5), cy = H * (o.cy ?? 0.42) + dy;
  const rad = Math.max(W, H) * (o.rad ?? 0.9) * zoom;
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, rad);
  gr.addColorStop(0, `rgba(${120 * warm | 0},${86 * warm | 0},${46 * warm | 0},${0.92 - dark * 0.4})`);
  gr.addColorStop(0.35, `rgba(${72 * warm | 0},${50 * warm | 0},${26 * warm | 0},${0.62 - dark * 0.25})`);
  gr.addColorStop(0.7, `rgba(${32 * warm | 0},${22 * warm | 0},${12 * warm | 0},${0.28 - dark * 0.1})`);
  gr.addColorStop(1, 'rgba(6,4,3,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 次光：右下的反光
  const gr2 = g.createRadialGradient(W * 0.86, H * 0.72, 0, W * 0.86, H * 0.72, W * 0.55);
  gr2.addColorStop(0, `rgba(${76 * warm | 0},${58 * warm | 0},${34 * warm | 0},0.22)`);
  gr2.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr2; g.fillRect(0, 0, W, H);
  // 石纹贴图（带缓慢漂移）
  g.globalAlpha = 0.34 + 0.14 * warm;
  g.globalCompositeOperation = 'overlay';
  const sc = 1.15 * zoom;
  const sw = TEX.stone.width * sc, sh = TEX.stone.height * sc;
  const ox = -((t * 4) % sw), oy = -((t * 2.4) % sh);
  for (let y = oy - sh; y < H + sh; y += sh) for (let x = ox - sw; x < W + sw; x += sw)
    g.drawImage(TEX.stone, x, y, sw, sh);
  // 大裂缝
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 0.35; g.strokeStyle = 'rgba(14,10,7,0.85)'; g.lineWidth = 3;
  const r = mulberry(o.seed || 41);
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    let x = r() * W, y = r() * H;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) { x += (r() - 0.5) * 300; y += (r() - 0.4) * 220; g.lineTo(x, y); }
    g.stroke();
  }
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;
  g.restore();
}

function bgStar(g, t, o = {}) {
  const { glow = 0.55, hue = 0, cx = 0.5, cy = 0.45, rad = 1.1 } = o;
  g.save();
  g.fillStyle = '#04050a'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * cx, H * cy, 0, W * cx, H * cy, Math.max(W, H) * rad * 0.75);
  gr.addColorStop(0, `rgba(${30 + 60 * glow | 0},${28 + 46 * glow | 0},${36 + 40 * glow | 0},${0.65 * glow + 0.1})`);
  gr.addColorStop(0.55, `rgba(${16 + hue | 0},18,${28},${0.35 * glow})`);
  gr.addColorStop(1, 'rgba(3,4,7,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.22; g.globalCompositeOperation = 'overlay';
  const sw = TEX.star.width * 1.4, sh = TEX.star.height * 1.4;
  const ox = -((t * 2) % sw), oy = -((t * 1.2) % sh);
  for (let y = oy - sh; y < H + sh; y += sh) for (let x = ox - sw; x < W + sw; x += sw)
    g.drawImage(TEX.star, x, y, sw, sh);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.restore();
}

function bgPaper(g, t, o = {}) {
  g.save();
  g.fillStyle = '#d8d2c6'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * (o.cx ?? 0.5), H * (o.cy ?? 0.5), 0, W * (o.cx ?? 0.5), H * (o.cy ?? 0.5), W * 0.8);
  gr.addColorStop(0, 'rgba(252,250,244,1)');
  gr.addColorStop(0.6, 'rgba(232,228,218,1)');
  gr.addColorStop(1, 'rgba(170,164,152,1)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.25; g.globalCompositeOperation = 'multiply';
  const sw = TEX.paper.width * 1.1, sh = TEX.paper.height * 1.1;
  for (let y = 0; y < H + sh; y += sh) for (let x = 0; x < W + sw; x += sw)
    g.drawImage(TEX.paper, x, y, sw, sh);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
  g.restore();
}

// 流体/等高线纹理（图灵、图论那种迷幻底）
function bgContour(g, t, o = {}) {
  const { col = '230,200,150', dark = 1, freq = 0.010, amp = 26, seed = 3 } = o;
  g.save();
  g.fillStyle = `rgba(6,7,10,${dark})`; g.fillRect(0, 0, W, H);
  g.strokeStyle = `rgba(${col},0.30)`;
  g.lineWidth = 2.2;
  const n1 = 4.2, n2 = 6.1;
  for (let k = 0; k < 26; k++) {
    g.beginPath();
    for (let x = -40; x <= W + 40; x += 14) {
      const u = x * freq + k * 0.11;
      const y = H / 2 + amp * Math.sin(u * n1 + t * 0.55 + seed) * Math.cos(u * n2 - t * 0.4)
        + k * 26 - 300 + 40 * Math.sin(u * 1.7 + seed);
      x === -40 ? g.moveTo(x, y) : g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------------ 光与线
function glowLine(g, pts, o = {}) {
  const { w = 4, color = PALETTE.goldHi, glow = 26, alpha = 1, close = false, dash = null } = o;
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = alpha;
  const path = () => {
    g.beginPath();
    pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]));
    if (close) g.closePath();
  };
  if (glow) {
    g.shadowColor = color; g.shadowBlur = glow;
    g.strokeStyle = color; g.lineWidth = w * 0.9;
    g.globalAlpha = alpha * 0.55; if (dash) g.setLineDash(dash);
    path(); g.stroke();
  }
  if (dash) { g.setLineDash(dash); }
  g.globalAlpha = alpha;
  g.shadowBlur = glow * 0.35; g.shadowColor = color;
  g.strokeStyle = color; g.lineWidth = w;
  path(); g.stroke();
  g.shadowBlur = 0;
  g.strokeStyle = '#fff8e8'; g.lineWidth = Math.max(1, w * 0.34); g.globalAlpha = alpha * 0.95;
  path(); g.stroke();
  g.restore();
}

function glowCircle(g, cx, cy, r, o = {}) {
  const { a0 = 0, a1 = Math.PI * 2, w = 3, color = PALETTE.gold, glow = 22, alpha = 1, dash = null } = o;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.beginPath(); g.arc(cx, cy, r, a0, a1);
  g.shadowColor = color; g.shadowBlur = glow; g.strokeStyle = color; g.lineWidth = w;
  g.globalAlpha = alpha * 0.8; if (dash) g.setLineDash(dash); g.stroke();
  g.shadowBlur = glow * 0.2; g.strokeStyle = '#fff6e6'; g.lineWidth = w * 0.4; g.globalAlpha = alpha;
  g.stroke();
  g.restore();
}

function glowDot(g, x, y, r, o = {}) {
  const { color = '255,235,190', a = 1, core = true } = o;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a;
  const gr = g.createRadialGradient(x, y, 0, x, y, r * 4);
  gr.addColorStop(0, `rgba(255,250,235,1)`);
  gr.addColorStop(0.16, `rgba(${color},0.9)`);
  gr.addColorStop(0.45, `rgba(${color},0.22)`);
  gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r * 4, 0, 6.2832); g.fill();
  if (core) { g.fillStyle = '#fffdf6'; g.beginPath(); g.arc(x, y, r * 0.75, 0, 6.2832); g.fill(); }
  g.restore();
}

function softGlow(g, x, y, r, rgb = '255,200,120', a = 0.5) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.restore();
}

// 斜向光带（镜头光晕）
function lightStreak(g, x, y, len, ang, o = {}) {
  const { a = 0.35, w = 80, rgb = '255,215,160' } = o;
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.rotate(ang);
  const gr = g.createLinearGradient(-len / 2, 0, len / 2, 0);
  gr.addColorStop(0, `rgba(${rgb},0)`);
  gr.addColorStop(0.45, `rgba(${rgb},${a * 0.65})`);
  gr.addColorStop(0.5, `rgba(${rgb},${a})`);
  gr.addColorStop(0.55, `rgba(${rgb},${a * 0.65})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(0, 0, len / 2, w / 2, 0, 0, 6.2832); g.fill();
  g.restore();
}

// ------------------------------------------------------------------ 文字
const _textCache = new Map();
function textSprite(str, o) {
  const size = o.size, weight = o.weight || 800, color = o.color || PALETTE.ivory;
  const ls = o.ls || 0, font = o.font || FONT_CN, glow = o.glow === undefined ? 18 : o.glow;
  const key = [str, size, weight, color, ls, font, glow, o.italic || 0, RS].join('|');
  let hit = _textCache.get(key);
  if (hit) return hit;
  const pad = Math.ceil((glow * 2.2 + size * 0.35) * RS);
  const fontStr = `${o.italic ? 'italic ' : ''}${weight} ${size * RS}px ${font}`;
  const m0 = mk(10, 10).getContext('2d');
  m0.font = fontStr; m0.letterSpacing = ls * RS + 'px';
  const tw = m0.measureText(str).width;
  const cv = mk(tw + pad * 2, size * 1.6 * RS + pad * 2);
  const g = cv.getContext('2d');
  g.font = fontStr; g.letterSpacing = ls * RS + 'px';
  g.textBaseline = 'middle'; g.textAlign = 'left';
  const y = cv.height / 2;
  const draw = alpha => {
    g.globalAlpha = alpha;
    g.fillText(str, pad, y);
  };
  if (glow) {
    g.fillStyle = o.glowColor || color; g.shadowColor = o.glowColor || color; g.shadowBlur = glow * RS;
    draw(0.9); draw(0.9);
  }
  g.shadowBlur = 0; g.fillStyle = color; draw(1);
  hit = { cv, w: tw / RS, h: size, pad: pad / RS };
  _textCache.set(key, hit);
  return hit;
}

function text(g, str, x, y, o = {}) {
  const sp = textSprite(str, o);
  const align = o.align || 'center';
  const ax = align === 'center' ? x - sp.w / 2 : align === 'right' ? x - sp.w : x;
  g.save();
  if (o.alpha !== undefined) g.globalAlpha = o.alpha;
  if (o.blend) g.globalCompositeOperation = o.blend;
  g.drawImage(sp.cv, ax - sp.pad, y - sp.cv.height / 2 / RS, sp.cv.width / RS, sp.cv.height / RS);
  g.restore();
  return sp.w;
}

// letter-spaced 小字（HUD 用，带下划线灯点）
function caps(g, str, x, y, o = {}) {
  const size = o.size || 15, ls = o.ls === undefined ? 3.4 : o.ls;
  const color = o.color || 'rgba(226,214,192,0.62)';
  g.save();
  g.fillStyle = color;
  g.textBaseline = 'middle'; g.textAlign = 'left';
  let cx = x;
  for (const ch of str) {
    const cjk = isCJK(ch);
    g.font = cjk ? `600 ${size * 1.02}px ${FONT_CN}` : `${o.weight || 600} ${size}px ${o.font || FONT_EN}`;
    g.fillText(ch, cx, y);
    cx += g.measureText(ch).width + (cjk ? ls * 0.5 : ls);
  }
  g.restore();
  return cx - x;
}

// ------------------------------------------------------------------ 卡片 / 面板
function panel(g, x, y, w, h, o = {}) {
  const { fill = 'rgba(12,11,12,0.62)', stroke = 'rgba(228,186,120,0.55)', alpha = 1, glow = 10, r = 3 } = o;
  g.save(); g.globalAlpha = alpha;
  g.fillStyle = fill;
  g.fillRect(x, y, w, h);
  if (glow) { g.shadowColor = stroke; g.shadowBlur = glow; }
  g.strokeStyle = stroke; g.lineWidth = 1.35;
  g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.restore();
}

function ruled(g, x, y, w, n, o = {}) {
  const { lh = 7, color = 'rgba(230,220,200,0.30)' } = o;
  g.save(); g.strokeStyle = color; g.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const yy = y + i * lh;
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w * (0.6 + 0.4 * ((i * 37) % 11) / 11), yy); g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------------ HUD
const HUD_BAR = '▷ A BRIEF HISTORY OF MATHEMATICS · 数学简史 · ';
function hudBar(g, chapter, o = {}) {
  g.save();
  const y = o.y || 100, x = o.x || 44;
  if (o.light) {
    g.fillStyle = 'rgba(58,52,44,0.62)';
    caps(g, 'A BRIEF HISTORY OF MATHEMATICS', x + 26, y, { size: 14, ls: 3.2, color: 'rgba(58,52,44,0.55)' });
    caps(g, '·', x + 452, y, { size: 14, ls: 0, color: 'rgba(58,52,44,0.4)' });
    g.fillStyle = 'rgba(42,38,32,0.8)'; g.font = `600 15px ${FONT_CN}`;
    g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('数学简史', x + 476, y);
    caps(g, '·', x + 556, y, { size: 14, ls: 0, color: 'rgba(58,52,44,0.4)' });
    if (chapter) {
      caps(g, chapter, x + 580, y, { size: 13.5, ls: 3.0, color: 'rgba(58,52,44,0.45)' });
      g.font = `500 14px ${FONT_CN}`; g.fillStyle = 'rgba(58,52,44,0.45)';
      g.fillText(chapterCN(chapter), x + 580 + chapter.length * 10.5 + 34, y);
    }
    g.strokeStyle = 'rgba(70,60,48,0.5)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 9, y); g.lineTo(x, y + 5); g.stroke();
    g.restore();
    return;
  }
  g.fillStyle = 'rgba(226,214,192,0.55)';
  caps(g, 'A BRIEF HISTORY OF MATHEMATICS', x + 26, y, { size: 14, ls: 3.2 });
  g.fillStyle = 'rgba(226,214,192,0.42)';
  caps(g, '·', x + 452, y, { size: 14, ls: 0 });
  g.fillStyle = 'rgba(232,222,204,0.66)';
  g.font = `600 15px ${FONT_CN}`; g.textBaseline = 'middle'; g.textAlign = 'left';
  g.fillText('数学简史', x + 476, y);
  g.fillStyle = 'rgba(226,214,192,0.42)';
  caps(g, '·', x + 556, y, { size: 14, ls: 0 });
  if (chapter) {
    caps(g, chapter, x + 580, y, { size: 13.5, ls: 3.0, color: 'rgba(226,214,192,0.46)' });
    g.font = `500 14px ${FONT_CN}`;
    g.fillStyle = 'rgba(226,214,192,0.40)';
    g.fillText(chapterCN(chapter), x + 580 + chapter.length * 10.5 + 34, y);
  }
  // 左侧小三角标记
  g.globalAlpha = 0.5; g.strokeStyle = 'rgba(230,200,150,0.8)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x, y - 5); g.lineTo(x + 9, y); g.lineTo(x, y + 5); g.stroke();
  g.globalAlpha = 1;
  g.restore();
}
const CHAPTER_CN = { COUNT: '计数', NUMBER: '数', ZERO: '零', GEOMETRY: '几何', ALGEBRA: '代数',
  CALCULUS: '微积分', INFINITY: '无穷', LOGIC: '逻辑', COMPUTING: '计算', TOPOLOGY: '拓扑', PROOF: '证明',
  TIMELINE: '时间轴', FRACTAL: '分形', SPACE: '空间' };
function chapterCN(en) { return CHAPTER_CN[en] || ''; }

function hudMeta(g, o = {}) {
  // 右上角时间码与 BAR 号
  g.save();
  const x = W - 44, y = 100;
  g.textAlign = 'right'; g.textBaseline = 'middle';
  g.fillStyle = o.light ? 'rgba(58,52,44,0.45)' : 'rgba(226,214,192,0.42)';
  g.font = `600 13px ${FONT_EN}`;
  const tcode = o.tcode || 'T 00:00.000';
  g.fillText(tcode, x - 150, y);
  g.fillText('BAR 000.00', x, y);
  g.restore();
}

function cornerTicks(g, o = {}) {
  g.save(); g.strokeStyle = o.color || (o.light ? 'rgba(70,60,48,0.28)' : 'rgba(220,200,170,0.22)'); g.lineWidth = 1.1;
  const m = 26, L = 16;
  const pts = [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - 96, 1, -1], [W - m, H - 96, -1, -1]];
  for (const [x, y, sx, sy] of pts) {
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + L * sx, y); g.moveTo(x, y); g.lineTo(x, y + L * sy); g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------------ 字幕（卡拉OK 高亮）
function subtitle(g, cn, en, t, t0, t1, o) {
  if (!cn) return;
  const chars = [...cn];
  const appear = clamp((t - t0) / 0.16);
  const prog = clamp((t - t0) / Math.max(0.6, (t1 - t0) * 0.92));
  // 按标点/空格切词，当前词用暖金色
  const parts = [];
  let cur = [];
  for (const ch of chars) {
    if (ch === '，' || ch === '。' || ch === '、' || ch === '：' || ch === '？' || ch === '「' || ch === '」' || ch === ' ') {
      if (cur.length) { parts.push(cur); cur = []; }
      parts.push([ch]);
    } else cur.push(ch);
  }
  if (cur.length) parts.push(cur);
  const wordIdx = Math.min(parts.length - 1, Math.floor(prog * parts.length));
  const size = 45, y = 882;
  const spacing = 1.5;
  let total = 0;
  for (const ch of chars) total += isCJK(ch) ? size : size * 0.62;
  total += spacing * chars.length;
  let x = W / 2 - total / 2;
  g.save();
  g.globalAlpha = appear;
  // 底衬（柔和的椭圆压暗，不是硬色块）
  const LIGHT = !!(o && o.light);
  if (!LIGHT) {
    g.save();
    g.translate(W / 2, y + 8); g.scale(1, 0.24);
    const sh = g.createRadialGradient(0, 0, 0, 0, 0, 760);
    sh.addColorStop(0, 'rgba(6,5,4,0.46)');
    sh.addColorStop(0.55, 'rgba(6,5,4,0.22)');
    sh.addColorStop(1, 'rgba(6,5,4,0)');
    g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 760, 0, 6.2832); g.fill();
    g.restore();
  }
  let pi = 0, wi = 0;
  for (let i = 0; i < parts.length; i++) {
    for (const ch of parts[i]) {
      const cjk = isCJK(ch);
      const w = cjk ? size : size * 0.62;
      const lit = (i === wordIdx);
      if (ch !== ' ') {
        text(g, ch, x + w / 2, y, {
          size: cjk ? size : size * 0.92, weight: 800, font: cjk ? FONT_CN : FONT_EN,
          color: LIGHT ? (lit ? '#a8441a' : '#2f2a24') : (lit ? '#ffc266' : '#f6f3ec'),
          glow: LIGHT ? (lit ? 8 : 5) : (lit ? 24 : 11),
          glowColor: LIGHT ? (lit ? '#ffd0a0' : '#ffffff') : (lit ? '#ff8f2a' : '#fff0d2'),
        });
      }
      x += w + spacing;
    }
  }
  if (en) {
    text(g, en, W / 2, 926, {
      size: 25, weight: 600, font: FONT_EN, color: LIGHT ? '#7a5426' : '#dfa855', glow: LIGHT ? 6 : 13,
      glowColor: LIGHT ? '#fff2dd' : '#c8842e', ls: 0.5, alpha: clamp((t - t0 - 0.06) / 0.22),
    });
  }
  g.restore();
}

let _meas = null;
function measureChar(ch, size) {
  if (!_meas) _meas = mk(10, 10).getContext('2d');
  _meas.font = `800 ${size}px ${/[\u3400-\u9fff]/.test(ch) ? FONT_CN : FONT_EN}`;
  return _meas.measureText(ch).width;
}
function measureMixed(str, size, weight) {
  if (!_meas) _meas = mk(10, 10).getContext('2d');
  let w = 0;
  for (const ch of str) {
    const cjk = /[\u3400-\u9fff]/.test(ch);
    _meas.font = `${weight} ${cjk ? size : size * 0.7}px ${cjk ? FONT_CN : FONT_EN}`;
    w += _meas.measureText(ch).width + (cjk ? 1.2 : 0.4);
  }
  return w;
}

// ------------------------------------------------------------------ 后期
const FX = {};
function initFX() {
  FX.small = mk(W / 4, H / 4);
  FX.sg = FX.small.getContext('2d');
  FX.blur = mk(W / 4, H / 4);
  FX.bg = FX.blur.getContext('2d');
  FX.q = mk(W / 5, H / 5);
  FX.qg = FX.q.getContext('2d');
  FX.grainPat = TEX.grain.map(cv => cv);
}
function bloom(g, t, amount = 0.3) {
  // 降采样后在「小画布」上模糊，再放大回叠：避免对全画布做 filter blur（极慢）
  const sw = FX.small.width, sh = FX.small.height;
  const sg = FX.sg;
  sg.filter = 'none';
  sg.clearRect(0, 0, sw, sh);
  sg.drawImage(g.canvas, 0, 0, sw, sh);
  const bg = FX.bg;
  bg.filter = 'none';
  bg.clearRect(0, 0, sw, sh);
  bg.filter = 'blur(3px)';
  bg.drawImage(FX.small, 0, 0);
  bg.filter = 'none';
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = amount;
  g.drawImage(FX.blur, 0, 0, W, H);
  g.globalAlpha = amount * 0.5;
  g.drawImage(FX.small, 0, 0, W, H);
  g.restore();
}

function grain(g, t, amount = 0.085) {
  const gi = Math.floor(t * 30) % 4;
  const pat = g.createPattern(TEX.grain[gi], 'repeat');
  g.save();
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = amount;
  g.fillStyle = pat;
  const ox = (t * 137) % 256, oy = (t * 91) % 256;
  g.translate(-ox, -oy);
  g.fillRect(0, 0, W + 256, H + 256);
  g.restore();
}

function vignette(g, o = {}) {
  const { a = 0.72, cx = 0.5, cy = 0.46, r = 0.78 } = o;
  g.save();
  const gr = g.createRadialGradient(W * cx, H * cy, Math.min(W, H) * r * 0.25, W * cx, H * cy, Math.max(W, H) * r);
  gr.addColorStop(0, 'rgba(0,0,0,0)');
  gr.addColorStop(0.6, `rgba(0,0,0,${a * 0.22})`);
  gr.addColorStop(1, `rgba(0,0,0,${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
}


// ------------------------------------------------------------------ 大气层（全片统一调色）
function atmosphere(g, t, o = {}) {
  const warm = o.warm === undefined ? 1 : o.warm;
  // 1) 边缘暖色漏光
  g.save();
  g.globalCompositeOperation = 'lighter';
  const lx = W * (0.06 + 0.03 * Math.sin(t * 0.11)), ly = H * (0.3 + 0.12 * Math.sin(t * 0.07 + 1));
  const gr = g.createRadialGradient(lx, ly, 0, lx, ly, W * 0.55);
  gr.addColorStop(0, `rgba(255,186,110,${0.028 * warm})`);
  gr.addColorStop(1, 'rgba(255,186,110,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
  // 2) 胶片光晕：把画面本身提亮叠加一点
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.10 * warm;
  g.drawImage(FX.q, 0, 0, W, H);
  g.restore();
  // 3) 暖色柔和分级
  g.save();
  g.globalCompositeOperation = 'soft-light';
  const gd = g.createLinearGradient(0, 0, 0, H);
  gd.addColorStop(0, 'rgba(255,196,128,0.11)');
  gd.addColorStop(0.55, 'rgba(180,132,80,0.04)');
  gd.addColorStop(1, 'rgba(16,10,6,0.22)');
  g.fillStyle = gd; g.fillRect(0, 0, W, H);
  g.restore();
  // 4) 压黑：暗部更沉
  g.save();
  g.globalCompositeOperation = 'multiply';
  const gm = g.createRadialGradient(W * 0.5, H * 0.45, Math.min(W, H) * 0.30, W * 0.5, H * 0.45, Math.max(W, H) * 0.78);
  gm.addColorStop(0, 'rgba(255,255,255,1)');
  gm.addColorStop(0.62, 'rgba(216,203,186,1)');
  gm.addColorStop(1, 'rgba(120,104,86,1)');
  g.fillStyle = gm; g.fillRect(0, 0, W, H);
  g.restore();
}

// 尘埃粒子（每帧生成，带视差与闪烁）
function dust(g, t, o = {}) {
  const { n = 110, alpha = 0.7, size = 2.2, speed = 1, seed = 7, warm = true } = o;
  const r = mulberry(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const bx = r(), by = r(), ph = r() * 6.28, sp = 0.3 + r(), sz = 0.4 + r();
    const x = (bx * W + Math.sin(t * 0.22 * sp * speed + ph) * 36 + t * 7 * speed * (bx - 0.5)) % W;
    const y = (by * H - t * 11 * sp * speed + Math.sin(t * 0.17 + ph) * 22 + H) % H;
    const a = alpha * (0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.7 * sp + ph), 3));
    const s = size * sz * 5;
    g.globalAlpha = a;
    g.drawImage(warm ? TEX.dust : TEX.dotC, (x + W) % W - s / 2, (y + H) % H - s / 2, s, s);
  }
  g.restore();
}

// 星点（静态星野，随时间微闪）
function stars(g, t, o = {}) {
  const { n = 320, alpha = 0.9, seed = 21, maxR = 1.7, hue = '255,240,215' } = o;
  const r = mulberry(seed);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = r() * W, y = r() * (H - 90), ph = r() * 6.28, sp = 0.6 + r() * 1.8, sz = r();
    const a = alpha * (0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * sp + ph)));
    g.globalAlpha = a;
    const rr = 0.5 + sz * maxR;
    g.fillStyle = `rgba(${hue},${0.9})`;
    g.beginPath(); g.arc(x, y, rr, 0, 6.2832); g.fill();
    if (sz > 0.93) glowDot(g, x, y, 1.4, { a: a * 0.8 });
  }
  g.restore();
}

// 镜头：绕画布中心推拉
function cam(g, { z = 1, dx = 0, dy = 0, rot = 0 } = {}) {
  g.translate(W / 2 + dx, H / 2 + dy);
  g.rotate(rot);
  g.scale(z, z);
  g.translate(-W / 2, -H / 2);
}
