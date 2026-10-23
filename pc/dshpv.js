'use strict';
/*
 * DSH PV（MisakaZentai/world-execute-me-dsh-pv）的本地渲染编排。
 *
 * 这个工程原本用 Playwright 截图，这里换成应用自带的 Electron：
 *   python batch_*.py 生成每一帧的 HTML -> Electron 隐藏窗口逐帧截图 -> python 渲染成片
 * 运行时（Windows 打包）：
 *   resources/app/runtime/python/python.exe  （3.12 便携版 + Pillow/NumPy）
 *   resources/app/runtime/ffmpeg/ffmpeg.exe
 *
 * 画质档位：工程母版是 1280x720 / 24fps 的像素画，4K / 2K / 1080P 都是整数倍或半倍最近邻放大，
 * 帧率统一 24fps（工程 FPS 写死 24，不存在 60fps 的真实画面）。
 */
const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('child_process');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const pvdetect = require('./pvdetect');

const BATCHES = [
  ['batch_a1.py', 'a1'],
  ['batch_a2.py', 'a2'],
  ['batch_a3.py', 'a3'],
  ['batch_b.py', 'b'],
  ['batch_c.py', 'c'],
  ['seg_page.py', 'seg'],
  ['batch_e.py', 'e'],
  ['batch_g.py', 'g'],
  ['batch_f.py', 'f'],
];

const SHEETS = ['s-vendor', 's-index', 's-components', 's-palette', 's-bare', 's-code', 's-pv'];
const SEG_W = 354;
const SEG_H = 537;

// 工程自带的两个常量（build.py）：片长、开头提示音的起点
const END = 211.9;
const CHIME_MS = 207873;
const FPS = 24;

/** 画质档位。codec 是导出用的编码族（4K 走 HEVC，其余 H.264）。 */
const QUALITIES = [
  { id: '2160', label: '4K', w: 3840, h: 2160, scale: 3, codec: 'hevc', note: '3× 最近邻放大 · 像素完全无损' },
  { id: '1440', label: '2K', w: 2560, h: 1440, scale: 2, codec: 'h264', note: '2× 最近邻放大 · 像素完全无损' },
  { id: '1080', label: '1080P', w: 1920, h: 1080, scale: 1.5, codec: 'h264', note: '1.5× 放大 · 像素画不是整数倍' },
  { id: '720', label: '720P', w: 1280, h: 720, scale: 1, codec: 'h264', note: '代码原生规格 · 1280×720' },
];

