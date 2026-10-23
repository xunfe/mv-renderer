import{Dt as e,Ot as t,T as n,Z as r,j as i,n as a,w as o}from"./gl-DcsgeOjJ.js";import{n as s,r as c}from"./index-CQqHSO2_.js";var l=class{ramp;cover;aspect;texture;get n(){return this.ramp.length}constructor(e={}){let t=e.chars??" .'`,:;-~=+*!?/|()[]{}<>il1tfjrxnuvczXYUJCLQ0OZmwqpdbkhao#MW&8%B@$",n=e.family??s.mono(500),a=new Intl.Segmenter(`ja`,{granularity:`grapheme`}),o=[...new Set([` `,...[...a.segment(t)].map(e=>e.segment)])],l=document.createElement(`canvas`).getContext(`2d`,{willReadFrequently:!0});l.font=c(n,55.04);let u=Math.max(...o.map(e=>l.measureText(e).width),25.6),d=Math.ceil(u);this.aspect=d/64;let f=document.createElement(`canvas`);f.width=d,f.height=64;let p=f.getContext(`2d`,{willReadFrequently:!0}),m=e=>{p.clearRect(0,0,d,64),p.font=l.font,p.fillStyle=`#fff`,p.textAlign=`center`,p.textBaseline=`middle`,p.fillText(e,d/2,34.56);let t=p.getImageData(0,0,d,64).data,n=0;for(let e=3;e<t.length;e+=4)n+=t[e];return n/(255*d*64)},h=o.map(e=>({ch:e,c:e===` `?0:m(e)})).filter(e=>e.ch===` `||e.c>.002);h.sort((e,t)=>e.c-t.c);let g=[];for(let e of h)(!g.length||e.c-g[g.length-1].c>.004)&&g.push(e);this.ramp=g.map(e=>e.ch),this.cover=g.map(e=>e.c);let _=document.createElement(`canvas`);_.width=d*g.length,_.height=64;let v=_.getContext(`2d`);v.font=l.font,v.fillStyle=`#fff`,v.textAlign=`center`,v.textBaseline=`middle`,g.forEach((e,t)=>v.fillText(e.ch,d*t+d/2,34.56)),this.texture=new i(_),this.texture.colorSpace=``,this.texture.minFilter=r,this.texture.generateMipmaps=!0,this.texture.anisotropy=4}level(e){return e<=0?0:Math.min(this.n-1,Math.max(1,Math.round(e*(this.n-1))))}},u=class{glyphs;get ramp(){return this.glyphs.ramp}get aspect(){return this.glyphs.aspect}pass;constructor(r={}){this.glyphs=new l(r);let i=this.glyphs.ramp;this.pass=new a(`
      uniform sampler2D src, atlas; uniform vec2 cellPx, gridOff, res; uniform float n, gain, gam, thr, dither, boost, mono;
      uniform vec3 ink, paper;
      void main() {
        vec2 px = FRAG_PX + gridOff;
        vec2 cid = floor(px / cellPx), inC = fract(px / cellPx);
        // the cell's colour: 4 taps inside it
        vec3 c = vec3(0.0);
        for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++)
          c += texture(src, ((cid + vec2(0.25 + 0.5 * float(i), 0.25 + 0.5 * float(j))) * cellPx - gridOff) / res).rgb;
        c *= 0.25;
        float l = pow(max(luma(c) * gain, 0.0), gam);
        l += (hash12(cid * 1.37 + 3.1) - 0.5) * dither / max(n - 1.0, 1.0);
        float gi = l < thr ? 0.0 : clamp(floor(l * (n - 1.0) + 0.5), 1.0, n - 1.0);
        float cov = texture(atlas, vec2((gi + inC.x) / n, inC.y)).a;
        float mx = max(max(c.r, c.g), c.b);
        vec3 gc = mono > 0.5 ? ink * (0.55 + 0.45 * sat(l)) : c / max(mx, 0.04) * (0.5 + 0.5 * sat(mx * 2.0));
        fragColor = vec4(mix(paper, gc * boost, cov), 1.0);
      }`,{src:{value:null},atlas:{value:this.glyphs.texture},cellPx:{value:new e},gridOff:{value:new e},res:{value:new e(n,o)},n:{value:i.length},gain:{value:1},gam:{value:1},thr:{value:.04},dither:{value:.6},boost:{value:1},mono:{value:0},ink:{value:new t},paper:{value:new t}})}render(e,t,n,r={}){let i=this.pass.u,a=r.cell??18;i.src.value=t,i.cellPx.value.set(a*this.aspect,a),i.gridOff.value.set(...r.offset??[0,0]),i.gain.value=r.gain??1,i.gam.value=r.gamma??1,i.thr.value=r.threshold??.04,i.dither.value=r.dither??.6,i.boost.value=r.boost??1,i.mono.value=+(r.mode===`mono`),i.ink.value.set(...r.ink??[.2,1,.45]),i.paper.value.set(...r.paper??[0,0,0]),this.pass.render(e,n)}};export{l as n,u as t};