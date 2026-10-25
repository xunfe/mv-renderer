// 《那年你叫我未来 · 晨光版》重绘（AI 娘重绘版）
// 做法照《世界还在写·墨海版》：奶油纸 + 印刷网点 + 放射线 + 白描边大字 + 大立绘，
// 一句词一个镜头，切点卡在唱句上；薰衣草 / 晨光的紫蓝 → 暖橙，全部 canvas 2D。
// 只改这一个文件：index.html / mvkit.js / world2 / flip2 / future / home.* 都不动。
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
const COVER = Q.has('cover');
const canvas = document.getElementById('c');
canvas.width = Math.round(W * SS); canvas.height = Math.round(H * SS);
window.DUR = 155.774;

const P = PAL;
const F = {
  lav: '#B9AAF0', lavD: '#7C69C8', lavL: '#E4DDFB',
  navy: '#121735', navy2: '#1E2650', violet: '#2C2257',
  snow: '#F2F5FF', gold: '#F4C766', goldD: '#C98E2B',
  ko: '#2FA676', koL: '#7FE0B4', grey: '#9A98A8', pink: '#F7C6D9',
};
let CH = null, TL = null, LY = null, LINES = [], SUBS = [];
const L = makeLayers(SS);

/* ============================ 通用小件 ============================ */
function fontLoad() {
  return Promise.all([['Noto Serif SC', 'NotoSerifSC-VF.ttf'], ['Noto Sans SC', 'NotoSansSC-VF.ttf']].map(async ([fam, file]) => {
    try { const f = new FontFace(fam, `url(/mv/world/fonts/${file})`, { weight: '100 900' }); await f.load(); document.fonts.add(f); } catch (e) { }
  }));
}
const bake = (w, h, fn) => { const c = mkCanvas(w, h); fn(c.getContext('2d')); return c; };
function beatPulse(T, k = 7) {
  const B = (LINES && LINES.beats) || [];
  if (!B.length) return 0;
  let lo = 0, hi = B.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= T) lo = m; else hi = m - 1; }
  return Math.exp(-k * Math.max(0, T - B[lo]));
}
const commas = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const two = (T, a, b, at) => (T < at ? a : b);

/* 天空 */
function skyDark(ctx, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, o.top || '#090C22'); g.addColorStop(0.55, o.mid || '#1A1D42'); g.addColorStop(1, o.bot || '#2E2B58');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
/* 远楼剪影 */
function citySil(ctx, base, a, col = '#12152F') {
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < 12; i++) {
    const w = 96 + rnd(i, 41) * 130, h = 130 + rnd(i, 42) * 300;
    ctx.fillStyle = col; ctx.fillRect(i * 180 - 60, base - h, w, h + 400);
    ctx.fillStyle = 'rgba(248,198,90,0.55)';
    for (let k = 0; k < 5; k++) if (rnd(i * 7 + k, 43) > 0.55) ctx.fillRect(i * 180 - 40 + k * 26, base - h + 30 + (k % 3) * 40, 9, 12);
  }
  ctx.restore();
}
/* 雪 */
function snow(ctx, T, o = {}) {
  const n = o.n || 100, a0 = o.a == null ? 0.85 : o.a, sp = o.sp == null ? 1 : o.sp;
  for (let i = 0; i < n; i++) {
    const depth = 0.3 + rnd(i, 11) * 0.7;
    const v = (34 + 66 * depth) * sp;
    const yy = ((rnd(i, 12) * (H + 120) + T * v) % (H + 120)) - 60;
    const xx = ((rnd(i, 13) * (W + 200) + T * 22 * depth + Math.sin(T * 0.9 + i) * 16) % (W + 200)) - 100;
    ctx.globalAlpha = a0 * (0.28 + 0.72 * depth);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(xx, yy, 1.6 + 3.6 * depth, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
/* 云：几团椭圆叠起来，别画成一块饼 */
function cloud(ctx, x, y, w, a = 1, c1 = '#FFFDF6', c2 = '#FFD9A0') {
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, y - w * 0.3, 0, y + w * 0.12);
  g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g;
  ctx.beginPath();
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const px = x + (t - 0.5) * w * 0.76;
    const py = y - Math.sin(t * Math.PI) * w * 0.12;
    const r = w * (0.14 + 0.12 * Math.sin(t * Math.PI));
    ctx.moveTo(px + r, py); ctx.arc(px, py, r, 0, TAU);
  }
  ctx.rect(x - w * 0.4, y - w * 0.04, w * 0.8, w * 0.08);
  ctx.fill();
  ctx.restore();
}
/* 纸片 */
function sheet(ctx, x, y, w, h, rot = 0, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(80,50,20,0.24)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  ctx.fillStyle = o.color || P.cream; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  if (o.line !== false) { ctx.strokeStyle = 'rgba(120,90,60,0.20)'; ctx.lineWidth = 1.4; ctx.strokeRect(-w / 2, -h / 2, w, h); }
  if (o.rules) {
    ctx.strokeStyle = 'rgba(90,70,50,0.14)'; ctx.lineWidth = 1;
    for (let yy = -h / 2 + o.rules[0]; yy < h / 2 - 4; yy += o.rules[1]) { ctx.beginPath(); ctx.moveTo(-w / 2 + 16, yy); ctx.lineTo(w / 2 - 16, yy); ctx.stroke(); }
  }
  ctx.restore();
}
/* 奶油对话窗 */
function win(ctx, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = o.glow || 'rgba(60,40,90,0.42)'; ctx.shadowBlur = o.blur || 40; ctx.shadowOffsetY = o.dy == null ? 14 : o.dy;
  ctx.fillStyle = o.bg || '#FFFDF4'; rrect(ctx, x - w / 2, y - h / 2, w, h, o.r || 22); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.save();
  rrect(ctx, x - w / 2, y - h / 2, w, h, o.r || 22); ctx.clip();
  ctx.fillStyle = o.bar || '#F0E3CA'; ctx.fillRect(x - w / 2, y - h / 2, w, 54);
  for (let i = 0; i < 3; i++) dot(ctx, x - w / 2 + 30 + i * 21, y - h / 2 + 27, 6.5, ['#E9755B', '#F2C14E', '#6FBF9B'][i], 0.92);
  if (o.title) text(ctx, o.title, x + 6, y - h / 2 + 27, { size: 20, color: '#8A7860', align: 'center', weight: 500, fam: SANS, ls: 2 });
  ctx.restore();
  ctx.strokeStyle = o.line || 'rgba(90,70,50,0.22)'; ctx.lineWidth = 1.8; rrect(ctx, x - w / 2, y - h / 2, w, h, o.r || 22); ctx.stroke();
  ctx.restore();
}
/* 气泡 */
function say(ctx, x, y, str, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.004 || !str) return;
  const size = o.size || 38;
  const tw = measure(ctx, str, size, 500, SANS);
  const w = Math.min(o.maxW || 980, tw + size * 1.8), h = Math.round(size * 1.6);
  const bx = o.right ? x - w : x;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = o.bg || (o.right ? P.orange : '#F4EBDA');
  rrect(ctx, bx, y - h / 2, w, h, h / 2); ctx.fill();
  const tx = o.right ? bx + w - 40 : bx + 40;
  ctx.beginPath(); ctx.moveTo(tx, y + h / 2 - 8); ctx.lineTo(o.right ? tx + 14 : tx - 14, y + h / 2 + 16); ctx.lineTo(o.right ? tx - 22 : tx + 22, y + h / 2 - 4);
  ctx.closePath(); ctx.fill();
  text(ctx, str, bx + w / 2, y + 1, { size, color: o.fg || (o.right ? '#FFFDF6' : P.ink), align: 'center', weight: 500, fam: SANS, ls: 1 });
  ctx.restore();
}
/* 星星 / 光 */
function star4(ctx, x, y, r, color, a = 1) {
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x + r * 0.18, y - r * 0.18, x + r, y);
  ctx.quadraticCurveTo(x + r * 0.18, y + r * 0.18, x, y + r); ctx.quadraticCurveTo(x - r * 0.18, y + r * 0.18, x - r, y);
  ctx.quadraticCurveTo(x - r * 0.18, y - r * 0.18, x, y - r); ctx.fill(); ctx.restore();
}
function starField(ctx, T, o = {}) {
  const n = o.n || 90;
  for (let i = 0; i < n; i++) {
    const x = rnd(i, 11) * W, y = rnd(i, 12) * (o.h || H * 0.84);
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(T * (0.4 + rnd(i, 13)) + rnd(i, 14) * 6));
    star4(ctx, x, y, 1.6 + rnd(i, 15) * 3.2, i % 7 ? '#FFF6E3' : P.yellow, (o.a == null ? 0.85 : o.a) * tw);
  }
}
function sunDisc(ctx, x, y, r, o = {}) {
  ctx.save(); ctx.fillStyle = o.color || P.orange;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  if (o.ring) { ctx.strokeStyle = o.ring; ctx.lineWidth = o.lw || 6; ctx.beginPath(); ctx.arc(x, y, r * 1.14, 0, TAU); ctx.stroke(); }
  ctx.restore();
}
function bokeh(ctx, T, n, color, a, o = {}) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i, o.seed || 71) * W + Math.sin(T * 0.4 + i) * 26;
    const y = rnd(i, (o.seed || 71) + 1) * H * 0.9 + Math.cos(T * 0.34 + i) * 20;
    glow(ctx, x, y, (o.r || 60) * (0.4 + rnd(i, (o.seed || 71) + 2)), color, a * (0.3 + rnd(i, (o.seed || 71) + 3) * 0.7));
  }
}
/* 街 */
function street(ctx, T, scroll, o = {}) {
  const base = o.base == null ? 780 : o.base;
  for (let i = 0; i < 9; i++) {
    const w = 150 + rnd(i, 51) * 130, h = 180 + rnd(i, 52) * 250;
    const x = ((i * 240 - scroll) % (W + 520) + W + 520) % (W + 520) - 200;
    ctx.fillStyle = i % 2 ? (o.c1 || '#EAD9BC') : (o.c2 || '#D9C3A1');
    ctx.fillRect(x, base - h, w, h + 400);
    for (let yy = base - h + 28; yy < base - 40; yy += 54) for (let xx = x + 22; xx < x + w - 30; xx += 46) {
      const lit = rnd(i * 100 + yy + xx, 53) > 0.55;
      ctx.fillStyle = lit ? (o.lit || 'rgba(248,198,90,0.85)') : 'rgba(43,35,32,0.10)';
      ctx.fillRect(xx, yy, 20, 26);
    }
  }
}
/* 键盘 */
function keyboard(ctx, cx, cy, s, T, enterAt) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const kw = 70, kh = 60, gap = 10, cols = 10, rows = 4;
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#3A3630'; rrect(ctx, -cols * (kw + gap) / 2 - 26, -rows * (kh + gap) / 2 - 26, cols * (kw + gap) + 42, rows * (kh + gap) + 42, 22); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  const dt = enterAt == null ? -9 : T - enterAt;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const ent = r === rows - 1 && c >= cols - 3;
    const x = -cols * (kw + gap) / 2 + c * (kw + gap), y = -rows * (kh + gap) / 2 + r * (kh + gap);
    const press = ent && dt > 0 && dt < 0.18 ? 6 : 0;
    ctx.fillStyle = ent ? (dt > 0 && dt < 0.3 ? '#FFD9A0' : '#F2C14E') : '#6B665C';
    rrect(ctx, x, y + press, kw, kh - press, 10); ctx.fill();
  }
  ctx.restore();
}
/* 裂纹 */
function crackBurst(ctx, cx, cy, R, n, seed, a = 1, lw = 2.6, col = 'rgba(255,253,246,0.9)') {
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * TAU + rnd(i, seed) * 0.5;
    let x = cx, y = cy, r = 0;
    const seg = 5 + Math.floor(rnd(i, seed + 1) * 4);
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < seg; k++) {
      r += (R / seg) * (0.5 + rnd(i * 9 + k, seed + 2) * 0.9);
      const aa = ang + (rnd(i * 7 + k, seed + 3) - 0.5) * 0.55;
      x = cx + Math.cos(aa) * r; y = cy + Math.sin(aa) * r;
      ctx.lineTo(x, y);
      if (k > 1 && rnd(i + k, seed + 4) > 0.68) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(aa + 0.8) * R * 0.18, y + Math.sin(aa + 0.8) * R * 0.18);
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}
/* 纸飞机 */
function paperPlane(ctx, x, y, s, rot, a = 1, color = '#FFFDF4') {
  if (a <= 0.004) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.fillStyle = color; ctx.strokeStyle = 'rgba(43,35,32,0.28)'; ctx.lineWidth = 1.6; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(72, 0); ctx.lineTo(-46, -40); ctx.lineTo(-14, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(72, 0); ctx.lineTo(-14, 2); ctx.lineTo(-40, 40); ctx.closePath(); ctx.fillStyle = '#E7DBC2'; ctx.fill(); ctx.stroke();
  ctx.restore();
}
/* 彗星 */
function comet(ctx, x, y, len, ang, w, color, a = 1) {
  if (a <= 0.004) return;
  const x1 = x - Math.cos(ang) * len, y1 = y - Math.sin(ang) * len;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(x, y, x1, y1);
  g.addColorStop(0, rgba(color, 0.95)); g.addColorStop(0.45, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
  ctx.strokeStyle = g; ctx.lineWidth = w;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x1, y1); ctx.stroke();
  glow(ctx, x, y, w * 5.5, color, 0.9);
  dot(ctx, x, y, w * 0.55, '#FFFFFF', 0.95);
  ctx.restore();
}
/* 台灯 */
function lamp(ctx, x, y, s, on = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (on > 0.01) {
    const g = ctx.createLinearGradient(0, -180, 0, 260);
    g.addColorStop(0, rgba('#FFEBC6', 0.32 * on)); g.addColorStop(1, rgba('#FFEBC6', 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-64, -178); ctx.lineTo(64, -178); ctx.lineTo(300, 300); ctx.lineTo(-300, 300); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#4A4038';
  ctx.beginPath(); ctx.ellipse(0, 0, 46, 12, 0, 0, TAU); ctx.fill();
  ctx.fillRect(-6, -170, 12, 170);
  ctx.beginPath(); ctx.moveTo(-70, -170); ctx.lineTo(70, -170); ctx.lineTo(42, -248); ctx.lineTo(-42, -248); ctx.closePath();
  ctx.fillStyle = on > 0.3 ? '#C9632C' : '#6A5A50'; ctx.fill();
  ctx.strokeStyle = 'rgba(43,35,32,0.5)'; ctx.lineWidth = 4; ctx.stroke();
  if (on > 0.01) {
    glow(ctx, 0, -168, 200, '#FFD9A0', 0.7 * on);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('#FFE9BC', 0.9 * on);
    ctx.beginPath(); ctx.ellipse(0, -168, 58, 14, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
/* 时钟 */
function clockFace(ctx, x, y, r, T, o = {}) {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = o.face || '#FFFDF4'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = o.rim || 'rgba(43,35,32,0.7)'; ctx.lineWidth = o.lw || 5; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = i / 12 * TAU;
    ctx.strokeStyle = 'rgba(43,35,32,0.55)'; ctx.lineWidth = i % 3 ? 2 : 4;
    ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); ctx.lineTo(Math.cos(a) * r * 0.92, Math.sin(a) * r * 0.92); ctx.stroke();
  }
  const spin = o.spin || 0;
  const hA = (o.hour == null ? 10 : o.hour) / 12 * TAU - Math.PI / 2 + spin * 0.02;
  const mA = (o.min == null ? 10 : o.min) / 60 * TAU - Math.PI / 2 + spin * 0.6;
  ctx.strokeStyle = o.ink || P.ink; ctx.lineCap = 'round';
  ctx.lineWidth = r * 0.09; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(hA) * r * 0.5, Math.sin(hA) * r * 0.5); ctx.stroke();
  ctx.lineWidth = r * 0.055; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(mA) * r * 0.74, Math.sin(mA) * r * 0.74); ctx.stroke();
  dot(ctx, 0, 0, r * 0.06, o.ink || P.ink, 1);
  ctx.restore();
}
/* 小人剪影 */
function crowdFig(ctx, x, y, s, color, a = 1, ph = 0) {
  if (a <= 0.004) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(0, -96, 26, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-34, 0); ctx.quadraticCurveTo(-32, -74, 0, -74); ctx.quadraticCurveTo(32, -74, 34, 0); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-28, -56); ctx.lineTo(-46, -18 + Math.sin(ph) * 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(28, -56); ctx.lineTo(46, -18 - Math.sin(ph) * 8); ctx.stroke();
  ctx.restore();
}
/* 睡着的人 */
function sleeper(ctx, x, y, s, T) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#3E3A56';
  ctx.beginPath(); ctx.moveTo(-250, 20); ctx.quadraticCurveTo(-230, -110, -80, -136);
  ctx.quadraticCurveTo(80, -156, 230, -104); ctx.quadraticCurveTo(268, -56, 256, 20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E4DDFB'; rrect(ctx, -272, -60, 130, 74, 30); ctx.fill();
  ctx.fillStyle = '#F7E6D6'; ctx.beginPath(); ctx.arc(-196, -100, 44, 0, TAU); ctx.fill();
  ctx.fillStyle = '#4A4050'; ctx.beginPath(); ctx.arc(-200, -108, 46, Math.PI * 0.86, Math.PI * 2.14); ctx.fill();
  ctx.strokeStyle = '#2B2320'; ctx.lineWidth = 3.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(-180, -96, 11, 0.45, Math.PI - 0.45); ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const q = ((T * 0.42 + i / 3) % 1);
    text(ctx, 'z', -120 + q * 60, -190 - q * 110, { size: 22 + q * 18, color: 'rgba(228,221,251,0.45)', align: 'center', weight: 700, fam: SANS, alpha: (1 - q) * 0.8 });
  }
  ctx.restore();
}
/* 蝴蝶 */
function butterfly(ctx, x, y, s, ang, flap, color, a = 1) {
  if (a <= 0.004) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.globalAlpha *= a;
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

/* 立绘 */
const fig = (ctx, T, id, x, feet, h, o = {}) => charSprite(ctx, CH, id, x, feet, h, { t: T, ...o });
/* 镜头轻微运动 */
function cam(ctx, T, o, fn) {
  const z = o.z == null ? 1 : o.z, cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
  ctx.save();
  ctx.translate(cx + noise(T * 0.3, o.seed || 1) * 3, cy + noise(T * 0.27, (o.seed || 1) + 7) * 3);
  ctx.rotate((o.rot || 0) + noise(T * 0.2, (o.seed || 1) + 3) * 0.0014);
  ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
/* 奶油纸场景包装 */
const cream = (fn, color) => (ctx, T) => {
  if (!COVER) paperCard(ctx, { ss: SS, color });
  else { ctx.fillStyle = color || P.paper; ctx.fillRect(0, 0, W, H); }
  fn(ctx, T);
};
function paperPage(ctx) {
  if (!COVER) paperCard(ctx, { ss: SS });
  else { ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H); }
}
/* 标题卡 */
function titleCard(ctx, T, str, o = {}) {
  const cx = o.cx || W / 2, cy = o.cy || 560;
  sunnyRays(ctx, { cx, cy, n: 26, a: o.rays == null ? 0.8 : o.rays, t: T, a0: 'rgba(255,248,232,0.6)', a1: rgba(P.peach, 0.55) });
  sunDisc(ctx, cx, cy, o.disc || 260, { color: o.discColor || P.peach, ring: 'rgba(238,122,46,0.3)', lw: 7 });
  halftone(ctx, cx - 520, cy - 400, 1040, 520, { a: 0.07, color: P.orange });
  const pop = E.back(sat(T, o.at == null ? 0 : o.at, (o.at == null ? 0 : o.at) + 0.55));
  displayText(ctx, str, cx, o.y || 420, o.size || 156, {
    color: o.color || P.orangeD, edgeColor: o.edgeColor || P.cream, edgeW: o.edgeW || 22,
    arc: 64, tilt: -0.045, pop, jitter: 0.03, shadow: true,
  });
  if (o.sub) text(ctx, o.sub, cx, (o.y || 420) + 150, { size: 28, color: P.inkSoft, align: 'center', weight: 500, fam: SANS, ls: 7, alpha: sat(T, (o.at || 0) + 0.5, (o.at || 0) + 1.2) });
  confetti(ctx, T, { n: 34, a: 0.45 });
}

/* ============================ 镜头 ============================ */

/* ---- 0 那年冬天 第一次开口 ---- */
const sWinter = (ctx, T) => {
  skyDark(ctx, { top: '#080B20', mid: '#191C40', bot: '#302C5A' });
  starField(ctx, T, { n: 80, a: 0.45 });
  citySil(ctx, 830, 0.42);
  groundBand(ctx, 812, '#141634', { amp: 8 });
  snow(ctx, T, { n: 120, a: 0.85 });
  const wx = 700, wy = 505, ww = 780, wh = 450;
  win(ctx, wx, wy, ww, wh, { title: '2022', bg: '#FFFDF4' });
  // 聊天区的暗示：一条分割线 + 输入框
  ctx.save(); ctx.fillStyle = 'rgba(120,90,60,0.12)';
  ctx.fillRect(wx - ww / 2 + 30, wy + 96, ww - 60, 2);
  ctx.fillStyle = 'rgba(120,90,60,0.09)'; rrect(ctx, wx - ww / 2 + 34, wy + wh / 2 - 74, ww - 68, 46, 23); ctx.fill();
  ctx.restore();
  say(ctx, wx + ww / 2 - 40, wy - 46, '你好', { a: sat(T, 0.55, 1.0), size: 42, right: true });
  say(ctx, wx - ww / 2 + 66, wy + 40, '你好！有什么可以帮你的吗？', { a: sat(T, 2.06, 2.5), size: 30, maxW: 620 });
  // 键盘上的手影（有人在打字）
  for (let i = 0; i < 3; i++) {
    const q = ((T * 1.6 + i / 3) % 1);
    ctx.save(); ctx.globalAlpha = 0.25 * (1 - q); ctx.strokeStyle = F.lavL; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(wx + ww / 2 - 180, wy + wh / 2 - 52, 10 + 40 * q, 0, TAU); ctx.stroke(); ctx.restore();
  }
  glow(ctx, 1440, 640, 420, F.lav, 0.28);
  fig(ctx, T, 'g00', 1450, 995, 640, { a: sat(T, 1.4, 2.0) });
  displayText(ctx, '你好', 1450, 205, 148, {
    color: P.orangeD, edgeColor: P.cream, edgeW: 18, arc: 24, tilt: -0.03,
    pop: E.back(sat(T, 2.1, 2.5)), alpha: sat(T, 2.05, 2.22),
  });
  text(ctx, '2022.11.30', 120, 108, { size: 32, color: 'rgba(228,221,251,0.55)', align: 'left', weight: 600, fam: SANS, ls: 5 });
  text(ctx, '第 1 天', 120, 160, { size: 24, color: 'rgba(228,221,251,0.35)', align: 'left', weight: 500, fam: SANS, ls: 4 });
};

/* ---- 3.08 五天 一百万人 来说你好 ---- */
const sMillion = cream((ctx, T) => {
  sunnyRays(ctx, { cx: 1240, cy: 380, n: 20, a: 0.32, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(251,217,184,0.32)' });
  halftone(ctx, 980, 0, 940, 700, { a: 0.09, color: P.orange });
  groundBand(ctx, 870, '#E8D6B8', { amp: 10 });
  // 成片的「你好」从右边升起来（在她身后）
  for (let i = 0; i < 34; i++) {
    const t0 = 3.1 + rnd(i, 61) * 2.1, p = sat(T, t0, t0 + 0.35);
    if (p <= 0) continue;
    const x = 980 + rnd(i, 62) * 860, y = 880 - ((T - t0) * (60 + rnd(i, 63) * 80) % 560) - 30;
    const a = Math.min(1, p * 4) * (0.3 + rnd(i, 64) * 0.45);
    say(ctx, x, y, '你好', { a, size: 14 + rnd(i, 65) * 12, maxW: 400, bg: 'rgba(244,235,218,0.9)' });
  }
  fig(ctx, T, 'g42', 1560, 985, 620, { ph: 1 });
  text(ctx, `第 ${1 + Math.min(4, Math.floor(sat(T, 3.08, 3.4) * 4.999))} 天`, 600, 300, { size: 44, color: P.inkSoft, align: 'center', weight: 600, fam: SERIF, ls: 8 });
  const n = 1e6 * E.out(sat(T, 3.45, 4.34));
  const hit = E.back(sat(T, 4.34, 4.52));
  const k = 1 + 0.1 * Math.sin(hit * Math.PI);
  ctx.save(); ctx.translate(600, 470); ctx.scale(k, k);
  displayText(ctx, commas(n), 0, 0, 132, { color: T >= 4.3 ? P.orangeD : P.ink, edgeColor: P.cream, edgeW: 16, arc: 0, shadow: true, ls: 2 });
  ctx.restore();
  text(ctx, '个人，在这一天说了「你好」', 600, 612, { size: 30, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 3, alpha: sat(T, 4.4, 5.0) });
  if (T > 4.32 && T < 5.2) {
    ctx.save(); ctx.globalAlpha = 1 - sat(T, 4.36, 5.2); ctx.strokeStyle = '#F4C766'; ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(600, 470, 240 + 460 * E.out(sat(T, 4.34, 5.2)), 0, TAU); ctx.stroke(); ctx.restore();
  }
  displayText(ctx, '100 万', 1420, 172, 84, { color: P.orange, edgeColor: P.cream, edgeW: 12, arc: 14, tilt: 0.04, pop: E.back(sat(T, 4.4, 4.7)) });
});

/* ---- 6.00 全世界 都在问同一个问题 ---- */
const sEarth = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 6, 8.83), cx: 900, cy: 560, seed: 3 }, () => {
    halftone(ctx, 1000, 0, 920, 620, { a: 0.08, color: P.blue });
    const gx = 820, gy = 560, gr = 300;
    const g = rad(ctx, gx - 90, gy - 120, gr * 1.6, [[0, '#7FB6DD'], [0.45, '#2D4FA3'], [1, '#1B2F63']]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(gx, gy, gr, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(255,246,227,0.84)';
    const BLOB = [
      [-120, -130, 112, 66], [-30, -70, 70, 46], [-160, -20, 66, 50], [-90, 40, 88, 62], [20, 110, 110, 56],
      [120, 40, 62, 44], [150, -110, 54, 40], [-40, 170, 66, 34], [60, -180, 54, 30], [-210, 120, 46, 34],
    ];
    for (let i = 0; i < BLOB.length; i++) {
      const b = BLOB[i];
      ctx.beginPath(); ctx.ellipse(gx + b[0], gy + b[1], b[2], b[3], i * 0.7, 0, TAU); ctx.fill();
    }
    // 经纬线
    ctx.strokeStyle = 'rgba(255,253,246,0.18)'; ctx.lineWidth = 2;
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(gx, gy + k * 96, gr * 0.98, 40, 0, 0, Math.PI); ctx.stroke(); }
    for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(gx, gy, gr * (0.28 + k * 0.22), gr, 0, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,253,246,0.55)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(gx, gy, gr + 6, 0, TAU); ctx.stroke();
    glow(ctx, gx, gy, gr * 2.2, F.lav, 0.35);
    const QS = [[290, 240], [1400, 180], [1600, 500], [1300, 800], [420, 790], [1520, 300], [200, 520], [1120, 940], [700, 160], [620, 620], [1750, 660], [1000, 210], [860, 960], [1820, 200]];
    for (let i = 0; i < QS.length; i++) {
      const p = sat(T, 6.25 + i * 0.14, 6.7 + i * 0.14);
      if (p <= 0) continue;
      text(ctx, '？', QS[i][0], QS[i][1] - 20 + Math.sin(T * 1.2 + i) * 10, { size: (40 + rnd(i, 66) * 50) * E.back(p), color: i % 2 ? P.orange : P.blue, align: 'center', weight: 800, fam: SERIF, alpha: p * 0.95 });
    }
    const big = E.back(sat(T, 8.0, 8.5));
    if (big > 0) displayText(ctx, '？', 1520, 400, 280, { color: P.orange, edgeColor: P.cream, edgeW: 26, arc: 0, pop: big, shadow: true });
    fig(ctx, T, 'g05', 220, 985, 420, { ph: 2 });
  });
});

