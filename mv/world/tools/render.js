// Deterministic frame renderer for orange-mv (playwright-core + local Chrome, one screenshot per frame).
//   node tools/render.js --keys 3,10.5,15.4            -> frames/keys/k_<t>.png  (q sub-frames, default 1)
//   node tools/render.js --fps 60 --q 4                -> frames/full/f_000000.png ...
//   node tools/render.js --fps 60 --q 4 --from 0 --to 600 --out frames/full   (frame index range, for parallel workers)
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright-core');
const { startServer, ROOT } = require('./serve.js');

const arg = (k, d) => { const i = process.argv.indexOf(k); return i >= 0 ? process.argv[i + 1] : d; };

(async () => {
  const keys = arg('--keys') ? arg('--keys').split(',').map(Number) : null;
  const fps = Number(arg('--fps', 60)), q = Number(arg('--q', keys ? 1 : 4)), SSF = Number(arg('--ss', 1));
  const step = Number(arg('--step', 1));
  if (![fps, q, SSF, step].every(n => Number.isFinite(n) && n > 0) || (keys && !keys.every(Number.isFinite))) throw new Error('Invalid render arguments');
  const outDir = path.resolve(ROOT, arg('--out', keys ? 'frames/keys' : 'frames/full'));
  const JPG = process.argv.includes('--jpg'), EXT = JPG ? 'jpg' : 'png';
  fs.mkdirSync(outDir, { recursive: true });
  const { server, port } = await startServer(0);
  let browser;
  try {
  browser = await chromium.launch({
    channel: 'chrome', headless: true,
    args: ['--enable-gpu', '--ignore-gpu-blocklist', '--force-color-profile=srgb', '--hide-scrollbars', '--disable-lcd-text', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SSF });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text()}`); });
  await page.goto(`http://127.0.0.1:${port}/index.html?render=1&fps=${fps}&ss=${SSF}${process.argv.includes('--full') ? '&cut=full' : ''}${process.argv.includes('--hook') ? '&hook=1' : ''}${arg('--query') ? '&' + arg('--query') : ''}`);
  try { await page.evaluate(() => window.__ready); } catch (e) { throw new Error('init failed: ' + e.message + '\n' + errors.join('\n')); }
  const dur = await page.evaluate(() => window.DUR);
  const total = Math.round(dur * fps);
  let times;
  if (keys) times = keys.map(t => ({ t, name: `${arg('--prefix', 'k')}_${t.toFixed(2).padStart(6, '0')}.png` }));
  else {
    const from = Number(arg('--from', 0)), to = Math.min(total, Number(arg('--to', total)));
    times = [];
    if (![from, to].every(Number.isFinite) || from < 0 || to < from) throw new Error('Invalid frame range');
    for (let i = from; i < to; i += step) times.push({ t: i / fps, name: `f_${String(i).padStart(6, '0')}.${EXT}` });       // --step N: every Nth frame, for spot checks
  }
  const t0 = Date.now();
  for (let k = 0; k < times.length; k++) {
    const { t, name } = times[k];
    const file = path.join(outDir, name);
    if (!keys && fs.existsSync(file) && !process.argv.includes('--force')) continue;
    await page.evaluate(([tt, qq]) => window.seek(tt, qq), [t, q]);
    await page.screenshot({ path: file, type: JPG ? 'jpeg' : 'png', ...(JPG ? { quality: Number(arg('--jq', 92)) } : {}), clip: { x: 0, y: 0, width: 1920, height: 1080 }, animations: 'disabled', caret: 'hide' });
    if (!keys && k % 120 === 119) console.log(`  ${k + 1}/${times.length}  ${((Date.now() - t0) / (k + 1)).toFixed(0)} ms/frame`);
  }
  console.log(`rendered ${times.length} frame(s) in ${((Date.now() - t0) / 1000).toFixed(1)} s -> ${outDir}  (fps ${fps}, q ${q}, total ${total})`);
  if (errors.length) console.log('PAGE MESSAGES:\n' + [...new Set(errors)].slice(0, 30).join('\n'));
  } finally {
    try { if (browser) await browser.close(); }
    finally { await new Promise(resolve => server.close(resolve)); }
  }
})().catch(e => { console.error(e); process.exit(1); });
