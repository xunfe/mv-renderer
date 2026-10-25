// v2 §21: 他们笑我 是拼多多 and 浪一路拍到了华尔街, redesigned from scratch after 本人's review of v5 (10-22).
import { W, H, TAU, lerp, sat, E, rnd, plate, sheet, frame, cover, strip, shake, burst, stream } from './core.js';
import { backdrop, bdMap, prop, glowWord, balloon, warpQuad, ripples, img } from '../common.js';
import { char, breathe, anchorPt } from '../chars.js';
import { rgba, font, SANS, noise } from '../lib.js';
import { withPoses } from './plus.js';
import * as B from '../scenesB.js';
import * as C from '../scenesC.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
// a plate drawn with cover(z, fx, fy): where its image point lands
const coverPt = (im, z, fx, fy) => { const s = Math.max(W / im.width, H / im.height) * z, w = im.width * s, h = im.height * s, x0 = W / 2 - fx * w, y0 = H / 2 - fy * h;
  return { s, pt: (ix, iy) => [x0 + ix * s, y0 + iy * s] }; };

// ---------------------------------------------------------------- 他们笑我 是拼多多 (28.6–31.6). 本人: the boats and the yachts were the same
// idea twice. The point of the line is a price: they are the luxury goods, she is the cheap knock-off. So: a luxury boutique — gold
// crowns behind glass with gold tags ($200 / 月), chandeliers, marble — and in the middle of the marble floor, on the little red rug,
// her, with a cardboard sign stuck in the floor beside her: ¥1. The rich shoppers on both sides point at her and laugh (他们笑我), and on
// 是 the 拼多多 sticker comes down and slaps onto her forehead; the whole shop roars; she peels it off and smiles.
const RICH = [[2, 130, 845, 330, 0], [0, 520, 885, 370, 1], [1, 270, 1075, 480, 2], [5, 1790, 845, 330, 3], [3, 1400, 885, 370, 4], [4, 1650, 1075, 480, 5]];   // [frame, x, y, h, i]
// 本人 10-23: the two $200-a-month treasures in the cases are 姐姐 (ChatGPT) and 橙子 (Claude): both really cost $200 a month.
// They stand on the velvet in the glass cases (n_boutique2: the crowns taken out), poised like the goods they are; on 拼多多 they
// turn to look, and on the slap 姐姐 covers her mouth and 橙子 lifts her book to her chin. [sheet, x, feet y (n_boutique image px)]
const SHOW = [['n_gpt_show', 132, 468], ['n_orange_show', 1408, 468]], SHOW_H = 250;
const SAY = [[29.23, 360, 560, '哈哈哈'], [29.51, 1560, 560, '便宜货～'], [29.87, 560, 430, '哈哈哈哈'], [30.22, 1360, 430, '拼多多！']];
function priceTag(ctx, x, y, s, rot, str, gold) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = gold ? '#7A5A10' : '#5A3A1A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, -24); ctx.stroke();
  ctx.fillStyle = gold ? '#F6D36B' : '#C9A26B'; ctx.strokeStyle = gold ? '#7A5A10' : '#5A3A1A'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(-70, -24); ctx.lineTo(70, -24); ctx.lineTo(70, 40); ctx.lineTo(-70, 40); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (gold) { ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(-64, -18, 128, 10); }
  ctx.fillStyle = gold ? '#5A3A00' : '#3A2010'; ctx.font = font(gold ? 34 : 50, 900, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 9);
  ctx.restore();
}
export function shotQ(ctx, t) {
  const slam = t >= 30.82 ? Math.exp(-14 * (t - 30.82)) : 0, roar = t >= 30.82 ? Math.exp(-1.6 * (t - 30.82)) : 0;
  ctx.save(); ctx.translate(noise(t * 50, 4) * 26 * slam, noise(t * 50, 8) * 26 * slam);
  const im = plate('n_boutique2') ?? plate('n_boutique'), Z = 1.0, FX = 0.5, FY = 0.5;      // (Z 1.0: the two cases inside the frame)
  cover(ctx, im, { z: Z, fx: FX, fy: FY });
  const P = im ? coverPt(im, Z, FX, FY) : { s: 1, pt: (x, y) => [x, y] };
  ctx.save(); ctx.globalCompositeOperation = 'screen';                     // the chandelier and the crowns glitter
  for (let k = 0; k < 40; k++) { const [x, y] = P.pt(...[[768, 90], [125, 505], [1415, 505]][k % 3]), dx = (rnd(k, 3) - 0.5) * (k % 3 ? 160 : 320) * P.s, dy = (rnd(k, 4) - 0.5) * (k % 3 ? 90 : 150) * P.s;
    const a = 0.9 * Math.max(0, Math.sin(t * (3 + rnd(k, 5) * 4) + k * 1.7)) ** 8; if (a < 0.03) continue;
    ctx.strokeStyle = rgba('#FFF6D8', a); ctx.lineWidth = 2.5; const r = 8 + 10 * rnd(k, 6);
    ctx.beginPath(); ctx.moveTo(x + dx - r, y + dy); ctx.lineTo(x + dx + r, y + dy); ctx.moveTo(x + dx, y + dy - r); ctx.lineTo(x + dx, y + dy + r); ctx.stroke(); }
  ctx.restore();
  SHOW.forEach(([id, ix, iy], i) => {                                       // 姐姐 and 橙子 in the cases, behind the glass
    const [x, y] = P.pt(ix, iy), h = SHOW_H * P.s, ft = FT(t), k = ft < 30.22 ? 0 : ft < 30.85 ? 1 : 2;
    L.put(ctx, id, k, x, y, h, { sy: 1 + 0.012 * Math.sin(t * 2.6 + i * 1.7) });
    ctx.save(); ctx.beginPath(); ctx.rect(x - h * 0.62, y - h * 1.08, h * 1.24, h * 1.08); ctx.clip(); ctx.globalCompositeOperation = 'screen';
    for (const [o, w, a] of [[-0.25, 0.16, 0.09], [0.2, 0.07, 0.07]]) {      // the glass in front of them: two soft diagonal glints
      const cx = x + o * h + Math.sin(t * 0.7 + i) * 6; ctx.fillStyle = rgba('#FFFFFF', a);
      ctx.beginPath(); ctx.moveTo(cx - w * h, y - h * 1.1); ctx.lineTo(cx + w * h, y - h * 1.1); ctx.lineTo(cx + w * h - 0.5 * h, y); ctx.lineTo(cx - w * h - 0.5 * h, y); ctx.fill(); }
    ctx.restore();
    const [tx, ty] = P.pt(ix, iy - SHOW_H - 34);                            // their price, hung above them
    priceTag(ctx, Math.min(Math.max(tx, 150), W - 150), ty, 1.1, 0, '$200 / 月', true);
  });
  const [fx, fy] = P.pt(768, 724), x = fx, sz = 640, hit = FT(t) >= 30.82;
  RICH.filter(r => r[2] < 1000).forEach(([k, rx, ry, h, i]) => {           // the crowd behind her first
    const laugh = Math.abs(Math.sin(t * (9 + i) + i)) * (6 + 18 * roar), rock = Math.sin(t * (7 + i) + i) * (0.02 + 0.05 * roar);
    L.put(ctx, 'n_rich', k, rx, ry - laugh, h, { rot: rock });
  });
  withPoses({ d60: { sheet: 'c_b2', ref: 2, keys: [[0, 2]] }, d12: { sheet: 'c_b2', ref: 2, keys: [[0, 0], [31.0, 1], [31.4, 3]] } }, t, () =>
    char(ctx, hit ? 'd12' : 'd60', x, fy, sz, { shadow: true, ...breathe(t), sy: 1 - 0.05 * slam, sx: 1 + 0.03 * slam }));
  { const sx = x + 300, sy = fy + 40, s = 1 + 0.15 * slam;                  // her price: a cardboard sign stuck in the floor
    ctx.save(); ctx.strokeStyle = '#6B4A2A'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, sy - 150); ctx.stroke(); ctx.restore();
    priceTag(ctx, sx, sy - 160, 1.25 * s, 0, '¥1', false); }      // (本人 10-22: 字歪了 -> all the words level)
  RICH.filter(r => r[2] >= 1000).forEach(([k, rx, ry, h, i]) => {           // the two in front, big
    const laugh = Math.abs(Math.sin(t * (9 + i) + i)) * (8 + 22 * roar), rock = Math.sin(t * (7 + i) + i) * (0.02 + 0.05 * roar);
    L.put(ctx, 'n_rich', k, rx, ry - laugh, h, { rot: rock });
  });
  SAY.forEach(([t0, bx, by, str], i) => balloon(ctx, t, t0, bx, by + Math.sin(t * 9 + i) * 5, str, { size: 40 }));
  const [bx, by] = anchorPt('d12', x, fy, sz, ...B.POS.brow);
  if (t > 30.5) {                                                            // the sticker (v1): down from above, slap, throb, peeled off
    const fall = E.in(sat(t, 30.5, 30.82)), peel = E.in(sat(t, 31.22, 31.55));
    const s0 = lerp(3.6, 0.6, fall), rot = lerp(1.9, -0.18, fall), px = lerp(x + 520, bx + 40, fall) + peel * 900, py = lerp(-500, by - 70, fall) - peel * 650;
    const throb = t > 30.97 && t < 31.22 ? Math.exp(-10 * ((t - 30.97) % 0.25)) : 0;
    B.badge(ctx, px, py, s0 * (1 + 0.25 * slam), rot + peel * 3, throb);
  }
  if (hit && t < 31.3) {
    const d = t - 30.82, a = 1 - sat(d, 0.25, 0.48);
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.9 * a); ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let q = 0; q < 16; q++) { const an = q / 16 * TAU, r0 = 200 + d * 900, r1 = r0 + 140; ctx.beginPath(); ctx.moveTo(bx + Math.cos(an) * r0, by + Math.sin(an) * r0); ctx.lineTo(bx + Math.cos(an) * r1, by + Math.sin(an) * r1); ctx.stroke(); }
    ctx.restore();
    const p = E.back(sat(d, 0, 0.14)); ctx.save(); ctx.translate(bx - 330, by - 120); ctx.rotate(-0.2); ctx.scale(p, p);
    glowWord(ctx, '啪！', 0, 0, 130, { alpha: a, color: '#FFFFFF', stroke: '#7A0E12', glow: 'rgba(255,90,90,0.9)' }); ctx.restore();
    ctx.fillStyle = rgba('#FFFFFF', 0.6 * (1 - sat(d, 0, 0.1))); ctx.fillRect(-50, -50, W + 100, H + 100);
  }
  ctx.restore();
}

