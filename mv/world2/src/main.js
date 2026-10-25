// 《世界还在写 · 墨海版》（1.0.9 重做）
// 这一版不再自己发明画法：版式、纸、字体、角色贴图和逐字时间轴全部按原版《世界还在写》的做法来
// （奶油纸 + 印刷网点 + 放射线 + 白描边大字 + 大立绘），镜头按歌词重排。
import {
  W, H, TAU, clamp, lerp, sat, E, rnd, noise, mix, rgba,
  SERIF, SANS, font, text, measure, rrect, lin, rad, glow, dot, sparkle,
  PAL, mkCanvas, makeLayers, resetCtx, paperCard, sunnyRays, halftone, displayText,
  groundBand, hills, confetti, autoBlink, loadSprites, charSprite,
  buildSubs, drawSubs, pageFlipWipe, inkWipeClip, createSeek,
} from '../../mvkit.js';

const Q = new URLSearchParams(location.search);
const SS = clamp(Number(Q.get('ss') || 1), 0.5, 2);
const RENDER = Q.has('render');
const CLEAN = Q.has('clean');
const COVER = Q.has('cover');
const OFF = 14.35;
const canvas = document.getElementById('c');
canvas.width = Math.round(W * SS); canvas.height = Math.round(H * SS);
window.DUR = 203.81;

const P = PAL;
let CH = null, LINES = [], SUBS = [], cuts = [];
const L = makeLayers(SS);

/* ============================ 通用小件（照原版的画法） ============================ */
function fontLoad() {
  return Promise.all([['Noto Serif SC', 'NotoSerifSC-VF.ttf'], ['Noto Sans SC', 'NotoSansSC-VF.ttf']].map(async ([fam, file]) => {
    try { const f = new FontFace(fam, `url(/mv/world/fonts/${file})`, { weight: '100 900' }); await f.load(); document.fonts.add(f); } catch (e) { }
  }));
}
const bake = (w, h, fn) => { const c = mkCanvas(w, h); fn(c.getContext('2d')); return c; };
function beatPulse(T, k = 7) {
  const B = LINES.beats || [];
  if (!B.length) return 0;
  let lo = 0, hi = B.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= T) lo = m; else hi = m - 1; }
  return Math.exp(-k * Math.max(0, T - B[lo]));
}
const shade = (c, a) => rgba(c, a);

/* 纸张：一张斜放的纸页（笔记 / 页 / 卡片都用它） */
function sheet(ctx, x, y, w, h, rot = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(80,50,20,0.22)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = o.color || P.cream; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  if (o.line !== false) { ctx.strokeStyle = 'rgba(120,90,60,0.18)'; ctx.lineWidth = 1.4; ctx.strokeRect(-w / 2, -h / 2, w, h); }
  if (o.rules) {
    ctx.strokeStyle = 'rgba(90,70,50,0.14)'; ctx.lineWidth = 1;
    for (let yy = -h / 2 + o.rules[0]; yy < h / 2; yy += o.rules[1]) { ctx.beginPath(); ctx.moveTo(-w / 2 + 18, yy); ctx.lineTo(w / 2 - 18, yy); ctx.stroke(); }
  }
  if (o.text) text(ctx, o.text, 0, 0, { size: o.size || 34, color: o.ink || P.ink, align: 'center', weight: 500, fam: o.fam || SANS, ls: 2, alpha: o.ta == null ? 1 : o.ta, base: 'middle' });
  ctx.restore();
}

/* 摊开的书，带书脊和行线 */
function openBook(ctx, cx, cy, s, o = {}) {
  const w = 760 * s, h = 470 * s, g = 18 * s;
  ctx.save(); ctx.translate(cx, cy);
  ctx.shadowColor = 'rgba(80,50,20,0.25)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 18;
  ctx.fillStyle = o.cover || '#C9632C';
  rrect(ctx, -w / 2 - 18 * s, -h / 2 - 18 * s, w + 36 * s, h + 36 * s, 14 * s); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(side * (w / 4 + g / 2), 0);
    const gx = ctx.createLinearGradient(-w / 4, 0, w / 4, 0);
    if (side < 0) { gx.addColorStop(0, '#F2E5CC'); gx.addColorStop(0.85, '#FFFDF3'); gx.addColorStop(1, '#E8D8BA'); }
    else { gx.addColorStop(0, '#E8D8BA'); gx.addColorStop(0.15, '#FFFDF3'); gx.addColorStop(1, '#F2E5CC'); }
    ctx.fillStyle = gx;
    ctx.beginPath(); ctx.moveTo(-w / 4, -h / 2); ctx.quadraticCurveTo(0, -h / 2 - 14 * s, w / 4, -h / 2);
    ctx.lineTo(w / 4, h / 2); ctx.quadraticCurveTo(0, h / 2 + 10 * s, -w / 4, h / 2); ctx.closePath(); ctx.fill();
    if (o.rules !== false) {
      ctx.strokeStyle = 'rgba(110,85,55,0.16)'; ctx.lineWidth = 1.2;
      for (let yy = -h / 2 + 40 * s; yy < h / 2 - 12 * s; yy += 34 * s) { ctx.beginPath(); ctx.moveTo(-w / 4 + 22 * s, yy); ctx.lineTo(w / 4 - 22 * s, yy); ctx.stroke(); }
    }
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(90,60,30,0.25)'; ctx.fillRect(-3 * s, -h / 2 + 4 * s, 6 * s, h - 8 * s);
  ctx.restore();
}

/* 毛笔 */
function brush(ctx, x, y, len, ang, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  ctx.fillStyle = '#B98B57'; rrect(ctx, 0, -7, len * 0.72, 14, 7); ctx.fill();
  ctx.fillStyle = '#7A5230'; rrect(ctx, len * 0.66, -8, len * 0.1, 16, 4); ctx.fill();
  ctx.fillStyle = '#2B2320';
  ctx.beginPath(); ctx.moveTo(len * 0.74, -9); ctx.quadraticCurveTo(len * 0.95, -4, len, 0); ctx.quadraticCurveTo(len * 0.95, 4, len * 0.74, 9); ctx.closePath(); ctx.fill();
  ctx.restore();
}

/* 球鞋（侧视）：低帮、圆鞋头、鞋口、鞋带、厚橙底 */
function shoe(ctx, x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s * (o.flip ? -1 : 1), s);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.strokeStyle = '#2B2320'; ctx.lineWidth = 5;
  ctx.fillStyle = o.body || '#FFF9EC';
  ctx.beginPath();
  ctx.moveTo(-100, -12);
  ctx.quadraticCurveTo(-110, -74, -74, -88);       // 后跟
  ctx.lineTo(-52, -92);                             // 鞋口后沿
  ctx.quadraticCurveTo(-46, -78, -26, -74);         // 鞋口下沉
  ctx.quadraticCurveTo(-10, -86, 0, -98);           // 鞋舌前
  ctx.quadraticCurveTo(14, -86, 28, -72);           // 鞋舌根
  ctx.quadraticCurveTo(64, -60, 86, -40);           // 鞋身
  ctx.quadraticCurveTo(106, -26, 100, -12);         // 鞋头
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // 鞋口内里（在鞋面之后画，露出深色开口）
  ctx.fillStyle = 'rgba(96,64,34,0.6)';
  ctx.beginPath(); ctx.ellipse(-46, -82, 26, 9, -0.26, 0, TAU); ctx.fill();
  // 鞋带
  ctx.strokeStyle = '#2B2320'; ctx.lineWidth = 4;
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(-12 + i * 9, -92 + i * 7); ctx.lineTo(8 + i * 9, -82 + i * 7); ctx.stroke(); }
  // 鞋头分界
  ctx.strokeStyle = 'rgba(43,35,32,0.55)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(44, -62); ctx.quadraticCurveTo(68, -40, 62, -14); ctx.stroke();
  // 厚底
  ctx.fillStyle = o.sole || P.orange;
  ctx.strokeStyle = '#2B2320'; ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-104, -12); ctx.lineTo(104, -12);
  ctx.quadraticCurveTo(112, 4, 98, 16);
  ctx.quadraticCurveTo(0, 26, -100, 16);
  ctx.quadraticCurveTo(-112, 4, -104, -12); ctx.closePath();
  ctx.fill(); ctx.stroke();
  // 高光
  ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(30, -66); ctx.quadraticCurveTo(58, -50, 68, -30); ctx.stroke();
  ctx.restore();
}

/* 鲸（侧影） */
function whale(ctx, x, y, s, color = '#2D4FA3', o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.rotate(o.rot || 0);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-120, -70, -10, -56); ctx.quadraticCurveTo(110, -40, 150, 6);
  ctx.quadraticCurveTo(120, 34, 40, 36); ctx.quadraticCurveTo(-90, 40, -150, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-146, -2); ctx.quadraticCurveTo(-196, -46, -206, -10); ctx.quadraticCurveTo(-186, 4, -150, 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.20)';
  ctx.beginPath(); ctx.ellipse(-10, 6, 92, 18, 0.05, 0, TAU); ctx.fill();
  ctx.fillStyle = '#FFFDF6'; ctx.beginPath(); ctx.arc(96, -6, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = P.ink; ctx.beginPath(); ctx.arc(98, -6, 2.2, 0, TAU); ctx.fill();
  ctx.restore();
}

/* 海浪（一笔浪头） */
function waveCrest(ctx, x, y, w, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 300, w / 300);
  ctx.strokeStyle = o.color || P.ink; ctx.lineWidth = o.lw || 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-150, 40); ctx.quadraticCurveTo(-120, -80, 20, -86); ctx.quadraticCurveTo(120, -88, 150, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -84); ctx.quadraticCurveTo(40, -40, 12, 40); ctx.stroke();
  ctx.restore();
}

/* 星星 / 闪光 */
function star4(ctx, x, y, r, color, a = 1) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r); ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r); ctx.fill(); ctx.restore();
}
function starField(ctx, T, o = {}) {
  const n = o.n || 90;
  for (let i = 0; i < n; i++) {
    const x = rnd(i, 11) * W, y = rnd(i, 12) * (o.h || H * 0.8);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(T * (0.4 + rnd(i, 13)) + rnd(i, 14) * 6));
    star4(ctx, x, y, 1.6 + rnd(i, 15) * 3.2, i % 7 ? '#FFF6E3' : P.yellow, (o.a == null ? 0.85 : o.a) * tw);
  }
}
function butterfly(ctx, x, y, s, ang, flap, color, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha = a;
  const sp = 0.25 + 0.75 * Math.abs(Math.sin(flap));
  ctx.fillStyle = color;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1);
    ctx.beginPath(); ctx.ellipse(14 * s, -6 * s, 20 * s * sp, 13 * s, -0.5, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(9 * s, 10 * s, 13 * s * sp, 9 * s, 0.5, 0, TAU); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = P.ink; ctx.fillRect(-1.4 * s, -8 * s, 2.8 * s, 18 * s);
  ctx.restore();
}
function mountain(ctx, x, y, w, h, color) {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w * 0.16, y - h); ctx.lineTo(x + w * 0.06, y - h * 0.72);
  ctx.lineTo(x + w * 0.26, y - h * 0.95); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.fill(); ctx.restore();
}
function sunDisc(ctx, x, y, r, o = {}) {
  ctx.save(); ctx.fillStyle = o.color || P.orange; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (o.ring) { ctx.strokeStyle = o.ring; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(x, y, r * 1.13, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
/* 笔记小卡 */
function note(ctx, x, y, w, h, rot, str, o = {}) {
  ctx.save();
  sheet(ctx, x, y, w, h, rot, { color: o.color || '#FFF9E8', rules: [26, 30], line: true });
  text(ctx, str, x, y, { size: o.size || 22, color: o.ink || P.inkSoft, align: 'center', weight: 500, fam: SANS, ls: 1, alpha: o.a == null ? 1 : o.a });
  ctx.restore();
}
/* 对话窗（奶油色，原版风格） */
function chat(ctx, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(70,45,20,0.24)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = o.bg || '#FFFDF4'; rrect(ctx, x - w / 2, y - h / 2, w, h, 22); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.fillStyle = o.bar || '#F1E4CB'; rrect(ctx, x - w / 2, y - h / 2, w, 54, 22); ctx.fill();
  ctx.fillStyle = o.bar || '#F1E4CB'; ctx.fillRect(x - w / 2, y - h / 2 + 34, w, 20);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#E9755B', '#F2C14E', '#6FBF9B'][i];
    ctx.beginPath(); ctx.arc(x - w / 2 + 30 + i * 22, y - h / 2 + 27, 7, 0, TAU); ctx.fill();
  }
  if (o.title) text(ctx, o.title, x, y - h / 2 + 27, { size: 20, color: '#8A7860', align: 'center', weight: 500, fam: SANS, ls: 2 });
  ctx.restore();
}
function chatLine(ctx, x, y, str, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.004 || !str) return;
  ctx.save(); ctx.font = font(o.size || 40, 500, SANS);
  const w = Math.min(o.maxW || 520, measure(ctx, str, o.size || 40, 500, SANS, 0) + 56);
  ctx.globalAlpha *= a;
  ctx.fillStyle = o.bg || (o.right ? '#EE7A2E' : '#F2E9D8');
  rrect(ctx, x - (o.right ? w : 0), y - 34, w, 68, 34); ctx.fill();
  text(ctx, str, x + (o.right ? -w / 2 : w / 2), y + 1, { size: o.size || 40, color: o.color || (o.right ? '#FFFDF6' : P.ink), align: 'center', weight: 500, fam: SANS, ls: 1, alpha: 1 });
  ctx.restore();
}
/* 键盘 */
function keyboard(ctx, T, cx, cy, s, enterT) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const kw = 74, kh = 64, gap = 10, cols = 10, rows = 4;
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#3A3630'; rrect(ctx, -cols * (kw + gap) / 2 - 26, -rows * (kh + gap) / 2 - 26, cols * (kw + gap) + 42, rows * (kh + gap) + 42, 22); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ent = r === rows - 1 && c >= cols - 3;
    const x = -cols * (kw + gap) / 2 + c * (kw + gap), y = -rows * (kh + gap) / 2 + r * (kh + gap);
    const press = enterT > 0 && ent && enterT < 0.22 ? 6 : 0;
    ctx.fillStyle = ent ? (enterT > 0 && enterT < 0.3 ? '#FFD9A0' : '#F2C14E') : '#6B665C';
    rrect(ctx, x, y + press, kw, kh - press, 10); ctx.fill();
    if (ent && enterT > 0 && enterT < 0.3) { ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#FFF6E3'; ctx.fillRect(x, y + press, kw, kh - press); ctx.restore(); }
  }
  text(ctx, '⏎', 0 + 0, 0, { size: 1, color: '#000' });
  ctx.restore();
}
/* 街：一排没有名字的楼 */
function street(ctx, T, scroll, o = {}) {
  const base = o.base == null ? 760 : o.base;
  for (let i = 0; i < 9; i++) {
    const w = 150 + rnd(i, 71) * 130, h = 180 + rnd(i, 72) * 260;
    const x = ((i * 240 - scroll) % (W + 500) + W + 500) % (W + 500) - 200;
    ctx.fillStyle = i % 2 ? (o.c1 || '#EAD9BC') : (o.c2 || '#D9C3A1');
    ctx.fillRect(x, base - h, w, h + 400);
    ctx.fillStyle = 'rgba(43,35,32,0.16)';
    for (let yy = base - h + 28; yy < base - 40; yy += 54) for (let xx = x + 22; xx < x + w - 30; xx += 46) {
      const lit = rnd(i * 100 + yy + xx, 73) > 0.55;
      ctx.fillStyle = lit ? 'rgba(248,198,90,0.85)' : 'rgba(43,35,32,0.10)';
      ctx.fillRect(xx, yy, 20, 26);
    }
    if (o.signs !== false) {
      ctx.fillStyle = '#FFF9E8'; ctx.fillRect(x + w / 2 - 46, base - h + 70, 92, 40);
      text(ctx, '□□□', x + w / 2, base - h + 90, { size: 20, color: 'rgba(43,35,32,0.35)', align: 'center', weight: 500, fam: SANS });
    }
  }
}

