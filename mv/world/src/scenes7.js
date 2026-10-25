// Full version, the end of the second chorus (song time). The road with three backs and three pages is the finale;
// the second chorus says the same lines another way, so the two are not the same pictures twice.
//   sStars3      把读过的星 走成远方: each of them has read different stars. Three constellations, a syllable a star:
//                a flower, a prompt, a whale. Then they go on ahead, to where the three are going.
//   sBridgeDone  下一页 · 下一页: the bridge that was half built is finished by walking on it, and at the far end is the
//                page that was waiting: tomorrow's, with nothing on it. That is where the bridge of the song begins.
import { W, H, TAU, clamp, lerp, sat, E, rnd, COL, rgba, beatPhase, drawGlyph, text, rrect, flower } from './lib.js';
import { char, walkBob, manifest } from './chars.js';
import { finish, bokeh, cam, cut, hillPath } from './fx.js';
import { hit, sq, star4, rays } from './scenes1.js';
import { GY, house } from './scenes2.js';
import { PX, PY, PW, PH, pagePath } from './scenes3.js';
import { SEA, seaSky, waveBands, bank, codeBlock, tick, sparkle, walkId, hopOn, roadPages, anchor } from './scenes4.js';
import { B2, bxOf, isle, POLE } from './scenes6.js';

const NIGHT = ['#1E2148', '#4A3E7C', '#F0A56A'];
const S5 = [137.98, 138.25, 138.73, 138.95, 139.10], GO = [139.79, 140.19, 140.46, 140.80];
const at5 = u => { const x = clamp(u) * 4, i = Math.min(3, Math.floor(x)); return lerp(S5[i], S5[i + 1], x - i); };      // when a star that is u of the way through comes out
const CON = [
  { c: '#FFB877', at: [700, 236], to: [1540, 300], pts: [[0, 0], [0, -98], [85, -49], [85, 49], [0, 98], [-85, 49], [-85, -49]], edges: [[1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1], [0, 1], [0, 3], [0, 5]] },          // 橙子: a flower
  { c: '#8FE3BE', at: [1250, 250], to: [1690, 380], pts: [[-112, -72], [-18, 0], [-112, 72], [22, 86], [124, 86]], edges: [[0, 1], [1, 2], [3, 4]] },                                                                   // Ko: a prompt
  { c: '#9CC7FF', at: [250, 262], to: [1420, 410], pts: [[-150, 20], [-92, -48], [-10, -66], [70, -40], [120, 0], [172, -54], [180, 26], [50, 52], [-60, 58]], edges: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [4, 6], [4, 7], [7, 8], [8, 0]] },   // 大肥鱼: a whale
];
export function sStars3(ctx, t) {
  const T0 = 137.96, go = E.io(sat(t, 139.62, 140.9)), camX = 600 + 190 * (t - T0) + 330 * E.in(sat(t, 139.6, 141.4));
  let beat = 0; S5.forEach(T => { beat += hit(t, T, 10); });
  cam(ctx, t, { z: 1.03 + 0.025 * sat(t, T0, 141.4) + 0.012 * beat + 0.02 * hit(t, S5[4], 6), cx: 900, cy: 620, seed: 72 }, () => {
    const g = ctx.createLinearGradient(0, -100, 0, GY + 20); g.addColorStop(0, NIGHT[0]); g.addColorStop(0.62, NIGHT[1]); g.addColorStop(1, NIGHT[2]);
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, GY + 320);
    for (let i = 0; i < 110; i++) {
      const tw = 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7), x = ((rnd(i, 965) * 2300 - camX * 0.1) % 2300 + 2300) % 2300 - 190, y = rnd(i, 966) * 660, r = 1.2 + rnd(i, 967) * 2.2;
      if (CON.some(C => Math.hypot(x - lerp(C.at[0], C.to[0], go), y - lerp(C.at[1], C.to[1], go)) < 210 * (1 - 0.66 * go))) continue;           // the sky is kept clear where they are drawn
      ctx.fillStyle = rgba('#FFF3DC', 0.25 + 0.4 * tw); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    const gl = ctx.createRadialGradient(1760, GY, 20, 1760, GY, 800); gl.addColorStop(0, 'rgba(255,190,120,0.62)'); gl.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
    // the three constellations
    CON.forEach((C, ci) => {
      const cx = lerp(C.at[0], C.to[0], go), cy = lerp(C.at[1], C.to[1], go) - Math.sin(go * Math.PI) * 60, k = 1 - 0.66 * go, n = C.pts.length;
      const tp = j => at5(j / (n - 1)) + ci * 0.012, P = j => [cx + C.pts[j][0] * k, cy + C.pts[j][1] * k];
      if (go > 0 && go < 1) { ctx.strokeStyle = rgba(C.c, 0.5 * Math.sin(go * Math.PI)); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lerp(C.at[0], cx, 0.35), lerp(C.at[1], cy, 0.35)); ctx.lineTo(cx, cy); ctx.stroke(); }
      ctx.strokeStyle = rgba(C.c, 0.8); ctx.lineWidth = 3.5 * (0.6 + 0.4 * k); ctx.lineCap = 'round';
      for (const [a, b] of C.edges) {
        const p = sat(t, Math.max(tp(a), tp(b)), Math.max(tp(a), tp(b)) + 0.16); if (p <= 0) continue;
        const A = P(a), B = P(b); ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], p), lerp(A[1], B[1], p)); ctx.stroke();
      }
      for (let j = 0; j < n; j++) {
        const p = sat(t, tp(j), tp(j) + 0.22); if (p <= 0) continue;
        const q = P(j), r = (j === 0 ? 30 : 23) * E.back(p) * (1 + 0.14 * Math.sin(t * 5 + j + ci)) * (0.55 + 0.45 * k);
        const gg = ctx.createRadialGradient(q[0], q[1], 0, q[0], q[1], r * 3.4); gg.addColorStop(0, rgba(C.c, 0.5 * p)); gg.addColorStop(1, rgba(C.c, 0)); ctx.fillStyle = gg; ctx.fillRect(q[0] - r * 4, q[1] - r * 4, r * 8, r * 8);
        star4(ctx, q[0], q[1], r, C.c, 1); sparkle(ctx, t, tp(j), q[0], q[1], C.c, 6, 26, 70);
      }
    });
    const done = sat(t, S5[4], S5[4] + 0.6);          // 星: all three, at once
    if (done > 0 && done < 1) CON.forEach(C => { ctx.strokeStyle = rgba(C.c, 0.7 * (1 - done)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(C.at[0], C.at[1], 130 + 150 * E.out(done), 0, TAU); ctx.stroke(); });
    cut(ctx, () => hillPath(ctx, GY + 20, 150, 560, 0.6, camX * 0.35), '#3B3266', 0.25, 30, -8);
    cut(ctx, () => hillPath(ctx, GY + 30, 90, 330, 2.4, camX * 0.6), '#30284F', 0.25, 30, -8);
    ctx.fillStyle = '#2B2440'; ctx.fillRect(-300, GY - 4, W + 600, 500);
    ctx.save(); ctx.filter = 'brightness(0.74) saturate(0.85)'; roadPages(ctx, camX); ctx.restore();
    ctx.strokeStyle = '#161225'; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(-300, GY); ctx.lineTo(W + 300, GY); ctx.stroke();
    // the three of them, walking under it; on 星 they jump; on 走成远方 they run
    const run = sat(t, GO[0] - 0.1, GO[0] + 0.2), jump = 64 * Math.abs(Math.sin(sat(t, S5[4], S5[4] + 0.42) * Math.PI));
    ctx.save(); ctx.filter = 'brightness(0.86) saturate(0.95)';
    [['f', 300, 380, 0.5], ['o', 590, 430, 0], ['k', 880, 380, 0.25]].forEach(([w, x, sz, ph]) => {
      const wb = walkBob(t + ph * 0.43), s = sq(t, S5[4], 1.2);
      char(ctx, walkId(w, t, ph), x + 50 * go, GY + 24, sz, { lift: wb.lift * (1 + 0.6 * run) + jump, rot: wb.rot + 0.04 * run, sx: s.sx, sy: s.sy, windX: -6 - 8 * run, flutter: 2 + 3 * run, shadowColor: '#000000' });
    });
    ctx.restore();
  });
  bokeh(ctx, t, { n: 10, seed: 173, colors: ['#FFE9B8', COL.orange], alpha: 0.12, blend: 'screen' });
  finish(ctx, { dark: true });
}

