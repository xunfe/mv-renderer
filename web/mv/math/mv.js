/* 数学简史（复刻）· 时间轴 / 播放器
 * 原片：B站「球球求真」《数学简史 A BRIEF HISTORY OF MATHEMATICS》
 *      1652×1080 / 30fps / 160.4s（本片音轨原样取用）
 * 画面全部由 Canvas 2D 实时绘制；字幕时间来自对原片字幕带的 10fps 检测 + OCR 复核。
 * 地址参数：?t=40.5 定帧、?play 自动播、?clean 隐藏控制条、?q=4k30 画质
 */
'use strict';

const DUR = 160.405;

// 每一行：起, 止, HUD 章节, 镜头函数
const SHOTS = [
  [0.00, 3.73, 'TIMELINE', (g, t, p) => mIntroRoll(g, t, p)],
  [3.73, 6.93, 'TIMELINE', (g, t, p) => mTitle(g, t, p)],
  [6.93, 8.33, 'COUNT', (g, t, p) => mBoneLight(g, t, p)],
  [8.33, 12.70, 'COUNT', (g, t, p) => mBone(g, t, p)],
  [12.70, 15.80, 'COUNT', (g, t, p) => mDayLine(g, t, p)],
  [15.80, 18.60, 'COUNT', (g, t, p) => mTrio(g, t, p)],
  [18.60, 22.27, 'GEOMETRY', (g, t, p) => mTri345(g, t, p)],
  [22.27, 24.00, 'GEOMETRY', (g, t, p) => mFlower(g, t, p)],
  [24.00, 25.10, 'GEOMETRY', (g, t, p) => mDoor(g, t, p)],
  [25.10, 26.80, 'GEOMETRY', (g, t, p) => mPaperCircle(g, t, p)],
  [26.80, 29.80, 'GEOMETRY', (g, t, p) => mPaperInfinity(g, t, p)],
  [29.80, 33.20, 'GEOMETRY', (g, t, p) => mHuigeng(g, t, p, { n: 96, num: '384', num2: '3.141558', num3: '355/113', label: '割圆术 · 96 边形（示意）' })],
  [33.20, 37.63, 'NUMBER', (g, t, p) => mPiLine(g, t, p)],
  [37.63, 38.80, 'ZERO', (g, t, p) => mZeroRing(g, t, p, { glyph: '零' })],
  [38.80, 41.90, 'ZERO', (g, t, p) => mZeroRing(g, t, p, { glyph: '無' })],
  [41.90, 44.80, 'ZERO', (g, t, p) => mZeroRing(g, t, p, { glyph: '無' })],
  [44.80, 47.93, 'NUMBER', (g, t, p) => mBrahmi(g, t, p)],
  [47.93, 51.17, 'ALGEBRA', (g, t, p) => mAlgebraEq(g, t, p)],
  [51.17, 54.03, 'ALGEBRA', (g, t, p) => mAlgebraEq(g, t, p, { four: true })],
  [54.03, 55.73, 'ALGEBRA', (g, t, p) => mDescartes(g, t, p)],
  [55.73, 57.47, 'ALGEBRA', (g, t, p) => mGridHorizon(g, t, p)],
  [57.47, 59.40, 'CALCULUS', (g, t, p) => mAxes(g, t, p)],
  [59.40, 60.80, 'CALCULUS', (g, t, p) => mTangent(g, t, p)],
  [60.80, 62.53, 'CALCULUS', (g, t, p) => mSine(g, t, p)],
  [62.53, 66.63, 'CALCULUS', (g, t, p) => mEuler(g, t, p)],
  [66.63, 68.17, 'INFINITY', (g, t, p) => mDottedInfinity(g, t, p)],
  [68.17, 73.37, 'INFINITY', (g, t, p) => mGauss(g, t, p)],
  [73.37, 77.87, 'CALCULUS', (g, t, p) => mEiPi(g, t, p)],
  [77.87, 81.00, 'PROOF', (g, t, p) => mGalois(g, t, p)],
  [81.00, 82.20, 'PROOF', (g, t, p) => mGalois20(g, t, p)],
  [82.20, 84.10, 'INFINITY', (g, t, p) => mCantorTable(g, t, p)],
  [84.10, 85.77, 'INFINITY', (g, t, p) => mCantorDiag(g, t, p)],
  [85.77, 87.33, 'PROOF', (g, t, p) => mRiemann(g, t, p)],
  [87.33, 89.00, 'PROOF', (g, t, p) => mUnproved(g, t, p)],
  [89.00, 91.30, 'LOGIC', (g, t, p) => mWir(g, t, p)],
  [91.30, 93.00, 'LOGIC', (g, t, p) => mGodel(g, t, p)],
  [93.00, 94.83, 'COMPUTING', (g, t, p) => mTuring(g, t, p)],
  [94.83, 97.93, 'INFINITY', (g, t, p) => mInfinity(g, t, p, { label: "I'M COUNTING TO INFINITY", note: '111001011011000111' })],
  [97.93, 101.40, 'COMPUTING', (g, t, p) => mBinary(g, t, p)],
  [101.40, 104.73, 'PROOF', (g, t, p) => mFourColor(g, t, p, { full: true })],
  [104.73, 106.97, 'COMPUTING', (g, t, p) => mLookSay(g, t, p)],
  [106.97, 108.97, 'SPACE', (g, t, p) => mSpheres(g, t, p)],
  [108.97, 111.43, 'SPACE', (g, t, p) => mYau(g, t, p)],
  [111.43, 113.17, 'SPACE', (g, t, p) => mPlatonic(g, t, p, { many: true })],
  [113.17, 116.27, 'SPACE', (g, t, p) => mAbacus(g, t, p)],
  [116.27, 117.90, 'PROOF', (g, t, p) => mOnePlusTwo(g, t, p)],
  [117.90, 121.13, 'PROOF', (g, t, p) => mFermatEq(g, t, p)],
  [121.13, 122.80, 'PROOF', (g, t, p) => mWiles(g, t, p)],
  [122.80, 125.90, 'INFINITY', (g, t, p) => mLoneStar(g, t, p)],
  [125.90, 128.00, 'TIMELINE', (g, t, p) => mMillennium(g, t, p)],
  [128.00, 129.50, 'INFINITY', (g, t, p) => mInfinity(g, t, p, { label: "I'M COUNTING TO INFINITY", note: 'ℵ₀ · N → ∞', bolt: 1 })],
  [129.50, 130.77, 'PROOF', (g, t, p) => mNames(g, t, p)],
  [130.77, 133.53, 'PROOF', (g, t, p) => mNeedle(g, t, p)],
  [133.53, 137.40, 'PROOF', (g, t, p) => mParticles(g, t, p)],
  [137.40, 139.93, 'PROOF', (g, t, p) => mVortex(g, t, p)],
  [139.93, 144.37, 'PROOF', (g, t, p) => mProblemList(g, t, p)],
  [144.37, 146.07, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'sphere', no: '01 / 07', name: '庞加莱猜想', en: 'POINCARÉ CONJECTURE', lines: ['闭合、单连通的三维空间，', '都是三维球面'], solved: 1 })],
  [146.07, 147.77, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'strip', no: '02 / 07', name: '黎曼猜想', en: 'RIEMANN HYPOTHESIS', lines: ['非平凡零点，', '是否都在临界线上？'], closed: true })],
  [147.77, 149.43, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'zig', no: '03 / 07', name: 'P 与 NP 问题', en: 'P VS NP', lines: ['答案能很快核对，', '但能不能很快找到？'], closed: true })],
  [149.43, 151.07, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'vortex', no: '04 / 07', name: '纳维-斯托克斯', en: 'NAVIER–STOKES', lines: ['流动会一直光滑，', '还是会出现奇点？'], closed: true })],
  [151.07, 152.70, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'line', no: '05 / 07', name: '杨-米尔斯质量间隙', en: 'YANG–MILLS & MASS GAP', lines: ['最低激发与真空之间，', '隔着一道能量门槛吗？'], closed: true })],
  [152.70, 154.37, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'hodge', no: '06 / 07', name: '霍奇猜想', en: 'HODGE CONJECTURE', lines: ['特定的拓扑形状，', '能用代数方程画出吗？'], closed: true })],
  [154.37, 155.97, 'MILLENNIUM', (g, t, p) => mProblem(g, t, p, { motif: 'curve', no: '07 / 07', name: '贝赫与斯维讷通—戴尔', en: 'BIRCH & SWINNERTON-DYER', lines: ['曲线上的有理点有多丰富，', '能从秩数读出来吗？'], closed: true })],
  [155.97, 160.41, 'TIMELINE', (g, t, p) => mFinale(g, t, p, { end: p > 0.45 })],
];

