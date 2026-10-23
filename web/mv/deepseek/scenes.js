/* 一封情书 · 画面层
 * 32 个镜头，一个镜头一句旁白。画面全部实时绘制：深海、金线鲸鱼、红墙、算力卡、
 * 演算纸。坐标直接用画布像素（1920×1080）。
 * 时间轴对齐《开智小曲》112.8 BPM：小节 2.12766s，第一小节起点 0.365s。
 */
'use strict';

const BAR2 = 2.12766, B0 = 0.365;
const Bq = n => B0 + n * BAR2;

const C = {
  gold: '#e8b45e', goldHi: '#ffd79a', goldPale: '#f6e2bd',
  ivory: '#efe6d6', dim: 'rgba(230,215,190,0.40)',
  red: '#d9503c', redHi: '#ff7a5e', redDark: '#5e1a14',
  blue: '#7fb8d8', blueHi: '#a8dff0', blueDeep: '#20455e',
  paper: '#e6dcc2', ink: '#2a2018',
};

const W2 = W / 2, H2 = H / 2;
let T_CUR = 2.4;   // 当前镜头时长，由 mv.js 每帧写入

// ---------------------------------------------------------------- 小工具
function E(e, d, dur) {
  return easeOut(clamp((e - (d || 0)) / Math.min(dur || 0.6, Math.max(0.2, T_CUR * 0.45))));
}

function rrect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r); g.closePath();
}
function ln(g, pts, o = {}) { glowLine(g, pts, Object.assign({ w: 2.6, color: C.gold, glow: 16, alpha: 1 }, o)); }
function pl(g, pts, o = {}) { ln(g, pts.concat([pts[0]]), o); }
function ci(g, x, y, r, o = {}) { glowCircle(g, x, y, r, Object.assign({ w: 2.4, color: C.gold, glow: 14 }, o)); }
function ar(g, x, y, r, a0, a1, o = {}) {
  if (a1 - a0 >= Math.PI * 2 - 1e-4) a1 = a0 + Math.PI * 2 - 0.001;
  glowCircle(g, x, y, r, Object.assign({ a0, a1, w: 2.4, color: C.gold, glow: 14 }, o));
}
function dt(g, x, y, r, o = {}) { glowDot(g, x, y, r, o); }
function tx(g, s, x, y, size, o = {}) {
  if (size && typeof size === 'object') { o = size; size = o.size || 14; }
  text(g, s, x, y, Object.assign({ size, weight: 600, font: FONT_SERIF, color: C.ivory, glow: 10 }, o));
}
function cn(g, s, x, y, size, o = {}) {
  if (size && typeof size === 'object') { o = size; size = o.size || 14; }
  text(g, s, x, y, Object.assign({ size, weight: 700, font: FONT_SERIF_CN, color: C.ivory, glow: 10 }, o));
}
function cap(g, s, x, y, o = {}) {
  caps(g, s, x, y, Object.assign({ size: 11, ls: 3.6, color: 'rgba(220,205,180,0.38)' }, o));
}

// 按长度比例截取折线
function partial(pts, f) {
  if (f <= 0) return [];
  let len = 0; const seg = [];
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d); len += d;
  }
  const target = len * clamp(f, 0, 1);
  const out = [pts[0]];
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    if (acc + seg[i - 1] <= target) { out.push(pts[i]); acc += seg[i - 1]; continue; }
    const k = (target - acc) / seg[i - 1];
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]);
    break;
  }
  return out;
}

