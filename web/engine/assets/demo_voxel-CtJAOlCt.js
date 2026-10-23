import{A as e,B as t,H as n,I as r,K as i,N as a,O as o,Ot as s,T as c,Y as l,_ as u,at as d,bt as f,et as p,f as m,ht as h,lt as g,nt as _,ot as v,q as y,rt as b,tt as x,w as S}from"./gl-DcsgeOjJ.js";import{n as C,r as w}from"./index-CQqHSO2_.js";import{t as T}from"./scene-CTj1nnms.js";import{i as E,r as D,t as O}from"./world-Q-_9ijk9.js";import{n as k,t as A}from"./kit3d-BmTqhgJa.js";function j(e,t=0,n=1){let r=e.res,i=Math.max(1,Math.round(e.res*(e.z1-e.z0)/(e.x1-e.x0))),a=(e.x1-e.x0)/r,o=(e.z1-e.z0)/i,s=new Float32Array((r+1)*(i+1)),c=new Float32Array((r+1)*(i+1));for(let l=0;l<=i;l++)for(let d=0;d<=r;d++){let f=d===0||l===0||d===r||l===i,p=l*(r+1)+d;s[p]=e.x0+d*a+(f?0:(u(d,l,n)-.5)*t*a),c[p]=e.z0+l*o+(f?0:(u(l,d,n+1)-.5)*t*o)}return{nx:r,nz:i,X:s,Z:c,tris:(e,t)=>{let n=t*(r+1)+e,i=n+1,a=n+r+1,o=a+1;return e+t&1?[[n,a,i],[i,a,o]]:[[n,a,o],[n,o,i]]}}}function M(n){let r=j(n,n.jitter??.7,n.seed??1),i=new Float32Array(r.X.length);for(let e=0;e<i.length;e++)i[e]=n.h(r.X[e],r.Z[e]);let a=[],o=[],c=new s,l=new s,u=new s,d=new s;for(let e=0;e<r.nz;e++)for(let t=0;t<r.nx;t++)for(let s of r.tris(t,e)){c.set(r.X[s[0]],i[s[0]],r.Z[s[0]]),l.set(r.X[s[1]],i[s[1]],r.Z[s[1]]),u.set(r.X[s[2]],i[s[2]],r.Z[s[2]]),d.subVectors(l,c).cross(u.clone().sub(c)).normalize(),d.y<0?(d.negate(),a.push(c.x,c.y,c.z,u.x,u.y,u.z,l.x,l.y,l.z)):a.push(c.x,c.y,c.z,l.x,l.y,l.z,u.x,u.y,u.z);let e=n.color((c.x+l.x+u.x)/3,(c.y+l.y+u.y)/3,(c.z+l.z+u.z)/3,1-d.y);for(let t=0;t<3;t++)o.push(e.r,e.g,e.b)}let f=new e;return f.setAttribute(`position`,new t(a,3)),f.setAttribute(`color`,new t(o,3)),f.computeVertexNormals(),f}var N=class e{size;origin;nx;ny;nz;data;constructor(e,t,n,r,i){this.size=e,this.origin=t,this.nx=n,this.ny=r,this.nz=i,this.data=new Uint16Array(n*r*i)}static cover(t,n,r){return new e(t,n,Math.ceil((r[0]-n[0])/t),Math.ceil((r[1]-n[1])/t),Math.ceil((r[2]-n[2])/t))}idx(e,t,n){return(t*this.nz+n)*this.nx+e}inside(e,t,n){return e>=0&&t>=0&&n>=0&&e<this.nx&&t<this.ny&&n<this.nz}get(e,t,n){return this.inside(e,t,n)?this.data[this.idx(e,t,n)]:0}set(e,t,n,r){this.inside(e,t,n)&&(this.data[this.idx(e,t,n)]=r)}vx(e){return Math.floor((e-this.origin[0])/this.size+1e-6)}vy(e){return Math.floor((e-this.origin[1])/this.size+1e-6)}vz(e){return Math.floor((e-this.origin[2])/this.size+1e-6)}centre(e,t,n){let r=this.size;return[this.origin[0]+(e+.5)*r,this.origin[1]+(t+.5)*r,this.origin[2]+(n+.5)*r]}box(e,t,n,r,i,a,o){let[s,c]=e<r?[e,r]:[r,e],[l,u]=t<i?[t,i]:[i,t],[d,f]=n<a?[n,a]:[a,n],p=this.size,m=Math.max(0,Math.round((s-this.origin[0])/p)),h=Math.min(this.nx,Math.round((c-this.origin[0])/p)),g=Math.max(0,Math.round((l-this.origin[1])/p)),_=Math.min(this.ny,Math.round((u-this.origin[1])/p)),v=Math.max(0,Math.round((d-this.origin[2])/p)),y=Math.min(this.nz,Math.round((f-this.origin[2])/p));for(let e=g;e<_;e++)for(let t=v;t<y;t++)for(let n=m;n<h;n++){let r=typeof o==`number`?o:o(n,e,t);this.data[this.idx(n,e,t)]=r}}shape(e,t,n){let r=Math.max(0,this.vx(e[0])),i=Math.min(this.nx-1,this.vx(t[0])),a=Math.max(0,this.vy(e[1])),o=Math.min(this.ny-1,this.vy(t[1])),s=Math.max(0,this.vz(e[2])),c=Math.min(this.nz-1,this.vz(t[2]));for(let e=a;e<=o;e++)for(let t=s;t<=c;t++)for(let a=r;a<=i;a++){let r=n(this.centre(a,e,t),a,e,t);r>=0&&(this.data[this.idx(a,e,t)]=r)}}},P={},F=[{n:[1,0,0],u:[0,1,0],v:[0,0,1]},{n:[-1,0,0],u:[0,1,0],v:[0,0,1]},{n:[0,1,0],u:[1,0,0],v:[0,0,1]},{n:[0,-1,0],u:[1,0,0],v:[0,0,1]},{n:[0,0,1],u:[1,0,0],v:[0,1,0]},{n:[0,0,-1],u:[1,0,0],v:[0,1,0]}];function I(e,t,n,r,i){e.uniforms.uTime=t,e.uniforms.uFloor=r,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
      uniform float uTime; uniform float uFloor;
      attribute vec3 aAO; attribute vec4 aIn; attribute vec4 aOut; attribute vec3 aVel;
      ${n?`varying float vAO; varying vec3 vLoc; varying vec3 vNrm;`:``}
      vec3 vRot(vec3 p, vec3 k, float a) { float c = cos(a), s = sin(a); return p * c + cross(k, p) * s + k * dot(k, p) * (1.0 - c); }
      float vScale; vec3 vOff; vec3 vAxis; float vAng;
      void voxAnim() {
        // aIn = (t0, dur, from.x, from.z); aOut = (t1, dur1, spin seed, from.y); aVel = out velocity
        float t0 = aIn.x, dur = max(aIn.y, 1e-3);
        float p = clamp((uTime - t0) / dur, 0.0, 1.0);
        float q = p - 1.0;
        float e = 1.0 + 2.70158 * q * q * q + 1.70158 * q * q; // outBack
        vScale = uTime < t0 ? 0.0 : smoothstep(0.0, 0.22, p);
        vOff = vec3(aIn.z, aOut.w, aIn.w) * (1.0 - e);
        vAxis = vec3(0.0, 1.0, 0.0); vAng = 0.0;
        float to = uTime - aOut.x;
        if (to > 0.0) {
          vOff += aVel * to + vec3(0.0, -9.8, 0.0) * 0.5 * to * to;
          // land on the floor instead of falling through it (and skid)
          float iy = instanceMatrix[3].y, lo = uFloor + ${(i/2).toFixed(4)} - iy;
          if (vOff.y < lo) { vOff.y = lo; vOff.xz *= 0.9; }
          vScale *= 1.0 - smoothstep(0.0, max(aOut.y, 1e-3), to);
          vAxis = normalize(vec3(sin(aOut.z * 12.9898), cos(aOut.z * 78.233), sin(aOut.z * 37.719) + 0.3));
          vAng = to * (4.0 + 6.0 * fract(aOut.z * 3.17)) * sign(fract(aOut.z * 7.1) - 0.5);
        }
      }`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
      voxAnim();
      objectNormal = vRot(objectNormal, vAxis, vAng);`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
      ${n?`
      {
        vec3 an = abs(normal);
        int f = an.x > 0.5 ? (normal.x > 0.0 ? 0 : 1) : an.y > 0.5 ? (normal.y > 0.0 ? 2 : 3) : (normal.z > 0.0 ? 4 : 5);
        vec2 uv2 = f < 2 ? position.yz : (f < 4 ? position.xz : position.xy);
        int c = (uv2.x > 0.0 ? 1 : 0) + (uv2.y > 0.0 ? 2 : 0);
        float packed = f < 2 ? aAO.x : (f < 4 ? aAO.y : aAO.z);
        float sh = float((f - (f / 2) * 2) * 8 + c * 2);
        vAO = mod(floor(packed / exp2(sh) + 0.001), 4.0) / 3.0;
        vLoc = position / ${i.toFixed(5)}; vNrm = normal;
      }`:`voxAnim();`}
      transformed = vRot(transformed, vAxis, vAng) * vScale + vOff;`)}function L(e,t,n,r={}){let i={...P,...r},s=e.size,c=(t,n,r)=>e.get(t,n,r)===0?0:1,f=[];for(let t=0;t<e.ny;t++)for(let n=0;n<e.nz;n++)for(let r=0;r<e.nx;r++)e.data[e.idx(r,t,n)]&&(c(r+1,t,n)&&c(r-1,t,n)&&c(r,t+1,n)&&c(r,t-1,n)&&c(r,t,n+1)&&c(r,t,n-1)||f.push(r,t,n));let m=f.length/3,g=new o(s,s,s),x=new Float32Array(m*3),S=new Float32Array(m*4),C=new Float32Array(m*4),w=new Float32Array(m*3),T=i.unlit?new _:new v({roughness:i.roughness??.9,metalness:0}),E=new l(g,T,m),D=new p,O=new a,k=i.seed??1,A=[];for(let r=0;r<m;r++){let i=f[r*3],a=f[r*3+1],o=f[r*3+2],s=e.get(i,a,o),l=t[s],d=e.centre(i,a,o);D.makeTranslation(d[0],d[1],d[2]),E.setMatrixAt(r,D);let p=(u(i,a,o,k)-.5)*2*(l.jitter??.06);O.setHex(l.hex).multiplyScalar(1+p),l.emissive&&(O.multiplyScalar(l.emissive),A.push(r)),E.setColorAt(r,O);let m=[0,0,0];F.forEach((e,t)=>{let n=i+e.n[0],r=a+e.n[1],s=o+e.n[2];for(let i=0;i<4;i++){let a=i&1?1:-1,o=i&2?1:-1,l=c(n+a*e.u[0],r+a*e.u[1],s+a*e.u[2]),u=c(n+o*e.v[0],r+o*e.v[1],s+o*e.v[2]),d=c(n+a*e.u[0]+o*e.v[0],r+a*e.u[1]+o*e.v[1],s+a*e.u[2]+o*e.v[2]),f=l&&u?0:3-(l+u+d);m[t>>1]+=f*2**((t&1)*8+i*2)}}),x.set(m,r*3);let h=n?n(i,a,o,d,s):null,g=h?.from??[0,0,0];S.set([h?.tIn??-1e6,h?.durIn??.3,g[0],g[2]],r*4),C.set([h?.tOut??1e6,h?.durOut??.6,h?.spin??u(i,o,a,k+3),g[1]],r*4),w.set(h?.vel??[0,0,0],r*3)}g.setAttribute(`aAO`,new y(x,3)),g.setAttribute(`aIn`,new y(S,4)),g.setAttribute(`aOut`,new y(C,4)),g.setAttribute(`aVel`,new y(w,3));let j={value:0},M=i.aoMin??.42,N={value:i.floor??-1e6},L=i.engrave,R=e=>`vec3(${e.map(e=>e.toFixed(4)).join(`,`)})`;T.onBeforeCompile=i.unlit?e=>I(e,j,!1,N,s):e=>{I(e,j,!0,N,s),L&&(e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWP; varying vec3 vWN;`).replace(`#include <project_vertex>`,`vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;
          vWN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * objectNormal);
          #include <project_vertex>`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
varying vec3 vWP; varying vec3 vWN;`).replace(`#include <opaque_fragment>`,`#include <opaque_fragment>
          {
            float L = dot(gl_FragColor.rgb, vec3(0.2126, 0.7152, 0.0722));
            // lines lit mostly by red light (a signal-red lamp) are cut in the signal
            float redL = ${L.redLight?`smoothstep(0.45, 0.8, (gl_FragColor.r - max(gl_FragColor.g, gl_FragColor.b)) / max(gl_FragColor.r, 1e-3))`:`0.0`};
            vec3 lineCol = mix(${R(L.bone)}, ${R(L.signal)} * 0.75, redL);
            vec3 an = abs(vWN), col;
            if (${L.grid===!1?`false`:`an.y > 0.6`}) {
              // floors: a hairline grid on the slab module (pdoom's grid floors), brighter where lit
              vec2 q = vWP.xz / ${(L.spacing*4.5).toFixed(4)};
              vec2 gd = abs(fract(q - 0.5) - 0.5) / max(fwidth(q), vec2(1e-4));
              float line = 1.0 - min(min(gd.x, gd.y) / 0.9, 1.0);
              line *= 1.0 - smoothstep(0.15, 0.45, max(fwidth(q).x, fwidth(q).y));
              col = ${R(L.ink)} + lineCol * line * clamp(0.1 + L * ${(L.gain??1).toFixed(3)} * 0.9, 0.0, 0.85);
            } else {
              // walls: horizontal courses, thicker where brighter (the engraver's tone)
              float coord = (an.y > 0.6 ? (vWP.x + vWP.z) * 0.7071 : vWP.y) / ${L.spacing.toFixed(4)};
              float hw = 0.5 * clamp(pow(max(L, 0.0) * ${(L.gain??1).toFixed(3)}, 1.35), 0.0, 0.6);
              float d = abs(fract(coord) - 0.5), aa = fwidth(coord) * 0.9;
              float line = 1.0 - smoothstep(hw - aa, hw + aa, d);
              line = mix(line, hw * 2.0, smoothstep(0.22, 0.5, aa)); // too dense to resolve: the average tone
              col = ${R(L.ink)} + lineCol * line * (0.55 + 0.45 * clamp(L, 0.0, 1.0));
            }
            if (engBase.r > 0.3 && engBase.g < 0.1 && engBase.b < 0.1) col = ${R(L.signal)} * (0.55 + 0.9 * clamp(L, 0.0, 1.0));
            gl_FragColor.rgb = col;
          }`)),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>
varying float vAO; varying vec3 vLoc; varying vec3 vNrm;`).replace(`#include <color_fragment>`,`#include <color_fragment>
        vec3 engBase = diffuseColor.rgb;
        diffuseColor.rgb *= mix(${M.toFixed(3)}, 1.0, vAO * vAO * 0.35 + vAO * 0.65);
        // block edges: a thin darker bevel on every face reads each block as a crafted piece
        vec3 an = abs(vNrm); vec2 fc = an.x > 0.5 ? vLoc.yz : (an.y > 0.5 ? vLoc.xz : vLoc.xy);
        float ed = max(abs(fc.x), abs(fc.y));
        diffuseColor.rgb *= 1.0 - ${(L?0:i.bevel??.14).toFixed(3)} * smoothstep(0.40, 0.5, ed);`)},T.customProgramCacheKey=()=>`vox-${i.unlit?`unlit`:M}-${s}-${i.bevel??.14}-${L?JSON.stringify(L):``}`;let z=new b({depthPacking:h});z.onBeforeCompile=e=>I(e,j,!1,N,s),z.customProgramCacheKey=()=>`vox-depth-${s}`,E.customDepthMaterial=z;let B=new d;return B.onBeforeCompile=e=>I(e,j,!1,N,s),B.customProgramCacheKey=()=>`vox-normal-${s}`,E.userData.normalMat=B,E.castShadow=i.castShadow??!0,E.receiveShadow=i.receiveShadow??!0,E.frustumCulled=!1,E.userData.uTime=j,E.userData.uFloor=N,E.userData.count=m,E}function R(e,t,n){let r=document.createElement(`canvas`),i=r.getContext(`2d`,{willReadFrequently:!0});i.font=t.replace(/\d+px/,`${n}px`);let a=Math.ceil(i.measureText(e).width)+4,o=Math.ceil(n*1.3);r.width=a,r.height=o,i.font=t.replace(/\d+px/,`${n}px`),i.fillStyle=`#fff`,i.textBaseline=`alphabetic`,i.fillText(e,2,Math.round(n*1));let s=i.getImageData(0,0,a,o).data,c=[];for(let e=0;e<o;e++)for(let t=0;t<a;t++)s[(e*a+t)*4+3]>110&&c.push({u:t,v:o-1-e});return c}var z=(e,t)=>1.6*Math.sin(e*.18)*Math.cos(t*.15)+.8*Math.sin(e*.05+t*.07),B=class extends T{scene=new f;cam=new g(40,c/S,.1,400);g=new k;dof=new A;path;init(){E(this.ctx.renderer);let[e,t,o]=m.ink;this.scene.background=new a(e*2,t*2,o*2.6),this.scene.fog=new n(this.scene.background,30,120);let s=new r(16773600,2.6);s.position.set(-20,30,10),s.castShadow=!0,s.shadow.mapSize.set(2048,2048),Object.assign(s.shadow.camera,{left:-40,right:40,top:40,bottom:-40,near:1,far:120}),this.scene.add(s,new i(9347784,2760728,.9));let c=M({x0:-80,z0:-80,x1:80,z1:40,res:64,h:z,color:(e,t,n,r)=>new a().setHSL(.08,.25,.18+.05*t+.1*(1-r))}),l=new x(c,new v({vertexColors:!0,flatShading:!0,roughness:.95}));l.receiveShadow=!0,this.scene.add(l);let u=R(`XM`,w(C.archivo(100,900),32),32),d=.12,f=Math.max(...u.map(e=>e.u))+1,p=N.cover(d,[-f*d/2,z(0,0),-1],[f*d/2,z(0,0)+12,-.040000000000000036]);for(let e of u)for(let t=0;t<8;t++)p.set(e.u,e.v,t,1);let h=L(p,[{hex:0},{hex:16731410}],null,{castShadow:!0});this.scene.add(h);let{start:g,end:_}=this.ctx;this.path=new O([{t:g,p:[-14,6,26],at:[0,z(0,0)+3,0],fov:40},{t:_,p:[6,4,13],at:[0,z(0,0)+3,0],fov:34}])}render(e,t){let n=this.path.at(e.t);return n.fov-=1.2*e.a.kick,D(this.cam,n),this.g.render(this.ctx.renderer,this.scene,this.cam,this.scene.background),this.dof.focus=this.cam.position.distanceTo(new s(0,z(0,0)+3,0)),this.dof.aperture=30,this.dof.render(this.ctx.renderer,this.g.color,this.g.rt.depthTexture,this.cam,t),{bloom:.6,vignette:.3}}};export{B as default};