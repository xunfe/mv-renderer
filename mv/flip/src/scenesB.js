// Pre-chorus 1 (分镜.md B1–B4): a million words for one yuan, poured like tea; laughed at as 拼多多; forged on the
// anvil by the man in the blue suit; waiting for the new year. Times are on the full cut.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, rgba, font, SANS, drawGlyph } from './lib.js';
import { char, breathe, anchorPt } from './chars.js';
import { backdrop, bdMap, prop, bubbles, splash, glowWord, balloon, img, fmt } from './common.js';
import { receipt, DESK } from './scenesA.js';

export const POS = {                      // measured on the paintings and sprites (image px); see tools/measure notes in README
  spout: [720, 730],                      // d11: the teapot's spout (keyed sprite px, tools/grid.py)
  brow: [290, 400],                       // d12: where her pinching fingers hold the sticker
  basin: [434, 40],                       // d13: the top of the basin on her head
  anvil: [660, 495],                      // bg10: top middle of the anvil (tools/bggrid.py)
  smith: [990, 752],                      // bg10: where the man stands, right of the anvil (he faces left)
  hammer: [940, 300],                     // m14: the hammer head, held up behind him
  nail: [1088, 264],                      // bg11: the nail the calendar hangs on (tools/bggrid.py)
};
export const WORDS = '的一是了我不人在他有这个上们来到时大地为子中你说生国年着就那和要她出也得里后自以会家可下而过天去能对小多然于心学么之都好看起发当没成只如事把还用第样道想作种开美总从无情己面最女但现前些所同日手又行意动方期它头经长儿回位分爱老因很给名法间斯知世什两次使身者被高已亲其进此话常与活正感';

// B1 25.7–28.6  一块钱 一百万个字: a ¥1 coin drops; she pours a stream of glowing words from her teapot
export function sB1(ctx, t) {
  const o = { z: lerp(1.3, 1.36, sat(t, 25.7, 28.6)), fx: 0.52, fy: 0.55 };
  backdrop(ctx, 'bg08_seabed_study', o);
  const M = bdMap('bg08_seabed_study', o), [dx, dy] = M.pt(DESK[0], DESK[1]);
  bubbles(ctx, t, { n: 12, maxR: 7, alpha: 0.35 });
  receipt(ctx, ...M.pt(...DESK.note), t, 0);
  const sz = 760, x = 640, fy = 965, [cx0, cy0] = M.pt(...DESK.saucer);       // she stands near the camera; the desk is behind her
  char(ctx, 'd11', x, fy, sz, { shadow: false, ...breathe(t) });
  // the coin
  const cx = cx0, cy = lerp(-120, cy0 - 40, E.in(sat(t, 25.73, 26.15))) - (t > 26.15 ? Math.abs(Math.sin((t - 26.15) * 14)) * 40 * Math.exp(-5 * (t - 26.15)) : 0);
  if (t > 25.73) {
    ctx.save(); ctx.fillStyle = '#F4F6FB'; ctx.strokeStyle = '#2A2B44'; ctx.lineWidth = 4;     // a little saucer
    ctx.beginPath(); ctx.ellipse(cx, cy0, 110, 26, 0, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore();
    prop(ctx, 'prop_coin_yuan', cx, cy, 160, { rot: t < 26.15 ? (t - 25.73) * 12 : 0 });          // ¥1 drawn by Image 2
    if (t > 26.15 && t < 26.6) { const a = 1 - sat(t, 26.15, 26.6); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#FFF1B8'; ctx.lineWidth = 5;
      for (let k = 0; k < 8; k++) { const an = k / 8 * TAU, r = 90 + (t - 26.15) * 300; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r, cy0 - 40 + Math.sin(an) * r * 0.5); ctx.lineTo(cx + Math.cos(an) * (r + 40), cy0 - 40 + Math.sin(an) * (r + 40) * 0.5); ctx.stroke(); } ctx.restore(); }
  }
  // the words pour out of the spout from 一百万个字 and rise to fill the water
  const [sx, sy] = anchorPt('d11', x, fy, sz, ...POS.spout);
  if (t > 27.3) {
    const n = Math.floor(clamp((t - 27.3) * 160, 0, 360));
    for (let i = 0; i < n; i++) {
      const born = 27.3 + i / 160, age = t - born; if (age < 0) continue;
      const fall = Math.min(age, 0.35);
      let px = sx + fall * 380 + (rnd(i, 3) - 0.5) * 30, py = sy + fall * fall * 2600 * 0.5;
      if (age > 0.35) { const k = age - 0.35; px += k * (rnd(i, 4) - 0.3) * 900; py -= k * (300 + rnd(i, 5) * 700); }
      if (py < -60 || px > W + 60) continue;
      drawGlyph(ctx, WORDS[i % WORDS.length], px, py, 26 + rnd(i, 6) * 26, { color: rnd(i, 7) < 0.5 ? '#D9FBFF' : '#FFF3C2', weight: 800, fam: SANS, rot: (rnd(i, 8) - 0.5) * 0.8 });
    }
  }
  if (t > 27.3) {                                                      // the counter
    const v = Math.round(1e6 * E.out(sat(t, 27.35, 28.4)));
    const a = sat(t, 27.3, 27.45);
    ctx.save(); ctx.globalAlpha = a;
    glowWord(ctx, fmt(v) + ' 字', 1180, 120, 80, { color: '#FFFFFF', glow: 'rgba(255,215,110,0.95)' });
    glowWord(ctx, '只要 ¥1', 1180, 210, 46, { color: '#FFE7A0', glow: 'rgba(255,215,110,0.8)' });
    ctx.restore();
  }
}

