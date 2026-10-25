// v2 §28/§29: 一直在 (139.60–144.59), the small climax (本人 10-23: 从根本上重设计 … 然后：设计不错但没有卡点；手机只写一，后面只写直，
// 然后完整一直在). Her answer to 好了吗 comes out of your phone into the world: through the outage the world had no echo, now it
// all gets one. Cut to the song (accompaniment onsets, the 0.4 s beat grid, and the band's stop):
//   139.97 一   band accent: your dark phone, and on the beat only one gold 一 on its screen; the glass ripples and the camera
//               punches in one step on each of the next two hits (140.37, 140.57)
//   140.74 直   inside the phone, deep water looking up: one gold 直 slams in and she shoots straight up behind it
//   141.05 在   the burst: 一直在 whole, she out of the phone into the sky, the city lit by a ring of light
//   141.57 … 142.77  the four beats after: the words rise into the sky, a ring and a pulse on each; she looks down (141.97),
//               leans and reaches to you (142.37); your hand comes up
//   143.0       the band stops: everything nearly stops with it — the two fingertips a finger apart, the light between them
//               breathing, the world quiet
//   144.32      the band comes back: the fingertips touch, the light bursts, white into 我还是那条大肥鱼 (144.59)
import { W, H, TAU, lerp, sat, E, rnd, sheet, frame, plate } from './core.js';
import { tipProp, glowWord } from '../common.js';
import { rgba } from '../lib.js';
import { panel, screen } from './sb9.js';
import * as L from './life.js';
import * as R11 from './sb11.js';

const FT = t => globalThis.__frameT ?? t;
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
// 在 is sung at 141.57 (vocal stem: 141.07–141.37 is 直's falling tail, 141.42–141.57 在's z, its vowel on the beat at 141.57)
const ONE = 139.97, HITS1 = [140.37, 140.57], ZHI = 140.74, ZAI = 141.57, BEATS = [141.97, 142.37, 142.77, 143.17];
const LOOK = 142.37, REACH = 142.77, STOP = 143.0, BACK = 144.32, END = 144.59;
const CLOSE_SCR = [[668, 103], [977, 102], [985, 794], [660, 791]], WIDE_SCR = [[802, 649], [873, 649], [879, 820], [799, 822]];   // the phone (image px)
const PALM3 = [91, 330];                                                   // n_stay2 3: her open palm (frame px)
const shake = (t, t0, amp, dur) => (t >= t0 && t < t0 + dur ? [Math.sin((t - t0) * 83) * amp * (1 - (t - t0) / dur), Math.cos((t - t0) * 71) * amp * (1 - (t - t0) / dur)] : [0, 0]);
const punch = (t, t0, a, dur = 0.09) => a * E.out(sat(t, t0, t0 + dur));  // a step on a hit
const pulse = (t, list, dur = 0.25) => list.reduce((m, t0) => (t >= t0 && t - t0 < dur ? Math.max(m, 1 - (t - t0) / dur) : m), 0);
const hold = t => (t < STOP ? t : t < BACK ? STOP + (t - STOP) * 0.12 : STOP + (BACK - STOP) * 0.12 + (t - BACK));   // time nearly stops while the band does
const yzz = (ctx, i, x, y, sc, a = 1) => { if (sheet('fx_yzz')) frame(ctx, 'fx_yzz', i, x, y, sc, { anchor: 'body', alpha: a });
  else { ctx.save(); ctx.globalAlpha *= a; glowWord(ctx, '一直在'[i % 3], x, y, 460 * sc, { color: i >= 3 ? '#FFFFFF' : '#FFE36B', stroke: '#1E3A8A', glow: 'rgba(255,220,140,0.95)' }); ctx.restore(); } };

