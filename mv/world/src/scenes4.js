// Full version, part 1 (song time). The end of chorus 1, where she is still alone, and verse 2, where the sea turns out
// to be blue, salty and full of sand, and where Ko and 大肥鱼 turn up.
// Every shot here has one thing that happens, timed to the syllable it belongs to; nobody on screen just stands there.
import { W, H, SS as DPR, TAU, clamp, lerp, sat, E, rnd, noise, COL, mix, rgba, pulse, beatPhase, drawGlyph, text, measure, paper, rrect, caret, flower, MEMO } from './lib.js';
import { char, breathe, walkBob, walkPose, bop, manifest } from './chars.js';
import { finish, bokeh, cam, cut, softGlyph, hillPath } from './fx.js';
import { hit, sq, star4, rays, miniPage, shore, SY, TAGS, tagLayout, ROWS } from './scenes1.js';
import { TRI, PASTEL, VAR, cutGlyph, confetti, butterfly, swarm, house, GY, jump, crouch, termWin, check, GREENS, worldBack, drawObj } from './scenes2.js';
import { PX, PY, PW, PH, pagePath, pageFace, shelf, petal } from './scenes3.js';

const INK = '#3A322E';
export const SEA = ['#8DBBEE', '#6FA5E6', '#5A90DC', '#4A7FD0', '#3B6FC4', '#2F5DB4', '#2D4FA3'];
// paper-cut waves between y0 (far) and y1 (near)
export function waveBands(ctx, t, y0, y1, n, o = {}) {
  for (let k = 0; k < n; k++) {
    const u = n > 1 ? k / (n - 1) : 0, y = y0 + Math.pow(u, o.pow ?? 1.5) * (y1 - y0), amp = (o.amp ?? 6) + k * (o.grow ?? 5), wl = 56 + k * 26;
    const yy = x => y + Math.sin(x / wl + t * (1.6 + k * 0.2) + k * 2) * amp;
    cut(ctx, () => { ctx.beginPath(); ctx.moveTo(-300, H + 300); for (let x = -300; x <= W + 300; x += 16) ctx.lineTo(x, yy(x)); ctx.lineTo(W + 300, H + 300); ctx.closePath(); }, SEA[Math.min(6, k + (o.c0 ?? 0))], 0.14, 14, -4);
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2 + k * 0.5; ctx.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      const x = ((i * 257 + k * 131 + t * (20 + k * 8)) % (W + 300)) - 150, a = 0.5 + 0.5 * Math.sin(t * 3 + i * 2 + k);
      ctx.globalAlpha *= a; ctx.beginPath(); ctx.moveTo(x, yy(x) + 16 + k * 3); ctx.lineTo(x + 30 + k * 8, yy(x) + 16 + k * 3); ctx.stroke(); ctx.globalAlpha /= a;
    }
  }
}
export function windStreaks(ctx, t, n, a = 0.8, seed = 611) {
  for (let i = 0; i < n; i++) {
    const ph = ((t * (0.9 + rnd(i, seed) * 0.6) + rnd(i, seed + 1)) % 1), y = 60 + rnd(i, seed + 2) * 760, x = -600 + ph * (W + 1100), len = 260 + rnd(i, seed + 3) * 320;
    ctx.strokeStyle = rgba(COL.white, a * Math.sin(ph * Math.PI)); ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + len / 2, y - 18, x + len, y + 6); ctx.stroke();
  }
}
export function sparkle(ctx, t, t0, x, y, color = COL.orange, n = 8, r0 = 40, r1 = 110) {
  const p = sat(t, t0, t0 + 0.4); if (p <= 0 || p >= 1) return;
  ctx.strokeStyle = rgba(color, 1 - p); ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const an = (i / n) * TAU + 0.3, a = r0 + (r1 - r0) * E.out(p); ctx.beginPath(); ctx.moveTo(x + Math.cos(an) * a, y + Math.sin(an) * a); ctx.lineTo(x + Math.cos(an) * (a + 26 * (1 - p)), y + Math.sin(an) * (a + 26 * (1 - p))); ctx.stroke(); }
}
export function tick(ctx, x, y, r, p, color = COL.orange) {
  if (p <= 0) return;
  const k = E.back(clamp(p));
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  cut(ctx, () => { ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); }, color, 0.25, 12, 4);
  ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.strokeStyle = COL.white; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(-r * 0.42, 0.02 * r); ctx.lineTo(-r * 0.1, r * 0.34); ctx.lineTo(r * 0.46, -r * 0.3); ctx.stroke();
  ctx.restore();
}
export const soloPal = fn => { const was = VAR.solo; VAR.solo = true; try { fn(); } finally { VAR.solo = was; } };

// ------------------------------------------------------------------ 1:10.6–1:13.2  世界还在写 (the second time, alone)
// The words stand in the sky as big as hills. A moment later the wind will take them.
const TS = [70.88, 71.42, 71.87, 72.1, 72.42], TITLE = '世界还在写';
const TGX = i => 600 + i * 250, TGY = 330, TGS = 212, HER = { x: 290, s: 470 };
function openLand(ctx, t, tilt = 0) {
  const g = ctx.createLinearGradient(0, -400, 0, H); g.addColorStop(0, '#FCE3B4'); g.addColorStop(0.45, '#FFF3DC'); g.addColorStop(1, '#FDE0B8');
  ctx.fillStyle = g; ctx.fillRect(-300, -700, W + 600, H + 1000);
  const gs = ctx.createRadialGradient(1640, 190, 20, 1640, 190, 520); gs.addColorStop(0, 'rgba(255,214,150,0.9)'); gs.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = gs; ctx.fillRect(-300, -700, W + 600, H + 1000);
  ctx.fillStyle = '#FFE1A8'; ctx.beginPath(); ctx.arc(1640, 190, 104, 0, TAU); ctx.fill();
  cut(ctx, () => hillPath(ctx, 640, 150, 520, 0.4, 900), '#FAD9B2', 0.14);
  cut(ctx, () => hillPath(ctx, 750, 140, 380, 2.1, 1300), '#F6BD86', 0.18);
  cut(ctx, () => hillPath(ctx, 846, 90, 300, 4.0, 1700), '#F0A260', 0.2);
  ctx.fillStyle = '#FBE8CB'; ctx.fillRect(-300, GY - 4, W + 600, 500);
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
  for (let i = 0; i < 10; i++) miniPage(ctx, 150 + i * 190, GY + 46 + (i % 2) * 14, 150, 56, (i % 2 ? 0.05 : -0.04));
  for (let i = 0; i < 4; i++) {            // a few of the flowers she left on the way
    const fx = 760 + i * 300, sw = Math.sin(t * 2.2 + i) * 5;
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, GY); ctx.lineTo(fx + sw, GY - 62); ctx.stroke();
    flower(ctx, fx + sw, GY - 62, 24, t * 0.6 + i, i % 2 ? COL.yellow : COL.orange);
  }
}
export function sTitleSolo(ctx, t) {
  const whip = (1 - E.out(sat(t, 70.61, 70.82))) * 2700, wind = sat(t, 72.6, 73.19);
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.03 + 0.03 * sat(t, 70.61, 73.19) + 0.035 * hit(t, 70.88, 6), cx: 960, cy: 620, x: whip, seed: 31, hand: 4 }, () => {
    openLand(ctx, t);
    for (let i = 0; i < 5; i++) {
      if (t < TS[i] - 0.14) continue;
      const p = sat(t, TS[i] - 0.14, TS[i] + 0.12), land = E.back(p), y = TGY - (1 - land) * 420 + Math.sin(t * 2 + i) * 7;
      const sqz = 1 + 0.1 * hit(t, TS[i], 12);
      ctx.fillStyle = rgba('#3A2A1A', 0.1 * p); ctx.beginPath(); ctx.ellipse(TGX(i), GY - 14, 96 * p, 11 * p, 0, 0, TAU); ctx.fill();       // its shadow on the ground
      cutGlyph(ctx, TITLE[i], TGX(i) + wind * Math.sin(t * 23 + i * 2) * 5, y, TGS, COL.orange, { s: sqz, rot: (i - 2) * 0.025 + wind * Math.sin(t * 17 + i) * 0.035 });
      sparkle(ctx, t, TS[i], TGX(i), TGY + 40, COL.yellow, 7, 120, 170);
    }
    caret(ctx, TGX(4) + 148, TGY, 200, t, COL.orange, 12, t > 72.42 && t < 72.9);
    if (wind > 0) windStreaks(ctx, t, 12, 0.8 * wind);
    const b = breathe(t), joy = t >= 72.42, s = sq(t, joy ? 72.42 : 70.88, 1.3);
    char(ctx, joy ? 'o29' : 'o28', HER.x, GY + 24, HER.s, { sx: b.sx * s.sx, sy: b.sy * s.sy, windX: 12 * wind, flutter: 4 * wind, lift: joy ? hopOn(t, 0, 14) : 0 });
  });
  bokeh(ctx, t, { n: 9, seed: 131, alpha: 0.14, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
}
// 1:14.9–1:16.9  风一吹 字就飞成了蝴蝶 — the same hill, and the words she has just seen take off
export function sWindSolo(ctx, t) {
  const T0 = 74.93, tilt = 190 * E.io(sat(t, T0 + 0.2, 76.9));
  ctx.fillStyle = '#FCE3B4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.03 + 0.03, cx: 960, cy: 620, y: tilt, seed: 31, hand: 4 }, () => {
    openLand(ctx, t);
    windStreaks(ctx, t, 16, 0.8);
    soloPal(() => swarm(ctx, t, T0 + 0.1, 70, { x0: 420, w: 1350, y0: TGY + 150, h: 300, size: 42, spread: 1.3, vx: 300, vy: 250 }));
    const PALS = [COL.orange, COL.yellow, COL.orangeD, COL.orange, COL.yellow];
    for (let i = 0; i < 5; i++) {                 // the five big ones: each flaps twice as a character, then it is a butterfly
      const dt = t - T0 - i * 0.07; if (dt < -0.5) continue;
      const u = Math.max(0, dt), x = TGX(i) + 70 * u + 150 * u * u + Math.sin(u * 3 + i) * 40, y = TGY - 60 * u - 150 * u * u - Math.sin(u * 4 + i * 2) * 26;
      butterfly(ctx, TITLE[i], x, y, TGS * (1 - 0.3 * sat(u, 0, 1.2)), PALS[i], dt > 0 ? t * 13 + i * 1.3 : 0, 0.5 * sat(u, 0, 0.6) + Math.sin(u * 2 + i) * 0.2 * sat(u, 0, 0.5), 1, sat(u, 0.22, 0.7));
    }
    // she holds out a finger, and one of them takes her up on it
    const tip = [HER.x + 385 * (450 / 1137), GY + 26 - 915 * (450 / 1137)];
    const b = breathe(t), s = sq(t, T0, 1.2), la = sat(t, 75.35, 76.0);
    char(ctx, 'o08', HER.x, GY + 26, 450, { sx: b.sx * s.sx, sy: b.sy * s.sy, windX: 14, flutter: 4 });
    butterfly(ctx, '字', lerp(980, tip[0] + 4, E.out(la)), lerp(300, tip[1] - 26, E.out(la)) + Math.sin(t * 3) * 5 * (1 - la), 60, COL.orange, t * (14 - 9 * la), 0.2, sat(t, 75.2, 75.45), 1);
  });
  finish(ctx, { light: 0.8 });
}

// one sprite for the ?sheet= line-up, scaled so that its head is always the same size on screen
export function sheetChar(ctx, id, x, y, box) {
  const m = manifest()[id]; if (!m) return;
  const k = (box * 1.9) / 1137;                       // big: the point is to look at faces
  const hx = (m.head[0] - (m.feetXo ?? m.feetX)) * k * (m.scale ?? 1), hy = (m.head[1] - m.feetY) * k * (m.scale ?? 1);
  char(ctx, id, x - hx, y - box * 0.5 - hy, box * 1.9, { shadow: false });
  text(ctx, id, x, y - 4, { size: 22, weight: 700, color: COL.inkSoft });
}
// where a point of a sprite (in its own pixels) ends up on screen
const REFH = { o: 1137, k: 1140, f: 939 };
export function anchor(id, x, feetY, size, px, py) {
  const M = manifest(), m = M[id] ?? M[id[0] + '00'], k = (size / REFH[id[0]]) * (m.scale ?? 1);
  return [x + (px - (m.feetXo ?? m.feetX)) * k, feetY + (py - m.feetY) * k];
}
export const headAt = (id, x, feetY, size) => { const M = manifest(), m = M[id] ?? M[id[0] + '00']; return anchor(id, x, feetY, size, m.head[0], m.head[1]); };
// sprite points measured on the keyed images: fingertips and pencil points
export const PT = { o23: [1005, 265], o27: [948, 1020], o34: [1184, 521], o40: [182, 12], o44: [257, 12], o48: [1112, 33], k18: [972, 84], k19: [85, 24], f15: [87, 24], f16: [249, 36] };

