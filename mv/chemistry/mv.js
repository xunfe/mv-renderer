/* 元素之歌 · 播放层
 * 时间轴 = SCENES；画布 1920×1080；五档画质只改内部像素与帧率上限。
 * 参数：?t=31.2 定帧、?play 自动播、?clean 隐藏控制条、?q=4k30 画质。
 */
'use strict';

const cv = document.getElementById('c');
const g = cv.getContext('2d', { alpha: false });
const audio = document.getElementById('a');
const info = document.getElementById('info');
const scrub = document.getElementById('scrub');
const btn = document.getElementById('play');

const QUALITIES = {
  '1080p60': { label: '1080P 60 · 默认', k: 1, fps: 60 },
  '4k30':    { label: '4K 30',          k: 2, fps: 30 },
  '4k60':    { label: '4K 60',          k: 2, fps: 60 },
  '1080p30': { label: '1080P 30',       k: 1, fps: 30 },
  '720p30':  { label: '720P 30',        k: 2 / 3, fps: 30 },
};
let quality = '1080p60', targetFps = 60;

let OUT_K = 1;          // 画布倍率（用户选的画质）
// 首页「动态分辨率」开关：开=跑不动自动降内部倍率（默认）；关=严格按所选分辨率
let DYN_RES = true;
try { DYN_RES = localStorage.getItem('mv-dynres') !== '0'; } catch (e) { }
// RS 由 engine.js 声明（渲染倍率），这里只做自适应调整
let offCv = null, offG = null;
function invalidateRenderCaches() {
  _textCache.clear();
  if (typeof clearLayerCaches === 'function') clearLayerCaches();
}

function applyQuality(q, save) {
  const p = QUALITIES[q] ? q : '1080p60';
  quality = p; targetFps = QUALITIES[p].fps;
  OUT_K = QUALITIES[p].k;
  RS = OUT_K;
  invalidateRenderCaches();
  cv.width = Math.round(W * OUT_K);
  cv.height = Math.round(H * OUT_K);
  fitCanvas();
  if (save) { try { localStorage.setItem('elem-mv-q', p); } catch (e) { } }
  const sel = document.getElementById('q');
  if (sel && sel.value !== p) sel.value = p;
}

let tNow = 0, playing = false, useAudio = true;
let frames = 0, fps = 0, tFps = performance.now();
let ready = false;

SCENES.forEach(sc => { sc.art = ART[sc.scene] || ART.placeholder; });

function sceneIndex(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}

// ---------------------------------------------------------------- 动态分辨率
// 4K 下整屏合成层数太多，GPU 供不上：画面按 RS 渲染，跑不动就悄悄降 RS，
// 最后一帧只多一次「小图放大」的动作，帧率就能顶住 60。
function renderScaleMin() { return OUT_K >= 2 ? OUT_K * 0.6 : OUT_K * 0.85; }
function beginFrame(t) {
  if (RS >= OUT_K - 0.01) {
    g.setTransform(RS, 0, 0, RS, 0, 0);
    return g;
  }
  const w = Math.round(W * RS), h = Math.round(H * RS);
  if (!offCv || offCv.width !== w || offCv.height !== h) {
    offCv = mk(w, h); offG = offCv.getContext('2d', { alpha: false });
  }
  offG.setTransform(RS, 0, 0, RS, 0, 0);
  offG.globalAlpha = 1; offG.globalCompositeOperation = 'source-over';
  offG.fillStyle = '#03060a'; offG.fillRect(0, 0, W, H);
  return offG;
}
function endFrame(G) {
  if (G === g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(offCv, 0, 0, cv.width, cv.height);
}

// ---------------------------------------------------------------- 一帧
function drawFrame(t) {
  t = clamp(t, 0, DUR);
  const G = beginFrame(t);
  G.globalAlpha = 1;
  G.globalCompositeOperation = 'source-over';
  const i = sceneIndex(t);
  const sc = SCENES[i];
  const e = t - sc.t0;
  // 场景
  G.save();
  try { sc.art(G, e, sc.t1 - sc.t0, t); }
  catch (err) {
    console.log('art err', i, sc.scene, err && err.message);
    if (window.MV) window.MV.lastErr = (sc.scene + ': ' + (err && err.message));
    bgInk(g, t, { ghost: '!' });
  }
  g.restore();

  // 切场景的光扫
  const k = clamp(e / 0.34);
  if (k < 1) {
    const x = -400 + (W + 800) * easeOut(k * 1.3);
    const gr = G.createLinearGradient(x - 300, 0, x + 300, 0);
    gr.addColorStop(0, 'rgba(255,214,160,0)');
    gr.addColorStop(0.5, `rgba(180,235,245,${0.10 * (1 - k)})`);
    gr.addColorStop(1, 'rgba(255,214,160,0)');
    G.save(); G.globalCompositeOperation = 'lighter'; G.fillStyle = gr;
    G.fillRect(0, 0, W, H); G.restore();
    if (e < 0.10) {
      G.save(); G.globalCompositeOperation = 'lighter';
      G.fillStyle = `rgba(255,238,208,${0.05 * (1 - e / 0.10)})`;
      G.fillRect(0, 0, W, H); G.restore();
    }
  }

  hudFrame(G, t, sc);
  lyric(G, sc, e);

  // 后期
  const bl = (sc.scene === 'naming' || sc.scene === 'book' || sc.scene === 'coda') ? 0.07 : 0.18;
  bloom(G, bl + (e < 0.3 ? 0.04 * (1 - e / 0.3) : 0));
  dust(G, t, { n: 55, alpha: 0.35, seed: 12 });
  grain(G, t, 0.055);
  vignette(G, { a: 0.82, cy: 0.45 });
  atmosphere(G, t, { warm: 0.45 });
  scanlines(G, 0.03);
  endFrame(G);
}

let lastErr = '';
function drawSafe(t) {
  try { drawFrame(t); }
  catch (e) {
    lastErr = e.message;
    const el = document.getElementById('err');
    if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + e.message + '\n' + (e.stack || ''); }
    if (window.MV) window.MV.lastErr = e.message;
  }
}

