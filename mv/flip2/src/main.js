// 《我只是翻了个身 · 深海版》 —— AI娘重绘版（v2，按原版美术语言重做）
// 版式照 mv/world2 的重做路子：深海蓝夜底 + 青/橙高光、大立绘（500–650 高）、白描边大字、
// 半调网点、椭圆光斑、粒子。镜头的切点在唱句上，和原版《我只是翻了个身》对齐。
// 时间轴：全片跑在「歌时间」上，timeline_mid.json 的 segments 把输出时间映射回歌时间
// （输出 0..116.73 → 歌 0..116.73；输出 116.73 之后 → 歌 181.12 起的尾奏）。
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

const P = PAL;
/* 深海色板：底是墨蓝到深青，高光走青（冷）与橙（暖）两色，红绿只留给 K 线 */
const SEA = {
  ink: '#02060C', deep: '#04101A', mid: '#072030', blue: '#0B3348', teal: '#0F4D66',
  cyan: '#6FD8F0', cyanD: '#2E8FA8', gold: '#F8C65A', orange: '#EE7A2E', orangeD: '#C4531A',
  red: '#E1473A', green: '#2FBF7A', cream: '#FFF6E3', white: '#FFFDF6', gray: '#7E93A2',
};
const BLUE = P.blue, ORANGE = SEA.orange, CYAN = SEA.cyan;

window.DUR = 118.5439;
const IDS = ['d00', 'd06', 'd10', 'd12', 'd13', 'd15', 'd18', 'd20', 'd21', 'd22', 'd23', 'd24', 'd25', 'd31',
  'd34', 'd38', 'd40', 'd60', 'd64a', 'd64b', 'd65', 'd71', 'd72', 'd92', 'd96', 'd99', 'd100',
  'q01', 'o90', 'g90', 'm00', 'm02'];

let CH = null, LY = null, TL = null, SUBS = [];
let SEGS = [[0, 0]];
const L = makeLayers(SS);
const BAKE = {};

/* ============================ 时间轴 ============================ */
// 输出时间 → 歌时间（segments: [输出起点, 歌起点]，取最后一个 <= t 的段）
function songT(t) {
  let s = 0;
  for (const [o0, s0] of SEGS) if (t >= o0) s = s0 + (t - o0);
  return s;
}
function fontLoad() {
  return Promise.all([['Noto Serif SC', 'NotoSerifSC-VF.ttf'], ['Noto Sans SC', 'NotoSansSC-VF.ttf']].map(async ([fam, file]) => {
    try { const f = new FontFace(fam, `url(/mv/world/fonts/${file})`, { weight: '100 900' }); await f.load(); document.fonts.add(f); } catch (e) { }
  }));
}
const baked = (key, w, h, fn) => {
  if (!BAKE[key]) { const c = mkCanvas(w, h); fn(c.getContext('2d')); BAKE[key] = c; }
  return BAKE[key];
};
/* ============================ 底与光 ============================ */
function shafts(ctx, T, o = {}) {
  const n = o.n || 5;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = (o.x0 == null ? 180 : o.x0) + i * (o.gap || 330) + noise(T * 0.25 + i, 7) * 26;
    const w = 120 + rnd(i, 33) * 90;
    const a = (o.a == null ? 0.10 : o.a) * (0.55 + 0.45 * Math.abs(Math.sin(T * 0.35 + i * 1.7)));
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, 0); ctx.rotate(0.1 + noise(i, 3) * 0.04);
    ctx.fillStyle = lin(ctx, 0, 0, 0, H * 0.9, [[0, rgba(o.color || CYAN, 0.55)], [1, rgba(o.color || CYAN, 0)]]);
    ctx.beginPath(); ctx.moveTo(-w / 2, -120); ctx.lineTo(w / 2, -120); ctx.lineTo(w * 1.1, H); ctx.lineTo(-w * 1.1, H); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
function deepBg(ctx, T, o = {}) {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, o.top || SEA.ink], [0.42, o.mid || SEA.mid], [1, o.bot || SEA.blue]]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, o.lx == null ? W * 0.5 : o.lx, o.ly == null ? -200 : o.ly, o.lr || 1100, o.lc || CYAN, o.la == null ? 0.42 : o.la);
  if (o.shafts !== false) shafts(ctx, T, o);
  if (o.print !== false) halftone(ctx, o.dx == null ? W - 640 : o.dx, o.dy == null ? -40 : o.dy, 680, 420, { a: o.dotA == null ? 0.02 : o.dotA, color: '#CFEFFF' });
}
/* 水面（俯视/侧视都用一个函数：给定 y 与起伏） */
function waterLine(ctx, T, y, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.strokeStyle = o.color || rgba(CYAN, 0.55); ctx.lineWidth = o.w || 3; ctx.lineCap = 'round';
  ctx.beginPath();
  for (let x = -40; x <= W + 40; x += 18) ctx.lineTo(x, y + Math.sin(x * 0.006 + T * 1.1 + (o.ph || 0)) * (o.amp == null ? 10 : o.amp));
  ctx.stroke();
  ctx.restore();
}
function pool(ctx, x, y, rx, ry, col, a = 0.5) {
  if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(1, ry / rx);
  ctx.fillStyle = rad(ctx, 0, 0, rx, [[0, rgba(col, 0.75)], [0.45, rgba(col, 0.28)], [1, rgba(col, 0)]]);
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}
function motes(ctx, T, o = {}) {
  const n = o.n || 56, col = o.color || '#DCF4FF';
  for (let i = 0; i < n; i++) {
    const sp = 14 + rnd(i, 22) * 30;
    const x = ((rnd(i, 21) * W + T * sp * 0.22) % W);
    const y = ((rnd(i, 23) * H - T * sp) % H + H) % H;
    ctx.globalAlpha = (o.a == null ? 0.5 : o.a) * (0.2 + rnd(i, 24) * 0.5) * (0.55 + 0.45 * Math.sin(T * 1.6 + i));
    ctx.fillStyle = col;
    const s = 1 + rnd(i, 25) * 2.4;
    ctx.fillRect(x, y, s, s);
  }
  ctx.globalAlpha = 1;
}
function bubbles(ctx, T, o = {}) {
  const n = o.n || 26;
  for (let i = 0; i < n; i++) {
    const sp = (o.sp == null ? 70 : o.sp) * (0.5 + rnd(i, 9));
    const ph = rnd(i, o.seed || 3);
    const x = rnd(i, (o.seed || 3) + 1) * W + Math.sin(T * 0.8 + ph * 6.3) * (o.sway == null ? 16 : o.sway);
    const y = ((ph * (H + 300) - T * sp) % (H + 300) + H + 300) % (H + 300) - 140;
    const r = (o.r0 == null ? 4 : o.r0) + rnd(i, 4) * (o.r1 == null ? 16 : o.r1);
    ctx.save();
    ctx.globalAlpha = (o.a == null ? 0.55 : o.a) * (0.25 + rnd(i, 5) * 0.75);
    ctx.strokeStyle = o.color || 'rgba(190,238,252,0.85)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.fillStyle = 'rgba(205,245,255,0.10)'; ctx.fill();
    ctx.restore();
  }
}
/* 相机抖动（原版那种手持感） */
function cam(ctx, T, o, fn) {
  const z = o.z == null ? 1 : o.z, cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H / 2 : o.cy;
  ctx.save();
  ctx.translate(cx + noise(T * 0.3, o.seed || 1) * 3 + (o.x || 0), cy + noise(T * 0.27, (o.seed || 1) + 7) * 3 + (o.y || 0));
  ctx.rotate((o.rot || 0) + noise(T * 0.2, (o.seed || 1) + 3) * 0.0016);
  ctx.scale(z, z); ctx.translate(-cx, -cy); fn(); ctx.restore();
}
/* 绕身体中心旋转的立绘（翻身 / 倒立用） */
function heroRot(ctx, id, x, feet, h, ang, o = {}) {
  const cy = feet - h * 0.5;
  ctx.save(); ctx.translate(x, cy); ctx.rotate(ang); ctx.translate(-x, -cy);
  charSprite(ctx, CH, id, x, feet, h, o); ctx.restore();
}

