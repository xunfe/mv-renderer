// v2 §20: shots redesigned after 本人's review of v4 (10-22). Each says what the line needs and why the old one failed.
import { W, H, TAU, clamp, lerp, sat, E, rnd, plate, sheet, frame } from './core.js';
import { backdrop, bdMap, prop, glowWord } from '../common.js';
import { char, bop, breathe } from '../chars.js';
import { rgba, font, SANS } from '../lib.js';
import { withPoses } from './plus.js';
import * as G from '../scenesG.js';

// an Image 2 stamp print slammed on (as scenesD inkStamp)
function inkStamp(ctx, id, x, y, w, rot, t, t0) {
  if (t < t0) return; const p = E.out(sat(t, t0, t0 + 0.12)), bump = t > t0 + 0.12 ? Math.exp(-14 * (t - t0 - 0.12)) * 0.06 : 0;
  prop(ctx, id, x, y, w * (lerp(2.0, 1, p) + bump), { rot, alpha: p });
}

// ---------------------------------------------------------------- 说我贪吃 说我偷懒 (65.88–67.72). 本人: 偷懒 should be in the middle
// of the frame, and bigger (in v1 she lay at the far right edge of a slanted half panel). 贪吃 slides in as before; on 说我偷懒 the
// second panel wipes across the whole frame and she lies in the middle of it, big, on the chaise, VR glasses on, yawning on 懒.
export function shotD2(ctx, t) {
  ctx.fillStyle = '#FFF6E6'; ctx.fillRect(0, 0, W, H);
  const pa = E.out(sat(t, 65.88, 66.1)), pb = E.io(sat(t, 66.79, 67.03));
  const panel = (x0, x1, off, fn) => { ctx.save(); ctx.translate(off, 0); ctx.beginPath(); ctx.moveTo(x0 + 60, 0); ctx.lineTo(x1 + 60, 0); ctx.lineTo(x1 - 60, H); ctx.lineTo(x0 - 60, H); ctx.closePath(); ctx.clip(); fn(); ctx.restore();
    ctx.save(); ctx.translate(off, 0); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x1 + 60, 0); ctx.lineTo(x1 - 60, H); ctx.stroke(); ctx.restore(); };
  const split = lerp(W + 200, -200, pb);
  if (pb < 1) panel(-100, split, (1 - pa) * -1100, () => {
    backdrop(ctx, 'bg12_room', { z: 1.4, fx: 0.3, fy: 0.6, x: -300, filter: 'brightness(1.05)' });
    withPoses({ d33: { sheet: 'c_d33', keys: [[0, 0], [66.27, 2], [66.56, 3]] } }, t, () => char(ctx, 'd33', 520, 990, 760, { shadow: false, ...bop(t, 2.2, 8) }));
    for (let k = 0; k < 6; k++) { const d = (t * 1.4 + k / 6) % 1; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - d)})`; ctx.beginPath(); ctx.ellipse(470 + Math.sin(k * 2.1) * 90, 520 - d * 160, 14, 9, 0, 0, TAU); ctx.fill(); }   // rice flying
  });
  if (t < 66.79) { inkStamp(ctx, 'prop_stamp_tanchi', 760, 760, 330, -0.18, t, 66.56); return; }
  ctx.save(); ctx.beginPath(); ctx.moveTo(split + 60, 0); ctx.lineTo(W + 100, 0); ctx.lineTo(W + 100, H); ctx.lineTo(split - 60, H); ctx.closePath(); ctx.clip();
  const lo = { z: lerp(1.8, 1.86, sat(t, 66.79, 67.72)), fx: 0.495, fy: 0.574 };          // the chaise in the middle of the frame
  backdrop(ctx, 'bg12_room', lo);
  withPoses({ d34: { sheet: 'c_d34', keys: [[0, 0], [67.26, 2]] } }, t, () => char(ctx, 'd34', W / 2, 930, 820, { shadow: false, ...breathe(t, 0.6) }));
  [0, 1, 2].forEach(k => { const d = ((t - 66.8) * 0.8 + k / 3) % 1; glowWord(ctx, 'z', W / 2 + 330 + d * 110, 330 - d * 190, 64 + k * 14, { alpha: 1 - d, color: '#E8F0FF', glow: 'rgba(150,190,255,0.8)' }); });
  ctx.restore();
  if (pb < 1) { ctx.save(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(split + 60, 0); ctx.lineTo(split - 60, H); ctx.stroke(); ctx.restore(); }
  inkStamp(ctx, 'prop_stamp_toulan', 1560, 260, 330, 0.12, t, 67.26);
}

// ---------------------------------------------------------------- 可你叫我名字的时候 (151.91–154.78). 本人: the phones held up with
// her name typed on them looked cheap. Now the whole crowd calls her: the lights in the audience go dark and then light up, word by
// word, as one huge card stunt across the crowd: 大 (叫), 肥 (我), 鱼 (名); on 字 the whole name flares, and she turns round.
const NAME = ['大', '肥', '鱼'], NAME_T = [152.15, 152.39, 152.79];
let MOSAIC = null;
function mosaicMask() {                                                   // the name, sampled to a grid of lights (cached)
  if (MOSAIC) return MOSAIC;
  const cols = 96, rows = 22, c = new OffscreenCanvas(cols * 10, rows * 10), x = c.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#FFF'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(200, 900, SANS);
  NAME.forEach((ch, i) => x.fillText(ch, c.width * (0.5 + (i - 1) * 0.3), c.height * 0.54));
  const d = x.getImageData(0, 0, c.width, c.height).data, on = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const v = d[((r * 10 + 5) * c.width + q * 10 + 5) * 4];
    on.push(v > 128 ? 1 + Math.min(2, Math.floor(q / (cols / 3))) : 0);    // which character (1..3), 0 = background
  }
  MOSAIC = { cols, rows, on }; return MOSAIC;
}
function crowdName(ctx, t, y0) {
  const { cols, rows, on } = mosaicMask(), dark = sat(t, 151.95, 152.1), flare = t > 153.15 ? Math.exp(-4 * (t - 153.15)) : 0;
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (let r = 0; r < rows; r++) {
    const v = r / (rows - 1), y = lerp(y0 + 20, H - 125, Math.pow(v, 0.9)), sp = lerp(0.7, 1.1, v), x0 = W / 2 - (cols / 2) * 19 * sp;
    for (let q = 0; q < cols; q++) {
      const k = on[r * cols + q], x = x0 + q * 19 * sp + (r % 2) * 5;
      const lit = k ? sat(t, NAME_T[k - 1], NAME_T[k - 1] + 0.12) : 0;
      const idle = (1 - dark) * 0.5 * (0.5 + 0.5 * Math.sin(t * 5 + rnd(q, r) * 6));
      const a = k ? Math.max(idle, lit * (0.85 + 0.15 * Math.sin(t * 8 + q))) : idle * (1 - 0.7 * dark);
      if (a < 0.03) continue;
      const col = k && lit ? '#BFE6FF' : '#7FD0FF', rr = (3 + 2.5 * v) * (k && lit ? 1.3 + 0.6 * flare : 1);
      ctx.fillStyle = rgba(col, a); ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
      if (k && lit) { ctx.fillStyle = rgba('#FFFFFF', a * (0.5 + 0.5 * flare)); ctx.beginPath(); ctx.arc(x, y, rr * 0.45, 0, TAU); ctx.fill(); }
    }
  }
  ctx.restore();
}
export function shotH3(ctx, t) {
  withPoses({ d49: { sheet: 'c_d49', ref: 1, keys: [[0, 0], [152.39, 1], [152.79, 2], [153.15, 3]] } }, t, () => {
    const { M } = G.concert(ctx, t, { z: 1.12, fy: 0.54, sticks: 1 - 0.85 * sat(t, 151.95, 152.12), screen: (x, sw, sh) => G.closeUp(x, sw, sh, 'd49'), me: (dx, dy, s) => char(ctx, 'd49', dx, dy, 330 * s, { shadow: false }) });
    const y0 = M.pt(0, 600)[1];                                                // the front of the crowd (bg32 STAGE.crowd)
    ctx.fillStyle = `rgba(4,8,30,${0.45 * sat(t, 151.95, 152.1)})`; ctx.fillRect(0, y0, W, H - y0);    // the crowd's own lights go down first
    crowdName(ctx, t, y0);
  });
}
