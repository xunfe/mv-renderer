// Full version, the last chorus (a concert, key up) and the outro with the credits (分镜.md H1–I5). Times are on the
// full cut.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, rgba, font, SANS, FULLCUT } from './lib.js';
import { char, breathe, anchorPt, walkBob, bop, placeBy, spriteInfo } from './chars.js';
import { backdrop, bdMap, prop, tipProp, bubbles, splash, ripples, glowWord, balloon, thinkBox, warpQuad, img } from './common.js';
import { appIcon } from './ui.js';
import { onBg, layer } from './scenesD.js';
import { SURF } from './scenesA.js';
import { seal } from './scenesOpen.js';
import { cta } from './scenesC.js';

export const STAGE = { screen: [[380, 196], [1160, 196], [1160, 516], [380, 516]], deck: [1010, 566], crowd: 600 };   // bg32 (image px); she sings right of centre so the big screen's close-up (left of centre) stays visible
function beams(ctx, t, a = 1) {                                          // sweeping stage lights
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  const cols = ['#7FD0FF', '#C9A0FF', '#FFB3E6', '#9FE6FF'];
  for (let k = 0; k < 6; k++) {
    const x = 200 + k * 300, an = Math.PI / 2 + Math.sin(t * (0.9 + k * 0.13) + k) * 0.6, L = 1400;
    const g = ctx.createLinearGradient(x, -40, x + Math.cos(an) * L, -40 + Math.sin(an) * L); g.addColorStop(0, rgba(cols[k % 4], 0.35 * a)); g.addColorStop(1, rgba(cols[k % 4], 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 10, -40); ctx.lineTo(x + Math.cos(an - 0.07) * L, -40 + Math.sin(an - 0.07) * L); ctx.lineTo(x + Math.cos(an + 0.07) * L, -40 + Math.sin(an + 0.07) * L); ctx.lineTo(x + 10, -40); ctx.fill();
  }
  ctx.restore();
}
function sticks(ctx, t, y0, a = 1, sync = 0) {                           // glow sticks waving over the crowd
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';
  for (let k = 0; k < 70; k++) {
    const x = rnd(k, 11) * W, y = y0 + rnd(k, 12) * (H - y0) * 0.8, an = Math.sin(t * 5 + (sync ? 0 : rnd(k, 13) * 6)) * 0.5, L = 40 + rnd(k, 14) * 50;
    ctx.strokeStyle = rgba('#7FD0FF', (0.5 + 0.5 * (sync ? 1 : rnd(k, 15))) * a); ctx.lineWidth = 10 + rnd(k, 16) * 6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.sin(an) * L, y - Math.cos(an) * L); ctx.stroke();
  }
  ctx.restore();
}
export function confetti(ctx, t, t0, n = 60) {
  if (t < t0) return;
  for (let k = 0; k < n; k++) {
    const d = t - t0, vx = (rnd(k, 21) - 0.5) * 900, vy = -500 - rnd(k, 22) * 700, x = W / 2 + vx * d, y = 520 + vy * d + 450 * d * d;
    if (y > H + 40) continue; ctx.save(); ctx.translate(x + Math.sin(d * 6 + k) * 30, y); ctx.rotate(d * 8 + k);
    ctx.fillStyle = ['#FF6B9A', '#FFD36B', '#7FD0FF', '#B9F0A0', '#C9A0FF'][k % 5]; ctx.fillRect(-10, -6, 20, 12); ctx.restore();
  }
}
// the concert: the stage, her on the deck, something on the big screen
export function concert(ctx, t, o2) {
  const o = { z: o2.z ?? 1.06, fx: 0.5, fy: o2.fy ?? 0.5 };
  backdrop(ctx, 'bg32_stage', o);
  const q = onBg('bg32_stage', o, STAGE.screen);
  warpQuad(ctx, q, 1200, 500, (x, sw, sh) => { const g = x.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#1A2A6E'); g.addColorStop(1, '#5A3FA0'); x.fillStyle = g; x.fillRect(0, 0, sw, sh); o2.screen?.(x, sw, sh); }, { res: 0.8, slot: 11 });
  beams(ctx, t);
  const M = bdMap('bg32_stage', o), [dx, dy] = M.pt(...STAGE.deck);
  if (o2.me) o2.me(dx, dy, M.s);
  sticks(ctx, t, M.pt(0, STAGE.crowd)[1], o2.sticks ?? 1, o2.sync ?? 0);
  return { M, q };
}
const fitIn = (x, sw, sh, id, cx, feet, size, o = {}) => char(x, id, cx, feet, size, { shadow: false, ...o });
// the live camera on the big screen: a close-up of her head and shoulders, left of centre (she stands right of centre)
const SCR_X = 0.32;
export const closeUp = (x, sw, sh, id, o = {}) => { fitIn(x, sw, sh, id, sw * SCR_X, sh * 2.15, sh * 2.5, o); x.fillStyle = '#FF3B3B'; x.beginPath(); x.arc(sw * 0.05, sh * 0.09, sh * 0.025, 0, TAU); x.fill(); x.fillStyle = '#FFFFFF'; x.font = font(sh * 0.05, 800, SANS); x.textBaseline = 'middle'; x.fillText('LIVE', sw * 0.075, sh * 0.092); };

// H1 144.59–148.51  我还是那条大肥鱼: the key goes up; a concert; confetti bursts; she sings, live on the big screen
export function sH1(ctx, t) {
  concert(ctx, t, { z: lerp(1.3, 1.06, E.out(sat(t, 144.59, 145.6))), screen: (x, sw, sh) => closeUp(x, sw, sh, 'd48', bop(t, 1.4)),
    me: (dx, dy, s) => char(ctx, 'd48', dx, dy, 330 * s, { shadow: false, ...bop(t, 1.4) }) });
  confetti(ctx, t, 144.59, 90);
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * Math.exp(-8 * Math.max(0, t - 144.59))); ctx.fillRect(0, 0, W, H);
}
// H2 148.51–151.91  偶尔偷懒 偶尔嘴馋: on the big screen, new clips: flat out on a beanbag scrolling her phone, then a bite of a
// huge rice ball; she dances on stage, spinning
export function sH2(ctx, t) {
  concert(ctx, t, { screen: (x, sw, sh) => { const lazy = t < 149.93; if (lazy) fitIn(x, sw, sh, 'd75', sw * 0.4, sh * 1.0 + Math.sin(t * 2) * 4, sh * 1.0, breathe(t, 0.6));     /* bigger (本人 10-19) */ else fitIn(x, sw, sh, 'd76', sw * 0.36, sh * 1.04, sh * 0.98, { ...bop(t, 1.6, 8), rot: Math.sin(t * 6) * 0.03 });       // (10-22: the else had ended up inside the comment: the rice ball never showed)
      x.fillStyle = '#FFE36B'; x.font = font(sh * 0.16, 900, SANS); x.textBaseline = 'middle'; x.fillText(lazy ? '偷懒' : '嘴馋', sw * 0.06, sh * 0.16); },
    me: (dx, dy, s) => { const sp = (t - 148.51) * Math.PI / 0.8; char(ctx, 'd74', dx, dy - Math.abs(Math.sin(sp)) * 26, 330 * s, { shadow: false, flip: Math.cos(sp) < 0, rot: Math.sin(sp * 2) * 0.04 }); } });
}
// H3 151.91–154.78  可你叫我名字的时候: phones held up in the crowd type her name; she turns round
export function sH3(ctx, t) {
  concert(ctx, t, { z: 1.12, fy: 0.54, screen: (x, sw, sh) => closeUp(x, sw, sh, 'd49'), me: (dx, dy, s) => char(ctx, 'd49', dx, dy, 330 * s, { shadow: false }) });
  const names = ['大肥鱼', 'DeepSeek', '大肥鱼！', '鱼鱼', 'DeepSeek', '大肥鱼'];
  names.forEach((s, i) => {
    const t0 = 151.95 + i * 0.3, up = E.out(sat(t, t0, t0 + 0.35)); if (up <= 0) return;
    const x = 180 + i * 310, y = lerp(H + 200, 860 - (i % 2) * 60, up);
    ctx.save(); ctx.translate(x, y); ctx.rotate((i % 2 ? 0.06 : -0.06));
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-80, -150, 160, 300, 22); ctx.fill();
    ctx.fillStyle = '#F4F6FF'; ctx.beginPath(); ctx.roundRect(-70, -138, 140, 276, 16); ctx.fill();
    const shown = [...s].slice(0, Math.floor((t - t0 - 0.3) * 8)).join('');
    ctx.font = font(30, 900, SANS); const fs = Math.min(30, 30 * 118 / ctx.measureText(s).width);      // the whole name fits on the phone (DeepSeek ran off it)
    ctx.fillStyle = '#1E3A8A'; ctx.font = font(fs, 900, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(shown, 0, 0); ctx.restore();
  });
}
// H4 154.78–157.94  我一直都在: heart hands at her chest (her arms are short: nothing above her head, 本人 10-18), on stage and live on the big screen; every glow stick lights up together
export function sH4(ctx, t) {
  const pulse = 0.5 + 0.5 * Math.cos((t - 154.78) * Math.PI * 2 / 0.8);
  const sway = { rot: Math.sin((t - 154.78) * Math.PI / 0.8) * 0.04, ...breathe(t) };
  concert(ctx, t, { z: lerp(1.06, 1.14, sat(t, 154.78, 157.9)), sync: 1, screen: (x, sw, sh) => closeUp(x, sw, sh, 'd93', sway),
    me: (dx, dy, s) => char(ctx, 'd93', dx, dy, 330 * s, { shadow: false, ...sway }) });
  if (t > 155.0) for (let k = 0; k < 6; k++) { const d = ((t - 155.0) * 0.5 + k / 6) % 1; glowWord(ctx, '♡', 1340 + Math.sin(d * 5 + k) * 60 + (k % 3 - 1) * 70, 260 - d * 240, 46, { alpha: Math.sin(d * Math.PI) * sat(t, 155.0, 155.3), color: '#FFB3C8', glow: 'rgba(255,170,200,0.9)' }); }
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba('#7FD0FF', 0.08 * pulse); ctx.fillRect(0, 600, W, H - 600); ctx.restore();
}
// H5 157.94–161.16  我只是翻了个身: she springs up and turns a full somersault in the air (upside down on 翻), live on the big
// screen too; a whale of light arcs over the stage at the same moment
export function sH5(ctx, t) {
  const p = sat(t, 158.67, 160.9), up = E.out(sat(t, 157.94, 158.5)) - E.in(sat(t, 160.45, 161.1)), spin = E.io(sat(t, 158.2, 160.5)) * TAU;
  const tuck = (c, cx, feet, size) => { const si = spriteInfo('d78'), m = si ? anchorPt('d78', cx, feet, size, si.w / 2, (si.top + si.feetY) / 2) : [cx, feet]; c.save(); c.translate(m[0], m[1]); c.rotate(spin); c.translate(-m[0], -m[1]); char(c, 'd78', cx, feet, size, { shadow: false }); c.restore(); };
  concert(ctx, t, { screen: (x, sw, sh) => { tuck(x, sw * 0.32, sh * 1.7 - up * sh * 0.25, sh * 1.9); x.fillStyle = '#FF3B3B'; x.beginPath(); x.arc(sw * 0.05, sh * 0.09, sh * 0.025, 0, TAU); x.fill(); x.fillStyle = '#FFFFFF'; x.font = font(sh * 0.05, 800, SANS); x.textBaseline = 'middle'; x.fillText('LIVE', sw * 0.075, sh * 0.092); },
    me: (dx, dy, s) => { tuck(ctx, dx, dy - up * 170, 330 * s); for (let k = 0; k < 8; k++) { const an = spin + k / 8 * TAU; glowWord(ctx, '✦', dx + Math.cos(an) * 200 * s, dy - up * 170 - 150 * s + Math.sin(an) * 200 * s, 28, { alpha: sat(t, 158.3, 158.6) * (1 - sat(t, 160.4, 160.8)), color: '#BFE6FF', glow: 'rgba(140,210,255,0.9)' }); } } });
  if (p > 0 && p < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = Math.sin(p * Math.PI);
    prop(ctx, 'prop_whale', lerp(1700, 260, p), 420 - Math.sin(p * Math.PI) * 300, 900, { rot: lerp(-0.6, 0.7, p), filter: 'brightness(1.6) saturate(1.4)' }); ctx.restore();
    splash(ctx, t, 158.7, 1700, 500, { n: 40, scale: 1.2, tint: '#9FE6FF' }); }
}
// H6 161.16–164.57  整片海都翻了天: daylight, a huge barrel wave (bg36); the camera starts inside the tube and pulls back; 姐姐, 橙子
// and 小柯 shoot out of it one after another and race down the face, carving, spray flying; she comes out last on her red
// candle board and launches into an aerial on the splash (162.23); the frame rolls and shakes with the ride
export const BARREL = { eye: [800, 440] };                                // bg36: the mouth of the tube (image px)
// each rider: when they come out of the tube, where their line across the face ends (screen px, the board's middle; higher =
// farther), size, carving phase. They fan out over the face toward the shoulder (the wave breaks right to left); she rides in front
const RIDERS = [['g94', 160.95, [1580, 400], 320, 0.0], ['o94', 161.25, [1240, 520], 350, 0.7], ['k94', 161.55, [1640, 760], 370, 1.4], ['d94', 161.86, [880, 740], 470, 2.1]];
export const BOARD_D94 = [437, 797];                                      // d94: the middle of the candle board (keyed sprite px)
export function sH6(ctx, t) {
  const pull = E.out(sat(t, 161.16, 162.6)), o = { z: lerp(1.42, 1.06, pull), fx: lerp(0.5, 0.6, E.io(sat(t, 161.16, 164.5))), fy: lerp(0.44, 0.52, pull) };
  const hit = t > 162.23 ? Math.exp(-6 * (t - 162.23)) : 0, sx = Math.sin(t * 53) * 14 * hit, sy = Math.cos(t * 47) * 10 * hit;
  ctx.save(); ctx.translate(W / 2 + sx, H / 2 + sy); ctx.rotate(Math.sin((t - 161.16) * 1.9) * 0.025 - 0.015); ctx.scale(1.04, 1.04); ctx.translate(-W / 2, -H / 2);
  backdrop(ctx, 'bg36_barrel_wave', o);
  const M = bdMap('bg36_barrel_wave', o);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.lineCap = 'round';          // speed lines across the face
  for (let k = 0; k < 18; k++) { const u = ((t - 161.16) * (1.2 + rnd(k, 61)) + rnd(k, 62)) % 1, y = rnd(k, 63) * H, x = -300 + u * (W + 600);
    ctx.strokeStyle = rgba('#FFFFFF', 0.28 * Math.sin(u * Math.PI)); ctx.lineWidth = 3 + rnd(k, 64) * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 220, y - 70); ctx.stroke(); }
  ctx.restore();
  let launch = null;
  RIDERS.map(r => ({ r, end: r[2] })).sort((A, B) => A.end[1] - B.end[1]).forEach(({ r: [id, t0, end, sz, ph] }) => {   // farther (higher) first
    if (t < t0) return;
    const u = E.out(sat(t, t0, t0 + 1.6)), drift = (t - t0) * 18, grow = lerp(0.35, 1, u);
    const [x0, y0] = M.pt(...BARREL.eye), [x1, y1] = end;
    const carve = Math.sin((t - t0) * 3.2 + ph) * 34 * u, x = lerp(x0, x1, u) + drift, base = lerp(y0, y1, u) - Math.sin(u * Math.PI) * 60 + carve;
    let lift = 0, spin = 0;
    if (id === 'd94') { const a = sat(t, 162.23, 163.05); lift = Math.sin(a * Math.PI) * 240; spin = a > 0 && a < 1 ? Math.sin(a * Math.PI) * -0.35 : 0; if (t > 162.2 && !launch) launch = [x, base]; }
    const tilt = 0.12 + Math.cos((t - t0) * 3.2 + ph) * 0.12 + spin, size = sz * grow;
    if (lift < 30) for (let k = 0; k < 16; k++) {                         // spray off the board's tail
      const d = ((t - t0) * 2.4 + k / 16) % 1;
      ctx.fillStyle = rgba('#FFFFFF', 0.85 * (1 - d) * sat(t, t0, t0 + 0.3)); ctx.beginPath();
      ctx.arc(x - size * 0.42 - d * 240 * grow, base - size * 0.06 - Math.sin(d * Math.PI) * 120 * grow + rnd(k, 65) * 20, (4 + 12 * (1 - d)) * grow, 0, TAU); ctx.fill();
    }
    if (id === 'd94') { const [fx, fy] = placeBy('d94', ...BOARD_D94, x, base - lift, size, { rot: tilt }); char(ctx, 'd94', fx, fy, size, { shadow: false, sway: 1.6, windX: -0.7, rot: tilt }); }
    else char(ctx, id, x, base - lift, size, { shadow: false, sway: 1.3, windX: -0.6, rot: tilt * 0.6 });
  });
  if (launch) { splash(ctx, t, 162.23, launch[0] - 60, launch[1] + 10, { n: 60, scale: 1.3, life: 1.0 }); if (t > 163.0) splash(ctx, t, 163.05, launch[0] + 140, launch[1] + 40, { n: 40, scale: 1.0, life: 0.9 }); }
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen';                    // the sun flashing as she flies
  const fl = Math.sin(sat(t, 162.2, 163.0) * Math.PI); const g = ctx.createRadialGradient(W * 0.86, H * 0.08, 0, W * 0.86, H * 0.08, 900); g.addColorStop(0, rgba('#FFF4D0', 0.55 * fl)); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
// H7 164.57–166.95  谁想去远方: sunrise; she blows a big dandelion and its seeds, each carrying a little rolled-up map (or a speck of
// light), sail off over the sea to the horizon (no boats, 本人 10-18)
export function sH7(ctx, t) {
  const pan = E.io(sat(t, 164.57, 166.9)), o = { z: 1.12, fx: lerp(0.42, 0.62, pan), fy: lerp(0.62, 0.5, pan) };
  backdrop(ctx, 'bg17_dawn_sea', o);
  const M = bdMap('bg17_dawn_sea', o), hy = M.pt(0, (img('bg17_dawn_sea')?.height ?? 1024) * 0.363)[1], shift = -pan * 340;
  const blow = Math.sin(sat(t, 164.6, 165.0) * Math.PI), x = 470 + shift, fy = 1010;
  char(ctx, 'd80', x, fy, 760, { shadow: false, sx: 1 + 0.02 * blow, rot: -0.03 * blow });
  const [sx0, sy0] = anchorPt('d80', x, fy, 760, 600, 485);                 // the dandelion head (keyed sprite px)
  for (let k = 0; k < 34; k++) {                                         // the seeds: out of the head, up on the breeze, off to the horizon
    const t0 = 164.75 + rnd(k, 51) * 0.6, d = sat(t, t0, t0 + 1.8 + rnd(k, 52) * 0.8); if (d <= 0) continue;
    const far = E.in(d), px = sx0 + E.out(d) * (900 + rnd(k, 53) * 900) + Math.sin(t * 2 + k) * 30 * d, py = lerp(sy0, hy - 40 - rnd(k, 54) * 360, E.out(d)) + Math.sin(t * 3 + k * 1.7) * 20 * d;
    prop(ctx, k % 3 ? 'prop_seed_map' : 'prop_seed_glow', px, py, lerp(120, 34, far) * (0.8 + rnd(k, 55) * 0.4), { rot: Math.sin(t * 2.5 + k) * 0.25, alpha: sat(d, 0, 0.08) * (1 - sat(d, 0.9, 1)) });
  }
}
// H8 166.95–168.44  都拿去吧 不要钱: as in chorus 1 but at sunrise, everyone with her; she throws her arms wide
export function sH8(ctx, t) {
  const o = { z: 1.06, fx: 0.5, fy: 0.62 };
  backdrop(ctx, 'bg17_dawn_sea', o);
  const row = [['m18', 280, 900, 520], ['g93', 560, 880, 470], ['o93', 1490, 880, 470], ['k93', 1730, 900, 470]];
  row.forEach(([id, x, y, sz], i) => { const p = E.back(sat(t, 166.95 + i * 0.12, 167.25 + i * 0.12)); char(ctx, id, x, y, sz * p, { shadow: false, ...bop(t, 1, 6) }); });
  char(ctx, 'd81', W / 2, 990, 620, { shadow: false, ...breathe(t) });
  [['都', 166.95], ['拿', 167.01], ['去', 167.36], ['吧', 167.49]].forEach(([ch, t0], i) => { if (t < t0) return; const p = E.back(sat(t, t0, t0 + 0.16)); ctx.save(); ctx.translate(W / 2 + (i - 1.5) * 84, 90); ctx.scale(p, p); glowWord(ctx, ch, 0, 0, 70, { color: '#FFFFFF' }); ctx.restore(); });
  [['不', 167.73], ['要', 167.90], ['钱', 168.07]].forEach(([ch, t0], i) => { if (t < t0) return; const p = E.back(sat(t, t0, t0 + 0.16)); ctx.save(); ctx.translate(W / 2 + (i - 1) * 170, 225); ctx.scale(p, p); glowWord(ctx, ch, 0, 0, 140, { color: '#FFF6D8', glow: 'rgba(255,200,90,0.95)' }); ctx.restore(); });
  if (t > 168.1) { const s = E.out(sat(t, 168.1, 168.22)); seal(ctx, W / 2 + 400, 210, lerp(1.6, 0.7, s), -0.15); }
  confetti(ctx, t, 168.07, 50);
}

// H9 168.44–169.47  the breath: 本人 10-18 took 嗯 用户好像很满意 out of the full version (the trailer keeps it), so after
// 不要钱 the sunrise picture holds and goes white, as at the end of the trailer's chorus; the song comes back at 174.434
export function sH9(ctx, t) {
  sH8(ctx, Math.min(t, 168.9));
  ctx.fillStyle = rgba('#FFFFFF', 0.92 * E.in(sat(t, 168.9, 169.42))); ctx.fillRect(0, 0, W, H);
}
// I3 181.19–182.53  the band's hits, as at the end of the trailer: the title on the first two, then 点赞 收藏 关注 pop in, and she
// pops up giving a thumbs-up on the last light hit
// the trailer (a separate post) keeps its 完整版 即将上线 on the third hit, and the buttons move along one hit
const CARD_F = FULLCUT ? [[181.19, '我只是', 150, 250], [181.39, '翻了个身', 170, 430]] : [[181.19, '我只是', 150, 250], [181.39, '翻了个身', 170, 430], [181.59, '完整版 即将上线', 46, 580]];
const CTA_F = FULLCUT ? [[181.59, 'like', '点赞'], [181.79, 'fav', '收藏'], [182.19, 'follow', '关注']] : [[181.79, 'like', '点赞'], [182.19, 'fav', '收藏'], [182.39, 'follow', '关注']];
export function sI3(ctx, t) {
  backdrop(ctx, 'bg17_dawn_sea', { z: 1.2, blur: 10, dark: 0.35 });
  CARD_F.forEach(([t0, s, size, y]) => {
    if (t < t0) return;
    const p = E.out(sat(t, t0, t0 + 0.09)), hit = Math.exp(-14 * (t - t0));
    ctx.save(); ctx.translate(W / 2, y); ctx.scale(lerp(1.8, 1, p) + hit * 0.05, lerp(1.8, 1, p) + hit * 0.05);
    glowWord(ctx, s, 0, 0, size, { alpha: p, color: '#FFFFFF', stroke: '#0B1E4D', glow: size > 100 ? 'rgba(90,200,255,0.95)' : 'rgba(255,255,255,0.6)' }); ctx.restore();
  });
  CTA_F.forEach(([t0, kind, label], i) => cta(ctx, t, t0, W / 2 + (i - 1) * 260, FULLCUT ? 760 : 790, kind, label));
  if (t > 182.39) char(ctx, 'd84', 1620, 1010, 380 * E.back(sat(t, 182.39, 182.52)), { shadow: false });
  ctx.fillStyle = rgba('#FFFFFF', 0.6 * Math.exp(-12 * Math.max(0, t - 181.19))); ctx.fillRect(0, 0, W, H);
}
// I4 182.53–189.90  her humming: her thinking box fills with the lines DeepSeek really 'sang' in its reasoning (调研 §5.8), one on each
// phrase she hums: Okay. / Let me go. / I'm making the calls. / Let me write the JSON. / I'll call the tool. / Let me do it. / Okay. /
// Let me go. (本人 10-18: more of the Let me go lines). A finger points in: 你怎么唱起歌来了？; she giggles behind her hands, and the
// box goes right on singing
const SING = [[182.55, 'Okay.'], [183.8, 'Let me go.'], [184.4, "I'm making the calls."], [185.8, 'Let me write the JSON.'], [186.8, "I'll call the tool."], [187.6, 'Let me do it.'], [188.0, 'Okay.'], [189.05, 'Let me go.']];
function singBox(ctx, t, x, y, w) {
  const shown = SING.filter(([t0]) => t >= t0), n = shown.length; if (!n) return;
  const lh = 70, h = 84 + n * lh + 18, last = shown[n - 1][0], pop = Math.exp(-10 * (t - last)) * 0.025;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + pop, 1 + pop); ctx.globalAlpha = E.out(sat(t, 182.55, 182.85));
  ctx.shadowColor = 'rgba(10,20,50,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgba(248,249,252,0.97)'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 22); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.font = font(24, 600, SANS); ctx.fillStyle = '#5D6475'; ctx.textBaseline = 'middle'; ctx.fillText('已深度思考（用时 1 秒）', 30, 40);
  ctx.strokeStyle = '#D7DAE2'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, 70); ctx.lineTo(30, h - 18); ctx.stroke();
  shown.forEach(([t0, L], i) => { const k = Math.floor(clamp((t - t0) * 30, 0, L.length)), now = i === n - 1;
    ctx.font = font(52, now ? 700 : 500, SANS); ctx.fillStyle = now ? '#4D6BFE' : '#8A8F9C'; ctx.fillText(L.slice(0, k), 54, 70 + lh * (i + 0.5) + 4); });
  ctx.restore();
}
export function sI4(ctx, t) {
  const push = E.io(sat(t, 182.53, 189.9)), zz = 1 + 0.1 * push;
  ctx.save(); ctx.translate(1100, 420); ctx.scale(zz, zz); ctx.translate(-1100, -420);
  backdrop(ctx, 'bg12_room', { z: 1.2, fx: 0.5, fy: 0.55 });
  const caught = t >= 186.3, sh = 0.5 + 0.5 * Math.sin((t - 186.3) * TAU * 3.5);
  const o = caught ? { sx: 1 + 0.015 * sh, sy: 1 - 0.03 * sh, rot: Math.sin((t - 186.3) * Math.PI / 0.6) * 0.02 } : { rot: Math.sin((t - 182.53) * Math.PI / 0.8) * 0.05, ...breathe(t) };
  char(ctx, caught ? 'd51' : 'd85', 1100, 965, 760, { shadow: true, ...o });
  ctx.restore();
  for (let k = 0; k < 5; k++) { const d = ((t - 182.6) * 0.7 + k / 5) % 1; glowWord(ctx, k % 2 ? '♪' : '♡', 850 + Math.sin(d * 5 + k) * 40 + (k % 3) * 40, 520 - d * 300, 56, { alpha: Math.sin(d * Math.PI) * sat(t, 182.6, 182.9), color: k % 2 ? '#7FB2FF' : '#FF8FB1', glow: 'rgba(255,255,255,0.9)' }); }
  singBox(ctx, t, 50, 50, 760);
  if (t > 185.6 && t < 189.6) { const p = E.out(sat(t, 185.6, 186.1)) - E.in(sat(t, 188.9, 189.55)), jab = Math.sin(sat(t, 186.1, 186.4) * Math.PI);
    tipProp(ctx, 'prop_hand_point', lerp(W + 500, 1450, p) - jab * 34, 460, 440);
    if (t > 186.0) { const q = E.back(sat(t, 186.0, 186.22)), fade = 1 - sat(t, 188.7, 189.0); if (fade > 0) prop(ctx, 'prop_bubble_sing', 1560, 300, 560 * q, { alpha: fade }); } }
}
// I5 189.90–194.22  the read-aloud voices: 贝壳 白浪 海星 暗潮 … and a new one, 大肥鱼, ticked; it starts to speak (a little sound
// wave); the band fades over one bar and so does the picture (no credits, 本人 10-18)
const VOICES = ['贝壳', '白浪', '海星', '暗潮', '大肥鱼'];
export function sI5(ctx, t) {
  backdrop(ctx, 'bg17_dawn_sea', { z: lerp(1.15, 1.22, sat(t, 189.9, 194.2)), blur: 8, dark: 0.3 });
  const p = E.out(sat(t, 189.9, 190.3)), x0 = W / 2 - 360, y0 = lerp(H + 50, 150, p);
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 40; ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(x0, y0, 720, 780, 40); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#111827'; ctx.font = font(40, 800, SANS); ctx.textBaseline = 'middle'; ctx.fillText('朗读音色', x0 + 50, y0 + 70);
  VOICES.forEach((v, i) => {
    const y = y0 + 170 + i * 118, isNew = i === 4, on = isNew ? t > 191.8 : i === 0 && t < 191.8;
    if (isNew && t < 191.0) return;
    const sc = isNew ? E.back(sat(t, 191.0, 191.3)) : 1;
    ctx.save(); ctx.translate(x0 + 360, y); ctx.scale(sc, sc); ctx.translate(-(x0 + 360), -y);
    ctx.fillStyle = on ? '#EEF2FF' : '#F9FAFB'; ctx.beginPath(); ctx.roundRect(x0 + 40, y - 46, 640, 92, 22); ctx.fill();
    ctx.fillStyle = '#111827'; ctx.font = font(38, 700, SANS); ctx.fillText(v, x0 + 80, y);
    if (isNew) {
      ctx.fillStyle = '#4D6BFE'; ctx.font = font(24, 800, SANS); ctx.fillText('NEW', x0 + 80 + ctx.measureText('大肥鱼').width + 140, y);
      if (t > 191.9) for (let k = 0; k < 5; k++) {                       // her voice, speaking: a little sound wave
        const hgt = 10 + 26 * Math.abs(Math.sin(t * 9 + k * 1.3)) * sat(t, 191.9, 192.2);
        ctx.fillStyle = '#4D6BFE'; ctx.beginPath(); ctx.roundRect(x0 + 420 + k * 18, y - hgt / 2, 9, hgt, 4); ctx.fill();
      }
    }
    ctx.strokeStyle = on ? '#4D6BFE' : '#D1D5DB'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x0 + 620, y, 22, 0, TAU); ctx.stroke();
    if (on) { ctx.fillStyle = '#4D6BFE'; ctx.beginPath(); ctx.arc(x0 + 620, y, 13, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
  if (t > 191.55 && t < 192.4) { const p2 = sat(t, 191.55, 192.4), press = Math.sin(sat(t, 191.7, 191.9) * Math.PI);
    tipProp(ctx, 'prop_hand_select', lerp(x0 + 980, x0 + 630, E.out(sat(t, 191.55, 191.75))) + press * 4, y0 + 170 + 4 * 118 + 6 + press * 8, 360, { alpha: (1 - sat(t, 192.15, 192.4)) * (p2 >= 0 ? 1 : 0) }); }
  if (t > 191.9) for (let k = 0; k < 4; k++) { const d = ((t - 191.9) * 0.6 + k / 4) % 1; glowWord(ctx, '♪', x0 + 760 + Math.sin(d * 5 + k) * 30, y0 + 640 - d * 380, 54, { alpha: Math.sin(d * Math.PI) * sat(t, 191.9, 192.2), color: '#FFFFFF', glow: 'rgba(120,170,255,0.9)' }); }
  ctx.fillStyle = rgba('#050B1E', E.in(sat(t, 192.62, 194.15))); ctx.fillRect(0, 0, W, H);
}
