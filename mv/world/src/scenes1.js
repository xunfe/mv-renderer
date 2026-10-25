// Scenes 0:00–0:56 — intro, verse 1, pre-chorus. Times are seconds on the 104 s cut; cuts sit on bar lines.
// Palette until the chorus: paper, ink, orange. She has read the word “蓝” and never seen the colour.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, COL, mix, rgba, pulse, glyph, drawGlyph, text, measure, paper, rrect, caret, MEMO } from './lib.js';
import { char, bop, breathe, walkBob, walkPose } from './chars.js';
import { finish, bokeh, cam, cut, softGlyph } from './fx.js';

export const hit = (t, t0, k = 10) => (t < t0 ? 0 : Math.exp(-k * (t - t0)));       // decaying impact since t0
export const sq = (t, t0, amt = 1) => { const b = hit(t, t0); return { sx: 1 + 0.06 * amt * b, sy: 1 - 0.08 * amt * b }; };
const INKS = ['#2B2320', '#40352F', '#574A42', '#2B2320', '#6B5F57'];
export function star4(ctx, x, y, r, color, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color; ctx.translate(x, y);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.28 : r, an = (i / 8) * TAU; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function rays(ctx, cx, cy, t, a, color = COL.peach, n = 14) {
  if (a <= 0) return;
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.12); ctx.fillStyle = rgba(color, a);
  for (let i = 0; i < n; i++) {
    ctx.rotate(TAU / n); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(2600, -2600 * Math.tan(TAU / n / 4)); ctx.lineTo(2600, 2600 * Math.tan(TAU / n / 4)); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
export function miniPage(ctx, x, y, w, h, rot, a = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(60,40,20,0.18)'; ctx.fillRect(-w / 2 + 5, -h / 2 + 7, w, h);
  ctx.fillStyle = COL.white; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.lineWidth = Math.max(1.5, w * 0.02); ctx.strokeStyle = COL.ink; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = rgba(COL.ink, 0.35);
  for (let i = 0; i < 5; i++) ctx.fillRect(-w * 0.36, -h * 0.32 + i * h * 0.15, w * (i === 4 ? 0.4 : 0.72), Math.max(2, h * 0.035));
  ctx.restore();
}

// ------------------------------------------------------------------ 0:00–0:12  the page fills with other people's days
const TX = 150, TY = 470, TS = 190, TSTEP = 200;
const TT = [9.6, 10.04, 10.48, 10.91, 11.36];
const TITLE = '世界还在写';
const OX = 1440, OFEET = 930, OSIZE = 640;
let LINES = null;
function memoLines(ctx) {
  if (LINES) return LINES;
  const items = [];
  let k = 0;
  for (let r = 0; r < 18; r++) {
    const y = 66 + r * 55;
    let x = -160 + rnd(r, 11) * 260;
    while (x < W + 40) {
      const str = MEMO[(k * 7 + 3 + r * 5) % MEMO.length], size = r % 5 === 2 ? 36 : 30;
      const w = measure(ctx, str, size, 400, undefined, 2);
      const inTitle = x < 1210 && x + w > 80 && y > 330 && y < 690;
      if (!inTitle) items.push({ str, size, x, y, w, k });
      x += w + 130 + rnd(k, 12) * 150; k++;
    }
  }
  const mid = it => (it.x > 120 && it.x + it.w < 1800 && it.y > 100 && it.y < 960 ? 0 : 1);
  const order = items.map((it, i) => [mid(it) + rnd(it.k, 13), i]).sort((a, b) => a[0] - b[0]).map(e => e[1]);
  order.forEach((idx, n) => {
    const it = items[idx], early = n < 15; it.early = early;
    it.t0 = early ? 0.35 + n * 0.43 : 6.97 + rnd(it.k, 14) * 2.0;
    it.cps = early ? 13 : 36; it.a = early ? 0.62 : 0.26 + rnd(it.k, 15) * 0.2; it.ab = 8.5 + rnd(it.k, 16) * 2.7;
    if (early) { it.str = MEMO[(n * 5 + 1) % MEMO.length]; it.size = 38; it.w = measure(ctx, it.str, 38, 400, undefined, 2); }
  });
  // the early lines grew, so re-space every row: no line may touch its neighbour or wander under the title
  const rows = new Map();
  for (const it of items) { if (!rows.has(it.y)) rows.set(it.y, []); rows.get(it.y).push(it); }
  const kept = [];
  for (const row of rows.values()) {
    row.sort((a, b) => a.x - b.x);
    let edge = -1e9;
    for (const it of row) {
      if (it.x < edge) it.x = edge;
      if (it.x < 1210 && it.x + it.w > 80 && it.y > 330 && it.y < 690) it.x = 1240;      // pushed into the title: jump past it
      if (it.x < edge) it.x = edge;
      edge = it.x + it.w + 90;
      if (it.early ? it.x + it.w < W - 110 : it.x < W + 40) kept.push(it); else edge = it.x;
    }
  }
  LINES = kept; return kept;
}
export function sIntro(ctx, t) {
  const lines = memoLines(ctx);
  cam(ctx, t, { z: 1.015 + 0.045 * E.io(sat(t, 0, 12.25)), cx: 760, cy: 520, seed: 1 }, () => {
    paper(ctx);
    const ga = sat(t, 7.0, 8.8);
    if (ga > 0) {
      const g = ctx.createRadialGradient(OX, 610, 40, OX, 610, 620);
      g.addColorStop(0, rgba(COL.peach, 0.8 * ga)); g.addColorStop(1, rgba(COL.peach, 0));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
    for (const L of lines) {
      if (t < L.t0) continue;
      const n = Math.min(L.str.length, Math.floor((t - L.t0) * L.cps) + 1);
      const u = E.in(sat(t, L.ab, L.ab + 1.0));
      if (u >= 1) continue;
      const cx = L.x + L.w / 2, k = 1 - 0.86 * u;
      const x = lerp(cx, OX - 30, u) + Math.sin(u * Math.PI) * (L.y < 600 ? 60 : -60), y = lerp(L.y, 640, u);
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * (L.k % 2 ? 0.5 : -0.5)); ctx.scale(k, k);
      text(ctx, L.str.slice(0, n), -L.w / 2, 0, { size: L.size, weight: 400, align: 'left', ls: 2, color: mix(COL.ink, COL.orangeD, u), alpha: L.a * (1 - u * u) });
      if (n < L.str.length) { ctx.fillStyle = rgba(COL.orange, 0.9); ctx.fillRect(-L.w / 2 + (L.w * n) / L.str.length + 3, -L.size * 0.52, 2.5, L.size * 1.04); }
      ctx.restore();
    }
    const oa = sat(t, 7.3, 8.8);
    if (oa > 0) {
      const b = breathe(t, 1.2);
      char(ctx, 'o01', OX, OFEET, OSIZE, { alpha: oa, sx: b.sx, sy: b.sy, rot: b.rot });
      for (let i = 0; i < 18; i++) {
        const ts = 8.6 + rnd(i, 21) * 3.3, p = sat(t, ts, ts + 0.7);
        if (p <= 0 || p >= 1) continue;
        const a = rnd(i, 22) * TAU, r = 210 + rnd(i, 23) * 220 - p * 60;
        star4(ctx, OX + Math.cos(a) * r * 0.9, 610 + Math.sin(a) * r, 12 + rnd(i, 24) * 14, COL.orange, Math.sin(p * Math.PI));
      }
    }
    let typed = 0;
    for (let k = 0; k < 5; k++) if (t >= TT[k]) typed = k + 1;
    for (let k = 0; k < typed; k++) {
      const s = 1 + 0.16 * hit(t, TT[k], 12);
      drawGlyph(ctx, TITLE[k], TX + TS / 2 + k * TSTEP, TY, TS, { weight: 800, sx: s, sy: s });
    }
    caret(ctx, TX + typed * TSTEP + (typed ? 14 : 0), TY, 190, t, COL.orange, 10, t > 9.4 && t < 11.7);
    text(ctx, '橙子的第一首歌', TX + 12, TY + 172, { size: 38, weight: 500, align: 'left', color: COL.inkSoft, ls: 16, alpha: sat(t, 11.5, 12.1) });
  });
  bokeh(ctx, t, { n: 9, seed: 30, alpha: 0.13 * sat(t, 6.5, 8.5) });
  finish(ctx);
}
// 0:12 close-up: she opens her eyes
export function sWake(ctx, t) {
  const lines = memoLines(ctx);
  paper(ctx, '#FBF3E2', 0.22);
  const g = ctx.createRadialGradient(1040, 560, 60, 1040, 560, 950);
  g.addColorStop(0, rgba(COL.peach, 0.85)); g.addColorStop(1, rgba(COL.peach, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) { const L = lines[(i * 5) % lines.length]; softGlyph(ctx, L.str[0], ((L.x * 1.3 - (t - 12.25) * (20 + (i % 5) * 9)) % (W + 300) + W + 300) % (W + 300) - 150, 60 + ((i * 97) % 960), 90 + (i % 4) * 40, 6, COL.ink, 0.1); }
  const z = 1 + 0.08 * E.out(sat(t, 12.25, 14.4));
  const open = E.out(sat(t, 13.13, 13.5));
  const b = breathe(t, 0.6);
  char(ctx, 'o13', 1066, 1100 + 30 * (z - 1), 1364 * z, { blink: 1 - open, sway: 1.4, shadow: false, sx: b.sx, sy: b.sy });
  const fl = 0.34 * hit(t, 13.13, 5);
  if (fl > 0.003) { ctx.fillStyle = rgba('#FFF7DB', fl); ctx.fillRect(0, 0, W, H); }
  bokeh(ctx, t, { n: 10, seed: 40, alpha: 0.2, minR: 30, maxR: 110, vx: 22 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:14–0:24  海, 三点水 + 每, a sea made of the word
export const HX = 1250, HY = 420, HS = 540;
export const SY = 884;                                   // top of the shore she stands on
// 海 = 氵 + 每. A straight cut cannot separate them (the last stroke of 氵 reaches under 每), so the glyph is
// split by connected strokes: the three whose centre lies in the left third are 氵, the rest is 每.
let PARTS = null;
export function seaParts() {
  if (PARTS) return PARTS;
  const split = color => {
    const g = glyph('海', 512, 800, color), s = g.s;
    const src = g.c.getContext('2d').getImageData(0, 0, s, s), a = src.data;
    const lab = new Int32Array(s * s), cx = [0], cy = [0], stack = [];
    let n = 0;
    for (let i = 0; i < s * s; i++) {
      if (a[i * 4 + 3] <= 110 || lab[i]) continue;
      n++; let sx = 0, sy = 0, c = 0; lab[i] = n; stack.push(i);
      while (stack.length) {
        const k = stack.pop(), px = k % s, py = (k / s) | 0; sx += px; sy += py; c++;
        if (px > 0 && !lab[k - 1] && a[(k - 1) * 4 + 3] > 110) { lab[k - 1] = n; stack.push(k - 1); }
        if (px < s - 1 && !lab[k + 1] && a[(k + 1) * 4 + 3] > 110) { lab[k + 1] = n; stack.push(k + 1); }
        if (py > 0 && !lab[k - s] && a[(k - s) * 4 + 3] > 110) { lab[k - s] = n; stack.push(k - s); }
        if (py < s - 1 && !lab[k + s] && a[(k + s) * 4 + 3] > 110) { lab[k + s] = n; stack.push(k + s); }
      }
      cx.push(sx / c); cy.push(sy / c);
    }
    const L = new ImageData(s, s), R = new ImageData(s, s);
    let lx0 = s, lx1 = 0, rx0 = s;
    for (let i = 0; i < s * s; i++) {
      if (!a[i * 4 + 3]) continue;
      let l = lab[i];
      if (!l) {                      // soft edge pixel: it belongs to the nearest stroke
        const px = i % s, py = (i / s) | 0;
        for (let r = 1; r <= 4 && !l; r++) for (let dy = -r; dy <= r && !l; dy++) for (let dx = -r; dx <= r; dx++) {
          const x = px + dx, y = py + dy; if (x < 0 || y < 0 || x >= s || y >= s) continue;
          if (lab[y * s + x]) { l = lab[y * s + x]; break; }
        }
      }
      const left = l && cx[l] < s * 0.4, T = left ? L : R;
      T.data[i * 4] = a[i * 4]; T.data[i * 4 + 1] = a[i * 4 + 1]; T.data[i * 4 + 2] = a[i * 4 + 2]; T.data[i * 4 + 3] = a[i * 4 + 3];
      if (a[i * 4 + 3] > 110) { const px = i % s; if (left) { lx0 = Math.min(lx0, px); lx1 = Math.max(lx1, px); } else rx0 = Math.min(rx0, px); }
    }
    const cl = new OffscreenCanvas(s, s), cr = new OffscreenCanvas(s, s);
    cl.getContext('2d').putImageData(L, 0, 0); cr.getContext('2d').putImageData(R, 0, 0);
    const dots = cx.map((x, i) => [x / s, cy[i] / s]).filter((d, i) => i > 0 && d[0] < 0.4).sort((a, b) => a[1] - b[1]);
    return { l: cl, r: cr, s, q: g.q, lcx: (lx0 + lx1) / 2 / s, gap: (lx1 + rx0) / 2 / s, dots };
  };
  PARTS = { ink: split(COL.ink), tint: split(COL.orange) };
  return PARTS;
}
export function shore(ctx) {
  const p = () => { ctx.beginPath(); ctx.moveTo(-200, SY); ctx.lineTo(600, SY); [[640, SY + 18], [626, SY + 60], [668, SY + 104], [652, SY + 150], [700, SY + 210]].forEach(q => ctx.lineTo(q[0], q[1])); ctx.lineTo(-200, SY + 230); ctx.closePath(); };
  cut(ctx, p, COL.paper2, 0.25, 26, -4);
  p(); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
}
export const TAGS = ['蔚蓝', '湛蓝', '灰蓝', '蓝得像玻璃', '比天还蓝', '深得发黑', '退潮的时候是绿的', '像一块旧牛仔布', '很蓝很蓝', '说不上来的蓝', '蓝', '蓝！'];
export const ROWS = (() => { const r = []; let y = 600; const S = [30, 40, 54, 70, 90, 114]; S.forEach((s, i) => { y += s * 0.93; r.push([y, s, i]); }); return r; })();
let TAGPOS = null;
export function tagLayout(ctx) {
  if (TAGPOS) return TAGPOS;
  TAGPOS = []; const xs = [760, 830, 790];
  TAGS.forEach((s, i) => { const r = i % 3, w = measure(ctx, s, 40, 500, undefined, 3); TAGPOS.push([xs[r] + w / 2, 150 + r * 104]); xs[r] += w + 90; });
  return TAGPOS;
}
export function seaField(ctx, t, hx, hy) {
  for (const [y0, size, r] of ROWS) {
    const step = size * 1.3, n = Math.ceil(W / step) + 4, far = 1 - r / 5;
    const x0 = -step * 2 + ((r * 53) % step) + Math.sin(t * 0.8 + r * 0.9) * size * 0.45 + t * (4 + r * 3);
    const col = mix(COL.ink, COL.paper, far * 0.62);
    for (let c = 0; c < n; c++) {
      const x = ((x0 + c * step) % (n * step) + n * step) % (n * step) - step * 2;
      const wv = Math.sin(t * 2.0 + x * 0.006 + r * 1.3);
      const y = y0 + wv * size * 0.16;
      if (y0 > SY - 10 && x < 640 + (y0 - SY) * 0.3 + size * 0.5) continue;
      const dd = Math.hypot(x - hx, y - hy) * 0.001;
      const ap = sat(t, 21.2 + dd, 21.55 + dd);
      if (ap <= 0) continue;
      const k = 0.55 + 0.45 * E.back(ap);
      drawGlyph(ctx, '海', x, y, size, { weight: 800, rot: wv * 0.07, alpha: ap, color: col, sx: k, sy: k });
    }
  }
}
export function sSea(ctx, t) {
  const PT = seaParts();
  const hx2 = 1180, hy2 = ROWS[4][0], hs2 = ROWS[4][1];
  cam(ctx, t, { z: 1.01 + 0.035 * sat(t, 13.8, 24.6), cx: 1100, cy: 560, seed: 2 }, () => {
    paper(ctx);
    if (t >= 21.06) {
      for (let i = 0; i < TAGS.length; i++) {
        const ts = 21.3 + i * 0.2;
        if (t < ts) continue;
        const TL = tagLayout(ctx)[i], x = TL[0] - (t - ts) * 10, y = TL[1];
        const a = sat(t, ts, ts + 0.3) * 0.82;
        text(ctx, TAGS[i], x, y, { size: 40, weight: 500, color: COL.inkSoft, alpha: a, ls: 3 });
        const w = measure(ctx, TAGS[i], 40, 500, undefined, 3);
        ctx.fillStyle = rgba(COL.orange, 0.55 * a); ctx.fillRect(x - w / 2, y + 34, w * sat(t, ts + 0.1, ts + 0.5), 2.5);
      }
      const n = Math.max(1, Math.round(10000 * E.in(sat(t, 21.22, 24.1))));
      text(ctx, `第 ${n} 个人`, 1850, 66, { size: 38, weight: 600, align: 'right', color: COL.inkSoft, alpha: sat(t, 21.2, 21.5), ls: 2 });
      ctx.strokeStyle = rgba(COL.ink, 0.5 * sat(t, 21.2, 21.8)); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(660, 606); ctx.lineTo(W + 200, 606); ctx.stroke();
      seaField(ctx, t, hx2, hy2);
    }
    shore(ctx);
    if (t < 16.4) {            // ink thread from her book to where 海 appears
      const p = sat(t, 14.4, 15.25), fa = 1 - sat(t, 15.6, 16.4);
      for (let i = 0; i < 16; i++) {
        const u = (i + 1) / 17; if (u > p) break;
        const x = lerp(lerp(500, 780, u), lerp(780, HX - 240, u), u), y = lerp(lerp(600, 230, u), lerp(230, HY, u), u);
        ctx.fillStyle = rgba(COL.ink, 0.6 * fa); ctx.beginPath(); ctx.arc(x, y, 4 + 3 * u, 0, TAU); ctx.fill();
      }
    }
    const ap = sat(t, 15.2, 15.7);
    if (ap > 0) {
      const hp = E.io(sat(t, 21.06, 21.95));
      const cx = lerp(HX, hx2, hp), cy = lerp(HY, hy2, hp), size = lerp(HS, hs2, hp);
      const join = E.io(sat(t, 19.7, 20.26));
      const sp1 = E.io(sat(t, 17.98, 18.45)), sp2 = E.io(sat(t, 18.85, 19.25));
      const dL = -100 * sp1 * (1 - join), dR = 80 * sp2 * (1 - join);
      const bump = 1 + 0.09 * hit(t, 20.28, 9), k0 = lerp(0.7, 1, E.back(ap)) * bump;
      const g = PT.ink, go = PT.tint;
      const k = (size / g.q) * k0, d = g.s * k, sxp = g.s * g.gap;
      const tint = sp1 * (1 - sat(t, 20.4, 21.0));
      ctx.save(); ctx.globalAlpha = ap * (1 - sat(t, 21.85, 22.0));
      ctx.shadowColor = 'rgba(90,50,15,0.18)'; ctx.shadowBlur = 24 * (1 - hp); ctx.shadowOffsetY = 10 * (1 - hp);
      ctx.drawImage(g.l, cx - d / 2 + dL, cy - d / 2, d, d);
      ctx.drawImage(g.r, cx - d / 2 + dR, cy - d / 2, d, d);
      ctx.shadowColor = 'transparent';
      if (tint > 0) { ctx.globalAlpha = ap * tint; ctx.drawImage(go.l, cx - d / 2 + dL, cy - d / 2, d, d); }
      ctx.restore();
      const la = sat(t, 18.05, 18.35) * (1 - sat(t, 19.9, 20.2));
      if (la > 0) {
        const lx = cx - d / 2 + g.lcx * d + dL;
        text(ctx, '三点水', lx, cy + 336, { size: 48, weight: 600, color: COL.orangeD, alpha: la, ls: 4 });
        const lb = sat(t, 19.15, 19.4) * (1 - sat(t, 19.9, 20.2));
        text(ctx, '每', cx + 100 + dR, cy + 336, { size: 48, weight: 600, alpha: lb });
        text(ctx, '+', (lx + measure(ctx, '三点水', 48, 600, undefined, 4) / 2 + cx + 100 + dR - measure(ctx, '每', 48, 600) / 2) / 2, cy + 336, { size: 48, weight: 400, color: COL.orange, alpha: lb });
      }
      const sp = sat(t, 20.28, 20.9);
      if (sp > 0 && sp < 1) for (let i = 0; i < 18; i++) {
        const an = (i / 18) * TAU + 0.2, r = 290 + 250 * E.out(sp);
        ctx.fillStyle = rgba(i % 3 ? COL.ink : COL.orange, 1 - sp);
        ctx.beginPath(); ctx.arc(HX + Math.cos(an) * r, HY + Math.sin(an) * r * 0.85, 10 * (1 - sp) + 2, 0, TAU); ctx.fill();
      }
    }
    const b = breathe(t), s = sq(t, 21.2);
    char(ctx, t < 21.2 ? 'o02' : 'o04', 330, SY, 600, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot });
  });
  bokeh(ctx, t, { n: 8, seed: 50, alpha: 0.11 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:24–0:28  dry shoes
export function sShoes(ctx, t) {
  cam(ctx, t, { z: 1.07 - 0.05 * E.out(sat(t, 24.58, 25.3)) + 0.02 * sat(t, 24.58, 27.6), cx: 760, cy: 760, seed: 3 }, () => {
    paper(ctx);
    const gy = 900;
    const front = 1020 + 200 * (0.5 + 0.5 * Math.cos(((t - 24.58) * TAU) / 1.72));
    [[880, 66, 0.45], [972, 100, 0]].forEach(([y, size, far], r) => {
      const step = size * 1.3, x0 = front + r * 50;
      for (let c = 0; x0 + c * step < W + size * 2; c++) {
        const x = x0 + c * step, wv = Math.sin(t * 2.6 + c * 0.7 + r);
        drawGlyph(ctx, '海', x, y + wv * size * 0.12 - (c === 0 ? 12 : 0), size * (c === 0 ? 0.78 : 1), { weight: 800, color: mix(COL.ink, COL.paper, far * 0.6 + (c === 0 ? 0.3 : 0)), rot: wv * 0.08 });
      }
    });
    for (let i = 0; i < 8; i++) {
      const ph = ((t * 1.3 + rnd(i, 41)) % 1);
      ctx.fillStyle = rgba(COL.ink, 0.8 * (1 - ph));
      ctx.beginPath(); ctx.arc(front - 26 - ph * 54 - i * 7, 868 - Math.sin(ph * Math.PI) * (40 + i * 9), 5, 0, TAU); ctx.fill();
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(60, gy); for (let x = 60; x <= 1000; x += 40) ctx.lineTo(x, gy + noise(x * 0.02, 5) * 3); ctx.stroke();
    const b = breathe(t, 1.5), s = sq(t, 24.58);
    char(ctx, 'o03', 700, gy, 760, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot });
    const qa = sat(t, 24.9, 25.1);
    if (qa > 0) drawGlyph(ctx, '？', 990, 250 + Math.sin(t * 4) * 8, 130, { weight: 800, color: COL.orange, alpha: qa, rot: 0.18, sx: 0.6 + 0.4 * E.back(qa), sy: 0.6 + 0.4 * E.back(qa) });
  });
  bokeh(ctx, t, { n: 7, seed: 60, alpha: 0.1 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:28–0:38  night, “在吗”, enter
export function sNight(ctx, t) {
  const lit = sat(t, 31.53, 32.1), boom = E.out(sat(t, 37.73, 38.43));
  const shake = hit(t, 37.73, 7) * 10;
  cam(ctx, t, { z: 1.02 + 0.06 * E.io(sat(t, 28.07, 37.73)) + 0.03 * hit(t, 37.73, 6), cx: 1100, cy: 470, x: Math.sin(t * 60) * shake, y: Math.cos(t * 47) * shake, seed: 4 }, () => {
    ctx.fillStyle = mix(COL.night, '#3A2A26', boom * 0.8); ctx.fillRect(-300, -300, W + 600, H + 600);
    if (lit > 0) {
      const g = ctx.createRadialGradient(900, 450, 20, 900, 450, 900);
      g.addColorStop(0, rgba(COL.orange, 0.34 * lit)); g.addColorStop(1, rgba(COL.orange, 0));
      ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    }
    const bx = 620, by = 380, bw = 1100, bh = 140;
    ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.5 * lit); ctx.shadowBlur = 60;
    rrect(ctx, bx, by, bw, bh, 70); ctx.fillStyle = rgba(COL.cream, 0.05 + 0.06 * lit); ctx.fill(); ctx.restore();
    rrect(ctx, bx, by, bw, bh, 70); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.cream, 0.35 + 0.5 * lit); ctx.stroke();
    const typed = t >= 31.72 ? 2 : t >= 31.53 ? 1 : 0;
    ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.95); ctx.shadowBlur = 40;
    if (typed > 0) { const s = 1 + 0.25 * hit(t, 31.53, 12); drawGlyph(ctx, '在', 760, 450, 100, { color: COL.cream, sx: s, sy: s }); }
    if (typed > 1) { const s = 1 + 0.25 * hit(t, 31.72, 12); drawGlyph(ctx, '吗', 874, 450, 100, { color: COL.cream, sx: s, sy: s }); }
    ctx.restore();
    caret(ctx, 700 + typed * 118 + (typed ? 8 : 0), 450, 84, t, typed ? COL.orange : rgba(COL.cream, 0.8), 6);
    const ka = sat(t, 35.15, 35.4);
    if (ka > 0) {
      const kx = 1616, ky = 450, press = (sat(t, 35.5, 35.58) - sat(t, 37.73, 37.79)) * 10;
      const ks = 0.5 + 0.5 * E.back(ka);
      ctx.save(); ctx.translate(kx, ky); ctx.scale(ks, ks); ctx.globalAlpha = ka;
      rrect(ctx, -64, -42 + 12, 128, 92, 18); ctx.fillStyle = '#B9A98C'; ctx.fill();
      rrect(ctx, -64, -48 + press, 128, 92, 18); ctx.fillStyle = COL.cream; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke();
      ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.orangeD;
      ctx.beginPath(); ctx.moveTo(26, -24 + press); ctx.lineTo(26, 6 + press); ctx.lineTo(-26, 6 + press); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -8 + press); ctx.lineTo(-28, 6 + press); ctx.lineTo(-12, 20 + press); ctx.stroke();
      ctx.restore();
      if (boom > 0 && boom < 1) {
        ctx.lineWidth = 50 * (1 - boom) + 2; ctx.strokeStyle = rgba(COL.cream, 0.9 * (1 - boom));
        ctx.beginPath(); ctx.arc(kx, ky, 2100 * boom, 0, TAU); ctx.stroke();
        ctx.lineWidth = 18 * (1 - boom) + 1; ctx.strokeStyle = rgba(COL.orange, 0.9 * (1 - boom));
        ctx.beginPath(); ctx.arc(kx, ky, 1500 * boom, 0, TAU); ctx.stroke();
      }
    }
    const awake = t >= 31.95, b = breathe(t, 1.2), s = sq(t, 31.95, 1.4);
    ctx.save(); ctx.filter = `brightness(${0.5 + 0.5 * lit})`;
    char(ctx, awake ? 'o04' : 'o01', 330, 950, 560, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot, shadowColor: '#000000' });
    ctx.restore();
    const ea = sat(t, 32.0, 32.2) * (1 - sat(t, 34.2, 34.7));
    if (ea > 0) drawGlyph(ctx, '！', 560, 430, 120, { weight: 900, color: COL.orange, alpha: ea, rot: 0.15, sx: 0.5 + 0.5 * E.back(sat(t, 32.0, 32.25)), sy: 0.5 + 0.5 * E.back(sat(t, 32.0, 32.25)) });
  });
  bokeh(ctx, t, { n: 16, seed: 70, colors: [COL.cream, COL.orange], alpha: 0.07 + 0.08 * lit, blend: 'screen', minR: 10, maxR: 60 });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ 0:38–0:45  first page, “在。”, then all of yesterday pours in
function flyPage(ctx, i, u) {
  const an = rnd(i, 62) * TAU, e = E.in(u), side = rnd(i, 63) < 0.5 ? -1 : 1;
  const sx = 960 + Math.cos(an) * 1400, sy = 520 + Math.sin(an) * 950;
  const x = lerp(sx, 960, e) + Math.sin(u * Math.PI) * 240 * side * Math.sin(an), y = lerp(sy, 640, e) - Math.sin(u * Math.PI) * 240 * side * Math.cos(an);
  const k = lerp(1.25, 0.16, e);
  miniPage(ctx, x, y, 170 * k, 220 * k, an + u * 5 * side, u > 0.88 ? (1 - u) / 0.12 : 1);
}
export function sFirstPage(ctx, t) {
  const mv = E.io(sat(t, 42.0, 42.9));
  cam(ctx, t, { z: 1.06 - 0.05 * E.out(sat(t, 38.9, 40.0)) + 0.02 * sat(t, 39.5, 45.5), cx: 960, cy: 600, seed: 5 }, () => {
    paper(ctx, '#FBF5E8', 0.1);
    rays(ctx, 960, 580, t, 0.24 * sat(t, 38.8, 39.6));
    const size = lerp(700, 560, mv), feet = lerp(928, 915, mv);
    const n = t < 42.92 ? 1 : 1 + Math.floor(10481 * E.in(sat(t, 42.92, 45.4)));
    text(ctx, `第 ${n} 页`, 1840, 72, { size: 44, weight: 600, align: 'right', color: COL.inkSoft, ls: 2 });
    for (let i = 0; i < 60; i++) { const ts = 42.75 + rnd(i, 61) * 2.2, u = sat(t, ts, ts + 0.85); if (u > 0 && u < 1 && !(i % 2)) flyPage(ctx, i, u); }
    const b = breathe(t, 1.1), s = sq(t, 39.88, 0.8), gl = pulse(t, 5) * sat(t, 42.9, 43.2);
    char(ctx, 'o02', 960, feet, size, { sx: b.sx * s.sx * (1 + 0.012 * gl), sy: b.sy * s.sy * (1 + 0.012 * gl), rot: b.rot });
    for (let i = 0; i < 60; i++) { const ts = 42.75 + rnd(i, 61) * 2.2, u = sat(t, ts, ts + 0.85); if (u > 0 && u < 1 && i % 2) flyPage(ctx, i, u); }
    const sa = sat(t, 39.88, 40.1) * (1 - sat(t, 41.9, 42.3));
    if (sa > 0) {            // one outline for bubble and tail, so no line crosses another
      const k = 0.5 + 0.5 * E.back(sat(t, 39.88, 40.23));
      const bub = () => {
        const x0 = -190, y0 = -120, x1 = 190, y1 = 120, r = 58;
        ctx.beginPath(); ctx.moveTo(x0 + r, y0); ctx.lineTo(x1 - r, y0); ctx.arcTo(x1, y0, x1, y0 + r, r); ctx.lineTo(x1, y1 - r); ctx.arcTo(x1, y1, x1 - r, y1, r);
        ctx.lineTo(-70, y1); ctx.lineTo(-236, y1 + 62); ctx.lineTo(-142, y1); ctx.lineTo(x0 + r, y1); ctx.arcTo(x0, y1, x0, y1 - r, r); ctx.lineTo(x0, y0 + r); ctx.arcTo(x0, y0, x0 + r, y0, r); ctx.closePath();
      };
      ctx.save(); ctx.translate(1430, 380); ctx.scale(k, k); ctx.globalAlpha = sa;
      cut(ctx, bub, COL.white, 0.22, 24, 8);
      bub(); ctx.lineWidth = 6; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
      text(ctx, '在。', 26, 4, { size: 150, weight: 800, color: COL.orange });
      ctx.restore();
    }
  });
  bokeh(ctx, t, { n: 10, seed: 80, alpha: 0.14 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:45–0:49  山 / 火 / 难过
export function sMountain(ctx, t) {
  cam(ctx, t, { z: 1.08 - 0.06 * E.out(sat(t, 45.92, 46.4)) + 0.03 * sat(t, 45.92, 46.84), cx: 960, cy: 900, hand: 2 }, () => {
    paper(ctx, '#EFE8D8', 0.18);
    const G = ['#2B2320', '#4A3F38', '#6B5F57', '#3A302B'];
    const piles = [[1580, 930, 6, 104, 0.08, 0.5], [450, 940, 7, 112, 0.04, 0.3], [1020, 968, 9, 124, 0, 0]];
    piles.forEach(([cx, base, rows, size, d, far], pi) => {
      for (let r = 0; r < rows; r++) {
        const p = E.back(sat(t, 45.95 + d + (rows - 1 - r) * 0.03, 46.2 + d + (rows - 1 - r) * 0.03));
        if (p <= 0) continue;
        for (let c = 0; c <= r; c++) drawGlyph(ctx, '山', cx + (c - r / 2) * size * 0.93, base - (rows - 1 - r) * size * 0.8 + (1 - p) * 130, size, { weight: 800, color: mix(G[(r * 3 + c + pi) % 4], '#EFE8D8', far), alpha: clamp(p) });
      }
    });
  });
  finish(ctx);
}
export function sFire(ctx, t) {
  cam(ctx, t, { z: 1.08 - 0.06 * E.out(sat(t, 46.84, 47.2)) + 0.05 * hit(t, 47.48, 6), cx: 960, cy: 700, hand: 2 }, () => {
    ctx.fillStyle = '#231512'; ctx.fillRect(-300, -300, W + 600, H + 600);
    const g = ctx.createRadialGradient(960, 760, 40, 960, 700, 820);
    g.addColorStop(0, 'rgba(238,122,46,0.6)'); g.addColorStop(1, 'rgba(238,122,46,0)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    const tf = Math.floor(t * 14), grow = 0.55 * E.out(sat(t, 46.84, 47.1)) + 0.45 * E.out(sat(t, 47.44, 47.62));
    const FC = ['#F9D15B', '#F4A236', '#EE7A2E', '#D9441E'];
    const items = [];
    for (let i = 0; i < 78; i++) {
      const u = Math.pow(rnd(i, 71), 1.25), wd = 310 * Math.pow(1 - u, 0.75) + 14;
      const core = Math.abs(rnd(i, 72) - 0.5) * 2;
      items.push({ x: 960 + (rnd(i, 72) - 0.5) * 2 * wd + (rnd(i, tf) - 0.5) * 34, y: 930 - u * 660 * grow - rnd(i, tf + 9) * 46,
        size: (150 - u * 92) * (0.82 + rnd(i, tf + 3) * 0.42), ci: Math.min(3, Math.floor(u * 2.6 + core * 1.4)), r: (rnd(i, tf + 5) - 0.5) * 0.3 });
    }
    items.sort((a, b) => b.ci - a.ci);
    for (const it of items) drawGlyph(ctx, '火', it.x, it.y, it.size, { weight: 900, color: FC[it.ci], rot: it.r });
    for (let i = 0; i < 30; i++) {
      const ph = (t * (0.5 + rnd(i, 73)) + rnd(i, 74)) % 1;
      ctx.fillStyle = rgba('#F9D15B', 1 - ph);
      ctx.fillRect(960 + (rnd(i, 75) - 0.5) * 560 + Math.sin(ph * 9 + i) * 30, 800 - ph * 780, 6, 6);
    }
  });
  finish(ctx, { dark: true });
}
export function sSad(ctx, t) {
  cam(ctx, t, { z: 1.06 - 0.04 * E.out(sat(t, 47.74, 48.1)) + 0.02 * sat(t, 47.74, 49.4), cx: 960, cy: 440, hand: 2 }, () => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#CFC8BC'); g.addColorStop(1, '#E2DCD0');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.strokeStyle = 'rgba(60,50,44,0.34)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    for (let i = 0; i < 180; i++) {
      const sp = 950 * (0.7 + rnd(i, 81) * 0.7);
      const y = ((rnd(i, 82) * (H + 200) + t * sp) % (H + 200)) - 100, x = ((rnd(i, 83) * (W + 400) - t * sp * 0.18) % (W + 400) + W + 400) % (W + 400) - 100;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 9, y + 50); ctx.stroke();
    }
    const sink = 16 * sat(t, 47.74, 49.4), a = sat(t, 47.74, 47.9), col = '#4A4038';
    const k = 1 + 0.1 * hit(t, 47.74, 9);
    drawGlyph(ctx, '难', 790, 420 + sink, 330, { weight: 300, color: col, alpha: a, sx: k, sy: k });
    drawGlyph(ctx, '过', 1140, 420 + sink, 330, { weight: 300, color: col, alpha: a, sx: k, sy: k });
    ctx.strokeStyle = col; ctx.lineWidth = 7;
    for (let i = 0; i < 11; i++) {
      const x = 660 + i * 62 + rnd(i, 84) * 20, len = Math.max(0, t - 47.95 - rnd(i, 85) * 0.5) * (150 + rnd(i, 86) * 200);
      if (len <= 0) continue;
      ctx.beginPath(); ctx.moveTo(x, 565 + sink + rnd(i, 87) * 20); ctx.lineTo(x, 565 + sink + len); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, 565 + sink + len, 7, 0, TAU); ctx.fill();
    }
  });
  finish(ctx, { light: 0.6 });
}

// ------------------------------------------------------------------ 0:49–0:52  the page for tomorrow is blank
const HEADS = ['昨天', '前天', '很久以前', '明天'];
const FLIPS = [49.46, 49.71, 49.96], FD = 0.24;
function bookPage(ctx, x, y, w, h, head, blank, side, seed, t) {
  ctx.fillStyle = COL.white; ctx.fillRect(x, y, w, h);
  const gr = ctx.createLinearGradient(side > 0 ? x : x + w, 0, side > 0 ? x + 80 : x + w - 80, 0);
  gr.addColorStop(0, 'rgba(90,60,30,0.22)'); gr.addColorStop(1, 'rgba(90,60,30,0)');
  ctx.fillStyle = gr; ctx.fillRect(x, y, w, h);
  if (head) text(ctx, head, x + 70, y + 96, { size: 64, weight: 800, align: 'left', color: blank ? COL.orange : COL.ink });
  if (!blank) {
    ctx.fillStyle = rgba(COL.ink, 0.3);
    for (let i = 0; i < 15; i++) ctx.fillRect(x + 70, y + 180 + i * 36, (w - 140) * (0.55 + 0.45 * rnd(i, seed)), 9);
  } else if (t !== undefined) caret(ctx, x + 74, y + 200, 62, t, COL.orange, 6);
}
export function sBook(ctx, t) {
  const z = E.io(sat(t, 50.6, 52.4));
  cam(ctx, t, { z: 1.04 + 0.5 * z, cx: 960, cy: 540, x: -330 * z, y: 130 * z, rot: -0.025 + 0.025 * z, seed: 6 }, () => {
    paper(ctx, '#E6D9C0', 0.25);
    const px = 960, py = 130, pw = 620, ph = 780;
    ctx.save(); ctx.shadowColor = 'rgba(50,30,10,0.4)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26;
    ctx.fillStyle = '#5A3320'; rrect(ctx, px - pw - 26, py - 22, pw * 2 + 52, ph + 44, 18); ctx.fill(); ctx.restore();
    rrect(ctx, px - pw - 26, py - 22, pw * 2 + 52, ph + 44, 18); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
    let done = 0, cur = -1, cp = 0;
    FLIPS.forEach((f, i) => { if (t >= f + FD) done = i + 1; else if (t >= f) { cur = i; cp = (t - f) / FD; } });
    const idx = cur >= 0 ? cur : done;
    bookPage(ctx, px - pw, py, pw, ph, idx > 0 ? HEADS[idx - 1] : '', false, -1, 90 + idx);
    const rightIdx = cur >= 0 ? cur + 1 : done;
    bookPage(ctx, px, py, pw, ph, HEADS[rightIdx], rightIdx === HEADS.length - 1, 1, 100 + rightIdx, t);
    if (cur >= 0) {
      const c = Math.cos(cp * Math.PI);
      ctx.save();
      if (c >= 0) {
        ctx.translate(px, 0); ctx.scale(c, 1); ctx.translate(-px, 0);
        bookPage(ctx, px, py, pw, ph, HEADS[cur], false, 1, 100 + cur);
        ctx.fillStyle = `rgba(60,40,20,${0.3 * (1 - c)})`; ctx.fillRect(px, py, pw, ph);
      } else {
        ctx.translate(px, 0); ctx.scale(-c, 1); ctx.translate(-px, 0);
        bookPage(ctx, px - pw, py, pw, ph, HEADS[cur], false, -1, 90 + cur + 1);
        ctx.fillStyle = `rgba(60,40,20,${0.3 * (1 + c)})`; ctx.fillRect(px - pw, py, pw, ph);
      }
      ctx.restore();
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 5; ctx.strokeRect(px - pw, py, pw * 2, ph);
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + ph); ctx.stroke();
  });
  bokeh(ctx, t, { n: 8, seed: 90, alpha: 0.12 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:52–0:56  close the book, open the door
export function sDoor(ctx, t) {
  const z = E.in(sat(t, 55.1, 55.91)), dcx = 1400, dcy = 650;
  cam(ctx, t, { z: 1.02 + 0.75 * z, cx: dcx, cy: dcy, seed: 7 }, () => {
    paper(ctx);
    const dx = 1250, dw = 300, dTop = 330, dBot = 920;
    const open = E.out(sat(t, 54.87, 55.45));
    const doorPath = () => { ctx.beginPath(); ctx.moveTo(dx, dBot); ctx.lineTo(dx, dTop + dw / 2); ctx.arc(dx + dw / 2, dTop + dw / 2, dw / 2, Math.PI, 0); ctx.lineTo(dx + dw, dBot); };
    if (open > 0) {
      rays(ctx, dcx, dcy, t, 0.34 * open, COL.yellow, 12);
      const gl = ctx.createRadialGradient(dcx, dcy, 60, dcx, dcy, 900); gl.addColorStop(0, rgba('#FFE9B8', 0.9 * open)); gl.addColorStop(1, rgba('#FFE9B8', 0));
      ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
      doorPath(); ctx.closePath();
      const g = ctx.createLinearGradient(0, dTop, 0, dBot); g.addColorStop(0, '#FFFBEA'); g.addColorStop(1, '#FFE2A6');
      ctx.globalAlpha = open; ctx.fillStyle = g; ctx.fill(); ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(100, 920); ctx.lineTo(1820, 920); ctx.stroke();
    const dp = E.io(sat(t, 52.6, 54.2));
    if (dp > 0) {
      const L = 2 * (dBot - dTop - dw / 2) + Math.PI * dw / 2;
      ctx.save(); ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.setLineDash([L, L]); ctx.lineDashOffset = L * (1 - dp);
      doorPath(); ctx.stroke(); ctx.restore();
    }
    if (open > 0.02) {
      const s = Math.sin(open * 1.25), w = dw * (1 - open * 0.86);
      ctx.beginPath(); ctx.moveTo(dx, dBot); ctx.lineTo(dx, dTop + dw / 2 - 60);
      ctx.lineTo(dx + w, dTop + dw / 2 - 60 - 46 * s); ctx.lineTo(dx + w, dBot + 40 * s); ctx.closePath();
      ctx.fillStyle = COL.paper2; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.fillStyle = COL.orange; ctx.beginPath(); ctx.arc(dx + w * 0.82, 660, 11, 0, TAU); ctx.fill(); ctx.stroke();
    } else if (dp >= 1) { ctx.fillStyle = COL.orange; ctx.strokeStyle = COL.ink; ctx.lineWidth = 5; ctx.globalAlpha = sat(t, 54.2, 54.4); ctx.beginPath(); ctx.arc(dx + dw * 0.82, 660, 11, 0, TAU); ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1; }
    const walking = t >= 55.05;
    const x = lerp(620, 1230, E.in(sat(t, 55.05, 55.95)));
    const s = sq(t, 53.99, 1.6), b = breathe(t), wb = walkBob(t);
    if (walking) char(ctx, walkPose(t), x, 920, 680, { lift: wb.lift, rot: wb.rot, windX: -8, flutter: 3 });
    else char(ctx, 'o05', x, 920, 680, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot });
    const sn = sat(t, 53.99, 54.38);
    if (sn > 0 && sn < 1) {
      ctx.strokeStyle = rgba(COL.orange, 1 - sn); ctx.lineWidth = 8;
      for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU, r0 = 260 + 70 * E.out(sn); ctx.beginPath(); ctx.moveTo(620 + Math.cos(an) * r0, 560 + Math.sin(an) * r0); ctx.lineTo(620 + Math.cos(an) * (r0 + 50), 560 + Math.sin(an) * (r0 + 50)); ctx.stroke(); }
    }
    const pa = sat(t, 53.99, 54.12) * (1 - sat(t, 54.55, 54.82));
    if (pa > 0) drawGlyph(ctx, '啪', 930, 340, 110, { weight: 900, color: COL.orange, alpha: pa, rot: 0.2, sx: 0.6 + 0.5 * E.back(sat(t, 53.99, 54.22)), sy: 0.6 + 0.5 * E.back(sat(t, 53.99, 54.22)) });
  });
  bokeh(ctx, t, { n: 8, seed: 95, alpha: 0.12 });
  finish(ctx);
  const wa = E.in(sat(t, 55.3, 55.9));
  if (wa > 0) { ctx.fillStyle = rgba('#FFF7DB', wa); ctx.fillRect(0, 0, W, H); }
}
