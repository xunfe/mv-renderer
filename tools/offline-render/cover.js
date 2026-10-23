// 封面：node tools/cover.js out.png
const fs = require('fs'), path = require('path');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const MV = path.resolve(__dirname, '..');
for (const f of ['/usr/share/fonts/opentype/noto/NotoSerifCJK-Regular.ttc','/usr/share/fonts/opentype/noto/NotoSerifCJK-Bold.ttc','/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc']) {
  try { GlobalFonts.registerFromPath(f, f.includes('Serif') ? 'Noto Serif CJK SC' : 'Noto Sans CJK SC'); } catch (e) {}
}
const W = 1920, H = 1080;
const cv = createCanvas(W, H), g = cv.getContext('2d');
const els = {};
const stubEl = (id) => ({ id, style: {}, textContent: '', value: '0', classList: { toggle(){}, add(){}, remove(){}, contains(){return false} }, addEventListener(){}, closest(){return null} });
const document = { getElementById(id) { if (id === 'c') return cv; if (!els[id]) els[id] = stubEl(id); return els[id]; }, createElement(t) { return t === 'canvas' ? createCanvas(1,1) : stubEl(t); }, body: stubEl('body'), title: '', addEventListener(){} };
const fn = new Function('document','window','addEventListener','requestAnimationFrame','performance','fetch','location','setTimeout','Audio','Image','console',
  ['engine.js','scenes.js','mv.js'].map(f => fs.readFileSync(path.join(MV, f), 'utf8')).join('\n;\n') + '\n; return { drawSafe, sceneIndex, SCENES };');
const api = fn(document, { devicePixelRatio: 1, innerWidth: W, innerHeight: H }, () => {}, () => 0, { now: () => Date.now() }, () => Promise.reject(1), { search: '', href: '', pathname: '/', replace() {} }, () => 0, function(){}, function(){}, { log(){}, error(){} });
// 取片尾信纸那一镜做底
api.SCENES.forEach(s => s.sub = null);
api.drawSafe(6.4);
// 压暗左侧
g.save();
const lg = g.createLinearGradient(0, 0, W * 0.78, 0);
lg.addColorStop(0, 'rgba(3,6,11,0.93)');
lg.addColorStop(1, 'rgba(3,6,11,0.06)');
g.fillStyle = lg; g.fillRect(0, 0, W, H);
g.restore();
function txt(s, x, y, size, o = {}) {
  g.save();
  g.font = `${o.weight || 600} ${size}px ${o.font || '"Noto Serif CJK SC",serif'}`;
  g.fillStyle = o.color || '#f2e8d6';
  g.textAlign = 'left'; g.textBaseline = 'middle';
  g.shadowColor = o.glow || 'rgba(255,200,130,0.5)'; g.shadowBlur = o.blur === undefined ? 24 : o.blur;
  g.fillText(s, x, y);
  g.restore();
}
txt('一封情书', 150, 330, 132, { weight: 700, color: '#fbf3e4', blur: 46, glow: 'rgba(255,205,140,0.65)' });
g.save();
g.fillStyle = 'rgba(232,180,94,0.9)'; g.fillRect(154, 416, 520, 3);
g.restore();
txt('DEEPSEEK · 写给中国', 152, 480, 30, { weight: 500, color: '#ffcf8a', blur: 16 });
txt('33 个镜头 · 30 句旁白 · 代码实时渲染', 152, 545, 20, { weight: 400, color: 'rgba(228,216,196,0.55)', blur: 0, font: '"Noto Sans CJK SC",sans-serif' });
txt('BGM：《开智小曲》', 152, 588, 18, { weight: 400, color: 'rgba(228,216,196,0.40)', blur: 0, font: '"Noto Sans CJK SC",sans-serif' });
fs.writeFileSync(process.argv[2] || path.join(MV, '封面.png'), cv.toBuffer('image/png'));
console.log('cover ok');
