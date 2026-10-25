/* 航天简史 · 场景层
 * 每个 ART.<name>(g, e, dur, t, sc) 只画内容；网格/HUD/字幕/后期由 mv.js 统一叠加。
 */
'use strict';

function plateBg(g, key, o = {}) {
  plate(g, key, 0, 0, W, H, Object.assign({ frame: false, vig: 0.75, wash: 0.35 }, o));
}

function captionBar(g, x, y, en, zh, w) {
  const bw = Math.max(en ? en.length * 9.2 : 0, zh ? zh.length * 17 : 0) + 34;
  g.save();
  g.fillStyle = 'rgba(6,14,22,0.78)';
  g.fillRect(x, y, w || bw, zh ? 58 : 34);
  g.strokeStyle = 'rgba(230,245,252,0.30)'; g.lineWidth = 1;
  g.strokeRect(x + .5, y + .5, (w || bw) - 1, (zh ? 58 : 34) - 1);
  if (en) mono(g, en, x + 14, y + 19, { size: 13, ls: 2.1, color: 'rgba(240,250,255,0.9)' });
  if (zh) txt(g, zh, x + 14, y + 43, { size: 14, weight: 500, color: 'rgba(214,232,242,0.8)' });
  g.restore();
}

function labelTag(g, x, y, s, o = {}) {
  g.save();
  g.font = `600 ${o.size || 13}px ${FONT_MONO}`;
  const w = g.measureText(s).width + 22;
  g.fillStyle = o.fill || 'rgba(8,18,28,0.72)';
  g.fillRect(x, y, w, o.h || 26);
  g.strokeStyle = o.stroke || 'rgba(230,245,252,0.28)'; g.strokeRect(x + .5, y + .5, w - 1, (o.h || 26) - 1);
  mono(g, s, x + 11, y + (o.h || 26) / 2, { size: o.size || 13, ls: 1.8, color: o.color || 'rgba(236,248,253,0.9)' });
  g.restore();
}

function crosshair(g, x, y, r, o = {}) {
  g.save(); g.strokeStyle = o.color || 'rgba(240,250,255,0.55)'; g.lineWidth = 1.2;
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.stroke();
  g.beginPath(); g.moveTo(x - r * 1.6, y); g.lineTo(x + r * 1.6, y);
  g.moveTo(x, y - r * 1.6); g.lineTo(x, y + r * 1.6); g.stroke();
  g.restore();
}

function wave(g, x, y, w, h, t, o = {}) {
  g.save(); g.strokeStyle = o.color || 'rgba(180,225,240,0.55)'; g.lineWidth = o.w || 1.4;
  g.beginPath();
  const n = o.n || 160;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const amp = h * (0.18 + 0.82 * Math.abs(Math.sin(u * Math.PI * (o.pack || 3) + (o.phase || 0))));
    const yy = y + Math.sin(u * 30 + t * 6) * amp * (0.25 + 0.75 * Math.sin(t * 2 + u * 6));
    i ? g.lineTo(x + u * w, yy) : g.moveTo(x + u * w, yy);
  }
  g.stroke(); g.restore();
}

function rings(g, x, y, t, o = {}) {
  const n = o.n || 4, base = o.r || 80;
  g.save(); g.strokeStyle = o.color || 'rgba(170,220,238,0.35)'; g.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const p = ((t * (o.speed || 0.5) + i / n) % 1);
    g.globalAlpha = (1 - p) * (o.alpha || 0.55);
    g.beginPath(); g.arc(x, y, base + p * (o.spread || 380), 0, 6.2832); g.stroke();
  }
  g.restore();
}

function insetPhoto(g, key, x, y, w, h, capEn, capZh, o = {}) {
  plate(g, key, x, y, w, h, Object.assign({ bw: 0, wash: 0.3, vig: 0.25 }, o));
  if (capEn || capZh) captionBar(g, x + 2, y + h - (capZh ? 60 : 36), capEn, capZh, w - 4);
}

/* 图纸框：细边 + 四角标记 + 可选标题 */
function frameBox(g, x, y, w, h, label, o = {}) {
  g.save();
  g.strokeStyle = o.color || 'rgba(226,244,252,0.5)'; g.lineWidth = o.lw || 1;
  g.strokeRect(x + .5, y + .5, w - 1, h - 1);
  const c = o.corner || 16;
  g.lineWidth = 2; g.strokeStyle = o.cornerColor || 'rgba(240,250,255,0.85)';
  for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
    g.beginPath(); g.moveTo(px, py + c * sy); g.lineTo(px, py + 3 * sy); g.lineTo(px + c * sx, py + 3 * sy); g.stroke();
  }
  if (label) mono(g, label, x + 2, y - 14, { size: 11, ls: 2.2, color: 'rgba(206,230,244,0.55)' });
  g.restore();
}

/* 数据表：左标题 + 右数值（隔行淡底，不画穿字的点线） */
function dataRows(g, x, y, rows, o = {}) {
  const gap = o.gap || 27, w = o.w || 300;
  g.save();
  rows.forEach((r, i) => {
    const yy = y + i * gap;
    if (i % 2 === 0) { g.fillStyle = 'rgba(210,235,250,0.035)'; g.fillRect(x - 8, yy - 13, w + 16, 23); }
    mono(g, r[0], x, yy, { size: 11.5, ls: 1.6, color: 'rgba(196,224,240,0.55)' });
    mono(g, r[1], x + w, yy, { size: 12, ls: 1.6, align: 'right', color: r[2] || 'rgba(240,250,255,0.9)' });
  });
  g.restore();
}

/* 小行星：渐变球 + 条带 / 光环，比裁照片更稳 */
function planetDot(g, x, y, r, kind = 'rock') {
  const C = {
    jupiter: ['#f2d9ad', '#c8965f', '#4a3020'],
    saturn: ['#f6e7bb', '#d3b472', '#4d3c1e'],
    earth: ['#a8d6ee', '#3f7fa6', '#08192a'],
    mars: ['#e8a475', '#b0603a', '#38180d'],
    rock: ['#d6dee4', '#8e9aa4', '#1d262d'],
  }[kind] || ['#d6dee4', '#8e9aa4', '#1d262d'];
  g.save();
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.08, x, y, r * 1.02);
  gr.addColorStop(0, C[0]); gr.addColorStop(0.62, C[1]); gr.addColorStop(1, C[2]);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.clip();
  if (kind === 'jupiter' || kind === 'saturn') {
    for (let i = -2; i <= 2; i++) {
      g.fillStyle = `rgba(${kind === 'jupiter' ? '120,80,50' : '150,125,70'},${0.16 + Math.abs(i) * 0.02})`;
      g.beginPath(); g.ellipse(x, y + i * r * 0.34, r * 1.1, r * (0.10 + (i % 2 ? 0.03 : 0)), 0, 0, 6.2832); g.fill();
    }
  }
  g.restore();
  if (kind === 'saturn') {
    g.save(); g.translate(x, y); g.rotate(-0.35);
    g.strokeStyle = 'rgba(236,222,178,0.55)'; g.lineWidth = Math.max(1.4, r * 0.12);
    g.beginPath(); g.ellipse(0, 0, r * 1.75, r * 0.5, 0, 0, 6.2832); g.stroke();
    g.restore();
  }
}

/* 比例尺 */
function scaleBar(g, x, y, w, label, o = {}) {
  g.save();
  g.strokeStyle = o.color || 'rgba(226,244,252,0.6)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
  for (let i = 0; i <= 4; i++) {
    const xx = x + w * i / 4, hh = i % 2 ? 5 : 9;
    g.beginPath(); g.moveTo(xx, y - hh); g.lineTo(xx, y); g.stroke();
  }
  mono(g, label, x, y + 20, { size: 11, ls: 1.8, color: 'rgba(206,232,246,0.55)' });
  g.restore();
}

/* ================================================================ */
const ART = {};

ART.placeholder = (g, e, dur, t) => {
  bgBase(g, t);
  mono(g, 'SCENE NOT FOUND', W / 2, H / 2, { size: 16, ls: 3, align: 'center', color: C.dim });
};

/* 0 力量阶梯 */
ART.countdown = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.6 });
  const items = [
    { p: '10⁰', sub: 'HOLD DOWN', yr: '2026', key: 'art2_launch', note: 'ARTEMIS II · PAD 39B' },
    { p: '10²', sub: 'LIFT OFF', yr: '2015', key: 'falcon9', note: 'FALCON 9 · FIRST LANDING' },
    { p: '10⁷', sub: 'EARTH', yr: '1970', key: 'earth1974', note: 'ORBIT · 400 KM' },
  ];
  // 一次只显示一格：切换点落在音乐重音上（0 / 1.21 / 2.67）
  const starts = [0.0, 1.21, 2.67];
  let idx = 0;
  for (let i = 0; i < starts.length; i++) if (e >= starts[i]) idx = i;
  const it = items[idx];
  const since = e - starts[idx];
  const k = clamp(since / 0.10);
  const off = (1 - easeOut(k)) * 46;
  // 背景照片条（硬切，只画当前这一张）
  plate(g, it.key, W * 0.52, 0, W * 0.48, H, { bw: 0, wash: 0.55, vig: 0.4, frame: false });
  g.fillStyle = 'rgba(6,14,22,0.35)'; g.fillRect(W * 0.52, 0, W * 0.48, H);
  if (idx > 0 && since < 0.06) flash(g, (1 - since / 0.06) * 0.30);
  g.save(); g.globalAlpha = 0.55 + 0.45 * k;
  // 巨字
  txt(g, it.p, 96 + off, 480, { size: 300, weight: 900, font: FONT_EN, color: 'rgba(238,248,253,0.95)', ls: -12, glow: 30, glowColor: 'rgba(120,190,220,0.25)' });
  mono(g, it.sub, 108 + off, 620, { size: 22, ls: 8, color: 'rgba(228,244,252,0.7)' });
  mono(g, it.note, 108 + off, 700, { size: 13, ls: 3, color: 'rgba(190,218,232,0.45)' });
  txt(g, it.yr, 108 + off, 760, { size: 26, weight: 700, font: FONT_MONO, color: 'rgba(255,140,80,0.85)', ls: 3 });
  g.restore();
  mono(g, 'SCALE · 10⁰ → 10⁷', 108, 900, { size: 13, ls: 3, color: 'rgba(190,218,232,0.4)' });
};

/* 1 片名 */
ART.title = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.4, cx: 0.5, cy: 0.4 });
  const p = smooth(e / 1.2);
  g.save(); g.globalAlpha = 0.42 * p;
  plate(g, 'art2_launch', W * 0.2, 0, W * 0.6, H, { bw: 1, wash: 0.2, vig: 0.5, frame: false });
  g.restore();
  // 火箭线稿
  g.save(); g.globalAlpha = 0.55;
  rocketSaturn(g, W * 0.5, H * 0.78, 1.05, { line: 'rgba(220,242,252,0.55)' });
  g.restore();
  // 人形与标注
  g.save(); g.strokeStyle = 'rgba(230,246,253,0.5)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(W * 0.66, H * 0.72); g.lineTo(W * 0.72, H * 0.72); g.stroke();
  mono(g, 'ONE PERSON · 1.8 m', W * 0.66, H * 0.70, { size: 13, ls: 2, color: 'rgba(220,238,248,0.55)' });
  g.restore();
  g.save(); g.globalAlpha = p;
  txt(g, '航天简史', W / 2, H * 0.43, { size: 214, weight: 900, color: 'rgba(246,252,255,0.97)', ls: 12, glow: 26, glowColor: 'rgba(140,200,225,0.35)', align: 'center' });
  caps(g, 'A SHORT HISTORY OF AEROSPACE', W / 2, H * 0.58, { size: 20, ls: 10, color: 'rgba(214,236,246,0.7)', align: 'center' });
  mono(g, 'SHEET 01 · 1944 → 2026', W / 2, H * 0.64, { size: 13, ls: 3, color: 'rgba(190,218,232,0.45)', align: 'center' });
  g.restore();
};

/* 2 喷水 */
ART.deluge = (g, e, dur, t) => {
  plateBg(g, 'art2_launch', { bw: 0, wash: 0.3, vig: 0.55, zoom: 1.04 + e * 0.008, panY: 0.12 });
  g.fillStyle = 'rgba(8,18,28,0.28)'; g.fillRect(0, 0, W, H);
  insetPhoto(g, 'art2_launch2', W - 400, 130, 320, 400, 'SLS · CORE STAGE', '竖起来的芯级', { bw: 0 });
  const r = mulberry(31);
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 9; i++) {
    const x = W * (0.1 + r() * 0.8), y = H * (0.25 + r() * 0.5);
    const rad = 160 + r() * 260;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(232,242,248,0.16)'); gr.addColorStop(1, 'rgba(232,242,248,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
  }
  g.restore();
  callout(g, 700, 250, 1180, 470, '点火前先喷水，压住超压和声浪', 'DELUGE · OVERPRESSURE + SOUND SUPPRESSION');
  captionBar(g, 60, H - 120, 'ARTEMIS II · DELUGE TEST · 2026', 'NASA FOOTAGE · PAD 39B');
  labelTag(g, 60, 120, '2026 · 04 · 01');
};

/* 3 点火 */
ART.ignition = (g, e, dur, t) => {
  plateBg(g, 'art1_ignition', { bw: 0, wash: 0.25, vig: 0.7, zoom: 1.02 + e * 0.01 });
  flash(g, clamp(1 - e / 0.35) * 0.9);
  g.save(); g.globalAlpha = 0.9;
  txt(g, 'IGNITION', 96, 500, { size: 132, weight: 900, font: FONT_EN, color: 'rgba(246,252,255,0.9)', ls: 6, glow: 30, glowColor: 'rgba(255,140,70,0.4)' });
  g.restore();
  mono(g, 'T-00:00:06.2 · CORE STAGE', 100, 580, { size: 14, ls: 3, color: 'rgba(255,180,130,0.8)' });
  captionBar(g, 60, H - 120, 'ARTEMIS I · LAUNCH · 2022-11-16', 'NASA FOOTAGE · KSC 39B');
};

/* 4 上升 */
ART.ascent = (g, e, dur, t) => {
  plateBg(g, 'art1_ascent', { bw: 0, wash: 0.3, vig: 0.65, zoom: 1.15 + e * 0.02, panY: -0.3 });
  g.save(); g.globalAlpha = 0.35;
  for (let i = 0; i < 3; i++) {
    g.strokeStyle = 'rgba(220,240,250,0.35)'; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(W * 0.5 + Math.sin(t * 0.7 + i) * 20, H * 1.1);
    g.quadraticCurveTo(W * 0.5 + 60 + i * 20, H * 0.5, W * 0.42 + i * 30, -100);
    g.stroke();
  }
  g.restore();
  txt(g, 'LIFTOFF', W * 0.66, H * 0.36, { size: 108, weight: 400, font: FONT_SERIF, italic: 1, color: 'rgba(240,248,252,0.9)', ls: 2, align: 'center' });
  mono(g, 'ALT 0.0 → 61.0 KM', W * 0.66, H * 0.43, { size: 14, ls: 3, color: 'rgba(210,234,244,0.6)' });
  captionBar(g, 60, H - 120, 'ARTEMIS I · ASCENT · 2022-11-16', 'NASA FOOTAGE');
};