// ---------------------------------------------------------------- 补充母题
function mSunField(g, t, p) {
  skyBase(g, t, { glow: 0.35, stars: 380, seed: 651, rad: 1.2 });
  const cx = W * 0.52, cy = 470;
  softGlow(g, cx, cy, 220, '255,196,110', 0.85);
  glowDot(g, cx, cy, 14, { a: 1 });
  // 光晕环
  for (let i = 1; i < 5; i++) glowCircle(g, cx, cy, 40 + i * 34, { w: 1.2, color: '#ffd9a2', glow: 14, alpha: 0.18 / i });
  caps(g, '∞ · 永不终止', cx, 700, { size: 13, ls: 3.4 });
  dust(g, t, { n: 120, seed: 653, alpha: 0.6 });
}

function mStarTheta(g, t, p) {
  skyBase(g, t, { glow: 0.2, stars: 320, seed: 655 });
  text(g, 'θ', W / 2, 470, { size: 66, weight: 600, color: 'rgba(240,228,206,0.85)', glow: 18, font: FONT_SERIF });
  text(g, '/ π', W / 2 + 130, 470, { size: 46, weight: 500, color: 'rgba(232,206,166,0.7)', glow: 12, font: FONT_SERIF });
  glowCircle(g, W / 2, 470, 220, { w: 1, color: '#e8cfa0', glow: 10, alpha: 0.25, dash: [2, 12] });
  dust(g, t, { n: 80, seed: 657, alpha: 0.5 });
}

