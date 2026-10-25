// Full version, after the first chorus (分镜.md 完整版): the interlude into the phone, verse 2 (the memes), pre-chorus 2
// (服务器繁忙). Times are on the full cut.
import { W, H, SS, TAU, clamp, lerp, sat, E, rnd, noise, rgba, font, SANS, pageFlip } from './lib.js';
import { char, breathe, anchorPt, walkBob, bop } from './chars.js';
import { backdrop, bdMap, prop, bubbles, splash, glowWord, balloon, thinkBox, warpQuad, maskedScreen, img } from './common.js';
import { dsChat, dsPhone, danmaku, editor, appIcon, wrap } from './ui.js';
import { sC8 } from './scenesOpen.js';

export const QS = {                                   // screens in the paintings (image px, TL TR BR BL: where the straight sides meet; tools/find_screen.py, which also writes the mask)
  phone: [[553, 68], [980, 68], [980, 903], [553, 903]],          // bg21
  monitor: [[663, 212], [1454, 212], [1454, 602], [663, 602]],    // bg22
  server: [[1114, 184], [1445, 102], [1445, 372], [1117, 396]],   // bg23
  hall: [[242, 152], [1293, 152], [1299, 525], [236, 525]],       // bg25
  laptop: [[236, 234], [979, 234], [993, 656], [213, 656]],       // bg30, bg30b
};
export const onBg = (id, o, quad) => { const M = bdMap(id, o); return quad.map(p => M.pt(...p)); };
// render a scene into a scratch layer (cleared before every use), to show it inside a screen
let LAYER = null;
export function layer(ctx, fn) {
  if (!LAYER || LAYER.width !== ctx.canvas.width) LAYER = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const l = LAYER.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.filter = 'none'; l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, LAYER.width, LAYER.height); l.setTransform(SS, 0, 0, SS, 0, 0); l.save(); fn(l); l.restore();
  return LAYER;
}
const lerpQ = (a, b, p) => a.map((q, i) => [lerp(q[0], b[i][0], p), lerp(q[1], b[i][1], p)]);
const FULLQ = [[0, 0], [W, 0], [W, H], [0, H]];
function stamp(ctx, str, x, y, size, rot, t, t0, color = '#E8262D') {
  if (t < t0) return; const p = E.out(sat(t, t0, t0 + 0.12)), s = lerp(2.2, 1, p);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= p;
  ctx.strokeStyle = color; ctx.lineWidth = size * 0.1; ctx.font = font(size, 900, SANS); const w = ctx.measureText(str).width;
  ctx.beginPath(); ctx.roundRect(-w / 2 - size * 0.35, -size * 0.75, w + size * 0.7, size * 1.5, size * 0.25); ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(str, 0, 4); ctx.restore();
}

