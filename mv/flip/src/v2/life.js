// v2 §19: life in the scenes from 0:20 on (本人 10-22: “场景和人物都很单调”, and without more cuts or pose changes). Creatures, crowds
// and props (Image 2 sheets n_deep, n_laugh_boats, n_wall_people, n_newyear, n_reach_boats) placed in the original paintings,
// moving on their own: things pass behind and in front of her, people react, the weather and light move. Each function says
// what it adds and why it belongs to the line. bg* functions run just over the background painting (plus.js cfg.bg), so the
// shot's own characters and effects stay on top; fg* functions run over the whole shot.
import { W, H, TAU, clamp, lerp, sat, E, rnd, sheet, frame } from './core.js';
import { bdMap, prop, img } from '../common.js';
import { rgba } from '../lib.js';

// draw frame k of a sheet with its height h (px), standing on (x, y) (o.anchor 'body': centred on (x, y))
export function put(ctx, id, k, x, y, h, o = {}) {
  const s = sheet(id), f = s?.frames[k]; if (!f) return;
  frame(ctx, id, k, x, y, h / f.h, { anchor: o.anchor ?? 'bottom', flip: o.flip, rot: o.rot, alpha: o.alpha, filter: o.filter, sx: o.sx, sy: o.sy });
}
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
const twinkle = (ctx, t, n, y0, y1, seed, a = 0.9) => { ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < n; k++) { const x = rnd(k, seed) * W, y = lerp(y0, y1, rnd(k, seed + 1)), b = a * Math.max(0, Math.sin(t * (1.5 + 2 * rnd(k, seed + 2)) + k * 2.1)) ** 6;
    if (b < 0.02) continue; ctx.strokeStyle = rgba('#FFFFFF', b); ctx.lineWidth = 2; const r = 6 + 6 * rnd(k, seed + 3);
    ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x + r, y); ctx.moveTo(x, y - r); ctx.lineTo(x, y + r); ctx.stroke(); }
  ctx.restore(); };
function gull(ctx, t, t0, t1, x0, y0, x1, y1, w, flip) {                 // a gull crossing, wings beating
  const p = sat(t, t0, t1); if (p <= 0 || p >= 1) return;
  prop(ctx, 'prop_gull', lerp(x0, x1, p), lerp(y0, y1, p) + Math.sin(p * 9) * 18, w, { flip, sy: 0.8 + 0.25 * Math.sin(t * 15 + x0) });
}
function flash(ctx, x, y, t, t0) {                                        // a camera flash
  const d = t - t0; if (d < 0 || d > 0.25) return; glow(ctx, x, y, 260, '#FFFFFF', 0.9 * (1 - d / 0.25));
}

// ---------------------------------------------------------------- 于是我憋了一口气: the sea she stands in is alive: under the
// surface in front of her a shoal turns and two jellyfish glow (she is about to dive into all that)
export function underSurface(ctx, t, wl) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, wl + 6, W, H); ctx.clip();
  const sx = lerp(-200, W + 300, sat(t, 19.0, 21.6));
  put(ctx, 'n_deep', 0, sx, wl + 150, 150, { anchor: 'body', alpha: 0.45, filter: 'blur(1px)', flip: true });
  for (const [x, ph] of [[360, 0], [1560, 2]]) { const y = wl + 120 + Math.sin(t * 1.4 + ph) * 12;
    glow(ctx, x, y, 140, '#E3B5FF', 0.35); put(ctx, 'n_deep', 1, x, y, 150, { anchor: 'body', alpha: 0.4 }); }
  ctx.restore();
}

