// Full version, chorus 2 (分镜.md F1–F8) and the dim-out into the bridge. Times are on the full cut.
import { W, H, TAU, clamp, lerp, sat, E, rnd, noise, rgba, font, SANS } from './lib.js';
import { char, breathe, anchorPt, walkBob, bop, placeBy } from './chars.js';
import { backdrop, bdMap, prop, tipProp, bubbles, splash, ripples, glowWord, balloon, warpQuad, warpMesh, quadMap, maskedScreen, img } from './common.js';
import { dsChat, homeScreen, appIcon } from './ui.js';
import { QS, onBg } from './scenesD.js';
import { SURF } from './scenesA.js';

// F1 92.45–95.23  我只是翻了个身: her room at night; she turns over on the chaise and her shadow on the wall is a whale
export function sF1(ctx, t) {
  // 本人 10-19 (1:34–1:37 more action): after the roll she peeks, then on 个 sits bolt upright hugging her pillow and grins at us;
  // the camera eases in on her
  const o = { z: 1.45 + 0.15 * E.io(sat(t, 94.4, 95.2)), fx: 0.6, fy: 0.6 };
  backdrop(ctx, 'bg12_room', { ...o, filter: 'brightness(0.62) saturate(0.85) hue-rotate(-12deg)' });
  ctx.fillStyle = 'rgba(20,30,80,0.25)'; ctx.fillRect(0, 0, W, H);
  const M = bdMap('bg12_room', o), [sx, sy] = M.pt(760, 712);
  const turn = E.io(sat(t, 93.2, 93.75));
  prop(ctx, 'prop_whale', sx + 60, sy - 330 * M.s / 1.3, 760, { rot: lerp(-0.15, 0.35, turn), filter: 'brightness(0)', alpha: 0.32, flip: turn > 0.5 });   // the shadow
  ctx.save(); ctx.globalCompositeOperation = 'screen';                   // moonlight from the window
  const g = ctx.createLinearGradient(0, 0, W * 0.7, H); g.addColorStop(0, 'rgba(160,190,255,0.28)'); g.addColorStop(1, 'rgba(160,190,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  const UP = 94.72, id = t < 93.5 ? 'd64a' : t < UP ? 'd64b' : 'd99', roll = Math.sin(sat(t, 93.38, 93.66) * Math.PI);     // asleep with her back to us; she rolls over and peeks; up
  const pop = t >= UP ? Math.exp(-7 * (t - UP)) * Math.sin(Math.min(1, (t - UP) / 0.12) * Math.PI / 2) : 0;
  if (id === 'd99') char(ctx, id, sx - 40, sy + 20, 300 * M.s / 1.2 * 1.3, { shadow: false, sy: 1 + 0.08 * pop, sx: 1 - 0.04 * pop, rot: Math.sin((t - UP) * 5) * 0.03, ...breathe(t) });
  else char(ctx, id, sx, sy, 275 * M.s / 1.2 * 1.3, { shadow: false, sy: 1 - 0.07 * roll, sx: 1 + 0.03 * roll, ...breathe(t, 0.6) });
  if (t > UP) for (let k = 0; k < 6; k++) { const an = -Math.PI / 2 + (k - 2.5) * 0.45, r = 90 + E.out(sat(t, UP, UP + 0.3)) * 120; glowWord(ctx, '✦', sx - 40 + Math.cos(an) * r * 2.2, sy - 330 + Math.sin(an) * r, 34, { alpha: 1 - sat(t, UP + 0.25, 95.2), color: '#FFF3B0', glow: 'rgba(255,220,120,0.9)' }); }
}

// F2 95.23–98.75  整片海都翻了天: a Chinese trading hall; the big board goes red (up, in China) for the home-grown chip
// makers the day after V3.1 (2025-08-22: 海光信息 +17.19%, 寒武纪 up to +14%, 中科曙光 +10%; 调研 §3); she surfs past on
// her red candle board
function hallBoard(x, sw, sh, t) {
  x.fillStyle = '#0A0606'; x.fillRect(0, 0, sw, sh);
  x.textBaseline = 'middle'; x.fillStyle = '#FFD36B'; x.font = font(sh * 0.08, 900, SANS); x.fillText('国产芯片  2025.08.22', sw * 0.04, sh * 0.1);
  const rows = [['海光信息', 17.19], ['寒武纪', 14.0], ['中科曙光', 10.0], ['半导体 ETF', 5.89]];
  rows.forEach(([name, v], i) => {
    const t0 = 95.4 + i * 0.25, p = E.out(sat(t, t0, t0 + 0.9)), y = sh * (0.28 + i * 0.18);
    if (t < t0) return;
    x.fillStyle = '#F2F2F2'; x.font = font(sh * 0.085, 800, SANS); x.fillText(name, sw * 0.05, y);
    x.fillStyle = '#FF3B3B'; x.fillText(`▲ +${(v * p).toFixed(2)}%`, sw * 0.38, y);
    if (p >= 1 && v >= 10) { const s = E.back(sat(t, t0 + 0.9, t0 + 1.05)); x.save(); x.translate(sw * 0.66, y); x.rotate(-0.08); x.scale(s, s);
      x.strokeStyle = '#FF3B3B'; x.lineWidth = sh * 0.012; x.strokeRect(-sw * 0.05, -sh * 0.055, sw * 0.1, sh * 0.11); x.fillStyle = '#FF3B3B'; x.font = font(sh * 0.07, 900, SANS); x.textAlign = 'center'; x.fillText('涨停', 0, 2); x.textAlign = 'left'; x.restore(); }
  });
  x.strokeStyle = '#FF3B3B'; x.lineWidth = sh * 0.012; x.beginPath();                // the index climbing
  for (let i = 0; i <= 50; i++) { const u = i / 50, v = 0.85 - 0.6 * E.in(Math.min(u, sat(t, 95.4, 97.4))) - Math.sin(u * 30) * 0.02; const px = sw * (0.76 + u * 0.21), py = sh * v; i ? x.lineTo(px, py) : x.moveTo(px, py); }
  x.stroke();
}
export const BOARD_D65 = [597, 793];
export const BOARD_D100 = [395, 840];                                  // d100: the middle of the candle board (keyed sprite px)                                   // d65: the middle of the candle board (keyed sprite px)
export function sF2(ctx, t) {
  const jolt = t > 97.38 ? Math.exp(-9 * (t - 97.38)) : 0;
  ctx.save(); ctx.translate(Math.sin(t * 61) * 10 * jolt, Math.cos(t * 53) * 12 * jolt);
  const o = { z: 1.06 + 0.03 * jolt, fx: 0.5, fy: 0.45 };
  backdrop(ctx, 'bg25_ashare_hall', o);
  maskedScreen(ctx, 'bg25_ashare_hall', o, QS.hall, 1600, 600, (x, sw, sh) => hallBoard(x, sw, sh, t), { res: 0.8, slot: 7 });
  for (let k = 0; k < 30; k++) {                                         // red confetti
    const d = ((t - 95.3) * 0.6 + rnd(k, 1)) % 1, x = rnd(k, 2) * W + Math.sin(t * 3 + k) * 30, y = -40 + d * (H + 80);
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * 4 + k); ctx.fillStyle = k % 3 ? '#FF4D4D' : '#FFD36B'; ctx.fillRect(-8, -5, 16, 10); ctx.restore();
  }
  // 本人 10-19 (more action): she carves in crouched low, and on 翻 kicks the candle board up into a jump, V sign, and slams back
  // down on 了 with a red splash and a jolt of the camera, then carves on out
  const p = sat(t, 95.3, 98.6), bx = lerp(-300, W + 300, p), base = 930 - Math.sin(p * Math.PI) * 60 + Math.sin(t * 3) * 8, sz = 540;
  const J0 = 96.55, J1 = 97.38, air = t > J0 && t < J1, a = sat(t, J0, J1), lift = air ? Math.sin(a * Math.PI) * 300 : 0;
  const land = t > J1 ? Math.exp(-8 * (t - J1)) : 0, by = base - lift + land * 18;
  const tilt = air ? lerp(-0.25, 0.15, a) : -0.08 + Math.sin(t * 2.6) * 0.06;
  if (air) { const [fx, fy] = placeBy('d100', ...BOARD_D100, bx, by, sz * 1.05, { rot: tilt }); char(ctx, 'd100', fx, fy, sz * 1.05, { shadow: false, sway: 1.6, windX: -0.6, rot: tilt }); }
  else { const [fx, fy] = placeBy('d65', ...BOARD_D65, bx, by, sz, { rot: tilt }); char(ctx, 'd65', fx, fy, sz, { shadow: false, sway: 1.4, windX: -0.6, rot: tilt, sy: 1 - 0.06 * land, sx: 1 + 0.03 * land }); }
  splash(ctx, t, J0, bx - 80, base, { n: 30, scale: 0.8, tint: '#FF8A8A' });
  if (t > J1) splash(ctx, t, J1, bx, base + 10, { n: 60, scale: 1.2, tint: '#FF8A8A', seed: 9 });
  ctx.restore();
}