/* 5 三枚火箭 */
ART.montage3 = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.35 });
  const items = [
    { key: 'saturn5', y: '1969', n: 'SATURN V', zh: '土星五号' },
    { key: 'art2_launch', y: '2026', n: 'SLS BLOCK 1', zh: '太空发射系统' },
    { key: 'falcon9', y: '2015', n: 'FALCON 9', zh: '猎鹰九号' },
  ];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.10) / 0.45);
    if (k <= 0) return;
    const x = 70 + i * 610, y = 160 - (1 - easeOut(k)) * 40, w = 560, h = 700;
    g.save(); g.globalAlpha = smooth(k);
    plate(g, it.key, x, y, w, h, { bw: 0, wash: 0.35, vig: 0.45, frame: false });
    g.strokeStyle = 'rgba(228,244,252,0.5)'; g.lineWidth = 1.5; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    g.fillStyle = 'rgba(6,14,22,0.55)'; g.fillRect(x, y + h - 88, w, 88);
    txt(g, it.y, x + 18, y + h - 54, { size: 40, weight: 900, font: FONT_EN, color: 'rgba(244,251,255,0.95)', ls: -1 });
    mono(g, it.n, x + 18, y + h - 22, { size: 12, ls: 2.4, color: 'rgba(200,226,240,0.6)' });
    txt(g, it.zh, x + w - 18, y + h - 30, { size: 15, weight: 500, align: 'right', color: 'rgba(214,234,244,0.6)' });
    g.restore();
  });
  mono(g, 'EVERY ROCKET IS PUSHED OFF THE GROUND FIRST', W / 2, H - 90, { size: 13, ls: 3, align: 'center', color: 'rgba(196,222,236,0.42)' });
};

/* 6 V-2 */
ART.v2 = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.25 });
  // 地球弧
  g.save();
  g.fillStyle = 'rgba(14,40,58,0.55)';
  g.beginPath(); g.arc(W * 0.32, H * 1.65, H * 1.12, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(212,238,248,0.65)'; g.lineWidth = 2;
  g.beginPath(); g.arc(W * 0.32, H * 1.65, H * 1.12, 0, 6.2832); g.stroke();
  g.restore();
  // 100 km 虚线
  const y100 = H * 0.36;
  g.save(); g.strokeStyle = 'rgba(232,246,252,0.5)'; g.lineWidth = 1.4; g.setLineDash([9, 9]);
  g.beginPath(); g.moveTo(0, y100); g.lineTo(W, y100); g.stroke(); g.setLineDash([]);
  g.restore();
  mono(g, '100 km · BOUNDARY BY CONVENTION', W * 0.5, y100 - 16, { size: 14, ls: 2.2, color: 'rgba(226,242,250,0.7)' });
  // 火箭与尾焰
  g.save(); g.translate(W * 0.35, H * 0.52 + Math.sin(t * 1.1) * 3);
  const fl = g.createLinearGradient(0, 70, 0, 420);
  fl.addColorStop(0, 'rgba(255,244,220,0.95)'); fl.addColorStop(0.25, 'rgba(255,170,90,0.75)');
  fl.addColorStop(1, 'rgba(255,120,50,0)');
  g.fillStyle = fl;
  g.beginPath(); g.moveTo(-7, 70); g.lineTo(7, 70); g.lineTo(24, 430); g.lineTo(-24, 430); g.closePath(); g.fill();
  rocketV2(g, 0, 0, 0.95);
  g.restore();
  txt(g, 'LIFTOFF', W * 0.74, H * 0.44, { size: 92, weight: 400, font: FONT_SERIF, italic: 1, color: 'rgba(240,248,252,0.88)', ls: 2, align: 'center' });
  txt(g, '1944', 70, 162, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'V-2 · A4 · PEENEMÜNDE', 74, 226, { size: 14, ls: 2.6, color: 'rgba(200,226,240,0.55)' });
  insetPhoto(g, 'v2', W - 480, 130, 400, 280, 'V-2 · CAPTURED TEST FILM', '缴获的德军试射胶片', { bw: 1 });
  callout(g, W * 0.46, H * 0.70, W * 0.35, H * 0.78, '一枚火箭，第一次摸到太空的边', 'FIRST TOUCH OF SPACE');
};

/* 7 武器 */
ART.weapon = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.15 });
  // 底：缴获试射的胶片
  g.save(); g.globalAlpha = 0.92;
  plate(g, 'v2', W * 0.46, 0, W * 0.54, H, { bw: 1, wash: 0.4, vig: 0.55, frame: false, zoom: 1.02 + e * 0.004, panX: 0.25 });
  g.restore();
  let fade = g.createLinearGradient(W * 0.46, 0, W * 0.74, 0);
  fade.addColorStop(0, 'rgba(6,14,22,0.97)'); fade.addColorStop(1, 'rgba(6,14,22,0)');
  g.fillStyle = fade; g.fillRect(W * 0.46, 0, W * 0.28, H);
  fade = g.createLinearGradient(0, H * 0.6, 0, H);
  fade.addColorStop(0, 'rgba(4,10,17,0)'); fade.addColorStop(1, 'rgba(4,10,17,0.92)');
  g.fillStyle = fade; g.fillRect(0, H * 0.6, W, H * 0.4);

  // 剖视图
  g.save(); g.globalAlpha = 0.94; rocketV2(g, W * 0.205, H * 0.6, 1.45, { red: true }); g.restore();
  // 尺寸线
  const dx = W * 0.205 + 104, y0 = H * 0.6 - 292, y1 = H * 0.6 + 112;
  g.save(); g.strokeStyle = 'rgba(226,244,252,0.3)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(dx, y0); g.lineTo(dx, y1); g.stroke();
  for (const yy of [y0, y1]) { g.beginPath(); g.moveTo(dx - 8, yy); g.lineTo(dx + 8, yy); g.stroke(); }
  g.restore();
  mono(g, '14.0 M', dx + 14, (y0 + y1) / 2, { size: 11, ls: 2, color: 'rgba(206,232,246,0.5)' });

  callout(g, W * 0.28, H * 0.12, W * 0.205 + 10, H * 0.6 - 252, '一千公斤炸药，两吨半的弹体', 'AMATOL WARHEAD · 1,000 KG');

  txt(g, 'WEAPON', 58, H * 0.34, { size: 112, weight: 900, font: FONT_EN, ls: 12, color: 'rgba(222,238,248,0.12)' });
  mono(g, 'A-4 / V-2 · 1944', 66, 150, { size: 12, ls: 2.6, color: 'rgba(255,140,90,0.8)' });
  dataRows(g, 66, 200, [
    ['LENGTH', '14.0 M'],
    ['MASS', '12,500 KG'],
    ['WARHEAD', '1,000 KG'],
    ['RANGE', '320 KM'],
    ['IMPACT', '5,760 KM/H'],
  ], { w: 230, gap: 30 });
  mono(g, 'MADE TO FALL · NOT TO FLY', 66, H - 152, { size: 12, ls: 3, color: 'rgba(255,150,95,0.6)' });
  captionBar(g, 60, H - 112, 'V-2 · WEAPON · 1944', '一件武器，造来是要落下');
};

/* 8 斯普特尼克 */
ART.sputnik = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.3 });
  txt(g, '1957', 66, 160, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'SPUTNIK 1 · 83.6 KG · 1957-10-04', 70, 226, { size: 14, ls: 2.4, color: 'rgba(200,226,240,0.55)' });
  // 大球
  sputnik(g, W * 0.62, H * 0.52, 210);
  for (let i = 0; i < 3; i++) orbitPath(g, W * 0.62, H * 0.52, 330 + i * 90, 120 + i * 28, -0.28 + i * 0.12, { color: 'rgba(190,224,240,0.22)', dash: [7, 8] });
  const a = t * 0.55;
  dotGlow(g, W * 0.62 + Math.cos(a) * 420, H * 0.52 + Math.sin(a) * 140, 4, '200,230,255', 0.9);
  insetPhoto(g, 'sputnik', 100, 330, 500, 360, 'SPUTNIK 1 · REPLICA', '斯普特尼克一号 · 复制品', { bw: 0 });
  mono(g, 'BEEP · 20.005 / 40.002 MHz', 100, 740, { size: 14, ls: 2.2, color: 'rgba(210,234,244,0.55)' });
  callout(g, W * 0.66, H * 0.30, W * 0.78, H * 0.22, '一个闪亮的小球，被推入轨道', 'ONE SPHERE, PUSHED INTO ORBIT');
};

/* 9 BEEP */
ART.beep = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.25 });
  globe(g, W * 0.6, H * 0.52, 300, { lon0: 40 + t * 4, land: 'rgba(190,225,240,0.55)' });
  rings(g, W * 0.6, H * 0.52, t, { r: 320, spread: 420, speed: 0.35, color: 'rgba(180,222,240,0.25)', n: 3 });
  txt(g, 'BEEP', 90, 300, { size: 220, weight: 900, font: FONT_EN, ls: 6, color: 'rgba(232,242,248,0.28)' });
  insetPhoto(g, 'sputnik', 70, 420, 430, 320, 'RADIO OPERATORS · 1957', '世界各地收听斯普特尼克的「哔哔」声', { bw: 1 });
  wave(g, 540, 880, 600, 52, t, { color: 'rgba(255,150,90,0.65)', pack: 3 });
  mono(g, 'BEEP · BEEP · BEEP', 540, 830, { size: 14, ls: 3.4, color: 'rgba(236,248,253,0.7)' });
  callout(g, 740, 220, 980, 330, '全世界都听见了', 'THE WHOLE WORLD HEARD THE CALL');
};

/* 10 莱卡 */
ART.laika = (g, e, dur, t) => {
  plateBg(g, 'laika', { bw: 1, wash: 0.25, vig: 0.7, zoom: 1.04 + e * 0.004 });
  filmGate(g, 0, 0, W, H, t, 3);
  txt(g, '1957', 66, 160, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'LAIKA · SPUTNIK 2 · 1957.11.03', 70, 228, { size: 14, ls: 2.2, color: 'rgba(210,232,244,0.7)' });
  txt(g, '莱卡，斯普特尼克 2 号', 70, 262, { size: 16, weight: 500, color: 'rgba(216,234,244,0.65)' });
  captionBar(g, 60, H - 120, 'FOOTAGE · LAIKA', '一只小狗，独自上去');
};

/* 11 莱卡轨道 */
ART.laikaOrbit = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  globe(g, W * 0.64, H * 0.52, 290, { lon0: 160 + t * 9, land: 'rgba(190,225,240,0.5)' });
  orbitPath(g, W * 0.64, H * 0.52, 420, 170, -0.22, { color: 'rgba(220,240,250,0.45)', dash: [4, 8] });
  const a = t * 0.9;
  const ox = W * 0.64 + Math.cos(a) * 420 * Math.cos(-0.22) - Math.sin(a) * 170 * Math.sin(-0.22);
  const oy = H * 0.52 + Math.cos(a) * 420 * Math.sin(-0.22) + Math.sin(a) * 170 * Math.cos(-0.22);
  dotGlow(g, ox, oy, 5, '255,200,150', 1);
  // 小照片
  g.save();
  g.beginPath(); g.arc(260, 420, 150, 0, 6.2832); g.clip();
  plate(g, 'laika', 110, 270, 300, 300, { bw: 1, wash: 0.2, vig: 0.2 });
  g.restore();
  g.strokeStyle = 'rgba(228,244,252,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.arc(260, 420, 150, 0, 6.2832); g.stroke();
  mono(g, 'ONE DOG · 5,000 KM ALT', 110, 610, { size: 12, ls: 2.2, color: 'rgba(200,226,240,0.5)' });
  mono(g, 'ORBIT 2,570 · 1957', 110, 890, { size: 14, ls: 2.6, color: 'rgba(216,238,248,0.55)' });
};

/* 12 1961 倒计时 */
ART.count1961 = (g, e, dur, t) => {
  g.fillStyle = '#050a10'; g.fillRect(0, 0, W, H);
  plate(g, 'gagarin', 0, 0, W * 0.48, H, { bw: 1, wash: 0.35, vig: 0.5, frame: false, zoom: 1.02 + e * 0.004 });
  g.fillStyle = 'rgba(5,10,16,0.55)'; g.fillRect(0, 0, W * 0.48, H);
  const n = 3 - Math.min(2, Math.floor((e - 0.4) / 1.38));
  txt(g, String(n), W * 0.76, H * 0.5, { size: 420, weight: 900, font: FONT_EN, color: 'rgba(240,248,252,0.92)', align: 'center', ls: -10, glow: 30, glowColor: 'rgba(255,120,70,0.25)' });
  txt(g, '1961', W * 0.58, 170, { size: 100, weight: 900, font: FONT_EN, ls: -3, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'VOSTOK 1 · 1961-04-12', W * 0.58, 244, { size: 14, ls: 2.4, color: 'rgba(204,228,242,0.6)' });
  mono(g, 'THREE · TWO · ONE', W * 0.76, H * 0.78, { size: 14, ls: 4, align: 'center', color: 'rgba(210,234,244,0.55)' });
};

/* 13 加加林出发 */
ART.gagarinLaunch = (g, e, dur, t) => {
  plateBg(g, 'gagarin', { bw: 1, wash: 0.3, vig: 0.65, zoom: 1.1 + e * 0.01 });
  filmGate(g, 0, 0, W, H, t, 5);
  txt(g, 'ПОЕХАЛИ!', 100, 520, { size: 150, weight: 900, font: FONT_EN, color: 'rgba(246,252,255,0.94)', ls: 2, glow: 24, glowColor: 'rgba(255,150,90,0.3)' });
  txt(g, 'P O Y E K H A L I', 104, 600, { size: 15, weight: 500, font: FONT_MONO, color: 'rgba(255,160,100,0.85)', ls: 8 });
  mono(g, '1961-04-12 · 06:07 UTC', 104, 650, { size: 14, ls: 2.4, color: 'rgba(210,232,244,0.6)' });
  captionBar(g, 60, H - 120, 'VOSTOK 1 · LAUNCH · 1961', '人类第一次进入太空');
};

/* 14 加加林肖像 */
ART.gagarin = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.15 });
  plate(g, 'gagarin', W * 0.52, 0, W * 0.48, H, { bw: 1, wash: 0.3, vig: 0.55, frame: false, zoom: 1.02 });
  g.fillStyle = 'rgba(6,12,19,0.25)'; g.fillRect(W * 0.52, 0, W * 0.48, H);
  txt(g, '1961', 66, 152, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'YURI GAGARIN · 108 MIN · ONE ORBIT', 70, 248, { size: 14, ls: 2.2, color: 'rgba(204,228,242,0.6)' });
  txt(g, '「出发吧」', 70, 420, { size: 62, weight: 800, color: 'rgba(240,248,252,0.95)', ls: 2 });
  mono(g, 'ONE MAN SAID “LET’S GO”', 74, 480, { size: 14, ls: 3, color: 'rgba(255,150,95,0.85)' });
  g.save(); g.strokeStyle = 'rgba(255,122,51,0.8)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(70, 452); g.lineTo(70 + 190, 452); g.stroke(); g.restore();
  mono(g, 'VOSTOK 1 · 4.73 t · 1961', 70, 860, { size: 13, ls: 2.4, color: 'rgba(200,226,240,0.42)' });
};