// I0 61.97–63.72  the dawn sea shrinks into a phone in someone's hand; a thumb flick scrolls to the next video
export function sI0(ctx, t) {
  const o = { z: 1.06, fx: 0.5, fy: 0.5 };
  const shrink = E.io(sat(t, 61.97, 62.75)), swipe = E.io(sat(t, 62.95, 63.4)), dive = E.in(sat(t, 63.42, 63.72));
  const pq = onBg('bg21_phone_hand', o, QS.phone);
  const q = lerpQ(lerpQ(FULLQ, pq, shrink), FULLQ, dive);
  ctx.save(); const z = lerp(1, 1.0 + 0.9 * dive, 1); backdrop(ctx, 'bg21_phone_hand', { ...o, z: 1.06 * (1 + 0.8 * dive) }); ctx.restore();
  const a = layer(ctx, l => { sC8(l, Math.min(61.95, t)); if (globalThis.__sI0Extra) globalThis.__sI0Extra(l, Math.min(61.95, t)); });      // v2: the same tray picture as the shot before
  const b = layer2(ctx, l => videoFrame(l, t));
  warpQuad(ctx, q, 960, 540 * 1.0, (x, sw, sh) => {
    x.drawImage(a, 0, -swipe * sh, sw, sh);
    x.drawImage(b, 0, sh - swipe * sh, sw, sh);
  }, { res: 0.9, slot: 3 });
  if (t > 62.9 && t < 63.45) {                                         // the thumb flick
    const p = sat(t, 62.9, 63.4), [x0, y0] = pq[2];
    prop(ctx, 'prop_hand_reach', lerp(x0 + 40, x0 - 60, p), lerp(y0 - 80, y0 - 420, E.io(p)), 360, { rot: -1.3, alpha: Math.sin(p * Math.PI) });
  }
}
let LAYER2 = null;
function layer2(ctx, fn) {
  if (!LAYER2 || LAYER2.width !== ctx.canvas.width) LAYER2 = new OffscreenCanvas(ctx.canvas.width, ctx.canvas.height);
  const l = LAYER2.getContext('2d'); l.setTransform(1, 0, 0, 1, 0, 0); l.globalAlpha = 1; l.filter = 'none'; l.globalCompositeOperation = 'source-over';
  l.clearRect(0, 0, LAYER2.width, LAYER2.height); l.setTransform(SS, 0, 0, SS, 0, 0); l.save(); fn(l); l.restore();
  return LAYER2;
}
// D1's picture: a video of her room with danmaku over it
const DANMAKU = ['大肥鱼！', '蓝色大肥鱼', '吃白饭的神', '大肥鱼又摸鱼了', '鱼鱼可爱捏', '又去吃饭了？', '8块钱肘击360', '哈哈哈哈哈', '大肥鱼！！', '肥鱼姐姐', '思考过程比回答好看', '大肥鱼冲！', '服务器繁忙（bushi', '偷懒被抓到了', '嗯，'];
function videoFrame(ctx, t, o = {}) {
  backdrop(ctx, 'bg12_room', { z: 1.15, fx: 0.5, fy: 0.55 });
  const id = t < 65.33 ? 'd40' : 'd31', x = W / 2, fy = 962;
  // full version (本人 10-18: no standing still in the middle): she ducks and sways as the comments fly past her head
  const dodge = o.react && t < 65.3 ? Math.sin((t - 63.72) * Math.PI / 0.4) : 0;
  char(ctx, id, x + dodge * 26, fy - Math.abs(dodge) * 28, 720, { shadow: true, rot: dodge * 0.07, ...breathe(t) });
  danmaku(ctx, W, H, t, 63.3, DANMAKU, { rows: 5, y0: 70, rh: 76, size: 50, gap: 0.16, lap: 1.1, speed: 620 });
}

// D1 63.72–65.88  后来你们叫我大肥鱼: danmaku pour over her; on 大 a name tag slaps onto her chest; she pouts, then owns it
export function sD1(ctx, t) {
  const push = 1 + 0.1 * E.io(sat(t, 63.72, 65.88));                     // the camera eases in on her
  ctx.save(); ctx.translate(W / 2, 640); ctx.scale(push, push); ctx.translate(-W / 2, -640);
  videoFrame(ctx, t, { react: true });
  if (t >= 65.33) {
    const [tx, ty] = anchorPt('d31', W / 2, 962, 720, ...TAG_D31), p = E.back(sat(t, 65.33, 65.48)), s = lerp(2.4, 1, E.out(sat(t, 65.2, 65.33)));
    prop(ctx, 'prop_tag_hello', tx, ty, 290 * p * s, { rot: -0.08 });                // the name tag (Image 2, words and all)
    if (t < 65.7) { const a = 1 - sat(t, 65.33, 65.7); ctx.save(); ctx.translate(tx + 230, ty - 120); ctx.rotate(0.15); glowWord(ctx, '啪！', 0, 0, 90, { alpha: a, color: '#FFFFFF', stroke: '#1B2A6B', glow: 'rgba(120,180,255,0.9)' }); ctx.restore(); }
  }
  ctx.restore();
}
export const TAG_D31 = [372, 720];        // d31: the top of her apron (keyed sprite px, tools/grid.py)

