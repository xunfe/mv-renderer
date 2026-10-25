/* 数学简史（复刻）· 画面母题
 * 每个 motif 都是 (g, t, p, o)：t=全局秒，p=镜头内进度 0..1
 */
'use strict';

// ---------------------------------------------------------------- 小部件
function ghostWord(g, str, x, y, size, o = {}) {
  // 巨大虚化底字（模糊的前景排版）
  g.save();
  g.globalAlpha = o.a ?? 0.16;
  g.globalCompositeOperation = o.blend || 'screen';
  g.filter = `blur(${o.blur ?? 14}px)`;
  g.fillStyle = o.color || '#e9d5ac';
  g.font = `${o.weight || 900} ${size}px ${o.font || FONT_EN}`;
  g.letterSpacing = (o.ls ?? size * 0.02) + 'px';
  g.textAlign = o.align || 'center'; g.textBaseline = 'middle';
  g.fillText(str, x, y);
  g.filter = 'none';
  g.restore();
}

function readout(g, label, value, x, y, o = {}) {
  g.save();
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.fillStyle = o.dim || 'rgba(226,214,192,0.45)';
  caps(g, label, x, y, { size: o.size || 12, ls: 2.6 });
  g.fillStyle = o.color || '#e8d8b8';
  g.font = `700 ${o.vsize || 22}px ${FONT_EN}`;
  g.textAlign = 'right';
  g.fillText(value, x + (o.w || 210), y + (o.dy || 0));
  g.restore();
}

function cardBlock(g, x, y, w, h, o = {}) {
  panel(g, x, y, w, h, { fill: o.fill || 'rgba(10,9,10,0.55)', stroke: o.stroke || 'rgba(232,190,124,0.6)' });
  if (o.tag) caps(g, o.tag, x + 16, y + 22, { size: 11.5, ls: 2.6, color: 'rgba(232,196,140,0.75)' });
  if (o.title) text(g, o.title, x + 16, y + 58, { size: o.tsize || 30, weight: 800, color: '#f2ecdd', align: 'left', glow: 12 });
  if (o.sub) text(g, o.sub, x + 16, y + 92, { size: 13, weight: 600, color: '#c8a878', align: 'left', glow: 6 });
  if (o.lines) ruled(g, x + 16, y + (o.ly || 120), w - 40, o.lines, { lh: o.lh || 7, color: o.lcolor || 'rgba(226,214,192,0.25)' });
}

function stamp(g, str, x, y, o = {}) {
  const ang = o.ang ?? -0.07;
  g.save(); g.translate(x, y); g.rotate(ang);
  const w = o.w || 150, h = o.h || 46;
  g.strokeStyle = o.color || 'rgba(214,88,62,0.85)';
  g.lineWidth = 2.4; g.strokeRect(-w / 2, -h / 2, w, h);
  g.globalAlpha = 0.9;
  text(g, str, 0, 1, { size: o.size || 26, weight: 800, color: o.color || 'rgba(226,112,84,0.95)', glow: 10, ls: 2 });
  g.restore();
}

function tickScale(g, x0, x1, y, n, o = {}) {
  g.save();
  g.strokeStyle = o.color || 'rgba(226,210,182,0.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
  for (let i = 0; i <= n; i++) {
    const x = lerp(x0, x1, i / n);
    const big = i % 5 === 0;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + (big ? 10 : 5)); g.stroke();
    if (big && o.labels) {
      g.fillStyle = 'rgba(226,214,192,0.42)'; g.font = `600 11px ${FONT_EN}`;
      g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillText(o.labels[i / 5] ?? '', x, y + 14);
    }
  }
  g.restore();
}

function grainOverlay(g, t, a) { /* 由 mv 统一处理 */ }

// ---------------------------------------------------------------- 星野/尘埃
function skyBase(g, t, o = {}) {
  bgStar(g, t, o);
  stars(g, t, { n: o.stars ?? 340, alpha: o.starA ?? 0.85, seed: o.seed || 21 });
  if (o.dust !== false) dust(g, t, { n: o.dustN || 90, alpha: 0.5, seed: 5 });
}

// ---------------------------------------------------------------- 1. 1994 费马
function mFermat1994(g, t, p) {
  bgStone(g, t, { warm: 1.0, dark: 0.42, cx: 0.22, cy: 0.5, rad: 0.9 });
  cam(g, { z: 1.06 + 0.05 * smooth(p), dx: -6 + 10 * p, dy: 0 });
  // 光带
  lightStreak(g, 150, 520, 900, -0.18, { a: 0.5, w: 54 });
  lightStreak(g, 420, 760, 1100, -0.32, { a: 0.32, w: 30 });
  softGlow(g, 250, 470, 520, '255,190,110', 0.32);
  // 卡片
  const x = 250, y = 330, w = 620, h = 330;
  cardBlock(g, x, y, w, h, {});
  text(g, '1994', x + 40, y + 112, { size: 100, weight: 900, color: '#ffd07a', align: 'left', glow: 26, font: FONT_EN, ls: 2 });
  text(g, '费马大定理', x + 42, y + 196, { size: 46, weight: 800, color: '#f6f1e5', align: 'left', glow: 16 });
  caps(g, "FERMAT'S LAST THEOREM", x + 44, y + 242, { size: 14, ls: 3.4, color: 'rgba(240,214,170,0.7)' });
  text(g, '怀尔斯', x + 42, y + 292, { size: 20, weight: 600, color: 'rgba(232,214,186,0.7)', align: 'left', glow: 8 });
  // 右侧公式
  text(g, 'aⁿ + bⁿ ≠ cⁿ', 1010, 430, { size: 56, weight: 700, color: '#f0e7d5', font: FONT_SERIF, glow: 20, italic: 1 });
  caps(g, 'n > 2', 1012, 492, { size: 15, ls: 3, color: 'rgba(226,206,176,0.6)' });
  // 右上角年份
  text(g, '1994', W - 70, 128, { size: 30, weight: 800, color: '#e9c48a', align: 'right', glow: 14, font: FONT_EN });
  caps(g, 'CAMBRIDGE · 23 JUN', W - 70, 164, { size: 11, ls: 2.6, color: 'rgba(226,206,176,0.45)' });
  dust(g, t, { n: 100, seed: 9, alpha: 0.6 });
}

// ---------------------------------------------------------------- 2. 甩镜
function mWhip(g, t, p) {
  bgStone(g, t, { warm: 0.9, dark: 0.5, cx: 0.5, cy: 0.5 });
  g.save();
  // 速度线
  g.globalCompositeOperation = 'lighter';
  const r = mulberry(77);
  for (let i = 0; i < 90; i++) {
    const y = r() * H, x = r() * W, len = 200 + r() * 900;
    const a = 0.05 + 0.20 * r() * Math.sin(p * 3.14);
    g.strokeStyle = `rgba(255,${200 + r() * 40 | 0},${140 + r() * 60 | 0},${a})`;
    g.lineWidth = 1 + r() * 9;
    g.beginPath(); g.moveTo(x - len * p, y); g.lineTo(x - len * p + len, y + (r() - 0.5) * 60); g.stroke();
  }
  g.restore();
  // 暖色残影块
  g.save(); g.globalAlpha = 0.35; g.filter = 'blur(30px)';
  g.fillStyle = '#3d2a16';
  g.fillRect(-200 + p * W * 2.2, 300, 520, 480);
  g.fillStyle = '#6a5228';
  g.fillRect(-500 + p * W * 2.0, 380, 700, 200);
  g.restore();
}

// ---------------------------------------------------------------- 3. 片名
function mTitle(g, t, p) {
  bgStone(g, t, { warm: 0.85, dark: 0.62, cy: 0.4, rad: 0.95 });
  dust(g, t, { n: 150, seed: 3, alpha: 0.75 });
  stars(g, t, { n: 220, alpha: 0.5, seed: 14 });
  const k = 0.35 + 0.65 * smooth(clamp(p / 0.18));
  const z = 1 + 0.04 * p;
  g.save(); cam(g, { z });
  // 主标题
  g.globalAlpha = k;
  text(g, '数学简史', W / 2, 330, { size: 152, weight: 900, color: '#f8f4ea', glow: 22, glowColor: '#d8b071', ls: 10 });
  caps(g, 'A BRIEF HISTORY OF MATHEMATICS', W / 2 - 12, 428, { size: 27, ls: 8.5, color: '#e5b45e', weight: 700 });
  g.globalAlpha = 1;
  // 副题
  g.globalAlpha = smooth(clamp((p - 0.2) / 0.3));
  text(g, '约两万年前 ——▮', W / 2, 492, { size: 22, weight: 500, color: 'rgba(238,231,218,0.85)', glow: 8, ls: 1 });
  g.globalAlpha = 1;
  // 骨头
  drawBone(g, W / 2 + 100, 720, 470, 1.0, t);
  // 骨头下方刻度
  for (let i = 0; i < 9; i++) {
    const y = 762 + i * 21, w = i % 3 === 0 ? 46 : 30;
    glowLine(g, [[W / 2 - 60, y], [W / 2 - 60 + w, y]], { w: 2, color: '#f0c886', glow: 10, alpha: 0.85 - i * 0.06 });
  }
  g.restore();
}

function drawBone(g, cx, cy, len, a, t) {
  g.save();
  g.globalAlpha = a;
  const h = len * 0.075;
  // 骨身
  const gr = g.createLinearGradient(cx - len / 2, cy - h, cx + len / 2, cy + h);
  gr.addColorStop(0, '#8d8474'); gr.addColorStop(0.45, '#c9c0ad'); gr.addColorStop(0.7, '#a49a88'); gr.addColorStop(1, '#6c6455');
  g.fillStyle = gr;
  g.beginPath();
  g.roundRect(cx - len / 2 + h * 1.4, cy - h * 0.45, len - h * 2.8, h * 0.9, h * 0.45);
  g.fill();
  for (const s of [-1, 1]) {
    for (const dy of [-1, 1]) {
      g.beginPath();
      g.ellipse(cx + s * (len / 2 - h * 1.2), cy + dy * h * 0.55, h * 0.85, h * 0.62, s * dy * 0.35, 0, 6.2832);
      g.fill();
    }
  }
  g.globalAlpha = a * 0.5;
  g.strokeStyle = 'rgba(30,24,18,0.7)'; g.lineWidth = 1.2;
  for (let i = 0; i < 7; i++) {
    const x = cx - len * 0.22 + i * len * 0.075;
    g.beginPath(); g.moveTo(x, cy - h * 0.4); g.lineTo(x + 2, cy + h * 0.4); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- 4. 伊尚戈骨
function mBone(g, t, p) {
  bgStone(g, t, { warm: 0.55, dark: 0.5, cy: 0.55, rad: 1.0 });
  // 远景地面亮线
  g.save();
  const grd = g.createLinearGradient(0, 560, 0, 780);
  grd.addColorStop(0, 'rgba(120,98,66,0.0)');
  grd.addColorStop(0.6, 'rgba(126,104,66,0.30)');
  grd.addColorStop(1, 'rgba(20,16,12,0.0)');
  g.fillStyle = grd; g.fillRect(0, 540, W, 300);
  g.restore();
  lightStreak(g, W * 0.55, 700, 1500, -0.10, { a: 0.4, w: 40 });
  cam(g, { z: 1.02 + 0.05 * p, dy: -10 * p });
  drawBone(g, W / 2, 640, 640, 1, t);
  softGlow(g, W / 2 - 190, 640, 220, '255,214,150', 0.25);
  // 说明卡
  cardBlock(g, 118, 742, 470, 132, { tag: 'ISHANGO BONE · C. 20000 BCE' });
  text(g, '伊尚戈骨', 134, 800, { size: 30, weight: 800, color: '#f0e8d8', align: 'left', glow: 10 });
  text(g, '刻着计数刻痕的骨头', 134, 840, { size: 17, weight: 500, color: 'rgba(226,210,186,0.72)', align: 'left', glow: 6 });
  // 右侧编号
  text(g, '05', W - 80, 140, { size: 34, weight: 800, color: '#d8b273', align: 'right', glow: 10, font: FONT_EN });
  dust(g, t, { n: 80, seed: 11, alpha: 0.5 });
}

// ---------------------------------------------------------------- 5. 36 / 骨刻
function mTally36(g, t, p) {
  bgStone(g, t, { warm: 0.8, dark: 0.55, cy: 0.5 });
  ghostWord(g, '36', W * 0.5, 430, 620, { a: 0.14, blur: 26 });
  // 左上方小块
  panel(g, 60, 360, 300, 84, { alpha: 0.5 });
  caps(g, 'TALLY MARKS · 4 PER NOTCH', 76, 386, { size: 11, ls: 2 });
  ruled(g, 76, 404, 250, 5, { lh: 6 });
  panel(g, 60, 452, 300, 74, { alpha: 0.4 });
  caps(g, 'ISHANGO · 168 MARKS', 76, 476, { size: 11, ls: 2 });
  // 右侧信息块
  panel(g, W - 420, 470, 360, 96, { alpha: 0.5 });
  caps(g, 'TALLY · BASE ONE', W - 404, 496, { size: 11, ls: 2.2 });
  ruled(g, W - 404, 516, 320, 6, { lh: 6 });
  // 骨头与火花
  cam(g, { z: 1.0 + 0.06 * p });
  softGlow(g, W / 2 - 40, 560, 260, '255,206,140', 0.4);
  drawBone(g, W / 2, 560, 720, 1, t);
  g.save(); g.globalCompositeOperation = 'lighter';
  const r = mulberry(51);
  for (let i = 0; i < 60; i++) {
    const a = r() * 6.28, d = 30 + r() * 190;
    const x = W / 2 - 40 + Math.cos(a) * d, y = 470 + Math.sin(a) * d * 0.6;
    g.globalAlpha = 0.5 * (1 - p) * (0.4 + 0.6 * r());
    g.drawImage(TEX.dust, x - 6, y - 6, 12, 12);
  }
  g.restore();
  // 顶部时间码块
  caps(g, 'T 00:09.600 · MARKS 168', 60, 268, { size: 12, ls: 2.4 });
  dust(g, t, { n: 70, seed: 13, alpha: 0.45 });
}

// ---------------------------------------------------------------- 6. LINE / DAYS
function mDayLine(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.7, dark: 0.55, cy: 0.45 });
  ghostWord(g, o.word || 'LINE', W * 0.42, 300, 430, { a: 0.2, blur: 8, align: 'center' });
  ghostWord(g, o.word2 || 'TALLY', W * 0.34, 470, 420, { a: 0.16, blur: 10, color: '#d8a85c' });
  // 鹅卵石计数行
  const rows = 3, cols = 34;
  for (let r0 = 0; r0 < rows; r0++) {
    for (let i = 0; i < cols; i++) {
      const x = 90 + i * 45 + (r0 % 2) * 12, y = 420 + r0 * 62;
      const ph = (i * 13 + r0 * 31) % 17;
      const on = i / cols < 0.15 + 0.85 * clamp(p * 1.4);
      g.save();
      g.globalAlpha = on ? 0.85 : 0.22;
      g.fillStyle = on ? '#cdbfa4' : '#5b5346';
      g.beginPath(); g.ellipse(x, y + Math.sin(ph + t * 1.5) * 1.2, 13, 10, 0, 0, 6.2832); g.fill();
      if (on) { g.globalAlpha = 0.25; g.fillStyle = '#fff3d8'; g.beginPath(); g.ellipse(x - 3, y - 3, 6, 4, 0, 0, 6.2832); g.fill(); }
      g.restore();
    }
  }
  // 金线扫过
  const sx = lerp(-100, W + 100, smooth(clamp(p * 1.15)));
  glowLine(g, [[-50, 700], [sx, 700]], { w: 5, color: '#ffd08a', glow: 36 });
  glowDot(g, sx, 700, 6, { a: 1 });
  softGlow(g, sx, 700, 210, '255,190,110', 0.36);
  // DAYS 计数器
  const day = Math.floor(clamp(p * 1.4) * 99);
  text(g, `${String(day).padStart(2, '0')}`, 1250, 620, { size: 74, weight: 800, color: '#e9c07a', font: FONT_EN, glow: 20, ls: 2 });
  caps(g, 'DAYS', 1140, 566, { size: 13, ls: 3.4, color: 'rgba(230,200,150,0.75)' });
  panel(g, 1090, 672, 300, 76, { alpha: 0.4 });
  caps(g, 'EACH DAY · ONE NOTCH', 1104, 700, { size: 10.5, ls: 2 });
  text(g, '一道 · 一天', 1104, 726, { size: 15, weight: 600, color: 'rgba(230,214,186,0.75)', align: 'left', glow: 5 });
  // 顶部时间码
  caps(g, `T 00:${(12 + p * 4.8).toFixed(2).padStart(5, '0')} · BAR ${(5 + p * 2).toFixed(2)}`, 60, 268, { size: 12, ls: 2.2 });
  dust(g, t, { n: 70, seed: 17, alpha: 0.45 });
}

