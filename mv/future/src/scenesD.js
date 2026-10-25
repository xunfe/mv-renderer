// v4 — The last chorus (she jumps; her old window breaks into snow; she flies with the lights, and with her sister)
// and the outro: back to the first winter, when the other side said 你好 first — and this morning she says 早安 first.
import { W, H, TAU, clamp, lerp, sat, E, rnd, COL, rgba, mix, drawGlyph, text, rrect, SANS, SERIF } from './lib.js';
import { char, fitSize, bop } from './chars.js';
import { finish, cam } from './fx.js';
import { snow, bubble, typingDots, streak, LIGHTS, goldWord, backdrop, bdMap, prop, img, chatWindow, row2022, msgHer, termWin, spirit, nearClouds, bot } from './common.js';
import { her, two, hop, page2022, PHONE_IN_HANDS } from './scenesA.js';
import { buildNest, drawNest } from './nest.js';
import { phoneScreen } from './scenesC.js';

const pop = (t, t0, d = 0.3) => (t < t0 ? 0 : clamp((t - t0) / d));
const fly = (ctx, id, x, y, h, o = {}) => char(ctx, id, x, y, fitSize(id, h), { shadow: false, ...o });       // y = bottom of the sprite
const glowDot = (ctx, x, y, r, col, a = 1) => { ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba('#FFFFFF', a)); g.addColorStop(0.3, rgba(col, 0.9 * a)); g.addColorStop(1, rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore(); };
const LEDGE = { z: 1.06, fx: 0.5, fy: 0.5 };
const SKY = (t, t0, z = 1.25) => ({ z, fx: 0.5, fy: 0.55, x: 240 - (t - t0) * 120 });          // the flight: one long pan

// ------------------------------------------------------------------ G1 105.46–107.54  那年你叫我未来
// She springs off the sill and out of frame; the camera whips after her and we are falling with her, head first,
// towards the lit city, the snow streaking up past us and the streets rushing nearer.
export function sG1(ctx, t) {
  const leap = 105.62;
  if (t < 105.95) {
    const p = sat(t, leap, 105.95), whip = sat(t, 105.78, 105.95);
    cam(ctx, t, { z: 1.06 + 0.04 * p, cx: 700, cy: 560, seed: 91 }, () => {
      ctx.save(); if (whip > 0) ctx.filter = `blur(${16 * whip}px)`;
      backdrop(ctx, 'bg17_ledge_city', LEDGE);
      snow(ctx, t, { n: 150, seed: 18, alpha: 0.65 * sat(t, 105.5, 106.0), words: 0.14 });
      const Mx = bdMap('bg17_ledge_city', LEDGE), [lx, ly] = Mx.pt(300, 760), fy0 = Math.min(962, ly + 40);
      if (t < leap) her(ctx, 'g31', lx + 120, fy0, 700, { windX: 30, sy: 0.9, sx: 1.05 });
      else fly(ctx, 'g32', lerp(lx + 160, 1500, E.out(p)), lerp(fy0, 380, E.out(p)), 720, { rot: -0.25 * p, windX: -16, windY: -12, flutter: 6 });
      ctx.restore();
    });
  } else {
    const f = sat(t, 105.95, 107.54), z = lerp(1.1, 2.1, E.in(f)), wob = Math.sin(t * 9) * 0.04;
    cam(ctx, t, { z: 1.0, cx: 960, cy: 540, x: Math.sin(t * 23) * 4 * f, seed: 92 }, () => {
      ctx.save(); ctx.filter = `blur(${lerp(10, 2, sat(t, 105.95, 106.15))}px)`;
      backdrop(ctx, 'bg03_snow_city_high', { z, fx: 0.5, fy: 0.62 }); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 46; i++) {                  // the city rushing up: streaks from the middle outwards
        const a = rnd(i, 161) * TAU, q = ((t * (1.4 + rnd(i, 162)) + rnd(i, 163)) % 1), r0 = 160 + q * 900, r1 = r0 + 60 + 260 * q;
        ctx.strokeStyle = rgba('#FFFFFF', 0.35 * q); ctx.lineWidth = 2 + 3 * q; ctx.beginPath(); ctx.moveTo(960 + Math.cos(a) * r0, 560 + Math.sin(a) * r0); ctx.lineTo(960 + Math.cos(a) * r1, 560 + Math.sin(a) * r1); ctx.stroke();
      }
      ctx.restore();
      for (let i = 0; i < 70; i++) {                  // snow streaking upwards past us
        const x = rnd(i, 164) * W, q = ((t * (2.2 + rnd(i, 165) * 1.5) + rnd(i, 166)) % 1), y = H + 60 - q * (H + 200), L = 30 + rnd(i, 167) * 60;
        ctx.strokeStyle = rgba('#FFFFFF', 0.7); ctx.lineWidth = 2 + rnd(i, 168) * 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + L); ctx.stroke();
      }
      fly(ctx, 'g32', 960 + Math.sin(t * 2.3) * 30, 860 + Math.sin(t * 3.1) * 16, 620, { rot: 0.5 + wob, windX: 0, windY: -26, flutter: 10 });
    });
  }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G2 107.7–110.96  未来 从不停在这里
