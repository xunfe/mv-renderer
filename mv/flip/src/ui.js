// Screens drawn in code for the full version: the DeepSeek chat page (as it looks: white, the blue whale, the grey
// 已深度思考 block, the input box), danmaku, a code editor, the status page, a code-hosting repo page, a phone home screen.
// Every function draws into a flat sw x sh frame (x is a 2D context), so it can be shown full screen or warped onto a
// screen in a painting. Text is always set here, never painted by Image 2.
import { TAU, clamp, lerp, sat, E, rnd, rgba, font, SANS } from './lib.js';
import { img } from './common.js';

const DS_BLUE = '#4D6BFE';
export function appIcon(x, id, cx, cy, s) {                 // an official app icon with the iOS rounded-square mask
  const im = img(id); x.save(); x.beginPath(); x.roundRect(cx - s / 2, cy - s / 2, s, s, s * 0.225); x.clip();
  x.fillStyle = '#FFFFFF'; x.fillRect(cx - s / 2, cy - s / 2, s, s);
  if (im) { const k = id === 'icon_deepseek' ? 1.1 : 1; x.drawImage(im, cx - s * k / 2, cy - s * k / 2, s * k, s * k); }
  x.restore();
}
function whale(x, cx, cy, s) {                               // the DeepSeek whale, from the official icon
  const im = img('icon_deepseek'); if (!im) return;
  x.save(); x.beginPath(); x.arc(cx, cy, s / 2, 0, TAU); x.clip(); x.drawImage(im, cx - s * 0.62, cy - s * 0.62, s * 1.24, s * 1.24); x.restore();
}
// wrap a string into lines that fit w (characters, CJK-friendly)
export function wrap(x, str, w) {
  const out = []; let line = '';
  for (const ch of str) { if (x.measureText(line + ch).width > w && line) { out.push(line); line = ch; } else line += ch; }
  if (line) out.push(line); return out;
}
// The chat page. o.msgs: [{who: 'user'|'ai'|'think'|'error', text, t0, cps}] in order; o.input: text in the input box;
// o.dots: show the typing dots after the last message; o.dim: grey the page out. t: time.
export function dsChat(x, sw, sh, t, o = {}) {
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, sw, sh);
  const k = sw / 1600;                                         // laid out for a 1600-wide page
  x.save(); x.scale(k, k); const W2 = sw / k, H2 = sh / k;
  x.fillStyle = '#F9FAFB'; x.fillRect(0, 0, 260, H2);          // sidebar
  whale(x, 46, 46, 44); x.fillStyle = '#1F2937'; x.font = font(30, 700, SANS); x.textBaseline = 'middle'; x.fillText('deepseek', 80, 47);
  x.fillStyle = '#EEF2FF'; x.beginPath(); x.roundRect(24, 100, 212, 54, 27); x.fill(); x.fillStyle = DS_BLUE; x.font = font(24, 600, SANS); x.fillText('＋  开启新对话', 50, 128);
  x.fillStyle = '#9CA3AF'; x.font = font(20, 500, SANS); x.fillText('今天', 30, 200);
  ['你好', '帮我写一个排序', '周末去哪玩'].forEach((s, i) => { x.fillStyle = i === 0 ? '#E5E7EB' : 'rgba(0,0,0,0)'; x.beginPath(); x.roundRect(20, 220 + i * 52, 220, 44, 10); x.fill(); x.fillStyle = '#374151'; x.font = font(21, 500, SANS); x.fillText(s, 34, 243 + i * 52); });
  const cx0 = 260 + (W2 - 260) / 2, colW = Math.min(900, W2 - 360), left = cx0 - colW / 2;
  let y = 70;
  for (const m of o.msgs ?? []) {
    if (t < (m.t0 ?? -1e9)) break;
    const n = m.cps ? Math.floor((t - m.t0) * m.cps) : 1e9, txt = [...m.text].slice(0, Math.max(0, n)).join('');
    if (m.who === 'user') {
      x.font = font(30, 500, SANS); const lines = wrap(x, m.text, colW * 0.6), bw = Math.max(...lines.map(l => x.measureText(l).width)) + 56, bh = lines.length * 44 + 30;
      x.fillStyle = '#EFF6FF'; x.beginPath(); x.roundRect(left + colW - bw, y, bw, bh, 24); x.fill();
      x.fillStyle = '#1F2937'; lines.forEach((l, i) => x.fillText(l, left + colW - bw + 28, y + 36 + i * 44)); y += bh + 34;
    } else if (m.who === 'think') {
      whale(x, left + 22, y + 22, 44);
      x.fillStyle = '#F3F4F6'; x.beginPath(); x.roundRect(left + 70, y, 300, 46, 23); x.fill();
      x.fillStyle = '#4B5563'; x.font = font(22, 600, SANS); x.fillText(m.head ?? '已深度思考（用时 1 秒）', left + 92, y + 24);
      y += 64; x.font = font(26, 400, SANS); const lines = wrap(x, txt, colW - 120);
      x.fillStyle = '#E5E7EB'; x.fillRect(left + 76, y - 4, 3, Math.max(40, lines.length * 40 + 8));
      x.fillStyle = '#8B8F99'; lines.forEach((l, i) => x.fillText(l, left + 96, y + 18 + i * 40)); y += Math.max(40, lines.length * 40) + 30;
    } else {
      if (!m.noAvatar) whale(x, left + 22, y + 22, 44);
      x.font = font(m.size ?? 30, m.bold ? 700 : 500, SANS); const lines = wrap(x, txt, colW - 90);
      x.fillStyle = m.who === 'error' ? '#6B7280' : '#111827'; lines.forEach((l, i) => x.fillText(l, left + 70, y + 24 + i * (m.size ?? 30) * 1.5)); y += lines.length * (m.size ?? 30) * 1.5 + 30;
    }
  }
  if (o.dots) { whale(x, left + 22, y + 22, 44); for (let i = 0; i < 3; i++) { x.fillStyle = rgba('#9CA3AF', 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 0.9))); x.beginPath(); x.arc(left + 86 + i * 26, y + 24, 8, 0, TAU); x.fill(); } }
  const iy = H2 - 190;                                         // the input box
  x.fillStyle = '#FFFFFF'; x.strokeStyle = '#E5E7EB'; x.lineWidth = 2; x.shadowColor = 'rgba(0,0,0,0.08)'; x.shadowBlur = 20;
  x.beginPath(); x.roundRect(left, iy, colW, 150, 28); x.fill(); x.shadowBlur = 0; x.stroke();
  x.font = font(28, 500, SANS); x.fillStyle = o.input ? '#111827' : '#9CA3AF'; x.fillText(o.input || '给 DeepSeek 发送消息', left + 30, iy + 44);
  if (o.input !== undefined && (Math.floor(t * 2) % 2 === 0)) { x.fillStyle = '#111827'; x.fillRect(left + 32 + x.measureText(o.input).width, iy + 26, 3, 36); }
  // the model on the 深度思考 chip follows the story (本人 10-19): R1 in 2025, V4.1-Flash in 2026, V4.1-Flash-1017 after the outage
  let bx = left + 24; x.font = font(20, 600, SANS);
  [[`深度思考 (${o.model ?? 'R1'})`, true], ['联网搜索', false]].forEach(([s, on]) => { const cw = x.measureText(s).width + 44; x.fillStyle = on ? '#DBEAFE' : '#F3F4F6'; x.beginPath(); x.roundRect(bx, iy + 90, cw, 42, 21); x.fill(); x.fillStyle = on ? DS_BLUE : '#4B5563'; x.fillText(s, bx + 22, iy + 112); bx += cw + 20; });
  const sp = o.press ?? 0; x.fillStyle = o.input ? DS_BLUE : '#C7D2FE'; x.beginPath(); x.arc(left + colW - 50, iy + 110, 26 * (1 - 0.15 * sp), 0, TAU); x.fill();
  x.strokeStyle = '#FFFFFF'; x.lineWidth = 4; x.lineCap = 'round'; x.beginPath(); x.moveTo(left + colW - 50, iy + 122); x.lineTo(left + colW - 50, iy + 98); x.moveTo(left + colW - 61, iy + 108); x.lineTo(left + colW - 50, iy + 97); x.lineTo(left + colW - 39, iy + 108); x.stroke();
  x.restore();
  if (o.dim) { x.fillStyle = `rgba(30,32,40,${o.dim})`; x.fillRect(0, 0, sw, sh); }
}
// danmaku: lines flying right to left over a band of the frame
export function danmaku(x, sw, sh, t, t0, lines, o = {}) {
  const rows = o.rows ?? 7, y0 = o.y0 ?? 60, rh = o.rh ?? 70;
  x.save(); x.textBaseline = 'middle'; x.lineJoin = 'round';
  lines.forEach((s, i) => {
    const row = i % rows, lap = Math.floor(i / rows);
    const start = t0 + row * (o.gap ?? 0.12) + lap * (o.lap ?? 0.9) + rnd(i, 7) * 0.08; if (t < start) return;
    const size = (o.size ?? 44), sp = (o.speed ?? 560);
    x.font = font(size, 800, SANS); const w = x.measureText(s).width, px = sw + 20 - (t - start) * sp; if (px < -w - 20) return;
    const py = y0 + row * rh;
    x.lineWidth = size * 0.16; x.strokeStyle = 'rgba(10,14,40,0.85)'; x.strokeText(s, px, py);
    x.fillStyle = ['#FFFFFF', '#FFFFFF', '#FFE36B', '#9FE6FF', '#FFB3C8'][i % 5]; x.fillText(s, px, py);
  });
  x.restore();
}
// a code editor with a terminal and a progress bar
export function editor(x, sw, sh, t, o = {}) {
  x.fillStyle = '#1E1F25'; x.fillRect(0, 0, sw, sh);
  const k = sw / 1600; x.save(); x.scale(k, k); const H2 = sh / k;
  x.fillStyle = '#2A2C33'; x.fillRect(0, 0, 1600, 54); ['#FF5F57', '#FEBC2E', '#28C840'].forEach((c, i) => { x.fillStyle = c; x.beginPath(); x.arc(30 + i * 28, 27, 9, 0, TAU); x.fill(); });
  x.fillStyle = '#C9CDD6'; x.font = font(22, 600, SANS); x.textBaseline = 'middle'; x.fillText('train.py', 140, 28);
  const code = ['import torch', 'from model import MoE', '', 'def train(model, data):', '    for step, batch in enumerate(data):', '        loss = model(batch).loss', '        loss.backward()', '        opt.step()'];
  x.font = font(26, 500, '"Consolas", monospace');
  code.forEach((l, i) => { x.fillStyle = '#5C6370'; x.fillText(String(i + 1).padStart(2), 24, 100 + i * 40); x.fillStyle = i === 3 || i === 0 || i === 1 ? '#C678DD' : '#ABB2BF'; x.fillText(l, 80, 100 + i * 40); });
  const ty = 440; x.fillStyle = '#16171C'; x.fillRect(0, ty, 1600, H2 - ty); x.fillStyle = '#8B93A6'; x.font = font(20, 600, SANS); x.fillText('终端', 24, ty + 26);
  x.font = font(26, 500, '"Consolas", monospace');
  (o.term ?? []).forEach(([s, t0], i) => { if (t < t0) return; x.fillStyle = s.startsWith('$') ? '#98C379' : '#ABB2BF'; x.fillText(s.slice(0, Math.floor((t - t0) * 40)), 24, ty + 74 + i * 38); });
  if (o.progress !== undefined) {
    const p = o.progress, by = H2 - 70; x.fillStyle = '#2E3038'; x.beginPath(); x.roundRect(24, by, 1100, 28, 14); x.fill();
    x.fillStyle = '#4D6BFE'; x.beginPath(); x.roundRect(24, by, 1100 * p, 28, 14); x.fill();
    x.fillStyle = '#E5E7EB'; x.font = font(26, 700, SANS); x.fillText(`${Math.round(p * 100)}%`, 1150, by + 14);
  }
  x.restore();
}
// the status page of the service: n days of bars, red while it is down
export function statusPage(x, sw, sh, t, o = {}) {
  x.fillStyle = '#F8FAFC'; x.fillRect(0, 0, sw, sh);
  const k = sw / 1600; x.save(); x.scale(k, k);
  whale(x, 120, 90, 64); x.fillStyle = '#111827'; x.font = font(40, 800, SANS); x.textBaseline = 'middle'; x.fillText('DeepSeek 服务状态', 170, 92);
  const ok = o.ok ?? 0;                                         // 0 down .. 1 recovered (bars turn green left to right)
  const red = '#EF4444', green = '#22C55E';
  x.fillStyle = ok >= 1 ? green : red; x.beginPath(); x.roundRect(100, 170, 1400, 110, 18); x.fill();
  x.fillStyle = '#FFFFFF'; x.font = font(46, 800, SANS); x.fillText(ok >= 1 ? '所有服务已恢复正常' : '服务暂时不可用', 140, 226);
  x.font = font(26, 600, SANS); x.textAlign = 'right'; x.fillText('2026-10-15', 1460, 226); x.textAlign = 'left';
  ['网页 / App 对话', 'API 服务'].forEach((name, r) => {
    const y = 360 + r * 200; x.fillStyle = '#111827'; x.font = font(30, 700, SANS); x.fillText(name, 100, y);
    for (let i = 0; i < 60; i++) {
      const lit = i >= 52 ? (i - 52) / 8 < ok : true; const col = i >= 52 ? (lit && ok > 0 ? green : red) : green;
      x.fillStyle = col; x.beginPath(); x.roundRect(100 + i * 23.3, y + 40, 16, 80, 4); x.fill();
    }
    x.fillStyle = '#9CA3AF'; x.font = font(20, 500, SANS); x.fillText('60 天前', 100, y + 150); x.textAlign = 'right'; x.fillText('今天', 1500, y + 150); x.textAlign = 'left';
  });
  x.restore();
}
// a code-hosting repo page (generic, dark), with stars and forks counting up
export function repoPage(x, sw, sh, t, o = {}) {
  x.fillStyle = '#0D1117'; x.fillRect(0, 0, sw, sh);
  const k = sw / 1200; x.save(); x.scale(k, k); x.textBaseline = 'middle';
  x.fillStyle = '#161B22'; x.fillRect(0, 0, 1200, 70); x.fillStyle = '#E6EDF3'; x.font = font(28, 600, SANS);
  x.fillStyle = '#7D8590'; x.fillText('deepseek-ai /', 40, 36); x.fillStyle = '#4493F8'; x.font = font(30, 800, SANS); x.fillText('DeepSeek-R1', 230, 36);
  x.strokeStyle = '#3D444D'; x.lineWidth = 2; x.fillStyle = '#7D8590'; x.font = font(18, 600, SANS); x.beginPath(); x.roundRect(440, 22, 70, 30, 15); x.stroke(); x.fillText('Public', 451, 37);
  const stars = Math.round(lerp(o.s0 ?? 0, o.s1 ?? 91000, o.p ?? 1)), forks = Math.round(lerp(o.f0 ?? 0, o.f1 ?? 11800, o.p ?? 1));
  [['☆ Star', stars], ['⑂ Fork', forks]].forEach(([s, n], i) => { const bx = 860 + i * 170; x.fillStyle = '#21262D'; x.strokeStyle = '#3D444D'; x.beginPath(); x.roundRect(bx, 18, 155, 36, 8); x.fill(); x.stroke(); x.fillStyle = '#E6EDF3'; x.font = font(18, 700, SANS); x.fillText(`${s}  ${n.toLocaleString('en-US')}`, bx + 12, 37); });
  x.fillStyle = '#161B22'; x.strokeStyle = '#3D444D'; x.beginPath(); x.roundRect(40, 100, 1120, 300, 10); x.fill(); x.stroke();
  [['README.md', '“DeepSeek-R1”'], ['LICENSE', 'MIT License'], ['figures', 'benchmark.jpg'], ['DeepSeek_R1.pdf', 'paper']].forEach(([a, b], i) => { x.fillStyle = '#7D8590'; x.font = font(22, 500, SANS); x.fillText('▤', 66, 140 + i * 66); x.fillStyle = '#E6EDF3'; x.fillText(a, 100, 140 + i * 66); x.fillStyle = '#7D8590'; x.fillText(b, 560, 140 + i * 66); });
  x.fillStyle = '#E6EDF3'; x.font = font(26, 800, SANS); x.fillText('⚖  MIT License', 40, 450);
  x.fillStyle = '#7D8590'; x.font = font(20, 500, SANS); x.fillText('Permission is hereby granted, free of charge, to any person obtaining a copy …', 40, 494);
  x.restore();
}
// a phone home screen with a dock; o.drag: 0..1 the DeepSeek icon travels from the grid into the dock
export function homeScreen(x, sw, sh, t, o = {}) {
  const g = x.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#7FA7F5'); g.addColorStop(1, '#C9A7F0'); x.fillStyle = g; x.fillRect(0, 0, sw, sh);
  const k = sw / 600; x.save(); x.scale(k, k); const H2 = sh / k;
  x.fillStyle = '#FFFFFF'; x.font = font(26, 700, SANS); x.textBaseline = 'middle'; x.fillText('9:41', 40, 34);
  // the other apps: generic system apps, a white glyph on a coloured tile, labelled like a real home screen
  const APPS = [['日历', '#F87171', '15'], ['相机', '#64748B', 'cam'], ['相册', '#F472B6', '❀'], ['天气', '#60A5FA', '☀'],
    ['邮件', '#3B82F6', '✉'], ['音乐', '#FB7185', '♪'], null, ['时钟', '#334155', '◷'],
    ['备忘录', '#FBBF24', '✎'], ['设置', '#94A3B8', '⚙'], ['视频', '#A78BFA', '▶'], ['健康', '#F43F5E', '♥'],
    ['地图', '#34D399', '➤'], ['计算器', '#FB923C', '±'], ['旅行', '#2DD4BF', '✈'], ['收藏', '#E879F9', '★']];
  const tile = (cx, cy, col, gl) => {
    x.fillStyle = col; x.beginPath(); x.roundRect(cx - 46, cy - 46, 92, 92, 21); x.fill();
    x.fillStyle = '#FFFFFF'; x.strokeStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle';
    if (gl === 'cam') { x.beginPath(); x.roundRect(cx - 28, cy - 16, 56, 38, 9); x.fill(); x.fillRect(cx - 10, cy - 23, 20, 8); x.fillStyle = col; x.beginPath(); x.arc(cx, cy + 3, 12, 0, Math.PI * 2); x.fill(); x.fillStyle = '#FFFFFF'; x.beginPath(); x.arc(cx, cy + 3, 6, 0, Math.PI * 2); x.fill(); }
    else if (gl === 'msg') { x.beginPath(); x.ellipse(cx, cy - 3, 30, 23, 0, 0, Math.PI * 2); x.fill(); x.beginPath(); x.moveTo(cx - 18, cy + 12); x.lineTo(cx - 26, cy + 26); x.lineTo(cx - 6, cy + 17); x.fill(); }
    else if (gl === '15') { x.font = font(17, 800, SANS); x.fillText('周四', cx, cy - 24); x.font = font(44, 900, SANS); x.fillText('15', cx, cy + 10); }
    else { x.font = font(gl === '±' ? 50 : 46, 700, "'Segoe UI Symbol', " + SANS); x.fillText(gl, cx, cy + 2); }
    x.textAlign = 'left';
  };
  APPS.forEach((a, i) => { if (!a) return; const cx = 90 + (i % 4) * 140, cy = 140 + Math.floor(i / 4) * 150; tile(cx, cy, a[1], a[2]);
    x.fillStyle = '#FFFFFF'; x.font = font(17, 600, SANS); x.textAlign = 'center'; x.fillText(a[0], cx, cy + 64); x.textAlign = 'left'; });
  x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.roundRect(30, H2 - 170, 540, 140, 40); x.fill();
  [[0, '#22C55E', '☎'], [1, '#4ADE80', 'msg'], [3, '#38BDF8', '◎']].forEach(([c, col, gl]) => tile(90 + c * 140, H2 - 100, col, gl));
  const d = E.io(o.drag ?? 0), ix = lerp(90 + 2 * 140, 90 + 2 * 140, d), iy = lerp(140 + 150, H2 - 100, d) - Math.sin(d * Math.PI) * 60;
  appIcon(x, 'icon_deepseek', ix, iy, 92 * (1 + 0.15 * Math.sin(d * Math.PI)));
  x.fillStyle = '#FFFFFF'; x.font = font(18, 600, SANS); x.textAlign = 'center'; if (d < 0.05) x.fillText('DeepSeek', ix, iy + 64); x.textAlign = 'left';
  x.restore();
  return { x: ix * k, y: iy * k };
}
// the chat as it looks in the phone app: a top bar, big bubbles; o.msgs as in dsChat
export function dsPhone(x, sw, sh, t, o = {}) {
  x.fillStyle = '#FFFFFF'; x.fillRect(0, 0, sw, sh);
  const k = sw / 600; x.save(); x.scale(k, k); const H2 = sh / k;
  x.fillStyle = '#111827'; x.font = font(24, 700, SANS); x.textBaseline = 'middle'; x.fillText('9:41', 30, 32);
  whale(x, 210, 100, 44); x.font = font(32, 800, SANS); x.fillText('DeepSeek', 244, 101);
  x.fillStyle = '#F3F4F6'; x.fillRect(0, 150, 600, 2);
  let y = 200;
  for (const m of o.msgs ?? []) {
    if (t < (m.t0 ?? -1e9)) break;
    const n = m.cps ? Math.floor((t - m.t0) * m.cps) : 1e9, txt = [...m.text].slice(0, Math.max(0, n)).join('');
    x.font = font(m.size ?? 36, 600, SANS);
    if (m.who === 'user') { const w = x.measureText(m.text).width + 56; x.fillStyle = '#EFF6FF'; x.beginPath(); x.roundRect(570 - w, y, w, 76, 30); x.fill(); x.fillStyle = '#1F2937'; x.fillText(m.text, 598 - w, y + 39); y += 110; }
    else { whale(x, 50, y + 30, 54); const lines = wrap(x, txt, 440); x.fillStyle = m.who === 'error' ? '#6B7280' : '#111827'; lines.forEach((l, i) => x.fillText(l, 96, y + 32 + i * 52)); y += Math.max(1, lines.length) * 52 + 50; }
  }
  if (o.dots) { whale(x, 50, y + 30, 54); for (let i = 0; i < 3; i++) { x.fillStyle = rgba('#9CA3AF', 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - i * 0.9))); x.beginPath(); x.arc(110 + i * 30, y + 32, 9, 0, TAU); x.fill(); } }
  x.fillStyle = '#F3F4F6'; x.beginPath(); x.roundRect(30, H2 - 130, 540, 84, 42); x.fill(); x.fillStyle = '#9CA3AF'; x.font = font(28, 500, SANS); x.fillText('给 DeepSeek 发送消息', 66, H2 - 88);
  x.restore();
}