// ---------------------------------------------------------------- 沉到最深 最深的: she sinks past the life of the deep, layer by
// layer: a shoal, a jellyfish, a huge manta gliding over, an anglerfish whose lamp lights her, and at the bottom the wrecks
// of the market (sunk candles, an old computer still glowing). Everything drifts up as we go down.
export function deepPass(ctx, t, front) {
  const up = (t0, v) => (t - t0) * v;                                       // how far a thing has risen since t0
  if (!front) {
    if (t > 22.9 && t < 24.4) { const p = sat(t, 22.9, 24.4);              // the manta, far behind, crossing
      put(ctx, 'n_deep', 2, lerp(W + 400, -500, p), 360 - up(22.9, 90), 560, { anchor: 'body', alpha: 0.5, filter: 'blur(3px) brightness(0.6)', rot: -0.2 }); }
    if (t > 21.9 && t < 23.1) put(ctx, 'n_deep', 0, lerp(-300, W + 300, sat(t, 21.9, 23.1)), 760 - up(21.9, 320), 300, { anchor: 'body', alpha: 0.85, flip: true });   // the shoal
    if (t > 22.3 && t < 24.0) { const x = 380, y = 1250 - up(22.3, 900);   // a jellyfish rising past on the left
      glow(ctx, x, y, 220, '#E3B5FF', 0.4); put(ctx, 'n_deep', 1, x, y, 300, { anchor: 'body', alpha: 0.9 }); }
    if (t > 23.9) { const y = H + 420 - up(23.9, 700);                        // the floor coming up: sunk candles, the old computer
      put(ctx, 'n_deep', 4, 470, y, 360, { anchor: 'body' }); put(ctx, 'n_deep', 5, 1450, y + 40, 330, { anchor: 'body' }); glow(ctx, 1450, y, 200, '#7FD0FF', 0.35); }
    return;
  }
}
// her lit by the anglerfish's lamp as it comes close
export const anglerLight = () => [];                                       // 本人 10-22: the anglerfish (灯泡鱼) was too much: gone

// ---------------------------------------------------------------- 地方 / 一块钱 一百万个字 (the seabed study): the study is lived in:
// the shoal circles behind her, bubbles; when the words pour out, the
// shoal swims through the stream of words and the jellyfish light up
export function studyBg(ctx, t, M) {
  const ang = (t - 24.43) * 0.9, [cx, cy] = M.pt(700, 230);
  put(ctx, 'n_deep', 0, cx + Math.cos(ang) * 320, cy + Math.sin(ang) * 60, 150, { anchor: 'body', alpha: 0.75, flip: Math.sin(ang) > 0 });
}
export function wordsFg(ctx, t) {
  if (t < 27.5) return;
  const p = sat(t, 27.5, 28.6);                                               // the shoal darts through the stream of words
  put(ctx, 'n_deep', 0, lerp(-250, W + 250, p), lerp(620, 300, p) + Math.sin(p * 9) * 30, 230, { anchor: 'body', flip: true, alpha: 0.9 });
  for (const [x, y] of [[300, 220], [1560, 330]]) glow(ctx, x, y, 220, '#FFE7A0', 0.3 * sat(t, 27.6, 28.0));
}

// ---------------------------------------------------------------- 他们笑我 是拼多多: it is not four boats, it is everyone: more
// boats row in from the sides while the line plays, all laughing and pointing at her, rocking with laughter; on 是 (the sticker)
// they all crack up together
const LAUGH = [[0, 620, 262, 80, 28.6], [2, 930, 258, 78, 28.75], [1, 470, 345, 125, 28.9], [3, 1080, 345, 125, 29.05]];      // [frame, x, y (waterline), h, t0] (bg09b px): in the gaps between the painted boats
export function laughBg(ctx, t, M) {
  const roar = t > 30.82 ? Math.exp(-2.5 * (t - 30.82)) : 0;
  LAUGH.forEach(([k, ix, iy, h, t0], i) => {
    const inn = E.out(sat(t, t0, t0 + 0.7)); if (inn <= 0) return;
    const side = k < 2 ? -1 : 1, [x, y] = M.pt(ix - side * (1 - inn) * 500, iy);
    const shake = Math.sin(t * (9 + i) + i) * (0.03 + 0.05 * roar), hop = Math.abs(Math.sin(t * 10 + i)) * 6 * (1 + 2 * roar);
    put(ctx, 'n_laugh_boats', k, x, y - hop, h * M.s, { rot: shake });
  });
}

