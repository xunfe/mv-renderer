/* mv-return.js — 播放页通用返回条 + 播完自动回到合集二级页
 * 由首页在进入播放前写入 sessionStorage：
 *   mv-return       回到的地址（home.html#/c/xxx）
 *   mv-return-title 合集名（按钮文案）
 * 兼容：<audio>/<video> 元素、new Audio()、动态创建的媒体元素。
 */
(function () {
  'use strict';
  var KEY = 'mv-return', TKEY = 'mv-return-title';
  var back = '';
  try { back = sessionStorage.getItem(KEY) || ''; } catch (e) {}
  if (!back) {
    try {
      var ref = document.referrer || '';
      if (ref && ref.indexOf(location.origin) === 0 && ref.indexOf('/home.html') >= 0) back = ref;
    } catch (e) {}
  }
  var title = '';
  try { title = sessionStorage.getItem(TKEY) || ''; } catch (e) {}
  var home = '/home.html';
  var finished = false, leaving = false;

  function goBack() {
    if (leaving) return;
    leaving = true;
    location.href = back || home;
  }

  function finish(el) {
    if (finished) return;
    // 只认“正片”结束：短音效/提示音不算，避免一进页面就被带回
    try {
      var d = el && isFinite(el.duration) ? el.duration : 0;
      if (d && d < 20) return;
    } catch (e) {}
    finished = true;
    var ov = document.createElement('div');
    ov.className = 'mv-finish';
    ov.innerHTML = '<b>已播放完毕</b><span>正在返回' + (title ? '「' + escapeHtml(title) + '」' : '合集') + '…</span>';
    document.body.appendChild(ov);
    setTimeout(function () { ov.classList.add('show'); }, 16);
    setTimeout(goBack, 1050);
  }
  window.__mvFinished = finish;

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function hideStart() {
    var st = document.getElementById('mv-start') || document.querySelector('.mv-start');
    if (st) st.classList.add('hide');
  }

  function track(el) {
    if (!el || el.__mvReturnTracked) return;
    el.__mvReturnTracked = 1;
    try { el.addEventListener('ended', function () { finish(el); }); } catch (e) {}
    try {
      el.addEventListener('play', hideStart);
      el.addEventListener('playing', hideStart);
    } catch (e) {}
  }

  function scan() {
    try {
      var list = document.querySelectorAll('audio, video');
      for (var i = 0; i < list.length; i++) track(list[i]);
    } catch (e) {}
  }

  // 1) 拦截 play()，所有走元素播放的都会留下引用
  try {
    var proto = window.HTMLMediaElement && HTMLMediaElement.prototype;
    if (proto && proto.play && !proto.play.__mvReturnWrapped) {
      var op = proto.play;
      var np = function () { track(this); return op.apply(this, arguments); };
      np.__mvReturnWrapped = true;
      proto.play = np;
    }
  } catch (e) {}

  // 2) 包装 Audio 构造器，接住 new Audio()（P(doom) 等）
  try {
    var OA = window.Audio;
    if (OA && !OA.__mvReturnWrapped) {
      var A = function () {
        var el = new (Function.prototype.bind.apply(OA, [null].concat([].slice.call(arguments))))();
        track(el);
        return el;
      };
      A.prototype = OA.prototype;
      A.__mvReturnWrapped = true;
      window.Audio = A;
    }
  } catch (e) {}

  // 3) 页面里已经存在的媒体元素
  scan();
  document.addEventListener('DOMContentLoaded', scan);
  setInterval(scan, 900);

  // 返回条（Android 注入的 ☰ 在播放页隐藏，改成“返回合集”）
  function ui() {
    var st = document.createElement('style');
    st.textContent = '#__menubtn{display:none!important}';
    (document.head || document.documentElement).appendChild(st);

    var a = document.createElement('a');
    a.className = 'mv-back';
    a.href = back || home;
    a.innerHTML = '<span class="arr">←</span><span>' + (title ? '返回「' + escapeHtml(title) + '」' : '返回合集') + '</span>';
    a.setAttribute('aria-label', '返回合集');
    document.body.appendChild(a);

    var css = document.createElement('style');
    css.textContent =
      '.mv-back{position:fixed;left:14px;top:14px;z-index:99990;display:inline-flex;align-items:center;gap:7px;' +
      'height:34px;padding:0 14px 0 11px;border-radius:999px;background:rgba(9,8,7,.62);border:1px solid rgba(255,255,255,.22);' +
      'color:#f2eadc;font:500 12px/1 ui-sans-serif,system-ui,-apple-system,sans-serif;letter-spacing:.04em;text-decoration:none;' +
      'backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:0 6px 22px rgba(0,0,0,.3);' +
      'transition:opacity .35s,border-color .2s,background .2s;opacity:.72}' +
      '.mv-back .arr{font-size:15px;line-height:1;color:#ff7a3a}' +
      '.mv-back:hover,.mv-back:active{opacity:1;border-color:#ff7a3a;background:rgba(9,8,7,.82)}' +
      '.mv-finish{position:fixed;left:50%;bottom:86px;z-index:99991;transform:translate(-50%,14px);opacity:0;' +
      'display:flex;flex-direction:column;gap:3px;align-items:center;pointer-events:none;' +
      'padding:13px 24px;border-radius:16px;background:rgba(10,9,8,.86);border:1px solid rgba(255,255,255,.2);' +
      'box-shadow:0 18px 50px rgba(0,0,0,.5);color:#f2eadc;font:400 11px/1.5 ui-sans-serif,system-ui;' +
      'backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);transition:opacity .35s,transform .35s}' +
      '.mv-finish b{font:600 15px/1.3 "Noto Serif SC","Noto Serif CJK SC",serif;letter-spacing:.12em;color:#ffb27a}' +
      '.mv-finish span{color:rgba(242,234,220,.62);letter-spacing:.08em}' +
      '.mv-finish.show{opacity:1;transform:translate(-50%,0)}';
    (document.head || document.documentElement).appendChild(css);

    // 播放中把按钮淡下去，不挡画面；鼠标/触摸时回来
    var timer = 0;
    function dim() { a.style.opacity = '0.3'; }
    function wake() { a.style.opacity = '0.72'; clearTimeout(timer); timer = setTimeout(dim, 4000); }
    wake();
    window.addEventListener('pointerdown', wake, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui);
  else ui();
})();