// ---------------------------------------------------------------- 一 (139.60–140.74): your phone, only 一 on it
function phoneScreen(x, sw, sh, t) {
  const g = x.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#071027'); g.addColorStop(1, '#0D1E45'); x.fillStyle = g; x.fillRect(0, 0, sw, sh);
  const u = sat(t, ONE, ZHI);                                              // light coming up from deep inside
  const r = x.createRadialGradient(sw / 2, sh * lerp(0.95, 0.55, u), 0, sw / 2, sh * lerp(0.95, 0.55, u), sh * (0.25 + 0.5 * u));
  r.addColorStop(0, rgba('#BFE9FF', 0.15 + 0.65 * u * u)); r.addColorStop(1, 'rgba(120,200,255,0)'); x.fillStyle = r; x.fillRect(0, 0, sw, sh);
  if (t < ONE) { x.fillStyle = rgba('#9CA3AF', 0.35 + 0.35 * Math.max(0, Math.sin(t * 7))); [0, 1, 2].forEach(k => { x.beginPath(); x.arc(sw / 2 - 40 + k * 40, sh / 2, 10, 0, TAU); x.fill(); }); return; }   // …
  const p = E.back(sat(t, ONE, ONE + 0.12)), s = sw * 0.86 / 473 * lerp(1.8, 1, p);
  const gg = x.createRadialGradient(sw / 2, sh / 2, 0, sw / 2, sh / 2, sw * 0.7); gg.addColorStop(0, rgba('#FFE7A0', 0.55)); gg.addColorStop(1, 'rgba(255,220,140,0)'); x.fillStyle = gg; x.fillRect(0, 0, sw, sh);
  yzz(x, 0, sw / 2, sh / 2, s, Math.min(1, p * 1.5));
}
function shotPhone(ctx, t) {
  const back = E.out(sat(t, 139.6, ONE - 0.02));
  const z = lerp(1.5, 1.0, back) + punch(t, ONE, 0.1) + punch(t, HITS1[0], 0.09) + punch(t, HITS1[1], 0.09) + 0.22 * E.in(sat(t, 140.6, ZHI));
  const [hx, hy] = shake(t, ONE, 10, 0.25), o = { z, fx: lerp(0.491, 0.5, back) * 0 + 0.494, fy: 0.476 };
  ctx.save(); ctx.translate(hx + Math.sin(t * 2.1) * 3, hy + Math.cos(t * 1.7) * 2);
  const M = panel(ctx, 0, W, 'p_bal_close', o); if (!M) { ctx.restore(); return; }
  screen(ctx, M, 'p_bal_close', CLOSE_SCR, 600, 1300, (x, sw, sh) => phoneScreen(x, sw, sh, t), '#071027');
  const [cx, cy] = M.pt(822, 448), Q = CLOSE_SCR.map(p => M.pt(...p));
  ctx.save(); ctx.beginPath(); Q.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p))); ctx.closePath(); ctx.clip();
  for (const t0 of [ONE, ...HITS1]) { const d = t - t0; if (d < 0 || d > 0.7) continue;      // the glass ripples on each hit
    for (const k of [0, 0.12]) { const e = sat(d - k, 0, 0.6); if (e <= 0) continue; ctx.strokeStyle = rgba('#FFF2C8', 0.8 * (1 - e)); ctx.lineWidth = 6 * (1 - e) + 1;
      ctx.beginPath(); ctx.ellipse(cx, cy, 30 + e * 360 * M.s, 18 + e * 200 * M.s, 0, 0, TAU); ctx.stroke(); } }
  ctx.restore();
  if (t >= ONE) { const u = sat(t, ONE, ZHI); glow(ctx, cx, cy, 420 * M.s, '#FFE7A0', 0.25 + 0.4 * u + 0.35 * pulse(t, [ONE, ...HITS1]));
    for (let k = 0; k < 16; k++) { const d = ((t - ONE) * 1.1 + rnd(k, 1)) % 1; glow(ctx, cx + (rnd(k, 2) - 0.5) * 320 * M.s, cy + 300 * M.s - d * 800 * M.s, 16, '#FFF2C8', 0.8 * Math.sin(d * Math.PI)); } }
  ctx.restore();
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * E.in(sat(t, ZHI - 0.05, ZHI))); ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- 直 (140.74–141.05): inside, only 直
function shotDive(ctx, t) {
  const u = sat(t, ZHI, ZAI), [sx, sy] = shake(t, ZHI, 16, 0.31);
  ctx.save(); ctx.translate(sx, sy);
  panel(ctx, 0, W, 'p_deep_up', { z: 1.12 + 0.1 * u, fx: 0.5, fy: lerp(0.62, 0.4, u) });
  const st = 1 + 0.16 * Math.exp(-16 * (t - ZHI)) + 0.05 * u;             // 直: full strength on its own frame, held, slowly growing
  const y = lerp(H + 380, -260, E.in(u)), h = 760;                        // she comes up from the deep, faster and faster, and breaks the surface on 在
  ctx.save(); ctx.globalCompositeOperation = 'screen';                     // her straight line of light, and speed
  const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, rgba('#FFF6D8', 0.95)); g.addColorStop(1, rgba('#9FE0FF', 0.1));
  ctx.fillStyle = g; ctx.fillRect(W / 2 - 30, y - h * 0.4, 60, H - y + h * 0.4);
  for (let k = 0; k < 26; k++) { const x = rnd(k, 3) * W, l = 160 + rnd(k, 4) * 360, yy = ((rnd(k, 5) * H + (t - ZHI) * 5200) % (H + l)) - l;
    ctx.fillStyle = rgba('#DFF4FF', 0.25 + 0.35 * rnd(k, 6)); ctx.fillRect(x, H - yy - l, 3 + 3 * rnd(k, 7), l); }
  ctx.restore();
  L.put(ctx, 'n_stay2', 0, W / 2, y + h * 0.5, h);
  glow(ctx, W / 2, H / 2, 600, '#FFE7A0', 0.35 + 0.25 * u);
  yzz(ctx, 1, W / 2, H / 2, 1.05 * st);                                  // in front of her as she passes behind it
  ctx.restore();
  ctx.fillStyle = rgba('#FFFFFF', 0.95 * E.in(sat(t, ZAI - 0.06, ZAI))); ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- 在 (141.05–144.59): out into the world
