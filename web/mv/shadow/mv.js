/* 影子线 · 播放层
 * 时间轴 = 歌词行；换行即切卡（卡点）。画面全部实时生成。
 * 画布 1652×1080。地址参数：?t=40.5 定帧、?play 自动播、?clean 隐藏控制条、?q=4k30 画质。
 */
'use strict';

const DUR = 173.63;
const cv = document.getElementById('c');
const g = cv.getContext('2d', { alpha: false });
const audio = document.getElementById('a');
const info = document.getElementById('info');
const scrub = document.getElementById('scrub');
const btn = document.getElementById('play');

const ART_CX = W / 2, ART_CY = 412, ART_K = 1.18;

// ---------------------------------------------------------------- 画质档位
// 舞台逻辑尺寸固定 1652×1080；档位只改变画布内部像素与帧率上限。
const QUALITIES = {
  '1080p60': { label: '1080P 60 · 默认', k: 1, fps: 60 },
  '4k30':    { label: '4K 30',          k: 2, fps: 30 },
  '4k60':    { label: '4K 60',          k: 2, fps: 60 },
  '1080p30': { label: '1080P 30',       k: 1, fps: 30 },
  '720p30':  { label: '720P 30',        k: 2 / 3, fps: 30 },
};
let quality = '1080p60', targetFps = 60;

function applyQuality(q, save) {
  const p = QUALITIES[q] ? q : '1080p60';
  quality = p; targetFps = QUALITIES[p].fps;
  RS = QUALITIES[p].k;
  if (typeof _textCache !== 'undefined') _textCache.clear();
  cv.width = Math.round(W * RS);
  cv.height = Math.round(H * RS);
  fitCanvas();
  if (save) { try { localStorage.setItem('mv-q', p); } catch (e) { } }
  const sel = document.getElementById('q');
  if (sel && sel.value !== p) sel.value = p;
}
const LY_Y = 842;
let tNow = 0, playing = false, useAudio = true;
let frames = 0, fps = 60, tFps = performance.now();

function sceneIndex(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}

