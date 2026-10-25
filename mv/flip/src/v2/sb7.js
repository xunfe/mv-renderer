// v2 §23: 2:00–2:12 (本人 10-23: 有点单调，重新整体设计): three screens in a row (an empty chat page, the laptop clock, the status
// page) become two real scenes. 整个世界 突然没有回音: the whole morning street on its phones, everyone's typing dots; on 突然 they
// freeze and a cloud's shadow runs over the street; on 没有回音 everyone looks up from the phone at once, puzzled, and the empty
// bubbles float off with nothing in them. 五个小时 你一遍一遍刷新: your desk, held still through the five hours: the morning turns
// to noon, the cat on the sill sits, lies down, falls asleep, the cups and the lunch pile up, and on each 一遍 your finger taps
// refresh. 屏幕上只写着 暂时不可用: the camera goes into the laptop's screen, the status page, and closes on 服务暂时不可用.
import { W, H, TAU, lerp, sat, E, rnd, plate, sheet } from './core.js';
import { backdrop, bdMap, maskedScreen, tipProp } from '../common.js';
import { rgba, font, SANS } from '../lib.js';
import { statusPage } from '../ui.js';
import { QS, layer } from '../scenesD.js';
import * as F from '../scenesF.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;
// a painting made from another one (Image 2, same camera): drawn exactly over it
function over(ctx, id, bgId, o, a = 1) {
  const pl = plate(id); if (!pl || a <= 0.003) return;
  const M = bdMap(bgId, o), [x0, y0] = M.pt(0, 0), [x1, y1] = M.pt(1536, 1024);
  ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(pl, x0, y0, x1 - x0, y1 - y0); ctx.restore();
}

// ---------------------------------------------------------------- 整个世界 突然没有回音 (120.52–124.18)
const SUDDEN = 121.99, LOOK = 122.4;
const DOTS = [[360, 300, 1], [560, 380, 0.95], [980, 330, 0.9], [1200, 390, 0.95], [1400, 300, 1], [250, 520, 0.9], [1290, 560, 0.9],      // bg31: over heads (image px), size
  [615, 430, 0.6], [718, 500, 0.5], [786, 520, 0.45], [872, 540, 0.42], [962, 530, 0.48], [1032, 532, 0.5]];