// ---------------------------------------------------------------- 便宜 不是随便 (the forge under the sea): the forge burns (embers
// rising, the fire's glow breathing on everything), and each hammer blow sends the fish scattering and a ring through the water
const HITS = [31.62, 32.35, 33.56];
export function forgeBg(ctx, t, M) {
  const [fx, fy] = M.pt(170, 330), br = 0.25 + 0.1 * Math.sin(t * 9) + 0.06 * Math.sin(t * 23);
  glow(ctx, fx, fy, 700 * M.s, '#FF9A3C', br);
  const last = HITS.filter(h => t >= h).pop(), scat = last ? E.out(sat(t, last, last + 0.6)) : 0, n = HITS.filter(h => t >= h).length;
  const [sx, sy] = M.pt(1150, 140);                                         // the shoal in the water behind, fleeing at each blow
  put(ctx, 'n_deep', 0, sx + (n * 180 + scat * 240) * (n % 2 ? 1 : -1) * 0.5, sy - scat * 40 + Math.sin(t * 2) * 10, 170 * M.s, { anchor: 'body', alpha: 0.75, flip: n % 2 === 0 });
}
export function forgeFg(ctx, t, M) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const [fx, fy] = M.pt(200, 380);
  for (let k = 0; k < 26; k++) { const life = 1.6, age = ((t + rnd(k, 3) * life) % life), x = fx + (rnd(k, 4) - 0.5) * 220 + Math.sin(age * 4 + k) * 30, y = fy - age * 380;
    ctx.fillStyle = rgba(k % 3 ? '#FFB347' : '#FFE08A', 0.9 * (1 - age / life)); ctx.beginPath(); ctx.arc(x, y, 3 + 3 * rnd(k, 5), 0, TAU); ctx.fill(); }
  ctx.restore();
  for (const h of HITS) { const d = t - h; if (d < 0 || d > 0.6) continue;  // a ring through the water from the anvil
    const [ax, ay] = M.pt(660, 495), r = 80 + d * 1400; ctx.save(); ctx.strokeStyle = rgba('#DDF6FF', 0.6 * (1 - d / 0.6)); ctx.lineWidth = 8 * (1 - d / 0.6);
    ctx.beginPath(); ctx.ellipse(ax, ay, r, r * 0.45, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
}

// ---------------------------------------------------------------- 等着吧 等过年: waiting, then New Year bursts in: plum petals drift
// the whole time; on 过年 the firecrackers by the window go off, red envelopes fly through the room, dumplings steam on the table
export function newYearBg(ctx, t, M) {
  const [px, py] = M.pt(250, 650);                                          // dumplings on the table by the window
  put(ctx, 'n_newyear', 4, px, py, 110 * M.s);
  if (t > 36.16) { ctx.save(); ctx.globalCompositeOperation = 'screen'; for (let k = 0; k < 4; k++) { const d = ((t - 36.16) * 0.6 + k / 4) % 1;
    ctx.fillStyle = rgba('#FFFFFF', 0.25 * Math.sin(d * Math.PI)); ctx.beginPath(); ctx.arc(px + Math.sin(d * 6 + k) * 18 * M.s, py - 70 * M.s - d * 160 * M.s, (14 + d * 20) * M.s, 0, TAU); ctx.fill(); } ctx.restore(); }
  const [cx, cy] = M.pt(1330, 220), shake = t > 36.16 ? Math.sin(t * 60) * 0.06 : 0;       // a firecracker string on the right wall
  put(ctx, 'n_newyear', 0, cx, cy + 230 * M.s, 240 * M.s, { rot: shake, alpha: t > 36.16 ? 1 : 0.0 });
  if (t > 36.16) for (let k = 0; k < 4; k++) { const d = ((t - 36.16) * 3 + k / 4) % 1; glow(ctx, cx + (rnd(k + Math.floor((t - 36.16) * 3), 5) - 0.5) * 120 * M.s, cy + (60 + rnd(k, 6) * 150) * M.s, 90 * M.s, '#FFD36B', 0.6 * (1 - d)); }
}
export function newYearFg(ctx, t) {
  for (let k = 0; k < 9; k++) {                                              // plum petals drifting down
    const life = 3.2, age = (t + rnd(k, 31) * life) % life, x = rnd(k, 32) * W + Math.sin(age * 2 + k) * 60 + age * 40, y = -40 + age / life * (H + 80);
    put(ctx, 'n_newyear', 3, x, y, 46, { anchor: 'body', rot: age * 2 + k, alpha: 0.9 });
  }
  if (t > 36.2) for (let k = 0; k < 5; k++) {                               // red envelopes flying through
    const t0 = 36.25 + k * 0.33, p = sat(t, t0, t0 + 1.3); if (p <= 0 || p >= 1) continue;
    const y = 200 + k * 120 + Math.sin(p * 6) * 40; put(ctx, 'n_newyear', 1, lerp(k % 2 ? W + 120 : -120, k % 2 ? -120 : W + 120, p), y, 110, { anchor: 'body', rot: p * 6 * (k % 2 ? -1 : 1) });
  }
}

// ---------------------------------------------------------------- 我只是 (asleep): the night room breathes: moonlight dust in the air
// and her Zzz drifting up, until 翻
export function sleepFg(ctx, t, x, y) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 24; k++) { const life = 4, age = (t + rnd(k, 41) * life) % life, px = rnd(k, 42) * W * 0.55 + Math.sin(age + k) * 20, py = rnd(k, 43) * H - age * 20;
    ctx.fillStyle = rgba('#CFE0FF', 0.5 * Math.sin(age / life * Math.PI)); ctx.beginPath(); ctx.arc(px, py, 2 + 2 * rnd(k, 44), 0, TAU); ctx.fill(); }
  ctx.restore();
  if (t < 39.02) for (let k = 0; k < 3; k++) { const d = ((t - 38.38) * 0.7 + k / 3) % 1;
    ctx.save(); ctx.globalAlpha = Math.sin(d * Math.PI) * 0.9; ctx.font = `800 ${46 + k * 12}px "Noto Sans SC"`; ctx.fillStyle = '#E8F0FF'; ctx.strokeStyle = '#1B2A6B'; ctx.lineWidth = 6;
    ctx.strokeText('z', x + 60 + d * 90, y - 200 - d * 170); ctx.fillText('z', x + 60 + d * 90, y - 200 - d * 170); ctx.restore(); }
}

