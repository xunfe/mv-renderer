// 《我只是翻了个身》 mid-only share build. window.seek(t, q) renders one output frame:
// q sub-frames averaged (motion blur; more where FAST says so), a soft bloom, the WebGL post pass, then the subtitles.
// This bundle only loads the two-thirds-version soundtrack and timeline.
// analysis/v2/timeline_<name>.json maps output time to the song's clock (segments). All shots run on the song's clock.
// 0–3.247 s is the new opening (open.js); from there the v1 shots, at their v1 cut times, with motion added on top (plus.js).
// The Let me go part after the band's hits is gone in every version (本人 10-21); the end card holds on the hits' last frame.
import { W, H, SS, clamp, sat, E, font, rgba, setBeats } from '../lib.js';
import { loadV2 } from './core.js';
import { post, isIdle } from './post.js';
import * as O from './open.js';
import { SHOTS } from './shots.js';
import { SB_FAST, postSB } from './sb.js';
import { SB2_FAST } from './sb2.js';
import { installHooks } from './fx2.js';
import { loadChars, setCharTime } from '../chars.js';
import { loadImages } from '../common.js';

const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
const VER = 'mid';
const NAME = 'mid';   // 文件名用 ASCII：安卓 AssetServer 还没还原 URL 里的中文
const canvas = document.getElementById('c'), out = canvas.getContext('2d');
canvas.width = W * SS; canvas.height = H * SS;
// 离屏层用普通 <canvas>：部分安卓 WebView 会把 OffscreenCanvas 退化成软件光栅
const mkLayer = (w, h) => { const el = document.createElement('canvas'); el.width = w | 0; el.height = h | 0; return el; };
const scene = mkLayer(W * SS, H * SS), sctx = scene.getContext('2d');
const acc = mkLayer(W * SS, H * SS), actx = acc.getContext('2d');
const small = mkLayer(W * SS / 4, H * SS / 4), smctx = small.getContext('2d');
let LY = null, TL = null;
window.FPS = Number(Q.get('fps') || 60);
window.__SS = SS;

// output time -> song time. In a gap between two segments (the breath before the band's hits) the previous segment's clock runs
// on, so the shot there plays out (T1 goes white); after the last one it runs on under the end card.
function songT(t) {
  let s = 0;
  for (const [o0, s0] of TL.segments) if (t >= o0) s = s0 + (t - o0);
  return s;
}
installHooks();                                                       // v1 shots' splashes and fireworks drawn the v2 way
const CUTS = SHOTS(VER);
function segAt(t) { let i = 0; while (i + 1 < CUTS.length && CUTS[i + 1][0] <= t) i++; return i; }
const FAST = [...SB_FAST, ...SB2_FAST, [61.97, 63.72, 6], [92.4, 92.8, 6], [144.59, 145.6, 6], [161.16, 162.4, 6], [30.5, 30.95, 8], [48.14, 49.19, 6],
  [39.0, 40.2, 8], [41.0, 43.8, 6], [44.3, 46.4, 6], [22.0, 24.6, 6]];
const BRIGHT = [[53.9, 61.97], [75.52, 85.84], [127.92, 144.59], [161.16, 168.44]];
const isBright = t => BRIGHT.some(([a, b]) => t >= a && t < b);

