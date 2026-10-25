// v2 §31 (本人 10-23 review of v17: 224 伸手这个镜头停留有点久了，做点设计、卡点；242 冲浪有点廉价，完整重设计)
//   shotHush (143.07–144.59): the band stops and she sings on alone; a close-up on each syllable: the two fingertips a breath apart
//     (143.07), her eyes (143.37), the fingertips again, closer, the light between them growing (143.62–144.32); the band comes back
//     and they touch (144.32).
//   shotLightSea (161.16–164.57) 整片海都翻了天, the last chorus at the concert: the sea is the sea of lights. 整片海: behind her on the
//     stage edge, the camera rises over a whole stadium of blue glowsticks; 都: she opens her arms to them; 翻: from the stage to the
//     back of the stands a wave runs through the crowd and every light it passes flips from blue to gold, everyone jumping; 了: the
//     front rows, jumping on the beat; 天: up into the sky, fireworks on every beat; and she looks back at us over her shoulder.
import { W, H, TAU, lerp, sat, E, rnd, sheet, frame, plate } from './core.js';
import { rgba } from '../lib.js';
import { panel } from './sb9.js';
import * as L from './life.js';

const FT = t => globalThis.__frameT ?? t;
const glow = (ctx, x, y, r, col, a) => { if (a <= 0.003) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore(); };
const shake = (t, t0, amp, dur) => (t >= t0 && t < t0 + dur ? [Math.sin((t - t0) * 83) * amp * (1 - (t - t0) / dur), Math.cos((t - t0) * 71) * amp * (1 - (t - t0) / dur)] : [0, 0]);
const pulse = (t, list, dur = 0.25) => list.reduce((m, t0) => (t >= t0 && t - t0 < dur ? Math.max(m, 1 - (t - t0) / dur) : m), 0);
const flash = (ctx, t, t0, a = 0.6, k = 14) => { if (t < t0) return; ctx.fillStyle = rgba('#FFFFFF', a * Math.exp(-k * (t - t0))); ctx.fillRect(0, 0, W, H); };
function rays(ctx, x, y, a, t) {
  if (a <= 0.01) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.translate(x, y);
  for (let k = 0; k < 18; k++) { ctx.save(); ctx.rotate(k / 18 * TAU + t * 0.15); const L2 = 1600;
    const g = ctx.createLinearGradient(0, 0, L2, 0); g.addColorStop(0, rgba('#FFF2C8', 0.4 * a)); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(L2, -70 - (k % 3) * 30); ctx.lineTo(L2, 70 + (k % 3) * 30); ctx.lineTo(0, 8); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
function vignette(ctx, a) { if (a <= 0.01) return; const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(10,14,30,0)'); v.addColorStop(1, rgba('#0A0E1E', a)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H); }

// ---------------------------------------------------------------- the hush
export const HUSH = 143.07;
const EYES = 143.37, AGAIN = 143.62, BREATH = 144.07, TOUCH = 144.32, END = 144.59;
const GAP = [967, 387];                                                    // p_hands_close / touch: between the fingertips (image px)
export function shotHush(ctx, t) {
  if (t < EYES) {                                                          // the fingertips, a breath apart
    const u = sat(t, HUSH, EYES), M = panel(ctx, 0, W, 'p_hands_close', { z: 1.06 + 0.06 * u, fx: GAP[0] / 1672, fy: 0.45 });
    if (M) { const [gx, gy] = M.pt(...GAP); glow(ctx, gx, gy, 90 + 20 * Math.sin(t * 6), '#FFF2C8', 0.55); }
    vignette(ctx, 0.45);
  } else if (t < AGAIN) {                                                  // her eyes
    const u = sat(t, EYES, AGAIN); panel(ctx, 0, W, 'p_eyes_close', { z: 1.04 + 0.05 * u, fx: 0.5, fy: 0.5 });
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const gx = lerp(W * 0.25, W * 0.75, u);      // a glint of the light passing over them
    const g = ctx.createLinearGradient(gx - 200, 0, gx + 200, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,240,200,0.12)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    vignette(ctx, 0.35);
  } else if (t < TOUCH) {                                                  // the fingertips again, closing in; the light between them grows
    const u = E.io(sat(t, AGAIN, TOUCH)), M = panel(ctx, 0, W, 'p_hands_close', { z: 1.45 + 0.4 * u, fx: GAP[0] / 1672, fy: GAP[1] / 941 });
    if (M) { const [gx, gy] = M.pt(...GAP), br = 0.5 + 0.5 * Math.sin((t - AGAIN) * 7);
      glow(ctx, gx, gy, 110 + 140 * u + 30 * br, '#FFF2C8', 0.45 + 0.35 * u + 0.15 * br);
      if (t >= BREATH) glow(ctx, gx, gy, 400 * sat(t, BREATH, TOUCH), '#FFF6D8', 0.35 * sat(t, BREATH, TOUCH)); }
    vignette(ctx, 0.5 * (1 - 0.6 * sat(t, BREATH, TOUCH)));
  } else {                                                                 // the band comes back: they touch
    const d = t - TOUCH, [sx, sy] = shake(t, TOUCH, 26, 0.3);
    ctx.save(); ctx.translate(sx, sy);
    const M = panel(ctx, 0, W, 'p_hands_touch', { z: 1.85 - 0.25 * E.out(sat(d, 0, 0.27)), fx: GAP[0] / 1672, fy: GAP[1] / 941 }) ?? panel(ctx, 0, W, 'p_hands_close', { z: 1.6, fx: GAP[0] / 1672, fy: GAP[1] / 941 });
    if (M) { const [gx, gy] = M.pt(...GAP); rays(ctx, gx, gy, 1.6 * Math.exp(-1.5 * d) + 0.5, t * 3);
      const r = 40 + E.out(sat(d, 0, 0.3)) * 1300;
      ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.9 * (1 - sat(d, 0, 0.3))); ctx.lineWidth = 22 * (1 - sat(d, 0, 0.3)) + 2; ctx.beginPath(); ctx.arc(gx, gy, r, 0, TAU); ctx.stroke(); ctx.restore();
      glow(ctx, gx, gy, 600, '#FFF6D8', 0.9 * Math.exp(-3 * d) + 0.3); }
    ctx.restore();
    flash(ctx, t, TOUCH, 0.8, 18);
    ctx.fillStyle = rgba('#FFFFFF', 0.95 * E.in(sat(t, TOUCH + 0.08, END))); ctx.fillRect(0, 0, W, H);
  }
}

// ---------------------------------------------------------------- 整片海都翻了天
export const SEA = 161.16;
const DOU = 161.96, FAN = 162.23, LE = 162.76, TIAN = 163.56, BACKLOOK = 164.16, SEA_END = 164.57;
const EIGHTHS = [161.36, 161.56, 161.76, 161.96, 162.16, 162.36, 162.56, 162.76, 162.96, 163.16, 163.36, 163.56, 163.76, 163.96, 164.16, 164.36];
const FEET = [836, 905];                                                   // p_stadium: her place on the stage, at its front edge (image px)
const FIRE = [[163.56, 560, 260, 520], [163.76, 1340, 220, 560], [163.96, 900, 150, 640], [164.16, 300, 330, 430], [164.36, 1600, 340, 460]];
function stage(ctx, t, o, gold, k, h, behind) {                                    // the stadium from behind her, blue (gold behind a wave front) and her
  const M = panel(ctx, 0, W, 'p_stadium_blue', o); if (!M) return null;
  if (gold) { const front = gold(M); if (front != null) {                  // the gold sea, below the wave's front (the crowd near the stage first)
    ctx.save(); ctx.beginPath(); ctx.rect(0, front, W, H - front); ctx.clip(); panel(ctx, 0, W, 'p_stadium_gold', o); ctx.restore();
    if (front > -40 && front < H) { ctx.save(); ctx.globalCompositeOperation = 'screen';             // the crest: a band of white-gold light, sparks
      const g = ctx.createLinearGradient(0, front - 60, 0, front + 90); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.45, 'rgba(255,240,200,0.85)'); g.addColorStop(1, 'rgba(255,220,140,0)');
      ctx.fillStyle = g; ctx.fillRect(0, front - 60, W, 150); ctx.restore();
      for (let q = 0; q < 30; q++) glow(ctx, rnd(q, 3) * W, front + (rnd(q, 4) - 0.5) * 50 - 30 * rnd(q, 5), 14 + 14 * rnd(q, 6), '#FFF2C8', 0.9); } } }
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(gold ? '#FFD27A' : '#6FA8FF', 0.1 * pulse(t, EIGHTHS, 0.18)); ctx.fillRect(0, 0, W, H); ctx.restore();      // the sea pulses on the eighths
  const [fx, fy] = M.pt(...FEET), sh = sheet('n_back4b'), hk = sh ? h * sh.frames[k].h / sh.frames[0].h : h, hop = k === 2 ? Math.sin(sat(t, FAN, FAN + 0.45) * Math.PI) * 60 : 0;
  if (behind) behind(M);                                                   // (fireworks) behind her
  glow(ctx, fx, fy - hk * 0.5, hk * 0.9, '#BFD8FF', 0.25);
  L.put(ctx, 'n_back4b', k, fx, fy - hop, hk);
  return M;
}
export function shotLightSea(ctx, t) {
  const ft = FT(t);
  if (t < LE) {                                                            // 整片海 都 翻: behind her
    const rise = E.io(sat(t, SEA, DOU)), step = t >= DOU ? 0.05 * (1 - Math.exp(-14 * (t - DOU))) : 0;
    const o = { z: lerp(1.4, 1.06, rise) + step, fx: 0.5, fy: lerp(0.88, 0.62, rise) };
    const [sx, sy] = shake(t, FAN, 18, 0.35);
    ctx.save(); ctx.translate(sx, sy);
    const k = ft < DOU ? 0 : ft < FAN ? 1 : 2;
    stage(ctx, t, o, t >= FAN ? (M => M.pt(0, lerp(980, 60, Math.pow(sat(t, FAN, LE - 0.04), 0.8)))[1]) : null, k, 720);
    ctx.restore();
    flash(ctx, t, SEA, 0.55); flash(ctx, t, FAN, 0.35, 10);
  } else if (t < TIAN) {                                                   // 了: the front rows, jumping on every beat
    const b = EIGHTHS.filter(t0 => t >= t0 && t0 >= LE).pop() ?? LE, j = Math.sin(sat(t, b, b + 0.2) * Math.PI);
    ctx.save(); ctx.translate(0, -18 * j); panel(ctx, 0, W, 'p_crowd_close', { z: 1.08 + 0.03 * sat(t, LE, TIAN), fx: 0.5, fy: 0.5 }); ctx.restore();
    for (let q = 0; q < 40; q++) { const u = ((t - LE) * (0.6 + 0.5 * rnd(q, 1)) + rnd(q, 2)) % 1, x = rnd(q, 3) * W + Math.sin(u * 7 + q) * 30, y = u * (H + 80) - 40;     // confetti falling
      ctx.save(); ctx.translate(x, y); ctx.rotate(u * 9 + q); ctx.fillStyle = q % 3 ? '#FFD34D' : '#FFFFFF'; ctx.globalAlpha = 0.9; ctx.fillRect(-9, -4, 18, 8); ctx.restore(); }
    flash(ctx, t, LE, 0.5);
  } else if (t < BACKLOOK) {                                               // 天: up into the sky, fireworks on every eighth
    const u = sat(t, TIAN, BACKLOOK), [sx, sy] = shake(t, TIAN, 14, 0.25);
    ctx.save(); ctx.translate(sx, sy); panel(ctx, 0, W, 'p_stadium_sky', { z: 1.12, fx: 0.5, fy: lerp(0.7, 0.45, E.io(u)) });
    FIRE.forEach(([t0, x, y, s]) => { if (t < t0) return; const d = t - t0, k = Math.min(5, Math.floor(d / 0.08));
      glow(ctx, x, y, s * 0.9, ['#FFD34D', '#FF8FB1', '#8FD8FF', '#FFFFFF', '#B9A2FF'][FIRE.findIndex(f => f[0] === t0) % 5], 0.5 * Math.exp(-3 * d));
      L.put(ctx, 'fx_firework', k, x, y, s, { anchor: 'body', alpha: 1 - sat(d, 0.5, 0.9) }); });
    ctx.restore();
    flash(ctx, t, TIAN, 0.5);
  } else {                                                                 // and she looks back at us over her shoulder (翻个身), the sky full of fireworks
    const u = sat(t, BACKLOOK, SEA_END);
    ctx.save();
    stage(ctx, t, { z: 1.25 + 0.06 * u, fx: 0.5, fy: 0.72 }, () => -100, 3, 820, () =>
      FIRE.forEach(([t0, x, , s], i) => { const d = t - t0 + 0.2; if (d < 0) return; L.put(ctx, 'fx_firework', Math.min(5, Math.floor(d / 0.08)), x, 120 + i * 30, s * 0.8, { anchor: 'body', alpha: 1 - sat(d, 0.5, 0.9) }); }));
    ctx.restore();
    flash(ctx, t, BACKLOOK, 0.45);
  }
}
