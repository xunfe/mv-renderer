/* 一封情书 · 播放层
 * 33 个镜头，一个镜头一句旁白；旁白逐字打出，关键词高亮。
 * 画布 1920×1080。地址参数：?t=40.5 定帧、?play 自动播、?clean 隐藏控制条。
 * 音乐：《开智小曲》112.8 BPM，小节 2.1277s，第一拍 0.365s。
 */
'use strict';

const DUR = 134.506;
const BEAT = 0.53191;
const BAR0 = 0.365;
const BAR = BEAT * 4;                    // 2.12766
const B = n => BAR0 + n * BAR;           // 第 n 小节起点

const cv = document.getElementById('c');
const g = cv.getContext('2d', { alpha: false });
const audio = document.getElementById('a');
const info = document.getElementById('info');
const scrub = document.getElementById('scrub');
const btn = document.getElementById('play');

const QUALITIES = {
  '1080p60': { label: '1080P 60 · 默认', k: 1, fps: 60 },
  '4k30': { label: '4K 30', k: 2, fps: 30 },
  '4k60': { label: '4K 60', k: 2, fps: 60 },
  '1080p30': { label: '1080P 30', k: 1, fps: 30 },
  '720p30': { label: '720P 30', k: 2 / 3, fps: 30 },
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

let tNow = 0, playing = false, useAudio = true;
let frames = 0, fps = 60, tFps = performance.now();

function sceneIndex(t) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].t0) return i;
  return 0;
}

// ---------------------------------------------------------------- 深海背景
function drawBG(t, sc) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#0c2233');
  gr.addColorStop(0.32, '#08141f');
  gr.addColorStop(0.72, '#050b13');
  gr.addColorStop(1, '#03070d');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);

  // 海面光（顶部中央，随时间呼吸）
  const lx = W * (0.5 + 0.04 * Math.sin(t * 0.13)), ly = -H * 0.10;
  const rg = g.createRadialGradient(lx, ly, 0, lx, ly, H * 0.95);
  rg.addColorStop(0, 'rgba(90,165,205,0.42)');
  rg.addColorStop(0.28, 'rgba(40,90,130,0.20)');
  rg.addColorStop(1, 'rgba(4,10,18,0)');
  g.fillStyle = rg; g.fillRect(0, 0, W, H);

  // 水下光柱
  g.save();
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 5; i++) {
    const x = W * (0.12 + i * 0.19) + Math.sin(t * 0.11 + i * 2.1) * 40;
    const wdt = 90 + i * 26;
    const a = 0.034 + 0.018 * Math.sin(t * 0.23 + i * 1.7);
    const lg = g.createLinearGradient(x, 0, x + wdt * 0.55, H);
    lg.addColorStop(0, `rgba(120,190,225,${a * 1.6})`);
    lg.addColorStop(0.55, `rgba(90,150,195,${a * 0.7})`);
    lg.addColorStop(1, 'rgba(40,80,120,0)');
    g.fillStyle = lg;
    g.beginPath();
    g.moveTo(x - wdt * 0.18, 0); g.lineTo(x + wdt * 0.18, 0);
    g.lineTo(x + wdt * 1.15, H); g.lineTo(x + wdt * 0.35, H);
    g.closePath(); g.fill();
  }
  g.restore();

  // 微尘
  dust(g, t, { n: 110, alpha: 0.6, size: 1.8, seed: 31, warm: false });

  // 水面波纹（顶部）
  g.save();
  g.globalCompositeOperation = 'lighter';
  g.strokeStyle = 'rgba(150,205,235,0.30)'; g.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const y0 = 30 + i * 26;
    g.globalAlpha = 0.05 + 0.05 * (1 - i / 7);
    g.beginPath();
    for (let x = 0; x <= W; x += 24) {
      const y = y0 + Math.sin(x * 0.006 + t * 0.8 + i * 1.4) * (7 - i * 0.7);
      x ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.stroke();
  }
  g.restore();

  // 底部压暗：字幕区
  const bd = g.createLinearGradient(0, H * 0.60, 0, H);
  bd.addColorStop(0, 'rgba(3,6,10,0)');
  bd.addColorStop(1, 'rgba(2,4,8,0.90)');
  g.fillStyle = bd; g.fillRect(0, H * 0.60, W, H * 0.40);

  // 场景色温
  if (sc && sc.tint) {
    g.save();
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = sc.tint; g.fillRect(0, 0, W, H);
    g.restore();
  }
}

