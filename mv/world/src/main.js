// 《世界还在写》 — entry point. window.seek(t, q) renders one output frame deterministically:
// q sub-frames are averaged for motion blur, then bloom and the lyric line are added on top.
import { W, H, SS, clamp, lerp, sat, E, COL, rgba, setBeats, setBeatShift, pageFlip, measure, font } from './lib.js';
import { loadChars, setCharTime } from './chars.js';
import * as S1 from './scenes1.js';
import * as S2 from './scenes2.js';
import * as S3 from './scenes3.js';
import * as S4 from './scenes4.js';
import * as S5 from './scenes5.js';
import * as S6 from './scenes6.js';
import * as S7 from './scenes7.js';
import { HOOK, sHook, sSea2, sShoes2 } from './hook.js';

const Q = new URLSearchParams(location.search);
const RENDER = Q.has('render');
const FULLCUT = Q.get('cut') !== 'short';          // 默认整首 3:24；?cut=short 才走 103 秒预告版
const HOOKED = Q.has('hook');                     // the feed opening: start on the first sung line (see hook.js)
const OFF = HOOKED ? HOOK.off : 14.35;         // 1.0.1 起默认跳过 14.35 秒前奏（整首 3:24，和合集卡片一致）
const canvas = document.getElementById('c'), out = canvas.getContext('2d');
canvas.width = W * SS; canvas.height = H * SS;
// 离屏层用普通 <canvas>（不进 DOM）。OffscreenCanvas 在部分安卓 WebView 上退化成软件光栅，
// 每帧都要把整幅 1080p 传回 GPU；换成 canvas 元素后基本都走 GPU。
const mkLayer = (w, h) => { const el = document.createElement('canvas'); el.width = w | 0; el.height = h | 0; return el; };
const scene = mkLayer(W * SS, H * SS), sctx = scene.getContext('2d');
const acc = mkLayer(W * SS, H * SS), actx = acc.getContext('2d');
const tmp = mkLayer(W * SS, H * SS), tctx = tmp.getContext('2d');
const small = mkLayer(W * SS / 4, H * SS / 4), smctx = small.getContext('2d');
let TL = null, LY = null;
window.FPS = Number(Q.get('fps') || 60);
window.__SS = SS;   // 调试/自检用