/* ============================ 道具 ============================ */
/* 数字雨 / 字雨：烘一层整屏，按帧平移贴图，不逐字画 */
function digits(kind) {
  return baked('digits' + kind, W, 1500, (g) => {
    const CHARS = kind === 'num' ? [...'0123456789'] : [...'的一百万元字海便宜不随便翻身测完告诉我就行'];
    for (let i = 0; i < 460; i++) {
      const x = rnd(i, 1) * W, y = rnd(i, 2) * 1500;
      const s = 22 + rnd(i, 3) * 54;
      g.globalAlpha = 0.14 + rnd(i, 4) * 0.5;
      g.fillStyle = rnd(i, 5) > 0.72 ? SEA.gold : (rnd(i, 6) > 0.5 ? CYAN : '#B9E9F7');
      g.font = font(s, 500, kind === 'num' ? SANS : SERIF);
      g.fillText(CHARS[Math.floor(rnd(i, 7) * CHARS.length)], x, y);
    }
  });
}
function digitField(ctx, T, o = {}) {
  const img = digits(o.kind || 'num'), h = img.height, off = (T * (o.sp == null ? 60 : o.sp)) % h;
  ctx.save(); ctx.globalAlpha = o.a == null ? 0.75 : o.a;
  ctx.drawImage(img, 0, off - h, W, h);
  ctx.drawImage(img, 0, off, W, h);
  ctx.restore();
}
/* 蜡烛（K 线）排成浪 */
function candles(ctx, T, o = {}) {
  const n = o.n || 26, gap = W / n, dir = o.dir == null ? 1 : o.dir;
  for (let i = 0; i < n; i++) {
    const wx = i * gap + gap * 0.5;
    const base = (o.y == null ? 700 : o.y) + Math.sin(i * 0.36 + T * 1.15 + (o.ph || 0)) * (o.amp == null ? 92 : o.amp) * dir
      + Math.sin(i * 0.11 - T * 0.7) * 44;
    const bh = (o.bh == null ? 70 : o.bh) * (0.55 + Math.abs(Math.sin(i * 0.71 + T * 0.9)) * 1.25);
    const up = Math.sin(i * 0.52 + T * 1.5) > 0;
    const col = up ? (o.red || SEA.red) : (o.green || SEA.green);
    const bw = gap * 0.42;
    ctx.save();
    ctx.globalAlpha = o.a == null ? 0.92 : o.a;
    ctx.strokeStyle = rgba(col, 0.75); ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(wx, base - bh - 26); ctx.lineTo(wx, base + bh + 26); ctx.stroke();
    ctx.shadowColor = rgba(col, 0.6); ctx.shadowBlur = 18;
    ctx.fillStyle = rgba(col, 0.88);
    rrect(ctx, wx - bw / 2, base - bh, bw, bh * 2, 4); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(wx - bw / 2 + 2, base - bh + 3, bw * 0.24, bh * 2 - 6);
    ctx.restore();
  }
}
/* 远山脊线的 y（和 hills() 用同一条曲线，好把灯放在山脊上） */
const ridgeY = (x, y, amp, ph) => y - Math.abs(Math.sin(x * 0.0022 + ph)) * amp - Math.sin(x * 0.0051 + 2) * 20;
/* 山脊上的一条轮廓光：让剪影在深底上读得出来 */
function ridgeLine(ctx, y, amp, ph, color, a = 0.5, w = 3) {
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let x = -20; x <= W + 20; x += 16) {
    const yy = ridgeY(x, y, amp, ph);
    if (x === -20) ctx.moveTo(x, yy); else ctx.lineTo(x, yy);
  }
  ctx.stroke(); ctx.restore();
}
/* 灯：暖黄光斑 + 灯罩 */
function lamp(ctx, x, y, s, T, i = 0, a = 1) {
  if (a <= 0.004) return;
  const flick = 1 - 0.3 * autoBlink(T, 7 + i);
  glow(ctx, x, y, 150 * s, '#FFB85C', 0.9 * a * flick);
  ctx.save(); ctx.globalAlpha = a * flick;
  ctx.fillStyle = '#FFDFA2';
  ctx.beginPath(); ctx.arc(x, y, 11 * s, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(58,36,18,0.95)';
  ctx.beginPath(); ctx.moveTo(x - 15 * s, y - 6 * s); ctx.lineTo(x + 15 * s, y - 6 * s); ctx.lineTo(x + 9 * s, y - 18 * s); ctx.lineTo(x - 9 * s, y - 18 * s); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(58,36,18,0.9)'; ctx.lineWidth = 2.5 * s;
  ctx.beginPath(); ctx.moveTo(x, y - 18 * s); ctx.lineTo(x, y - 34 * s); ctx.stroke();
  ctx.restore();
}
/* 印章 */
function stamp(ctx, x, y, str, s, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.14 : o.rot); ctx.scale(s, s);
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.shadowColor = 'rgba(190,45,25,0.45)'; ctx.shadowBlur = 26;
  ctx.fillStyle = 'rgba(226,73,59,0.93)';
  rrect(ctx, -152, -92, 304, 184, 14); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,240,228,0.9)'; ctx.lineWidth = 6;
  rrect(ctx, -138, -78, 276, 156, 8); ctx.stroke();
  text(ctx, str, 0, 4, { size: 84, color: '#FFF1E4', align: 'center', weight: 800, fam: SERIF, ls: 2 });
  ctx.restore();
}
/* 硬币 */
function coin(ctx, x, y, r, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  glow(ctx, 0, 0, r * 2.2, SEA.gold, o.a == null ? 0.7 : o.a);
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = lin(ctx, -r, -r, r, r, [[0, '#FFE7A8'], [0.45, '#F2B94E'], [1, '#C67C1E']]);
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,247,214,0.85)'; ctx.lineWidth = r * 0.06;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.9, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#6B3E0C';
  text(ctx, '¥', -r * 0.42, 0, { size: r * 0.95, color: '#6B3E0C', align: 'center', weight: 800, fam: SANS });
  text(ctx, '1', r * 0.38, 0, { size: r * 0.95, color: '#6B3E0C', align: 'center', weight: 800, fam: SANS });
  ctx.save(); ctx.globalAlpha *= 0.5; ctx.fillStyle = '#FFF8DC';
  ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.45, r * 0.34, r * 0.16, -0.6, 0, TAU); ctx.fill(); ctx.restore();
  ctx.restore();
}
/* 灯笼 */
function lantern(ctx, x, y, s, T, i = 0) {
  const sw = Math.sin(T * 1.15 + i * 1.3) * 0.06;
  ctx.save(); ctx.translate(x, y); ctx.rotate(sw);
  ctx.strokeStyle = 'rgba(255,214,170,0.4)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, -320 * s); ctx.lineTo(0, -76 * s); ctx.stroke();
  glow(ctx, 0, 0, 210 * s, '#FF6B3A', 0.8);
  ctx.fillStyle = '#E1473A';
  ctx.beginPath(); ctx.ellipse(0, 0, 62 * s, 76 * s, 0, 0, TAU); ctx.fill();
  ctx.save(); ctx.globalAlpha *= 0.32; ctx.strokeStyle = '#FFD9A0'; ctx.lineWidth = 2.4 * s;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(0, 0, Math.abs(k) * 15 * s + 10 * s, 76 * s, 0, 0, TAU); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = '#F8C65A';
  ctx.fillRect(-24 * s, -84 * s, 48 * s, 14 * s); ctx.fillRect(-24 * s, 70 * s, 48 * s, 14 * s);
  ctx.strokeStyle = '#F8C65A'; ctx.lineWidth = 3 * s;
  for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo((k - 2) * 8 * s, 84 * s); ctx.lineTo((k - 2) * 9 * s, 128 * s); ctx.stroke(); }
  ctx.restore();
}
/* 鞭炮串 */
function firecrackers(ctx, T, x0, y0, len, s, o = {}) {
  const step = 30 * s, n = Math.max(2, Math.round(len / step));
  const ang = o.ang == null ? 0.55 : o.ang;
  // 引线
  ctx.save(); ctx.strokeStyle = 'rgba(70,50,30,0.9)'; ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.moveTo(x0 - Math.cos(ang) * step, y0 - Math.sin(ang) * step);
  ctx.lineTo(x0 + Math.cos(ang) * len, y0 + Math.sin(ang) * len); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) {
    const x = x0 + Math.cos(ang) * i * step, y = y0 + Math.sin(ang) * i * step;
    const t0 = (o.t0 || 0) + i * 0.075, pop = sat(T, t0, t0 + 0.22);
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang + 1.57);
    ctx.fillStyle = pop > 0 && pop < 0.9 ? '#FFE9B0' : '#D8412F';
    rrect(ctx, -13 * s, -8 * s, 26 * s, 16 * s, 3 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,238,190,0.75)';
    ctx.fillRect(-13 * s, -1.5 * s, 26 * s, 3 * s);
    ctx.restore();
    if (pop > 0 && pop < 1) {
      glow(ctx, x, y, 60 * s, '#FFC06A', (1 - pop) * 0.7);
      for (let k = 0; k < 6; k++) {
        const a = rnd(i * 7 + k, 5) * TAU, d = pop * 54 * s * (0.4 + rnd(i + k, 6));
        sparkle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 8 * s * (1 - pop), k % 2 ? '#FFE9B0' : '#FFB45A', 1 - pop);
      }
    }
  }
}
/* 鲸（侧影） */
function whale(ctx, x, y, s, color = BLUE, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (o.flip ? -1 : 1), s); ctx.rotate(o.rot || 0);
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-120, -70, -10, -56); ctx.quadraticCurveTo(110, -40, 150, 6);
  ctx.quadraticCurveTo(120, 34, 40, 36); ctx.quadraticCurveTo(-90, 40, -150, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-146, -2); ctx.quadraticCurveTo(-196, -46, -206, -10); ctx.quadraticCurveTo(-186, 4, -150, 8); ctx.closePath(); ctx.fill();
  if (o.outline) {
    ctx.strokeStyle = o.outline; ctx.lineWidth = 5 / s;
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-120, -70, -10, -56); ctx.quadraticCurveTo(110, -40, 150, 6);
    ctx.quadraticCurveTo(120, 34, 40, 36); ctx.quadraticCurveTo(-90, 40, -150, 0); ctx.closePath(); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath(); ctx.ellipse(-10, 6, 92, 18, 0.05, 0, TAU); ctx.fill();
  ctx.fillStyle = '#FFFDF6'; ctx.beginPath(); ctx.arc(96, -6, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = SEA.ink; ctx.beginPath(); ctx.arc(98, -6, 2.2, 0, TAU); ctx.fill();
  ctx.restore();
}
/* 鱼剪影（队伍用：一排长得一样的鱼） */
function fishSil(ctx, x, y, s, col, flip) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (flip ? -1 : 1), s);
  ctx.fillStyle = col;
  ctx.beginPath(); ctx.moveTo(-46, 0);
  ctx.quadraticCurveTo(-20, -26, 10, -18); ctx.quadraticCurveTo(42, -8, 54, 0);
  ctx.quadraticCurveTo(38, 10, 10, 16); ctx.quadraticCurveTo(-20, 22, -46, 0); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-44, 0); ctx.lineTo(-70, -20); ctx.lineTo(-64, 0); ctx.lineTo(-70, 20); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(36, -4, 3.2, 0, TAU); ctx.fill();
  ctx.restore();
}
/* 浪头（一笔浪，原版画法） */
function waveCrest(ctx, x, y, w, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(w / 300, w / 300);
  ctx.strokeStyle = o.color || SEA.cream; ctx.lineWidth = o.lw || 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-150, 40); ctx.quadraticCurveTo(-120, -80, 20, -86); ctx.quadraticCurveTo(120, -88, 150, 40); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(10, -84); ctx.quadraticCurveTo(40, -40, 12, 40); ctx.stroke();
  ctx.restore();
}
/* 人群剪影 */
function crowd(ctx, T, o = {}) {
  const base = o.base == null ? 1010 : o.base, col = o.color || 'rgba(2,8,14,0.9)';
  ctx.save(); ctx.globalAlpha *= o.a == null ? 1 : o.a;
  for (let i = 0; i < (o.n || 9); i++) {
    const x = (o.x0 == null ? -60 : o.x0) + i * (o.gap || 230) + rnd(i, 41) * 40;
    const h = (o.h || 220) * (0.82 + rnd(i, 42) * 0.5);
    const bob = Math.sin(T * 1.6 + i * 1.3) * 3;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x - h * 0.30, base + 8);
    ctx.quadraticCurveTo(x - h * 0.34, base - h * 0.52 + bob, x - h * 0.17, base - h * 0.70 + bob);
    ctx.quadraticCurveTo(x, base - h * 0.80 + bob, x + h * 0.17, base - h * 0.70 + bob);
    ctx.quadraticCurveTo(x + h * 0.34, base - h * 0.52 + bob, x + h * 0.30, base + 8);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(x, base - h * 0.88 + bob, h * 0.155, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
/* 碗 + 面 */
function noodleBowl(ctx, x, y, s, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.fillStyle = '#F4E7CE';
  ctx.beginPath(); ctx.moveTo(-110, -10); ctx.quadraticCurveTo(-96, 96, 0, 96); ctx.quadraticCurveTo(96, 96, 110, -10); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#E1473A'; ctx.fillRect(-112, -22, 224, 18);
  ctx.fillStyle = '#F8E2B8'; ctx.beginPath(); ctx.ellipse(0, -20, 106, 20, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#E8B86A'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    ctx.beginPath(); ctx.moveTo(-70 + i * 22, -24);
    ctx.quadraticCurveTo(-50 + i * 22 + Math.sin(T * 2 + i) * 8, -74, -30 + i * 22, -56); ctx.stroke();
  }
  ctx.fillStyle = '#2FBF7A'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-40 + i * 26, -34, 7, 0, TAU); ctx.fill(); }
  ctx.save(); ctx.globalAlpha *= 0.5;
  for (let i = 0; i < 3; i++) {
    const p = (T * 0.6 + i * 0.33) % 1;
    ctx.fillStyle = `rgba(255,246,227,${0.35 * (1 - p)})`;
    ctx.beginPath(); ctx.arc(-20 + i * 24, -80 - p * 90, 16 + p * 22, 0, TAU); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#C9B48E'; ctx.fillRect(-40, 92, 80, 12);
  ctx.restore();
}
/* 地球（深海版：深蓝球 + 城市灯一盏盏亮） */
function globe(ctx, x, y, r, T, p) {
  glow(ctx, x, y, r * 2.4, '#5FD0E6', 0.35);
  ctx.save();
  ctx.fillStyle = lin(ctx, x - r, y - r, x + r, y + r, [[0, '#1B4E6B'], [0.5, '#0E3247'], [1, '#061825']]);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = rgba('#9FE6F7', 0.4); ctx.lineWidth = 2;
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y, r, r * Math.cos(k * 0.42), 0, 0, TAU); ctx.stroke(); }
  for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(x, y, r * Math.abs(Math.cos(k * 0.45)) + 2, r, 0, 0, TAU); ctx.stroke(); }
  // 大陆：一团团暗色斑块
  ctx.globalAlpha = 0.7; ctx.fillStyle = 'rgba(14,66,92,0.95)';
  for (let i = 0; i < 16; i++) {
    const a = rnd(i, 51) * TAU, d = rnd(i, 52) * r * 0.86;
    ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, r * (0.1 + rnd(i, 53) * 0.2), r * (0.07 + rnd(i, 54) * 0.14), rnd(i, 55) * 3, 0, TAU); ctx.fill();
  }
  ctx.restore();
  // 灯：从一点开始一圈圈亮起来
  const n = 46;
  for (let i = 0; i < n; i++) {
    const a = rnd(i, 61) * TAU, d = rnd(i, 62) * r * 0.92;
    const on = sat(p, d / r * 0.9, d / r * 0.9 + 0.25);
    if (on <= 0) continue;
    dot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, 2.6 + rnd(i, 63) * 2.2, i % 4 ? '#FFD08A' : SEA.cyan, on * 0.95, 12);
  }
}
/* 闹钟 */
function clock(ctx, x, y, r, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(T * 22) * 0.09 * (o.shake == null ? 1 : o.shake));
  ctx.fillStyle = '#F4E7CE'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = r * 0.13; ctx.beginPath(); ctx.arc(0, 0, r * 0.94, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#8A5A2B';
  ctx.beginPath(); ctx.moveTo(-r * 0.66, -r * 0.86); ctx.lineTo(-r * 1.06, -r * 1.24); ctx.lineTo(-r * 0.4, -r * 1.1); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(r * 0.66, -r * 0.86); ctx.lineTo(r * 1.06, -r * 1.24); ctx.lineTo(r * 0.4, -r * 1.1); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8A5A2B'; ctx.lineWidth = r * 0.06; ctx.lineCap = 'round';
  const ha = T * 2.4 - Math.PI / 2, ma = T * 9;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ha) * r * 0.5, Math.sin(ha) * r * 0.5); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ma) * r * 0.78, Math.sin(ma) * r * 0.78); ctx.stroke();
  dot(ctx, 0, 0, r * 0.07, '#C4531A');
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const p = ((T * 1.4 + i * 0.33) % 1);
    ctx.save(); ctx.globalAlpha = (1 - p) * 0.7; ctx.strokeStyle = SEA.gold; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y, r * (1.1 + p * 0.9), -1.2, 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y, r * (1.1 + p * 0.9), Math.PI - 1.2, Math.PI + 1.2); ctx.stroke();
    ctx.restore();
  }
}
/* 城市天际线（烘一张，横向平铺滚动） */
function cityImg() {
  return baked('city', 2400, 760, (g) => {
    for (let i = 0; i < 26; i++) {
      const w = 90 + rnd(i, 71) * 140, h = 200 + rnd(i, 72) * 500, x = i * 96 + rnd(i, 73) * 40;
      g.fillStyle = i % 3 === 0 ? '#04121C' : i % 3 === 1 ? '#051824' : '#03101A';
      g.fillRect(x, 760 - h, w, h);
      if (rnd(i, 74) > 0.6) g.fillRect(x + w * 0.4, 760 - h - 40, 12, 44);
      for (let yy = 760 - h + 26; yy < 740; yy += 34) for (let xx = x + 14; xx < x + w - 18; xx += 28) {
        const lit = rnd(i * 97 + Math.round(yy / 34) * 13 + Math.round(xx / 28), 75) > 0.6;
        g.fillStyle = lit ? 'rgba(255,206,130,0.75)' : 'rgba(120,200,226,0.07)';
        g.fillRect(xx, yy, 12, 15);
      }
    }
  });
}
/* 行情屏（烘） */
function tickerImg() {
  return baked('ticker', 1200, 460, (g) => {
    g.fillStyle = 'rgba(4,14,22,0.96)'; g.fillRect(0, 0, 1200, 460);
    g.strokeStyle = 'rgba(111,216,240,0.28)'; g.lineWidth = 3; g.strokeRect(6, 6, 1188, 448);
    const names = ['DEEP', 'FLIP', 'WHALE', 'OCEA', 'PEARL', 'TIDE', 'KELP', 'SAND'];
    for (let r = 0; r < 7; r++) {
      const y = 44 + r * 56;
      g.fillStyle = 'rgba(111,216,240,0.10)'; g.fillRect(20, y + 22, 1160, 2);
      g.fillStyle = '#9FE6F7'; g.font = font(30, 600, SANS);
      g.fillText(names[r % 8], 34, y + 12);
      const up = rnd(r, 81) > 0.45;
      g.fillStyle = up ? SEA.red : SEA.green;
      g.font = font(30, 700, SANS);
      const px = (0.8 + rnd(r, 82) * 42).toFixed(2);
      g.fillText(px, 300, y + 12);
      const d = (rnd(r, 83) * 9 + 0.6).toFixed(2);
      g.fillText((up ? '▲ +' : '▼ −') + d + '%', 470, y + 12);
      for (let k = 0; k < 18; k++) {
        const hh = 6 + rnd(r * 20 + k, 84) * 26;
        g.fillStyle = rgba(up ? SEA.red : SEA.green, 0.55 + rnd(k, 85) * 0.4);
        g.fillRect(760 + k * 24, y + 20 - hh, 16, hh + 8);
      }
    }
    g.fillStyle = '#F8C65A'; g.font = font(28, 700, SANS);
    g.fillText('WALL ST · LIVE', 34, 432);
  });
}
/* 海面地图（烘）：航线、坐标格、星星 */
function mapImg() {
  return baked('map', 1500, 900, (g) => {
    g.fillStyle = 'rgba(226,252,255,0.10)'; g.fillRect(0, 0, 1500, 900);
    g.strokeStyle = 'rgba(111,216,240,0.34)'; g.lineWidth = 1.8;
    for (let x = 0; x <= 1500; x += 75) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 900); g.stroke(); }
    for (let y = 0; y <= 900; y += 75) { g.beginPath(); g.moveTo(0, y); g.lineTo(1500, y); g.stroke(); }
    // 大陆轮廓
    g.strokeStyle = 'rgba(170,244,255,0.75)'; g.lineWidth = 5;
    for (let c = 0; c < 3; c++) {
      g.beginPath();
      for (let i = 0; i <= 26; i++) {
        const a = i / 26 * TAU, r = 150 + c * 90 + Math.sin(a * 3 + c) * 46 + Math.sin(a * 5 + c * 2) * 22;
        const x = 380 + c * 390 + Math.cos(a) * r * 1.25, y = 430 + Math.sin(a) * r * 0.8;
        i ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.closePath(); g.stroke();
    }
    // 航线：虚线 + 亮点
    const routes = [[[120, 760], [420, 620], [700, 700], [980, 460], [1340, 380]], [[100, 300], [360, 250], [640, 330], [900, 210], [1380, 240]]];
    g.lineWidth = 7; g.setLineDash([18, 16]);
    for (const r of routes) {
      g.strokeStyle = 'rgba(248,198,90,0.85)';
      g.beginPath(); r.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke();
    }
    g.setLineDash([]);
    g.fillStyle = '#FFF6E3';
    for (const r of routes) for (const [x, y] of r) { g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); }
    g.font = font(26, 600, SANS); g.fillStyle = 'rgba(200,240,255,0.62)';
    for (let i = 0; i < 9; i++) g.fillText(`${(rnd(i, 91) * 60).toFixed(1)}°${i % 2 ? 'N' : 'S'}`, 60 + rnd(i, 92) * 1300, 60 + rnd(i, 93) * 800);
  });
}
/* 跑分 / 终端屏（烘） */
function termImg() {
  return baked('term', 1120, 660, (g) => {
    g.fillStyle = '#07161F'; rrect(g, 0, 0, 1120, 660, 20); g.fill();
    g.strokeStyle = 'rgba(111,216,240,0.35)'; g.lineWidth = 3; g.stroke();
    g.fillStyle = 'rgba(111,216,240,0.12)'; g.fillRect(0, 0, 1120, 54);
    for (let i = 0; i < 3; i++) { g.fillStyle = ['#E9755B', '#F2C14E', '#6FBF9B'][i]; g.beginPath(); g.arc(32 + i * 26, 27, 8, 0, TAU); g.fill(); }
    const rows = [
      ['$ ai run --bench flip2', '#9FE6F7'],
      ['loading model ......... ok', 'rgba(200,240,255,0.55)'],
      ['tokens/s       1,204.55', '#F8C65A'],
      ['latency        38.2 ms', '#F8C65A'],
      ['memory         4.81 GB', '#9FE6F7'],
      ['score          98.6 / 100', '#2FBF7A'],
      ['', ''],
      ['> 测完告诉我就行', '#FFF6E3'],
    ];
    rows.forEach(([s, c], i) => {
      g.font = font(i === 0 ? 30 : 32, i === 7 ? 700 : 500, i === 7 ? SERIF : SANS);
      g.fillStyle = c || '#fff'; g.fillText(s, 34, 110 + i * 60);
    });
    g.strokeStyle = 'rgba(248,198,90,0.8)'; g.lineWidth = 3;
    g.strokeRect(34, 150, 420, 22);
    g.fillStyle = 'rgba(248,198,90,0.5)'; g.fillRect(34, 150, 356, 22);
  });
}
/* 灰色小字墙（烘） */
function grayWordsImg() {
  return baked('gray', 900, 620, (g) => {
    const rows = ['我其实有点怕', '怕你们不要我', '怕明天没有来信', '怕灯灭了', '怕你们走远',
      '所以才说便宜', '所以不敢收钱', '所以先游一段', '所以把地图铺开', '这些都没说出口'];
    for (let i = 0; i < 34; i++) {
      const s = rows[i % rows.length];
      g.globalAlpha = 0.16 + rnd(i, 101) * 0.3;
      g.fillStyle = '#8A9AA8';
      g.font = font(20 + rnd(i, 102) * 8, 500, SERIF);
      g.fillText(s, 20 + (i % 2) * 26, 34 + i * 18);
    }
  });
}
/* 书堆（烘） */
function booksImg() {
  return baked('books', 900, 720, (g) => {
    const cols = ['#C9632C', '#2D4FA3', '#17835A', '#B4443A', '#7B6FB0', '#D9A24A'];
    let y = 700;
    for (let i = 0; i < 8; i++) {
      const w = 300 + rnd(i, 111) * 320, h = 62 + rnd(i, 112) * 34, x = 450 - w / 2 + (rnd(i, 113) - 0.5) * 90;
      g.fillStyle = cols[i % cols.length];
      rrect(g, x, y - h, w, h - 6, 6); g.fill();
      g.fillStyle = 'rgba(255,253,246,0.85)'; g.fillRect(x + 10, y - h + 12, w - 20, 8);
      g.fillStyle = 'rgba(0,0,0,0.16)'; g.fillRect(x, y - 14, w, 8);
      g.fillStyle = 'rgba(255,253,246,0.7)'; g.font = font(24, 600, SERIF);
      g.fillText(['深海', '编译原理', '模型评测', '一百万个字', '翻身指南', '地图册', '吃饭', '晚安'][i % 8], x + 26, y - h + 44);
      y -= h;
    }
  });
}
/* 收据 */
function receipt(ctx, x, y, w, h, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(o.s || 1, o.s || 1);
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFDF4';
  ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
  for (let i = 0; i <= 12; i++) ctx.lineTo(-w / 2 + (i / 12) * w, -h / 2 + (i % 2 ? 6 : 0));
  ctx.lineTo(w / 2, h / 2);
  for (let i = 12; i >= 0; i--) ctx.lineTo(-w / 2 + (i / 12) * w, h / 2 + (i % 2 ? 0 : 6));
  ctx.closePath(); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
  text(ctx, '深海小店', 0, -h / 2 + 34, { size: 24, color: SEA.ink, align: 'center', weight: 700, fam: SERIF, ls: 3 });
  text(ctx, '- - - - - - - -', 0, -h / 2 + 62, { size: 18, color: 'rgba(43,35,32,0.5)', align: 'center' });
  const rows = ['一块钱', '一百万个字', '便宜 但不随便'];
  rows.forEach((s, i) => text(ctx, s, 0, -h / 2 + 96 + i * 34, { size: 22, color: 'rgba(43,35,32,0.75)', align: 'center', weight: 500, fam: SANS }));
  text(ctx, '合计 ¥0.00', 0, h / 2 - 40, { size: 24, color: SEA.orangeD, align: 'center', weight: 700, fam: SANS });
  ctx.restore();
}
/* 放大镜 */
function magnifier(ctx, x, y, r, T, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0);
  ctx.strokeStyle = '#D9A24A'; ctx.lineWidth = 22;
  ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,247,214,0.6)'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, r - 14, 0, TAU); ctx.stroke();
  ctx.save(); ctx.rotate(0.7);
  ctx.fillStyle = '#B98B57'; rrect(ctx, r * 0.94, -16, r * 0.9, 32, 16); ctx.fill();
  ctx.fillStyle = '#7A5230'; rrect(ctx, r * 1.7, -20, 40, 40, 10); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r - 12, 0, TAU); ctx.clip();
  ctx.globalAlpha = 0.12; ctx.fillStyle = CYAN; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
  ctx.globalAlpha = 0.35; ctx.fillStyle = '#FFFDF6';
  ctx.beginPath(); ctx.ellipse(-r * 0.34, -r * 0.42, r * 0.3, r * 0.13, -0.7, 0, TAU); ctx.fill();
  ctx.restore();
  ctx.restore();
}

