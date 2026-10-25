// 《那年你叫我未来》 — entry point. window.seek(t, q) renders one output frame deterministically:
// q sub-frames are averaged for motion blur, then bloom and the lyric line are added on top.
// t is time on the cut song (it starts on 那年冬天; see 方案-那年你叫我未来.md section 10).
import { W, H, SS, clamp, lerp, sat, E, COL, rgba, setBeats, font } from './lib.js';
import { loadChars, setCharTime } from './chars.js';
import { sheetChar, loadImages } from './common.js';
import * as A from './scenesA.js';
import * as B from './scenesB.js';
import * as C from './scenesC.js';
import * as D from './scenesD.js';

const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
const canvas = document.getElementById('c'), out = canvas.getContext('2d');
canvas.width = W * SS; canvas.height = H * SS;
// 离屏层用普通 <canvas>：部分安卓 WebView 会把 OffscreenCanvas 退化成软件光栅
const mkLayer = (w, h) => { const el = document.createElement('canvas'); el.width = w | 0; el.height = h | 0; return el; };
const scene = mkLayer(W * SS, H * SS), sctx = scene.getContext('2d');
const acc = mkLayer(W * SS, H * SS), actx = acc.getContext('2d');
const tmp = mkLayer(W * SS, H * SS), tctx = tmp.getContext('2d');
const small = mkLayer(W * SS / 4, H * SS / 4), smctx = small.getContext('2d');
let TL = null, LY = null;
window.FPS = Number(Q.get('fps') || 60);
window.__SS = SS;

function xfade(at, dur, a, b) {
  return (ctx, t) => {
    a(ctx, t);
    reset(tctx); tctx.clearRect(0, 0, W, H);
    tctx.save(); b(tctx, t); tctx.restore();
    ctx.save(); ctx.globalAlpha = E.io(sat(t, at, at + dur)); ctx.drawImage(tmp, 0, 0, W, H); ctx.restore();
  };
}
// a white flash over a hard cut (the cut happens at 'at')
function flash(at, dur, a, b, color = '#FFFFFF') {
  return (ctx, t) => { (t < at ? a : b)(ctx, t); const p = 1 - Math.abs(t - at) / dur; if (p > 0) { ctx.fillStyle = rgba(color, 0.85 * p * p); ctx.fillRect(0, 0, W, H); } };
}