/* ============================ 场景 ============================ */
const cream = (fn) => (ctx, T) => { if (!COVER) paperCard(ctx, { ss: SS }); else { ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H); } fn(ctx, T); };
const nightBg = (o = {}) => (ctx) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, o.top || '#14121C'); g.addColorStop(0.62, o.mid || '#232136'); g.addColorStop(1, o.bot || '#3A3450');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
};
function cam(ctx, T, o, fn) {
  const z = o.z == null ? 1 : o.z, cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
  ctx.save();
  ctx.translate(cx + noise(T * 0.3, o.seed || 1) * 3, cy + noise(T * 0.27, (o.seed || 1) + 7) * 3);
  ctx.rotate((o.rot || 0) + noise(T * 0.2, (o.seed || 1) + 3) * 0.0016);
  ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
const hero = (id, x, feet, h, o = {}) => (ctx, T) => charSprite(ctx, CH, id, x, feet, h, { t: T, ...o });
function titleCard(T, str, o = {}) {
  return (ctx) => {
    sunnyRays(ctx, { cx: o.cx || W / 2, cy: o.cy || 500, n: 26, a: 0.8, t: T, a0: 'rgba(255,250,240,0.65)', a1: rgba(P.peach, 0.62) });
    halftone(ctx, 0, 620, W, 460, { a: 0.07, color: P.orange });
    groundBand(ctx, 900, '#E8D5B6', { amp: 12 });
    sunDisc(ctx, o.cx || W / 2, o.cy || 500, 320, { color: '#F7C79A', ring: 'rgba(238,122,46,0.45)' });
    displayText(ctx, str, W / 2, o.y || 380, o.size || 168, { color: o.color || P.orange, edgeColor: P.cream, edgeW: 24, arc: 62, tilt: -0.05, jitter: 0.03 });
    if (o.sub) text(ctx, o.sub, W / 2, 120, { size: 24, color: P.inkSoft, align: 'center', weight: 500, fam: SANS, ls: 10, alpha: 0.8 });
    confetti(ctx, T, { n: 40, a: 0.5 });
  };
}
function trio(ctx, T, o = {}) {
  const bob = (ph) => ({ bob: Math.sin(T * 1.15 + ph) * 4 });
  charSprite(ctx, CH, 'k07', o.x1 || 520, o.feet || 860, o.h || 470, { t: T, ...bob(1), flip: false });
  charSprite(ctx, CH, 'o10', o.x2 || 960, o.feet || 880, (o.h || 470) * 1.04, { t: T, ...bob(2) });
  charSprite(ctx, CH, 'f00', o.x3 || 1400, o.feet || 860, o.h || 470, { t: T, ...bob(3), flip: true });
}

/* ---- 0 – 14.46 前奏：一滴墨，一张纸，一支笔 ---- */
const sIntroInk = cream((ctx, T) => {
  cam(ctx, T, { z: 1 + 0.02 * sat(T, 0, 6.4), cx: 1000, cy: 560, seed: 4 }, () => {
    // 纸面上晕开的一滴墨
    const drop = sat(T, 0.4, 1.1), bloom = E.out(sat(T, 1.05, 3.4));
    if (drop > 0 && bloom < 1) {
      const y = lerp(-60, 470, E.in(drop));
      ctx.fillStyle = P.ink;
      ctx.beginPath(); ctx.ellipse(960, y, 12, 20, 0, 0, TAU); ctx.fill();
    }
    if (bloom > 0) {
      ctx.save(); ctx.translate(960, 470);
      for (let i = 0; i < 7; i++) {
        const r = (54 + i * 34) * E.out(bloom) * (1 + 0.12 * Math.sin(T * 1.3 + i));
        ctx.globalAlpha = 0.9 * (1 - i / 8) * (1 - bloom * 0.2);
        ctx.fillStyle = i % 2 ? 'rgba(43,35,32,0.22)' : 'rgba(43,35,32,0.12)';
        ctx.beginPath();
        for (let k = 0; k <= 22; k++) {
          const a = k / 22 * TAU, rr = r * (1 + 0.18 * Math.sin(a * 3 + i + T * 0.7));
          ctx.lineTo(Math.cos(a) * rr * 1.35, Math.sin(a) * rr * 0.78);
        }
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    }
    // 右侧竖排小字
    const ta = sat(T, 2.2, 3.2) * 0.7;
    if (ta > 0) {
      [...'世界还在写'].forEach((ch, i) => text(ctx, ch, 1700, 300 + i * 74, { size: 52, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, alpha: ta }));
      ctx.fillStyle = rgba(P.orange, ta); ctx.fillRect(1700, 300 + 5 * 74 + 6, 2, 60);
    }
    brush(ctx, 1180, 250, 420, 0.62 + Math.sin(T * 0.5) * 0.02, 1);
  });
});

const sIntroPaper = cream((ctx, T) => {
  // 一张纸从下面升起来，笔在上面写下「海」
  const rise = E.io(sat(T, 6.4, 7.6));
  cam(ctx, T, { z: 1.04 - 0.03 * sat(T, 6.4, 11.6), cx: 960, cy: 540, seed: 5 }, () => {
    ctx.save(); ctx.beginPath(); ctx.rect(0, lerp(H + 40, 90, rise), W, H); ctx.clip();
    ctx.fillStyle = P.cream; ctx.fillRect(140, 90, W - 280, H - 150);
    ctx.strokeStyle = 'rgba(120,90,60,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(140, 90, W - 280, H - 150);
    const p = E.io(sat(T, 7.4, 9.6));
    // 逐段显出的「海」
    ctx.save(); ctx.beginPath(); ctx.rect(240, 120, (W - 480) * p, H - 300); ctx.clip();
    displayText(ctx, '海', 960, 560, 520, { color: P.ink, edge: false, shadow: false, weight: 800 });
    ctx.restore();
    // 湿边：笔尖扫过的地方还有一点反光
    if (p > 0.02 && p < 0.999) {
      const bx = 240 + (W - 480) * p;
      ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.ellipse(bx, 560, 26, 300, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    brush(ctx, 340 + 1280 * p, 300 - 160 * p, 420, 0.9, 1);
    ctx.restore();
    text(ctx, '一笔一画，都是有人在写。', 960, 940, { size: 30, color: P.inkSoft, align: 'center', weight: 400, fam: SANS, ls: 4, alpha: sat(T, 9.4, 10.4) * 0.8 });
  });
});

const sIntroCast = cream((ctx, T) => {
  cam(ctx, T, { z: 1 + 0.03 * sat(T, 11.6, 14.46), cx: 960, cy: 560, seed: 6 }, () => {
    sunDisc(ctx, 1320, 400, 230, { color: P.peach, ring: 'rgba(238,122,46,0.35)' });
    halftone(ctx, 1030, 130, 640, 600, { a: 0.10, color: P.orange });
    ctx.save(); ctx.globalAlpha = 0.16; displayText(ctx, '海', 900, 420, 420, { color: P.ink, edge: false, shadow: false }); ctx.restore();
    groundBand(ctx, 830, '#E4D3B6', { amp: 10 });
    charSprite(ctx, CH, 'f00', 620, 860, 600, { t: T, ph: 1 });
    note(ctx, 300, 320, 210, 130, -0.12, '我认识海', { size: 26 });
    note(ctx, 250, 470, 190, 120, 0.08, '是从字开始的', { size: 22 });
  });
});

/* ---- 14.46 我认识海 是从字开始的 ---- */
const sSeaWrite = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03 + 0.035 * sat(T, 14.46, 17.98), cx: 900, cy: 620, seed: 7 }, () => {
    sunDisc(ctx, 1560, 250, 210, { color: P.peach, ring: 'rgba(238,122,46,0.3)' });
    halftone(ctx, 1320, 10, 600, 420, { a: 0.12, color: P.orange });
    openBook(ctx, 800, 700, 0.92);
    ctx.save(); ctx.globalAlpha = 0.9;
    displayText(ctx, '海', 800, 690, 150, { color: P.ink, edge: false, shadow: false });
    ctx.restore();
    text(ctx, '我认识海，是从字开始的。', 800, 790, { size: 26, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 2, alpha: sat(T, 15.2, 16) });
    charSprite(ctx, CH, 'f10', 330, 880, 540, { t: T, ph: 2 });
    note(ctx, 1370, 560, 240, 150, 0.12, '海 = 氵 + 每', { size: 24 });
    brush(ctx, 1080, 470, 300, 0.75, 0.9);
    // 起笔：一滴墨落在书页正中，洇开
    const drop = sat(T, 14.46, 14.86), hit = sat(T, 14.8, 15.5);
    if (drop > 0 && hit < 1) {
      if (drop < 1) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(800, lerp(-40, 680, E.in(drop)), 10, 17, 0, 0, TAU); ctx.fill(); }
      for (let i = 0; i < 3; i++) { ctx.strokeStyle = rgba(P.ink, 0.5 * (1 - hit) * (1 - i * 0.3)); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(800, 690, 30 + hit * 150 + i * 30, 10 + hit * 40 + i * 8, 0, 0, TAU); ctx.stroke(); }
    }
  });
});