// ---------------------------------------------------------------- 浪一路拍到了华尔街: the street is full of people, and they run:
// a banker with his briefcase and a woman with her phone flee ahead of the wave and are swept up; after the crash a man hangs on
// to a lamppost, a taxi floats past, a photographer close to us keeps flashing
export function wallFg(ctx, t) {
  const lvl = t > 45.14 ? E.out(sat(t, 45.14, 46.6)) * 230 + Math.sin(t * 3) * 8 : 0, wy = H - lvl;
  [[0, 44.3, 980, 330], [1, 44.45, 1010, 310]].forEach(([k, t0, y, h], i) => {   // running from the wave, then swept
    if (t < t0) return; const run = sat(t, t0, 45.14), sw = E.in(sat(t, 45.0, 45.7));
    const x = lerp(-200 + i * 120, 1050 + i * 120, run) + sw * 900, yy = y - Math.abs(Math.sin(t * 13 + i)) * 20 * (1 - sw) - sw * 380;
    put(ctx, 'n_wall_people', k, x, yy, h, { rot: sw * 2.6 * (i ? -1 : 1), alpha: 1 - sat(t, 45.5, 45.9) });
  });
  if (t > 45.4) { const x = 1460, sh = Math.sin(t * 40) * 0.03;                 // hanging on to a lamppost in the flood
    put(ctx, 'n_wall_people', 2, x, H + 40, 520, { rot: sh, alpha: sat(t, 45.4, 45.6) }); }
  if (t > 45.6) { const p = sat(t, 45.6, 47.3);                                 // a taxi floating past
    put(ctx, 'n_wall_people', 3, lerp(-260, 900, p), wy + 70 + Math.sin(t * 3) * 10, 220, { rot: Math.sin(t * 2) * 0.08 }); }
  const [px, py] = [1790, 1110];                                               // the photographer close to us on the right, flashing
  if (t > 44.35) { put(ctx, 'n_wall_people', 4, px, py, 430, { flip: true }); for (const f of [44.6, 44.95, 45.2, 45.7, 46.3]) flash(ctx, px - 100, py - 290, t, f); }
}

// ---------------------------------------------------------------- 把全世界 都叫醒一遍: the whole world: the stars around the Earth
// twinkle; in the bedroom the city outside wakes up with her, window after window lighting up, birds taking off at dawn
export function earthFg(ctx, t) { if (t < 49.19) twinkle(ctx, t, 30, 0, H, 61, 0.8); }
export function bedroomBg(ctx, t, M) {
  if (t < 49.19) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 40; k++) { const t0 = 49.3 + rnd(k, 71) * 1.2; if (t < t0) continue;
    const [x, y] = M.pt(1020 + rnd(k, 72) * 480, 150 + rnd(k, 73) * 270), a = sat(t, t0, t0 + 0.12);
    ctx.fillStyle = rgba('#FFE7A0', 0.85 * a); ctx.fillRect(x - 4 * M.s, y - 6 * M.s, 8 * M.s, 12 * M.s); }
  ctx.restore();
  const [gx, gy] = M.pt(1250, 240); gull(ctx, t, 49.6, 51.0, gx - 300 * M.s, gy, gx + 400 * M.s, gy - 120 * M.s, 70 * M.s, true);
}