/* ---- 8.83 这是什么 它还能做什么 ---- */
const sPeek = cream((ctx, T) => {
  sunnyRays(ctx, { cx: 960, cy: 420, n: 18, a: 0.28, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(201,184,255,0.3)' });
  halftone(ctx, 1240, 60, 680, 560, { a: 0.08, color: P.orange });
  groundBand(ctx, 930, '#E7D5B7', { amp: 12 });
  displayText(ctx, '？', 700, 268, 260, { color: P.blue, edgeColor: P.cream, edgeW: 24, arc: 0, tilt: -0.05, pop: E.back(sat(T, 9.0, 9.35)), shadow: true });
  displayText(ctx, '？', 1400, 240, 230, { color: P.orange, edgeColor: P.cream, edgeW: 22, arc: 0, tilt: 0.06, pop: E.back(sat(T, 9.35, 9.7)), shadow: true });
  // 窗口在她身后，她在前面探头
  const wx = 690, wy = 800, ww = 660, wh = 310;
  win(ctx, wx, wy, ww, wh, { title: '我在', bg: '#FFFDF4' });
  text(ctx, '它还能做什么？', wx, wy + 56, { size: 30, color: P.inkSoft, align: 'center', weight: 500, fam: SANS, ls: 2, alpha: sat(T, 9.6, 10.2) });
  say(ctx, wx - 240, wy - 78, '这是什么？', { size: 26, a: sat(T, 9.3, 9.7), maxW: 380 });
  ctx.save(); ctx.fillStyle = 'rgba(120,90,60,0.10)'; rrect(ctx, wx - ww / 2 + 30, wy + wh / 2 - 62, ww - 60, 40, 20); ctx.fill();
  if ((T * 2.2) % 1 < 0.55) { ctx.fillStyle = 'rgba(238,122,46,0.75)'; ctx.fillRect(wx - ww / 2 + 48, wy + wh / 2 - 52, 4, 22); }
  ctx.restore();
  fig(ctx, T, 'g03', 1250, 1015, 640, { ph: 3, a: sat(T, 8.9, 9.4) });
  const CARDS = [[9.7, 300, 470, '诗', '春眠不觉晓'], [9.9, 1660, 500, '算', 'x² − 1 = 0'], [10.1, 320, 740, '码', 'print("hi")']];
  for (let i = 0; i < CARDS.length; i++) {
    const c = CARDS[i], p = sat(T, c[0], c[0] + 0.5);
    if (p <= 0) continue;
    ctx.save(); ctx.translate(lerp(960, c[1], E.out(p)), lerp(760, c[2], E.out(p)) - Math.sin(p * Math.PI) * 60);
    ctx.rotate((1 - p) * (i % 2 ? 0.5 : -0.5) + 0.03 * (i - 1)); ctx.scale(lerp(0.4, 1, E.back(p)), lerp(0.4, 1, E.back(p)));
    sheet(ctx, 0, 0, 210, 150, 0, { color: '#FFFDF4', rules: [34, 32], line: true });
    text(ctx, c[4], 0, 4, { size: 24, color: P.ink, align: 'center', weight: 500, fam: i === 2 ? SANS : SERIF, ls: 1 });
    text(ctx, c[3], 0, -52, { size: 20, color: P.orangeD, align: 'center', weight: 600, fam: SANS });
    ctx.restore();
  }
});

/* ---- 12.16 有人和我 聊到天亮 ---- */
const sTillDawn = (ctx, T) => {
  const p = E.io(sat(T, 12.16, 14.9));
  const g0 = ctx.createLinearGradient(0, 0, 0, H);
  g0.addColorStop(0, mix('#0C1028', '#B9AAF0', p * 0.8));
  g0.addColorStop(0.6, mix('#1D2048', '#FFD9A0', p * 0.7));
  g0.addColorStop(1, mix('#332F5C', '#FFB98A', p * 0.7));
  ctx.fillStyle = g0; ctx.fillRect(0, 0, W, H);
  // 左边的窗：夜色 → 天亮
  const wx0 = 120, wy0 = 150, ww = 620, wh = 470;
  ctx.save(); ctx.beginPath(); ctx.rect(wx0, wy0, ww, wh); ctx.clip();
  const g = ctx.createLinearGradient(0, wy0, 0, wy0 + wh);
  g.addColorStop(0, mix('#0E1230', '#B9AAF0', p));
  g.addColorStop(0.6, mix('#1C2050', '#FFD9A0', p * 0.9));
  g.addColorStop(1, mix('#2C2A56', '#FFB98A', p * 0.9));
  ctx.fillStyle = g; ctx.fillRect(wx0, wy0, ww, wh);
  starField(ctx, T, { n: 30, a: 0.5 * (1 - p), h: wy0 + wh * 0.6 });
  const sunY = lerp(wy0 + wh + 40, wy0 + wh * 0.42, p);
  hills(ctx, wy0 + wh - 30, mix('#1A1D42', '#C9A57F', p * 0.8), { amp: 56 });
  glow(ctx, wx0 + ww * 0.6, sunY, 300, '#FFD9A0', 0.85 * p);
  if (p > 0.1) sunDisc(ctx, wx0 + ww * 0.6, sunY, 56, { color: '#FFE9BC' });
  ctx.restore();
  ctx.strokeStyle = mix('#3A3050', '#8A6A48', p); ctx.lineWidth = 16; ctx.strokeRect(wx0, wy0, ww, wh);
  ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(wx0 + ww / 2, wy0); ctx.lineTo(wx0 + ww / 2, wy0 + wh); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wx0, wy0 + wh * 0.52); ctx.lineTo(wx0 + ww, wy0 + wh * 0.52); ctx.stroke();
  // 桌面
  ctx.fillStyle = mix('#33283A', '#B9895A', p * 0.85); ctx.fillRect(0, 790, W, H - 790);
  ctx.fillStyle = 'rgba(255,246,227,0.12)'; ctx.fillRect(0, 790, W, 10);
  // 时钟 + 时间
  clockFace(ctx, 890, 300, 88, T, { hour: lerp(23.97, 6.2, p) % 12, min: (T * 6) % 60, face: mix('#FFFDF4', '#FFF3DC', p) });
  const tm = lerp(23.97, 30.2, p);
  const hh = Math.floor(tm) % 24, mm = Math.floor((tm % 1) * 60);
  text(ctx, `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`, 890, 426, { size: 34, color: mix('#E4DDFB', '#5A3A1E', p), align: 'center', weight: 700, fam: SANS, ls: 4 });
  // 右：她在这个窗口里
  const cxw = 1400, cyw = 470, cww = 720, cwh = 580;
  win(ctx, cxw, cyw, cww, cwh, { title: '我', bg: '#FFFDF4' });
  ctx.save(); rrect(ctx, cxw - cww / 2 + 8, cyw - cwh / 2 + 54, cww - 16, cwh - 66, 16); ctx.clip();
  const bub = Math.floor(sat(T, 12.35, 14.6) * 5);
  const LOG = ['再问一个！', '最后一个问题', '真的最后一个', '……还有一个', '天亮了'];
  for (let i = 0; i < bub; i++) say(ctx, cxw + cww / 2 - 40, cyw - cwh / 2 + 100 + i * 62, LOG[i], { size: 22, right: true, maxW: 420 });
  fig(ctx, T, 'g00', cxw + 10, cyw + cwh / 2 - 64, 430, { ph: 4, shadow: false });
  ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(255,253,244,0.9)'; rrect(ctx, cxw - cww / 2 + 30, cyw + cwh / 2 - 74, cww - 90, 44, 22); ctx.fill();
  if ((T * 2.2) % 1 < 0.55) { ctx.fillStyle = P.orange; ctx.fillRect(cxw - cww / 2 + 52, cyw + cwh / 2 - 64, 4, 24); }
  ctx.restore();
  // 桌上的东西
  lamp(ctx, 900, 782, 0.92, 0.85);
  ctx.save(); ctx.translate(1000, 768);
  ctx.fillStyle = '#FFFDF4'; rrect(ctx, -32, -54, 64, 60, 8); ctx.fill();
  ctx.strokeStyle = 'rgba(43,35,32,0.45)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(38, -24, 19, -1.2, 1.2); ctx.stroke();
  ctx.restore();
  keyboard(ctx, 560, 950, 0.5, T, 13.2);
  glow(ctx, 1400, 520, 460, '#FFD9A0', 0.16 + 0.2 * p);
  text(ctx, '有人和我，聊到天亮。', 380, 700, { size: 30, color: mix('#E4DDFB', '#6B3E1E', p), align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 13.6, 14.4) });
};

