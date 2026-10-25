// v2 redesign engine core (重做方案-v2.md): assets, frame-by-frame animation, a perspective camera, particles, the sea.
// Everything is a pure function of time (seek-able, deterministic): no clocks, no Math.random.
import { W, H, TAU, clamp, lerp, sat, E, rnd } from '../lib.js';
import { warpMesh } from '../common.js';

// ---- assets (tools/v2_slice.py -> assets/v2/manifest.json, files.json)
const IMG = {};
let MAN = null;
export async function loadV2(extra = []) {
  MAN = await (await fetch('assets/v2/manifest.json')).json();
  const files = await (await fetch('assets/v2/files.json')).json();
  const one = (key, src) => new Promise((res, rej) => { const im = new Image(); im.onload = () => { IMG[key] = im; res(); }; im.onerror = () => rej(new Error(src)); im.src = src; });
  // 包内 PNG 已转 WebP（体积约 1/5）；键仍用原文件名，所以 manifest 不用改
  const jobs = [
    ...files.map(f => () => one(f, 'assets/v2/' + f.replace(/\.png$/i, '.webp'))),
    ...extra.map(([k, src]) => () => one(k, src))
  ];
  for (let i = 0; i < jobs.length; i += 8) await Promise.all(jobs.slice(i, i + 8).map(f => f()));
}
export const img = key => IMG[key];
export const plate = id => (MAN && MAN.plates[id] ? IMG['plates/' + MAN.plates[id]] : null);
export const sheet = id => MAN && MAN.anim[id];
export const nFrames = id => (MAN && MAN.anim[id] ? MAN.anim[id].frames.length : 0);

// ---- frames
// Draw frame k of a sheet. scale: screen px per source px (the frames of one sheet share it, so their sizes stay as drawn).
// o.anchor: 'body' (default: the centre of the biggest blob lands on x, y) or 'cell' (the cell's point (cx, cy) in 0..1, default
// bottom centre, lands on x, y: keeps where Image 2 placed the drawing inside its cell, e.g. a splash growing from the waterline).
export function frame(ctx, id, k, x, y, scale, o = {}) {
  const s = sheet(id); if (!s) return null;
  const f = s.frames[clamp(Math.floor(k), 0, s.frames.length - 1)]; const im = IMG['anim/' + f.file];
  if (!im || (o.alpha ?? 1) <= 0.003) return null;
  if (globalThis.__trace) globalThis.__trace.add(id + ':' + Math.floor(k));
  let ax, ay;
  if ((o.anchor ?? 'body') === 'cell') { ax = (o.cx ?? 0.5) * s.cellW - f.ox; ay = (o.cy ?? 1) * s.cellH - f.oy; }
  else if (o.anchor === 'bottom') { ax = f.ax; ay = f.h - 3; }            // the body's x, the drawing's bottom (feet)
  else { ax = f.ax; ay = f.ay; }
  ctx.save();
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.comp) ctx.globalCompositeOperation = o.comp;
  if (o.filter) ctx.filter = o.filter;
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  ctx.scale(scale * (o.flip ? -1 : 1) * (o.sx ?? 1), scale * (o.sy ?? 1));
  ctx.drawImage(im, -ax, -ay);
  ctx.restore();
  return { w: f.w * scale, h: f.h * scale };
}
// which key is active at t: keys = [[t0, value], ...] sorted
export function at(t, keys) { let v = keys[0][1]; for (const [t0, x] of keys) if (t >= t0) v = x; return v; }
// a frame sequence played from t0, `step` seconds per drawing (2/24 ≈ on twos), held on the last frame
export const seq = (t, t0, n, step = 1 / 12) => clamp(Math.floor((t - t0) / step), 0, n - 1);

