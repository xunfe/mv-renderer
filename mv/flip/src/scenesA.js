// Verse 1 (分镜.md A1–A8): she grows up in a sea of numbers, sees the lights on the far peaks, the man in the blue
// suit swims out ahead, she takes a breath and dives to the bottom to study. Times are on the full cut.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, pulse, rgba, font, SANS, drawGlyph } from './lib.js';
import { char, fitSize, bop, breathe, placeBy, anchorPt } from './chars.js';
import { backdrop, bdMap, prop, digitSea, bubbles, splash, ripples, glowWord, balloon, img } from './common.js';
import { cam } from './fx.js';

const LINE1 = [['我', 0.02], ['从', 0.25], ['数', 0.39], ['字', 0.63], ['的', 0.81], ['海', 1.07], ['里', 1.23], ['长', 1.61], ['大', 2.05]];
// the first line as big type: each character pops in when it is sung (this line has no subtitle)
function line1(ctx, t) {
  const size = 104, step = size * 1.08, x0 = W / 2 - step * (LINE1.length - 1) / 2, y = 905;
  const away = E.in(sat(t, 2.2, 2.45));
  LINE1.forEach(([ch, t0], i) => {
    if (t < t0 - 0.03) return;
    const p = E.back(sat(t, t0 - 0.03, t0 + 0.16));
    const big = ch === '大' ? 1 + 0.35 * Math.exp(-6 * Math.max(0, t - 2.05)) : 1;
    ctx.save(); ctx.translate(x0 + i * step, y - away * 260 - (1 - p) * 40); ctx.scale(p * big, p * big);
    glowWord(ctx, ch, 0, 0, size, { alpha: (1 - away) * sat(t, t0 - 0.03, t0 + 0.05), glow: 'rgba(90,200,255,0.95)' });
    ctx.restore();
  });
}
// the magic square 幻方 (8 1 6 / 3 5 7 / 4 9 2): a glowing gate she swims through
const SQ = [8, 1, 6, 3, 5, 7, 4, 9, 2];
function magicSquare(ctx, t, cx, cy, cell, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(cx, cy); ctx.rotate(-0.08);
  const s = cell * 3;
  ctx.shadowColor = 'rgba(110,230,255,0.95)'; ctx.shadowBlur = 24; ctx.strokeStyle = 'rgba(190,250,255,0.95)'; ctx.lineWidth = 5;
  for (let k = 0; k <= 3; k++) { const p = sat(t, 0.4 + k * 0.05, 0.6 + k * 0.05); ctx.globalAlpha = a * p;
    ctx.beginPath(); ctx.moveTo(-s / 2, -s / 2 + k * cell); ctx.lineTo(-s / 2 + s * p, -s / 2 + k * cell); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-s / 2 + k * cell, -s / 2); ctx.lineTo(-s / 2 + k * cell, -s / 2 + s * p); ctx.stroke(); }
  ctx.shadowBlur = 0;
  SQ.forEach((n, i) => {
    const t0 = 0.5 + i * 0.045; if (t < t0) return;
    ctx.globalAlpha = a * sat(t, t0, t0 + 0.08);
    glowWord(ctx, String(n), -s / 2 + (i % 3 + 0.5) * cell, -s / 2 + (Math.floor(i / 3) + 0.5) * cell, cell * 0.62, { color: '#E8FFFF', glow: 'rgba(80,220,255,1)', stroke: '#0A3550', sw: 0.08 });
  });
  ctx.restore();
}
// A1 0–2.45  我从数字的海里长大
export function sA1(ctx, t) {
  if (t < 0.25) {                      // her face fills the frame; her eyes open on 我
    backdrop(ctx, 'bg01_digit_sea', { z: 1.9 + t * 0.4, fy: 0.42, blur: 3, dark: 0.15 });
    digitSea(ctx, t + 3, { n: 70, zoom: 1.7, alpha: 0.55, seed: 3 });
    const sz = fitSize('d01', 1040);
    char(ctx, 'd01', W / 2, 1130 + t * 30, sz, { blink: 1 - sat(t, 0.02, 0.13), sway: 1.8, windY: -0.5, shadow: false, sx: 1 + t * 0.06, sy: 1 + t * 0.06 });
    bubbles(ctx, t + 2, { n: 18, maxR: 22, alpha: 0.5 });
    line1(ctx, t);
    return;
  }
  if (t < 2.05) {                      // the camera pulls back: she swims up through the square
    const pb = E.out(sat(t, 0.25, 0.9));
    const z = lerp(1.65, 1.07, pb);
    backdrop(ctx, 'bg01_digit_sea', { z, fy: lerp(0.45, 0.55, sat(t, 0.25, 2.05)) });
    digitSea(ctx, t + 3, { n: 110, zoom: lerp(2.2, 1, pb), alpha: 0.75, seed: 3, speed: 1.6 });
    const p = E.io(sat(t, 0.3, 2.0));
    const x = lerp(560, 1220, p), fy = lerp(1000, 760, p), sz = lerp(600, 680, p) * lerp(1.3, 1, pb);
    const gate = sat(t, 1.0, 1.5), gs = 1 + E.in(gate) * 2.2, ga = (1 - E.in(gate)) * sat(t, 0.35, 0.5);
    const front = gate > 0.35;
    if (!front) magicSquare(ctx, t, 930, 520, 128 * gs, ga);
    char(ctx, 'd02', x, fy, sz, { sway: 1.6, windY: 0.6, shadow: false, rot: -0.12 });
    if (front) magicSquare(ctx, t, 930, 520, 128 * gs, ga);
    bubbles(ctx, t, { n: 30, x0: x - 200, x1: x + 120, maxR: 10, alpha: 0.6 });
    line1(ctx, t);
    return;
  }
  // 大: she bursts out of the sea, and (本人 10-19: the leap was too quick to read; both versions) hangs at the top of the leap,
  // the camera easing in, glittering drops falling away; then she starts to drop and the cut to the surf comes on the beat at
  // BREACH_END, where she lands on her board (sA2)
  const hang = sat(t, 2.4, 3.0), fall = E.in(sat(t, 2.95, BREACH_END));
  const cam = 1 + 0.06 * E.io(sat(t, 2.3, BREACH_END));
  ctx.save(); ctx.translate(W / 2, 700); ctx.scale(cam, cam); ctx.translate(-W / 2, -700);
  backdrop(ctx, 'bg02_kline_sea', { z: 1.25, fy: 0.62, y: (1 - E.out(sat(t, 2.05, 2.45))) * -60 });
  const p = E.out(sat(t, 2.05, 2.4));
  char(ctx, 'd03', 960, lerp(1500, 880, p) - E.out(hang) * 50 + fall * 260, 740, { sway: 2, windY: 0.8 - fall * 1.4, shadow: false, rot: Math.sin(hang * Math.PI) * 0.04 });
  if (t > 2.3) for (let k = 0; k < 22; k++) {                   // drops falling off her, glinting in the evening light
    const d = sat(t, 2.3 + rnd(k, 91) * 0.3, 3.2), x = 960 + (rnd(k, 92) - 0.5) * 520 + (rnd(k, 93) - 0.5) * 120 * d, y = 560 + rnd(k, 94) * 300 + d * d * 420;
    if (d <= 0 || d >= 1) continue;
    ctx.fillStyle = rgba(k % 3 ? '#DDF4FF' : '#FFF3C8', 0.9 * (1 - d)); ctx.beginPath(); ctx.arc(x, y, 4 + rnd(k, 95) * 6, 0, TAU); ctx.fill();
  }
  ctx.restore();
  splash(ctx, t, 2.05, 960, 800, { n: 70, scale: 1.2 });
  splash(ctx, t, 2.08, 900, 820, { n: 30, scale: 0.8, seed: 7 });
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * (1 - sat(t, 2.05, 2.2))); ctx.fillRect(0, 0, W, H);
  line1(ctx, t);
}

