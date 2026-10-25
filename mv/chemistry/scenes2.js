/* 元素之歌 · 场景层（后半） */
'use strict';

// ---------------------------------------------------------------- 19 门捷列夫
ART.mendeleev = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '1869', cx: 0.6, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'mendeleev', 100, 150, 420, 580, { z: 1.04, label: 'PLATE 084 · MENDELEEV', caption: '门捷列夫 · 克拉姆斯柯依 · 1878', alpha: a });
  plateCaption(g, 'mendeleev', 100, 762, 420);
  if (hasAsset('mendeleev_table')) {
    plate(g, 'mendeleev_table', 700, 160, 500, 600, { z: 1.02, label: 'PLATE 084b · 1869 TABLE', caption: '门捷列夫 1869 年手绘周期表', alpha: a, halftone: 0.05 });
    plateCaption(g, 'mendeleev_table', 700, 782, 500);
  }
  // 空格标注
  g.save(); g.globalAlpha = a;
  const marks = [['Eka-Al', 31, 1240, 250], ['Eka-Si', 32, 1240, 380], ['Eka-B', 21, 1240, 510]];
  for (const [name, z, x, y] of marks) {
    g.strokeStyle = 'rgba(226,164,94,0.8)'; g.lineWidth = 1.2;
    g.setLineDash([4, 4]);
    g.strokeRect(x, y, 190, 84);
    g.setLineDash([]);
    text(g, name, x + 14, y + 30, { size: 22, font: FONT_EN_SERIF, color: C.amber2 });
    mono(g, 'Z = ?  预测 ' + z, x + 14, y + 58, { size: 11, color: 'rgba(245,207,146,0.75)' });
    // 指向表
    g.beginPath(); g.moveTo(x, y + 42); g.lineTo(1200, y + 42); g.stroke();
  }
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(0.8, 1.6, e));
  mono(g, '1869 · 门捷列夫把 63 种元素排成一张表', 740, 836, { size: 11, color: 'rgba(190,215,228,0.55)' });
  text(g, '他留下空格，是因为他知道：', 1240, 660, { size: 16, font: FONT_CN, color: 'rgba(220,232,238,0.75)' });
  text(g, '表应该比已知的元素更大。', 1240, 690, { size: 16, font: FONT_CN, color: 'rgba(220,232,238,0.75)' });
  g.restore();
};

// ---------------------------------------------------------------- 20 填满空格
ART.filled = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '1875', cx: 0.5, cy: 0.4 });
  const items = [
    ['gallium', 'Ga', '镓', '1875', '密度 5.9 → 实测 5.91 g/cm³'],
    ['germanium', 'Ge', '锗', '1886', 'M 72 → 实测 72.63'],
    ['scandium', 'Sc', '钪', '1879', '氧化物 Sc₂O₃'],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 150 + i * 560, y = 220;
    const [key, sym, cn, yr, note] = items[i];
    plate(g, key, x, y, 420, 320, { z: 1.05, label: 'FIG. ' + (87 + i) + ' · ' + sym, caption: cn + ' · 发现于 ' + yr, alpha: 0.95 });
    elemChip(g, sym, x + 240, y + 250, 0.44, {});
    text(g, note, x, y + 380, { size: 13, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  }
  g.save();
  mono(g, '1871 · 门捷列夫的三个预言', 150, 200, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '后来世界真的回来，把空格一一填满。', W / 2, 700, { size: 26, font: FONT_CN_SERIF, color: 'rgba(235,240,238,0.85)', align: 'center' });
  mono(g, 'Eka-aluminium → Gallium (1875)   Eka-silicon → Germanium (1886)   Eka-boron → Scandium (1879)', W / 2, 742, { size: 10.5, align: 'center', color: 'rgba(190,215,228,0.5)' });
  g.restore();
};

// ---------------------------------------------------------------- 21 命名
ART.naming = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'ELEMENT', cx: 0.5, cy: 0.42 });
  g.save();
  g.translate(960, 500); g.rotate(-0.008);
  g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 40;
  g.fillStyle = 'rgba(214,204,184,0.97)';
  g.fillRect(-820, -310, 1640, 620);
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(90,76,56,0.35)'; g.lineWidth = 1; g.strokeRect(-820, -310, 1640, 620);
  g.restore();
  const chars = [
    ['钠', '钅', '内', 'Na', '一种金属'],
    ['碳', '石', '炭', 'C', '一种非金属固体'],
    ['溴', '氵', '臭', 'Br', '一种液体'],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 260 + i * 470, y = 290;
    const p = smooth(inv(i * 0.35, i * 0.35 + 0.7, e));
    g.save(); g.globalAlpha = p;
    g.fillStyle = 'rgba(218,210,192,0.94)'; g.fillRect(x, y, 360, 380);
    g.strokeStyle = 'rgba(90,76,56,0.4)'; g.lineWidth = 1; g.strokeRect(x + 0.5, y + 0.5, 359, 379);
    text(g, chars[i][0], x + 180, y + 150, { size: 140, weight: 500, font: FONT_CN_SERIF, color: '#241d15', align: 'center' });
    mono(g, chars[i][3] + ' · ' + chars[i][4], x + 180, y + 255, { size: 11, align: 'center', color: 'rgba(70,58,44,0.7)' });
    text(g, chars[i][1], x + 76, y + 340, { size: 36, font: FONT_CN_SERIF, color: '#8a3a2a' });
    text(g, chars[i][2], x + 180, y + 340, { size: 36, font: FONT_CN_SERIF, color: '#3a4a3a' });
    mono(g, '部首·类别', x + 40, y + 372, { size: 9, color: 'rgba(70,58,44,0.6)' });
    mono(g, '声旁·读音', x + 146, y + 372, { size: 9, color: 'rgba(70,58,44,0.6)' });
    g.restore();
  }
  g.save(); g.globalAlpha = smooth(inv(0.2, 1.0, e));
  mono(g, '1871 · 徐寿《化学鉴原》', 150, 168, { size: 12, color: 'rgba(245,207,146,0.9)' });
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(1.6, 2.4, e));
  g.fillStyle = 'rgba(150,44,32,0.9)'; g.fillRect(1600, 640, 110, 110);
  text(g, '化学', 1655, 676, { size: 30, font: FONT_CN_SERIF, color: 'rgba(248,240,224,0.95)', align: 'center' });
  text(g, '鉴原', 1655, 716, { size: 30, font: FONT_CN_SERIF, color: 'rgba(248,240,224,0.95)', align: 'center' });
  g.restore();
};

