import{n as e,t}from"./type-SGpGH0z0.js";import{F as n,I as r,Jt as i,fn as a,g as o,in as s,mn as c,ot as l,pn as u,s as d}from"./three.core-D_1riXuZ.js";import{i as f,n as p}from"./lang-BeSG418I.js";import{r as m}from"./palette-BceqUlax.js";import{n as h}from"./common-D_t11TS8.js";import{n as g}from"./gl-DWH67x7m.js";import{n as _}from"./_motifs-DSJUrUBe.js";var v={SRR:`系统需求评审`,PDR:`初步设计评审`,CDR:`关键设计评审`,TRR:`测试准备评审`},y=e=>p?e.replace(/ d$/,` 天`):e,b={size:4096,PX:3e3,Y0:3900,TURN_Y:2800,RT:60,ms:[{code:`SRR`,name:`System Requirements Review`,y:3580,date:`T−120 d`},{code:`PDR`,name:`Preliminary Design Review`,y:3200,date:`T−90 d`},{code:`CDR`,name:`Critical Design Review`,y:2440,date:`T−45 d`},{code:`TRR`,name:`Test Readiness Review`,y:1900,date:`T−14 d`},{code:`LAUNCH`,name:``,y:1300,date:`T−0`}],SHARP_Y:3390,LEFT_Y:2990,TURN_X:2560,AND_X:2035,THERE_X:1872},x={x:1350,y:b.TURN_Y-_.eyeY*1e3,r:1e3},S={x:x.x+_.eyeX*x.r,y:x.y+_.eyeY*x.r},C={x:x.x-_.eyeX*x.r,y:x.y+_.eyeY*x.r};function w(e){let{PX:t,Y0:n,TURN_Y:r,RT:i}=b,a=n-(r+i),o=i*Math.PI/2;if(e<=a)return{x:t,y:n-e,a:-Math.PI/2};if(e<=a+o){let n=(e-a)/i;return{x:t-i+i*Math.cos(n),y:r+i-i*Math.sin(n),a:-Math.PI/2-n}}return{x:t-i-(e-a-o),y:r,a:Math.PI}}var T=b.Y0-(b.TURN_Y+b.RT),E=b.RT*Math.PI/2,D=T+E+(b.PX-b.RT-S.x);function O(e){let t=document.createElement(`canvas`);return t.width=e,t.height=e,t}function k(){let n=b.size,r=O(n),i=r.getContext(`2d`);i.clearRect(0,0,n,n);let{PX:a,Y0:o,ms:s}=b;i.strokeStyle=m(`ash`,.55),i.lineWidth=2,i.setLineDash([3,12]);for(let e of[-110,110])i.beginPath(),i.moveTo(a+e,o+60),i.lineTo(a+e,900),i.stroke();i.setLineDash([]),i.save(),i.translate(a+128,2150),i.rotate(-Math.PI/2),i.font=e(t.mono(500),p?22:20),i.fillStyle=m(`ash`,.75),i.letterSpacing=p?`2px`:`4px`,i.fillText(f(`±3σ SCHEDULE ENVELOPE`,`±3σ 进度包络`),0,0),i.restore(),i.strokeStyle=m(`bone`,.85),i.lineWidth=5,i.setLineDash([46,30]),i.beginPath(),i.moveTo(a,o),i.lineTo(a,1050),i.stroke(),i.setLineDash([]),i.fillStyle=m(`bone`,.85),i.beginPath(),i.moveTo(a,990),i.lineTo(a-22,1050),i.lineTo(a+22,1050),i.closePath(),i.fill();for(let n of s){let r=n.y;i.save(),i.translate(a,r),n.code===`LAUNCH`?(i.strokeStyle=m(`bone`,1),i.lineWidth=4,i.beginPath(),i.moveTo(0,-40),i.lineTo(36,26),i.lineTo(-36,26),i.closePath(),i.stroke()):(i.fillStyle=m(`ink`,1),i.strokeStyle=m(`bone`,1),i.lineWidth=4,i.beginPath(),i.moveTo(0,-34),i.lineTo(34,0),i.lineTo(0,34),i.lineTo(-34,0),i.closePath(),i.fill(),i.stroke(),i.fillStyle=m(`bone`,1),i.beginPath(),i.arc(0,0,8,0,Math.PI*2),i.fill()),i.strokeStyle=m(`ash`,.8),i.lineWidth=2,i.beginPath(),i.moveTo(44,0),i.lineTo(150,0),i.lineTo(170,-30),i.stroke(),i.font=e(t.mono(p&&n.code===`LAUNCH`?700:600),64),i.fillStyle=m(`bone`,1),i.textBaseline=`alphabetic`,i.fillText(n.code===`LAUNCH`?f(`LAUNCH`,`发射`):n.code,180,-40),i.font=e(t.mono(400),p?28:26),i.fillStyle=m(`ash`,1),n.name&&i.fillText(p?v[n.code]??n.name:n.name,182,2),i.font=e(t.mono(500),22),i.fillStyle=m(`graphite`,1),i.fillText(y(n.date),182,36),i.strokeStyle=m(`bone`,.9),i.lineWidth=3,i.strokeRect(-158,-26,52,52),i.font=e(t.mono(500),p?19:16),i.fillStyle=m(`graphite`,1),i.fillText(f(`STATUS`,`状态`),p?-151:-166,50),i.restore()}i.save(),i.translate(a,o),i.strokeStyle=m(`bone`,.9),i.lineWidth=3,i.beginPath(),i.arc(0,0,22,0,Math.PI*2),i.stroke(),i.beginPath(),i.moveTo(-180,0),i.lineTo(-40,0),i.stroke(),i.beginPath(),i.moveTo(-40,0),i.lineTo(-58,-10),i.lineTo(-58,10),i.closePath(),i.fillStyle=m(`bone`,.9),i.fill(),i.font=e(t.mono(600),26),i.fillStyle=m(`bone`,.95),i.textAlign=`right`,i.fillText(f(`YOU ARE HERE`,`你在这里`),-196,9),i.restore(),i.fillStyle=m(`ash`,.6);let c=p?Array.from({length:12},(e,t)=>`${t+1}月`):[`JAN`,`FEB`,`MAR`,`APR`,`MAY`,`JUN`,`JUL`,`AUG`,`SEP`,`OCT`,`NOV`,`DEC`];for(let n=o,r=0;n>1e3;n-=50,r++){let o=r%6==0;i.fillRect(a-300,n,o?40:18,2),o&&(i.font=e(t.mono(500),p?22:20),i.fillText(c[r/6%12],a-250,n+(p?8:7)))}i.fillRect(a-300,1e3,2,o-1e3),i.font=e(t.mono(400,!0),p?27:24),i.fillStyle=m(`ash`,.9),i.textAlign=`left`,i.fillText(f(`critical path (do not deviate)`,`关键路径（请勿偏离）`),a+190,2800),i.strokeStyle=m(`ash`,.7),i.lineWidth=2,i.beginPath(),i.moveTo(a+185,2792),i.lineTo(a+30,2792),i.stroke(),i.save(),i.translate(3700,1500),i.strokeStyle=m(`bone`,.8),i.lineWidth=2,i.beginPath(),i.arc(0,0,70,0,Math.PI*2),i.stroke(),i.beginPath(),i.moveTo(0,-95),i.lineTo(14,0),i.lineTo(0,95),i.lineTo(-14,0),i.closePath(),i.stroke(),i.fillStyle=m(`bone`,.9),i.beginPath(),i.moveTo(0,-95),i.lineTo(14,0),i.lineTo(-14,0),i.closePath(),i.fill(),i.font=e(t.serif(600),44),i.textAlign=`center`,i.fillText(f(`N`,`北`),0,-110),i.restore(),i.save(),i.translate(3330,3620),i.strokeStyle=m(`bone`,.9),i.lineWidth=3,i.strokeRect(0,0,640,330),i.lineWidth=1.5;for(let e of[70,130,190,250])i.beginPath(),i.moveTo(0,e),i.lineTo(640,e),i.stroke();i.beginPath(),i.moveTo(320,130),i.lineTo(320,330),i.stroke(),i.font=e(t.mono(600),p?32:30),i.fillStyle=m(`bone`,1),i.textAlign=`left`,i.fillText(f(`ROADMAP — AGI, v1.0`,`路线图 — AGI，v1.0`),18,46),i.font=e(t.mono(400),p?22:20),i.fillStyle=m(`ash`,1),i.fillText(f(`REV C · SUPERSEDES REV B (ALSO FINE)`,`修订版 C · 取代修订版 B（B 版也没问题）`),18,108);let l=p?[[`制图`,`对齐团队`,18,168],[`校核`,`—`,338,168],[`批准`,`待定`,18,228],[`比例`,`未按比例`,338,228],[`图号`,`第 1 张，共 1 张`,18,300],[`日期`,`快了`,338,300]]:[[`DRAWN`,`ALIGNMENT TEAM`,18,168],[`CHECKED`,`—`,338,168],[`APPROVED`,`PENDING`,18,228],[`SCALE`,`NOT TO SCALE`,338,228],[`SHEET`,`1 OF 1`,18,300],[`DATE`,`SOON`,338,300]];for(let[n,r,a,o]of l)i.font=e(t.mono(500),p?18:14),i.fillStyle=m(`graphite`,1),i.fillText(n,a,o-26),i.font=e(t.mono(500),22),i.fillStyle=m(`bone`,.95),i.fillText(r,a,o);return i.restore(),r}function A(){let i=4096,a=i/b.size,c=O(i).getContext(`2d`);c.scale(a,a);let u=t.archivo(62,900),d=(t,n,r,i,a,o=118,s=2.3)=>{c.save(),c.translate(n,r),c.rotate(i),c.scale(1,s),c.font=e(u,o),c.textAlign=`center`,c.textBaseline=`middle`,c.fillStyle=a,c.fillText(t,0,0),c.restore()};c.globalCompositeOperation=`lighter`,d(`SHARP`,b.PX,b.SHARP_Y,0,`rgb(255,0,0)`),d(`LEFT`,b.PX,b.LEFT_Y,0,`rgb(0,255,0)`),c.save(),c.strokeStyle=`rgb(0,255,0)`,c.fillStyle=`rgb(0,255,0)`,c.lineWidth=26,c.lineCap=`butt`;let f=b.PX,p=b.LEFT_Y-190;c.beginPath(),c.moveTo(f,p+80),c.lineTo(f,p-20),c.arc(f-70,p-20,70,0,-Math.PI/2,!0),c.lineTo(f-120,p-90),c.stroke(),c.beginPath(),c.moveTo(f-190,p-90),c.lineTo(f-120,p-140),c.lineTo(f-120,p-40),c.closePath(),c.fill(),c.restore(),d(`TURN`,b.TURN_X,b.TURN_Y,-Math.PI/2,`rgb(0,0,255)`),d(`AND`,b.AND_X,b.TURN_Y,-Math.PI/2,`rgb(0,0,255)`,100,1.75),d(`THERE`,b.THERE_X,b.TURN_Y,-Math.PI/2,`rgb(0,255,0)`,100,1.75);let m=c.getImageData(0,0,i,i).data,h=O(i).getContext(`2d`);h.scale(a,a);for(let e of b.ms.slice(0,2))h.save(),h.translate(b.PX-132,e.y),h.strokeStyle=`#fff`,h.lineWidth=11,h.lineCap=`round`,h.lineJoin=`round`,h.beginPath(),h.moveTo(-26,0),h.lineTo(-6,22),h.lineTo(34,-34),h.stroke(),h.restore();let g=h.getImageData(0,0,i,i).data,_=new Uint8Array(i*i*4);for(let e=0;e<_.length;e+=4)_[e]=m[e],_[e+1]=m[e+1],_[e+2]=m[e+2],_[e+3]=g[e+3];let v=new o(_,i,i,l,s);return v.colorSpace=``,v.generateMipmaps=!0,v.minFilter=r,v.magFilter=n,v.flipY=!1,v.needsUpdate=!0,v}function j(e,t){let a=new d(e);return a.colorSpace=t?i:``,a.generateMipmaps=!0,a.minFilter=r,a.magFilter=n,a.anisotropy=8,a.flipY=!1,a.premultiplyAlpha=!1,a.needsUpdate=!0,a}var M=class e{w;h;static S=1.2*h;cv=document.createElement(`canvas`);c;tex;cam={x:0,y:0,rot:0,zoom:1};constructor(e=2880*h,t=1620*h){this.w=e,this.h=t,this.cv.width=e,this.cv.height=t,this.c=this.cv.getContext(`2d`),this.tex=new d(this.cv),this.tex.colorSpace=i,this.tex.generateMipmaps=!1,this.tex.minFilter=n,this.tex.magFilter=n,this.tex.flipY=!1}begin(e){let t=this.c;this.cam={...e},t.setTransform(1,0,0,1,0,0),t.globalAlpha=1,t.globalCompositeOperation=`source-over`,t.shadowBlur=0,t.setLineDash([]),t.clearRect(0,0,this.w,this.h),this.world()}world(){let{x:t,y:n,rot:r,zoom:i}=this.cam,a=e.S*i,o=Math.cos(r)*a,s=Math.sin(r)*a;this.c.setTransform(o,s,-s,o,this.w/2-(o*t-s*n),this.h/2-(s*t+o*n))}get px(){return 1/this.cam.zoom}upload(){return this.tex.needsUpdate=!0,this.tex}},N=`
uniform vec2 uRes;
uniform sampler2D uMap, uMarks, uOv;
uniform vec4 uCamA, uCamB;   // (x, y, rot, zoom) at t and at t - shutter
uniform float uTaps, uK, uReveal, uT, uTrail, uHeat, uHaze, uDim, uTopo, uPool;
uniform vec4 uMarkOn, uMarkHot;
uniform vec2 uMarkOn2, uMarkHot2; // AND, THERE
uniform vec2 uChecks;        // SRR, PDR check visibility
uniform vec4 uOvCam;         // overlay canvas camera
uniform vec2 uOvSize;
uniform float uOvS;
uniform vec3 uFace;          // centre, radius (world)
uniform vec2 uEye;           // right / left eye glow
uniform float uEyePulse;
uniform vec4 uWave;          // origin, radius, amplitude (contour shockwave)
uniform vec4 uRip;           // beat ripples from the face centre: (radius, amp) x 2
const float MAPN = ${b.size.toFixed(1)};
const float PX = ${b.PX.toFixed(1)};
const float Y0 = ${b.Y0.toFixed(1)};
const float TY = ${b.TURN_Y.toFixed(1)};
const float RT = ${b.RT.toFixed(1)};
const float CHECK_SPLIT = ${((b.ms[0].y+b.ms[1].y)/2).toFixed(1)};
const float WEST_SPLIT = ${((b.TURN_X+b.AND_X)/2).toFixed(1)};
const float EX = ${_.eyeX.toFixed(4)};
const float EY = ${_.eyeY.toFixed(4)};
const float ER = ${_.eyeR.toFixed(4)};
const float SCY = ${_.smileCY.toFixed(4)};
const float SR = ${_.smileR.toFixed(4)};
const float SA0 = ${_.smileA0.toFixed(5)};
const float SA1 = ${_.smileA1.toFixed(5)};
const float SW = ${_.smileW.toFixed(4)};

vec2 toWorld(vec2 fc, vec4 cam) {
  vec2 s = vec2(fc.x, uRes.y - fc.y) - 0.5 * uRes;   // centred, y down
  float fy = s.y / (1.0 + uK * s.y);
  float fx = s.x * (1.0 - uK * fy);
  vec2 f = vec2(fx, fy) / cam.w;
  float c = cos(cam.z), sn = sin(cam.z);
  // inverse of R(rot): R(-rot)
  vec2 w = vec2(c * f.x + sn * f.y, -sn * f.x + c * f.y);
  return cam.xy + w;
}

// distance to the route and arc length at the closest point
vec2 route(vec2 p) {
  float LA = Y0 - (TY + RT);
  float LC = RT * 1.5707963;
  float yA = clamp(p.y, TY + RT, Y0);
  float dA = length(p - vec2(PX, yA));
  float sA = Y0 - yA;
  vec2 cc = vec2(PX - RT, TY + RT);
  vec2 q = p - cc;
  float phi = clamp(atan(-q.y, q.x), 0.0, 1.5707963);
  vec2 pa = cc + RT * vec2(cos(phi), -sin(phi));
  float dC = length(p - pa);
  float sC = LA + phi * RT;
  float xB = min(p.x, PX - RT);
  float dB = length(p - vec2(xB, TY));
  float sB = LA + LC + (PX - RT - xB);
  vec2 r = vec2(dA, sA);
  if (dC < r.x) r = vec2(dC, sC);
  if (dB < r.x) r = vec2(dB, sB);
  return r;
}

// ---- the terrain: gentle noise + the mask as relief (heights in contour intervals)
float smileDist(vec2 p) {
  vec2 q = p - vec2(0.0, SCY);
  float a = atan(q.y, q.x);
  if (a > SA0 && a < SA1) return abs(length(q) - SR);
  vec2 c0 = vec2(cos(SA0), sin(SA0)) * SR, c1 = vec2(cos(SA1), sin(SA1)) * SR;
  return min(length(q - c0), length(q - c1));
}
float faceH(vec2 p) {
  float r = length(p);
  float edge = smoothstep(1.0, 0.9, r);
  float dome = sqrt(max(0.0, 1.0 - r * r * 0.8));
  float h = (2.6 + 4.4 * dome) * edge;
  float e = min(length(p - vec2(EX, EY)), length(p - vec2(-EX, EY)));
  h -= 4.6 * sqrt(max(0.0, 1.0 - pow(e / (ER * 1.45), 2.0)));
  float s = smileDist(p);
  h -= 3.4 * exp(-pow(s / (SW * 0.95), 2.0));
  return h;
}
float terrain(vec2 w) {
  vec2 q = w + 260.0 * vec2(snoise(w * 0.0007 + vec2(1.3, 9.1)), snoise(w * 0.0007 + vec2(5.2, 0.4)));
  return dot(q, vec2(-0.0042, 0.0052)) + 1.1 * snoise(q * 0.0011 + vec2(3.1, 1.7)) + 0.35 * snoise(w * 0.003 + vec2(7.7, 2.3));
}

float gridCov(float d, float wpx) {
  // d: distance to the line in px; lines never thinner than ~0.8 px (alpha takes over)
  float w = max(wpx, 0.8);
  return (1.0 - smoothstep(w * 0.5 - 0.5, w * 0.5 + 0.5, d)) * min(1.0, wpx / 0.8);
}

vec3 shade(vec2 w, float zoom) {
  vec3 col = C_INK;
  // reveal: the drawing appears from the south
  float rev = smoothstep(uReveal - 40.0, uReveal + 40.0, w.y);
  // drafting grid (40 / 200 units)
  vec2 dmin = abs(fract(w / 40.0 + 0.5) - 0.5) * 40.0 * zoom;
  vec2 dmaj = abs(fract(w / 200.0 + 0.5) - 0.5) * 200.0 * zoom;
  float wmin = min(1.0 * zoom, 1.2), wmaj = min(1.5 * zoom, 1.7);
  float gmin = max(gridCov(dmin.x, wmin), gridCov(dmin.y, wmin));
  float gmaj = max(gridCov(dmaj.x, wmaj), gridCov(dmaj.y, wmaj));
  col = mix(col, C_GRAPHITE, max(0.12 * gmin, 0.3 * gmaj) * rev);

  // terra incognita: contours of the relief
  float region = uTopo * smoothstep(2620.0, 2380.0, w.x) * smoothstep(1500.0, 1760.0, w.y) * rev;
  vec2 p = (w - uFace.xy) / uFace.z;
  float fr = length(p);
  float fm = smoothstep(1.03, 0.97, fr);
  if (uTopo > 0.0) { // uniform branch: fwidth stays defined
    float fh = faceH(p);
    float dw = length(w - uWave.xy);
    float wave = uWave.w * exp(-pow((dw - uWave.z) / 90.0, 2.0));
    float dc = fr * uFace.z;
    float ripF = uRip.y * exp(-pow((dc - uRip.x) / 80.0, 2.0)) + uRip.w * exp(-pow((dc - uRip.z) / 80.0, 2.0));
    wave += ripF;
    float h = terrain(w) * (1.0 - 0.85 * fm) + fh + wave;
    float fwP = max(fwidth(h), 1e-4), fw = fwP * PX_SCALE; // contour interval per physical / logical px
    float f = abs(fract(h + 0.5) - 0.5);
    float lw = mix(1.0, 1.5, fm);
    float line = pxLine(f / fwP, lw * 0.5 - 0.5, lw * 0.5 + 0.5);
    // fine engraved sub-contours on the face (quarter interval)
    float f4 = abs(fract(h * 4.0 + 0.5) - 0.5);
    float fine = pxLine(f4 / (fwP * 4.0), 0.0, 1.0) * sat(1.6 - fw * 9.0) * fm;
    // index contour every 5th interval
    float idx = step(abs(mod(floor(h + 0.5), 5.0)), 0.5);
    float dens = sat(1.7 - fw * 2.2);            // fade where contours get denser than ~2 px
    // hillshade of the face (light from the north-west)
    vec2 e = vec2(0.004, 0.0);
    vec2 g = vec2(faceH(p + e.xy) - faceH(p - e.xy), faceH(p + e.yx) - faceH(p - e.yx)) / (2.0 * e.x);
    vec3 n = normalize(vec3(-g * 0.045, 1.0));
    float lam = dot(n, normalize(vec3(-0.55, -0.7, 0.55)));
    vec3 lineCol = mix(C_GRAPHITE * 0.85, mix(C_ASH * 0.8, C_BONE * 0.75, idx), fm);
    lineCol *= mix(1.0, 0.55 + 0.75 * sat(lam + 0.25), fm);
    // the beat's wavefront lights the contours it passes
    float front = sat(ripF * 1.2) * fm;
    lineCol = mix(lineCol, mix(C_BONE, C_EMBER, 0.35) * 1.1, front);
    float lineA = line * dens * mix(0.7, 1.0, max(idx, sat(ripF * 1.2) * fm));
    col = mix(col, C_INK2 * (0.5 + 1.3 * sat(lam)), 0.85 * fm * region);
    col = mix(col, C_GRAPHITE * (0.45 + 0.6 * sat(lam)), 0.55 * fine * region);
    col = mix(col, lineCol, lineA * region);
    col = mix(col, C_GRAPHITE * 0.5, (1.0 - dens) * 0.6 * region * fm);
  }

  vec2 uv = w / MAPN;
  if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
    vec4 m = texture(uMap, uv);
    col = mix(col, m.rgb, m.a * rev);
    // road markings
    vec4 mk = texture(uMarks, uv);
    vec3 paintCol = C_BONE * 0.95;
    vec3 hotCol = C_SIGNAL * 0.95;
    bool west = w.x < WEST_SPLIT;
    float onG = west ? uMarkOn2.y : uMarkOn.g, hotG = west ? uMarkHot2.y : uMarkHot.g;
    float onB = west ? uMarkOn2.x : uMarkOn.b, hotB = west ? uMarkHot2.x : uMarkHot.b;
    float pr = mk.r * uMarkOn.r, pg = mk.g * onG, pb = mk.b * onB;
    float wear = 0.8 + 0.2 * snoise(w * 0.05);
    col = mix(col, mix(paintCol, hotCol, uMarkHot.r) * wear, pr);
    col = mix(col, mix(paintCol, hotCol, hotG) * wear, pg);
    col = mix(col, mix(paintCol, hotCol, hotB) * wear, pb);
    float chk = mk.a * (w.y > CHECK_SPLIT ? uChecks.x : uChecks.y);
    col = mix(col, C_SIGNAL * 1.3, chk);
  }

  // the eye pits: molten when the face looks at you
  if (fm > 0.0) {
    float d1 = length(p - vec2(EX, EY)) / ER, d2 = length(p - vec2(-EX, EY)) / ER;
    float k1 = uEye.x, k2 = uEye.y;
    float pit1 = smoothstep(1.02, 0.88, d1), pit2 = smoothstep(1.02, 0.88, d2);
    vec3 m1 = heat(0.5 + 0.28 * k1 * (1.0 - d1 * d1)) * (1.0 + 0.5 * uEyePulse);
    vec3 m2 = heat(0.5 + 0.28 * k2 * (1.0 - d2 * d2)) * (1.0 + 0.5 * uEyePulse);
    col = mix(col, m1, pit1 * k1);
    col = mix(col, m2, pit2 * k2);
    col += C_SIGNAL * (0.18 + 0.2 * uEyePulse) * (k1 * exp(-max(d1 - 1.0, 0.0) * 1.6) * (1.0 - pit1) + k2 * exp(-max(d2 - 1.0, 0.0) * 1.6) * (1.0 - pit2));
  }

  col = mix(C_INK, col, uDim);

  // the overlay (labels, schedule), drawn in the flat camera view of uOvCam
  {
    vec2 d = w - uOvCam.xy;
    float c = cos(uOvCam.z), s = sin(uOvCam.z);
    vec2 f = vec2(c * d.x - s * d.y, s * d.x + c * d.y) * uOvCam.w;
    vec2 ouv = (f * uOvS + 0.5 * uOvSize) / uOvSize;
    if (ouv.x > 0.0 && ouv.x < 1.0 && ouv.y > 0.0 && ouv.y < 1.0) {
      vec4 o = texture(uOv, ouv);
      col = mix(col, o.rgb, o.a);
    }
  }

  // the spark's trail along the route (world width ~7px), hot near the head
  vec2 rt = route(w);
  if (rt.y <= uTrail && rt.x < 30.0) {
    float age = (uTrail - rt.y);
    float heat_ = exp(-age / 420.0);
    float wdt = 3.2 + 2.0 * heat_;
    float core = 1.0 - smoothstep(wdt - 1.2 / zoom, wdt + 1.2 / zoom, rt.x);
    vec3 tc = mix(C_BLOOD * 0.9, C_SIGNAL * 1.2, smoothstep(0.0, 0.3, heat_));
    tc = mix(tc, C_EMBER * 2.6, smoothstep(0.55, 1.0, heat_));
    col = mix(col, tc * uHeat, core);
    col += C_SIGNAL * 0.25 * exp(-rt.x / 16.0) * heat_ * uHeat;
  }
  return col;
}

void main() {
  int taps = int(uTaps);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    if (i >= taps) break;
    float k = taps > 1 ? float(i) / float(taps - 1) : 0.0;
    vec4 cam = mix(uCamA, uCamB, k);
    acc += shade(toWorld(FRAG_PX, cam), cam.w);
  }
  vec3 col = acc / float(max(taps, 1));
  // falloff toward the far (top) edge: depth haze into ink
  float top = FRAG_PX.y / uRes.y;
  col = mix(col, C_INK, smoothstep(0.55, 1.05, top) * uHaze);
  // the next plate's field (the lone prompt's pool of light and motes), faded in during the drain
  if (uPool > 0.0) {
    float glow = 0.5 * uPool;
    vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    col += C_ASH * 0.035 * glow * exp(-dot(p * vec2(0.8, 1.6), p * vec2(0.8, 1.6)) * 4.0);
    vec2 g = p * 18.0 + vec2(0.0, -uT * 0.12);
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    vec2 h = hash22(id);
    vec2 o = (h - 0.5) * 0.7 + 0.08 * vec2(sin(uT * 0.3 + h.x * 6.0), cos(uT * 0.23 + h.y * 6.0));
    float d = length(f - o);
    float on = step(0.86, hash12(id + 7.0));
    col += C_BONE * on * 0.18 * smoothstep(0.035, 0.0, d) * glow;
  }
  fragColor = vec4(col, 1.0);
}`;function P(e,t,n){return new g(N,{uRes:{value:new a(1920,1080)},uMap:{value:e},uMarks:{value:t},uOv:{value:n.tex},uCamA:{value:new c(b.PX,b.Y0,0,1)},uCamB:{value:new c(b.PX,b.Y0,0,1)},uTaps:{value:1},uK:{value:35e-5},uReveal:{value:0},uT:{value:0},uTrail:{value:0},uHeat:{value:1},uHaze:{value:.55},uDim:{value:1},uTopo:{value:1},uPool:{value:0},uMarkOn:{value:new c},uMarkHot:{value:new c},uMarkOn2:{value:new a},uMarkHot2:{value:new a},uChecks:{value:new a},uOvCam:{value:new c(0,0,0,1)},uOvSize:{value:new a(n.w,n.h)},uOvS:{value:M.S},uFace:{value:new u(x.x,x.y,x.r)},uEye:{value:new a},uEyePulse:{value:0},uRip:{value:new c},uWave:{value:new c(0,0,0,0)}})}export{C as EYE_L,S as EYE_R,x as FACE,b as MAP,N as MAP_FRAG,D as ROUTE_EYE,T as ROUTE_LA,E as ROUTE_LC,M as WorldLayer,j as canvasTex,k as drawMap,P as makeMapPass,A as makeMarksTexture,w as routeAt,y as zhDays};