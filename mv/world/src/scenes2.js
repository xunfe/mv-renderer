// Scenes 0:56–1:44 — chorus and outro. Her world is cream, orange and ink; green and blue arrive with Ko and 大肥鱼.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, COL, mix, rgba, pulse, kick, beatPhase, glyph, drawGlyph, text, measure, paper, rrect, caret, flower, MEMO } from './lib.js';
import { char, bop, breathe, walkBob, walkPose } from './chars.js';
import { hit, sq, star4, rays, miniPage } from './scenes1.js';
import { finish, bokeh, cam, cut, softGlyph, hillPath } from './fx.js';

export const TRI = [COL.orange, '#2FA676', '#3F6FD0'];
export const PASTEL = ['#FBD3A6', '#BFE8D2', '#BFD6F5'];
// Variants, set by the cut list around a call. solo: 橙子 is still alone (the first chorus of the full version), so
// no Ko, no 大肥鱼, and none of their colours yet. cta: what the end card asks for.
export const VAR = { solo: false, ctaTail: '发布完整版', ctaMid: true, c2: null, whale2: false, endAsk: '' };
const PAL = () => (VAR.solo ? [COL.orange, COL.yellow, COL.orangeD] : TRI);

// paper cut-out lettering: white rim, coloured face, soft shadow
export function cutGlyph(ctx, ch, x, y, size, color, o = {}) {
  const s = o.s ?? 1;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(s, s); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = `900 ${size}px "Noto Serif SC"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(90,50,15,0.32)'; ctx.shadowBlur = size * 0.1; ctx.shadowOffsetY = size * 0.05;
  ctx.lineWidth = size * 0.13; ctx.strokeStyle = o.rim ?? COL.white; ctx.strokeText(ch, 0, 0);
  ctx.shadowColor = 'transparent'; ctx.fillStyle = color; ctx.fillText(ch, 0, 0);
  ctx.restore();
}
// scraps of paper that tumble (x-scale flips) under gravity
export function confetti(ctx, t, t0, cx, cy, n, colors, seed = 0, power = 1) {
  const dt = t - t0; if (dt < 0 || dt > 4) return;
  for (let i = 0; i < n; i++) {
    const an = rnd(i, seed + 1) * TAU, sp = (500 + rnd(i, seed + 2) * 1300) * power;
    const drag = 1 - Math.exp(-dt * 2.2);
    const x = cx + Math.cos(an) * sp * drag * 0.62, y = cy + Math.sin(an) * sp * drag * 0.5 + 240 * dt * dt * (0.5 + rnd(i, seed + 3));
    const a = 1 - sat(dt, 1.8, 3.4); if (a <= 0 || y > H + 60) continue;
    const w = 14 + rnd(i, seed + 4) * 22, h = w * (0.45 + rnd(i, seed + 5) * 0.5);
    ctx.save(); ctx.translate(x, y); ctx.rotate(an + dt * (2 + rnd(i, seed + 6) * 5)); ctx.scale(Math.cos(dt * (5 + rnd(i, seed + 7) * 8) + i), 1);
    ctx.globalAlpha = a; ctx.fillStyle = colors[i % colors.length]; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  }
}
// a written character lifts off, starts to flap, and is a butterfly
export const BCH = '世界还在写字风蝶星海山火页明天街你我';
export function butterfly(ctx, ch, x, y, size, color, flap, rot, alpha, m) {
  const f = 0.14 + 0.86 * Math.abs(Math.cos(flap));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= alpha;
  if (m < 1) {
    const g = glyph(ch, size, 900, color), k = size / g.q, d = g.s * k, ff = lerp(1, f, clamp(m * 3));
    ctx.save(); ctx.globalAlpha *= 1 - m;
    ctx.save(); ctx.scale(ff, 1); ctx.drawImage(g.c, 0, 0, g.s / 2, g.s, -d / 2, -d / 2, d / 2, d); ctx.restore();
    ctx.save(); ctx.scale(-ff, 1); ctx.drawImage(g.c, 0, 0, g.s / 2, g.s, -d / 2, -d / 2, d / 2, d); ctx.restore();
    ctx.restore();
  }
  if (m > 0) {
    ctx.globalAlpha *= m; ctx.lineWidth = Math.max(1.5, size * 0.05); ctx.strokeStyle = COL.ink; ctx.fillStyle = color; ctx.lineJoin = 'round';
    for (const sgn of [-1, 1]) {
      ctx.save(); ctx.scale(sgn * f, 1);
      ctx.beginPath(); ctx.moveTo(0, -size * 0.05); ctx.bezierCurveTo(size * 0.15, -size * 0.62, size * 0.72, -size * 0.6, size * 0.56, -size * 0.1); ctx.bezierCurveTo(size * 0.5, 0.02 * size, size * 0.2, 0.04 * size, 0, 0.02 * size); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, 0.02 * size); ctx.bezierCurveTo(size * 0.3, 0.04 * size, size * 0.52, 0.3 * size, size * 0.3, 0.46 * size); ctx.bezierCurveTo(size * 0.14, 0.5 * size, 0.02 * size, 0.3 * size, 0, 0.12 * size); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = COL.ink; rrect(ctx, -size * 0.035, -size * 0.2, size * 0.07, size * 0.5, size * 0.03); ctx.fill();
  }
  ctx.restore();
}
export function swarm(ctx, t, t0, n, o = {}) {
  for (let i = 0; i < n; i++) {
    const ts = t0 + rnd(i, 601) * (o.spread ?? 1.6), dt = t - ts; if (dt < 0) continue;
    const sp = 0.55 + rnd(i, 602) * 0.7;
    const x0 = (o.x0 ?? 200) + rnd(i, 603) * (o.w ?? 1300), y0 = (o.y0 ?? 930) - rnd(i, 604) * (o.h ?? 80);
    const x = x0 + dt * (o.vx ?? 250) * sp + Math.sin(dt * 2.3 + i) * 70, y = y0 - dt * (o.vy ?? 230) * sp - Math.sin(dt * 3.1 + i * 2) * 40;
    if (y < -120 || x > W + 120) continue;
    const size = (o.size ?? 54) * (0.6 + rnd(i, 605) * 0.9);
    butterfly(ctx, BCH[i % BCH.length], x, y, size, PAL()[i % 3], t * (13 + rnd(i, 606) * 6) + i, 0.45 + Math.sin(dt * 2 + i) * 0.3, sat(dt, 0, 0.2) * (o.alpha ?? 1), sat(dt, 0.45, 1.0));
  }
}

// ------------------------------------------------------------------ 0:56–0:59  世界还在写 — she leaps out
const ARC = [[330, 340], [610, 196], [960, 132], [1310, 196], [1590, 340]];
const C1 = [57.05, 57.58, 58.0, 58.28, 58.6];       // syllable starts, measured on the vocal stem
export function sChorusA(ctx, t) {
  const punch = hit(t, 55.91, 5);
  cam(ctx, t, { z: 1 + 0.1 * punch + 0.04 * sat(t, 55.91, 59.4) + 0.025 * kick(t), seed: 11, hand: 4 }, () => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF6E2'); g.addColorStop(1, '#FDDDB3');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    rays(ctx, 960, 640, t * 1.4, 0.42, '#FCCB8E', 16);
    ctx.fillStyle = '#FFE9BF'; ctx.beginPath(); ctx.arc(960, 640, 370 + 22 * pulse(t, 5), 0, TAU); ctx.fill();
    cut(ctx, () => hillPath(ctx, 880, 120, 420, 0.4, t * 14), '#F7C592');
    cut(ctx, () => hillPath(ctx, 990, 130, 300, 2.1, t * 26), '#F0A260');
    const TITLE = '世界还在写';
    for (let i = 0; i < 5; i++) {
      if (t < C1[i]) continue;
      const s = 0.4 + 0.6 * E.back(sat(t, C1[i], C1[i] + 0.28)) + 0.07 * pulse(t, 6);
      cutGlyph(ctx, TITLE[i], ARC[i][0], ARC[i][1] + Math.sin(t * 2 + i) * 8, 200, COL.orange, { s, rot: (i - 2) * 0.1 + Math.sin(t * 1.4 + i) * 0.02 });
    }
    confetti(ctx, t, 55.91, 960, 720, 130, [COL.orange, COL.peach, COL.white, COL.ink, COL.yellow], 300);
    const lift = 215 * E.out(sat(t, 55.91, 56.5)) - 22 * E.io(sat(t, 56.5, 59.4));
    char(ctx, 'o12', 960, 1125, 760, { lift, rot: -0.06 + 0.06 * sat(t, 55.91, 57.6), flutter: 5, sway: 1.6, shadow: false, blink: 0 });
  });
  bokeh(ctx, t, { n: 12, seed: 110, alpha: 0.18, colors: [COL.white, COL.yellow, COL.peach] });
  finish(ctx, { light: 0.7 });
  const fl = 1 - sat(t, 55.91, 56.35);
  if (fl > 0) { ctx.fillStyle = rgba('#FFF7DB', fl); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 0:59–1:10  the walk: words turn into the world
const T0 = 59.4, V = 330, TD = 65.66, TS2 = 67.59;
export const GY = 884;
const XS = V * (TD - T0) + V * (TS2 - TD) * 0.5;       // where she stops
function xw(t) {
  if (t <= TD) return V * (t - T0);
  const u = sat(t, TD, TS2); return V * (TD - T0) + V * (TS2 - TD) * (u - u * u / 2);
}
const OBJ = [
  { k: 'tree', ch: '树', x: 330, s: 1.05 }, { k: 'flow', ch: '花', x: 610, s: 1 }, { k: 'cloud', ch: '云', x: 780, y: 250, s: 1 },
  { k: 'tree', ch: '树', x: 960, s: 1.3 }, { k: 'bird', ch: '鸟', x: 1160, y: 380, s: 1 }, { k: 'flow', ch: '花', x: 1300, s: 1.1 },
  { k: 'lamp', ch: '灯', x: 1560, s: 1 }, { k: 'cloud', ch: '云', x: 1720, y: 180, s: 1.3 }, { k: 'tree', ch: '树', x: 1860, s: 0.95 },
  { k: 'flow', ch: '花', x: 2080, s: 1 }, { k: 'bird', ch: '鸟', x: 2200, y: 300, s: 0.9 },
];
export function drawObj(ctx, o, sx, p, t) {
  const base = o.y ?? GY, gp = 1 - E.in(sat(p, 0, 0.6)), sp = E.back(sat(p, 0.25, 1));
  if (gp > 0.01) {
    if (!o.y) { ctx.fillStyle = rgba(COL.ink, 0.12 * gp); ctx.beginPath(); ctx.ellipse(sx, base, 54 * o.s, 7, 0, 0, TAU); ctx.fill(); }
    drawGlyph(ctx, o.ch, sx, base - (o.y ? 0 : 74 * o.s), 132 * o.s * (0.7 + 0.3 * gp), { weight: 800, alpha: gp * 0.9, rot: (1 - gp) * 0.5 });
  }
  if (sp <= 0) return;
  ctx.save(); ctx.translate(sx, base); ctx.scale(o.s * sp, o.s * sp); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (o.k === 'tree') {
    ctx.fillStyle = 'rgba(60,40,20,0.14)'; ctx.beginPath(); ctx.ellipse(0, 0, 90, 10, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#7A5338'; ctx.beginPath(); ctx.moveTo(-12, 0); ctx.lineTo(-8, -130); ctx.lineTo(8, -130); ctx.lineTo(12, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.rotate(Math.sin(t * 1.8 + o.x) * 0.03);
    const canopy = () => { ctx.beginPath(); ctx.arc(-56, -176, 66, 0, TAU); ctx.moveTo(126, -184); ctx.arc(56, -184, 70, 0, TAU); ctx.moveTo(80, -258); ctx.arc(0, -258, 80, 0, TAU); };
    cut(ctx, canopy, COL.orange, 0.25, 18, 6);
    canopy(); ctx.stroke();
    ctx.fillStyle = COL.orange; ctx.beginPath(); ctx.arc(-56, -176, 62, 0, TAU); ctx.arc(56, -184, 66, 0, TAU); ctx.arc(0, -258, 76, 0, TAU); ctx.fill();
    ctx.fillStyle = '#F6A05C'; ctx.beginPath(); ctx.arc(-18, -270, 38, 0, TAU); ctx.arc(-70, -190, 26, 0, TAU); ctx.fill();
  } else if (o.k === 'flow') {
    for (let i = 0; i < 3; i++) {
      const fx = (i - 1) * 48, fh = 72 + i * 24, sw = Math.sin(t * 2.2 + i + o.x) * 6;
      ctx.beginPath(); ctx.moveTo(fx, 0); ctx.quadraticCurveTo(fx + sw * 0.4, -fh * 0.5, fx + sw, -fh); ctx.stroke();
      flower(ctx, fx + sw, -fh, 27, t * 0.6 + i, i === 1 ? COL.yellow : COL.orange);
    }
  } else if (o.k === 'lamp') {
    const gl = ctx.createRadialGradient(0, -280, 5, 0, -280, 150); gl.addColorStop(0, rgba(COL.yellow, 0.8)); gl.addColorStop(1, rgba(COL.yellow, 0));
    ctx.fillStyle = gl; ctx.fillRect(-160, -440, 320, 320);
    ctx.fillStyle = COL.ink; ctx.fillRect(-5, -250, 10, 250);
    rrect(ctx, -28, -316, 56, 70, 14); ctx.fillStyle = COL.yellow; ctx.fill(); ctx.stroke();
  } else if (o.k === 'cloud') {
    const dx = Math.sin(t * 0.5 + o.x) * 14;
    const cl = () => { ctx.beginPath(); ctx.arc(dx - 70, 0, 46, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(dx, -30, 66, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(dx + 80, 0, 52, Math.PI * 1.4, Math.PI * 0.5); ctx.closePath(); };
    cut(ctx, cl, COL.white, 0.2, 24, 10); cl(); ctx.stroke();
  } else if (o.k === 'bird') {
    const fly = Math.max(0, p - 1), fl = Math.sin(t * 11 + o.x) * 0.7;
    ctx.translate(fly * 260, -fly * 190 + Math.sin(t * 3 + o.x) * 10);
    ctx.fillStyle = COL.orange;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-56, -32 * fl - 8); ctx.lineTo(-16, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(56, -32 * fl - 8); ctx.lineTo(16, 12); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
export function house(ctx, x, w, h, color, fillP, t) {
  ctx.save(); ctx.translate(x, GY); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round';
  const body = () => { ctx.beginPath(); ctx.moveTo(-w / 2, 0); ctx.lineTo(-w / 2, -h); ctx.lineTo(0, -h - w * 0.42); ctx.lineTo(w / 2, -h); ctx.lineTo(w / 2, 0); ctx.closePath(); };
  cut(ctx, body, COL.white, 0.18, 26, 4);
  if (fillP > 0) {
    ctx.save(); body(); ctx.clip();
    const top = (h + w * 0.42 + 20) * E.out(fillP);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-w, 10); ctx.lineTo(-w, -top);
    for (let xx = -w; xx <= w; xx += 20) ctx.lineTo(xx, -top + Math.sin(xx * 0.05 + t * 6) * 12 * (1 - fillP));
    ctx.lineTo(w, 10); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  body(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-w / 2 - 16, -h + 8); ctx.lineTo(0, -h - w * 0.42 - 8); ctx.lineTo(w / 2 + 16, -h + 8); ctx.stroke();
  ctx.fillStyle = COL.white; ctx.fillRect(-w * 0.13, -h * 0.46, w * 0.26, h * 0.46); ctx.strokeRect(-w * 0.13, -h * 0.46, w * 0.26, h * 0.46);
  rrect(ctx, -w * 0.36, -h * 0.84, w * 0.2, w * 0.2, 6); ctx.fill(); ctx.stroke();
  rrect(ctx, w * 0.16, -h * 0.84, w * 0.2, w * 0.2, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function worldBack(ctx, t, camX, colored) {
  if (colored) {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF3DC'); g.addColorStop(1, '#FDE0B8');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    const gs = ctx.createRadialGradient(1500, 250, 20, 1500, 250, 560); gs.addColorStop(0, 'rgba(255,214,150,0.9)'); gs.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = gs; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.fillStyle = '#FFE1A8'; ctx.beginPath(); ctx.arc(1500, 250, 120, 0, TAU); ctx.fill();
    cut(ctx, () => hillPath(ctx, 620, 150, 520, 0.4, camX * 0.12), '#FAD9B2', 0.14);
    cut(ctx, () => hillPath(ctx, 740, 140, 380, 2.1, camX * 0.3), '#F6BD86', 0.18);
    cut(ctx, () => hillPath(ctx, 840, 90, 300, 4.0, camX * 0.55), '#F0A260', 0.2);
    ctx.fillStyle = '#FBE8CB'; ctx.fillRect(-300, GY - 4, W + 600, 500);
  } else {
    paper(ctx, COL.paper, 0.1);
    ctx.save(); ctx.strokeStyle = rgba(COL.ink, 0.3); ctx.lineWidth = 3; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.arc(1500, 250, 120, 0, TAU); ctx.stroke();
    hillPath(ctx, 620, 150, 520, 0.4, camX * 0.12); ctx.stroke();
    hillPath(ctx, 740, 140, 380, 2.1, camX * 0.3); ctx.stroke();
    hillPath(ctx, 840, 90, 300, 4.0, camX * 0.55); ctx.stroke();
    ctx.restore();
    drawGlyph(ctx, '日', 1500, 250, 110, { weight: 800, alpha: 0.55 });
  }
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
}
let YROWS = null;
function yesterday(ctx) {
  if (YROWS) return YROWS;
  YROWS = []; let k = 0;
  for (let r = 0; r < 9; r++) { let x = -1500 + rnd(r, 411) * 200; while (x < 380) { const str = MEMO[(k * 5 + 2) % MEMO.length], w = measure(ctx, str, 32, 400, undefined, 2); YROWS.push({ str, x, y: 110 + r * 62, a: 0.2 + rnd(k, 412) * 0.2 }); x += w + 80 + rnd(k, 413) * 120; k++; } }
  return YROWS;
}
export function sWalk(ctx, t) {
  const x = xw(t), herX = 600, camX = x - herX;
  const bx = x + 170 + E.io(sat(t, 69.75, 70.3)) * 1900;
  const whip = E.in(sat(t, 70.36, 70.61)) * 2700;
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.02 + 0.04 * sat(t, T0, 70.6) + 0.02 * kick(t), cx: W / 2, cy: GY, x: -whip, seed: 12 }, () => {
    worldBack(ctx, t, camX, false);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(-400, -400); ctx.lineTo(bx - camX, -400);
    for (let y = -400; y <= H + 400; y += 30) ctx.lineTo(bx - camX + Math.sin(y * 0.021 + t * 2.4) * 34 + Math.sin(y * 0.063 - t * 3.1) * 12, y);
    ctx.lineTo(-400, H + 400); ctx.closePath(); ctx.clip();
    worldBack(ctx, t, camX, true);
    ctx.restore();
    for (const L of yesterday(ctx)) { const sx = L.x - camX * 0.8; if (sx < -900 || sx > W) continue; text(ctx, L.str, sx, L.y, { size: 32, weight: 400, align: 'left', alpha: L.a, ls: 2 }); }
    // street
    const st = XS - camX;
    const f1 = sat(t, 68.45, 68.85), f2 = VAR.solo ? 0 : sat(t, 68.89, 69.29), f3 = VAR.solo ? 0 : sat(t, 69.33, 69.73);
    house(ctx, st + 1290, 300, 290, '#9DBEF0', f3, t);
    house(ctx, st + 560, 300, 300, '#F4B67A', f1, t);
    house(ctx, st + 920, 350, 370, '#8FD3B4', f2, t);
    for (const o of OBJ) { const sx = o.x - camX * (o.k === 'cloud' ? 0.6 : 1) - (o.k === 'cloud' ? 300 : 0); if (sx > -300 && sx < W + 300) drawObj(ctx, o, sx, (bx - o.x + 60) / 220, t); }
    // the road of pages, laid as she comes
    for (let i = 0; i < 14; i++) {
      const wxp = i * 190 - 60, sx = wxp - camX; if (sx < -260 || sx > W + 260) continue;
      const p = clamp((x + 640 - wxp) / 210); if (p <= 0) continue;
      const e = E.out(p), dy = -(1 - e) * 320, rot = (1 - e) * 0.7 * (i % 2 ? 1 : -1);
      ctx.save(); ctx.translate(sx + 75, GY + 30 + dy); ctx.rotate(rot); ctx.globalAlpha = clamp(p * 3);
      ctx.fillStyle = 'rgba(60,40,20,0.15)'; ctx.beginPath(); ctx.moveTo(-88, -20); ctx.lineTo(96, -20); ctx.lineTo(76, 36); ctx.lineTo(-108, 36); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-85, -26); ctx.lineTo(95, -26); ctx.lineTo(75, 26); ctx.lineTo(-105, 26); ctx.closePath();
      ctx.fillStyle = COL.white; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.stroke();
      ctx.fillStyle = rgba(COL.ink, 0.3); for (let k = 0; k < 3; k++) ctx.fillRect(-70 - k * 6, -14 + k * 13, 110, 4);
      ctx.restore();
    }
    // signpost with an empty nameplate
    const sgx = st + 250;
    ctx.fillStyle = COL.ink; ctx.fillRect(sgx - 5, 560, 10, GY - 560);
    ctx.save(); ctx.translate(sgx, 590); ctx.rotate(Math.sin(t * 1.6) * 0.012);
    cut(ctx, () => rrect(ctx, -40, -52, 290, 100, 14), COL.white, 0.22, 16, 6);
    rrect(ctx, -40, -52, 290, 100, 14); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
    caret(ctx, -6, -2, 56, t, COL.orange, 6);
    ctx.restore();
    // Ko and 大肥鱼 are already there
    const bk = bop(t, 1.3), bf = bop(t + 0.1, 1.3);
    if (!VAR.solo) {
      char(ctx, 'k01', st + 700, GY + 22, 400, { sx: bk.sx, sy: bk.sy });
      char(ctx, 'f01', st + 980, GY + 26, 400, { sx: bf.sx, sy: bf.sy, flip: true });
    }
    // the ribbon of writing she trails: 我从你们的昨天出发
    const ra = sat(t, 61.9, 62.6) * (1 - sat(t, 65.9, 66.9));
    if (ra > 0) {
      const str = MEMO.join('');
      for (let i = 0; i < 48; i++) {
        const s = 70 + i * 34, px = herX - 70 - s, py = 560 + Math.sin(s * 0.011 - t * 3.4) * (26 + s * 0.045) - s * 0.06;
        drawGlyph(ctx, str[(i + Math.floor(t * 9)) % str.length], px, py, 34, { weight: 600, alpha: ra * (1 - i / 48) * 0.9, rot: Math.cos(s * 0.011 - t * 3.4) * 0.3, color: i % 6 === 0 ? COL.orangeD : COL.ink });
      }
    }
    const stopped = t >= TS2;
    if (!stopped) { const wb = walkBob(t); char(ctx, walkPose(t), herX, GY + 24, 470, { lift: wb.lift, rot: wb.rot, windX: -6, flutter: 2 }); }
    else { const tp = t >= 68.45 ? 68.45 : TS2, s = sq(t, tp, 1.3), b = breathe(t), bb = bop(t, t >= 69.75 ? 1.4 : 0); char(ctx, t >= 68.45 ? 'o07' : 'o04', herX, GY + 24, 470, { sx: s.sx * b.sx * bb.sx, sy: s.sy * b.sy * bb.sy }); }
    [[68.45, st + 560, '#F4B67A'], [68.89, st + 920, '#8FD3B4'], [69.33, st + 1290, '#9DBEF0']].slice(0, VAR.solo ? 1 : 3).forEach(([tt, hx, c]) => {
      const p = sat(t, tt, tt + 0.5); if (p <= 0 || p >= 1) return;
      for (let k = 0; k < 14; k++) { const an = (k / 14) * TAU; ctx.fillStyle = rgba(c, 1 - p); ctx.beginPath(); ctx.arc(hx + Math.cos(an) * (130 + 170 * E.out(p)), 690 + Math.sin(an) * (130 + 170 * E.out(p)), 13 * (1 - p) + 2, 0, TAU); ctx.fill(); }
    });
  });
  bokeh(ctx, t, { n: 9, seed: 120, alpha: 0.14, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
}

// ------------------------------------------------------------------ 1:10–1:13  three of us
const C2 = [70.88, 71.42, 71.87, 72.1, 72.42];
export function triBurst(ctx, t, cx, cy, speed = 0.5) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * speed);
  const n = 18;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? COL.white : PASTEL[(i / 2) % 3 | 0];
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 2600, (i / n) * TAU, ((i + 1) / n) * TAU); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
export const jump = (t, ts, A) => { const u = (t - ts) / 2.3; if (u < 0) return 0; return A * E.out(sat(u / 0.24, 0, 1)) * (1 - 0.12 * sat((u - 0.24) / 0.76, 0, 1)); };
export const crouch = (t, ts) => { const p = sat(t, ts - 0.2, ts); return t < ts ? { sx: 1 + 0.07 * p, sy: 1 - 0.12 * p } : { sx: 1 - 0.05 * hit(t, ts, 6), sy: 1 + 0.08 * hit(t, ts, 6) }; };
export function sTrio(ctx, t) {
  const punch = hit(t, 70.84, 5), whip = (1 - E.out(sat(t, 70.61, 70.82))) * 2700;
  cam(ctx, t, { z: 1 + 0.09 * punch + 0.04 * sat(t, 70.84, 73.19) + 0.02 * kick(t), x: whip, seed: 13, hand: 4 }, () => {
    ctx.fillStyle = COL.white; ctx.fillRect(-3200, -300, W + 3500, H + 600);
    triBurst(ctx, t, 960, 640);
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(960, 640, 340 + 24 * pulse(t, 5), 0, TAU); ctx.fill();
    const TITLE = '世界还在写';
    for (let i = 0; i < 5; i++) {
      const ti = (VAR.c2 ?? C2)[i];
      if (t < ti) continue;
      const s = 0.4 + 0.6 * E.back(sat(t, ti, ti + 0.26)) + 0.07 * pulse(t, 6);
      cutGlyph(ctx, TITLE[i], 400 + i * 280, 132 + Math.sin(t * 2 + i) * 7, 176, TRI[i % 3], { s, rot: Math.sin(t * 1.5 + i * 2) * 0.04 });
    }
    confetti(ctx, t, 70.84, 960, 800, 150, [...TRI, COL.white, COL.yellow], 500, 1.1);
    const ck = crouch(t, 70.84), co = crouch(t, 70.9), cf = crouch(t, 70.96);
    char(ctx, 'k03', 470, 1085, 520, { lift: jump(t, 70.84, 250), rot: -0.08, flutter: 4, blink: 0, sx: ck.sx, sy: ck.sy, shadowA: 0.8 });
    char(ctx, 'f03', 1450, 1085, 520, { lift: jump(t, 70.96, 250), rot: 0.08, flutter: 4, blink: 0, sx: cf.sx, sy: cf.sy, shadowA: 0.8 });
    char(ctx, 'o12', 960, 1090, 640, { lift: jump(t, 70.9, 255), flutter: 5, sway: 1.5, blink: 0, sx: co.sx, sy: co.sy, shadowA: 0.8 });
  });
  bokeh(ctx, t, { n: 10, seed: 130, alpha: 0.16, colors: [...PASTEL, COL.white] });
  finish(ctx, { light: 0.6 });
  const fl = hit(t, 70.84, 7);
  if (fl > 0.01) { ctx.fillStyle = rgba('#FFFFFF', fl * 0.85); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 1:13–1:16  wind: words become butterflies
export function sWindClose(ctx, t) {
  cam(ctx, t, { z: 1.08 - 0.05 * E.out(sat(t, 73.19, 73.8)) + 0.04 * sat(t, 73.19, 74.93), cx: 900, cy: 520, seed: 14, hand: 4 }, () => {
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#FFF0D6'); g.addColorStop(1, '#FCD7AA');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    rays(ctx, 1600, 160, t * 0.6, 0.3, '#FFE6B8', 14);
    swarm(ctx, t, 72.2, 40, { x0: -700, w: 2200, y0: 1150, h: 1000, size: 44, spread: 2.6, alpha: 0.9, vx: 420, vy: 200 });
    for (let i = 0; i < 18; i++) {
      const ph = ((t * (0.9 + rnd(i, 611) * 0.6) + rnd(i, 612)) % 1), y = 60 + rnd(i, 613) * 940, x = -600 + ph * (W + 1100), len = 260 + rnd(i, 614) * 320;
      ctx.strokeStyle = rgba(COL.white, 0.8 * Math.sin(ph * Math.PI)); ctx.lineWidth = 5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 18, x + len, y + 6); ctx.stroke();
    }
    const b = breathe(t, 0.8);
    char(ctx, 'o14', 1010, 1167, 1320, { windX: -26 - 10 * Math.sin(t * 3), windY: -4, flutter: 9, sway: 1.5, sx: b.sx, sy: b.sy, shadow: false, blink: 0 });
    [[1590, 240, 120, 0], [1760, 540, 90, 1], [1560, 760, 70, 2]].forEach(([hx, hy, hs, i]) => {
      const a = sat(t, 73.5 + i * 0.25, 73.9 + i * 0.25);
      butterfly(ctx, BCH[i + 3], hx + Math.sin(t * 1.7 + i * 2) * 40 - (1 - E.out(a)) * 500, hy + Math.cos(t * 2.3 + i) * 30 + (1 - E.out(a)) * 300, hs, PAL()[i], t * 14 + i, 0.3 + Math.sin(t * 2 + i) * 0.2, a, 1);
    });
  });
  bokeh(ctx, t, { n: 12, seed: 140, alpha: 0.2, vx: 60, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.7 });
}
export function sWindWide(ctx, t) {
  const tilt = 170 * E.io(sat(t, 74.93, 76.9));
  cam(ctx, t, { z: 1.03, y: tilt, seed: 15 }, () => {
    const g = ctx.createLinearGradient(0, -300, 0, H); g.addColorStop(0, '#FCE3B4'); g.addColorStop(0.5, '#FFF3DC'); g.addColorStop(1, '#FDE0B8');
    ctx.fillStyle = g; ctx.fillRect(-300, -500, W + 600, H + 800);
    ctx.fillStyle = '#FFE1A8'; ctx.beginPath(); ctx.arc(1500, 250, 120, 0, TAU); ctx.fill();
    cut(ctx, () => hillPath(ctx, 740, 140, 380, 2.1, 300), '#F6BD86', 0.18);
    cut(ctx, () => hillPath(ctx, 840, 90, 300, 4.0, 500), '#F0A260', 0.2);
    ctx.fillStyle = '#FBE8CB'; ctx.fillRect(-300, GY - 4, W + 600, 500);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
    for (let i = 0; i < 9; i++) miniPage(ctx, 250 + i * 180, GY + 46 + (i % 2) * 14, 150, 56, (i % 2 ? 0.05 : -0.04));
    // most of the swarm rises behind them, so no face is ever covered
    swarm(ctx, t, 74.0, 120, { x0: 60, w: 1800, y0: GY + 96, h: 100, size: 50, spread: 2.9, vx: 260, vy: 320 });
    // each of them does something about it: Ko points, 橙子 offers a finger, 大肥鱼 tries to catch one
    const ph = beatPhase(t);
    const hopK = Math.abs(Math.sin(ph * Math.PI)) * 22, hopF = Math.abs(Math.sin((ph + 0.5) * Math.PI)) * 30;
    const bo = breathe(t), sk = sq(t, 74.93, 1.2);
    char(ctx, 'k04', 440, GY + 20, 400, { lift: hopK, sx: sk.sx, sy: sk.sy, windX: 10, flutter: 3 });
    char(ctx, 'f04', 1010, GY + 22, 400, { lift: hopF, sx: sk.sx, sy: sk.sy, windX: 10, flutter: 3 });
    char(ctx, 'o08', 720, GY + 26, 450, { sx: bo.sx * sk.sx, sy: bo.sy * sk.sy, windX: 14, flutter: 4 });
    // one lands on her fingertip, one circles Ko's horn, one stays just out of 大肥鱼's reach
    const la = sat(t, 75.2, 75.8);
    butterfly(ctx, '字', lerp(1300, 874, E.out(la)), lerp(200, 520, E.out(la)) + Math.sin(t * 3) * 4 * (1 - la), 58, TRI[0], t * (14 - 9 * la), 0.2, sat(t, 75.0, 75.3), 1);
    butterfly(ctx, '风', 400 + Math.cos(t * 2.6) * 70, 440 + Math.sin(t * 2.6) * 34, 50, TRI[1], t * 15, 0.3 + Math.sin(t * 2.6) * 0.4, sat(t, 75.0, 75.4), 1);
    butterfly(ctx, '海', 1030 + Math.sin(t * 3.1) * 46, 400 - hopF * 0.5 + Math.cos(t * 4) * 16, 54, TRI[2], t * 16, -0.2, sat(t, 75.0, 75.4), 1);
    swarm(ctx, t, 74.5, 30, { x0: 1220, w: 760, y0: GY + 96, h: 100, size: 56, spread: 2.2, vx: 300, vy: 340 });
  });
  finish(ctx, { light: 0.8 });
}

// ------------------------------------------------------------------ 1:16–1:25  the road, and three next pages
// Each next page is one of them: orange is 橙子's, green is Ko's (Codex: things get built), blue is Seek's
// (DeepSeek, the big fat blue fish everyone teases: a real sea at last, and a very round whale).
const THEME = {
  dusk: { sky: ['#1E2148', '#4A3E7C', '#F0A56A'], ground: '#2B2440', page: '#F4E7CC', line: '#161225', dim: 0.78, lead: '' },
  orange: { sky: ['#FFEFD2', '#FFD9A0', '#FDB56C'], ground: '#F6D49E', page: '#FFFDF6', line: COL.ink, dim: 1, lead: 'o' },
  green: { sky: ['#EAF9F1', '#CBF0DD', '#A5E2C5'], ground: '#6EC49B', page: '#FFFDF6', line: COL.ink, dim: 1, lead: 'k' },
  blue: { sky: ['#E2F1FD', '#BBDAF7', '#8DBBEE'], ground: '#5C93DC', page: '#FFFDF6', line: COL.ink, dim: 1, lead: 'f' },
};
export const HZ = 590, VX = 1290;
export const RP = pr => ({ x: VX - 590 * Math.pow(pr, 1.25), y: HZ + 410 * pr, hw: 300 * pr });      // a point on the road at depth pr (1 = near)
const STARS = Array.from({ length: 170 }, (_, i) => [rnd(i, 701) * W, rnd(i, 702) * 560, 1.5 + rnd(i, 703) * 3.5, rnd(i, 704) * TAU]);
const DIP = [[320, 150], [430, 190], [530, 170], [620, 230], [610, 320], [730, 350], [770, 260]];
const DIPT = [76.48, 76.72, 77.0, 77.23, 77.44, 77.57, 77.69];
export const GREENS = ['#17835A', '#2FA676', '#57C297', '#A6E3C8'];
// a terminal window: title bar, three dots, lines of code that type themselves in
export function termWin(ctx, x, base, w, h, p, lt, seed, dark) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, base); ctx.scale(1, p); ctx.translate(-w / 2, -h);
  cut(ctx, () => rrect(ctx, 0, 0, w, h + 30, 16), dark ? '#12553C' : COL.white, 0.22, 22, 6);
  rrect(ctx, 0, 0, w, h + 30, 16); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.save(); rrect(ctx, 0, 0, w, h + 30, 16); ctx.clip();
  ctx.fillStyle = dark ? '#0E4430' : '#DDF3E8'; ctx.fillRect(0, 0, w, 34);
  ctx.restore();
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 34); ctx.lineTo(w, 34); ctx.stroke();
  ['#F08A6A', '#F8C65A', '#57C297'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(20 + i * 20, 17, 6, 0, TAU); ctx.fill(); });
  const rows = Math.floor((h - 50) / 26), typed = clamp((lt - 0.25 - rnd(seed, 771) * 0.25) * 9, 0, rows);
  for (let r = 0; r < rows; r++) {
    if (r > typed) break;
    const ind = [0, 1, 2, 1, 2, 2, 1, 0][(r + seed) % 8] * 18, len = (w - 44 - ind) * (0.35 + 0.6 * rnd(r, seed + 772));
    const f = r === Math.floor(typed) ? typed - r : 1, y = 52 + r * 26;
    ctx.fillStyle = dark ? ['#A6E3C8', '#F8C65A', '#FFFDF6', '#57C297'][(r * 3 + seed) % 4] : [GREENS[0], GREENS[1], '#E0A62E', GREENS[2]][(r * 3 + seed) % 4];
    rrect(ctx, 22 + ind, y, len * f, 9, 4.5); ctx.fill();
    if (r === Math.floor(typed) && typed < rows) { ctx.fillStyle = dark ? COL.white : COL.ink; ctx.fillRect(22 + ind + len * f + 4, y - 4, 9, 17); }
  }
  ctx.restore();
}
export function check(ctx, x, y, r, p) {
  if (p <= 0) return;
  const k = E.back(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  cut(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, '#2FA676', 0.25, 12, 4);
  ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = COL.white; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.42, 0.02 * r); ctx.lineTo(-r * 0.1, r * 0.34); ctx.lineTo(r * 0.46, -r * 0.3); ctx.stroke();
  ctx.restore();
}
export function sRoad(ctx, t, theme, tFlip = 0) {
  const T = THEME[theme], lt = t - tFlip;
  cam(ctx, t, { z: 1.03 + 0.02 * sat(lt, 0, 3.5) + 0.015 * kick(t), cx: 1000, cy: HZ, seed: 16 }, () => {
    const g = ctx.createLinearGradient(0, 0, 0, HZ + 20); g.addColorStop(0, T.sky[0]); g.addColorStop(0.6, T.sky[1]); g.addColorStop(1, T.sky[2]);
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, HZ + 320);
    if (theme === 'dusk') {
      const sf = sat(t, 76.4, 77.5);
      for (const s of STARS) {
        const tw = 0.55 + 0.45 * Math.sin(t * 3 + s[3]);
        if (s[2] > 4.1) star4(ctx, s[0], s[1], s[2] * 2.6 * (0.7 + 0.3 * tw), '#FFF3DC', tw * sf);
        else { ctx.fillStyle = rgba('#FFF3DC', tw * sf); ctx.beginPath(); ctx.arc(s[0], s[1], s[2] * (0.7 + 0.3 * tw), 0, TAU); ctx.fill(); }
      }
      // 把读过的星: the one constellation everybody has read, a star a syllable
      ctx.strokeStyle = rgba('#FFF3DC', 0.6); ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      for (let i = 0; i < DIP.length - 1; i++) {
        const u = sat(t, DIPT[i + 1] - 0.16, DIPT[i + 1]); if (u <= 0) break;
        ctx.beginPath(); ctx.moveTo(DIP[i][0], DIP[i][1]); ctx.lineTo(lerp(DIP[i][0], DIP[i + 1][0], u), lerp(DIP[i][1], DIP[i + 1][1], u)); ctx.stroke();
      }
      DIP.forEach((p, i) => {
        const a = sat(t, DIPT[i], DIPT[i] + 0.2); if (a <= 0) return;
        const r = (20 + 6 * Math.sin(t * 4 + i)) * E.back(a), gg = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3.2);
        gg.addColorStop(0, rgba('#FFE9B8', 0.45 * a)); gg.addColorStop(1, rgba('#FFE9B8', 0)); ctx.fillStyle = gg; ctx.fillRect(p[0] - r * 4, p[1] - r * 4, r * 8, r * 8);
        star4(ctx, p[0], p[1], r, '#FFE9B8');
        if (a < 1) { ctx.strokeStyle = rgba('#FFE9B8', 1 - a); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p[0], p[1], 24 + 50 * a, 0, TAU); ctx.stroke(); ctx.strokeStyle = rgba('#FFF3DC', 0.6); ctx.lineWidth = 2.5; }
      });
      const gl = ctx.createRadialGradient(VX, HZ, 20, VX, HZ, 820); gl.addColorStop(0, 'rgba(255,190,120,0.6)'); gl.addColorStop(1, 'rgba(255,190,120,0)');
      ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
      cut(ctx, () => hillPath(ctx, HZ + 10, 66, 520, 1.1, 300), '#2E2650', 0.2, 20, -6);          // country beyond the end of the road
      cut(ctx, () => hillPath(ctx, HZ + 16, 40, 290, 3.0, 900), '#272042', 0.2, 20, -6);
    } else if (theme === 'orange') {
      rays(ctx, VX, HZ, t * 0.5, 0.3, '#FFE3B0', 16);
      ctx.fillStyle = '#FFF1CC'; ctx.beginPath(); ctx.arc(VX, HZ + 10, 230 + 10 * pulse(t, 5), 0, TAU); ctx.fill();
      cut(ctx, () => hillPath(ctx, HZ + 10, 90, 330, 1.0, 100), '#F7BE86', 0.15);
    } else if (theme === 'green') {
      // Ko's page: a city that is being written. Terminal windows rise and fill with code, tests go green.
      rays(ctx, VX, HZ - 250, t * 0.4, 0.22, '#FFFFFF', 14);
      const WINS = [[150, 330, 200, 1], [372, 250, 190, 0], [590, 430, 220, 1], [826, 300, 200, 0], [1052, 380, 190, 1], [1540, 300, 210, 0], [1770, 420, 220, 1]];
      // low blocks between the windows, like commits stacking up
      for (let i = 0; i < 16; i++) {
        const x = 40 + i * 124, n = 1 + ((i * 7) % 3), w = 74;
        for (let k = 0; k < n; k++) {
          const p = E.back(sat(lt, 0.1 + i * 0.02 + k * 0.06, 0.4 + i * 0.02 + k * 0.06)); if (p <= 0) continue;
          ctx.save(); ctx.translate(x, HZ + 6 - k * (w + 6) - w / 2); ctx.scale(p, p);
          rrect(ctx, -w / 2, -w / 2, w, w, 14); ctx.fillStyle = mix(GREENS[(i + k) % 4], '#CBF0DD', 0.45); ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = rgba(COL.ink, 0.55); ctx.stroke();
          ctx.restore();
        }
      }
      WINS.forEach(([x, h, w, dark], i) => termWin(ctx, x, HZ + 6, w, h, E.back(sat(lt, 0.12 + i * 0.05, 0.5 + i * 0.05)), lt - i * 0.05, i * 13 + 5, dark));
      WINS.forEach(([x, h, w], i) => check(ctx, x + w / 2 - 14, HZ - h - 22, 26, (lt - 0.75 - i * 0.09) / 0.25));
      // the prompt, hanging in the sky like a sun
      const sp = E.back(sat(lt, 0.2, 0.6));
      ctx.save(); ctx.translate(VX, 215 + Math.sin(t * 1.6) * 6); ctx.scale(sp, sp);
      cut(ctx, () => rrect(ctx, -92, -92, 184, 184, 40), '#17835A', 0.3, 30, 10);
      rrect(ctx, -92, -92, 184, 184, 40); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
      ctx.strokeStyle = COL.white; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(-46, -30); ctx.lineTo(-8, 2); ctx.lineTo(-46, 34); ctx.stroke();
      if ((t % 0.86) < 0.5) { ctx.beginPath(); ctx.moveTo(12, 38); ctx.lineTo(52, 38); ctx.stroke(); }
      ctx.restore();
    } else if (theme === 'blue') {
      const gs = ctx.createRadialGradient(520, 190, 30, 520, 190, 420); gs.addColorStop(0, 'rgba(255,255,255,0.75)'); gs.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gs; ctx.fillRect(-300, -300, W + 600, HZ + 300);
      ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(520, 190, 84, 0, TAU); ctx.fill();
      for (let i = 0; i < 4; i++) { const cx = 180 + i * 540 + Math.sin(t * 0.3 + i) * 20, cy = 130 + (i % 2) * 120; cut(ctx, () => { ctx.beginPath(); ctx.arc(cx - 60, cy, 40, 0, TAU); ctx.arc(cx, cy - 24, 56, 0, TAU); ctx.arc(cx + 70, cy, 44, 0, TAU); ctx.rect(cx - 60, cy, 130, 40); }, COL.white, 0.12, 20, 8); }
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const bx = 980 + i * 130 + Math.sin(t * 0.8 + i) * 30, by = 300 + i * 46 + Math.cos(t * 1.1 + i) * 12, fl = Math.sin(t * 7 + i) * 10; ctx.beginPath(); ctx.moveTo(bx - 26, by - fl); ctx.quadraticCurveTo(bx - 10, by - 10, bx, by); ctx.quadraticCurveTo(bx + 10, by - 10, bx + 26, by - fl); ctx.stroke(); }
    }
    ctx.fillStyle = T.ground; ctx.fillRect(-300, HZ, W + 600, H);
    const far = E.io(sat(t, 76.64, 85.0)), pc = lerp(0.92, 0.52, far), TP = RP(pc), tsc = pc / 0.92;
    const LF = t < 78.2 ? 9 : lerp(1.7, 0.03, E.out(sat(t, 78.2, 79.3)));          // lamps nearer than this are lit
    const lamp = (a, sgn) => {
      const Q = RP(a), x = Q.x + sgn * (Q.hw * 1.5 + 70 * a), h = 300 * a, lit = a > LF;
      if (lit) {
        ctx.fillStyle = 'rgba(255,201,120,0.15)'; ctx.beginPath(); ctx.ellipse(x, Q.y, 200 * a, 46 * a, 0, 0, TAU); ctx.fill();
        const gg = ctx.createRadialGradient(x, Q.y - h, 2, x, Q.y - h, 180 * a); gg.addColorStop(0, 'rgba(255,214,140,0.6)'); gg.addColorStop(1, 'rgba(255,214,140,0)'); ctx.fillStyle = gg; ctx.fillRect(x - 190 * a, Q.y - h - 190 * a, 380 * a, 380 * a);
      }
      ctx.strokeStyle = '#161225'; ctx.lineWidth = Math.max(1.5, 7 * a); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, Q.y); ctx.lineTo(x, Q.y - h + 24 * a); ctx.stroke();
      rrect(ctx, x - 20 * a, Q.y - h - 30 * a, 40 * a, 54 * a, 10 * a); ctx.fillStyle = lit ? '#FFD98A' : '#3A3358'; ctx.fill(); ctx.lineWidth = Math.max(1.2, 3.5 * a); ctx.stroke();
    };
    const LAMPS = theme === 'dusk' && !VAR.solo ? Array.from({ length: 9 }, (_, j) => 1.5 * Math.pow(0.8, 2 * j + 0.5 - ((t * 0.5) % 2))).filter(a => a > 0.05 && a < 1.7) : [];
    if (theme === 'dusk') {
      ctx.strokeStyle = 'rgba(255,220,180,0.055)'; ctx.lineWidth = 2;
      for (let i = -12; i <= 12; i++) { if (Math.abs(i) < 2) continue; ctx.beginPath(); ctx.moveTo(VX + i * 14, HZ); ctx.lineTo(VX + i * 560 - 500, H + 200); ctx.stroke(); }
    }
    if (theme === 'green') {      // a floor ruled like graph paper, running to the same vanishing point
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2;
      for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(VX + i * 16, HZ); ctx.lineTo(VX + i * 520, H + 200); ctx.stroke(); }
      for (let k = 0; k < 9; k++) { const y = HZ + 500 * Math.pow(0.66, 8 - k - ((t * 0.5) % 1)); ctx.beginPath(); ctx.moveTo(-300, y); ctx.lineTo(W + 300, y); ctx.stroke(); }
    }
    if (theme === 'blue') {
      // Seek's page: the sea she had only read about, and the fish himself
      const WV = ['#7FB1EC', '#5F95DE', '#4A7FD0', '#3B6FC4', '#2F5DB4', '#2D4FA3'];
      const whale = () => {
        const u = sat(lt, 0.3, 1.5); if (u <= 0 || u >= 1) return;
        const wx = lerp(110, 760, u), wy = HZ + 150 - Math.sin(u * Math.PI) * 470, ang = lerp(-0.6, 1.05, u);
        char(ctx, 'w01', wx, wy, 215, { rot: ang, shadow: false, blink: 0 });
      };
      const whale2 = () => {            // when the page is held longer he comes back the other way, further out
        const u = sat(lt, 1.7, 2.75); if (!VAR.whale2 || u <= 0 || u >= 1) return;
        char(ctx, 'w01', lerp(1810, 1330, u), HZ + 100 - Math.sin(u * Math.PI) * 330, 150, { rot: -lerp(-0.6, 1.05, u), flip: true, shadow: false, blink: 0 });
      };
      for (let k = 0; k < 9; k++) {
        if (k === 1) whale2();
        if (k === 2) whale();           // he leaps from behind the second wave
        const y = HZ + 12 + Math.pow(k / 8, 1.6) * 480, amp = 7 + k * 6, wl = 56 + k * 26;
        cut(ctx, () => { ctx.beginPath(); ctx.moveTo(-300, H + 300); for (let x = -300; x <= W + 300; x += 16) ctx.lineTo(x, y + Math.sin(x / wl + t * (1.6 + k * 0.2) + k * 2) * amp); ctx.lineTo(W + 300, H + 300); ctx.closePath(); }, WV[Math.min(5, k % 6)], 0.14, 14, -4);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2 + k * 0.5; ctx.lineCap = 'round';
        for (let i = 0; i < 9; i++) { const x = ((i * 257 + k * 131 + t * (20 + k * 8)) % (W + 300)) - 150, yy = y + Math.sin(x / wl + t * (1.6 + k * 0.2) + k * 2) * amp + 16 + k * 3; const a = 0.5 + 0.5 * Math.sin(t * 3 + i * 2 + k); ctx.globalAlpha = a; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 30 + k * 8, yy); ctx.stroke(); }
        ctx.globalAlpha = 1;
      }
      // splashes where he leaves and re-enters the water
      for (const [ts, sx, sk] of [[0.34, 150, 1], [1.38, 730, 1], ...(VAR.whale2 ? [[1.74, 1790, 0.6], [2.62, 1350, 0.6]] : [])]) {
        const p = sat(lt, ts, ts + 0.55); if (p <= 0 || p >= 1) continue;
        for (let i = 0; i < 16; i++) {
          const an = -Math.PI * (0.12 + 0.76 * (i / 15)), sp = (150 + rnd(i, 781) * 190) * sk;
          const x = sx + Math.cos(an) * sp * p, y = HZ + 120 - 50 * (1 - sk) + Math.sin(an) * sp * p + 300 * p * p * sk;
          ctx.fillStyle = i % 3 ? COL.white : '#BBDAF7'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.globalAlpha = 1 - p * p;
          ctx.beginPath(); ctx.arc(x, y, 7 + rnd(i, 782) * 9, 0, TAU); ctx.fill(); ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    } else if (theme === 'orange') {
      for (let i = 0; i < 30; i++) {
        const side = i % 2 ? 1 : -1, pr = 0.1 + (i >> 1) / 15 * 1.05, P = RP(pr), r0 = 10 + 44 * pr;
        let x = P.x + side * (P.hw + r0 + 30 + rnd(i, 711) * 520 * pr);
        const yh = P.y - r0 * 1.4, prh = (yh - HZ) / 410;                 // the road again, at the height of the flower head
        if (prh > 0.02) { const Q = RP(prh), need = Q.hw + r0 + 30; if (Math.abs(x - Q.x) < need) x = Q.x + side * need; }
        if (Math.abs(x - TP.x) < 380 * tsc + r0 && yh > TP.y - 500 * tsc && P.y < TP.y + 150) continue;
        const p = E.back(sat(lt, 0.15 + (1 - pr) * 0.4 + rnd(i, 712) * 0.2, 0.5 + (1 - pr) * 0.4 + rnd(i, 712) * 0.2)); if (p <= 0) continue;
        const r = r0 * p, y = P.y - r * 1.4;
        ctx.strokeStyle = COL.ink; ctx.lineWidth = 2 + 3 * pr; ctx.beginPath(); ctx.moveTo(x, P.y + 6); ctx.lineTo(x + Math.sin(t * 2 + i) * 4, y); ctx.stroke();
        flower(ctx, x + Math.sin(t * 2 + i) * 4, y, r, t * 0.5 + i, i % 3 ? COL.orange : COL.yellow);
      }
    }
    // the road of pages, curving to the horizon
    const scroll = (t * 0.5) % 1;
    for (let k = 15; k >= 0; k--) {
      const a = 1.5 * Math.pow(0.8, k - scroll), b = a * 0.84;
      if (a < 0.02) continue;
      const A = RP(a), B = RP(b), bobA = theme === 'blue' ? Math.sin(t * 2.2 + k) * 5 * Math.min(1, a) : 0;
      ctx.beginPath(); ctx.moveTo(A.x - A.hw, A.y + bobA); ctx.lineTo(A.x + A.hw, A.y + bobA); ctx.lineTo(B.x + B.hw, B.y + bobA); ctx.lineTo(B.x - B.hw, B.y + bobA); ctx.closePath();
      ctx.fillStyle = T.page; ctx.fill(); ctx.lineWidth = Math.max(1.2, 3.5 * Math.min(1, a)); ctx.strokeStyle = T.line; ctx.stroke();
      ctx.fillStyle = rgba(COL.ink, 0.2);
      for (let j = 1; j <= 3; j++) { const M = RP(lerp(a, b, j / 4)); ctx.fillRect(M.x - M.hw * 0.72, M.y + bobA, M.hw * 1.44, Math.max(1.5, (A.y - B.y) * 0.05)); }
    }
    for (const a of LAMPS) if (a < pc) { lamp(a, -1); lamp(a, 1); }
    // three backs, walking on. On each page its owner steps out in front.
    const wb = { o: walkBob(t), k: walkBob(t + 0.21), f: walkBob(t + 0.4) };
    const step = E.out(sat(lt, 0.1, 0.6));
    // each page has an owner, who cannot help hopping about it
    ctx.save();
    if (T.dim < 1) ctx.filter = `brightness(${T.dim}) saturate(0.9)`;
    const P = RP(pc), sc = pc / 0.92;
    for (const [c, id, dx, size, dy] of [['k', 'k02', -235, 400, 4], ['f', 'f02', 235, 400, 4], ['o', 'o09', 0, 460, 10]].slice(VAR.solo ? 2 : 0)) {
      const lead = T.lead === c, hop = lead ? Math.abs(Math.sin(sat(lt, 0.12, 1.3) * Math.PI * 2)) * 70 : 0, grow = lead ? 1 + 0.07 * step : 1;
      if (theme === 'dusk') { ctx.fillStyle = 'rgba(12,9,24,0.3)'; ctx.beginPath(); ctx.ellipse(P.x + dx * sc, P.y + dy + 74 * sc, 62 * sc, 112 * sc, 0, 0, TAU); ctx.fill(); }          // the light is ahead of them
      char(ctx, id, P.x + dx * sc, P.y + dy, size * sc * grow, { lift: (wb[c].lift + hop) * sc, rot: wb[c].rot + (lead ? Math.sin(lt * 9) * 0.05 * (1 - sat(lt, 1.0, 1.4)) : 0), shadowColor: '#000' });
    }
    ctx.restore();
    for (const a of LAMPS) if (a >= pc) { lamp(a, -1); lamp(a, 1); }
  });
  if (theme === 'dusk') { bokeh(ctx, t, { n: 10, seed: 160, colors: ['#FFE9B8', COL.orange], alpha: 0.12, blend: 'screen' }); finish(ctx, { dark: true }); }
  else { bokeh(ctx, t, { n: 8, seed: 161 + theme.length, alpha: 0.14, colors: [COL.white] }); finish(ctx, { light: 0.6 }); }
}

// “点赞 收藏 关注 → 发布完整版”: three pills pop one after another, then the arrow and the promise
export function cta(ctx, t, t0, cx, y, k = 1, alpha = 1) {
  if (t < t0 || alpha <= 0) return;
  const tags = ['点赞', '收藏', '关注'], pw = 122 * k, ph = 60 * k, gap = 18 * k, arrow = 74 * k;
  const tail = VAR.ctaTail, tw = measure(ctx, tail, 40 * k, 700, undefined, 6 * k);
  let x = cx - (3 * pw + 2 * gap + arrow + tw) / 2;
  ctx.save(); ctx.globalAlpha *= alpha;
  tags.forEach((s, i) => {
    const p = sat(t, t0 + i * 0.16, t0 + i * 0.16 + 0.28);
    if (p > 0) {
      const sc = E.back(p);
      ctx.save(); ctx.translate(x + pw / 2, y); ctx.scale(sc, sc); ctx.globalAlpha *= Math.min(1, p * 3);
      cut(ctx, () => rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2), COL.orange, 0.22, 14 * k, 5 * k);
      text(ctx, s, 2 * k, 1 * k, { size: 34 * k, weight: 700, color: COL.white, ls: 4 * k });
      ctx.restore();
    }
    x += pw + gap;
  });
  const pa = sat(t, t0 + 0.5, t0 + 0.8);
  if (pa > 0) {
    const x0 = x + 4 * k, x1 = x0 + (arrow - 30 * k) * E.out(pa);
    ctx.save(); ctx.globalAlpha *= pa; ctx.strokeStyle = COL.orangeD; ctx.lineWidth = 5 * k; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.moveTo(x1 - 12 * k, y - 11 * k); ctx.lineTo(x1, y); ctx.lineTo(x1 - 12 * k, y + 11 * k); ctx.stroke();
    ctx.restore();
  }
  text(ctx, tail, x + arrow - 8 * k, y + 1 * k, { size: 40 * k, weight: 700, align: 'left', color: COL.ink, alpha: sat(t, t0 + 0.65, t0 + 0.95), ls: 6 * k });
  ctx.restore();
}

// ------------------------------------------------------------------ 1:25–1:43  outro: the blank page is yours
const O1 = [86.3, 86.83, 87.3, 87.81, 88.3];
const O2 = [['下', 93.23], ['一', 93.8], ['句', 93.93], ['，', 94.1], ['你', 95.33], ['来', 95.56], ['。', 95.78]];
export function sOutro(ctx, t) {
  if (t < 93.0) {
    cam(ctx, t, { z: 1 + 1.25 * E.io(sat(t, 90.5, 92.98)), cx: 960, cy: 740, seed: 17, hand: 2 }, () => {
      paper(ctx);
      const TITLE = '世界还在写';
      let typed = 0; for (let k = 0; k < 5; k++) if (t >= O1[k]) typed = k + 1;
      const ta = 1 - sat(t, 90.5, 91.2);
      for (let k = 0; k < typed; k++) drawGlyph(ctx, TITLE[k], 640 + k * 160, 360, 118, { weight: 300, alpha: ta * sat(t, O1[k], O1[k] + 0.25) });
      if (ta > 0.5) caret(ctx, 590 + typed * 160 + (typed ? 16 : 0), 360, 120, t, COL.orange, 6);
      if (VAR.ctaMid) cta(ctx, t, 88.5, 960, 486, 1, ta);
      const ca = sat(t, 85.4, 86.5), rise = (1 - E.out(ca)) * 40;
      const bk = breathe(t, 1, 1), bf = breathe(t, 1, 2), bo = breathe(t);
      char(ctx, 'k00', 760, 900 + rise, 310, { alpha: ca, sx: bk.sx, sy: bk.sy });
      char(ctx, 'f00', 1160, 900 + rise, 310, { alpha: ca, sx: bf.sx, sy: bf.sy });
      char(ctx, 'o00', 960, 906 + rise, 350, { alpha: ca, sx: bo.sx, sy: bo.sy });
    });
    bokeh(ctx, t, { n: 8, seed: 170, alpha: 0.1 });
    finish(ctx);
    return;
  }
  // she holds the book out; a blank page lifts from it and comes to meet the viewer
  const fly = sat(t, 96.7, 99.2), fe = E.in(fly);
  paper(ctx);
  cam(ctx, t, { z: 1.0 + 0.05 * sat(t, 93.0, 97.2), cx: 960, cy: 700, seed: 18, hand: 2 }, () => {
    const bk = breathe(t, 1, 1), bf = breathe(t, 1, 2), bo = breathe(t), s = sq(t, 93.0, 1.2);
    char(ctx, 'k00', 370, 1050, 470, { sx: bk.sx, sy: bk.sy });
    char(ctx, 'f00', 1550, 1050, 470, { sx: bf.sx, sy: bf.sy });
    char(ctx, 'o10', 960, 1110, 820, { sx: bo.sx * s.sx, sy: bo.sy * s.sy });
    const str = O2.filter(c => t >= c[1]).map(c => c[0]).join('');
    const full = measure(ctx, '下一句，你来。', 92, 600, undefined, 8), cw = measure(ctx, str, 92, 600, undefined, 8);
    text(ctx, str, 960 - full / 2, 140, { size: 92, weight: 600, align: 'left', ls: 8 });
    caret(ctx, 960 - full / 2 + cw + 12, 140, 96, t, COL.orange, 7, t < 96.2);
  });
  if (fly > 0) {
    const pw = lerp(150, 2500, fe), ph = lerp(96, 1600, fe), py = lerp(752, 540, E.io(fly));
    ctx.save(); ctx.translate(960, py); ctx.rotate((1 - E.out(fly)) * -0.3 + Math.sin(fly * Math.PI) * 0.08);
    ctx.shadowColor = 'rgba(60,40,20,0.32)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 20;
    ctx.fillStyle = COL.paper; ctx.fillRect(-pw / 2, -ph / 2, pw, ph); ctx.restore();
  }
  if (fly >= 1) paper(ctx);
  const fa = sat(t, 99.2, 99.9);
  if (fa > 0) {
    const size = 104, full = measure(ctx, '下一句，你来。', size, 500, undefined, 12), ask = VAR.endAsk, dy = ask ? 30 : 0;
    text(ctx, '下一句，你来。', 960 - full / 2, 420 - dy, { size, weight: 500, align: 'left', ls: 12, alpha: fa });
    if (ask) text(ctx, ask, 960, 500, { size: 40, weight: 600, color: COL.orangeD, alpha: sat(t, 99.6, 100.1), ls: 10 });
    caret(ctx, 960 - full / 2 + full + 16, 420 - dy, 110, t, COL.orange, 8);
    const ea = sat(t, 99.8, 100.5);
    const sw = measure(ctx, 'Claude', 42, 700, undefined, 4), sx0 = 960 - (58 + sw) / 2;
    flower(ctx, sx0 + 22, 566 + dy, 22 * E.back(ea), t * 0.3, COL.orange);
    text(ctx, 'Claude', sx0 + 58, 568 + dy, { size: 42, weight: 700, align: 'left', alpha: ea, ls: 4 });
    cta(ctx, t, 100.25, 960, 742 + dy, 1.06, 1);
    text(ctx, '词 · 画面　Claude　　　同行　Ko　大肥鱼', 960, 990, { size: 30, weight: 500, color: COL.inkSoft, alpha: ea, ls: 5 });
  }
  bokeh(ctx, t, { n: 8, seed: 180, alpha: 0.1 });
  finish(ctx);
}