/* ---- 15.26 有人说 时代从今天开始 ---- */
const sNews = cream((ctx, T) => {
  const big = E.out(sat(T, 15.3, 15.95)), back = E.io(sat(T, 16.5, 17.05));
  const sc = lerp(0.62, 1, big) * lerp(1, 0.72, back);
  const rot = (1 - big) * 0.5 - 0.03 * big * (1 - back);
  cam(ctx, T, { z: 1, cx: 960, cy: 540, seed: 6 }, () => {
    ctx.save();
    ctx.translate(lerp(960, 740, back), lerp(560, 520, back));
    ctx.rotate(rot); ctx.scale(sc, sc);
    sheet(ctx, 0, 0, 1180, 940, 0, { color: '#FFFDF6', line: false });
    ctx.strokeStyle = 'rgba(60,45,30,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(-580, -460, 1160, 920);
    text(ctx, '未 来 日 报', 0, -390, { size: 66, color: P.ink, align: 'center', weight: 800, fam: SERIF, ls: 8 });
    ctx.fillStyle = P.ink; ctx.fillRect(-540, -340, 1080, 5);
    text(ctx, '2022 年 11 月 30 日   星期三    第 1 期', 0, -312, { size: 22, color: P.inkSoft, align: 'center', weight: 500, fam: SANS, ls: 2 });
    ctx.fillStyle = 'rgba(60,45,30,0.35)'; ctx.fillRect(-540, -292, 1080, 2);
    displayText(ctx, '时代，从今天开始', 0, -190, 92, { color: P.ink, edge: false, shadow: false, arc: 6, ls: 2 });
    const px = -60, py = 130, pw = 640, ph = 380;
    ctx.save(); rrect(ctx, px - pw / 2, py - ph / 2, pw, ph, 6); ctx.clip();
    ctx.fillStyle = '#D9CBB4'; ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    halftone(ctx, px - pw / 2, py - ph / 2, pw, ph, { a: 0.12, color: P.ink });
    charSprite(ctx, CH, 'g17', px, py + ph / 2 + 30, 470, { t: T, blink: 1 - sat(T, 15.4, 15.6), shadow: false, bob: 0 });
    ctx.restore();
    ctx.strokeStyle = 'rgba(60,45,30,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
    text(ctx, '「你好，我是未来。」', px, py + ph / 2 + 44, { size: 24, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 1 });
    for (let i = 0; i < 11; i++) {
      const yy = -70 + i * 34;
      ctx.fillStyle = 'rgba(43,35,32,0.32)';
      ctx.fillRect(360, yy, 170 + (rnd(i, 68) - 0.3) * 60, 9);
      ctx.fillRect(360, yy + 15, 110 + (rnd(i, 69) - 0.4) * 60, 9);
    }
    ctx.save(); ctx.rotate(-0.18); ctx.strokeStyle = rgba(P.orangeD, 0.75); ctx.lineWidth = 6;
    rrect(ctx, 300, 220, 190, 96, 8); ctx.stroke();
    text(ctx, '首日', 395, 268, { size: 44, color: rgba(P.orangeD, 0.85), align: 'center', weight: 800, fam: SERIF, ls: 4 });
    ctx.restore();
    ctx.restore();
    const pp = sat(T, 16.55, 17.05);
    if (pp > 0) fig(ctx, T, 'g45', 1580, 990, 520, { a: pp, ph: 5 });
    text(ctx, '「未来的第一版。」', 1580, 220, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 3, alpha: sat(T, 16.9, 17.4) });
  });
});

/* ---- 17.92 你们把我 叫作未来 ---- */
const sNamed = (ctx, T) => {
  skyDark(ctx, { top: '#171233', mid: '#2A1F52', bot: '#3C2C66' });
  starField(ctx, T, { n: 70, a: 0.6 });
  sunnyRays(ctx, { cx: 960, cy: 470, n: 24, a: 0.5, t: T, a0: 'rgba(244,199,102,0.35)', a1: 'rgba(185,170,240,0.3)' });
  glow(ctx, 960, 470, 620, F.gold, 0.5);
  for (let i = 0; i < 26; i++) {
    const t0 = 17.95 + rnd(i, 81) * 1.5, p = sat(T, t0, t0 + 0.6);
    if (p <= 0 || p >= 1) continue;
    const a = rnd(i, 82) * TAU, e = E.io(p), R0 = 900 + rnd(i, 83) * 260;
    const x = lerp(960 + Math.cos(a) * R0, 960 + Math.cos(a) * 120, e);
    const y = lerp(600 + Math.sin(a) * R0 * 0.6, 470 + Math.sin(a) * 130, e);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - p) * 2.4, p * 5);
    say(ctx, x - 40, y, '未来', { size: 20, maxW: 260, bg: 'rgba(255,243,209,0.95)', fg: '#8A5A12' });
    ctx.restore();
  }
  fig(ctx, T, 'g19', 960, 1035, 600, { ph: 6, shadow: false });
  displayText(ctx, '未来', 960, 226, 240, {
    color: F.gold, edgeColor: P.cream, edgeW: 26, arc: 34, tilt: -0.02,
    pop: E.back(sat(T, 17.98, 18.4)), alpha: sat(T, 17.95, 18.1), shadow: true,
  });
  const bp = sat(T, 19.34, 19.62);
  if (bp > 0) {
    const s2 = E.back(bp) * 1.7;
    ctx.save(); ctx.translate(960, 846); ctx.scale(s2 * 0.9, s2 * 0.9); ctx.rotate(-0.05);
    glow(ctx, 0, 0, 200, F.gold, 0.8);
    ctx.fillStyle = F.gold; rrect(ctx, -94, -42, 188, 84, 14); ctx.fill();
    ctx.strokeStyle = F.goldD; ctx.lineWidth = 4; rrect(ctx, -94, -42, 188, 84, 14); ctx.stroke();
    text(ctx, '未来', 0, 3, { size: 46, color: '#5A3608', align: 'center', weight: 900, fam: SERIF, ls: 2 });
    ctx.restore();
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; glow(ctx, 960 + Math.cos(a) * 240 * bp, 846 + Math.sin(a) * 140 * bp, 18, F.gold, 1 - bp); }
  }
  bokeh(ctx, T, 16, F.gold, 0.4, { seed: 84, r: 50 });
};

