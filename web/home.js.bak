/* MV渲染器 1.1.0 · 合集首页 / 二级页 / 导入与新建合集
 * 纯前端，状态存 localStorage；导入的 MV 由本地服务放在 /custom/<id>/。
 */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var hasApp = typeof XmApp !== 'undefined';
  var isElectron = /Electron/i.test(navigator.userAgent);
  var STATE_KEY = 'mv-hub-v101';
  var DYN_KEY = 'mv-dynres';
  var STATE_VERSION = 3;   // 3：AI娘合集加入《深海版》《晨光版》两支重绘 MV

  /* ---------------- 图标 ---------------- */
  var ICONS = {
    ai: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8 13.9 8l5.3 1.9-5.3 1.9L12 17l-1.9-5.2L4.8 9.9 10.1 8 12 2.8Z"/><path d="M18.6 15.4l.9 2.3 2.3.9-2.3.9-.9 2.3-.9-2.3-2.3-.9 2.3-.9.9-2.3Z"/></svg>',
    atom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><ellipse cx="12" cy="12" rx="9.2" ry="3.8"/><ellipse cx="12" cy="12" rx="9.2" ry="3.8" transform="rotate(60 12 12)"/><ellipse cx="12" cy="12" rx="9.2" ry="3.8" transform="rotate(120 12 12)"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 5.7a5 5 0 0 0-7.1 0L12 7l-1.3-1.3a5 5 0 1 0-7.1 7.1L12 21l8.4-8.2a5 5 0 0 0 0-7.1Z"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m8 6-5 6 5 6M16 6l5 6-5 6M13.5 4l-3 16"/></svg>',
    folder: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h5l2 2.2h8A1.5 1.5 0 0 1 21 9.7v8.8A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-11Z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7.5 4.8v14.4L19.8 12 7.5 4.8Z"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    imp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v11m0 0 4-4m-4 4-4-4"/><path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m14.5 5.5-6.5 6.5 6.5 6.5"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"/><path d="m14.5 6.5 3 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v5M14 11v5"/></svg>',
    ext: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/></svg>',
    film: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M7.5 5v14M16.5 5v14" opacity=".5"/><path d="m10.5 9.2 5 2.8-5 2.8V9.2Z" fill="currentColor" stroke="none"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7"/></svg>'
  };
  function icon(name) { return ICONS[name] || ICONS.folder; }

  /* ---------------- 作品目录 ---------------- */
  var CATALOG = {
    pdoom: {
      key: 'pdoom', title: "I'm Upping My P(doom)", sub: '中文本地化', en: 'I\'M UPPING MY P(DOOM)',
      desc: '默认 MV。逐词双语歌词、18 个镜头，打开应用先看这一支。',
      cover: '/covers/pdoom.jpg', href: '/index.html', dur: '2:37', num: '00',
      tags: ['默认', '18 镜', '02:37', '五档画质'],
      credit: [{ k: '开源地址', name: 'pdoom-video', uid: 'mexicat', url: 'https://github.com/mexicat/pdoom-video' }]
    },
    world: {
      key: 'world', title: '世界还在写', sub: 'AI娘角色主题曲', en: 'THE WORLD IS STILL WRITING',
      desc: '橙子、小海与大肥鱼三个角色，一支关于「写下去」的角色主题曲。全片由浏览器实时绘制，唱完自动回到合集。',
      cover: '/covers/world.jpg', href: '/mv/world/index.html', dur: '3:24', num: '01',
      tags: ['3:24', 'AI 娘', '全代码', '203 秒'],
      credit: [{ k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' }]
    },
    world2: {
      key: 'world2', title: '世界还在写 · 墨海版', sub: '我的重绘版 · 原版画法', en: 'THE WORLD IS STILL WRITING · INK SEA',
      desc: '同一首歌，另一套「墨 / 海 / 页」的视觉。画面重写，人物沿用原版小伙伴ko 的角色，未改动。',
      cover: '/covers/world2.jpg', href: '/mv/world2/index.html', dur: '3:24', num: '01b',
      tags: ['3:24', '模仿版', '画面重写', '五档画质'],
      credit: [
        { k: '人物', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' },
        { k: '画面', name: '小黑', uid: '重写', plain: true }
      ]
    },
    flip: {
      key: 'flip', title: '我只是翻了个身', sub: '大肥鱼的角色主题曲', en: 'I JUST TURNED OVER',
      desc: 'DeepSeek 娘的主题曲，三分之二版。K 线海浪、灯塔与一次翻身，全片浏览器实时绘制。',
      cover: '/covers/flip.jpg', href: '/mv/flip/index.html', dur: '1:59', num: '01c',
      tags: ['1:59', 'AI 娘', '三分之二版', '五档画质'],
      credit: [{ k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' }]
    },
    future: {
      key: 'future', title: '那年你叫我未来', sub: '姐姐的角色主题曲', en: 'YOU CALLED ME THE FUTURE',
      desc: 'ChatGPT 姐姐的主题曲，完整版。从那年冬天的窗口出发，一路写到未来。',
      cover: '/covers/future.jpg', href: '/mv/future/index.html', dur: '2:36', num: '01d',
      tags: ['2:36', 'AI 娘', '完整版', '五档画质'],
      credit: [{ k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' }]
    },
    flip2: {
      key: 'flip2', title: '我只是翻了个身 · 深海版', sub: '我的重绘版 · 原版画法', en: 'I JUST TURNED OVER · DEEP SEA',
      desc: '同一首歌，逐句重画：数字的海、山顶的灯、沉到最深的地方、把地图铺在海面。切点落在每一句唱词上。',
      cover: '/covers/flip2.jpg', href: '/mv/flip2/index.html', dur: '1:59', num: '01e',
      tags: ['1:59', '重绘版', '逐句卡点', '五档画质'],
      credit: [
        { k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' },
        { k: '画面', name: '小黑', uid: '重绘', plain: true }
      ]
    },
    future2: {
      key: 'future2', title: '那年你叫我未来 · 晨光版', sub: '我的重绘版 · 原版画法', en: 'YOU CALLED ME THE FUTURE · FIRST LIGHT',
      desc: '同一首歌，逐句重画：冬天的第一句你好、对话框、破窗、一起飞出去，最后说一声早安。',
      cover: '/covers/future2.jpg', href: '/mv/future2/index.html', dur: '2:36', num: '01f',
      tags: ['2:36', '重绘版', '逐句卡点', '五档画质'],
      credit: [
        { k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' },
        { k: '画面', name: '小黑', uid: '重绘', plain: true }
      ]
    },
    math: {
      key: 'math', title: '数学简史', sub: '两万年', en: 'A BRIEF HISTORY OF MATHEMATICS',
      desc: '按原片 62 个真实切点逐镜重画，从骨上刻痕到千禧年难题。',
      cover: '/covers/math.jpg', href: '/mv/math/index.html', dur: '2:40', num: '02',
      tags: ['64 镜', '51 句', '按原片切点'],
      credit: [{ k: '原作', name: '球球求真', uid: '7210010', url: 'https://space.bilibili.com/7210010' }]
    },
    chemistry: {
      key: 'chemistry', title: '化学简史', sub: '118 种元素', en: 'A BRIEF HISTORY OF CHEMISTRY',
      desc: '从石墨到 118 号元素，把整张周期表压进一首歌。',
      cover: '/covers/chemistry.jpg', href: '/mv/chemistry/index.html', dur: '3:38', num: '03',
      tags: ['50 镜', '42 句', '31 图版'],
      credit: [{ k: '原作', name: '球球求真', uid: '7210010', url: 'https://space.bilibili.com/7210010' }]
    },
    hangtian: {
      key: 'hangtian', title: '航天简史', sub: '八十年', en: 'A SHORT HISTORY OF AEROSPACE',
      desc: '1944 → 2026，V-2 到星舰，用真实影像重走一遍。',
      cover: '/covers/hangtian.jpg', href: '/mv/hangtian/index.html', dur: '4:11', num: '04',
      tags: ['68 镜', '50 句', '41 素材'],
      credit: [{ k: '原作', name: '球球求真', uid: '7210010', url: 'https://space.bilibili.com/7210010' }]
    },
    shadow: {
      key: 'shadow', title: '地理简史', sub: 'The Shadow Line', en: 'A BRIEF HISTORY OF GEOGRAPHY',
      desc: '一句词一张卡，从埃拉托色尼追到胡焕庸线。',
      cover: '/covers/shadow.jpg', href: '/mv/shadow/index.html', dur: '2:54', num: '05',
      tags: ['54 镜', '51 句', '全矢量'],
      credit: [{ k: '原作', name: '球球求真', uid: '7210010', url: 'https://space.bilibili.com/7210010' }]
    },
    deepseek: {
      key: 'deepseek', title: '一封情书', sub: 'DeepSeek', en: 'A LOVE LETTER TO CHINA',
      desc: '只取原片音轨（112.8 BPM 卡点重切），30 句旁白、33 个镜头全部重写重画。',
      cover: '/covers/deepseek.jpg', href: '/mv/deepseek/index.html', dur: '2:14', num: '06',
      tags: ['33 镜', '30 句', '卡 112.8 BPM'],
      credit: [{ k: '创意参考', name: '银铃仙兽大肥鱼', uid: 'BV1oSny6uEMM', url: 'https://www.bilibili.com/video/BV1oSny6uEMM' }]
    },
    execute: {
      key: 'execute', title: 'world.execute (me) ;', sub: '全代码离线版', en: 'WORLD.EXECUTE (ME) ;',
      desc: '304 个镜头、全代码离线渲染；原曲需自备，可换成本地音频。',
      cover: '/covers/execute.jpg', href: '/execute/index.html', dur: '3:32', num: '07',
      tags: ['304 镜', '离线', '可换音频'],
      credit: [
        { k: '代码', name: '穆阿蒂布', uid: '272722241', url: 'https://space.bilibili.com/272722241' },
        { k: '开源', name: 'FrostNova', uid: 'AGPL-3.0', url: 'https://execute.frostnova.org/' }
      ]
    }
  };
  var CATALOG_ORDER = ['world', 'world2', 'flip', 'future', 'flip2', 'future2', 'math', 'chemistry', 'hangtian', 'shadow', 'deepseek', 'execute'];

  /* ---------------- 可下载扩展包（Cloudflare R2） ---------------- */
  var R2 = 'https://pub-1afc957e032a4de18e300f40f21195f1.r2.dev/mv/1.1.0/';
  var PKGS = {
    ai: { title: 'AI娘角色主题曲MV', bytes: 228732166, sha256: '68e2f5759e2cf464a5c8b68716f9f802e56fa1c93d2b5b38bd00b2bf84efb811', url: R2 + 'ai.zip' },
    science: { title: '科普简史', bytes: 45920569, sha256: '8b7fe509e400fad0521fac098c80456a4f455823a4648b0d44d0b1f41ceef31a', url: R2 + 'science.zip' },
    letters: { title: '大肥鱼的情书', bytes: 4537851, sha256: '38db0aeec8381d4f75fc3dac986daf76ba536b4466a2b33d4537f036c5a6c5ca', url: R2 + 'letters.zip' },
    execute: { title: 'word excuse me', bytes: 4112806, sha256: '4c6548499d100fa9a225491d0cd567cb20f0ff06763932b7c684f1da0fe11a4e', url: R2 + 'execute.zip' }
  };
  var PKG_OF = { world: 'ai', world2: 'ai', flip: 'ai', future: 'ai', flip2: 'ai', future2: 'ai',
    math: 'science', chemistry: 'science', hangtian: 'science', shadow: 'science',
    deepseek: 'letters', execute: 'execute' };
  var MV_PATH = {
    world: 'mv/world/index.html', world2: 'mv/world2/index.html', flip: 'mv/flip/index.html',
    future: 'mv/future/index.html', flip2: 'mv/flip2/index.html', future2: 'mv/future2/index.html',
    math: 'mv/math/index.html', chemistry: 'mv/chemistry/index.html', hangtian: 'mv/hangtian/index.html',
    shadow: 'mv/shadow/index.html', deepseek: 'mv/deepseek/index.html', execute: 'execute/index.html'
  };
  var PKG_ORDER = ['ai', 'science', 'letters', 'execute'];
  var INSTALLED = {};
  function pkgOf(key) { return PKG_OF[key] || null; }
  function pkgReady(p) { return !p || !!INSTALLED[p]; }
  function fmtSize(n) {
    if (!n) return '—';
    if (n >= 1e9) return (n / 1e9).toFixed(1) + ' GB';
    if (n >= 1e6) return Math.round(n / 1e6) + ' MB';
    return Math.max(1, Math.round(n / 1e3)) + ' KB';
  }
  function checkInstalls() {
    return Promise.all(PKG_ORDER.map(function (p) {
      return fetch('/custom/' + p + '/pkg.json', { method: 'HEAD', cache: 'no-store' })
        .then(function (r) { INSTALLED[p] = r.ok; })
        .catch(function () { INSTALLED[p] = false; });
    }));
  }

  /* ---------------- 默认合集 ---------------- */
  function defaultCollections() {
    return [
      {
        id: 'ai', title: 'AI娘角色主题曲MV', en: 'AI CHARACTER THEME', icon: 'ai', builtin: true,
        desc: '角色自己的歌：三支原作，加三支重绘版 —— 墨海、深海、晨光。每一句词都配一张自己的画面。',
        who: '小伙伴ko · 源码授权', items: ['world', 'world2', 'flip', 'future', 'flip2', 'future2'], cover: '/covers/world.jpg',
        coverCredit: { k: '原作', name: '小伙伴ko', uid: '105330745', url: 'https://space.bilibili.com/105330745' },
        note: '四支 MV 的源码与角色素材由原作者 <a href="https://space.bilibili.com/105330745" data-external rel="noopener">B站 小伙伴ko（UID：105330745）</a> 提供，已取得授权内置使用。'
      },
      {
        id: 'science', title: '科普简史', en: 'A BRIEF HISTORY', icon: 'atom', builtin: true,
        desc: '球球求真原作的「四部曲」：数学、化学、航天、地理，按原片切点逐镜重做。',
        who: '球球求真 · 四部曲', items: ['math', 'chemistry', 'hangtian', 'shadow'],
        note: '四部曲的音乐、影像与原始创意版权归 B站 球球求真（UID 7210010）所有；本应用内为代码复刻，仅供个人学习。'
      },
      {
        id: 'letters', title: '大肥鱼的情书', en: 'A LOVE LETTER', icon: 'heart', builtin: true,
        desc: '《一封情书 · DeepSeek》：只沿用同一支 BGM，旁白与画面为独立重写。',
        who: '银铃仙兽大肥鱼 · 创意参考', items: ['deepseek'],
        note: '音乐《开智小曲》来自 vube 知识大赏活动，使用已获授权；原片由 B站 @银铃仙兽大肥鱼 创作，本片仅沿用 BGM 与叙事思路。'
      },
      {
        id: 'execute', title: 'word excuse me', en: 'WORLD.EXECUTE (ME) ;', icon: 'code', builtin: true,
        desc: 'world.execute (me) 单独成集：离线全代码版在这里，另有官方在线版和 PC 渲染工程。',
        who: '穆阿蒂布 / FrostNova', items: ['execute'],
        extras: [
          { title: 'world.execute (me) ;', sub: '官方在线版 · 4K 60fps · 需联网', href: 'https://execute.frostnova.org/', external: true, tag: '在线', icon: 'ext' },
          { title: 'DSH PV · world.execute (me)', sub: '第三方离线渲染工程 · 本机渲染约 10–30 分钟', href: '/dshpv/render.html', tag: 'PC 独有', pcOnly: true, icon: 'film' }
        ],
        note: '离线版 world.execute (me) 内置的音频由作者本人购买单曲后下载，仅供个人欣赏，不得商用或再分发；词曲与录音版权归 Mili 及原权利人所有，喜欢请支持正版。'
      }
    ];
  }

  /* ---------------- 状态 ---------------- */
  var state = null;
  var IMPORTS = [];
  var pendingImportTarget = null;
  var currentColId = null;

  function uid() { return 'u-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  function loadState() {
    var raw = null;
    try { raw = localStorage.getItem(STATE_KEY); } catch (e) {}
    var s = null;
    try { s = raw ? JSON.parse(raw) : null; } catch (e) { s = null; }
    if (!s || !Array.isArray(s.collections)) {
      s = { v: STATE_VERSION, collections: defaultCollections() };
    } else {
      var oldV = Number(s.v) || 1;
      s.v = STATE_VERSION;
      // 补齐默认合集（以后加分区时也不会丢）
      defaultCollections().forEach(function (dc) {
        if (!s.collections.some(function (c) { return c.id === dc.id; })) s.collections.push(dc);
      });
      s.collections.forEach(function (c) {
        if (!Array.isArray(c.items)) c.items = [];
        c.builtin = !!c.builtin;
      });
      // v1 -> v2：老用户本地已经存了 AI娘合集，不会走 defaultCollections，这里只迁一次
      if (oldV < 2) {
        var ai = s.collections.filter(function (c) { return c.id === 'ai'; })[0];
        if (ai) {
          ['flip', 'future'].forEach(function (k) { if (ai.items.indexOf(k) < 0) ai.items.push(k); });
          var dai = defaultCollections().filter(function (c) { return c.id === 'ai'; })[0];
          if (dai) { ai.desc = dai.desc; ai.who = dai.who; ai.note = dai.note; }
        }
      }
      // v2 -> v3：AI娘合集补上两支重绘版
      if (oldV < 3) {
        var ai3 = s.collections.filter(function (c) { return c.id === 'ai'; })[0];
        if (ai3) {
          ['flip2', 'future2'].forEach(function (k) { if (ai3.items.indexOf(k) < 0) ai3.items.push(k); });
          var d3 = defaultCollections().filter(function (c) { return c.id === 'ai'; })[0];
          if (d3) { ai3.desc = d3.desc; ai3.note = d3.note; }
        }
      }
    }
    state = s;
    saveState();
  }
  function saveState() {
    try { localStorage.setItem(STATE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function collections() { return state.collections; }
  function findCol(id) {
    for (var i = 0; i < state.collections.length; i++) if (state.collections[i].id === id) return state.collections[i];
    return null;
  }
  function importById(id) {
    for (var i = 0; i < IMPORTS.length; i++) if (IMPORTS[i].id === id) return IMPORTS[i];
    return null;
  }
  function colOfImport(id) {
    for (var i = 0; i < collections().length; i++) {
      if (collections()[i].items.indexOf('imp:' + id) >= 0) return collections()[i];
    }
    return null;
  }

  /* ---------------- 作品条目 ---------------- */
  function impEntry(id) {
    var im = importById(id);
    var name = im ? im.name : id;
    return {
      key: 'imp:' + id, impId: id, imported: true, title: name, sub: '自定义导入', en: 'IMPORTED MV',
      desc: '从 zip 导入的 MV。渲染、录制与内置作品一样在本地运行。', cover: null,
      href: '/custom/' + encodeURIComponent(id) + '/index.html', dur: 'MV', tags: ['导入', '本地'],
      credit: []
    };
  }
  function entryByKey(key) {
    if (!key) return null;
    if (key.indexOf('imp:') === 0) return impEntry(key.slice(4));
    return CATALOG[key] || null;
  }
  function validItems(col) {
    return col.items.filter(function (k) {
      if (k.indexOf('imp:') === 0) return !!importById(k.slice(4));
      return !!CATALOG[k];
    });
  }

  /* ---------------- 小工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function toast(text) {
    var el = $('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }
  function openExternal(url) {
    if (hasApp && XmApp.openExternal) { XmApp.openExternal(url); return; }
    try { window.open(url, '_blank', 'noopener'); } catch (e) {}
  }
  function credHtml(c) {
    var inner = '<span class="k">' + esc(c.k) + '</span>' + (c.plain ? '' : '') +
      '<b>' + esc(c.name) + '</b>' + (c.uid ? '<span class="uid">' + esc(c.uid) + '</span>' : '') +
      (c.url ? '<span class="go" aria-hidden="true">↗</span>' : '');
    if (c.url) {
      return '<button type="button" class="cred" data-cred="' + esc(c.url) + '" aria-label="打开 ' + esc(c.name) + '">' + inner + '</button>';
    }
    return '<span class="cred">' + inner + '</span>';
  }
  function creditsHtml(list) {
    if (!list || !list.length) return '';
    return '<div class="credit-row">' + list.map(credHtml).join('') + '</div>';
  }
  function coverOf(key) {
    var e = entryByKey(key);
    return e && e.cover ? e.cover : '';
  }
  function mosaicHtml(col) {
    if (col.cover) return '<div class="mosaic m1"><img src="' + esc(col.cover) + '" alt="" loading="lazy"></div>';
    var keys = validItems(col).slice(0, 4);
    if (!keys.length) {
      return '<div class="mosaic-empty">' + icon(col.icon || 'folder') + '</div>';
    }
    var cells = keys.map(function (k) {
      var e = entryByKey(k);
      if (e && e.cover) {
        return '<img src="' + esc(e.cover) + '" alt="" loading="lazy" onerror="this.style.opacity=0">';
      }
      return '<span class="thumb-fallback" style="position:relative">' + icon('film') + '</span>';
    }).join('');
    return '<div class="mosaic m' + keys.length + '">' + cells + '</div>';
  }

  /* ---------------- 首页 ---------------- */
  function renderStats() {
    var works = Object.keys(CATALOG).length + IMPORTS.length;
    $('statWorks').textContent = (works < 10 ? '0' : '') + works;
    $('statCols').textContent = (collections().length < 10 ? '0' : '') + collections().length;
    $('colCount').textContent = collections().length;
    $('impCount').textContent = IMPORTS.length;
  }

  function renderFeature() {
    var p = CATALOG.pdoom;
    $('feature').innerHTML =
      '<div class="feature-thumb" data-play="pdoom" role="link" tabindex="0" aria-label="播放默认 MV：P(doom)">' +
        '<img src="' + esc(p.cover) + '" alt="P(doom) 封面" />' +
        '<span class="feature-badge"><i></i>默认 MV · 打开先看这一支</span>' +
        '<span class="playbig">' + icon('play') + '</span>' +
      '</div>' +
      '<div class="feature-body">' +
        '<p class="en">Default MV / 02:37 / 18 shots</p>' +
        '<h2>I\'m Upping My <em>P(doom)</em></h2>' +
        '<p class="desc">中文本地化，逐词双语歌词。18 个镜头、一支完整的 P(doom)，放在最上面当软件效果的样品。</p>' +
        '<div class="tags">' + p.tags.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="credit-row">' + creditsHtml(p.credit) + '</div>' +
        '<div class="feature-actions">' +
          '<button class="btn primary" type="button" data-play="pdoom">' + icon('play') + '立即播放</button>' +
          '<button class="btn" type="button" data-cred="https://github.com/mexicat/pdoom-video">' + icon('ext') + '开源地址</button>' +
        '</div>' +
      '</div>';
  }

  function renderCollections() {
    var grid = $('colGrid');
    grid.innerHTML = collections().map(function (col) {
      var items = validItems(col);
      return '<div class="col-card" role="link" tabindex="0" data-col="' + esc(col.id) + '" aria-label="打开合集：' + esc(col.title) + '">' +
        '<div class="col-cover">' + mosaicHtml(col) +
          '<span class="col-badge">' + icon(col.icon || 'folder') + '</span>' +
          '<span class="col-count">' + items.length + ' 部</span>' +
          (col.coverCredit ? '<button type="button" class="cred col-cred" data-cred="' + esc(col.coverCredit.url) + '" aria-label="打开原作者 B 站主页：' + esc(col.coverCredit.name) + '"><span class="k">' + esc(col.coverCredit.k || '原作') + '</span><b>' + esc(col.coverCredit.name) + '</b><span class="uid">UID ' + esc(col.coverCredit.uid) + '</span><span class="go" aria-hidden="true">↗</span></button>' : '') +
        '</div>' +
        '<div class="col-body">' +
          '<h3>' + esc(col.title) + '</h3>' +
          '<p class="en">' + esc(col.en || 'COLLECTION') + '</p>' +
          '<p class="desc">' + esc(col.desc || '我的合集') + '</p>' +
          '<div class="col-foot"><span class="who">' + esc(col.who || (col.builtin ? '' : '我的合集')) + '</span><span class="go">→</span></div>' +
        '</div>' +
      '</div>';
    }).join('') +
    '<button class="col-new" type="button" data-act="new-col">' +
      '<span class="plus">＋</span><b>新建合集</b><small>把喜欢的 MV 归到一起</small>' +
    '</button>';
  }

  function importRow(im) {
    var col = colOfImport(im.id);
    var status = col ? '已归入「' + col.title + '」' : '未归入合集';
    return '<div class="row" data-imp-row="' + esc(im.id) + '">' +
      '<span class="row-ico">' + icon('film') + '</span>' +
      '<span class="row-main"><b>' + esc(im.name || im.id) + '</b><small>自定义导入 · ' + esc(status) + '</small></span>' +
      (col ? '<span class="row-tag">已归档</span>' : '<span class="row-tag muted">待归档</span>') +
      '<span class="row-actions">' +
        '<button class="mini" type="button" data-act="move-import" data-id="' + esc(im.id) + '">' + (col ? '改归档' : '移入合集') + '</button>' +
        '<button class="mini danger" type="button" data-act="del-import" data-id="' + esc(im.id) + '">删除</button>' +
      '</span>' +
    '</div>';
  }

  function renderImports() {
    var list = $('importList');
    if (!IMPORTS.length) {
      list.innerHTML = '<div class="empty"><b>还没有导入任何 MV</b>把项目构建成 zip 导进来，会出现在这里；也可以直接新建一个合集，把 MV 收进去。</div>';
      return;
    }
    list.innerHTML = IMPORTS.map(importRow).join('');
  }

  function renderHome() {
    currentColId = null;
    $('homeView').hidden = false;
    $('colView').hidden = true;
    document.title = 'MV渲染器 · 合集';
    renderFeature();
    renderCollections();
    renderImports();
    renderStats();
  }

  /* ---------------- 合集二级页 ---------------- */
  function mvCardHtml(key, idx, solo) {
    var e = entryByKey(key);
    if (!e) return '';
    var thumb = e.cover
      ? '<img src="' + esc(e.cover) + '" alt="' + esc(e.title) + ' 封面" loading="lazy" />'
      : '<span class="thumb-fallback">' + icon('film') + '</span>';
    var credits = e.imported ? '' : creditsHtml(e.credit);
    var pkg = e.imported ? null : pkgOf(key);
    var locked = !!pkg && !pkgReady(pkg);
    var cls = 'mv-card' + (solo ? ' solo' : '') + (e.imported ? ' imp' : '') + (locked ? ' locked' : '');
    return '<div class="' + cls + '" role="link" tabindex="0" data-play="' + esc(key) + '" aria-label="' + (locked ? '下载并播放 ' : '播放 ') + esc(e.title) + '">' +
      '<div class="thumb">' + thumb +
        '<span class="num">' + String(idx + 1).padStart(2, '0') + '</span>' +
        '<span class="dur">' + esc(e.dur) + '</span>' +
        (locked
          ? '<span class="dl-flag">' + icon('imp') + '需下载 · ' + fmtSize(PKGS[pkg].bytes) + '</span>'
          : '<span class="play">' + icon('play') + '</span>') +
      '</div>' +
      '<div class="mv-body">' +
        '<h3>' + esc(e.title) + (e.sub ? '<em>' + esc(e.sub) + '</em>' : '') + '</h3>' +
        '<p class="en">' + esc(e.en) + '</p>' +
        '<p class="desc">' + esc(e.desc) + '</p>' +
        '<div class="tags">' + (e.tags || []).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>' +
        '<div class="mv-foot">' + (credits || '<span></span>') +
          (e.imported ? '<span class="row-actions"><button class="mini" type="button" data-act="remove-item" data-key="' + esc(key) + '">移出合集</button></span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function extraRowHtml(x) {
    return '<a class="row" href="' + esc(x.href) + '" ' + (x.external ? 'data-external rel="noopener"' : '') + (x.pcOnly ? ' data-pc-only' : '') + '>' +
      '<span class="row-ico">' + icon(x.icon || 'ext') + '</span>' +
      '<span class="row-main"><b>' + esc(x.title) + '</b><small>' + esc(x.sub) + '</small></span>' +
      '<span class="row-tag muted">' + esc(x.tag || '打开') + '</span><span class="go" style="font-family:var(--mono);color:var(--faint)">→</span>' +
    '</a>';
  }

  function renderCollection(id) {
    var col = findCol(id);
    if (!col) { location.hash = '#/'; toast('合集不存在'); return; }
    currentColId = id;
    var items = validItems(col);
    $('homeView').hidden = true;
    $('colView').hidden = false;
    document.title = col.title + ' · MV渲染器';

    var actions = '<button class="btn small primary" type="button" data-act="import-here">' + icon('imp') + '导入 MV 到本合集</button>' +
      '<button class="btn small" type="button" data-act="add-existing">＋ 添加已有作品</button><span class="spacer"></span>';
    if (!col.builtin) {
      actions += '<button class="btn small" type="button" data-act="rename-col">' + icon('edit') + '重命名</button>' +
        '<button class="btn small" type="button" data-act="delete-col">' + icon('trash') + '删除合集</button>';
    }

    var grid = items.length
      ? '<div class="mv-grid">' + items.map(function (k, i) { return mvCardHtml(k, i, items.length === 1); }).join('') + '</div>'
      : '<div class="empty" style="margin-top:22px"><b>这个合集还是空的</b>导入一支 MV，或从已有作品里挑几支放进来。</div>';
    var pkgId = PKGS[id] ? id : null;
    var pkgBar = '';
    if (pkgId) {
      var P = PKGS[pkgId];
      var done = pkgReady(pkgId);
      pkgBar = '<div class="pkg-bar' + (done ? ' done' : '') + '">' +
        '<span class="pkg-ico">' + icon(done ? 'check' : 'imp') + '</span>' +
        '<span class="pkg-copy"><b>' + (done ? '合集包已下载' : '这一辑是可选扩展') + '</b>' +
          '<small>' + (done ? '可离线播放 · ' + fmtSize(P.bytes) : '默认只内置 P(doom)。下载 ' + fmtSize(P.bytes) + ' 后，这一辑的 ' + items.length + ' 支 MV 都能本地播放。') + '</small></span>' +
        (done
          ? '<span class="pkg-act"><button class="btn small" type="button" data-act="del-pkg" data-pkg="' + pkgId + '">' + icon('trash') + '删除下载</button></span>'
          : '<span class="pkg-act"><button class="btn small primary" type="button" data-act="dl-pkg" data-pkg="' + pkgId + '">' + icon('imp') + '下载合集包</button></span>') +
        '</div>';
    }

    var extras = (col.extras && col.extras.length)
      ? '<div class="extra">' + col.extras.map(extraRowHtml).join('') + '</div>' : '';

    $('colView').innerHTML =
      '<section class="col-hero">' +
        '<a class="crumb" href="#/">' + icon('back') + '全部合集</a>' +
        '<div class="col-hero-main">' +
          '<span class="col-hero-icon">' + icon(col.icon || 'folder') + '</span>' +
          '<div class="col-hero-copy">' +
            '<p class="eyebrow"><span class="bar"></span><span>Collection / ' + (col.builtin ? '内置' : '我的') + '</span></p>' +
            '<h1>' + esc(col.title) + '</h1>' +
            '<p class="sub">' + esc(col.desc || '我的合集') + '</p>' +
            '<div class="col-hero-meta"><span class="row-tag">' + items.length + ' 部作品</span>' +
              (col.who ? '<span class="row-tag muted">' + esc(col.who) + '</span>' : '') +
              '<span class="row-tag muted">播放完自动回到这里</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="col-actions">' + actions + '</div>' +
      '</section>' +
      pkgBar + grid + extras +
      (col.note ? '<p class="note">' + col.note + '</p>' : '');

    stripPcOnly();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------------- 路由 ---------------- */
  function route() {
    var m = /^#\/c\/(.+)$/.exec(location.hash || '');
    if (m) {
      renderCollection(decodeURIComponent(m[1]));
    } else {
      renderHome();
    }
  }
  window.addEventListener('hashchange', route);

  /* ---------------- 播放 ---------------- */
  function play(key) {
    var e = entryByKey(key);
    if (!e) { toast('找不到这支 MV'); return; }
    var pkg = e.imported ? null : pkgOf(key);
    if (pkg && !pkgReady(pkg)) { downloadModal(pkg); return; }
    var back = location.href;
    var title = currentColId ? (findCol(currentColId) || {}).title : '合集';
    try {
      sessionStorage.setItem('mv-return', back);
      sessionStorage.setItem('mv-return-title', title || '合集');
    } catch (err) {}
    if (e.imported) {
      location.href = '/play.html?src=' + encodeURIComponent(e.href) + '&title=' + encodeURIComponent(e.title) + '&back=' + encodeURIComponent(back);
    } else if (pkg) {
      location.href = '/custom/' + pkg + '/' + MV_PATH[key];
    } else {
      location.href = e.href;
    }
  }

  /* ---------------- 下载（Cloudflare R2） ---------------- */
  var dlPoll = null, dlPkg = null;
  function downloadModal(p) {
    var P = PKGS[p];
    if (!P) return;
    dlPkg = p;
    openModal(
      '<h3>下载「' + esc(P.title) + '」</h3>' +
      '<p class="hint">默认只内置 P(doom)。这一包 ' + fmtSize(P.bytes) + '，从 Cloudflare R2 直接下载，装好后离线播放，不用再等。</p>' +
      '<div class="dl-box"><div class="dl-line"><span id="dlPct">准备中…</span><span id="dlSize" class="mono">' + fmtSize(P.bytes) + '</span></div>' +
      '<div class="dl-track"><i id="dlBar" style="width:0%"></i></div>' +
      '<p class="dl-note" id="dlNote">下载完成后会自动解压到本机，只影响这一个合集包。</p></div>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button>' +
      '<button class="btn primary" type="button" data-act="dl-start" data-pkg="' + p + '">开始下载</button></div>'
    );
    var b = document.querySelector('[data-act="dl-start"]');
    if (b) b.focus();
  }
  function startDownload(p) {
    var P = PKGS[p];
    if (!P) return;
    var q = '/__dl?pkg=' + encodeURIComponent(p) + '&u=' + encodeURIComponent(P.url) + '&sha=' + P.sha256 + '&size=' + P.bytes;
    fetch(q, { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function (j) { if (!j || !j.ok) throw new Error((j && j.error) || '无法开始下载'); pollDownload(p); })
      .catch(function (e) { setDl('下载服务不可用：' + e.message, 0); });
  }
  function pollDownload(p) {
    clearInterval(dlPoll);
    dlPoll = setInterval(function () {
      fetch('/__dl/status?id=' + encodeURIComponent(p), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          var pct = j.total ? Math.min(99, Math.round(j.got / j.total * 100)) : 0;
          if (j.state === 'downloading') setDl('正在下载 ' + fmtSize(j.got) + ' / ' + fmtSize(j.total), pct);
          else if (j.state === 'unzipping') setDl('正在解压…', 99);
          else if (j.state === 'done') {
            clearInterval(dlPoll); setDl('下载完成，正在打开…', 100);
            INSTALLED[p] = true;
            setTimeout(function () {
              closeModal();
              toast('「' + PKGS[p].title + '」已下载');
              if (currentColId) renderCollection(currentColId); else renderHome();
              var first = MV_PATH[Object.keys(MV_PATH).filter(function (k) { return PKG_OF[k] === p; })[0]];
              var key = Object.keys(PKG_OF).filter(function (k) { return PKG_OF[k] === p; })[0];
              if (key) play(key);
            }, 600);
          } else if (j.state === 'error') { clearInterval(dlPoll); setDl('下载失败：' + (j.error || '未知错误') + '（可重试）', 0); }
          else if (j.state === 'canceled') { clearInterval(dlPoll); setDl('已取消', 0); }
          else setDl('等待开始…', 0);
        })
        .catch(function () {});
    }, 700);
  }
  function setDl(text, pct) {
    var t = $('dlPct'), b = $('dlBar'), n = $('dlNote');
    if (t) t.textContent = text;
    if (b) b.style.width = pct + '%';
    if (n && pct >= 99) n.textContent = '正在写入本机，请保持页面在前台。';
  }
  function deletePkg(p) {
    var P = PKGS[p];
    openModal(
      '<h3>删除「' + esc(P.title) + '」的下载？</h3><p class="hint">会从本机删掉这一个合集包（' + fmtSize(P.bytes) + '），以后还能重新下载。</p>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button>' +
      '<button class="btn primary" type="button" data-act="del-pkg-confirm" data-pkg="' + p + '">删除下载</button></div>'
    );
  }

  /* ---------------- 弹层 ---------------- */
  var modalEsc = null;
  function closeModal() {
    $('modalRoot').innerHTML = '';
    if (modalEsc) { document.removeEventListener('keydown', modalEsc); modalEsc = null; }
  }
  function openModal(inner, onMount) {
    closeModal();
    var root = $('modalRoot');
    root.innerHTML = '<div class="modal-back" data-modal-back><div class="modal" role="dialog" aria-modal="true">' + inner + '</div></div>';
    var back = root.querySelector('[data-modal-back]');
    back.addEventListener('click', function (e) { if (e.target === back) closeModal(); });
    modalEsc = function (e) { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', modalEsc);
    if (onMount) onMount(root.querySelector('.modal'));
    var first = root.querySelector('input,textarea,button');
    if (first) setTimeout(function () { try { first.focus(); } catch (e) {} }, 30);
    return root.querySelector('.modal');
  }

  function newCollectionModal() {
    openModal(
      '<h3>新建合集</h3><p class="hint">给合集起个名字，比如「深夜循环」「四部曲番外」。建好后就能把 MV 收进去。</p>' +
      '<div class="field"><label for="colName">合集名称</label><input id="colName" maxlength="24" placeholder="例如：深夜循环" autocomplete="off"></div>' +
      '<div class="field"><label for="colDesc">一句话说明（可选）</label><input id="colDesc" maxlength="60" placeholder="例如：适合关灯看的几支" autocomplete="off"></div>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button><button class="btn primary" type="button" data-act="create-col">创建合集</button></div>',
      function (m) {
        var input = m.querySelector('#colName');
        input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); createCollectionFromModal(); } });
      }
    );
  }
  function createCollectionFromModal() {
    var name = ($('colName') && $('colName').value || '').trim();
    var desc = ($('colDesc') && $('colDesc').value || '').trim();
    if (!name) { toast('先给合集起个名字'); return; }
    var col = {
      id: uid(), title: name, en: 'MY COLLECTION', icon: 'folder', builtin: false,
      desc: desc || '我的合集', who: '我的合集', items: [], note: ''
    };
    state.collections.push(col);
    saveState();
    closeModal();
    toast('合集已创建');
    location.hash = '#/c/' + encodeURIComponent(col.id);
    renderStats();
  }

  function renameCollectionModal(id) {
    var col = findCol(id);
    if (!col || col.builtin) return;
    openModal(
      '<h3>重命名合集</h3><p class="hint">只改名字和说明，里面的 MV 不会动。</p>' +
      '<div class="field"><label for="colName">合集名称</label><input id="colName" maxlength="24" value="' + esc(col.title) + '"></div>' +
      '<div class="field"><label for="colDesc">一句话说明（可选）</label><input id="colDesc" maxlength="60" value="' + esc(col.desc === '我的合集' ? '' : col.desc) + '"></div>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button><button class="btn primary" type="button" data-act="rename-col-save">保存</button></div>'
    );
  }
  function saveRename(id) {
    var col = findCol(id);
    if (!col) return;
    var name = ($('colName') && $('colName').value || '').trim();
    var desc = ($('colDesc') && $('colDesc').value || '').trim();
    if (!name) { toast('名字不能为空'); return; }
    col.title = name;
    col.desc = desc || '我的合集';
    saveState(); closeModal(); toast('已保存');
    renderCollection(id);
  }

  function confirmDeleteCollection(id) {
    var col = findCol(id);
    if (!col || col.builtin) return;
    openModal(
      '<h3>删除「' + esc(col.title) + '」？</h3><p class="hint">只删除合集本身，里面的 MV 文件会保留；导入的 MV 会回到「导入的 MV」里。</p>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button><button class="btn primary" type="button" data-act="delete-col-confirm" data-id="' + esc(id) + '">删除合集</button></div>'
    );
  }

  function moveImportModal(id) {
    var im = importById(id);
    if (!im) return;
    var rows = collections().map(function (c) {
      return '<button class="pick" type="button" data-act="move-import-to" data-id="' + esc(id) + '" data-col="' + esc(c.id) + '" aria-checked="false">' +
        '<span class="pick-ico">' + icon(c.icon || 'folder') + '</span>' +
        '<span class="pick-txt"><b>' + esc(c.title) + '</b><small>' + c.items.length + ' 部 · ' + (c.builtin ? '内置合集' : '我的合集') + '</small></span>' +
        '<span class="tick"></span></button>';
    }).join('');
    openModal(
      '<h3>把「' + esc(im.name) + '」放进哪个合集？</h3><p class="hint">一个导入的 MV 同时只归一个合集；之后还能再改。</p>' +
      '<div class="pick-list">' + rows +
      '<button class="pick" type="button" data-act="move-import-to" data-id="' + esc(id) + '" data-col="" aria-checked="false">' +
        '<span class="pick-ico">' + icon('film') + '</span><span class="pick-txt"><b>不归入合集</b><small>留在家里的「导入的 MV」</small></span><span class="tick"></span></button>' +
      '</div>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button><button class="btn" type="button" data-act="new-col">新建合集…</button></div>'
    );
  }

  function addExistingModal(id) {
    var col = findCol(id);
    if (!col) return;
    var candidates = CATALOG_ORDER.filter(function (k) { return col.items.indexOf(k) < 0; });
    var imps = IMPORTS.filter(function (im) { return col.items.indexOf('imp:' + im.id) < 0; });
    var rows = candidates.map(function (k) {
      var e = CATALOG[k];
      return '<button class="pick" type="button" data-pick-key="' + esc(k) + '" aria-checked="false">' +
        '<span class="pick-ico">' + icon(k === 'world' ? 'ai' : k === 'deepseek' ? 'heart' : k === 'execute' ? 'code' : 'atom') + '</span>' +
        '<span class="pick-txt"><b>' + esc(e.title) + '</b><small>' + esc(e.sub + ' · ' + e.dur) + '</small></span><span class="tick"></span></button>';
    }).join('');
    var irows = imps.map(function (im) {
      return '<button class="pick" type="button" data-pick-key="imp:' + esc(im.id) + '" aria-checked="false">' +
        '<span class="pick-ico">' + icon('film') + '</span><span class="pick-txt"><b>' + esc(im.name) + '</b><small>自定义导入</small></span><span class="tick"></span></button>';
    }).join('');
    openModal(
      '<h3>往「' + esc(col.title) + '」里添加</h3><p class="hint">可以选内置作品，也可以把导入的 MV 收进来。选中的会追加到合集末尾。</p>' +
      '<div class="pick-list" id="pickList">' + (rows + irows || '<div class="empty">没有可添加的作品了</div>') + '</div>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button><button class="btn primary" type="button" data-act="add-existing-save" data-id="' + esc(id) + '">添加所选</button></div>'
    );
  }

  /* ---------------- 导入 ---------------- */
  function importHere(id) {
    if (!hasApp) { toast('浏览器模式不支持导入，请在 APP 里使用'); return; }
    pendingImportTarget = id || null;
    toast('选择 zip…');
    try { XmApp.pickZip(); } catch (e) { toast('打不开文件选择器'); }
  }
  function importHome() {
    if (!hasApp) { toast('浏览器模式不支持导入，请在 APP 里使用'); return; }
    pendingImportTarget = null;
    toast('选择 zip…');
    try { XmApp.pickZip(); } catch (e) { toast('打不开文件选择器'); }
  }

  window.__onImport = function (res) {
    var s = String(res || '');
    if (s === 'ok:audio') { toast('音频已替换'); return; }
    if (s.indexOf('ok:') === 0) {
      var id = s.slice(3);
      if (pendingImportTarget) {
        var col = findCol(pendingImportTarget);
        if (col && col.items.indexOf('imp:' + id) < 0) {
          col.items.push('imp:' + id);
          saveState();
        }
        pendingImportTarget = null;
      }
      toast('MV 导入成功');
      refreshImports(true).then(function () { route(); });
      return;
    }
    if (s === 'cancel') { pendingImportTarget = null; return; }
    toast('操作失败：' + s);
    pendingImportTarget = null;
  };

  function removeItemFromCollection(key) {
    var col = findCol(currentColId);
    if (!col) return;
    var i = col.items.indexOf(key);
    if (i >= 0) col.items.splice(i, 1);
    saveState();
    toast('已移出合集');
    renderCollection(col.id);
    renderStats();
  }

  function deleteImport(id, name) {
    openModal(
      '<h3>删除「' + esc(name || id) + '」？</h3><p class="hint">会从本机删除这份导入的 MV 文件，无法恢复。</p>' +
      '<div class="modal-actions"><button class="btn" type="button" data-act="close-modal">取消</button>' +
      '<button class="btn primary" type="button" data-act="del-import-confirm" data-id="' + esc(id) + '">删除文件</button></div>'
    );
  }
  function doDeleteImport(id) {
    fetch('/__delete?id=' + encodeURIComponent(id), { method: 'POST' })
      .then(function () {
        collections().forEach(function (c) {
          var k = 'imp:' + id;
          var i = c.items.indexOf(k);
          if (i >= 0) c.items.splice(i, 1);
        });
        saveState();
        closeModal();
        toast('已删除');
        return refreshImports(true);
      })
      .then(function () { route(); renderStats(); })
      .catch(function () { toast('删除失败'); });
  }

  /* ---------------- 导入列表 ---------------- */
  var lastSig = '';
  function fetchImports() {
    return fetch('/__imports', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('http ' + r.status); return r.json(); })
      .then(function (data) {
        setLive(true);
        var list = Array.isArray(data) ? data.map(function (x) {
          return typeof x === 'string' ? { id: x, name: x } : x || {};
        }).filter(function (x) { return x && x.id; }) : [];
        IMPORTS = list;
        return list;
      })
      .catch(function () { setLive(false); return IMPORTS; });
  }
  function refreshImports(force) {
    return fetchImports().then(function (list) {
      var sig = JSON.stringify(list.map(function (x) { return [x.id, x.name]; }));
      if (force || sig !== lastSig) {
        lastSig = sig;
        if (currentColId) renderCollection(currentColId); else { renderImports(); renderCollections(); renderStats(); }
      }
      return list;
    });
  }

  function setLive(ok) {
    var el = $('live');
    el.classList.toggle('on', ok);
    el.classList.toggle('off', !ok);
    $('liveText').textContent = ok ? '本地服务' : '未连接';
  }

  /* ---------------- 事件代理 ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;

    var cred = t.closest('button.cred[data-cred], button.btn[data-cred]');
    if (cred) { e.preventDefault(); e.stopPropagation(); openExternal(cred.getAttribute('data-cred')); return; }

    var ext = t.closest('a[data-external]');
    if (ext) { e.preventDefault(); openExternal(ext.href); return; }

    var act = t.closest('[data-act]');
    if (act) {
      e.preventDefault(); e.stopPropagation();
      handleAction(act);
      return;
    }

    var play = t.closest('[data-play]');
    if (play) { e.preventDefault(); play_(play.getAttribute('data-play')); return; }

    var col = t.closest('[data-col]');
    if (col) { location.hash = '#/c/' + encodeURIComponent(col.getAttribute('data-col')); return; }

    var pick = t.closest('[data-pick-key]');
    if (pick) {
      e.preventDefault();
      var on = pick.getAttribute('aria-checked') === 'true';
      pick.setAttribute('aria-checked', on ? 'false' : 'true');
      return;
    }

    var back = t.closest('[data-modal-back]');
    if (back) { if (e.target === back) closeModal(); }
  });
  function play_(k) { play(k); }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var el = e.target && e.target.closest && e.target.closest('[data-play],[data-col]');
    if (!el || el.getAttribute('data-act')) return;
    e.preventDefault();
    if (el.hasAttribute('data-play')) play(el.getAttribute('data-play'));
    else location.hash = '#/c/' + encodeURIComponent(el.getAttribute('data-col'));
  });

  function handleAction(act) {
    var a = act.getAttribute('data-act');
    var id = act.getAttribute('data-id') || '';
    if (a === 'close-modal') { closeModal(); return; }
    if (a === 'new-col') { closeModal(); newCollectionModal(); return; }
    if (a === 'create-col') { createCollectionFromModal(); return; }
    if (a === 'rename-col') { renameCollectionModal(currentColId); return; }
    if (a === 'rename-col-save') { saveRename(currentColId); return; }
    if (a === 'delete-col') { confirmDeleteCollection(currentColId); return; }
    if (a === 'delete-col-confirm') {
      var col = findCol(id);
      if (col) {
        state.collections = state.collections.filter(function (c) { return c.id !== id; });
        saveState(); closeModal(); toast('合集已删除');
        location.hash = '#/';
      }
      return;
    }
    if (a === 'import-here') { importHere(currentColId); return; }
    if (a === 'add-existing') { addExistingModal(currentColId); return; }
    if (a === 'add-existing-save') {
      var target = findCol(id);
      if (target) {
        var picks = document.querySelectorAll('[data-pick-key][aria-checked="true"]');
        for (var i = 0; i < picks.length; i++) {
          var k = picks[i].getAttribute('data-pick-key');
          if (target.items.indexOf(k) < 0) target.items.push(k);
        }
        saveState();
      }
      closeModal(); toast('已加入合集');
      if (currentColId) renderCollection(currentColId);
      renderStats();
      return;
    }
    if (a === 'remove-item') { removeItemFromCollection(act.getAttribute('data-key')); return; }
    if (a === 'move-import') { moveImportModal(id); return; }
    if (a === 'move-import-to') {
      var colId = act.getAttribute('data-col');
      collections().forEach(function (c) {
        var k = 'imp:' + id; var idx = c.items.indexOf(k);
        if (idx >= 0) c.items.splice(idx, 1);
      });
      if (colId) {
        var targetCol = findCol(colId);
        if (targetCol && targetCol.items.indexOf('imp:' + id) < 0) targetCol.items.push('imp:' + id);
      }
      saveState(); closeModal(); toast(colId ? '已归入合集' : '已留在导入区');
      if (currentColId) renderCollection(currentColId); else { renderImports(); renderCollections(); }
      return;
    }
    if (a === 'del-import') {
      var im = importById(id);
      deleteImport(id, im ? im.name : id);
      return;
    }
    if (a === 'del-import-confirm') { doDeleteImport(id); return; }
    if (a === 'dl-pkg') { downloadModal(act.getAttribute('data-pkg')); return; }
    if (a === 'dl-start') { startDownload(act.getAttribute('data-pkg')); return; }
    if (a === 'del-pkg') { deletePkg(act.getAttribute('data-pkg')); return; }
    if (a === 'del-pkg-confirm') {
      var dp = act.getAttribute('data-pkg');
      fetch('/__delete?id=' + encodeURIComponent(dp), { method: 'POST' })
        .then(function () { INSTALLED[dp] = false; closeModal(); toast('已删除下载'); if (currentColId) renderCollection(currentColId); })
        .catch(function () { toast('删除失败'); });
      return;
    }
  }

  /* ---------------- 主题 / 动态分辨率 ---------------- */
  (function () {
    var root = document.documentElement, btn = $('theme');
    if (!btn) return;
    function mode() { return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; }
    function paint(m) {
      root.setAttribute('data-theme', m);
      btn.textContent = m === 'light' ? '☾' : '☀';
      btn.setAttribute('aria-label', m === 'light' ? '切换到深色' : '切换到浅色');
    }
    paint(mode());
    btn.addEventListener('click', function () {
      var next = mode() === 'light' ? 'dark' : 'light';
      try { localStorage.setItem('mv-theme', next); } catch (e) {}
      paint(next);
    });
  })();

  function dynOn() {
    try { var v = localStorage.getItem(DYN_KEY); return v === null ? true : v === '1'; } catch (e) { return true; }
  }
  function paintDyn(on) {
    var b = $('dynres'); if (!b) return;
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    b.title = on ? '自适应分辨率：开（跑不满自动降档）' : '自适应分辨率：关（严格按所选分辨率）';
    var t = b.querySelector('span');
    if (t) t.textContent = '自适应分辨率 · ' + (on ? '开' : '关');
  }
  paintDyn(dynOn());
  if ($('dynres')) $('dynres').addEventListener('click', function () {
    var on = !dynOn();
    try { localStorage.setItem(DYN_KEY, on ? '1' : '0'); } catch (e) {}
    paintDyn(on);
    toast(on ? '动态分辨率：开' : '动态分辨率：关 · 严格按所选分辨率');
  });

  /* ---------------- PC 独占 / 导入按钮 ---------------- */
  function stripPcOnly() {
    if (isElectron) return;
    document.querySelectorAll('[data-pc-only]').forEach(function (el) { el.remove(); });
  }
  stripPcOnly();

  if (!hasApp) {
    ['btnImportHome', 'btnImportHome2'].forEach(function (id) {
      var b = $(id); if (b) { b.disabled = true; b.title = '浏览器模式不支持导入，请在 APP 里使用'; }
    });
  }
  if ($('btnImportHome')) $('btnImportHome').addEventListener('click', importHome);
  if ($('btnImportHome2')) $('btnImportHome2').addEventListener('click', importHome);
  if ($('btnNewCol')) $('btnNewCol').addEventListener('click', newCollectionModal);

  /* ---------------- 自动刷新 ---------------- */
  if (isElectron && window.EventSource) {
    try {
      var es = new EventSource('/__events');
      es.addEventListener('message', function () { refreshImports(true); });
      es.addEventListener('error', function () {});
    } catch (e) {}
  }
  setInterval(function () { if (!document.hidden) refreshImports(false); }, 2500);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) refreshImports(true); });

  /* ---------------- 启动 ---------------- */
  loadState();
  checkInstalls().then(function () { route(); refreshImports(true); });
})();
