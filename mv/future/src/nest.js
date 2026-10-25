// An endless pull-back through pictures inside pictures (the opening, and its echo at the end). Each layer is a
// picture (or a drawn page) of w x h pixels; `inner` is the rectangle, in its own pixels, where the next smaller layer
// sits; `view` [cx, cy, width] is how it is framed when it fills the screen. The camera moves on a level s: at s = k
// layer k is framed by its view; in between, the view width changes geometrically and the centre moves in step with
// it, so the zoom runs straight at the inner picture. Inner pictures are drawn with soft edges (`feather`, a fraction
// of their size) so that two paintings blend into one another; `clip` gives a hard edge instead (a phone screen).
import { W, H, SS, clamp, lerp } from './lib.js';

export function buildNest(layers) {
  const N = layers.length, R = new Array(N);
  R[N - 1] = { x: 0, y: 0, s: 1 };                         // layer px -> world (the outermost layer's px): world = x + px * s
  for (let k = N - 1; k > 0; k--) {
    const I = layers[k].inner, r = R[k];
    R[k - 1] = { x: r.x + I[0] * r.s, y: r.y + I[1] * r.s, s: r.s * I[2] / layers[k - 1].w };
  }
  const V = layers.map((L, k) => ({ cx: R[k].x + L.view[0] * R[k].s, cy: R[k].y + L.view[1] * R[k].s, w: L.view[2] * R[k].s }));
  return { layers, R, V };
}
function viewAt(N, s) {
  const k = clamp(Math.floor(s), 0, N.V.length - 2), f = s - k, a = N.V[k], b = N.V[k + 1];
  const w = Math.exp(lerp(Math.log(a.w), Math.log(b.w), f)), q = (w - b.w) / (a.w - b.w);
  return { cx: lerp(b.cx, a.cx, q), cy: lerp(b.cy, a.cy, q), w };
}
// layer px -> screen, at level s (plus a screen-space shake dx, dy)
export function nestXf(N, s, k, dx = 0, dy = 0) {
  const v = viewAt(N, s), z = W / v.w, ox = v.cx - v.w / 2, oy = v.cy - v.w * H / W / 2, r = N.R[k];
  return { x: (r.x - ox) * z + dx, y: (r.y - oy) * z + dy, s: r.s * z };
}

const MASKS = new Map();
function featherMask(f) {                                  // a small alpha ramp, stretched over a layer's rectangle
  let c = MASKS.get(f);
  if (!c) {
    const n = 128; c = new OffscreenCanvas(n, n); const x = c.getContext('2d'), im = x.createImageData(n, n);
    const ramp = u => { const q = clamp(Math.min(u, 1 - u) / f); return q * q * (3 - 2 * q); };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) im.data[(j * n + i) * 4 + 3] = 255 * ramp((i + 0.5) / n) * ramp((j + 0.5) / n);
    x.putImageData(im, 0, 0); MASKS.set(f, c);
  }
  return c;
}
let TMP = null;
export function drawNest(ctx, N, s, dx = 0, dy = 0) {
  const L = N.layers, n = L.length;
  let start = n - 1;
  for (let k = 0; k < n; k++) {                            // the innermost layer that already covers the whole screen
    const T = nestXf(N, s, k, dx, dy);
    if (T.x <= 0 && T.y <= 0 && T.x + L[k].w * T.s >= W && T.y + L[k].h * T.s >= H) { start = k; break; }
  }
  for (let k = start; k >= 0; k--) {
    const T = nestXf(N, s, k, dx, dy), w = L[k].w * T.s, h = L[k].h * T.s;
    if (w < 3) break;
    const own = k < start;                                 // drawn inside an outer layer
    if (own && L[k].feather) {
      if (!TMP) TMP = new OffscreenCanvas(W * SS, H * SS);
      const t = TMP.getContext('2d');
      t.setTransform(SS, 0, 0, SS, 0, 0); t.globalAlpha = 1; t.globalCompositeOperation = 'source-over'; t.filter = 'none'; t.clearRect(0, 0, W, H);
      t.save(); t.translate(T.x, T.y); t.scale(T.s, T.s); L[k].draw(t, k); t.restore();
      t.globalCompositeOperation = 'destination-in'; t.drawImage(featherMask(L[k].feather), T.x, T.y, w, h); t.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(TMP, 0, 0); ctx.restore();
    } else {
      ctx.save();
      if (own && L[k].clip) { ctx.beginPath(); ctx.roundRect(T.x, T.y, w, h, L[k].clip * T.s); ctx.clip(); }
      ctx.translate(T.x, T.y); ctx.scale(T.s, T.s); L[k].draw(ctx, k); ctx.restore();
    }
  }
}