// A camera in layers. f = 1 is the foreground; a smaller f moves and zooms less, so it reads as further away.
function layer(ctx, t, C, f, seed, fn) { cam(ctx, t, { z: 1 + (C.z - 1) * f, cx: C.cx, cy: C.cy, x: C.x * f, y: C.y * f, seed, hand: 2 }, fn); }
// running: the two walking frames at twice the rate
const runId = (p, t, ph) => { const f = (((beatPhase(t) * 2 + ph) % 1) + 1) % 1, a = f < 0.25 || f >= 0.75; return p === 'o' ? (a ? 'o11' : 'o06') : p === 'k' ? (a ? 'k07' : 'k08') : (a ? 'f07' : 'f08'); };
// for a pose whose anchor is the middle of the body (the jumps): how far up it has to be lifted to clear the ground
const baseLift = (id, size) => { const m = manifest()[id]; return anchor(id, 0, 0, size, m.feetXo ?? m.feetX, m.h - 6)[1]; };
function progress(ctx, t, n, fill, done, a) {       // the bar, pinned to the screen
  if (a <= 0) return;
  const bw = 440, bh = 42, k = 1 + 0.14 * hit(t, done, 7);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(960 - 110, 96); ctx.scale(k, k); ctx.translate(-bw / 2, 0);
  cut(ctx, () => rrect(ctx, 0, -bh / 2, bw, bh, bh / 2), COL.white, 0.2, 12, 4); rrect(ctx, 0, -bh / 2, bw, bh, bh / 2); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.save(); rrect(ctx, 4, -bh / 2 + 4, bw - 8, bh - 8, (bh - 8) / 2); ctx.clip(); ctx.fillStyle = '#57C297'; ctx.fillRect(0, -bh / 2, bw * fill / B2.n, bh); ctx.restore();
  text(ctx, Math.round(n / B2.n * 100) + '%', bw + 22, 2, { size: 40, weight: 800, align: 'left', color: n === 8 ? '#17835A' : COL.inkSoft, fam: '"Noto Sans SC"' });
  tick(ctx, bw + 190, 0, 26, (t - done - 0.05) / 0.2, '#2FA676');
  ctx.restore();
}

