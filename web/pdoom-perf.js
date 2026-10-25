/* pdoom-perf.js — 默认 MV（P(doom)）的画质档位 / 帧率上限 / 动态分辨率
 *
 * P(doom) 是 WebGL 应用，内部按「逻辑 1920×1080 × scale」开画布和全部 render target，
 * 自带 ?scale=（物理像素 / 逻辑像素）开关，只是原来被夹在 1~4 的整数。档位 → scale：
 *   720P30 2/3 · 1080P30 1 · 1080P60 1 · 2K30 4/3 · 4K60 2 · 4K120 2 · 4K不限 2
 * 「4K120」在不支持 120Hz 的屏上就是屏幕刷新率；「4K不限」不节流，有多少给多少。
 * 换档 = 带 scale 重新进页面（渲染管线是初始化时按 scale 建好的，只能重进）。
 * 注意：这支 MV 的播放时钟不对外暴露，换档接不上时间，只能从头播 —— 选择器上写明了。
 * 动态分辨率只在开头 8 秒内降档，倒计时期间可以点“关闭自适应分辨率”拦住这次重播。
 */
(function () {
  'use strict';
  var TIERS = {
    '720p30':  { scale: 2 / 3, fps: 30,  label: '720P 30' },
    '1080p30': { scale: 1,     fps: 30,  label: '1080P 30' },
    '1080p60': { scale: 1,     fps: 60,  label: '1080P 60 · 默认' },
    '2k30':    { scale: 4 / 3, fps: 30,  label: '2K 30' },
    '4k60':    { scale: 2,     fps: 60,  label: '4K 60' },
    '4k120':   { scale: 2,     fps: 120, label: '4K 120' },
    '4kmax':   { scale: 2,     fps: 0,   label: '4K 不限帧' }
  };
  var HEAVY = { '4k60': 1, '4k120': 1, '4kmax': 1 };    // 手选的 4K 不自动降档

  var qs = new URLSearchParams(location.search);
  var res = qs.get('res');
  if (!TIERS[res]) {
    var sc0 = Number(qs.get('scale') || 1);
    if (!isFinite(sc0) || sc0 <= 0) sc0 = 1;
    res = sc0 >= 1.9 ? '4k60' : sc0 >= 1.2 ? '2k30' : sc0 <= 0.8 ? '720p30'
        : (Number(qs.get('fps') || 60) < 50 ? '1080p30' : '1080p60');
  }
  var tier = TIERS[res];
  var scaleNow = Number(qs.get('scale') || tier.scale) || tier.scale;

  // ---- 1. 档位落到 ?scale=（app 初始化时读；必须抢在模块之前）----
  try {
    var want = String(tier.scale);
    if (qs.get('scale') !== want) {
      qs.set('scale', want);
      history.replaceState(null, '', location.pathname + '?' + qs.toString());
    }
  } catch (e) {}

  // ---- 2. 帧率上限 + 帧计数（只数 app 自己的帧；fps=0 表示不限）----
  var rafNative = window.requestAnimationFrame.bind(window);
  var frames = 0;
  if (tier.fps > 0 && tier.fps < 58) {
    var minDt = 1000 / tier.fps - 1.5, lastT = 0;
    window.requestAnimationFrame = function (cb) {
      return rafNative(function (ts) {
        if (ts - lastT >= minDt) { lastT = ts; frames++; cb(ts); }
        else window.requestAnimationFrame(cb);
      });
    };
  } else {
    window.requestAnimationFrame = function (cb) {
      return rafNative(function (ts) { frames++; cb(ts); });
    };
  }

  // ---- 2.5 测本机帧率上限：rAF 间隔的中位数，播放中再取实测最大值 ----
  var capHz = 0, bestFps = 0, labelTimer = 0;
  (function measure() {
    var d = [], last = 0;
    var tick = function (ts) {
      if (last) d.push(ts - last);
      last = ts;
      if (d.length < 50) { rafNative(tick); return; }
      d.sort(function (a, b) { return a - b; });
      var med = d[d.length >> 1];
      if (med > 0 && med < 200) capHz = Math.round(1000 / med);
    };
    rafNative(tick);
  })();

  /** 「最高多少就标多少」：能量到上限就写数字，量不到才说“不限” */
  function capText() {
    var n = Math.max(capHz, Math.round(bestFps));
    return n > 0 ? n + 'fps' : '不限';
  }
  function annotate(sel) {
    if (!sel) return;
    var a = sel.querySelector('option[value="4kmax"]');
    if (a) a.textContent = '4K 不限帧 · 最高 ' + capText();
    var b = sel.querySelector('option[value="4k120"]');
    if (b) b.textContent = (capHz && capHz < 110) ? '4K 120 · 最高 ' + capText() : '4K 120';
  }

  // ---- 3. UI / fps / 动态分辨率 ----
  function dynFlag() { try { return localStorage.getItem('mv-dynres'); } catch (e) { return null; } }
  function autoOn() { return dynFlag() !== '0'; }
  var low = 0, dynTried = 0, t0 = performance.now(), lastFrames = 0, fps = 0, playT0 = 0;
  var lastTime = 0, advCount = 0, pendingReload = 0;

  function curTime() {
    var s = document.getElementById('scrub');
    return s && s.value ? Number(s.value) : 0;
  }

  /** 小提示条；带 action 时给一个按钮，返回句柄（可以 cancel 掉） */
  function toast(msg, action) {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;left:50%;top:64px;transform:translateX(-50%);z-index:99998;' +
      'display:flex;align-items:center;gap:12px;padding:8px 10px 8px 16px;border-radius:999px;' +
      'background:#000d;border:1px solid #ffffff2e;color:#eee9df;font:11px/1.3 ui-monospace,monospace;' +
      'letter-spacing:.04em;transition:opacity .4s;pointer-events:auto;box-shadow:0 10px 30px #0008';
    var s = document.createElement('span');
    s.textContent = msg;
    d.appendChild(s);
    if (action) {
      var b = document.createElement('button');
      b.textContent = action.label;
      b.style.cssText = 'cursor:pointer;background:#ff4d12;color:#160b06;border:0;border-radius:999px;' +
        'padding:5px 12px;font:600 11px/1 ui-sans-serif,system-ui;letter-spacing:.04em';
      b.onclick = action.onClick;
      d.appendChild(b);
    }
    document.body.appendChild(d);
    var t1 = setTimeout(function () { d.style.opacity = '0'; }, action ? 4200 : 2200);
    var t2 = setTimeout(function () { d.remove(); }, action ? 4800 : 2800);
    return { el: d, cancel: function () { clearTimeout(t1); clearTimeout(t2); d.remove(); } };
  }

  function reload(scale, opts) {
    var p = new URLSearchParams(location.search);
    p.set('scale', String(Math.round(scale * 1000) / 1000));
    p.set('res', (opts && opts.res) || 'auto');
    p.set('play', '1');                       // 这一支的时钟不对外，换档只能从头播
    p.set('t', '0');
    if (opts && opts.dyn) p.set('dyn', '1'); else p.delete('dyn');
    location.search = p.toString();
  }

  function boot() {
    var ui = document.getElementById('ui');
    var badge = null, chip = null, sel = null;

    function syncChip() {
      if (!chip) return;
      var on = autoOn();
      chip.innerHTML = '<i class="pd-dot"></i><span>自适应 ' + (on ? '开' : '关') + '</span>';
      chip.style.color = on ? '#bfe9cf' : '#ffc9c2';
      chip.style.borderColor = on ? '#3ddc8455' : '#ff4d4d55';
      chip.title = on ? '自适应分辨率：开（跑不满会自动降档，可在这里关掉）' : '自适应分辨率：关（不再自动降档重播；点一下恢复）';
    }

    if (ui) {
      // 控件浮在画面右下（UI 条上方），不压进度条上那排镜头标记
      var st = document.createElement('style');
      st.textContent = '#__pdctl{position:fixed;right:14px;bottom:74px;display:flex;align-items:center;gap:8px;z-index:9997}' +
        '#__pdctl button,#__pdctl select{backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}' +
        '#__pdctl .pd-badge{font:11px/1 ui-monospace,monospace;color:#cfc9bf;letter-spacing:.04em;' +
        'background:#0009;border-radius:999px;padding:5px 9px}' +
        '#__pdctl .pd-dot{width:8px;height:8px;border-radius:50%;display:inline-block;margin-right:6px;' +
        'background:#3ddc84;box-shadow:0 0 8px #3ddc84aa;vertical-align:middle}' +
        'body.export #__pdctl{display:none!important}';
      document.head.appendChild(st);

      var wrap = document.createElement('div');
      wrap.id = '__pdctl';

      chip = document.createElement('button');
      chip.type = 'button';
      chip.style.cssText = 'cursor:pointer;background:#0009;border:1px solid #ffffff2e;border-radius:999px;' +
        'padding:4px 10px;font:11px/1.2 ui-monospace,monospace;letter-spacing:.04em;display:inline-flex;align-items:center';
      chip.setAttribute('role', 'switch');
      chip.onclick = function () {
        var on = !autoOn();
        try { localStorage.setItem('mv-dynres', on ? '1' : '0'); } catch (e) {}
        syncChip();
        if (!on) toast('已关闭自适应分辨率：不会再自动降档重播');
      };

      sel = document.createElement('select');
      sel.id = 'q';
      sel.setAttribute('aria-label', '画质');
      sel.title = '画质（内部渲染分辨率 / 帧率上限）——换档会从头播';
      sel.style.cssText = 'background:#121214;color:#eee9df;border:1px solid #ffffff33;border-radius:6px;' +
        'padding:3px 6px;font:11px/1.2 ui-monospace,monospace;outline:none';
      Object.keys(TIERS).forEach(function (k) {
        var o = document.createElement('option');
        o.value = k; o.textContent = TIERS[k].label;
        if (k === res) o.selected = true;
        sel.appendChild(o);
      });
      sel.addEventListener('change', function () {
        var t = TIERS[sel.value];
        if (!t) return;
        toast('切到 ' + t.label + '，从头开始播');
        reload(t.scale, { res: sel.value });
      });

      badge = document.createElement('span');
      badge.className = 'pd-badge';

      wrap.appendChild(chip); wrap.appendChild(sel); wrap.appendChild(badge);
      ui.appendChild(wrap);
      syncChip();
      setTimeout(function () { annotate(sel); }, 1300);
      setInterval(function () { annotate(sel); }, 5000);
    }

    // 上一轮是换档/降档回来的：等 app 初始化完（__pdSeek 有了）再替用户点一下开播。
    // 只点一次 —— 这支 MV 的点击是播放/暂停切换，多点一下就把刚起的播暂停了。
    if (qs.get('play') === '1') {
      var waited = 0;
      var iv = setInterval(function () {
        var ready = typeof window.__pdSeek === 'function';
        if (!ready && (waited += 200) < 12000) return;
        clearInterval(iv);
        if (!ready) return;
        setTimeout(function () {
          var c = document.getElementById('c');
          if (c) { try { c.click(); } catch (e) {} }
        }, 350);
      }, 200);
    }

    setInterval(function () {
      var now = performance.now();
      fps = (frames - lastFrames) * 1000 / Math.max(1, now - t0);
      lastFrames = frames; t0 = now;
      var tt = curTime();
      advCount = tt > lastTime + 0.02 ? advCount + 1 : 0;
      lastTime = tt;
      var playing = advCount >= 2 || (window.__pdAudio && !window.__pdAudio.paused);
      if (playing && !playT0) playT0 = now;
      if (!playing) playT0 = 0;

      if (fps > bestFps && playing) bestFps = fps;
      if (badge) {
        badge.textContent = fps.toFixed(0) + ' fps · 上限 ' + capText() +
          (qs.get('dyn') ? ' · 动态 ' + scaleNow.toFixed(2) + '×' : '') +
          (autoOn() ? '' : ' · 自适应关');
      }
      syncChip();

      // 只在开头 8 秒内自动降档；给 1.6 秒倒计时，期间可以点“关闭自适应分辨率”拦住
      if (autoOn() && !HEAVY[res] && !pendingReload && low >= 2 && dynTried < 2 && playing &&
          tt < 8 && playT0 && now - playT0 > 3000 && scaleNow > 0.52) {
        var next = Math.max(0.5, Math.round(Math.min(scaleNow - 0.05, scaleNow * Math.sqrt(Math.max(fps, 8) / 58)) * 1000) / 1000);
        if (next < scaleNow - 0.04) {
          var t = toast('帧率掉到 30fps 以下，1.6 秒后降到 ' + Math.round(next * 1080) + 'p 重开（从头播）', {
            label: '关闭自适应分辨率',
            onClick: function () {
              clearTimeout(pendingReload); pendingReload = 0;
              try { localStorage.setItem('mv-dynres', '0'); } catch (e) {}
              handle.cancel();
              syncChip();
              toast('已关闭自适应：这次不重播了，画质保持 ' + Math.round(scaleNow * 1080) + 'p');
            }
          });
          var handle = t;
          pendingReload = setTimeout(function () {
            pendingReload = 0;
            dynTried++;
            reload(next, { dyn: true });
          }, 1600);
        }
      }
      if (playing && playT0 && now - playT0 > 3000) low = fps < 30 ? low + 1 : 0;
    }, 1000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
