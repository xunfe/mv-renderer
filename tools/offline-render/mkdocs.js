const fs = require('fs'), path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const MV = path.resolve(__dirname, '..');
for (const f of ['/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']) {
  try { GlobalFonts.registerFromPath(f, f.includes('Serif') ? 'Noto Serif CJK SC' : 'Noto Sans CJK SC'); } catch (e) {}
}
const mainCanvas = createCanvas(1920, 1080);
const els = {};
const stubEl = (id) => ({ id, style: {}, textContent: '', value: '0', classList: { toggle(){}, add(){}, remove(){}, contains(){return false} }, addEventListener(){}, closest(){return null} });
const document = { getElementById(id) { if (id === 'c') return mainCanvas; if (!els[id]) els[id] = stubEl(id); return els[id]; }, createElement(t) { return t === 'canvas' ? createCanvas(1,1) : stubEl(t); }, body: stubEl('body'), title: '', addEventListener(){} };
const fn = new Function('document','window','addEventListener','requestAnimationFrame','performance','fetch','location','setTimeout','Audio','Image','console',
  ['engine.js','scenes.js','mv.js'].map(f => fs.readFileSync(path.join(MV, f), 'utf8')).join('\n;\n') + '\n; return { SCENES, DUR };');
const api = fn(document, { devicePixelRatio: 1 }, () => {}, () => 0, { now: () => Date.now() }, () => Promise.reject(1), { search: '', href: '', pathname: '/', replace() {} }, () => 0, function(){}, function(){}, { log() {}, error() {} });

const fmt = (s, ms) => {
  const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = Math.floor(s % 60), mmm = Math.round((s - Math.floor(s)) * 1000);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')},${String(ms===undefined?mmm:ms).padStart(3,'0')}`;
};
const clean = (t) => t.replace(/\{(\w:)?([^}]*)\}/g, '$2');
let srt = '', n = 0, md = '';
api.SCENES.forEach((sc, i) => {
  if (!sc.sub) return;
  n++;
  const t0 = sc.t0 + 0.10, t1 = Math.min(sc.t1, api.DUR) - 0.12;
  srt += `${n}\r\n${fmt(t0)} --> ${fmt(t1)}\r\n${clean(sc.sub)}\r\n\r\n`;
  md += `| ${String(i+1).padStart(2,'0')} | ${fmt(t0).slice(3, 8)} | ${clean(sc.sub)} |\n`;
});
fs.writeFileSync(path.join(MV, '字幕.srt'), srt);
fs.writeFileSync(path.join(MV, '旁白.md'), '# 旁白（' + n + ' 句）\n\n| # | 时间 | 旁白 |\n|---|---|---|\n' + md);
console.log('scenes', api.SCENES.length, 'subs', n, 'dur', api.DUR);
