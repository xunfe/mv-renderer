/* 元素之歌 · 场景层
 * 每个场景一个 art(g,e,dur,t)：自己画背景，HUD/字幕/后期由 mv.js 统一叠。
 * 真实素材：assets/ 下 Wikimedia Commons 图版；真实数据：data.js。
 */
'use strict';

const ART = {};
const deg = Math.PI / 180;

function fade(e, a, b) { return smooth(inv(a, b, e)); }
function outFade(e, dur, a = 0.5) { return 1 - smooth(inv(dur - a, dur, e)); }
function ease(p) { return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; }

// 通用：细标签
function kicker(g, cn, en, x, y, o = {}) {
  caps(g, en, x, y, { size: o.size || 11, ls: 2.4, color: o.color || 'rgba(226,164,94,0.8)', align: o.align });
  if (cn) text(g, cn, x, y + 22, { size: 14, font: FONT_CN, color: 'rgba(225,235,240,0.72)', align: o.align });
}
function bigYear(g, y, x, yy, o = {}) {
  const s = o.size || 120;
  text(g, y < 0 ? String(Math.abs(y)) : String(y), x, yy, { size: s, weight: 200, font: FONT_EN_SERIF, color: o.color || 'rgba(226,164,94,0.16)', align: o.align || 'left' });
  text(g, y < 0 ? 'BCE' : 'CE', x + (o.align === 'center' ? 0 : 0), yy + s * 0.48, { size: s * 0.13, weight: 500, font: FONT_EN, color: o.color || 'rgba(226,164,94,0.30)', align: o.align || 'left', ls: 4 });
}

function plateCaption() { /* 图版出处已由 plate() 自动给出 */ }

// ---------------------------------------------------------------- 00 石墨晶格
ART.lattice = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'C', cx: 0.5, cy: 0.42 });
  const p = smooth(inv(0, 2.0, e));
  const cx = W / 2, cy = 565;
  const a = 46;
  const rot = -22 * deg;
  const layers = [{ z: 0, off: 0, alpha: 0.9 }, { z: -120, off: a * 0.5, alpha: 0.35 }];
  const proj = (x, y, z, off) => {
    const X = x + off, Y = y;
    const rx = X * Math.cos(rot) - Y * Math.sin(rot);
    const ry = X * Math.sin(rot) + Y * Math.cos(rot);
    return [cx + rx * 1.02, cy + ry * 0.44 - z * 0.42];
  };
  g.save();
  for (const L of layers) {
    const r = 4;
    for (let j = -r; j <= r; j++) {
      for (let i = -r; i <= r; i++) {
        if (Math.abs(i) + Math.abs(j) > 12) continue;
        const hx = i * 1.5 * a, hy = j * Math.sqrt(3) * a + (i % 2 ? Math.sqrt(3) * a / 2 : 0);
        const [px, py] = proj(hx, hy, L.z, L.off);
        if (Math.abs(px - cx) > 720 || Math.abs(py - cy) > 380) continue;
        // 六边形
        const pts = [];
        for (let k = 0; k < 6; k++) {
          const ang = (30 + 60 * k) * deg;
          const [qx, qy] = proj(hx + a * Math.cos(ang), hy + a * Math.sin(ang), L.z, L.off);
          pts.push([qx, qy]);
        }
        const prog = clamp((p - (Math.abs(i) + Math.abs(j)) * 0.025) * 2);
        if (prog <= 0) continue;
        g.globalAlpha = L.alpha * ((layerFade(p, i, j) || 1));
        g.strokeStyle = L.z === 0 ? 'rgba(140,215,232,0.55)' : 'rgba(120,170,195,0.22)';
        g.lineWidth = L.z === 0 ? 1.25 : 0.8;
        g.beginPath();
        const n = Math.max(2, Math.ceil(6 * prog));
        pts.slice(0, n).forEach((q, k) => k ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]));
        g.stroke();
        if (L.z === 0 && prog > 0.9) {
          g.fillStyle = 'rgba(200,240,248,0.85)';
          g.beginPath(); g.arc(pts[0][0], pts[0][1], 1.8, 0, 6.2832); g.fill();
        }
      }
    }
  }
  g.globalAlpha = 1;
  // 层间距标注
  if (p > 0.7) {
    const [x1, y1] = proj(-2 * a, 2.6 * a, 0, 0);
    const [x2, y2] = proj(-2 * a, 2.6 * a, -120, a * 0.5);
    g.strokeStyle = 'rgba(226,164,94,0.7)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
    mono(g, 'c = 670 pm', x1 - 8, (y1 + y2) / 2, { size: 11, align: 'right', color: 'rgba(226,164,94,0.8)' });
    mono(g, 'a = 246 pm', cx - 560, cy + 350, { size: 11, color: 'rgba(127,212,230,0.65)' });
    mono(g, '石墨 · 碳原子排成的六边形 · 10⁻⁹ m', cx - 560, cy + 372, { size: 11, color: 'rgba(190,215,228,0.5)' });
  }
  g.restore();
  // 标题
  const ta = smooth(inv(3.4, 4.3, e)) * (1 - smooth(inv(7.3, 7.9, e)));
  if (ta > 0) {
    g.save(); g.globalAlpha = ta;
    text(g, '化学简史', W / 2, 300, { size: 104, weight: 500, font: FONT_CN_SERIF, color: C.paper, align: 'center', glow: 22, glowColor: 'rgba(127,212,230,0.5)' });
    caps(g, 'A BRIEF HISTORY OF CHEMISTRY', W / 2, 380, { size: 14, ls: 5.5, color: 'rgba(226,164,94,0.9)', align: 'center' });
    mono(g, '118 ELEMENTS · ONE TABLE · 2026', W / 2, 424, { size: 12, color: 'rgba(190,215,228,0.6)', align: 'center' });
    g.restore();
  }
};
function layerFade(p, i, j) { return 1; }

