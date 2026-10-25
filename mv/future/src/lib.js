// Shared helpers for 《那年你叫我未来》 (engine from 《世界还在写》). Everything is a pure function of time: no clocks, no Math.random.
export const W = 1920, H = 1080, TAU = Math.PI * 2;
// Everything is laid out in 1920x1080 units. ?ss=2 renders the same layout on a 3840x2160 canvas: the base transform
// is scaled by SS, and the few canvas properties that ignore the transform (shadow blur and offset, blur filters)
// are scaled here, once, so no scene code has to know about it.
export const SS = Math.min(2, Math.max(0.5, Number(new URLSearchParams(location.search).get('ss') || 1)));   // 0.5~2：低端机可以降到半分辨率换帧率
if (SS !== 1) for (const P of [CanvasRenderingContext2D.prototype, OffscreenCanvasRenderingContext2D.prototype]) {
  for (const prop of ['shadowBlur', 'shadowOffsetX', 'shadowOffsetY']) {
    const d = Object.getOwnPropertyDescriptor(P, prop);
    Object.defineProperty(P, prop, { configurable: true, get() { return d.get.call(this) / SS; }, set(v) { d.set.call(this, v * SS); } });
  }
  const f = Object.getOwnPropertyDescriptor(P, 'filter');
  Object.defineProperty(P, 'filter', { configurable: true, get() { return f.get.call(this); },
    set(v) { f.set.call(this, String(v).replace(/blur\(([\d.]+)px\)/g, (m, n) => `blur(${n * SS}px)`)); } });
}
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sat = (t, a, b) => clamp((t - a) / (b - a));
export const E = {
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  out: t => 1 - Math.pow(1 - t, 3),
  out5: t => 1 - Math.pow(1 - t, 5),
  in: t => t * t * t,
  back: t => { if (t <= 0) return 0; if (t >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },      // exactly 0 before it starts (the formula gives about 1e-16)
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  elastic: t => (t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (TAU / 3)) + 1),
};
export function rnd(i, salt = 0) {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 0.1234) * 43758.5453;
  return x - Math.floor(x);
}
// smooth 1-D value noise in [-1, 1]
export function noise(x, salt = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rnd(i, salt), rnd(i + 1, salt), u) * 2 - 1;
}