// ---------------------------------------------------------------- 背景
const BG = {};
function drawBG(t, sc) {
  g.fillStyle = '#05080d';
  g.fillRect(0, 0, W, H);
  // 底色：上部深海青，中心偏亮
  const gr = g.createRadialGradient(W * 0.5, H * 0.30, 0, W * 0.5, H * 0.30, Math.max(W, H) * 0.85);
  gr.addColorStop(0, 'rgba(26,54,62,0.26)');
  gr.addColorStop(0.45, 'rgba(11,21,27,0.20)');
  gr.addColorStop(1, 'rgba(2,4,6,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  // 地平线处的暖光：太阳在纸的下方
  const hz = g.createLinearGradient(0, H * 0.44, 0, H * 0.80);
  hz.addColorStop(0, 'rgba(150,104,56,0)');
  hz.addColorStop(0.58, 'rgba(150,104,56,0.11)');
  hz.addColorStop(1, 'rgba(90,60,30,0)');
  g.fillStyle = hz; g.fillRect(0, H * 0.44, W, H * 0.36);
  // 经纬网：全片同一张“纸”，缓慢漂移
  const gx = (t * 3.2) % 92, gy = (t * 1.1) % 78;
  g.save();
  g.strokeStyle = 'rgba(126,214,206,0.048)';
  g.lineWidth = 1;
  for (let x = -92 + gx; x < W + 92; x += 92) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
  for (let y = -78 + gy; y < H + 78; y += 78) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.restore();
  // 星野/纹理
  stars(g, t, { n: 210, alpha: 0.36, seed: 31 });
  // 底部压暗（保证歌词可读）
  const bd = g.createLinearGradient(0, H * 0.64, 0, H);
  bd.addColorStop(0, 'rgba(4,6,8,0)');
  bd.addColorStop(1, 'rgba(3,4,6,0.93)');
  g.fillStyle = bd; g.fillRect(0, H * 0.64, W, H * 0.36);
  // 顶部一点点压暗
  const td = g.createLinearGradient(0, 0, 0, 120);
  td.addColorStop(0, 'rgba(2,4,6,0.55)');
  td.addColorStop(1, 'rgba(2,4,6,0)');
  g.fillStyle = td; g.fillRect(0, 0, W, 120);
}

// ---------------------------------------------------------------- 卡片框
function drawCard(t, sc, e) {
  const m = 42;
  g.save();
  g.strokeStyle = 'rgba(126,214,206,0.17)';
  g.lineWidth = 1;
  g.strokeRect(m, m, W - m * 2, H - m * 2);
  // 四角刻线
  const L = 26;
  g.strokeStyle = 'rgba(240,200,140,0.48)'; g.lineWidth = 1.4;
  const corners = [[m, m, 1, 1], [W - m, m, -1, 1], [m, H - m, 1, -1], [W - m, H - m, -1, -1]];
  for (const [x, y, sx, sy] of corners) {
    g.beginPath(); g.moveTo(x, y + sy * L); g.lineTo(x, y); g.lineTo(x + sx * L, y); g.stroke();
  }
  // 顶栏
  cap(g, 'A SHADOW-LINE MV · 2026', m + 30, m + 30, { size: 9, ls: 2.8, color: 'rgba(196,230,224,0.40)', align: 'left' });
  text(g, 'The Shadow Line', m + 30, m + 56, { size: 22, weight: 400, font: FONT_SERIF, color: 'rgba(240,238,228,0.84)', glow: 6, glowColor: '#8fe6dc', align: 'left', italic: true });
  // 右上：章节 + 序号
  cap(g, sc.tag || '', W - m - 150, m + 36, { size: 10, ls: 2.4, color: 'rgba(146,226,214,0.58)', align: 'right' });
  const idx = sceneIndex(t) + 1;
  cap(g, String(idx).padStart(2, '0') + ' / ' + SCENES.length, W - m - 150, m + 60, { size: 10, ls: 2.2, color: 'rgba(232,212,182,0.30)', align: 'right' });
  // 全片进度（顶部细线）
  const pw = (W - m * 2) * clamp(t / DUR);
  g.save(); g.globalCompositeOperation = 'lighter';
  const pg = g.createLinearGradient(m, 0, m + W - m * 2, 0);
  pg.addColorStop(0, 'rgba(126,214,206,0.0)');
  pg.addColorStop(0.65, 'rgba(150,226,214,0.30)');
  pg.addColorStop(1, 'rgba(255,205,140,0.62)');
  g.fillStyle = pg; g.fillRect(m, m - 1, pw, 1.6);
  g.restore();
  g.restore();
}

// ---------------------------------------------------------------- 歌词
function drawLyric(t, sc, e) {
  if (!sc.cn) return;
  const dur = sc.t1 - sc.t0;
  const size = sc.cn.length >= 14 ? 50 : 56;
  const a = smooth(clamp(e / 0.16));
  const rise = (1 - a) * 14;
  // 词底柔光压暗
  g.save();
  const sh = g.createRadialGradient(W / 2, LY_Y + 6, 0, W / 2, LY_Y + 6, 620);
  sh.addColorStop(0, 'rgba(4,3,3,0.55)');
  sh.addColorStop(0.6, 'rgba(4,3,3,0.22)');
  sh.addColorStop(1, 'rgba(4,3,3,0)');
  g.save(); g.translate(W / 2, LY_Y + 6); g.scale(1, 0.30);
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 620, 0, 6.2832); g.fill();
  g.restore(); g.restore();

  text(g, sc.cn, W / 2, LY_Y + rise, {
    size, weight: 700, font: FONT_SERIF_CN, color: '#f6f1e4', glow: 9,
    glowColor: '#8fe6dc', alpha: a,
  });
  // 演唱进度：字下一条金线，随这一句唱完填满
  const tw = measureMixed(sc.cn, size, 700);
  const prog = smooth(clamp(e / Math.max(0.5, dur * 0.94)));
  const x0 = W / 2 - tw / 2, y0 = LY_Y + 48;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(170,224,214,0.26)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + tw, y0); g.stroke();
  g.shadowColor = '#ffcf8a'; g.shadowBlur = 6;
  const lg = g.createLinearGradient(x0, 0, x0 + tw, 0);
  lg.addColorStop(0, 'rgba(150,232,222,0.85)');
  lg.addColorStop(1, 'rgba(255,208,146,0.90)');
  g.strokeStyle = lg; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + tw * prog, y0); g.stroke();
  glowDot(g, x0 + tw * prog, y0, 1.6, { a: 0.55 * a });
  g.restore();
  if (sc.en) {
    text(g, sc.en, W / 2, LY_Y + 74, {
      size: 21, weight: 500, font: FONT_SERIF, color: 'rgba(168,222,214,0.94)', glow: 5, glowColor: '#8fe6dc',
      ls: 0.6, alpha: smooth(clamp((e - 0.10) / 0.32)),
    });
  }
}