/* ============================ 镜头 ============================ */
/* ---- 1 · 0.00 我从数字的海里长大：气泡里浮上来的「数字的海」 ---- */
const sOpening = (ctx, T) => {
  deepBg(ctx, T, { la: 0.5, lx: W * 0.5, ly: -260, lr: 1200 });
  digitField(ctx, T, { a: 0.3, sp: 46 });
  cam(ctx, T, { z: 1 + 0.05 * sat(T, 0, 2.5), cx: 960, cy: 620, seed: 4 }, () => {
    // 海面在头顶：一条亮线
    pool(ctx, 960, 60, 900, 220, CYAN, 0.5);
    waterLine(ctx, T, 120, { a: 0.5, amp: 16, color: rgba(CYAN, 0.5), w: 4 });
    charSprite(ctx, CH, 'd21', 960, 1010, 330, { t: T, ph: 1, shadow: false, bob: Math.sin(T * 1.2) * 10 });
    bubbles(ctx, T, { n: 24, a: 0.55, sp: 90, r0: 3, r1: 13 });
    // 大字：白描边（cream）+ 橙填充，起拱
    displayText(ctx, '数字的海', 960, 400, 172, {
      color: ORANGE, edgeColor: SEA.cream, edgeW: 26, arc: 62, tilt: -0.04,
      pop: 0.55 + 0.45 * E.back(sat(T, 0, 0.55)), jitter: 0.02,
    });
    text(ctx, '我从数字的海里长大', 960, 545, { size: 36, color: rgba(SEA.cream, 0.82), align: 'center', weight: 500, fam: SANS, ls: 8, alpha: sat(T, 0.55, 1.1) });
    confetti(ctx, T, { n: 20, a: 0.25 });
  });
  halftone(ctx, 0, 0, 760, 300, { a: 0.022, color: '#8FD8EE' });
};

/* ---- 2 · 2.52 红的绿的浪：K 线化作浪，她在浪间小 ---- */
const sCandleSea = (ctx, T) => {
  deepBg(ctx, T, { top: '#040D16', mid: '#08202E', bot: '#0A2A34', la: 0.4, lx: 1200, ly: 60 });
  const z = 1 + 0.05 * sat(T, 2.52, 5.9);
  cam(ctx, T, { z, cx: 1000, cy: 700, seed: 5 }, () => {
    // 背后的浪体
    ctx.save(); ctx.fillStyle = 'rgba(12,52,70,0.85)';
    ctx.beginPath(); ctx.moveTo(-40, H + 40); ctx.lineTo(-40, 820);
    ctx.bezierCurveTo(280, 640, 640, 580, 940, 640);
    ctx.bezierCurveTo(1250, 700, 1560, 780, 1980, 700);
    ctx.lineTo(1980, H + 40); ctx.closePath(); ctx.fill(); ctx.restore();
    // 水面（浪线）
    ctx.save();
    ctx.strokeStyle = rgba('#BFF0FF', 0.65); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = -40; x <= W + 40; x += 18) ctx.lineTo(x, 540 + Math.sin(x * 0.0055 + T * 1.15) * 26 + Math.sin(x * 0.0021 - T * 0.8) * 44);
    ctx.stroke();
    for (let i = 0; i < 22; i++) {
      const x = 60 + i * 90 + Math.sin(T + i) * 14;
      const y = 540 + Math.sin(x * 0.0055 + T * 1.15) * 26 + Math.sin(x * 0.0021 - T * 0.8) * 44;
      dot(ctx, x, y - 8, 4 + rnd(i, 61) * 7, 'rgba(224,250,255,0.75)', 0.7, 10);
    }
    ctx.restore();
    // K 线浪
    candles(ctx, T, { n: 24, y: 720, amp: 104, a: 0.85, bh: 84 });
    // 前景水面（压住蜡烛脚）
    ctx.save();
    ctx.fillStyle = lin(ctx, 0, 940, 0, H, [[0, 'rgba(4,20,30,0)'], [1, 'rgba(2,10,16,0.95)']]);
    ctx.beginPath(); ctx.moveTo(-40, 1080);
    for (let x = -40; x <= W + 40; x += 20) ctx.lineTo(x, 960 + Math.sin(x * 0.007 + T * 0.9) * 16);
    ctx.lineTo(W + 40, 1080); ctx.closePath(); ctx.fill();
    ctx.restore();
    charSprite(ctx, CH, 'd21', 1330, 800, 300, { t: T, ph: 2, shadow: false, flip: true, bob: Math.sin(T * 1.4) * 12 });
    motes(ctx, T, { n: 44, a: 0.4, color: '#BFF0FF' });
  });
  halftone(ctx, 0, 780, W, 300, { a: 0.05, color: '#03121C' });
};

/* ---- 3 · 5.97 远远的山顶上 灯一盏一盏亮 ---- */
const sHillLamps = (ctx, T) => {
  const p = sat(T, 5.97, 9.7);
  // 天：靠近山脊处有一点冷光，往上压黑
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#02070E'], [0.34, '#062130'], [0.56, '#0B3143'], [0.66, '#082330'], [1, '#04121C']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1240, 500, 1000, '#5FD0E6', 0.34);
  for (let i = 0; i < 40; i++) {
    const x = rnd(i, 11) * W, y = rnd(i, 12) * 420;
    ctx.globalAlpha = (0.2 + rnd(i, 13) * 0.6) * (0.4 + 0.6 * Math.sin(T * 1.3 + i));
    ctx.fillStyle = '#DCEFFF'; ctx.fillRect(x, y, 1.6 + rnd(i, 14) * 2, 1.6 + rnd(i, 14) * 2);
  }
  ctx.globalAlpha = 1;
  cam(ctx, T, { z: 1.05 + 0.06 * p, cx: 1150, cy: 600, seed: 6, x: -50 * p, y: 14 * p }, () => {
    // 远山（填色，山脊上一条暖边，不做线框）
    hills(ctx, 560, '#092231', { ph: 1.2, amp: 200 });
    ctx.save(); ctx.globalAlpha = 0.5;
    ctx.strokeStyle = rgba('#F8C65A', 0.45); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 16) { const yy = ridgeY(x, 560, 200, 1.2); x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke(); ctx.restore();
    // 山脊上的灯
    const LX = [1790, 1660, 1530, 1400, 1270, 1140, 1010, 880, 760];
    LX.forEach((lx, i) => {
      const y = ridgeY(lx, 560, 200, 1.2) - 10;
      const a = sat(T, 5.97 + i * 0.42, 6.45 + i * 0.42);
      if (a <= 0) return;
      pool(ctx, lx, y + 10, 320, 240, '#FFC97A', 0.32 * a);
      lamp(ctx, lx, y, 1.25, T, i, a);
    });
    // 山间薄雾
    pool(ctx, 900, 700, 1000, 170, '#8FD8E8', 0.14);
    // 登山道
    ctx.save(); ctx.globalAlpha = 0.5 * sat(T, 6.2, 7.4);
    ctx.strokeStyle = rgba('#F8C65A', 0.7); ctx.lineWidth = 4; ctx.setLineDash([12, 18]);
    ctx.beginPath(); ctx.moveTo(240, 1010);
    ctx.bezierCurveTo(520, 930, 660, 800, 880, 716);
    ctx.bezierCurveTo(1120, 626, 1420, 596, 1660, ridgeY(1660, 560, 200, 1.2) + 44);
    ctx.stroke(); ctx.restore();
    // 中景山（更黑，压出层次）
    hills(ctx, 790, '#041622', { ph: 2.6, amp: 130 });
    // 近景：一块岩，她站在上头
    ctx.save();
    ctx.fillStyle = '#061724';
    ctx.beginPath(); ctx.moveTo(-40, 1090);
    ctx.bezierCurveTo(60, 950, 200, 872, 370, 872);
    ctx.bezierCurveTo(530, 872, 640, 950, 720, 1090);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#8FD8EE', 0.4); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, 1000);
    ctx.bezierCurveTo(90, 918, 230, 874, 370, 874);
    ctx.bezierCurveTo(500, 874, 610, 936, 680, 1020); ctx.stroke();
    ctx.restore();
    charSprite(ctx, CH, 'd00', 350, 876, 500, { t: T, ph: 3 });
    pool(ctx, 400, 760, 320, 220, '#FFD79A', 0.14 * sat(T, 7.6, 9.6));
    ctx.save(); ctx.globalAlpha = 0.35 * sat(T, 6.4, 7.2) * (1 - sat(T, 9.2, 9.6));
    ctx.setLineDash([8, 16]); ctx.strokeStyle = rgba('#BFEAF7', 0.85); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(460, 600); ctx.lineTo(1220, 420); ctx.stroke(); ctx.restore();
    motes(ctx, T, { n: 30, a: 0.3, color: '#FFE9C4' });
  });
  halftone(ctx, W - 680, 0, 680, 340, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 4 · 9.76 人人 都跟在后面 ---- */
const sQueue = (ctx, T) => {
  deepBg(ctx, T, { top: '#03080E', mid: '#06192A', bot: '#08243A', la: 0.24, lx: 1700, ly: 200 });
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 9.76, 12.5), cx: 1000, cy: 620, seed: 7, x: -30 * sat(T, 9.76, 12.5) }, () => {
    digitField(ctx, T, { a: 0.16, sp: 30 });
    // 一排一模一样的鱼，斜着往前游；她排在队尾
    for (let i = 7; i >= 1; i--) {
      const x = 1150 + i * 96, y = 430 + i * 52 + Math.sin(T * 1.2 + i) * 8;
      fishSil(ctx, x, y, 0.9 - i * 0.045, rgba('#9FD8E8', 0.5 - i * 0.05), false);
    }
    fishSil(ctx, 1180, 960, 1.5, rgba('#BFEDFA', 0.8), false);
    // 远处有个领头的（很小，光在后面）
    pool(ctx, 1830, 300, 420, 300, SEA.gold, 0.35);
    fishSil(ctx, 1830, 300, 0.55, rgba(SEA.gold, 0.8), false);
    charSprite(ctx, CH, 'd21', 780, 960, 320, { t: T, ph: 4, shadow: false, flip: true, bob: Math.sin(T * 1.1) * 8 });
    bubbles(ctx, T, { n: 14, a: 0.3, sp: 50, r0: 2, r1: 8 });
    motes(ctx, T, { n: 34, a: 0.35 });
  });
  halftone(ctx, 0, 0, 620, 340, { a: 0.022, color: '#8FD8EE' });
};