/* 15 108 分钟 */
ART.orbit108 = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.3 });
  globe(g, W * 0.66, H * 0.5, 270, { lon0: 20 + t * 14, land: 'rgba(196,228,242,0.6)' });
  orbitPath(g, W * 0.66, H * 0.5, 410, 190, -0.18, { color: 'rgba(226,244,252,0.5)' });
  const a = t * 1.1;
  dotGlow(g, W * 0.66 + Math.cos(a) * 410, H * 0.5 + Math.sin(a) * 190, 5, '255,190,140', 1);
  txt(g, '108', 100, 430, { size: 230, weight: 900, font: FONT_EN, ls: -8, color: 'rgba(242,250,255,0.95)' });
  txt(g, 'MIN', 100, 540, { size: 60, weight: 800, font: FONT_EN, ls: 8, color: 'rgba(255,150,95,0.9)' });
  mono(g, 'ONE ORBIT · 1961-04-12', 104, 600, { size: 14, ls: 2.6, color: 'rgba(210,234,244,0.55)' });
  captionBar(g, 100, 660, 'VOSTOK 1 · 108 MINUTES · 1 ORBIT', '一圈，一百零八分钟');
  insetPhoto(g, 'earth1974', W - 380, H - 380, 300, 220, 'SKYLAB · 1974', '', { bw: 0 });
};

/* 16 地出 */
ART.earthrise = (g, e, dur, t) => {
  bgSpace(g, t, { n: 240, glow: 0.25 });
  g.save();
  const k = smooth(e / 1.2);
  g.globalAlpha = 0.3 + 0.7 * k;
  plate(g, 'earthrise', W * 0.5 - 330 * (0.8 + 0.2 * k), H * 0.5 - 330 * (0.8 + 0.2 * k), 660 * (0.8 + 0.2 * k) * 2, 660 * (0.8 + 0.2 * k) * 2, { bw: 0, wash: 0.2, vig: 0.5, frame: false });
  g.restore();
  txt(g, '1968', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'EARTHRISE · APOLLO 8 · 1968.12.24', 70, 240, { size: 14, ls: 2.2, color: 'rgba(206,230,244,0.7)' });
  txt(g, '地出，阿波罗 8 号实拍照片', 70, 272, { size: 16, weight: 500, color: 'rgba(214,234,244,0.6)' });
  g.save(); g.strokeStyle = 'rgba(226,244,252,0.4)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(W * 0.64, H * 0.32); g.lineTo(W * 0.76, H * 0.22); g.stroke(); g.restore();
  mono(g, 'ONE PHOTO · 1968', W * 0.76, H * 0.205, { size: 12, ls: 2.2, color: 'rgba(226,242,250,0.6)' });
  captionBar(g, 60, H - 120, 'PHOTO · NASA · AS08-14-2383', '从月亮那边，地球升起来');
};

/* 17 脚印 */
ART.boot = (g, e, dur, t) => {
  plateBg(g, 'a11_eva', { bw: 1, wash: 0.2, vig: 0.6, zoom: 1.05 + e * 0.005 });
  g.fillStyle = 'rgba(5,10,16,0.25)'; g.fillRect(0, 0, W, H);
  plate(g, 'a11_boot', W - 440, H - 400, 380, 300, { bw: 1, wash: 0.2, vig: 0.3 });
  crosshair(g, W - 250, H - 250, 36, { color: 'rgba(255,150,95,0.7)' });
  txt(g, '1969', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'APOLLO 11 · 1969-07-20 · SEA OF TRANQUILITY', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.65)' });
  captionBar(g, 60, H - 120, 'PHOTO · NASA · AS11-40-5878', '一小步，尘土里一个脚印');
};

/* 18 任务控制 */
ART.mcc = (g, e, dur, t) => {
  plateBg(g, 'mcc1969', { bw: 1, wash: 0.3, vig: 0.55, zoom: 1.03 + e * 0.004 });
  filmGate(g, 0, 0, W, H, t, 9);
  txt(g, '1969', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'MISSION CONTROL · HOUSTON · 1969', 70, 242, { size: 14, ls: 2.2, color: 'rgba(210,232,244,0.7)' });
  callout(g, W * 0.62, H * 0.36, W * 0.78, H * 0.26, '下面有很多双手，每一双都是我们', 'BELOW · MANY HANDS');
  captionBar(g, 60, H - 120, 'NASA · MCC · APOLLO 11', '控制室里的一万双手');
};

/* 19 阿波罗 11 四格 */
ART.a11grid = (g, e, dur, t) => {
  plateBg(g, 'a11_launch', { bw: 1, wash: 0.22, vig: 0.55, zoom: 1.05 + e * 0.006, panY: -0.1 });
  filmGate(g, 0, 0, W, H, t, 7);
  g.fillStyle = 'rgba(5,10,16,0.15)'; g.fillRect(0, 0, W, H);
  const items = [
    { key: 'a11_aldrin', n: 'BUZZ ALDRIN', z: 'AS11-40-5903' },
    { key: 'a11_flag', n: 'THE FLAG', z: '1969-07-20' },
  ];
  items.forEach((it, i) => {
    const k = clamp((e - 0.3 - i * 0.3) / 0.4);
    if (k <= 0) return;
    const x = W - 470, y = 120 + i * 380, w = 400, h = 330;
    g.save(); g.globalAlpha = smooth(k);
    plate(g, it.key, x, y, w, h, { bw: 1, wash: 0.25, vig: 0.35 });
    mono(g, it.n, x, y + h + 26, { size: 12, ls: 2.2, color: 'rgba(240,250,255,0.75)' });
    mono(g, it.z, x + w, y + h + 26, { size: 11, ls: 1.6, align: 'right', color: 'rgba(210,232,244,0.45)' });
    g.restore();
  });
  txt(g, '1969', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'APOLLO 11 · SATURN V LAUNCH · 1969-07-16', 70, 242, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
};

/* 20 东方红一号 */
ART.dfh = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  txt(g, '1970', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'DONGFANGHONG-1 · 173 KG · 1970-04-24', 70, 240, { size: 14, ls: 2.2, color: 'rgba(206,230,244,0.65)' });
  // 卫星线稿
  g.save(); g.translate(W * 0.62, H * 0.45);
  g.strokeStyle = 'rgba(226,244,252,0.8)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-90, -90); g.lineTo(90, -90); g.lineTo(90, 90); g.lineTo(-90, 90); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(190,215,230,0.10)'; g.fill();
  for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    g.beginPath(); g.moveTo(90 * sx, 90 * sy); g.lineTo(200 * sx, 150 * sy); g.stroke();
  }
  g.beginPath(); g.arc(0, 0, 26, 0, 6.2832); g.stroke();
  g.restore();
  for (let i = 0; i < 3; i++) orbitPath(g, W * 0.62, H * 0.45, 300 + i * 60, 110 + i * 20, -0.3 + i * 0.1, { color: 'rgba(190,224,240,0.2)' });
  insetPhoto(g, 'dfh1', 90, 360, 480, 380, 'DONGFANGHONG-1 · MODEL', '东方红一号 · 备份星', { bw: 0 });
  callout(g, W * 0.46, H * 0.62, W * 0.58, H * 0.70, '中国第一颗人造卫星', 'CHINA’S FIRST SATELLITE');
};

/* 21 东方红电波 */
ART.radio = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.35 });
  g.save();
  g.beginPath(); g.arc(W * 0.62, H * 0.5, 260, 0, 6.2832); g.clip();
  plate(g, 'dfh1', W * 0.62 - 300, H * 0.5 - 300, 600, 600, { bw: 0, wash: 0.3, vig: 0.3 });
  g.restore();
  g.strokeStyle = 'rgba(228,244,252,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.arc(W * 0.62, H * 0.5, 260, 0, 6.2832); g.stroke();
  rings(g, W * 0.62, H * 0.5, t, { r: 270, spread: 480, speed: 0.45, color: 'rgba(255,150,90,0.35)', n: 4 });
  txt(g, '《东方红》', 100, 430, { size: 96, weight: 900, color: 'rgba(244,251,255,0.95)', ls: 3 });
  mono(g, 'THE EAST IS RED · 20.009 MHz', 104, 500, { size: 14, ls: 2.6, color: 'rgba(255,150,95,0.85)' });
  wave(g, 100, 760, 560, 80, t, { color: 'rgba(255,160,100,0.55)', pack: 2, phase: 1 });
  mono(g, 'A SONG MADE OF LIGHT', 104, 880, { size: 12, ls: 3.2, color: 'rgba(200,226,240,0.42)' });
};

/* 22 旅行者出发 */
ART.voyager = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.25 });
  plate(g, 'voyager_model', 60, 100, 700, 520, { bw: 0, wash: 0.3, vig: 0.4 });
  txt(g, '1977', 66, 172, { size: 0, weight: 900, font: FONT_EN, color: 'transparent' });
  txt(g, '1977', 66, 760, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'VOYAGER 1 · 1977-09-05 · TITAN IIIE-CENTAUR', 70, 800, { size: 13, ls: 2.0, color: 'rgba(206,230,244,0.6)' });
  // 轨迹
  const cx = W * 0.72, cy = H * 0.55;
  dotGlow(g, cx, cy, 12, '255,200,120', 1);
  orbitPath(g, cx, cy, 190, 80, -0.15, { color: 'rgba(210,234,246,0.35)' });
  orbitPath(g, cx, cy, 300, 130, -0.15, { color: 'rgba(210,234,246,0.25)' });
  orbitPath(g, cx, cy, 420, 175, -0.15, { color: 'rgba(210,234,246,0.18)' });
  const a = 0.8 + t * 0.12;
  dotGlow(g, cx + Math.cos(a) * 300, cy + Math.sin(a) * 130, 4, '255,200,150', 0.9);
  mono(g, 'JUPITER', cx + 300, cy + 150, { size: 11, ls: 2, color: 'rgba(200,226,240,0.5)' });
  mono(g, 'SATURN', cx + 430, cy + 40, { size: 11, ls: 2, color: 'rgba(200,226,240,0.5)' });
  callout(g, W * 0.66, H * 0.24, W * 0.76, H * 0.3, '两艘飞船，先后出发', 'TWO SHIPS SET OUT');
};

/* 23 金唱片 */
ART.record = (g, e, dur, t) => {
  g.fillStyle = '#070605'; g.fillRect(0, 0, W, H);
  plate(g, 'record_gold', W * 0.15, 0, W * 0.7, H, { bw: 0, wash: 0.15, vig: 0.55, frame: false, zoom: 1.03 });
  g.fillStyle = 'rgba(4,8,12,0.45)'; g.fillRect(0, 0, W, H);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5;
  const gr = g.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.5);
  gr.addColorStop(0, 'rgba(240,200,120,0.16)'); gr.addColorStop(1, 'rgba(240,200,120,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  recordDisc(g, W * 0.5, H * 0.48, 300, t * 0.25, { cover: true });
  txt(g, 'GOLDEN RECORD', W * 0.5, H * 0.14, { size: 34, weight: 700, font: FONT_EN, ls: 8, align: 'center', color: 'rgba(236,222,190,0.85)' });
  mono(g, 'THE SOUNDS OF EARTH · 1977', W * 0.5, H * 0.19, { size: 13, ls: 3.4, align: 'center', color: 'rgba(220,200,160,0.55)' });
  mono(g, '90 MIN · 55 LANGUAGES · 1,000 YEARS', W * 0.5, H * 0.86, { size: 13, ls: 2.4, align: 'center', color: 'rgba(216,198,160,0.5)' });
};

/* 24 问候 */
ART.greeting = (g, e, dur, t) => {
  bgSpace(g, t, { n: 200, glow: 0.2 });
  recordDisc(g, W * 0.5, H * 0.5, 290, t * 0.18, { cover: true });
  txt(g, 'HELLO', W * 0.5, H * 0.22, { size: 96, weight: 900, font: FONT_EN, ls: 20, align: 'center', color: 'rgba(246,232,200,0.9)' });
  mono(g, 'FROM THE CHILDREN OF PLANET EARTH', W * 0.5, H * 0.75, { size: 14, ls: 4, align: 'center', color: 'rgba(226,206,170,0.7)' });
  mono(g, '55 LANGUAGES · 90 MINUTES', W * 0.5, H * 0.80, { size: 12, ls: 2.6, align: 'center', color: 'rgba(210,192,158,0.45)' });
};

/* 25 流水 */
ART.guqin = (g, e, dur, t) => {
  g.fillStyle = '#07080a'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.7);
  gr.addColorStop(0, 'rgba(64,48,34,0.55)'); gr.addColorStop(1, 'rgba(4,6,9,0.9)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 琴弦
  for (let i = 0; i < 7; i++) {
    const y = H * 0.28 + i * 34;
    const vib = Math.sin(t * 9 + i * 1.7) * (i === 2 ? 5 : 2);
    g.strokeStyle = `rgba(236,222,196,${0.55 - i * 0.05})`; g.lineWidth = 2.2 - i * 0.15;
    g.beginPath();
    for (let x = 140; x < W - 140; x += 12) {
      g.lineTo(x, y + Math.sin(x * 0.02 + t * 7 + i) * vib * Math.exp(-Math.abs(x - W * 0.5) / 500));
    }
    g.stroke();
  }
  // 泛音光点
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const r = mulberry(i + 4);
    const x = W * 0.2 + r() * W * 0.6, y = H * 0.2 + r() * H * 0.5;
    g.globalAlpha = 0.15 + 0.25 * Math.abs(Math.sin(t * 1.4 + i));
    g.drawImage(TEX.glow, x - 16, y - 16, 32, 32);
  }
  g.restore();
  txt(g, '流水', 150, 760, { size: 88, weight: 800, color: 'rgba(240,230,210,0.92)', ls: 16 });
  mono(g, 'GUQIN · FLOWING WATER · 7 STRINGS', 156, 826, { size: 13, ls: 3, color: 'rgba(226,206,178,0.55)' });
  captionBar(g, W - 520, H - 120, 'GUQIN · 7 STRINGS · CHINA', '中国古琴曲《流水》，1977 年刻入金唱片');
};

/* 26 刻录唱片 */
ART.recordMaking = (g, e, dur, t) => {
  plateBg(g, 'record_prep', { bw: 0, wash: 0.3, vig: 0.55, zoom: 1.03 + e * 0.004 });
  filmGate(g, 0, 0, W, H, t, 12);
  txt(g, '1977', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'MAKING THE RECORD · 1977 · PHOTO', 70, 240, { size: 14, ls: 2.2, color: 'rgba(210,232,244,0.7)' });
  txt(g, '1977 年，做好的两张唱片', 70, 272, { size: 16, weight: 500, color: 'rgba(214,234,244,0.65)' });
  recordDisc(g, W - 300, H * 0.42, 150, t * 0.3);
  mono(g, '3', W - 330, H * 0.36, { size: 46, weight: 800, color: 'rgba(255,150,95,0.9)' });
  mono(g, 'COUNT 2 · MASTER', W - 330, H * 0.42 + 180, { size: 11, ls: 2, color: 'rgba(210,232,244,0.45)' });
};