// ---- the cut list. Each entry: [start, draw(ctx, t)]; transitions are entries too.
const flip = (at, dur, a, b) => (ctx, t) => pageFlip(ctx, (t - at) / dur, () => a(ctx, t), () => b(ctx, t));
function inkWipe(at, dur, a, b) {
  return (ctx, t) => {
    const p = E.io(sat(t, at, at + dur));
    a(ctx, t);
    ctx.save(); ctx.beginPath(); ctx.moveTo(-10, -10); ctx.lineTo(W + 10, -10);
    for (let x = W + 10; x >= -10; x -= 30) ctx.lineTo(x, lerp(-160, H + 160, p) + Math.sin(x * 0.006 + 1) * 90 + Math.sin(x * 0.021) * 30);
    ctx.closePath(); ctx.clip(); b(ctx, t); ctx.restore();
  };
}
function xfade(at, dur, a, b) {
  return (ctx, t) => {
    a(ctx, t);
    reset(tctx);
    tctx.save(); b(tctx, t); tctx.restore();
    ctx.save(); ctx.globalAlpha = E.io(sat(t, at, at + dur)); ctx.drawImage(tmp, 0, 0, W, H); ctx.restore();
  };
}
const road = (theme, tf) => (ctx, t) => S2.sRoad(ctx, t, theme, tf);
const dusk = road('dusk', 76.4), rOrange = road('orange', 80.0), rGreen = road('green', 81.6), rBlue = road('blue', 83.05);
// A scene written for one time can be shown d seconds later (the same music, a later chorus).
const shiftBy = (fn, d) => (ctx, t) => { setBeatShift(d); try { fn(ctx, t - d); } finally { setBeatShift(0); } };
// 橙子 on her own: the first chorus of the full version, before she has met the other two.
const solo = fn => (ctx, t) => { S2.VAR.solo = true; try { fn(ctx, t); } finally { S2.VAR.solo = false; } };
const HEAD = [
  [0, S1.sIntro], [12.25, S1.sWake], [13.78, flip(13.78, 0.5, S1.sWake, S1.sSea)], [14.28, S1.sSea],
  [24.58, S1.sShoes], [27.6, inkWipe(27.6, 0.5, S1.sShoes, S3.sNight)], [28.1, S3.sNight],
  [38.72, flip(38.72, 0.56, S3.sNight, S1.sFirstPage)], [39.28, S1.sFirstPage],
  [45.92, S1.sMountain], [46.84, S1.sFire], [47.74, S3.sSad], [49.4, S3.sBook], [52.48, S3.sDoor],
  [55.91, S2.sChorusA],
];
function shortCut() {
  return {
    timeline: 'analysis/timeline.json', lyrics: 'analysis/lyrics_sync.json', audio: 'song/cut_v2.wav',
    cuts: [...HEAD, [59.4, S2.sWalk], [70.61, S2.sTrio], [73.19, S2.sWindClose], [74.93, S2.sWindWide],
      [76.4, xfade(76.4, 0.5, S2.sWindWide, dusk)], [76.9, dusk],
      [80.0, flip(80.0, 0.5, dusk, rOrange)], [80.5, rOrange],
      [81.6, flip(81.6, 0.5, rOrange, rGreen)], [82.1, rGreen],
      [83.05, flip(83.05, 0.5, rGreen, rBlue)], [83.55, rBlue],
      [84.75, flip(84.75, 0.56, rBlue, S2.sOutro)], [85.31, S2.sOutro]],
    fast: [[70.34, 70.84, 12], [13.78, 14.28, 6], [38.72, 39.28, 6], [80.0, 80.5, 6], [81.6, 82.1, 6], [83.05, 83.55, 6], [84.75, 85.31, 6], [55.91, 56.4, 6], [47.74, 49.4, 8], [82.1, 83.05, 8], [83.35, 84.75, 8]],
    dark: [[28.0, 38.95], [46.84, 47.74], [76.65, 80.2]],
    bright: [[56.46, 85]],
  };
}
// The whole song. Chorus 1 is hers alone; she meets Ko and 大肥鱼 in verse 2; chorus 2 is the three of them (the
// scenes of the preview cut, played 61.56 s later); the last chorus ends exactly as the preview cut does, 115.455 s later.
function fullCut() {
  const K2 = 61.56, K3 = 115.455;
  const dusk3 = shiftBy(dusk, K3), orange3 = shiftBy(rOrange, K3), green3 = shiftBy(rGreen, K3), blue3 = shiftBy(rBlue, K3), outro3 = shiftBy(S2.sOutro, K3);
  const trio0 = shiftBy(S2.sTrio, 47.95), windC = solo(S2.sWindClose);
  const trio2 = (ctx, t) => { S2.VAR.c2 = [70.88, 71.44, 71.77, 72.11, 72.42]; try { trio0(ctx, t); } finally { S2.VAR.c2 = null; } };      // 世界还在写 as it is sung the second time
  const wind2c = shiftBy(S2.sWindClose, K2), wind2w = shiftBy(S2.sWindWide, K2);
  S2.VAR.ctaTail = '下一页见'; S2.VAR.ctaMid = false;
  return {
    timeline: 'analysis/timeline_full.json', lyrics: 'analysis/lyrics_full.json', audio: 'song/world.mp3',
    cuts: [...HEAD, [59.4, solo(S2.sWalk)], [70.61, S6.sTitleSolo], [73.19, windC], [74.93, S6.sWindSolo],
      [76.4, xfade(76.4, 0.5, S6.sWindSolo, S4.sStarsSolo)], [76.9, S4.sStarsSolo],
      [79.95, flip(79.95, 0.5, S4.sStarsSolo, S4.sFlowerSolo)], [80.45, S4.sFlowerSolo],
      [81.63, flip(81.63, 0.5, S4.sFlowerSolo, S4.sShore)], [82.13, S4.sShore],
      [83.78, flip(83.78, 0.5, S4.sShore, S6.sWet)], [84.28, S6.sWet],
      [86.96, S6.sSalty], [90.5, S6.sSand], [94.2, S6.sBridgeKo], [97.55, S4.sDive], [101.0, S4.sPens], [102.85, S4.sCrooked],
      [105.4, S4.sQuestions], [108.0, S4.sWalkWrite], [111.25, S4.sBook3], [114.0, S4.sDoor3],
      [118.56, trio2], [121.14, S5.sStreet2], [132.3, S5.sTitle2], [134.76, wind2c], [136.49, wind2w],
      [137.96, xfade(137.96, 0.5, wind2w, S7.sStars3)], [138.46, S7.sStars3],
      [141.4, xfade(141.4, 0.5, S7.sStars3, S7.sFlyBook)], [141.9, S7.sFlyBook],
      [146.25, inkWipe(146.25, 0.6, S7.sFlyBook, S5.sB1)], [146.85, S5.sB1], [150.0, S5.sB2], [152.85, S5.sB3], [156.45, S5.sB4], [164.3, S5.sB5], [167.2, S5.sB6],
      [172.85, S5.sQuiet], [181.9, S5.sArrive], [186.45, S5.sBig], [188.6, S5.sRen],
      [191.855, xfade(191.855, 0.5, S5.sRen, dusk3)], [192.355, dusk3],
      [195.455, flip(195.455, 0.5, dusk3, orange3)], [195.955, orange3],
      [197.055, flip(197.055, 0.5, orange3, green3)], [197.555, green3],
      [198.505, flip(198.505, 0.5, green3, blue3)], [199.005, blue3],
      [200.205, flip(200.205, 0.56, blue3, outro3)], [200.765, outro3]],
    fast: [[70.34, 70.84, 12], [13.78, 14.28, 6], [38.72, 39.28, 6], [55.91, 56.4, 6], [47.74, 49.4, 8],
      [79.95, 80.45, 6], [81.63, 82.13, 6], [83.78, 84.28, 6], [118.3, 118.8, 12], [132.05, 132.52, 12], [116.3, 117.3, 6], [153.6, 154.7, 6], [186.45, 188.6, 8], [185.6, 186.45, 6], [141.4, 141.9, 6], [142.0, 142.5, 6], [143.58, 144.1, 6], [143.95, 145.2, 6],
      [195.455, 195.955, 6], [197.055, 198.505, 8], [198.505, 200.205, 8], [200.205, 200.765, 6]],
    dark: [[28.0, 38.95], [46.84, 47.74], [76.65, 80.15], [138.2, 141.6], [146.6, 156.45], [192.1, 195.65]],
    bright: [[56.46, 86], [118.5, 146], [172.8, 200.3]],
  };
}
const CUT = FULLCUT ? fullCut() : shortCut();
if (HOOKED) {
  CUT.cuts = [[OFF, sHook], [HOOK.end, sSea2], [24.58, sShoes2], [27.6, inkWipe(27.6, 0.5, sShoes2, S3.sNight)], ...CUT.cuts.filter(c => c[0] >= 28.1)];
  CUT.fast.push([OFF, 18.0, 8], [25.6, 27.3, 8]);
  S2.VAR.endAsk = '把你的下一句，写在评论区';
}
// ?sheet=o23,o24,...  a line-up of sprites instead of the film, for checking eyelids (add &blink=0.5) and edges
if (Q.get('sheet')) {
  const ids = Q.get('sheet').split(','), cols = Math.min(ids.length, Number(Q.get('cols') || 6)), cw = W / cols, rows = Math.ceil(ids.length / cols), rh = H / rows;
  CUT.cuts = [[0, ctx => { ctx.fillStyle = '#F5EDDD'; ctx.fillRect(0, 0, W, H); ids.forEach((id, i) => S4.sheetChar(ctx, id, (i % cols + 0.5) * cw, (Math.floor(i / cols) + 1) * rh - 14, Math.min(cw, rh) * 0.86)); }]];
  CUT.fast = []; CUT.dark = []; CUT.bright = [];
}
const CUTS = CUT.cuts, FAST = CUT.fast, DARK = CUT.dark;
function segAt(t) { let i = 0; while (i + 1 < CUTS.length && CUTS[i + 1][0] <= t) i++; return i; }
const BLOOM = t => (DARK.some(([a, b]) => t >= a && t < b) ? 0.42 : CUT.bright.some(([a, b]) => t >= a && t < b) ? 0.1 : 0.06);

