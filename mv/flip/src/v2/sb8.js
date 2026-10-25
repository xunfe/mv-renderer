// v2 §25: the bridge, 那天早上 八点十一 … 后来灯亮了 (118.10–132.74). 本人 10-23: 2:00–2:12 was interfaces and she never appeared;
// adding small things did not help: the design was wrong at its root. It was told from your side. Now it is told from hers: the
// phone's screen is the glass of her tank, and through the whole outage she is right behind it.
// 那天早上 八点十一: her bright little world; she waves good morning at the glass and holds up a reply; the clock turns 8:11 and on 一
// the lights go out. 整个世界 突然没有回音: in the dark the whole world's messages come raining down; she cups her hands and calls,
// and her reply floats up to the glass and breaks there: no echo. 五个小时 你一遍一遍刷新: at the glass. Your finger taps on the
// outside, again and again, a ripple each time; each time she is there, palms on the glass, knocking back, her cheek squashed
// against it. Outside the morning turns to noon. 屏幕上只写着 暂时不可用: all you can see is 服务暂时不可用 across the glass; behind
// it she sits down against the glass and puts up a palm, and your fingertip comes to rest on the same spot from outside. Neither
// knows. (The payoff comes at 一直在: the page breaks and the fingertips really touch.) 后来灯亮了: her lamps come back on one by one.
import { W, H, TAU, lerp, sat, E, rnd, plate, sheet, cover } from './core.js';
import { tipProp } from '../common.js';
import { rgba, font, SANS } from '../lib.js';
import * as L from './life.js';
import { statusPage } from '../ui.js';
import { layer } from '../scenesD.js';

const FT = t => globalThis.__frameT ?? t;
const at = (t, keys) => { let v = keys[0][1]; for (const [t0, x] of keys) if (t >= t0) v = x; return v; };
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };

const OUT = 120.41, CALL = 121.99, POP = 122.96, AT_GLASS = 125.59, SIT = 128.6, LIGHTS = 131.545, END = 132.74;
const TAPS = [125.59, 126.01, 126.289, 126.349, 126.57, 127.06, 127.55];
const LAMPS = [[131.545, 346, 104], [131.751, 1244, 104], [132.0, 492, 95], [132.25, 1006, 89]];      // the star lanterns (n_tank image px)

// her poses through the bridge: [time, sheet, frame]
const POSE = [[0, 'n_bridge_a', 0], [119.55, 'n_bridge_a', 1], [OUT, 'n_bridge_a', 2], [CALL, 'n_bridge_a', 3], [123.62, 'n_bridge_b', 0],
  [AT_GLASS, 'n_bridge_b', 1], [126.01, 'n_bridge_b', 2], [126.57, 'n_bridge_b', 3], [127.06, 'n_bridge_c', 0], [SIT, 'n_bridge_c', 1],
  [130.22, 'n_bridge_c', 2], [131.751, 'n_bridge_c', 3]];

// the camera on the tank: [time, zoom, focus x, focus y] eased between keys
const CAM = [[118.1, 1.04, 0.5, 0.5], [120.5, 1.1, 0.5, 0.52], [120.52, 1.16, 0.5, 0.52], [124.0, 1.0, 0.5, 0.5],
  [124.18, 1.0, 0.5, 0.5], [125.4, 1.16, 0.5, 0.5], [127.9, 1.2, 0.5, 0.5], [127.92, 1.2, 0.5, 0.5], [129.0, 1.08, 0.5, 0.52], [132.74, 1.02, 0.5, 0.5]];
