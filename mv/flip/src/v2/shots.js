// v2 shot list on the song's clock, per version (trailer / mid = the 2/3 version / full). 0–3.247 s the new opening; then the v1
// shots at their v1 cut times (v1 src/main.js FULL), each kept whole and given motion on top (plus.js, 本人 10-21).
import * as O from './open.js';
import * as A from '../scenesA.js';
import * as B from '../scenesB.js';
import * as C from '../scenesC.js';
import * as D from '../scenesD.js';
import * as EE from '../scenesE.js';
import * as F from '../scenesF.js';
import * as G from '../scenesG.js';
import { enhance, cyc } from './plus.js';
import { W, H, sat, E, lerp, plate } from './core.js';
import { fx } from './fx2.js';
import { SB, SB_T as T } from './sb.js';
import { SB2, SB2_LIST } from './sb2.js';
import * as SB2X from './sb2.js';
import * as L from './life.js';
import * as R from './sb3.js';
import * as R4 from './sb4.js';
import * as R6 from './sb6.js';
import * as R7 from './sb7.js';
import * as R8 from './sb8.js';
import * as R9 from './sb9.js';
import * as R10 from './sb10.js';
import * as R11 from './sb11.js';
import { bdMap } from '../common.js';

// a white flash over a hard cut (as in v1)
function flash(at, dur, a, b, color = '#FFFFFF') {
  return (ctx, t) => { (t < at ? a : b)(ctx, t); const p = 1 - Math.abs(t - at) / dur; if (p > 0) { ctx.fillStyle = color; ctx.globalAlpha = 0.85 * p * p; ctx.fillRect(-100, -100, 2120, 1280); ctx.globalAlpha = 1; } };
}

// ---- the first minute, with motion added (each pose from an action sheet that starts from the original pose)
const S = {
  sA3: enhance(A.sA3, { ov: { d05: { sheet: 'c_d05', keys: [[0, 0], [8.24, 1], [8.99, 2], [9.22, 3]] } }, extra: fx.lampGlints }),
  sA4: enhance(A.sA4, { ov: { d06: { sheet: 'c_d06', keys: [[0, 0], [10.05, 1], [11.2, 2], [12.15, 3]] } } }),
  sA5: enhance(A.sA5, { ov: { d22: { sheet: 'c_d22', keys: [[0, 0], [14.3, 1], [14.5, 2], [14.95, 3]] } } }),
  // his arms go into the water on the original's splashes (15.9 + 0.8 n) and come out on the ones between
  sA6: enhance(A.sA6, { ov: { m17: { sheet: 'c_m17', k: cyc(15.7, 4, 0.2) }, d21: { sheet: 'c_d21', k: cyc(17.1, 4, 0.2) } } }),
  sA7: enhance(A.sA7, { ov: { d08: { sheet: 'c_d08', keys: [[0, 0], [19.44, 1], [20.02, 2], [21.0, 3]] } } }),
  sA8: enhance(A.sA8, { ov: { d09: { sheet: 'c_d09', k: cyc(22.0, 4, 0.15) }, d10: { sheet: 'c_d10', keys: [[0, 0], [24.85, 1], [25.15, 2], [25.45, 3]] } } }),
  sB1: enhance(B.sB1, { ov: { d11: { sheet: 'c_d11', ref: 1, keys: [[0, 0], [27.2, 1]] } } }),
  sB2: enhance(B.sB2, { ov: { d60: { sheet: 'c_b2', ref: 2, keys: [[0, 2]] }, d12: { sheet: 'c_b2', ref: 2, keys: [[0, 0], [31.0, 1], [31.4, 3]] } } }),
  // the strokes stay v1's (the smear onto the basin); after the last one he rests the hammer and shakes out his fist. The
  // sheet's two swing drawings bring the hammer down on his other side, away from the anvil: not used
  sB3: enhance(B.sB3, { ov: { m14: { sheet: 'c_m14', keys: [[0, 0], [33.75, 3]] } } }),
  sB4: enhance(B.sB4, { ov: { d15: { sheet: 'c_d15', ref: 1, keys: [[0, 0], [35.38, 1], [36.16, 2], [37.0, 3]] } } }),       // fireworks: fx2.js hook
  // asleep (0), half over on 翻 (1), on her other side, an eye open (2 = d16b), asleep again (3); the sheet turns her itself
  sC1: enhance(C.sC1, { ov: Object.fromEntries(['d16a', 'd16b'].map(id => [id, { sheet: 'c_roll', refId: 'd16a', flip: false,
    keys: [[0, 0], [39.02, 1], [39.18, 2], [39.6, 3]] }])) }),
  sC2: enhance(C.sC2, {}),
  sC3: enhance(C.sC3, { extra: fx.wallStreet }),
  sC4: enhance(C.sC4, {}),
  sC5: enhance(C.sC5, {}),
  sC6: enhance(C.sC6, {}),
  sC7: enhance(C.sC7, {}),
  // a little bow on 拿, a smile on 不要钱 (the 请 drawing moves the tray the scrolls sit on: not used)
  sC8: enhance(C.sC8, { ov: { d18: { sheet: 'c_d18', keys: [[0, 0], [59.96, 1], [60.84, 2]] } } }),
};

