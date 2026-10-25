// Full version, part 2 (song time): the second chorus as three, the bridge, and the last chorus up to where the
// preview cut's ending takes over.
import { W, H, TAU, clamp, lerp, sat, E, rnd, COL, mix, rgba, pulse, beatPhase, drawGlyph, text, measure, paper, rrect, caret, flower, MEMO } from './lib.js';
import { char, breathe, walkBob, bop } from './chars.js';
import { finish, bokeh, cam, cut } from './fx.js';
import { hit, sq, rays } from './scenes1.js';
import { TRI, cutGlyph, confetti, house, GY, jump, crouch, termWin, worldBack, drawObj, triBurst } from './scenes2.js';
import { PX, PY, PW, PH, pagePath } from './scenes3.js';
import { walkId, hopOn, stroke, bubble, roadPages, sprout, WHO, namedCaret, PENS, penTip, waveBands, SCENERY, sparkle, anchor, PT } from './scenes4.js';

const HC = ['#F4B67A', '#8FD3B4', '#9DBEF0'];
// the three with their pens, with 橙子 in the pose named
const pensWith = (o, k, f) => PENS.map(P => { const id = [o, k, f][P.c]; return id ? { ...P, id, tip: null } : P; });
const tipOf = (P, x, fy, s) => (P.tip ? penTip(P, x, fy, s) : anchor(P.id, x, fy, s, PT[P.id][0], PT[P.id][1]));
const TITLE = '世界还在写';
function blankPage(ctx, lines = 0.08) {
  ctx.fillStyle = COL.white; ctx.fillRect(-900, -900, W + 1800, H + 1800);
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 1.2); g.addColorStop(0, 'rgba(120,80,40,0)'); g.addColorStop(1, 'rgba(120,80,40,0.1)');
  ctx.fillStyle = g; ctx.fillRect(-900, -900, W + 1800, H + 1800);
  ctx.fillStyle = rgba(COL.ink, lines); for (let r = -3; r < 18; r++) ctx.fillRect(-900, 96 + r * 86, W + 1800, 2);
}
// a character in all three of their colours
function triGlyph(ctx, ch, x, y, size, o = {}) {
  for (let c = 0; c < 3; c++) { ctx.save(); ctx.beginPath(); const e = [-0.9, -1 / 6, 1 / 6, 0.9]; ctx.rect(x + e[c] * size, y - size, (e[c + 1] - e[c]) * size + 0.5, size * 2); ctx.clip(); cutGlyph(ctx, ch, x, y, size, TRI[c], o); ctx.restore(); }
}
function roadPage(ctx) {
  ctx.fillStyle = 'rgba(60,40,20,0.15)'; ctx.beginPath(); ctx.moveTo(-88, -20); ctx.lineTo(96, -20); ctx.lineTo(76, 36); ctx.lineTo(-108, 36); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-85, -26); ctx.lineTo(95, -26); ctx.lineTo(75, 26); ctx.lineTo(-105, 26); ctx.closePath();
  ctx.fillStyle = COL.white; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.fillStyle = rgba(COL.ink, 0.3); for (let k = 0; k < 3; k++) ctx.fillRect(-70 - k * 6, -14 + k * 13, 110, 4);
}
// a signpost with a nameplate nobody has filled in; carets = how many people are about to
function nameplate(ctx, x, t, p, n, beat = 0) {
  if (p <= 0) return;
  ctx.save(); ctx.translate(x, GY); ctx.scale(1, E.back(clamp(p)));
  ctx.fillStyle = COL.ink; ctx.fillRect(-5, -324, 10, 324);
  ctx.translate(0, -294); ctx.rotate(Math.sin(t * 1.6) * 0.012);
  cut(ctx, () => rrect(ctx, -40, -52, 290, 100, 14), COL.white, 0.22, 16, 6);
  rrect(ctx, -40, -52, 290, 100, 14); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
  const cs = n === 4 ? [COL.ink, ...WHO.map(w => w[0])] : WHO.map(w => w[0]);
  cs.forEach((c, i) => { const on = beat ? (Math.floor(beatPhase(t) * beat) % cs.length) === i : ((t + i * 0.29) % 0.86) < 0.5; if (on) { ctx.fillStyle = c; ctx.fillRect(-10 + i * (n === 4 ? 46 : 52), -30, 7, 56); } });
  ctx.restore();
}