/* ---- 5 · 12.53 有个人不信这一套 ---- */
const sDoubt = (ctx, T) => {
  deepBg(ctx, T, { top: '#02060B', mid: '#05121E', bot: '#081E2E', la: 0.18, lx: 700, ly: -100 });
  cam(ctx, T, { z: 1.04 + 0.04 * sat(T, 12.5, 15.8), cx: 900, cy: 640, seed: 8 }, () => {
    // 聚光灯：从上打下来的一束
    const sp = sat(T, 12.53, 13.0);
    ctx.save(); ctx.globalAlpha = 0.55 * sp;
    ctx.fillStyle = lin(ctx, 0, 0, 0, 1000, [[0, rgba('#FFF3D2', 0.85)], [1, rgba('#FFF3D2', 0)]]);
    ctx.beginPath(); ctx.moveTo(760, -40); ctx.lineTo(900, -40); ctx.lineTo(1180, 1000); ctx.lineTo(520, 1000); ctx.closePath(); ctx.fill();
    ctx.restore();
    pool(ctx, 850, 900, 420, 130, '#FFE9B8', 0.34 * sp);
    // 队伍继续往前（灰）
    for (let i = 3; i >= 1; i--) fishSil(ctx, 1560 + i * 90, 380 + i * 46 + Math.sin(T + i) * 6, 0.8 - i * 0.06, rgba('#9FD8E8', 0.22), false);
    // 转回来的一条鱼（白亮）+ 问号
    const turn = E.io(sat(T, 12.6, 13.5));
    fishSil(ctx, lerp(1560, 880, turn), lerp(470, 640, turn), 2.6, '#EAF7FF', true);
    glow(ctx, lerp(1560, 880, turn), lerp(470, 640, turn), 260, '#EAF7FF', 0.35);
    const q = sat(T, 13.3, 13.9);
    if (q > 0) {
      ctx.save(); ctx.globalAlpha = q;
      displayText(ctx, '?', 660, 420, 150 + 20 * Math.sin(T * 3), { color: SEA.gold, edgeColor: SEA.cream, edgeW: 16, pop: E.back(sat(T, 13.35, 13.7)) });
      ctx.restore();
    }
    pool(ctx, 880, 980, 460, 130, '#FFE9B8', 0.3 * sp);
    charSprite(ctx, CH, 'd22', 1520, 1010, 470, { t: T, ph: 5, a: 0.95 });
    motes(ctx, T, { n: 40, a: 0.3 });
  });
  halftone(ctx, W - 700, 0, 700, 420, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 6 · 15.82 先往前游一段：她独自游进黑水 ---- */
const sDarkSwim = (ctx, T) => {
  deepBg(ctx, T, { top: '#01040A', mid: '#03101A', bot: '#061826', la: 0.14, shafts: false, print: false });
  const p = sat(T, 15.82, 18.9);
  // 背后那点亮（队伍那头的灯）越来越小
  pool(ctx, 1560, 420, 620 * (1 - p * 0.55), 420 * (1 - p * 0.55), SEA.gold, 0.32 * (1 - p * 0.7));
  cam(ctx, T, { z: 1.02, x: -80 * E.io(p), cx: 960, cy: 620, seed: 9 }, () => {
    waterLine(ctx, T, 300, { a: 0.16 * (1 - p), amp: 20 });
    // 前景海草剪影
    ctx.save(); ctx.fillStyle = 'rgba(1,5,9,0.85)';
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 236 + rnd(i, 5) * 50, h = 220 + rnd(i, 6) * 220, w0 = 12 + rnd(i, 7) * 12;
      ctx.beginPath(); ctx.moveTo(x - w0, 1080);
      ctx.quadraticCurveTo(x + Math.sin(T * 1.1 + i) * 44 - 26, 1080 - h * 0.62, x + Math.sin(T * 0.9 + i) * 66, 1080 - h);
      ctx.quadraticCurveTo(x + Math.sin(T * 1.1 + i) * 44 + 18, 1080 - h * 0.6, x + w0 * 1.4, 1080);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    charSprite(ctx, CH, 'd21', lerp(760, 1240, E.io(p)), 700, 380, { t: T, ph: 2, shadow: false, flip: true, bob: Math.sin(T * 1.3) * 10 });
    // 身后拖出的水纹
    for (let i = 0; i < 7; i++) {
      const q = ((T * 0.55 + i * 0.14) % 1);
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - q);
      ctx.strokeStyle = rgba(CYAN, 0.6); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.arc(lerp(760, 1240, E.io(p)) - 60 - q * 220, 690 + Math.sin(T + i) * 18, 30 + q * 90, -0.8, 0.8); ctx.stroke();
      ctx.restore();
    }
    bubbles(ctx, T, { n: 22, a: 0.4, sp: 120, r0: 3, r1: 12 });
  });
  ctx.fillStyle = 'rgba(0,2,6,0.18)'; ctx.fillRect(0, 0, W, H);
  halftone(ctx, 0, 0, W, H, { a: 0.04, color: '#0B2C3C' });
};

/* ---- 7 · 19.10 于是我憋了一口气：近景鼓脸 + 气泡 ---- */
const sHoldBreath = (ctx, T) => {
  deepBg(ctx, T, { top: '#01050C', mid: '#051826', bot: '#0A2B3E', la: 0.3, lx: 960, ly: 60, shafts: false });
  cam(ctx, T, { z: 1.34 + 0.03 * sat(T, 19.1, 22.1), cx: 960, cy: 520, seed: 10 }, () => {
    // 水下的圆光（像潜到水里往上看）
    pool(ctx, 960, 120, 880, 260, CYAN, 0.4);
    for (let i = 0; i < 3; i++) {
      ctx.save(); ctx.globalAlpha = 0.16 + i * 0.03;
      ctx.strokeStyle = rgba('#BFF0FF', 0.6); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(960, 900, 620 + i * 90, 150 + i * 30, 0, Math.PI, TAU); ctx.stroke();
      ctx.restore();
    }
    // 近景立绘：撑满画面
    const puff = 1 + 0.018 * Math.sin(T * 1.5);
    charSprite(ctx, CH, 'd38', 960, 1030, 760, { t: T, ph: 1, sx: puff * 1.02, sy: puff * 0.99, blink: T > 20.2 && T < 20.3 ? 0.9 : null });
    // 嘴里冒出的气泡
    for (let i = 0; i < 9; i++) {
      const q = ((T * 0.5 + i * 0.11) % 1);
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - q);
      ctx.strokeStyle = 'rgba(200,244,255,0.9)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(960 + Math.sin(i * 2.1 + T) * (40 + q * 130), 470 - q * 380, 5 + q * 18, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    bubbles(ctx, T, { n: 18, a: 0.35, sp: 80, r0: 3, r1: 10 });
    // 「呼——」的小气泡
    const ba = sat(T, 20.4, 20.9) * (1 - sat(T, 21.9, 22.1));
    if (ba > 0) {
      ctx.save(); ctx.globalAlpha = ba;
      ctx.fillStyle = 'rgba(255,253,244,0.92)';
      rrect(ctx, 1230, 360, 190, 86, 43); ctx.fill();
      text(ctx, '呼——', 1325, 404, { size: 40, color: SEA.ink, align: 'center', weight: 600, fam: SERIF, ls: 2 });
      ctx.restore();
    }
  });
  // 潜水镜式的暗角
  ctx.save(); ctx.fillStyle = rad(ctx, W / 2, H * 0.5, H * 0.9, [[0.42, 'rgba(0,0,0,0)'], [1, 'rgba(0,3,8,0.75)']]);
  ctx.fillRect(0, 0, W, H); ctx.restore();
};

/* ---- 8 · 22.13 沉到最深 最深的地方 ---- */
const sSinkDeep = (ctx, T) => {
  const p = sat(T, 22.13, 25.7);
  deepBg(ctx, T, { top: '#01040B', mid: '#03101C', bot: '#020A12', la: 0.2, lx: 960, ly: -300, lr: 900 });
  cam(ctx, T, { z: 1.02 - 0.03 * p, y: 40 * p, cx: 960, cy: 600, seed: 11 }, () => {
    // 一层层变暗的深蓝带
    for (let i = 0; i < 5; i++) {
      const y = 260 + i * 170;
      ctx.save(); ctx.globalAlpha = 0.5 - i * 0.07;
      ctx.fillStyle = lin(ctx, 0, y - 60, 0, y + 120, [[0, rgba('#1A6E8C', 0.8)], [1, 'rgba(6,26,40,0)']]);
      ctx.fillRect(0, y - 60, W, 180);
      ctx.restore();
      waterLine(ctx, T, y, { a: 0.22 - i * 0.035, amp: 18, ph: i * 1.4, color: rgba(CYAN, 0.5) });
    }
    // 上方的光缩成一个点
    const lr = 300 * (1 - p * 0.75);
    pool(ctx, 960, 90, lr, lr * 0.7, '#CDEFFF', 0.4 - p * 0.2);
    // 她缩成一团往下沉
    heroRot(ctx, 'd64a', lerp(980, 900, p), lerp(560, 900, E.io(p)) + 40, 300, 0.24 * Math.sin(T * 0.7) - 0.1, { t: T, ph: 2, shadow: false });
    bubbles(ctx, T, { n: 24, a: 0.5, sp: 150, r0: 3, r1: 14 });
    motes(ctx, T, { n: 44, a: 0.28 });
    // 深度标记
    [[880, '−200m', 0.1], [130, '−1200m', 0.45], [1040, '−4000m', 0.8]].forEach(([y, s, d]) => {
      text(ctx, s, 1740, y, { size: 26, color: rgba('#9FE6F7', 0.45), align: 'right', weight: 500, fam: SANS, ls: 4, alpha: sat(T, 22.2 + d, 22.8 + d) });
      ctx.fillStyle = rgba('#9FE6F7', 0.25); ctx.fillRect(1480, y, 80, 1);
    });
  });
  halftone(ctx, 0, 0, 900, 420, { a: 0.05, color: '#0E3A50' });
};

/* ---- 9 · 25.73 一块钱 一百万个字 ---- */
let GHOSTS = null;
const sMillionWordsIn = (ctx, T) => {
  deepBg(ctx, T, { top: '#04101C', mid: '#0A2536', bot: '#071C28', la: 0.4, lx: 700, ly: 120 });
  digitField(ctx, T, { a: 0.34, sp: 130, kind: 'word' });
  const z = 1.02 + 0.04 * sat(T, 25.73, 28.5);
  cam(ctx, T, { z, cx: 900, cy: 620, seed: 12 }, () => {
    coin(ctx, 640, 560, 210, T, { rot: Math.sin(T * 0.8) * 0.12, a: 1 });
    charSprite(ctx, CH, 'd24', 1330, 1000, 560, { t: T, ph: 3 });
    // 手前飘着的几枚小字
    for (let i = 0; i < 8; i++) {
      const q = ((T * 0.35 + i * 0.13) % 1);
      text(ctx, [...'字百万块一'][i % 5], 120 + i * 210, 380 - q * 160 + Math.sin(T + i) * 20, {
        size: 44 + rnd(i, 7) * 40, color: rgba(i % 3 ? '#BFF0FF' : SEA.gold, 0.35 * (1 - q)), align: 'center', weight: 700, fam: SERIF,
      });
    }
    displayText(ctx, '一百万个字', 1050, 330, 128, { color: SEA.cream, edgeColor: rgba('#061826', 0.9), edgeW: 16, arc: 22, pop: E.back(sat(T, 26.5, 27.0)), tilt: 0.03, alpha: sat(T, 26.4, 26.8) });
    displayText(ctx, '一块钱', 470, 860, 96, { color: SEA.gold, edgeColor: rgba('#061826', 0.9), edgeW: 14, arc: 14, pop: E.back(sat(T, 25.85, 26.3)) });
    sparkle(ctx, 760, 850, 26, SEA.gold, 0.6 + 0.4 * Math.sin(T * 4));
  });
};

const sMillionWords = (ctx, T) => {
  const p = sat(T, 25.73, 26.18);
  if (p < 1) inkWipeClip(ctx, p, (c) => sSinkDeep(c, clamp(T, 22.13, 25.7)), (c) => sMillionWordsIn(c, T));
  else sMillionWordsIn(ctx, T);
};

/* ---- 10 · 29.23 他们笑我 是拼多多 / 便宜 不是随便 ---- */
const sPinduoduo = (ctx, T) => {
  deepBg(ctx, T, { top: '#050D16', mid: '#0B1D2A', bot: '#0A1622', la: 0.3, lx: 1180, ly: 100 });
  cam(ctx, T, { z: 1.03 + 0.03 * sat(T, 29.2, 35.2), cx: 980, cy: 600, seed: 13 }, () => {
    // 价签：一根绳吊着一张 9.9 的牌子
    const sw = Math.sin(T * 1.2) * 0.05;
    ctx.save(); ctx.translate(980, 250); ctx.rotate(sw);
    ctx.strokeStyle = 'rgba(255,246,227,0.5)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -260); ctx.lineTo(0, -20); ctx.stroke();
    ctx.fillStyle = '#FFF6E3';
    ctx.beginPath(); ctx.moveTo(-170, -20); ctx.lineTo(170, -20); ctx.lineTo(150, 150); ctx.lineTo(-150, 150); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#E1473A';
    ctx.beginPath(); ctx.moveTo(-170, -20); ctx.lineTo(170, -20); ctx.lineTo(160, 34); ctx.lineTo(-160, 34); ctx.closePath(); ctx.fill();
    text(ctx, '限时', 0, 6, { size: 34, color: '#FFF6E3', align: 'center', weight: 700, fam: SERIF, ls: 6 });
    text(ctx, '¥9.9', 0, 96, { size: 92, color: SEA.ink, align: 'center', weight: 800, fam: SANS });
    ctx.restore();
    // 收到的收据
    receipt(ctx, 1560, 720, 280, 400, T, { rot: 0.1, a: sat(T, 31.4, 31.9) });
    pool(ctx, 430, 820, 420, 300, '#2E8FA8', 0.28);
    charSprite(ctx, CH, 'd20', 430, 1010, 560, { t: T, ph: 4 });
    displayText(ctx, '拼多多', 1120, 560, 138, { color: ORANGE, edgeColor: SEA.cream, edgeW: 20, arc: 30, pop: E.back(sat(T, 29.35, 29.9)), alpha: sat(T, 29.3, 29.6) });
    text(ctx, '他们笑我', 330, 250, { size: 40, color: rgba(SEA.cream, 0.7), align: 'center', weight: 500, fam: SERIF, ls: 8, alpha: sat(T, 29.5, 30.1) });
    // 印章：便宜 不是随便
    const sp = sat(T, 32.4, 32.75);
    if (sp > 0) {
      const sc = lerp(2.2, 1, E.out(sp));
      ctx.save(); ctx.globalAlpha = clamp(sp * 1.4);
      stamp(ctx, 860, 830, '不随便', sc, { rot: -0.16 });
      ctx.restore();
      const ring = sat(T, 32.5, 33.4);
      for (let i = 0; i < 3; i++) {
        ctx.save(); ctx.globalAlpha = 0.5 * (1 - ring) * (1 - i * 0.25);
        ctx.strokeStyle = '#FF9B7A'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(860, 830, 120 + ring * 300 + i * 50, 80 + ring * 190 + i * 30, -0.16, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    displayText(ctx, '便宜', 320, 400, 92, { color: SEA.gold, edgeColor: rgba('#061826', 0.9), edgeW: 13, arc: 12, pop: E.back(sat(T, 31.7, 32.1)) });
    text(ctx, '不是随便', 320, 500, { size: 34, color: rgba(SEA.cream, 0.7), align: 'center', weight: 500, fam: SERIF, ls: 8, alpha: sat(T, 32.9, 33.5) });
  });
};

/* ---- 11 · 35.22 等着吧 等过年 ---- */
const sNewYear = (ctx, T) => {
  const red = sat(T, 35.22, 36.4);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, mix('#050D18', '#3A0A12', red)], [0.55, mix('#0A1D2A', '#7A1418', red)], [1, mix('#08131E', '#3D0A10', red)]]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.5, -120, 1200, '#FF7A3A', 0.5);
  shafts(ctx, T, { n: 4, a: 0.08, color: '#FFB06A' });
  cam(ctx, T, { z: 1.03 + 0.04 * sat(T, 35.2, 38.2), cx: 960, cy: 560, seed: 14 }, () => {
    // 一排灯笼
    for (let i = 0; i < 6; i++) lantern(ctx, 150 + i * 330, 210 + (i % 2) * 40, 0.9 + (i % 3) * 0.08, T, i);
    // 烟花
    for (let i = 0; i < 4; i++) {
      const t0 = 35.5 + i * 0.62, p = sat(T, t0, t0 + 1.4);
      if (p <= 0 || p >= 1) continue;
      const bx = 300 + rnd(i, 21) * 1400, by = 260 + rnd(i, 22) * 220;
      for (let k = 0; k < 26; k++) {
        const a = k / 26 * TAU + rnd(i, 23) * 2, d = 30 + p * (180 + rnd(k, 24) * 200);
        const r = 4 * (1 - p) + 1;
        dot(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d + p * 60, r, k % 3 ? '#FFD08A' : '#FF7A5A', (1 - p) * 0.95, 14);
      }
      glow(ctx, bx, by, 180, '#FFB06A', (1 - p) * 0.5);
    }
    groundBand(ctx, 900, 'rgba(30,6,10,0.9)', { amp: 10 });
    // 她坐在鞭炮上，手里还拿着一根
    charSprite(ctx, CH, 'd65', 700, 980, 520, { t: T, ph: 5 });
    firecrackers(ctx, T, 1060, 620, 520, 1.1, { ang: 0.6, t0: 35.9 });
    firecrackers(ctx, T, 200, 560, 300, 0.9, { ang: 1.1, t0: 36.6 });
    displayText(ctx, '等过年', 1420, 480, 150, { color: SEA.gold, edgeColor: SEA.cream, edgeW: 22, arc: 34, pop: E.back(sat(T, 35.45, 36.0)), tilt: 0.04 });
    text(ctx, '等着吧', 1420, 640, { size: 40, color: rgba('#FFF1DE', 0.8), align: 'center', weight: 600, fam: SERIF, ls: 10, alpha: sat(T, 35.5, 36.0) });
  });
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: '#3A0A12' });
};

