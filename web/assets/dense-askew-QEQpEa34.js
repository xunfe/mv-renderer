import{i as e,n as t,t as n}from"./type-SGpGH0z0.js";import{fn as r}from"./three.core-D_1riXuZ.js";import{i,n as a}from"./lang-BeSG418I.js";import{_ as o,a as s,c,h as l,i as u,m as d,n as f,r as p}from"./util-BFmWaMH0.js";import{r as m}from"./palette-BceqUlax.js";import{l as h,n as g,r as _}from"./gl-DWH67x7m.js";import{c as v,n as y}from"./index-CEKwgIpg.js";import{i as b}from"./_motifs-DSJUrUBe.js";import{beatsIn as x,drawZhRun as S,rgb255 as C}from"./stack-kit-DYHSiXvd.js";var w=16,T=12,E=.07,D=-.12,O=class{pass;constructor(){this.pass=new g(`
      uniform vec2 home; uniform float R; uniform float t; uniform float reach;
      uniform float camRoll; uniform float camZoom; uniform vec2 camPan; uniform vec2 camShake;
      uniform float eyeOpen; uniform float eyeLook; uniform float glow; uniform float throb;
      uniform float gridShear; uniform float gridA; uniform float horizonY;
      // tentacle centre line point (mask units, y down), s in 0..1
      vec2 tpt(int i, float s) {
        float fi = float(i);
        float th = fi / ${w}.0 * TAU + hash11(fi * 3.1) * 1.2;
        float curl = (hash11(fi * 7.7) - 0.5) * 4.0;
        float r0 = 0.05 + 0.45 * hash11(fi * 2.3);
        float ext = (0.88 - r0) + reach * (0.22 + 0.4 * hash11(fi * 1.9)) * step(0.22, hash11(fi * 4.1));
        float r = r0 + ext * s;
        float ph = th + curl * s + (0.25 + 0.12 * reach) * sin(t * (1.3 + hash11(fi) * 0.9) + fi * 1.7 + s * 4.0) * s * (0.4 + reach);
        return vec2(cos(ph), sin(ph)) * r;
      }
      float twidth(int i, float s) { return (0.22 + 0.13 * hash11(float(i) * 5.3)) * (1.0 + 0.1 * throb) * mix(1.0, 0.16, pow(s, 1.2)); }
      /** Anti-aliased hairline at integer u (about 1 px wide on screen). */
      float hair(float u) { float d = abs(fract(u + 0.5) - 0.5) / max(fwidth(u), 1e-5); return pxLine(d, 0.35, 1.2); }
      void main() {
        vec2 px = vUv * vec2(1920.0, 1080.0);
        px.y = 1080.0 - px.y; // y down like Canvas2D
        vec2 c = vec2(960.0, 540.0);
        vec2 q = c + camPan + rot2(camRoll) * (px - c - camShake) / camZoom; // screen -> world
        vec2 p = (q - home) / R;          // mask units
        // background: ink with a leaning registration grid (sheared about the horizon)
        vec3 col = C_INK;
        vec2 g = vec2(q.x - gridShear * (q.y - horizonY), q.y - horizonY) / 120.0;
        float gl = max(hair(g.x), hair(g.y));
        float gm = max(hair(g.x / 4.0), hair(g.y / 4.0));
        col += C_GRAPHITE * (gl * 0.05 + gm * 0.07) * gridA;
        float rr = length(p);
        if (rr < 2.8) {
          // the mass: a dark body (radius ~1.02) + tubes
          float bang = atan(p.y, p.x);
          float bodyD = rr - (0.97 + 0.05 * sin(bang * 6.0 + 1.3) + 0.03 * sin(bang * 11.0 - t * 0.7));
          // nearest point on each tube (min over its segments); higher-index tubes lie on top
          float bc = 1.0; float bs = 0.0; float bi = -1.0; float bside = 0.0; float bu = 0.0; float bw = 0.1; float under = 0.0; vec2 bn = vec2(0.0);
          for (int i = 0; i < ${w}; i++) {
            vec2 a = tpt(i, 0.0);
            float acc = 0.0;
            float ci = 1e9, cs = 0.0, cside = 0.0, cu = 0.0, cw = 0.1; vec2 cn = vec2(0.0);
            for (int k = 1; k < ${T}; k++) {
              float s1 = float(k) / 11.0;
              vec2 b = tpt(i, s1);
              vec2 pa = p - a, ba = b - a;
              float L = length(ba);
              float h = clamp(dot(pa, ba) / (L * L), 0.0, 1.0);
              vec2 d = pa - ba * h;
              float s = s1 - (1.0 - h) / 11.0;
              float w = twidth(i, s);
              float cc = length(d) / w;
              if (cc < ci) { ci = cc; cs = s; cside = sign(ba.x * d.y - ba.y * d.x); cu = acc + h * L; cw = w; cn = d / w; }
              acc += L;
              a = b;
            }
            if (ci < 1.0) { if (bi >= 0.0) under = 1.0; bc = ci; bs = cs; bi = float(i); bside = cside; bu = cu; bw = cw; bn = cn; }
          }
          float inBody = 1.0 - smoothstep(-0.01, 0.01, bodyD);
          float inTube = step(0.0, bi);
          if (inBody > 0.0 || inTube > 0.0) {
            vec3 m = C_INK * 0.55;
            if (inTube > 0.0) {
              // scratchboard engraving (as FIG. 4): bone lines cut into black, rings around the tube
              // that bow with its curvature, wider where lit; a second set along the tube in the
              // highlights; the back-lit edge turns ember; an ink contour where tubes overlap
              float ac = bside * bc;                 // -1..1 across the tube
              float z = sqrt(max(0.0, 1.0 - bc * bc));
              // one key light from the upper left (mask space, y down), like the rest of the treatise
              vec3 nrm = vec3(bn, z);
              float light = sat(dot(nrm, normalize(vec3(-0.6, -0.7, 0.5))) * 1.15);
              float sp = 0.026;
              float u = (bu - 0.55 * bw * z) / sp;
              u += 0.22 * sin(bu * 7.0 + bi * 1.7) + 0.08 * sin(asin(clamp(ac, -1.0, 1.0)) * 3.0 + bi); // hand-cut wobble
              float wA = pow(light, 1.3) * 0.46;
              float la = hatch(u, wA);
              float lb = hatch(asin(clamp(ac, -1.0, 1.0)) * 5.0 + bi * 0.37, sat(light * 2.5 - 2.2) * 0.45);
              float lines = max(la, lb);
              vec3 cc3 = C_BONE * lines * (0.3 + 0.5 * light);
              float rim = smoothstep(0.7, 0.98, bc) * smoothstep(0.1, 0.6, dot(normalize(bn + 1e-5), normalize(vec2(0.6, 0.7))));
              float rl = hatch(u, rim * 0.8);
              cc3 = mix(cc3, C_EMBER * 1.2 * max(rl, lines), smoothstep(0.08, 0.6, rim) * glow);
              cc3 += C_SIGNAL * 0.9 * pow(rim, 3.0) * glow;
              // the tip fades into the dark (tentacles taper away from the light)
              cc3 *= 1.0 - 0.5 * smoothstep(0.6, 1.0, bs);
              // silhouette contour (strong where this tube crosses another)
              cc3 *= 1.0 - (0.55 + 0.4 * under) * smoothstep(0.9, 0.995, bc);
              m = C_INK * 0.12 + cc3;
            } else {
              // body between tubes: contour lines around the core, lit from upper left
              vec2 bp = p;
              float lb2 = sat(0.35 - 0.45 * (bp.x + bp.y) / max(0.2, length(bp)) * smoothstep(0.1, 0.9, rr));
              float e = hatch(rr / 0.028 + 0.8 * sin(bang * 5.0 + rr * 6.0) + 0.3 * sin(bang * 13.0), lb2 * 0.35);
              m = C_INK * 0.1 + C_BONE * 0.13 * e * lb2;
            }
            // the eye (upper left of the mass)
            vec2 ep = p - vec2(-0.5, -0.62);
            float er = 0.25;
            float lid = abs(ep.y) - er * eyeOpen * sqrt(max(0.0, 1.0 - pow(ep.x / er, 2.0)));
            if (length(ep / vec2(1.0, 0.75)) < er * 1.05 && eyeOpen > 0.01 && lid < 0.0) {
              vec2 ip = ep - vec2(eyeLook * 0.06, 0.0);
              float ir = length(ip);
              float ang = atan(ip.y, ip.x);
              float fib = 0.5 + 0.5 * sin(ang * 60.0 + hash11(floor(ang * 9.0)) * 6.0);
              ip /= 1.25;
              ir = length(ip);
              // sclera: engraved rings around the iris, dim bone, lit from the upper left
              float sl = sat(0.55 - 2.2 * (ip.x + ip.y));
              vec3 sclera = C_INK * 0.15 + C_BONE * 0.45 * hatch(ir / 0.017, sl * 0.7) * sl;
              vec3 iris = mix(C_BLOOD, C_EMBER * 1.8, fib * smoothstep(0.13, 0.03, ir)) * 1.3 * (0.8 + 0.4 * glow);
              float pupil = step(abs(ip.x), 0.018 + 0.012 * eyeOpen) * step(ir, 0.12);
              vec3 ec = mix(sclera, iris, smoothstep(0.125, 0.115, ir));
              ec = mix(ec, C_INK * 0.1, pupil);
              ec += C_BONE * 2.0 * smoothstep(0.022, 0.0, length(ip - vec2(-0.04, -0.045)));
              m = ec;
            } else if (eyeOpen > 0.01 && abs(lid) < 0.012 && length(ep) < er * 1.1) {
              m = C_SIGNAL * 1.2 * glow;
            }
            col = m;
          }
        }
        fragColor = vec4(col, 1.0);
      }
    `,{home:{value:new r(960,540)},R:{value:300},t:{value:0},reach:{value:0},camRoll:{value:0},camZoom:{value:1},camPan:{value:new r},camShake:{value:new r},eyeOpen:{value:0},eyeLook:{value:0},glow:{value:1},throb:{value:0},gridShear:{value:0},gridA:{value:1},horizonY:{value:820}})}};function k(e,t,n,r){let i=t[0][1];for(let a=1;a<t.length;a++){let[s,c]=t[a];if(e<=s)break;i+=(c-t[a-1][1])*o(e-s,n,r)}return i}var A=820,j=250,M={x:1470,y:570},N={x:124,base:430,size:280},P={x:132,base:536,size:88},F={x:290,size:250},I=.686,L={x:680,size:80,drop:100},R=C(`signal`),z=C(`bone`),B=class{thing=new O;t0;end;beats;wR;wG;wA;tSkew;bG;bA;bC;bS;bE;bW;rollK;leanK;maskS;maskA;reachK;rewardK;kicks;layR;zh=null;constructor(t,r,i,a){this.t0=i,this.end=a,this.beats=x(t,i-.02,a+.5),[this.wR,this.wG,this.wA]=r.words;let o=t.events(`vocal`,this.wA.start+.08,this.wA.start+.5)[0];this.tSkew=o?o[0]:this.wA.start+.2;let s=this.beats.filter(e=>e<a-.1),c=e=>s.find(t=>t>=e-.07)??e;this.bG=c(this.wG.start),this.bA=c(this.wA.start);let l=s.filter(e=>e>this.bA+.05);this.bW=l[l.length-1]??a-.45,this.bC=l[0]??this.bA+.45,this.bS=l[1]??this.bC+.45,this.bE=l[2]??this.bS+.45,this.bE>=this.bW&&(this.bE=this.bS),this.kicks=s;let u=s[1]??i+.45;this.rollK=[[i,E],[u,.115],[this.bG,.16],[this.bA,.19],[this.bC,.085],[this.bS,.23],[this.bE,.3],[this.bW,D]],this.leanK=[[i,0],[this.bA,1],[this.bC,.35],[this.bS,1.6],[this.bE,2.4],[this.bW,-1.2]],this.maskS=[[i,0],[this.bG,.32],[this.bA,.95],[this.bC,.45],[this.bS,1.45],[this.bE,2.05],[this.bW+.05,.1]],this.maskA=[[i,0],[this.bG,.42],[this.bA,1.25],[this.bC,.55],[this.bS,1.95],[this.bE,2.7],[this.bW+.05,-Math.PI-.16]],this.reachK=[[i,0],[this.bA,.5],[this.bC,.25],[this.bS,.95],[this.bE,1.35],[this.bW,1.1]],this.rewardK=[[i,.99],[this.bG,.94],[this.bA,.81],[this.bC,.93],[this.bS,.64],[this.bE,.41],[this.bW+.12,.99]],this.layR=e(this.letters(this.wR).join(``),n.archivo(100,900),N.size);let d=y(),f=d?.get(r.i),p=f&&d.set(f,{cjk:`NotoSansSC-900`,latin:n.archivo(100,900),size:L.size,latinScale:1});f&&p&&(this.zh={z:f,S:p})}drawZh(e,t,n,r){let i=y(),a=this.zh;if(!i||!a)return;let o=d(t,this.wR.start-.45,this.wR.start-.3);if(o<=0)return;let s=A+L.drop,c=this.rollLag(t,1.6)-r,l=this.wR.end+.08;S(e,i,a.z,a.S,t,L.x,s,L.size,{base:z,hot:R,dim:.3,alpha:o,sung:e=>e.seg===0?t<l?R:void 0:R,each:(t,r,i,o)=>{if(t.seg===0){let t=r.lit>0?1+.32*(1-r.lit)**2:1;e.translate(o/2,-.35*L.size),e.scale(t,t),e.translate(-o/2,.35*L.size);return}let s=i-a.S.glyphs.findIndex(e=>e.seg===t.seg),l=p.outBack(r.lit,2)*(.05+.045*s+(.022+.018*s)*n)+c*(.5+.2*s)*r.lit,u=l>=0?o:0;e.translate(u,0),e.rotate(l),e.translate(-u,0)}}),i.drawGloss(e,a.z.i,t,L.x,s+.36*L.size+26,{size:17,base:`bone`,env:`always`,alpha:o})}letters(e){return e.w.replace(/[^A-Za-z]/g,``).toUpperCase().split(``)}roll(e){return k(e,this.rollK,3,.42)}lean(e){return k(e,this.leanK,2,.3)}cam(e){let t=this.roll(e),n=[this.bG,this.bA,this.bC,this.bS,this.bE,this.bW],r=0;n.forEach((t,n)=>{r=Math.max(r,l(e,t,.06)*(n===5?1:n===2?.8:.55))});for(let t of this.kicks)r=Math.max(r,l(e,t,.05)*.25);let i=.05*(1-p.outExpo(d(e,this.t0,this.t0+.35)));return{roll:t,zoom:(1-.3*Math.max(0,t-E))*(1+i+.08*p.inOutCubic(d(e,this.bW,this.end)))+.02*r,pan:[0,-120*Math.max(0,t-E)],hit:r}}applyCam(e,t,n){e.translate(h/2+n[0],_/2+n[1]),e.rotate(t.roll),e.scale(t.zoom,t.zoom),e.translate(-h/2-t.pan[0],-_/2-t.pan[1])}rollLag(e,t=1.7){return k(e,this.rollK,t,.28)}maskState(e){let t=k(e,this.maskS,2.3,.38),n=k(e,this.maskA,2.3,.38);if(e>this.bA&&e<this.bW){let r=[...this.kicks].reverse().find(t=>t<=e)??e;t+=.06*(e-r),n+=.06*(e-r)}let r=this.wR.syl??[[this.wR.start,this.wR.end]],i=0;return r.forEach(([t],n)=>{e>=t&&(i+=(n%2?-1:1)*.07*Math.sin((e-t)*26)*Math.exp(-(e-t)*7))}),{x:M.x+t*j+i*j,y:M.y,a:n+i,s:t}}render(e,t,n,r,i){let{roll:a,zoom:o,pan:m,hit:h}=this.cam(i),g=this.lean(i),_=this.maskState(i),v=Math.max(0,k(i,this.reachK,2,.4)),y=u(i),x=[(s(y,1)-.5)*22*h,(s(y,2)-.5)*16*h],S=this.thing.pass.u;S.home.value.set(M.x,M.y),S.R.value=j,S.t.value=i,S.reach.value=v,S.camRoll.value=a,S.camZoom.value=o,S.camPan.value.set(m[0],m[1]),S.camShake.value.set(x[0],x[1]);let C=p.outBack(d(i,this.bS+.06,this.bS+.22))-.9*l(i,this.bE+.2,.04)*(i>this.bE+.2);S.eyeOpen.value=f(C,0,1.1),S.eyeLook.value=i<this.bE?Math.sin(i*3)*.5:c(.6,-.8,p.inOutCubic(d(i,this.bW,this.bW+.25))),S.glow.value=1+.8*l(i,this.bW,.12),S.throb.value=this.kicks.reduce((e,t)=>Math.max(e,l(i,t,.08)),0),S.gridShear.value=.12*g,S.gridA.value=d(i,this.t0,this.t0+.1),S.horizonY.value=A,this.thing.pass.render(e,t),r.clear();let w=r.ctx,T=this.cross(a,o,x,m);if(this.drawLevel(w,i,a,T,`line`),i>this.bW)for(let e=5;e>=1;e--){let t=i-e*.03;t<this.bW-.02||(w.save(),this.applyCam(w,this.cam(t),[0,0]),this.drawAskew(w,t,this.lean(t),this.roll(t),e),w.restore())}return w.save(),this.applyCam(w,{roll:a,zoom:o,pan:m},x),this.drawHorizon(w,i),this.drawBoxes(w,i,_),b(w,_.x,_.y,j,_.a),this.drawRLHF(w,i,a),this.drawGoes(w,i,a),this.drawAskew(w,i,g,a,0),this.zh&&this.drawZh(w,i,g,a),w.restore(),this.drawPanel(w,i,a),this.drawLevel(w,i,a,T,`label`),n.draw(e,r.upload(),t),{hud:0,bloom:.6,bloomThreshold:1.2,halation:.08,vignette:.45,ca:1.2+2.2*h,zoom:1}}drawHorizon(e,t){let n=d(t,this.t0,this.t0+.12);e.save(),e.fillStyle=m(`bone`,.55*n),e.fillRect(-600,A,h+1200,1.25),e.fillStyle=m(`bone`,.3*n);for(let t=-600;t<h+600;t+=24)e.fillRect(t,821,1,t%120==0?10:5);e.restore()}cross(e,t,n,r){let i=(A-_/2-r[1])*t,a=-r[0]*t,o=Math.cos(e),s=Math.sin(e);return{x:h/2+n[0]+a*o-i*s,y:_/2+n[1]+a*s+i*o}}drawLevel(e,r,o,s,c){let l=d(r,this.t0+.04,this.t0+.16);if(e.save(),c===`line`)e.strokeStyle=m(`bone`,.42*l),e.lineWidth=1,e.setLineDash([7,7]),e.lineDashOffset=-s.x,e.beginPath(),e.moveTo(0,s.y+.5),e.lineTo(h,s.y+.5),e.stroke(),e.setLineDash([]),e.font=t(n.mono(400),a?14:11),e.letterSpacing=a?`1px`:`2px`,e.fillStyle=m(`bone`,.55*l),e.textAlign=`right`,e.fillText(i(`TRUE LEVEL`,`水平基准`),h-110,s.y-9);else{let r=o>=0?-1:1,c=r<0?Math.PI:0,u=c+o;e.strokeStyle=m(`signal`,.95*l),e.lineWidth=1.5,e.beginPath(),e.arc(s.x,s.y,300,Math.min(c,u),Math.max(c,u)),e.stroke();for(let t of[c,u])e.beginPath(),e.moveTo(s.x+Math.cos(t)*293,s.y+Math.sin(t)*293),e.lineTo(s.x+Math.cos(t)*307,s.y+Math.sin(t)*307),e.stroke();e.fillStyle=m(`signal`,l),e.beginPath(),e.arc(s.x,s.y,3.5,0,Math.PI*2),e.fill();let d=o*180/Math.PI;e.font=t(n.mono(500),22),e.letterSpacing=`0px`,e.textAlign=r<0?`right`:`left`,e.textBaseline=`top`;let f=s.x+r*316,p=s.y+12+(r>0?Math.abs(Math.tan(o))*316:0);e.fillText(`${d>=0?`+`:`−`}${Math.abs(d).toFixed(1).padStart(4,`0`)}\u00B0`,f,p),e.font=t(n.mono(400),a?14:11),e.letterSpacing=a?`1px`:`2px`,e.fillStyle=m(`bone`,.6*l),e.fillText(i(`ROLL`,`横滚`),f,p+28)}e.restore()}drawBoxes(e,r,a){let o=(t,n,r,i,a)=>{e.strokeStyle=i,e.lineWidth=a,e.beginPath();for(let[i,a,o,s]of[[t-r,n-r,1,1],[t+r,n-r,-1,1],[t-r,n+r,1,-1],[t+r,n+r,-1,-1]])e.moveTo(i+o*34,a),e.lineTo(i,a),e.lineTo(i,a+s*34);e.stroke()},s=f(1-Math.abs(a.s)/1.6),l=r>=this.bW+.12?.97:c(.41,.99,s);e.save(),e.font=t(n.mono(500),18);let u=f((Math.abs(a.s)-.5)/.4);if(u>0){let t=Math.floor(r*20)%2?1:.55;o(M.x,M.y,j*1.25,m(`signal`,.55*u),1.25),e.fillStyle=m(`signal`,u*t),e.fillText(`█████ ${(1-l+.01).toFixed(2)}`,M.x-j*1.25,M.y+j*1.25+30)}o(a.x,a.y,j*1.12,m(`signal`,.9),2),e.fillStyle=m(`signal`),e.fillText(`${i(`assistant`,`助手`)} ${l.toFixed(2)}`,a.x-j*1.12,a.y-j*1.12-14),e.restore()}drawRLHF(e,r,i){let a=this.wR;if(r<a.start-.45)return;let o=this.letters(a),s=a.syl&&a.syl.length===o.length?a.syl:o.map((e,t)=>[c(a.start,a.end,t/o.length),c(a.start,a.end,(t+1)/o.length)]),l=n.archivo(100,900),u=N.size;e.save(),e.font=t(l,u),o.forEach((t,n)=>{let o=this.layR.glyphs[n],[c]=s[n],l=r>=c,f=.035*n,p=(this.rollLag(r,1.5+.25*n)-i)*(.9+.2*n),h=l?1+.32*(1-d(r,c,c+.1))**2:1,g=N.x+o.x+o.w/2,_=N.base;e.save(),e.translate(g,_-u*I*.5),e.rotate(f+p),e.scale(h,h),e.translate(0,u*I*.5),l?(e.fillStyle=r<a.end+.08?m(`signal`):m(`bone`),e.fillText(t,-o.w/2,0)):(e.strokeStyle=m(`bone`,.45),e.lineWidth=2,e.strokeText(t,-o.w/2,0)),e.restore()}),e.restore()}drawGoes(e,r,i){let a=this.wG;if(r<a.start-.45)return;let o=a.w.toUpperCase(),s=n.archivo(100,700),c=P.size,l=v.wordProgress(a,r),u=240*Math.max(0,k(r,[[this.t0,0],[this.bG,.25],[this.bA,.55],[this.bC,.4],[this.bS,.95],[this.bE,1.45],[this.bW,.3]],2.2,.35)),d=(this.rollLag(r,1.3)-i)*1.2;e.save(),e.font=t(s,c);let f=e.measureText(o).width;e.translate(P.x+u+f/2,P.base),e.rotate(d),e.translate(-f/2,0),e.strokeStyle=m(`bone`,.35),e.lineWidth=1.5,l<1&&e.strokeText(o,0,0),l>0&&(e.save(),e.beginPath(),e.rect(-4,-c,f*l+4,c*1.4),e.clip(),e.fillStyle=r<a.end+.05?m(`signal`):m(`bone`,.95),e.fillText(o,0,0),e.restore()),e.restore()}drawAskew(r,i,a,s,l){let u=this.wA;if(i<u.start-.45)return;let p=this.letters(u),h=[62,75,87.5,100,112.5],g=[this.bA,this.bC,this.bS,this.bE].filter(e=>e>u.start),_=0;g.forEach((e,t)=>{i>=e&&(_=t+1)}),_=Math.min(h.length-1,_);let v=n.archivo(h[_],900),y=n.archivo(h[Math.max(0,_-1)],900),b=F.size,x=e(p.join(``),v,b),S=e(p.join(``),y,b),C=_===0?1:o(i-g[_-1],3,.45),w=c(S.width/x.width,1,C),T=i<u.start?0:i<this.tSkew?d(i,u.start,this.tSkew):1+(p.length-1)*d(i,this.tSkew,this.tSkew+.32),E=i<this.end+1,D=this.rollLag(i,1.6)-s;r.save(),r.font=t(v,b),r.translate(F.x,A),r.scale(w,1),l>0?(r.strokeStyle=l%2?m(`signal`,.85-.12*l):m(`bone`,.7-.1*l),r.lineWidth=1.6/w,this.askLetters(r,p,x,i,a,D,(e,t)=>r.strokeText(e,t,0)),r.restore()):(this.askLetters(r,p,x,i,a,D,(e,t,n)=>{let i=f(T-n);if(i<1&&(r.strokeStyle=m(`bone`,.35),r.lineWidth=2/w,r.strokeText(e,t,0)),i>0){r.save();let a=x.glyphs[n];r.beginPath(),r.rect(t-4,-b,(a.w+8)*i,b*1.3),r.clip(),r.fillStyle=m(E?`signal`:`bone`),r.fillText(e,t,0),r.restore()}}),r.restore())}askLetters(e,t,n,r,i,a,o){let s=t.length;t.forEach((t,c)=>{let l=n.glyphs[c],u=this.wA.start+(c===0?0:this.tSkew-this.wA.start+.32*(c-1)/(s-1)),f=p.outBack(d(r,u-.06,u+.14),2),m=(.03+.045*c)*i*(.4+.6*f)+a*(.6+.25*c),h=m>=0?l.x+l.w:l.x;e.save(),e.translate(h,0),e.rotate(m),e.translate(-h,-(1-f)*60),o(t,l.x,c),e.restore()})}drawPanel(e,r,o){let s=d(r,this.t0+.02,this.t0+.14,p.outCubic),c=f(k(r,this.rewardK,3.5,.5),0,.99);e.save(),e.translate(304,959),e.rotate(o*.5),e.translate(-304,-959),e.globalAlpha=s,e.fillStyle=m(`ink`,.92),e.fillRect(104,900,400,118),e.strokeStyle=m(`bone`,.35),e.lineWidth=1,e.strokeRect(104.5,900.5,400,118),e.font=t(n.mono(500),a?16:13),e.letterSpacing=a?`1px`:`3px`,e.fillStyle=m(`bone`,.6),e.fillText(i(`REWARD MODEL`,`奖励模型`),122,927),e.letterSpacing=`0px`,e.font=t(n.mono(500),46),e.fillStyle=c<.7?m(`signal`):m(`bone`,.95),e.textAlign=`right`,e.fillText(c.toFixed(2),486,970),e.textAlign=`left`;let l=.02*1.9**Math.max(0,(r-this.t0)/.4545);e.font=t(n.mono(400),a?15:13),e.fillStyle=m(`bone`,.6),e.fillText(i(`KL penalty ${l.toFixed(2)} nats`,`KL 惩罚 ${l.toFixed(2)} 奈特`),122,955);let u=this.kicks.filter(e=>e<=r).length;e.fillText(i(`prefs`,`偏好`),122,998);for(let t=0;t<8;t++){let n=174+t*16;t>=u?(e.fillStyle=m(`bone`,.12),e.fillRect(n,988,10,10)):[1,1,1,0,1,0,0,1][t]?(e.fillStyle=m(`bone`,.85),e.fillRect(n,988,10,10)):(e.strokeStyle=m(`signal`,.95),e.strokeRect(n+.5,988.5,9,9))}e.restore()}};export{B as Askew,E as ROLL_IN,O as Thing};