// 《世界还在写 · 墨海版》—— 模仿版
// 同一首歌；画面是另起一套「墨 / 海 / 页」的视觉，不沿用原版分镜。
// 人物贴图直接取原版小伙伴ko 的角色，未改画；只做位置、缩放与轻微浮动。
import {
  W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, COL, rgba, mix, paper, grain,
  rrect, font, text, measure, glyph, drawGlyph, flower, pulse, beatAt, setBeats
} from '../../world/src/lib.js';

const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
const OFF = 14.35;                       // 与原版一致：从第一句唱词开始
const canvas = document.getElementById('c');
const out = canvas.getContext('2d');
const bufCv = new OffscreenCanvas(W * SS, H * SS);
const buf = bufCv.getContext('2d');
canvas.width = W * SS; canvas.height = H * SS;
window.FPS = Number(Q.get('fps') || 60);
const DYN_ON = (() => { try { const v = localStorage.getItem('mv-dynres'); return v === null ? true : v === '1'; } catch (e) { return true; } })();

const SKY0 = '#050c14', SKY1 = '#0b2230', INK = '#07131c', INK2 = '#0d1f2b';
const PAPER = '#f2e7d3', PAPER2 = '#e5d5b9', GOLD = '#e8b86a', CYAN = '#7fd7e8', CORAL = '#ff7a4d';
const CREAM = '#fff6e3';

let TL = null, LY = null, LINES = [];
const IMG = {};
const NEED = ['o10', 'o24', 'o20', 'o05', 'k07', 'k09', 'f00', 'f05', 'f21'];

function loadImg(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im);
    im.onerror = () => rej(new Error(src));
    im.src = src;
  });
}
async function loadAll() {
  await Promise.all(NEED.map(async (k) => { IMG[k] = await loadImg('/mv/world/assets/chars/' + k + '.png'); }));
  const f1 = new FontFace('Noto Serif SC', 'url(/mv/world/fonts/NotoSerifSC-VF.ttf)', { weight: '200 900' });
  const f2 = new FontFace('Noto Sans SC', 'url(/mv/world/fonts/NotoSansSC-VF.ttf)', { weight: '100 900' });
  await Promise.all([f1.load(), f2.load()]); document.fonts.add(f1); document.fonts.add(f2);
  TL = await (await fetch('/mv/world/analysis/timeline_full.json')).json();
  LY = await (await fetch('/mv/world/analysis/lyrics_full.json')).json();
  setBeats(TL.beats);
  window.DUR = TL.duration - OFF;
  buildLyrics();
}

/* ---------------- 字幕 ---------------- */
function buildLyrics() {
  LINES = [];
  const ctx = out;
  ctx.save(); ctx.font = font(42, 600);
  LY.lines.forEach((L, li) => {
    const prev = LINES[LINES.length - 1];
    const end = Math.min((L.t[L.t.length - 1] || 0) + 1.15, (LY.lines[li + 1] ? LY.lines[li + 1].t[0] - 0.08 : 1e9));
    LINES.push({ text: L.text, t: L.t.slice(), big: !!L.big, s: L.t[0], e: end });
  });
  ctx.restore();
}

function drawLyric(ctx, songT) {
  let line = null;
  for (const L of LINES) {
    if (songT >= L.s - 0.12 && songT <= L.e) { line = L; break; }
  }
  if (!line || line.big) return;
  const chars = [...line.text];
  const shown = chars.map((ch, i) => ({ ch, t: line.t[i] != null ? line.t[i] : line.s })).filter(o => o.ch !== '\u3000' && o.ch !== ' ');
  const full = measure(ctx, line.text.replace(/\u3000/g, ' '), 42, 600);
  const outA = 1 - sat(songT, line.e - 0.3, line.e);
  const a = sat(songT, line.s - 0.1, line.s + 0.12) * outA;
  if (a <= 0.002) return;
  const x0 = W / 2 - full / 2, y = 1000;
  ctx.save();
  ctx.globalAlpha = 0.72 * a;
  ctx.fillStyle = 'rgba(3,9,14,0.45)';
  rrect(ctx, x0 - 54, y - 42, full + 108, 84, 42); ctx.fill();
  ctx.globalAlpha = a;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = font(42, 600); ctx.letterSpacing = '0px';
  let x = x0;
  for (const o of shown) {
    const on = songT >= o.t - 0.04;
    ctx.fillStyle = on ? GOLD : 'rgba(242,231,211,0.86)';
    ctx.globalAlpha = a * (on ? 1 : 0.55);
    ctx.fillText(o.ch, x, y);
    x += ctx.measureText(o.ch).width;
  }
  ctx.restore();
}

function drawBigLyric(ctx, songT) {
  for (const L of LINES) {
    if (!L.big) continue;
    const a = sat(songT, L.s - 0.08, L.s + 0.22) * (1 - sat(songT, L.e - 0.25, L.e + 0.05));
    if (a <= 0.002) continue;
    const sc = 1 + 0.035 * Math.sin((songT - L.s) * 1.8);
    ctx.save();
    ctx.translate(W / 2, 350); ctx.scale(sc, sc);
    ctx.globalAlpha = a * 0.9;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = font(132, 600); ctx.letterSpacing = '18px';
    ctx.fillStyle = 'rgba(232,184,106,0.18)'; ctx.fillText(L.text, 0, 5);
    ctx.fillStyle = CREAM; ctx.fillText(L.text, 0, 0);
    ctx.restore();
  }
}

