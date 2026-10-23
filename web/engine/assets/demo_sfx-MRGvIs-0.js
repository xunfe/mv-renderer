import{T as e,c as t,n,w as r}from"./gl-DcsgeOjJ.js";import{t as i}from"./scene-CTj1nnms.js";import{n as a,t as o}from"./sfx-D5cJvfYj.js";var s=new URLSearchParams(location.search);function c(e,t={}){let n=a().get(e);if(!n)throw Error(`?sfx=${e}: no such component`);return[{type:e,id:`fx`,props:t,children:n.requiresChild||n.requiresRTT||n.acceptsOptionalChild?[{type:`EngineTexture`,props:{source:`card`}}]:void 0}]}var l=class extends i{card=new n(`
    uniform float t;
    void main() {
      vec2 p = (vUv - 0.5) * vec2(${(e/r).toFixed(4)}, 1.0);
      vec3 col = mix(C_INK, C_SIGNAL, vUv.x) * (0.35 + 0.65 * vUv.y);
      vec2 g = abs(fract(p * 8.0) - 0.5);
      col = mix(col, C_BONE, 0.5 * (1.0 - smoothstep(0.0, 0.03, min(g.x, g.y))));
      vec2 c = vec2(0.25 * sin(t * 0.7), 0.1 * cos(t * 0.9));
      float d = length(p - c);
      col = mix(col, C_BONE, 1.0 - smoothstep(0.17, 0.18, d));
      col += vec3(4.0, 3.0, 2.0) * (1.0 - smoothstep(0.0, 0.06, d));
      fragColor = vec4(col, 1.0);
    }`,{t:{value:0}});cardRT=t(e,r,{depthBuffer:!1});fx;constructor(e){super(e);let t=String(e.params.sfx??s.get(`sfx`)??`PagePeel`),n=e.params.props??JSON.parse(s.get(`sfxprops`)??`{}`);this.fx=new o(e.renderer,c(t,n)),this.stateful=this.fx.stateful}async init(){await this.fx.init()}reset(){this.fx.reset()}render(e,t){this.card.u.t.value=e.lt,this.card.render(this.ctx.renderer,this.cardRT),this.fx.input(`card`,this.cardRT),this.fx.render(e.lt,t)}dispose(){this.fx.dispose()}};export{l as default,c as demoLayers};