// ------------------------------------------------------------------ 2:21.4–2:23.1  下一页: the bridge, finished
// The camera runs alongside them. On 一 and 页 the last two blocks come down just ahead of Ko, and on the next beat the
// three of them jump the rest of the way; the landing shakes the frame, and then the camera stands back to see where
// they have got to.
const BD = { T0: 141.4, DROP: [142.0, 142.2], UP: 142.42, LAND: 142.85 };
const bdX = t => (t <= BD.UP ? 560 + 650 * (t - BD.T0) : t <= BD.LAND ? lerp(560 + 650 * (BD.UP - BD.T0), 1640, E.out(sat(t, BD.UP, BD.LAND))) : 1640 + 90 * E.out(sat(t, BD.LAND, 143.6)));
export function sBridgeDone(ctx, t) {
  const gy = B2.top + 12, IX = B2.x0 + B2.n * B2.w + 10, n = 6 + BD.DROP.filter(T => t >= T).length, ox = bdX(t);
  let slam = 0; BD.DROP.forEach(T => { slam += hit(t, T, 9); });
  const land = hit(t, BD.LAND, 8), w = E.io(sat(t, 142.62, 143.12));
  const C = { z: lerp(1.45, 1.1, w) + 0.03 * slam + 0.05 * land, cx: lerp(ox, 1500, w), cy: lerp(650, 560, w), x: lerp(820 - ox, 960 - 1500, w), y: lerp(0, -20, w) + Math.sin(t * 67) * 9 * land };
  layer(ctx, t, C, 0.35, 71, () => {
    seaSky(ctx, t, 470);
    ctx.fillStyle = SEA[0]; ctx.fillRect(-300, 470, W + 600, 70);
    waveBands(ctx, t, 486, 1120, 7, { pow: 1.35 });
  });
  layer(ctx, t, C, 1, 71, () => {
    isle(ctx, t, IX, B2.top, true);
    bank(ctx, B2.x0, B2.top);
    for (let i = 0; i < B2.n; i++) {                  // the other half comes down as they get to it
      const Ti = i < 6 ? -1 : BD.DROP[i - 6], p = i < 6 ? 1 : sat(t, Ti - 0.22, Ti); if (p <= 0) continue;
      const bx = bxOf(i), s = i < 6 ? 0 : hit(t, Ti, 12);
      if (p >= 1) for (const dx of [-36, 36]) {
        ctx.strokeStyle = COL.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx + dx, B2.top + B2.h - 6); ctx.lineTo(bx + dx, H + 200); ctx.stroke();
        const r = 18 + 6 * Math.sin(t * 3 + i + dx) + 34 * s; ctx.strokeStyle = rgba(COL.white, 0.75); ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(bx + dx, B2.top + 170, r, r * 0.26, 0, 0, TAU); ctx.stroke();
      }
      codeBlock(ctx, bx, B2.top - (1 - E.in(p)) * 420 + 10 * s, B2.w - 8, B2.h, { sy: 1 - 0.2 * s, rot: (1 - p) * 0.5 });
      if (i >= 6) {
        sparkle(ctx, t, Ti, bx, B2.top + 20, '#2FA676', 9, 80, 170);
        const dp = sat(t, Ti, Ti + 0.4);               // dust off the slam
        if (dp > 0 && dp < 1) for (let k = 0; k < 8; k++) { const sg = k % 2 ? 1 : -1, r = 6 + 10 * (1 - dp); ctx.fillStyle = rgba(COL.white, 0.9 * (1 - dp)); ctx.beginPath(); ctx.arc(bx + sg * (60 + 90 * E.out(dp) + k * 6), B2.top + 6 - 40 * Math.sin(dp * Math.PI) * (0.5 + 0.1 * k), r, 0, TAU); ctx.fill(); }
      }
    }
    const lp = sat(t, BD.LAND, BD.LAND + 0.45);       // the landing
    if (lp > 0 && lp < 1) { ctx.strokeStyle = rgba(COL.white, 0.9 * (1 - lp)); ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(ox, gy, 120 + 260 * E.out(lp), 18 + 30 * E.out(lp), 0, 0, TAU); ctx.stroke(); }
    // the three of them: running, then the jump, then on the other side
    [['f', -190, 300, 0.5, 'f17', 0.08], ['o', 0, 330, 0, 'o58', 0.04], ['k', 200, 300, 0.25, 'k14', 0]].forEach(([wk, dx, sz, ph, leap, dl]) => {
      const x = ox + dx, up = BD.UP + dl, u = sat(t, up, BD.LAND + dl * 0.5);
      if (t < up) char(ctx, runId(wk, t, ph), x, gy, sz, { lift: Math.abs(Math.sin((beatPhase(t) * 2 + ph) * Math.PI)) * 22, rot: 0.07, windX: -11, flutter: 4 });
      else if (u < 1) char(ctx, leap, x, gy, sz, { lift: baseLift(leap, sz) + 4 * 150 * u * (1 - u), rot: lerp(-0.14, 0.1, u), windX: -12, flutter: 6, blink: 0 });
      else { const s = sq(t, BD.LAND + dl * 0.5, 1.7); char(ctx, walkId(wk, t, ph), x, gy, sz, { sx: s.sx, sy: s.sy, lift: hopOn(t, ph, 14), windX: -5, flutter: 2 }); }
    });
  });
  let fill = 6; BD.DROP.forEach(T => { fill += E.out(sat(t, T, T + 0.18)); });
  progress(ctx, t, n, fill, BD.DROP[1], 1 - sat(t, 142.7, 142.95));
  bokeh(ctx, t, { n: 7, seed: 174, alpha: 0.1, colors: [COL.white] });
  finish(ctx, { light: 0.7 });
}

