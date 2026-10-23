/* mv-quality.js — 五档画质选择（720P30 / 1080P30 / 1080P60 / 2K30 / 4K60）
 * 通过 URL 参数 ss（内部渲染倍率）与 fps（帧率上限）生效；切换时保留当前播放时间并自动续播。
 * 页面需提供 <select id="q"> 与 window.__mvOutTime()（可选）。
 */
(function () {
  'use strict';
  var MAP = {
    '720p30':  { ss: 2 / 3, fps: 30, label: '720P 30' },
    '1080p30': { ss: 1,     fps: 30, label: '1080P 30' },
    '1080p60': { ss: 1,     fps: 60, label: '1080P 60 · 默认' },
    '2k30':    { ss: 1.5,   fps: 30, label: '2K 30' },
    '4k60':    { ss: 2,     fps: 60, label: '4K 60' }
  };
  var q = new URLSearchParams(location.search);
  var cur = q.get('res');
  if (!MAP[cur]) {
    var ss = Number(q.get('ss') || 1), fps = Number(q.get('fps') || 60);
    cur = ss >= 1.9 ? '4k60' : ss >= 1.4 ? '2k30' : ss <= 0.8 ? '720p30' : fps >= 50 ? '1080p60' : '1080p30';
  }
  var sel = document.getElementById('q');
  if (!sel) return;
  sel.value = cur;
  sel.setAttribute('title', '画质（4K / 2K 很吃性能，录制时再用）');
  sel.addEventListener('change', function () {
    var v = sel.value, m = MAP[v];
    if (!m) return;
    var t = 0;
    try { t = window.__mvOutTime ? window.__mvOutTime() : 0; } catch (e) {}
    var p = new URLSearchParams(location.search);
    p.set('res', v);
    p.set('ss', String(m.ss));
    p.set('fps', String(m.fps));
    p.set('t', Math.max(0, t || 0).toFixed(2));
    p.set('autoplay', '1');
    p.delete('dyn');
    location.search = p.toString();
  });
})();