// Subtitles are written as they are sung: every character has its own time (analysis/lyrics_sync.json,
// measured on the isolated vocal). Lines that are already on screen as big lettering are skipped.
const PUNCT = new Set([...'　 ，。“”！？、']);
let SUBS = null;
function buildSubs(ctx) {
  SUBS = [];
  ctx.save(); ctx.font = font(46, 600); ctx.letterSpacing = '6px';
  LY.lines.forEach((L, li) => {
    if (L.big) return;
    const items = [];
    let k = 0;
    [...L.text].forEach((ch, i) => items.push({ ch, x: ctx.measureText(L.text.slice(0, i)).width, t: PUNCT.has(ch) ? null : L.t[k++] }));
    items.forEach((o, i) => {             // an opening quote arrives with the next character, anything else with the one before
      if (o.t !== null) return;
      const prev = items.slice(0, i).reverse().find(q => q.t !== null), next = items.slice(i + 1).find(q => q.t !== null);
      o.t = (o.ch === '“' || !prev) ? next.t : prev.t;
    });
    const next = LY.lines[li + 1], last = L.t[L.t.length - 1];
    SUBS.push({ items: items.filter(o => o.ch !== '　' && o.ch !== ' '), full: ctx.measureText(L.text).width, s: L.t[0],
      end: Math.min(L.end ?? last + 0.95, next ? next.t[0] - 0.12 : 1e9) });       // L.end: the last note is held (measured on the vocal)
  });
  ctx.restore();
}
function subtitle(ctx, t) {
  if (!SUBS) buildSubs(ctx);
  for (const L of SUBS) {
    if (t < L.s - 0.08 || t > L.end) continue;
    const out = 1 - sat(t, L.end - 0.2, L.end);
    const dark = DARK.some(([x, y]) => t >= x && t < y);
    const x0 = W / 2 - L.full / 2, y = 1010;
    ctx.save();
    ctx.save(); ctx.filter = 'blur(18px)'; ctx.globalAlpha = sat(t, L.s - 0.08, L.s + 0.12) * out * (dark ? 0.55 : 0.8); ctx.fillStyle = dark ? '#15121A' : '#FBF4E4';
    ctx.beginPath(); ctx.roundRect(x0 - 70, y - 40, L.full + 140, 80, 40); ctx.fill(); ctx.restore();
    ctx.font = font(46, 600); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.lineWidth = 8;
    ctx.strokeStyle = dark ? 'rgba(20,16,24,0.6)' : 'rgba(255,250,238,0.9)'; ctx.fillStyle = dark ? COL.cream : COL.ink;
    for (const pass of [0, 1]) for (const o of L.items) {
      if (t < o.t - 0.04) continue;                       // a touch early, so the character is there as the syllable lands
      ctx.globalAlpha = sat(t, o.t - 0.04, o.t + 0.04) * out;
      const dy = (1 - E.out(sat(t, o.t - 0.04, o.t + 0.1))) * 9;
      if (pass === 0) ctx.strokeText(o.ch, x0 + o.x, y + dy); else ctx.fillText(o.ch, x0 + o.x, y + dy);
    }
    ctx.restore();
  }
}