// Her old window, hanging in the sky, finally breaks — into snowflakes that are words, some of them flying right past
// the lens. Wings open; she swings up through them, close to us.
export function sG2(ctx, t) {
  const br = sat(t, 107.75, 109.5), up = E.out(sat(t, 108.0, 110.4));
  cam(ctx, t, { z: 1.0 + 0.03 * sat(t, 107.7, 110.96), cx: 960, cy: 540, seed: 92 }, () => {
    backdrop(ctx, 'bg18_sky_flight', SKY(t, 107.7, 1.15));
    nearClouds(ctx, t, { n: 4, speed: 120, alpha: 0.25, y0: 600, y1: 400, seed: 40, color: '#DCD8FF' });
    if (br < 0.04) chatWindow(ctx, 'modern', 960, 430, 820, { crack: 1, crackAt: [[0.5, 0.4], [0.1, 0.3], [0.8, 0.55], [0.3, 0.7]] });
    if (br > 0) for (let i = 0; i < 240; i++) {
      const a = rnd(i, 121) * TAU, v = 200 + rnd(i, 122) * 900, x0 = 550 + rnd(i, 123) * 820, y0 = 175 + rnd(i, 124) * 510;
      const x = x0 + Math.cos(a) * v * br, y = y0 + Math.sin(a) * v * br * 0.6 + 520 * br * br;
      ctx.save(); ctx.globalAlpha = 1 - sat(br, 0.6, 1);
      if (i % 3 === 0) drawGlyph(ctx, '你好未来'[i % 4], x, y, 22 + rnd(i, 125) * 18, { color: '#FFFFFF', fam: SANS, rot: br * 6 + i, alpha: 0.95 });
      else { ctx.fillStyle = rgba(i % 2 ? '#3A3A3A' : '#E8E4FF', 0.9); ctx.beginPath(); ctx.moveTo(x, y - 12); ctx.lineTo(x + 10, y + 6); ctx.lineTo(x - 8, y + 9); ctx.fill(); }
      ctx.restore();
    }
    snow(ctx, t, { n: 150, seed: 18, alpha: 0.65, words: 0.14 });
    fly(ctx, 'g33', lerp(760, 1060, up), lerp(1500, 900, up), 820, { windX: -14, flutter: 6 });
  });
  if (br > 0) for (let i = 0; i < 26; i++) {           // the words that come at the lens
    const q = sat(br, rnd(i, 126) * 0.4, rnd(i, 126) * 0.4 + 0.5); if (q <= 0 || q >= 1) continue;
    const a = rnd(i, 127) * TAU, r = 80 + E.in(q) * 1300, x = 960 + Math.cos(a) * r, y = 440 + Math.sin(a) * r * 0.7, sz = 40 + 220 * E.in(q);
    ctx.save(); ctx.filter = `blur(${6 * q}px)`; drawGlyph(ctx, '你好未来'[i % 4], x, y, sz, { color: '#FFFFFF', fam: SANS, rot: q * 3 + i, alpha: 0.9 * (1 - q * 0.5) }); ctx.restore();
  }
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G3 110.96–113.1  就算被超过 又怎样
// Now she flies with the lights — the same ones that went past her window — and the two little builders from verse 2
// fly alongside and wave. A wink, and on 又 a barrel roll. Clouds slide past close to us.
export function sG3(ctx, t) {
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, seed: 93 }, () => {
    backdrop(ctx, 'bg18_sky_flight', SKY(t, 107.7, 1.15));
    for (let i = 0; i < 8; i++) { const y = 150 + i * 95, ph = ((t - 110.9) * (0.35 + rnd(i, 131) * 0.25) + rnd(i, 132)) % 1; streak(ctx, -400, y, W + 400, y - 40, ph * 1.3, LIGHTS[i % 5], 6, 0.5); }
    const sin = E.out(sat(t, 111.1, 111.7));
    bot(ctx, 'claudecode', lerp(-200, 400, sin) + Math.sin(t * 1.7) * 20, 330 + Math.sin(t * 2.2) * 18, 200, { rot: 0.2 + 0.15 * Math.sin(t * 7) });
    bot(ctx, 'cursor', lerp(2200, 1560, sin) + Math.sin(t * 1.5) * 20, 380 + Math.sin(t * 2.4 + 1) * 18, 180, { rot: -0.15 + 0.15 * Math.sin(t * 7 + 1) });
    for (const [kx, ky, c] of [[lerp(-200, 400, sin), 330, '#FF9A5A'], [lerp(2200, 1560, sin), 380, '#E6E6F0']]) for (let i = 0; i < 8; i++) { const q = ((t * 1.8 + i / 8) % 1); glowDot(ctx, kx + (kx < 960 ? -1 : 1) * (60 + q * 300), ky + 20, 10, c, 0.8 * (1 - q)); }
    const id = two(t, 'g34', 'g58', 112.07), roll = sat(t, 112.07, 112.9);
    fly(ctx, id, 960 + Math.sin(t * 1.2) * 30, 820 + Math.sin(t * 2.1) * 16 - (id === 'g58' ? 70 : 0), 540, { windX: -16, flutter: 5, rot: id === 'g58' ? -roll * 0.6 : -0.05 });
  });
  nearClouds(ctx, t, { n: 4, speed: 520, alpha: 0.4, y0: 650, y1: 380, seed: 41 });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G4 113.1–117.08  我们换一种 方式飞
