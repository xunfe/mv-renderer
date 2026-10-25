// WebGL sprite warp: secondary motion (hair, skirt, wings, tails sway around a rigid head-to-feet capsule) and blinking.
// A pure function of the uniforms, so frames stay deterministic. Output is drawn back into the 2D canvas.
const PAD = 0.14;                 // transparent margin around the sprite so swaying parts are not clipped
let SIZE = 1700;                  // square GL canvas; every sprite + margin fits (doubled for the 2x sprites of the 4K render)
let gl, prog, U = {}, cv;
const TEX = new Map();

const VS = `#version 300 es
in vec2 p; out vec2 uv;
void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const FS = `#version 300 es
precision highp float;
in vec2 uv; out vec4 o;
uniform sampler2D tex, eyeMask;
uniform vec2 texSize;
uniform float pad;
uniform vec2 head, feet;
uniform float R, fall, time, amp, flutter, lw, blink, smile, hasMask, aa;
uniform vec2 wind;
uniform vec4 eyeL, eyeR;          // centre x, y and half width, half height of the eye fill (sprite px)
uniform vec3 skin, ink;
float sdSeg(vec2 q, vec2 a, vec2 b){ vec2 pa = q - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// Eyelids. The cover is the sprite's own eye mask (fill + outline, pixel exact), so nothing of the open eye is left
// behind; the lid is one clean stroke with round ends, as thick as the drawn outline.
vec4 lid(vec4 c, vec2 s, vec4 e, vec2 mk, float dir){   // mk.x: area to repaint, mk.y: the eye itself; dir: -1 left eye, +1 right
  if (e.z <= 0.0 || blink <= 0.002) return c;
  vec2 p = s - e.xy;
  if (abs(p.x) > e.z * 2.2 + lw * 4.0 || abs(p.y) > e.w + lw * 4.0) return c;
  float b = blink * blink * (3.0 - 2.0 * blink);
  float shut = smoothstep(0.72, 1.0, blink), on = smoothstep(0.0, 0.06, blink);
  // Open, the lid lies exactly on the eye's upper outline (same height, same curvature). As it comes down it is
  // trimmed by the eye's own silhouette, so it cannot stick out. Fully shut it is the bow of the drawn sleeping pose
  // (measured on that drawing): wider than the eye, shallow, a little heavier, sitting low and slightly outwards.
  float A = e.z + lw * 0.5, B = e.w + lw * 0.5, aOpen = e.z + lw * 1.2;
  float a = mix(aOpen, 1.36 * (e.z + lw), shut);
  float tw = lw * mix(1.0, 1.3, shut);
  float px = p.x - dir * 0.3 * e.z * shut;
  float yc = mix(-B, e.w * mix(0.71, -0.10, smile), b);
  float sag = mix(-0.5 * B * aOpen * aOpen / (A * A), e.w * mix(0.35, -0.38, smile), b);
  float xn = clamp(px, -a, a) / a;
  float yl = yc - sag * xn * xn;
  // everything above the lid is skin
  vec3 rgb = mix(c.rgb, skin, (1.0 - smoothstep(-aa, aa, p.y - yl)) * on * mk.x);
  // In the last part of the motion the lower half of the eye is squashed up into the lid (the lower lid rising):
  // each pixel below the lid shows the eye from further down, until nothing of it is left. No fade, no cut edge.
  if (shut > 0.0 && p.y > yl) {
    vec2 t2 = vec2(s.x, e.y + yl + (p.y - yl) / max(1.0 - shut, 0.004)) / texSize;
    float m2 = (shut > 0.995 || t2.y >= 1.0) ? 0.0 : texture(eyeMask, t2).r;
    rgb = mix(mix(c.rgb, skin, mk.x), texture(tex, t2).rgb, m2);
  }
  // true distance to the stroke (a 16-segment polyline along the curve): even thickness and round ends
  float d = 1e9;
  vec2 q2 = vec2(px, p.y), prev = vec2(-a, yc - sag);
  for (int i = 1; i <= 16; i++) {
    float u = -1.0 + float(i) / 8.0;
    vec2 cur = vec2(u * a, yc - sag * u * u);
    d = min(d, sdSeg(q2, prev, cur));
    prev = cur;
  }
  // inside the eye the stroke is cut by the silhouette; as the eye shuts it grows outwards past it, solid all the way.
  // It is only ever drawn on the face (skin or the eye itself): hair and outlines stay in front of it.
  float onFace = max(mk.x, 1.0 - smoothstep(0.05, 0.16, distance(c.rgb, skin)));
  float inside = (1.0 - smoothstep(tw * 0.5 - 0.9 * aa, tw * 0.5 + 0.9 * aa, d)) * smoothstep(0.35, 0.65, mk.y);
  // the part that reaches past the eye is a second, shorter stroke on the same curve, so its ends are always round
  float d2 = 1e9, gr = smoothstep(0.72, 0.9, blink), af = a * gr;      // full width a little before the eye is shut
  if (gr > 0.02) {
    prev = vec2(-af, yc - sag * gr * gr);
    for (int i = 1; i <= 16; i++) {
      float u = (-1.0 + float(i) / 8.0) * gr;
      vec2 cur = vec2(u * a, yc - sag * u * u);
      d2 = min(d2, sdSeg(q2, prev, cur));
      prev = cur;
    }
  }
  float free = 1.0 - smoothstep(tw * 0.5 - 0.9 * aa, tw * 0.5 + 0.9 * aa, d2);
  float line = max(inside, free) * on * onFace;
  rgb = mix(rgb, ink, line);
  return vec4(rgb, c.a);
}
void main(){
  vec2 outSize = texSize * (1.0 + 2.0 * pad);
  vec2 q = vec2(uv.x, 1.0 - uv.y) * outSize - texSize * pad;
  float d = max(0.0, sdSeg(q, head, feet) - R);
  float w = smoothstep(0.0, fall, d);
  w = w * sqrt(w);
  float ph = d * 0.011;
  vec2 disp = w * amp * vec2(sin(time * 2.1 - ph + q.y * 0.0035), 0.4 * sin(time * 1.7 - ph * 1.3 + 1.7));
  disp += w * wind * (0.72 + 0.28 * sin(time * 4.6 - ph * 2.2 + q.y * 0.008));
  disp += w * flutter * vec2(sin(time * 9.5 - ph * 3.1 + q.y * 0.021), 0.6 * cos(time * 7.7 - ph * 2.6 + q.x * 0.017));
  vec2 s = q - disp;
  vec2 t = s / texSize;
  bool inside = !(t.x < 0.0 || t.y < 0.0 || t.x > 1.0 || t.y > 1.0);
  vec4 c = inside ? texture(tex, t) : vec4(0.0);
  if (hasMask > 0.5 && inside && blink > 0.002) {
    vec2 mk = texture(eyeMask, t).rg;
    c = lid(c, s, eyeL, mk, eyeR.z > 0.0 ? -1.0 : 0.0); c = lid(c, s, eyeR, mk, 1.0);
  }
  o = c;
}`;

export function initWarp(res = 1) {
  SIZE = 1700 * res;
  cv = new OffscreenCanvas(SIZE, SIZE);
  gl = cv.getContext('webgl2', { alpha: true, premultipliedAlpha: true, preserveDrawingBuffer: true, antialias: false });
  if (!gl) throw new Error('webgl2 unavailable');
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['tex', 'eyeMask', 'texSize', 'pad', 'head', 'feet', 'R', 'fall', 'time', 'amp', 'flutter', 'lw', 'blink', 'smile', 'wind', 'eyeL', 'eyeR', 'skin', 'ink', 'hasMask', 'aa']) U[n] = gl.getUniformLocation(prog, n);
  gl.disable(gl.BLEND); gl.clearColor(0, 0, 0, 0);
}
// w, h: the sprite's size in manifest units; the image itself may be larger (the 2x sprites)
export function addTexture(id, img, isMask = false, w = img.naturalWidth, h = img.naturalHeight) {
  const t = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !isMask);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  TEX.set(id, { t, w, h, res: img.naturalWidth / w });
}
// Renders sprite `id` with the given motion state; returns {canvas, sx, sy, sw, sh, padX, padY} for ctx.drawImage.
export function renderWarp(id, m, p) {
  const T = TEX.get(id);
  const ow = Math.round(T.w * T.res * (1 + 2 * PAD)), oh = Math.round(T.h * T.res * (1 + 2 * PAD));
  // Clear the whole canvas, not just this sprite's rectangle: when the 2D canvas scales the result it samples a
  // pixel past the edge, and anything a larger sprite left there showed up as a thin line beside the character.
  gl.disable(gl.SCISSOR_TEST); gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(0, 0, ow, oh);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, T.t); gl.uniform1i(U.tex, 0);
  gl.uniform2f(U.texSize, T.w, T.h); gl.uniform1f(U.pad, PAD);
  gl.uniform2f(U.head, m.head[0], m.head[1]); gl.uniform2f(U.feet, m.feetXo ?? m.feetX, m.feetY);
  gl.uniform1f(U.R, p.R); gl.uniform1f(U.fall, p.fall); gl.uniform1f(U.time, p.time);
  gl.uniform1f(U.amp, p.amp); gl.uniform1f(U.flutter, p.flutter); gl.uniform2f(U.wind, p.windX, p.windY);
  gl.uniform1f(U.lw, p.lw); gl.uniform1f(U.blink, p.blink); gl.uniform1f(U.smile, p.smile); gl.uniform1f(U.aa, 1 / T.res);
  const e = m.eyes || [];
  gl.uniform4f(U.eyeL, ...(e[0] || [0, 0, 0, 0])); gl.uniform4f(U.eyeR, ...(e[1] || [0, 0, 0, 0]));
  const s = m.skin || [252, 244, 228]; gl.uniform3f(U.skin, s[0] / 255, s[1] / 255, s[2] / 255);
  const k = m.ink || [43, 35, 32]; gl.uniform3f(U.ink, k[0] / 255, k[1] / 255, k[2] / 255);
  const M = TEX.get(id + '#m');
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, M ? M.t : T.t); gl.uniform1i(U.eyeMask, 1); gl.uniform1f(U.hasMask, M ? 1 : 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  return { canvas: cv, sx: 0, sy: SIZE - oh, sw: ow, sh: oh, dw: ow / T.res, dh: oh / T.res, padX: T.w * PAD, padY: T.h * PAD };
}
