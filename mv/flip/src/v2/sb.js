// v2 §15: 0:00–0:19 storyboarded (本人 10-21: design the shots, the camera and how each action is split across them around
// what each line has to land; 重做方案-v2.md §15 has the shot list). Song clock (= the trailer's clock up to 61.97).
// Each shot says what it is for. Poses come from v2 sheets (n_*, a_*, c_*) and v1 sprites; v1 backgrounds are reused where the
// camera angle matches.
import { W, H, TAU, clamp, lerp, sat, E, rnd, plate, sheet, frame, seq, cover, burst, stream, sea, strip, shake, stop } from './core.js';
import { backdrop, bdMap, balloon, prop, ripples, img } from '../common.js';
import { char, placeBy, anchorPt } from '../chars.js';
import { rgba, noise } from '../lib.js';
import { bubbles, digits, seaWorld, S4 as BREACH, T_BREACH, T_SURF } from './open.js';
import { withPoses, litOver } from './plus.js';
import * as A from '../scenesA.js';

// scratch canvases (cleared before each use)
let LAYER = null, MASK = null;
function scratch(ctx, c) {
  if (!c || c.width !== ctx.canvas.width || c.height !== ctx.canvas.height) c = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
  x.clearRect(0, 0, c.width, c.height); x.setTransform(ctx.getTransform());
  return c;
}
const ALL_DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const FT = t => globalThis.__frameT ?? t;                               // pick drawings by the output frame (no blended ghost of two)

