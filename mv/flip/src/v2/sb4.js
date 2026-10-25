// v2 §20 (continued): the five shots 本人 found plain or cheap in v4 (10-22): 一块钱 一百万个字, 他们笑我 是拼多多, 浪一路拍到了华尔街,
// 把全世界 都叫醒一遍, 谁想去远方; and 你等过一整个春节. Song clock. Each says what the line needs.
import { W, H, TAU, clamp, lerp, sat, E, rnd, plate, sheet, frame, ballistic, burst, strip, shake } from './core.js';
import { backdrop, bdMap, prop, glowWord, bubbles as cBubbles, ripples, balloon, warpQuad, fmt, img } from '../common.js';
import { char, breathe, anchorPt } from '../chars.js';
import { rgba, font, SANS, drawGlyph, noise } from '../lib.js';
import { withPoses } from './plus.js';
import { maskedScreen } from '../common.js';
import { dsPhone } from '../ui.js';
import { QS } from '../scenesD.js';
import * as A from '../scenesA.js';
import * as B from '../scenesB.js';
import * as C from '../scenesC.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;                                 // pick drawings by the output frame (no blended ghosts)
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
// where a point of frame k of a sheet lands, when the frame is drawn standing on (x, y) at scale sc
const ptIn = (id, k, x, y, sc, px, py) => { const f = sheet(id)?.frames[k]; return f ? [x + (px - f.ax) * sc, y + (py - (f.h - 3)) * sc] : [x, y]; };

// ---------------------------------------------------------------- 一块钱 一百万个字 (25.7–28.6). The point is the contrast: one tiny
// coin, a flood of words. She shows us the ¥1 coin (一块), flicks it up, it drops into her teacup on 钱 (叮); on 一百万个字 the cup
// erupts: a fountain of glowing words shoots to the top of the frame and rains down over the whole study, the counter running to
// 1,000,000. (v1: she poured a thin stream from a teapot.)
const CUP = [[433, 400], [433, 398], [330, 350], [378, 320]], COIN_UP = [376, 58];      // n_coin: the cup in each drawing; the flicked coin
export function shotP(ctx, t) {
  const o = { z: lerp(1.3, 1.36, sat(t, 25.7, 28.6)), fx: 0.52, fy: 0.55 };
  backdrop(ctx, 'bg08_seabed_study', o);
  const M = bdMap('bg08_seabed_study', o);
  L.studyBg(ctx, t, M);
  cBubbles(ctx, t, { n: 12, maxR: 7, alpha: 0.35 });
  A.receipt(ctx, ...M.pt(...A.DESK.note), t, 0);
  const X = 660, Y = 1000, sc = 780 / 611, tk = FT(t), k = tk < 26.25 ? 0 : tk < 26.4 ? 1 : tk < 27.35 ? 2 : 3;
  const [cx, cy] = ptIn('n_coin', k, X, Y, sc, ...CUP[k]), erupt = sat(t, 27.35, 27.5);
  if (erupt > 0) { glow(ctx, cx, cy - 300, 700, '#FFE7A0', 0.35 * erupt); glow(ctx, cx, cy, 260, '#FFFFFF', 0.5 * Math.exp(-4 * (t - 27.35))); }
  frame(ctx, 'n_coin', k, X, Y, sc, { anchor: 'bottom' });
  if (t >= 26.4 && t < 26.72) {                                             // the coin: up from her thumb, spinning, and down into the cup
    const [ux, uy] = ptIn('n_coin', 1, X, Y, sc, ...COIN_UP), [c2x, c2y] = ptIn('n_coin', 2, X, Y, sc, ...CUP[2]), p = sat(t, 26.4, 26.69);
    const x = lerp(ux, c2x, p), y = lerp(uy, c2y - 30, p) - Math.sin(p * Math.PI) * 220;
    prop(ctx, 'prop_coin_yuan', x, y, 74, { sx: Math.abs(Math.cos(t * 30)) * 0.9 + 0.1 });
    glow(ctx, x, y, 60, '#FFE08A', 0.6);
  }
  if (t >= 26.69 && t < 27.2) {                                             // 叮
    const d = t - 26.69; ctx.save(); ctx.strokeStyle = rgba('#FFF1B8', 0.8 * (1 - d / 0.5)); ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(cx, cy - 10, 40 + d * 300, (40 + d * 300) * 0.35, 0, 0, TAU); ctx.stroke(); ctx.restore();
    const p = E.back(sat(d, 0, 0.15)); ctx.save(); ctx.translate(cx + 140, cy - 150); ctx.scale(p, p);
    glowWord(ctx, '叮', 0, 0, 80, { alpha: 1 - sat(d, 0.3, 0.5), color: '#FFF4CC', glow: 'rgba(255,200,90,0.9)', stroke: '#3A2A10', sw: 0.08 }); ctx.restore();
  }
  if (t >= 27.35) {                                                         // the fountain of words
    const n = Math.floor((t - 27.35) * 300);
    for (let i = 0; i < n; i++) {
      const born = 27.35 + i / 300, age = t - born, r = q => rnd(i, q + 300);
      const vx0 = (r(1) - 0.3) * 1700, vy0 = -(1400 + r(2) * 1300), kd = 1.3, g = 560;      // a wide fountain, leaning right, filling the study
      const x = ballistic(cx, vx0, 0, kd, age) + Math.sin(age * 2 + i) * 20 * sat(age, 0.6, 1.2), y = ballistic(cy - 20, vy0, g, kd, age);
      if (y > H + 40) continue;
      drawGlyph(ctx, B.WORDS[i % B.WORDS.length], x, y, 24 + r(3) * 26, { color: r(4) < 0.5 ? '#D9FBFF' : '#FFF3C2', weight: 800, fam: SANS, rot: (r(5) - 0.5) * 0.8 + age * (r(6) - 0.5) });
    }
    const v = Math.round(1e6 * E.out(sat(t, 27.4, 28.4))), a = sat(t, 27.35, 27.5);
    ctx.save(); ctx.globalAlpha = a; glowWord(ctx, fmt(v) + ' 字', 1420, 600, 110, { color: '#FFFFFF', glow: 'rgba(255,215,110,0.95)' });     // 本人 10-22: down in the right-middle space
    glowWord(ctx, '只要 ¥1', 1420, 725, 60, { color: '#FFE7A0', glow: 'rgba(255,215,110,0.8)' }); ctx.restore();
  }
}