function mShootingStar(g, t, p) {
  skyBase(g, t, { glow: 0.15, stars: 300, seed: 659 });
  // 流星
  const u = clamp(p * 1.2);
  const x = lerp(180, W - 260, u), y = lerp(220, 640, u);
  glowLine(g, [[x - 220, y - 130], [x, y]], { w: 2.6, color: '#fff0d7', glow: 26, alpha: 0.9 });
  glowDot(g, x, y, 4, { a: 1 });
  softGlow(g, x, y, 160, '255,220,170', 0.4);
  // 数字列
  const r = mulberry(661);
  g.save(); g.globalAlpha = 0.35; g.font = `500 15px ui-monospace,monospace`; g.fillStyle = 'rgba(226,214,192,0.7)';
  for (let i = 0; i < 18; i++) {
    let s = ''; for (let k = 0; k < 16; k++) s += r() > 0.5 ? '1' : '0';
    g.fillText(s, 100, 220 + i * 30);
  }
  g.restore();
  caps(g, 'GALOIS · 二十岁', 100, 180, { size: 12, ls: 2.6 });
}

function mRiemann1859(g, t, p) {
  skyBase(g, t, { glow: 0.18, stars: 260, seed: 663 });
  // 尘埃数字雨
  const r = mulberry(665);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 260; i++) {
    const x = r() * W, y = r() * H * 0.85, sz = 2 + r() * 5;
    g.globalAlpha = 0.25 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.6 + i));
    g.drawImage(TEX.dust, x, y, sz, sz);
  }
  g.restore();
  text(g, '1859', 330, 330, { size: 150, weight: 900, color: '#f2e7d2', align: 'left', glow: 30, font: FONT_EN, ls: 4 });
  // 手稿卡
  cardBlock(g, 700, 240, 420, 420, { tag: 'RIEMANN · 1859' });
  text(g, '黎曼', 720, 320, { size: 36, weight: 800, color: '#f2e9d8', align: 'left', glow: 12 });
  caps(g, 'ON THE NUMBER OF PRIMES', 720, 366, { size: 10, ls: 1.8 });
  ruled(g, 720, 400, 360, 16, { lh: 15, color: 'rgba(230,220,200,0.20)' });
  // 小圆图
  glowCircle(g, 1080, 560, 60, { w: 1.4, color: '#e8cfa0', glow: 10, alpha: 0.6 });
  text(g, 'ζ(s) = 0', 720, 640, { size: 20, weight: 500, color: 'rgba(234,220,198,0.7)', align: 'left', glow: 6, font: FONT_SERIF });
  dust(g, t, { n: 60, seed: 667, alpha: 0.4 });
}

