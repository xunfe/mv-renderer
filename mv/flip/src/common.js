// Pieces shared by the scenes of 《我只是翻了个身》: painted backgrounds and props (Image 2), perspective warps,
// floating digits, bubbles, word balloons, her grey thinking box, big glowing words. Everything is a pure function of time.
import { W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, COL, rgba, drawGlyph, text, rrect, SANS, SERIF, font } from './lib.js';
import { char } from './chars.js';

// ---- line-up of sprites for checking (?sheet=)
export function sheetChar(ctx, id, x, feetY, size) {
  char(ctx, id, x, feetY, size, { shadow: false });
  text(ctx, id, x, feetY + 4, { size: 18, color: '#555', fam: SANS });
}

// ---- painted backgrounds and props (Image 2; tools/key_props.py -> assets/bg, assets/props, assets/images.json)
const IMG = {};
export async function loadImages() {
  const L = await (await fetch('assets/images.json')).json();
  const one = (key, src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = () => rej(new Error('image ' + src)); im.src = src; });
  const jobs = [
    ...L.bg.map(k => () => one(k, `assets/bg/${k}.jpg`)),
    ...L.props.map(k => () => one(k, `assets/props/${k}.webp`))
  ];
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(f => f()));
}
export const img = id => IMG[id];
// a background covering the frame; z zooms about (fx, fy) in image units 0..1, x/y pan in screen pixels
export function backdrop(ctx, id, o = {}) {
  const im = IMG[id]; if (!im) { if (o.alpha === undefined) { ctx.fillStyle = '#0D1A3A'; ctx.fillRect(-300, -300, W + 600, H + 600); } return; }
  const z = o.z ?? 1.06, s = Math.max(W / im.width, H / im.height) * z, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  const dw = im.width * s, dh = im.height * s;
  const x = W / 2 - fx * dw + (o.x ?? 0), y = H / 2 - fy * dh + (o.y ?? 0);
  ctx.save();
  if (o.blur || o.filter) ctx.filter = (o.blur ? `blur(${o.blur}px) ` : '') + (o.filter ?? '');
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.drawImage(im, o.free ? x : Math.min(0, Math.max(W - dw, x)), o.free ? y : Math.min(0, Math.max(H - dh, y)), dw, dh);
  ctx.restore();
  if (o.dark) { ctx.fillStyle = `rgba(6,10,30,${o.dark})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
  if (globalThis.__bdHook) globalThis.__bdHook(ctx, id, o);              // v2: life drawn just over the painting, behind everything else (src/v2/life.js)
}
// where a point of the background image (in its own pixels) lands on screen, for the same o as backdrop()
export function bdMap(id, o = {}) {
  const im = IMG[id]; if (!im) return { pt: (ix, iy) => [ix, iy], s: 1 };
  const z = o.z ?? 1.06, s = Math.max(W / im.width, H / im.height) * z, fx = o.fx ?? 0.5, fy = o.fy ?? 0.5;
  const dw = im.width * s, dh = im.height * s;
  let x = W / 2 - fx * dw + (o.x ?? 0), y = H / 2 - fy * dh + (o.y ?? 0);
  if (!o.free) { x = Math.min(0, Math.max(W - dw, x)); y = Math.min(0, Math.max(H - dh, y)); }
  return { pt: (ix, iy) => [x + ix * s, y + iy * s], s };
}
// a prop placed by its centre, width w (height from the image's aspect)
export function prop(ctx, id, cx, cy, w, o = {}) {
  const im = IMG[id]; if (!im) return null;
  if (globalThis.__trace && (o.alpha ?? 1) > 0.003) globalThis.__trace.add(id);
  const h = w * im.height / im.width;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; ctx.translate(cx, cy); if (o.rot) ctx.rotate(o.rot); if (o.sx || o.sy) ctx.scale(o.sx ?? 1, o.sy ?? 1);
  if (o.flip) ctx.scale(-1, 1);
  if (o.filter) ctx.filter = o.filter;
  if (o.shadow) { ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; }
  ctx.drawImage(im, -w / 2 - (o.ax ?? 0) * w, -h / 2 - (o.ay ?? 0) * h, w, h); ctx.restore();
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

// a prop placed so that its own pixel (ix, iy) (e.g. a fingertip) lands on (X, Y); rot, flip, sx, sy turn about that point
export function propBy(ctx, id, ix, iy, X, Y, w, o = {}) {
  const im = IMG[id]; if (!im) return null;
  return prop(ctx, id, X, Y, w, { ...o, ax: ix / im.width - 0.5, ay: iy / im.height - 0.5 });     // prop() draws at -w/2 - ax*w, so this puts (ix, iy) on the origin
}
// fingertips of the hand props (prop px; tools: the extreme point in the pointing direction)
export const TIP = { prop_hand_reach: [7, 22], prop_hand_drag: [19, 10], prop_hand_boop: [7, 60], prop_hand_tap: [12, 349], prop_hand_meet: [5, 286], prop_hand_point: [7, 201], prop_hand_select: [9, 488] };
export const tipProp = (ctx, id, X, Y, w, o = {}) => propBy(ctx, id, ...TIP[id], X, Y, w, o);
// ---- perspective: draw fn in a flat sw x sh frame onto a quad (TL TR BR BL, screen px), as a mesh of affine triangles
const WQ = new Map();
function quadH(Q) {
  const [p0, p1, p2, p3] = Q;
  const dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0], dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1];
  const sx = p0[0] - p1[0] + p2[0] - p3[0], sy = p0[1] - p1[1] + p2[1] - p3[1];
  const den = dx1 * dy2 - dx2 * dy1;
  const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  const a = p1[0] - p0[0] + g * p1[0], b = p3[0] - p0[0] + h * p3[0], c = p0[0];
  const d = p1[1] - p0[1] + g * p1[1], e = p3[1] - p0[1] + h * p3[1], f = p0[1];
  return (u, v) => { const w = g * u + h * v + 1; return [(a * u + b * v + c) / w, (d * u + e * v + f) / w]; };
}
function tri(ctx, src, s0, s1, s2, d0, d1, d2) {
  const den = (s1[0] - s0[0]) * (s2[1] - s0[1]) - (s2[0] - s0[0]) * (s1[1] - s0[1]);
  const a = ((d1[0] - d0[0]) * (s2[1] - s0[1]) - (d2[0] - d0[0]) * (s1[1] - s0[1])) / den, c = ((d2[0] - d0[0]) * (s1[0] - s0[0]) - (d1[0] - d0[0]) * (s2[0] - s0[0])) / den;
  const b = ((d1[1] - d0[1]) * (s2[1] - s0[1]) - (d2[1] - d0[1]) * (s1[1] - s0[1])) / den, d = ((d2[1] - d0[1]) * (s1[0] - s0[0]) - (d1[1] - d0[1]) * (s2[0] - s0[0])) / den;
  const cx = (d0[0] + d1[0] + d2[0]) / 3, cy = (d0[1] + d1[1] + d2[1]) / 3, ex = p => [p[0] + (p[0] - cx) * 0.04 + Math.sign(p[0] - cx) * 0.4, p[1] + (p[1] - cy) * 0.04 + Math.sign(p[1] - cy) * 0.4];
  const [e0, e1, e2] = [ex(d0), ex(d1), ex(d2)];
  ctx.save(); ctx.beginPath(); ctx.moveTo(...e0); ctx.lineTo(...e1); ctx.lineTo(...e2); ctx.closePath(); ctx.clip();
  ctx.transform(a, b, c, d, d0[0] - a * s0[0] - c * s0[1], d0[1] - b * s0[0] - d * s0[1]); ctx.drawImage(src, 0, 0, src.width, src.height, 0, 0, src.sw, src.sh); ctx.restore();
}
// a screen painted into a background: the content is mapped onto the screen's quad (image px, TL TR BR BL; the corners
// where its straight sides meet, tools/find_screen.py) and clipped with the screen's own shape (assets/props/mask_<bg id>.png),
// so rounded corners stay rounded and a thumb or a bezel painted over the screen stays in front
let MQ = null;
export function maskedScreen(ctx, bgId, bo, quad, sw, sh, fn, o = {}) {
  const M = bdMap(bgId, bo), Q = quad.map(p => M.pt(...p)), mk = IMG['mask_' + bgId];
  if (!mk) return warpQuad(ctx, Q, sw, sh, fn, o);
  const cv = ctx.canvas;
  if (!MQ || MQ.width !== cv.width || MQ.height !== cv.height) MQ = new OffscreenCanvas(cv.width, cv.height);
  const l = MQ.getContext('2d');
  l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.filter = 'none'; l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, cv.width, cv.height);
  l.setTransform(ctx.getTransform()); warpQuad(l, Q, sw, sh, fn, o);
  const [x0, y0] = M.pt(0, 0); l.globalCompositeOperation = 'destination-in'; l.drawImage(mk, x0, y0, mk.width * M.s, mk.height * M.s);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(MQ, 0, 0); ctx.restore();
}
export function warpQuad(ctx, Q, sw, sh, fn, o = {}) {
  const r = (o.res ?? 1) * SS, key = `${sw}x${sh}x${r}x${o.slot ?? 0}`;
  let c = WQ.get(key);
  if (!c) { c = new OffscreenCanvas(Math.ceil(sw * r), Math.ceil(sh * r)); c.sw = sw; c.sh = sh; WQ.set(key, c); }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height);
  x.setTransform(r, 0, 0, r, 0, 0); x.save(); fn(x, sw, sh); x.restore();
  const Hm = quadH(Q), n = o.mesh ?? 12;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n, v0 = j / n, v1 = (j + 1) / n;
    const s00 = [u0 * sw, v0 * sh], s10 = [u1 * sw, v0 * sh], s11 = [u1 * sw, v1 * sh], s01 = [u0 * sw, v1 * sh];
    const p00 = Hm(u0, v0), p10 = Hm(u1, v0), p11 = Hm(u1, v1), p01 = Hm(u0, v1);
    tri(ctx, c, s00, s10, s11, p00, p10, p11); tri(ctx, c, s00, s11, s01, p00, p11, p01);
  }
  ctx.restore();
}

// draw fn in a flat sw x sh frame onto any surface: P(u, v) -> [x, y] on screen, u and v in 0..1; rows past vmax are
// left out (a cloth still rolling out)
export function warpMesh(ctx, P, sw, sh, fn, o = {}) {
  const r = (o.res ?? 1) * SS, key = `m${sw}x${sh}x${r}x${o.slot ?? 0}`;
  let c = WQ.get(key);
  if (!c) { c = new OffscreenCanvas(Math.ceil(sw * r), Math.ceil(sh * r)); c.sw = sw; c.sh = sh; WQ.set(key, c); }
  const x = c.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.filter = 'none'; x.globalCompositeOperation = 'source-over'; x.clearRect(0, 0, c.width, c.height);
  x.setTransform(r, 0, 0, r, 0, 0); x.save(); fn(x, sw, sh); x.restore();
  const nu = o.nu ?? 16, nv = o.nv ?? 16, vmax = o.vmax ?? 1;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const u0 = i / nu, u1 = (i + 1) / nu, v0 = j / nv * vmax, v1 = (j + 1) / nv * vmax;
    const s00 = [u0 * sw, v0 * sh], s10 = [u1 * sw, v0 * sh], s11 = [u1 * sw, v1 * sh], s01 = [u0 * sw, v1 * sh];
    const p00 = P(u0, v0), p10 = P(u1, v0), p11 = P(u1, v1), p01 = P(u0, v1);
    tri(ctx, c, s00, s10, s11, p00, p10, p11); tri(ctx, c, s00, s11, s01, p00, p11, p01);
  }
  ctx.restore();
}
export const quadMap = Q => quadH(Q);       // the homography of a quad (TL TR BR BL) as a function (u, v) -> [x, y]

// ---- the sea of numbers: digits and tiny candles drifting upward (tf: time; depth sorts size and blur)
export function digitSea(ctx, tf, o = {}) {
  const n = o.n ?? 90, seed = o.seed ?? 5, sp = o.speed ?? 1, a0 = o.alpha ?? 0.8, vy = o.vy ?? 70, zoom = o.zoom ?? 1;
  for (let i = 0; i < n; i++) {
    const d = 0.25 + rnd(i, seed) * 0.75, v = vy * (0.4 + d) * sp;
    const span = H + 300;
    const y = (((rnd(i, seed + 1) * span - tf * v) % span) + span) % span - 150;
    const x = rnd(i, seed + 2) * (W + 200) - 100 + Math.sin(tf * 0.7 + i) * 12 * d;
    const X = W / 2 + (x - W / 2) * zoom, Y = H / 2 + (y - H / 2) * zoom, s = (14 + 30 * d) * zoom;
    ctx.globalAlpha = a0 * (0.25 + 0.75 * d) * (0.6 + 0.4 * Math.sin(tf * 2 + i * 1.7) ** 2);
    if (rnd(i, seed + 3) < 0.7) drawGlyph(ctx, '0123456789'[Math.floor(rnd(i, seed + 4) * 10)], X, Y, s, { color: rnd(i, seed + 5) < 0.5 ? '#9FF4FF' : '#D7FFF0', weight: 700, fam: SANS });
    else { const up = rnd(i, seed + 6) < 0.5; ctx.fillStyle = up ? '#FF6B7A' : '#52E3A0'; ctx.fillRect(X - s * 0.12, Y - s * 0.5, s * 0.24, s); ctx.fillRect(X - 1, Y - s * 0.8, 2, s * 1.6); }
  }
  ctx.globalAlpha = 1;
}
// air bubbles rising (tf: time)
export function bubbles(ctx, tf, o = {}) {
  const n = o.n ?? 40, seed = o.seed ?? 21, x0 = o.x0 ?? 0, x1 = o.x1 ?? W, a0 = o.alpha ?? 0.6;
  ctx.save(); ctx.strokeStyle = 'rgba(220,250,255,0.9)'; ctx.lineWidth = 2;
  for (let i = 0; i < n; i++) {
    const r = 3 + rnd(i, seed) * (o.maxR ?? 12), v = 80 + rnd(i, seed + 1) * 160;
    const span = H + 200, y = (((rnd(i, seed + 2) * span - tf * v) % span) + span) % span - 100;
    const x = x0 + rnd(i, seed + 3) * (x1 - x0) + Math.sin(tf * 2 + i) * 8;
    ctx.globalAlpha = a0 * (0.5 + 0.5 * rnd(i, seed + 4));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.25, 0, TAU); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fill();
  }
  ctx.restore();
}
// a splash of droplets from (x, y) starting at t0
export function splash(ctx, t, t0, x, y, o = {}) {
  if (globalThis.__splash && globalThis.__splash(ctx, t, t0, x, y, o) !== false) return;      // v2: drawn water (src/v2/fx2.js)
  const dt = t - t0; if (dt < 0 || dt > (o.life ?? 1.2)) return;
  const n = o.n ?? 40, seed = o.seed ?? 31, sc = o.scale ?? 1;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const an = -Math.PI / 2 + (rnd(i, seed) - 0.5) * (o.spread ?? 2.2), v = (500 + rnd(i, seed + 1) * 900) * sc;
    const px = x + Math.cos(an) * v * dt, py = y + Math.sin(an) * v * dt + 1400 * sc * dt * dt;
    const r = (5 + rnd(i, seed + 2) * 12) * sc * (1 - dt / (o.life ?? 1.2) * 0.6);
    ctx.globalAlpha = (o.alpha ?? 0.95) * (1 - sat(dt, (o.life ?? 1.2) * 0.6, o.life ?? 1.2));
    ctx.fillStyle = i % 3 ? '#FFFFFF' : (o.tint ?? '#BFF3FF');
    ctx.beginPath(); ctx.arc(px, py, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
// ripples on water at (x, y)
export function ripples(ctx, t, x, y, w, o = {}) {
  ctx.save(); ctx.strokeStyle = o.color ?? 'rgba(220,245,255,0.7)'; ctx.lineWidth = o.lw ?? 3;
  for (let k = 0; k < 3; k++) {
    const p = ((t * (o.speed ?? 0.7) + k / 3) % 1);
    ctx.globalAlpha = (o.alpha ?? 1) * (1 - p);
    ctx.beginPath(); ctx.ellipse(x, y, w * (0.4 + p * 0.9), w * (0.4 + p * 0.9) * (o.flat ?? 0.18), 0, 0, TAU); ctx.stroke();
  }
  ctx.restore();
}

// ---- words
// a big glowing word or line, centred at (x, y)
export function glowWord(ctx, str, x, y, size, o = {}) {
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  ctx.font = font(size, o.weight ?? 800, o.fam ?? SANS); ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = `${(o.ls ?? 0.06) * size}px`;
  ctx.shadowColor = o.glow ?? 'rgba(80,190,255,0.9)'; ctx.shadowBlur = size * (o.glowR ?? 0.45);
  ctx.lineJoin = 'round'; ctx.lineWidth = size * (o.sw ?? 0.12); ctx.strokeStyle = o.stroke ?? '#0B1E4D';
  ctx.strokeText(str, x, y); ctx.shadowBlur = 0; ctx.fillStyle = o.color ?? '#FFFFFF'; ctx.fillText(str, x, y);
  ctx.restore();
}
// a small speech balloon with a short line, popping in at t0
export function balloon(ctx, t, t0, x, y, str, o = {}) {
  if (t < t0) return;
  if (globalThis.__trace) globalThis.__trace.add('balloon');
  const p = E.back(sat(t, t0, t0 + 0.28)), out = 1 - sat(t, o.out ?? 1e9, (o.out ?? 1e9) + 0.25);
  if (out <= 0) return;
  const size = o.size ?? 34;
  ctx.save(); ctx.font = font(size, 700, SANS); ctx.letterSpacing = '2px';
  const w = ctx.measureText(str).width + size * 1.1, h = size * 1.7;
  ctx.translate(x, y); ctx.scale(p * out, p * out); ctx.rotate(o.rot ?? 0);
  // body and tail drawn as two paths: both outlines first (double width), then both fills, so each fill covers the other's
  // outline where they join and the tail reads as part of the bubble. (As one path, the body and the tail wind opposite ways
  // and cancel where they overlap: the tail came out as a dark wedge, 本人 10-19.) o.tail: where the tip points (px)
  const tb = o.tailBase ?? -w * 0.18, tip = o.tail ?? (o.tailBase ?? -w * 0.18) - 26;
  const body = () => { ctx.beginPath(); ctx.roundRect(-w / 2, -h, w, h, h / 2); };
  const tail = () => { ctx.beginPath(); ctx.moveTo(tb - 16, -12); ctx.lineTo(tip, 26); ctx.lineTo(tb + 14, -12); ctx.closePath(); };
  ctx.lineJoin = 'round'; ctx.strokeStyle = o.line ?? '#1B2140'; ctx.lineWidth = 9; body(); ctx.stroke(); tail(); ctx.stroke();
  ctx.fillStyle = o.fill ?? '#FFFFFF'; body(); ctx.fill(); tail(); ctx.fill();
  ctx.fillStyle = o.color ?? '#1B2140'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, -h / 2 + 1);
  ctx.restore();
}
// her grey thinking box (DeepSeek shows its reasoning in small grey type under 已深度思考)
export function thinkBox(ctx, t, t0, x, y, w, lines, o = {}) {
  if (t < t0) return;
  const p = E.out(sat(t, t0, t0 + 0.3)), out = 1 - sat(t, o.out ?? 1e9, (o.out ?? 1e9) + 0.3);
  if (out <= 0) return;
  const size = o.size ?? 30, lh = size * 1.5, h = 70 + lines.length * lh + 26;
  ctx.save(); ctx.globalAlpha *= p * out; ctx.translate(x, y + (1 - p) * 20);
  ctx.shadowColor = 'rgba(10,20,50,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgba(248,249,252,0.97)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.font = font(24, 600, SANS); ctx.fillStyle = '#5D6475'; ctx.textBaseline = 'middle';
  ctx.fillText(o.head ?? '已深度思考', 30, 38);
  ctx.strokeStyle = '#D7DAE2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, 66); ctx.lineTo(30, h - 22); ctx.stroke();
  ctx.font = font(size, 500, SANS); ctx.fillStyle = '#8A8F9C';
  const cps = o.cps ?? 14;                                   // characters per second
  let k = Math.floor((t - t0 - 0.2) * cps);
  lines.forEach((L, i) => {
    const n = clamp(k, 0, L.length); k -= L.length;
    ctx.fillText(L.slice(0, n), 50, 66 + lh * (i + 0.5) + 6);
  });
  ctx.restore();
}
export const fmt = n => Math.round(n).toLocaleString('en-US');