const CUTS = [
  [0, A.sOpen], [8.72, A.sA4], [12.06, A.sA5],
  [15.26, A.sA6], [17.84, A.sB1], [19.82, A.sB2], [22.08, A.sB3], [23.84, A.sB4],
  [29.25, flash(29.25, 0.22, A.sB4, B.sC1, '#FFE9B0')], [29.47, B.sC1], [31.42, B.sC2], [35.14, B.sC3], [37.2, B.sC4], [41.6, B.sC5],
  [44.36, B.sC6], [47.6, flash(47.6, 0.2, B.sC6, B.sC7)], [47.8, B.sC7], [49.76, B.sC8],
  [54.45, B.sD1], [56.95, B.sD2], [59.74, B.sD3], [62.6, B.sD4], [66.8, B.sD5], [69.94, B.sD6], [72.96, B.sE1],
  [76.52, C.sF1], [79.02, C.sF2], [81.56, C.sF3], [83.94, C.sF4], [86.74, C.sF5], [88.44, C.sF6], [91.5, C.sF7],
  [94.44, C.sF8], [95.74, C.sF9], [98.26, C.sF10], [101.48, C.sF11],
  [105.46, D.sG1], [107.54, flash(107.54, 0.16, D.sG1, D.sG2)], [107.7, D.sG2], [110.96, D.sG3], [113.1, D.sG4], [117.08, D.sG5],
  [120.22, D.sG6], [123.38, flash(123.38, 0.2, D.sG6, D.sG7)], [123.58, D.sG7], [125.7, D.sG8],
  [129.6, xfade(129.6, 0.6, D.sG8, D.sH1)], [130.2, D.sH1], [136.2, flash(136.2, 0.3, D.sH1, D.sH2, '#FFF1D8')], [136.5, D.sH2],
  [141.9, D.sH3], [143.8, xfade(143.8, 0.5, D.sH3, D.sH4)], [144.3, D.sH4],
];
const FAST = [[0.1, 1.2, 8], [2.0, 3.2, 8], [4.9, 6.9, 6], [49.8, 52.5, 8], [54.4, 62.6, 6], [105.4, 117.1, 8], [125.7, 129.6, 8], [141.9, 143.8, 6]];
const BRIGHT = [[125.7, 129.6], [136.08, 156]];
if (Q.get('sheet')) {     // ?sheet=g01,g02,...  a line-up of sprites for checking eyelids (&blink=0.5) and edges
  const ids = Q.get('sheet').split(','), cols = Math.min(ids.length, Number(Q.get('cols') || 6)), cw = W / cols, rows = Math.ceil(ids.length / cols), rh = H / rows;
  CUTS.length = 0; CUTS.push([0, ctx => { ctx.fillStyle = Q.get('bg') || '#1E2650'; ctx.fillRect(0, 0, W, H); ids.forEach((id, i) => sheetChar(ctx, id, (i % cols + 0.5) * cw, (Math.floor(i / cols) + 1) * rh - 24, Math.min(cw, rh) * 0.86)); }]);
  FAST.length = 0;
}
function segAt(t) { let i = 0; while (i + 1 < CUTS.length && CUTS[i + 1][0] <= t) i++; return i; }
const isBright = t => BRIGHT.some(([a, b]) => t >= a && t < b);

// Subtitles, written as they are sung (every character has its own time: analysis/lyrics.json). Coloured by who
// sings: 姐姐 lavender, 小柯 green, both together warm white. 早安 is drawn by the scene itself.
const PUNCT = new Set([...'　 ，。“”！？、']);
const INK = { gpt: '#E6DEFF', ko: '#B4F1D3', both: '#FFF4DC' };
let SUBS = null;
function buildSubs(ctx) {
  SUBS = [];
  ctx.save(); ctx.font = font(46, 600); ctx.letterSpacing = '6px';
  LY.lines.forEach(L => {
    if (L.big) return;
    const items = []; let k = 0;
    [...L.text].forEach((ch, i) => items.push({ ch, x: ctx.measureText(L.text.slice(0, i)).width, t: PUNCT.has(ch) ? null : L.t[k++] }));
    items.forEach((o, i) => { if (o.t !== null) return; const prev = items.slice(0, i).reverse().find(q => q.t !== null), next = items.slice(i + 1).find(q => q.t !== null); o.t = (o.ch === '“' || !prev) ? next.t : prev.t; });
    SUBS.push({ items: items.filter(o => o.ch !== '　' && o.ch !== ' '), full: ctx.measureText(L.text).width, s: L.t[0], end: L.end, who: L.who });
  });
  ctx.restore();
}
function subtitle(ctx, t) {
  if (!SUBS) buildSubs(ctx);
  for (const L of SUBS) {
    if (t < L.s - 0.08 || t > L.end) continue;
    const fade = 1 - sat(t, L.end - 0.2, L.end), bright = isBright(t);
    const x0 = W / 2 - L.full / 2, y = 1012;
    ctx.save();
    ctx.save(); ctx.filter = 'blur(18px)'; ctx.globalAlpha = sat(t, L.s - 0.08, L.s + 0.12) * fade * (bright ? 0.5 : 0.62); ctx.fillStyle = '#0E1030';
    ctx.beginPath(); ctx.roundRect(x0 - 70, y - 40, L.full + 140, 80, 40); ctx.fill(); ctx.restore();
    ctx.font = font(46, 600); ctx.letterSpacing = '6px'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(16,14,40,0.7)'; ctx.fillStyle = INK[L.who] ?? INK.gpt;
    for (const pass of [0, 1]) for (const o of L.items) {
      if (t < o.t - 0.04) continue;
      ctx.globalAlpha = sat(t, o.t - 0.04, o.t + 0.04) * fade;
      const dy = (1 - E.out(sat(t, o.t - 0.04, o.t + 0.1))) * 9;
      if (pass === 0) ctx.strokeText(o.ch, x0 + o.x, y + dy); else ctx.fillText(o.ch, x0 + o.x, y + dy);
    }
    ctx.restore();
  }
}