function mWiles(g, t, p) {
  skyBase(g, t, { glow: 0.14, stars: 240, seed: 669 });
  text(g, '怀尔斯', W / 2, 400, { size: 60, weight: 900, color: '#f4ecdc', glow: 24, ls: 6 });
  caps(g, 'ANDREW WILES · 1994 · 剑桥', W / 2, 468, { size: 12, ls: 3 });
  glowLine(g, [[W / 2 - 240, 540], [W / 2 + 240, 540]], { w: 1.4, color: '#e8cfa0', glow: 10, alpha: 0.5 });
  text(g, '强忍泪水', W / 2, 590, { size: 22, weight: 600, color: 'rgba(234,220,198,0.8)', glow: 8, ls: 3 });
  dust(g, t, { n: 50, seed: 671, alpha: 0.4 });
}

// ---------------------------------------------------------------- 歌词（中英，时间是原片字幕换行点）
const LYRICS = [
  [13.10, 15.70, '我画下一道线，数着日子流过', 'I draw a line and count the days go by'],
  [15.70, 17.50, '一、二、三，在天空下', 'One two three beneath the sky'],
  [17.50, 20.30, '三、四、五，直角成立', 'Three and four and five, the corner\'s right'],
  [20.30, 22.30, '欧几里得把它画得干净明丽', 'Euclid drew it clean and bright'],
  [22.30, 24.20, '一个圆，一把直尺，别无他物', 'A circle and a ruler, nothing more'],
  [24.20, 25.60, '推开最古老的那扇门', 'Open up the oldest door'],
  [25.60, 27.20, '圆啊，告诉我 π 是多少', 'Circle, tell me what is π'],
  [27.20, 30.00, '我一路数到无穷', 'I\'m counting to infinity'],
  [30.00, 33.50, '把圆切开，看清楚', 'Cut the circle, look and see'],
  [33.50, 35.80, '3.14159', 'Three point one four one five nine'],
  [35.80, 37.40, '永不终止，依然排成一行', 'Never ending, still in line'],
  [37.40, 39.00, '零出现了，规则从此改写', 'Zero came and changed the game'],
  [39.00, 42.90, '「无」终于有了名字', 'Nothing finally has a name'],
  [49.40, 52.80, '未知数 x 藏起来了，快找到它', 'X is hiding, find it fast'],
  [52.80, 54.70, '巴格达终于写下了规则', 'Baghdad wrote the rules at last'],
  [54.70, 56.50, '笛卡尔把 x 和 y', 'Descartes put the x and y'],
  [56.50, 58.00, '铺成横跨天空的网格', 'On a grid across the sky'],
  [58.00, 59.90, '牛顿把瞬间切到无穷小', 'Newton made the moment small'],
  [59.90, 63.30, '看曲线起起落落', 'Watch the curve rise up and fall'],
  [63.30, 67.50, '欧拉，给我看一个真理', 'Euler, show me something true'],
  [67.50, 70.90, '我一路数到无穷', 'I\'m counting to infinity'],
  [70.90, 74.00, '高斯还年少，却已看穿', 'Gauss was young, but he could see'],
  [74.00, 76.90, 'e 的 iπ 次方加一', 'e to the i pi plus one'],
  [76.90, 78.80, '等于零，就此完成', 'Equals zero, it is done'],
  [78.80, 80.90, '伽罗瓦奋笔疾书一整夜', 'Galois wrote all through the night'],
  [80.90, 82.80, '二十岁，一道流星', 'Twenty years, a shooting light'],
  [82.80, 84.30, '一种无穷就够了吗？', 'Is one infinity enough?'],
  [84.30, 86.20, '康托说，还有更大的', 'Cantor says there\'s bigger stuff'],
  [86.20, 87.80, '黎曼的零点排成一线', 'Riemann\'s zeros in a line'],
  [87.80, 89.40, '至今无人能证明', 'No one\'s proved it all this time'],
  [89.40, 91.40, '希尔伯特说：我们终将知道', 'Hilbert said we all will know'],
  [91.40, 93.60, '哥德尔笑着说：不', 'Gödel smiled and told him no'],
  [93.60, 95.00, '图灵，为我造一颗会思考的心', 'Turing, build a mind for me'],
  [95.00, 98.00, '我一路数到无穷', 'I\'m counting to infinity'],
  [98.00, 101.50, '一和零，你和我', 'Ones and zeros, you and me'],
  [101.50, 104.80, '机器从黄昏想到黎明', 'Machines that think from dusk to dawn'],
  [104.80, 107.20, '规则一条接一条，永不停', 'Rules go on and on and on'],
  [107.20, 109.30, '弯曲空间，折起直线', 'Bend the space and fold the line'],
  [109.30, 114.40, '只有心智才能找到的形状', 'Shapes that only minds can find'],
  [114.40, 116.70, '杂货铺的少年，深夜捧着书', 'A shop boy with a book at night'],
  [116.70, 118.30, '小屋微光里的「1+2」', 'One plus two in a tiny light'],
  [118.30, 121.40, '费马的谜等了三百多年', 'Fermat waited all those years'],
  [121.40, 123.30, '怀尔斯找到了，强忍泪水', 'Wiles found it, held back tears'],
  [123.30, 125.00, '一个人解开它，转身离去', 'One man solved it, walked away'],
  [125.00, 128.00, '七大难题，如今解开了一个', 'Seven doors, one open today'],
  [128.00, 130.10, '我一路数到无穷', 'I\'m counting to infinity'],
  [130.10, 131.40, '看，两个来自中国的年轻名字', 'Two young names from China, see'],
  [131.40, 133.90, '她让一根针转遍所有方向', 'She turns a needle every way'],
  [133.90, 137.50, '他让微小的粒子化作奔流', 'He turns tiny balls to flow and spray'],
  [137.50, 140.50, '一台机器宣布：水流会「破裂」', 'A machine says water breaks, they say'],
  [140.50, 147.30, '还剩六道难题，轮到你了，去找路', 'Six more doors, it\'s your turn, find the way'],
];