function dotsBubble(ctx, t, x, y, s, i) {
  const d = t - (120.6 + i * 0.07); if (d < 0) return;
  const gone = sat(t, LOOK + 0.3 + i * 0.07, LOOK + 1.3 + i * 0.07);   // empty, they float off and fade
  if (gone >= 1) return;
  const pop = E.back(sat(d, 0, 0.25)), rise = 260 * Math.pow(gone, 1.4) * s;
  ctx.save(); ctx.translate(x + Math.sin(gone * 4 + i) * 20 * gone, y - rise); ctx.scale(s * pop * (1 - 0.3 * gone), s * pop * (1 - 0.3 * gone));
  ctx.globalAlpha *= 1 - gone;
  ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1B2140'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-70, -40, 140, 70, 35); ctx.fill(); ctx.stroke();
  const tt = Math.min(FT(t), SUDDEN), fade = 1 - sat(t, LOOK - 0.05, LOOK + 0.25);                     // the dots stop on 突然, then go out
  for (let k = 0; k < 3; k++) {
    const on = t < SUDDEN ? 0.35 + 0.65 * Math.max(0, Math.sin(tt * 7 - k * 0.9 + i)) : 0.4;
    ctx.fillStyle = rgba(t < SUDDEN ? '#6B7280' : '#B8BEC8', on * fade); ctx.beginPath(); ctx.arc(-30 + k * 30, -5, 9, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
export function shotStreet(ctx, t) {
  const o = { z: lerp(1.04, 1.1, E.io(sat(t, 120.52, 124.18))), fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg31_city_crowd', o);
  if (FT(t) >= LOOK) over(ctx, 'bg31b_city_lookup', 'bg31_city_crowd', o);       // everyone looks up at once (a cut: a crossfade doubled the faces)
  const M = bdMap('bg31_city_crowd', o);
  const sh = sat(t, SUDDEN, SUDDEN + 0.9);                                   // a cloud's shadow runs over the street, right to left
  if (t > SUDDEN) {
    const cx = lerp(W * 1.6, -W * 0.2, E.io(sh));
    ctx.save(); const g = ctx.createLinearGradient(cx - 900, 0, cx + 900, 0);
    g.addColorStop(0, 'rgba(18,26,56,0.12)'); g.addColorStop(0.5, 'rgba(18,26,56,0.32)'); g.addColorStop(1, 'rgba(18,26,56,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.fillStyle = `rgba(18,26,56,${0.14 * sat(t, SUDDEN + 0.3, SUDDEN + 0.9)})`; ctx.fillRect(0, 0, W, H);      // and the day stays a little grey
  }
  DOTS.forEach(([ix, iy, s], i) => { const [x, y] = M.pt(ix, iy); dotsBubble(ctx, t, x, y, s * M.s / 1.3, i); });
}

// ---------------------------------------------------------------- 五个小时 你一遍一遍刷新 / 屏幕上只写着 暂时不可用 (124.18–131.4)
const CAT = [[124.97, 0, 150], [125.59, 1, 98], [126.29, 2, 104]];         // bg30: on the window sill (when, drawing, height in image px)
const ITEMS = [[125.35, 2, 1336, 772, 118], [126.29, 3, 228, 806, 52], [126.57, 3, 168, 826, 46], [127.06, 1, 1172, 866, 132]];   // when, drawing, x, bottom y, height
const TAPS = [126.01, 126.289, 126.349, 126.57, 127.06, 127.55];
const PAD = [600, 806];                                                      // bg30: the trackpad
const INTO = [127.92, 129.17], ZEND = 2.06, FXEND = 605 / 1536, FYEND = 445 / 1024;      // the push into the laptop's screen
function steam(ctx, t, x, y, s, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let k = 0; k < 4; k++) { const d = ((t * 0.6) + k / 4) % 1;
    ctx.fillStyle = rgba('#FFFFFF', 0.22 * a * Math.sin(d * Math.PI)); ctx.beginPath(); ctx.arc(x + Math.sin(d * 5 + k) * 14 * s, y - d * 130 * s, (9 + d * 20) * s, 0, TAU); ctx.fill(); }
  ctx.restore();
}
function screenPage(x, sw, sh, t) {                                          // the status page, filling the laptop's screen by its height
  const sc = sh / H; x.save(); x.translate((sw - W * sc) / 2, 0); x.scale(sc, sc); statusPage(x, W, H, t, { ok: 0 }); x.restore();
}
export function shotDesk(ctx, t) {
  const p = sat(t, 124.18, 127.6), into = E.io(sat(t, ...INTO));
  const o = { z: lerp(1.12, ZEND, into), fx: lerp(0.42, globalThis.__half ? 447 / 1536 : FXEND, into), fy: lerp(0.47, FYEND, into) };
  if (t < INTO[1] + 0.2) {
    backdrop(ctx, 'bg30_desk_morning', o);
    if (p > 0) backdrop(ctx, 'bg30b_desk_noon', { ...o, alpha: E.io(p) });
    const M = bdMap('bg30_desk_morning', o);
    const [cx, cy] = M.pt(...F.CAL);                                         // the calendar still says 15
    ctx.fillStyle = '#D8263C'; ctx.font = font(40 * M.s, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10月', cx, cy - 60 * M.s);
    ctx.fillStyle = '#222'; ctx.font = font(110 * M.s, 900, SANS); ctx.fillText('15', cx, cy + 30 * M.s); ctx.textAlign = 'left';
    { const [sx, sy] = M.pt(1190, 560); steam(ctx, t, sx, sy, M.s, 1 - sat(t, 124.4, 124.9)); }      // the coffee goes cold
    const ft = FT(t), cat = CAT.filter(([t0]) => ft >= t0).pop();           // the cat: sits, lies down, falls asleep (time-lapse: no in-betweens)
    if (cat) { const [x, y] = M.pt(1132, 474), br = cat[1] === 2 ? 1 + 0.02 * Math.sin(t * 2.2) : 1; L.put(ctx, 'n_desk_cat', cat[1], x, y, cat[2] * M.s, { sy: br }); }
    ITEMS.forEach(([t0, k, ix, iy, h]) => { if (ft < t0) return; const [x, y] = M.pt(ix, iy); L.put(ctx, 'n_desk_items', k, x, y, h * M.s);
      if (k === 1) steam(ctx, t, x + 6 * M.s, y - h * M.s * 0.95, M.s, 1); });
    const pf = sat(ft, 124.18, 127.6), mins = lerp(8 * 60 + 11, 12 * 60 + 49, E.io(pf)), last = TAPS.filter(t0 => t >= t0).pop();      // the clock by the frame (no blurred digits)
    const n = Math.floor(lerp(1, 31, pf)) + TAPS.filter(t0 => ft >= t0).length;
    maskedScreen(ctx, 'bg30_desk_morning', o, QS.laptop, 1000, 620, (x, sw, sh) => {
      if (t < INTO[0]) F.lockScreen(x, sw, sh, t, F.hhmm(mins), { spin: (last ? t - last : t) * 9, n });
      else screenPage(x, sw, sh, t);
    }, { res: 0.9, slot: 10 });
    const inH = E.out(sat(t, 125.59, 125.85)), outH = E.in(sat(t, 127.8, 128.1));      // your hand, tapping refresh
    if (inH > 0 && outH < 1) {
      const [px, py] = M.pt(...PAD), d = last ? t - last : 9, press = d < 0.14 ? Math.sin(d / 0.14 * Math.PI) : 0;
      tipProp(ctx, 'prop_hand_tap', px + (1 - inH + outH) * 900, py - 8 * M.s + press * 9 * M.s + (1 - inH + outH) * 200, 400 * M.s);
      if (d < 0.4) { ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.8 * (1 - d / 0.4)); ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py, (16 + d * 120) * M.s, (6 + d * 45) * M.s, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    }
    ctx.save(); ctx.globalCompositeOperation = 'screen';                    // the sun sweeping across
    const sx = lerp(W * 0.9, W * 0.2, p), g = ctx.createRadialGradient(sx, 120, 0, sx, 120, 700); g.addColorStop(0, `rgba(255,240,200,${0.22 * (1 - into)})`); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  if (t > INTO[1] - 0.12) {                                                  // inside the screen: the page itself, closing on 服务暂时不可用
    const a = globalThis.__half ? E.io(sat(t, INTO[1] - 0.05, INTO[1] + 0.03)) : E.io(sat(t, INTO[1] - 0.12, INTO[1] + 0.2)), lay = layer(ctx, l => statusPage(l, W, H, t, { ok: 0 }));
    const e = E.io(sat(t, INTO[1] + 0.1, 130.5)), half = globalThis.__half;      // __half: drawn in the split's left half (sb8): framed to fit it
    const z = half ? lerp(1.0, 1.08, e) + 0.04 * sat(t, 130.5, 132.7) : lerp(1.0, 1.85, e) + 0.12 * sat(t, 130.5, 131.4), fx = half ? 560 : lerp(W / 2, 520, e), fy = half ? H / 2 : lerp(H / 2, 300, e);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(W / 2, H / 2); ctx.scale(z, z);
    if (half) ctx.translate(-fx, -fy);                                    // the half sees only the middle: no clamping to the page's edges
    else ctx.translate(-Math.max(Math.min(fx, W - W / (2 * z)), W / (2 * z)), -Math.max(Math.min(fy, H - H / (2 * z)), H / (2 * z)));
    ctx.drawImage(lay, 0, 0, W, H); ctx.restore();
    const pulse = 0.5 + 0.5 * Math.sin(t * 5); ctx.fillStyle = `rgba(239,68,68,${0.06 * pulse * a})`; ctx.fillRect(0, 0, W, H);
  }
}