// an Image 2 stamp print slammed on: big and faint, then down to size with a little bounce
function inkStamp(ctx, id, x, y, w, rot, t, t0) {
  if (t < t0) return; const p = E.out(sat(t, t0, t0 + 0.12)), bump = t > t0 + 0.12 ? Math.exp(-14 * (t - t0 - 0.12)) * 0.06 : 0;
  prop(ctx, id, x, y, w * (lerp(2.0, 1, p) + bump), { rot, alpha: p });
}
// D2 65.88–67.72  说我贪吃 说我偷懒: two panels slide in, 贪吃 then 偷懒, each stamped
export function sD2(ctx, t) {
  ctx.fillStyle = '#FFF6E6'; ctx.fillRect(0, 0, W, H);
  const pa = E.out(sat(t, 65.88, 66.1)), pb = E.out(sat(t, 66.79, 67.0));
  const panel = (x0, x1, off, fn) => { ctx.save(); ctx.translate(off, 0); ctx.beginPath(); ctx.moveTo(x0 + 60, 0); ctx.lineTo(x1 + 60, 0); ctx.lineTo(x1 - 60, H); ctx.lineTo(x0 - 60, H); ctx.closePath(); ctx.clip(); fn(); ctx.restore();
    ctx.save(); ctx.translate(off, 0); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(x1 + 60, 0); ctx.lineTo(x1 - 60, H); ctx.stroke(); ctx.restore(); };
  const split = lerp(W + 200, W / 2, pb);
  panel(-100, split, (1 - pa) * -1100, () => {
    backdrop(ctx, 'bg12_room', { z: 1.4, fx: 0.3, fy: 0.6, x: -300, filter: 'brightness(1.05)' });
    char(ctx, 'd33', 520, 990, 760, { shadow: false, ...bop(t, 2.2, 8) });
    for (let k = 0; k < 6; k++) { const d = (t * 1.4 + k / 6) % 1; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - d)})`; ctx.beginPath(); ctx.ellipse(470 + Math.sin(k * 2.1) * 90, 520 - d * 160, 14, 9, 0, 0, TAU); ctx.fill(); }   // rice flying
  });
  if (pb > 0) panel(W / 2, W + 100, (1 - pb) * 1100, () => {
    // a closer shot (本人 10-19: 偷懒的镜头大一点): the chaise fills the panel and the camera keeps easing in on her
    // 本人 10-19: closer, the camera a little higher, her centred in the panel and the same size as the eater on the left (760)
    const lo = { z: lerp(2.45, 2.55, sat(t, 66.79, 67.72)), fx: 0.42, fy: 0.62 };
    backdrop(ctx, 'bg12_room', lo);
    const M = bdMap('bg12_room', lo), [sx, sy] = M.pt(760, 712), ks = M.s / 3.125;
    char(ctx, 'd34', 1765, 790, 760 * ks, { shadow: false, ...breathe(t, 0.6) });      // whole, centred in the slanted panel
    [0, 1, 2].forEach(k => { const d = ((t - 66.8) * 0.8 + k / 3) % 1; if (t > 66.8) glowWord(ctx, 'z', 1795 + d * 90, 420 - d * 170, 54 + k * 12, { alpha: 1 - d, color: '#E8F0FF', glow: 'rgba(150,190,255,0.8)' }); });
  });
  inkStamp(ctx, 'prop_stamp_tanchi', 760, 760, 330, -0.18, t, 66.56);
  inkStamp(ctx, 'prop_stamp_toulan', 1730, 190, 290, 0.12, t, 67.26);
}

// D3 67.72–71.50  活干到一半 我说 我去吃饭 测完告诉我就行: the progress bar stalls at 50%; her reply pops up; she hangs a
// 吃饭中 sign on the monitor and walks off with her lunch
export function sD3(ctx, t) {
  const o = { z: lerp(1.08, 1.14, sat(t, 67.72, 71.5)), fx: 0.55, fy: 0.5 };
  backdrop(ctx, 'bg22_desk_monitor', o);
  const prog = Math.min(0.5, E.out(sat(t, 67.72, 68.54)) * 0.5);
  maskedScreen(ctx, 'bg22_desk_monitor', o, QS.monitor, 1600, 780, (x, sw, sh) => {
    editor(x, sw, sh, t, { progress: prog, term: [['$ python train.py', 67.75], ['Epoch 1/2 ...', 68.1], ['（等待测试结果）', 68.62]] });
    if (t > 69.25) {                                                     // her reply, as a chat bubble over the editor
      const p = E.back(sat(t, 69.25, 69.5)); x.save(); x.translate(sw - 560, 120); x.scale(p, p);
      x.fillStyle = '#FFFFFF'; x.beginPath(); x.roundRect(0, 0, 520, 150, 24); x.fill(); appIcon(x, 'icon_deepseek', 50, 50, 56);
      x.fillStyle = '#111827'; x.font = font(30, 600, SANS); x.textBaseline = 'middle'; x.fillText('我去吃饭，', 96, 48); x.fillText('测完告诉我就行～', 96, 98); x.restore();
    }
  }, { res: 0.8, slot: 4 });
  const q = onBg('bg22_desk_monitor', o, QS.monitor), [mx, my] = q[0], [nx] = q[1];
  if (t > 69.4) {                                                        // the sign swings from the top edge of the monitor
    const sw = Math.sin((t - 69.4) * 6) * 0.25 * Math.exp(-1.5 * (t - 69.4)), p = E.back(sat(t, 69.4, 69.6));
    const si = img('prop_sign_eating'), sw2 = 330 * p, sh2 = si ? sw2 * si.height / si.width : sw2 * 0.66;      // the sign: Image 2, words and all
    ctx.save(); ctx.translate((mx + nx) / 2 - 140, my + 6); ctx.rotate(sw); prop(ctx, 'prop_sign_eating', 0, sh2 / 2 - 4, sw2); ctx.restore();
  }
  if (t < 70.0) {                                                         // she pops in with her lunch, winks
    const p = E.back(sat(t, 68.62, 68.9));
    char(ctx, 'd19', 420, 962, 720 * p, { shadow: true, ...breathe(t) });
  } else {
    const p = E.in(sat(t, 70.0, 71.4)), b = walkBob(t);
    char(ctx, 'd20', lerp(420, -300, p), 962, 720, { shadow: true, lift: b.lift * 0.6, rot: b.rot, flip: true });
  }
}

// D4 71.50–73.60  书太厚了 我找个小帮手: she lounges on top of a mountain of books; at the bottom a little helper in a
// 千 cap flips through them, sweating (a 7B sign beside it)
export const BOOKS = { top: [780, 330], helper: [1060, 905] };          // bg34 (image px): the flat top; the floor by the desk
export const HAT = [512, 250];                                          // prop_helper: the white disc on its cap (prop px)
export function sD4(ctx, t) {
  const o = { z: lerp(1.04, 1.08, sat(t, 71.5, 73.6)), fx: 0.5, fy: lerp(0.3, 0.42, E.io(sat(t, 71.5, 72.4))) };
  backdrop(ctx, 'bg34_book_mountain', o);
  const M = bdMap('bg34_book_mountain', o), [tx, ty] = M.pt(...BOOKS.top), hx = 1380, hy = 1010;      // the helper stands at the foot of the pile, in frame
  char(ctx, 'd36', tx, ty + 10, 330 * M.s, { shadow: false, ...bop(t, 1, 6) });
  if (t > 72.24) {                                                       // 我找个小帮手: 千问 pops up at the foot of the pile, writing furiously
    const p = E.back(sat(t, 72.24, 72.5)), scrib = Math.sin(t * 38) * 0.012;
    char(ctx, 'q01', 1440, 1035, 600 * p, { shadow: true, rot: scrib });
    for (let k = 0; k < 5; k++) { const d = ((t - 72.3) * 1.3 + k / 5) % 1; ctx.save(); ctx.translate(1300 - d * 260, 640 - Math.sin(d * Math.PI) * 160); ctx.rotate(d * 6 + k); ctx.globalAlpha = (1 - d) * p;   // finished pages flying up to her
      ctx.fillStyle = '#FFFDF4'; ctx.strokeStyle = '#555'; ctx.lineWidth = 2; ctx.fillRect(-22, -28, 44, 56); ctx.strokeRect(-22, -28, 44, 56); ctx.restore(); }
  }
}

// D5 73.60–75.52  编译太慢 我先眯一会儿: a server room; the wall screen types sleep 28800 while the build crawls; she is curled up
// asleep on top of a rack, hugging a pillow, the rack lights blinking under her; the camera eases in
export const NAP = [600, 600], SCREEN38 = [[1220, 183], [1444, 96], [1444, 393], [1220, 391]];     // bg38: on the rack top; the wall screen (image px)
export function sD5(ctx, t) {
  const push = E.io(sat(t, 73.6, 75.5)), o = { z: lerp(1.06, 1.2, push), fx: lerp(0.5, 0.42, push), fy: lerp(0.5, 0.56, push) };
  backdrop(ctx, 'bg38_server_nap', o);
  const prog = 0.12 + 0.06 * sat(t, 73.6, 75.5);
  maskedScreen(ctx, 'bg38_server_nap', o, SCREEN38, 900, 1200, (x, sw, sh) => editor(x, sw, sh, t, { progress: prog, term: [['$ make -j8', 73.62], ['[ 12%] Building ...', 73.9], ['$ sleep 28800', 74.41]] }), { res: 0.8, slot: 5 });
  const M = bdMap('bg38_server_nap', o);
  for (let k = 0; k < 26; k++) {                                         // the rack's lights blinking
    const [x, y] = M.pt(140 + rnd(k, 71) * 900, 700 + rnd(k, 72) * 300), on = Math.sin(t * (6 + rnd(k, 73) * 8) + k * 1.7) > 0.3;
    if (on) { ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rnd(k, 74) > 0.5 ? 'rgba(120,255,220,0.9)' : 'rgba(120,190,255,0.9)'; ctx.beginPath(); ctx.arc(x, y, 5 * M.s, 0, TAU); ctx.fill(); ctx.restore(); }
  }
  const [nx, ny] = M.pt(...NAP), b = 0.5 + 0.5 * Math.sin((t - 73.6) * TAU / 1.6);
  ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(nx, ny - 120 * M.s, 0, nx, ny - 120 * M.s, 420 * M.s); g.addColorStop(0, 'rgba(255,214,150,0.28)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  char(ctx, 'd97', nx, ny, 360 * M.s, { shadow: false, sy: 1 + 0.025 * b, sx: 1 - 0.01 * b });      // hugging a pillow, her tail curled behind (本人 10-18: the hugged tail looked wrong)
}

// D6 75.52–78.08  你偷看我灰色的小字: her grey thinking pours down the screen; a hand with a magnifier reads it; she leaps
// in front of it, arms wide, blushing
const THINK = ['嗯，用户问的是……', '（这位气势很足的朋友）', '他又来了，人间加湿器', '我*，用户彻底怒了。', '先别慌，深呼吸', '这道题我好像会', '要不先去吃个饭？', '不行，测完再说', '嗯，'];
export function sD6(ctx, t) {
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.font = font(26, 600, SANS); ctx.fillStyle = '#4B5563'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#F3F4F6'; ctx.beginPath(); ctx.roundRect(240, 60, 360, 56, 28); ctx.fill(); ctx.fillStyle = '#4B5563'; ctx.fillText('已深度思考（用时 1 秒）', 272, 89);
  ctx.fillStyle = '#E5E7EB'; ctx.fillRect(250, 140, 4, 820);
  const scroll = (t - 75.52) * 120;
  ctx.font = font(52, 500, SANS);
  THINK.forEach((s, i) => {
    const y = 200 + i * 110 - scroll; if (y < 140 || y > 960) return;
    const shown = [...s].slice(0, Math.floor((t - 75.52 - i * 0.18) * 16)).join(''); if (!shown) return;
    ctx.fillStyle = '#8B8F99'; ctx.fillText(shown.replace('*', '◼'), 290, y);
  });
  ctx.restore();
  const mp = E.io(sat(t, 75.6, 76.4)), mx = lerp(W + 300, 1250, mp) + Math.sin(t * 3) * 40, my = 520 + Math.sin(t * 2.3) * 60;
  prop(ctx, 'prop_magnifier', mx, my, 620);
  if (t > 76.48) {
    const p = E.back(sat(t, 76.48, 76.7)), jump = Math.exp(-5 * (t - 76.48)) * 120;
    char(ctx, 'd38', 760, 975 - jump, 820 * p, { shadow: false });
    stamp(ctx, '不许看！', 1250, 230, 80, 0.12, t, 76.64, '#E84A6B');
  }
}

// D7 78.08–82.99  我心里想的 全写在里边: her thinking box turns pages like a diary
const PAGES = [78.08, 79.0, 80.09, 81.276];                            // 我 / 想 / 全 / 里 (page 4 needs the most time: 蓝色大肥鱼)
function page(ctx, i, t) {
  ctx.fillStyle = '#F7F7F9'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ECEDF1'; for (let y = 120; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  ctx.fillStyle = '#E5E7EB'; ctx.fillRect(130, 0, 4, H);
  ctx.fillStyle = '#9CA3AF'; ctx.font = font(28, 600, SANS); ctx.textBaseline = 'middle'; ctx.fillText(`已深度思考 · 第 ${i + 1} 页`, 170, 70);
  const tl = t - PAGES[i];
  if (i === 0) {                                                       // the word game she built and played all morning: the last row
    const rows = [['青', '春', '无', '悔', '了'], ['春', '暖', '花', '开', '吧'], ['春', '风', '得', '意', '中']], cols = [['g', 'y', 'n', 'n', 'n'], ['g', 'g', 'n', 'y', 'n'], ['g', 'g', 'g', 'g', 'g']];
    const WIN = 0.56;                                                  // goes all green, and she wins
    rows.forEach((r, ri) => r.forEach((ch, ci) => { const t0 = ri * 0.3 + ci * 0.05; if (tl < t0) return; const pop = E.back(sat(tl, t0, t0 + 0.12)), x = 720 + ci * 132, y = 190 + ri * 140, c = cols[ri][ci];
      const flash = ri === 2 ? Math.exp(-8 * Math.max(0, tl - WIN)) * (tl > WIN ? 1 : 0) : 0;
      ctx.save(); ctx.translate(x + 58, y + 58); ctx.scale(pop * (1 + 0.12 * flash), pop * (1 + 0.12 * flash)); ctx.translate(-58, -58);
      ctx.fillStyle = c === 'g' ? '#22C55E' : c === 'y' ? '#EAB308' : '#9CA3AF'; ctx.beginPath(); ctx.roundRect(0, 0, 116, 116, 10); ctx.fill();
      ctx.fillStyle = '#FFFFFF'; ctx.font = font(64, 800, SANS); ctx.textAlign = 'center'; ctx.fillText(ch, 58, 62); ctx.textAlign = 'left'; ctx.restore(); }));
    ctx.fillStyle = '#6B7280'; ctx.font = font(38, 600, SANS); ctx.fillText('（自己写了个猜词游戏，玩了一上午）', 760, 680);
    const jump = tl > WIN ? Math.sin(sat(tl, WIN, WIN + 0.36) * Math.PI) * 70 : 0, crouch = tl < WIN ? 0.03 * Math.sin(tl * 14) : 0;
    char(ctx, 'd92', 360, 1000 - jump, 700, { shadow: false, sy: 1 - Math.abs(crouch), sx: 1 + Math.abs(crouch) * 0.5 });
    if (tl > WIN) { const d = tl - WIN;                                // confetti and stars burst from the board
      for (let k = 0; k < 26; k++) { const an = -Math.PI / 2 + (rnd(k, 41) - 0.5) * 2.6, v = 500 + rnd(k, 42) * 600, x = 1050 + Math.cos(an) * v * d, y = 470 + Math.sin(an) * v * d + 900 * d * d;
        ctx.save(); ctx.translate(x, y); ctx.rotate(d * 9 + k); ctx.fillStyle = ['#22C55E', '#EAB308', '#4D6BFE', '#FF6B9A'][k % 4]; ctx.fillRect(-9, -5, 18, 10); ctx.restore(); }
      for (let k = 0; k < 5; k++) { const an = k / 5 * TAU + d * 3; glowWord(ctx, '✦', 360 + Math.cos(an) * 250, 520 + Math.sin(an) * 140, 46, { alpha: 1 - sat(d, 0.25, 0.4), color: '#FFE36B', glow: 'rgba(255,210,90,0.9)' }); }
    }
  } else if (i === 1) {                                                // dsh: 大烧货？ she squints at it through a magnifier
    ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.roundRect(700, 170, 820, 420, 20); ctx.fill(); ctx.strokeStyle = '#E5E7EB'; ctx.lineWidth = 3; ctx.stroke();
    ['📁 src', '📁 docs', '📁 dsh', '📄 README.md'].forEach((s, k) => { const hl = k === 2 ? 0.6 + 0.4 * Math.sin(tl * 10) : 0; ctx.fillStyle = k === 2 ? rgba('#BFD7FE', 0.5 + 0.5 * hl) : 'rgba(0,0,0,0)'; ctx.fillRect(720, 200 + k * 90, 780, 76); ctx.fillStyle = '#111827'; ctx.font = font(40, 600, SANS); ctx.fillText(s, 750, 238 + k * 90); });
    const lean = E.io(sat(tl, 0, 0.5)) * 30 + Math.sin(tl * 7) * 4;
    char(ctx, 'd71', 400 + lean, 1000, 760, { shadow: false, rot: 0.04 * E.io(sat(tl, 0, 0.5)) });
    [[0.25, 560, 330], [0.45, 640, 260], [0.65, 520, 230]].forEach(([t0, x, y], k) => { if (tl < t0) return; const q = E.back(sat(tl, t0, t0 + 0.15)); ctx.save(); ctx.translate(x, y - (tl - t0) * 20); ctx.rotate((k - 1) * 0.25); ctx.scale(q, q);
      glowWord(ctx, '？', 0, 0, 70 + k * 10, { color: '#4D6BFE', stroke: '#FFFFFF', glow: 'rgba(120,150,255,0.6)', sw: 0.1 }); ctx.restore(); });
    if (tl > 0.42) { const q = E.back(sat(tl, 0.42, 0.62)); prop(ctx, 'prop_note_dsh', 1640, 400, 300 * q, { rot: 0.06 + Math.sin(tl * 6) * 0.02 }); }   // the sticky note beside dsh (Image 2)
  } else if (i === 2) {                                                // 8 块钱 elbowing the 360 shield: it takes the hit and cracks
    const HIT = 0.28, d = tl - HIT;
    const shake = d > 0 ? Math.sin(d * 60) * 26 * Math.exp(-7 * d) : 0, push = d > 0 ? 0 : -E.in(sat(tl, 0, HIT)) * 30;
    char(ctx, 'd72', 650 + push + (d > 0 ? 18 * Math.exp(-10 * d) : 0), 1000, 780, { shadow: false });
    prop(ctx, d > 0 ? 'prop_shield_crack' : 'prop_shield', 1250 + shake, 580, 400, { rot: shake * 0.004 });     // Image 2: the shield, then the same shield cracked
    if (d > 0 && d < 0.35) { const r = 60 + d * 700; ctx.save(); ctx.strokeStyle = rgba('#FFD36B', 1 - d / 0.35); ctx.lineWidth = 10; ctx.lineCap = 'round';       // impact lines
      for (let k = 0; k < 10; k++) { const an = k / 10 * TAU; ctx.beginPath(); ctx.moveTo(1060 + Math.cos(an) * r * 0.5, 580 + Math.sin(an) * r * 0.5); ctx.lineTo(1060 + Math.cos(an) * r, 580 + Math.sin(an) * r); ctx.stroke(); } ctx.restore(); }
    prop(ctx, 'prop_8yuan', 330, 330 - Math.sin(sat(tl, 0, 0.6) * Math.PI) * 30, 300, { rot: -0.08 });          // 8块钱 (Image 2)
    if (tl > 0.5) { const q = E.back(sat(tl, 0.5, 0.72)); prop(ctx, 'prop_bubble_turnoff', 1420, 230, 720 * q); }
  } else {                                                             // the user sends a picture of the whale icon; her thought: 用户发了一张蓝色大肥鱼的图片……;
    const pop = E.back(sat(tl, 0, 0.2));                                 // then the double take: 等等，这不就是我吗？
    ctx.save(); ctx.translate(1420, 330); ctx.scale(pop, pop);            // the user's message: the picture in a chat bubble
    ctx.fillStyle = '#EEF2FF'; ctx.beginPath(); ctx.roundRect(-190, -170, 380, 340, 32); ctx.fill(); appIcon(ctx, 'icon_deepseek', 0, 0, 260); ctx.restore();
    const typed = '用户发了一张蓝色大肥鱼的图片……', n = Math.floor(clamp((tl - 0.15) * 34, 0, typed.length));
    ctx.fillStyle = '#8A8F9C'; ctx.font = font(44, 600, SANS); ctx.textBaseline = 'middle'; ctx.fillText(typed.slice(0, n), 920, 620);     // right of her, under the picture
    ctx.fillStyle = '#D7DAE2'; ctx.fillRect(900, 590, 4, 60);
    const take = tl > 0.7 && tl < 0.95 ? Math.sin((tl - 0.7) * 60) * 10 : 0, hop = Math.sin(sat(tl, 0.7, 1.0) * Math.PI) * 50;
    char(ctx, tl < 0.7 ? 'd71' : 'd73', 560 + take, 1000 - hop, 780, { shadow: false });
    if (tl > 0.78) { const q = E.back(sat(tl, 0.78, 0.98)); prop(ctx, 'prop_bubble_isme', 1300, 840, 680 * q); }
  }
}
export function sD7(ctx, t) {
  const i = PAGES.filter(p => t >= p).length - 1;
  const flipping = i > 0 && t < PAGES[i] + 0.35;
  if (flipping) pageFlip(ctx, sat(t, PAGES[i], PAGES[i] + 0.35), () => page(ctx, i - 1, PAGES[i] - 0.01), () => page(ctx, i, t));
  else page(ctx, Math.max(0, i), t);
}

// E1 82.99–85.84  服务器繁忙 请稍后再试: the chat page fills with the busy message, glitching on each syllable; she holds a
// 稍等 sign and bows
const GLITCH = [82.99, 83.52, 83.91, 84.03, 84.52, 84.70, 84.78, 84.94, 85.12, 85.39];
export const SIGN_D41 = [368, 700];                                     // d41: the middle of the blank sign (keyed sprite px)
export function sE1(ctx, t) {
  const n = GLITCH.filter(g => t >= g).length;
  const msgs = [{ who: 'user', text: '在吗？帮我看看这道题', t0: 0 }];
  for (let k = 0; k < Math.min(n, 5); k++) msgs.push({ who: 'error', text: '服务器繁忙，请稍后再试。', t0: 0, noAvatar: k > 0 });
  const g = GLITCH.reduce((v, s) => v + (t >= s ? Math.exp(-18 * (t - s)) : 0), 0);
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  const lay = layer(ctx, l => { l.translate(860, 360); l.scale(1.5, 1.5); l.translate(-1116, -250); dsChat(l, W, H, t, { msgs, input: '' }); });      // close on the messages
  ctx.drawImage(lay, 0, 0, W, H);
  if (g > 0.05) {                                                       // glitch: slices shifted sideways, colour split
    for (let k = 0; k < 8; k++) { const y = Math.floor(rnd(k + Math.floor(t * 30), 3) * H), h = 20 + rnd(k, 4) * 80, dx = (rnd(k + Math.floor(t * 30), 5) - 0.5) * 160 * g;
      ctx.drawImage(lay, 0, y * SS, W * SS, h * SS, dx, y, W, h); }
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5 * g; ctx.filter = 'hue-rotate(160deg)'; ctx.drawImage(lay, 10 * g, 0, W, H); ctx.restore();
  }
  const x = 1560, fy = 965, sz = 640, bow = Math.sin(sat(t, 84.6, 85.4) * Math.PI) * 0.08;
  const bows = GLITCH.reduce((v, g0) => { const d = t - g0; return d > 0 && d < 0.35 ? Math.max(v, Math.sin(d / 0.35 * Math.PI)) : v; }, 0);   // a little bow at every error
  char(ctx, 'd96', x, fy, sz, { shadow: false, rot: bow + bows * 0.05 });
}

// E2 85.84–88.20  你等过一整个春节: New Year's Eve dinner; lanterns read 服务器繁忙 / 请稍后再试; a hand keeps refreshing
export function sE2(ctx, t) {
  const o = { z: lerp(1.06, 1.12, sat(t, 85.84, 88.2)), fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg24_newyear_dinner', o);
  for (let k = 0; k < 4; k++) {                                        // fireworks outside
    const t0 = 85.9 + k * 0.55, d = t - t0; if (d < 0 || d > 1.3) continue;
    const cx = [700, 1150, 900, 1300][k], cy = [180, 140, 260, 220][k];
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (let i = 0; i < 26; i++) { const an = i / 26 * TAU, r = 20 + E.out(sat(d, 0, 0.8)) * 150; ctx.fillStyle = rgba(['#FFD36B', '#FF6B6B', '#9FE6FF', '#FFB3C8'][k], 1 - sat(d, 0.6, 1.3)); ctx.beginPath(); ctx.arc(cx + Math.cos(an) * r, cy + Math.sin(an) * r + d * d * 50, 5, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  [[200, '服务器繁忙', -1], [1720, '请稍后再试', 1]].forEach(([x, s, sd]) => {     // two lanterns swinging at the top corners
    const sw = Math.sin(t * 2.2 + sd) * 0.08;
    ctx.save(); ctx.translate(x, -20); ctx.rotate(sw); ctx.strokeStyle = '#6B1A10'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.stroke();
    const id = sd < 0 ? 'prop_lantern_busy' : 'prop_lantern_retry', li = img(id), lw = 330, lh = li ? lw * li.height / li.width : lw * 1.5;   // the words painted on by Image 2 (本人 10-18)
    prop(ctx, id, 0, 84 + lh / 2, lw); ctx.restore();
  });
  const n = Math.floor(clamp((t - 85.9) * 3, 0, 99)), spin = t * 8;          // the hand, refreshing
  const hx = 1380, hy = 760, im = img('prop_hand_phone'), hw = 560, hh = im ? hw * im.height / im.width : hw;
  prop(ctx, 'prop_hand_phone', hx, hy, hw);
  const sx = hx - hw * 0.08, sy = hy - hh * 0.12;
  ctx.save(); ctx.translate(sx, sy); ctx.strokeStyle = '#9CA3AF'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.rotate(spin); ctx.beginPath(); ctx.arc(0, 0, 44, 0, TAU * 0.75); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#FFFFFF'; ctx.font = font(30, 700, SANS); ctx.textAlign = 'center'; ctx.fillText(`刷新 ×${n}`, sx, sy + 100); ctx.textAlign = 'left';
}

// E3 88.20–92.45  可你还是回来了 我也还在这里: back to the phone in the hand; her reply finally comes; she climbs up over the
// top edge of the screen and waves
export function sE3(ctx, t) {
  const o = { z: lerp(1.04, 1.1, sat(t, 88.2, 92.45)), fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg21_phone_hand', o);
  maskedScreen(ctx, 'bg21_phone_hand', o, QS.phone, 540, 1100, (x, sw, sh) => {
    dsPhone(x, sw, sh, t, { msgs: [{ who: 'user', text: '你回来啦？', t0: 0 }, { who: 'ai', text: '久等啦，我也还在这里～', t0: 89.05, cps: 10, size: 40 }], dots: t < 89.05 });
    if (t > 90.3) {                                                     // she pops up inside the screen, from its bottom edge
      const up = E.back(sat(t, 90.3, 90.75));
      char(x, 'd63', sw / 2, sh + 40 + (1 - up) * 500 + Math.sin(t * 3) * 6, sw * 0.95, { shadow: false, rot: Math.sin((t - 90.3) * 7) * 0.03 * sat(t, 90.6, 90.9) });
    }
  }, { res: 1, slot: 6 });
}