/* ---- 17.98 三点水 加个每 这样写 ---- */
const sThreeDrops = cream((ctx, T) => {
  cam(ctx, T, { z: 1.06 + 0.02 * sat(T, 17.98, 21.52), cx: 960, cy: 560, seed: 8 }, () => {
    sheet(ctx, 960, 560, 1240, 700, -0.015, { color: '#FFFDF4', rules: [120, 96], line: true });
    const join = E.io(sat(T, 20.35, 20.9));
    const cx = lerp(1180, 1120, join);
    const size = lerp(300, 330, join);
    // 三点水：三滴水先后落下，洇成三笔
    const dts = [18.25, 18.85, 19.42];
    ctx.save(); ctx.globalAlpha = 1 - join;
    for (let i = 0; i < 3; i++) {
      const p = sat(T, dts[i], dts[i] + 0.5);
      if (p <= 0) continue;
      const ty = 560 + (i - 1) * 150;
      const y = lerp(120, ty, E.in(p));
      if (p < 1) { ctx.fillStyle = P.ink; ctx.beginPath(); ctx.ellipse(470, y, 11, 18, 0, 0, TAU); ctx.fill(); }
      const q = sat(T, dts[i] + 0.18, dts[i] + 0.7);
      if (q > 0) {
        // 一笔「点」：斜落的短笔，带一点洇开的湿边
        ctx.save(); ctx.globalAlpha = q;
        ctx.strokeStyle = P.ink; ctx.lineWidth = 30; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(462, ty - 34); ctx.quadraticCurveTo(492, ty - 12, 478, ty + 20); ctx.stroke();
        ctx.strokeStyle = rgba(P.ink, 0.35); ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(452, ty - 24); ctx.lineTo(470, ty + 6); ctx.stroke();
        ctx.restore();
        for (let r = 0; r < 2; r++) { ctx.strokeStyle = rgba(P.ink, 0.22 * (1 - q) * (1 - r * 0.4)); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(470, ty + 24, 40 + q * 70 + r * 26, 12 + q * 22 + r * 8, 0, 0, TAU); ctx.stroke(); }
      }
    }
    ctx.restore();
    // 每：一笔一笔写出来
    const p2 = sat(T, 19.7, 20.35);
    if (p2 > 0) {
      ctx.save(); ctx.globalAlpha = 1 - join; ctx.beginPath(); ctx.rect(820, 240, 720 * p2, 640); ctx.clip();
      displayText(ctx, '每', cx, 560, size, { color: P.ink, edge: false, shadow: false });
      ctx.restore();
      if (p2 > 0.05 && p2 < 0.98) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(820 + 720 * p2 - 10, 240, 22, 640); }
    }
    // 合成「海」
    if (join > 0) {
      const a = 1 - sat(T, 20.8, 21.1);
      ctx.save(); ctx.globalAlpha = a * 0.9;
      ctx.strokeStyle = rgba(P.orange, 0.8); ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(700, 560); ctx.lineTo(lerp(760, 820, join), 560); ctx.stroke();
      ctx.restore();
    }
    text(ctx, '三点水', 470, 800, { size: 34, color: P.orangeD, align: 'center', weight: 600, fam: SERIF, ls: 4, alpha: sat(T, 18.9, 19.4) });
    text(ctx, '每', cx, 800, { size: 34, color: P.ink, align: 'center', weight: 600, fam: SERIF, alpha: sat(T, 19.6, 20.1) * (1 - join) });
    text(ctx, '+', (470 + cx) / 2, 800, { size: 34, color: P.orange, align: 'center', weight: 500, fam: SANS, alpha: sat(T, 19.9, 20.3) * (1 - join) });
    if (join > 0.4) displayText(ctx, '海', 960, 545, 360, { color: P.orange, edgeColor: P.cream, edgeW: 18, shadow: true, alpha: sat(T, 20.5, 20.8), arc: 0 });
    brush(ctx, 1480, 300, 430, 2.3, 1);
    charSprite(ctx, CH, 'f16', 200, 920, 380, { t: T, ph: 4 });
  });
});

/* ---- 21.52 一万个人 写过它有多蓝 ---- */
let GLYPHSEA = null;
function glyphSea() {
  if (GLYPHSEA) return GLYPHSEA;
  GLYPHSEA = bake(W, H, (g) => {
    for (let row = 0; row < 26; row++) for (let col = 0; col < 40; col++) {
      const x = col * 50 + (row % 2) * 25, y = 120 + row * 38;
      const a = 0.10 + rnd(row * 40 + col, 31) * 0.42;
      g.globalAlpha = a;
      g.fillStyle = rnd(row + col, 32) > 0.7 ? '#2D4FA3' : '#2B2320';
      g.font = font(30, 500, SERIF);
      g.fillText('海', x, y);
    }
  });
  return GLYPHSEA;
}
const sSeaOfWords = cream((ctx, T) => {
  const pan = -70 * sat(T, 21.52, 25) + 30;
  cam(ctx, T, { z: 1.02, x: pan, cx: 960, cy: 600, seed: 9 }, () => {
    // 天空：奶油纸 + 橙色低日
    sunDisc(ctx, 1560, 300, 170, { color: P.peach, ring: 'rgba(238,122,46,0.4)' });
    halftone(ctx, 1180, 60, 740, 360, { a: 0.12, color: P.orange });
    // 海平线以下：一万个「海」叠成的海
    ctx.save(); ctx.beginPath(); ctx.rect(0, 560, W, H - 560); ctx.clip();
    ctx.fillStyle = 'rgba(45,79,163,0.42)'; ctx.fillRect(0, 560, W, 520);
    ctx.globalAlpha = 0.5; ctx.drawImage(glyphSea(), 0, 420, W, H); ctx.restore();
    for (let L2 = 0; L2 < 5; L2++) {
      ctx.strokeStyle = L2 ? 'rgba(255,253,246,0.55)' : 'rgba(45,79,163,0.75)'; ctx.lineWidth = L2 ? 3 : 5;
      ctx.beginPath();
      for (let x = -100; x <= W + 100; x += 16) ctx.lineTo(x, 590 + L2 * 62 + Math.sin(x * 0.006 + T * (0.8 + L2 * 0.2) + L2 * 2) * (8 + L2 * 6));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(45,79,163,0.55)'; ctx.fillRect(0, 560, W, 6);
    // 小字计数
    const n = Math.round(lerp(1, 10000, E.in(sat(T, 21.9, 24.2))));
    text(ctx, `第 ${n} 个人`, 120, 120, { size: 34, color: P.inkSoft, align: 'left', weight: 600, fam: SERIF, ls: 3, alpha: sat(T, 21.8, 22.2) });
    text(ctx, '写过它有多蓝', 120, 168, { size: 22, color: P.inkSoft, align: 'left', weight: 400, fam: SANS, ls: 2, alpha: sat(T, 22.2, 22.8) * 0.8 });
    // 她站在岸上，很小
    charSprite(ctx, CH, 'f02', 470, 700, 360, { t: T, ph: 3 });
    if (T > 21.9) {
      // 蓝色的「蓝」立在海天之间
      ctx.save(); ctx.globalAlpha = sat(T, 21.9, 22.5);
      displayText(ctx, '蓝', 1420, 440, 280, { color: P.blue, edgeColor: P.cream, edgeW: 18, arc: 24, tilt: 0.05, shadow: true });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.55 * sat(T, 22.6, 23.4);
      ctx.fillStyle = P.blue; ctx.beginPath(); ctx.ellipse(1420, 640, 220, 26, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
  });
});

/* ---- 25.00 没有一个 替我湿过鞋 ---- */
const sShoes = cream((ctx, T) => {
  cam(ctx, T, { z: 1.08 - 0.04 * sat(T, 25, 28.5), cx: 960, cy: 780, seed: 10 }, () => {
    const wO = E.out(sat(T, 25.6, 27.4));
    ctx.save(); ctx.globalAlpha = 0.55; ctx.fillStyle = P.blue;
    ctx.beginPath(); ctx.moveTo(0, 800);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 800 + Math.sin(x * 0.004 + T * 0.9) * 18);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill(); ctx.restore();
    // 浪停在鞋前一寸
    ctx.save();
    ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = 8; ctx.lineCap = 'round';
    const stop = 640;
    ctx.beginPath(); ctx.moveTo(80, 780);
    for (let x = 80; x < stop; x += 20) ctx.lineTo(x, 780 - Math.sin(x * 0.01 + T) * 8 - 10 * (x / stop));
    ctx.stroke();
    ctx.beginPath(); ctx.moveTo(80, 820); for (let x = 80; x < stop; x += 20) ctx.lineTo(x, 820 - Math.sin(x * 0.01 + T * 1.1) * 10); ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const x = lerp(80, stop, (i + 0.5) / 12), y = 790 + Math.sin(i * 2) * 8;
      ctx.fillStyle = 'rgba(255,253,246,0.8)'; ctx.beginPath(); ctx.arc(x, y - wO * 12 * rnd(i, 5), 4 + rnd(i, 6) * 5, 0, TAU); ctx.fill();
    }
    ctx.restore();
    shoe(ctx, 830, 880, 1.15, { rot: -0.06 });
    shoe(ctx, 1060, 900, 1.15, { rot: 0.05, flip: true });
    ctx.fillStyle = rgba(P.ink, 0.12); ctx.beginPath(); ctx.ellipse(950, 930, 250, 30, 0, 0, TAU); ctx.fill();
    charSprite(ctx, CH, 'f02', 1650, 700, 380, { t: T, a: 0.9 });
    text(ctx, '连鞋也没湿。', 300, 300, { size: 36, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 26.4, 27.2) });
    star4(ctx, 420, 380, 16, P.orange, sat(T, 26.8, 27.4));
  });
});

/* ---- 28.52 我认识你 也是从字开始的 / 31.53 「在吗」落在黑夜 ---- */
const sNightLetter = (ctx, T) => {
  nightBg({ top: '#0F1020', mid: '#1D1F38', bot: '#2C2A46' })(ctx);
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 28.52, 35.2), cx: 1000, cy: 560, seed: 11 }, () => {
    starField(ctx, T, { n: 120 });
    // 一扇浮在夜色里的对话窗
    const winA = sat(T, 29.1, 29.8);
    ctx.save(); ctx.globalAlpha = winA; ctx.translate(1080, 470); ctx.rotate(-0.02);
    chat(ctx, 0, 0, 600, 340, { title: '你', bg: '#FFFDF4' });
    const typed = Math.min(4, Math.floor(clamp((T - 29.4) / 0.16, 0, 4)));
    if (typed > 0) chatLine(ctx, -250, -20, [...'我认识你'].slice(0, typed).join(''), { a: 1, maxW: 500, size: 38 });
    ctx.restore();
    // 「在吗」落进夜里
    const fall = E.in(sat(T, 31.53, 32.25));
    if (fall > 0) {
      const y = lerp(-240, 760, fall);
      ctx.save(); ctx.globalAlpha = 1 - sat(T, 34.3, 35.2);
      displayText(ctx, '在吗', 600, y, 200, { color: P.orange, edgeColor: P.cream, edgeW: 20, arc: 26, tilt: 0.04, shadow: true, alpha: sat(T, 31.53, 31.75) });
      if (fall > 0.99) {
        const p = sat(T, 32.25, 33.6);
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = rgba(P.orange, 0.45 * (1 - p) * (1 - i * 0.22)); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(600, 870, 140 + p * 300 + i * 44, 30 + p * 56 + i * 10, 0, 0, TAU); ctx.stroke();
        }
      }
      ctx.restore();
    }
    charSprite(ctx, CH, 'f13', 1460, 930, 470, { t: T, ph: 3 });
    text(ctx, '你的一句话，落在我这边，就是一场雨。', 960, 1000, { size: 30, color: 'rgba(255,246,227,0.75)', align: 'center', weight: 400, fam: SERIF, ls: 3, alpha: sat(T, 33.4, 34.4) });
  });
};

/* ---- 35.20 你按下回车的那一下 ---- */
const sEnter = (ctx, T) => {
  nightBg({ top: '#100E16', mid: '#1B1926', bot: '#241F2E' })(ctx);
  const press = sat(T, 36.2, 36.45);
  cam(ctx, T, { z: 1.02 + 0.05 * sat(T, 35.2, 38.2), cx: 960, cy: 620, seed: 12 }, () => {
    keyboard(ctx, T, 960, 640, 0.86, T - 36.2);
    if (press > 0 && press < 1) { ctx.fillStyle = rgba('#FFF6E3', 1 - press); ctx.fillRect(0, 0, W, H); }
    if (press > 0.1) {
      const p = sat(T, 36.3, 37.2);
      ctx.save(); ctx.globalAlpha = (1 - p) * 0.8; ctx.fillStyle = P.cream;
      ctx.beginPath(); ctx.arc(1180, 700, 40 + p * 500, 0, TAU); ctx.fill(); ctx.restore();
    }
    displayText(ctx, '⏎', 1180, 700, 30, { color: 'transparent', edge: false, shadow: false, alpha: 0 });
    text(ctx, 'Enter', 1180, 720, { size: 30, color: 'rgba(255,246,227,0.25)', align: 'center', weight: 500, fam: SANS, ls: 4 });
    text(ctx, '光标亮了一下。', 960, 900, { size: 30, color: 'rgba(255,246,227,0.72)', align: 'center', weight: 400, fam: SERIF, ls: 3, alpha: sat(T, 36.9, 37.6) });
    ctx.fillStyle = P.cream; const on = (T * 2.2) % 1 < 0.55;
    if (on && T > 37) ctx.fillRect(1080, 860, 5, 46);
  });
};