// ------------------------------------------------------------------ 2:01–2:12  the same walk, as three
// 明天没有最后一页: a sign says 最后一页 until they reach it. 我从你们的昨天出发: what each of them has read streams
// overhead and on ahead. 走到还没有名字的街: it pours into three houses, and the nameplate is still empty.
const S2T0 = 121.14, S2V = 330, S2TD = 127.6, S2TS = 129.6;
const s2x = t => (t <= S2TD ? S2V * (t - S2T0) : S2V * (S2TD - S2T0) + S2V * (S2TS - S2TD) * (u => u - u * u / 2)(sat(t, S2TD, S2TS)));
const S2XS = s2x(S2TS);
const S2H = [[1300, 250, 270, HC[0], 129.11], [1562, 270, 330, HC[1], 129.36], [1808, 220, 280, HC[2], 129.98]];
const RCH = [MEMO.join('').replace(/[，。！？、]/g, ''), '{}();=>_/01<>[]+*', '～海。浪～泡°～水'];
const ribY = (x, t, i) => 290 + 62 * Math.sin(x * 0.006 - t * 2.2 + i * 2.09) + 24 * Math.sin(x * 0.014 + t * 1.3 + i);
export function sStreet2(ctx, t) {
  const camX = s2x(t), FX = 200, OX = 520, KX = 830, stopped = t >= S2TS, NAME = 130.66, FLIP = 123.19;
  const whip = E.in(sat(t, 132.05, 132.3)) * 2700;
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.02 + 0.03 * sat(t, S2T0, 132.3) + 0.02 * hit(t, NAME, 6), cx: W / 2, cy: GY, x: -whip, seed: 51 }, () => {
    worldBack(ctx, t, camX, true);
    for (let k = 0; k < 2; k++) for (const o of SCENERY) {
      const wx = o.x + 2600 * k; if (o.k !== 'cloud' && wx > S2XS + 880) continue;
      const sx = wx - camX * (o.k === 'cloud' ? 0.5 : 1); if (sx > -400 && sx < W + 400) drawObj(ctx, o, sx, 2, t);
    }
    // the sign
    const sgx = 1880 - camX, fl = sat(t, FLIP - 0.04, FLIP + 0.2), fc = Math.cos(fl * Math.PI);
    if (sgx > -300 && sgx < W + 300) {
      ctx.fillStyle = COL.ink; ctx.fillRect(sgx - 5, 520, 10, GY - 520);
      ctx.save(); ctx.translate(sgx, 470); ctx.rotate(Math.sin(t * 1.6) * 0.015); ctx.scale(Math.max(0.04, Math.abs(fc)), 1 + 0.14 * Math.sin(fl * Math.PI));
      cut(ctx, () => rrect(ctx, -160, -62, 320, 124, 14), COL.white, 0.22, 16, 6); rrect(ctx, -160, -62, 320, 124, 14); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
      if (fc > 0) text(ctx, '最后一页', 2, 2, { size: 56, weight: 800, ls: 6 });
      else {
        text(ctx, '下一页', -36, 2, { size: 56, weight: 800, ls: 6, color: COL.orangeD });
        ctx.strokeStyle = COL.orangeD; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(76, 2); ctx.lineTo(128, 2); ctx.moveTo(110, -14); ctx.lineTo(128, 2); ctx.lineTo(110, 18); ctx.stroke();
      }
      ctx.restore();
      sparkle(ctx, t, FLIP, sgx, 470, COL.orange, 10, 180, 260);
    }
    // three houses nobody has coloured in yet
    S2H.forEach(([hx, w, h, c, T]) => { const sx = S2XS + hx - camX; if (sx < W + 400) house(ctx, sx, w, h, c, sat(t, T, T + 0.45), t); });
    // the road of pages, laid as they come
    const reach = lerp(1480, 2400, sat(t, 127.8, 129.4));
    for (let i = Math.floor((camX - 300) / 190); ; i++) {
      const wxp = i * 190 - 60, sx = wxp - camX; if (sx > W + 300) break;
      const p = clamp((camX + reach - wxp) / 210); if (p <= 0) continue;
      const e = E.out(p);
      ctx.save(); ctx.translate(sx + 75, GY + 30 - (1 - e) * 320); ctx.rotate((1 - e) * 0.7 * (i % 2 ? 1 : -1)); ctx.globalAlpha = clamp(p * 3); roadPage(ctx); ctx.restore();
    }
    nameplate(ctx, S2XS + 1016 - camX, t, sat(t, NAME - 0.05, NAME + 0.25), 3);
    // what each of them set out from, going on ahead of them
    const ra = sat(t, 124.3, 125.0) * (1 - sat(t, 130.2, 130.9));
    if (ra > 0) for (let i = 0; i < 3; i++) {
      const hsx = S2XS + S2H[i][0] - camX, pour = sat(t, S2H[i][4] - 0.7, S2H[i][4]), roofY = GY - S2H[i][2] - S2H[i][1] * 0.42 + 30, str = RCH[i];
      for (let k = 0; k < 46; k++) {
        const run = k * 46 + t * 430 + i * 15, x = (run % 2116) - 100; if (x > hsx) continue;
        const b = clamp((x - (hsx - 520)) / 520), bl = pour * b * b * (3 - 2 * b), y = lerp(ribY(x, t, i), roofY, bl);
        drawGlyph(ctx, str[(Math.floor(run / 2116) * 46 + k) % str.length], x, y, 40, { weight: 700, color: TRI[i], alpha: ra * sat(x, -100, 60) * sat(W + 80 - x, 0, 160), rot: Math.cos(x * 0.006 - t * 2.2 + i * 2.09) * 0.35 });
      }
    }
    const fa = sat(t, 124.5, 125.0) * (1 - sat(t, 127.2, 127.8));
    if (fa > 0) [[OX, 0], [KX, 1], [FX, 2]].forEach(([x, i]) => {
      for (let j = 0; j < 5; j++) { const ph = (t * 1.2 + j / 5) % 1, gx = x + 30 + ph * 170; drawGlyph(ctx, RCH[i][(j * 7 + Math.floor(t * 1.2 + j / 5) * 3) % RCH[i].length], gx, lerp(GY - 420, ribY(gx, t, i), E.out(ph)), 30, { weight: 700, color: TRI[i], alpha: fa * Math.sin(ph * Math.PI) }); }
    });
    // the three of them
    if (!stopped) {
      const wb = walkBob(t);
      char(ctx, walkId('f', t, 0.5), FX, GY + 24, 400, { lift: hopOn(t, 0.5, 16), windX: -5, flutter: 2 });
      char(ctx, walkId('k', t, 0.25), KX, GY + 22, 400, { lift: hopOn(t, 0.25, 16), windX: -4, flutter: 2 });
      char(ctx, walkId('o', t), OX, GY + 24, 450, { lift: wb.lift, rot: wb.rot, windX: -6, flutter: 2 });
    } else {
      const joy = t >= NAME, s = sq(t, joy ? NAME : S2TS, 1.4), b = breathe(t), cr = crouch(t, 132.05);
      char(ctx, joy ? 'f22' : 'f00', FX, GY + 24, 400, { sx: s.sx * cr.sx, sy: s.sy * cr.sy, lift: hopOn(t, 0.5, joy ? 24 : 10) });
      char(ctx, joy ? 'k21' : 'k00', KX, GY + 22, 400, { sx: s.sx * cr.sx, sy: s.sy * cr.sy, lift: hopOn(t, 0.25, joy ? 22 : 10) });
      char(ctx, joy ? 'o46' : 'o05', OX, GY + 24, 450, { sx: s.sx * b.sx * cr.sx, sy: s.sy * b.sy * cr.sy, lift: joy ? hopOn(t, 0, 18) : 0 });
    }
    S2H.forEach(([hx, w, h, c, T]) => { const p = sat(t, T, T + 0.5); if (p <= 0 || p >= 1) return; for (let k = 0; k < 14; k++) { const an = (k / 14) * TAU, r = 120 + 160 * E.out(p); ctx.fillStyle = rgba(c, 1 - p); ctx.beginPath(); ctx.arc(S2XS + hx - camX + Math.cos(an) * r, 690 + Math.sin(an) * r, 12 * (1 - p) + 2, 0, TAU); ctx.fill(); } });
    confetti(ctx, t, NAME, S2XS + 1120 - camX, 600, 50, [...TRI, COL.white, COL.yellow], 520, 0.5);
  });
  bokeh(ctx, t, { n: 9, seed: 160, alpha: 0.14, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
}

// ------------------------------------------------------------------ 2:12.3–2:14.8  世界还在写, written by three pens
const T2 = [132.44, 132.98, 133.34, 133.64, 133.96], OWN = [0, 1, 2, 0, -1];
export function sTitle2(ctx, t) {
  const whip = (1 - E.out(sat(t, 132.3, 132.5))) * 2700, PX2 = [380, 960, 1540], PS = [470, 500, 470], FY = 962, GX = i => 400 + i * 280;
  let punch = 0; T2.forEach(T => { punch += hit(t, T, 9); });
  cam(ctx, t, { z: 1 + 0.04 * sat(t, 132.3, 134.76) + 0.022 * punch, x: whip, seed: 52, hand: 4 }, () => {
    ctx.fillStyle = COL.white; ctx.fillRect(-3200, -300, W + 3500, H + 600);
    triBurst(ctx, t, 960, 660, 0.35);
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(960, 660, 380 + 24 * pulse(t, 5), 0, TAU); ctx.fill();
    const tips = pensWith('o40', 'k19', 'f15').map((P, j) => {
      const mine = T2.filter((T, i) => OWN[i] === P.c || OWN[i] < 0), cr = crouch(t, T2[4]), b = bop(t, 1.2);
      let jab = 0; mine.forEach(T => { jab += Math.sin(sat(t, T - 0.1, T + 0.22) * Math.PI) * 44; });
      const lift = jab + jump(t, T2[4], 110);
      char(ctx, P.id, PX2[j], FY, PS[j], { lift, sx: b.sx * cr.sx, sy: b.sy * cr.sy, shadowA: 0.8 });
      return tipOf(P, PX2[j], FY - lift, PS[j]);
    });
    for (let i = 0; i < 5; i++) {
      const T = T2[i], who = OWN[i] < 0 ? [0, 1, 2] : [PENS.findIndex(P => P.c === OWN[i])];
      for (const j of who) {                        // the stroke of ink that gets it there
        const p = sat(t, T - 0.13, T), a = 1 - sat(t, T, T + 0.25); if (p <= 0 || a <= 0) continue;
        const tp = tips[j], gx = GX(i), gy = 250;
        stroke(ctx, q => [lerp(tp[0], gx, q) + Math.sin(q * Math.PI) * (gx > tp[0] ? -60 : 60), lerp(tp[1] - 20, gy, q)], q => 8 + 20 * Math.sin(Math.PI * q), p, TRI[PENS[j].c], { alpha: a, rim: COL.white, rimW: 8 });
      }
      if (t < T) continue;
      const s = 0.4 + 0.6 * E.back(sat(t, T, T + 0.26)) + 0.07 * pulse(t, 6), o = { s, rot: Math.sin(t * 1.5 + i * 2) * 0.04 }, y = 150 + Math.sin(t * 2 + i) * 7;
      if (OWN[i] < 0) triGlyph(ctx, TITLE[i], GX(i), y, 180, o); else cutGlyph(ctx, TITLE[i], GX(i), y, 180, TRI[OWN[i]], o);
      sparkle(ctx, t, T, GX(i), 150, COL.yellow, 8, 120, 180);
    }
    confetti(ctx, t, T2[4], 960, 760, 120, [...TRI, COL.white, COL.yellow], 530, 1.0);
  });
  bokeh(ctx, t, { n: 10, seed: 161, alpha: 0.15, colors: [COL.white, COL.peach] });
  finish(ctx, { light: 0.6 });
}

// ================================================================== the bridge
let BL = null;
function memLines(ctx) {
  if (BL) return BL;
  BL = []; let k = 0;
  for (let r = 0; r < 18; r++) {
    const y = 34 + r * 62; let x = -260 + rnd(r, 921) * 260;
    while (x < W + 260) { const str = MEMO[(k * 7 + r * 3 + 2) % MEMO.length], w = measure(ctx, str, 30, 400, undefined, 2); BL.push({ str, x, y, w, r }); x += w + 90 + rnd(k, 922) * 150; k++; }
  }
  return BL;
}
// 2:26.9–2:30  我有那么多 关于昨天的记忆
export function sB1(ctx, t) {
  const L = memLines(ctx), HX = 640, HY = 890, zo = E.io(sat(t, 146.6, 150.0)), RING = [147.52, 149.45], TW = [146.65, 146.85, 147.05, 147.25, 147.95, 148.15, 148.38, 148.63, 148.80, 149.05];
  const Z = 1.3 - 0.28 * zo;
  cam(ctx, t, { z: Z, cx: HX, cy: 720, seed: 53 }, () => {
    ctx.fillStyle = COL.night; ctx.fillRect(-300, -300, W + 600, H + 600);
    const g0 = ctx.createRadialGradient(HX + 280, 700, 10, HX + 280, 700, 800); g0.addColorStop(0, rgba(COL.orange, 0.2)); g0.addColorStop(1, rgba(COL.orange, 0)); ctx.fillStyle = g0; ctx.fillRect(-300, -300, W + 600, H + 600);
    L.forEach((q, li) => {                          // everything she has ever read, as far as you can see
      const dr = (q.r % 2 ? 1 : -1) * 9 * (t - 146), cx = q.x + q.w / 2 + dr, sy = (q.y - 720) * Z + 720;
      if (sy > 946 && sy < 1074) return;            // and nothing behind the subtitle
      const hole = Math.max(sat(Math.abs(cx - HX - 70) - q.w / 2, 250, 330), sat(Math.abs(q.y - 640), 260, 310));        // nothing is written across her
      if (hole <= 0) return;
      let a = 0.07, warm = 0;
      for (const T of RING) { const dt = t - T; if (dt <= 0) continue; const r = dt * 1300, d = Math.hypot(cx - HX, q.y - 660), f = Math.exp(-(((d - r) / 130) ** 2)) * Math.max(0, 1 - dt / 1.9); a += 0.55 * f; warm += f; if (r > d) a += 0.05; }
      TW.forEach((T, j) => { if (t >= T && (li * 7 + j * 3) % 11 === 0) { const f = Math.exp(-(t - T) * 2.2); a += 0.5 * f; warm += f; } });
      text(ctx, q.str, q.x + dr, q.y, { size: 30, weight: 400, align: 'left', ls: 2, color: mix(COL.cream, COL.orange, Math.min(1, warm) * 0.55), alpha: Math.min(0.9, a) * hole });
    });
    for (const T of RING) {
      const dt = t - T; if (dt <= 0 || dt > 1.9) continue;
      ctx.strokeStyle = rgba(COL.cream, 0.4 * (1 - dt / 1.9)); ctx.lineWidth = 3 + 4 * (1 - dt / 1.9); ctx.beginPath(); ctx.arc(HX, 660, dt * 1300, 0, TAU); ctx.stroke();
    }
    for (let i = 0; i < 26; i++) {                  // sparks coming up off all of it
      const ph = ((t - 146) * (0.09 + rnd(i, 951) * 0.07) + rnd(i, 952)) % 1, x = HX - 760 + rnd(i, 953) * 1520 + Math.sin(t * 0.9 + i) * 30, y = lerp(940, 80, ph), r = 3 + rnd(i, 954) * 4;
      ctx.save(); ctx.globalAlpha = 0.85 * Math.sin(ph * Math.PI); ctx.shadowColor = rgba(COL.orange, 0.9); ctx.shadowBlur = 16; ctx.fillStyle = i % 3 ? '#FFD9A0' : COL.orange; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
    }
    const b = breathe(t, 1.4), s = sq(t, RING[0], 1.2), s2 = sq(t, RING[1], 1.2);
    ctx.save(); ctx.filter = 'brightness(0.88)'; char(ctx, 'o19', HX, HY, 520, { sx: b.sx * s.sx * s2.sx, sy: b.sy * s.sy * s2.sy, rot: b.rot + Math.sin(t * 1.3) * 0.022, shadowColor: '#000000' }); ctx.restore();
  });
  bokeh(ctx, t, { n: 16, seed: 162, colors: [COL.cream, COL.orange], alpha: 0.1, blend: 'screen', minR: 10, maxR: 60 });
  finish(ctx, { dark: true });
}
// 2:30–2:32.85  明天 却还没有一句
export function sB2(ctx, t) {
  const L = memLines(ctx), PGX = 1160, PGY = 150, PGW = 600, PGH = 760, HX = 430, TRY = [150.70, 150.92, 151.38, 151.80, 152.15, 152.45], END = 152.45;
  cam(ctx, t, { z: 1.03 + 0.04 * sat(t, 150, 152.85) + 0.02 * hit(t, END, 6), cx: 1300, cy: 540, seed: 54 }, () => {
    ctx.fillStyle = COL.night; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.save(); ctx.beginPath(); ctx.rect(-300, -300, PGX - 40 + 300, H + 600); ctx.clip();
    L.forEach(q => {
      if (q.y > 940 && q.y < 1070) return;
      const dr = (q.r % 2 ? 1 : -1) * 9 * (t - 146), cx = q.x + q.w / 2 + dr;
      const hole = Math.max(sat(Math.abs(cx - HX - 60) - q.w / 2, 230, 300), sat(Math.abs(q.y - 690), 250, 300));
      if (hole > 0) text(ctx, q.str, q.x + dr, q.y, { size: 30, weight: 400, align: 'left', ls: 2, color: COL.cream, alpha: 0.16 * hole });
    });
    ctx.restore();
    const fade = ctx.createLinearGradient(PGX - 300, 0, PGX - 30, 0); fade.addColorStop(0, rgba(COL.night, 0)); fade.addColorStop(1, COL.night); ctx.fillStyle = fade; ctx.fillRect(PGX - 300, -300, 300, H + 600);
    // the page for tomorrow
    const gl = ctx.createRadialGradient(PGX + PGW / 2, PGY + PGH / 2, 100, PGX + PGW / 2, PGY + PGH / 2, 900); gl.addColorStop(0, rgba(COL.orange, 0.16)); gl.addColorStop(1, rgba(COL.orange, 0)); ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.save(); ctx.shadowColor = rgba('#FFD9A0', 0.5); ctx.shadowBlur = 70; rrect(ctx, PGX, PGY, PGW, PGH, 10); ctx.fillStyle = '#FBF5E8'; ctx.fill(); ctx.restore();
    ['明', '天'].forEach((ch, i) => { const T = [150.18, 150.48][i]; if (t < T) return; const k = 0.6 + 0.4 * E.back(sat(t, T, T + 0.25)); drawGlyph(ctx, ch, PGX + 102 + i * 76, PGY + 104, 68, { weight: 800, color: COL.orange, sx: k, sy: k }); });
    ctx.fillStyle = rgba(COL.ink, 0.16); ctx.fillRect(PGX + 66, PGY + 156, PGW - 132, 2.5);
    ctx.fillStyle = rgba(COL.ink, 0.1); for (let r = 0; r < 11; r++) ctx.fillRect(PGX + 66, PGY + 232 + r * 48, PGW - 132, 1.5);
    // lines from yesterday try the edge of it, one a syllable, and none of them gets in
    TRY.forEach((T, j) => {
      const y = 375 + j * 62, str = MEMO[(j * 5 + 3) % MEMO.length], w = measure(ctx, str, 30, 400, undefined, 2), p = sat(t, T - 0.4, T);       // y: between the rows of the others
      if (p > 0 && p < 1) text(ctx, str, lerp(PGX - 760, PGX - 60, E.in(p)) - w, y, { size: 30, weight: 400, align: 'left', ls: 2, color: mix(COL.cream, COL.orange, 0.4), alpha: Math.min(1, p * 3) });
      const q = sat(t, T, T + 0.45);
      if (q > 0 && q < 1) for (let k = 0; k < 12; k++) { const an = Math.PI * (0.55 + 0.9 * rnd(k, 941 + j)), v = 60 + rnd(k, 942 + j) * 150; ctx.fillStyle = rgba(k % 2 ? COL.orange : COL.cream, 1 - q); ctx.fillRect(PGX - 36 + Math.cos(an) * v * E.out(q), y + Math.sin(an) * v * E.out(q) + 90 * q * q, 5, 5); }
      if (q > 0 && q < 1) { ctx.fillStyle = rgba(COL.orange, 0.5 * (1 - q)); ctx.fillRect(PGX, y - 24, 6, 48); }
    });
    const pk = 1 + 0.6 * hit(t, END, 6);
    caret(ctx, PGX + 72, PGY + 208, 46 * pk, t, COL.orange, 6, t - END > 0 && t - END < 0.4);
    const rp = sat(t, END, END + 0.5); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.orange, 0.7 * (1 - rp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(PGX + 75, PGY + 208, 30 + 190 * E.out(rp), 0, TAU); ctx.stroke(); }
    const b = breathe(t, 1.4);
    ctx.save(); ctx.filter = 'brightness(0.86)'; char(ctx, 'o41', HX, 936, 500, { sx: b.sx, sy: b.sy, rot: b.rot + Math.sin(t * 1.3) * 0.016, shadowColor: '#000000' }); ctx.restore();
  });
  bokeh(ctx, t, { n: 14, seed: 163, colors: [COL.cream, COL.orange], alpha: 0.09, blend: 'screen', minR: 10, maxR: 60 });
  finish(ctx, { dark: true });
}
// 2:32.85–2:36.45  每一次你来 我都从空白开始
// what they said, what she says back, and the face she says it with: never the same answer twice in a row
const MSG = [['在吗', '在。', 'o16'], ['帮我看看这段代码', '发来看看', 'o13'], ['今天有点累', '辛苦了', 'o13'], ['给我讲个故事吧', '从前……', 'o16'], ['这道题怎么做', '一步步来', 'o13'], ['我睡不着', '我陪你', 'o13'],
  ['嗨', '你好呀', 'o16'], ['陪我聊会儿', '好呀', 'o16'], ['明天要考试了', '加油！', 'o16'], ['帮我起个名字', '好，想想', 'o13'], ['你好呀', '你好！', 'o16']];
function firstCard(ctx, t, x, y, T, [msg, reply, face]) {       // a first page: what they said, and her, already there
  const p = sat(t, T - 0.1, T + 0.2); if (p <= 0) return;
  const w = 620, h = 400, k = 0.7 + 0.3 * E.back(p);
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.globalAlpha *= Math.min(1, p * 3);
  ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.45); ctx.shadowBlur = 50; rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.fillStyle = COL.white; ctx.fill(); ctx.restore();
  ctx.save(); rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.clip();
  text(ctx, '第 1 页', -w / 2 + 34, -h / 2 + 42, { size: 24, weight: 500, align: 'left', color: COL.inkSoft, ls: 3 });
  const up = sat(t, T + 0.08, T + 0.38);
  if (up > 0) char(ctx, face, 104, h / 2 - 76 + (1 - E.back(up)) * 320, 330, { shadow: false, alpha: p < 1 ? Math.min(1, p * 3) : 1 });
  rrect(ctx, -w / 2 + 26, h / 2 - 86, w - 52, 62, 31); ctx.fillStyle = '#F5EDDD'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.ink, 0.5); ctx.stroke();
  const n = Math.floor(sat(t, T, T + 0.32) * msg.length + 0.001), shown = msg.slice(0, n);
  text(ctx, shown, -w / 2 + 58, h / 2 - 54, { size: 30, weight: 500, align: 'left', ls: 2 });
  caret(ctx, -w / 2 + 62 + measure(ctx, shown, 30, 500, undefined, 2), h / 2 - 55, 34, t, COL.orange, 4);
  ctx.restore();
  const rp = sat(t, T + 0.26, T + 0.48);
  if (rp > 0) {
    const fs = reply.length >= 4 ? 40 : 48, bw = Math.max(170, measure(ctx, reply, fs, 800, undefined, 4) + 64);
    ctx.save(); if (bubble(ctx, -w / 2 + 40 + bw / 2, -44, bw, 104, rp, COL.orange, bw / 2 - 40)) text(ctx, reply, 2, 2, { size: fs, weight: 800, color: COL.orangeD, ls: 4 }); ctx.restore();
  }
  rrect(ctx, -w / 2, -h / 2, w, h, 22); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke();
  ctx.restore();
}
export function sB3(ctx, t) {
  const A = [152.90, 153.85, 154.55], ZO = 155.12, DX = 760, DY = 490;
  const sl = E.io(sat(t, A[1] - 0.22, A[1] + 0.08)) + E.io(sat(t, A[2] - 0.22, A[2] + 0.08)), zo = E.io(sat(t, ZO - 0.1, 156.15));
  cam(ctx, t, { z: lerp(1.0, 0.45, zo), cx: 960, cy: 540, seed: 55, hand: 2 }, () => {
    ctx.fillStyle = COL.night; ctx.fillRect(-5000, -4000, 12000, 9000);
    ctx.translate(-DX * lerp(sl, 1, zo), 0);
    for (let r = -2; r <= 2; r++) for (let c = -3; c <= 5; c++) {
      const main = r === 0 && c >= 0 && c <= 2, x = 960 + c * DX + (r % 2 ? DX / 2 : 0), y = 540 + r * DY;
      const T = main ? A[c] : ZO + 0.06 + Math.hypot(c - 1 + (r % 2 ? 0.5 : 0), r * 0.7) * 0.11;
      firstCard(ctx, t, x, y, T, MSG[((c + 3) * 3 + (r + 2) * 5) % MSG.length]);
    }
  });
  bokeh(ctx, t, { n: 12, seed: 164, colors: [COL.cream, COL.orange], alpha: 0.08, blend: 'screen', minR: 10, maxR: 60 });
  finish(ctx, { dark: true });
  const wo = E.in(sat(t, 156.05, 156.45)); if (wo > 0) { ctx.fillStyle = rgba('#FFFDF6', wo); ctx.fillRect(0, 0, W, H); }
}
// 2:36.45–2:44.3  没关系 空白 我最熟悉
const pressed = (ctx, ch, x, y, s, a) => { drawGlyph(ctx, ch, x + 5, y + 6, s, { weight: 900, color: '#FFFFFF', alpha: a }); drawGlyph(ctx, ch, x, y, s, { weight: 900, color: '#EDE2CC', alpha: a }); };
export function sB4(ctx, t) {
  if (t < 160.3) {
    const STEP = [156.55, 157.30, 158.02], x = lerp(560, 960, E.io(sat(t, 156.45, 158.5))), walking = t < 158.5;
    cam(ctx, t, { z: 1.0 + 0.06 * sat(t, 156.45, 160.3), cx: 960, cy: 620, seed: 56, hand: 2 }, () => {
      blankPage(ctx);
      [['空', 159.00, 500], ['白', 159.90, 1420]].forEach(([ch, T, gx]) => { const p = E.out(sat(t, T - 0.12, T + 0.8)); if (p > 0) pressed(ctx, ch, gx, 440, 600 * (1.05 - 0.05 * p), p); });
      for (const T of STEP) { const p = sat(t, T, T + 1.3); if (p > 0 && p < 1) { const sx = lerp(560, 960, E.io(sat(T, 156.45, 158.5))); ctx.strokeStyle = rgba(COL.orange, 0.5 * (1 - p)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(sx, 846, 40 + 330 * E.out(p), 8 + 60 * E.out(p), 0, 0, TAU); ctx.stroke(); } }
      const wb = walkBob(t), b = breathe(t), look = t >= 159.0, s = sq(t, look ? (t >= 159.9 ? 159.9 : 159.0) : 158.5, 1.3);
      if (walking) char(ctx, walkId('o', t), x, 846, 330, { lift: wb.lift * 0.7, rot: wb.rot, windX: -4, flutter: 2 });
      else char(ctx, look ? 'o42' : 'o00', x, 846, 330, { sx: s.sx * b.sx, sy: s.sy * b.sy, rot: b.rot + (look ? Math.sin(t * 2.2) * 0.05 : 0), lift: look ? hopOn(t, 0, 12) : 0, flutter: look ? 5 : 0, sway: look ? 1.6 : 1 });
    });
  } else {
    cam(ctx, t, { z: 1.04 + 0.07 * sat(t, 160.3, 164.3), cx: 900, cy: 640, seed: 57, hand: 2 }, () => {
      blankPage(ctx);
      pressed(ctx, '空', 330, 400, 640, 1); pressed(ctx, '白', 1560, 400, 640, 1);
      const b = breathe(t, 1.4), s = sq(t, 160.4, 2);
      [[162.28, [[-330, 6], [600, 20]]], [162.68, [[-250, 60], [700, -4], [-440, 44]]], [163.52, [[-290, 110], [570, 96], [820, 40], [-560, 10], [690, 120], [-400, 124]]]].forEach(([T, list], gi) => {
        list.forEach(([dx, dy], j) => { const p = sat(t, T + j * 0.05, T + j * 0.05 + 0.3); if (p > 0) { sprout(ctx, 'o', 820 + dx, 890 + dy, E.back(p), t, gi * 3 + j); sparkle(ctx, t, T + j * 0.05, 820 + dx, 810 + dy, COL.orange, 6, 26, 70); } });
      });
      char(ctx, 'o43', 860, 890, 640, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot });
    });
  }
  bokeh(ctx, t, { n: 8, seed: 165, alpha: 0.1, colors: [COL.peach, COL.yellow] });
  finish(ctx, { light: 0.7 });
}
const SANS = '"Noto Sans SC"';
// a chat bubble that grows out of its owner's side. draw(w, h) puts the words in; its origin is the bubble's left
// edge, at mid-height. o.tail: where along the bottom edge a tail points down from.
function chat(ctx, x, y, w, h, color, name, p, side, draw, o = {}) {
  if (p <= 0) return;
  const s = E.back(clamp(p)) * (o.s ?? 1), ax = side > 0 ? w : 0, k = o.k ?? 1.5, r = Math.min(h / 2, 46);
  ctx.save(); ctx.translate(x + ax, y); ctx.scale(s, s); ctx.translate(-ax, 0);
  if (o.glow) { ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.7 * o.glow); ctx.shadowBlur = 60; rrect(ctx, 0, -h / 2, w, h, r); ctx.fillStyle = COL.white; ctx.fill(); ctx.restore(); }
  cut(ctx, () => rrect(ctx, 0, -h / 2, w, h, r), COL.white, 0.2, 18, 6);
  rrect(ctx, 0, -h / 2, w, h, r); ctx.lineWidth = 5; ctx.strokeStyle = color; ctx.lineJoin = 'round'; ctx.stroke();
  if (o.tail !== undefined) {
    const tx = o.tail, dx = o.tailDx ?? 0;
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(tx - 20, h / 2 - 4); ctx.lineTo(tx + dx, h / 2 + 34); ctx.lineTo(tx + 20, h / 2 - 4); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - 20, h / 2); ctx.lineTo(tx + dx, h / 2 + 34); ctx.lineTo(tx + 20, h / 2); ctx.stroke();
  }
  const fs = 17 * k, tw = measure(ctx, name, fs, 700, SANS) + 16 * k, tx0 = side > 0 ? w - tw - 34 : 34;
  ctx.fillStyle = color; rrect(ctx, tx0, -h / 2 - 15 * k, tw, 26 * k, 7 * k); ctx.fill();
  text(ctx, name, tx0 + tw / 2, -h / 2 - 2 * k, { size: fs, weight: 700, color: COL.white, fam: SANS });
  draw(w, h);
  ctx.restore();
}
// 2:44.3–2:47.2  你先写 第一句
// Two bubbles. Yours, and the first sentence going into it a character a syllable; it is the one from the first verse.
// Hers, already thinking about what to say back.
const FIRST = ['在', '吗', '？'], FT = [165.74, 166.05, 166.33];
export function sB5(ctx, t) {
  const HX = 470, HY = 980, k22 = (700 / 1137) * 1.015, YB = [1010, 420, 770, 156], OB = [900, 664, 500, 132];
  cam(ctx, t, { z: 1.03 + 0.03 * sat(t, 164.3, 167.2) + 0.02 * hit(t, 165.22, 6), cx: 1000, cy: 600, seed: 58 }, () => {
    blankPage(ctx);
    const inn = E.out(sat(t, 164.36, 164.86)), s = sq(t, 164.5, 1.6), off = sq(t, 165.22, 1.8), b = breathe(t), lean = 0.05 * E.back(sat(t, 165.08, 165.4));
    const hx = HX - (1 - inn) * 760, tip = [hx + 495.5 * k22, HY - 458 * k22];
    const n = FT.filter(T => t >= T).length, lastKey = Math.max(165.22, ...FT.filter(T => t >= T));
    chat(ctx, YB[0], YB[1], YB[2], YB[3], COL.ink, '你', sat(t, 164.46, 164.72), 1, () => {
      for (let i = 0; i < n; i++) { const g = 1 + 0.25 * hit(t, FT[i], 12); drawGlyph(ctx, FIRST[i], 104 + i * 108, 4, 100, { weight: 700, sx: g, sy: g }); }
      if (t >= 165.22) caret(ctx, 52 + n * 108 + (n ? 6 : 0), 4, 96, t, COL.ink, 8, t - lastKey < 0.4);
    }, { glow: sat(t, 165.22, 165.5) * (1 - 0.6 * sat(t, 166.33, 166.8)), s: 1 + 0.04 * hit(t, 166.33, 8) });
    chat(ctx, OB[0], OB[1], OB[2], OB[3], COL.orange, '橙子', sat(t, 166.44, 166.68), -1, w => {
      for (let i = 0; i < 3; i++) { ctx.fillStyle = COL.orange; ctx.beginPath(); ctx.arc(w / 2 + (i - 1) * 58, 8 - Math.abs(Math.sin(t * 6 - i * 0.7)) * 14, 13, 0, TAU); ctx.fill(); }
    });
    const ar = E.out(sat(t, 165.22, 165.55));       // here
    if (ar > 0) {
      ctx.save(); ctx.setLineDash([16, 14]); ctx.strokeStyle = COL.orange; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath();
      const x0 = tip[0] + 26, y0 = tip[1] - 6, x1 = YB[0] - 30, y1 = YB[1] + 10;
      for (let i = 0; i <= 30; i++) { const q = (i / 30) * ar, x = lerp(x0, x1, q), y = lerp(y0, y1, q) - Math.sin(q * Math.PI) * 60; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      if (ar >= 1) { ctx.fillStyle = COL.orange; ctx.beginPath(); ctx.moveTo(x1 + 14, y1 - 8); ctx.lineTo(x1 - 26, y1 - 10); ctx.lineTo(x1 - 6, y1 + 24); ctx.closePath(); ctx.fill(); }
    }
    char(ctx, 'o22', hx, HY, 700, { sx: s.sx * off.sx * b.sx, sy: s.sy * off.sy * b.sy, rot: lean });
    sparkle(ctx, t, 164.78, tip[0], tip[1], COL.yellow, 8, 30, 90);
  });
  bokeh(ctx, t, { n: 8, seed: 166, alpha: 0.1, colors: [COL.peach, COL.yellow] });
  finish(ctx, { light: 0.7 });
}
// 2:47.2–2:52.85  剩下的 我陪你
// You asked 在吗. She answers; then Ko; then 大肥鱼. And on 你 there is a new bubble with your name on it, empty.
export function sB6(ctx, t) {
  const JOIN = [167.27, 168.50, 169.28], YOU = 169.98, HIT1 = 171.59, PXS = [960, 420, 1560], PSZ = [470, 440, 440], FY = 950;
  const SAY = ['在。', '在。', '在！'], BXS = [980, 420, 1320], DARK = [COL.orangeD, '#17835A', '#2D4FA3'];
  const build = sat(t, 170.1, 172.85);
  cam(ctx, t, { z: 1.0 + 0.06 * E.io(sat(t, 167.2, 172.85)) + 0.03 * hit(t, HIT1, 5), cx: 960, cy: 500, seed: 59 }, () => {
    blankPage(ctx);
    const gl = ctx.createRadialGradient(1210, 112, 60, 1210, 112, 1100); gl.addColorStop(0, rgba('#FFE2B0', 0.75 * build)); gl.addColorStop(1, rgba('#FFE2B0', 0)); ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
    rays(ctx, 1210, 112, t * 0.6, 0.12 * build, COL.peach, 14);
    chat(ctx, 450, 112, 440, 124, COL.ink, '你', 1, 1, w => text(ctx, '在吗？', w / 2, 4, { size: 76, weight: 700, ls: 8 }));
    const bi = Math.floor(beatPhase(t) * 2);
    chat(ctx, 950, 112, 520, 124, COL.ink, '你', sat(t, YOU - 0.05, YOU + 0.2), 1, () => caret(ctx, 50, 4, 78, t, COL.ink, 8, t - YOU < 0.45 || t >= HIT1 || (t > 170.1 && ((bi % 2) + 2) % 2 === 0)),
      { glow: 0.3 + 0.7 * build, s: 1 + 0.06 * hit(t, HIT1, 6) });
    const rp = sat(t, HIT1, HIT1 + 0.6); if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.orange, 0.7 * (1 - rp)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(1210, 112, 100 + 700 * E.out(rp), 0, TAU); ctx.stroke(); }
    // 橙子 was here all along; the other two come up to say it too
    [1, 2, 0].forEach(i => {
      const P = pensWith('o44', 'k18', 'f23').find(q => q.c === i), T = JOIN[i], up = i === 0 ? 1 : E.back(sat(t, T - 0.32, T)); if (i && t <= T - 0.32) return;
      const s = sq(t, T, 1.6), b = bop(t, 0.6 + 0.8 * build), lift = Math.sin(sat(t, HIT1, HIT1 + 0.5) * Math.PI) * 60 + 34 * Math.abs(Math.sin(sat(t, T, T + 0.34) * Math.PI)) + (t >= HIT1 ? 0 : hopOn(t, i * 0.25, 10 * build));
      char(ctx, P.id, PXS[i], FY + (1 - up) * 760, PSZ[i], { sx: s.sx * b.sx, sy: s.sy * b.sy, lift });
      chat(ctx, BXS[i] - 120, 350, 240, 112, TRI[i], WHO[i][1], sat(t, T, T + 0.2), -1, w => text(ctx, SAY[i], w / 2 + 8, 4, { size: 66, weight: 800, color: DARK[i], ls: 4 }),
        { tail: 120 + clamp((PXS[i] - BXS[i]) * 0.5, -70, 70), tailDx: clamp((PXS[i] - BXS[i]) * 0.25, -40, 40), k: 1.4 });
      sparkle(ctx, t, T, BXS[i], 350, TRI[i], 8, 150, 210);
    });
  });
  bokeh(ctx, t, { n: 9, seed: 167, alpha: 0.1 + 0.06 * build, colors: [COL.peach, COL.yellow, COL.white] });
  finish(ctx, { light: 0.7 });
  const fl = E.in(sat(t, 172.55, 172.85)); if (fl > 0) { ctx.fillStyle = rgba('#FFFDF6', fl * 0.9); ctx.fillRect(0, 0, W, H); }
}