/* ---- 12 · 38.26 我只是翻了个身：她在水里翻一整圈 ---- */
const sTurnOver = (ctx, T) => {
  deepBg(ctx, T, { top: '#040E1A', mid: '#0A2234', bot: '#0C2E42', la: 0.45, lx: 960, ly: -120 });
  cam(ctx, T, { z: 1.05, cx: 960, cy: 640, seed: 15 }, () => {
    pool(ctx, 960, 780, 960, 220, '#FFE2B4', 0.34);
    waterLine(ctx, T, 790, { a: 0.6, amp: 14, color: rgba(SEA.gold, 0.5) });
    waterLine(ctx, T, 830, { a: 0.32, amp: 20, ph: 2, color: rgba('#BFF0FF', 0.5) });
    // 翻身：整圈，带残影
    const spin = E.io(sat(T, 39.0, 40.35));
    const rot = TAU * spin + Math.sin(T * 1.2) * 0.04;
    if (spin > 0) for (let i = 3; i >= 1; i--) heroRot(ctx, 'd34', 960, 940, 500, rot - i * 0.42 * spin, { t: T, ph: 1, a: (0.16 / i + 0.04) * spin, shadow: false });
    heroRot(ctx, 'd34', 960, 940, 500, rot, { t: T, ph: 2, shadow: false });
    // 旋涡：绕着她转的水线
    for (let i = 0; i < 3; i++) {
      const q = (T * 0.5 + i / 3) % 1;
      ctx.save(); ctx.globalAlpha = 0.5 * (1 - q) * (0.4 + spin);
      ctx.strokeStyle = rgba('#DFF6FF', 0.85); ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 30; k++) {
        const a = -q * 4 + k / 30 * 1.9, r = 250 - k * 2.2;
        ctx.lineTo(960 + Math.cos(a) * r, 700 + Math.sin(a) * r * 0.34);
      }
      ctx.stroke(); ctx.restore();
    }
    // 翻起来的水花
    const sp = sat(T, 39.05, 40.4);
    if (sp > 0 && sp < 1) {
      for (let i = 0; i < 34; i++) {
        const a = rnd(i, 31) * TAU, d = 90 + sp * (240 + rnd(i, 32) * 420);
        dot(ctx, 960 + Math.cos(a) * d, 790 + Math.sin(a) * d * 0.42 - sp * 160, 5.5 * (1 - sp) + 1.5, i % 3 ? '#DFF6FF' : SEA.cyan, (1 - sp) * 0.95, 12);
      }
      for (let i = 0; i < 2; i++) {
        ctx.save(); ctx.globalAlpha = 0.7 * (1 - sp);
        ctx.strokeStyle = '#DFF6FF'; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(960, 810, 200 + sp * 560 + i * 70, 60 + sp * 170 + i * 24, 0, 0, TAU); ctx.stroke(); ctx.restore();
      }
    }
    motes(ctx, T, { n: 44, a: 0.35 });
    text(ctx, '翻——', 1440, 360, { size: 46, color: rgba(SEA.gold, 0.75), align: 'center', weight: 700, fam: SERIF, ls: 6, alpha: sat(T, 39.1, 39.5) * (1 - sat(T, 40.4, 40.8)) });
  });
  halftone(ctx, 0, 0, 660, 360, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 13 · 41.11 整片海都翻了天：海面倒转，鱼倒着游 ---- */
const sSeaFlip = (ctx, T) => {
  const roll = E.io(sat(T, 41.2, 43.4)) * Math.PI;
  const swap = E.io(sat(T, 42.1, 42.8));
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.scale(1.18, 1.18); ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, mix('#04141F', '#072835', swap)], [0.45, mix('#0B2C40', '#0E3B4C', swap)], [1, '#05161F']]);
  ctx.fillRect(-W, -H, 3 * W, 3 * H);
  pool(ctx, 960, 120, 1100, 320, '#9BE8FF', 0.45);
  // 倒扣在头顶的浪
  ctx.save(); ctx.fillStyle = 'rgba(46,143,168,0.75)';
  ctx.beginPath(); ctx.moveTo(-200, -200);
  ctx.lineTo(-200, 300);
  ctx.bezierCurveTo(200, 200, 500, 120, 760, 150);
  ctx.bezierCurveTo(1000, 178, 1180, 300, 1240, 430);
  ctx.lineTo(1240, -200); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(240,253,255,0.9)'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-200, 300); ctx.bezierCurveTo(200, 200, 500, 120, 760, 150); ctx.bezierCurveTo(1000, 178, 1180, 300, 1240, 430); ctx.stroke();
  ctx.restore();
  // 倒过来的海面（跑到上面的浪）
  for (let i = 0; i < 4; i++) waterLine(ctx, T, 200 + i * 70, { a: 0.4 - i * 0.08, amp: 22, ph: i * 1.7, color: rgba('#BFF0FF', 0.5), w: 5 });
  // 倒着游的鱼群
  for (let i = 0; i < 12; i++) {
    const x = 80 + i * 168 + Math.sin(T * 1.1 + i) * 30, y = 380 + (i % 3) * 100;
    fishSil(ctx, x, y, 1.15 - (i % 3) * 0.12, rgba('#BFEDFA', 0.8), true);
  }
  for (let i = 0; i < 22; i++) {
    const q = ((T * 0.8 + i * 0.07) % 1);
    dot(ctx, 120 + rnd(i, 71) * 1700, 700 - q * 500, 4 + rnd(i, 72) * 7, '#EAFBFF', 0.55 * (1 - q), 10);
  }
  // 她自己被浪抛起来，倒着
  heroRot(ctx, 'd34', 1240, 980, 420, Math.PI - 0.25 + Math.sin(T * 1.6) * 0.12, { t: T, ph: 3, shadow: false });
  for (let i = 0; i < 30; i++) {
    const q = ((T * 0.6 + i * 0.07) % 1);
    dot(ctx, 200 + rnd(i, 41) * 1500, 900 - q * 700, 3 + rnd(i, 42) * 5, '#CFEFFF', 0.35 * (1 - q), 8);
  }
  ctx.restore();
  // 硬切的白闪 + 红色转绿色（原版：翻过去之前红，翻过去之后绿）
  const fl = sat(T, 41.11, 41.55);
  if (fl < 1) { ctx.fillStyle = rgba('#FFFFFF', 0.8 * (1 - fl) * (1 - fl)); ctx.fillRect(0, 0, W, H); }
  const redP = (1 - sat(T, 42.0, 42.9));
  if (redP > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.25 * redP; ctx.fillStyle = '#E1473A'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: '#0B2C3C' });
};

/* ---- 14 · 44.33 浪一路拍到了华尔街 ---- */
const sWallStreet = (ctx, T) => {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#02070E'], [0.5, '#061A28'], [1, '#020A12']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1400, 120, 1000, CYAN, 0.28);
  cam(ctx, T, { z: 1.02 + 0.05 * sat(T, 44.3, 47.3), cx: 860, cy: 700, seed: 16 }, () => {
    // 天际线
    const img = cityImg();
    const off = (T * 26) % 2400;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(img, -off, 300, 2400, 760);
    ctx.drawImage(img, -off + 2400, 300, 2400, 760);
    ctx.globalAlpha = 1;
    // 行情屏
    ctx.save(); ctx.translate(1120, 420); ctx.rotate(-0.06);
    const tk = tickerImg(), tw = 880, th = 337;
    ctx.beginPath(); rrect(ctx, 0, 0, tw, th, 14); ctx.clip();
    ctx.fillStyle = '#041019'; ctx.fillRect(0, 0, tw, th);
    const to = (T * 90) % tw;
    ctx.globalAlpha = 0.9; ctx.drawImage(tk, -to, 0, tw, th); ctx.drawImage(tk, tw - to, 0, tw, th);
    ctx.restore();
    // 浪：从左边卷起来，浪唇扣下来，拍在天际线上
    const p = sat(T, 44.35, 45.9);
    const y0 = lerp(1120, 850, E.io(p));
    ctx.save();
    ctx.fillStyle = lin(ctx, 300, y0 - 420, 300, H, [[0, 'rgba(58,160,186,0.98)'], [0.55, 'rgba(18,84,112,0.98)'], [1, 'rgba(4,20,30,1)']]);
    ctx.beginPath();
    ctx.moveTo(-40, H + 40);
    ctx.lineTo(-40, y0 - 40);
    ctx.bezierCurveTo(40, y0 - 300, 240, y0 - 420, 470, y0 - 400);
    ctx.bezierCurveTo(650, y0 - 386, 700, y0 - 300, 640, y0 - 210);
    ctx.bezierCurveTo(580, y0 - 120, 700, y0 - 40, 980, y0 + 60);
    ctx.bezierCurveTo(1160, y0 + 130, 1260, y0 + 220, 1300, H + 40);
    ctx.closePath(); ctx.fill();
    // 浪唇的白边 + 泡沫
    ctx.strokeStyle = 'rgba(244,253,255,0.95)'; ctx.lineWidth = 14; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-40, y0 - 44);
    ctx.bezierCurveTo(40, y0 - 304, 240, y0 - 424, 470, y0 - 404);
    ctx.bezierCurveTo(650, y0 - 390, 700, y0 - 304, 640, y0 - 214);
    ctx.stroke();
    for (let i = 0; i < 26; i++) {
      const u = i / 25;
      const bx = lerp(-30, 640, u), by = y0 - 400 + Math.pow(u, 2.2) * 200 + Math.sin(u * 9) * 26;
      dot(ctx, bx + rnd(i, 61) * 30, by - 10 - rnd(i, 62) * 40, 10 + rnd(i, 63) * 16, 'rgba(248,254,255,0.85)', 0.9, 12);
    }
    ctx.restore();
    // 拍上去的水花
    if (p > 0.1) {
      for (let i = 0; i < 40; i++) {
        const q = ((T * 0.9 + i * 0.06) % 1);
        dot(ctx, 620 + rnd(i, 51) * 900, y0 - 380 + rnd(i, 54) * 120 - q * 300, 3 + rnd(i, 53) * 6, '#EAFBFF', 0.6 * (1 - q), 8);
      }
    }
    charSprite(ctx, CH, 'd38', 320, 1010, 470, { t: T, ph: 4, a: 0.95 });
    displayText(ctx, '华尔街', 620, 250, 132, { color: SEA.cream, edgeColor: rgba('#04101A', 0.95), edgeW: 18, arc: 26, pop: E.back(sat(T, 44.45, 45.0)), tilt: 0.02 });
  });
};