// ---- a perspective camera. World units are screen px at depth Z = F. roll turns the picture about the screen centre.
export function camera(c) {
  const F = c.F ?? 1000;
  return {
    ...c, F,
    s: Z => F / (Z - c.z),                                         // screen scale of something at depth Z
    p: (X, Y, Z) => { const s = F / (Z - c.z); return [W / 2 + (X - c.x) * s, H / 2 + (Y - c.y) * s, s]; },
  };
}
export function withRoll(ctx, roll, zoom, fn) {
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2); fn(); ctx.restore();
}
// an image billboard in the world: centre (X, Y, Z), width wW world units; o.blur by depth, o.alpha, o.ay (0..1 anchor)
export function billboard(ctx, cam, im, X, Y, Z, wW, o = {}) {
  if (!im || Z - cam.z < 20) return;
  const [x, y, s] = cam.p(X, Y, Z), w = wW * s, h = w * im.height / im.width;
  if (x + w < -400 || x - w > W + 400 || y + h < -400 || y - h > H + 400) return;
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(im, x - w * (o.ax ?? 0.5), y - h * (o.ay ?? 0.5), w, h); ctx.restore();
}
// a full-screen plate with cover fit, zoom about (fx, fy) of the image, extra offset; o.over: extra scale for rolls
export function cover(ctx, im, o = {}) {
  if (!im) return;
  const z = (o.z ?? 1) * (o.over ?? 1), s = Math.max(W / im.width, H / im.height) * z, w = im.width * s, h = im.height * s;
  const x = W / 2 - (o.fx ?? 0.5) * w + (o.x ?? 0), y = H / 2 - (o.fy ?? 0.5) * h + (o.y ?? 0);
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; if (o.filter) ctx.filter = o.filter;
  ctx.drawImage(im, x, y, w, h); ctx.restore();
}

// ---- particles: closed-form motion with linear drag k and gravity g, so any time can be drawn directly.
// pos(t) = p0 + (v0 + g/k)(1 - e^-kt)/k - g t/k   (per axis, g only on y)
export function ballistic(p0, v0, g, k, t) {
  if (k < 1e-4) return p0 + v0 * t + 0.5 * g * t * t;
  const e = 1 - Math.exp(-k * t);
  return p0 + (v0 - g / k) * e / k + g * t / k;                          // dv/dt = g - k v (g > 0 pulls down the screen)
}
export function vel(v0, g, k, t) { return k < 1e-4 ? v0 + g * t : (v0 - g / k) * Math.exp(-k * t) + g / k; }
// A burst of droplet sprites (fx_drops frames) from (x, y) at t0. o: n, seed, ang [a0, a1] (radians, 0 = right, -PI/2 = up),
// speed [v0, v1] px/s, g px/s², drag, life [l0, l1] s, size [s0, s1] (screen px of the sprite's long side), frames (ids to pick from),
// spread (s: births spread over it), fadeIn (s)
export function burst(ctx, t, t0, x, y, o = {}) {
  const dt0 = t - t0; if (dt0 < 0) return;
  const n = o.n ?? 80, sd = o.seed ?? 1, g = o.g ?? 2200, k = o.drag ?? 1.2;
  const [a0, a1] = o.ang ?? [-Math.PI * 0.95, -Math.PI * 0.05], [v0, v1] = o.speed ?? [600, 1800], [l0, l1] = o.life ?? [0.6, 1.4], [s0, s1] = o.size ?? [14, 46];
  const fr = o.frames ?? DROP_FRAMES, sheetId = o.sheet ?? 'fx_drops';
  for (let i = 0; i < n; i++) {
    const delay = rnd(i, sd + 9) * (o.spread ?? 0.06), dt = dt0 - delay; if (dt < 0) continue;
    const life = lerp(l0, l1, rnd(i, sd + 1)); if (dt > life) continue;
    const an = lerp(a0, a1, rnd(i, sd + 2)), sp = lerp(v0, v1, Math.pow(rnd(i, sd + 3), 0.7));
    const vx0 = Math.cos(an) * sp, vy0 = Math.sin(an) * sp, ox = (rnd(i, sd + 4) - 0.5) * (o.w ?? 40);
    const px = ballistic(x + ox, vx0, 0, k, dt), py = ballistic(y, vy0, g, k, dt);
    const vx = vel(vx0, 0, k, dt), vy = vel(vy0, g, k, dt);
    const size = lerp(s0, s1, rnd(i, sd + 5)) * (1 - 0.35 * dt / life);
    const fk = fr[Math.floor(rnd(i, sd + 6) * fr.length)];
    const s = sheet(sheetId); if (!s) return;
    const f = s.frames[fk], sc = size / Math.max(f.w, f.h);
    const a = (1 - sat(dt, life * 0.7, life)) * (o.fadeIn ? sat(dt, 0, o.fadeIn) : 1);
    const spd = Math.hypot(vx, vy), stretch = 1 + Math.min(0.8, spd / 2600);
    frame(ctx, sheetId, fk, px, py, sc, { rot: Math.atan2(vy, vx) + Math.PI / 2, sy: stretch, sx: 1 / Math.sqrt(stretch), alpha: a * (o.alpha ?? 1) });
  }
}
// drops that look like drops (round, teardrop, streaks), not foam: picked after looking at fx_drops (set in setDropFrames)
export let DROP_FRAMES = [0, 1, 3, 4, 5, 6, 13, 15, 0, 1];     // fx_drops: teardrops and streaks (2, 12 are bubbles; 7–11 splashes and foam; 14 mist)
export function setDropFrames(a) { DROP_FRAMES = a; }
// a steady stream (bubbles rising, digits): particle i is born at i * period and lives `life` seconds
export function stream(t, o, draw) {
  const per = o.period ?? 0.03, life = o.life ?? 2, sd = o.seed ?? 3;
  const i1 = Math.floor(t / per), i0 = Math.max(0, Math.floor((t - life) / per));
  for (let i = i0; i <= i1; i++) {
    const age = t - i * per; if (age < 0 || age > life) continue;
    draw(i, age / life, age, (k) => rnd(i, sd + k));
  }
}