// ---------------------------------------------------------------- 他们笑我 是拼多多 (28.6–31.6). Who laughs, and at whom: two towering
// luxury yachts, their rich passengers crowding the rails, pointing down and laughing at her standing in the sea between them; on 是
// the 拼多多 sticker comes down from above and slaps onto her forehead, the yachts rock with laughter; she peels it off and smiles
const Q_SAY = [[29.23, 0, '哈哈哈'], [29.51, 1, '便宜货～'], [29.87, 0, '哈哈哈哈'], [30.22, 1, '拼多多！']];
function nightSea(ctx, hz, drift) {
  ctx.fillStyle = '#0A1638'; ctx.fillRect(0, 0, W, H);
  const far = plate('p_night_far');
  if (far) { const w = W * 1.15, h = w * far.height / far.width, x0 = -W * 0.075 - drift, y0 = hz - h * (745 / 1024); ctx.drawImage(far, x0, y0, w, h);
    for (const [ix, iy, col] of [[245, 455, '#E8DDFF'], [765, 430, '#FFB15A'], [1270, 455, '#6FC3FF']]) glow(ctx, x0 + ix / far.width * w, y0 + iy / far.height * h, 60, col, 0.8); }
  const sh = H * 1.15; strip(ctx, plate('p_night_sea'), hz + 0.4 * sh, sh, drift * 3);
}
export function shotQ(ctx, t) {
  const slam = t >= 30.82 ? Math.exp(-14 * (t - 30.82)) : 0, roar = t >= 30.82 ? Math.exp(-2 * (t - 30.82)) : 0;
  ctx.save(); ctx.translate(noise(t * 50, 4) * 26 * slam, noise(t * 50, 8) * 26 * slam);
  nightSea(ctx, H * 0.46, (t - 28.6) * 12);
  const yacht = (k, x, side) => {                                            // a yacht towering over her, rocking with laughter
    const rock = Math.sin(t * (6 + side) + side) * (0.012 + 0.03 * roar), bob = Math.sin(t * 2.2 + side) * 8 + Math.abs(Math.sin(t * 9)) * 6 * roar;
    glow(ctx, x, H * 0.62, 420, '#FFD27A', 0.18);
    L.put(ctx, 'n_yachts', k, x, H * 0.9 + bob, 640, { rot: rock });
    ctx.save(); ctx.fillStyle = 'rgba(235,250,255,0.7)';
    for (let q = 0; q < 10; q++) { const fx = x + (q / 9 - 0.5) * 560 + Math.sin(t * 3 + q) * 10; ctx.beginPath(); ctx.ellipse(fx, H * 0.89 + bob + Math.sin(t * 5 + q) * 4, 30, 6, 0, 0, TAU); ctx.fill(); }
    ctx.restore();
  };
  const inn = E.out(sat(t, 28.6, 29.1));
  yacht(0, lerp(-200, 330, inn), 0); yacht(2, lerp(W + 200, W - 330, inn), 1);
  Q_SAY.forEach(([t0, side, str], i) => balloon(ctx, t, t0, side ? W - 300 - (i % 2) * 60 : 300 + (i % 2) * 60, 250 + (i % 2) * 60 + Math.sin(t * 9 + i) * 5, str, { size: 40, rot: side ? 0.05 : -0.05 }));
  const x = W / 2, fy = 990, sz = 700, hit = FT(t) >= 30.82;
  ripples(ctx, t, x, fy - 8, 200);
  withPoses({ d60: { sheet: 'c_b2', ref: 2, keys: [[0, 2]] }, d12: { sheet: 'c_b2', ref: 2, keys: [[0, 0], [31.0, 1], [31.4, 3]] } }, t, () =>
    char(ctx, hit ? 'd12' : 'd60', x, fy, sz, { shadow: false, ...breathe(t), sy: 1 - 0.05 * slam, sx: 1 + 0.03 * slam }));
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

// ---------------------------------------------------------------- 浪一路拍到了华尔街 (44.2–47.3). 本人: the 2D wave sliding in from the
// side had no impact. Now the wave comes down Wall Street at us: from the far end of the street it rises and grows, a wall of water
// full of red and green candles, people running towards us ahead of it (浪一路); on 拍 it hits the lens (white-out, shake); then the
// street is flooded, papers drifting, a taxi floating, a man on a lamppost, and NVDA falling on the big screen (华尔街)
const VP = [880, 560], HIT = 45.14;                                         // bg14: the far end of the street; the moment it hits
export function shotV(ctx, t) {
  const o = { z: 1.1, fx: 0.5, fy: 0.5 }, M = bdMap('bg14_wallstreet', o);
  const [sx, sy] = shake(t, [[HIT, 40, 0.7], [46.15, 18, 0.5]]), pre = 4 * sat(t, 44.6, HIT);
  ctx.save(); ctx.translate(sx + noise(t * 40, 3) * pre, sy + noise(t * 40, 5) * pre);
  backdrop(ctx, 'bg14_wallstreet', o);
  const tt = t < 45.3 ? 44.6 : lerp(44.6, 46.2, sat(t, 45.3, 46.6));      // the price holds until the wave hits, then falls
  warpQuad(ctx, C.POS.ticker.map(p => M.pt(...p)), 640, 400, (x, sw, sh) => C.tickerScreen(x, sw, sh, tt));
  const [vx, vy] = M.pt(...VP);
  if (t < HIT + 0.05) {
    const p = E.in(sat(t, 44.2, HIT)), wv = plate('n_wave_front');
    [[0, 44.25, 0], [1, 44.4, 1]].forEach(([k, t0, i]) => {                 // running at us ahead of the wave
      const q = sat(t, t0, HIT), d = lerp(5, 0.9, q), x = vx + (i ? 380 : -360) / d, y = vy + 520 / d;
      L.put(ctx, 'n_wall_people', k, x, y - Math.abs(Math.sin(t * 13 + i)) * 20 / d, 330 / d * 1.4, { flip: !i });
    });
    if (wv) {
      const w = lerp(260, 3400, p), h = w * wv.height / wv.width, bottom = lerp(vy + 40, H + 260, p);
      ctx.drawImage(wv, vx - w / 2 + (1 - p) * 30, bottom - h, w, h);
      for (let q = 0; q < 30; q++) {                                         // spray thrown off its crest
        const u = rnd(q, 81), ph = (t * 1.8 + rnd(q, 82)) % 1, cx = vx + (u - 0.5) * w * 0.9, cy = bottom - h * (0.88 - 0.1 * Math.abs(u - 0.5)) - ph * 120 * (w / 1500);
        L.put(ctx, 'fx_drops', [0, 1, 13, 15][q % 4], cx, cy, (12 + 24 * rnd(q, 83)) * (w / 1500), { anchor: 'body', alpha: 1 - ph, rot: -0.3 });
      }
    }
    for (let q = 0; q < 10; q++) {                                           // papers blown ahead of it
      const d = ((t - 44.2) * 0.9 + rnd(q, 91)) % 1, x = vx + (rnd(q, 92) - 0.5) * 1600 * d, y = vy - 200 + d * 600 + Math.sin(t * 4 + q) * 30;
      ctx.save(); ctx.translate(x, y); ctx.rotate(t * 3 + q); ctx.fillStyle = '#F7F4EA'; ctx.fillRect(-14 - d * 20, -18 - d * 26, 28 + d * 40, 36 + d * 52); ctx.restore();
    }
  } else {
    const lvl = E.out(sat(t, HIT, 45.9)) * 300 + Math.sin(t * 3) * 10, wy = H - lvl;   // the flood
    const g = ctx.createLinearGradient(0, wy, 0, H); g.addColorStop(0, 'rgba(90,210,220,0.9)'); g.addColorStop(1, 'rgba(20,110,150,0.95)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, wy); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, wy + Math.sin(x / 90 + t * 5) * 12); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 7; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, wy + Math.sin(x / 90 + t * 5) * 12); ctx.stroke();
    for (let q = 0; q < 16; q++) { const d = t - HIT, x = (rnd(q, 31) * W + d * (120 + 80 * rnd(q, 32))) % (W + 100), y = 120 + rnd(q, 33) * 600 + Math.sin(d * 3 + q) * 40 + d * 60;
      ctx.save(); ctx.translate(x, y); ctx.rotate(d * (2 + q % 3) + q); ctx.fillStyle = '#F7F4EA'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.fillRect(-26, -34, 52, 68); ctx.strokeRect(-26, -34, 52, 68); ctx.restore(); }
    if (t > 45.4) L.put(ctx, 'n_wall_people', 2, 1460, H + 40, 520, { rot: Math.sin(t * 40) * 0.03, alpha: sat(t, 45.4, 45.6) });
    if (t > 45.5) L.put(ctx, 'n_wall_people', 3, lerp(-260, 1000, sat(t, 45.5, 47.3)), wy + 70 + Math.sin(t * 3) * 10, 230, { rot: Math.sin(t * 2) * 0.08 });
    L.put(ctx, 'n_wall_people', 4, 1790, 1110, 430, { flip: true });
    for (const f of [45.7, 46.15, 46.5, 46.94]) { const d = t - f; if (d > 0 && d < 0.25) glow(ctx, 1690, 820, 260, '#FFFFFF', 0.9 * (1 - d / 0.25)); }
  }
  ctx.restore();
  if (t >= HIT - 0.06 && t < HIT + 0.4) {                                    // 拍: it hits the lens
    const d = t - HIT, a = d < 0 ? (d + 0.06) / 0.06 : 1 - sat(d, 0.05, 0.4);
    ctx.fillStyle = rgba('#F4FFFF', 0.95 * a); ctx.fillRect(0, 0, W, H);
    burst(ctx, t, HIT, W / 2, H * 0.6, { n: 120, seed: 77, speed: [900, 2600], size: [20, 60], w: 900, ang: [-Math.PI * 0.95, -Math.PI * 0.05], g: 2400 });
  }
}

// ---------------------------------------------------------------- 把全世界 都叫醒一遍 (47.3–51.0). 本人: the alarm-clock Earth looked
// cheap. Now the real night-side Earth: on 把 a ring of blue light goes out from China across the globe (and again on 世, 界), and
// everywhere it passes a DeepSeek notification pops up over the cities (全世界). Then a block of flats at night, every window dark;
// on 都叫醒一遍 they light up one after another, a person in each sitting up with their phone; on 遍 the App Store chart:
// DeepSeek goes to No. 1.
const GLOBE = { cx: 768, cy: 516, rx: 512, ry: 476 }, CHINA = [1170, 380];   // bg19 (image px)
const WIN = (c, r) => [168 + 240 * c, 240 + 230 * r];                        // bg15: window centres (image px), 140 x 140
export function shotW(ctx, t) {
  if (t < 49.19) {
    const o = { z: 1.06, fx: 0.5, fy: 0.5 }, M = bdMap('bg19_earth_night', o);
    backdrop(ctx, 'bg19_earth_night', o);
    const [gx, gy] = M.pt(GLOBE.cx, GLOBE.cy), rx = GLOBE.rx * M.s, ry = GLOBE.ry * M.s, [ox, oy] = M.pt(...CHINA);
    ctx.save(); ctx.beginPath(); ctx.ellipse(gx, gy, rx, ry, 0, 0, TAU); ctx.clip();
    const R = [47.36, 47.89, 48.14].map((t0, i) => t >= t0 ? E.out(sat(t, t0, t0 + 1.1)) * (i ? 1.0 : 1.25) * 2 * rx : -1);
    R.forEach((r, i) => { if (r <= 0) return; const a = 0.7 * (1 - r / (2.5 * rx));
      ctx.strokeStyle = rgba('#7FD0FF', a); ctx.lineWidth = 18 - i * 4; ctx.beginPath(); ctx.ellipse(ox, oy, r, r * 0.92, 0, 0, TAU); ctx.stroke();
      ctx.fillStyle = rgba('#4DA3FF', 0.08 * (1 - i * 0.3)); ctx.beginPath(); ctx.ellipse(ox, oy, r, r * 0.92, 0, 0, TAU); ctx.fill(); });
    for (let q = 0; q < 70; q++) {                                           // notifications popping where the ring has passed
      const an = rnd(q, 51) * TAU, rr = Math.sqrt(rnd(q, 52)), px = gx + Math.cos(an) * rr * rx * 0.92, py = gy + Math.sin(an) * rr * ry * 0.92;
      const dist = Math.hypot(px - ox, (py - oy) / 0.92), t0 = 47.36 + dist / (2.5 * rx) * 1.1, on = R[0] > dist ? E.back(sat(t, t0, t0 + 0.18)) : 0;
      if (on <= 0) continue;
      glow(ctx, px, py, 40, '#9FE6FF', 0.5 * on);
      const s = 30 * on, ic = img('icon_deepseek');
      ctx.save(); ctx.translate(px, py - 26 * on); ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.25); ctx.fill();
      if (ic) ctx.drawImage(ic, -s * 0.45, -s * 0.45, s * 0.9, s * 0.9); ctx.restore();
    }
    ctx.restore();
    glow(ctx, ox, oy, 120, '#BFE6FF', 0.9 * (t > 47.36 ? Math.exp(-3 * (t - 47.36)) : 0));
    return;
  }
  const o = { z: 1.06, fx: 0.5, fy: 0.42 }, M = bdMap('bg15_windows', o);
  backdrop(ctx, 'bg15_windows', o);
  const order = [...Array(24).keys()].sort((a, b) => rnd(a, 61) - rnd(b, 61));
  order.forEach((wi, n) => {
    const c = wi % 6, r = Math.floor(wi / 6), [x, y] = M.pt(...WIN(c, r)), hw = 70 * M.s, t0 = 49.36 + n * 0.035, on = sat(t, t0, t0 + 0.1);
    ctx.save(); ctx.beginPath(); ctx.rect(x - hw, y - hw, 2 * hw, 2 * hw); ctx.clip();
    const who = (wi * 7) % 24;                                               // 本人 10-22: a different person in every window
    if (on > 0) { L.put(ctx, ['n_win_a', 'n_win_b', 'n_win_c', 'n_win_d'][Math.floor(who / 6)], who % 6, x, y + hw + 0.4 * hw, 2.3 * hw, { flip: rnd(wi, 63) > 0.5, alpha: on });      // down past the sill (本人 10-22: no gap under them)
      glow(ctx, x, y, 60 * M.s, '#BFE6FF', 0.3 * on); }
    ctx.fillStyle = rgba('#0E1530', 0.92 * (1 - on)); ctx.fillRect(x - hw, y - hw, 2 * hw, 2 * hw);
    ctx.restore();
  });
  const ca = E.out(sat(t, 49.85, 50.1));
  C.appChart(ctx, t, lerp(W + 40, 1300, ca), 230, ca);
}

// ---------------------------------------------------------------- 谁想去远方 (57.1–59.7). 本人: the boats stuck flat on the map looked
// cheap. Now from the water behind them: a fleet of little boats, the map on every sail, setting out from right by the camera towards
// the sunrise one after another, smaller and smaller on the way to the horizon (远方), wakes trailing back; she stands in the water
// at the front left: who wants to go? (谁), waving them off with a handkerchief (远), calling after them (方).
export function shotZ(ctx, t) {
  const o = { z: 1.12, fx: 0.5, fy: 0.62 }, M = bdMap('bg17_dawn_sea', o);
  backdrop(ctx, 'bg17_dawn_sea', o);
  const hy = M.pt(0, 1024 * 0.363)[1], vx = W * 0.56;
  const BOATS = [...Array(8).keys()].map(i => ({ k: i % 4, t0: 57.1 + i * 0.22, x0: [1300, 1020, 1650, 1160, 1500, 960, 1780, 1250][i] }));
  BOATS.map(b => ({ ...b, p: sat(t, b.t0, b.t0 + 3.2) })).sort((a, b) => b.p - a.p).forEach(b => {   // the farthest first
    if (t < b.t0) return;
    const d = lerp(1.15, 14, Math.pow(b.p, 1.4)), x = vx + (b.x0 - vx) / d, y = hy + (H * 1.12 - hy) / d, h = 560 / d;
    ctx.save(); ctx.fillStyle = 'rgba(240,250,255,0.75)';                   // the wake, spreading back towards us
    for (let q = 0; q < 12; q++) { const u = q / 12, wy = y + u * 780 / d, ww = (40 + u * 320) / d;
      ctx.globalAlpha = 0.6 * (1 - u); for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(x + s * ww, wy, 28 / d, 8 / d, 0, 0, TAU); ctx.fill(); } }
    ctx.restore();
    L.put(ctx, 'n_fleet', b.k, x, y + Math.sin(t * 3 + b.k) * 6 / d, h, { rot: Math.sin(t * 2 + b.k) * 0.03 });
  });
  for (let q = 0; q < 30; q++) { const a = 0.7 * Math.max(0, Math.sin(t * (2 + rnd(q, 5) * 3) + q)) ** 8, x = vx + (rnd(q, 6) - 0.5) * 900, y = hy + 10 + rnd(q, 7) * 260;   // sun glints
    if (a > 0.02) glow(ctx, x, y, 26, '#FFE7C0', a); }
  const tk = FT(t);                                                        // 本人 10-22: her own new farewell (n_farewell), not a reused pose
  L.put(ctx, 'n_farewell', tk < 57.94 ? 0 : tk < 58.66 ? 1 : 2, 330, 1060, 620);
  ripples(ctx, t, 330, 1050, 200, { alpha: 0.5 });
  L.dawnFg(ctx, t, 57.1);
}