// ---------------------------------------------------------------- 01 元素卡带
ART.intro = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '118', cx: 0.5, cy: 0.4 });
  // 背景大表
  periodicTable(g, W / 2 - 18 * 27, 230, 27, { gap: 3, year: 2026, alpha: 0.28 });
  const sweep = smooth(inv(0.2, 3.0, e));
  const off = (e * 210) % 1560;
  const syms = ['K','Ca','Sc','Ti','V','Cr','Mn','Fe','Co','Ni','Cu','Zn','Ga','Ge','As','Se','Br','Kr'];
  g.save();
  g.beginPath(); g.rect(0, 610, W, 220); g.clip();
  for (let k = -1; k < 14; k++) {
    for (let row = 0; row < 2; row++) {
      const idx = (k + row * 9 + 90) % syms.length;
      const sym = syms[idx];
      const x = k * 150 - off, y = 622 + row * 104;
      const a = clamp((k + 0.5) / 2) * (1 - clamp((k - 11) / 2));
      g.globalAlpha = 0.25 + 0.75 * a;
      elemChip(g, sym, x, y, 0.36, { fill: 'rgba(8,18,30,0.72)' });
    }
  }
  g.restore();
  // 主线
  const lw = W * ease(sweep);
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(180,235,245,0.55)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(W / 2 - lw / 2, 590); g.lineTo(W / 2 + lw / 2, 590); g.stroke();
  g.restore();
  const ta = smooth(inv(0.6, 1.5, e));
  g.save(); g.globalAlpha = ta;
  text(g, '118 种元素，一张表', W / 2, 300, { size: 66, weight: 500, font: FONT_CN_SERIF, color: C.paper, align: 'center', glow: 16, glowColor: 'rgba(127,212,230,0.45)' });
  caps(g, 'ONE TABLE FOR EVERYTHING', W / 2, 362, { size: 13, ls: 5, color: 'rgba(226,164,94,0.9)', align: 'center' });
  text(g, '从 1869 年的 63 格，到 2026 年的 118 格', W / 2, 410, { size: 17, font: FONT_CN, color: 'rgba(205,225,234,0.7)', align: 'center' });
  g.restore();
  // 计数
  const n = Math.round(118 * ease(smooth(inv(0.4, 3.6, e))));
  text(g, String(n), W - 360, 300, { size: 150, weight: 200, font: FONT_EN_SERIF, color: 'rgba(226,164,94,0.9)', align: 'right' });
  mono(g, '/ 118', W - 360, 378, { size: 15, color: 'rgba(190,215,228,0.5)', align: 'right' });
};

// ---------------------------------------------------------------- 02 火
ART.fire = (g, e, dur, t) => {
  bgPhoto(g, 'fire', t, { dim: 0.5, z: 1.04 + e * 0.004 });
  dust(g, t, { n: 70, alpha: 0.75, seed: 4, size: 2.4 });
  // 火星
  const r = mulberry(55);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 50; i++) {
    const x = r() * W, ph = r() * 6.28, sp = 20 + r() * 80;
    const y = H - ((t * sp + r() * H) % H);
    const a = 0.2 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 3 + ph), 3);
    g.globalAlpha = a * 0.8;
    g.fillStyle = 'rgba(255,170,80,0.9)';
    g.fillRect(x + Math.sin(t + ph) * 12, y, 1.6, 1.6);
  }
  g.restore();
  // 左侧文字
  g.save();
  const a = smooth(inv(0.5, 1.4, e));
  g.globalAlpha = a;
  mono(g, '400,000 YEARS AGO', 120, 250, { size: 12, color: 'rgba(245,207,146,0.9)' });
  text(g, '火', 120, 350, { size: 150, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 28, glowColor: 'rgba(255,150,60,0.6)' });
  text(g, '人类最早的化学技术', 120, 440, { size: 20, font: FONT_CN, color: 'rgba(235,240,238,0.8)' });
  mono(g, '燃烧 = 氧化 · 放热 · 发光', 120, 482, { size: 13, color: 'rgba(226,164,94,0.8)' });
  text(g, '控制火，就是控制一种化学反应的速度。', 120, 540, { size: 16, font: FONT_CN, color: 'rgba(210,228,236,0.62)' });
  g.restore();
  // 右侧引文
  g.save(); g.globalAlpha = smooth(inv(1.2, 2.2, e));
  text(g, 'CH₄ + 2O₂ → CO₂ + 2H₂O', W - 120, 300, { size: 24, font: FONT_EN_SERIF, color: 'rgba(245,230,205,0.85)', align: 'right' });
  mono(g, 'ΔH = −890 kJ/mol', W - 120, 340, { size: 13, color: 'rgba(226,164,94,0.75)', align: 'right' });
  g.restore();
};

// ---------------------------------------------------------------- 03 青铜
ART.bronze = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Cu', cx: 0.7, cy: 0.42 });
  const a = smooth(inv(0, 1.0, e));
  plate(g, 'bronze', 1000, 170, 700, 610, { z: 1.06 + e * 0.002, label: 'PLATE 006 · BRONZE BELL', caption: '青铜钟 · 中国 · 东周（公元前 770–256 年）', alpha: a });
  plateCaption(g, 'bronze', 1000, 812, 700);
  // 左侧文字
  g.save(); g.globalAlpha = a;
  mono(g, 'C. 3000 BCE · 青铜时代', 110, 250, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '我们铸出青铜', 110, 340, { size: 64, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12, glowColor: 'rgba(226,164,94,0.35)' });
  text(g, '让它鸣响', 110, 420, { size: 64, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12, glowColor: 'rgba(226,164,94,0.35)' });
  caps(g, 'WE CAST THE BRONZE AND MADE IT RING', 110, 480, { size: 12, ls: 3.2, color: 'rgba(127,212,230,0.75)' });
  // 成分环
  const cx = 290, cy = 650, R = 86;
  g.strokeStyle = 'rgba(150,200,220,0.3)'; g.lineWidth = 10;
  g.beginPath(); g.arc(cx, cy, R, 0, 6.2832); g.stroke();
  g.strokeStyle = C.amber; g.lineWidth = 10;
  g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + 6.2832 * 0.88); g.stroke();
  g.strokeStyle = C.cyan; g.lineWidth = 10;
  g.beginPath(); g.arc(cx, cy, R, -Math.PI / 2 + 6.2832 * 0.88, -Math.PI / 2 + 6.2832); g.stroke();
  text(g, '88', cx, cy - 8, { size: 30, font: FONT_EN_SERIF, color: C.amber2, align: 'center' });
  mono(g, 'Cu', cx, cy + 22, { size: 13, color: 'rgba(245,207,146,0.9)', align: 'center' });
  text(g, '12', cx + 180, cy - 8, { size: 30, font: FONT_EN_SERIF, color: C.cyan2, align: 'center' });
  mono(g, 'Sn', cx + 180, cy + 22, { size: 13, color: 'rgba(183,236,244,0.9)', align: 'center' });
  mono(g, '青铜 = Cu 88% + Sn 12%（典型的钟鼎配比）', 110, 780, { size: 12, color: 'rgba(210,228,236,0.7)' });
  g.restore();
  // 声波
  g.save(); g.globalCompositeOperation = 'lighter';
  const pulse = (e * 0.9) % 1;
  for (let k = 0; k < 3; k++) {
    const p = (pulse + k / 3) % 1;
    g.globalAlpha = (1 - p) * 0.5 * a;
    g.strokeStyle = 'rgba(245,207,146,0.8)'; g.lineWidth = 1.2;
    g.beginPath(); g.arc(1400, 420, 60 + p * 260, -0.6, 0.6); g.stroke();
    g.beginPath(); g.arc(1400, 420, 60 + p * 260, Math.PI - 0.6, Math.PI + 0.6); g.stroke();
  }
  g.restore();
};