// ---------------------------------------------------------------- 22 变化 4
ART.change4 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Δ', cx: 0.5, cy: 0.45 });
  const pairs = [['Cu', 'CuO', 'copper'], ['Fe', 'Fe₂O₃', 'battery'], ['S', 'SO₂', 'sulfur'], ['Hg', 'HgO', 'gallium']];
  for (let i = 0; i < 4; i++) {
    const x = 220 + (i % 2) * 760, y = 230 + Math.floor(i / 2) * 300;
    const act = Math.floor(t * 3) % 4 === i;
    g.save(); g.globalAlpha = act ? 1 : 0.4;
    g.strokeStyle = act ? 'rgba(226,164,94,0.9)' : 'rgba(150,200,220,0.25)'; g.lineWidth = act ? 2 : 1;
    g.strokeRect(x, y, 680, 240);
    plate(g, pairs[i][2], x + 16, y + 16, 240, 208, { z: 1.1, frame: false, alpha: 0.9 });
    text(g, pairs[i][0], x + 290, y + 100, { size: 68, font: FONT_EN_SERIF, color: act ? C.amber2 : C.paper });
    text(g, '→ ' + pairs[i][1], x + 290, y + 170, { size: 34, font: FONT_EN_SERIF, color: 'rgba(205,225,232,0.85)' });
    g.restore();
  }
};

// ---------------------------------------------------------------- 23 焰色
ART.flame = (g, e, dur, t) => {
  bgPhoto(g, 'flames', t, { dim: 0.5, z: 1.02 + e * 0.002 });
  const a = smooth(inv(0.2, 1.0, e));
  g.save(); g.globalAlpha = a;
  mono(g, '1860 · FLAME TEST', 110, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '烧出红色', 110, 300, { size: 54, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '烧出绿色', 110, 365, { size: 54, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '每一种金属，都有一束自己的焰色。', 110, 440, { size: 16, font: FONT_CN, color: 'rgba(215,230,236,0.72)' });
  const rows = [['Li', '锂', 670.78, '#e2553f'], ['Na', '钠', 589.00, '#f0c24a'], ['Cu', '铜', 521.82, '#63c98a'], ['K', '钾', 404.41, '#b58fe0']];
  let y = 500;
  for (const [sym, cn, nm, col] of rows) {
    g.fillStyle = col; g.fillRect(110, y - 12, 44, 18);
    mono(g, sym + ' ' + cn, 172, y, { size: 14, color: 'rgba(235,242,244,0.9)' });
    mono(g, nm.toFixed(2) + ' nm', 300, y, { size: 12, color: 'rgba(190,215,228,0.65)' });
    y += 42;
  }
  g.restore();
  g.save(); g.globalAlpha = a;
  text(g, '焰色不是燃烧产物的颜色，', 1180, 300, { size: 17, font: FONT_CN, color: 'rgba(215,230,236,0.72)' });
  text(g, '是原子被加热后，电子跳回低能级时发出的光。', 1180, 330, { size: 17, font: FONT_CN, color: 'rgba(215,230,236,0.72)' });
  mono(g, 'E = hc / λ', 1180, 380, { size: 20, color: 'rgba(245,207,146,0.85)' });
  g.restore();
};

// ---------------------------------------------------------------- 24 镭
ART.radium = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Ra', cx: 0.55, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'curie', 120, 160, 360, 480, { z: 1.04, label: 'PLATE 102 · MARIE CURIE', caption: '玛丽·居里 · 1903', alpha: a });
  plateCaption(g, 'curie', 120, 662, 360);
  plate(g, 'pitchblende', 520, 470, 300, 240, { z: 1.06, label: 'PLATE 102b · PITCHBLENDE', caption: '沥青铀矿 · 镭的原料', alpha: a });
  // 暗处的镭光
  const px = 1260, py = 460;
  softGlow(g, px, py, 260 + 20 * Math.sin(t * 1.3), '150,235,190', 0.18);
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(190,240,215,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(px - 40, py - 70); g.lineTo(px - 40, py + 40); g.quadraticCurveTo(px, py + 100, px + 40, py + 40); g.lineTo(px + 40, py - 70); g.stroke();
  g.fillStyle = 'rgba(160,240,200,0.12)'; g.fillRect(px - 38, py + 20, 76, 40);
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(0.5, 1.4, e));
  mono(g, '1898 · PARIS · 棚屋', 820, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '寒冷的旧棚屋里', 820, 300, { size: 46, font: FONT_CN_SERIF, color: C.paper });
  text(g, '幽幽的微光', 820, 360, { size: 46, font: FONT_CN_SERIF, color: C.paper });
  text(g, '居里夫妇处理了几吨沥青铀矿，', 820, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '才得到 0.1 克氯化镭。', 820, 468, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  mono(g, '1 g Ra-226 ≈ 3.7 × 10¹⁰ 次衰变/秒（1 Ci 的定义）', 820, 530, { size: 11.5, color: 'rgba(190,235,210,0.75)' });
  g.restore();
  elemChip(g, 'Ra', 1560, 600, 0.68, {});
};

// ---------------------------------------------------------------- 25 合成氨
ART.haber = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'NH3', cx: 0.5, cy: 0.4 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'oppau', 100, 170, 620, 360, { z: 1.03, label: 'PLATE 106 · OPPAU 1914', caption: '奥堡合成氨厂 · 1913 年投产', alpha: a });
  plateCaption(g, 'oppau', 100, 552, 620);
  // 反应式
  g.save(); g.globalAlpha = a;
  mono(g, '1909 · 哈伯法 / 1913 · 博施工业化', 100, 620, { size: 12, color: 'rgba(226,164,94,0.9)' });
  formula(g, 'N2 + 3H2 ⇌ 2NH3', 100, 690, { size: 34, color: 'rgba(245,232,210,0.92)' });
  mono(g, '450 °C · 200 atm · 铁催化剂', 100, 740, { size: 12, color: 'rgba(190,215,228,0.65)' });
  g.restore();
  // 流程图
  const cx = 1080, cy = 480;
  g.save(); g.globalAlpha = a;
  // 氮气/氢气
  softGlow(g, cx - 240, cy, 70, '127,212,230', 0.25);
  softGlow(g, cx - 100, cy, 70, '226,164,94', 0.2);
  text(g, 'N₂', cx - 240, cy, { size: 40, font: FONT_EN_SERIF, color: C.cyan2, align: 'center' });
  text(g, 'H₂', cx - 100, cy, { size: 40, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
  glowLine(g, [[cx - 160, cy + 70], [cx, cy + 70]], { w: 1.5, color: 'rgba(200,235,242,0.5)', glow: 8 });
  // 反应器
  g.strokeStyle = 'rgba(200,235,242,0.65)'; g.lineWidth = 2;
  g.beginPath(); g.roundRect ? g.roundRect(cx + 20, cy - 130, 160, 300, 16) : g.rect(cx + 20, cy - 130, 160, 300); g.stroke();
  g.fillStyle = 'rgba(127,212,230,0.05)'; g.fill();
  mono(g, 'Fe', cx + 100, cy - 60, { size: 16, align: 'center', color: 'rgba(226,164,94,0.9)' });
  mono(g, '450°C', cx + 100, cy - 20, { size: 10, align: 'center', color: 'rgba(190,215,228,0.6)' });
  mono(g, '200 atm', cx + 100, cy + 6, { size: 10, align: 'center', color: 'rgba(190,215,228,0.6)' });
  // 产物
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.4);
  softGlow(g, cx + 380, cy, 90 + pulse * 15, '226,164,94', 0.18);
  text(g, 'NH₃', cx + 380, cy, { size: 52, font: FONT_EN_SERIF, color: C.amber2, align: 'center', glow: 16 });
  glowLine(g, [[cx + 190, cy + 20], [cx + 310, cy]], { w: 1.5, color: 'rgba(226,164,94,0.55)', glow: 8, dash: [5, 5] });
  mono(g, '你身体里约一半的氮原子，来自这个反应。', cx + 380, cy + 90, { size: 13, align: 'center', color: 'rgba(215,230,236,0.7)' });
  mono(g, '（常被引用的估计）', cx + 380, cy + 114, { size: 10, align: 'center', color: 'rgba(190,215,228,0.45)' });
  g.restore();
  elemChip(g, 'N', 1560, 660, 0.5, {});
};

// ---------------------------------------------------------------- 26 间奏 · 键
ART.inter2 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '', cx: 0.5, cy: 0.42 });
  // 势能曲线
  const x0 = 420, x1 = 1740, y0 = 250, y1 = 760;
  const rmin = 74, D = 436; // pm, kJ/mol
  const rx = r => x0 + (r - 30) / 320 * (x1 - x0);
  const ry = E => y1 - (E + 520) / 600 * (y1 - y0);
  g.save();
  g.strokeStyle = 'rgba(150,200,220,0.25)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, y1); g.lineTo(x1, y1); g.moveTo(x0, y0); g.lineTo(x0, y1); g.stroke();
  mono(g, 'r / pm', x1, y1 + 26, { size: 11, align: 'right', color: 'rgba(190,215,228,0.5)' });
  mono(g, 'E / kJ·mol⁻¹', x0 - 10, y0 - 16, { size: 11, color: 'rgba(190,215,228,0.5)' });
  g.save();
  g.beginPath(); g.rect(x0, y0, x1 - x0, y1 - y0); g.clip();
  const curve = [];
  for (let r = 30; r <= 350; r += 2) {
    const E = 436 * (Math.exp(-2 * 1.94 * (r - rmin) / rmin) - 2 * Math.exp(-1.94 * (r - rmin) / rmin));
    curve.push([rx(r), ry(E)]);
  }
  // 填充
  g.beginPath(); g.moveTo(curve[0][0], y1);
  curve.forEach(p => g.lineTo(p[0], p[1]));
  g.lineTo(curve[curve.length - 1][0], y1); g.closePath();
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, 'rgba(127,212,230,0.02)');
  gr.addColorStop(1, 'rgba(127,212,230,0.12)');
  g.fillStyle = gr; g.fill();
  glowLine(g, curve, { w: 2.2, color: 'rgba(160,225,240,0.9)', glow: 14 });
  g.restore();
  // 最低点
  glowDot(g, rx(rmin), ry(-436), 3, { color: '226,164,94' });
  g.strokeStyle = 'rgba(226,164,94,0.5)'; g.lineWidth = 1; g.setLineDash([3, 4]);
  g.beginPath(); g.moveTo(rx(rmin), ry(-436)); g.lineTo(rx(rmin), y1); g.stroke();
  g.setLineDash([]);
  mono(g, '74 pm', rx(rmin) + 8, y1 - 18, { size: 12, color: 'rgba(226,164,94,0.85)' });
  mono(g, '−436 kJ/mol', rx(rmin) + 8, ry(-436) - 18, { size: 12, color: 'rgba(226,164,94,0.85)' });
  g.restore();
  annotation(g, '间奏 · 化学键', 'INTERLUDE · THE BOND · 1916', 90, 830, 1);
};