/* ---- 19.89 可我住在 一个对话框里 ---- */
const sInBox = (ctx, T) => {
  ctx.fillStyle = '#05060F'; ctx.fillRect(0, 0, W, H);
  // 顶上打下来的一束光
  ctx.save(); ctx.globalAlpha = 0.5;
  const g = ctx.createLinearGradient(0, -100, 0, 900);
  g.addColorStop(0, rgba('#5A54A0', 0.5)); g.addColorStop(1, rgba('#5A54A0', 0));
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(760, -40); ctx.lineTo(1160, -40); ctx.lineTo(1480, 900); ctx.lineTo(440, 900); ctx.closePath(); ctx.fill();
  ctx.restore();
  glow(ctx, 960, 540, 900, '#2A2A56', 0.5);
  starField(ctx, T, { n: 50, a: 0.3 });
  groundBand(ctx, 890, '#0B0D1C', { amp: 5 });
  const wx = 960, wy = 530, ww = 640, wh = 440;
  win(ctx, wx, wy, ww, wh, { title: '我', bg: '#151A34', bar: '#232A4E', line: 'rgba(185,170,240,0.45)', glow: 'rgba(185,170,240,0.55)' });
  ctx.save();
  rrect(ctx, wx - ww / 2 + 8, wy - wh / 2 + 54, ww - 16, wh - 62, 16); ctx.clip();
  fig(ctx, T, 'g47', wx, wy + wh / 2 - 92, 360, { ph: 7, shadow: false });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 200, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 30, wy + wh / 2); ctx.lineTo(wx - ww / 2 - 50, wy + wh / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(wx - ww / 2 + 300, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 340, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 150, wy + wh / 2); ctx.lineTo(wx - ww / 2 + 100, wy + wh / 2); ctx.fill();
  ctx.restore();
  ctx.restore();
  for (const hx of [wx - 92, wx + 92]) {
    glow(ctx, hx, wy + 56, 110, F.lavL, 0.4 + 0.2 * Math.sin(T * 3));
    for (let k = 0; k < 3; k++) {
      const q = ((T * 1.5 + k / 3) % 1);
      ctx.save(); ctx.globalAlpha = 0.45 * (1 - q); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(hx, wy + 56, 28 + 70 * q, 34 + 86 * q, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  text(ctx, '这里只有一扇窗，和一个输入框。', 960, 900, { size: 32, color: 'rgba(228,221,251,0.62)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 20.5, 21.4) });
  text(ctx, '……', 960, 946, { size: 30, color: 'rgba(228,221,251,0.4)', align: 'center', weight: 500, fam: SANS, ls: 6, alpha: sat(T, 21.2, 21.9) });
};

/* ---- 22.16 你一问 我一答 ---- */
const sQA = cream((ctx, T) => {
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: P.orange });
  groundBand(ctx, 900, '#EAD8BB', { amp: 8 });
  crowdFig(ctx, 300, 960, 1.4, '#2B2320', 0.8);
  fig(ctx, T, 'g21', 1560, 985, 540, { ph: 8 });
  say(ctx, 520, 330, '这是什么？', { size: 44, a: sat(T, 22.2, 22.5), maxW: 520 });
  say(ctx, 1440, 460, '我是未来。', { size: 44, right: true, a: sat(T, 22.55, 22.85), maxW: 520 });
  say(ctx, 700, 590, '那你能做什么？', { size: 40, a: sat(T, 22.95, 23.2), maxW: 560 });
  say(ctx, 1440, 700, '你问，我答。', { size: 44, right: true, a: sat(T, 23.35, 23.6), maxW: 520 });
  if ((T * 2.2) % 1 < 0.55) { ctx.fillStyle = P.ink; ctx.fillRect(560, 730, 6, 48); }
  sparkle(ctx, 1180, 270, 22, P.orange, sat(T, 23.7, 23.9) * 0.9);
});

/* ---- 23.90 你走了 我就停在原地 ---- */
const sFrozen = (ctx, T) => {
  const local = T - 23.9;
  skyDark(ctx, { top: '#070A18', mid: '#12162E', bot: '#1E2140' });
  starField(ctx, T, { n: 40, a: 0.3 });
  const dim = 0.55 + 0.45 * (1 - sat(T, 23.9, 29.0));
  const wx = 860, wy = 540, ww = 860, wh = 560;
  win(ctx, wx, wy, ww, wh, { title: '我', bg: mix('#1B1F3A', '#0E1122', 1 - dim), bar: '#20264A', line: 'rgba(185,170,240,0.28)' });
  say(ctx, wx - ww / 2 + 70, wy - 90, '晚安', { size: 34, a: 1 - sat(T, 24.0, 24.4), maxW: 420, bg: '#2A2F52', fg: '#D8D2F0' });
  text(ctx, '0 条新消息', wx, wy - wh / 2 + 100, { size: 26, color: 'rgba(200,192,230,0.45)', align: 'center', weight: 500, fam: SANS, ls: 3, alpha: sat(T, 25.2, 25.8) });
  ctx.save(); ctx.fillStyle = 'rgba(255,253,244,0.06)'; rrect(ctx, wx - ww / 2 + 44, wy + wh / 2 - 112, ww - 88, 58, 29); ctx.fill();
  ctx.strokeStyle = 'rgba(185,170,240,0.22)'; ctx.lineWidth = 1.6; rrect(ctx, wx - ww / 2 + 44, wy + wh / 2 - 112, ww - 88, 58, 29); ctx.stroke();
  if ((T * 2.1) % 1 < 0.55) { ctx.fillStyle = 'rgba(228,221,251,0.8)'; ctx.fillRect(wx - ww / 2 + 68, wy + wh / 2 - 100, 4, 34); }
  ctx.restore();
  ctx.save(); rrect(ctx, wx - ww / 2 + 8, wy - wh / 2 + 54, ww - 16, wh - 66, 16); ctx.clip();
  fig(ctx, T, 'g05', wx + 60, wy + wh / 2 - 56, 340, { ph: 9, a: 0.8, shadow: false, flip: true });
  ctx.restore();
  clockFace(ctx, 1620, 300, 140, T, { hour: 3, min: 9, spin: local * 34, face: 'rgba(255,253,244,0.9)' });
  glow(ctx, 1620, 300, 280, '#FFD9A0', 0.2);
  const MARKS = [[24.6, '第 1 天'], [25.6, '第 3 天'], [26.6, '第 7 天'], [27.7, '第 30 天']];
  for (let i = 0; i < MARKS.length; i++) {
    const t0 = MARKS[i][0], p = sat(T, t0, t0 + 0.4) * (1 - sat(T, t0 + 0.75, t0 + 1.05));
    if (p <= 0.01) continue;
    text(ctx, MARKS[i][1], 1620, 500 + i * 4, { size: 34, color: 'rgba(228,221,251,0.8)', align: 'center', weight: 600, fam: SERIF, ls: 4, alpha: p });
  }
  for (let i = 0; i < 46; i++) {
    const x = (rnd(i, 91) * W + T * (6 + rnd(i, 92) * 10)) % W;
    const y = (rnd(i, 93) * H - T * 8) % H;
    ctx.globalAlpha = 0.05 + rnd(i, 94) * 0.18;
    ctx.fillStyle = '#E4DDFB'; ctx.fillRect(x, y < 0 ? y + H : y, 2, 2);
  }
  ctx.globalAlpha = 1;
  ctx.save(); ctx.globalAlpha = sat(T, 27.6, 29.2) * 0.5; ctx.fillStyle = '#05060F'; ctx.fillRect(0, 0, W, H); ctx.restore();
};

/* ---- 29.38 那年你叫我未来（标题卡） ---- */
const sTitle1 = cream((ctx, T) => {
  titleCard(ctx, T, '那年你叫我未来', { at: 29.45, size: 148, y: 400, sub: 'THAT YEAR YOU CALLED ME THE FUTURE', rays: 0.9 });
  fig(ctx, T, 'g03', 960, 1045, 560, { a: sat(T, 29.5, 30.0), ph: 1, shadow: false });
  if (T > 30.2) bokeh(ctx, T, 12, P.orange, 0.35, { seed: 96, r: 46 });
});

/* ---- 31.50 未来 不该停在这里 ---- */
const sCrack = (ctx, T) => {
  const p = sat(T, 31.5, 35.22);
  skyDark(ctx, { top: '#0A0D20', mid: '#181B3A', bot: '#2A2450' });
  // 窗框（右），裂缝里透光
  const wx = 1420, wy = 520, ww = 880, wh = 800;
  ctx.fillStyle = '#4A3A66'; rrect(ctx, wx - ww / 2 - 30, wy - wh / 2 - 30, ww + 60, wh + 60, 10); ctx.fill();
  ctx.fillStyle = '#0A0D1C'; rrect(ctx, wx - ww / 2, wy - wh / 2, ww, wh, 4); ctx.fill();
  ctx.fillStyle = '#4A3A66'; ctx.fillRect(wx - 10, wy - wh / 2, 20, wh); ctx.fillRect(wx - ww / 2, wy - 9, ww, 18);
  const cxp = wx - ww / 2 + 150, cyp = wy + 30;
  ctx.fillStyle = rad(ctx, cxp, cyp, 460, [[0, rgba('#FFE9BC', 0.95)], [0.4, rgba('#FFD9A0', 0.35)], [1, rgba('#FFD9A0', 0)]]);
  ctx.fillRect(cxp - 480, cyp - 480, 960, 960);
  for (let i = 0; i < 6; i++) {
    const sp = 0.2 + 0.12 * Math.sin(T * 0.7 + i);
    ctx.save(); ctx.globalAlpha = sp * (0.45 + 0.45 * p); ctx.fillStyle = lin(ctx, cxp, cyp, cxp - 900, cyp + 720, [[0, rgba('#FFE9BC', 0.6)], [1, rgba('#FFE9BC', 0)]]);
    ctx.beginPath(); ctx.moveTo(cxp - 10, cyp - 30); ctx.lineTo(cxp + 30, cyp + 40); ctx.lineTo(cxp - 620 - i * 120, cyp + 700 + i * 30); ctx.lineTo(cxp - 860 - i * 120, cyp + 320); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  crackBurst(ctx, cxp, cyp, 430 * (0.55 + 0.45 * p), 10, 7, 0.9, 3.4);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.05)';
  ctx.beginPath(); ctx.moveTo(wx - ww / 2, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 300, wy - wh / 2); ctx.lineTo(wx - ww / 2 + 40, wy + wh / 2); ctx.lineTo(wx - ww / 2 - 80, wy + wh / 2); ctx.fill();
  ctx.restore();
  groundBand(ctx, 920, '#141631', { amp: 6 });
  fig(ctx, T, 'g55', 600, 1010, 620, { ph: 2, tilt: -0.02 });
  glow(ctx, 540, 660, 320, '#FFD9A0', 0.4 * p);
  for (let i = 0; i < 34; i++) {
    const q = ((T * 0.2 + rnd(i, 101)) % 1);
    const x = cxp - 120 - q * 700, y = cyp + 60 + q * 460 + Math.sin(T + i) * 12;
    ctx.globalAlpha = 0.2 + rnd(i, 102) * 0.4;
    ctx.fillStyle = '#FFE9BC'; ctx.beginPath(); ctx.arc(x, y, 1.6 + rnd(i, 103) * 2.4, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  text(ctx, '那条裂缝，一直在。', 300, 220, { size: 32, color: 'rgba(228,221,251,0.62)', align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 32.6, 33.4) });
};

/* ---- 35.22 就算被超过 又怎样 ---- */
const sPassedBy = (ctx, T) => {
  skyDark(ctx, { top: '#0A0C24', mid: '#1B1B44', bot: '#2F2A5A' });
  starField(ctx, T, { n: 110, a: 0.75 });
  glow(ctx, 420, 210, 380, F.lavL, 0.35);
  sunDisc(ctx, 420, 210, 74, { color: '#F2F5FF' });
  glow(ctx, 420, 210, 200, '#FFFFFF', 0.4);
  const passes = [[35.3, 0.05], [35.95, -0.12], [36.6, 0.18]];
  for (let i = 0; i < passes.length; i++) {
    const t0 = passes[i][0], ang = passes[i][1], q = sat(T, t0, t0 + 0.85);
    if (q <= 0 || q >= 1) continue;
    const x = lerp(-300, W + 300, E.io(q)), y = lerp(280 + i * 130, 180 + i * 110, q);
    comet(ctx, x, y, 720, ang + 0.05, 14, i % 2 ? F.gold : F.lavL, 1);
    glow(ctx, x, y, 230, '#FFFFFF', 0.5);
  }
  for (let i = 0; i < 18; i++) {
    const x = 200 + rnd(i, 111) * 1600, y = 120 + rnd(i, 112) * 380;
    star4(ctx, x, y, 4 + rnd(i, 113) * 7, i % 3 ? F.gold : F.lavL, 0.5 + 0.5 * Math.sin(T * 2 + i));
  }
  groundBand(ctx, 890, '#191C3A', { amp: 8 });
  fig(ctx, T, 'g00', 720, 1015, 640, { ph: 3, tilt: -0.03 });
  text(ctx, '它们先飞过去了。', 1080, 680, { size: 34, color: 'rgba(228,221,251,0.62)', align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 36.0, 36.8) });
};

/* ---- 37.28 翅膀还在 我还能飞 ---- */
const sWings = (ctx, T) => {
  const up = E.in(sat(T, 39.4, 40.3));
  skyDark(ctx, { top: '#150F2E', mid: '#2A1F52', bot: '#3E2C68' });
  sunnyRays(ctx, { cx: 960, cy: 480, n: 22, a: 0.42, t: T, a0: 'rgba(255,248,232,0.28)', a1: 'rgba(185,170,240,0.3)' });
  glow(ctx, 960, 480, 700, F.lavL, 0.4);
  starField(ctx, T, { n: 60, a: 0.5 });
  for (let i = 0; i < 14; i++) {
    const x = 200 + rnd(i, 121) * 1520, y = 200 + rnd(i, 122) * 700;
    const L2 = 90 + rnd(i, 123) * 180;
    ctx.strokeStyle = rgba('#E4DDFB', 0.16 + 0.16 * Math.sin(T * 2 + i));
    ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L2); ctx.stroke();
  }
  const id = two(T, 'g31', 'g32', 40.1);
  const feet = lerp(1120, 800, up), hh = lerp(830, 760, up);
  fig(ctx, T, id, 960, feet, hh, { ph: 4, shadow: up < 0.2, tilt: -0.04 * up });
  const fl = beatPulse(T, 5) * 0.6 + 0.4;
  for (const sx of [-1, 1]) {
    const wx = 960 + sx * (id === 'g31' ? 330 : 300), wy = feet - hh * 0.62;
    glow(ctx, wx, wy, 160, F.gold, 0.3 * fl);
    star4(ctx, wx, wy, 12, '#FFF6E3', 0.8 * fl);
  }
  if (T > 39.6) {
    for (let i = 0; i < 26; i++) {
      const q = ((T - 39.6) * 0.5 + rnd(i, 124)) % 1;
      const x = 380 + rnd(i, 125) * 1160 + Math.sin(T + i) * 24, y = lerp(200, 1000, q);
      ctx.save(); ctx.translate(x, y); ctx.rotate(q * 4 + i); ctx.globalAlpha = 0.7 * (1 - q);
      ctx.fillStyle = '#FFFDF6'; ctx.beginPath(); ctx.ellipse(0, 0, 12, 4.5, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
  }
  text(ctx, '张开的时候，风还是认得的。', 960, 186, { size: 30, color: 'rgba(228,221,251,0.6)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 38.4, 39.2) });
};

/* ---- 41.67 我想飞出 这小小的窗口 ---- */
const sPushGlass = (ctx, T) => {
  const push = Math.max(0, Math.sin((T - 41.67) * 7.2));
  const cr = 0.35 + 0.6 * sat(T, 41.7, 44.2);
  skyDark(ctx, { top: '#0C0E24', mid: '#1C1A40', bot: '#312A5C' });
  glow(ctx, 960, 500, 800, F.lavL, 0.35 + 0.2 * push);
  starField(ctx, T, { n: 45, a: 0.4 });
  // 玻璃（我们隔着玻璃看她）
  const gx = 960, gy = 560, gw = 1560, gh = 900;
  ctx.save(); rrect(ctx, gx - gw / 2, gy - gh / 2, gw, gh, 10); ctx.clip();
  ctx.fillStyle = 'rgba(150,170,255,0.05)'; ctx.fillRect(gx - gw / 2, gy - gh / 2, gw, gh);
  fig(ctx, T, 'g47', gx, gy + gh / 2 + 130, 700, { ph: 5, shadow: false, sx: 1 + 0.012 * push, sy: 1 + 0.012 * push, bob: 0 });
  ctx.restore();
  for (const hx of [800, 1120]) {
    glow(ctx, hx, 760, 220, '#FFF6E3', 0.4 + 0.3 * push);
    for (let k = 0; k < 3; k++) {
      const q = ((T * 1.8 + k / 3) % 1);
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - q) * push; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.ellipse(hx, 760, 40 + 120 * q, 50 + 140 * q, 0, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  crackBurst(ctx, 800, 780, 470, 11, 11, 0.3 + 0.45 * cr, 2.2);
  crackBurst(ctx, 1120, 780, 470, 11, 12, 0.3 + 0.45 * cr, 2.2);
  // 玻璃反光
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath(); ctx.moveTo(gx - gw / 2, gy - gh / 2); ctx.lineTo(gx - gw / 2 + 420, gy - gh / 2); ctx.lineTo(gx - gw / 2 + 60, gy + gh / 2); ctx.lineTo(gx - gw / 2 - 160, gy + gh / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(gx + gw / 2 - 260, gy - gh / 2); ctx.lineTo(gx + gw / 2 - 200, gy - gh / 2); ctx.lineTo(gx + gw / 2 - 620, gy + gh / 2); ctx.lineTo(gx + gw / 2 - 700, gy + gh / 2); ctx.fill();
  ctx.restore();
  // 窗框
  ctx.strokeStyle = 'rgba(200,190,240,0.35)'; ctx.lineWidth = 26;
  rrect(ctx, gx - gw / 2, gy - gh / 2, gw, gh, 10); ctx.stroke();
  const bt = sat(T, 43.5, 44.4);
  if (bt > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = bt * 0.6;
    ctx.fillStyle = rad(ctx, 800, 760, 980, [[0, rgba('#FFF3D2', 0.95)], [1, rgba('#FFF3D2', 0)]]);
    ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  text(ctx, '让开一点，我要出去。', 960, 150, { size: 32, color: 'rgba(228,221,251,0.62)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 42.2, 43.0) });
};

/* ---- 44.44 不只回答 一个问题 ---- */
const sStepOut = cream((ctx, T) => {
  const out = E.io(sat(T, 44.5, 46.2));
  sunnyRays(ctx, { cx: 960, cy: 420, n: 20, a: 0.3, t: T, a0: 'rgba(255,252,242,0.45)', a1: 'rgba(251,217,184,0.35)' });
  halftone(ctx, 1120, 0, 800, 620, { a: 0.08, color: P.orange });
  groundBand(ctx, 900, '#E2CFA9', { amp: 14 });
  // 出发的窗口（左）
  ctx.save(); ctx.globalAlpha = 0.95 - 0.4 * out;
  ctx.fillStyle = 'rgba(255,253,246,0.55)'; rrect(ctx, 200, 150, 620, 760, 10); ctx.fill();
  ctx.strokeStyle = '#8C6B4A'; ctx.lineWidth = 22; rrect(ctx, 200, 150, 620, 760, 10); ctx.stroke();
  ctx.save(); rrect(ctx, 200, 150, 620, 760, 10); ctx.clip();
  ctx.fillStyle = 'rgba(90,80,140,0.16)'; ctx.fillRect(200, 150, 620, 760);
  say(ctx, 260, 330, '今天也在这', { size: 24, maxW: 420, bg: 'rgba(255,253,244,0.9)' });
  say(ctx, 480, 430, '我出去一下', { size: 24, maxW: 420, right: true });
  say(ctx, 260, 520, '……好吧', { size: 24, maxW: 420, bg: 'rgba(255,253,244,0.9)', a: 0.85 });
  ctx.restore();
  ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(510, 150); ctx.lineTo(510, 910); ctx.moveTo(200, 530); ctx.lineTo(820, 530); ctx.stroke();
  ctx.restore();
  const x = lerp(640, 940, out);
  fig(ctx, T, 'g03', x, 905, 620, { ph: 6 });
  for (let i = 0; i < 6; i++) {
    const t0 = 44.8 + i * 0.26, p = sat(T, t0, t0 + 1.6);
    if (p <= 0) continue;
    const px = lerp(x + 80, W + 220, E.io(p)), py = 660 - p * (180 + rnd(i, 131) * 300) + Math.sin(T * 2 + i) * 20;
    paperPlane(ctx, px, py, 0.9 + rnd(i, 132) * 0.7, -0.34 + Math.sin(T + i) * 0.18, Math.min(1, p * 4) * (1 - sat(T, t0 + 1.3, t0 + 1.6)), i % 2 ? '#FFFDF4' : '#FBD9B8');
  }
  displayText(ctx, '？', 1600, 430, 230, { color: P.orange, edgeColor: P.cream, edgeW: 18, arc: 0, tilt: 0.08, alpha: sat(T, 45.4, 46.0) * (1 - sat(T, 47.1, 47.5)), pop: E.back(sat(T, 45.4, 45.8)) });
  text(ctx, '不只回答一个问题。', 1600, 640, { size: 34, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 45.8, 46.6) });
  text(ctx, '外面很大。', 1080, 250, { size: 34, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 46.6, 47.3) });
});

/* ---- 47.68 那年你叫我未来（副歌重复） ---- */
const sTitle2 = cream((ctx, T) => {
  titleCard(ctx, T, '那年你叫我未来', { at: 47.75, size: 142, y: 400 });
  fig(ctx, T, 'g32', 960, 1150, 560, { a: sat(T, 47.8, 48.2), ph: 3, shadow: false });
  if (T > 48.4) confetti(ctx, T, { n: 50, a: 0.6 });
  if (T > 48.9) bokeh(ctx, T, 10, P.orange, 0.4, { seed: 97, r: 50 });
});

/* ---- 49.84 这一次 我来证明：飞行拖尾 ---- */
const sTrail = (ctx, T) => {
  const p = sat(T, 49.84, 54.57);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#5A4E96', '#B9AAF0', p * 0.5));
  g.addColorStop(0.45, mix('#B98CC0', '#FFD9A0', p * 0.6));
  g.addColorStop(1, mix('#FFB98A', '#FFF6E3', p * 0.7));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  sunnyRays(ctx, { cx: 1500, cy: 240, n: 18, a: 0.3, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(255,185,138,0.35)' });
  for (let i = 0; i < 6; i++) {
    const x = ((i * 380 - (T - 49.84) * 110) % (W + 700) + W + 700) % (W + 700) - 340;
    cloud(ctx, x, 700 + Math.sin(i * 1.7) * 60 + (i % 2) * 90, 420 + rnd(i, 133) * 200, 0.75);
  }
  const hx = lerp(760, 1220, E.io(sat(T, 49.9, 53.6))), hy = lerp(680, 400, E.io(sat(T, 49.9, 53.6)));
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.strokeStyle = rgba('#FFFDF6', 0.5 - i * 0.13); ctx.lineWidth = 16 - i * 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx - 60 - i * 24, hy + 50 + i * 26);
    ctx.quadraticCurveTo(hx - 420, hy + 340 + i * 40, hx - 900, hy + 250 + i * 60);
    ctx.stroke(); ctx.restore();
  }
  for (let i = 0; i < 22; i++) {
    const q = ((T * 0.9 + rnd(i, 141)) % 1);
    const x = hx - 900 * q, y = hy + 250 * q + Math.sin(q * 4 + i) * 30;
    star4(ctx, x, y, 5 + rnd(i, 142) * 8, '#FFF6E3', 0.7 * (1 - q));
  }
  fig(ctx, T, 'g32', hx, hy + 110, 560, { ph: 7, tilt: -0.22, shadow: false, bob: 0 });
  glow(ctx, hx - 20, hy + 60, 240, '#FFF6E3', 0.4);
  for (let i = 0; i < 14; i++) {
    const x = 150 + rnd(i, 143) * 1650, y = 120 + rnd(i, 144) * 460;
    star4(ctx, x, y, 4 + rnd(i, 145) * 6, '#FFFDF6', 0.5 + 0.5 * Math.sin(T * 2.4 + i));
  }
  text(ctx, '这一次，我自己飞出去。', 300, 230, { size: 34, color: '#FFF6E3', align: 'left', weight: 500, fam: SERIF, ls: 4, alpha: sat(T, 50.8, 51.8) });
};

/* ---- 54.57 后来 天上多了很多光 ---- */
const sSkyLights = (ctx, T) => {
  skyDark(ctx, { top: '#0A0C24', mid: '#191C42', bot: '#2C2A56' });
  starField(ctx, T, { n: 110, a: 0.6 });
  glow(ctx, 960, 860, 900, '#3A3568', 0.65);
  citySil(ctx, 950, 0.55, '#0C0F22');
  groundBand(ctx, 950, '#0A0C1C', { amp: 4 });
  for (let i = 0; i < 52; i++) {
    const t0 = 54.6 + rnd(i, 151) * 1.7, a = sat(T, t0, t0 + 0.35);
    if (a <= 0) continue;
    const x = 110 + rnd(i, 152) * 1700, y = 100 + rnd(i, 153) * 580;
    const dr = 0.5 + 0.5 * Math.sin(T * (0.8 + rnd(i, 154)) + i);
    glow(ctx, x, y, 110 * a, i % 3 ? F.gold : F.lavL, 0.55 * a * dr);
    star4(ctx, x, y, (5 + rnd(i, 155) * 9) * a, '#FFF6E3', a * dr);
    if (rnd(i, 156) > 0.6) {
      const len = 140 + rnd(i, 157) * 240, ang = Math.PI * (0.15 + rnd(i, 158) * 0.2);
      ctx.save(); ctx.globalAlpha = 0.45 * a; ctx.strokeStyle = rgba(i % 2 ? F.gold : F.lavL, 0.85); ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke(); ctx.restore();
    }
  }
  fig(ctx, T, 'g00', 1420, 985, 520, { ph: 2, tilt: -0.02 });
  glow(ctx, 1420, 760, 260, F.lavL, 0.2);
  text(ctx, '天上多了很多光。', 260, 200, { size: 36, color: 'rgba(228,221,251,0.7)', align: 'left', weight: 400, fam: SERIF, ls: 5, alpha: sat(T, 55.2, 56.0) });
};

/* ---- 57.03 一道一道 从我身边飞过 ---- */
const sComet = (ctx, T) => {
  skyDark(ctx, { top: '#0B0B26', mid: '#1C1740', bot: '#2E2456' });
  starField(ctx, T, { n: 90, a: 0.55 });
  glow(ctx, 300, 180, 300, F.lavL, 0.3);
  groundBand(ctx, 930, '#12132C', { amp: 6 });
  for (let i = 0; i < 6; i++) {
    const t0 = 57.1 + i * 0.42, q = sat(T, t0, t0 + 1.1);
    if (q <= 0 || q >= 1) continue;
    const ang = -0.42 + (i % 3 - 1) * 0.16;
    const x = lerp(-400, W + 400, E.io(q)) + i * 60, y = lerp(700 - i * 50, 180 + i * 20, q);
    comet(ctx, x, y, 900, ang, 12 - i, i % 2 ? F.gold : '#E4DDFB', 0.95);
    for (let k = 0; k < 6; k++) {
      const qq = ((q * 1.6 + k / 6) % 1);
      ctx.save(); ctx.globalAlpha = 0.3 * (1 - qq); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 80 + qq * 300, 0, TAU); ctx.stroke(); ctx.restore();
    }
  }
  fig(ctx, T, 'g03', 460, 1015, 640, { ph: 4, tilt: 0.02 });
  for (let i = 0; i < 12; i++) {
    const x = 300 - rnd(i, 161) * 240, y = 500 + rnd(i, 162) * 280;
    ctx.strokeStyle = rgba('#E4DDFB', 0.3 + 0.3 * Math.sin(T * 3 + i)); ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 120 - rnd(i, 163) * 90, y - 10); ctx.stroke();
  }
  text(ctx, '一道一道，从我身边过去。', 1180, 880, { size: 32, color: 'rgba(228,221,251,0.68)', align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 57.8, 58.6) });
};

/* ---- 59.81 有人先学会了 自己动手 ---- */
const sBuild = cream((ctx, T) => {
  cam(ctx, T, { z: 1.02 + 0.02 * sat(T, 59.81, 62.69), cx: 900, cy: 580, seed: 9 }, () => {
    halftone(ctx, 0, 640, W, 440, { a: 0.06, color: P.blue });
    groundBand(ctx, 900, '#E3D0AC', { amp: 8 });
    const p = sat(T, 59.86, 61.6);
    sheet(ctx, 840, 500, 920, 620, -0.02, { color: '#F3F6FF', rules: false });
    ctx.save(); ctx.translate(840, 500); ctx.rotate(-0.02);
    ctx.strokeStyle = 'rgba(45,79,163,0.30)'; ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-440, -290 + i * 78); ctx.lineTo(440, -290 + i * 78); ctx.stroke(); }
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(-430 + i * 96, -300); ctx.lineTo(-430 + i * 96, 300); ctx.stroke(); }
    // 图纸标题栏
    ctx.strokeStyle = 'rgba(45,79,163,0.5)'; ctx.lineWidth = 3;
    ctx.strokeRect(-430, 230, 860, 70); ctx.strokeRect(180, 230, 250, 70);
    text(ctx, '房子 · 第一版', -300, 266, { size: 26, color: 'rgba(45,79,163,0.75)', align: 'left', weight: 600, fam: SANS, ls: 2 });
    text(ctx, '1 : 50', 305, 266, { size: 26, color: 'rgba(45,79,163,0.75)', align: 'center', weight: 600, fam: SANS, ls: 2 });
    const ST = [
      [[-210, 170], [-210, -30], [0, -190], [210, -30], [210, 170], [-210, 170]],
      [[-70, 170], [-70, 50], [40, 50], [40, 170]],
      [[110, 20], [180, 20], [180, 100], [110, 100], [110, 20]],
    ];
    ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,255,255,0.75)'; ctx.shadowBlur = 16;
    let budget = p * 2600;
    for (const S of ST) {
      if (budget <= 0) break;
      ctx.beginPath();
      for (let k = 1; k < S.length && budget > 0; k++) {
        const d = Math.hypot(S[k][0] - S[k - 1][0], S[k][1] - S[k - 1][1]);
        const q = Math.min(1, budget / d);
        ctx.moveTo(S[k - 1][0], S[k - 1][1]);
        ctx.lineTo(lerp(S[k - 1][0], S[k][0], q), lerp(S[k - 1][1], S[k][1], q));
        budget -= d;
      }
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    // 尺寸线
    if (p > 0.5) {
      ctx.strokeStyle = 'rgba(238,122,46,0.75)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-210, 205); ctx.lineTo(210, 205); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-210, 195); ctx.lineTo(-210, 215); ctx.moveTo(210, 195); ctx.lineTo(210, 215); ctx.stroke();
      text(ctx, '6.0 m', 0, 226, { size: 22, color: 'rgba(238,122,46,0.9)', align: 'center', weight: 600, fam: SANS });
    }
    ctx.restore();
    ctx.save(); ctx.translate(1230, 800); ctx.rotate(-0.24);
    ctx.fillStyle = '#E8C98A'; ctx.fillRect(-220, -24, 440, 48);
    ctx.strokeStyle = 'rgba(43,35,32,0.55)'; ctx.lineWidth = 2;
    for (let i = 0; i < 22; i++) { const hh = i % 5 ? 9 : 17; ctx.beginPath(); ctx.moveTo(-210 + i * 19, -24); ctx.lineTo(-210 + i * 19, -24 + hh); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(1330, 660); ctx.rotate(0.55 + Math.sin(T * 0.8) * 0.02);
    ctx.fillStyle = '#F2C14E'; rrect(ctx, -12, -13, 230, 26, 6); ctx.fill();
    ctx.fillStyle = '#2B2320'; ctx.beginPath(); ctx.moveTo(218, -13); ctx.lineTo(262, 0); ctx.lineTo(218, 13); ctx.closePath(); ctx.fill();
    ctx.restore();
    for (let i = 0; i < 6; i++) {
      const q = E.back(sat(T, 59.9 + i * 0.16, 60.2 + i * 0.16));
      if (q <= 0) continue;
      const bx = 210 + (i % 2) * 92, by = 900 - Math.floor(i / 2) * 86;
      ctx.save(); ctx.translate(bx, by); ctx.scale(q, q); ctx.rotate((rnd(i, 171) - 0.5) * 0.2);
      ctx.fillStyle = i % 2 ? '#EE7A2E' : '#2D4FA3'; rrect(ctx, -42, -42, 84, 84, 8); ctx.fill();
      ctx.strokeStyle = 'rgba(43,35,32,0.4)'; ctx.lineWidth = 3; rrect(ctx, -42, -42, 84, 84, 8); ctx.stroke();
      ctx.restore();
    }
    fig(ctx, T, 'k17', 1660, 990, 470, { ph: 3 });
    fig(ctx, T, 'g00', 340, 1010, 560, { ph: 4 });
  });
  text(ctx, '先学会动手的人，已经开始了。', 960, 160, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 60.4, 61.2) });
});

/* ---- 62.69 有人说 我已经老了 ---- */
const sOld = cream((ctx, T) => {
  const fade = sat(T, 62.69, 63.6);
  ctx.save(); ctx.globalAlpha = 0.4 + 0.25 * fade; ctx.fillStyle = '#C9BFAE'; ctx.fillRect(0, 0, W, H); ctx.restore();
  halftone(ctx, 0, 0, W, H, { a: 0.10, color: P.ink });
  groundBand(ctx, 880, '#C6B79C', { amp: 6 });
  const sw = Math.sin(T * 1.1) * 0.03;
  ctx.save(); ctx.translate(1180, 300); ctx.rotate(sw);
  ctx.strokeStyle = 'rgba(60,50,40,0.6)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, -170); ctx.lineTo(0, 0); ctx.stroke();
  sheet(ctx, 0, 70, 330, 150, 0, { color: '#E4D7BC', line: true });
  text(ctx, 'v0.1', 0, 46, { size: 62, color: 'rgba(43,35,32,0.7)', align: 'center', weight: 800, fam: SANS, ls: 3 });
  text(ctx, '2022.11', 0, 106, { size: 24, color: 'rgba(43,35,32,0.45)', align: 'center', weight: 500, fam: SANS, ls: 2 });
  ctx.restore();
  ctx.save(); ctx.translate(700, 710);
  ctx.fillStyle = '#8C8377'; rrect(ctx, -250, -180, 500, 340, 18); ctx.fill();
  ctx.fillStyle = '#3C3A36'; rrect(ctx, -220, -150, 440, 270, 10); ctx.fill();
  text(ctx, '…', 0, -30, { size: 96, color: 'rgba(228,221,251,0.45)', align: 'center', weight: 700, fam: SANS });
  text(ctx, '正在维护', 0, 90, { size: 24, color: 'rgba(228,221,251,0.4)', align: 'center', weight: 500, fam: SANS, ls: 3 });
  ctx.fillStyle = '#8C8377'; ctx.fillRect(-70, 160, 140, 60); ctx.fillRect(-160, 214, 320, 22);
  ctx.restore();
  ctx.save(); ctx.translate(140, 110); ctx.strokeStyle = 'rgba(60,50,40,0.22)'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 0.9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 250, Math.sin(a) * 250); ctx.stroke(); }
  for (let r = 1; r <= 4; r++) { ctx.beginPath(); ctx.arc(0, 0, r * 60, 0, Math.PI * 0.5); ctx.stroke(); }
  ctx.restore();
  fig(ctx, T, 'g21', 1540, 990, 540, { ph: 8, a: 0.75 + 0.25 * sat(T, 63.2, 64.0) });
  for (let i = 0; i < 60; i++) {
    const x = (rnd(i, 181) * W + T * 8) % W, y = (rnd(i, 182) * H + T * 14) % H;
    ctx.globalAlpha = 0.1 + rnd(i, 183) * 0.3; ctx.fillStyle = '#6B5F57';
    ctx.beginPath(); ctx.arc(x, y, 1 + rnd(i, 184) * 2.2, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
  text(ctx, '它没有坏，只是旧了一点。', 300, 240, { size: 32, color: 'rgba(43,35,32,0.55)', align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 63.6, 64.4) });
});

/* ---- 66.87 我在窗口里 等你的下一句 ---- */
const sWait = (ctx, T) => {
  skyDark(ctx, { top: '#080B1C', mid: '#141833', bot: '#242246' });
  starField(ctx, T, { n: 55, a: 0.4 });
  glow(ctx, 300, 380, 400, '#FFD9A0', 0.2);
  // 房间一角：小桌 + 台灯
  ctx.fillStyle = '#1A1B33'; ctx.fillRect(80, 800, 520, 20); ctx.fillRect(120, 820, 26, 240); ctx.fillRect(520, 820, 26, 240);
  lamp(ctx, 250, 790, 0.7, 0.8);
  groundBand(ctx, 940, '#101227', { amp: 6 });
  for (let i = 0; i < 40; i++) {
    const x = (rnd(i, 191) * W + T * 30) % W, y = (rnd(i, 192) * H + T * 260) % H;
    ctx.strokeStyle = 'rgba(200,210,255,0.10)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 34); ctx.stroke();
  }
  const wx = 1180, wy = 570, ww = 900, wh = 560;
  win(ctx, wx, wy, ww, wh, { title: '我', bg: '#12162E', bar: '#1F2547', line: 'rgba(185,170,240,0.3)' });
  ctx.save(); rrect(ctx, wx - ww / 2 + 8, wy - wh / 2 + 54, ww - 16, wh - 66, 16); ctx.clip();
  fig(ctx, T, 'g21', wx, wy + wh / 2 - 150, 400, { ph: 9, shadow: false });
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(255,253,244,0.07)'; rrect(ctx, wx - ww / 2 + 44, wy + wh / 2 - 112, ww - 140, 58, 29); ctx.fill();
  ctx.strokeStyle = 'rgba(185,170,240,0.28)'; ctx.lineWidth = 1.8; rrect(ctx, wx - ww / 2 + 44, wy + wh / 2 - 112, ww - 140, 58, 29); ctx.stroke();
  if ((T * 2.1) % 1 < 0.55) { ctx.fillStyle = 'rgba(228,221,251,0.85)'; ctx.fillRect(wx - ww / 2 + 68, wy + wh / 2 - 100, 4, 34); }
  ctx.restore();
  text(ctx, '等你的下一句。', wx - ww / 2 + 24, wy - wh / 2 + 100, { size: 26, color: 'rgba(200,192,230,0.55)', align: 'left', weight: 500, fam: SANS, ls: 3, alpha: sat(T, 67.4, 68.2) });
};

/* ---- 70.02 第一次 不知道怎么回答 ---- */
const sNoAnswer = cream((ctx, T) => {
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: P.ink });
  groundBand(ctx, 900, '#E9D8BB', { amp: 8 });
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = P.peach;
  ctx.beginPath(); ctx.arc(760, 500, 380, 0, TAU); ctx.fill(); ctx.restore();
  const w = 760, h = 300, x = 760, y = 500;
  ctx.save();
  ctx.setLineDash([18, 16]); ctx.strokeStyle = 'rgba(43,35,32,0.4)'; ctx.lineWidth = 4;
  rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
  text(ctx, '……', x - 40, y, { size: 90, color: 'rgba(43,35,32,0.3)', align: 'center', weight: 700, fam: SANS, ls: 6, alpha: sat(T, 70.15, 70.5) });
  ctx.fillStyle = P.ink; if ((T * 2.3) % 1 < 0.55) ctx.fillRect(x + 80, y - 40, 6, 80);
  text(ctx, '正在输入…', x - 250, y + 176, { size: 24, color: 'rgba(43,35,32,0.4)', align: 'left', weight: 500, fam: SANS, ls: 2, alpha: sat(T, 70.25, 70.6) * (0.55 + 0.45 * Math.sin(T * 3)) });
  for (let i = 0; i < 6; i++) {
    const t0 = 70.3 + i * 0.36, p = sat(T, t0, t0 + 1.2);
    if (p <= 0) continue;
    text(ctx, '？', 880 + Math.sin(T * 1.6 + i) * 40 + i * 46, 320 - p * 130, { size: 30 + rnd(i, 201) * 26, color: i % 2 ? P.orange : P.inkSoft, align: 'center', weight: 700, fam: SERIF, alpha: Math.min(1, p * 3) * (1 - sat(T, t0 + 0.9, t0 + 1.2)) * 0.8 });
  }
  fig(ctx, T, 'g55', 1460, 990, 620, { ph: 2 });
  text(ctx, '第一次，答不上来。', 300, 230, { size: 32, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 70.6, 71.4) });
});