// ---------------------------------------------------------------- 播放
// 音频只是“伴奏”：解码失败、自动播放被拦、或宿主 WebView 没有 AAC，
// 都不能让画面停住。声音失败就退回墙钟计时。
let audioOff = false;
function markAudioOff(why) {
  audioOff = true;
  useAudio = false;
  if (btn) { btn.textContent = playing ? 'PAUSE' : 'PLAY'; btn.title = '声音不可用：' + (why || 'audio error'); }
  if (audio) { try { audio.pause(); } catch (e) { } }
}
function setPlaying(v) {
  playing = v;
  if (btn) btn.textContent = playing ? 'PAUSE' : 'PLAY';
  if (playing) {
    if (useAudio && audio) {
      try {
        audio.currentTime = tNow;
        const p = audio.play();
        if (p && p.catch) p.catch(err => markAudioOff(err && err.message));
      } catch (e) { markAudioOff(e && e.message); }
    }
  } else if (audio) {
    try { audio.pause(); } catch (e) { }
  }
  if (playing) document.body.classList.add('playing');
  else document.body.classList.remove('playing');
}

let lastDraw = 0, lastNow = 0;
// 自适应：连续偏慢就把渲染倍率往下调，稳了再慢慢升回去
let emaMs = 16, lastAdapt = 0, lastDrawn = 0;
let bootAt = 0;
function adaptResolution(frameMs) {
  if (!DYN_RES) {
    if (RS !== OUT_K) { RS = OUT_K; invalidateRenderCaches(); }
    return;
  }
  emaMs = emaMs * 0.86 + frameMs * 0.14;
  const now = performance.now();
  if (!bootAt) bootAt = now;
  if (now - bootAt < 2500) return;
  if (now - lastAdapt < 700) return;
  const minR = renderScaleMin();
  if (emaMs > 33.4 && RS > minR + 0.001) {
    RS = Math.max(minR, RS * 0.85);
    invalidateRenderCaches(); lastAdapt = now;
  } else if (emaMs < 25 && RS < OUT_K - 0.001) {
    RS = Math.min(OUT_K, RS / 0.88);
    invalidateRenderCaches(); lastAdapt = now;
  }
}
function loop() {
  requestAnimationFrame(loop);
  const nowMs = performance.now();
  const dt = lastNow ? Math.min(0.1, (nowMs - lastNow) / 1000) : 1 / 60;
  lastNow = nowMs;
  if (nowMs - lastDraw < 1000 / targetFps - 1.2) return;
  lastDraw = nowMs;
  if (playing) {
    if (useAudio && audio && !audio.paused && audio.readyState > 2) tNow = audio.currentTime;
    else tNow += dt;
  }
  if (tNow > DUR) { tNow = 0; if (playing) { try { audio.currentTime = 0; } catch (e) { } } }
  if (ready) drawSafe(tNow);
  if (lastDrawn) adaptResolution(nowMs - lastDrawn);
  lastDrawn = nowMs;
  frames++;
  if (nowMs - tFps > 500) {
    fps = frames * 1000 / (nowMs - tFps); frames = 0; tFps = nowMs;
    const scaleTip = RS < OUT_K - 0.01 ? ` · 内部 ${Math.round(W * RS)}×${Math.round(H * RS)}` : '';
    if (info) info.textContent = `${tNow.toFixed(2)}s · ${cv.width}×${cv.height}${scaleTip} · ${fps.toFixed(0)}fps${useAudio ? '' : ' · 无声'}`;
    document.title = `t=${tNow.toFixed(1)} · ${SCENES[sceneIndex(tNow)].scene}`;
  }
  if (scrub) scrub.value = String(tNow / DUR);
}

