// v2 §16: 0:19–1:02 storyboarded (重做方案-v2.md §16). Song clock. Where v1's picture already tells the line, it is kept and the
// shot gets its camera (pushes, pull-backs, cuts to a close-up on the word that matters, via enhance cfg.cam); the lines v1 told
// in one fixed frame are new shots (N, O, T, U).
import { W, H, TAU, clamp, lerp, sat, E, rnd, plate, sheet, frame, at, stream, strip, shake } from './core.js';
import { backdrop, bdMap, prop, ripples, splash, glowWord, img } from '../common.js';
import { char, anchorPt, breathe } from '../chars.js';
import { rgba } from '../lib.js';
import { enhance, withPoses, litOver } from './plus.js';
import * as L from './life.js';
import * as R4 from './sb4.js';
import * as R5 from './sb5.js';
import { fx } from './fx2.js';
import * as A from '../scenesA.js';
import * as B from '../scenesB.js';
import * as C from '../scenesC.js';

const FT = t => globalThis.__frameT ?? t;                                 // pick drawings and cuts by the output frame (no blended ghosts)
// a keyframed camera for enhance(): K = [[t, px, py, z, cut], ...]: the world point (px, py) at the centre of the frame, zoom z.
// From one key to the next it eases; a key with cut = 1 is jumped to (by the output frame's time). The window never leaves the frame.
export function camK(K) {
  return t => {
    const tk = FT(t); let i = 0; while (i + 1 < K.length && K[i + 1][0] <= tk) i++;
    const a = K[i], b = K[i + 1]; let [px, py, z] = [a[1], a[2], a[3]];
    if (b && !b[4]) { const u = E.io(sat(t, a[0], b[0])); px = lerp(a[1], b[1], u); py = lerp(a[2], b[2], u); z = lerp(a[3], b[3], u); }
    const hx = W / (2 * z), hy = H / (2 * z); px = clamp(px, hx, W - hx); py = clamp(py, hy, H - hy);
    return { z, x: -z * (px - W / 2), y: -z * (py - H / 2) };
  };
}
const glow = (ctx, x, y, r, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };

// ================================================================ 于是我憋了一口气 (19.10–21.97): she makes up her mind (重读：憋)
// ---- N 19.0–21.6: at the waterline: she is in the sea, waist deep, after the swim; far off on the horizon behind her, the two
// little lights of the goal; the camera holds (all of it stays in view). 于是 eyes closed, hands on her chest; 我 a deep breath; 憋 cheeks
// puffed, fists; 口 eyes open, set; 气 she ducks under.
let LAYER = null;
function wadeIn(ctx, draw, wl, x0, x1, t) {                               // under the waterline: tinted and darker, foam where she cuts it
  if (!LAYER || LAYER.width !== ctx.canvas.width || LAYER.height !== ctx.canvas.height) LAYER = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const l = LAYER.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalCompositeOperation = 'source-over'; l.globalAlpha = 1; l.filter = 'none';
  l.clearRect(0, 0, LAYER.width, LAYER.height); l.setTransform(ctx.getTransform()); draw(l);
  l.globalCompositeOperation = 'source-atop';
  const g = l.createLinearGradient(0, wl - 6, 0, wl + 300); g.addColorStop(0, 'rgba(14,44,100,0)'); g.addColorStop(0.05, 'rgba(14,44,100,0.6)'); g.addColorStop(1, 'rgba(8,24,70,0.85)');
  l.fillStyle = g; l.fillRect(x0 - 50, wl - 6, x1 - x0 + 100, H * 2);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(LAYER, 0, 0); ctx.restore();
  ctx.save(); ctx.fillStyle = 'rgba(235,250,255,1)'; ctx.filter = 'blur(1.5px)';
  for (let k = 0; k < 14; k++) { const fx = lerp(x0, x1, rnd(k, 91)), fy = wl + (rnd(k, 92) - 0.5) * 14 + Math.sin(t * 6 + k) * 4;
    ctx.globalAlpha = 0.35 + 0.35 * Math.sin(t * 7 + k * 2.3) ** 2; ctx.beginPath(); ctx.ellipse(fx, fy, 16 + rnd(k, 93) * 28, 5 + rnd(k, 94) * 5, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}
const L_LAMPS = [[245, 455, '#E8DDFF'], [765, 430, '#FFB15A'], [1270, 455, '#6FC3FF']];       // p_night_far: the lighthouses
function shotN(ctx, t) {
  ctx.save();                                                              // a held shot (10-22: no push-in: it cropped the goal off the horizon)
  ctx.fillStyle = '#0A1638'; ctx.fillRect(-50, -50, W + 100, H + 100);
  const far = plate('p_night_far'), hz = H * 0.6;
  if (far) {
    const w = W * 1.15, h = w * far.height / far.width, x0 = -W * 0.075 - (t - 19) * 15, y0 = hz - h * (745 / 1024);
    ctx.drawImage(far, x0, y0, w, h);
    for (const [ix, iy, col] of L_LAMPS) glow(ctx, x0 + ix / far.width * w, y0 + iy / far.height * h, 60, col, 0.8);
  }
  for (const [xf, col] of [[0.2, '#D9CCFF'], [0.235, '#FFB15A']]) {         // the goal: two lights on the horizon
    glow(ctx, W * xf, hz - 4, 46, col, 0.95);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(col, 0.35); ctx.fillRect(W * xf - 3, hz, 6, 120); ctx.restore();
  }
  const sh = H * 1.15; strip(ctx, plate('p_night_sea'), hz + 0.4 * sh, sh, (t - 19) * 90);
  const tk = FT(t), k = tk < 19.56 ? 0 : tk < 20.02 ? 1 : tk < 21.0 ? 2 : 3;
  const wl = H * 0.86, duck = E.in(sat(t, 21.22, 21.5)), fy = H + 70 + duck * 1300, sc = 1.72;
  if (t > 20.02 && t < 21.0) {                                              // 憋: a ring of light off her
    const r = 260 + 560 * E.out(sat(t, 20.02, 20.9)), a = 0.5 * (1 - sat(t, 20.2, 21.0));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#9EE8FF', a); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(W / 2, H * 0.4, r, 0, TAU); ctx.stroke(); ctx.restore();
  }
  L.underSurface(ctx, t, wl);                                              // the sea under her is alive (§19)
  if (t < 21.5) wadeIn(ctx, c => frame(c, 'c_d08', k, W / 2, fy, sc, { anchor: 'bottom', sy: 1 + 0.03 * sat(t, 19.56, 20.0) }), wl, W / 2 - 420, W / 2 + 420, t);
  if (t > 21.3) { splash(ctx, t, 21.32, W / 2, wl, { n: 50, scale: 1.1 }); ripples(ctx, t, W / 2, wl + 10, 380, { alpha: 0.7, speed: 0.9 }); }
  ctx.restore();
}

// ================================================================ 沉到最深 最深的地方 (22.13–25.61): down, and further down
// ---- O1 21.6–24.43 沉到最深 最深的: under water, she plunges in head first from the surface; the camera sinks with her, the light
// fading, the depth gauge running; speed lines on both 最深 (10-22: the tiny far-off shot after it is gone)
function shotO1(ctx, t) {
  const p = sat(t, 21.6, 24.43), d = A.depthAt(Math.max(22.0, t));
  backdrop(ctx, 'bg07_abyss', { z: 1.5, fy: lerp(0.18, 0.82, p), filter: `brightness(${lerp(1.05, 0.55, p).toFixed(2)})` });
  stream(t, { period: 0.015, life: 1.0, seed: 71 }, (i, q, age, r) => {   // marine snow rushing up past us (we are sinking)
    ctx.fillStyle = rgba('#BFEFFF', 0.55 * Math.sin(q * Math.PI)); ctx.beginPath(); ctx.arc(r(1) * W, H + 40 - q * (H + 80), 1.5 + r(2) * 3, 0, TAU); ctx.fill();
  });
  if ((t > 22.75 && t < 23.25) || (t > 23.56 && t < 24.05)) { ctx.save(); ctx.strokeStyle = 'rgba(190,240,255,0.35)'; ctx.lineWidth = 3;
    for (let k = 0; k < 26; k++) { const x = rnd(k, 61) * W, y = ((rnd(k, 62) * H - t * 1600) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 150); ctx.stroke(); }
    ctx.restore(); }
  const enter = E.out(sat(t, 21.6, 22.05)), x = W / 2 + Math.sin(t * 3) * 20, fy = lerp(-120, 930, enter);
  if (t < 22.3) splash(ctx, t, 21.62, W / 2, 60, { n: 40, scale: 1.0 });
  glow(ctx, x, fy - 380, 420, '#7FD0FF', 0.25);
  L.deepPass(ctx, t, false);                                               // the life of the deep, behind her (§19)
  const dOpt = { shadow: false, rot: Math.sin(t * 5) * 0.03, sway: 1.6, windY: -0.8 };
  char(ctx, 'd09', x, fy, 780, dOpt);
  litOver(ctx, L.anglerLight(t), c => char(c, 'd09', x, fy, 780, dOpt), [x - 300, x + 300]);
  L.deepPass(ctx, t, true);
  stream(t, { period: 0.03, life: 0.9, seed: 73 }, (i, q, age, r) => {   // bubbles off her, streaming up
    frame(ctx, 'fx_drops', [2, 12][i % 2], x + (r(1) - 0.5) * 240, fy - 200 - q * 900, (12 + r(2) * 26) / 120, { alpha: 0.7 * (1 - q) });
  });
  A.gauge(ctx, t, d);
}
// ---- O2 23.56–24.43 最深的: far, far down: in the black she is one small light; the gauge reads thousands of metres
function shotO2(ctx, t) {
  backdrop(ctx, 'bg07_abyss', { z: 1.05, fy: 0.9, filter: 'brightness(0.42)' });
  for (let k = 0; k < 40; k++) { const a = 0.5 * Math.sin(t * (2 + rnd(k, 3) * 3) + k) ** 6; glow(ctx, rnd(k, 1) * W, rnd(k, 2) * H, 12, '#7FE8FF', a); }
  const y = H * 0.42 + (t - 23.56) * 160;
  glow(ctx, W / 2, y - 60, 200, '#9FE6FF', 0.45);
  char(ctx, 'd09', W / 2, y, 170, { shadow: false, rot: Math.sin(t * 5) * 0.03 });
  A.gauge(ctx, t, A.depthAt(t));
}
// ---- O3 24.43–25.73 地方: she drifts down onto her seat of books at the little desk on the sea floor; sand puffs up, the lamp
// glows, she opens her book (and the ideas she works on float up off it, as in v1)
function shotO3(ctx, t) {
  const o = { z: lerp(1.25, 1.14, E.out(sat(t, 24.43, 25.7))), fx: 0.55, fy: 0.55 };
  backdrop(ctx, 'bg08_seabed_study', o);
  const M = bdMap('bg08_seabed_study', o), dx = 760, dy = 900;
  L.studyBg(ctx, t, M);
  const lamp = M.pt(1130, 390); glow(ctx, lamp[0], lamp[1], 360, '#FFD27A', 0.25 + 0.25 * sat(t, 24.62, 24.9));
  const land = E.out(sat(t, 24.43, 24.62)), drop = (1 - land) * 420;
  const [sx2, sy2] = anchorPt('d10', dx, dy, 660, ...A.SEAT_D10);
  prop(ctx, img('prop_bookseat') ? 'prop_bookseat' : 'prop_coin', sx2, sy2 - 70 + 82, 280);
  if (t > 24.6 && t < 25.3) { const q = sat(t, 24.6, 25.3); for (let k = 0; k < 12; k++) { const an = Math.PI + (k + 0.5) / 12 * Math.PI, r = 40 + q * 260;
    ctx.fillStyle = rgba('#E8D6B8', 0.55 * (1 - q)); ctx.beginPath(); ctx.arc(sx2 + Math.cos(an) * r * 1.6, sy2 + 20 + Math.sin(an) * r * 0.25, 22 * (1 - q * 0.5), 0, TAU); ctx.fill(); } }
  char(ctx, 'd10', dx, dy - 70 - drop, 660, { shadow: false, ...breathe(t) });
  A.receipt(ctx, ...M.pt(...A.DESK.note), t, 24.9);
  const [bx, by] = anchorPt('d10', dx, dy - 70, 660, 304, 600);
  ['MoE', 'MLA', 'FP8', 'GRPO'].forEach((w, i) => {
    const t0 = 24.8 + i * 0.2, d = t - t0; if (d < 0) return;
    const a = sat(d, 0, 0.2) * (1 - sat(d, 0.9, 1.3));
    glowWord(ctx, w, bx + 330 + i * 120 + Math.sin(d * 3 + i) * 14, by - 40 - i * 30 - d * 170, 46, { alpha: a, color: '#FFF4CC', glow: 'rgba(255,200,90,0.9)', stroke: '#3A2A10', sw: 0.08 });
  });
}

// ================================================================ the rest of the first minute: v1's pictures, whole (10-22: the
// pushes and cut-ins added here hid the scene and stressed nothing; the original wide shots show the point). Only the poses
// change, once, on the stressed words.

// ================================================================ 我只是翻了个身 (38.26–40.93): a small thing, a huge result
// ---- T 38.38–41.0: 我只是 the whole frame is her, asleep on the chaise, quiet; on 翻 she turns over, and at that moment the
// split slides in from the right: on the other side a whale breaches from a red sea (v1's split screen, now arriving on the
// word); the wave washes the split away
function whaleAt(t) { const p = sat(t, 39.02, 42.25); return { x: lerp(1380, 900, p), y: 1250 - Math.sin(Math.min(1, p) * Math.PI) * 820, rot: lerp(-0.7, 0.9, p) }; }
const ROLL = Object.fromEntries(['d16a', 'd16b'].map(id => [id, { sheet: 'c_roll', refId: 'd16a', flip: false, keys: [[0, 0], [39.02, 1], [39.18, 2], [39.6, 3]] }]));
function shotT(ctx, t) {
  const slide = 1 - E.out(sat(t, 39.0, 39.24)), wash = E.io(sat(t, 40.45, 40.95));
  const off = slide * 1150 - wash * 1300, split = y => lerp(1010, 900, y / H) + off;
  if (slide < 1) {
    backdrop(ctx, 'bg13r_storm_red', { z: 1.15, fx: 0.55, fy: 0.55 });
    const w = whaleAt(t); if (t >= 39.0) prop(ctx, 'prop_whale', w.x, w.y, 900, { rot: w.rot });
    splash(ctx, t, 39.02, 1380, 900, { n: 60, scale: 1.4 });
  }
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-50, -50); ctx.lineTo(split(0), -50); ctx.lineTo(split(H), H + 50); ctx.lineTo(-50, H + 50); ctx.closePath(); ctx.clip();
  const o = { z: 1.6 + 0.06 * sat(t, 38.38, 39.0), fx: lerp(0.64, 0.5, slide), fy: 0.64 };
  backdrop(ctx, 'bg12_room', o);
  const M = bdMap('bg12_room', o), [sx, sy] = M.pt(...C.POS.sofa), id = t < 39.02 ? 'd16a' : t < 39.4 ? 'd16b' : 'd16a';
  withPoses(ROLL, t, () => char(ctx, id, sx, sy, 275 * M.s, { shadow: false, ...breathe(t, 0.6) }));
  L.sleepFg(ctx, t, sx, sy);
  ctx.restore();
  if (slide < 1) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 24;
    ctx.beginPath(); ctx.moveTo(split(0), -50); ctx.lineTo(split(H), H + 50); ctx.stroke(); ctx.restore();
  }
  if (wash > 0) { ctx.save(); ctx.fillStyle = 'rgba(240,250,255,0.9)';
    for (let k = 0; k < 40; k++) { const y = k / 40 * H, x = split(y) + 40 + Math.sin(k * 1.7 + t * 9) * 30; ctx.beginPath(); ctx.arc(x, y, 40 + rnd(k, 3) * 40, 0, TAU); ctx.fill(); }
    ctx.restore(); }
}
// ================================================================ 整片海都翻了天 (41.11–43.95): the whole sea turns over
// ---- U 41.0–44.2: wide on the storm sea (整片海), the whale coming down out of the sky; on 翻 it crashes in, and a wave wider
// than the frame rises, curls over towards us and comes down (了); as it comes down the sea turns from red to green; on 天 the
// clouds open and the light comes through (本人: no turning the whole picture over)
const U_K = [[0, 0], [42.4, 1], [42.6, 2], [42.83, 3], [42.98, 4], [43.15, 5], [43.4, 6], [43.65, 7]];
function shotU(ctx, t) {
  const turn = E.io(sat(t, 42.9, 43.2)), [sx, sy] = shake(t, [[42.23, 22, 0.4], [42.98, 36, 0.6]]);
  ctx.save(); ctx.translate(sx, sy);
  const o = { z: lerp(1.2, 1.12, sat(t, 41.0, 42.2)), fx: 0.55, fy: 0.55 };
  backdrop(ctx, 'bg13r_storm_red', o);
  if (turn > 0) backdrop(ctx, 'bg13g_storm_green', { ...o, alpha: turn });
  const w = whaleAt(t); if (t < 42.25) prop(ctx, 'prop_whale', w.x, w.y, 900, { rot: w.rot });
  splash(ctx, t, 42.23, 900, 960, { n: 110, scale: 2.2, life: 1.6 });
  if (t >= 42.23) frame(ctx, 'fx_crash', at(FT(t), U_K), W * 0.5, H * 1.04, 5.0, { anchor: 'cell', cy: 1, alpha: 1 - 0.6 * sat(t, 43.65, 44.2) });
  ctx.restore();
  if (t > 43.6) {                                                           // 天: the clouds open
    const a = sat(t, 43.6, 43.9);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(W * 0.6, -60);
    for (let k = 0; k < 7; k++) { ctx.save(); ctx.rotate(-0.5 + k * 0.17); const g = ctx.createLinearGradient(0, 0, 0, H * 1.3);
      g.addColorStop(0, rgba('#FFF6D8', 0.35 * a)); g.addColorStop(1, 'rgba(255,246,216,0)'); ctx.fillStyle = g; ctx.fillRect(-26 - k % 2 * 14, 0, 52 + k % 2 * 28, H * 1.3); ctx.restore(); }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- the shots, on the song's clock
const mk = (shot, cfg) => enhance(shot, cfg);
export const SB2 = {
  N: shotN, O1: shotO1, O2: shotO2, O3: shotO3,
  P: R4.shotP,                                                  // §20 redesign (sb4.js)
  Q: R5.shotQ,                                                  // §21 redesign (sb5.js)
  R: mk(B.sB3, { ov: { m14: { sheet: 'c_m14', keys: [[0, 0], [33.75, 3]] } }, bg: (c, t, id, o) => id === 'bg10_forge' && L.forgeBg(c, t, bdMap(id, o)),
    extra: (c, t) => L.forgeFg(c, t, bdMap('bg10_forge', { z: 1.06, fx: 0.48, fy: 0.42 })) }),
  S: mk(B.sB4, { ov: { d15: { sheet: 'c_d15', ref: 1, keys: [[0, 0], [35.38, 1], [36.16, 2], [37.0, 3]] } },
    bg: (c, t, id, o) => (id === 'bg11b_newyear_lit' || (id === 'bg11_newyear' && t < 36.16)) && L.newYearBg(c, t, bdMap('bg11_newyear', o)), extra: L.newYearFg }),
  T: shotT, U: shotU,
  V: R5.shotV,                                                  // §21 redesign (sb5.js)
  W: R4.shotW,                                                  // §20 redesign (sb4.js)
  X: mk(C.sC5, { bg: (c, t, id, o) => id === 'bg18_two_peaks' && L.peaksBg(c, t, bdMap(id, o)) }),
  Y: mk(C.sC6, { extra: (c, t) => L.dawnFg(c, t, 53.9) }),
  Z: R4.shotZ,                                                  // §20 redesign (sb4.js)
  AA: (() => { const s = mk(C.sC8, { ov: { d18: { sheet: 'c_d18', keys: [[0, 0], [60.84, 2]], after: trayPile } }, bg: (c, t, id, o) => id === 'bg17_dawn_sea' && L.trayBg(c, t, bdMap(id, o)),
    extra: (c, t) => L.dawnFg(c, t, 59.7) });
    return (ctx, t) => { globalThis.__noTrayPile = true; try { s(ctx, t); } finally { globalThis.__noTrayPile = false; } }; })(),
};
// 本人 10-23 (1:00 卷轴歪了): the pile of scrolls, level, standing on the middle of the plate in c_d18 (frame px, frames 0 and 2);
// it gets smaller as the copies fly to us
const PILE_AT = [206, 420], PILE_BOX = [36, 261, 1181, 740];               // p_scroll_pile: the pile in the image
export function trayPile(ctx, t, info, k, scale) {
  const f = sheet('c_d18')?.frames[Math.floor(k)], pl = plate('p_scroll_pile'); if (!f || !pl) return;
  const left = 3 - [60.84, 61.14, 61.44].filter(t0 => t >= t0).length, w = 182 * scale * (0.8 + 0.067 * left), h = w * PILE_BOX[3] / PILE_BOX[2];
  const x = info.x + (PILE_AT[0] - f.ax) * scale, y = info.feetY - (info.o.lift ?? 0) + (PILE_AT[1] - (f.h - 3)) * scale;
  ctx.drawImage(pl, ...PILE_BOX, x - w / 2, y - h, w, h);
}
export const SB2_LIST = [
  [19.0, SB2.N], [21.6, SB2.O1], [24.43, SB2.O3], [25.7, SB2.P], [28.6, SB2.Q], [31.6, SB2.R], [35.1, SB2.S],
  // 41.0: 本人 10-22: the original turn-over (C.sC2) was better than the new wave
  [38.38, SB2.T], [41.0, C.sC2], [44.2, SB2.V], [47.3, SB2.W], [51.0, SB2.X], [53.9, SB2.Y], [57.1, SB2.Z], [59.7, SB2.AA],
];
export const SB2_FAST = [[21.2, 22.1, 8], [22.75, 23.25, 6], [39.0, 40.2, 8], [42.2, 43.3, 8], [44.3, 46.4, 6], [54.3, 55.9, 6]];