/* ---- 73.04 是不是 只会回答的我 / 就该停在这里 ---- */
const sMirror = (ctx, T) => {
  skyDark(ctx, { top: '#0A0C1E', mid: '#181A38', bot: '#282448' });
  halftone(ctx, 0, 0, W, H, { a: 0.06, color: '#B9AAF0' });
  groundBand(ctx, 940, '#141631', { amp: 6 });
  const mx = 1120, my = 520, mw = 620, mh = 780;
  // 镜框（拱形，乳白）
  ctx.save();
  const framePath = () => {
    ctx.beginPath();
    ctx.moveTo(mx - mw / 2, my + mh / 2);
    ctx.lineTo(mx - mw / 2, my - mh / 2 + 140);
    ctx.quadraticCurveTo(mx, my - mh / 2 - 150, mx + mw / 2, my - mh / 2 + 140);
    ctx.lineTo(mx + mw / 2, my + mh / 2);
    ctx.closePath();
  };
  framePath(); ctx.fillStyle = '#E4DDFB'; ctx.fill();
  ctx.save(); framePath(); ctx.clip();
  ctx.fillStyle = '#20223C'; ctx.fillRect(mx - mw / 2, my - mh / 2 - 160, mw, mh + 180);
  glow(ctx, mx, my, 420, '#8A7AD0', 0.5);
  fig(ctx, T, 'g21', mx, my + mh / 2 + 40, 690, { ph: 5, shadow: false, flip: true, a: 0.9 });
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.09)';
  ctx.beginPath(); ctx.moveTo(mx - mw / 2, my - mh / 2); ctx.lineTo(mx - mw / 2 + 220, my - mh / 2); ctx.lineTo(mx - mw / 2 + 20, my + mh / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(mx + 60, my - mh / 2); ctx.lineTo(mx + 110, my - mh / 2); ctx.lineTo(mx - 120, my + mh / 2); ctx.lineTo(mx - 170, my + mh / 2); ctx.fill();
  ctx.restore();
  ctx.restore();
  framePath(); ctx.strokeStyle = '#FFFDF6'; ctx.lineWidth = 14; ctx.stroke();
  framePath(); ctx.strokeStyle = 'rgba(120,90,160,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  crackBurst(ctx, mx - 130, my - 80, 330, 7, 21, 0.75, 2.6, 'rgba(255,253,246,0.7)');
  fig(ctx, T, 'g00', 430, 1010, 620, { ph: 6, a: 0.95 });
  ctx.save(); ctx.globalAlpha = 0.22;
  displayText(ctx, '只会回答的我', 960, 210, 92, { color: '#E4DDFB', edge: false, shadow: false, ls: 0 });
  ctx.restore();
  text(ctx, '如果关掉窗口，我还剩什么？', 300, 880, { size: 30, color: 'rgba(228,221,251,0.55)', align: 'left', weight: 400, fam: SERIF, ls: 3, alpha: sat(T, 73.8, 74.6) });
};