// subtitles (as in v1): every character on its own sung time; lines a shot sets itself in big type are left out
const PUNCT = new Set([...'　 ，。“”！？、']);
const BIG = new Set(['c1h', 'b8', 'f9']);
let SUBS = null;
function buildSubs(ctx) {
  SUBS = [];
  ctx.save(); ctx.font = font(46, 600); ctx.letterSpacing = '6px';
  LY.lines.forEach(L => {
    if (BIG.has(L.id)) return;
    const items = []; let k = 0;
    [...L.text].forEach((ch, i) => items.push({ ch, x: ctx.measureText(L.text.slice(0, i)).width, t: PUNCT.has(ch) ? null : L.t[k++] }));
    items.forEach((o, i) => { if (o.t !== null) return; const prev = items.slice(0, i).reverse().find(q => q.t !== null), next = items.slice(i + 1).find(q => q.t !== null); o.t = (o.ch === '“' || !prev) ? next.t : prev.t; });
    SUBS.push({ items: items.filter(o => o.ch !== '　' && o.ch !== ' '), full: ctx.measureText(L.text).width, s: L.t[0], end: L.end, spoken: !!L.spoken });
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
    ctx.save(); ctx.filter = 'blur(18px)'; ctx.globalAlpha = sat(t, L.s - 0.08, L.s + 0.12) * fade * (bright ? 0.5 : 0.62); ctx.fillStyle = '#071433';
    ctx.beginPath(); ctx.roundRect(x0 - 70, y - 40, L.full + 140, 80, 40); ctx.fill(); ctx.restore();
    ctx.font = font(46, 600); ctx.letterSpacing = '6px'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(8,16,44,0.72)'; ctx.fillStyle = L.spoken ? '#FFE7C4' : '#E3EEFF';
    for (const pass of [0, 1]) for (const o of L.items) {
      if (t < o.t - 0.04) continue;
      ctx.globalAlpha = sat(t, o.t - 0.04, o.t + 0.04) * fade;
      const dy = (1 - E.out(sat(t, o.t - 0.04, o.t + 0.1))) * 9;
      if (pass === 0) ctx.strokeText(o.ch, x0 + o.x, y + dy); else ctx.fillText(o.ch, x0 + o.x, y + dy);
    }
    ctx.restore();
  }
}

function reset(c) { c.setTransform(SS, 0, 0, SS, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0; c.setLineDash([]); }
window.seek = (tOut, q) => {
  tOut = clamp(tOut, 0, window.DUR - 1e-3);
  const t = songT(tOut);
  let S = Math.max(1, q ?? Number(Q.get('q') || (RENDER ? 4 : 1)));
  if (S > 1) for (const [fa, fb, fq] of FAST) if (t >= fa && t < fb) S = Math.max(S, fq);
  const i = segAt(t), a = CUTS[i][0], b = (CUTS[i + 1] ? CUTS[i + 1][0] : 1e9) - 1e-4;
  globalThis.__frameT = t;                                               // plus.js: which drawing a replaced pose shows
  let src;                                                               // bloom 取样源
  if (S === 1) {
    // 播放路径：一帧直接画到可见画布，省掉 scene→acc→out 两次整屏拷贝
    reset(out); out.fillStyle = '#000'; out.fillRect(0, 0, W, H);
    setCharTime(clamp(t, a, b)); out.save(); CUTS[i][1](out, clamp(t, a, b)); out.restore();
    src = canvas;
  } else {
    reset(actx); actx.fillStyle = '#000'; actx.fillRect(0, 0, W, H);
    for (let s = 0; s < S; s++) {
      const ts = clamp(t + ((s + 0.5) / S - 0.5) * (0.5 / window.FPS) * (S > 1 ? 1 : 0), a, b);
      setCharTime(ts);
      reset(sctx); sctx.clearRect(0, 0, W, H); sctx.fillStyle = '#000'; sctx.fillRect(0, 0, W, H);
      sctx.save(); CUTS[i][1](sctx, ts); sctx.restore();
      actx.globalAlpha = 1 / (s + 1); actx.drawImage(scene, 0, 0, W, H);
    }
    reset(out); out.drawImage(acc, 0, 0, W, H);
    src = acc;
  }
  reset(smctx); smctx.clearRect(0, 0, W / 4, H / 4); smctx.filter = 'blur(7px)';
  smctx.drawImage(src, -16, -9, W / 4 + 32, H / 4 + 18); smctx.drawImage(src, 0, 0, W / 4, H / 4);
  out.globalCompositeOperation = 'screen'; out.globalAlpha = t < O.T_SURF ? 0.18 : isBright(t) ? 0.12 : 0.26; out.drawImage(small, 0, 0, W, H);
  reset(out);
  const p = postSB(t);
  if (!isIdle(p)) { const g = post(canvas, p); out.setTransform(1, 0, 0, 1, 0, 0); out.drawImage(g, 0, 0); reset(out); }
  if (tOut < TL.end_card) subtitle(out, t);
  if (tOut > window.DUR - 0.3) { out.fillStyle = rgba('#050B1E', sat(tOut, window.DUR - 0.3, window.DUR - 0.02)); out.fillRect(0, 0, W, H); }
};

window.__ready = (async () => {
  const f1 = new FontFace('Noto Serif SC', 'url(/mv/world/fonts/NotoSerifSC-VF.ttf)', { weight: '200 900' });
  const f2 = new FontFace('Noto Sans SC', 'url(/mv/world/fonts/NotoSansSC-VF.ttf)', { weight: '100 900' });
  await Promise.all([f1.load(), f2.load()]); document.fonts.add(f1); document.fonts.add(f2);
  TL = await (await fetch(`analysis/v2/timeline_${NAME}.json`)).json();
  LY = await (await fetch('analysis/lyrics.json')).json();
  setBeats(TL.beats);
  window.DUR = Number(Q.get('end') || TL.duration);
  // lines whose start was cut out of this version's song
  const kept = s => TL.segments.some(([, s0, s1]) => s >= s0 - 0.05 && s < s1);
  LY.lines = LY.lines.filter(L => kept(L.t[0]) && (!Q.get('end') || L.t[0] < songT(window.DUR)));
  await Promise.all([loadV2(), loadChars(), loadImages()]);
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) preview();
})();

function preview() {
  const au = new Audio('song/flip.m4a');
  au.currentTime = Number(Q.get('t') || 0);
  window.mvPlayer({ audio: au, offset: 0, getSS: () => SS });
}