// ---------------------------------------------------------------- 别人把灯藏在山顶: the night sea between the peaks is not empty:
// the line of little boats from the start is still rowing towards the lights, far below; the stars twinkle, one falls
export function peaksBg(ctx, t, M) {
  twinkle(ctx, t, 26, 0, H * 0.45, 81, 0.7);
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 18; k++) { const u = k / 18, [x, y] = M.pt(lerp(480, 860, u) + (t - 51) * 6, lerp(760, 690, u)), b = 0.8 + 0.2 * Math.sin(t * 6 + k);
    ctx.fillStyle = rgba('#FFD27A', 0.85 * b); ctx.beginPath(); ctx.arc(x, y, (4 - u * 2) * M.s, 0, TAU); ctx.fill();
    glow(ctx, x, y, (18 - u * 8) * M.s, '#FFB347', 0.4 * b); }
  ctx.restore();
  if (t > 51.25 && t < 51.9) { const q = sat(t, 51.25, 51.85), sx = lerp(W * 0.75, W * 0.4, q), sy = lerp(60, 230, q);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(sx, sy, sx + 240, sy - 100);
    g.addColorStop(0, rgba('#FFFFFF', 0.95 * Math.sin(q * Math.PI))); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 240, sy - 100); ctx.stroke(); ctx.restore(); }
}

// ---------------------------------------------------------------- 我把地图铺在海面 / 谁想去远方 / 都拿去吧 不要钱: dawn at sea, with
// gulls; then the people: boats full of people reach up for the copies of the map, and cheer as the scrolls fly out to them
export function dawnFg(ctx, t, t0) {
  gull(ctx, t, t0 + 0.2, t0 + 2.6, -120, 240, W + 120, 120, 120, true);
  gull(ctx, t, t0 + 0.9, t0 + 3.2, W + 120, 180, -120, 260, 90, false);
  twinkle(ctx, t, 18, H * 0.4, H * 0.7, 91, 0.6);
}
export function reachFg(ctx, t) {                                              // 谁想去远方: two boats close in the corners, reaching up
  [[1, 250, 0], [3, 1680, 1]].forEach(([k, x, side], i) => {
    const inn = E.out(sat(t, 57.2 + i * 0.15, 57.8 + i * 0.15)); if (inn <= 0) return;
    const bob = Math.sin(t * 3 + i) * 8, xx = x + (side ? 1 : -1) * (1 - inn) * 500;
    put(ctx, 'n_reach_boats', k, xx, H + 70 + bob, 400, { rot: Math.sin(t * 2 + i) * 0.03 });
    const c = 57.94 + i * 0.25; if (t > c && t < c + 0.5) { const p = E.out(sat(t, c, c + 0.45));      // a copy of the map flies into their hands
      prop(ctx, 'prop_map', lerp(W / 2, xx, p), lerp(420, H - 280, p) - Math.sin(p * Math.PI) * 160, lerp(160, 110, p), { rot: (1 - p) * 2 * (side ? 1 : -1) }); }
  });
}
export function trayBg(ctx, t, M) {                                            // 都拿去吧: boats far out on the sea, people waving
  [[0, 280, 470], [2, 610, 455]].forEach(([k, ix, iy], i) => {
    const [x, y] = M.pt(ix, iy); put(ctx, 'n_reach_boats', k, x, y + Math.sin(t * 3 + i) * 4, 120 * M.s, { alpha: 0.95 });
  });
}

