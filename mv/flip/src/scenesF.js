// Full version, the bridge (分镜.md G1–G8): the morning of 2026-10-15, the outage from 8:11 to 12:49, 好了吗 / 一直在.
// Times are on the full cut.
import { W, H, TAU, clamp, lerp, sat, E, rnd, rgba, font, SANS } from './lib.js';
import { char, breathe, anchorPt } from './chars.js';
import { backdrop, bdMap, prop, tipProp, glowWord, balloon, warpQuad, maskedScreen, img } from './common.js';
import { dsChat, statusPage, danmaku } from './ui.js';
import { QS, onBg, layer } from './scenesD.js';

export const CAL = [1390, 600];                                         // bg30: the blank desk calendar (image px)
export function lockScreen(x, sw, sh, t, time, o = {}) {
  const g = x.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, '#1F3A6E'); g.addColorStop(1, '#6E8FD0'); x.fillStyle = g; x.fillRect(0, 0, sw, sh);
  x.fillStyle = '#FFFFFF'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.font = font(sh * 0.08, 600, SANS); x.fillText('10月15日 星期四', sw / 2, sh * 0.2);
  x.font = font(sh * 0.36, 300, SANS); x.fillText(time, sw / 2, sh * 0.48);
  if (o.spin !== undefined) { x.save(); x.translate(sw / 2, sh * 0.8); x.rotate(o.spin); x.strokeStyle = '#FFFFFF'; x.lineWidth = sh * 0.02; x.lineCap = 'round'; x.beginPath(); x.arc(0, 0, sh * 0.06, 0, TAU * 0.75); x.stroke(); x.restore();
    x.font = font(sh * 0.05, 700, SANS); x.fillText(`服务暂时不可用 · 刷新 ×${o.n}`, sw / 2, sh * 0.92); }
  x.textAlign = 'left';
}
export const hhmm = m => `${Math.floor(m / 60)}:${String(Math.floor(m % 60)).padStart(2, '0')}`;