// ---------------------------------------------------------------- 04 丹炉
ART.alchemy = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'HgS', cx: 0.5, cy: 0.4, warm: 1 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'tiangong', 170, 180, 430, 610, { z: 1.1, label: 'PLATE 014 · 天工开物 · 铸鼎', caption: '《天工开物》· 1637 · 铸鼎图', alpha: a });
  plateCaption(g, 'tiangong', 170, 812, 430);
  // 炉子
  const cx = 1120, cy = 590;
  g.save(); g.globalAlpha = a;
  // 炉体
  g.fillStyle = 'rgba(40,26,22,0.9)';
  g.beginPath();
  g.moveTo(cx - 150, cy + 120); g.lineTo(cx - 110, cy - 10); g.quadraticCurveTo(cx, cy - 60, cx + 110, cy - 10);
  g.lineTo(cx + 150, cy + 120); g.closePath(); g.fill();
  g.strokeStyle = 'rgba(226,164,94,0.55)'; g.lineWidth = 1.5; g.stroke();
  // 炉口
  g.fillStyle = 'rgba(16,10,8,1)'; g.beginPath(); g.ellipse(cx, cy - 20, 92, 20, 0, 0, 6.2832); g.fill();
  // 火
  for (let i = 0; i < 7; i++) {
    const ph = t * 2 + i;
    const fx = cx - 60 + i * 20, fy = cy + 60 + Math.sin(ph) * 10;
    softGlow(g, fx, fy, 34 + 12 * Math.sin(ph * 1.7), '255,120,40', 0.35);
  }
  // 上升的烟
  g.strokeStyle = 'rgba(200,190,175,0.18)'; g.lineWidth = 2;
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    for (let i = 0; i <= 40; i++) {
      const yy = cy - 60 - i * 8;
      const xx = cx + k * 26 - 26 + Math.sin(i * 0.18 + t * 1.2 + k) * 24;
      i ? g.lineTo(xx, yy) : g.moveTo(xx, yy);
    }
    g.stroke();
  }
  // 标注
  g.strokeStyle = 'rgba(226,164,94,0.8)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(cx + 150, cy + 50); g.lineTo(cx + 300, cy + 50); g.stroke();
  mono(g, '丹砂 HgS → 加热 → Hg + SO₂', cx + 310, cy + 50, { size: 12, color: 'rgba(245,207,146,0.85)' });
  mono(g, '炼丹术：最早的系统物质转化实验', cx + 310, cy + 74, { size: 11, color: 'rgba(200,222,232,0.6)' });
  g.restore();
  // 右侧文字
  g.save(); g.globalAlpha = smooth(inv(0.6, 1.6, e));
  mono(g, 'C. 850 · 唐 · 炼丹术', W - 120, 210, { size: 12, color: 'rgba(226,164,94,0.9)', align: 'right' });
  text(g, '一座古老的丹炉', W - 120, 280, { size: 44, font: FONT_CN_SERIF, color: C.paper, align: 'right' });
  text(g, '藏着秘密的火星', W - 120, 336, { size: 44, font: FONT_CN_SERIF, color: C.paper, align: 'right' });
  g.restore();
  // 元素卡
  elemChip(g, 'Hg', 800, 680, 0.62, {});
  elemChip(g, 'S', 960, 680, 0.62, {});
};

// ---------------------------------------------------------------- 05 火药
ART.powder = (g, e, dur, t) => {
  bgPhoto(g, 'gunpowder', t, { dim: 0.62, z: 1.03 + e * 0.003 });
  const a = smooth(inv(0.2, 1.1, e));
  g.save(); g.globalAlpha = a;
  mono(g, '1044 · 《武经总要》', 110, 240, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '黑色的火药', 110, 320, { size: 64, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12, glowColor: 'rgba(226,164,94,0.3)' });
  text(g, '乘风飞扬', 110, 396, { size: 64, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12, glowColor: 'rgba(226,164,94,0.3)' });
  caps(g, 'BLACK POWDER FLYING ON THE WIND', 110, 452, { size: 11.5, ls: 3.0, color: 'rgba(127,212,230,0.7)' });
  // 配比
  const bx = 1120, by = 250, bw = 520;
  const parts = [['KNO₃ 硝酸钾', 75, C.amber], ['S 硫', 10, '#d7c56a'], ['C 木炭', 15, '#8a8f98']];
  let yy = by;
  for (const [name, v, col] of parts) {
    text(g, name, bx, yy, { size: 15, font: FONT_CN, color: 'rgba(225,235,240,0.8)' });
    g.fillStyle = 'rgba(255,255,255,0.08)'; g.fillRect(bx + 230, yy - 8, 240, 14);
    g.fillStyle = col; g.fillRect(bx + 230, yy - 8, 240 * v / 100, 14);
    mono(g, v + '%', bx + 486, yy - 1, { size: 13, color: 'rgba(245,207,146,0.9)' });
    yy += 52;
  }
  // 反应式
  formula(g, '2KNO3 + S + 3C → K2S + N2↑ + 3CO2↑', bx, 470, { size: 25, color: 'rgba(245,232,210,0.9)' });
  mono(g, '摩尔比 2 : 1 : 3   放热约 2.7 kJ/g', bx, 510, { size: 12, color: 'rgba(190,215,228,0.6)' });
  text(g, '75 : 10 : 15 —— 后世最常用的黑火药配比。', bx, 570, { size: 16, font: FONT_CN, color: 'rgba(210,228,236,0.7)' });
  g.restore();
  // 火花
  const r = mulberry(77);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) {
    const x = (r() * W + t * (30 + r() * 90)) % W;
    const y = 600 + r() * 320 - ((t * 40 + r() * 200) % 300);
    g.globalAlpha = 0.25 + 0.65 * r();
    g.fillStyle = 'rgba(255,190,110,0.9)';
    g.fillRect(x, y, 1.8, 1.8);
  }
  g.restore();
};