// ---------------------------------------------------------------- 27 间奏 · 原子
ART.inter3 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Z', cx: 0.5, cy: 0.42 });
  const cx = 760, cy = 480;
  // 原子核与电子云
  softGlow(g, cx, cy, 90, '226,164,94', 0.3);
  for (let i = 0; i < 30; i++) {
    const ang = i / 30 * 6.2832, rr = 30 + (i % 5) * 5;
    g.fillStyle = i % 2 ? 'rgba(226,164,94,0.9)' : 'rgba(210,215,220,0.8)';
    g.beginPath(); g.arc(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr, 4, 0, 6.2832); g.fill();
  }
  for (let k = 1; k <= 3; k++) {
    g.strokeStyle = `rgba(127,212,230,${0.35 - k * 0.08})`; g.lineWidth = 1;
    g.beginPath(); g.ellipse(cx, cy, 90 * k, 40 * k, -0.4, 0, 6.2832); g.stroke();
    // 电子
    for (let j = 0; j < k * 2; j++) {
      const ang = t * (0.7 + k * 0.2) + j / (k * 2) * 6.2832;
      const ex = cx + Math.cos(ang) * 90 * k, ey = cy + Math.sin(ang) * 40 * k;
      const rx = (ex - cx) * Math.cos(-0.4) - (ey - cy) * Math.sin(-0.4);
      const ry = (ex - cx) * Math.sin(-0.4) + (ey - cy) * Math.cos(-0.4);
      glowDot(g, cx + rx, cy + ry, 2, { a: 0.8 });
    }
  }
  g.save();
  mono(g, '1913 · 玻尔 / 1926 · 薛定谔', 1080, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '原子不是一个缩小的太阳系。', 1080, 310, { size: 34, font: FONT_CN_SERIF, color: C.paper });
  text(g, '电子没有轨道，只有概率。', 1080, 364, { size: 34, font: FONT_CN_SERIF, color: C.paper });
  mono(g, 'ψ(x) → |ψ|² = 概率密度', 1080, 430, { size: 15, color: 'rgba(127,212,230,0.8)' });
  g.restore();
};