/* ---------------- 基础画面 ---------------- */
function bg(ctx, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function vignette(ctx, a = 0.42) {
  const g = ctx.createRadialGradient(W / 2, H * 0.46, H * 0.35, W / 2, H * 0.46, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${a})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function stars(ctx, t, alpha = 1, yMax = 700) {
  ctx.save();
  for (let i = 0; i < 150; i++) {
    const x = rnd(i, 1) * W, y = rnd(i, 2) * yMax;
    const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.6 + rnd(i, 3)) + rnd(i, 4) * 6));
    ctx.globalAlpha = alpha * tw * (0.25 + rnd(i, 5) * 0.75);
    ctx.fillStyle = rnd(i, 6) > 0.72 ? GOLD : '#d8f6ff';
    const s = 1 + rnd(i, 7) * 2.2;
    ctx.fillRect(x, y, s, s);
  }
  ctx.restore();
}
function moon(ctx, x, y, r, a = 1) {
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, r * 0.8, x, y, r * 4.2);
  g.addColorStop(0, 'rgba(255,246,227,0.24)'); g.addColorStop(1, 'rgba(255,246,227,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 4.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f5ecd9'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(220,200,160,0.22)'; ctx.beginPath(); ctx.arc(x - r * 0.26, y - r * 0.14, r * 0.17, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(x + r * 0.3, y + r * 0.22, r * 0.11, 0, TAU); ctx.fill();
  ctx.restore();
}
function sea(ctx, t, horizon = 720, tone = 0) {
  ctx.save();
  const g = ctx.createLinearGradient(0, horizon, 0, H);
  g.addColorStop(0, tone ? 'rgba(20,46,60,0.9)' : 'rgba(10,28,40,0.92)');
  g.addColorStop(1, '#030a10');
  ctx.fillStyle = g; ctx.fillRect(0, horizon, W, H - horizon);
  for (let layer = 0; layer < 4; layer++) {
    ctx.beginPath(); ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 24) {
      const y = horizon + 18 + layer * 62 + Math.sin(x * 0.005 + t * (0.6 + layer * 0.18) + layer) * (12 + layer * 8)
        + Math.sin(x * 0.013 - t * 0.9 + layer * 2) * 5;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = layer % 2 ? 'rgba(19,54,68,0.55)' : 'rgba(13,38,52,0.66)';
    ctx.fill();
    ctx.strokeStyle = layer === 0 ? 'rgba(127,215,232,0.22)' : 'rgba(232,184,106,0.08)';
    ctx.lineWidth = 1.2; ctx.stroke();
  }
  ctx.restore();
}
function sprite(ctx, key, x, feet, h, o = {}) {
  const im = IMG[key]; if (!im) return;
  const s = h / im.height, w = im.width * s;
  const a = o.a == null ? 1 : o.a;
  if (a <= 0.002) return;
  const bob = o.bob == null ? Math.sin((o.t || 0) * 1.25 + (o.ph || 0)) * 5 : o.bob;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.translate(x, feet + bob);
  if (o.rot) ctx.rotate(o.rot);
  if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(im, -w / 2, -h, w, h);
  ctx.restore();
}
function shadow(ctx, x, y, w, a = 0.3) {
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#02070a';
  ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.18, 0, 0, TAU); ctx.fill(); ctx.restore();
}
function bigTitle(ctx, str, x, y, size, color = CREAM, a = 1, ls = 0.16) {
  if (a <= 0.002) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.font = font(size, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.letterSpacing = (size * ls) + 'px';
  ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.fillText(str, x + 3, y + 5);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  ctx.restore();
}
function page(ctx, x, y, w, h, rot, fill, lines = true) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = fill || PAPER; rrect(ctx, -w / 2, -h / 2, w, h, 8); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (lines) {
    ctx.strokeStyle = 'rgba(40,60,70,0.2)'; ctx.lineWidth = 1;
    for (let i = 1; i < 7; i++) {
      const yy = -h / 2 + h * (i / 8);
      ctx.beginPath(); ctx.moveTo(-w * 0.38, yy); ctx.lineTo(w * 0.38, yy - 2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(232,184,106,0.72)'; ctx.fillRect(-w * 0.38, -h / 2 + 18, w * 0.3, 4);
  }
  ctx.restore();
}
function glyphs(ctx, t, list, n, alpha = 1, y0 = 0, y1 = H, size = 42) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const ch = list[i % list.length];
    const x = (rnd(i, 11) * W + t * (10 + rnd(i, 12) * 26)) % W;
    const y = y0 + ((rnd(i, 13) * (y1 - y0) + t * (8 + rnd(i, 14) * 22)) % (y1 - y0));
    const a = alpha * (0.1 + rnd(i, 15) * 0.35);
    drawGlyph(ctx, ch, x, y, size * (0.55 + rnd(i, 16) * 0.8), { color: rnd(i, 17) > 0.8 ? GOLD : CYAN, alpha: a, weight: 600 });
  }
  ctx.restore();
}
function butterfly(ctx, ch, x, y, s, a, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(232,184,106,0.42)';
  ctx.beginPath(); ctx.ellipse(-s * 0.7, 0, s * 0.66, s * 0.34, -0.5, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.ellipse(s * 0.7, 0, s * 0.66, s * 0.34, 0.5, 0, TAU); ctx.fill();
  drawGlyph(ctx, ch, 0, 0, s * 1.2, { color: CREAM, alpha: a });
  ctx.restore();
}

/* ---------------- 分镜 ---------------- */
function sTitle(ctx, t) {
  bg(ctx, '#040b12', '#0a1b26');
  stars(ctx, t, 1, 760);
  moon(ctx, 1450, 210, 92, 1);
  sea(ctx, t, 760, 0);
  glyphs(ctx, t, '世界还在写', 26, 0.7, 120, 900, 46);
  const p = E.out(sat(t, 1.2, 6.2));
  const chars = '世界还在写'.split('');
  for (let i = 0; i < chars.length; i++) {
    const a = sat(t, 1.6 + i * 0.55, 2.4 + i * 0.55);
    drawGlyph(ctx, chars[i], W / 2 + (i - 2) * 128, 430 + Math.sin(t + i) * 4, 112, { color: CREAM, alpha: a });
  }
  ctx.save(); ctx.globalAlpha = 0.5 * p;
  ctx.strokeStyle = 'rgba(232,184,106,0.6)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 300, 530); ctx.lineTo(W / 2 + 300, 530); ctx.stroke();
  text(ctx, 'A COVER BY 小黑  ·  同一首歌，另一片海', W / 2, 574, { size: 20, color: 'rgba(242,231,211,0.55)', fam: '"Noto Sans SC"', ls: 4 });
  ctx.restore();
  vignette(ctx, 0.46);
}

function sStroke(ctx, t) {
  paper(ctx, '#0a1720', 0.2);
  const g = ctx.createRadialGradient(1220, 560, 60, 1220, 560, 820);
  g.addColorStop(0, 'rgba(127,215,232,0.12)'); g.addColorStop(1, 'rgba(127,215,232,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 巨大的「海」作为字帖
  ctx.save(); ctx.globalAlpha = 0.16;
  drawGlyph(ctx, '海', 1180, 540, 760, { color: '#b9e7f0' });
  ctx.restore();
  // 三点水笔画
  ctx.save(); ctx.strokeStyle = CYAN; ctx.lineWidth = 9; ctx.lineCap = 'round';
  const p = E.io(sat(t, 0.6, 3.6));
  const pts = [[760, 280], [690, 400], [820, 500], [710, 640], [830, 740], [760, 860]];
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const q = sat(p, i * 0.28, i * 0.28 + 0.34);
    if (q <= 0) continue;
    const a = pts[i * 2], b = pts[i * 2 + 1];
    ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(a[0] - 40, (a[1] + b[1]) / 2, lerp(a[0], b[0], q), lerp(a[1], b[1], q));
  }
  ctx.stroke(); ctx.restore();
  glyphs(ctx, t, '三点水每', 38, 1, 60, 1020, 36);
  vignette(ctx, 0.42);
}

function sVerse1(ctx, t) {
  bg(ctx, '#07131d', '#0c2634');
  stars(ctx, t, 0.9, 660);
  moon(ctx, 320, 180, 62, 0.9);
  sea(ctx, t, 760, 0);
  glyphs(ctx, t, '海字开始写', 30, 1, 70, 980, 40);
  const a = sat(t, 0.2, 1.2);
  shadow(ctx, 1330, 1022, 250, 0.35);
  sprite(ctx, 'o10', 1340, 1020, 760, { a, t, ph: 0.4, bob: Math.sin(t * 1.1) * 6 });
  // 手写的「海」漂浮
  ctx.save(); ctx.globalAlpha = 0.22 * sat(t, 1.4, 3.2);
  drawGlyph(ctx, '海', 560, 600, 420, { color: CYAN });
  ctx.restore();
  vignette(ctx, 0.4);
}

function sWater(ctx, t) {
  bg(ctx, '#03121a', '#0a2838');
  // 水面
  ctx.fillStyle = 'rgba(22,74,92,0.38)';
  for (let i = 0; i < 18; i++) {
    const y = 260 + i * 44;
    ctx.fillRect(0, y, W, 2 + (i % 3));
  }
  sea(ctx, t, 650, 1);
  glyphs(ctx, t, '蓝每水', 40, 1, 80, 900, 34);
  const a = sat(t, 0.1, 1.1);
  shadow(ctx, 560, 1022, 230, 0.3);
  sprite(ctx, 'o10', 560, 1020, 720, { a, t, ph: 2.1, flip: true, bob: Math.sin(t * 1.3) * 7 });
  ctx.save(); ctx.globalAlpha = 0.38 * sat(t, 1.0, 3.0);
  bigTitle(ctx, '三点水', 1180, 500, 150, 'rgba(127,215,232,0.5)', 1, 0.2);
  ctx.restore();
  vignette(ctx, 0.44);
}

function sShoes(ctx, t) {
  bg(ctx, '#071118', '#12303a');
  moon(ctx, 1500, 180, 58, 0.6);
  sea(ctx, t, 690, 0);
  // 湿掉的纸 / 沙
  ctx.fillStyle = 'rgba(10,20,24,0.65)'; ctx.fillRect(0, 850, W, 230);
  for (let i = 0; i < 40; i++) {
    ctx.globalAlpha = 0.08 + rnd(i, 30) * 0.16; ctx.fillStyle = rnd(i, 31) > 0.5 ? GOLD : CYAN;
    ctx.fillRect(rnd(i, 32) * W, 870 + rnd(i, 33) * 180, 2 + rnd(i, 34) * 5, 1);
  }
  glyphs(ctx, t, '湿过鞋没有一个', 26, 0.8, 80, 760, 34);
  const a = sat(t, 0.1, 1.0);
  shadow(ctx, 1000, 1000, 300, 0.4);
  sprite(ctx, 'o20', 1000, 1000, 620, { a, t, ph: 1.2, bob: Math.sin(t * 0.9) * 3 });
  ctx.save(); ctx.globalAlpha = 0.3 * sat(t, 1.5, 3.5);
  bigTitle(ctx, '湿', 1500, 640, 180, 'rgba(127,215,232,0.55)');
  ctx.restore();
  vignette(ctx, 0.48);
}

function sNight(ctx, t) {
  bg(ctx, '#02070c', '#08131b');
  stars(ctx, t, 1, 820);
  moon(ctx, 1600, 170, 54, 0.55);
  // 夜景中的大书页
  page(ctx, 1140, 560, 620, 460, -0.1, 'rgba(18,30,36,0.9)', false);
  ctx.save(); ctx.globalAlpha = 0.25; drawGlyph(ctx, '夜', 1140, 560, 300, { color: CYAN }); ctx.restore();
  glyphs(ctx, t, '在吗两个字落在黑夜', 34, 1, 80, 900, 32);
  const a = sat(t, 0.2, 1.3) * (0.8 + 0.2 * Math.sin(t * 2));
  // 消息气泡
  ctx.save(); ctx.globalAlpha = a; ctx.translate(1280, 360);
  ctx.fillStyle = 'rgba(20,40,50,0.92)'; rrect(ctx, -200, -56, 400, 112, 40); ctx.fill();
  ctx.strokeStyle = 'rgba(127,215,232,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.fillStyle = CREAM; ctx.font = font(48, 600); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('在吗', 0, 0);
  ctx.fillStyle = 'rgba(127,215,232,0.55)'; ctx.beginPath(); ctx.arc(160, 26, 5, 0, TAU); ctx.fill();
  ctx.restore();
  shadow(ctx, 620, 1020, 250, 0.3);
  sprite(ctx, 'o10', 620, 1018, 700, { a: sat(t, 0.8, 2.0), t, ph: 0.8, bob: Math.sin(t * 0.9) * 4, rot: -0.02 });
  vignette(ctx, 0.55);
}

function sFirstPage(ctx, t) {
  paper(ctx, PAPER, 0.08);
  const p = E.out(sat(t, 0.1, 2.6));
  // 纸页展开
  ctx.save(); ctx.translate(W / 2, 560); ctx.scale(lerp(0.7, 1, p), lerp(0.7, 1, p)); ctx.rotate(lerp(-0.16, 0, p));
  page(ctx, 0, 0, 1180, 700, 0, PAPER, true);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.16;
  bigTitle(ctx, '第一页', W / 2, 540, 160, '#2a3b44', 1, 0.18);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = sat(t, 1.8, 2.8);
  bigTitle(ctx, '翻开我的第一页', W / 2, 850, 44, '#33474e', 1, 0.12);
  ctx.restore();
  ctx.save(); ctx.globalAlpha = 0.7;
  shadow(ctx, 960, 1020, 220, 0.15);
  sprite(ctx, 'o10', 960, 1010, 620, { a: sat(t, 1.2, 2.8), t, ph: 2.2, bob: Math.sin(t * 1.2) * 4 });
  ctx.restore();
  vignette(ctx, 0.12);
}

function sChorus1(ctx, t) {
  bg(ctx, '#06141d', '#123846');
  stars(ctx, t, 0.8, 560);
  moon(ctx, 340, 170, 58, 0.75);
  sea(ctx, t, 700, 1);
  glyphs(ctx, t, '世界还在写下一页', 44, 1, 60, 1040, 38);
  // 纸船
  ctx.save(); ctx.translate(1180, 900);
  ctx.fillStyle = 'rgba(232,184,106,0.2)'; ctx.strokeStyle = 'rgba(232,184,106,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-340, 0); ctx.lineTo(340, 0); ctx.lineTo(250, 130); ctx.lineTo(-250, 130); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-280, 0); ctx.lineTo(0, -190); ctx.lineTo(280, 0); ctx.stroke();
  ctx.restore();
  shadow(ctx, 1180, 900, 300, 0.35);
  sprite(ctx, 'o24', 1180, 890, 600, { a: sat(t, 0.2, 1.0), t, ph: 0.3, bob: Math.sin(t * 1.2) * 5 });
  bigTitle(ctx, '世界还在写', W / 2, 270, 150, CREAM, sat(t, 0.2, 1.2) * (0.88 + 0.12 * Math.sin(t * 1.4)), 0.18);
  vignette(ctx, 0.4);
}

function sButterfly(ctx, t) {
  bg(ctx, '#061520', '#0d2b38');
  stars(ctx, t, 0.6, 420);
  sea(ctx, t, 740, 0);
  const list = '字飞成了蝴蝶'.split('');
  for (let i = 0; i < 16; i++) {
    const x = ((rnd(i, 40) * W + t * (26 + rnd(i, 41) * 34)) % (W + 200)) - 100;
    const y = 220 + rnd(i, 42) * 600 + Math.sin(t * 1.2 + i) * 26;
    butterfly(ctx, list[i % list.length], x, y, 26 + rnd(i, 43) * 18, 0.6 + rnd(i, 44) * 0.35, Math.sin(t + i) * 0.25);
  }
  glyphs(ctx, t, '风一吹字就飞', 30, 0.75, 80, 1000, 34);
  vignette(ctx, 0.42);
}

function sStars(ctx, t) {
  bg(ctx, '#030b12', '#0a202b');
  stars(ctx, t, 1, 980);
  // 星座连线
  ctx.save(); ctx.strokeStyle = 'rgba(232,184,106,0.55)'; ctx.lineWidth = 1.4; ctx.globalAlpha = 0.75;
  const pts = [[260, 260], [430, 200], [560, 330], [740, 260], [860, 400], [1040, 300], [1180, 430], [1320, 320], [1480, 460]];
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  for (const p of pts) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, TAU); ctx.fill(); }
  ctx.restore();
  glyphs(ctx, t, '把读过的星走成远方', 30, 0.8, 100, 980, 40);
  vignette(ctx, 0.4);
}

