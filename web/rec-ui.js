// APP 内录制开关：右上角一个按钮，随时开录 / 停录；录完直接存进系统「下载」目录。
(function () {
  const isApp = location.protocol === 'http:' && /^127\.0\.0\.1$/.test(location.hostname);

  // 抓到播放器元素（拿音频轨）
  const OrigAudio = window.Audio;
  if (OrigAudio && !OrigAudio.__patched) {
    const P = function (...a) {
      const el = new OrigAudio(...a);
      window.__audioEl = el;
      return el;
    };
    P.prototype = OrigAudio.prototype;
    P.__patched = true;
    window.Audio = P;
  }

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;right:14px;top:14px;z-index:99999;display:flex;gap:8px;align-items:center;font:13px ui-monospace,monospace';
  const btn = document.createElement('button');
  btn.textContent = '● 录制';
  btn.style.cssText =
    'padding:8px 14px;border-radius:18px;border:1px solid #ff4d12;background:#000b;color:#ff4d12;' +
    'font:13px ui-monospace,monospace;cursor:pointer';
  const tip = document.createElement('span');
  tip.style.cssText = 'color:#bbb;background:#000a;padding:4px 8px;border-radius:6px;display:none';
  wrap.appendChild(btn);
  wrap.appendChild(tip);
  document.body.appendChild(wrap);

  let rec = null, chunks = [], stream = null, timer = null, t0 = 0;
  const say = (s) => { tip.style.display = s ? 'inline' : 'none'; tip.textContent = s; };

  function pickMime() {
    const cands = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    for (const c of cands) if (window.MediaRecorder && MediaRecorder.isTypeSupported(c)) return c;
    return '';
  }

  async function start() {
    const canvas = document.getElementById('c');
    if (!canvas) return say('找不到画布');
    const mime = pickMime();
    if (!mime) return say('这台设备不支持录制');

    stream = canvas.captureStream(30);
    const audio = window.__audioEl;
    if (audio) {
      try {
        for (const tr of audio.captureStream().getAudioTracks()) stream.addTrack(tr);
      } catch (e) {}
    }

    chunks = [];
    rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 12000000 });
    rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    rec.onstop = () => save(mime);

    // 回到片头再开录
    const scrub = document.querySelector('#scrub');
    if (scrub) {
      scrub.value = '0';
      scrub.dispatchEvent(new Event('input', { bubbles: true }));
    }
    await new Promise((r) => setTimeout(r, 400));

    rec.start(1000);
    t0 = Date.now();
    canvas.click(); // 页面自带的播放开关
    btn.textContent = '■ 停止';
    btn.style.color = '#fff';
    btn.style.background = '#ff4d12';
    timer = setInterval(() => {
      const t = scrub ? parseFloat(scrub.value) : 0;
      say('录制中 ' + t.toFixed(1) + 's · ' + Math.round((Date.now() - t0) / 1000) + 's');
    }, 500);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
    say('编码中…');
    if (rec && rec.state !== 'inactive') rec.stop();
    btn.textContent = '● 录制';
    btn.style.color = '#ff4d12';
    btn.style.background = '#000b';
  }

  async function save(mime) {
    const blob = new Blob(chunks, { type: mime });
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    const name = 'pdoom-render.' + ext;
    chunks = [];
    try {
      if (isApp) {
        const r = await fetch('/__rec?name=' + encodeURIComponent(name), { method: 'POST', body: blob });
        const t = await r.text();
        say(t.slice(0, 60));
      } else {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
        say('已下载 ' + (blob.size / 1e6).toFixed(1) + 'MB');
      }
    } catch (e) {
      say('保存失败：' + e.message);
    }
  }

  btn.onclick = () => {
    if (rec && rec.state === 'recording') stop();
    else start().catch((e) => say('录制失败：' + e.message));
  };
})();