/* 27 旅行者升空 */
ART.voyagerAscent = (g, e, dur, t) => {
  bgSpace(g, t, { n: 240, glow: 0.22 });
  // 发射弧
  const k = clamp(e / 1.6);
  g.save(); g.strokeStyle = 'rgba(255,160,100,0.5)'; g.lineWidth = 2; g.setLineDash([9, 8]);
  g.beginPath(); g.moveTo(W * 0.05, H * 0.98);
  g.bezierCurveTo(W * 0.08, H * 0.6, W * 0.28, H * 0.38, W * 0.44, H * 0.3);
  g.stroke(); g.setLineDash([]); g.restore();
  dotGlow(g, W * 0.05 + (W * 0.39) * k, H * 0.98 - (H * 0.68) * k, 5, '255,190,130', 1);
  mono(g, '1977-08-20 · TITAN IIIE', 70, H * 0.9, { size: 11, ls: 2.2, color: 'rgba(255,170,110,0.6)' });

  // 飞船
  g.save(); g.globalAlpha = smooth(clamp(e / 0.5));
  plate(g, 'voyager_model', W * 0.46, H * 0.13, W * 0.45, H * 0.6, { bw: 0, wash: 0.16, vig: 0.32, frame: false, zoom: 1.02 + e * 0.004 });
  g.restore();
  frameBox(g, W * 0.46, H * 0.13, W * 0.45, H * 0.6, 'VOYAGER · PROOF TEST MODEL · JPL 1977');
  // 金唱片
  g.save(); g.globalAlpha = smooth(clamp((e - 0.45) / 0.6));
  plate(g, 'record_gold', W * 0.78, H * 0.78, 150, 150, { bw: 0, wash: 0.2, vig: 0.3 });
  g.restore();
  frameBox(g, W * 0.78, H * 0.78, 150, 150, '');
  mono(g, 'GOLDEN RECORD · 12 INCH', W * 0.78, H * 0.78 - 16, { size: 10.5, ls: 1.8, color: 'rgba(226,206,170,0.6)' });

  // 年份与数据
  txt(g, '1977', 64, 236, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'TWO SHIPS · TITAN IIIE-CENTAUR', 70, 296, { size: 13, ls: 2.1, color: 'rgba(206,230,244,0.62)' });
  dataRows(g, 70, 352, [
    ['LAUNCH 1', '1977-08-20'],
    ['LAUNCH 2', '1977-09-05'],
    ['MASS', '825 KG'],
    ['POWER', '470 W'],
  ], { w: 330, gap: 30 });
  mono(g, 'CAPE CANAVERAL · PAD 41', 70, H - 150, { size: 11.5, ls: 2.4, color: 'rgba(206,230,244,0.42)' });
  captionBar(g, 60, H - 112, 'LAUNCH · CAPE CANAVERAL · 1977', '两艘飞船，先后出发');
};

/* 28 轨迹 */
ART.trajectory = (g, e, dur, t) => {
  bgSpace(g, t, { n: 320, glow: 0.16 });
  const cx = W * 0.2, cy = H * 0.56;
  dotGlow(g, cx, cy, 20, '255,200,120', 1);
  mono(g, 'SUN', cx, cy + 52, { size: 11, ls: 2, align: 'center', color: 'rgba(255,200,140,0.7)' });
  const planets = [
    { r: 160, n: 'JUPITER', a: 0.42, kind: 'jupiter', s: 30, d: '1979' },
    { r: 270, n: 'SATURN', a: -0.12, kind: 'saturn', s: 26, d: '1981' },
    { r: 390, n: 'URANUS', a: -0.95, s: 9, d: '1986' },
    { r: 500, n: 'NEPTUNE', a: -1.5, s: 9, d: '1989' },
  ];
  planets.forEach(p => {
    orbitPath(g, cx, cy, p.r, p.r * 0.42, 0, { color: 'rgba(200,226,240,0.13)' });
    const x = cx + Math.cos(p.a) * p.r, y = cy + Math.sin(p.a) * p.r * 0.42;
    if (p.kind) planetDot(g, x, y, p.s / 2, p.kind);
    else {
      g.fillStyle = 'rgba(200,226,240,0.75)';
      g.beginPath(); g.arc(x, y, 4, 0, 6.2832); g.fill();
    }
    mono(g, p.n, x, y + p.s / 2 + 18, { size: 10, ls: 1.6, align: 'center', color: 'rgba(206,230,244,0.55)' });
    mono(g, p.d, x, y + p.s / 2 + 34, { size: 10, ls: 1.6, align: 'center', color: 'rgba(255,170,110,0.55)' });
  });
  // 旅行者 1 号
  g.save(); g.strokeStyle = 'rgba(255,150,95,0.8)'; g.lineWidth = 2; g.setLineDash([8, 6]);
  g.beginPath(); g.moveTo(cx, cy);
  g.bezierCurveTo(cx + 260, cy - 150, cx + 560, cy - 250, cx + 980, cy - 330);
  g.stroke(); g.setLineDash([]); g.restore();
  const p = clamp((e - 0.2) / 2.0);
  const bx = cx + 980 * p, by = cy - 330 * p * p;
  dotGlow(g, bx, by, 5, '255,190,130', 1);
  mono(g, 'VOYAGER 1', bx + 16, by - 8, { size: 12, ls: 2, color: 'rgba(255,170,110,0.9)' });
  // 旅行者 2 号
  g.save(); g.strokeStyle = 'rgba(160,210,235,0.6)'; g.lineWidth = 1.6; g.setLineDash([5, 7]);
  g.beginPath(); g.moveTo(cx, cy);
  g.bezierCurveTo(cx + 200, cy + 10, cx + 420, cy + 160, cx + 700, cy + 300);
  g.stroke(); g.setLineDash([]); g.restore();
  const p2 = clamp((e - 0.4) / 2.0);
  dotGlow(g, cx + 700 * p2, cy + 300 * p2, 4, '160,215,240', 0.9);
  mono(g, 'VOYAGER 2', cx + 700 * p2 + 14, cy + 300 * p2 + 20, { size: 11, ls: 2, color: 'rgba(160,215,240,0.7)' });
  mono(g, 'GRAVITY ASSIST · 1977 → INTERSTELLAR SPACE', 70, H - 110, { size: 12, ls: 2.6, color: 'rgba(206,230,244,0.45)' });
  scaleBar(g, 70, H - 170, 260, '1 AU ≈ 150,000,000 KM');
};

/* 29 唱片特写 */
ART.recordClose = (g, e, dur, t) => {
  g.fillStyle = '#070503'; g.fillRect(0, 0, W, H);
  // 真实封面蚀刻（右）
  const sw = W * 0.34, sx = W * 0.55, sy = H * 0.09;
  g.save(); g.globalAlpha = smooth(clamp(e / 0.6));
  plate(g, 'record_gold', sx, sy, sw, sw, { bw: 0, wash: 0, vig: 0.22, frame: false, zoom: 1.02 + e * 0.004 });
  frameBox(g, sx, sy, sw, sw, 'COVER ETCHING · PULSAR MAP · HYDROGEN ATOM');
  g.restore();
  // 唱片（左）
  recordDisc(g, W * 0.21, H * 0.44, 206, t * 0.05);
  mono(g, 'GOLD-PLATED COPPER · 12 INCH', 66, 150, { size: 12, ls: 2.4, color: 'rgba(226,206,170,0.62)' });
  mono(g, '33⅓ RPM · ANALOG', 66, 176, { size: 11, ls: 2.0, color: 'rgba(226,206,170,0.35)' });
  dataRows(g, 66, H * 0.72, [
    ['PLAY TIME', '90 MIN'],
    ['CONTENT', '115 IMAGES'],
    ['COVER', 'PULSAR MAP'],
  ], { w: 330, gap: 30 });

  mono(g, '1,000,000,000', sx + 2, sy + sw + 40, { size: 20, ls: 4, color: 'rgba(240,214,160,0.85)' });
  mono(g, 'YEARS · EXPECTED LIFETIME', sx + 2, sy + sw + 66, { size: 11, ls: 2.4, color: 'rgba(220,200,168,0.45)' });
  scaleBar(g, sx, sy + sw + 104, 210, '1 : 1 · 30 CM');
};

/* 30 十亿年 */
ART.billion = (g, e, dur, t) => {
  bgSpace(g, t, { n: 180, glow: 0.12 });
  // 左：唱片 + 支架
  recordDisc(g, W * 0.19, H * 0.46, 170, t * 0.04);
  g.save(); g.strokeStyle = 'rgba(240,214,160,0.35)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W * 0.19 - 26, H * 0.585); g.lineTo(W * 0.19, H * 0.66); g.lineTo(W * 0.19 + 26, H * 0.585); g.stroke();
  g.restore();
  mono(g, 'ONE DISC · ONE SOUND OF EARTH', 70, H * 0.72, { size: 11, ls: 2.4, color: 'rgba(226,206,170,0.5)' });

  // 对数时间尺
  const x0 = 470, x1 = W - 130, y = H * 0.6;
  const labels = ['1', '10', '100', '1千', '1万', '10万', '100万', '1000万', '1亿', '10亿'];
  g.save();
  g.strokeStyle = 'rgba(226,244,252,0.35)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
  labels.forEach((s, i) => {
    const xx = x0 + (x1 - x0) * i / 9;
    g.beginPath(); g.moveTo(xx, y - (i % 3 === 0 ? 10 : 5)); g.lineTo(xx, y + 6); g.stroke();
    mono(g, s, xx, y + 30, { size: 10, ls: 1.4, align: 'center', color: i === 9 ? 'rgba(255,190,130,0.9)' : 'rgba(206,230,244,0.45)' });
  });
  g.restore();
  mono(g, 'YEARS · LOG SCALE', x0, y + 58, { size: 10, ls: 2.2, color: 'rgba(206,230,244,0.32)' });
  mono(g, '× 1,000,000,000', x1, y - 30, { size: 11, ls: 2.4, align: 'right', color: 'rgba(255,190,130,0.55)' });
  const mark = (yr, txtStr, col) => {
    const u = Math.log10(yr) / 9;
    const xx = x0 + (x1 - x0) * u;
    g.save(); g.strokeStyle = col; g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y - 90); g.stroke(); g.restore();
    mono(g, txtStr, xx, y - 104, { size: 10.5, ls: 1.6, align: 'center', color: col });
  };
  mark(4500, '金字塔', 'rgba(200,226,240,0.5)');
  mark(10000, '人类文明', 'rgba(200,226,240,0.45)');
  mark(300000, '智人', 'rgba(200,226,240,0.35)');

  // 大字
  txt(g, '1,000,000,000', 566, H * 0.34, { size: 78, weight: 800, font: FONT_EN, ls: 2, color: 'rgba(240,224,190,0.95)' });
  mono(g, 'YEARS · A RECORD FOR WHOEVER FINDS IT', 570, H * 0.4, { size: 13, ls: 3, color: 'rgba(220,202,168,0.55)' });
  mono(g, 'GOLD DOES NOT RUST · QUARTZ DOES NOT FADE', 570, H * 0.44, { size: 11, ls: 2.2, color: 'rgba(220,202,168,0.32)' });
};

/* 31 回头 */
ART.paleDot = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.15 });
  // 探测器
  g.save(); g.translate(W * 0.62, H * 0.46); g.rotate(-0.2);
  g.strokeStyle = 'rgba(230,246,253,0.8)'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(0, 0, 46, 0, 6.2832); g.stroke();
  g.beginPath(); g.moveTo(0, -46); g.lineTo(0, -120); g.stroke();
  g.beginPath(); g.arc(0, -130, 18, 0, 6.2832); g.stroke();
  g.beginPath(); g.moveTo(-46, 0); g.lineTo(-140, 40); g.stroke();
  g.beginPath(); g.moveTo(140, -40); g.lineTo(240, -80); g.stroke();
  g.restore();
  // 相机指向
  g.save(); g.strokeStyle = 'rgba(255,150,95,0.7)'; g.lineWidth = 1.3; g.setLineDash([5, 6]);
  g.beginPath(); g.moveTo(W * 0.58, H * 0.42); g.lineTo(W * 0.35, H * 0.55); g.stroke(); g.setLineDash([]); g.restore();
  dotGlow(g, W * 0.35, H * 0.55, 3, '255,220,180', 0.9);
  crosshair(g, W * 0.35, H * 0.55, 26, { color: 'rgba(255,180,120,0.6)' });
  txt(g, '1990', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'VOYAGER 1 · CAMERA TURNS BACK', 70, 240, { size: 14, ls: 2.2, color: 'rgba(210,232,244,0.65)' });
  callout(g, W * 0.42, H * 0.68, W * 0.35, H * 0.56, '把相机转回来，拍下一个小点', 'ONE LAST LOOK BACK');
};

/* 32 暗淡蓝点 */
ART.paleDotPhoto = (g, e, dur, t) => {
  plateBg(g, 'paleblue', { bw: 0, wash: 0.2, vig: 0.55, zoom: 1.03 + e * 0.003 });
  crosshair(g, W * 0.56, H * 0.5, 40, { color: 'rgba(255,190,130,0.55)' });
  mono(g, 'PALE BLUE DOT · 1990-02-14 · 6 BILLION KM', 70, 120, { size: 14, ls: 2.2, color: 'rgba(220,238,248,0.7)' });
  txt(g, '那是我们', 70, 190, { size: 30, weight: 600, color: 'rgba(240,248,252,0.8)' });
  mono(g, 'THAT’S US · THAT’S HOME', 70, 235, { size: 13, ls: 2.6, color: 'rgba(255,160,100,0.75)' });
};

/* 33 快速组 1 */
ART.montageA = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  const items = [
    { key: 'gagarin', y: '1961' }, { key: 'saturn5', y: '1969' }, { key: 'mcc1969', y: '1969' },
    { key: 'a11_boot', y: '1969' }, { key: 'jupiter', y: '1979' },
  ];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.16) / 0.3);
    if (k <= 0) return;
    const x = 40 + (i % 3) * 620, y = 100 + Math.floor(i / 3) * 450, w = 590, h = 420;
    g.save(); g.globalAlpha = smooth(k);
    plate(g, it.key, x, y, w, h, { bw: i < 4 ? 1 : 0, wash: 0.3, vig: 0.4, frame: false });
    g.strokeStyle = 'rgba(230,246,253,0.35)'; g.lineWidth = 1.2; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    txt(g, it.y, x + 14, y + h - 26, { size: 24, weight: 800, font: FONT_EN, color: 'rgba(240,250,255,0.85)' });
    g.restore();
  });
};

