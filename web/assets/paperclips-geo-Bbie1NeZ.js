var e={YA:-3.6,YB:3.6,YC:-2.5,YD:1.5,XA0:-4,XR:12.4,XL:-12.4,XS:9,XD1:-7.5,R1:3.6,R2:3.05,R2CY:.55,R3:2,R3CY:-.5,WIRE:.45},t=e,n=t.XR-t.XA0,r=n+Math.PI*t.R1,i=r+(t.XR-t.XL),a=i+Math.PI*t.R2,o=a+(t.XS-t.XL),s=o+Math.PI*t.R3,c=s+(t.XS-t.XD1);function l(e){if(e<=n)return{x:t.XA0+e,y:t.YA,a:0};if(e<=r){let r=(e-n)/t.R1-Math.PI/2;return{x:t.XR+Math.cos(r)*t.R1,y:Math.sin(r)*t.R1,a:r+Math.PI/2}}if(e<=i)return{x:t.XR-(e-r),y:t.YB,a:Math.PI};if(e<=a){let n=Math.PI/2+(e-i)/t.R2;return{x:t.XL+Math.cos(n)*t.R2,y:t.R2CY+Math.sin(n)*t.R2,a:n+Math.PI/2}}if(e<=o)return{x:t.XL+(e-a),y:t.YC,a:0};if(e<=s){let n=(e-o)/t.R3-Math.PI/2;return{x:t.XS+Math.cos(n)*t.R3,y:t.R3CY+Math.sin(n)*t.R3,a:n+Math.PI/2}}let l=Math.min(e,c)-s;return{x:t.XS-l,y:t.YD,a:Math.PI}}var u=e=>e.toFixed(5),d=`
const float CL_YA = ${u(t.YA)}, CL_YB = ${u(t.YB)}, CL_YC = ${u(t.YC)}, CL_YD = ${u(t.YD)};
const float CL_XA0 = ${u(t.XA0)}, CL_XR = ${u(t.XR)}, CL_XL = ${u(t.XL)}, CL_XS = ${u(t.XS)}, CL_XD1 = ${u(t.XD1)};
const float CL_R1 = ${u(t.R1)}, CL_R2 = ${u(t.R2)}, CL_R2CY = ${u(t.R2CY)}, CL_R3 = ${u(t.R3)}, CL_R3CY = ${u(t.R3CY)};
const float CL_SA1 = ${u(n)}, CL_SB0 = ${u(r)}, CL_SB1 = ${u(i)}, CL_SC0 = ${u(a)}, CL_SC1 = ${u(o)}, CL_SD0 = ${u(s)}, CL_SEND = ${u(c)};

void _clSeg(vec2 p, float y, float x0, float x1, float dir, float s0, float sT, float sH, inout float bd, inout float bs, inout float bl, inout vec2 bq) {
  // horizontal segment traversed from x0 in direction dir (+1/-1); s = s0 + (x - x0) * dir
  float a = s0 + max(sT - s0, 0.0), b = s0 + min(sH - s0, abs(x1 - x0));
  if (b < a) return;
  float xa = x0 + (a - s0) * dir, xb = x0 + (b - s0) * dir;
  float x = clamp(p.x, min(xa, xb), max(xa, xb));
  vec2 o = p - vec2(x, y);
  float d = length(o);
  if (d < bd) { bd = d; bs = s0 + (x - x0) * dir; bl = o.y * dir; bq = vec2(x, y); }
}
void _clArc(vec2 p, vec2 c, float R, float a0, float s0, float sT, float sH, inout float bd, inout float bs, inout float bl, inout vec2 bq) {
  // counter-clockwise half circle starting at angle a0, s = s0 + (ang - a0) * R
  float lo = max(sT - s0, 0.0) / R, hi = min(sH - s0, PI * R) / R;
  if (hi < lo) return;
  vec2 v = p - c;
  float mid = a0 + PI * 0.5;
  float ang = atan(v.y, v.x);
  float rel = ang - mid; rel -= TAU * floor((rel + PI) / TAU); // (-PI, PI] around the arc middle
  float u = clamp(rel + PI * 0.5, lo, hi);
  float aa = a0 + u;
  vec2 q = c + R * vec2(cos(aa), sin(aa));
  vec2 o = p - q;
  float d = length(o);
  if (d < bd) { bd = d; bs = s0 + u * R; bl = R - length(v); bq = q; }
}
float clipD(vec2 p, float sT, float sH, out float s, out float lat, out vec2 q) {
  float bd = 1e5, bs = 0.0, bl = 0.0; vec2 bq = vec2(0.0);
  _clSeg(p, CL_YA, CL_XA0 + min(sT, 0.0), CL_XR, 1.0, min(sT, 0.0), sT, sH, bd, bs, bl, bq);
  _clArc(p, vec2(CL_XR, 0.0), CL_R1, -PI * 0.5, CL_SA1, sT, sH, bd, bs, bl, bq);
  _clSeg(p, CL_YB, CL_XR, CL_XL, -1.0, CL_SB0, sT, sH, bd, bs, bl, bq);
  _clArc(p, vec2(CL_XL, CL_R2CY), CL_R2, PI * 0.5, CL_SB1, sT, sH, bd, bs, bl, bq);
  _clSeg(p, CL_YC, CL_XL, CL_XS, 1.0, CL_SC0, sT, sH, bd, bs, bl, bq);
  _clArc(p, vec2(CL_XS, CL_R3CY), CL_R3, -PI * 0.5, CL_SC1, sT, sH, bd, bs, bl, bq);
  _clSeg(p, CL_YD, CL_XS, CL_XD1, -1.0, CL_SD0, sT, sH, bd, bs, bl, bq);
  s = bs; lat = bl; q = bq;
  return bd;
}
/** Fast full-clip distance with the signed lateral offset (no arc length, no trig): for raymarching. */
float clipDL(vec2 p, out float lat) {
  float bd = 1e5, bl = 0.0;
  // straight legs: A (y=YA, +x), B (y=YB, -x), C (y=YC, +x), D (y=YD, -x)
  vec2 o; float d;
  o = p - vec2(clamp(p.x, CL_XA0, CL_XR), CL_YA); d = dot(o, o); if (d < bd) { bd = d; bl = o.y; }
  o = p - vec2(clamp(p.x, CL_XL, CL_XR), CL_YB); d = dot(o, o); if (d < bd) { bd = d; bl = -o.y; }
  o = p - vec2(clamp(p.x, CL_XL, CL_XS), CL_YC); d = dot(o, o); if (d < bd) { bd = d; bl = o.y; }
  o = p - vec2(clamp(p.x, CL_XD1, CL_XS), CL_YD); d = dot(o, o); if (d < bd) { bd = d; bl = -o.y; }
  bd = sqrt(bd);
  // bends (only their own half-plane; beyond it the legs' ends are closer)
  vec2 v; float r;
  v = p - vec2(CL_XR, 0.0); if (v.x > 0.0) { r = length(v); d = abs(r - CL_R1); if (d < bd) { bd = d; bl = CL_R1 - r; } }
  v = p - vec2(CL_XL, CL_R2CY); if (v.x < 0.0) { r = length(v); d = abs(r - CL_R2); if (d < bd) { bd = d; bl = CL_R2 - r; } }
  v = p - vec2(CL_XS, CL_R3CY); if (v.x > 0.0) { r = length(v); d = abs(r - CL_R3); if (d < bd) { bd = d; bl = CL_R3 - r; } }
  lat = bl;
  return bd;
}
/** Fast full-clip distance (no range, no outputs). */
float clipD0(vec2 p) {
  float s, l; vec2 q;
  return clipD(p, 0.0, 1e3, s, l, q);
}
`;export{e as CLIP,d as GLSL_CLIP,n as S_A1,r as S_B0,i as S_B1,a as S_C0,o as S_C1,s as S_D0,c as S_END,l as clipPath};