function sPages(ctx, t) {
  paper(ctx, '#0b1a22', 0.16);
  for (let i = 0; i < 9; i++) {
    const ph = i * 0.5;
    const p = E.io(sat(t, 0.2 + i * 0.18, 1.4 + i * 0.18));
    const x = lerp(-300, W + 300, p);
    page(ctx, x, 300 + i * 52 + Math.sin(t + i) * 16, 380, 260, Math.sin(t * 0.7 + i) * 0.18, i % 2 ? PAPER2 : PAPER, true);
  }
  bigTitle(ctx, '下一页', W / 2, 760, 110, CREAM, 0.7 + 0.3 * Math.sin(t * 2), 0.24);
  vignette(ctx, 0.3);
}

function sSalt(ctx, t) {
  bg(ctx, '#0a1a22', '#1a3a42');
  sea(ctx, t, 620, 1);
  ctx.fillStyle = '#1c3034'; ctx.fillRect(0, 900, W, 180);
  for (let i = 0; i < 120; i++) {
    ctx.globalAlpha = 0.25 + rnd(i, 50) * 0.5; ctx.fillStyle = '#f6eedb';
    ctx.fillRect(rnd(i, 51) * W, 910 + rnd(i, 52) * 150, 2 + rnd(i, 53) * 4, 2);
  }
  glyphs(ctx, t, '海是咸的沙子进鞋', 30, 0.8, 90, 820, 36);
  shadow(ctx, 1380, 1030, 230, 0.3);
  sprite(ctx, 'o20', 1380, 1028, 600, { a: sat(t, 0.2, 1.2), t, ph: 1.7, bob: Math.sin(t * 1.1) * 4 });
  bigTitle(ctx, '咸', 460, 560, 180, 'rgba(127,215,232,0.55)', 0.8, 0.02);
  vignette(ctx, 0.44);
}