// F3 98.75–101.61  你们笑我是大肥鱼: the wall of fan art; two groups of fans (Image 2, signs and all: 大肥鱼！ / 蓝色大肥鱼) crowd in
// from both sides laughing, phones flashing; she pops up between them, hands on hips, delighted; on 大肥鱼 they all jump
export function sF3(ctx, t) {
  const o = { z: lerp(1.2, 1.06, E.out(sat(t, 98.75, 100.2))), fx: lerp(0.4, 0.5, sat(t, 98.75, 101.6)), fy: 0.42 };
  backdrop(ctx, 'bg26_fanart_wall', o);
  const p = E.back(sat(t, 99.27, 99.55)), cheer = t > 100.03 ? Math.abs(Math.sin((t - 100.03) * Math.PI / 0.32)) * Math.exp(-1.5 * (t - 100.03)) : 0;
  char(ctx, 'd43', W / 2, 930 - cheer * 40, 700 * p, { shadow: true, ...breathe(t) });
  const laugh = k => Math.abs(Math.sin(t * 9 + k)) * 10;
  const fl = E.out(sat(t, 98.8, 99.3)), fr = E.out(sat(t, 99.1, 99.6));
  prop(ctx, 'prop_fans_left', lerp(-600, 360, fl), 880 - laugh(0) - cheer * 50, 820, { rot: -0.02 + Math.sin(t * 7) * 0.01 });
  prop(ctx, 'prop_fans_right', lerp(W + 600, 1560, fr), 880 - laugh(1.3) - cheer * 50, 820, { rot: 0.02 + Math.sin(t * 7 + 1) * 0.01 });
  for (let k = 0; k < 6; k++) { const t0 = 99.4 + k * 0.33, d = t - t0; if (d < 0 || d > 0.25) continue;   // phone flashes
    const x = k % 2 ? 1560 + (k - 3) * 60 : 300 + k * 50, y = 560 + (k % 3) * 40, a = 1 - d / 0.25;
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, 150); g.addColorStop(0, rgba('#FFFFFF', a)); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - 150, y - 150, 300, 300); ctx.restore(); }
  if (t > 100.65) for (let k = 0; k < 8; k++) { const an = k / 8 * TAU + t, r = 300 + 20 * Math.sin(t * 6 + k); glowWord(ctx, '✦', W / 2 + Math.cos(an) * r, 480 + Math.sin(an) * r * 0.6, 34, { alpha: sat(t, 100.65, 100.9), color: '#FFE9A6', glow: 'rgba(255,220,120,0.9)' }); }
}