// ---------------------------------------------------------------- 切卡
function cutFX(g2, t, e) {
  const k = clamp(e / 0.36);
  if (k >= 1) return;
  const p = 1 - k;
  // 横向光扫
  const x = -300 + (W + 600) * easeOut(k * 1.4);
  const gr = g2.createLinearGradient(x - 260, 0, x + 260, 0);
  gr.addColorStop(0, 'rgba(255,214,160,0)');
  gr.addColorStop(0.5, `rgba(196,240,236,${0.11 * p})`);
  gr.addColorStop(1, 'rgba(255,214,160,0)');
  g2.save(); g2.globalCompositeOperation = 'lighter'; g2.fillStyle = gr;
  g2.fillRect(0, 0, W, H); g2.restore();
  // 开头 0.12s 的曝光闪
  if (e < 0.10) {
    g2.save(); g2.globalCompositeOperation = 'lighter';
    g2.fillStyle = `rgba(255,235,205,${0.055 * (1 - e / 0.10)})`;
    g2.fillRect(0, 0, W, H); g2.restore();
  }
}

// ---------------------------------------------------------------- 一帧
function drawFrame(t) {
  t = clamp(t, 0, DUR);
  g.setTransform(RS, 0, 0, RS, 0, 0);
  const i = sceneIndex(t);
  const sc = SCENES[i];
  const e = t - sc.t0;
  const dur = sc.t1 - sc.t0;
  drawBG(t, sc);

  // 画面
  const k = easeOut(clamp(e / 0.22));
  g.save();
  const br = Math.sin(t * 0.75) * 0.004 + Math.sin(t * 0.31) * 0.003;
  g.translate(ART_CX + Math.sin(t * 0.19) * 2.2, ART_CY + (1 - k) * 18 + Math.sin(t * 0.27 + 1.3) * 2.4);
  const z = ART_K * (0.986 + 0.014 * k) * (1 + br);
  g.scale(z, z);
  g.globalAlpha = 0.28 + 0.72 * k;
  T_CUR = dur;
  try { sc.art(g, e, dur, t); } catch (err) { console.log('art err', i, err); }
  g.restore();

  cutFX(g, t, e);
  drawCard(t, sc, e);
  drawLyric(t, sc, e);

  // 后期
  bloom(g, t, 0.21 + (e < 0.3 ? 0.07 * (1 - e / 0.3) : 0));
  grain(g, t, 0.06);
  vignette(g, { a: 0.80, cy: 0.44 });
  atmosphere(g, t, { warm: 0.34 });
}

let lastErr = '';
function drawSafe(t) {
  try { drawFrame(t); }
  catch (e) {
    lastErr = e.message;
    const el = document.getElementById('err');
    if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + e.message + '\n' + (e.stack || ''); }
  }
}

// ---------------------------------------------------------------- 播放
function setPlaying(v) {
  playing = v;
  btn.textContent = playing ? 'PAUSE' : 'PLAY';
  if (useAudio && audio) {
    if (playing) {
      try { audio.currentTime = tNow; } catch (e) { }
      const p = audio.play();
      if (p && p.catch) p.catch(() => { playing = false; btn.textContent = 'PLAY'; document.body.classList.remove('playing'); });
    } else audio.pause();
  }
  if (playing) document.body.classList.add('playing');
  else document.body.classList.remove('playing');
}