/* 34 快速组 2 */
ART.montageB = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.3 });
  const items = [
    { key: 'earth1974', n: 'ORBIT 1974' }, { key: 'art2_earthset', n: 'ARTEMIS II 2026' },
    { key: 'falcon9', n: 'LANDING 2015' }, { key: 'saturn', n: 'SATURN 2004' },
  ];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.12) / 0.3);
    if (k <= 0) return;
    const x = 40 + i * 470, y = 130, w = 440, h = 760;
    g.save(); g.globalAlpha = smooth(k);
    plate(g, it.key, x, y, w, h, { bw: i === 2 ? 0 : 0, wash: 0.35, vig: 0.45, frame: false });
    g.fillStyle = 'rgba(6,14,22,0.5)'; g.fillRect(x, y + h - 64, w, 64);
    mono(g, it.n, x + 14, y + h - 34, { size: 12, ls: 2, color: 'rgba(230,244,252,0.75)' });
    g.restore();
  });
};

/* 35 快速组 3 */
ART.montageC = (g, e, dur, t) => {
  bgSpace(g, t, { n: 220, glow: 0.2 });
  const items = [{ key: 'webb', n: 'DEEP FIELD' }, { key: 'hubble', n: 'HUBBLE' }, { key: 'jupiter', n: 'JUPITER' }];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.14) / 0.3);
    if (k <= 0) return;
    const a = -0.2 + i * 0.2;
    g.save(); g.globalAlpha = smooth(k); g.translate(W * (0.28 + i * 0.22), H * 0.5); g.rotate(a);
    plate(g, it.key, -210, -210, 420, 420, { bw: 0, wash: 0.3, vig: 0.4, frame: true });
    mono(g, it.n, -200, 240, { size: 11, ls: 2, color: 'rgba(220,238,248,0.55)' });
    g.restore();
  });
  mono(g, '1979 · THE FIRST GRAND TOUR', W / 2, H - 90, { size: 13, ls: 3.4, align: 'center', color: 'rgba(200,226,240,0.42)' });
};

/* 36 神舟发射 */
function lm2f(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const ln = 'rgba(236,248,253,0.9)';
  const fill = 'rgba(206,230,242,0.10)';
  g.lineWidth = 1.1 / s * 1.4;
  // 四个助推
  for (const sx of [-1, 1]) {
    for (const off of [52, 78]) {
      const bx = sx * off;
      g.fillStyle = fill; g.strokeStyle = ln;
      g.beginPath();
      g.moveTo(bx - 9, -300); g.lineTo(bx + 9, -300); g.lineTo(bx + 9, 30); g.lineTo(bx - 9, 30);
      g.closePath(); g.fill(); g.stroke();
      g.beginPath(); g.moveTo(bx - 9, -300); g.lineTo(bx, -322); g.lineTo(bx + 9, -300); g.closePath(); g.fill(); g.stroke();
    }
  }
  // 芯级
  g.fillStyle = 'rgba(214,234,246,0.14)'; g.strokeStyle = ln;
  g.beginPath();
  g.moveTo(-22, 34); g.lineTo(-22, -330); g.lineTo(-14, -352); g.lineTo(14, -352); g.lineTo(22, -330); g.lineTo(22, 34);
  g.closePath(); g.fill(); g.stroke();
  // 飞船整流罩
  g.beginPath(); g.moveTo(-16, -352); g.lineTo(-16, -412); g.lineTo(0, -438); g.lineTo(16, -412); g.lineTo(16, -352); g.closePath();
  g.fill(); g.stroke();
  // 逃逸塔
  g.beginPath(); g.moveTo(-5, -438); g.lineTo(-5, -520); g.lineTo(0, -536); g.lineTo(5, -520); g.lineTo(5, -438); g.closePath();
  g.fill(); g.stroke();
  for (let yy = -515; yy < -440; yy += 16) { g.beginPath(); g.moveTo(-5, yy); g.lineTo(5, yy); g.stroke(); }
  // 分段线
  g.strokeStyle = 'rgba(236,248,253,0.32)';
  for (const yy of [-330, -260, -150, -40]) { g.beginPath(); g.moveTo(-22, yy); g.lineTo(22, yy); g.stroke(); }
  // 国旗
  g.fillStyle = 'rgba(220,60,50,0.85)'; g.fillRect(-6, -238, 12, 8);
  g.fillStyle = 'rgba(255,214,90,0.9)'; g.fillRect(-4.5, -236, 1.6, 1.6);
  // 喷口
  g.fillStyle = 'rgba(30,42,56,0.95)'; g.strokeStyle = ln;
  for (const bx of [-14, 0, 14]) { g.beginPath(); g.moveTo(bx - 6, 34); g.lineTo(bx + 6, 34); g.lineTo(bx + 8, 58); g.lineTo(bx - 8, 58); g.closePath(); g.fill(); g.stroke(); }
  g.restore();
}

ART.shenzhou = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.42 });
  // 发射塔
  g.save(); g.strokeStyle = 'rgba(206,232,244,0.22)'; g.lineWidth = 1.1;
  const tx = W * 0.52 - 196;
  for (let i = 0; i < 5; i++) { const x = tx + i * 34; g.beginPath(); g.moveTo(x, 930); g.lineTo(x, 250); g.stroke(); }
  for (let yy = 270; yy < 920; yy += 44) { g.beginPath(); g.moveTo(tx, yy); g.lineTo(tx + 136, yy); g.stroke(); }
  for (let yy = 270; yy < 920; yy += 88) { g.beginPath(); g.moveTo(tx, yy); g.lineTo(tx + 136, yy + 44); g.stroke(); }
  g.restore();
  // 火箭
  g.save(); g.globalAlpha = smooth(clamp(e / 0.4));
  lm2f(g, W * 0.52, H * 0.72, 1.05);
  g.restore();
  // 尾焰
  const fl = g.createLinearGradient(0, H * 0.74, 0, H * 1.0);
  fl.addColorStop(0, 'rgba(255,236,190,0.95)'); fl.addColorStop(0.35, 'rgba(255,160,80,0.55)'); fl.addColorStop(1, 'rgba(255,120,50,0)');
  g.fillStyle = fl;
  g.beginPath(); g.moveTo(W * 0.52 - 78, H * 0.735); g.lineTo(W * 0.52 + 78, H * 0.735); g.lineTo(W * 0.52 + 170, H); g.lineTo(W * 0.52 - 170, H); g.fill();
  // 烟雾
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 8; i++) {
    const r = mulberry(41 + i);
    const x = W * 0.3 + r() * W * 0.44, y = H * 0.86 + r() * 70, rad = 120 + r() * 180;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(232,242,248,0.14)'); gr.addColorStop(1, 'rgba(232,242,248,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
  }
  g.restore();
  // 尺寸线
  const dx = W * 0.52 + 150;
  g.save(); g.strokeStyle = 'rgba(226,244,252,0.28)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(dx, H * 0.72 - 560); g.lineTo(dx, H * 0.72); g.stroke();
  for (const yy of [H * 0.72 - 560, H * 0.72]) { g.beginPath(); g.moveTo(dx - 8, yy); g.lineTo(dx + 8, yy); g.stroke(); }
  g.restore();
  mono(g, '58.3 M', dx + 14, H * 0.72 - 280, { size: 11, ls: 2, color: 'rgba(206,232,246,0.55)' });

  // 左栏
  txt(g, '2003.10.15', 62, 190, { size: 82, weight: 900, font: FONT_EN, ls: -2, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'SHENZHOU 5 · LONG MARCH 2F · JIUQUAN', 66, 232, { size: 12, ls: 2.0, color: 'rgba(206,230,244,0.6)' });
  dataRows(g, 66, 280, [
    ['CREW', '1'],
    ['DURATION', '21 H 23 MIN'],
    ['ORBITS', '14'],
    ['ALTITUDE', '343 KM'],
  ], { w: 330, gap: 29 });
  g.save(); g.globalAlpha = smooth(clamp((e - 0.5) / 0.6));
  insetPhoto(g, 'yang', 66, 470, 300, 330, 'YANG LIWEI · 2003', '杨利伟，神舟五号');
  g.restore();
  captionBar(g, 60, H - 112, 'CNSA · SHENZHOU 5 · 2003', '神舟五号，酒泉');
};

/* 37 杨利伟 */
ART.yang = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  plate(g, 'yang', W * 0.52, 0, W * 0.48, H, { bw: 0, wash: 0.3, vig: 0.5, frame: false, zoom: 1.02 });
  g.fillStyle = 'rgba(6,12,19,0.3)'; g.fillRect(W * 0.52, 0, W * 0.48, H);
  txt(g, '2003', 66, 162, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'YANG LIWEI · SHENZHOU 5', 70, 260, { size: 14, ls: 2.2, color: 'rgba(206,230,244,0.6)' });
  txt(g, '一个中国人', 70, 430, { size: 54, weight: 800, color: 'rgba(240,248,252,0.95)' });
  txt(g, '飞上去了', 70, 500, { size: 54, weight: 800, color: 'rgba(255,150,95,0.95)' });
  mono(g, '21 H 23 MIN · 14 ORBITS', 70, 600, { size: 13, ls: 2.6, color: 'rgba(210,232,244,0.6)' });
};

/* 38 轨道计数 */
ART.counter = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.25 });
  globe(g, W * 0.62, H * 0.5, 260, { lon0: 90 + t * 18, land: 'rgba(196,228,242,0.55)' });
  const steps = [
    [3.7, '3 h 48 min', '2'], [7.5, '7 h 32 min', '4'], [11.3, '11 h 17 min', '7'],
    [15.0, '15 h 00 min', '9'], [18.8, '18 h 45 min', '12'], [21.4, '21 h 23 min', '14'],
  ];
  txt(g, '21h 23min', 80, 430, { size: 92, weight: 900, font: FONT_EN, ls: -2, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'FOURTEEN ORBITS · 2003', 84, 500, { size: 14, ls: 2.8, color: 'rgba(255,150,95,0.85)' });
  steps.forEach((s, i) => {
    const y = 220 + i * 62;
    const on = e > i * 0.55;
    mono(g, s[0].toFixed(1) + ' h', 90, y, { size: 13, ls: 2, color: on ? 'rgba(240,250,255,0.85)' : 'rgba(200,226,240,0.3)' });
    mono(g, s[2] + ' ORB', 250, y, { size: 13, ls: 2, color: on ? 'rgba(255,160,100,0.8)' : 'rgba(200,226,240,0.3)' });
    g.strokeStyle = on ? 'rgba(255,160,100,0.7)' : 'rgba(200,226,240,0.12)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(330, y); g.lineTo(330 + (on ? 120 : 30), y); g.stroke();
  });
  orbitPath(g, W * 0.62, H * 0.5, 390, 180, -0.2, { color: 'rgba(226,244,252,0.4)' });
  const a = Math.min(6.1, e * 1.6);
  dotGlow(g, W * 0.62 + Math.cos(a) * 390, H * 0.5 + Math.sin(a) * 180, 5, '255,190,140', 1);
};

/* 39 鹊桥 */
ART.bridge = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  globe(g, W * 0.18, H * 0.56, 150, { lon0: 100 + t * 6, land: 'rgba(196,228,242,0.6)' });
  g.fillStyle = 'rgba(214,226,234,0.85)';
  g.beginPath(); g.arc(W * 0.84, H * 0.52, 110, 0, 6.2832); g.fill();
  g.fillStyle = 'rgba(150,165,178,0.55)';
  for (let i = 0; i < 9; i++) {
    const a = i * 1.7, r = 18 + (i * 37) % 70;
    g.beginPath(); g.arc(W * 0.84 + Math.cos(a) * r, H * 0.52 + Math.sin(a) * r, 6 + (i % 4) * 4, 0, 6.2832); g.fill();
  }
  // 中继星
  const mx = W * 0.62, my = H * 0.34;
  g.save(); g.translate(mx, my); g.rotate(0.3);
  g.strokeStyle = 'rgba(236,248,253,0.9)'; g.lineWidth = 1.4;
  g.strokeRect(-16, -16, 32, 32);
  g.beginPath(); g.moveTo(-16, -16); g.lineTo(-40, -40); g.moveTo(16, 16); g.lineTo(40, 40); g.stroke();
  g.restore();
  g.save(); g.strokeStyle = 'rgba(255,160,100,0.7)'; g.lineWidth = 1.6; g.setLineDash([6, 7]);
  g.beginPath(); g.moveTo(W * 0.3, H * 0.5); g.lineTo(mx, my); g.lineTo(W * 0.74, H * 0.46); g.stroke(); g.setLineDash([]); g.restore();
  rings(g, mx, my, t, { r: 26, spread: 160, speed: 0.6, color: 'rgba(255,170,110,0.4)', n: 3 });
  txt(g, '2018', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'QUEQIAO · MAGPIE BRIDGE · 2018-05-21', 70, 240, { size: 13, ls: 2.0, color: 'rgba(206,230,244,0.65)' });
  callout(g, W * 0.6, H * 0.2, mx + 40, my - 30, '月亮背后搭一座鹊桥', 'A RELAY BEHIND THE MOON');
  mono(g, 'EARTH', W * 0.18, H * 0.72, { size: 11, ls: 2, align: 'center', color: 'rgba(200,226,240,0.5)' });
  mono(g, 'FAR SIDE', W * 0.84, H * 0.68, { size: 11, ls: 2, align: 'center', color: 'rgba(200,226,240,0.5)' });
};