// ---------------------------------------------------------------- 旁白字幕
const SUB = {
  size: 42, lh: 56, maxW: 1460,
  col: '#efe6d6', gold: '#ffcf8a', red: '#f0735e', hot: '#fff6e6',
  y: 952, x: W / 2,
};
function parseSub(text) {
  const out = [];
  const re = /\{(?:(\w):)?([^}]*)\}/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push({ s: text.slice(last, m.index), k: null });
    out.push({ s: m[2], k: m[1] || 'g' });
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push({ s: text.slice(last), k: null });
  return out;
}
const _cw = new Map();
function charW(ch, size) {
  const key = ch + '|' + size;
  let v = _cw.get(key);
  if (v === undefined) {
    g.save();
    g.font = `700 ${size}px ${FONT_SERIF_CN}`;
    v = g.measureText(ch).width;
    g.restore();
    _cw.set(key, v);
  }
  return v;
}
function drawSub(t, sc, e) {
  if (!sc || !sc.sub) return;
  const segs = sc._p || (sc._p = parseSub(sc.sub));
  const chars = [];
  for (const sg of segs) for (const ch of sg.s) chars.push({ ch, k: sg.k });
  const size = SUB.size;
  const lines = [[]];
  let lw = 0;
  for (const c of chars) {
    const w = charW(c.ch, size);
    c.w = w;
    if (lw + w > SUB.maxW && lines[lines.length - 1].length) { lines.push([]); lw = 0; }
    lines[lines.length - 1].push(c); lw += w;
  }
  const spd = 0.052;
  const shown = Math.floor(clamp((e - 0.16) / spd, 0, 400));
  const fadeOut = 1 - smooth(clamp((e - (sc.t1 - sc.t0 - 0.20)) / 0.20));
  if (fadeOut <= 0.01) return;

  const nLines = lines.length;
  const y0 = SUB.y - (nLines - 1) * SUB.lh;
  let idx = 0;
  // 底部柔光
  const sh = g.createRadialGradient(W / 2, y0 + 8, 0, W / 2, y0 + 8, 760);
  sh.addColorStop(0, 'rgba(2,4,8,0.62)');
  sh.addColorStop(0.55, 'rgba(2,4,8,0.26)');
  sh.addColorStop(1, 'rgba(2,4,8,0)');
  g.save(); g.translate(W / 2, y0 + 8); g.scale(1, 0.34);
  g.fillStyle = sh; g.beginPath(); g.arc(0, 0, 760, 0, 6.2832); g.fill();
  g.restore();

  g.save();
  g.translate(W / 2, 0);
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let li = 0; li < nLines; li++) {
    const line = lines[li];
    const total = line.reduce((a, c) => a + c.w, 0);
    let x = -total / 2;
    const y = y0 + li * SUB.lh;
    for (const c of line) {
      const on = idx < shown;
      if (on) {
        const age = (e - 0.16 - idx * spd);
        const k = smooth(clamp(age / 0.22));
        let col = SUB.col;
        if (c.k === 'g') col = SUB.gold;
        else if (c.k === 'r') col = SUB.red;
        else if (c.k === 'b') col = SUB.hot;
        g.font = `700 ${size}px ${FONT_SERIF_CN}`;
        g.globalAlpha = fadeOut * (c.k ? 1 : 0.94) * (0.35 + 0.65 * k);
        g.fillStyle = col;
        g.shadowColor = c.k === 'r' ? 'rgba(240,90,70,0.55)' : c.k ? 'rgba(255,190,110,0.5)' : 'rgba(0,0,0,0.6)';
        g.shadowBlur = c.k ? 14 : 6;
        g.fillText(c.ch, x + c.w / 2, y + (1 - k) * 7);
        g.shadowBlur = 0;
        if (c.k) {
          g.globalAlpha = fadeOut * 0.8 * k;
          g.fillStyle = c.k === 'r' ? 'rgba(240,90,70,0.75)' : 'rgba(255,200,130,0.7)';
          g.fillRect(x + c.w * 0.10, y + size * 0.60, c.w * 0.80, 2.4);
        }
      }
      x += c.w;
      idx++;
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- 切镜
function cutFX(t, e) {
  const k = clamp(e / 0.30);
  if (k >= 1) return;
  const p = 1 - k;
  g.save();
  g.globalCompositeOperation = 'lighter';
  const r = 200 + 900 * easeOut(k);
  const gr = g.createRadialGradient(W / 2, H * 0.44, r * 0.5, W / 2, H * 0.44, r);
  gr.addColorStop(0, 'rgba(150,210,240,0)');
  gr.addColorStop(0.72, `rgba(120,180,220,${0.05 * p})`);
  gr.addColorStop(1, 'rgba(120,180,220,0)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.restore();
  if (e < 0.09) {
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = `rgba(210,235,255,${0.035 * (1 - e / 0.09)})`;
    g.fillRect(0, 0, W, H); g.restore();
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

  T_CUR = dur;
  drawBG(t, sc);
  if (sc.bg) { try { sc.bg(g, e, t); } catch (err) { } }
  try { sc.art(g, e, dur, t); } catch (err) { console.log('art err', i, err); }

  cutFX(t, e);
  drawSub(t, sc, e);

  const qw = FX.q.width, qh = FX.q.height;
  FX.qg.filter = 'none';
  FX.qg.clearRect(0, 0, qw, qh);
  FX.qg.drawImage(g.canvas, 0, 0, qw, qh);
  bloom(g, t, 0.22);
  grain(g, t, 0.05);
  vignette(g, { a: 0.60, cy: 0.46 });
  atmosphere(g, t, { warm: 0.50 });
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
  if (btn) btn.textContent = playing ? 'PAUSE' : 'PLAY';
  if (useAudio && audio) {
    if (playing) {
      try { audio.currentTime = tNow; } catch (e) { }
      const p = audio.play();
      if (p && p.catch) p.catch(() => { playing = false; if (btn) btn.textContent = 'PLAY'; document.body.classList.remove('playing'); });
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
  if (nowMs - lastDraw < 1000 / targetFps - 1.2) return;
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
    if (info) info.textContent = `${tNow.toFixed(2)}s · ${Math.round(W * RS)}×${Math.round(H * RS)} · ${fps.toFixed(0)}fps`;
    document.title = `t=${tNow.toFixed(1)} · ${sceneIndex(tNow) + 1}/${SCENES.length}`;
  }
  if (scrub) scrub.value = String(tNow / DUR);
}

if (btn) btn.onclick = () => setPlaying(!playing);
if (scrub) scrub.oninput = () => { tNow = parseFloat(scrub.value) * DUR; if (useAudio && audio) audio.currentTime = tNow; };
if (typeof addEventListener === 'function') addEventListener('keydown', ev => {
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!playing); }
  if (ev.code === 'ArrowRight') { tNow = Math.min(DUR, tNow + 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'ArrowLeft') { tNow = Math.max(0, tNow - 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'KeyM') { useAudio = !useAudio; }
});
let showT = 0;
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('click', ev => {
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

if (typeof addEventListener === 'function') addEventListener('error', ev => {
  const el = document.getElementById('err');
  if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + (ev.message || ''); }
});

function fitCanvas() {
  const clean = document.body.classList.contains('clean');
  const w = (window && window.innerWidth) || 1920;
  const h = ((window && window.innerHeight) || 1080) - (clean ? 0 : 46);
  const k = Math.min(w / W, h / H);
  if (cv && cv.style) {
    cv.style.width = Math.round(W * k) + 'px';
    cv.style.height = Math.round(H * k) + 'px';
  }
}

buildTextures();
initFX();
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
if (location.search.includes('t=')) {
  const m = location.search.match(/[?&]t=([\d.]+)/);
  if (m) tNow = parseFloat(m[1]) || 0;
}
if (!location.search.includes('norc')) setTimeout(() => setPlaying(true), 350);
drawSafe(tNow);
loop();
if (!location.search.includes('norc')) pollCmd();