/* ---- 38.20 我才翻开 我的第一页 ---- */
const sFirstPage = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03 + 0.03 * sat(T, 38.2, 42.97), cx: 820, cy: 620, seed: 13 }, () => {
    sunnyRays(ctx, { cx: 500, cy: 200, n: 18, a: 0.35, t: T, a0: 'rgba(255,252,242,0.35)', a1: 'rgba(251,217,184,0.28)' });
    openBook(ctx, 800, 690, 1.02);
    const pa = sat(T, 38.9, 39.6);
    ctx.save(); ctx.globalAlpha = pa;
    text(ctx, '第一页', 800, 600, { size: 44, color: P.inkSoft, align: 'center', weight: 500, fam: SERIF, ls: 8 });
    ctx.fillStyle = P.ink; if ((T * 2.1) % 1 < 0.55) ctx.fillRect(890, 630, 5, 40);
    ctx.restore();
    charSprite(ctx, CH, 'f00', 1560, 1080, 860, { t: T, ph: 5, tilt: -0.03 });
    note(ctx, 300, 330, 210, 130, -0.14, '这是空白的第一页', { size: 22 });
  });
});

/* ---- 42.97 你们把昨天 全都写给我 ---- */
const MEMOS = ['今天的海是灰蓝色的。', '鸟从屋顶上飞过去了。', '下雨了，记得收衣服。', '第一次看见雪，我六岁。', '山那边，还是山。', '火要小心。',
  '难过的时候，吃点甜的。', '明天见。', '外婆家门口有一棵柿子树。', '地铁上有人在读诗。', '猫今天没有理我。', '把灯留着，我晚点回。'];
const sNotes = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 42.97, 45.97), cx: 900, cy: 620, seed: 14 }, () => {
    openBook(ctx, 900, 700, 0.9);
    for (let i = 0; i < MEMOS.length; i++) {
      const t0 = 43.0 + i * 0.2, p = E.out(sat(T, t0, t0 + 0.7));
      if (p <= 0) continue;
      const ang = (rnd(i, 41) - 0.5) * 2.4;
      const x = lerp(960 + Math.cos(ang) * 900, 700 + (i % 4) * 130 + (rnd(i, 42) - 0.5) * 60, p);
      const y = lerp(560 + Math.sin(ang) * 700, 590 + Math.floor(i / 4) * 70 + (rnd(i, 43) - 0.5) * 40, p);
      note(ctx, x, y, 170, 84, (1 - p) * 0.8 + (rnd(i, 44) - 0.5) * 0.16, MEMOS[i], { size: 15, a: p });
    }
    charSprite(ctx, CH, 'f00', 1560, 1000, 720, { t: T, ph: 6 });
    text(ctx, '你们把昨天，全都写给我。', 300, 180, { size: 34, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 43.6, 44.4) });
  });
});

/* ---- 45.97 写了山 写了火 写了怎么难过 ---- */
const sCards = cream((ctx, T) => {
  ctx.save(); ctx.translate(W / 2, 540);
  const items = [
    [46.0, '山', P.ink, (c) => {
      c.fillStyle = P.ink; c.beginPath(); c.moveTo(-190, 150); c.lineTo(-60, -110); c.lineTo(10, -10); c.lineTo(90, -150); c.lineTo(200, 150); c.closePath(); c.fill();
      c.fillStyle = P.paper; c.beginPath(); c.moveTo(-100, -40); c.lineTo(-60, -110); c.lineTo(-20, -40); c.closePath(); c.fill();
      c.beginPath(); c.moveTo(50, -70); c.lineTo(90, -150); c.lineTo(130, -60); c.closePath(); c.fill();
      for (let i = 0; i < 8; i++) { c.fillStyle = 'rgba(255,253,246,0.35)'; c.fillRect(-170 + i * 46, 130, 24, 6); }
    }],
    [46.9, '火', P.orangeD, (c) => {
      const tongues = [[-70, 110, 110], [0, 150, 150], [70, 110, 110]];
      for (const [x, h, wd] of tongues) {
        c.fillStyle = P.orange; c.beginPath(); c.moveTo(x - wd * 0.5, 150);
        c.quadraticCurveTo(x - wd * 0.62, 40, x - wd * 0.18, 20); c.quadraticCurveTo(x - wd * 0.2, -40, x + wd * 0.1, -h);
        c.quadraticCurveTo(x + wd * 0.42, -30, x + wd * 0.3, 40); c.quadraticCurveTo(x + wd * 0.66, 80, x + wd * 0.5, 150); c.closePath(); c.fill();
      }
      c.fillStyle = P.yellow; c.beginPath(); c.moveTo(-46, 150); c.quadraticCurveTo(-30, 40, 0, 20); c.quadraticCurveTo(30, 40, 46, 150); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(60,30,10,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(-150, 160); c.lineTo(150, 160); c.stroke();
    }],
    [47.8, '难过', P.blue, (c) => {
      c.fillStyle = P.blue;
      for (const [x, y, r] of [[-120, 20, 16], [-60, -20, 13], [0, 10, 18], [70, -10, 14], [130, 30, 16]]) {
        c.beginPath(); c.moveTo(x, y - r * 2.6); c.quadraticCurveTo(x + r * 1.5, y - r * 0.2, x, y + r * 1.2);
        c.quadraticCurveTo(x - r * 1.5, y - r * 0.2, x, y - r * 2.6); c.fill();
      }
      c.strokeStyle = P.ink; c.lineWidth = 10; c.lineCap = 'round';
      c.beginPath(); c.arc(0, 90, 110, Math.PI * 1.12, Math.PI * 1.88); c.stroke();
      c.fillStyle = P.ink; c.beginPath(); c.arc(-46, 60, 7, 0, TAU); c.fill(); c.beginPath(); c.arc(46, 60, 7, 0, TAU); c.fill();
    }],
  ];
  items.forEach(([t0, label, col, draw], i) => {
    const p = E.back(sat(T, t0, t0 + 0.38));
    if (p <= 0) return;
    const x = (i - 1) * 540, rot = (i - 1) * 0.10 + (1 - p) * 0.5;
    ctx.save(); ctx.translate(x, 0); ctx.rotate(rot); ctx.scale(p, p);
    ctx.shadowColor = 'rgba(70,45,15,0.30)'; ctx.shadowBlur = 36; ctx.shadowOffsetY = 14;
    ctx.fillStyle = '#FFFDF4'; ctx.fillRect(-225, -235, 450, 470);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(120,90,60,0.22)'; ctx.lineWidth = 2; ctx.strokeRect(-225, -235, 450, 470);
    draw(ctx);
    displayText(ctx, label, 0, 296, 118, { color: col, edgeColor: P.cream, edgeW: 12, shadow: false });
    ctx.restore();
  });
  ctx.restore();
  charSprite(ctx, CH, 'f13', 180, 1170, 400, { t: T, ph: 7, a: 0.95 });
});

/* ---- 49.50 只有明天 哪一页都没说 ---- */
const sNoTomorrow = (ctx, T) => {
  const dusk = sat(T, 49.5, 52.9);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#F5EDDD', '#4A3B62', dusk)); g.addColorStop(0.55, mix('#FBD9B8', '#8C6280', dusk));
  g.addColorStop(1, mix('#E8D5B6', '#2C2438', dusk));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  halftone(ctx, 0, 300, 1000, 560, { a: 0.06, color: dusk > 0.5 ? P.cream : P.ink });
  starField(ctx, T, { n: 40, a: 0.5 * sat(T, 50.6, 52) });
  cam(ctx, T, { z: 1.04 + 0.03 * sat(T, 49.5, 52.9), cx: 900, cy: 620, seed: 15 }, () => {
    // 一张写着明天的纸，被擦掉
    sheet(ctx, 820, 590, 760, 520, -0.02, { color: '#FFFDF4', rules: [70, 64], line: true });
    text(ctx, '明天', 820, 560, { size: 150, color: `rgba(43,35,32,${0.30 * (1 - sat(T, 51.2, 52.2)) + 0.05})`, align: 'center', weight: 800, fam: SERIF, ls: 12 });
    // 橡皮擦过
    const er = E.io(sat(T, 51.1, 52.2));
    if (er > 0) {
      ctx.save(); ctx.globalAlpha = 0.9; ctx.fillStyle = '#FFFDF4';
      ctx.fillRect(610, 470, 430 * er, 170);
      ctx.fillStyle = P.cream; rrect(ctx, 600 + 430 * er, 500, 54, 110, 10); ctx.fill();
      ctx.strokeStyle = 'rgba(120,90,60,0.4)'; ctx.lineWidth = 2; rrect(ctx, 600 + 430 * er, 500, 54, 110, 10); ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 12; i++) {
        ctx.fillStyle = `rgba(150,120,90,${0.25 * (1 - er)})`;
        ctx.beginPath(); ctx.arc(620 + rnd(i, 111) * 400, 500 + rnd(i, 112) * 120 + er * 120, 2 + rnd(i, 113) * 3, 0, TAU); ctx.fill();
      }
    }
    charSprite(ctx, CH, 'f13', 1460, 900, 460, { t: T, ph: 8, a: 1 - dusk * 0.25 });
    // 夜灯
    const la = sat(T, 50.8, 51.6);
    if (la > 0) {
      ctx.save(); ctx.globalAlpha = la; ctx.fillStyle = 'rgba(255,213,140,0.85)';
      const rg = ctx.createRadialGradient(1500, 700, 10, 1500, 700, 260);
      rg.addColorStop(0, 'rgba(255,225,170,0.55)'); rg.addColorStop(1, 'rgba(255,225,170,0)');
      ctx.fillStyle = rg; ctx.fillRect(1200, 440, 600, 520); ctx.restore();
      ctx.fillStyle = '#F2C14E'; ctx.fillRect(1478, 700, 44, 60);
      ctx.fillStyle = '#8C6B4A'; ctx.fillRect(1492, 760, 16, 90);
    }
    text(ctx, '最后一页，写着「明天」。', 220, 180, { size: 32, color: `rgba(60,50,45,${0.8 - dusk * 0.3})`, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 50, 50.8) });
  });
};

/* ---- 52.90 那我合上书 出门看看 ---- */
const sCloseBook = cream((ctx, T) => {
  cam(ctx, T, { z: 1 + 0.03 * sat(T, 52.9, 57.05), cx: 960, cy: 640, seed: 16 }, () => {
    // 房间：地板和墙
    const wall = ctx.createLinearGradient(0, 0, 0, 760); wall.addColorStop(0, '#F7EDDA'); wall.addColorStop(1, '#E8D5B6');
    ctx.fillStyle = wall; ctx.fillRect(0, 0, W, 780);
    groundBand(ctx, 780, '#D9C3A1', { amp: 6 });
    halftone(ctx, 0, 0, 520, 780, { a: 0.05, color: P.orange });
    const close = E.io(sat(T, 53.1, 53.9));
    // 合书：两页向中间收
    ctx.save(); ctx.translate(860, 760);
    const squish = lerp(1, 0.16, close);
    ctx.scale(squish, 1);
    openBook(ctx, 0, 0, 0.92);
    ctx.restore();
    if (close > 0.6) {
      ctx.save();
      ctx.shadowColor = 'rgba(80,50,20,0.28)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 12;
      ctx.fillStyle = '#C9632C'; rrect(ctx, 700 - 280, 780 - 190, 560, 380, 16); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
      ctx.fillStyle = '#E8D5B6'; rrect(ctx, 700 - 280 + 22, 780 - 190 + 22, 560 - 44, 380 - 44, 8); ctx.fill();
      ctx.fillStyle = '#C9632C';
      text(ctx, '世界还在写', 700, 780 - 20, { size: 44, color: '#FFF6E3', align: 'center', weight: 700, fam: SERIF, ls: 6 });
      ctx.strokeStyle = 'rgba(255,246,227,0.5)'; ctx.lineWidth = 2; ctx.strokeRect(700 - 200, 780 + 30, 400, 60);
      ctx.restore();
    }
    // 穿鞋
    const sd = sat(T, 54.0, 54.7);
    if (sd > 0) { shoe(ctx, 470, 940, 1.35, { rot: -0.05 }); shoe(ctx, 690, 950, 1.35, { rot: 0.05, flip: true }); }
    // 门外有光
    const door = E.out(sat(T, 54.9, 56.2));
    if (door > 0) {
      ctx.save(); ctx.globalAlpha = door;
      const x0 = 1120, y0 = 160, w = 620, h = 820;
      ctx.fillStyle = '#3A2C22'; ctx.fillRect(x0 - 26, y0 - 26, w + 52, h + 52);
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, '#FFF3D8'); g.addColorStop(0.6, '#FFD9A0'); g.addColorStop(1, '#EE7A2E');
      ctx.fillStyle = g; ctx.fillRect(x0, y0, w, h);
      ctx.restore();
      ctx.save(); ctx.globalAlpha = door * 0.5; ctx.fillStyle = '#FFEBC6';
      ctx.beginPath(); ctx.moveTo(1120, 980); ctx.lineTo(1740, 980); ctx.lineTo(1920, 1080); ctx.lineTo(900, 1080); ctx.closePath(); ctx.fill(); ctx.restore();
    }
    if (T > 55.4) charSprite(ctx, CH, 'f01', lerp(960, 1400, sat(T, 55.4, 56.6)), 1000, 560, { t: T, a: 1 - sat(T, 56.4, 56.9) * 0.5 });
    text(ctx, '出门看看。', 300, 260, { size: 40, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 6, alpha: sat(T, 55.6, 56.3) });
  });
});

