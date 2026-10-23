import{A as e,At as t,Dt as n,Et as r,F as i,I as a,K as o,N as s,Ot as c,P as l,Q as u,T as d,Tt as f,U as p,V as m,X as h,_t as g,b as _,bt as v,c as y,et as b,ft as x,gt as S,k as C,kt as w,lt as T,n as E,nt as D,ot as O,pt as k,tt as A,u as j,ut as M,vt as N,w as P}from"./gl-DcsgeOjJ.js";import{t as F}from"./scene-CTj1nnms.js";var I=128,L=32,R=`
uniform float uRes, uTiles;
uniform int uMode;
vec3 h33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}
float worley(vec3 p, float per) {
  vec3 id = floor(p), f = fract(p);
  float d = 1.0;
  for (int z = -1; z <= 1; z++) for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec3 o = vec3(x, y, z);
    vec3 r = o + h33(mod(id + o, per)) - f;
    d = min(d, dot(r, r));
  }
  return sqrt(d);
}
vec3 g33(vec3 c) { return normalize(h33(c) * 2.0 - 1.0 + 1e-4); }
float perlin(vec3 p, float per) {
  vec3 i = floor(p), f = fract(p);
  vec3 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n000 = dot(g33(mod(i, per)), f);
  float n100 = dot(g33(mod(i + vec3(1, 0, 0), per)), f - vec3(1, 0, 0));
  float n010 = dot(g33(mod(i + vec3(0, 1, 0), per)), f - vec3(0, 1, 0));
  float n110 = dot(g33(mod(i + vec3(1, 1, 0), per)), f - vec3(1, 1, 0));
  float n001 = dot(g33(mod(i + vec3(0, 0, 1), per)), f - vec3(0, 0, 1));
  float n101 = dot(g33(mod(i + vec3(1, 0, 1), per)), f - vec3(1, 0, 1));
  float n011 = dot(g33(mod(i + vec3(0, 1, 1), per)), f - vec3(0, 1, 1));
  float n111 = dot(g33(mod(i + vec3(1, 1, 1), per)), f - vec3(1, 1, 1));
  return mix(mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y), mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y), u.z);
}
float wfbm(vec3 v, float per) { return worley(v * per, per) * 0.625 + worley(v * per * 2.0, per * 2.0) * 0.25 + worley(v * per * 4.0, per * 4.0) * 0.125; }
void main() {
  vec2 px = floor(gl_FragCoord.xy);
  float tile = floor(px.x / uRes) + floor(px.y / uRes) * uTiles;
  vec3 v = (vec3(mod(px.x, uRes), mod(px.y, uRes), tile) + 0.5) / uRes;
  if (uMode == 0) {
    float pf = 0.0, a = 1.0, fr = 4.0, nrm = 0.0;
    for (int i = 0; i < 4; i++) { pf += a * perlin(v * fr, fr); nrm += a; a *= 0.5; fr *= 2.0; }
    pf = clamp(pf / nrm * 0.75 + 0.5, 0.0, 1.0);
    float w1 = 1.0 - wfbm(v, 4.0), w2 = 1.0 - wfbm(v, 8.0), w3 = 1.0 - wfbm(v, 16.0);
    fragColor = vec4(clamp(remap(pf, w1 - 1.0, 1.0, 0.0, 1.0), 0.0, 1.0), w1, w2, w3);
  } else {
    fragColor = vec4(1.0 - wfbm(v, 2.0), 1.0 - wfbm(v, 4.0), 1.0 - wfbm(v, 8.0), 1.0);
  }
}`;function z(e,n,i){let a=Math.ceil(Math.sqrt(n)),o=Math.ceil(n/a),s=new t(n*a,n*o,{type:r,depthBuffer:!1});new E(R,{uRes:{value:n},uTiles:{value:a},uMode:{value:i}}).render(e,s);let c=new Uint8Array(s.width*s.height*4);e.readRenderTargetPixels(s,0,0,s.width,s.height,c),s.dispose();let u=new Uint8Array(n*n*n*4);for(let e=0;e<n;e++){let t=e%a*n,r=Math.floor(e/a)*n;for(let i=0;i<n;i++){let a=((r+i)*s.width+t)*4,o=(e*n*n+i*n)*4;u.set(c.subarray(a,a+n*4),o)}}let d=new l(u,n,n,n);return d.format=S,d.type=r,d.minFilter=d.magFilter=h,d.wrapS=d.wrapT=d.wrapR=N,d.unpackAlignment=1,d.needsUpdate=!0,d}var B=`
precision highp sampler3D;
uniform mat4 uInvVP;
uniform sampler3D uShape, uDetail;
uniform float uCov, uDens, uCB, uCT, uSeed, uT, uStepsK;
uniform vec4 uBump;                 // where she falls through: x, z, radius (m), extra coverage
uniform vec3 uSunCol, uAmbTop, uAmbBot;
uniform vec2 uWind;                 // drift (m/s)
uniform vec3 uSunDir, uCam, uFogCol;  // toward the sun (unit); camera (world units); the haze colour
uniform float uFogD, uScale;          // haze density (1/m); world units per metre
float hg(float c, float g) { float g2 = g * g; return (1.0 - g2) / (12.566 * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5)); }
float transmit(vec3 p) { return exp(-distance(uCam, p) / uScale * uFogD); }
vec3 fogCol(vec3 d) { return uFogCol; }

float weather(vec2 xz) {
  vec2 q = (xz + uWind * uT) / 21000.0;
  float a = texture(uShape, vec3(q, 0.21)).r, b = texture(uShape, vec3(q * 2.7 + 0.31, 0.63)).g;
  float n = a * 0.7 + b * 0.45;
  // (at coverage 0 the noise alone still peaks into a few clouds: none, so a bump stands alone in a clear sky)
  float c = uCov > 0.001 ? smoothstep(1.02 - uCov, 1.28 - uCov * 0.8, n) : 0.0;
  vec2 d = xz - uBump.xy;
  return max(c, uBump.w * exp(-dot(d, d) / (uBump.z * uBump.z)));
}
float density(vec3 p, float lod) {
  float h = (p.y - uCB) / (uCT - uCB);
  if (h <= 0.0 || h >= 1.0) return 0.0;
  float cov = weather(p.xz);
  if (cov < 0.02) return 0.0;
  // cumulus: a flat, soft base; a rounded top that stands higher where the coverage is denser
  float top = mix(0.42, 1.0, cov);
  float prof = smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(top * 0.72, top, h));
  vec3 sp = (p + vec3(uWind.x, 0.0, uWind.y) * uT) / 2400.0;
  vec4 n = texture(uShape, sp);
  float low = n.g * 0.625 + n.b * 0.25 + n.a * 0.125;
  float base = remap(n.r, low - 1.0, 1.0, 0.0, 1.0) * prof;
  base = clamp(remap(base, 1.0 - cov, 1.0, 0.0, 1.0), 0.0, 1.0) * cov;
  if (base <= 0.0 || lod > 0.5) return base;
  vec3 dn = texture(uDetail, p / 300.0 + vec3(0.013, -0.021, 0.008) * uT).rgb;
  float hf = dn.r * 0.625 + dn.g * 0.25 + dn.b * 0.125;
  // (the texture holds inverted Worley: high = the middle of a billow) eroding where it is high frays the base
  // into wisps; eroding where it is low, higher up, leaves the billows standing (cauliflower tops)
  hf = mix(hf, 1.0 - hf, clamp(h * 3.0, 0.0, 1.0));
  return clamp(remap(base, hf * 0.55, 1.0, 0.0, 1.0), 0.0, 1.0);
}
float toSun(vec3 p) {
  float od = 0.0, st = 28.0;
  vec3 q = p;
  for (int i = 0; i < 6; i++) { q += uSunDir * st; od += density(q, 1.0) * st; st *= 1.75; }
  return od;
}
void main() {
  vec4 a = uInvVP * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 rd = normalize(a.xyz / a.w - uCam);
  vec3 cam = uCam / uScale;         // (the field is in metres)
  float tA = 0.0, tB = 0.0;
  if (abs(rd.y) > 1e-5) {
    float t0 = (uCB - cam.y) / rd.y, t1 = (uCT - cam.y) / rd.y;
    tA = max(min(t0, t1), 0.0); tB = max(t0, t1);
  } else if (cam.y > uCB && cam.y < uCT) { tA = 0.0; tB = 1e9; }
  tB = min(tB, 42000.0);
  if (tB <= tA || (uCov <= 0.001 && uBump.w <= 0.001)) { fragColor = vec4(0.0); return; }
  float n = floor(mix(40.0, 72.0, uStepsK));
  float dt = max((tB - tA) / n, 12.0);
  float j = hash12(gl_FragCoord.xy + fract(uSeed * 7.31) * 113.0);
  float t = tA + dt * j;
  float cs = dot(rd, uSunDir);
  vec3 col = vec3(0.0);
  float T = 1.0, dsum = 0.0, wsum = 0.0;
  for (int i = 0; i < 96; i++) {
    if (t > tB || T < 0.008) break;
    vec3 p = cam + rd * t;
    float lod = dt > 220.0 ? 1.0 : 0.0;
    float d = density(p, lod);
    if (d > 0.003) {
      float sig = d * uDens;
      float od = toSun(p) * uDens;
      float h = (p.y - uCB) / (uCT - uCB);
      // three octaves of multiple scattering (Wrenninge): each softer, less attenuated, less forward
      vec3 S = vec3(0.0);
      float ka = 1.0, kb = 1.0, kc = 1.0;
      for (int o = 0; o < 3; o++) {
        float ph = mix(hg(cs, 0.75 * kc), hg(cs, -0.25 * kc), 0.3) * 12.566;
        S += kb * ph * exp(-od * ka);
        ka *= 0.25; kb *= 0.42; kc *= 0.5;
      }
      // powder: the inside of a cloud is darker where light has not yet scattered (the sunlit rims glow)
      float powder = 1.0 - 0.7 * exp(-sig * 200.0);
      vec3 L = uSunCol * S * powder + mix(uAmbBot, uAmbTop, smoothstep(0.05, 0.95, h));
      // light that has wandered deep inside: a cloud is bright white within, not dark (inside the cloud she falls through)
      L += mix(uSunCol, vec3(luma(uSunCol)), 0.55) * 0.34 * exp(-od * 0.004);
      float Ts = exp(-sig * dt);
      col += T * L * (1.0 - Ts);
      wsum += T * (1.0 - Ts); dsum += T * (1.0 - Ts) * t;
      T *= Ts;
    }
    t += dt;
  }
  if (T > 0.999) { fragColor = vec4(0.0); return; }
  // the haze between us and the clouds (the same air the cities sink into)
  float tm = dsum / max(wsum, 1e-5);
  float tr = transmit((cam + rd * tm) * uScale);
  col = col * tr + fogCol(rd) * (1.0 - T) * (1.0 - tr);
  fragColor = vec4(col, 1.0 - T);
}`,V={cov:.55,dens:.12,base:2250,top:2950,bump:[0,0,1e3,0],steps:.4};function H(e,t,n,r,i=1,a=new s(.18,.24,.42),o=2e-5){let c=t,l=u.clamp((6-c)/7,0,1),d=u.clamp(-c/2,0,1),f=u.clamp((c+3.2)/3.2,0,1)**1.5*Math.min(1,n),p=u.clamp(r,0,1);return{sunDir:e.clone().normalize(),sun:new s(1,.86-.3*l-.16*d,.72-.42*l-.12*d).multiplyScalar(2.6*f),ambTop:new s(.045,.085,.24).multiplyScalar(.2+1.1*p),ambBot:new s(.05,.06,.12).multiplyScalar(.3+.9*p).add(new s(.42,.24,.1).multiplyScalar(.22*i*(1-p))),fog:a,fogDensity:o}}var U=class{rt=y(d/2,P/2,{depthBuffer:!1});scale=1;shape=null;detail=null;invVP=new b;pass=new E(B,{uInvVP:{value:this.invVP},uShape:{value:null},uDetail:{value:null},uCov:{value:.5},uDens:{value:.04},uCB:{value:2250},uCT:{value:2950},uSeed:{value:0},uT:{value:0},uStepsK:{value:.4},uBump:{value:new w},uSunCol:{value:new c},uAmbTop:{value:new c},uAmbBot:{value:new c},uWind:{value:new n(6,-3)},uSunDir:{value:new c(0,.05,-1)},uCam:{value:new c},uFogCol:{value:new c},uFogD:{value:2e-5},uScale:{value:1}});init(e){this.shape=z(e,I,0),this.detail=z(e,L,1),this.pass.u.uShape.value=this.shape,this.pass.u.uDetail.value=this.detail}render(e,t,n,r,i,a){if(n.cov<=.001&&n.bump[3]<=.001)return!1;let o=this.pass.u;return t.updateMatrixWorld(!0),this.invVP.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse).invert(),o.uCov.value=n.cov,o.uDens.value=n.dens,o.uCB.value=n.base,o.uCT.value=n.top,o.uSeed.value=a,o.uT.value=i,o.uStepsK.value=n.steps??.4,o.uScale.value=this.scale,o.uBump.value.set(...n.bump),o.uSunDir.value.copy(r.sunDir).normalize(),o.uCam.value.copy(t.getWorldPosition(new c)),o.uSunCol.value.set(r.sun.r,r.sun.g,r.sun.b),o.uAmbTop.value.set(r.ambTop.r,r.ambTop.g,r.ambTop.b),o.uAmbBot.value.set(r.ambBot.r,r.ambBot.g,r.ambBot.b),o.uFogCol.value.set(r.fog.r,r.fog.g,r.fog.b),o.uFogD.value=r.fogDensity,this.pass.render(e,this.rt),!0}},W=6e3,G=38,K=`
precision highp float;
in vec3 position;   // base position in the repeating box (0..L)
in vec4 seedv;      // phase, rate, size, hue
uniform mat4 viewMatrix, projectionMatrix;
uniform vec3 uCam, uShift;
uniform float uT, uFocal, uNear, uFar, uSize;
out float vI;
out vec3 vC;
void main() {
  // the copy of this mote nearest the camera: wrap into the box centred on it
  vec3 o = uCam - vec3(${G/2}.0);
  vec3 p = mod(position + uShift - o, ${G}.0) + o;
  vec4 v = viewMatrix * vec4(p, 1.0);
  float d = -v.z;
  gl_Position = projectionMatrix * v;
  // which pass: beyond her (uNear = her distance, uFar = inf) or before her (0 .. her distance)
  float keep = step(uNear, d) * step(d, uFar) * step(0.4, d);
  float px = uSize * seedv.z * uFocal / max(d, 0.4);               // physical px
  gl_PointSize = clamp(px, 1.0, 9.0 * ${j.toFixed(1)});
  // energy kept when the point is clamped to 1 px, faded out at the far edge of the box and right at the lens
  float area = px * px / max(gl_PointSize * gl_PointSize, 1e-3);
  float tw = pow(max(0.0, sin(seedv.x + uT * seedv.y)), 6.0);       // a glint as it turns
  vI = keep * (0.5 + 5.0 * tw) * min(1.0, area) * smoothstep(${(G/2).toFixed(1)}, ${(G*.3).toFixed(1)}, d) * smoothstep(0.4, 1.5, d);
  vC = mix(vec3(1.0, 0.9, 0.78), vec3(0.85, 0.92, 1.0), seedv.w);
}`,q=`
precision highp float;
in float vI;
in vec3 vC;
uniform vec3 uTint;
uniform float uK;
out vec4 fragColor;
void main() {
  vec2 q = gl_PointCoord * 2.0 - 1.0;
  float r = dot(q, q);
  if (r > 1.0 || vI <= 0.0) discard;
  fragColor = vec4(vC * uTint * uK * vI * exp(-r * 4.0), 1.0);
}`,J=class{scene=new v;mat;constructor(){let t=new Float32Array(W*3),n=new Float32Array(W*4),r=7,i=()=>(r=r*16807%2147483647,(r-1)/2147483646);for(let e=0;e<W;e++)t[e*3]=i()*G,t[e*3+1]=i()*G,t[e*3+2]=i()*G,n[e*4]=i()*6.283,n[e*4+1]=2+i()*9,n[e*4+2]=.5+i()*i()*2.2,n[e*4+3]=i();let a=new e;a.setAttribute(`position`,new C(t,3)),a.setAttribute(`seedv`,new C(n,4)),this.mat=new g({glslVersion:p,vertexShader:K,fragmentShader:q,uniforms:{uCam:{value:new c},uShift:{value:new c},uT:{value:0},uFocal:{value:1},uNear:{value:0},uFar:{value:1e9},uSize:{value:.05},uTint:{value:new c(1,1,1)},uK:{value:1}},blending:2,transparent:!0,depthTest:!1,depthWrite:!1});let o=new x(a,this.mat);o.frustumCulled=!1,this.scene.add(o)}render(e,t,n,r,i,a,o,s,c=.05){if(a<=.001)return;let l=this.mat.uniforms;l.uCam.value.copy(n.position),l.uShift.value.copy(r),l.uT.value=i,l.uK.value=a,l.uSize.value=c,l.uNear.value=s[0],l.uFar.value=s[1],l.uTint.value.set(o.r,o.g,o.b),l.uFocal.value=t.height/2/Math.tan(u.degToRad(n.fov/2)),e.setRenderTarget(t),e.render(this.scene,n)}},Y=class{src=y(d/2,P/2,{depthBuffer:!1});shafts=y(d/2,P/2,{depthBuffer:!1});maskPass=new E(`
    uniform sampler2D world, fig, depth; uniform vec2 sun, res; uniform float thr;
    void main() {
      vec3 c = texture(world, vUv).rgb;
      float a = texture(fig, vUv).a;
      // only open sky feeds the shafts (the depth buffer is cleared to 1 there): never the towers' red lights or the
      // city's lamps, which the radial smear would draw out into lines
      float sky = step(0.9999999, texture(depth, vUv).r);
      // only the hot sky near the sun feeds the shafts (the sun's glow, lit cloud edges): not the city's lights
      float l = luma(c);
      float hot = max(l - thr, 0.0) / max(l, 1e-4);
      float near = exp(-length((vUv - sun) * res) / 520.0);
      fragColor = vec4(c * hot * near * sky * (1.0 - a), 1.0);
    }`,{world:{value:null},fig:{value:null},depth:{value:null},sun:{value:new n},res:{value:new n(d,P)},thr:{value:1.2}});blurPass=new E(`
    uniform sampler2D src; uniform vec2 sun; uniform float seed, reach;
    void main() {
      const int N = 72;
      vec2 d = (sun - vUv) * reach / float(N);
      float j = hash12(gl_FragCoord.xy * 0.913 + fract(seed * 0.29) * 57.3);
      vec2 uv = vUv + d * j;
      vec3 acc = vec3(0.0);
      float w = 1.0;
      for (int i = 0; i < N; i++) {
        acc += texture(src, uv).rgb * w;
        w *= 0.972;
        uv += d;
      }
      fragColor = vec4(acc / float(N), 1.0);
    }`,{src:{value:null},sun:{value:new n},seed:{value:0},reach:{value:.92}});render(e,t,r,i,a,o,s,c,l,u){if(c<=.001)return;let d=o,f=o.position.clone().addScaledVector(s,((d.near??0)+(d.far??2e5))/2).project(o);if(!(f.z<=1))return;let p=new n(f.x*.5+.5,f.y*.5+.5);if(p.x<-.8||p.x>1.8||p.y<-.8||p.y>1.8)return;let m=this.maskPass.u;m.world.value=r,m.depth.value=i,m.fig.value=a,m.sun.value.copy(p),this.maskPass.render(e,this.src);let h=this.blurPass.u;h.src.value=this.src.texture,h.sun.value.copy(p),h.seed.value=l,this.blurPass.render(e,this.shafts),u.draw(e,this.shafts.texture,t,{mode:`add`,opacity:c})}},X=96,Z=class{out=y(d,P,{depthBuffer:!1});pass=new E(`
    uniform sampler2D colTex, depthTex;
    uniform float near, far, focus, aperture, maxBlur, seed;
    uniform vec2 texel;
    float linz(float d) { return near * far / (far - d * (far - near)); }
    float coc(float z) { return clamp(aperture * abs(1.0 / focus - 1.0 / z), 0.0, maxBlur); }
    void main() {
      float z0 = linz(texture(depthTex, vUv).r);
      float c0 = coc(z0);
      vec3 acc = texture(colTex, vUv).rgb / max(c0 * c0, 1.0);
      float wsum = 1.0 / max(c0 * c0, 1.0);
      float rot = hash12(gl_FragCoord.xy * 0.371 + fract(seed * 0.137) * 91.7) * 6.2831853;
      for (int i = 0; i < ${X}; i++) {
        float r = sqrt((float(i) + 0.5) / ${X}.0) * maxBlur;
        float a = float(i) * 2.39996323 + rot;
        vec2 uv = vUv + vec2(cos(a), sin(a)) * r * texel;
        float zs = linz(texture(depthTex, uv).r);
        float cs = coc(zs);
        float reach = zs > z0 ? min(cs, c0 * 1.5 + 1.0) : cs;
        float w = smoothstep(r - 1.2, r + 0.8, reach) / max(cs * cs, 1.0);
        acc += texture(colTex, uv).rgb * w;
        wsum += w;
      }
      fragColor = vec4(acc / wsum, 1.0);
    }`,{colTex:{value:null},depthTex:{value:null},near:{value:3},far:{value:4e5},focus:{value:5},aperture:{value:0},maxBlur:{value:1},seed:{value:0},texel:{value:new n(1/d,1/P)}});render(e,t,n,r,i,a){if(i.blur<.3)return!1;let o=this.pass.u;return o.colTex.value=t,o.depthTex.value=n,o.near.value=r.near,o.far.value=r.far,o.focus.value=i.focus,o.aperture.value=i.blur*i.focus,o.maxBlur.value=i.blur*1.2,o.seed.value=a,this.pass.render(e,this.out),!0}},Q=2.5,$=class extends F{world=new v;subject=new v;cam=new T(50,d/P,1,2e5);worldRT=(()=>{let e=y(d,P);return e.depthTexture=new i(e.width,e.height,m),e})();subjRT=y(d,P,{samples:4});clouds=new U;motes=new J;rays=new Y;bokeh=new Z;sunDir=new c(0,Math.sin(u.degToRad(Q)),-Math.cos(u.degToRad(Q)));knot;sky=new E(`
    uniform mat4 invVP; uniform vec3 camPos, sunDir;
    void main() {
      vec4 a = invVP * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
      vec3 d = normalize(a.xyz / a.w - camPos);
      float e = d.y;
      vec3 c = mix(vec3(0.55, 0.42, 0.55), vec3(0.03, 0.08, 0.26), smoothstep(-0.02, 0.45, e));
      c = mix(c, vec3(0.05, 0.06, 0.14), smoothstep(0.0, -0.08, e));
      float s = max(dot(d, sunDir), 0.0);
      c += vec3(1.0, 0.75, 0.55) * (0.22 * pow(s, 24.0) + 1.4 * pow(s, 400.0)) + vec3(1.0, 0.95, 0.9) * 60.0 * step(0.99995, s);
      fragColor = vec4(c, 1.0);
    }`,{invVP:{value:new b},camPos:{value:new c},sunDir:{value:new c}});init(){this.clouds.init(this.ctx.renderer);let t=_(5),n=3e4,r=new Float32Array(n*3),i=new Float32Array(n*3);for(let e=0;e<n;e++){let n=400+2e4*Math.sqrt(t()),a=t()*Math.PI*2;r.set([Math.cos(a)*n,0,Math.sin(a)*n-6e3],e*3);let o=t();i.set(o<.7?[6,4.2,2.2]:[3.5,4.5,6],e*3)}let c=new e;c.setAttribute(`position`,new C(r,3)),c.setAttribute(`color`,new C(i,3));let l=new x(c,new k({size:2,sizeAttenuation:!1,vertexColors:!0})),u=new A(new M(6e4,6e4).rotateX(-Math.PI/2),new D({color:new s(.012,.016,.04)}));u.position.y=-1,this.world.add(u,l),this.knot=new A(new f(.9,.28,220,24),new O({color:2241365,emissive:new s(.9,.35,.5),emissiveIntensity:.22,roughness:.35,metalness:.2}));let d=new a(16769224,3);d.position.copy(this.sunDir).multiplyScalar(100),this.subject.add(this.knot,d,new o(7309e3,1710128,.8))}render(e,t){let n=this.ctx.renderer,r=e.t,i=new c(Math.sin(r*.05)*60,3600-18*r,900-30*r);this.cam.position.copy(i),this.cam.lookAt(i.x,i.y-1.8,i.z-10),this.cam.updateMatrixWorld(!0);let a=new c(0,-.15,-1).applyQuaternion(this.cam.quaternion).multiplyScalar(7).add(i);this.knot.position.copy(a),this.knot.rotation.set(r*.3,r*.45,0);let o=this.sky.u;o.invVP.value.multiplyMatrices(this.cam.projectionMatrix,this.cam.matrixWorldInverse).invert(),o.camPos.value.copy(i),o.sunDir.value.copy(this.sunDir),n.setRenderTarget(this.worldRT),n.setClearColor(0,1),n.clear(!0,!0,!0),this.sky.render(n,this.worldRT),n.setRenderTarget(this.worldRT),n.render(this.world,this.cam);let l=H(this.sunDir,Q,1,.9,1,new s(.32,.3,.46),25e-6);this.clouds.render(n,this.cam,{...V,cov:.5},l,r,r*13.7)&&this.ctx.comp.draw(n,this.clouds.rt.texture,this.worldRT,{mode:`normal`,premult:!1});let u=new c(0,-.6*r,0).add(i.clone().multiplyScalar(.9)),d=new s(1,.86,.72).multiplyScalar(1.4);this.motes.render(n,this.worldRT,this.cam,u,r,.9,d,[7,1e9],.035);let f=this.bokeh.render(n,this.worldRT.texture,this.worldRT.depthTexture,this.cam,{focus:7,blur:22},r*7.3);return this.ctx.comp.draw(n,f?this.bokeh.out.texture:this.worldRT.texture,t,{mode:`replace`}),n.setRenderTarget(this.subjRT),n.setClearColor(0,0),n.clear(!0,!0,!0),n.render(this.subject,this.cam),n.setClearColor(0,1),this.ctx.comp.draw(n,this.subjRT.texture,t,{mode:`normal`,premult:!1}),this.motes.render(n,t,this.cam,u,r,.9,d,[0,7],.035),this.rays.render(n,t,this.worldRT.texture,this.worldRT.depthTexture,this.subjRT.texture,this.cam,this.sunDir,.6,r*5.1,this.ctx.comp),{bloom:.45,bloomThreshold:1.3,grain:.03,vignette:.14}}};export{$ as default};