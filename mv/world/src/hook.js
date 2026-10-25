// The opening for short-video feeds (?hook=1). The film starts on the first sung line instead of the 14 s
// instrumental intro, and the first verse, up to the dry shoes, is staged bigger:
//   sHook    1.65 s  what the intro showed (everything people wrote, drawn into her) happens in one second: sentences
//                    are pulled in from every side, 我 · 认 · 识 go in after them, and on 海 her eyes open. Then the
//                    camera goes in through her eye.
//   sSea2            what she knows of the sea is on the other side: the character. Words stream out of her book and
//                    fill it up like a glass; 三点水 really drips; then the pull-back, and it is a sea of the word.
//   sShoes2          she tries the sea of the word for herself: a toe, then a run and a jump for the splash.
//                    The splash is characters too; she sits in them and looks at her boot. Dry.
import { W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, COL, mix, rgba, drawGlyph, text, measure, rrect, paper, flower, MEMO } from './lib.js';
import { char, breathe } from './chars.js';
import { finish, bokeh, cam, cut } from './fx.js';
import { hit, sq, rays, star4, shore, SY, TAGS, tagLayout, ROWS, HX, HY, HS, seaParts, seaField } from './scenes1.js';
import { cutGlyph } from './scenes2.js';
import { anchor, headAt } from './scenes4.js';

