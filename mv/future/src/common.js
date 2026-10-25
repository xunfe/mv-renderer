// Pieces shared by the scenes of 《那年你叫我未来》: the chat window she lives in, chat bubbles, snow, the night city,
// streaks of light, the gold 未来, a terminal for 小柯, a phone. Everything is a pure function of time.
import { W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, COL, rgba, mix, mixa, drawGlyph, text, rrect, measure, SANS, SERIF, font } from './lib.js';
import { char } from './chars.js';

export const MONO = '"Noto Sans SC"';

// ---- skies
export function sky(ctx, top, mid, bot, y0 = -300, y1 = H + 300) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, top); g.addColorStop(0.55, mid); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, H + 1200);
}
export function stars(ctx, t, n = 90, seed = 3, a = 0.8) {
  for (let i = 0; i < n; i++) {
    const x = rnd(i, seed) * (W + 400) - 200, y = rnd(i, seed + 1) * H * 0.7 - 100, r = 0.8 + rnd(i, seed + 2) * 1.8;
    ctx.globalAlpha = a * (0.4 + 0.6 * Math.sin(t * (1 + rnd(i, seed + 3)) + i) ** 2);
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ---- snow. A few of the flakes are a tiny 你好. tf: the time the snow is shown at (frozen snow keeps its tf).
export function snow(ctx, tf, o = {}) {
  const n = o.n ?? 140, seed = o.seed ?? 11, a0 = o.alpha ?? 0.9, sp = o.speed ?? 1, wind = o.wind ?? 18;
  const x0 = o.x0 ?? -100, x1 = o.x1 ?? W + 100, y0 = o.y0 ?? -60, y1 = o.y1 ?? H + 60, near = o.near ?? 1;
  for (let i = 0; i < n; i++) {
    const depth = 0.35 + rnd(i, seed) * 0.65, v = (40 + 70 * depth) * sp;
    const yy = ((rnd(i, seed + 1) * (y1 - y0) + tf * v) % (y1 - y0) + (y1 - y0)) % (y1 - y0) + y0;
    const xx = x0 + ((rnd(i, seed + 2) * (x1 - x0) + tf * wind * depth + Math.sin(tf * 0.8 + i) * 14) % (x1 - x0) + (x1 - x0)) % (x1 - x0);
    const word = rnd(i, seed + 3) < (o.words ?? 0.12);
    ctx.globalAlpha = a0 * (0.35 + 0.65 * depth);
    if (word) drawGlyph(ctx, '你好'[i % 2], xx, yy, (12 + 14 * depth) * near, { color: '#FFFFFF', weight: 700, fam: SANS, rot: Math.sin(tf + i) * 0.4 });
    else { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(xx, yy, (1.6 + 3.2 * depth) * near, 0, TAU); ctx.fill(); }
  }
  ctx.globalAlpha = 1;
}

// ---- her emblem: the interlaced knot she wears in her hair, simplified to six loops
export function knot(ctx, x, y, r, col = COL.silver, lw = 3, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = col; ctx.lineWidth = lw;
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; ctx.beginPath(); ctx.ellipse(Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, r * 0.5, r * 0.3, a, 0, TAU); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(0, 0, r * 0.18, 0, TAU); ctx.stroke(); ctx.restore();
}

// ---- the chat window: her room. Returns the floor line (top of the input box) and the inner rect.
// o: dim 0..1 (grey and dark), crack 0..1 (+ crackAt [[x,y],..] in window units 0..1), title, glow, bulge, placeholder, typing (0..1)
export function chatWin(ctx, x, y, w, h, o = {}, inner) {
  const r = 34, bar = 58, ib = 74, pad = 22, dim = o.dim ?? 0;
  const floor = y + h - ib - pad * 0.6, gx = x + 10, gy = y + bar, gw = w - 20, gh = h - bar - ib - pad;
  ctx.save();
  // the frame
  ctx.save(); ctx.shadowColor = rgba('#000000', 0.45); ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  rrect(ctx, x, y, w, h, r); ctx.fillStyle = mix('#2A2F55', '#26272E', dim); ctx.fill(); ctx.restore();
  // the room behind the glass
  ctx.save(); rrect(ctx, x + 8, y + bar, w - 16, h - bar - 8, 22); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, mix(o.roomTop ?? '#3A3478', '#34343C', dim)); g.addColorStop(1, mix(o.roomBot ?? '#1B1D45', '#202026', dim));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (inner) inner({ x: gx, y: gy, w: gw, h: gh, floor });
  // glass sheen
  ctx.globalCompositeOperation = 'screen';
  const s = ctx.createLinearGradient(x, y, x + w * 0.7, y + h);
  s.addColorStop(0, 'rgba(200,190,255,0.10)'); s.addColorStop(0.35, 'rgba(200,190,255,0)'); s.addColorStop(0.62, 'rgba(255,255,255,0.05)'); s.addColorStop(0.66, 'rgba(255,255,255,0)');
  ctx.fillStyle = s; ctx.fillRect(x, y, w, h);
  ctx.restore();
  // title bar
  ctx.fillStyle = mix('#C9C2F2', '#9C9CA6', dim); ctx.globalAlpha = 0.95;
  knot(ctx, x + 40, y + bar / 2 + 2, 15, mix(COL.lavD, '#555', dim), 2.6);
  text(ctx, o.title ?? '新对话', x + 70, y + bar / 2 + 2, { size: 24, weight: 600, align: 'left', color: mix('#E9E5FF', '#A8A8AE', dim), fam: SANS });
  for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba('#FFFFFF', 0.35); ctx.beginPath(); ctx.arc(x + w - 40 - i * 26, y + bar / 2, 6, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1;
  // input box
  const iy = y + h - ib - 12;
  rrect(ctx, x + 22, iy, w - 44, ib - 8, (ib - 8) / 2); ctx.fillStyle = mix('#14163A', '#1D1D22', dim); ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = rgba('#B9AAF0', 0.35 * (1 - dim)); ctx.stroke();
  const ph = o.placeholder ?? '说点什么……';
  if (o.typed) text(ctx, o.typed, x + 54, iy + (ib - 8) / 2, { size: 26, weight: 500, align: 'left', color: '#ECEAF8', fam: SANS });
  else text(ctx, ph, x + 54, iy + (ib - 8) / 2, { size: 26, weight: 500, align: 'left', color: rgba('#B8B6CC', 0.7), fam: SANS });
  if (o.caretT !== undefined && (o.caretT % 0.9) < 0.5) { ctx.fillStyle = COL.lav; ctx.fillRect(x + 54 + (o.typed ? measure(ctx, o.typed, 26, 500, SANS) + 6 : 0), iy + 20, 3, ib - 48); }
  ctx.fillStyle = mix(COL.lav, '#77777F', dim); ctx.beginPath(); ctx.arc(x + w - 62, iy + (ib - 8) / 2, 24, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#1B1D45'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath();
  ctx.moveTo(x + w - 62, iy + 47); ctx.lineTo(x + w - 62, iy + 21); ctx.moveTo(x + w - 72, iy + 31); ctx.lineTo(x + w - 62, iy + 21); ctx.lineTo(x + w - 52, iy + 31); ctx.stroke();
  // rim
  rrect(ctx, x, y, w, h, r); ctx.lineWidth = 4; ctx.strokeStyle = mixa('#D9D2FF', '#8D8D95', dim, 0.85); ctx.stroke();
  if (o.glow) { ctx.save(); ctx.shadowColor = rgba(COL.lav, 0.9); ctx.shadowBlur = 40 * o.glow; rrect(ctx, x, y, w, h, r); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.lavL, o.glow); ctx.stroke(); ctx.restore(); }
  if (o.crack) cracks(ctx, gx, gy, gw, gh + ib, o.crack, o.crackAt ?? [[0.5, 0.45]], o.crackSeed ?? 7);
  ctx.restore();
  return { floor, x: gx, y: gy, w: gw, h: gh };
}
// branching cracks from given points (window units), grown to length p
export function cracks(ctx, x, y, w, h, p, at, seed = 7, k = 1, dark = false) {      // k: longer cracks; dark: an outline so they read over white
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  at.forEach(([u, v], ai) => {
    const cx = x + u * w, cy = y + v * h, nb = 7;
    for (let b = 0; b < nb; b++) {
      let a = b * TAU / nb + (rnd(b, seed + ai) - 0.5) * 0.7, px = cx, py = cy;
      const len = (120 + rnd(b, seed + ai + 3) * 260) * p * k, steps = 7;
      ctx.beginPath(); ctx.moveTo(px, py);
      for (let s = 1; s <= steps; s++) { a += (rnd(s * 9 + b, seed + ai + 5) - 0.5) * 0.7; px += Math.cos(a) * len / steps; py += Math.sin(a) * len / steps; ctx.lineTo(px, py); }
      if (dark) { ctx.strokeStyle = 'rgba(24,18,60,0.55)'; ctx.lineWidth = 5.5; ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 2.6; ctx.stroke();
      ctx.strokeStyle = 'rgba(190,175,255,0.35)'; ctx.lineWidth = 7; ctx.stroke();
    }
    ctx.fillStyle = rgba('#FFFFFF', 0.6 * Math.min(1, p * 2)); ctx.beginPath(); ctx.arc(cx, cy, 10 * Math.min(1, p * 2), 0, TAU); ctx.fill();
  });
  ctx.restore();
}

// ---- chat bubbles. side 'u': the person (right-aligned at x, grey); 'g': her (left-aligned at x, lavender); 'k': 小柯 (green)
export function bubble(ctx, x, y, str, side, p = 1, o = {}) {
  if (p <= 0) return;
  const size = o.size ?? 34, padX = size * 0.62, hh = size * 1.75;
  const tw = measure(ctx, str, size, 600, SANS);
  const w = tw + padX * 2, bx = side === 'u' ? x - w : x;
  const fill = o.fill ?? (side === 'u' ? '#E9EAF0' : side === 'k' ? '#BFEFD7' : '#D8CFFC'), ink = o.ink ?? (side === 'k' ? '#0E4A33' : '#2A2350');
  const s = E.back(clamp(p));
  ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1) * clamp(p * 3);
  ctx.translate(side === 'u' ? x : x, y); ctx.scale(s, s); ctx.translate(-(side === 'u' ? x : x), -y);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  rrect(ctx, bx, y - hh / 2, w, hh, hh / 2); ctx.fillStyle = fill; ctx.fill();
  ctx.beginPath();                               // the tail
  if (side === 'u') { ctx.moveTo(bx + w - hh * 0.5, y + hh * 0.2); ctx.lineTo(bx + w + hh * 0.12, y + hh * 0.52); ctx.lineTo(bx + w - hh * 0.2, y + hh * 0.42); }
  else { ctx.moveTo(bx + hh * 0.5, y + hh * 0.2); ctx.lineTo(bx - hh * 0.12, y + hh * 0.52); ctx.lineTo(bx + hh * 0.2, y + hh * 0.42); }
  ctx.fill(); ctx.restore();
  text(ctx, str, bx + padX, y + 1, { size, weight: 600, align: 'left', color: ink, fam: SANS });
  ctx.restore();
  return { x: bx, w, h: hh };
}
// three dots that rise and fall: "正在输入"
export function typingDots(ctx, x, y, t, side = 'u', a = 1, size = 34) {
  if (a <= 0.01) return;
  const hh = size * 1.75, w = size * 2.6, bx = side === 'u' ? x - w : x;
  ctx.save(); ctx.globalAlpha *= a;
  rrect(ctx, bx, y - hh / 2, w, hh, hh / 2); ctx.fillStyle = side === 'u' ? '#E9EAF0' : '#D8CFFC'; ctx.fill();
  for (let i = 0; i < 3; i++) { ctx.fillStyle = '#6B6890'; ctx.beginPath(); ctx.arc(bx + w * (0.3 + i * 0.2), y - 6 * Math.max(0, Math.sin(t * 9 - i * 0.9)), size * 0.13, 0, TAU); ctx.fill(); }
  ctx.restore();
}

// ---- night city: rows of buildings with windows. lit(i, x, y) -> 0..1
export function city(ctx, t, o = {}) {
  const base = o.base ?? H, seed = o.seed ?? 5, n = o.n ?? 14, hMin = o.hMin ?? 160, hMax = o.hMax ?? 420, x0 = o.x0 ?? -120, x1 = o.x1 ?? W + 120;
  const body = o.body ?? '#141838', edge = o.edge ?? '#262B5C', win = o.win ?? '#FFD88A';
  let x = x0, i = 0;
  while (x < x1) {
    const bw = 90 + rnd(i, seed) * 120, bh = hMin + rnd(i, seed + 1) * (hMax - hMin);
    ctx.fillStyle = body; ctx.fillRect(x, base - bh, bw - 6, bh + 10);
    ctx.fillStyle = edge; ctx.fillRect(x, base - bh, bw - 6, 5);
    const cols = Math.max(2, Math.floor((bw - 26) / 26)), rows = Math.floor((bh - 30) / 34);
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const wx = x + 12 + c * 26, wy = base - bh + 20 + r * 34, k = i * 1000 + r * 37 + c;
      const l = o.lit ? o.lit(k, wx, wy) : (rnd(k, seed + 7) < 0.35 ? 1 : 0);
      ctx.fillStyle = l > 0.02 ? rgba(o.winOf ? o.winOf(k) : win, 0.15 + 0.85 * l) : rgba('#2E3466', 0.6);
      ctx.fillRect(wx, wy, 14, 18);
    }
    x += bw; i++;
  }
}

// ---- a streak of light passing: head at p (0..1) along (x0,y0)->(x1,y1)
export function streak(ctx, x0, y0, x1, y1, p, color = '#FFFFFF', wd = 10, trail = 0.35) {
  if (p <= 0 || p >= 1.4) return;
  const hp = Math.min(p, 1), tp = Math.max(0, p - trail);
  const hx = lerp(x0, x1, hp), hy = lerp(y0, y1, hp), tx = lerp(x0, x1, tp), ty = lerp(y0, y1, tp);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
  const g = ctx.createLinearGradient(tx, ty, hx, hy); g.addColorStop(0, rgba(color, 0)); g.addColorStop(1, rgba(color, 0.95));
  ctx.strokeStyle = g; ctx.lineWidth = wd; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.lineWidth = wd * 3.2; ctx.globalAlpha = 0.25; ctx.stroke(); ctx.globalAlpha = 1;
  if (p < 1) { const r = ctx.createRadialGradient(hx, hy, 0, hx, hy, wd * 4); r.addColorStop(0, rgba('#FFFFFF', 1)); r.addColorStop(0.3, rgba(color, 0.8)); r.addColorStop(1, rgba(color, 0)); ctx.fillStyle = r; ctx.fillRect(hx - wd * 4, hy - wd * 4, wd * 8, wd * 8); }
  ctx.restore();
}
export const LIGHTS = ['#FFFFFF', '#7FE7DA', '#FF9EC4', '#FFE68A', '#C9B8FF'];       // no orange (橙子) and no deep blue (大肥鱼): nobody in particular

// ---- the gold word people gave her
export function goldWord(ctx, str, x, y, size, a = 1, glow = 1, ls = 0.1) {
  if (a <= 0.01) return;
  const n = [...str].length, step = size * (1 + ls);
  ctx.save(); ctx.globalAlpha *= a;
  [...str].forEach((ch, i) => {
    const cx = x + (i - (n - 1) / 2) * step;
    ctx.save(); ctx.shadowColor = rgba(COL.gold, 0.9 * glow); ctx.shadowBlur = size * 0.35 * glow;
    drawGlyph(ctx, ch, cx, y, size, { color: COL.gold, weight: 900 }); ctx.restore();
    drawGlyph(ctx, ch, cx, y, size, { color: '#FFF1C6', weight: 900, alpha: 0.35 });
  });
  ctx.restore();
}

// ---- 小柯's terminal window
export function terminal(ctx, x, y, w, h, lines, o = {}) {
  ctx.save();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14;
  rrect(ctx, x, y, w, h, 20); ctx.fillStyle = '#0B1512'; ctx.fill(); ctx.restore();
  rrect(ctx, x, y, w, h, 20); ctx.lineWidth = 3; ctx.strokeStyle = rgba(COL.koL, 0.75); ctx.stroke();
  ctx.fillStyle = '#12261F'; ctx.save(); rrect(ctx, x, y, w, 44, [20, 20, 0, 0]); ctx.fill(); ctx.restore();
  ['#FF6B6B', '#FFC857', '#2FA676'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + 28 + i * 24, y + 22, 7, 0, TAU); ctx.fill(); });
  text(ctx, o.title ?? 'terminal', x + w / 2, y + 23, { size: 20, weight: 500, color: rgba(COL.koL, 0.8), fam: MONO });
  lines.forEach((L, i) => { if (L) text(ctx, L, x + 26, y + 84 + i * 42, { size: 28, weight: 500, align: 'left', color: i === 0 ? COL.koL : '#D7F5E6', fam: MONO }); });
  if (o.caretT !== undefined && (o.caretT % 0.8) < 0.45) {
    const L = lines[o.caretLine ?? lines.length - 1] ?? '';
    ctx.fillStyle = COL.koL; ctx.fillRect(x + 26 + measure(ctx, L, 28, 500, MONO) + 4, y + 84 + (o.caretLine ?? lines.length - 1) * 42 - 16, 14, 32);
  }
  ctx.restore();
}

