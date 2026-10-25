// Three pre-chorus scenes, redrawn with more craft (2026-10-13):
//   难过  — a rain made of the two characters; she shelters under her book, curious rather than sad
//   明天  — the book as an object: curved pages, real sentences, small drawings of what came before, one blank page
//   出门  — her study, the door she draws, and the first colour of the world outside
import { W, H, SS as DPR, TAU, clamp, lerp, sat, E, rnd, noise, COL, mix, rgba, pulse, glyph, drawGlyph, text, measure, paper, rrect, caret, flower, MEMO } from './lib.js';
import { char, breathe, walkBob, walkPose } from './chars.js';
import { finish, bokeh, cam, cut, softGlyph } from './fx.js';
import { hit, sq, rays, miniPage, star4 } from './scenes1.js';

const INK = '#3A322E';

// ------------------------------------------------------------------ 0:47.7–0:49.4  写了怎么难过
const SAD0 = 47.74, SGY = 905, SCX = 600, SS = 520;
function wordRain(ctx, t, n, seed, s0, s1, speed, alpha, soft, shelter) {
  const span = SGY + 260, WW = W + 600;
  for (let i = 0; i < n; i++) {
    const sp = speed * (0.8 + rnd(i, seed) * 0.5), size = s0 + rnd(i, seed + 1) * (s1 - s0);
    const y = ((rnd(i, seed + 2) * span + t * sp) % span) - 200;
    const x = (((rnd(i, seed + 3) * WW - t * sp * 0.17) % WW) + WW) % WW - 300;
    if (y > SGY - size * 0.3) continue;                                             // it has landed
    if (shelter && Math.abs(x - SCX) < 205 + size * 0.6 && y > SGY - 590 - size * 0.5) continue;      // dry under the book
    const ch = rnd(i, seed + 4) < 0.5 ? '难' : '过';
    ctx.strokeStyle = rgba(INK, alpha * 0.4); ctx.lineWidth = Math.max(1.5, size * 0.045); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + size * 0.27, y - size * 1.8); ctx.lineTo(x + size * 0.09, y - size * 0.62); ctx.stroke();
    if (soft) softGlyph(ctx, ch, x, y, size, 5, INK, alpha, 0.16);
    else drawGlyph(ctx, ch, x, y, size, { weight: 500, color: INK, alpha, rot: 0.16 });
  }
}
// A character split into its stroke groups (connected parts), so it can be written part by part and shed its dots.
const WORD = {};
const ORDER = { '难': (c, s) => c.x0, '过': (c, s) => (c.x0 < s * 0.36 ? 1e4 : 0) + c.y0 };
export function wordParts(ch) {
  if (WORD[ch]) return WORD[ch];
  const g = glyph(ch, 512, 400, INK), s = g.s;
  const a = g.c.getContext('2d').getImageData(0, 0, s, s).data;
  const lab = new Int32Array(s * s), stack = [], found = [];
  let n = 0;
  for (let i = 0; i < s * s; i++) {
    if (a[i * 4 + 3] <= 110 || lab[i]) continue;
    n++; lab[i] = n; stack.push(i);
    const o = { id: n, x0: s, x1: 0, y0: s, y1: 0, area: 0, cx: 0, cy: 0 };
    while (stack.length) {
      const k = stack.pop(), px = k % s, py = (k / s) | 0;
      o.area++; o.cx += px; o.cy += py;
      if (px < o.x0) o.x0 = px; if (px > o.x1) o.x1 = px; if (py < o.y0) o.y0 = py; if (py > o.y1) o.y1 = py;
      if (px > 0 && !lab[k - 1] && a[(k - 1) * 4 + 3] > 110) { lab[k - 1] = n; stack.push(k - 1); }
      if (px < s - 1 && !lab[k + 1] && a[(k + 1) * 4 + 3] > 110) { lab[k + 1] = n; stack.push(k + 1); }
      if (py > 0 && !lab[k - s] && a[(k - s) * 4 + 3] > 110) { lab[k - s] = n; stack.push(k - s); }
      if (py < s - 1 && !lab[k + s] && a[(k + s) * 4 + 3] > 110) { lab[k + s] = n; stack.push(k + s); }
    }
    o.cx /= o.area; o.cy /= o.area;
    if (o.area >= 60 * DPR * DPR) found.push(o);
  }
  const total = found.reduce((q, o) => q + o.area, 0), slot = new Map(found.map((o, i) => [o.id, i]));
  const data = found.map(() => new ImageData(s, s));
  for (let i = 0; i < s * s; i++) {
    if (!a[i * 4 + 3]) continue;
    let l = lab[i];
    if (!slot.has(l)) {                                // a soft edge pixel belongs to the nearest stroke
      l = 0; const px = i % s, py = (i / s) | 0;
      for (let r = 1; r <= 4 && !l; r++) for (let dy = -r; dy <= r && !l; dy++) for (let dx = -r; dx <= r; dx++) {
        const x = px + dx, y = py + dy; if (x < 0 || y < 0 || x >= s || y >= s) continue;
        if (slot.has(lab[y * s + x])) { l = lab[y * s + x]; break; }
      }
      if (!l) continue;
    }
    const T = data[slot.get(l)].data;
    T[i * 4] = a[i * 4]; T[i * 4 + 1] = a[i * 4 + 1]; T[i * 4 + 2] = a[i * 4 + 2]; T[i * 4 + 3] = a[i * 4 + 3];
  }
  found.forEach((o, i) => { o.c = new OffscreenCanvas(s, s); o.c.getContext('2d').putImageData(data[i], 0, 0); o.dot = o.area < total * 0.1; });
  found.sort((p, q) => ORDER[ch](p, s) - ORDER[ch](q, s));
  // where the ink would run from: the low ends of the strokes
  const bot = new Int32Array(s).fill(-1), drips = [];
  for (let x = 0; x < s; x++) for (let y = s - 1; y >= 0; y--) if (a[(y * s + x) * 4 + 3] > 110) { bot[x] = y; break; }
  const win = 16 * DPR;
  for (let x = win; x < s - win; x++) {
    if (bot[x] < 0) continue;
    let low = true;
    for (let d = -win; d <= win && low; d++) if (bot[x + d] > bot[x] || (bot[x + d] === bot[x] && d < 0)) low = false;
    if (low && !found.some(o => o.dot && x >= o.x0 && x <= o.x1 && Math.abs(bot[x] - o.y1) < 3 * DPR)) drips.push([x, bot[x]]);
  }
  WORD[ch] = { s, q: g.q, comps: found, total, drips };
  return WORD[ch];
}
function weepWord(ctx, t, ch, x, y, size, w0, w1, ts, lean) {
  if (t < w0) return;
  const P = wordParts(ch), k = size / P.q, d = P.s * k, o = -d / 2;
  const stamp = 1 + 0.07 * hit(t, ts, 9), dr = E.out(sat(t, ts, ts + 0.45));
  softGlyph(ctx, ch, x, y + 12 * dr, size * 1.08, 10, INK, 0.2 * sat(t, w0, w1));          // the wet halo under it
  ctx.save(); ctx.translate(x, y - d * 0.3); ctx.rotate(lean * 0.05 * dr); ctx.scale(stamp * (1 - 0.02 * dr), stamp * (1 + 0.07 * dr)); ctx.translate(0, d * 0.3);
  let acc = 0;
  P.comps.forEach((c, ci) => {
    const a0 = w0 + (w1 - w0) * 0.84 * (acc / P.total), a1 = a0 + Math.max(0.13, (w1 - w0) * 0.9 * (c.area / P.total)); acc += c.area;
    const p = sat(t, a0, a1); if (p <= 0) return;
    if (c.dot && t > ts + 0.05 + ci * 0.03) {                // a tear: it lets go, stretches, falls, and lands
      const dt = t - ts - 0.05 - ci * 0.03, fy = 2400 * dt * dt + 50 * dt, st = 1 + Math.min(0.8, dt * 2.6);
      const cx = c.cx * k + o, cy = c.cy * k + o, land = SGY - y - cy - 10;
      if (fy < land) { ctx.save(); ctx.translate(cx, cy + fy); ctx.scale(1 / Math.sqrt(st), st); ctx.translate(-cx, -cy); ctx.drawImage(c.c, o, o, d, d); ctx.restore(); }
      else {
        const sp = (dt - Math.sqrt(land / 2400)) / 0.35;
        if (sp < 1) { ctx.strokeStyle = rgba(INK, 0.8 * (1 - sp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy + land + 20, 16 + 90 * sp, (16 + 90 * sp) * 0.24, 0, 0, TAU); ctx.stroke(); }
      }
      return;
    }
    if (p < 1) {                                             // being written: ink arrives along the diagonal of the stroke group
      const u = p * 1.12, bx = c.x0 * k + o - 6, by = c.y0 * k + o - 6, bw = (c.x1 - c.x0) * k + 12, bh = (c.y1 - c.y0) * k + 12;
      ctx.save(); ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 2 * u * bw, by); ctx.lineTo(bx, by + 2 * u * bh); ctx.closePath(); ctx.clip();
      ctx.drawImage(c.c, o, o, d, d); ctx.restore();
    } else ctx.drawImage(c.c, o, o, d, d);
  });
  if (t > ts) {
    ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 6; ctx.lineCap = 'round';
    P.drips.slice(0, 9).forEach(([gx, gy], i) => {
      const len = Math.max(0, t - ts - 0.03 - rnd(i, ts) * 0.14) * (240 + rnd(i, ts + 2) * 300);
      if (len <= 0) return;
      const px = gx * k + o, py = gy * k + o - 3;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, py + len); ctx.stroke();
      ctx.beginPath(); ctx.arc(px, py + len, 6.5, 0, TAU); ctx.fill();
    });
  }
  ctx.restore();
}