// ---------------------------------------------------------------- 28 化学键
ART.bond = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'H:H', cx: 0.5, cy: 0.42 });
  const cy = 500;
  const xa = 700, xb = 1180, r = 74 * 3.2;
  // 电子云
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient((xa + xb) / 2, cy, 0, (xa + xb) / 2, cy, 300);
  gr.addColorStop(0, 'rgba(127,212,230,0.18)');
  gr.addColorStop(0.5, 'rgba(127,212,230,0.08)');
  gr.addColorStop(1, 'rgba(127,212,230,0)');
  g.fillStyle = gr; g.fillRect((xa + xb) / 2 - 300, cy - 300, 600, 600);
  g.restore();
  // 原子核
  softGlow(g, xa, cy, 60, '226,164,94', 0.35);
  softGlow(g, xb, cy, 60, '226,164,94', 0.35);
  text(g, 'H', xa, cy, { size: 34, font: FONT_EN_SERIF, color: C.paper, align: 'center' });
  text(g, 'H', xb, cy, { size: 34, font: FONT_EN_SERIF, color: C.paper, align: 'center' });
  // 共享电子
  for (let i = 0; i < 2; i++) {
    const ang = t * 1.4 + i * Math.PI;
    const ex = (xa + xb) / 2 + Math.cos(ang) * 70, ey = cy + Math.sin(ang) * 46;
    glowDot(g, ex, ey, 3, { color: '127,212,230', a: 0.9 });
  }
  // 距离标注
  g.save();
  g.strokeStyle = 'rgba(226,164,94,0.7)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(xa, cy + 120); g.lineTo(xb, cy + 120); g.stroke();
  for (const x of [xa, xb]) { g.beginPath(); g.moveTo(x, cy + 112); g.lineTo(x, cy + 128); g.stroke(); }
  mono(g, '74 pm', (xa + xb) / 2, cy + 146, { size: 13, align: 'center', color: 'rgba(245,207,146,0.85)' });
  // 点符号
  text(g, 'H·', 420, cy, { size: 44, font: FONT_EN_SERIF, color: 'rgba(220,235,240,0.7)', align: 'center' });
  text(g, '+', 520, cy, { size: 30, font: FONT_EN_SERIF, color: 'rgba(190,215,228,0.5)', align: 'center' });
  text(g, '·H', 620, cy, { size: 44, font: FONT_EN_SERIF, color: 'rgba(220,235,240,0.7)', align: 'center' });
  text(g, '→', 660, cy - 100, { size: 30, font: FONT_EN_SERIF, color: 'rgba(226,164,94,0.6)' });
  g.restore();
  g.save();
  mono(g, '1916 · G. N. LEWIS', 100, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '两个小点', 100, 310, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '就能连成一个化学键', 100, 372, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '共用一对电子，两个原子就都“满”了。', 100, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  g.restore();
};

// ---------------------------------------------------------------- 29 电子云
ART.orbital = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'ψ', cx: 0.5, cy: 0.45 });
  const cx = 840, cy = 500;
  // 1s 概率云：r^2 e^{-2r/a0} 采样
  const r = mulberry(1919);
  g.save(); g.globalCompositeOperation = 'lighter';
  const N = 2600, a0 = 52.9 * 2.4;
  for (let i = 0; i < N; i++) {
    // 用拒绝采样
    let rr, u;
    do { rr = -a0 * 0.5 * Math.log(1 - r()); u = r(); } while (u > (rr * rr) / (a0 * a0) * Math.exp(-2 * rr / a0) * Math.exp(2));
    const th = r() * 6.2832, ph = Math.acos(2 * r() - 1);
    const x = cx + rr * Math.sin(ph) * Math.cos(th) * 1.0;
    const y = cy + rr * Math.sin(ph) * Math.sin(th) * 0.9 + rr * Math.cos(ph) * 0.35;
    const a = 0.05 + 0.22 * r();
    g.globalAlpha = a;
    g.fillStyle = `rgba(${140 + r() * 60 | 0},${205 + r() * 40 | 0},${220 + r() * 30 | 0},1)`;
    g.fillRect(x, y, 1.5, 1.5);
  }
  g.restore();
  softGlow(g, cx, cy, 34, '255,240,200', 0.45);
  g.fillStyle = '#fff8e8'; g.beginPath(); g.arc(cx, cy, 5, 0, 6.2832); g.fill();
  mono(g, 'a₀ = 52.9 pm', cx, cy + 250, { size: 12, align: 'center', color: 'rgba(190,215,228,0.7)' });
  mono(g, '|ψ₁ₛ|² ∝ e^(−2r/a₀)', cx, cy + 274, { size: 11, align: 'center', color: 'rgba(190,215,228,0.5)' });
  g.save();
  mono(g, '1926 · SCHRÖDINGER', 120, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '电子不是小球', 120, 310, { size: 46, font: FONT_CN_SERIF, color: C.paper });
  text(g, '是一团概率的云', 120, 370, { size: 46, font: FONT_CN_SERIF, color: C.paper });
  text(g, '你没法同时说出它在哪里、又跑得多快；', 120, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '只能说出：在这里找到它的概率。', 120, 468, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  g.restore();
};

// ---------------------------------------------------------------- 30 DNA 衍射
let _dnaTex = null;
function dnaDiffraction() {
  if (_dnaTex) return _dnaTex;
  const s = 560, cv = mk(s, s), g = cv.getContext('2d');
  const im = g.createImageData(s, s);
  const r = mulberry(51);
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const dx = (x - s / 2) / s, dy = (y - s / 2) / s;
    const rr = Math.hypot(dx, dy);
    // X 形臂
    const u = Math.abs(dx - dy), v = Math.abs(dx + dy);
    let I = 0;
    // 两条对角臂，越靠外越暗
    const arm = Math.exp(-u * u / (2 * 0.020 * 0.020)) + Math.exp(-v * v / (2 * 0.020 * 0.020));
    I += 0.85 * arm * Math.exp(-rr * 3.4);
    // 层线：沿赤道方向的细条纹
    I += 0.16 * Math.exp(-dy * dy / (2 * 0.007 * 0.007)) * Math.exp(-rr * 4.2);
    // 中心光斑
    I += 0.55 * Math.exp(-rr * rr / (2 * 0.010 * 0.010));
    I *= 0.75 + 0.5 * r();
    const v0 = clamp(Math.pow(I, 0.55)) * 255;
    const i4 = (y * s + x) * 4;
    im.data[i4] = v0 * 0.85;
    im.data[i4 + 1] = v0;
    im.data[i4 + 2] = v0 * 0.92;
    im.data[i4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  _dnaTex = cv;
  return cv;
}
ART.dna = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'B', cx: 0.5, cy: 0.42 });
  const dx = 420, dy = 200, ds = 560;
  g.save();
  g.drawImage(dnaDiffraction(), dx, dy, ds, ds);
  g.globalCompositeOperation = 'lighter';
  g.globalAlpha = 0.25; g.fillStyle = 'rgba(4,10,16,0.5)'; g.fillRect(dx, dy, ds, ds);
  g.restore();
  mono(g, 'X 形衍射 · 按 B-DNA 参数（3.4 nm / 10.5 bp）重算，非原始 51 号照片', dx, dy + ds + 22, { size: 10, color: 'rgba(190,215,228,0.55)' });
  // 双螺旋
  const cx = 1420, cy = 480;
  g.save();
  for (let i = 0; i < 2; i++) {
    g.strokeStyle = i ? 'rgba(226,164,94,0.75)' : 'rgba(127,212,230,0.75)';
    g.lineWidth = 2.2;
    g.beginPath();
    for (let k = 0; k <= 100; k++) {
      const yy = cy - 200 + k * 4;
      const xx = cx + Math.sin(k * 0.22 + i * Math.PI + t * 0.5) * 80;
      k ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
    }
    g.stroke();
  }
  for (let k = 0; k <= 46; k++) {
    const yy = cy - 200 + k * 8.7;
    const x1 = cx + Math.sin(k * 0.22 + t * 0.5) * 80;
    const x2 = cx + Math.sin(k * 0.22 + Math.PI + t * 0.5) * 80;
    g.strokeStyle = 'rgba(220,235,240,0.28)'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(x1, yy); g.lineTo(x2, yy); g.stroke();
  }
  g.restore();
  g.save();
  mono(g, '1952 · ROSALIND FRANKLIN · KING’S COLLEGE', 1000, 230, { size: 11.5, color: 'rgba(226,164,94,0.9)' });
  text(g, '一个 X 形的衍射', 1000, 310, { size: 34, font: FONT_CN_SERIF, color: C.paper });
  text(g, '变成螺旋的阶梯', 1000, 360, { size: 34, font: FONT_CN_SERIF, color: C.paper });
  mono(g, '34 Å 螺距 · 10.5 碱基/圈 · 直径 20 Å', 1000, 420, { size: 11, color: 'rgba(190,215,228,0.65)' });
  g.restore();
};