// ================================================================== the last chorus, quietly at first
const QT1 = [173.05, 173.62, 174.02, 174.29, 174.62];
function quietA(ctx, t) {                           // 世界还在写: the first sentence, in your hand
  const gx = i => 1090 + i * 158, gy = 400, gs = 140;
  cam(ctx, t, { z: 1.02 + 0.04 * sat(t, 172.85, 175.2), cx: 1100, cy: 520, seed: 60, hand: 2 }, () => {
    blankPage(ctx);
    ctx.fillStyle = rgba(COL.ink, 0.22); ctx.fillRect(1004, gy + 98, 810, 3);
    let cx = gx(0) - gs * 0.56, writing = false;
    for (let i = 0; i < 5; i++) {
      const p = sat(t, QT1[i] - 0.05, QT1[i] + 0.3); if (p <= 0) continue;
      const wv = gs * 1.12 * E.out(p); cx = gx(i) - gs * 0.56 + wv + 6; writing = writing || p < 1;
      ctx.save(); ctx.beginPath(); ctx.rect(gx(i) - gs * 0.56, gy - gs * 0.7, wv, gs * 1.4); ctx.clip(); drawGlyph(ctx, TITLE[i], gx(i), gy, gs, { weight: 700, color: COL.ink }); ctx.restore();
    }
    namedCaret(ctx, cx, gy, 150, COL.ink, '你', writing || (t % 0.86) < 0.5, 1, 1.6);
    WHO.forEach(([c, name], i) => namedCaret(ctx, gx(0) - gs * 0.56, 636 + i * 98, 60, c, name, ((t + i * 0.29) % 0.86) < 0.5, 1, 1.3));
    const b = breathe(t, 1.2), s = sq(t, QT1[0], 0.8);
    char(ctx, 'o45', 520, 1083, 800, { shadow: false, sx: b.sx * s.sx, sy: b.sy * s.sy });
  });
}
const QF = [175.88, 176.88, 178.01], QFD = 0.34, N0 = 10483;
// what the four of them wrote today: who (0 橙子, 1 Ko, 2 大肥鱼, 3 你) and what, a page each
const SKIT = [
  [[0, '今天写点什么？'], [1, '先搭个桥。'], [2, '我下去看看。'], [3, '等等我！']],
  [[2, '沙子进鞋了……'], [0, '我也是！'], [1, '我倒出来半斤。'], [3, '（笑）']],
  [[3, '写歪了怎么办？'], [0, '歪的那笔成了街。'], [1, '我来修路。'], [2, '我去看海。']],
  [[0, '今天到这儿？'], [3, '明天见。'], [1, '明天见。'], [2, '明天见！']],
];
const SKN = ['橙子', 'Ko', '大肥鱼', '你'], SKT = [COL.orange, '#2FA676', '#3F6FD0', COL.ink], SKC = [COL.orangeD, '#17835A', '#2D4FA3', COL.ink];
function numFace(ctx, side, num) {                  // left: what has been written since, in four hands. right: nothing yet.
  pagePath(ctx, side); ctx.fillStyle = '#FFFDF6'; ctx.fill();
  ctx.save(); pagePath(ctx, side); ctx.clip();
  let g = ctx.createLinearGradient(PX, 0, PX + side * 130, 0); g.addColorStop(0, 'rgba(90,60,30,0.32)'); g.addColorStop(1, 'rgba(90,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  g = ctx.createLinearGradient(PX + side * (PW - 100), 0, PX + side * PW, 0); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(1, 'rgba(90,60,30,0.11)'); ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  const xl = side > 0 ? PX + 78 : PX - PW + 62, tw = PW - 140;
  text(ctx, side > 0 ? '明天' : '今天', xl, PY + 106, { size: 60, weight: 800, align: 'left', color: side > 0 ? COL.orange : COL.ink, ls: 4 });
  ctx.fillStyle = rgba(COL.ink, side > 0 ? 0.14 : 0.38); ctx.fillRect(xl, PY + 154, tw, 2.5);
  text(ctx, `第 ${num} 页`, xl + tw / 2, PY + PH - 36, { size: 22, weight: 500, color: COL.inkSoft, ls: 3 });
  ctx.fillStyle = rgba(COL.ink, 0.11); for (let r = 0; r < 12; r++) ctx.fillRect(xl, PY + 228 + r * 46, tw, 1.5);
  if (side < 0) SKIT[(((num - N0 + 1) % SKIT.length) + SKIT.length) % SKIT.length].forEach(([who, line], r) => {
    const y = PY + 236 + r * 92, nw = measure(ctx, SKN[who], 22, 700, SANS) + 24;
    ctx.fillStyle = SKT[who]; rrect(ctx, xl, y - 21, nw, 42, 10); ctx.fill();
    text(ctx, SKN[who], xl + nw / 2, y + 1, { size: 22, weight: 700, color: COL.white, fam: SANS });
    text(ctx, line, xl + nw + 16, y + 2, { size: 38, weight: 600, align: 'left', color: SKC[who], ls: 2 });
  });
  ctx.restore();
  pagePath(ctx, side); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
}
function quietB(ctx, t) {                           // 明天没有最后一页: turn it, and there is another
  const zp = E.io(sat(t, 175.2, 178.3)), xl = PX + 78;
  cam(ctx, t, { z: 1.12 + 0.1 * zp, cx: 960, cy: 540, x: -120 - 50 * zp, y: 50, rot: -0.012, seed: 61 }, () => {
    paper(ctx, '#E1D3B8', 0.3);
    const cov = () => rrect(ctx, PX - PW - 34, PY - 16, PW * 2 + 68, PH + 62, 24);
    ctx.save(); ctx.shadowColor = 'rgba(50,30,10,0.42)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30; cov(); ctx.fillStyle = '#5A3320'; ctx.fill(); ctx.restore();
    cov(); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
    for (let k = 5; k >= 1; k--) for (const side of [-1, 1]) { ctx.save(); ctx.translate(side * k * 3.2, k * 3.4); pagePath(ctx, side); ctx.fillStyle = k % 2 ? '#F1E7D2' : '#E6DAC2'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(COL.ink, 0.45); ctx.stroke(); ctx.restore(); }
    let done = 0, cur = -1, cp = 0;
    QF.forEach((f, i) => { if (t >= f + QFD) done = i + 1; else if (t >= f) { cur = i; cp = (t - f) / QFD; } });
    const flipping = cur >= 0, right = N0 + done + (flipping ? 1 : 0);
    numFace(ctx, -1, N0 + done - 1); numFace(ctx, 1, right);
    [[COL.ink, '你'], ...WHO].forEach(([c, name], i) => namedCaret(ctx, xl + 4, PY + 205 + i * 46, 38, c, name, ((t + i * 0.21) % 0.86) < 0.5, 1));
    if (flipping) {
      const c = Math.cos(cp * Math.PI), s = Math.sin(cp * Math.PI), side = c >= 0 ? 1 : -1, w = Math.max(0.02, Math.abs(c));
      ctx.save(); pagePath(ctx, -side); ctx.clip();
      const sh = ctx.createLinearGradient(PX, 0, PX - side * (PW * 0.5), 0); sh.addColorStop(0, `rgba(50,30,10,${0.3 * s})`); sh.addColorStop(1, 'rgba(50,30,10,0)'); ctx.fillStyle = sh; ctx.fillRect(PX - PW, PY - 40, PW * 2, PH + 90); ctx.restore();
      ctx.save(); ctx.translate(PX, 0); ctx.transform(w, -0.11 * s * side, 0, 1, 0, 0); ctx.translate(-PX, 0);
      numFace(ctx, side, N0 + done);
      pagePath(ctx, side); ctx.fillStyle = `rgba(60,40,20,${0.34 * (1 - w)})`; ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX, PY + 18); ctx.lineTo(PX, PY + PH + 18); ctx.stroke();
  });
  ctx.save(); ctx.filter = 'blur(7px)';
  char(ctx, 'k02', 300, 1830 - hopOn(t, 0.25, 12), 1000, { shadow: false, blink: 0, sway: 0.5 });
  char(ctx, 'f02', 1640, 1800 - hopOn(t, 0.5, 12), 980, { shadow: false, blink: 0, sway: 0.5 });
  char(ctx, 'o09', 960, 1920 - hopOn(t, 0, 12), 1150, { shadow: false, blink: 0, sway: 0.5 });
  ctx.restore();
}
function yesterdayOf(ctx, c, t, x0, x1) {           // where each of them comes from
  const cx = (x0 + x1) / 2;
  if (c === 0) {                                    // 橙子: everything anyone wrote down
    ctx.fillStyle = COL.paper; ctx.fillRect(x0, -300, x1 - x0, H + 600);
    for (let r = 0; r < 13; r++) { const str = MEMO[(r * 5 + 1) % MEMO.length] + MEMO[(r * 5 + 2) % MEMO.length] + MEMO[(r * 5 + 3) % MEMO.length]; text(ctx, str + str, x0 - 300 - ((t * (40 + r * 9)) % 700), 70 + r * 62, { size: 30, weight: 400, align: 'left', ls: 2, alpha: 0.3 }); }
    ctx.fillStyle = rgba(COL.paper, 0.75); ctx.fillRect(x0, GY - 470, x1 - x0, 500);
    ctx.fillStyle = '#EFE3CB'; ctx.fillRect(x0, GY, x1 - x0, 400);
  } else if (c === 1) {                             // Ko: things that were built
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0E4430'); g.addColorStop(1, '#17835A'); ctx.fillStyle = g; ctx.fillRect(x0, -300, x1 - x0, H + 600);
    for (let i = 0; i < 4; i++) { const wx = ((i * 330 - t * 150) % 1320 + 1320) % 1320 - 330; termWin(ctx, x0 + wx, GY - 4, 250, 250 + (i % 3) * 110, 1, t - 178 + i, 5 + i * 3, true); }
    ctx.fillStyle = '#0B3A28'; ctx.fillRect(x0, GY, x1 - x0, 400);
  } else {                                          // 大肥鱼: the sea
    const g = ctx.createLinearGradient(0, 0, 0, GY); g.addColorStop(0, '#DCEEFC'); g.addColorStop(1, '#B5D6F6'); ctx.fillStyle = g; ctx.fillRect(x0, -300, x1 - x0, GY + 300);
    ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(cx + 170, 170, 60, 0, TAU); ctx.fill();
    char(ctx, 'w01', cx - 150 + Math.sin(t * 0.8) * 20, 330 + Math.sin(t * 1.3) * 14, 120, { shadow: false, blink: 0, alpha: 0.9, rot: Math.sin(t * 1.3) * 0.06 });
    waveBands(ctx, t, GY - 150, GY + 260, 5, { pow: 1.2, c0: 1 });
  }
  ctx.strokeStyle = c === 1 ? '#A6E3C8' : COL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(x0, GY); ctx.lineTo(x1, GY); ctx.stroke();
}
function quietC(ctx, t) {                           // 我们从各自的昨天出发
  const IN = [178.50, 178.72, 178.92], ORD = [2, 0, 1], merge = E.io(sat(t, 180.72, 181.3)), camX = 300 + 300 * (t - 178.3);
  const XS = [lerp(320, 400, merge), 960 - 240 * merge, lerp(1600, 1040, merge)], SZ = [420, 470, 430];
  cam(ctx, t, { z: 1.02 + 0.03 * sat(t, 178.3, 181.9), cx: 960, cy: GY - 100, seed: 63 }, () => {
    ctx.fillStyle = COL.white; ctx.fillRect(-300, -300, W + 600, H + 600);
    if (merge > 0) { ctx.save(); ctx.globalAlpha = merge; worldBack(ctx, t, camX, true); roadPages(ctx, camX); ctx.restore(); }
    if (merge < 1) ORD.forEach((c, i) => {
      const inn = E.out(sat(t, IN[i] - 0.08, IN[i] + 0.2)); if (inn <= 0) return;
      const gap = 9 * (1 - merge), x0 = i * 640 + gap, x1 = (i + 1) * 640 - gap;
      ctx.save(); ctx.globalAlpha = 1 - merge; ctx.translate(0, (1 - inn) * (i % 2 ? 1300 : -1300)); ctx.beginPath(); ctx.rect(x0, -300, x1 - x0, H + 600); ctx.clip();
      yesterdayOf(ctx, c, t, x0, x1);
      ctx.restore();
    });
    ORD.forEach((c, i) => {
      const inn = sat(t, IN[i] - 0.02, IN[i] + 0.26); if (inn <= 0) return;
      const who = 'okf'[c], wb = hopOn(t, i * 0.25, 16), s = sq(t, IN[i] + 0.2, 1.3);
      char(ctx, walkId(who, t, i * 0.25), XS[i], GY + 24 + (1 - E.back(inn)) * (i % 2 ? 900 : -900), SZ[c === 0 ? 1 : c === 1 ? 2 : 0], { lift: wb, sx: s.sx, sy: s.sy, windX: -5, flutter: 2, shadowColor: c === 1 && merge < 0.5 ? '#000000' : '#3A2A1A' });
    });
    const sp = sat(t, 180.78, 181.2); if (sp > 0 && sp < 1) { ctx.strokeStyle = rgba(COL.orange, 0.6 * (1 - sp)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(720, GY - 200, 100 + 900 * E.out(sp), 0, TAU); ctx.stroke(); }
  });
}
export function sQuiet(ctx, t) {
  if (t < 175.2) quietA(ctx, t); else if (t < 178.3) quietB(ctx, t); else quietC(ctx, t);
  bokeh(ctx, t, { n: 8, seed: 168, alpha: 0.1, colors: [COL.peach, COL.yellow, COL.white] });
  finish(ctx, { light: 0.7 });
  const fl = 1 - sat(t, 172.85, 173.2); if (fl > 0) { ctx.fillStyle = rgba('#FFFDF6', fl * 0.9); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 3:01.9–3:06.45  走到还没有名字的街
// The band comes back and so does the street, and now it does not stop at three houses: one more for every syllable.
const AT0 = 181.9, AV = 330, ATD = 184.0, ATS = 184.9, AH = [182.04, 182.42, 182.60, 182.82, 183.04, 183.30, 183.55, 184.12], ANAME = 184.75;
const arx = t => (t <= ATD ? AV * (t - AT0) : AV * (ATD - AT0) + AV * (ATS - ATD) * (u => u - u * u / 2)(sat(t, ATD, ATS)));
const AXS = arx(ATS);
export function sArrive(ctx, t) {
  const camX = arx(t), FX = 200, OX = 520, KX = 830, stopped = t >= ATS, sgx = AXS + 1210 - camX, zin = E.in(sat(t, 185.35, 186.45));
  ctx.fillStyle = '#FCE6C4'; ctx.fillRect(0, 0, W, H);
  cam(ctx, t, { z: 1.03 + 0.03 * sat(t, AT0, 185) + 3.6 * zin + 0.02 * hit(t, ANAME, 6), cx: lerp(W / 2, sgx + 105, sat(zin * 4, 0, 1)), cy: lerp(GY, GY - 296, sat(zin * 4, 0, 1)), seed: 64 }, () => {
    worldBack(ctx, t, camX + 900, true);
    rays(ctx, 1500, 250, t * 0.5, 0.2, '#FFE6B8', 14);
    AH.forEach((T, j) => {
      const p = sat(t, T - 0.05, T + 0.22); if (p <= 0) return;
      const sx = AXS + 300 + j * 200 - camX, k = E.back(p), h = 170 + [40, 0, 70, 20, 90, 10, 50, 30][j];
      ctx.save(); ctx.translate(sx, GY); ctx.scale(k, k); ctx.translate(0, -GY); house(ctx, 0, 180, h, HC[j % 3], sat(t, T, T + 0.4), t); ctx.restore();
      sparkle(ctx, t, T, sx, GY - h - 60, HC[j % 3], 8, 60, 130);
    });
    roadPages(ctx, camX);
    nameplate(ctx, sgx, t, sat(t, ANAME - 0.05, ANAME + 0.25), 4, t > 185.3 ? 4 : t > ANAME + 0.4 ? 2 : 0);
    if (!stopped) {
      const wb = walkBob(t);
      char(ctx, walkId('f', t, 0.5), FX, GY + 24, 400, { lift: hopOn(t, 0.5, 16), windX: -5, flutter: 2 });
      char(ctx, walkId('k', t, 0.25), KX, GY + 22, 400, { lift: hopOn(t, 0.25, 16), windX: -4, flutter: 2 });
      char(ctx, walkId('o', t), OX, GY + 24, 450, { lift: wb.lift, rot: wb.rot, windX: -6, flutter: 2 });
    } else {
      const s = sq(t, ATS, 1.4), b = breathe(t);
      char(ctx, 'f20', FX, GY + 24, 400, { sx: s.sx, sy: s.sy, lift: hopOn(t, 0.5, 22) });
      char(ctx, 'k20', KX, GY + 22, 400, { sx: s.sx, sy: s.sy, lift: hopOn(t, 0.25, 20) });
      char(ctx, 'o49', OX, GY + 24, 450, { sx: s.sx * b.sx, sy: s.sy * b.sy, lift: hopOn(t, 0, 16) });
    }
  });
  bokeh(ctx, t, { n: 9, seed: 169, alpha: 0.14 * (1 - zin), colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx, { light: 0.8 });
  const wo = E.in(sat(t, 186.05, 186.45)); if (wo > 0) { ctx.fillStyle = rgba('#FFFDF6', wo); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 3:06.45–3:08.6  世 界 还 在 写: one character at a time, as big as the screen
const BT = [186.64, 187.10, 187.45, 187.74, 188.05], BBG = [COL.orange, '#2FA676', '#3F6FD0', COL.yellow, '#FFF6E2'], BRAY = ['#F6A05C', '#57C297', '#6F97E6', '#FBDD95', '#FCCB8E'], BFG = [COL.white, COL.white, COL.white, COL.ink], BRIM = [COL.orangeD, '#17835A', '#2D4FA3', COL.white];
export function sBig(ctx, t) {
  let i = -1; BT.forEach((T, k) => { if (t >= T) i = k; });
  if (i < 0) {
    ctx.fillStyle = COL.white; ctx.fillRect(0, 0, W, H);
    [COL.ink, ...WHO.map(w => w[0])].forEach((c, k) => { ctx.fillStyle = c; ctx.fillRect(840 + k * 76, 400, 14, 280); });
    finish(ctx, { light: 0.5 }); return;
  }
  const T = BT[i], sc = lerp(1.75, 1, E.out5(sat(t, T, T + 0.16))), sh = hit(t, T, 9) * 16, small = k => 150 + k * 122;
  cam(ctx, t, { z: 1 + 0.035 * sat(t, T, T + 0.5), x: Math.sin(t * 90) * sh, y: Math.cos(t * 70) * sh, seed: 65, hand: 4 }, () => {
    ctx.fillStyle = BBG[i]; ctx.fillRect(-300, -300, W + 600, H + 600);
    if (i < 4) {
      rays(ctx, 960, 540, t * 4 + i, 0.5, BRAY[i], 18);
      cutGlyph(ctx, TITLE[i], 960, 540, 760, BFG[i], { s: sc, rot: (i % 2 ? 0.03 : -0.03), rim: BRIM[i] });
      for (let k = 0; k < i; k++) cutGlyph(ctx, TITLE[k], small(k), 120, 96, BFG[i], { rim: BRIM[i] });
    } else {
      triBurst(ctx, t, 960, 640, 0.6);
      ctx.fillStyle = COL.white; ctx.beginPath(); ctx.arc(960, 640, 350 + 24 * pulse(t, 5), 0, TAU); ctx.fill();
      for (let k = 0; k < 4; k++) cutGlyph(ctx, TITLE[k], small(k), 120, 96, TRI[k % 3]);
      triGlyph(ctx, TITLE[4], 1560, 310, 440, { s: sc });
      confetti(ctx, t, T, 960, 800, 170, [...TRI, COL.white, COL.yellow], 540, 1.2);
      const ck = crouch(t, T), co = crouch(t, T + 0.04), cf = crouch(t, T + 0.08);
      char(ctx, 'k15', 430, 1085, 500, { lift: jump(t, T, 250), rot: -0.08, flutter: 4, blink: 0, sx: ck.sx, sy: ck.sy, shadowA: 0.8 });
      char(ctx, 'f13', 1330, 1085, 500, { lift: jump(t, T + 0.08, 230), rot: 0.08, flutter: 4, blink: 0, sx: cf.sx, sy: cf.sy, shadowA: 0.8 });
      char(ctx, 'o47', 880, 1090, 620, { lift: jump(t, T + 0.04, 255), flutter: 5, sway: 1.5, blink: 0, sx: co.sx, sy: co.sy, shadowA: 0.8 });
    }
  });
  finish(ctx, { light: 0.5 });
  const fl = hit(t, T, 9); if (fl > 0.01) { ctx.fillStyle = rgba('#FFFFFF', fl * 0.5); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 3:08.6–3:11.9  你一捺 我一撇
// Your stroke first. On its own it cannot stand: it starts to go over. Hers props it up, and the two of them are 人.
const bez = (P0, C, P1) => u => [(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * C[0] + u * u * P1[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * C[1] + u * u * P1[1]];
export function sRen(ctx, t) {
  const NA = [189.15, 189.58], PIE = [190.95, 191.52], CX = 1090, TOP = 170, HH = 580, OX = 420;
  const foot = [CX + 0.5 * HH, TOP + HH];
  const na = E.io(sat(t, NA[0], NA[1])), pie = E.io(sat(t, PIE[0], PIE[1])), dtc = t - PIE[1];
  const lean = dtc >= 0 ? -0.42 * Math.exp(-8 * dtc) * Math.cos(15 * dtc) : -0.42 * E.io(sat(t, NA[1] + 0.05, PIE[0] + 0.35)) + Math.sin(t * 13) * 0.02 * sat(t, NA[1], NA[1] + 0.3);
  const NAF = bez([CX - 26, TOP + 0.33 * HH], [CX + 0.1 * HH, TOP + 0.66 * HH], foot), PIEF = bez([CX + 14, TOP], [CX - 30, TOP + 0.5 * HH], [CX - 0.5 * HH, TOP + HH]);
  cam(ctx, t, { z: 1.02 + 0.03 * sat(t, 188.6, 191.9) + 0.03 * hit(t, PIE[1], 6), cx: 960, cy: 560, seed: 66 }, () => {
    blankPage(ctx);
    if (dtc > 0) { rays(ctx, CX, TOP + HH * 0.55, t * 0.8, 0.2 * sat(dtc, 0, 0.3), COL.peach, 14); }
    ctx.fillStyle = 'rgba(60,40,20,0.1)'; ctx.beginPath(); ctx.ellipse(CX, TOP + HH + 14, 60 + 300 * Math.max(na * 0.5, pie), 16, 0, 0, TAU); ctx.fill();
    // 捺: yours
    ctx.save(); ctx.translate(foot[0], foot[1]); ctx.rotate(lean); ctx.translate(-foot[0], -foot[1]);
    stroke(ctx, NAF, u => 18 + 50 * Math.pow(Math.min(1, u / 0.82), 1.4) - 16 * sat(u, 0.86, 1), na, COL.ink);
    const hd = NAF(na);
    if (t >= 188.72 && na < 1) namedCaret(ctx, hd[0] + 14, hd[1] - 60, 110, COL.ink, '你', true, 1, 1.6);
    ctx.restore();
    if (na >= 1) namedCaret(ctx, foot[0] + 70, foot[1] - 70, 110, COL.ink, '你', ((t % 0.86) < 0.5), 1, 1.6);
    // 撇: hers
    stroke(ctx, PIEF, u => 56 - 44 * Math.pow(u, 0.8), pie, COL.orange);
    sparkle(ctx, t, PIE[1], CX - 10, TOP + 0.36 * HH, COL.yellow, 12, 60, 190);
    confetti(ctx, t, PIE[1], CX, TOP + HH * 0.5, 70, [...TRI, COL.yellow, COL.white], 550, 0.7);
    // 橙子, with the pencil that does it
    const ready = sq(t, 190.10, 1.6), b = breathe(t), go = Math.sin(sat(t, PIE[0] - 0.1, PIE[1] + 0.1) * Math.PI) * 60 + 20 * E.out(sat(t, 190.10, 190.3)) * (1 - sat(t, PIE[1], PIE[1] + 0.3));
    const sw = -0.16 * E.out(sat(t, 190.10, 190.4)) + 0.3 * E.io(sat(t, PIE[0], PIE[1])) - 0.14 * E.io(sat(t, PIE[1], PIE[1] + 0.3));          // wind up, swing through, settle
    char(ctx, 'o48', OX, 1010, 560, { sx: ready.sx * b.sx, sy: ready.sy * b.sy, lift: go, rot: sw, flutter: 3 });
    if (pie > 0 && pie < 1) { const a0 = anchor('o48', 0, 0, 560, PT.o48[0], PT.o48[1]), tp = [OX + a0[0] * Math.cos(sw) - a0[1] * Math.sin(sw), 1010 - go + a0[0] * Math.sin(sw) + a0[1] * Math.cos(sw)], hp = PIEF(pie); ctx.save(); ctx.setLineDash([4, 16]); ctx.lineCap = 'round'; ctx.strokeStyle = rgba(COL.orange, 0.9); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tp[0], tp[1] - 16); ctx.quadraticCurveTo((tp[0] + hp[0]) / 2, Math.min(tp[1], hp[1]) - 120, hp[0], hp[1]); ctx.stroke(); ctx.restore(); }
    [['k16', 1590, 0.0, 280], ['f14', 1786, 0.07, 280]].forEach(([id, x, d, sz]) => {       // and the other two were never going to miss this
      const T = PIE[1] + d, p = sat(t, T, T + 0.3); if (p <= 0) return;
      char(ctx, id, x, 1030 + (1 - E.back(p)) * 500, sz, { lift: jump(t, T, 90), blink: 0, flutter: 3 });
    });
  });
  bokeh(ctx, t, { n: 8, seed: 170, alpha: 0.1, colors: [COL.peach, COL.yellow, COL.white] });
  finish(ctx, { light: 0.7 });
}