/* 40 嫦娥四号 */
ART.change4 = (g, e, dur, t) => {
  plateBg(g, 'change4', { bw: 0, wash: 0.3, vig: 0.5, zoom: 1.04 + e * 0.004 });
  txt(g, '2019', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'CHANG’E 4 · VON KÁRMÁN CRATER · 2019-01-03', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
  crosshair(g, W * 0.52, H * 0.55, 70, { color: 'rgba(255,190,130,0.55)' });
  callout(g, W * 0.62, H * 0.24, W * 0.56, H * 0.4, '我们落在那一面，从地球永远看不见', 'THE FAR SIDE');
  captionBar(g, 60, H - 120, 'NASA / LROC · CHANG’E 4 LANDER', '人类第一次在月背着陆');
};

/* 41 天问 */
ART.tianwen = (g, e, dur, t) => {
  plateBg(g, 'zhurong', { bw: 0, wash: 0.35, vig: 0.5, zoom: 1.03 + e * 0.004 });
  txt(g, '2021', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'TIANWEN-1 · ZHURONG · UTOPIA PLANITIA', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
  txt(g, '「天问」', 70, 420, { size: 60, weight: 800, color: 'rgba(244,251,255,0.95)' });
  mono(g, 'AN OLD POEM · A NEW NAME', 74, 480, { size: 13, ls: 2.6, color: 'rgba(255,160,100,0.8)' });
  mono(g, '遂古之初，谁传道之？', 74, 530, { size: 15, weight: 400, ls: 1, color: 'rgba(220,236,246,0.55)' });
};

/* 42 嫦娥五号 */
ART.change5 = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.45 });
  const cx = W * 0.54, cy = H * 0.44 + Math.sin(t * 0.6) * 5;
  // 伞
  g.save(); g.strokeStyle = 'rgba(240,250,255,0.85)'; g.lineWidth = 1.6;
  g.beginPath(); g.arc(cx, cy - 170, 150, Math.PI * 1.12, Math.PI * 1.88); g.stroke();
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI * 1.12 + (Math.PI * 0.76) * i / 6;
    g.beginPath(); g.moveTo(cx + Math.cos(a) * 150, cy - 170 + Math.sin(a) * 150);
    g.lineTo(cx + (i - 3) * 18, cy - 40); g.stroke();
  }
  // 返回舱
  g.beginPath(); g.moveTo(cx, cy - 60); g.bezierCurveTo(cx + 70, cy - 40, cx + 80, cy + 70, cx + 30, cy + 100);
  g.lineTo(cx - 30, cy + 100); g.bezierCurveTo(cx - 80, cy + 70, cx - 70, cy - 40, cx, cy - 60);
  g.closePath(); g.fillStyle = 'rgba(214,232,244,0.14)'; g.fill(); g.stroke();
  g.beginPath(); g.moveTo(cx - 44, cy + 84); g.lineTo(cx + 44, cy + 84); g.stroke();
  g.restore();
  txt(g, '1,935.3 g', 90, 420, { size: 96, weight: 900, font: FONT_EN, color: 'rgba(242,250,255,0.95)', ls: -2 });
  mono(g, 'LUNAR SAMPLE · CHANG’E 6 · 2024-06-25', 94, 490, { size: 13, ls: 2.2, color: 'rgba(255,160,100,0.8)' });
  mono(g, 'NEARLY TWO KILOS OF FAR-SIDE SOIL', 94, 540, { size: 13, ls: 2.2, color: 'rgba(206,230,244,0.55)' });
  insetPhoto(g, 'change4', W - 500, H - 360, 420, 280, 'FAR SIDE · 2019', '月背的土', { bw: 1 });
};

/* 43 再入 */
ART.reentry = (g, e, dur, t) => {
  bgSpace(g, t, { n: 120, glow: 0.15 });
  const x = W * 0.6, y = H * 0.46;
  g.save();
  g.translate(x, y);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, 320);
  gr.addColorStop(0, 'rgba(255,240,210,0.95)'); gr.addColorStop(0.15, 'rgba(255,170,90,0.55)'); gr.addColorStop(1, 'rgba(255,120,50,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 320, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(250,240,220,0.9)'; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, 34, 0, 6.2832); g.stroke();
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5;
  for (let i = 0; i < 30; i++) {
    const r = mulberry(i + 2);
    g.strokeStyle = `rgba(255,${160 + r() * 60 | 0},90,${0.1 + r() * 0.2})`;
    g.beginPath(); g.moveTo(x - 40 + r() * 80, y - 60 + r() * 60);
    g.lineTo(x - 260 + r() * 200, y - 280 + r() * 120); g.stroke();
  }
  g.restore();
  txt(g, 'RETURN', 90, 300, { size: 80, weight: 900, font: FONT_EN, ls: 10, color: 'rgba(244,251,255,0.85)' });
  mono(g, '11 KM/S · PLASMA SHEATH · 1,500 °C', 94, 370, { size: 13, ls: 2.4, color: 'rgba(255,170,110,0.75)' });
  mono(g, '月背的土，穿过火焰回家', 94, 760, { size: 16, weight: 500, color: 'rgba(216,234,244,0.6)' });
};

/* 44 猎鹰发射 */
ART.falconLaunch = (g, e, dur, t) => {
  plateBg(g, 'falcon9', { bw: 0, wash: 0.25, vig: 0.75, zoom: 1.05 + e * 0.008 });
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(W * 0.5, H * 0.62, 0, W * 0.5, H * 0.62, 500);
  gr.addColorStop(0, 'rgba(255,210,150,0.35)'); gr.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H); g.restore();
  txt(g, '2015', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'FALCON 9 · ORBCOMM-2 · 2015-12-21', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
  captionBar(g, 60, H - 120, 'NASA / SPACEX · FALCON 9', '第一次，把一级火箭收回来');
};

/* 45 回收 */
ART.falconLand = (g, e, dur, t) => {
  plateBg(g, 'falcon9_land', { bw: 0, wash: 0.25, vig: 0.6, zoom: 1.04 + e * 0.005 });
  crosshair(g, W * 0.54, H * 0.62, 80, { color: 'rgba(255,190,130,0.5)' });
  txt(g, '2015', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'LZ-1 · CAPE CANAVERAL · 2015-12-21', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
  captionBar(g, 60, H - 120, 'SPACEX · FIRST STAGE LANDING · CC0', '从高处回来，站着落地');
};

/* 46 筷子夹火箭 */
ART.catch = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.35 });
  // 塔架
  g.save(); g.strokeStyle = 'rgba(206,232,246,0.42)'; g.lineWidth = 2;
  for (const x of [W * 0.34, W * 0.66]) { g.beginPath(); g.moveTo(x, 990); g.lineTo(x, 80); g.stroke(); }
  g.lineWidth = 1;
  for (let y = 120; y < 980; y += 54) {
    g.globalAlpha = 0.5;
    g.beginPath(); g.moveTo(W * 0.34, y); g.lineTo(W * 0.66, y + 18); g.stroke();
    g.beginPath(); g.moveTo(W * 0.34, y + 18); g.lineTo(W * 0.66, y); g.stroke();
  }
  g.globalAlpha = 1;
  // 筷子臂
  const closeP = smooth(clamp((e - 1.6) / 1.0));
  const armGap = 150 - closeP * 96;
  g.strokeStyle = 'rgba(242,250,255,0.92)'; g.lineWidth = 9;
  g.beginPath(); g.moveTo(W * 0.34, 470); g.lineTo(W * 0.5 - armGap, 470); g.stroke();
  g.beginPath(); g.moveTo(W * 0.66, 470); g.lineTo(W * 0.5 + armGap, 470); g.stroke();
  g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,160,100,0.8)';
  g.beginPath(); g.moveTo(W * 0.5 - armGap, 470); g.lineTo(W * 0.5 - armGap, 500); g.stroke();
  g.beginPath(); g.moveTo(W * 0.5 + armGap, 470); g.lineTo(W * 0.5 + armGap, 500); g.stroke();
  g.restore();
  // 助推器下降
  const desc = clamp((e - 0.2) / 1.5);
  const by = lerp(150, 440, easeOut(desc));
  g.save(); g.translate(W * 0.5, by); g.scale(1.35, 1.35);
  g.strokeStyle = 'rgba(242,252,255,0.95)'; g.lineWidth = 1.8;
  g.fillStyle = 'rgba(216,236,248,0.16)';
  g.beginPath(); g.moveTo(0, -170); g.lineTo(26, -128); g.lineTo(26, 120); g.lineTo(-26, 120); g.lineTo(-26, -128); g.closePath(); g.fill(); g.stroke();
  // 格子舵
  for (const sx of [-1, 1]) {
    g.save(); g.translate(26 * sx, -110);
    g.strokeStyle = 'rgba(230,246,253,0.6)'; g.lineWidth = 1;
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(i * 7, -12); g.lineTo(i * 7, 12); g.stroke(); }
    for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(-11, i * 8); g.lineTo(11, i * 8); g.stroke(); }
    g.restore();
  }
  // 腿
  for (const sx of [-1, 1]) {
    g.beginPath(); g.moveTo(26 * sx, 112); g.lineTo(52 * sx, 150); g.lineTo(26 * sx, 146); g.closePath(); g.fill(); g.stroke();
  }
  // 发动机光
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(0, 150, 0, 0, 150, 200);
  gr.addColorStop(0, 'rgba(255,240,205,0.95)'); gr.addColorStop(0.35, 'rgba(255,180,100,0.45)'); gr.addColorStop(1, 'rgba(255,150,80,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 150, 200, 0, 6.2832); g.fill();
  g.restore();
  g.restore();
  // 速度线
  g.save(); g.strokeStyle = 'rgba(255,200,150,0.28)'; g.lineWidth = 1.4;
  for (let i = 0; i < 18; i++) {
    const x = W * 0.42 + i * 11;
    g.beginPath(); g.moveTo(x, by - 250 - i * 9); g.lineTo(x, by - 360 - i * 15); g.stroke();
  }
  g.restore();
  txt(g, 'CATCH', W * 0.5, H * 0.16, { size: 96, weight: 900, font: FONT_EN, ls: 18, align: 'center', color: 'rgba(244,251,255,0.9)' });
  mono(g, '2024 · MECHAZILLA · SUPER HEAVY', 70, 120, { size: 13, ls: 2.4, color: 'rgba(210,232,244,0.7)' });
  mono(g, '钢铁的手臂伸出来，在半空把它接住', 70, 160, { size: 15, weight: 500, color: 'rgba(216,234,244,0.62)' });
};

/* 47 落海 */
ART.splash = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.3, cx: 0.5, cy: 0.55 });
  // 海面
  const gr = g.createLinearGradient(0, H * 0.55, 0, H);
  gr.addColorStop(0, 'rgba(18,64,86,0.9)'); gr.addColorStop(1, 'rgba(5,20,30,1)');
  g.fillStyle = gr; g.fillRect(0, H * 0.55, W, H * 0.45);
  for (let i = 0; i < 24; i++) {
    const y = H * 0.58 + i * 16;
    g.strokeStyle = `rgba(150,200,220,${0.05 + (i % 5) * 0.02})`;
    g.beginPath();
    for (let x = 0; x <= W; x += 40) g.lineTo(x, y + Math.sin(x * 0.01 + t * 1.4 + i) * 4);
    g.stroke();
  }
  // 漂浮的火箭
  g.save(); g.translate(W * 0.52, H * 0.62); g.rotate(1.18);
  g.strokeStyle = 'rgba(236,248,253,0.9)'; g.lineWidth = 1.6; g.fillStyle = 'rgba(220,238,248,0.12)';
  g.beginPath(); g.moveTo(0, -190); g.lineTo(12, -160); g.lineTo(12, 140); g.lineTo(-12, 140); g.lineTo(-12, -160); g.closePath(); g.fill(); g.stroke();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(12 * s, 130); g.lineTo(42 * s, 190); g.lineTo(12 * s, 180); g.closePath(); g.fill(); g.stroke(); }
  g.restore();
  rings(g, W * 0.6, H * 0.68, t, { r: 120, spread: 260, speed: 0.3, color: 'rgba(150,210,230,0.2)', n: 3 });
  txt(g, '2024', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'SPLASHDOWN · INDIAN OCEAN', 70, 240, { size: 13, ls: 2.2, color: 'rgba(210,232,244,0.7)' });
  callout(g, W * 0.62, H * 0.24, W * 0.7, H * 0.34, '另一枚翻个身，落进海里', 'ANOTHER SPLASHES DOWN');
};

/* 48 学会 */
ART.learn = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.25 });
  const items = [{ key: 'falcon9_land', n: 'LAND' }, { key: 'falcon9', n: 'NIGHT LAUNCH' }, { key: 'saturn5', n: 'LIFT' }];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.12) / 0.3);
    if (k <= 0) return;
    const x = 90 + i * 600, y = 210, w = 540, h = 540;
    g.save(); g.globalAlpha = smooth(k);
    plate(g, it.key, x, y, w, h, { bw: 0, wash: 0.3, vig: 0.4, frame: false });
    g.strokeStyle = 'rgba(230,246,253,0.4)'; g.lineWidth = 1.4; g.strokeRect(x + .5, y + .5, w - 1, h - 1);
    mono(g, it.n, x + 14, y + h + 26, { size: 13, ls: 3, color: 'rgba(220,240,250,0.6)' });
    g.restore();
  });
  mono(g, 'WHAT GOES UP COMES DOWN', W / 2, H - 110, { size: 15, ls: 5, align: 'center', color: 'rgba(210,234,244,0.5)' });
};

/* 49 发动机试车 */
ART.engine = (g, e, dur, t) => {
  plateBg(g, 'rs25', { bw: 0, wash: 0.25, vig: 0.6, zoom: 1.04 + e * 0.006 });
  txt(g, 'RS-25', 70, 200, { size: 94, weight: 900, font: FONT_EN, ls: 4, color: 'rgba(244,251,255,0.9)' });
  mono(g, 'FULL DURATION · 500 s · 2025', 74, 260, { size: 13, ls: 2.4, color: 'rgba(210,232,244,0.7)' });
  captionBar(g, 60, H - 120, 'NASA · STENNIS · RS-25 TEST', '再点一次火，等它回来');
};

/* 50 2026 乘组 */
ART.crew2026 = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.3 });
  plate(g, 'art2_crew', 60, 110, W - 620, H - 280, { bw: 0, wash: 0.35, vig: 0.4 });
  plate(g, 'art2_earthset', W - 540, 110, 480, 300, { bw: 0, wash: 0.25, vig: 0.3 });
  mono(g, 'ARTEMIS II · CREW OF FOUR', 70, 90, { size: 13, ls: 3, color: 'rgba(220,240,250,0.7)' });
  txt(g, '2026', W - 540, 470, { size: 96, weight: 900, font: FONT_EN, ls: -3, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'REID WISEMAN · VICTOR GLOVER · CHRISTINA KOCH · JEREMY HANSEN', W - 540, 530, { size: 11, ls: 1.4, color: 'rgba(206,230,244,0.55)' });
  mono(g, 'FIRST CREW AROUND THE MOON SINCE 1972', W - 540, 560, { size: 11, ls: 1.6, color: 'rgba(206,230,244,0.4)' });
  captionBar(g, 60, H - 130, 'NASA · ARTEMIS II CREW', '四个人，绕过月亮');
};

/* 51 挑战者 */
ART.challenger = (g, e, dur, t) => {
  g.fillStyle = '#05070a'; g.fillRect(0, 0, W, H);
  plate(g, 'challenger', 0, 0, W, H, { bw: 1, wash: 0.3, vig: 0.6, frame: false, zoom: 1.02 });
  g.fillStyle = 'rgba(4,8,12,0.55)'; g.fillRect(0, 0, W, H);
  txt(g, '1986.01.28', 90, 300, { size: 96, weight: 900, font: FONT_EN, ls: -3, color: 'rgba(240,248,252,0.9)' });
  mono(g, 'CHALLENGER · STS-51-L · SEVEN CREW', 94, 360, { size: 14, ls: 2.4, color: 'rgba(210,232,244,0.7)' });
};

/* 52 哥伦比亚 七人 */
ART.columbiaGrid = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.1 });
  plate(g, 'columbia', 60, 80, 900, 620, { bw: 1, wash: 0.3, vig: 0.4 });
  plate(g, 'challenger', 990, 80, 870, 620, { bw: 1, wash: 0.3, vig: 0.4 });
  txt(g, '2003.02.01', 70, 760, { size: 62, weight: 900, font: FONT_EN, ls: -2, color: 'rgba(240,248,252,0.9)' });
  mono(g, 'COLUMBIA · STS-107 · SEVEN CREW', 74, 806, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.6)' });
  // 14 个点
  for (let i = 0; i < 14; i++) {
    const on = e > i * 0.06;
    g.fillStyle = on ? 'rgba(255,160,100,0.85)' : 'rgba(255,160,100,0.15)';
    g.beginPath(); g.arc(1000 + (i % 7) * 34, 760 + Math.floor(i / 7) * 34, 5, 0, 6.2832); g.fill();
  }
  mono(g, '14 NAMES', 990, 840, { size: 12, ls: 2.4, color: 'rgba(210,232,244,0.5)' });
};