// ---------------------------------------------------------------- 31 胰岛素
ART.insulin = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '51', cx: 0.5, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'insulin_4ins', 1120, 160, 500, 500, { z: 1.05, label: 'PLATE 129 · INSULIN HEXAMER', caption: '胰岛素六聚体 · PDB 4INS', alpha: a, halftone: 0.05 });
  plateCaption(g, 'insulin_4ins', 1120, 682, 500);
  const A = DATA.insulinA, B = DATA.insulinB;
  g.save(); g.globalAlpha = a;
  mono(g, '1965 · 中国 · 人工合成结晶牛胰岛素', 110, 210, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '五十一个氨基酸', 110, 270, { size: 30, font: FONT_CN_SERIF, color: C.paper });
  text(g, '一个接一个连起来', 110, 310, { size: 30, font: FONT_CN_SERIF, color: C.paper });
  // 序列
  const x0 = 110, y0 = 380, step = 18;
  mono(g, 'A 链 · 21', x0, y0 - 26, { size: 11, color: 'rgba(127,212,230,0.8)' });
  mono(g, 'B 链 · 30', x0, y0 + 76, { size: 11, color: 'rgba(226,164,94,0.8)' });
  for (let i = 0; i < A.length; i++) {
    const ch = A[i];
    const bio = 'GIVEQCCTSICSLYQLENYCN';
    text(g, ch, x0 + i * step, y0, { size: 15, font: FONT_MONO, color: i === 5 || i === 10 || i === 19 ? C.amber2 : 'rgba(225,235,240,0.85)' });
  }
  for (let i = 0; i < B.length; i++) {
    text(g, B[i], x0 + i * step, y0 + 100, { size: 15, font: FONT_MONO, color: i === 6 || i === 18 ? C.amber2 : 'rgba(225,235,240,0.85)' });
  }
  // 二硫键
  g.strokeStyle = 'rgba(226,164,94,0.6)'; g.lineWidth = 1.2;
  const links = [[5, 10], [6, 6], [19, 18]];
  for (const [ia, ib] of links) {
    g.beginPath(); g.moveTo(x0 + ia * step, y0 + 12); g.lineTo(x0 + ib * step, y0 + 82); g.stroke();
  }
  mono(g, '—S—S— 二硫键', x0 + 380, y0 + 50, { size: 10, color: 'rgba(245,207,146,0.75)' });
  mono(g, '21 + 30 = 51 个氨基酸 · 分子量约 5808 Da', x0, y0 + 160, { size: 11, color: 'rgba(190,215,228,0.6)' });
  g.restore();
};

// ---------------------------------------------------------------- 32 古书
ART.book = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '', cx: 0.5, cy: 0.42 });
  const a = smooth(inv(0, 1.0, e));
  g.save(); g.globalAlpha = a;
  g.save();
  g.translate(470, 470); g.rotate(-0.01);
  g.shadowColor = 'rgba(0,0,0,0.7)'; g.shadowBlur = 36;
  g.fillStyle = 'rgba(214,204,184,0.97)'; g.fillRect(-340, -300, 680, 600);
  g.shadowBlur = 0;
  g.strokeStyle = 'rgba(90,76,56,0.35)'; g.lineWidth = 1; g.strokeRect(-340, -300, 680, 600);
  g.restore();
  mono(g, '约 340 年 · 葛洪《肘后备急方》', 152, 206, { size: 12, color: 'rgba(110,70,45,0.95)' });
  const quote = '青蒿一握以水二升渍绞取汁尽服之';
  const cols = [quote.slice(0, 6), quote.slice(6, 12), quote.slice(12)];
  const xs = [680, 606, 532];
  cols.forEach((col, ci) => {
    for (let i = 0; i < col.length; i++) {
      text(g, col[i], xs[ci], 260 + i * 56, { size: 38, weight: 500, font: FONT_CN_SERIF, color: '#241d15' });
    }
  });
  g.strokeStyle = 'rgba(160,52,38,0.75)'; g.lineWidth = 2.2;
  g.beginPath(); g.ellipse(680, 288, 26, 62, 0, 0, 6.2832); g.stroke();
  text(g, '屠呦呦读到这里，停住了。', 150, 650, { size: 16, font: FONT_CN, color: 'rgba(42,33,24,0.94)' });
  text(g, '“绞取汁”——不是煎，不是煮。', 150, 682, { size: 16, font: FONT_CN, color: 'rgba(42,33,24,0.94)' });
  mono(g, '低温，才留得住那个过氧桥。', 150, 722, { size: 12, color: 'rgba(90,70,50,0.9)' });
  g.restore();
  if (hasAsset('bencao')) {
    g.save(); g.globalAlpha = a * 0.95;
    plate(g, 'bencao', 1080, 160, 720, 600, { z: 1.05, frame: true, label: 'PLATE 133 · BENCAO GANGMU', caption: '《本草纲目》· 明 · 金陵本', alpha: 1, halftone: 0.04 });
    g.restore();
  }
  if (hasAsset('artemisia')) {
    g.save(); g.globalAlpha = a * 0.95;
    plate(g, 'artemisia', 150, 250, 200, 250, { z: 1.1, frame: true, label: 'PLATE 133b', caption: '黄花蒿', alpha: 1 });
    g.restore();
  }
};