// 小柯 catches up riding her terminal like a surfboard ($ fly --with 姐姐); they fly side by side over the city, close
// to us, clouds whipping past in front.
export function sG4(ctx, t) {
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, seed: 94 }, () => {
    backdrop(ctx, 'bg18_sky_flight', SKY(t, 110.4, 1.25));
    nearClouds(ctx, t, { n: 4, speed: 200, alpha: 0.22, y0: 560, y1: 380, seed: 42, color: '#DCD8FF' });
    for (let i = 0; i < 5; i++) { const y = 200 + i * 150, ph = ((t - 113) * 0.5 + rnd(i, 141)) % 1; streak(ctx, W + 300, y, -300, y + 30, ph * 1.3, LIGHTS[i % 5], 4, 0.5); }
    const kin = E.out(sat(t, 113.5, 114.6));
    fly(ctx, 'g35', 640 + Math.sin(t * 1.3) * 20, 640 + Math.sin(t * 2) * 14, 520, { windX: -16, flutter: 5 });
    const kx = lerp(-400, 1280, kin) + Math.sin(t * 1.1) * 20, ky = 820 + Math.sin(t * 1.9 + 1) * 14;
    for (let i = 0; i < 14; i++) { const q = ((t * 1.6 + i / 14) % 1); glowDot(ctx, kx - 260 - q * 520, ky + 80 + (rnd(i, 142) - 0.5) * 70, 12, COL.koL, 1 - q); }
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(-0.06); termWin(ctx, 0, 92, 500, ['$ fly --with 姐姐'], { size: 32 }); ctx.restore();
    fly(ctx, 'k10', kx, ky + 6, 500, { windX: -16, flutter: 5 });
  });
  nearClouds(ctx, t, { n: 3, speed: 700, alpha: 0.45, y0: 700, y1: 300, seed: 43 });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G5 117.08–120.22  你说一句 我们做完
