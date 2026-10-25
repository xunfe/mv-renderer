// Chorus 1 (分镜.md C1–C8) and the trailer's ending (T1, T2, the title card). Times are on the full cut until the
// first chorus ends (61.97 s); the ending is on the trailer's clock (the song's outro moved 112.11 s earlier).
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, rgba, font, SANS, drawGlyph, beatPhase } from './lib.js';
import { char, breathe, walkBob, anchorPt, bop } from './chars.js';
import { backdrop, bdMap, prop, bubbles, splash, ripples, glowWord, thinkBox, warpQuad, img } from './common.js';

export const POS = {                      // measured on the paintings (image px, tools/bggrid.py)
  sofa: [760, 712],                        // bg12: the seat of the chaise, where she lies (seat height)
  ticker: [[186, 8], [590, 322], [586, 598], [156, 412]],               // bg14: the big market screen, TL TR BR BL
  windows: { x0: 50, x1: 1490, y0: 139, y1: 1027, cols: 6, rows: 4 },  // bg15: the grid of windows (outer edges)
  lock: [1064, 712],                       // bg16: the padlock (tools/bggrid.py)
};

// C1 38.38–41.0  我只是翻了个身: split screen. Left, she turns over in her nap; right, at the same moment, a whale breaches
function whaleAt(t) {                                                   // the leap: up out of the storm sea, over, and down
  const p = sat(t, 39.02, 42.25);
  const x = lerp(1380, 900, p), y = 1250 - Math.sin(Math.min(1, p) * Math.PI) * 820 + (p >= 1 ? 0 : 0);
  return { x, y, rot: lerp(-0.7, 0.9, p), on: t >= 39.0 };
}
export function sC1(ctx, t) {
  const split = (y) => lerp(1010, 900, y / H);
  const wash = E.io(sat(t, 40.45, 40.95));                                // the wave washes the split line away
  // right: the storm sea and the whale
  ctx.save();
  backdrop(ctx, 'bg13r_storm_red', { z: 1.15, fx: 0.55, fy: 0.55 });         // before it turns over: mostly red (up, in China)
  const w = whaleAt(t);
  if (w.on) prop(ctx, 'prop_whale', w.x, w.y, 900, { rot: w.rot });
  splash(ctx, t, 39.02, 1380, 900, { n: 60, scale: 1.4 });
  ctx.restore();
  // left: her room, clipped to the left of a slanted split that slides off to the left
  ctx.save();
  const off = wash * -1300;
  ctx.beginPath(); ctx.moveTo(-50, -50); ctx.lineTo(split(0) + off, -50); ctx.lineTo(split(H) + off, H + 50); ctx.lineTo(-50, H + 50); ctx.closePath(); ctx.clip();
  const o = { z: 1.6, fx: 0.64, fy: 0.64 };                              // close on the chaise, inside the left half
  backdrop(ctx, 'bg12_room', o);
  const M = bdMap('bg12_room', o), [sx, sy] = M.pt(...POS.sofa);
  const id = t < 39.02 ? 'd16a' : t < 39.4 ? 'd16b' : 'd16a';
  char(ctx, id, sx, sy, 275 * M.s, { shadow: false, flip: t >= 39.4, ...breathe(t, 0.6) });
  ctx.restore();
  // the split line
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 10; ctx.shadowColor = 'rgba(120,200,255,0.9)'; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.moveTo(split(0) + off, -50); ctx.lineTo(split(H) + off, H + 50); ctx.stroke(); ctx.restore();
  if (wash > 0) {                                                          // white foam riding the line
    ctx.save(); ctx.fillStyle = 'rgba(240,250,255,0.9)';
    for (let k = 0; k < 40; k++) { const y = k / 40 * H, x = split(y) + off + 40 + Math.sin(k * 1.7 + t * 9) * 30; ctx.beginPath(); ctx.arc(x, y, 40 + rnd(k, 3) * 40, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
}

// C2 41.0–44.2  整片海都翻了天: the whale crashes down and the whole sea turns over (the camera rolls 180 degrees);
// under the splash the red sea becomes a green one (本人 10-17: red before, green after, as China reads the colours)
export function sC2(ctx, t) {
  const roll = E.io(sat(t, 41.3, 43.65)) * Math.PI;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(roll); ctx.scale(1.25, 1.25); ctx.translate(-W / 2, -H / 2);
  const swap = E.io(sat(t, 42.2, 42.75));                                    // turned over: mostly green (down, in China)
  backdrop(ctx, 'bg13r_storm_red', { z: 1.25, fx: 0.55, fy: 0.55 });
  if (swap > 0) backdrop(ctx, 'bg13g_storm_green', { z: 1.25, fx: 0.55, fy: 0.55, alpha: swap });
  const w = whaleAt(t);
  if (t < 42.25) prop(ctx, 'prop_whale', w.x, w.y, 900, { rot: w.rot });
  splash(ctx, t, 42.23, 900, 960, { n: 110, scale: 2.2, life: 1.6 });
  ctx.restore();
  ctx.fillStyle = rgba('#FFFFFF', 0.55 * Math.exp(-8 * Math.max(0, t - 42.23)) * (t >= 42.23 ? 1 : 0)); ctx.fillRect(0, 0, W, H);
}

// C3 44.2–47.3  浪一路拍到了华尔街: the wave reaches Wall Street; on the big screen NVDA falls 17%
export function tickerScreen(x, sw, sh, t) {
  x.fillStyle = '#061018'; x.fillRect(0, 0, sw, sh);
  const p = E.out(sat(t, 44.6, 46.2));
  x.textBaseline = 'middle'; x.textAlign = 'left';
  x.fillStyle = '#E8F0FF'; x.font = font(sh * 0.2, 900, SANS); x.fillText('NVDA', sw * 0.06, sh * 0.2);
  x.fillStyle = '#FF4D5E'; x.font = font(sh * 0.2, 900, SANS); x.fillText(lerp(142.62, 118.58, p).toFixed(2), sw * 0.06, sh * 0.5);
  x.font = font(sh * 0.16, 900, SANS); x.fillText(`▼ ${(16.97 * p).toFixed(2)}%`, sw * 0.06, sh * 0.78);
  x.strokeStyle = '#FF4D5E'; x.lineWidth = sh * 0.025; x.beginPath();                         // the chart line dropping
  for (let i = 0; i <= 40; i++) { const u = i / 40, v = u < 0.45 ? 0.25 + Math.sin(u * 30) * 0.03 : 0.25 + E.in(sat(u, 0.45, 1)) * 0.6 * p + Math.sin(u * 40) * 0.02;
    const px = sw * (0.55 + u * 0.4), py = sh * (0.12 + v * 0.8); i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
}
export function sC3(ctx, t) {
  const crash = t >= 45.14 ? Math.exp(-6 * (t - 45.14)) : 0, crash2 = t >= 46.15 ? Math.exp(-6 * (t - 46.15)) : 0;
  ctx.save(); ctx.translate(noise(t * 40, 1) * 22 * (crash + crash2), noise(t * 40, 2) * 22 * (crash + crash2));
  const o = { z: 1.1, fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg14_wallstreet', o);
  const M = bdMap('bg14_wallstreet', o);
  warpQuad(ctx, POS.ticker.map(p => M.pt(...p)), 640, 400, (x, sw, sh) => tickerScreen(x, sw, sh, t));
  // a green chip icon tumbling off the screen
  if (t > 44.8) { const [qx, qy] = M.pt(...POS.ticker[2]); const d = t - 44.8;
    ctx.save(); ctx.translate(qx - 60, qy + d * d * 900); ctx.rotate(d * 3); ctx.fillStyle = '#5BD38A'; ctx.strokeStyle = '#123A24'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(-46, -46, 92, 92, 10); ctx.fill(); ctx.stroke();
    for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(k * 16, -46); ctx.lineTo(k * 16, -64); ctx.moveTo(k * 16, 46); ctx.lineTo(k * 16, 64); ctx.stroke(); }
    ctx.restore(); }
  // two traders run for it ahead of the wave; it catches them
  if (t < 46.0) {
    const run = sat(t, 44.2, 45.14), swept = E.in(sat(t, 45.05, 45.9));
    const tx = lerp(250, 900, run) + swept * 900, ty = 860 - Math.abs(Math.sin(t * 14)) * 18 * (1 - swept) - swept * 300;
    prop(ctx, 'prop_traders', tx, ty, 520, { rot: swept * 2.2, alpha: 1 - sat(t, 45.5, 46.0) });
  }
  // the wave
  const wx = lerp(-1600, 760, E.in(sat(t, 44.33, 45.14))) + (t > 45.14 ? (t - 45.14) * 260 : 0);
  prop(ctx, 'prop_wave', wx, 640 + (t > 45.14 ? (t - 45.14) * 120 : 0), 2400);
  if (t > 45.14) {                                                       // the street floods; papers swirl
    const lvl = E.out(sat(t, 45.14, 46.6)) * 230 + Math.sin(t * 3) * 8;
    ctx.save(); const wg = ctx.createLinearGradient(0, H - lvl, 0, H); wg.addColorStop(0, 'rgba(90,210,220,0.85)'); wg.addColorStop(1, 'rgba(20,110,150,0.92)');
    ctx.fillStyle = wg; ctx.beginPath(); ctx.moveTo(0, H - lvl); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - lvl + Math.sin(x / 90 + t * 5) * 10); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 6; ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H - lvl + Math.sin(x / 90 + t * 5) * 10); ctx.stroke(); ctx.restore();
    for (let k = 0; k < 14; k++) { const d = t - 45.14, px = (rnd(k, 31) * W + d * (120 + 80 * rnd(k, 32))) % (W + 100), py = 200 + rnd(k, 33) * 500 + Math.sin(d * 3 + k) * 40 + d * 40;
      ctx.save(); ctx.translate(px, py); ctx.rotate(d * (2 + k % 3) + k); ctx.fillStyle = '#F7F4EA'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.fillRect(-26, -34, 52, 68); ctx.strokeRect(-26, -34, 52, 68);
      ctx.strokeStyle = '#BBB'; for (let l = 0; l < 4; l++) { ctx.beginPath(); ctx.moveTo(-18, -22 + l * 14); ctx.lineTo(18, -22 + l * 14); ctx.stroke(); } ctx.restore(); }
  }
  splash(ctx, t, 45.14, 1100, 760, { n: 110, scale: 2.0, life: 1.4 });
  splash(ctx, t, 46.15, 1400, 820, { n: 80, scale: 1.6, life: 1.2, seed: 9 });
  ctx.restore();
}

// C4 47.3–51.0  把全世界 都叫醒一遍 (本人 10-18: the globe with clocks on it read oddly). 把全世界: the Earth itself is an
// old twin-bell alarm clock, asleep in space (little Zzz drifting off it); the old satellite circles it. On 世 it starts to
// ring, on 界 it rings for all it is worth: it shakes, its bells blur, rings of sound spread out, the Zzz pop, 叮铃铃!
// 都叫醒一遍: a bedroom at dawn; on 叫 someone bolts up in bed with the phone, the alarm clock on the nightstand going off;
// the App Store free chart slides in: on 遍 DeepSeek goes to No. 1 over ChatGPT (US App Store, 2025-01-27; 调研 §3).
// The two app icons are the official ones (ref/: chatgpt.com's app manifest, DeepSeek's App Store page).
function icon(ctx, id, x, y, s) {                                       // an app icon with the iOS rounded-square mask
  const im = img(id); ctx.save(); ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.225); ctx.clip();
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x - s / 2, y - s / 2, s, s);
  if (im) { const k = id === 'icon_deepseek' ? 1.1 : 1; ctx.drawImage(im, x - s * k / 2, y - s * k / 2, s * k, s * k); }
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.roundRect(x - s / 2, y - s / 2, s, s, s * 0.225); ctx.stroke(); ctx.restore();
}
export function appChart(ctx, t, x, y, a) {
  const swap = E.io(sat(t, 50.31, 50.6));                                 // ChatGPT was No. 1; on 遍 they change places
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 40; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(0, 0, 560, 420, 40); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#111111'; ctx.font = font(40, 800, SANS); ctx.textBaseline = 'middle'; ctx.fillText('免费 App 排行', 40, 62);
  ctx.fillStyle = '#8A8A8E'; ctx.font = font(26, 600, SANS); ctx.fillText('App Store（美国）· 2025.01.27', 40, 108);
  const row = (rank, name, id, yy) => {
    ctx.fillStyle = '#111'; ctx.font = font(44, 800, SANS); ctx.fillText(String(rank), 40, yy);
    icon(ctx, id, 140, yy, 92);
    ctx.fillStyle = '#111'; ctx.font = font(36, 700, SANS); ctx.fillText(name, 210, yy - 16);
    ctx.fillStyle = '#8A8A8E'; ctx.font = font(24, 500, SANS); ctx.fillText('AI 助手', 210, yy + 22);
    ctx.fillStyle = '#EEF0F5'; ctx.beginPath(); ctx.roundRect(430, yy - 26, 96, 52, 26); ctx.fill(); ctx.fillStyle = '#2A6BF2'; ctx.font = font(28, 800, SANS); ctx.fillText('获取', 450, yy + 1);
  };
  const y1 = 200, y2 = 330;
  row(1 + Math.round(1 - swap), 'DeepSeek', 'icon_deepseek', lerp(y2, y1, swap));
  row(1 + Math.round(swap), 'ChatGPT', 'icon_chatgpt', lerp(y1, y2, swap));
  if (swap > 0 && swap < 1) { ctx.fillStyle = '#2BB673'; ctx.font = font(40, 900, SANS); ctx.fillText('▲', 500, lerp(y2, y1, swap) - 50); }
  ctx.restore();
}
const BED = { clock: [384, 508], seat: [610, 640] };                     // bg20 (image px): nightstand top right corner; the mattress
export function sC4(ctx, t) {
  if (t < 49.19) {
    backdrop(ctx, 'bg18_two_peaks', { z: 1.7, fx: 0.5, fy: 0.12 });       // just the starry sky
    const ring = sat(t, 47.89, 48.14), loud = t >= 48.14 ? 1 : ring * 0.5;
    const cx = W / 2, cy = 520, sz = lerp(640, 760, E.out(sat(t, 47.3, 48.2)));
    const orb = (t - 47.3) * 2.2, ox = cx + Math.cos(orb) * 520, oy = cy + Math.sin(orb) * 170 - 40, front = Math.sin(orb) > 0;
    const sat2 = () => prop(ctx, 'prop_sputnik', ox, oy, front ? 220 : 160, { rot: -0.3 + Math.cos(orb) * 0.3, alpha: front ? 1 : 0.7 });
    if (!front) sat2();
    if (loud > 0) {                                                       // rings of sound
      ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.8)'; ctx.lineCap = 'round';
      for (let k = 0; k < 4; k++) { const ph = ((t - 47.89) * 2.4 + k / 4) % 1; ctx.globalAlpha = loud * (1 - ph); ctx.lineWidth = 10 * (1 - ph) + 2;
        ctx.beginPath(); ctx.arc(cx, cy, sz * 0.5 + ph * 520, 0, TAU); ctx.stroke(); }
      ctx.restore();
    }
    const shake = loud * Math.sin(t * 95) * 0.06, jump = loud * Math.abs(Math.sin(t * 47)) * 14;
    prop(ctx, 'prop_earth_alarm', cx + loud * Math.sin(t * 71) * 8, cy - jump, sz, { rot: shake });
    if (front) sat2();
    for (let k = 0; k < 3; k++) {                                         // Zzz while it sleeps; they pop when it rings
      const t0 = 47.3 + k * 0.28, d = t - t0; if (d < 0) continue;
      const popd = t - 48.14; if (popd > 0.3) continue;
      const a = popd > 0 ? 1 - popd / 0.3 : sat(d, 0, 0.2), s = popd > 0 ? 1 + popd * 3 : 1;
      glowWord(ctx, 'Z', cx + 260 + k * 70 + d * 40, cy - 300 - k * 70 - d * 60, (50 + k * 16) * s, { alpha: a, color: '#E8F0FF', glow: 'rgba(150,190,255,0.8)' });
    }
    if (t >= 48.14) { const p = E.back(sat(t, 48.14, 48.3)), a = 1 - sat(t, 48.9, 49.19);
      ctx.save(); ctx.translate(cx - 470, cy - 300); ctx.rotate(-0.15); ctx.scale(p, p); glowWord(ctx, '叮铃铃！', 0, 0, 110, { alpha: a, color: '#FFE36B', stroke: '#5A2600', glow: 'rgba(255,190,80,0.9)' }); ctx.restore(); }
    [47.6, 48.5].forEach(b => { if (t < b || t > b + 0.4) return; const a = 1 - sat(t, b + 0.15, b + 0.4);
      glowWord(ctx, '嘀', ox + 100, oy - 80, 54 * E.back(sat(t, b, b + 0.12)), { alpha: a, color: '#FFFFFF', glow: 'rgba(160,220,255,0.9)' }); });
    return;
  }
  const o = { z: 1.08, fx: 0.48, fy: 0.5 };
  backdrop(ctx, 'bg20_bedroom_dawn', o);
  const M = bdMap('bg20_bedroom_dawn', o), [nx, ny] = M.pt(...BED.clock), [bx, by] = M.pt(...BED.seat);
  const ringing = t >= 49.19, cw = 88 * M.s, cim = img('prop_alarm'), chh = cim ? cw * cim.height / cim.width : cw;
  prop(ctx, 'prop_alarm', nx, ny - chh / 2 - (ringing ? Math.abs(Math.sin(t * 34)) * 8 : 0), cw, { rot: ringing ? Math.sin(t * 70) * 0.16 : 0 });   // standing on the nightstand
  if (ringing) { ctx.save(); ctx.strokeStyle = 'rgba(255,240,180,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (const sd of [-1, 1]) for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.arc(nx, ny - chh * 0.7, cw * (0.75 + k * 0.3), sd > 0 ? -0.9 : Math.PI - 0.3, sd > 0 ? -0.3 : Math.PI + 0.3); ctx.stroke(); }
    ctx.restore(); }
  const up = E.back(sat(t, 49.36, 49.62)), wim = img('prop_waker'), ww = 420 * M.s, wh = wim ? ww * wim.height / wim.width : ww;
  ctx.save(); ctx.translate(bx, by); ctx.scale(1, lerp(0.4, 1, up)); prop(ctx, 'prop_waker', 0, -wh / 2, ww); ctx.restore();      // sitting on the mattress, bolting up
  if (up > 0.5) { const [gx, gy] = [bx - ww * 0.05, by - wh * 0.62]; ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 240);
    g.addColorStop(0, 'rgba(200,230,255,0.55)'); g.addColorStop(1, 'rgba(200,230,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  const ca = E.out(sat(t, 49.85, 50.1));
  appChart(ctx, t, lerp(W + 40, 1300, ca), 210, ca);
}

