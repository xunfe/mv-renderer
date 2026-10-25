// Full version: the shots that were redesigned after the first reviews of the complete cut (2026-10-13 evening).
// They replace the functions of the same name in scenes4.js in the cut list.
import { W, H, TAU, clamp, lerp, sat, E, rnd, COL, mix, rgba, drawGlyph, text, measure, rrect, caret, flower } from './lib.js';
import { char, breathe, walkBob } from './chars.js';
import { finish, bokeh, cam, cut, hillPath } from './fx.js';
import { hit, sq, rays } from './scenes1.js';
import { cutGlyph, butterfly, swarm, GY, drawObj } from './scenes2.js';
import { SEA, beach, swash, seaSky, waveBands, bank, codeBlock, tick, sparkle, anchor, headAt, PT, walkId, hopOn, roadPages, windStreaks, soloPal } from './scenes4.js';

// points on the sprites, in their own pixels (read off tools/grid.py sheets)
const P6 = { o17m: [286, 655], o17g: [165, 1140], o51: [865, 997], o53: [510, 30], k09: [756, 1045] };

// ================================================================== 1:10.6–1:16.9  世界还在写 / 风一吹 字就飞成了蝴蝶
// The world is a pop-up book and her walking opens it: each character of the title stands up out of the road as she
// passes, as tall as a house. Then the wind gets under them. They are folded paper, so they are already butterflies:
// the nearest one comes for her, and she goes with it.
const TS = [70.88, 71.42, 71.87, 72.1, 72.42], TITLE = '世界还在写';
const PV = 260, STOP0 = 71.7, STOP1 = 72.1, CAM0 = 4000;
const scroll = t => (t <= STOP0 ? PV * (t - 70.61) : PV * (STOP0 - 70.61) + PV * (STOP1 - STOP0) * (u => u - u * u / 2)(sat(t, STOP0, STOP1)));
const SEND = scroll(STOP1);
const PGX = [690, 932, 1174, 1416, 1658], PGS = 244, PGY = GY - 6, PGC = PGY - PGS * 0.56, HER = { x: 345, s: 450 };
function popBase(ctx, x, size, p, struts = true) {            // the tab it is glued to, and its two struts
  const k = E.back(clamp(p));
  ctx.save(); ctx.translate(x, PGY);
  ctx.fillStyle = rgba('#3A2A1A', 0.12 * clamp(p)); ctx.beginPath(); ctx.ellipse(0, 6, size * 0.52 * clamp(p), 11, 0, 0, TAU); ctx.fill();
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 3.5; ctx.lineJoin = 'round';
  if (struts) for (const sgn of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sgn * size * 0.34, 2); ctx.lineTo(sgn * size * 0.22, -size * 0.36 * k); ctx.lineTo(sgn * size * 0.12, 2); ctx.closePath(); ctx.fillStyle = '#F3E4C6'; ctx.fill(); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-size * 0.42, 0); ctx.lineTo(size * 0.42, 0); ctx.lineTo(size * 0.36, 15); ctx.lineTo(-size * 0.48, 15); ctx.closePath(); ctx.fillStyle = COL.white; ctx.fill(); ctx.stroke();
  ctx.restore();
}
function popUp(ctx, ch, x, size, p, color, wob = 0) {
  const k = E.back(clamp(p));
  popBase(ctx, x, size, p);
  ctx.save(); ctx.translate(x, PGY); ctx.transform(1, 0, -0.5 * (1 - k), Math.max(0.03, k), 0, 0);          // lying flat on the page, then standing
  cutGlyph(ctx, ch, 0, -size * 0.56, size, color, { rot: wob });
  ctx.restore();
}
const CLOUDS = [{ k: 'cloud', x: 0, y: 250, s: 1.2 }, { k: 'cloud', x: 0, y: 150, s: 0.9 }, { k: 'cloud', x: 0, y: 330, s: 0.8 }];
function titleLand(ctx, t, camX) {
  const g = ctx.createLinearGradient(0, -300, 0, GY); g.addColorStop(0, '#FCE8C0'); g.addColorStop(0.55, '#FFF6E4'); g.addColorStop(1, '#FFEFD6');
  ctx.fillStyle = g; ctx.fillRect(-300, -900, W + 600, GY + 900);
  rays(ctx, 1560, 230, t * 0.5, 0.2, '#FFE9BF', 16);
  ctx.fillStyle = '#FFE1A8'; ctx.beginPath(); ctx.arc(1560, 230, 112, 0, TAU); ctx.fill();
  CLOUDS.forEach((o, i) => { const sx = ((i * 760 + 300 - camX * 0.45) % 2400 + 2400) % 2400 - 240; drawObj(ctx, o, sx, 2, t); });
  cut(ctx, () => hillPath(ctx, 720, 110, 560, 0.4, camX * 0.2), '#FDEBCF', 0.1);
  cut(ctx, () => hillPath(ctx, 820, 80, 400, 2.1, camX * 0.45), '#FBE0BC', 0.12);
  ctx.fillStyle = '#FBE8CB'; ctx.fillRect(-300, GY - 4, W + 600, 500);
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
  roadPages(ctx, camX);
  for (let i = Math.floor((camX - 200) / 330); i * 330 + 150 - camX < W + 200; i++) {          // the flowers she has left along the way
    const fx = i * 330 + 150 - camX, sw = Math.sin(t * 2.2 + i) * 5;
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(fx, GY); ctx.lineTo(fx + sw, GY - 62); ctx.stroke();
    flower(ctx, fx + sw, GY - 62, 24, t * 0.6 + i, ((i % 2) + 2) % 2 ? COL.yellow : COL.orange);
  }
}
export function sTitleSolo(ctx, t) {
  const whip = (1 - E.out(sat(t, 70.61, 70.82))) * 2700, wind = sat(t, 72.62, 73.19), rest = SEND - scroll(t), camX = CAM0 + scroll(t);
  let punch = 0; TS.forEach(T => { punch += hit(t, T, 9); });
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.06 + 0.025 * sat(t, 70.61, 73.19) + 0.014 * punch, cx: 960, cy: 820, x: whip, seed: 31, hand: 3 }, () => {
    titleLand(ctx, t, camX);
    for (let i = 0; i < 5; i++) {
      const p = sat(t, TS[i] - 0.05, TS[i] + 0.3); if (p <= 0) continue;
      const x = PGX[i] + rest, d = t - TS[i];
      popUp(ctx, TITLE[i], x, PGS, p, COL.orange, wind * Math.sin(t * 19 + i * 2) * 0.03);
      sparkle(ctx, t, TS[i], x, PGC, COL.yellow, 8, 130, 190);
      if (d > 0 && d < 0.7) for (let k = 0; k < 8; k++) {            // scraps of the page it came out of
        const an = -Math.PI * (0.15 + 0.7 * rnd(k, 990 + i)), v = 180 + rnd(k, 991 + i) * 220;
        ctx.save(); ctx.translate(x + Math.cos(an) * v * d, PGY + Math.sin(an) * v * d + 520 * d * d); ctx.rotate(d * 9 + k); ctx.globalAlpha = 1 - d / 0.7;
        ctx.fillStyle = k % 2 ? COL.white : COL.peach; ctx.fillRect(-9, -6, 18, 12); ctx.restore();
      }
    }
    if (wind > 0) windStreaks(ctx, t, 12, 0.8 * wind);
    if (t < STOP1 - 0.08) { const wb = walkBob(t); char(ctx, walkId('o', t), HER.x, GY + 24, HER.s, { lift: wb.lift, rot: wb.rot, windX: -6, flutter: 2 }); }
    else { const joy = t >= 72.5, s = sq(t, joy ? 72.5 : STOP1 - 0.08, 1.4), b = breathe(t); char(ctx, joy ? 'o29' : 'o28', HER.x, GY + 24, HER.s, { sx: b.sx * s.sx, sy: b.sy * s.sy, windX: 12 * wind, flutter: 4 * wind, lift: joy ? hopOn(t, 0, 16) : 0 }); }
  });
  bokeh(ctx, t, { n: 9, seed: 131, alpha: 0.14, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
}
const WT0 = 74.93, CATCH = 75.36, HANG = 430;
function carry(t) {            // the first one: over to her, a dip as it takes her weight, then up and away
  const C = [HER.x + 34, GY - 566];
  if (t < CATCH) { const u = E.io(sat(t, WT0 + 0.03, CATCH)); return [lerp(PGX[0], C[0], u), lerp(PGC, C[1], u) - Math.sin(u * Math.PI) * 70]; }
  const v = t - CATCH;
  return [C[0] + 300 * v + 150 * v * v, C[1] + 54 * Math.sin(Math.min(1, v * 2.6) * Math.PI) - 130 * v - 90 * v * v + Math.sin(v * 6) * 10];
}
export function sWindSolo(ctx, t) {
  const tilt = 250 * E.io(sat(t, CATCH, 76.9)), camX = CAM0 + SEND;
  ctx.fillStyle = '#FFF3DC'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.085 - 0.045 * E.io(sat(t, CATCH, 76.9)), cx: 960, cy: 820, y: tilt, seed: 31, hand: 3 }, () => {
    titleLand(ctx, t, camX);
    windStreaks(ctx, t, 16, 0.8);
    for (let i = 0; i < 5; i++) popBase(ctx, PGX[i], PGS, 1, false);          // what they stood on stays behind
    soloPal(() => swarm(ctx, t, WT0 + 0.1, 70, { x0: 380, w: 1400, y0: GY + 60, h: 120, size: 42, spread: 1.3, vx: 300, vy: 250 }));
    const PALS = [COL.orange, COL.yellow, COL.orangeD, COL.orange, COL.yellow];
    for (let i = 4; i >= 1; i--) {                  // the other four: a flap or two where they stand, then off, and somewhere on the way they are butterflies
      const L = WT0 + 0.1 + i * 0.1, u = Math.max(0, t - L), m = sat(t, 75.85 + i * 0.05, 76.25 + i * 0.05), free = sat(u, 0, 0.5);
      const x = PGX[i] + 90 * u + 170 * u * u + Math.sin(u * 3 + i) * 40 * free, y = PGC - 90 * u - 200 * u * u - Math.sin(u * 4 + i * 2) * 26 * free;
      butterfly(ctx, TITLE[i], x, y, PGS * (1 - 0.3 * sat(u, 0, 1.2)), mix(COL.orange, PALS[i], m), t * 13 + i * 1.3, 0.5 * sat(u, 0, 0.6) + Math.sin(u * 2 + i) * 0.2 * free, 1, m);
    }
    const B = carry(t), bs = PGS * 0.86, held = t >= CATCH, hand = [B[0], B[1] + bs * 0.36];
    if (!held) { const up = E.out(sat(t, CATCH - 0.22, CATCH)), cr = sq(t, WT0, 1.3); char(ctx, 'o46', HER.x, GY + 24, HER.s, { lift: 66 * up, sx: cr.sx, sy: cr.sy, windX: 14, flutter: 4, shadowA: 1 - 0.5 * up }); }
    else {                                           // she hangs from it by both hands and swings a little
      const off = anchor('o53', 0, 0, HANG, P6.o53[0], P6.o53[1]), v = t - CATCH, sw = Math.sin(v * 5.5) * 0.1 * Math.exp(-v * 0.9) - 0.1 * sat(v, 0, 0.4);
      const fx = hand[0] - (off[0] * Math.cos(sw) - off[1] * Math.sin(sw)), fy = hand[1] - (off[0] * Math.sin(sw) + off[1] * Math.cos(sw));
      ctx.fillStyle = rgba('#3A2A1A', 0.13 * (1 - sat(v, 0, 0.7))); ctx.beginPath(); ctx.ellipse(fx, GY + 22, 90 * (1 - 0.5 * sat(v, 0, 0.7)), 13, 0, 0, TAU); ctx.fill();
      char(ctx, 'o53', fx, fy, HANG, { rot: sw, shadow: false, windX: -10, flutter: 5 });
    }
    butterfly(ctx, TITLE[0], B[0], B[1], bs, COL.orange, t * 14, held ? 0.1 : -0.3 * sat(t, WT0, CATCH), 1, sat(t, 75.95, 76.35));
    sparkle(ctx, t, CATCH, hand[0], hand[1], COL.yellow, 10, 50, 150);
  });
  finish(ctx, { light: 0.8 });
}

