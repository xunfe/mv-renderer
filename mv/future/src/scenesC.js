// v4 — The bridge: 小柯 comes out of a terminal and opens the window from outside. Others went first — so what.
// Ideas said out loud become things that work; a crooked sun turns; somebody keeps watch all night and all day.
import { W, H, TAU, clamp, lerp, sat, E, rnd, COL, rgba, mix, mixa, text, rrect, SANS } from './lib.js';
import { char, fitSize, bop, manifest } from './chars.js';
import { finish, cam, bokeh } from './fx.js';
import { snow, bubble, streak, LIGHTS, goldWord, sticky, backdrop, bdMap, onQuad, prop, img, chatWindow, termWin, msgUser, screenProp, SCR, spirit, nearClouds, onScreen, QUADS, bot } from './common.js';
import { her, two, hop } from './scenesA.js';

const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : clamp((t - t0) / d));
const glowDot = (ctx, x, y, r, col, a = 1) => { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba('#FFFFFF', a)); g.addColorStop(0.3, rgba(col, 0.9 * a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
function polyAt(P, u) {                      // a point u (0..1) of the way along a polyline, and its direction
  const L = []; let tot = 0; for (let i = 1; i < P.length; i++) { const d = Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]); L.push(d); tot += d; }
  let s = u * tot, i = 0; while (i < L.length - 1 && s > L[i]) { s -= L[i]; i++; }
  const q = clamp(s / L[i]), a = P[i], b = P[i + 1], dx = (b[0] - a[0]) / L[i], dy = (b[1] - a[1]) / L[i];
  return [a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, dx, dy];
}