// ---- verse 2, pre-chorus 2, chorus 2 (the full version; sI0 also leads the 2/3 version into the bridge)
const D40 = { sheet: 'c_d40', keys: [[0, 0], [64.31, 1], [64.74, 2], [65.12, 3]] };          // looks up at the comments, ducks them, pouts (then d31: the tag)
const S2 = {
  // the tray shot shrinking into the phone keeps her 不要钱 smile; the video she is in starts with her looking on
  // 本人 10-23 (1:02 卷轴瞬移、歪了): the picture going into the phone is the tray shot exactly as it ended: the level pile, the boats, the gulls
  sI0: (() => { const s = enhance(D.sI0, { ov: { d18: { sheet: 'c_d18', keys: [[0, 2]], after: SB2X.trayPile }, d40: D40 },
      bg: (c, t, id, o) => id === 'bg17_dawn_sea' && L.trayBg(c, t, bdMap(id, o)) });
    return (ctx, t) => { globalThis.__noTrayPile = true; globalThis.__sI0Extra = (c, tt) => L.dawnFg(c, tt, 59.7);
      try { s(ctx, t); } finally { globalThis.__noTrayPile = false; globalThis.__sI0Extra = null; } }; })(),
  sD1: enhance(D.sD1, { ov: { d40: D40 } }),
  // 贪吃: an eating loop (chew, pick up rice, 啊, bite); 偷懒: a scratch and a yawn on 懒
  sD2: R.shotD2,                                                            // §20: 偷懒 in the middle, big
  // she shows us her lunch as her reply comes up, points at the sign as it swings, giggles, and walks off (d20, v1)
  sD3: enhance(D.sD3, { ov: { d19: { sheet: 'c_d19', keys: [[0, 0], [69.25, 1], [69.4, 2], [69.79, 3]] } }, extra: L.deskFg }),
  // 书太厚了: a kick of the feet, a yawn; 小帮手: she points down at 千问, who writes, turns pages, wipes her brow
  sD4: enhance(D.sD4, { ov: { d36: { sheet: 'c_d36', keys: [[0, 0], [71.65, 1], [71.95, 2], [72.3, 3]] }, q01: { sheet: 'c_q01', keys: [[0, 0], [72.94, 1], [73.3, 2]] } } }),
  // asleep: she snuggles in, her tail flicks, a bubble on 一会儿
  sD5: enhance(D.sD5, { ov: { d97: { sheet: 'c_d97', keys: [[0, 0], [74.15, 1], [74.67, 2], [75.02, 3]] } }, extra: L.napFg }),
  // 不许看: arms wide, a big cross, a push, hands on her red cheeks
  sD6: enhance(D.sD6, { ov: { d38: { sheet: 'c_d38', keys: [[0, 0], [77.03, 1], [77.4, 2], [77.75, 3]] } } }),
  // the diary: typing, then fists as the row goes green (78.64), a cheer, a V; squinting (pages 2 and 4); a wind-up for the elbow
  // (the hit at 80.37) and the coin caught after; 这不就是我: pointing at herself, delighted
  sD7: enhance(D.sD7, { ov: {
    d92: { sheet: 'c_d92', ref: 1, keys: [[0, 0], [78.64, 1], [78.8, 2], [78.92, 3]] },
    d71: { sheet: 'c_d71', keys: [[0, 0], [79.4, 1], [79.75, 2], [81.0, 0], [81.6, 1]] },
    d72: { sheet: 'c_d72', ref: 1, keys: [[0, 0], [80.37, 1], [80.6, 2], [80.9, 3]] },
    d73: { sheet: 'c_d73', keys: [[0, 0], [82.39, 1], [82.7, 2]] } } }),
  // 服务器繁忙: a bow on 繁 and from 忙 on, a sheepish tongue on 试, then the pleading look
  sE1: enhance(D.sE1, { ov: { d96: { sheet: 'c_d96', keys: [[0, 0], [83.52, 1], [83.8, 0], [84.52, 1], [85.39, 2], [85.65, 3]] } } }),
  // 我也还在这里: she waves (two drawings in turn), smiles on 这, both hands on 里
  sE3: R4.shotE3,                                                          // §21: her higher, nearer the middle
  // 翻了个身: the roll goes through her back (one sheet for d64a/d64b); the peek opens both eyes; then d99 (v1) sits up
  sF1: enhance(EE.sF1, { extra: L.nightRollFg, ov: { ...Object.fromEntries(['d64a', 'd64b'].map(id => [id, { sheet: 'c_f1', refId: 'd64a', keys: [[0, 0], [93.38, 1], [93.55, 2], [94.3, 3]] }])),
    d99: { sheet: 'c_d99c', keys: [[0, 0]] } } }),                         // 本人 10-23: the tail (it was a flat strip)
  // the fans laugh: she giggles, cheers on 大肥鱼, a V
  sF3: enhance(EE.sF3, { ov: { d43: { sheet: 'c_d43', keys: [[0, 0], [99.7, 1], [100.03, 2], [100.65, 3]] } } }),
  // 橙子 watching the impostor: a suspicious squint, a facepalm when it turns into ChatGPT, then she points
  sF5: enhance(EE.sF5, { ov: { o91: { sheet: 'c_o91', keys: [[0, 0], [106.0, 1], [107.2, 2], [107.6, 3]] } } }),
  // the wind-up with the rolled map in her hand, the throw (v1's drawing: the map leaves her hand there), a look after it; on
  // the map: a wave, a point out to sea, arms open
  // on the map she stands up on it, whole (本人 10-21: no shots where only a head shows at the bottom)
  // the throw (v1 + the wind-up sheet); then the map (§22: a held shot, no sliding)
  sF6: (() => { const throwShot = enhance(EE.sF6, { ov: { d69: { sheet: 'c_d69', ref: 1, keys: [[0, 0], [108.32, 1], [108.5, 2], [108.7, 3]] } } });
    return (ctx, t) => (t < 108.85 ? throwShot(ctx, t) : R6.shotMap(ctx, t)); })(),
  // the ladle: dip, lift, toss (a bowl flies off on each toss, 114.0 + 0.5 n), hold
  sF8: enhance(EE.sF8, { ov: { d45: { sheet: 'c_d45', keys: [[0, 0], [114.18, 3], [114.6, 1], [114.93, 2], [115.12, 3], [116.65, 1], [116.95, 2], [117.25, 3]] } } }),
};