export function sSad(ctx, t) {
  cam(ctx, t, { z: 1.07 - 0.05 * E.out(sat(t, SAD0, SAD0 + 0.5)) + 0.03 * sat(t, SAD0, 49.4), cx: 900, cy: 640, hand: 2, seed: 21 }, () => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#C4BFB5'); g.addColorStop(0.5, '#D9D4CA'); g.addColorStop(1, '#E7E2D8');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    for (let i = 0; i < 18; i++) {                                                  // a cloud of ink wash
      const x = -140 + i * 128 + noise(i * 1.7, 31) * 60 + Math.sin(t * 0.4 + i) * 14, y = 30 + rnd(i, 32) * 150, r = 190 + rnd(i, 33) * 160;
      const gg = ctx.createRadialGradient(x, y, 0, x, y, r);
      gg.addColorStop(0, 'rgba(58,50,46,0.30)'); gg.addColorStop(0.6, 'rgba(58,50,46,0.13)'); gg.addColorStop(1, 'rgba(58,50,46,0)');
      ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    wordRain(ctx, t, 70, 810, 20, 30, 620, 0.22, false, false);
    // The word itself. It is written while “写了怎么” is sung (stroke group by stroke group, as the lyric says),
    // finished exactly as it is named, and then it does what it says: it sags, its dots fall as tears, its ink runs.
    weepWord(ctx, t, '难', 1210, 330, 300, 47.92, 48.72, 48.75, 1);
    weepWord(ctx, t, '过', 1540, 330, 300, 48.42, 49.1, 49.13, -1);
    // wet ground, and rings where the words land
    const gg = ctx.createLinearGradient(0, SGY, 0, SGY + 190); gg.addColorStop(0, 'rgba(58,50,46,0.17)'); gg.addColorStop(1, 'rgba(58,50,46,0)');
    ctx.fillStyle = gg; ctx.fillRect(-300, SGY, W + 600, 190);
    ctx.strokeStyle = rgba(INK, 0.6); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-300, SGY); ctx.lineTo(W + 300, SGY); ctx.stroke();
    for (let i = 0; i < 24; i++) {
      const ph = (t * (1.1 + rnd(i, 221) * 0.8) + rnd(i, 222)) % 1, x = rnd(i, 223) * W, y = SGY + 16 + rnd(i, 224) * 110, r = 12 + 84 * ph * (0.5 + (y - SGY) / 170);
      if (Math.abs(x - SCX) < 170 && y < SGY + 46) continue;
      ctx.strokeStyle = rgba(INK, 0.5 * (1 - ph)); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.24, 0, 0, TAU); ctx.stroke();
    }
    const b = breathe(t, 1.4), s = sq(t, SAD0, 1.2);
    char(ctx, 'o15', SCX, SGY + 4, SS, { sx: b.sx * s.sx, sy: b.sy * s.sy, rot: b.rot, shadowColor: '#2A2420' });
    for (let i = 0; i < 7; i++) {                                                   // words bounce off the book
      const ph = (t * 2.3 + rnd(i, 231)) % 1, x = SCX - 160 + rnd(i, 232) * 320, y0 = SGY - 596 + Math.abs(x - SCX) * 0.3;
      ctx.strokeStyle = rgba(INK, 0.75 * (1 - ph)); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(x, y0, 6 + 18 * ph, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    }
    wordRain(ctx, t, 46, 240, 34, 52, 900, 0.62, false, true);
    wordRain(ctx, t, 9, 260, 90, 130, 1250, 0.3, true, true);
  });
  finish(ctx, { light: 0.55 });
}