// ------------------------------------------------------------------ 1:16.4–1:20  把读过的星 走成远方 (she is alone)
// Night. Every star she has read about is still only the word, hung where a star would be. Walking under them turns
// them on, left to right; the big one she reaches for herself; then five of them line up and point the way.
function scatter(n, tries, make, apart) {        // n things placed at random, none nearer another than apart(a, b)
  const out = [];
  for (let i = 0; i < tries && out.length < n; i++) { const c = make(i); if (out.every(o => Math.hypot(o.x - c.x, o.y - c.y) > apart(o, c))) out.push(c); }
  return out;
}
const SG = scatter(64, 600, i => ({ x: rnd(i, 961) * 2500 - 150, y: 56 + rnd(i, 962) * 540, s: 34 + rnd(i, 963) * 40, r: (rnd(i, 964) - 0.5) * 0.5 }), (a, b) => (a.s + b.s) * 0.75 + 34);
const SPATH = [[0, 0, 77.69], [250, -64, 78.28], [500, 16, 78.64], [730, 160, 78.95], [950, 330, 79.25]];
const NIGHT = ['#1E2148', '#4A3E7C', '#F0A56A'], STARC = '#FFE9B8';
export function sStarsSolo(ctx, t) {
  const R0 = 77.36, R1 = 78.2, HXs = 540, HSs = 470, cx0 = 150 * (Math.min(t, R0) - 76.4), camX = cx0 + (t > R1 ? 210 * (t - R1) + 160 * (t - R1) * (t - R1) : 0);
  const tip = anchor('o23', HXs, GY + 24, HSs, PT.o23[0], PT.o23[1]), sky = 0.25 * (camX - 150 * (R0 - 76.4));
  const P = SPATH.map(([dx, dy, T]) => [tip[0] + 30 + dx - sky, tip[1] - 74 + dy, T]);
  cam(ctx, t, { z: 1.03 + 0.03 * sat(t, 76.4, 79.95) + 0.025 * hit(t, 77.69, 6), cx: 900, cy: 620, seed: 46 }, () => {
    const g = ctx.createLinearGradient(0, -100, 0, GY + 20); g.addColorStop(0, NIGHT[0]); g.addColorStop(0.62, NIGHT[1]); g.addColorStop(1, NIGHT[2]);
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, GY + 320);
    for (let i = 0; i < 90; i++) { const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7); ctx.fillStyle = rgba('#FFF3DC', 0.25 + 0.35 * tw); ctx.beginPath(); ctx.arc(((rnd(i, 965) * 2300 - camX * 0.12) % 2300 + 2300) % 2300 - 190, rnd(i, 966) * 640, 1.2 + rnd(i, 967) * 2, 0, TAU); ctx.fill(); }
    // the stars she has read
    SG.forEach((s, i) => {
      const sx = s.x - camX * 0.25; if (sx < -80 || sx > W + 80) return;
      if (P.some(q => Math.hypot(q[0] - sx, q[1] - s.y) < 120) || (Math.abs(sx - HXs) < 250 && s.y > 330)) return;       // room for the ones that matter, and for her
      const Tc = 76.56 + 1.28 * clamp(s.x / 1900, 0, 1.3), p = sat(t, Tc, Tc + 0.26), tw = 0.75 + 0.25 * Math.sin(t * 4 + i * 2.1);
      if (p < 1) drawGlyph(ctx, '星', sx, s.y + Math.sin(t * 1.4 + i) * 3, s.s * (1 - 0.5 * p), { weight: 700, color: '#FFF3DC', alpha: (0.5 + 0.12 * Math.sin(t * 2 + i)) * (1 - p), rot: s.r + p * 1.2 });
      if (p > 0) { star4(ctx, sx, s.y, s.s * 0.42 * E.back(p) * tw, STARC, 1); sparkle(ctx, t, Tc, sx, s.y, STARC, 6, s.s * 0.5, s.s * 1.3); }
    });
    const gl = ctx.createRadialGradient(1760 - camX * 0.1, GY, 20, 1760 - camX * 0.1, GY, 760); gl.addColorStop(0, 'rgba(255,190,120,0.6)'); gl.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
    cut(ctx, () => hillPath(ctx, GY + 20, 150, 560, 0.6, camX * 0.35), '#3B3266', 0.25, 30, -8);
    cut(ctx, () => hillPath(ctx, GY + 30, 90, 330, 2.4, camX * 0.6), '#30284F', 0.25, 30, -8);
    ctx.fillStyle = '#2B2440'; ctx.fillRect(-300, GY - 4, W + 600, 500);
    ctx.save(); ctx.filter = 'brightness(0.74) saturate(0.85)'; roadPages(ctx, camX); ctx.restore();
    ctx.strokeStyle = '#161225'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
    // the line they make, a syllable a star
    for (let j = 1; j < P.length; j++) {
      const p = sat(t, P[j][2] - 0.22, P[j][2]); if (p <= 0) continue;
      ctx.strokeStyle = rgba('#FFF3DC', 0.7); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(P[j - 1][0], P[j - 1][1]); ctx.lineTo(lerp(P[j - 1][0], P[j][0], p), lerp(P[j - 1][1], P[j][1], p)); ctx.stroke();
    }
    P.forEach(([x, y, T], j) => {
      const p = sat(t, T, T + 0.3), big = j === 0, tw = 1 + 0.12 * Math.sin(t * 5 + j);
      if (p < 1 && (big || t > T - 1.2)) drawGlyph(ctx, '星', x, y + Math.sin(t * 1.6 + j) * 4, (big ? 112 : 54) * (1 - 0.5 * p), { weight: 800, color: '#FFF3DC', alpha: (big ? 0.9 : 0.6 * sat(t, T - 1.2, T - 0.8)) * (1 - p), rot: p * 1.4 });
      if (p > 0) {
        const r = (big ? 54 : 30) * E.back(p) * tw;
        const gg = ctx.createRadialGradient(x, y, 0, x, y, r * 4.5); gg.addColorStop(0, rgba(STARC, 0.5 * p)); gg.addColorStop(1, rgba(STARC, 0)); ctx.fillStyle = gg; ctx.fillRect(x - r * 5, y - r * 5, r * 10, r * 10);
        star4(ctx, x, y, r, STARC, 1); sparkle(ctx, t, T, x, y, STARC, big ? 12 : 8, big ? 70 : 40, big ? 190 : 110);
      }
    });
    const rp = sat(t, 77.69, 78.4); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba('#FFF3DC', 0.6 * (1 - rp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(P[0][0], P[0][1], 60 + 520 * E.out(rp), 0, TAU); ctx.stroke(); }
    // 橙子: walking, then on tiptoe for that one, then on
    ctx.save(); ctx.filter = 'brightness(0.86) saturate(0.95)';
    if (t >= R0 && t < R1) { const s = sq(t, R0, 1.4), up = 16 * E.out(sat(t, R0, 77.69)) + 10 * hit(t, 77.69, 8); char(ctx, 'o23', HXs, GY + 24, HSs, { sx: s.sx, sy: s.sy, lift: up, windX: -6, flutter: 2, shadowColor: '#000000' }); }
    else { const wb = walkBob(t); char(ctx, walkId('o', t), HXs, GY + 24, HSs, { lift: wb.lift, rot: wb.rot, windX: -6, flutter: 2, shadowColor: '#000000' }); }
    ctx.restore();
  });
  bokeh(ctx, t, { n: 10, seed: 171, colors: [STARC, COL.orange], alpha: 0.12, blend: 'screen' });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ 1:20–1:21.6  下一页: her first flower (she is alone)
// A meadow of the word 花. She crouches by the nearest one; on 页 it is a flower, and the rest follow, outwards.
const FLW = scatter(90, 900, i => { const d = 0.08 + rnd(i, 971) * 0.92; return { x: 30 + rnd(i, 972) * 1860, y: 700 + d * 350, d, c: i % 3 }; }, (a, b) => 58 * (0.34 + 0.9 * a.d + 0.34 + 0.9 * b.d) * 0.62 + 16).sort((a, b) => a.y - b.y);
function bloom(ctx, x, y, sc, k, t, i, col) {
  if (k <= 0) return;
  const h = 96 * sc * k, sw = Math.sin(t * 2.3 + i) * 6 * sc;
  ctx.strokeStyle = COL.ink; ctx.lineWidth = Math.max(2, 4.5 * sc); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + sw * 0.4, y - h * 0.5, x + sw, y - h); ctx.stroke();
  flower(ctx, x + sw, y - h, 34 * sc * k, t * 0.5 + i, col);
}
export function sFlowerSolo(ctx, t) {
  const POP = 80.78, WOB = 80.5, FX0 = 1040, FY0 = 862, HX2 = 650, HY2 = 912, HS2 = 660;
  cam(ctx, t, { z: 1.08 - 0.06 * E.out(sat(t, POP, 81.7)) + 0.03 * hit(t, POP, 7), cx: 900, cy: 760, seed: 45 }, () => {
    const g = ctx.createLinearGradient(0, -100, 0, 760); g.addColorStop(0, '#FFEFD2'); g.addColorStop(0.7, '#FFDFAE'); g.addColorStop(1, '#FDC98A');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, 1100);
    rays(ctx, 1520, 300, t * 0.5, 0.26, '#FFE9BF', 16);
    ctx.fillStyle = '#FFF4D6'; ctx.beginPath(); ctx.arc(1520, 300, 150 + 8 * pulse(t, 5), 0, TAU); ctx.fill();
    cut(ctx, () => hillPath(ctx, 640, 120, 520, 1.3, 200), '#FBD9A6', 0.14);
    cut(ctx, () => hillPath(ctx, 720, 90, 380, 3.2, 600), '#F8CB8C', 0.16);
    cut(ctx, () => hillPath(ctx, 760, 46, 700, 0.4, 0), '#F6D49E', 0.18);
    ctx.fillStyle = '#F6D49E'; ctx.fillRect(-300, 790, W + 600, 600);
    const one = (f, i) => {
      if (Math.abs(f.x - FX0) < 170 && Math.abs(f.y - FY0) < 130) return;
      if (Math.abs(f.x - HX2 - 30) < 340 && f.y > HY2 - 470 && f.y < HY2 + 150) return;               // never across her
      if (f.y > 925 && Math.abs(f.x - 960) < 250) return;                                              // nor under the subtitle
      const sc = 0.34 + 0.9 * f.d, Tp = POP + 0.05 + Math.hypot(f.x - FX0, (f.y - FY0) * 2.4) / 2500, p = sat(t, Tp, Tp + 0.3);
      if (p < 1) drawGlyph(ctx, '花', f.x, f.y - 34 * sc, 76 * sc * (1 - 0.4 * p), { weight: 800, color: COL.ink, alpha: 0.42 * (1 - p), rot: p * 0.8 });
      bloom(ctx, f.x, f.y, sc, E.back(p), t, i, [COL.orange, COL.yellow, COL.orangeD][f.c]);
    };
    FLW.forEach((f, i) => { if (f.y < HY2) one(f, i); });
    // the first one
    const wob = t >= WOB && t < POP ? Math.sin((t - WOB) * 34) * 0.13 * sat(t, WOB, WOB + 0.1) : 0, p0 = sat(t, POP, POP + 0.34);
    ctx.fillStyle = 'rgba(60,40,20,0.13)'; ctx.beginPath(); ctx.ellipse(FX0, FY0 + 4, 74, 11, 0, 0, TAU); ctx.fill();
    if (p0 < 1) { ctx.save(); ctx.translate(FX0, FY0); ctx.rotate(wob); ctx.scale(1 + 0.12 * Math.abs(wob) * 6, 1 - 0.1 * Math.abs(wob) * 6); drawGlyph(ctx, '花', 0, -86 * (1 - p0), 168 * (1 - 0.5 * p0), { weight: 800, color: COL.ink, alpha: 1 - p0 }); ctx.restore(); }
    bloom(ctx, FX0, FY0, 2.3, E.back(p0), t, 99, COL.orange);
    sparkle(ctx, t, POP, FX0, FY0 - 200, COL.yellow, 12, 90, 230);
    const rp = sat(t, POP, POP + 0.7); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.white, 0.8 * (1 - rp)); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(FX0, FY0, 80 + 900 * E.out(rp), (80 + 900 * E.out(rp)) * 0.3, 0, 0, TAU); ctx.stroke(); }
    // 橙子, down at its level
    const s = sq(t, POP, 2), b = breathe(t, 1.3), lean = -0.03 * sat(t, WOB, POP) + 0.05 * hit(t, POP, 5);
    char(ctx, 'o24', HX2, HY2, HS2, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: lean, lift: 26 * Math.abs(Math.sin(sat(t, POP + 0.02, POP + 0.4) * Math.PI)) });
    FLW.forEach((f, i) => { if (f.y >= HY2) one(f, i); });
    for (let i = 0; i < 26; i++) {                  // petals off the first one
      const dt = t - POP - rnd(i, 981) * 0.18; if (dt <= 0 || dt > 1.4) continue;
      const an = -Math.PI * (0.08 + 0.84 * rnd(i, 982)), v = 260 + rnd(i, 983) * 520, d = 1 - Math.exp(-dt * 2.6);
      petal(ctx, FX0 + Math.cos(an) * v * d + 90 * dt, FY0 - 220 + Math.sin(an) * v * d * 0.8 + 150 * dt * dt, 9 + rnd(i, 984) * 9, an + dt * (3 + rnd(i, 985) * 5), Math.cos(dt * 9 + i), i % 3 ? COL.orange : COL.yellow, 1 - sat(dt, 0.8, 1.4));
    }
    const la = sat(t, 81.0, 81.5);                  // and someone has already found it
    if (la > 0) butterfly(ctx, '花', lerp(1500, FX0 + 6, E.out(la)) + Math.sin(t * 5) * 10 * (1 - la), lerp(360, FY0 - 2.3 * 96 - 70, E.out(la)) + Math.cos(t * 6) * 12 * (1 - la), 58, COL.yellow, t * (15 - 9 * la), 0.2, Math.min(1, la * 4), 1);
  });
  bokeh(ctx, t, { n: 10, seed: 172, alpha: 0.16, colors: [COL.white, COL.yellow, COL.peach] });
  finish(ctx, { light: 0.8 });
}

