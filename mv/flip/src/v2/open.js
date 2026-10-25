// v2 opening, 0–10.2 s (重做方案-v2.md §3, 本人 10-21 “效果可以 按这个做”, plus: finer water, surfing back).
// 本人 10-21 later: no big face at the start (it changes too little, people swipe away) -> 0–1.65 s is a dive from the sky
// into the sea of numbers and a chase through the K-line pillars.
// Times are the song's (full-version clock): kicks and sung characters measured from analysis/ (see the doc).
import { W, H, TAU, clamp, lerp, sat, E, rnd, img, plate, sheet, nFrames, frame, at, seq, camera, withRoll, billboard, cover, burst,
  stream, sea, strip, shake, stop, bottomOf } from './core.js';

// ---- measured times
export const KICK = [0.87, 1.65, 2.25, 2.46, 2.85, 3.25, 3.45, 4.05, 4.85, 5.24, 5.65, 5.85, 6.05, 6.45, 6.84, 7.24, 7.45, 8.05, 8.84, 9.25, 9.65];
   // 翻 好 几 遍: a flip line crosses the sea (1: left to right)
const LIGHTS = [[8.24, [0.92, 0.88, 1.0], '#EDE6FF'], [8.75, [1.0, 0.72, 0.42], '#FFB35A'], [9.22, [0.45, 0.75, 1.0], '#5DBBFF']];
// shot boundaries
export const T_PLUNGE = 0.87, T_UP = 1.65, T_BREACH = 2.46, T_SURF = 3.247,   // T_SURF: the original BREACH_END, sA2 takes over
  T_SURF_OLD = 3.61, T_LAND = 5.85, T_BLACK = 5.93, T_NIGHT = 5.97, T_WHIP = 9.76, T_END = 10.25;
const DIGIT_BURSTS = [[1.07, 3], [1.23, 5]];                                     // 海 里: digits burst out of her under water
// extra motion-blur sub-frames where things move fast (main.js multiplies q there)
export const FAST = [[0, 0.95, 10], [0.85, 1.3, 10], [1.62, 2.44, 8], [2.44, 2.62, 10], [3.2, 3.6, 8]];     // 3.2–3.6: sA2's landing (as in v1)

function darkFill(ctx, c) { ctx.fillStyle = c; ctx.fillRect(-W, -H, 3 * W, 3 * H); }
export function bubbles(ctx, t, o = {}) {                // bubbles rising past the lens
  stream(t, { period: o.period ?? 0.045, life: o.life ?? 2.2, seed: o.seed ?? 5 }, (i, p, age, r) => {
    const x = r(1) * W - (o.drift ?? 0) * age, y = H + 80 - p * (H + 260) * (0.7 + r(2) * 0.6) - (o.rise ?? 0), sz = 10 + r(3) * 34 * (o.big ?? 1);
    frame(ctx, 'fx_drops', [2, 12][Math.floor(r(4) * 2)], x + Math.sin(age * 3 + i) * 14, y, sz / 120, { alpha: (0.5 + 0.5 * r(5)) * Math.min(1, p * 6) * (o.alpha ?? 0.8) });
  });
}
export function digits(ctx, t, o = {}) {                 // glowing digits (Image 2, fx_digits) drifting, the near ones big and soft
  stream(t, { period: o.period ?? 0.05, life: o.life ?? 3, seed: o.seed ?? 11 }, (i, p, age, r) => {
    const near = r(1) > 0.82, x = ((r(2) * (W + 400) - (o.drift ?? 0) * age) % (W + 400) + W + 400) % (W + 400) - 200, y = H + 60 - p * (H + 200);
    const s = (near ? 110 + r(3) * 90 : 34 + r(3) * 40) / 280;
    frame(ctx, 'fx_digits', Math.floor(r(4) * 12), x, y, s, { alpha: (near ? 0.45 : 0.75) * Math.sin(p * Math.PI) * (o.alpha ?? 1), filter: near ? 'blur(5px)' : undefined, rot: (r(6) - 0.5) * 0.6 });
  });
}