// B2 28.6–31.6  他们笑我 是拼多多. The boats, all in frame now, laugh and point. She stands calmly in the middle. On 是 a
// huge red promo badge (the kind on a bargain shelf: AI界 / 拼多多, a burst with a thick outline) comes spinning down from
// above the frame, shrinking as it falls, and on 拼 slams onto her forehead: a white flash, the frame jolts, 啪!, speed
// lines; on 多多 it throbs; at the end she peels it off with two fingers and flicks it away, smiling.
export function badge(ctx, x, y, s, rot, pulse = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s * (1 + 0.08 * pulse), s * (1 + 0.08 * pulse));
  const N = 18, R0 = 150, R1 = 118;
  const burst = () => { ctx.beginPath(); for (let k = 0; k < N * 2; k++) { const r = k % 2 ? R1 : R0, an = k / (N * 2) * TAU - Math.PI / 2; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); };
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#7A0E12'; burst(); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#E8262D'; ctx.save(); ctx.scale(0.94, 0.94); burst(); ctx.fill(); ctx.restore();
  ctx.strokeStyle = '#FFE24A'; ctx.lineWidth = 7; ctx.save(); ctx.scale(0.8, 0.8); burst(); ctx.stroke(); ctx.restore();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.font = font(46, 900, SANS); ctx.lineWidth = 10; ctx.strokeStyle = '#7A0E12'; ctx.strokeText('AI界', 0, -38); ctx.fillStyle = '#FFFFFF'; ctx.fillText('AI界', 0, -38);
  ctx.font = font(64, 900, SANS); ctx.lineWidth = 12; ctx.strokeText('拼多多', 0, 26); ctx.fillStyle = '#FFE24A'; ctx.fillText('拼多多', 0, 26);
  ctx.restore();
}
export const BOATS2 = [[330, 330, '哈哈哈'], [180, 470, '便宜货～'], [1300, 340, '哈哈哈哈'], [1340, 540, '拼多多！']];      // bg09b: over the laughing heads (image px)
export function sB2(ctx, t) {
  const slam = t >= 30.82 ? Math.exp(-14 * (t - 30.82)) : 0;
  ctx.save(); ctx.translate(noise(t * 50, 4) * 26 * slam, noise(t * 50, 8) * 26 * slam);
  const o = { z: lerp(1.04, 1.1, sat(t, 28.6, 31.6)), fy: 0.55 }, M = bdMap('bg09b_boats_mid', o);
  backdrop(ctx, 'bg09b_boats_mid', o);
  BOATS2.forEach(([ix, iy, str], i) => { const [x, y] = M.pt(ix, iy); balloon(ctx, t, [29.23, 29.51, 29.87, 30.22][i], x, y - 40 + Math.sin(t * 9 + i) * 5, str, { size: 36, rot: (i % 2 ? 0.05 : -0.05) }); });
  const x = W / 2, fy = 965, sz = 720;
  const hit = t >= 30.82;
  char(ctx, hit ? 'd12' : 'd60', x, fy, sz, { shadow: false, ...breathe(t), sy: 1 - 0.05 * slam, sx: 1 + 0.03 * slam });
  const [bx, by] = anchorPt('d12', x, fy, sz, ...POS.brow);
  if (t > 30.5) {
    const fall = E.in(sat(t, 30.5, 30.82)), peel = E.in(sat(t, 31.22, 31.55));
    const s0 = lerp(3.6, 0.6, fall), rot = lerp(1.9, -0.18, fall);
    const px = lerp(x + 520, bx + 40, fall) + peel * 900, py = lerp(-500, by - 70, fall) - peel * 650;
    const throb = t > 30.97 && t < 31.22 ? Math.exp(-10 * ((t - 30.97) % 0.25)) : 0;
    badge(ctx, px, py, s0 * (1 + 0.25 * slam), rot + peel * 3, throb);
  }
  if (hit && t < 31.3) {                                                // 啪!, speed lines, a flash
    const d = t - 30.82, a = 1 - sat(d, 0.25, 0.48);
    ctx.save(); ctx.strokeStyle = rgba('#FFFFFF', 0.9 * a); ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let k = 0; k < 16; k++) { const an = k / 16 * TAU, r0 = 200 + d * 900, r1 = r0 + 140; ctx.beginPath(); ctx.moveTo(bx + Math.cos(an) * r0, by + Math.sin(an) * r0); ctx.lineTo(bx + Math.cos(an) * r1, by + Math.sin(an) * r1); ctx.stroke(); }
    ctx.restore();
    const p = E.back(sat(d, 0, 0.14)); ctx.save(); ctx.translate(bx - 330, by - 120); ctx.rotate(-0.2); ctx.scale(p, p);
    glowWord(ctx, '啪！', 0, 0, 130, { alpha: a, color: '#FFFFFF', stroke: '#7A0E12', glow: 'rgba(255,90,90,0.9)' }); ctx.restore();
    ctx.fillStyle = rgba('#FFFFFF', 0.6 * (1 - sat(d, 0, 0.1))); ctx.fillRect(-50, -50, W + 100, H + 100);
  }
  ctx.restore();
}