// C5 51.0–53.9  别人把灯藏在山顶. Two peaks at night: on the left 姐姐 (ChatGPT) holds her lantern close, on the right
// 橙子 (Claude) has hers locked, the key in her hand (a little tag: 闭源). On 灯 the lanterns blaze; on 藏 姐姐 hugs hers
// tighter and turns away, 橙子's lock clicks, and the light shrinks to a glow. Down in the dark sea far below, a small blue
// someone looks up at them: 大肥鱼 (the map comes next).
const PEAKS = { L: [290, 606], R: [1235, 606] };                         // bg18: the flat tops (image px, tools/bggrid.py)
export function sC5(ctx, t) {
  const tilt = E.io(sat(t, 52.6, 53.9));
  const o = { z: lerp(1.06, 1.1, sat(t, 51.0, 53.9)), fx: 0.5, fy: lerp(0.44, 0.5, tilt) };
  backdrop(ctx, 'bg18_two_peaks', o);
  const M = bdMap('bg18_two_peaks', o), [lx, ly] = M.pt(...PEAKS.L), [rx, ry] = M.pt(...PEAKS.R);
  const blaze = t < 52.06 ? 0.6 + 0.4 * Math.exp(-4 * Math.max(0, t - 51.9)) * (t > 51.9 ? 1 : 0) + 0.4 * (t > 51.9 ? 1 : 0) : lerp(1, 0.22, E.out(sat(t, 52.06, 52.4)));
  const turn = E.out(sat(t, 52.06, 52.3));
  const gsz = 450 * M.s, osz = 440 * M.s;
  const gm = { flip: true, shadow: false, rot: -0.06 * turn, sx: 1 - 0.05 * turn };
  const [gx, gy] = anchorPt('g90', lx, ly + 6, gsz, 644, 700, gm), [ox, oy] = anchorPt('o90', rx, ry + 6, osz, 264, 840);
  for (const [x, y, c] of [[gx, gy, '#D9CCFF'], [ox, oy, '#FFB15A']]) {     // the light of the two lanterns
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const R = 520 * blaze, g = ctx.createRadialGradient(x, y, 0, x, y, R); g.addColorStop(0, rgba(c, 0.9 * blaze)); g.addColorStop(0.25, rgba(c, 0.45 * blaze)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
    if (blaze > 0.5) { ctx.translate(x, y); for (let k = 0; k < 10; k++) { ctx.rotate(TAU / 10); const L = 700 * (blaze - 0.4);
      const lg = ctx.createLinearGradient(0, 0, L, 0); lg.addColorStop(0, rgba(c, 0.3 * (blaze - 0.4))); lg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(L, -40); ctx.lineTo(L, 40); ctx.lineTo(0, 6); ctx.fill(); } }
    ctx.restore();
  }
  char(ctx, 'g90', lx, ly + 6, gsz, gm);
  char(ctx, 'o90', rx, ry + 6, osz, { shadow: false, sy: 1 - 0.03 * Math.exp(-10 * Math.max(0, t - 52.06)) * (t > 52.06 ? 1 : 0) });
  // the tag on 橙子's lock, and the click
  const [kx, ky] = anchorPt('o90', rx, ry + 6, osz, 324, 840);
  ctx.save(); ctx.translate(kx + 10, ky + 40); ctx.rotate(Math.sin(t * 3) * 0.12);
  ctx.strokeStyle = '#5A3A1A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-10, -30); ctx.lineTo(0, 0); ctx.stroke();
  ctx.fillStyle = '#FFF4DE'; ctx.strokeStyle = '#5A3A1A'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-52, 0, 104, 52, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#B4262B'; ctx.font = font(34, 900, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('闭源', 0, 27); ctx.restore();
  if (t > 52.06 && t < 52.6) { const p = E.back(sat(t, 52.06, 52.2)), a = 1 - sat(t, 52.35, 52.6);
    ctx.save(); ctx.translate(kx + 120, ky - 60); ctx.rotate(0.15); ctx.scale(p, p); glowWord(ctx, '咔哒', 0, 0, 60, { alpha: a, color: '#FFE36B', stroke: '#5A2600', glow: 'rgba(255,180,80,0.9)' }); ctx.restore(); }
  // far below in the dark sea, she looks up
  if (t > 52.7) { const q = E.out(sat(t, 52.7, 53.3)), sx = 760, sy = 1010;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(sx - 300, sy - 60, 0, sx - 300, sy - 60, 160); g.addColorStop(0, rgba('#7FD0FF', 0.6 * q)); g.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 500, sy - 260, 400, 400); ctx.restore();
    const pop = (t0) => (t > t0 ? Math.sin(sat(t, t0, t0 + 0.22) * Math.PI) : 0), lift = 14 * (pop(53.18) + pop(53.72));
    const px = sx - 300, py = sy + 120 + (1 - q) * 220 - lift;
    char(ctx, 'd91', px, py, 520, { shadow: false });      // (本人 10-22: bigger)
    // 本人 10-23: the ears flick up: two little bursts of motion lines off each ear tip (d91 image px), as she arrives and again
    for (const t0 of [53.18, 53.72]) {
      const d = t - t0; if (d < 0 || d > 0.5) continue;
      const grow = E.out(sat(d, 0, 0.16)), fade = 1 - sat(d, 0.28, 0.5);
      for (const [ix, iy, ang] of [[62, 268, -2.95], [958, 405, -0.62]]) {
        const [ex, ey] = anchorPt('d91', px, py, 520, ix, iy);
        ctx.save(); ctx.translate(ex, ey); ctx.rotate(ang); ctx.strokeStyle = rgba('#EAF6FF', 0.95 * fade); ctx.lineWidth = 7; ctx.lineCap = 'round';      // light: it is night behind her
        const seg = (off, len) => { ctx.beginPath(); ctx.moveTo(18, off * 0.7); ctx.lineTo(18 + len * grow, off * (0.7 + 0.5 * grow)); ctx.stroke(); };
        const lines = [[-24, 38], [0, 54], [24, 38]];
        ctx.strokeStyle = rgba('#1B2140', 0.9 * fade); ctx.lineWidth = 12; lines.forEach(([o, l]) => seg(o, l));      // a dark edge: reads on the white dress and the night sky alike
        ctx.strokeStyle = rgba('#EAF6FF', fade); ctx.lineWidth = 6; lines.forEach(([o, l]) => seg(o, l));
        ctx.restore();
      }
    } }
}