// F4 101.61–105.15  又笑着 把我留在身边: her official icon dragged into the dock of a phone; then a desk at night with a
// plush of her leaning on the monitor, patted on the head
export function sF4(ctx, t) {
  if (t < 103.13) {
    const tilt = E.io(sat(t, 101.85, 102.6)), o = { z: lerp(1.32, 1.12, tilt), fx: 0.5, fy: lerp(0.42, 0.7, tilt) };   // follow the icon down to the dock
    backdrop(ctx, 'bg21_phone_hand', o);
    const q = onBg('bg21_phone_hand', o, QS.phone), drag = sat(t, 101.8, 102.8);
    let ic = null;
    maskedScreen(ctx, 'bg21_phone_hand', o, QS.phone, 600, 1200, (x, sw, sh) => { ic = homeScreen(x, sw, sh, t, { drag }); }, { res: 1, slot: 8 });
    if (ic && t < 103.0) { const H2 = quadMap(q), [px, py] = H2(ic.x / 600, ic.y / 1200); tipProp(ctx, 'prop_hand_drag', px + 14, py + 18, 330, { alpha: sat(t, 101.7, 101.85) * (1 - sat(t, 102.85, 103.0)) }); }
    return;
  }
  const o = { z: 1.1, fx: 0.55, fy: 0.55 };
  backdrop(ctx, 'bg22_desk_monitor', o);
  maskedScreen(ctx, 'bg22_desk_monitor', o, QS.monitor, 1600, 780, (x, sw, sh) => dsChat(x, sw, sh, t, { model: 'V4.1-Flash', msgs: [{ who: 'user', text: '晚安，大肥鱼', t0: 0 }, { who: 'ai', text: '晚安～明天见', t0: 103.4, cps: 12 }] }), { res: 0.8, slot: 9 });
  // the plush of her on the desk; a finger comes in from the right and boops its cheek, three times; it squishes
  const M = bdMap('bg22_desk_monitor', o), [px, py] = M.pt(...DESK22.plush);
  const boop = [103.5, 103.95, 104.4].reduce((v, b0) => { const d = t - b0; return d > 0 && d < 0.3 ? Math.max(v, Math.sin(d / 0.3 * Math.PI)) : v; }, 0);
  const fu = img('prop_fumo'), pw = 470, ph = fu ? pw * fu.height / fu.width : pw;          // a Fumo-style plush of her (本人 10-18)
  ctx.save(); ctx.translate(px, py); ctx.rotate(-0.06 * boop); ctx.scale(1 - 0.05 * boop, 1 + 0.02 * boop); prop(ctx, 'prop_fumo', 0, -ph / 2, pw); ctx.restore();
  if (t > 103.3 && t < 105.0) {
    const a = sat(t, 103.3, 103.45) * (1 - sat(t, 104.8, 105.0)), [cx, cy] = [px + pw * 0.11, py - ph * 0.45];   // its cheek
    const inn = E.out(sat(t, 103.3, 103.5));
    tipProp(ctx, 'prop_hand_boop', cx + 6 + (1 - inn) * 520 - boop * 18, cy, 440, { alpha: a });
  }
  if (boop > 0.3) glowWord(ctx, '♡', px + pw * 0.45, py - ph - 30 - ((t - 103.5) % 0.45) * 160, 52, { alpha: boop, color: '#FFB3C8', glow: 'rgba(255,170,200,0.8)' });
}
export const DESK22 = { plush: [470, 690] };                            // bg22: on the desk left of the monitor (image px)