// ---------------------------------------------------------------- 7. 勾股 3-4-5
function mTri345(g, t, p, o = {}) {
  bgStone(g, t, { warm: 1.0, dark: 0.3, cy: 0.48, rad: 1.0, cx: 0.45 });
  cam(g, { z: 1.0 + 0.04 * p, dx: 6 * p });
  // 巨石背面虚字
  ghostWord(g, o.ghost || 'PYTHA', 420, 640, 560, { a: 0.16, blur: 30, weight: 900, ls: 20 });
  softGlow(g, 300, 520, 460, '255,196,116', 0.22);

  const s = 46;
  const A = [640, 322], B = [640, 322 + 3 * s], C = [640 + 4 * s, 322 + 3 * s];
  // 3x3（竖边左侧）
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) cellSq(g, A[0] - 3 * s + i * s, A[1] + j * s, s);
  // 4x4（横边下方）
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) cellSq(g, B[0] + i * s, B[1] + j * s, s);
  // 5x5 挂在斜边上
  const u = [0.8, 0.6], n = [0.6, -0.8];
  g.save();
  g.translate(A[0], A[1]);
  g.transform(u[0], u[1], n[0], n[1], 0, 0);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) cellSq(g, i * s, j * s, s);
  g.restore();
  // 三角形金线
  glowLine(g, [A, B, C, A], { w: 4, color: '#ffd795', glow: 30, close: true });
  // 直角标记
  glowLine(g, [[B[0], B[1] - 13], [B[0] + 13, B[1] - 13], [B[0] + 13, B[1]]], { w: 2.2, color: '#ffe4b4', glow: 12 });
  // 数字
  text(g, '3', A[0] - 3 * s - 24, A[1] + 3 * s * 0.5, { size: 42, weight: 800, color: '#fbf4e4', glow: 16 });
  text(g, '4', B[0] + 2 * s, B[1] + 4 * s + 40, { size: 42, weight: 800, color: '#fbf4e4', glow: 16 });
  // 斜边方格里斜着写 5
  text(g, '5', A[0] + u[0] * 2.5 * s + n[0] * 2.5 * s, A[1] + u[1] * 2.5 * s + n[1] * 2.5 * s,
    { size: 44, weight: 800, color: '#fbf4e4', glow: 18 });

  // 左上发光方块图标
  g.save();
  for (let i = 0; i < 3; i++) {
    glowLine(g, [[90 - i * 4, 424 - i * 4], [262 + i * 4, 424 - i * 4], [262 + i * 4, 596 + i * 4], [90 - i * 4, 596 + i * 4]],
      { w: 3.2 - i * 0.8, color: '#ffd9a0', glow: 40, close: true, alpha: 0.9 - i * 0.25 });
  }
  glowLine(g, [[136, 470], [216, 470], [216, 550], [136, 550]], { w: 1.6, color: '#ffe9c0', glow: 16, close: true, alpha: 0.7 });
  softGlow(g, 176, 510, 230, '255,206,140', 0.55);
  caps(g, '拼补 · a² + b²', 90, 648, { size: 12, ls: 2.2, color: 'rgba(240,220,186,0.85)' });
  text(g, '两个小方块 = 一个大方块', 90, 676, { size: 15, weight: 600, color: 'rgba(240,220,186,0.7)', align: 'left', glow: 5 });
  g.restore();

  // 右侧公式
  text(g, '3² + 4² = 5²', 1268, 286, { size: 64, weight: 800, color: '#fdf7e8', glow: 28, font: FONT_EN, ls: 1 });
  text(g, '9 + 16 = 25', 1268, 356, { size: 48, weight: 700, color: '#efb862', glow: 20, font: FONT_EN, ls: 3 });
  caps(g, 'THREE AND FOUR AND FIVE', 1268, 404, { size: 11, ls: 2.6, color: 'rgba(234,214,182,0.5)' });

  // 右下泥板卡
  if (o.table !== false) {
    panel(g, 1120, 620, 470, 330, { fill: 'rgba(14,11,8,0.72)' });
    text(g, 'PLIMPTON 322', 1140, 656, { size: 17, weight: 700, color: '#e6c58c', align: 'left', glow: 8, font: FONT_EN, ls: 2 });
    text(g, '普林顿 322 泥板 · 15行4列', 1140, 686, { size: 15, weight: 600, color: 'rgba(226,208,182,0.7)', align: 'left', glow: 4 });
    for (let r0 = 0; r0 < 15; r0++) for (let c0 = 0; c0 < 4; c0++) {
      const x = 1146 + c0 * 108, y = 706 + r0 * 15;
      const ww = 40 + ((r0 * 7 + c0 * 13) % 40);
      g.fillStyle = (r0 + c0) % 3 ? 'rgba(214,200,176,0.45)' : 'rgba(120,108,92,0.5)';
      g.fillRect(x, y, ww, 7);
    }
  }
  dust(g, t, { n: 110, seed: 23, alpha: 0.6 });
}

function cellSq(g, x, y, s, rot = 0, ox = 0, oy = 0) {
  g.save();
  if (rot) { g.translate(ox, oy); g.rotate(rot); g.translate(-ox, -oy); }
  const gr = g.createLinearGradient(x, y, x + s, y + s);
  gr.addColorStop(0, 'rgba(206,168,84,0.92)');
  gr.addColorStop(0.55, 'rgba(176,138,62,0.95)');
  gr.addColorStop(1, 'rgba(140,106,44,0.95)');
  g.fillStyle = gr;
  g.fillRect(x + 1.2, y + 1.2, s - 2.4, s - 2.4);
  g.strokeStyle = 'rgba(240,220,170,0.55)'; g.lineWidth = 1.1;
  g.strokeRect(x + 1.2, y + 1.2, s - 2.4, s - 2.4);
  g.restore();
}

// ---------------------------------------------------------------- 8. 欧几里得
function mEuclid(g, t, p) {
  bgStone(g, t, { warm: 0.55, dark: 0.5, cy: 0.55 });
  ghostWord(g, 'CIRCLE', 520, 380, 380, { a: 0.14, blur: 26 });
  ghostWord(g, 'EUCLID', 980, 300, 300, { a: 0.2, blur: 10 });
  ghostWord(g, 'CLEAN LIGHT', 520, 520, 190, { a: 0.12, blur: 18, ls: 2 });
  // 右上方光锥
  g.save(); g.globalCompositeOperation = 'lighter';
  const cx = 1210, cy = 300;
  for (let i = 0; i < 26; i++) {
    const a = -0.5 + i * 0.04;
    g.strokeStyle = `rgba(255,214,158,${0.05 + 0.09 * Math.sin(i * 1.7 + t)})`;
    g.lineWidth = 1.4;
    g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 420, cy + Math.sin(a) * 420); g.stroke();
  }
  g.restore();
  softGlow(g, cx, cy, 260, '255,214,150', 0.6);
  // 几何构图（圆 + 内接三角形 + 辅助圆）
  const gx = 620, gy = 560;
  glowCircle(g, gx, gy, 220, { w: 2.4, color: '#e8c98e', glow: 18, alpha: 0.85 });
  glowCircle(g, gx, gy, 150, { w: 1.4, color: '#c9a878', glow: 10, alpha: 0.5 });
  glowCircle(g, gx, gy, 300, { w: 1.2, color: '#b09068', glow: 8, alpha: 0.35, dash: [2, 9] });
  const tri = [[gx, gy - 220], [gx + 190, gy + 110], [gx - 190, gy + 110]];
  glowLine(g, [...tri, tri[0]], { w: 3.2, color: '#f4d8a8', glow: 26, close: true });
  g.save(); g.globalAlpha = 0.5;
  glowLine(g, [[gx - 300, gy], [gx + 300, gy]], { w: 1.4, color: '#e0c090', glow: 8 });
  glowLine(g, [[gx, gy - 300], [gx, gy + 300]], { w: 1.4, color: '#e0c090', glow: 8 });
  g.restore();
  // 左中说明卡
  panel(g, 70, 300, 330, 76, { alpha: 0.5 });
  caps(g, 'ELEMENTS · BOOK I', 86, 328, { size: 11, ls: 2.4 });
  text(g, '五条公理 撑起两千年', 86, 356, { size: 15, weight: 600, color: 'rgba(230,216,192,0.8)', align: 'left', glow: 5 });
  // 右侧人名
  text(g, 'EUCLID', 1330, 300, { size: 86, weight: 900, color: '#f0e8d6', align: 'right', glow: 26, font: FONT_EN, ls: 6 });
  caps(g, '约公元前 300 年 · 亚历山大', 1330, 356, { size: 12, ls: 2.4, color: 'rgba(226,208,180,0.55)' });
  dust(g, t, { n: 90, seed: 29, alpha: 0.5 });
}

// ---------------------------------------------------------------- 9. 门
function mDoor(g, t, p) {
  bgStone(g, t, { warm: 0.9, dark: 0.42, cy: 0.5 });
  const cx = W / 2, cy = 520, w = 420, h = 560;
  const kz = 1 + 0.06 * p;
  cam(g, { z: kz });
  // 门框三层透视
  for (let i = 3; i >= 1; i--) {
    const s = 1 + i * 0.14;
    glowLine(g, [[cx - w * s / 2, cy - h * s / 2], [cx + w * s / 2, cy - h * s / 2],
      [cx + w * s / 2, cy + h * s / 2], [cx - w * s / 2, cy + h * s / 2]],
      { w: 3.2 - i * 0.6, color: '#ffd9a2', glow: 30, alpha: 0.8 - i * 0.18, close: true });
  }
  // 内部光幕
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 340);
  gr.addColorStop(0, 'rgba(255,244,222,0.95)');
  gr.addColorStop(0.35, 'rgba(255,222,170,0.55)');
  gr.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = gr; g.fillRect(cx - 320, cy - 360, 640, 720);
  g.restore();
  // 门缝竖线
  glowLine(g, [[cx, cy - h / 2], [cx, cy + h / 2]], { w: 2, color: '#fff0d0', glow: 24, alpha: 0.9 });
  // 底部反射
  g.save(); g.globalAlpha = 0.35;
  const gr2 = g.createLinearGradient(0, cy + h / 2, 0, cy + h / 2 + 220);
  gr2.addColorStop(0, 'rgba(255,214,158,0.5)'); gr2.addColorStop(1, 'rgba(255,214,158,0)');
  g.fillStyle = gr2; g.fillRect(cx - 260, cy + h / 2, 520, 220);
  g.restore();
  dust(g, t, { n: 120, seed: 31, alpha: 0.6 });
}

// ---------------------------------------------------------------- 10. 大字号
function mBigType(g, t, p, o = {}) {
  const light = o.light;
  const fam = wd => [...wd].some(isCJK) ? FONT_CN : FONT_EN;
  if (light) bgPaper(g, t, { cx: 0.5, cy: 0.45 }); else bgStone(g, t, { warm: 0.7, dark: 0.55 });
  const cx = W / 2, cy = o.cy || 430;
  if (o.words) {
    o.words.forEach((wd, i) => {
      const y = cy + i * (o.lh || 150);
      const blur = 8 + (o.blur || 0);
      if (o.dark) {
        g.save(); g.globalAlpha = 0.95; g.filter = `blur(${blur * 0.5}px)`;
        g.fillStyle = o.color || '#e8c37a';
        g.font = `900 ${o.size || 150}px ${fam(wd.t)}`; g.letterSpacing = '2px';
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(wd.t, cx, y); g.filter = 'none'; g.restore();
        text(g, wd.t, cx, y, { size: o.size || 150, weight: 900, color: o.color || '#eec98a', glow: 30, font: fam(wd.t), ls: 2 });
      } else {
        g.save(); g.globalAlpha = 0.9; g.filter = `blur(${blur}px)`;
        g.fillStyle = o.color || '#f6efdf';
        g.font = `900 ${o.size || 150}px ${fam(wd.t)}`;
        g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(wd.t, cx, y);
        g.filter = 'none'; g.restore();
        text(g, wd.t, cx, y, { size: o.size || 150, weight: 900, color: o.color || '#f7f1e1', glow: 26, font: fam(wd.t), ls: 2 });
      }
      if (wd.cn) text(g, wd.cn, cx + (o.cnDx || 0), y - (o.size || 150) * 0.62, { size: (o.size || 150) * 0.22, weight: 700, color: '#f0dfbe', glow: 14 });
    });
  }
  if (o.note) caps(g, o.note, cx, cy + (o.words ? o.words.length * (o.lh || 150) - 40 : 100), { size: 13, ls: 3, color: 'rgba(230,212,180,0.5)' });
  dust(g, t, { n: 70, seed: 33, alpha: 0.4 });
}

// ---------------------------------------------------------------- 11. 刘徽（亮纸）
function mHuigeng(g, t, p, o = {}) {
  bgPaper(g, t, { cx: 0.45, cy: 0.5 });
  cam(g, { z: 1 + 0.02 * p });
  const cx = 620, cy = 520, R = 230;
  // 圆 + 内接多边形
  g.save();
  g.strokeStyle = 'rgba(46,42,36,0.85)'; g.lineWidth = 2.2;
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke();
  const n = o.n || 6;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  g.strokeStyle = 'rgba(38,34,28,0.9)'; g.lineWidth = 2.4;
  g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.closePath(); g.stroke();
  // 半径与弦
  g.strokeStyle = 'rgba(70,64,56,0.4)';
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(pts[0][0], pts[0][1]); g.stroke();
  g.beginPath(); g.moveTo(cx - R, cy); g.lineTo(cx + R, cy); g.stroke();
  // 弓形填充
  g.globalAlpha = 0.16; g.fillStyle = '#8a7a5a';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < n; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath(); g.fill();
  g.restore();
  // 尺寸标注
  g.save(); g.strokeStyle = 'rgba(60,55,48,0.5)'; g.setLineDash([4, 4]); g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + R * 0.86, cy); g.stroke(); g.restore();
  caps(g, o.label || 'INSCRIBED POLYGON · 6', cx - R, cy + R + 34, { size: 12, ls: 2.2, color: 'rgba(52,48,42,0.6)' });
  // 竖排小字（右侧）
  const vert = o.vert || ['割之弥细', '所失弥少', '割之又割'];
  g.save(); g.fillStyle = 'rgba(40,36,30,0.8)'; g.font = `600 23px ${FONT_CN}`; g.textAlign = 'center'; g.textBaseline = 'top';
  vert.forEach((s, i) => { for (let k = 0; k < s.length; k++) g.fillText(s[k], 940 + i * 40, 300 + k * 27); });
  g.restore();
  // 右侧数字
  text(g, o.num || '6', 1290, 400, { size: 92, weight: 800, color: '#2b2722', align: 'right', glow: 0, font: FONT_EN });
  text(g, o.num2 || '3.000000', 1290, 486, { size: 40, weight: 600, color: '#3a352e', align: 'right', glow: 0, font: FONT_EN });
  if (o.num3) text(g, o.num3, 1290, 546, { size: 26, weight: 500, color: '#5a5348', align: 'right', glow: 0, font: FONT_EN });
  caps(g, 'POLYGON → π', 1290, 596, { size: 11, ls: 2.4, color: 'rgba(52,48,42,0.5)' });
  text(g, '刘徽', 1300, 760, { size: 56, weight: 800, color: '#2b2722', align: 'right', glow: 0 });
  caps(g, 'LIU HUI · 263 AD', 1300, 800, { size: 11, ls: 2.6, align: 'right', color: 'rgba(52,48,42,0.55)' });
  // 左下人名
  text(g, '刘徽', 150, 930, { size: 44, weight: 800, color: '#26221d', align: 'left', glow: 0 });
  caps(g, 'LIU HUI · 263 AD', 154, 872, { size: 12, ls: 2.6, color: 'rgba(50,46,40,0.5)' });
}

// ---------------------------------------------------------------- 12. 数轴 / π
function mPiLine(g, t, p) {
  bgPaper(g, t, { cx: 0.5, cy: 0.5 });
  const y = 560;
  // 主线
  g.save(); g.strokeStyle = 'rgba(40,36,30,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(150, y); g.lineTo(W - 150, y); g.stroke(); g.restore();
  // 刻度
  for (let i = 0; i <= 60; i++) {
    const x = 150 + i * (W - 300) / 60;
    const a = i % 10 === 0 ? 16 : i % 5 === 0 ? 10 : 5;
    g.save(); g.strokeStyle = 'rgba(40,36,30,0.55)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x, y - a); g.lineTo(x, y + a); g.stroke(); g.restore();
  }
  // 高亮 3.14159 的位置
  const px = lerp(150, W - 150, (3.14159 - 2.5) / 1.4);
  glowLine(g, [[px, y - 60], [px, y + 60]], { w: 2.4, color: '#c98a3a', glow: 14 });
  text(g, 'π', px, y - 92, { size: 34, weight: 700, color: '#8a5a22', glow: 0, font: FONT_SERIF });
  // 左侧大数字
  text(g, '3.141', 300, 300, { size: 168, weight: 800, color: '#2a2620', align: 'left', glow: 0, font: FONT_EN, ls: 2 });
  caps(g, 'CIRCUMFERENCE ÷ DIAMETER', 306, 400, { size: 13, ls: 3.2, color: 'rgba(52,48,42,0.5)' });
  // 右侧注释块
  g.save(); g.fillStyle = 'rgba(52,48,42,0.55)'; g.font = `500 16px ${FONT_CN}`; g.textAlign = 'right';
  g.fillText('圆周长 ÷ 直径 = 3.14159…', W - 160, 300);
  g.fillText('割圆术 · 3072 边', W - 160, 330);
  g.restore();
  caps(g, 'ARCHIMEDES 3.1408 < π < 3.1429', W - 160, 370, { size: 12, ls: 2.6, color: 'rgba(52,48,42,0.45)' });
  dust(g, t, { n: 30, seed: 41, alpha: 0.35 });
}

