// v2 §27: the bridge (那天早上 … 后来灯亮了, 118.10–132.74) as a split screen drawn natively for it. 本人 10-23: 不要用 16:9 裁剪成这样，
// 原生做成左右屏，资产都重做. Every picture is a vertical half painted for its panel (gen/v2 p_*): left your side, right hers, and the
// line between is the screen. Both halves slide in on 那; your messages fly across the line into her dark water and her 在！ breaks
// on it; each tap of yours ripples her glass; on 不 your fingertip and her palm meet the line from either side; on 灯亮了 both light up.
import { W, H, TAU, lerp, sat, E, rnd, plate, sheet } from './core.js';
import { warpQuad, tipProp } from '../common.js';
import { rgba, font, SANS } from '../lib.js';
import * as F from '../scenesF.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;
const PW = W / 2;
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };

// a plate covering a panel [x0, x0 + w] x [0, H]; o.fx/fy: the image point (fractions) at the panel's centre, clamped to cover it
export function panel(ctx, x0, w, id, o = {}) {
  const im = plate(id); if (!im) return null;
  const s = Math.max(w / im.width, H / im.height) * (o.z ?? 1), iw = im.width * s, ih = im.height * s;
  const ox = Math.min(x0, Math.max(x0 + w - iw, x0 + w / 2 - (o.fx ?? 0.5) * iw)), oy = Math.min(0, Math.max(H - ih, H / 2 - (o.fy ?? 0.5) * ih));
  if ((o.alpha ?? 1) > 0.003) { ctx.save(); ctx.globalAlpha *= o.alpha ?? 1; if (o.filter) ctx.filter = o.filter; ctx.drawImage(im, ox, oy, iw, ih); ctx.restore(); }
  return { s, ox, oy, iw, ih, pt: (ix, iy) => [ox + ix * s, oy + iy * s] };
}
// content on a screen painted green into the plate: mapped onto its corners, cut to its own mask (tools/screen_mask.py)
let MQ = null;
export function screen(ctx, M, id, quad, sw, sh, fn, bg = '#FFFFFF') {      // bg: the screen's own colour, under the content (no green at the rounded edges)
  const cx = quad.reduce((a, p) => a + p[0], 0) / 4, cy = quad.reduce((a, p) => a + p[1], 0) / 4;      // the corners sit inside rounded corners: grow a little, the mask cuts it
  const mk = plate(id + '_scr'), Q = quad.map(([x, y]) => M.pt(cx + (x - cx) * 1.04, cy + (y - cy) * 1.03)), cv = ctx.canvas;
  if (!mk) return warpQuad(ctx, Q, sw, sh, fn, { res: 0.9 });
  if (!MQ || MQ.width !== cv.width || MQ.height !== cv.height) MQ = new OffscreenCanvas(cv.width, cv.height);
  const l = MQ.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.filter = 'none'; l.globalCompositeOperation = 'source-over'; l.clearRect(0, 0, cv.width, cv.height);
  l.setTransform(ctx.getTransform()); l.fillStyle = bg; l.fillRect(M.ox, M.oy, M.iw, M.ih); warpQuad(l, Q, sw, sh, fn, { res: 0.9 });
  l.globalCompositeOperation = 'destination-in'; l.drawImage(mk, M.ox, M.oy, M.iw, M.ih);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(MQ, 0, 0); ctx.restore();
}

const OUT = 120.41, SUDDEN = 121.99, LOOK = 122.4, CALL = 121.99, POP = 122.96, SIT = 128.6, LIGHTS = 131.545, END = 132.74;
const TAPS = [125.59, 126.01, 126.289, 126.349, 126.57, 127.06, 127.55];
const DESK_SCR = [[201, 478], [881, 479], [893, 870], [185, 870]], PAD = [523, 1068];                // p_desk_am / noon (image px)
const CAT = [[124.97, 0, 150], [125.59, 1, 104], [126.29, 2, 112]];                                    // on the sill: when, drawing, height
const ITEMS = [[125.35, 2, 70, 1100, 120], [126.01, 1, 235, 1240, 160], [126.57, 3, 400, 1262, 56], [126.8, 3, 345, 1282, 50], [127.06, 4, 1010, 1270, 120]];
const HEADS = [[300, 470, 1.15], [330, 765, 0.8], [455, 770, 0.8], [535, 750, 0.75], [612, 790, 0.7], [712, 760, 0.75], [812, 800, 0.8], [905, 585, 1.15]];   // p_street
const ASK = ['你好？', '在吗', '人呢', '？', '在不在', '能用吗', '回我', '你好？'];
const LANTERNS = [[131.545, 248, 122], [131.751, 1010, 140], [132.0, 372, 102], [132.25, 822, 100]];   // p_tank