// ------------------------------------------------------------------ 1:21.6–1:23.8  下一页: the sea she had only read is blue
// The same shore as the first verse, the same sea made of the word, the same ten thousand ways of saying blue. Then the
// colour arrives, from the horizon inwards, and it is the first blue in the film.
const BLUES = ['#2D4FA3', '#3B6FC4', '#4A7FD0', '#5A90DC', '#3F6FD0', '#2F5DB4', '#58A6E8', '#4A7FD0', '#3B6FC4', '#6FA5E6', '#2D4FA3', '#3F6FD0'];
export function sShore(ctx, t) {
  const p = E.io(sat(t, 82.0, 83.45)), yb = lerp(585, 1130, p);       // the edge of the colour
  const edge = x => yb + Math.sin(x * 0.011 + t * 2.2) * 16 + Math.sin(x * 0.034 - t * 3) * 7;
  cam(ctx, t, { z: 1.02 + 0.035 * sat(t, 81.6, 84.2), cx: 1100, cy: 560, seed: 32 }, () => {
    paper(ctx);
    const sky = ctx.createLinearGradient(0, 0, 0, 606); sky.addColorStop(0, rgba('#DCEEFC', 0.9 * p)); sky.addColorStop(1, rgba('#B5D6F6', 0.9 * p));
    ctx.fillStyle = sky; ctx.fillRect(-300, -300, W + 600, 906);
    const L = tagLayout(ctx);
    for (let i = 0; i < TAGS.length; i++) {        // ten thousand people's blues, each getting its colour
      const k = sat(p * 1.5 - i * 0.04, 0, 0.3), w = measure(ctx, TAGS[i], 40, 500, undefined, 3), pop = 1 + 0.12 * Math.sin(Math.PI * k);
      ctx.save(); ctx.translate(L[i][0] - 60, L[i][1]); ctx.scale(pop, pop);
      text(ctx, TAGS[i], 0, 0, { size: 40, weight: 500 + 200 * k, color: mix(COL.inkSoft, BLUES[i], k), alpha: 0.82 + 0.18 * k, ls: 3 });
      ctx.fillStyle = rgba(mix(COL.orange, BLUES[i], k), 0.6); ctx.fillRect(-w / 2, 34, w, 2.5);
      ctx.restore();
    }
    ctx.strokeStyle = rgba(COL.ink, 0.5 * (1 - sat(p, 0, 0.25))); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(660, 606); ctx.lineTo(W + 300, 606); ctx.stroke();      // the drawn horizon goes when the real one arrives
    // below the edge: still the word
    ctx.save(); ctx.beginPath(); ctx.moveTo(-300, H + 300); for (let x = -300; x <= W + 300; x += 24) ctx.lineTo(x, edge(x)); ctx.lineTo(W + 300, H + 300); ctx.closePath(); ctx.clip();
    for (const [y0, size, r] of ROWS) {
      const step = size * 1.3, n = Math.ceil(W / step) + 4, far = 1 - r / 5, col = mix(COL.ink, COL.paper, far * 0.62);
      const x0 = -step * 2 + ((r * 53) % step) + Math.sin(t * 0.8 + r * 0.9) * size * 0.45 + t * (4 + r * 3);
      for (let c = 0; c < n; c++) {
        const x = ((x0 + c * step) % (n * step) + n * step) % (n * step) - step * 2, wv = Math.sin(t * 2.0 + x * 0.006 + r * 1.3);
        drawGlyph(ctx, '海', x, y0 + wv * size * 0.16, size, { weight: 800, rot: wv * 0.07, color: col });
      }
    }
    ctx.restore();
    // above it: water
    ctx.save(); ctx.beginPath(); ctx.moveTo(-300, 590); ctx.lineTo(W + 300, 590); for (let x = W + 300; x >= -300; x -= 24) ctx.lineTo(x, Math.max(590, edge(x))); ctx.closePath(); ctx.clip();
    ctx.fillStyle = SEA[0]; ctx.fillRect(-300, 590, W + 600, 70);
    waveBands(ctx, t, 612, 1090, 8);
    ctx.restore();
    if (p > 0 && p < 1) {                           // the edge itself: foam
      ctx.strokeStyle = COL.white; ctx.lineWidth = 12; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let x = -300; x <= W + 300; x += 24) ctx.lineTo(x, edge(x)); ctx.stroke();
      for (let i = 0; i < 22; i++) { const x = rnd(i, 801) * W, ph = (t * 2 + rnd(i, 802)) % 1; ctx.fillStyle = rgba(COL.white, 1 - ph); ctx.beginPath(); ctx.arc(x, edge(x) - 10 - ph * 40, 6 * (1 - ph) + 2, 0, TAU); ctx.fill(); }
    }
    for (let i = 0; i < 3; i++) {                   // gulls, once there is a sky for them
      const bx = 1180 + i * 150 + Math.sin(t * 0.8 + i) * 30, by = 470 + i * 34 + Math.cos(t * 1.1 + i) * 12, fl = Math.sin(t * 7 + i) * 10;
      ctx.strokeStyle = rgba(COL.ink, p); ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 26, by - fl); ctx.quadraticCurveTo(bx - 10, by - 10, bx, by); ctx.quadraticCurveTo(bx + 10, by - 10, bx + 26, by - fl); ctx.stroke();
    }
    shore(ctx);
    const b = breathe(t), awe = t >= 82.5, s = sq(t, awe ? 82.5 : 81.63, 1.5), s2 = sq(t, 83.3, 1.2);
    char(ctx, awe ? 'o25' : 'o32', 330, SY, 600, { sx: b.sx * s.sx * s2.sx, sy: b.sy * s.sy * s2.sy, rot: b.rot, windX: -6 * p, flutter: 3 * p, lift: 26 * Math.abs(Math.sin(sat(t, 83.3, 83.7) * Math.PI)) });
  });
  bokeh(ctx, t, { n: 8, seed: 150, alpha: 0.11, colors: [COL.white, COL.peach] });
  finish(ctx);
}

