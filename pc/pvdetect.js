'use strict';
/*
 * DSH PV 的渲染环境探测（纯 Node，不依赖 Electron，方便单独测试）。
 *
 * 返回一份报告：硬件编码器能不能用、有没有带 CUDA 的 PyTorch、CPU/内存/磁盘够不够。
 * 每一项"不满足"都进 issues[]，由页面弹窗展示并让用户确认回退 CPU。
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ENC_TIMEOUT = 20000;
const PY_TIMEOUT = 25000;

function runOnce(cmd, args, timeout) {
  return new Promise((resolve) => {
    let done = false;
    let out = '';
    let err = '';
    let p;
    const finish = (r) => {
      if (done) return;
      done = true;
      try { if (p) p.kill(); } catch (e) {}
      resolve(r);
    };
    try {
      p = spawn(cmd, args, { windowsHide: true });
    } catch (e) {
      return resolve({ ok: false, code: -1, out: '', err: String(e && e.message) });
    }
    const t = setTimeout(() => finish({ ok: false, code: -1, out, err: err + '\n[超时]' }), timeout);
    p.stdout.on('data', (b) => { out += b.toString('utf8'); });
    p.stderr.on('data', (b) => { err += b.toString('utf8'); });
    p.on('error', (e) => { clearTimeout(t); finish({ ok: false, code: -1, out, err: err + String(e && e.message) }); });
    p.on('close', (code) => { clearTimeout(t); finish({ ok: code === 0, code, out, err }); });
  });
}

/** 用 ffmpeg 试编 0.2 秒黑帧，成功说明这个硬件编码器真的能初始化（比看 -encoders 列表可靠）。 */
async function testEncoder(ffmpeg, enc) {
  const r = await runOnce(ffmpeg, [
    '-v', 'error', '-hide_banner', '-nostdin', '-y',
    '-f', 'lavfi', '-i', 'color=c=black:s=256x144:d=0.2',
    '-c:v', enc, '-f', 'null', '-',
  ], ENC_TIMEOUT);
  return r.ok;
}