// ---- 小柯's terminal as Image 2 painted it (assets/props/ui_terminal.png; the drawn one above if it is missing).
// Geometry in prop units: bar = title bar height, x0/y0 = where the first line starts. Lines starting with $ are
// commands (mint), ✓ lines are done (bright green), the rest output. Returns the window rect.
export const TERMG = { bar: 0.1, x0: 0.06, y0: 0.22 };
export function termWin(ctx, cx, cy, w, lines, o = {}) {
  const im = IMG.ui_terminal, h = im ? w * im.height / im.width : w * 0.62, x = cx - w / 2, y = cy - h / 2;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  if (im) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14; ctx.drawImage(im, x, y, w, h); ctx.restore(); }
  else terminal(ctx, x, y, w, h, [], { title: '' });
  const size = o.size ?? w * 0.04, lx = x + w * TERMG.x0, ly = y + h * TERMG.y0, lh = size * 1.55;
  if (o.title) text(ctx, o.title, x + w / 2, y + h * TERMG.bar * 0.55, { size: size * 0.8, weight: 500, color: rgba(COL.koL, 0.85), fam: MONO });
  lines.forEach((L, i) => { if (L) text(ctx, L, lx, ly + i * lh, { size, weight: 500, align: 'left', color: L[0] === '$' ? COL.koL : L[0] === '✓' ? '#9FF0C8' : '#D7F5E6', fam: MONO }); });
  if (o.caretT !== undefined && (o.caretT % 0.8) < 0.45) {
    const i = o.caretLine ?? lines.length - 1, L = lines[i] ?? '';
    ctx.fillStyle = COL.koL; ctx.fillRect(lx + measure(ctx, L, size, 500, MONO) + 4, ly + i * lh - size * 0.55, size * 0.5, size * 1.1);
  }
  ctx.restore();
  return { x, y, w, h };
}