// ------------------------------------------------------------------ 0:49.4–0:52.5  只有明天 哪一页都没说
const SEQ = ['很久以前', '去年', '昨天', '明天'], DOODLE = ['山', '火', '雨', ''];
const FLIPS = [49.46, 49.71, 49.96], FD = 0.24;
export const PX = 960, PY = 118, PW = 640, PH = 800, PAGE0 = 10479;          // the blank page is number 10482, where the count stopped
let BLINES = null;
function bookLines() {
  if (BLINES) return BLINES;
  BLINES = [0, 1, 2, 3].map(p => {
    const lines = []; let k = p * 9 + 2;
    for (let r = 0; r < 12; r++) {
      let s = MEMO[k++ % MEMO.length];
      while ((s + MEMO[k % MEMO.length]).length <= 19) s += MEMO[k++ % MEMO.length];
      lines.push(s);
    }
    return lines;
  });
  return BLINES;
}
export function pagePath(ctx, side) {
  const x1 = PX + side * PW, bow = 18;
  ctx.beginPath();
  ctx.moveTo(PX, PY + bow);
  ctx.quadraticCurveTo(PX + side * PW * 0.42, PY - bow * 0.7, x1, PY + 8);
  ctx.lineTo(x1, PY + PH + 8);
  ctx.quadraticCurveTo(PX + side * PW * 0.42, PY + PH - bow * 0.7, PX, PY + PH + bow);
  ctx.closePath();
}
export function doodle(ctx, kind, x, y) {             // a small ink drawing of an earlier scene, about 150 x 110
  ctx.save(); ctx.translate(x, y); ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === '山') {
    ctx.fillStyle = '#EFE6D2';
    for (const [dx, w, h] of [[-48, 70, 62], [44, 76, 70], [0, 100, 96]]) { ctx.beginPath(); ctx.moveTo(dx - w / 2, 50); ctx.lineTo(dx, 50 - h); ctx.lineTo(dx + w / 2, 50); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-14, -22); ctx.lineTo(0, -8); ctx.lineTo(12, -24); ctx.stroke();
  } else if (kind === '火') {
    ctx.fillStyle = COL.orange;
    ctx.beginPath(); ctx.moveTo(0, -52); ctx.bezierCurveTo(40, -10, 46, 20, 0, 50); ctx.bezierCurveTo(-46, 20, -34, -4, -18, -22); ctx.bezierCurveTo(-12, -8, -4, -10, 0, -52); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.yellow; ctx.beginPath(); ctx.moveTo(2, -8); ctx.bezierCurveTo(22, 14, 18, 34, 0, 42); ctx.bezierCurveTo(-20, 30, -12, 12, 2, -8); ctx.fill();
  } else if (kind === '雨') {
    ctx.fillStyle = '#EFE6D2';
    ctx.beginPath(); ctx.arc(-34, -20, 22, Math.PI * 0.5, Math.PI * 1.5); ctx.arc(-4, -34, 30, Math.PI * 1.1, Math.PI * 1.9); ctx.arc(34, -20, 24, Math.PI * 1.4, Math.PI * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-44 + i * 22, 14); ctx.lineTo(-52 + i * 22, 44); ctx.stroke(); }
  } else if (kind === '海') {
    for (let r = 0; r < 3; r++) { ctx.beginPath(); for (let i = 0; i <= 24; i++) { const xx = -66 + i * 5.5, yy = -22 + r * 26 + Math.sin(i * 0.8 + r) * 8; if (i) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy); } ctx.stroke(); }
  }
  ctx.restore();
}
// one page of the book. idx -1 is the page before the first; the last of SEQ is blank
export function pageFace(ctx, side, idx, t) {
  const blank = idx === SEQ.length - 1;
  pagePath(ctx, side); ctx.fillStyle = '#FFFDF6'; ctx.fill();
  ctx.save(); pagePath(ctx, side); ctx.clip();
  let g = ctx.createLinearGradient(PX, 0, PX + side * 130, 0); g.addColorStop(0, 'rgba(90,60,30,0.32)'); g.addColorStop(1, 'rgba(90,60,30,0)');
  ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  g = ctx.createLinearGradient(PX + side * (PW - 100), 0, PX + side * PW, 0); g.addColorStop(0, 'rgba(90,60,30,0)'); g.addColorStop(1, 'rgba(90,60,30,0.11)');
  ctx.fillStyle = g; ctx.fillRect(PX - PW - 10, PY - 40, PW * 2 + 20, PH + 90);
  const xl = side > 0 ? PX + 78 : PX - PW + 62, tw = PW - 140;
  text(ctx, idx < 0 ? '最开始' : SEQ[idx], xl, PY + 106, { size: 60, weight: 800, align: 'left', color: blank ? COL.orange : COL.ink, ls: 4 });
  ctx.fillStyle = rgba(COL.ink, blank ? 0.14 : 0.38); ctx.fillRect(xl, PY + 154, tw, 2.5);
  text(ctx, `第 ${PAGE0 + idx} 页`, xl + tw / 2, PY + PH - 36, { size: 22, weight: 500, color: COL.inkSoft, ls: 3 });
  if (!blank) {
    const lines = bookLines()[idx + 1];
    for (let r = 0; r < 12; r++) text(ctx, r < 9 ? lines[r] : lines[r].slice(0, 11), xl, PY + 206 + r * 46, { size: 26, weight: 400, align: 'left', color: COL.ink, alpha: 0.62, ls: 1.5 });
    doodle(ctx, idx < 0 ? '海' : DOODLE[idx], xl + tw - 92, PY + 206 + 10 * 46);
  } else {
    if (t !== undefined) {                       // warm, waiting
      const a = sat(t, 50.2, 51.6);
      const gl = ctx.createRadialGradient(xl + 200, PY + 300, 20, xl + 200, PY + 300, 560);
      gl.addColorStop(0, `rgba(255,214,150,${0.34 * a})`); gl.addColorStop(1, 'rgba(255,214,150,0)');
      ctx.fillStyle = gl; ctx.fillRect(PX - PW, PY - 40, PW * 2, PH + 90);
    }
    ctx.fillStyle = rgba(COL.ink, 0.11);
    for (let r = 0; r < 12; r++) ctx.fillRect(xl, PY + 228 + r * 46, tw, 1.5);
    if (t !== undefined) caret(ctx, xl + 4, PY + 205, 40, t, COL.orange, 5);
  }
  ctx.restore();
  pagePath(ctx, side); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
}
export function sBook(ctx, t) {
  const z = E.io(sat(t, 50.6, 52.4));
  cam(ctx, t, { z: 1.03 + 0.5 * z, cx: 960, cy: 540, x: -330 * z, y: 130 * z, rot: -0.025 + 0.025 * z, seed: 6 }, () => {
    paper(ctx, '#E1D3B8', 0.3);
    // things on the desk
    miniPage(ctx, 1770, 250, 190, 250, 0.14); miniPage(ctx, 1800, 290, 190, 250, -0.06);
    ctx.save(); ctx.translate(1772, 700); ctx.rotate(0.3); ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round';
    ctx.fillStyle = 'rgba(60,40,20,0.18)'; ctx.fillRect(-8, -150, 26, 330);
    ctx.fillStyle = COL.orange; ctx.fillRect(-13, -160, 26, 270); ctx.strokeRect(-13, -160, 26, 270);
    ctx.fillStyle = COL.peach; ctx.fillRect(-13, -190, 26, 30); ctx.strokeRect(-13, -190, 26, 30);
    ctx.fillStyle = COL.cream; ctx.beginPath(); ctx.moveTo(-13, 110); ctx.lineTo(0, 158); ctx.lineTo(13, 110); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = COL.ink; ctx.beginPath(); ctx.moveTo(-4, 143); ctx.lineTo(0, 158); ctx.lineTo(4, 143); ctx.closePath(); ctx.fill();
    ctx.restore();
    // cover, with a stitched edge
    const cov = () => rrect(ctx, PX - PW - 34, PY - 16, PW * 2 + 68, PH + 62, 24);
    ctx.save(); ctx.shadowColor = 'rgba(50,30,10,0.42)'; ctx.shadowBlur = 60; ctx.shadowOffsetY = 30; cov(); ctx.fillStyle = '#5A3320'; ctx.fill(); ctx.restore();
    cov(); ctx.lineWidth = 5; ctx.strokeStyle = COL.ink; ctx.stroke();
    ctx.save(); ctx.setLineDash([10, 9]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,220,170,0.45)'; rrect(ctx, PX - PW - 22, PY - 5, PW * 2 + 44, PH + 40, 16); ctx.stroke(); ctx.restore();
    // the block of pages under the open ones
    for (let k = 5; k >= 1; k--) for (const side of [-1, 1]) {
      ctx.save(); ctx.translate(side * k * 3.2, k * 3.4); pagePath(ctx, side); ctx.fillStyle = k % 2 ? '#F1E7D2' : '#E6DAC2'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = rgba(COL.ink, 0.45); ctx.stroke(); ctx.restore();
    }
    let done = 0, cur = -1, cp = 0;
    FLIPS.forEach((f, i) => { if (t >= f + FD) done = i + 1; else if (t >= f) { cur = i; cp = (t - f) / FD; } });
    const idx = cur >= 0 ? cur : done;
    pageFace(ctx, -1, idx - 1, t);
    pageFace(ctx, 1, cur >= 0 ? cur + 1 : done, t);
    // ribbon marker
    const sway = Math.sin(t * 1.4) * 5;
    ctx.beginPath(); ctx.moveTo(PX + 22, PY + PH + 30); ctx.lineTo(PX + 46, PY + PH + 30); ctx.lineTo(PX + 50 + sway, PY + PH + 104); ctx.lineTo(PX + 37 + sway, PY + PH + 88); ctx.lineTo(PX + 24 + sway, PY + PH + 104); ctx.closePath();
    ctx.fillStyle = COL.orange; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.lineJoin = 'round'; ctx.stroke();
    if (cur >= 0) {                              // the leaf in the air: it narrows, lifts at the outer edge, and darkens
      const c = Math.cos(cp * Math.PI), s = Math.sin(cp * Math.PI), side = c >= 0 ? 1 : -1, w = Math.max(0.02, Math.abs(c));
      ctx.save(); pagePath(ctx, -side); ctx.clip();
      const sh = ctx.createLinearGradient(PX, 0, PX - side * (PW * 0.5), 0); sh.addColorStop(0, `rgba(50,30,10,${0.3 * s})`); sh.addColorStop(1, 'rgba(50,30,10,0)');
      ctx.fillStyle = sh; ctx.fillRect(PX - PW, PY - 40, PW * 2, PH + 90); ctx.restore();
      ctx.save(); ctx.translate(PX, 0); ctx.transform(w, -0.11 * s * side, 0, 1, 0, 0); ctx.translate(-PX, 0);
      pageFace(ctx, side, cur, undefined);
      pagePath(ctx, side); ctx.fillStyle = `rgba(60,40,20,${0.34 * (1 - w)})`; ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(PX, PY + 18); ctx.lineTo(PX, PY + PH + 18); ctx.stroke();
  });
  // over her shoulder: the back of her head, out of focus, sliding out as the camera goes in
  ctx.save(); ctx.filter = 'blur(7px)';
  char(ctx, 'o09', 290 - 300 * z, 1900 + 300 * z, 1250, { shadow: false, blink: 0, sway: 0.5 });
  ctx.restore();
  bokeh(ctx, t, { n: 9, seed: 90, alpha: 0.13 });
  finish(ctx);
}

// ------------------------------------------------------------------ 0:52.5–0:55.9  那我合上书 出门看看
export const DGY = 920, DX = 1250, DW = 300, DTOP = 330;
export const BOOKC = ['#FFFDF6', '#F3EAD6', '#E7DCC6', '#FFFDF6', '#F3EAD6'];
export function shelf(ctx, x0, x1, y0, rows, rowH, seed) {
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = COL.ink;
  ctx.fillStyle = '#EDE2CB'; ctx.fillRect(x0, y0, x1 - x0, rows * rowH);
  for (let r = 0; r < rows; r++) {
    const base = y0 + (r + 1) * rowH - 8, sd = seed + r * 17;
    let x = x0 + 12, k = 0;
    while (x < x1 - 34) {
      const q = rnd(k, sd), w = 20 + rnd(k, sd + 1) * 30, h = rowH * (0.55 + rnd(k, sd + 2) * 0.32);
      if (q < 0.07) { x += 26 + rnd(k, sd + 5) * 40; k++; continue; }                       // a gap
      if (q < 0.15 && x + 110 < x1 - 20) {                                                   // a few lying flat
        for (let j = 0; j < 3; j++) { const bw = 86 - j * 10, bh = 20; ctx.fillStyle = BOOKC[(k + j * 3) % 5]; ctx.fillRect(x + j * 4, base - (j + 1) * bh, bw, bh); ctx.strokeRect(x + j * 4, base - (j + 1) * bh, bw, bh); }
        x += 100; k++; continue;
      }
      const lean = q > 0.93 ? 0.2 : 0, ci = Math.floor(rnd(k, sd + 3) * 12);
      ctx.save(); ctx.translate(x + (lean ? 12 : 0), base); ctx.rotate(-lean);
      ctx.fillStyle = ci < 8 ? BOOKC[ci % 5] : ci < 9 ? '#3A302B' : ci < 11 ? COL.orange : COL.peach;
      ctx.fillRect(0, -h, w, h); ctx.strokeRect(0, -h, w, h);
      ctx.fillStyle = ci === 8 ? 'rgba(255,253,246,0.7)' : rgba(COL.ink, 0.4); ctx.fillRect(w * 0.25, -h * 0.8, w * 0.5, 3); ctx.fillRect(w * 0.25, -h * 0.72, w * 0.5, 3);
      ctx.restore();
      x += w + (lean ? 26 : 1.5); k++;
    }
    ctx.fillStyle = COL.ink; ctx.fillRect(x0, base, x1 - x0, 6);
  }
  ctx.strokeRect(x0, y0, x1 - x0, rows * rowH);
  ctx.restore();
}
const LOOSE = [[380, 952, -0.08], [900, 966, 0.1], [1040, 946, -0.2], [1640, 962, 0.12], [1140, 990, 0.05], [230, 992, 0.18], [1790, 1000, -0.1]];
// ---- the door
const DH = DGY - DTOP, DR = DW / 2, DLEN = 2 * (DH - DR) + Math.PI * DR;
function doorPt(u) {                 // a point on the outline: up the left side, over the arch, down the right side
  const s = u * DLEN, side = DH - DR, cy = DTOP + DR;
  if (s <= side) return [DX, DGY - s];
  if (s <= side + Math.PI * DR) { const a = Math.PI + (s - side) / DR; return [DX + DR + Math.cos(a) * DR, cy + Math.sin(a) * DR]; }
  return [DX + DW, cy + (s - side - Math.PI * DR)];
}
export const archPath = ctx => { ctx.beginPath(); ctx.moveTo(DX, DGY); ctx.lineTo(DX, DTOP + DR); ctx.arc(DX + DR, DTOP + DR, DR, Math.PI, 0); ctx.lineTo(DX + DW, DGY); };
const invIo = u => (u < 0.5 ? Math.cbrt(u / 4) : 1 - Math.cbrt(2 * (1 - u)) / 2);
let LEAF = null;
function leafArt() {                 // the door leaf, drawn once: panels, her flower, a knob that is a full stop
  if (LEAF) return LEAF;
  const make = shade => {
    const c = new OffscreenCanvas(DW * DPR, DH * DPR), x = c.getContext('2d');
    x.scale(DPR, DPR);
    const arch = i => { x.beginPath(); x.moveTo(i, DH); x.lineTo(i, DR); x.arc(DR, DR, DR - i, Math.PI, 0); x.lineTo(DW - i, DH); x.closePath(); };
    arch(0); x.fillStyle = shade ? '#C9B58E' : '#F1E4C8'; x.fill();
    x.save(); arch(0); x.clip(); x.strokeStyle = 'rgba(120,88,48,0.13)'; x.lineWidth = 2;
    for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(i * DW / 9 + rnd(i, 7) * 8, 0); x.lineTo(i * DW / 9 + rnd(i, 8) * 8, DH); x.stroke(); }
    x.restore();
    x.lineWidth = 4; x.strokeStyle = 'rgba(43,35,32,0.8)'; x.lineJoin = 'round'; x.fillStyle = shade ? '#D6C39E' : '#FBF3E0';
    x.beginPath(); x.moveTo(42, 296); x.lineTo(42, DR + 12); x.arc(DR, DR + 12, DR - 42, Math.PI, 0); x.lineTo(DW - 42, 296); x.closePath(); x.fill(); x.stroke();
    x.beginPath(); x.roundRect(42, 364, DW - 84, 184, 10); x.fill(); x.stroke();
    flower(x, DR, 176, 40, 0.2, shade ? '#C96A2A' : COL.orange, COL.cream, COL.ink);
    x.fillStyle = shade ? '#C96A2A' : COL.orange; x.strokeStyle = COL.ink; x.lineWidth = 4; x.beginPath(); x.arc(DW - 34, 330, 12, 0, TAU); x.fill(); x.stroke();
    arch(3); x.lineWidth = 6; x.strokeStyle = COL.ink; x.stroke();
    return c;
  };
  LEAF = { a: make(false), b: make(true) };
  return LEAF;
}
// the leaf turned by th radians about its left edge, toward the viewer: it narrows, and its free edge comes nearer
export function drawLeaf(ctx, th) {
  const { a, b } = leafArt(), c = Math.cos(th), s = Math.sin(th), eye = 600, N = 60;
  const S = lx => 1 + 0.2 * (lx / DW) * s, X = lx => DX + lx * c * S(lx);
  for (let i = 0; i < N; i++) {
    const l0 = (i * DW) / N, l1 = ((i + 1) * DW) / N, sc = S((l0 + l1) / 2), x0 = X(l0), y0 = eye + (DTOP - eye) * sc;
    ctx.drawImage(a, l0 * DPR, 0, (l1 - l0) * DPR, DH * DPR, x0, y0, X(l1) - x0 + 0.7, DH * sc);
    if (s > 0.01) { ctx.globalAlpha = Math.min(1, s * 0.8); ctx.drawImage(b, l0 * DPR, 0, (l1 - l0) * DPR, DH * DPR, x0, y0, X(l1) - x0 + 0.7, DH * sc); ctx.globalAlpha = 1; }
  }
  const xe = X(DW), sc = S(DW), yt = eye + (DTOP + DR - eye) * sc, yb = eye + (DGY - eye) * sc, tw = 11 * s;
  if (tw > 0.6) { ctx.fillStyle = '#B9A47C'; ctx.fillRect(xe - 1, yt, tw, yb - yt); ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.strokeRect(xe - 1, yt, tw, yb - yt); }
  return { xe: xe + tw, yb };
}
export function petal(ctx, x, y, r, rot, flip, color, a) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(flip, 1);
  ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.52, 0, 0, TAU); ctx.fillStyle = color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = rgba(COL.ink, 0.75); ctx.stroke(); ctx.restore();
}
export function sDoor(ctx, t) {
  const zIn = E.in(sat(t, 55.1, 55.91)), dcx = DX + DW / 2, dcy = 650;
  const drawP = E.io(sat(t, 52.75, 53.95));                                  // the caret draws the outline
  const real = sat(t, 53.99, 54.16);                                         // on “合上” the drawing becomes a door
  const knock = 0.07 * hit(t, 54.2, 7) + 0.11 * hit(t, 54.63, 7);            // the outside pushes at it, twice, on the beat
  const swing = t < 54.87 ? 0 : 1.36 * E.back(sat(t, 54.87, 55.42));         // then it swings wide, a little too far, and settles
  const th = Math.min(1.5, knock + swing), open = clamp(swing / 1.36);
  const crack = sat(t, 54.05, 54.22) * (0.4 + 0.6 * Math.max(hit(t, 54.2, 4), hit(t, 54.63, 4), sat(t, 54.78, 54.87)));
  cam(ctx, t, { z: 1.05 - 0.03 * E.out(sat(t, 52.48, 53.3)) + 0.035 * E.io(sat(t, 54.0, 54.87)) + 0.75 * zIn, cx: dcx, cy: dcy, seed: 7,
    x: Math.sin(t * 70) * 5 * hit(t, 53.99, 9), y: Math.cos(t * 55) * 4 * hit(t, 53.99, 9) }, () => {
    paper(ctx);
    // her study: shelves of everything she has read, a line of pages overhead
    shelf(ctx, 70, 1130, 170, 5, 150, 300);
    shelf(ctx, 1660, 1900, 170, 5, 150, 400);
    const swingA = 0.07 + 0.34 * open + 0.2 * hit(t, 53.99, 4);
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.5; ctx.beginPath();
    for (let i = 0; i <= 40; i++) { const u = i / 40, x = -40 + u * 2000, y = 62 + 50 * Math.sin(Math.PI * u); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke();
    for (let i = 0; i < 12; i++) {
      const u = (i + 0.7) / 12.6, x = -40 + u * 2000, y = 62 + 50 * Math.sin(Math.PI * u), a = Math.sin(t * 1.8 + i * 1.3) * swingA - 0.4 * open;
      ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.fillStyle = i % 4 === 2 ? COL.peach : COL.white; ctx.fillRect(-22, 0, 44, 60); ctx.lineWidth = 2.5; ctx.strokeRect(-22, 0, 44, 60);
      ctx.fillStyle = rgba(COL.ink, 0.35); for (let k = 0; k < 3; k++) ctx.fillRect(-14, 14 + k * 12, 28, 2.5);
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(245,237,221,0.42)'; ctx.fillRect(-300, -300, W + 600, DGY + 300);        // a veil, so she stands clear of it all
    ctx.fillStyle = '#EEE3CC'; ctx.fillRect(-300, DGY, W + 600, 500);
    ctx.strokeStyle = rgba(COL.ink, 0.15); ctx.lineWidth = 2;
    for (let i = -6; i <= 18; i++) { const xi = i * 150 - 100; ctx.beginPath(); ctx.moveTo(xi, DGY); ctx.lineTo(dcx + (xi - dcx) * 2.3, DGY + 300); ctx.stroke(); }
    // the light it lets in
    if (open > 0) {
      rays(ctx, dcx, dcy, t, 0.32 * open, COL.yellow, 12);
      const gl = ctx.createRadialGradient(dcx, dcy, 60, dcx, dcy, 900); gl.addColorStop(0, rgba('#FFE9B8', 0.85 * open)); gl.addColorStop(1, rgba('#FFE9B8', 0));
      ctx.fillStyle = gl; ctx.fillRect(-300, -300, W + 600, H + 600);
    }
    // what is outside: the first colour of the film
    if (th > 0.004) {
      ctx.save(); archPath(ctx); ctx.closePath(); ctx.clip();
      const g = ctx.createLinearGradient(0, DTOP, 0, DGY); g.addColorStop(0, '#FFF9E6'); g.addColorStop(1, '#FDD9A6');
      ctx.fillStyle = g; ctx.fillRect(DX, DTOP, DW, DH);
      const par = -26 * zIn;
      ctx.save(); ctx.translate(DX + DW * 0.6 + par, DTOP + 262); ctx.rotate(t * 0.5); ctx.fillStyle = 'rgba(255,214,140,0.55)';
      for (let i = 0; i < 10; i++) { ctx.rotate(TAU / 10); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(260, -26); ctx.lineTo(260, 26); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = '#FFE7AE'; ctx.beginPath(); ctx.arc(DX + DW * 0.6 + par, DTOP + 262, 70, 0, TAU); ctx.fill();
      ctx.fillStyle = '#F9D3A4'; ctx.beginPath(); ctx.moveTo(DX - 40, 712); ctx.quadraticCurveTo(DX + 110 + par, 640, DX + DW + 40, 726); ctx.lineTo(DX + DW + 40, DGY); ctx.lineTo(DX - 40, DGY); ctx.fill();
      ctx.fillStyle = '#F0A260'; ctx.beginPath(); ctx.moveTo(DX - 40, 824); ctx.quadraticCurveTo(DX + 210 + par * 2, 742, DX + DW + 40, 800); ctx.lineTo(DX + DW + 40, DGY); ctx.lineTo(DX - 40, DGY); ctx.fill();
      ctx.fillStyle = COL.white; ctx.strokeStyle = rgba(COL.ink, 0.6); ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(DX + 92, DGY + 4); ctx.lineTo(DX + 212, DGY + 4); ctx.lineTo(DX + 170, 784); ctx.lineTo(DX + 150, 784); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = COL.orangeD; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const bx = DX + 70 + i * 74 + Math.sin(t * 1.3 + i * 2) * 18, by = DTOP + 150 + i * 44 + Math.cos(t * 1.7 + i) * 10, fl = Math.sin(t * 12 + i * 2) * 8; ctx.beginPath(); ctx.moveTo(bx - 13, by - fl); ctx.lineTo(bx, by); ctx.lineTo(bx + 13, by - fl); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-300, DGY); ctx.lineTo(W + 300, DGY); ctx.stroke();
    // books and loose pages on the floor; the wind from the door takes the pages
    for (const [bx, n] of [[150, 5], [1760, 3]]) for (let j = 0; j < n; j++) {
      const bw = 150 - j * 12 - (j % 2) * 10, bh = 26; ctx.fillStyle = j === 1 ? COL.orange : BOOKC[(j + 1) % 5]; ctx.lineWidth = 3; ctx.strokeStyle = COL.ink;
      ctx.fillRect(bx - bw / 2 + (j % 2) * 8, DGY + 44 - (j + 1) * bh, bw, bh); ctx.strokeRect(bx - bw / 2 + (j % 2) * 8, DGY + 44 - (j + 1) * bh, bw, bh);
    }
    LOOSE.forEach(([px, py, rot], i) => {
      const u = Math.max(0, t - 54.92 - i * 0.06), v = 0.6 + rnd(i, 501) * 0.7, hop = 14 * hit(t, 53.99, 6) * (1 - Math.abs(px - 620) / 1400);
      const x = px - 620 * u * v, y = py - hop - (520 * u - 430 * u * u) * v, hh = 44 + 110 * sat(u * 3, 0, 1);
      miniPage(ctx, x, y, 120, hh, rot + u * (4 + i) * (i % 2 ? 1 : -1), 1 - sat(u, 0.9, 1.3));
    });
    // light under and around the door before it opens
    if (real > 0 && crack > 0.01 && open < 1) {
      ctx.save(); ctx.shadowColor = 'rgba(255,206,110,0.95)'; ctx.shadowBlur = 54; ctx.strokeStyle = rgba('#FFE9B0', crack * (1 - open)); ctx.lineWidth = 18; ctx.lineJoin = 'round';
      archPath(ctx); ctx.stroke(); ctx.stroke(); ctx.stroke();
      ctx.fillStyle = rgba('#FFE9B0', crack * (1 - open)); ctx.fillRect(DX + 8, DGY - 4, DW - 16, 7);
      ctx.restore();
      const fg = ctx.createLinearGradient(0, DGY, 0, DGY + 120); fg.addColorStop(0, rgba('#FFE2A0', 0.7 * crack * (1 - open))); fg.addColorStop(1, rgba('#FFE2A0', 0));
      ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(DX + 10, DGY); ctx.lineTo(DX + DW - 10, DGY); ctx.lineTo(DX + DW + 50, DGY + 120); ctx.lineTo(DX - 130, DGY + 120); ctx.closePath(); ctx.fill();
    }
    // the outline: drawn by the caret, then the frame of a real door
    if (drawP > 0) {
      ctx.save(); ctx.lineWidth = 9 + 9 * hit(t, 53.99, 9); ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = COL.ink;
      ctx.setLineDash([DLEN, DLEN]); ctx.lineDashOffset = DLEN * (1 - drawP); archPath(ctx); ctx.stroke(); ctx.restore();
    }
    // where the leaf is now, and the wedge of light the opening throws on the floor
    let xe = DX + DW;
    if (real > 0) {
      const c = Math.cos(th), s = Math.sin(th); xe = Math.min(DX + DW, DX + DW * c * (1 + 0.2 * s) + 11 * s);
      if (th > 0.01) {
        const wd = clamp(th / 0.5), fl = ctx.createLinearGradient(0, DGY, 0, DGY + 280); fl.addColorStop(0, rgba('#FFE08E', 0.85 * wd)); fl.addColorStop(1, rgba('#FFE08E', 0.1 * wd));
        ctx.fillStyle = fl; ctx.beginPath(); ctx.moveTo(xe, DGY); ctx.lineTo(DX + DW, DGY); ctx.lineTo(DX + DW + 210, DGY + 280); ctx.lineTo(xe - 120 - 700 * open, DGY + 280); ctx.closePath(); ctx.fill();
        ctx.fillStyle = rgba('#3A2A1A', 0.16 * open); ctx.beginPath(); ctx.moveTo(DX, DGY); ctx.lineTo(xe, DGY + 40 * s); ctx.lineTo(xe - 170 * s, DGY + 96 * s); ctx.lineTo(DX - 70 * s, DGY + 22 * s); ctx.closePath(); ctx.fill();
      }
      ctx.save();
      if (real < 1) { const hh = (DH + 30) * E.out(real); ctx.beginPath(); ctx.rect(DX - 30, DGY - hh, DW + 60, hh + 80); ctx.clip(); }      // ink rising into it
      ctx.translate(Math.sin(t * 90) * 2.5 * (hit(t, 54.2, 9) + hit(t, 54.63, 9)), 0);
      drawLeaf(ctx, th);
      ctx.restore();
    }
    // the caret that draws it, and the sparks it leaves
    if (drawP > 0 && t < 54.25) {
      for (let k = 0; k <= 44; k++) {
        const uk = k / 44; if (uk > drawP) break;
        const age = t - (52.75 + 1.2 * invIo(uk)); if (age < 0 || age > 0.55) continue;
        const [sx, sy] = doorPt(uk), f = 1 - age / 0.55;
        star4(ctx, sx + (rnd(k, 531) - 0.5) * 44, sy + (rnd(k, 532) - 0.5) * 30 + age * 60, (7 + rnd(k, 533) * 11) * f, k % 3 ? COL.orange : COL.yellow, f);
      }
      if (drawP < 1) {
        const [cx0, cy0] = doorPt(drawP);
        const gg = ctx.createRadialGradient(cx0, cy0, 0, cx0, cy0, 60); gg.addColorStop(0, rgba(COL.orange, 0.45)); gg.addColorStop(1, rgba(COL.orange, 0));
        ctx.fillStyle = gg; ctx.fillRect(cx0 - 60, cy0 - 60, 120, 120);
        ctx.fillStyle = COL.orange; rrect(ctx, cx0 - 5, cy0 - 26, 10, 52, 5); ctx.fill();
      }
    }
    // its name, which drops into place on “书”
    const np = sat(t, 54.42, 54.72);
    if (np > 0) {
      const sw2 = Math.sin((t - 54.42) * 13) * 0.16 * Math.exp(-(t - 54.42) * 4.5) + Math.sin(t * 2.2) * 0.02 * (1 + 4 * open);
      ctx.save(); ctx.translate(dcx, DTOP - 104 + 4); ctx.rotate(sw2); ctx.translate(0, 38 - 70 * (1 - E.back(np)));
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, -34); ctx.lineTo(0, -62 + 70 * (1 - E.back(np))); ctx.lineTo(50, -34); ctx.stroke();
      cut(ctx, () => rrect(ctx, -84, -34, 168, 68, 12), COL.white, 0.25, 16, 6);
      rrect(ctx, -84, -34, 168, 68, 12); ctx.lineWidth = 4.5; ctx.strokeStyle = COL.ink; ctx.stroke();
      text(ctx, '明天', 3, 2, { size: 40, weight: 800, color: COL.orange, ls: 6 });
      ctx.restore();
    }
    for (let i = 0; i < 16; i++) {               // dust in the light
      const x = DX - 560 + rnd(i, 511) * 700 + Math.sin(t * 0.7 + i) * 20, y = 520 + rnd(i, 512) * 380 - ((t * 14) % 40);
      ctx.fillStyle = rgba('#FFF3D0', open * (0.3 + 0.5 * (Math.sin(t * 2 + i * 1.7) * 0.5 + 0.5))); ctx.beginPath(); ctx.arc(x, y, 3 + rnd(i, 513) * 3, 0, TAU); ctx.fill();
    }
    const PC = [COL.orange, COL.yellow, COL.white, COL.peach];
    const petals = (from, to) => { for (let i = from; i < to; i++) {         // petals blow in from outside
      const dt = t - 54.93 - rnd(i, 541) * 0.75; if (dt < 0) continue;
      const sp = 620 + rnd(i, 542) * 760, y0 = DTOP + 170 + rnd(i, 543) * (DH - 230);
      const x = DX + DW * 0.72 - dt * sp, y = y0 + Math.sin(dt * 5 + i) * 46 - dt * 50 + dt * dt * 150;
      if (x < -80) continue;
      petal(ctx, x, y, 9 + rnd(i, 544) * 12 + dt * 8, dt * (5 + rnd(i, 545) * 6) + i, Math.cos(dt * (7 + rnd(i, 546) * 6) + i), PC[i % 4], sat(dt, 0, 0.08));
    } };
    petals(0, 16);
    // 橙子: reading, shuts the book on 合上, walks out on 出门
    const closed = t >= 53.99, walking = t >= 55.05;
    const x = lerp(620, 1230, E.in(sat(t, 55.05, 55.95)));
    if (open > 0) { ctx.fillStyle = rgba('#3A2A1A', 0.13 * open); ctx.beginPath(); ctx.ellipse(x - 200 * open, DGY + 8, 150 + 200 * open, 17, 0, 0, TAU); ctx.fill(); }
    const s1 = sq(t, 53.99, 1.6), s2 = sq(t, 54.63, 0.7), b = breathe(t), wb = walkBob(t);
    if (walking) char(ctx, walkPose(t), x, DGY, 680, { lift: wb.lift, rot: wb.rot, windX: -10, flutter: 3.5, shadowA: 0.6 });
    else char(ctx, closed ? 'o05' : 'o02', x, DGY, 680, { sx: b.sx * s1.sx * s2.sx, sy: b.sy * s1.sy * s2.sy, rot: b.rot, windX: -12 * open, flutter: 4 * open, shadowA: 1 - 0.4 * open });
    const sn = sat(t, 53.99, 54.38);
    if (sn > 0 && sn < 1) {
      ctx.strokeStyle = rgba(COL.orange, 1 - sn); ctx.lineWidth = 8;
      for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU, r0 = 260 + 70 * E.out(sn); ctx.beginPath(); ctx.moveTo(620 + Math.cos(an) * r0, 560 + Math.sin(an) * r0); ctx.lineTo(620 + Math.cos(an) * (r0 + 50), 560 + Math.sin(an) * (r0 + 50)); ctx.stroke(); }
    }
    const pa = sat(t, 53.99, 54.12) * (1 - sat(t, 54.55, 54.82));
    if (pa > 0) { const k = 0.6 + 0.5 * E.back(sat(t, 53.99, 54.22)); drawGlyph(ctx, '啪', 930, 340, 110, { weight: 900, color: COL.orange, alpha: pa, rot: 0.2, sx: k, sy: k }); }
    petals(16, 30);
  });
  bokeh(ctx, t, { n: 8, seed: 95, alpha: 0.12 });
  finish(ctx);
  const wa = E.in(sat(t, 55.3, 55.9));
  if (wa > 0) { ctx.fillStyle = rgba('#FFF7DB', wa); ctx.fillRect(0, 0, W, H); }
}

// ------------------------------------------------------------------ 0:28–0:38.7  “在吗”两个字 落在黑夜
// Three beats, one per bar. Someone far away starts to write and thinks better of it, twice; then two characters land
// in the dark and wake what sleeps there; then Enter sends them across the night as a paper plane, to her fingertip.
const NB = { x: 1000, y: 245, w: 760, h: 110, ty: 300, tx: 1070, step: 92 };          // the input box, far away
const NO = { x: 360, y: 965, s: 560 };                                               // 橙子
const TIP = [NO.x + 385 * (NO.s / 1137), NO.y - 915 * (NO.s / 1137)];                // her fingertip in the reaching pose
const TRY = [['你', 28.82, 29.95, 0], ['好', 29.11, 29.6, 1], ['那', 30.17, 31.08, 0], ['个', 30.47, 30.87, 1]];   // typed, then deleted
const LAND = [31.53, 31.72], SRC = [1116, 300], KEYP = [1700, 300];
const SEND = 35.54, FLY0 = 35.78, FLY1 = 37.73, WAKE = 32.06;
let NLINES = null;
export function nightLines(ctx) {
  if (NLINES) return NLINES;
  NLINES = []; let k = 0;
  for (let r = 0; r < 15; r++) {
    const y = 64 + r * 66; let x = -140 + rnd(r, 601) * 260;
    while (x < W + 60) {
      const str = MEMO[(k * 5 + r * 3 + 1) % MEMO.length], w = measure(ctx, str, 30, 400, undefined, 2);
      if (!(x < NB.x + NB.w + 70 && x + w > NB.x - 70 && y > NB.y - 56 && y < NB.y + NB.h + 56)) NLINES.push({ str, x, y, cx: x + w / 2 });
      x += w + 110 + rnd(k, 602) * 170; k++;
    }
  }
  return NLINES;
}
function planeAt(t) {
  const u = sat(t, FLY0, FLY1), P = [KEYP, [1930, 40], [1040, 0], [TIP[0] + 6, TIP[1] - 22]];
  const B = q => { const m = 1 - q, w = Math.sin(q * Math.PI * 4) * 20 * Math.sin(Math.PI * q);
    return [m * m * m * P[0][0] + 3 * m * m * q * P[1][0] + 3 * m * q * q * P[2][0] + q * q * q * P[3][0], m * m * m * P[0][1] + 3 * m * m * q * P[1][1] + 3 * m * q * q * P[2][1] + q * q * q * P[3][1] + w]; };
  const ease = q => q * q * (3 - 2 * q), e = ease(u), a = B(Math.max(0, e - 0.012)), b = B(Math.min(1, e + 0.012)), p = B(e);
  return { x: p[0], y: p[1], ang: Math.atan2(b[1] - a[1], b[0] - a[0]), B, e };
}
export function paperPlane(ctx, x, y, ang, sc, alpha = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(sc, Math.cos(ang) < 0 ? -sc : sc); ctx.globalAlpha *= alpha;
  ctx.lineJoin = 'round'; ctx.lineWidth = 2.5; ctx.strokeStyle = COL.ink;
  ctx.save(); ctx.shadowColor = 'rgba(255,190,110,0.95)'; ctx.shadowBlur = 30;
  ctx.fillStyle = '#E9DCC2'; ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(-26, -21); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill(); ctx.restore();
  ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(-26, -21); ctx.lineTo(-13, 0); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#CDBB98'; ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(-13, 0); ctx.lineTo(-20, 13); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = COL.white; ctx.beginPath(); ctx.moveTo(32, 0); ctx.lineTo(-32, 17); ctx.lineTo(-13, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function sNight(ctx, t) {
  const lines = nightLines(ctx);
  const lit = sat(t, LAND[0], LAND[0] + 0.5), boom = E.out(sat(t, FLY1, FLY1 + 0.7)), shake = hit(t, FLY1, 7) * 9;
  const flying = t >= FLY0 && t < FLY1, PL = planeAt(t);
  cam(ctx, t, { z: 1.0 + 0.035 * E.io(sat(t, 28.1, 37.7)) + 0.022 * (hit(t, LAND[0], 6) + hit(t, LAND[1], 6)) + 0.03 * hit(t, FLY1, 6), cx: 960, cy: 560,
    x: Math.sin(t * 60) * shake, y: Math.cos(t * 47) * shake, seed: 4 }, () => {
    ctx.fillStyle = mix(COL.night, '#3A2A26', boom * 0.85); ctx.fillRect(-300, -300, W + 600, H + 600);
    // the only light: a caret, far away
    const typed = TRY.filter(c => t >= c[1] && t < c[2]), nT = typed.length, nF = t < SEND ? LAND.filter(x => t >= x).length : 0, n = nT + nF;
    const lastKey = Math.max(...TRY.flatMap(c => [c[1], c[2]]).concat(LAND).filter(x => x <= t), 0);
    const cOn = t - lastKey < 0.35 || (t % 0.86) < 0.5;
    const g0 = ctx.createRadialGradient(SRC[0], SRC[1], 10, SRC[0], SRC[1], 520 + 420 * lit);
    g0.addColorStop(0, rgba(COL.orange, (cOn ? 0.1 : 0.06) + 0.26 * lit)); g0.addColorStop(1, rgba(COL.orange, 0));
    ctx.fillStyle = g0; ctx.fillRect(-300, -300, W + 600, H + 600);
    // everything she has read, asleep in the dark; light wakes each line as it passes
    for (const L of lines) {
      let a = 0.045, warm = 0;
      for (const t0 of LAND) {
        const dt = t - t0; if (dt <= 0) continue;
        const r = dt * 1500, d = Math.hypot(L.cx - SRC[0], L.y - SRC[1]), f = Math.exp(-(((d - r) / 120) ** 2)) * Math.max(0, 1 - dt / 1.7);
        a += 0.5 * f; warm += f; if (r > d) a += 0.035;
      }
      if (flying) { const f = Math.exp(-((Math.hypot(L.cx - PL.x, L.y - PL.y) / 240) ** 2)); a += 0.5 * f; warm += f; }
      a += 0.42 * boom;
      text(ctx, L.str, L.x, L.y, { size: 30, weight: 400, align: 'left', ls: 2, color: mix(COL.cream, COL.orange, Math.min(1, warm) * 0.55), alpha: Math.min(0.9, a) });
    }
    // “落在黑夜”: each character makes a ring in the night, like a drop in still water
    for (const t0 of LAND) {
      const dt = t - t0; if (dt <= 0 || dt > 1.7) continue;
      const r = dt * 1500, f = 1 - dt / 1.7;
      ctx.strokeStyle = rgba(COL.cream, 0.55 * f); ctx.lineWidth = 3 + 5 * f; ctx.beginPath(); ctx.arc(SRC[0], SRC[1], r, 0, TAU); ctx.stroke();
      ctx.strokeStyle = rgba(COL.orange, 0.5 * f); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(SRC[0], SRC[1], Math.max(0, r - 46), 0, TAU); ctx.stroke();
    }
    // the input box
    ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.55 * lit); ctx.shadowBlur = 60;
    rrect(ctx, NB.x, NB.y, NB.w, NB.h, NB.h / 2); ctx.fillStyle = rgba(COL.cream, 0.05 + 0.06 * lit); ctx.fill(); ctx.restore();
    rrect(ctx, NB.x, NB.y, NB.w, NB.h, NB.h / 2); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.cream, 0.36 + 0.5 * lit); ctx.stroke();
    for (const c of typed) { const s = 1 + 0.2 * hit(t, c[1], 14); drawGlyph(ctx, c[0], NB.tx + c[3] * NB.step, NB.ty, 76, { weight: 500, color: COL.cream, alpha: 0.62, sx: s, sy: s }); }
    const go = E.in(sat(t, SEND, FLY0));                         // on Enter the two characters fold away toward the key
    if (go < 1) {
      ctx.save(); ctx.shadowColor = rgba(COL.orange, 0.95); ctx.shadowBlur = 40;
      ['在', '吗'].forEach((ch, i) => {
        if (t < LAND[i]) return;
        const s = (1 + 0.28 * hit(t, LAND[i], 12)) * (1 - 0.8 * go);
        drawGlyph(ctx, ch, lerp(NB.tx + i * NB.step, KEYP[0], go), NB.ty, 78, { weight: 700, color: COL.cream, alpha: 1 - go, sx: s, sy: s });
      });
      ctx.restore();
    }
    caret(ctx, NB.tx - 46 + n * NB.step + (n ? 4 : 0), NB.ty, 70, t, n || t > LAND[0] ? COL.orange : rgba(COL.cream, 0.85), 6, cOn);
    // the Enter key
    const ka = sat(t, 35.0, 35.22) * (1 - sat(t, FLY0, FLY0 + 0.3));
    if (ka > 0) {
      const press = (sat(t, SEND - 0.05, SEND) - sat(t, SEND + 0.12, SEND + 0.2)) * 10, ks = (0.5 + 0.5 * E.back(sat(t, 35.0, 35.3))) * 0.82;
      ctx.save(); ctx.translate(KEYP[0], KEYP[1]); ctx.scale(ks, ks); ctx.globalAlpha = ka;
      rrect(ctx, -64, -42 + 12, 128, 92, 18); ctx.fillStyle = '#B9A98C'; ctx.fill();
      rrect(ctx, -64, -48 + press, 128, 92, 18); ctx.fillStyle = COL.cream; ctx.fill();
      ctx.lineWidth = 4; ctx.strokeStyle = COL.ink; ctx.stroke();
      ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = COL.orangeD;
      ctx.beginPath(); ctx.moveTo(26, -24 + press); ctx.lineTo(26, 6 + press); ctx.lineTo(-26, 6 + press); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -8 + press); ctx.lineTo(-28, 6 + press); ctx.lineTo(-12, 20 + press); ctx.stroke();
      ctx.restore();
      const cp = sat(t, SEND, SEND + 0.3);
      if (cp > 0 && cp < 1) { ctx.strokeStyle = rgba(COL.cream, 0.8 * (1 - cp)); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(KEYP[0], KEYP[1], 60 + 80 * E.out(cp), 0, TAU); ctx.stroke(); }
    }
    // 橙子: asleep; woken when the ring reaches her; reaching when she sees it coming
    const pose = t < WAKE ? 'o01' : t < 36.35 ? 'o04' : 'o08';
    const hl = sat(t, WAKE - 0.1, WAKE + 0.25), b = breathe(t, 1.2), s1 = sq(t, WAKE, 1.4), s2 = sq(t, 36.35, 1.0), s3 = sq(t, FLY1, 1.5);
    ctx.save(); ctx.filter = `brightness(${0.42 + 0.58 * hl})`;
    char(ctx, pose, NO.x, NO.y, NO.s, { sx: b.sx * s1.sx * s2.sx * s3.sx, sy: b.sy * s1.sy * s2.sy * s3.sy, rot: b.rot, shadowColor: '#000000' });
    ctx.restore();
    const ea = sat(t, WAKE + 0.05, WAKE + 0.25) * (1 - sat(t, 34.2, 34.7));
    if (ea > 0) { const k = 0.5 + 0.5 * E.back(sat(t, WAKE + 0.05, WAKE + 0.3)); drawGlyph(ctx, '！', NO.x + 232, NO.y - 520, 120, { weight: 900, color: COL.orange, alpha: ea, rot: 0.15, sx: k, sy: k }); }
    // the message, sent: a paper plane across the night
    if (t >= SEND + 0.05 && t < FLY1) {
      if (flying) for (let i = 14; i >= 1; i--) {
        const q = PL.e - i * 0.016; if (q <= 0) continue;
        const p0 = PL.B(q), p1 = PL.B(q + 0.008);
        ctx.strokeStyle = rgba(COL.cream, 0.7 * (1 - i / 15)); ctx.lineWidth = 4 * (1 - i / 18); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke();
      }
      const gl = ctx.createRadialGradient(PL.x, PL.y, 0, PL.x, PL.y, 190); gl.addColorStop(0, rgba(COL.orange, 0.3)); gl.addColorStop(1, rgba(COL.orange, 0));
      ctx.fillStyle = gl; ctx.fillRect(PL.x - 190, PL.y - 190, 380, 380);
      paperPlane(ctx, PL.x, PL.y, flying ? PL.ang : -0.5, 1.5 * E.back(sat(t, SEND + 0.05, FLY0)));
    }
    // it lands on her fingertip, and is a page
    if (t >= FLY1) {
      const lp = sat(t, FLY1, FLY1 + 0.5), px = TIP[0] + 6, py = TIP[1] - 30 - 46 * E.out(lp) + Math.sin(t * 3) * 4;
      rays(ctx, px, py, t * 2, 0.16 * boom, COL.peach, 14);
      const gl = ctx.createRadialGradient(px, py, 0, px, py, 420); gl.addColorStop(0, rgba('#FFE2B0', 0.6 * boom)); gl.addColorStop(1, rgba('#FFE2B0', 0));
      ctx.fillStyle = gl; ctx.fillRect(px - 420, py - 420, 840, 840);
      for (const [w0, c, r0] of [[46, COL.cream, 2100], [16, COL.orange, 1500]]) {
        if (boom >= 1) break;
        ctx.lineWidth = w0 * (1 - boom) + 1.5; ctx.strokeStyle = rgba(c, 0.9 * (1 - boom)); ctx.beginPath(); ctx.arc(px, py, r0 * boom, 0, TAU); ctx.stroke();
      }
      const pw = 64 + 44 * E.back(lp), ph = pw * 1.3;
      ctx.save(); ctx.translate(px, py); ctx.rotate(-0.1 + Math.sin(t * 2.4) * 0.04);
      ctx.shadowColor = 'rgba(255,200,120,0.95)'; ctx.shadowBlur = 40; ctx.fillStyle = COL.white; ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
      ctx.shadowColor = 'transparent'; ctx.lineWidth = 3.5; ctx.strokeStyle = COL.ink; ctx.strokeRect(-pw / 2, -ph / 2, pw, ph);
      caret(ctx, -pw / 2 + 12, -ph / 2 + 22, 20, t, COL.orange, 4);
      ctx.restore();
    }
  });
  bokeh(ctx, t, { n: 16, seed: 70, colors: [COL.cream, COL.orange], alpha: 0.07 + 0.08 * lit, blend: 'screen', minR: 10, maxR: 60 });
  finish(ctx, { dark: true });
}