// ------------------------------------------------------------------ 1:24.3–1:27  下一页: and this time it reaches her shoes
export function seaSky(ctx, t, yh) {
  paper(ctx);
  const sky = ctx.createLinearGradient(0, 0, 0, yh); sky.addColorStop(0, '#DCEEFC'); sky.addColorStop(1, '#B5D6F6');
  ctx.fillStyle = sky; ctx.fillRect(-300, -300, W + 600, yh + 300);
  ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(1560, 170, 76, 0, TAU); ctx.fill();
  for (let i = 0; i < 3; i++) { const cx = 240 + i * 620 + Math.sin(t * 0.3 + i) * 20, cy = 130 + (i % 2) * 90; cut(ctx, () => { ctx.beginPath(); ctx.arc(cx - 60, cy, 40, 0, TAU); ctx.arc(cx, cy - 24, 56, 0, TAU); ctx.arc(cx + 70, cy, 44, 0, TAU); ctx.rect(cx - 60, cy, 130, 40); }, COL.white, 0.12, 20, 8); }
}
export function beach(ctx, t, yh, ys) {            // sky, water from the horizon yh down to the sand at ys
  seaSky(ctx, t, yh);
  ctx.fillStyle = SEA[0]; ctx.fillRect(-300, yh, W + 600, 60);          // water right up to the sky: no paper showing between the two
  waveBands(ctx, t, yh + 8, ys + 20, 6, { pow: 1.3 });
  cut(ctx, () => { ctx.beginPath(); ctx.moveTo(-300, H + 300); for (let x = -300; x <= W + 300; x += 30) ctx.lineTo(x, ys + Math.sin(x * 0.004 + 1) * 10); ctx.lineTo(W + 300, H + 300); ctx.closePath(); }, '#F3E4C6', 0.2, 18, -5);
  for (let i = 0; i < 90; i++) { ctx.fillStyle = rgba('#B99A68', 0.25 + rnd(i, 811) * 0.3); ctx.fillRect(rnd(i, 812) * W, ys + 24 + rnd(i, 813) * (H - ys), 3 + rnd(i, 814) * 3, 3); }
}
// a sheet of water sliding up the sand to yf and back
export function swash(ctx, t, yf, a = 0.8, ytop = 700) {
  const f = x => yf + Math.sin(x * 0.007 + t * 1.3) * 14 + Math.sin(x * 0.021 - t * 2) * 6;
  ctx.fillStyle = rgba('#8DBBEE', 0.62 * a); ctx.beginPath(); ctx.moveTo(-300, ytop); ctx.lineTo(W + 300, ytop);
  for (let x = W + 300; x >= -300; x -= 24) ctx.lineTo(x, f(x)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(COL.white, a); ctx.lineWidth = 10; ctx.lineJoin = 'round'; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 24) ctx.lineTo(x, f(x)); ctx.stroke();
}
export function sWet(ctx, t) {
  const HIT = 85.25, gy = 900, hx = 700, hs = 760;
  const up = E.io(sat(t, 84.45, HIT)), back = E.io(sat(t, HIT + 0.25, 86.4)), yf = lerp(lerp(760, 968, up), 928, back) + Math.sin(t * 2.6) * 8 * back;
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 84.28, 85.0)) + 0.04 * hit(t, HIT, 6) + 0.02 * sat(t, 84.28, 86.96), cx: 760, cy: 760, seed: 33 }, () => {
    beach(ctx, t, 560, 742);
    swash(ctx, t, Math.min(yf, gy - 46), 0.85, 740);        // behind her: the sheet of water on the sand
    const wet = t >= HIT, joy = t >= 86.15, pose = joy ? 'o27' : wet ? 'o26' : 'o03';
    const b = breathe(t, 1.4), s = sq(t, joy ? 86.15 : wet ? HIT : 84.28, 1.5), hop = wet ? Math.abs(Math.sin(sat(t, HIT, HIT + 0.42) * Math.PI)) * 70 : 0;
    char(ctx, pose, hx, gy, hs, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot, lift: hop });
    if (yf > gy - 46) swash(ctx, t, yf, 0.85, gy - 46);     // in front of her: only as high as her boots
    const sp = sat(t, HIT, HIT + 0.6);
    if (sp > 0 && sp < 1) for (let i = 0; i < 18; i++) {          // it splashes over both boots
      const an = -Math.PI * (0.1 + 0.8 * (i / 17)), v = 170 + rnd(i, 821) * 220, x = hx - 20 + (i % 2 ? 90 : -40) + Math.cos(an) * v * sp, y = gy - 20 + Math.sin(an) * v * sp + 330 * sp * sp;
      ctx.fillStyle = i % 3 ? COL.white : '#BBDAF7'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.globalAlpha = 1 - sp * sp;
      ctx.beginPath(); ctx.arc(x, y, 7 + rnd(i, 822) * 10, 0, TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    }
    if (joy) {                                         // she puts a finger in it
      const f = anchor('o27', hx, gy, hs, PT.o27[0], PT.o27[1]);
      for (const T of [86.3, 86.62]) { const rp = sat(t, T, T + 0.6); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.white, 0.9 * (1 - rp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(f[0], f[1] + 8, 14 + 90 * E.out(rp), 4 + 22 * E.out(rp), 0, 0, TAU); ctx.stroke(); } }
    }
    const ea = sat(t, HIT + 0.02, HIT + 0.18) * (1 - sat(t, 86.0, 86.3));
    if (ea > 0) { const k = 0.5 + 0.5 * E.back(sat(t, HIT + 0.02, HIT + 0.28)); drawGlyph(ctx, '！', 990, 250, 130, { weight: 900, color: COL.orange, alpha: ea, rot: 0.18, sx: k, sy: k }); }
  });
  bokeh(ctx, t, { n: 7, seed: 151, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 1:27–1:30.5  原来海是咸的 这个我读过
// She tastes it. Then the line she once read about it comes up out of the book, and gets a tick.
export function sSalty(ctx, t) {
  const TASTE = 87.4, KNOW = 89.31, hx = 700, gy = 900, hs = 760, lineX = 1120, lineY = 380;
  const yf = lerp(928, 800, E.io(sat(t, 87.5, 88.9))) + Math.sin(t * 2.6) * 8;
  cam(ctx, t, { z: 1.04 + 0.04 * hit(t, TASTE, 7) + 0.03 * E.io(sat(t, 87.4, 90.5)), cx: 760, cy: 760, seed: 33 }, () => {
    beach(ctx, t, 560, 742);
    swash(ctx, t, Math.min(yf, gy - 46), 0.85, 740);
    const d = sat(t, 86.98, TASTE), f0 = anchor('o27', hx, gy, hs, PT.o27[0], PT.o27[1]), m0 = headAt('o27', hx, gy, hs);                    // one drop, from her fingertip to the tip of her tongue
    if (d > 0 && d < 1) { const x = lerp(f0[0], m0[0] + 10, d), y = lerp(f0[1], m0[1] + 0.07 * hs, d) - Math.sin(d * Math.PI) * 150; ctx.fillStyle = '#8DBBEE'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke(); }
    const pose = t < TASTE ? 'o27' : t < KNOW ? 'o21' : 'o30';
    const b = breathe(t, 1.2), s = sq(t, t < TASTE ? 86.96 : t < KNOW ? TASTE : KNOW, 1.6), shiver = t >= TASTE && t < KNOW ? Math.sin(t * 46) * 5 * hit(t, TASTE, 2.2) : 0;
    char(ctx, pose, hx + shiver, gy, hs, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot });
    if (yf > gy - 46) swash(ctx, t, yf, 0.85, gy - 46);
    sparkle(ctx, t, TASTE, hx + 10, gy - 0.66 * hs, '#5A90DC', 9, 150, 230);
    // the line from the book
    const str = '海水是咸的。', la = sat(t, KNOW, KNOW + 0.3);
    if (la > 0) {
      const full = measure(ctx, str, 76, 600, undefined, 6), n = Math.min(str.length, 1 + Math.floor(sat(t, KNOW, KNOW + 0.62) * str.length)), up = (1 - E.out(sat(t, KNOW, KNOW + 0.5))) * 90;
      ctx.strokeStyle = rgba(COL.ink, 0.35 * la); ctx.lineWidth = 3; ctx.setLineDash([10, 10]); ctx.beginPath(); ctx.moveTo(hx + 170, gy - 0.3 * hs); ctx.quadraticCurveTo(lineX - 60, lineY + 200, lineX - 30, lineY + 60 + up); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, str.slice(0, n), lineX, lineY + up, { size: 76, weight: 600, align: 'left', ls: 6, alpha: la });
      ctx.fillStyle = rgba(COL.ink, 0.4 * la); ctx.fillRect(lineX, lineY + 58 + up, full, 3);
      tick(ctx, lineX + full + 70, lineY + up, 44, (t - 90.19) / 0.22);
      sparkle(ctx, t, 90.19, lineX + full + 70, lineY, COL.orange, 8, 60, 110);
    }
  });
  bokeh(ctx, t, { n: 7, seed: 152, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 1:30.5–1:34.2  没读过的是 沙子会进鞋
// Nothing in the book about this one. So she writes it down herself: her first line.
const SAND_T = [92.31, 92.78, 93.03, 93.52, 93.83, 94.0];
export function sSand(ctx, t) {
  const hx = 700, gy = 950, hs = 720, k = hs / 1137, bx = hx - 151.5 * k, by = gy - 504 * k;      // the mouth of the boot she is emptying
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 90.5, 91.2)) + 0.025 * sat(t, 90.5, 94.2), cx: 900, cy: 660, seed: 35 }, () => {
    beach(ctx, t, 430, 640);
    // the book, face down in the sand, no help at all
    ctx.save(); ctx.translate(1360, 930); ctx.rotate(-0.05); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(60,40,20,0.16)'; ctx.beginPath(); ctx.ellipse(0, 4, 190, 20, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(0, -84); ctx.lineTo(150, 0); ctx.lineTo(128, 0); ctx.lineTo(0, -62); ctx.lineTo(-128, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5A3320'; ctx.beginPath(); ctx.moveTo(-164, 0); ctx.lineTo(-4, -100); ctx.lineTo(0, -92); ctx.lineTo(-146, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(164, 0); ctx.lineTo(4, -100); ctx.lineTo(0, -92); ctx.lineTo(146, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#6E4129'; ctx.beginPath(); ctx.moveTo(-164, 0); ctx.lineTo(-4, -100); ctx.lineTo(50, -128); ctx.lineTo(-104, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5A3320'; ctx.beginPath(); ctx.moveTo(164, 0); ctx.lineTo(4, -100); ctx.lineTo(50, -128); ctx.lineTo(214, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(124, -66); ctx.transform(1, 0.2, -0.5, 0.6, 0, 0); flower(ctx, 0, 0, 22, 0.3, COL.orange); ctx.restore();
    ctx.restore();
    // sand, a thin stream of it, and the heap it makes
    const run = sat(t, 90.62, 91.0), heap = sat(t, 90.8, 93.6);
    ctx.fillStyle = '#D9B87E'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(bx - 26 - 110 * heap, gy + 6); ctx.quadraticCurveTo(bx, gy - 6 - 150 * heap, bx + 26 + 110 * heap, gy + 6); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (run > 0) {
      const top = gy - 76 * heap;
      ctx.strokeStyle = '#D2AE72'; ctx.lineWidth = 18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx, by + 6); ctx.lineTo(bx + Math.sin(t * 5) * 3, lerp(by, top, run)); ctx.stroke();
      for (let i = 0; i < 60; i++) {
        const ph = (t * 1.9 + rnd(i, 831)) % 1; if (ph > run + 0.2) continue;
        const y = lerp(by, top, ph * ph), x = bx + (rnd(i, 832) - 0.5) * (16 + 26 * ph) + Math.sin(t * 6 + i) * 2;
        ctx.fillStyle = i % 3 ? '#C9A66B' : '#A98652'; ctx.fillRect(x - 3.5, y - 3.5, 7, 7);
      }
    }
    // she keeps her balance, more or less
    const hopP = beatPhase(t), hop = Math.abs(Math.sin(hopP * Math.PI)) * 14, s = sq(t, 90.62, 1.2);
    char(ctx, 'o17', hx, gy, hs, { lift: hop, rot: Math.sin(hopP * Math.PI) * 0.025, sx: s.sx, sy: s.sy });
    // her own line
    const str = '沙子会进鞋。', size = 84, x0 = 1050, y0 = 330;
    let w = 0, n = 0;
    ctx.save(); ctx.font = `700 ${size}px "Noto Serif SC"`; ctx.letterSpacing = '8px';
    for (let i = 0; i < str.length; i++) {
      if (t < SAND_T[i] - 0.04) break;
      const p = sat(t, SAND_T[i] - 0.04, SAND_T[i] + 0.16), cw = ctx.measureText(str[i]).width, kk = 0.6 + 0.4 * E.back(p);
      ctx.save(); ctx.translate(x0 + w + cw / 2, y0); ctx.scale(kk, kk); ctx.globalAlpha = Math.min(1, p * 3);
      ctx.fillStyle = COL.orangeD; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str[i], 0, 0); ctx.restore();
      w += cw; n++;
    }
    ctx.restore();
    if (t > 91.9) caret(ctx, x0 + w + 10, y0, 92, t, COL.orange, 8, n > 0 && n < str.length);
    if (n > 0) { ctx.fillStyle = rgba(COL.orange, 0.75); ctx.fillRect(x0, y0 + 62, w, 4); }
  });
  bokeh(ctx, t, { n: 7, seed: 153, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ================================================================== shared by the shots that follow
export const walkId = (p, t, ph = 0) => { const f = (((beatPhase(t) + ph) % 1) + 1) % 1, a = f < 0.25 || f >= 0.75; return p === 'o' ? (a ? 'o11' : 'o06') : p === 'k' ? (a ? 'k07' : 'k08') : (a ? 'f07' : 'f08'); };
export const hopOn = (t, ph = 0, a = 22) => Math.abs(Math.sin((beatPhase(t) + ph) * Math.PI)) * a;
// Ko's building block: a line or two of code. (x, y) is the middle of its top edge.
export function codeBlock(ctx, x, y, w, h, o = {}) {
  const r = Math.min(16, h * 0.2);
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(o.sx ?? 1, o.sy ?? 1); ctx.globalAlpha *= o.alpha ?? 1;
  cut(ctx, () => rrect(ctx, -w / 2, 0, w, h, r), o.fill ?? '#A6E3C8', 0.2, 16, 5);
  rrect(ctx, -w / 2, 0, w, h, r); ctx.lineWidth = o.lw ?? 4.5; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.fillStyle = COL.white; rrect(ctx, -w / 2 + w * 0.12, h * 0.24, w * 0.58, h * 0.17, h * 0.085); ctx.fill(); rrect(ctx, -w / 2 + w * 0.12, h * 0.58, w * 0.36, h * 0.17, h * 0.085); ctx.fill();
  ctx.restore();
}
// a brush stroke along pt(u) for u in [0, p], as wide as wd(u)
export function stroke(ctx, pt, wd, p, color, o = {}) {
  if (p <= 0) return;
  const n = Math.max(2, Math.ceil(56 * p)), L = [], R = [];
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * p, a = pt(Math.max(0, u - 0.004)), b = pt(Math.min(1, u + 0.004)), c = pt(u), d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / d, ny = (b[0] - a[0]) / d, w = wd(u) / 2;
    L.push([c[0] + nx * w, c[1] + ny * w]); R.push([c[0] - nx * w, c[1] - ny * w]);
  }
  const s0 = pt(0), e0 = pt(p);
  const parts = [() => { ctx.beginPath(); L.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]); ctx.closePath(); },
    () => { ctx.beginPath(); ctx.arc(s0[0], s0[1], wd(0) / 2, 0, TAU); }, () => { ctx.beginPath(); ctx.arc(e0[0], e0[1], wd(p) / 2, 0, TAU); }];
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.lineJoin = 'round';
  if (o.rim) for (const f of parts) { f(); ctx.strokeStyle = o.rim; ctx.lineWidth = o.rimW ?? 12; ctx.stroke(); }
  for (const f of parts) { f(); ctx.fillStyle = color; ctx.fill(); }
  ctx.restore();
}
// a speech bubble centred on (x, y); its tail points down, tail px to the side
export function bubble(ctx, x, y, w, h, p, edge = COL.ink, tail = 0) {
  if (p <= 0) return false;
  const k = E.back(clamp(p));
  ctx.translate(x, y + h / 2 + 30); ctx.scale(k, k); ctx.translate(0, -h / 2 - 30);
  cut(ctx, () => rrect(ctx, -w / 2, -h / 2, w, h, Math.min(h / 2, 36)), COL.white, 0.2, 16, 5);
  ctx.lineWidth = 5; ctx.strokeStyle = edge; ctx.lineJoin = 'round'; rrect(ctx, -w / 2, -h / 2, w, h, Math.min(h / 2, 36)); ctx.stroke();
  ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(tail - 18, h / 2 - 3); ctx.lineTo(tail * 1.6, h / 2 + 30); ctx.lineTo(tail + 18, h / 2 - 3); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tail - 18, h / 2); ctx.lineTo(tail * 1.6, h / 2 + 30); ctx.lineTo(tail + 18, h / 2); ctx.stroke();
  return true;
}
// the road of pages, already laid
export function roadPages(ctx, camX, y = GY + 30) {
  for (let i = Math.floor((camX - 300) / 190); i * 190 - camX < W + 300; i++) {
    ctx.save(); ctx.translate(i * 190 - camX + 75, y);
    ctx.fillStyle = 'rgba(60,40,20,0.15)'; ctx.beginPath(); ctx.moveTo(-88, -20); ctx.lineTo(96, -20); ctx.lineTo(76, 36); ctx.lineTo(-108, 36); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-85, -26); ctx.lineTo(95, -26); ctx.lineTo(75, 26); ctx.lineTo(-105, 26); ctx.closePath();
    ctx.fillStyle = COL.white; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.stroke();
    ctx.fillStyle = rgba(COL.ink, 0.3); for (let k = 0; k < 3; k++) ctx.fillRect(-70 - k * 6, -14 + k * 13, 110, 4);
    ctx.restore();
  }
}