// ---- a phone (screen content drawn by fn in screen coordinates)
export function phone(ctx, x, y, w, h, fn, o = {}) {
  ctx.save();
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  rrect(ctx, x, y, w, h, w * 0.14); ctx.fillStyle = '#16161C'; ctx.fill(); ctx.restore();
  const m = w * 0.045;
  ctx.save(); rrect(ctx, x + m, y + m, w - 2 * m, h - 2 * m, w * 0.11); ctx.clip();
  const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, o.top ?? '#2A2B5E'); g.addColorStop(1, o.bot ?? '#14152F');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  if (fn) fn({ x: x + m, y: y + m, w: w - 2 * m, h: h - 2 * m });
  ctx.restore();
  ctx.fillStyle = '#16161C'; rrect(ctx, x + w / 2 - w * 0.13, y + m + 8, w * 0.26, 22, 11); ctx.fill();
  ctx.restore();
}

// ---- a sticky note
export function sticky(ctx, x, y, str, rot = 0, p = 1, col = '#FFE68A', size = 36) {
  if (p <= 0) return;
  const s = lerp(1.6, 1, E.out(clamp(p))), w = Math.max(size * 3.4, measure(ctx, str, size, 700, SANS) + size * 1.2), h = size * 2.6;
  ctx.save(); ctx.globalAlpha *= clamp(p * 4); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-w * 0.18, -h / 2 - 10, w * 0.36, 20);
  text(ctx, str, 0, 2, { size, weight: 700, color: '#3A2F20', fam: SANS });
  ctx.restore();
}