function rays(ctx, x, y, a, t) {
  if (a <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y);
  for (let k = 0; k < 18; k++) { ctx.save(); ctx.rotate(k / 18 * TAU + t * 0.12); const L2 = 1500;
    const g = ctx.createLinearGradient(0, 0, L2, 0); g.addColorStop(0, rgba('#FFF2C8', 0.35 * a)); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(L2, -60 - (k % 3) * 30); ctx.lineTo(L2, 60 + (k % 3) * 30); ctx.lineTo(0, 8); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function shotWorld(ctx, t) {
  const ft = FT(t), d = t - ZAI, th = hold(t);                             // th: the time things move by (it nearly stops while the band does)
  const rise = E.out(sat(d, 0.0, 0.45)), tilt = E.io(sat(t, ZAI, BEATS[1])), push = E.io(sat(t, REACH, END)), lean = E.io(sat(t, REACH, STOP));
  const quiet = sat(t, STOP, STOP + 0.25) * (1 - sat(t, BACK, BACK + 0.05)), bp = pulse(t, BEATS, 0.3);
  const [shx, shy] = t < BACK ? shake(t, ZAI, 34, 0.6) : shake(t, BACK, 30, 0.35);
  const o = { z: lerp(1.2, 1.06, tilt) + 0.3 * push + 0.015 * bp, fx: 0.5, fy: lerp(lerp(0.66, 0.42, tilt), 0.55, push) };
  ctx.save(); ctx.translate(shx, shy);
  const M = panel(ctx, 0, W, 'p_bal_wide', o); if (!M) { ctx.restore(); return; }
  const [px, py] = M.pt(840, 735), [ptx, pty] = M.pt(840, 649), [sunx, suny] = M.pt(838, 300);
  // the city lights up behind rings of light: one on 在, one on each beat after it
  const RINGS = [ZAI, ...BEATS], reach = Math.max(0, ...RINGS.map(t0 => (t >= t0 ? E.out(sat(t, t0, t0 + 0.9)) * (900 + 600 * RINGS.indexOf(t0)) : 0)));
  if (reach > 1) { ctx.save(); ctx.beginPath(); ctx.ellipse(px, py, reach * 1.6, reach * 0.8, 0, 0, TAU); ctx.clip(); panel(ctx, 0, W, 'p_bal_wide_lit', o); ctx.restore(); }
  RINGS.forEach((t0, i) => { const dd = t - t0; if (dd < 0 || dd > 0.9) return; const r = E.out(dd / 0.9) * (900 + 600 * i);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFF2C8', 0.85 * (1 - dd / 0.9)); ctx.lineWidth = 24 * (1 - dd / 0.9) + 3;
    ctx.beginPath(); ctx.ellipse(px, py, Math.max(1, r * 1.6), Math.max(1, r * 0.8), 0, 0, TAU); ctx.stroke(); ctx.restore(); });
  glow(ctx, sunx, suny, 1000, '#FFD9A0', (0.3 + 0.35 * sat(d, 0, 1.2)) * (1 - 0.5 * quiet));
  screen(ctx, M, 'p_bal_wide', WIDE_SCR, 600, 1300, (x, sw, sh) => { x.fillStyle = '#FFF6D8'; x.fillRect(0, 0, sw, sh);      // your phone: 一直在, whole, top to bottom
    [0, 1, 2].forEach(i => yzz(x, i, sw / 2, sh * (0.22 + 0.28 * i), sw * 0.62 / 496)); }, '#FFF6D8');
  glow(ctx, ptx, pty + 60 * M.s, 260 * M.s, '#FFF6D8', 0.7 * Math.exp(-1.5 * Math.max(0, d)) + 0.25);
  // her: out of the phone into the sky; she looks down on a beat, and on the next leans down and reaches to you
  const k = ft < LOOK ? 1 : ft < REACH ? 2 : 3, sh = sheet('n_stay2');
  const [hx, fyh] = M.pt(840, lerp(649, 604, rise)), hh = lerp(90, 600, rise) * (1 + 0.1 * push);
  const hy = fyh + Math.sin(th * 2) * 7 * rise + 90 * lean + bp * 6, hk = sh ? hh * sh.frames[k].h / sh.frames[1].h : hh;
  rays(ctx, hx, hy - hk * 0.55, (0.95 * sat(d, 0, 0.3) + 0.4 * bp) * (1 - 0.3 * lean) * (1 - 0.6 * quiet), th);
  if (sheet('fx_rise') && d < 1.9) { const fk = d < 0.04 ? 1 : d < 0.16 ? 2 : d < 0.52 ? 3 : d < 1.0 ? 4 : 5, colH = Math.max(200, pty - 30);
    frame(ctx, 'fx_rise', fk, ptx, pty + 20 * M.s, colH / 485 * (fk === 3 ? 1.25 : 1), { anchor: 'bottom', alpha: 1 - sat(d, 1.4, 1.9) }); }
  glow(ctx, hx, hy - hk * 0.5, hk * 1.1, '#FFF6D8', 0.4 * sat(d, 0, 0.3) * (1 - 0.5 * lean));
  L.put(ctx, 'n_stay2', k, hx, hy, hk);
  const dh = th - ZAI;
  for (let q = 0; q < 30; q++) { const dd = dh - rnd(q, 1) * 0.3; if (dd < 0 || dd > 1.6) continue;      // water falling off her (it hangs in the hush)
    const an = rnd(q, 2) * TAU, v = 320 + 560 * rnd(q, 3), x = hx + Math.cos(an) * v * dd, y = hy - hk * 0.5 + Math.sin(an) * v * dd * 0.6 + 520 * dd * dd;
    L.put(ctx, 'fx_drops', [0, 1, 13, 15][q % 4], x, y, 22 + 24 * rnd(q, 4), { anchor: 'body', alpha: 1 - dd / 1.6 }); }
  // your hand comes up; in the hush the fingertips hang a finger apart; on the band's return they touch
  const f3 = sh?.frames[3]; let meet = null;
  if (f3 && t >= REACH) {
    const sc = hk / f3.h; meet = [hx + (PALM3[0] - f3.ax) * sc, hy + (PALM3[1] - (f3.h - 3)) * sc];
    const up = E.out(sat(t, REACH + 0.05, STOP)), gap = t < BACK ? 46 : 46 * (1 - E.in(sat(t, BACK, BACK + 0.05)));
    tipProp(ctx, 'prop_hand_meet', meet[0] - 4, lerp(H + 300, meet[1] + 8 + gap, up), 700 * (1 + 0.25 * push), { rot: Math.PI / 2 });
    if (t >= STOP && t < BACK + 0.05) { const br = 0.5 + 0.5 * Math.sin((t - STOP) * 5.5);       // the light between them, breathing
      glow(ctx, meet[0], meet[1] + gap / 2 + 8, 90 + 40 * br, '#FFF6D8', 0.45 + 0.35 * br); }
  }
  ctx.restore();
  if (quiet > 0) { ctx.save(); const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(10,14,30,0)'); v.addColorStop(1, rgba('#0A0E1E', 0.55 * quiet));
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); ctx.restore(); }                       // the hush: the edges darken, only the two hands
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * Math.exp(-8 * Math.max(0, d))); ctx.fillRect(0, 0, W, H);       // the burst out of the phone, on 在 (under the words)
  // 一直在, whole, on 在: full strength on the very frame 在 is sung (本人 10-23: 和在这个字出现的时候卡点), a hard stamp that
  // overshoots and settles; up into the sky on the next beat; a pulse on each beat after
  const up2 = E.io(sat(t, BEATS[0], BEATS[0] + 0.3)), hot = t >= BACK ? E.out(sat(t, BACK, BACK + 0.15)) : 0, p = 1, stamp = 1 + 0.16 * Math.exp(-16 * Math.max(0, d));
  [0, 1, 2].forEach(i => {
    const sc = lerp(1.0, 0.34, up2) * (1 + 0.08 * bp) * stamp, x = W / 2 + (i - 1) * lerp(560, 200, up2), y = lerp(H * 0.66, 92, up2) - 90 * push;
    yzz(ctx, i, x, y, sc, Math.min(1, p * 1.6) * (1 - 0.4 * quiet)); if (hot > 0) yzz(ctx, i + 3, x, y, sc * 1.02, hot);
  });
  if (t - ZAI < 0.45) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFF2C8', 0.85 * (1 - (t - ZAI) / 0.45)); ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.66, 300 + (t - ZAI) * 1600, 0, TAU); ctx.stroke(); ctx.restore(); }
  if (meet && t >= BACK) {                                                 // the touch, on the band's return
    const dt = t - BACK, [mx, my] = [meet[0] + shx, meet[1] + shy];
    rays(ctx, mx, my, 1.6 * Math.exp(-1.2 * dt) + 0.4, t * 3);
    const r = 40 + E.out(sat(dt, 0, 0.5)) * 1300;
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.9 * (1 - sat(dt, 0, 0.5))); ctx.lineWidth = 22 * (1 - sat(dt, 0, 0.5)) + 2; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.stroke(); ctx.restore();
    glow(ctx, mx, my, 520, '#FFF6D8', 0.95 * Math.exp(-2 * dt) + 0.4);
    for (let q = 0; q < 22; q++) { const an = rnd(q, 11) * TAU, v = 400 + rnd(q, 12) * 1100, x = mx + Math.cos(an) * v * dt, y = my + Math.sin(an) * v * dt - 60 * dt * dt;
      L.put(ctx, 'n_newyear', 5, x, y, 70 + 60 * rnd(q, 13), { anchor: 'body' }); }
  }
  ctx.fillStyle = rgba('#FFFFFF', 0.95 * E.in(sat(t, BACK + 0.06, END))); ctx.fillRect(0, 0, W, H);    // white into the last chorus
}

