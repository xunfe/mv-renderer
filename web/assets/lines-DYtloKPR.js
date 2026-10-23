import{A as e,H as t,O as n,X as r,Xt as i,b as a,fn as o,i as s,j as c,zt as l}from"./three.core-D_1riXuZ.js";import{f as u,l as d,r as f}from"./gl-DWH67x7m.js";var p=`
precision highp float;
in vec3 position;          // quad corner: x in {0,1} along segment, y in {-1,1} across
in vec3 iA; in vec3 iB;     // segment endpoints
in vec4 iColor;             // linear rgb * intensity, alpha
in float iWidth;            // px (screen space) or world units (if worldWidth)
uniform mat4 projectionMatrix; uniform mat4 modelViewMatrix;
uniform vec2 res; uniform bool screen2D; uniform bool worldWidth; uniform float widthScale;
uniform float pxScale;      // physical px per logical px of the target: res is logical, AA works in physical px
out vec2 vLocal; out float vLen; out float vHalfW; out vec4 vColor;
vec4 toClip(vec3 p) {
  if (screen2D) return vec4(p.x / res.x * 2.0 - 1.0, 1.0 - p.y / res.y * 2.0, p.z, 1.0);
  return projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
void main() {
  vec4 ca = toClip(iA), cb = toClip(iB);
  // clip against near plane crudely: skip segments behind camera
  if (ca.w <= 0.0 || cb.w <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  vec2 sa = ca.xy / ca.w * 0.5 * res * pxScale, sb = cb.xy / cb.w * 0.5 * res * pxScale; // physical pixels, centred
  float w = iWidth * widthScale * pxScale;
  if (worldWidth && !screen2D) {
    // approximate world width -> pixels using projection scale at each end
    float pa = projectionMatrix[1][1] * 0.5 * res.y * pxScale / ca.w, pb = projectionMatrix[1][1] * 0.5 * res.y * pxScale / cb.w;
    w = iWidth * widthScale * mix(pa, pb, position.x);
  }
  float hw = max(w * 0.5, 0.35) + 1.0; // +1px for AA
  vec2 d = sb - sa; float len = length(d);
  vec2 dir = len > 1e-4 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float along = mix(-hw, len + hw, position.x);
  vec2 p = sa + dir * along + nrm * position.y * hw;
  float z = mix(ca.z / ca.w, cb.z / cb.w, position.x);
  gl_Position = vec4(p / (0.5 * res * pxScale), z, 1.0);
  vLocal = vec2(along, position.y * hw);
  vLen = len; vHalfW = max(w * 0.5, 0.35);
  // thin lines fade instead of shrinking below 0.7px (keeps hairlines smooth)
  vColor = iColor * vec4(1.0, 1.0, 1.0, min(1.0, w / 0.7));
}`,m=`
precision highp float;
in vec2 vLocal; in float vLen; in float vHalfW; in vec4 vColor;
out vec4 fragColor;
uniform bool premultiply;
void main() {
  float x = clamp(vLocal.x, 0.0, vLen);
  float d = length(vec2(vLocal.x - x, vLocal.y)) - vHalfW; // capsule SDF in px
  float a = clamp(0.5 - d, 0.0, 1.0) * vColor.a;
  if (a <= 0.0) discard;
  fragColor = premultiply ? vec4(vColor.rgb * a, a) : vec4(vColor.rgb, a);
}`,h=class{mesh;geo;mat;a;b;c;w;attrs;count=0;scene=new i;cam2D=new r(0,d,0,f,-1,1);constructor(r,i={}){this.geo=new c;let u=new Float32Array([0,-1,0,1,-1,0,1,1,0,0,1,0]);this.geo.setAttribute(`position`,new s(u,3)),this.geo.setIndex([0,1,2,0,2,3]),this.a=new Float32Array(r*3),this.b=new Float32Array(r*3),this.c=new Float32Array(r*4),this.w=new Float32Array(r),this.attrs=[new e(this.a,3),new e(this.b,3),new e(this.c,4),new e(this.w,1)],this.attrs.forEach(e=>e.setUsage(a)),this.geo.setAttribute(`iA`,this.attrs[0]),this.geo.setAttribute(`iB`,this.attrs[1]),this.geo.setAttribute(`iColor`,this.attrs[2]),this.geo.setAttribute(`iWidth`,this.attrs[3]);let h=i.blend??`add`;this.mat=new l({glslVersion:n,vertexShader:p,fragmentShader:m,uniforms:{res:{value:new o(d,f)},screen2D:{value:i.screen2D??!0},worldWidth:{value:!!i.worldWidth},widthScale:{value:1},pxScale:{value:1},premultiply:{value:!0}},transparent:!0,depthWrite:!1,depthTest:i.depthTest??!1,blending:5});let g=this.mat;h===`add`&&(g.blendEquation=100,g.blendSrc=201,g.blendDst=201),h===`max`&&(g.blendEquation=104,g.blendSrc=201,g.blendDst=201),h===`normal`&&(g.blendEquation=100,g.blendSrc=201,g.blendDst=205),this.mesh=new t(this.geo,this.mat),this.mesh.frustumCulled=!1,this.scene.add(this.mesh)}get capacity(){return this.w.length}clear(){this.count=0}seg(e,t,n,r,i,a,o,s,c,l,u=1){if(this.count>=this.capacity)return;let d=this.count++;this.a[d*3]=e,this.a[d*3+1]=t,this.a[d*3+2]=n,this.b[d*3]=r,this.b[d*3+1]=i,this.b[d*3+2]=a,this.c[d*4]=s,this.c[d*4+1]=c,this.c[d*4+2]=l,this.c[d*4+3]=u,this.w[d]=o}seg2(e,t,n,r,i,a,o=1){this.seg(e,t,0,n,r,0,i,a[0],a[1],a[2],o)}polyline(e,t,n,r=1){for(let i=1;i<e.length;i++){let a=e[i-1],o=e[i];this.seg(a.x,a.y,a.z??0,o.x,o.y,o.z??0,t,n[0],n[1],n[2],r)}}render(e,t,n,r=1){for(let e of this.attrs)e.needsUpdate=!0,e.addUpdateRange(0,this.count*e.itemSize);this.geo.instanceCount=this.count,this.mat.uniforms.widthScale.value=r;let i=t,a=u(i);this.mat.uniforms.res.value.set(i?i.width/a:d,i?i.height/a:f),this.mat.uniforms.pxScale.value=a,e.setRenderTarget(t),e.render(this.scene,n??this.cam2D);for(let e of this.attrs)e.clearUpdateRanges()}};export{h as t};