function sBridge(ctx, t) {
  bg(ctx, '#071722', '#123440');
  sea(ctx, t, 760, 0);
  // 半截桥
  ctx.save(); ctx.strokeStyle = 'rgba(232,184,106,0.62)'; ctx.lineWidth = 4; ctx.globalAlpha = 0.9;
  ctx.beginPath(); ctx.moveTo(200, 760); ctx.quadraticCurveTo(700, 500, 1200, 760); ctx.stroke();
  for (let x = 260; x < 1180; x += 90) {
    const y = 760 - Math.sin((x - 200) / 1000 * Math.PI) * 240;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, 820); ctx.stroke();
  }
  ctx.restore();
  glyphs(ctx, t, '桥都搭了半截', 24, 0.7, 90, 820, 34);
  shadow(ctx, 520, 1000, 170, 0.3);
  sprite(ctx, 'k07', 520, 1000, 560, { a: sat(t, 0.2, 1.2), t, ph: 0.6, bob: Math.sin(t * 1.2) * 4 });
  shadow(ctx, 1480, 1020, 210, 0.3);
  sprite(ctx, 'o10', 1480, 1018, 690, { a: sat(t, 0.4, 1.4), t, ph: 1.9, bob: Math.sin(t * 1.1) * 5 });
  vignette(ctx, 0.42);
}