// ------------------------------------------------------------------ 2:23.1–2:26.9  下一页: and the one after that
// They reached the page across the water. The next one is on top of a mountain. The camera climbs with them, close;
// on the long 页 it rises and pulls back, the ranges sliding apart behind them, and on every peak out there a page goes
// up, one after another: 明天没有最后一页. Then it goes into the nearest: tomorrow's, with nothing on it.
const RIDGE = [[-300, 1040], [150, 964], [520, 820], [590, 808], [900, 664], [970, 652], [1330, 470]], POLE2 = 250;
const ridgeY = x => { for (let i = 1; i < RIDGE.length; i++) if (x <= RIDGE[i][0]) { const a = RIDGE[i - 1], b = RIDGE[i]; return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return RIDGE[RIDGE.length - 1][1]; };
const RANGES = [          // far to near: colour, base, how far away (for the camera), then peaks [x, height, half-width]
  ['#BFD6F5', 650, 0.3, [[150, 250, 250], [560, 340, 290], [960, 260, 260], [1600, 330, 300], [1930, 240, 250]]],
  ['#BFE8D2', 760, 0.45, [[-60, 300, 300], [400, 390, 320], [830, 290, 280], [1790, 400, 330]]],
  ['#FBD3A6', 880, 0.62, [[60, 300, 320], [1960, 380, 360]]],
];
const POPS = (() => { const o = {}; let k = 0; for (let li = 2; li >= 0; li--) RANGES[li][3].forEach((q, i) => { o[li + ':' + i] = 143.92 + 0.075 * k++; }); return o; })();       // near to far
function pageFlag(ctx, x, y, k, t, seed, word) {       // a page on a pole, the pole's foot at (x, y)
  const sw = Math.sin(t * 2.4 + seed) * 0.06;
  ctx.fillStyle = COL.ink; ctx.fillRect(x - 5 * k, y - POLE2 * k, 10 * k, POLE2 * k);
  ctx.save(); ctx.translate(x + 5 * k, y - POLE2 * k + 8 * k); ctx.transform(1, sw, 0, 1, 0, 0); ctx.scale(k, k);
  cut(ctx, () => { ctx.beginPath(); ctx.rect(0, 0, 130, 164); }, COL.white, 0.2, 14, 5); ctx.lineWidth = 4 / Math.max(0.5, k); ctx.strokeStyle = COL.ink; ctx.strokeRect(0, 0, 130, 164);
  if (word) { text(ctx, '明天', 18, 38, { size: 30, weight: 800, align: 'left', color: COL.orange, ls: 3 }); ctx.fillStyle = rgba(COL.ink, 0.14); for (let r = 0; r < 4; r++) ctx.fillRect(18, 70 + r * 22, 94, 2.5); }
  ctx.restore();
}
function peak(ctx, x, base, h, hw, color, t, seed, Tp) {
  const tri = () => { ctx.beginPath(); ctx.moveTo(x - hw, base); ctx.lineTo(x - hw * 0.1, base - h * 0.95); ctx.quadraticCurveTo(x, base - h * 1.03, x + hw * 0.1, base - h * 0.95); ctx.lineTo(x + hw, base); ctx.closePath(); };
  cut(ctx, tri, color, 0.14, 16, -4);
  ctx.save(); tri(); ctx.clip();                      // snow
  ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(x - hw, base - h * 0.7);
  for (let i = 0; i <= 8; i++) ctx.lineTo(x - hw * 0.4 + (i / 8) * hw * 0.8, base - h * (0.7 + (i % 2 ? 0.07 : -0.01)));
  ctx.lineTo(x + hw, base - h * 0.7); ctx.lineTo(x + hw, base - h * 1.2); ctx.lineTo(x - hw, base - h * 1.2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.moveTo(x, base - h * 1.03); ctx.lineTo(x + hw, base); ctx.lineTo(x + hw * 0.25, base); ctx.closePath(); ctx.fill();       // the side the sun is on
  ctx.restore();
  tri(); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.ink, 0.4); ctx.lineJoin = 'round'; ctx.stroke();
  const pop = sat(t, Tp, Tp + 0.3), fk = 0.2 + 0.0004 * h, top = base - h * 0.99;
  if (pop > 0) pageFlag(ctx, x, top, fk * E.back(pop), t, seed, false);
  sparkle(ctx, t, Tp + 0.18, x + 70 * fk, top - POLE2 * fk + 70 * fk, COL.orange, 8, 30, 90);
}
function cloudSea(ctx, y, t, seed, dir, a = 0.9) {
  ctx.fillStyle = rgba(COL.white, a);
  for (let i = 0; i < 16; i++) { const x = ((i * 170 + rnd(i, seed) * 80 + t * 14 * dir) % (W + 500) + (W + 500)) % (W + 500) - 250, r = 54 + rnd(i, seed + 1) * 46; ctx.beginPath(); ctx.arc(x, y + rnd(i, seed + 2) * 22, r, 0, TAU); ctx.fill(); }
  ctx.fillRect(-300, y + 22, W + 600, 1200);
}
function tomorrowPage(ctx, wa, ta = wa) {          // the page, close: nothing on it yet. The paper first, then what is printed on it
  if (wa <= 0) return;
  ctx.save(); ctx.globalAlpha = wa;
  ctx.fillStyle = COL.white; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.2); g.addColorStop(0, 'rgba(120,80,40,0)'); g.addColorStop(1, 'rgba(120,80,40,0.1)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = ta;
  text(ctx, '明天', 230, 236, { size: 132, weight: 800, align: 'left', color: COL.orange, ls: 10 });
  ctx.fillStyle = rgba(COL.ink, 0.16); ctx.fillRect(230, 336, 1460, 4);
  ctx.fillStyle = rgba(COL.ink, 0.1); for (let r = 0; r < 5; r++) ctx.fillRect(230, 470 + r * 104, 1460, 3);
  text(ctx, '第 10484 页', 960, 918, { size: 34, weight: 500, color: COL.inkSoft, ls: 5 });
  ctx.restore();
}
export function sPeaks(ctx, t) {
  const T0 = 143.08, ARR = 144.9, TOP = RIDGE[RIDGE.length - 1], PG = [TOP[0] + 70, TOP[1] - POLE2 + 90];
  const lead = lerp(520, 1140, sat(t, T0, ARR)), there = t >= ARR, mid = lead - 200;
  const w = E.io(sat(t, 143.78, 144.95)), push = E.in(sat(t, 145.0, 146.1)), aim = sat(push * 7, 0, 1);
  const tcx = mid, tcy = ridgeY(mid) - 130, z0 = Math.exp(lerp(Math.log(1.75), Math.log(1.03), w));
  const C = { z: z0 + 12.5 * push, cx: lerp(lerp(tcx, 960, w), PG[0], aim), cy: lerp(lerp(tcy, 600, w), PG[1], aim),
    x: lerp(lerp(900 - tcx, 0, w), 960 - PG[0], aim), y: lerp(lerp(600 - tcy, 0, w), 540 - PG[1], aim) };
  layer(ctx, t, C, 0.12, 75, () => {                 // sky and sun
    const g = ctx.createLinearGradient(0, -200, 0, 900); g.addColorStop(0, '#FFE6BC'); g.addColorStop(0.6, '#FFF4DF'); g.addColorStop(1, '#FFF9EE');
    ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    rays(ctx, TOP[0] + 80, TOP[1] - 150, t * 0.5, 0.3, '#FFE9BF', 18);
    ctx.fillStyle = '#FFF2D0'; ctx.beginPath(); ctx.arc(TOP[0] + 80, TOP[1] - 150, 190 + 8 * Math.sin(t * 2), 0, TAU); ctx.fill();
  });
  RANGES.forEach(([c, base, f, peaks], li) => layer(ctx, t, C, f, 75, () => {
    peaks.forEach(([x, h, hw], i) => peak(ctx, x, base, h, hw, c, t, li * 7 + i, POPS[li + ':' + i]));
    cloudSea(ctx, base - 12, t, 60 + li * 9, li % 2 ? 1 : -1, 0.92);
  }));
  layer(ctx, t, C, 0.5, 75, () => {                  // gulls
    for (let i = 0; i < 3; i++) {
      const bx = 420 + i * 170 + Math.sin(t * 0.8 + i) * 30, by = 230 + i * 44 + Math.cos(t * 1.1 + i) * 12, fl = Math.sin(t * 7 + i) * 10;
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 26, by - fl); ctx.quadraticCurveTo(bx - 10, by - 10, bx, by); ctx.quadraticCurveTo(bx + 10, by - 10, bx + 26, by - fl); ctx.stroke();
    }
  });
  layer(ctx, t, C, 1, 75, () => {                    // the mountain they are on
    const fg = () => { ctx.beginPath(); ctx.moveTo(-300, H + 300); RIDGE.forEach(q => ctx.lineTo(q[0], q[1])); ctx.quadraticCurveTo(TOP[0] + 40, TOP[1] - 6, TOP[0] + 90, TOP[1] + 40); ctx.lineTo(1560, 760); ctx.lineTo(1700, 800); ctx.lineTo(W + 300, 1030); ctx.lineTo(W + 300, H + 300); ctx.closePath(); };
    cut(ctx, fg, '#FFF6E2', 0.22, 26, -6);
    ctx.save(); fg(); ctx.clip();
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(900, 300); ctx.lineTo(1040, 640); ctx.lineTo(1110, 600); ctx.lineTo(1180, 660); ctx.lineTo(1250, 610); ctx.lineTo(1330, 670); ctx.lineTo(1400, 620); ctx.lineTo(1470, 660); ctx.lineTo(1700, 300); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = rgba(COL.ink, 0.16); ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 14; i++) { const x = 60 + i * 120 + rnd(i, 981) * 50, y = ridgeY(Math.min(x, 1300)) + 70 + rnd(i, 982) * 240; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 46, y - 18); ctx.stroke(); }
    ctx.restore();
    fg(); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
    pageFlag(ctx, TOP[0], TOP[1] + 4, 1, t, 3, true);
    // up they go, at a run: 橙子 first, then Ko, then 大肥鱼, who is finding it steep. On 一 they skip.
    [['f', -400, 290, 0.5], ['k', -200, 290, 0.25], ['o', 0, 320, 0]].forEach(([wk, dx, sz, ph]) => {
      const x = lead + dx, y = ridgeY(x) + 14, s = sq(t, there ? ARR : 143.62, 1.4), skip = 30 * Math.sin(sat(t, 143.62, 143.9) * Math.PI);
      char(ctx, there ? walkId(wk, t, ph) : runId(wk, t, ph), x, y, sz, { lift: there ? hopOn(t, ph, 18) : Math.abs(Math.sin((beatPhase(t) * 2 + ph) * Math.PI)) * 18 + skip, rot: there ? 0 : -0.08, sx: s.sx, sy: s.sy, windX: -8, flutter: 3 });
      if (wk === 'f') for (let i = 0; i < 2; i++) { const q = ((t * 1.6 + i * 0.5) % 1); ctx.strokeStyle = rgba('#3F6FD0', 1 - q); ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x - 70 - 30 * q, y - sz * 0.74 - 30 * q, 9, Math.PI * 0.9, Math.PI * 1.9); ctx.stroke(); }
    });
  });
  tomorrowPage(ctx, sat(t, 145.5, 145.8), sat(t, 145.8, 146.12));
  bokeh(ctx, t, { n: 8, seed: 175, alpha: 0.12, colors: [COL.white, COL.peach] });
  finish(ctx, { light: 0.7 });
}