// ---------------------------------------------------------------- 播放器
const cv = document.getElementById('c');
const g = cv.getContext('2d', { alpha: false });
const audio = document.getElementById('a');
const info = document.getElementById('info');
const scrub = document.getElementById('scrub');
const btn = document.getElementById('play');

// ---------------------------------------------------------------- 画质档位
// 舞台逻辑尺寸固定 1652×1080；档位只改画布内部像素与帧率上限。
const QUALITIES = {
  '1080p60': { label: '1080P 60 · 默认', k: 1, fps: 60 },
  '4k30':    { label: '4K 30',          k: 2, fps: 30 },
  '4k60':    { label: '4K 60',          k: 2, fps: 60 },
  '1080p30': { label: '1080P 30',       k: 1, fps: 30 },
  '720p30':  { label: '720P 30',        k: 2 / 3, fps: 30 },
};
let quality = '1080p60', targetFps = 60;

function applyQuality(q, save) {
  const p = QUALITIES[q] ? q : '1080p60';
  quality = p; targetFps = QUALITIES[p].fps;
  RS = QUALITIES[p].k;
  if (typeof _textCache !== 'undefined') _textCache.clear();
  cv.width = Math.round(W * RS);
  cv.height = Math.round(H * RS);
  fitCanvas();
  if (save) { try { localStorage.setItem('mv-q', p); } catch (e) { } }
  const sel = document.getElementById('q');
  if (sel && sel.value !== p) sel.value = p;
}