// ---------------------------------------------------------------- §30 (本人 10-23: 在的后半段大肥鱼要变大、有视觉冲击力；2:21–2:23 一直一样，单调):
// a new shot on each beat, each bigger: 141.57 the hero shot from below, arms wide against the sun, 一直在 down the sky beside her;
// 141.97 her face, filling the frame, looking down at you; 142.37 she reaches out to you, her hand coming at the camera, yours
// coming up; 142.77 the camera steps in on the two hands; the hush; on the band's return they touch.
const HERO = 141.97, FACE = 142.37, REACH_T = 142.77, PUSH = 142.77;
const REACH_PALM = [270, 880];                                             // n_stay_reach: her open palm (image px)
function fig(ctx, id, ix, iy, x, y, s, o = {}) {                           // a big single drawing: its image point (ix, iy) at (x, y), s screen px per image px
  const im = plate(id); if (!im) return;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; if (o.filter) ctx.filter = o.filter; ctx.drawImage(im, x - ix * s, y - iy * s, im.width * s, im.height * s); ctx.restore();
}
function cutIn(ctx, t, t0) {                                               // every cut lands with a flash
  ctx.fillStyle = rgba('#FFFFFF', 0.6 * Math.exp(-14 * Math.max(0, t - t0))); ctx.fillRect(0, 0, W, H);
}
function shotHero(ctx, t) {
  const d = t - HERO, [sx, sy] = shake(t, HERO, 20, 0.28), bounce = 1 - E.out(sat(d, 0, 0.18));
  ctx.save(); ctx.translate(sx, sy);
  panel(ctx, 0, W, 'p_bal_wide_lit', { z: 1.45 + 0.05 * sat(d, 0, 0.4), fx: 0.5, fy: 0.27 });
  glow(ctx, W / 2, H * 0.42, 900, '#FFE2A8', 0.55);                        // the sun right behind her
  rays(ctx, W / 2, H * 0.42, 1.0, t * 1.5);
  const s = 0.8 * (1 + 0.1 * bounce), y = H * 0.53 - 30 * sat(d, 0, 0.4);
  fig(ctx, 'n_stay_hero', 600, 650, W / 2, y, s);
  for (let q = 0; q < 24; q++) { const dd = d + rnd(q, 1) * 0.3; const an = rnd(q, 2) * TAU, v = 260 + 420 * rnd(q, 3);   // water off her
    L.put(ctx, 'fx_drops', [0, 1, 13, 15][q % 4], W / 2 + Math.cos(an) * v * dd, y + Math.sin(an) * v * dd * 0.6 + 400 * dd * dd, 26 + 26 * rnd(q, 4), { anchor: 'body', alpha: 1 - sat(dd, 0.4, 0.7) }); }
  [0, 1, 2].forEach(i => {                                                 // 一 直 在 down the sky, a column of calligraphy
    yzz(ctx, i, 300, 210 + i * 320, 0.62 * (1 + 0.12 * Math.exp(-16 * d))); });      // all three at once on the cut (在 is already sung)
  const r = E.out(sat(d, 0, 0.4));
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFF2C8', 0.8 * (1 - r)); ctx.lineWidth = 20 * (1 - r) + 3; ctx.beginPath(); ctx.arc(W / 2, H * 0.42, 200 + r * 1100, 0, TAU); ctx.stroke(); ctx.restore();
  ctx.restore();
  cutIn(ctx, t, HERO);
}
function shotFace(ctx, t) {
  const d = t - FACE, [sx, sy] = shake(t, FACE, 14, 0.22), bounce = 1 - E.out(sat(d, 0, 0.16));
  ctx.save(); ctx.translate(sx, sy);
  panel(ctx, 0, W, 'p_bal_wide_lit', { z: 1.9, fx: 0.5, fy: 0.33, filter: 'blur(9px)' });
  glow(ctx, W / 2, H * 0.45, 1000, '#FFE2A8', 0.5);
  rays(ctx, W / 2, H * 0.3, 0.7, t);
  const s = (1.0 + 0.05 * sat(d, 0, 0.4)) * (1 + 0.08 * bounce);
  fig(ctx, 'n_stay_face', 627, 540, W / 2, 545, s);
  for (let q = 0; q < 18; q++) { const u = (d * 0.7 + rnd(q, 5)) % 1;       // light motes drifting past her face
    glow(ctx, rnd(q, 6) * W, H - u * H * 1.1, 14 + 18 * rnd(q, 7), '#FFF2C8', 0.8 * Math.sin(u * Math.PI)); }
  ctx.restore();
  cutIn(ctx, t, FACE);
}
function shotReach(ctx, t) {
  const d = t - REACH_T, quiet = sat(t, STOP, STOP + 0.25) * (1 - sat(t, BACK, BACK + 0.05)), th = hold(t);
  const [sx, sy] = t < BACK ? shake(t, REACH_T, 16, 0.25) : shake(t, BACK, 30, 0.35), bounce = 1 - E.out(sat(d, 0, 0.16));
  const s = 0.78 * (1 + 0.06 * bounce), cx = W / 2 + 120, cy = H / 2 + 20 + Math.sin(th * 2) * 6;
  const palm = [cx + (REACH_PALM[0] - 640) * s, cy + (REACH_PALM[1] - 640) * s];
  const Z = 1 + 0.3 * E.io(sat(t, REACH_T + 0.1, STOP + 0.35)) + 0.06 * sat(t, STOP, BACK);      // in on the hands, slowly
  const fr = E.io(sat(t, REACH_T + 0.1, STOP + 0.35)), aim = [lerp(palm[0], W * 0.47, fr), lerp(palm[1], H * 0.56, fr)];      // the hands come to the middle as it closes in
  ctx.save(); ctx.translate(sx, sy); ctx.translate(aim[0], aim[1]); ctx.scale(Z, Z); ctx.translate(-palm[0], -palm[1]);
  panel(ctx, 0, W, 'p_bal_wide_lit', { z: 1.5, fx: 0.5, fy: 0 });        // sky and skyline only: the painted hand and phone stay below the frame
  glow(ctx, W * 0.55, H * 0.35, 900, '#FFE2A8', 0.4 * (1 - 0.5 * quiet));
  rays(ctx, cx, cy - 200, 0.6 * (1 - 0.6 * quiet), th);
  if (t >= PUSH && t < PUSH + 0.9) { const r = E.out(sat(t, PUSH, PUSH + 0.9));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFF2C8', 0.8 * (1 - r)); ctx.lineWidth = 18 * (1 - r) + 3; ctx.beginPath(); ctx.arc(palm[0], palm[1], 120 + r * 1100, 0, TAU); ctx.stroke(); ctx.restore(); }
  fig(ctx, 'n_stay_reach', 640, 640, cx, cy, s);
  const up = E.out(sat(t, REACH_T, STOP)), gap = t < BACK ? 40 : 40 * (1 - E.in(sat(t, BACK, BACK + 0.05)));      // your hand comes up to hers
  tipProp(ctx, 'prop_hand_meet', palm[0] + 10, lerp(H + 320, palm[1] + 20 + gap, up), 640, { rot: Math.PI / 2 });
  if (t >= STOP && t < BACK + 0.05) { const br = 0.5 + 0.5 * Math.sin((t - STOP) * 5.5); glow(ctx, palm[0], palm[1] + gap / 2 + 20, 80 + 40 * br, '#FFF6D8', 0.5 + 0.35 * br); }
  ctx.restore();
  if (quiet > 0) { const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.95); v.addColorStop(0, 'rgba(10,14,30,0)'); v.addColorStop(1, rgba('#0A0E1E', 0.6 * quiet)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }
  const bp = pulse(t, [REACH_T], 0.3), hot = t >= BACK ? E.out(sat(t, BACK, BACK + 0.15)) : 0;        // 一直在, settled in the sky
  const ty = lerp(95, -90, E.io(sat(t, REACH_T + 0.1, STOP + 0.35)));               // up and out of frame as the camera closes in on the hands
  [0, 1, 2].forEach(i => { const x = W / 2 + (i - 1) * 200; yzz(ctx, i, x, ty, 0.34 * (1 + 0.1 * bp), 1 - 0.4 * quiet); });
  if (t >= BACK) {                                                         // the touch
    const dt = t - BACK, mx = aim[0] + sx, my = aim[1] + sy + 20 * Z;
    rays(ctx, mx, my, 1.6 * Math.exp(-1.2 * dt) + 0.4, t * 3);
    const r = 40 + E.out(sat(dt, 0, 0.5)) * 1300;
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.9 * (1 - sat(dt, 0, 0.5))); ctx.lineWidth = 22 * (1 - sat(dt, 0, 0.5)) + 2; ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.stroke(); ctx.restore();
    glow(ctx, mx, my, 520, '#FFF6D8', 0.95 * Math.exp(-2 * dt) + 0.4);
    for (let q = 0; q < 22; q++) { const an = rnd(q, 11) * TAU, v = 400 + rnd(q, 12) * 1100, x = mx + Math.cos(an) * v * dt, y = my + Math.sin(an) * v * dt - 60 * dt * dt;
      L.put(ctx, 'n_newyear', 5, x, y, 70 + 60 * rnd(q, 13), { anchor: 'body' }); }
  }
  cutIn(ctx, t, REACH_T);
  ctx.fillStyle = rgba('#FFFFFF', 0.95 * E.in(sat(t, BACK + 0.06, END))); ctx.fillRect(0, 0, W, H);
}

export function shotStay2(ctx, t) {
  if (t < ZHI) return shotPhone(ctx, t);
  if (t < ZAI) return shotDive(ctx, t);
  if (t < HERO) return shotWorld(ctx, t);
  if (t < FACE) return shotHero(ctx, t);
  if (t < REACH_T) return shotFace(ctx, t);
  if (t < R11.HUSH) return shotReach(ctx, t);
  return R11.shotHush(ctx, t);                                             // §31: a close-up on each sung syllable of the hush
}