export const BREACH_END = 3.247;                                         // the cut from the leap to the surf (a beat)
// A2 3.247–5.9  红的绿的浪 一天翻好几遍: the sea is a candlestick chart; it turns over (red and green swap) on 翻 好 几 遍
export const FLIPS = [3.90, 4.40, 5.00, 5.44];
const HORIZON = 0.24;                   // of the image height (bg02)
function candleBoard(ctx, x, y, w, up, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2.4) * 0.05);
  ctx.fillStyle = up ? '#FF5D6E' : '#33D18E'; ctx.strokeStyle = '#13213F'; ctx.lineWidth = 5;
  ctx.fillRect(-2, -w * 0.12 - 30, 4, 30); ctx.fillRect(-2, w * 0.12, 4, 30);
  ctx.beginPath(); ctx.roundRect(-w / 2, -w * 0.12, w, w * 0.24, 10); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function sA2(ctx, t) {
  const tf = Math.round(t * 60) / 60;                                  // which state (red/green) is decided per output frame, so the motion
  const n = FLIPS.filter(f => tf >= f).length;                        // blur never mixes both boards in one frame (full v3, 0:05)
  let sy = 1, swapped = n % 2 === 1;
  for (const f of FLIPS) { const d = t - f, df = tf - f; if (d > -0.07 && d < 0.07) { sy = Math.abs(d) / 0.07; swapped = (FLIPS.filter(g => g < f).length + (df >= 0 ? 1 : 0)) % 2 === 1; } }
  const o = { z: 1.18, fx: lerp(0.38, 0.62, sat(t, 2.45, 5.9)), fy: 0.6 };
  backdrop(ctx, 'bg02_kline_sea', o);                                // the sky stays; only the sea turns over
  const M = bdMap('bg02_kline_sea', o), hy = M.pt(0, img('bg02_kline_sea')?.height * HORIZON ?? 0)[1];
  ctx.save(); ctx.beginPath(); ctx.rect(0, hy, W, H - hy); ctx.clip();
  ctx.translate(0, (hy + H) / 2); ctx.scale(1, Math.max(0.02, sy)); ctx.translate(0, -(hy + H) / 2);
  backdrop(ctx, swapped ? 'bg02b_kline_sea_swap' : 'bg02_kline_sea', o);
  ctx.restore();
  const hop = FLIPS.reduce((v, f) => { const d = t - f; return v + (d < -0.06 ? 0 : d < 0 ? Math.sin((d + 0.06) / 0.06 * Math.PI / 2) : Math.exp(-7 * d)); }, 0);   // she hops as the sea turns (rising over 0.06 s, not in one jump)
  // she drops in from the leap (sA1) and lands on her board, which slaps down on the sea
  // fast while she is still off the top of the frame, slowing as the board meets the water (falling faster and faster into the
  // landing smeared her into a stack of copies under the motion blur)
  const LAND = BREACH_END + 0.28, land = sat(t, BREACH_END, LAND), slap = t > LAND ? Math.exp(-8 * (t - LAND)) : 0;
  const bx = 900 + Math.sin(t * 1.3) * 30, by = 800 + Math.sin(t * 2.4) * 10 - hop * 80 - (1 - E.out(land)) * 700 + slap * 24, sz = 650;
  const tilt = Math.sin(t * 2.4 + 0.6) * 0.04 - hop * 0.05, id = swapped ? 'd25g' : 'd25';
  const [fx, fy] = placeBy(id, ...SURF.board, bx, by, sz, { rot: tilt });
  const [tx, ty] = anchorPt(id, fx, fy, sz, ...SURF.tail, { rot: tilt });
  if (t > LAND - 0.02) { splash(ctx, t, LAND, bx, by + 30, { n: 60, scale: 1.1, seed: 31 }); ripples(ctx, t, bx, by + 40, 360, { alpha: 0.7 * (1 - sat(t, LAND, LAND + 1.2)) }); }
  if (land >= 1) for (let k = 0; k < 26; k++) {                          // spray trailing off the back of the board
    const u = ((k / 26) + t * 1.4) % 1, sx = tx - u * 520, sy = ty - Math.sin(u * Math.PI) * 90 * (0.5 + rnd(k, 81));
    ctx.fillStyle = `rgba(255,255,255,${0.8 * (1 - u)})`; ctx.beginPath(); ctx.arc(sx, sy, 4 + 10 * (1 - u), 0, TAU); ctx.fill();
  }
  char(ctx, id, fx, fy, sz, { sway: 1.4, windX: -0.6, shadow: false, rot: tilt });
  for (const f of FLIPS) splash(ctx, t, f, bx, by + 20, { n: 18, scale: 0.55, seed: f * 10 });
}
export const SURF = { board: [550, 800], tail: [40, 880] };                // d25: middle and back end of the board (keyed sprite px)

