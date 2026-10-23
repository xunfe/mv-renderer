/* 《航天简史》—— 全部画面由代码逐帧绘制（Canvas2D），无任何图片素材。
   时间轴以歌曲时间为准，拖动进度条任意跳转。 */
(() => {
  const cv = document.getElementById('c');
  const ctx = cv.getContext('2d', { alpha: false });
  const W = cv.width, H = cv.height;
  const scrub = document.getElementById('scrub');
  const info = document.getElementById('info');

  const OR = '#ff6a2b', WH = '#f2f4f8', DIM = '#6b7385', GRID = 'rgba(120,140,180,.10)';
  const MONO = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
  const CJK = '"Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif';

  const DUR = 251;

  // ---------------- 章节 ----------------
  const CH = [
    { t0: 0,   t1: 14,  year: '1944', zh: 'V-2',            en: 'A ROCKET TOUCHED THE SKY',
      lines: ['一枚火箭碰到了天', '那是一件武器'] },
    { t0: 14,  t1: 34,  year: '1957', zh: '斯普特尼克一号',  en: 'SPUTNIK 1 · BEEP BEEP',
      lines: ['一个闪亮的小球', '「哔、哔、哔」，全世界都听见了'] },
    { t0: 34,  t1: 50,  year: '1957', zh: '莱卡',            en: 'LAIKA, 1957',
      lines: ['一只叫莱卡的小狗上去了', '再也没有回家'] },
    { t0: 50,  t1: 70,  year: '1961', zh: '加加林',          en: 'GAGARIN · 108 MINUTES',
      lines: ['「出发吧」', '一百零八分钟，绕了地球一圈'] },
    { t0: 70,  t1: 88,  year: '1968', zh: '地球升起',        en: 'EARTHRISE',
      lines: ['地球从月亮那边升起来'] },
    { t0: 88,  t1: 104, year: '1969', zh: '阿波罗十一号',    en: 'ONE SMALL STEP',
      lines: ['尘土里留下一个脚印'] },
    { t0: 104, t1: 122, year: '1970', zh: '东方红一号',      en: 'DONGFANGHONG-1',
      lines: ['从太空播《东方红》'] },
    { t0: 122, t1: 146, year: '1977', zh: '旅行者',          en: 'THE GOLDEN RECORD',
      lines: ['两艘旅行者带着一张金唱片出发', '里面有孩子的问候，也有古琴曲《流水》'] },
    { t0: 146, t1: 162, year: '1990', zh: '暗淡蓝点',        en: 'PALE BLUE DOT',
      lines: ['旅行者一号回头，拍下一个小点', '那是我们，那是家'] },
    { t0: 162, t1: 178, year: '2003', zh: '神舟五号',        en: 'SHENZHOU-5 · 14 ORBITS',
      lines: ['杨利伟二十一小时绕地球十四圈'] },
    { t0: 178, t1: 196, year: '2019', zh: '嫦娥四号',        en: 'FAR SIDE OF THE MOON',
      lines: ['鹊桥架在月亮背后', '落在从地球永远看不见的那一面'] },
    { t0: 196, t1: 212, year: '2024', zh: '嫦娥六号',        en: 'SAMPLE RETURN',
      lines: ['把月背的土带回了家'] },
    { t0: 212, t1: 230, year: '2015—2025', zh: '回收',       en: 'WHAT GOES UP MUST COME DOWN',
      lines: ['钢铁的手臂在半空接住它', '另一枚翻个身落进海里', '上去的会下来，我们就这样学会'] },
    { t0: 230, t1: 251, year: '2026', zh: '阿尔忒弥斯二号',  en: 'A SHORT HISTORY OF SPACEFLIGHT',
      lines: ['四个人绕过月亮，比以前任何人都远', '同一枚火箭，我们选了一张金唱片'] },
  ];

  // ---------------- 工具 ----------------
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const smooth = (t) => t * t * (3 - 2 * t);
  const rnd = (() => { let s = 20261017; return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff; })();

  function chapterAt(t) {
    for (const c of CH) if (t >= c.t0 && t < c.t1) return c;
    return CH[CH.length - 1];
  }
  function localT(c, t) { return clamp((t - c.t0) / (c.t1 - c.t0)); }

  // 拍点（各段 BPM 不同，用于脉冲）
  function beatPulse(t) {
    const bpm = t < 14 ? 0 : t < 34 ? 96 : t < 146 ? 100 : t < 162 ? 60 : t < 212 ? 104 : t < 230 ? 96 : 90;
    if (!bpm) return 0;
    const b = 60 / bpm;
    const ph = (t % b) / b;
    return Math.exp(-ph * 7);
  }

  // ---------------- 星空 ----------------
  const STARS = Array.from({ length: 420 }, () => ({
    x: rnd() * W, y: rnd() * H, z: .25 + rnd() * .95, p: rnd() * 6.283, tw: .4 + rnd() * 1.6,
  }));

  function drawStars(t, drift = 1, alpha = 1) {
    for (const s of STARS) {
      const x = (s.x - t * 6 * s.z * drift) % W;
      const xx = x < 0 ? x + W : x;
      const a = (.35 + .65 * (.5 + .5 * Math.sin(t * s.tw + s.p))) * alpha * (.35 + s.z * .65);
      ctx.fillStyle = `rgba(220,235,255,${a.toFixed(3)})`;
      const r = s.z * 1.5;
      ctx.fillRect(xx, s.y, r, r);
    }
  }

  // ---------------- 通用元素 ----------------
  function grid(t, step = 128, alpha = .5) {
    ctx.save();
    ctx.strokeStyle = GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = (t * 14) % step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = 0; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();
    ctx.restore();
  }

  function hud(t, c) {
    ctx.save();
    ctx.font = `500 22px ${MONO}`;
    ctx.fillStyle = DIM;
    ctx.textAlign = 'left';
    ctx.fillText('航天简史', 64, 72);
    ctx.font = `400 15px ${MONO}`;
    ctx.fillStyle = 'rgba(140,150,170,.6)';
    ctx.fillText('A SHORT HISTORY OF SPACEFLIGHT', 64, 96);

    // 右上：年份
    ctx.textAlign = 'right';
    ctx.font = `600 46px ${MONO}`;
    ctx.fillStyle = OR;
    ctx.fillText(c.year, W - 64, 82);

    // 章节序号
    const idx = CH.indexOf(c) + 1;
    ctx.font = `400 15px ${MONO}`;
    ctx.fillStyle = 'rgba(140,150,170,.65)';
    ctx.fillText(String(idx).padStart(2, '0') + ' / ' + String(CH.length).padStart(2, '0'), W - 64, 106);

    // 左下：章节标题
    const lt = localT(c, t);
    const a = clamp(lt * 8) * clamp((1 - lt) * 8 + 1);
    ctx.globalAlpha = clamp(a) * .95;
    ctx.textAlign = 'left';
    ctx.font = `600 34px ${CJK}`;
    ctx.fillStyle = WH;
    ctx.fillText(c.zh, 64, H - 128);
    ctx.font = `400 15px ${MONO}`;
    ctx.fillStyle = 'rgba(160,170,190,.8)';
    ctx.fillText(c.en, 64, H - 100);

    // 底部：台词
    ctx.font = `400 26px ${CJK}`;
    let y = H - 56;
    for (let i = c.lines.length - 1; i >= 0; i--) {
      ctx.fillStyle = i === c.lines.length - 1 ? 'rgba(242,244,248,.92)' : 'rgba(150,158,175,.65)';
      ctx.font = `400 ${i === c.lines.length - 1 ? 26 : 20}px ${CJK}`;
      ctx.fillText(c.lines[i], 64, y);
      y -= 34;
    }

    // 角标
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(255,106,43,.55)';
    ctx.lineWidth = 2;
    const m = 28, L = 22;
    ctx.beginPath();
    ctx.moveTo(m, m + L); ctx.lineTo(m, m); ctx.lineTo(m + L, m);
    ctx.moveTo(W - m - L, m); ctx.lineTo(W - m, m); ctx.lineTo(W - m, m + L);
    ctx.moveTo(m, H - m - L); ctx.lineTo(m, H - m); ctx.lineTo(m + L, H - m);
    ctx.moveTo(W - m - L, H - m); ctx.lineTo(W - m, H - m); ctx.lineTo(W - m, H - m - L);
    ctx.stroke();
    ctx.restore();
  }

  function earth(cx, cy, r, phase = 0, opts = {}) {
    ctx.save();
    const g = ctx.createRadialGradient(cx - r * .35, cy - r * .35, r * .1, cx, cy, r);
    g.addColorStop(0, '#5fa8ff');
    g.addColorStop(.55, '#1f5fa8');
    g.addColorStop(1, '#0a1c33');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    // 经纬
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.2832); ctx.clip();
    ctx.strokeStyle = 'rgba(160,210,255,.16)'; ctx.lineWidth = 1.2;
    for (let i = -3; i <= 3; i++) {
      const y = cy + i * r / 3.4;
      ctx.beginPath(); ctx.ellipse(cx, y, r * Math.sqrt(Math.max(0, 1 - Math.pow((y - cy) / r, 2))), r * .12, 0, 0, 6.2832); ctx.stroke();
    }
    for (let i = 0; i < 6; i++) {
      const ph = phase * .3 + i * Math.PI / 6;
      ctx.beginPath(); ctx.ellipse(cx, cy, Math.abs(Math.cos(ph)) * r, r, 0, 0, 6.2832); ctx.stroke();
    }
    ctx.restore();
    // 大气
    const rim = ctx.createRadialGradient(cx, cy, r * .92, cx, cy, r * 1.18);
    rim.addColorStop(0, 'rgba(120,200,255,.35)'); rim.addColorStop(1, 'rgba(120,200,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r * 1.18, 0, 6.2832); ctx.fillStyle = rim; ctx.fill();
    ctx.restore();
  }

  function moonGround(t, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    const y0 = H * .74;
    const g = ctx.createLinearGradient(0, y0, 0, H);
    g.addColorStop(0, '#2a2c31'); g.addColorStop(1, '#0b0c0f');
    ctx.beginPath();
    ctx.moveTo(0, H); ctx.lineTo(0, y0 + 18);
    for (let x = 0; x <= W; x += 60) ctx.lineTo(x, y0 + Math.sin(x * .004 + 1.2) * 10 + Math.sin(x * .013) * 5);
    ctx.lineTo(W, H); ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    // 环形山
    for (let i = 0; i < 26; i++) {
      const x = ((i * 137) % W + t * 6) % W;
      const r = 14 + (i % 5) * 9;
      const yy = y0 + 40 + (i % 7) * 22;
      ctx.beginPath(); ctx.ellipse(x, yy, r, r * .45, 0, 0, 6.2832);
      ctx.fillStyle = 'rgba(255,255,255,.03)'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.05)'; ctx.lineWidth = 1; ctx.stroke();
    }
    ctx.restore();
  }

  function rocket(x, y, s, flame = 1, rot = 0) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
    // 箭体
    ctx.beginPath();
    ctx.moveTo(0, -70); ctx.lineTo(13, -26); ctx.lineTo(13, 42); ctx.lineTo(-13, 42); ctx.lineTo(-13, -26);
    ctx.closePath();
    ctx.fillStyle = '#dfe6f2'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    // 橙带
    ctx.fillStyle = OR; ctx.fillRect(-13, -6, 26, 8);
    // 尾翼
    ctx.beginPath();
    ctx.moveTo(-13, 18); ctx.lineTo(-30, 46); ctx.lineTo(-13, 42); ctx.closePath();
    ctx.moveTo(13, 18); ctx.lineTo(30, 46); ctx.lineTo(13, 42); ctx.closePath();
    ctx.fillStyle = '#9aa6b8'; ctx.fill();
    // 尾焰
    const fl = 60 + 40 * flame;
    const g = ctx.createLinearGradient(0, 42, 0, 42 + fl);
    g.addColorStop(0, 'rgba(255,214,150,.95)');
    g.addColorStop(.35, 'rgba(255,140,40,.75)');
    g.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.beginPath();
    ctx.moveTo(-9, 44); ctx.quadraticCurveTo(0, 44 + fl * (0.9 + 0.2 * Math.random()), 9, 44);
    ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    ctx.restore();
  }

  function orbitRing(cx, cy, r, a0, a1, color = 'rgba(255,106,43,.55)') {
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1);
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }

  function record(cx, cy, r, rot, glow = 1) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    const g = ctx.createRadialGradient(0, 0, r * .1, 0, 0, r);
    g.addColorStop(0, '#ffe9a8'); g.addColorStop(.45, '#d8a743'); g.addColorStop(1, '#5a3c12');
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,190,.35)'; ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) { ctx.beginPath(); ctx.arc(0, 0, r * i / 10, 0, 6.2832); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(0, 0, r * .18, 0, 6.2832); ctx.fillStyle = '#0b0b0d'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,240,190,.7)'; ctx.stroke();
    ctx.restore();
    if (glow > 0) {
      const gg = ctx.createRadialGradient(cx, cy, r * .8, cx, cy, r * 2.2);
      gg.addColorStop(0, `rgba(255,190,90,${.22 * glow})`); gg.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, 6.2832); ctx.fillStyle = gg; ctx.fill();
    }
  }

  function satellite(x, y, s, t, antennas = true) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.fillStyle = '#cfd8e6';
    ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.2832); ctx.fill();
    if (antennas) {
      ctx.strokeStyle = 'rgba(255,106,43,.9)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + i * Math.PI / 2;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a) * 46, Math.sin(a) * 46); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // 无线电波
  function waves(x, y, t, n = 4, color = 'rgba(255,106,43,.5)') {
    ctx.save();
    for (let i = 0; i < n; i++) {
      const ph = ((t * .6 + i / n) % 1);
      ctx.beginPath(); ctx.arc(x, y, 30 + ph * 220, 0, 6.2832);
      ctx.strokeStyle = color.replace(/[\d.]+\)$/, `${(1 - ph) * .55})`);
      ctx.lineWidth = 2; ctx.stroke();
    }
    ctx.restore();
  }

  function bigNum(n, x, y, size, color = 'rgba(255,106,43,.22)') {
    ctx.save();
    ctx.font = `700 ${size}px ${MONO}`;
    ctx.fillStyle = color; ctx.textAlign = 'center';
    ctx.fillText(n, x, y);
    ctx.restore();
  }

  // ---------------- 场景 ----------------
  const SCENES = {
    // 1944 V-2
    v2(t, lt, c) {
      drawStars(t, .5, .9);
      // 地平线与发射塔
      ctx.fillStyle = '#0a0c12'; ctx.fillRect(0, H * .78, W, H * .22);
      ctx.strokeStyle = 'rgba(150,170,200,.25)'; ctx.lineWidth = 2;
      for (let i = 0; i < 4; i++) {
        const x = 260 + i * 26;
        ctx.beginPath(); ctx.moveTo(x, H * .78); ctx.lineTo(x, H * .78 - 300 - i * 20); ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(230, H * .78 - 300); ctx.lineTo(380, H * .78 - 300); ctx.stroke();

      const p = clamp((lt - .08) / .62);
      const x = lerp(W * .30, W * .74, p);
      const y = lerp(H * .74, H * .18, ease(p));
      // 弹道
      ctx.save();
      ctx.setLineDash([6, 10]);
      ctx.strokeStyle = 'rgba(255,106,43,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * .30, H * .74); ctx.quadraticCurveTo(W * .5, H * .30, x, y); ctx.stroke();
      ctx.restore();
      if (p > 0 && p < 1) rocket(x, y, 1.5, 1.2, Math.PI * .22);
      if (p >= 1) {
        const e = clamp((lt - .72) / .2);
        ctx.beginPath(); ctx.arc(x, y, 20 + e * 240, 0, 6.2832);
        ctx.strokeStyle = `rgba(255,150,60,${(1 - e) * .8})`; ctx.lineWidth = 4; ctx.stroke();
      }
      grid(t, 140, .6);
    },

    // 1957 斯普特尼克
    sputnik(t, lt, c) {
      drawStars(t, .6, .9);
      earth(W * .5, H * 1.62, H * .95, t * .3);
      const a = -Math.PI * .78 + lt * Math.PI * 1.35;
      const rx = W * .5 + Math.cos(a) * W * .52, ry = H * .62 + Math.sin(a) * H * .30;
      orbitRing(W * .5, H * .62, W * .52, -Math.PI * .95, -Math.PI * .2, 'rgba(120,170,255,.18)');
      satellite(rx, ry, 1.15, t, true);
      waves(rx, ry, t, 5);
      // 哔 字
      const beep = Math.floor(t / .62);
      ctx.save();
      ctx.font = `600 30px ${CJK}`; ctx.fillStyle = OR; ctx.textAlign = 'center';
      for (let i = 0; i < 6; i++) {
        const k = beep - i;
        if (k < 0) continue;
        const age = (t - k * .62) / 1.6;
        if (age > 1) continue;
        ctx.globalAlpha = (1 - age) * .9;
        ctx.fillText('哔', rx - 120 - age * 60 - i * 26, ry - 60 - age * 40);
      }
      ctx.restore();
      grid(t, 160, .5);
    },

    // 1957 莱卡
    laika(t, lt) {
      drawStars(t, .5, .85);
      earth(W * .22, H * .95, H * .62, t * .25);
      const x = W * .52, y = H * .46;
      // 舱体
      ctx.save();
      ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x - 120, y - 70); ctx.quadraticCurveTo(x - 130, y + 90, x - 40, y + 110);
      ctx.lineTo(x + 90, y + 110); ctx.quadraticCurveTo(x + 120, y, x + 90, y - 70); ctx.closePath(); ctx.stroke();
      // 狗（极简剪影）
      ctx.fillStyle = '#cfd8e6';
      ctx.beginPath(); ctx.ellipse(x + 10, y + 58, 44, 26, 0, 0, 6.2832); ctx.fill();  // 身
      ctx.beginPath(); ctx.arc(x - 46, y + 36, 20, 0, 6.2832); ctx.fill();             // 头
      ctx.beginPath(); ctx.moveTo(x - 58, y + 20); ctx.lineTo(x - 50, y - 6); ctx.lineTo(x - 34, y + 16); ctx.closePath(); ctx.fill(); // 耳
      ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(x + 48, y + 46); ctx.quadraticCurveTo(x + 76, y + 20, x + 66, y - 6); ctx.stroke(); // 尾
      ctx.restore();
      // 信号
      waves(x, y - 120, t, 3, 'rgba(120,170,255,.4)');
      grid(t, 150, .5);
    },

    // 1961 加加林
    gagarin(t, lt) {
      drawStars(t, .4, .8);
      earth(W * .34, H * .52, H * .34, t * .35);
      // 轨道
      ctx.save();
      ctx.translate(W * .34, H * .52); ctx.rotate(-.35);
      ctx.beginPath(); ctx.ellipse(0, 0, H * .52, H * .30, 0, 0, 6.2832);
      ctx.strokeStyle = 'rgba(255,106,43,.35)'; ctx.lineWidth = 2; ctx.setLineDash([8, 12]); ctx.stroke();
      ctx.restore();
      const a = -2.2 + lt * Math.PI * 2 * 1.1;
      const cx = W * .34 + Math.cos(a) * H * .52 * Math.cos(.35) - Math.sin(a) * H * .30 * Math.sin(.35);
      const cy = H * .52 + Math.cos(a) * H * .52 * (-Math.sin(.35)) + Math.sin(a) * H * .30 * Math.cos(.35);
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, 6.2832); ctx.fillStyle = WH; ctx.fill();
      ctx.restore();
      // 108 分钟计数
      const mins = Math.min(108, Math.floor(lt * 108));
      bigNum(String(mins).padStart(3, '0') + "'", W * .80, H * .42, 150);
      ctx.save(); ctx.font = `400 18px ${MONO}`; ctx.fillStyle = DIM; ctx.textAlign = 'center';
      ctx.fillText('MINUTES IN ORBIT', W * .80, H * .42 + 40); ctx.restore();
      grid(t, 160, .5);
    },

    // 1968 地球升起
    earthrise(t, lt) {
      drawStars(t, .3, .75);
      moonGround(t, 1);
      const rise = ease(clamp(lt * 1.15));
      const ey = lerp(H * 1.02, H * .40, rise);
      earth(W * .68, ey, H * .17, t * .2);
      // 地平线亮边
      ctx.save();
      ctx.globalAlpha = rise;
      ctx.strokeStyle = 'rgba(255,230,190,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, H * .742);
      for (let x = 0; x <= W; x += 40) ctx.lineTo(x, H * .742 + Math.sin(x * .004 + 1.2) * 10);
      ctx.stroke();
      ctx.restore();
      grid(t, 170, .45);
    },

    // 1969 阿波罗
    apollo(t, lt) {
      drawStars(t, .25, .6);
      moonGround(t, 1);
      // 登月舱
      ctx.save();
      const x = W * .26, y = H * .58;
      ctx.strokeStyle = '#cfd8e6'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x - 60, y + 70); ctx.lineTo(x - 30, y - 40); ctx.lineTo(x + 30, y - 40);
      ctx.lineTo(x + 60, y + 70); ctx.closePath(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 30, y - 40); ctx.lineTo(x - 10, y - 80); ctx.lineTo(x + 10, y - 80);
      ctx.lineTo(x + 30, y - 40); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x - 80, y + 78); ctx.lineTo(x - 20, y + 70); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + 20, y + 70); ctx.lineTo(x + 80, y + 78); ctx.stroke();
      ctx.restore();
      // 脚印
      const n = Math.floor(clamp(lt / .75) * 7);
      ctx.save();
      for (let i = 0; i < n; i++) {
        const px = W * .50 + i * 120;
        const py = H * .86 + Math.sin(i * 1.7) * 16;
        ctx.save(); ctx.translate(px, py); ctx.rotate(-.15 + (i % 2) * .3);
        ctx.beginPath(); ctx.ellipse(0, 0, 16, 28, 0, 0, 6.2832);
        ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.restore();
      }
      ctx.restore();
      // 旗
      ctx.strokeStyle = 'rgba(200,210,225,.6)'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(W * .78, H * .80); ctx.lineTo(W * .78, H * .60); ctx.stroke();
      ctx.fillStyle = 'rgba(200,210,225,.12)';
      ctx.fillRect(W * .78, H * .60, 70, 42);
      grid(t, 160, .5);
    },

    // 1970 东方红一号
    dfh(t, lt) {
      drawStars(t, .7, .95);
      const x = W * .5, y = H * .44;
      satellite(x, y, 2.0, t, true);
      // 多面体
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = i * Math.PI / 3 + t * .2;
        const px = x + Math.cos(a) * 44, py = y + Math.sin(a) * 44;
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fillStyle = '#e2e8f4'; ctx.fill();
      ctx.restore();
      waves(x, y, t, 6, 'rgba(255,106,43,.55)');
      // 音符
      ctx.save();
      ctx.font = `500 34px ${MONO}`; ctx.fillStyle = OR;
      for (let i = 0; i < 5; i++) {
        const ph = (t * .35 + i * .21) % 1;
        ctx.globalAlpha = (1 - ph) * .75;
        ctx.fillText('♪', x + 60 + ph * 420, y - 40 - ph * 160 + Math.sin(ph * 9) * 20);
      }
      ctx.restore();
      grid(t, 150, .5);
    },

    // 1977 旅行者
    voyager(t, lt) {
      drawStars(t, .9, .95);
      // 太阳
      const sx = W * .12, sy = H * .52;
      const g = ctx.createRadialGradient(sx, sy, 4, sx, sy, 90);
      g.addColorStop(0, 'rgba(255,240,200,.95)'); g.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.beginPath(); ctx.arc(sx, sy, 90, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
      // 轨迹
      ctx.save();
      ctx.setLineDash([5, 9]);
      ctx.strokeStyle = 'rgba(160,190,230,.35)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy);
      ctx.bezierCurveTo(W * .35, H * .30, W * .55, H * .70, W * .92, H * .36);
      ctx.stroke(); ctx.restore();
      // 探测器
      const p = ease(clamp(lt));
      const px = sx + (W * .92 - sx) * p;
      const py = sy + (H * .36 - sy) * p * p - Math.sin(p * Math.PI) * 90;
      satellite(px, py, 1.4, t, false);
      ctx.save();
      ctx.strokeStyle = WH; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(px - 60, py); ctx.lineTo(px + 60, py); ctx.stroke();
      ctx.beginPath(); ctx.arc(px + 74, py, 22, 0, 6.2832); ctx.stroke();
      ctx.restore();
      // 金唱片
      record(W * .70, H * .68, 92, t * .5, 1);
      ctx.save(); ctx.font = `400 15px ${MONO}`; ctx.fillStyle = 'rgba(255,220,160,.85)'; ctx.textAlign = 'center';
      ctx.fillText('THE SOUNDS OF EARTH', W * .70, H * .68 + 132); ctx.restore();
      grid(t, 170, .45);
    },

    // 1990 暗淡蓝点
    dot(t, lt) {
      drawStars(t, .05, .5);
      const x = W * .52, y = H * .5;
      // 扫描光带
      ctx.save();
      const sweep = (lt * 1.4) % 1;
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'rgba(120,170,255,0)');
      g.addColorStop(clamp(sweep), 'rgba(140,190,255,.12)');
      g.addColorStop(clamp(sweep + .06), 'rgba(120,170,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // 光柱
      const beam = ctx.createLinearGradient(x, y - 240, x, y + 240);
      beam.addColorStop(0, 'rgba(180,210,255,0)');
      beam.addColorStop(.5, 'rgba(190,220,255,.10)');
      beam.addColorStop(1, 'rgba(180,210,255,0)');
      ctx.fillStyle = beam; ctx.fillRect(x - 90, y - 240, 180, 480);
      // 那个点
      const r = 3.2 + Math.sin(t * 2) * .8;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fillStyle = '#cfe4ff'; ctx.fill();
      ctx.beginPath(); ctx.arc(x, y, r * 6, 0, 6.2832);
      ctx.fillStyle = 'rgba(190,220,255,.10)'; ctx.fill();
      // 十字标
      ctx.strokeStyle = 'rgba(255,106,43,.5)'; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 60, y); ctx.lineTo(x - 16, y); ctx.moveTo(x + 16, y); ctx.lineTo(x + 60, y);
      ctx.moveTo(x, y - 60); ctx.lineTo(x, y - 16); ctx.moveTo(x, y + 16); ctx.lineTo(x, y + 60);
      ctx.stroke();
      grid(t, 190, .35);
    },

    // 2003 神舟五号
    shenzhou(t, lt) {
      drawStars(t, .5, .85);
      earth(W * .5, H * 1.5, H * .95, t * .3);
      const laps = Math.min(14, Math.floor(lt * 14) + 1);
      bigNum(String(laps).padStart(2, '0'), W * .78, H * .40, 170);
      ctx.save(); ctx.font = `400 18px ${MONO}`; ctx.fillStyle = DIM; ctx.textAlign = 'center';
      ctx.fillText('ORBITS', W * .78, H * .40 + 38); ctx.restore();
      // 轨道圈
      for (let i = 0; i < 3; i++) {
        const rr = H * (.45 + i * .17);
        ctx.beginPath(); ctx.arc(W * .5, H * 1.5, rr, -Math.PI * .82, -Math.PI * .18);
        ctx.strokeStyle = `rgba(255,106,43,${.30 - i * .07})`; ctx.lineWidth = 2; ctx.stroke();
      }
      const a = -Math.PI * .5 + lt * Math.PI * 1.3;
      const cx = W * .5 + Math.cos(a) * H * .78, cy = H * 1.5 + Math.sin(a) * H * .78;
      ctx.save(); ctx.translate(cx, cy);
      ctx.beginPath(); ctx.moveTo(0, -22); ctx.lineTo(14, 14); ctx.lineTo(-14, 14); ctx.closePath();
      ctx.fillStyle = WH; ctx.fill(); ctx.restore();
      grid(t, 160, .5);
    },

    // 2019 嫦娥四号
    change4(t, lt) {
      drawStars(t, .4, .8);
      // 月亮（占大半屏）
      const mx = W * .62, my = H * .58, mr = H * .62;
      const g = ctx.createRadialGradient(mx - mr * .3, my - mr * .3, mr * .1, mx, my, mr);
      g.addColorStop(0, '#3a3d44'); g.addColorStop(1, '#15171b');
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
      for (let i = 0; i < 40; i++) {
        const a = rnd() * 6.2832, rr = rnd() * mr * .92;
        const cx = mx + Math.cos(a) * rr, cy = my + Math.sin(a) * rr;
        const cr = 6 + rnd() * 22;
        ctx.beginPath(); ctx.arc(cx, cy, cr, 0, 6.2832);
        ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fill();
      }
      // 鹊桥：中继卫星 + 弧
      const qx = W * .18, qy = H * .22;
      ctx.beginPath(); ctx.moveTo(qx, qy); ctx.quadraticCurveTo(W * .42, H * .05, mx, my - mr * .55);
      ctx.strokeStyle = 'rgba(255,106,43,.45)'; ctx.lineWidth = 2; ctx.setLineDash([6, 10]); ctx.stroke();
      ctx.setLineDash([]);
      satellite(qx, qy, 1.1, t, true);
      waves(qx, qy, t, 3, 'rgba(255,106,43,.35)');
      // 着陆器
      const lx = mx + mr * .42, ly = my - mr * .30;
      ctx.save(); ctx.translate(lx, ly);
      ctx.fillStyle = '#dfe6f2';
      ctx.fillRect(-26, -18, 52, 34);
      ctx.strokeStyle = '#dfe6f2'; ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-22, 16); ctx.lineTo(-34, 40);
      ctx.moveTo(22, 16); ctx.lineTo(34, 40);
      ctx.stroke();
      ctx.fillStyle = OR; ctx.fillRect(-10, -8, 20, 6);
      ctx.restore();
      grid(t, 170, .45);
    },

    // 2024 嫦娥六号
    change6(t, lt) {
      SCENES.change4(t, lt);
      // 上升器 + 返回轨迹
      const p = clamp((lt - .35) / .55);
      const sx = W * .62 + H * .62 * .42, sy = H * .58 - H * .62 * .30;
      const ex = W * .08, ey = H * .12;
      const x = lerp(sx, ex, ease(p)), y = lerp(sy, ey, ease(p));
      ctx.save();
      ctx.setLineDash([5, 9]);
      ctx.strokeStyle = 'rgba(255,106,43,.55)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(W * .42, H * .02, x, y); ctx.stroke();
      ctx.restore();
      if (p > 0) {
        ctx.save(); ctx.translate(x, y);
        ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(8, 8); ctx.lineTo(-8, 8); ctx.closePath();
        ctx.fillStyle = OR; ctx.fill(); ctx.restore();
      }
    },

    // 2015—2025 回收
    recovery(t, lt) {
      drawStars(t, .4, .7);
      // 海面
      ctx.fillStyle = '#070a12'; ctx.fillRect(0, H * .80, W, H * .20);
      ctx.strokeStyle = 'rgba(120,170,255,.10)'; ctx.lineWidth = 1;
      for (let y = H * .82; y < H; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      // 钢铁手臂
      ctx.save();
      ctx.strokeStyle = 'rgba(200,210,230,.65)'; ctx.lineWidth = 8; ctx.lineCap = 'round';
      const open = 1 - clamp(lt * 1.4);
      ctx.beginPath(); ctx.moveTo(W * .18, H * .86); ctx.lineTo(W * .30, H * .46);
      ctx.lineTo(W * .30 + 120 * open, H * .30 + 120 * open); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W * .82, H * .86); ctx.lineTo(W * .70, H * .46);
      ctx.lineTo(W * .70 - 120 * open, H * .30 + 120 * open); ctx.stroke();
      ctx.restore();
      // 下降的助推器
      const y = lerp(-160, H * .34, smooth(clamp(lt * 1.1)));
      ctx.save(); ctx.translate(W * .5, y);
      ctx.fillStyle = '#d8dfec'; ctx.fillRect(-26, -120, 52, 240);
      ctx.fillStyle = OR; ctx.fillRect(-26, -10, 52, 10);
      ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 2;
      ctx.strokeRect(-26, -120, 52, 240);
      // 栅格舵
      ctx.fillStyle = '#9aa6b8';
      ctx.fillRect(-40, -110, 14, 26); ctx.fillRect(26, -110, 14, 26);
      ctx.restore();
      // 着陆腿
      if (lt > .55) {
        const k = clamp((lt - .55) / .3);
        ctx.strokeStyle = 'rgba(220,228,240,.8)'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(W * .5 - 20, y + 100); ctx.lineTo(W * .5 - 70 * k, y + 150 * k);
        ctx.moveTo(W * .5 + 20, y + 100); ctx.lineTo(W * .5 + 70 * k, y + 150 * k);
        ctx.stroke();
      }
      bigNum('REUSE', W * .5, H * .16, 92, 'rgba(255,106,43,.14)');
      grid(t, 160, .5);
    },

    // 2026 阿尔忒弥斯二号 + 尾声
    artemis(t, lt) {
      drawStars(t, .6, .9);
      const mx = W * .30, my = H * .5, mr = H * .22;
      ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.2832);
      const g = ctx.createRadialGradient(mx - mr * .3, my - mr * .3, mr * .1, mx, my, mr);
      g.addColorStop(0, '#43464e'); g.addColorStop(1, '#14161a');
      ctx.fillStyle = g; ctx.fill();

      const p = ease(clamp(lt * 1.05));
      const a = lerp(-.9, 4.6, p);
      const rx = mx + Math.cos(a) * W * .34, ry = my + Math.sin(a) * H * .30;
      ctx.save();
      ctx.setLineDash([6, 10]); ctx.strokeStyle = 'rgba(255,106,43,.30)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(W * .95, H * .82);
      ctx.quadraticCurveTo(W * .55, H * .10, rx, ry); ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.translate(rx, ry); ctx.rotate(Math.atan2(Math.cos(a) * H * .30, -Math.sin(a) * W * .34));
      ctx.fillStyle = WH; ctx.fillRect(-10, -6, 20, 12);
      ctx.strokeStyle = OR; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(26, 0); ctx.stroke();
      ctx.restore();

      // 尾声：金唱片浮现
      if (lt > .62) {
        const k = clamp((lt - .62) / .3);
        ctx.save(); ctx.globalAlpha = k;
        record(W * .70, H * .52, 130 * k, t * .4, k);
        ctx.font = `400 16px ${MONO}`; ctx.fillStyle = 'rgba(255,225,170,.9)'; ctx.textAlign = 'center';
        ctx.fillText('WE CHOSE A GOLDEN RECORD', W * .70, H * .52 + 180);
        ctx.restore();
      }
      bigNum('2026', W * .70, H * .18, 76, 'rgba(255,106,43,.16)');
      grid(t, 150, .45);
    },
  };

  const SCENE_OF = {
    '1944': SCENES.v2, '1957a': SCENES.sputnik, '1957b': SCENES.laika, '1961': SCENES.gagarin,
    '1968': SCENES.earthrise, '1969': SCENES.apollo, '1970': SCENES.dfh, '1977': SCENES.voyager,
    '1990': SCENES.dot, '2003': SCENES.shenzhou, '2019': SCENES.change4, '2024': SCENES.change6,
    '2015': SCENES.recovery, '2026': SCENES.artemis,
  };
  const DRAW = [SCENES.v2, SCENES.sputnik, SCENES.laika, SCENES.gagarin, SCENES.earthrise,
                SCENES.apollo, SCENES.dfh, SCENES.voyager, SCENES.dot, SCENES.shenzhou,
                SCENES.change4, SCENES.change6, SCENES.recovery, SCENES.artemis];

  // ---------------- 播放 ----------------
  const audio = new Audio('/space/song.m4a');
  audio.preload = 'auto';
  let playing = false, t = 0, last = performance.now();

  function seek(x) {
    t = clamp(x, 0, DUR - .01);
    try { audio.currentTime = t; } catch (e) {}
  }
  function toggle() {
    playing = !playing;
    if (playing) { audio.currentTime = t; audio.play().catch(() => {}); }
    else audio.pause();
  }

  cv.onclick = toggle;
  scrub.oninput = () => { t = parseFloat(scrub.value); if (playing) audio.currentTime = t; else seek(t); };

  window.addEventListener('keydown', (e) => {
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    if (e.key === 'ArrowRight') seek(t + (e.shiftKey ? 5 : 1));
    if (e.key === 'ArrowLeft') seek(t - (e.shiftKey ? 5 : 1));
    if (e.key === ']') { const i = CH.findIndex((c) => c.t0 > t + .01); if (i >= 0) seek(CH[i].t0); }
    if (e.key === '[') { const es = CH.filter((c) => c.t0 < t - .3); if (es.length) seek(es[es.length - 1].t0); }
    if (e.key === 'h') document.getElementById('ui').style.display = document.getElementById('ui').style.display === 'none' ? '' : 'none';
  });

  function tick() {
    const now = performance.now();
    const dt = (now - last) / 1000; last = now;
    if (playing) {
      if (!audio.paused) t = audio.currentTime;
      else t = Math.min(DUR, t + dt);
      if (t >= DUR - .05) { t = DUR - .05; playing = false; audio.pause(); }
    }

    const c = chapterAt(t);
    const lt = localT(c, t);
    const idx = CH.indexOf(c);

    ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H);
    const pulse = beatPulse(t);
    // 拍点微弱闪白
    if (pulse > .01) { ctx.fillStyle = `rgba(255,106,43,${(pulse * .035).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }

    DRAW[Math.max(0, idx)](t, lt, c);

    // 转场：章节开头 0.6 秒橙色横线扫过
    const sinceStart = t - c.t0;
    if (sinceStart < .55) {
      const k = sinceStart / .55;
      ctx.save();
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = OR;
      ctx.fillRect(0, H * .5 - 1.5, W * (1 - k), 3);
      ctx.restore();
    }
    // 章节末尾淡出
    const toEnd = c.t1 - t;
    if (toEnd < .35) {
      ctx.save(); ctx.globalAlpha = (toEnd / .35) * .55;
      ctx.fillStyle = '#05060a'; ctx.fillRect(0, 0, W, H); ctx.restore();
    }

    hud(t, c);

    scrub.value = String(t);
    const chIdx = String(idx + 1).padStart(2, '0');
    info.innerHTML = `<b>${c.year}</b> ${c.zh}<span class="sep">|</span>${chIdx}/${CH.length}` +
      `<span class="sep">|</span>${t.toFixed(1)}s / ${DUR}s` +
      `<span class="sep">|</span>${playing ? 'PLAYING' : 'PAUSED'}` +
      `<span class="sep">|</span>空格播放 · ←/→ 跳秒 · [ ] 切章 · H 隐藏界面`;

    requestAnimationFrame(tick);
  }

  // 预热：等音频元数据
  audio.addEventListener('loadedmetadata', () => {});
  // 允许无音频也能看：进度条拖动/空格
  requestAnimationFrame(tick);
})();