// ---- the bridge's coupon and the final chorus (the 2/3 and full versions)
// the bridge and the final chorus (§17): v1's pictures, whole (10-22: no added zooms or cut-ins); poses change on the stressed
// words only (no loops, 本人 10-21)
const SCR = [962, 334, 1.75];                                             // bg32 at concert()'s framing: the big screen, filling the frame
const S3 = {
  // she waits nervously; on 灯亮了's 了 her eyes light up, she cheers, and bows her thanks
  sG5: enhance(F.sG5, { ov: { d98: { sheet: 'c_d98', keys: [[0, 0], [133.26, 1], [133.6, 2], [134.1, 3]] } } }),
  // 我还是那条大肥鱼: singing; on 大 she waves to the crowd
  sH1: enhance(G.sH1, { ov: { d48: { sheet: 'c_d48', keys: [[0, 0], [147.19, 3]] } } }),
  // 偶尔偷懒 偶尔嘴馋: dance steps on 懒 and 馋
  // 本人 10-23 (2:28 偷懒的尾巴有问题): the beanbag clip redrawn (n_lazy: the tail from behind her skirt, curled up over the beanbag)
  sH2: enhance(G.sH2, { ov: { d74: { sheet: 'c_d74', keys: [[0, 0], [149.09, 1], [150.91, 2], [151.4, 3]] },
    d75: { replace: (c, tt, info) => { const im = plate('n_lazy3b'); if (!im) return; const s = info.h * 0.82 / 994, sway = Math.sin(tt * 2.2) * 0.01;
      // (left of the dancer, so her tail's fluke shows)
      c.save(); c.translate(info.x - info.h * 0.42, info.feetY); c.rotate(sway); c.drawImage(im, -768 * s, -1023 * s, 1536 * s, 1024 * s); c.restore(); } } } }),
  // 可你叫我名字的时候: her back to us; she looks round, turns, and waves (名、字)
  sH3: R.shotH3,                                                            // §20: the crowd's lights spell her name
  // 我一直都在: heart hands; on 在 she looks up at us
  sH4: enhance(G.sH4, { ov: { d93: { sheet: 'c_d93', keys: [[0, 0], [156.81, 3]] } } }),
  // the seeds gone (they leave the head until 165.35): she watches them go, waves, makes a wish
  sH7: enhance(G.sH7, { ov: { d80: { sheet: 'c_d80', keys: [[0, 0], [165.4, 1], [165.8, 2], [166.4, 3]] } }, bg: (c, t, id, o) => id === 'bg17_dawn_sea' && L.dandelionBg(c, t, bdMap(id, o)) }),
  // 都拿去吧 不要钱: everyone with her; hands together, arms wide on 不要钱, a little hop
  sH8: enhance(G.sH8, { ov: { d81: { sheet: 'c_d81', ref: 1, keys: [[0, 0], [167.73, 1], [168.2, 2]] } } }),
};
// the bridge's desk (那天早上 / 五个小时) and chorus 2's New Year dinner, with their life (life.js)
const deskBg = (c, t, id, o) => ((id === 'bg30_desk_morning' && t < 124.18) || id === 'bg30b_desk_noon') && L.deskMorningBg(c, t, bdMap(id, o));
const sG1 = enhance(F.sG1, { bg: deskBg, extra: L.deskMorningFg }), sG3 = enhance(F.sG3, { bg: deskBg, extra: L.deskMorningFg });
const sE2 = R4.shotE2;                                                   // §20: the whole festival passes (sb4.js)
// G0 (116.56–118.1, the stall's lights go out into the bridge): v1 froze the stall picture while it went dark (本人 10-22: 屏幕变黑的时候
// 不要让动作卡住) -> the stall keeps going (bowls, steam, her ladle) as the light goes
const sG0 = (ctx, t) => { S2.sF8(ctx, t); ctx.fillStyle = `rgba(4,6,16,${E.in(sat(t, 116.6, 117.9)) * 0.96})`; ctx.fillRect(0, 0, W, H); };
// H9 (the breath after the final 不要钱): v1 holds the sunrise picture and goes white; held on the enhanced picture
const sH9 = (ctx, t) => { S3.sH8(ctx, t); ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.92 * E.in(sat(t, 168.9, 169.42)); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };

// T1 (the trailer's 61.97–62.35, the breath before the band's hits): the tray shot's last frame holds and goes white, as in v1,
// but held on the enhanced shot so her pose does not jump back
// (本人 10-22: no freeze under the fade: the stall keeps going)
const sT2 = (ctx, t) => { S2.sF8(ctx, t); ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.92 * E.in(sat(t, 116.364, 116.7)); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };
const sT1 = (ctx, t) => { S.sC8(ctx, 61.96); ctx.fillStyle = '#FFFFFF'; ctx.globalAlpha = 0.92 * E.in(sat(t, 61.97, 62.3)); ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; };

export function SHOTS(ver) {
  const first = [
    // 0–19 s: the §15 storyboard (sb.js)
    [0, SB.A], [T.B, SB.B], [T.C, SB.C], [T.D, SB.D], [T.E, SB.E], [T.BLACK, SB.black], [T.F, SB.F], [T.G, SB.G], [T.H, SB.H], [T.I, SB.I],
    [T.J, SB.J], [T.K, SB.K], [T.L, SB.L], [T.M, SB.M],
    // 19–62 s: the §16 storyboard (sb2.js)
    ...SB2_LIST.filter(([t0]) => t0 < 38.38), [38.2, flash(38.2, 0.18, SB2.S, SB2.T, '#FFE6C0')], ...SB2_LIST.filter(([t0]) => t0 >= 38.38),
  ];
  const ending = [[181.12, G.sI3]];                       // the band's hits: title, (trailer) 完整版 即将上线, 点赞 收藏 关注; held under the card
  if (ver === 'trailer') return [...first, [61.97, sT1], ...ending];
  const later = [
    [92.45, flash(92.45, 0.18, S2.sE3, S2.sF1, '#CFE0FF')], [92.63, S2.sF1], [95.23, EE.sF2], [98.75, S2.sF3], [101.61, EE.sF4], [105.15, S2.sF5],
    [107.95, S2.sF6], [111.35, EE.sF7], [113.88, S2.sF8], [116.56, sG0],
    // §23 (本人 10-23: 2:00–2:12 单调): the street and the desk
    // §25 (本人 10-23: 2:00–2:12 都是界面、没有大肥鱼，本质上的设计问题): her side of the outage, behind the glass (sb8.js); then 家长兜底
    // §26 (本人 10-23: 一个鱼缸 12 秒也不好 → 双视角): left your side (the old bridge shots), right her side (the tank), the screen between
    // §27 (本人 10-23: 不要用 16:9 裁剪 → 原生左右屏，资产重做): every half painted for its panel (sb9.js)
    [118.10, R9.shotSplit], [132.74, S3.sG5], [134.60, F.sG6], [139.60, R10.shotStay2],      // §28 一直在, from the root (sb10.js)
    [144.59, S3.sH1], [148.51, S3.sH2], [151.91, S3.sH3], [154.78, S3.sH4], [157.94, G.sH5],
    // §31 (本人 10-23: 242 冲浪有点廉价，完整重设计): 整片海都翻了天 = the concert's sea of lights flipping (sb11.js)
    [161.16, R11.shotLightSea], [164.57, S3.sH7], [166.95, S3.sH8], [168.44, sH9],
  ];
  const full = [...first, [61.97, S2.sI0], [63.72, S2.sD1], [65.88, S2.sD2], [67.72, S2.sD3], [71.50, S2.sD4], [73.60, S2.sD5], [75.52, S2.sD6], [78.08, S2.sD7],
    [82.99, S2.sE1], [85.84, sE2], [88.20, S2.sE3], ...later];
  // 2/3 (本人 10-22): the full version's first two minutes as they are, through chorus 2's 不要钱; then, like the trailer after
  // chorus 1, the stall's picture holds and goes white over the breath, and the band's hits
  if (ver === 'mid') return [...full.filter(([t0]) => t0 < 116.364), [116.364, sT2], [181.12, R6.endCardMid]];      // its card: 还有 1/3
  return [...full, ...ending];
}