// ------------------------------------------------------------------ 1:34.2–1:37.5  小柯说 先别想 桥都搭了半截
// She is still working out how to get across when Ko runs past with the first block. One block per syllable, and the
// bridge stops in mid-air: that is as far as anyone has got.
const BR = { x0: 700, w: 200, top: 800, h: 88, T: [95.62, 95.92, 96.18, 96.39, 96.78] };
export function bank(ctx, x0, top) {
  const edge = () => { ctx.moveTo(-500, top); ctx.lineTo(x0 - 50, top); ctx.quadraticCurveTo(x0 + 4, top + 4, x0 + 22, top + 74); ctx.lineTo(x0 + 80, H + 300); };
  cut(ctx, () => { ctx.beginPath(); edge(); ctx.lineTo(-500, H + 300); ctx.closePath(); }, '#F3E4C6', 0.2, 18, -5);
  for (let i = 0; i < 60; i++) { const x = -200 + rnd(i, 841) * (x0 + 150), y = top + 26 + rnd(i, 842) * (H - top); if (x > x0 - 40 + (y - top) * 0.2) continue; ctx.fillStyle = rgba('#B99A68', 0.25 + rnd(i, 843) * 0.3); ctx.fillRect(x, y, 3 + rnd(i, 844) * 3, 3); }
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.beginPath(); edge(); ctx.stroke();
}
function thought(ctx, x, y, r, k, a, dots) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= a;
  const cl = () => { ctx.beginPath(); for (const [dx, dy, rr] of [[-0.62, 0.1, 0.5], [-0.2, -0.3, 0.6], [0.36, -0.24, 0.56], [0.7, 0.12, 0.46], [0.1, 0.3, 0.6], [-0.36, 0.34, 0.46]]) { ctx.moveTo((dx + rr) * r, dy * r); ctx.arc(dx * r, dy * r, rr * r, 0, TAU); } for (const [dx, dy, rr] of [[-0.86, 0.98, 0.15], [-1.12, 1.3, 0.09]]) { ctx.moveTo((dx + rr) * r, dy * r); ctx.arc(dx * r, dy * r, rr * r, 0, TAU); } };
  ctx.lineWidth = 9; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; cl(); ctx.stroke(); cut(ctx, cl, COL.white, 0.14, 14, 5);
  ctx.fillStyle = COL.inkSoft; for (let i = 0; i < dots; i++) { ctx.beginPath(); ctx.arc((i - 1) * 0.42 * r, 0.02 * r, 0.11 * r, 0, TAU); ctx.fill(); }
  ctx.restore();
}
export function sBridgeKo(ctx, t) {
  const KS = 400, kk = (KS / 1140) * 1.22, gy = BR.top + 14, OX = 290;
  let kx = lerp(-300, 606, E.out(sat(t, 94.2, 95.25))), khop = t < 95.25 ? Math.abs(Math.sin((t - 94.2) * 13)) * 18 : 0, ksq = 0;
  BR.T.forEach((Ti, i) => { const p = sat(t, Ti + 0.03, Ti + 0.25); kx = lerp(kx, BR.x0 + i * BR.w + 104, E.io(p)); khop += Math.sin(p * Math.PI) * 44; ksq += hit(t, Ti, 14); });
  const teeter = t > 97.16 ? Math.sin((t - 97.16) * 16) * 0.07 * Math.exp(-4 * (t - 97.16)) : 0;
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 94.2, 95.0)), cx: 760, cy: 700, x: -90 * E.io(sat(t, 95.5, 97.3)), seed: 36 }, () => {
    seaSky(ctx, t, 470);
    ctx.save(); ctx.setLineDash([14, 12]); ctx.strokeStyle = rgba(COL.ink, 0.4); ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(1790, 486); ctx.quadraticCurveTo(1960, 350, 2200, 486); ctx.stroke(); ctx.restore();      // the far side: not written yet
    waveBands(ctx, t, 486, 1120, 7, { pow: 1.35 });
    bank(ctx, BR.x0, BR.top);
    BR.T.forEach((Ti, i) => {                       // the bridge so far
      if (t < Ti) return;
      const bx = BR.x0 + i * BR.w + BR.w / 2, s = hit(t, Ti, 12);
      for (const dx of [-62, 62]) {
        ctx.strokeStyle = COL.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + dx, BR.top + BR.h - 6); ctx.lineTo(bx + dx, H + 200); ctx.stroke();
        const r = 22 + 8 * Math.sin(t * 3 + i + dx) + 40 * s; ctx.strokeStyle = rgba(COL.white, 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx + dx, BR.top + 176, r, r * 0.26, 0, 0, TAU); ctx.stroke();
      }
      codeBlock(ctx, bx, BR.top + 12 * s, BR.w - 8, BR.h, { sy: 1 - 0.22 * s });
      sparkle(ctx, t, Ti, bx, BR.top + 20, '#2FA676', 7, 110, 170);
    });
    const nb = sat(t, 96.95, 97.2);                 // and the one that is not there yet
    if (nb > 0) { ctx.save(); ctx.globalAlpha = nb * (0.7 + 0.3 * Math.sin(t * 9)); ctx.setLineDash([14, 10]); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; rrect(ctx, BR.x0 + 5 * BR.w + 4, BR.top, BR.w - 8, BR.h, 16); ctx.stroke(); ctx.restore(); }
    if (t < 95.0) char(ctx, 'k05', kx, gy + 2, KS, { lift: khop, rot: teeter, sx: 1 + 0.05 * ksq, sy: 1 - 0.07 * ksq });
    // 橙子: thinking, then not
    if (t > 96.55) { const wb = walkBob(t); char(ctx, walkId('o', t), lerp(OX, 850, E.io(sat(t, 96.55, 97.55))), gy, 430, { lift: wb.lift, rot: wb.rot, windX: -5, flutter: 2 }); }
    else { const pose = t < 95.3 ? 'o31' : t < 96.0 ? 'o39' : 'o33', s = sq(t, t < 95.3 ? 94.2 : t < 96.0 ? 95.3 : 96.0, 1.4), b = breathe(t); char(ctx, pose, OX, gy, 430, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: b.rot, lift: pose === 'o33' ? hopOn(t, 0, 26) : 0 }); }
    const ta = sat(t, 94.28, 94.5), tp = sat(t, 95.1, 95.26);
    if (ta > 0 && tp < 1) thought(ctx, OX + 226, 312, 76, E.back(ta) * (1 + 0.35 * tp), 1 - tp, t < 94.6 ? 1 : t < 94.85 ? 2 : 3);
    sparkle(ctx, t, 95.12, OX + 226, 312, COL.orange, 9, 70, 150);
    BR.T.forEach((Ti, i) => {                       // the block on its way down
      const p = sat(t, Ti - 0.2, Ti); if (p <= 0 || p >= 1) return;
      codeBlock(ctx, lerp(kx - 70 * kk, BR.x0 + i * BR.w + BR.w / 2, p), lerp(gy - 1046 * kk - 49, BR.top, E.in(p)) - Math.sin(p * Math.PI) * 60, lerp(120, BR.w - 8, p), lerp(98, BR.h, p), { rot: (1 - p) * -0.5 });
    });
    if (t >= 95.0) char(ctx, 'k05', kx, gy + 2, KS, { lift: khop, rot: teeter, sx: 1 + 0.05 * ksq, sy: 1 - 0.07 * ksq });
  });
  bokeh(ctx, t, { n: 7, seed: 154, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 1:37.5–1:41  大肥鱼潜下去 把我漏的全都接
// Everything she let slip is sinking under the bridge. 大肥鱼 goes in after it and has one for every syllable.
const DVT = [99.31, 99.52, 99.73, 99.95, 100.12, 100.32, 100.68], DVC = ['吗', '的', '呢', '啊', '了', '吧', '？'], SURF = 176, FS = 430, TE = 98.5;
function diveAt(tt) { const u = sat(tt, 98.25, 100.95), g = u < 0.4 ? 0.5 * Math.pow(u / 0.4, 0.8) : 0.5 + 0.29 * (1 - (1 - (u - 0.4) / 0.6) ** 2); return [lerp(300, 1500, u), -260 + 870 * Math.sin(Math.PI * g)]; }
function trailAt(t, d) {          // the point d px back along the way she came
  let acc = 0, p = diveAt(t);
  for (let k = 1; k < 400; k++) { const q = diveAt(t - k * 0.01); acc += Math.hypot(q[0] - p[0], q[1] - p[1]); p = q; if (acc >= d) break; if (t - k * 0.01 < 98.2) { p = [p[0] - (d - acc) * 0.5, p[1] - (d - acc) * 0.85]; break; } }
  return p;
}
function diver(tt) {             // the middle of her, how far she is turned, and where her hands are
  const tc = clamp(tt, 98.28, 100.9), a = diveAt(tc - 0.02), b = diveAt(tc + 0.02), c = diveAt(tt), rot = (Math.atan2(b[1] - a[1], b[0] - a[0]) - 0.66) * 0.8;
  const hx = 151 * (FS / 430), hy = 147 * (FS / 430);
  return { x: c[0], y: c[1], rot, hand: [c[0] + hx * Math.cos(rot) - hy * Math.sin(rot), c[1] + hx * Math.sin(rot) + hy * Math.cos(rot)] };
}
export function sDive(ctx, t) {
  const F = diver(t), u = sat(t, 98.25, 100.95);
  const surf = x => SURF + Math.sin(x * 0.018 + t * 2.1) * 6 + Math.sin(x * 0.05 - t * 3) * 3;
  cam(ctx, t, { z: 1.03 + 0.035 * u + 0.03 * hit(t, 100.68, 6), cx: 1000, cy: 560, x: -50 * u, seed: 37 }, () => {
    ctx.fillStyle = '#E7F3FD'; ctx.fillRect(-300, -300, W + 600, SURF + 320);
    for (let i = 0; i < 5; i++) {                   // the bridge, seen from the water
      const bx = 250 + i * 190; ctx.strokeStyle = COL.ink; ctx.lineWidth = 7;
      for (const dx of [-56, 56]) { ctx.beginPath(); ctx.moveTo(bx + dx, 116); ctx.lineTo(bx + dx, SURF + 12); ctx.stroke(); }
      codeBlock(ctx, bx, 52, 182, 72);
    }
    const g = ctx.createLinearGradient(0, SURF, 0, H + 100); g.addColorStop(0, '#8DBBEE'); g.addColorStop(0.45, '#4A7FD0'); g.addColorStop(1, '#253C8C');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-300, H + 300); for (let x = -300; x <= W + 300; x += 24) ctx.lineTo(x, surf(x)); ctx.lineTo(W + 300, H + 300); ctx.closePath(); ctx.fill();
    const sg = ctx.createLinearGradient(0, SURF, 0, 760); sg.addColorStop(0, 'rgba(31,58,130,0.55)'); sg.addColorStop(1, 'rgba(31,58,130,0)');
    for (let i = 0; i < 5; i++) for (const dx of [-56, 56]) { const bx = 250 + i * 190 + dx; ctx.strokeStyle = sg; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(bx, SURF + 4); for (let y = SURF + 30; y <= 760; y += 30) ctx.lineTo(bx + Math.sin(y * 0.03 + t * 2 + i) * 5, y); ctx.stroke(); }
    for (let i = 0; i < 6; i++) {                   // light coming down
      const x = 60 + i * 350 + Math.sin(t * 0.4 + i) * 40, gg = ctx.createLinearGradient(0, SURF, 0, 920); gg.addColorStop(0, 'rgba(255,255,255,0.2)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x, SURF); ctx.lineTo(x + 110, SURF); ctx.lineTo(x + 340, 920); ctx.lineTo(x + 110, 920); ctx.closePath(); ctx.fill();
    }
    char(ctx, 'w01', lerp(1820, 1420, sat(t, 97.55, 101)), 640 + Math.sin(t * 0.9) * 14, 250, { alpha: 0.3, shadow: false, blink: 0, flip: true, rot: Math.sin(t * 0.7) * 0.04 });
    cut(ctx, () => hillPath(ctx, 1030, 70, 420, 1.2, 0), '#22387F', 0.2, 20, -6);
    for (let i = 0; i < 9; i++) {                   // weed
      const x = 80 + i * 228 + rnd(i, 861) * 80, h = 110 + rnd(i, 862) * 150, sw = Math.sin(t * 1.3 + i * 1.7) * 26;
      ctx.strokeStyle = i % 2 ? '#2F5DB4' : '#3B6FC4'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, 1010); ctx.bezierCurveTo(x + sw * 0.3, 1010 - h * 0.4, x - sw, 1010 - h * 0.7, x + sw, 1010 - h); ctx.stroke();
    }
    for (let i = 0; i < 26; i++) {                  // a little air everywhere
      const ph = (t * (0.12 + rnd(i, 871) * 0.14) + rnd(i, 872)) % 1, x = rnd(i, 873) * W + Math.sin(t * 2 + i) * 10, y = lerp(1000, SURF + 20, ph);
      ctx.strokeStyle = rgba(COL.white, 0.5 * Math.sin(ph * Math.PI)); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 3 + rnd(i, 874) * 6, 0, TAU); ctx.stroke();
    }
    for (const Ti of [97.66, 97.90, 98.15]) {       // 大 · 肥 · 鱼: she tries the water with a toe, three times
      const p = sat(t, Ti, Ti + 0.5); if (p <= 0 || p >= 1) continue;
      ctx.strokeStyle = rgba(COL.white, 1 - p); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(372, SURF, 26 + 110 * E.out(p), 5 + 12 * E.out(p), 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = rgba('#3F6FD0', 1 - p); ctx.beginPath(); ctx.arc(372, SURF - 16 - 60 * Math.sin(p * Math.PI), 9, 0, TAU); ctx.fill();
    }
    for (let j = 0; j < 36; j++) {                  // the air she takes down with her
      const tb = TE + j * 0.07, dt = t - tb; if (dt < 0 || dt > 1.4) continue;
      const p = diveAt(tb), y = p[1] - dt * 130 + rnd(j, 852) * 60; if (y < SURF + 12) continue;
      ctx.strokeStyle = rgba(COL.white, 0.85 * (1 - dt / 1.4)); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(p[0] - 60 + rnd(j, 851) * 120 + Math.sin(dt * 5 + j) * 8, y, 5 + rnd(j, 853) * 9, 0, TAU); ctx.stroke();
    }
    DVT.forEach((Ti, i) => {
      const last = i === DVT.length - 1;
      if (t < Ti) {                                 // still sinking, to exactly where her hands will be
        const h = diver(Ti).hand, y = h[1] - 150 * (Ti - t), a = sat(y, SURF + 20, SURF + 110), loose = Math.min(1, (Ti - t) * 2);
        if (a > 0) cutGlyph(ctx, DVC[i], h[0] + Math.sin(t * 2.2 + i * 1.7) * 16 * loose, y, 78, COL.orange, { rot: Math.sin(t * 1.5 + i) * 0.3 * loose, alpha: a });
        return;
      }
      const q = E.out(sat(t, Ti, Ti + 0.32)), bump = 1 + 0.5 * hit(t, Ti, 9);
      if (last) cutGlyph(ctx, DVC[i], F.hand[0] + 8, F.hand[1] - 40 * q, 78 * (1 + 0.4 * q) * bump, COL.orange, { rot: Math.sin(t * 5) * 0.08 });
      else { const c = trailAt(t, 250 + 84 * i); cutGlyph(ctx, DVC[i], lerp(F.hand[0], c[0], q), lerp(F.hand[1], c[1] + Math.sin(t * 4 + i) * 10, q) - 110 * Math.sin(Math.PI * q), 70 * bump, COL.orange, { rot: Math.sin(t * 3 + i) * 0.2 }); }
      const h = diver(Ti).hand; sparkle(ctx, t, Ti, h[0], h[1], COL.yellow, last ? 12 : 8, last ? 80 : 50, last ? 220 : 130);
    });
    if (t > TE - 0.25) char(ctx, 'f05', F.x, F.y, FS, { rot: F.rot, shadow: false, flutter: 3, sway: 1.5, sx: 1 + 0.07 * hit(t, 100.68, 8), sy: 1 + 0.07 * hit(t, 100.68, 8) });
    const rp = sat(t, 100.68, 101.3);
    if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.white, 0.9 * (1 - rp)); ctx.lineWidth = 10 * (1 - rp) + 2; ctx.beginPath(); ctx.arc(F.hand[0], F.hand[1], 60 + 420 * E.out(rp), 0, TAU); ctx.stroke(); }
    ctx.strokeStyle = COL.white; ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.beginPath(); for (let x = -300; x <= W + 300; x += 24) ctx.lineTo(x, surf(x)); ctx.stroke();
    const sp = sat(t, TE, TE + 0.55);
    if (sp > 0 && sp < 1) for (let i = 0; i < 12; i++) {         // in she goes
      const an = -Math.PI * (0.12 + 0.76 * (i / 11)), v = 120 + rnd(i, 881) * 170;
      ctx.fillStyle = i % 3 ? COL.white : '#BBDAF7'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.globalAlpha = 1 - sp * sp;
      ctx.beginPath(); ctx.arc(378 + Math.cos(an) * v * sp, SURF + Math.sin(an) * v * sp + 300 * sp * sp, 6 + rnd(i, 882) * 9, 0, TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    }
  });
  bokeh(ctx, t, { n: 8, seed: 155, alpha: 0.1, colors: [COL.white, '#BBDAF7'] });
  finish(ctx, { light: 0.6 });
}