// her right palm (the side your hand comes from) in the drawings where she touches the glass (frame px); c frames 1-3 are mirrored
const PALM = { 'n_bridge_b:1': [315, 330], 'n_bridge_b:2': [300, 320], 'n_bridge_b:3': [363, 330], 'n_bridge_c:0': [337, 337], 'n_bridge_c:2': [99, 317] };
const FLIP = (sid, k) => sid === 'n_bridge_c' && k >= 1;
function onFrame(sid, k, x, y, hk, px, py) {                              // a point of a drawing placed by L.put (anchor bottom) on screen
  const f = sheet(sid)?.frames[k]; if (!f) return [x, y]; const sc = hk / f.h, fl = FLIP(sid, k) ? -1 : 1;
  return [x + fl * (px - f.ax) * sc, y + (py - (f.h - 3)) * sc];
}
function cam(t) {
  let i = 0; while (i < CAM.length - 2 && t >= CAM[i + 1][0]) i++;
  const [t0, z0, x0, y0] = CAM[i], [t1, z1, x1, y1] = CAM[i + 1], u = E.io(sat(t, t0, t1));
  return { z: lerp(z0, z1, u), fx: lerp(x0, x1, u), fy: lerp(y0, y1, u) };
}
// where an image point of the tank plate lands on screen
const tankPt = (o, ix, iy) => { const im = plate('n_tank'); if (!im) return [ix, iy]; const s = Math.max(W / im.width, H / im.height) * o.z, w = im.width * s, h = im.height * s;
  return [W / 2 - o.fx * w + ix * s, H / 2 - o.fy * h + iy * s, s]; };