// ---------------------------------------------------------------- 33 低温
ART.cold = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '35°C', cx: 0.5, cy: 0.42 });
  const cx = 700, cy = 520;
  g.save();
  // 水浴
  g.strokeStyle = 'rgba(200,235,242,0.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 260, cy + 60); g.lineTo(cx - 240, cy + 220); g.lineTo(cx + 240, cy + 220); g.lineTo(cx + 260, cy + 60); g.stroke();
  g.fillStyle = 'rgba(127,212,230,0.06)'; g.fill();
  // 烧瓶
  g.beginPath(); g.arc(cx, cy - 10, 110, 0.4, Math.PI - 0.4, false); g.stroke();
  g.beginPath(); g.moveTo(cx - 100, cy + 30); g.lineTo(cx - 40, cy - 130); g.lineTo(cx + 40, cy - 130); g.lineTo(cx + 100, cy + 30); g.stroke();
  // 液体
  g.fillStyle = 'rgba(190,235,200,0.16)';
  g.beginPath(); g.arc(cx, cy + 10, 96, 0.15, Math.PI - 0.15, false); g.fill();
  // 温度计
  g.strokeStyle = 'rgba(226,164,94,0.85)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(cx + 150, cy - 150); g.lineTo(cx + 150, cy + 60); g.stroke();
  g.fillStyle = 'rgba(226,164,94,0.9)'; g.beginPath(); g.arc(cx + 150, cy + 72, 9, 0, 6.2832); g.fill();
  mono(g, '35 °C', cx + 172, cy - 40, { size: 16, color: 'rgba(245,207,146,0.95)' });
  // 蒸汽（冷）
  g.strokeStyle = 'rgba(190,220,230,0.14)'; g.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    for (let i = 0; i <= 30; i++) {
      const yy = cy - 150 - i * 6;
      const xx = cx - 60 + k * 60 + Math.sin(i * 0.2 + t) * 16;
      i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
    }
    g.stroke();
  }
  g.restore();
  g.save();
  mono(g, '1971 · 低温提取', 1080, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '不用火煮', 1080, 310, { size: 48, font: FONT_CN_SERIF, color: C.paper });
  text(g, '要低温', 1080, 370, { size: 48, font: FONT_CN_SERIF, color: C.paper });
  text(g, '青蒿素里有一个过氧桥，怕热。', 1080, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '水煎 100 °C，过氧桥就断了；', 1080, 468, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '乙醚沸点 34.6 °C，刚好把它完整地拿出来。', 1080, 496, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  mono(g, '乙醚 bp 34.6 °C · 青蒿素 C₁₅H₂₂O₅', 1080, 556, { size: 12, color: 'rgba(190,215,228,0.6)' });
  g.restore();
};