export const COL = {
  paper: '#F5EDDD', paper2: '#EBDFC8', white: '#FFFDF6', ink: '#2B2320', inkSoft: '#6B5F57',
  orange: '#EE7A2E', orangeD: '#D2561A', peach: '#FBD9B8', yellow: '#F8C65A',
  green: '#17835A', mint: '#A6E3C8', blue: '#2D4FA3', cyan: '#58C4F0', night: '#1C1922', cream: '#FFF3DC',
  // 姐姐: silver-white and lavender on night blue; 小柯's green only comes in with her
  lav: '#B9AAF0', lavD: '#7C69C8', lavL: '#E4DDFB', silver: '#EEF0FA', navy: '#121735', navy2: '#1E2650', violet: '#2C2257',
  snow: '#F2F5FF', gold: '#F4C766', goldD: '#C98E2B', ko: '#2FA676', koL: '#7FE0B4', grey: '#9A98A8', bubble: '#E7E9EF',
};
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export function mix(c1, c2, t) {
  const a = hex(c1), b = hex(c2);
  return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`;
}
export function rgba(c, a) { const v = c[0] === '#' ? hex(c) : c.match(/[\d.]+/g); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; }      // hex or rgb(...)
// mix of two hex colours, with alpha
export function mixa(c1, c2, t, a) { const x = hex(c1), y = hex(c2); return `rgba(${Math.round(lerp(x[0], y[0], t))},${Math.round(lerp(x[1], y[1], t))},${Math.round(lerp(x[2], y[2], t))},${a})`; }

export const SERIF = '"Noto Serif SC"', SANS = '"Noto Sans SC"';
export const font = (px, weight = 600, fam = SERIF) => `${weight} ${px}px ${fam}`;

// ---- beats
let BEATS = [];
export function setBeats(b) { BEATS = b; }
// A scene written for one place in the song can be shown at another (the same chorus later): it is called with its
// own time, and beat lookups are shifted to where it is actually playing.
let BSHIFT = 0;
export function setBeatShift(d) { BSHIFT = d; }
export function beatAt(t) {            // index of the last beat <= t, time since it, and the beat length
  t += BSHIFT;
  let lo = 0, hi = BEATS.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (BEATS[m] <= t) lo = m; else hi = m - 1; }
  const len = (BEATS[lo + 1] ?? BEATS[lo] + 0.43) - BEATS[lo];
  return { i: lo, dt: Math.max(0, t - BEATS[lo]), len };
}
export function pulse(t, k = 7) { const b = beatAt(t); return Math.exp(-k * b.dt); }
export function beatPhase(t) { const b = beatAt(t); return b.i + clamp(b.dt / b.len); }   // continuous beat counter

export const KICKS = [];          // set from analysis/timeline.json (kicks) in main.js
export function kick(t, k = 7) { let v = 0; for (const x of KICKS) if (t >= x && t - x < 1) v = Math.max(v, Math.exp(-k * (t - x))); return v; }

// ---- glyph sprites (cached), so thousands of characters per frame stay cheap
const GCACHE = new Map();
export function glyph(ch, size, weight = 700, color = COL.ink, fam = SERIF) {
  const q = Math.min(512 * SS, Math.max(32, Math.pow(2, Math.ceil(Math.log2(size * SS)))));       // cached at device resolution
  const key = ch + '|' + q + '|' + weight + '|' + color + '|' + fam;
  let g = GCACHE.get(key);
  if (!g) {
    const s = Math.ceil(q * 1.4);
    const c = document.createElement('canvas'); c.width = c.height = s; const x = c.getContext('2d');
    x.font = font(q, weight, fam); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = color;
    x.fillText(ch, s / 2, s / 2 + q * 0.04);
    g = { c, q, s };
    GCACHE.set(key, g);
  }
  return g;
}
export function drawGlyph(ctx, ch, x, y, size, o = {}) {
  const g = glyph(ch, size, o.weight ?? 700, o.color ?? COL.ink, o.fam ?? SERIF);
  const k = size / g.q, d = g.s * k;
  const a = o.alpha ?? 1;
  if (a <= 0.003) return;
  const sx = o.sx ?? 1, sy = o.sy ?? 1, rot = o.rot ?? 0;
  const pa = ctx.globalAlpha;
  ctx.globalAlpha = pa * a;
  if (rot || sx !== 1 || sy !== 1) {
    ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(sx, sy);
    ctx.drawImage(g.c, -d / 2, -d / 2, d, d); ctx.restore();
  } else ctx.drawImage(g.c, x - d / 2, y - d / 2, d, d);
  ctx.globalAlpha = pa;
}
export function text(ctx, str, x, y, o = {}) {
  ctx.save();
  ctx.font = font(o.size ?? 48, o.weight ?? 600, o.fam ?? SERIF);
  ctx.textAlign = o.align ?? 'center'; ctx.textBaseline = o.base ?? 'middle';
  if (o.ls) ctx.letterSpacing = o.ls + 'px';
  ctx.globalAlpha *= o.alpha ?? 1;
  if (o.stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = o.sw ?? 8; ctx.strokeStyle = o.stroke; ctx.strokeText(str, x, y); }
  ctx.fillStyle = o.color ?? COL.ink;
  ctx.fillText(str, x, y);
  ctx.restore();
}
export function measure(ctx, str, size, weight = 600, fam = SERIF, ls = 0) {
  ctx.save(); ctx.font = font(size, weight, fam); if (ls) ctx.letterSpacing = ls + 'px';
  const w = ctx.measureText(str).width; ctx.restore(); return w;
}

// ---- paper
let NOISE = null;
function noiseTile() {
  if (NOISE) return NOISE;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.floor(rnd(i, 7) * 255);
    d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = v; d.data[i * 4 + 3] = 255;
  }
  x.putImageData(d, 0, 0);
  NOISE = c; return c;
}
export function grain(ctx, amount = 0.05) {
  ctx.save(); ctx.globalAlpha = amount; ctx.globalCompositeOperation = 'overlay';
  const pat = ctx.createPattern(noiseTile(), 'repeat');
  if (SS !== 1) pat.setTransform(new DOMMatrix().scale(1 / SS));       // one noise texel per device pixel
  ctx.fillStyle = pat; ctx.fillRect(0, 0, W, H); ctx.restore();
}
export function paper(ctx, color = COL.paper, vig = 0.16) {
  ctx.fillStyle = color; ctx.fillRect(-300, -300, W + 600, H + 600);
  if (vig > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
    g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, `rgba(60,40,20,${vig})`);
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
  }
}
export function rrect(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
}
export function caret(ctx, x, y, h, t, color = COL.orange, w = 0, always = false) {
  const on = always || ((t % 0.86) < 0.5);
  if (!on) return;
  ctx.fillStyle = color; ctx.fillRect(x, y - h / 2, w || Math.max(4, h * 0.07), h);
}

// page turn: new scene revealed from the right, old one stays left of a slanted fold with a curled back strip
export function pageFlip(ctx, p, drawOld, drawNew) {
  const e = E.io(clamp(p));
  const xf = lerp(W + 260, -420, e), sl = 150;
  drawNew();
  // shadow the fold casts on the new page
  ctx.save();
  ctx.beginPath(); ctx.moveTo(xf + sl, 0); ctx.lineTo(xf + sl + 160, 0); ctx.lineTo(xf - sl + 160, H); ctx.lineTo(xf - sl, H); ctx.closePath();
  const gs = ctx.createLinearGradient(xf, 0, xf + 160, 0);
  gs.addColorStop(0, 'rgba(40,25,10,0.28)'); gs.addColorStop(1, 'rgba(40,25,10,0)');
  ctx.fillStyle = gs; ctx.fill(); ctx.restore();
  // old page
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(xf + sl, -10); ctx.lineTo(xf - sl, H + 10); ctx.lineTo(-10, H + 10); ctx.closePath(); ctx.clip();
  drawOld();
  ctx.restore();
  // curled back of the page
  const cw = 300 * Math.sin(Math.PI * clamp(p)) + 30;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(xf + sl - cw, 0); ctx.lineTo(xf + sl, 0); ctx.lineTo(xf - sl, H); ctx.lineTo(xf - sl - cw, H); ctx.closePath();
  const gc = ctx.createLinearGradient(xf - cw, 0, xf, 0);
  gc.addColorStop(0, '#D9CBB0'); gc.addColorStop(0.55, '#FFFDF6'); gc.addColorStop(1, '#E6DAC2');
  ctx.fillStyle = gc; ctx.fill();
  ctx.beginPath(); ctx.moveTo(xf + sl - cw, 0); ctx.lineTo(xf + sl - cw - 90, 0); ctx.lineTo(xf - sl - cw - 90, H); ctx.lineTo(xf - sl - cw, H); ctx.closePath();
  const gl = ctx.createLinearGradient(xf - cw - 90, 0, xf - cw, 0);
  gl.addColorStop(0, 'rgba(40,25,10,0)'); gl.addColorStop(1, 'rgba(40,25,10,0.22)');
  ctx.fillStyle = gl; ctx.fill();
  ctx.restore();
}

// 8-petal flower like the one in 橙子's hair
export function flower(ctx, x, y, r, rot = 0, petal = COL.orange, core = COL.cream, line = COL.ink) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.lineWidth = Math.max(1.5, r * 0.07); ctx.strokeStyle = line; ctx.fillStyle = petal;
  for (let i = 0; i < 10; i++) {
    ctx.save(); ctx.rotate((i / 10) * TAU);
    ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.2, r * 0.4, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, r * 0.26, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.restore();
}

export const MEMO = ['今天的海是灰蓝色的。', '鸟从屋顶上飞过去了。', '下雨了，记得收衣服。', '第一次看见雪，我六岁。', '山那边，还是山。',
  '火要小心。', '难过的时候，吃点甜的。', '明天见。', '外婆家门口有一棵柿子树。', '地铁上有人在读诗。', '这道题我想了一晚上。',
  '猫今天没有理我。', '风很大，帽子飞了。', '我们在桥上等日落。', '面要趁热吃。', '他说，别怕，慢慢来。', '信写到一半，天亮了。',
  '夏天的冰是甜的。', '把灯留着，我晚点回。', '今晚的月亮很圆。', '种子发芽了！', '路还长，先吃饭。', '我学会骑车了。',
  '那首歌我听了一百遍。', '谢谢你。', '对不起，我迟到了。', '海水是咸的。', '星星比昨天多。', '再见，再见。', '好的，谢谢。',
  '冬天的被子最难离开。', '她笑起来像一颗橘子。', '作业还没写完。', '这座城市的灯很多。', '我想家了。', '你吃了吗？'];
