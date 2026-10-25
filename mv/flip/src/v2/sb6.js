// v2 §22: after 本人's review of v6 (10-22): 我把地图铺在海面 on the map (no sliding), the 一直在 climax, the 2/3 version's end card.
import { W, H, TAU, lerp, sat, E, rnd, sheet, frame, plate } from './core.js';
import { backdrop, bdMap, prop, glowWord, balloon, tipProp, img } from '../common.js';
import { char, breathe, anchorPt } from '../chars.js';
import { rgba, font, SANS, SS } from '../lib.js';
import { withPoses } from './plus.js';
import { dsChat } from '../ui.js';
import { layer } from '../scenesD.js';
import * as F from '../scenesF.js';
import { cta } from '../scenesC.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };

// ---------------------------------------------------------------- 我把地图铺在海面 (108.85–111.35), on the map. 本人: she slid across the
// frame (the camera panned and she was dragged along to stay in it). Now the camera holds on the whole map, people from everywhere
// reading it; she stands on its near corner, big. On 铺 a ring of light runs out across the map from her feet and the routes light up;
// the readers call out (哇——, 全世界都在上面！, 开源的！); on 海 she opens her arms: it is everyone's.
const MAP = { center: [838, 586], me: [300, 770] };
const MAP_SAY = [[109.5, 461, 180, '哇——'], [109.85, 1145, 228, '全世界都在上面！'], [110.3, 1187, 520, '开源的！']];
export function shotMap(ctx, t) {
  const CUT = 108.85, o = { z: 1.06, fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg37b_map_crowd_v41', o);
  const M = bdMap('bg37b_map_crowd_v41', o), [cx, cy] = M.pt(...MAP.center), fx = 430, fy = 1062;
  for (const t0 of [109.18, 109.92]) {                                       // the ring of light running out over the map
    const d = t - t0; if (d < 0 || d > 1.4) continue;
    const r = 60 + E.out(d / 1.4) * 1500, a = 0.75 * (1 - d / 1.4);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = rgba('#FFE7A0', a); ctx.lineWidth = 14 * (1 - d / 1.4) + 3;
    ctx.beginPath(); ctx.ellipse(fx, fy - 40, r, r * 0.36, 0, 0, TAU); ctx.stroke(); ctx.restore();
  }
  if (t > 109.18) {                                                          // lights running out along the routes from the middle
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let k = 0; k < 8; k++) { const d = ((t - 109.18) * 0.55 + k / 8) % 1, an = k / 8 * TAU + 0.3, x = cx + Math.cos(an) * d * 640, y = cy + Math.sin(an) * d * 300;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 46); g.addColorStop(0, rgba('#FFF6C8', 0.95 * (1 - d))); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 46, y - 46, 92, 92); }
    ctx.restore();
    glow(ctx, cx, cy, 300, '#FFE7A0', 0.25 * sat(t, 109.18, 109.5));
  }
  MAP_SAY.forEach(([t0, ix, iy, s]) => { const [x, y] = M.pt(ix, iy); balloon(ctx, t, t0, x, Math.max(y - 40, 112), s, { size: 38 }); });
  withPoses({ d90: { sheet: 'c_d90', keys: [[0, 0], [109.92, 3]] } }, t, () => char(ctx, 'd90', fx, fy, 640, { shadow: false, ...breathe(t) }));
  L.dawnFg(ctx, t, CUT);
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * Math.exp(-9 * (t - CUT))); ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- 一直在 (139.6–144.59): the small climax of the bridge (本人: it was flat).
// After the long outage and her one grey 嗯，: on 一 the chat page goes dark and a light wells up in it; on 直 the page breaks apart into
// pieces that fly off, and behind it is the sea at dawn, the sun coming up; on 在 she rises out of the sea, big, reaching out of the
// screen, and the three characters 一 直 在 stand over her in light. A hand comes in from outside to meet hers; the camera closes in on
// the two hands; when the fingertips touch, the light bursts — rays, a ring, sparks — and goes white into the last chorus.
let SNAP = null;
const STAY = [['一', 140.0], ['直', 140.74], ['在', 141.05]];
const TOUCH = 143.1, STX = 1170;                                            // 一 直 在 right of her head, clear of her ears
function chatSnapshot(ctx, t) {                                             // the chat page as v1 shows it, into a scratch canvas
  if (!SNAP || SNAP.width !== ctx.canvas.width || SNAP.height !== ctx.canvas.height) SNAP = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const c = SNAP.getContext('2d'); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.filter = 'none';
  c.clearRect(0, 0, SNAP.width, SNAP.height); c.setTransform(ctx.getTransform());
  const lay = layer(c, l => dsChat(l, W, H, Math.min(t, 140.74), { ...F.chatAt(Math.min(t, 140.74)), dim: 0.35 * sat(t, 139.6, 140.2) }));
  F.chatCam(c, lay, Math.min(t, 140.74), 1);
  return SNAP;
}
export function shotStay(ctx, t) {
  const sx0 = 640, fyEnd = 1150, sz = 900;
  // the sea at dawn, behind everything
  const zoom = 1 + 0.28 * E.io(sat(t, 142.3, 144.4));
  const [hx, hy] = anchorPt('d46', sx0, fyEnd, sz, ...F.HAND_D46, { flip: true });      // where the hands will meet
  ctx.save(); ctx.translate(hx, hy); ctx.scale(zoom, zoom); ctx.translate(-hx, -hy);
  backdrop(ctx, 'bg17_dawn_sea', { z: 1.1, fx: 0.5, fy: 0.55, filter: `brightness(${(0.8 + 0.4 * sat(t, 141.0, 143.5)).toFixed(2)})` });
  glow(ctx, W * 0.55, H * 0.36, 700, '#FFE2A8', 0.35 + 0.35 * sat(t, 141.05, 143.1));      // the sun coming up
  const rise = E.out(sat(t, 141.05, 141.7)), fy = lerp(H + 900, fyEnd, rise);
  if (rise > 0) {
    glow(ctx, sx0, fy - sz * 0.55, 520, '#9FE6FF', 0.4 * rise);
    char(ctx, 'd46', sx0, fy, sz, { shadow: false, flip: true, ...breathe(t) });
    if (t < 141.9) for (let k = 0; k < 18; k++) { const d = t - 141.05 - k * 0.03; if (d < 0 || d > 0.9) continue;   // water falling off her as she rises
      L.put(ctx, 'fx_drops', [0, 1, 13, 15][k % 4], sx0 + (rnd(k, 5) - 0.5) * 360, fy - sz * (0.2 + 0.6 * rnd(k, 6)) + d * 900, 26 + 20 * rnd(k, 7), { anchor: 'body', alpha: 1 - d / 0.9 }); }
  }
  const meet = E.out(sat(t, 142.0, TOUCH));
  if (meet > 0) tipProp(ctx, 'prop_hand_meet', lerp(W + 520, hx + 26, meet), hy + 14, 560);
  if (t >= TOUCH) {                                                         // the touch
    const d = t - TOUCH;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(hx + 16, hy);
    for (let k = 0; k < 14; k++) { ctx.save(); ctx.rotate(k / 14 * TAU + d * 0.4); const L2 = 300 + E.out(sat(d, 0, 0.8)) * 1400;
      const g = ctx.createLinearGradient(0, 0, L2, 0); g.addColorStop(0, rgba('#FFF4D0', 0.55)); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(L2, -40 - (k % 3) * 18); ctx.lineTo(L2, 40 + (k % 3) * 18); ctx.lineTo(0, 6); ctx.fill(); ctx.restore(); }
    ctx.restore();
    const r = 40 + E.out(sat(d, 0, 0.9)) * 900;
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.8 * (1 - sat(d, 0, 0.9))); ctx.lineWidth = 16 * (1 - sat(d, 0, 0.9)) + 2; ctx.beginPath(); ctx.arc(hx + 16, hy, r, 0, TAU); ctx.stroke(); ctx.restore();
    glow(ctx, hx + 16, hy, 360, '#FFF6D8', 0.9 * Math.exp(-2.5 * d) + 0.3);
    for (let k = 0; k < 16; k++) { const an = rnd(k, 11) * TAU, v = 300 + rnd(k, 12) * 700, x = hx + 16 + Math.cos(an) * v * d, y = hy + Math.sin(an) * v * d - 60 * d * d;   // sparks
      L.put(ctx, 'n_newyear', 5, x, y, 70 + 50 * rnd(k, 13), { anchor: 'body', alpha: 1 - sat(d, 0.8, 1.4) }); }
  }
  ctx.restore();
  // the chat page in front, breaking apart on 直
  if (t < 141.6) {
    const snap = chatSnapshot(ctx, t), br = sat(t, 140.74, 141.6), cols = 8, rows = 5, cw = W / cols, ch = H / rows;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sw = snap.width / cols, sh = snap.height / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const k = r * cols + c, del = rnd(k, 21) * 0.25, p = E.in(sat(br, del, del + 0.6)), dx = (c - cols / 2 + 0.5) * 260 * p * (SS ?? 1), dy = (r - rows / 2 + 0.5) * 200 * p * (SS ?? 1);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.translate((c + 0.5) * sw + dx, (r + 0.5) * sh + dy); ctx.rotate((rnd(k, 22) - 0.5) * 1.2 * p); ctx.scale(1 - 0.4 * p, 1 - 0.4 * p);
      ctx.drawImage(snap, c * sw, r * sh, sw, sh, -sw / 2, -sh / 2, sw, sh); ctx.restore();
    }
    ctx.restore();
    if (t > 140.0) { ctx.fillStyle = rgba('#060C2A', 0.72 * sat(t, 140.0, 140.4) * (1 - br)); ctx.fillRect(0, 0, W, H);   // dark, a light welling up in it
      glow(ctx, W / 2, H / 2, 600 + 300 * sat(t, 140.0, 140.74), '#BFE6FF', 0.55 * sat(t, 140.0, 140.6) * (1 - br)); }
  }
  STAY.forEach(([ch, t0], i) => {                                            // 一 直 在, standing over everything in light
    if (t < t0) return; const p = E.back(sat(t, t0, t0 + 0.3)), bright = t >= TOUCH ? Math.exp(-2 * (t - TOUCH)) : 0;
    ctx.save(); ctx.translate(STX + i * 255, 230); ctx.scale(p * (1 + 0.08 * bright), p * (1 + 0.08 * bright));
    glowWord(ctx, ch, 0, 0, 215, { color: '#FFFFFF', stroke: '#1E3A8A', glow: bright > 0.05 ? 'rgba(255,230,160,0.95)' : 'rgba(120,170,255,0.95)', sw: 0.08 }); ctx.restore();
    if (t - t0 < 0.5) { const d = t - t0; ctx.save(); ctx.strokeStyle = rgba('#DDEBFF', 0.7 * (1 - d / 0.5)); ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(STX + i * 255, 230, 120 + d * 500, 0, TAU); ctx.stroke(); ctx.restore(); }
  });
  ctx.fillStyle = rgba('#FFFFFF', 0.9 * E.in(sat(t, 144.2, 144.59))); ctx.fillRect(0, 0, W, H);
}