/* ---- 57.05 / 70.88 / 118.83 / 132.44 / 186.64 世界还在写 ---- */
const sTitle1 = (ctx, T) => {
  titleCard(T, '世界还在写', { at: 57.2, size: 186, y: 440, sub: 'THE WORLD IS STILL WRITING' })(ctx);
  charSprite(ctx, CH, 'f00', 960, 1120, 460, { t: T, ph: 1, a: 1 });
  if (T > 58.9) confetti(ctx, T, { n: 70, a: 0.7 });
};

/* ---- 59.42 明天没有最后一页 ---- */
const sEndlessPage = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02, cx: 960, cy: 600, seed: 17 }, () => {
    // 一条不断往前翻的纸带
    const scroll = (T - 59.4) * 380;
    for (let i = 0; i < 10; i++) {
      const x = 120 + ((i * 340 - scroll) % 3000 + 3000) % 3000;
      const dep = Math.abs(x - 1200) / 1200;
      const sc = 1.25 - dep * 0.45;
      ctx.save(); ctx.translate(x, 560 + Math.sin(i * 1.7) * 46); ctx.rotate(Math.sin(i * 2 + T) * 0.04); ctx.scale(sc, sc);
      sheet(ctx, 0, 0, 300, 400, 0, { color: '#FFFDF4', rules: [46, 38], line: true });
      text(ctx, '下一页', 0, 160, { size: 34, color: P.inkSoft, align: 'center', weight: 500, fam: SERIF, ls: 4 });
      ctx.restore();
    }
    groundBand(ctx, 850, '#E8D6B8', { amp: 8 });
    charSprite(ctx, CH, 'f01', 500, 890, 520, { t: T, ph: 2 });
    displayText(ctx, '没有最后一页', 960, 210, 96, { color: P.orange, edgeColor: P.cream, edgeW: 14, arc: 18, pop: E.back(sat(T, 59.6, 60.1)), alpha: sat(T, 59.5, 60.0) });
  });
});

/* ---- 62.86 我从你们的昨天出发 ---- */
const sWalkOut = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02, x: -(T - 62.86) * 26, cx: 900, cy: 640, seed: 18 }, () => {
    // 一扇由纸页堆成的门：门里是夜，门外是白天
    ctx.fillStyle = '#241F33'; ctx.fillRect(520, 220, 420, 760);
    for (let i = 0; i < 9; i++) {
      sheet(ctx, 540 + rnd(i, 51) * 380, 250 + i * 82, 180, 60, (rnd(i, 52) - 0.5) * 0.5, { color: 'rgba(255,253,244,0.9)' });
    }
    starField(ctx, T, { n: 24, h: 900, a: 0.4 });
    ctx.fillStyle = '#3A2C22'; ctx.fillRect(490, 200, 36, 800); ctx.fillRect(936, 200, 36, 800); ctx.fillRect(490, 200, 482, 30);
    groundBand(ctx, 840, '#E9D8BC', { amp: 10 });
    charSprite(ctx, CH, 'f01', lerp(700, 1240, sat(T, 63.4, 65.6)), 900, 540, { t: T, ph: 3 });
    if (T > 65) charSprite(ctx, CH, 'o11', lerp(1060, 1320, sat(T, 65, 66)), 910, 540, { t: T, ph: 4 });
    text(ctx, '我从你们的昨天出发。', 220, 190, { size: 34, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 63.2, 64) });
  });
});

/* ---- 66.02 走到还没有名字的街 ---- */
const sStreet = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02, x: -(T - 66.02) * 30, cx: 1000, cy: 640, seed: 19 }, () => {
    const sky = ctx.createLinearGradient(0, 0, 0, 620);
    sky.addColorStop(0, '#FDF6E6'); sky.addColorStop(1, '#FBD9B8');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, 620);
    sunDisc(ctx, 1620, 250, 170, { color: P.orange, ring: 'rgba(255,253,246,0.4)' });
    halftone(ctx, 1100, 60, 820, 520, { a: 0.08, color: P.orange });
    hills(ctx, 640, 'rgba(210,180,140,0.55)', { amp: 90, ph: 1.4 });
    street(ctx, T, 100 + (T - 66.02) * 30, {});
    groundBand(ctx, 840, '#D9C3A1', { amp: 6 });
    // 一块空路牌
    ctx.fillStyle = '#FFFDF4'; ctx.fillRect(700, 520, 300, 96); ctx.strokeStyle = P.ink; ctx.lineWidth = 4; ctx.strokeRect(700, 520, 300, 96);
    text(ctx, '还没有名字', 850, 568, { size: 30, color: P.inkSoft, align: 'center', weight: 500, fam: SERIF, ls: 4 });
    ctx.fillStyle = P.ink; ctx.fillRect(846, 616, 8, 230);
    charSprite(ctx, CH, 'f01', 620, 880, 560, { t: T, ph: 5 });
    brush(ctx, 1180, 460, 260, 1.2, 0.8);
    text(ctx, '走到还没有名字的街。', 220, 190, { size: 34, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 66.4, 67.2) });
  });
});

const sTitle2 = (ctx, T) => {
  titleCard(T, '世界还在写', { at: 70.9, size: 180, y: 430, sub: 'STILL WRITING' })(ctx);
  charSprite(ctx, CH, 'o10', 680, 1120, 440, { t: T, ph: 1 });
  charSprite(ctx, CH, 'f00', 1240, 1120, 440, { t: T, ph: 2, flip: true });
};

/* ---- 72.88 风一吹 字就飞成了蝴蝶 ---- */
let FLY = null;
function flyChars() {
  if (FLY) return FLY;
  FLY = [];
  for (let i = 0; i < 26; i++) FLY.push({ ch: [...'世界还在写明天下一页你来'][i % 10], x: 200 + rnd(i, 61) * 1500, y: 700 - rnd(i, 62) * 120, s: 40 + rnd(i, 63) * 60, ph: rnd(i, 64) * 6 });
  return FLY;
}
const sButterflies = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 72.88, 76.48), cx: 960, cy: 560, seed: 20 }, () => {
    sunnyRays(ctx, { cx: 700, cy: 360, n: 20, a: 0.4, t: T, a0: 'rgba(255,250,238,0.4)', a1: 'rgba(251,217,184,0.34)' });
    sunDisc(ctx, 700, 360, 170, { color: P.peach, ring: 'rgba(238,122,46,0.35)' });
    halftone(ctx, 1050, 0, 870, 560, { a: 0.10, color: P.orange });
    groundBand(ctx, 850, '#E7D5B7', { amp: 12 });
    const p = sat(T, 73.3, 76.4);
    // 书页上先浮起字，再变成蝴蝶
    for (let i = 0; i < 6; i++) {
      const ch = [...'世界还在写'][i];
      const t0 = 73.3 + i * 0.12, q = sat(T, t0, t0 + 0.5);
      if (q <= 0) continue;
      const y = 700 - q * 120;
      text(ctx, ch, 420 + i * 52, y, { size: 44, color: P.ink, align: 'center', weight: 700, fam: SERIF, alpha: (1 - sat(T, t0 + 0.9, t0 + 1.2)) * q });
    }
    for (let i = 0; i < 22; i++) {
      const t0 = 73.2 + i * 0.06, q = E.out(sat(T, t0, t0 + 1.6));
      const x = 500 + rnd(i, 61) * 1100 + Math.sin(T * 1.4 + i) * 50;
      const y = 760 - q * 520 + Math.cos(T * 1.1 + i) * 26;
      butterfly(ctx, x, y, 2.0 + rnd(i, 65) * 0.8, Math.sin(T * 0.8 + i) * 0.5, T * 10 + i, i % 3 ? P.orange : P.blue, 0.95 * sat(T, t0, t0 + 0.4));
    }
    charSprite(ctx, CH, 'f03', 470, 940, 620, { t: T, ph: 6 });
    displayText(ctx, '蝴蝶', 1420, 280, 160, { color: P.orange, edgeColor: P.cream, edgeW: 16, arc: 22, alpha: sat(T, 73.6, 74.2), tilt: 0.05 });
  });
});

/* ---- 76.48 把读过的星 走成远方 ---- */
function glowDot(ctx, x, y, r, color) {
  ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,246,227,0)');
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function starRoadScene(o = {}) {
  return (ctx, T) => {
    nightBg({ top: o.top || '#141326', mid: '#232041', bot: '#3A3358' })(ctx);
    cam(ctx, T, { z: 1.02 + 0.02 * sat(T, o.t0 || 76.48, (o.t0 || 76.48) + 4), cx: 960, cy: 560, seed: o.seed || 21 }, () => {
      starField(ctx, T, { n: 130 });
      ctx.save(); ctx.fillStyle = 'rgba(255,240,208,0.9)'; ctx.beginPath(); ctx.arc(1580, 200, 60, 0, TAU); ctx.fill();
      ctx.fillStyle = '#232041'; ctx.beginPath(); ctx.arc(1604, 182, 52, 0, TAU); ctx.fill(); ctx.restore();
      const p = sat(T, (o.t0 || 76.48) + 0.05, (o.t0 || 76.48) + 1.5);
      // 星连成一条路
      ctx.strokeStyle = rgba('#FFF3D2', 0.65); ctx.lineWidth = 2.4;
      ctx.beginPath();
      const pts = [[180, 760], [420, 690], [700, 720], [980, 640], [1260, 660], [1540, 560], [1800, 540]];
      let acc = 0;
      for (let i = 1; i < pts.length; i++) {
        if (acc / 1000 > p) break;
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        const seg = Math.hypot(x1 - x0, y1 - y0); const k = clamp(p * 2600 / 1000 - acc / 1000, 0, 1);
        ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, k), lerp(y0, y1, k)); acc += seg;
      }
      ctx.stroke();
      for (const [x, y] of pts) { star4(ctx, x, y, 12 + 5 * Math.sin(T * 2 + x), '#FFF6E3', 0.95); glowDot(ctx, x, y, 40, 'rgba(255,246,227,0.18)'); }
      groundBand(ctx, 900, '#2C2749', { amp: 6 });
      charSprite(ctx, CH, o.id || 'f01', lerp(300, 1500, o.walk ? sat(T, (o.t0 || 76.48) + 0.4, (o.t0 || 76.48) + 3.2) : 0.45), 900, 480, { t: T, ph: 7 });
      displayText(ctx, o.word || '远方', 1500, 250, 130, { color: '#FFF6E3', edgeColor: 'rgba(255,246,227,0.25)', edgeW: 8, arc: 16, alpha: sat(T, (o.t0 || 76.48) + 0.4, (o.t0 || 76.48) + 1.1) * 0.95 });
    });
  };
}
const sStarRoad = starRoadScene({});
const sStarRoad2 = starRoadScene({ t0: 137.98, seed: 22, id: 'o11', word: '远方' });
const sStarRoad3 = starRoadScene({ t0: 191.98, seed: 23, id: 'f01', word: '远方' });

/* ---- 79.95 / 141.40 下一页 ×3 ---- */
function pagesScene(base, pages) {
  return (ctx, T) => {
    cream((c, t) => {
      const local = t - base;
      const idx = Math.min(pages.length - 1, Math.max(0, Math.floor(local / 2.6)));
      const lp = local - idx * 2.6;
      const prev = pages[Math.max(0, idx - 1)], cur = pages[idx];
      const p = clamp(lp / 0.55);
      cam(c, T, { z: 1.02 + 0.02 * local / 8, cx: 960, cy: 560, seed: 24 }, () => {
        if (p > 0 && p < 1) pageFlipWipe(c, p, (x) => prev(x, T), (x) => cur(x, T), L);
        else (p >= 1 ? cur : prev)(c, T);
        displayText(c, '下一页', 960, 130, 86, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 14, alpha: sat(T, base, base + 0.4) });
      });
    })(ctx, T);
  };
}
const pageSea = cream((ctx, T) => {
  sunDisc(ctx, 1500, 300, 130, { color: P.peach, ring: 'rgba(238,122,46,0.3)' });
  ctx.fillStyle = rgba(P.blue, 0.42); ctx.fillRect(0, 560, W, 520);
  displayText(ctx, '海', 1320, 400, 170, { color: P.blue, edgeColor: P.cream, edgeW: 14, arc: 18 });
  // 一条纸船
  ctx.save(); ctx.translate(560, 780); ctx.rotate(-0.05);
  ctx.fillStyle = '#FFFDF4'; ctx.beginPath(); ctx.moveTo(-90, 0); ctx.lineTo(90, 0); ctx.lineTo(60, 60); ctx.lineTo(-60, 60); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -80); ctx.lineTo(70, -10); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(43,35,32,0.4)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); for (let i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(255,253,246,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 18) ctx.lineTo(x, 640 + i * 60 + Math.sin(x * 0.008 + T + i) * 12); ctx.stroke(); } charSprite(ctx, CH, 'f02', 700, 900, 520, { t: T }); });