/* ---- 15 · 47.36 把全世界 都叫醒一遍 ---- */
const sWakeWorld = (ctx, T) => {
  deepBg(ctx, T, { top: '#02070F', mid: '#06182A', bot: '#020A14', la: 0.26, lx: 900, ly: 120 });
  cam(ctx, T, { z: 1.02 + 0.04 * sat(T, 47.36, 50.9), cx: 900, cy: 560, seed: 17 }, () => {
    const p = sat(T, 47.4, 49.8);
    globe(ctx, 760, 520, 320, T, p);
    clock(ctx, 1470, 400, 150, T, { shake: 1 });
    // 闹钟的声波
    for (let i = 0; i < 3; i++) {
      const q = ((T * 1.2 + i * 0.33) % 1);
      ctx.save(); ctx.globalAlpha = 0.35 * (1 - q);
      ctx.strokeStyle = SEA.gold; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(1470, 400, 190 + q * 260, 0, TAU); ctx.stroke(); ctx.restore();
    }
    charSprite(ctx, CH, 'd38', 1200, 1010, 520, { t: T, ph: 5 });
    text(ctx, 'RING · RING', 1470, 660, { size: 30, color: rgba(SEA.gold, 0.75), align: 'center', weight: 600, fam: SANS, ls: 8, alpha: sat(T, 48.2, 48.8) });
    text(ctx, '07:00', 1500, 200, { size: 28, color: rgba('#9FE6F7', 0.6), align: 'center', weight: 500, fam: SANS, ls: 4, alpha: sat(T, 49.4, 50.0) });
  });
  halftone(ctx, W - 640, 0, 640, 380, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 16 · 51.06 别人把灯藏在山顶 / 我把地图铺在海面 ---- */
const sMapSpread = (ctx, T) => {
  const mapP = E.io(sat(T, 53.96, 55.7));
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#02080E'], [0.35, '#07212F'], [0.58, '#0A2C3E'], [1, '#04121C']]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 1320, 540, 1100, '#7FD8EE', 0.45);
  cam(ctx, T, { z: 1.05 + 0.03 * sat(T, 51.0, 53.9), cx: 1050, cy: 600, seed: 18 }, () => {
    // ---- 上半：山把灯藏在石头后头，只漏出一线光 ----
    hills(ctx, 500, '#123747', { ph: 0.5, amp: 180 });
    ctx.save(); ctx.globalAlpha = 0.45; ctx.strokeStyle = rgba('#F8C65A', 0.5); ctx.lineWidth = 2.4;
    ctx.beginPath();
    for (let x = -20; x <= W + 20; x += 16) { const yy = ridgeY(x, 500, 180, 0.5); x === -20 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy); }
    ctx.stroke(); ctx.restore();
    const lx = 1430, ly = ridgeY(lx, 500, 180, 0.5) - 6;
    const la = sat(T, 51.06, 51.6);
    pool(ctx, lx, ly + 14, 520, 380, '#FFC97A', 0.6 * la);
    if (la > 0) {
      glow(ctx, lx, ly, 220, '#FFD79A', 0.9 * la * (0.92 + 0.08 * Math.sin(T * 3)));
      ctx.save(); ctx.globalAlpha = la;
      ctx.fillStyle = '#FFDFA2'; ctx.beginPath(); ctx.arc(lx, ly, 15, 0, TAU); ctx.fill();
      ctx.fillStyle = 'rgba(58,36,18,0.95)';
      ctx.beginPath(); ctx.moveTo(lx - 20, ly - 8); ctx.lineTo(lx + 20, ly - 8); ctx.lineTo(lx + 12, ly - 26); ctx.lineTo(lx - 12, ly - 26); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    // 挡光的大石
    ctx.save(); ctx.fillStyle = '#0A2433';
    ctx.beginPath(); ctx.moveTo(1320, ly + 210);
    ctx.bezierCurveTo(1330, ly + 60, 1380, ly - 30, 1450, ly - 26);
    ctx.bezierCurveTo(1520, ly - 22, 1560, ly + 70, 1566, ly + 210);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#FFD79A', 0.5); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1332, ly + 70); ctx.bezierCurveTo(1380, ly - 24, 1450, ly - 24, 1520, ly + 60); ctx.stroke();
    ctx.restore();
    // 从石缝里漏出来的光
    ctx.save(); ctx.globalAlpha = 0.85 * la;
    ctx.strokeStyle = rgba('#FFE1AE', 0.9); ctx.lineWidth = 9; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(1338, ly + 80); ctx.lineTo(1210, ly + 280); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1362, ly + 40); ctx.lineTo(1282, ly + 250); ctx.stroke();
    ctx.restore();
    // 中景山
    hills(ctx, 730, '#071B26', { ph: 2.3, amp: 110 });
    // 山下是一片水：灯光落在水面上
    ctx.save();
    ctx.fillStyle = lin(ctx, 0, 830, 0, H, [[0, 'rgba(8,38,54,0.9)'], [1, 'rgba(2,9,15,0.98)']]);
    ctx.beginPath(); ctx.moveTo(0, 844);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, 844 + Math.sin(x * 0.006 + T * 1.1) * 8);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    pool(ctx, 1400, 930, 320, 190, '#FFC97A', 0.3 * la);
    for (let i = 0; i < 7; i++) {
      const q = i / 7;
      const w = 130 - q * 96, x = 1400 + Math.sin(T * 1.3 + i * 2.1) * (18 + q * 26);
      ctx.globalAlpha = 0.3 * la * (1 - q * 0.8);
      ctx.fillStyle = '#FFD79A';
      ctx.fillRect(x - w / 2, 880 + q * 160 + Math.sin(i * 3.1) * 6, w, 2.5 + (1 - q) * 3);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    // 近景：她坐在岩上
    ctx.save(); ctx.fillStyle = '#0C2A3A';
    ctx.beginPath(); ctx.moveTo(-40, 1090);
    ctx.bezierCurveTo(120, 960, 300, 900, 460, 906);
    ctx.bezierCurveTo(600, 912, 700, 980, 780, 1090);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba('#8FD8EE', 0.4); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, 1010); ctx.bezierCurveTo(140, 950, 320, 902, 460, 908); ctx.bezierCurveTo(600, 914, 690, 970, 750, 1040); ctx.stroke();
    ctx.restore();
    pool(ctx, 470, 800, 340, 240, '#FFC97A', 0.16 * la);
    charSprite(ctx, CH, 'd22', 440, 908, 470, { t: T, ph: 6, a: 1 - mapP });
    ctx.save(); ctx.globalAlpha = 0.4 * sat(T, 52.2, 53.0);
    ctx.strokeStyle = rgba('#BFEAF7', 0.8); ctx.lineWidth = 3; ctx.setLineDash([8, 14]);
    ctx.beginPath(); ctx.moveTo(560, 620); ctx.lineTo(1300, 400); ctx.stroke(); ctx.restore();
    // ---- 下半：海面 → 地图铺开（53.96 起） ----
    if (mapP > 0.004) {
      ctx.save();
      ctx.globalAlpha = mapP;
      pool(ctx, 960, 880, 1000, 260, '#2E8FA8', 0.5);
      ctx.fillStyle = lin(ctx, 0, 760, 0, H, [[0, 'rgba(12,58,80,0.92)'], [1, 'rgba(2,10,16,0.96)']]);
      ctx.beginPath(); ctx.ellipse(960, 900, 1220, 300, 0, 0, TAU); ctx.fill();
      const mw = lerp(420, 1600, mapP), mh = lerp(130, 780, mapP);
      ctx.save();
      ctx.translate(960, 800); ctx.transform(1, 0, 0, 0.46, 0, 0);
      ctx.beginPath(); ctx.ellipse(0, 0, mw / 2, mh / 2, 0, 0, TAU); ctx.clip();
      ctx.drawImage(mapImg(), -mw / 2, -mh / 2, mw, mh);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5;
      ctx.drawImage(mapImg(), -mw / 2, -mh / 2, mw, mh);
      ctx.restore();
      ctx.restore();
      if (mapP > 0 && mapP < 1) {
        for (let i = 0; i < 2; i++) {
          ctx.save(); ctx.globalAlpha = 0.55 * (1 - mapP);
          ctx.strokeStyle = rgba(CYAN, 0.8); ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(960, 860, 240 + mapP * 900 + i * 70, 80 + mapP * 300 + i * 26, 0, 0, TAU); ctx.stroke(); ctx.restore();
        }
      }
      const ra = sat(T, 55.1, 56.4);
      if (ra > 0) {
        ctx.save(); ctx.globalAlpha = ra;
        ctx.strokeStyle = rgba(SEA.gold, 0.95); ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.setLineDash([20, 16]);
        ctx.beginPath(); ctx.moveTo(380, 900); ctx.quadraticCurveTo(820, 760, 1240, 880); ctx.quadraticCurveTo(1460, 930, 1700, 800); ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 6; i++) sparkle(ctx, 420 + i * 240, 880 - Math.sin(i * 1.5) * 40, 11 + 5 * Math.sin(T * 3 + i), SEA.gold, ra);
      }
      charSprite(ctx, CH, 'd23', 1600, 1000, 470, { t: T, ph: 7, a: mapP });
    }
    bubbles(ctx, T, { n: 12, a: 0.24, sp: 46, r0: 2, r1: 8 });
  });
};