// ---- a child's crayon sun: wobbly, rays of different lengths (kept crooked when it spins)
export function crayonSun(ctx, x, y, r, rot = 0, seed = 4, a = 1, line = '#F2A93B', fill = '#FFD45E') {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 40; i++) { const an = i / 40 * TAU, rr = r * (1 + 0.08 * Math.sin(an * 3 + seed) + 0.05 * Math.sin(an * 7)); i ? ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr) : ctx.moveTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = r * 0.09; ctx.stroke();
  for (let i = 0; i < 9; i++) {
    const an = i / 9 * TAU + (rnd(i, seed) - 0.5) * 0.35, l0 = r * 1.25, l1 = r * (1.6 + rnd(i, seed + 1) * 0.6), bend = (rnd(i, seed + 2) - 0.5) * 0.3;
    ctx.beginPath(); ctx.moveTo(Math.cos(an) * l0, Math.sin(an) * l0); ctx.lineTo(Math.cos(an + bend) * l1, Math.sin(an + bend) * l1);
    ctx.strokeStyle = line; ctx.lineWidth = r * 0.1; ctx.stroke();
  }
  ctx.fillStyle = '#7A4A1A';                     // a smile, as children draw it
  ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.18, r * 0.08, 0, TAU); ctx.arc(r * 0.3, -r * 0.2, r * 0.08, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(0, r * 0.08, r * 0.38, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = r * 0.07; ctx.strokeStyle = '#7A4A1A'; ctx.stroke();
  ctx.restore();
}

// ---- a digital counter
export function counter(ctx, str, x, y, size, color = '#FFFFFF', align = 'center') {
  text(ctx, str, x, y, { size, weight: 800, color, fam: SANS, align, stroke: 'rgba(10,12,40,0.55)', sw: size * 0.12 });
}
export const fmt = n => Math.round(n).toLocaleString('en-US');

// ---- line-up of sprites for checking (?sheet=)
export function sheetChar(ctx, id, x, feetY, size) {
  char(ctx, id, x, feetY, size, { shadow: false });
  text(ctx, id, x, feetY + 4, { size: 18, color: '#555', fam: SANS });
}

// ---- painted backgrounds and props (Image 2; tools/key_props.py -> assets/bg, assets/props, assets/images.json)
const IMG = {}, OCC = {};
export async function loadImages() {
  const L = await (await fetch('assets/images.json')).json();
  const one = (key, src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = () => rej(new Error('image ' + src)); im.src = src; });
  const jobs = [
    ...L.bg.map(k => () => one(k, `assets/bg/${k}.jpg`)),
    ...L.props.map(k => () => one(k, `assets/props/${k}.webp`))
  ];
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(f => f()));
  Object.assign(OCC, await (await fetch('assets/occ/occ.json')).json());            // things in the paintings that stand in front of a screen
  const ojobs = Object.keys(OCC).map(k => () => one('occ_' + k, `assets/occ/${k}.webp`));
  for (let i = 0; i < ojobs.length; i += 6) await Promise.all(ojobs.slice(i, i + 6).map(f => f()));
}
export const img = id => IMG[id];
// a background, covering the frame; z zooms about (fx, fy) in image units 0..1, x/y pan in screen pixels
export function backdrop(ctx, id, o = {}) {
  const im = IMG[id]; if (!im) { if (o.alpha === undefined) { ctx.fillStyle = '#1A1D4A'; ctx.fillRect(-300, -300, W + 600, H + 600); } return; }      // a layer over another: nothing
  const z = o.z ?? 1.06, s = Math.max(W / im.width, H / im.height) * z, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  const dw = im.width * s, dh = im.height * s;
  const x = W / 2 - fx * dw + (o.x ?? 0), y = H / 2 - fy * dh + (o.y ?? 0);          // (fx, fy) of the image at the centre, then clamped to cover
  ctx.save();
  if (o.blur || o.filter) ctx.filter = (o.blur ? `blur(${o.blur}px) ` : '') + (o.filter ?? '');
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.drawImage(im, Math.min(0, Math.max(W - dw, x)), Math.min(0, Math.max(H - dh, y)), dw, dh);
  ctx.restore();
  if (o.dark) { ctx.fillStyle = `rgba(8,10,30,${o.dark})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
}
// where a point of the background image (in its own pixels) lands on screen, for the same o as backdrop()
export function bdMap(id, o = {}) {
  const im = IMG[id]; if (!im) return { pt: (ix, iy) => [ix, iy], s: 1 };
  const z = o.z ?? 1.06, s = Math.max(W / im.width, H / im.height) * z, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  const dw = im.width * s, dh = im.height * s;
  const x = Math.min(0, Math.max(W - dw, W / 2 - fx * dw + (o.x ?? 0))), y = Math.min(0, Math.max(H - dh, H / 2 - fy * dh + (o.y ?? 0)));
  return { pt: (ix, iy) => [x + ix * s, y + iy * s], s };
}
// draw fn in a flat sw x sh frame laid onto a quad of the background (a = top-left, b = top-right, c = bottom-left,
// in image pixels): a screen in the picture. Clipped to the frame.
export function onQuad(ctx, id, o, a, b, c, sw, sh, fn) {
  const M = bdMap(id, o), A = M.pt(...a), B = M.pt(...b), C = M.pt(...c);
  ctx.save(); ctx.transform((B[0] - A[0]) / sw, (B[1] - A[1]) / sw, (C[0] - A[0]) / sh, (C[1] - A[1]) / sh, A[0], A[1]);
  ctx.beginPath(); ctx.rect(0, 0, sw, sh); ctx.clip(); fn(); ctx.restore();
}
// a prop placed by its centre, width w (height from the image's aspect)
export function prop(ctx, id, cx, cy, w, o = {}) {
  const im = IMG[id]; if (!im) return null;
  const h = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.s) ctx.scale(o.s, o.s);
  if (o.filter) ctx.filter = o.filter;
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; }
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// ---- the two chat interfaces, as they really look (dark mode). Text is always set here, never painted by Image 2.
// 2022 (launch): full-width rows; the person's row has a small square avatar, hers a teal square with her knot.
export function row2022(ctx, x, y, w, str, who, p = 1, size = 30) {
  if (p <= 0) return;
  ctx.save(); ctx.globalAlpha *= clamp(p * 2.5);
  const h = size * 2.4;
  ctx.fillStyle = who === 'u' ? 'rgba(52,53,65,0.92)' : 'rgba(68,70,84,0.92)'; ctx.fillRect(x, y, w, h);
  const ax = x + size * 0.8, ay = y + h / 2;
  if (who === 'u') { ctx.fillStyle = '#9B7EDE'; rrect(ctx, ax - size * 0.5, ay - size * 0.5, size, size, 4); ctx.fill(); text(ctx, 'U', ax, ay + 1, { size: size * 0.6, weight: 800, color: '#FFFFFF', fam: SANS }); }
  else { ctx.fillStyle = '#10A37F'; rrect(ctx, ax - size * 0.5, ay - size * 0.5, size, size, 4); ctx.fill(); knot(ctx, ax, ay, size * 0.42, '#FFFFFF', 1.8); }
  const shown = [...str].slice(0, Math.max(1, Math.ceil([...str].length * clamp(p)))).join('');
  text(ctx, shown, ax + size * 0.9, ay + 1, { size, weight: 500, align: 'left', color: '#ECECF1', fam: SANS });
  ctx.restore();
  return h;
}
// today: the person's message in a grey bubble on the right; her reply as plain text on the left, with the row of
// small action icons under it (copy, thumbs up, thumbs down, regenerate). thumb: 0..1 lights the thumbs up.
export function msgUser(ctx, xr, y, str, p = 1, size = 30) {
  if (p <= 0) return;
  const tw = measure(ctx, str, size, 500, SANS), w = tw + size * 1.4, h = size * 2.1, s = E.back(clamp(p));
  ctx.save(); ctx.globalAlpha *= clamp(p * 3); ctx.translate(xr, y); ctx.scale(s, s); ctx.translate(-xr, -y);
  rrect(ctx, xr - w, y - h / 2, w, h, h / 2); ctx.fillStyle = '#303030'; ctx.fill();
  text(ctx, str, xr - w + size * 0.7, y + 1, { size, weight: 500, align: 'left', color: '#ECECEC', fam: SANS });
  ctx.restore();
}
export function msgHer(ctx, x, y, str, p = 1, size = 30, o = {}) {
  if (p <= 0) return;
  const chars = [...str], shown = chars.slice(0, Math.max(1, Math.ceil(chars.length * clamp(p)))).join('');      // streamed, as it really appears
  text(ctx, shown, x, y, { size, weight: 500, align: 'left', color: '#ECECEC', fam: SANS });
  if (o.icons && p >= 1) {
    const iy = y + size * 1.25, a = clamp((o.iconsP ?? 1) * 3);
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = '#B4B4B4'; ctx.lineWidth = 2.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const ic = [ (cx) => { rrect(ctx, cx - 7, iy - 9, 12, 14, 2); ctx.stroke(); rrect(ctx, cx - 3, iy - 5, 12, 14, 2); ctx.stroke(); },
      (cx) => { ctx.beginPath(); ctx.moveTo(cx - 8, iy + 8); ctx.lineTo(cx - 8, iy - 1); ctx.lineTo(cx - 3, iy - 1); ctx.lineTo(cx, iy - 9); ctx.lineTo(cx + 3, iy - 8); ctx.lineTo(cx + 2, iy - 1); ctx.lineTo(cx + 8, iy - 1); ctx.lineTo(cx + 7, iy + 8); ctx.closePath(); if ((o.thumb ?? 0) > 0) { ctx.save(); ctx.fillStyle = mixa('#B4B4B4', '#FFFFFF', o.thumb, 0.4 + 0.6 * o.thumb); ctx.fill(); ctx.restore(); } ctx.stroke(); },
      (cx) => { ctx.save(); ctx.translate(cx, iy); ctx.scale(1, -1); ctx.beginPath(); ctx.moveTo(-8, 8); ctx.lineTo(-8, -1); ctx.lineTo(-3, -1); ctx.lineTo(0, -9); ctx.lineTo(3, -8); ctx.lineTo(2, -1); ctx.lineTo(8, -1); ctx.lineTo(7, 8); ctx.closePath(); ctx.stroke(); ctx.restore(); },
      (cx) => { ctx.beginPath(); ctx.arc(cx, iy, 8, -0.3, Math.PI * 1.6); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx + 9, iy - 9); ctx.lineTo(cx + 8, iy - 2); ctx.lineTo(cx + 2, iy - 4); ctx.stroke(); } ];
    ic.forEach((f, i) => f(x + 10 + i * 36));
    ctx.restore();
  }
}
export function disclaimer(ctx, cx, y, a = 1, glow = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  if (glow > 0) { ctx.shadowColor = rgba(COL.gold, glow); ctx.shadowBlur = 24 * glow; }
  text(ctx, 'ChatGPT 也可能会犯错。请核查重要信息。', cx, y, { size: 20, weight: 500, color: glow > 0 ? mix('#9B9B9B', '#FFE08A', glow) : '#9B9B9B', fam: SANS });
  ctx.restore();
}
export function regenBtn(ctx, x, y, a = 1, spin = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  rrect(ctx, x, y - 22, 170, 44, 22); ctx.strokeStyle = '#5A5A5A'; ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#ECECEC'; ctx.lineWidth = 2.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x + 30, y, 9, spin, spin + Math.PI * 1.6); ctx.stroke();
  text(ctx, '重新生成', x + 50, y + 1, { size: 22, weight: 500, align: 'left', color: '#ECECEC', fam: SANS });
  ctx.restore();
}

// ---- the chat window, painted by Image 2 from the real interface (assets/props/ui_chat_*.png). Geometry in prop units 0..1:
// dlg = the conversation area (where she lives), bar = the input box. Text is set on top by the engine.
export const UIG = {
  ui_chat_2022: { dlg: [0.009, 0.093, 0.990, 0.802], bar: [0.042, 0.811, 0.957, 0.928], icons: [[0.185, 0.186], [0.498, 0.186], [0.812, 0.186]],
    cards: { x: [[0.050, 0.323], [0.362, 0.637], [0.676, 0.950]], y: [[0.277, 0.411], [0.444, 0.579], [0.612, 0.746]] } },
  ui_chat_modern: { dlg: [0.004, 0.077, 0.994, 0.829], bar: [0.073, 0.831, 0.924, 0.948] },
};
// the launch page's own words (Nov 2022), on its cards and under its icons
export const CARDS2022 = [['"Explain quantum computing', 'in simple terms"'], ['"Got any creative ideas for a', '10 year old\'s birthday?"'], ['"How do I make an HTTP', 'request in Javascript?"'],
  ['Remembers what user said', 'earlier in the conversation'], ['Allows user to provide', 'follow-up corrections'], ['Trained to decline', 'inappropriate requests'],
  ['May occasionally generate', 'incorrect information'], ['May occasionally produce harmful', 'instructions or biased content'], ['Limited knowledge of world', 'and events after 2021']];
export function chatWindow(ctx, kind, cx, cy, w, o = {}, inner) {
  const id = kind === '2022' ? 'ui_chat_2022' : 'ui_chat_modern', im = IMG[id], G = UIG[id];
  if (!im) return null;
  const h = w * im.height / im.width, x = cx - w / 2, y = cy - h / 2;
  const R = { x: x + G.dlg[0] * w, y: y + G.dlg[1] * h, w: (G.dlg[2] - G.dlg[0]) * w, h: (G.dlg[3] - G.dlg[1]) * h };
  const B = { x: x + G.bar[0] * w, y: y + G.bar[1] * h, w: (G.bar[2] - G.bar[0]) * w, h: (G.bar[3] - G.bar[1]) * h };
  R.floor = B.y - h * 0.012;
  const dim = o.dim ?? 0;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
  if (dim) ctx.filter = `grayscale(${dim}) brightness(${1 - 0.35 * dim})`;
  ctx.drawImage(im, x, y, w, h); ctx.restore();
  if (o.glow) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.shadowColor = rgba(COL.lav, 0.9); ctx.shadowBlur = 50 * o.glow; ctx.strokeStyle = rgba(COL.lavL, 0.8 * o.glow); ctx.lineWidth = 4; rrect(ctx, x + w * 0.005, y + h * 0.005, w * 0.99, h * 0.99, w * 0.035); ctx.stroke(); ctx.restore(); }
  if (kind === '2022' && (o.labels ?? 1) > 0) {
    ctx.save(); ctx.globalAlpha *= (o.labels ?? 1) * (1 - 0.6 * dim);
    ['Examples', 'Capabilities', 'Limitations'].forEach((s, i) => text(ctx, s, x + G.icons[i][0] * w, y + (G.icons[i][1] + 0.078) * h, { size: w * 0.016, weight: 600, color: '#ECECF1', fam: SANS }));
    CARDS2022.forEach((L, k) => { const c = Math.floor(k / 3), r = k % 3, cxk = x + (G.cards.x[c][0] + G.cards.x[c][1]) / 2 * w, cyk = y + (G.cards.y[r][0] + G.cards.y[r][1]) / 2 * h;
      L.forEach((s, j) => text(ctx, s, cxk, cyk + (j - 0.5) * w * 0.017, { size: w * 0.0118, weight: 500, color: '#3A3B44', fam: SANS })); });
    text(ctx, 'Free Research Preview.', x + w * 0.5, y + h * 0.965, { size: w * 0.011, weight: 500, color: '#B9B9C6', fam: SANS });
    ctx.restore();
  }
  if (inner) { ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, B.y + B.h - R.y); ctx.clip(); inner(R, B); ctx.restore(); }
  // the input box
  if (kind !== '2022' && o.placeholder !== false) text(ctx, o.typed ?? '询问 ChatGPT', B.x + B.h * 0.95, B.y + B.h / 2, { size: B.h * 0.32, weight: 500, align: 'left', color: o.typed ? '#ECECEC' : '#9B9B9B', fam: SANS });
  if (kind === '2022' && o.typed) text(ctx, o.typed, B.x + B.h * 0.4, B.y + B.h / 2, { size: B.h * 0.34, weight: 500, align: 'left', color: '#ECECF1', fam: SANS });
  if (o.greeting) text(ctx, o.greeting, R.x + R.w / 2, R.y + R.h * 0.42, { size: w * 0.026, weight: 600, color: '#ECECEC', fam: SANS, alpha: o.greetingA ?? 1 });
  if (o.disclaimer !== undefined) disclaimer(ctx, x + w / 2, y + h * 0.965, o.disclaimer, o.disclaimerGlow ?? 0);
  if (o.crack) cracks(ctx, R.x, R.y, R.w, R.h + B.h, o.crack, o.crackAt ?? [[0.5, 0.45]], o.crackSeed ?? 7);
  ctx.restore();
  return { R, B, x, y, w, h };
}

// ---- v4 pieces -------------------------------------------------------------------------------------------------
// Her wing as its own layer (assets/props/propg_wing.png: her left wing, root joint at WROOT in its pixels, tip to the
// upper left). side -1 draws the wing on the screen's left, 1 the mirrored one; rot turns it about the root (negative =
// downstroke), s scales it (1 = 1390 px from root to tip).
export const WROOT = [1090, 915];
export function wing(ctx, x, y, s, rot, side = -1, o = {}) {
  const im = IMG.propg_wing; if (!im) return;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); if (side > 0) ctx.scale(-1, 1); ctx.rotate(rot); ctx.scale(s, s * (o.sy ?? 1));
  if (o.glow) { ctx.shadowColor = rgba(COL.lavL, 0.9); ctx.shadowBlur = o.glow; }
  ctx.drawImage(im, -WROOT[0], -WROOT[1]); ctx.restore();
}
// A prop with a screen: draws the prop centred at (cx, cy), width w, turned by o.rot, then fn(S) clipped to its screen
// (scr = [x0, y0, x1, y1] in prop units), S = {x, y, w, h} in the prop's own (unrotated) frame around its centre.
export function screenProp(ctx, id, cx, cy, w, scr, rad, fn, o = {}) {
  const im = IMG[id]; if (!im) return null;
  const h = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.filter) ctx.filter = o.filter;
  if (o.shadow !== false) { ctx.save(); ctx.shadowColor = o.glowCol ?? 'rgba(0,0,0,0.45)'; ctx.shadowBlur = o.glowCol ? 40 : 30; ctx.shadowOffsetY = o.glowCol ? 0 : 12; ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore(); }
  else ctx.drawImage(im, -w / 2, -h / 2, w, h);
  const S = { x: -w / 2 + scr[0] * w, y: -h / 2 + scr[1] * h, w: (scr[2] - scr[0]) * w, h: (scr[3] - scr[1]) * h };
  ctx.save(); ctx.beginPath(); ctx.roundRect(S.x, S.y, S.w, S.h, rad * w); ctx.clip(); fn(S); ctx.restore();
  ctx.restore();
  return { w, h };
}
export const SCR = { phone: [0.035, 0.013, 0.965, 0.988, 0.1], watch: [0.064, 0.29, 0.879, 0.636, 0.09], board: [0.065, 0.095, 0.933, 0.905, 0.01] };
// The two little builders of light from verse 2 (original characters: no brand's mascot). kind 'orange' | 'mint';
// (x, y) is the middle of the body, h its height on screen.
export function spirit(ctx, kind, x, y, h, o = {}) {
  const id = kind === 'orange' ? 'prop_spirit_orange' : 'prop_spirit_mint', im = IMG[id]; if (!im) return;
  const w = h * im.width / im.height, col = kind === 'orange' ? '#FF9A5A' : '#7FF0C0';
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, h * 0.9); g.addColorStop(0, rgba(col, 0.55)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - h, y - h, h * 2, h * 2); ctx.restore();
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1); if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
// A hanging name plate, hung from (x, y) (where its chains meet), width w, swinging by rot. The label is set here.
const PLATE = { orange: { id: 'prop_plate_orange', face: [0.04, 0.568, 0.96, 0.947], ink: '#7A3A1C' }, mint: { id: 'prop_plate_mint', face: [0.036, 0.419, 0.961, 0.945], ink: '#1F5E45' },
  gray: { id: 'prop_plate_gray', face: [0.04, 0.52, 0.96, 0.94], ink: '#26262C' } };
export function plate(ctx, kind, x, y, w, label, o = {}) {
  const P = PLATE[kind], im = IMG[P.id]; if (!im) return;
  const h = w * im.height / im.width, f = P.face, fh = (f[3] - f[1]) * h;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(x, y); ctx.rotate(o.rot ?? 0); ctx.scale(o.s ?? 1, o.s ?? 1);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.drawImage(im, -w / 2, 0, w, h); ctx.restore();
  const size = o.size ?? Math.min(fh * 0.56, (f[2] - f[0]) * w * 0.84 / Math.max(1, label.length * 0.62));
  text(ctx, label, -w / 2 + (f[0] + f[2]) / 2 * w, (f[1] + f[3]) / 2 * h + 2, { size, weight: 800, color: P.ink, fam: SANS });
  ctx.restore();
}
// Soft clouds drifting between the lens and the scene (parallax): speed px/s, alpha, seed
export function nearClouds(ctx, t, o = {}) {
  const n = o.n ?? 5, sp = o.speed ?? 260, a = o.alpha ?? 0.35, seed = o.seed ?? 1;
  ctx.save(); ctx.filter = `blur(${o.blur ?? 30}px)`;
  for (let i = 0; i < n; i++) {
    const w = 500 + rnd(i, seed + 1) * 700, span = W + w * 2, x = ((rnd(i, seed + 2) * span - t * sp * (0.7 + rnd(i, seed + 3) * 0.6)) % span + span) % span - w, y = (o.y0 ?? 0) + rnd(i, seed + 4) * (o.y1 ?? H);
    ctx.globalAlpha = a * (0.6 + 0.4 * rnd(i, seed + 5)); ctx.fillStyle = o.color ?? '#EEF0FF';
    ctx.beginPath(); ctx.ellipse(x, y, w / 2, w * 0.2, 0, 0, TAU); ctx.fill();
  }
  ctx.restore();
}

// ---- perspective: draw fn (in a flat sw x sh frame) onto a quad [TL, TR, BR, BL] given in the current coordinates.
// The frame is drawn once into an offscreen canvas, then laid onto the quad as a mesh of small triangles, each with
// its own affine map, so that straight lines stay straight under perspective (a single affine map cannot do it).
const WQ = new Map();
function quadH(Q) {                                 // unit square -> quad homography
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = Q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3, dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dy1 * dx2, g = (dx3 * dy2 - dy3 * dx2) / den, h = (dx1 * dy3 - dy1 * dx3) / den;
  const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}
function tri(ctx, src, s0, s1, s2, d0, d1, d2) {
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]); if (!den) return;
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, ex = p => [p[0] + (p[0] - cx) * 0.04 + Math.sign(p[0] - cx) * 0.4, p[1] + (p[1] - cy) * 0.04 + Math.sign(p[1] - cy) * 0.4];
  const [e0, e1, e2] = [ex(d0), ex(d1), ex(d2)];
  ctx.save(); ctx.beginPath(); ctx.moveTo(...e0); ctx.lineTo(...e1); ctx.lineTo(...e2); ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]); ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, src.sw, src.sh); ctx.restore();
}
export function warpQuad(ctx, Q, sw, sh, fn, o = {}) {
  const r = (o.res ?? 2) * SS, key = `${sw}x${sh}x${r}`;
  let c = WQ.get(key);
  if (!c) { c = new OffscreenCanvas(Math.ceil(sw * r), Math.ceil(sh * r)); c.sw = sw; c.sh = sh; WQ.set(key, c); }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height);
  x.setTransform(r, 0, 0, r, 0, 0); x.save(); fn(x, sw, sh); x.restore();
  const Hm = quadH(Q), n = o.mesh ?? 10;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    const s00 = [u0 * sw, v0 * sh], s10 = [u1 * sw, v0 * sh], s11 = [u1 * sw, v1 * sh], s01 = [u0 * sw, v1 * sh];
    const p00 = Hm(u0, v0), p10 = Hm(u1, v0), p11 = Hm(u1, v1), p01 = Hm(u0, v1);
    tri(ctx, c, s00, s10, s11, p00, p10, p11); tri(ctx, c, s00, s11, s01, p00, p11, p01);
  }
  ctx.restore();
}
// the screens painted into the backgrounds (image px, TL TR BR BL), found by colour from the paintings themselves
export const QUADS = {
  laptop: [[286, 426], [741, 413], [784, 689], [328, 717]],                 // bg05, bg05b, bg05c, bg06 (the bottom-left corner is behind the mug's handle)
  phone15: [[1167, 501], [1295, 540], [1104, 710], [957, 660]],             // bg15
  phone16: [[1160, 500], [1295, 541], [1103, 710], [956, 659]],             // bg16
  billboard: [[478, 218], [930, 287], [940, 523], [457, 469]],              // bg25
};
export function onScreen(ctx, id, o, quad, sw, sh, fn, w = {}) {
  const M = bdMap(id, o); warpQuad(ctx, quad.map(p => M.pt(...p)), sw, sh, fn, w);
  const oc = IMG['occ_' + id];                       // put back what stands in front of the screen (the mug's handle)
  if (oc) { const [x, y] = M.pt(...OCC[id]); ctx.save(); ctx.globalAlpha *= w.alpha ?? 1; if (w.filter) ctx.filter = w.filter; ctx.drawImage(oc, x, y, oc.width * M.s, oc.height * M.s); ctx.restore(); }
}

// The three builders in verse 2, redrawn by Image 2 from their official looks: Claude Code's Clawd, the Codex robot,
// the Cursor cube. (x, y) is the middle of the figure, h its height.
const BOTS = { claudecode: ['prop_bot_claudecode', '#FF9A5A'], codex: ['prop_bot_codex', '#6FB8FF'], cursor: ['prop_bot_cursor', '#E6E6F0'] };
export function bot(ctx, kind, x, y, h, o = {}) {
  const [id, col] = BOTS[kind], im = IMG[id]; if (!im) return;
  const w = h * im.width / im.height;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, h * 0.8); g.addColorStop(0, rgba(col, 0.4)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - h, y - h, h * 2, h * 2); ctx.restore();
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); ctx.scale((o.flip ? -1 : 1) * (o.sx ?? 1), o.sy ?? 1);
  ctx.drawImage(im, -w / 2, -h / 2, w, h); ctx.restore();
}