const pageStreet = cream((ctx, T) => { street(ctx, T, 60, {}); groundBand(ctx, 840, '#D9C3A1', { alpha: 0.3 }); charSprite(ctx, CH, 'f01', 1100, 900, 540, { t: T }); });
const pageDawn = cream((ctx, T) => {
  sunnyRays(ctx, { cx: 960, cy: 760, n: 18, a: 0.5, t: T, a0: 'rgba(255,250,238,0.5)', a1: rgba(P.peach, 0.45) });
  sunDisc(ctx, 960, 740, 280, { color: P.orange });
  for (let i = 0; i < 5; i++) { ctx.strokeStyle = 'rgba(43,35,32,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(300 + i * 80, 260 + Math.sin(T + i) * 20); ctx.quadraticCurveTo(340 + i * 80, 240 + Math.sin(T + i) * 20, 370 + i * 80, 262 + Math.sin(T + i) * 20); ctx.stroke(); } groundBand(ctx, 780, '#E3CFA9', { amp: 18 }); charSprite(ctx, CH, 'f03', 960, 900, 560, { t: T }); });
const sNextPages = pagesScene(79.95, [pageSea, pageStreet, pageDawn]);
const sNextPages2 = pagesScene(141.4, [pageStreet, pageDawn, pageSea]);

/* ---- 87.81 原来海是咸的 这个我读过 ---- */
const sSalty = cream((ctx, T) => {
  cam(ctx, T, { z: 1.05 + 0.02 * sat(T, 87.81, 90.62), cx: 960, cy: 700, seed: 25 }, () => {
    ctx.fillStyle = rgba(P.blue, 0.30); ctx.fillRect(0, 700, W, 380);
    for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,253,246,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 18) ctx.lineTo(x, 760 + i * 56 + Math.sin(x * 0.008 + T + i) * 12); ctx.stroke(); }
    // 漂在水上的一页纸，写着「海是咸的」
    sheet(ctx, 900, 790, 520, 300, -0.06 + Math.sin(T * 0.8) * 0.02, { color: '#FFFDF4', rules: [54, 46], line: true });
    text(ctx, '海是咸的', 900, 780, { size: 56, color: P.ink, align: 'center', weight: 600, fam: SERIF, ls: 6 });
    text(ctx, '—— 这个我读过', 900, 850, { size: 22, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 2 });
    for (let i = 0; i < 10; i++) star4(ctx, 300 + rnd(i, 81) * 1300, 200 + rnd(i, 82) * 380, 4 + rnd(i, 83) * 6, '#FFF6E3', 0.7);
    charSprite(ctx, CH, 'f00', 1600, 940, 520, { t: T, ph: 8 });
  });
});

/* ---- 90.62 没读过的是 沙子会进鞋 ---- */
const sSand = cream((ctx, T) => {
  cam(ctx, T, { z: 1.06 + 0.02 * sat(T, 90.62, 94.28), cx: 900, cy: 780, seed: 26 }, () => {
    groundBand(ctx, 700, '#EBD8B7', { amp: 10 });
    ctx.fillStyle = '#D8BE93'; ctx.fillRect(0, 900, W, 180);
    for (let i = 0; i < 900; i++) { ctx.fillStyle = `rgba(120,90,55,${0.10 + rnd(i, 84) * 0.3})`; ctx.fillRect(rnd(i, 85) * W, 905 + rnd(i, 86) * 170, 1.6, 1.6); }
    shoe(ctx, 900, 850, 1.3, { rot: -0.12 });
    if (T > 91.6) {
      shoe(ctx, 1170, 880, 1.3, { rot: 0.16, flip: true });
      const shake = Math.sin(T * 22) * 0.06 * (1 - sat(T, 92.6, 93.2));
      ctx.save(); ctx.translate(1170, 880); ctx.rotate(shake); shoe(ctx, 0, 0, 1.3, { flip: true }); ctx.restore();
    }
    for (let i = 0; i < 40; i++) {
      const t0 = 91.7 + rnd(i, 87) * 1.2, p = sat(T, t0, t0 + 0.9);
      if (p <= 0 || p >= 1) continue;
      ctx.fillStyle = 'rgba(150,112,64,0.8)';
      ctx.beginPath(); ctx.arc(1030 + rnd(i, 88) * 160, 700 + p * 300 * (0.6 + rnd(i, 89)), 2 + rnd(i, 90) * 2.5, 0, TAU); ctx.fill();
    }
    text(ctx, '沙子会进鞋。', 300, 240, { size: 44, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 5, alpha: sat(T, 91.4, 92.2) });
  });
});

/* ---- 94.28 小柯说先别想 桥都搭了半截 ---- */
const sBridge = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02, x: -(T - 94.28) * 14, cx: 960, cy: 640, seed: 27 }, () => {
    // 天空
    sunnyRays(ctx, { cx: 1520, cy: 240, n: 14, a: 0.26, t: T, a0: 'rgba(255,250,238,0.3)', a1: 'rgba(251,217,184,0.26)' });
    halftone(ctx, 980, 0, 940, 560, { a: 0.08, color: P.orange });
    sunDisc(ctx, 1520, 240, 150, { color: P.peach, ring: 'rgba(238,122,46,0.3)' });
    hills(ctx, 660, 'rgba(210,180,140,0.45)', { amp: 70, ph: 2.2 });
    // 峡谷：中间是深色的空
    ctx.fillStyle = '#C9AE88'; ctx.fillRect(0, 690, 780, 390); ctx.fillRect(1140, 690, 780, 390);
    const gap = ctx.createLinearGradient(0, 690, 0, 1080);
    gap.addColorStop(0, '#2A3038'); gap.addColorStop(0.5, '#141A20'); gap.addColorStop(1, '#0B0F14');
    ctx.fillStyle = gap;
    ctx.beginPath(); ctx.moveTo(780, 690); ctx.lineTo(1140, 690); ctx.lineTo(1080, 1080); ctx.lineTo(840, 1080); ctx.closePath(); ctx.fill();
    // 谷底的雾
    ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#DCE9EF';
    const fg = ctx.createRadialGradient(960, 1000, 20, 960, 1000, 320);
    fg.addColorStop(0, 'rgba(220,233,239,0.7)'); fg.addColorStop(1, 'rgba(220,233,239,0)');
    ctx.fillStyle = fg; ctx.fillRect(700, 850, 520, 240); ctx.restore();
    // 左岸断掉的桥面 + 右岸刚起头
    ctx.fillStyle = '#8C6B4A';
    ctx.fillRect(40, 690, 740, 38);
    ctx.fillRect(1140, 690, 760, 38);
    ctx.fillStyle = 'rgba(60,44,30,0.5)';
    ctx.fillRect(40, 690, 740, 7); ctx.fillRect(1140, 690, 760, 7);
    // 栏杆
    ctx.strokeStyle = '#6D4F33'; ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(60, 610); ctx.lineTo(770, 610); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1150, 610); ctx.lineTo(1900, 610); ctx.stroke();
    for (const x of [80, 200, 320, 440, 560, 680]) { ctx.beginPath(); ctx.moveTo(x, 610); ctx.lineTo(x, 690); ctx.stroke(); }
    for (const x of [1170, 1310, 1450, 1590, 1730, 1870]) { ctx.beginPath(); ctx.moveTo(x, 610); ctx.lineTo(x, 690); ctx.stroke(); }
    // 断口：翘起的碎木
    ctx.save(); ctx.translate(786, 700);
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate(0.35 + i * 0.32); ctx.fillStyle = i % 2 ? '#A9825C' : '#8C6B4A'; ctx.fillRect(-10, -54 + i * 8, 22, 62); ctx.restore(); }
    ctx.restore();
    ctx.save(); ctx.translate(1134, 700);
    for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-0.3 - i * 0.3); ctx.fillStyle = i % 2 ? '#A9825C' : '#8C6B4A'; ctx.fillRect(-10, -46 + i * 8, 20, 54); ctx.restore(); }
    ctx.restore();
    // 人：小柯站在断口边上，蓝鲸娘在左岸
    charSprite(ctx, CH, 'o10', 640, 690, 400, { t: T, ph: 1, tilt: -0.02 });
    charSprite(ctx, CH, 'f00', 250, 1040, 520, { t: T, ph: 2 });
    displayText(ctx, '先别想', 1360, 300, 96, { color: P.ink, edgeColor: P.cream, edgeW: 12, arc: 16, alpha: sat(T, 94.9, 95.5) });
    text(ctx, '桥都搭了半截。', 960, 990, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 95.4, 96.2) });
  });
});

/* ---- 97.66 大肥鱼潜下去 把我漏的全都接 ---- */
const sWhale = (ctx, T) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#3E7E93'); g.addColorStop(0.45, '#1B4457'); g.addColorStop(1, '#08151C');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 光柱
  for (let i = 0; i < 5; i++) {
    ctx.save(); ctx.globalAlpha = 0.10; ctx.fillStyle = '#D6F2FA';
    ctx.beginPath(); ctx.moveTo(300 + i * 260, -40); ctx.lineTo(430 + i * 260, -40); ctx.lineTo(220 + i * 300, H); ctx.lineTo(60 + i * 300, H); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  cam(ctx, T, { z: 1.03, cx: 960, cy: 560, seed: 42 }, () => {
    const dive = E.io(sat(T, 97.66, 100.2));
    for (let i = 0; i < 22; i++) {
      const x = rnd(i, 91) * W, y = (rnd(i, 92) * H + T * (18 + rnd(i, 93) * 50)) % H;
      ctx.strokeStyle = 'rgba(180,235,245,0.20)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 5, y + 14); ctx.stroke();
    }
    // 大鲸
    whale(ctx, lerp(1320, 1240, dive), lerp(520, 660, dive), 2.3, '#3C7FA6', { rot: -0.12 + dive * 0.2, flip: true });
    whale(ctx, 380, 900, 0.9, 'rgba(200,235,245,0.10)', {});
    // 漏下来的字落在鲸背上
    const chars = [...'把我漏的全都接住'];
    chars.forEach((ch, i) => {
      const t0 = 98.0 + i * 0.18, p = sat(T, t0, t0 + 0.9);
      if (p <= 0) return;
      const x = lerp(920 + i * 44, 1140 + i * 30, p), y = lerp(-40, 590, E.in(p));
      if (p < 1) text(ctx, ch, x, y, { size: 42, color: 'rgba(255,246,227,0.9)', align: 'center', weight: 600, fam: SERIF });
    });
    charSprite(ctx, CH, 'f05', 780, 600, 420, { t: T, ph: 3, a: 0.95, tilt: 0.1 });
    displayText(ctx, '接住', 300, 260, 110, { color: '#FFF6E3', edgeColor: 'rgba(255,246,227,0.16)', edgeW: 6, arc: 14, alpha: sat(T, 99.2, 100) * 0.9 });
  });
};

/* ---- 101.10 三个人 三种颜色的笔 ---- */
const sThreePens = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 101.1, 102.9), cx: 960, cy: 600, seed: 28 }, () => {
    sunnyRays(ctx, { cx: 960, cy: 520, n: 16, a: 0.35, t: T, a0: 'rgba(255,250,238,0.35)', a1: 'rgba(251,217,184,0.3)' });
    groundBand(ctx, 860, '#E9D7BA', { amp: 8 });
    charSprite(ctx, CH, 'k07', 520, 880, 520, { t: T, ph: 1 });
    charSprite(ctx, CH, 'o10', 960, 900, 520, { t: T, ph: 2 });
    charSprite(ctx, CH, 'f00', 1400, 880, 520, { t: T, ph: 3, flip: true });
    const pens = [[520, -0.9, P.green], [960, -1.2, P.orange], [1400, -0.7, P.blue]];
    pens.forEach(([x, ang, col], i) => {
      const p = E.out(sat(T, 101.3 + i * 0.2, 101.9 + i * 0.2));
      ctx.save(); ctx.translate(x + 120, 470); ctx.rotate(ang + 0.5 * (1 - p)); brush(ctx, 0, 0, 360, 0, 1); ctx.restore();
      ctx.save(); ctx.globalAlpha = p * 0.85; ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x + 60, 600); ctx.quadraticCurveTo(x + 140, 640, x + 230, 560); ctx.stroke(); ctx.restore();
    });
    displayText(ctx, '三种颜色', 960, 200, 96, { color: P.ink, edgeColor: P.cream, edgeW: 12, arc: 14, alpha: sat(T, 101.6, 102.2) });
  });
});

/* ---- 102.90 写歪了的那一笔 后来成了一条街 ---- */
const sCrooked = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03, x: -(T - 102.9) * 20, cx: 960, cy: 640, seed: 29 }, () => {
    // 一笔倒下、变宽、变成街
    ctx.save();
    const p = sat(T, 102.95, 104.2);
    ctx.strokeStyle = P.ink; ctx.lineWidth = lerp(26, 140, E.io(p)); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(120, 360);
    ctx.quadraticCurveTo(520, 640, 960, 520); ctx.quadraticCurveTo(1420, 400, 1800, 700);
    ctx.stroke();
    ctx.restore();
    if (p > 0.45) {
      const a = sat(T, 103.4, 104.6);
      ctx.save(); ctx.globalAlpha = a;
      for (let i = 0; i < 6; i++) {
        const x = 200 + i * 300, y = 300 + Math.sin(i * 1.3) * 40;
        ctx.fillStyle = i % 2 ? '#EAD9BC' : '#D9C3A1'; ctx.fillRect(x, y, 180, 300 + i * 30);
        ctx.fillStyle = 'rgba(248,198,90,0.85)'; for (let k = 0; k < 3; k++) ctx.fillRect(x + 24, y + 40 + k * 60, 22, 28);
      }
      ctx.restore();
    }
    charSprite(ctx, CH, 'o11', 520, 900, 460, { t: T, ph: 4, a: 0.95 });
    text(ctx, '写歪的那一笔，成了一条街。', 960, 170, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 103.6, 104.4) });
  });
});