// ---------------------------------------------------------------- 我也还在这里 (88.2–92.45): v1's phone in the hand; her reply comes;
// she pops up inside the screen and waves. 本人 10-22: higher, nearer the middle -> she rises from behind the message box (so the
// bottom of the drawing never shows), her head about the middle of the screen; waves on 在、这、里
export function shotE3(ctx, t) {
  const o = { z: lerp(1.04, 1.1, sat(t, 88.2, 92.45)), fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg21_phone_hand', o);
  maskedScreen(ctx, 'bg21_phone_hand', o, QS.phone, 540, 1100, (x, sw, sh) => {
    dsPhone(x, sw, sh, t, { msgs: [{ who: 'user', text: '你回来啦？', t0: 0 }, { who: 'ai', text: '久等啦，我也还在这里～', t0: 89.05, cps: 10, size: 40 }], dots: t < 89.05 });
    if (t > 90.3) {
      // 本人 10-23: v6's waving drawings (better than the jump), now with her whole body (c_d63f), bigger, in the middle of the screen:
      // she rises from behind the message box and stands on it; 在 waves the other way, 这 eyes closed, 里 both hands
      const kk = sw / 600, barTop = sh - 150 * kk, top = barTop - 20 * kk, ft = FT(t), k = ft < 91.19 ? 0 : ft < 91.61 ? 1 : ft < 91.94 ? 2 : 3;
      const f0 = sheet('c_d63f')?.frames[0], sc = f0 ? sw * 0.94 / 545 : 1, hh = f0 ? f0.h * sc : 600;
      const up = E.out(sat(t, 90.3, 90.72)), bob = up >= 1 ? -Math.abs(Math.sin((t - 90.72) * 4.2)) * 6 * kk : 0;
      const feet = top + 2 * kk + (1 - up) * (hh + 40 * kk) + bob;
      if (up > 0.95) { x.fillStyle = 'rgba(30,40,80,0.14)'; x.beginPath(); x.ellipse(sw / 2, top + 6 * kk, 190 * kk, 15 * kk, 0, 0, TAU); x.fill(); }
      x.save(); if (up < 1) { x.beginPath(); x.rect(0, 0, sw, top + 2 * kk); x.clip(); }
      frame(x, 'c_d63f', k, sw / 2, feet, sc, { anchor: 'bottom', rot: Math.sin((t - 90.3) * 7) * 0.03 * sat(t, 90.6, 90.9) * (1 - sat(t, 91.0, 91.3)) }); x.restore();
      x.fillStyle = '#FFFFFF'; x.fillRect(0, top + 2 * kk, sw, sh);           // the message box, in front of her feet's edge
      x.save(); x.scale(kk, kk); const H2 = sh / kk;
      x.fillStyle = '#F3F4F6'; x.beginPath(); x.roundRect(30, H2 - 130, 540, 84, 42); x.fill();
      x.fillStyle = '#9CA3AF'; x.font = font(28, 500, SANS); x.textBaseline = 'middle'; x.fillText('给 DeepSeek 发送消息', 66, H2 - 88); x.restore();
    }
  }, { res: 1, slot: 6 });
}

// ---------------------------------------------------------------- 你等过一整个春节 (85.84–88.2). 本人: the refreshing was plain. Now the
// whole festival passes while the phone keeps saying busy: a tear-off calendar flips through the holiday on the beat (除夕 … 十五), the
// New Year's Eve fireworks give way to the full moon and sky lanterns of the Lantern Festival, the dinner is eaten down to the bones,
// the room grows dim — and the hand is still tapping refresh, the count running into the hundreds.
const DAYS = ['除夕', '初一', '初二', '初三', '初五', '初八', '十五'];
export function shotE2(ctx, t) {
  const o = { z: 1.08, fx: 0.5, fy: 0.5 }, late = E.io(sat(t, 86.9, 87.5));
  backdrop(ctx, 'bg24_newyear_dinner', o);
  const after = plate('n_dinner_after');
  if (after && late > 0) { const M = bdMap('bg24_newyear_dinner', o), [x0, y0] = M.pt(0, 0); ctx.save(); ctx.globalAlpha = late; ctx.drawImage(after, x0, y0, after.width * M.s, after.height * M.s); ctx.restore(); }
  if (late < 1) for (let q = 0; q < 4; q++) {                                // New Year's Eve fireworks outside, until the days pass
    const t0 = 85.9 + q * 0.32, d = t - t0; if (d < 0 || d > 1.3) continue;
    ctx.save(); ctx.globalAlpha = 1 - late; L.put(ctx, 'fx_firework', Math.min(5, Math.floor(d * 5)), [700, 1150, 900, 1300][q], [260, 200, 300, 240][q], 220, { anchor: 'body' }); ctx.restore();
  }
  if (late < 0.5) L.dinnerFg(ctx, t);
  if (late > 0) { ctx.fillStyle = `rgba(8,12,40,${0.25 * late})`; ctx.fillRect(0, 0, W, H); }
  if (t > 86.9 && t < 87.25) { ctx.fillStyle = rgba('#FFFFFF', 0.5 * Math.sin(sat(t, 86.9, 87.25) * Math.PI)); ctx.fillRect(0, 0, W, H); }
  [[200, 'prop_lantern_busy', -1], [1720, 'prop_lantern_retry', 1]].forEach(([x, id, sd]) => {     // v1's lanterns: 服务器繁忙 / 请稍后再试
    const sw = Math.sin(t * 2.2 + sd) * 0.08, li = img(id), lw = 330, lh = li ? lw * li.height / li.width : lw * 1.5;
    ctx.save(); ctx.translate(x, -20); ctx.rotate(sw); ctx.strokeStyle = '#6B1A10'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.stroke();
    prop(ctx, id, 0, 84 + lh / 2, lw); ctx.restore();
  });
  const di = Math.min(DAYS.length - 1, Math.floor(Math.max(0, FT(t) - 85.84) / 0.4)), flip = sat(t - 85.84 - di * 0.4, 0, 0.12);   // the calendar
  ctx.save(); ctx.translate(470, 210); ctx.rotate(-0.05);
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#3A1A10'; ctx.lineWidth = 5; ctx.beginPath(); ctx.roundRect(-120, -110, 240, 260, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#D8263C'; ctx.beginPath(); ctx.roundRect(-120, -110, 240, 70, [16, 16, 0, 0]); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(34, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('正月', 0, -75);
  ctx.fillStyle = '#2A1A10'; ctx.font = font(84, 900, SANS); ctx.fillText(DAYS[di], 0, 45);
  if (flip < 1 && di > 0) { ctx.save(); ctx.globalAlpha = 1 - flip; ctx.translate(0, -40); ctx.rotate(-flip * 1.2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(-120, 0, 240, 190);
    ctx.fillStyle = '#2A1A10'; ctx.fillText(DAYS[di - 1], 0, 85); ctx.restore(); }
  ctx.restore(); ctx.textAlign = 'left';
  // the phone is centred (本人 10-22)
  const beat = Math.max(0, FT(t) - 85.84) % 0.4, tap = beat < 0.08 ? Math.sin(beat / 0.08 * Math.PI) : 0;     // the hand, tapping refresh
  const n = Math.floor(Math.pow(sat(t, 85.9, 88.15), 1.6) * 520) + 1, hx = W / 2 + 27, hy = 700 + tap * 14, im = img('prop_hand_phone'), hw = 560, hh = im ? hw * im.height / im.width : hw;
  prop(ctx, 'prop_hand_phone', hx, hy, hw);
  const sx = hx - hw * 27 / 560, sy = hy - hh * 0.154;                   // the middle of the screen in prop_hand_phone (285, 357 of 632 x 1033)
  ctx.save(); ctx.translate(sx, sy); ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.rotate(t * 8); ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU * 0.75); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(30, 700, SANS); ctx.textAlign = 'center'; ctx.fillText(`刷新 ×${n}`, sx, sy + 100); ctx.textAlign = 'left';
}
