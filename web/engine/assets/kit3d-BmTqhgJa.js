import{Dt as e,F as t,N as n,T as r,V as i,c as a,n as o,nt as s,st as c,u as l,w as u}from"./gl-DcsgeOjJ.js";var d=class{rt;constructor(e=r,n=u){this.rt=a(e,n);let o=new t(this.rt.width,this.rt.height,i);o.minFilter=o.magFilter=c,this.rt.depthTexture=o}render(e,t,r,i=new n(0,0,0)){e.setRenderTarget(this.rt),e.setClearColor(i,1),e.clear(!0,!0,!0),e.render(t,r)}get color(){return this.rt.texture}get depth(){return this.rt.depthTexture}};new s({colorWrite:!1,side:2});var f=class{pass;focus=2;aperture=40;maxBlur=28;constructor(){this.pass=new o(`
      uniform sampler2D colTex, depthTex; uniform float near, far, focus, aperture, maxBlur, radScale, pxs; uniform vec2 texel;
      float lin(float d) { return near * far / (far - d * (far - near)); }
      float coc(float z) { return min(maxBlur, aperture * abs(1.0 / focus - 1.0 / z)); }
      void main() {
        float cz = lin(texture(depthTex, vUv).r);
        float cs = coc(cz);
        vec3 col = texture(colTex, vUv).rgb; float tot = 1.0;
        float rad = radScale; float ang = 0.0;
        for (int i = 0; i < 2000; i++) {
          if (rad >= maxBlur) break;
          vec2 tc = vUv + vec2(cos(ang), sin(ang)) * texel * rad * pxs;
          vec3 sc = texture(colTex, tc).rgb;
          float sz = lin(texture(depthTex, tc).r);
          float ss = coc(sz);
          if (sz > cz) ss = clamp(ss, 0.0, cs * 2.0);
          float m = smoothstep(rad - 0.5, rad + 0.5, ss);
          col += mix(col / tot, sc, m); tot += 1.0;
          rad += radScale / rad; ang += 2.39996323;
        }
        fragColor = vec4(col / tot, 1.0);
      }`,{colTex:{value:null},depthTex:{value:null},near:{value:.1},far:{value:100},focus:{value:2},aperture:{value:40},maxBlur:{value:28},radScale:{value:.6},pxs:{value:l},texel:{value:new e(1/(r*l),1/(u*l))}})}render(e,t,n,r,i){let a=this.pass.u;a.colTex.value=t,a.depthTex.value=n,a.near.value=r.near,a.far.value=r.far,a.focus.value=this.focus,a.aperture.value=this.aperture,a.maxBlur.value=this.maxBlur,this.pass.render(e,i)}};export{d as n,f as t};