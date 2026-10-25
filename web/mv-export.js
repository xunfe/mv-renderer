/* mv-export.js — MV 渲染器 · 渲染输出（预渲染为 MP4 并导出）
 *
 * 由 AssetServer 注入到每一张 MV 页面（内置 / R2 包 / 导入）。
 * 1) 清晰度旁边显示「已选档位 · 当前渲染分辨率 · fps」，自适应降档时同步显示实际分辨率；
 * 2) 播放键旁新增「⤓ 渲染输出」：从片头把整支 MV 渲染一遍，同时录成 MP4（H.264 + AAC）
 *    存进系统「下载」目录；提供激进 / 保守两档效率。
 */
(function () {
  'use strict';
  if (window.__mvxLoaded) return;
  window.__mvxLoaded = true;

  var JOB = 'mvx-job';
  var doc = document;
  var DEBUG = /mvxdebug/.test(location.search);
  function dlog(m) { if (!DEBUG) return; try { fetch('/log', { method: 'POST', body: '[mvx] ' + m }); } catch (e) {} }
  var LIMIT = parseFloat((/mvxlimit=([\d.]+)/.exec(location.search) || [])[1]) || 0;  // 调试用：只渲前 N 秒
  var seekDur = 0;
  var hudFps = 0;
  var state = { rec: null, chunks: [], stream: null, timer: null, t0: 0, dur: 0, running: false,
                mode: 'aggressive', fps: 60, bitrate: 12e6, restoringRaf: null, cancelled: false };

  /* ---------------- 基础工具 ---------------- */
  function ce(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function findCanvas() {
    var best = null, area = 0, cs = doc.querySelectorAll('canvas');
    for (var i = 0; i < cs.length; i++) {
      var c = cs[i], a = (c.width || 0) * (c.height || 0);
      if (a > area && (c.offsetWidth > 40 || c.offsetHeight > 40)) { area = a; best = c; }
    }
    return best;
  }
  function findAudio() {
    var cands = [window.__audioEl, window.__mvAudio, window.__pdAudio];
    for (var i = 0; i < cands.length; i++) {
      var a = cands[i];
      if (a && (a.src || a.currentSrc || (isFinite(a.duration) && a.duration > 0))) return a;
    }
    return doc.querySelector('audio[src]') || doc.querySelector('audio');
  }
  function findSelect() {
    var s = doc.getElementById('q');
    if (s && s.tagName === 'SELECT') return s;
    var list = doc.querySelectorAll('select');
    for (var i = 0; i < list.length; i++) {
      var o = list[i].options || [];
      for (var j = 0; j < o.length; j++) if (/P\s*\d|K\s*\d|\d{3,4}/i.test(o[j].textContent || '')) return list[i];
    }
    return null;
  }
  /** 720P 在这台设备上直接没画面：把页面下拉里的 720P 选项删掉 */
  function strip720() {
    var sel = findSelect();
    if (!sel) return;
    var removed = false, was720 = /720/.test(String(sel.value || ''));
    for (var i = sel.options.length - 1; i >= 0; i--) {
      var o = sel.options[i];
      if (/720/.test(o.value) || /720/.test(o.textContent || '')) { sel.remove(i); removed = true; }
    }
    if (!removed) return;
    if (was720 || !sel.value) {
      var mark = 'mvx-720-fixed';
      var done = false;
      try { done = sessionStorage.getItem(mark) === '1'; } catch (e) {}
      sel.selectedIndex = sel.options.length > 1 ? sel.options.length - 1 : 0;
      if (!done) {
        try { sessionStorage.setItem(mark, '1'); } catch (e) {}
        try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        toast('720P 档位已移除（这个分辨率在本机没有画面），已切到 ' + (sel.options[sel.selectedIndex] || {}).textContent, 4000);
      }
    }
  }

  function tiers() {
    var s = findSelect(), out = [];
    if (s) {
      for (var i = 0; i < s.options.length; i++) {
        var o = s.options[i];
        out.push({ v: o.value, t: (o.textContent || '').trim() });
      }
    }
    if (!out.length) out = [
      { v: '1080p60', t: '1080P 60' }, { v: '1080p30', t: '1080P 30' },
      { v: '720p30', t: '720P 30' }, { v: '4k30', t: '4K 30' }, { v: '4k60', t: '4K 60' }
    ];
    return out;
  }
  function tierFps(v) {
    var m = /(\d+)\s*$/.exec(String(v || ''));
    if (m) return Math.max(12, Math.min(120, parseInt(m[1], 10)));
    return 60;
  }
  function tierHeight(v) {
    var t = String(v || '').toLowerCase();
    if (/4k|2160/.test(t)) return 2160;
    if (/2k|1440/.test(t)) return 1440;
    var m = /(\d{3,4})/.exec(t);
    if (!m) return 1080;
    var n = parseInt(m[1], 10);
    if (n <= 720) return 720;
    if (n <= 1080) return 1080;
    if (n <= 1440) return 1440;
    return 2160;
  }
  function duration() {
    try { if (window.MV && isFinite(window.MV.DUR) && window.MV.DUR > 0) return window.MV.DUR; } catch (e) {}
    if (isFinite(window.DUR) && window.DUR > 0) return window.DUR;
    var a = findAudio();
    if (a && isFinite(a.duration) && a.duration > 0) return a.duration;
    var sc = doc.getElementById('scrub');
    if (sc) { var mx = parseFloat(sc.max); if (isFinite(mx) && mx > 0) return mx; }
    return 0;
  }
  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60), s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }
  function slug() {
    var p = location.pathname.replace(/\/+$/, '');
    var m = /\/(?:mv|custom\/[a-z0-9-]+(?:\/mv)?)\/([a-z0-9_-]+)/i.exec(location.pathname);
    var s = (m && m[1]) || p.split('/').pop() || 'mv';
    return String(s).replace(/[^A-Za-z0-9_-]/g, '') || 'mv';
  }
  function toast(msg, ms) {
    var t = doc.getElementById('mvx-toast');
    if (!t) {
      t = ce('div', null, '');
      t.id = 'mvx-toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:2147483200;' +
        'max-width:82vw;padding:11px 18px;border-radius:12px;background:rgba(14,16,20,.94);color:#f2ece2;' +
        'font:13px/1.5 ui-sans-serif,system-ui;border:1px solid rgba(255,120,50,.45);box-shadow:0 14px 40px rgba(0,0,0,.55);' +
        'white-space:pre-wrap;pointer-events:none;opacity:0;transition:opacity .25s';
      doc.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t.__h);
    t.__h = setTimeout(function () { t.style.opacity = '0'; }, ms || 4200);
  }

  /* ---------------- 样式 ---------------- */
  var css = ce('style');
  css.textContent = [
    '.mvx-hud{display:inline-flex;align-items:center;gap:8px;font:600 11px ui-monospace,monospace;',
    'letter-spacing:.04em;color:#dfe8ee;background:rgba(10,16,22,.72);border:1px solid rgba(140,200,230,.28);',
    'border-radius:999px;padding:4px 10px;white-space:nowrap}',
    '.mvx-hud .mvx-r{color:#8fd8ff}',
    '.mvx-hud .mvx-a{color:#ffb27a}',
    '.mvx-hud .mvx-f{color:#8ea3b0}',
    '.mvx-btn{appearance:none;cursor:pointer;border:1px solid rgba(255,150,80,.55);',
    'background:linear-gradient(180deg,rgba(255,122,42,.22),rgba(255,90,30,.12));color:#ffd9bd;',
    'font:700 11.5px ui-sans-serif,system-ui;letter-spacing:.06em;border-radius:999px;padding:7px 15px;',
    'display:inline-flex;align-items:center;gap:6px;white-space:nowrap;line-height:1}',
    '.mvx-btn:hover{border-color:#ff8a4a;color:#fff}',
    '.mvx-float{position:fixed;left:14px;bottom:64px;z-index:2147483000;display:flex;gap:8px;align-items:center}',
    '.mvx-mask{position:fixed;inset:0;z-index:2147483100;background:rgba(3,5,8,.7);backdrop-filter:blur(8px);',
    'display:flex;align-items:center;justify-content:center;padding:20px}',
    '.mvx-panel{width:min(480px,92vw);max-height:86vh;overflow:auto;background:linear-gradient(180deg,#12161c,#0b0e13);',
    'border:1px solid rgba(255,255,255,.14);border-radius:18px;padding:20px 20px 16px;color:#e9e4da;',
    'font:13px/1.6 ui-sans-serif,system-ui;box-shadow:0 30px 80px rgba(0,0,0,.65)}',
    '.mvx-panel h3{margin:0 0 10px;font:700 17px/1.3 "Noto Serif SC",serif;letter-spacing:.08em;color:#ffd0a8}',
    '.mvx-note{background:rgba(120,200,255,.08);border:1px solid rgba(120,200,255,.28);border-radius:12px;',
    'padding:9px 12px;color:#bfe4ff;font-size:12px;line-height:1.6;margin:0 0 12px}',
    '.mvx-warn{background:rgba(255,140,40,.09);border:1px solid rgba(255,140,40,.3);border-radius:12px;',
    'padding:10px 12px;color:#ffcfa8;font-size:12.2px;line-height:1.65;margin:0 0 14px}',
    '.mvx-row{display:flex;align-items:center;gap:10px;margin:10px 0}',
    '.mvx-row>label{flex:none;width:74px;color:#9fb2bf;font-size:12px;letter-spacing:.06em}',
    '.mvx-row select,.mvx-row input[type=text]{flex:1;min-width:0;background:#0a0f14;color:#e8f2f8;',
    'border:1px solid rgba(140,200,230,.3);border-radius:9px;padding:8px 10px;font:600 12px ui-sans-serif}',
    '.mvx-modes{flex:1;display:flex;gap:8px}',
    '.mvx-mode{flex:1;cursor:pointer;border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:9px 10px;',
    'background:rgba(255,255,255,.03);font-size:12px;line-height:1.45;color:#cfd8de}',
    '.mvx-mode.on{border-color:rgba(255,150,80,.75);background:rgba(255,130,40,.14);color:#ffd9bd}',
    '.mvx-mode b{display:block;font-size:12.5px;margin-bottom:2px;letter-spacing:.05em}',
    '.mvx-mode span{font-size:11px;opacity:.75;letter-spacing:0}',
    '.mvx-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:16px}',
    '.mvx-actions button{cursor:pointer;border-radius:10px;padding:9px 18px;font:600 12.5px ui-sans-serif;',
    'border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);color:#dfe6ea}',
    '.mvx-actions .go{border-color:#ff7a2a;background:linear-gradient(180deg,#ff7a2a,#e85e14);color:#fff}',
    '.mvx-prog{position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:2147483150;width:min(520px,92vw);',
    'background:rgba(12,15,20,.96);border:1px solid rgba(255,140,60,.4);border-radius:14px;padding:12px 14px;',
    'color:#f0e9dd;font:12px/1.5 ui-monospace,monospace;box-shadow:0 20px 60px rgba(0,0,0,.6)}',
    '.mvx-prog .line{display:flex;justify-content:space-between;gap:10px;margin-bottom:7px}',
    '.mvx-prog .bar{height:6px;border-radius:4px;background:rgba(255,255,255,.12);overflow:hidden}',
    '.mvx-prog .bar i{display:block;height:100%;width:0%;background:linear-gradient(90deg,#ff8a3a,#ffcf6a)}',
    '.mvx-prog .tiny{margin-top:7px;color:#9aa9b4;font-size:11px}',
    '.mvx-prog button{margin-top:9px;cursor:pointer;border-radius:8px;padding:5px 12px;font:600 11px ui-sans-serif;',
    'border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.06);color:#e5ebef}'
  ].join('');
  doc.head.appendChild(css);

  /* 只有 MV 页面（有画布）才挂 UI：首页 / 播放壳页不受影响 */
  function initUI() {
    /* ---------------- HUD：清晰度旁的档位显示 ---------------- */
    var hud = ce('div', 'mvx-hud');
    hud.innerHTML = '<span class="mvx-t">—</span><span class="mvx-r">—</span><span class="mvx-a"></span><span class="mvx-f"></span>';
    var hudT = hud.querySelector('.mvx-t'), hudR = hud.querySelector('.mvx-r'),
        hudA = hud.querySelector('.mvx-a'), hudF = hud.querySelector('.mvx-f');
    var sel0 = findSelect();
    if (sel0 && sel0.parentNode) sel0.parentNode.insertBefore(hud, sel0.nextSibling);
    else {
      var floatBar0 = ce('div', 'mvx-float');
      floatBar0.appendChild(hud);
      doc.body.appendChild(floatBar0);
    }

    var frames = 0, fpsLast = performance.now(), fpsNow = 0;
    (function tick(ts) {
      frames++;
      if (ts - fpsLast >= 500) { fpsNow = frames * 1000 / (ts - fpsLast); frames = 0; fpsLast = ts; hudFps = fpsNow; }
      requestAnimationFrame(tick);
    })(0);

    function paintHud() {
      var sel = findSelect(), cv = findCanvas();
      if (sel && sel.parentNode && hud && hud.parentNode && hud.parentNode !== sel.parentNode) sel.parentNode.insertBefore(hud, sel.nextSibling);
      var pb0 = doc.getElementById('play');
      if (pb0 && pb0.parentNode && btn && btn.parentNode && btn.parentNode !== pb0.parentNode) pb0.parentNode.insertBefore(btn, pb0.nextSibling);
      var tv = sel ? sel.value : '';
      var ttext = sel ? (sel.options[sel.selectedIndex] || {}).textContent : '当前档位';
      hudT.textContent = (ttext || tv || '—').replace(/\s+/g, ' ').trim();
      if (cv) {
        hudR.textContent = '实际 ' + cv.width + '×' + cv.height;
        var wantH = tierHeight(tv), gotH = Math.max(cv.width, cv.height);
        if (wantH && gotH < wantH * 0.92) {
          hudA.textContent = '自适应已生效';
          hudA.title = '自适应把内部渲染降到了 ' + cv.width + '×' + cv.height + '（你选的档位没变）';
        } else { hudA.textContent = ''; }
      }
      var ft = hudFps ? Math.round(hudFps) + 'fps' : '';
      if (adaptiveSlowMs > 0) ft += ' · 慢 ' + (adaptiveSlowMs / 1000).toFixed(1) + 's';
      if (!adaptiveAllowed()) ft += ' · 自适应关（顶栏开）';
      hudF.textContent = ft;
    }
    // 自适应降档后：下拉显示回用户原来的档位（只改显示，不触发重载）
    (function restoreKeep() {
      var keep = new URLSearchParams(location.search).get('mvxkeep');
      if (!keep) return;
      setTimeout(function () {
        var sel = findSelect();
        if (!sel) return;
        for (var i = 0; i < sel.options.length; i++) {
          if (sel.options[i].value === keep) { sel.value = keep; break; }
        }
        toast('自适应已生效：内部按 1080P60 渲染（你的画质选择没变）', 5000);
      }, 1200);
    })();

    setInterval(paintHud, 700);
    setInterval(strip720, 1500);
    paintHud();
    strip720();

    /* ---------------- 渲染输出按钮 ---------------- */
    var btn = ce('button', 'mvx-btn', '⤓ 渲染输出 MP4');
    btn.type = 'button';
    btn.title = '提前把这支 MV 渲染成 MP4 文件，存到系统下载目录';
    var playBtn = doc.getElementById('play');
    if (playBtn && playBtn.parentNode) playBtn.parentNode.insertBefore(btn, playBtn.nextSibling);
    else {
      var floatBar = doc.querySelector('.mvx-float');
      if (!floatBar) { floatBar = ce('div', 'mvx-float'); doc.body.appendChild(floatBar); }
      floatBar.appendChild(btn);
    }
    btn.addEventListener('click', function (e) { e.stopPropagation(); openDialog(); });
  }

  (function waitCanvas(n) {
    if (findCanvas()) { initUI(); return; }
    if (n <= 0) return;
    setTimeout(function () { waitCanvas(n - 1); }, 300);
  })(20);


  /* ---------------- 弹窗 ---------------- */
  var mask = null;
  function closeDialog() { if (mask && mask.parentNode) mask.parentNode.removeChild(mask); mask = null; }

  function openDialog() {
    var cv = findCanvas();
    if (!cv) { toast('这个页面没有可渲染的画布'); return; }
    var ts = tiers();
    var sel = findSelect();
    var cur = sel ? sel.value : ts[0].v;
    var dur = duration();
    closeDialog();
    mask = ce('div', 'mvx-mask');
    var panel = ce('div', 'mvx-panel');
    panel.innerHTML =
      '<h3>提前渲染为 MP4 并导出</h3>' +
      (canvasIsGL(cv) ? '<p class="mvx-note">这支 MV 是 WebGL 实时渲染，引擎只在播放时出帧，抓不到逐帧画面：只能边走边录（实时），两档耗时一致、结果相同。</p>' : '') +
      '<p class="mvx-warn">⚠ 渲染会把整支 MV 从头到尾跑一遍并实时编码成 MP4：<b>耗时约等于视频时长</b>' +
      '（本片 ' + (dur ? fmt(dur) : '未知') + '；保守档约再慢一倍），过程中 <b>CPU / GPU 持续满载，会明显发热、耗电较多</b>。' +
      '请确认电量充足（建议 30% 以上，或插着充电器），并让手机通风散热；渲染期间最好不要切到别的应用。</p>' +
      '<div class="mvx-row"><label>分辨率</label><select id="mvx-q">' +
      ts.map(function (x) { return '<option value="' + x.v + '"' + (x.v === cur ? ' selected' : '') + '>' + x.t + '</option>'; }).join('') +
      '</select></div>' +
      '<div class="mvx-row"><label>效率</label><div class="mvx-modes">' +
      '<div class="mvx-mode on" data-mode="aggressive"><b>激进 · 满负荷</b><span>逐帧全速渲染，最快，发热最高</span></div>' +
      '<div class="mvx-mode" data-mode="conservative"><b>保守 · 约 50%</b><span>同样逐帧渲染，只占一半时间，慢一倍但凉；散热条件不佳时选这个</span></div>' +
      '</div></div>' +
      '<div class="mvx-row"><label>文件名</label><input id="mvx-name" type="text" value="' + ('MV-' + slug() + '-' + (cur || 'auto')) + '"></div>' +
      '<div class="mvx-actions"><button type="button" class="mvx-cancel">取消</button>' +
      '<button type="button" class="go mvx-go">开始渲染</button></div>';
    mask.appendChild(panel);
    doc.body.appendChild(mask);
    var mode = 'aggressive';
    panel.querySelectorAll('.mvx-mode').forEach(function (m) {
      m.addEventListener('click', function () {
        mode = m.getAttribute('data-mode');
        panel.querySelectorAll('.mvx-mode').forEach(function (x) { x.classList.toggle('on', x === m); });
      });
    });
    panel.querySelector('.mvx-cancel').addEventListener('click', closeDialog);
    mask.addEventListener('click', function (e) { if (e.target === mask) closeDialog(); });
    panel.querySelector('.mvx-go').addEventListener('click', function () {
      var q = panel.querySelector('#mvx-q').value;
      var name = (panel.querySelector('#mvx-name').value || '').trim();
      closeDialog();
      beginWithTier(q, mode, name);
    });
  }

  /* ---------------- 换档（必要时重载页面） ---------------- */
  function pickTier(wanted) {
    var list = tiers();
    for (var i = 0; i < list.length; i++) if (list[i].v === wanted) return wanted;
    var wH = tierHeight(wanted), wF = tierFps(wanted), best = null, bestScore = 1e9;
    for (var k = 0; k < list.length; k++) {
      var sc = Math.abs(tierHeight(list[k].v) - wH) + Math.abs(tierFps(list[k].v) - wF) * 4;
      if (sc < bestScore) { bestScore = sc; best = list[k].v; }
    }
    return best || wanted;
  }

  function beginWithTier(tier, mode, name) {
    dlog('beginWithTier ' + tier + ' ' + mode);
    var sel = findSelect();
    tier = pickTier(tier);
    if (sel && tier && sel.value !== tier) {
      var cv0 = findCanvas(), w0 = cv0 ? cv0.width : 0, h0 = cv0 ? cv0.height : 0;
      var href0 = location.href;
      // 交给页面自己的切档逻辑：大部分 MV 是即时换渲染倍率，少数页面会自己重载
      try { sessionStorage.setItem(JOB, JSON.stringify({ tier: tier, mode: mode, name: name, t: Date.now() })); } catch (e) {}
      sel.value = tier;
      try { sel.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
      dlog('change tier ' + tier + ' from ' + w0 + 'x' + h0);
      setTimeout(function () {
        if (location.href !== href0) return;              // 页面自己重载 → 由 resume 接手
        try { sessionStorage.removeItem(JOB); } catch (e) {}
        var cv1 = findCanvas(), w1 = cv1 ? cv1.width : 0;
        if (w1 === w0) {
          toast('这个 MV 没有响应切档，按当前画质渲染：' + (cv1 ? cv1.width + '×' + cv1.height : '—'));
        }
        start(mode, name);
      }, 1100);
      return;
    }
    start(mode, name);
  }

  /* 重载后续跑 */
  (function resume() {
    var raw = null;
    try { raw = sessionStorage.getItem(JOB); } catch (e) {}
    if (!raw) return;
    var job = null;
    try { job = JSON.parse(raw); } catch (e) {}
    try { sessionStorage.removeItem(JOB); } catch (e) {}
    if (!job || !job.t || Date.now() - job.t > 60000) return;
    var wait = setInterval(function () {
      if (findCanvas() && document.readyState === 'complete') {
        clearInterval(wait);
        setTimeout(function () { start(job.mode, job.name); }, 900);
      }
    }, 250);
    setTimeout(function () { clearInterval(wait); }, 20000);
  })();

  /* ---------------- 编码 / 录制 ---------------- */
  function pickMime(withAudio) {
    var list = withAudio
      ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4',
         'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['video/mp4;codecs=avc1.42E01E', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];
    for (var i = 0; i < list.length; i++) {
      try { if (window.MediaRecorder && MediaRecorder.isTypeSupported(list[i])) return list[i]; } catch (e) {}
    }
    return '';
  }
  function bitrateFor(h, mode) {
    var b = h <= 720 ? 7e6 : h <= 1080 ? 14e6 : h <= 1440 ? 26e6 : 46e6;
    return Math.round(b * (mode === 'conservative' ? 0.6 : 1));
  }

  function throttleRaf(interval) {
    if (state.restoringRaf) return;
    var orig = window.requestAnimationFrame.bind(window);
    var wrapped = function (cb) {
      var last = 0;
      function tick(ts) {
        if (ts - last >= interval - 1) { last = ts; cb(ts); }
        else orig(tick);
      }
      return orig(tick);
    };
    window.requestAnimationFrame = wrapped;
    state.restoringRaf = function () { window.requestAnimationFrame = orig; state.restoringRaf = null; };
  }

  var progEl = null, progBar = null, progLine = null, progTiny = null;
  function showProgress() {
    progEl = ce('div', 'mvx-prog');
    progEl.innerHTML = '<div class="line"><b>渲染输出中…</b><span class="pct">0%</span></div>' +
      '<div class="bar"><i></i></div><div class="tiny">准备中…</div><button type="button">取消</button>';
    progBar = progEl.querySelector('.bar i');
    progLine = progEl.querySelector('.tiny');
    progEl.querySelector('button').addEventListener('click', function () {
      state.cancelled = true; stopRec(false);
    });
    doc.body.appendChild(progEl);
  }
  function hideProgress() { if (progEl && progEl.parentNode) progEl.parentNode.removeChild(progEl); progEl = null; }

  /* ---------------- 找逐帧能力（离线渲染用） ---------------- */
  function findSeek() {
    try {
      if (window.MV && typeof window.MV.seek === 'function') return function (t) { window.MV.seek(t); };
      if (typeof window.seek === 'function') return function (t) { window.seek(t); };
      if (typeof window.__pdSeek === 'function') return function (t) { window.__pdSeek(t); };
    } catch (e) {}
    var sc = doc.getElementById('scrub');
    if (sc) return function (t) {
      var d = seekDur || duration() || 1;
      sc.value = String(Math.max(0, Math.min(1, t / d)));
      try { sc.dispatchEvent(new Event('input', { bubbles: true })); } catch (e) {}
      if (typeof sc.oninput === 'function') { try { sc.oninput(); } catch (e) {} }
    };
    return null;
  }
  function restoreUrl() {
    if (!/mvxstep=1|mvxpreserve=1/.test(location.search)) return;
    try {
      var q = new URLSearchParams(location.search);
      q.delete('mvxstep'); q.delete('mvxpreserve');
      var s2 = q.toString();
      location.search = s2;
    } catch (e) {}
  }
  function canvasIsGL(cv) { try { return !!(cv.getContext('webgl2') || cv.getContext('webgl')); } catch (e) { return false; } }
  function nextPaint() { return new Promise(function (r) { requestAnimationFrame(function () { r(); }); }); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function outName(name, tier) {
    var base = (name || ('MV-' + slug())).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-');
    if (!/\.(mp4|webm)$/i.test(base)) base += '.mp4';
    return base;
  }
  function wallNow() { return new Date().getTime(); }

  /** WebGL 页面（P(doom)）必须真的在播才画帧：多方式尝试把它点起来，20 秒还不动就认输 */
  async function ensurePlaying(cv, audio, seek) {
    try { if (audio) { audio.muted = true; audio.volume = 0; } } catch (e) {}
    for (var round = 0; round < 10; round++) {
      var prev = null, moves = 0, t0r = wallNow();
      var audioPlaying = false;
      try { audioPlaying = !!(audio && !audio.paused && audio.currentTime > 0.01); } catch (e) {}
      if (!audioPlaying) {
        // 只在「没在播」时才点，避免把刚起的播放又点停（P(doom) 的点击是播放/暂停切换）
        try { var ap = audio && audio.play(); if (ap && ap.catch) ap.catch(function () {}); } catch (e) {}
        if (round === 0) { try { var st = doc.getElementById('start'); if (st) st.click(); } catch (e) {} }
        else if (round === 1) { try { var pb = doc.getElementById('play'); if (pb) pb.click(); } catch (e) {} }
        else if (round % 2 === 0) { try { cv.click(); } catch (e) {} }
      }
      while (wallNow() - t0r < 2200) {
        await nextPaint();
        var h = hashCanvas(cv);
        if (prev !== null && h.h !== prev) moves++;
        prev = h.h;
        if (moves >= 2) return true;
        await sleep(60);
      }
    }
    return false;
  }
  /** MV 当前播放到的秒数：优先用页面自己的时钟，其次音频 currentTime */
  function mvClock(audio, fallback) {
    // 播放中就用音频 currentTime：P(doom) 的 __pdTime 只是 seek 记录，播放时不动
    try { if (audio && !audio.paused && isFinite(audio.currentTime) && audio.currentTime > 0.02) return audio.currentTime; } catch (e) {}
    try { if (typeof window.__mvOutTime === 'function') { var t2 = window.__mvOutTime(); if (t2 > 0.02) return t2; } } catch (e) {}
    return fallback;
  }
  function paintProgress(done, total, t0) {
    var pct = total ? done / total * 100 : 0;
    if (progBar) progBar.style.width = pct.toFixed(1) + '%';
    if (!progEl) return;
    var p = progEl.querySelector('.pct'); if (p) p.textContent = pct.toFixed(0) + '%';
    var el = (wallNow() - t0) / 1000;
    var eta = done > 3 ? el / done * (total - done) : 0;
    if (progLine) progLine.textContent = done + ' / ' + total + ' 帧 · 已用 ' + fmt(el) + (eta ? ' · 剩余约 ' + fmt(eta) : '');
  }

  /* ---------------- 离线逐帧渲染：两档输出完全一致，只差快慢/发热 ---------------- */
  async function loadAudioBuffer() {
    var a = findAudio();
    if (!a) { dlog('audio element none'); return null; }
    var src = a.currentSrc || a.src;
    dlog('audio src=' + String(src).slice(0, 120));
    if (!src) return null;
    var r = await fetch(src, { cache: 'force-cache' });
    dlog('audio fetch ' + r.status + ' len=' + (r.headers.get('content-length') || '?'));
    if (!r.ok) return null;
    var buf = await r.arrayBuffer();
    var Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return null;
    var ctx = new Ctx();
    try { return await ctx.decodeAudioData(buf); } finally { try { ctx.close(); } catch (e) {} }
  }
  async function encodeAudio(ab, muxer, cfg, from, secs) {
    var sr = ab.sampleRate, ch = cfg.numberOfChannels;
    var start = Math.max(0, Math.floor(from * sr));
    var stop = Math.min(ab.length, start + Math.floor(secs * sr));
    var enc = new AudioEncoder({
      output: function (chunk, meta) { try { muxer.addAudioChunk(chunk, meta); } catch (e) {} },
      error: function (e) { dlog('aenc ' + e); }
    });
    enc.configure(cfg);
    var chans = [];
    for (var c = 0; c < ch; c++) chans.push(ab.getChannelData(Math.min(c, ab.numberOfChannels - 1)));
    var CHUNK = 1024;
    for (var off = start; off < stop; off += CHUNK) {
      var n = Math.min(CHUNK, stop - off);
      var inter = new Float32Array(n * ch);
      for (var i = 0; i < n; i++) for (var c2 = 0; c2 < ch; c2++) inter[i * ch + c2] = chans[c2][off + i];
      var ad = new AudioData({
        format: 'f32', sampleRate: sr, numberOfFrames: n, numberOfChannels: ch,
        timestamp: Math.round((off - start) / sr * 1e6),
        data: inter
      });
      enc.encode(ad); ad.close();
      if (enc.encodeQueueSize > 20) await sleep(2);
    }
    await enc.flush(); enc.close();
    return true;
  }

  async function waitDuration(ms) {
    var au0 = findAudio();
    if (au0 && !(isFinite(au0.duration) && au0.duration > 0)) { try { au0.load(); } catch (e) {} }
    var t0 = wallNow();
    while (wallNow() - t0 < ms) {
      var d = duration();
      if (d > 0) return d;
      await sleep(250);
    }
    return duration();
  }

  async function renderOffline(cv, seek, dur, fps, mode, name, tier) {
    var W = cv.width, H = cv.height;
    dlog('offline enter dur=' + dur + ' fps=' + fps);
    var ab0 = null;
    try { ab0 = await loadAudioBuffer(); } catch (e) { dlog('audio decode fail ' + e); }
    dlog('ab=' + (!!ab0) + ' aDur=' + (ab0 ? ab0.duration.toFixed(2) : '-'));
    if (!(dur > 0) && ab0) dur = ab0.duration;
    if (!(dur > 0)) dur = await waitDuration(5000);
    if (!(dur > 0)) throw new Error('拿不到视频时长');
    seekDur = dur;
    if (W % 2) W--; if (H % 2) H--;
    var secs = LIMIT ? Math.min(LIMIT, dur) : dur;
    var total = Math.max(1, Math.round(secs * fps));
    var ab = ab0;
    var audio = findAudio();
    var STEP0 = window.__mvxStep || null;
    // 音频起点偏移（world 这类页面 seek(t) 对应 audio t+OFF）
    var audioFrom = 0;
    if (!STEP0) {
      seek(0); await nextPaint();
      if (audio) { try { audioFrom = Math.max(0, Math.min(ab ? ab.duration - 1 : 0, audio.currentTime || 0)); } catch (e) {} }
    }
    if (mode === 'conservative') dlog('audioFrom=' + audioFrom);

    var audioCfg = null;
    if (ab && window.AudioEncoder) {
      audioCfg = { codec: 'mp4a.40.2', sampleRate: ab.sampleRate, numberOfChannels: Math.min(2, ab.numberOfChannels), bitrate: 160000 };
      try { var asup = await AudioEncoder.isConfigSupported(audioCfg); if (!asup.supported) audioCfg = null; } catch (e) { audioCfg = null; }
    }

    var file = outName(name, tier);
    var pending = 0, failed = null, writeChain = Promise.resolve(), sentBytes = 0;
    function pushChunk(data, position) {
      pending++;
      var blob = new Blob([data]);
      var url = '/__recWrite?pos=' + (position || 0);
      var tryWrite = function (n) {
        return fetch(url, { method: 'POST', body: blob }).then(function (r) {
          if (!r.ok) throw new Error('写盘失败 ' + r.status);
        }).catch(function (e) {
          if (n > 0) { return sleep(120).then(function () { return tryWrite(n - 1); }); }
          throw e;
        });
      };
      writeChain = writeChain.then(function () {
        return tryWrite(2).then(function () { sentBytes += data.byteLength; pending--; });
      }).catch(function (e) { failed = e; pending = Math.max(0, pending - 1); });
    }
    var muxer = new window.Mp4Muxer.Muxer({
      target: new window.Mp4Muxer.StreamTarget({ onData: pushChunk, chunked: true, chunkSize: 4 * 1024 * 1024 }),
      fastStart: false,
      video: { codec: 'avc', width: W, height: H, frameRate: fps },
      audio: audioCfg ? { codec: 'aac', sampleRate: audioCfg.sampleRate, numberOfChannels: audioCfg.numberOfChannels } : undefined,
      firstTimestampBehavior: 'offset'
    });

    dlog('muxer ready, begin ' + file);
    var rb = await fetch('/__recBegin?name=' + encodeURIComponent(file), { method: 'POST' });
    dlog('recBegin ' + rb.status);
    if (!rb.ok) throw new Error('开文件失败 ' + rb.status);

    var withAudio = false;
    if (audioCfg && ab) {
      try { await encodeAudio(ab, muxer, audioCfg, audioFrom, secs); withAudio = true; } catch (e) { dlog('audio encode fail ' + e); }
    }

    dlog('audio encoded=' + withAudio + ' total=' + total + ' secs=' + secs.toFixed(2));
    var cfg = { codec: 'avc1.640028', width: W, height: H, bitrate: state.bitrate, framerate: fps, avc: { format: 'avc' } };
    cfg.latencyMode = 'realtime';
    var bitCap = H >= 2000 ? 40e6 : (H >= 1300 ? 26e6 : 18e6);
    if (cfg.bitrate > bitCap) cfg.bitrate = bitCap;
    // H.264 level 跟分辨率绑定：640028=High@4.0(≤1080p) / 640032=5.0 / 640033=5.1 / 640034=5.2(4K60)
    var cands = [];
    if (H >= 2000) cands = ['avc1.640034', 'avc1.640033', 'avc1.640032', 'avc1.640028'];
    else if (H >= 1300) cands = ['avc1.640032', 'avc1.640033', 'avc1.640028'];
    else cands = ['avc1.640028', 'avc1.640032', 'avc1.4D4028', 'avc1.42E028'];
    var vsup = null, okCodec = null;
    for (var ci = 0; ci < cands.length; ci++) {
      cfg.codec = cands[ci];
      try { vsup = await VideoEncoder.isConfigSupported(cfg); } catch (e) { vsup = null; }
      dlog('vsup ' + cands[ci] + ' = ' + (vsup && vsup.supported));
      if (vsup && vsup.supported) { okCodec = cands[ci]; break; }
    }
    if (!okCodec) throw new Error('这台设备用 WebCodecs 编不了 ' + W + '×' + H + ' 的 H.264');
    cfg.codec = okCodec;
    // WebGL 页面（P(doom)）的绘制循环只在「播放中」才跑：静音播起来，渲染完再恢复
    if (isGL) {
      // P(doom) 这类：引擎只在「播放态」里出帧。先静音、再确认时钟在走，不动就点一下画布开始
      if (audio) { try { audio.muted = true; audio.volume = 0; var gp = audio.play(); if (gp && gp.catch) gp.catch(function () {}); } catch (e) {} }
      await sleep(350);
      var tA = (typeof window.__pdTime === 'function') ? window.__pdTime() : null;
      if (tA !== null) {
        await sleep(400);
        if (!(window.__pdTime() > tA + 0.01)) { try { cv.click(); } catch (e) {} await sleep(600); }
        dlog('gl clock ' + tA + ' -> ' + window.__pdTime());
      }
    }
    var enc = new VideoEncoder({
      output: function (chunk, meta) { try { muxer.addVideoChunk(chunk, meta); } catch (e) { dlog('mux ' + e); } },
      error: function (e) { dlog('venc ' + e); failed = e; }
    });
    enc.configure(cfg);
    var isGL = false;
    try { isGL = !!(cv.getContext('webgl2') || cv.getContext('webgl')); } catch (e) {}
    if (isGL) {
      // 取帧自检：WebGL 取不到画面（全黑）就别硬编，直接退回实时录制
      var probes = [], okProbe = false;
      for (var pi = 0; pi < 3; pi++) {
        if (!STEP) seek(Math.min(secs - 0.3, secs * (0.08 + pi * 0.3)));
        await waitFrame(); await waitFrame();
        var hh = hashCanvas(STEP ? glShot : cv);
        probes.push(Math.round(hh.avg));
        if (hh.std > 3) { okProbe = true; break; }
      }
      dlog('gl probe avg=' + probes.join(','));
      if (!okProbe) throw new Error('WebGL 画布取不到画面（全黑）');
    }


    dlog('render: ' + W + 'x' + H + ' gl=' + isGL + ' frames=' + total + ' mode=' + mode);
    var STEP = window.__mvxStep || null;
    // WebGL（P(doom)）：引擎只在播放时出帧 → 让它正常播放，我们按墙钟一帧帧截下来再自己编码
    var LIVE = (isGL && !STEP && !seek);
    async function waitFrame() { if (STEP) { STEP.pump(1 / fps); await sleep(0); } else { await nextPaint(); } }
    var glShot = null, glCtx = null;
    if (isGL || STEP) {
      // WebGL / 手动时钟模式：先 drawImage 到一块 2D 画布再取帧（直接取 WebGL 画布是黑帧）
      glShot = doc.createElement('canvas'); glShot.width = W; glShot.height = H;
      glCtx = glShot.getContext('2d', { alpha: false });
    }
    if (STEP) {
      if (audio) { try { STEP.audio(audio); } catch (e) {} }
      for (var wi = 0; wi < 120; wi++) { STEP.pump(1 / 60); if (wi % 20 === 0) await sleep(0); }
      dlog('step warmup done t=' + STEP.time().toFixed(2));
    }
    var glCtxLive = null;
    if (isGL && !LIVE && !STEP) {
      // P(doom)：seek(t) + 等两帧就能得到该时刻的画面（不必“播放”），先探一下黑不黑
      try { if (audio) audio.pause(); } catch (e) {}
      var okSeek = false, pT0 = wallNow(), pR = 0;
      while (wallNow() - pT0 < 20000) {
        try { seek(pR === 0 ? 0 : (pR * 2) % 40); } catch (e) {}
        await nextPaint(); await nextPaint();
        var pc = hashCanvas(cv);
        dlog('gl seek probe ' + pR + ' avg=' + pc.avg.toFixed(1) + ' std=' + pc.std.toFixed(1));
        if (pc.std > 3) { okSeek = true; break; }   // 有结构才算真的画出画面（纯底色 std≈0）
        var ap0 = false;
        try { ap0 = !!(audio && !audio.paused && audio.currentTime > 0.01); } catch (e) {}
        if (!ap0) {
          try { var a2 = audio && audio.play(); if (a2 && a2.catch) a2.catch(function () {}); } catch (e) {}
          if (pR % 3 === 0) { try { cv.click(); } catch (e) {} }
        }
        pR++;
        await sleep(500);
      }
      if (!okSeek) throw new Error('__notplaying__');
      try { if (audio) audio.pause(); } catch (e) {}
      try { seek(0); } catch (e) {}
      await nextPaint(); await nextPaint();
    }
    if (LIVE) {
      try { glCtxLive = cv.getContext('webgl2') || cv.getContext('webgl'); } catch (e) {}
      if (audio) { try { audio.addEventListener('ended', function () { state.pageEnded = true; }); } catch (e) {} }
      var started = await ensurePlaying(cv, audio, seek);
      dlog('live ensurePlaying=' + started);
      if (!started) throw new Error('__notplaying__');
      try { seek(0); } catch (e) {}
      if (audio) { try { audio.currentTime = 0; } catch (e) {} }
      await nextPaint();
    }
    var glMaxAvg = 0, liveMaxAvg = 0, lastTs = -1;
    var step = 1 / fps, t0 = wallNow(), frameCost = 16;
    for (var i = 0; i < total; i++) {
      if (state.cancelled) throw new Error('__cancelled__');
      if (failed) throw failed;
      var f0 = performance.now();
      if (LIVE) {
        // 时间戳用 MV 自己的时钟（不是墙钟）：编码慢就暂停播放等它，播放速度跟着渲染进度走
        var mt = mvClock(audio, (wallNow() - t0) / 1000);
        if (enc.encodeQueueSize > 6) {
          try { if (audio) audio.pause(); } catch (e) {}
          var guard = 0;
          while (enc.encodeQueueSize > 2 && guard++ < 400) await sleep(15);
          try { if (audio) { var rp = audio.play(); if (rp && rp.catch) rp.catch(function () {}); } } catch (e) {}
        }
        await nextPaint();
        // WebGL 可能还在光栅化：强制同步，保证读到的是完整一帧
        if (glCtxLive) { try { glCtxLive.finish(); } catch (e) {} }
        glCtx.drawImage(cv, 0, 0, W, H);
        var tsL = Math.round(Math.max(0, mt) * 1e6), durL = Math.round(1e6 / fps);
        if (tsL <= lastTs) tsL = lastTs + 1000;   // 时间戳必须单调递增（至少隔 1ms）
        lastTs = tsL;
        var vfL = new VideoFrame(glShot, { timestamp: tsL, duration: durL });
        enc.encode(vfL, { keyFrame: (i % (fps * 2) === 0) });
        vfL.close();
        if (i % 5 === 0 && i <= 60) {
          var hvL = hashCanvas(glShot);
          if (hvL.avg > liveMaxAvg) liveMaxAvg = hvL.avg;
          if (i === 60 && liveMaxAvg < 3) throw new Error('画面没有动（引擎没播放），改用实时录制');
        }
        // 快结束前先暂停：避免页面自己触发「播放完毕 → 返回合集」把保存掐断
        if (state.pageEnded || mt >= secs - 1.0) { try { if (audio) audio.pause(); } catch (e) {} break; }
        if (i % 8 === 0) paintProgress(i + 1, total, t0);
        while (pending > 6) await sleep(20);
        continue;
      }
      var ts0 = Math.round(i * 1e6 / fps), dur0 = Math.round(1e6 / fps);
      if (STEP) {
        await waitFrame();               // 推进虚拟时钟，跑一遍页面的 rAF（引擎画出这一帧）
        glCtx.drawImage(cv, 0, 0, W, H);
      } else {
        seek(i * step);
        await nextPaint();
        if (isGL) { await nextPaint(); glCtx.drawImage(cv, 0, 0, W, H); }
      }
      if (isGL && i % 5 === 0 && i <= 40) {
        var hv = hashCanvas(glShot);
        if (hv.avg > glMaxAvg) glMaxAvg = hv.avg;
        if (i === 40 && glMaxAvg < 3.5) throw new Error('WebGL 逐帧取到的是黑帧');
      }
      var vf = new VideoFrame((isGL || STEP) ? glShot : cv, { timestamp: ts0, duration: dur0 });
      enc.encode(vf, { keyFrame: i % (fps * 2) === 0 });
      vf.close();
      while (enc.encodeQueueSize > 8) await sleep(3);
      while (pending > 6) await sleep(20);
      frameCost = frameCost * 0.9 + (performance.now() - f0) * 0.1;
      // 保守：每渲一帧歇掉约等量时间 → 占用降到一半左右，输出完全一样，只是更慢更凉
      if (mode === 'conservative') await sleep(Math.min(140, Math.max(3, frameCost * 0.9)));
      if (i % 8 === 0) paintProgress(i + 1, total, t0);
      if (i % 30 === 0) dlog('frame ' + i + ' q=' + enc.encodeQueueSize + ' pend=' + pending + ' fail=' + !!failed);
    }
    await enc.flush(); enc.close();
    muxer.finalize();
    await writeChain;
    var waited = 0;
    while (pending > 0 && !failed && waited < 180000) { await sleep(50); waited += 50; }
    if (failed) throw failed;
    if (pending > 0) throw new Error('还有 ' + pending + ' 块数据没写完，已放弃保存');
    if ((isGL || LIVE) && audio) { try { audio.pause(); audio.muted = false; audio.volume = 1; } catch (e) {} }
    dlog('all chunks written bytes=' + sentBytes);
    var re = await fetch('/__recEnd?name=' + encodeURIComponent(file) + '&expect=' + sentBytes, { method: 'POST' });
    var txt = await re.text();
    try {
      var rj = JSON.parse(txt);
      if (rj && rj.bytes != null && sentBytes && Math.abs(rj.bytes - sentBytes) > 1024) {
        throw new Error('文件大小不一致（写 ' + sentBytes + ' / 存 ' + rj.bytes + '）');
      }
    } catch (e) {
      if (String(e && e.message || '').indexOf('文件大小不一致') === 0) throw e;
    }
    try { fetch('/__keepawake?on=0'); } catch (e) {}
    hideProgress();
    state.running = false;
    try { window.__mvxHold = false; } catch (e) {}
    if (STEP) setTimeout(restoreUrl, 1200);
    toast('✅ 渲染完成：' + file + '\n' + W + '×' + H + ' · ' + fps + 'fps · ' + (withAudio ? '含音轨' : '无音轨') +
      ' · ' + (mode === 'conservative' ? '保守档' : '激进档') + '\n已存到系统「下载」目录\n' + txt, 9000);
  }

  /* ---------------- 派发：能离线就离线，不能就退回实时录制 ---------------- */
  function start(mode, name) {
    dlog('start mode=' + mode + ' step=' + !!window.__mvxStep + ' seek=' + !!findSeek() + ' gl=' + canvasIsGL(findCanvas()));
    if (state.running) return;
    var cv = findCanvas();
    if (!cv) { toast('找不到画布，无法渲染'); return; }
    var dur = duration();
    var sel = findSelect();
    var tier = sel ? sel.value : '';
    var fps = Math.max(12, Math.min(60, tierFps(tier) || 60));
    state.running = true; state.cancelled = false; state.mode = mode;
    state.fps = fps; state.tier = tier;
    var h = Math.max(cv.width, cv.height) || 1080;
    state.bitrate = bitrateFor(h, 'aggressive');   // 两档同一码率：结果一致
    showProgress();
    try { window.__mvxHold = true; } catch (e) {}
    var seek = findSeek();
    if (window.VideoEncoder && window.Mp4Muxer && (seek || canvasIsGL(cv))) {
      try { fetch('/__keepawake?on=1'); } catch (e) {}
      var audio = findAudio(); if (audio) { try { audio.pause(); } catch (e) {} }
      renderOffline(cv, seek, dur, fps, mode, name, tier).catch(function (e) {
        if (String(e && e.message) === '__cancelled__') {
          try { fetch('/__keepawake?on=0'); } catch (e2) {}
          hideProgress(); state.running = false; try { window.__mvxHold = false; } catch (e3) {} toast('已取消渲染');
          return;
        }
        if (String(e && e.message) === '__notplaying__') {
          hideProgress(); state.running = false;
          try { window.__mvxHold = false; } catch (e5) {}
          try { fetch('/__keepawake?on=0'); } catch (e6) {}
          toast('MV 没有开始播放（画面一直是静止的），渲染已取消。\n请先在这支 MV 上点一下开始，再点渲染输出。', 8000);
          return;
        }
        dlog('offline fail: ' + e);
        toast('逐帧编码不可用，改用实时录制：' + (e && e.message || e), 6000);
        state.running = false; hideProgress();
        try { window.__mvxHold = false; } catch (e4) {}
        fallbackRealtime(cv, mode, name);
      });
      return;
    }
    fallbackRealtime(cv, mode, name);
  }

  function fallbackRealtime(cv, mode, name) {
    if (state.running) return;
    var audio = findAudio();
    var dur = duration();
    state.running = true; state.cancelled = false; state.chunks = []; state.mode = mode;
    state.fps = Math.max(12, Math.min(60, state.fps || 60));
    state.tier = findSelect() ? findSelect().value : '';
    showProgress();
    try { if (window.MV && window.MV.seek) window.MV.seek(0); } catch (e) {}
    try { if (audio) audio.currentTime = 0; } catch (e) {}
    var st = doc.getElementById('start');
    if (st) { try { st.click(); } catch (e) {} }
    if (audio && audio.paused) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
    var autoPlay = /(^|[?&])play=1/.test(location.search);
    var playing = doc.body.classList.contains('playing');
    if (!autoPlay && !playing && audio && audio.paused) { try { cv.click(); } catch (e) {} }
    waitReady(cv, function () { actuallyStart(cv, audio, dur, mode, name, state.tier); });
  }

  function hashCanvas(cv) {
    try {
      var g = doc.createElement('canvas'); g.width = 48; g.height = 27;
      var x = g.getContext('2d'); x.drawImage(cv, 0, 0, 48, 27);
      var d = x.getImageData(0, 0, 48, 27).data, h = 0, sum = 0, n = d.length / 4, vals = [];
      for (var i = 0; i < d.length; i += 4) {
        var v = (d[i] + d[i + 1] + d[i + 2]) / 3;
        h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0;
        sum += v; vals.push(v);
      }
      var avg = sum / n, vr = 0;
      for (var k = 0; k < vals.length; k++) { var dd = vals[k] - avg; vr += dd * dd; }
      return { h: h, avg: avg, std: Math.sqrt(vr / n) };
    } catch (e) { return { h: -1, avg: -1, std: -1 }; }
  }
  function waitReady(cv, cb) {
    var t0 = performance.now(), prev = null, moves = 0;
    (function poll() {
      var cur = hashCanvas(cv);
      var el = performance.now() - t0;
      if (prev && cur.h !== prev.h && cur.avg > 3) moves++;
      prev = cur;
      if (moves >= 2 || el > 15000) { dlog('ready after ' + Math.round(el) + 'ms moves=' + moves); cb(); return; }
      setTimeout(poll, 250);
    })();
  }

  function actuallyStart(cv, audio, dur, mode, name, tier) {
    var withAudio = false, astream = null;
    dlog('actuallyStart cv=' + cv.width + 'x' + cv.height + ' fps=' + state.fps + ' audio=' + !!audio);
    // 音频轨只有在「音频真的在放」时才加：没数据的音轨会让 MP4 复用器把视频也截断
    if (audio) {
      try {
        if (audio.paused) { var pp = audio.play(); if (pp && pp.catch) pp.catch(function () {}); }
      } catch (e) {}
      var okAudio = !audio.paused && audio.readyState >= 2;
      if (okAudio) {
        try {
          if (typeof audio.captureStream === 'function') {
            astream = audio.captureStream();
            withAudio = astream.getAudioTracks().length > 0;
          }
        } catch (e) { dlog('audio captureStream err ' + e); }
      } else {
        dlog('audio not playing -> video only');
      }
    }
    state.withAudio = withAudio;
    var mime = pickMime(withAudio);
    if (!mime) {
      state.running = false;
      if (state.restoringRaf) state.restoringRaf();
      hideProgress();
      toast('这台设备的 WebView 既不支持 MP4 也不支持 WebM 录制，无法输出');
      return;
    }
    var stream;
    try { stream = cv.captureStream(state.fps); }
    catch (e) { state.running = false; hideProgress(); toast('拿不到画布流：' + e.message); return; }
    if (astream) astream.getAudioTracks().forEach(function (t) { stream.addTrack(t); });

    state.stream = stream;
    state.t0 = performance.now();
    state.dur = dur;
    try {
      state.rec = new MediaRecorder(stream, {
        mimeType: mime,
        videoBitsPerSecond: state.bitrate,
        audioBitsPerSecond: 128000
      });
    } catch (e) {
      state.running = false; hideProgress(); toast('MediaRecorder 起不来：' + e.message); return;
    }
    state.rec.ondataavailable = function (e) { if (e.data && e.data.size) state.chunks.push(e.data); };
    state.rec.onerror = function (e) { toast('录制出错：' + (e.error && e.error.message || 'unknown')); };
    state.rec.onstop = function () {
      try { fetch('/__keepawake?on=0'); } catch (e) {}
      if (state.restoringRaf) state.restoringRaf();
      if (state.cancelled) { state.chunks = []; hideProgress(); state.running = false; toast('已取消渲染'); return; }
      dlog('onstop chunks=' + state.chunks.length);
      save(name, mime);
    };

    try { fetch('/__keepawake?on=1'); } catch (e) {}
    if (audio) { try { audio.addEventListener('ended', function () { if (state.running) stopRec(true); }); } catch (e) {} }
    state.rec.start(1000);
    dlog('rec start mime=' + mime + ' withAudio=' + withAudio + ' dur=' + dur);
    var ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
    var info = (tier ? tier + ' · ' : '') + (mode === 'conservative' ? '保守' : '激进') +
      ' · ' + cv.width + '×' + cv.height + ' · ' + state.fps + 'fps · ' +
      (withAudio ? '含音轨' : '无音轨（音频没能播放）') + ' · ' + ext.toUpperCase();
    state.info = info;
    tickProgress();
  }

  doc.addEventListener('visibilitychange', function () {
    if (document.hidden && state.running) {
      toast('检测到切到后台 / 息屏，渲染已中断（后台会停帧，录出来是半截）');
      state.cancelled = true;
      stopRec(false);
    }
  });

  function tickProgress() {
    if (!state.running) return;
    var el = (performance.now() - state.t0) / 1000;
    var audio = findAudio();
    var t = el;
    if (audio && !audio.paused && isFinite(audio.currentTime) && audio.currentTime > 0.05) t = audio.currentTime;
    var dur = state.dur || duration() || 0;
    var pct = dur ? Math.min(100, t / dur * 100) : 0;
    if (progBar) progBar.style.width = pct.toFixed(1) + '%';
    if (progEl) {
      var p = progEl.querySelector('.pct'); if (p) p.textContent = pct.toFixed(0) + '%';
      if (progLine) progLine.textContent = fmt(t) + ' / ' + (dur ? fmt(dur) : '?') + ' · 已用 ' + fmt(el) +
        (dur && el > 2 && pct > 1 ? ' · 剩余约 ' + fmt(Math.max(1, (dur - t) * (el / Math.max(0.1, t)))) : '');
    }
    if (LIMIT && t >= LIMIT) { stopRec(true); return; }
    if (dur && t >= dur - 0.6) { try { var au2 = findAudio(); if (au2) au2.pause(); } catch (e) {} stopRec(true); return; }
    if (dur && el >= dur + 3) { stopRec(true); return; }
    if (el > 60 * 30) { stopRec(true); return; }   // 兜底
    state.timer = setTimeout(tickProgress, 300);
  }

  function stopRec(keep) {
    if (!state.running) return;
    if (!keep) state.cancelled = true;
    if (state.timer) { clearTimeout(state.timer); state.timer = null; }
    try { if (state.rec && state.rec.state !== 'inactive') state.rec.stop(); } catch (e) {}
    var audio = findAudio();
    try { if (audio) audio.pause(); } catch (e) {}
    if (state.stream) { try { state.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} }
    state.running = false;
  }

  function save(name, mime) {
    var ext = mime.indexOf('mp4') >= 0 ? 'mp4' : 'webm';
    var blob = new Blob(state.chunks, { type: mime.split(';')[0] });
    state.chunks = [];
    var base = (name || ('MV-' + slug())).replace(/[^A-Za-z0-9._-]+/g, '-').replace(/-+/g, '-');
    if (!/\.(mp4|webm)$/i.test(base)) base += '.' + ext;
    var mb = (blob.size / 1048576).toFixed(1);
    if (progEl) { var p = progEl.querySelector('b'); if (p) p.textContent = '正在保存 ' + mb + ' MB…'; }
    fetch('/__rec?name=' + encodeURIComponent(base), { method: 'POST', body: blob })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) {
        hideProgress();
        toast('✅ 渲染完成：' + base + '（' + mb + ' MB）\n已存到系统「下载」目录\n' + (t || '') + '\n' + (state.info || ''));
      })
      .catch(function (e) {
        hideProgress();
        toast('保存失败（' + (e.message || e) + '），改为直接下载');
        var a = doc.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = base; a.click();
      });
  }

  /* ---------------- 自适应：<30fps 超 1 秒降到 1080P60；降完还低 2 秒就暂停并建议预渲染 ---------------- */
  var adaptiveSlowMs = 0;
  var adaptiveDegraded = /(^|[?&])mvxdeg=1/.test(location.search);
  var adaptivePrompted = false;
  function adaptiveAllowed() {
    try { return localStorage.getItem('mv-dynres') !== '0'; } catch (e) { return true; }
  }
  (function adaptiveCtrl() {
    var st = { get degraded() { return adaptiveDegraded; }, set degraded(v) { adaptiveDegraded = v; } };
    function mvTime() {
      try { if (typeof window.__pdTime === 'function') return window.__pdTime(); } catch (e) {}
      var a = findAudio();
      try { if (a && isFinite(a.currentTime)) return a.currentTime; } catch (e) {}
      return 0;
    }
    function goDegrade(userTier) {
      st.degraded = true;
      var cv = findCanvas();
      if (cv && canvasIsGL(cv) && typeof window.__pdSeek === 'function') {
        // P(doom)：画质档位是靠 res 在加载时定死的（它会把 scale 覆盖回档位值），
        // 所以降档必须把 res 改成 1080p60；用户原来的档位用 mvxkeep 带过去，界面上再显示回去
        var q = new URLSearchParams(location.search);
        q.set('res', '1080p60');
        q.set('scale', '1');
        q.set('fps', '60');
        q.set('t', String(Math.max(0, mvTime())));
        q.set('play', '1');
        q.set('mvxdeg', '1');
        q.set('mvxkeep', userTier || '');
        try { sessionStorage.setItem('mvx-adapt', '1'); } catch (e) {}
        toast('帧率低于 30fps，自适应已生效：内部渲染降到 1080P60（你的画质选择没变）', 5000);
        setTimeout(function () { location.search = q.toString(); }, 1200);
        return true;
      }
      toast('帧率低于 30fps，自适应已生效', 4000);
      return false;
    }
    function pauseAndSuggest() {
      if (adaptivePrompted) return;
      adaptivePrompted = true;
      try { var a = findAudio(); if (a) a.pause(); } catch (e) {}
      var mask = ce('div', 'mvx-mask');
      var panel = ce('div', 'mvx-panel');
      panel.innerHTML = '<h3>帧率还是不到 30fps</h3>' +
        '<p class="mvx-warn">已经降到 1080P60 还是跑不满 30 帧，继续看会一直掉帧。' +
        '建议先把它<b>渲染输出成 MP4</b> 再看——逐帧渲染，成品不掉帧、画质也不降。</p>' +
        '<div class="mvx-actions"><button class="btn" type="button" data-x="close">继续观看</button>' +
        '<button class="btn primary" type="button" data-x="render">前往进行预渲染后观看</button></div>';
      mask.appendChild(panel);
      doc.body.appendChild(mask);
      panel.querySelector('[data-x=close]').addEventListener('click', function () {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
      });
      panel.querySelector('[data-x=render]').addEventListener('click', function () {
        if (mask.parentNode) mask.parentNode.removeChild(mask);
        openDialog();
      });
    }
    setInterval(function () {
      if (state.running) return;                    // 导出中不干预
      if (doc.hidden) return;
      var cv = findCanvas();
      if (!cv) return;
      var sel = findSelect();
      var tier = sel ? sel.value : '';
      var wantH = tierHeight(tier);
      var gotH = Math.max(cv.width, cv.height);
      if (wantH && gotH < wantH * 0.92) adaptiveDegraded = true;   // 内部渲染已低于所选档位
      if (gotH <= 1080 * 1.05) adaptiveDegraded = true;            // 已经在 1080p 或更低
      if (!(hudFps > 0)) return;
      if (!adaptiveAllowed()) { adaptiveSlowMs = 0; return; }
      var needDrop = gotH > 1080 * 1.05;          // 实际渲染还高于 1080p 才值得降
      if (hudFps < 30) {
        adaptiveSlowMs += 500;                     // 累计（不是连续）低于 30fps 的时间
        if (adaptiveSlowMs > 1000 && needDrop && !adaptiveDegraded) {
          adaptiveSlowMs = 0;
          if (goDegrade(tier)) return;
        } else if (adaptiveSlowMs > 2000 && (!needDrop || adaptiveDegraded) && !adaptivePrompted) {
          adaptiveSlowMs = 0;
          pauseAndSuggest();
        }
      } else if (adaptiveSlowMs > 0) {
        adaptiveSlowMs = Math.max(0, adaptiveSlowMs - 250);   // 恢复时缓慢回落
      }
    }, 500);
  })();

  /* ---------------- 首页「直接渲染」进来的任务 ---------------- */
  (function consumeHomeJob() {
    var raw = null;
    try { raw = localStorage.getItem('mvx-home-job'); } catch (e) {}
    if (!raw) return;
    var job = null;
    try { job = JSON.parse(raw); } catch (e) {}
    try { localStorage.removeItem('mvx-home-job'); } catch (e) {}
    dlog('home job seen ' + raw.slice(0, 80));
    if (!job || !job.ts || Date.now() - job.ts > 300000) return;
    if (job.path && job.path !== location.pathname) return;
    var wait = setInterval(function () {
      if (findCanvas()) {
        clearInterval(wait);
        setTimeout(function () {
          try { beginWithTier(job.tier, job.mode, job.name); } catch (e) { dlog('home job fail ' + e); }
        }, 1200);
      }
    }, 300);
    setTimeout(function () { clearInterval(wait); }, 20000);
  })();

  dlog('mvx loaded path=' + location.pathname + ' step=' + !!window.__mvxStep + ' canvas=' + !!findCanvas());

  // 供调试/自动化调用
  window.__mvx = {
    open: openDialog,
    start: function (tier, mode, name) { beginWithTier(tier, mode, name || ''); },
    state: state,
    tiers: tiers
  };
})();