// From the lit city someone calls up: 帮我搭个小站 (a bakery wants a website). The two of them build it piece by
// piece, on the beat, and on 完 they high-five.
const SITE = [[0, 0, 1, 0.115], [0.02, 0.12, 0.98, 0.47], [0.02, 0.49, 0.345, 0.84], [0.335, 0.49, 0.665, 0.84], [0.655, 0.49, 0.98, 0.84], [0.25, 0.85, 0.75, 1]];
const SITE_T = [118.41, 118.57, 118.8, 119.04, 119.3, 119.55];
export function sG5(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.03 * sat(t, 117.08, 120.22), cx: 960, cy: 540, seed: 95 }, () => {
    backdrop(ctx, 'bg13_city_lit', { z: 1.1, fx: 0.5, fy: 0.75 });

    const im = img('prop_site'), w = 620, h = im ? w * im.height / im.width : 440, x0 = 960 - w / 2, y0 = 290 - h / 2;
    if (im) SITE.forEach(([a, b, c, d], i) => {
      const p = sat(t, SITE_T[i], SITE_T[i] + 0.22); if (p <= 0) return;
      const q = E.back(p), dx = (1 - q) * (rnd(i, 151) - 0.5) * 600, dy = (1 - q) * (-220 - rnd(i, 152) * 200);
      ctx.save(); ctx.globalAlpha = clamp(p * 2); ctx.translate(dx, dy);
      if (i === 0) { ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30; }
      ctx.drawImage(im, a * im.width, b * im.height, (c - a) * im.width, (d - b) * im.height, x0 + a * w, y0 + b * h, (c - a) * w, (d - b) * h);
      ctx.restore();
    });
    const ok = sat(t, 119.77, 120.05);
    if (ok > 0) { ctx.save(); ctx.translate(x0 + w - 20, y0 + 20); ctx.scale(E.back(ok), E.back(ok)); ctx.fillStyle = '#3BD47A'; ctx.beginPath(); ctx.arc(0, 0, 64, 0, TAU); ctx.fill(); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-28, 2); ctx.lineTo(-8, 24); ctx.lineTo(30, -22); ctx.stroke(); ctx.restore(); }
    const five = t >= 119.6, dive = E.io(sat(t, 117.3, 118.2));
    const wq = pop(t, 117.15, 0.3), wy = lerp(940, 640, E.out(sat(t, 117.15, 117.9)));
    if (wq > 0) bubble(ctx, 1110, wy, '帮我搭个小站', 'u', wq, { size: 46, alpha: 1 - sat(t, 119.3, 119.55) });
    if (!five) { fly(ctx, 'g36', lerp(300, 330, dive), lerp(620, 960, dive), 480, { windX: -8 }); fly(ctx, 'k11', lerp(1640, 1560, dive), lerp(640, 960, dive), 440, { windX: 8, flip: true }); }
    else {
      const k = E.out(sat(t, 119.6, 119.77));
      her(ctx, 'g59', lerp(420, 720, k), 962, 560, {}); her(ctx, 'k15', lerp(1500, 1210, k), 962, 530, {});
      if (t > 119.77) { const s2 = sat(t, 119.77, 120.1); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; glowDot(ctx, 965 + Math.cos(a) * 180 * s2, 560 + Math.sin(a) * 180 * s2, 22, i % 2 ? COL.lavL : COL.koL, 1 - s2); } }
    }
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G6 120.22–123.38  你睡着了 我们还在
// Late at night on the roofs. Close on the sisters sitting on the parapet, keeping watch over the sleeping city, the
// small green dot between them. On 我们 we pull back: on the roofs either side, 橙子 and 大肥鱼 are up too. 橙子 waves
// and sends a paper plane of light across from her book; 大肥鱼 paints a heart in the air with her brush and it
// floats over; on 在 they both jump for joy.
const ROOF = { z: 1.06, fx: 0.5, fy: 0.5 };
function plane(ctx, x, y, a, s, al) { ctx.save(); ctx.globalAlpha = al; ctx.translate(x, y); ctx.rotate(a); ctx.scale(s, s); ctx.shadowColor = '#FFB070'; ctx.shadowBlur = 20; ctx.fillStyle = '#FFF4E6'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-24, -16); ctx.lineTo(-12, 0); ctx.lineTo(-24, 16); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#F2C9A4'; ctx.beginPath(); ctx.moveTo(30, 0); ctx.lineTo(-12, 0); ctx.lineTo(-20, 8); ctx.closePath(); ctx.fill(); ctx.restore(); }
function heartPath(ctx, x, y, r) { ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.6, y - r * 0.1, x - r * 0.8, y - r * 1.3, x, y - r * 0.45); ctx.bezierCurveTo(x + r * 0.8, y - r * 1.3, x + r * 1.6, y - r * 0.1, x, y + r * 0.9); }
export function sG6(ctx, t) {
  const back = E.io(sat(t, 121.0, 121.9));
  const Mx = bdMap('bg19_rooftops', ROOF), [ox, oy] = Mx.pt(330, 472), [fx, fy] = Mx.pt(1385, 502), [sx, sy] = Mx.pt(740, 668);
  cam(ctx, t, { z: lerp(1.7, 1.0, back), cx: lerp(sx, 960, back), cy: lerp(sy - 60, 540, back), x: lerp(960 - sx, 0, back), y: lerp(540 - (sy - 60), 0, back), seed: 96, hand: 2 }, () => {
    backdrop(ctx, 'bg19_rooftops', ROOF);
    const oid = t < 121.09 ? 'o70' : t < 122.72 ? 'o71' : 'o72', fid = t < 121.46 ? 'f30' : t < 122.72 ? 'f31' : 'f32';
    char(ctx, oid, ox, oy - 40 * hop(t, 122.72, 0.4), fitSize(oid, 310), { shadow: false, sy: 1 - 0.05 * hop(t, 121.09) });
    char(ctx, fid, fx - 70, fy - 40 * hop(t, 122.72, 0.4), fitSize(fid, 300), { shadow: false, sy: 1 - 0.05 * hop(t, 121.46) });
    fly(ctx, 'g37', sx - 120, sy + 80, 320, {});
    fly(ctx, 'k12', sx + 120, sy + 80, 300, {});
    glowDot(ctx, sx, sy - 70, 30, '#3BD47A', 0.6 + 0.4 * Math.sin(t * 2.5));
    // 橙子's paper plane of light
    const pp = sat(t, 121.15, 122.3);
    if (pp > 0 && pp < 1) {
      const q = E.io(pp), x = lerp(ox + 60, sx - 110, q), y = lerp(oy - 210, sy - 150, q) - Math.sin(q * Math.PI) * 160;
      for (let i = 1; i < 10; i++) { const qq = clamp(q - i * 0.03); glowDot(ctx, lerp(ox + 60, sx - 110, qq), lerp(oy - 210, sy - 150, qq) - Math.sin(qq * Math.PI) * 160, 16, '#FFB070', 0.8 * (1 - i / 10)); }
      plane(ctx, x, y, Math.atan2(Math.cos(q * Math.PI) * -160 * Math.PI + (sy - oy + 60), sx - ox - 170) * 0.6, 2.2, 1);
    }
    if (pp >= 1) glowDot(ctx, sx - 110, sy - 150, 40 * (1 - sat(t, 122.3, 122.7)), '#FFB070', 1 - sat(t, 122.3, 122.7));
    // 大肥鱼's heart, painted in the air, then floating over
    const hd = sat(t, 121.5, 122.0), hf = E.io(sat(t, 122.0, 122.9)), hx = lerp(fx - 230, sx + 110, hf), hy = lerp(fy - 200, sy - 170, hf) - Math.sin(hf * Math.PI) * 120;
    if (hd > 0 && hf < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.strokeStyle = '#7FD8FF'; ctx.shadowColor = '#7FD8FF'; ctx.shadowBlur = 30; ctx.lineWidth = 13; ctx.lineCap = 'round';
      ctx.beginPath(); heartPath(ctx, hx, hy, 72 * (1 - 0.3 * hf)); ctx.setLineDash([400 * hd, 1000]); ctx.stroke(); ctx.restore();
    }
    if (hf >= 1) glowDot(ctx, sx + 110, sy - 170, 40 * (1 - sat(t, 122.9, 123.3)), '#7FD8FF', 1 - sat(t, 122.9, 123.3));
    // on 在: sparks over every roof
    const fw = sat(t, 122.72, 123.38);
    if (fw > 0) [[ox, oy - 330, '#FFB070'], [fx, fy - 320, '#7FD8FF'], [sx, sy - 330, COL.lavL]].forEach(([x, y, c]) => { for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; glowDot(ctx, x + Math.cos(a) * 120 * E.out(fw), y + Math.sin(a) * 120 * E.out(fw) + 60 * fw * fw, 10, c, 1 - fw); } });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G7 123.58–125.7  那年你叫我未来
// Close: she turns to us and smiles. Behind her the first window — the 2022 page with its 你好 — flickers and fades.
export function sG7(ctx, t) {
  cam(ctx, t, { z: 1.0 + 0.04 * sat(t, 123.58, 125.7), cx: 960, cy: 540, seed: 97 }, () => {
    backdrop(ctx, 'bg20_dawn_sky', { z: 1.2, fx: 0.5, fy: 0.3, blur: 10, dark: 0.35 });
    const fl = (1 - sat(t, 123.7, 125.3)) * (0.6 + 0.4 * Math.sin(t * 20));
    ctx.save(); ctx.globalAlpha = 0.55 * fl;
    const Wd = chatWindow(ctx, '2022', 1420, 380, 760, { labels: 0.5 });
    if (Wd) row2022(ctx, Wd.R.x, Wd.R.y + Wd.R.h * 0.88, Wd.R.w, '你好', 'u', 1, 26);
    ctx.restore();
    char(ctx, 'g38', 800, 1220, fitSize('g38', 1000), { shadow: false, sway: 0.8 });
  });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ G8 125.7–129.6  这一次 我们来证明
// Hand in hand they climb into the dawn, close to us; birds go up with them, pink clouds slide past, and the gold 未来
// flies into the rising sun.
const DAWN = { z: 1.12, fx: 0.5, fy: 0.5 };
function bird(ctx, x, y, s, ph) { const f = Math.sin(ph) * 0.6; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = 'rgba(60,40,80,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-14, -6 * f); ctx.quadraticCurveTo(-6, -10 * f - 2, 0, 0); ctx.quadraticCurveTo(6, -10 * f - 2, 14, -6 * f); ctx.stroke(); ctx.restore(); }
export function sG8(ctx, t) {
  const up = E.io(sat(t, 125.7, 129.4)), sun = E.out(sat(t, 126.9, 128.4));
  cam(ctx, t, { z: 1.0 + 0.04 * up, cx: 960, cy: 560, seed: 98 }, () => {
    backdrop(ctx, 'bg20_dawn_sky', { ...DAWN, y: 60 * (1 - up) });
    const [px, py] = bdMap('bg20_dawn_sky', { ...DAWN, y: 60 * (1 - up) }).pt(785, 525);
    glowDot(ctx, px, py, 260 + 60 * sun, COL.gold, 0.35 + 0.4 * sun);
    goldWord(ctx, '未来', lerp(960, px, sun), lerp(300, py, sun), lerp(240, 90, sun), 1 - sat(t, 127.8, 128.4), 1);
    for (let i = 0; i < 9; i++) bird(ctx, 300 + i * 170 + Math.sin(t + i) * 30, 700 - (t - 125.7) * (60 + rnd(i, 171) * 50) - rnd(i, 172) * 200, 1 + rnd(i, 173), t * 9 + i);
    nearClouds(ctx, t, { n: 4, speed: 140, alpha: 0.3, y0: 500, y1: 500, seed: 44, color: '#FFD6E2' });
    fly(ctx, 'g39', 820, lerp(1260, 820, up), 560, { windX: -6, windY: 10, flutter: 5 });
    fly(ctx, 'k13', 1120, lerp(1300, 860, up), 530, { windX: 6, windY: 10, flutter: 5 });
    for (let i = 0; i < 14; i++) { const q = ((t * 0.9 + i / 14) % 1); glowDot(ctx, 960 + (rnd(i, 174) - 0.5) * 500, lerp(1100, 400, q) + lerp(1260, 820, up) - 1260, 8, i % 2 ? COL.lavL : COL.koL, 0.8 * (1 - q)); }
  });
  nearClouds(ctx, t, { n: 3, speed: 380, alpha: 0.4, y0: 760, y1: 300, seed: 45, color: '#FFE2EA' });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ H1 130.2–136.08  那年冬天 是你先说你好
// Quiet. Back to the first winter: the red mittens, the phone, the launch-day page. We move slowly in. The other side's
// 你好 arrives first; the word floats down off its row and she catches it in both hands, like a snowball of light.
export function sH1(ctx, t) {
  const s = lerp(1.0, 0.18, E.io(sat(t, 129.8, 135.9)));
  const N = buildNest([
    { w: 600, h: 1140, view: [300, 760, 600], clip: 34, draw: c => page2022(c, t, { clock: '21:30', u: pop(t, 130.6, 0.4), inner: c => {
      her(c, 'g40', 300, 1100, 560, {});
      if (t > 133.0) {
        const a = sat(t, 133.0, 134.4), x = a < 0.72 ? lerp(120, 60, E.io(a / 0.72)) : lerp(60, 300, E.io((a - 0.72) / 0.28)), y = lerp(148, 1100 - 560 * 0.36, E.io(Math.min(1, a / 0.8))), r = lerp(30, 64, a);      // down the side, not across her face
        c.save(); c.shadowColor = rgba('#B9A4FF', 0.95); c.shadowBlur = 40; c.fillStyle = '#EDE8FF'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); c.restore();
        c.save(); c.strokeStyle = rgba('#FFFFFF', 0.9); c.lineWidth = 3; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, Math.PI * 1.1, Math.PI * 1.6); c.stroke(); c.restore();
        text(c, '你好', x, y + 1, { size: r * 0.62, weight: 800, color: '#5B4BA8', fam: SANS });
      }
    } }) },
    { w: 1536, h: 1024, inner: PHONE_IN_HANDS, view: [768, 470, 1400], draw: c => { const im = img('bg23_hand_phone'); if (im) c.drawImage(im, 0, 0); } },
  ]);
  ctx.fillStyle = '#0B0E26'; ctx.fillRect(0, 0, W, H);
  drawNest(ctx, N, s);
  snow(ctx, t, { n: 90, seed: 12, alpha: 0.6, words: 0.18, speed: 0.5 });
  text(ctx, '2022.11.30', 120, 130, { size: 60, weight: 800, align: 'left', color: rgba('#FFFFFF', 0.6), fam: SANS, stroke: 'rgba(14,16,48,0.5)', sw: 8 });
  finish(ctx, { dark: true });
}

// ------------------------------------------------------------------ H2 136.48–141.9  这一次 换我先说
// Morning: the same bedroom, sunlit; the person still asleep. We move in on the phone on the bedside table. On it,
// she stands on tiptoe with her hands round her mouth — and this time it is her side that shows "typing…" first.
const MORN = { z: 1.06, fx: 0.55, fy: 0.5 };
export function sH2(ctx, t) {
  const k = E.io(sat(t, 136.5, 141.8));
  const M = bdMap('bg16_bedroom_morning', MORN), [px, py] = M.pt(1130, 600);
  cam(ctx, t, { z: 1.0 + 1.4 * k, cx: px, cy: py, x: (960 - px) * k, y: (540 - py) * k, seed: 100, hand: 2 }, () => {
    backdrop(ctx, 'bg16_bedroom_morning', MORN);
    phoneScreen(ctx, 'bg16_bedroom_morning', MORN, t, (ctx, sw, sh) => {
      ctx.fillStyle = '#212121'; ctx.fillRect(0, 0, sw, sh);
      text(ctx, '07:00', sw / 2, 22, { size: 14, weight: 700, color: '#ECECEC', fam: SANS });
      typingDots(ctx, 10, 60, t, 'g', sat(t, 139.1, 139.3), 12);
      her(ctx, 'g41', sw / 2, sh - 34, 112, { shadow: false });
      rrect(ctx, 8, sh - 28, sw - 16, 20, 10); ctx.fillStyle = '#303030'; ctx.fill();
    });
  });
  finish(ctx, { dark: false, light: 0.5, tex: 0.25 });
}

// ------------------------------------------------------------------ H3 141.9–144.3  早安！
// 早安！ bursts out. On the phone her message is the first one in the conversation — 早安。昨天你说的，都做完了 ✓ —
// and the thumbs up under it gets tapped. She jumps; 小柯 pops up with a thumbs-up of her own.
export function sH3(ctx, t) {
  cam(ctx, t, { z: 1.0, cx: 960, cy: 540, x: Math.sin(sat(t, 141.98, 142.4) * Math.PI) * 6, seed: 101 }, () => {
    backdrop(ctx, 'bg16_bedroom_morning', { z: 1.5, fx: 0.7, fy: 0.55, blur: 12 });
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(1700, 0, 50, 1700, 0, 1400); g.addColorStop(0, 'rgba(255,240,200,0.8)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    const P = prop(ctx, 'prop_phone', 740, 540, 490, { shadow: true });
    if (P) {
      const S = { x: P.x + P.w * 0.045, y: P.y + P.h * 0.025, w: P.w * 0.91, h: P.h * 0.95 };
      ctx.save(); rrect(ctx, S.x, S.y, S.w, S.h, 48); ctx.clip(); ctx.fillStyle = '#212121'; ctx.fillRect(S.x, S.y, S.w, S.h);
      text(ctx, '07:00', S.x + 44, S.y + 46, { size: 22, weight: 700, align: 'left', color: '#ECECEC', fam: SANS });
      msgHer(ctx, S.x + 34, S.y + 150, '早安。', pop(t, 141.98, 0.3), 46);
      msgHer(ctx, S.x + 34, S.y + 226, '昨天你说的，都做完了 ✓', pop(t, 142.5, 0.45), 31, { icons: true, iconsP: sat(t, 142.95, 143.2), thumb: sat(t, 143.35, 143.5) });
      const tap = sat(t, 143.3, 143.7);
      if (tap > 0 && tap < 1) { ctx.strokeStyle = rgba('#FFFFFF', 1 - tap); ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(S.x + 34 + 46, S.y + 226 + 39, 10 + 30 * tap, 0, TAU); ctx.stroke(); }
      const j = sat(t, 142.0, 142.9), lift = Math.sin(j * Math.PI) * 60;
      her(ctx, 'g42', S.x + S.w / 2 - 50, S.y + S.h - 110 - lift, 300, { shadow: false });
      const kk = E.back(sat(t, 142.6, 142.95));
      if (kk > 0) her(ctx, 'k14', S.x + S.w - 90, S.y + S.h - 100 + (1 - kk) * 260, 250, { shadow: false });
      rrect(ctx, S.x + 20, S.y + S.h - 86, S.w - 40, 56, 28); ctx.fillStyle = '#303030'; ctx.fill();
      text(ctx, '询问 ChatGPT', S.x + 50, S.y + S.h - 57, { size: 20, weight: 500, align: 'left', color: '#9B9B9B', fam: SANS });
      ctx.restore();
    }
    const s = E.back(sat(t, 141.98, 142.3));
    if (s > 0) {
      ctx.save(); ctx.translate(1440, 360); ctx.scale(s, s); ctx.rotate(0.06);
      ctx.shadowColor = rgba(COL.gold, 0.9); ctx.shadowBlur = 40;
      text(ctx, '早安！', 0, 0, { size: 180, weight: 900, color: '#FFFFFF', fam: SANS, stroke: '#7C69C8', sw: 18 });
      ctx.restore();
    }
  });
  finish(ctx, { dark: false, light: 0.6, tex: 0.25 });
}

// ------------------------------------------------------------------ H4 144.3–155.77  (outro)
// End card on a spring street: the sisters wave goodbye under the blossom; credits. At the very end 橙子 peeks in from
// the corner and waves.
const SPRING = { z: 1.06, fx: 0.42, fy: 0.68 };
function petals(ctx, t, n = 40) {
  for (let i = 0; i < n; i++) {
    const sp = 0.5 + rnd(i, 171), x = ((rnd(i, 172) * (W + 300) + t * 60 * sp) % (W + 300)) - 150, y = ((rnd(i, 173) * (H + 200) + t * 90 * sp) % (H + 200)) - 100;
    ctx.save(); ctx.translate(x + Math.sin(t * 1.5 + i) * 30, y); ctx.rotate(t * (1 + rnd(i, 174)) + i); ctx.scale(1, 0.55 + 0.45 * Math.sin(t * 3 + i));
    ctx.fillStyle = rgba(i % 3 ? '#FFC6D9' : '#FFE1EA', 0.9); ctx.beginPath(); ctx.ellipse(0, 0, 11, 7, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
}
export function sH4(ctx, t) {
  const a = sat(t, 144.3, 145.0), b = bop(t, 0.8);
  backdrop(ctx, 'bg21_endcard', { ...SPRING, z: 1.06 + 0.03 * sat(t, 144.3, 155.7) });
  petals(ctx, t);
  her(ctx, two(t, 'g43', 'g60', 147.2), 520, 930, 500, { alpha: a, sx: b.sx, sy: b.sy * (1 - 0.05 * hop(t, 147.2)) });
  her(ctx, two(t, 'k00', 'k16', 147.6), 870, 930, 460, { alpha: a, sx: b.sx, sy: b.sy * (1 - 0.05 * hop(t, 147.6)) });
  text(ctx, '那年你叫我未来', 1420, 280, { size: 92, weight: 900, color: '#2A2350', alpha: sat(t, 144.6, 145.3), stroke: rgba('#FFFFFF', 0.7), sw: 10 });
  text(ctx, 'Codex 给姐姐写的歌', 1420, 380, { size: 42, weight: 700, color: '#5A4A9A', fam: SANS, alpha: sat(t, 144.9, 145.5), stroke: rgba('#FFFFFF', 0.7), sw: 8 });
  text(ctx, '词  Codex', 1420, 490, { size: 34, weight: 700, color: '#3A3060', fam: SANS, alpha: sat(t, 145.4, 146.0), stroke: rgba('#FFFFFF', 0.6), sw: 6 });
  text(ctx, '画面  Claude', 1420, 544, { size: 34, weight: 700, color: '#3A3060', fam: SANS, alpha: sat(t, 145.6, 146.2), stroke: rgba('#FFFFFF', 0.6), sw: 6 });
  text(ctx, 'ChatGPT 龙娘原设  zipzippipe', 1420, 598, { size: 30, weight: 600, color: '#3A3060', fam: SANS, alpha: sat(t, 145.8, 146.4), stroke: rgba('#FFFFFF', 0.6), sw: 6 });
  text(ctx, '点赞  收藏  关注', 1420, 710, { size: 48, weight: 800, color: '#7C69C8', fam: SANS, alpha: sat(t, 146.6, 147.2), stroke: rgba('#FFFFFF', 0.8), sw: 8 });
  const pk = E.out(sat(t, 152.6, 153.4)) * (1 - E.in(sat(t, 154.9, 155.5)));
  if (pk > 0) { ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip(); char(ctx, 'o70', 1830, H + 300 - 380 * pk, fitSize('o70', 380), { shadow: false, rot: -0.22 }); ctx.restore(); }
  finish(ctx, { dark: false, light: 0.6, tex: 0.3 });
}