// F5 105.15–107.95  别人把灯藏在山顶: the 中转站 counter, the sign and the price tags (正宗 Claude 满血 GPT 直连) painted by Image 2
// (本人 10-18: anything with words in it, let Image 2 draw it); she pops up behind the counter holding a cardboard 橙子 mask on a
// stick: 好的，我现在是 Claude 了; 橙子, arms crossed, glares; on 山 she spins round and it is a 姐姐 mask: 我现在是 ChatGPT 了～
export const SHOP = { sign: [760, 155], counter: 745, me: [880, 838], orange: [1300, 905] };   // bg35 / bg35b (image px)
export function sF5(ctx, t) {
  const o = { z: lerp(1.0, 1.04, sat(t, 105.15, 107.95)), fx: 0.5, fy: 0.3 };          // further back than v4: the whole sign in frame
  backdrop(ctx, 'bg35b_relay_shop', o);
  const M = bdMap('bg35b_relay_shop', o);
  const [mx, my] = M.pt(...SHOP.me), cy = M.pt(0, SHOP.counter)[1], up = E.back(sat(t, 105.2, 105.55)), sz = 580;
  const swap = t >= 107.13, spin = Math.abs(Math.cos(sat(t, 107.0, 107.26) * Math.PI));
  ctx.save(); ctx.beginPath(); ctx.rect(-50, -50, W + 100, cy + 50); ctx.clip();        // behind the counter
  char(ctx, swap ? 'd67' : 'd66', mx, my + (1 - up) * 500, sz, { shadow: false, sx: t > 107.0 && t < 107.26 ? Math.max(0.08, spin) : 1, ...breathe(t) });
  ctx.restore();
  if (t > 107.0 && t < 107.6) { const d = t - 107.0; for (let k = 0; k < 10; k++) { const an = k / 10 * TAU; glowWord(ctx, '✦', mx + Math.cos(an) * (60 + d * 300), my - 420 + Math.sin(an) * (60 + d * 300), 32, { alpha: 1 - d / 0.6, color: '#FFF3B0', glow: 'rgba(255,220,120,0.9)' }); } }
  if (t > 105.74) { const t0 = swap ? 107.2 : 105.74, q = E.back(sat(t, t0, t0 + 0.22)); prop(ctx, swap ? 'prop_bubble_gpt' : 'prop_bubble_claude', mx + 420, my - 600, 600 * q); }
  const [ox, oy] = M.pt(...SHOP.orange), gl = E.out(sat(t, 105.5, 105.8));
  char(ctx, 'o91', lerp(W + 300, ox, gl), oy, 600, { shadow: true, ...breathe(t) });
  if (t > 106.3) { const p = E.back(sat(t, 106.3, 106.5)); ctx.save(); ctx.translate(ox + 215, oy - 530); ctx.scale(p, p); glowWord(ctx, '？', 0, 0, 110, { color: '#FFB15A', stroke: '#5A2600', glow: 'rgba(255,170,80,0.9)' }); ctx.restore(); }
}