// ---------------------------------------------------------------- S1 0.00–0.87  我从数字的: she dives head first from the sky
function S1(ctx, t) {
  const p = sat(t, 0, T_PLUNGE), z = lerp(1.05, 2.3, Math.pow(p, 1.7));
  withRoll(ctx, lerp(-0.25, 0.15, E.io(p)), 1.0, () => cover(ctx, plate('p_sea_above'), { z: z * 1.25, fx: 0.5, fy: 0.52 }));
  // wind-torn spray streaking up past her (the sea rushing at us)
  stream(t + 1, { period: 0.008, life: 0.4, seed: 31 }, (i, q, age, r) => {
    const ang = r(1) * TAU, d0 = 200 + r(2) * 900, d = d0 * (1 + q * 2.5);
    frame(ctx, 'fx_drops', [3, 4, 5][i % 3], W / 2 + Math.cos(ang) * d, H / 2 + Math.sin(ang) * d, (30 + r(3) * 50) / 260, { rot: ang + Math.PI / 2, alpha: 0.75 * Math.sin(q * Math.PI) });
  });
  // the sea of numbers sprays digits up at us on 数 and 字
  [[0.39, 3], [0.63, 5]].forEach(([t0, sd]) => burst(ctx, t, t0, W / 2, H * 0.55, { sheet: 'fx_digits', frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], n: 12, seed: sd,
    ang: [-Math.PI, Math.PI], speed: [900, 1700], g: 0, drag: 1.2, life: [0.6, 0.9], size: [120, 260], w: 60 }));
  const k = t < 0.62 ? 0 : 1, sc = lerp(1.9, 2.15, p);
  frame(ctx, 'a_dive', k, W / 2 + Math.sin(t * 17) * 8, H * 0.5, sc, { rot: lerp(-0.12, 0.1, p) });
}

// ---------------------------------------------------------------- S2 0.87–2.46  海里长大: one shot under water: the plunge, she unfolds,
// turns to the light and shoots up to the surface
function deepBack(ctx, scroll, o = {}) {          // kept for later shots (the side view under water, tiled sideways)
  const im = plate('p_deep_side'); if (!im) return;
  const h = H * (o.z ?? 1.12), w = h * im.width / im.height, off = ((scroll % (2 * w)) + 2 * w) % (2 * w), y = H / 2 - h / 2 + (o.y ?? 0);
  ctx.save(); if (o.filter) ctx.filter = o.filter;
  for (let x = -off - 2 * w; x < W + 2 * w; x += w) {
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); if (Math.round((x + off) / w) % 2) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  }
  ctx.restore();
}
function S2(ctx, t) {
  const tt = stop(t, [[2.25, 0.05]]);
  const rise = E.in(sat(tt, T_UP, T_BREACH)), sink = E.out(sat(tt, T_PLUNGE, 1.6));
  // the camera sinks with her momentum, then races up after her towards the light
  cover(ctx, plate('p_surface_up'), { z: 1.12 + 0.35 * rise, fy: 0.5 - 0.05 * sink + 0.12 * rise, y: -90 * sink,
    filter: `brightness(${(0.55 + 0.25 * sink + 0.6 * rise * rise).toFixed(2)})` });
  // pillar silhouettes: drifting, then streaming down past us as she rises
  const s = sheet('p_pillars');
  if (s) for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1, near = i < 4, sp = (near ? 2600 : 1100) * rise + 60;
    const x = W / 2 + side * (near ? 800 + rnd(i, 8) * 280 : 460 + rnd(i, 8) * 420);
    const y = ((rnd(i, 9) * (H + 900) + (tt - T_PLUNGE) * sp + rise * rise * 1600 * (near ? 1 : 0.4)) % (H + 900)) - 300;
    frame(ctx, 'p_pillars', i % 8, x, y, near ? 1.15 : 0.55, { anchor: 'cell', cy: 0.5, alpha: near ? 0.8 : 0.55, filter: near ? 'blur(10px) brightness(0.55)' : 'blur(3px) brightness(0.75)' });
  }
  digits(ctx, tt, { alpha: 0.55 });
  bubbles(ctx, tt, { period: 0.03, life: 1.6, rise: -rise * 700, big: 1.2 });
  // her: tumbling in the bubbles, unfolding (海), turning to the light, then shooting up (from 1.65, the kick)
  let k, sid = 'a_dive', sc = 2.0, rot = 0, x = W / 2, y = H * 0.52;
  if (tt < 1.07) { k = 2; rot = lerp(-2.4, 0, E.out(sat(tt, T_PLUNGE, 1.07))); sc = lerp(1.8, 2.0, sat(tt, T_PLUNGE, 1.07)); }
  else if (tt < 1.45) { k = 3; y = H * 0.52 + Math.sin((tt - 1.07) * 7) * 10; sc = 2.05; }
  else if (tt < T_UP) { k = 7; y = H * 0.54 - (tt - 1.45) * 120; sc = 2.05; }
  else { sid = 'a_rise'; k = Math.min(3, Math.floor((tt - T_UP) / 0.2)); y = lerp(H * 0.62, H * 0.36, Math.pow(sat(tt, T_UP, T_BREACH), 1.5)); sc = lerp(1.5, 1.4, rise); }
  DIGIT_BURSTS.forEach(([t0, sd], i) => burst(ctx, tt, t0, W / 2, H * 0.5, { sheet: 'fx_digits', frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], n: 14 + i * 3, seed: sd,
    ang: [-Math.PI, Math.PI], speed: [1100, 2300], g: -150, drag: 2.4, life: [0.8, 1.2], size: [110, 210], w: 40 }));
  if (tt >= T_UP) stream(tt, { period: 0.012, life: 0.5, seed: 21 }, (i, q, age, r) => {   // her bubble trail
    if (i * 0.012 < T_UP) return;
    const yy = lerp(H * 0.62, H * 0.36, Math.pow(sat(i * 0.012, T_UP, T_BREACH), 1.5)) + 330 + age * 300;
    frame(ctx, 'fx_drops', [2, 12][i % 2], W / 2 + (r(1) - 0.5) * 120, yy, (14 + r(2) * 30) / 120, { alpha: 0.85 * (1 - q) });
  });
  frame(ctx, sid, k, x, y, sc, { rot });
  // the plunge's bubble cloud over her, on twos
  const bk = seq(tt, T_PLUNGE, 6, 1 / 15);
  if (tt < T_PLUNGE + 6 / 15) frame(ctx, 'fx_bubbles', bk, W / 2, H * 0.5, [3.6, 4.0, 4.3, 4.5, 4.7, 4.8][bk], { anchor: 'cell', cx: 0.5, cy: 0.5, alpha: 1 - sat(tt, T_PLUNGE + 0.3, T_PLUNGE + 0.4) });
  if (tt >= 2.25 && tt < 2.3) { ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, 0, W, H); }
}