// ---------------------------------------------------------------- 06 布兰德
ART.brand = (g, e, dur, t) => {
  bgPhoto(g, 'alchemist', t, { dim: 0.35, z: 1.02 + e * 0.002, y: 0.42 });
  // 暖色局部
  softGlow(g, W * 0.62, H * 0.52, 340, '255,150,70', 0.16);
  const a = smooth(inv(0.3, 1.2, e));
  g.save(); g.globalAlpha = a;
  mono(g, '1669 · HAMBURG', 110, 235, { size: 12, color: 'rgba(245,207,146,0.95)' });
  text(g, '布兰德守着一口锅', 110, 315, { size: 50, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '熬了一整夜', 110, 378, { size: 50, weight: 500, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  caps(g, 'HENNIG BRAND BOILED A POT ALL NIGHT', 110, 430, { size: 11.5, ls: 3.0, color: 'rgba(127,212,230,0.7)' });
  text(g, '他相信，人的身体里藏着点金石。', 110, 480, { size: 15, font: FONT_CN, color: 'rgba(214,228,234,0.65)' });
  text(g, '于是，他煮了很多桶尿。', 110, 510, { size: 15, font: FONT_CN, color: 'rgba(214,228,234,0.65)' });
  g.restore();
  // 画面右侧的注释（画里的蒸馏瓶是真的）
  g.save(); g.globalAlpha = a * 0.9;
  mono(g, '尿液 → 蒸发 → 强热 → 磷', 1500, 210, { size: 12, color: 'rgba(245,207,146,0.8)', align: 'right' });
  mono(g, '1669 · 第一个被记录下发现者的元素', 1500, 234, { size: 10.5, color: 'rgba(200,222,232,0.55)', align: 'right' });
  g.restore();
};

// ---------------------------------------------------------------- 07 磷光
ART.glow = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'P4', cx: 0.5, cy: 0.45, warm: 0.2 });
  // 暗场里的发光
  const cx = 760, cy = 520;
  softGlow(g, cx, cy, 260 + 30 * Math.sin(t * 1.6), '150,235,190', 0.2);
  const a = smooth(inv(0.2, 1.0, e));
  plate(g, 'phosphorus', cx - 210, cy - 160, 420, 320, { z: 1.1, label: 'PLATE 024 · WHITE PHOSPHORUS', caption: '白磷（水中保存）· 暗处缓慢氧化发光', alpha: a, halftone: 0.08 });
  plateCaption(g, 'phosphorus', cx - 210, cy + 205, 420);
  // 分子
  const P = [[0, -46], [44, -16], [28, 40], [-28, 40], [-44, -16]];
  g.save(); g.globalAlpha = smooth(inv(0.9, 1.7, e));
  for (const p of P) glowDot(g, 1410 + p[0], 420 + p[1], 3, { color: '190,240,210', a: 0.85 });
  for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {
    if (i === 0 && j > 2) continue;
    glowLine(g, [[1410 + P[i][0], 420 + P[i][1]], [1410 + P[j][0], 420 + P[j][1]]], { w: 1.2, color: 'rgba(160,230,200,0.6)', glow: 10, core: false });
  }
  mono(g, 'P₄ · 四面体', 1410, 510, { size: 12, align: 'center', color: 'rgba(190,235,210,0.8)' });
  g.restore();
  // 右侧文字
  g.save(); g.globalAlpha = smooth(inv(0.4, 1.3, e));
  mono(g, '1669 · 磷 PHOSPHORUS', W - 120, 220, { size: 12, color: 'rgba(190,235,210,0.9)', align: 'right' });
  text(g, '锅里有样东西', W - 120, 300, { size: 46, font: FONT_CN_SERIF, color: C.paper, align: 'right' });
  text(g, '竟然发出了光', W - 120, 360, { size: 46, font: FONT_CN_SERIF, color: C.paper, align: 'right' });
  formula(g, 'P4 + 5O2 → P4O10 + light', W - 120, 440, { size: 22, color: 'rgba(200,240,215,0.85)', align: 'right' });
  text(g, '不是火，是缓慢氧化把化学能变成了光。', W - 120, 500, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)', align: 'right' });
  text(g, '—— 第一个留下发现者名字的元素，来自一锅尿。', W - 120, 530, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)', align: 'right' });
  g.restore();
  elemChip(g, 'P', 1600, 600, 0.6, {});
};

// ---------------------------------------------------------------- 08 重复实验
ART.replicate = (g, e, dur, t) => {
  bgInk(g, t, { ghost: '1774', cx: 0.35, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'lavoisier', 100, 180, 500, 640, { z: 1.05, ox: 0.5, oy: 0.3, label: 'PLATE 031 · LAVOISIER', caption: '大卫《拉瓦锡与妻子》· 1788', alpha: a });
  plateCaption(g, 'lavoisier', 100, 842, 500);
  // 天平
  const cx = 1080, cy = 470;
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(200,232,240,0.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx, cy - 200); g.lineTo(cx, cy + 160); g.stroke();
  g.beginPath(); g.moveTo(cx - 240, cy - 160); g.lineTo(cx + 240, cy - 160); g.stroke();
  g.beginPath(); g.moveTo(cx - 240, cy - 160); g.lineTo(cx - 240, cy - 70); g.stroke();
  g.beginPath(); g.moveTo(cx + 240, cy - 160); g.lineTo(cx + 240, cy - 70); g.stroke();
  // 两个盘
  g.beginPath(); g.ellipse(cx - 240, cy - 60, 76, 16, 0, 0, 6.2832); g.stroke();
  g.beginPath(); g.ellipse(cx + 240, cy - 60, 76, 16, 0, 0, 6.2832); g.stroke();
  text(g, '反应前 100.0 g', cx - 240, cy - 10, { size: 15, font: FONT_CN, color: 'rgba(225,235,240,0.8)', align: 'center' });
  text(g, '反应后 100.0 g', cx + 240, cy - 10, { size: 15, font: FONT_CN, color: 'rgba(225,235,240,0.8)', align: 'center' });
  // 密封容器
  g.strokeStyle = 'rgba(226,164,94,0.7)'; g.lineWidth = 2;
  g.beginPath(); g.arc(cx, cy - 220, 46, 0, 6.2832); g.stroke();
  g.beginPath(); g.moveTo(cx - 20, cy - 176); g.lineTo(cx - 20, cy - 150); g.moveTo(cx + 20, cy - 176); g.lineTo(cx + 20, cy - 150); g.stroke();
  mono(g, '密封 · 不失去任何东西', cx, cy + 200, { size: 12, align: 'center', color: 'rgba(226,164,94,0.8)' });
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(0.6, 1.4, e));
  mono(g, '1774 · REPLICATION', 720, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '别急着相信', 720, 300, { size: 56, font: FONT_CN_SERIF, color: C.paper });
  text(g, '再做一次实验', 720, 372, { size: 56, font: FONT_CN_SERIF, color: C.paper });
  caps(g, "DON'T BELIEVE IT, TEST IT AGAIN", 720, 430, { size: 11.5, ls: 3.0, color: 'rgba(127,212,230,0.72)' });
  text(g, '拉瓦锡把锡放进密封容器里加热，', 720, 490, { size: 15, font: FONT_CN, color: 'rgba(210,228,236,0.65)' });
  text(g, '再称整个容器：总质量没有变。', 720, 518, { size: 15, font: FONT_CN, color: 'rgba(210,228,236,0.65)' });
  g.restore();
};