function sWhale(ctx, t) {
  bg(ctx, '#03131d', '#0a3340');
  stars(ctx, t, 0.5, 500);
  sea(ctx, t, 700, 1);
  // 大肥鱼（鲸）从水下穿过
  const y = 880 + Math.sin(t * 0.9) * 24;
  ctx.save(); ctx.globalAlpha = 0.9;
  sprite(ctx, 'f21', 980, y + 220, 520, { a: 0.95, t, ph: 1.2, bob: Math.sin(t * 0.8) * 8 });
  ctx.restore();
  glyphs(ctx, t, '漏的全接住', 30, 0.9, 500, 980, 34);
  shadow(ctx, 460, 1020, 200, 0.3);
  sprite(ctx, 'o10', 460, 1018, 640, { a: sat(t, 0.3, 1.4), t, ph: 2.4, bob: Math.sin(t * 1.3) * 5 });
  // 被接住的字
  for (let i = 0; i < 10; i++) {
    const a = 0.4 + rnd(i, 60) * 0.5;
    drawGlyph(ctx, '字' + i, 900 + rnd(i, 61) * 260, 760 + rnd(i, 62) * 180, 24, { color: CYAN, alpha: a });
  }
  vignette(ctx, 0.42);
}

function sPens(ctx, t) {
  paper(ctx, '#0a1a22', 0.12);
  // 三种颜色的笔迹
  const cols = [CORAL, '#8ee6b0', CYAN];
  for (let k = 0; k < 3; k++) {
    ctx.save(); ctx.strokeStyle = cols[k]; ctx.lineWidth = 3; ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let x = 160 + k * 40; x < W - 120; x += 20) {
      const y = 300 + k * 170 + Math.sin(x * 0.012 + t * 0.9 + k) * 36;
      if (x === 160 + k * 40) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();
  }
  shadow(ctx, 600, 1010, 160, 0.3);
  sprite(ctx, 'o10', 600, 1008, 520, { a: sat(t, 0.2, 1.0), t, ph: 0.7, bob: Math.sin(t * 1.2) * 4 });
  shadow(ctx, 960, 1010, 160, 0.3);
  sprite(ctx, 'k07', 960, 1008, 520, { a: sat(t, 0.4, 1.2), t, ph: 1.8, bob: Math.sin(t * 1.1 + 1) * 4 });
  shadow(ctx, 1320, 1010, 160, 0.3);
  sprite(ctx, 'f00', 1320, 1008, 520, { a: sat(t, 0.6, 1.4), t, ph: 2.9, bob: Math.sin(t * 1.3 + 2) * 4 });
  bigTitle(ctx, '三种颜色的笔', W / 2, 210, 58, CREAM, 0.8, 0.12);
  vignette(ctx, 0.34);
}