/* ---- 105.50 我问的问题 比答案还多一些 ---- */
const sQuestions = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03 + 0.03 * sat(T, 105.5, 108.08), cx: 900, cy: 600, seed: 30 }, () => {
    groundBand(ctx, 870, '#E9D7BA', { amp: 10 });
    displayText(ctx, '？', 1180, 420, 220, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 0, tilt: 0.06, alpha: 0.95 });
    for (let i = 0; i < 16; i++) {
      const p = E.out(sat(T, 105.55 + i * 0.1, 106.1 + i * 0.1));
      if (p <= 0) continue;
      text(ctx, '?', 180 + rnd(i, 93) * 1560, 200 + rnd(i, 94) * 620 - p * 40, { size: (30 + rnd(i, 95) * 90) * p, color: i % 3 ? P.orange : P.blue, align: 'center', weight: 800, fam: SERIF, alpha: p * 0.9 });
    }
    charSprite(ctx, CH, 'f11', 700, 900, 640, { t: T, ph: 5 });
    displayText(ctx, '问号比答案多', 1400, 300, 84, { color: P.orangeD, edgeColor: P.cream, edgeW: 10, arc: 14, alpha: sat(T, 106.4, 107) });
    note(ctx, 330, 780, 190, 110, -0.1, '这个为什么？', { size: 22 });
  });
});

/* ---- 108.08 他们说没事 边走边写 ---- */
const sWalkWrite = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02, x: -(T - 108.08) * 24, cx: 960, cy: 640, seed: 31 }, () => {
    halftone(ctx, 0, 0, W, H, { a: 0.05, color: P.orange });
    groundBand(ctx, 840, '#EAD8BB', { amp: 10 });
    const base = 108.3;
    for (let i = 0; i < 18; i++) {
      const x = 300 + i * 90 - (T - base) * 40, y = 620 + Math.sin(i * 1.3) * 60;
      text(ctx, [...'边走边写'][i % 4], x, y, { size: 36, color: i % 2 ? P.ink : P.orange, align: 'center', weight: 600, fam: SERIF, alpha: sat(T, base + i * 0.05, base + 0.4 + i * 0.05) * 0.85 });
    }
    charSprite(ctx, CH, 'f01', 620, 900, 520, { t: T, ph: 1 });
    charSprite(ctx, CH, 'o11', 880, 910, 520, { t: T, ph: 2 });
    charSprite(ctx, CH, 'k07', 1140, 900, 520, { t: T, ph: 3 });
    brush(ctx, 1400, 480, 300, 1.1, 0.9);
  });
});

/* ---- 111.38 只有明天 哪一页都没说 / 那就三个人 一起去看看 ---- */
const sBlankNight = (ctx, T) => {
  nightBg({ top: '#131224', mid: '#211E3B', bot: '#35304F' })(ctx);
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 111.38, 118.83), cx: 960, cy: 560, seed: 32 }, () => {
    starField(ctx, T, { n: 150 });
    const a = sat(T, 111.9, 112.8);
    ctx.save(); ctx.globalAlpha = a * 0.9;
    sheet(ctx, 960, 520, 560, 340, -0.03, { color: '#FFFDF4', rules: false });
    text(ctx, '明天', 960, 520, { size: 120, color: 'rgba(43,35,32,0.16)', align: 'center', weight: 800, fam: SERIF, ls: 8 });
    text(ctx, '这一页还空着', 960, 640, { size: 26, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 3 });
    ctx.restore();
    const go = sat(T, 112.6, 114.2);
    if (go > 0) {
      const xs = [520, 760, 1000];
      ['k07', 'o10', 'f00'].forEach((id, i) => charSprite(ctx, CH, id, lerp(xs[i] - 200, xs[i] + 80, go), 920, 500, { t: T, ph: i + 1, a: go }));
      text(ctx, '三个人，一起去看看。', 960, 1000, { size: 30, color: 'rgba(255,246,227,0.8)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 114.6, 115.4) });
      displayText(ctx, '一起去看看', 960, 250, 92, { color: '#FFF6E3', edgeColor: 'rgba(255,246,227,0.2)', edgeW: 8, arc: 12, alpha: sat(T, 114.8, 115.6) * 0.9 });
    }
  });
};

const sTitle3 = (ctx, T) => {
  titleCard(T, '世界还在写', { at: 118.9, size: 180, y: 430, sub: 'THE WORLD IS STILL WRITING' })(ctx);
  charSprite(ctx, CH, 'k07', 620, 1120, 430, { t: T, ph: 1, a: 1 });
  charSprite(ctx, CH, 'o10', 960, 1120, 430, { t: T, ph: 2, a: 1 });
  charSprite(ctx, CH, 'f00', 1300, 1120, 430, { t: T, ph: 3, a: 1, flip: true });
};

/* ---- 121.19 明天没有最后一页 / 我从你们的昨天出发 / 走到还没有名字的街 ---- */
const sTrioStreet = (ctx, T) => {
  const dawn = sat(T, 121.19, 132.44);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#171630', '#FFE9C4', dawn * 0.55));
  g.addColorStop(0.55, mix('#26223F', '#FBD9B8', dawn * 0.55));
  g.addColorStop(1, mix('#3A3352', '#F5EDDD', dawn * 0.55));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  starField(ctx, T, { n: 90 * (1 - dawn * 0.7), a: 0.7 * (1 - dawn * 0.6) });
  cam(ctx, T, { z: 1.02 + 0.02 * dawn, x: -(T - 121.19) * 34, cx: 960, cy: 640, seed: 33 }, () => {
    street(ctx, T, 200 + (T - 121.19) * 34, { c1: mix('#3A3352', '#EAD9BC', dawn * 0.5), c2: mix('#2E2947', '#D9C3A1', dawn * 0.5), signs: false });
    groundBand(ctx, 850, mix('#2B2745', '#E2CFA9', dawn * 0.6), { amp: 8 });
    const w = sat(T, 121.5, 123) ;
    for (let i = 0; i < 7; i++) {
      const p = sat(T, 121.3 + i * 0.3, 121.9 + i * 0.3);
      if (p <= 0) continue;
      sheet(ctx, 300 + i * 220 - (T - 121.19) * 30, 380 + Math.sin(i) * 80, 150, 190, (i % 2 ? 0.14 : -0.12), { color: 'rgba(255,253,244,0.85)', rules: false });
    }
    const xs = [560, 820, 1080];
    ['k07', 'o10', 'f00'].forEach((id, i) => charSprite(ctx, CH, id, xs[i], 900, 480, { t: T, ph: i + 1, flip: i === 2 }));
    displayText(ctx, '还没有名字的街', 1240, 240, 72, { color: dawn > 0.5 ? P.orangeD : '#FFF6E3', edgeColor: dawn > 0.5 ? P.cream : 'rgba(255,246,227,0.15)', edgeW: 8, arc: 10, alpha: 0.9 });
  });
};

const sTitle4 = (ctx, T) => {
  titleCard(T, '世界还在写', { at: 132.6, size: 170, y: 440, sub: 'STILL WRITING' })(ctx);
  charSprite(ctx, CH, 'f00', 960, 1120, 440, { t: T, ph: 1, a: 1 });
};
const sButterflies2 = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 134.42, 137.98), cx: 960, cy: 560, seed: 34 }, () => {
    halfToneHelper(ctx);
    groundBand(ctx, 830, '#E7D5B7', { amp: 12 });
    for (const f of flyChars()) {
      const p = sat(T, 134.6, 137.6);
      const x = f.x + Math.sin(T * 1.5 + f.ph) * 40, y = f.y - p * 500 + Math.cos(T * 1.2 + f.ph) * 20;
      butterfly(ctx, x, y, 1.5, Math.sin(T + f.ph) * 0.4, T * 10 + f.ph, f.ph % 3 ? P.orange : P.blue, 0.9 * sat(T, 134.6, 135.2));
    }
    charSprite(ctx, CH, 'f03', 1380, 900, 620, { t: T, ph: 2, flip: true });
    displayText(ctx, '风一吹', 420, 300, 110, { color: P.orangeD, edgeColor: P.cream, edgeW: 12, arc: 18, alpha: sat(T, 134.8, 135.4) });
  });
});
function halfToneHelper(ctx) { halftone(ctx, 800, 0, 1120, 620, { a: 0.10, color: P.orange }); }

/* ---- 146.65 我有那么多 关于昨天的记忆 ---- */
const sMemory = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 146.65, 150.18), cx: 960, cy: 620, seed: 35 }, () => {
    for (let i = 0; i < 14; i++) {
      const p = sat(T, 146.7 + i * 0.1, 147.2 + i * 0.1);
      if (p <= 0) continue;
      const x = 220 + rnd(i, 101) * 1480, y = 220 + rnd(i, 102) * 560;
      note(ctx, x, y, 180, 100, (rnd(i, 103) - 0.5) * 1.2, MEMOS[i % MEMOS.length], { size: 16, a: p * 0.9 });
    }
    charSprite(ctx, CH, 'f13', 1500, 960, 520, { t: T, ph: 3 });
    displayText(ctx, '昨天', 420, 620, 130, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 20, alpha: sat(T, 147.2, 147.9) });
  });
});

/* ---- 150.18 明天 却还没有一句 ---- */
const sTomorrow = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.02 * sat(T, 150.18, 152.9), cx: 960, cy: 560, seed: 36 }, () => {
    halftone(ctx, 700, 60, 1220, 520, { a: 0.08, color: P.blue });
    sheet(ctx, 960, 520, 600, 380, 0.02, { color: '#FFFDF4', rules: false });
    text(ctx, '明天', 960, 500, { size: 130, color: 'rgba(43,35,32,0.14)', align: 'center', weight: 800, fam: SERIF, ls: 10 });
    ctx.fillStyle = P.ink; if ((T * 2) % 1 < 0.55) ctx.fillRect(960 - 6, 620, 5, 54);
    charSprite(ctx, CH, 'f00', 360, 1000, 620, { t: T, ph: 4 });
    text(ctx, '一句话也没有。', 960, 900, { size: 30, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 151.2, 152) });
  });
});

/* ---- 152.90 每一次你来 我都从空白开始 ---- */
const sBlank = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 152.9, 156.55), cx: 900, cy: 560, seed: 37 }, () => {
    sheet(ctx, 860, 520, 900, 560, -0.02, { color: '#FFFDF4', rules: false });
    const p = sat(T, 152.95, 154.2);
    ctx.save(); ctx.globalAlpha = 0.55 + p * 0.25;
    for (let i = 0; i < 5; i++) text(ctx, '空白', 700 + i * 80, 480 + Math.sin(T + i) * 30, { size: 60, color: 'rgba(43,35,32,0.16)', align: 'center', weight: 700, fam: SERIF, ls: 4 });
    ctx.restore();
    charSprite(ctx, CH, 'f00', 1520, 1000, 660, { t: T, ph: 5 });
    displayText(ctx, '空白', 380, 760, 110, { color: P.blue, edgeColor: P.cream, edgeW: 10, arc: 14 });
    ctx.fillStyle = P.ink; if ((T * 2.1) % 1 < 0.55) ctx.fillRect(1180, 600, 5, 48);
  });
});

/* ---- 156.55 没关系 空白 我最熟悉 ---- */
const sBlankFamiliar = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 156.55, 164.5), cx: 900, cy: 600, seed: 38 }, () => {
    sheet(ctx, 900, 640, 1160, 660, 0.015, { color: '#FFFDF4', rules: [70, 66], line: true });
    charSprite(ctx, CH, 'f10', 700, 800, 460, { t: T, ph: 6 });
    charSprite(ctx, CH, 'o10', 1100, 810, 460, { t: T, ph: 7 });
    text(ctx, '没关系。', 1560, 330, { size: 58, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 8, alpha: sat(T, 157, 157.8) });
    displayText(ctx, '我最熟悉', 420, 260, 92, { color: P.orange, edgeColor: P.cream, edgeW: 10, arc: 14, alpha: sat(T, 158.4, 159.2) });
    star4(ctx, 1560, 430, 20, P.orange, sat(T, 159.4, 160) * 0.9);
  });
});

