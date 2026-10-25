/* mv-pre.js — 在页面脚本之前执行（注入到 <head>）
 * 1) URL 带 mvxpreserve=1：强制 WebGL 上下文 preserveDrawingBuffer:true（逐帧取帧用）
 * 2) URL 带 mvxstep=1：把 requestAnimationFrame / performance.now / Date.now 换成一个「手动时钟」，
 *    由渲染输出代码一帧一帧推进——这样无论页面是 Canvas 还是 WebGL，都能离线逐帧渲染。
 */
(function () {
  var qs = location.search || '';
  var wantPreserve = /(^|[?&])mvxpreserve=1/.test(qs);
  var wantStep = /(^|[?&])mvxstep=1/.test(qs);

  if (wantPreserve) {
    var proto = window.HTMLCanvasElement && HTMLCanvasElement.prototype;
    if (proto) {
      var orig = proto.getContext;
      if (!orig.__mvxHooked) {
        var hooked = function (type, attrs) {
          if (/webgl/i.test(String(type))) {
            try { attrs = Object.assign({}, attrs || {}, { preserveDrawingBuffer: true }); } catch (e) {}
          }
          return orig.call(this, type, attrs);
        };
        hooked.__mvxHooked = true;
        proto.getContext = hooked;
      }
    }
  }

  // 渲染输出期间先拦住页面的「播放结束」回调：否则 mv-return 会在 1 秒后跳回合集，
  // 把最后一段（moov 索引）的写入和保存整个掐断，导出的 MP4 就成了没有索引、放不了的残片。
  try {
    var ET = window.EventTarget && EventTarget.prototype;
    if (ET && ET.addEventListener && !ET.addEventListener.__mvxHoldHook) {
      var add0 = ET.addEventListener;
      var addHooked = function (type, fn, opts) {
        if (type === 'ended' && typeof fn === 'function') {
          var wrapped = function (ev) {
            if (window.__mvxHold) { try { ev.stopImmediatePropagation(); } catch (e) {} return; }
            return fn.call(this, ev);
          };
          return add0.call(this, type, wrapped, opts);
        }
        return add0.call(this, type, fn, opts);
      };
      addHooked.__mvxHoldHook = true;
      ET.addEventListener = addHooked;
    }
  } catch (e) {}

  if (!wantStep) return;

  var T = 0, seq = 1, live = {}, queue = [], installed = false;
  function install() {
    if (installed) return;
    installed = true;
  var origRAF = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    var i = seq++;
    live[i] = cb;
    queue.push({ i: i, cb: cb });
    return i;
  };
  window.cancelAnimationFrame = function (i) { delete live[i]; };
  try { performance.now = function () { return T * 1000; }; } catch (e) {}
  try { Date.now = function () { return 1770000000000 + Math.round(T * 1000); }; } catch (e) {}
  }
  T = 0;

  function hookAudio(a) {
    if (!a || a.__mvxHooked) return false;
    a.__mvxHooked = true;
    try {
      Object.defineProperty(a, 'currentTime', {
        configurable: true,
        get: function () { return T; },
        set: function (v) { T = Math.max(0, Number(v) || 0); }
      });
    } catch (e) {}
    try { a.play = function () { return Promise.resolve(); }; a.pause = function () {}; } catch (e) {}
    return true;
  }

  window.__mvxStep = {
    install: install,
    isInstalled: function () { return installed; },
    audio: hookAudio,
    time: function () { return T; },
    set: function (t) { T = Math.max(0, t); },
    /** 推进 dt 秒：把排队的 rAF 回调按顺序跑一遍 */
    pump: function (dt) {
      T += dt;
      var run = queue; queue = [];
      for (var k = 0; k < run.length; k++) {
        if (!live[run[k].i]) continue;
        try { run[k].cb(Math.round(T * 1000)); } catch (e) {}
      }
      return queue.length;
    }
  };
})();