/** 探测一个 python 是否能 import torch 且 CUDA 可用。 */
async function testCudaPython(python) {
  const r = await runOnce(python, ['-c', 'import torch;print("CUDA" if torch.cuda.is_available() else "NO_CUDA")'], PY_TIMEOUT);
  const text = (r.out || '') + (r.err || '');
  if (/\bCUDA\b/.test(r.out) && !/NO_CUDA/.test(r.out)) return { ok: true, reason: 'CUDA 可用' };
  if (/NO_CUDA/.test(text)) return { ok: false, reason: 'torch 在，但没有可用的 CUDA 设备' };
  if (/ModuleNotFoundError|No module named '?torch/i.test(text)) return { ok: false, reason: '这个 Python 没装 torch' };
  return { ok: false, reason: '无法运行这个 Python' };
}

function diskFreeGB(p) {
  try {
    const st = fs.statfsSync(p);
    return Math.round((st.bavail * st.bsize) / 1e9 * 10) / 10;
  } catch (e) {
    return null;
  }
}

/**
 * @param {{ffmpeg?: string, pythonExe?: string, cudaPython?: string, quality?: {w:number,h:number,label:string,codec:string}, dir?: string}} opt
 */
async function detect(opt = {}) {
  const ffmpeg = opt.ffmpeg || 'ffmpeg';
  const issues = [];
  const cpu = os.cpus() || [];
  const cores = cpu.length || 1;
  const cpuName = (cpu[0] && cpu[0].model ? cpu[0].model : '未知 CPU').replace(/\s+/g, ' ').trim();
  const ramGB = Math.round((os.totalmem() / 1024 ** 3) * 10) / 10;
  const freeGB = diskFreeGB(opt.dir || process.cwd());
  const quality = opt.quality || { label: '4K', w: 3840, h: 2160, codec: 'hevc' };

  // --- 硬件编码器：按厂商优先级试编 ---
  const vendors = ['nvenc', 'qsv', 'amf'];
  const enc = { nvenc: false, qsv: false, amf: false, name: '' };
  const needHevc = quality.codec === 'hevc';
  for (const v of vendors) {
    const h264ok = await testEncoder(ffmpeg, `h264_${v}`);
    let hevcok = false;
    if (needHevc || h264ok) hevcok = await testEncoder(ffmpeg, `hevc_${v}`);
    if (h264ok || hevcok) {
      enc[v] = true;
      enc.name = v;
      enc.h264 = h264ok;
      enc.hevc = hevcok;
      break;
    }
  }
  const hwEncode = !!(enc.h264 || enc.hevc);
  if (!hwEncode) {
    issues.push({
      key: 'encoder',
      title: '没有可用的硬件编码器',
      detail: 'NVENC / QSV / AMF 都试编失败，或者这台机器没有对应显卡。',
      advice: '导出会走 CPU（libx264 / libx265），只会慢一些，画质不变。',
    });
  }

  // --- 合成层 GPU：需要带 torch + CUDA 的 Python ---
  const cands = [];
  const push = (p) => { if (p && !cands.includes(p)) cands.push(p); };
  push(opt.cudaPython);
  push(process.env.PV_PYTHON);
  push(opt.pythonExe);
  push(process.platform === 'win32' ? 'python' : 'python3');
  let cudaPython = null;
  let cudaReason = '没有找到装 torch 的 Python';
  for (const c of cands) {
    const r = await testCudaPython(c);
    if (r.ok) { cudaPython = c; cudaReason = 'CUDA 可用'; break; }
    cudaReason = r.reason;
  }
  if (!cudaPython) {
    issues.push({
      key: 'cuda',
      title: 'GPU 合成不可用',
      detail: `没有找到带 CUDA 的 PyTorch 环境（${cudaReason}）。应用内置的便携 Python 不带 torch。`,
      advice: '逐帧合成会走 CPU，bloom/拖影/扫描线那部分慢一些。装过 PyTorch CUDA 的话，把那个 python.exe 的路径填到下面就能开。',
    });
  }

  // --- 机器规格（只按档位给建议，不阻断） ---
  if (ramGB < 8) {
    issues.push({
      key: 'ram',
      title: `内存偏小（${ramGB} GB）`,
      detail: '逐帧渲染会并行开多个 worker，内存不足时容易卡顿甚至失败。',
      advice: '关掉其他占内存的程序，或者换 1080P / 720P 档位。',
    });
  }
  if (freeGB !== null && freeGB < 6) {
    issues.push({
      key: 'disk',
      title: `磁盘剩余空间不足（${freeGB} GB）`,
      detail: '渲染过程会产生几千张 PNG 中间帧和一个无损母版，至少要留 6 GB。',
      advice: '清理一下磁盘再开始，否则会中途失败。',
    });
  }
  if (quality.w >= 3840 && !hwEncode) {
    issues.push({
      key: '4k-cpu',
      title: '4K + CPU 编码会很慢',
      detail: '这支片子 211 秒，4K 用 CPU 编码大约 8–15 分钟，还不算前面的逐帧合成。',
      advice: '想要快，可以换 1080P / 720P，或者换一台有 NVIDIA / Intel / AMD 显卡的机器。',
    });
  }
  if (quality.w >= 3840 && cores < 6) {
    issues.push({
      key: 'cores',
      title: `CPU 核心偏少（${cores} 核），4K 档位会慢`,
      detail: '4K 是 720p 母版的 3× 放大，渲染阶段最吃 CPU 并行。',
      advice: '可以继续，但建议换 1080P 或 720P。',
    });
  }

  return {
    cpu: cpuName,
    cores,
    ramGB,
    freeGB,
    encoders: enc,
    hwEncode,
    encoderH264: hwEncode && enc.h264 ? (enc.hevc ? `h264_${enc.name}` : `h264_${enc.name}`) : null,
    encoderHevc: hwEncode && enc.hevc ? `hevc_${enc.name}` : null,
    cudaPython,
    gpuRender: !!cudaPython,
    quality,
    issues,
    ok: issues.length === 0,
  };
}

module.exports = { detect, testEncoder, testCudaPython };