/* 53 纪念 */
ART.memorial = (g, e, dur, t) => {
  g.fillStyle = '#04070a'; g.fillRect(0, 0, W, H);
  stars(g, t, { n: 90, alpha: 0.4 });
  const names = ['FRANCIS R. SCobEE', 'MICHAEL J. SMITH', 'RONALD E. MCNAIR', 'ELLISON S. ONIZUKA',
    'JUDITH A. RESNIK', 'GREGORY B. JARVIS', 'CHRISTA MCAULIFFE',
    'RICK D. HUSBAND', 'WILLIAM C. MCCOOL', 'MICHAEL P. ANDERSON', 'DAVID M. BROWN',
    'KALPANA CHAWLA', 'LAUREL B. CLARK', 'ILAN RAMON'];
  names.forEach((n, i) => {
    const a = clamp((e - i * 0.05) / 0.4);
    mono(g, n, W * 0.28, 220 + i * 28, { size: 12, ls: 2, color: `rgba(226,206,178,${0.55 * a})` });
  });
  txt(g, '记住他们的名字', W * 0.42, 250, { size: 44, weight: 700, color: 'rgba(240,248,252,0.9)' });
  mono(g, 'WE REMEMBER', W * 0.42, 300, { size: 13, ls: 4, color: 'rgba(255,150,95,0.75)' });
};

/* 54 复飞 */
ART.returnFlight = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.35 });
  // 发射塔
  g.save(); g.strokeStyle = 'rgba(206,232,244,0.2)'; g.lineWidth = 1.1;
  const tx = W * 0.52 - 190;
  for (let i = 0; i < 4; i++) { const x = tx + i * 30; g.beginPath(); g.moveTo(x, 930); g.lineTo(x, 280); g.stroke(); }
  for (let yy = 300; yy < 920; yy += 44) { g.beginPath(); g.moveTo(tx, yy); g.lineTo(tx + 90, yy); g.stroke(); }
  g.restore();
  // 航天飞机组合体
  g.save(); g.translate(W * 0.55, H * 0.72);
  const ln = 'rgba(238,250,255,0.85)';
  g.lineWidth = 1.2;
  // 外储箱（橙）
  g.fillStyle = 'rgba(200,130,80,0.30)'; g.strokeStyle = 'rgba(240,190,150,0.8)';
  g.beginPath(); g.moveTo(0, -500); g.lineTo(22, -470); g.lineTo(22, 40); g.lineTo(-22, 40); g.lineTo(-22, -470); g.closePath(); g.fill(); g.stroke();
  // 双助推
  for (const sx of [-1, 1]) {
    g.fillStyle = 'rgba(230,242,250,0.24)'; g.strokeStyle = ln;
    g.beginPath(); g.moveTo(46 * sx, -440); g.lineTo(62 * sx, -410); g.lineTo(62 * sx, 60); g.lineTo(46 * sx, 60); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(46 * sx, 60); g.lineTo(70 * sx, 92); g.lineTo(46 * sx, 88); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = 'rgba(30,42,56,0.95)';
    g.beginPath(); g.moveTo(46 * sx, 60); g.lineTo(62 * sx, 60); g.lineTo(64 * sx, 74); g.lineTo(44 * sx, 74); g.closePath(); g.fill();
  }
  // 轨道器
  g.fillStyle = 'rgba(240,248,252,0.34)'; g.strokeStyle = ln;
  g.beginPath(); g.moveTo(-16, -300); g.lineTo(16, -300); g.lineTo(16, 70); g.lineTo(-16, 70); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.moveTo(-16, -120); g.lineTo(-74, 70); g.lineTo(74, 70); g.lineTo(16, -120); g.closePath(); g.fill(); g.stroke();
  // 机头黑、垂尾
  g.fillStyle = 'rgba(18,26,34,0.9)';
  g.beginPath(); g.moveTo(-16, -300); g.lineTo(16, -300); g.lineTo(16, -268); g.lineTo(-16, -268); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(0, -300); g.lineTo(-6, -350); g.lineTo(10, -330); g.lineTo(6, -300); g.closePath(); g.fill();
  g.restore();
  // 尾焰 + 烟
  const fl = g.createLinearGradient(0, H * 0.74, 0, H);
  fl.addColorStop(0, 'rgba(255,225,165,0.9)'); fl.addColorStop(0.45, 'rgba(255,160,80,0.5)'); fl.addColorStop(1, 'rgba(255,140,70,0)');
  g.fillStyle = fl;
  g.beginPath(); g.moveTo(W * 0.55 - 70, H * 0.735); g.lineTo(W * 0.55 + 70, H * 0.735); g.lineTo(W * 0.55 + 160, H); g.lineTo(W * 0.55 - 160, H); g.fill();
  g.save(); g.globalCompositeOperation = 'screen';
  for (let i = 0; i < 6; i++) {
    const r = mulberry(61 + i);
    const x = W * 0.42 + r() * W * 0.3, y = H * 0.87 + r() * 60, rad = 110 + r() * 160;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, 'rgba(232,242,248,0.12)'); gr.addColorStop(1, 'rgba(232,242,248,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, 6.2832); g.fill();
  }
  g.restore();
  // 左栏
  txt(g, '1988', 66, 182, { size: 100, weight: 900, font: FONT_EN, ls: -3, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'RETURN TO FLIGHT · STS-26 · 1988-09-29', 70, 226, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.65)' });
  txt(g, '倒计时继续', 70, 420, { size: 54, weight: 800, color: 'rgba(255,150,95,0.95)' });
  mono(g, 'THE COUNTDOWN CONTINUES', 74, 480, { size: 13, ls: 2.6, color: 'rgba(216,234,244,0.55)' });
  dataRows(g, 74, 540, [
    ['SHUTTLE', 'DISCOVERY'],
    ['CREW', '5'],
    ['MISSION', 'STS-26'],
    ['GAP', '32 MONTHS'],
  ], { w: 330, gap: 29 });
};

/* 55 总装 */
ART.factory = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  // 厂房
  g.save(); g.strokeStyle = 'rgba(200,228,242,0.18)'; g.lineWidth = 1.2;
  for (let i = 0; i < 9; i++) { const x = 100 + i * 210; g.beginPath(); g.moveTo(x, 940); g.lineTo(x, 120); g.stroke(); }
  for (let y = 180; y < 940; y += 120) { g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke(); }
  g.restore();
  rocketSaturn(g, W * 0.5, H * 0.62, 1.6, { line: 'rgba(226,244,252,0.55)' });
  mono(g, 'VEHICLE ASSEMBLY BUILDING · BAY 3', 100, 120, { size: 13, ls: 2.6, color: 'rgba(206,230,244,0.55)' });
  txt(g, '火箭从来不问', W * 0.68, H * 0.3, { size: 36, weight: 700, color: 'rgba(236,248,253,0.75)' });
  txt(g, '自己要装什么', W * 0.68, H * 0.38, { size: 36, weight: 700, color: 'rgba(236,248,253,0.75)' });
};

/* 56 选择 */
ART.choose = (g, e, dur, t) => {
  g.fillStyle = '#060a0e'; g.fillRect(0, 0, W, H);
  // 左：武器
  g.save(); g.globalAlpha = 0.9;
  plate(g, 'v2', 0, 0, W / 2, H, { bw: 1, wash: 0.5, vig: 0.6, frame: false, zoom: 1.04 + e * 0.002 });
  g.restore();
  g.fillStyle = 'rgba(96,22,10,0.34)'; g.fillRect(0, 0, W / 2, H);
  // 右：金唱片
  g.save(); g.globalAlpha = 0.95;
  plate(g, 'record_gold', W / 2, 0, W / 2, H, { bw: 0, wash: 0.12, vig: 0.5, frame: false, zoom: 1.04 + e * 0.002 });
  g.restore();
  g.fillStyle = 'rgba(10,8,4,0.18)'; g.fillRect(W / 2, 0, W / 2, H);
  // 中缝 + 上下压暗
  g.save(); g.strokeStyle = 'rgba(240,250,255,0.75)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(W / 2, 60); g.lineTo(W / 2, H - 60); g.stroke(); g.restore();
  let sc = g.createLinearGradient(0, 0, 0, H * 0.3);
  sc.addColorStop(0, 'rgba(4,8,12,0.88)'); sc.addColorStop(1, 'rgba(4,8,12,0)');
  g.fillStyle = sc; g.fillRect(0, 0, W, H * 0.3);
  sc = g.createLinearGradient(0, H * 0.72, 0, H);
  sc.addColorStop(0, 'rgba(4,8,12,0)'); sc.addColorStop(1, 'rgba(4,8,12,0.85)');
  g.fillStyle = sc; g.fillRect(0, H * 0.72, W, H * 0.28);
  // 标签底
  g.fillStyle = 'rgba(4,8,12,0.72)';
  g.fillRect(W * 0.25 - 150, H * 0.125, 300, 74);
  g.fillRect(W * 0.75 - 150, H * 0.125, 300, 74);
  g.strokeStyle = 'rgba(226,244,252,0.22)'; g.lineWidth = 1;
  g.strokeRect(W * 0.25 - 149.5, H * 0.125 + .5, 299, 73);
  g.strokeRect(W * 0.75 - 149.5, H * 0.125 + .5, 299, 73);
  mono(g, 'A WEAPON', W * 0.25, H * 0.155, { size: 18, ls: 6, align: 'center', color: 'rgba(245,150,120,0.95)' });
  mono(g, '1944 · MADE TO FALL', W * 0.25, H * 0.185, { size: 11, ls: 2.4, align: 'center', color: 'rgba(245,170,140,0.6)' });
  mono(g, 'A GOLDEN SONG', W * 0.75, H * 0.155, { size: 18, ls: 6, align: 'center', color: 'rgba(240,214,170,0.95)' });
  mono(g, '1977 · MADE TO LAST', W * 0.75, H * 0.185, { size: 11, ls: 2.4, align: 'center', color: 'rgba(240,214,170,0.6)' });
  mono(g, 'SAME ROCKET · SAME SKY', W * 0.5, H * 0.79, { size: 10.5, ls: 3, align: 'center', color: 'rgba(226,244,252,0.4)' });
};