/** 各编码器的参数。硬件编码画质参数和 libx264 不同，不能照搬 crf。 */
const ENC_PARAMS = {
  libx264: ['-c:v', 'libx264', '-crf', '16', '-preset', 'slow'],
  // 4K 没有硬件编码时用 x264：实测 x265 medium 跑 4K 只有 1/48 实时，211 秒的片子要两个多小时，
  // x264 medium 约 1/2.4 实时（8 分钟左右），画质差距肉眼看不出来，体积大一些。
  libx264_4k: ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium'],
  libx265: ['-c:v', 'libx265', '-crf', '16', '-preset', 'medium', '-tag:v', 'hvc1'],
  h264_nvenc: ['-c:v', 'h264_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '19', '-b:v', '0'],
  hevc_nvenc: ['-c:v', 'hevc_nvenc', '-preset', 'p6', '-tune', 'hq', '-rc', 'vbr', '-cq', '20', '-b:v', '0', '-tag:v', 'hvc1'],
  h264_qsv: ['-c:v', 'h264_qsv', '-preset', 'slow', '-global_quality', '20'],
  hevc_qsv: ['-c:v', 'hevc_qsv', '-preset', 'slow', '-global_quality', '22', '-tag:v', 'hvc1'],
  h264_amf: ['-c:v', 'h264_amf', '-quality', 'quality', '-rc', 'cqp', '-qp_i', '20', '-qp_p', '22'],
  hevc_amf: ['-c:v', 'hevc_amf', '-quality', 'quality', '-rc', 'cqp', '-qp_i', '22', '-qp_p', '24', '-tag:v', 'hvc1'],
};

const HW_FALLBACK = { h264_nvenc: 'libx264', h264_qsv: 'libx264', h264_amf: 'libx264', hevc_nvenc: 'libx264_4k', hevc_qsv: 'libx264_4k', hevc_amf: 'libx264_4k' };

class DshPv {
  constructor({ appDir, srcDir, runtimeDir, onUpdate }) {
    this.appDir = appDir;
    this.srcDir = srcDir;
    this.runtimeDir = runtimeDir;
    this.onUpdate = onUpdate || (() => {});
    this.quality = QUALITIES[0];
    this.plan = {};
    this.state = {
      phase: 'idle',
      message: '准备就绪',
      percent: 0,
      etaSec: null,
      elapsedSec: 0,
      log: [],
      running: false,
      error: '',
      quality: this.quality.id,
      qualityLabel: this.quality.label,
      gpuRender: false,
      encoder: '',
      output: this.outputPath(),
    };
    this.cancelled = false;
    this.child = null;
    this.win = null;
    this.t0 = 0;
    this.lastEmit = 0;
    this.framesTotal = 0;
    this.framesDone = 0;
    this.detected = null;
  }

  get workDir() {
    return path.join(this.appDir, 'DSH-PV');
  }
  get dshDir() {
    return path.join(this.workDir, 'film', 'pv_dsh_frontend_20260927');
  }
  outputPath() {
    return path.join(this.appDir, 'video', `DSH-PV-${this.quality.label}.mp4`);
  }
  get isWin() {
    return process.platform === 'win32';
  }
  get pythonExe() {
    return this.isWin ? path.join(this.runtimeDir, 'python', 'python.exe') : 'python3';
  }
  get ffmpegDir() {
    return this.isWin ? path.join(this.runtimeDir, 'ffmpeg') : '/usr/bin';
  }
  get ffmpegExe() {
    return this.isWin ? path.join(this.runtimeDir, 'ffmpeg', 'ffmpeg.exe') : 'ffmpeg';
  }

  snapshot() {
    return {
      ...this.state,
      output: this.outputPath(),
      quality: this.quality.id,
      qualityLabel: this.quality.label,
      qualities: QUALITIES,
      hasOutput: fs.existsSync(this.outputPath()),
      outputSize: fs.existsSync(this.outputPath()) ? fs.statSync(this.outputPath()).size : 0,
      workDir: this.workDir,
    };
  }

  emit(force = false) {
    const now = Date.now();
    if (!force && now - this.lastEmit < 400) return;
    this.lastEmit = now;
    this.state.elapsedSec = this.state.running ? Math.round((Date.now() - this.t0) / 1000) : this.state.elapsedSec;
    try {
      this.onUpdate(this.snapshot());
    } catch (e) {}
  }

  log(line) {
    const s = String(line).replace(/\r/g, '').trimEnd();
    if (!s) return;
    for (const part of s.split('\n')) {
      if (!part.trim()) continue;
      this.state.log.push(part.slice(0, 500));
      if (this.state.log.length > 400) this.state.log.shift();
    }
    this.emit(true);
  }

  setPhase(phase, message, percent) {
    this.state.phase = phase;
    if (message !== undefined) this.state.message = message;
    if (percent !== undefined) this.state.percent = percent;
    this.emit(true);
  }

  env(extra) {
    const e = { ...process.env };
    e.PATH = this.ffmpegDir + path.delimiter + (e.PATH || '');
    e.PYTHONUTF8 = '1';
    e.PYTHONIOENCODING = 'utf-8';
    e.PYTHONUNBUFFERED = '1';
    return Object.assign(e, extra || {});
  }

  run(cmd, args, cwd, extraEnv) {
    return new Promise((resolve, reject) => {
      if (this.cancelled) return reject(new Error('已取消'));
      let tail = [];
      const p = spawn(cmd, args, { cwd, env: this.env(extraEnv), windowsHide: true });
      this.child = p;
      const onData = (buf) => {
        const text = buf.toString('utf8');
        this.log(text);
        tail = tail.concat(text.split('\n')).slice(-40);
      };
      p.stdout.on('data', onData);
      p.stderr.on('data', onData);
      p.on('error', (err) => reject(err));
      p.on('close', (code) => {
        this.child = null;
        if (this.cancelled) return reject(new Error('已取消'));
        if (code === 0) resolve();
        else reject(new Error(`${path.basename(cmd)} ${args[0] || ''} 退出码 ${code}\n${tail.slice(-12).join('\n')}`));
      });
    });
  }

  /** 页面点「开始渲染」前调用：探测这台机器能不能吃 GPU，把不满足的项带回去弹窗。 */
  async detect(qualityId) {
    const q = QUALITIES.find((x) => x.id === qualityId) || this.quality || QUALITIES[0];
    const report = await pvdetect.detect({
      ffmpeg: this.ffmpegExe,
      pythonExe: this.pythonExe,
      cudaPython: this.plan && this.plan.cudaPython,
      quality: q,
      dir: this.appDir,
    });
    this.detected = report;
    return { ...report, quality: q };
  }

  /** 第一次渲染把内置工程复制到应用目录（可写、路径短） */
  async prepare() {
    const marker = path.join(this.workDir, '.prepared');
    if (fs.existsSync(marker) && fs.existsSync(this.dshDir)) return;
    this.setPhase('prepare', '正在准备渲染工程（首次约 1 分钟）…', 1);
    await fsp.rm(this.workDir, { recursive: true, force: true });
    await fsp.mkdir(this.workDir, { recursive: true });
    await fsp.cp(this.srcDir, this.workDir, { recursive: true });
    await fsp.writeFile(marker, new Date().toISOString());
    await fsp.mkdir(path.join(this.appDir, 'video'), { recursive: true });
  }

  async dancer() {
    this.setPhase('dancer', '生成替身舞者帧…', 3);
    await this.run(this.pythonExe, ['tools/placeholder_h3.py', '--workers', String(this.workers())], this.workDir);
  }

  workers() {
    const n = (require('os').cpus() || []).length || 4;
    return Math.max(2, Math.min(8, n - 1));
  }

  totalFrames() {
    let total = 0;
    for (const [, f] of BATCHES) {
      try {
        const arr = JSON.parse(fs.readFileSync(path.join(this.dshDir, `${f}_frames.json`), 'utf8'));
        total += arr.length;
      } catch (e) {
        return null;
      }
    }
    return total;
  }

  screenshotScript(frame) {
    return `(function(){
      const f = ${JSON.stringify(frame)};
      const ids = ${JSON.stringify(SHEETS)};
      for (const id of ids) { const el = document.getElementById(id); if (el) el.disabled = !f.sheets.includes(id); }
      const app = document.getElementById('app');
      app.innerHTML = f.body || '';
      for (const a of document.getAnimations()) {
        a.pause();
        const d = a.effect && a.effect.getTiming().duration;
        a.currentTime = (typeof d === 'number' && d > 0) ? (f.t * 1000) % d : 0;
      }
      return true;
    })()`;
  }

  async ensureWindow() {
    if (this.win && !this.win.isDestroyed()) return this.win;
    // 离屏渲染：不弹窗、不受 GPU 合成影响，稳定拿到每一帧
    const win = new BrowserWindow({
      width: SEG_W,
      height: SEG_H,
      useContentSize: true,
      frame: false,
      show: false,
      backgroundColor: '#05080f',
      webPreferences: {
        offscreen: true,
        backgroundThrottling: false,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    win.setMenuBarVisibility(false);
    this.lastPaint = null;
    this.paintSeq = 0;
    win.webContents.on('paint', (e, dirty, image) => {
      this.lastPaint = image;
      this.paintSeq++;
    });
    win.webContents.setFrameRate(30);
    await win.loadFile(path.join(this.dshDir, 'seg.html'));
    await win.webContents.executeJavaScript('document.fonts.ready.then(()=>true)');
    this.win = win;
    return win;
  }

  waitPaint(seq0, need = 2, timeout = 400) {
    return new Promise((resolve) => {
      const t0 = Date.now();
      const tick = () => {
        if (this.paintSeq >= seq0 + need || Date.now() - t0 > timeout) return resolve();
        setTimeout(tick, 16);
      };
      tick();
    });
  }

  async screenshotBatch(framesFile) {
    const frames = JSON.parse(await fsp.readFile(path.join(this.dshDir, framesFile), 'utf8'));
    const win = await this.ensureWindow();
    const outDir = path.join(this.dshDir, 'dsh_frames');
    await fsp.mkdir(outDir, { recursive: true });
    for (const f of frames) {
      if (this.cancelled) throw new Error('已取消');
      const seq0 = this.paintSeq;
      await win.webContents.executeJavaScript(this.screenshotScript(f));
      await win.webContents.executeJavaScript(
        'Promise.all([...document.images].map(i => i.decode().catch(()=>{}))).then(()=>true)'
      );
      try { win.webContents.invalidate(); } catch (e) {}
      await this.waitPaint(seq0, 2, 400);
      let img = this.lastPaint;
      if (!img) throw new Error('离屏渲染没有拿到画面（第 ' + f.n + ' 帧）');
      const sz = img.getSize();
      if (sz.width !== SEG_W || sz.height !== SEG_H) {
        img = img.resize({ width: SEG_W, height: SEG_H, quality: 'best' });
      }
      await fsp.writeFile(path.join(outDir, String(f.n).padStart(5, '0') + '.png'), img.toPNG());
      this.framesDone++;
      this.updateEta();
      this.emit();
    }
  }

  updateEta() {
    const elapsed = (Date.now() - this.t0) / 1000;
    if (this.framesDone > 30 && this.framesTotal > 0) {
      const rate = elapsed / this.framesDone;
      const pagesLeft = Math.max(0, this.framesTotal - this.framesDone);
      // 页面阶段约占整体 55%，渲染阶段约 40%（按经验折算）
      const est = pagesLeft * rate + (this.framesTotal * rate * 0.75);
      this.state.etaSec = Math.max(0, Math.round(est));
    }
  }

  async pages() {
    for (let i = 0; i < BATCHES.length; i++) {
      if (this.cancelled) throw new Error('已取消');
      const [script, framesName] = BATCHES[i];
      const label = `${script.replace(/\.py$/, '')} · ${i + 1}/${BATCHES.length}`;
      this.setPhase('pages', `生成对话窗口：${label}`, 5 + Math.round((this.framesDone / Math.max(1, this.framesTotal)) * 60));
      await this.run(this.pythonExe, [script], this.dshDir);
      const total = this.totalFrames();
      if (total) this.framesTotal = total;
      await this.screenshotBatch(`${framesName}_frames.json`);
    }
  }

  /** 720p 无损母版：GPU 合成（有 CUDA Python）或 CPU 逐帧绘制 */
  async renderMaster() {
    const gpu = !!this.plan.gpuRender && !!this.plan.cudaPython;
    this.state.gpuRender = gpu;
    this.emit(true);
    const python = gpu ? this.plan.cudaPython : this.pythonExe;
    const extra = { DSH_MASTER: '1' };
    if (gpu) {
      extra.DSH_GPU = '1';
      const shim = path.join(this.dshDir, 'gpu_shim');
      extra.PYTHONPATH = [shim, process.env.PYTHONPATH].filter(Boolean).join(path.delimiter);
    }
    this.setPhase('render', gpu ? '渲染母版（GPU 合成）…' : '渲染母版（CPU 合成，会慢一些）…', 70);

    const segDir = path.join(this.dshDir, 'segments', 'film_master');
    const started = Date.now();
    let lastCount = 0;
    const parts = this.workers() * 2;
    const timer = setInterval(() => {
      let n = 0;
      try {
        n = fs.readdirSync(segDir).filter((f) => f.endsWith('.mp4')).length;
      } catch (e) {}
      if (n > lastCount) lastCount = n;
      const pct = 70 + Math.min(22, Math.round((lastCount / parts) * 22));
      const frac = lastCount / parts;
      const elapsed = (Date.now() - started) / 1000;
      const eta = frac > 0.05 ? Math.round((elapsed / frac) * (1 - frac) + 60) : null;
      this.setPhase('render', (gpu ? 'GPU 合成' : 'CPU 合成') + `：${lastCount}/${parts} 段完成`, pct);
      if (eta !== null) {
        this.state.etaSec = eta;
        this.emit(true);
      }
    }, 2000);
    try {
      await this.run(
        python,
        ['dsh_her.py', 'render', '0', String(END), 'film_master.mp4', String(this.workers())],
        this.dshDir,
        extra
      );
    } finally {
      clearInterval(timer);
    }
    const master = path.join(this.dshDir, 'film_master.mp4');
    if (!fs.existsSync(master)) throw new Error('渲染结束但没找到 film_master.mp4');
    const outDir = path.join(this.workDir, 'out');
    await fsp.mkdir(outDir, { recursive: true });
    await fsp.copyFile(master, path.join(outDir, 'film_master.mp4'));
    return path.join(outDir, 'film_master.mp4');
  }

  /** 按档位导出：硬件编码优先，失败自动回退软件编码（保证一定能出片） */
  async export(master, quality) {
    const videoCodec = quality.codec === 'hevc' ? 'hevc' : 'h264';
    const hw = videoCodec === 'hevc' ? this.plan.encoderHevc : this.plan.encoderH264;
    const sw = videoCodec === 'hevc' ? 'libx264_4k' : 'libx264';
    const order = hw ? [hw, sw] : [sw];
    const outDir = path.join(this.workDir, 'out');
    const outFile = path.join(outDir, `film_${quality.label}.mp4`);
    const song = path.join(this.workDir, 'input', 'song.mp3');
    const chime = path.join(this.dshDir, 'chime_g.wav');
    const audio = [
      '-i', song, '-i', chime,
      '-filter_complex',
      `[1:a]atrim=0:${END},asetpts=PTS-STARTPTS[s];[2:a]adelay=${CHIME_MS}|${CHIME_MS}[c];[s][c]amix=inputs=2:duration=first:normalize=0[a]`,
      '-map', '0:v', '-map', '[a]',
    ];
    const scale = quality.scale === 1
      ? `scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`
      : `scale=${quality.w}:${quality.h}:flags=neighbor:out_color_matrix=bt709:out_range=tv,format=yuv420p`;
    const tags = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];

    for (let i = 0; i < order.length; i++) {
      const enc = order[i];
      const isHw = !!HW_FALLBACK[enc];
      this.setPhase('export', `导出 ${quality.label} · ${enc}${isHw ? '（硬件编码）' : '（CPU 编码）'}…`, 93);
      const args = [
        '-v', 'error', '-y', '-i', master, ...audio,
        '-vf', scale, ...(ENC_PARAMS[enc] || ENC_PARAMS.libx264), ...tags,
        '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest',
        outFile,
      ];
      try {
        await this.run(this.ffmpegExe, args, this.workDir);
        this.state.encoder = enc;
        return outFile;
      } catch (e) {
        if (i === order.length - 1) throw e;
        this.log(`[回退] ${enc} 导出失败，改用 ${order[i + 1]}：${String(e.message || e).split('\n')[0]}`);
        try { await fsp.rm(outFile, { force: true }); } catch (err) {}
      }
    }
    throw new Error('导出失败');
  }

  async finish(outFile) {
    if (!fs.existsSync(outFile)) throw new Error('导出结束但没找到成片');
    const dst = this.outputPath();
    await fsp.mkdir(path.dirname(dst), { recursive: true });
    await fsp.copyFile(outFile, dst);
    this.state.percent = 100;
    this.setPhase('done', '渲染完成，正在用系统播放器打开…', 100);
    this.emit(true);
    shell.openPath(dst).catch(() => {});
  }

  /**
   * @param {{quality?: string, plan?: {gpuRender?:boolean, cudaPython?:string, encoderH264?:string|null, encoderHevc?:string|null}}} opts
   */
  async start(opts = {}) {
    if (this.state.running) return this.snapshot();
    this.quality = QUALITIES.find((q) => q.id === (opts.quality || this.quality.id)) || QUALITIES[0];
    this.plan = opts.plan || {};
    this.cancelled = false;
    this.state = {
      ...this.state,
      running: true,
      error: '',
      log: [],
      percent: 0,
      etaSec: null,
      elapsedSec: 0,
      phase: 'start',
      message: '开始…',
      quality: this.quality.id,
      qualityLabel: this.quality.label,
      gpuRender: !!this.plan.gpuRender,
      encoder: '',
    };
    this.t0 = Date.now();
    this.framesDone = 0;
    this.framesTotal = 0;
    this.emit(true);
    try {
      await this.prepare();
      await this.dancer();
      await this.pages();
      const master = await this.renderMaster();
      const outFile = await this.export(master, this.quality);
      await this.finish(outFile);
    } catch (e) {
      if (this.cancelled) {
        this.setPhase('idle', '已取消', 0);
      } else {
        this.state.error = String(e.message || e);
        this.setPhase('error', '渲染失败：' + this.state.error.split('\n')[0], this.state.percent);
        this.log('\n[错误] ' + this.state.error);
      }
    } finally {
      this.state.running = false;
      this.closeWindow();
      this.emit(true);
    }
    return this.snapshot();
  }

  cancel() {
    this.cancelled = true;
    if (this.child) {
      try {
        this.child.kill();
      } catch (e) {}
    }
    this.closeWindow();
    this.state.running = false;
    this.setPhase('idle', '已取消', 0);
  }

  closeWindow() {
    if (this.win && !this.win.isDestroyed()) {
      try {
        this.win.destroy();
      } catch (e) {}
    }
    this.win = null;
  }
}

module.exports = { DshPv, QUALITIES };