// ------------------------------------------------------------------ 1:41–1:42.85  三个人 三种颜色的笔
const PEN = [
  { id: 'k06', x: 330, s: 540, c: 1, tip: [-312, -1064], kk: 1.1 / 1140, T: 101.10, TS: 102.03 },
  { id: 'o18', x: 960, s: 570, c: 0, tip: [-288, -1096], kk: 1.001 / 1137, T: 101.40, TS: 102.26 },
  { id: 'f06', x: 1590, s: 540, c: 2, tip: [-315, -852], kk: 1.057 / 939, T: 101.60, TS: 102.44 },
];
export const PENS = PEN;
export const penTip = (P, x, fy, s) => [x + P.tip[0] * P.kk * s, fy + P.tip[1] * P.kk * s];
function panelArt(ctx, c, t) {                     // what each of them writes in: flowers, code, water
  if (c === 0) for (let i = 0; i < 7; i++) flower(ctx, 720 + (i % 3) * 230 + (i % 2) * 60, 130 + Math.floor(i / 3) * 330 + (i % 2) * 90, 46, t * 0.3 + i, rgba(COL.orange, 0.28), rgba(COL.white, 0.5), rgba(COL.ink, 0.12));
  else if (c === 1) for (let r = 0; r < 12; r++) { ctx.fillStyle = rgba(GREENS[r % 3], 0.2); const ind = [0, 1, 2, 1, 2, 2, 1, 0][r % 8] * 40; rrect(ctx, 20 + ind, 80 + r * 84, 180 + rnd(r, 891) * 330, 18, 9); ctx.fill(); }
  else for (let r = 0; r < 9; r++) { ctx.strokeStyle = rgba('#3F6FD0', 0.22); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); for (let x = 1180; x <= 2100; x += 20) { const y = 120 + r * 110 + Math.sin(x * 0.02 + t * 1.6 + r) * 16; if (x === 1180) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); }
}
export function sPens(ctx, t) {
  const B = [-360, 640, 1280, 2280], SL = 150;
  cam(ctx, t, { z: 1.02 + 0.02 * sat(t, 101, 102.85) + 0.03 * hit(t, 102.78, 8), seed: 38 }, () => {
    paper(ctx, COL.white, 0.1);
    PEN.forEach((P, i) => {
      const inn = E.out(sat(t, P.T - 0.08, P.T + 0.18)); if (inn <= 0) return;
      const dy = (1 - inn) * (i % 2 ? 1300 : -1300);
      ctx.save(); ctx.translate(-dy * SL / H, dy);
      ctx.beginPath(); ctx.moveTo(B[i] + SL * 1.305 + 9, -330); ctx.lineTo(B[i + 1] + SL * 1.305 - 9, -330); ctx.lineTo(B[i + 1] - SL * 0.305 - 9, H + 330); ctx.lineTo(B[i] - SL * 0.305 + 9, H + 330); ctx.closePath();
      ctx.fillStyle = PASTEL[P.c]; ctx.fill(); ctx.clip();
      const gl = ctx.createRadialGradient(P.x, 560, 60, P.x, 560, 620); gl.addColorStop(0, 'rgba(255,255,255,0.6)'); gl.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gl; ctx.fillRect(-400, -400, W + 800, H + 800);
      panelArt(ctx, P.c, t);
      ctx.restore();
    });
    PEN.forEach(P => {
      if (t < P.T) return;
      const up = E.back(sat(t, P.T, P.T + 0.32)), fy = 962 + (1 - up) * 760, b = bop(t, 1.2), cr = crouch(t, 102.78), s = sq(t, P.TS, 1.3);
      const lift = t > 102.78 ? 70 * E.out(sat(t, 102.78, 102.9)) : 0;
      char(ctx, P.id, P.x, fy, P.s, { sx: b.sx * cr.sx * s.sx, sy: b.sy * cr.sy * s.sy, lift });
      const tp = penTip(P, P.x, fy - lift, P.s), p = E.out(sat(t, P.TS - 0.05, P.TS + 0.2));
      stroke(ctx, q => [tp[0] + 380 * q, tp[1] - 30 - 170 * Math.sin(Math.PI * q) + 20 * q], q => 12 + 30 * Math.sin(Math.PI * Math.min(1, q * 1.15)), p, TRI[P.c], { rim: COL.white, rimW: 14 });
      sparkle(ctx, t, P.TS, tp[0], tp[1] - 24, TRI[P.c], 8, 40, 110);
    });
  });
  finish(ctx, { light: 0.6 });
}

