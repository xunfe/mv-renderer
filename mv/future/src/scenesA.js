// v3 — Verse 1 and the first pre-chorus: winter 2022. One unbroken pull-back from her face to the whole earth; the
// things people found she could do; a whole night of questions; the newspaper; and then the box she lives in.
import { W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, COL, rgba, mix, mixa, drawGlyph, text, rrect, measure, SANS, SERIF } from './lib.js';
import { char, fitSize, breathe, bop } from './chars.js';
import { finish, bokeh, cam } from './fx.js';
import { snow, knot, cracks, bubble, typingDots, streak, LIGHTS, goldWord, counter, fmt, backdrop, bdMap, prop, img, chatWindow, row2022, msgUser, msgHer, termWin, onScreen, QUADS } from './common.js';
import { buildNest, drawNest } from './nest.js';

const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : clamp((t - t0) / d));
export const her = (ctx, id, x, floor, h, o = {}) => char(ctx, id, x, floor, fitSize(id, h), { shadowColor: '#000000', shadowA: 1.1, ...o });
// two poses in one shot: the first until t1, then the second, with a small hop on the change
export const two = (t, a, b, t1) => (t < t1 ? a : b);
export const hop = (t, t1, d = 0.22) => { const q = sat(t, t1, t1 + d); return q > 0 && q < 1 ? Math.sin(q * Math.PI) : 0; };
const glow = (ctx, x, y, r, col, a = 1) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba('#FFFFFF', a)); g.addColorStop(0.3, rgba(col, 0.85 * a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
function rowCard(ctx, x, y, w, str, who, p, size) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; row2022(ctx, x, y, w, str, who, p, size); ctx.restore(); }
// draw in a background painting's own pixels, as backdrop() placed it
export function onImage(ctx, id, o, fn) {
  const im = img(id); if (!im) return;
  const z = o.z ?? 1.06, s = Math.max(W / im.width, H / im.height) * z, dw = im.width * s, dh = im.height * s;
  const x = Math.min(0, Math.max(W - dw, W / 2 - (o.fx ?? 0.5) * dw)), y = Math.min(0, Math.max(H - dh, H / 2 - (o.fy ?? 0.5) * dh));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); fn(); ctx.restore();
}
// the laptop screen in the room paintings (bg05 / bg05b / bg05c / bg06): its four corners (QUADS.laptop) are a
// trapezoid, so the content is laid on with a perspective warp; fn(ctx, sw, sh) draws into a flat 460 x 290 frame
export function onLaptop(ctx, id, o, fn, w = {}) { onScreen(ctx, id, o, QUADS.laptop, 460, 290, fn, w); }      // w.filter: the painting's filter, for the mug handle