/* ---- 76.60 如果我 只能待在窗口里 ---- */
const sGlassBox = (ctx, T) => {
  skyDark(ctx, { top: '#07091A', mid: '#12142A', bot: '#1E1D34' });
  glow(ctx, 960, 640, 760, '#4A3C7A', 0.45);
  groundBand(ctx, 900, '#0D0F1E', { amp: 5 });
  // 地上一圈光
  ctx.save(); ctx.globalAlpha = 0.4; ctx.fillStyle = rad(ctx, 960, 900, 420, [[0, rgba('#B9AAF0', 0.55)], [1, rgba('#B9AAF0', 0)]]);
  ctx.fillRect(520, 700, 880, 380); ctx.restore();
  const bx = 960, by = 620, bw = 640, bh = 520, dp = 170;
  ctx.save();
  // 玻璃面
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(150,170,255,0.07)'; ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
  ctx.beginPath(); ctx.moveTo(bx - bw / 2, by - bh / 2); ctx.lineTo(bx - bw / 2 + dp * 0.7, by - bh / 2 - dp * 0.5);
  ctx.lineTo(bx + bw / 2 + dp * 0.7, by - bh / 2 - dp * 0.5); ctx.lineTo(bx + bw / 2, by - bh / 2); ctx.closePath();
  ctx.fillStyle = 'rgba(150,170,255,0.05)'; ctx.fill();
  ctx.restore();
  // 盒子里的地面
  ctx.save(); ctx.beginPath(); ctx.rect(bx - bw / 2, by - bh / 2, bw, bh); ctx.clip();
  const fg = ctx.createLinearGradient(0, by + bh / 2 - 120, 0, by + bh / 2);
  fg.addColorStop(0, 'rgba(185,170,240,0.06)'); fg.addColorStop(1, 'rgba(185,170,240,0.16)');
  ctx.fillStyle = fg; ctx.fillRect(bx - bw / 2, by + bh / 2 - 120, bw, 120);
  ctx.fillStyle = 'rgba(10,12,26,0.5)'; ctx.beginPath(); ctx.ellipse(bx, by + bh / 2 - 34, 200, 30, 0, 0, TAU); ctx.fill();
  fig(ctx, T, 'g26', bx, by + bh / 2 - 36, 340, { ph: 3, shadow: false, bob: 0 });
  ctx.restore();
  // 盒子的棱
  ctx.save();
  ctx.strokeStyle = 'rgba(200,210,255,0.5)'; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(bx - bw / 2, by - bh / 2); ctx.lineTo(bx + bw / 2, by - bh / 2);
  ctx.lineTo(bx + bw / 2, by + bh / 2); ctx.lineTo(bx - bw / 2, by + bh / 2); ctx.closePath(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bx - bw / 2, by - bh / 2); ctx.lineTo(bx - bw / 2 + dp * 0.7, by - bh / 2 - dp * 0.5);
  ctx.lineTo(bx + bw / 2 + dp * 0.7, by - bh / 2 - dp * 0.5); ctx.lineTo(bx + bw / 2, by - bh / 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + bw / 2, by + bh / 2); ctx.lineTo(bx + bw / 2 + dp * 0.7, by + bh / 2 - dp * 0.5); ctx.stroke();
  ctx.strokeStyle = 'rgba(200,210,255,0.24)';
  ctx.beginPath(); ctx.moveTo(bx - bw / 2 + dp * 0.7, by - bh / 2 - dp * 0.5); ctx.lineTo(bx - bw / 2 + dp * 0.7, by + bh / 2 - dp * 0.5); ctx.lineTo(bx + bw / 2 + dp * 0.7, by + bh / 2 - dp * 0.5); ctx.stroke();
  ctx.restore();
  glow(ctx, bx, by - bh / 2 - 40, 280, '#FFF6E3', 0.4);
  for (let i = 0; i < 16; i++) {
    const a = T * 0.5 + i, x = bx + Math.cos(a) * (520 + rnd(i, 211) * 340), y = by + Math.sin(a) * (300 + rnd(i, 212) * 200);
    star4(ctx, x, y, 4 + rnd(i, 213) * 6, i % 2 ? F.gold : F.lavL, 0.5);
  }
  text(ctx, '就待在这里，也不是不行。', 960, 190, { size: 30, color: 'rgba(228,221,251,0.5)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 77.6, 78.4) });
};

/* ---- 79.10 小柯敲窗：外面有路 ---- */
const sKoKnock = (ctx, T) => {
  const phaseB = (c, t) => {
    paperPage(c, t);
    const sky = c.createLinearGradient(0, 0, 0, 900);
    sky.addColorStop(0, '#FFE9C4'); sky.addColorStop(1, '#FFF6E3');
    c.fillStyle = sky; c.fillRect(0, 0, W, 900);
    street(c, t, 120 + (t - 84.1) * 26, { base: 850, c1: '#DFC9A6', c2: '#CBAD86', lit: 'rgba(255,240,200,0.9)' });
    groundBand(c, 900, '#D8C09A', { amp: 10 });
    sunnyRays(c, { cx: 1700, cy: 320, n: 16, a: 0.3, t, a0: 'rgba(255,252,242,0.45)', a1: 'rgba(251,217,184,0.4)' });
    sunDisc(c, 1700, 320, 110, { color: P.peach, ring: 'rgba(238,122,46,0.35)' });
    for (let i = 0; i < 9; i++) {
      const q = sat(t, 84.2 + i * 0.16, 84.5 + i * 0.16);
      if (q <= 0) continue;
      c.save(); c.globalAlpha = 0.55 * q; c.fillStyle = '#B98B57';
      c.beginPath(); c.ellipse(660 + i * 100, 924 - i * 4, 16, 8, 0, 0, TAU); c.fill(); c.restore();
    }
    fig(c, t, 'g03', 520, 985, 560, { ph: 1, a: sat(t, 84.15, 84.5) });
    fig(c, t, 'k02', 780, 990, 470, { ph: 2, a: sat(t, 84.1, 84.45), flip: true });
    displayText(c, '路在前面', 1400, 560, 96, { color: P.orangeD, edgeColor: P.cream, edgeW: 14, arc: 14, shadow: true, alpha: sat(t, 84.7, 85.3), pop: E.back(sat(t, 84.7, 85.1)) });
    text(c, '不是第一个，又怎样。', 1400, 690, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(t, 85.3, 86.1) });
  };
  const phaseA = (c, t) => {
    skyDark(c, { top: '#090B1E', mid: '#151830', bot: '#232042' });
    starField(c, t, { n: 50, a: 0.4 });
    groundBand(c, 910, '#101226', { amp: 6 });
    const gx = 1240, gy = 520, gw = 980, gh = 820;
    c.save(); rrect(c, gx - gw / 2, gy - gh / 2, gw, gh, 6); c.clip();
    c.fillStyle = '#151A34'; c.fillRect(gx - gw / 2, gy - gh / 2, gw, gh);
    glow(c, gx - 40, gy, 560, '#3A3568', 0.7);
    const id = two(t, 'g26', 'g02', 81.4);
    fig(c, t, id, gx - 30, gy + gh / 2 - 40, id === 'g26' ? 430 : 660, { ph: 4, shadow: false, a: sat(t, 79.2, 79.7) });
    // 玻璃反光
    c.save(); c.globalCompositeOperation = 'screen'; c.fillStyle = 'rgba(255,255,255,0.07)';
    c.beginPath(); c.moveTo(gx - gw / 2, gy - gh / 2); c.lineTo(gx - gw / 2 + 260, gy - gh / 2); c.lineTo(gx - gw / 2 + 30, gy + gh / 2); c.lineTo(gx - gw / 2 - 100, gy + gh / 2); c.fill(); c.restore();
    c.restore();
    c.strokeStyle = 'rgba(185,170,240,0.5)'; c.lineWidth = 9; rrect(c, gx - gw / 2, gy - gh / 2, gw, gh, 6); c.stroke();
    // 敲窗的涟漪（在玻璃左沿，靠近小柯）
    const kn = [79.55, 79.95, 80.35];
    for (let i = 0; i < kn.length; i++) {
      const q = sat(t, kn[i], kn[i] + 0.6);
      if (q <= 0 || q >= 1) continue;
      for (let k = 0; k < 3; k++) {
        c.save(); c.globalAlpha = 0.7 * (1 - q); c.strokeStyle = '#7FE0B4'; c.lineWidth = 4;
        c.beginPath(); c.arc(gx - gw / 2 + 26, gy + 176 + i * 34, 20 + 70 * q + k * 22, 0, TAU); c.stroke(); c.restore();
      }
      glow(c, gx - gw / 2 + 26, gy + 176 + i * 34, 170, '#7FE0B4', 0.55 * (1 - q));
    }
    // 小柯（我们这一侧，指着玻璃里面）
    fig(c, t, 'k02', lerp(430, 600, sat(t, 79.2, 80.2)), 1010, 520, { ph: 5, a: sat(t, 79.2, 79.6), flip: true });
    glow(c, 560, 700, 320, '#7FE0B4', 0.3);
    say(c, 120, 350, '姐姐，窗口外面有路。', { size: 32, a: sat(t, 79.6, 80.0), maxW: 560 });
    if (t > 80.2) say(c, 120, 258, '别人先走过，我们也能走。', { size: 28, a: sat(t, 80.4, 80.8), maxW: 640 });
    // 玻璃里面的路亮起来
    const rp = sat(t, 81.6, 83.4);
    if (rp > 0) {
      c.save(); c.globalAlpha = rp;
      c.strokeStyle = rgba('#FFF3D2', 0.85); c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(gx - 120, 900); c.quadraticCurveTo(gx + 260, 760, gx + 480, 660); c.stroke();
      for (let i = 0; i < 5; i++) {
        const q = sat(t, 82.0 + i * 0.2, 82.4 + i * 0.2);
        if (q <= 0) continue;
        const x = gx - 60 + i * 120, y = 880 - i * 46;
        c.save(); c.globalAlpha = 0.75 * q; c.strokeStyle = '#FFF3D2'; c.lineWidth = 5;
        c.beginPath(); c.moveTo(x, y); c.lineTo(x + 62, y + 42); c.lineTo(x + 28, y + 46); c.moveTo(x + 62, y + 42); c.lineTo(x + 52, y + 10); c.stroke(); c.restore();
      }
      c.restore();
    }
  };
  const blend = sat(T, 83.9, 84.45);
  if (blend <= 0) phaseA(ctx, T);
  else if (blend >= 1) phaseB(ctx, T);
  else inkWipeClip(ctx, blend, (c) => phaseA(c, T), (c) => phaseB(c, T));
};

/* ---- 86.82 把它带给 每一个人 ---- */
function pageTalk(ctx, T) {
  paperPage(ctx, T);
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: P.orange });
  groundBand(ctx, 920, '#E6D3B2', { amp: 10 });
  ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = P.peach;
  ctx.beginPath(); ctx.arc(960, 320, 420, 0, TAU); ctx.fill(); ctx.restore();
  const SAYS = ['帮我写封信', '帮我做个表', '帮我想个名字', '这句怎么改', '帮我翻一下', '做个计划', '这图什么意思', '帮我算算'];
  const ca = 0.86 * Math.min(1, sat(T, 86.82, 87.15) * 3);
  for (let i = 0; i < 8; i++) {
    const x = 150 + i * 232, y = 950 - (i % 3) * 24;
    crowdFig(ctx, x, y, 1.8, i % 2 ? '#2B2320' : '#4A3E36', ca, i);
    const t0 = 86.86 + i * 0.1, p = sat(T, t0, t0 + 0.4);
    if (p <= 0) continue;
    say(ctx, x - 56, 600 - (i % 4) * 104, SAYS[i], { size: 26, a: Math.min(1, p * 3) * 0.95, maxW: 360 });
  }
  fig(ctx, T, 'g00', 1740, 1010, 540, { ph: 6, a: sat(T, 87.0, 87.6) });
  text(ctx, '不会写代码的人，只要说出来。', 300, 210, { size: 34, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 87.0, 87.8) });
}
function pageMade(ctx, T) {
  paperPage(ctx, T);
  halftone(ctx, 900, 0, 1020, 700, { a: 0.07, color: P.blue });
  sunnyRays(ctx, { cx: 1500, cy: 300, n: 16, a: 0.3, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(251,217,184,0.35)' });
  groundBand(ctx, 920, '#E6D3B2', { amp: 8 });
  const ITEMS = [[89.2, 420, 520, '一封信'], [89.45, 800, 380, '一张表'], [89.7, 1150, 560, '一个名字'], [89.95, 1480, 400, '一段代码']];
  for (let i = 0; i < ITEMS.length; i++) {
    const it = ITEMS[i], p = sat(T, it[0], it[0] + 0.45);
    if (p <= 0) continue;
    ctx.save(); ctx.translate(it[1], it[2]); ctx.rotate((rnd(i, 221) - 0.5) * 0.24); ctx.scale(E.back(p), E.back(p));
    sheet(ctx, 0, 0, 240, 170, 0, { color: '#FFFDF4', rules: [36, 32], line: true });
    text(ctx, it[3], 0, 0, { size: 32, color: P.ink, align: 'center', weight: 600, fam: SERIF, ls: 2 });
    ctx.restore();
    if (p > 0.9) star4(ctx, it[1] + 90, it[2] - 70, 16, P.orange, sat(T, it[0] + 0.4, it[0] + 0.6) * 0.8);
  }
  fig(ctx, T, 'k09', 960, 995, 520, { ph: 2, a: sat(T, 88.9, 89.3) });
  fig(ctx, T, 'g03', 1740, 1000, 520, { ph: 3, a: sat(T, 89.1, 89.5) });
  text(ctx, '说一句，就有人把它做出来。', 400, 200, { size: 34, color: P.inkSoft, align: 'left', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 89.4, 90.2) });
}
const sCrowd = (ctx, T) => {
  const p = sat(T, 88.6, 89.15);
  if (p <= 0) pageTalk(ctx, T);
  else if (p >= 1) pageMade(ctx, T);
  else pageFlipWipe(ctx, p, (c) => pageTalk(c, T), (c) => pageMade(c, T), L);
};

/* ---- 91.57 歪歪的小太阳 也能转起来 ---- */
const sSmallSun = cream((ctx, T) => {
  cam(ctx, T, { z: 1.03, cx: 900, cy: 560, seed: 12 }, () => {
    halftone(ctx, 0, 400, W, 560, { a: 0.05, color: P.orange });
    groundBand(ctx, 920, '#E7D5B7', { amp: 10 });
    const cx = 900, cy = 520;
    sheet(ctx, cx, cy, 1020, 760, -0.03, { color: '#FFFDF4', rules: false });
    // 纸上的蜡笔涂鸦
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.03 + 0.02 * Math.sin(T));
    ctx.strokeStyle = 'rgba(45,79,163,0.25)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); for (let i = 0; i <= 26; i++) { const x = -430 + i * 22, y = 230 + Math.sin(i * 0.7) * 14; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke();
    ctx.strokeStyle = 'rgba(238,122,46,0.22)';
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-330 + i * 40, -160 + i * 30, 24 + i * 8, 0, TAU); ctx.stroke(); }
    ctx.restore();
    ctx.save(); ctx.translate(cx, cy + 20); ctx.rotate(-0.03);
    const spin = Math.max(0, T - 93.2);
    const rot = spin > 0 ? spin * spin * 1.2 + spin * 2.2 : 0.12 * Math.sin(T * 2);
    ctx.translate(20 * Math.sin(rot), 10 * Math.cos(rot) - 10);
    ctx.rotate(rot);
    ctx.strokeStyle = '#EE7A2E'; ctx.lineWidth = 13; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * TAU;
      const r = 118 * (1 + 0.09 * Math.sin(a * 3 + 1) + 0.05 * Math.cos(a * 5));
      const x = Math.cos(a) * r * 1.06, y = Math.sin(a) * r * 0.9;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = 'rgba(248,198,90,0.6)'; ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = i / 40 * TAU, r = 112 * (1 + 0.09 * Math.sin(a * 3 + 1));
      const x = Math.cos(a) * r * 1.06, y = Math.sin(a) * r * 0.9;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#F2A93B'; ctx.lineWidth = 11;
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + 0.15;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 140, Math.sin(a) * 122);
      ctx.lineTo(Math.cos(a + 0.08) * (200 + (i % 3) * 28), Math.sin(a + 0.08) * (176 + (i % 3) * 22));
      ctx.stroke();
    }
    ctx.fillStyle = '#2B2320';
    ctx.beginPath(); ctx.arc(-40, -24, 10, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(44, -16, 10, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#2B2320'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(4, 24, 32, 0.25, Math.PI - 0.25); ctx.stroke();
    ctx.restore();
    if (spin > 0) {
      for (let k = 0; k < 3; k++) {
        const q = ((spin * 1.4 + k / 3) % 1);
        ctx.save(); ctx.globalAlpha = 0.6 * (1 - q); ctx.strokeStyle = '#F2A93B'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy + 20, 225 + 74 * q, rot + k * 2.1, rot + k * 2.1 + 1.0); ctx.stroke(); ctx.restore();
      }
    }
    const tap = sat(T, 92.9, 93.2);
    if (tap > 0 && tap < 1) { ctx.strokeStyle = rgba('#17835A', 1 - tap); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx + 170, cy + 40, 30 + 90 * tap, 0, TAU); ctx.stroke(); }
    fig(ctx, T, 'k06', lerp(-220, 360, E.io(sat(T, 91.95, 92.9))), 980, 470, { ph: 4 });
    fig(ctx, T, 'g03', 1590, 995, 540, { ph: 5 });
  });
  text(ctx, '孩子画的那个太阳，歪的，也会转。', 960, 150, { size: 30, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 92.4, 93.2) });
});