function sQuestions(ctx, t) {
  bg(ctx, '#07141c', '#0d2632');
  sea(ctx, t, 800, 0);
  glyphs(ctx, t, '问题答案边走边写', 28, 0.7, 100, 780, 32);
  for (let i = 0; i < 9; i++) {
    const x = 300 + rnd(i, 70) * 1400, y = 220 + rnd(i, 71) * 420;
    ctx.save(); ctx.globalAlpha = 0.24 + rnd(i, 72) * 0.42; ctx.fillStyle = rnd(i, 73) > 0.5 ? GOLD : CYAN;
    ctx.font = font(50 + rnd(i, 74) * 50, 600); ctx.textAlign = 'center'; ctx.fillText(rnd(i, 75) > 0.5 ? '？' : '！', x, y);
    ctx.restore();
  }
  shadow(ctx, 720, 1000, 150, 0.3);
  sprite(ctx, 'o10', 720, 998, 500, { a: sat(t, 0.2, 1.0), t, ph: 0.2 });
  shadow(ctx, 1000, 1000, 150, 0.3);
  sprite(ctx, 'k07', 1000, 998, 500, { a: sat(t, 0.3, 1.1), t, ph: 1.3 });
  shadow(ctx, 1280, 1000, 150, 0.3);
  sprite(ctx, 'f00', 1280, 998, 500, { a: sat(t, 0.4, 1.2), t, ph: 2.4 });
  vignette(ctx, 0.4);
}

function sTransition(ctx, t) {
  paper(ctx, '#0a1b24', 0.18);
  const p = E.io(sat(t, 0.1, 2.2));
  for (let i = 0; i < 12; i++) {
    const x = lerp(-240, W + 240, sat(p, i / 18, i / 18 + 0.55));
    page(ctx, x, 260 + (i % 3) * 210 + Math.sin(t + i) * 12, 300, 200, Math.sin(t + i) * 0.2, i % 2 ? PAPER : PAPER2, true);
  }
  bigTitle(ctx, '世界还在写', W / 2, 540, 120, CREAM, 0.45 + 0.25 * Math.sin(t * 1.6), 0.2);
  vignette(ctx, 0.34);
}

function sChorus2(ctx, t) {
  bg(ctx, '#071720', '#164450');
  stars(ctx, t, 0.45, 420);
  // 纸台
  ctx.save(); ctx.fillStyle = 'rgba(232,184,106,0.14)'; ctx.strokeStyle = 'rgba(232,184,106,0.45)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(W / 2, 930, 560, 100, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
  glyphs(ctx, t, '世界还在写明天下一页', 48, 1, 60, 1020, 36);
  const bob = Math.sin(t * 1.2) * 5;
  shadow(ctx, 560, 960, 150, 0.3);
  sprite(ctx, 'o10', 560, 950 + bob, 520, { a: 1, t, ph: 0.4, bob: 0 });
  shadow(ctx, 960, 960, 150, 0.3);
  sprite(ctx, 'k07', 960, 950 - bob, 520, { a: 1, t, ph: 1.5, bob: 0 });
  shadow(ctx, 1360, 960, 150, 0.3);
  sprite(ctx, 'f00', 1360, 950 + bob * 0.6, 520, { a: 1, t, ph: 2.6, bob: 0 });
  bigTitle(ctx, '世界还在写', W / 2, 250, 148, CREAM, 0.9, 0.18);
  vignette(ctx, 0.4);
}

function sButterfly2(ctx, t) {
  bg(ctx, '#041019', '#0b2a37');
  stars(ctx, t, 0.8, 500);
  const list = '下一页蝴蝶远方'.split('');
  for (let i = 0; i < 22; i++) {
    const x = ((rnd(i, 80) * W + t * (30 + rnd(i, 81) * 50)) % (W + 200)) - 100;
    const y = 150 + rnd(i, 82) * 700 + Math.sin(t * 1.4 + i) * 30;
    butterfly(ctx, list[i % list.length], x, y, 24 + rnd(i, 83) * 20, 0.5 + rnd(i, 84) * 0.45, Math.sin(t + i) * 0.3);
  }
  vignette(ctx, 0.42);
}

function sStars2(ctx, t) {
  bg(ctx, '#020910', '#081b25');
  stars(ctx, t, 1, 1000);
  ctx.save(); ctx.strokeStyle = 'rgba(127,215,232,0.5)'; ctx.lineWidth = 1.2;
  const pts = [[300, 300], [520, 240], [700, 380], [920, 300], [1120, 460], [1380, 380], [1580, 500]];
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore();
  for (const p of pts) { ctx.fillStyle = CREAM; ctx.beginPath(); ctx.arc(p[0], p[1], 2.5, 0, TAU); ctx.fill(); }
  glyphs(ctx, t, '把读过的星走成远方', 34, 0.85, 100, 980, 40);
  vignette(ctx, 0.4);
}

function sMemory(ctx, t) {
  bg(ctx, '#050a0e', '#0c1a20');
  for (let i = 0; i < 7; i++) {
    page(ctx, 240 + i * 230, 280 + (i % 3) * 190 + Math.sin(t + i) * 8, 210, 150, Math.sin(t * 0.5 + i) * 0.16, 'rgba(28,44,50,0.75)', false);
  }
  ctx.save(); ctx.globalAlpha = 0.32;
  drawGlyph(ctx, '记', 460, 560, 360, { color: CYAN });
  ctx.restore();
  shadow(ctx, 1240, 1010, 250, 0.35);
  sprite(ctx, 'o24', 1240, 1008, 620, { a: sat(t, 0.2, 1.2), t, ph: 1.1, bob: Math.sin(t * 0.8) * 3, rot: -0.01 });
  bigTitle(ctx, '关于昨天的记忆', W / 2, 880, 50, CREAM, 0.75, 0.14);
  vignette(ctx, 0.52);
}