// ------------------------------------------------------------------ 1:42.85–1:45.4  写歪了的那一笔 后来成了一条街
// The pencil gets away from her and the line goes wrong. Nobody rubs it out; it is where the street bends.
const CRV = u => { const S = (a, b) => { const x = clamp((u - a) / (b - a)); return x * x * (3 - 2 * x); }; return [420 + 1360 * u, 500 + 22 * Math.sin(u * 9) + 230 * S(0.36, 0.56) - 150 * S(0.7, 0.95)]; };
const crPath = (ctx, u1, n = 90) => { ctx.beginPath(); for (let i = 0; i <= n; i++) { const p = CRV((i / n) * u1); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } };
const HOUSE = [[0.04, 104.18], [0.15, 104.40], [0.26, 104.62], [0.47, 104.78], [0.58, 104.92], [0.69, 105.06]], HC = ['#F4B67A', '#8FD3B4', '#9DBEF0'];
export function sCrooked(ctx, t) {
  const w = sat(t, 102.9, 104.0), grow = sat(t, 104.1, 104.5), gk = E.back(grow), k22 = (400 / 1137) * 1.015, pen = CRV(w), GS = 430;
  cam(ctx, t, { z: lerp(1.12, 1.0, E.io(sat(t, 103.85, 104.5))) + 0.015 * hit(t, 105.27, 6), cx: pen[0], cy: pen[1], seed: 41 }, () => {
    paper(ctx, COL.white, 0.12);
    ctx.fillStyle = rgba(COL.ink, 0.07 * (1 - grow)); for (let r = 0; r < 14; r++) ctx.fillRect(-300, 60 + r * 86, W + 600, 2);
    if (grow > 0) {                                 // the page turns into a place
      ctx.fillStyle = rgba('#FDEBCB', 0.9 * grow); ctx.fillRect(-300, -300, W + 600, H + 600);
      const gs = ctx.createRadialGradient(1640, 170, 20, 1640, 170, 520); gs.addColorStop(0, `rgba(255,214,150,${0.9 * grow})`); gs.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = gs; ctx.fillRect(-300, -300, W + 600, H + 600);
      ctx.fillStyle = rgba('#FFE1A8', grow); ctx.beginPath(); ctx.arc(1640, 170, 90 * gk, 0, TAU); ctx.fill();
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (grow > 0) {
      const lw = lerp(16, 118, gk);
      crPath(ctx, 1); ctx.strokeStyle = COL.ink; ctx.lineWidth = lw + 10; ctx.stroke();
      crPath(ctx, 1); ctx.strokeStyle = mix(COL.orangeD, '#FFF6E2', clamp(grow * 1.6)); ctx.lineWidth = lw; ctx.stroke();
      ctx.save(); ctx.setLineDash([30, 34]); ctx.globalAlpha = sat(grow, 0.5, 1); crPath(ctx, 1); ctx.strokeStyle = COL.orange; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    } else if (w > 0) { crPath(ctx, w); ctx.strokeStyle = COL.orangeD; ctx.lineWidth = 16; ctx.stroke(); }
    HOUSE.forEach(([u, T], i) => {
      const p = sat(t, T - 0.04, T + 0.22); if (p <= 0) return;
      const c = CRV(u), k = 0.52 * E.back(p);
      ctx.save(); ctx.translate(c[0], c[1] - 62); ctx.scale(k, k); ctx.translate(0, -GY); house(ctx, 0, 290, 250 + (i % 3) * 30, HC[i % 3], 1, t); ctx.restore();
      sparkle(ctx, t, T, c[0], c[1] - 150, HC[i % 3], 7, 70, 130);
    });
    const fp = sat(t, 105.27, 105.4);               // 街: and it has trees
    if (fp > 0) { drawObj(ctx, { k: 'tree', ch: '树', x: 0, y: 600, s: 0.85 }, 200, 0.25 + 0.75 * fp, t); [[0.14, 96], [0.4, 100], [0.72, 104]].forEach(([u, dy]) => { const c = CRV(u); drawObj(ctx, { k: 'flow', ch: '花', x: u * 9, y: c[1] + dy + 50, s: 0.62 }, c[0], 0.25 + 0.75 * fp, t); }); }
    if (t < 104.0) {                                // she is holding on to the pencil; the pencil is doing the driving
      const d = CRV(Math.min(1, w + 0.012)), rot = Math.atan2(d[1] - pen[1], d[0] - pen[0]) * 0.4 + Math.sin(t * 31) * 0.02 * sat(w, 0.36, 0.42) * (1 - sat(w, 0.56, 0.62));
      const o = anchor('o34', 0, 0, GS, PT.o34[0], PT.o34[1]), tx = o[0], ty = o[1];              // from her anchor to the pencil point
      char(ctx, 'o34', pen[0] - (tx * Math.cos(rot) - ty * Math.sin(rot)), pen[1] - (tx * Math.sin(rot) + ty * Math.cos(rot)), GS, { rot, windX: -12 * sat(w, 0, 0.1), flutter: 4, shadow: false });
      const ea = sat(w, 0.37, 0.41) * (1 - sat(w, 0.6, 0.66));
      if (ea > 0) drawGlyph(ctx, '！', pen[0] - 60, pen[1] - 520, 110, { weight: 900, color: COL.orange, alpha: ea, rot: 0.15, sx: 0.6 + 0.4 * E.back(sat(w, 0.37, 0.45)), sy: 0.6 + 0.4 * E.back(sat(w, 0.37, 0.45)) });
    } else {
      const e = CRV(1), joy = t >= 104.4, s = sq(t, joy ? 104.4 : 104.0, 1.4), b = breathe(t);
      char(ctx, joy ? 'o36' : 'o35', e[0] - 495.5 * k22, e[1] + 458 * k22, 400, { sx: s.sx * b.sx, sy: s.sy * b.sy, lift: joy ? hopOn(t, 0, 22) : 0 });
    }
    [['k11', 0.095, 104.40, 0.25], ['f10', 0.365, 104.78, 0.5]].forEach(([id, u, T, ph]) => {       // and the other two move in
      const p = sat(t, T, T + 0.3); if (p <= 0) return;
      const c = CRV(u), s = sq(t, T, 1.4);
      char(ctx, id, c[0], c[1] + 178 + (1 - E.back(p)) * 60, 300, { alpha: Math.min(1, p * 4), sx: s.sx, sy: s.sy, lift: hopOn(t, ph, 18) });
    });
  });
  bokeh(ctx, t, { n: 8, seed: 156, alpha: 0.1 * grow, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 1:45.4–1:48  我问的问题 比答案还多一些
// A pair of scales. Her questions on one side, a syllable each; Ko and 大肥鱼 put an answer each on the other. It is
// not close.
const QT = [105.50, 105.72, 106.02, 106.18, 106.36, 107.20, 107.45], AT = [106.78, 106.98];
const QSLOT = [[-66, 0], [6, 0], [78, 0], [-32, -64], [42, -64], [4, -128], [-70, -128]], ASLOT = [[-44, 0], [44, 0]];
export function sQuestions(ctx, t) {
  const PV = [880, 372], HALF = 350, FL = 930, OX = 222, OS = 450, KX = 1450, FX = 1762;
  const step = (T, d) => (t < T ? 0 : d * (1 - Math.exp(-9 * (t - T)) * Math.cos(17 * (t - T))));
  let ang = 0; QT.forEach((T, i) => { ang -= step(T, i < 5 ? 0.028 : i === 5 ? 0.05 : 0.17); }); AT.forEach(T => { ang += step(T, 0.065); });
  const end = sgn => [PV[0] + sgn * HALF * Math.cos(ang), PV[1] + sgn * HALF * Math.sin(ang)], LP = end(-1), RP = end(1), PY2 = 176;
  cam(ctx, t, { z: 1.0 + 0.012 * sat(t, 105.4, 108) + 0.02 * hit(t, 107.45, 6), cx: 900, cy: 620, seed: 42, hand: 2 }, () => {
    paper(ctx, '#F8EDD6', 0.14);
    for (let i = 0; i < 9; i++) drawGlyph(ctx, '？', 140 + i * 215 + Math.sin(i * 3) * 40, ((1.3 - ((t * 0.05 + rnd(i, 901)) % 1) * 1.6) * H), 200 + rnd(i, 902) * 160, { weight: 900, color: COL.orange, alpha: 0.055, rot: (rnd(i, 903) - 0.5) * 0.5 });
    ctx.fillStyle = '#F1E2C4'; ctx.fillRect(-300, FL, W + 600, 500);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, FL); ctx.lineTo(W + 300, FL); ctx.stroke();
    // the scales
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    cut(ctx, () => { ctx.beginPath(); ctx.moveTo(PV[0] - 130, FL); ctx.quadraticCurveTo(PV[0], FL - 70, PV[0] + 130, FL); ctx.closePath(); }, '#FFF6E2', 0.2, 14, 4);
    ctx.beginPath(); ctx.moveTo(PV[0] - 130, FL); ctx.quadraticCurveTo(PV[0], FL - 70, PV[0] + 130, FL); ctx.closePath(); ctx.lineWidth = 4.5; ctx.stroke();
    ctx.lineWidth = 26; ctx.strokeStyle = COL.ink; ctx.beginPath(); ctx.moveTo(PV[0], FL - 34); ctx.lineTo(PV[0], PV[1]); ctx.stroke();
    ctx.lineWidth = 17; ctx.strokeStyle = '#FFF6E2'; ctx.beginPath(); ctx.moveTo(PV[0], FL - 34); ctx.lineTo(PV[0], PV[1]); ctx.stroke();
    ctx.lineWidth = 24; ctx.strokeStyle = COL.ink; ctx.beginPath(); ctx.moveTo(LP[0], LP[1]); ctx.lineTo(RP[0], RP[1]); ctx.stroke();
    ctx.lineWidth = 15; ctx.strokeStyle = '#FFF6E2'; ctx.beginPath(); ctx.moveTo(LP[0], LP[1]); ctx.lineTo(RP[0], RP[1]); ctx.stroke();
    ctx.fillStyle = COL.orange; ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.arc(PV[0], PV[1], 22, 0, TAU); ctx.fill(); ctx.stroke();
    const pan = P => {
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 3.5; for (const dx of [-124, 124]) { ctx.beginPath(); ctx.moveTo(P[0], P[1]); ctx.lineTo(P[0] + dx, P[1] + PY2); ctx.stroke(); }
      cut(ctx, () => { ctx.beginPath(); ctx.moveTo(P[0] - 136, P[1] + PY2); ctx.quadraticCurveTo(P[0], P[1] + PY2 + 74, P[0] + 136, P[1] + PY2); ctx.closePath(); }, '#FFF6E2', 0.22, 14, 5);
      ctx.beginPath(); ctx.moveTo(P[0] - 136, P[1] + PY2); ctx.quadraticCurveTo(P[0], P[1] + PY2 + 74, P[0] + 136, P[1] + PY2); ctx.closePath(); ctx.lineWidth = 4.5; ctx.stroke();
    };
    pan(LP); pan(RP);
    // 橙子 and her questions
    const laugh = t >= 107.82, lastQ = Math.max(...QT.filter(T => T - 0.26 <= t), 105.4), s = sq(t, laugh ? 107.82 : lastQ - 0.26, 1.3), b = breathe(t);
    char(ctx, laugh ? 'o37' : 'o20', OX, FL + 12, OS, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: b.rot, lift: laugh ? hopOn(t, 0, 16) : 0 });
    const src = [OX + 70, FL - OS * 0.92];
    QT.forEach((T, i) => {
      const p = sat(t, T - 0.26, T); if (p <= 0) return;
      const dst = [LP[0] + QSLOT[i][0], LP[1] + PY2 - 34 + QSLOT[i][1]], k = (0.5 + 0.5 * p) * (1 + 0.3 * hit(t, T, 10));
      cutGlyph(ctx, '？', lerp(src[0], dst[0], p), lerp(src[1], dst[1], p * p) - 190 * Math.sin(Math.PI * p) * (1 - p * 0.3), 80, COL.orange, { s: k, rot: (1 - p) * -1.2 + Math.sin(i * 2.3) * 0.16 });
    });
    // the other two and their answers
    const kb = bop(t, 1.2), sk = sq(t, AT[0] - 0.26, 1.5), sf = sq(t, AT[1] - 0.26, 1.5), watch = t > 107.45;
    char(ctx, 'k12', KX, FL + 10, 360, { sx: kb.sx * sk.sx, sy: kb.sy * sk.sy, lift: watch ? hopOn(t, 0.25, 20) : 0 });
    char(ctx, 'f11', FX, FL + 12, 360, { sx: kb.sx * sf.sx, sy: kb.sy * sf.sy, lift: watch ? hopOn(t, 0.5, 24) : hopOn(t, 0.5, 8) });
    AT.forEach((T, i) => {
      const p = sat(t, T - 0.26, T); if (p <= 0) return;
      const from = i ? [FX - 60, FL - 330] : [KX - 80, FL - 300], dst = [RP[0] + ASLOT[i][0], RP[1] + PY2 - 30];
      tick(ctx, lerp(from[0], dst[0], p), lerp(from[1], dst[1], p * p) - 150 * Math.sin(Math.PI * p), 36 * (1 + 0.3 * hit(t, T, 10)), 1, TRI[i + 1]);
    });
    sparkle(ctx, t, 107.45, LP[0], LP[1] + PY2 - 80, COL.orange, 10, 120, 220);
    [[107.64, -96, -30], [107.82, 110, -64]].forEach(([T, dx, dy], i) => {         // 一些: two more, with nowhere left to put them
      const p = sat(t, T - 0.05, T + 0.22); if (p <= 0) return;
      cutGlyph(ctx, '？', OX + dx, FL - OS + dy + Math.sin(t * 5 + i) * 6, 62, i ? COL.yellow : COL.orange, { s: E.back(p), rot: (i ? 0.25 : -0.25) + Math.sin(t * 4 + i) * 0.08 });
    });
  });
  bokeh(ctx, t, { n: 7, seed: 157, alpha: 0.1, colors: [COL.white, COL.peach] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 1:48–1:51.25  他们说没事 边走边写
export const SCENERY = [{ k: 'tree', ch: '树', x: 200, s: 1.1 }, { k: 'flow', ch: '花', x: 640, s: 1 }, { k: 'cloud', ch: '云', x: 900, y: 230, s: 1.1 }, { k: 'lamp', ch: '灯', x: 1250, s: 1 },
  { k: 'tree', ch: '树', x: 1700, s: 0.9 }, { k: 'flow', ch: '花', x: 2150, s: 1.1 }, { k: 'cloud', ch: '云', x: 2300, y: 170, s: 0.9 }];
export function scenery(ctx, t, camX) { for (const o of SCENERY) drawObj(ctx, o, ((o.x - camX * (o.k === 'cloud' ? 0.5 : 1)) % 2600 + 2600) % 2600 - 340, 2, t); }
// what each of them leaves behind: a flower, a block of code, a small whale going under
export function sprout(ctx, who, x, y, k, t, j) {
  if (k <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k);
  if (who === 'o') { const sw = Math.sin(t * 2.4 + j) * 5; ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sw * 0.4, -50, sw, -96); ctx.stroke(); flower(ctx, sw, -96, 34, t * 0.6 + j, j % 2 ? COL.yellow : COL.orange); }
  else if (who === 'k') codeBlock(ctx, 0, -78, 112, 72, { rot: (j % 2 ? 0.06 : -0.06), lw: 4 });
  else { ctx.restore(); char(ctx, 'w02', x, y + 8, 116 * k, { shadow: false, blink: 0, rot: Math.sin(t * 3 + j) * 0.12, sway: 0 }); return; }
  ctx.restore();
}
export function sWalkWrite(ctx, t) {
  const V = 300, camX = 2000 + V * (t - 108.0), OX = 900, near = E.io(sat(t, 108.1, 109.5)), FX = lerp(250, 480, near), KX = lerp(1610, 1330, near);
  const OK1 = 109.60, OK2 = 109.88, WR = [110.20, 110.43, 110.66, 110.91];
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.03 + 0.03 * sat(t, 108, 111.25), cx: 960, cy: GY, seed: 39 }, () => {
    worldBack(ctx, t, camX, true);
    scenery(ctx, t, camX);
    roadPages(ctx, camX);
    // 边走边写: a line behind each of them, and something comes up out of it on every syllable
    [[FX, 2, 'f'], [OX, 0, 'o'], [KX, 1, 'k']].forEach(([x, c, who]) => {
      const L = Math.min(340, V * (t - WR[0])); if (L <= 0) return;
      ctx.strokeStyle = TRI[c]; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
      for (let s = 0; s <= L; s += 8) { const px = x - 40 - s, wx = px + camX, py = GY + 40 + Math.sin(wx * 0.045) * 7 + Math.sin(wx * 0.11) * 3; if (s) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
      ctx.stroke();
      WR.forEach((T, j) => { const p = sat(t, T, T + 0.26); if (p > 0) { const sx = x - 40 - V * (t - T); sprout(ctx, who, sx, GY + 40, E.back(p), t, j); sparkle(ctx, t, T, sx, GY - 10, TRI[c], 6, 30, 80); } });
    });
    const wb = walkBob(t), cheer = sq(t, OK2, 1.5), jmp = t >= WR[0] ? 46 * Math.abs(Math.sin(sat(t, WR[0], WR[0] + 0.4) * Math.PI)) : 0;
    char(ctx, walkId('f', t, 0.5), FX, GY + 24, 420, { lift: hopOn(t, 0.5, 16), windX: -5, flutter: 2 });
    char(ctx, walkId('k', t, 0.25), KX, GY + 22, 430, { lift: hopOn(t, 0.25, 16), windX: -4, flutter: 2 });
    char(ctx, walkId('o', t), OX, GY + 24, 470, { lift: wb.lift + jmp, rot: wb.rot + (t < OK1 ? 0.035 : 0), windX: -6, flutter: 2, sx: cheer.sx, sy: cheer.sy });
    // the questions she is still carrying
    [[-84, -556, OK1], [4, -612, OK2], [92, -560, WR[0]]].forEach(([dx, dy, T], i) => {
      const x = OX + dx + Math.sin(t * 2.2 + i * 2) * 8, y = GY + dy + Math.cos(t * 2.6 + i) * 8 - wb.lift;
      if (t < T) cutGlyph(ctx, '？', x, y, 64, i === 1 ? COL.yellow : COL.orange, { rot: Math.sin(t * 1.7 + i) * 0.14 + (i - 1) * 0.2 });
      else if (i < 2) { const p = sat(t, T, T + 0.2); if (p < 1) cutGlyph(ctx, '？', x, y, 64, COL.orange, { s: 1 + 0.6 * p, alpha: 1 - p }); sparkle(ctx, t, T, x, y, COL.orange, 8, 30, 90); }
      else { const dt = t - T; butterfly(ctx, '？', x + 260 * dt + 60 * dt * dt, y - 150 * dt - 80 * dt * dt, 64, COL.orange, t * 14, 0.4 * sat(dt, 0, 0.5), 1, sat(dt, 0.1, 0.45)); }
    });
    // 没事 × 2
    [[KX - 20, GY - 560, OK1, 1, 30], [FX + 40, GY - 520, OK2, 2, 24]].forEach(([x, y, T, c, tail]) => {
      const a = 1 - sat(t, 110.5, 110.75); if (t < T || a <= 0) return;
      ctx.save(); ctx.globalAlpha = a;
      if (bubble(ctx, x, y, 150, 112, sat(t, T, T + 0.22), TRI[c], tail)) tick(ctx, 0, 0, 34, sat(t, T + 0.06, T + 0.26) * 4, TRI[c]);
      ctx.restore();
    });
  });
  bokeh(ctx, t, { n: 9, seed: 158, alpha: 0.14, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
}

// ------------------------------------------------------------------ 1:51.25–1:54  只有明天 哪一页都没说
// The same book, the same blank page. This time there are three carets on it, like three people in one document.
export function bookSpread(ctx, t, li, ri, rt) {
  const cov = () => rrect(ctx, PX - PW - 34, PY - 16, PW * 2 + 68, PH + 62, 24);
  ctx.save(); ctx.shadowColor = 'rgba(50,30,10,0.42)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30; cov(); ctx.fillStyle = '#5A3320'; ctx.fill(); ctx.restore();
  cov(); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.save(); ctx.setLineDash([10, 9]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,220,170,0.45)'; rrect(ctx, PX - PW - 22, PY - 5, PW * 2 + 44, PH + 40, 16); ctx.stroke(); ctx.restore();
  for (let k = 5; k >= 1; k--) for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * k * 3.2, k * 3.4); pagePath(ctx, side); ctx.fillStyle = k % 2 ? '#F1E7D2' : '#E6DAC2'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(COL.ink, 0.45); ctx.stroke(); ctx.restore(); }
  pageFace(ctx, -1, li, t); pageFace(ctx, 1, ri, rt);
  const sway = Math.sin(t * 1.4) * 5;
  ctx.beginPath(); ctx.moveTo(PX + 22, PY + PH + 30); ctx.lineTo(PX + 46, PY + PH + 30); ctx.lineTo(PX + 50 + sway, PY + PH + 104); ctx.lineTo(PX + 37 + sway, PY + PH + 88); ctx.lineTo(PX + 24 + sway, PY + PH + 104); ctx.closePath();
  ctx.fillStyle = COL.orange; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX, PY + 18); ctx.lineTo(PX, PY + PH + 18); ctx.stroke();
}
export const WHO = [[COL.orange, '橙子'], ['#2FA676', 'Ko'], ['#3F6FD0', '大肥鱼']];
// a caret with its owner's name on it
export function namedCaret(ctx, x, y, h, c, name, on, tagA = 1, k = 1) {
  if (on) { ctx.fillStyle = c; ctx.fillRect(x, y - h / 2, Math.max(5, h * 0.14), h); }
  if (tagA <= 0) return;
  const fs = 17 * k, w = measure(ctx, name, fs, 700, '"Noto Sans SC"') + 16 * k;
  ctx.save(); ctx.globalAlpha *= tagA; ctx.fillStyle = c; rrect(ctx, x, y - h / 2 - 27 * k, w, 25 * k, 6 * k); ctx.fill();
  text(ctx, name, x + w / 2, y - h / 2 - 14 * k, { size: fs, weight: 700, color: COL.white, fam: '"Noto Sans SC"' }); ctx.restore();
}
export function sBook3(ctx, t) {
  const zp = E.io(sat(t, 111.25, 112.9)), xl = PX + 78, IN = [0, 112.60, 112.83], TURN = [113.04, 113.24, 113.40], ALL = 113.54;
  cam(ctx, t, { z: 1.1 + 0.42 * zp, cx: 960, cy: 540, x: -330 * zp, y: 120 * zp, rot: -0.02 + 0.02 * zp, seed: 40 }, () => {
    paper(ctx, '#E1D3B8', 0.3);
    miniPage(ctx, 1770, 250, 190, 250, 0.14); miniPage(ctx, 1800, 290, 190, 250, -0.06);
    bookSpread(ctx, t, 2, 3, undefined);
    ctx.save(); pagePath(ctx, 1); ctx.clip();
    const gl = ctx.createRadialGradient(xl + 200, PY + 300, 20, xl + 200, PY + 300, 560); gl.addColorStop(0, 'rgba(255,214,150,0.36)'); gl.addColorStop(1, 'rgba(255,214,150,0)');
    ctx.fillStyle = gl; ctx.fillRect(PX, PY - 40, PW + 20, PH + 90); ctx.restore();
    const ul = E.out(sat(t, 112.08, 112.5));         // 明天
    if (ul > 0) { ctx.strokeStyle = COL.orange; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(xl - 2, PY + 150); ctx.quadraticCurveTo(xl + 70 * ul, PY + 160, xl + 140 * ul, PY + 148); ctx.stroke(); }
    WHO.forEach(([c, name], i) => {
      if (t < IN[i]) return;
      const inn = E.back(sat(t, IN[i], IN[i] + 0.25)), x = xl + 4 + (i ? (1 - inn) * 460 : 0), y = PY + 205 + i * 46;
      const on = t >= ALL ? true : t >= TURN[0] ? (t >= TURN[i] && t < TURN[i] + 0.17) : ((t + i * 0.29) % 0.86) < 0.5;
      const h = 40 * (1 + (t >= ALL ? 0.5 * hit(t, ALL, 7) : t >= TURN[i] ? 0.4 * hit(t, TURN[i], 12) : 0));
      namedCaret(ctx, x, y, h, c, name, on, Math.min(1, inn));
    });
    const rp = sat(t, ALL, ALL + 0.45);
    if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.orange, 0.7 * (1 - rp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(xl + 6, PY + 251, 30 + 150 * E.out(rp), 0, TAU); ctx.stroke(); }
  });
  ctx.save(); ctx.filter = 'blur(7px)';             // three heads over it, out of focus
  char(ctx, 'k02', 290, 1800 - hopOn(t, 0.25, 14), 1000, { shadow: false, blink: 0, sway: 0.5 });
  char(ctx, 'f02', 1640, 1770 - hopOn(t, 0.5, 14), 980, { shadow: false, blink: 0, sway: 0.5 });
  char(ctx, 'o09', 960, 1890 - hopOn(t, 0, 14), 1150, { shadow: false, blink: 0, sway: 0.5 });
  ctx.restore();
  bokeh(ctx, t, { n: 9, seed: 159, alpha: 0.13 });
  finish(ctx);
}

// ------------------------------------------------------------------ 1:54–1:58.56  那就三个人 一起去看看
// Her study again, where the door was. Now the blank page itself is standing there, as tall as a door. Three strokes,
// one each, make 三; pushed together they are 一; and the three of them go through it.
const D3 = { gy: 920, px: 1540, pw: 400, ph: 620 };
function study(ctx, t) {
  paper(ctx);
  shelf(ctx, 70, 1130, 170, 5, 150, 300); shelf(ctx, 1840, 2300, 170, 5, 150, 400);
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const u = i / 40, x = -40 + u * 2000, y = 62 + 50 * Math.sin(Math.PI * u); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const u = (i + 0.7) / 12.6, x = -40 + u * 2000, y = 62 + 50 * Math.sin(Math.PI * u), a = Math.sin(t * 1.8 + i * 1.3) * 0.1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = i % 4 === 2 ? COL.peach : COL.white; ctx.fillRect(-22, 0, 44, 60); ctx.lineWidth = 2.5; ctx.strokeRect(-22, 0, 44, 60);
    ctx.fillStyle = rgba(COL.ink, 0.35); for (let k = 0; k < 3; k++) ctx.fillRect(-14, 14 + k * 12, 28, 2.5);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(245,237,221,0.42)'; ctx.fillRect(-300, -300, W + 900, D3.gy + 300);
  ctx.fillStyle = '#EEE3CC'; ctx.fillRect(-300, D3.gy, W + 900, 500);
  ctx.strokeStyle = rgba(COL.ink, 0.15); ctx.lineWidth = 2;
  for (let i = -6; i <= 22; i++) { const xi = i * 150 - 100; ctx.beginPath(); ctx.moveTo(xi, D3.gy); ctx.lineTo(D3.px + (xi - D3.px) * 2.3, D3.gy + 300); ctx.stroke(); }
}
export function sDoor3(ctx, t) {
  const C3 = [114.61, 114.84, 115.08], ONE = 115.43, SHOOT = 115.90, GO = 116.31, LEAP = 116.57, IN = 116.96, WHT = 117.3;
  const WHOX = [600, 340, 860], POSE = [['o38', 'o50'], ['k01', 'k14'], ['f01', 'f17']], SZ = [450, 400, 400];
  const whip = E.in(sat(t, 118.31, 118.56)) * 2700, white = E.in(sat(t, IN, WHT)), pcx = D3.px, pcy = D3.gy - D3.ph / 2;
  if (t < WHT) cam(ctx, t, { z: 1.03 + 0.03 * sat(t, 114, 116.3) + 0.5 * E.in(sat(t, GO, WHT)), cx: lerp(960, pcx, E.io(sat(t, GO, IN))), cy: 600, seed: 43 }, () => {
    study(ctx, t);
    // the page, standing
    const glow = 0.5 + 0.5 * sat(t, SHOOT, SHOOT + 0.3) + 0.3 * hit(t, SHOOT + 0.25, 4);
    rays(ctx, pcx, pcy, t * 0.8, 0.24 * glow, COL.yellow, 12);
    const gl = ctx.createRadialGradient(pcx, pcy, 60, pcx, pcy, 760); gl.addColorStop(0, rgba('#FFE9B8', 0.75 * glow)); gl.addColorStop(1, rgba('#FFE9B8', 0)); ctx.fillStyle = gl; ctx.fillRect(pcx - 800, pcy - 800, 1600, 1600);
    const pg = () => { ctx.beginPath(); ctx.moveTo(pcx - D3.pw / 2, D3.gy); ctx.lineTo(pcx - D3.pw / 2 + 14, D3.gy - D3.ph); ctx.lineTo(pcx + D3.pw / 2 + 14, D3.gy - D3.ph - 8); ctx.lineTo(pcx + D3.pw / 2, D3.gy); ctx.closePath(); };
    ctx.fillStyle = 'rgba(60,40,20,0.16)'; ctx.beginPath(); ctx.ellipse(pcx, D3.gy + 6, 260, 20, 0, 0, TAU); ctx.fill();
    cut(ctx, pg, COL.white, 0.3, 40, 0); pg(); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
    text(ctx, '明天', pcx - D3.pw / 2 + 54, D3.gy - D3.ph + 78, { size: 50, weight: 800, align: 'left', color: COL.orange, ls: 4 });
    ctx.fillStyle = rgba(COL.ink, 0.11); for (let r = 0; r < 9; r++) ctx.fillRect(pcx - D3.pw / 2 + 50, D3.gy - D3.ph + 150 + r * 50, D3.pw - 90, 2);
    WHO.forEach(([c], i) => { if (((t + i * 0.29) % 0.86) < 0.5) { ctx.fillStyle = c; ctx.fillRect(pcx - D3.pw / 2 + 54, D3.gy - D3.ph + 110 + i * 50, 6, 36); } });
    // 三: a stroke each. 一起: pushed together they are one line, and it points the way.
    const one = E.io(sat(t, ONE - 0.06, ONE + 0.2)), shoot = E.in(sat(t, SHOOT - 0.04, SHOOT + 0.28));
    [[-100, 100, 196], [-78, 78, 268], [-134, 134, 344]].forEach(([a, b, y], i) => {
      const p = E.out(sat(t, C3[i] - 0.05, C3[i] + 0.13)); if (p <= 0 || shoot >= 1) return;
      const x0 = lerp(600 + a, 240 + i * 244, one) + shoot * 1500, x1 = lerp(600 + b, 484 + i * 244, one) + shoot * 1500, yy = lerp(y, 270, one) + (pcy - 270) * shoot * 0.6;
      stroke(ctx, q => [lerp(x0, x1, q), yy + Math.sin(q * Math.PI) * -6], q => 20 + 16 * Math.sin(Math.PI * Math.min(1, q * 1.1)), p, TRI[i], { rim: COL.white, rimW: 12, alpha: 1 - sat(shoot, 0.6, 1) });
      sparkle(ctx, t, C3[i], 600, y, TRI[i], 7, 150, 210);
    });
    sparkle(ctx, t, ONE, 600, 270, COL.yellow, 12, 380, 460);
    // the three of them
    [1, 2, 0].forEach(i => {
      const T = C3[i], inn = i === 0 ? 1 : sat(t, T - 0.22, T), arrive = E.out(inn); if (inn <= 0) return;
      const dl = [0.13, 0, 0.26][i], s = sq(t, T, 1.6), run = E.in(sat(t, GO, LEAP + 0.1 + dl)), fly = sat(t, LEAP + dl, IN + 0.1 + dl), b = bop(t, 1.2);
      const x0 = lerp(i === 0 ? WHOX[0] : i === 1 ? -260 : W + 260, WHOX[i], arrive), xr = x0 + run * 330, x = lerp(xr, pcx + [0, -40, 40][i], E.io(fly)), k = 1 - 0.66 * E.out(fly);
      const lift = (i && inn < 1 ? Math.sin(inn * Math.PI) * 110 : 0) + (t >= ONE && t < GO ? hopOn(t, i * 0.25, 20) : 0) + Math.sin(fly * Math.PI) * 170 + fly * [190, 300, 110][i];
      const id = t >= LEAP + dl ? POSE[i][1] : t >= GO ? walkId('okf'[i], t, i * 0.3) : POSE[i][0];
      char(ctx, id, x, D3.gy + (i === 0 ? 4 : 0), SZ[i] * k, { lift: lift + (t >= LEAP + dl ? SZ[i] * k * 0.42 : 0), rot: t >= LEAP + dl ? -0.25 * Math.sin(fly * Math.PI) : 0, sx: s.sx * b.sx, sy: s.sy * b.sy, alpha: 1 - sat(fly, 0.7, 0.95), shadowA: 1 - fly, flutter: t >= GO ? 4 : 0, windX: t >= GO ? -8 : 0, blink: t >= LEAP + dl ? 0 : undefined });
    });
    const rp = sat(t, IN, IN + 0.4);
    if (rp > 0) { ctx.strokeStyle = rgba(COL.orange, 0.8 * (1 - rp)); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(pcx, pcy, 80 + 500 * E.out(rp), 0, TAU); ctx.stroke(); }
  });
  // through it: nothing but page, and the three of them going the same way
  if (white > 0) {
    ctx.save(); ctx.globalAlpha = Math.min(1, white * 1.2); ctx.fillStyle = COL.white; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (t >= WHT) {
    const sp = 1 + 2.2 * E.in(sat(t, 117.3, 118.56)), slide = (1 - E.out(sat(t, WHT, WHT + 0.45))) * 1100;
    cam(ctx, t, { z: 1.0 + 0.06 * sat(t, 117.2, 118.56), x: -whip, seed: 44, hand: 4 }, () => {
      ctx.fillStyle = COL.white; ctx.fillRect(-300, -300, W + 3600, H + 600);
      for (let i = 0; i < 40; i++) {                 // the lines of the page going by
        const y = 40 + rnd(i, 911) * 1000, len = 180 + rnd(i, 912) * 520, x = W + 300 - (((t * (700 + rnd(i, 913) * 900) * sp) + rnd(i, 914) * 3000) % (W + 1400));
        ctx.strokeStyle = rgba(COL.ink, 0.1 + rnd(i, 915) * 0.12); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
      }
      text(ctx, '第 10483 页', 1650, 960, { size: 34, weight: 500, color: COL.inkSoft, ls: 4, alpha: 0.8 });
      [[420, 380, 1, 'k14', 400], [1480, 400, 2, 'f17', 400], [960, 590, 0, 'o50', 480]].forEach(([x, y, c, id, sz], i) => {
        const bobY = Math.sin(t * 5 + i * 2) * 14, xx = x + (t - WHT) * 60 - slide * (1 + i * 0.25);
        for (let r = 0; r < 3; r++) {               // what each of them trails
          ctx.strokeStyle = rgba(TRI[c], 0.85 - r * 0.25); ctx.lineWidth = 16 - r * 4; ctx.lineCap = 'round'; ctx.beginPath();
          for (let s = 0; s <= 1500; s += 30) { const px = xx - 150 - s, py = y - 20 + bobY + r * 26 + Math.sin(s * 0.012 - t * 9 + i * 2 + r) * (10 + s * 0.03); if (s) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
          ctx.stroke();
        }
        char(ctx, id, xx, y + bobY, sz, { shadow: false, flutter: 6, windX: -14, rot: Math.sin(t * 4 + i * 2) * 0.05 });
      });
      caret(ctx, 1730 + (t - WHT) * 60, 760, 150, t, COL.orange, 12);
    });
  }
  finish(ctx, { light: 0.6 * (1 - white) });
}