// F6 107.95–111.35  我把地图铺在海面: at sunrise she winds up and flings the map; it opens as it flies at the lens; whip to the map
// lying on the sea, people from everywhere climbing on to read it, copy it and point out routes (bg37b, Image 2: DeepSeek-V4.1-Flash, 开源);
// the camera drifts across them; she stands at the corner of the map waving everyone over (本人 10-18: v4's code page was too geeky)
export const MAPC = { me: [250, 990] };                                  // bg37: the near corner of the map (image px)
export function sF6(ctx, t) {
  const CUT = 108.85;
  if (t < CUT) {
    const o = { z: 1.08, fx: 0.5, fy: 0.6 };
    backdrop(ctx, 'bg17_dawn_sea', o);
    const x = 560, fy = 990, sz = 700, t0 = 108.32;
    const wind = t < t0 ? -0.12 * E.io(sat(t, 107.95, t0)) : 0.07 * Math.exp(-5 * (t - t0)) * Math.cos((t - t0) * 9);
    const cm = { shadow: false, sway: 1.8, windX: -0.7, rot: wind };
    ripples(ctx, t, x, fy - 6, 200);
    char(ctx, 'd69', x, fy, sz, cm);
    if (t >= t0) {                                                       // the map leaves her hand, spinning open as it flies at us
      const [hx, hy] = anchorPt('d69', x, fy, sz, 950, 400, cm), f = E.in(sat(t, t0, CUT));
      prop(ctx, 'prop_map', lerp(hx, W / 2, f), lerp(hy, H / 2, f), lerp(120, 2600, f), { rot: (1 - f) * 2.5, sy: lerp(0.2, 1, E.out(sat(t, t0, t0 + 0.3))) });
    }
    return;
  }
  const u = E.io(sat(t, CUT, 111.35)), o = { z: lerp(1.3, 1.12, E.out(sat(t, CUT, CUT + 0.5))), fx: lerp(0.62, 0.42, u), fy: lerp(0.4, 0.55, u) };
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(Math.sin((t - CUT) * 1.2) * 0.01); ctx.translate(-W / 2, -H / 2);
  backdrop(ctx, 'bg37b_map_crowd_v41', o);                             // the same picture titled DeepSeek-V4.1-Flash (本人 10-19: not R1 in 2026)
  const M = bdMap('bg37b_map_crowd_v41', o);
  ctx.save(); ctx.globalCompositeOperation = 'screen';                   // lights running along the routes on the map
  for (let k = 0; k < 6; k++) { const d = ((t - CUT) * 0.5 + k / 6) % 1, an = k / 6 * TAU + 0.4, [cx, cy] = M.pt(760, 600);
    const x = cx + Math.cos(an) * d * 520 * M.s, y = cy + Math.sin(an) * d * 300 * M.s, g = ctx.createRadialGradient(x, y, 0, x, y, 40);
    g.addColorStop(0, rgba('#FFF6C8', 0.9 * (1 - d))); g.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = g; ctx.fillRect(x - 40, y - 40, 80, 80); }
  ctx.restore();
  for (let k = 0; k < 3; k++) { const d = ((t - CUT) * 0.35 + k / 3) % 1; prop(ctx, 'prop_gull', lerp(-200, W + 200, d), 140 + k * 70 + Math.sin(t * 4 + k) * 20, 110 - k * 20, { flip: true }); }
  const [mx, my] = M.pt(...MAPC.me), wave = Math.sin((t - CUT) * Math.PI / 0.4);
  char(ctx, 'd90', mx, my, 640 * M.s / 1.2, { shadow: false, rot: wave * 0.03, ...breathe(t) });
  ctx.restore();
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * Math.exp(-9 * (t - CUT))); ctx.fillRect(0, 0, W, H);
}