function reset(c) { c.setTransform(SS, 0, 0, SS, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.setLineDash([]); }
window.seek = (t, q) => {
  t = clamp(t, 0, window.DUR - 1e-3);
  let S = Math.max(1, q ?? Number(Q.get('q') || (RENDER ? 4 : 1)));
  if (S > 1) for (const [fa, fb, fq] of FAST) if (t >= fa && t < fb) S = Math.max(S, fq);
  const i = segAt(t), a = CUTS[i][0], b = (CUTS[i + 1] ? CUTS[i + 1][0] : window.DUR) - 1e-4;
  let src;
  if (S === 1) {
    // 播放路径：一帧直接画到可见画布，省掉 scene→acc→out 两次整屏拷贝
    reset(out); out.clearRect(0, 0, W, H);
    setCharTime(clamp(t, a, b)); out.save(); CUTS[i][1](out, clamp(t, a, b)); out.restore();
    src = canvas;
  } else {
    reset(actx);
    for (let s = 0; s < S; s++) {
      const ts = clamp(t + ((s + 0.5) / S - 0.5) * (0.5 / window.FPS) * (S > 1 ? 1 : 0), a, b);
      setCharTime(ts);
      reset(sctx); sctx.clearRect(0, 0, W, H); sctx.save(); CUTS[i][1](sctx, ts); sctx.restore();
      actx.globalAlpha = 1 / (s + 1); actx.drawImage(scene, 0, 0, W, H);
    }
    reset(out); out.drawImage(acc, 0, 0, W, H);
    src = acc;
  }
  reset(smctx); smctx.clearRect(0, 0, W / 4, H / 4); smctx.filter = 'blur(7px)';
  smctx.drawImage(src, -16, -9, W / 4 + 32, H / 4 + 18); smctx.drawImage(src, 0, 0, W / 4, H / 4);
  out.globalCompositeOperation = 'screen'; out.globalAlpha = isBright(t) ? 0.12 : 0.3; out.drawImage(small, 0, 0, W, H);
  reset(out);
  if (!Q.get('sheet')) subtitle(out, t);
  if (t > window.DUR - 0.9) { out.fillStyle = rgba('#0E1030', sat(t, window.DUR - 0.9, window.DUR - 0.05)); out.fillRect(0, 0, W, H); }
};

window.__ready = (async () => {
  const f1 = new FontFace('Noto Serif SC', 'url(/mv/world/fonts/NotoSerifSC-VF.ttf)', { weight: '200 900' });
  const f2 = new FontFace('Noto Sans SC', 'url(/mv/world/fonts/NotoSansSC-VF.ttf)', { weight: '100 900' });
  await Promise.all([f1.load(), f2.load()]); document.fonts.add(f1); document.fonts.add(f2);
  TL = await (await fetch('analysis/timeline.json')).json();
  LY = await (await fetch('analysis/lyrics.json')).json();
  window.DUR = TL.duration; setBeats(TL.beats);
  await Promise.all([loadChars(), loadImages()]);
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) preview();
})();

function preview() {
  const au = new Audio('song/future.mp3');
  au.currentTime = Number(Q.get('t') || 0);
  window.mvPlayer({ audio: au, offset: 0, getSS: () => SS });
}
