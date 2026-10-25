/* 航天简史 · 播放层
 * 时间轴 = SCENES；逻辑 1920×1080；五档画质只改内部像素与帧率。
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
  '4k30':    { label: '4K 30',           k: 2, fps: 30 },
  '4k60':    { label: '4K 60',           k: 2, fps: 60 },
  '1080p30': { label: '1080P 30',        k: 1, fps: 30 },
  '720p30':  { label: '720P 30',         k: 2 / 3, fps: 30 },
};
let quality = '1080p60', targetFps = 60;

let OUT_K = 1;          // 画布倍率（用户选的画质）
let DYN_RES = true;     // 首页「动态分辨率」开关
try { DYN_RES = localStorage.getItem('mv-dynres') !== '0'; } catch (e) { }
let offCv = null, offG = null;
function invalidateRenderCaches() {
  _textCache.clear();
  if (typeof clearLayerCaches === 'function') clearLayerCaches();
  prevBuf = null; prevCache.clear();
}
function renderScaleMin() { return OUT_K >= 2 ? OUT_K * 0.6 : OUT_K * 0.85; }

function applyQuality(q, save) {
  const p = QUALITIES[q] ? q : '1080p60';
  quality = p; targetFps = QUALITIES[p].fps;
  OUT_K = QUALITIES[p].k;
  RS = OUT_K;
  invalidateRenderCaches();
  cv.width = Math.round(W * OUT_K);
  cv.height = Math.round(H * OUT_K);
  fitCanvas();
  if (save) { try { localStorage.setItem('hangtian-mv-q', p); } catch (e) { } }
  const sel = document.getElementById('q');
  if (sel && sel.value !== p) sel.value = p;
}

let tNow = 0, playing = false, useAudio = true;
let frames = 0, fps = 0, tFps = performance.now();
let ready = false;

const EDGE = 0.34; // 转场时长（秒）
let prevBuf = null;
const prevCache = new Map();

function sceneIndex(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}

// 上一镜最后一帧（离屏缓存）
function prevFrame(i) {
  if (i <= 0) return null;
  if (prevCache.has(i)) return prevCache.get(i);
  const psc = SCENES[i - 1];
  const pw = Math.round(W * RS), ph = Math.round(H * RS);
  if (!prevBuf || prevBuf.width !== pw || prevBuf.height !== ph) prevBuf = mk(pw, ph);
  const pg = prevBuf.getContext('2d');
  pg.setTransform(RS, 0, 0, RS, 0, 0);
  pg.globalAlpha = 1; pg.globalCompositeOperation = 'source-over';
  try { (ART[psc.scene] || ART.placeholder)(pg, psc.t1 - psc.t0 - 0.05, psc.t1 - psc.t0, psc.t1 - 0.02); }
  catch (err) { }
  prevCache.set(i, prevBuf);
  return prevBuf;
}

function activeLine(t) {
  for (const ln of LINES) if (t >= ln.t0 - 0.12 && t <= ln.t1 + 0.25) return ln;
  return null;
}

// ---------------------------------------------------------------- 动态分辨率
// 跑不满帧就把画面按更低的内部倍率画到离屏，再放大回画布；开关在首页「动态分辨率」。
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
  offG.fillStyle = '#03070d'; offG.fillRect(0, 0, W, H);
  return offG;
}
function endFrame(G) {
  if (G === g) return;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.imageSmoothingEnabled = true;
  g.drawImage(offCv, 0, 0, cv.width, cv.height);
}

// ---------------------------------------------------------------- 一帧
let lastScene = -1;
function drawFrame(t) {
  t = clamp(t, 0, DUR);
  const G = beginFrame(t);
  G.globalAlpha = 1;
  G.globalCompositeOperation = 'source-over';

  const i = sceneIndex(t);
  const sc = SCENES[i];
  const e = t - sc.t0;
  if (window.__ACTIVE_VIDS) window.__ACTIVE_VIDS.clear();

  G.save();
  try { (ART[sc.scene] || ART.placeholder)(G, e, sc.t1 - sc.t0, t); }
  catch (err) {
    console.log('art err', i, sc.scene, err && err.message);
    lastErr = sc.scene + ': ' + (err && err.message);
    bgBase(G, t);
  }
  G.restore();

  // 转场
  if (sc.trans && sc.trans !== 'cut' && e < EDGE) {
    const p = e / EDGE;
    if (sc.trans === 'flash') {
      flash(G, (1 - p) * 0.55);
    } else {
      const pb = prevFrame(i);
      transitionMask(G, pb, sc.trans, p);
    }
  }

  // 后期
  grain(G, t, 0.05);
  vignette(G, { a: 0.55, cy: 0.47 });
  scanlines(G, 0.02);

  // HUD
  hudStatic(G);
  timecode(G, t, sc.timeLabel || 'MISSION ELAPSED');
  watermark(G);
  progress(G, t, DUR);
  const sb = sc.sheet || [sc.scene.toUpperCase(), `SHEET ${pad2(i + 1)} · ${new Date(0, 0, 0, 0, Math.floor(t / 60), Math.floor(t % 60)).toTimeString().slice(3, 8)}`];
  sheetBlock(G, { lines: sb });

  // 字幕
  const ln = activeLine(t);
  if (ln) lyric(G, ln, t - ln.t0);

  endFrame(G);

  // 视频调度
  syncVideos(e);
}

function syncVideos(e) {
  if (window.__NO_VIDEO__) return;
  const act = window.__ACTIVE_VIDS || new Set();
  for (const k of Object.keys(ASSET_STATE.vids)) {
    const v = ASSET_STATE.vids[k];
    if (act.has(k)) {
      const dur = v.duration || 0;
      if (dur > 0.2 && e >= dur - 0.03) {
        if (!v.paused) { try { v.pause(); } catch (err) { } }
        continue;
      }
      if (v.paused) { try { v.play(); } catch (err) { } }
      if (dur > 0.2 && !v.seeking) {
        const want = Math.max(0, e);
        if (Math.abs(v.currentTime - want) > 0.9) { try { v.currentTime = want; } catch (err) { } }
      }
    } else if (!v.paused) { try { v.pause(); } catch (err) { } }
  }
}

let lastErr = '';
function drawSafe(t) {
  try { drawFrame(t); }
  catch (e) {
    lastErr = e.message + (e.stack ? '\n' + e.stack.split('\n').slice(0, 3).join('\n') : '');
    const el = document.getElementById('err');
    if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + lastErr; }
  }
}

// ---------------------------------------------------------------- 播放
let audioOff = false;
function markAudioOff(why) {
  audioOff = true; useAudio = false;
  if (btn) btn.title = '声音不可用：' + (why || 'audio error');
  if (audio) { try { audio.pause(); } catch (e) { } }
}
function setPlaying(v) {
  playing = v;
  if (btn) btn.textContent = playing ? 'PAUSE' : 'PLAY';
  if (playing) {
    if (useAudio && audio) {
      try {
        const seekTo = () => { try { if (Math.abs(audio.currentTime - tNow) > 0.06) audio.currentTime = tNow; } catch (e) { } };
        if (audio.readyState > 0) seekTo();
        else audio.addEventListener('loadedmetadata', seekTo, { once: true });
        const p = audio.play();
        if (p && p.catch) p.catch(err => markAudioOff(err && err.message));
      } catch (e) { markAudioOff(e && e.message); }
    }
  } else if (audio) { try { audio.pause(); } catch (e) { } }
  if (playing) document.body.classList.add('playing');
  else document.body.classList.remove('playing');
}

let lastDraw = 0, lastNow = 0;
let emaMs = 16, lastAdapt = 0, lastDrawn = 0, bootAt = 0;
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
    RS = Math.max(minR, RS * 0.85); invalidateRenderCaches(); lastAdapt = now;
  } else if (emaMs < 25 && RS < OUT_K - 0.001) {
    RS = Math.min(OUT_K, RS / 0.88); invalidateRenderCaches(); lastAdapt = now;
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
    // 音频当主时钟：不反复 seek，避免把声音打成鬼畜；音频不可用才退回墙钟
    const audioReady = useAudio && audio && !audio.paused && audio.readyState >= 3 && !audio.seeking;
    if (audioReady && audio.currentTime > 0) tNow = audio.currentTime;
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
  if (ready && sceneIndex(tNow) !== lastScene) {
    lastScene = sceneIndex(tNow);
    if (window.__ACTIVE_VIDS) {
      // 场景切换时把视频拨回开头
      for (const k of window.__ACTIVE_VIDS) {
        const v = ASSET_STATE.vids[k];
        if (v && Math.abs(v.currentTime) > 0.5) { try { v.currentTime = 0; } catch (e) { } }
      }
    }
  }
}

if (btn) btn.onclick = () => setPlaying(!playing);
if (scrub) scrub.oninput = () => { tNow = parseFloat(scrub.value) * DUR; if (useAudio && audio) audio.currentTime = tNow; };
addEventListener('keydown', ev => {
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!playing); }
  if (ev.code === 'ArrowRight') { tNow = Math.min(DUR, tNow + 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'ArrowLeft') { tNow = Math.max(0, tNow - 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'KeyM') { useAudio = !useAudio; if (!useAudio && audio) audio.pause(); }
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
  else { const saved = localStorage.getItem('hangtian-mv-q'); if (saved && QUALITIES[saved]) startQ = saved; }
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
}, 12000);
loadAssets((failed) => {
  ready = true;
  clearTimeout(readyTimer);
  const load = document.getElementById('load');
  if (load) load.style.display = 'none';
  drawSafe(tNow);
  if (location.search.includes('probe')) {
    document.title = `PROBE ${quality} ${cv.width}x${cv.height} assets=${ASSET_STATE.loaded}/${ASSET_STATE.total} err=${lastErr || 'none'}`;
  }
  if (location.search.includes('play')) setTimeout(() => setPlaying(true), 200);
  else if (!hasT) setTimeout(() => setPlaying(true), 200);
});

window.MV = {
  W, H, DUR, SCENES, LINES, QUALITIES, ASSETS,
  applyQuality, drawSafe, sceneIndex,
  seek: t => {
    tNow = t;
    if (useAudio && audio && audio.readyState > 0) { try { audio.currentTime = t; } catch (e) { } }
    drawSafe(t);
  },
  get lastErr() { return lastErr; },
  set lastErr(v) { lastErr = v; },
  get assets() { return ASSET_STATE; },
  get t() { return tNow; },
  set t(v) { tNow = v; },
};