// A3 5.9–9.7  远远的山顶上 灯一盏一盏亮: the camera tilts up from her on the rock to the peaks; the lamps come on
let LAYER = null;                       // scratch canvas, cleared before every use
export const LAMPS = [[312, 268, '#E8DDFF', 8.24], [865, 245, '#FFB15A', 8.99], [1301, 302, '#6FC3FF', 9.22]];     // bg03 image px
export function sA3(ctx, t) {
  // she sits on the rock in the foreground; the peaks stay in frame and the camera eases in towards them
  const push = E.io(sat(t, 5.9, 9.7));
  const o = { z: lerp(1.02, 1.05, push), fx: 0.47, fy: 0.52 };
  backdrop(ctx, 'bg03_lighthouses', o);
  const M = bdMap('bg03_lighthouses', o);
  for (const [ix, iy, col, t0] of LAMPS) {                            // each lamp: the lit painting shows through, then a beam
    if (t < t0) continue;
    const a = E.out(sat(t, t0, t0 + 0.25)), [x, y] = M.pt(ix, iy);
    if (img('bg03b_lighthouses_lit')) {
      ctx.save(); const r = 520 * M.s;
      if (!LAYER || LAYER.width !== ctx.canvas.width) LAYER = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
      const layer = LAYER, lx = layer.getContext('2d'); lx.setTransform(1, 0, 0, 1, 0, 0); lx.globalCompositeOperation = 'source-over'; lx.clearRect(0, 0, layer.width, layer.height); lx.setTransform(ctx.getTransform());
      const g = lx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.55, 'rgba(0,0,0,0.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      backdrop(lx, 'bg03b_lighthouses_lit', o); lx.globalCompositeOperation = 'destination-in'; lx.fillStyle = g; lx.fillRect(0, 0, W, H);
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = a; ctx.drawImage(layer, 0, 0); ctx.restore();
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(10px)';
    const beam = (t - t0) * 0.9 + (ix % 3);
    ctx.translate(x, y); ctx.rotate(-0.4 + Math.sin(beam) * 0.5);
    const bg = ctx.createLinearGradient(0, 0, 760 * M.s, 0); bg.addColorStop(0, rgba(col, 0.2 * a)); bg.addColorStop(0.5, rgba(col, 0.06 * a)); bg.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -3); ctx.lineTo(700 * M.s, -48 * M.s); ctx.lineTo(700 * M.s, 48 * M.s); ctx.lineTo(0, 3); ctx.fill();
    ctx.rotate(Math.PI); ctx.fill(); ctx.filter = 'none';
    const flare = ctx.createRadialGradient(0, 0, 0, 0, 0, 120 * M.s * (1 + 0.6 * Math.exp(-5 * (t - t0))));
    flare.addColorStop(0, rgba('#FFFFFF', a)); flare.addColorStop(0.3, rgba(col, 0.8 * a)); flare.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = flare; ctx.fillRect(-300, -300, 600, 600);
    ctx.restore();
  }
  // a shooting star while she waits, and the moon glinting on the water
  if (t > 6.3 && t < 7.1) { const q = sat(t, 6.3, 7.0), sx = lerp(1250, 520, q), sy = lerp(90, 300, q);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(sx, sy, sx + 260, sy - 75);
    g.addColorStop(0, rgba('#FFFFFF', 0.95 * Math.sin(q * Math.PI))); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 260, sy - 75); ctx.stroke(); ctx.restore(); }
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 60; k++) { const gx = W * (0.3 + 0.7 * rnd(k, 51)), gy = H * (0.55 + 0.4 * rnd(k, 52)), a = 0.6 * Math.sin(t * 3 + k * 1.3) ** 12;
    ctx.fillStyle = rgba('#DDEBFF', a); ctx.beginPath(); ctx.ellipse(gx, gy, 9, 2, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
  // seated on the rock top (bg03 x 430, top at y 716): her seat, not her dangling tail, on the stone
  const sz = 430 * M.s, [rx, ry] = M.pt(430, 716), [fx, fy] = placeBy('d05', ...SEAT_D05, rx, ry, sz);
  const turn = LAMPS.reduce((v, l) => v + (t > l[3] ? 0.02 : 0), 0);      // a small lean towards each new light
  char(ctx, 'd05', fx, fy, sz, { sway: 1, shadow: false, rot: -turn });
  const [wx, wy] = M.pt(760, 800); ripples(ctx, t, wx, wy, 140 * M.s, { alpha: 0.3, speed: 0.35 });      // the water off the rock
}
export const SEAT_D05 = [330, 880];       // d05: where she sits (keyed sprite px, tools/grid.py)
export const SEAT_D10 = [430, 870];       // d10: where she sits

// A4 9.7–12.5  人人都说 我们只能跟在后面: the queue of boats rows towards the lights, their balloons pop up; she watches
// from behind the last boat (the full version tried moving boats and a new sea; 本人 10-18 chose this one for both)
export function sA4(ctx, t) {
  const o = { z: lerp(1.08, 1.18, sat(t, 9.7, 12.5)), fx: 0.5, fy: 0.55 };
  backdrop(ctx, 'bg04_boat_queue', o);
  const M = bdMap('bg04_boat_queue', o);
  const S = [[9.76, 300, 600, '追不上的'], [10.0, 560, 500, '跟着就好'], [10.63, 700, 440, '别想了'], [11.19, 820, 400, '排好队吧']];      // over the boats (image px)
  S.forEach(([t0, ix, iy, s], i) => { const [x, y] = M.pt(ix, iy); balloon(ctx, t, t0, x, y + Math.sin(t * 2 + i) * 6, s, { size: 34, rot: (i % 2 ? 0.04 : -0.04) }); });
  const [x, fy] = M.pt(820, 900);                                      // just behind the last boat
  ripples(ctx, t, x, fy - 6, 120);
  char(ctx, 'd06', x, fy, 540 * M.s / 1.3, { sway: 1, shadow: false, ...breathe(t) });
}


// A5 12.5–15.8  有个人不信这一套 / 他说总得有人. A spotlight on the pier finds the man in the blue suit, in the middle of
// the frame. Far off on the right, the crowd's boats are still rowing towards the lights, their little balloons saying
// 追不上的 / 跟着就好. 有个人: he pushes up his glasses (a glint). 不信: arms folded, head shaking, and the far balloons crack
// and drop. 这一套: the power squat; dust, a shock ring over the water, the boats rock, and she, peeking over the edge of
// the pier, gives a start. 他说总得有人: he points into the dark sea on the left, and a lit dotted path runs out from his
// finger to one small star.
export const SPOT = [750, 740];          // bg05b: the middle of the light circle on the planks (image px, tools/bggrid.py)
const FAR = [[1210, 412, '追不上的'], [1330, 404, '跟着就好'], [1440, 398, '别想了'], [1540, 394, '排好队']];   // bg05b: far boats (image px)
export function crackedBalloon(ctx, t, t0, tc, x, y, str) {         // pops in at t0, cracks in two at tc and falls
  if (t < t0) return;
  if (t < tc) { balloon(ctx, t, t0, x, y, str, { size: 24 }); return; }
  const d = t - tc; if (d > 0.7) return;
  ctx.save(); ctx.globalAlpha = 1 - d / 0.7;
  for (const side of [-1, 1]) {
    ctx.save(); ctx.translate(x + side * (6 + d * 70), y + d * d * 900); ctx.rotate(side * d * 2.2);
    ctx.beginPath(); ctx.rect(side < 0 ? -200 : 0, -80, 200, 160); ctx.clip();
    balloon(ctx, 1, 0, 0, 0, str, { size: 24 }); ctx.restore();
  }
  ctx.restore();
}
export function sA5(ctx, t) {
  const push = E.io(sat(t, 12.5, 15.8));
  const o = { z: lerp(1.06, 1.12, push), fx: lerp(0.49, 0.45, sat(t, 14.84, 15.8)), fy: 0.6 };
  const shake = Math.exp(-9 * Math.max(0, t - 14.4)) * (t >= 14.4 ? 1 : 0);
  ctx.save(); ctx.translate(noise(t * 40, 3) * 18 * shake, noise(t * 40, 7) * 18 * shake);
  backdrop(ctx, 'bg05b_pier_center', o);
  const M = bdMap('bg05b_pier_center', o), [lx, ly] = M.pt(SPOT[0], SPOT[1]);
  const rock = Math.sin((t - 14.21) * 9) * 0.12 * Math.exp(-2.5 * Math.max(0, t - 14.21)) * (t > 14.21 ? 1 : 0);
  if (!globalThis.__noFar) FAR.forEach(([ix, iy, str], k) => {            // the crowd, far off, still rowing to the lights (v2 paints them in)
    const [bx, by] = M.pt(ix + (t - 12.5) * 14, iy);
    prop(ctx, 'prop_boat', bx, by, 70 * M.s, { rot: rock * (k % 2 ? 1 : -1), alpha: 0.9 });
    crackedBalloon(ctx, t, 12.6 + k * 0.14, 13.4 + k * 0.08, bx, by - 30, str);
  });
  const on = sat(t, 12.53, 12.62);
  ctx.fillStyle = `rgba(2,4,14,${0.62 - 0.4 * on})`; ctx.fillRect(-50, -50, W + 100, H + 100);       // dim until the light comes on
  if (on > 0) {                                                         // the light lands with a flash, then settles
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const fl = Math.exp(-8 * Math.max(0, t - 12.53));
    const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 420 * M.s);
    g.addColorStop(0, `rgba(255,248,225,${0.35 * on + 0.4 * fl})`); g.addColorStop(1, 'rgba(255,248,225,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (t > 14.21 && t < 15.2) {                                          // the shock ring over the planks and the water
    const d = t - 14.21, r = 120 + d * 1500, a = 0.7 * (1 - d / 1.0);
    ctx.save(); ctx.strokeStyle = rgba('#E8F6FF', a); ctx.lineWidth = 10 * (1 - d); ctx.beginPath(); ctx.ellipse(lx, ly, r, r * 0.22, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  // the gull crossing the sky
  const gp = sat(t, 12.6, 15.0); if (gp > 0 && gp < 1) prop(ctx, 'prop_gull', lerp(-150, W + 150, gp), 170 + Math.sin(gp * 9) * 30, 150, { sy: 0.8 + 0.25 * Math.sin(t * 16) });
  // the path into the dark, from his finger
  const id = t < 13.34 ? 'm16' : t < 14.21 ? 'm11' : t < 14.84 ? 'm15' : 'm02';
  const pop = id === 'm16' ? E.back(sat(t, 12.53, 12.75)) : 1;
  const shakeHead = id === 'm11' ? Math.sin((t - 13.34) * 22) * 0.035 * (1 - sat(t, 13.34, 14.1)) : 0;
  const imp = id === 'm15' ? Math.exp(-10 * Math.max(0, t - 14.21)) : 0;
  const sz = 450 * M.s, mo = { shadow: true, shadowA: 2.5, rot: shakeHead, sx: (1 + imp * 0.06) * pop, sy: (1 - imp * 0.05) * pop };
  if (id === 'm02') {
    const [fx, fy] = anchorPt('m02', lx, ly + 10, sz, 40, 330), q = E.out(sat(t, 14.95, 15.7));
    const ex = lerp(fx, 120, q), ey = lerp(fy, M.pt(0, 470)[1], q);
    ctx.save(); ctx.strokeStyle = 'rgba(190,240,255,0.95)'; ctx.lineWidth = 7; ctx.setLineDash([18, 16]); ctx.lineDashOffset = -t * 160;
    ctx.shadowColor = 'rgba(120,220,255,1)'; ctx.shadowBlur = 18; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.quadraticCurveTo((fx + ex) / 2, Math.min(fy, ey) - 80, ex, ey); ctx.stroke(); ctx.restore();
    if (q > 0.9) { const a = sat(q, 0.9, 1); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(ex, ey); ctx.rotate(t * 1.5);
      ctx.fillStyle = rgba('#FFFFFF', a); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -46); ctx.lineTo(7, 0); ctx.lineTo(0, 46); ctx.lineTo(-7, 0); ctx.fill(); }
      ctx.restore(); }
  }
  char(ctx, id, lx, ly + 10, sz, mo);
  if (id === 'm16' && t > 12.75 && t < 13.2) {                          // the glint on his glasses
    const [gx, gy] = anchorPt('m16', lx, ly + 10, sz, 440, 280), a = Math.sin(sat(t, 12.75, 13.2) * Math.PI);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(gx, gy); ctx.rotate(t * 2);
    ctx.fillStyle = rgba('#FFFFFF', a); for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -70 * a); ctx.lineTo(8, 0); ctx.lineTo(0, 70 * a); ctx.lineTo(-8, 0); ctx.fill(); }
    ctx.restore();
  }
  if (id === 'm15') {                                                   // impact lines and a puff of dust from the planks
    const a = 1 - sat(t, 14.21, 14.7);
    ctx.save(); ctx.strokeStyle = rgba('#FFF6D8', 0.9 * a); ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (let k = 0; k < 12; k++) { const an = k / 12 * TAU, r0 = 330 + (t - 14.21) * 600, r1 = r0 + 90;
      ctx.beginPath(); ctx.moveTo(lx + Math.cos(an) * r0, ly - 260 + Math.sin(an) * r0 * 0.7); ctx.lineTo(lx + Math.cos(an) * r1, ly - 260 + Math.sin(an) * r1 * 0.7); ctx.stroke(); }
    ctx.restore();
    splash(ctx, t, 14.21, lx, ly + 6, { n: 30, scale: 0.6, tint: '#C9B79A', spread: 2.8, life: 0.7, seed: 3 });
  }
  // she peeks over the near edge of the pier, bottom right, and starts at the squat
  if (t > 12.9) {
    const up = E.out(sat(t, 12.9, 13.4)), jump = t > 14.21 ? Math.exp(-6 * (t - 14.21)) * Math.abs(Math.sin((t - 14.21) * 14)) : 0;
    char(ctx, 'd22', 1640, 1200 + (1 - up) * 300 - jump * 60, 560, { shadow: false, sway: 1.2 });
  }
  ctx.restore();
}