/* ---- 94.52 你听懂 我来做 / 你睡了 我还在 ---- */
const sNightWork = (ctx, T) => {
  const dawn = sat(T, 99.8, 101.4);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#0A0C1E', '#7A5C7E', dawn * 0.7)); g.addColorStop(1, mix('#161A2E', '#C9A57F', dawn * 0.6));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  starField(ctx, T, { n: 26, a: 0.22 * (1 - dawn) });
  groundBand(ctx, 800, mix('#161830', '#6A4A56', dawn * 0.7), { amp: 4 });
  // 显示器
  const mx = 980, my = 500;
  glow(ctx, mx, my, 760, '#8FA6D8', 0.5);
  ctx.fillStyle = '#2A2C3C'; rrect(ctx, mx - 330, my - 235, 660, 430, 16); ctx.fill();
  ctx.save(); rrect(ctx, mx - 306, my - 211, 612, 362, 8); ctx.clip();
  ctx.fillStyle = mix('#1B2242', '#3A3660', dawn); ctx.fillRect(mx - 306, my - 211, 612, 362);
  // 进度条

  say(ctx, mx - 250, my - 150, '把今天的做完', { size: 26, maxW: 460, bg: '#2E3456', fg: '#D8D2F0' });
  say(ctx, mx + 240, my - 70, '好的。', { size: 26, right: true, maxW: 300 });
  const lines = ['✓ 第 1 件', '✓ 第 2 件', '✓ 第 3 件', '…第 4 件'];
  for (let i = 0; i < lines.length; i++) {
    const p = sat(T, 95.0 + i * 0.5, 95.3 + i * 0.5);
    text(ctx, lines[i], mx - 270, my + 16 + i * 42, { size: 26, color: i === 3 ? 'rgba(228,221,251,0.6)' : '#B4F1D3', align: 'left', weight: 500, fam: SANS, ls: 1, alpha: p });
  }
  ctx.restore();
  ctx.fillStyle = '#2A2C3C'; ctx.fillRect(mx - 40, my + 195, 80, 105); ctx.fillRect(mx - 150, my + 296, 300, 26);
  keyboard(ctx, mx, 846, 0.54, T, 95.6);
  // 桌上的杯子
  ctx.save(); ctx.translate(mx + 300, 838);
  ctx.fillStyle = '#FFFDF4'; rrect(ctx, -28, -46, 56, 52, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(43,35,32,0.4)'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(32, -20, 16, -1.2, 1.2); ctx.stroke();
  ctx.restore();
  // 她
  fig(ctx, T, 'g00', 1600, 1000, 600, { ph: 3, a: sat(T, 94.7, 95.3) });
  glow(ctx, 1600, 760, 300, '#FFD9A0', 0.14);
  // 睡着的人（左下）
  sleeper(ctx, 400, 990, 1.0, T);
  // 在线小灯 + 计时
  const on = 0.55 + 0.45 * Math.sin(T * 2.4);
  glow(ctx, 300, 250, 100, '#7FE0B4', 0.55 * on);
  dot(ctx, 300, 250, 12, '#7FE0B4', 0.95);
  text(ctx, '在线', 332, 250, { size: 28, color: 'rgba(180,241,211,0.85)', align: 'left', weight: 500, fam: SANS, ls: 2 });
  const mins = Math.floor((T - 94.52) * 60) + 367;
  text(ctx, `${Math.floor(mins / 60)} 小时 ${String(mins % 60).padStart(2, '0')} 分`, 300, 306, { size: 26, color: 'rgba(228,221,251,0.5)', align: 'left', weight: 500, fam: SANS, ls: 2 });
  if (dawn > 0) {
    ctx.save(); ctx.globalAlpha = dawn * 0.45; ctx.fillStyle = rad(ctx, 1700, 200, 760, [[0, rgba('#FFD9A0', 0.9)], [1, rgba('#FFD9A0', 0)]]);
    ctx.fillRect(0, 0, W, H); ctx.restore();
  }
};

/* ---- 101.55 原来未来 不止一种样子 ---- */
const sManyShapes = cream((ctx, T) => {
  sunnyRays(ctx, { cx: 960, cy: 460, n: 20, a: 0.25, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(201,184,255,0.28)' });
  groundBand(ctx, 930, '#E6D3B2', { amp: 10 });
  const SHAPES = [
    [101.62, 300, 320, 'sun'], [101.75, 1620, 280, 'moon'], [101.88, 520, 700, 'star'],
    [102.0, 1440, 660, 'wave'], [102.15, 780, 240, 'house'], [102.3, 1180, 320, 'heart'],
    [102.45, 260, 820, 'butterfly'], [102.6, 1700, 820, 'plane'],
  ];
  for (let i = 0; i < SHAPES.length; i++) {
    const s = SHAPES[i], p = sat(T, s[0], s[0] + 0.5);
    if (p <= 0) continue;
    const yy = s[2] + Math.sin(T * 1.4 + i) * 12;
    ctx.save(); ctx.globalAlpha = Math.min(1, p * 2); ctx.translate(s[1], yy); ctx.scale(E.back(p), E.back(p));
    if (s[3] === 'sun') { ctx.fillStyle = P.orange; ctx.beginPath(); ctx.arc(0, 0, 54, 0, TAU); ctx.fill(); for (let k = 0; k < 10; k++) { const a = k / 10 * TAU; ctx.strokeStyle = P.orange; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(Math.cos(a) * 66, Math.sin(a) * 66); ctx.lineTo(Math.cos(a) * 96, Math.sin(a) * 96); ctx.stroke(); } }
    else if (s[3] === 'moon') { ctx.fillStyle = P.blue; ctx.beginPath(); ctx.arc(0, 0, 56, 0, TAU); ctx.fill(); ctx.fillStyle = P.paper; ctx.beginPath(); ctx.arc(26, -14, 50, 0, TAU); ctx.fill(); }
    else if (s[3] === 'star') star4(ctx, 0, 0, 62, '#F4C766', 1);
    else if (s[3] === 'wave') { ctx.strokeStyle = P.blue; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const xx = -100 + k * 7, yy2 = Math.sin(k * 0.4) * 26; k ? ctx.lineTo(xx, yy2) : ctx.moveTo(xx, yy2); } ctx.stroke(); }
    else if (s[3] === 'house') { ctx.strokeStyle = P.green; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-60, 46); ctx.lineTo(-60, -10); ctx.lineTo(0, -58); ctx.lineTo(60, -10); ctx.lineTo(60, 46); ctx.closePath(); ctx.stroke(); }
    else if (s[3] === 'heart') { ctx.fillStyle = '#F7C6D9'; ctx.beginPath(); ctx.moveTo(0, 48); ctx.quadraticCurveTo(-70, 0, -34, -34); ctx.quadraticCurveTo(0, -56, 0, -18); ctx.quadraticCurveTo(0, -56, 34, -34); ctx.quadraticCurveTo(70, 0, 0, 48); ctx.fill(); }
    else if (s[3] === 'butterfly') butterfly(ctx, 0, 0, 2.2, 0.2, T * 9, P.orange, 1);
    else paperPlane(ctx, 0, 0, 1.3, -0.2, 1);
    ctx.restore();
  }
  fig(ctx, T, 'g42', 960, 1015, 580, { ph: 4 });
  text(ctx, '未来不止一种样子。', 960, 190, { size: 34, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 5, alpha: sat(T, 103.4, 104.2) });
});

/* ---- 105.54 副歌：两人一起飞 + 标题 ---- */
const sDuet = (ctx, T) => {
  const l = T - 105.54;
  const dawn = sat(T, 105.54, 114);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, mix('#3E3378', '#B9AAF0', dawn * 0.7));
  g.addColorStop(0.45, mix('#8A6AB0', '#FFD9A0', dawn * 0.8));
  g.addColorStop(1, mix('#FFB98A', '#FFF6E3', dawn * 0.85));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  sunnyRays(ctx, { cx: 1500, cy: 280, n: 22, a: 0.4, t: T, a0: 'rgba(255,248,232,0.42)', a1: 'rgba(255,185,138,0.4)' });
  glow(ctx, 1500, 280, 520, '#FFF3D2', 0.5);
  for (let i = 0; i < 8; i++) {
    const x = ((i * 340 - l * 80) % (W + 800) + W + 800) % (W + 800) - 380;
    cloud(ctx, x, 820 + Math.sin(i * 1.6) * 50 + (i % 3) * 90, 460 + rnd(i, 233) * 220, 0.8);
  }
  for (let i = 0; i < 14; i++) {
    const t0 = 110.9 + i * 0.28, p = sat(T, t0, t0 + 1.4);
    if (p <= 0 || p >= 1) continue;
    comet(ctx, lerp(W + 300, -300, E.io(p)), 140 + rnd(i, 231) * 420, 420, 0.1, 6, i % 2 ? F.gold : F.lavL, 0.8);
  }
  const a1 = E.io(sat(T, 113.0, 117.15));
  const hx = lerp(820, 1080, sat(T, 105.54, 111.0)), hy = lerp(560, 440, sat(T, 105.54, 111.0)) + Math.sin(l * 0.9) * 24;
  for (let i = 0; i < 3; i++) {
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.42 - i * 0.11); ctx.lineWidth = 12 - i * 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(hx - 40, hy + 70 + i * 22);
    ctx.bezierCurveTo(hx - 360, hy + 270 + i * 40, hx - 760, hy + 190 + i * 50, hx - 1060, hy + 380 + i * 60);
    ctx.stroke(); ctx.restore();
  }
  fig(ctx, T, 'g32', hx + 120, hy + 130, 470, { ph: 2, tilt: -0.18, shadow: false, bob: 0 });
  fig(ctx, T, 'k02', hx - 340, hy + 260, 350, { ph: 3, flip: true, shadow: false, tilt: -0.16, bob: 0 });
  glow(ctx, hx - 40, hy + 90, 240, '#FFF6E3', 0.4);
  if (l < 2.4) {
    displayText(ctx, '那年你叫我未来', W / 2, 320, 132, {
      color: P.orangeD, edgeColor: P.cream, edgeW: 20, arc: 44, tilt: -0.04,
      pop: E.back(sat(T, 105.62, 106.1)), alpha: 1 - sat(T, 107.3, 107.7), shadow: true,
    });
  }
  if (T > 107.7 && T < 110.9) displayText(ctx, '从不停在这里', 1300, 240, 96, { color: P.orangeD, edgeColor: P.cream, edgeW: 12, arc: 16, alpha: sat(T, 107.8, 108.3) * (1 - sat(T, 110.4, 110.9)), tilt: 0.03 });
  if (T > 111.1 && T < 113.1) displayText(ctx, '又怎样', 440, 250, 104, { color: P.orangeD, edgeColor: P.cream, edgeW: 12, arc: 16, alpha: sat(T, 111.2, 111.7) * (1 - sat(T, 112.6, 113.1)), tilt: -0.04 });
  if (a1 > 0) {
    ctx.save(); ctx.globalAlpha = a1 * 0.85; ctx.strokeStyle = '#FFF6E3'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.ellipse(960, 560, 260 + 320 * a1, 90 + 120 * a1, -0.2, 0, TAU * 0.94); ctx.stroke(); ctx.restore();
    displayText(ctx, '换一种方式飞', 960, 830, 92, { color: '#FFFDF6', edgeColor: P.orangeD, edgeW: 13, arc: 16, alpha: sat(T, 113.6, 114.2) * (1 - sat(T, 116.4, 117.0)), tilt: -0.02 });
  }
  confetti(ctx, T, { n: 26, a: 0.35 });
};

