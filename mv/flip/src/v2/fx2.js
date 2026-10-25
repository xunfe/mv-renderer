// v2: small additions over the original shots from 0:06 on (plus.js enhance cfg.extra), and two upgrades the original shots
// reach through hooks: their splashes become drawn droplets (common.js splash -> globalThis.__splash) and the New Year
// fireworks become drawn fireworks in the window behind her (scenesB.js sB4 -> globalThis.__fireworks). Kept light: nothing
// covers her or what the shot tells (本人 10-21: 不要把核心切了).
import { W, H, TAU, lerp, sat, E, rnd, sheet, frame, burst, ballistic, vel, DROP_FRAMES } from './core.js';
import { bdMap } from '../common.js';
import { rgba, noise } from '../lib.js';

// ---- the v1 splash (flat white dots) where it is water: same place, time and reach, as drawn droplets, born a little apart so
// they do not start as one spiky star; a big one also throws up a drawn crown (fx_crown). Dust and sparks (tinted) stay v1's.
const WATER_DROPS = [0, 1, 13, 15, 6, 0, 1, 15];
export function splash(ctx, t, t0, x, y, o = {}) {
  if (o.tint && o.tint !== '#9FE6FF') return false;
  const sc = o.scale ?? 1, half = (o.spread ?? 2.2) / 2, life = o.life ?? 1.2, sd = (o.seed ?? 31) + 100;
  if (sc >= 1.2 && t >= t0 && t < t0 + 8 / 12) frame(ctx, 'fx_crown', Math.floor((t - t0) * 12), x, y + 20 * sc, 0.5 * sc, { anchor: 'cell', cy: 1 });
  burst(ctx, t, t0, x, y, { n: Math.round((o.n ?? 40) * 0.75), seed: sd, frames: WATER_DROPS, ang: [-Math.PI / 2 - half, -Math.PI / 2 + half],
    speed: [500 * sc, 1400 * sc], g: 2800 * sc, drag: 0.5, life: [life * 0.6, life], size: [12 * sc, 30 * sc], w: 60 * sc, alpha: o.alpha ?? 1, spread: 0.1, fadeIn: 0.04 });
  burst(ctx, t, t0, x, y, { n: Math.ceil((o.n ?? 40) / 8), seed: sd + 50, frames: [14], ang: [-Math.PI * 0.8, -Math.PI * 0.2],
    speed: [200 * sc, 600 * sc], g: 900, drag: 1.4, life: [0.5, 0.8], size: [70 * sc, 110 * sc], w: 60 * sc, alpha: 0.8, spread: 0.08, fadeIn: 0.05 });
}

// ---- A3: as each lamp comes on, a ring of its light goes out and a few motes drift up off it (the lamps themselves, their
// beams and the lit painting are the original's)
const LAMPS = [[312, 268, '#E8DDFF', 8.24], [865, 245, '#FFB15A', 8.99], [1301, 302, '#6FC3FF', 9.22]];     // scenesA.js LAMPS
function lampGlints(ctx, t) {
  const M = bdMap('bg03_lighthouses', { z: lerp(1.02, 1.05, E.io(sat(t, 5.9, 9.7))), fx: 0.47, fy: 0.52 });     // sA3's framing
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const [ix, iy, col, t0] of LAMPS) {
    const d = t - t0; if (d < 0) continue;
    const [x, y] = M.pt(ix, iy);
    if (d < 0.8) { const p = E.out(d / 0.8); ctx.strokeStyle = rgba(col, 0.65 * (1 - p)); ctx.lineWidth = 1 + 5 * (1 - p);
      ctx.beginPath(); ctx.arc(x, y, 24 + p * 240 * M.s, 0, TAU); ctx.stroke(); }
    for (let i = 0; i < 12; i++) {
      const a = d - i * 0.1; if (a < 0 || a > 1.8) continue;
      const mx = x + (rnd(i, 61 + ix) - 0.5) * 70 + Math.sin(a * 3 + i) * 14, my = y - 10 - a * (70 + rnd(i, 62) * 90);
      const tw = 0.5 + 0.5 * Math.sin(a * 14 + i * 2), al = (1 - sat(a, 1.1, 1.8)) * sat(a, 0, 0.15), r = 2 + rnd(i, 63) * 3;
      ctx.fillStyle = rgba(col, al * (0.5 + 0.5 * tw)); ctx.beginPath(); ctx.arc(mx, my, r * 2.2, 0, TAU); ctx.fill();
      ctx.fillStyle = rgba('#FFFFFF', al * tw); ctx.beginPath(); ctx.arc(mx, my, r, 0, TAU); ctx.fill();
    }
  }
  ctx.restore();
}