// ---- the sea: a plate (sky keyed out above the horizon) drawn as a mesh whose rows heave like waves. Near rows (bottom)
// move more. o: x, y, w, h (screen box), amp (px at the bottom), wl (wavelength in u), speed, t; o.rush: forward travel speed
// (o.zoom: the plate scales up about the vanishing point, as if the camera moves forward).
export function sea(ctx, im, o) {
  if (!im) return;
  const { x, y, w, h, t } = o, amp = o.amp ?? 26, sp = o.speed ?? 1.6, wl = o.wl ?? 0.18, hz = o.horizon ?? 0;
  const P = (u, v) => {
    const d = Math.pow(v, 1.6);                                      // perspective: near rows heave more
    const ph = u / wl * TAU - t * sp * 3 + v * 9;
    return [x + u * w + Math.sin(ph * 0.5 + v * 4) * amp * 0.35 * d, y + v * h + Math.sin(ph) * amp * d - Math.cos(ph * 0.7) * amp * 0.3 * d * (1 - hz)];
  };
  warpMesh(ctx, P, im.width, im.height, (c, sw, sh) => {
    // forward travel: the plate grows out of the vanishing point on the horizon (o.zoom >= 1, no loop: a looped zoom shows seams)
    const z = o.zoom ?? 1, vx = sw / 2, vy = hz * sh;
    c.save(); c.translate(vx, vy); c.scale(z, z); c.translate(-vx, -vy); c.drawImage(im, 0, 0, sw, sh); c.restore();
  }, { nu: o.nu ?? 24, nv: o.nv ?? 14, slot: o.slot ?? 0, res: o.res ?? 1 });
}
// a strip (wave crest, rock) scrolling sideways forever: mirrored copies so there is no seam
// the bottom edge of a frame drawn with frame(..., anchor 'body') at y, scale
export function bottomOf(id, k, y, scale) { const s = sheet(id); if (!s) return y; const f = s.frames[clamp(Math.floor(k), 0, s.frames.length - 1)]; return y + (f.h - f.ay) * scale; }
export function strip(ctx, im, y, h, scroll, o = {}) {
  if (!im) return;
  const w = h * im.width / im.height, off = ((scroll % (2 * w)) + 2 * w) % (2 * w);
  ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; if (o.filter) ctx.filter = o.filter;
  for (let x = -off - 2 * w; x < W + 2 * w; x += w) {
    const k = Math.round((x + off) / w);
    ctx.save(); ctx.translate(x + w / 2, y); if (k % 2) ctx.scale(-1, 1); ctx.drawImage(im, -w / 2, -h / 2 + (o.dy ?? 0), w, h); ctx.restore();
  }
  ctx.restore();
}

// ---- shake from a list of hits [[t0, amp, dur], ...]
export function shake(t, hits) {
  let x = 0, y = 0;
  for (const [t0, a, d] of hits) {
    const dt = t - t0; if (dt < 0 || dt > d) continue;
    const k = a * Math.pow(1 - dt / d, 2); x += Math.sin(dt * 87 + t0 * 13) * k; y += Math.cos(dt * 71 + t0 * 7) * k;
  }
  return [x, y];
}
// hit-stop: inside [t0, t0 + d) time stands still at t0
export const stop = (t, stops) => { for (const [t0, d] of stops) if (t >= t0 && t < t0 + d) return t0; return t; };
export { W, H, TAU, clamp, lerp, sat, E, rnd };