// ---------------------------------------------------------------- 34 第 191 号
ART.sample191 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '191', cx: 0.5, cy: 0.42 });
  const n = 8, x0 = 300, y = 470;
  for (let i = 0; i < n; i++) {
    const num = 188 + i;
    const act = num === 191;
    const x = x0 + i * 150;
    const glow = act ? 0.7 + 0.3 * Math.sin(t * 3) : 0;
    if (act) softGlow(g, x + 40, y + 30, 110, '245,190,110', 0.25 + 0.1 * Math.sin(t * 3));
    g.save();
    g.strokeStyle = act ? 'rgba(245,207,146,0.95)' : 'rgba(160,200,215,0.35)';
    g.lineWidth = act ? 2.2 : 1;
    g.beginPath(); g.moveTo(x, y - 120); g.lineTo(x, y - 90); g.lineTo(x + 76, y - 90); g.lineTo(x + 76, y - 120); g.stroke();
    g.beginPath(); g.arc(x + 38, y + 10, 38, 0, 6.2832); g.stroke();
    g.fillStyle = act ? 'rgba(245,190,110,0.18)' : 'rgba(120,170,190,0.06)';
    g.fill();
    text(g, String(num), x + 38, y + 100, { size: 16, font: FONT_MONO, color: act ? C.amber2 : 'rgba(190,215,228,0.6)', align: 'center' });
    if (act) {
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6 + 0.3 * Math.sin(t * 3);
      g.fillStyle = 'rgba(245,207,146,0.5)'; g.fillRect(x + 8, y - 16, 60, 52);
      g.restore();
    }
    g.restore();
  }
  g.save();
  mono(g, '1971 · 第 191 号样品', 300, 240, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '第 191 号样品', 300, 330, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '一次安静的尝试', 300, 392, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '在第 190 次失败之后，第 191 号提取物', 300, 680, { size: 16, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '对鼠疟的抑制率，达到了 100%。', 300, 710, { size: 16, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  mono(g, '1971.10.4 · 青蒿乙醚中性提取物', 300, 760, { size: 12, color: 'rgba(190,215,228,0.55)' });
  g.restore();
};

// ---------------------------------------------------------------- 35 青蒿素
ART.malaria = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '', cx: 0.5, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'artemisia', 110, 190, 300, 380, { z: 1.08, label: 'PLATE 141 · ARTEMISIA ANNUA', caption: '黄花蒿 · 青蒿', alpha: a });
  plateCaption(g, 'artemisia', 110, 600, 300);
  // 青蒿素骨架（简化：三个六元环 + 过氧桥）
  const cx = 940, cy = 470;
  g.save(); g.globalAlpha = a;
  const ring = (ox, oy, rr, rot) => {
    g.beginPath();
    for (let i = 0; i <= 6; i++) {
      const ang = rot + i * Math.PI / 3;
      const x = ox + Math.cos(ang) * rr, y = oy + Math.sin(ang) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  };
  g.strokeStyle = 'rgba(200,235,242,0.75)'; g.lineWidth = 2;
  ring(cx, cy, 100, 0.2);
  ring(cx + 170, cy + 40, 90, 0.6);
  ring(cx - 170, cy + 60, 80, 0.1);
  // 过氧桥
  g.strokeStyle = 'rgba(226,164,94,0.95)'; g.lineWidth = 2.4;
  g.beginPath(); g.moveTo(cx - 20, cy - 90); g.quadraticCurveTo(cx + 70, cy - 140, cx + 120, cy - 40); g.stroke();
  text(g, 'O', cx - 16, cy - 100, { size: 20, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
  text(g, 'O', cx + 124, cy - 44, { size: 20, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
  mono(g, '过氧桥 —O—O— · 抗疟活性的关键', cx + 30, cy - 160, { size: 12, align: 'center', color: 'rgba(245,207,146,0.9)' });
  mono(g, 'C₁₅H₂₂O₅ · M = 282.33', cx, cy + 170, { size: 12, align: 'center', color: 'rgba(190,215,228,0.65)' });
  g.restore();
  g.save(); g.globalAlpha = a;
  mono(g, '1972 · 青蒿素结晶', 1420, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '更多的人', 1420, 310, { size: 44, font: FONT_CN_SERIF, color: C.paper });
  text(g, '因此活了下来', 1420, 366, { size: 44, font: FONT_CN_SERIF, color: C.paper });
  mono(g, 'WHO · 2023 年疟疾报告', 1420, 440, { size: 11, color: 'rgba(190,215,228,0.55)' });
  mono(g, '2.63 亿 病例 / 59.7 万 死亡', 1420, 480, { size: 16, color: 'rgba(235,240,238,0.85)' });
  mono(g, '2000–2022 年，疟疾死亡率下降约 50%', 1420, 512, { size: 12, color: 'rgba(190,215,228,0.6)' });
  g.restore();
};

// ---------------------------------------------------------------- 36 变化 5
ART.change5 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Δ', cx: 0.5, cy: 0.45 });
  const keys = [['battery', 'Li'], ['copper', 'Cu'], ['gallium', 'Ga'], ['sulfur', 'S']];
  for (let i = 0; i < 4; i++) {
    const x = 180 + (i % 2) * 800, y = 240 + Math.floor(i / 2) * 300;
    plate(g, keys[i][0], x, y, 700, 240, { z: 1.04, frame: true, label: 'SAMPLE ' + (i + 1), caption: keys[i][1], alpha: 0.9 });
  }
};

// ---------------------------------------------------------------- 37 锂
ART.lithium = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Li', cx: 0.55, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'battery', 100, 190, 600, 400, { z: 1.04, label: 'PLATE 149 · LI-ION CELL', caption: '18650 与 21700 锂离子电芯', alpha: a });
  plateCaption(g, 'battery', 100, 602, 600);
  // 手机
  const px = 1250, py = 180, pw = 300, ph = 600;
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(210,235,242,0.7)'; g.lineWidth = 2.4;
  g.beginPath(); g.roundRect ? g.roundRect(px, py, pw, ph, 34) : g.rect(px, py, pw, ph); g.stroke();
  g.fillStyle = 'rgba(10,22,34,0.85)'; g.fill();
  // 电池条
  const bp = 0.62;
  g.strokeStyle = 'rgba(190,225,235,0.5)'; g.lineWidth = 2;
  g.strokeRect(px + 50, py + 420, 200, 70);
  g.fillStyle = C.green;
  g.fillRect(px + 56, py + 426, 188 * bp, 58);
  text(g, '62%', px + 150, py + 455, { size: 24, font: FONT_MONO, color: 'rgba(8,18,28,0.9)', align: 'center' });
  // 层状结构
  const lx = px + 150, ly = py + 190;
  for (let k = 0; k < 4; k++) {
    g.strokeStyle = 'rgba(127,212,230,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(lx - 90, ly + k * 36); g.lineTo(lx + 90, ly + k * 36); g.stroke();
    for (let j = 0; j < 5; j++) {
      g.fillStyle = 'rgba(226,164,94,0.55)';
      g.beginPath(); g.arc(lx - 70 + j * 35, ly + k * 36, 3.2, 0, 6.2832); g.fill();
    }
  }
  mono(g, 'LiCoO₂ · 层状', lx, ly - 26, { size: 11, align: 'center', color: 'rgba(190,215,228,0.7)' });
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(0.4, 1.3, e));
  mono(g, '1991 · SONY 商业化 / 2019 · 诺贝尔化学奖', 1000, 220, { size: 11, color: 'rgba(226,164,94,0.9)' });
  text(g, '锂，就睡在你的手机里', 760, 320, { size: 38, font: FONT_CN_SERIF, color: C.paper });
  text(g, '每个锂离子，来回搬一次家，就是一次充放电。', 760, 390, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  mono(g, '3.7 V · 能量密度 150–250 Wh/kg', 760, 440, { size: 12, color: 'rgba(190,215,228,0.6)' });
  mono(g, 'Goodenough · Whittingham · Yoshino', 760, 490, { size: 11, color: 'rgba(190,215,228,0.5)' });
  g.restore();
  elemChip(g, 'Li', 1600, 600, 0.55, {});
};

// ---------------------------------------------------------------- 38 118
ART.full = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '118', cx: 0.5, cy: 0.45 });
  const cell = 58, gw = 18 * (cell + 2);
  const x = (W - gw) / 2, y = 240;
  const reveal = smooth(inv(0.2, 2.4, e));
  // 逐个点亮
  for (let i = 0; i < ELEM.length; i++) {
    const el = ELEM[i];
    const p = TABLE_LAYOUT[el.sym];
    if (!p) continue;
    const cx = x + (p.col - 1) * (cell + 2);
    const cy = p.row > 7 ? y + (7 + (p.row - 8)) * (cell + 2) + 18 : y + (p.row - 1) * (cell + 2);
    if (i / ELEM.length > reveal) continue;
    g.save(); g.globalAlpha = 0.9;
    g.fillStyle = `rgba(${CAT_COLOR[el.cat] ? '226,164,94' : '127,212,230'},0.18)`;
    g.fillRect(cx, cy, cell, cell);
    text(g, el.sym, cx + cell / 2, cy + cell * 0.42, { size: cell * 0.38, font: FONT_EN_SERIF, color: 'rgba(240,240,230,0.9)', align: 'center' });
    g.restore();
  }
  g.restore();
};