// ---------------------------------------------------------------- S4 2.46–3.61  红的绿的浪: she bursts out; K-line geysers
const HORIZON = 0.40;           // where the sea meets the sky (fraction of the screen height), above water
export function seaWorld(ctx, t, o = {}) {
  // big enough that it covers the frame at any roll (the diagonal is 1101 px from the centre): no pop when a flip starts
  const sw = o.swap ? '_sw' : '', hy = H * HORIZON + (o.dy ?? 0);
  const g = ctx.createLinearGradient(0, -600, 0, H + 600); g.addColorStop(0, '#5A4CB8'); g.addColorStop(0.5, '#F2A15C'); g.addColorStop(1, '#14204A');
  ctx.fillStyle = g; ctx.fillRect(-700, -700, W + 1400, H + 1400);
  cover(ctx, plate('p_sky'), { z: 1.15, fy: 0.818, y: hy - H / 2 });              // p_sky's horizon is at 0.818 of its height
  const im = plate('p_kline_sea' + sw);
  if (im) {                                                                       // p_kline_sea's horizon is at 0.21 of its height
    const w = W * 1.25, h = w * im.height / im.width, x = W / 2 - w / 2, y = hy - h * 0.21;
    sea(ctx, im, { x, y, w, h, t, amp: o.amp ?? 30, speed: o.speed ?? 1.6, horizon: 0.21, zoom: o.zoom, slot: 1, nu: 20, nv: 12 });
  }
}
export function geyser(ctx, t, t0, x, base, scale, green) {
  const id = green ? 'fx_geyser_g' : 'fx_geyser'; if (t < t0) return;
  const k = seq(t, t0, nFrames(id), 1 / 12), a = 1 - sat(t, t0 + 0.9, t0 + 1.3);
  frame(ctx, id, k, x, base, scale, { anchor: 'cell', cy: 1, alpha: a });
}
export function S4(ctx, t) {
  if (t < T_BREACH + 2 / 60) {                                    // impact frame: black silhouette on white, 2 frames
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    frame(ctx, 'fx_crown', 3, W / 2, H * 0.86, 1.9, { anchor: 'cell', cy: 1, filter: 'brightness(0)' });
    frame(ctx, 'a_breach', 2, W / 2, H * 0.52, 1.9, { filter: 'brightness(0)' });
    return;
  }
  const [sx, sy] = shake(t, [[T_BREACH, 34, 0.45], [2.52, 14, 0.3], [2.74, 14, 0.3]]);
  const hgt = E.out(sat(t, T_BREACH, 2.85)) - 0.85 * E.in(sat(t, 2.95, T_SURF));     // her height above the sea, 0..1
  const camY = -hgt * 380;                                        // the camera follows her: the sea drops away and comes back                          // the camera tilts up with her, then down for the landing
  ctx.save(); ctx.translate(sx, sy - camY);
  seaWorld(ctx, t, { amp: 34 });
  const base = H * 0.93;                                          // the waterline under her
  // geysers: two behind, one in front, red green red (each one lights her in its colour)
  geyser(ctx, t, 2.74, W * 0.80, H * 0.80, 1.15, true);          // 绿: the green one, far right (she turns to it)
  // the crown splash where she came out
  frame(ctx, 'fx_crown', seq(t, T_BREACH, 8, 1 / 12), W / 2, base, 1.75, { anchor: 'cell', cy: 1, alpha: 1 - sat(t, 3.0, 3.2) });
  // her: breach -> arch (up) -> twist and point (top) -> dives at the camera
  let k, x = W / 2, y = H * 0.5, sc = 1.9, rot = 0;
  const tk = globalThis.__frameT ?? t;                                       // the drawing is picked per output frame (no blur ghost)
  if (tk < 2.62) k = 2;                                                      // out of the water
  else { k = 3; rot = (Math.min(t, 2.80) - 2.62) * 0.3 - 0.06 * sat(t, 2.80, T_SURF); }   // arms wide at the top and on the way down (本人 10-22: no pointing)
  y = H * 0.5 + Math.sin((t - T_BREACH) * 5) * 6 + camY;                     // drawn inside the world's translate: cancel it, she stays put
  frame(ctx, 'a_breach', k, x, y, sc, { rot });
  geyser(ctx, t, 2.52, W * 0.17, H * 1.02, 1.75, false);           // 红: the red one, near left, in front of her
  burst(ctx, t, T_BREACH + 0.02, W / 2, base - 60, { n: 170, seed: 4, speed: [700, 2300], ang: [-Math.PI * 0.92, -Math.PI * 0.08], size: [14, 52], g: 2600, drag: 1.0, w: 160 });
  burst(ctx, t, 2.54, W * 0.17, H * 0.75, { n: 60, seed: 7, speed: [500, 1500], size: [14, 40], w: 120 });
  burst(ctx, t, 2.76, W * 0.80, H * 0.62, { n: 50, seed: 8, speed: [400, 1200], size: [10, 30], w: 90 });
  strip(ctx, plate('p_wave_near'), H * 1.02, H * 0.42, (t - T_BREACH) * 520);
  ctx.restore();
  // each geyser throws its colour over the frame
  for (const [t0, c] of [[2.52, '255,70,70'], [2.74, '60,255,140']]) {
    const a = t >= t0 ? 0.22 * Math.exp(-(t - t0) * 5) : 0;
    if (a > 0.003) { ctx.fillStyle = `rgba(${c},${a})`; ctx.fillRect(0, 0, W, H); }
  }
}