let playing = false, tNow = 0, fps = 60, frames = 0, tFps = performance.now();
let useAudio = true;
let lastDraw = 0, lastNow = 0;

function shotIndex(t) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i][0]) return i;
  return 0;
}

let SUBTEST = false;
function drawFrame(t) {
  if (SUBTEST) {
    g.setTransform(RS, 0, 0, RS, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#101010'; g.fillRect(0, 0, W, H);
    subtitle(g, '三、四、五，直角成立', 'Three and four and five', 20, 17.4, 21.0);
    return;
  }
  const i = shotIndex(t);
  const [t0, t1, chapter, fn, opt] = SHOTS[i];
  const p = clamp((t - t0) / (t1 - t0));
  const light = !!(opt && opt.light);
  g.save();
  g.setTransform(RS, 0, 0, RS, 0, 0);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none';
  reseed(1000 + i * 7919);
  // 画面（带轻微呼吸/漂移，让镜头有生命）
  g.save();
  const br = 1 + 0.006 * Math.sin(t * 0.7);
  g.translate(W / 2 + Math.sin(t * 0.31) * 5, H / 2 + Math.cos(t * 0.27) * 4);
  g.scale(br, br);
  g.translate(-W / 2, -H / 2);
  fn(g, t, p);
  g.restore();
  // 后期（只对画面层）
  bloom(g, t, 0.20);
  atmosphere(g, t, { warm: light ? 0.5 : 1 });
  // HUD
  hudBar(g, chapter, { light });
  hudMeta(g, { tcode: 'T ' + fmt(t), light });
  cornerTicks(g, { light });
  // 字幕
  const ly = LYRICS.find(l => t >= l[0] && t < l[1]);
  if (ly) subtitle(g, ly[2], ly[3], t, ly[0], ly[1], { light });
  // 颗粒 + 暗角
  grain(g, t, 0.075);
  vignette(g, { a: 0.8 });
  g.restore();
}

let lastErr = '';
function drawSafe(t) {
  try { drawFrame(t); }
  catch (e) {
    lastErr = e.message;
    const el = document.getElementById('err');
    if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + e.message + '\n' + (e.stack || ''); }
  }
}

function fmt(t) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return String(m).padStart(2, '0') + ':' + s.toFixed(3).padStart(6, '0');
}

// ---------------------------------------------------------------- 播放
function setPlaying(v) {
  playing = v;
  btn.textContent = playing ? 'PAUSE' : 'PLAY';
  if (useAudio && audio) {
    if (playing) {
      try { audio.currentTime = tNow; } catch (e) { }
      const pr = audio.play();
      if (pr && pr.catch) pr.catch(() => { playing = false; btn.textContent = 'PLAY'; document.body.classList.remove('playing'); });
    } else audio.pause();
  }
  if (playing) document.body.classList.add('playing');
  else document.body.classList.remove('playing');
}

function loop() {
  requestAnimationFrame(loop);
  const nowMs = performance.now();
  const dt = lastNow ? Math.min(0.1, (nowMs - lastNow) / 1000) : 1 / 60;
  lastNow = nowMs;
  if (nowMs - lastDraw < 1000 / targetFps - 1.2) return; // 限帧
  lastDraw = nowMs;
  if (playing) {
    if (useAudio && audio && !audio.paused && audio.readyState > 2) tNow = audio.currentTime;
    else tNow += dt;
  }
  if (tNow > DUR) { tNow = 0; if (playing) { try { audio.currentTime = 0; } catch (e) { } } }
  drawSafe(Math.min(tNow, DUR));
  frames++;
  const now = performance.now();
  if (now - tFps > 500) {
    fps = frames * 1000 / (now - tFps); frames = 0; tFps = now;
    info.textContent = `${tNow.toFixed(2)}s · ${Math.round(W * RS)}×${Math.round(H * RS)} · ${fps.toFixed(0)}fps`;
  }
  scrub.value = String(tNow / DUR);
}

