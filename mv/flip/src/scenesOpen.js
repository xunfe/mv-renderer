// C6–C8 53.9–61.97 (分镜.md): open source, told with the map. She spreads the map (titled DeepSeek-R1, sealed 开源 · MIT)
// on the sea like a tablecloth; boats of all kinds come in, the map copies itself onto each of their sails and they set
// off; then the band stops and she offers the rolled-up copies to us: 都拿去吧 不要钱, ¥0, 开源. Times are on the full cut.
import { W, H, TAU, clamp, lerp, sat, E, rgba, font, SANS } from './lib.js';
import { char, breathe, anchorPt } from './chars.js';
import { backdrop, bdMap, prop, splash, ripples, glowWord, warpQuad, warpMesh, quadMap, img } from './common.js';

const HORIZON = 0.363;                       // bg17: the horizon, as a fraction of the image height (tools/bggrid.py)
const MAPQ = (o) => {                        // where the map lies on the sea (screen px), for the camera o
  const M = bdMap('bg17_dawn_sea', o), im = img('bg17_dawn_sea'), hy = (im ? im.height : 1024) * HORIZON;
  const w = im ? im.width : 1536, h = im ? im.height : 1024;
  return [M.pt(w * 0.3, hy + (h - hy) * 0.18), M.pt(w * 0.7, hy + (h - hy) * 0.18), M.pt(w * 1.05, h * 1.02), M.pt(w * -0.05, h * 1.02)];
};
// the seal: 开源 large, MIT small
export function seal(x, cx, cy, s, rot) {
  x.save(); x.translate(cx, cy); x.rotate(rot); x.scale(s, s);
  x.strokeStyle = '#D8263C'; x.fillStyle = '#D8263C'; x.lineWidth = 12; x.beginPath(); x.arc(0, 0, 118, 0, TAU); x.stroke();
  x.lineWidth = 4; x.beginPath(); x.arc(0, 0, 98, 0, TAU); x.stroke();
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = font(78, 900, SANS); x.fillText('开源', 0, -12);
  x.font = font(38, 900, SANS); x.fillText('MIT', 0, 52); x.restore();
}
function mapTex(x, sw, sh, t, o2 = {}) {
  const im = img('prop_map'); if (im) x.drawImage(im, 0, 0, sw, sh); else { x.fillStyle = '#F4E6C2'; x.fillRect(0, 0, sw, sh); }
  const routes = 9, p = sat(t, o2.r0 ?? 55.6, o2.r1 ?? 57.0);
  x.save(); x.strokeStyle = 'rgba(70,190,255,0.95)'; x.lineWidth = 9; x.shadowColor = 'rgba(80,200,255,1)'; x.shadowBlur = 24; x.setLineDash([26, 18]); x.lineDashOffset = -t * 120;
  for (let k = 0; k < routes; k++) { const an = -Math.PI + (k + 0.5) / routes * Math.PI, L = Math.min(sw, sh) * 0.62 * E.out(clamp(p * 1.6 - k * 0.07, 0, 1));
    x.beginPath(); x.moveTo(sw / 2, sh * 0.62); x.quadraticCurveTo(sw / 2 + Math.cos(an) * L * 0.5 + 40, sh * 0.62 + Math.sin(an) * L * 0.5, sw / 2 + Math.cos(an) * L * 1.3, sh * 0.62 + Math.sin(an) * L); x.stroke(); }
  x.restore();
  const tb = o2.title === 'off' ? 0 : o2.title === 0 ? 1 : E.out(sat(t, 55.3, 55.6));    // the title banner: this map is the model
  if (tb > 0) {
    x.save(); x.globalAlpha = tb; x.translate(sw / 2, sh * 0.13);
    x.fillStyle = '#1E3A8A'; x.strokeStyle = '#0B1E4D'; x.lineWidth = 6;
    x.beginPath(); x.moveTo(-330, -52); x.lineTo(330, -52); x.lineTo(370, 0); x.lineTo(330, 52); x.lineTo(-330, 52); x.lineTo(-370, 0); x.closePath(); x.fill(); x.stroke();
    x.fillStyle = '#FFFFFF'; x.font = font(66, 900, SANS); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('DeepSeek-R1', 0, 3);
    x.restore();
  }
  const st = o2.title === 0 ? 0 : 56.4;
  if (t > st) { const s = E.back(sat(t, st, st + 0.2)); seal(x, sw * 0.84, sh * 0.78, s * (1 + 0.4 * (1 - s)), -0.25); }
}