// ---------------------------------------------------------------- the 2/3 version's end card (本人 10-22: 最后要显示 还有1/3): as the
// trailer's, with 还有 1/3 on the third hit where the trailer had 完整版 即将上线
const CARD3 = [[181.19, '我只是', 150, 250], [181.39, '翻了个身', 170, 430], [181.59, '还有 1/3', 76, 590]];
const CTA3 = [[181.79, 'like', '点赞'], [182.19, 'fav', '收藏'], [182.39, 'follow', '关注']];
export function endCardMid(ctx, t) {
  backdrop(ctx, 'bg17_dawn_sea', { z: 1.2, blur: 10, dark: 0.35 });
  CARD3.forEach(([t0, s, size, y], i) => {
    if (t < t0) return;
    const p = E.out(sat(t, t0, t0 + 0.09)), hit = Math.exp(-14 * (t - t0));
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(1.8, 1, p) + hit * 0.05, lerp(1.8, 1, p) + hit * 0.05);
    glowWord(ctx, s, 0, 0, size, { alpha: p, color: i === 2 ? '#FFE7A0' : '#FFFFFF', stroke: '#0B1E4D', glow: i === 2 ? 'rgba(255,200,90,0.9)' : 'rgba(90,200,255,0.95)' }); ctx.restore();
  });
  CTA3.forEach(([t0, kind, label], i) => cta(ctx, t, t0, W / 2 + (i - 1) * 260, 800, kind, label));
  if (t > 182.39) char(ctx, 'd84', 1620, 1010, 380 * E.back(sat(t, 182.39, 182.52)), { shadow: false });
  ctx.fillStyle = rgba('#FFFFFF', 0.6 * Math.exp(-12 * Math.max(0, t - 181.19))); ctx.fillRect(0, 0, W, H);
}