// B3 31.6–35.1  便宜 不是随便: on the anvil under a metal basin; three strokes of the hammer; she rises shining and curtsies
const HITS = [31.62, 32.35, 33.56];
export function sB3(ctx, t) {
  const last = HITS.filter(h => t >= h).pop() ?? -9, imp = Math.exp(-12 * Math.max(0, t - last));
  ctx.save(); ctx.translate(noise(t * 50, 1) * 16 * imp, noise(t * 50, 2) * 16 * imp);
  const o = { z: 1.06, fx: 0.48, fy: 0.42 };                            // room above the basin on her head
  backdrop(ctx, 'bg10_forge', o);
  const M = bdMap('bg10_forge', o), [ax, ay] = M.pt(...POS.anvil);
  const risen = t >= 34.0;
  const dsz = 350 * M.s, [bx, by] = anchorPt('d13', ax, ay + 6, dsz, ...POS.basin);
  if (!risen) char(ctx, 'd13', ax, ay + 6, dsz, { shadow: false, sy: 1 - imp * 0.08, sx: 1 + imp * 0.05 });
  else {
    const p = E.back(sat(t, 34.0, 34.35));
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(ax, ay - 200, 0, ax, ay - 200, 520);
    g.addColorStop(0, rgba('#FFF6D0', 0.9 * (1 - sat(t, 34.0, 35.0)))); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    // she springs off the anvil down onto the floor in front of the forge, left of it, and lands big, clear of him (本人 10-18;
    // both versions since 10-19)
    const hop = E.io(sat(t, 34.0, 34.42)), gx = lerp(ax, 520, hop), gy = lerp(ay + 6, 980, hop) - Math.sin(hop * Math.PI) * 170;
    const gs = lerp(390 * M.s, 640, hop), land = t > 34.42 ? Math.exp(-9 * (t - 34.42)) : 0;
    char(ctx, 'd14', gx, gy, gs, { shadow: hop > 0.9, sy: 1 - 0.07 * land, sx: 1 + 0.04 * land });
    if (t > 34.42 && t < 34.9) { const d = t - 34.42; for (let k = 0; k < 8; k++) { const an = Math.PI + k / 7 * Math.PI, r = 60 + d * 380;
      ctx.fillStyle = rgba('#E8D6B8', 0.7 * (1 - d / 0.48)); ctx.beginPath(); ctx.arc(gx + Math.cos(an) * r * 1.6, 975 + Math.sin(an) * r * 0.25, 14 * (1 - d), 0, TAU); ctx.fill(); } }   // dust where she lands
    for (let k = 0; k < 14; k++) { const an = rnd(k, 5) * TAU, r = 160 + (t - 34.0) * 260 * (0.5 + rnd(k, 6)); ctx.globalAlpha = 1 - sat(t, 34.3, 35.1);
      drawGlyph(ctx, '✦', gx + Math.cos(an) * r, gy - gs * 0.6 + Math.sin(an) * r * 0.8, 30 + rnd(k, 7) * 26, { color: '#FFE9A6', weight: 700, fam: SANS }); }
    ctx.globalAlpha = 1;
  }
  // the hammer is drawn raised in his sprite: each stroke is a cartoon smear from the hammer head down onto the basin,
  // with his whole body dipping into it
  const swing = HITS.reduce((v, h) => { const d = t - h; return d > -0.06 && d < 0.22 ? Math.max(v, d < 0 ? 1 + d / 0.06 : 1 - d / 0.22) : v; }, 0);
  const [mx, my] = M.pt(...POS.smith), msz = 540 * M.s, mo = { shadow: true, rot: -0.07 * swing, sy: 1 - 0.06 * swing, sx: 1 + 0.03 * swing };
  char(ctx, 'm14', mx, my, msz, mo);
  const [hx, hy] = anchorPt('m14', mx, my, msz, ...POS.hammer, mo);
  for (const h of HITS) {
    const d = t - h; if (d < -0.06 || d > 0.16) continue;
    const a = d < 0 ? 0.5 : 1 - d / 0.16;
    ctx.save(); ctx.lineCap = 'round';
    const cx = (hx + bx) / 2 + 40, cy = Math.min(hy, by) - 120;
    for (const [w, c] of [[90, 'rgba(255,255,255,0.35)'], [46, 'rgba(255,255,255,0.75)']]) {
      ctx.strokeStyle = c; ctx.globalAlpha = a; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(cx, cy, bx + 10, by - 30); ctx.stroke(); }
    if (d >= 0) {                                                     // the hammer head, for a moment, on the basin
      ctx.globalAlpha = 1 - d / 0.16; ctx.translate(bx + 20, by - 50); ctx.rotate(0.5);
      ctx.fillStyle = '#7C8290'; ctx.strokeStyle = '#1E2230'; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-70, -45, 140, 90, 12); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#6B4424'; ctx.fillRect(60, -12, 160, 24); ctx.strokeRect(60, -12, 160, 24);
    }
    ctx.restore();
  }
  for (const h of HITS) {
    if (t < h || t > h + 0.6) continue;
    splash(ctx, t, h, bx, by, { n: 26, scale: 0.6, seed: h * 7, tint: '#FFB347', spread: 3.2, life: 0.6 });
    const p = E.back(sat(t, h, h + 0.15)), a = 1 - sat(t, h + 0.35, h + 0.6);
    ctx.save(); ctx.translate(bx - 200 + (h - 31.6) * 90, by - 110); ctx.rotate(-0.12); ctx.scale(p, p);
    glowWord(ctx, '铛！', 0, 0, 96, { alpha: a, color: '#FFE36B', stroke: '#5A2600', glow: 'rgba(255,160,60,0.9)' });
    ctx.restore();
    ctx.fillStyle = rgba('#FFE7B0', 0.4 * (1 - sat(t, h, h + 0.12))); ctx.fillRect(-50, -50, W + 100, H + 100);
  }
  ctx.restore();
}

