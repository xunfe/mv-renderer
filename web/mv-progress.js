/* mv-progress.js — 代码 MV 通用进度条（可拖动 / 可点）
 * 不侵入各支 MV 的引擎：只要能拿到 window.__mvAudio、window.DUR（或音频时长）和 window.seek(t)，
 * 就能加一条底部进度条。时间轴一律用「输出时间」：__mvOutTime() 有就用它，没有就用 offset 推算。
 * 用法：<script src="/mv-progress.js"></script>
 */
(function () {
  'use strict';
  var CSS = ''
    + '#mvp{position:fixed;left:0;right:0;bottom:34px;z-index:20;height:34px;display:flex;align-items:flex-end;'
    + 'opacity:.55;transition:opacity .25s ease;touch-action:none;user-select:none;-webkit-user-select:none;}'
    + '#mvp:hover,#mvp.drag,#mvp.show{opacity:1}'
    + '#mvp .track{position:relative;width:100%;height:30px;display:flex;align-items:flex-end;cursor:pointer;}'
    + '#mvp .rail{position:absolute;left:0;right:0;bottom:0;height:2px;background:rgba(255,255,255,.16);}'
    + '#mvp .buf{position:absolute;left:0;bottom:0;height:2px;background:rgba(255,255,255,.26);width:0;}'
    + '#mvp .fill{position:absolute;left:0;bottom:0;height:2px;width:0;background:#e8b86a;box-shadow:0 0 10px rgba(232,184,106,.7);}'
    + '#mvp .knob{position:absolute;bottom:-4px;width:10px;height:10px;border-radius:50%;background:#ffe2ae;'
    + 'box-shadow:0 0 12px rgba(255,226,174,.9);transform:translateX(-50%);left:0;opacity:0;transition:opacity .2s;}'
    + '#mvp:hover .knob,#mvp.drag .knob,#mvp.show .knob{opacity:1}'
    + '#mvp .t{position:absolute;right:14px;bottom:13px;font:500 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;'
    + 'letter-spacing:.08em;color:rgba(234,243,245,.72);text-shadow:0 1px 4px #000a;pointer-events:none;white-space:nowrap;}'
    + '#mvp .tip{position:absolute;bottom:26px;font:500 10px/1 ui-monospace,monospace;color:#fff;background:rgba(6,12,18,.85);'
    + 'border:1px solid rgba(255,255,255,.18);border-radius:5px;padding:3px 6px;transform:translateX(-50%);display:none;pointer-events:none;}'
    + '@media (max-width:560px){#mvp .t{right:8px;font-size:10px}}';
  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  var root = document.createElement('div');
  root.id = 'mvp';
  root.innerHTML = '<div class="track"><div class="rail"></div><div class="buf"></div><div class="fill"></div>'
    + '<div class="knob"></div><div class="tip"></div><div class="t">0:00 / 0:00</div></div>';
  document.body.appendChild(root);
  var track = root.querySelector('.track'), fill = root.querySelector('.fill'), buf = root.querySelector('.buf'),
    knob = root.querySelector('.knob'), tip = root.querySelector('.tip'), label = root.querySelector('.t');

  var au = null, dragging = false, hideTimer = 0, lastSeekT = 0;
  function clamp(x, a, b) { return Math.min(b, Math.max(a, x)); }
  function fmt(s) {
    s = Math.max(0, s || 0);
    var m = Math.floor(s / 60), ss = Math.floor(s % 60);
    return m + ':' + (ss < 10 ? '0' : '') + ss;
  }
  function offset() {
    if (window.__mvOffset != null) return Number(window.__mvOffset) || 0;
    if (au && window.__mvOutTime) { try { return Math.max(0, au.currentTime - window.__mvOutTime()); } catch (e) { } }
    return 0;
  }
  function dur() {
    if (window.DUR && isFinite(window.DUR)) return Number(window.DUR);
    if (au && isFinite(au.duration)) return au.duration - offset();
    return 0;
  }
  function outT() {
    if (window.__mvOutTime) { try { return Math.max(0, window.__mvOutTime()); } catch (e) { } }
    if (au) return Math.max(0, au.currentTime - offset());
    return 0;
  }
  function paint() {
    var d = dur(), t = clamp(outT(), 0, d || 0);
    var p = d > 0 ? (t / d) * 100 : 0;
    fill.style.width = p + '%';
    knob.style.left = p + '%';
    if (au && au.buffered && au.buffered.length && d > 0) {
      var b = 0;
      for (var i = 0; i < au.buffered.length; i++) {
        var e = au.buffered.end(i) - offset();
        if (au.buffered.start(i) - offset() <= t + 0.5) b = Math.max(b, e);
      }
      buf.style.width = clamp(b / d * 100, 0, 100) + '%';
    }
    label.textContent = fmt(t) + ' / ' + fmt(d);
  }
  function seekTo(t) {
    var d = dur();
    t = clamp(t, 0, Math.max(0, d - 0.05));
    var off = offset();
    if (au) { try { au.currentTime = t + off; } catch (e) { } }
    if (typeof window.seek === 'function') { try { window.seek(t, 1); } catch (e) { } }
    lastSeekT = performance.now();
    paint();
  }
  function pctAt(clientX) {
    var r = track.getBoundingClientRect();
    return clamp((clientX - r.left) / Math.max(1, r.width), 0, 1);
  }
  function showTip(clientX) {
    var r = track.getBoundingClientRect(), p = pctAt(clientX), d = dur();
    tip.style.display = 'block';
    tip.style.left = (p * r.width) + 'px';
    tip.textContent = fmt(p * d);
  }
  root.addEventListener('pointerdown', function (e) {
    if (!au) return;
    dragging = true; root.classList.add('drag');
    try { root.setPointerCapture(e.pointerId); } catch (err) { }
    seekTo(pctAt(e.clientX) * dur());
    showTip(e.clientX);
    e.preventDefault(); e.stopPropagation();
  });
  root.addEventListener('pointermove', function (e) {
    if (!dragging) {
      if (e.pointerType === 'mouse') { showTip(e.clientX); root.classList.add('show'); }
      return;
    }
    seekTo(pctAt(e.clientX) * dur());
    showTip(e.clientX);
    e.preventDefault();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false; root.classList.remove('drag');
    tip.style.display = 'none';
    try { root.releasePointerCapture(e.pointerId); } catch (err) { }
  }
  root.addEventListener('pointerup', endDrag);
  root.addEventListener('pointercancel', endDrag);
  root.addEventListener('pointerleave', function () { if (!dragging) tip.style.display = 'none'; });
  track.addEventListener('click', function (e) { if (au && !dragging) seekTo(pctAt(e.clientX) * dur()); e.stopPropagation(); });

  // 音频出现后接上；60Hz 刷进度
  function bind() {
    var a = window.__mvAudio;
    if (!a) {
      var el = document.querySelector('audio');
      a = el || null;
    }
    if (a && a !== au) {
      au = a;
      if (au.addEventListener) { au.addEventListener('seeked', paint); au.addEventListener('timeupdate', paint); }
    }
  }
  setInterval(function () { bind(); paint(); }, 120);

  // 播放时 2.6 秒不动就淡下去；鼠标/手指一动再亮
  function poke() {
    root.classList.add('show');
    clearTimeout(hideTimer);
    hideTimer = setTimeout(function () {
      if (!dragging && au && !au.paused) root.classList.remove('show');
    }, 2600);
  }
  window.addEventListener('pointermove', poke, { passive: true });
  window.addEventListener('touchstart', poke, { passive: true });
  window.addEventListener('keydown', function (e) {
    if (!au) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') { setTimeout(paint, 0); poke(); }
  });
  poke(); paint();
})();