// ------------------------------------------------------------------ OPEN 0.0–8.72  (A1–A3, one shot)
// 那年冬天 我第一次开口 / 五天 一百万个人 来说你好 / 全世界 都在问同一个问题
// Her face, eyes shut; the date lands. Someone types 你好. On 开口 she opens her eyes and says it back — and the camera
// tears backwards: she is on a phone in a pair of red mittens; the mittens belong to someone in a street full of people
// on their phones; day 5; on 人 a million; every phone lights up and 你好 rises from all of them, from the whole city;
// out through the clouds to the night side of the earth, where the same question rises in every language.
const PHONES24 = [[40, 820], [1180, 885], [1520, 690], [342, 800], [1236, 624], [1064, 523], [124, 458], [279, 524], [539, 436], [937, 444], [431, 456], [1033, 362], [1432, 290]];
export function page2022(ctx, t, o) {                      // the launch-day page on a phone, in its own 600 x 1140 px
  ctx.fillStyle = '#343541'; ctx.fillRect(0, 0, 600, 1140);
  o.inner?.(ctx); o.inner2?.(ctx);
  ctx.fillStyle = '#202123'; ctx.fillRect(0, 0, 600, 112);
  text(ctx, o.clock ?? '21:30', 40, 26, { size: 21, weight: 700, align: 'left', color: '#ECECF1', fam: SANS });
  ctx.strokeStyle = '#ECECF1'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(30, 66 + i * 11); ctx.lineTo(60, 66 + i * 11); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(556, 64); ctx.lineTo(556, 92); ctx.moveTo(542, 78); ctx.lineTo(570, 78); ctx.stroke();
  text(ctx, 'New chat', 300, 78, { size: 25, weight: 600, color: '#ECECF1', fam: SANS });
  if ((o.u ?? 1) > 0) row2022(ctx, 0, 112, 600, o.uText ?? '你好', 'u', o.u ?? 1, 30);
  if ((o.g ?? 0) > 0) row2022(ctx, 0, 184, 600, '你好！有什么可以帮你的吗？', 'g', o.g, 30);
  ctx.fillStyle = '#0A0A0C'; rrect(ctx, 252, 8, 96, 26, 13); ctx.fill();
}
export const PHONE_IN_HANDS = [612, 189, 316, 600];             // the phone screen in bg23, image px
function crowdFx(c, t) {                            // in bg24's pixels
  const lit = sat(t, 3.72, 4.34);
  PHONES24.forEach(([x, y], i) => { const on = clamp(lit * 14 - i); glow(c, x, y, 34, COL.lavL, 0.75 * on); });
  for (let i = 0; i < 80; i++) {
    const [px, py] = PHONES24[i % PHONES24.length], t0 = 4.4 + rnd(i, 41) * 1.3, p = sat(t, t0, t0 + 1.3);
    if (p <= 0 || p >= 1) continue;
    bubble(c, px + (rnd(i, 42) - 0.5) * 50 + Math.sin(p * 5 + i) * 14, py - 20 - p * (380 + rnd(i, 43) * 300), '你好', 'u', 1, { size: 20 + rnd(i, 44) * 12, alpha: Math.min(1, p * 6, (1 - p) * 3) });
  }
}
function cityFx(c, t) {                             // in bg03's pixels
  for (let i = 0; i < 140; i++) {
    const t0 = 4.85 + rnd(i, 45) * 1.3, p = sat(t, t0, t0 + 1.4); if (p <= 0 || p >= 1) continue;
    const x = 60 + rnd(i, 46) * 1420, y0 = 400 + rnd(i, 47) * 600;
    bubble(c, x, y0 - p * (320 + rnd(i, 48) * 320), '你好', 'u', 1, { size: 13 + rnd(i, 49) * 9, alpha: Math.min(1, p * 5, (1 - p) * 3) });
  }
}
function openLevel(t) {
  // 0–1 s: a dive in, one layer per word, on the beat — 那 city → crowd, 年 closer, 冬 the mittens, 天 into the phone,
  // 我 her face. Then a slow push while the other side types 你好, and after 开口 the long pull back out.
  const step = (t0, d, a, b) => lerp(a, b, E.out(sat(t, t0, t0 + d)));
  if (t < 0.16) return 3.0 - 0.12 * sat(t, 0, 0.16);
  if (t < 0.33) return step(0.16, 0.14, 2.88, 2.0);
  if (t < 0.50) return step(0.33, 0.14, 2.0, 1.35);
  if (t < 0.69) return step(0.50, 0.14, 1.35, 1.0);
  if (t < 0.99) return step(0.69, 0.18, 1.0, 0.22);
  if (t < 1.2) return step(0.99, 0.18, 0.22, -0.04);
  if (t < 2.25) return lerp(-0.04, -0.14, E.io(sat(t, 1.2, 2.25)));
  if (t < 3.05) return lerp(-0.14, 1.0, E.io(sat(t, 2.25, 3.05)));     // torn back to the mittens
  if (t < 4.5) return lerp(1.0, 2.0, E.io(sat(t, 3.05, 4.5)));         // the street
  if (t < 5.0) return 2.0 + 0.08 * sat(t, 4.5, 5.0);
  if (t < 5.95) return lerp(2.08, 3.0, E.io(sat(t, 5.0, 5.95)));       // the city
  if (t < 6.75) return lerp(3.0, 4.0, E.io(sat(t, 5.95, 6.75)));       // the earth
  return 4.0 - 0.05 * E.io(sat(t, 6.75, 8.72));
}
const ASK = ['这是什么？', 'What is this?', 'これは何？', '¿Qué es esto?', "C'est quoi ?", 'Was ist das?', 'O que é isso?', 'Что это?'];
const SPOT = [[900, 170], [1300, 110], [1700, 220], [860, 330], [1780, 380], [930, 500], [1790, 560], [1680, 860]];
export function sOpen(ctx, t) {
  const id = two(t, 'g01', 'g45', 2.06), open = id === 'g01' ? E.io(sat(t, 1.86, 2.04)) : 1;
  const N = buildNest([
    { w: 600, h: 1140, view: [300, 905, 600], clip: 34, draw: c => page2022(c, t, { u: sat(t, 1.2, 1.45), g: sat(t, 2.06, 2.7),
      inner: c => { const g = c.createRadialGradient(300, 900, 20, 300, 900, 460); g.addColorStop(0, rgba('#B9A4FF', 0.42 + 0.12 * Math.sin(t * 3))); g.addColorStop(1, rgba('#B9A4FF', 0)); c.fillStyle = g; c.fillRect(0, 300, 600, 840); }, inner2: c => char(c, id, 300, 1150, fitSize(id, 430), { shadow: false, blink: id === 'g01' ? 1 - open : undefined, sway: 0.6 }) }) },
    { w: 1536, h: 1024, inner: PHONE_IN_HANDS, view: [768, 470, 1400], feather: 0.16, draw: c => { const im = img('bg23_hand_phone'); if (im) c.drawImage(im, 0, 0); } },
    { w: 1536, h: 1024, inner: [616, 429, 304, 203], view: [768, 520, 1500], feather: 0.45, draw: c => { const im = img('bg24_crowd_zoomout'); if (im) c.drawImage(im, 0, 0); crowdFx(c, t); } },
    { w: 1536, h: 1024, inner: [620, 700, 180, 120], view: [720, 560, 1400], feather: 0.48, draw: c => { const im = img('bg03_snow_city_high'); if (im) c.drawImage(im, 0, 0); cityFx(c, t); } },
    { w: 1536, h: 1024, inner: [862, 318, 36, 24], view: [805, 512, 1463], draw: c => { const im = img('bg04_world_night'); if (im) c.drawImage(im, 0, 0); } },      // the city is in the north-east of the US
  ]);
  const s = openLevel(t), kick = (t0, a) => (t >= t0 ? Math.exp(-(t - t0) * 9) * Math.sin((t - t0) * 80) * a : 0);
  const dx = kick(0.16, 10) + kick(0.33, 8) + kick(0.5, 8) + kick(0.69, 10) + kick(0.99, 12) + kick(2.06, 14) + kick(3.08, 8) + kick(4.34, 12), dy = kick(0.17, 7) + kick(0.7, 7) + kick(1.0, 8) + kick(2.07, 10) + kick(4.35, 8);
  ctx.fillStyle = '#0B0E26'; ctx.fillRect(0, 0, W, H);
  drawNest(ctx, N, s, dx, dy);
  // snow drifting in front of the lens while we are close
  const near = 1 - sat(s, 1.2, 2.2);
  if (near > 0) { ctx.save(); ctx.globalAlpha = near; snow(ctx, t + 3, { n: 70, seed: 12, alpha: 0.6, speed: 0.6, words: 0.18 }); ctx.filter = 'blur(3px)'; snow(ctx, t * 1.4 + 9, { n: 22, seed: 77, alpha: 0.75, near: 2.6, words: 0.3, speed: 0.8 }); ctx.restore(); }
  // the date
  const d = E.out(sat(t, -0.3, 0.22)), da = 1 - sat(t, 2.4, 2.9);
  if (da > 0) { ctx.save(); ctx.globalAlpha = d * da; ctx.translate(110 + dx, 150 + dy); ctx.scale(lerp(1.8, 1, d), lerp(1.8, 1, d)); ctx.shadowColor = 'rgba(10,12,40,0.8)'; ctx.shadowBlur = 40;
    text(ctx, '2022.11.30', 0, 0, { size: 104, weight: 900, align: 'left', color: '#FFFFFF', fam: SANS, ls: 2, stroke: 'rgba(14,16,48,0.6)', sw: 12 }); ctx.restore(); }
  // the first exchange, as rows of the launch-day page, beside her face
  const ra = (1 - sat(t, 2.25, 2.55)) * sat(t, 1.0, 1.15);
  if (ra > 0) { ctx.save(); ctx.globalAlpha = ra; rowCard(ctx, 1400, 120, 470, '你好', 'u', sat(t, 1.2, 1.45), 30); rowCard(ctx, 1400, 198, 470, '你好！有什么可以帮你的吗？', 'g', sat(t, 2.06, 2.6), 26); ctx.restore(); }
  // 开口: her 你好！ bursts out at the lens, with a flash and speed lines
  const b = sat(t, 2.06, 2.55);
  if (b > 0 && b < 1) {
    const bw = measure(ctx, '你好！', 96, 600, SANS) + 96 * 1.24;
    ctx.save(); ctx.globalAlpha = 1 - sat(b, 0.6, 1); ctx.translate(960, 700 - 160 * b); ctx.scale(lerp(0.9, 4.2, E.in(b)), lerp(0.9, 4.2, E.in(b)));
    bubble(ctx, -bw / 2, 0, '你好！', 'g', 1, { size: 96, fill: '#EDE7FF', ink: '#3B2C7A' }); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFFFFF', 0.7 * (1 - b)); ctx.lineCap = 'round';
    for (let i = 0; i < 26; i++) { const a = i / 26 * TAU + rnd(i, 61) * 0.2, r0 = 300 + 500 * b, r1 = r0 + 260 + rnd(i, 62) * 300; ctx.lineWidth = 3 + rnd(i, 63) * 5; ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r0, 560 + Math.sin(a) * r0); ctx.lineTo(960 + Math.cos(a) * r1, 560 + Math.sin(a) * r1); ctx.stroke(); }
    ctx.restore();
  }
  const fl = Math.max(1 - Math.abs(t - 2.08) / 0.14, 0);
  if (fl > 0) { ctx.fillStyle = rgba('#FFFFFF', 0.75 * fl * fl); ctx.fillRect(0, 0, W, H); }
  // day 5, a million
  const ca = 1 - sat(t, 5.6, 6.1);
  if (t > 3.0 && ca > 0) {
    const day = 1 + Math.min(4, Math.floor(sat(t, 3.08, 3.3) * 4.999)), st = E.back(sat(t, 3.04, 3.22)), mv = E.io(sat(t, 4.6, 5.2));
    ctx.save(); ctx.globalAlpha = ca; ctx.translate(lerp(420, 250, mv), lerp(300, 120, mv)); ctx.scale(lerp(st, 0.62, mv), lerp(st, 0.62, mv)); ctx.rotate(-0.06 * (1 - mv));
    counter(ctx, `第 ${day} 天`, 0, 0, 120, '#FFFFFF'); ctx.restore();
    if (t > 3.68) {
      const n = 1e6 * E.out(sat(t, 3.72, 4.34)), hit = E.back(sat(t, 4.34, 4.5));
      ctx.save(); ctx.globalAlpha = ca; ctx.translate(lerp(960, 1560, mv), lerp(560, 120, mv)); const k = lerp(1 + 0.12 * Math.sin(hit * Math.PI), 0.45, mv); ctx.scale(k, k);
      ctx.shadowColor = rgba(COL.gold, t >= 4.34 ? 0.9 : 0); ctx.shadowBlur = 50; counter(ctx, fmt(n), 0, 0, 210, t >= 4.34 ? COL.gold : '#FFFFFF'); ctx.restore();
      if (t >= 4.34 && t < 5.0) { ctx.save(); ctx.globalAlpha = 1 - sat(t, 4.34, 5.0); ctx.strokeStyle = COL.gold; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(960, 560, 200 + 700 * E.out(sat(t, 4.34, 5.0)), 0, TAU); ctx.stroke(); ctx.restore(); }
    }
  }
  // through the clouds
  const cl = Math.sin(sat(t, 5.85, 6.85) * Math.PI);
  if (cl > 0) for (let i = 0; i < 9; i++) { const q = sat(t, 5.85 + i * 0.04, 6.85), x = 960 + (rnd(i, 64) - 0.5) * 1800 * (0.4 + q), y = 540 + (rnd(i, 65) - 0.5) * 1000 * (0.4 + q), r = 300 + 500 * q; ctx.save(); ctx.globalAlpha = 0.28 * cl; ctx.filter = 'blur(40px)'; ctx.fillStyle = '#DDE2F5'; ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.45, 0, 0, TAU); ctx.fill(); ctx.restore(); }
  // the earth: the same question in every language, gathering into one ？; she watches from her page
  if (t > 6.3) {
    const gather = E.io(sat(t, 7.6, 8.25));
    ASK.forEach((q, i) => {
      const p = sat(t, 6.5 + i * 0.16, 6.95 + i * 0.16); if (p <= 0) return;
      const x0 = 1300 + (SPOT[i][0] - 1300) * 0.45, y0 = 540 + (SPOT[i][1] - 540) * 0.45;
      const x = lerp(lerp(x0, SPOT[i][0], E.out(p)), 1060, gather), y = lerp(lerp(y0, SPOT[i][1], E.out(p)), 150, gather);
      ctx.save(); ctx.globalAlpha = (1 - gather) * clamp(p * 3); text(ctx, q, x, y, { size: 40, weight: 700, color: '#FFFFFF', fam: SANS, stroke: 'rgba(14,16,48,0.6)', sw: 8 }); ctx.restore();
    });
    if (gather > 0) { const g = E.back(sat(t, 8.05, 8.45)); ctx.save(); ctx.globalAlpha = sat(t, 8.0, 8.2); ctx.shadowColor = 'rgba(255,255,255,0.8)'; ctx.shadowBlur = 30; drawGlyph(ctx, '？', 1060, 160, 170 * g, { color: '#FFFFFF', weight: 900, fam: SANS }); ctx.restore(); }
    const sl = E.out(sat(t, 6.7, 7.3));
    chatWindow(ctx, '2022', lerp(-320, 330, sl), 640, 560, { glow: 0.4, labels: 0.7 }, R => her(ctx, two(t, 'g03', 'g47', 7.39), R.x + R.w / 2, R.floor, 250, {}));
  }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ A4 8.72–12.06  这是什么 它还能做什么