function reset(c) { c.setTransform(SS, 0, 0, SS, 0, 0); c.globalAlpha = 1; c.filter = 'none'; c.globalCompositeOperation = 'source-over'; c.shadowColor = 'transparent'; c.shadowBlur = 0; c.shadowOffsetX = 0; c.shadowOffsetY = 0; c.setLineDash([]); }
window.seek = (tv, q) => {
  tv = clamp(tv, 0, window.DUR - 1e-3);
  const t = tv + OFF;                               // scenes, lyrics and beats all run on song time
  let S = Math.max(1, q ?? Number(Q.get('q') || (RENDER ? 4 : 1)));
  if (S > 1) for (const [fa, fb, fq] of FAST) if (t >= fa && t < fb) S = Math.max(S, fq);
  const i = segAt(t), a = CUTS[i][0], b = (CUTS[i + 1] ? CUTS[i + 1][0] : window.DUR + OFF) - 1e-4;
  let src;                          // 后面 bloom 的取样源
  if (S === 1) {
    // 播放路径：一帧就是一幅画，直接画到可见画布，省掉 scene→acc→out 两次整屏拷贝
    reset(out); setCharTime(clamp(t, a, b)); CUTS[i][1](out, clamp(t, a, b));
    src = canvas;   // 注意：out 是 2d 上下文，画布本体是 canvas
  } else {
    reset(actx);
    for (let s = 0; s < S; s++) {
      const ts = clamp(t + ((s + 0.5) / S - 0.5) * (0.5 / window.FPS) * (S > 1 ? 1 : 0), a, b);
      setCharTime(ts);
      reset(sctx); sctx.save(); CUTS[i][1](sctx, ts); sctx.restore();
      actx.globalAlpha = 1 / (s + 1); actx.drawImage(scene, 0, 0, W, H);
    }
    reset(out); out.drawImage(acc, 0, 0, W, H);
    src = acc;
  }
  // Bloom. The small canvas is cleared every frame (it used to keep a rim of the previously rendered frame, so a
  // frame depended on what was drawn before it), and an overscanned copy underneath keeps the blur from fading at the edges.
  reset(smctx); smctx.clearRect(0, 0, W / 4, H / 4); smctx.filter = 'blur(7px)';
  smctx.drawImage(src, -16, -9, W / 4 + 32, H / 4 + 18); smctx.drawImage(src, 0, 0, W / 4, H / 4);
  out.globalCompositeOperation = 'screen'; out.globalAlpha = BLOOM(t); out.drawImage(small, 0, 0, W, H);
  reset(out);
  subtitle(out, t);
  if (tv > window.DUR - 0.9) { out.fillStyle = rgba(COL.paper, sat(tv, window.DUR - 0.9, window.DUR - 0.05)); out.fillRect(0, 0, W, H); }
};