// ================================================================ 我从数字的海里长大 (0.02–2.40): she comes out of a sea made
// of numbers and grows up out of it (重读：数字的海、长大). 本人 10-21: the first sample's sinking camera into the deep sea has
// more feeling (kept); when the camera finds her at 0:01 she should be bigger.
// ---- A 0.00–1.07 我从数字的: the camera is already sinking fast through the sea of numbers (digits and K-line pillars streaming up
// past the lens), slowing as it finds her at the bottom, big in frame, curled up asleep in a glow
function shotA(ctx, t) {
  const p = sat(t, 0, 1.07), trav = 1 - Math.pow(1 - p, 2.4);              // distance sunk, slowing down
  cover(ctx, plate('p_abyss'), { z: lerp(1.3, 1.5, trav), fy: lerp(0.34, 0.66, trav), filter: `brightness(${lerp(1.0, 0.62, trav).toFixed(2)})` });
  const s = sheet('p_pillars');                                           // pillars: mid layer, streaming up
  if (s) for (let i = 0; i < 9; i++) {
    const side = i % 2 ? 1 : -1, near = i < 3;
    const x = W / 2 + side * (near ? 760 + rnd(i, 4) * 300 : 380 + rnd(i, 4) * 420);
    const y = ((rnd(i, 5) * (H + 1200) - trav * (near ? 4200 : 2200)) % (H + 1200) + (H + 1200)) % (H + 1200) - 350;
    frame(ctx, 'p_pillars', i % 8, x, y, near ? 1.25 : 0.6, { anchor: 'cell', cy: 0.5, alpha: near ? 0.85 : 0.6, filter: near ? 'blur(9px) brightness(0.6)' : 'blur(2px) brightness(0.8)' });
  }
  // her: rising into the frame from below as the camera comes down to her, big (about two thirds of the frame tall at the cut)
  const q = E.out(sat(t, 0.4, 1.07)), y = lerp(H + 560, H * 0.53, q), sc = lerp(1.15, 1.5, q);
  if (q > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const r = 560 * sc, g = ctx.createRadialGradient(W / 2, y, 0, W / 2, y, r);
    g.addColorStop(0, rgba('#9FE6FF', 0.7 * q)); g.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(W / 2 - r, y - r, 2 * r, 2 * r); ctx.restore();
    frame(ctx, 'a_breach', 0, W / 2, y + Math.sin(t * 2.5) * 6, sc);
  }
  for (let i = 0; i < 46; i++) {                                          // digits: the near layer, the fastest, over everything
    const near = i < 10, sp = near ? 5200 : 2600 + rnd(i, 1) * 1400;
    const x = rnd(i, 2) * (W + 200) - 100, y = ((rnd(i, 3) * (H + 400) - trav * sp) % (H + 400) + (H + 400)) % (H + 400) - 200;
    if (q > 0 && Math.abs(x - W / 2) < (near ? 420 : 300) && y > H * 0.1) continue;      // keep the digits off her
    const flare = [0.39, 0.63].reduce((v, f) => v + (t >= f ? Math.exp(-7 * (t - f)) : 0), 0);   // 数, 字: the numbers flare
    frame(ctx, 'fx_digits', i % 12, x, y, (near ? 230 + rnd(i, 4) * 120 : 50 + rnd(i, 4) * 60) / 280,
      { alpha: (near ? 0.5 : 0.8) * (1 - 0.6 * p * (near ? 1 : 0)), filter: `${near ? 'blur(6px) ' : ''}brightness(${(1 + 1.4 * flare).toFixed(2)})`, rot: (rnd(i, 6) - 0.5) * 0.5, sy: 1 + (1 - p) * (near ? 0.8 : 0.3) });
  }
}
// ---- B 1.07–2.46 海里长大: close on her face as she wakes (海 eyes closed, 里 they flutter, 长 open); the camera pulls back as she
// unfolds, and on 大 she kicks and shoots up out of the top of the frame towards the light
function shotB(ctx, t) {
  const up = E.in(sat(t, 2.05, 2.46)), tk = FT(t);                         // the camera tilts up after her
  cover(ctx, plate('p_surface_up'), { z: 1.25, fy: lerp(0.66, 0.36, up), filter: `brightness(${(lerp(0.45, 0.7, sat(t, 1.6, 2.05)) + 0.6 * up * up).toFixed(2)}) blur(${t < 1.7 ? 4 : 0}px)` });
  digits(ctx, t, { alpha: 0.5, period: 0.06 });
  bubbles(ctx, t, { period: 0.04, life: 2.0, rise: -up * 900 });
  const glow = (x, y, r, a) => { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba('#9FE6FF', a)); g.addColorStop(1, 'rgba(120,220,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
  if (tk < 1.72) {                                                         // the face: 海 asleep, 里 stirring, 长 awake
    const k = tk < 1.23 ? 0 : tk < 1.61 ? 1 : 2, push = sat(t, 1.07, 1.72);
    glow(W / 2, H * 0.52, 620, 0.35);
    frame(ctx, 'a_wake', k, W / 2, H * 0.53 + Math.sin(t * 2.5) * 6, 1.95 + 0.12 * push, { anchor: 'cell', cx: 0.5, cy: 0.5 });
    return;
  }
  if (tk < 2.05) {                                                         // the pull back: her whole body unfolding, getting smaller in frame
    const back = E.out(sat(t, 1.72, 2.05)), sc = lerp(3.3, 1.55, back), y = lerp(H * 0.95, H * 0.55, back);
    glow(W / 2, y - 140 * sc / 1.55, 420, 0.3);
    frame(ctx, 'a_dive', 3, W / 2, y, sc);
    return;
  }
  // 大: the kick; she shoots up and out of the top of the frame, bubbles streaming off her
  const k = Math.min(3, Math.floor((tk - 2.05) / 0.08)), y = lerp(H * 0.55, -H * 0.45, Math.pow(sat(t, 2.05, 2.42), 1.6));
  stream(t, { period: 0.01, life: 0.45, seed: 23 }, (i, q, age, r) => {
    if (i * 0.01 < 2.05) return;
    const yy = lerp(H * 0.55, -H * 0.45, Math.pow(sat(i * 0.01, 2.05, 2.42), 1.6)) + 300 + age * 500;
    frame(ctx, 'fx_drops', [2, 12][i % 2], W / 2 + (r(1) - 0.5) * 140, yy, (14 + r(2) * 34) / 120, { alpha: 0.85 * (1 - q) });
  });
  frame(ctx, 'a_rise', k, W / 2, y, 1.55);
}

// ================================================================ 红的绿的浪 (2.52–3.49): the breach (v2 sample E, accepted) puts
// her in the air between a red and a green geyser; 浪: she lands on the K-line sea and rides it
// ---- C 2.46–3.247: open.js S4 as it is

// ================================================================ 一天翻好几遍 (3.61–5.85): the sea turns over (red <-> green), again
// and again, faster and faster; she rides it unbothered (重读：翻、好几遍 —— the contrast is the point)
// A turn of the sea is a crest rolling in from the horizon: ahead of it the old colour, behind it the new one.
const HZ02 = 0.24;                                                         // bg02: the horizon (fraction of the image height)
// hits: when each crest reaches screen height yHit (her board); span: how long a crest takes from the horizon to past the bottom
function turnedSea(ctx, o, t, hits, span, yHit) {
  const M = bdMap('bg02_kline_sea', o), hy = M.pt(0, (img('bg02_kline_sea')?.height ?? 1024) * HZ02)[1], bot = H + 160;
  const at = Math.pow(clamp((yHit - hy) / (bot - hy)), 1 / 1.7);            // how far through its run a crest is when it reaches her
  const fronts = hits.map((h, i) => { const d = typeof span === 'number' ? span : span[i]; return [h - at * d, h + (1 - at) * d]; });
  const fy = ([a, b]) => lerp(hy, bot, Math.pow(sat(t, a, b), 1.7));        // perspective: slow far off, fast up close
  const done = fronts.filter(f => t >= f[1]).length, live = fronts.filter(f => t >= f[0] && t < f[1]);
  const state = n => (n % 2 ? 'bg02b_kline_sea_swap' : 'bg02_kline_sea');
  backdrop(ctx, state(done), o);
  live.forEach((f, i) => {                                                  // oldest (lowest) first; each newer one above it
    const y = fy(f); ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, y + 50); ctx.clip(); backdrop(ctx, state(done + i + 1), o); ctx.restore();
  });
  live.forEach((f, n) => {                                                  // the crest: a band of foam rolling in, throwing spray
    const y = fy(f), d = clamp((y - hy) / (H - hy)), a = sat(d, 0, 0.06), sc = 0.25 + 1.6 * d;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(0, y - 120 * sc, 0, y + 20 * sc);       // the lit face behind it
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.8, rgba('#FFF4DA', 0.35 * a)); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(-50, y - 120 * sc, W + 100, 140 * sc); ctx.restore();
    const step = 70 * sc + 30, n0 = Math.ceil((W + 300) / step);
    for (let k = 0; k < n0; k++) {                                         // foam clouds along the line, tumbling
      const x = k * step - 150 + (rnd(k, n + 3) - 0.5) * step * 0.6, ph = t * 7 + k * 1.3;
      frame(ctx, 'fx_drops', [9, 10, 8][k % 3], x, y - 10 * sc + Math.sin(ph) * 6 * sc, (140 + 60 * rnd(k, n + 5)) * sc / 260, { anchor: 'cell', cx: 0.5, cy: 0.7, alpha: a, rot: Math.sin(ph) * 0.15 });
    }
    for (let k = 0; k < n0 * 2; k++) {                                     // spray thrown up off the top
      const x = (k + 0.5) * step / 2 - 150, ph = (t * 3 + rnd(k, n + 7)) % 1;
      frame(ctx, 'fx_drops', [0, 1, 13, 15][k % 4], x + ph * 30 * sc, y - (30 + 140 * ph) * sc + ph * ph * 160 * sc, (14 + 26 * rnd(k, n + 9)) * sc / 120, { rot: -0.3, alpha: a * (1 - ph) });
    }
  });
  return { hy, at: y => fronts.filter(f => t >= f[0] && fy(f) >= y).length };   // how many turns have reached screen height y
}
// ---- D 3.247–4.40 浪 / 一天翻: v1's shot (本人 liked it): she drops onto her board and rides off to the right, the camera
// panning with her. On 翻 the first crest rolls in and reaches her: she hops it and the board turns green with the sea.
function shotD(ctx, t) {
  const o = { z: 1.18, fx: lerp(0.38, 0.55, sat(t, 3.247, 4.4)), fy: 0.6 };
  const LAND = 3.527, land = sat(t, 3.247, LAND), slap = t > LAND ? Math.exp(-8 * (t - LAND)) : 0;
  const bx = 900 + Math.sin(t * 1.3) * 30, base = 800 + Math.sin(t * 2.4) * 10 - (1 - E.out(land)) * 700 + slap * 24;
  const S = turnedSea(ctx, o, t, [3.9], 0.62, 810);
  const turned = S.at(base + 10) % 2 === 1, tHit = 3.9;
  const hop = t > tHit - 0.06 ? (t < tHit ? Math.sin((t - tHit + 0.06) / 0.06 * Math.PI / 2) : Math.exp(-7 * (t - tHit))) : 0;
  const by = base - hop * 90, tilt = Math.sin(t * 2.4 + 0.6) * 0.04 - hop * 0.06, id = turned ? 'd25g' : 'd25', sz = 650;
  const [fx, fy] = placeBy(id, ...A.SURF.board, bx, by, sz, { rot: tilt }), [tx, ty] = anchorPt(id, fx, fy, sz, ...A.SURF.tail, { rot: tilt });
  if (t > LAND - 0.02) { ripples(ctx, t, bx, base + 40, 360, { alpha: 0.7 * (1 - sat(t, LAND, LAND + 1.2)) }); }
  if (land >= 1) burst(ctx, t, LAND, bx, base + 30, { n: 50, seed: 41, speed: [400, 1300], size: [12, 34], w: 160, life: [0.5, 0.9] });
  if (land >= 1) stream(t, { period: 0.012, life: 0.55, seed: 44 }, (i, q, age, r) => {      // spray off the back of the board
    frame(ctx, 'fx_drops', [3, 4, 5, 0][i % 4], tx - age * 900 - r(1) * 40, ty - Math.sin(q * Math.PI) * (40 + 80 * r(2)) + age * 120, (14 + 22 * r(3)) / 260, { rot: -1.3, alpha: 0.85 * (1 - q) });
  });
  char(ctx, id, fx, fy, sz, { sway: 1.4, windX: -0.6, shadow: false, rot: tilt });
  if (t > tHit) burst(ctx, t, tHit, bx, base + 20, { n: 30, seed: 47, speed: [300, 1000], size: [12, 30], w: 260, life: [0.4, 0.7] });
}
// ---- E 4.40–5.88 好几遍: the camera comes round in front of her: she rides along the wave towards us, big, a hand on her
// headpiece, while crest after crest rolls in under her, faster and faster. On 好、几、遍 she hops one (without looking down);
// the ones between just pass under her board. On 遍 she winks at us.
const E_HITS = [4.40, 4.80, 5.00, 5.20, 5.32, 5.44, 5.56, 5.68], E_HOPS = [4.40, 5.00, 5.44];
function shotE(ctx, t) {
  const o = { z: lerp(1.32, 1.42, sat(t, 4.4, 5.88)), fx: 0.5 + Math.sin(t * 0.9) * 0.02, fy: 0.62 };
  const by = H * 0.95 + Math.sin(t * 3.1) * 8;
  const S = turnedSea(ctx, o, t, E_HITS, E_HITS.map((h, i) => lerp(0.7, 0.4, i / (E_HITS.length - 1))), by - 20);
  const last = E_HOPS.filter(h => t >= h - 0.06).pop() ?? -9, d = t - last;
  const hop = d > -0.06 && d < 0.24 ? Math.sin(sat(d, -0.06, 0.24) * Math.PI) : 0;
  const pass = E_HITS.reduce((v, h) => v + Math.exp(-Math.pow((t - h) / 0.05, 2)), 0);      // a crest passing under the board: a little bob
  const tk = FT(t), hk = (() => { const l = E_HOPS.filter(h => tk >= h - 0.06).pop() ?? -9, dd = tk - l; return dd > -0.06 && dd < 0.24 ? Math.sin(sat(dd, -0.06, 0.24) * Math.PI) : 0; })();
  const k = tk >= 5.44 ? 3 : hk > 0.3 ? 1 : tk >= 5.0 ? 2 : 0;
  const turned = S.at(by - 30) % 2 === 1, id = turned ? 'n_surf_front_sw' : 'n_surf_front';
  for (const h of E_HITS) burst(ctx, t, h, W / 2, by - 30, { n: E_HOPS.includes(h) ? 30 : 14, seed: Math.round(h * 100), speed: [300, 1000], size: [12, 30], w: 460, life: [0.35, 0.6] });
  const x = W / 2 + Math.sin(t * 1.7) * 20, y = by - hop * 70 - pass * 10, fo = { anchor: 'bottom', rot: Math.sin(t * 2.2) * 0.02 };
  frame(ctx, id, k, x, y, 1.62, fo);
  // each crest's light catches her edge: red or green
  const fw = (sheet(id)?.frames[k]?.w ?? 500) * 1.62, a = Math.min(1, pass) * 0.45;
  if (a > 0.01) litOver(ctx, [[turned ? '#3CFF8C' : '#FF4646', a, -1]], c => frame(c, id, k, x, y, 1.62, fo), [x - fw * 0.55, x + fw * 0.55]);
}

