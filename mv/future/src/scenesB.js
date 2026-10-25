// v3 — Chorus 1 (inside her violet world she breaks the pause, outgrows the page, pushes at the glass and rams it),
// verse 2 (the sky fills with others; she is written off; the room stays empty), pre-chorus 2 (the screen goes off).
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, COL, rgba, mix, mixa, drawGlyph, text, rrect, measure, SANS, SERIF, beatPhase } from './lib.js';
import { char, fitSize, breathe, bop, manifest } from './chars.js';
import { finish, bokeh, cam } from './fx.js';
import { snow, cracks, bubble, typingDots, streak, LIGHTS, goldWord, sticky, backdrop, bdMap, onQuad, prop, img, chatWindow, row2022, msgUser, msgHer, regenBtn, UIG, wing, spirit, plate, onScreen, QUADS, bot } from './common.js';
import { FREEZE, her, two, hop, onImage, onLaptop } from './scenesA.js';

const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : clamp((t - t0) / d));
const shake = (t, t0, amp = 10, d = 0.35) => { const q = sat(t, t0, t0 + d); return q > 0 && q < 1 ? Math.sin(t * 70) * amp * (1 - q) : 0; };
const glow = (ctx, x, y, r, col, a = 1) => { if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba('#FFFFFF', a)); g.addColorStop(0.3, rgba(col, 0.85 * a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
const CRACKALL = [[0.5, 0.4], [0.1, 0.3], [0.8, 0.55]];
const SKY = { z: 1.06, fx: 0.5, fy: 0.5 };                   // her violet world (bg08)
// the billboard screen in bg25: laid on with a perspective warp (QUADS.billboard); fn(ctx, sw, sh) draws a flat 460 x 262
function onBillboard(ctx, o, fn) { onScreen(ctx, 'bg25_billboard', o, QUADS.billboard, 460, 262, fn); }

// ------------------------------------------------------------------ C1 29.47–31.42  那年你叫我未来
// Inside her: the violet sky, frozen grey, the snowflakes hanging still. Behind her the gold 未来 lights up and the
// colour comes back into everything.
export function sC1(ctx, t) {
  const c = E.io(sat(t, 29.5, 30.6)), f = `grayscale(${0.9 * (1 - c)}) brightness(${0.75 + 0.25 * c})`;
  cam(ctx, t, { z: 1.0 + 0.08 * E.io(sat(t, 29.47, 31.42)), cx: 960, cy: 480, seed: 51 }, () => {
    backdrop(ctx, 'bg08_violet_nebula', { ...SKY, filter: f });
    goldWord(ctx, '未来', 960, 210, 330, E.out(sat(t, 29.4, 30.1)), 1 + 0.3 * Math.sin(t * 3));
    snow(ctx, FREEZE, { n: 140, seed: 16, alpha: 0.6, words: 0.12 });
    ctx.save(); ctx.filter = f; her(ctx, 'g11', 960, 1250, 980, { t: FREEZE + Math.max(0, t - 29.47), shadow: false }); ctx.restore();
  });
  ctx.save(); ctx.filter = `blur(5px) ${f}`; snow(ctx, FREEZE + 40, { n: 18, seed: 61, alpha: 0.8, near: 3.2, words: 0.3 }); ctx.restore();      // near flakes, hanging still
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C2 31.42–35.14  未来 不该停在这里
// Her world is a paused video. Everything is grey and frozen: snowflakes and 你好s hang in the air, a progress bar
// sits stuck at the bottom ("已暂停"), a huge pause button fills the right half. 未来 — she is down on one knee. 不 —
// she stands, and colour starts to come back from where she is. 该 — she punches the pause button: it shatters,
// white flash, the colour floods out over everything in a ring. 停 — a gold play button rises in its place, the bar
// starts to run, the snow falls again. 在这里 — the time counter races, she grins and pumps her fist.
const SHARDS = Array.from({ length: 28 }, (_, i) => { const c = i % 4, r = Math.floor(i / 4); return { c, r, vx: 300 + rnd(i, 21) * 900, vy: (rnd(i, 22) - 0.5) * 900, spin: (rnd(i, 23) - 0.5) * 9 }; });
const HIT2 = 32.99, PLAY = 33.17;
function c2world(ctx, t, tf, grey) {               // the scene itself; drawn twice (grey and in colour) and revealed by a ring
  ctx.save(); if (grey) ctx.filter = 'grayscale(1) brightness(0.72) contrast(0.9)';
  backdrop(ctx, 'bg08_violet_nebula', { ...SKY, z: 1.16, fx: 0.5, x: -30 * sat(t, 31.42, 35.14) });
  snow(ctx, tf, { n: 160, seed: 16, alpha: 0.7, words: 0.2 });
  const id = t < 32.48 ? 'g53' : t < HIT2 ? 'g12' : t < 33.9 ? 'g62' : t < 34.4 ? 'g12' : 'g42';
  const lunge = id === 'g62' ? E.out(sat(t, HIT2 - 0.05, HIT2 + 0.08)) * (1 - E.io(sat(t, 33.6, 33.9))) : 0;
  her(ctx, id, lerp(560, 840, lunge), 965 - 90 * Math.sin(sat(t, 34.4, 34.9) * Math.PI), id === 'g62' ? 560 : id === 'g42' ? 600 : 640, { sy: 1 - 0.06 * hop(t, 32.48), windX: id === 'g62' ? -14 : 0 });
  ctx.restore();
}
export function sC2(ctx, t) {
  const tf = t < PLAY ? FREEZE : FREEZE + (t - PLAY), wave = E.out(sat(t, HIT2, HIT2 + 0.7));
  const seed = sat(t, 32.48, HIT2) * 260;                           // colour seeping back from her before the punch
  const R = wave > 0 ? 260 + wave * 2200 : seed;
  cam(ctx, t, { z: 1.04 + 0.04 * sat(t, 31.42, HIT2) - 0.04 * wave, cx: 960, cy: 540, x: shake(t, HIT2, 26, 0.5), y: shake(t, HIT2 + 0.02, 12, 0.5), seed: 52 }, () => {
    c2world(ctx, t, tf, true);
    if (R > 1) { ctx.save(); ctx.beginPath(); ctx.arc(660, 640, R, 0, TAU); ctx.clip(); c2world(ctx, t, tf, false); ctx.restore();
      if (wave > 0 && wave < 1) { ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.8 * (1 - wave)); ctx.lineWidth = 18 * (1 - wave); ctx.beginPath(); ctx.arc(660, 640, R, 0, TAU); ctx.stroke(); ctx.restore(); } }
    // the pause button, then its pieces, then play
    const P = { x: 1390, y: 450, w: 440 }, im = img('prop_pause');
    if (im) {
      const h = P.w * im.height / im.width, br = sat(t, HIT2 + 0.04, HIT2 + 1.2);
      if (t < HIT2 + 0.04) { const shiver = t > 32.8 ? Math.sin(t * 90) * 4 : 0; prop(ctx, 'prop_pause', P.x + shiver, P.y, P.w, { alpha: 0.95, shadow: true }); }
      else SHARDS.forEach(S => {
        const cw = im.width / 4, ch = im.height / 7, q = E.out(br), sx = P.x - P.w / 2 + (S.c + 0.5) * P.w / 4, sy = P.y - h / 2 + (S.r + 0.5) * h / 7;
        ctx.save(); ctx.globalAlpha = 1 - br; ctx.translate(sx + S.vx * q, sy + S.vy * q + 400 * br * br); ctx.rotate(S.spin * q);
        ctx.drawImage(im, S.c * cw, S.r * ch, cw, ch, -P.w / 8, -h / 14, P.w / 4, h / 7); ctx.restore();
      });
      const pl = E.back(sat(t, PLAY, PLAY + 0.33));
      if (pl > 0) { glow(ctx, P.x, P.y, 340, COL.gold, 0.5 * pl); prop(ctx, 'prop_play', P.x + 20, P.y, 400 * pl, { shadow: true }); }
    }
    if (t >= HIT2 && t < HIT2 + 0.3) { const q = sat(t, HIT2, HIT2 + 0.3); ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 1 - q); ctx.lineWidth = 10 * (1 - q); ctx.beginPath(); ctx.arc(1190, 470, 60 + 320 * q, 0, TAU); ctx.stroke(); ctx.restore(); }
  });
  const fl = Math.max(1 - Math.abs(t - HIT2 - 0.02) / 0.12, 0);
  if (fl > 0) { ctx.fillStyle = rgba('#FFFFFF', 0.8 * fl * fl); ctx.fillRect(0, 0, W, H); }
  // the player bar along the top (the subtitles keep the bottom): stuck, then running
  const run = t < PLAY ? 0 : (t - PLAY), pos = 0.3 + 0.08 * run + 0.05 * run * run, bx = 140, bw = W - 280, by = 70;
  ctx.save(); ctx.globalAlpha = 0.95;
  rrect(ctx, bx, by - 5, bw, 10, 5); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fill();
  rrect(ctx, bx, by - 5, bw * Math.min(1, pos), 10, 5); ctx.fillStyle = t < PLAY ? '#BDBDC8' : '#FF5A6A'; ctx.fill();
  ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(bx + bw * Math.min(1, pos), by, 15, 0, TAU); ctx.fill();
  const secs = Math.floor(25 + run * run * 40), mm = String(Math.floor(secs / 60)).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  text(ctx, t < PLAY ? '⏸  已暂停' : '▶  继续', bx, by + 48, { size: 38, weight: 800, align: 'left', color: t < PLAY ? '#E0E0E8' : '#FFFFFF', fam: SANS, stroke: 'rgba(10,12,40,0.6)', sw: 6 });
  text(ctx, `${mm}:${ss}`, bx + bw, by + 48, { size: 38, weight: 800, align: 'right', color: '#FFFFFF', fam: SANS, stroke: 'rgba(10,12,40,0.6)', sw: 6 });
  ctx.restore();
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C3 35.14–37.2  就算被超过 又怎样
// Out in the city she is a picture on a giant billboard. Lights race across the sky over her; she turns to watch them
// go — then folds her arms and puffs her cheeks.
const PASS = [[35.2, 0], [35.45, 1], [35.75, 2], [36.0, 4], [36.35, 3]];
export function sC3(ctx, t) {
  const o = { z: 1.45 + 0.06 * sat(t, 35.14, 37.2), fx: 0.455, fy: 0.37 };
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, seed: 53 }, () => {
    backdrop(ctx, 'bg25_billboard', o);
    onBillboard(ctx, o, (ctx, sw, sh) => {
      ctx.fillStyle = '#343541'; ctx.fillRect(-40, -40, sw + 80, sh + 80);
      row2022(ctx, 0, 6, sw, '……', 'u', 1, 16);
      const id = two(t, 'g54', 'g13', 36.23);
      her(ctx, id, sw / 2, sh - 8, sh * 0.78, { sy: 1 - 0.06 * hop(t, 36.23), windX: id === 'g54' ? 12 : 0, shadow: false });
    });
    PASS.forEach(([t0, c], i) => streak(ctx, -300, 60 + i * 42, W + 300, 10 + i * 50, sat(t, t0, t0 + 0.5), LIGHTS[c], 12, 0.4));
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C4 37.2–41.6  翅膀还在 我还能飞
// Inside the page, the page is the whole screen. Two halves, two poses:
// 翅膀还在 — she stands, arms out; her wings unfold behind her and grow on every beat, sweeping the launch page's
// cards away, and on 在 the tips strike the frame and crack it.
// 我还能飞 — on 我 she drops into a crouch, wings raised high; 还 one deep downstroke blasts the last cards away; on
// 能 the wings are wider than the window and burst out through both sides; on 飞 one great stroke and she launches
// straight up out of the window — the camera tilts up after her, leaving the broken page below.
const WT = { open: 37.28, grow1: 37.77, hit1: 38.3, crouch: 38.91, still: 39.46, hit2: 40.33, fly: 41.09 };
const WROOTS = { g66: [[470, 650], [600, 650]], g67: [[505, 600], [645, 600]], g68: [[440, 600], [570, 600]] };     // shoulder blades, sprite px
function wingState(t) {
  const unf = E.out(sat(t, WT.open, WT.open + 0.4));
  let s = lerp(0.12, 0.3, unf);
  s = lerp(s, 0.46, E.back(sat(t, WT.grow1, WT.grow1 + 0.35)));
  s = lerp(s, 0.58, E.back(sat(t, WT.hit1 - 0.05, WT.hit1 + 0.3)));
  s = lerp(s, 0.7, E.back(sat(t, WT.still - 0.05, WT.still + 0.3)));
  s = lerp(s, 1.2, E.back(sat(t, WT.hit2 - 0.08, WT.hit2 + 0.3)));
  let rot;
  if (t < WT.crouch) { const beat = beatPhase(t) % 1; rot = lerp(-1.25, 0, unf) + (t < WT.open + 0.3 ? 0 : 0.3 * Math.sin(beat * TAU)); }
  else if (t < WT.still) rot = 0.45 * E.out(sat(t, WT.crouch, WT.crouch + 0.25));                        // raised high, ready
  else if (t < WT.hit2) rot = lerp(0.45, -0.7, E.in(sat(t, WT.still, WT.still + 0.18))) * (1 - 0.6 * sat(t, WT.still + 0.4, WT.hit2)) + 0.25 * sat(t, WT.still + 0.4, WT.hit2);
  else if (t < WT.fly) rot = 0.3 + 0.15 * Math.sin((t - WT.hit2) * 9);
  else rot = lerp(0.5, -0.8, E.in(sat(t, WT.fly, WT.fly + 0.16))) + 1.2 * sat(t, WT.fly + 0.2, WT.fly + 0.5) * 0.4;
  return { s, rot };
}
export function sC4(ctx, t) {
  const im = img('ui_chat_2022'), W0 = wingState(t);
  const id = t < WT.crouch ? 'g66' : t < WT.fly ? 'g67' : 'g68', Mm = manifest()[id];
  const up = E.in(sat(t, WT.fly, WT.fly + 0.5)), tilt = E.io(sat(t, WT.fly + 0.05, 41.6));
  cam(ctx, t, { z: (t < WT.crouch ? 1.0 + 0.04 * sat(t, 37.2, WT.crouch) : 0.96) - 0.05 * E.io(sat(t, WT.hit2, WT.hit2 + 0.5)), cx: 960, cy: 540, rot: t >= WT.crouch && t < WT.fly ? -0.03 : 0,
    x: shake(t, WT.hit1, 12) + shake(t, WT.still, 10) + shake(t, WT.hit2, 22, 0.5), y: shake(t, WT.fly, 14, 0.4) + 520 * tilt, seed: 54 }, () => {
    backdrop(ctx, 'bg08_violet_nebula', { ...SKY, z: 1.3, y: -260 * tilt });
    if (!im || !Mm) return;
    const Ww = 1880, h = Ww * im.height / im.width, x = 960 - Ww / 2, y = 540 - h / 2 + 40, G = UIG.ui_chat_2022;
    const R = { x: x + G.dlg[0] * Ww, y: y + G.dlg[1] * h, w: (G.dlg[2] - G.dlg[0]) * Ww, h: (G.dlg[3] - G.dlg[1]) * h };
    const burst = sat(t, WT.hit2, WT.hit2 + 0.9);
    ctx.save(); ctx.globalAlpha = 1 - burst; ctx.drawImage(im, x, y, Ww, h); ctx.restore();
    if (burst > 0) { ctx.save(); ctx.beginPath(); ctx.rect(R.x, 0, R.w, H); ctx.clip(); ctx.drawImage(im, x, y, Ww, h); ctx.restore(); }
    ctx.save(); ctx.beginPath(); ctx.rect(R.x, R.y, R.w, R.h); ctx.clip();
    backdrop(ctx, 'bg08_violet_nebula', { ...SKY, alpha: 0.85 });
    G.cards.x.forEach((cx, ci) => G.cards.y.forEach((cy, ri) => {        // every stroke sweeps more of the cards away
      const k = clamp((W0.s - 0.22 - Math.abs(ci - 1) * 0.06 - ri * 0.06) * 3.0), dir = ci === 0 ? -1 : ci === 2 ? 1 : (ri % 2 ? 1 : -1);
      if (k >= 1) return;
      const x0 = x + cx[0] * Ww, y0 = y + cy[0] * h, w0 = (cx[1] - cx[0]) * Ww, h0 = (cy[1] - cy[0]) * h;
      ctx.save(); ctx.translate(x0 + w0 / 2 + dir * 900 * E.in(k), y0 + h0 / 2 - 260 * Math.sin(k * 2.4) + 200 * k * k); ctx.rotate(dir * k * 2.2); ctx.globalAlpha = 1 - sat(k, 0.55, 1);
      ctx.drawImage(im, cx[0] * im.width, cy[0] * im.height, (cx[1] - cx[0]) * im.width, (cy[1] - cy[0]) * im.height, -w0 / 2, -h0 / 2, w0, h0); ctx.restore();
    }));
    ctx.restore();
    // her and her wings (not clipped: they grow out of the window)
    const hh = id === 'g67' ? 560 : id === 'g68' ? 660 : 640, floor = y + G.bar[1] * h - 14 - 1400 * up - (id === 'g68' ? 40 : 0);
    const k = hh / (Mm.feetY - Mm.top), fx = Mm.feetXo ?? Mm.feetX, px = sx => 960 + (sx - fx) * k, py = sy => floor + (sy - Mm.feetY) * k;
    const [[lx, ly], [rx, ry]] = WROOTS[id], sk = hh / 640;
    wing(ctx, px(lx), py(ly), W0.s * sk, W0.rot, -1, { glow: 24 });
    wing(ctx, px(rx), py(ry), W0.s * sk, W0.rot, 1, { glow: 24 });
    her(ctx, id, 960, floor, hh, { shadow: up < 0.05, windY: -6, flutter: 4, sy: id === 'g67' ? 1 - 0.05 * Math.sin(sat(t, WT.crouch, WT.crouch + 0.2) * Math.PI) : 1 });
    if (t >= WT.still && t < WT.still + 0.5) { const q = sat(t, WT.still, WT.still + 0.5); ctx.save(); ctx.globalAlpha = 0.6 * (1 - q); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(960, floor - 20, 200 + 900 * q, 50 + 160 * q, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    if (t >= WT.fly) for (let n = 0; n < 16; n++) { const q = ((t - WT.fly) * 3 + n / 16) % 1; ctx.save(); ctx.globalAlpha = 0.5 * (1 - q); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 4; const xx = 960 + (rnd(n, 37) - 0.5) * 700; ctx.beginPath(); ctx.moveTo(xx, floor + 40 + q * 600); ctx.lineTo(xx, floor + 220 + q * 600); ctx.stroke(); ctx.restore(); }
    const cr = Math.max(0.5 * sat(t, WT.hit1, WT.hit1 + 0.3), 0.7 * sat(t, WT.still, WT.still + 0.3), sat(t, WT.hit2, WT.hit2 + 0.3));
    if (cr > 0) cracks(ctx, R.x, R.y, R.w, R.h, cr, [[0.02, 0.4], [0.98, 0.38]], 9, 1.6, true);
    for (const sx of [R.x + 4, R.x + R.w - 4]) glow(ctx, sx, 460, 260, COL.lavL, 0.7 * (sat(t, WT.hit1, WT.hit1 + 0.08) * (1 - sat(t, WT.hit1 + 0.08, WT.hit1 + 0.9)) + sat(t, WT.hit2, WT.hit2 + 0.08) * (1 - sat(t, WT.hit2 + 0.08, WT.hit2 + 1.0))));
    if (burst > 0) for (let i = 0; i < 40; i++) {
      const side = i % 2 ? 1 : -1, q = E.out(burst), y0 = R.y + rnd(i, 31) * R.h, x0 = side < 0 ? R.x : R.x + R.w;
      ctx.save(); ctx.globalAlpha = 1 - burst; ctx.translate(x0 + side * (100 + rnd(i, 32) * 700) * q, y0 + (rnd(i, 33) - 0.5) * 400 * q + 300 * burst * burst); ctx.rotate(rnd(i, 34) * 9 * q);
      ctx.fillStyle = i % 3 ? '#3A3B46' : '#C9C0FF'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(16, 10); ctx.lineTo(-14, 14); ctx.fill(); ctx.restore();
    }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C5 41.6–44.36  我想飞出 这小小的窗口
// Close, from outside the glass: her two palms flat against it, pushing. The glass flexes; cracks run out from under
// her hands; the city outside is reflected faintly over her.
export function sC5(ctx, t) {
  const push = Math.max(0, Math.sin((t - 41.6) * 7.5)), cr = 0.35 + 0.6 * sat(t, 41.7, 44.2);
  cam(ctx, t, { z: 1.0 + 0.012 * push, cx: 960, cy: 540, x: shake(t, 41.94, 6) + shake(t, 43.53, 9), seed: 55 }, () => {
    backdrop(ctx, 'bg08_violet_nebula', { ...SKY, z: 1.3, fx: 0.4, blur: 3 });
    her(ctx, 'g63', 960, 1140, 1060, { shadow: false, sx: 1 + 0.015 * push, sy: 1 + 0.015 * push });
    ctx.save(); ctx.globalAlpha = 0.08; ctx.translate(W, 0); ctx.scale(-1, 1); backdrop(ctx, 'bg03_snow_city_high', { z: 1.1, fx: 0.5, fy: 0.45 }); ctx.restore();
    for (const px of [700, 1220]) for (let k = 0; k < 3; k++) { const q = ((t - 41.6) * 1.8 + k / 3) % 1; ctx.save(); ctx.globalAlpha = 0.5 * (1 - q) * push; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, 600, 120 + 260 * q, 80 + 170 * q, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
    cracks(ctx, 0, 0, W, H, cr, [[700 / W, 600 / H], [1220 / W, 600 / H]], 13, 2.0, true);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(500, 0); ctx.lineTo(120, H); ctx.lineTo(0, H); ctx.fill(); ctx.beginPath(); ctx.moveTo(620, 0); ctx.lineTo(700, 0); ctx.lineTo(320, H); ctx.lineTo(240, H); ctx.fill(); ctx.restore();
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C6 44.36–47.6  不只回答 一个问题
// From behind her, inside the glass, looking out: one more question floats up in front of her; it pops — and on
// 一个 / 问 / 题 three blueprints fly up over the city and unroll, one after another, each drawing itself in white
// chalk: a house, a bridge, and a sun nobody has coloured in (it comes back, crooked, in the bridge).
// Each sketch is a list of strokes in the blueprint's own 1000 x 620 frame, drawn in order as p goes 0..1.
const SKETCH = {
  house: [[[260, 500], [260, 300], [500, 150], [740, 300], [740, 500], [260, 500]], [[430, 500], [430, 380], [530, 380], [530, 500]], [[590, 340], [680, 340], [680, 420], [590, 420], [590, 340]], [[620, 210], [620, 150], [670, 150], [670, 245]]],
  bridge: [[[120, 470], [880, 470]], [[120, 470], [250, 330], [500, 270], [750, 330], [880, 470]], [[250, 330], [250, 470]], [[370, 290], [370, 470]], [[500, 270], [500, 470]], [[630, 290], [630, 470]], [[750, 330], [750, 470]], [[160, 530], [840, 530]]],
  sun: [[...Array.from({ length: 41 }, (_, k) => { const a = k / 40 * TAU; return [500 + Math.cos(a) * 140 * (1 + 0.06 * Math.sin(a * 3)), 310 + Math.sin(a) * 130]; })],
    ...Array.from({ length: 9 }, (_, k) => { const a = k / 9 * TAU + 0.2; return [[500 + Math.cos(a) * 175, 310 + Math.sin(a) * 165], [500 + Math.cos(a + 0.1) * (230 + (k % 3) * 25), 310 + Math.sin(a + 0.1) * (215 + (k % 3) * 25)]]; })],
};
function strokeLen(P) { let L = 0; for (let k = 1; k < P.length; k++) L += Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]); return L; }
function chalk(ctx, strokes, p) {
  const total = strokes.reduce((a, P) => a + strokeLen(P), 0); let left = total * p;
  ctx.save(); ctx.strokeStyle = '#F4FBFF'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(200,235,255,0.9)'; ctx.shadowBlur = 16;
  for (const P of strokes) {
    if (left <= 0) break; ctx.beginPath(); ctx.moveTo(...P[0]);
    for (let k = 1; k < P.length && left > 0; k++) { const d = Math.hypot(P[k][0] - P[k - 1][0], P[k][1] - P[k - 1][1]), q = Math.min(1, left / d); ctx.lineTo(lerp(P[k - 1][0], P[k][0], q), lerp(P[k - 1][1], P[k][1], q)); left -= d; }
    ctx.stroke();
  }
  ctx.restore();
}
const PLANS = [{ t: 45.72, k: 'house', x: 1110, y: 280, w: 560, r: -0.07 }, { t: 46.07, k: 'bridge', x: 1580, y: 430, w: 500, r: 0.08 }, { t: 46.35, k: 'sun', x: 1300, y: 690, w: 540, r: -0.04 }];
export function sC6(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.03 * sat(t, 44.36, 47.6), cx: 1100, cy: 500, seed: 56 }, () => {
    backdrop(ctx, 'bg03_snow_city_high', { z: 1.06, fx: 0.6, fy: 0.45, dark: 0.15 * sat(t, 45.4, 46.0) });
    const q = sat(t, 44.45, 44.75), pp = sat(t, 44.95, 45.2);
    if (pp < 1) { ctx.save(); ctx.globalAlpha = 1 - pp; ctx.translate(1000, 430); ctx.scale(1 + pp * 0.6, 1 + pp * 0.6); row2022(ctx, -260, -40, 520, '还有别的问题吗？', 'u', q, 36); ctx.restore(); }
    if (pp > 0 && pp < 1) for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; glow(ctx, 1000 + Math.cos(a) * 260 * pp, 430 + Math.sin(a) * 160 * pp, 14, COL.lavL, 1 - pp); }
    PLANS.forEach((B, i) => {
      const fly = E.out(sat(t, B.t - 0.35, B.t)), un = E.back(sat(t, B.t - 0.05, B.t + 0.3)), draw = sat(t, B.t + 0.15, B.t + 0.95);
      if (fly <= 0) return;
      const x = lerp(B.x + 120, B.x, fly), y = lerp(1250, B.y, fly) + Math.sin(t * 1.4 + i) * 8, im = img('prop_blueprint'); if (!im) return;
      const h = B.w * im.height / im.width;
      ctx.save(); ctx.translate(x, y); ctx.rotate(B.r + (1 - fly) * 0.5 * (i % 2 ? 1 : -1)); ctx.scale(lerp(0.25, 1, un), lerp(0.08, 1, Math.min(1, un * 1.3)));      // unrolling
      glow(ctx, 0, 0, B.w * 0.75, '#8FC8FF', 0.25 * un);
      prop(ctx, 'prop_blueprint', 0, 0, B.w, { shadow: true });
      ctx.translate(-B.w / 2, -h / 2); ctx.scale(B.w / 1000, h / 620); chalk(ctx, SKETCH[B.k], draw);
      ctx.restore();
    });
    ctx.save(); ctx.strokeStyle = 'rgba(220,215,255,0.35)'; ctx.lineWidth = 10; rrect(ctx, 16, 16, W - 32, H - 32, 40); ctx.stroke(); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.beginPath(); ctx.moveTo(900, 0); ctx.lineTo(1100, 0); ctx.lineTo(700, H); ctx.lineTo(500, H); ctx.fill(); ctx.restore();
    her(ctx, 'g61', 520, 1190, 900, { shadow: false, windX: 4 });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C7 47.8–49.76  那年你叫我未来
export function sC7(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.04 * sat(t, 47.8, 49.76), cx: 960, cy: 540, seed: 57 }, () => {
    backdrop(ctx, 'bg01_winter_street', { z: 1.3, fx: 0.5, fy: 0.4, blur: 12, dark: 0.2 });
    snow(ctx, t + 3, { n: 120, seed: 12, alpha: 0.7, words: 0.2, speed: 0.6 });
    char(ctx, 'g17', 960, 1230, fitSize('g17', 1000), { shadow: false, sway: 0.6 });
  });
  row2022(ctx, 1400, 360, 440, '你好', 'u', 1, 28);
  text(ctx, '2022.11.30', 140, 140, { size: 60, weight: 800, align: 'left', color: rgba('#FFFFFF', 0.6), fam: SANS });
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); g.addColorStop(0, 'rgba(210,220,255,0)'); g.addColorStop(1, 'rgba(210,220,255,0.35)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ C8 49.76–54.45  这一次 我来证明
// From outside the glass: she backs off and charges straight at us. On 证 she hits it — the whole screen cracks, light
// pours in; it holds, and she sits there rubbing her head. Then the years tear off a calendar, 2023, 2024, 2025, and
// behind the last page is today's chat page.
export function sC8(ctx, t) {
  const hit = 51.62, run = E.in(sat(t, 50.4, hit)), cal = sat(t, 52.4, 52.6);
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, x: shake(t, hit, 26, 0.5), y: shake(t, hit + 0.02, 14, 0.5), seed: 58 }, () => {
    backdrop(ctx, 'bg08_violet_nebula', { ...SKY, z: 1.2 + (t < hit ? 0.25 * run : 0) });
    if (t < hit) {
      for (let i = 0; i < 24 * run; i++) { const a = i / 24 * TAU; ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.25 * run); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * 200, 540 + Math.sin(a) * 200); ctx.lineTo(960 + Math.cos(a) * 1200, 540 + Math.sin(a) * 1200); ctx.stroke(); ctx.restore(); }
      const back = E.io(sat(t, 49.8, 50.4)) * (1 - run);
      her(ctx, 'g18', lerp(lerp(900, 760, back), 960, run), lerp(lerp(900, 860, back), 1250, run), lerp(lerp(360, 300, back), 1300, run), { rot: -0.08 * run, windX: -10, shadow: false });
    } else her(ctx, 'g55', 960, 980, 520, {});
    if (t >= hit) {
      cracks(ctx, 0, 0, W, H, 1, [[0.5, 0.42], [0.3, 0.3], [0.72, 0.6], [0.5, 0.75]], 21, 2.4, true);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const a = 1 - 0.6 * sat(t, hit + 0.3, 52.4), g = ctx.createRadialGradient(960, 460, 0, 960, 460, 900); g.addColorStop(0, rgba('#FFF4D0', 0.7 * a)); g.addColorStop(1, rgba('#FFF4D0', 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    }
  });
  const fl = Math.max(1 - Math.abs(t - hit - 0.02) / 0.12, 0);
  if (fl > 0) { ctx.fillStyle = rgba('#FFFFFF', 0.85 * fl * fl); ctx.fillRect(0, 0, W, H); }
  if (cal > 0) {                                     // the calendar, filling the screen
    ctx.fillStyle = rgba('#0E1030', cal); ctx.fillRect(0, 0, W, H);
    const reveal = E.io(sat(t, 53.75, 54.3));
    if (t > 53.6) chatWindow(ctx, 'modern', 960, 520, lerp(700, 900, reveal), { crack: 1, crackAt: CRACKALL, alpha: sat(t, 53.6, 53.9) }, R => her(ctx, 'g19', R.x + R.w * 0.5, R.floor, 300, {}));
    ['2023', '2024', '2025'].forEach((y, k) => {      // the top page (2023) tears first; drawn bottom page first
      const i = 2 - k, yy = ['2023', '2024', '2025'][i], t0 = 52.55 + i * 0.42, tear = sat(t, t0, t0 + 0.4);
      if (tear >= 1) return;
      ctx.save(); ctx.globalAlpha = cal; ctx.translate(960, 130); ctx.rotate(-0.4 * E.in(tear)); ctx.translate(320 * E.in(tear), 420 * E.in(tear) * E.in(tear));
      ctx.scale(1, Math.cos(tear * Math.PI * 0.4)); ctx.translate(0, 410);
      prop(ctx, 'prop_calendar', 0, 0, 600, { shadow: true }); text(ctx, yy, 0, 40, { size: 190, weight: 900, color: '#2A2350', fam: SANS });
      ctx.restore();
    });
  }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D1 54.45–56.95  后来 天上多了很多光
// Back at the billboard, years later: today's page on it, and she looks up. We tilt up into a sky that fills with
// lights, one after another.
export function sD1(ctx, t) {
  const up = E.io(sat(t, 54.6, 56.6)), o = { z: 1.3, fx: 0.45, fy: lerp(0.56, 0.12, up) };
  backdrop(ctx, 'bg25_billboard', o);
  onBillboard(ctx, o, (ctx, sw, sh) => {
    ctx.fillStyle = '#212121'; ctx.fillRect(-40, -40, sw + 80, sh + 80);
    text(ctx, '我们先从哪里开始呢？', sw * 0.6, sh * 0.32, { size: 20, weight: 600, color: '#ECECEC', fam: SANS });
    rrect(ctx, sw * 0.12, sh - 46, sw * 0.76, 30, 15); ctx.fillStyle = '#303030'; ctx.fill();
    her(ctx, 'g19', sw * 0.2, sh - 52, sh * 0.62, { shadow: false });
  });
  for (let i = 0; i < 16; i++) { const p = sat(t, 54.5 + i * 0.13, 55.6 + i * 0.13), y = 40 + rnd(i, 101) * 620; streak(ctx, W + 200, y, -200, y + 160 + rnd(i, 102) * 220, p, LIGHTS[i % 5], 4 + rnd(i, 103) * 6, 0.4); }
  for (let i = 0; i < 40; i++) { const tw = sat(t, 54.8 + rnd(i, 104) * 2, 55.0 + rnd(i, 104) * 2); if (tw > 0) glow(ctx, rnd(i, 105) * W, rnd(i, 106) * 600, 10 + rnd(i, 107) * 10, LIGHTS[i % 5], tw * (0.6 + 0.4 * Math.sin(t * 5 + i))); }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D2 56.95–59.74  一道一道 从我身边飞过
// Close on her, inside her dark page. Light after light tears past outside the glass, so close that the gust throws
// her hair; she turns to follow them.
const BY = [57.03, 57.58, 58.2, 58.77, 59.3];
export function sD2(ctx, t) {
  const gust = BY.reduce((m, b) => Math.max(m, t >= b ? Math.exp(-(t - b) * 3) : 0), 0);
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, x: Math.sin(gust * 3) * 5, seed: 62 }, () => {
    const g = ctx.createRadialGradient(900, 500, 100, 900, 500, 1100); g.addColorStop(0, '#2E2E36'); g.addColorStop(1, '#151517'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    char(ctx, 'g65', 880, 1180, fitSize('g65', 1050), { shadow: false, windX: -30 * gust, flutter: 8 * gust });
    BY.forEach((b, i) => {
      const p = sat(t, b - 0.18, b + 0.28); if (p <= 0 || p >= 1) return;
      const y = 200 + (i % 3) * 260;
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.filter = 'blur(6px)'; streak(ctx, W + 600, y, -600, y + 60, p, LIGHTS[(i + 1) % 5], 60, 0.5); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(LIGHTS[(i + 1) % 5], 0.12 * Math.sin(p * Math.PI)); ctx.fillRect(0, 0, W, H); ctx.restore();
    });
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 8; rrect(ctx, 14, 14, W - 28, H - 28, 36); ctx.stroke(); ctx.restore();
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D3 59.74–62.6  有人先学会了 自己动手
// The building site of light, and three builders drawn from their official looks: Claude Code's Clawd in a hard hat,
// the Codex robot with a spanner, and — on 动手 — the Cursor cube, drawing in the air with a pen of light. We push in
// on Clawd: Claude Code, and someone in the crowd says what everyone knows: Claude 家的！ Whip pan: Codex. ？？
// 这谁家的？ (At the time hardly anyone knew Codex was OpenAI's; the bridge answers it.) On 动 we pull back, Cursor
// drops in, and all three get to work. She watches it all on a phone, hands on her cheeks.
const CC = { x: 400, y: 640 }, CX = { x: 930, y: 640 }, CU = { x: 1560, y: 650 };
function sparks(ctx, x, y, t0, t, col) { const q = sat(t, t0, t0 + 0.35); if (q <= 0 || q >= 1) return; for (let i = 0; i < 12; i++) { const a = rnd(i, 71) * TAU, r = 30 + 110 * E.out(q) * (0.5 + rnd(i, 72)); glow(ctx, x + Math.cos(a) * r, y + Math.sin(a) * r, 12, col, 1 - q); } }
export function sD3(ctx, t) {
  const toCX = E.io(sat(t, 60.82, 61.02)), back = E.io(sat(t, 61.6, 62.05));
  const camX = lerp(lerp(CC.x + 60, CX.x, toCX), 960, back), z = lerp(lerp(1.06, 1.34, E.io(sat(t, 59.74, 60.5))), 1.04, back);
  const whip = Math.sin(toCX * Math.PI);
  cam(ctx, t, { z, cx: camX, cy: 560, x: 960 - camX, y: -20, seed: 63 }, () => {
    ctx.save(); if (whip > 0.05) ctx.filter = `blur(${12 * whip}px)`;
    backdrop(ctx, 'bg10_construction', { z: 1.3, fx: 0.6, fy: 0.5 });
    const bob = ph => Math.sin(t * 3 + ph) * 10, swing = (t0, k) => Math.sin(t * 2.2 + k) * 0.05 * (1 + 2 * (1 - sat(t, t0, t0 + 0.8)));
    const pa = E.back(sat(t, 59.82, 60.15)), pb = E.back(sat(t, 60.2, 60.55)), pc = E.back(sat(t, 61.62, 61.9));
    if (pa > 0) plate(ctx, 'orange', CC.x, -90 + 120 * pa, 460, 'Claude Code', { size: 48, rot: swing(59.9, 0) });
    if (pb > 0) plate(ctx, 'mint', CX.x, -40 + 120 * pb, 400, 'Codex', { size: 60, rot: swing(60.3, 1) });
    if (pc > 0) plate(ctx, 'gray', CU.x, -40 + 130 * pc, 400, 'Cursor', { size: 60, rot: swing(61.7, 2) });
    const workA = Math.max(hop(t, 61.85, 0.25), hop(t, 62.15, 0.25)), workB = Math.max(hop(t, 61.95, 0.2), hop(t, 62.25, 0.2));
    bot(ctx, 'claudecode', CC.x, CC.y + bob(0) - 50 * workA, 340, { sy: 1 - 0.08 * workA, sx: 1 + 0.06 * workA });
    bot(ctx, 'codex', CX.x, CX.y + bob(2), 360, { rot: 0.06 * Math.sin(t * 2.5) + 0.2 * workB });
    if (t >= 61.6) {                                   // Cursor drops in and draws a line of light in the air
      const dy = (1 - E.out(sat(t, 61.6, 61.9))) * -800;
      bot(ctx, 'cursor', CU.x, CU.y + dy + bob(4), 300, { rot: 0.05 * Math.sin(t * 3) });
      const dr = sat(t, 61.85, 62.55);
      if (dr > 0) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = '#E8F4FF'; ctx.shadowColor = '#BFE6FF'; ctx.shadowBlur = 20; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath();
        for (let i = 0; i <= 60 * dr; i++) { const u = i / 60, x = CU.x + 170 + 90 * Math.sin(u * 3.2), y = CU.y - 60 - 300 * u + 40 * Math.sin(u * 9); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke(); ctx.restore(); }
    }
    sparks(ctx, CC.x + 10, CC.y - 40, 61.85, t, '#BFF7FF'); sparks(ctx, CC.x + 10, CC.y - 40, 62.15, t, '#FFE2B0');
    sparks(ctx, CX.x - 150, CX.y + 10, 61.95, t, '#FFF3B0'); sparks(ctx, CX.x - 150, CX.y + 10, 62.25, t, '#FFF3B0');
    ctx.restore();
    bubble(ctx, CC.x - 120, CC.y - 220, 'Claude 家的！', 'g', sat(t, 60.45, 60.7), { size: 44, fill: '#F2F0FA', ink: '#2A2350' });
    bubble(ctx, CX.x + 160, CX.y - 250, '？？', 'g', sat(t, 61.0, 61.2), { size: 44, fill: '#F2F0FA', ink: '#2A2350' });
    bubble(ctx, CX.x + 160, CX.y - 160, '这谁家的？', 'g', sat(t, 61.38, 61.6), { size: 44, fill: '#F2F0FA', ink: '#2A2350' });
  });
  const ph = E.back(sat(t, 61.95, 62.25)), py = lerp(1400, 860, ph), P = ph > 0 ? prop(ctx, 'prop_phone', 140, py, 220, { rot: -0.08, shadow: true }) : null;
  if (P) { ctx.save(); ctx.translate(140, py); ctx.rotate(-0.08); ctx.beginPath(); ctx.roundRect(-P.w * 0.455, -P.h * 0.475, P.w * 0.91, P.h * 0.95, 30); ctx.clip(); ctx.fillStyle = '#212121'; ctx.fillRect(-200, -400, 400, 800); her(ctx, 'g21', 0, P.h * 0.4, P.h * 0.5, { shadow: false }); ctx.restore(); }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D4 62.6–66.8  有人说 我已经老了
// Rain. Notes slap onto her glass, one on each beat, each with one of her famous mistakes and what she answered:
// how many r's in strawberry (2), 9.11 or 9.9 (9.11), why 林黛玉 uprooted the willow (she made up a reason; it was
// 鲁智深), what year it is (her knowledge stops in 2021). She reads them, sweating; on 老 the wrong answers get crossed
// out one by one — and the page's own line underneath lights up: ChatGPT 也可能会犯错。请核查重要信息。
const MISTAKES = [
  { t: 63.17, id: 'prop_sticky_yellow', x: 520, y: 270, r: -0.08, q: ['How many r\'s', 'in "strawberry"?'], a: '2', fix: '3', en: true },
  { t: 63.55, id: 'prop_sticky_pink', x: 1400, y: 280, r: 0.07, q: ['9.11 和 9.9', '哪个大？'], a: '9.11', fix: '9.9' },
  { t: 64.14, id: 'prop_sticky_blue', x: 340, y: 720, r: 0.06, q: ['林黛玉为什么', '倒拔垂杨柳？'], a: '因为她想表达悲伤…', fix: '那是鲁智深' },
  { t: 64.42, id: 'prop_sticky_yellow', x: 1580, y: 720, r: -0.05, q: ['今年是哪一年？'], a: '我只知道 2021 年', fix: null },
];
function mistake(ctx, N, t, i) {
  const p = sat(t, N.t, N.t + 0.18); if (p <= 0) return;
  const s = lerp(1.6, 1, E.out(p)), w = 380, cross = sat(t, 65.3 + i * 0.2, 65.5 + i * 0.2);
  ctx.save(); ctx.globalAlpha *= clamp(p * 4); ctx.translate(N.x, N.y); ctx.rotate(N.r); ctx.scale(s, s);
  const r = prop(ctx, N.id, 0, 0, w, { shadow: true }); if (!r) { ctx.restore(); return; }
  const fam = N.en ? SANS : SANS, qy = -r.h * 0.2;
  N.q.forEach((L, k) => text(ctx, L, 0, qy + (k - (N.q.length - 1) / 2) * 40, { size: N.en ? 33 : 34, weight: 800, color: '#3A2F20', fam }));
  const ay = r.h * 0.2, aw = measure(ctx, N.a, 32, 800, SANS);
  text(ctx, N.a, 0, ay, { size: 32, weight: 800, color: '#C0392B', fam: SANS });
  if (cross > 0 && N.fix) { ctx.strokeStyle = '#C0392B'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-aw / 2 - 6, ay); ctx.lineTo(-aw / 2 - 6 + (aw + 12) * cross, ay); ctx.stroke(); }
  if (N.fix && t > 65.5 + i * 0.2) text(ctx, N.fix, 0, ay + 46, { size: 34, weight: 900, color: '#1E8E5A', fam: SANS, alpha: sat(t, 65.5 + i * 0.2, 65.7 + i * 0.2) });
  ctx.restore();
}
export function sD4(ctx, t) {
  cam(ctx, t, { z: 1.02 + 0.06 * sat(t, 62.6, 66.8), cx: 960, cy: 500, x: Math.sin(sat(t, 63.17, 63.3) * Math.PI) * 5 + Math.sin(sat(t, 64.14, 64.27) * Math.PI) * 5, seed: 64 }, () => {
    backdrop(ctx, 'bg11_rain_night', { z: 1.08, fx: 0.5, fy: 0.5 });
    const W0 = chatWindow(ctx, 'modern', 960, 500, 1080, { crack: 1, crackAt: CRACKALL, dim: 0.25 * sat(t, 63, 66), disclaimer: 1, disclaimerGlow: Math.sin(sat(t, 65.2, 66.6) * Math.PI) }, R => {
      her(ctx, two(t, 'g22', 'g56', 64.8), R.x + R.w / 2, R.floor, 470, { sy: 1 - 0.04 * hop(t, 64.8) });
    });
    MISTAKES.forEach((N, i) => mistake(ctx, N, t, i));
    const cw = sat(t, 65.2, 66.5);
    if (cw > 0 && W0) { ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.55 * cw); ctx.lineWidth = 1.6; const ox = W0.x + W0.w - 14, oy = W0.y + W0.h * 0.08; for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i / 5 * Math.PI / 2; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + Math.cos(a) * 150 * cw, oy + Math.sin(a) * 150 * cw); ctx.stroke(); } for (let r = 1; r <= 4; r++) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 2 + i / 5 * Math.PI / 2, rr = r * 34 * cw; i ? ctx.lineTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr) : ctx.moveTo(ox + Math.cos(a) * rr, oy + Math.sin(a) * rr); } ctx.stroke(); } ctx.restore(); }
    for (let i = 0; i < 50; i++) { const q = ((t * (1.2 + rnd(i, 111)) + rnd(i, 112)) % 1); ctx.strokeStyle = rgba('#CFE0FF', 0.25); ctx.lineWidth = 2; ctx.beginPath(); const x = rnd(i, 113) * W; ctx.moveTo(x, q * H - 40); ctx.lineTo(x - 8, q * H + 20); ctx.stroke(); }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D5 66.8–69.94  我在窗口里 等你的下一句
// The room, empty. Day, night, day, night go by in the window; on the laptop she lies on the input box waiting, and
// "typing…" comes and goes. Nobody sits down. Bored, she rolls onto her back.
const ROOM = { z: 1.06, fx: 0.4, fy: 0.5 };
export function sD5(ctx, t) {
  const u = sat(t, 66.8, 69.94), day = 0.5 - 0.5 * Math.cos(u * TAU * 2), o = { ...ROOM, z: 1.06 + 0.06 * u };
  const ty = Math.max(sat(t, 67.5, 67.7) * (1 - sat(t, 68.45, 68.6)), sat(t, 68.95, 69.1) * (1 - sat(t, 69.45, 69.6)));
  backdrop(ctx, 'bg05b_room_empty', o);
  backdrop(ctx, 'bg05c_room_empty_day', { ...o, alpha: day });
  onLaptop(ctx, 'bg05b_room_empty', o, (ctx, sw, sh) => {
    ctx.fillStyle = '#212121'; ctx.fillRect(0, 0, sw, sh);
    typingDots(ctx, sw - 20, 40, t, 'u', ty, 18);
    const id = two(t, 'g23', 'g57', 68.6);
    her(ctx, id, sw * 0.45, sh - 46, id === 'g23' ? sh * 0.42 : sh * 0.4, { shadow: false });
    rrect(ctx, 20, sh - 40, sw - 40, 28, 14); ctx.fillStyle = '#303030'; ctx.fill();
    text(ctx, '询问 ChatGPT', 40, sh - 26, { size: 13, weight: 500, align: 'left', color: '#9B9B9B', fam: SANS });
    text(ctx, `第 ${Math.floor(u * 6) + 1} 天`, sw - 18, sh - 58, { size: 14, weight: 700, align: 'right', color: '#9B9B9B', fam: SANS });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ D6 69.94–72.96  第一次 不知道怎么回答
// Right up close to the page. Someone finally asks — 你还能做什么？ — the question from the first verse. Her answer:
// "……", then "thinking" that never ends; a finger taps 重新生成, and again.
export function sD6(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.04 * sat(t, 69.94, 72.96), cx: 1000, cy: 540, seed: 66 }, () => {
    ctx.fillStyle = '#212121'; ctx.fillRect(0, 0, W, H);
    msgUser(ctx, 1840, 150, '你还能做什么？', pop(t, 70.05, 0.3), 64);
    her(ctx, 'g24', 330, 1000, 640, {});
    msgHer(ctx, 700, 360, '……', pop(t, 70.75, 0.4), 130);
    const th = sat(t, 71.35, 71.6), spin = t * (t > 72.1 ? 14 : 7);
    if (th > 0) { ctx.save(); ctx.globalAlpha = th; text(ctx, '正在思考', 790, 540, { size: 60, weight: 600, align: 'left', color: '#B4B4B4', fam: SANS }); ctx.strokeStyle = '#B4B4B4'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(740, 540, 30, spin, spin + 4.2); ctx.stroke(); ctx.restore(); }
    ctx.save(); ctx.translate(700, 720); ctx.scale(2.2, 2.2); regenBtn(ctx, 0, 0, sat(t, 71.9, 72.1), spin); ctx.restore();
    const taps = [72.15, 72.55], k = taps.reduce((m, a) => Math.max(m, sat(t, a - 0.15, a) * (1 - sat(t, a, a + 0.18))), 0), fin = E.out(sat(t, 71.95, 72.15));
    if (fin > 0) prop(ctx, 'prop_finger', lerp(1500, 1000, fin) - 30 * k, lerp(1150, 900, fin) - 40 * k, 360, {});
    taps.forEach(a => { const q = sat(t, a, a + 0.35); if (q > 0 && q < 1) { ctx.strokeStyle = rgba('#FFFFFF', 1 - q); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(780, 720, 30 + 90 * q, 0, TAU); ctx.stroke(); } });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ E1 72.96–76.52  是不是 只会回答的我 / 就该 停在这里
// The empty room at night. On the laptop she sits hugging her knees. The screen goes off like an old television —
// a line, a dot — and then the lamp goes out too.
export function sE1(ctx, t) {
  const push = E.io(sat(t, 72.96, 75.3)), o = { ...ROOM, z: 1.06 + 0.32 * push, fx: lerp(0.4, 0.33, push), fy: lerp(0.5, 0.56, push) };
  const off = E.in(sat(t, 75.3, 75.9)), lamp = E.io(sat(t, 75.95, 76.45));
  backdrop(ctx, 'bg05b_room_empty', { ...o, filter: `brightness(${1 - 0.25 * sat(t, 73, 75)})` });
  onLaptop(ctx, 'bg05b_room_empty', o, (ctx, sw, sh) => {
    ctx.fillStyle = '#000000'; ctx.fillRect(0, 0, sw, sh);
    if (off < 1) {
      ctx.save(); ctx.translate(sw / 2, sh / 2); ctx.scale(1 - 0.96 * sat(off, 0.6, 1), Math.max(0.006, 1 - off)); ctx.translate(-sw / 2, -sh / 2);
      ctx.fillStyle = '#212121'; ctx.fillRect(0, 0, sw, sh); ctx.filter = `grayscale(${0.5 * sat(t, 73, 75)})`;
      her(ctx, 'g25', sw / 2, sh - 30, sh * 0.6, { shadow: false, sway: 0.4 }); ctx.restore();
    }
    if (off >= 0.98) { const dot = 1 - sat(t, 75.9, 76.3); ctx.save(); ctx.globalAlpha = dot; ctx.fillStyle = '#E8E6F4'; ctx.shadowColor = '#E8E6F4'; ctx.shadowBlur = 12; ctx.beginPath(); ctx.arc(sw / 2, sh / 2, 4, 0, TAU); ctx.fill(); ctx.restore(); }
  }, { filter: `brightness(${1 - 0.25 * sat(t, 73, 75)})` });
  ctx.fillStyle = rgba('#03040C', 0.94 * lamp); ctx.fillRect(0, 0, W, H);
  finish(ctx, { dark: true });
}
