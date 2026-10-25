// Look and lens: paper texture, light, out-of-focus foreground, camera, paper-cut shadows.
import { W, H, SS, TAU, rnd, noise, COL, rgba, grain, glyph } from './lib.js';

let TEX = null;
function paperTex() {
  if (TEX) return TEX;
  const c = new OffscreenCanvas(W * SS, H * SS), x = c.getContext('2d');
  x.scale(SS, SS);
  x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 36; i++) {                       // slow mottling
    const px = rnd(i, 921) * W, py = rnd(i, 922) * H, r = 200 + rnd(i, 923) * 420;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, `rgba(150,110,60,${0.02 + rnd(i, 924) * 0.035})`); g.addColorStop(1, 'rgba(150,110,60,0)');
    x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
  }
  x.lineCap = 'round';
  for (let i = 0; i < 3000; i++) {                     // fibres
    const px = rnd(i, 901) * W, py = rnd(i, 902) * H, an = rnd(i, 903) * TAU, len = 12 + rnd(i, 904) * 64;
    x.strokeStyle = `rgba(120,88,48,${0.025 + rnd(i, 905) * 0.05})`; x.lineWidth = 0.7 + rnd(i, 906) * 1.2;
    x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(an) * len / 2 + (rnd(i, 907) - 0.5) * 16, py + Math.sin(an) * len / 2 + (rnd(i, 908) - 0.5) * 16, px + Math.cos(an) * len, py + Math.sin(an) * len);
    x.stroke();
  }
  for (let i = 0; i < 5000; i++) { x.fillStyle = `rgba(110,80,40,${0.03 + rnd(i, 911) * 0.06})`; x.fillRect(rnd(i, 912) * W, rnd(i, 913) * H, 1 + rnd(i, 914) * 2, 1 + rnd(i, 915) * 2); }
  TEX = c; return c;
}
// last step of every scene: print it on paper, light it from the upper left
export function finish(ctx, o = {}) {
  const dark = o.dark ?? false;
  if (!dark) {
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.tex ?? 0.6; ctx.drawImage(paperTex(), 0, 0, W, H); ctx.restore();
    const L = o.light ?? 1;
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createRadialGradient(240, -120, 80, 240, -120, 2000);
    g.addColorStop(0, `rgba(255,246,224,${0.6 * L})`); g.addColorStop(0.45, 'rgba(255,246,224,0)'); g.addColorStop(1, `rgba(80,45,20,${0.26 * L})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  } else {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  grain(ctx, dark ? 0.07 : 0.035);
}

const DISC = new Map();
function disc(color) {
  let c = DISC.get(color);
  if (!c) {
    c = new OffscreenCanvas(128, 128); const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, rgba(color, 0.85)); g.addColorStop(0.7, rgba(color, 0.8)); g.addColorStop(0.86, rgba(color, 0.35)); g.addColorStop(1, rgba(color, 0));
    x.fillStyle = g; x.fillRect(0, 0, 128, 128); DISC.set(color, c);
  }
  return c;
}
// out-of-focus specks floating between the lens and the scene
export function bokeh(ctx, t, o = {}) {
  const n = o.n ?? 12, colors = o.colors ?? [COL.orange, COL.peach, COL.white], seed = o.seed ?? 0;
  const vx = o.vx ?? 14, vy = o.vy ?? -9, a0 = o.alpha ?? 0.16;
  ctx.save(); if (o.blend) ctx.globalCompositeOperation = o.blend;
  for (let i = 0; i < n; i++) {
    const r = (o.minR ?? 16) + rnd(i, seed + 1) * ((o.maxR ?? 70) - (o.minR ?? 16)), sp = 0.4 + rnd(i, seed + 2) * 1.2;
    const x = ((rnd(i, seed + 3) * (W + 400) + t * vx * sp) % (W + 400) + (W + 400)) % (W + 400) - 200;
    const y = ((rnd(i, seed + 4) * (H + 400) + t * vy * sp) % (H + 400) + (H + 400)) % (H + 400) - 200 + Math.sin(t * 0.5 + i) * 24;
    ctx.globalAlpha = a0 * (0.45 + 0.55 * Math.sin(t * 0.6 + i * 2.1) ** 2);
    ctx.drawImage(disc(colors[i % colors.length]), x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}
// camera: zoom about (cx, cy), pan, roll, and a breath of hand-held drift
export function cam(ctx, t, o, fn) {
  const z = o.z ?? 1, cx = o.cx ?? W / 2, cy = o.cy ?? H / 2, sd = o.seed ?? 1, hd = o.hand ?? 3;
  ctx.save();
  ctx.translate(cx + (o.x ?? 0) + noise(t * 0.33, sd) * hd, cy + (o.y ?? 0) + noise(t * 0.29, sd + 9) * hd);
  ctx.rotate((o.rot ?? 0) + noise(t * 0.21, sd + 5) * 0.0016 * (hd / 3));
  ctx.scale(z, z); ctx.translate(-cx, -cy);
  fn(); ctx.restore();
}
// a filled shape with the soft shadow of a paper cut-out
export function cut(ctx, pathFn, fill, sh = 0.2, blur = 30, oy = -6) {
  ctx.save(); ctx.shadowColor = `rgba(90,50,15,${sh})`; ctx.shadowBlur = blur; ctx.shadowOffsetY = oy; ctx.fillStyle = fill; pathFn(); ctx.fill(); ctx.restore();
}
const SOFT = new Map();
// a blurred character, for things too near or too far to be in focus
export function softGlyph(ctx, ch, x, y, size, blur, color = COL.ink, alpha = 1, rot = 0) {
  const key = ch + '|' + blur + '|' + color;
  let c = SOFT.get(key);
  if (!c) {
    const g = glyph(ch, 256, 800, color), pad = blur * 3 * SS;
    c = new OffscreenCanvas(g.s + pad * 2, g.s + pad * 2); const x2 = c.getContext('2d');
    x2.filter = `blur(${blur}px)`; x2.drawImage(g.c, pad, pad); SOFT.set(key, c);
  }
  const k = size / (256 * SS), d = c.width * k;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.drawImage(c, -d / 2, -d / 2, d, d); ctx.restore();
}
export function hillPath(ctx, base, amp, wl, ph, off = 0) {
  ctx.beginPath(); ctx.moveTo(-200, H + 200);
  for (let x = -200; x <= W + 200; x += 24) { const xx = x + off; ctx.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(xx / wl + ph)) - amp * 0.3 * Math.sin(xx / (wl * 0.37) + ph * 2.3)); }
  ctx.lineTo(W + 200, H + 200); ctx.closePath();
}