// ---------------------------------------------------------------- your side
const lockTime = t => (t < 119.55 ? '8:10' : t < 124.18 ? '8:11' : F.hhmm(lerp(8 * 60 + 11, 12 * 60 + 49, E.io(sat(t, 124.18, 127.6)))));
function deskSide(ctx, t, x0, w) {
  const ft = FT(t), lapse = t >= 124.18;
  const into = E.in(sat(t, 127.92, 129.17));                              // into the laptop's screen (屏幕上…)
  const o = lapse ? { z: lerp(1.0, 2.35, into), fx: lerp(0.5, 0.484, into), fy: lerp(0.47, 0.477, into) } : { z: lerp(1.02, 1.12, E.io(sat(t, 118.1, 120.5))), fx: 0.5, fy: lerp(0.46, 0.44, sat(t, 118.1, 120.5)) };
  const M = panel(ctx, x0, w, 'p_desk_am', o); if (!M) return;
  if (lapse) panel(ctx, x0, w, 'p_desk_noon', { ...o, alpha: E.io(sat(t, 124.4, 127.6)) });
  const last = TAPS.filter(t0 => t >= t0).pop(), n = lapse ? Math.floor(lerp(1, 31, sat(ft, 124.18, 127.6))) + TAPS.filter(t0 => ft >= t0).length : 0;
  screen(ctx, M, 'p_desk_am', DESK_SCR, 1000, 562, (x, sw, sh) => {
    if (t >= 127.92) statusPage(x, sw, sh, t, 0, true);
    else F.lockScreen(x, sw, sh, t, lockTime(ft), lapse ? { spin: (last ? t - last : t) * 9, n } : {});
  }, t >= 127.92 ? '#F8FAFC' : '#2A4A84');                                 // the screen's colour under it: the page's white, the lock screen's blue
  if (!lapse) { const [cx, cy] = M.pt(1040, 870); steam(ctx, t, cx, cy, M.s, 1); return; }
  const cat = CAT.filter(([t0]) => ft >= t0).pop();                       // time-lapse: the cat sits, lies down, falls asleep
  if (cat) { const [x, y] = M.pt(330, 418); L.put(ctx, 'n_desk_cat', cat[1], x, y, cat[2] * M.s, { sy: cat[1] === 2 ? 1 + 0.02 * Math.sin(t * 2.2) : 1 }); }
  ITEMS.forEach(([t0, k, ix, iy, h]) => { if (ft < t0) return; const [x, y] = M.pt(ix, iy); L.put(ctx, 'n_desk_items', k, x, y, h * M.s); if (k === 1) steam(ctx, t, x, y - h * M.s, M.s, 1); });
  const inH = E.out(sat(t, 125.3, 125.59)), outH = E.in(sat(t, 127.7, 127.95));      // your hand, tapping refresh
  if (inH > 0 && outH < 1) {
    const [px, py] = M.pt(...PAD), d = last ? t - last : 9, press = d < 0.14 ? Math.sin(d / 0.14 * Math.PI) : 0, away = 1 - inH + outH;
    tipProp(ctx, 'prop_hand_tap', px + away * 700, py - 6 * M.s + press * 10 * M.s + away * 160, 520 * M.s);
    if (d < 0.4) { ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.8 * (1 - d / 0.4)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py, (16 + d * 110) * M.s, (6 + d * 40) * M.s, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
  }
}
function steam(ctx, t, x, y, s, a) {
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 4; k++) { const d = ((t * 0.6) + k / 4) % 1; ctx.fillStyle = rgba('#FFFFFF', 0.22 * a * Math.sin(d * Math.PI)); ctx.beginPath(); ctx.arc(x + Math.sin(d * 5 + k) * 14 * s, y - d * 130 * s, (9 + d * 20) * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// the status page, laid out for whatever frame it is in (the laptop's landscape screen, or the portrait panel itself)
function statusPage(x, sw, sh, t, ok, land) {
  x.fillStyle = '#F8FAFC'; x.fillRect(0, 0, sw, sh);
  const u = sw / 960, pad = 56 * u, red = '#EF4444', green = '#22C55E';
  x.save(); x.textBaseline = 'middle';
  x.fillStyle = '#4D6BFE'; x.beginPath(); x.arc(pad + 22 * u, 80 * u, 22 * u, 0, TAU); x.fill();
  x.fillStyle = '#111827'; x.font = font(44 * u, 800, SANS); x.fillText('DeepSeek 服务状态', pad + 62 * u, 82 * u);
  const by = land ? 150 * u : 190 * u, bh = land ? 110 * u : 150 * u;
  x.fillStyle = ok >= 1 ? green : red; x.beginPath(); x.roundRect(pad, by, sw - 2 * pad, bh, 22 * u); x.fill();
  x.fillStyle = '#FFFFFF'; x.font = font((land ? 58 : 66) * u, 900, SANS); x.fillText(ok >= 1 ? '所有服务已恢复正常' : '服务暂时不可用', pad + 36 * u, by + bh / 2 + 2 * u);
  const rows = land ? [['网页 / App 对话', by + bh + 70 * u]] : [['网页 / App 对话', by + bh + 110 * u], ['API 服务', by + bh + 420 * u]];
  const nb = 28, bw = (sw - 2 * pad) / nb;
  rows.forEach(([name, y]) => {
    x.fillStyle = '#111827'; x.font = font(34 * u, 700, SANS); x.fillText(name, pad, y);
    for (let i = 0; i < nb; i++) { const lit = i >= nb - 5 ? (i - (nb - 5)) / 5 < ok : true; x.fillStyle = i >= nb - 5 ? (lit && ok > 0 ? green : red) : green;
      x.beginPath(); x.roundRect(pad + i * bw + 3 * u, y + 40 * u, bw - 6 * u, (land ? 120 : 190) * u, 6 * u); x.fill(); }
    x.fillStyle = '#9CA3AF'; x.font = font(24 * u, 500, SANS); x.fillText('60 天前', pad, y + (land ? 190 : 270) * u); x.textAlign = 'right'; x.fillText('今天', sw - pad, y + (land ? 190 : 270) * u); x.textAlign = 'left';
  });
  x.restore();
}
function statusSide(ctx, t, x0, w) {                                     // the page itself, filling your half
  const ok = E.io(sat(t, LIGHTS, 132.6)) * 0.999 + (t >= 132.6 ? 0.001 : 0), z = 1 + 0.06 * sat(t, 129.17, 132.7);
  ctx.save(); ctx.translate(x0 + w / 2, H / 2); ctx.scale(z, z); ctx.translate(-w / 2, -H / 2); statusPage(ctx, w, H, t, ok, false); ctx.restore();
  if (t < LIGHTS) { ctx.fillStyle = `rgba(239,68,68,${0.05 * (0.5 + 0.5 * Math.sin(t * 5))})`; ctx.fillRect(x0, 0, w, H); }
  else { ctx.fillStyle = rgba('#FFFFFF', 0.5 * Math.exp(-6 * Math.max(0, t - 132.6)) * (t > 132.6 ? 1 : 0)); ctx.fillRect(x0, 0, w, H); }
}
function streetSide(ctx, t, x0, w) {
  const o = { z: lerp(1.02, 1.08, sat(t, 120.52, 124.18)), fx: 0.5, fy: 0.55 };
  const M = panel(ctx, x0, w, FT(t) >= LOOK ? 'p_street_up' : 'p_street', o); if (!M) return null;      // everyone looks up at once (a cut)
  const sh = sat(t, SUDDEN, SUDDEN + 0.9);                                // a cloud's shadow runs over the street on 突然
  if (t > SUDDEN) { const cx = lerp(x0 + w * 1.8, x0 - w * 0.4, E.io(sh)); ctx.save(); const g = ctx.createLinearGradient(cx - 700, 0, cx + 700, 0);
    g.addColorStop(0, 'rgba(18,26,56,0.12)'); g.addColorStop(0.5, 'rgba(18,26,56,0.3)'); g.addColorStop(1, 'rgba(18,26,56,0)'); ctx.fillStyle = g; ctx.fillRect(x0, 0, w, H);
    ctx.fillStyle = `rgba(18,26,56,${0.14 * sat(t, SUDDEN + 0.3, SUDDEN + 0.9)})`; ctx.fillRect(x0, 0, w, H); ctx.restore(); }
  return M;
}

// ---------------------------------------------------------------- her side
const POSE = [[0, 'n_bridge_a', 0], [119.55, 'n_bridge_a', 1], [OUT, 'n_bridge_a', 2], [CALL, 'n_bridge_a', 3], [123.62, 'n_bridge_b', 0],
  [125.59, 'n_bridge_b', 1], [126.01, 'n_bridge_b', 2], [126.57, 'n_bridge_b', 3], [127.06, 'n_bridge_c', 0], [SIT, 'n_bridge_c', 1],
  [130.22, 'n_bridge_c', 2], [131.751, 'n_bridge_c', 3]];
const PALM = { 'n_bridge_b:1': [315, 330], 'n_bridge_b:2': [300, 320], 'n_bridge_b:3': [363, 330], 'n_bridge_c:0': [337, 337], 'n_bridge_c:2': [99, 317] };
function onFrame(sid, k, x, y, hk, px, py) { const f = sheet(sid)?.frames[k]; if (!f) return [x, y]; const sc = hk / f.h; return [x + (px - f.ax) * sc, y + (py - (f.h - 3)) * sc]; }
function tankSide(ctx, t, x0, w, line) {
  const ft = FT(t), lit = ft < OUT ? 1 : ft < OUT + 0.09 ? (Math.floor((ft - OUT) / 0.03) % 2 ? 0.6 : 0.15) : 0, back = sat(t, LIGHTS, END) * 0.9;
  const close = E.io(sat(t, 124.4, 125.4)) * (1 - E.io(sat(t, 131.3, 132.3))), noon = sat(t, 124.4, 127.6);
  const o = { z: lerp(1.0, 1.06, sat(t, 118.1, 132.74)), fx: 0.5, fy: 0.5 }, bf = close > 0.01 ? `blur(${(6 * close).toFixed(1)}px)` : undefined;
  const M = panel(ctx, x0, w, 'p_tank_dark', { ...o, filter: bf }) ?? panel(ctx, x0, w, 'p_tank', o); if (!M) return null;
  if (lit > 0 || back > 0) panel(ctx, x0, w, 'p_tank', { ...o, alpha: Math.max(lit, back), filter: bf });
  if (t >= OUT && t < LIGHTS + 1.2) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const a = 0.06 + 0.2 * noon * (1 - 0.5 * sat(t, 129.0, 131.4));      // your room's light through the glass
    const g = ctx.createLinearGradient(x0, 0, x0 + w, 0); g.addColorStop(0, rgba(noon < 0.5 ? '#FFD9A0' : '#EAF3FF', a)); g.addColorStop(1, rgba('#FFFFFF', a * 0.25)); ctx.fillStyle = g; ctx.fillRect(x0, 0, w, H); ctx.restore(); }
  LANTERNS.forEach(([t0, ix, iy]) => { if (t < t0) return; const [x, y] = M.pt(ix, iy); glow(ctx, x, y, 150, '#FFE7A0', 0.85 * E.out(sat(t, t0, t0 + 0.25))); });
  const [, sid, k] = POSE.filter(p => ft >= p[0]).pop(), sh = sheet(sid);
  const [bx, by] = M.pt(590, 1065), h = lerp(500, 800, close), hk = sh ? h * sh.frames[k].h / sh.frames[0].h : h;
  let fx = lerp(bx, x0 + w / 2, close); const fy = lerp(by, 1050, close), bob = Math.sin(t * 2.2) * 5;
  const c2 = sheet('n_bridge_c')?.frames[2], hc2 = c2 ? h * c2.h / sheet('n_bridge_c').frames[0].h : h;
  const toLine = E.io(sat(t, 127.6, 128.4)) * (1 - E.io(sat(t, 131.3, 131.9)));      // sitting by the line, her raised palm (c 2) against it
  if (c2) fx = lerp(fx, line + 34 - (PALM['n_bridge_c:2'][0] - c2.ax) * hc2 / c2.h, toLine);
  const dim = 1 - Math.max(lit, back, 0.62 * noon * (t > 124.18 && t < 131.4 ? 1 : 0));
  const filter = dim > 0.02 ? `brightness(${(1 - 0.42 * dim).toFixed(3)}) saturate(${(1 - 0.2 * dim).toFixed(3)})` : undefined;
  L.put(ctx, sid, k, fx, fy + bob, hk, { filter });
  if (t < OUT) glow(ctx, fx, fy - h * 0.5, h * 0.9, '#FFF2C8', 0.15);
  const pk = PALM[sid + ':' + k] ? [sid, k] : ['n_bridge_b', 1], pf = sheet(pk[0])?.frames[pk[1]], ph = pf ? h * pf.h / sheet(pk[0]).frames[0].h : h;
  const tap = onFrame(pk[0], pk[1], fx, fy + bob, ph, ...PALM[pk.join(':')]);
  for (const t0 of TAPS) { const d = t - t0; if (d < 0 || d > 0.8) continue;      // each of your taps ripples her glass where her hand is
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (const kk of [0, 0.18]) { const e = sat(d - kk, 0, 0.8); if (e <= 0) continue; ctx.strokeStyle = rgba('#FFFFFF', 0.7 * (1 - e)); ctx.lineWidth = 6 * (1 - e) + 1;
      ctx.beginPath(); ctx.ellipse(tap[0], tap[1], 20 + e * 260, 14 + e * 190, 0, 0, TAU); ctx.stroke(); }
    ctx.restore(); }
  return { fx, fy: fy + bob, h, palm2: c2 ? onFrame('n_bridge_c', 2, fx, fy + bob, hc2, ...PALM['n_bridge_c:2']) : [fx, fy] };
}

// ---------------------------------------------------------------- across the line
function crossing(ctx, t, M, line) {                                     // your messages, out of the street and across into her water
  HEADS.forEach(([ix, iy, s], i) => {
    if (!M) return; const [hx, hy] = M.pt(ix, iy), t0 = 120.6 + i * 0.09, d = t - t0; if (d < 0) return;
    const go = 122.0 + i * 0.12, fly = E.io(sat(t, go, go + 1.0)), sink = Math.max(0, t - go - 1.0);
    const tx = line + 120 + rnd(i, 4) * (PW - 260), ty = 170 + rnd(i, 5) * 230;
    const x = lerp(hx, tx, fly), y = lerp(hy, ty, fly) - Math.sin(fly * Math.PI) * 140 + Math.min(sink * 80, 340 + rnd(i, 6) * 200);
    const a = Math.min(1, d * 4) * (1 - sat(t, 124.0, 124.3)); if (a <= 0.01) return;
    const pop = E.back(sat(d, 0, 0.25)), sz = 30 * s * pop, str = t < go ? null : ASK[i % ASK.length];
    ctx.save(); ctx.font = font(sz, 700, SANS); const bw = str ? ctx.measureText(str).width + sz * 1.2 : 140 * s * pop, bh = sz * 1.8;
    if (fly > 0) glow(ctx, x, y, bw, '#9FD8FF', 0.25 * a * fly);
    ctx.globalAlpha = a; ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1B2140'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(x - bw / 2, y - bh / 2, bw, bh, bh / 2); ctx.fill(); ctx.stroke();
    if (str) { ctx.fillStyle = '#1B2140'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, x, y + 1); }
    else for (let k = 0; k < 3; k++) { const on = t < SUDDEN ? 0.35 + 0.65 * Math.max(0, Math.sin(FT(t) * 7 - k * 0.9 + i)) : 0.45; ctx.fillStyle = rgba('#6B7280', on); ctx.beginPath(); ctx.arc(x - 30 * s * pop + k * 30 * s * pop, y, 8 * s * pop, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
}
function reply(ctx, t, line, her) {                                       // her 在！, out of her hands to the line, where it breaks
  if (!her || t < CALL || t > POP + 0.6) return;
  const p = E.io(sat(t, CALL, POP)), x = lerp(her.fx, line + 12, p), y = lerp(her.fy - her.h * 0.62, 420, p) - Math.sin(p * Math.PI) * 90, r = 40 + 8 * Math.sin(t * 6);
  if (t < POP) { glow(ctx, x, y, r * 2.4, '#FFE7A0', 0.6); ctx.save(); ctx.fillStyle = rgba('#FFF6D8', 0.92); ctx.strokeStyle = '#8A5A10'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#7A4A00'; ctx.font = font(34, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('在！', x, y + 1); ctx.restore(); return; }
  const d = t - POP;
  for (let k = 0; k < 12; k++) { const an = (k / 11 - 0.5) * Math.PI, v = 150 * (1 + rnd(k, 9)); glow(ctx, line + 14 + Math.cos(an) * v * d, 420 + Math.sin(an) * v * d + 80 * d * d, 22, '#FFE7A0', 0.75 * (1 - d / 0.6)); }
  if (d < 0.25) { ctx.save(); ctx.strokeStyle = rgba('#FFF6D8', 0.9 * (1 - d / 0.25)); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(line + 6, 420, 20 + d * 260, -Math.PI / 2, Math.PI / 2); ctx.stroke(); ctx.restore(); }
}
function divider(ctx, t, x) {
  const tap = TAPS.reduce((m, t0) => (t >= t0 && t - t0 < 0.3 ? Math.max(m, 1 - (t - t0) / 0.3) : m), 0);
  ctx.save(); ctx.fillStyle = '#0B1430'; ctx.fillRect(x - 7, 0, 14, H);
  ctx.globalCompositeOperation = 'screen'; const g = ctx.createLinearGradient(x - 40, 0, x + 40, 0);
  g.addColorStop(0, 'rgba(160,210,255,0)'); g.addColorStop(0.5, rgba('#BFE3FF', 0.35 + 0.5 * tap)); g.addColorStop(1, 'rgba(160,210,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, 0, 80, H);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = rgba('#EAF6FF', 0.85); ctx.fillRect(x - 1.5, 0, 3, H); ctx.restore();
}

export function shotSplit(ctx, t) {
  const inn = E.out(sat(t, 118.1, 118.55)), lx = -PW * (1 - inn), rx = PW + PW * (1 - inn);      // both halves slide in on 那
  ctx.fillStyle = '#05070D'; ctx.fillRect(0, 0, W, H);
  let street = null, her = null;
  ctx.save(); ctx.beginPath(); ctx.rect(lx, 0, PW, H); ctx.clip();
  if (t < 120.52) deskSide(ctx, t, lx, PW);
  else if (t < 124.18) street = streetSide(ctx, t, lx, PW);
  else if (t < 129.17) deskSide(ctx, t, lx, PW);
  else statusSide(ctx, t, lx, PW);
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.rect(rx, 0, PW, H); ctx.clip(); her = tankSide(ctx, t, rx, PW, rx); ctx.restore();
  if (t > 120.6 && t < 124.4) crossing(ctx, t, street, PW);
  divider(ctx, t, PW);
  reply(ctx, t, PW, her);
  if (her && t >= 129.4 && t < 131.6) {                                   // on 不 your fingertip and her palm meet the line from either side
    const p = E.out(sat(t, 129.6, 130.2)), out = E.in(sat(t, 131.3, 131.6)), py = her.palm2[1];
    tipProp(ctx, 'prop_hand_tap', PW - 6 - (1 - p + out) * 700, py + (1 - p + out) * 200, 520, { flip: true });
    if (t > 130.22) glow(ctx, PW, py, 120, '#FFF2C8', 0.35 * E.out(sat(t, 130.22, 130.5)) * (1 - out));
  }
  ctx.fillStyle = `rgba(0,0,0,${1 - sat(t, 118.1, 118.5)})`; ctx.fillRect(0, 0, W, H);
}