if (btn) btn.onclick = () => setPlaying(!playing);
if (scrub) scrub.oninput = () => { tNow = parseFloat(scrub.value) * DUR; if (useAudio && audio) audio.currentTime = tNow; };
addEventListener('keydown', ev => {
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!playing); }
  if (ev.code === 'ArrowRight') { tNow = Math.min(DUR, tNow + 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'ArrowLeft') { tNow = Math.max(0, tNow - 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'KeyM') { useAudio = !useAudio; }
  if (ev.code === 'KeyH') document.body.classList.toggle('clean');
});
let showT = 0;
document.addEventListener('click', ev => {
  if (ev.target.closest && ev.target.closest('#bar')) return;
  if (!playing) { setPlaying(true); return; }
  if (!useAudio) { useAudio = true; audioOff = false; setPlaying(true); return; }
  document.body.classList.add('showbar');
  clearTimeout(showT);
  showT = setTimeout(() => document.body.classList.remove('showbar'), 3200);
});

// 画面自适应
function fitCanvas() {
  const clean = document.body.classList.contains('clean');
  const w = (window && window.innerWidth) || W;
  const h = ((window && window.innerHeight) || H) - (clean ? 0 : 46);
  const k = Math.min(w / W, h / H);
  if (cv && cv.style) {
    cv.style.width = Math.round(W * k) + 'px';
    cv.style.height = Math.round(H * k) + 'px';
  }
}
addEventListener('resize', fitCanvas);

// ---------------------------------------------------------------- 启动
buildTextures();
initFX();
const hasT = location.search.includes('t=');
if (hasT) document.body.classList.add('still');
if (location.search.includes('clean')) document.body.classList.add('clean');
let startQ = '1080p60';
try {
  const m = location.search.match(/[?&]q=([a-z0-9]+)/i);
  if (m && QUALITIES[m[1].toLowerCase()]) startQ = m[1].toLowerCase();
  else { const saved = localStorage.getItem('elem-mv-q'); if (saved && QUALITIES[saved]) startQ = saved; }
} catch (e) { }
applyQuality(startQ, false);
fitCanvas();
const qSel = document.getElementById('q');
if (qSel) qSel.addEventListener('change', () => applyQuality(qSel.value, true));

let tStart = 0;
if (hasT) {
  const m = location.search.match(/[?&]t=([\d.]+)/);
  if (m) tStart = parseFloat(m[1]) || 0;
}
tNow = tStart;

// 先出一帧底色，再加载素材；素材再慢也不能永远卡在 LOADING
// 启动渲染循环（上一版漏了这一行：画面只画了第一帧，看起来像“无法播放”）
loop();
if (audio) audio.addEventListener('error', () => markAudioOff('audio element error'));
drawSafe(tNow);
let readyTimer = setTimeout(() => {
  if (!ready) {
    ready = true;
    const loadEl = document.getElementById('load');
    if (loadEl) loadEl.style.display = 'none';
    drawSafe(tNow);
  }
}, 10000);
loadAssets((failed) => {
  ready = true;
  clearTimeout(readyTimer);
  const load = document.getElementById('load');
  if (load) load.style.display = 'none';
  drawSafe(tNow);
  if (window.MV) window.MV.assets = { loaded: ASSET_STATE.loaded, failed: ASSET_STATE.failed };
  if (location.search.includes('probe')) {
    document.title = `PROBE ${quality} ${cv.width}x${cv.height} assets=${ASSET_STATE.loaded}/${ASSET_STATE.loaded + ASSET_STATE.failed.length} err=${lastErr || 'none'}`;
  }
  // 画面自己走：自动播放只负责“开始”，声音失败不影响
  if (location.search.includes('play')) setTimeout(() => setPlaying(true), 200);
  else if (!hasT) setTimeout(() => setPlaying(true), 200);
});

// 调试接口（离线截图/校验用）
window.MV = {
  W, H, DUR, SCENES, QUALITIES, DATA,
  applyQuality, drawSafe, sceneIndex,
  seek: t => { tNow = t; drawSafe(t); },
  get lastErr() { return lastErr; },
  set lastErr(v) { lastErr = v; },
  setRenderScale: v => { RS = Math.min(OUT_K, Math.max(renderScaleMin(), v)); invalidateRenderCaches(); },
  get renderScale() { return RS; },
  get assets() { return ASSET_STATE; },
  set assets(v) { },
};