// the world's messages, raining into the dark (整个世界)
const ASK = ['你好？', '在吗', '？', '人呢', '在不在', '？？', '能用吗', '急', '回我', '你好', '？', '在吗？'];
function worldBubbles(ctx, t, o) {
  for (let i = 0; i < 30; i++) {
    const t0 = 120.6 + i * 0.1 + rnd(i, 3) * 0.08, d = t - t0; if (d < 0) continue;
    let ix = 120 + rnd(i, 1) * 1300; const rest = 560 + rnd(i, 2) * 380; if (Math.abs(ix - 768) < 240) ix = 768 + Math.sign(ix - 768 || 1) * (240 + rnd(i, 7) * 60);
    const iy = Math.min(rest, -60 + d * (150 + 90 * rnd(i, 4)));
    const [x, y, s] = tankPt(o, ix + Math.sin(d * 1.6 + i) * 18, iy), a = Math.min(1, d * 3) * (1 - sat(t, 124.0, 124.3)), size = (24 + 8 * rnd(i, 5)) * s / 1.25;
    if (a <= 0.01) continue;
    const str = ASK[i % ASK.length]; ctx.save(); ctx.font = font(size, 700, SANS); const w = ctx.measureText(str).width + size * 1.2, h = size * 1.7;
    glow(ctx, x, y, w * 0.9, '#9FD8FF', 0.25 * a);
    ctx.globalAlpha = 0.88 * a; ctx.fillStyle = '#EAF6FF'; ctx.strokeStyle = '#3A5A9A'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#2A3F78'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y + 1); ctx.restore();
  }
}
// her reply: up from her hands to the glass, where it breaks (没有回音)
function herCall(ctx, t, fx, fy, h) {
  if (t < CALL || t > POP + 0.6) return;
  const p = E.io(sat(t, CALL, POP)), x = fx + Math.sin(p * 5) * 14, y = lerp(fy - h * 0.62, 70, p), r = 34 + 8 * Math.sin(t * 6);
  if (t < POP) { glow(ctx, x, y, r * 2.4, '#FFE7A0', 0.6); ctx.save(); ctx.fillStyle = rgba('#FFF6D8', 0.9); ctx.strokeStyle = '#8A5A10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7A4A00'; ctx.font = font(30, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('在！', x, y + 1); ctx.restore(); return; }
  const d = t - POP;                                                       // it breaks into a few motes against the glass and is gone
  for (let k = 0; k < 10; k++) { const an = k / 10 * TAU, v = 160 * (1 + rnd(k, 9)); glow(ctx, x + Math.cos(an) * v * d, 70 + Math.sin(an) * v * d * 0.4 + 60 * d * d, 22, '#FFE7A0', 0.7 * (1 - d / 0.6)); }
}
// the glass: your fingertip tapping, a ripple each time; the morning light outside
function glass(ctx, t, o, tap) {
  for (const t0 of TAPS) { const d = t - t0; if (d < 0 || d > 0.8) continue;      // the ripples
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const k of [0, 0.18]) { const e = sat(d - k, 0, 0.8); if (e <= 0) continue; ctx.strokeStyle = rgba('#FFFFFF', 0.7 * (1 - e)); ctx.lineWidth = 6 * (1 - e) + 1;
      ctx.beginPath(); ctx.ellipse(tap[0], tap[1], 20 + e * 320, 14 + e * 230, 0, 0, TAU); ctx.stroke(); }
    ctx.restore(); }
}
function finger(ctx, t, tap, until) {      // tap: where it lands (her palm)                                     // your hand, outside, coming in from the right
  const inn = E.out(sat(t, AT_GLASS - 0.35, AT_GLASS)), out = E.in(sat(t, until, until + 0.3)); if (inn <= 0 || out >= 1) return;
  const last = TAPS.filter(t0 => t >= t0).pop(), d = last ? t - last : 9, press = d < 0.16 ? Math.sin(d / 0.16 * Math.PI) : 0;
  const away = (1 - inn) + out;
  tipProp(ctx, 'prop_hand_tap', tap[0] + away * 900 + (1 - press) * 12, tap[1] + away * 260 - (1 - press) * 16, 560);
}
function banner(ctx, t) {                                                 // 服务暂时不可用: all that shows on your side
  const a = E.out(sat(t, 128.67, 128.95)) * (1 - sat(t, 131.4, 131.9)); if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(239,68,68,0.78)'; ctx.beginPath(); ctx.roundRect(W / 2 - 520, 105, 1040, 120, 26); ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(64, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('服务暂时不可用', W / 2, 167);
  ctx.restore();
}
function phone(ctx, t, clock) {                                           // we are right at a phone's screen: its rounded edge, its clock
  ctx.save(); ctx.strokeStyle = '#05070D'; ctx.lineWidth = 70; ctx.beginPath(); ctx.roundRect(-30, -30, W + 60, H + 60, 120); ctx.stroke(); ctx.restore();
  ctx.save(); ctx.fillStyle = rgba('#FFFFFF', 0.92); ctx.font = font(34, 700, SANS); ctx.textBaseline = 'middle'; ctx.fillText(clock, 110, 52);
  ctx.textAlign = 'right'; ctx.font = font(26, 700, SANS); ctx.fillText('▂▄▆  5G  ▭', W - 110, 52); ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen';                    // the glass: one soft diagonal sheen
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0.18, 'rgba(255,255,255,0)'); g.addColorStop(0.24, 'rgba(255,255,255,0.07)'); g.addColorStop(0.3, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
const hhmm = m => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

export function shotTank(ctx, t, opts = {}) {      // opts.split: her half of the split screen (no phone, no hand: the line is the glass)
  const split = !!opts.split;
  const o = cam(t), ft = FT(t);
  const lit = ft < OUT ? 1 : ft < OUT + 0.09 ? (Math.floor((ft - OUT) / 0.03) % 2 ? 0.6 : 0.15) : 0;      // the lights flicker and die on 一
  const back = sat(t, LIGHTS, END) * 0.85;                                // 后来灯亮了
  const noon = sat(t, 124.4, 127.6);                                      // the light from outside, morning to noon, while she waits at the glass
  const close = E.io(sat(t, 124.4, 125.4)) * (1 - E.io(sat(t, 131.3, 132.3)));       // she comes right up to the glass and stays there till the lights
  const bf = close > 0.01 ? `blur(${(7 * close).toFixed(1)}px)` : undefined;
  cover(ctx, plate('n_tank_dark') ?? plate('n_tank'), { ...o, filter: bf });
  if (lit > 0 || back > 0) cover(ctx, plate('n_tank'), { ...o, alpha: Math.max(lit, back), filter: bf });
  if (t >= OUT && t < LIGHTS + 1.2) {                                     // light coming in through the glass from your room
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const a = 0.08 + 0.22 * noon * (1 - sat(t, 129.0, 131.4) * 0.5);
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, rgba(noon < 0.5 ? '#FFD9A0' : '#EAF3FF', a)); g.addColorStop(1, rgba('#FFFFFF', a * 0.3));
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  LAMPS.forEach(([t0, ix, iy]) => { if (t < t0) return; const [x, y] = tankPt(o, ix, iy); glow(ctx, x, y, 170, '#FFE7A0', 0.85 * E.out(sat(t, t0, t0 + 0.25))); });
  if (!split && t > 120.5 && t < 124.4) worldBubbles(ctx, t, o);
  // her, in the middle of the sand
  const [, sid, k] = POSE.filter(p => ft >= p[0]).pop(), [bx, by, s] = tankPt(o, 768, 905);
  let fx = lerp(bx, W / 2, close); const fy = lerp(by, 1045, close), h = lerp(560 * s / 1.25, split ? 820 : 860, close);
  const flip = split ? false : FLIP(sid, k);
  if (split && opts.divLocal != null) {                                     // sitting by the line: her raised palm against it (n_bridge_c 2, not mirrored)
    const c2 = sheet('n_bridge_c')?.frames[2], hc = c2 ? h * c2.h / sheet('n_bridge_c').frames[0].h : h;
    const want = opts.divLocal + 34 - (c2 ? (PALM['n_bridge_c:2'][0] - c2.ax) * hc / c2.h : 0), u = E.io(sat(t, 127.6, 128.4)) * (1 - E.io(sat(t, 131.3, 131.9)));
    fx = lerp(fx, want, u);
  }
  const dim = 1 - Math.max(lit, back, 0.62 * noon * (t > 124.18 && t < 131.4 ? 1 : 0), 0);
  const filter = dim > 0.02 ? `brightness(${(1 - 0.42 * dim).toFixed(3)}) saturate(${(1 - 0.2 * dim).toFixed(3)})` : undefined;
  const bob = Math.sin(t * 2.2) * 6 * s;                                   // she floats a little in the water
  const sh = sheet(sid), hk = sh ? h * sh.frames[k].h / sh.frames[0].h : h;      // one scale per sheet: sitting is shorter, not bigger
  L.put(ctx, sid, k, fx, fy + bob, hk, { filter, flip });
  if (t < OUT) glow(ctx, fx, fy - h * 0.5, h * 0.9, '#FFF2C8', 0.15);
  if (!split) herCall(ctx, t, fx, fy, h);
  // outside the glass
  const palm = PALM[sid + ':' + k] ?? PALM['n_bridge_b:1'], ref = PALM[sid + ':' + k] ? [sid, k] : ['n_bridge_b', 1];
  const rh = sheet(ref[0]) ? h * sheet(ref[0]).frames[ref[1]].h / sheet(ref[0]).frames[0].h : h, tap = onFrame(ref[0], ref[1], fx, fy + bob, rh, ...palm);
  const c2 = sheet('n_bridge_c')?.frames[2], hc2 = c2 ? h * c2.h / sheet('n_bridge_c').frames[0].h : h;
  const info = { fx, fy: fy + bob, h, palm2: c2 ? [fx + (PALM['n_bridge_c:2'][0] - c2.ax) * hc2 / c2.h, fy + bob + (PALM['n_bridge_c:2'][1] - (c2.h - 3)) * hc2 / c2.h] : [fx, fy] };
  if (split) { if (t >= 124.18 && t < 128.0) glass(ctx, t, o, tap); return info; }
  if (t >= 124.18 && t < 131.4) glass(ctx, t, o, tap);
  if (t >= 124.18 && t < 128.0) finger(ctx, t, tap, 127.75);
  if (t >= 129.4 && t < 131.6) {                                          // your fingertip comes to rest where her palm is
    const p = E.out(sat(t, 129.6, 130.15)), out = E.in(sat(t, 131.3, 131.6)), rc = sheet('n_bridge_c'), hc = rc ? h * rc.frames[2].h / rc.frames[0].h : h;
    const [px, py] = onFrame('n_bridge_c', 2, fx, fy + bob, hc, ...PALM['n_bridge_c:2']);      // where her palm will be on 不 (130.22)
    tipProp(ctx, 'prop_hand_tap', px + (1 - p + out) * 700, py + (1 - p + out) * 240, 560 * s / 1.25);
  }
  banner(ctx, t);
  const mins = t < 124.18 ? (t < OUT ? 8 * 60 + 10 : 8 * 60 + 11) : lerp(8 * 60 + 11, 12 * 60 + 49, E.io(sat(t, 124.18, 127.6)));
  phone(ctx, t, hhmm(mins));
  ctx.fillStyle = `rgba(0,0,0,${1 - sat(t, 118.1, 118.6)})`; ctx.fillRect(0, 0, W, H);
  return info;
}

// ---------------------------------------------------------------- §26 the split (本人 10-23: 12 秒都是一个鱼缸也不好；可以双视角叙事，
// 比如左右). Left, your side (the shots the bridge had: the desk at 8:11, the street, the desk through five hours, into 服务暂时不可用,
// the status page going green); right, her side (the tank). The line between them is the screen. On 早上 the line slides in and
// she is there; the street's messages fly across the line and sink into her dark water, her 在！ breaks on it; every tap on your
// side ripples her glass and she knocks back; on 不 your fingertip and her palm come to the line from either side; on 灯亮了 both
// sides light up (your bars go green, her lanterns come on); then the street, full frame.
const CROSS = ['你好？', '在吗', '？', '人呢', '在不在', '？？', '能用吗', '急', '回我', '你好', '在吗？', '？'];
function crossing(ctx, t, sx) {                                           // the world's messages, across the line into her water
  for (let i = 0; i < 22; i++) {
    const t0 = 120.75 + i * 0.13 + rnd(i, 3) * 0.08, d = t - t0; if (d < 0) continue;
    const x0 = 80 + rnd(i, 1) * (sx - 200), y0 = 260 + rnd(i, 2) * 420, x1 = sx + 90 + rnd(i, 4) * (W - sx - 180), y1 = 160 + rnd(i, 5) * 240;
    const fly = E.io(sat(d, 0, 1.0)), sink = Math.max(0, d - 1.0);
    const x = lerp(x0, x1, fly), y = lerp(y0, y1, fly) - Math.sin(fly * Math.PI) * 120 + Math.min(sink * 90, 520 - y1 + rnd(i, 6) * 300) + Math.sin(d * 1.7 + i) * 8;
    const a = Math.min(1, d * 4) * (1 - sat(t, 124.0, 124.3)); if (a <= 0.01) continue;
    const size = 28 + 6 * rnd(i, 7), str = CROSS[i % CROSS.length]; ctx.save(); ctx.font = font(size, 700, SANS); const w = ctx.measureText(str).width + size * 1.2, h = size * 1.7;
    const dark = x > sx ? 0.35 : 0;                                       // over the line it is in the dark water
    glow(ctx, x, y, w * 0.9, '#9FD8FF', 0.22 * a);
    ctx.globalAlpha = 0.92 * a * (1 - dark * 0.3); ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1B2140'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1B2140'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y + 1); ctx.restore();
  }
}
function reply(ctx, t, sx, info, shift) {                                  // her 在！, out of her hands to the line, where it breaks
  if (t < CALL || t > POP + 0.6) return;
  const x0 = info.fx + shift, y0 = info.fy - info.h * 0.62, p = E.io(sat(t, CALL, POP)), x = lerp(x0, sx + 10, p), y = lerp(y0, 380, p) - Math.sin(p * Math.PI) * 90, r = 40 + 8 * Math.sin(t * 6);
  if (t < POP) { glow(ctx, x, y, r * 2.4, '#FFE7A0', 0.6); ctx.save(); ctx.fillStyle = rgba('#FFF6D8', 0.92); ctx.strokeStyle = '#8A5A10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7A4A00'; ctx.font = font(34, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('在！', x, y + 1); ctx.restore(); return; }
  const d = t - POP;
  for (let k = 0; k < 12; k++) { const an = (k / 12 - 0.5) * Math.PI + Math.PI / 2 * 0, v = 150 * (1 + rnd(k, 9)); glow(ctx, sx + 14 + Math.abs(Math.cos(an)) * v * d, 380 + Math.sin(an) * v * d + 80 * d * d, 22, '#FFE7A0', 0.75 * (1 - d / 0.6)); }
  if (d < 0.25) { ctx.save(); ctx.strokeStyle = rgba('#FFF6D8', 0.9 * (1 - d / 0.25)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(sx + 6, 380, 20 + d * 260, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore(); }
}
function divider(ctx, t, sx) {
  if (sx >= W - 1) return;
  const tap = TAPS.reduce((m, t0) => (t >= t0 && t - t0 < 0.3 ? Math.max(m, 1 - (t - t0) / 0.3) : m), 0);
  ctx.save(); ctx.fillStyle = '#0B1430'; ctx.fillRect(sx - 7, 0, 14, H);
  ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(sx - 40, 0, sx + 40, 0);
  g.addColorStop(0, 'rgba(160,210,255,0)'); g.addColorStop(0.5, rgba('#BFE3FF', 0.35 + 0.5 * tap)); g.addColorStop(1, 'rgba(160,210,255,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 40, 0, 80, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba('#EAF6FF', 0.85); ctx.fillRect(sx - 1.5, 0, 3, H); ctx.restore();
}
// your side from 129.4: the status page framed for the half (the full-frame push centred 暂时不可用 off the half), closing on the
// banner; on 灯亮了 the bars go green and the banner turns to 所有服务已恢复正常
export function statusHalf(ctx, t) {
  const ok = E.io(sat(t, 131.54, 132.6)) * 0.999 + (t >= 132.6 ? 0.001 : 0), lay = layer(ctx, l => statusPage(l, W, H, t, { ok }));
  const e = E.io(sat(t, 129.27, 130.5)), z = lerp(1.0, 1.08, e) + 0.04 * sat(t, 130.5, 132.7), fx = 560, fy = H / 2;      // as sb7 with __half
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy); ctx.drawImage(lay, 0, 0, W, H); ctx.restore();
  if (t < 131.54) { const pulse = 0.5 + 0.5 * Math.sin(t * 5); ctx.fillStyle = `rgba(239,68,68,${0.06 * pulse})`; ctx.fillRect(0, 0, W, H); }
  else { ctx.fillStyle = rgba('#FFFFFF', 0.5 * Math.exp(-6 * (t - 132.6)) * (t > 132.6 ? 1 : 0)); ctx.fillRect(0, 0, W, H); }
}
export function makeSplit(left) {                                          // left: [[t0, shot], ...] your side
  return (ctx, t) => {
    const sx = lerp(W, W / 2, E.io(sat(t, 118.75, 119.35))), lshift = sx / 2 - W / 2, rshift = sx / 2;
    const shot = left.filter(([t0]) => t >= t0).pop()[1];
    globalThis.__half = true;
    try { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, sx, H); ctx.clip(); ctx.translate(lshift, 0); shot(ctx, t); ctx.restore(); } finally { globalThis.__half = false; }
    let info = null;
    if (sx < W - 1) { ctx.save(); ctx.beginPath(); ctx.rect(sx, 0, W - sx, H); ctx.clip(); ctx.translate(rshift, 0); info = shotTank(ctx, t, { split: true, divLocal: sx - rshift }); ctx.restore(); }
    if (t > 120.6 && t < 124.4) crossing(ctx, t, sx);
    divider(ctx, t, sx);
    if (info) reply(ctx, t, sx, info, rshift);
    if (info && t >= 129.4 && t < 131.6) {                                 // on 不 your fingertip comes to the line, against her palm on the other side
      const p = E.out(sat(t, 129.6, 130.2)), out = E.in(sat(t, 131.3, 131.6)), py = info.palm2[1];
      tipProp(ctx, 'prop_hand_tap', sx - 6 - (1 - p + out) * 700, py + (1 - p + out) * 200, 520, { flip: true });
      if (t > 130.22) glow(ctx, sx, py, 120, '#FFF2C8', 0.35 * E.out(sat(t, 130.22, 130.5)) * (1 - out));
    }
  };
}

