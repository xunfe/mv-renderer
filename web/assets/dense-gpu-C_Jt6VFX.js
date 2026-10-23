import{n as e,t}from"./type-SGpGH0z0.js";import{fn as n,g as r,in as i,mn as a,ot as o,pn as s,q as c}from"./three.core-D_1riXuZ.js";import{n as l}from"./gl-DWH67x7m.js";var u=400,d=250,f=class{pass;mask;focus=[0,0];constructor(u,d){let f=document.createElement(`canvas`);f.width=400,f.height=250;let p=f.getContext(`2d`,{willReadFrequently:!0}),m=new Uint8Array(4e5),h=t.archivo(100,900),g=u.length,_=162/g;u.forEach((t,n)=>{p.clearRect(0,0,400,250),p.fillStyle=`#fff`;let r=_*1.05;p.font=e(h,r);let i=p.measureText(t).width;i>344&&(r*=344/i,p.font=e(h,r),i=p.measureText(t).width);let a=Math.round((400-i)/2),o=Math.round(44+_*(n+1)-_*.1);d&&n===g-1&&this.zhCells(p,m,d,r,o,a),p.font=e(h,r),p.fillStyle=`#fff`,p.fillText(t,a,o);let s=p.getImageData(0,0,400,250).data;if(n===0){let e=Math.round(o-r*.36);for(let t=0;t<400;t++)if(s[(e*400+t)*4+3]>100){let n=t+3,r=249-e;this.focus=[n+Math.floor(n/20)*1.2+.5-422.8/2,r+Math.floor(r/10)*2+.5-149];break}}for(let e=0;e<250;e++)for(let t=0;t<400;t++)if(s[(e*400+t)*4+3]>100){let r=((249-e)*400+t)*4;m[r]=255,m[r+1]=Math.round((t-a)/Math.max(1,i)*255),m[r+2]=n*64,m[r+3]=255}}),this.mask=new r(m,400,250,o,i),this.mask.magFilter=c,this.mask.minFilter=c,this.mask.needsUpdate=!0,this.pass=new l(`
      uniform sampler2D mask; uniform vec2 camC; uniform float camZ; uniform float camRot; uniform float t;
      uniform vec4 prog; uniform vec3 ghost; uniform vec4 beatT; uniform float detail; uniform float heatK; uniform float lit;
      const vec2 G = vec2(400.0, 250.0);
      // floor layout: pods of 20 columns (gap 1.2), rack rows of 10 (aisle 2.0)
      vec2 cellToWorld(vec2 c) {
        return vec2(c.x + floor(c.x / 20.0) * 1.2, c.y + floor(c.y / 10.0) * 2.0);
      }
      const vec2 WSIZE = vec2(400.0 + 19.0 * 1.2, 250.0 + 24.0 * 2.0);
      void main() {
        vec2 px = (vUv - 0.5) * vec2(1920.0, 1080.0);
        vec2 w = rot2(camRot) * px / camZ + camC + WSIZE * 0.5; // world units (1 = cell pitch)
        // invert layout: find pod/rack
        float podW = 20.0 + 1.2, rackH = 10.0 + 2.0;
        float pod = floor(w.x / podW), rack = floor(w.y / rackH);
        vec2 inPod = vec2(w.x - pod * podW, w.y - rack * rackH);
        vec2 cell = vec2(pod * 20.0 + floor(inPod.x), rack * 10.0 + floor(inPod.y));
        vec2 f = fract(inPod);
        bool valid = inPod.x < 20.0 && inPod.y < 10.0 && cell.x >= 0.0 && cell.y >= 0.0 && cell.x < G.x && cell.y < G.y;
        vec3 col = C_INK * 0.9;
        // floor: faint tile grid in aisles
        vec2 tile = fract(w / 3.0);
        float fw = fwidth(w.x) / 3.0;
        col += C_GRAPHITE * 0.05 * pxLine(min(tile.x, tile.y), 0.0, fw * 1.5);
        if (valid) {
          vec4 m = texture(mask, (cell + 0.5) / G);
          float wi = floor(m.b * 4.0 + 0.5);
          float pr = wi < 0.5 ? prog.x : (wi < 1.5 ? prog.y : prog.z);
          float isTxt = step(0.5, m.r) * step(m.g, pr) * step(0.0001, pr);
          float ghostTxt = step(0.5, m.r) * (1.0 - isTxt) * (wi < 0.5 ? ghost.x : (wi < 1.5 ? ghost.y : ghost.z));
          // activity: travelling waves + beat rings + hashed flicker
          float h = hash12(cell);
          vec2 cc = cell - G * 0.5;
          float a = 0.5 + 0.5 * sin(dot(cc, vec2(0.035, 0.021)) - t * 5.0 + h * 0.8);
          a *= 0.5 + 0.5 * sin(dot(cc, vec2(-0.012, 0.041)) + t * 3.3);
          for (int i = 0; i < 4; i++) {
            float dt = t - beatT[i];
            if (dt > 0.0 && dt < 1.2) {
              float r = dt * 260.0;
              float d = length(cc * vec2(1.0, 1.25));
              float fr = d - r;
              a += (exp(-pow(fr / 3.5, 2.0)) * 1.4 + step(fr, 0.0) * exp(fr / 30.0) * 0.35) * exp(-dt * 2.2);
            }
          }
          float flick = step(0.975, hash12(cell + floor(t * 24.0)));
          a = clamp(a * (0.7 + 0.45 * h) + flick * 0.3, 0.0, 1.4) * heatK;
          // cell body (square with a 12% gap), die + HBM detail at close range
          vec2 q = f - 0.5;
          float aa = fwidth(q.x) * 1.2;
          // the cell edge keeps its 1x softness in logical px (the colour is ~body^2, so a sharper edge brightens the floor)
          float aaB = aa * PX_SCALE;
          float body = 1.0 - smoothstep(0.41 - aaB, 0.41 + aaB, max(abs(q.x), abs(q.y)));
          float die = 1.0 - smoothstep(0.16 - aa, 0.16 + aa, max(abs(q.x), abs(q.y)));
          vec2 hq = abs(q) - vec2(0.27, 0.27);
          float hbm = (1.0 - smoothstep(0.05 - aa, 0.05 + aa, max(abs(hq.x), abs(hq.y) - 0.04))) * detail;
          float led = (1.0 - smoothstep(0.03 - aa, 0.03 + aa, length(q - vec2(0.32, -0.32)))) * detail;
          vec3 idle = C_INK2 * 1.6 + C_GRAPHITE * 0.12;
          vec3 hot = heat(clamp(a * 0.62, 0.0, 0.9));
          vec3 c = idle * body;
          c = mix(c, hot * 0.9 + idle * 0.3, body * (1.0 - detail * 0.55) * smoothstep(0.05, 0.9, a));
          c += hot * die * detail * (0.6 + a);
          c += C_GRAPHITE * 0.5 * hbm;
          c += C_EMBER * 2.0 * led * step(0.5, fract(h * 13.0 + t * 2.0));
          // lyric cells: solid bone, slightly glowing edge
          c = mix(c, C_BONE * (0.92 + 0.08 * die) * lit, isTxt * body);
          c = mix(c, C_BONE * 0.22, ghostTxt * body);
          col = mix(col, c, body) + c * (1.0 - body) * 0.0;
        }
        fragColor = vec4(col, 1.0);
      }
    `.replace(`uniform float lit;`,d?`uniform float lit; uniform float ghostW;`:`uniform float lit;`).replace(`(wi < 1.5 ? prog.y : prog.z)`,d?`(wi < 1.5 ? prog.y : (wi < 2.5 ? prog.z : prog.w))`:`(wi < 1.5 ? prog.y : prog.z)`).replace(`(wi < 1.5 ? ghost.y : ghost.z)`,d?`(wi < 1.5 ? ghost.y : (wi < 2.5 ? ghost.z : ghostW))`:`(wi < 1.5 ? ghost.y : ghost.z)`),{mask:{value:this.mask},camC:{value:new n},camZ:{value:4},camRot:{value:0},t:{value:0},prog:{value:new a},ghost:{value:new s},beatT:{value:new a(-9,-9,-9,-9)},detail:{value:1},heatK:{value:1},lit:{value:1},...d?{ghostW:{value:0}}:{}})}zhCells(t,n,r,i,a,o){let s=Math.min(...r.glyphs.map(e=>e.x)),c=Math.max(...r.glyphs.map(e=>e.x+e.w)),l=i*.16,u=Math.min(i*.62,(o-l-38)*r.size/(c-s)),d=u/r.size,f=(c-s)*d,p=Math.round(o-l-f),m=Math.round(a-(.343*i-.38*u));t.clearRect(0,0,400,250),t.fillStyle=`#fff`;for(let n of r.glyphs)t.font=e(n.family,n.size*d),t.fillText(n.ch,p+(n.x-s)*d,m);let h=t.getImageData(0,0,400,250).data;for(let e=0;e<250;e++)for(let t=0;t<400;t++){if(h[(e*400+t)*4+3]<=100)continue;let r=((249-e)*400+t)*4;n[r]=255,n[r+1]=Math.round(Math.min(1,Math.max(0,(t+.5-p)/Math.max(1,f)))*255),n[r+2]=192,n[r+3]=255}t.clearRect(0,0,400,250)}get worldSize(){return[422.8,298]}};export{u as GX,d as GY,f as GpuFloor};