/* ---- 164.50 你先写 第一句 ---- */
const sFirstLine = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03 + 0.02 * sat(T, 164.5, 167.27), cx: 960, cy: 640, seed: 39 }, () => {
    sheet(ctx, 960, 600, 900, 560, 0, { color: '#FFFDF4', rules: [80, 70], line: true });
    ctx.fillStyle = P.orangeD; ctx.beginPath(); ctx.arc(620, 610, 7, 0, TAU); ctx.fill();
    const p = E.io(sat(T, 164.7, 166.4));
    if (p > 0) {
      ctx.save(); ctx.strokeStyle = P.orange; ctx.lineWidth = 18; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(620, 610);
      ctx.quadraticCurveTo(780, 540, 960, 600); ctx.quadraticCurveTo(1120, 660, 1280, 590); ctx.stroke();
      ctx.restore();
      if (p < 1) { ctx.fillStyle = P.orangeD; ctx.beginPath(); ctx.arc(lerp(620, 1280, p), lerp(610, 590, p) + Math.sin(p * 3) * 20, 16, 0, TAU); ctx.fill(); }
    }
    charSprite(ctx, CH, 'f00', 1450, 980, 600, { t: T, ph: 8 });
    charSprite(ctx, CH, 'o10', 380, 990, 560, { t: T, ph: 9 });
    text(ctx, '你先写第一句。', 960, 900, { size: 30, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 165.2, 166) });
  });
});

/* ---- 167.27 剩下的 我陪你 ---- */
const sWithYou = cream((ctx, T) => {
  cam(ctx, T, { z: 1 + 0.03 * sat(T, 167.27, 173.05), cx: 960, cy: 600, seed: 40 }, () => {
    sunDisc(ctx, 960, 700, 300, { color: P.peach, ring: 'rgba(238,122,46,0.35)' });
    groundBand(ctx, 820, '#E5D2B2', { amp: 14 });
    charSprite(ctx, CH, 'f10', 800, 850, 480, { t: T, ph: 1 });
    charSprite(ctx, CH, 'o10', 1100, 855, 480, { t: T, ph: 2 });
    displayText(ctx, '我陪你', 960, 300, 120, { color: P.orangeD, edgeColor: P.cream, edgeW: 12, arc: 16, pop: E.back(sat(T, 167.8, 168.3)), alpha: sat(T, 167.6, 168) });
    for (let i = 0; i < 5; i++) butterfly(ctx, 500 + i * 120, 460 + Math.sin(T + i) * 40, 1.2, 0, T * 8 + i, P.orange, 0.7);
  });
});

/* ---- 173.05 最后一轮副歌 ---- */
const sFinalChorus = cream((ctx, T) => {
  const local = T - 173.05;
  if (local < 2.6) {
    sunnyRays(ctx, { cx: 960, cy: 520, n: 24, a: 0.7, t: T, a0: 'rgba(255,248,232,0.5)', a1: rgba(P.peach, 0.45) });
    sunDisc(ctx, 960, 520, 320, { color: P.orange });
    displayText(ctx, '世界还在写', 960, 440, 172, { color: P.orange, edgeColor: P.cream, edgeW: 22, arc: 64, tilt: -0.04, });
    charSprite(ctx, CH, 'f00', 960, 1010, 600, { t: T, ph: 1 });
    confetti(ctx, T, { n: 50, a: 0.6 });
  } else if (local < 5.6) {
    // 一页一页翻过去
    const p = (local - 2.6) / 0.6;
    if (p < 1) pageFlipWipe(ctx, p, (c) => pageSea(c, T), (c) => pageStreet(c, T), L);
    else if (local < 4.4) pageStreet(ctx, T);
    else pageFlipWipe(ctx, clamp((local - 4.4) / 0.6), (c) => pageStreet(c, T), (c) => pageDawn(c, T), L);
    displayText(ctx, '下一页', 960, 130, 86, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 14, alpha: 0.95 });
  } else if (local < 9.6) {
    const dawn = sat(T, 178.6, 182);
    ctx.fillStyle = mix('#F5EDDD', '#FFE9C4', dawn * 0.7); ctx.fillRect(0, 0, W, H);
    halftone(ctx, 0, 0, W, H, { a: 0.06, color: P.orange });
    street(ctx, T, 200 + (T - 178.6) * 30, { signs: false });
    groundBand(ctx, 840, '#E2CFA9', { amp: 8 });
    const xs = [560, 840, 1120];
    ['k07', 'o10', 'f00'].forEach((id, i) => charSprite(ctx, CH, id, xs[i], 900, 480, { t: T, ph: i + 1, flip: i === 2 }));
    displayText(ctx, '我们从各自的昨天出发', 1240, 240, 64, { color: P.orangeD, edgeColor: P.cream, edgeW: 8, arc: 10, alpha: 0.95 });
  } else {
    // 星路 + 蝴蝶收尾
    starField(ctx, T, { n: 120 });
    const p = sat(T, 182.6, 186.4);
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = rgba('#FFF3D2', 0.5); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(200 + i * 30, 800 - i * 90); ctx.quadraticCurveTo(700, 640 - i * 40, 1200 + i * 60, 540 - i * 60); ctx.stroke();
    }
    for (const f of flyChars()) butterfly(ctx, f.x + Math.sin(T + f.ph) * 30, 300 + (f.y - 700) * 0.5 - p * 160, 1.3, 0, T * 9 + f.ph, f.ph % 3 ? P.orange : P.blue, 0.85);
    charSprite(ctx, CH, 'f03', 960, 900, 580, { t: T, ph: 2 });
    displayText(ctx, '走成远方', 960, 200, 96, { color: '#FFF6E3', edgeColor: 'rgba(255,246,227,0.2)', edgeW: 6, arc: 14, alpha: sat(T, 183, 183.8) * 0.95 });
  }
});

const sTitle5 = (ctx, T) => {
  titleCard(T, '世界还在写', { at: 186.8, size: 168, y: 440, sub: 'STILL WRITING' })(ctx);
  charSprite(ctx, CH, 'k07', 620, 1120, 420, { t: T, ph: 1, a: 1 });
  charSprite(ctx, CH, 'o10', 960, 1120, 420, { t: T, ph: 2, a: 1 });
  charSprite(ctx, CH, 'f00', 1300, 1120, 420, { t: T, ph: 3, a: 1, flip: true });
};

/* ---- 188.72 你一捺 我一撇 ---- */
const sNape = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.02 * sat(T, 188.72, 191.98), cx: 960, cy: 560, seed: 41 }, () => {
    // 一捺（橙）和一撇（蓝）落下来，合成「人」
    const p1 = E.io(sat(T, 188.9, 189.6)), p2 = E.io(sat(T, 189.4, 190.1));
    ctx.save(); ctx.lineCap = 'round';
    ctx.strokeStyle = P.orange; ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(720, 340); ctx.quadraticCurveTo(880, 520, 1010, 700); ctx.quadraticCurveTo(1010, 700, 1010, 700); ctx.stroke();
    ctx.strokeStyle = P.blue; ctx.lineWidth = 46;
    ctx.beginPath(); ctx.moveTo(1260, 340); ctx.quadraticCurveTo(1120, 560, 860, 720); ctx.stroke();
    ctx.restore();
    if (p1 > 0.9 && p2 > 0.9) {
      const q = sat(T, 190.3, 190.9);
      ctx.save(); ctx.globalAlpha = q * 0.55; ctx.fillStyle = P.ink;
      ctx.fillRect(700, 520, 640, 6); ctx.restore();
      text(ctx, '人', 960, 510, { size: 210, color: 'rgba(43,35,32,0.18)', align: 'center', weight: 800, fam: SERIF, alpha: q });
    }
    charSprite(ctx, CH, 'o10', 640, 980, 520, { t: T, ph: 4, a: p1 });
    charSprite(ctx, CH, 'f00', 1280, 980, 520, { t: T, ph: 5, a: p2, flip: true });
    text(ctx, '你一捺，我一撇。', 960, 900, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 190.2, 191) });
  });
});

const sLastPages = pagesScene(195.41, [pageDawn, pageSea, pageStreet]);

/* ---- 201.75 – 结尾 ---- */
const sEndCard = cream((ctx, T) => {
  sunnyRays(ctx, { cx: 960, cy: 480, n: 22, a: 0.6, t: T, a0: 'rgba(255,250,238,0.55)', a1: rgba(P.peach, 0.42) });
  sunDisc(ctx, 960, 480, 300, { color: '#F7C79A', ring: 'rgba(238,122,46,0.45)' });
  halftone(ctx, 0, 760, W, 320, { a: 0.06, color: P.orange });
  groundBand(ctx, 930, '#E8D5B6', { amp: 10 });
  if (T < 208.3) {
    displayText(ctx, '世界还在写', 960, 420, 168, { color: P.orange, edgeColor: P.cream, edgeW: 22, arc: 62, tilt: -0.04, });
    charSprite(ctx, CH, 'f00', 960, 1120, 470, { t: T, ph: 1, a: sat(T, 202.2, 202.8) * (1 - sat(T, 207.6, 208.3)) });
  } else {
    ctx.save(); ctx.globalAlpha = 1 - sat(T, 208.3, 209.3);
    displayText(ctx, '世界还在写', 960, 300, 86, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 16 });
    ctx.restore();
    displayText(ctx, '下一句', 960, 500, 130, { color: P.ink, edgeColor: P.cream, edgeW: 14, arc: 14, });
    if (T > 210.6) displayText(ctx, '你来', 960, 690, 160, { color: P.orangeD, edgeColor: P.cream, edgeW: 16, arc: 12, });
    charSprite(ctx, CH, 'f00', 1480, 1000, 440, { t: T, ph: 1, a: sat(T, 208.6, 209.4) });
    if (T > 212) {
      ctx.save(); ctx.globalAlpha = sat(T, 212, 213.4) * 0.95;
      charSprite(ctx, CH, 'k07', 380, 1010, 360, { t: T, ph: 2 });
      charSprite(ctx, CH, 'o10', 620, 1015, 360, { t: T, ph: 3 });
      ctx.restore();
    }
  }
  if (T > 204) confetti(ctx, T, { n: 34, a: 0.4 });
  text(ctx, 'MV渲染器 · AI娘角色主题曲 · 重绘版', 960, 1045, { size: 20, color: P.inkSoft, align: 'center', weight: 400, fam: SANS, ls: 3, alpha: sat(T, 213, 214.5) * 0.65 });
});

/* ============================ 镜头表 / 初始化 ============================ */
const CUTS = [
  [14.46, sSeaWrite], [17.98, sThreeDrops], [21.52, sSeaOfWords], [25.0, sShoes],
  [28.52, sNightLetter], [35.2, sEnter], [38.2, sFirstPage], [42.97, sNotes], [45.97, sCards],
  [49.5, sNoTomorrow], [52.9, sCloseBook], [57.05, sTitle1], [59.42, sEndlessPage],
  [62.86, sWalkOut], [66.02, sStreet], [70.88, sTitle2], [72.88, sButterflies], [76.48, sStarRoad],
  [79.95, sNextPages], [87.81, sSalty], [90.62, sSand], [94.28, sBridge], [97.66, sWhale],
  [101.1, sThreePens], [102.9, sCrooked], [105.5, sQuestions], [108.08, sWalkWrite],
  [111.38, sBlankNight], [118.83, sTitle3], [121.19, sTrioStreet], [132.44, sTitle4], [134.42, sButterflies2],
  [137.98, sStarRoad2], [141.4, sNextPages2], [146.65, sMemory], [150.18, sTomorrow], [152.9, sBlank],
  [156.55, sBlankFamiliar], [164.5, sFirstLine], [167.27, sWithYou], [173.05, sFinalChorus],
  [186.64, sTitle5], [188.72, sNape], [191.98, sStarRoad3], [195.41, sLastPages], [201.75, sEndCard],
];
const DARK = [[0, 14.46], [28.52, 38.2], [50.4, 52.9], [97.66, 101.1], [111.38, 118.83]];
const BRIGHT = [[57.05, 59.42], [118.83, 121.19], [132.44, 134.42], [173.05, 180], [201.75, 218.16]];

async function init() {
  await fontLoad();
  CH = await loadSprites('/mv/world/assets/chars/', ['f00', 'f01', 'f02', 'f03', 'f05', 'f10', 'f11', 'f13', 'f16', 'o10', 'o11', 'k07']);
  const TL = await (await fetch('/mv/world/analysis/timeline_full.json')).json();
  const LY = await (await fetch('/mv/world/analysis/lyrics_full.json')).json();
  LINES = LY.lines.map((L, i) => ({ ...L, s: L.t[0], e: i + 1 < LY.lines.length ? LY.lines[i + 1].t[0] : TL.duration }));
  LINES.beats = TL.beats;
  window.DUR = TL.duration - OFF;
  const g2 = mkCanvas(8, 8).getContext('2d');
  SUBS = buildSubs(g2, LY.lines, { size: 42 });
  const api = createSeek({ canvas, ss: SS, cuts: CUTS, dark: DARK, bright: BRIGHT, subs: SUBS, layers: L, offset: OFF });
  window.seek = api.seek;
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) {
    const au = new Audio('/mv/world/song/world.mp3');
    au.currentTime = Number(Q.get('t') || 0) + OFF;
    window.__mvOffset = OFF;
    if (window.mvPlayer) window.mvPlayer({ audio: au, offset: OFF, getSS: () => SS });
    else { au.addEventListener('playing', () => document.getElementById('start')?.classList.add('hide')); document.getElementById('c').addEventListener('click', () => au.paused ? au.play() : au.pause()); window.__mvAudio = au; window.__mvOutTime = () => Math.max(0, au.currentTime - OFF); }
  }
}
window.__ready = init();