// F7 111.35–113.88  谁想去远方: a world map; glowing routes run out from China and a light runs along each one; where it arrives the
// city lights up and the light spreads (no boats here, 本人 10-18: the boats came up too often). 本人 10-22: the start was in north
// India -> central China; the routes end on real places, near to far: Tokyo, Singapore, Delhi, Nairobi, Paris, Sydney, New York, São Paulo
export const MAPW = { cn: [1212, 388], to: [[1338, 372], [1186, 566], [1058, 424], [856, 582], [700, 282], [1452, 786], [438, 300], [496, 604]] };   // bg28 (image px)
export function sF7(ctx, t) {
  const o = { z: lerp(1.15, 1.05, E.io(sat(t, 111.35, 113.8))), fx: 0.55, fy: 0.5 };
  backdrop(ctx, 'bg28_world_map', o);
  const M = bdMap('bg28_world_map', o), [cx, cy] = M.pt(...MAPW.cn);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 160); g.addColorStop(0, `rgba(120,200,255,${0.8 + 0.2 * Math.sin(t * 6)})`); g.addColorStop(1, 'rgba(120,200,255,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 160, cy - 160, 320, 320); ctx.restore();
  MAPW.to.forEach((p, k) => {
    const [ex, ey] = M.pt(...p), t0 = 111.4 + k * 0.18, d = E.io(sat(t, t0, t0 + 1.2)); if (d <= 0) return;
    const len = Math.hypot(ex - cx, ey - cy), nx = (ey - cy) / len, ny = -(ex - cx) / len, sg = ny > 0 ? -1 : 1;   // each route bows away from the chord, upward
    const bow = 0.22 * len + (k % 3) * 18, mx = (cx + ex) / 2 + sg * nx * bow, my = (cy + ey) / 2 + sg * ny * bow;
    const pt = u => [(1 - u) * (1 - u) * cx + 2 * u * (1 - u) * mx + u * u * ex, (1 - u) * (1 - u) * cy + 2 * u * (1 - u) * my + u * u * ey];
    ctx.save(); ctx.strokeStyle = 'rgba(60,170,255,0.95)'; ctx.lineWidth = 6; ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 80; ctx.shadowColor = 'rgba(80,200,255,1)'; ctx.shadowBlur = 14;
    ctx.beginPath(); for (let i = 0; i <= 30; i++) { const [x, y] = pt(i / 30 * d); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
    const [bx, by] = pt(d);
    if (d < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen';           // the light running along the route
      for (let k2 = 0; k2 < 6; k2++) { const [qx, qy] = pt(Math.max(0, d - k2 * 0.025)); const gg = ctx.createRadialGradient(qx, qy, 0, qx, qy, 34 - k2 * 4); gg.addColorStop(0, rgba('#FFF6C8', 0.95 - k2 * 0.14)); gg.addColorStop(1, 'rgba(255,230,150,0)'); ctx.fillStyle = gg; ctx.fillRect(qx - 40, qy - 40, 80, 80); }
      ctx.restore(); }
    if (d >= 1) { const a = t - (t0 + 1.2), s = E.back(sat(a, 0, 0.2));            // the city lights up: a warm bloom, a ring, sparks
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const gg = ctx.createRadialGradient(ex, ey, 0, ex, ey, 130 * s); gg.addColorStop(0, rgba('#FFE9A0', 0.9)); gg.addColorStop(1, 'rgba(255,220,140,0)'); ctx.fillStyle = gg; ctx.fillRect(ex - 140, ey - 140, 280, 280); ctx.restore();
      if (a < 0.6) { ctx.save(); ctx.strokeStyle = rgba('#FFE36B', 1 - a / 0.6); ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(ex, ey, 20 + a * 220, 0, TAU); ctx.stroke(); ctx.restore(); }
      for (let k2 = 0; k2 < 5; k2++) { const u = (a * 0.8 + k2 / 5) % 1; glowWord(ctx, '✦', ex + Math.sin(k2 * 2.1 + u * 4) * 34, ey - u * 110, 26, { alpha: (1 - u) * sat(a, 0, 0.2), color: '#FFF3B0', glow: 'rgba(255,220,120,0.9)' }); }
      ctx.save(); ctx.translate(ex, ey); ctx.scale(s, s); ctx.fillStyle = '#FFE36B'; ctx.strokeStyle = '#5A3A00'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 13, 0, TAU); ctx.fill(); ctx.stroke(); ctx.restore(); }
  });
}