// B4 35.1–38.2  等着吧 等过年: the calendar runs to 2025-01-27; "shh"; on 过年 the lanterns come on and fireworks go up
const DAYS = [20, 21, 22, 23, 24, 25, 26, 27];
function calendar(ctx, x, y, w, t) {
  const k = Math.min(DAYS.length - 1, Math.floor(clamp((t - 35.25) / 0.11, 0, 99)));
  const ph = (t - 35.25) / 0.11 - k;                                    // the page being torn off
  const drawPage = (day, rot, dy, a) => {
    ctx.save(); ctx.translate(x, y + dy); ctx.rotate(rot); ctx.globalAlpha = a;
    prop(ctx, 'prop_calpage', 0, 0, w);
    ctx.fillStyle = '#2A2B44'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = font(w * 0.11, 800, SANS); ctx.fillText('2025年1月', 0, -w * 0.2);
    ctx.fillStyle = day === 27 ? '#D8261E' : '#2A2B44'; ctx.font = font(w * 0.4, 900, SANS); ctx.fillText(String(day), 0, w * 0.07);
    ctx.fillStyle = '#6A6D80'; ctx.font = font(w * 0.08, 700, SANS); ctx.fillText(day === 27 ? '腊月廿八' : '', 0, w * 0.33);
    ctx.restore();
  };
  drawPage(DAYS[Math.min(DAYS.length - 1, k + (ph > 0 && k < DAYS.length - 1 ? 1 : 0))], 0, 0, 1);
  if (k < DAYS.length - 1 && t > 35.25) drawPage(DAYS[k], ph * 0.9, ph * ph * 300, 1 - ph);
}
export function sB4(ctx, t) {
  const lit = sat(t, 36.16, 36.3);
  const o = { z: 1.1, fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg11_newyear', o);
  if (lit > 0) backdrop(ctx, 'bg11b_newyear_lit', { ...o, alpha: lit });
  const M = bdMap('bg11_newyear', o), [nx, ny] = M.pt(...POS.nail);
  calendar(ctx, nx, ny + 150 * M.s, 300 * M.s, t);
  if (lit > 0 && globalThis.__fireworks) globalThis.__fireworks(ctx, t, M);    // v2: drawn fireworks in the window (src/v2/fx2.js)
  else if (lit > 0) for (let k = 0; k < 6; k++) {                      // fireworks bursting over the room
    const t0 = 36.2 + k * 0.32, d = t - t0; if (d < 0 || d > 1.2) continue;
    const cx = [260, 1500, 760, 1750, 420, 1150][k], cy = [180, 300, 120, 140, 330, 230][k];
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 28; i++) { const an = i / 28 * TAU, r = 30 + E.out(sat(d, 0, 0.8)) * 160;
      ctx.fillStyle = rgba(['#FFD36B', '#FF6B6B', '#9FE6FF'][k % 3], 1 - sat(d, 0.5, 1.2)); ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r * 1.4, cy + Math.sin(an) * r * 1.4 + d * d * 60, 6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  const pop = E.back(sat(t, 35.15, 35.45)), hop = t > 36.16 ? Math.exp(-6 * (t - 36.16)) : 0;
  char(ctx, 'd15', 640, 962, 770 * pop, { shadow: true, lift: hop * 60, ...breathe(t) });
  if (t > 37.4) {                                                       // the fuse: a spark runs from her lantern off to the right
    const q = E.in(sat(t, 37.4, 38.2)), sx = lerp(820, W + 60, q), sy = 760 + Math.sin(q * 9) * 30;
    ctx.save(); ctx.strokeStyle = 'rgba(70,35,20,0.85)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(sx, sy);
    for (let u = q; u <= 1; u += 0.02) ctx.lineTo(lerp(820, W + 60, u), 760 + Math.sin(u * 9) * 30); ctx.stroke(); ctx.restore();
    for (let k = 0; k < 14; k++) { const an = rnd(k + Math.floor(t * 40), 7) * TAU, r = 10 + rnd(k, 8) * 50; ctx.fillStyle = k % 2 ? '#FFF2B0' : '#FFB040'; ctx.beginPath(); ctx.arc(sx + Math.cos(an) * r, sy + Math.sin(an) * r, 4, 0, TAU); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 110); g.addColorStop(0, 'rgba(255,245,200,1)'); g.addColorStop(0.3, 'rgba(255,200,90,0.8)'); g.addColorStop(1, 'rgba(255,200,80,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 110, sy - 110, 220, 220); ctx.restore();
  }
}