// ================================================================== 1:24.3–1:30.5  the water reaches her; she tastes it
// One sheet of water, with one edge. She stands in front of it, and whatever of her is under it takes its colour.
let WL = null;
function wading(ctx, t, yf, a, ytop, gy, drawHer) {
  swash(ctx, t, yf, a, ytop);
  const deep = sat(yf, gy - 6, gy + 34);
  if (deep <= 0) { drawHer(ctx); return; }
  if (!WL || WL.width !== ctx.canvas.width) WL = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const L = WL.getContext('2d');
  L.setTransform(1, 0, 0, 1, 0, 0); L.globalCompositeOperation = 'source-over'; L.globalAlpha = 1; L.clearRect(0, 0, WL.width, WL.height);
  L.setTransform(ctx.getTransform());
  drawHer(L);
  const yl = x => gy - 44 * deep + Math.sin(x * 0.03 + t * 3) * 3;
  L.globalCompositeOperation = 'source-atop';
  L.fillStyle = rgba('#8DBBEE', 0.62 * a); L.beginPath(); L.moveTo(-300, yl(-300)); for (let x = -300; x <= W + 300; x += 24) L.lineTo(x, yl(x)); L.lineTo(W + 300, H + 300); L.lineTo(-300, H + 300); L.closePath(); L.fill();
  L.strokeStyle = rgba(COL.white, 0.85); L.lineWidth = 4; L.beginPath(); for (let x = -300; x <= W + 300; x += 24) L.lineTo(x, yl(x)); L.stroke();
  L.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(WL, 0, 0); ctx.restore();
}
const WET = { hx: 700, gy: 900, hs: 760, HIT: 85.25 };
export function sWet(ctx, t) {
  const { hx, gy, hs, HIT } = WET;
  const up = E.io(sat(t, 84.45, HIT)), back = E.io(sat(t, HIT + 0.25, 86.4)), yf = lerp(lerp(760, 968, up), 928, back) + Math.sin(t * 2.6) * 8 * back;
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 84.28, 85.0)) + 0.04 * hit(t, HIT, 6) + 0.02 * sat(t, 84.28, 86.96), cx: 760, cy: 760, seed: 33 }, () => {
    beach(ctx, t, 560, 742);
    const wet = t >= HIT, joy = t >= 86.15, pose = joy ? 'o27' : wet ? 'o26' : 'o03';
    const b = breathe(t, 1.4), s = sq(t, joy ? 86.15 : wet ? HIT : 84.28, 1.5), hop = wet && !joy ? Math.abs(Math.sin(sat(t, HIT, HIT + 0.42) * Math.PI)) * 70 : 0;
    wading(ctx, t, yf, 0.85, 740, gy, c => char(c, pose, hx, gy, hs, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot, lift: hop }));
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
export function sSalty(ctx, t) {
  const { hx, gy, hs } = WET, TASTE = 87.4, KNOW = 89.31, lineX = 1120, lineY = 380;
  const yf = lerp(928, 800, E.io(sat(t, 87.5, 88.9))) + Math.sin(t * 2.6) * 8;
  cam(ctx, t, { z: 1.04 + 0.04 * hit(t, TASTE, 7) + 0.03 * E.io(sat(t, 87.4, 90.5)), cx: 760, cy: 760, seed: 33 }, () => {
    beach(ctx, t, 560, 742);
    const pose = t < TASTE ? 'o27' : t < KNOW ? 'o21' : 'o30';
    const b = breathe(t, 1.2), s = sq(t, t < TASTE ? 86.15 : t < KNOW ? TASTE : KNOW, 1.6), shiver = t >= TASTE && t < KNOW ? Math.sin(t * 46) * 5 * hit(t, TASTE, 2.2) : 0;
    wading(ctx, t, yf, 0.85, 740, gy, c => char(c, pose, hx + shiver, gy, hs, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot }));
    const d = sat(t, 86.98, TASTE), f0 = anchor('o27', hx, gy, hs, PT.o27[0], PT.o27[1]), m0 = headAt('o27', hx, gy, hs);          // one drop, from her fingertip to the tip of her tongue
    if (d > 0 && d < 1) { const x = lerp(f0[0], m0[0] + 10, d), y = lerp(f0[1], m0[1] + 0.07 * hs, d) - Math.sin(d * Math.PI) * 150; ctx.fillStyle = '#8DBBEE'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, 13, 0, TAU); ctx.fill(); ctx.stroke(); }
    sparkle(ctx, t, TASTE, hx + 10, gy - 0.66 * hs, '#5A90DC', 9, 150, 230);
    const str = '海水是咸的。', la = sat(t, KNOW, KNOW + 0.3);          // the line from the book
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

// ================================================================== 1:30.5–1:34.2  没读过的是 沙子会进鞋
// Three things happen. She pours it out. She looks in for more. And then, because no book told her this one, she
// crouches and writes it down where it happened: her first line of her own, with a finger, in the sand. Her finger
// starts it and her cursor carries it on, a character a syllable.
const SAND_T = [92.31, 92.78, 93.03, 93.52, 93.83], SANDSTR = '沙子会进鞋';
function sandGlyph(ctx, ch, x, y, size, p) {            // a groove, lit from the upper left
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, -0.3, 0.62, 0, 0);
  ctx.beginPath(); ctx.rect(-size * 0.62, -size * 0.75, size * 1.24 * clamp(p), size * 1.5); ctx.clip();
  drawGlyph(ctx, ch, 3, 5, size, { weight: 900, color: '#FFF8E4' });
  drawGlyph(ctx, ch, 0, 0, size, { weight: 900, color: '#B48B50' });
  ctx.restore();
}
function bookTent(ctx, x, y, k) {                       // the book, face down, no help at all
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.rotate(-0.05); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(60,40,20,0.16)'; ctx.beginPath(); ctx.ellipse(0, 4, 190, 20, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(-150, 0); ctx.lineTo(0, -84); ctx.lineTo(150, 0); ctx.lineTo(128, 0); ctx.lineTo(0, -62); ctx.lineTo(-128, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5A3320'; ctx.beginPath(); ctx.moveTo(-164, 0); ctx.lineTo(-4, -100); ctx.lineTo(0, -92); ctx.lineTo(-146, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(164, 0); ctx.lineTo(4, -100); ctx.lineTo(0, -92); ctx.lineTo(146, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#6E4129'; ctx.beginPath(); ctx.moveTo(-164, 0); ctx.lineTo(-4, -100); ctx.lineTo(50, -128); ctx.lineTo(-104, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#5A3320'; ctx.beginPath(); ctx.moveTo(164, 0); ctx.lineTo(4, -100); ctx.lineTo(50, -128); ctx.lineTo(214, -30); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.save(); ctx.translate(124, -66); ctx.transform(1, 0.2, -0.5, 0.6, 0, 0); flower(ctx, 0, 0, 22, 0.3, COL.orange); ctx.restore();
  ctx.restore();
}
export function sSand(ctx, t) {
  const gy = 846, hs = 640, HX = 470, LOOK = 91.63, WRITE = 92.1, GS = 104, PITCH = 126;
  const push = E.io(sat(t, WRITE - 0.1, 93.4));
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 90.5, 91.2)) + 0.1 * push, cx: lerp(800, 1040, push), cy: lerp(640, 800, push), seed: 35 }, () => {
    beach(ctx, t, 430, 640);
    bookTent(ctx, 1560, 760, 0.62);
    const beat = t < LOOK ? 0 : t < WRITE ? 1 : 2;
    const hop = beat === 0 ? Math.abs(Math.sin(sat(t, 90.62, 91.5) * Math.PI * 3)) * 16 : 0;         // three shakes of the boot
    const M = anchor('o17', HX, gy - hop, hs, P6.o17m[0], P6.o17m[1]), G = anchor('o17', HX, gy, hs, P6.o17g[0], P6.o17g[1]);
    const run = sat(t, 90.62, 90.95) * (1 - sat(t, LOOK - 0.22, LOOK - 0.04)), heap = sat(t, 90.75, LOOK);
    // the line in the sand
    const F = anchor('o51', HX, gy, hs, P6.o51[0], P6.o51[1]), X0 = F[0] + 84, RY = F[1] + 10;
    let done = 0;
    for (let i = 0; i < 5; i++) { const p = sat(t, SAND_T[i] - 0.05, SAND_T[i] + 0.2); done += p; sandGlyph(ctx, SANDSTR[i], X0 + i * PITCH, RY, GS, p); }
    if (beat === 0) { const s = sq(t, 90.5, 1.2); char(ctx, 'o17', HX, gy, hs, { lift: hop, rot: Math.sin(sat(t, 90.62, 91.5) * Math.PI * 6) * 0.03, sx: s.sx, sy: s.sy }); }
    else if (beat === 1) { const s = sq(t, LOOK, 1.6), b = breathe(t, 1.3); char(ctx, 'o52', HX, gy, hs, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: Math.sin((t - LOOK) * 9) * 0.03 }); }
    else { const s = sq(t, WRITE, 1.6), b = breathe(t, 1.2), nod = SAND_T.reduce((a, T) => a + hit(t, T, 9), 0); char(ctx, 'o51', HX, gy, hs, { sx: s.sx * b.sx * (1 + 0.012 * nod), sy: s.sy * b.sy * (1 - 0.018 * nod) }); }
    // sand, in front of her: a stream out of the boot while she shakes it, and the heap it makes
    const hp = () => { ctx.beginPath(); ctx.moveTo(G[0] - 22 - 84 * heap, G[1] + 4); ctx.quadraticCurveTo(G[0], G[1] - 8 - 120 * heap, G[0] + 22 + 84 * heap, G[1] + 4); ctx.closePath(); };
    if (heap > 0) { cut(ctx, hp, '#D9B87E', 0.16, 10, 3); hp(); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke(); }
    if (run > 0) {
      const top = [G[0], G[1] - 60 * heap], cx = lerp(M[0], top[0], 0.25), cy = lerp(M[1], top[1], 0.55);
      const at = q => [(1 - q) * (1 - q) * M[0] + 2 * (1 - q) * q * cx + q * q * top[0], (1 - q) * (1 - q) * M[1] + 2 * (1 - q) * q * cy + q * q * top[1]];
      ctx.strokeStyle = '#D2AE72'; ctx.lineWidth = 17; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i <= 20; i++) { const p = at((i / 20) * run); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); } ctx.stroke();
      for (let i = 0; i < 60; i++) { const ph = (t * 1.9 + rnd(i, 831)) % 1; if (ph > run) continue; const p = at(ph * ph); ctx.fillStyle = i % 3 ? '#C9A66B' : '#A98652'; ctx.fillRect(p[0] + (rnd(i, 832) - 0.5) * (16 + 22 * ph) - 3.5, p[1] - 3.5, 7, 7); }
    }
    if (beat === 2) {                                 // her cursor, and what it throws up
      const cx = X0 - GS * 0.62 + (done / 5) * (5 * PITCH) - 6, writing = SAND_T.some(T => t > T - 0.05 && t < T + 0.2);
      ctx.save(); ctx.translate(cx, RY); ctx.transform(1, 0, -0.3, 1, 0, 0);
      if (writing || (t % 0.86) < 0.5) { ctx.fillStyle = COL.orange; ctx.fillRect(-5, -GS * 0.5, 10, GS * 0.92); }
      ctx.restore();
      if (writing) for (let i = 0; i < 9; i++) { const ph = (t * 5 + rnd(i, 841)) % 1; ctx.fillStyle = rgba('#B48B50', 1 - ph); ctx.fillRect(cx + (rnd(i, 842) - 0.3) * 60 * ph, RY - 20 - Math.sin(ph * Math.PI) * 44 * (0.5 + rnd(i, 843)), 6, 6); }
      SAND_T.forEach((T, i) => sparkle(ctx, t, T + 0.2, X0 + i * PITCH, RY - 30, COL.orange, 6, 40, 80));
    }
  });
  bokeh(ctx, t, { n: 7, seed: 153, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ================================================================== 1:34.2–1:37.5  小柯说 先别想 桥都搭了半截
// Across the water there is an island with a blank page on a pole: the next one. 橙子 is still deciding how to get
// there (a boat? swim? a bridge?). Ko is not deciding anything. His knocking breaks her train of thought, and when she
// looks, the bridge is at 50% and he is waving her on to it.
export const B2 = { x0: 566, w: 116, top: 800, h: 76, n: 8, T: [-1, 95.62, 95.92, 96.18], KNOCK: [94.97, 95.18], HALF: 96.78, GO: 97.16 };
export const bxOf = i => B2.x0 + (i + 0.5) * B2.w;
export const POLE = 560;
export function isle(ctx, t, x0, top, tomorrow = false) {          // tomorrow: seen later, when nobody is about to write on it
  const edge = () => { ctx.moveTo(W + 500, top); ctx.lineTo(x0 + 70, top); ctx.quadraticCurveTo(x0 + 6, top + 6, x0 - 16, top + 70); ctx.lineTo(x0 - 70, H + 300); };
  cut(ctx, () => { ctx.beginPath(); edge(); ctx.lineTo(W + 500, H + 300); ctx.closePath(); }, '#F3E4C6', 0.2, 18, -5);
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.lineJoin = 'round'; ctx.beginPath(); edge(); ctx.stroke();
  const px = x0 + 120, sw = Math.sin(t * 2.4) * 0.05;          // the page that is waiting there
  ctx.fillStyle = COL.ink; ctx.fillRect(px - 5, top - POLE, 10, POLE);
  ctx.save(); ctx.translate(px + 5, top - POLE + 8); ctx.transform(1, sw, 0, 1, 0, 0);
  cut(ctx, () => { ctx.beginPath(); ctx.rect(0, 0, 130, 164); }, COL.white, 0.2, 14, 5); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.strokeRect(0, 0, 130, 164);
  ctx.fillStyle = rgba(COL.ink, 0.14); for (let r = 0; r < 4; r++) ctx.fillRect(18, 70 + r * 22, 94, 2.5);
  if (!tomorrow && (t % 0.86) < 0.5) { ctx.fillStyle = COL.orange; ctx.fillRect(18, 24, 6, 32); }
  ctx.restore();
}
function cloud(ctx, x, y, r, k, a, inside) {
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= a;
  const cl = () => { ctx.beginPath(); for (const [dx, dy, rr] of [[-0.62, 0.1, 0.5], [-0.2, -0.3, 0.6], [0.36, -0.24, 0.56], [0.7, 0.12, 0.46], [0.1, 0.3, 0.6], [-0.36, 0.34, 0.46]]) { ctx.moveTo((dx + rr) * r, dy * r); ctx.arc(dx * r, dy * r, rr * r, 0, TAU); } for (const [dx, dy, rr] of [[-0.86, 0.98, 0.15], [-1.12, 1.3, 0.09]]) { ctx.moveTo((dx + rr) * r, dy * r); ctx.arc(dx * r, dy * r, rr * r, 0, TAU); } };
  ctx.lineWidth = 9; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; cl(); ctx.stroke(); cut(ctx, cl, COL.white, 0.14, 14, 5);
  inside(r);
  ctx.restore();
}
function plan(ctx, kind, r) {                          // three ways across, none of them begun
  ctx.strokeStyle = COL.inkSoft; ctx.fillStyle = COL.inkSoft; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(-0.14 * r, 0.02 * r);
  if (kind === 0) {                                    // a boat
    ctx.beginPath(); ctx.moveTo(-0.46 * r, 0.08 * r); ctx.quadraticCurveTo(-0.3 * r, 0.38 * r, 0, 0.38 * r); ctx.quadraticCurveTo(0.3 * r, 0.38 * r, 0.46 * r, 0.08 * r); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, 0.08 * r); ctx.lineTo(0, -0.46 * r); ctx.lineTo(0.3 * r, -0.04 * r); ctx.lineTo(0, -0.04 * r); ctx.stroke();
  } else if (kind === 1) {                             // swimming
    for (let j = 0; j < 2; j++) { ctx.beginPath(); for (let i = 0; i <= 12; i++) { const xx = (-0.5 + i * 0.083) * r, yy = (0.12 + j * 0.22) * r + Math.sin(i * 1.05) * 0.06 * r; if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
    ctx.beginPath(); ctx.arc(-0.12 * r, -0.18 * r, 0.12 * r, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(0.04 * r, -0.1 * r); ctx.lineTo(0.38 * r, -0.28 * r); ctx.stroke();
  } else {                                             // a bridge
    const ay = u => { const s = (u + 0.5), m = 1 - s; return (m * m * 0.3 + 2 * m * s * -0.46 + s * s * 0.3) * r; };
    ctx.beginPath(); ctx.moveTo(-0.5 * r, 0.3 * r); ctx.quadraticCurveTo(0, -0.46 * r, 0.5 * r, 0.3 * r); ctx.lineTo(-0.5 * r, 0.3 * r); ctx.stroke();
    for (const u of [-0.25, 0, 0.25]) { ctx.beginPath(); ctx.moveTo(u * r, 0.3 * r); ctx.lineTo(u * r, ay(u)); ctx.stroke(); }
  }
  ctx.restore();
  drawGlyph(ctx, '？', 0.56 * r, -0.2 * r, 0.5 * r, { weight: 900, color: COL.orange, rot: 0.2 });
}
export function sBridgeKo(ctx, t) {
  const gy = B2.top + 12, OX = 215, OS = 430, KS = 380, POP = 95.3, n = B2.T.filter(T => t >= T).length;
  const H9 = anchor('k09', 0, 0, KS, P6.k09[0], P6.k09[1]);                  // from Ko's feet to his hands when he is pressing a block home
  // Ko: on one knee over the newest block, hopping on to the next; then on his feet, waving
  let slot = 0, lift = 0, slam = hit(t, B2.KNOCK[0], 12) + hit(t, B2.KNOCK[1], 12);
  for (let i = 1; i < 4; i++) { const p = sat(t, B2.T[i] - 0.2, B2.T[i]); slot += E.io(p); lift += Math.sin(p * Math.PI) * 46; slam += hit(t, B2.T[i], 12); }
  const up = t >= 96.39;
  cam(ctx, t, { z: 1.05 - 0.035 * E.out(sat(t, 94.2, 95.0)) + 0.02 * hit(t, B2.HALF, 6), cx: 900, cy: 700, x: -40 * E.io(sat(t, 95.4, 97.3)), seed: 36 }, () => {
    seaSky(ctx, t, 470);
    ctx.fillStyle = SEA[0]; ctx.fillRect(-300, 470, W + 600, 70);
    waveBands(ctx, t, 486, 1120, 7, { pow: 1.35 });
    isle(ctx, t, B2.x0 + B2.n * B2.w + 10, B2.top);
    bank(ctx, B2.x0, B2.top);
    for (let i = n; i < B2.n; i++) {                    // the half that is not there yet
      const a = sat(t, 95.5 + i * 0.03, 95.8 + i * 0.03), bl = t > B2.GO ? 0.5 + 0.5 * Math.sin((t - B2.GO) * 14 - (i - 4) * 1.2) : 0;
      if (a <= 0) continue;
      ctx.save(); ctx.globalAlpha = a * (0.4 + 0.5 * bl); ctx.setLineDash([12, 10]); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; rrect(ctx, B2.x0 + i * B2.w + 4, B2.top, B2.w - 8, B2.h, 14); ctx.stroke(); ctx.restore();
    }
    for (let i = 0; i < n; i++) {                       // the half that is
      const bx = bxOf(i), s = (i ? hit(t, B2.T[i], 12) : 0) + (i === 0 ? slam * 0.6 : 0);
      for (const dx of [-36, 36]) {
        ctx.strokeStyle = COL.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + dx, B2.top + B2.h - 6); ctx.lineTo(bx + dx, H + 200); ctx.stroke();
        const r = 18 + 6 * Math.sin(t * 3 + i + dx) + 34 * s; ctx.strokeStyle = rgba(COL.white, 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx + dx, B2.top + 170, r, r * 0.26, 0, 0, TAU); ctx.stroke();
      }
      codeBlock(ctx, bx, B2.top + 10 * s, B2.w - 8, B2.h, { sy: 1 - 0.2 * s });
      if (i) sparkle(ctx, t, B2.T[i], bx, B2.top + 20, '#2FA676', 7, 90, 150);
    }
    // how far along it is
    const ba = sat(t, 95.5, 95.75);
    if (ba > 0) {
      const bw = 440, bh = 42, x = B2.x0 + B2.n * B2.w / 2 - bw / 2 - 50, y = 372, k = 1 + 0.12 * hit(t, B2.HALF, 7);
      ctx.save(); ctx.translate(x + bw / 2, y); ctx.scale(k * E.back(ba), k * E.back(ba)); ctx.translate(-bw / 2, 0);
      cut(ctx, () => rrect(ctx, 0, -bh / 2, bw, bh, bh / 2), COL.white, 0.2, 12, 4); rrect(ctx, 0, -bh / 2, bw, bh, bh / 2); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke();
      ctx.save(); rrect(ctx, 4, -bh / 2 + 4, bw - 8, bh - 8, (bh - 8) / 2); ctx.clip();
      let fill = 0; for (let i = 0; i < 4; i++) fill += i ? E.out(sat(t, B2.T[i], B2.T[i] + 0.2)) : 1;
      ctx.fillStyle = '#57C297'; ctx.fillRect(0, -bh / 2, bw * fill / B2.n, bh); ctx.restore();
      text(ctx, Math.round(n / B2.n * 100) + '%', bw + 22, 2, { size: 40, weight: 800, align: 'left', color: t >= B2.HALF ? '#17835A' : COL.inkSoft, fam: '"Noto Sans SC"' });
      ctx.restore();
    }
    // 橙子: working it out, then not
    if (t > 96.9) { const wb = walkBob(t); char(ctx, walkId('o', t), lerp(OX, B2.x0 - 70, E.io(sat(t, 96.9, 97.55))), gy, OS, { lift: wb.lift, rot: wb.rot, windX: -5, flutter: 2 }); }
    else { const pose = t < POP ? 'o31' : t < 96.39 ? 'o39' : 'o33', s = sq(t, t < POP ? 94.2 : t < 96.39 ? POP : 96.39, 1.4), b = breathe(t); char(ctx, pose, OX, gy, OS, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: b.rot, lift: pose === 'o33' ? hopOn(t, 0, 26) : 0 }); }
    const ta = sat(t, 94.24, 94.44), tp = sat(t, POP - 0.16, POP), jolt = (hit(t, B2.KNOCK[0], 9) + hit(t, B2.KNOCK[1], 9)) * 10;
    if (ta > 0 && tp < 1) cloud(ctx, OX + 190 + Math.sin(t * 50) * jolt, 300, 92, E.back(ta) * (1 + 0.35 * tp), 1 - tp, r => plan(ctx, t < 94.58 ? 0 : t < 94.82 ? 1 : 2, r));
    sparkle(ctx, t, POP - 0.04, OX + 190, 300, COL.orange, 9, 80, 170);
    // Ko
    if (!up) {
      const hx = bxOf(slot), kx = hx - H9[0], ky = B2.top - H9[1] + 2;
      char(ctx, 'k09', kx, ky, KS, { lift, sx: 1 + 0.05 * slam, sy: 1 - 0.07 * slam });
      for (const T of B2.KNOCK) { const rp = sat(t, T, T + 0.35); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba('#17835A', 0.8 * (1 - rp)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(hx, B2.top, 30 + 70 * E.out(rp), Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
    } else {
      const s = sq(t, 96.39, 1.5), s2 = sq(t, B2.GO, 1.3);
      char(ctx, 'k10', bxOf(2) + 30, B2.top + 12, KS, { sx: s.sx * s2.sx, sy: s.sy * s2.sy, lift: 34 * Math.abs(Math.sin(sat(t, B2.GO, B2.GO + 0.38) * Math.PI)) + hopOn(t, 0.25, 8) });
    }
  });
  bokeh(ctx, t, { n: 7, seed: 154, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}