// ---------------------------------------------------------------- dispatch and the post pass
export function OPEN(ctx, t) {
  if (t < T_PLUNGE) return S1(ctx, t);
  if (t < T_BREACH) return S2(ctx, t);
  if (t < T_SURF) return S4(ctx, t);
  return S4(ctx, t);
}
export function postOpen(t) {
  const p = { chroma: 0, zoom: 0, shock: 0, gradeAmt: 0, flash: 0, sat: 1 };
  if (t < T_PLUNGE) { p.zoom = 0.01 + 0.06 * Math.pow(sat(t, 0, T_PLUNGE), 3); p.zx = 0.5; p.zy = 0.5; }  // the fall
  if (t >= T_PLUNGE && t < T_PLUNGE + 0.25) { p.flash = 0.5 * Math.exp(-(t - T_PLUNGE) * 22); p.shock = 0.05 * (1 - sat(t, T_PLUNGE, T_PLUNGE + 0.25)); p.sr = 0.05 + (t - T_PLUNGE) * 1.8; p.sw = 0.08; p.sx = 0.5; p.sy = 0.5; }
  if (t >= T_UP && t < T_BREACH) { const u = sat(t, T_UP, T_BREACH); p.flash = 0.22 * u * u * u; }
  const hits = [[T_BREACH, 0.05, 0.008]];
  for (const [t0, amp, ch] of hits) {
    const d = t - t0; if (d < 0 || d > 0.6) continue;
    if (amp) { p.shock = Math.max(p.shock, amp * (1 - d / 0.6)); p.sr = 0.05 + d * 1.6; p.sw = 0.07; p.sx = 0.5; p.sy = t0 === T_BREACH ? 0.85 : 0.75; }
    p.chroma = Math.max(p.chroma, ch * Math.exp(-d * 8));
  }
  if (t >= T_SURF) return { chroma: 0, zoom: 0, shock: 0, gradeAmt: 0, flash: 0, sat: 1 };
  return p;
}