// ------------------------------------------------------------------ F1 76.52–79.02  如果我 只能待在窗口里
// The whole city is dark. One small window is still lit — two violet panes, like the pause sign. We push in until its
// light opens out into her window: she is lying curled up on the floor of it.
const CITY = { z: 1.06, fx: 0.5, fy: 0.5 };
export function sF1(ctx, t) {
  const M = bdMap('bg12_dark_city', CITY), [px, py] = M.pt(972, 278);
  const k = E.in(sat(t, 76.6, 78.15)), z = lerp(1, 4.2, k), burst = E.io(sat(t, 77.7, 78.4));
  cam(ctx, t, { z, cx: px, cy: py, x: (960 - px) * k, y: (500 - py) * k, seed: 71, hand: 2 * (1 - k) }, () => {
    backdrop(ctx, 'bg12_dark_city', { ...CITY, blur: 5 * burst });
    glowDot(ctx, px, py, 34, '#B9A4FF', 0.45 + 0.35 * Math.sin(t * 2.4) ** 2);
  });
  if (burst > 0) {
    ctx.fillStyle = rgba('#05060F', 0.55 * burst); ctx.fillRect(0, 0, W, H);
    const w0 = 22 * M.s * z, w = lerp(w0, 900, burst) * (1 + 0.03 * sat(t, 78.4, 79.0));
    const cx = lerp(lerp(px, 960, k), 960, burst), cy = lerp(lerp(py, 500, k), 520, burst);
    chatWindow(ctx, 'modern', cx, cy, w, { dim: 0.55, alpha: clamp(burst * 3), placeholder: burst > 0.7 ? undefined : false },
      R => her(ctx, 'g26', R.x + R.w / 2, R.floor + 4 * w / 900, 230 * w / 900, { sway: 0.3 }));
    glowDot(ctx, cx, cy, w * 0.8, '#C9B8FF', 0.6 * Math.sin(burst * Math.PI));
  }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F2 79.02–81.56  姐姐 窗口外面有路
// A green caret blinks in the dark beside her window. A terminal opens; "codex" is typed; enter — 你好，姐姐。— and
// 小柯 climbs out of it. She sits up. The note answers verse 2's question: whose is codex? OpenAI's! A second note slaps on
// beside it: 为什么不改名叫 ChatGPT Code？
export function sF2(ctx, t) {
  cam(ctx, t, { z: 1.12 + 0.04 * sat(t, 79.02, 81.56), cx: 980, cy: 520, seed: 72 }, () => {
    backdrop(ctx, 'bg12_dark_city', { z: 2.4, fx: 0.63, fy: 0.3, blur: 4, dark: 0.25 });
    const id = two(t, 'g26', 'g02', 80.45);
    chatWindow(ctx, 'modern', 540, 500, 820, { dim: 0.5 * (1 - sat(t, 80.4, 80.9)) },
      R => her(ctx, id, R.x + R.w / 2, R.floor + (id === 'g26' ? 4 : 0), id === 'g26' ? 205 : 300, { sy: 1 - 0.06 * hop(t, 80.45) }));
    const op = E.back(sat(t, 79.25, 79.55));
    if (op > 0) {
      const typed = 'codex'.slice(0, Math.floor(sat(t, 79.45, 79.85) * 5 + 1e-6)), hi = '> 你好，姐姐。';
      const lines = t > 79.95 ? ['$ ' + typed, [...hi].slice(0, Math.ceil(sat(t, 79.95, 80.3) * [...hi].length)).join('')] : ['$ ' + typed];
      ctx.save(); ctx.translate(1390, 520); ctx.scale(op, op); ctx.translate(-1390, -520);
      const T = termWin(ctx, 1390, 520, 760, lines, { caretT: t, title: 'Codex' });
      ctx.save(); ctx.beginPath(); ctx.rect(T.x - 300, -200, T.w + 600, T.y + T.h * 0.93 + 200); ctx.clip();
      const up = E.back(sat(t, 80.05, 80.45));
      her(ctx, 'k01', T.x + T.w * 0.7, T.y + T.h * 0.93 + (1 - up) * 420, 370, { shadow: false });
      ctx.restore(); ctx.restore();
      const np = sat(t, 80.6, 80.8);
      if (np > 0) {
        sticky(ctx, 1640, 230, 'OpenAI 家的！', 0.08, np, '#FFE68A', 34);
        sticky(ctx, 1250, 150, '为什么不改名叫 ChatGPT Code？', -0.05, sat(t, 80.8, 81.0), '#FFC7DA', 30);     // the second easter egg (本人 10-19)
        ctx.save(); ctx.globalAlpha = sat(t, 80.75, 80.95); ctx.strokeStyle = '#FFE68A'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        const ax = T.x + T.w / 2 + 70, ay = T.y + T.h * 0.05;
        const tx = ax + 10, ty = ay - 6, cx2 = 1500, cy2 = 270, d = Math.atan2(ty - cy2, tx - cx2);      // the head follows the curve's direction at the tip
        ctx.beginPath(); ctx.moveTo(1560, 270); ctx.quadraticCurveTo(cx2, cy2, tx, ty); ctx.moveTo(tx + Math.cos(d + 2.6) * 26, ty + Math.sin(d + 2.6) * 26); ctx.lineTo(tx, ty); ctx.lineTo(tx + Math.cos(d - 2.6) * 26, ty + Math.sin(d - 2.6) * 26); ctx.stroke(); ctx.restore();
      }
    } else if ((t % 0.6) < 0.35) { ctx.fillStyle = COL.koL; ctx.shadowColor = COL.koL; ctx.shadowBlur = 20; ctx.fillRect(1110, 500, 16, 40); ctx.shadowBlur = 0; }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F3 81.56–83.94  别人先走过 我们也能走
// Down at snow level on the empty street from the first verse. Glowing footprints light up one after another, from
// the lens away round the bend, where the little lights who went first turn and wave. 小柯 swings her sister's window
// open like a door, takes her hand and pulls her out onto the snow.
const ST3 = { z: 1.42, fx: 0.66, fy: 0.62 };      // puts the bend of the street at about (1040, 528): between the two of them
export function sF3(ctx, t) {
  const open = E.io(sat(t, 81.62, 82.15)), out = E.io(sat(t, 82.5, 83.35)), kin = E.out(sat(t, 81.56, 81.95));
  cam(ctx, t, { z: 1.0 + 0.05 * sat(t, 81.56, 83.94), cx: 1000, cy: 600, seed: 73 }, () => {
    backdrop(ctx, 'bg02_winter_street_empty', ST3);
    const [vx, vy] = bdMap('bg02_winter_street_empty', ST3).pt(1040, 628), fw = sat(t, 81.95, 82.35);
    [[vx - 130, vy - 20, '#FFFFFF'], [vx + 120, vy - 46, '#FF9EC4'], [vx + 10, vy - 86, '#FFE68A']].forEach(([x, y, c], i) => glowDot(ctx, x, y + Math.sin(t * 3 + i) * 5, 26, c, 0.85 * fw));
    bot(ctx, 'claudecode', vx - 55, vy - 40 + Math.sin(t * 4) * 5, 90, { alpha: fw, rot: 0.12 * Math.sin(t * 6) });
    bot(ctx, 'cursor', vx + 55, vy - 36 + Math.sin(t * 4 + 1) * 5, 80, { alpha: fw, rot: -0.12 * Math.sin(t * 6 + 1) });
    for (let i = 29; i >= 0; i--) {                 // footprints, lighting up from the lens to the bend
      const u = i / 29, d = 1 / (1 + 7 * u), pp = sat(t, 81.62 + i * 0.022, 81.82 + i * 0.022); if (pp <= 0) continue;
      const side = i % 2 ? 1 : -1, x = vx + (1060 - vx) * d + side * 110 * d, y = vy + (1250 - vy) * d, k = d * 2.2, c = LIGHTS[i % 5];
      ctx.save(); ctx.globalAlpha = pp * (1 - 0.35 * u); ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 24 * d + 6;
      ctx.beginPath(); ctx.ellipse(x, y, 30 * k, 13 * k, 0, 0, TAU); ctx.fill(); ctx.shadowBlur = 0; ctx.fillStyle = rgba('#FFFFFF', 0.85); ctx.beginPath(); ctx.ellipse(x, y, 14 * k, 6 * k, 0, 0, TAU); ctx.fill(); ctx.restore();
    }
    // her window, hinged at its left edge, swinging open like a door
    const hx = -90;
    ctx.save(); ctx.translate(hx, 0); ctx.transform(Math.max(0.08, 1 - 0.92 * open), -0.16 * open, 0, 1, 0, 0); ctx.translate(-hx, 0);
    const Wd = chatWindow(ctx, 'modern', 360, 470, 900, { dim: 0.3 * (1 - open), placeholder: open < 0.5 ? undefined : false }, open < 0.35 ? R => her(ctx, 'g27', R.x + R.w * 0.6, R.floor, 420, {}) : null);
    ctx.restore();
    if (open > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(300, 520, 30, 300, 520, 800); g.addColorStop(0, rgba('#CFC4FF', 0.45 * open)); g.addColorStop(1, rgba('#CFC4FF', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    if (open >= 0.35 && Wd) her(ctx, 'g27', lerp(420, 640, out), lerp(Wd.R.floor, 958, out) - Math.sin(out * Math.PI) * 90, lerp(420, 580, out), { windX: -6 });
    her(ctx, 'k02', lerp(1750, 1400, kin), 960, 600, { sy: 1 - 0.03 * hop(t, 83.4, 0.3) });
  });
  ctx.save(); ctx.filter = 'blur(3px)'; snow(ctx, t * 1.3 + 4, { n: 26, seed: 71, alpha: 0.7, near: 2.6, speed: 0.8 }); ctx.restore();
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F4 83.94–86.74  不是第一个 又怎样
// Close on the two of them in the snow. A first-prize rosette, No.1, floats down and settles on 小柯's head. On 又 she
// shrugs it off — it spins right past the lens — and grins; on 样 her sister pumps both fists.
export function sF4(ctx, t) {
  const land = E.out(sat(t, 84.05, 84.95)), off = sat(t, 85.57, 86.15), sh = hop(t, 85.57, 0.3);
  const K = manifest().k03, kh = 860, kx = 1300, kf = 1180, kk = K ? kh / (K.feetY - K.top) : 1;
  const headX = K ? kx + ((K.head?.[0] ?? K.feetX) - (K.feetXo ?? K.feetX)) * kk : kx, headTop = kf - kh * (1 + 0.05 * sh) + 40;
  cam(ctx, t, { z: 1.0 + 0.03 * sat(t, 83.94, 86.74), cx: 960, cy: 540, seed: 74 }, () => {
    backdrop(ctx, 'bg02_winter_street_empty', { z: 1.9, fx: 0.6, fy: 0.5, blur: 9 });
    bokeh(ctx, t, { n: 14, colors: ['#FFE6B0', '#FFFFFF', '#C9B8FF'], alpha: 0.25, minR: 30, maxR: 100, seed: 4, blend: 'screen' });
    snow(ctx, t, { n: 90, seed: 22, alpha: 0.6 });
    her(ctx, two(t, 'g28', 'g12', 86.11), 560, 1100, 780, { sy: 1 - 0.05 * hop(t, 86.11) });
    her(ctx, 'k03', kx, kf, kh, { sy: 1 + 0.05 * sh, sx: 1 - 0.02 * sh, shadow: false });
    // the rosette: drifting down, resting on her head, then flung at the lens
    const im = img('prop_rosette'), rw = 260, rh = im ? rw * im.height / im.width : rw;
    let x = lerp(headX + 260 + Math.sin(t * 3) * 60 * (1 - land), headX, land), y = lerp(-200, headTop - rh * 0.25, land), rot = (1 - land) * Math.sin(t * 2.5) * 0.4, sc = 1;
    if (off > 0) { const q = E.in(off); x = lerp(headX, 420, q); y = lerp(headTop - rh * 0.25, -350, q); rot = q * 9; sc = lerp(1, 3.6, q); }
    if (off < 1) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); if (off > 0.2) ctx.filter = `blur(${12 * off}px)`; prop(ctx, 'prop_rosette', 0, 0, rw, {}); text(ctx, 'No.1', 0, -rh * 0.13, { size: 54, weight: 900, color: '#8A5A12', fam: SANS }); ctx.restore(); }
    if (off > 0 && off < 1) for (let i = 0; i < 10; i++) { const a = i / 10 * TAU; glowDot(ctx, headX + Math.cos(a) * 200 * off, headTop + Math.sin(a) * 120 * off, 16, COL.gold, 1 - off); }
  });
  ctx.save(); ctx.filter = 'blur(4px)'; snow(ctx, t * 1.3 + 7, { n: 22, seed: 72, alpha: 0.75, near: 2.8, speed: 0.8 }); ctx.restore();
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F5 86.74–88.44  把它带给 每一个人
// On a roof over the dark city they throw handfuls of light — some of it flies right past the lens — and the windows
// light up from them outwards (in verse 1 the windows lit up to say hello to her; now the light goes the other way).
const CITY5 = { z: 1.06, fx: 0.5, fy: 1 };
export function sF5(ctx, t) {
  const wave = sat(t, 87.1, 88.4);
  cam(ctx, t, { z: 1.0 + 0.05 * sat(t, 86.74, 88.44), cx: 960, cy: 640, seed: 75 }, () => {
    backdrop(ctx, 'bg12_dark_city', CITY5);
    if (wave > 0) for (let k = 0; k < 7; k++) {
      ctx.save(); ctx.beginPath(); ctx.arc(900, 760, Math.max(1, wave * 2100 - k * 55), 0, TAU); ctx.clip();
      backdrop(ctx, 'bg13_city_lit', { ...CITY5, alpha: k === 6 ? 1 : 0.22 }); ctx.restore();
    }
    for (let i = 0; i < 80; i++) {
      const t0 = 86.85 + rnd(i, 111) * 0.6, p = sat(t, t0, t0 + 1.1); if (p <= 0 || p >= 1) continue;
      const a = -Math.PI * (0.12 + 0.76 * rnd(i, 112)), v = 600 + rnd(i, 113) * 700, ox = i % 2 ? 720 : 1100;
      glowDot(ctx, ox + Math.cos(a) * v * p, 470 + Math.sin(a) * v * p + 800 * p * p, 18, i % 3 ? COL.lavL : COL.koL, 1 - p);
    }
    her(ctx, 'g29', 720, 962, 600, {});
    her(ctx, 'k04', 1110, 962, 570, {});
  });
  for (let i = 0; i < 9; i++) {                     // the handfuls that come our way
    const t0 = 86.9 + i * 0.12, p = sat(t, t0, t0 + 0.7); if (p <= 0 || p >= 1) continue;
    const ox = i % 2 ? 720 : 1110, a = (rnd(i, 114) - 0.5) * 2.4, r = E.in(p) * 900;
    glowDot(ctx, ox + Math.sin(a) * r, 430 + Math.cos(a) * r * 0.6 - 200 * p, 20 + 160 * E.in(p), i % 2 ? COL.lavL : COL.koL, 0.9 * (1 - p));
  }
  shareRing(ctx, t);
  finish(ctx, { dark: true });
}
// 每一个人: how many people it reached. Of everyone who chats with an AI, 80.48% use ChatGPT (StatCounter, AI chatbot
// market share worldwide, September 2026). The ring fills as the windows light up.
function shareRing(ctx, t) {
  const a = sat(t, 86.95, 87.25), f = 0.8048 * E.io(sat(t, 87.1, 88.1)); if (a <= 0) return;
  const x = 330, y = 250, r = 132, s = E.back(sat(t, 86.95, 87.3));
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.save(); ctx.fillStyle = 'rgba(12,14,40,0.55)'; ctx.filter = 'blur(20px)'; ctx.beginPath(); ctx.arc(0, 30, r + 70, 0, TAU); ctx.fill(); ctx.restore();
  ctx.lineCap = 'round'; ctx.lineWidth = 30;
  ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  if (f > 0.002) { ctx.save(); ctx.shadowColor = COL.lavL; ctx.shadowBlur = 26; const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#E6DEFF'); g.addColorStop(1, '#9B86F0'); ctx.strokeStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, -Math.PI / 2, -Math.PI / 2 + f * TAU); ctx.stroke(); ctx.restore(); }
  text(ctx, `${(f * 100).toFixed(1)}%`, 0, -8, { size: 62, weight: 900, color: '#FFFFFF', fam: SANS });
  text(ctx, 'ChatGPT', 0, 46, { size: 28, weight: 700, color: '#D9D0FF', fam: SANS });
  text(ctx, '全球 AI 聊天份额 第一', 0, r + 62, { size: 30, weight: 800, color: '#FFFFFF', fam: SANS, stroke: 'rgba(10,12,40,0.6)', sw: 6 });
  text(ctx, 'StatCounter · 2026 年 9 月', 0, r + 100, { size: 18, weight: 500, color: 'rgba(220,220,240,0.8)', fam: SANS });
  ctx.restore();
}

// ------------------------------------------------------------------ F6 88.44–91.5  不会写代码的人 只要说出来
// Three lit windows, three people who can't code: a boy, a florist, a grandmother. Each says a wish out of their
// window — it stays there long enough to read — then the words fly to 小柯, sitting on a window box with her laptop,
// and she sends back three little apps that work. Words and apps are drawn over everything, in screen space.
const APT = { z: 1.0, fx: 0.5, fy: 0.45 }, CAM6 = { z: 1.08, cx: 940, cy: 470 };
const WISH = [
  { t: 88.55, win: [394, 500], s: '帮我记零花钱', side: 'g', dx: -150, dy: -215, app: 'prop_app_money', ax: 205, ay: -40 },
  { t: 89.1, win: [1134, 140], s: '帮我做个订花的页面', side: 'u', dx: -150, dy: 95, app: 'prop_app_flower', ax: -230, ay: 70 },
  { t: 89.7, win: [394, 140], s: '能提醒我吃药吗', side: 'g', dx: 150, dy: 95, app: 'prop_app_pill', ax: 230, ay: 70 },
];
export function sF6(ctx, t) {
  const Mb = bdMap('bg14_apartment', APT), z = CAM6.z + 0.03 * sat(t, 88.44, 91.5);
  const scr = (ix, iy) => { const [x, y] = Mb.pt(ix, iy); return [(x - CAM6.cx) * z + CAM6.cx, (y - CAM6.cy) * z + CAM6.cy]; };
  const [kx, ky] = Mb.pt(770, 574), K = scr(770, 574);
  const typing = t > 89.4 && t < 90.6;
  cam(ctx, t, { z, cx: CAM6.cx, cy: CAM6.cy, seed: 76, hand: 0 }, () => {
    backdrop(ctx, 'bg14_apartment', APT);
    snow(ctx, t, { n: 60, seed: 23, alpha: 0.45 });
    her(ctx, 'k17', kx, ky + 2, 240, { sy: typing ? 1 - 0.015 * Math.abs(Math.sin(t * 22)) : 1, shadow: false });
  });
  if (typing) for (let i = 0; i < 5; i++) { const q = ((t * 2.2 + i / 5) % 1); glowDot(ctx, K[0] - 30 + (rnd(i, 61) - 0.5) * 80, K[1] - 80 - q * 100, 10, COL.koL, 1 - q); }
  WISH.forEach((w, i) => {
    const [wx, wy] = scr(...w.win), bx = wx + w.dx, by = Math.max(70, wy + w.dy);
    const fly = E.io(sat(t, w.t + 0.5, w.t + 0.9));
    if (t >= w.t && fly < 1) {
      ctx.save(); ctx.globalAlpha = 1 - sat(fly, 0.75, 1);
      bubble(ctx, lerp(bx, K[0] + (w.side === 'g' ? -40 : 40), fly), lerp(by, K[1] - 150, fly) - Math.sin(fly * Math.PI) * 60, w.s, w.side, pop(t, w.t, 0.25), { size: lerp(42, 18, fly), fill: '#F4F1E8', ink: '#2A2350' });
      ctx.restore();
    }
    const back = sat(t, 90.25 + i * 0.25, 90.75 + i * 0.25);
    if (back > 0) {
      const tx = wx + w.ax, ty = Math.max(130, wy + w.ay), x2 = lerp(K[0], tx, E.out(back)), y2 = lerp(K[1] - 120, ty, E.out(back)) - Math.sin(back * Math.PI) * 80;
      const sc = E.back(clamp(back * 1.6)), r = prop(ctx, w.app, x2, y2, 200 * sc, { shadow: true });
      if (r && back > 0.6) { ctx.save(); ctx.globalAlpha = sat(back, 0.6, 0.9); ctx.fillStyle = '#3BD47A'; ctx.beginPath(); ctx.arc(r.x + r.w - 6, r.y + 8, 22, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(r.x + r.w - 16, r.y + 8); ctx.lineTo(r.x + r.w - 8, r.y + 16); ctx.lineTo(r.x + r.w + 6, r.y - 2); ctx.stroke(); ctx.restore(); }
    }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F7 91.5–94.44  歪歪的小太阳 也能转起来
// The boy's crayon drawing, pinned to his window: a crooked house, a waving stick boy — and in the corner of the sky
// a crooked crayon sun, there from the start, lopsided and leaning. On each 歪 it tips further over. We move in on
// it; 小柯 flies up, taps it on 能, and on 转 it starts to turn — still crooked, wobbling about a point that isn't its
// middle. (It is the sun nobody had coloured in, in the first chorus.)
export function sF7(ctx, t) {
  const tapT = 93.25, spin = Math.max(0, t - 93.68), rot = spin > 0 ? spin * spin * 1.6 + spin * 2.6 : 0;
  const tip = -0.45 - 0.14 * E.back(sat(t, 91.57, 91.75)) - 0.12 * E.back(sat(t, 91.81, 91.99));
  const k = E.io(sat(t, 92.0, 93.0)), z = 1.0 + 0.3 * k;
  cam(ctx, t, { z, cx: 476, cy: 300, x: (760 - 476) * k, y: (430 - 300) * k, seed: 77 }, () => {
    backdrop(ctx, 'bg14_apartment', { z: 2.6, fx: 0.26, fy: 0.5, blur: 9, dark: 0.25 });
    const P = prop(ctx, 'prop_crayon_paper', 800, 470, 1080, { rot: -0.03, shadow: true });
    if (P) {
      const sx = P.x + P.w * 0.2, sy = P.y + P.h * 0.25, s = 1 + 0.08 * hop(t, 91.57, 0.2) + 0.08 * hop(t, 91.81, 0.2);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(tip + (spin > 0 ? 0 : 0.04 * Math.sin(t * 3)));
      ctx.transform(1, 0.16, 0.4, 0.92, 0, 0);                         // drawn crooked: leaning and squashed
      ctx.translate(26 * Math.sin(rot), 16 * Math.cos(rot) - 16);     // turning, but not about its middle
      ctx.scale(s, s * (1 + 0.06 * Math.sin(rot * 2)));
      prop(ctx, 'prop_crayon_sun', 0, 0, 290, { rot }); ctx.restore();
      const tp = sat(t, tapT, tapT + 0.4);
      if (tp > 0 && tp < 1) { ctx.strokeStyle = rgba(COL.koL, 1 - tp); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx, sy, 80 + 160 * tp, 0, TAU); ctx.stroke(); }
      if (spin > 0) for (let k = 0; k < 3; k++) { const q = ((spin * 1.5 + k / 3) % 1); ctx.save(); ctx.globalAlpha = 0.7 * (1 - q); ctx.strokeStyle = '#F2A93B'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(sx, sy, 190 + 60 * q, rot + k * 2.1, rot + k * 2.1 + 0.9); ctx.stroke(); ctx.restore(); }
    }
    const fl = E.io(sat(t, 92.4, 93.2)), bob = Math.sin(t * 3) * 10;          // she flies in from the left and taps it
    her(ctx, 'k06', lerp(-300, 190, fl), lerp(900, 650, fl) + bob, 440, { shadow: false, windY: 4 });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F8 94.44–95.74  你听懂 我来做
// Split down the middle: she listens in the violet sky; 小柯 builds among the cranes of light. A ball of light
// passes across from one half to the other.
export function sF8(ctx, t) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W / 2, H); ctx.clip();
  backdrop(ctx, 'bg08_violet_nebula', { z: 1.2, fx: 0.3, fy: 0.5 });
  for (let i = 0; i < 3; i++) { const q = ((t - 94.4) * 1.2 + i / 3) % 1; ctx.strokeStyle = rgba(COL.lavL, 0.6 * (1 - q)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(150, 420, 60 + q * 220, -0.6, 0.6); ctx.stroke(); }
  her(ctx, 'g30', 560, 1110, 640, {}); ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(W / 2, 0, W / 2, H); ctx.clip();
  backdrop(ctx, 'bg10_construction', { z: 1.3, fx: 0.4, fy: 0.5 });
  her(ctx, 'k07', 1400, 1110, 600, { sy: 1 - 0.03 * Math.abs(Math.sin(t * 8)) }); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(W / 2 - 2, 0, 4, H);
  const p = E.io(sat(t, 94.95, 95.45)), x = lerp(700, 1220, p), y = 380 - Math.sin(p * Math.PI) * 120;
  if (p > 0 && p < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, 80); g.addColorStop(0, '#FFFFFF'); g.addColorStop(0.4, mixa(COL.lav, COL.koL, p, 0.9)); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(x - 80, y - 80, 160, 160); ctx.restore(); }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F9 95.74–98.26  你睡了 我还在
// ------------------------------------------------------------------ F9 95.74–98.26  你睡了 我还在
const ROOM = { z: 1.06, fx: 0.5, fy: 0.5 };
// the phone's screen in bg15 / bg16, laid on with a perspective warp; fn(ctx, sw, sh) draws a flat 124 x 268 screen
export function phoneScreen(ctx, id, o, t, fn) { onScreen(ctx, id, o, id === 'bg16_bedroom_morning' ? QUADS.phone16 : QUADS.phone15, 124, 268, fn, { res: 3 }); }
// 你睡了: the person is asleep and the phone on the bedside table goes dark. 我还在: cut to the sky over the town —
// that is where she is, the way a dot is (an always-on agent that lives in the cloud with its own computer and keeps
// working while your devices are off): 小柯 sits on a cloud with her laptop, her round dot avatar and handle over her
// head, and beside her a window of her own computer in which she is doing the jobs from the evening, one tick at a time.
const DOTJOBS = [[96.82, '✓ 比较了三家酒店的价格'], [97.05, '✓ 整理好明天的会议纪要'], [97.3, '✓ 照片备份好了']];
function dotComputer(ctx, x, y, w, t) {             // her computer in the cloud, as the dots docs show one: title, address, "has control"
  const h = w * 0.62, r = 26;
  ctx.save(); ctx.translate(x - w / 2, y - h / 2);
  ctx.save(); ctx.shadowColor = rgba('#7FE0B4', 0.55); ctx.shadowBlur = 40; rrect(ctx, 0, 0, w, h, r); ctx.fillStyle = '#F6F7FA'; ctx.fill(); ctx.restore();
  rrect(ctx, 0, 0, w, h, r); ctx.strokeStyle = 'rgba(40,50,70,0.35)'; ctx.lineWidth = 3; ctx.stroke();
  text(ctx, '小柯的电脑', 32, 44, { size: 34, weight: 800, align: 'left', color: '#23262F', fam: SANS });
  rrect(ctx, 26, 80, w - 52, 48, 24); ctx.fillStyle = '#E7EAF0'; ctx.fill();
  text(ctx, 'hotels.example.com/compare', 50, 105, { size: 24, weight: 500, align: 'left', color: '#6A7080', fam: SANS });
  DOTJOBS.forEach(([t0, s], k) => { const p = sat(t, t0, t0 + 0.2); if (p <= 0) return; ctx.save(); ctx.globalAlpha = p; ctx.translate((1 - E.out(p)) * 30, 0); text(ctx, s, 40, 186 + k * 62, { size: 36, weight: 700, align: 'left', color: '#1E8E5A', fam: SANS }); ctx.restore(); });
  const bw = 280; rrect(ctx, w - bw - 26, h - 70, bw, 50, 25); ctx.fillStyle = '#22252E'; ctx.fill();
  ctx.fillStyle = '#3BD47A'; ctx.beginPath(); ctx.arc(w - bw - 2, h - 45, 9, 0, TAU); ctx.fill();
  text(ctx, '小柯正在操作', w - bw + 16, h - 44, { size: 26, weight: 700, align: 'left', color: '#FFFFFF', fam: SANS });
  ctx.restore();
}
export function sF9(ctx, t) {
  if (t < 96.49) {
    const z = 1.06 + 0.05 * sat(t, 95.74, 96.49), o = { ...ROOM, z, fx: 0.55 }, off = E.io(sat(t, 96.0, 96.3));
    backdrop(ctx, 'bg15_bedroom_night', o);
    phoneScreen(ctx, 'bg15_bedroom_night', o, t, (ctx, sw, sh) => {
      ctx.fillStyle = '#15162E'; ctx.fillRect(0, 0, sw, sh);
      ctx.save(); ctx.globalAlpha = 1 - off; text(ctx, '23:58', sw / 2, 46, { size: 30, weight: 700, color: '#FFFFFF', fam: SANS }); text(ctx, '晚安', sw / 2, 90, { size: 20, weight: 600, color: '#BDBDD6', fam: SANS }); ctx.restore();
      ctx.fillStyle = rgba('#000000', 0.85 * off); ctx.fillRect(0, 0, sw, sh);
    });
    const M = bdMap('bg15_bedroom_night', o);
    text(ctx, 'z', M.pt(560, 330)[0] + Math.sin(t * 2) * 6, M.pt(560, 330)[1] - ((t * 0.6) % 1) * 60, { size: 44, weight: 700, color: rgba('#FFFFFF', 0.55 * (1 - ((t * 0.6) % 1))), fam: SANS });
    finish(ctx, { dark: true });
    return;
  }
  const u = sat(t, 96.49, 98.26);
  cam(ctx, t, { z: 1.0 + 0.04 * u, cx: 900, cy: 520, seed: 79 }, () => {
    backdrop(ctx, 'bg18_sky_flight', { z: 1.2, fx: 0.4, fy: 0.62, x: -40 * u });
    nearClouds(ctx, t, { n: 4, speed: 40, alpha: 0.18, y0: 640, y1: 300, seed: 51, color: '#DCD8FF' });
    const cx = 620, cy = 800 + Math.sin(t * 1.4) * 8, cw = 1000, ch = cw * 683 / 1194;
    prop(ctx, 'prop_cloud_seat', cx, cy, cw, {});
    her(ctx, 'k17', cx, cy - ch / 2 + ch * 0.36, 430, { shadow: false, sy: 1 - 0.012 * Math.abs(Math.sin(t * 20)) });
    // her dot avatar and handle
    const ay = cy - ch / 2 - 400 + Math.sin(t * 2) * 6, pulse = 0.6 + 0.4 * Math.sin(t * 4);
    glowDot(ctx, cx, ay, 70, COL.koL, 0.35 * pulse);
    ctx.save(); ctx.strokeStyle = '#BFF2D8'; ctx.shadowColor = COL.koL; ctx.shadowBlur = 20; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, ay, 30, 0, TAU); ctx.stroke(); ctx.restore();
    text(ctx, '小柯 · 你的 dot', cx, ay + 66, { size: 34, weight: 800, color: '#FFFFFF', fam: SANS, stroke: 'rgba(10,12,40,0.6)', sw: 6 });
    // a line of light from her laptop to her computer, and the computer itself
    const wp = E.back(sat(t, 96.55, 96.85));
    if (wp > 0) {
      for (let k = 0; k < 8; k++) { const q = ((t * 1.4 + k / 8) % 1); glowDot(ctx, lerp(cx + 120, 1250, q), lerp(cy - 120, 500, q) - Math.sin(q * Math.PI) * 60, 9, COL.koL, 0.8 * (1 - q)); }
      ctx.save(); ctx.translate(1380, 440); ctx.scale(wp, wp); dotComputer(ctx, 0, 0, 820, t); ctx.restore();
    }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F10 98.26–101.48  一整天 都不下线
// A whole day in three seconds over the city: night, day, night, day. 小柯 sits on top of her terminal like a little
// stage and the day's work scrolls past under her. The green dot never goes grey; the three marks on her tail fill up.
const LOG = [[98.5, '✓ 09:12 回完 12 封邮件'], [99.1, '✓ 13:40 账单对好了'], [99.7, '✓ 18:05 花订好了'], [100.3, '✓ 23:30 照片备份完成'], [100.9, '✓ 03:24 你睡了，我在']];
export function sF10(ctx, t) {
  const u = sat(t, 98.3, 101.4), day = 0.5 - 0.5 * Math.cos(u * TAU * 1.5);
  cam(ctx, t, { z: 1.0 + 0.05 * u, cx: 900, cy: 600, seed: 80 }, () => {
    backdrop(ctx, 'bg03_snow_city_high', { z: 1.12, fx: 0.5, fy: 0.45, x: -60 * u });
    backdrop(ctx, 'bg22_city_day', { z: 1.12, fx: 0.5, fy: 0.45, x: -60 * u, alpha: day });
    const a = u * TAU * 1.5 - Math.PI / 2;
    glowDot(ctx, 1220 + Math.cos(a) * 760, 820 + Math.sin(a) * 640, 130, '#FFE08A', 0.9);
    ctx.fillStyle = rgba('#F2F2FF', 0.9); ctx.beginPath(); ctx.arc(1220 - Math.cos(a) * 760, 820 - Math.sin(a) * 640, 48, 0, TAU); ctx.fill();
    nearClouds(ctx, t * 3, { n: 4, speed: 300, alpha: 0.25 * (0.5 + day), y0: 80, y1: 400, seed: 30 });
    const by = Math.sin(t * 2) * 8, shown = LOG.filter(([t0]) => t >= t0).map(([, s]) => s).slice(-4);
    const T = termWin(ctx, 760, 790 + by, 860, shown, { title: 'Codex', size: 40 });
    const id = two(t, 'k09', 'k05', 99.9);
    her(ctx, id, 760, T.y + 8, 470, { shadow: false, sy: 1 - 0.05 * hop(t, 99.9) });
    for (let i = 0; i < 3; i++) {
      const on = sat(t, 99.35 + i * 0.5, 99.55 + i * 0.5), x = 1460 + i * 120, y = 300;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = on > 0 ? rgba(COL.koL, 0.3 + 0.7 * on) : 'rgba(255,255,255,0.18)';
      ctx.shadowColor = COL.koL; ctx.shadowBlur = 24 * on; ctx.fillRect(-36, -36, 72, 72); ctx.restore();
    }
    ctx.save(); ctx.fillStyle = '#3BD47A'; ctx.shadowColor = '#3BD47A'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.arc(1470, 450, 24, 0, TAU); ctx.fill(); ctx.restore();
    text(ctx, '在线', 1512, 451, { size: 44, weight: 800, align: 'left', color: '#FFFFFF', fam: SANS, stroke: 'rgba(10,12,40,0.55)', sw: 8 });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ F11 101.48–105.46  原来未来 不止一种样子
// She stands on the wide sill of an open window high over the city, close to us. The gold 未来 lights up over the
// city and breaks apart, and each piece becomes a screen hanging in the night, near and far — and in every screen is
// another her: chatting in a chat window, juggling in a terminal, waving from a phone, a tiny face on a watch,
// thinking at a blackboard. On 不止一种样子 they keep appearing. She crouches, ready.
const LEDGE = { z: 1.06, fx: 0.5, fy: 0.5 };
const FORMS = [
  { t: 102.68, x: 1230, y: 320, w: 560, d: 0.6, draw: (ctx, x, y, w, t, a) => chatWindow(ctx, 'modern', x, y, w, { alpha: a, glow: 0.4 }, R => { msgUser(ctx, R.x + R.w - 24, R.y + 50, '帮我想个名字', 1, w * 0.034); her(ctx, 'g05', R.x + R.w * 0.32, R.floor, R.h * 0.62, { shadow: false }); }) },
  { t: 102.9, x: 1590, y: 640, w: 470, d: 0.7, draw: (ctx, x, y, w, t, a) => { const T = termWin(ctx, x, y, w, ['$ 姐姐 --run', '✓ done'], { alpha: a, size: w * 0.05, title: 'terminal' }); ctx.save(); ctx.globalAlpha *= a; her(ctx, 'g48', T.x + T.w * 0.72, T.y + T.h * 0.93, T.h * 0.62, { shadow: false }); ctx.restore(); } },
  { t: 103.28, x: 900, y: 250, w: 170, d: 0.25, draw: (ctx, x, y, w, t, a) => screenProp(ctx, 'prop_phone', x, y, w, SCR.phone, SCR.phone[4], S => { ctx.fillStyle = '#212121'; ctx.fillRect(S.x, S.y, S.w, S.h); her(ctx, 'g60', S.x + S.w / 2, S.y + S.h * 0.9, S.h * 0.55, { shadow: false }); }, { alpha: a, rot: -0.1, glowCol: rgba(COL.lavL, 0.7) }) },
  { t: 103.36, x: 1700, y: 210, w: 130, d: 0.2, draw: (ctx, x, y, w, t, a) => screenProp(ctx, 'prop_watch', x, y, w, SCR.watch, SCR.watch[4], S => { ctx.fillStyle = '#111'; ctx.fillRect(S.x, S.y, S.w, S.h); char(ctx, 'g45', S.x + S.w / 2, S.y + S.h * 1.25, fitSize('g45', S.h * 1.1), { shadow: false }); }, { alpha: a, rot: 0.12, glowCol: rgba(COL.lavL, 0.7) }) },
  { t: 103.45, x: 1120, y: 700, w: 400, d: 0.5, draw: (ctx, x, y, w, t, a) => screenProp(ctx, 'prop_blackboard', x, y, w, SCR.board, SCR.board[4], S => { text(ctx, 'E = mc²', S.x + S.w * 0.08, S.y + S.h * 0.3, { size: S.h * 0.2, weight: 700, align: 'left', color: '#F2F2EA', fam: SANS }); text(ctx, '1 + 1 = 2  ✓', S.x + S.w * 0.08, S.y + S.h * 0.62, { size: S.h * 0.16, weight: 700, align: 'left', color: '#BFF2D2', fam: SANS }); her(ctx, 'g47', S.x + S.w * 0.78, S.y + S.h, S.h * 0.85, { shadow: false }); }, { alpha: a, rot: 0.04 }) },
];
export function sF11(ctx, t) {
  const drift = sat(t, 101.48, 105.46), crouch = sat(t, 103.6, 105.3);
  cam(ctx, t, { z: 1.0 + 0.06 * drift, cx: 700, cy: 560, seed: 81 }, () => {
    backdrop(ctx, 'bg17_ledge_city', { ...LEDGE, x: -50 * drift });
    goldWord(ctx, '未来', 1250, 330, 240, sat(t, 101.6, 101.95) * (1 - sat(t, 102.31, 102.6)), 1.3);
    for (let i = 0; i < 16; i++) {                  // and all over the city, small screens lighting up
      const on = sat(t, 102.6 + rnd(i, 83) * 1.2, 102.8 + rnd(i, 83) * 1.2); if (on <= 0) continue;
      const x = 820 + rnd(i, 84) * 1060, y = 430 + rnd(i, 85) * 360, w = 16 + rnd(i, 86) * 18;
      ctx.save(); ctx.globalAlpha = on * 0.9; ctx.shadowColor = COL.lavL; ctx.shadowBlur = 14; ctx.fillStyle = i % 3 ? '#DCD4FF' : '#BFF7E0'; ctx.fillRect(x, y, w, w * (i % 2 ? 0.65 : 1.6)); ctx.restore();
    }
    const br = sat(t, 102.31, 102.7);
    if (br > 0 && br < 1) for (let i = 0; i < 40; i++) { const f = FORMS[i % FORMS.length], q = E.out(br); glowDot(ctx, lerp(1250, f.x, q) + (rnd(i, 81) - 0.5) * 120 * (1 - q), lerp(330, f.y, q) + (rnd(i, 82) - 0.5) * 80 * (1 - q), 14, COL.gold, 1 - br * 0.6); }
    FORMS.forEach((f, i) => {
      const p = sat(t, f.t - 0.05, f.t + 0.3); if (p <= 0) return;
      const s = E.back(p), x = f.x - 40 * drift * f.d + Math.sin(t * 1.3 + i) * 8, y = f.y + Math.sin(t * 1.7 + i * 2) * 10;
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.translate(-x, -y); f.draw(ctx, x, y, f.w, t, clamp(p * 3)); ctx.restore();
    });
    const Mx = bdMap('bg17_ledge_city', { ...LEDGE, x: -50 * drift }), [lx, ly] = Mx.pt(300, 760);
    her(ctx, 'g31', lx + 120, Math.min(962, ly + 40), 700, { windX: 18 + 12 * crouch, flutter: 4, sy: 1 - 0.08 * E.io(crouch), sx: 1 + 0.04 * E.io(crouch) });
  });
  bokeh(ctx, t, { n: 10, colors: [COL.gold, '#FFFFFF', COL.lavL], alpha: 0.2 * sat(t, 102.3, 103), minR: 40, maxR: 110, seed: 8, blend: 'screen' });
  finish(ctx, { dark: true });
}