// ---------------------------------------------------------------- 09 变化（chorus）
ART.change1 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Δ', cx: 0.5, cy: 0.4 });
  periodicTable(g, W / 2 - 18 * 32, 250, 32, { gap: 3, year: 1789, alpha: 0.18 });
  const panels = [
    { key: 'copper', cn: 'Cu', label: '铜 · 紫红', col: [190, 110, 70] },
    { key: 'sulfur', cn: 'S', label: '硫 · 黄', col: [220, 200, 90] },
    { key: 'nacl', cn: 'NaCl', label: '盐 · 无色', col: [200, 220, 230] },
  ];
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2);
  for (let i = 0; i < 3; i++) {
    const x = 300 + i * 460, y = 230, w = 400, h = 470;
    plate(g, panels[i].key, x, y, w, h, { z: 1.06 + 0.02 * Math.sin(t + i), label: 'FIG. ' + pad2(38 + i) + ' · SAMPLE', caption: panels[i].label, alpha: 0.95 });
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.12 + 0.16 * pulse;
    g.fillStyle = `rgb(${panels[i].col.join(',')})`; g.fillRect(x, y, w, h);
    g.restore();
    elemChip(g, panels[i].cn === 'NaCl' ? 'Na' : panels[i].cn, x + 300, y + 340, 0.34, {});
  }
  // 中心箭头
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 2; i++) {
    const x = 730 + i * 460, y = 460;
    glowLine(g, [[x, y], [x + 120, y]], { w: 2, color: 'rgba(226,164,94,0.7)', glow: 12 });
    glowDot(g, x + 120, y, 2, { a: 0.6 });
  }
  g.restore();
};

ART.change2 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'Δ', cx: 0.5, cy: 0.45 });
  const k = Math.floor(t * 6) % 6;
  const syms = [['Cu', 'CuO', '铜 → 氧化铜'], ['Fe', 'Fe₂O₃', '铁 → 铁锈'], ['S', 'SO₂', '硫 → 二氧化硫'],
    ['Ag', 'Ag₂S', '银 → 硫化银'], ['Hg', 'HgO', '汞 → 氧化汞'], ['C', 'CO₂', '碳 → 二氧化碳']];
  for (let i = 0; i < 6; i++) {
    const x = 240 + (i % 3) * 530, y = 240 + Math.floor(i / 3) * 270;
    const active = i === k;
    g.save(); g.globalAlpha = active ? 1 : 0.34;
    g.fillStyle = active ? 'rgba(226,164,94,0.07)' : 'rgba(40,70,92,0.08)';
    g.fillRect(x, y, 470, 220);
    g.strokeStyle = active ? 'rgba(226,164,94,0.85)' : 'rgba(150,200,220,0.22)';
    g.lineWidth = active ? 2 : 1;
    g.strokeRect(x + 0.5, y + 0.5, 469, 219);
    text(g, syms[i][0], x + 40, y + 92, { size: 64, font: FONT_EN_SERIF, color: active ? C.amber2 : 'rgba(225,236,240,0.8)' });
    text(g, '→', x + 190, y + 108, { size: 30, font: FONT_EN_SERIF, color: 'rgba(127,212,230,0.6)' });
    text(g, syms[i][1], x + 260, y + 92, { size: 50, font: FONT_EN_SERIF, color: 'rgba(225,236,240,0.9)' });
    text(g, syms[i][2], x + 40, y + 170, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
    g.restore();
  }
  mono(g, '同一批原子，换个搭档，就是另一种物质。', W / 2, 790, { size: 12, align: 'center', color: 'rgba(190,215,228,0.55)' });
};