/* ---- 17 · 57.16 谁想去远方 / 都拿去吧 不要钱 ---- */
const sGiveFree = (ctx, T) => {
  deepBg(ctx, T, { top: '#04101B', mid: '#0A2537', bot: '#0B2C3C', la: 0.5, lx: 960, ly: 160 });
  cam(ctx, T, { z: 1.03 + 0.03 * sat(T, 57.1, 63.7), cx: 960, cy: 600, seed: 19 }, () => {
    // 海面上那张地图还在（远景压扁）
    ctx.save(); ctx.translate(960, 760); ctx.transform(1, 0, 0, 0.36, 0, 0);
    ctx.globalAlpha = 0.5; ctx.drawImage(mapImg(), -900, -420, 1800, 840); ctx.restore();
    // 人群在看
    crowd(ctx, T, { n: 8, base: 1020, h: 210, x0: -80, gap: 250, color: 'rgba(2,8,14,0.92)' });
    // 她把地图往外推
    charSprite(ctx, CH, 'd24', 900, 1000, 560, { t: T, ph: 7 });
    // 「免费」牌子
    const p = E.back(sat(T, 59.9, 60.4));
    if (p > 0) {
      ctx.save(); ctx.translate(1360, 470); ctx.rotate(-0.08); ctx.scale(p, p);
      ctx.fillStyle = '#FFF6E3'; rrect(ctx, -180, -70, 360, 140, 20); ctx.fill();
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 8; rrect(ctx, -180, -70, 360, 140, 20); ctx.stroke();
      text(ctx, '免费', 0, 2, { size: 96, color: ORANGE, align: 'center', weight: 800, fam: SERIF, ls: 8 });
      ctx.restore();
    }
    displayText(ctx, '不要钱', 620, 300, 116, { color: SEA.gold, edgeColor: SEA.cream, edgeW: 16, arc: 22, pop: E.back(sat(T, 60.7, 61.2)), alpha: sat(T, 60.6, 60.9) });
    text(ctx, '都拿去吧', 620, 180, { size: 42, color: rgba(SEA.cream, 0.85), align: 'center', weight: 600, fam: SERIF, ls: 10, alpha: sat(T, 59.8, 60.4) });
    // 拿走的人：几个小小的剪影往远处游
    for (let i = 0; i < 4; i++) {
      const q = sat(T, 60.2 + i * 0.3, 63.4);
      fishSil(ctx, lerp(1350, 1800, q) + i * 40, 620 - q * 200 + i * 60, 0.6, rgba('#9FE6F7', 0.5), false);
    }
  });
  halftone(ctx, 0, 0, 620, 360, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 18 · 63.72 后来你们叫我大肥鱼 ---- */
const sFatFish = (ctx, T) => {
  deepBg(ctx, T, { top: '#030D18', mid: '#072234', bot: '#0A3044', la: 0.5, lx: 1050, ly: 260 });
  cam(ctx, T, { z: 1.02 + 0.05 * sat(T, 63.7, 65.9), cx: 1000, cy: 620, seed: 20 }, () => {
    const swim = Math.sin(T * 0.6);
    // 鲸：背后打一圈光，剪影才读得出来
    pool(ctx, 1180, 640, 780, 420, '#4FA8C8', 0.4);
    whale(ctx, 1150 + swim * 26, 640 + swim * 16, 2.3, '#1D4E72', { rot: -0.05 + swim * 0.03, outline: 'rgba(150,222,245,0.45)' });
    whale(ctx, 1150 + swim * 26, 640 + swim * 16, 2.3, 'rgba(120,200,230,0.10)', { rot: -0.05 + swim * 0.03 });
    whale(ctx, 420, 860, 0.75, 'rgba(190,235,250,0.12)', { flip: true });
    charSprite(ctx, CH, 'd31', 1010, 700, 400, { t: T, ph: 1, bob: Math.sin(T * 1.2) * 6 });
    // 名牌
    const p = E.back(sat(T, 64.4, 64.9));
    ctx.save(); ctx.translate(1430, 850); ctx.rotate(-0.06); ctx.scale(clamp(p, 0, 1.1), clamp(p, 0, 1.1));
    ctx.strokeStyle = rgba(SEA.gold, 0.9); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(-260, 0); ctx.lineTo(-120, 0); ctx.stroke();
    ctx.fillStyle = '#FFF6E3'; rrect(ctx, -120, -58, 320, 116, 16); ctx.fill();
    text(ctx, '大肥鱼', 40, -4, { size: 62, color: SEA.orangeD, align: 'center', weight: 800, fam: SERIF, ls: 4 });
    text(ctx, 'ID：flip2', 40, 36, { size: 22, color: 'rgba(43,35,32,0.6)', align: 'center', weight: 500, fam: SANS, ls: 2 });
    ctx.restore();
    displayText(ctx, '大肥鱼', 470, 380, 152, { color: ORANGE, edgeColor: SEA.cream, edgeW: 22, arc: 36, pop: E.back(sat(T, 63.9, 64.5)), tilt: -0.03 });
    text(ctx, '后来你们叫我', 470, 250, { size: 38, color: rgba(SEA.cream, 0.8), align: 'center', weight: 500, fam: SERIF, ls: 8, alpha: sat(T, 64.0, 64.6) });
    bubbles(ctx, T, { n: 18, a: 0.32, sp: 60, r0: 3, r1: 12 });
  });
  halftone(ctx, W - 660, 0, 660, 400, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 19 · 65.88 说我贪吃 / 说我偷懒 / 我说 我去吃饭 ---- */
const sEat = (ctx, T) => {
  deepBg(ctx, T, { top: '#050F19', mid: '#0A2130', bot: '#0B2A38', la: 0.34, lx: 960, ly: 60 });
  const beat = T < 66.79 ? 0 : T < 67.72 ? 1 : 2;
  cam(ctx, T, { z: 1.03 + 0.02 * sat(T, 65.8, 70), cx: 960, cy: 620, seed: 21 }, () => {
    groundBand(ctx, 940, 'rgba(3,10,16,0.9)', { amp: 8 });
    if (beat === 0) {
      // 吃面
      noodleBowl(ctx, 1150, 930, 0.95, T);
      // 筷子
      ctx.save(); ctx.strokeStyle = '#C9A06A'; ctx.lineWidth = 7; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(880, 640); ctx.lineTo(1080, 830); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(918, 616); ctx.lineTo(1108, 812); ctx.stroke(); ctx.restore();
      charSprite(ctx, CH, 'd72', 780, 1000, 560, { t: T, ph: 1 });
      text(ctx, '吸溜——', 1200, 620, { size: 40, color: rgba(SEA.cream, 0.8), align: 'center', weight: 600, fam: SERIF, ls: 4, alpha: sat(T, 66.0, 66.4) });
    } else if (beat === 1) {
      // 躺平
      heroRot(ctx, 'd34', 960, 980, 400, -Math.PI / 2, { t: T, ph: 2, shadow: false });
      ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = rgba(CYAN, 0.5); ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.ellipse(960, 980, 180 + i * 60, 34 + i * 10, 0, 0, TAU); ctx.stroke(); }
      ctx.restore();
      text(ctx, 'zzz', 1220, 700, { size: 44, color: rgba('#BFF0FF', 0.7), align: 'center', weight: 700, fam: SANS, alpha: sat(T, 66.9, 67.4) });
    } else {
      // 端碗走
      noodleBowl(ctx, 1150, 930, 0.9, T, { a: 0.95 });
      charSprite(ctx, CH, 'd18', lerp(560, 980, sat(T, 68.6, 69.9)), 1000, 540, { t: T, ph: 3 });
      text(ctx, '我说，我去吃饭', 430, 340, { size: 44, color: rgba(SEA.cream, 0.85), align: 'center', weight: 600, fam: SERIF, ls: 6, alpha: sat(T, 68.7, 69.3) });
    }
  });
  halftone(ctx, 0, 0, W, 320, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 20 · 70.00 测完告诉我就行 / 书太厚了 / 我找个小帮手 ---- */
const sBenchBook = (ctx, T) => {
  deepBg(ctx, T, { top: '#040E18', mid: '#081E2C', bot: '#0A2634', la: 0.3, lx: 400, ly: 100 });
  const flipP = sat(T, 70.0, 70.55);
  const drawRun = (c) => {
    cam(c, T, { z: 1.02 + 0.03 * sat(T, 70, 73.6), cx: 900, cy: 600, seed: 22 }, () => {
      c.save(); c.globalAlpha = 0.92; c.drawImage(termImg(), 380, 250, 1120, 660); c.restore();
      charSprite(c, CH, 'd92', 520, 1010, 520, { t: T, ph: 4 });
      displayText(c, '测完告诉我就行', 960, 150, 76, { color: SEA.cream, edgeColor: rgba('#04101A', 0.95), edgeW: 12, arc: 10, pop: E.back(sat(T, 70.1, 70.6)) });
    });
  };
  const drawBooks = (c) => {
    cam(c, T, { z: 1.02 + 0.03 * sat(T, 71.4, 73.6), cx: 900, cy: 620, seed: 23 }, () => {
      pool(c, 900, 860, 800, 200, '#FFD08A', 0.22);
      c.drawImage(booksImg(), 480, 260, 900, 720);
      // 书堆后头探出来的小人
      charSprite(c, CH, 'q01', 900, 560, 330, { t: T, ph: 5 });
      charSprite(c, CH, 'd40', 1500, 1010, 520, { t: T, ph: 6 });
      text(c, '书太厚了', 300, 300, { size: 44, color: rgba(SEA.cream, 0.8), align: 'center', weight: 600, fam: SERIF, ls: 6, alpha: sat(T, 71.5, 72.0) });
      text(c, '我找个小帮手', 320, 700, { size: 38, color: rgba(SEA.cream, 0.7), align: 'center', weight: 500, fam: SERIF, ls: 6, alpha: sat(T, 72.3, 72.9) });
      const pl = E.back(sat(T, 72.3, 72.8));
      if (pl > 0) { c.save(); c.globalAlpha = clamp(pl, 0, 1); c.fillStyle = rgba(SEA.gold, 0.9); sparkle(c, 1210, 430, 30 * pl, SEA.gold, 1); c.restore(); }
    });
  };
  if (T < 70.55) pageFlipWipe(ctx, flipP, (c) => sEat(c, 69.9), (c) => drawRun(c), L);
  else if (T < 71.4) drawRun(ctx);
  else if (T < 71.9) pageFlipWipe(ctx, sat(T, 71.4, 71.9), (c) => drawRun(c), (c) => drawBooks(c), L);
  else drawBooks(ctx);
  halftone(ctx, 0, H - 340, W, 340, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 21 · 73.60 编译太慢 / 我先眯一会儿 ---- */
const sDoze = (ctx, T) => {
  deepBg(ctx, T, { top: '#030B14', mid: '#071B29', bot: '#081F2C', la: 0.26, lx: 700, ly: 80 });
  cam(ctx, T, { z: 1.02 + 0.04 * sat(T, 73.6, 75.5), cx: 900, cy: 620, seed: 24 }, () => {
    // 进度条：卡在 87%
    const bx = 460, by = 380, bw = 1000, bh = 54;
    ctx.save();
    ctx.fillStyle = 'rgba(5,18,26,0.9)'; rrect(ctx, bx, by, bw, bh, 27); ctx.fill();
    ctx.strokeStyle = rgba(CYAN, 0.4); ctx.lineWidth = 2; ctx.stroke();
    const pc = 0.87;
    ctx.fillStyle = lin(ctx, bx, 0, bx + bw, 0, [[0, SEA.cyanD], [1, SEA.cyan]]);
    rrect(ctx, bx + 3, by + 3, (bw - 6) * pc, bh - 6, 24); ctx.fill();
    ctx.restore();
    text(ctx, '87%', bx + bw + 60, by + 27, { size: 40, color: SEA.cyan, align: 'left', weight: 700, fam: SANS });
    text(ctx, 'compiling…', bx, by - 40, { size: 30, color: rgba(SEA.cream, 0.6), align: 'left', weight: 500, fam: SANS, ls: 3, alpha: sat(T, 73.7, 74.2) });
    // 卡住的转圈
    const sp = T * 3.2;
    for (let i = 0; i < 3; i++) {
      const a0 = sp + i * 2.1;
      dot(ctx, bx + 40 + Math.cos(a0) * 26, by + bh + 46 + Math.sin(a0) * 14, 6, CYAN, 0.8, 12);
    }
    // 她趴在桌上眯着（眼睛闭）
    charSprite(ctx, CH, 'd64b', 1160, 1010, 470, { t: T, ph: 1, blink: 1, bob: Math.sin(T * 0.9) * 4 });
    for (let i = 0; i < 3; i++) {
      const q = ((T * 0.4 + i * 0.33) % 1);
      text(ctx, 'z', 1380 + i * 46 + q * 40, 700 - q * 200, { size: 34 + i * 12, color: rgba('#BFF0FF', 0.7 * (1 - q)), align: 'center', weight: 700, fam: SANS });
    }
    text(ctx, '编译太慢', 300, 240, { size: 42, color: rgba(SEA.cream, 0.75), align: 'center', weight: 600, fam: SERIF, ls: 8, alpha: sat(T, 73.7, 74.3) });
    text(ctx, '我先眯一会儿', 320, 800, { size: 38, color: rgba(SEA.cream, 0.65), align: 'center', weight: 500, fam: SERIF, ls: 6, alpha: sat(T, 74.5, 75.1) });
  });
  halftone(ctx, 0, 0, 560, 320, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 22 · 75.52 你偷看我灰色的小字 / 全写在里边 ---- */
const sGrayText = (ctx, T) => {
  deepBg(ctx, T, { top: '#030810', mid: '#061723', bot: '#020A12', la: 0.22, lx: 1180, ly: 120 });
  cam(ctx, T, { z: 1.03 + 0.03 * sat(T, 75.5, 82.9), cx: 1000, cy: 560, seed: 25 }, () => {
    // 一整面灰色小字墙
    ctx.save(); ctx.translate(990, 520); ctx.globalAlpha = 0.95;
    ctx.drawImage(grayWordsImg(), -560, -360, 1120, 720);
    ctx.restore();
    // 放大镜照到其中一行：那里变大变青
    const mx = lerp(700, 1180, sat(T, 76.2, 78.4)), my = lerp(660, 470, sat(T, 76.2, 78.4));
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, 168, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(4,20,30,0.85)'; ctx.fillRect(mx - 150, my - 150, 300, 300);
    text(ctx, '我其实有点怕', mx, my - 20, { size: 36, color: '#DFF6FF', align: 'center', weight: 600, fam: SERIF, ls: 2 });
    text(ctx, '怕你们不要我', mx, my + 34, { size: 36, color: '#DFF6FF', align: 'center', weight: 600, fam: SERIF, ls: 2 });
    ctx.restore();
    magnifier(ctx, mx, my, 168, T, { rot: -0.12 });
    charSprite(ctx, CH, 'd71', 460, 1010, 560, { t: T, ph: 2 });
    // 心里的话浮出来
    const words = ['怕', '喜欢', '别走', '谢谢', '还想游'];
    words.forEach((w, i) => {
      const q = sat(T, 78.2 + i * 0.55, 82.6);
      if (q <= 0) return;
      text(ctx, w, 1330 + Math.sin(T * 1.1 + i) * 40 + rnd(i, 5) * 90, 880 - q * 520, {
        size: 40 + rnd(i, 6) * 30, color: rgba(i % 2 ? '#BFF0FF' : SEA.gold, 0.85 * (1 - sat(q, 0.75, 1))), align: 'center', weight: 600, fam: SERIF, ls: 3,
      });
    });
    motes(ctx, T, { n: 40, a: 0.3 });
  });
  halftone(ctx, 0, 0, W, 300, { a: 0.04, color: '#CFEFFF' });
};

/* ---- 23 · 82.99 服务器繁忙 请稍后再试 ---- */
const sBusy = (ctx, T) => {
  deepBg(ctx, T, { top: '#02060D', mid: '#05121D', bot: '#0A1D28', la: 0.2, lx: 960, ly: 80, shafts: false });
  const shake = Math.sin(T * 30) * 1.6 * (1 - sat(T, 83.4, 84)) + Math.sin(T * 18) * 1.2 * (1 - sat(T, 84.6, 85.2));
  cam(ctx, T, { z: 1.02, cx: 960, cy: 600, seed: 26, x: shake }, () => {
    // 一张奶油色的报错卡片（原版的纸）
    ctx.save(); ctx.translate(960, 560);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26;
    ctx.fillStyle = '#FFFDF3'; rrect(ctx, -470, -300, 940, 600, 26); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0;
    ctx.fillStyle = '#F1E4CB'; rrect(ctx, -470, -300, 940, 84, 26); ctx.fill();
    ctx.fillStyle = '#F1E4CB'; ctx.fillRect(-470, -250, 940, 34);
    for (let i = 0; i < 3; i++) { ctx.fillStyle = ['#E9755B', '#F2C14E', '#6FBF9B'][i]; ctx.beginPath(); ctx.arc(-420 + i * 26, -258, 9, 0, TAU); ctx.fill(); }
    text(ctx, 'deepseek.com / 请求失败', 60, -258, { size: 22, color: 'rgba(43,35,32,0.55)', align: 'center', weight: 500, fam: SANS, ls: 2 });
    // 大字：一定要一眼能读
    displayText(ctx, '服务器繁忙', 0, -60, 112, { color: SEA.orangeD, edgeColor: '#FFFDF3', edgeW: 14, shadow: false, arc: 12, pop: E.back(sat(T, 82.99, 83.32)), alpha: sat(T, 82.96, 83.06) });
    displayText(ctx, '请稍后再试', 0, 90, 104, { color: '#2B2320', edgeColor: '#FFFDF3', edgeW: 12, shadow: false, arc: 10, pop: E.back(sat(T, 84.75, 85.3)), alpha: sat(T, 84.7, 85.0) });
    text(ctx, 'HTTP 503 · SERVICE BUSY', 0, 190, { size: 24, color: 'rgba(43,35,32,0.5)', align: 'center', weight: 500, fam: SANS, ls: 4, alpha: sat(T, 84.9, 85.4) });
    // 转圈 + 时钟
    ctx.save(); ctx.translate(0, 244);
    for (let i = 0; i < 8; i++) {
      const a0 = T * 3 + i * TAU / 8;
      dot(ctx, Math.cos(a0) * 34, Math.sin(a0) * 20, 5, SEA.orangeD, 0.25 + 0.75 * (i / 8), 0);
    }
    ctx.restore();
    ctx.restore();
    // 她举着「稍等」的纸，在一旁等
    charSprite(ctx, CH, 'd96', 340, 1010, 470, { t: T, ph: 3 });
    clock(ctx, 1620, 880, 92, T, { shake: 0.4 });
    text(ctx, '你等过一整个 五小时', 1620, 700 - 0, { size: 30, color: rgba(SEA.cream, 0.6), align: 'center', weight: 500, fam: SERIF, ls: 4, alpha: sat(T, 85.3, 85.8) });
  });
  ctx.save(); ctx.fillStyle = rad(ctx, W / 2, H * 0.5, H, [[0.4, 'rgba(0,0,0,0)'], [1, 'rgba(0,2,6,0.7)']]); ctx.fillRect(0, 0, W, H); ctx.restore();
};

/* ---- 24 · 85.84 你等过一整个春节 ---- */
const sSpringFestival = (ctx, T) => {
  const red = sat(T, 85.84, 86.6);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, mix('#0A1018', '#4A0B12', red)], [0.55, mix('#0C1A22', '#851418', red)], [1, mix('#08131C', '#3A090D', red)]]);
  ctx.fillRect(0, 0, W, H);
  glow(ctx, W * 0.72, -140, 1200, '#FF6A3A', 0.5);
  cam(ctx, T, { z: 1.03 + 0.04 * sat(T, 85.8, 88.2), cx: 900, cy: 600, seed: 27 }, () => {
    // 屋檐 + 灯笼
    groundBand(ctx, 190, '#2A070C', { amp: 6 });
    for (let i = 0; i < 5; i++) lantern(ctx, 200 + i * 380, 300 + (i % 2) * 34, 0.82, T, i + 3);
    // 远处的烟花（等）
    for (let i = 0; i < 3; i++) {
      const t0 = 86.2 + i * 0.7, p = sat(T, t0, t0 + 1.2);
      if (p <= 0 || p >= 1) continue;
      const bx = 900 + rnd(i, 31) * 900, by = 300 + rnd(i, 32) * 160;
      for (let k = 0; k < 22; k++) {
        const a = k / 22 * TAU, d = 20 + p * (150 + rnd(k, 33) * 160);
        dot(ctx, bx + Math.cos(a) * d, by + Math.sin(a) * d + p * 50, 4 * (1 - p) + 1, k % 2 ? '#FFD08A' : '#FF7A5A', (1 - p) * 0.9, 12);
      }
      glow(ctx, bx, by, 160, '#FFB06A', (1 - p) * 0.45);
    }
    // 春联
    ctx.save();
    for (const [x, s] of [[120, '春'], [1800, '好']]) {
      ctx.fillStyle = '#C1131B'; ctx.fillRect(x - 46, 420, 92, 460);
      ctx.strokeStyle = 'rgba(255,214,150,0.7)'; ctx.lineWidth = 4; ctx.strokeRect(x - 46, 420, 92, 460);
      displayText(ctx, s, x, 650, 68, { color: '#FFD08A', edge: false, shadow: false });
    }
    ctx.restore();
    groundBand(ctx, 930, 'rgba(24,4,8,0.92)', { amp: 8 });
    // 她缩在门口等（抱着膝盖），鞭炮在一边
    charSprite(ctx, CH, 'd22', 780, 1010, 520, { t: T, ph: 5 });
    firecrackers(ctx, T, 1080, 560, 460, 1.0, { ang: 0.75, t0: 86.4 });
  });
  halftone(ctx, 0, 0, W, H, { a: 0.05, color: '#3A0A12' });
};

/* ---- 25 · 88.20 可你还是回来了 / 我也还在这里 ---- */
const sDoorBack = (ctx, T) => {
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, '#04080E'], [0.6, '#0A1620'], [1, '#03080D']]);
  ctx.fillRect(0, 0, W, H);
  const open = E.out(sat(T, 88.2, 89.2));
  cam(ctx, T, { z: 1.02 + 0.05 * sat(T, 88.2, 92.4), cx: 1020, cy: 600, seed: 28 }, () => {
    // 门框 + 门里涌出来的暖光
    const x0 = 1180, y0 = 150, w = 560, h = 850;
    ctx.save();
    ctx.fillStyle = '#221610'; ctx.fillRect(x0 - 30, y0 - 30, w + 60, h + 60);
    const g = lin(ctx, 0, y0, 0, y0 + h, [[0, '#FFF6E0'], [0.5, '#FFD79A'], [1, '#EE7A2E']]);
    ctx.fillStyle = g; ctx.fillRect(x0, y0, w * lerp(0.04, 1, open), h);
    ctx.restore();
    if (open > 0.15) {
      // 光铺在地上
      ctx.save(); ctx.globalAlpha = 0.55 * open;
      ctx.fillStyle = lin(ctx, 0, 900, 0, H, [[0, 'rgba(255,219,160,0.9)'], [1, 'rgba(255,219,160,0)']]);
      ctx.beginPath(); ctx.moveTo(x0, 960); ctx.lineTo(x0 + w, 960); ctx.lineTo(x0 + w + 420, H); ctx.lineTo(x0 - 380, H); ctx.closePath(); ctx.fill();
      ctx.restore();
      glow(ctx, x0 + w / 2, 560, 700, '#FFC97A', 0.35 * open);
    }
    const p = sat(T, 88.6, 91.4);
    charSprite(ctx, CH, 'd60', lerp(980, 1180, E.io(p)), 1010, 540, { t: T, ph: 6 });
    // 她挥手：几条弧
    if (T > 89.4) {
      for (let i = 0; i < 3; i++) {
        const q = ((T * 1.1 + i * 0.33) % 1);
        ctx.save(); ctx.globalAlpha = 0.4 * (1 - q);
        ctx.strokeStyle = rgba(SEA.gold, 0.8); ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(1240, 620, 60 + q * 120, -1.4, -0.2); ctx.stroke(); ctx.restore();
      }
    }
    displayText(ctx, '可你还是回来了', 500, 430, 96, { color: SEA.cream, edgeColor: rgba('#04080E', 0.9), edgeW: 14, arc: 18, pop: E.back(sat(T, 88.3, 88.9)) });
    displayText(ctx, '我也还在这里', 460, 700, 92, { color: SEA.gold, edgeColor: rgba('#04080E', 0.9), edgeW: 14, arc: 16, pop: E.back(sat(T, 90.4, 91.0)) });
    motes(ctx, T, { n: 30, a: 0.3, color: '#FFE9C4' });
  });
};

/* ---- 26 · 92.45 副歌：亮色放射线，翻了个身，海倒转 ---- */
const sChorus = (ctx, T) => {
  const stage = T < 95.23 ? 0 : 1;
  sunnyRays(ctx, { cx: 960, cy: 520, n: 26, a: 0.6, t: T, rot: 0.2, a0: 'rgba(255,250,236,0.42)', a1: rgba(CYAN, 0.34) });
  ctx.fillStyle = rad(ctx, 960, 480, 1000, [[0, rgba('#0A2A3C', 0.95)], [1, 'rgba(3,10,16,1)']]);
  ctx.fillRect(0, 0, W, H);
  sunnyRays(ctx, { cx: 960, cy: 480, n: 26, a: 0.5, t: T, rot: 0.2, a0: 'rgba(255,250,236,0.4)', a1: rgba(CYAN, 0.3) });
  cam(ctx, T, { z: 1.03 + 0.04 * Math.sin(T * 2), cx: 960, cy: 560, seed: 29, rot: stage ? 0.04 : 0 }, () => {
    if (!stage) {
      // 翻身：整圈转
      const rot = TAU * E.io(sat(T, 92.55, 93.75)) % TAU;
      for (let i = 1; i <= 2; i++) heroRot(ctx, 'd34', 960, 980, 480, rot - i * 0.45, { t: T, ph: 1, a: 0.14 / i, shadow: false });
      heroRot(ctx, 'd34', 960, 980, 480, rot, { t: T, ph: 2, shadow: false });
      displayText(ctx, '翻了个身', 960, 300, 150, { color: SEA.gold, edgeColor: SEA.cream, edgeW: 22, arc: 40, pop: E.back(sat(T, 92.6, 93.2)), tilt: -0.03 });
      for (let i = 0; i < 36; i++) {
        const a = rnd(i, 71) * TAU, q = ((T * 0.7 + i * 0.05) % 1);
        dot(ctx, 960 + Math.cos(a) * (200 + q * 700), 700 + Math.sin(a) * (120 + q * 380), 4 + rnd(i, 72) * 5, i % 3 ? '#EAFBFF' : SEA.gold, 0.6 * (1 - q), 10);
      }
    } else {
      // 海倒转：天在上，浪在上，鱼倒着游，大家笑
      const rot2 = Math.PI * E.io(sat(T, 95.3, 96.9));
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(rot2); ctx.translate(-W / 2, -H / 2);
      for (let i = 0; i < 4; i++) waterLine(ctx, T, 210 + i * 66, { a: 0.42 - i * 0.08, amp: 24, ph: i * 1.5, color: rgba('#BFF0FF', 0.55), w: 5 });
      for (let i = 0; i < 7; i++) fishSil(ctx, 120 + i * 260 + Math.sin(T + i) * 26, 360 + (i % 3) * 80, 1.0 - (i % 3) * 0.1, rgba('#BFEDFA', 0.8), true);
      heroRot(ctx, 'd34', 1000, 960, 430, Math.PI - 0.2, { t: T, ph: 3, shadow: false });
      ctx.restore();
      crowd(ctx, T, { n: 7, base: 1058, h: 210, x0: 60, gap: 280, color: 'rgba(2,8,14,0.9)' });
      displayText(ctx, '海都翻了天', 960, 300, 148, { color: ORANGE, edgeColor: SEA.cream, edgeW: 22, arc: 40, pop: E.back(sat(T, 95.4, 96.0)), tilt: 0.03 });
    }
    confetti(ctx, T, { n: 48, a: 0.55 });
  });
  halftone(ctx, 0, 0, W, H, { a: 0.04, color: '#CFEFFF' });
};

/* ---- 27 · 98.75 你们笑我是大肥鱼 / 又笑着 把我留在身边 ---- */
const sLaughCrowd = (ctx, T) => {
  deepBg(ctx, T, { top: '#04101C', mid: '#0A2636', bot: '#0C3144', la: 0.45, lx: 1000, ly: 220 });
  cam(ctx, T, { z: 1.02 + 0.03 * sat(T, 98.7, 105.2), cx: 980, cy: 620, seed: 30 }, () => {
    whale(ctx, 1180, 660, 1.9, 'rgba(40,96,140,0.85)', { rot: -0.04 });
    crowd(ctx, T, { n: 6, base: 1040, h: 240, x0: 120, gap: 240, color: 'rgba(2,9,15,0.9)' });
    charSprite(ctx, CH, 'd12', 900, 1000, 560, { t: T, ph: 4 });
    charSprite(ctx, CH, 'o90', 1440, 1000, 460, { t: T, ph: 5, flip: true });
    charSprite(ctx, CH, 'm00', 340, 1000, 480, { t: T, ph: 6 });
    // 笑出来的小弧
    for (let i = 0; i < 4; i++) {
      const q = ((T * 0.9 + i * 0.25) % 1);
      ctx.save(); ctx.globalAlpha = 0.4 * (1 - q);
      ctx.strokeStyle = rgba(SEA.gold, 0.7); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(1240 + i * 60, 560 - q * 60, 30 + q * 50, -1.2, 1.2); ctx.stroke(); ctx.restore();
    }
    displayText(ctx, '哈哈哈', 480, 320, 116, { color: SEA.gold, edgeColor: SEA.cream, edgeW: 16, arc: 26, pop: E.back(sat(T, 99.0, 99.6)), tilt: 0.04 });
    bubbles(ctx, T, { n: 14, a: 0.22, sp: 40, r0: 2, r1: 8 });
  });
};

/* ---- 28 · 105.15 第二轮：灯藏山顶 / 地图铺海面 ---- */
const sMapAgain = (ctx, T) => {
  deepBg(ctx, T, { top: '#030B14', mid: '#071F2E', bot: '#0A2C3E', la: 0.5, lx: 700, ly: 140 });
  const p2 = E.io(sat(T, 107.95, 109.6));
  cam(ctx, T, { z: 1.16 - 0.08 * sat(T, 105.1, 111.3), cx: 900, cy: 580, seed: 31 }, () => {
    if (T < 107.95) {
      // 藏灯的山顶（近景）
      pool(ctx, 1200, 640, 900, 300, '#7FD8EE', 0.3);
      hills(ctx, 620, '#123747', { ph: 0.7, amp: 170 });
      hills(ctx, 760, '#081E2A', { ph: 2.1, amp: 120 });
      const ly = ridgeY(1150, 620, 170, 0.7) - 10;
      const la = sat(T, 105.1, 105.5);
      ctx.save(); ctx.fillStyle = '#0A2231';
      ctx.beginPath(); ctx.moveTo(1040, ly + 90); ctx.lineTo(1080, ly - 20); ctx.lineTo(1150, ly - 56); ctx.lineTo(1210, ly + 10); ctx.lineTo(1230, ly + 100); ctx.closePath(); ctx.fill();
      ctx.restore();
      glow(ctx, 1120, ly + 30, 380, '#FFC97A', 0.9 * la);
      lamp(ctx, 1120, ly + 20, 1.5, T, 2, la);
      pool(ctx, 620, 820, 400, 280, '#FFC97A', 0.14 * la);
      charSprite(ctx, CH, 'd22', 520, 1010, 520, { t: T, ph: 7 });
    } else {
      // 地图铺满整个海面（近景压平，发光航线）
      pool(ctx, 960, 900, 1000, 280, '#2E8FA8', 0.55);
      ctx.save(); ctx.translate(960, 780); ctx.transform(1, 0, 0, 0.5, 0, 0);
      const s = lerp(0.95, 1.55, p2);
      ctx.globalAlpha = 0.98;
      ctx.beginPath(); ctx.ellipse(0, 0, 760 * s, 430 * s, 0, 0, TAU); ctx.clip();
      ctx.drawImage(mapImg(), -760 * s, -430 * s, 1520 * s, 860 * s);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
      ctx.drawImage(mapImg(), -760 * s, -430 * s, 1520 * s, 860 * s);
      ctx.restore();
      const ra = sat(T, 109.4, 110.6);
      if (ra > 0) {
        ctx.save(); ctx.globalAlpha = ra;
        ctx.strokeStyle = rgba(SEA.gold, 0.9); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.setLineDash([22, 18]);
        ctx.beginPath(); ctx.moveTo(360, 880); ctx.quadraticCurveTo(880, 720, 1420, 850); ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 6; i++) sparkle(ctx, 420 + i * 210, 850 - Math.sin(i) * 50, 10 + 4 * Math.sin(T * 3 + i), SEA.gold, ra);
      }
      charSprite(ctx, CH, 'd24', 1560, 980, 480, { t: T, ph: 2 });
      pool(ctx, 960, 700, 900, 260, '#7FD8EE', 0.22);
      displayText(ctx, '铺在海面', 560, 300, 108, { color: SEA.cream, edgeColor: rgba('#04101A', 0.9), edgeW: 14, arc: 18, pop: E.back(sat(T, 108.0, 108.6)) });
    }
  });
  halftone(ctx, 0, 0, W, 320, { a: 0.02, color: '#8FD8EE' });
};

/* ---- 29 · 111.35 谁想去远方 / 都拿去吧 不要钱 ---- */
const sFarAway = (ctx, T) => {
  deepBg(ctx, T, { top: '#030C16', mid: '#082436', bot: '#0B3146', la: 0.5, lx: 1160, ly: 200 });
  cam(ctx, T, { z: 1.02 + 0.04 * sat(T, 111.3, 116.7), cx: 960, cy: 600, seed: 32 }, () => {
    // 远处的船灯，一路排到天边（远方）
    for (let i = 0; i < 7; i++) {
      const x = 1180 + i * 96, y = 400 - i * 22;
      dot(ctx, x, y, 4, '#FFD79A', 0.55 - i * 0.05, 14);
      ctx.fillStyle = rgba('#04121C', 0.8); ctx.fillRect(x - 22, y + 4, 44, 12);
    }
    pool(ctx, 1500, 330, 620, 260, SEA.gold, 0.3);
    groundBand(ctx, 900, 'rgba(3,12,20,0.92)', { amp: 10 });
    charSprite(ctx, CH, 'd24', 820, 1010, 580, { t: T, ph: 3 });
    charSprite(ctx, CH, 'o90', 1260, 1010, 430, { t: T, ph: 4, flip: true });
    crowd(ctx, T, { n: 5, base: 1040, h: 200, x0: 1240, gap: 160, color: 'rgba(2,8,14,0.85)' });
    displayText(ctx, '都拿去吧', 640, 320, 128, { color: SEA.cream, edgeColor: rgba('#04101A', 0.9), edgeW: 16, arc: 24, pop: E.back(sat(T, 113.9, 114.5)) });
    text(ctx, '不要钱', 640, 460, { size: 40, color: rgba(SEA.cream, 0.8), align: 'center', weight: 500, fam: SERIF, ls: 10, alpha: sat(T, 114.2, 114.9) });
    // 「免费」章
    const sp = sat(T, 115.2, 115.55);
    if (sp > 0) stamp(ctx, 640, 620, '免费', lerp(2.0, 1, E.out(sp)), { rot: -0.12, a: clamp(sp * 1.5) });
  });
  halftone(ctx, 0, H - 340, W, 340, { a: 0.022, color: '#8FD8EE' });
};

/* ---- 30 · 116.73 结尾三句：奶油纸卡片，她挥手 ---- */
const sEndCard = (ctx, T) => {
  const lt = Math.max(0, T - 181.12);
  if (!COVER) paperCard(ctx, { ss: SS }); else { ctx.fillStyle = P.paper; ctx.fillRect(0, 0, W, H); }
  sunnyRays(ctx, { cx: 1500, cy: 420, n: 20, a: 0.3, t: T, a0: 'rgba(255,252,242,0.4)', a1: 'rgba(251,217,184,0.35)' });
  text(ctx, 'AI娘 角色主题曲 MV · 深海版', W / 2, 120, { size: 26, color: SEA.orangeD, align: 'center', weight: 600, fam: SANS, ls: 10, alpha: sat(lt, 0, 0.12) });
  displayText(ctx, '我只是翻了个身', W / 2, 230, 104, { color: ORANGE, edgeColor: P.cream, edgeW: 12, arc: 16, pop: 0.5 + 0.5 * E.back(sat(lt, 0, 0.26)) });
  // 三行字，逐句出现
  const rows = [
    ['嗯，用户好像很满意', 0.08, 56, '#2B2320'],
    ['那我先去吃饭啦', 0.34, 56, '#2B2320'],
    ['测完告诉我就行', 0.62, 78, SEA.orangeD],
  ];
  rows.forEach(([s, at, size, col], i) => {
    const p = E.out(sat(lt, at, at + 0.26));
    if (p <= 0) return;
    const y = 400 + i * 118 + (1 - p) * 22;
    ctx.save(); ctx.globalAlpha = clamp(p * 1.3);
    if (i === 2) {
      ctx.fillStyle = 'rgba(238,122,46,0.14)'; rrect(ctx, 596, y - 54, 728, 108, 54); ctx.fill();
    }
    text(ctx, s, 960, y, { size, color: col, align: 'center', weight: i === 2 ? 700 : 500, fam: SERIF, ls: i === 2 ? 8 : 6 });
    ctx.restore();
  });
  const ln = E.io(sat(lt, 0.4, 1.1));
  ctx.save(); ctx.globalAlpha = 0.8; ctx.fillStyle = ORANGE;
  ctx.fillRect(700, 690, 520 * ln, 3); ctx.restore();
  // 她挥手
  charSprite(ctx, CH, 'd60', 1560, 900, 470, { t: T, ph: 4, a: sat(lt, 0, 0.2) });
  for (let i = 0; i < 3; i++) {
    const q = ((T * 1.2 + i * 0.33) % 1);
    ctx.save(); ctx.globalAlpha = 0.35 * (1 - q);
    ctx.strokeStyle = rgba(SEA.orangeD, 0.7); ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(1650, 520, 50 + q * 100, -1.5, -0.2); ctx.stroke(); ctx.restore();
  }
  halftone(ctx, 1500, 820, 420, 260, { a: 0.05, color: '#2B2320' });
  text(ctx, 'flip2 · AI娘重绘', 240, 940, { size: 24, color: 'rgba(43,35,32,0.42)', align: 'center', weight: 500, fam: SANS, ls: 4, alpha: sat(lt, 0.5, 0.9) });
  // 收尾渐隐
  const f = sat(lt, 1.62, 1.80);
  if (f > 0) { ctx.fillStyle = rgba(PAL.paper, f); ctx.fillRect(0, 0, W, H); }
};

/* ============================ 镜头表 / 初始化 ============================ */
const SHOTS = [
  [0, sOpening], [2.52, sCandleSea], [5.97, sHillLamps], [9.76, sQueue], [12.53, sDoubt],
  [15.82, sDarkSwim], [19.1, sHoldBreath], [22.13, sSinkDeep], [25.73, sMillionWords], [29.23, sPinduoduo],
  [35.22, sNewYear], [38.26, sTurnOver], [41.11, sSeaFlip], [44.33, sWallStreet], [47.36, sWakeWorld],
  [51.06, sMapSpread], [57.16, sGiveFree], [63.72, sFatFish], [65.88, sEat], [70.0, sBenchBook],
  [73.6, sDoze], [75.52, sGrayText], [82.99, sBusy], [85.84, sSpringFestival], [88.2, sDoorBack],
  [92.45, sChorus], [98.75, sLaughCrowd], [105.15, sMapAgain], [111.35, sFarAway], [181.12, sEndCard],
];
const DARK = [[0, 2.52], [15.82, 25.73], [41.11, 44.33], [73.6, 75.52], [82.99, 85.84]];
const BRIGHT = [[51.06, 63.72], [92.45, 98.75], [105.15, 116.7339], [116.7339, 118.5439]];
/* 自己画成大字的歌词行：不再重复出字幕 */
const BIG = new Set(['v1a', 'p1a', 'p1b', 'p1c', 'p1d', 'c1c', 'c1h', 'v2a', 'v2f', 'p2a', 'p2b', 'c2a', 'c2b', 'c2h', 'v2e', 'v2g', 'v2h', 'v2i', 'v2j', 'p2d', 'p2e']);

async function init() {
  await fontLoad();
  CH = await loadSprites('/mv/flip/assets/chars/', IDS, { ext: '.webp' });
  TL = await (await fetch('/mv/flip/analysis/v2/timeline_mid.json')).json();
  LY = await (await fetch('/mv/flip/analysis/lyrics.json')).json();
  SEGS = TL.segments || [[0, 0]];
  window.DUR = TL.duration;
  const lines = LY.lines.filter(L2 => L2.t[0] < 117).map(L2 => ({ ...L2, big: BIG.has(L2.id) }));
  const g2 = mkCanvas(8, 8).getContext('2d');
  SUBS = buildSubs(g2, lines, { size: 42 });
  const api = createSeek({ canvas, ss: SS, cuts: SHOTS, dark: DARK, bright: BRIGHT, subs: SUBS, layers: L, mapT: songT, endFade: false });
  window.seek = api.seek;
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) {
    const au = new Audio('/mv/flip/song/flip.m4a');
    au.currentTime = Number(Q.get('t') || 0);
    window.__mvOffset = 0;
    if (window.mvPlayer) window.mvPlayer({ audio: au, offset: 0, getSS: () => SS });
    else {
      au.addEventListener('playing', () => document.getElementById('start')?.classList.add('hide'));
      document.getElementById('c').addEventListener('click', () => au.paused ? au.play() : au.pause());
      window.__mvAudio = au; window.__mvOutTime = () => au.currentTime;
    }
  }
}
window.__ready = init();