let lastDraw = 0, lastNow = 0;
function loop() {
  requestAnimationFrame(loop);
  const nowMs = performance.now();
  const dt = lastNow ? Math.min(0.1, (nowMs - lastNow) / 1000) : 1 / 60;
  lastNow = nowMs;
  if (nowMs - lastDraw < 1000 / targetFps - 1.2) return; // 限帧
  lastDraw = nowMs;
  if (playing) {
    if (useAudio && audio && !audio.paused && audio.readyState > 2) tNow = audio.currentTime;
    else tNow += dt;
  }
  if (tNow > DUR) { tNow = 0; if (playing) { try { audio.currentTime = 0; } catch (e) { } } }
  drawSafe(tNow);
  frames++;
  const now = performance.now();
  if (now - tFps > 500) {
    fps = frames * 1000 / (now - tFps); frames = 0; tFps = now;
    info.textContent = `${tNow.toFixed(2)}s · ${Math.round(W * RS)}×${Math.round(H * RS)} · ${fps.toFixed(0)}fps`;
    document.title = `t=${tNow.toFixed(1)} sc=${sceneIndex(tNow) + 1}`;
  }
  scrub.value = String(tNow / DUR);
}

btn.onclick = () => setPlaying(!playing);
scrub.oninput = () => { tNow = parseFloat(scrub.value) * DUR; if (useAudio && audio) audio.currentTime = tNow; };
addEventListener('keydown', ev => {
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!playing); }
  if (ev.code === 'ArrowRight') { tNow = Math.min(DUR, tNow + 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'ArrowLeft') { tNow = Math.max(0, tNow - 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'KeyM') { useAudio = !useAudio; }
});
let showT = 0;
document.addEventListener('click', ev => {
  if (ev.target.closest && ev.target.closest('#bar')) return;
  if (!playing) { setPlaying(true); return; }
  document.body.classList.add('showbar');
  clearTimeout(showT);
  showT = setTimeout(() => document.body.classList.remove('showbar'), 3200);
});

// 远程调帧：cmd.json 里给 v（版本号变了就重载）和 t（定帧）
let startV = null;
async function pollCmd() {
  try {
    const r = await fetch('cmd.json?' + Date.now());
    const j = await r.json();
    if (j.v !== undefined) {
      if (startV === null) startV = String(j.v);
      else if (String(j.v) !== startV) { location.replace(location.pathname + '?r=' + Date.now()); return; }
    }
    if (typeof j.t === 'number' && Math.abs(j.t - tNow) > 0.01) { tNow = j.t; if (useAudio && audio) audio.currentTime = j.t; }
    if (j.play === true && !playing) setPlaying(true);
    if (j.play === false && playing) setPlaying(false);
    if (j.clean !== undefined) document.body.classList.toggle('clean', !!j.clean); fitCanvas();
  } catch (e) { }
  setTimeout(pollCmd, 500);
}

addEventListener('error', ev => {
  const el = document.getElementById('err');
  if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + (ev.message || ''); }
});

// 画布自适应：按窗口等比缩放，四周留黑（不依赖 CSS 的 max-width/height）
function fitCanvas() {
  const clean = document.body.classList.contains('clean');
  const w = (window && window.innerWidth) || 1652;
  const h = ((window && window.innerHeight) || 1080) - (clean ? 0 : 46);
  const k = Math.min(w / W, h / H);
  if (cv && cv.style) {
    cv.style.width = Math.round(W * k) + 'px';
    cv.style.height = Math.round(H * k) + 'px';
  }
}
if (typeof addEventListener === 'function') addEventListener('resize', fitCanvas);

buildTextures();
initFX();
// 画质：?q=4k30 > localStorage > 默认 1080P60
const hasT0 = location.search.includes('t=');
if (hasT0) document.body.classList.add('still');
if (location.search.includes('clean')) document.body.classList.add('clean');
let startQ = '1080p60';
try {
  const m = location.search.match(/[?&]q=([a-z0-9]+)/i);
  if (m && QUALITIES[m[1].toLowerCase()]) startQ = m[1].toLowerCase();
  else { const saved = localStorage.getItem('mv-q'); if (saved && QUALITIES[saved]) startQ = saved; }
} catch (e) { }
applyQuality(startQ, false);
const qSel = document.getElementById('q');
if (qSel) qSel.addEventListener('change', () => applyQuality(qSel.value, true));
fitCanvas();
const hasT = location.search.includes('t=');
if (hasT) {
  const m = location.search.match(/[?&]t=([\d.]+)/);
  if (m) tNow = parseFloat(m[1]) || 0;
}
if (location.search.includes('play')) setTimeout(() => setPlaying(true), 400);
else if (!hasT) setTimeout(() => setPlaying(true), 350); // 先试自动播，被拦就等用户点；?t= 定帧不自动播
drawSafe(tNow);
loop();
if (!location.search.includes('norc')) pollCmd();


