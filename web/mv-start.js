/* mv-start.js — 播放页通用「点击开始」+ 自检
 * 解决的问题：素材缺失 / 音轨 404 时，页面停在封面上、点了没反应，看不出所以然。
 *   1) 拦截 new Audio()，把创建出来的媒体元素记到 window.__mvAudio（页面按 play() 播放也能被接住）
 *   2) 点封面 -> 有音轨就直接 play()，没有就转发一次 canvas 点击（兼容页面自己绑的点击）
 *   3) 播放开始就收起封面；7 秒还没动静就给出诊断框（缺哪些文件 / 报什么错）
 * 页面需要：<div id="start"> 封面（可带 class mv-start）、<canvas id="c">
 */
(function () {
  'use strict';
  var failed = [];
  var errors = [];
  var audios = [];
  window.__mvAudio = null;
  window.__mvAudios = audios;

  function $(id) { return document.getElementById(id); }
  function startEl() { return $('start') || document.querySelector('.mv-start'); }

  function hideStart() {
    var s = startEl();
    if (s) s.classList.add('hide');
  }
  window.__mvHideStart = hideStart;

  function note(el) {
    if (!el || el.__mvStartNoted) return el;
    el.__mvStartNoted = 1;
    audios.push(el);
    window.__mvAudio = el;
    try {
      el.addEventListener('playing', hideStart);
      el.addEventListener('play', hideStart);
      el.addEventListener('error', function () {
        var src = el.currentSrc || el.src || '(unknown)';
        failed.push(src);
        say('音轨加载失败：' + src);
      });
    } catch (e) {}
    return el;
  }

  // 1) 接住所有 new Audio()
  try {
    var OA = window.Audio;
    if (OA && !OA.__mvStartWrapped) {
      var A = function () {
        var el = new (Function.prototype.bind.apply(OA, [null].concat([].slice.call(arguments))))();
        note(el);
        return el;
      };
      A.prototype = OA.prototype;
      A.__mvStartWrapped = true;
      window.Audio = A;
    }
  } catch (e) {}

  // 2) 已经在页面里的媒体元素
  function scan() {
    try {
      var l = document.querySelectorAll('audio, video');
      for (var i = 0; i < l.length; i++) note(l[i]);
    } catch (e) {}
  }

  // 3) 资源加载失败（图片 / 字体 / 脚本 / 音频）
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) {
      failed.push((t.tagName || '?') + ' ' + (t.src || t.href));
      return;
    }
    errors.push((e.message || 'error') + (e.filename ? ' @' + e.filename + ':' + e.lineno : ''));
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    errors.push('REJ: ' + (r && (r.stack || r.message) || r));
  });

  function panel() {
    var d = $('__diag');
    if (d) return d;
    d = document.createElement('div');
    d.id = '__diag';
    d.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:99999;' +
      'max-width:min(86vw,720px);max-height:70vh;overflow:auto;padding:16px 18px;border-radius:14px;' +
      'background:rgba(14,12,10,.94);border:1px solid rgba(255,255,255,.18);color:#f3ece0;' +
      'font:12px/1.65 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap;box-shadow:0 18px 60px #000a';
    document.body.appendChild(d);
    return d;
  }
  function say(msg) {
    var d = panel();
    d.textContent = '播放没有启动\n' + msg + '\n\n' + details();
  }
  function details() {
    var out = [];
    out.push('页面：' + location.pathname + location.search);
    out.push('画布：' + (($('c') && $('c').width) || '?') + 'x' + (($('c') && $('c').height) || '?'));
    out.push('音轨：' + (window.__mvAudio ? (window.__mvAudio.src || '(空)') + ' [' + window.__mvAudio.readyState + ']' : '还没有创建'));
    if (failed.length) out.push('加载失败：\n  ' + failed.slice(0, 8).join('\n  '));
    if (errors.length) out.push('报错：\n  ' + errors.slice(0, 5).join('\n  '));
    if (!failed.length && !errors.length) out.push('没有抓到报错——可能是素材文件不在安装包里。');
    return out.join('\n');
  }
  window.__mvShowDiag = say;
  window.__mvDiag = function () {    return {
      hasAudio: !!window.__mvAudio,
      audioSrc: window.__mvAudio ? (window.__mvAudio.src || '') : '',
      paused: window.__mvAudio ? window.__mvAudio.paused : null,
      currentTime: window.__mvAudio ? window.__mvAudio.currentTime : null,
      dur: window.DUR || null,
      startHidden: (function () { var s = startEl(); return s ? s.classList.contains('hide') : null; })(),
      failed: failed.slice(),
      errors: errors.slice()
    };
  };

  function bindStart() {
    var s = startEl();
    if (!s || s.__mvStartBound) return;
    s.__mvStartBound = 1;
    s.addEventListener('click', function () {
      note(window.__mvAudio);
      var au = window.__mvAudio;
      if (au) {
        var p = au.play();
        if (p && p.catch) p.catch(function (err) { say('play() 被拒绝：' + (err && err.message || err)); });
        return;
      }
      var c = $('c');
      if (c) c.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      // 页面自己也没接住的话，7 秒后给诊断
      setTimeout(function () {
        if (!window.__mvAudio) say('点击已发出，但页面没有开始播放。');
      }, 7000);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { scan(); bindStart(); });
  } else {
    scan(); bindStart();
  }
  scan();
  setInterval(function () {
    scan();
    var au = window.__mvAudio;
    if (au && !au.paused) hideStart();
    // 初始化失败时把真实的 reject 原因摆出来（别被 9 秒兜底提示盖掉）
    if (window.__ready && !window.__ready.__mvCaught) {
      window.__ready.__mvCaught = 1;
      try {
        window.__ready.catch(function (e) {
          say('初始化失败：\n' + ((e && (e.stack || e.message)) || e));
        });
      } catch (e) {}
    }
  }, 800);
  bindStart();

  // 9 秒还没有任何音轨 = 素材没加载完，直接把原因摆出来；
  // 已经有诊断框（比如 __ready 的 reject）就不要覆盖。
  setTimeout(function () {
    if (!window.__mvAudio && !errors.length && !document.getElementById('__diag')) {
      say('页面加载完了，但一直没有音轨对象。多半是素材没进这个包，或 WebGL2 初始化失败。');
    }
  }, 9000);
})();