ART.change3 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'BUNSEN', cx: 0.5, cy: 0.45 });
  const a = smooth(inv(0, 0.6, e));
  plate(g, 'bunsen', 420, 170, 620, 620, { z: 1.06, label: 'PLATE 052 · BUNSEN BURNER', caption: '本生灯：先混空气，再燃烧', alpha: a });
  plateCaption(g, 'bunsen', 420, 812, 620);
  // 火焰
  const fx = 1370, fy = 470;
  g.save(); g.globalCompositeOperation = 'lighter';
  const fl = 0.85 + 0.15 * Math.sin(t * 7);
  const gr = g.createLinearGradient(fx, fy - 260 * fl, fx, fy + 60);
  gr.addColorStop(0, 'rgba(120,190,255,0)');
  gr.addColorStop(0.45, 'rgba(120,190,255,0.35)');
  gr.addColorStop(0.8, 'rgba(200,240,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0.1)');
  g.fillStyle = gr;
  g.beginPath(); g.ellipse(fx, fy - 80, 42, 190 * fl, 0, 0, 6.2832); g.fill();
  g.restore();
  g.save(); g.globalAlpha = a;
  g.strokeStyle = 'rgba(200,235,242,0.6)'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(fx, fy + 40); g.lineTo(fx, fy + 250); g.lineTo(fx - 60, fy + 300); g.stroke();
  mono(g, 'AIR OPEN', fx + 60, fy + 120, { size: 11, color: 'rgba(127,212,230,0.8)' });
  mono(g, '1855 · 本生灯 · 火焰约 1500 °C', 1080, 250, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '无色火焰', 1080, 320, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '才能露出自己的颜色', 1080, 382, { size: 30, font: FONT_CN_SERIF, color: 'rgba(225,235,240,0.8)' });
  text(g, '本生把空气先混进燃气，', 1080, 450, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  text(g, '火焰才不再发黄、不再冒烟。', 1080, 478, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  g.restore();
};

// ---------------------------------------------------------------- 10 颜色
ART.color = (g, e, dur, t) => {
  bgPhoto(g, 'flames', t, { dim: 0.55, z: 1.02 + e * 0.002 });
  const a = smooth(inv(0.3, 1.2, e));
  g.save(); g.globalAlpha = a;
  mono(g, 'FLAME TEST · EMISSION', 110, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '每一种颜色', 110, 300, { size: 54, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '都有它的名字', 110, 362, { size: 54, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  const rows = [['Li', '锂', 670.78, '红'], ['Na', '钠', 589.00, '黄'], ['Cu', '铜', 521.82, '绿'], ['K', '钾', 404.41, '紫']];
  let y = 450;
  for (const [sym, cn, nm, col] of rows) {
    const [r, gg, b] = wavelengthRGB(nm);
    g.fillStyle = `rgb(${r},${gg},${b})`; g.fillRect(110, y - 14, 54, 22);
    mono(g, sym + ' ' + cn, 184, y - 2, { size: 15, color: 'rgba(230,238,240,0.88)' });
    mono(g, nm.toFixed(2) + ' nm', 300, y - 2, { size: 13, color: 'rgba(190,215,228,0.65)' });
    mono(g, col, 420, y - 2, { size: 13, color: `rgb(${r},${gg},${b})` });
    y += 46;
  }
  g.restore();
  // 波长尺
  const x0 = 980, x1 = 1780, yy = 700;
  g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  for (let nm = 380; nm <= 780; nm += 20) {
    const [r, gg, b] = wavelengthRGB(nm);
    gr.addColorStop((nm - 380) / 400, `rgb(${r},${gg},${b})`);
  }
  g.fillStyle = gr; g.fillRect(x0, yy, x1 - x0, 46);
  for (let nm = 400; nm <= 760; nm += 50) {
    const x = x0 + (nm - 380) / 400 * (x1 - x0);
    g.strokeStyle = 'rgba(255,255,255,0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x, yy + 46); g.lineTo(x, yy + 58); g.stroke();
    mono(g, String(nm), x, yy + 74, { size: 10, align: 'center', color: 'rgba(210,228,236,0.6)' });
  }
  text(g, '可见光 380–780 nm', x0, yy + 108, { size: 13, font: FONT_CN, color: 'rgba(210,228,236,0.6)' });
  g.restore();
};

// ---------------------------------------------------------------- 11 质量守恒
ART.mass = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'm', cx: 0.4, cy: 0.4 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'lavoisier', 90, 150, 560, 700, { z: 1.04, oy: 0.3, label: 'PLATE 046 · THE SEALED VESSEL', caption: '拉瓦锡与妻子 · 大卫 · 1788', alpha: a });
  plateCaption(g, 'lavoisier', 90, 872, 560);
  g.save(); g.globalAlpha = a;
  mono(g, '1789 · TRAITÉ ÉLÉMENTAIRE DE CHIMIE', 740, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '不会凭空消失', 740, 315, { size: 52, font: FONT_CN_SERIF, color: C.paper });
  text(g, '也不会凭空多出', 740, 380, { size: 52, font: FONT_CN_SERIF, color: C.paper });
  caps(g, 'NOTHING LOST AND NOTHING GAINED', 740, 435, { size: 11.5, ls: 3.0, color: 'rgba(127,212,230,0.72)' });
  // 反应式
  formula(g, 'Sn + O2 → SnO2', 740, 520, { size: 30, color: 'rgba(245,232,210,0.9)' });
  mono(g, '反应前：Sn 100.0 g + 空气', 740, 570, { size: 13, color: 'rgba(190,215,228,0.7)' });
  mono(g, '反应后：SnO2 118.7 g（增重 18.7 g 来自空气）', 740, 598, { size: 13, color: 'rgba(190,215,228,0.7)' });
  g.strokeStyle = 'rgba(127,212,230,0.5)'; g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(740, 640); g.lineTo(1220, 640); g.stroke();
  text(g, '封闭系统里，原子的账本从来是平的。', 740, 690, { size: 17, font: FONT_CN, color: 'rgba(222,233,238,0.75)' });
  g.restore();
  // 天平小图
  g.save(); g.globalAlpha = a; g.translate(1510, 560);
  g.strokeStyle = 'rgba(226,164,94,0.55)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(0, -140); g.lineTo(0, 120); g.stroke();
  g.beginPath(); g.moveTo(-130, -110); g.lineTo(130, -110); g.stroke();
  g.beginPath(); g.moveTo(-130, -110); g.lineTo(-130, -40); g.moveTo(130, -110); g.lineTo(130, -40); g.stroke();
  g.beginPath(); g.ellipse(-130, -34, 52, 10, 0, 0, 6.2832); g.stroke();
  g.beginPath(); g.ellipse(130, -34, 52, 10, 0, 0, 6.2832); g.stroke();
  mono(g, '= 0.00 g', 0, 150, { size: 13, align: 'center', color: 'rgba(226,164,94,0.8)' });
  g.restore();
};

// ---------------------------------------------------------------- 12 太阳光谱/棱镜（instrumental 1）
ART.inter1 = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'λ', cx: 0.5, cy: 0.42 });
  // 棱镜
  const cx = 620, cy = 470;
  g.save();
  g.strokeStyle = 'rgba(190,235,245,0.55)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx, cy - 160); g.lineTo(cx - 170, cy + 120); g.lineTo(cx + 170, cy + 120); g.closePath(); g.stroke();
  g.fillStyle = 'rgba(120,210,235,0.05)'; g.fill();
  // 入射白光
  glowLine(g, [[100, 330], [cx - 40, cy - 30]], { w: 3, color: 'rgba(255,250,235,0.9)', glow: 16 });
  // 色散
  for (let i = 0; i < 40; i++) {
    const nm = 400 + i * 9;
    const [r, gg, b] = wavelengthRGB(nm);
    const spread = (i - 20) * 2.2;
    glowLine(g, [[cx + 30, cy + 20], [cx + 420, cy + 40 + spread * 1.8]], {
      w: 2.2, color: `rgba(${r},${gg},${b},0.6)`, glow: 8, core: false,
    });
  }
  g.restore();
  // 真实夫琅禾费谱带
  const a = smooth(inv(1.0, 2.2, e));
  if (hasAsset('fraunhofer')) {
    g.save(); g.globalAlpha = a * 0.85;
    g.beginPath(); g.rect(1020, 210, 760, 500); g.clip();
    coverRect(g, TONED.fraunhofer, 1020, 210, 760, 500, 1.0, 0.5, 0.5);
    g.globalAlpha = 0.5; g.fillStyle = 'rgba(4,10,16,0.35)'; g.fillRect(1020, 210, 760, 500);
    g.globalAlpha = 1; g.strokeStyle = 'rgba(200,235,245,0.3)'; g.strokeRect(1020, 210, 760, 500);
    g.restore();
  }
  // 公式
  g.save(); g.globalAlpha = smooth(inv(0.5, 1.4, e));
  mono(g, 't½ = 0.693 / k', 1040, 790, { size: 26, color: 'rgba(245,207,146,0.85)' });
  mono(g, '一级反应半衰期 · 与初始浓度无关', 1040, 822, { size: 11, color: 'rgba(190,215,228,0.55)' });
  g.restore();
  annotation(g, '间奏 · 光', 'INTERLUDE · LIGHT · BUNSEN & KIRCHHOFF, 1859', 90, 830, a);
};