/* 57 2026 发射 */
ART.art2_2026 = (g, e, dur, t) => {
  plateBg(g, 'art2_launch', { bw: 0, wash: 0.25, vig: 0.55, zoom: 1.02 + e * 0.008, panY: -0.05 });
  flash(g, clamp(1 - e / 0.3) * 0.4);
  txt(g, '2026', 66, 172, { size: 118, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.96)' });
  mono(g, 'ARTEMIS II · 2026-04-01 · PAD 39B', 70, 242, { size: 14, ls: 2.2, color: 'rgba(210,232,244,0.7)' });
  captionBar(g, 60, H - 120, 'NASA · ARTEMIS II LAUNCH · 2026', '四个人，去月亮');
};

/* 58 距离 */
ART.distance = (g, e, dur, t) => {
  bgSpace(g, t, { n: 220, glow: 0.2 });
  plate(g, 'art2_earthset', 60, 100, 760, 480, { bw: 0, wash: 0.25, vig: 0.35 });
  txt(g, '406,771', 900, 260, { size: 96, weight: 900, font: FONT_EN, ls: -2, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'KM · FARTHER THAN ANYONE', 904, 320, { size: 13, ls: 2.6, color: 'rgba(255,160,100,0.8)' });
  txt(g, '52,816', 900, 460, { size: 62, weight: 800, font: FONT_EN, ls: -1, color: 'rgba(226,240,248,0.55)' });
  mono(g, 'KM · APOLLO 13 RECORD', 904, 510, { size: 12, ls: 2.2, color: 'rgba(206,230,244,0.45)' });
  mono(g, '2026 · ORION · 10 DAYS', 70, 640, { size: 13, ls: 2.4, color: 'rgba(210,232,244,0.55)' });
  g.save(); g.strokeStyle = 'rgba(255,150,95,0.55)'; g.lineWidth = 1.4;
  g.beginPath(); g.moveTo(820, 260); g.lineTo(870, 260); g.stroke(); g.restore();
};

/* 59 唱片与问候 */
ART.recordHello = (g, e, dur, t) => {
  g.fillStyle = '#070605'; g.fillRect(0, 0, W, H);
  // 真实唱片（圆形裁切）
  const cx = W * 0.30, cy = H * 0.52, R = 230;
  g.save(); g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.clip();
  plate(g, 'record_gold', cx - R, cy - R, R * 2, R * 2, { bw: 0, wash: 0, vig: 0.3, frame: false, zoom: 1.02 + e * 0.002 });
  g.restore();
  g.save(); g.strokeStyle = 'rgba(240,214,160,0.55)'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke(); g.restore();
  rings(g, cx, cy, t, { r: R + 40, spread: 360, speed: 0.3, color: 'rgba(230,196,130,0.2)', n: 3 });
  txt(g, 'HELLO', W * 0.62, H * 0.34, { size: 92, weight: 900, font: FONT_EN, ls: 18, color: 'rgba(240,222,184,0.9)', glow: 20, glowColor: 'rgba(200,150,70,0.3)' });
  mono(g, 'A LIGHT-DAY AWAY', W * 0.62, H * 0.42, { size: 13, ls: 3, color: 'rgba(220,200,164,0.6)' });
  wave(g, W * 0.62, H * 0.5, 540, 40, t, { color: 'rgba(226,190,130,0.35)', pack: 2, n: 220 });
  dataRows(g, W * 0.62, H * 0.62, [
    ['LANGUAGES', '55'],
    ['AUDIO', '90 MIN'],
    ['IMAGES', '115'],
    ['DISTANCE', '24.5 B KM'],
  ], { w: 380, gap: 28 });
};

/* 60 流水在等 */
ART.guqinWait = (g, e, dur, t) => {
  bgBase(g, t, { warm: 0.2 });
  for (let i = 0; i < 5; i++) {
    const y = H * 0.34 + i * 40;
    g.strokeStyle = `rgba(236,222,196,${0.35 - i * 0.05})`; g.lineWidth = 1.6;
    g.beginPath();
    for (let x = 100; x < W - 100; x += 14) g.lineTo(x, y + Math.sin(x * 0.016 + t * 4 + i) * 3);
    g.stroke();
  }
  globe(g, W * 0.76, H * 0.52, 160, { lon0: 100 + t * 4, land: 'rgba(196,228,242,0.55)' });
  rings(g, W * 0.76, H * 0.52, t, { r: 170, spread: 300, speed: 0.4, color: 'rgba(255,170,110,0.25)', n: 3 });
  txt(g, '《流水》在等', 100, 420, { size: 52, weight: 800, color: 'rgba(240,230,210,0.92)' });
  mono(g, 'WHEREVER YOU ARE', 104, 480, { size: 13, ls: 3, color: 'rgba(226,206,178,0.55)' });
};

/* 61 还在听 */
ART.listen = (g, e, dur, t) => {
  bgSpace(g, t, { n: 300, glow: 0.15 });
  // 射电望远镜
  const cx = W * 0.66, cy = H * 0.5, R = 220, tilt = -0.5;
  g.save(); g.translate(cx, cy); g.rotate(tilt);
  // 抛物面
  const gr = g.createRadialGradient(0, 0, R * 0.1, 0, 0, R);
  gr.addColorStop(0, 'rgba(180,214,232,0.10)'); gr.addColorStop(1, 'rgba(180,214,232,0.02)');
  g.fillStyle = gr; g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.fill();
  g.strokeStyle = 'rgba(220,240,250,0.75)'; g.lineWidth = 2;
  g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.stroke();
  g.strokeStyle = 'rgba(220,240,250,0.28)'; g.lineWidth = 1;
  for (let i = 1; i <= 4; i++) { g.beginPath(); g.arc(0, 0, R * i / 5, 0, 6.2832); g.stroke(); }
  for (let i = 0; i < 24; i++) {
    const a = i / 24 * 6.2832;
    g.beginPath(); g.moveTo(Math.cos(a) * R * 0.2, Math.sin(a) * R * 0.2);
    g.lineTo(Math.cos(a) * R, Math.sin(a) * R); g.stroke();
  }
  // 馈源支架
  g.strokeStyle = 'rgba(236,248,253,0.8)'; g.lineWidth = 1.6;
  for (const a of [-0.9, 0.2, 2.4]) {
    g.beginPath(); g.moveTo(Math.cos(a) * R * 0.94, Math.sin(a) * R * 0.94); g.lineTo(0, -R * 0.55); g.stroke();
  }
  g.beginPath(); g.arc(0, -R * 0.55, 13, 0, 6.2832); g.fillStyle = 'rgba(240,250,255,0.85)'; g.fill();
  g.restore();
  // 底座
  g.save(); g.strokeStyle = 'rgba(220,240,250,0.45)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 40, cy + 120); g.lineTo(cx - 8, cy + 330); g.stroke();
  g.beginPath(); g.moveTo(cx + 40, cy + 120); g.lineTo(cx + 8, cy + 330); g.stroke();
  g.beginPath(); g.moveTo(cx - 70, cy + 334); g.lineTo(cx + 70, cy + 334); g.stroke();
  g.restore();
  rings(g, cx, cy, t, { r: R + 40, spread: 460, speed: 0.22, color: 'rgba(160,210,235,0.18)', n: 4 });

  // 频谱瀑布
  const bx = 110, by = H * 0.62, bw = 520, bh = 210;
  g.save(); g.fillStyle = 'rgba(4,12,18,0.75)'; g.fillRect(bx, by, bw, bh);
  frameBox(g, bx, by, bw, bh, '');
  for (let i = 0; i < 26; i++) {
    const yy = by + 8 + i * 7.6;
    g.strokeStyle = `rgba(120,220,190,${0.05 + (i % 5) * 0.03})`; g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x < bw; x += 6) {
      const v = Math.sin((x * 0.05) + i * 1.7 + t * 2) * 3 + Math.sin(x * 0.17 + i) * 2;
      x ? g.lineTo(bx + x, yy + v) : g.moveTo(bx + x, yy + v);
    }
    g.stroke();
  }
  g.restore();
  mono(g, 'SIGNAL · 20.005 MHZ · NO REPLY', bx + 12, by - 14, { size: 10.5, ls: 1.8, color: 'rgba(150,225,200,0.6)' });
  mono(g, 'INTEGRATION 4.6 H', bx + bw - 12, by + bh + 20, { size: 10, ls: 1.6, align: 'right', color: 'rgba(150,225,200,0.4)' });

  txt(g, '还在听', 110, 330, { size: 66, weight: 800, color: 'rgba(240,248,252,0.92)' });
  mono(g, 'STILL LISTENING · STILL WAITING FOR A REPLY', 114, 400, { size: 13, ls: 2.6, color: 'rgba(210,234,244,0.55)' });
  wave(g, 114, 470, 480, 54, t, { color: 'rgba(150,210,235,0.45)', pack: 4 });
  mono(g, '1977 → 2026 · NOTHING BUT NOISE', 114, H - 130, { size: 11, ls: 2.2, color: 'rgba(206,230,244,0.4)' });
};

/* 62 星舰飞行 */
ART.starshipFlight = (g, e, dur, t) => {
  plateBg(g, 'starship', { bw: 0, wash: 0.3, vig: 0.55, zoom: 1.05 + e * 0.006 });
  mono(g, 'STARSHIP FLIGHT 6 · 2024-11-19 · FROM ISS', 70, 120, { size: 13, ls: 2.2, color: 'rgba(220,240,250,0.7)' });
  captionBar(g, 60, H - 120, 'NASA · ISS VIEW', '从空间站看星舰');
};

/* 63 火星 */
ART.mars = (g, e, dur, t) => {
  plateBg(g, 'perseverance_descent', { bw: 0, wash: 0.35, vig: 0.5, zoom: 1.03 + e * 0.004 });
  plate(g, 'perseverance', W - 380, H - 300, 320, 220, { bw: 0, wash: 0.3, vig: 0.3, zoom: 1 });
  txt(g, '2021', 66, 172, { size: 112, weight: 900, font: FONT_EN, ls: -4, color: 'rgba(242,250,255,0.95)' });
  mono(g, 'PERSEVERANCE · JEZERO CRATER · 2021-02-18', 70, 240, { size: 13, ls: 2.0, color: 'rgba(210,232,244,0.7)' });
  callout(g, W * 0.6, H * 0.3, W * 0.5, H * 0.46, '另一颗行星上，第一次有我们的车辙', 'WHEEL TRACKS ON ANOTHER WORLD');
  captionBar(g, 60, H - 120, 'NASA/JPL · MARS 2020', '火星上的自拍');
};

/* 64 行星 */
ART.planets = (g, e, dur, t) => {
  bgSpace(g, t, { n: 240, glow: 0.25 });
  const items = [
    { key: 'jupiter', n: 'JUPITER', s: 320 }, { key: 'saturn', n: 'SATURN', s: 280 },
    { key: 'paleblue', n: 'EARTH', s: 200 },
  ];
  items.forEach((it, i) => {
    const k = clamp((e - i * 0.12) / 0.4);
    if (k <= 0) return;
    const x = W * (0.24 + i * 0.26), y = H * 0.52;
    g.save(); g.globalAlpha = smooth(k);
    g.beginPath(); g.arc(x, y, it.s / 2, 0, 6.2832); g.clip();
    plate(g, it.key, x - it.s / 2, y - it.s / 2, it.s, it.s, { bw: 0, wash: 0.25, vig: 0.3, frame: false });
    g.restore();
    mono(g, it.n, x, y + it.s / 2 + 30, { size: 12, ls: 2.4, align: 'center', color: 'rgba(210,234,244,0.5)' });
  });
};

/* 65 深场 */
ART.galaxy = (g, e, dur, t) => {
  plateBg(g, 'webb', { bw: 0, wash: 0.2, vig: 0.6, zoom: 1.02 + e * 0.004 });
  stars(g, t, { n: 80, alpha: 0.4 });
  txt(g, '13.8 BILLION', W * 0.5, H * 0.18, { size: 34, weight: 700, font: FONT_EN, ls: 5, align: 'center', color: 'rgba(226,240,250,0.55)' });
  mono(g, 'YEARS OF LIGHT · JWST FIRST DEEP FIELD', W * 0.5, H * 0.23, { size: 12, ls: 3, align: 'center', color: 'rgba(200,226,240,0.42)' });
};

/* 66 太阳系仪 */
ART.orrery = (g, e, dur, t) => {
  bgSpace(g, t, { n: 220, glow: 0.16 });
  const cx = W * 0.34, cy = H * 0.52;
  dotGlow(g, cx, cy, 22, '255,210,150', 1);
  const planets = [
    { r: 78, n: 'MERCURY', au: '0.39', kind: 'rock', s: 7 }, { r: 108, n: 'VENUS', au: '0.72', kind: 'rock', s: 10 },
    { r: 142, n: 'EARTH', au: '1.00', kind: 'earth', s: 13 },
    { r: 180, n: 'MARS', au: '1.52', kind: 'mars', s: 11 }, { r: 252, n: 'JUPITER', au: '5.20', kind: 'jupiter', s: 34 },
    { r: 330, n: 'SATURN', au: '9.58', kind: 'saturn', s: 28 },
    { r: 420, n: 'URANUS', au: '19.2', kind: 'rock', s: 12 }, { r: 500, n: 'NEPTUNE', au: '30.1', kind: 'rock', s: 12 },
  ];
  const rot = -0.16;
  planets.forEach((p, i) => {
    g.save();
    g.translate(cx, cy); g.rotate(rot);
    g.strokeStyle = 'rgba(200,226,240,0.16)'; g.lineWidth = 1;
    g.beginPath(); g.ellipse(0, 0, p.r, p.r * 0.42, 0, 0, 6.2832); g.stroke();
    // 刻度
    for (let k = 0; k < 48; k++) {
      const a = k / 48 * 6.2832;
      if (k % 4) continue;
      const x1 = Math.cos(a) * p.r, y1 = Math.sin(a) * p.r * 0.42;
      const x2 = Math.cos(a) * (p.r + 5), y2 = Math.sin(a) * (p.r * 0.42 + 2.1);
      g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    }
    g.restore();
    const a = t * (0.36 - i * 0.028) + i * 1.9;
    const px = cx + Math.cos(a) * p.r * Math.cos(rot) - Math.sin(a) * p.r * 0.42 * Math.sin(rot);
    const py = cy + Math.cos(a) * p.r * Math.sin(rot) + Math.sin(a) * p.r * 0.42 * Math.cos(rot);
    planetDot(g, px, py, p.s / 2, p.kind);
    if (p.s >= 13) mono(g, p.n, px + p.s / 2 + 8, py + 4, { size: 9.5, ls: 1.4, color: 'rgba(206,230,244,0.55)' });
  });
  // 旅行者出圈
  const p0 = 0.55;
  g.save(); g.strokeStyle = 'rgba(255,160,100,0.7)'; g.lineWidth = 1.8; g.setLineDash([7, 6]);
  g.beginPath(); g.moveTo(cx + 120, cy - 30);
  g.bezierCurveTo(cx + 460, cy - 210, cx + 760, cy - 300, W - 120, cy - 420);
  g.stroke(); g.setLineDash([]); g.restore();
  dotGlow(g, W - 150, cy - 400, 4, '255,190,130', 1);
  mono(g, 'VOYAGER 1 · 24.5 BILLION KM', W - 130, cy - 380, { size: 11, ls: 2, align: 'right', color: 'rgba(255,170,110,0.85)' });
  mono(g, '1990 → 2026 · 46 YEARS OF FLIGHT', W - 130, cy - 362, { size: 10, ls: 1.8, align: 'right', color: 'rgba(255,170,110,0.45)' });
  mono(g, 'HELIOPAUSE CROSSED 2012', W - 130, cy - 344, { size: 10, ls: 1.8, align: 'right', color: 'rgba(255,170,110,0.3)' });
  // 行星表
  g.save(); g.globalAlpha = 0.92;
  dataRows(g, W - 470, H * 0.64, [
    ['MERCURY', '0.39 AU'],
    ['VENUS', '0.72 AU'],
    ['EARTH', '1.00 AU'],
    ['MARS', '1.52 AU'],
    ['JUPITER', '5.20 AU'],
    ['SATURN', '9.58 AU'],
    ['URANUS', '19.2 AU'],
    ['NEPTUNE', '30.1 AU'],
  ], { w: 300, gap: 24 });
  g.restore();
  mono(g, 'PLANET DISTANCE FROM THE SUN', W - 470, H * 0.64 - 26, { size: 10.5, ls: 2, color: 'rgba(206,230,244,0.4)' });
  scaleBar(g, 90, H - 150, 300, '10 AU ≈ 1.5 BILLION KM');
};

/* 67 结尾 */
ART.end = (g, e, dur, t) => {
  g.fillStyle = '#040302'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * 0.42, H * 0.46, 0, W * 0.42, H * 0.46, W * 0.72);
  gr.addColorStop(0, 'rgba(66,48,28,0.55)'); gr.addColorStop(0.5, 'rgba(14,10,7,0.85)'); gr.addColorStop(1, 'rgba(2,2,3,1)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  stars(g, t, { n: 70, alpha: 0.28 });

  // 真实唱片封面
  g.save(); g.globalAlpha = smooth(clamp(e / 0.8));
  plate(g, 'record_gold', W * 0.56, H * 0.18, 520, 520, { bw: 0, wash: 0, vig: 0.28, frame: false, zoom: 1.01 + e * 0.002 });
  frameBox(g, W * 0.56, H * 0.18, 520, 520, 'GOLDEN RECORD · COVER');
  g.restore();
  // 地球小图
  g.save(); g.globalAlpha = smooth(clamp((e - 0.6) / 0.8));
  plate(g, 'earth1974', W * 0.56, H * 0.72, 250, 170, { bw: 0, wash: 0.2, vig: 0.3 });
  g.restore();
  mono(g, 'EARTH · 1977', W * 0.56, H * 0.72 - 12, { size: 10, ls: 1.8, color: 'rgba(220,200,168,0.45)' });

  const a = clamp((e - 1.2) / 1.6);
  g.save(); g.globalAlpha = a;
  txt(g, 'HELLO', 120, H * 0.36, { size: 156, weight: 900, font: FONT_EN, ls: 16, color: 'rgba(244,228,192,0.96)', glow: 34, glowColor: 'rgba(210,160,80,0.45)' });
  mono(g, 'FROM THE CHILDREN OF PLANET EARTH', 126, H * 0.47, { size: 14, ls: 3.2, color: 'rgba(226,206,170,0.68)' });
  mono(g, '「来自地球孩子们的问候」', 126, H * 0.52, { size: 15, weight: 500, color: 'rgba(226,206,170,0.52)' });
  // 问候波形
  wave(g, 126, H * 0.60, 620, 46, t, { color: 'rgba(226,190,130,0.4)', pack: 2, n: 240 });
  mono(g, '55 LANGUAGES · 90 MINUTES · 12 INCH', 126, H * 0.66, { size: 10.5, ls: 2.2, color: 'rgba(226,206,170,0.38)' });
  g.restore();

  const a2 = clamp((e - 3.6) / 1.2);
  g.save(); g.globalAlpha = a2;
  mono(g, '航天简史 · 1944 — 2026', 126, H * 0.80, { size: 13, ls: 3, color: 'rgba(220,200,168,0.5)' });
  mono(g, 'A CODE-DRAWN REPLICA · 小黑鱼', 126, H * 0.83, { size: 12, ls: 2.6, color: 'rgba(220,200,168,0.35)' });
  g.restore();
};
