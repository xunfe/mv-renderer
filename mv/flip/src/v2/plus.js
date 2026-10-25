// v2: the original shots from 0:06 on, kept as they were, with motion added on top (本人 10-21: 在原来的基础上增加动态、视觉、
// 小巧思；不要把核心切了；动作要连贯，不连贯的动作宁可不做).
// enhance(shot, cfg) runs the original shot unchanged; while it runs, poses listed in cfg.ov are drawn from an action sheet
// (gen/v2/jobs_src.py c_*: four drawings that start from the original pose) at the original feet and on-screen height;
// cfg.bg(ctx, t, id, o) draws just over each background painting (behind everything else);
// cfg.cam moves the camera a little (only where nothing the shot tells sits near the edges); cfg.extra draws on top.
// ov entry: sheet (none: only `before` is drawn, behind the original pose), keys [[t0, k], ...] or k(t), ref (the frame that matches the original pose: sets the size), refId (that
// original pose, when the sheet stands in for several), fit, fits [per frame: Image 2 drew it bigger or smaller], dx, dy,
// flip (fixed), before / after (ctx, t, info, k, scale): drawn just behind / over the pose; lit(t): coloured light on it (litOver).
import { W, H, TAU, clamp, lerp, sat, E, rnd, sheet, frame, at, seq, burst, shake } from './core.js';
import { spriteInfo } from '../chars.js';
const poseH = id => { const m = spriteInfo(id); return m ? (m.feetY - m.top) * (m.scale ?? 1) : 1; };     // a pose's height at size 1 (chars.js k)

// the drawing to show at t: keys [[t0, k], ...], or a cycle
export const cyc = (t0, n, step) => t => Math.max(0, Math.floor((t - t0) / step)) % n;
function overrides(ov, t) {
  const fns = {};
  for (const [id, sp] of Object.entries(ov)) fns[id] = (ctx, info) => {
    if (sp.replace) { sp.replace(ctx, t, info); return true; }           // replace: draw something else in her place (a big single drawing)
    if (!sp.sheet) { if (sp.before) sp.before(ctx, t, info); return false; }   // no sheet: just draw something behind her, then her original pose
    const s = sheet(sp.sheet); if (!s) return false;                    // not sliced yet: the original pose
    const tk = globalThis.__frameT ?? t;                                 // the drawing changes on a frame, not inside its motion blur
    const k = sp.k ? sp.k(tk) : at(tk, sp.keys), ref = s.frames[sp.ref ?? 0];
    const h = sp.refId && sp.refId !== info.id ? info.h * poseH(sp.refId) / poseH(info.id) : info.h;      // one scale for the whole sheet
    const scale = h * (sp.fit ?? 1) * (sp.fits?.[k] ?? 1) / ref.h, o = info.o;
    if (sp.before) sp.before(ctx, t, info, k, scale);
    const fo = { anchor: 'bottom', flip: sp.flip ?? o.flip, rot: o.rot, alpha: o.alpha, sx: o.sx, sy: o.sy };      // sp.flip: the sheet already turns her over
    const fx = info.x + (typeof sp.dx === 'function' ? sp.dx(t) : (sp.dx ?? 0)), fy = info.feetY - (o.lift ?? 0) + (typeof sp.dy === 'function' ? sp.dy(t) : (sp.dy ?? 0));
    frame(ctx, sp.sheet, k, fx, fy, scale, fo);
    if (sp.lit) { const fw = (s.frames[Math.floor(k)]?.w ?? 0) * scale; litOver(ctx, sp.lit(t), c => frame(c, sp.sheet, k, fx, fy, scale, fo), [fx - fw * 0.55, fx + fw * 0.55]); }
    if (sp.after) sp.after(ctx, t, info, k, scale);
  };
  return fns;
}
// coloured light on a drawing: its silhouette, filled with a gradient that is strongest on the lit side (dir: +1 the light comes
// from the right), screened over it. lights: [[colour, amount 0..1, dir], ...]
let LIT = null;
export function litOver(ctx, lights, draw, box) {                     // box: [x0, x1] of the drawing: the light rims its lit edge
  lights = (lights || []).filter(l => l[1] > 0.003); if (!lights.length) return;
  if (!LIT || LIT.width !== ctx.canvas.width || LIT.height !== ctx.canvas.height) LIT = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const c = LIT.getContext('2d');
  for (const [col, amt, dir = 1] of lights) {
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.filter = 'none'; c.clearRect(0, 0, LIT.width, LIT.height);
    c.setTransform(ctx.getTransform()); draw(c);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-in';
    const T = ctx.getTransform(), X = x => T.a * x + T.e, [a0, a1] = box ? [X(box[0]), X(box[1])] : [0, LIT.width];
    const g = c.createLinearGradient(dir > 0 ? a0 : a1, 0, dir > 0 ? a1 : a0, 0);
    g.addColorStop(0, rgbaHex(col, box ? 0 : 0.35 * amt)); if (box) g.addColorStop(0.55, rgbaHex(col, 0.12 * amt)); g.addColorStop(1, rgbaHex(col, amt));
    c.fillStyle = g; c.fillRect(0, 0, LIT.width, LIT.height);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'screen'; ctx.drawImage(LIT, 0, 0); ctx.restore();
  }
}
const rgbaHex = (h, a) => `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${Math.max(0, Math.min(1, a))})`;
// run fn with some poses replaced (as enhance() does for a whole shot), for the new shots that draw v1 poses themselves
export function withPoses(ov, t, fn) {
  const prev = globalThis.__poseOv; globalThis.__poseOv = overrides(ov, t);
  try { fn(); } finally { globalThis.__poseOv = prev; }
}
export function enhance(shot, cfg = {}) {
  const f = (ctx, t) => {
    globalThis.__poseOv = cfg.ov ? overrides(cfg.ov, t) : null;
    globalThis.__bdHook = cfg.bg ? (c, id, o) => { const h = globalThis.__bdHook; globalThis.__bdHook = null; cfg.bg(c, t, id, o); globalThis.__bdHook = h; } : null;
    ctx.save();
    if (cfg.cam) {
      const c = cfg.cam(t);
      ctx.translate(W / 2 + (c.x ?? 0), H / 2 + (c.y ?? 0)); if (c.rot) ctx.rotate(c.rot); ctx.scale(c.z ?? 1, c.z ?? 1); ctx.translate(-W / 2, -H / 2);
    }
    shot(ctx, t);
    if (cfg.inner) cfg.inner(ctx, t);                                   // drawn with the camera (cfg.extra is drawn over it, without)
    ctx.restore();
    globalThis.__poseOv = null; globalThis.__bdHook = null;
    if (cfg.extra) { ctx.save(); cfg.extra(ctx, t); ctx.restore(); }
  };
  f.orig = shot;
  return f;
}