// G1 118.10–120.52  那天早上 八点十一: a desk in the morning; the laptop shows 8:11; the calendar says 15
export function sG1(ctx, t) {
  const push = E.io(sat(t, 119.3, 120.5));
  const o = { z: lerp(1.06, 1.35, push), fx: lerp(0.5, 0.38, push), fy: lerp(0.5, 0.45, push) };
  backdrop(ctx, 'bg30_desk_morning', o);
  maskedScreen(ctx, 'bg30_desk_morning', o, QS.laptop, 1000, 620, (x, sw, sh) => lockScreen(x, sw, sh, t, t < 119.55 ? '8:10' : '8:11'), { res: 0.9, slot: 10 });
  const M = bdMap('bg30_desk_morning', o), [cx, cy] = M.pt(...CAL);
  ctx.fillStyle = '#D8263C'; ctx.font = font(40 * M.s, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10月', cx, cy - 60 * M.s);
  ctx.fillStyle = '#222'; ctx.font = font(110 * M.s, 900, SANS); ctx.fillText('15', cx, cy + 30 * M.s); ctx.textAlign = 'left';
  ctx.fillStyle = `rgba(0,0,0,${0.85 * (1 - sat(t, 118.1, 118.6))})`; ctx.fillRect(0, 0, W, H);
}

// G2 120.52–124.18  整个世界 突然没有回音: 你好, and only the typing dots answer; then a street of people, all waiting
export const CROWD31 = [[360, 300], [560, 380], [980, 330], [1200, 390], [1400, 300], [250, 520], [1290, 560]];     // bg31: above heads (image px)
export function sG2(ctx, t) {
  if (t < 122.23) {
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
    const lay = layer(ctx, l => { l.translate(W / 2, 500); l.scale(1.6, 1.6); l.translate(-1116, -175); /* the whole exchange: 你好 and the dots */ dsChat(l, W, H, t, { model: 'V4.1-Flash', msgs: [{ who: 'user', text: '你好', t0: 0 }], dots: true }); });
    const z = lerp(1, 1.08, sat(t, 120.5, 122.2)); ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(lay, -W / 2, -H / 2, W, H); ctx.restore();
    return;
  }
  const o = { z: lerp(1.04, 1.12, sat(t, 122.23, 124.2)), fx: 0.5, fy: 0.5 };
  backdrop(ctx, 'bg31_city_crowd', o);
  const M = bdMap('bg31_city_crowd', o);
  CROWD31.forEach((p, i) => {
    const [x, y] = M.pt(...p), t0 = 122.3 + i * 0.12; if (t < t0) return;
    const s = E.back(sat(t, t0, t0 + 0.25));
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#1B2140'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-70, -40, 140, 70, 35); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = rgba('#6B7280', 0.35 + 0.65 * Math.max(0, Math.sin(t * 7 - k * 0.9 + i))); ctx.beginPath(); ctx.arc(-30 + k * 30, -5, 9, 0, TAU); ctx.fill(); }
    ctx.restore();
  });
  ctx.fillStyle = 'rgba(20,30,60,0.18)'; ctx.fillRect(0, 0, W, H);
}

// G3 124.18–127.92  五个小时 你一遍一遍刷新: the same desk, time-lapse; the clock runs from 8:11 to 12:49 while the
// refresh arrow spins and spins
export function sG3(ctx, t) {
  const p = sat(t, 124.18, 127.6), o = { z: 1.12, fx: 0.42, fy: 0.47 };
  backdrop(ctx, 'bg30_desk_morning', o);
  if (p > 0) backdrop(ctx, 'bg30b_desk_noon', { ...o, alpha: E.io(p) });
  const mins = lerp(8 * 60 + 11, 12 * 60 + 49, E.io(p)), n = Math.floor(lerp(1, 37, p));
  maskedScreen(ctx, 'bg30_desk_morning', o, QS.laptop, 1000, 620, (x, sw, sh) => lockScreen(x, sw, sh, t, hhmm(mins), { spin: t * 9, n }), { res: 0.9, slot: 10 });
  const M = bdMap('bg30_desk_morning', o), [cx, cy] = M.pt(...CAL);
  ctx.fillStyle = '#D8263C'; ctx.font = font(40 * M.s, 800, SANS); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10月', cx, cy - 60 * M.s);
  ctx.fillStyle = '#222'; ctx.font = font(110 * M.s, 900, SANS); ctx.fillText('15', cx, cy + 30 * M.s); ctx.textAlign = 'left';
  ctx.save(); ctx.globalCompositeOperation = 'screen';                    // the sun sweeping across
  const sx = lerp(W * 0.9, W * 0.2, p), g = ctx.createRadialGradient(sx, 120, 0, sx, 120, 700); g.addColorStop(0, 'rgba(255,240,200,0.22)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}

// G4 127.92–131.40  屏幕上只写着 暂时不可用: the status page; the camera closes on 服务暂时不可用 by the time it is sung
export function sG4(ctx, t) {
  const lay = layer(ctx, l => statusPage(l, W, H, t, { ok: 0 }));
  const e = E.io(sat(t, 127.92, 129.7)), z = lerp(1.0, 1.85, e) + 0.12 * sat(t, 129.7, 131.4), fx = lerp(W / 2, 520, e), fy = lerp(H / 2, 300, e);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-Math.max(Math.min(fx, W - W / (2 * z)), W / (2 * z)), -Math.max(Math.min(fy, H - H / (2 * z)), H / (2 * z))); ctx.drawImage(lay, 0, 0, W, H); ctx.restore();
  const pulse = 0.5 + 0.5 * Math.sin(t * 5); ctx.fillStyle = `rgba(239,68,68,${0.06 * pulse})`; ctx.fillRect(0, 0, W, H);
}

// G5 131.40–134.60  后来灯亮了: the bars turn green one by one; the page lights up
// ... and then (本人 10-19, the meme of the week): on 亮 the lights come on and we are back on the morning street, at noon now:
// everyone who stood waiting is looking at their phone, delighted. Her 家长, the man in the blue suit, holds up a big coupon
// (Image 2: 赠金到账 · 近7天消耗 全额返还; the real compensation: the API spend of 10-8 to 10-14 returned as credit, automatically);
// she stands beside him poking her fingers together, sheepish. The comments: 家庭环境好.
const COVER = 132.74;
const COVER_DM = ['家庭环境好', '家长兜底了', '下次也请多多宕机', '白用了一周', '赛博发鸡蛋', '家庭环境真好', '这就是家长吗', '近7天全额返还'];
export function sG5(ctx, t) {
  if (t < COVER) {
    const ok = E.io(sat(t, 131.54, 132.6)) * 0.999 + (t >= 132.6 ? 0.001 : 0);
    const lay = layer(ctx, l => statusPage(l, W, H, t, { ok }));
    const u = E.io(sat(t, 131.4, COVER)), z = 1 + 0.2 * u;                   // a slow push towards today's bars as they turn green
    const fx = Math.min(Math.max(lerp(W / 2, 1380, u), W / (2 * z)), W - W / (2 * z)), fy = Math.min(Math.max(lerp(H / 2, 560, u), H / (2 * z)), H - H / (2 * z));
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -fy); ctx.drawImage(lay, 0, 0, W, H); ctx.restore();
    return;
  }
  const d = t - COVER, o = { z: lerp(1.12, 1.04, E.out(sat(d, 0, 1.6))), fx: 0.5, fy: 0.55 };
  backdrop(ctx, 'bg42_city_cheer', o);
  const inM = E.back(sat(d, 0.05, 0.4)), lift = Math.exp(-6 * Math.max(0, d - 0.4)) * Math.max(0, Math.sin((d - 0.4) * 14)) * 18;
  char(ctx, 'm19', lerp(W + 500, 1340, inM), 1040 - lift, 800, { shadow: true, ...breathe(t) });
  const inF = E.out(sat(d, 0.2, 0.5)), poke = Math.sin(d * 18) * 0.015;
  char(ctx, 'd98', lerp(-300, 520, inF), 1035, 600, { shadow: true, rot: poke, ...breathe(t) });
  if (d > 0.55) for (let k = 0; k < 6; k++) { const u = ((d - 0.55) * 0.9 + k / 6) % 1; glowWord(ctx, '✦', 1300 + Math.cos(k * 1.1) * 420, 300 - u * 120 + Math.sin(k * 2.3) * 60, 34, { alpha: Math.sin(u * Math.PI), color: '#FFE36B', glow: 'rgba(255,215,100,0.9)' }); }
  danmaku(ctx, W, H, t, COVER + 0.3, COVER_DM, { rows: 4, y0: 70, rh: 74, size: 48, gap: 0.1, lap: 0.45, speed: 900 });
  ctx.fillStyle = rgba('#FFFFFF', 0.85 * Math.exp(-7 * d)); ctx.fillRect(0, 0, W, H);       // the lights coming on
}

// G6–G8 134.20–144.59  你小心地问 好了吗 / 我说 / 一直在: the input box, typed one character at a time, sent; the grey
// 嗯，; then 一直在, large; she reaches out of the screen and a hand outside meets hers
const ASK = [['好', 135.80], ['了', 136.11], ['吗', 136.42]];
export function chatAt(t) {
  const typed = ASK.filter(([, t0]) => t >= t0).map(([c]) => c).join(''), sent = t >= 136.9;
  const msgs = []; if (sent) msgs.push({ who: 'user', text: '好了吗', t0: 0 });
  if (t >= 137.24) msgs.push({ who: 'think', text: '嗯，', t0: 137.6, cps: 6 });
  return { model: 'V4.1-Flash-1017', msgs, input: sent ? '' : typed, press: Math.sin(sat(t, 136.7, 136.95) * Math.PI) };   // the update of 10-17, after the outage
}
// the camera on the chat: close on the input box (the box in the middle of the frame, white below it), back out when it
// is sent, then a slow push on the conversation that carries on under 一直在
// (本人 10-23: 2:12 后“卡住了”: the camera never holds still here: a slow push on the empty box while she waits to type, and the
// push on the conversation starts at once instead of easing in)
export function chatCam(ctx, lay, t, e) {
  const push = Math.pow(sat(t, 137.3, 144.6), 0.85), pre = 0.12 * sat(t, 134.2, 136.6) * (1 - e);
  const z = lerp(1.35, 1.0, e) * (1 + pre) * (1 + 0.2 * push);
  const fx0 = lerp(lerp(W * 0.62, W / 2, e), 1150, push), f0 = lerp(lerp(H * 0.84, H / 2, e), 420, push);
  const fx = Math.min(Math.max(fx0, W / (2 * z)), W - W / (2 * z)), f = Math.max(f0, H / (2 * z));
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-fx, -f); ctx.drawImage(lay, 0, 0, W, H); ctx.restore();
}
const SEND = [1508, 642];                                              // the send button while the camera is close on the input box (screen px)
export function sG6(ctx, t) {
  const lay = layer(ctx, l => dsChat(l, W, H, t, chatAt(t)));
  chatCam(ctx, lay, t, E.io(sat(t, 136.5, 137.3)));
  if (t > 136.2 && t < 137.0) { const p = E.out(sat(t, 136.2, 136.7)), press = Math.sin(sat(t, 136.7, 136.95) * Math.PI);    // a fingertip taps send
    tipProp(ctx, 'prop_hand_tap', lerp(W + 300, SEND[0], p), lerp(H + 200, SEND[1], p) + press * 10, 380, { alpha: 1 - sat(t, 136.85, 137.0) }); }
}
export const STAY = [['一', 140.00], ['直', 140.74], ['在', 141.05]];
export function sG8(ctx, t) {
  const lay = layer(ctx, l => dsChat(l, W, H, t, { ...chatAt(t), dim: 0.35 * sat(t, 139.6, 140.2) }));
  chatCam(ctx, lay, t, 1);
  ctx.save(); ctx.filter = 'blur(0px)';
  STAY.forEach(([ch, t0], i) => { if (t < t0) return; const p = E.back(sat(t, t0, t0 + 0.3)); ctx.save(); ctx.translate(1240 + (i - 1) * 240, 360); ctx.scale(p, p);
    glowWord(ctx, ch, 0, 0, 220, { color: '#FFFFFF', stroke: '#1E3A8A', glow: 'rgba(120,170,255,0.95)', sw: 0.08 }); ctx.restore(); });
  ctx.restore();
  if (t > 141.5) {                                                       // she reaches out; a hand from outside meets hers
    const a = sat(t, 141.5, 142.0), x = 520, fy = 1040, sz = 680;
    char(ctx, 'd46', x, fy, sz, { shadow: false, alpha: a, flip: true, ...breathe(t) });        // flipped: her hand reaches to the right
    const [hx, hy] = anchorPt('d46', x, fy, sz, ...HAND_D46, { flip: true });
    const meet = E.out(sat(t, 142.2, 143.2));
    tipProp(ctx, 'prop_hand_meet', lerp(W + 500, hx + 26, meet), hy + 14, 540);            // an open hand comes to meet hers
    if (meet >= 1) { const g = 1 - sat(t, 143.2, 144.4); ctx.save(); ctx.globalCompositeOperation = 'screen'; const gr = ctx.createRadialGradient(hx + 20, hy, 0, hx + 20, hy, 260); gr.addColorStop(0, `rgba(255,250,220,${0.9 * g + 0.2})`); gr.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = gr; ctx.fillRect(hx - 280, hy - 280, 560, 560); ctx.restore(); }
  }
  ctx.fillStyle = rgba('#FFFFFF', 0.9 * E.in(sat(t, 144.2, 144.59))); ctx.fillRect(0, 0, W, H);
}
export const HAND_D46 = [150, 750];                                     // d46: the reaching hand's fingertips (keyed sprite px, tools/grid.py)