// ---------------------------------------------------------------- 13. 零 / zerophil
function mZero(g, t, p) {
  skyBase(g, t, { glow: 0.25, rad: 0.9, stars: 260, seed: 61 });
  const cx = W / 2 + 6, cy = 466;
  softGlow(g, cx, cy, 430, '255,206,132', 0.32);
  // 文字 zerophil（在环后面）
  g.save();
  g.font = `italic 600 116px ${FONT_SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#f6efdf'; g.shadowColor = '#ffcf8a'; g.shadowBlur = 34;
  g.globalAlpha = 0.95;
  g.fillText('zerophil', cx + 8, cy + 8);
  g.restore();
  // 发光 O（压在上面）
  g.save();
  g.globalCompositeOperation = 'lighter';
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.2);
  for (let i = 0; i < 3; i++) {
    g.beginPath(); g.ellipse(cx, cy, 205 + i * 10, 250 + i * 12, 0, 0, 6.2832);
    g.strokeStyle = `rgba(255,${232 - i * 10},${176 - i * 20},${(0.9 - i * 0.26) * pulse})`;
    g.lineWidth = 17 - i * 4.5; g.shadowColor = '#ffcf8a'; g.shadowBlur = 58;
    g.stroke();
  }
  g.shadowBlur = 0;
  g.restore();
  caps(g, 'FIBONACCI · 1202', cx, cy + 250, { size: 13, ls: 4, color: 'rgba(236,214,178,0.55)' });
  // 右侧零的来历
  panel(g, W - 430, 700, 360, 90, { alpha: 0.45 });
  caps(g, 'ZERO · 628 AD · BRAHMAGUPTA', W - 414, 726, { size: 10.5, ls: 2.2 });
  text(g, '空无一物，也是一个数', W - 414, 762, { size: 15, weight: 600, color: 'rgba(230,214,188,0.75)', align: 'left', glow: 5 });
}

// ---------------------------------------------------------------- 14. 星图 / 网格
function mGlobe(g, t, p, o = {}) {
  skyBase(g, t, { glow: 0.4, stars: 300, seed: 71, rad: 1.0 });
  const cx = 640, cy = 520, R = 210;
  // 网格球
  g.save(); g.globalAlpha = 0.55; g.strokeStyle = 'rgba(226,206,170,0.5)'; g.lineWidth = 1.1;
  for (let i = 1; i < 7; i++) {
    g.beginPath(); g.ellipse(cx, cy, R * Math.sin(i * Math.PI / 7), R, 0, 0, 6.2832); g.stroke();
  }
  for (let i = 1; i < 7; i++) {
    const k = i * 2 * Math.PI / 7;
    g.beginPath(); g.ellipse(cx, cy, R, R * Math.abs(Math.cos(k)) || 2, 0, 0, 6.2832); g.stroke();
  }
  g.restore();
  glowCircle(g, cx, cy, R, { w: 2, color: '#e8cfa0', glow: 18, alpha: 0.8 });
  glowDot(g, cx + R * 0.5, cy - R * 0.4, 4, { a: 0.9 });
  glowCircle(g, cx + 380, cy + 40, 26, { w: 2.4, color: '#ffd9a0', glow: 22 });
  glowDot(g, cx + 380, cy + 40, 3, { a: 0.8 });
  // 卡片
  cardBlock(g, 140, 690, 430, 110, { tag: 'ORIGIN · 计数' });
  text(g, '一，二，三 · 从这里开始', 158, 748, { size: 22, weight: 700, color: '#eee4d2', align: 'left', glow: 8 });
  caps(g, 'THE FIRST NUMBERS', 158, 778, { size: 11, ls: 2.4 });
  dust(g, t, { n: 70, seed: 73, alpha: 0.4 });
}

// ---------------------------------------------------------------- 15. 几何星图 / 印度数字
function mGeoMap(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.6, dark: 0.55, cy: 0.5 });
  // 底图：星座连线
  const r = mulberry(101);
  g.save(); g.globalAlpha = 0.30; g.strokeStyle = 'rgba(230,214,186,0.5)'; g.lineWidth = 1;
  const pts = [];
  for (let i = 0; i < 22; i++) pts.push([80 + r() * (W - 160), 200 + r() * 600]);
  pts.forEach((q, i) => { if (i) glowLine(g, [pts[i - 1], q], { w: 1, color: '#d8c49e', glow: 0, alpha: 0.25 }); });
  g.restore();
  // 金色横条 + 数字
  const bx = 180, by = 560, bw = 1290, bh = 96;
  panel(g, bx, by, bw, bh, { fill: 'rgba(10,9,9,0.55)' });
  const nums = o.nums || ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
  nums.forEach((s, i) => {
    const x = bx + 70 + i * (bw - 140) / (nums.length - 1);
    text(g, s, x, by + bh / 2, { size: 54, weight: 700, color: '#ffe2ac', glow: 24, font: FONT_EN });
    text(g, String(i + 1), x, by + bh + 34, { size: 20, weight: 600, color: 'rgba(230,210,180,0.55)', glow: 4, font: FONT_EN });
  });
  // 顶部/侧边标注
  caps(g, o.top || 'BRAHMAGUPTA · 628', 60, 200, { size: 12, ls: 3 });
  text(g, o.title || 'SAHAJA', W - 80, 250, { size: 74, weight: 800, color: '#e9c78f', align: 'right', glow: 24, font: FONT_EN, ls: 6 });
  text(g, o.sub || '写成一步步 世界都能读', 200, 700, { size: 20, weight: 600, color: 'rgba(234,220,198,0.8)', align: 'left', glow: 8 });
  dust(g, t, { n: 60, seed: 103, alpha: 0.4 });
}

// ---------------------------------------------------------------- 16. 方程式
function mAlgebraEq(g, t, p, o = {}) {
  bgPaper(g, t, { cx: 0.5, cy: 0.47 });
  ghostWord(g, 'X', 300, 500, 620, { a: 0.10, blur: 30, font: FONT_SERIF });
  if (o.four) {
    // 四个发光方块
    const cx = 720, cy = 470, s = 74;
    g.save(); g.strokeStyle = 'rgba(52,46,38,0.65)'; g.lineWidth = 2;
    for (let i = 0; i <= 2; i++) {
      g.beginPath(); g.moveTo(cx - s * 1.2 + i * s * 1.2, cy - s * 1.2); g.lineTo(cx - s * 1.2 + i * s * 1.2, cy + s * 1.2); g.stroke();
      g.beginPath(); g.moveTo(cx - s * 1.2, cy - s * 1.2 + i * s * 1.2); g.lineTo(cx + s * 1.2, cy - s * 1.2 + i * s * 1.2); g.stroke();
    }
    g.fillStyle = 'rgba(60,52,40,0.14)';
    g.fillRect(cx - s * 0.2, cy - s * 1.2, s * 1.4, s * 2.4);
    g.fillRect(cx - s * 1.2, cy - s * 0.2, s * 2.4, s * 1.4);
    g.restore();
    // 右侧推导
    text(g, 'x² + 10x = 39', 1300, 340, { size: 42, weight: 700, color: '#2b2722', align: 'right', glow: 0, font: FONT_SERIF });
    text(g, 'x² + 10x + 25 = 39 + 25', 1300, 404, { size: 30, weight: 600, color: '#6a5a44', align: 'right', glow: 0, font: FONT_SERIF });
    text(g, '(x + 5)² = 64', 1300, 462, { size: 34, weight: 700, color: '#3a3228', align: 'right', glow: 0, font: FONT_SERIF });
    text(g, 'x = 3', 1300, 540, { size: 46, weight: 800, color: '#b0532a', align: 'right', glow: 0, font: FONT_SERIF });
    // 左侧说明
    caps(g, 'AL-KHWARIZMI · 820', 130, 760, { size: 12, ls: 2.6 });
    text(g, '拼成正方形，解出未知数', 130, 800, { size: 18, weight: 600, color: 'rgba(232,216,192,0.8)', align: 'left', glow: 6 });
  } else {
    text(g, 'x² + 10x = 39', W / 2, 420, { size: 64, weight: 600, color: '#2b2722', glow: 0, font: FONT_SERIF, ls: 1 });
    caps(g, 'THE UNKNOWN · 未知数', W / 2, 500, { size: 12, ls: 3.2, color: 'rgba(56,48,40,0.55)' });
    glowDot(g, W / 2 + 300, 420, 3, { a: 0.8 });
  }
  dust(g, t, { n: 70, seed: 107, alpha: 0.45 });
}

// ---------------------------------------------------------------- 17. 天空网格
function mGridSky(g, t, p) {
  skyBase(g, t, { glow: 0.3, stars: 280, seed: 91 });
  // 透视网格铺向地平线
  g.save();
  const hz = 520;
  g.strokeStyle = 'rgba(244,222,184,0.34)'; g.lineWidth = 1.3;
  for (let i = -12; i <= 12; i++) {
    const x = W / 2 + i * 120;
    g.beginPath(); g.moveTo(W / 2 + i * 26, hz); g.lineTo(x * 1.6 - W * 0.3, H + 200); g.stroke();
  }
  for (let i = 0; i < 14; i++) {
    const yy = hz + Math.pow(i / 13, 2.1) * 620;
    g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
  }
  g.restore();
  glowLine(g, [[0, hz], [W, hz]], { w: 2, color: '#ffd9a2', glow: 26, alpha: 0.75 });
  softGlow(g, W / 2, hz, 460, '255,208,150', 0.30);
  caps(g, 'CARTESIAN · 1637', W / 2, 300, { size: 13, ls: 4 });
  text(g, 'x', W - 130, hz - 24, { size: 30, weight: 700, color: '#f0dfc0', glow: 10, font: FONT_SERIF });
  text(g, 'y', 120, hz - 210, { size: 30, weight: 700, color: '#f0dfc0', glow: 10, font: FONT_SERIF });
  dust(g, t, { n: 60, seed: 93, alpha: 0.4 });
}

// ---------------------------------------------------------------- 18. 坐标系曲线
function mCalcGrid(g, t, p) {
  bgStar(g, t, { glow: 0.2, rad: 1.2 });
  // 蓝色网格平面
  g.save();
  g.fillStyle = 'rgba(10,26,44,0.72)'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(96,150,200,0.22)'; g.lineWidth = 1;
  for (let x = 0; x < W; x += 62) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = 60; y < H; y += 62) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.strokeStyle = 'rgba(150,196,232,0.45)'; g.lineWidth = 1.6;
  const ay = 700, ax = 300;
  g.beginPath(); g.moveTo(0, ay); g.lineTo(W, ay); g.stroke();
  g.beginPath(); g.moveTo(ax, 60); g.lineTo(ax, H - 80); g.stroke();
  g.restore();
  // 曲线 y = x^2 之类
  const pts = [];
  const reach = clamp(p * 1.25);
  for (let i = 0; i <= 80; i++) {
    const u = i / 80;
    if (u > reach) break;
    const x = lerp(ax + 10, W - 120, u);
    const y = ay - Math.pow(u, 2.2) * 540;
    pts.push([x, y]);
  }
  if (pts.length > 1) glowLine(g, pts, { w: 3.6, color: '#8fe4ff', glow: 26 });
  // 切线
  const k = smooth(clamp(p * 1.1));
  const tx = lerp(ax, W - 200, k);
  const ty = ay - Math.pow((tx - ax - 10) / (W - 120 - ax - 10), 2.2) * 540;
  glowLine(g, [[tx - 260, ty + 90], [tx + 260, ty - 90]], { w: 2, color: '#ffd08a', glow: 18, alpha: 0.9 });
  glowDot(g, tx, ty, 4, { a: 1 });
  // 读数
  readout(g, 'Δy / Δx', '0.25', 1180, 300, { w: 200, vsize: 40, color: '#d8f0ff' });
  readout(g, 'f(x)', '2.250', 1180, 366, { w: 200, vsize: 40, color: '#d8f0ff' });
  caps(g, 'NEWTON · FLUXIONS · 1665', 60, 140, { size: 12, ls: 2.6 });
  caps(g, 'INSTANT → INFINITESIMAL', W - 60, 140, { size: 12, ls: 2.6 });
}

// ---------------------------------------------------------------- 19. 正弦 RISE/FALL
function mSine(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.45, dark: 0.5, cy: 0.5 });
  ctxGrid(g, 100, 200, W - 200, 620);
  text(g, 'RISE', 470, 210, { size: 92, weight: 900, color: '#f6c96e', glow: 28, font: FONT_EN, ls: 4 });
  text(g, 'FALL', 950, 530, { size: 92, weight: 900, color: '#f6c96e', glow: 28, font: FONT_EN, ls: 4 });
  // 正弦曲线
  const pts = [];
  for (let i = 0; i <= 140; i++) {
    const u = i / 140;
    const x = lerp(120, W - 120, u);
    const y = 470 - Math.sin(u * Math.PI * 4) * 150;
    pts.push([x, y]);
  }
  const drawTo = Math.floor(pts.length * clamp(p * 1.4));
  if (drawTo > 2) glowLine(g, pts.slice(0, drawTo), { w: 3.2, color: '#ffdc9e', glow: 26 });
  // 两个波瓣填充（上金下蓝，和原片一致）
  g.save(); g.globalAlpha = 0.42;
  for (let k = 0; k < 4; k++) {
    const a = Math.floor(pts.length * k / 4), b = Math.floor(pts.length * (k + 1) / 4);
    g.beginPath(); g.moveTo(pts[a][0], 470);
    for (let i = a; i <= Math.min(b, pts.length - 1); i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineTo(pts[Math.min(b, pts.length - 1)][0], 470); g.closePath();
    g.fillStyle = k % 2 ? 'rgba(70,150,210,0.42)' : 'rgba(240,196,120,0.5)';
    g.fill();
  }
  g.restore();
  caps(g, 'DERIVATIVE · SLOPE', 60, 140, { size: 12, ls: 2.6 });
  dust(g, t, { n: 60, seed: 111, alpha: 0.4 });
}

function ctxGrid(g, x, y, w, h) {
  g.save(); g.globalAlpha = 0.18; g.strokeStyle = 'rgba(226,206,170,0.5)'; g.lineWidth = 1;
  for (let i = 0; i <= 12; i++) { const xx = x + i * w / 12; g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + h); g.stroke(); }
  for (let i = 0; i <= 8; i++) { const yy = y + i * h / 8; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + w, yy); g.stroke(); }
  g.restore();
}

// ---------------------------------------------------------------- 20. 欧拉圆
function mEuler(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.35, dark: 0.45, cy: 0.5, rad: 0.9 });
  const cx = 660, cy = 540, R = 252;
  // 坐标轴
  g.save(); g.globalAlpha = 0.5; g.strokeStyle = 'rgba(226,210,180,0.55)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(cx - R - 90, cy); g.lineTo(cx + R + 90, cy); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - R - 90); g.lineTo(cx, cy + R + 90); g.stroke();
  g.restore();
  text(g, '1', cx + R + 30, cy + 6, { size: 26, weight: 700, color: '#eadcc0', glow: 8, font: FONT_EN });
  text(g, '-1', cx - R - 44, cy + 6, { size: 24, weight: 600, color: '#d6c6a8', glow: 6, font: FONT_EN });
  text(g, 'i', cx + 26, cy - R - 4, { size: 26, weight: 700, color: '#eadcc0', glow: 8, font: FONT_SERIF });
  glowCircle(g, cx, cy, R, { w: 2.2, color: '#e8c98e', glow: 20, alpha: 0.9 });
  // 向量
  const ang = o.ang !== undefined ? o.ang : -0.6 + p * 1.2;
  const vx = cx + Math.cos(ang) * R, vy = cy + Math.sin(ang) * R;
  glowLine(g, [[cx, cy], [vx, vy]], { w: 3, color: '#ffd9a0', glow: 22 });
  glowDot(g, vx, vy, 5, { a: 1 });
  glowDot(g, cx, cy, 3, { a: 0.9 });
  // 角度弧
  glowCircle(g, cx, cy, 54, { a0: 0, a1: ang, w: 2.4, color: '#ffcf8a', glow: 14 });
  text(g, o.angLabel || 'θ = 0.30', 1170, 300, { size: 34, weight: 700, color: '#ffd79a', glow: 16, font: FONT_EN, ls: 1 });
  // 欧拉公式
  if (o.formula) text(g, o.formula, 1010, 620, { size: 52, weight: 700, color: '#f6ebd6', glow: 22, font: FONT_SERIF, align: 'left' });
  // 大标题
  text(g, 'EULER', W - 70, 236, { size: 108, weight: 900, color: '#f4ecdc', align: 'right', glow: 30, font: FONT_EN, ls: 8 });
  caps(g, 'EULER · 1748 · 巴塞尔', W - 70, 300, { size: 12, ls: 2.6, color: 'rgba(230,214,188,0.55)' });
  if (o.extra) {
    caps(g, o.extra[0], 1290, 360, { size: 12, ls: 2.4 });
    caps(g, o.extra[1], 1290, 386, { size: 12, ls: 2.4 });
  }
  dust(g, t, { n: 60, seed: 113, alpha: 0.4 });
}

// ---------------------------------------------------------------- 21. 无穷
function mInfinity(g, t, p, o = {}) {
  if (o.white) bgPaper(g, t, { cx: 0.5, cy: 0.42 }); else bgStone(g, t, { warm: 0.4, dark: 0.5 });
  const cx = W / 2, cy = 480, s = 300;
  // ∞ 用两个圆代替的经典画法
  g.save();
  if (!o.white) g.globalCompositeOperation = 'lighter';
  const drawInf = (scale, alpha, width, bl) => {
    g.save(); g.translate(cx, cy); g.scale(scale, scale);
    g.beginPath();
    const R = s * 0.92;
    for (let i = 0; i <= 260; i++) {
      const u = i / 260 * 6.2832;
      const x = R * Math.sin(u);
      const y = R * Math.sin(u) * Math.cos(u) * 0.95;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = o.white ? `rgba(36,32,27,${alpha})` : `rgba(255,${238 - bl},${200 - bl},${alpha})`;
    g.lineWidth = width; g.shadowColor = o.white ? '#fff6e6' : '#ffcf8a'; g.shadowBlur = o.white ? 24 : 56;
    g.stroke(); g.restore();
  };
  drawInf(1, 0.95, 18, 0);
  drawInf(1.02, 0.5, 30, 30);
  g.restore();
  softGlow(g, cx, cy, 420, '255,206,140', o.white ? 0.2 : 0.32);
  if (o.label) {
    text(g, o.label, cx, 230, { size: 76, weight: 900, color: o.white ? '#2b2620' : '#f6efe0', glow: o.white ? 0 : 22, font: FONT_EN, ls: 4 });
    if (o.label2) text(g, o.label2, cx, 300, { size: 76, weight: 900, color: o.white ? '#c8402f' : '#e8b45e', glow: o.white ? 0 : 22, font: FONT_EN, ls: 4 });
  }
  if (o.note) caps(g, o.note, cx, 720, { size: 12.5, ls: 3, color: o.white ? 'rgba(52,48,42,0.5)' : 'rgba(230,212,180,0.5)' });
  dust(g, t, { n: 70, seed: 117, alpha: 0.4 });
}

// ---------------------------------------------------------------- 22. 高斯十七边形
function mGauss(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.5, cy: 0.5 });
  const cx = 620, cy = 540, R = 240;
  // 构造圆
  glowCircle(g, cx, cy, R, { w: 2, color: '#e8cfa0', glow: 16, alpha: 0.75 });
  glowCircle(g, cx, cy, R * 0.62, { w: 1.2, color: '#c8b090', glow: 8, alpha: 0.4, dash: [3, 8] });
  // 17 边形
  const n = 17, pts = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + i * 2 * Math.PI / n;
    pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]);
  }
  const upto = Math.ceil(n * clamp(p * 1.3));
  g.save(); g.globalAlpha = 0.95;
  g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
  if (upto >= n) g.closePath();
  g.strokeStyle = 'rgba(255,240,214,1)'; g.lineWidth = 3.4; g.shadowColor = '#ffd08a'; g.shadowBlur = 26;
  g.stroke(); g.restore();
  g.save(); g.globalAlpha = 0.4; g.strokeStyle = 'rgba(240,220,190,0.7)'; g.lineWidth = 1;
  pts.forEach(q => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(q[0], q[1]); g.stroke(); });
  g.restore();
  pts.forEach((q, i) => glowDot(g, q[0], q[1], i % 4 === 0 ? 3.2 : 2.2, { a: 0.9 }));
  glowCircle(g, cx, cy, 26, { w: 1.4, color: '#e8cfa0', glow: 10, alpha: 0.7 });
  text(g, 'GAUSS', W - 80, 236, { size: 118, weight: 900, color: '#f8f2e4', align: 'right', glow: 30, font: FONT_EN, ls: 6 });
  text(g, 'AGE 18', W - 80, 336, { size: 60, weight: 900, color: '#f0bc68', align: 'right', glow: 22, font: FONT_EN, ls: 6 });
  caps(g, '1796 · 正十七边形 · 尺规可作', W - 80, 392, { size: 12, ls: 2.4, color: 'rgba(236,220,192,0.65)' });
  caps(g, 'cos(2π/17) = ( -1 + √17 + √(34-2√17) + 2√(17+3√17-√(34-2√17)) ) / 16', W - 80, 430, { size: 9.5, ls: 0.5, color: 'rgba(232,214,186,0.45)' });
  dust(g, t, { n: 60, seed: 119, alpha: 0.4 });
}

// ---------------------------------------------------------------- 23. e^{iπ}+1=0
function mEiPi(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.3, dark: 0.45, cy: 0.5 });
  const cx = 560, cy = 520, R = 200;
  glowCircle(g, cx, cy, R, { w: 1.8, color: '#d8c8a8', glow: 14, alpha: 0.6 });
  g.save(); g.globalAlpha = 0.4; g.strokeStyle = 'rgba(226,210,180,0.6)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx - R - 60, cy); g.lineTo(cx + R + 60, cy); g.stroke();
  g.beginPath(); g.moveTo(cx, cy - R - 60); g.lineTo(cx, cy + R + 60); g.stroke(); g.restore();
  // 半圆弧 a = π
  const prog = smooth(clamp(p * (o.done ? 1 : 1.4)));
  glowCircle(g, cx, cy, R, { a0: Math.PI, a1: Math.PI - Math.PI * prog, w: 6, color: '#ffd9a2', glow: 34 });
  const ea = Math.PI - Math.PI * prog;
  glowDot(g, cx + Math.cos(ea) * R, cy - Math.sin(ea) * -1 * -1, 5, { a: 1 });
  glowDot(g, cx - R, cy, 5, { a: 0.9 });
  text(g, '−1', cx - R - 34, cy + 40, { size: 26, weight: 700, color: '#e8d8b8', glow: 10, font: FONT_EN });
  text(g, 'e', cx + R + 30, cy + 40, { size: 30, weight: 700, color: '#efe2c8', glow: 10, font: FONT_SERIF });
  // 公式
  text(g, o.done ? 'eⁱᵖ + 1 = 0' : 'eⁱᵖ + 1', 900, 420, { size: 96, weight: 700, color: '#f8f0dd', align: 'left', glow: 30, font: FONT_SERIF, ls: 2 });
  if (o.done) text(g, '= 0', 1290, 560, { size: 90, weight: 800, color: '#ffcf8a', align: 'left', glow: 30, font: FONT_SERIF });
  caps(g, 'THE MOST BEAUTIFUL EQUATION', 906, 500, { size: 12, ls: 3, color: 'rgba(232,214,186,0.5)' });
  dust(g, t, { n: 60, seed: 121, alpha: 0.4 });
}

// ---------------------------------------------------------------- 24. 伽罗瓦之夜
function mGalois(g, t, p) {
  skyBase(g, t, { glow: 0.15, rad: 0.8, stars: 240, seed: 123 });
  // 烛光
  const lx = 360, ly = 520;
  softGlow(g, lx, ly, 420, '255,196,110', 0.42);
  glowDot(g, lx, ly, 7, { a: 1 });
  g.save(); g.globalAlpha = 0.5;
  g.strokeStyle = 'rgba(255,214,158,0.5)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(lx - 8, ly + 10); g.lineTo(lx + 8, ly + 10); g.stroke(); g.restore();
  // 手稿卡
  const x = 640, y = 250, w = 430, h = 470;
  g.save();
  g.shadowColor = 'rgba(255,200,130,0.35)'; g.shadowBlur = 40;
  g.fillStyle = 'rgba(20,16,12,0.85)'; g.fillRect(x, y, w, h);
  g.restore();
  panel(g, x, y, w, h, { fill: 'rgba(0,0,0,0)', stroke: 'rgba(232,196,140,0.5)' });
  caps(g, 'PARIS · 29.5 NUIT 1832', x + 20, y + 26, { size: 10.5, ls: 2 });
  ruled(g, x + 20, y + 60, w - 40, 26, { lh: 15, color: 'rgba(230,220,200,0.22)' });
  // 圆圈图
  glowCircle(g, x + 330, y + 340, 76, { w: 1.6, color: '#e8cfa0', glow: 10, alpha: 0.6 });
  glowLine(g, [[x + 254, y + 340], [x + 406, y + 340]], { w: 1.2, color: '#e8cfa0', glow: 6, alpha: 0.4 });
  // 名字
  text(g, 'GALOIS', 130, 250, { size: 68, weight: 800, color: '#efe6d2', glow: 22, font: FONT_EN, ls: 5, align: 'left' });
  caps(g, '二十岁 · 决斗前夜', 132, 310, { size: 12, ls: 3, color: 'rgba(232,214,186,0.55)' });
  dust(g, t, { n: 70, seed: 125, alpha: 0.4 });
}

// ---------------------------------------------------------------- 25. 阿列夫 / 数表
function mAleph(g, t, p, o = {}) {
  skyBase(g, t, { glow: 0.2, stars: 260, seed: 127 });
  // 巨符号
  text(g, 'א', 1490, 300, { size: 190, weight: 700, color: 'rgba(236,222,196,0.85)', glow: 30, font: FONT_SERIF });
  text(g, '₀', 1580, 360, { size: 90, weight: 700, color: 'rgba(236,222,196,0.75)', glow: 20, font: FONT_SERIF });
  // 数字行
  const rows = 9;
  for (let r0 = 0; r0 < rows; r0++) {
    for (let c0 = 0; c0 < 14; c0++) {
      const x = 130 + c0 * 60, y = 330 + r0 * 50;
      const on = ((r0 * 7 + c0 * 3) % 5) < 3 && (c0 + r0) % 9 !== 0;
      g.save(); g.globalAlpha = on ? 0.85 : 0.25;
      g.fillStyle = on ? 'rgba(238,222,190,0.9)' : 'rgba(180,168,148,0.4)';
      g.font = `600 26px ${FONT_EN}`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String((r0 * 14 + c0) % 10), x, y);
      g.restore();
    }
  }
  if (o.cantor) {
    // 对角线
    g.save(); g.strokeStyle = 'rgba(255,200,130,0.55)'; g.lineWidth = 2;
    for (let i = 0; i < 13; i++) {
      const x = 130 + i * 60, y = 330 + i * 50;
      g.beginPath(); g.arc(x, y, 20, 0, 6.2832); g.stroke();
    }
    g.restore();
    text(g, 'R > N', W - 300, 700, { size: 74, weight: 800, color: '#f4e6cc', glow: 24, font: FONT_SERIF, ls: 2 });
    text(g, '康托', 150, 240, { size: 40, weight: 800, color: '#efe6d2', glow: 14, align: 'left' });
    caps(g, 'CANTOR · 1874 · 对角线法', 154, 282, { size: 11, ls: 2.2 });
  } else {
    text(g, 'ℵ₀', 300, 620, { size: 120, weight: 700, color: '#f0e2c8', glow: 26, font: FONT_SERIF, align: 'left' });
    caps(g, 'ALEPH-NULL · 最小的无穷', 306, 700, { size: 12, ls: 2.6 });
  }
  dust(g, t, { n: 60, seed: 129, alpha: 0.4 });
}

// ---------------------------------------------------------------- 26. WIR MÜSSEN WISSEN
function mWir(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.55, cy: 0.45 });
  text(g, 'WIR MÜSSEN WISSEN.', W / 2, 300, { size: 118, weight: 900, color: '#f6efdf', glow: 30, font: FONT_EN, ls: 2 });
  text(g, '我们必须知道', W / 2, 392, { size: 40, weight: 700, color: '#e8c992', glow: 18, ls: 6 });
  caps(g, 'HILBERT · 1930 · KÖNIGSBERG', W / 2, 430, { size: 12, ls: 3, color: 'rgba(230,214,186,0.5)' });
  // 声波
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160;
    const x = lerp(180, W - 180, u);
    const env = Math.sin(u * Math.PI);
    const y = 640 + Math.sin(u * 60 + t * 6) * 34 * env * (0.6 + 0.4 * Math.sin(t * 2));
    pts.push([x, y]);
  }
  glowLine(g, pts, { w: 2.6, color: '#ffd9a2', glow: 22 });
  glowLine(g, [[180, 640], [W - 180, 640]], { w: 1, color: '#e8cfa0', glow: 6, alpha: 0.35 });
  // 人名卡
  cardBlock(g, 120, 780, 300, 96, { tag: 'HILBERT' });
  text(g, '希尔伯特', 136, 838, { size: 28, weight: 800, color: '#f2e9d8', align: 'left', glow: 10 });
  dust(g, t, { n: 60, seed: 131, alpha: 0.4 });
}

// ---------------------------------------------------------------- 27. 哥德尔
function mGodel(g, t, p) {
  skyBase(g, t, { glow: 0.12, stars: 220, seed: 133 });
  // 代码面板
  const x = 150, y = 220, w = 900, h = 560;
  panel(g, x, y, w, h, { fill: 'rgba(8,9,12,0.82)', stroke: 'rgba(220,190,140,0.45)' });
  caps(g, 'INCOMPLETENESS · 1931', x + 22, y + 28, { size: 11, ls: 2.6 });
  g.save(); g.font = `500 17px ui-monospace,monospace`; g.fillStyle = 'rgba(222,214,196,0.62)';
  const lines = [
    '1  not-exists p ( Proof(p, G) )',
    '2  G <-> not-Prov(G)',
    '3  Con(T) -> not-Prov_T(Con(T))',
    '4  not-Con(T) or exists s not-Decidable(s)',
  ];
  lines.forEach((s, i) => g.fillText(s, x + 26, y + 90 + i * 44));
  g.restore();
  // 中心发光语句
  text(g, 'G ↔ ¬Prov(G)', W / 2 + 60, 520, { size: 66, weight: 600, color: '#ffdca6', glow: 30, font: FONT_SERIF });
  softGlow(g, W / 2 + 60, 520, 380, '255,200,130', 0.28);
  // 右侧点阵
  const r = mulberry(303);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 160; i++) {
    const px = 1130 + r() * 440, py = 300 + r() * 520;
    g.globalAlpha = 0.15 + 0.5 * r() * (0.6 + 0.4 * Math.sin(t * 2 + i));
    g.drawImage(TEX.dust, px - 5, py - 5, 10, 10);
  }
  g.restore();
  cardBlock(g, 1150, 760, 360, 96, { tag: 'GÖDEL · 维也纳' });
  text(g, '哥德尔', 1166, 818, { size: 28, weight: 800, color: '#f2e9d8', align: 'left', glow: 10 });
}

// ---------------------------------------------------------------- 28. 白底点阵（图灵）
function mWhiteDots(g, t, p, o = {}) {
  bgPaper(g, t, { cx: 0.45, cy: 0.45 });
  // 流动点阵
  const r = mulberry(401);
  g.save();
  for (let i = 0; i < 900; i++) {
    const bx = r(), by = r(), ph = r() * 6.28;
    const x = (bx * W + Math.sin(t * 0.6 + ph) * 26) % W;
    const y = (by * H + Math.cos(t * 0.5 + ph) * 20) % H;
    const a = 0.06 + 0.3 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.4 + ph * 2), 4);
    g.globalAlpha = a; g.fillStyle = '#3a352c';
    g.beginPath(); g.arc(x, y, 1.6, 0, 6.2832); g.fill();
  }
  g.restore();
  // 一条点线弧
  const pts = [];
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    pts.push([300 + u * 900, 520 - Math.sin(u * 3.14) * 120]);
  }
  g.save(); g.globalAlpha = 0.7;
  pts.forEach((q, i) => { if (i % 2 === 0) { g.fillStyle = '#2e2a24'; g.beginPath(); g.arc(q[0], q[1], 2.4, 0, 6.28); g.fill(); } });
  g.restore();
  text(g, o.num || '1190913', 1080, 640, { size: 46, weight: 600, color: 'rgba(58,52,44,0.65)', align: 'right', glow: 0, font: FONT_EN, ls: 4 });
  caps(g, o.tag || 'TURING · 1936 · 可计算数', W / 2, 300, { size: 12, ls: 3.2, color: 'rgba(52,48,42,0.5)' });
  if (o.big) text(g, o.big, 300, 260, { size: 90, weight: 900, color: 'rgba(46,42,36,0.85)', align: 'left', glow: 0, font: FONT_EN, ls: 4 });
}

// ---------------------------------------------------------------- 29. 莱布尼茨二进制
function mBinary(g, t, p) {
  bgStone(g, t, { warm: 0.3, dark: 0.55, cy: 0.5 });
  const rows = [
    { label: 'Y', word: 'YOO', cn: '阳' },
    { label: 'O', word: 'OOO', cn: '阴' },
    { label: 'U', word: 'U', cn: '你' },
  ];
  rows.forEach((rw, i) => {
    const y = 300 + i * 130;
    text(g, rw.label, 200, y, { size: 56, weight: 800, color: '#f0e4cc', glow: 16, font: FONT_EN });
    text(g, rw.word, 320, y, { size: 56, weight: 700, color: '#e8c992', glow: 16, font: FONT_EN, ls: 6 });
    // 格点
    for (let c = 0; c < 9; c++) {
      const on = (c * (i + 2)) % 3 !== 0;
      const x = 700 + c * 62, yy = y - 20;
      g.save(); g.globalAlpha = on ? 0.9 : 0.18;
      if (on) { g.shadowColor = '#ffd08a'; g.shadowBlur = 18; }
      g.fillStyle = on ? 'rgba(250,206,130,0.95)' : 'rgba(180,160,130,0.3)';
      g.fillRect(x, yy, 44, 44);
      g.restore();
    }
    text(g, rw.cn, 320, y + 52, { size: 22, weight: 600, color: 'rgba(232,216,190,0.7)', glow: 6 });
  });
  // 底部文字
  text(g, '一 和 零', 150, 760, { size: 30, weight: 700, color: '#efe4d0', align: 'left', glow: 10, ls: 3 });
  caps(g, 'LEIBNIZ · 1703 · 二进制', 154, 806, { size: 11, ls: 2.2 });
  // 数字流
  g.save(); g.globalAlpha = 0.25; g.font = `500 15px ui-monospace,monospace`; g.fillStyle = '#e8c992';
  const r = mulberry(501);
  for (let i = 0; i < 26; i++) {
    let s = ''; for (let k = 0; k < 22; k++) s += r() > 0.5 ? '1' : '0';
    g.fillText(s, 1080, 200 + i * 26);
  }
  g.restore();
}

// ---------------------------------------------------------------- 30. 四色地图
function mFourColor(g, t, p, o = {}) {
  g.save(); g.fillStyle = o.full ? '#5a1c12' : '#3a1410'; g.fillRect(0, 0, W, H); g.restore();
  const NX = 8, NY = 5;
  const X0 = 60, X1 = W - 470, Y0 = 200, Y1 = 830;
  const r = mulberry(601);
  // 共享顶点抖动，保证相邻板块边界吻合
  const V = [];
  for (let j = 0; j <= NY; j++) { V.push([]); for (let i = 0; i <= NX; i++) {
    const jx = (i === 0 || i === NX) ? 0 : (r() - 0.5) * 46;
    const jy = (j === 0 || j === NY) ? 0 : (r() - 0.5) * 42;
    V[j].push([X0 + i * (X1 - X0) / NX + jx, Y0 + j * (Y1 - Y0) / NY + jy]);
  } }
  const PALS = o.full
    ? [['#c8402c', '#9b2a18'], ['#e2a93c', '#b47f1e'], ['#3f74a2', '#2b5178'], ['#e7e0cf', '#c7bda6']]
    : [['#c8402c', '#8f2317'], ['#a52c1c', '#7d1f13'], ['#d0904a', '#a06a2a'], ['#8f2317', '#6d1a10']];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const q = [V[j][i], V[j][i + 1], V[j + 1][i + 1], V[j + 1][i]];
    const ci = (i % 2) + 2 * (j % 2);
    const col = PALS[o.full ? ci : (ci % 4)];
    const cx = (q[0][0] + q[2][0]) / 2, cy = (q[0][1] + q[2][1]) / 2;
    g.save();
    g.beginPath();
    q.forEach((pt, k) => k ? g.lineTo(pt[0], pt[1]) : g.moveTo(pt[0], pt[1]));
    g.closePath();
    const gr = g.createLinearGradient(cx - 120, cy - 120, cx + 120, cy + 120);
    gr.addColorStop(0, col[0]); gr.addColorStop(1, col[1]);
    g.fillStyle = gr; g.fill();
    g.strokeStyle = 'rgba(26,10,6,0.72)'; g.lineWidth = 2.4; g.stroke();
    g.restore();
  }
  cardBlock(g, W - 440, 210, 380, 190, { tag: 'FOUR COLOR THEOREM · 1976', fill: 'rgba(16,8,6,0.82)' });
  text(g, '阿佩尔 · 哈肯', W - 422, 296, { size: 34, weight: 800, color: '#f8f1e2', align: 'left', glow: 12 });
  caps(g, 'APPEL & HAKEN · 1200 小时机算', W - 422, 344, { size: 10.5, ls: 1.8, color: 'rgba(240,220,186,0.7)' });
  if (o.full) text(g, 'FOUR COLORS SUFFICE', W - 422, 380, { size: 15, weight: 700, color: '#ffd79a', align: 'left', glow: 10, font: FONT_EN, ls: 2 });
  const sw = ['#c8402c', '#e2a93c', '#3f74a2', '#e7e0cf'];
  sw.forEach((c, i) => { g.fillStyle = c; g.fillRect(W - 440, 450 + i * 26, 34, 18); });
  caps(g, '1977 · 无人手算', W - 440, 580, { size: 10, ls: 1.8 });
  dust(g, t, { n: 40, seed: 603, alpha: 0.3 });
}

// ---------------------------------------------------------------- 31. 元胞自动机
function mAutomaton(g, t, p) {
  bgStone(g, t, { warm: 0.5, dark: 0.6, cy: 0.5 });
  const cols = 104, cw = 11.4, rows = 52;
  const x0 = 232, y0 = 190;
  // rule 110
  let row = new Uint8Array(cols);
  const rr = mulberry(1337);
  for (let i = 0; i < cols; i++) row[i] = rr() > 0.72 ? 1 : 0;
  const rowsData = [];
  for (let y = 0; y < rows; y++) {
    rowsData.push(row.slice());
    const nx = new Uint8Array(cols);
    for (let i = 0; i < cols; i++) {
      const l = row[(i + cols - 1) % cols], c = row[i], r = row[(i + 1) % cols];
      const pat = (l << 2) | (c << 1) | r;
      nx[i] = (110 >> pat) & 1;
    }
    row = nx;
  }
  g.save();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    if (!rowsData[y][x]) continue;
    const px = x0 + x * cw, py = y0 + y * cw * 0.76;
    g.globalAlpha = 0.95;
    g.shadowColor = '#ffcf8a'; g.shadowBlur = 10;
    g.fillStyle = '#f8d79c';
    g.fillRect(px, py, cw - 1.4, cw * 0.76 - 1.4);
  }
  g.restore();
  // 表格说明
  panel(g, 80, 240, 150, 300, { alpha: 0.6 });
  caps(g, 'RULE 110', 92, 266, { size: 10.5, ls: 2 });
  const idx = [7, 6, 5, 4, 3, 2, 1, 0];
  idx.forEach((v, i) => {
    const bits = [4, 2, 1].map(b => (v & b) ? 1 : 0);
    const y = 300 + i * 32;
    g.save(); g.font = `600 12px ui-monospace,monospace`; g.fillStyle = 'rgba(226,208,180,0.6)'; g.textAlign = 'left';
    g.fillText(bits.join(''), 94, y);
    g.fillStyle = (110 >> v) & 1 ? '#f8d79c' : 'rgba(120,110,96,0.5)';
    g.fillRect(138, y - 9, 12, 12);
    g.restore();
  });
  text(g, 'R', 1140, 300, { size: 30, weight: 800, color: '#f0e4cc', align: 'left', glow: 12, font: FONT_EN });
  caps(g, 'RULES · 规则一条接一条', 1146, 350, { size: 11, ls: 2.2 });
  dust(g, t, { n: 40, seed: 607, alpha: 0.3 });
}

// ---------------------------------------------------------------- 32. 正多面体
function mPlatonic(g, t, p, o = {}) {
  skyBase(g, t, { glow: 0.25, stars: 220, seed: 611 });
  const cx = W / 2, cy = 520;
  // 金色椭圆环
  g.save(); g.translate(cx, cy); g.rotate(-0.14); g.scale(1.28, 0.62);
  glowCircle(g, 0, 0, 430, { w: 4, color: '#ffd9a2', glow: 34, alpha: 0.85 });
  glowCircle(g, 0, 0, 462, { w: 1.4, color: '#e8cfa0', glow: 14, alpha: 0.4, dash: [5, 14] });
  g.restore();
  // 线框多面体（心算投影）
  const solids = o.many ? [[-250, 0, 90], [0, -10, 120], [250, 10, 90]] : [[0, 0, 140], [-260, 30, 80], [260, 30, 80]];
  for (const [dx, dy, s] of solids) wireSolid(g, cx + dx, cy + dy, s, t + dx * 0.01);
  // 名字
  text(g, '丘成桐', 150, 300, { size: 44, weight: 800, color: '#f0e6d4', align: 'left', glow: 16 });
  caps(g, 'PLATONIC SOLIDS · 5', 154, 350, { size: 11, ls: 2.4 });
  if (o.formula) text(g, o.formula, W - 130, 300, { size: 40, weight: 700, color: '#e8c992', align: 'right', glow: 16, font: FONT_SERIF });
  dust(g, t, { n: 50, seed: 613, alpha: 0.35 });
}

function wireSolid(g, cx, cy, s, ang) {
  g.save(); g.translate(cx, cy);
  g.strokeStyle = 'rgba(226,236,248,0.85)'; g.lineWidth = 1.6;
  g.shadowColor = 'rgba(180,220,255,0.8)'; g.shadowBlur = 14;
  const P = [];
  // 二十面体顶点近似
  const t1 = (1 + Math.sqrt(5)) / 2;
  const verts = [
    [-1, t1, 0], [1, t1, 0], [-1, -t1, 0], [1, -t1, 0], [0, -1, t1], [0, 1, t1], [0, -1, -t1], [0, 1, -t1],
    [t1, 0, -1], [t1, 0, 1], [-t1, 0, -1], [-t1, 0, 1],
  ];
  const ca = Math.cos(ang), sa = Math.sin(ang);
  for (const [x, y, z] of verts) {
    const rx = x * ca - z * sa, rz = x * sa + z * ca;
    const persp = 3.2 / (3.2 + rz);
    P.push([rx * s * 0.42 * persp, y * s * 0.42 * persp]);
  }
  // 边（找最近的几对）
  const edges = [];
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) {
    const d = Math.hypot(verts[i][0] - verts[j][0], verts[i][1] - verts[j][1], verts[i][2] - verts[j][2]);
    if (d < 2.1) edges.push([i, j]);
  }
  for (const [i, j] of edges) {
    g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(P[j][0], P[j][1]); g.stroke();
  }
  g.restore();
}

// ---------------------------------------------------------------- 33. 算盘
function mAbacus(g, t, p) {
  bgStone(g, t, { warm: 0.85, dark: 0.35, cy: 0.5 });
  const x0 = 380, y0 = 380, w = 900, h = 210;
  softGlow(g, W / 2, 300, 520, '255,214,150', 0.35);
  // 框
  glowLine(g, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], { w: 3, color: '#f0c886', glow: 20, close: true });
  // 横梁
  glowLine(g, [[x0, y0 + 60], [x0 + w, y0 + 60]], { w: 2, color: '#e8b878', glow: 14, alpha: 0.8 });
  // 档与珠
  const rods = 13;
  for (let i = 0; i < rods; i++) {
    const x = x0 + 40 + i * (w - 80) / (rods - 1);
    g.save(); g.globalAlpha = 0.4; g.strokeStyle = 'rgba(240,216,180,0.6)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + h); g.stroke(); g.restore();
    const upper = (i * 3) % 2;
    const lower = 1 + ((i * 7) % 4);
    for (let k = 0; k < 2; k++) {
      if (k >= upper) continue;
      bead(g, x, y0 + 22 + k * 26, 17);
    }
    for (let k = 0; k < lower; k++) bead(g, x, y0 + 96 + k * 40, 18);
  }
  // 光
  glowDot(g, W / 2, 210, 8, { a: 1 });
  // 右侧注记
  caps(g, 'SUANPAN · 算盘 · 中国', W - 120, 300, { size: 12, ls: 2.4 });
  dust(g, t, { n: 60, seed: 617, alpha: 0.4 });
}
function bead(g, x, y, r) {
  g.save();
  const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
  gr.addColorStop(0, '#ffe8bc'); gr.addColorStop(0.6, '#d8a860'); gr.addColorStop(1, '#8a5f2e');
  g.fillStyle = gr; g.shadowColor = 'rgba(255,200,130,0.8)'; g.shadowBlur = 12;
  g.beginPath(); g.ellipse(x, y, r, r * 0.72, 0, 0, 6.2832); g.fill();
  g.restore();
}

// ---------------------------------------------------------------- 34. 深夜书店
function mShopBoy(g, t, p) {
  bgStone(g, t, { warm: 0.5, dark: 0.62, cy: 0.5 });
  // 虚焦书页 / 光线
  g.save();
  for (let i = 0; i < 7; i++) {
    g.globalAlpha = 0.10 + 0.05 * Math.sin(t + i);
    g.filter = 'blur(16px)';
    g.fillStyle = i % 2 ? '#e4d6b8' : '#c9a872';
    g.save(); g.translate(300 + i * 90, 420 + Math.sin(i) * 40); g.rotate(-0.3 + i * 0.06);
    g.fillRect(-120, -30, 240 + i * 30, 60 + i * 8); g.restore();
  }
  g.filter = 'none'; g.restore();
  // 台灯光
  softGlow(g, 1080, 520, 420, '255,200,130', 0.4);
  glowDot(g, 1080, 470, 5, { a: 0.9 });
  // 人影（抽象暗块）
  g.save(); g.globalAlpha = 0.55; g.filter = 'blur(18px)'; g.fillStyle = '#0b0806';
  g.beginPath(); g.ellipse(980, 660, 170, 230, 0.1, 0, 6.2832); g.fill(); g.restore();
  cardBlock(g, 130, 760, 420, 100, { tag: 'SHOP BOY · 杂货铺' });
  text(g, '深夜捧着书', 148, 820, { size: 24, weight: 700, color: '#eee4d2', align: 'left', glow: 8 });
  dust(g, t, { n: 70, seed: 619, alpha: 0.45 });
}

// ---------------------------------------------------------------- 35. 小屋微光 1+2
function mOnePlusTwo(g, t, p) {
  skyBase(g, t, { glow: 0.08, stars: 200, seed: 621 });
  const cx = W / 2, cy = 480;
  softGlow(g, cx, cy, 300, '255,196,120', 0.30);
  text(g, '「1 + 2」', cx, cy, { size: 118, weight: 700, color: '#ffe2b0', glow: 40, font: FONT_SERIF, ls: 2 });
  caps(g, 'A TINY LIGHT · 1742', cx, cy + 110, { size: 12, ls: 3.4, color: 'rgba(232,214,186,0.5)' });
  dust(g, t, { n: 60, seed: 623, alpha: 0.4 });
}

// ---------------------------------------------------------------- 36. 费马谜题
function mFermatEq(g, t, p) {
  skyBase(g, t, { glow: 0.18, stars: 260, seed: 631 });
  text(g, 'xⁿ + yⁿ = zⁿ', W / 2, 380, { size: 86, weight: 600, color: '#f4ecdc', glow: 28, font: FONT_SERIF, ls: 2 });
  caps(g, 'n > 2 · 无正整数解', W / 2, 452, { size: 13, ls: 3 });
  // 年份线
  glowLine(g, [[W / 2 - 300, 620], [W / 2 + 300, 620]], { w: 1.6, color: '#e8cfa0', glow: 12, alpha: 0.6 });
  text(g, '1637', W / 2 - 300, 580, { size: 30, weight: 700, color: '#e8c992', glow: 10, font: FONT_EN });
  text(g, '1994', W / 2 + 300, 580, { size: 30, weight: 700, color: '#e8c992', glow: 10, font: FONT_EN });
  const dots = 14;
  for (let i = 0; i < dots; i++) glowDot(g, W / 2 - 280 + i * 43, 620, 2.4, { a: 0.5 + 0.4 * Math.sin(t * 2 + i) });
  text(g, '等了三百多年', W / 2, 700, { size: 26, weight: 600, color: 'rgba(234,220,198,0.75)', glow: 8, ls: 3 });
  dust(g, t, { n: 60, seed: 633, alpha: 0.4 });
}

// ---------------------------------------------------------------- 37. 佩雷尔曼
function mPerelman(g, t, p) {
  skyBase(g, t, { glow: 0.12, stars: 240, seed: 641 });
  // 两个光锥/椭圆
  for (const dy of [-90, 90]) {
    g.save(); g.translate(W / 2 + 60, 470 + dy);
    for (let i = 0; i < 5; i++) {
      g.beginPath(); g.ellipse(0, 0, 250 - i * 34, 26 - i * 4, 0, 0, 6.2832);
      g.strokeStyle = `rgba(255,${232 - i * 12},${190 - i * 20},${0.7 - i * 0.12})`;
      g.lineWidth = 3 - i * 0.4; g.shadowColor = '#ffcf8a'; g.shadowBlur = 26; g.stroke();
    }
    g.restore();
  }
  softGlow(g, W / 2 + 60, 470, 420, '255,210,150', 0.28);
  text(g, '佩雷尔曼', 130, 300, { size: 52, weight: 800, color: '#f4ecdc', align: 'left', glow: 18 });
  caps(g, 'PERELMAN · 2002 · 庞加莱猜想', 134, 358, { size: 11, ls: 2.2, color: 'rgba(232,214,186,0.55)' });
  // 07 卡
  cardBlock(g, W - 420, 700, 350, 140, { tag: '07 · 千禧年难题' });
  text(g, '拒领 100 万美元', W - 402, 790, { size: 22, weight: 700, color: '#f2e6d0', align: 'left', glow: 8 });
  caps(g, 'CLAY · 1,000,000 USD · 2010', W - 402, 820, { size: 10, ls: 1.8 });
  dust(g, t, { n: 60, seed: 643, alpha: 0.4 });
}

// ---------------------------------------------------------------- 38. 千禧年七大难题
function mMillennium(g, t, p) {
  skyBase(g, t, { glow: 0.15, stars: 200, seed: 651 });
  caps(g, 'MILLENNIUM PRIZE PROBLEMS · 2000 · 每项 100 万美元', 120, 220, { size: 12, ls: 2.4 });
  const items = [
    ['01', '庞加莱猜想', '已解', 1], ['02', '杨-米尔斯', '待解', 0], ['03', 'P vs NP', '待解', 0],
    ['04', '纳维-斯托克斯', '待解', 0], ['05', '霍奇猜想', '待解', 0], ['06', 'BSD 猜想', '待解', 0], ['07', '黎曼假设', '待解', 0],
  ];
  items.forEach(([n, name, st, done], i) => {
    const x = 120 + i * 205, y = 330, w = 180, h = 300;
    const hot = done || (p > 0.2 && i === 0);
    g.save();
    if (hot) { g.shadowColor = 'rgba(255,200,130,0.8)'; g.shadowBlur = 40; }
    g.fillStyle = hot ? 'rgba(56,38,20,0.85)' : 'rgba(14,13,14,0.7)';
    g.fillRect(x, y, w, h);
    g.strokeStyle = hot ? 'rgba(255,208,140,0.95)' : 'rgba(228,190,130,0.30)';
    g.lineWidth = hot ? 2.2 : 1.2; g.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    g.restore();
    text(g, n, x + 18, y + 40, { size: 22, weight: 800, color: hot ? '#ffd79a' : 'rgba(226,208,180,0.6)', align: 'left', glow: hot ? 12 : 0, font: FONT_EN });
    text(g, name, x + 18, y + 150, { size: 22, weight: 700, color: '#f0e6d4', align: 'left', glow: 8 });
    caps(g, st, x + 18, y + 250, { size: 11, ls: 2, color: done ? '#ffc36a' : 'rgba(214,120,96,0.9)' });
    if (!done) g.save(), g.strokeStyle = 'rgba(214,88,62,0.6)', g.lineWidth = 1.6, g.strokeRect(x + 16, y + 236, 46, 22), g.restore();
    if (done) { g.save(); g.fillStyle = 'rgba(255,196,110,0.22)'; g.fillRect(x + 14, y + 232, 52, 26); g.restore(); }
  });
  text(g, '七大难题 · 如今解开了一个', 120, 760, { size: 34, weight: 700, color: '#f2e8d6', align: 'left', glow: 14, ls: 2 });
  dust(g, t, { n: 50, seed: 653, alpha: 0.35 });
}

// ---------------------------------------------------------------- 39. 两个名字
function mNames(g, t, p) {
  skyBase(g, t, { glow: 0.2, stars: 260, seed: 661 });
  const cy = 470;
  text(g, '王虹', 560, cy, { size: 96, weight: 900, color: '#f4ecdc', glow: 30, ls: 8 });
  text(g, 'WANG HONG', 560, cy + 90, { size: 18, weight: 600, color: 'rgba(232,204,160,0.7)', glow: 8, font: FONT_EN, ls: 4 });
  text(g, '邓煜', 1090, cy, { size: 96, weight: 900, color: '#f4ecdc', glow: 30, ls: 8 });
  text(g, 'DENG YU', 1090, cy + 90, { size: 18, weight: 600, color: 'rgba(232,204,160,0.7)', glow: 8, font: FONT_EN, ls: 4 });
  glowLine(g, [[826, cy - 130], [826, cy + 130]], { w: 2.4, color: '#ffd9a2', glow: 24 });
  softGlow(g, 826, cy, 300, '255,210,150', 0.2);
  caps(g, '两个来自中国的年轻名字 · 2025', W / 2, 660, { size: 12, ls: 3 });
  dust(g, t, { n: 60, seed: 663, alpha: 0.4 });
}

// ---------------------------------------------------------------- 40. 挂谷针
function mNeedle(g, t, p) {
  skyBase(g, t, { glow: 0.2, stars: 220, seed: 671 });
  const cx = 700, cy = 520;
  // 针旋转，射线随角度铺开
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) {
    const a = i / 90 * Math.PI;
    const len = 340 + 60 * Math.sin(i * 0.7 + t);
    g.strokeStyle = `rgba(255,${220 + (i % 30)},${180},${0.05 + 0.10 * (0.5 + 0.5 * Math.sin(i * 0.3 + t * 1.4))})`;
    g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(cx - Math.cos(a) * len, cy - Math.sin(a) * len * 0.7);
    g.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len * 0.7); g.stroke();
  }
  g.restore();
  glowLine(g, [[cx - 340, cy + 120], [cx + 340, cy - 120]], { w: 4, color: '#ffe0b0', glow: 30 });
  glowDot(g, cx, cy, 4, { a: 0.9 });
  text(g, '王虹', 150, 300, { size: 44, weight: 800, color: '#f2e9d8', align: 'left', glow: 14 });
  caps(g, 'KAKEYA · 三维挂谷集合', 154, 350, { size: 11, ls: 2.4 });
  text(g, 'dim = 3', W - 130, 340, { size: 54, weight: 700, color: '#ffd79a', align: 'right', glow: 22, font: FONT_EN });
  caps(g, '三维挂谷集合，维数必为 3', W - 130, 400, { size: 11, ls: 2, color: 'rgba(232,214,186,0.6)' });
  dust(g, t, { n: 60, seed: 673, alpha: 0.4 });
}

// ---------------------------------------------------------------- 41. 粒子奔流
function mParticles(g, t, p) {
  skyBase(g, t, { glow: 0.15, stars: 200, seed: 681 });
  const r = mulberry(683);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 900; i++) {
    const a = r() * 6.2832, d = Math.sqrt(r()) * 460;
    const sp = 0.4 + r();
    const x = W / 2 + Math.cos(a) * d * 1.55 + Math.sin(t * 0.6 * sp + i) * 40;
    const y = 500 + Math.sin(a) * d * 0.42 + Math.cos(t * 0.5 * sp + i) * 26;
    g.globalAlpha = 0.20 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2 * sp + i));
    const sz = 5 + r() * 10;
    g.drawImage(TEX.dotC, x - sz / 2, y - sz / 2, sz, sz);
  }
  g.restore();
  // 流体线
  glowLine(g, [[150, 610], [420, 552], [700, 596], [980, 516], [1240, 566], [1500, 498]], { w: 2, color: '#ffd9a2', glow: 22, alpha: 0.55 });
  text(g, '邓煜', 150, 300, { size: 44, weight: 800, color: '#f2e9d8', align: 'left', glow: 14 });
  caps(g, 'NAVIER–STOKES · 粒子 → 奔流', 154, 350, { size: 11, ls: 2.4 });
  dust(g, t, { n: 50, seed: 685, alpha: 0.3 });
}

// ---------------------------------------------------------------- 42. 漩涡
function mVortex(g, t, p) {
  skyBase(g, t, { glow: 0.1, stars: 200, seed: 691 });
  const cx = W / 2, cy = 520;
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 26; k++) {
    g.beginPath();
    for (let i = 0; i <= 120; i++) {
      const u = i / 120;
      const a = u * 9 + k * 0.22 + t * 0.25;
      const rr = 30 + u * (200 + k * 9);
      const x = cx + Math.cos(a) * rr * 1.5, y = cy + Math.sin(a) * rr * 0.72;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.strokeStyle = `rgba(${140 + k * 4},${200 + k * 2},255,${0.28 - k * 0.006})`;
    g.lineWidth = 1.4; g.stroke();
  }
  g.restore();
  softGlow(g, cx, cy, 200, '255,214,150', 0.6);
  glowDot(g, cx, cy, 8, { a: 1 });
  caps(g, '水流的「破裂」· 奇点', 60, 160, { size: 12, ls: 2.6 });
  text(g, '水', W - 130, 300, { size: 60, weight: 800, color: '#f2e9d8', align: 'right', glow: 16 });
  dust(g, t, { n: 50, seed: 693, alpha: 0.35 });
}

// ---------------------------------------------------------------- 43. 像素网格
function mPixel(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.6, cy: 0.5 });
  const n = 34, cell = 16, x0 = 420, y0 = 260;
  // 金色 L 形像素块
  const lit = (x, y) => {
    const u = x / n, v = y / n;
    const inL = (u > 0.18 && u < 0.42 && v > 0.1 && v < 0.86) || (u > 0.18 && u < 0.8 && v > 0.62 && v < 0.86);
    return inL || (u > 0.55 && u < 0.72 && v > 0.12 && v < 0.42);
  };
  g.save();
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = lit(x, y);
    const px = x0 + x * cell, py = y0 + y * cell;
    if (on) {
      g.globalAlpha = 0.95; g.fillStyle = '#f6d79a'; g.shadowColor = '#ffc978'; g.shadowBlur = 14;
    } else {
      g.globalAlpha = 0.10; g.fillStyle = '#d8c8a8'; g.shadowBlur = 0;
    }
    g.fillRect(px, py, cell - 1.6, cell - 1.6);
  }
  g.restore();
  // 左侧说明
  cardBlock(g, 110, 300, 250, 200, { tag: 'PROBLEM 01' });
  text(g, '黎曼猜想', 126, 380, { size: 26, weight: 800, color: '#f2e9d8', align: 'left', glow: 10 });
  caps(g, '已解 · SOLVED', 126, 424, { size: 11, ls: 2, color: '#ffc36a' });
  caps(g, '01 / 07', 126, 470, { size: 12, ls: 2.4 });
  dust(g, t, { n: 40, seed: 697, alpha: 0.3 });
}

// ---------------------------------------------------------------- 44. 难题卡（02-07）
function mProblem(g, t, p, o = {}) {
  if (o.motif === 'sphere') {
    skyBase(g, t, { glow: 0.18, stars: 200, seed: 701 });
    const cx = 520, cy = 500, R = 190;
    glowCircle(g, cx, cy, R, { w: 2, color: '#ffd9a2', glow: 24, alpha: 0.9 });
    g.save(); g.globalAlpha = 0.5;
    for (let i = 1; i < 5; i++) glowCircle(g, cx, cy, R * Math.cos(i * 0.35), { w: 1, color: '#e8cfa0', glow: 8, alpha: 0.5 });
    g.restore();
    glowCircle(g, cx, cy, R * 1.06, { w: 3, color: '#ffcf8a', glow: 40, a0: -1.2, a1: 1.2 });
  } else if (o.motif === 'strip') {
    skyBase(g, t, { glow: 0.12, stars: 200, seed: 703 });
    const cx = 500, cy = 480;
    // 一条竖光带
    g.save(); g.globalCompositeOperation = 'lighter';
    const gr = g.createLinearGradient(cx - 60, 0, cx + 60, 0);
    gr.addColorStop(0, 'rgba(255,220,170,0)'); gr.addColorStop(0.5, 'rgba(255,236,200,0.95)'); gr.addColorStop(1, 'rgba(255,220,170,0)');
    g.fillStyle = gr; g.fillRect(cx - 60, 220, 120, 520);
    g.restore();
    softGlow(g, cx, cy, 280, '255,214,150', 0.4);
    for (let i = 0; i < 26; i++) glowDot(g, cx + Math.sin(i * 2.1) * 14, 260 + i * 18, 1.8, { a: 0.7 });
    // 轴
    caps(g, '0', cx - 20, 780, { size: 13, ls: 0 });
  } else if (o.motif === 'vortex') {
    skyBase(g, t, { glow: 0.12, stars: 200, seed: 705 });
    const cx = 520, cy = 500;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 18; k++) {
      g.beginPath();
      for (let i = 0; i <= 90; i++) {
        const u = i / 90, a = u * 8 + k * 0.3 + t * 0.3, rr = 20 + u * (160 + k * 6);
        const x = cx + Math.cos(a) * rr * 1.3, y = cy + Math.sin(a) * rr * 0.7;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.strokeStyle = `rgba(${140 + k * 5},${200 + k * 2},255,${0.24 - k * 0.008})`; g.lineWidth = 1.2; g.stroke();
    }
    g.restore();
    softGlow(g, cx, cy, 180, '255,214,150', 0.55);
    glowDot(g, cx, cy, 6, { a: 1 });
  } else if (o.motif === 'waves') {
    skyBase(g, t, { glow: 0.1, stars: 200, seed: 707 });
    for (let k = 0; k < 12; k++) {
      const pts = [];
      for (let i = 0; i <= 60; i++) {
        const u = i / 60;
        pts.push([120 + u * (W - 240), 300 + k * 42 + Math.sin(u * 8 + k * 0.5 + t) * 16]);
      }
      glowLine(g, pts, { w: 1.4, color: k === 6 ? '#ffd9a2' : '#e8cfa0', glow: k === 6 ? 22 : 6, alpha: k === 6 ? 0.95 : 0.35 });
    }
    glowLine(g, [[0, 800], [W, 800]], { w: 1.4, color: '#e8cfa0', glow: 8, alpha: 0.4 });
  } else if (o.motif === 'zig') {
    skyBase(g, t, { glow: 0.12, stars: 180, seed: 713 });
    const pts = [];
    for (let i = 0; i <= 9; i++) pts.push([180 + i * 140, i % 2 ? 620 : 420]);
    glowLine(g, pts, { w: 3, color: '#ffd9a2', glow: 26, alpha: 0.95 });
    for (let i = 0; i < 3; i++) glowLine(g, [[160, 700 + i * 26], [W * 0.6, 700 + i * 26]], { w: 1, color: '#e8cfa0', glow: 4, alpha: 0.18 });
  } else if (o.motif === 'line') {
    skyBase(g, t, { glow: 0.14, stars: 170, seed: 715 });
    softGlow(g, 430, 520, 300, '255,214,150', 0.35);
    glowLine(g, [[160, 560], [W * 0.52, 560]], { w: 5, color: '#ffe0ae', glow: 34, alpha: 0.95 });
    glowDot(g, W * 0.52, 560, 8, { a: 1 });
  } else if (o.motif === 'hodge') {
    skyBase(g, t, { glow: 0.12, stars: 180, seed: 717 });
    const cx = 470, cy = 500;
    g.save(); g.strokeStyle = 'rgba(214,232,255,0.55)'; g.lineWidth = 2;
    g.beginPath();
    for (let i = 0; i <= 90; i++) {
      const a = i / 90 * 6.2832;
      const rr = 150 + 42 * Math.sin(a * 3 + 0.5) + 18 * Math.cos(a * 5);
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.82;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath(); g.stroke(); g.restore();
    for (let k = 0; k < 7; k++) {
      const pts = [];
      for (let i = 0; i <= 50; i++) { const u = i / 50; pts.push([cx - 220 + u * 440, cy - 150 + k * 50 + Math.sin(u * 6 + k) * 26]); }
      glowLine(g, pts, { w: 1.1, color: '#a9d8ff', glow: 8, alpha: 0.35 });
    }
    softGlow(g, cx, cy, 220, '160,210,255', 0.35);
  } else if (o.motif === 'curve') {
    skyBase(g, t, { glow: 0.1, stars: 200, seed: 709 });
    const pts = [];
    for (let i = 0; i <= 80; i++) {
      const u = i / 80;
      pts.push([160 + u * (W - 320), 640 - Math.pow(u, 2.2) * 420]);
    }
    glowLine(g, pts, { w: 3.4, color: '#ffdca6', glow: 30 });
    glowDot(g, pts[Math.floor(pts.length * 0.6)][0], pts[Math.floor(pts.length * 0.6)][1], 5, { a: 1 });
  }
  // 卡片
  const x = W - 620, y = 300;
  caps(g, 'CLAY MILLENNIUM PRIZE PROBLEMS', x, y - 96, { size: 9, ls: 2.6, color: 'rgba(232,214,186,0.45)', align: 'left' });
  caps(g, '千禧年大奖难题', x + 250, y - 96, { size: 9, ls: 2.6, color: 'rgba(240,196,120,0.55)', align: 'left' });
  text(g, o.no || '02 / 07', x, y, { size: 30, weight: 700, color: '#f0cf9a', align: 'left', glow: 12, font: FONT_EN, ls: 2 });
  const nm = o.name || '';
  const nsz = nm.length >= 12 ? 34 : nm.length >= 9 ? 42 : 56;
  text(g, nm, x, y + 80, { size: nsz, weight: 900, color: '#fbf6ea', align: 'left', glow: 26 });
  caps(g, o.en || '', x + 2, y + 118, { size: 11, ls: 2.2, color: 'rgba(232,214,186,0.55)' });
  if (o.lines) {
    g.save(); g.font = `500 17px ${FONT_CN}`; g.fillStyle = 'rgba(234,222,202,0.72)'; g.textAlign = 'left';
    o.lines.forEach((s, i) => g.fillText(s, x + 2, y + 172 + i * 30));
    g.restore();
  }
  if (o.solved) stamp(g, '已解', x + 120, y + 300, { color: 'rgba(255,206,130,0.95)' });
  else if (o.closed) stamp(g, '待解', x + 120, y + 300, {});
  else stamp(g, '已解', x + 120, y + 300, { color: 'rgba(240,186,96,0.95)' });
  dust(g, t, { n: 40, seed: 711, alpha: 0.3 });
}

// ---------------------------------------------------------------- 45. 片尾蒙太奇
function mFinale(g, t, p, o = {}) {
  bgStone(g, t, { warm: 0.7, dark: 0.55, cy: 0.45 });
  softGlow(g, W / 2, 320, 760, '255,200,140', 0.22);
  const k = smooth(clamp(p * 2.6));
  g.globalAlpha = k;
  text(g, '数学简史', W / 2, 250, { size: 116, weight: 900, color: '#f4efe3', glow: 30, glowColor: '#c9a05e', ls: 8 });
  caps(g, 'A BRIEF HISTORY OF MATHEMATICS', W / 2 - 10, 330, { size: 20, ls: 7, color: '#e5b45e' });
  // 小缩略图排
  const thumbs = [
    ['bone', 120, '约 2 万年前'], ['tally', 260, '约前 1800'], ['tri', 400, '约前 1800'], ['circle', 540, '约前 300'],
    ['grid', 680, '628'], ['infinity', 820, '1638'], ['zero', 960, '1687'], ['stars', 1100, '2026'],
  ];
  thumbs.forEach(([kind, x, year], i) => {
    const y = 560, w = 110, h = 74;
    g.save();
    g.globalAlpha = k * (0.8 + 0.2 * (0.5 + 0.5 * Math.sin(t * 1.6 + i)));
    panel(g, x, y, w, h, { fill: 'rgba(20,16,12,0.7)', stroke: 'rgba(232,196,140,0.5)' });
    miniMotif(g, kind, x + w / 2, y + h / 2, w * 0.32);
    g.restore();
    caps(g, String(i + 1).padStart(2, '0'), x, y + h + 22, { size: 9, ls: 1.6 });
    caps(g, year || '', x + 16, y + h + 22, { size: 9, ls: 1.2, align: 'left' });
  });
  // 时间轴
  const ty = 800;
  glowLine(g, [[120, ty], [W - 120, ty]], { w: 2, color: '#ffd9a2', glow: 20, alpha: 0.8 });
  glowDot(g, W - 140, ty, 4, { a: 1 });
  caps(g, '约两万年前', 120, ty + 30, { size: 12, ls: 2.4 });
  caps(g, '2025', W - 150, ty + 30, { size: 12, ls: 2.4 });
  if (o.end) {
    text(g, '未完待续', W / 2, 940, { size: 46, weight: 900, color: '#fff8ea', glow: 26, glowColor: '#ffcf8a', ls: 10 });
    caps(g, 'TO BE CONTINUED', W / 2, 992, { size: 13, ls: 6, color: 'rgba(240,214,170,0.75)' });
  }
}

function miniMotif(g, kind, cx, cy, s) {
  g.save();
  g.strokeStyle = 'rgba(240,214,170,0.8)'; g.fillStyle = 'rgba(240,214,170,0.8)'; g.lineWidth = 1.4;
  if (kind === 'bone') { g.fillRect(cx - s, cy - s * 0.16, s * 2, s * 0.32); }
  else if (kind === 'tally') { for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(cx - s + i * s * 0.5, cy - s * 0.6); g.lineTo(cx - s + i * s * 0.5, cy + s * 0.6); g.stroke(); } }
  else if (kind === 'tri') { g.beginPath(); g.moveTo(cx - s, cy + s * 0.6); g.lineTo(cx - s, cy - s * 0.3); g.lineTo(cx + s * 0.6, cy + s * 0.6); g.closePath(); g.stroke(); }
  else if (kind === 'circle') { g.beginPath(); g.arc(cx, cy, s * 0.8, 0, 6.2832); g.stroke(); }
  else if (kind === 'grid') { for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(cx + i * s * 0.7, cy - s); g.lineTo(cx + i * s * 0.7, cy + s); g.stroke(); g.beginPath(); g.moveTo(cx - s, cy + i * s * 0.7); g.lineTo(cx + s, cy + i * s * 0.7); g.stroke(); } }
  else if (kind === 'infinity') { g.beginPath(); g.arc(cx - s * 0.45, cy, s * 0.45, 0, 6.2832); g.stroke(); g.beginPath(); g.arc(cx + s * 0.45, cy, s * 0.45, 0, 6.2832); g.stroke(); }
  else if (kind === 'zero') { g.beginPath(); g.ellipse(cx, cy, s * 0.5, s * 0.7, 0, 0, 6.2832); g.stroke(); }
  else { for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(cx + Math.sin(i * 3.3) * s * 0.8, cy + Math.cos(i * 2.1) * s * 0.7, 1.1, 0, 6.28); g.fill(); } }
  g.restore();
}


// ---------------------------------------------------------------- 0. 开场：年份卡甩镜（2026 → 约前 300）
const INTRO_CARDS = [
  ['2026', '菲尔兹奖', 'FIELDS MEDAL · 2026', '王虹 · 邓煜', 'dot'],
  ['1994', '费马大定理', "FERMAT'S LAST THEOREM", '怀尔斯', 'curve'],
  ['1936', '图灵机', 'TURING MACHINE', '图灵', 'tape'],
  ['1931', '不完备定理', 'INCOMPLETENESS', '哥德尔', 'circle'],
  ['628', '零的运算', 'ZERO · BRAHMAGUPTA', '婆罗摩笈多', 'zero'],
  ['约前300', '几何原本', "EUCLID'S ELEMENTS", '欧几里得', 'tri'],
];

function introGlyph(g, kind, cx, cy, s, a) {
  g.save(); g.globalAlpha = a; g.strokeStyle = 'rgba(255,214,150,0.9)'; g.lineWidth = 1.6;
  if (kind === 'dot') {
    for (let i = 0; i < 16; i++) {
      const ang = i / 16 * 6.2832;
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ang) * s, cy + Math.sin(ang) * s); g.stroke();
    }
  } else if (kind === 'curve') {
    g.beginPath(); g.moveTo(cx - s, cy + s * 0.5);
    g.bezierCurveTo(cx - s * 0.3, cy - s, cx + s * 0.3, cy + s * 0.8, cx + s, cy - s * 0.4); g.stroke();
  } else if (kind === 'tape') {
    for (let i = -2; i <= 2; i++) { g.strokeRect(cx - s + i * s * 0.42, cy - s * 0.3, s * 0.34, s * 0.6); }
    g.beginPath(); g.arc(cx, cy + s * 0.55, s * 0.14, 0, 6.2832); g.stroke();
  } else if (kind === 'circle') {
    g.beginPath(); g.arc(cx, cy, s * 0.5, 0, 6.2832); g.stroke();
    g.beginPath(); g.moveTo(cx + s * 0.5, cy); g.lineTo(cx + s * 0.5, cy - s * 0.55); g.stroke();
  } else if (kind === 'zero') {
    g.beginPath(); g.ellipse(cx, cy, s * 0.34, s * 0.55, 0, 0, 6.2832); g.stroke();
  } else {
    g.beginPath(); g.moveTo(cx - s * 0.55, cy + s * 0.45); g.lineTo(cx - s * 0.55, cy - s * 0.45); g.lineTo(cx + s * 0.55, cy + s * 0.45); g.closePath(); g.stroke();
  }
  g.restore();
}

function mIntroRoll(g, t, p) {
  bgStone(g, t, { warm: 1.0, dark: 0.44, cx: 0.35, cy: 0.5, rad: 1.0 });
  const N = INTRO_CARDS.length;
  const u = p * (N - 1);              // 镜头滑到第几张
  const STEP = 720, BASE = 200;
  // 甩镜的横向光带
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 12; k++) {
    const y = 240 + k * 52;
    const gr = g.createLinearGradient(0, y, W, y);
    gr.addColorStop(0, 'rgba(255,190,120,0)');
    gr.addColorStop(0.35, 'rgba(255,200,140,' + (0.05 + 0.05 * Math.sin(k + t * 6)) + ')');
    gr.addColorStop(0.7, 'rgba(255,226,180,0)');
    g.fillStyle = gr; g.fillRect(0, y, W, 2 + 2 * Math.abs(Math.sin(u * 1.7 + k)));
  }
  g.restore();
  // 卡片：当前张 + 前后各一张做运动残影
  for (let i = 0; i < N; i++) {
    const x = BASE + (i - u) * STEP;
    if (x < -760 || x > W + 120) continue;
    const near = Math.max(0, 1 - Math.abs(i - u) / 1.25);
    const alpha = 0.18 + 0.82 * near;
    const wob = Math.sin(t * 1.1 + i) * 3;
    // 甩镜拖影：不用 filter blur（手机上整卡模糊要 60ms+），改用两层错位低透明复制
    const smear = Math.min(1, Math.abs(Math.sin(u * Math.PI)));
    if (smear > 0.05) {
      for (let k = 1; k <= 2; k++) {
        g.save();
        g.globalAlpha = alpha * 0.16 / k;
        g.translate(-smear * 54 * k, 0);
        drawIntroCard(g, x, 330 + wob, i, alpha * 0.16, 0);
        g.restore();
      }
    }
    g.save();
    g.globalAlpha = alpha;
    drawIntroCard(g, x, 330 + wob, i, alpha, 0);
    g.restore();
  }
  dust(g, t, { n: 120, seed: 5, alpha: 0.5 });
  softGlow(g, W * 0.5, 520, 520, '255,190,120', 0.18);
}

function drawIntroCard(g, x, y, i, alpha, blur) {
  const [year, name, en, who, glyph] = INTRO_CARDS[i];
  const w = 620, h = 330;
  g.save();
  if (blur > 0.2) g.filter = 'blur(' + blur.toFixed(1) + 'px)';
  cardBlock(g, x, y, w, h, {});
  text(g, year, x + 40, y + 112, { size: year.length > 4 ? 74 : 100, weight: 900, color: '#ffd07a', align: 'left', glow: 24, font: FONT_EN, ls: 1 });
  text(g, name, x + 42, y + 196, { size: 44, weight: 800, color: '#f6f1e5', align: 'left', glow: 14 });
  caps(g, en, x + 44, y + 240, { size: 12, ls: 2.8, color: 'rgba(240,214,170,0.62)' });
  text(g, who, x + 42, y + 292, { size: 19, weight: 600, color: 'rgba(232,214,186,0.66)', align: 'left', glow: 6 });
  introGlyph(g, glyph, x + w - 120, y + 150, 92, 0.72);
  g.restore();
}

/* =====================================================================
 * v2：按原片 62 个真实切点重画的场景（每镜按原片构图临摹）
 * ===================================================================== */

// 蓝图纸（笛卡尔/牛顿段）
function bgBlueprint(g, t, o = {}) {
  g.fillStyle = '#071320'; g.fillRect(0, 0, W, H);
  const gr = g.createRadialGradient(W * 0.5, H * 0.42, 0, W * 0.5, H * 0.42, W * 0.75);
  gr.addColorStop(0, 'rgba(26,68,104,0.55)');
  gr.addColorStop(0.55, 'rgba(10,30,48,0.42)');
  gr.addColorStop(1, 'rgba(2,7,12,0.7)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.strokeStyle = 'rgba(110,170,220,0.20)'; g.lineWidth = 1;
  const step = o.step || 62, off = ((t * 8) % step);
  for (let x = -step + off; x < W + step; x += step) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = -step; y < H + step; y += step) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

// 3. 骨针特写（亮）
function mBoneLight(g, t, p) {
  bgStone(g, t, { warm: 0.55, dark: 0.66, cx: 0.45, cy: 0.55 });
  ghostWord(g, '2', W * 0.66, 430, 520, { alpha: 0.10 });
  const k = smooth(clamp(p * 2.2));
  g.save();
  g.translate(W * 0.44, 520); g.rotate(-0.22);
  softGlow(g, 0, 0, 460, '255,214,160', 0.34 * k);
  drawBone(g, 0, 0, 700, 1, t);
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.25 * k;
  g.fillStyle = 'rgba(255,244,224,1)';
  g.beginPath(); g.roundRect(-250, -14, 500, 28, 14); g.fill();
  g.restore();
  g.restore();
  cardBlock(g, 120, 700, 430, 116, {});
  caps(g, 'ISHANGO BONE · CONGO', 146, 734, { size: 10.5, ls: 2.6, align: 'left' });
  text(g, '伊尚戈骨 · 刚果计数', 146, 772, { size: 24, weight: 800, align: 'left', glow: 8 });
  caps(g, '约公元前 20000 · 一划 = 1', 146, 800, { size: 10.5, ls: 1.6, align: 'left' });
  dust(g, t, { n: 90, seed: 21, alpha: 0.5 });
}

// 6. 一二三 + 计数板
function mTrio(g, t, p) {
  bgStone(g, t, { warm: 0.7, dark: 0.62, cy: 0.45 });
  const k = smooth(clamp(p * 2.4));
  ghostWord(g, '1', 300, 420, 420, { alpha: 0.12 * k });
  ghostWord(g, '2', 810, 430, 460, { alpha: 0.10 * k });
  ghostWord(g, '3', 1330, 420, 420, { alpha: 0.12 * k });
  // 星座
  const pts = [[520, 250], [660, 210], [800, 260], [930, 230]];
  for (let i = 1; i < pts.length; i++) glowLine(g, [pts[i - 1], pts[i]], { w: 1.4, color: '#ffd9a2', glow: 10, alpha: 0.6 });
  pts.forEach(([x, y]) => glowDot(g, x, y, 6, { a: 0.9 }));
  // 计数卡
  const cx = W / 2, cy = 640;
  g.save(); g.globalAlpha = 0.9 * k;
  panel(g, cx - 300, cy - 80, 600, 190, { fill: 'rgba(12,10,9,0.62)' });
  g.strokeStyle = 'rgba(255,214,160,0.85)'; g.lineWidth = 2.4;
  const groups = [1, 2, 3, 4];
  groups.forEach((n, gi) => {
    const x0 = cx - 240 + gi * 130;
    for (let i = 0; i < n; i++) { g.beginPath(); g.moveTo(x0 + i * 14, cy - 30); g.lineTo(x0 + i * 14, cy + 46); g.stroke(); }
  });
  g.restore();
  caps(g, 'TALLY · 一划一记', cx, cy + 84, { size: 12, ls: 3, color: 'rgba(236,214,178,0.6)' });
  caps(g, '1 · 2 · 3', cx, 300, { size: 13, ls: 6, color: 'rgba(240,214,170,0.55)' });
  dust(g, t, { n: 80, seed: 33, alpha: 0.45 });
}

// 9. 圆规 · 生命之花
function mFlower(g, t, p) {
  skyBase(g, t, { glow: 0.18, stars: 220, seed: 77 });
  const cx = 690, cy = 500, R = 210;
  const a = smooth(clamp(p * 2.0));
  g.save(); g.globalAlpha = 0.9 * a;
  g.strokeStyle = 'rgba(244,226,196,0.55)'; g.lineWidth = 1.6;
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke();
  for (let i = 0; i < 6; i++) {
    const ang = i / 6 * 6.2832;
    g.beginPath(); g.arc(cx + Math.cos(ang) * R * 0.6, cy + Math.sin(ang) * R * 0.6, R * 0.6, 0, 6.2832); g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const ang = i / 6 * 6.2832 + 0.5236;
    glowDot(g, cx + Math.cos(ang) * R * 1.1, cy + Math.sin(ang) * R * 1.1, 4, { a: 0.7 });
  }
  g.restore();
  text(g, 'CIRCLE', 110, 190, { size: 64, weight: 900, color: '#f4efe2', align: 'left', glow: 18, font: FONT_EN, ls: 6 });
  // 圆规
  g.save(); g.globalAlpha = 0.95;
  g.translate(W - 260, 560); g.strokeStyle = 'rgba(255,224,170,0.9)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -190); g.lineTo(-54, 60); g.moveTo(0, -190); g.lineTo(54, 60); g.stroke();
  g.beginPath(); g.arc(0, -196, 10, 0, 6.2832); g.stroke();
  g.restore();
  text(g, 'RULER', W - 300, 760, { size: 46, weight: 900, color: '#ffcf8a', align: 'left', glow: 20, font: FONT_EN, ls: 5 });
  caps(g, '一个圆，一把直尺', 120, 270, { size: 16, ls: 3, align: 'left', color: 'rgba(240,220,190,0.65)' });
  dust(g, t, { n: 90, seed: 41, alpha: 0.45 });
}

// 11. 白纸上的炭笔圆
function mPaperCircle(g, t, p) {
  bgPaper(g, t, { cx: 0.5, cy: 0.45 });
  const cx = W / 2, cy = 470, R = 200;
  const a = smooth(clamp(p * 2.0));
  g.save(); g.globalAlpha = 0.86 * a;
  g.strokeStyle = 'rgba(40,36,32,0.78)'; g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, R, -0.9, -0.9 + 6.2832 * clamp(p * 1.6)); g.stroke();
  g.strokeStyle = 'rgba(40,36,32,0.22)'; g.lineWidth = 8;
  g.beginPath(); g.arc(cx, cy, R + 3, 0, 6.2832); g.stroke();
  g.restore();
  caps(g, 'CIRCLE · π', cx, 200, { size: 13, ls: 5, color: 'rgba(60,52,42,0.55)' });
  caps(g, '圆 · 一个完美的开端', cx, 760, { size: 14, ls: 2.4, color: 'rgba(60,52,42,0.6)' });
}

// 12. 白纸上的 ∞
function mPaperInfinity(g, t, p) {
  mInfinity(g, t, p, { white: true, label: "I'M COUNTING TO", label2: 'INFINITY', note: 'N → ∞' });
}

// 14 / 15. 零：发光椭圆环 + 字
function mZeroRing(g, t, p, o = {}) {
  skyBase(g, t, { glow: 0.22, stars: 260, seed: 61 });
  const cx = W * 0.53, cy = 470;
  const pulse = 0.88 + 0.12 * Math.sin(t * 2.0);
  softGlow(g, cx, cy, 470, '255,206,132', 0.30);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) {
    g.beginPath(); g.ellipse(cx, cy, 200 + i * 9, 246 + i * 11, 0, 0, 6.2832);
    g.strokeStyle = `rgba(255,${232 - i * 12},${176 - i * 22},${(0.9 - i * 0.26) * pulse})`;
    g.lineWidth = 18 - i * 5; g.shadowColor = '#ffcf8a'; g.shadowBlur = 60; g.stroke();
  }
  g.shadowBlur = 0; g.restore();
  const k = smooth(clamp(p * 2.2));
  text(g, o.glyph || '零', cx, cy + 10, { size: 150, weight: 900, color: '#fdf6e6', glow: 30, glowColor: '#ffcf8a' });
  caps(g, o.glyph === '無' ? 'NOTHING · ŚŪNYA' : 'ZERO · 零', cx, cy + 250, { size: 12.5, ls: 4, color: 'rgba(236,214,178,0.55)' });
  panel(g, W - 430, 700, 360, 92, { alpha: 0.45 });
  caps(g, o.glyph === '無' ? 'SANSKRIT · 628 AD' : 'ZERO · 628 AD · BRAHMAGUPTA', W - 414, 728, { size: 10.5, ls: 2.2 });
  text(g, o.glyph === '無' ? '「无」终于有了名字' : '零出现了，规则从此改写', W - 414, 764, { size: 18, weight: 700, align: 'left', glow: 8 });
  dust(g, t, { n: 80, seed: 63, alpha: 0.4 });
}

// 16. 印度记数
function mBrahmi(g, t, p) {
  bgStone(g, t, { warm: 0.6, dark: 0.6, cy: 0.5 });
  const nums = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];
  const bx = 180, by = 560, bw = 1290, bh = 110;
  panel(g, bx, by, bw, bh, { fill: 'rgba(10,9,8,0.55)' });
  const k = clamp(p * 2.2);
  nums.forEach((s, i) => {
    const x = bx + 62 + i * (bw - 120) / (nums.length - 1);
    text(g, s, x, by + 62, { size: 46, weight: 700, color: '#f6efdf', glow: 16, glowColor: '#ffcf8a' });
    caps(g, String(i + 1), x, by + 100, { size: 10, ls: 1.5, color: 'rgba(230,212,180,0.5)' });
  });
  // 金色扫光
  const sx = bx - 100 + (bw + 200) * clamp(p * 0.9);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(sx - 220, 0, sx + 60, 0);
  gr.addColorStop(0, 'rgba(255,190,120,0)'); gr.addColorStop(0.75, 'rgba(255,214,160,0.18)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = gr; g.fillRect(sx - 240, by - 120, 320, bh + 240);
  g.restore();
  glowLine(g, [[bx + 40, 300], [bx + bw - 40, 300]], { w: 1.2, color: '#e8cfa0', glow: 8, alpha: 0.35 });
  caps(g, 'BRAHMAGUPTA · 628 · ZERO', bx + 40, 270, { size: 11, ls: 3.2, align: 'left' });
  dust(g, t, { n: 90, seed: 71, alpha: 0.45 });
}

// 19. DESCARTES
function mDescartes(g, t, p) {
  bgBlueprint(g, t, {});
  const k = smooth(clamp(p * 2.4));
  g.save(); g.globalAlpha = k;
  text(g, 'DESCARTES', W / 2, 300, { size: 116, weight: 900, color: '#f6f2e8', glow: 26, glowColor: '#9fd4ff', font: FONT_EN, ls: 10 });
  caps(g, 'LA GÉOMÉTRIE · 1637', W / 2, 372, { size: 13, ls: 5, color: 'rgba(196,220,240,0.6)' });
  glowLine(g, [[160, 640], [W - 160, 640]], { w: 3, color: '#ffd9a2', glow: 30, alpha: 0.9 });
  glowDot(g, W - 300, 640, 5, { a: 1 });
  caps(g, '笛卡尔把 x 和 y', W / 2, 760, { size: 15, ls: 2.4, color: 'rgba(220,232,244,0.6)' });
  g.restore();
  dust(g, t, { n: 70, seed: 81, alpha: 0.35 });
}

// 20. 地平线网格
function mGridHorizon(g, t, p) {
  bgBlueprint(g, t, { step: 74 });
  const hz = 520;
  g.save(); g.strokeStyle = 'rgba(150,200,240,0.30)'; g.lineWidth = 1.2;
  for (let i = -14; i <= 14; i++) {
    g.beginPath(); g.moveTo(W / 2 + i * 22, hz); g.lineTo(W / 2 + i * 220, H + 240); g.stroke();
  }
  for (let i = 1; i < 16; i++) {
    const yy = hz + Math.pow(i / 15, 2.2) * 700;
    g.beginPath(); g.moveTo(0, yy); g.lineTo(W, yy); g.stroke();
  }
  g.restore();
  glowLine(g, [[0, hz], [W, hz]], { w: 2.4, color: '#ffd9a2', glow: 30, alpha: 0.8 });
  softGlow(g, W / 2, hz, 520, '255,208,150', 0.22);
  caps(g, 'CARTESIAN PLANE · 1637', W / 2, 260, { size: 12, ls: 4, color: 'rgba(200,222,240,0.55)' });
  text(g, '铺成横跨天空的网格', W / 2, 780, { size: 34, weight: 800, color: '#eaf2fa', glow: 12 });
}

// 21. 坐标轴与切线（牛顿）
function mAxes(g, t, p) {
  bgBlueprint(g, t, { step: 58 });
  const ax = 330, ay = 720, sx = 1100, sy = 560;
  g.save(); g.strokeStyle = 'rgba(170,214,246,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(140, ay); g.lineTo(W - 140, ay); g.stroke();
  g.beginPath(); g.moveTo(ax, 180); g.lineTo(ax, H - 160); g.stroke();
  g.restore();
  caps(g, 'x', W - 130, ay + 8, { size: 22, ls: 1, color: 'rgba(200,226,246,0.7)' });
  caps(g, 'y', ax - 34, 190, { size: 22, ls: 1, color: 'rgba(200,226,246,0.7)' });
  // 曲线
  const pts = [];
  for (let i = 0; i <= 100; i++) {
    const u = i / 100;
    pts.push([ax + u * sx, ay - Math.pow(u, 2.1) * sy]);
  }
  glowLine(g, pts, { w: 3.4, color: '#ffdca6', glow: 26, alpha: 0.95 });
  const u0 = 0.62, px = ax + u0 * sx, py = ay - Math.pow(u0, 2.1) * sy;
  glowDot(g, px, py, 7, { a: 1 });
  text(g, '0.5', 1300, 300, { size: 54, weight: 800, color: '#f6f2e8', glow: 14, font: FONT_EN, align: 'left' });
  text(g, '2.500', 1300, 372, { size: 54, weight: 800, color: '#ffd9a2', glow: 18, font: FONT_EN, align: 'left' });
  caps(g, 'NEWTON · 1665 · FLUXIONS', 1300, 420, { size: 10.5, ls: 2.4, align: 'left', color: 'rgba(200,226,246,0.5)' });
  dust(g, t, { n: 60, seed: 91, alpha: 0.3 });
}

// 22. 切线 / dy dx
function mTangent(g, t, p) {
  bgBlueprint(g, t, { step: 58 });
  const ax = 300, ay = 760;
  const pts = [];
  for (let i = 0; i <= 100; i++) { const u = i / 100; pts.push([ax + Math.pow(u, 1.6) * 1080, ay - Math.pow(u, 3.1) * 520]); }
  glowLine(g, pts, { w: 3.2, color: '#ffdca6', glow: 26 });
  const u0 = 0.35, px = ax + Math.pow(u0, 1.6) * 1080, py = ay - Math.pow(u0, 3.1) * 520;
  const dx = 300, dy = -dx * (3.1 * Math.pow(u0, 2.1)) / (1.6 * Math.pow(u0, 0.6));
  glowLine(g, [[px - dx, py - dy], [px + dx, py + dy]], { w: 2, color: '#cfe8ff', glow: 18, alpha: 0.9 });
  glowDot(g, px, py, 6, { a: 1 });
  text(g, 'dy/dx', 1250, 330, { size: 44, weight: 800, color: '#ffd9a2', glow: 16, font: FONT_SERIF, align: 'left' });
  caps(g, '瞬时 · 无穷小', 1250, 380, { size: 11, ls: 2.2, align: 'left', color: 'rgba(200,226,246,0.5)' });
}

// 25. 点线 ∞
function mDottedInfinity(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.7, cy: 0.45 });
  const cx = W / 2, cy = 490, R = 260;
  const k = clamp(p * 1.6);
  g.save(); g.globalAlpha = 0.8;
  for (let i = 0; i < 120; i++) {
    if (i / 120 > k) break;
    const u = i / 120 * 6.2832;
    const x = cx + R * Math.sin(u) * 1.35, y = cy + R * Math.sin(u) * Math.cos(u) * 0.9;
    glowDot(g, x, y, 2.2, { a: 0.5 });
  }
  g.restore();
  caps(g, "I'M COUNTING TO INFINITY · N → ∞", cx, 250, { size: 12, ls: 4, color: 'rgba(230,212,180,0.5)' });
  dust(g, t, { n: 90, seed: 111, alpha: 0.4 });
}

// 29. 二十岁
function mGalois20(g, t, p) {
  bgStone(g, t, { warm: 0.5, dark: 0.68 });
  const k = smooth(clamp(p * 2.4));
  g.save(); g.globalAlpha = k;
  text(g, '20', 300, 300, { size: 230, weight: 900, color: '#f4efe2', glow: 30, glowColor: '#ffcf8a', font: FONT_EN, align: 'left' });
  caps(g, 'GALOIS · 1832 · 20 岁', 300, 400, { size: 13, ls: 3.2, align: 'left' });
  g.restore();
  // 手稿
  g.save(); g.translate(880, 520); g.rotate(-0.04); g.globalAlpha = 0.9;
  panel(g, -180, -170, 380, 340, { fill: 'rgba(232,224,206,0.10)', stroke: 'rgba(240,220,180,0.35)' });
  ruled(g, -150, -110, 320, 9, {});
  g.restore();
  text(g, 'A', 1320, 640, { size: 260, weight: 900, color: 'rgba(255,214,160,0.22)', glow: 0, font: FONT_SERIF, italic: 1 });
  dust(g, t, { n: 70, seed: 121, alpha: 0.4 });
}

// 30. 康托对角线（表）
function mCantorTable(g, t, p) {
  bgStone(g, t, { warm: 0.4, dark: 0.66 });
  ghostWord(g, 'R', W * 0.78, 620, 520, { alpha: 0.10 });
  const rows = [['N', '0', '1', '2', '3', '4', '5', '6', '7', '…'],
                ['ℵ₀', '1', '2', '3', '4', '5', '6', '7', '8', '…'],
                ['ℵ₁', '2', '4', '6', '8', '10', '12', '14', '16', '…'],
                ['2^ℵ₀', '1', '3', '5', '7', '9', '11', '13', '15', '…']];
  const x0 = 200, y0 = 260, cw = 118, rh = 92;
  const k = clamp(p * 2.2);
  rows.forEach((row, ri) => {
    row.forEach((s, ci) => {
      const x = x0 + ci * cw, y = y0 + ri * rh;
      g.save(); g.globalAlpha = 0.25 + 0.55 * clamp(k * 1.4 - ci * 0.06);
      if (ci === 0) text(g, s, x, y, { size: 34, weight: 800, color: '#ffd9a2', glow: 12, align: 'left' });
      else g.fillStyle = 'rgba(240,230,210,0.92)', g.fillRect(x, y - 26, 6, 54), caps(g, s, x + 22, y - 8, { size: 16, ls: 1, align: 'left' });
      g.restore();
    });
  });
  caps(g, 'CANTOR · 1891 · 可数 / 不可数', x0, y0 - 90, { size: 12, ls: 3, align: 'left' });
  glowLine(g, [[x0 + cw * 1.2, y0 + 40], [x0 + cw * 8.2, y0 + 40]], { w: 1, color: '#ffd9a2', glow: 6, alpha: 0.25 });
}

// 31. 对角线表
function mCantorDiag(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.7 });
  const cols = 9, rows = 9, x0 = 300, y0 = 230, cw = 92, rh = 62;
  const k = clamp(p * 2.0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = (r * 7 + c * 3) % 2;
      g.save(); g.globalAlpha = 0.25 + 0.5 * k;
      caps(g, String(v), x0 + c * cw, y0 + r * rh, { size: 18, ls: 1, color: 'rgba(240,228,206,0.85)' });
      g.restore();
    }
  }
  g.save(); g.strokeStyle = 'rgba(255,200,120,0.85)'; g.lineWidth = 2.6; g.globalAlpha = clamp(p * 1.8);
  g.beginPath(); g.moveTo(x0 - 20, y0 - 30); g.lineTo(x0 + (cols - 1) * cw + 20, y0 + (rows - 1) * rh + 18); g.stroke();
  g.restore();
  text(g, 'ℵ₁', W - 380, 300, { size: 90, weight: 800, color: '#f6efdf', glow: 22, font: FONT_SERIF });
  caps(g, 'CANTOR · DIAGONAL · 1891', W - 380, 360, { size: 11, ls: 2.6 });
  ghostWord(g, 'R', W * 0.84, 700, 420, { alpha: 0.10 });
}

// 32. 黎曼 ζ
function mRiemann(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.7 });
  ghostWord(g, 'R', W * 0.78, 640, 520, { alpha: 0.10 });
  // 网格球
  const cx = 470, cy = 520, R = 190;
  g.save(); g.strokeStyle = 'rgba(150,200,240,0.35)'; g.lineWidth = 1.1;
  for (let i = 1; i <= 7; i++) { g.beginPath(); g.ellipse(cx, cy, R * i / 7, R, 0, 0, 6.2832); g.stroke(); }
  for (let i = 1; i <= 6; i++) { g.beginPath(); g.ellipse(cx, cy, R, R * i / 7, 0, 0, 6.2832); g.stroke(); }
  g.restore();
  softGlow(g, cx, cy, 220, '160,210,255', 0.22);
  glowDot(g, cx, cy, 6, { a: 1 });
  // ζ 曲线
  const pts = [];
  for (let i = 0; i <= 80; i++) { const u = i / 80; pts.push([760 + u * 620, 620 - Math.sin(u * 7.4) * 90 - u * 60]); }
  glowLine(g, pts, { w: 2.4, color: '#ffd9a2', glow: 20, alpha: 0.9 });
  caps(g, 'ζ(s) = Σ 1/nˢ', 1290, 260, { size: 16, ls: 1, align: 'right', color: 'rgba(240,226,200,0.75)' });
  caps(g, 'RIEMANN · 1859', 1290, 300, { size: 11, ls: 3, align: 'right' });
}

// 33. 1906 / UNPROVED
function mUnproved(g, t, p) {
  bgStar(g, t, { glow: 0.12, rad: 0.9 });
  const k = smooth(clamp(p * 2.2));
  // 粒子云
  const r = mulberry(505);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 420; i++) {
    const x = 300 + r() * 1050, y = 220 + r() * 520;
    const a = 0.10 + 0.5 * r() * (0.6 + 0.4 * Math.sin(t * 2 + i));
    g.fillStyle = `rgba(255,214,150,${a})`;
    g.fillRect(x, y, 2.4, 2.4);
  }
  g.restore();
  softGlow(g, 700, 420, 520, '255,214,160', 0.22);
  g.save(); g.globalAlpha = k;
  text(g, '1906', 400, 400, { size: 150, weight: 900, color: '#fdf8ee', glow: 34, font: FONT_EN, align: 'left' });
  text(g, 'UNPROVED', 400, 500, { size: 54, weight: 900, color: '#e05a46', glow: 18, font: FONT_EN, align: 'left', ls: 6 });
  caps(g, '至今无人能证明', 400, 560, { size: 15, ls: 2.4, align: 'left', color: 'rgba(240,220,190,0.65)' });
  g.restore();
  dust(g, t, { n: 120, seed: 131, alpha: 0.5 });
}

// 36. 图灵 · 迷宫
function mTuring(g, t, p) {
  bgStone(g, t, { warm: 0.45, dark: 0.72 });
  const r = mulberry(909);
  g.save(); g.strokeStyle = 'rgba(240,214,170,0.42)'; g.lineWidth = 2.2;
  for (let i = 0; i < 14; i++) {
    let x = 120 + r() * 1000, y = 140 + r() * 700;
    g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 8; k++) {
      if (r() > 0.5) x += (r() - 0.5) * 220; else y += (r() - 0.5) * 160;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  g.restore();
  // 发光路径
  const pts = [];
  for (let i = 0; i <= 60; i++) { const u = i / 60; pts.push([180 + u * 1200, 560 + Math.sin(u * 9) * 120 * (1 - u * 0.4)]); }
  glowLine(g, pts, { w: 3, color: '#ffd9a2', glow: 26, alpha: 0.9 });
  ghostWord(g, '18/1', W * 0.72, 300, 200, { alpha: 0.12 });
  caps(g, 'TURING · 1936 · 可计算数', W - 120, 200, { size: 11, ls: 2.6, align: 'right' });
  dust(g, t, { n: 80, seed: 141, alpha: 0.4 });
}

// 40. 观测者规则（look-and-say）
function mLookSay(g, t, p) {
  bgStone(g, t, { warm: 0.5, dark: 0.66 });
  const cols = 96, rows = 26, cw = 10.5, rh = 24;
  const x0 = 320, y0 = 300;
  const k = clamp(p * 1.8);
  g.save();
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) / (rows + cols) > k) continue;
      const on = ((r * 31 + c * 17) % 5) > 1;
      g.fillStyle = on ? 'rgba(255,206,130,0.85)' : 'rgba(255,206,130,0.12)';
      g.fillRect(x0 + c * cw, y0 + r * rh, cw - 2.4, rh - 6);
    }
  }
  g.restore();
  caps(g, "CONWAY'S LOOK-AND-SAY · 1986", x0, y0 - 60, { size: 11, ls: 2.8, align: 'left' });
  caps(g, '规则一条接一条，永不停', x0, y0 + rows * rh + 60, { size: 15, ls: 2, align: 'left', color: 'rgba(240,220,190,0.65)' });
}

// 41. 弯曲空间
function mSpheres(g, t, p) {
  bgStone(g, t, { warm: 0.35, dark: 0.7 });
  const cx = W / 2;
  g.save(); g.strokeStyle = 'rgba(150,200,240,0.22)'; g.lineWidth = 1.2;
  for (let i = 0; i < 20; i++) {
    g.beginPath(); g.ellipse(cx, 520, 90 + i * 42, 60 + i * 28, 0, 0, 6.2832); g.stroke();
  }
  g.restore();
  softGlow(g, 620, 500, 320, '255,224,180', 0.55);
  softGlow(g, 1080, 500, 320, '255,224,180', 0.55);
  g.save();
  [[620, 500], [1080, 500]].forEach(([x, y]) => {
    const rg = g.createRadialGradient(x, y, 10, x, y, 150);
    rg.addColorStop(0, 'rgba(255,246,224,0.95)'); rg.addColorStop(0.55, 'rgba(255,210,150,0.35)'); rg.addColorStop(1, 'rgba(255,190,120,0)');
    g.fillStyle = rg; g.fillRect(x - 160, y - 160, 320, 320);
  });
  g.restore();
  g.save(); g.strokeStyle = 'rgba(255,230,190,0.75)'; g.lineWidth = 1.6;
  [[620, 500], [1080, 500]].forEach(([x, y]) => {
    for (let i = 1; i <= 6; i++) { g.beginPath(); g.ellipse(x, y, 100 * i / 6, 100, 0, 0, 6.2832); g.stroke(); }
  });
  g.restore();
  text(g, '陈省身', 120, 300, { size: 46, weight: 800, align: 'left', glow: 14 });
  caps(g, 'CHERN · 1944 · 弯曲空间', 122, 340, { size: 10.5, ls: 2.6, align: 'left' });
  caps(g, '弯曲空间，折起直线', W / 2, 780, { size: 15, ls: 2.2, color: 'rgba(240,220,190,0.6)' });
}

// 42. 丘成桐 · 线框环
function mYau(g, t, p) {
  bgStar(g, t, { glow: 0.14, rad: 1.0 });
  const cx = 660, cy = 500;
  const pts = [];
  for (let i = 0; i <= 160; i++) {
    const u = i / 160 * 6.2832;
    pts.push([cx + Math.cos(u) * 300, cy + Math.sin(u) * 190 + Math.sin(u * 3) * 40]);
  }
  glowLine(g, pts, { w: 2.4, color: '#ffd9a2', glow: 22, alpha: 0.85 });
  g.save(); g.strokeStyle = 'rgba(200,225,250,0.3)'; g.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const u = i / 18 * 6.2832;
    g.beginPath();
    g.moveTo(cx + Math.cos(u) * 300, cy + Math.sin(u) * 190 + Math.sin(u * 3) * 40);
    g.lineTo(cx + Math.cos(u) * 190, cy + Math.sin(u) * 120 + 70);
    g.stroke();
  }
  g.restore();
  text(g, '丘成桐', 120, 300, { size: 46, weight: 800, align: 'left', glow: 14 });
  caps(g, 'YAU · 1976 · 陈-高斯-博内', 122, 340, { size: 10.5, ls: 2.4, align: 'left' });
}

// 47. 孤星
function mLoneStar(g, t, p) {
  bgStar(g, t, { glow: 0.08, rad: 0.8 });
  const sx = 1100, sy = 300;
  glowDot(g, sx, sy, 5, { a: 0.9 });
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createLinearGradient(sx - 400, sy, sx, sy - 40);
  gr.addColorStop(0, 'rgba(255,200,140,0)'); gr.addColorStop(1, 'rgba(255,226,180,0.35)');
  g.fillStyle = gr; g.fillRect(sx - 420, sy - 40, 420, 30);
  g.restore();
  caps(g, 'ONE MAN SOLVED IT · 1994', 120, 200, { size: 11, ls: 2.8, align: 'left' });
  dust(g, t, { n: 60, seed: 151, alpha: 0.35 });
}

// 54. 六道门（问题清单）
function mProblemList(g, t, p) {
  bgStone(g, t, { warm: 0.5, dark: 0.7 });
  const k = clamp(p * 1.8);
  // 大 F/门 形发光块
  g.save(); g.globalAlpha = 0.9 * k;
  g.strokeStyle = 'rgba(255,214,160,0.9)'; g.lineWidth = 6; g.shadowColor = '#ffcf8a'; g.shadowBlur = 40;
  g.strokeRect(220, 260, 240, 480);
  g.strokeRect(280, 340, 240, 400);
  g.shadowBlur = 0; g.restore();
  const items = [['01', '庞加莱猜想', '已解'], ['02', '黎曼猜想', '待解'], ['03', 'P 与 NP', '待解']];
  items.forEach(([no, name, st], i) => {
    const y = 300 + i * 92;
    caps(g, no, 620, y, { size: 22, ls: 1, align: 'left', color: '#ffd9a2' });
    text(g, name, 700, y, { size: 34, weight: 800, align: 'left', glow: 10 });
    caps(g, st, W - 220, y, { size: 16, ls: 2, align: 'right', color: st === '已解' ? '#ffcf8a' : 'rgba(230,210,180,0.5)' });
  });
  caps(g, 'MILLENNIUM · 2000', 620, 240, { size: 11, ls: 3, align: 'left' });
  dust(g, t, { n: 70, seed: 161, alpha: 0.4 });
}


// 48. 怀尔斯 · 有理由的曲线
function mWiles(g, t, p) {
  bgStone(g, t, { warm: 0.55, dark: 0.66 });
  const pts = [];
  for (let i = 0; i <= 120; i++) {
    const u = i / 120;
    pts.push([260 + u * 1100, 520 - Math.sin(u * 5.2) * 150 - Math.sin(u * 11) * 40]);
  }
  glowLine(g, pts, { w: 4, color: '#ffe0ae', glow: 30, alpha: 0.95 });
  glowDot(g, 1180, 330, 8, { a: 1 });
  text(g, '有理由', 1240, 320, { size: 26, weight: 700, align: 'left', glow: 10 });
  caps(g, 'e · 1994 · WILES', 1242, 356, { size: 10.5, ls: 2.4, align: 'left' });
  text(g, '怀尔斯', 120, 300, { size: 42, weight: 800, align: 'left', glow: 14 });
  caps(g, 'ANDREW WILES · 1994', 122, 338, { size: 10.5, ls: 2.6, align: 'left' });
  dust(g, t, { n: 60, seed: 171, alpha: 0.35 });
}