// 一层薄雾（让远处的东西退后）
function haze(g, x, y, r, col = '120,180,220', a = 0.10) {
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${col},${a})`);
  gr.addColorStop(0.5, `rgba(${col},${a * 0.35})`);
  gr.addColorStop(1, `rgba(${col},0)`);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.restore();
}

// 一张卡（H800）
function chip(g, x, y, w, h, o = {}) {
  const { a = 1, col = C.gold, fill = 'rgba(20,32,44,0.85)', gl = 8, lit = 1 } = o;
  const k = 0.40;
  g.save();
  g.globalAlpha = a;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + w, y - h * k * 0.45); g.lineTo(x + w, y + h - h * k * 0.45); g.lineTo(x, y + h);
  g.closePath();
  g.fillStyle = fill; g.fill();
  g.strokeStyle = col; g.lineWidth = 1.1; g.shadowColor = col; g.shadowBlur = gl * lit; g.stroke();
  g.shadowBlur = 0;
  g.beginPath();
  g.moveTo(x, y); g.lineTo(x + w, y - h * k * 0.45);
  g.lineTo(x + w - w * 0.22, y - h * k * 0.45 - h * 0.28); g.lineTo(x + w * 0.22, y - h * 0.28);
  g.closePath();
  g.fillStyle = 'rgba(34,50,64,0.92)'; g.fill();
  g.globalAlpha = a * 0.65; g.strokeStyle = col; g.stroke();
  g.globalAlpha = a;
  g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 6 * lit;
  g.beginPath(); g.arc(x + w * 0.16, y + h * 0.30, 1.6, 0, 6.28); g.fill();
  g.restore();
}

// 一台服务器机柜：layers 层，每层一张横插的 GPU 卡
function rack(g, x, y, w, h, o = {}) {
  const { lit = 8, layers = 8, a = 1, hot = 'rgba(255,202,120,0.95)' } = o;
  g.save();
  g.globalAlpha = a;
  // 柜体
  g.fillStyle = 'rgba(7,13,20,0.96)';
  g.fillRect(x, y, w, h);
  g.strokeStyle = 'rgba(120,165,200,0.38)'; g.lineWidth = 1.1;
  g.strokeRect(x, y, w, h);
  // 顶部指示灯条
  g.fillStyle = 'rgba(60,90,115,0.55)';
  g.fillRect(x + w * 0.10, y + h * 0.012, w * 0.80, Math.max(2, h * 0.014));
  const lh = (h * 0.955) / layers;
  for (let i = 0; i < layers; i++) {
    const yy = y + h - (i + 1) * lh;
    // 卡槽
    g.fillStyle = 'rgba(18,28,38,0.92)';
    g.fillRect(x + w * 0.055, yy + lh * 0.10, w * 0.89, lh * 0.80);
    // 卡本体（横插）
    const on = i < lit;
    if (on) {
      const gd = g.createLinearGradient(x, yy, x + w, yy);
      gd.addColorStop(0, 'rgba(232,168,90,0.86)');
      gd.addColorStop(0.55, 'rgba(255,216,160,0.94)');
      gd.addColorStop(1, 'rgba(232,168,90,0.86)');
      g.fillStyle = gd;
      g.shadowColor = 'rgba(255,190,110,0.55)'; g.shadowBlur = 6;
    } else {
      g.fillStyle = 'rgba(46,62,78,0.55)';
      g.shadowBlur = 0;
    }
    g.fillRect(x + w * 0.11, yy + lh * 0.33, w * 0.78, lh * 0.28);
    g.shadowBlur = 0;
    // 卡上的接口/风扇细节
    if (on) {
      g.fillStyle = 'rgba(120,70,20,0.55)';
      for (let k = 0; k < 3; k++) g.fillRect(x + w * (0.16 + k * 0.10), yy + lh * 0.42, w * 0.03, lh * 0.12);
      g.fillStyle = 'rgba(255,255,235,0.9)';
      g.beginPath(); g.arc(x + w * 0.84, yy + lh * 0.48, Math.max(1, lh * 0.06), 0, 6.28); g.fill();
    }
  }
  g.restore();
}

// 机柜阵列（预渲染，每排一张）
let RACKS = null;
function buildRacks() {
  const rows = 3, cols = 6, layers = 8;
  const baseY = 800;
  const list = [];
  for (let r = 0; r < rows; r++) {
    const z = 0.66 + r * 0.17;
    const w = 158 * z, h = 214 * z;
    const gap = 22 * z;
    const totalW = cols * w + (cols - 1) * gap;
    const x0 = W2 - totalW / 2 + (r - 1) * 86;
    const y = baseY - h - (rows - 1 - r) * 66;
    for (let c = 0; c < cols; c++) {
      const x = x0 + c * (w + gap);
      const cvL = mk(w + 4, h + 4), cvD = mk(w + 4, h + 4);
      rack(cvL.getContext('2d'), 2, 2, w, h, { lit: layers, layers });
      rack(cvD.getContext('2d'), 2, 2, w, h, { lit: 0, layers });
      list.push({ x: x - 2, y: y - 2, w: w + 4, h: h + 4, cvL, cvD, layers });
    }
  }
  RACKS = list;
}

// DeepSeek 的蓝鲸 logo（官方图标）：中心锚点，dir=1 朝右（镜像），dir=-1 朝左，dir=1 朝右（镜像），dir=-1 朝左
function whale(g, x, y, L, t, o = {}) {
  const { dir = 1, alpha = 1, phase = null } = o;
  const img = globalThis.__LOGO ||
    (typeof document !== 'undefined' && document.getElementById ? document.getElementById('ds-logo') : null);
  if (!img || !img.width) return;
  const ph = phase === null ? t * 1.1 : phase;
  const sz = L;
  g.save();
  g.globalAlpha = alpha;
  g.translate(x, y + Math.sin(ph) * L * 0.018);
  g.rotate(Math.sin(ph) * 0.045);
  if (dir === 1) g.scale(-1, 1);
  g.drawImage(img, -sz / 2, -sz / 2, sz, sz);
  g.restore();
}

// 表情贴纸（网上的「蓝色大肥鱼」梗图，白底圆角卡片）
function meme(g, k, x, y, size, o = {}) {
  const { a = 1, rot = 0, bob = 0, t = 0 } = o;
  const img = (globalThis.__MEMES && globalThis.__MEMES[k]) ||
    (typeof document !== 'undefined' && document.getElementById ? document.getElementById('mem-' + k) : null);
  if (!img || !img.width) return;
  const h = size, w = size * img.width / img.height;
  g.save();
  g.globalAlpha = a;
  g.translate(x, y + Math.sin(t * 1.3) * bob);
  g.rotate(rot);
  g.shadowColor = 'rgba(0,0,0,0.6)'; g.shadowBlur = 30; g.shadowOffsetY = 12;
  g.fillStyle = '#ffffff';
  rrect(g, -w / 2 - 9, -h / 2 - 9, w + 18, h + 18, 20);
  g.fill();
  g.shadowBlur = 0; g.shadowOffsetY = 0;
  g.drawImage(img, -w / 2, -h / 2, w, h);
  g.restore();
}

// 透视地面网格
function floorGrid(g, t, o = {}) {
  const { y0 = 700, cols = 22, rows = 12, a = 0.16, col = '120,175,215', vpx = W / 2 } = o;
  g.save();
  g.strokeStyle = `rgb(${col})`; g.lineWidth = 1;
  for (let i = 0; i <= rows; i++) {
    const u = i / rows;
    const y = y0 + (H * 1.06 - y0) * (u * u);
    g.globalAlpha = a * (0.30 + 0.70 * u);
    g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke();
  }
  for (let i = -cols / 2; i <= cols / 2; i++) {
    const xx = vpx + i * (W / cols) * 1.9;
    g.globalAlpha = a * 0.75;
    g.beginPath(); g.moveTo(vpx + (xx - vpx) * 0.30, y0 + (H * 1.06 - y0) * 0.09); g.lineTo(xx, H * 1.06); g.stroke();
  }
  g.globalAlpha = a * 1.4;
  g.beginPath(); g.moveTo(0, y0); g.lineTo(W, y0); g.stroke();
  g.restore();
}

// 红墙（封锁）：两面墙向中间收
function redWall(g, t, o = {}) {
  const { a = 1, squeeze = 0 } = o;
  const cx = W2;
  const gap = 250 - squeeze * 150;
  g.save();
  g.globalAlpha = a;
  const lg = g.createLinearGradient(0, 0, cx - gap, 0);
  lg.addColorStop(0, 'rgba(18,4,3,0.97)');
  lg.addColorStop(0.62, 'rgba(64,12,9,0.92)');
  lg.addColorStop(1, 'rgba(112,24,17,0.96)');
  g.fillStyle = lg;
  g.beginPath();
  g.moveTo(0, -20); g.lineTo(cx - gap, H * 0.10); g.lineTo(cx - gap, H * 0.94); g.lineTo(0, H + 20);
  g.closePath(); g.fill();
  const rg2 = g.createLinearGradient(W, 0, cx + gap, 0);
  rg2.addColorStop(0, 'rgba(18,4,3,0.97)');
  rg2.addColorStop(0.62, 'rgba(64,12,9,0.92)');
  rg2.addColorStop(1, 'rgba(112,24,17,0.96)');
  g.fillStyle = rg2;
  g.beginPath();
  g.moveTo(W, -20); g.lineTo(cx + gap, H * 0.10); g.lineTo(cx + gap, H * 0.94); g.lineTo(W, H + 20);
  g.closePath(); g.fill();
  g.strokeStyle = 'rgba(255,120,90,0.10)'; g.lineWidth = 1;
  for (let i = 0; i < 24; i++) {
    const u = i / 24;
    const y = H * 0.10 + (H * 0.84) * u;
    g.beginPath(); g.moveTo(0, y - 8); g.lineTo(cx - gap, y); g.stroke();
    g.beginPath(); g.moveTo(W, y - 8); g.lineTo(cx + gap, y); g.stroke();
  }
  for (let i = 1; i < 10; i++) {
    const k = i / 10;
    g.beginPath(); g.moveTo((cx - gap) * k, -20); g.lineTo((cx - gap) * k, H + 20); g.stroke();
    g.beginPath(); g.moveTo(W - (W - cx - gap) * k, -20); g.lineTo(W - (W - cx - gap) * k, H + 20); g.stroke();
  }
  g.globalCompositeOperation = 'lighter';
  for (const [x, dir] of [[cx - gap, 1], [cx + gap, -1]]) {
    const gg = g.createLinearGradient(x, 0, x + dir * 90, 0);
    gg.addColorStop(0, `rgba(255,80,55,${0.32 * a})`);
    gg.addColorStop(1, 'rgba(255,80,55,0)');
    g.fillStyle = gg; g.fillRect(Math.min(x, x + dir * 90), 0, 90, H);
  }
  g.restore();
}

// 纸（暖白信纸）
function paper(g, x, y, w, h, o = {}) {
  const { a = 1, rot = -0.02, lines = true, n = 7 } = o;
  g.save();
  g.translate(x, y); g.rotate(rot); g.globalAlpha = a;
  g.shadowColor = 'rgba(255,210,150,0.30)'; g.shadowBlur = 40;
  g.fillStyle = C.paper;
  g.fillRect(-w / 2, -h / 2, w, h);
  g.shadowBlur = 0;
  g.globalAlpha = a * 0.5;
  g.fillStyle = 'rgba(150,125,90,0.18)';
  const r = mulberry(700);
  for (let i = 0; i < 60; i++) g.fillRect(-w / 2 + r() * w, -h / 2 + r() * h, 1 + r() * 2, 1);
  g.globalAlpha = a * 0.30;
  g.strokeStyle = 'rgba(120,95,62,0.55)'; g.lineWidth = 1.4;
  g.strokeRect(-w / 2, -h / 2, w, h);
  if (lines) {
    g.globalAlpha = a * 0.20;
    g.strokeStyle = '#8a7452'; g.lineWidth = 1;
    for (let i = 1; i <= n; i++) {
      const yy = -h / 2 + (h / (n + 1)) * i;
      g.beginPath(); g.moveTo(-w / 2 + w * 0.08, yy); g.lineTo(w / 2 - w * 0.08, yy); g.stroke();
    }
  }
  g.restore();
}

// 大号发光关键词
function big(g, s, x, y, size, o = {}) {
  const { a = 1, color = C.goldHi, glow = 40, font = FONT_SERIF_CN, weight = 700, ls = 0, rise = 0 } = o;
  text(g, s, x, y + rise, { size, weight, font, color, glow, glowColor: color, alpha: a, ls });
}

// ---------------------------------------------------------------- 镜头
const SCENES = [];
function S(a, b, sub, art, extra) {
  SCENES.push(Object.assign({ t0: Bq(a), t1: Bq(b), sub, art }, extra || {}));
}

// 1. 嗯……（0–1）
S(0, 1, null, (g, e, dur, t) => {
  g.fillStyle = '#010204'; g.fillRect(0, 0, W, H);
  const cx = W2, cy = H2 - 20;
  g.save();
  g.globalAlpha = smooth(clamp(e / 0.45));
  // 文字中心偏左，给光标和省略号留位置
  big(g, '嗯', cx - 96, cy, 132, { color: C.goldHi, glow: 44, weight: 500 });
  // 光标：紧贴文字右侧
  if (Math.floor(e / 0.53) % 2 === 0) {
    g.globalAlpha = 0.55;
    g.fillStyle = C.ivory;
    g.fillRect(cx - 4, cy - 54, 3, 108);
    g.globalAlpha = smooth(clamp(e / 0.45));
  }
  // 省略号：光标右侧，一个一个冒出来
  for (let i = 0; i < 3; i++) {
    const p = clamp((e - 0.5 - i * 0.42) / 0.32);
    if (p <= 0) continue;
    g.globalAlpha = smooth(p) * (1 - 0.12 * i);
    g.fillStyle = C.goldHi;
    g.shadowColor = C.goldHi; g.shadowBlur = 22;
    g.beginPath(); g.arc(cx + 42 + i * 40, cy + 36, 8.5 - i * 0.5, 0, 6.28); g.fill();
    g.shadowBlur = 0;
  }
  g.restore();
});

// 2. 先别急着看结局（1–2）
S(1, 2, null, (g, e, dur, t) => {
  const k = smooth(clamp(e / 0.7));
  g.save();
  g.globalAlpha = k;
  haze(g, W2, H2 - 40, 540, '120,180,220', 0.05 + 0.02 * Math.sin(t * 1.2));
  dt(g, W2, H2 - 60, 3.0, { a: 0.30 + 0.14 * Math.sin(t * 0.9), color: '255,235,195' });
  g.restore();
  cn(g, '先别急着看结局。', W2, H2 + 110, 40, {
    color: 'rgba(235,225,205,0.92)', glow: 14, alpha: smooth(clamp((e - 0.2) / 0.9)), weight: 500, ls: 6,
  });
  meme(g, 'a', W * 0.80, H * 0.42, 300, { a: smooth(clamp((e - 0.45) / 0.7)), rot: 0.05, bob: 5, t });
});

// 3. 这封信，已经写了三年（2–4）
S(2, 4, '这封信，已经写了{3}年。', (g, e, dur, t) => {
  const p = clamp(e / dur);
  const x = W * 1.05 - p * W * 1.05;
  const y = H * 0.42 + Math.sin(t * 0.5) * 10;
  haze(g, x, y - 30, 520, '90,150,190', 0.06);
  whale(g, x, y, 420, t, { dir: -1, alpha: 0.42 * smooth(clamp(e / 0.8)), glow: 16, w: 2.4 });
  dt(g, W * 0.22, H * 0.24, 1.4, { a: 0.5 });
  dt(g, W * 0.78, H * 0.18, 1.1, { a: 0.4 });
}, { tint: 'rgba(20,40,60,0.3)' });

// 4. 2025 年 1 月 27 日，纽约（4–6）
S(4, 6, '{2025} 年 {1} 月 {27} 日，{纽约}。', (g, e, dur, t) => {
  const p = E(e, 0.05, 1.1);
  const base = H * 0.685;
  const r = mulberry(88);
  const N = 24;
  const blds = [];
  for (let i = 0; i < N; i++) {
    const w = W / N * (0.62 + r() * 0.5);
    const h = 70 + r() * 330 * (0.55 + 0.45 * Math.sin(i * 0.9));
    blds.push({ x: (i / N) * W + (r() - 0.5) * 18, w, h, spire: r() > 0.82 });
  }
  // 远景（更暗的一层楼）
  const r2 = mulberry(188);
  for (let i = 0; i < 30; i++) {
    const w = 40 + r2() * 40, h = 30 + r2() * 150;
    g.save(); g.globalAlpha = 0.20;
    g.fillStyle = '#0d1c28';
    g.fillRect(i * 68 + r2() * 20, base - h, w, h);
    g.restore();
  }
  // 主楼群轮廓（描线动画）
  const outline = [[-40, base]];
  for (const b of blds) {
    outline.push([b.x, base], [b.x, base - b.h], [b.x + b.w, base - b.h], [b.x + b.w, base]);
  }
  outline.push([W + 40, base]);
  ln(g, partial(outline, p), { w: 1.7, color: 'rgba(240,190,110,0.95)', glow: 10, alpha: 1 });
  // 尖顶
  for (const b of blds) {
    if (!b.spire) continue;
    const cx2 = b.x + b.w / 2;
    ln(g, [[cx2, base - b.h], [cx2, base - b.h - 46]], { w: 1.2, color: 'rgba(240,190,110,0.7)', glow: 6 });
    dt(g, cx2, base - b.h - 46, 1.4, { a: 0.5 });
  }
  // 窗灯
  for (const b of blds) {
    const n = Math.floor((b.h - 10) / 24);
    for (let j = 0; j < n; j++) {
      if (r() > 0.5) continue;
      const on = smooth(clamp((e - j * 0.03) / 0.4));
      g.save(); g.globalAlpha = 0.38 * on;
      g.fillStyle = 'rgba(255,214,150,0.95)';
      g.fillRect(b.x + b.w * 0.18, base - 16 - j * 22, 2.6, 6);
      g.fillRect(b.x + b.w * 0.60, base - 16 - j * 22, 2.6, 6);
      g.restore();
    }
  }
  // 河面：暗水 + 楼群倒影
  const wg = g.createLinearGradient(0, base, 0, H);
  wg.addColorStop(0, 'rgba(14,30,44,0.75)');
  wg.addColorStop(0.55, 'rgba(6,14,22,0.55)');
  wg.addColorStop(1, 'rgba(2,5,9,0.20)');
  g.fillStyle = wg; g.fillRect(0, base, W, H - base);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const b of blds) {
    if (r() > 0.72) continue;
    const cx2 = b.x + b.w / 2;
    const a2 = 0.05 + r() * 0.06;
    const gg = g.createLinearGradient(0, base, 0, base + 190);
    gg.addColorStop(0, `rgba(240,190,120,${a2})`);
    gg.addColorStop(1, 'rgba(240,190,120,0)');
    g.fillStyle = gg;
    g.fillRect(cx2 - b.w * 0.34, base, b.w * 0.68, 190);
    g.globalAlpha = 1;
  }
  g.restore();
  // 车流：水面上的光点
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const x = ((t * (40 + i * 7) + i * 137) % (W + 200)) - 100;
    const y = base + 18 + (i % 5) * 16;
    g.globalAlpha = 0.14 + (i % 3) * 0.05;
    g.fillStyle = i % 3 ? 'rgba(255,220,170,0.9)' : 'rgba(255,120,90,0.9)';
    g.fillRect(x, y, 12, 1.6);
  }
  g.restore();
  // 雾
  haze(g, W * 0.5, base - 60, 720, '120,170,210', 0.07);
  // 月亮
  g.save(); g.globalCompositeOperation = 'lighter';
  const mg = g.createRadialGradient(W * 0.80, H * 0.19, 0, W * 0.80, H * 0.19, 170);
  mg.addColorStop(0, 'rgba(220,235,255,0.45)');
  mg.addColorStop(0.2, 'rgba(200,225,250,0.16)');
  mg.addColorStop(1, 'rgba(200,225,250,0)');
  g.fillStyle = mg; g.beginPath(); g.arc(W * 0.80, H * 0.19, 170, 0, 6.28); g.fill();
  g.restore();
  dt(g, W * 0.80, H * 0.19, 16, { a: 0.45, color: '225,240,255' });
  // 日期
  const a = smooth(clamp((e - 0.5) / 0.7));
  g.save(); g.globalAlpha = a;
  cn(g, '2025.01.27', 150, H * 0.20, 36, { color: C.goldPale, glow: 14, weight: 500 });
  g.fillStyle = 'rgba(232,180,94,0.8)'; g.fillRect(150, H * 0.20 + 32, 230, 1.2);
  cap(g, 'NEW YORK · 08:30 EST', 150, H * 0.20 + 60, { size: 10, ls: 2.8, align: 'left' });
  g.restore();
}, { tint: 'rgba(40,60,90,0.35)' });

// 5. 一只鲸鱼，冲上美国 App Store 免费榜第一（6–8）
S(6, 8, '一只鲸鱼，冲上了美国 {App Store} 免费榜第一。', (g, e, dur, t) => {
  const cardW = 420, cardH = 96, gap = 12;
  const N = 6;
  const top = H * 0.20;
  const x0 = W2 - cardW / 2;
  const names = ['某聊天', '某助手', '某搜索', '某翻译', '某笔记'];
  const rise = smooth(clamp((e - 1.05) / 1.0));
  // 榜单底板
  g.save();
  g.globalAlpha = 0.55;
  g.fillStyle = 'rgba(8,16,24,0.72)';
  g.strokeStyle = 'rgba(150,190,220,0.16)'; g.lineWidth = 1;
  rrect(g, x0 - 40, top - 78, cardW + 80, (cardH + gap) * N * 0.9 + 100, 18);
  g.fill(); g.stroke();
  g.restore();
  cap(g, 'TOP FREE · UNITED STATES', W2, top - 46, { size: 11, ls: 3.4, color: 'rgba(200,220,240,0.55)' });
  g.save();
  for (let i = 0; i < N; i++) {
    const isWhale = i === N - 1;
    let idx = i;
    if (isWhale) idx = lerp(N - 1, 0, rise);
    else if (i < N - 1) idx = i + rise;
    const y = top + idx * (cardH + gap) * 0.92;
    const a = clamp(1 - Math.max(0, idx - (N - 0.7)) * 2.5);
    if (globalThis.__DBG) console.log('CARD', i, idx, y, a);
    if (a <= 0.01) continue;
    g.globalAlpha = a;
    g.fillStyle = isWhale ? 'rgba(38,62,80,0.96)' : 'rgba(22,36,50,0.94)';
    g.strokeStyle = isWhale ? 'rgba(255,207,138,0.95)' : 'rgba(160,190,215,0.35)';
    g.lineWidth = isWhale ? 2 : 1;
    g.shadowColor = isWhale ? 'rgba(255,190,110,0.6)' : 'rgba(0,0,0,0)';
    g.shadowBlur = isWhale ? 26 : 0;
    rrect(g, x0, y, cardW, cardH, 14); g.fill(); g.stroke();
    g.shadowBlur = 0;
    const iy = y + cardH / 2;
    g.fillStyle = isWhale ? 'rgba(14,28,44,0.95)' : 'rgba(66,82,98,0.95)';
    rrect(g, x0 + 16, iy - 30, 60, 60, 13); g.fill();
    if (isWhale) {
      whale(g, x0 + 46, iy, 56, t, { dir: 1, alpha: 1 });
    } else {
      g.fillStyle = 'rgba(150,165,180,0.55)';
      g.beginPath(); g.arc(x0 + 46, iy, 12, 0, 6.28); g.fill();
    }
    cn(g, isWhale ? 'DeepSeek' : names[i], x0 + 96, iy - 10, 22, {
      color: isWhale ? C.goldHi : 'rgba(225,232,240,0.72)', glow: isWhale ? 12 : 0, weight: 600, align: 'left',
    });
    tx(g, '免费 · 效率', x0 + 96, iy + 20, { size: 11, color: 'rgba(180,200,215,0.5)', align: 'left' });
    cn(g, String(Math.round(idx) + 1), x0 + cardW - 44, iy, 26, {
      color: isWhale ? C.goldHi : 'rgba(200,215,230,0.45)', glow: isWhale ? 18 : 0, weight: 700,
    });
    if (isWhale && rise > 0.92) {
      g.globalAlpha = (rise - 0.92) / 0.08;
      cn(g, '#1', x0 + cardW + 46, y + cardH * 0.30, 26, { color: C.goldHi, glow: 20, weight: 700, align: 'left' });
      cap(g, 'BEST FREE', x0 + cardW + 46, y + cardH * 0.30 + 28, { size: 8, ls: 2, align: 'left', color: 'rgba(255,207,138,0.65)' });
    }
  }
  g.restore();
}, { tint: 'rgba(60,90,120,0.25)' });

// 6. 同一天，英伟达跌掉 5890 亿美元（8–10）
S(8, 10, '同一天，{英伟达}跌掉 {5890 亿美元}。', (g, e, dur, t) => {
  const L = 110, R = W - 110, base = H * 0.30, bot = H * 0.76;
  // 坐标网格
  g.save(); g.globalAlpha = 0.55;
  g.strokeStyle = 'rgba(150,170,190,0.13)'; g.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = base + (bot - base) * i / 5;
    g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
    tx(g, String(150 - i * 6), L - 14, y, 12, { color: 'rgba(180,195,210,0.35)', align: 'right' });
  }
  g.restore();
  // 蜡烛图
  const r = mulberry(21);
  const N = 34;
  const cw = (R - L) / N * 0.52;
  let price = 0.92;
  for (let i = 0; i < N; i++) {
    const on = E(e, 0.10 + i * 0.045, 0.34);
    if (on <= 0) continue;
    const x = L + (i + 0.5) * (R - L) / N;
    const drop = i < 8 ? (r() - 0.5) * 0.05 : -(0.012 + r() * 0.035);
    const open = price;
    price = Math.max(0.08, price + drop + (r() - 0.5) * 0.03);
    const close = price;
    const hi = Math.max(open, close) + r() * 0.02;
    const lo = Math.min(open, close) - r() * 0.02;
    const Y = v => base + (1 - v) * (bot - base);
    const up = close >= open;
    const col = up ? 'rgba(120,190,160,0.85)' : 'rgba(230,90,70,0.9)';
    g.save(); g.globalAlpha = on;
    g.strokeStyle = col; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, Y(hi)); g.lineTo(x, Y(lo)); g.stroke();
    g.fillStyle = up ? 'rgba(70,130,110,0.55)' : 'rgba(190,60,45,0.85)';
    const y1 = Y(Math.max(open, close)), y2 = Y(Math.min(open, close));
    g.fillRect(x - cw / 2, y1, cw, Math.max(2, y2 - y1));
    g.restore();
  }
  // 红色断崖标注
  const a2 = smooth(clamp((e - 1.1) / 0.6));
  if (a2 > 0) {
    g.save(); g.globalAlpha = a2;
    const y = base + (bot - base) * 0.60;
    g.strokeStyle = 'rgba(255,120,95,0.75)'; g.lineWidth = 1.4;
    g.setLineDash([10, 7]);
    g.beginPath(); g.moveTo(L, y); g.lineTo(R, y); g.stroke();
    g.setLineDash([]);
    g.restore();
  }
  // 左上标题
  g.save(); g.globalAlpha = smooth(clamp((e - 0.2) / 0.5));
  cn(g, 'NVDA', L, H * 0.20, 34, { color: 'rgba(235,228,215,0.9)', glow: 10, weight: 600, align: 'left' });
  tx(g, 'NVIDIA · NASDAQ', L + 118, H * 0.20 + 2, 12, { color: 'rgba(190,200,215,0.45)', align: 'left' });
  g.restore();
  // 大数字
  const a3 = smooth(clamp((e - 0.8) / 0.6));
  g.save(); g.globalAlpha = a3;
  cn(g, '−5890 亿', W - 130, H * 0.235, 64, { color: C.redHi, glow: 34, weight: 700, align: 'right' });
  cap(g, 'MARKET CAP LOSS · 17%', W - 130, H * 0.235 + 48, { size: 10, ls: 2.8, align: 'right', color: 'rgba(255,130,105,0.6)' });
  g.restore();
}, { tint: 'rgba(90,20,16,0.35)' });

// 7. 华尔街一天蒸发近 1 万亿（10–12）
S(10, 12, '华尔街一天蒸发近 {1 万亿}。', (g, e, dur, t) => {
  const a = smooth(clamp((e - 0.25) / 0.8));
  g.save();
  g.globalAlpha = a;
  const sc = 1 + 0.05 * Math.sin(t * 1.1);
  g.translate(W2, H * 0.42); g.scale(sc, sc);
  text(g, '1 万亿', 0, 0, { size: 170, weight: 700, font: FONT_SERIF_CN, color: C.redHi, glow: 70, glowColor: '#ff6a4a' });
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  const r = mulberry(7);
  for (let i = 0; i < 60; i++) {
    const x = r() * W, sp = 120 + r() * 420, ph = r() * 6.28;
    const y = ((t * sp + ph * 200) % (H + 200)) - 100;
    g.globalAlpha = 0.10 + 0.25 * r();
    g.fillStyle = 'rgba(255,120,95,0.9)';
    g.fillRect(x, y, 1.2, 18 + r() * 40);
  }
  g.restore();
  cap(g, 'WALL STREET · 2025.01.27', W2, H * 0.62, { size: 11, ls: 3.4, color: 'rgba(255,150,120,0.5)' });
}, { tint: 'rgba(110,24,18,0.45)' });

// 8. 他们给这一天取了个名字（12–14）
S(12, 14, '他们给这一天取了个名字——', (g, e, dur, t) => {
  const r = mulberry(303);
  const cols = 5, rows = 3;
  const cw = 320, ch = 210, gx = 40, gy = 26;
  const ox = W2 - (cols * (cw + gx) - gx) / 2;
  const oy = H * 0.09;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * (cw + gx), y = oy + j * (ch + gy);
      const on = clamp((e - (i + j) * 0.10) / 0.35);
      if (on <= 0) continue;
      g.save();
      g.globalAlpha = 0.55 * on;
      g.translate(x + cw / 2, y + ch / 2);
      g.rotate((r() - 0.5) * 0.03);
      g.fillStyle = 'rgba(238,230,212,0.9)';
      g.fillRect(-cw / 2, -ch / 2, cw, ch);
      // 报头小红条
      g.fillStyle = 'rgba(150,35,25,0.85)';
      g.fillRect(-cw / 2 + 20, -ch / 2 + 16, 64, 12);
      g.fillStyle = 'rgba(30,26,24,0.85)';
      g.fillRect(-cw / 2 + 92, -ch / 2 + 16, cw * 0.45, 12);
      // 大标题
      cn(g, 'DEEPSEEK', 0, -ch / 2 + 60, 34, { color: 'rgba(30,22,18,0.88)', glow: 0, weight: 700, ls: 3 });
      // 正文虚线
      g.fillStyle = 'rgba(60,50,42,0.55)';
      for (let q = 0; q < 4; q++) g.fillRect(-cw / 2 + 20, -ch / 2 + 88 + q * 10, (cw - 40) * (0.62 + (q % 3) * 0.12), 4);
      // 图片块
      g.fillStyle = 'rgba(70,62,54,0.45)';
      g.fillRect(-cw / 2 + 20, -ch / 2 + 134, cw - 40, 56);
      g.restore();
    }
  }
  const sw = (e / dur) * W * 1.4 - W * 0.2;
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.10;
  const gg = g.createLinearGradient(sw - 200, 0, sw + 200, 0);
  gg.addColorStop(0, 'rgba(255,90,60,0)');
  gg.addColorStop(0.5, 'rgba(255,120,90,1)');
  gg.addColorStop(1, 'rgba(255,90,60,0)');
  g.fillStyle = gg; g.fillRect(sw - 200, 0, 400, H);
  g.restore();
}, { tint: 'rgba(80,30,24,0.3)' });

// 9. 「DeepSeek 时刻」（14–16）
S(14, 16, '——{「DeepSeek 时刻」}。', (g, e, dur, t) => {
  redWall(g, t, { a: 0.92 });
  const a = smooth(clamp((e - 0.15) / 0.7));
  g.save();
  g.globalAlpha = a;
  const sc = 1.0 + 0.03 * Math.sin(t * 0.9);
  g.translate(W2, H * 0.40); g.scale(sc, sc);
  text(g, 'DeepSeek', 0, -34, { size: 128, weight: 600, font: FONT_SERIF, color: '#fff3dc', glow: 46, glowColor: '#ffca8a' });
  text(g, '时刻', 0, 92, { size: 92, weight: 700, font: FONT_SERIF_CN, color: '#ffcf8a', glow: 40, glowColor: '#ff9a5c', ls: 22 });
  g.restore();
  g.save(); g.globalAlpha = a * 0.6;
  g.fillStyle = 'rgba(255,190,140,0.6)';
  g.fillRect(W2 - 360, H * 0.40 + 152, 720, 1.2);
  g.restore();
  cap(g, 'A MOMENT, THEY CALLED IT', W2, H * 0.40 + 180, { size: 10, ls: 3.6, color: 'rgba(255,180,140,0.45)' });
}, { tint: 'rgba(120,26,18,0.5)' });

// 10. 可写这封信的人，手里几乎没有牌（16–18）
S(16, 18, '可写这封信的人，手里{几乎没有牌}。', (g, e, dur, t) => {
  const base = H * 0.74;
  floorGrid(g, t, { y0: base, a: 0.16, cols: 20, rows: 9 });
  // 地面反光
  g.save(); g.globalCompositeOperation = 'lighter';
  const fg = g.createLinearGradient(0, base, 0, H);
  fg.addColorStop(0, 'rgba(90,140,180,0.10)');
  fg.addColorStop(1, 'rgba(90,140,180,0)');
  g.fillStyle = fg; g.fillRect(0, base, W, H - base);
  g.restore();
  const r = mulberry(55);
  // 三排机柜（等距，成行）
  for (let row = 0; row < 3; row++) {
    const z = 0.70 + row * 0.16;
    const w = 150 * z, h = 236 * z, gap = 24 * z;
    const n = 7;
    const totalW = n * w + (n - 1) * gap;
    const x0 = W2 - totalW / 2 + (row - 1) * 70;
    const y = base - h - (2 - row) * 56;
    for (let i = 0; i < n; i++) {
      const on = smooth(clamp((e - row * 0.15 - i * 0.04) / 0.5));
      if (on <= 0) continue;
      g.save(); g.globalAlpha = on;
      rack(g, x0 + i * (w + gap), y, w, h, { lit: (i % 4 === 0) ? 1 : 0, a: 0.95 });
      g.restore();
    }
  }
  // 顶灯
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    const x = W * (0.22 + i * 0.28);
    const gg = g.createRadialGradient(x, H * 0.16, 0, x, H * 0.16, 260);
    gg.addColorStop(0, 'rgba(150,200,235,0.10)');
    gg.addColorStop(1, 'rgba(150,200,235,0)');
    g.fillStyle = gg; g.fillRect(x - 260, 0, 520, H * 0.5);
  }
  g.restore();
  // 鲸鱼 + 信纸一角（都往边角挪，别打架）
  whale(g, W * 0.13, H * 0.86, 200, t, { dir: 1, alpha: 0.6 });
  g.save(); g.translate(W * 0.945, H * 0.815); g.rotate(0.32);
  g.globalAlpha = 0.5;
  g.shadowColor = 'rgba(255,210,150,0.3)'; g.shadowBlur = 26;
  g.fillStyle = C.paper; g.fillRect(-96, -68, 192, 156);
  g.restore();
  cap(g, 'A RENTED ROOM · HANGZHOU', W * 0.06, base + 52, { size: 10, ls: 3, align: 'left', color: 'rgba(180,200,215,0.4)' });
}, { tint: 'rgba(20,40,55,0.4)' });

// 11. 最好的模型在别人手里，方法是秘密（18–20）
S(18, 20, '最好的模型在别人手里，方法是{秘密}。', (g, e, dur, t) => {
  const items = ['GPT', 'Claude', 'Gemini'];
  for (let i = 0; i < 3; i++) {
    const x = W * (0.25 + i * 0.25);
    const y = H * 0.44 + Math.sin(t * 0.7 + i) * 8;
    const on = smooth(clamp((e - i * 0.18) / 0.5));
    // 玻璃罩
    g.save();
    g.globalAlpha = 0.7 * on;
    g.strokeStyle = 'rgba(200,220,235,0.28)'; g.lineWidth = 1.2;
    rrect(g, x - 115, y - 135, 230, 270, 8); g.stroke();
    // 罩上反光
    g.globalAlpha = 0.10 * on;
    g.fillStyle = 'rgba(160,200,230,1)';
    g.beginPath(); g.moveTo(x - 84, y + 96); g.lineTo(x + 30, y - 104); g.lineTo(x + 62, y - 104); g.lineTo(x - 52, y + 96); g.closePath(); g.fill();
    g.restore();
    // 黑箱
    g.save(); g.globalAlpha = on;
    g.fillStyle = 'rgba(8,10,14,0.95)';
    g.fillRect(x - 72, y - 72, 144, 144);
    g.strokeStyle = 'rgba(160,180,200,0.45)'; g.lineWidth = 1;
    g.strokeRect(x - 72, y - 72, 144, 144);
    g.restore();
    // 锁
    g.save(); g.globalAlpha = on * 0.8;
    g.strokeStyle = 'rgba(200,215,230,0.55)'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y - 6, 17, Math.PI, 0); g.stroke();
    g.fillStyle = 'rgba(200,215,230,0.55)'; g.fillRect(x - 20, y - 6, 40, 30);
    g.restore();
    cap(g, items[i] + ' · CLOSED', x, y + 108, { size: 9, ls: 2.4, color: 'rgba(180,200,215,0.45)' });
  }
}, { tint: 'rgba(40,50,70,0.4)' });

// 12. 我们能拿到的，只有 2048 张 H800（20–22）
S(20, 22, '我们能拿到的，只有 {2048 张 H800}。', (g, e, dur, t) => {
  if (!RACKS) buildRacks();
  floorGrid(g, t, { y0: H * 0.44, a: 0.13, cols: 20, rows: 7 });
  // 暗版整排先铺
  for (const R of RACKS) g.drawImage(R.cvD, R.x, R.y);
  // 按层点亮
  const total = RACKS.length * 8;
  const shown = Math.round(clamp((e - 0.22) / 1.5) * total);
  let idx = 0;
  for (const R of RACKS) {
    const n = clamp(shown - idx, 0, 8);
    if (n > 0) {
      const lh = R.h / 8;
      g.save();
      g.beginPath();
      g.rect(R.x, R.y + (8 - n) * lh, R.w, n * lh + 2);
      g.clip();
      g.drawImage(R.cvL, R.x, R.y);
      g.restore();
    }
    idx += 8;
  }
  haze(g, W2, H * 0.62, 640, '255,200,130', 0.05);
  const cnt = Math.min(2048, Math.round(clamp((e - 0.25) / 1.7) * 2048));
  g.save();
  cn(g, String(cnt).padStart(4, '0'), W2, H * 0.215, 86, { color: C.goldHi, glow: 40, weight: 600 });
  cap(g, 'H800 · TOTAL', W2, H * 0.215 + 62, { size: 11, ls: 3.2, color: 'rgba(255,207,138,0.6)' });
  g.restore();
}, { tint: 'rgba(50,40,25,0.3)' });

// 13. 不到对手的十分之一，而且一张比一张难买（22–24）
S(22, 24, '不到对手的十分之一。而且，{一张比一张难买}。', (g, e, dur, t) => {
  const cols = 10, rows = 6, cw = 46, chh = 20;
  const ox = W * 0.08, oy = H * 0.30;
  const r = mulberry(91);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const idx = j * cols + i;
      const x = ox + i * cw * 1.3, y = oy + j * chh * 1.85;
      const p = clamp((e - idx * 0.012) / 0.9);
      if (p <= 0) continue;
      const gone = p > 0.8 && r() > 0.5;
      chip(g, x, y, cw, chh, {
        a: gone ? 0.14 : 0.55, col: gone ? 'rgba(190,90,75,1)' : C.gold, gl: gone ? 2 : 6, lit: gone ? 0.25 : 1,
      });
    }
  }
  // 右侧对比条
  const bx = W * 0.60, bw = 420;
  const k1 = clamp(E(e, 0.2, 0.8)), k2 = clamp(E(e, 0.6, 0.9));
  g.save(); g.globalAlpha = 0.95;
  // 他们
  g.fillStyle = 'rgba(120,140,160,0.18)';
  g.fillRect(bx, H * 0.34, bw, 54);
  g.fillStyle = 'rgba(150,170,190,0.45)';
  g.fillRect(bx, H * 0.34, bw * k1, 54);
  g.fillStyle = 'rgba(220,232,245,0.9)';
  g.fillRect(bx + bw * k1 - 2, H * 0.34, 2, 54);
  cn(g, '他们 · 十万张卡', bx, H * 0.34 - 18, 20, { color: 'rgba(200,215,230,0.7)', glow: 6, align: 'left', weight: 500 });
  // 我们
  g.fillStyle = 'rgba(232,180,94,0.18)';
  g.fillRect(bx, H * 0.50, bw, 54);
  g.fillStyle = 'rgba(232,180,94,0.55)';
  g.fillRect(bx, H * 0.50, bw * 0.1 * k2, 54);
  cn(g, '我们 · 2048 张', bx, H * 0.50 - 18, 20, { color: 'rgba(255,207,138,0.85)', glow: 8, align: 'left', weight: 500 });
  g.restore();
  // 红色警示框 + 封条
  const a = smooth(clamp((e - 1.0) / 0.6));
  if (a > 0) {
    g.save(); g.globalAlpha = a * 0.6;
    g.strokeStyle = C.red; g.lineWidth = 2;
    g.setLineDash([12, 8]);
    g.strokeRect(W * 0.055, H * 0.25, W * 0.44, H * 0.50);
    g.setLineDash([]);
    g.restore();
    g.save();
    g.globalAlpha = a;
    g.translate(W * 0.24, H * 0.60); g.rotate(-0.07);
    g.fillStyle = 'rgba(150,30,22,0.75)';
    g.fillRect(-150, -24, 300, 48);
    cn(g, 'LIMITED · 禁运', 0, 0, 22, { color: 'rgba(255,200,190,0.92)', glow: 8, weight: 600, ls: 3 });
    g.restore();
  }
}, { tint: 'rgba(70,25,20,0.35)' });

// 14. 路，一年比一年窄（24–26）
S(24, 26, '路，{一年比一年窄}。', (g, e, dur, t) => {
  const squeeze = E(e, 0.1, 1.6);
  redWall(g, t, { a: 0.95, squeeze });
  // 窄缝里的光
  const gap = 250 - squeeze * 150;
  // 透视路面
  g.save();
  const rg3 = g.createLinearGradient(0, H * 0.55, 0, H);
  rg3.addColorStop(0, 'rgba(8,12,18,0.92)');
  rg3.addColorStop(1, 'rgba(3,6,10,0.80)');
  g.fillStyle = rg3;
  g.beginPath();
  g.moveTo(W2 - gap * 0.45, H * 0.56); g.lineTo(W2 + gap * 0.45, H * 0.56);
  g.lineTo(W2 + gap * 2.6, H); g.lineTo(W2 - gap * 2.6, H);
  g.closePath(); g.fill();
  // 路中间虚线
  g.strokeStyle = 'rgba(255,190,140,0.22)'; g.lineWidth = 2;
  for (let i = 0; i < 7; i++) {
    const p0 = i / 7, p1 = p0 + 0.06;
    const y0 = H * 0.56 + (H * 0.44) * p0 * p0, y1 = H * 0.56 + (H * 0.44) * p1 * p1;
    const w0 = gap * 0.06 * (1 + p0 * 3), w1 = gap * 0.06 * (1 + p1 * 3);
    g.beginPath(); g.moveTo(W2, y0); g.lineTo(W2, y1); g.lineWidth = w0; g.stroke();
  }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  const gg = g.createLinearGradient(W2 - gap, 0, W2 + gap, 0);
  gg.addColorStop(0, 'rgba(255,140,100,0.10)');
  gg.addColorStop(0.5, 'rgba(255,180,130,0.12)');
  gg.addColorStop(1, 'rgba(255,140,100,0.10)');
  g.fillStyle = gg; g.fillRect(W2 - gap, H * 0.10, gap * 2, H * 0.84);
  g.restore();
  whale(g, W2 + 40, H * 0.50, 190 * (1 - squeeze * 0.25), t, { dir: -1, alpha: 0.75, glow: 14, w: 2 });
  // 刻度：年份
  g.save(); g.globalAlpha = 0.5;
  const r = mulberry(12);
  for (let i = 0; i < 5; i++) {
    const y = H * 0.22 + i * 40;
    cap(g, '20' + (21 + i), 110, y, { size: 10, ls: 2.4, align: 'left', color: 'rgba(255,160,130,0.55)' });
    g.fillStyle = 'rgba(255,120,90,0.5)';
    g.fillRect(160, y, 40 - i * 7, 1.4);
  }
  g.restore();
}, { tint: 'rgba(120,26,18,0.55)' });

// 15. 于是他们决定：不教它怎么想（26–28）
S(26, 28, '于是他们决定：不教它{怎么想}。', (g, e, dur, t) => {
  redWall(g, t, { a: 0.55 });
  // 鲸鱼在墙前停下、转身
  const turn = smooth(clamp(e / 1.6));
  const dir = turn > 0.5 ? 1 : -1;
  const x = W2 + 60 - turn * 40;
  whale(g, x, H * 0.52, 330, t, { dir, alpha: 0.95, glow: 22, w: 2.8 });
  // 转身时的光弧
  if (turn < 0.9) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 * (1 - turn);
    const r = 200;
    const gg = g.createRadialGradient(x, H * 0.52, r * 0.6, x, H * 0.52, r);
    gg.addColorStop(0, 'rgba(120,200,240,0)');
    gg.addColorStop(0.8, 'rgba(120,200,240,0.5)');
    gg.addColorStop(1, 'rgba(120,200,240,0)');
    g.fillStyle = gg; g.beginPath(); g.arc(x, H * 0.52, r, 0, 6.28); g.fill();
    g.restore();
  }
  // 尾巴画出的问号/路径
  ln(g, [[W * 0.30, H * 0.72], [W * 0.42, H * 0.66], [W * 0.56, H * 0.70], [W * 0.64, H * 0.62]], { w: 1.6, color: C.blueHi, glow: 10, alpha: 0.5 * smooth(clamp((e - 0.6) / 0.8)) });
});

// 16. 只告诉它：这样答，对；那样答，错（28–30）
S(28, 30, '只告诉它：这样答，{对}；那样答，{错}。', (g, e, dur, t) => {
  const cards = [
    { x: W * 0.32, mark: '✓', label: '对', col: C.goldHi, base: C.gold },
    { x: W * 0.68, mark: '✗', label: '错', col: C.redHi, base: C.red },
  ];
  cards.forEach((c, i) => {
    const on = smooth(clamp((e - 0.15 - i * 0.35) / 0.6));
    if (on <= 0) return;
    g.save();
    g.globalAlpha = on * 0.85;
    g.fillStyle = 'rgba(10,16,24,0.9)';
    g.strokeStyle = c.base; g.lineWidth = 1.8;
    g.shadowColor = c.base; g.shadowBlur = 26;
    rrect(g, c.x - 150, H * 0.28, 300, 300, 16); g.fill(); g.stroke();
    g.shadowBlur = 0;
    g.globalAlpha = on;
    cn(g, c.mark, c.x, H * 0.44, 110, { color: c.col, glow: 30, weight: 600 });
    cn(g, c.label, c.x, H * 0.56, 46, { color: c.col, glow: 18, weight: 600, ls: 8 });
    g.restore();
  });
  // 中间：一道选择的线
  const k = smooth(clamp((e - 1.0) / 0.9));
  g.save(); g.globalAlpha = k * 0.4;
  ln(g, [[W2, H * 0.42], [W * 0.38, H * 0.42]], { w: 1.2, color: C.ivory, glow: 6 });
  ln(g, [[W2, H * 0.42], [W * 0.62, H * 0.42]], { w: 1.2, color: C.ivory, glow: 6 });
  g.restore();
  cap(g, 'REWARD · ONLY. NO DEMO.', W2, H * 0.70, { size: 10, ls: 3, color: 'rgba(220,210,190,0.45)' });
}, { tint: 'rgba(40,50,60,0.3)' });

// 17. 每道题让它自己答一组，比平均好的加分，差的扣分（30–32）
S(30, 32, '每道题让它自己答一组——比平均好的{加分}，差的{扣分}。', (g, e, dur, t) => {
  const base = H * 0.66;
  const n = 6;
  const bw = 62, gap = 40;
  const x0 = W2 - (n * bw + (n - 1) * gap) / 2;
  const scores = [0.86, 0.62, 0.38, 0.71, 0.24, 0.55];
  const avg = scores.reduce((a, b) => a + b, 0) / n;
  // 平均线
  g.save();
  g.strokeStyle = 'rgba(220,225,235,0.35)'; g.lineWidth = 1;
  g.setLineDash([8, 6]);
  const ay = base - avg * 300;
  g.beginPath(); g.moveTo(x0 - 40, ay); g.lineTo(x0 + n * (bw + gap) - gap + 40, ay); g.stroke();
  g.restore();
  cap(g, 'AVERAGE', x0 + n * (bw + gap) - gap + 40, ay - 16, { size: 9, ls: 2, align: 'right', color: 'rgba(220,225,235,0.45)' });
  for (let i = 0; i < n; i++) {
    const s = scores[i];
    const on = E(e, 0.1 + i * 0.08, 0.7);
    const h = s * 300 * on;
    const x = x0 + i * (bw + gap);
    const good = s > avg;
    g.save();
    g.globalAlpha = 0.9;
    g.fillStyle = good ? 'rgba(255,207,138,0.55)' : 'rgba(120,130,145,0.30)';
    g.fillRect(x, base - h, bw, h);
    g.strokeStyle = good ? C.goldHi : 'rgba(150,160,175,0.5)';
    g.lineWidth = 1.4;
    g.strokeRect(x, base - h, bw, h);
    g.restore();
    // 加减分标记
    if (e > 0.9 + i * 0.08) {
      g.save(); g.globalAlpha = smooth(clamp((e - 0.9 - i * 0.08) / 0.3));
      cn(g, good ? '+' : '−', x + bw / 2, base - h - 26, 26, { color: good ? C.goldHi : C.redHi, glow: 14, weight: 700 });
      g.restore();
    }
  }
  // 底座
  g.save(); g.fillStyle = 'rgba(180,195,210,0.25)'; g.fillRect(x0 - 40, base, n * (bw + gap) - gap + 80, 1.4); g.restore();
}, { tint: 'rgba(45,45,55,0.3)' });

// 18. 这叫 GRPO——省掉一个和自己一样大的裁判（32–34）
S(32, 34, '这叫 {GRPO}——省掉一个和自己一样大的{裁判}。', (g, e, dur, t) => {
  const k = smooth(clamp((e - 0.6) / 1.3));
  // 大模型方块
  const mx = W2 - 170, my = H * 0.42;
  g.save(); g.globalAlpha = 0.9;
  g.fillStyle = 'rgba(20,34,46,0.9)';
  g.strokeStyle = C.goldHi; g.lineWidth = 1.6; g.shadowColor = C.goldHi; g.shadowBlur = 18;
  rrect(g, mx - 110, my - 110, 220, 220, 12); g.fill(); g.stroke();
  g.shadowBlur = 0;
  cn(g, '策略', mx, my - 10, 34, { color: C.goldHi, glow: 16, weight: 600 });
  cap(g, 'ACTOR', mx, my + 40, { size: 9, ls: 2.4, color: 'rgba(255,207,138,0.55)' });
  g.restore();
  // 裁判方块：被虚线包住 → 缩小消失
  const rx = W2 + 210, ry = H * 0.42;
  const shrink = 1 - k;
  if (shrink > 0.02) {
    g.save();
    g.globalAlpha = 0.55 * shrink + 0.15;
    g.setLineDash([10, 8]);
    g.strokeStyle = 'rgba(200,120,100,0.8)'; g.lineWidth = 1.6;
    rrect(g, rx - 110, ry - 110, 220, 220, 12); g.stroke();
    g.setLineDash([]);
    g.globalAlpha = shrink;
    g.fillStyle = 'rgba(40,16,14,0.85)';
    g.strokeStyle = 'rgba(240,110,90,0.9)'; g.lineWidth = 1.6;
    const s = 110 * (0.4 + 0.6 * shrink);
    rrect(g, rx - s, ry - s, s * 2, s * 2, 12); g.fill(); g.stroke();
    cn(g, '裁判', rx, ry - 4, 30 * shrink + 10, { color: C.redHi, glow: 14, weight: 600, alpha: shrink });
    g.restore();
    if (k > 0.4) {
      g.save(); g.globalAlpha = smooth(clamp((k - 0.4) / 0.3));
      g.strokeStyle = C.redHi; g.lineWidth = 3;
      g.beginPath(); g.moveTo(rx - 120, ry - 120); g.lineTo(rx + 120, ry + 120); g.stroke();
      g.beginPath(); g.moveTo(rx + 120, ry - 120); g.lineTo(rx - 120, ry + 120); g.stroke();
      g.restore();
    }
  }
  // GRPO 字样
  g.save(); g.globalAlpha = smooth(clamp((e - 1.2) / 0.8));
  cn(g, 'GRPO', W2, H * 0.16, 64, { color: C.goldHi, glow: 30, weight: 600, ls: 6 });
  g.restore();
  // 省下的量
  if (e > 1.6) {
    g.save(); g.globalAlpha = smooth(clamp((e - 1.6) / 0.6));
    cn(g, '−1 个模型', W2 + 210, H * 0.62, 30, { color: 'rgba(240,120,100,0.9)', glow: 14, weight: 600 });
    g.restore();
  }
}, { tint: 'rgba(50,30,25,0.3)' });

// 19. 省下的每一张卡，都是活下去的命（34–36）
S(34, 36, '省下的每一张卡，都是{活下去的命}。', (g, e, dur, t) => {
  const x = W2, y = H * 0.44 + Math.sin(t * 0.9) * 6;
  const a = smooth(clamp(e / 0.9));
  // 黑暗中的一点光
  haze(g, x, y, 480, '255,190,120', 0.07 * a);
  // 一张卡，缓慢旋转（用倾斜模拟）
  g.save();
  g.translate(x, y);
  g.rotate(-0.10 + Math.sin(t * 0.6) * 0.03);
  g.scale(1.9, 1.9);
  chip(g, -50, -26, 100, 52, { a, col: C.goldHi, fill: 'rgba(40,34,20,0.92)', gl: 16, lit: 1 });
  g.restore();
  // 卡的倒影/光晕
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5 * a;
  const gg = g.createRadialGradient(x, y, 0, x, y, 240);
  gg.addColorStop(0, 'rgba(255,200,130,0.30)');
  gg.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = gg; g.beginPath(); g.arc(x, y, 240, 0, 6.28); g.fill();
  g.restore();
  // 周围的暗点：一张一张熄灭
  const r = mulberry(611);
  for (let i = 0; i < 30; i++) {
    const px = r() * W, py = H * 0.2 + r() * H * 0.6;
    const off = (i % 7) < 3 ? 1 : 0;
    dt(g, px, py, 1.0, { a: 0.10 + 0.12 * Math.abs(Math.sin(t * 0.7 + i)) * off, color: '160,170,185' });
  }
}, { tint: 'rgba(40,30,20,0.45)' });

// 20. 然后，奇怪的事发生了（36–38）
S(36, 38, '然后，{奇怪的事}发生了。', (g, e, dur, t) => {
  // 远处阵列中，鲸鱼的眼睛亮了
  const cy = H * 0.52;
  floorGrid(g, t, { y0: H * 0.60, a: 0.10, cols: 14, rows: 6 });
  const r = mulberry(77);
  for (let i = 0; i < 80; i++) {
    const x = r() * W, y = H * 0.50 + r() * H * 0.34;
    const on = 0.10 + 0.12 * Math.abs(Math.sin(t * 1.3 + i * 0.7));
    g.save(); g.globalAlpha = on;
    g.fillStyle = 'rgba(232,180,94,0.9)';
    g.fillRect(x, y, 3, 2);
    g.restore();
  }
  whale(g, W2 + 80, cy, 260, t, { dir: -1, alpha: 0.55, glow: 16, w: 2.2 });
  const k = smooth(clamp((e - 0.7) / 0.9));
  // 眼睛爆亮
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  const ex = W2 + 80 - 54 * 260 / 420, ey = cy + 8 * 260 / 420;
  const gg = g.createRadialGradient(ex, ey, 0, ex, ey, 200 * k + 10);
  gg.addColorStop(0, 'rgba(255,240,210,0.95)');
  gg.addColorStop(0.3, 'rgba(255,200,130,0.35)');
  gg.addColorStop(1, 'rgba(255,200,130,0)');
  g.fillStyle = gg; g.beginPath(); g.arc(ex, ey, 200 * k + 10, 0, 6.28); g.fill();
  g.restore();
  // 涟漪
  for (let i = 0; i < 3; i++) {
    const p = clamp((e - 0.9 - i * 0.35) / 1.0);
    if (p <= 0) continue;
    g.save(); g.globalAlpha = (1 - p) * 0.25;
    g.strokeStyle = 'rgba(255,210,150,0.8)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(W2, cy, 60 + p * 520, 0, 6.28); g.stroke();
    g.restore();
  }
}, { tint: 'rgba(30,35,45,0.35)' });

// 21. 没人教它写过程，它自己学会了（38–41）
S(38, 41, '没人教它写过程——它自己学会了：{算一步，验一步，错了就改}。', (g, e, dur, t) => {
  // 演算纸
  const pw = 980, ph = 620;
  paper(g, W2, H * 0.46, pw, ph, { a: 0.94, rot: -0.012, lines: true, n: 9 });
  // 一行行推导
  const lines = [
    '设 a = 3，b = 4，求 c',
    'c² = a² + b² = 9 + 16 = 25',
    'c = 5 ✓',
    '',
    '再验证：3² + 4² = 5²',
    '9 + 16 = 25 ✓',
    '错了就改：c = √25 = 5',
  ];
  const lh = 66;
  const x0 = W2 - pw / 2 + 70;
  const y0 = H * 0.46 - ph / 2 + 90;
  let n = 0;
  g.save();
  for (let i = 0; i < lines.length; i++) {
    const total = lines[i].length;
    const on = clamp((e - 0.4 - i * 0.30) / 0.30) * total;
    const showN = Math.min(total, Math.floor(on));
    if (showN <= 0) { continue; }
    const s = lines[i].slice(0, showN);
    // 手写感：稍微歪一点
    g.save();
    g.translate(x0, y0 + i * lh);
    g.rotate((i % 2 ? 1 : -1) * 0.004);
    cn(g, s, 0, 0, 34, { color: 'rgba(42,32,24,0.92)', glow: 0, weight: 500, align: 'left' });
    g.restore();
    // 对勾
    if (/✓/.test(s)) {
      g.save(); g.globalAlpha = smooth(clamp((e - 0.4 - i * 0.30 - 0.5) / 0.3));
      ln(g, [[x0 + pw - 130, y0 + i * lh - 2], [x0 + pw - 116, y0 + i * lh + 12], [x0 + pw - 84, y0 + i * lh - 24]], { w: 2.4, color: 'rgba(190,60,45,0.9)', glow: 6 });
      g.restore();
    }
    n++;
  }
  // 每行末尾的光标
  const cn2 = lines.filter((l, i) => e > 0.4 + i * 0.30).length - 1;
  if (cn2 >= 0) {
    const cy = y0 + cn2 * lh;
    const tw = measureMixed(lines[cn2], 30, 500);
    g.save(); g.globalAlpha = 0.55 + 0.45 * Math.sin(t * 8);
    g.fillStyle = 'rgba(40,30,22,0.8)';
    g.fillRect(x0 + tw + 6, cy - 16, 2, 32);
    g.restore();
  }
  g.restore();
  // 纸边光
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12;
  const gg = g.createLinearGradient(0, H * 0.46, 0, H * 0.46 + ph / 2);
  gg.addColorStop(0, 'rgba(255,220,170,0.5)');
  gg.addColorStop(1, 'rgba(255,220,170,0)');
  g.fillStyle = gg; g.fillRect(W2 - pw / 2, H * 0.46 + ph / 2 - 40, pw, 40);
  g.restore();
}, { tint: 'rgba(60,50,35,0.3)' });

// 22. 它甚至学会了停下来，说一声——（41–43）
S(41, 43, '它甚至学会了停下来，说一声——', (g, e, dur, t) => {
  paper(g, W2, H * 0.48, 900, 520, { a: 0.86, rot: 0.008, n: 8 });
  const x0 = W2 - 450 + 60, y0 = H * 0.48 - 260 + 80;
  const lines = ['c² = 9 + 16 = 25', 'c = 5', '但如果是 7、24 呢？', '…'];
  g.save();
  for (let i = 0; i < 3; i++) {
    cn(g, lines[i], x0, y0 + i * 62, 30, { color: 'rgba(42,32,24,0.88)', glow: 0, weight: 500, align: 'left' });
  }
  g.restore();
  // 光变暗，聚焦到光标
  g.save();
  const dim = smooth(clamp(e / 0.6));
  g.globalAlpha = 0.55 * dim;
  g.fillStyle = 'rgba(2,4,8,1)';
  g.fillRect(0, 0, W, H);
  g.restore();
  // 光标：停顿
  const cx = x0 + 40, cy = y0 + 3 * 62;
  g.save(); g.globalAlpha = 0.6 + 0.4 * Math.sin(t * 7);
  g.fillStyle = 'rgba(240,225,200,0.9)';
  g.fillRect(cx, cy - 18, 3, 36);
  g.restore();
  haze(g, W2, H * 0.48, 420, '255,210,150', 0.05);
}, { tint: 'rgba(30,28,25,0.3)' });

// 23. 「等等」（43–45）
S(43, 45, '{「等等」}', (g, e, dur, t) => {
  const a = smooth(clamp((e - 0.12) / 0.6));
  const sc = 0.94 + 0.10 * smooth(clamp(e / 1.2));
  // 背景压暗
  g.save(); g.globalAlpha = 0.55 * a;
  g.fillStyle = '#03060b'; g.fillRect(0, 0, W, H);
  g.restore();
  g.save();
  g.translate(W2, H * 0.44); g.scale(sc, sc);
  g.globalAlpha = a;
  big(g, '等等', 0, 0, 200, { color: '#ffe9c2', glow: 80, ls: 14 });
  g.restore();
  // 金线框
  if (a > 0.5) {
    g.save(); g.globalAlpha = (a - 0.5) * 1.2;
    g.strokeStyle = 'rgba(232,180,94,0.35)'; g.lineWidth = 1;
    g.strokeRect(W2 - 330, H * 0.44 - 150, 660, 300);
    g.restore();
  }
  for (let i = 0; i < 2; i++) {
    const p = clamp((e - 1.2 - i * 0.4) / 0.4);
    if (p <= 0) continue;
    g.save(); g.globalAlpha = smooth(p) * 0.8;
    g.fillStyle = C.goldHi;
    g.beginPath(); g.arc(W2 + 300 + i * 52, H * 0.44 + 70, 9, 0, 6.28); g.fill();
    g.restore();
  }
  haze(g, W2, H * 0.44, 560, '255,220,180', 0.06);
}, { tint: null });

// 24. AIME 2024：15.6% → 71.0%（45–47）
S(45, 47, '{AIME 2024} 正确率：{15.6%} → {71.0%}', (g, e, dur, t) => {
  const ox = 220, oy = H * 0.80, gw = W - 440, gh = H * 0.52;
  // 坐标轴
  ln(g, [[ox, oy], [ox + gw, oy]], { w: 1.6, color: 'rgba(200,215,230,0.55)', glow: 6 });
  ln(g, [[ox, oy], [ox, oy - gh]], { w: 1.6, color: 'rgba(200,215,230,0.55)', glow: 6 });
  for (let i = 0; i <= 5; i++) {
    const y = oy - gh * i / 5;
    g.save(); g.globalAlpha = 0.22;
    g.strokeStyle = 'rgba(200,215,230,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(ox, y); g.lineTo(ox + gw, y); g.stroke();
    g.restore();
  }
  for (let i = 0; i <= 4; i++) {
    cn(g, String(i * 25), ox - 26, oy - gh * i / 5, 16, { color: 'rgba(200,215,230,0.55)', glow: 0, align: 'right', weight: 500 });
  }
  // 曲线
  const pts = [];
  const n = 70;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const v = 0.156 + (0.710 - 0.156) * Math.pow(u, 1.5) + Math.sin(u * 9) * 0.012 * (1 - u);
    pts.push([ox + u * gw, oy - v * gh]);
  }
  const p = E(e, 0.2, 1.6);
  const shown = partial(pts, p);
  ln(g, shown, { w: 3.2, color: C.goldHi, glow: 26 });
  if (shown.length > 1) {
    const [ex, ey] = shown[shown.length - 1];
    dt(g, ex, ey, 4.5, { color: '255,230,180' });
    dt(g, ex, ey, 2.2, { color: '255,255,240' });
  }
  // 端点标注
  const a1 = smooth(clamp((e - 0.5) / 0.5));
  g.save(); g.globalAlpha = a1;
  cn(g, '15.6%', ox + 10, oy - 0.156 * gh + 26, 24, { color: 'rgba(230,220,200,0.85)', glow: 8, weight: 600, align: 'left' });
  g.restore();
  const a2 = smooth(clamp((e - 1.4) / 0.6));
  if (a2 > 0) {
    g.save(); g.globalAlpha = a2;
    cn(g, '71.0%', ox + gw - 10, oy - 0.710 * gh - 30, 40, { color: C.goldHi, glow: 26, weight: 700, align: 'right' });
    g.fillStyle = 'rgba(255,207,138,0.5)';
    g.fillRect(ox + gw - 240, oy - 0.710 * gh, 240, 1.2);
    g.restore();
  }
  cap(g, 'SELF-TAUGHT · NO HUMAN TRACES', ox, oy + 34, { size: 10, ls: 2.8, align: 'left', color: 'rgba(230,215,190,0.45)' });
}, { tint: 'rgba(50,45,30,0.3)' });

// 25. 它追平了当时最强的 o1（47–49）
S(47, 49, '它追平了当时最强的 {o1}。', (g, e, dur, t) => {
  const ox = 200, oy = H * 0.78, gw = W - 400, gh = H * 0.48;
  // o1 的水平线
  const o1v = 0.69;
  const yy = oy - o1v * gh;
  ln(g, [[ox, yy], [ox + gw, yy]], { w: 2, color: 'rgba(180,195,215,0.75)', glow: 12, dash: [10, 8] });
  cap(g, 'o1 · 69.0%', ox + gw, yy - 18, { size: 10, ls: 2.4, align: 'right', color: 'rgba(190,205,225,0.6)' });
  // 我们的曲线冲上来
  const pts = [];
  const n = 60;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const v = 0.156 + (0.710 - 0.156) * Math.pow(u, 1.5);
    pts.push([ox + u * gw, oy - v * gh]);
  }
  const p = E(e, 0.15, 1.4);
  ln(g, partial(pts, p), { w: 3.4, color: C.goldHi, glow: 26 });
  // 交叉点：火花
  const k = smooth(clamp((e - 1.1) / 0.5));
  if (k > 0) {
    const cx = ox + gw * 0.92, cy = oy - 0.71 * gh;
    haze(g, cx, cy, 200 * k, '255,220,170', 0.10 * k);
    dt(g, cx, cy, 4 * k + 1, { a: k });
  }
  // 鲸鱼小剪影在线上
  whale(g, ox + gw * 0.96, yy - 70, 130, t, { dir: 1, alpha: 0.6 * k, glow: 10, w: 1.8 });
}, { tint: 'rgba(45,45,55,0.35)' });

// 26. 但 o1 把思考藏了起来（49–51）
S(49, 51, '但 {o1} 把思考{藏了起来}。', (g, e, dur, t) => {
  // 一个黑箱，合上
  const cx = W2, cy = H * 0.44;
  const k = smooth(clamp(e / 1.1));
  const open = 1 - k; // 1 开 -> 0 关
  g.save();
  // 箱体
  g.fillStyle = 'rgba(10,12,18,0.96)';
  g.strokeStyle = 'rgba(150,165,185,0.5)'; g.lineWidth = 1.6;
  rrect(g, cx - 170, cy - 110, 340, 220, 10); g.fill(); g.stroke();
  // 里面：思考的光 (open 时溢出，然后被盖住)
  if (open > 0.02) {
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = open;
    const gg = g.createRadialGradient(cx, cy, 0, cx, cy, 260);
    gg.addColorStop(0, 'rgba(180,220,255,0.5)');
    gg.addColorStop(1, 'rgba(180,220,255,0)');
    g.fillStyle = gg; g.fillRect(cx - 300, cy - 300, 600, 600);
    g.restore();
  }
  // 盖子
  const lidY = cy - 110 - k * 0;
  g.save();
  g.fillStyle = 'rgba(14,18,26,0.98)';
  g.strokeStyle = 'rgba(170,185,205,0.6)';
  g.fillRect(cx - 180, cy - 160 + k * 50, 360, 56);
  g.strokeRect(cx - 180, cy - 160 + k * 50, 360, 56);
  g.restore();
  // 锁
  g.save(); g.globalAlpha = smooth(clamp((e - 0.9) / 0.5));
  g.strokeStyle = 'rgba(220,230,245,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy - 96, 15, Math.PI, 0); g.stroke();
  g.fillStyle = 'rgba(220,230,245,0.75)'; g.fillRect(cx - 19, cy - 96, 38, 28);
  g.restore();
  g.restore();
  cap(g, 'o1 · PROCESS LOCKED', W2, H * 0.72, { size: 10, ls: 3, color: 'rgba(180,195,215,0.5)' });
}, { tint: 'rgba(25,30,42,0.45)' });

// 27. 它没有（51–53）
S(51, 53, '它{没有}。', (g, e, dur, t) => {
  const cx = W2, cy = H * 0.44;
  const k = smooth(clamp((e - 0.2) / 1.3));
  // 箱盖被顶开，光倾泻
  g.save();
  g.fillStyle = 'rgba(10,12,18,0.9)';
  g.strokeStyle = 'rgba(150,165,185,0.4)'; g.lineWidth = 1.6;
  rrect(g, cx - 210, cy - 40, 420, 250, 8); g.fill(); g.stroke();
  // 铆钉
  g.fillStyle = 'rgba(190,205,225,0.45)';
  for (let i = 0; i < 8; i++) { g.beginPath(); g.arc(cx - 190 + i * 54, cy + 30, 3, 0, 6.28); g.fill(); }
  g.restore();
  // 盖子：抬起并倾斜
  g.save();
  g.translate(cx, cy - 90 - k * 120);
  g.rotate(-0.5 * k);
  g.fillStyle = 'rgba(16,20,28,0.95)';
  g.strokeStyle = 'rgba(200,215,235,0.55)';
  g.fillRect(-180, -30, 360, 54); g.strokeRect(-180, -30, 360, 54);
  g.restore();
  // 光
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  const gg = g.createRadialGradient(cx, cy, 0, cx, cy, 520);
  gg.addColorStop(0, 'rgba(255,240,210,0.75)');
  gg.addColorStop(0.35, 'rgba(255,205,140,0.25)');
  gg.addColorStop(1, 'rgba(255,205,140,0)');
  g.fillStyle = gg; g.fillRect(0, 0, W, H);
  g.restore();
  // 光柱向上
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = k;
  const lg = g.createLinearGradient(cx, cy, cx, 0);
  lg.addColorStop(0, 'rgba(255,225,175,0.30)');
  lg.addColorStop(1, 'rgba(255,225,175,0)');
  g.fillStyle = lg;
  g.beginPath(); g.moveTo(cx - 40, cy); g.lineTo(cx - 130, 0); g.lineTo(cx + 130, 0); g.lineTo(cx + 40, cy); g.closePath(); g.fill();
  g.restore();
  // 鲸鱼在旁边
  whale(g, W2 - 360, cy + 90, 200, t, { dir: 1, alpha: 0.45 * k, glow: 10, w: 2 });
}, { tint: 'rgba(60,50,35,0.35)' });

// 28. 权重、代码、论文，全部开源，MIT 协议（53–56）
S(53, 56, '权重、代码、论文，{全部开源}。{MIT 协议}，谁都能免费用。', (g, e, dur, t) => {
  const files = [
    { n: 'model.safetensors', s: '671B' }, { n: 'config.json', s: '1.2 KB' },
    { n: 'tokenizer.json', s: '9 MB' }, { n: 'train.py', s: '24 KB' },
    { n: 'grpo.py', s: '18 KB' }, { n: 'paper.pdf', s: '2.1 MB' },
    { n: 'LICENSE', s: 'MIT' }, { n: 'README.md', s: '12 KB' },
    { n: 'inference.py', s: '8 KB' }, { n: 'eval_math.py', s: '31 KB' },
  ];
  const r = mulberry(2025);
  for (let i = 0; i < files.length; i++) {
    const delay = i * 0.12;
    const p = clamp((e - delay) / 1.6);
    if (p <= 0) continue;
    const ang = -Math.PI * 0.95 + (i / files.length) * Math.PI * 1.9 + (r() - 0.5) * 0.5;
    const dist = p * (320 + r() * 330);
    const x = W2 + Math.cos(ang) * dist * 1.5 + Math.sin(t * 0.6 + i) * 8;
    const y = H * 0.44 + Math.sin(ang) * dist * 0.8 - p * 40 + Math.cos(t * 0.5 + i) * 6;
    const a = (1 - p * 0.35) * smooth(clamp(p / 0.25));
    g.save();
    g.globalAlpha = a * 0.9;
    g.translate(x, y);
    g.rotate((r() - 0.5) * 0.10);
    g.fillStyle = 'rgba(16,26,36,0.9)';
    g.strokeStyle = 'rgba(232,180,94,0.65)'; g.lineWidth = 1;
    g.shadowColor = 'rgba(255,200,130,0.5)'; g.shadowBlur = 10;
    rrect(g, -105, -32, 210, 64, 6); g.fill(); g.stroke();
    g.shadowBlur = 0;
    tx(g, files[i].n, 0, -6, { size: 13, color: 'rgba(255,225,185,0.92)', align: 'center' });
    tx(g, files[i].s, 0, 16, { size: 10, color: 'rgba(200,210,220,0.5)', align: 'center' });
    g.restore();
  }
  // MIT 印章
  const mk = smooth(clamp((e - 1.6) / 0.6));
  if (mk > 0) {
    g.save();
    g.translate(W2, H * 0.44); g.rotate(-0.12); g.globalAlpha = mk;
    g.strokeStyle = C.redHi; g.lineWidth = 4; g.shadowColor = C.redHi; g.shadowBlur = 20;
    rrect(g, -80, -80, 160, 160, 8); g.stroke();
    g.shadowBlur = 0;
    cn(g, 'MIT', 0, -12, 54, { color: C.redHi, glow: 20, weight: 700, ls: 4 });
    tx(g, 'OPEN', 0, 34, { size: 14, color: C.redHi, ls: 6 });
    g.restore();
  }
}, { tint: 'rgba(55,45,30,0.3)' });

// 29. 一周之后，它成了 140 个国家的第一名（56–58）
S(56, 58, '一周之后，它成了 {140 个国家}的第一名。', (g, e, dur, t) => {
  // 点阵地球
  const cx = W2, cy = H * 0.46, R = 300;
  const rot = t * 0.55;
  const conts = [
    [[30, 40], [60, 45], [90, 50], [120, 45], [135, 35], [140, 25], [120, 15], [105, 5], [95, 5], [80, 8], [70, 20], [60, 25], [45, 30]],
    [[0, 45], [15, 55], [30, 60], [40, 55], [35, 45], [20, 40]],
    [[-15, 35], [10, 35], [30, 30], [40, 10], [30, -10], [20, -33], [10, -35], [5, -10], [-10, 5], [-15, 20]],
    [[-100, 50], [-70, 45], [-60, 25], [-80, 20], [-100, 25], [-120, 35], [-125, 45]],
    [[-75, 0], [-50, 5], [-40, -20], [-60, -55], [-70, -40], [-75, -15]],
    [[115, -20], [150, -20], [150, -40], [120, -35]],
  ];
  const r = mulberry(99);
  const pts = [];
  const inPoly = (x, y, poly) => {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  };
  for (const poly of conts) {
    const xs = poly.map(q => q[0]), ys = poly.map(q => q[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    let got = 0, tries = 0;
    while (got < 130 && tries < 4000) {
      const x = minx + r() * (maxx - minx), y = miny + r() * (maxy - miny);
      tries++;
      if (inPoly(x, y, poly)) { pts.push([x, y]); got++; }
    }
  }
  // 球面投影
  const proj = (lon, lat) => {
    const la = lat * Math.PI / 180, lo = (lon + rot * 57) * Math.PI / 180;
    const x = Math.cos(la) * Math.sin(lo);
    const y = -Math.sin(la);
    const z = Math.cos(la) * Math.cos(lo);
    return [x, y, z];
  };
  // 经纬网
  g.save(); g.globalAlpha = 0.18;
  g.strokeStyle = 'rgba(140,190,220,0.8)'; g.lineWidth = 1;
  for (let i = -60; i <= 60; i += 30) {
    const p = [];
    for (let lo = -180; lo <= 180; lo += 6) {
      const [x, y, z] = proj(lo, i);
      if (z > 0) p.push([cx + x * R, cy + y * R]);
      else if (p.length) { if (p.length > 1) { g.beginPath(); p.forEach((q, i2) => i2 ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); } p.length = 0; }
    }
    if (p.length > 1) { g.beginPath(); p.forEach((q, i2) => i2 ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.stroke(); }
  }
  g.restore();
  // 球体
  g.save();
  const gg = g.createRadialGradient(cx - R * 0.3, cy - R * 0.35, R * 0.1, cx, cy, R);
  gg.addColorStop(0, 'rgba(60,120,160,0.30)');
  gg.addColorStop(1, 'rgba(6,14,24,0.55)');
  g.fillStyle = gg; g.beginPath(); g.arc(cx, cy, R, 0, 6.28); g.fill();
  g.strokeStyle = 'rgba(170,215,245,0.45)'; g.lineWidth = 1.5;
  g.globalCompositeOperation = 'lighter';
  g.beginPath(); g.arc(cx, cy, R, 0, 6.28); g.stroke();
  const gg2 = g.createRadialGradient(cx - R * 0.4, cy - R * 0.45, 0, cx - R * 0.4, cy - R * 0.45, R * 1.2);
  gg2.addColorStop(0, 'rgba(120,180,220,0.16)');
  gg2.addColorStop(1, 'rgba(120,180,220,0)');
  g.fillStyle = gg2; g.beginPath(); g.arc(cx, cy, R, 0, 6.28); g.fill();
  g.restore();
  // 大陆点
  const litK = smooth(clamp((e - 0.5) / 1.4));
  let shown = 0;
  for (const [lon, lat] of pts) {
    const [x, y, z] = proj(lon, lat);
    if (z <= 0.02) continue;
    shown++;
    const on = smooth(clamp((e - 0.3 - (shown % 40) * 0.02) / 0.4));
    if (on <= 0) continue;
    const px = cx + x * R, py = cy + y * R;
    const hot = (shown % 17 === 0) && litK > 0.5;
    g.save();
    g.globalAlpha = (hot ? 1 : 0.85) * on * (0.5 + 0.5 * z);
    g.fillStyle = hot ? 'rgba(255,225,165,1)' : 'rgba(175,215,240,0.95)';
    if (hot) { g.shadowColor = 'rgba(255,200,130,0.9)'; g.shadowBlur = 9; }
    g.beginPath(); g.arc(px, py, hot ? 2.6 : 1.8, 0, 6.28); g.fill();
    g.restore();
  }
  // #1
  const a = smooth(clamp((e - 1.4) / 0.6));
  if (a > 0) {
    g.save(); g.globalAlpha = a;
    cn(g, '#1', cx + R + 120, cy - 40, 96, { color: C.goldHi, glow: 40, weight: 700 });
    cap(g, 'APP STORE · 140 COUNTRIES', cx + R + 120, cy + 20, { size: 10, ls: 2.6, color: 'rgba(255,207,138,0.6)' });
    g.restore();
  }
}, { tint: 'rgba(35,50,70,0.4)' });

// 30. 这就是那封情书（58–60）
S(58, 60, '这就是那封情书。', (g, e, dur, t) => {
  paper(g, W2, H * 0.42, 720, 760, { a: 0.92, rot: -0.01, lines: true, n: 11 });
  const x0 = W2 - 360 + 60, y0 = H * 0.42 - 380 + 80;
  const lines = ['先别急着看结局。', '这封信，已经写了三年。', '没有人相信它能寄出去。', '但它会到。'];
  g.save();
  for (let i = 0; i < 4; i++) {
    const total = lines[i].length;
    const on = clamp((e - 0.35 - i * 0.42) / 0.32) * total;
    const showN = Math.min(total, Math.floor(on));
    if (showN <= 0) continue;
    g.save();
    g.translate(x0, y0 + i * 86);
    g.rotate((i % 2 ? 1 : -1) * 0.003);
    cn(g, lines[i].slice(0, showN), 0, 0, 34, { color: 'rgba(40,32,24,0.92)', glow: 0, weight: 500, align: 'left' });
    g.restore();
  }
  g.restore();
  // 落款
  const a = smooth(clamp((e - 1.5) / 0.7));
  if (a > 0) {
    g.save(); g.globalAlpha = a;
    cn(g, '深度求索', W2 + 150, H * 0.42 + 250, 36, { color: 'rgba(40,32,24,0.9)', glow: 0, weight: 600 });
    g.fillStyle = 'rgba(40,32,24,0.55)';
    g.fillRect(W2 + 60, H * 0.42 + 286, 190, 1.4);
    g.restore();
  }
}, { tint: 'rgba(70,60,40,0.25)' });

// 31. 不是写给华尔街的，是写给所有买不起 GPU 的人（60–62）
S(60, 62, '不是写给华尔街的——是写给所有{买不起 GPU}的人。', (g, e, dur, t) => {
  // 拉远：鲸鱼游向光，信纸漂浮
  const k = smooth(clamp(e / 2.0));
  const x = W * 0.30 + k * 120;
  const y = H * 0.50 + Math.sin(t * 0.6) * 10;
  haze(g, W * 0.62, H * 0.34, 500, '120,180,220', 0.06);
  whale(g, x, y, 300, t, { dir: 1, alpha: 0.7, glow: 18, w: 2.6 });
  // 漂浮的信纸（小）
  const r = mulberry(31);
  for (let i = 0; i < 5; i++) {
    const px = W * 0.55 + r() * 360 + Math.sin(t * 0.4 + i * 1.7) * 26;
    const py = H * 0.26 + r() * 300 + Math.cos(t * 0.33 + i) * 18;
    g.save();
    g.translate(px, py); g.rotate(r() * 0.6 - 0.3);
    g.globalAlpha = 0.35;
    g.fillStyle = C.paper;
    g.fillRect(-26, -34, 52, 68);
    g.restore();
  }
  meme(g, 'c', W * 0.86, H * 0.26, 210, { a: 0.9 * smooth(clamp((e - 0.9) / 0.9)), rot: 0.05, bob: 5, t });
  // 远处的光门
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5;
  const gg = g.createRadialGradient(W * 0.78, H * 0.40, 0, W * 0.78, H * 0.40, 300);
  gg.addColorStop(0, 'rgba(200,235,255,0.25)');
  gg.addColorStop(1, 'rgba(200,235,255,0)');
  g.fillStyle = gg; g.fillRect(W * 0.5, 0, W * 0.5, H);
  g.restore();
}, { tint: 'rgba(30,45,65,0.35)' });

// 32. 写给中国（62–63）
S(62, 63, '{写给中国}。', (g, e, dur, t) => {
  const a = smooth(clamp((e - 0.04) / 0.30));
  // 信纸合上
  const close = smooth(clamp(e / 1.0));
  g.save();
  g.globalAlpha = a;
  g.translate(W2, H * 0.44);
  // 信封/折起的纸
  const w = 620, h = 400;
  g.fillStyle = C.paper;
  g.shadowColor = 'rgba(255,215,160,0.35)'; g.shadowBlur = 60;
  g.fillRect(-w / 2, -h / 2 + close * 10, w, h);
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(120,95,62,0.5)'; g.lineWidth = 1.6;
  g.strokeRect(-w / 2, -h / 2 + close * 10, w, h);
  // 火的漆印
  const seal = smooth(clamp((e - 0.30) / 0.45));
  if (seal > 0) {
    g.save(); g.globalAlpha = a * seal;
    g.fillStyle = 'rgba(170,40,28,0.92)';
    g.beginPath(); g.arc(0, 10, 54, 0, 6.28); g.fill();
    g.strokeStyle = 'rgba(255,140,110,0.6)'; g.lineWidth = 2; g.stroke();
    cn(g, '深', 0, 8, 46, { color: 'rgba(255,225,200,0.92)', glow: 6, weight: 700 });
    g.restore();
  }
  g.restore();
  // 落款小字
  const a2 = smooth(clamp((e - 0.62) / 0.45));
  if (a2 > 0) {
    g.save(); g.globalAlpha = a2 * 0.85;
    cn(g, '深度求索 · 2025', W2, H * 0.755, 30, { color: C.goldPale, glow: 16, weight: 500, ls: 4 });
    g.restore();
  }
  // 最后的白
  const wh = smooth(clamp((e - 1.85) / 0.30));
  if (wh > 0) {
    g.save(); g.globalAlpha = wh * 0.9;
    g.fillStyle = '#f7f1e4'; g.fillRect(0, 0, W, H);
    g.restore();
  }
}, { tint: 'rgba(80,65,45,0.3)' });

// 片尾：黑场落字
S(63, 63.6, null, (g, e) => {
  g.fillStyle = '#f7f1e4'; g.fillRect(0, 0, W, H);
  const a = smooth(clamp(e / 0.5));
  g.save(); g.globalAlpha = a * 0.8;
  cn(g, '写给中国', W2, H * 0.46, 42, { color: 'rgba(40,32,24,0.85)', glow: 0, weight: 500, ls: 14 });
  g.restore();
});