// ---------------------------------------------------------------- 13 戴维电解
ART.davy = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'K', cx: 0.5, cy: 0.42 });
  const cx = 760, cy = 500;
  g.save();
  // 电解槽
  g.strokeStyle = 'rgba(200,235,242,0.6)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(cx - 220, cy - 130); g.lineTo(cx - 220, cy + 150); g.lineTo(cx + 220, cy + 150); g.lineTo(cx + 220, cy - 130); g.stroke();
  g.fillStyle = 'rgba(200,235,242,0.06)'; g.fillRect(cx - 218, cy - 60, 436, 208);
  // 电极
  g.fillStyle = 'rgba(226,164,94,0.8)'; g.fillRect(cx - 150, cy - 160, 10, 260);
  g.fillStyle = 'rgba(127,212,230,0.8)'; g.fillRect(cx + 140, cy - 160, 10, 260);
  mono(g, '−', cx - 146, cy - 190, { size: 26, color: 'rgba(226,164,94,0.9)' });
  mono(g, '+', cx + 144, cy - 190, { size: 26, color: 'rgba(127,212,230,0.9)' });
  // 气泡
  const r = mulberry(19);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const bx = cx - 150 + (r() - 0.5) * 50, by = cy + 120 - ((t * 60 + r() * 200) % 220);
    g.globalAlpha = 0.3 + r() * 0.4;
    g.fillStyle = 'rgba(220,245,250,0.8)';
    g.beginPath(); g.arc(bx, by, 2 + r() * 4, 0, 6.2832); g.fill();
  }
  g.restore();
  g.save();
  mono(g, '1807 · HUMPHRY DAVY', 90, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '电流穿过熔融的碱', 90, 300, { size: 38, font: FONT_CN_SERIF, color: C.paper });
  text(g, '金属钾第一次露面', 90, 352, { size: 38, font: FONT_CN_SERIF, color: C.paper });
  formula(g, '4KOH → 4K + O2↑ + 2H2O', 90, 420, { size: 24, color: 'rgba(245,232,210,0.9)' });
  text(g, '在那之前，人们以为碱是“元素”。', 90, 480, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  text(g, '戴维用电池把钠、钾从化合物里拽了出来。', 90, 508, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  g.restore();
  elemChip(g, 'K', 1520, 600, 0.7, {});
};

// ---------------------------------------------------------------- 14 维勒与尿素
ART.wohler = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'CH4N2O', cx: 0.5, cy: 0.42 });
  // 分子
  const cx = 620, cy = 500;
  g.save();
  const O = [cx, cy - 100], Cc = [cx, cy + 10], N1 = [cx - 120, cy + 100], N2 = [cx + 120, cy + 100];
  const bonds = [[O, Cc, 2], [Cc, N1, 1], [Cc, N2, 1]];
  for (const [p, q, o] of bonds) {
    const n = o === 2 ? 2 : 1;
    for (let k = 0; k < n; k++) {
      const dx = (q[1] - p[1]) * 0.03 * (k ? 1 : -1);
      const dy = -(q[0] - p[0]) * 0.03 * (k ? 1 : -1);
      glowLine(g, [[p[0] + dx, p[1] + dy], [q[0] + dx, q[1] + dy]], { w: 2, color: 'rgba(200,235,242,0.75)', glow: 10, core: false });
    }
  }
  for (const [p, lab, col] of [[O, 'O', '220,100,90'], [Cc, 'C', '220,220,210'], [N1, 'NH₂', '130,200,235'], [N2, 'NH₂', '130,200,235']]) {
    softGlow(g, p[0], p[1], 40, col, 0.25);
    text(g, lab, p[0], p[1], { size: lab.length > 1 ? 24 : 30, font: FONT_EN_SERIF, color: `rgb(${col})`, align: 'center' });
  }
  mono(g, 'CO(NH₂)₂ · 尿素', cx, cy + 200, { size: 12, align: 'center', color: 'rgba(190,215,228,0.65)' });
  g.restore();
  g.save();
  mono(g, '1828 · FRIEDRICH WÖHLER', 1000, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '无机物，也能变出有机物', 1000, 310, { size: 34, font: FONT_CN_SERIF, color: C.paper });
  formula(g, 'NH4OCN → CO(NH2)2', 1000, 380, { size: 24, color: 'rgba(245,232,210,0.9)' });
  text(g, '维勒把氰酸铵加热，得到了尿素。', 1000, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  text(g, '那是尿液里的东西——第一次，生命不再', 1000, 468, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  text(g, '是合成有机物的必要条件。', 1000, 496, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  mono(g, '“I can make urea without a kidney.” — 传为维勒语', 1000, 552, { size: 12, color: 'rgba(190,215,228,0.55)' });
  g.restore();
  annotation(g, '间奏 · 尿素', 'INTERLUDE · UREA · 1828', 90, 840, 1);
};

// ---------------------------------------------------------------- 15 棱镜（歌词）
ART.prism = (g, e, dur, t) => {
  bgPhoto(g, 'prism', t, { dim: 0.45, z: 1.02 + e * 0.002 });
  const a = smooth(inv(0.2, 1.1, e));
  g.save(); g.globalAlpha = a;
  mono(g, '1859 · SPECTROSCOPY', 110, 220, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '光穿过玻璃', 110, 300, { size: 52, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '碎成一道道谱线', 110, 362, { size: 52, font: FONT_CN_SERIF, color: C.paper, glow: 12 });
  text(g, '棱镜不是把光“染色”，而是把不同波长', 110, 440, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  text(g, '以不同的折射率分开：n(λ) 随 λ 变小而变大。', 110, 468, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.65)' });
  mono(g, '冕牌玻璃 n(589 nm) ≈ 1.52', 110, 520, { size: 12, color: 'rgba(226,164,94,0.8)' });
  g.restore();
  // 底部光谱条
  const x0 = 720, x1 = 1780, yy = 700;
  g.save(); g.globalAlpha = a;
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  for (let nm = 380; nm <= 780; nm += 10) {
    const [r, gg, b] = wavelengthRGB(nm);
    gr.addColorStop((nm - 380) / 400, `rgb(${r},${gg},${b})`);
  }
  g.fillStyle = gr; g.fillRect(x0, yy, x1 - x0, 34);
  mono(g, '380 nm', x0, yy + 52, { size: 10, color: 'rgba(190,215,228,0.55)' });
  mono(g, '780 nm', x1, yy + 52, { size: 10, align: 'right', color: 'rgba(190,215,228,0.55)' });
  g.restore();
};

// ---------------------------------------------------------------- 16 谱线
ART.lines = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'λ', cx: 0.5, cy: 0.42 });
  const x0 = 420, x1 = 1720, y0 = 260, rowH = 92;
  const keys = ['H', 'He', 'Na', 'Fe'];
  g.save();
  mono(g, 'NIST ATOMIC SPECTRA DATABASE · 空气波长', 420, 220, { size: 11, color: 'rgba(190,215,228,0.6)' });
  for (let r = 0; r < keys.length; r++) {
    const sp = SPECTRA[keys[r]];
    const y = y0 + r * rowH;
    text(g, keys[r], 360, y, { size: 26, font: FONT_EN_SERIF, color: 'rgba(235,240,238,0.85)', align: 'right' });
    mono(g, sp.name, 360, y + 26, { size: 11, align: 'right', color: 'rgba(190,215,228,0.55)' });
    g.strokeStyle = 'rgba(150,200,220,0.12)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(x0, y + 20); g.lineTo(x1, y + 20); g.stroke();
    for (const [nm, inten] of sp.lines) {
      const x = x0 + (nm - 380) / 400 * (x1 - x0);
      const [rr, gg, bb] = wavelengthRGB(nm);
      const h = 30 + inten * 34;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(${rr},${gg},${bb},0.85)`;
      g.shadowColor = `rgb(${rr},${gg},${bb})`; g.shadowBlur = 14;
      g.fillRect(x - 1.6, y + 20 - h, 3.2, h);
      g.restore();
      if (r === 0 && inten > 0.9) mono(g, nm.toFixed(0), x, y - 20, { size: 9, align: 'center', color: 'rgba(210,228,236,0.6)' });
    }
  }
  // 波长轴
  const ay = y0 + 4 * rowH + 10;
  g.strokeStyle = 'rgba(150,200,220,0.35)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x0, ay); g.lineTo(x1, ay); g.stroke();
  for (let nm = 400; nm <= 760; nm += 40) {
    const x = x0 + (nm - 380) / 400 * (x1 - x0);
    g.beginPath(); g.moveTo(x, ay); g.lineTo(x, ay + 7); g.stroke();
    mono(g, String(nm), x, ay + 22, { size: 10, align: 'center', color: 'rgba(190,215,228,0.55)' });
  }
  g.restore();
  g.save(); g.globalAlpha = smooth(inv(0.7, 1.8, e));
  text(g, '每一条线，都是一种元素的记号', W / 2, 790, { size: 28, font: FONT_CN_SERIF, color: 'rgba(235,240,238,0.86)', align: 'center' });
  g.restore();
};

// ---------------------------------------------------------------- 17 氦
ART.helium = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'He', cx: 0.35, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'eclipse', 90, 160, 620, 620, { z: 1.05, label: 'PLATE 076 · TOTAL ECLIPSE', caption: '日全食 · 日冕（1999）', alpha: a });
  plateCaption(g, 'eclipse', 90, 802, 620);
  g.save(); g.globalAlpha = a;
  mono(g, '1868 · JANSSEN & LOCKYER', 780, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  text(g, '先在太阳里找到', 780, 310, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '后来才在地上找到', 780, 374, { size: 50, font: FONT_CN_SERIF, color: C.paper });
  text(g, '日全食时，太阳边缘多出一条 587.6 nm 的黄线；', 780, 450, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '地球上还没有任何已知元素能解释它。', 780, 478, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  text(g, '于是给它取名：氦（Helios，太阳）。', 780, 506, { size: 15, font: FONT_CN, color: 'rgba(205,225,232,0.68)' });
  g.restore();
  // 谱线
  const sp = SPECTRA.He, x0 = 780, x1 = 1740, yy = 640;
  g.save(); g.globalAlpha = a;
  g.fillStyle = 'rgba(4,8,14,0.8)'; g.fillRect(x0, yy, x1 - x0, 76);
  for (const [nm, inten] of sp.lines) {
    const x = x0 + (nm - 380) / 400 * (x1 - x0);
    const [r, gg, b] = wavelengthRGB(nm);
    g.fillStyle = `rgba(${r},${gg},${b},${0.5 + inten * 0.5})`;
    g.fillRect(x - 1.4, yy + 8, 2.8, 60 * inten);
  }
  g.restore();
  mono(g, 'He I · 587.56 nm（D₃ 线）', 780, 736, { size: 11, color: 'rgba(245,207,146,0.8)' });
  elemChip(g, 'He', 1550, 220, 0.62, {});
};

// ---------------------------------------------------------------- 18 苯
ART.benzene = (g, e, dur, t) => {
  bgInk(g, t, { ghost: 'C6H6', cx: 0.6, cy: 0.42 });
  const a = smooth(inv(0, 0.9, e));
  plate(g, 'kekule', 110, 160, 460, 560, { z: 1.04, label: 'PLATE 080 · KEKULÉ', caption: '奥古斯特·凯库勒 · 约 1866', alpha: a });
  plateCaption(g, 'kekule', 110, 742, 460);
  // 苯环
  const cx = 1050, cy = 470, R = 150;
  g.save(); g.globalAlpha = a;
  const pts = [];
  for (let k = 0; k < 6; k++) pts.push([cx + R * Math.cos(-Math.PI / 2 + k * Math.PI / 3), cy + R * Math.sin(-Math.PI / 2 + k * Math.PI / 3)]);
  // 交替双键
  for (let k = 0; k < 6; k++) {
    const p = pts[k], q = pts[(k + 1) % 6];
    glowLine(g, [p, q], { w: 2.4, color: 'rgba(200,235,242,0.85)', glow: 12 });
    if (k % 2 === 0) {
      const dx = (q[0] - p[0]) * 0.14, dy = (q[1] - p[1]) * 0.14;
      const nx = -(q[1] - p[1]) * 0.07, ny = (q[0] - p[0]) * 0.07;
      glowLine(g, [[p[0] + dx + nx, p[1] + dy + ny], [q[0] - dx + nx, q[1] - dy + ny]], { w: 1.4, color: 'rgba(150,220,240,0.7)', glow: 8, core: false });
    }
  }
  for (const p of pts) glowDot(g, p[0], p[1], 2.4, { a: 0.8 });
  mono(g, 'C–C 139.7 pm · 六个碳完全等价', cx, cy + R + 46, { size: 12, align: 'center', color: 'rgba(190,215,228,0.7)' });
  g.restore();
  // 蛇
  g.save(); g.globalCompositeOperation = 'lighter';
  const prog = smooth(inv(0.6, 2.4, e));
  g.strokeStyle = 'rgba(226,164,94,0.55)'; g.lineWidth = 1.6;
  g.beginPath();
  for (let i = 0; i <= 120 * prog; i++) {
    const ang = i / 120 * 6.2832 * 1.6 + t * 0.2;
    const rad = 210 + 26 * Math.sin(i / 10);
    const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.62;
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  g.restore();
  g.save(); g.globalAlpha = a;
  mono(g, '1865 · 凯库勒的梦：一条蛇咬住自己的尾巴', 720, 230, { size: 12, color: 'rgba(226,164,94,0.9)' });
  g.restore();
};