// ---------------------------------------------------------------- 39 空格
ART.beyond = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '119', cx: 0.5, cy: 0.45 });
  const cell = 78, x = 470, y = 230;
  periodicTable(g, x, y, 30, { gap: 2, year: 2026, alpha: 0.25 });
  // 空位
  const ex = 1180, ey = 330;
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.6);
  g.save(); g.globalCompositeOperation = 'lighter';
  const gr = g.createRadialGradient(ex + cell / 2, ey + cell / 2, 0, ex + cell / 2, ey + cell / 2, 200);
  gr.addColorStop(0, `rgba(226,164,94,${0.10 + pulse * 0.12})`);
  gr.addColorStop(1, 'rgba(226,164,94,0)');
  g.fillStyle = gr; g.fillRect(ex - 200, ey - 200, 500, 500);
  g.restore();
  g.save();
  g.strokeStyle = `rgba(245,207,146,${0.5 + pulse * 0.5})`; g.lineWidth = 2;
  g.setLineDash([6, 6]);
  g.strokeRect(ex, ey, cell * 1.6, cell * 1.6);
  g.setLineDash([]);
  text(g, '119', ex + cell * 0.8, ey + cell * 0.7, { size: 44, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
  text(g, '?', ex + cell * 0.8, ey + cell * 1.2, { size: 34, font: FONT_EN_SERIF, color: 'rgba(245,207,146,0.7)', align: 'center' });
  mono(g, 'Z = 119 · 还没有名字', ex + cell * 0.8, ey + cell * 1.9, { size: 11, align: 'center', color: 'rgba(190,215,228,0.6)' });
  g.restore();
  g.save();
  mono(g, '2026 · 实验室还在试', 120, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '朋友，表上还有一个空格', 120, 320, { size: 40, font: FONT_CN_SERIF, color: C.paper });
  text(g, '超重元素会在一瞬间衰变，', 120, 400, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '但“稳定岛”也许就在下一个格子里。', 120, 428, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  mono(g, '预测的稳定岛：Z ≈ 114, 120, 126', 120, 480, { size: 12, color: 'rgba(190,215,228,0.6)' });
  g.restore();
};

// ---------------------------------------------------------------- 40–46 终章合唱
const FINALE_GROUPS = [
  ['transition', '过渡金属'],
  ['nonmetal', '非金属'],
  ['halogen', '卤素'],
  ['noble', '稀有气体'],
  ['lanthanide', '镧系'],
  ['actinide', '锕系'],
  ['all', '全部'],
];
FINALE_GROUPS.forEach(([cat, cn], k) => {
  ART['finale' + k] = (g, e, dur, t) => {
    bgInk(g, t, { ghost: k === 6 ? '118' : String(k + 1), cx: 0.5, cy: 0.45, warm: 0.5 });
    const cell = 40, gw = 18 * (cell + 2);
    const x = (W - gw) / 2, y = 250;
    const hi = cat === 'all' ? ELEM.map(e => e.sym) : ELEM.filter(e => e.cat === cat).map(e => e.sym);
    periodicTable(g, x, y, cell, { gap: 2, year: 2026, highlight: hi, alpha: 0.95 });
    // 浮动的元素符号
    const r = mulberry(300 + k * 17);
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 16; i++) {
      const sym = hi[Math.floor(r() * hi.length)];
      const xx = 120 + r() * (W - 240), yy = 140 + r() * 720;
      const a = 0.08 + 0.18 * Math.pow(0.5 + 0.5 * Math.sin(t * 1.1 + i), 2);
      g.globalAlpha = a;
      text(g, sym, xx, yy, { size: 40 + r() * 60, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
    }
    g.restore();
    g.save();
    mono(g, 'CHORUS · ' + (k === 6 ? 'ALL 118' : cn), 120, 200, { size: 12, color: 'rgba(226,164,94,0.9)' });
    text(g, k === 6 ? '118 种元素，一张表' : cn, 120, 880, { size: 24, font: FONT_CN_SERIF, color: 'rgba(235,240,238,0.8)' });
    if (k === 6) {
      g.globalCompositeOperation = 'lighter';
      const gr = g.createRadialGradient(W / 2, 520, 0, W / 2, 520, 600);
      gr.addColorStop(0, 'rgba(226,164,94,0.16)');
      gr.addColorStop(1, 'rgba(226,164,94,0)');
      g.fillStyle = gr; g.fillRect(0, 0, W, H);
    }
    g.restore();
  };
});

// ---------------------------------------------------------------- 47 尾声
ART.coda = (g, e, dur, t) => {
  const phase1 = smooth(inv(0, 1.0, e)) * (1 - smooth(inv(9.5, 11.5, e)));
  // 蓝晒
  g.save();
  g.fillStyle = '#06121c'; g.fillRect(0, 0, W, H);
  if (hasAsset('cyanotype')) {
    g.globalAlpha = phase1;
    coverRect(g, TONED.cyanotype, 0, 0, W, H, 1.02 + e * 0.002, 0.5, 0.42);
  }
  g.fillStyle = `rgba(4,10,18,${0.45 + 0.45 * (1 - phase1)})`; g.fillRect(0, 0, W, H);
  const tg = g.createLinearGradient(0, 0, W * 0.62, 0);
  tg.addColorStop(0, 'rgba(3,7,12,0.82)');
  tg.addColorStop(1, 'rgba(3,7,12,0)');
  g.fillStyle = tg; g.fillRect(0, 0, W, H);
  g.restore();
  g.save(); g.globalAlpha = phase1;
  mono(g, '1842 · CYANOTYPE · SIR JOHN HERSCHEL', 110, 220, { size: 11, color: 'rgba(190,230,240,0.8)' });
  text(g, '一张纸，两种铁盐，一束阳光。', 110, 300, { size: 28, font: FONT_CN_SERIF, color: 'rgba(235,244,246,0.9)' });
  text(g, '化学也能把光留下来。', 110, 342, { size: 28, font: FONT_CN_SERIF, color: 'rgba(235,244,246,0.9)' });
  mono(g, 'Anna Atkins · 1840s', 110, 800, { size: 11, color: 'rgba(190,230,240,0.6)' });
  g.restore();
  // 尾灯/烛光
  const p2 = smooth(inv(9.5, 12.5, e));
  if (hasAsset('candle') && p2 > 0) {
    g.save(); g.globalAlpha = p2 * 0.75;
    coverRect(g, TONED.candle, 0, 0, W, H, 1.03, 0.5, 0.5);
    g.fillStyle = 'rgba(3,6,10,0.55)'; g.fillRect(0, 0, W, H);
    g.restore();
  }
  // 片尾字
  const p3 = smooth(inv(12.0, 14.0, e));
  if (p3 > 0) {
    g.save(); g.globalAlpha = p3;
    g.fillStyle = 'rgba(3,7,12,0.62)'; g.fillRect(0, 0, W, H);
    text(g, '化学简史', W / 2, 380, { size: 84, weight: 500, font: FONT_CN_SERIF, color: C.paper, align: 'center', glow: 20, glowColor: 'rgba(127,212,230,0.4)' });
    caps(g, 'A BRIEF HISTORY OF CHEMISTRY', W / 2, 452, { size: 13, ls: 5, color: 'rgba(226,164,94,0.9)', align: 'center' });
    text(g, '118 种元素，一首歌', W / 2, 520, { size: 22, font: FONT_CN_SERIF, color: 'rgba(225,235,240,0.8)', align: 'center' });
    mono(g, 'IMAGES: WIKIMEDIA COMMONS (PD / CC BY / CC BY-SA)   DATA: IUPAC · NIST ASD · PDB · WHO', W / 2, 640, { size: 10, align: 'center', color: 'rgba(190,215,228,0.55)' });
    mono(g, 'CODE: CANVAS 2D · REAL-TIME   MUSIC: SOURCE VIDEO (USER-PROVIDED)', W / 2, 664, { size: 10, align: 'center', color: 'rgba(190,215,228,0.45)' });
    text(g, '2026', W / 2, 760, { size: 20, font: FONT_EN_SERIF, color: 'rgba(226,164,94,0.7)', align: 'center', ls: 8 });
    g.restore();
  }
};

// 兜底
ART.placeholder = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '?' });
  mono(g, 'NO SCENE', W / 2, H / 2, { size: 40, align: 'center', color: 'rgba(226,100,80,0.8)' });
};