btn.onclick = () => setPlaying(!playing);
scrub.oninput = () => { tNow = parseFloat(scrub.value) * DUR; if (useAudio && audio) audio.currentTime = tNow; };
addEventListener('keydown', ev => {
  if (ev.code === 'Space') { ev.preventDefault(); setPlaying(!playing); }
  if (ev.code === 'ArrowRight') { tNow = Math.min(DUR, tNow + 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'ArrowLeft') { tNow = Math.max(0, tNow - 5); if (useAudio && audio) audio.currentTime = tNow; }
  if (ev.code === 'KeyM') { useAudio = !useAudio; }
});
let showT = 0;
document.addEventListener('click', ev => {
  if (ev.target.closest && ev.target.closest('#bar')) return;
  if (!playing) { setPlaying(true); return; }
  document.body.classList.add('showbar');
  clearTimeout(showT);
  showT = setTimeout(() => document.body.classList.remove('showbar'), 3200);
});

// 画布自适应：按窗口等比缩放（不依赖 CSS 的 max-width/height）
function fitCanvas() {
  const clean = document.body.classList.contains('clean');
  const w = (window && window.innerWidth) || 1652;
  const h = ((window && window.innerHeight) || 1080) - (clean ? 0 : 46);
  const k = Math.min(w / W, h / H);
  if (cv && cv.style) {
    cv.style.width = Math.round(W * k) + 'px';
    cv.style.height = Math.round(H * k) + 'px';
  }
}
if (typeof addEventListener === 'function') addEventListener('resize', fitCanvas);

// 调试通道：cmd.json 里给 v（版本变了重载）/ t（定帧），只在 ?cmd=1 时启用
let startV = null;
async function pollCmd() {
  try {
    const r = await fetch('cmd.json?' + Date.now());
    const j = await r.json();
    if (j.v !== undefined) {
      if (startV === null) startV = String(j.v);
      else if (String(j.v) !== startV) { location.replace(location.pathname + '?r=' + Date.now()); return; }
    }
    if (typeof j.t === 'number' && Math.abs(j.t - tNow) > 0.01) { tNow = j.t; if (useAudio && audio) audio.currentTime = j.t; }
    if (j.play === true && !playing) setPlaying(true);
    if (j.play === false && playing) setPlaying(false);
    if (j.clean !== undefined) { document.body.classList.toggle('clean', !!j.clean); fitCanvas(); }
    if (j.subtest !== undefined) SUBTEST = !!j.subtest;
  } catch (e) { }
  setTimeout(pollCmd, 400);
}

addEventListener('error', ev => {
  const el = document.getElementById('err');
  if (el) { el.style.display = 'block'; el.textContent = 'ERR ' + (ev.message || ''); }
});

buildTextures();
initFX();
// 画质：?q=4k30 > localStorage > 默认 1080P60
let startQ = '1080p60';
try {
  const m = location.search.match(/[?&]q=([a-z0-9]+)/i);
  if (m && QUALITIES[m[1].toLowerCase()]) startQ = m[1].toLowerCase();
  else { const saved = localStorage.getItem('mv-q'); if (saved && QUALITIES[saved]) startQ = saved; }
} catch (e) { }
applyQuality(startQ, false);
const qSel = document.getElementById('q');
if (qSel) qSel.addEventListener('change', () => applyQuality(qSel.value, true));
fitCanvas();
if (location.search.includes('clean')) document.body.classList.add('clean'), fitCanvas();
{
  const m = location.search.match(/[?&]t=([\d.]+)/);
  if (m) tNow = parseFloat(m[1]) || 0;
}
if (location.search.includes('play')) setTimeout(() => setPlaying(true), 400);
else setTimeout(() => setPlaying(true), 350); // 先试自动播，被拦就等用户点一下
drawSafe(tNow);
loop();
if (location.search.includes('cmd=1')) pollCmd();