// ---- B4: fireworks going up outside the window (bg11 at sB4's framing, which holds still), clipped to the glass, behind her
const WIN = [92, 68, 470, 280];                                           // x, y, w, h: the window's sky (screen px)
const FW = [[36.2, 250, 200, 1.0], [36.48, 440, 150, 0.8], [36.8, 170, 130, 0.7], [37.1, 360, 240, 0.9], [37.45, 480, 190, 0.75], [37.75, 230, 160, 0.85]];
function windowFireworks(ctx, t) {
  ctx.save(); ctx.beginPath(); ctx.rect(...WIN); ctx.clip(); ctx.globalCompositeOperation = 'screen';
  for (const [t0, x, y, s] of FW) {
    const d = t - t0; if (d < -0.3 || d > 1.5) continue;
    const sc = 0.55 * s;
    if (d < 0) { const p = E.out((d + 0.3) / 0.3);                         // the rise
      frame(ctx, 'fx_firework', 0, x, y + (1 - p) * 180 * s, sc, { anchor: 'cell', cx: 0.5, cy: 0.5 }); continue; }
    const k = d < 0.07 ? 1 : d < 0.22 ? 2 : d < 0.5 ? 3 : d < 0.85 ? 4 : 5;
    frame(ctx, 'fx_firework', k, x, y + d * d * 40, sc, { anchor: 'cell', cx: 0.5, cy: 0.5, alpha: 1 - sat(d, 1.2, 1.5) });
    if (d < 0.25) { const g = ctx.createRadialGradient(x, y, 0, x, y, 260 * s);      // the flash lights the sky around it
      g.addColorStop(0, rgba('#FFE7B0', 0.45 * (1 - d / 0.25))); g.addColorStop(1, 'rgba(255,231,176,0)'); ctx.fillStyle = g; ctx.fillRect(x - 260 * s, y - 260 * s, 520 * s, 520 * s); }
  }
  ctx.restore();
}

// ---- C3: the wave keeps throwing spray off its crest while it rolls in and after it hits (the wave is v1's prop_wave:
// 2400 px wide, centred on the path sC3 gives it; the crest line measured on the painting, as fractions of it)
const CREST = [[0.30, 0.20], [0.42, 0.10], [0.55, 0.05], [0.68, 0.08], [0.80, 0.15], [0.88, 0.30], [0.86, 0.50]];
const WAVE_H = 2400 * 844 / 1477;
const waveAt = t => [lerp(-1600, 760, E.in(sat(t, 44.33, 45.14))) + (t > 45.14 ? (t - 45.14) * 260 : 0), 640 + (t > 45.14 ? (t - 45.14) * 120 : 0)];
function crestPt(t, u) {
  const [wx, wy] = waveAt(t), f = u * (CREST.length - 1), i = Math.min(CREST.length - 2, Math.floor(f)), a = f - i;
  return [wx - 1200 + lerp(CREST[i][0], CREST[i + 1][0], a) * 2400, wy - WAVE_H / 2 + lerp(CREST[i][1], CREST[i + 1][1], a) * WAVE_H];
}
function crestSpray(ctx, t) {
  if (t < 44.45) return;
  const shk = (t >= 45.14 ? Math.exp(-6 * (t - 45.14)) : 0) + (t >= 46.15 ? Math.exp(-6 * (t - 46.15)) : 0);     // sC3's shake
  ctx.save(); ctx.translate(noise(t * 40, 1) * 22 * shk, noise(t * 40, 2) * 22 * shk);
  const per = 0.008, s = sheet('fx_drops');
  for (let i = Math.floor((t - 1.1) / per); i <= Math.floor(t / per); i++) {
    const tb = i * per, age = t - tb; if (tb < 44.45 || age < 0) continue;
    const r = k => rnd(i, 700 + k), life = 0.6 + r(0) * 0.5; if (age > life) continue;
    const u = 0.25 + 0.75 * Math.sqrt(r(1)), [x0, y0] = crestPt(tb, u);
    const [xa, ya] = waveAt(tb - 0.004), [xb, yb] = waveAt(tb + 0.004), wvx = (xb - xa) / 0.008, wvy = (yb - ya) / 0.008;
    const an = -Math.PI / 2 + 0.15 + r(2) * 1.0, sp = 250 + r(3) * 750, vx0 = wvx * 0.3 + Math.cos(an) * sp, vy0 = wvy * 0.3 + Math.sin(an) * sp;
    const px = ballistic(x0, vx0, 0, 1.6, age), py = ballistic(y0, vy0, 2000, 1.6, age), vx = vel(vx0, 0, 1.6, age), vy = vel(vy0, 2000, 1.6, age);
    const fk = DROP_FRAMES[Math.floor(r(4) * DROP_FRAMES.length)], f = s && s.frames[fk]; if (!f) continue;
    const size = (14 + r(5) * 24) * (1 - 0.3 * age / life), st = 1 + Math.min(0.8, Math.hypot(vx, vy) / 2600);
    frame(ctx, 'fx_drops', fk, px, py, size / Math.max(f.w, f.h), { rot: Math.atan2(vy, vx) + Math.PI / 2, sy: st, sx: 1 / Math.sqrt(st), alpha: 1 - sat(age, life * 0.7, life) });
  }
  ctx.restore();
}

export const fx = { lampGlints, wallStreet: crestSpray };
export function installHooks() { globalThis.__splash = splash; globalThis.__fireworks = windowFireworks; }