// C6 53.9–57.1  我把地图铺在海面 (本人 10-17: the first version's motion was poor). She stands big in the foreground with
// the rolled-up map held over her head; on 地 she flings it out to her right like a tablecloth: it unrolls through the air
// with a roll at its leading edge, billows open, and on 铺 floats down and lies flat on the sea beside her. The title
// banner shows, the routes light up, and on 面 the 开源 · MIT seal lands; she curtsies.
const FLAT6 = [[645, 476], [1382, 476], [1628, 993], [522, 993]];       // bg17 image px: where the map lies in this shot
export function sC6(ctx, t) {
  const o = { z: lerp(1.06, 1.1, sat(t, 53.9, 57.1)), fx: 0.5, fy: 0.6 };
  backdrop(ctx, 'bg17_dawn_sea', o);
  const M = bdMap('bg17_dawn_sea', o), flat = quadMap(FLAT6.map(q => M.pt(...q)));
  const x = 430, fy = 965, sz = 700;
  const id = t < 54.38 ? 'd23' : t < 56.35 ? 'd24' : 'd62';
  const wind = t < 54.38 ? -0.04 * Math.sin(sat(t, 54.0, 54.38) * Math.PI) : 0;                  // a little wind-up before the throw
  const cm = { shadow: false, sway: id === 'd24' ? 2 : 1.1, windX: id === 'd24' ? -0.8 : 0, rot: wind, sy: id === 'd62' ? 1 - 0.04 * Math.exp(-6 * (t - 56.35)) : 1 };
  const [hx, hy] = id === 'd23' ? anchorPt('d23', x, fy, sz, 556, 240, cm) : anchorPt('d24', x, fy, sz, 980, 640, cm);
  if (t >= 54.38) {
    const umax = E.out(sat(t, 54.38, 54.85)), drop = E.io(sat(t, 55.1, 55.8));
    const L = 1150, amp = 60 * (1 - drop);
    const air = (u, v) => {                                              // the cloth in the air, unrolling to the right
      const Hs = lerp(170, 560, u), dx = (t - 54.38) * 60;
      const bx = hx + u * L + dx, by = hy - Math.sin(Math.min(1, u * 1.1) * Math.PI * 0.8) * 230 + Math.sin(TAU * (u * 1.3 - t * 1.8)) * amp * u;
      return [bx + (v - 0.5) * 60 * u, by + (v - 0.5) * Hs + Math.sin(TAU * (v * 0.8 - t * 1.4 + u)) * 24 * (1 - drop)];
    };
    const P = (u, v) => { const uu = Math.min(u, umax), a = air(uu, v); if (drop <= 0) return a; const f = flat(uu, v); return [lerp(a[0], f[0], drop), lerp(a[1], f[1], drop)]; };
    warpMesh(ctx, P, 1200, 800, (c, sw, sh) => mapTex(c, sw, sh, t), { nu: 20, nv: 10, res: 0.8 });
    if (umax < 1) {                                                      // the roll at the leading edge
      const a = P(umax, 0), b = P(umax, 1);
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = '#3A2C1A'; ctx.lineWidth = 46; ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.stroke();
      ctx.strokeStyle = '#F4E6C2'; ctx.lineWidth = 36; ctx.stroke(); ctx.strokeStyle = '#3B6FD8'; ctx.lineWidth = 36; ctx.setLineDash([10, 1e4]); ctx.lineDashOffset = -Math.hypot(b[0] - a[0], b[1] - a[1]) / 2; ctx.stroke(); ctx.restore();
    }
    if (t > 55.75) {                                                     // it lands: a ring of ripples and spray along the edges
      const c = flat(0.5, 0.55);
      ripples(ctx, t, c[0], c[1], 520, { alpha: 0.6 * (1 - sat(t, 55.75, 57.0)), speed: 0.8, flat: 0.25 });
      splash(ctx, t, 55.78, flat(0.08, 0.95)[0], flat(0.08, 0.95)[1], { n: 26, scale: 0.8, life: 0.8, seed: 2 });
      splash(ctx, t, 55.8, flat(0.95, 0.9)[0], flat(0.95, 0.9)[1], { n: 26, scale: 0.8, life: 0.8, seed: 5 });
    }
  }
  ripples(ctx, t, x, fy - 6, 200);
  char(ctx, id, x, fy, sz, cm);
}