// ---------------------------------------------------------------- 浪一路拍到了华尔街 (44.2–47.3). 本人: the wave scenes had a problem at their
// root. The line follows on from 整片海都翻了天: the wave she set off travels all the way (一路) across the ocean and lands on Wall
// Street. So she rides it: 浪一路 — at sunset she surfs the wave on her red candle board across the open sea, New York's skyline
// coming up ahead; 拍到了 — the wave bursts into Wall Street in one great splash and she rides it in and lands her board on the back
// of the charging bull; 华尔街 — the traders on the pavements are drenched, NVDA is falling on the big screen, and she stands on the
// bull. (Not a flood: a splash.)
const SURF_T = 45.14, LAND = 45.56, BULL = [1065, 588];                    // bg14: the top of the bull's back (image px)
function wallStreet(ctx, t) {
  const o = { z: 1.1, fx: 0.5, fy: 0.5 }, M = bdMap('bg14_wallstreet', o);
  const [sx, sy] = shake(t, [[SURF_T, 34, 0.6], [LAND, 18, 0.4]]);
  ctx.save(); ctx.translate(sx, sy);
  backdrop(ctx, 'bg14_wallstreet', o);
  warpQuad(ctx, C.POS.ticker.map(p => M.pt(...p)), 640, 400, (x, sw, sh) => C.tickerScreen(x, sw, sh, lerp(44.6, 46.2, sat(t, 45.9, 46.94))));
  const [bx, by] = M.pt(...BULL), lvl = 70 + 60 * Math.exp(-2 * Math.max(0, t - SURF_T)), wy = H - lvl;
  const TR = [[5, 640, 880, 240], [3, 130, 990, 360], [0, 400, 1080, 400], [4, 880, 1075, 230], [2, 1600, 1100, 330], [1, 1830, 1085, 390]];     // on the pavements, clear of the bull
  TR.forEach(([k, x, y, h], i) => L.put(ctx, 'n_traders2', k, x + (k === 0 ? Math.sin(t * 30) * 4 : 0), y + (k === 2 ? -Math.abs(Math.sin(t * 8)) * 8 : 0), h, { flip: x > W / 2 && k !== 3 }));
  const g = ctx.createLinearGradient(0, wy, 0, H); g.addColorStop(0, 'rgba(110,220,230,0.75)'); g.addColorStop(1, 'rgba(30,130,170,0.85)');   // the water sheet left behind
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, wy); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, wy + Math.sin(x / 80 + t * 6) * 8); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, wy + Math.sin(x / 80 + t * 6) * 8); ctx.stroke();
  ripples(ctx, t, bx, M.pt(0, 930)[1], 260, { alpha: 0.6, speed: 0.9 });
  for (let q = 0; q < 14; q++) { const d = t - SURF_T, x = (rnd(q, 31) * W + d * (160 + 80 * rnd(q, 32))) % (W + 100), y = 80 + rnd(q, 33) * 520 + Math.sin(d * 3 + q) * 40 + d * 80;   // papers in the air
    ctx.save(); ctx.translate(x, y); ctx.rotate(d * (2 + q % 3) + q); ctx.fillStyle = '#F7F4EA'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.fillRect(-24, -31, 48, 62); ctx.strokeRect(-24, -31, 48, 62); ctx.restore(); }
  // her: riding the front of the splash in from the left, landing her board on the bull's back on 到
  const tk = FT(t), p = E.out(sat(t, SURF_T, LAND)), hx = lerp(-200, bx, p), hy = lerp(H * 0.45, by + 6, p) - Math.sin(p * Math.PI) * 140;
  const [id, k, flip] = tk < LAND ? ['a_surf2', 0, true] : tk < 46.94 ? ['a_surf1', 0, false] : ['a_surf2', 5, false];
  const land = t > LAND ? Math.exp(-7 * (t - LAND)) : 0;
  if (tk < LAND) stream(t, { period: 0.01, life: 0.45, seed: 61 }, (i, q, age, r) => {   // spray off her board
    const bp = E.out(sat(i * 0.01, SURF_T, LAND)), x0 = lerp(-200, bx, bp), y0 = lerp(H * 0.45, by + 6, bp) - Math.sin(bp * Math.PI) * 140;
    L.put(ctx, 'fx_drops', [0, 1, 13, 15][i % 4], x0 - 160 - age * 500 * r(1), y0 + age * 300 - 20, (14 + 24 * r(2)), { anchor: 'body', alpha: 0.85 * (1 - q), rot: -1.2 });
  });
  L.put(ctx, id, k, hx, hy, 470 * (1 - 0.06 * land), { flip, sy: 1 - 0.05 * land });
  if (t > LAND) burst(ctx, t, LAND, bx, by + 10, { n: 50, seed: 62, speed: [400, 1300], size: [14, 36], w: 260 });
  ctx.restore();
  if (t >= SURF_T && t < SURF_T + 0.5) {                                    // the splash bursting in from the left, over everything
    const d = t - SURF_T;
    L.put(ctx, 'fx_crash', Math.min(7, 4 + Math.floor(d / 0.08)), 420, H + 120, 1250, { anchor: 'body', alpha: 1 - sat(d, 0.3, 0.5) });
    burst(ctx, t, SURF_T, 300, H * 0.75, { n: 120, seed: 63, speed: [900, 2400], size: [20, 60], w: 500, ang: [-Math.PI * 0.85, -Math.PI * 0.1], g: 2400 });
    ctx.fillStyle = rgba('#F4FFFF', 0.5 * (1 - sat(d, 0, 0.15))); ctx.fillRect(0, 0, W, H);
  }
}
function openSea(ctx, t) {
  const im = plate('n_manhattan'), p = sat(t, 44.2, SURF_T), Z = lerp(1.0, 1.4, E.in(p)), FX = lerp(0.5, 0.56, p), FY = 0.6;
  cover(ctx, im, { z: Z, fx: FX, fy: FY });
  const tk = FT(t), k = tk < 44.68 ? 0 : 4, x = 640 + Math.sin(t * 2.2) * 30, y = 640 + Math.sin(t * 3.1) * 14;     // high on the wave, left of the skyline
  const wv = plate('p_wave_near');                                          // the wave she rides: its highest crest under her board
  if (wv) { const sc = 3000 / wv.width; ctx.drawImage(wv, x - 1000 * sc + Math.sin(t * 1.5) * 20, y + 40 - 400 * sc, wv.width * sc, wv.height * sc); }
  stream(t, { period: 0.008, life: 0.5, seed: 64 }, (i, q, age, r) => {    // spray streaming off the back of the board
    L.put(ctx, 'fx_drops', [0, 1, 13, 15, 3][i % 5], x - 200 - age * 1200 * (0.6 + r(1)), y - 20 - Math.sin(q * Math.PI) * (60 + 140 * r(2)) + age * 160, 16 + 30 * r(3), { anchor: 'body', alpha: 0.9 * (1 - q), rot: -1.3 });
  });
  L.put(ctx, 'a_surf2', k, x, y, 520, { flip: true, rot: Math.sin(t * 2.6) * 0.03 });
  ctx.save(); ctx.globalCompositeOperation = 'screen';                      // speed lines over the water
  for (let q = 0; q < 14; q++) { const u = ((t - 44.2) * (1.6 + rnd(q, 71)) + rnd(q, 72)) % 1, yy = H * 0.62 + rnd(q, 73) * H * 0.36, xx = W + 200 - u * (W + 600);
    ctx.strokeStyle = rgba('#FFFFFF', 0.35 * Math.sin(u * Math.PI)); ctx.lineWidth = 3 + 3 * rnd(q, 74); ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + 260, yy); ctx.stroke(); }
  ctx.restore();
}
export function shotV(ctx, t) { if (t < SURF_T) openSea(ctx, t); else wallStreet(ctx, t); }