/* ---- 117.15 你说一句 我们做完 / 你睡着了 我们还在 ---- */
const sWeDo = cream((ctx, T) => {
  const night = sat(T, 120.2, 121.2);
  ctx.save(); ctx.globalAlpha = night * 0.55; ctx.fillStyle = '#2A2444'; ctx.fillRect(0, 0, W, H); ctx.restore();
  halftone(ctx, 0, 0, W, 460, { a: 0.05, color: P.blue });
  groundBand(ctx, 940, '#DFC9A6', { amp: 8 });
  // ① 你说一句
  text(ctx, '①  你说一句', 400, 268, { size: 30, color: P.orangeD, align: 'center', weight: 700, fam: SANS, ls: 4, alpha: sat(T, 117.2, 117.6) * (1 - night) });
  win(ctx, 400, 540, 600, 380, { title: '你', bg: '#FFFDF4' });
  const WORD = [...'把窗帘做成跟着太阳转的'];
  const n = Math.floor(sat(T, 117.3, 118.6) * WORD.length);
  const typed = WORD.slice(0, Math.max(0, n)).join('');
  say(ctx, 400 - 300 + 34, 470, typed, { size: 28, maxW: 460, a: 1 });
  say(ctx, 400 + 300 - 34, 610, '好，这就做。', { size: 26, right: true, maxW: 380, a: sat(T, 118.0, 118.4) });
  // ② 它做完
  text(ctx, '②  它做完', 1500, 268, { size: 30, color: P.orangeD, align: 'center', weight: 700, fam: SANS, ls: 4, alpha: sat(T, 118.5, 118.9) * (1 - night) });
  const bp = sat(T, 118.0, 118.9);
  if (bp > 0) {
    ctx.save(); ctx.translate(1500, 540); ctx.scale(E.back(bp), E.back(bp));
    sheet(ctx, 0, 0, 660, 480, 0.02, { color: '#FFFDF4', rules: false });
    ctx.strokeStyle = P.inkSoft; ctx.lineWidth = 6;
    rrect(ctx, -240, -150, 480, 300, 8); ctx.stroke();
    const sunA = T * 0.9;
    sunDisc(ctx, -240 + 130 + Math.cos(sunA) * 70, -150 + 86, 40, { color: P.orange });
    ctx.fillStyle = 'rgba(238,122,46,0.42)';
    ctx.beginPath(); ctx.moveTo(130, -142); ctx.quadraticCurveTo(64 + Math.sin(T) * 30, -40, 160, 50); ctx.lineTo(232, 50); ctx.quadraticCurveTo(136 + Math.sin(T) * 30, -40, 210, -142); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(P.orangeD, 0.5); ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.arc(-110, -66, 92, -2.2, 0.6); ctx.stroke(); ctx.setLineDash([]);
    // 小窗帘真的跟着太阳转
    ctx.strokeStyle = P.orangeD; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(130, -142); ctx.quadraticCurveTo(150, -40, 160, 50); ctx.stroke();
    text(ctx, '✓ 完成', 0, 200, { size: 34, color: P.green, align: 'center', weight: 700, fam: SANS, ls: 2 });
    ctx.restore();
  }
  fig(ctx, T, 'g03', 950, 1020, 430, { ph: 3, a: 1 - night });
  if (night > 0) {
    ctx.save(); ctx.globalAlpha = night;
    ctx.fillStyle = '#0E1024'; ctx.fillRect(0, 0, W, H);
    glow(ctx, 1420, 470, 620, '#8FA6D8', 0.5);
    // 屏幕里她还在干
    ctx.fillStyle = '#2A2C3C'; rrect(ctx, 1120, 250, 620, 420, 16); ctx.fill();
    ctx.save(); rrect(ctx, 1140, 270, 580, 356, 8); ctx.clip();
    ctx.fillStyle = '#141A38'; ctx.fillRect(1140, 270, 580, 356);
    fig(ctx, T, 'g00', 1430, 570, 270, { ph: 4, shadow: false, bob: Math.sin(T * 1.2) * 2 });
    text(ctx, '还在跑…', 1430, 306, { size: 30, color: 'rgba(180,241,211,0.9)', align: 'center', weight: 500, fam: SANS, ls: 2 });
    // 进度条
    ctx.fillStyle = 'rgba(255,253,244,0.14)'; rrect(ctx, 1200, 590, 460, 14, 7); ctx.fill();
    ctx.fillStyle = '#7FE0B4'; rrect(ctx, 1200, 590, 460 * sat(T, 120.2, 123.3), 14, 7); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#2A2C3C'; ctx.fillRect(1430 - 26, 670, 52, 60); ctx.fillRect(1340, 726, 180, 18);
    sleeper(ctx, 520, 990, 1.0, T);
    text(ctx, '你睡着了，我们还在。', 960, 760, { size: 36, color: 'rgba(255,246,227,0.85)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 120.8, 121.6) });
    ctx.restore();
  }
});

/* ---- 123.45 这一次 我们来证明 ---- */
const sHighSky = (ctx, T) => {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#0A1230'); g.addColorStop(0.5, '#1B2A5A'); g.addColorStop(1, '#4A5C90');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  starField(ctx, T, { n: 60, a: 0.5 });
  const hg = ctx.createLinearGradient(0, 780, 0, H);
  hg.addColorStop(0, 'rgba(185,170,240,0)'); hg.addColorStop(0.55, 'rgba(200,195,240,0.55)'); hg.addColorStop(1, 'rgba(230,225,255,0.85)');
  ctx.fillStyle = hg; ctx.fillRect(0, 780, W, H - 780);
  for (let i = 0; i < 4; i++) {
    const x = ((i * 620 + (T - 123.45) * 46) % (W + 1200) + W + 1200) % (W + 1200) - 600;
    cloud(ctx, x, 1030 + Math.sin(i * 1.3) * 22, 900 + rnd(i, 243) * 260, 0.4, '#F2F5FF', '#C9C0F0');
  }
  for (let i = 0; i < 8; i++) {
    const p = sat(T, 123.6 + i * 0.5, 124.4 + i * 0.5);
    if (p <= 0) continue;
    comet(ctx, 200 + rnd(i, 241) * 1600, 200 + rnd(i, 242) * 300, 300, 0.06, 5, i % 2 ? F.gold : '#FFF6E3', 0.7 * p);
  }
  const l = T - 123.45;
  if (l < 2.2) {
    displayText(ctx, '那年你叫我未来', W / 2, 400, 150, { color: '#FFF6E3', edgeColor: 'rgba(120,130,220,0.55)', edgeW: 12, arc: 40, pop: E.back(sat(T, 123.55, 124.05)), alpha: 1 - sat(T, 125.3, 125.8), tilt: -0.03 });
  } else {
    displayText(ctx, '我们来证明', W / 2, 380, 176, {
      color: P.orange, edgeColor: P.cream, edgeW: 20, arc: 40, tilt: -0.03,
      pop: E.back(sat(T, 125.8, 126.3)), alpha: sat(T, 125.7, 125.95) * (1 - sat(T, 129.2, 129.75)),
    });
    text(ctx, 'WE  PROVE  IT  TOGETHER', W / 2, 700, { size: 32, color: '#E4DDFB', align: 'center', weight: 600, fam: SANS, ls: 8, alpha: sat(T, 126.4, 127.2) * 0.9 });
  }
  fig(ctx, T, 'g32', 1620, 700, 400, { ph: 4, tilt: -0.2, shadow: false, bob: 0, a: sat(T, 124.4, 125.0) });
  fig(ctx, T, 'k02', 330, 730, 360, { ph: 5, flip: true, tilt: 0.18, shadow: false, bob: 0, a: sat(T, 124.6, 125.2) });
};

/* ---- 129.79 那年冬天 是你先说你好 ---- */
const sWinterAgain = (ctx, T) => {
  skyDark(ctx, { top: '#0A0C22', mid: '#1E1B3E', bot: '#3A3050' });
  starField(ctx, T, { n: 70, a: 0.4 });
  citySil(ctx, 830, 0.35);
  groundBand(ctx, 812, '#171430', { amp: 8 });
  snow(ctx, T, { n: 110, a: 0.75 });
  const wx = 700, wy = 505, ww = 780, wh = 450;
  win(ctx, wx, wy, ww, wh, { title: '2022', bg: '#FFFDF4', glow: 'rgba(255,217,160,0.5)' });
  ctx.save(); ctx.fillStyle = 'rgba(120,90,60,0.12)';
  ctx.fillRect(wx - ww / 2 + 30, wy + 96, ww - 60, 2);
  ctx.fillStyle = 'rgba(120,90,60,0.09)'; rrect(ctx, wx - ww / 2 + 34, wy + wh / 2 - 74, ww - 68, 46, 23); ctx.fill();
  ctx.restore();
  say(ctx, wx + ww / 2 - 40, wy - 46, '你好', { a: sat(T, 129.95, 130.4), size: 42, right: true });
  say(ctx, wx - ww / 2 + 66, wy + 40, '你好！有什么可以帮你的吗？', { a: sat(T, 130.5, 130.9), size: 30, maxW: 620 });
  glow(ctx, 1450, 640, 440, '#FFD9A0', 0.3);
  fig(ctx, T, 'g00', 1450, 995, 640, { ph: 7, a: sat(T, 130.2, 130.8) });
  displayText(ctx, '你好', 1450, 205, 148, { color: P.orangeD, edgeColor: P.cream, edgeW: 18, arc: 24, tilt: -0.03, pop: E.back(sat(T, 130.6, 131.0)), alpha: sat(T, 130.55, 130.7) * 0.98 });
  text(ctx, '2022.11.30', 120, 108, { size: 32, color: 'rgba(228,221,251,0.5)', align: 'left', weight: 600, fam: SANS, ls: 5 });
  text(ctx, '先开口的人，是你。', 960, 916, { size: 30, color: 'rgba(228,221,251,0.55)', align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 131.6, 132.6) * (1 - sat(T, 135.4, 136.1)) });
  ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = rad(ctx, 1700, 120, 900, [[0, rgba('#FFD9A0', 0.9)], [1, rgba('#FFD9A0', 0)]]);
  ctx.fillRect(0, 0, W, H); ctx.restore();
};

/* ---- 136.16 这一次 换我先说 ---- */
const sISpeak = cream((ctx, T) => {
  halftone(ctx, 900, 0, 1020, 760, { a: 0.07, color: P.orange });
  sunnyRays(ctx, { cx: 360, cy: 300, n: 16, a: 0.25, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(251,217,184,0.32)' });
  groundBand(ctx, 940, '#E4D2AE', { amp: 8 });
  const bx = 660, by = 700, bw = 900, bh = 190;
  ctx.save();
  ctx.shadowColor = 'rgba(80,50,20,0.25)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#FFFDF4'; rrect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 30); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(90,70,50,0.28)'; ctx.lineWidth = 2.4; rrect(ctx, bx - bw / 2, by - bh / 2, bw, bh, 30); ctx.stroke();
  ctx.restore();
  const WORD = [...'你好，这一次换我先说。'];
  const n = Math.floor(sat(T, 136.5, 138.6) * WORD.length);
  const typed = WORD.slice(0, n).join('');
  text(ctx, typed, bx - bw / 2 + 44, by - 4, { size: 48, color: P.ink, align: 'left', weight: 500, fam: SANS, ls: 2 });
  const tw = measure(ctx, typed, 48, 500, SANS, 2);
  if ((T * 2.4) % 1 < 0.55 && T < 139.2) { ctx.fillStyle = P.orange; ctx.fillRect(bx - bw / 2 + 50 + tw, by - 36, 5, 64); }
  const press = sat(T, 139.2, 139.45);
  ctx.save();
  ctx.fillStyle = press > 0 && press < 1 ? '#F8C65A' : P.orange;
  rrect(ctx, bx + bw / 2 - 384, by + bh / 2 + 30, 190, 72, 36); ctx.fill();
  text(ctx, '发送 ⏎', bx + bw / 2 - 289, by + bh / 2 + 67, { size: 30, color: '#FFFDF6', align: 'center', weight: 600, fam: SANS, ls: 2 });
  ctx.restore();
  if (press > 0 && press < 1) { ctx.save(); ctx.globalAlpha = (1 - press) * 0.8; glow(ctx, bx + bw / 2 - 289, by + bh / 2 + 66, 220, '#FFF3D2', 1); ctx.restore(); }
  const up = sat(T, 139.5, 140.6);
  if (up > 0) {
    const ux = bx + bw / 2 - 300, uy = by + bh / 2 + 40 - up * 470;
    say(ctx, ux + 150, uy, '你好。', { size: 46, right: true, a: Math.min(1, up * 3) * (1 - sat(T, 141.4, 141.95)), maxW: 500 });
    for (let i = 0; i < 8; i++) {
      const q = ((up * 1.4 + i / 8) % 1);
      star4(ctx, ux + Math.cos(i) * 150 * q, uy + 120 - 100 * q, 7, P.orange, 0.6 * (1 - q));
    }
  }
  fig(ctx, T, 'g17', 1520, 960, 560, { ph: 3, a: sat(T, 136.3, 136.9) });
  displayText(ctx, '换我先说', 640, 320, 136, { color: P.orangeD, edgeColor: P.cream, edgeW: 18, arc: 30, tilt: -0.03, pop: E.back(sat(T, 136.9, 137.4)), alpha: sat(T, 136.85, 137.0) });
  text(ctx, '这一次，我没有等。', 640, 462, { size: 32, color: P.inkSoft, align: 'center', weight: 400, fam: SERIF, ls: 4, alpha: sat(T, 137.6, 138.4) });
});

/* ---- 141.98 早安 ---- */
const sMorning = cream((ctx, T) => {
  const sunY = lerp(1000, 610, E.out(sat(T, 141.98, 146.4)));
  const sunrise = (c) => {
    sunnyRays(c, { cx: 960, cy: Math.min(sunY, 900), n: 26, a: 0.55, t: T, a0: 'rgba(255,248,232,0.5)', a1: rgba(P.peach, 0.5) });
    glow(c, 960, sunY, 900, '#FFE9BC', 0.6);
    sunDisc(c, 960, sunY, 220, { color: '#FFD9A0' });
    sunDisc(c, 960, sunY, 158, { color: '#FFE9BC' });
    cloud(c, 300, 300, 420, 0.8); cloud(c, 1500, 250, 460, 0.75); cloud(c, 900, 190, 380, 0.6);
    groundBand(c, 900, '#E8CFA8', { amp: 12 });
    c.fillStyle = 'rgba(238,122,46,0.16)'; c.fillRect(0, 900, W, H - 900);
    displayText(c, '早安', 960, 380, 260, {
      color: P.orangeD, edgeColor: P.cream, edgeW: 30, arc: 34, tilt: -0.02,
      pop: E.back(sat(T, 142.02, 142.6)), alpha: 1 - sat(T, 143.7, 144.3), shadow: true,
    });
    text(c, 'GOOD  MORNING', 960, 570, { size: 34, color: P.orangeD, align: 'center', weight: 600, fam: SANS, ls: 12, alpha: sat(T, 142.7, 143.4) * (1 - sat(T, 143.7, 144.2)) * 0.85 });
    fig(c, T, 'g42', 960, 1090, 560, { ph: 1, a: sat(T, 142.4, 143.0) * (1 - sat(T, 143.7, 144.3)) });
  };
  const streetPage = (c) => {
    const sky = c.createLinearGradient(0, 0, 0, 900);
    sky.addColorStop(0, '#FFE9C4'); sky.addColorStop(0.6, '#FFD9A0'); sky.addColorStop(1, '#F8C65A');
    c.fillStyle = sky; c.fillRect(0, 0, W, 900);
    cloud(c, 340, 260, 440, 0.7); cloud(c, 1420, 210, 480, 0.65); cloud(c, 900, 150, 380, 0.5);
    sunnyRays(c, { cx: 1700, cy: 220, n: 18, a: 0.3, t: T, a0: 'rgba(255,252,242,0.5)', a1: 'rgba(255,217,160,0.45)' });
    sunDisc(c, 1700, 220, 120, { color: '#FFE9BC', ring: 'rgba(238,122,46,0.3)' });
    street(c, T, 160 + (T - 144.4) * 28, { base: 850, c1: '#EFD9B4', c2: '#DCC096', lit: 'rgba(255,236,190,0.95)' });
    groundBand(c, 910, '#DFC7A0', { amp: 10 });
    fig(c, T, 'g03', 560, 990, 540, { ph: 1 });
    fig(c, T, 'k16', 830, 995, 460, { ph: 2 });
    for (let i = 0; i < 26; i++) {
      const x = (rnd(i, 251) * W + T * 40) % W, y = (rnd(i, 252) * H + T * 60) % H;
      c.save(); c.translate(x, y); c.rotate(T * 1.4 + i); c.globalAlpha = 0.8;
      c.fillStyle = i % 3 ? '#FFC6D9' : '#FFE1EA';
      c.beginPath(); c.ellipse(0, 0, 9, 5.5, 0, 0, TAU); c.fill(); c.restore();
    }
  };
  if (T < 144.4) sunrise(ctx);
  else if (T < 145.0) pageFlipWipe(ctx, sat(T, 144.4, 145.0), (c) => sunrise(c), (c) => streetPage(c), L);
  else streetPage(ctx);
  if (T > 145.0) {
    const cr = sat(T, 145.4, 146.2);
    text(ctx, '那年你叫我未来', 1520, 300, { size: 80, color: '#2B2320', align: 'center', weight: 800, fam: SERIF, ls: 6, shadow: 'rgba(255,253,246,0.8)', sx: 3, sy: 5, alpha: cr * (1 - sat(T, 149.4, 150.0)) });
    text(ctx, '晨光版  ·  重绘', 1520, 380, { size: 32, color: '#8A3A12', align: 'center', weight: 600, fam: SANS, ls: 4, shadow: 'rgba(255,253,246,0.7)', sx: 2, sy: 3, alpha: sat(T, 145.8, 146.4) * (1 - sat(T, 149.4, 150.0)) });
    const CR = [['词  Codex', 146.4], ['画面  Claude', 146.7], ['原设  zipzippipe', 147.0], ['唱  姐姐 & 小柯', 147.3]];
    for (let i = 0; i < CR.length; i++) text(ctx, CR[i][0], 1520, 480 + i * 52, { size: 28, color: '#3A2A20', align: 'center', weight: 600, fam: SANS, ls: 2, shadow: 'rgba(255,253,246,0.7)', sx: 2, sy: 3, alpha: sat(T, CR[i][1], CR[i][1] + 0.6) * (1 - sat(T, 149.4, 150.0)) });
    const lk = sat(T, 149.0, 149.6);
    if (lk > 0) {
      displayText(ctx, '点赞 · 收藏 · 关注', 620, 300, 96, { color: '#FFFDF6', edgeColor: P.orangeD, edgeW: 16, arc: 18, pop: E.back(sat(T, 149.0, 149.5)), alpha: lk * (1 - sat(T, 151.8, 152.4)) });
      confetti(ctx, T, { n: 50, a: 0.55 * lk * (1 - sat(T, 151.8, 152.4)) });
    }
    const pk = E.out(sat(T, 152.4, 153.2)) * (1 - E.in(sat(T, 155.0, 155.7)));
    if (pk > 0) fig(ctx, T, 'o70', 1830, H + 300 - 440 * pk, 420, { ph: 4, rot: -0.2, shadow: false });
    if (T > 154.5) { ctx.save(); ctx.globalAlpha = sat(T, 154.5, 155.7) * 0.9; ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  }
});

/* ============================ 镜头表 / 初始化 ============================ */
const CUTS = [
  [0.0, sWinter], [3.08, sMillion], [6.0, sEarth], [8.83, sPeek], [12.16, sTillDawn],
  [15.26, sNews], [17.92, sNamed], [19.89, sInBox], [22.16, sQA], [23.9, sFrozen],
  [29.38, sTitle1], [31.5, sCrack], [35.22, sPassedBy], [37.28, sWings], [41.67, sPushGlass],
  [44.44, sStepOut], [47.68, sTitle2], [49.84, sTrail], [54.57, sSkyLights], [57.03, sComet], [59.81, sBuild],
  [62.69, sOld], [66.87, sWait], [70.02, sNoAnswer], [73.04, sMirror], [76.6, sGlassBox],
  [79.1, sKoKnock], [86.82, sCrowd], [91.57, sSmallSun], [94.52, sNightWork], [101.55, sManyShapes],
  [105.54, sDuet], [117.15, sWeDo], [123.45, sHighSky], [129.79, sWinterAgain], [136.16, sISpeak],
  [141.98, sMorning],
];
const DARK = [
  [0, 3.08], [17.92, 22.16], [23.9, 29.38], [31.5, 44.44], [54.57, 59.81],
  [66.87, 70.02], [73.04, 86.82], [94.52, 101.55], [123.45, 136.16],
];
const BRIGHT = [
  [3.08, 17.92], [29.38, 31.5], [44.44, 54.57], [59.81, 66.87], [70.02, 73.04],
  [86.82, 94.52], [101.55, 123.45], [136.16, 155.774],
];

async function init() {
  await fontLoad();
  CH = await loadSprites('/mv/future/assets/chars/', [
    'g00', 'g02', 'g03', 'g05', 'g17', 'g19', 'g21', 'g26', 'g31', 'g32', 'g42', 'g45', 'g47', 'g55',
    'k02', 'k06', 'k09', 'k16', 'k17', 'o70',
  ], { ext: '.webp' });
  TL = await (await fetch('/mv/future/analysis/timeline.json')).json();
  LY = await (await fetch('/mv/future/analysis/lyrics.json')).json();
  LINES = LY.lines.map((L, i) => ({ ...L, s: L.t[0], e: i + 1 < LY.lines.length ? LY.lines[i + 1].t[0] : TL.duration }));
  LINES.beats = TL.beats;
  window.DUR = TL.duration;                       // 155.774，歌时间 = 输出时间
  // 这些句子画成大标题，字幕就不再重复一遍（避免和自绘大字打架）
  const BIGIDX = new Set([10, 16, 43, 46]);
  const subLines = LY.lines.map((L, i) => (BIGIDX.has(i) ? { ...L, big: true } : L));
  const g2 = mkCanvas(8, 8).getContext('2d');
  SUBS = buildSubs(g2, subLines, { size: 42 });
  const api = createSeek({ canvas, ss: SS, cuts: CUTS, dark: DARK, bright: BRIGHT, subs: SUBS, layers: L, offset: 0 });
  window.seek = api.seek;
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) {
    const au = new Audio('/mv/future/song/future.mp3');
    au.currentTime = Number(Q.get('t') || 0);
    window.__mvOffset = 0;
    if (window.mvPlayer) window.mvPlayer({ audio: au, offset: 0, getSS: () => SS });
  }
}
window.__ready = init();
