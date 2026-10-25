// v2 post pass (WebGL2), applied to the finished frame before the subtitles: zoom blur (crash zooms), shockwave
// refraction (impacts), chromatic aberration, a colour grade (the lighthouses tint the night), flash. Pure function of params.
import { W, H, SS } from '../lib.js';

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex;
uniform float aspect, chroma, zoomAmt, shockAmp, shockR, shockW, gradeAmt, flash, sat;
uniform vec2 zoomC, shockC;
uniform vec3 grade;
vec3 S(vec2 q){ return texture(tex, clamp(q, vec2(0.0005), vec2(0.9995))).rgb; }
void main(){
  vec2 q = uv;
  if (shockAmp > 0.0) {                       // a ring that refracts the picture as it passes
    vec2 d = (q - shockC) * vec2(aspect, 1.0); float r = length(d);
    float k = (r - shockR) / shockW; float f = exp(-k * k) * shockAmp;
    q -= (d / max(r, 1e-4)) * f / vec2(aspect, 1.0);
  }
  vec3 c = vec3(0.0);
  if (zoomAmt > 0.0) {                        // radial blur towards zoomC
    for (int i = 0; i < 24; i++) { float s = 1.0 - zoomAmt * float(i) / 23.0; c += S(zoomC + (q - zoomC) * s); }
    c /= 24.0;
  } else c = S(q);
  if (chroma > 0.0) {
    vec2 dir = (q - 0.5) * chroma;
    c.r = mix(c.r, S(q + dir).r, 0.85); c.b = mix(c.b, S(q - dir).b, 0.85);
  }
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, sat);
  c = mix(c, c * grade * 1.6 + grade * 0.08, gradeAmt);   // multiply-ish grade plus a lift in the light's colour
  c = mix(c, vec3(1.0), flash);
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
let gl = null, cv = null, prog, U = {}, tex;
function init() {
  cv = document.createElement('canvas'); cv.width = W * SS; cv.height = H * SS;
  gl = cv.getContext('webgl2', { premultipliedAlpha: false, preserveDrawingBuffer: true });
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['tex', 'aspect', 'chroma', 'zoomAmt', 'zoomC', 'shockAmp', 'shockR', 'shockW', 'shockC', 'grade', 'gradeAmt', 'flash', 'sat']) U[n] = gl.getUniformLocation(prog, n);
  tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
}
const NONE = { chroma: 0, zoom: 0, shock: 0, gradeAmt: 0, flash: 0, sat: 1 };
export const isIdle = p => !p || (!(p.chroma > 0) && !(p.zoom > 0) && !(p.shock > 0) && !(p.gradeAmt > 0) && !(p.flash > 0) && (p.sat ?? 1) === 1);
// src: a canvas (W*SS x H*SS). p: {chroma, zoom, zx, zy, shock, sx, sy, sr, sw, grade:[r,g,b], gradeAmt, flash, sat}; positions in 0..1 (y down)
export function post(src, p = NONE) {
  if (!gl) init();
  gl.viewport(0, 0, cv.width, cv.height);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  gl.uniform1i(U.tex, 0);
  gl.uniform1f(U.aspect, W / H);
  gl.uniform1f(U.chroma, p.chroma ?? 0);
  gl.uniform1f(U.zoomAmt, Math.min(0.6, p.zoom ?? 0)); gl.uniform2f(U.zoomC, p.zx ?? 0.5, 1 - (p.zy ?? 0.5));
  gl.uniform1f(U.shockAmp, p.shock ?? 0); gl.uniform1f(U.shockR, p.sr ?? 0.3); gl.uniform1f(U.shockW, p.sw ?? 0.06); gl.uniform2f(U.shockC, p.sx ?? 0.5, 1 - (p.sy ?? 0.5));
  const g = p.grade ?? [1, 1, 1]; gl.uniform3f(U.grade, g[0], g[1], g[2]); gl.uniform1f(U.gradeAmt, p.gradeAmt ?? 0);
  gl.uniform1f(U.flash, p.flash ?? 0); gl.uniform1f(U.sat, p.sat ?? 1);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return cv;
}