// ================================================================== 2:21.4–2:26.9  下一页 · 下一页 (v8)
// The two pages before this (a bridge, then a mountain) had the camera running alongside them, and with only two
// drawings for a run the figures juddered. This one has nobody running at all. The three of them ride the paper plane
// that 在吗 was folded into in the first verse, across the front of a book as big as the sky; on each 页 a page turns
// under them and its draught lifts the plane. The pages are what they have written together: the sea and the bridge,
// the street and the stars, today in four hands. The last one is tomorrow, blank. On the long 页 the plane flies into it.
const SPREADS = [['海', '桥'], ['街', '星'], ['今天', '明天']], TURN = [142.0, 143.58], TD = 0.42, PNUM = [10479, 10481, 10483];
const SKY = ['#FFE3B8', '#FFF1DA', '#FFF7EA'];
function pageArt(ctx, side, key, num, t = 0, age = 99) {
  pagePath(ctx, side); ctx.fillStyle = '#FFFDF6'; ctx.fill();
  ctx.save(); pagePath(ctx, side); ctx.clip();
  let g = ctx.createLinearGradient(PX, 0, PX + side * 130, 0); g.addColorStop(0, 'rgba(90,60,30,0.32)'); g.addColorStop(1, 'rgba(90,60,30,0)');
  ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  g = ctx.createLinearGradient(PX + side * (PW - 100), 0, PX + side * PW, 0); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(1, 'rgba(90,60,30,0.11)');
  ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  const xl = side > 0 ? PX + 78 : PX - PW + 62, tw = PW - 140, cx = xl + tw / 2, blank = key === '明天';
  text(ctx, key, xl, PY + 106, { size: 60, weight: 800, align: 'left', color: blank ? COL.orange : COL.ink, ls: 4 });
  ctx.fillStyle = rgba(COL.ink, blank ? 0.14 : 0.38); ctx.fillRect(xl, PY + 154, tw, 2.5);
  text(ctx, `第 ${num} 页`, side > 0 ? xl + tw : xl, PY + PH - 36, { size: 22, weight: 500, align: side > 0 ? 'right' : 'left', color: COL.inkSoft, ls: 3, alpha: 1 - sat(t, 144.9, 145.4) });     // gone before the push brings it up beside the subtitle
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (key === '海') {
    for (let r = 0; r < 6; r++) { ctx.strokeStyle = ['#8DBBEE', '#6FA5E6', '#5A90DC', '#4A7FD0', '#3B6FC4', '#2F5DB4'][r]; ctx.lineWidth = 7; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const x = xl + (i / 40) * tw, y = PY + 345 + r * 46 + Math.sin(i * 0.7 + r * 1.3 - t * 3.2) * 12; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    text(ctx, '海水是咸的。', xl, PY + 212, { size: 42, weight: 600, align: 'left', ls: 4 });
    tick(ctx, xl + 318, PY + 212, 24, 1);
    text(ctx, '沙子会进鞋。', xl, PY + 272, { size: 42, weight: 700, align: 'left', color: COL.orangeD, ls: 4 });
  } else if (key === '桥') {
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(xl - 20, PY + 520); ctx.lineTo(xl + 40, PY + 520); ctx.lineTo(xl + 52, PY + 600); ctx.moveTo(xl + tw + 20, PY + 520); ctx.lineTo(xl + tw - 40, PY + 520); ctx.lineTo(xl + tw - 52, PY + 600); ctx.stroke();
    for (let r = 0; r < 4; r++) { ctx.strokeStyle = rgba('#3F6FD0', 0.75 - r * 0.12); ctx.lineWidth = 5; ctx.beginPath(); for (let i = 0; i <= 30; i++) { const x = xl + 40 + (i / 30) * (tw - 80), y = PY + 600 + r * 44 + Math.sin(i * 0.9 + r) * 8; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); }
    for (let i = 0; i < 8; i++) { const p = sat(age, 0.1 + i * 0.05, 0.28 + i * 0.05); if (p > 0) codeBlock(ctx, xl + 62 + i * 54, PY + 498 - (1 - E.out(p)) * 120, 50, 34, { lw: 2.5, alpha: Math.min(1, p * 3) }); }
    ctx.fillStyle = '#57C297'; rrect(ctx, xl + 30, PY + 300, 300, 26, 13); ctx.fill(); ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, '100%', xl + 350, PY + 314, { size: 32, weight: 800, align: 'left', color: '#17835A', fam: '"Noto Sans SC"' });
    tick(ctx, xl + 470, PY + 313, 18, 1, '#2FA676');
  } else if (key === '街') {
    ctx.strokeStyle = COL.orangeD; ctx.lineWidth = 9; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, S = (a, b) => { const x = clamp((u - a) / (b - a)); return x * x * (3 - 2 * x); }; const x = xl + u * tw, y = PY + 300 + 12 * Math.sin(u * 9) + 60 * S(0.36, 0.56) - 40 * S(0.7, 0.95); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    [[0.06, 0], [0.22, 1], [0.38, 2], [0.6, 0], [0.76, 1], [0.92, 2]].forEach(([u, c], i) => {
      const S = (a, b) => { const x = clamp((u - a) / (b - a)); return x * x * (3 - 2 * x); }, x = xl + u * tw, y = PY + 300 + 12 * Math.sin(u * 9) + 60 * S(0.36, 0.56) - 40 * S(0.7, 0.95);
      const up = 0.1 + 0.9 * E.back(sat(age, 0.05 + i * 0.08, 0.35 + i * 0.08));          // a pop-up: flat until the page is open, then it stands
      ctx.save(); ctx.translate(x, y - 14); ctx.scale(0.3, 0.3 * up); ctx.translate(0, -GY); house(ctx, 0, 220, 200 + (i % 3) * 30, ['#F4B67A', '#8FD3B4', '#9DBEF0'][c], 1, 0); ctx.restore();
    });
    flower(ctx, xl + 40, PY + 372, 20, 0.3, COL.orange); flower(ctx, xl + 440, PY + 398, 18, 1.2, COL.yellow);
    text(ctx, '写歪的那一笔', xl + tw, PY + 112, { size: 30, weight: 600, align: 'right', color: COL.inkSoft, ls: 3 });
  } else if (key === '星') {
    CON.forEach((C, ci) => {
      const ox = xl + [130, 380, 250][ci], oy = PY + [330, 360, 600][ci], k = 0.62;
      const col = ['#EE7A2E', '#2FA676', '#3F6FD0'][ci], t0 = 0.1 + ci * 0.25, ln = sat(age, t0 + 0.3, t0 + 0.7);          // they come out one by one, then join up
      ctx.strokeStyle = rgba(COL.ink, 0.5); ctx.lineWidth = 2.5;
      if (ln > 0) for (const [a, b] of C.edges) { const A = [ox + C.pts[a][0] * k, oy + C.pts[a][1] * k], B = [ox + C.pts[b][0] * k, oy + C.pts[b][1] * k]; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(lerp(A[0], B[0], ln), lerp(A[1], B[1], ln)); ctx.stroke(); }
      C.pts.forEach(([x, y], j) => {
        const p = sat(age, t0 + j * 0.035, t0 + j * 0.035 + 0.2); if (p <= 0) return;
        const X = ox + x * k, Y = oy + y * k, r = (j === 0 ? 20 : 15) * E.back(p);
        if (p < 1) { const gg = ctx.createRadialGradient(X, Y, 0, X, Y, 46); gg.addColorStop(0, rgba(col, 0.45 * (1 - p))); gg.addColorStop(1, rgba(col, 0)); ctx.fillStyle = gg; ctx.fillRect(X - 46, Y - 46, 92, 92); }
        star4(ctx, X, Y, r, col, 1);
      });
    });
  } else if (key === '今天') {
    for (let r = 0; r < 11; r++) {
      const c = [COL.ink, COL.orange, '#2FA676', '#3F6FD0'][r % 4], len = tw * (0.45 + 0.5 * rnd(r, 951)) * sat(age, 0.05 + r * 0.075, 0.32 + r * 0.075);          // written as you watch, a line each, in four hands
      if (len < 2) continue;
      ctx.strokeStyle = rgba(c, 0.85); ctx.lineWidth = 4; ctx.beginPath();
      for (let x = 0; x <= len; x += 5) { const y = PY + 230 + r * 50 + Math.sin(x * 0.21 + r * 2) * 6 * (0.5 + 0.5 * Math.sin(x * 0.043 + r)) + Math.sin(x * 0.57 + r) * 3; if (x) ctx.lineTo(xl + x, y); else ctx.moveTo(xl + x, y); }
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = rgba(COL.ink, 0.1); for (let r = 0; r < 12; r++) ctx.fillRect(xl, PY + 228 + r * 46, tw, 1.5);
  }
  ctx.restore();
  pagePath(ctx, side); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
}
function bigBook(ctx, t) {
  const cov = () => rrect(ctx, PX - PW - 34, PY - 16, PW * 2 + 68, PH + 62, 24);
  ctx.save(); ctx.shadowColor = 'rgba(50,30,10,0.38)'; ctx.shadowBlur = 70; ctx.shadowOffsetY = 34; cov(); ctx.fillStyle = '#5A3320'; ctx.fill(); ctx.restore();
  cov(); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.save(); ctx.setLineDash([10, 9]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,220,170,0.45)'; rrect(ctx, PX - PW - 22, PY - 5, PW * 2 + 44, PH + 40, 16); ctx.stroke(); ctx.restore();
  for (let k = 5; k >= 1; k--) for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * k * 3.2, k * 3.4); pagePath(ctx, side); ctx.fillStyle = k % 2 ? '#F1E7D2' : '#E6DAC2'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(COL.ink, 0.45); ctx.stroke(); ctx.restore(); }
  let done = 0, cur = -1, cp = 0;
  TURN.forEach((T, i) => { if (t >= T + TD) done = i + 1; else if (t >= T) { cur = i; cp = (t - T) / TD; } });
  const L = cur >= 0 ? cur : done, R = cur >= 0 ? cur + 1 : done, OPEN = [141.4, TURN[0] + TD, TURN[1] + TD];
  pageArt(ctx, -1, SPREADS[L][0], PNUM[L], t, t - OPEN[L]); pageArt(ctx, 1, SPREADS[R][1], PNUM[R] + 1, t, t - OPEN[R]);
  if (cur >= 0) {                                  // the leaf in the air
    const c = Math.cos(E.io(cp) * Math.PI), sn = Math.sin(E.io(cp) * Math.PI), side = c >= 0 ? 1 : -1, w = Math.max(0.02, Math.abs(c));
    ctx.save(); pagePath(ctx, -side); ctx.clip();
    const sh = ctx.createLinearGradient(PX, 0, PX - side * (PW * 0.5), 0); sh.addColorStop(0, `rgba(50,30,10,${0.3 * sn})`); sh.addColorStop(1, 'rgba(50,30,10,0)');
    ctx.fillStyle = sh; ctx.fillRect(PX - PW, PY - 40, PW * 2, PH + 90); ctx.restore();
    ctx.save(); ctx.translate(PX, 0); ctx.transform(w, -0.13 * sn * side, 0, 1, 0, 0); ctx.translate(-PX, 0);
    if (side > 0) pageArt(ctx, 1, SPREADS[cur][1], PNUM[cur] + 1, t, 99); else pageArt(ctx, -1, SPREADS[cur + 1][0], PNUM[cur + 1], t, -1);
    pagePath(ctx, side); ctx.fillStyle = `rgba(60,40,20,${0.34 * (1 - w)})`; ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX, PY + 18); ctx.lineTo(PX, PY + PH + 18); ctx.stroke();
  const sway = Math.sin(t * 1.4) * 5;              // ribbon marker
  const RX = PX + 330; ctx.beginPath(); ctx.moveTo(RX, PY + PH + 30); ctx.lineTo(RX + 24, PY + PH + 30); ctx.lineTo(RX + 28 + sway, PY + PH + 100); ctx.lineTo(RX + 15 + sway, PY + PH + 85); ctx.lineTo(RX + 2 + sway, PY + PH + 100); ctx.closePath();
  ctx.fillStyle = COL.orange; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.stroke();
}
function puff(ctx, x, y, r, a) {                   // a cut-paper cloud
  ctx.save(); ctx.globalAlpha *= a;
  cut(ctx, () => { ctx.beginPath(); ctx.arc(x - r * 0.9, y, r * 0.62, 0, TAU); ctx.arc(x, y - r * 0.36, r * 0.85, 0, TAU); ctx.arc(x + r, y, r * 0.66, 0, TAU); ctx.rect(x - r * 0.9, y, r * 1.9, r * 0.6); }, COL.white, 0.14, 20, 8);
  ctx.restore();
}
// the plane in its own coordinates: nose at (+380, 0), 760 long; seats along the top edge
const TOPY = xl => lerp(0, -52, (380 - xl) / 760);
function planeShape(ctx, t) { ctx.beginPath(); ctx.moveTo(380, 0); ctx.lineTo(-380, -52 + Math.sin(t * 13) * 3); ctx.lineTo(-344, 10); ctx.closePath(); }
function bigPlane(ctx, t, under) {
  ctx.lineJoin = 'round'; ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink;
  if (under) {                                     // the keel, with what it says on it
    ctx.beginPath(); ctx.moveTo(372, 4); ctx.lineTo(-352, 12); ctx.lineTo(-250, 92); ctx.closePath(); ctx.fillStyle = '#E9DCC2'; ctx.fill(); ctx.stroke();
    ctx.save(); ctx.translate(-150, 44); ctx.rotate(0.02); text(ctx, '在吗', 0, 0, { size: 46, weight: 800, color: COL.orangeD, ls: 6 }); ctx.restore();
    return;
  }
  ctx.save(); ctx.shadowColor = 'rgba(255,190,110,0.55)'; ctx.shadowBlur = 26; planeShape(ctx, t); ctx.fillStyle = COL.white; ctx.fill(); ctx.restore();
  planeShape(ctx, t); ctx.stroke();
  ctx.strokeStyle = rgba(COL.ink, 0.35); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(376, 2); ctx.lineTo(-360, -20); ctx.stroke();
}
const BASE = 770;
const cruise = t => { const v = t - 142.0; return [700 + 150 * E.io(sat(t, 142.0, 143.9)) + 40 * Math.sin(v * 2.4), BASE - 30 * Math.sin(v * 1.9) + 8 * Math.sin(v * 4.1)]; };
function flightPath(t) {                           // where the plane is, how big, and how it is tilted
  const S0 = 0.82;
  let x, y, s = S0, rot = -0.04 + Math.sin(t * 2.1) * 0.025;
  if (t < 142.0) { const u = E.out(sat(t, 141.4, 142.0)); x = lerp(-520, 700, u); y = lerp(880, BASE, u); }
  else { [x, y] = cruise(t); rot += -0.04 * Math.cos((t - 142.0) * 1.9); }
  for (const T of TURN) { const g = Math.sin(sat(t, T + 0.08, T + 0.9) * Math.PI); y -= 70 * g; rot -= 0.1 * g; }     // the draught off the turning page
  const d = sat(t, 143.95, 145.15);                // and into tomorrow
  if (d > 0) {
    const p0 = cruise(143.95), c1 = [1280, 300], p1 = [1290, 560], u = E.io(d);
    const B = q => [(1 - q) * (1 - q) * p0[0] + 2 * (1 - q) * q * c1[0] + q * q * p1[0], (1 - q) * (1 - q) * p0[1] + 2 * (1 - q) * q * c1[1] + q * q * p1[1]];
    const a = B(Math.max(0, u - 0.01)), b = B(Math.min(1, u + 0.01)), m = B(u);
    x = lerp(x, m[0], sat(d, 0, 0.15)); y = lerp(y, m[1], sat(d, 0, 0.15)); s = lerp(S0, 0.03, E.in(d)); rot = lerp(rot, Math.atan2(b[1] - a[1], b[0] - a[0]) * 0.6, sat(d, 0, 0.3));
  }
  return { x, y, s, rot, gone: d >= 1 };
}
const RIDERS = [['f24', -250, 290], ['k22', -30, 290], ['o62', 190, 320]];
export function sFlyBook(ctx, t) {
  const F = flightPath(t), aim = E.io(sat(t, 145.0, 146.1));
  const drift = 40 * Math.sin((t - 141.4) * 0.9), C = { z: lerp(1.0 + 0.05 * sat(t, 141.4, 144.5), 1.32, aim), cx: lerp(960, PX + PW / 2, aim), cy: lerp(540, PY + PH / 2, aim), x: lerp(drift, 960 - (PX + PW / 2), aim), y: lerp(0, 540 - (PY + PH / 2), aim) };
  layer(ctx, t, C, 0.3, 77, () => {                // sky
    const g = ctx.createLinearGradient(0, -200, 0, H); g.addColorStop(0, SKY[0]); g.addColorStop(0.55, SKY[1]); g.addColorStop(1, SKY[2]);
    ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
    rays(ctx, 1700, 80, t * 0.4, 0.25, '#FFE9BF', 16);
    for (let i = 0; i < 6; i++) { const x = ((i * 420 - (t - 141) * 70) % 2520 + 2520) % 2520 - 300; puff(ctx, x, 120 + (i % 3) * 330, 70 + (i % 2) * 30, 0.7); }
  });
  layer(ctx, t, C, 1, 77, () => {
    bigBook(ctx, t);
    for (let i = 0; i < 5; i++) {                   // clouds going by between the book and the plane: we are flying
      const x = ((i * 560 - (t - 141) * 380) % 2800 + 2800) % 2800 - 400, y = [70, 985, 95, 1000, 60][i];          // along the top and bottom edges, clear of the pages
      puff(ctx, x, y, 60 + (i % 3) * 18, 0.85 * (1 - aim));
    }
    if (!F.gone) {
      ctx.save(); ctx.translate(F.x + 70 * F.s, F.y + 110 * F.s); ctx.rotate(F.rot); ctx.scale(F.s, F.s * 0.5);       // its shadow on the pages
      ctx.filter = 'blur(10px)'; planeShape(ctx, t); ctx.fillStyle = 'rgba(60,40,20,0.16)'; ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(F.x, F.y); ctx.rotate(F.rot); ctx.scale(F.s, F.s);
      for (let i = 0; i < 3; i++) {                  // wind off the tail
        const ph = ((t * 1.7 + i / 3) % 1); ctx.strokeStyle = rgba(COL.white, 0.9 * Math.sin(ph * Math.PI)); ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-390 - 80 * ph, -34 + i * 30); ctx.lineTo(-390 - 80 * ph - 160, -34 + i * 30 + 6); ctx.stroke();
      }
      bigPlane(ctx, t, true);
      RIDERS.forEach(([id, xl, sz], i) => char(ctx, id, xl, TOPY(xl) + 8, sz, { shadow: false, windX: -12, flutter: 5, sway: 1.3, t: t + i * 0.7 }));
      bigPlane(ctx, t, false);
      ctx.restore();
    }
    const gp = sat(t, 145.12, 145.5);               // where it went in
    if (gp > 0 && gp < 1) { star4(ctx, 1290, 560, 40 * Math.sin(gp * Math.PI), COL.orange, 1); ctx.strokeStyle = rgba(COL.orange, 0.7 * (1 - gp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(1290, 560, 20 + 160 * E.out(gp), 0, TAU); ctx.stroke(); }
  });
  for (let i = 0; i < 2; i++) {                    // and one or two right past the lens, out of focus, top and bottom
    const x = ((i * 1300 - (t - 141) * 900) % 2600 + 2600) % 2600 - 500;
    ctx.save(); ctx.filter = 'blur(14px)'; puff(ctx, x, i ? 1060 : -40, 200, 0.55 * (1 - aim)); ctx.restore();
  }
  bokeh(ctx, t, { n: 8, seed: 176, alpha: 0.1, colors: [COL.white, COL.peach] });
  finish(ctx, { light: 0.7 });
}