// A6 15.8–19.0  先往前游一段: seen from above at a slant, he swims off into the dark sea in his suit (away from the
// coloured light of the lighthouses, which lies on the water on the right), leaving a glowing wake; she follows in it.
// Water is see-through: below the waterline each swimmer is tinted and faded, not cut off.
let SWIM = null;                          // scratch canvas, cleared before every use
export function swimmer(ctx, id, x, fy, size, o, t, seed) {
  if (!SWIM || SWIM.width !== ctx.canvas.width) SWIM = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const sx = SWIM.getContext('2d'); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over'; sx.filter = 'none';
  sx.clearRect(0, 0, SWIM.width, SWIM.height); sx.setTransform(ctx.getTransform());
  char(sx, id, x, fy, size, { ...o, shadow: false });
  // the waterline runs along the body: everything below it is under water
  const top = fy - size * 0.62, wl = fy - size * 0.36;
  sx.globalCompositeOperation = 'source-atop';
  const g = sx.createLinearGradient(0, top, 0, fy);
  g.addColorStop(0, 'rgba(18,52,110,0)'); g.addColorStop(clamp((wl - top) / (fy - top) - 0.04), 'rgba(18,52,110,0)');
  g.addColorStop(clamp((wl - top) / (fy - top) + 0.04), 'rgba(18,52,110,0.55)'); g.addColorStop(1, 'rgba(10,30,80,0.8)');
  sx.fillStyle = g; sx.fillRect(x - size * 2, top - 10, size * 4, fy - top + 40);
  sx.globalCompositeOperation = 'destination-out';                       // and a little fainter under water
  const g2 = sx.createLinearGradient(0, wl, 0, fy); g2.addColorStop(0, 'rgba(0,0,0,0.05)'); g2.addColorStop(1, 'rgba(0,0,0,0.45)');
  sx.fillStyle = g2; sx.fillRect(x - size * 2, wl, size * 4, fy - wl + 40);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(SWIM, 0, 0); ctx.restore();
  // foam along the waterline and around the reaching hand
  ctx.save(); ctx.fillStyle = 'rgba(235,250,255,1)'; ctx.filter = 'blur(2px)';     // a little broken foam where the body cuts the water
  for (let k = 0; k < 9; k++) {
    const u = (rnd(k, seed + 40) - 0.5) * 1.2, fx = x + u * size * 0.9, fyy = wl + (rnd(k, seed + 41) - 0.5) * 22 + Math.sin(t * 6 + k) * 4;
    ctx.globalAlpha = 0.25 + 0.35 * Math.sin(t * 7 + k * 2.3 + seed) ** 2;
    ctx.beginPath(); ctx.ellipse(fx, fyy, 10 + rnd(k, seed + 42) * 22, 5 + rnd(k, seed + 43) * 5, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
export function sA6(ctx, t) {
  const pan = sat(t, 15.8, 19.0);
  backdrop(ctx, 'bg06_dark_sea_top', { z: 1.25, fx: lerp(0.62, 0.38, pan), fy: 0.5 });
  ctx.save(); ctx.globalCompositeOperation = 'screen';                   // the lighthouses' light glitters on the water, off to the right
  const COLS = ['#E8DDFF', '#FFB15A', '#6FC3FF'];
  for (let k = 0; k < 150; k++) {
    const c = k % 3, x = W * (0.55 + 0.45 * rnd(k, 71)) + Math.sin(t * 0.7 + k) * 10, y = H * (0.18 + c * 0.27) + (rnd(k, 72) - 0.5) * 150 * (x / W);
    const a = (x / W - 0.5) * 1.6 * (0.3 + 0.7 * Math.sin(t * 5 + k * 1.7) ** 8);
    ctx.fillStyle = rgba(COLS[c], clamp(a)); ctx.beginPath(); ctx.arc(x, y, 2.5 + rnd(k, 73) * 4, 0, TAU); ctx.fill();
  }
  ctx.restore();
  const p = E.io(sat(t, 15.85, 18.7)), mx = lerp(1700, 420, p), my = 560 + Math.sin(t * 2) * 8;
  const stroke = Math.sin(t * Math.PI * 2 / 0.8);                         // one stroke every two beats
  // the wake: from the far right to him, glowing, with foam
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(26px)';       // a soft glow down the middle of the wake
  const g = ctx.createLinearGradient(mx, 0, W + 100, 0); g.addColorStop(0, 'rgba(140,230,255,0.55)'); g.addColorStop(1, 'rgba(140,230,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(mx + 120, my + 190); ctx.lineTo(W + 200, my + 40); ctx.lineTo(W + 200, my + 400); ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.filter = 'blur(1.5px)';                                // two foamy edges opening out behind him
  for (const side of [-1, 1]) for (let k = 0; k < 70; k++) {
    const u = k / 70, x = mx + 200 + u * (W + 200 - mx) + rnd(k, side + 90) * 30, y = my + 210 + side * (24 + u * 170) + Math.sin(u * 26 + t * 4 + side) * 8 + (rnd(k, side + 91) - 0.5) * 18;
    ctx.fillStyle = `rgba(235,250,255,${0.7 * (1 - u) * (0.55 + 0.45 * Math.sin(k * 2.7 + t * 6) ** 2)})`;
    ctx.beginPath(); ctx.ellipse(x, y, 10 + 14 * (1 - u) * rnd(k, side + 92), 5 + 5 * (1 - u), 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
  swimmer(ctx, 'm17', mx, my + 210, 820, { rot: stroke * 0.035, sy: 1 + stroke * 0.02 }, t, 1);
  for (let k = 0; k < 8; k++) splash(ctx, t, 15.9 + k * 0.4, mx - 230, my + 20, { n: 14, scale: 0.5, seed: k * 3 + 1, life: 0.7, spread: 1.6 });
  if (t > 17.0) {                                                         // she follows in the wake
    const q = E.out(sat(t, 17.0, 19.0)), fx = lerp(W + 400, 1300, q), fyy = my + 60 + Math.sin(t * 2.4) * 10;
    swimmer(ctx, 'd21', fx, fyy + 170, 600, { sway: 1.4, windX: 0.6, rot: Math.sin(t * 4) * 0.03 }, t, 5);
  }
}

// A7 19.0–22.0  于是我憋了一口气: she takes a deep breath and makes up her mind
export function sA7(ctx, t) {
  const pz = 1 + 0.12 * E.io(sat(t, 19.0, 21.2));
  ctx.save(); ctx.translate(W / 2, 430); ctx.scale(pz, pz); ctx.translate(-W / 2, -430);
  backdrop(ctx, 'bg03b_lighthouses_lit', { z: 1.3, fy: 0.62, blur: 6, dark: 0.25 });
  const br = sat(t, 19.6, 20.1) - sat(t, 21.3, 21.9) * 0.6;
  const sink = E.in(sat(t, 21.3, 22.0));
  const x = W / 2, fy = 1010 + sink * 520;
  ctx.save(); ctx.globalCompositeOperation = 'screen';                 // the breath: a soft ring of light
  const r = 200 + 520 * E.out(sat(t, 20.02, 20.9)), ga = 0.5 * (1 - sat(t, 20.2, 21.0)) * (t > 20.02 ? 1 : 0);
  ctx.strokeStyle = rgba('#9EE8FF', ga); ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(x, 520, r, 0, TAU); ctx.stroke(); ctx.restore();
  char(ctx, 'd08', x, fy, 760, { shadow: false, sx: 1 + br * 0.035, sy: 1 + br * 0.05, sway: 1.1 });
  ctx.save(); const wg = ctx.createLinearGradient(0, 860, 0, H); wg.addColorStop(0, 'rgba(14,42,99,0)'); wg.addColorStop(0.4, 'rgba(14,42,99,0.9)'); wg.addColorStop(1, '#06143A');
  ctx.fillStyle = wg; ctx.fillRect(0, 860, W, H - 860); ctx.restore();
  ripples(ctx, t, x, 1000, 300, { alpha: 0.5 + sink * 0.5, speed: 0.9 });
  splash(ctx, t, 21.75, x, 980, { n: 40, scale: 0.9 });
  bubbles(ctx, t, { n: 16, maxR: 9, alpha: 0.35, seed: 44 });
  ctx.restore();
}

// A8 22.0–25.7  沉到最深 最深的地方: down through the dark, a depth gauge spinning; she lands at a little desk and reads
export const DEPTH = [[22.0, 0], [22.75, 200], [23.0, 1000], [23.56, 1800], [23.76, 6000], [24.43, 10000]];
export const depthAt = t => { for (let i = 1; i < DEPTH.length; i++) if (t < DEPTH[i][0]) { const [a, da] = DEPTH[i - 1], [b, db] = DEPTH[i]; return lerp(da, db, E.io(sat(t, a, b))); } return 10000; };
export function gauge(ctx, t, d) {
  const x = 1720, y0 = 160, h = 700;
  ctx.save(); ctx.globalAlpha = 0.9;
  ctx.strokeStyle = 'rgba(200,240,255,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y0 + h); ctx.stroke();
  const per = 60, off = (d * 0.6) % per;
  for (let y = y0 - off; y < y0 + h; y += per / 2) { if (y < y0) continue; const big = Math.round((y + off - y0) / (per / 2)) % 2 === 0;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - (big ? 34 : 18), y); ctx.stroke(); }
  ctx.font = font(44, 800, SANS); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#E8FBFF';
  ctx.shadowColor = 'rgba(80,200,255,0.9)'; ctx.shadowBlur = 18;
  ctx.fillText(`${Math.round(d).toLocaleString('en-US')} 米`, x - 50, y0 + h / 2);
  ctx.restore();
}
export function sA8(ctx, t) {
  if (t < 24.43) {
    const d = depthAt(t), sp = (t > 22.75 && t < 23.2) || (t > 23.56 && t < 24.0) ? 1 : 0.4;
    backdrop(ctx, 'bg07_abyss', { z: 1.5, fy: lerp(0.15, 0.85, sat(t, 22.0, 24.43)) });
    bubbles(ctx, t * (1 + sp * 2), { n: 50, maxR: 8, alpha: 0.45, seed: 9 });
    ctx.save(); ctx.strokeStyle = `rgba(190,240,255,${0.35 * sp})`; ctx.lineWidth = 3;           // speed lines on the two 最深
    for (let k = 0; k < 26; k++) { const x = rnd(k, 61) * W, y = ((rnd(k, 62) * H - t * 1400) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 140); ctx.stroke(); }
    ctx.restore();
    // the original dive pose (d09); 本人 10-18 tried a back view (d26), a dive towards the camera (d28) and an
    // upside-down standing pose (d30), then chose to keep this one
    const wig = Math.sin(t * 9) * 0.04, plunge = E.out(sat(t, 22.0, 22.35));
    if (img('prop_fishes')) { const fp = sat(t, 22.4, 24.3); prop(ctx, 'prop_fishes', lerp(-300, W + 300, fp), 300 + Math.sin(fp * 6) * 30, 420, { alpha: 0.85 }); }
    char(ctx, 'd09', W / 2 + Math.sin(t * 3) * 20, lerp(-60, 960, plunge), 740, { shadow: false, rot: wig, sway: 1.6, windY: -0.8 });
    if (t < 22.6) bubbles(ctx, t * 3, { n: 40, x0: W / 2 - 220, x1: W / 2 + 220, maxR: 16, alpha: 0.7 * (1 - sat(t, 22.2, 22.6)), seed: 88 });
    gauge(ctx, t, d);
    return;
  }
  const o = { z: lerp(1.25, 1.14, E.out(sat(t, 24.43, 25.7))), fx: 0.55, fy: 0.55 };
  backdrop(ctx, 'bg08_seabed_study', o);
  const M = bdMap('bg08_seabed_study', o), dx = 760, dy = 900;
  bubbles(ctx, t, { n: 14, maxR: 7, alpha: 0.4 });
  const [sx2, sy2] = anchorPt('d10', dx, dy, 660, ...SEAT_D10);               // the books she sits on, under her seat
  prop(ctx, img('prop_bookseat') ? 'prop_bookseat' : 'prop_coin', sx2, sy2 - 70 + 82, 280);
  char(ctx, 'd10', dx, dy - 70, 660, { shadow: false, ...breathe(t) });
  receipt(ctx, ...M.pt(...DESK.note), t, 24.6);
  const [bx, by] = anchorPt('d10', dx, dy - 70, 660, 304, 600);
  ['MoE', 'MLA', 'FP8', 'GRPO'].forEach((w, i) => {                     // DeepSeekMoE, multi-head latent attention, FP8 training, GRPO
    const t0 = 24.6 + i * 0.22, d = t - t0; if (d < 0) return;
    const a = sat(d, 0, 0.2) * (1 - sat(d, 0.9, 1.3));
    glowWord(ctx, w, bx + 330 + i * 120 + Math.sin(d * 3 + i) * 14, by - 40 - i * 30 - d * 170, 46, { alpha: a, color: '#FFF4CC', glow: 'rgba(255,200,90,0.9)', stroke: '#3A2A10', sw: 0.08 });
  });
  ctx.fillStyle = rgba('#FFFFFF', 0.7 * (1 - sat(t, 24.43, 24.6))); ctx.fillRect(0, 0, W, H);
}
export const DESK = { stool: [1020, 650], note: [1250, 400], saucer: [990, 498], stand: [700, 660] };   // bg08 (image px, tools/bggrid.py)
// a little paper pinned up: V3's own training bill
export function receipt(ctx, x, y, t, t0) {
  if (t < t0) return;
  const p = E.back(sat(t, t0, t0 + 0.3));
  ctx.save(); ctx.translate(x, y); ctx.rotate(0.06); ctx.scale(p, p);
  ctx.fillStyle = '#FFF8E8'; ctx.strokeStyle = '#2A2B44'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-90, -70); ctx.lineTo(90, -70); ctx.lineTo(90, 60);
  for (let k = 0; k < 9; k++) ctx.lineTo(90 - (k + 0.5) * 20, 60 + (k % 2 ? 0 : 10));
  ctx.lineTo(-90, 60); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#E2455C'; ctx.beginPath(); ctx.arc(0, -70, 9, 0, TAU); ctx.fill();
  ctx.fillStyle = '#2A2B44'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = font(26, 700, SANS); ctx.fillText('训练费', 0, -28);
  ctx.font = font(30, 900, SANS); ctx.fillText('557.6 万美元', 0, 16);
  ctx.restore();
}