// C7 57.1–59.7  谁想去远方: boats gather at the edges of the map; on 远 a copy of the map lifts off and flies onto each
// sail; on 方 they set off towards the horizon
const BOATS = [[-0.95, 0.30, 0], [-0.6, 0.12, 1], [-0.25, 0.04, 0], [0.25, 0.04, 1], [0.6, 0.12, 0], [0.95, 0.30, 1], [-0.75, 0.62, 1], [0.75, 0.62, 0]];
export function sC7(ctx, t) {
  const o = { z: lerp(1.12, 1.02, E.io(sat(t, 57.1, 59.7))), fx: 0.5, fy: 0.62 };
  backdrop(ctx, 'bg17_dawn_sea', o);
  const q = MAPQ(o);
  warpQuad(ctx, q, 1200, 800, (c, sw, sh) => mapTex(c, sw, sh, t + 10, { title: 0 }), { res: 0.8 });
  const hy = bdMap('bg17_dawn_sea', o).pt(0, (img('bg17_dawn_sea')?.height ?? 1024) * HORIZON)[1];
  const mc = [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];
  if (t > 57.94 && t < 58.4) {                                           // the big map glows as it gives away its copies
    ctx.save(); ctx.globalCompositeOperation = 'screen'; const a = Math.sin(sat(t, 57.94, 58.4) * Math.PI);
    const g = ctx.createRadialGradient(mc[0], mc[1], 0, mc[0], mc[1], 600); g.addColorStop(0, rgba('#CFF3FF', 0.5 * a)); g.addColorStop(1, 'rgba(200,240,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  }
  BOATS.forEach(([u, v, kind], k) => {
    const side = Math.sign(u);
    const arr = E.out(sat(t, 57.1 + k * 0.05, 57.7 + k * 0.05));          // arrive from outside the frame, bobbing
    const bx0 = W / 2 + u * 980, by0 = lerp(hy + 90, 980, v);
    let x = lerp(bx0 + side * 700, bx0, arr), y = by0 + Math.sin(t * 3 + k) * 6;
    const lv = E.in(sat(t, 58.66 + k * 0.04, 59.7 + k * 0.04));          // leave towards the horizon, smaller
    x = lerp(x, W / 2 + u * 1500, lv); y = lerp(y, hy + 12, lv * (v < 0.5 ? 1 : 0.6));
    const sc = lerp(1, 0.35, lv) * lerp(0.75, 1.15, v);
    const id = kind ? 'prop_boat_map2' : 'prop_boat_map';
    prop(ctx, img(id) ? id : 'prop_boat', x, y, 300 * sc, { flip: side < 0 });
    const t0 = 57.94 + k * 0.06, f = sat(t, t0, t0 + 0.45);              // its copy flies from the big map onto the sail
    if (f > 0 && f < 1) {
      const e = E.io(f), cx = lerp(mc[0], x, e), cy = lerp(mc[1], y - 90 * sc, e) - Math.sin(e * Math.PI) * 220;
      prop(ctx, 'prop_map', cx, cy, lerp(220, 90 * sc, e), { rot: (1 - e) * 0.6 * side, alpha: 1 - sat(f, 0.85, 1) });
    }
    if (f >= 1 && t < t0 + 0.7) { const a = 1 - sat(t, t0 + 0.45, t0 + 0.7); ctx.save(); ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = rgba('#BFE9FF', 0.8 * a); ctx.beginPath(); ctx.arc(x, y - 90 * sc, 80 * sc, 0, TAU); ctx.fill(); ctx.restore(); }
  });
}

// a rolled-up map, drawn
function scroll(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#F4E6C2'; ctx.strokeStyle = '#3A2C1A'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(-90, -26, 180, 52, 26); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(70,150,230,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-60, -10); ctx.lineTo(60, -14); ctx.moveTo(-50, 10); ctx.lineTo(70, 8); ctx.stroke();
  ctx.fillStyle = '#3B6FD8'; ctx.fillRect(-10, -28, 20, 56); ctx.strokeStyle = '#1E3A8A'; ctx.lineWidth = 3; ctx.strokeRect(-10, -28, 20, 56);
  ctx.restore();
}
// C8 59.7–61.97  都拿去吧 不要钱
const OFFER = [['都', 59.79], ['拿', 59.96], ['去', 60.11], ['吧', 60.54], ['不', 60.84], ['要', 61.14], ['钱', 61.44]];
export function sC8(ctx, t) {
  const stop = sat(t, 60.43, 60.6);                                      // the band stops: the picture holds its breath
  const o = { z: 1.06 + 0.03 * sat(t, 59.7, 60.43), fx: 0.5, fy: 0.62 };
  backdrop(ctx, 'bg17_dawn_sea', o);
  warpQuad(ctx, MAPQ(o), 1200, 800, (c, sw, sh) => mapTex(c, sw, sh, Math.min(t, 60.43) + 10, { title: 'off' }), { res: 0.8 });
  ctx.fillStyle = `rgba(10,16,40,${0.28 * stop})`; ctx.fillRect(0, 0, W, H);
  const x = 1300, fy = 965, sz = 760;
  char(ctx, 'd18', x, fy, sz, { shadow: false, ...(stop < 1 ? breathe(t) : {}) });
  const [tx, ty] = anchorPt('d18', x, fy, sz, 388, 770);
  const left = 3 - [60.84, 61.14, 61.44].filter(t0 => t >= t0).length;   // the pile on the tray gets smaller as copies fly to us
  if (globalThis.__noTrayPile) {} else if (img('prop_scrolls')) prop(ctx, 'prop_scrolls', tx, ty - 50, 210 * (0.75 + 0.08 * left));
  else for (let k = 0; k < left + 2; k++) scroll(ctx, tx - 50 + (k % 3) * 50, ty - 30 - Math.floor(k / 3) * 40, 0.6, 0.1);
  const sw = Math.sin(t * 3) * 0.1;                                      // the price tag on the tray: ¥0
  ctx.save(); ctx.translate(tx + 150, ty + 10); ctx.rotate(0.25 + sw);
  ctx.strokeStyle = '#3A2C1A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-40, -20); ctx.lineTo(-10, 30); ctx.stroke();
  ctx.fillStyle = '#FFE24A'; ctx.strokeStyle = '#7A2A10'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-10, 10); ctx.lineTo(120, 10); ctx.lineTo(120, 80); ctx.lineTo(-10, 80); ctx.lineTo(-34, 45); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#D8261E'; ctx.font = font(52, 900, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('¥0', 58, 47);
  ctx.restore();
  [60.84, 61.14, 61.44].forEach((t0, i) => {                             // a copy, rolled up, flies off the tray towards us
    if (t < t0) return; const d = t - t0, s = 0.7 + d * 4;
    scroll(ctx, tx + 200 + i * 40 + d * (500 + i * 260), ty - 60 - d * (620 - i * 120), s, -0.4 + d * 3 * (i % 2 ? 1 : -1));
  });
  OFFER.forEach(([ch, t0], i) => {                                       // 都拿去吧 small, 不要钱 big
    if (t < t0 - 0.03) return;
    const big = i >= 4, size = big ? 150 : 70, p = E.back(sat(t, t0 - 0.03, t0 + 0.16));
    const x0 = big ? 590 + (i - 5) * 170 : 590 + (i - 1.5) * 84, y = big ? 560 : 400;
    ctx.save(); ctx.translate(x0, y); ctx.scale(p, p);
    glowWord(ctx, ch, 0, 0, size, { color: big ? '#FFF6D8' : '#FFFFFF', glow: big ? 'rgba(255,200,90,0.95)' : 'rgba(90,200,255,0.9)' });
    ctx.restore();
  });
  if (t > 61.5) {                                                        // on 钱, the 开源 seal comes down beside it
    const s = E.out(sat(t, 61.5, 61.62)); seal(ctx, 590, 790, lerp(1.8, 0.85, s), -0.15);
    if (t < 61.7) { ctx.fillStyle = rgba('#FFFFFF', 0.3 * (1 - sat(t, 61.5, 61.7))); ctx.fillRect(0, 0, W, H); }
  }
}
