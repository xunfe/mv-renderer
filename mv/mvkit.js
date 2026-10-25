/* mvkit.mjs — AI娘 歌词 MV 共用绘制库（浏览器 / Node(napi-canvas) 双用）
 *
 * 设计目标：
 *  1. 一句歌词一个镜头；镜头里的一切都从歌词意思来（背景 / 主图形 / 字 / 人物 / 粒子）。
 *  2. 不靠贴在画面上的「浮字」堆气氛；用光、层次和运镜把情绪推出来。
 *  3. 同一套代码在浏览器里 1080P60 跑，在 Node 里用 Skia 逐帧对图。
 *
 * 不引用 DOM、不读 location；需要 canvas 的地方都由调用方传进来。
 */
export const W = 1920, H = 1080, TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sat = (t, a, b) => clamp((t - a) / (b - a || 1e-6));
export const E = {
  out: t => 1 - Math.pow(1 - t, 3),
  out5: t => 1 - Math.pow(1 - t, 5),
  io: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  in: t => t * t * t,
  back: t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  inBack: t => { const c1 = 1.70158, c3 = c1 + 1; return c3 * t * t * t - c1 * t * t; },
  soft: t => t * t * (3 - 2 * t),
};
export function rnd(i, salt = 0) {
  const x = Math.sin(i * 127.1 + salt * 311.7 + 0.1234) * 43758.5453;
  return x - Math.floor(x);
}
export function noise(x, salt = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(rnd(i, salt), rnd(i + 1, salt), u) * 2 - 1;
}
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
export const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`; };
export const rgba = (c, a) => { const v = hex(c); return `rgba(${v[0]},${v[1]},${v[2]},${clamp(a)})`; };
export const SERIF = '"Noto Serif SC","Noto Serif CJK SC","Songti SC",serif';
export const SANS = '"Noto Sans SC","Noto Sans CJK SC","PingFang SC",sans-serif';
export const font = (px, weight = 600, fam = SERIF) => `${weight} ${px}px ${fam}`;

/* ---------------- 文字 ---------------- */
export function measure(ctx, s, size, weight = 600, fam = SERIF, ls = 0) {
  ctx.save(); ctx.font = font(size, weight, fam);
  let w = 0;
  for (const ch of s) w += ctx.measureText(ch).width + ls;
  ctx.restore();
  return Math.max(0, w - (s.length ? ls : 0));
}
export function text(ctx, s, x, y, o = {}) {
  const size = o.size || 40, weight = o.weight == null ? 600 : o.weight, fam = o.fam || SERIF;
  const ls = o.ls || 0, alpha = o.alpha == null ? 1 : o.alpha;
  if (alpha <= 0.002 || !s) return;
  const w = measure(ctx, s, size, weight, fam, ls);
  let x0 = x;
  if (o.align === 'center') x0 = x - w / 2;
  else if (o.align === 'right') x0 = x - w;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.textAlign = 'left'; ctx.textBaseline = o.base || 'middle';
  ctx.font = font(size, weight, fam);
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x0 + (o.sx || 2), y + (o.sy || 4)); }
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = o.glowR || 28; }
  ctx.fillStyle = o.color || '#fff';
  let cx = x0;
  for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + ls; }
  ctx.restore();
}
// 逐字上色 / 逐字出现：chars 的每个字带 vocal 时间
export function karaokeText(ctx, s, times, songT, x, y, o = {}) {
  const size = o.size || 42, weight = o.weight == null ? 600 : o.weight, fam = o.fam || SERIF;
  const ls = o.ls || 0, w = measure(ctx, s, size, weight, fam, ls);
  let x0 = x;
  if (o.align === 'center') x0 = x - w / 2;
  else if (o.align === 'right') x0 = x - w;
  ctx.save();
  ctx.font = font(size, weight, fam);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  const chars = [...s];
  let cx = x0;
  const rev = o.reveal && o.baseAlpha != null ? 0.55 : 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const t = times && times[i] != null ? times[i] : -1;
    const on = t >= 0 && songT >= t - 0.06;
    const a = sat(songT, (t >= 0 ? t : 0) - 0.12, (t >= 0 ? t : 0) + 0.16);
    const cw = ctx.measureText(ch).width + ls;
    if (ch !== ' ' && ch !== '\u3000') {
      if (o.shadow) { ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillText(ch, cx + 2, y + 4); }
      if (on) {
        ctx.globalAlpha = 1;
        if (o.hiGlow) { ctx.shadowColor = o.hiGlow; ctx.shadowBlur = 20; } else ctx.shadowBlur = 0;
        ctx.fillStyle = o.hi || '#ffe0a8';
        ctx.fillText(ch, cx, y);
        ctx.shadowBlur = 0;
      } else {
        ctx.globalAlpha = o.baseAlpha == null ? 0.9 : o.baseAlpha + (1 - o.baseAlpha) * 0;
        ctx.fillStyle = o.color || '#f2e7d3';
        ctx.fillText(ch, cx, y);
        if (o.ghost != null && t >= 0) { ctx.globalAlpha = 0.22 + 0.2 * (1 - a); }
      }
    }
    cx += cw;
  }
  ctx.restore();
}

/* ---------------- 图形 ---------------- */
export function rrect(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}
export function lin(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [p, c] of stops) g.addColorStop(p, c);
  return g;
}
export function rad(ctx, x, y, r, stops) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(1, r));
  for (const [p, c] of stops) g.addColorStop(p, c);
  return g;
}
export function glow(ctx, x, y, r, color, a = 1) {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rad(ctx, x, y, r, [[0, rgba(color, 0.55)], [0.4, rgba(color, 0.2)], [1, rgba(color, 0)]]);
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}
export function rline(ctx, pts, o = {}) {
  if (!pts || pts.length < 2) return;
  ctx.save();
  ctx.globalAlpha *= o.a == null ? 1 : o.a;
  ctx.strokeStyle = o.color || '#e8b86a';
  ctx.lineWidth = o.w || 2;
  ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  if (o.glow) { ctx.shadowColor = o.color; ctx.shadowBlur = o.glow; }
  ctx.beginPath();
  pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  if (o.close) ctx.closePath();
  ctx.stroke();
  ctx.restore();
}
export function dot(ctx, x, y, r, color, a = 1, glowR = 0) {
  ctx.save(); ctx.globalAlpha *= a;
  if (glowR) { ctx.shadowColor = color; ctx.shadowBlur = glowR; }
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.restore();
}
export function sparkle(ctx, x, y, r, color, a = 1) {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
  ctx.restore();
}
export function vignette(ctx, a = 0.45, ss = 1) {
  const g = rad(ctx, W / 2, H * 0.46, H * 1.05, [[0.32, 'rgba(0,0,0,0)'], [1, `rgba(0,0,0,${a})`]]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
export function letterbox(ctx, h = 0) {
  if (!h) return;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
}
// 胶片颗粒：一张 256 噪声贴图，平铺 + 随时间偏移；两种运行环境都便宜
export function makeGrain(factory, size = 256) {
  const cv = factory(size, size);
  const g = cv.getContext('2d');
  const im = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 128 + (Math.random() - 0.5) * 220;
    im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = v; im.data[i * 4 + 3] = 255;
  }
  g.putImageData(im, 0, 0);
  return cv;
}
export function grain(ctx, tex, t, amount = 0.05) {
  if (!tex || amount <= 0) return;
  ctx.save();
  ctx.globalAlpha = amount;
  ctx.globalCompositeOperation = 'overlay';
  const ox = -((t * 137) % 256), oy = -((t * 91) % 256);
  for (let y = 0; y < H + 256; y += 256) for (let x = 0; x < W + 256; x += 256) ctx.drawImage(tex, x + ox, y + oy);
  ctx.restore();
}

/* ---------------- 场景通用件 ---------------- */
// 夜空：底色 + 星点 + 云 + 月/日
export function night(ctx, t, o = {}) {
  const top = o.top || '#050b14', bot = o.bot || '#0c202c';
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, top], [1, bot]]);
  ctx.fillRect(0, 0, W, H);
  if (o.stars !== 0) {
    const n = o.stars || 120;
    for (let i = 0; i < n; i++) {
      const x = rnd(i, 1) * W, y = rnd(i, 2) * (o.starH || 760);
      const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * (0.5 + rnd(i, 3)) + rnd(i, 4) * 6));
      ctx.globalAlpha = tw * (0.2 + rnd(i, 5) * 0.6) * (o.starA == null ? 1 : o.starA);
      ctx.fillStyle = rnd(i, 6) > 0.85 ? (o.gold || '#e8b86a') : '#dcefff';
      const s = 1 + rnd(i, 7) * 2;
      ctx.fillRect(x, y, s, s);
    }
    ctx.globalAlpha = 1;
  }
  if (o.moon) {
    const [mx, my, mr] = o.moon;
    glow(ctx, mx, my, mr * 6, o.moonCol || '#fff6e3', 0.5);
    ctx.fillStyle = o.moonCol || '#f7eeda';
    ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(214,198,166,0.16)';
    ctx.beginPath(); ctx.arc(mx - mr * 0.3, my - mr * 0.2, mr * 0.2, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(mx + mr * 0.34, my + mr * 0.26, mr * 0.13, 0, TAU); ctx.fill();
  }
}
// 海：地平线以下分层浪，可给定起伏幅度与速度
export function sea(ctx, t, o = {}) {
  const hz = o.hz == null ? 760 : o.hz;
  const amp = o.amp == null ? 1 : o.amp;
  const base = o.base || '#0a2632';
  ctx.save();
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, hz);
  const g = lin(ctx, 0, hz, 0, H, [[0, o.g0 || rgba(base, 0.92)], [1, o.g1 || '#02080c']]);
  ctx.fillStyle = g;
  for (let layer = 0; layer < (o.layers || 4); layer++) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W + 12; x += 12) {
      const y = hz + 14 + layer * (o.gap || 62) * amp
        + Math.sin(x * 0.0045 + t * (0.5 + layer * 0.17) + layer * 1.7) * (10 + layer * 7) * amp
        + Math.sin(x * 0.012 - t * (0.8 + layer * 0.1) + layer * 2.4) * 4.5 * amp;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = layer % 2 ? rgba(o.waveA || '#14384a', 0.5) : rgba(o.waveB || '#0d2a38', 0.62);
    ctx.fill();
    if (layer === 0) {
      ctx.strokeStyle = o.line || 'rgba(140,220,236,0.22)'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  // 月光倒影
  if (o.reflect) {
    const [rx, ra] = o.reflect;
    for (let i = 0; i < 26; i++) {
      const y = hz + 20 + i * 11;
      const w = (60 - i * 1.6) * (0.5 + rnd(i, 9) * 0.9);
      const x = rx + Math.sin(t * 1.1 + i) * (8 + i * 1.6);
      ctx.globalAlpha = ra * (1 - i / 30) * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.4 + i * 0.7)));
      ctx.fillStyle = o.moonCol || '#ffe9b8';
      ctx.fillRect(x - w / 2, y, w, 2.2);
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
export function hill(ctx, y, color, o = {}) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(0, y);
  for (let x = 0; x <= W; x += 16) {
    const yy = y - Math.sin(x * 0.0016 + (o.ph || 0)) * 60 * (o.amp || 1) - Math.sin(x * 0.0043 + 2) * 24 * (o.amp || 1);
    ctx.lineTo(x, yy);
  }
  ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
}
// 光柱 / 体积光
export function shaft(ctx, x, w, color, a = 0.18, angle = 0.12) {
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, 0); ctx.rotate(angle);
  ctx.fillStyle = lin(ctx, 0, 0, 0, H, [[0, rgba(color, 0.85)], [1, rgba(color, 0)]]);
  ctx.beginPath(); ctx.moveTo(-w / 2, -100); ctx.lineTo(w / 2, -100); ctx.lineTo(w * 1.6, H + 100); ctx.lineTo(-w * 1.6, H + 100); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function dust(ctx, t, n = 60, o = {}) {
  const col = o.color || '#f2e7d3';
  for (let i = 0; i < n; i++) {
    const sp = 8 + rnd(i, 22) * 26;
    const x = (rnd(i, 21) * W + t * sp * 0.35) % W;
    const y = (rnd(i, 23) * H - t * sp) % H;
    const yy = y < 0 ? y + H : y;
    const a = (o.a == null ? 0.5 : o.a) * (0.15 + rnd(i, 24) * 0.5) * (0.6 + 0.4 * Math.sin(t + i));
    ctx.globalAlpha = a; ctx.fillStyle = col;
    const s = 1 + rnd(i, 25) * 2.4;
    ctx.fillRect(x, yy, s, s);
  }
  ctx.globalAlpha = 1;
}
// 雾：横向柔和渐变，带漂移
export function fog(ctx, t, o = {}) {
  ctx.save();
  for (let i = 0; i < 3; i++) {
    const y = (o.y == null ? 700 : o.y) + i * 40;
    const x = W / 2 + Math.sin(t * 0.12 + i) * 200;
    ctx.globalAlpha = (o.a == null ? 0.16 : o.a) * (1 - i * 0.22);
    ctx.fillStyle = rad(ctx, x, y, 780, [[0, rgba(o.color || '#9fd3dd', 0.55)], [1, rgba(o.color || '#9fd3dd', 0)]]);
    ctx.fillRect(0, y - 400, W, 800);
  }
  ctx.restore();
}
// 人物立绘：x 为脚底中心，h 为高度
export function sprite(ctx, img, x, feet, h, o = {}) {
  if (!img) return false;
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.002) return false;
  const s = h / img.height, w = img.width * s;
  const bob = o.bob == null ? Math.sin((o.t || 0) * 1.15 + (o.ph || 0)) * 4 : o.bob;
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.translate(x, feet + bob);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(img, -w / 2, -h, w, h);
  ctx.restore();
  return true;
}
export function groundShadow(ctx, x, y, w, a = 0.32) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#02070a';
  ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.17, 0, 0, TAU); ctx.fill(); ctx.restore();
}
/* 纸：暖白底 + 纤维 + 横线 */
export function paperBg(ctx, t, o = {}) {
  const c1 = o.c1 || '#efe3cc', c2 = o.c2 || '#ddc9a8';
  const g = rad(ctx, o.lx || W * 0.3, o.ly || H * 0.3, 1400, [[0, c1], [1, c2]]);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.1;
  for (let i = 0; i < 120; i++) {
    ctx.fillStyle = rnd(i, 31) > 0.5 ? '#7a6a52' : '#fffaf0';
    ctx.fillRect(rnd(i, 32) * W, rnd(i, 33) * H, 1 + rnd(i, 34) * 26, 1);
  }
  ctx.restore();
  if (o.rules) {
    ctx.save(); ctx.globalAlpha = 0.2; ctx.strokeStyle = '#6a5c48'; ctx.lineWidth = 1;
    for (let y = o.rules[0]; y < H; y += o.rules[1]) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    ctx.restore();
  }
}
/* 对话窗口 */
export function chatWin(ctx, x, y, w, h, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.shadowColor = rgba(o.glow || '#7fd7e8', 0.4); ctx.shadowBlur = o.blur || 40;
  ctx.fillStyle = o.bg || 'rgba(9,20,28,0.92)';
  rrect(ctx, x - w / 2, y - h / 2, w, h, o.r || 26); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = o.line || 'rgba(127,215,232,0.4)'; ctx.lineWidth = 1.6; ctx.stroke();
  // 顶部三个点
  if (o.dots !== false) for (let i = 0; i < 3; i++) dot(ctx, x - w / 2 + 26 + i * 16, y - h / 2 + 22, 4, i === 0 ? '#ff7a6a' : i === 1 ? '#ffc883' : '#7fd7e8', 0.7);
  ctx.restore();
}
export function bubble(ctx, x, y, w, h, str, o = {}) {
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = o.bg || (o.me ? 'rgba(232,184,106,0.92)' : 'rgba(24,44,54,0.95)');
  rrect(ctx, x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  if (o.line) { ctx.strokeStyle = o.line; ctx.lineWidth = 1.4; ctx.stroke(); }
  text(ctx, str, x, y, { size: o.size || 34, color: o.fg || (o.me ? '#1a1208' : '#eaf3f5'), align: 'center', weight: 500, fam: SANS, ls: 1 });
  ctx.restore();
}
/* 打字机光标 */
export function caret(ctx, x, y, h, t, color = '#e8b86a', w = 3, on = true) {
  const blink = Math.sin(t * 5.2) > 0 ? 1 : 0.15;
  ctx.save(); ctx.globalAlpha = (on ? 1 : 0) * blink; ctx.fillStyle = color;
  ctx.fillRect(x, y - h / 2, w, h); ctx.restore();
}

/* ---------------- 歌词字与时间对齐 ---------------- */
const PSET = '“”"「」『』（）()，,。.！!？?、…—·：:；;~～';
export function alignChars(text, times) {
  const chars = [...text];
  const sung = [];
  chars.forEach((c, i) => { if (!' \u3000'.includes(c) && !PSET.includes(c)) sung.push(i); });
  const out = chars.map(() => null);
  const m = times ? times.length : 0;
  if (m && sung.length) {
    if (m === sung.length) sung.forEach((ci, k) => { out[ci] = times[k]; });
    else sung.forEach((ci, k) => { out[ci] = times[Math.min(m - 1, Math.round(k * (m - 1) / Math.max(1, sung.length - 1)))]; });
  }
  for (let i = 1; i < out.length; i++) if (out[i] == null && !' \u3000'.includes(chars[i])) out[i] = out[i - 1];
  return { chars, times: out };
}

/* =====================================================================================
   原版美术语言（照 world/src 的 lib.js、fx.js、scenes2.js 的做法重写）：
   奶油纸 + 印刷网点 + 放射线 + 描边大字 + 大立绘，全部 Canvas 2D，浏览器 / Node 双用。
   ===================================================================================== */
export const PAL = {
  paper: '#F5EDDD', paper2: '#EBDFC8', cream: '#FFF6E3', white: '#FFFDF6',
  ink: '#2B2320', inkSoft: '#6B5F57', orange: '#EE7A2E', orangeD: '#D2561A', peach: '#FBD9B8', yellow: '#F8C65A',
  green: '#17835A', mint: '#A6E3C8', blue: '#2D4FA3', cyan: '#58C4F0', navy: '#16213E', night: '#1C1922',
  lavender: '#C9B8FF', dawn: '#FFD9A0', dusk: '#7B6FB0',
};

export function mkCanvas(w, h) {
  const el = document.createElement('canvas');
  el.width = Math.max(1, Math.round(w)); el.height = Math.max(1, Math.round(h));
  return el;
}
export function makeLayers(ss = 1) {
  const scene = mkCanvas(W * ss, H * ss), acc = mkCanvas(W * ss, H * ss), tmp = mkCanvas(W * ss, H * ss);
  const small = mkCanvas(W * ss / 4, H * ss / 4);
  return { ss, scene, sctx: scene.getContext('2d'), acc, actx: acc.getContext('2d'), tmp, tctx: tmp.getContext('2d'), small, smctx: small.getContext('2d') };
}
export function resetCtx(c, ss = 1) {
  c.setTransform(ss, 0, 0, ss, 0, 0);
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0;
  c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.setLineDash([]);
  if ('filter' in c) c.filter = 'none';
  if ('letterSpacing' in c) c.letterSpacing = '0px';
}

/* ---------- 纸：奶油色、纤维、斑驳、打光（只用一次 drawImage） ---------- */
let PAPER_TEX = null, PAPER_SS = 0;
export function paperCard(ctx, o = {}) {
  const ss = o.ss || 1;
  if (!PAPER_TEX || PAPER_SS !== Math.min(2, Math.max(0.5, ss))) {
    const c = mkCanvas(W * ss, H * ss), x = c.getContext('2d');
    x.scale(ss, ss);
    x.fillStyle = '#fff'; x.fillRect(0, 0, W, H);
    for (let i = 0; i < 40; i++) {
      const px = rnd(i, 921) * W, py = rnd(i, 922) * H, r = 180 + rnd(i, 923) * 460;
      const g = x.createRadialGradient(px, py, 0, px, py, r);
      g.addColorStop(0, `rgba(150,110,60,${0.025 + rnd(i, 924) * 0.04})`); g.addColorStop(1, 'rgba(150,110,60,0)');
      x.fillStyle = g; x.fillRect(px - r, py - r, r * 2, r * 2);
    }
    x.lineCap = 'round';
    for (let i = 0; i < 2400; i++) {
      const px = rnd(i, 901) * W, py = rnd(i, 902) * H, an = rnd(i, 903) * TAU, len = 10 + rnd(i, 904) * 70;
      x.strokeStyle = `rgba(120,88,48,${0.02 + rnd(i, 905) * 0.05})`; x.lineWidth = 0.6 + rnd(i, 906) * 1.3;
      x.beginPath(); x.moveTo(px, py);
      x.quadraticCurveTo(px + Math.cos(an) * len / 2 + (rnd(i, 907) - 0.5) * 18, py + Math.sin(an) * len / 2 + (rnd(i, 908) - 0.5) * 18, px + Math.cos(an) * len, py + Math.sin(an) * len);
      x.stroke();
    }
    for (let i = 0; i < 4200; i++) { x.fillStyle = `rgba(110,80,40,${0.03 + rnd(i, 911) * 0.06})`; x.fillRect(rnd(i, 912) * W, rnd(i, 913) * H, 1 + rnd(i, 914) * 2, 1 + rnd(i, 915) * 2); }
    PAPER_TEX = c; PAPER_SS = ss;
  }
  ctx.save();
  ctx.fillStyle = o.color || PAL.paper; ctx.fillRect(-40, -40, W + 80, H + 80);
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.tex == null ? 0.55 : o.tex;
  ctx.drawImage(PAPER_TEX, 0, 0, W, H); ctx.restore();
  if (o.light !== false) {
    ctx.save(); ctx.globalCompositeOperation = 'soft-light';
    const g = ctx.createRadialGradient(o.lx == null ? 300 : o.lx, o.ly == null ? -100 : o.ly, 60, o.lx == null ? 300 : o.lx, 100, 1800);
    g.addColorStop(0, 'rgba(255,246,224,0.65)'); g.addColorStop(0.45, 'rgba(255,246,224,0.0)'); g.addColorStop(1, 'rgba(80,45,20,0.30)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
}

/* ---------- 放射线（原版副歌背景） ---------- */
export function sunnyRays(ctx, o = {}) {
  const cx = o.cx == null ? W / 2 : o.cx, cy = o.cy == null ? H * 0.52 : o.cy;
  const n = o.n || 22, a = o.a == null ? 0.55 : o.a, R = 2400;
  ctx.save(); ctx.globalAlpha = a;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * TAU + (o.rot || 0) + (o.t || 0) * 0.02;
    const a1 = ((i + 1) / n) * TAU + (o.rot || 0) + (o.t || 0) * 0.02;
    ctx.fillStyle = i % 2 ? (o.a1 || rgba(PAL.peach, 0.55)) : (o.a0 || 'rgba(255,252,242,0.4)');
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a0, a1); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/* ---------- 半调网点（烘一张小图当 pattern，不逐点画） ---------- */
let DOT_TEX = null;
function dotTile() {
  if (DOT_TEX) return DOT_TEX;
  const c = mkCanvas(48, 48), x = c.getContext('2d');
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const px = i * 12 + (j % 2 ? 6 : 0), py = j * 12 + 6;
    x.fillStyle = '#000'; x.beginPath(); x.arc(px, py, 2.6, 0, TAU); x.fill();
  }
  DOT_TEX = c; return c;
}
export function halftone(ctx, x, y, w, h, o = {}) {
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  if (o.rot) { ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot); ctx.translate(-x - w / 2, -y - h / 2); }
  const pat = ctx.createPattern(dotTile(), 'repeat');
  if (pat) {
    const k = (o.step || 12) / 12;
    if (pat.setTransform) { try { pat.setTransform(new DOMMatrix().scale(k, k)); } catch (e) { } }
    ctx.globalAlpha = o.a == null ? 0.16 : o.a;
    ctx.fillStyle = o.color || PAL.ink;
    ctx.fillRect(x - 200, y - 200, w + 400, h + 400);
  }
  ctx.restore();
}

/* ---------- 描边大字：白边 + 填色 + 投影，逐字微旋转/起拱（原版标题） ---------- */
export function displayText(ctx, str, x, y, size, o = {}) {
  if (!str) return;
  const chars = [...str];
  const weight = o.weight == null ? 800 : o.weight;
  const ls = o.ls == null ? size * 0.02 : o.ls;
  ctx.save(); ctx.font = font(size, weight, SERIF);
  const widths = chars.map(ch => ctx.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + ls * (chars.length - 1);
  ctx.restore();
  let cx = o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2;
  const mid = total / 2;
  let acc = 0;
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = font(size, weight, SERIF);
  chars.forEach((ch, i) => {
    const cw = widths[i];
    const u = ((acc + cw / 2) - mid) / (mid || 1);
    const arc = (o.arc || 0) * (1 - u * u);
    const rot = (o.tilt || 0) * u + (o.jitter ? (rnd(i, o.seed || 3) - 0.5) * o.jitter : 0);
    const px = cx + acc + cw / 2, py = y - arc;
    const ap = o.pop ? E.back(clamp(o.pop)) : 1;
    const a = (o.alpha == null ? 1 : o.alpha) * (o.stagger ? clamp((o.stagger - i * 0.06) * 2.2, 0, 1) : 1);
    if (a <= 0.002 || ch === ' ') { acc += cw + ls; return; }
    ctx.save(); ctx.translate(px, py); ctx.rotate(rot); ctx.scale(ap, ap); ctx.globalAlpha = a;
    if (o.shadow !== false) {
      ctx.fillStyle = o.shadowColor || 'rgba(70,40,15,0.20)';
      ctx.fillText(ch, (o.sdx == null ? 5 : o.sdx), (o.sdy == null ? 9 : o.sdy));
    }
    if (o.edge !== false) {
      ctx.strokeStyle = o.edgeColor || PAL.cream; ctx.lineWidth = o.edgeW == null ? size * 0.14 : o.edgeW;
      ctx.strokeText(ch, 0, 0);
    }
    ctx.fillStyle = o.color || PAL.orange;
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    acc += cw + ls;
  });
  ctx.restore();
  return total;
}

/* ---------- 地面色块 / 远山 ---------- */
export function groundBand(ctx, y, color, o = {}) {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-20, H + 20); ctx.lineTo(-20, y);
  for (let x = -20; x <= W + 20; x += 20) {
    ctx.lineTo(x, y + Math.sin(x * 0.0035 + (o.ph || 0)) * (o.amp == null ? 16 : o.amp) + Math.sin(x * 0.011 + 1.7) * (o.amp2 == null ? 6 : o.amp2));
  }
  ctx.lineTo(W + 20, H + 20); ctx.closePath(); ctx.fill(); ctx.restore();
}
export function hills(ctx, y, color, o = {}) {
  ctx.save(); ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(-20, H + 20); ctx.lineTo(-20, y);
  for (let x = -20; x <= W + 20; x += 18) {
    ctx.lineTo(x, y - Math.abs(Math.sin(x * 0.0022 + (o.ph || 0))) * (o.amp || 90) - Math.sin(x * 0.0051 + 2) * 20);
  }
  ctx.lineTo(W + 20, H + 20); ctx.closePath(); ctx.fill(); ctx.restore();
}

/* ---------- 彩纸屑 ---------- */
export function confetti(ctx, t, o = {}) {
  const n = o.n || 60, cols = o.colors || [PAL.orange, PAL.blue, PAL.green, PAL.yellow, PAL.cream];
  for (let i = 0; i < n; i++) {
    const sp = 40 + rnd(i, 3) * 160;
    const x = ((rnd(i, 1) * (W + 200) + t * sp * (rnd(i, 4) - 0.5)) % (W + 200) + W + 200) % (W + 200) - 100;
    const y = ((rnd(i, 2) * (H + 200) + t * sp) % (H + 200)) - 100;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + rnd(i, 5) * 3) + i);
    ctx.globalAlpha = o.a == null ? 0.85 : o.a; ctx.fillStyle = cols[i % cols.length];
    ctx.fillRect(-5, -8, 10, 16); ctx.restore();
  }
}

/* ---------- 立绘（原版贴图 + 呼吸 / 眨眼 / 投影） ---------- */
export function autoBlink(t, seed = 1) {
  const P = 3.3, n = Math.floor(t / P), dt = t - (n * P + 0.4 + rnd(n, seed) * 1.9);
  if (dt < 0 || dt > 0.26) return 0;
  return dt < 0.07 ? dt / 0.07 : dt < 0.12 ? 1 : 1 - (dt - 0.12) / 0.14;
}
export async function loadSprites(base, ids, o = {}) {
  const man = await (await fetch(base + 'manifest.json')).json();
  const CH = { man, img: {}, base };
  const load = (id) => new Promise((res) => {
    const im = new Image();
    const cands = [base + id + (o.ext || '.png'), base + id + '.webp', base + id + '.png'];
    let k = 0;
    im.onload = () => { CH.img[id] = im; res(); };
    im.onerror = () => { k++; if (k < cands.length) im.src = cands[k]; else res(); };
    im.src = cands[0];
  });
  await Promise.all(ids.filter(id => man[id]).map(load));
  return CH;
}
export function charSprite(ctx, CH, id, x, feet, h, o = {}) {
  const m = CH && CH.man && CH.man[id]; const img = CH && CH.img && CH.img[id];
  if (!m || !img) return;
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.004) return;
  const k = h / (m.feetY - m.top);
  const fx = m.feetXo == null ? m.feetX : m.feetXo;
  const t = o.t || 0;
  const bob = (o.bob == null ? Math.sin(t * 1.15 + (o.ph || 0)) * 3.2 : o.bob) + (o.lift || 0);
  const tilt = (o.tilt || 0) + Math.sin(t * 0.9 + (o.ph || 0)) * 0.006;
  ctx.save();
  if (o.shadow !== false) {
    ctx.globalAlpha = a * (o.shadowA == null ? 0.2 : o.shadowA);
    ctx.fillStyle = o.shadowColor || 'rgba(70,45,20,0.55)';
    ctx.beginPath(); ctx.ellipse(x, feet + 2, h * 0.2, h * 0.032, 0, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = a;
  ctx.translate(x, feet - bob);
  ctx.rotate(tilt);
  const sx = (o.sx == null ? 1 : o.sx) * (o.flip ? -1 : 1);
  ctx.scale(sx * (o.scale == null ? 1 : o.scale), (o.sy == null ? 1 : o.sy) * (o.scale == null ? 1 : o.scale));
  ctx.drawImage(img, -fx * k, -m.feetY * k, m.w * k, m.h * k);
  const blink = o.blink == null ? autoBlink(t, id.charCodeAt(0)) : o.blink;
  if (blink > 0.02 && m.eyes && m.eyes.length) {
    const skin = m.skin ? `rgb(${m.skin[0]},${m.skin[1]},${m.skin[2]})` : '#FBF1E4';
    const ink = m.ink ? `rgb(${m.ink[0]},${m.ink[1]},${m.ink[2]})` : '#2B2320';
    for (const [ex, ey, rx, ry] of m.eyes) {
      const cx = (-fx + ex) * k, cy = (-m.feetY + ey) * k;
      ctx.save();
      ctx.beginPath(); ctx.rect(cx - rx * k * 1.5, cy - ry * k * 1.5, rx * k * 3, ry * k * 3); ctx.clip();
      const lidY = cy - ry * k + 2 * ry * k * blink;
      ctx.fillStyle = skin; ctx.fillRect(cx - rx * k * 1.5, cy - ry * k * 1.4, rx * k * 3, Math.max(0, lidY - (cy - ry * k * 1.4)));
      ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1, 2.6 * k); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - rx * k, lidY); ctx.quadraticCurveTo(cx, lidY + ry * k * 0.32, cx + rx * k, lidY); ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ---------- 逐字字幕（原版做法：每个字有自己的时间） ---------- */
const PUNCT = new Set([...'　 ，。“”！？、']);
export function buildSubs(ctx, lines, o = {}) {
  const subs = [];
  ctx.save(); ctx.font = font(o.size || 44, o.weight || 600);
  for (const L of lines) {
    if (L.big) continue;
    const items = []; let k = 0;
    [...L.text].forEach((ch, i) => items.push({ ch, x: ctx.measureText(L.text.slice(0, i)).width, t: PUNCT.has(ch) ? null : (L.t || [])[k++] }));
    items.forEach((it, i) => {
      if (it.t !== null) return;
      const prev = items.slice(0, i).reverse().find(q => q.t !== null);
      const next = items.slice(i + 1).find(q => q.t !== null);
      it.t = (it.ch === '“' || !prev) ? (next && next.t) : prev.t;
    });
    const last = (L.t || [L.s])[L.t ? L.t.length - 1 : 0];
    subs.push({ items: items.filter(it => it.ch !== '　' && it.ch !== ' '), full: ctx.measureText(L.text).width, s: L.t ? L.t[0] : L.s, end: L.end == null ? last + 0.95 : L.end, who: L.who });
  }
  ctx.restore();
  return subs;
}
export function drawSubs(ctx, subs, T, o = {}) {
  for (const L of subs) {
    if (T < L.s - 0.1 || T > L.end) continue;
    const fade = 1 - sat(T, L.end - 0.22, L.end);
    const dark = o.dark;
    const x0 = W / 2 - L.full / 2, y = o.y || 1004;
    ctx.save();
    ctx.globalAlpha = fade * 0.72; ctx.fillStyle = dark ? 'rgba(10,14,20,0.55)' : 'rgba(255,250,238,0.78)';
    rrect(ctx, x0 - 54, y - 36, L.full + 108, 72, 36); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = font(o.size || 44, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 7;
    ctx.strokeStyle = dark ? 'rgba(255,250,238,0.55)' : 'rgba(255,252,244,0.92)';
    ctx.fillStyle = dark ? PAL.cream : PAL.ink;
    for (const it of L.items) {
      if (T < it.t - 0.05) continue;
      ctx.globalAlpha = sat(T, it.t - 0.05, it.t + 0.05) * fade;
      const dy = (1 - E.out(sat(T, it.t - 0.05, it.t + 0.12))) * 9;
      ctx.fillText(it.ch, x0 + it.x, y + dy);
    }
    ctx.restore();
  }
}

/* ---------- 转场 ---------- */
export function pageFlipWipe(ctx, p, drawOld, drawNew, layers) {
  const L = layers, tctx = L.tctx;
  resetCtx(tctx, L.ss || 1);
  // 新页整幅画到临时层，旧页直接画在主层，再按斜折线裁剪叠上
  tctx.clearRect(0, 0, W, H); tctx.save(); drawNew(tctx); tctx.restore();
  drawOld(ctx);
  const e = E.io(clamp(p)), xf = lerp(W + 260, -420, e), sl = 150;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(xf + sl, 0); ctx.lineTo(W + 10, 0); ctx.lineTo(W + 10, H); ctx.lineTo(xf - sl, H); ctx.closePath(); ctx.clip();
  ctx.drawImage(L.tmp, 0, 0, W, H);
  const sh = ctx.createLinearGradient(xf - sl, 0, xf - sl + 200, 0);
  sh.addColorStop(0, 'rgba(40,25,10,0.30)'); sh.addColorStop(1, 'rgba(40,25,10,0)');
  ctx.fillStyle = sh; ctx.fillRect(xf - sl, 0, 220, H);
  ctx.restore();
  const cw = 260 * Math.sin(Math.PI * clamp(p)) + 24;
  ctx.save();
  ctx.beginPath(); ctx.moveTo(xf + sl - cw, 0); ctx.lineTo(xf + sl, 0); ctx.lineTo(xf - sl, H); ctx.lineTo(xf - sl - cw, H); ctx.closePath();
  const gc = ctx.createLinearGradient(xf - cw, 0, xf, 0);
  gc.addColorStop(0, '#D9CBB0'); gc.addColorStop(0.55, '#FFFDF6'); gc.addColorStop(1, '#E6DAC2');
  ctx.fillStyle = gc; ctx.fill(); ctx.restore();
}
export function inkWipeClip(ctx, p, drawOld, drawNew) {
  drawOld(ctx);
  ctx.save();
  ctx.beginPath(); ctx.moveTo(-20, -20); ctx.lineTo(W + 20, -20);
  for (let x = W + 20; x >= -20; x -= 24) ctx.lineTo(x, lerp(-180, H + 180, E.io(p)) + Math.sin(x * 0.006 + 1) * 90 + Math.sin(x * 0.021) * 26);
  ctx.closePath(); ctx.clip(); drawNew(ctx); ctx.restore();
}

/* ---------- 逐帧播放器（运动模糊 / bloom / 字幕 / 固定步长由 mv-player 管） ---------- */
export function createSeek({ canvas, ss, cuts, dark = [], bright = [], subs, subStyle = {}, endFade = true, layers, offset = 0, mapT }) {
  const out = canvas.getContext('2d');
  const L = layers || makeLayers(ss);
  const BLOOM = t => (dark.some(([a, b]) => t >= a && t < b) ? 0.34 : bright.some(([a, b]) => t >= a && t < b) ? 0.10 : 0.07);
  const songTime = tv => (mapT ? mapT(tv) : tv + offset);
  function segAt(t) { let i = 0; while (i + 1 < cuts.length && cuts[i + 1][0] <= t) i++; return i; }
  function seek(tv, q) {
    tv = clamp(tv, 0, window.DUR - 1e-3);
    const T = songTime(tv);
    const S = Math.max(1, Math.round(q || 1));
    const i = segAt(T), a = cuts[i][0], b = (cuts[i + 1] ? cuts[i + 1][0] : 1e9) - 1e-4;
    let src;
    if (S === 1) {
      resetCtx(out, ss); out.clearRect(0, 0, W, H);
      out.save(); cuts[i][1](out, clamp(T, a, b)); out.restore();
      src = canvas;
    } else {
      resetCtx(L.actx, ss); L.actx.clearRect(0, 0, W, H);
      for (let s = 0; s < S; s++) {
        const ts = clamp(T + ((s + 0.5) / S - 0.5) * (0.5 / 60), a, b);
        resetCtx(L.sctx, ss); L.sctx.clearRect(0, 0, W, H);
        L.sctx.save(); cuts[i][1](L.sctx, ts); L.sctx.restore();
        L.actx.globalAlpha = 1 / (s + 1); L.actx.drawImage(L.scene, 0, 0, W, H);
      }
      resetCtx(out, ss); out.drawImage(L.acc, 0, 0, W, H);
      src = L.acc;
    }
    L.smctx.setTransform(1, 0, 0, 1, 0, 0);
    L.smctx.clearRect(0, 0, L.small.width, L.small.height);
    L.smctx.globalAlpha = 0.85; L.smctx.drawImage(src, 0, 0, L.small.width, L.small.height);
    resetCtx(out, ss); out.globalCompositeOperation = 'screen'; out.globalAlpha = BLOOM(T); out.drawImage(L.small, 0, 0, W, H);
    resetCtx(out, ss);
    if (subs && !subStyle.clean) drawSubs(out, subs, T, { dark: dark.some(([a, b]) => T >= a && T < b), ...subStyle });
    if (endFade && tv > window.DUR - 1.2) { out.fillStyle = rgba(PAL.paper, sat(tv, window.DUR - 1.2, window.DUR - 0.05)); out.fillRect(0, 0, W, H); }
  }
  return { seek, layers: L };
}