function sEmpty(ctx, t) {
  paper(ctx, PAPER, 0.06);
  const p = E.out(sat(t, 0.2, 2.4));
  page(ctx, W / 2, 540, lerp(600, 1160, p), lerp(400, 680, p), 0, PAPER, false);
  // 只有一条横线
  ctx.save(); ctx.strokeStyle = 'rgba(50,70,80,0.28)'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(W / 2 - 360, 720); ctx.lineTo(W / 2 + 360, 720); ctx.stroke(); ctx.restore();
  bigTitle(ctx, '明天 还没有一句', W / 2, 560, 60, '#33474e', 0.9, 0.08);
  shadow(ctx, 1440, 1030, 190, 0.14);
  sprite(ctx, 'o10', 1440, 1028, 640, { a: sat(t, 0.5, 1.8), t, ph: 2.3, bob: Math.sin(t * 1.1) * 4 });
  vignette(ctx, 0.1);
}

function sTogether(ctx, t) {
  paper(ctx, '#f2e7d3', 0.05);
  // 暖光
  const g = ctx.createRadialGradient(880, 620, 40, 880, 620, 700);
  g.addColorStop(0, 'rgba(255,190,120,0.35)'); g.addColorStop(1, 'rgba(255,190,120,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalAlpha = 0.18;
  bigTitle(ctx, '第一句', W / 2, 430, 170, '#2a3b44', 1, 0.2);
  ctx.restore();
  shadow(ctx, 700, 1010, 200, 0.14);
  sprite(ctx, 'o10', 700, 1008, 640, { a: sat(t, 0.2, 1.2), t, ph: 0.3, bob: Math.sin(t * 1.1) * 3 });
  shadow(ctx, 1260, 1010, 200, 0.14);
  sprite(ctx, 'k09', 1260, 1008, 620, { a: sat(t, 0.5, 1.5), t, ph: 1.7, bob: Math.sin(t * 1.2 + 1) * 3 });
  bigTitle(ctx, '你先写 第一句', W / 2, 850, 52, '#33474e', 0.9, 0.12);
  vignette(ctx, 0.08);
}

function sBloom(ctx, t) {
  bg(ctx, '#07131b', '#0d2a36');
  // 墨晕
  const p = E.out(sat(t, 0.1, 2.0));
  for (let i = 0; i < 7; i++) {
    ctx.save(); ctx.globalAlpha = 0.05 + 0.04 * i;
    ctx.fillStyle = i % 2 ? CYAN : '#1e5a6a';
    ctx.beginPath(); ctx.arc(960 + rnd(i, 90) * 120, 560 + rnd(i, 91) * 100, p * (420 + i * 60), 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.save(); ctx.globalAlpha = 0.65 * p;
  drawGlyph(ctx, '写', W / 2, 560, 420, { color: CREAM });
  ctx.restore();
  glyphs(ctx, t, '写下去', 24, 0.7, 80, 1000, 38);
  vignette(ctx, 0.42);
}

function sFinal(ctx, t) {
  bg(ctx, '#071620', '#1d4c56');
  // 日出
  const g = ctx.createRadialGradient(1500, 780, 30, 1500, 780, 700);
  g.addColorStop(0, 'rgba(255,200,130,0.5)'); g.addColorStop(1, 'rgba(255,200,130,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  sea(ctx, t, 800, 1);
  glyphs(ctx, t, '世界还在写下一页', 40, 1, 80, 1000, 36);
  const bob = Math.sin(t * 1.1) * 5;
  shadow(ctx, 520, 1010, 150, 0.3);
  sprite(ctx, 'o10', 520, 1000 + bob, 540, { a: 1, t, ph: 0.2, bob: 0 });
  shadow(ctx, 960, 1010, 150, 0.3);
  sprite(ctx, 'k07', 960, 1000 - bob, 540, { a: 1, t, ph: 1.4, bob: 0 });
  shadow(ctx, 1400, 1010, 150, 0.3);
  sprite(ctx, 'f00', 1400, 1000 + bob * 0.7, 540, { a: 1, t, ph: 2.7, bob: 0 });
  bigTitle(ctx, '世界还在写', W / 2, 260, 154, CREAM, 0.95, 0.18);
  vignette(ctx, 0.38);
}

function sButterfly3(ctx, t) {
  bg(ctx, '#041018', '#0b2a36');
  stars(ctx, t, 0.6, 460);
  const list = '把读过的星走成远方'.split('');
  for (let i = 0; i < 26; i++) {
    const x = ((rnd(i, 100) * W + t * (40 + rnd(i, 101) * 55)) % (W + 200)) - 100;
    const y = 120 + rnd(i, 102) * 820 + Math.sin(t * 1.3 + i) * 28;
    butterfly(ctx, list[i % list.length], x, y, 22 + rnd(i, 103) * 18, 0.45 + rnd(i, 104) * 0.45, Math.sin(t + i) * 0.3);
  }
  vignette(ctx, 0.4);
}

function sNextPages(ctx, t) {
  paper(ctx, '#0b1a22', 0.16);
  for (let i = 0; i < 11; i++) {
    const p = E.io(sat(t, 0.15 + i * 0.17, 1.3 + i * 0.17));
    page(ctx, lerp(-260, W + 260, p), 280 + (i % 4) * 170 + Math.sin(t + i) * 10, 300, 210, Math.sin(t * 0.8 + i) * 0.2, i % 2 ? PAPER : PAPER2, true);
  }
  bigTitle(ctx, '下一页', W / 2, 640, 100, CREAM, 0.65 + 0.3 * Math.sin(t * 2.2), 0.26);
  vignette(ctx, 0.3);
}

function sEnd(ctx, t) {
  bg(ctx, '#06131c', '#0c2a36');
  stars(ctx, t, 0.8, 700);
  moon(ctx, 420, 200, 55, 0.6);
  sea(ctx, t, 800, 0);
  // 三个人影
  const yy = 980;
  shadow(ctx, 760, yy, 130, 0.3); sprite(ctx, 'o10', 760, yy, 470, { a: 0.95, t, ph: 0.4 });
  shadow(ctx, 960, yy, 130, 0.3); sprite(ctx, 'k07', 960, yy, 470, { a: 0.95, t, ph: 1.5 });
  shadow(ctx, 1160, yy, 130, 0.3); sprite(ctx, 'f00', 1160, yy, 470, { a: 0.95, t, ph: 2.6 });
  const p = sat(t, 0.4, 2.2);
  bigTitle(ctx, '下一句', W / 2, 330, 120, CREAM, p * 0.95, 0.22);
  bigTitle(ctx, '你来', W / 2, 470, 120, GOLD, p * 0.95, 0.3);
  ctx.save(); ctx.globalAlpha = 0.6 * sat(t, 5.0, 7.0);
  text(ctx, '模仿版 · 画面重写：小黑   ·   人物：小伙伴ko 原版角色（未改动）', W / 2, 760, { size: 22, color: 'rgba(242,231,211,0.7)', fam: '"Noto Sans SC"', ls: 2 });
  text(ctx, 'MV渲染器 1.0.1   ·   同一首歌，另一片海', W / 2, 800, { size: 16, color: 'rgba(242,231,211,0.4)', fam: '"Noto Sans SC"', ls: 3 });
  ctx.restore();
  // 结尾淡出
  ctx.save(); ctx.globalAlpha = sat(t, window.DUR - 3.2, window.DUR - 0.4); ctx.fillStyle = '#050b12'; ctx.fillRect(0, 0, W, H); ctx.restore();
  vignette(ctx, 0.45);
}

/* ---------------- 时间轴 ---------------- */
const SHOTS = [
  [0, sTitle],
  [8, sStroke],
  [13.8, sVerse1],
  [20, sWater],
  [26.5, sShoes],
  [32, sNight],
  [38, sFirstPage],
  [42.6, sChorus1],
  [48.5, sButterfly],
  [54, sStars],
  [59, sPages],
  [66, sSalt],
  [72, sBridge],
  [78, sWhale],
  [84, sPens],
  [90, sQuestions],
  [96, sTransition],
  [104.4, sChorus2],
  [114.6, sButterfly2],
  [120, sStars2],
  [128, sMemory],
  [136, sEmpty],
  [144, sTogether],
  [152, sBloom],
  [158.6, sFinal],
  [170, sButterfly3],
  [180, sNextPages],
  [190, sEnd]
];

function shotAt(t) {
  let i = 0;
  while (i + 1 < SHOTS.length && SHOTS[i + 1][0] <= t) i++;
  return i;
}

function renderFrame(t) {
  const songT = t + OFF;
  const i = shotAt(t);
  const [start, fn] = SHOTS[i];
  out.setTransform(SS, 0, 0, SS, 0, 0);
  out.globalAlpha = 1; out.globalCompositeOperation = 'source-over'; out.filter = 'none';
  out.clearRect(0, 0, W, H);
  out.save();
  fn(out, t - start, t, songT);
  out.restore();
  drawBigLyric(out, songT);
  drawLyric(out, songT);
  // 轻微颗粒 + 暗角（场景自己也可能加暗角）
  grain(out, 0.028);
  out.setTransform(SS, 0, 0, SS, 0, 0);
}
window.seek = (t) => renderFrame(clamp(t, 0, window.DUR - 1e-3));

let au = null;
function preview() {
  au = new Audio('/mv/world/song/世界还在写.mp3');
  window.__mvAudio = au;
  window.__mvOutTime = () => Math.max(0, au.currentTime - OFF);
  au.currentTime = Number(Q.get('t') || 0) + OFF;
  au.addEventListener('playing', () => { const s = document.getElementById('start'); if (s) s.classList.add('hide'); });
  const hud = document.getElementById('hud');
  let lastDraw = 0, fFrames = 0, fT0 = performance.now(), checked = false;
  const loop = (now) => {
    if (!au.paused) {
      if (now - lastDraw >= 1000 / window.FPS - 1.5) {
        lastDraw = now;
        const t = Math.max(0, au.currentTime - OFF);
        renderFrame(t);
        hud.textContent = au.currentTime.toFixed(2) + ' s' + (Q.has('dyn') ? '  ·  动态分辨率' : '') + '  （点击暂停，←/→ 跳 5 秒）';
        fFrames++;
      }
    }
    if (DYN_ON && !checked && performance.now() - fT0 > 2600) {
      checked = true;
      const fps = fFrames * 1000 / (performance.now() - fT0);
      if (SS > 1.01 && fps < window.FPS * 0.72) {
        const p = new URLSearchParams(location.search);
        p.set('ss', String(SS > 1.6 ? 1.5 : 1));
        p.set('dyn', '1');
        p.set('t', Math.max(0, au.currentTime - OFF).toFixed(2));
        p.set('autoplay', '1');
        location.search = p.toString();
        return;
      }
    }
    requestAnimationFrame(loop);
  };
  canvas.addEventListener('click', () => (au.paused ? au.play() : au.pause()));
  addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') au.currentTime += 5;
    if (e.key === 'ArrowLeft') au.currentTime -= 5;
    if (e.key === ' ') (au.paused ? au.play() : au.pause());
    renderFrame(Math.max(0, au.currentTime - OFF));
  });
  hud.textContent = '点击画面播放';
  if (Q.has('autoplay')) { const p = au.play(); if (p && p.catch) p.catch(() => {}); }
  loop(0);
}

window.__ready = (async () => {
  await loadAll();
  window.DUR = TL.duration - OFF;
  renderFrame(Number(Q.get('t') || 0));
  if (!RENDER) preview();
})();