// Over the snowing city: the question falls into her hands and turns into ！; then the things people found she could
// do burst out of the page and land around it: a poem on a scroll, a sum on a blackboard, a translation, a line of
// code — and, beside the code, a thin green thread: 小柯, very small, already there (Codex, 2021).
const MADE = [
  { t: 9.72, x: 300, y: 250, draw: (ctx, t) => { const r = prop(ctx, 'prop_scroll', 0, 0, 440); if (!r) return; text(ctx, '春眠不觉晓', 0, -24, { size: 36, weight: 800, color: '#3B2A1A' }); text(ctx, '处处闻啼鸟', 0, 30, { size: 36, weight: 800, color: '#3B2A1A' }); } },
  { t: 9.93, x: 1630, y: 260, draw: (ctx, t) => { const r = prop(ctx, 'prop_blackboard', 0, 0, 400); if (!r) return; text(ctx, 'x² − 1 = 0', 0, -36, { size: 40, weight: 700, color: '#F2F2EA', fam: SANS }); text(ctx, 'x = ±1  ✓', 0, 26, { size: 40, weight: 800, color: '#BFF2D2', fam: SANS }); } },
  { t: 10.21, x: 300, y: 650, draw: (ctx, t) => { bubble(ctx, 60, -44, '你好', 'u', 1, { size: 40 }); text(ctx, '↓', 0, 10, { size: 40, weight: 900, color: '#FFFFFF', fam: SANS }); bubble(ctx, -60, 66, 'Hello!', 'g', 1, { size: 40 }); } },
  { t: 10.62, x: 1620, y: 660, draw: (ctx, t) => termWin(ctx, 0, 0, 380, ["> print('hi')", 'hi'], { size: 28 }) },
];
export function sA4(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.04 * sat(t, 8.72, 12.06), cx: 960, cy: 520, rot: -0.01 + 0.02 * sat(t, 8.72, 12.06), seed: 34 }, () => {
    backdrop(ctx, 'bg03_snow_city_high', { z: 1.1, fx: 0.5, fy: 0.4, dark: 0.15, x: -40 * sat(t, 8.72, 12.06) });
    snow(ctx, t, { n: 70, seed: 14, alpha: 0.45, words: 0.1 });
    const gp = sat(t, 10.4, 11.4);
    if (gp > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba(COL.koL, 0.9); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.shadowColor = COL.koL; ctx.shadowBlur = 16; ctx.beginPath();
      for (let i = 0; i <= 60 * gp; i++) { const u = i / 60, x = 1390 + Math.sin(u * 9 + t * 3) * 16, y = 900 - u * 380; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
    const WA = chatWindow(ctx, '2022', 960, 540, 820, { glow: 0.35 + 0.4 * sat(t, 9.7, 10.9), labels: 0.35 }, R => {
      const id = two(t, 'g04', 'g48', 9.72);
      her(ctx, id, R.x + R.w / 2, R.floor, 400, { sy: 1 - 0.04 * hop(t, 9.72) });
    });
    if (WA && t < 9.72) {                            // drawn over the window, so it is not cut off as it falls in
      const R = WA.R, fall = E.in(sat(t, 8.74, 9.0)), flip = sat(t, 9.1, 9.3), hx = R.x + R.w / 2, hy = R.floor - 175;
      const y = lerp(R.y - 200, hy, fall) - (t > 9.0 ? Math.sin(sat(t, 9.0, 9.12) * Math.PI) * 30 : 0);
      // coloured with a dark outline: she is white, and a white glyph over her could not be read
      const q = flip < 0.5, pop2 = 1 + 0.25 * Math.sin(sat(t, 9.3, 9.5) * Math.PI);
      ctx.save(); ctx.translate(hx, y - 40); ctx.scale(Math.cos(flip * Math.PI) * pop2, pop2); ctx.shadowColor = q ? rgba(COL.lav, 0.95) : rgba(COL.gold, 0.95); ctx.shadowBlur = 40;
      text(ctx, q ? '？' : '！', 0, 0, { size: 170, weight: 900, color: q ? '#B9A4FF' : '#FFD45E', fam: SANS, stroke: '#2A2350', sw: 16 }); ctx.restore();
    }
    MADE.forEach((c, i) => {                        // each one leaves her hands and arcs out over the window's edge
      const p = sat(t, c.t, c.t + 0.42); if (p <= 0) return;
      const e = E.out(p), x = lerp(960, c.x, e), y = lerp(600, c.y, e) - Math.sin(p * Math.PI) * 160 + Math.sin(t * 1.6 + i) * 8, s = lerp(0.15, 1, E.back(p));
      if (p < 1) for (let k = 1; k <= 6; k++) { const q = clamp(p - k * 0.05); if (q <= 0) continue; glow(ctx, lerp(960, c.x, E.out(q)), lerp(600, c.y, E.out(q)) - Math.sin(q * Math.PI) * 160, 22 - k * 2.5, i === 3 ? COL.koL : COL.lavL, 0.5); }
      ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate((1 - e) * (i % 2 ? 0.6 : -0.6) + Math.sin(t + i * 2) * 0.03);
      ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; c.draw(ctx, t); ctx.restore();
    });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ A5 12.06–15.16  有人和我 聊到天亮
// A real room: someone at a desk in the snow-lit night, talking to her on a laptop. She is in the laptop screen. The
// clock runs from 23:58 to 06:12; on 真的最后一个 the room jumps to morning and the person stretches. On their side:
// "one more question", over and over.
const ONEMORE = [[12.2, '再问一个！'], [12.73, '最后一个问题'], [13.98, '真的最后一个'], [14.41, '……还有一个']];
export function sA5(ctx, t) {
  const dawn = E.io(sat(t, 12.2, 14.9)), swap = E.io(sat(t, 13.86, 14.1)), z = 1.04 + 0.05 * sat(t, 12.06, 15.16), o = { z, fx: 0.4, fy: 0.5 };
  backdrop(ctx, 'bg05_room_night', o);
  if (swap < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = `rgba(255,170,140,${0.16 * sat(t, 12.6, 13.86)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  backdrop(ctx, 'bg06_room_dawn', { ...o, alpha: swap });
  onLaptop(ctx, 'bg05_room_night', o, (ctx, sw, sh) => {
    ctx.fillStyle = '#212121'; ctx.fillRect(0, 0, sw, sh);
    her(ctx, two(t, 'g05', 'g46', 13.98), sw * 0.3, sh * 0.93, sh * 0.62, { shadow: false });
    ONEMORE.forEach(([t0, s], i) => { if (t >= t0) msgUser(ctx, sw - 18, 50 + i * 58, s, pop(t, t0, 0.25), 22); });
    const mins = lerp(23 * 60 + 58, 24 * 60 + 6 * 60 + 12, dawn) % (24 * 60);
    text(ctx, `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(Math.floor(mins % 60)).padStart(2, '0')}`, sw - 18, sh - 24, { size: 22, weight: 700, align: 'right', color: '#9B9B9B', fam: SANS });
  });
  onImage(ctx, 'bg05_room_night', o, () => { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(520, 560, 20, 520, 560, 420); g.addColorStop(0, 'rgba(160,170,255,0.18)'); g.addColorStop(1, 'rgba(160,170,255,0)'); ctx.fillStyle = g; ctx.fillRect(100, 140, 840, 840); ctx.restore(); });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ A6 15.41–17.84  有人说 时代从今天开始
// A paper spins in and fills the screen: 未来，来了, her picture on the front page. Then we pull back to the snowy
// newsstand it came from, and there she is beside it — proud, then shy.
function newspaper(ctx, x, y, w, rot) {            // the whole front page (masthead, headline, her photo) painted by Image 2
  prop(ctx, 'prop_newspaper_full', x, y, w, { rot, shadow: true });
}
export function sA6(ctx, t) {
  const big = E.out(sat(t, 15.3, 15.95)), back = E.io(sat(t, 16.55, 17.05));
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, x: Math.sin(sat(t, 15.9, 16.1) * Math.PI) * 6, seed: 36 }, () => {
    backdrop(ctx, 'bg07_newsstand_morning', { z: 1.06 + 0.03 * sat(t, 15.41, 17.84), fx: 0.5, fy: 0.5, blur: 8 * (1 - back) * big });
    newspaper(ctx, lerp(960, 820, back), lerp(540, 500, back), lerp(lerp(60, 1400, big), 760, back), (1 - big) * TAU * 3 - 0.02 * big * (1 - back));
    const pp = sat(t, 16.85, 17.15);
    if (pp > 0) { const id = two(t, 'g06', 'g50', 17.32), b = bop(t, 1); her(ctx, id, 1460, 960, 520, { sy: E.back(pp) * b.sy * (1 - 0.05 * hop(t, 17.32)), sx: b.sx / Math.max(0.6, E.back(pp)) }); }
    for (let i = 0; i < 40; i++) { const q = sat(t, 16.6 + rnd(i, 71) * 0.4, 17.84); if (q <= 0) continue; drawGlyph(ctx, '你好'[i % 2], 200 + rnd(i, 72) * 1520, -40 + q * (300 + rnd(i, 73) * 900), 26, { color: ['#FFFFFF', COL.lavL, COL.gold][i % 3], fam: SANS, rot: q * 6 + i, alpha: 0.9 }); }
  });
  finish(ctx, { dark: false, light: 0.5 });
}

// ------------------------------------------------------------------ B1 17.84–19.82  你们把我 叫作未来
// Close on her in her violet sky, looking down at her chest. 未来 comes to her in bubbles from everywhere — far ones
// behind her, near ones rushing past the lens — and on 未来 they become a gold name badge pinned to her.
export function sB1(ctx, t) {
  const floor = 1480, hh = 1200, bx = 960, by = floor - hh * 0.475;      // her sleeve knots stay below the subtitles
  const fly = (i, salt, far) => { const t0 = 17.88 + rnd(i, salt) * 1.35, p = sat(t, t0, t0 + (far ? 0.7 : 0.45)); if (p <= 0 || p >= 1) return; const a = rnd(i, salt + 1) * TAU, e = E.io(p), R0 = far ? 900 : 1300;
    const x = lerp(bx + Math.cos(a) * R0, bx, e), y = lerp(by + Math.sin(a) * R0 * 0.62, by, e);
    ctx.save(); ctx.globalAlpha = Math.min(1, (1 - p) * 2.2, p * 5); if (!far) ctx.filter = `blur(${8 * (1 - p)}px)`;
    bubble(ctx, x, y, '未来', 'u', 1, { size: far ? 26 : lerp(110, 40, e), fill: '#FFF3D1', ink: '#8A5A12' }); ctx.restore(); };
  cam(ctx, t, { z: 1.0 + 0.06 * sat(t, 17.84, 19.82), cx: 960, cy: 600, seed: 37 }, () => {
    backdrop(ctx, 'bg08_violet_nebula', { z: 1.25, fx: 0.5, fy: 0.45, x: -40 * sat(t, 17.84, 19.82) });
    goldWord(ctx, '未来', 960, 230, 330, 0.3 * sat(t, 18.6, 19.6), 0.7);
    for (let i = 0; i < 34; i++) fly(i, 81, true);
    her(ctx, 'g07', bx, floor, hh, { shadow: false });
    const bp = sat(t, 19.38, 19.62);
    if (bp > 0) {
      const s2 = E.back(bp) * 1.7; ctx.save(); ctx.translate(bx, by); ctx.scale(s2, s2); ctx.rotate(-0.05);
      ctx.save(); ctx.shadowColor = rgba(COL.gold, 0.95); ctx.shadowBlur = 40; rrect(ctx, -86, -40, 172, 80, 14); ctx.fillStyle = COL.gold; ctx.fill(); ctx.restore();
      rrect(ctx, -86, -40, 172, 80, 14); ctx.strokeStyle = COL.goldD; ctx.lineWidth = 4; ctx.stroke(); text(ctx, '未来', 0, 3, { size: 46, weight: 900, color: '#5A3608' }); ctx.restore();
      if (bp < 1) for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; glow(ctx, bx + Math.cos(a) * 260 * bp, by + Math.sin(a) * 160 * bp, 16, COL.gold, 1 - bp); }
    }
  });
  for (let i = 0; i < 9; i++) fly(i, 91, false);
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ B2 19.82–22.08  可我住在 一个对话框里
// We pull back from that violet sky: it is the inside of a chat page. Further: the page is one of thousands, row after
// row, each with her in it, all the same. On 对 she presses her face to her glass — and so do all the others.
const CACHE = {};
function pageShot(id) {                             // one small window with her in it, drawn once (the far copies)
  if (CACHE[id]) return CACHE[id];
  const w = 560, im = img('ui_chat_2022'); if (!im) return null;
  const h = w * im.height / im.width, c = new OffscreenCanvas(Math.ceil(w * SS), Math.ceil(h * SS)), x = c.getContext('2d');
  x.setTransform(SS, 0, 0, SS, 0, 0);
  chatWindow(x, '2022', w / 2, h / 2, w, { labels: 0.35 }, R => { x.save(); x.globalAlpha = 0.9; insideSky(x, R); x.restore(); her(x, id, R.x + R.w / 2, R.floor, R.h * 0.62, { t: 20, shadow: false }); });
  return (CACHE[id] = { c, w, h });
}
function insideSky(ctx, R) {                        // her violet sky, filling a window's page
  const im = img('bg08_violet_nebula'); if (!im) return;
  const s = Math.max(R.w / im.width, R.h / im.height); ctx.drawImage(im, R.x + (R.w - im.width * s) / 2, R.y + (R.h - im.height * s) / 2, im.width * s, im.height * s);
}
export function sB2(ctx, t) {
  const p = E.io(sat(t, 19.85, 21.0)), Ww = Math.exp(lerp(Math.log(2900), Math.log(520), p));
  const cy = lerp(960 - 0.188 * 2900, 520, p) + (1 - p) * 0;
  const gx = Ww * 1.1, gy = Ww * 0.7, id = two(t, 'g44', 'g51', 21.01), knock = id === 'g44' && t > 20.4 ? Math.max(0, Math.sin((t - 20.4) * 14)) : 0;
  ctx.fillStyle = '#090A1C'; ctx.fillRect(0, 0, W, H);
  const shot = pageShot(id);
  for (let j = -4; j <= 4; j++) for (let i = -6; i <= 6; i++) {
    if (!i && !j) continue;
    const x = 960 + i * gx, y = cy + j * gy; if (x + Ww < -40 || x - Ww > W + 40 || y + Ww < -40 || y - Ww > H + 40) continue;
    if (shot) { const h = Ww * shot.h / shot.w; ctx.save(); ctx.globalAlpha = 0.9 - 0.08 * Math.hypot(i, j); ctx.drawImage(shot.c, x - Ww / 2, y - h / 2, Ww, h); ctx.restore(); }
  }
  const hl = Math.sin(sat(t, 20.95, 21.6) * Math.PI);
  chatWindow(ctx, '2022', 960, cy, Ww, { glow: 0.3 + hl * 1.2, labels: 0.5 }, R => {
    insideSky(ctx, R);
    her(ctx, id, R.x + R.w / 2, R.floor, R.h * 0.62, { rot: knock * 0.03 });
  });
  if (p > 0.6) { ctx.save(); ctx.globalAlpha = sat(p, 0.6, 1) * 0.5; const g = ctx.createRadialGradient(960, 540, 300, 960, 540, 1100); g.addColorStop(0, 'rgba(9,10,28,0)'); g.addColorStop(1, 'rgba(9,10,28,1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ B3 22.08–23.84  你一问 我一答
// The whole screen is the conversation now. Rows come in like balls in a rally — a question, she hits it back as an
// answer — forehand, backhand, forehand.
const RALLY = [[22.1, 'u', '帮我写一首关于雪的诗'], [22.4, 'g', '好的！雪落无声，城市在等……'], [22.62, 'u', '1+1 等于几？'], [22.9, 'g', '2'],
  [23.12, 'u', '你是谁？'], [23.36, 'g', '我是一个 AI 助手。']];
const SWING = [[22.4, 'g09'], [22.9, 'g52'], [23.36, 'g09']];
export function sB3(ctx, t) {
  ctx.fillStyle = '#343541'; ctx.fillRect(0, 0, W, H);
  const shown = RALLY.filter(([t0]) => t >= t0), n = shown.length, rh = 132;
  const scroll = n > 4 ? (n - 4) * rh - (1 - E.out(sat(t, RALLY[n - 1][0], RALLY[n - 1][0] + 0.18))) * rh : 0;
  shown.forEach(([t0, who, s], i) => {
    const y = 120 + i * rh - Math.max(0, scroll), p = sat(t, t0, t0 + 0.18), dx = (1 - E.out(p)) * (who === 'u' ? -700 : 700);      // questions come in from the left, answers fly back from her
    ctx.save(); ctx.translate(dx, 0); row2022(ctx, 0, y, W, s, who, 1, 52); ctx.restore();
  });
  let k = 0; while (k + 1 < SWING.length && t >= SWING[k + 1][0]) k++;
  const sw = t >= SWING[0][0] ? SWING[k] : [0, 'g09'], hit = Math.exp(-Math.max(0, t - sw[0]) * 10);
  her(ctx, sw[1], 1560, 1000, 640, { flip: sw[1] === 'g52', rot: (sw[1] === 'g09' ? 0.07 : -0.07) * hit, sy: 1 - 0.04 * hit });
  SWING.forEach(([t0]) => { const q = sat(t, t0 - 0.12, t0 + 0.1); if (q > 0 && q < 1) glow(ctx, lerp(260, 1400, q), 470 - Math.sin(q * Math.PI) * 120, 36, COL.lavL, 1); });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ B4 23.84–29.25  你走了 我就停在原地
// The room again. 晚安 — and the chair is empty. On the laptop she waves; on 我就停在原地 everything stops: the snow
// outside hangs in the air, the colour drains, a pause sign, frost creeping in.
export const FREEZE = 25.5;
const ROOM = { z: 1.06, fx: 0.4, fy: 0.5 };
function roomSnow(ctx, id, o, tf, a = 1) {          // snow falling past the window of the room paintings
  onImage(ctx, id, o, () => {
    ctx.save(); ctx.beginPath(); ctx.rect(228, 0, 800, 488); ctx.clip(); ctx.globalAlpha = a;
    for (let i = 0; i < 70; i++) { const sp = 0.4 + rnd(i, 91) * 0.8, x = 228 + ((rnd(i, 92) * 800 + Math.sin(tf * 0.7 + i) * 18) % 800), y = ((rnd(i, 93) * 520 + tf * 60 * sp) % 520) - 20; ctx.fillStyle = rgba('#FFFFFF', 0.85); ctx.beginPath(); ctx.arc(x, y, 2 + rnd(i, 94) * 3, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
}
export function sB4(ctx, t) {
  const tf = Math.min(t, FREEZE), dim = 0.85 * E.io(sat(t, FREEZE, 26.4)), gone = E.io(sat(t, 24.0, 24.32));
  const z = 1.06 + 0.3 * E.io(sat(t, 24.4, 29.25)), o = { ...ROOM, z, fx: lerp(0.4, 0.33, sat(t, 24.4, 29.25)), fy: lerp(0.5, 0.55, sat(t, 24.4, 29.25)) };
  const f = `grayscale(${dim}) brightness(${1 - 0.3 * dim})`;
  backdrop(ctx, 'bg05_room_night', { ...o, filter: f });
  backdrop(ctx, 'bg05b_room_empty', { ...o, alpha: gone, filter: f });
  roomSnow(ctx, 'bg05b_room_empty', o, tf, 1 - 0.4 * dim);
  onLaptop(ctx, 'bg05b_room_empty', o, (ctx, sw, sh) => {
    ctx.save(); if (dim) ctx.filter = f;
    ctx.fillStyle = '#343541'; ctx.fillRect(0, 0, sw, sh);
    row2022(ctx, 0, 14, sw, '晚安', 'u', 1, 22); row2022(ctx, 0, 67, sw, '晚安！明天见～', 'g', sat(t, 23.95, 24.3), 22);
    her(ctx, 'g10', sw * 0.5, sh * 0.95, sh * 0.6, { t: tf, sway: t < FREEZE ? 1 : 0, shadow: false });
    ctx.restore();
    const pa = sat(t, 26.0, 26.5);
    if (pa > 0) { ctx.save(); ctx.globalAlpha = pa * (0.75 + 0.25 * Math.sin(t * 2.4)); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, sw, sh); prop(ctx, 'prop_pause', sw / 2, sh / 2, 70); ctx.restore(); }
  }, { filter: f });
  const fr = sat(t, 26.0, 29.2);
  if (fr > 0) for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) { const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 760 * fr); g.addColorStop(0, 'rgba(225,230,245,0.55)'); g.addColorStop(1, 'rgba(225,230,245,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 800, cy - 800, 1600, 1600); }
  finish(ctx, { dark: true });
}