// ================================================================ 远远的山顶上 灯一盏一盏亮 (5.97–9.64): the lights are far away and
// high up, she is down in the dark; they come on one at a time, and each one's light runs across the sea all the way to her —
// someone else's light (重读：远远的、山顶、一盏一盏). One shot: the camera starts close behind her on the rock and rises, pulling
// back, to the peaks (in v1's framing, all three lamps in view); then it holds still so each lamp coming on reads.
const HZ03 = 530;                                                          // bg03: the horizon (image px)
function shotF(ctx, t) {
  const u = E.io(sat(t, 5.97, 7.7));
  const o = { z: lerp(1.45, 1.04, u), fx: lerp(0.27, 0.47, u), fy: lerp(0.76, 0.52, u) };
  backdrop(ctx, 'bg03_lighthouses', o);
  const M = bdMap('bg03_lighthouses', o), hy = M.pt(0, HZ03)[1];
  const lamps = A.LAMPS.filter(l => t >= l[3]);
  if (lamps.length) {                                                       // the lit painting: around each lamp, and down its path
    MASK = scratch(ctx, MASK); const m = MASK.getContext('2d');
    for (const [ix, iy, , t0] of lamps) {
      const [x, y] = M.pt(ix, iy), a = E.out(sat(t, t0, t0 + 0.25)), r = 520 * M.s;
      const g = m.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.55, `rgba(0,0,0,${0.85 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = g; m.fillRect(x - r, y - r, 2 * r, 2 * r);
      const front = lerp(hy, H + 60, Math.pow(sat(t, t0 + 0.03, t0 + 0.5), 1.5)), w0 = 46 * M.s, w1 = 190 * M.s;      // the path
      const pg = m.createLinearGradient(0, hy, 0, front); pg.addColorStop(0, 'rgba(0,0,0,1)'); pg.addColorStop(0.85, 'rgba(0,0,0,0.9)'); pg.addColorStop(1, 'rgba(0,0,0,0)');
      m.fillStyle = pg; m.beginPath(); const wf = lerp(w0, w1, (front - hy) / (H - hy));
      m.moveTo(x - w0, hy); m.lineTo(x + w0, hy); m.lineTo(x + wf, front); m.lineTo(x - wf, front); m.fill();
    }
    LAYER = scratch(ctx, LAYER); const l = LAYER.getContext('2d');
    backdrop(l, 'bg03b_lighthouses_lit', o);
    l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(MASK, 0, 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAYER, 0, 0); ctx.restore();
  }
  for (const [ix, iy, col, t0] of lamps) {                                  // beams, the flare, glints racing down the path
    const [x, y] = M.pt(ix, iy), a = E.out(sat(t, t0, t0 + 0.25)), beam = (t - t0) * 0.9 + (ix % 3);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(10px)';
    ctx.translate(x, y); ctx.rotate(-0.4 + Math.sin(beam) * 0.5);
    const bg = ctx.createLinearGradient(0, 0, 760 * M.s, 0); bg.addColorStop(0, rgba(col, 0.2 * a)); bg.addColorStop(0.5, rgba(col, 0.06 * a)); bg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(700 * M.s, -48 * M.s); ctx.lineTo(700 * M.s, 48 * M.s); ctx.lineTo(0, 3); ctx.fill();
    ctx.rotate(Math.PI); ctx.fill(); ctx.filter = 'none';
    const fl = 1 + 1.6 * Math.exp(-6 * (t - t0)), flare = ctx.createRadialGradient(0, 0, 0, 0, 0, 120 * M.s * fl);
    flare.addColorStop(0, rgba('#FFFFFF', a)); flare.addColorStop(0.3, rgba(col, 0.8 * a)); flare.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = flare; ctx.fillRect(-400, -400, 800, 800);
    ctx.restore();
    const front = lerp(hy, H + 60, Math.pow(sat(t, t0 + 0.03, t0 + 0.5), 1.5));
    if (t < t0 + 0.55) { ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let k = 0; k < 9; k++) { const gx = x + (rnd(k, ix) - 0.5) * lerp(60, 330, (front - hy) / (H - hy)) * M.s, gy = front - rnd(k, ix + 1) * 40;
        ctx.fillStyle = rgba('#FFFFFF', 0.9); ctx.beginPath(); ctx.ellipse(gx, gy, 10, 3, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = rgba(col, 0.6); ctx.beginPath(); ctx.ellipse(gx, gy, 26, 7, 0, 0, TAU); ctx.fill(); }
      ctx.restore(); }
  }
  if (t > 6.3 && t < 7.1) { const q = sat(t, 6.3, 7.0), [sx0, sy0] = M.pt(1250 / 1.25, 90), sx = lerp(sx0, sx0 - 730, q), sy = lerp(sy0, sy0 + 210, q);   // v1's shooting star
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(sx, sy, sx + 260, sy - 75);
    g.addColorStop(0, rgba('#FFFFFF', 0.95 * Math.sin(q * Math.PI))); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 260, sy - 75); ctx.stroke(); ctx.restore(); }
  // her, on the rock: 远远的 head down, 山 she looks up; each lamp: a start, leaning in, up on her knees, reaching out to them.
  // Each lamp's light reaches her when its path does (and stays on her, in its colour)
  const lit = () => A.LAMPS.map(([, , col, t0]) => [col, sat(t, t0 + 0.38, t0 + 0.55) * (0.3 + 0.35 * Math.exp(-3 * Math.max(0, t - t0 - 0.55))), 1]);
  // 本人 10-23 (0:09–0:10 尾巴有瑕疵): n_a3 / n_a3b drew the tail as a loose leaf beside her, its root a point, not under her
  // skirt. c_d05 is v1's own drawing on the rock (tail down from under the skirt, the fluke at the end): she looks up the whole
  // time, and on the third lamp her hand goes to her chest
  // 本人 10-23 (v9): the tail is right but she does too little -> n_a3c, the tail hanging over the edge in every drawing: head
  // down, 山 looks up, then one move per lamp: a start, leaning in, reaching out to them
  withPoses({ d05: { sheet: 'n_a3c', ref: 1, keys: [[0, 0], [6.75, 1], [8.3, 2], [9.02, 3], [9.25, 5]], lit } }, t, () => {
    const sz = 430 * M.s, [rx, ry] = M.pt(430, 716), [fx, fy] = placeBy('d05', ...A.SEAT_D05, rx, ry, sz);
    char(ctx, 'd05', fx, fy, sz, { sway: 1, shadow: false });
  });
  const [wx, wy] = M.pt(760, 800); ripples(ctx, t, wx, wy, 140 * M.s, { alpha: 0.3, speed: 0.35 });
}

// ================================================================ 人人都说 (9.76–10.51): many people, all saying the same thing
// ---- G 9.70–10.63: what she sees from the back of the queue (one painted picture, n_queue_pov; 本人 10-21: the boats pasted onto
// the sea looked wrong): the camera eases forward behind the boats, and the people in them turn round to tell her (人、人、都、说)
const G_SAY = [[9.76, 250, 455, '追不上的', 52], [10.0, 520, 485, '跟着就好', 50], [10.08, 720, 400, '别想了', 38], [10.17, 880, 380, '排好队吧', 30]];
function shotG(ctx, t) {
  const im = plate('n_queue_pov'), z = lerp(1.04, 1.18, E.io(sat(t, 9.7, 10.63))), fx = 0.46, fy = 0.6;
  cover(ctx, im, { z, fx, fy });
  const s = im ? Math.max(W / im.width, H / im.height) * z : 1;
  const P = (ix, iy) => im ? [W / 2 - fx * im.width * s + ix * s, H / 2 - fy * im.height * s + iy * s] : [ix, iy];
  G_SAY.forEach(([t0, ix, iy, str, size], i) => { const [x, y] = P(ix, iy); balloon(ctx, t, t0, x, y + Math.sin(t * 2.5 + i) * 6, str, { size: size * s / 1.3, rot: (i % 2 ? 0.05 : -0.05) }); });
}
// ================================================================ 我们只能跟在后面 (10.63–12.41): a long line, and she is at the back
// ---- H 10.63–12.50: v1's painting of the queue. Close on her at the tail of the line from the first frame (本人 10-21: no swimming
// in, she was on screen too briefly); the camera pulls back and up and the line ahead of her gets longer and longer, all the
// way to the lights (后面); she frowns up the line, and her hand closes into a fist (to 有个人不信这一套)
// 本人 10-22: the voices were placed by hand and did not sit over the boats once the camera zoomed -> each over a boat's heads
const H_SAY = [[9.76, 290, 560, '追不上的', 1.0], [10.0, 540, 470, '跟着就好', 0.8], [10.63, 690, 420, '别想了', 0.66], [11.19, 790, 392, '排好队吧', 0.56]];
function shotH(ctx, t) {
  const back = E.io(sat(t, 10.63, 11.88));
  const o = { z: lerp(1.5, 1.08, back), fx: lerp(0.534, 0.5, back), fy: lerp(0.639, 0.6, back) };
  backdrop(ctx, 'bg04_boat_queue', o);
  const M = bdMap('bg04_boat_queue', o);
  H_SAY.forEach(([t0, ix, iy, s, k], i) => { const [x, y] = M.pt(ix, iy), sz = 40 * k * M.s / 1.35, w = sz * (s.length + 1.1), bx = Math.max(x, w / 2 + 24);
    balloon(ctx, t, t0, bx, y + Math.sin(t * 2 + i) * 4, s, { size: sz, tail: Math.max(-w / 2, -w * 0.18 - 26 - (bx - x)) }); });
  const [x, fy] = M.pt(820, 900);
  ripples(ctx, t, x, fy - 6, 120 * M.s / 1.3);
  withPoses({ d06: { sheet: 'c_d06', keys: [[0, 0], [11.88, 2], [12.2, 3]] } }, t, () => char(ctx, 'd06', x, fy, 540 * M.s / 1.3, { sway: 1, shadow: false }));
}

// ================================================================ 有个人不信这一套 (12.53–14.72): one man stands up to it (重读：不信)
// ---- I 12.50–13.98: close on him on the pier (v1's painting, 本人 10-21: the new low-angle plate changed the style): dark,
// then the spotlight bangs on and there he is; he pushes up his glasses (a glint), then folds his arms and shakes his head
// (不信) — and out on the horizon behind him the voices crack and drop
// 本人 10-23: the voices hung over an empty sea (bg05b has no boats) -> bg05c, the same painting with the queue of lantern boats
// rowing to the lighthouses; each voice over its boat
const I_FAR = [[733, 404, '追不上的'], [872, 398, '跟着就好'], [988, 394, '别想了'], [1078, 392, '排好队']];      // bg05c: over the boats (image px)
const pierQueue = (c, id, o) => { const pl = plate('bg05c_pier_queue'); if (!pl || id !== 'bg05b_pier_center') return;
  const M = bdMap(id, o), [x0, y0] = M.pt(0, 0), [x1, y1] = M.pt(1536, 1024); c.drawImage(pl, x0, y0, x1 - x0, y1 - y0); };
function shotI(ctx, t) {
  const o = { z: lerp(1.45, 1.55, E.io(sat(t, 12.5, 13.98))), fx: 0.546, fy: 0.5 };
  backdrop(ctx, 'bg05b_pier_center', o); pierQueue(ctx, 'bg05b_pier_center', o);
  const M = bdMap('bg05b_pier_center', o);
  I_FAR.forEach(([ix, iy, str], k) => { const [x, y] = M.pt(ix, iy); A.crackedBalloon(ctx, t, 12.62 + k * 0.12, 13.55 + k * 0.08, x, y, str); });
  const on = sat(t, 12.53, 12.6), fl = t >= 12.53 ? Math.exp(-7 * (t - 12.53)) : 0;
  ctx.fillStyle = `rgba(2,4,14,${0.66 * (1 - on)})`; ctx.fillRect(-50, -50, W + 100, H + 100);
  const [lx, ly] = M.pt(...A.SPOT), id = FT(t) < 13.34 ? 'm16' : 'm11', sz = 450 * M.s;
  const sh = id === 'm11' ? Math.sin((t - 13.34) * 22) * 0.035 * (1 - sat(t, 13.34, 14.0)) : 0;
  char(ctx, id, lx, ly + 10, sz, { shadow: true, shadowA: 2.5, rot: sh });
  if (on > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(lx, ly - sz * 0.5, 0, lx, ly - sz * 0.5, sz * 1.1);
    g.addColorStop(0, `rgba(255,240,210,${0.12 * on + 0.5 * fl})`); g.addColorStop(1, 'rgba(255,240,210,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (id === 'm16' && t > 12.85 && t < 13.3) {                             // the glint on his glasses
    const [gx, gy] = anchorPt('m16', lx, ly + 10, sz, 440, 280), a = Math.sin(sat(t, 12.85, 13.3) * Math.PI);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(gx, gy); ctx.rotate(t * 2); ctx.fillStyle = rgba('#FFFFFF', a);
    for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -90 * a); ctx.lineTo(10, 0); ctx.lineTo(0, 90 * a); ctx.lineTo(-10, 0); ctx.fill(); }
    ctx.restore();
  }
}
// ---- J 13.98–15.82 这一套 / 他说总得有人: v1's wide shot of the pier (the squat, the shock ring over the sea, the boats rocking,
// the dotted path from his finger to the star). 本人 10-21: her big head peeking up at the bottom corner moved too much, stole
// the focus and was mostly out of frame -> she stands whole on the planks to the right, out of the light, watching him: on the
// squat she starts (hands to her cheeks), when he points she makes a fist (she will follow). When he points the camera eases
// towards where he points.
const J_ME = [1130, 860], STAR = [120, 470];                               // bg05b: on the planks right of the light; the star (screen px)
function poseH(id, k) { const s = sheet(id), f = s?.frames[k]; return f ? f.h : 1; }
function shotJ(ctx, t) {
  const z = 1 + 0.15 * E.io(sat(t, 14.95, 15.8));
  ctx.save(); ctx.translate(STAR[0] * (1 - z), STAR[1] * (1 - z)); ctx.scale(z, z);
  const prev = globalThis.__poseOv; globalThis.__poseOv = { d22: () => true };      // v1's peeking head: not drawn
  globalThis.__noFar = true; globalThis.__bdHook = pierQueue;                       // the painted queue, not v1's pasted boats
  try { A.sA5(ctx, t); } finally { globalThis.__poseOv = prev; globalThis.__noFar = false; globalThis.__bdHook = null; }
  const o = { z: lerp(1.06, 1.12, E.io(sat(t, 12.5, 15.8))), fx: lerp(0.49, 0.45, sat(t, 14.84, 15.8)), fy: 0.6 }, M = bdMap('bg05b_pier_center', o);
  const [x, fy] = M.pt(...J_ME), h = 330 * M.s, tk = FT(t);
  const [id, k] = tk < 14.21 ? ['c_d06', 0] : tk < 14.95 ? ['c_d73', 0] : ['c_d06', 3];
  const hop = t > 14.21 ? Math.sin(sat(t, 14.21, 14.45) * Math.PI) * 40 : 0;
  frame(ctx, id, k, x, fy - hop, h / poseH(id, 0), { anchor: 'bottom', flip: id === 'c_d06' });
  ctx.restore();
}

// ================================================================ 先往前游一段 (15.82–18.86): the first one jumps into the dark sea
// and makes a way; she follows (重读：先、往前)
// ---- K 15.82–16.71 先: close on the end of the pier (本人 10-21: bigger; the long flight from the middle of the pier looked odd ->
// he is at the end already): he crouches at the edge, springs off on 先, about a body length out, and goes in head first
const K_EDGE = [425, 428], K_IN = [235, 640];                              // bg05: the planks at the end of the pier; where he goes in
function shotK(ctx, t) {
  const fly = sat(t, 15.9, 16.4), pan = E.io(sat(t, 15.88, 16.45));
  const o = { z: 1.7, fx: lerp(0.33, 0.294, pan), fy: lerp(0.375, 0.47, pan) };
  const [sx, sy] = shake(t, [[16.4, 18, 0.3]]);
  ctx.save(); ctx.translate(sx, sy);
  backdrop(ctx, 'bg05_pier_spot', o);
  const M = bdMap('bg05_pier_spot', o);
  const ix = lerp(K_EDGE[0], K_IN[0], fly), iy = lerp(K_EDGE[1], K_IN[1], Math.pow(fly, 1.6)) - Math.sin(fly * Math.PI) * 95;
  const tk = FT(t), [x, y] = M.pt(ix, iy), k = tk < 15.9 ? 0 : tk < 16.0 ? 1 : tk < 16.24 ? 2 : 3, sc = 0.46 * M.s;
  if (t < 16.43) frame(ctx, 'n_man_dive2', k, x, y, sc, { anchor: 'bottom', rot: k === 2 ? lerp(-0.2, 0.4, sat(t, 16.0, 16.24)) : k === 3 ? 0.1 : 0 });
  const [ex, ey] = M.pt(...K_IN);
  if (t >= 16.4) {
    frame(ctx, 'fx_crown', seq(t, 16.4, 8, 1 / 14), ex, ey + 30, 0.7 * M.s, { anchor: 'cell', cy: 1 });
    burst(ctx, t, 16.4, ex, ey, { n: 70, seed: 61, speed: [600, 1700], size: [16, 44], w: 140 });
    ripples(ctx, t, ex, ey + 20, 200 * M.s, { alpha: 0.8 * (1 - sat(t, 16.45, 16.71)), speed: 1.2 });
  }
  ctx.restore();
}
// ---- L 16.71–17.86 往前游: down at the waterline, alongside him: the camera keeps pace as he swims left into the dark, big in
// frame; the near water rushes past, the far peaks and their lights drift; a splash on every beat, a glowing wake behind him
const L_LAMPS = [[245, 455, '#E8DDFF'], [765, 430, '#FFB15A'], [1270, 455, '#6FC3FF']];       // p_night_far: the lighthouses
// a swimmer at the waterline wl: what is under water is darkened and tinted, with foam where the body cuts the surface
function wade(ctx, draw, wl, x0, x1, t) {
  LAYER = scratch(ctx, LAYER); const l = LAYER.getContext('2d');
  draw(l);
  l.globalCompositeOperation = 'source-atop';
  const g = l.createLinearGradient(0, wl - 8, 0, wl + 260); g.addColorStop(0, 'rgba(14,44,100,0)'); g.addColorStop(0.06, 'rgba(14,44,100,0.55)'); g.addColorStop(1, 'rgba(8,24,70,0.8)');
  l.fillStyle = g; l.fillRect(x0 - 50, wl - 8, x1 - x0 + 100, H);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAYER, 0, 0); ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(235,250,255,1)'; ctx.filter = 'blur(1.5px)';
  for (let k = 0; k < 14; k++) { const fx = lerp(x0, x1, rnd(k, 91)), fy = wl + (rnd(k, 92) - 0.5) * 14 + Math.sin(t * 6 + k) * 4;
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 7 + k * 2.3) ** 2; ctx.beginPath(); ctx.ellipse(fx, fy, 14 + rnd(k, 93) * 26, 5 + rnd(k, 94) * 5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function shotL(ctx, t) {
  const go = t - 16.71;
  ctx.fillStyle = '#0A1638'; ctx.fillRect(0, 0, W, H);
  const far = plate('p_night_far'), hz = H * 0.5;
  if (far) {                                                                // the far peaks, drifting slowly (their horizon at 745 of 1024)
    const w = W * 1.25, h = w * far.height / far.width, x0 = -go * 45 - 100, y0 = hz - h * (745 / 1024);
    ctx.drawImage(far, x0, y0, w, h);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [ix, iy, col] of L_LAMPS) { const lx = x0 + ix / far.width * w, ly = y0 + iy / far.height * h, g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 80);
      g.addColorStop(0, rgba('#FFFFFF', 0.95)); g.addColorStop(0.3, rgba(col, 0.7)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(lx - 80, ly - 80, 160, 160); }
    ctx.restore();
  }
  const sh = H * 1.15; strip(ctx, plate('p_night_sea'), hz + 0.4 * sh, sh, go * 1100);       // the near water rushing past (its horizon 0.1 down)
  const fx = W * 0.72, hand = fx - 800, wl = H * 0.72, sz = 980;        // m17 is anchored at his feet: they are at fx, his hands ~800 px left
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(16px)';                    // the wake, glowing, behind his feet
  const g = ctx.createLinearGradient(fx, 0, W + 100, 0); g.addColorStop(0, 'rgba(140,230,255,0.55)'); g.addColorStop(1, 'rgba(140,230,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx - 40, wl - 10); ctx.lineTo(W + 100, wl - 50); ctx.lineTo(W + 100, wl + 60); ctx.lineTo(fx - 40, wl + 20); ctx.fill(); ctx.restore();
  for (let k = 0; k < 30; k++) { const u = ((k / 30) + go * 1.8) % 1, x = fx + u * (W - fx + 100), y = wl + Math.sin(k * 2.3 + t * 7) * 10 * (0.4 + u);
    ctx.fillStyle = `rgba(235,250,255,${0.8 * (1 - u)})`; ctx.beginPath(); ctx.ellipse(x, y, 10 + 14 * (1 - u), 4 + 3 * (1 - u), 0, 0, TAU); ctx.fill(); }
  const stroke = Math.sin(go * Math.PI * 2 / 0.8);                         // 本人 10-21: his one swimming pose (as v1), no stroke cycle
  wade(ctx, c => char(c, 'm17', fx, wl + 190, sz, { shadow: false, rot: stroke * 0.035, sy: 1 + stroke * 0.02 }), wl, hand - 80, fx + 60, t);
  for (const b of [16.8, 17.2, 17.6]) burst(ctx, t, b, hand + 40, wl - 6, { n: 26, seed: Math.round(b * 10), speed: [300, 1000], size: [12, 32], w: 140, life: [0.35, 0.6], ang: [-Math.PI * 0.95, -Math.PI * 0.35] });
}
// ---- M 17.86–19.00 游一段: from high above: close at first on her, slipping into his glowing wake from the right, a body length
// behind him (本人 10-21: far apart looked odd); the camera rises and opens out ahead of them: their goal (本人 10-21: the room on
// the left wants one) — 姐姐 (ChatGPT) and 橙子 (Claude) on a rock out in the dark, holding their lights, turning in surprise
function shotM(ctx, t) {
  const rise = E.io(sat(t, 17.86, 18.9)), o = { z: lerp(1.7, 1.25, rise), fx: lerp(0.74, 0.53, rise), fy: 0.55 };
  backdrop(ctx, 'bg06_dark_sea_top', o);
  const M = bdMap('bg06_dark_sea_top', o);
  ctx.save(); ctx.globalCompositeOperation = 'screen';                     // the lights' colours on the water, far right
  const COLS = ['#E8DDFF', '#FFB15A', '#6FC3FF'];
  for (let k = 0; k < 120; k++) { const c = k % 3, [x, y] = M.pt(1300 + rnd(k, 71) * 400, 150 + c * 280 + (rnd(k, 72) - 0.5) * 200), a = 0.6 * (0.3 + 0.7 * Math.sin(t * 5 + k * 1.7) ** 8);
    ctx.fillStyle = rgba(COLS[c], a); ctx.beginPath(); ctx.arc(x, y, 3 + rnd(k, 73) * 4, 0, TAU); ctx.fill(); }
  ctx.restore();
  const riv = plate('n_rivals');                                            // the goal, ahead on the left, with their lanterns' light on the water
  if (riv) {
    const [rx, ry] = M.pt(470, 480), rw = 400 * M.s;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const [dx, col] of [[-0.18, '#D9CCFF'], [0.2, '#FFB15A']]) { const gx = rx + dx * rw, r = rw * 0.75, g = ctx.createRadialGradient(gx, ry + rw * 0.25, 0, gx, ry + rw * 0.25, r);
      g.addColorStop(0, rgba(col, 0.4)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(gx - r, ry + rw * 0.25 - r, 2 * r, 2 * r); }
    ctx.restore();
    ripples(ctx, t, rx, ry + rw * 0.36, rw * 0.5, { alpha: 0.35, speed: 0.4 });
    ctx.drawImage(riv, rx - rw / 2, ry - rw / 2, rw, rw);
  }
  const [hx, hy] = M.pt(lerp(1080, 970, sat(t, 17.86, 19)), 520), [tx, ty] = M.pt(1800, 560);       // the wake: a wedge from him back past the edge
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(14px)';
  const g = ctx.createLinearGradient(hx, 0, tx, 0); g.addColorStop(0, 'rgba(140,230,255,0.45)'); g.addColorStop(1, 'rgba(140,230,255,0.12)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx + 30, hy - 6); ctx.lineTo(tx, ty - 46 * M.s); ctx.lineTo(tx, ty + 46 * M.s); ctx.lineTo(hx + 30, hy + 6); ctx.closePath(); ctx.fill(); ctx.restore();
  for (const side of [-1, 1]) for (let k = 0; k < 50; k++) {              // its two foamy edges
    const u = k / 50, x = lerp(hx + 50, tx, u) + rnd(k, side + 80) * 20, y = lerp(hy, ty, u) + side * (6 + u * 44) * M.s + Math.sin(u * 24 + t * 4 + side) * 5 * M.s;
    ctx.fillStyle = `rgba(235,250,255,${0.6 * (1 - u * 0.6) * (0.55 + 0.45 * Math.sin(k * 2.7 + t * 6) ** 2)})`;
    ctx.beginPath(); ctx.ellipse(x, y, (5 + 8 * (1 - u)) * M.s, (2.5 + 3 * (1 - u)) * M.s, 0, 0, TAU); ctx.fill();
  }
  A.swimmer(ctx, 'm17', hx, hy + 120 * M.s, 300 * M.s, { rot: Math.sin(t * Math.PI * 2 / 0.8) * 0.035 }, t, 1);      // one pose each (本人 10-21)
  const [dx, dy] = M.pt(lerp(1600, 1330, E.out(sat(t, 17.86, 19.0))), 540);
  A.swimmer(ctx, 'd21', dx, dy + 140 * M.s, 360 * M.s, { sway: 1.4, windX: 0.6, rot: Math.sin(t * 4) * 0.03 }, t, 5);
}

// ---------------------------------------------------------------- the shot list and the post pass for 0–5.97
export const SB_T = { B: 1.07, C: T_BREACH, D: T_SURF, E: 4.4, BLACK: 5.88, F: 5.97, G: 9.7, H: 10.63, I: 12.5, J: 13.98, K: 15.82, L: 16.71, M: 17.86, END: 19.0 };
export const SB = {
  A: shotA, B: shotB, C: BREACH, D: shotD, E: shotE, F: shotF, G: shotG, H: shotH, I: shotI, J: shotJ, K: shotK, L: shotL, M: shotM,
  black: (ctx) => { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); },
};
// extra motion-blur sub-frames where things move fast (main.js)
export const SB_FAST = [[0, 1.07, 10], [1.72, 2.46, 8], [2.44, 2.62, 10], [3.2, 3.6, 8], [4.35, 5.88, 6], [10.63, 11.9, 6], [15.86, 16.6, 8], [16.71, 17.86, 6]];
export function postSB(t) {
  const p = { chroma: 0, zoom: 0, shock: 0, gradeAmt: 0, flash: 0, sat: 1 };
  if (t < 1.07) { p.zoom = 0.02 + 0.05 * (1 - sat(t, 0, 1.07)); p.zx = 0.5; p.zy = 0.5; }             // sinking fast, slowing down
  if (t >= 2.05 && t < T_BREACH) { const u = sat(t, 2.05, T_BREACH); p.flash = 0.3 * u * u * u; p.zoom = 0.04 * u; p.zx = 0.5; p.zy = 0.2; }
  const d = t - T_BREACH;
  if (d >= 0 && d < 0.6) { p.shock = 0.05 * (1 - d / 0.6); p.sr = 0.05 + d * 1.6; p.sw = 0.07; p.sx = 0.5; p.sy = 0.85; p.chroma = 0.008 * Math.exp(-d * 8); }
  if (t >= 16.4 && t < 16.65) { p.flash = Math.max(p.flash, 0.35 * Math.exp(-(t - 16.4) * 18)); }
  return p;
}