// ---------------------------------------------------------------- verse 2 to the end: the plain shots get their small life
function steam(ctx, t, x, y, s = 1, n = 4, seed = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < n; k++) { const d = ((t * 0.55) + k / n + rnd(k, seed) * 0.2) % 1;
    ctx.fillStyle = rgba('#FFFFFF', 0.22 * Math.sin(d * Math.PI)); ctx.beginPath(); ctx.arc(x + Math.sin(d * 5 + k + seed) * 16 * s, y - d * 150 * s, (10 + d * 22) * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function zzz(ctx, t, x, y, t0, t1, s = 1) {                                     // a sleeper's Zzz drifting up
  if (t < t0 || t > t1) return;
  for (let k = 0; k < 3; k++) { const d = ((t - t0) * 0.7 + k / 3) % 1;
    ctx.save(); ctx.globalAlpha = Math.sin(d * Math.PI) * 0.9 * (1 - sat(t, t1 - 0.2, t1)); ctx.font = `800 ${(40 + k * 12) * s}px "Noto Sans SC"`; ctx.fillStyle = '#E8F0FF'; ctx.strokeStyle = '#1B2A6B'; ctx.lineWidth = 6;
    ctx.strokeText('z', x + d * 80 * s, y - d * 150 * s); ctx.fillText('z', x + d * 80 * s, y - d * 150 * s); ctx.restore(); }
}
function motes(ctx, t, x0, x1, y0, y1, col, n = 24, seed = 41) {                // dust in a beam of light
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < n; k++) { const life = 4, age = (t + rnd(k, seed) * life) % life, px = lerp(x0, x1, rnd(k, seed + 1)) + Math.sin(age + k) * 20, py = lerp(y0, y1, rnd(k, seed + 2)) - age * 18;
    ctx.fillStyle = rgba(col, 0.55 * Math.sin(age / life * Math.PI)); ctx.beginPath(); ctx.arc(px, py, 2 + 2.5 * rnd(k, seed + 3), 0, TAU); ctx.fill(); }
  ctx.restore();
}
// 活干到一半 我说 我去吃饭: her lunch is hot (steam off it while she holds it up), the desk lamp's light full of dust
export function deskFg(ctx, t) { if (t > 68.62 && t < 70.0) steam(ctx, t, 400, 620, 1.1, 4, 3); motes(ctx, t, 0, 700, 80, 700, '#FFE2A8', 18, 51); }
// 编译太慢 我先眯一会儿: Zzz over her on the rack
export function napFg(ctx, t) { zzz(ctx, t, 1010, 430, 73.8, 75.5); }
// 你等过一整个春节: the dinner is still hot, steam over every dish, while nobody gets an answer
export function dinnerFg(ctx, t) { for (const [x, y, i] of [[470, 560, 0], [760, 600, 1], [1000, 650, 2], [620, 700, 3]]) steam(ctx, t, x, y, 1.2, 4, i * 7); }
// 我只是翻了个身 (chorus 2, the night room): moonlight dust and her Zzz until she rolls over
export function nightRollFg(ctx, t) { motes(ctx, t, 0, W * 0.6, 0, H, '#CFE0FF', 24, 61); zzz(ctx, t, 820, 430, 92.6, 93.38); }
// 那天早上 八点十一 / 五个小时: the coffee steams, sunlight dust over the desk; a gull passes the window
export function deskMorningBg(ctx, t, M) {
  const [cx, cy] = M.pt(1221, 560); steam(ctx, t, cx, cy, M.s / 1.3, 4, 9);
  const [gx, gy] = M.pt(700, 150); gull(ctx, t, 118.6, 120.3, gx - 600 * M.s, gy, gx + 500 * M.s, gy - 60 * M.s, 60 * M.s, true);
  gull(ctx, t, 125.0, 126.6, gx + 500 * M.s, gy - 30 * M.s, gx - 600 * M.s, gy + 20 * M.s, 50 * M.s, false);
}
export function deskMorningFg(ctx, t) { motes(ctx, t, W * 0.2, W, 0, H * 0.8, '#FFE9B8', 26, 71); }
// 谁想去远方 (sunrise, the dandelion): out on the sea the boats from before are waiting for her seeds, and reach up as they fly over
export function dandelionBg(ctx, t, M) {
  [[0, 860, 440, 0], [3, 1040, 470, 1], [2, 1210, 450, 2]].forEach(([k, ix, iy, i]) => {
    const [x, y] = M.pt(ix, iy); put(ctx, 'n_reach_boats', k, x, y + Math.sin(t * 3 + i) * 3, 120 * M.s, { alpha: 0.95 });
  });
  const [gx, gy] = M.pt(900, 150); gull(ctx, t, 164.7, 166.9, gx - 500 * M.s, gy, gx + 700 * M.s, gy - 80 * M.s, 70 * M.s, true);
}
