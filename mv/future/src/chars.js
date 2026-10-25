// 姐姐 (ChatGPT) is 'g'. Character sprites: keyed pose stills placed by their feet. Life comes from code: hair / skirt / wing sway and
// blinking (warp.js), breathing, on-beat squash, pops and slides.
import { SS, pulse, beatPhase, E, sat, rnd } from './lib.js';
import { initWarp, addTexture, renderWarp } from './warp.js';

let MAN = {};
const REF = {};            // reference content height per character (identity pose)
let NOW = 0;
const FB = new URLSearchParams(location.search).get('blink');
const FORCE_BLINK = FB === null ? undefined : Number(FB);       // debugging: ?blink=0.5 holds every eyelid there
export const setCharTime = t => { NOW = t; };
const DEF = { o: { R: 205, fall: 300, amp: 12, lw: 8 }, k: { R: 180, fall: 210, amp: 7, lw: 8 }, f: { R: 190, fall: 210, amp: 7, lw: 8 }, g: { R: 200, fall: 300, amp: 11, lw: 8 } };

export async function loadChars() {
  MAN = await (await fetch('assets/chars/manifest.json')).json();
  const HD = false; // shortcut: 分享包只带标准贴图；需要原版 4K 角色细节时再补高清素材。
  initWarp(HD ? 2 : 1);
  // 1080p 下角色贴图最多显示 700 多 px，源图 ~1000px。按 0.72 缩一次再上传，
  // 显存降到约一半；4K 档（ss≥1.9）仍用原尺寸。
  const texScale = SS >= 1.9 ? 1 : 0.66;
  const shrink = (im) => {
    if (texScale >= 1) return im;
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(im.naturalWidth * texScale));
    c.height = Math.max(1, Math.round(im.naturalHeight * texScale));
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(im, 0, 0, c.width, c.height);
    return c;
  };
  const load = (key, file, isMask, w, h) => new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => { addTexture(key, shrink(im), isMask, w, h); res(); };
    im.onerror = () => rej(new Error('sprite ' + key));
    im.src = ((HD && !isMask ? 'assets/chars_hd/' : 'assets/chars/') + file).replace(/\.png$/i, '.webp');
  });
  const jobs = [];
  for (const [id, m] of Object.entries(MAN)) { jobs.push(() => load(id, m.file, false, m.w, m.h)); if (m.eyeMask) jobs.push(() => load(id + '#m', m.eyeMask, true)); }
  // 分批加载：一次只解 6 张，避免开场把所有大图同时解码撑爆内存
  for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map(f => f()));
  for (const p of ['o', 'k', 'f', 'g']) { const m = MAN[p + '00']; if (m) REF[p] = m.feetY - m.top; }
}
export const has = id => !!MAN[id];
// the size to pass to char() so that this sprite's content is h pixels tall on screen
export function fitSize(id, h) { const m = MAN[id] ?? MAN[id[0] + '00']; return h * (REF[id[0]] ?? (m.feetY - m.top)) / ((m.feetY - m.top) * (m.scale ?? 1)); }

export function autoBlink(t, seed = 1) {
  const P = 3.3, n = Math.floor(t / P), dt = t - (n * P + 0.4 + rnd(n, seed) * 1.9);
  if (dt < 0 || dt > 0.26) return 0;
  return dt < 0.07 ? dt / 0.07 : dt < 0.12 ? 1 : 1 - (dt - 0.12) / 0.14;
}

// size = on-screen height the identity pose of this character would have; every pose uses the same pixel scale.
export function char(ctx, id, x, feetY, size, o = {}) {
  let m = MAN[id];
  if (!m) { id = id[0] + '00'; m = MAN[id]; }      // pose not generated yet -> identity pose
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  if (globalThis.__trace && size > 1) globalThis.__trace.add(id);   // tools/trace: which poses this frame draws
  const d = DEF[id[0]] ?? { R: 1e5, fall: 1, amp: 0, lw: 8 };
  const k = (size / (REF[id[0]] ?? (m.feetY - m.top))) * (m.scale ?? 1) * (o.scale ?? 1);
  const fx = m.feetXo ?? m.feetX;
  const seed = id.charCodeAt(0);
  const r = renderWarp(id, m, {
    time: (o.t ?? NOW) + seed * 0.37, R: m.R ?? d.R, fall: m.fall ?? d.fall,
    amp: d.amp * (o.sway ?? 1), flutter: o.flutter ?? 0, windX: o.windX ?? 0, windY: o.windY ?? 0,
    lw: m.lw ?? d.lw, blink: FORCE_BLINK ?? o.blink ?? autoBlink(o.t ?? NOW, seed), smile: o.smile ?? 0,
  });
  ctx.save();
  if (o.shadow !== false) {
    ctx.globalAlpha = 0.17 * a * (o.shadowA ?? 1) * (1 - Math.min(1, (o.lift ?? 0) / (size * 0.6)) * 0.6);
    ctx.fillStyle = o.shadowColor ?? '#3A2A1A';
    const sw = size * 0.21 * (1 - Math.min(1, (o.lift ?? 0) / (size * 0.9)) * 0.4);
    ctx.beginPath(); ctx.ellipse(x + (o.shadowDx ?? 0), feetY - 2, sw, size * 0.034, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = a;
  ctx.translate(x, feetY - (o.lift ?? 0));
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale((o.flip ? -1 : 1) * k * (o.sx ?? 1), k * (o.sy ?? 1));
  ctx.drawImage(r.canvas, r.sx, r.sy, r.sw, r.sh, -fx - r.padX, -m.feetY - r.padY, r.dw, r.dh);
  ctx.restore();
}

// on-beat squash and stretch: returns {sx, sy} to pass to char()
export function bop(t, amt = 1, k = 6) {
  const p = pulse(t, k);
  return { sx: 1 + 0.028 * amt * p, sy: 1 - 0.04 * amt * p };
}
// soft idle breathing
export function breathe(t, amt = 1, ph = 0) {
  const s = Math.sin(t * 2.1 + ph);
  return { sx: 1 - 0.006 * amt * s, sy: 1 + 0.01 * amt * s, rot: Math.sin(t * 1.3 + ph) * 0.008 * amt };
}
export function pop(t, t0, dur = 0.35) { return t < t0 ? 0 : E.back(sat(t, t0, t0 + dur)); }
// walking: a fixed pose that bobs once per beat
export function walkBob(t) {
  const ph = beatPhase(t);
  return { lift: Math.abs(Math.sin(ph * Math.PI)) * 16, rot: Math.sin(ph * Math.PI) * 0.03 };
}
// two-frame walk: wide stride on the beat, passing pose between beats
export function walkPose(t) { const f = beatPhase(t) % 1; return f < 0.25 || f >= 0.75 ? 'o11' : 'o06'; }
export const manifest = () => MAN;