// F8 113.88–116.56  都拿去吧 不要钱: a seaside stall (bg39, Image 2: the sign 白饭管饱, a long queue happily eating); she ladles rice
// from the steaming tub behind the counter and the bowls (Image 2) sail out over the queue; the camera pans down the line
export const STALL = { me: [985, 560], counter: 548, tub: [960, 500] };   // bg39 (image px): behind the tub, the counter's back edge, the rice
export const TUB39 = [963, 498, 168, 44];                                // bg39: the tub's rim, an ellipse (centre, radii; image px)   // bg39 (image px): behind the rice tub (only head and shoulders above its rim), the rim, the rice
export function sF8(ctx, t) {
  const u = E.io(sat(t, 113.88, 118.1)), o = { z: lerp(1.08, 1.16, u), fx: lerp(0.72, 0.45, u), fy: 0.3 };
  backdrop(ctx, 'bg39_rice_stall', o);
  const M = bdMap('bg39_rice_stall', o), [mx, my] = M.pt(...STALL.me), cy = M.pt(0, STALL.counter)[1], [tx, ty] = M.pt(...STALL.tub);
  ctx.save(); ctx.beginPath();                                           // what of her shows: above the counter's back edge, outside the tub
  const P = (ix, iy) => M.pt(ix, iy), [cxT, cyT, rxT, ryT] = TUB39;
  const pts = [[-200, -400], [1800, -400], [1800, STALL.counter], [cxT + rxT, STALL.counter], [cxT + rxT, cyT]];
  for (let k = 0; k <= 24; k++) { const an = k / 24 * Math.PI; pts.push([cxT + Math.cos(an) * rxT, cyT - Math.sin(an) * ryT]); }   // the back half of the rim, right to left
  pts.push([cxT - rxT, cyT], [cxT - rxT, STALL.counter + 140], [-200, STALL.counter + 140]);   // left of the tub only the ladle reaches: in front of the bowls (本人 10-23)
  pts.forEach(([ix, iy], k) => { const [x, y] = P(ix, iy); k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.clip();
  const scoop = Math.sin((t - 113.9) * Math.PI / 0.4);
  char(ctx, 'd45', mx, my, 430 * M.s, { shadow: false, flip: true, rot: scoop * 0.05 });
  ctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'screen';                   // steam off the tub
  for (let k = 0; k < 8; k++) { const d = ((t - 113.8) * 0.6 + k / 8) % 1; ctx.fillStyle = rgba('#FFFFFF', 0.12 * Math.sin(d * Math.PI)); ctx.beginPath(); ctx.arc(tx - 90 * M.s + Math.sin(d * 5 + k) * 30 * M.s, ty - d * 260 * M.s, (24 + d * 40) * M.s, 0, TAU); ctx.fill(); }
  ctx.restore();
  for (let k = 0; k < 8; k++) {                                          // bowls flying out along the queue
    const t0 = 114.0 + k * 0.5, d = t - t0; if (d < 0 || d > 0.7) continue;
    const q = d / 0.7, [ex, ey] = M.pt(760 - k * 80, 640 - k * 22), bx = lerp(tx, ex, q), by = lerp(ty - 60 * M.s, ey, q) - Math.sin(q * Math.PI) * 180;
    prop(ctx, 'prop_rice_bowl', bx, by, 130 * M.s, { rot: q * 0.6 - 0.3, alpha: 1 - sat(q, 0.85, 1) });
  }
}

// G0 116.56–118.10  the stall's lights go out one by one; the frame goes dark into the bridge
export function sG0(ctx, t) {
  sF8(ctx, 116.5);
  const d = sat(t, 116.6, 117.9);
  ctx.fillStyle = `rgba(4,6,16,${E.in(d) * 0.96})`; ctx.fillRect(0, 0, W, H);
}