window.__ready = (async () => {
  const f1 = new FontFace('Noto Serif SC', 'url(fonts/NotoSerifSC-VF.ttf)', { weight: '200 900' });
  const f2 = new FontFace('Noto Sans SC', 'url(fonts/NotoSansSC-VF.ttf)', { weight: '100 900' });
  await Promise.all([f1.load(), f2.load()]); document.fonts.add(f1); document.fonts.add(f2);
  TL = await (await fetch(CUT.timeline)).json();
  LY = await (await fetch(CUT.lyrics)).json();
  window.DUR = TL.duration - OFF; setBeats(TL.beats);
  await loadChars();
  window.seek(Number(Q.get('t') || 0));
  if (!RENDER) preview();
})();

function preview() {
  const au = new Audio(CUT.audio);
  window.__mvAudio = au;
  window.__mvOutTime = () => Math.max(0, au.currentTime - OFF);
  const hideStart = () => { const s = document.getElementById('start'); if (s) s.classList.add('hide'); };
  au.addEventListener('playing', hideStart);
  au.currentTime = Number(Q.get('t') || 0) + OFF;
  const hud = document.getElementById('hud');
  // 帧率：1 秒一个窗口；动态分辨率只在「播放满 3 秒 + 连续两个窗口都跑不满」时才降一档，
  // 免得起播那几帧（字体/贴图刚到位）被误判成慢机器。
  const DYN_ON = (() => { try { return localStorage.getItem('mv-dynres') !== '0'; } catch (e) { return true; } })();
  const DYN_ALLOWED = DYN_ON && (!Q.get('res') || Q.get('res') === 'auto');
  const TARGET = 58;
  let _fr = 0, _f0 = performance.now(), _fps = 0, _low = 0, _playT0 = 0, _last = 0, _dynTried = 0;
  const loop = (now) => {
    if (!au.paused) {
      if (!_playT0) _playT0 = now;
      window.seek(au.currentTime - OFF, 1);
      _fr++;
      if (now - _f0 >= 1000) {
        _fps = _fr * 1000 / (now - _f0); _fr = 0; _f0 = now;
        if (now - _playT0 > 3000 && !document.hidden) _low = _fps < 30 ? _low + 1 : 0;
      }
      if (now - _last > 250) {
        _last = now;
        hud.textContent = au.currentTime.toFixed(2) + ' s · ' + _fps.toFixed(0) + ' fps' +
          (Q.has('dyn') ? ' · 动态 ' + SS.toFixed(2) + '×' : '') + '  （点击暂停，←/→ 跳 5 秒）';
      }
      if (DYN_ALLOWED && _low >= 2 && _dynTried < 2 && SS > 0.52) {
        // 像素量与耗时近似成正比：按 sqrt(fps/目标) 估一个够用的倍率，一次降到位
        const want = Math.sqrt(Math.max(_fps, 8) / TARGET);
        const next = Math.max(0.5, Math.round(Math.min(SS - 0.05, SS * want) * 20) / 20);
        if (next < SS - 0.04) {
          _dynTried++;
          const p = new URLSearchParams(location.search);
          p.set('ss', String(next));
          p.set('dyn', '1');
          p.set('t', Math.max(0, au.currentTime - OFF).toFixed(2));
          p.set('autoplay', '1');
          location.search = p.toString();
          return;
        }
      }
    } else {
      hud.textContent = '点击画面播放';
    }
    requestAnimationFrame(loop);
  };
  canvas.addEventListener('click', () => (au.paused ? au.play() : au.pause()));
  addEventListener('keydown', e => { if (e.key === 'ArrowRight') au.currentTime += 5; if (e.key === 'ArrowLeft') au.currentTime -= 5; if (e.key === ' ') (au.paused ? au.play() : au.pause()); window.seek(au.currentTime - OFF, 1); });
  hud.textContent = '点击画面播放';
  // 换画质/自动续播：mv-quality.js 带 ?autoplay=1 重新进来时直接续上
  if (Q.has('autoplay')) { const p = au.play(); if (p && p.catch) p.catch(() => {}); }
  loop();
}