export { sC6, sC7, sC8 } from './scenesOpen.js';
import { sC8 } from './scenesOpen.js';

// T1 61.97–62.32: the last frame holds and goes white
export function sT1(ctx, t) { sC8(ctx, 61.96); ctx.fillStyle = rgba('#FFFFFF', 0.92 * E.in(sat(t, 61.97, 62.3))); ctx.fillRect(0, 0, W, H); }

// 点赞 收藏 关注: a button popping in on one of the band's hits (both versions' endings, scenesG.js sI3)
export function cta(ctx, t, t0, x, y, kind, label) {
  if (t < t0) return;
  const p = E.back(sat(t, t0, t0 + 0.22)), glow = Math.exp(-5 * (t - t0));
  ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
  ctx.shadowColor = `rgba(255,120,170,${0.4 + 0.5 * glow})`; ctx.shadowBlur = 30;
  ctx.fillStyle = '#FB7299'; ctx.beginPath(); ctx.arc(0, 0, 70, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#FFFFFF'; ctx.fillStyle = '#FFFFFF'; ctx.lineWidth = 9; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (kind === 'like') {                                                  // a thumb up
    ctx.beginPath(); ctx.roundRect(-40, -6, 18, 44, 4); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-14, -6); ctx.lineTo(4, -36); ctx.quadraticCurveTo(12, -48, 18, -36); ctx.lineTo(12, -12); ctx.lineTo(36, -12);
    ctx.quadraticCurveTo(46, -10, 42, 2); ctx.lineTo(34, 32); ctx.quadraticCurveTo(30, 40, 20, 40); ctx.lineTo(-14, 40); ctx.closePath(); ctx.fill();
  } else if (kind === 'fav') {                                            // a star
    ctx.beginPath(); for (let k = 0; k < 10; k++) { const r = k % 2 ? 19 : 42, an = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r + 3); } ctx.closePath(); ctx.fill();
  } else {                                                                // a plus
    ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke();
  }
  glowWord(ctx, label, 0, 118, 46, { color: '#FFFFFF', stroke: '#0B1E4D', glow: 'rgba(255,140,180,0.7)' });
  ctx.restore();
  if (t < t0 + 0.5) for (let k = 0; k < 10; k++) {                       // a little burst
    const an = k / 10 * TAU, d = (t - t0) * 420, a = 1 - sat(t, t0 + 0.2, t0 + 0.5);
    ctx.fillStyle = rgba('#FFD3E2', a); ctx.beginPath(); ctx.arc(x + Math.cos(an) * (90 + d * 0.5), y + Math.sin(an) * (90 + d * 0.5), 6, 0, TAU); ctx.fill();
  }
}