export const HOOK = { off: 14.35, eye: 15.22, out: 15.80, end: 16.0 };
const HK = { x: 988, y: 1110, s: 1040, cx: 960, cy: 650 }, HKK = HK.s / 1137;
const EYEPT = [HK.x + (674 - 579.5) * HKK, HK.y - (968 - 550) * HKK];          // her right eye on screen
const LYR = [['我', 14.46, -1], ['认', 14.75, 1], ['识', 15.01, -1], ['海', 15.22, 1]];
// lanes the sentences come in along. The two horizontal ones are kept for the lyric; nothing comes up from below.
const LANES = [-160, -146, -132, -118, -104, -90, -76, -62, -48, -34, -20, 22, 158].map(d => (d * Math.PI) / 180);
const QS = 1.33, FLOW = 7;
function phase(t) {                       // how far the sentences have moved, in characters
  const tt = Math.min(t, HOOK.eye);
  let p = FLOW * (tt - 14);
  for (const [, T] of LYR) p += 0.7 * E.out(sat(tt, T - 0.04, T + 0.14));          // a tug on every syllable
  if (t > HOOK.eye) p -= 6.5 * E.out(sat(t, HOOK.eye, HOOK.eye + 0.5));            // and when she wakes, they are blown back out
  return p;
}
export function sHook(ctx, t) {
  const u = sat(t, HOOK.out, HOOK.end), woke = t >= HOOK.eye;
  let tug = 0; for (const [, T] of LYR) tug += hit(t, T, 12);
  const z0 = 1.0 + 0.05 * sat(t, HOOK.off, HOOK.eye) + 0.012 * tug - 0.05 * E.out(sat(t, HOOK.eye, HOOK.eye + 0.2)) + 0.035 * hit(t, HOOK.eye, 6) + 0.02 * sat(t, HOOK.eye, HOOK.out);
  const eo = E.out(u), z = z0 * (1 + 13 * E.in(u));
  cam(ctx, t, { z, cx: lerp(HK.cx, EYEPT[0], eo), cy: lerp(HK.cy, EYEPT[1], eo), seed: 81, hand: woke ? 2 : 4 }, () => {
    ctx.fillStyle = '#FBF3E2'; ctx.fillRect(-300, -300, W + 600, H + 600);
    const g = ctx.createRadialGradient(HK.cx, HK.cy, 60, HK.cx, HK.cy, 1000);
    g.addColorStop(0, rgba(COL.peach, 0.95)); g.addColorStop(1, rgba(COL.peach, 0.1));
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    rays(ctx, HK.cx, HK.cy, t * 1.6, 0.22 + 0.2 * hit(t, HOOK.eye, 3), '#FCCB8E', 16);
    // the sentences
    const p = phase(t), fade = 1 - sat(t, HOOK.eye + 0.05, HOOK.eye + 0.42);
    if (fade > 0) LANES.forEach((an, i) => {
      const s = p + rnd(i, 71) * 1, m = Math.floor(s), f = s - m, str = MEMO[(i * 5 + 2) % MEMO.length].replace(/[，。！？、]/g, '');
      for (let j = 0; j < 7; j++) {
        const r = 235 * Math.pow(QS, j + 1 - f); if (r > 1300) break;
        const idx = ((m + j) % str.length + str.length) % str.length, size = 0.19 * r;
        drawGlyph(ctx, str[idx], HK.cx + Math.cos(an) * r, HK.cy + Math.sin(an) * r, size, { weight: 800, color: (m + j) % 5 === 0 ? COL.orangeD : COL.ink, alpha: 0.9 * fade * sat(r, 1300, 1080) * sat(r, 235, 330), rot: Math.cos(an) * 0.12 });
      }
    });
    // 我 · 认 · 识 go in; 海 stays where she can see it
    LYR.forEach(([ch, T, side], i) => {
      const last = i === 3, pop = E.back(sat(t, T - 0.07, T + 0.04)); if (pop <= 0) return;
      const nx = last ? 1e9 : LYR[i + 1][1], gone = last ? 0 : E.in(sat(t, nx - 0.17, nx)); if (gone >= 1) return;
      const x = HK.cx + side * lerp(last ? 660 : 690, 140, gone), y = HK.cy - (last ? 110 : 70) + 40 * gone + (last ? Math.sin(t * 3) * 6 : 0);
      const size = (last ? 370 : 300) * (0.5 + 0.5 * pop) * (1 - 0.72 * gone) * (last ? 1 + 0.06 * hit(t, T, 6) : 1);
      if (last) rays(ctx, x, y, -t * 2, 0.16 * hit(t, T, 2.5), COL.yellow, 12);
      cutGlyph(ctx, ch, x, y, size, COL.orange, { rot: side * -0.07 * (1 - gone), alpha: Math.min(1, pop * 2) });
    });
    // 橙子
    const b = breathe(t, 0.6), s = sq(t, HOOK.eye, 1.8), blink = woke ? 1 - E.out(sat(t, HOOK.eye, HOOK.eye + 0.09)) : 1;
    const bounce = woke ? 18 * Math.abs(Math.sin(sat(t, HOOK.eye, HOOK.eye + 0.34) * Math.PI)) : 3 * tug;
    char(ctx, 'o13', HK.x, HK.y - bounce, HK.s, { blink, sway: 1.5, flutter: (woke ? 0 : 5) + 3 * hit(t, HOOK.eye, 4), shadow: false, sx: b.sx * s.sx, sy: b.sy * s.sy });
    const rp = sat(t, HOOK.eye, HOOK.eye + 0.5);
    if (rp > 0 && rp < 1) { ctx.strokeStyle = rgba(COL.white, 0.9 * (1 - rp)); ctx.lineWidth = 26 * (1 - rp) + 3; ctx.beginPath(); ctx.arc(HK.cx, HK.cy, 220 + 1100 * E.out(rp), 0, TAU); ctx.stroke(); }
  });
  bokeh(ctx, t, { n: 10, seed: 180, alpha: 0.2, minR: 30, maxR: 110, vx: 22, colors: [COL.white, COL.peach, COL.yellow] });
  finish(ctx);
  const fl = 0.7 * hit(t, HOOK.eye, 9) + Math.pow(E.in(u), 1.3);
  if (fl > 0.004) { ctx.fillStyle = rgba('#FFF7DB', Math.min(1, fl)); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ the sea, on the other side of her eye (16.0–24.58)
const SEATXT = '今天的海是灰蓝色的海水是咸的浪打在礁石上退潮了沙滩很长海鸥跟着船飞潮水带走了脚印远处有一艘船我们在海边等日出海风吹了一整夜夏天去看海吧海的那边还是海';
const RIB = [[236, 330], [420, 470], [604, 700]], RT0 = 16.12, RT1 = 17.92, RDU = 0.1, RSP = 1.25;
const bez = (P0, C, P1, u) => [(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * C[0] + u * u * P1[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * C[1] + u * u * P1[1]];
const ZC = [100, 554], JOIN = 20.28, DROPT = [17.98, 18.36, 18.52];
export function sSea2(ctx, t) {
  const PT = seaParts(), hx2 = 1180, hy2 = ROWS[4][0], hs2 = ROWS[4][1];
  const ez = 1 + 0.2 * (1 - E.io(sat(t, 20.42, 21.3))) + 0.07 * (1 - E.out(sat(t, 16.0, 16.45))) + 0.018 * hit(t, JOIN, 7);
  ctx.save(); ctx.translate(ZC[0], ZC[1]); ctx.scale(ez, ez); ctx.translate(-ZC[0], -ZC[1]);
  cam(ctx, t, { z: 1.01 + 0.035 * sat(t, 13.8, 24.6), cx: 1100, cy: 560, seed: 2 }, () => {
    paper(ctx);
    if (t >= 21.06) {
      for (let i = 0; i < TAGS.length; i++) {
        const ts = 21.3 + i * 0.2; if (t < ts) continue;
        const TL = tagLayout(ctx)[i], x = TL[0] - (t - ts) * 10, y = TL[1], a = sat(t, ts, ts + 0.2) * 0.92, w = measure(ctx, TAGS[i], 40, 500, undefined, 3);
        const pk = 1 + 0.22 * (1 - E.out(sat(t, ts, ts + 0.28)));          // each one lands with a little weight
        ctx.save(); ctx.translate(x, y); ctx.scale(pk, pk); text(ctx, TAGS[i], 0, 0, { size: 40, weight: 700, color: COL.ink, alpha: a, ls: 3 }); ctx.restore();
        ctx.fillStyle = rgba(COL.orange, 0.8 * a); ctx.fillRect(x - w / 2, y + 33, w * sat(t, ts + 0.1, ts + 0.5), 4);
      }
      const n = Math.max(1, Math.round(10000 * E.in(sat(t, 21.22, 24.1))));
      text(ctx, `第 ${n} 个人`, 1850, 66, { size: 52, weight: 700, align: 'right', color: n >= 10000 ? COL.orangeD : COL.inkSoft, alpha: sat(t, 21.2, 21.5), ls: 2 });
      ctx.strokeStyle = rgba(COL.ink, 0.5 * sat(t, 21.2, 21.8)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(660, 606); ctx.lineTo(W + 200, 606); ctx.stroke();
      seaField(ctx, t, hx2, hy2);
    }
    shore(ctx);
    // 是从字开始的: the words leave her book in three ribbons and pour into the character
    const ra = sat(t, RT0, RT0 + 0.2) * (1 - sat(t, RT1 - 0.2, RT1));
    if (ra > 0) RIB.forEach(([ye, co], i) => {
      const P0 = [512, 588], P1 = [1002, ye], C = [740, co], p = (t - RT0) * RSP + i * 0.037;
      for (let k = Math.max(0, Math.ceil((p - 1) / RDU)); k <= Math.floor(p / RDU); k++) {
        const uu = p - k * RDU, q = bez(P0, C, P1, uu), q2 = bez(P0, C, P1, Math.min(1, uu + 0.02));
        const idx = (((i * 23 - k) % SEATXT.length) + SEATXT.length) % SEATXT.length;
        drawGlyph(ctx, SEATXT[idx], q[0], q[1], lerp(24, 52, Math.pow(uu, 0.7)), { weight: 800, color: k % 6 === 0 ? COL.orangeD : COL.ink, alpha: ra * sat(uu, 0.03, 0.2) * (1 - sat(uu, 0.9, 1)), rot: Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 0.6 });
      }
    });
    // 海
    const ap = sat(t, 16.0, 16.2);
    if (ap > 0) {
      const hp = E.io(sat(t, 21.06, 21.95)), cx = lerp(HX, hx2, hp), cy = lerp(HY, hy2, hp), size = lerp(HS, hs2, hp);
      const join = E.io(sat(t, 19.7, 20.26)), sp1 = E.io(sat(t, 17.98, 18.45)), sp2 = E.io(sat(t, 18.85, 19.25));
      const dL = -100 * sp1 * (1 - join), dR = 80 * sp2 * (1 - join);
      const lvl = sat(t, 16.22, 17.88), full = lvl >= 1;
      const bump = 1 + 0.09 * hit(t, JOIN, 9) + 0.05 * hit(t, 17.88, 9) + 0.03 * hit(t, 19.2, 10), k0 = lerp(0.7, 1, E.back(ap)) * bump;
      const g = PT.ink, go = PT.tint, k = (size / g.q) * k0, d = g.s * k, sxp = g.s * g.gap;
      const tint = sp1 * (1 - sat(t, 20.4, 21.0)), A = ap * (1 - sat(t, 21.85, 22.0));
      const both = () => { ctx.drawImage(g.l, cx - d / 2 + dL, cy - d / 2, d, d); ctx.drawImage(g.r, cx - d / 2 + dR, cy - d / 2, d, d); };
      ctx.save();
      if (!full) {                                   // an empty glass in the shape of the word, filling with ink
        const yb = cy + size * 0.5, yt = cy - size * 0.5, yl = lerp(yb, yt, lvl);
        ctx.globalAlpha = A * 0.15; both();
        ctx.globalAlpha = A; ctx.beginPath(); ctx.moveTo(cx - d, yb + 40);
        for (let x = cx - d; x <= cx + d; x += 20) ctx.lineTo(x, yl + Math.sin(x * 0.03 + t * 7) * 7 * (1 - lvl));
        ctx.lineTo(cx + d, yb + 40); ctx.closePath(); ctx.clip(); both();
      } else {
        ctx.globalAlpha = A; ctx.shadowColor = 'rgba(90,50,15,0.18)'; ctx.shadowBlur = 24 * (1 - hp); ctx.shadowOffsetY = 10 * (1 - hp);
        both(); ctx.shadowColor = 'transparent';
        if (tint > 0) { ctx.globalAlpha = A * tint; ctx.drawImage(go.l, cx - d / 2 + dL, cy - d / 2, d, d); }
      }
      ctx.restore();
      const fp = sat(t, 17.88, 18.3);                 // full
      if (fp > 0 && fp < 1) { ctx.strokeStyle = rgba(COL.ink, 0.5 * (1 - fp)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 300 + 130 * E.out(fp), 0, TAU); ctx.stroke(); }
      // 三 · 点 · 水: one drop off each stroke
      g.dots.slice(0, 3).forEach((dt, j) => {
        const T = DROPT[j], dtm = t - T; if (dtm < 0 || dtm > 1.1) return;
        const x = cx - d / 2 + dt[0] * d + dL, y0 = cy - d / 2 + dt[1] * d, floor = cy + size * 0.5 + 22, tf = Math.sqrt((floor - y0 - 30) / 1500), y = y0 + 30 + 1500 * dtm * dtm;
        const rr = sat(dtm, 0, 0.3); if (rr < 1) { ctx.strokeStyle = rgba(COL.orange, 0.8 * (1 - rr)); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y0, 30 + 60 * E.out(rr), 0, TAU); ctx.stroke(); }
        if (dtm < tf) {
          ctx.fillStyle = COL.orange; ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y - 26); ctx.bezierCurveTo(x + 15, y - 6, x + 13, y + 13, x, y + 13); ctx.bezierCurveTo(x - 13, y + 13, x - 15, y - 6, x, y - 26); ctx.fill(); ctx.stroke();
        } else {
          const sp = sat(dtm, tf, tf + 0.45);
          if (sp < 1) { ctx.strokeStyle = rgba(COL.orange, 0.9 * (1 - sp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(x, floor, 16 + 70 * E.out(sp), 5 + 16 * E.out(sp), 0, 0, TAU); ctx.stroke(); for (const sg of [-1, 1]) { ctx.fillStyle = rgba(COL.orange, 1 - sp); ctx.beginPath(); ctx.arc(x + sg * 34 * sp, floor - 46 * Math.sin(sp * Math.PI), 6 * (1 - sp) + 1, 0, TAU); ctx.fill(); } }
        }
      });
      const la = sat(t, 18.05, 18.35) * (1 - sat(t, 19.9, 20.2));
      if (la > 0) {
        const lx = cx - d / 2 + g.lcx * d + dL, lb = sat(t, 19.15, 19.4) * (1 - sat(t, 19.9, 20.2));
        const mx = cx + 100 + dR, e0 = lx + measure(ctx, '三点水', 48, 600, undefined, 4) / 2, e1 = mx - measure(ctx, '每', 48, 600) / 2;
        text(ctx, '三点水', lx, cy + 376, { size: 48, weight: 600, color: COL.orangeD, alpha: la, ls: 4 });
        text(ctx, '每', mx, cy + 376, { size: 48, weight: 600, alpha: lb });
        text(ctx, '+', (e0 + e1) / 2, cy + 376, { size: 48, weight: 400, color: COL.orange, alpha: lb });          // half-way between the two words
      }
      const sp = sat(t, JOIN, JOIN + 0.62);          // 这样写: together, with a bang
      if (sp > 0 && sp < 1) {
        for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU + 0.2, r = 290 + 250 * E.out(sp); ctx.fillStyle = rgba(i % 3 ? COL.ink : COL.orange, 1 - sp); ctx.beginPath(); ctx.arc(HX + Math.cos(an) * r, HY + Math.sin(an) * r * 0.85, 10 * (1 - sp) + 2, 0, TAU); ctx.fill(); }
        ctx.strokeStyle = rgba(COL.orange, 0.8 * (1 - sp)); ctx.lineWidth = 16 * (1 - sp) + 2; ctx.beginPath(); ctx.arc(HX, HY, 280 + 300 * E.out(sp), 0, TAU); ctx.stroke();
        for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + 0.5; star4(ctx, HX + Math.cos(an) * (330 + 120 * sp), HY + Math.sin(an) * (300 + 100 * sp), 26 * Math.sin(sp * Math.PI), COL.orange, 1); }
      }
    }
    // 橙子: reading; then "like this"; then, look
    const b = breathe(t), pose = t < 19.66 ? 'o02' : t < 21.2 ? 'o54' : 'o55';
    const s = sq(t, t < 19.66 ? 16.38 : t < 21.2 ? (t < JOIN ? 19.66 : JOIN) : 21.2, 1.4);
    char(ctx, pose, 330, SY, 600, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot, lift: pose === 'o54' ? 22 * Math.abs(Math.sin(sat(t, JOIN, JOIN + 0.36) * Math.PI)) : 0, windX: pose === 'o55' ? -5 : 0, flutter: pose === 'o55' ? 2 : 0 });
    if (ra > 0) for (let i = 0; i < 5; i++) {         // the page she is reading from
      const ph = (((t - RT0) * 2.2 + i / 5) % 1); ctx.fillStyle = rgba(COL.orange, 0.7 * ra * (1 - ph)); ctx.beginPath(); ctx.arc(512 + (i - 2) * 9, 588 - ph * 46, 5 * (1 - ph) + 1.5, 0, TAU); ctx.fill();
    }
  });
  ctx.restore();
  bokeh(ctx, t, { n: 8, seed: 50, alpha: 0.11 });
  finish(ctx);
  const wsh = 1 - E.out(sat(t, 16.0, 16.24)); if (wsh > 0.004) { ctx.fillStyle = rgba('#FFF7DB', wsh); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 没有一个 替我湿过鞋 (24.58–27.6)
// She wants to know what the sea feels like, and here is a whole sea of it: the word. So she tries it. A toe, twice;
// the characters only shuffle out of the way. Then a run and a jump, knees tucked, for the splash. The splash is
// characters too. They come down around her like leaves. She sits in the middle of them and looks at her boot: dry.
// (An earlier version had a great wave rear up over her while she hid behind her book. Wrong: she is not afraid of the
// sea, she is longing for it.)
const SH = { dips: [25.0, 25.25], back: 25.47, run: 25.62, off: 25.86, land: 26.65, sit: 26.92, look: 27.0, dry: 27.3,
  x0: 500, take: 590, x1: 1380, y1: 900, s: 460, pan: 400 };
const SHROWS = [[628, 30, 0.6], [665, 40, 0.5], [715, 54, 0.38], [780, 70, 0.24], [858, 88, 0.08]];
const P7 = { toe: [790, 1100], boot: [245, 470], crown: [560, 30] };          // on o61 and o60, in their own pixels
function seaOfWords(ctx, t, camX, toe) {
  const R = 330 * E.out(sat(t, SH.land, SH.land + 0.22));
  SHROWS.forEach(([y0, size, far], r) => {
    const step = size * 1.3, col = mix(COL.ink, COL.paper, far), xs = 700 + ((r * 53) % step) + Math.sin(t * 0.8 + r * 0.9) * size * 0.3;
    for (let c = 0; ; c++) {
      let x = xs + c * step; if (x > camX + 1900) break; if (x < camX - 60) continue;
      const wv = Math.sin(t * 2.0 + x * 0.006 + r * 1.3); let y = y0 + wv * size * 0.16, rot = wv * 0.07;
      for (const T of SH.dips) {                       // a toe: the nearest ones hop out of the way
        const e = hit(t, T, 4.5), d = Math.hypot(x - toe[0], (y - toe[1]) * 1.4);
        if (e > 0.01 && d < 200) { const f = (1 - d / 200) * e; x += 50 * f; y -= 34 * f * Math.abs(Math.sin((t - T) * 14)); rot += 0.45 * f; }
      }
      let k = 1;
      if (R > 1) k = sat(Math.hypot(x - SH.x1, (y - SH.y1 + 60) * 2.0), R * 0.8, R);          // where she comes down they are gone: they are the splash
      if (k <= 0.02) continue;
      drawGlyph(ctx, '海', x, y, size * k, { weight: 800, rot, color: col });
    }
  });
}
function wordSplash(ctx, t) {                      // what comes up when she lands
  const dt = t - SH.land; if (dt < 0) return;
  const G = 4200;
  for (let i = 0; i < 88; i++) {
    const keep = i % 6 === 0, an = ((20 + rnd(i, 781) * 140) * Math.PI) / 180, v = 700 + rnd(i, 782) * 1150, vy = -Math.sin(an) * v;
    const x0 = SH.x1 + (rnd(i, 783) - 0.5) * 150, y0 = SH.y1 - 30, yg = keep ? 836 + rnd(i, 784) * 44 : SH.y1 - 70 + rnd(i, 784) * 80;
    const tl = (-vy + Math.sqrt(Math.max(0, vy * vy + 2 * G * (yg - y0)))) / G, tt = Math.min(dt, tl), rest = dt - tl;
    const side = rnd(i, 788) < 0.5 ? -1 : 1, vx = keep ? (SH.x1 + side * (236 + rnd(i, 789) * 70) - x0) / tl : Math.cos(an) * v * 0.7;
    let x = x0 + vx * tt, y = y0 + vy * tt + 0.5 * G * tt * tt, a = Math.min(1, dt * 14), rot = (rnd(i, 785) - 0.5) * 16 * tt;
    if (rest > 0) {
      if (!keep) a *= 1 - sat(rest, 0, 0.16);        // most go back into the sea
      else { y = yg - 28 * Math.exp(-7 * rest) * Math.abs(Math.sin(rest * 17)); rot = (rnd(i, 787) - 0.5) * 1.2; }      // a few stay where they fell, like leaves
    }
    if (a <= 0.01) continue;
    drawGlyph(ctx, '海', x, y, 28 + rnd(i, 786) * (keep ? 28 : 44), { weight: 900, color: i % 7 === 0 ? COL.orangeD : mix(COL.ink, COL.paper, rnd(i, 790) * 0.4), alpha: a, rot });
  }
}
export function sShoes2(ctx, t) {
  const camX = SH.pan * E.io(sat(t, SH.off - 0.12, SH.land + 0.12)), shake = hit(t, SH.land, 9), toe = anchor('o61', SH.x0, SY, SH.s, P7.toe[0], P7.toe[1]);
  cam(ctx, t, { z: 1.25 + 0.09 * E.io(sat(t, SH.look, 27.6)) + 0.015 * shake, cx: 760, cy: 760, seed: 3, y: Math.cos(t * 55) * 7 * shake }, () => {
    paper(ctx);
    ctx.translate(-camX, 0);
    ctx.strokeStyle = rgba(COL.ink, 0.5); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(660, 606); ctx.lineTo(camX + W + 300, 606); ctx.stroke();
    seaOfWords(ctx, t, camX, toe);
    shore(ctx);
    // 橙子
    const b = breathe(t, 1.3);
    if (t < SH.run) {                                // a toe, twice; then two steps back
      let dip = 0; for (const T of SH.dips) dip += Math.sin(sat(t, T - 0.12, T + 0.16) * Math.PI);
      const back = E.out(sat(t, SH.back, SH.run));
      char(ctx, 'o61', SH.x0 - 60 * back + 10 * dip, SY, SH.s, { sx: b.sx * (1 + 0.05 * back), sy: b.sy * (1 - 0.1 * back), rot: 0.045 * dip - 0.05 * back });
      for (const T of SH.dips) {                     // not a ripple: a little dust
        const p = sat(t, T, T + 0.3); if (p <= 0 || p >= 1) continue;
        ctx.strokeStyle = rgba(COL.ink, 0.7 * (1 - p)); ctx.lineWidth = 3.5; ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) { const an = -0.5 - i * 0.55, r0 = 16 + 26 * p; ctx.beginPath(); ctx.moveTo(toe[0] + Math.cos(an) * r0, toe[1] + Math.sin(an) * r0); ctx.lineTo(toe[0] + Math.cos(an) * (r0 + 12), toe[1] + Math.sin(an) * (r0 + 12)); ctx.stroke(); }
      }
    } else if (t < SH.off) {                         // the run-up
      const p = sat(t, SH.run, SH.off);
      char(ctx, Math.floor(p * 4) % 2 ? 'o06' : 'o11', lerp(SH.x0 - 60, SH.take, p * p), SY, SH.s, { rot: 0.1, lift: 10 * Math.abs(Math.sin(p * Math.PI * 4)), windX: -10, flutter: 4 });
    } else if (t < SH.land) {                        // and over
      const u = sat(t, SH.off, SH.land), x = lerp(SH.take, SH.x1, u), y = lerp(SY, SH.y1, u) - 4 * 250 * u * (1 - u), k = SH.s / 1137;
      ctx.fillStyle = rgba('#3A2A1A', 0.12 * (1 - 2 * Math.abs(u - 0.5)) + 0.05); ctx.beginPath(); ctx.ellipse(x, lerp(SY, SH.y1, u) + 6, 70, 10, 0, 0, TAU); ctx.fill();
      if (u < 0.52) char(ctx, 'o58', x, y - 250 * k, SH.s, { rot: lerp(-0.16, 0.08, u * 2), shadow: false, windX: -12, flutter: 5 });
      else char(ctx, 'o59', x, y, SH.s, { rot: 0.1 * (1 - u) * 2, shadow: false, flutter: 6, sway: 1.4, blink: 0 });
    } else if (t < SH.sit) {                         // down
      const p = sat(t, SH.land, SH.sit), sqz = 0.24 * (1 - E.out(p));
      char(ctx, 'o59', SH.x1, SH.y1, SH.s, { sx: 1 + sqz * 0.6, sy: 1 - sqz, flutter: 3, blink: 0 });
    } else {                                         // sitting in it, looking at her boot
      const s = sq(t, SH.sit, 1.8), s2 = sq(t, SH.dry, 1.2), tilt = Math.sin((t - SH.sit) * 7) * 0.02 * (1 - sat(t, SH.dry, SH.dry + 0.3));
      char(ctx, 'o60', SH.x1, SH.y1 + 14, SH.s, { sx: b.sx * s.sx * s2.sx, sy: b.sy * s.sy * s2.sy, rot: tilt });
    }
    wordSplash(ctx, t);
    const lp = sat(t, SH.land, SH.land + 0.45);       // the ring a splash would have made
    if (lp > 0 && lp < 1) { ctx.strokeStyle = rgba(COL.ink, 0.5 * (1 - lp)); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(SH.x1, SH.y1 - 20, 90 + 330 * E.out(lp), 26 + 90 * E.out(lp), 0, 0, TAU); ctx.stroke(); }
    if (t >= SH.sit) {
      const hat = sat(t, SH.look, SH.look + 0.22), C = anchor('o60', SH.x1, SH.y1 + 14, SH.s, P7.crown[0], P7.crown[1]);          // one of them comes down on her head, and stays
      if (hat > 0) drawGlyph(ctx, '海', C[0] + 6, C[1] - 6 - (1 - E.out(hat)) * 300 - 10 * hit(t, SH.look + 0.22, 9), 58, { weight: 900, color: COL.ink, rot: 0.3 - 0.5 * (1 - hat) });
      const B = anchor('o60', SH.x1, SH.y1 + 14, SH.s, P7.boot[0], P7.boot[1]), dp = sat(t, SH.dry, SH.dry + 0.5);          // dry
      if (dp > 0 && dp < 1) [[-56, -30], [40, -52], [-10, 44]].forEach(([dx, dy], i) => star4(ctx, B[0] + dx * (1 + 0.5 * dp), B[1] + dy * (1 + 0.5 * dp), (20 + i * 5) * Math.sin(dp * Math.PI), COL.orange, 1));
      const qa = sat(t, SH.dry + 0.02, SH.dry + 0.2);
      if (qa > 0) { const Hh = headAt('o60', SH.x1, SH.y1 + 14, SH.s); drawGlyph(ctx, '？', Hh[0] + 190, Hh[1] - 150 + Math.sin(t * 4) * 6, 112, { weight: 800, color: COL.orange, alpha: qa, rot: 0.18, sx: 0.6 + 0.4 * E.back(qa), sy: 0.6 + 0.4 * E.back(qa) }); }
    }
  });
  bokeh(ctx, t, { n: 7, seed: 60, alpha: 0.1 });
  finish(ctx);
}
