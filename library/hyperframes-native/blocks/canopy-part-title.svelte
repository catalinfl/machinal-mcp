<!-- Modified Svelte adaptation of registry/blocks/canopy-part-title/canopy-part-title.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { BokehPass } from 'three/addons/postprocessing/BokehPass.js';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-canopy-part-title';
  import __hfAsset from '@machinal/hyperframes/media/blocks-canopy-part-title';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { design = {} } = $props();
  const __hfScene = useScene();
  let root = $state();
  let timeline = $state.raw();

  // Host shim: the upstream page reads its editable variables from the
  // HyperFrames host. In the port they come from the approved `design` prop.
  const __hfHost = { getVariables: () => (design || {}), variables: design || {}, assetUrl: path => __hfAsset(path) };

  // The upstream page publishes its timeline into the host registry,
  // sometimes from a callback that runs after mount (once fonts are ready).
  // Pause it at time zero so the scene controller is its only clock source.
  let __hfTimelineSlot = { set() {}, get: () => undefined };

  $effect(() => {
    if (!root) return;
    let live = true;
    __hfTimelineSlot = {
      set(value) {
        if (live) {
          timeline = value;
          queueMicrotask(() => {
            if (live && timeline === value) {
              value?.pause(0);
              value?.seek(0, false);
            }
          });
        }
      },
      get() {
        return untrack(() => timeline);
      },
    };
    const context = gsap.context(() => {
      untrack(() => __hfScene.resources.track(initialize(__hfTimelineSlot, root)));
    }, root);
    return () => {
      live = false;
      timeline?.kill?.();
      context.revert();
      timeline = undefined;
    };
  });

  $effect(() => {
    const active = timeline;
    const time = __hfScene.frame.time;
    if (active) untrack(() => {
      active.seek(time, false);
      const waits = [];
      window.dispatchEvent(new CustomEvent('hf-seek', { detail: { time, waitUntil: promise => waits.push(promise) } }));
      if (typeof window.__hf_page_composite_resolve === 'function') waits.push(window.__hf_page_composite_resolve());
      if (waits.length) __hfScene.resources.track(Promise.all(waits));
    });
  });

  async function initialize(__hfTimelineSlot, __hfRootElement) {
    const __hfRegistry = new Proxy({}, { get: () => __hfTimelineSlot.get() });
    const __hfListen = (type, listener, options = {}) => window.addEventListener(type, listener,
      { ...options, signal: __hfScene.resources.signal });
    await loadHyperframeFonts(__hfFonts),(function(){"use strict";(function(){var c=document.createElement("canvas");c.id="cpt-canvas",c.width=1920,c.height=1080,document.getElementById("cpt-scene").appendChild(c)})();var V2={};try{__hfHost&&__hfHost.getVariables&&(V2=__hfHost.getVariables()||{})}catch{}var LEAF_COUNT=Math.max(40,Math.min(320,Number(V2.leafCount)||170)),STAY_COUNT=Math.max(0,Math.min(20,Math.round(V2.stayCount===void 0||!isFinite(Number(V2.stayCount))?5:Number(V2.stayCount)))),SPEED=Math.max(.3,Math.min(3,Number(V2.sweepSpeed)||1)),DUR2=12;function mulberry32(seed){return function(){seed|=0,seed=seed+1831565813|0;var t=Math.imul(seed^seed>>>15,1|seed);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}}var rand=mulberry32(1786080871),TEXT_HALF_W=8.2,TEXT_HALF_H=2;function buildBatch(batchIndex){for(var out=[],i=0;i<LEAF_COUNT;i++){var kindRoll=rand(),kind=kindRoll<.22?"monstera":kindRoll<.42?"alocasia":kindRoll<.68?"lance":kindRoll<.89?"calathea":"fern",stayer=!1,y0=(rand()*2-1)*3.6-.5,restX=(rand()*2-1)*9.2,restY=y0,restRZ=rand()*Math.PI*2;out.push({batch:batchIndex,kind,stayer,z:-4.6+rand()*3,xStart:-12.5-rand()*5.5,xEnd:12.5+rand()*5,restX,restY,restRZ,y0,delay:rand()*.5,delay2:0,bobAmp:.3+rand()*.65,bobN:1.1+rand()*1.6,spin:(rand()<.5?-1:1)*(1.6+rand()*3),phase:rand()*Math.PI*2,rotation:rand()*Math.PI*2,tiltX:(rand()-.5)*.42,tiltY:(rand()-.5)*.58,widthMul:.83+rand()*.34,lengthMul:.86+rand()*.25,scale:(.62+rand()*.85)*.56*1.9})}return out}function pickStayers(batch){for(var placed=0,guard=0;placed<STAY_COUNT&&guard++<600;){var idx=Math.floor(rand()*batch.length)%batch.length,sp=batch[idx];if(!sp.stayer){var rx,ry,tries=0;do rx=(rand()*2-1)*8.6,ry=(rand()*2-1)*4.3,tries++;while(tries<30&&Math.abs(ry)<TEXT_HALF_H+.7&&Math.abs(rx)<TEXT_HALF_W+.8);sp.stayer=!0,sp.restX=rx,sp.restY=ry,Math.abs(rx)>TEXT_HALF_W+.8&&Math.abs(ry)<TEXT_HALF_H+1.4?sp.restRZ=(rx>0?-1:1)*Math.PI/2+(rand()-.5)*.7:ry>=0?sp.restRZ=(rand()-.5)*.8:sp.restRZ=Math.PI+(rand()-.5)*.8,placed++}}}var batch1=buildBatch(1),batch2=buildBatch(2);pickStayers(batch1),pickStayers(batch2),batch1.forEach(function(s){s.delay2=(s.restX+16)/32*.5+rand()*.14});var liftRand=mulberry32(1818846836);batch2.forEach(function(s,i){if(s.liftX=(liftRand()*2-1)*7.8,s.liftY=-5.2+liftRand()*5.8,s.liftZ=-7+liftRand()*4.9,s.liftDelay=liftRand()*.28,s.depthResponse=Math.max(.25,Math.min(1,(s.liftZ+7)/14+.55)),s.stayer){var a=i*2.399963;s.restX=Math.sin(a)*8.5,s.restY=(i%2?1:-1)*5.5,s.restRZ=i%2?0:Math.PI}}),window.__cptBatches=[batch1,batch2];for(var DUST_COUNT2=800,dustHome2=new Array(DUST_COUNT2*3),dustSeeds2=new Array(DUST_COUNT2),d=0;d<DUST_COUNT2;d++)dustHome2[d*3]=(rand()*2-1)*10,dustHome2[d*3+1]=(rand()*2-1)*6,dustHome2[d*3+2]=rand()*12-5,dustSeeds2[d]=rand();window.__cptDust={home:dustHome2,seeds:dustSeeds2},[batch1,batch2].forEach(function(batch,batchIndex){batch.forEach(function(s,i){if(s.stayer){var breezeRand=mulberry32(1651664229^(batchIndex+1)*104729+i*7919);s.breeze={phase:breezeRand()*Math.PI*2,phase2:breezeRand()*Math.PI*2,phase3:breezeRand()*Math.PI*2,rate:.55+breezeRand()*.45,driftX:.22+breezeRand()*.24,driftY:.28+breezeRand()*.28,driftZ:.35+breezeRand()*.45,depth:(breezeRand()-.5)*1.3,tiltX:.07+breezeRand()*.1,tiltY:.1+breezeRand()*.14,roll:.12+breezeRand()*.14,turn:(breezeRand()<.5?-1:1)*(.012+breezeRand()*.022),arrival:breezeRand()*.16}}})});var state2={sw1:0,sw2:0};window.__cptState=state2;var d1=Math.max(1.2,Math.min(6,3.2/SPEED)),s2=Math.max(.4+d1+.9,5.2),d2=Math.max(1.2,Math.min(3.2/SPEED,DUR2-s2-1.8));window.__cptWindows={d1,s2,d2};var tl2=gsap.timeline({paused:!0});tl2.addLabel("opening",0).addLabel("headline-1",.4+d1).addLabel("canopy-lift",s2).addLabel("headline-2",s2+d2).addLabel("final-hold",10.5),tl2.fromTo("#cpt-scene",{opacity:0},{opacity:1,duration:.35,ease:"power1.out"},.05),tl2.fromTo("#cpt-bg",{y:0},{y:1.5,duration:12,ease:"none"},0),tl2.to(state2,{sw1:1,duration:d1,ease:"none"},.4),tl2.to(state2,{sw2:1,duration:d2,ease:"none"},s2),tl2.to(state2,{sw2:1,duration:.01},DUR2-.01),tl2.eventCallback("onUpdate",function(){window.__cptRender&&window.__cptRender(tl2.time())}),__hfTimelineSlot.set(tl2)})();const W=1920,H=1080,DUR=12;let V={};try{typeof __hfHost<"u"&&__hfHost.getVariables&&(V=__hfHost.getVariables()||{})}catch{}const HEADLINE1=String(V.headline1??"Understory"),HEADLINE2=String(V.headline2??"Move slowly"),FONT=(String(V.font||"Helvetica").trim()||"Helvetica").replace(/["']/g,""),FONT_WEIGHT=Math.max(100,Math.min(900,Math.round(isFinite(Number(V.fontWeight))&&Number(V.fontWeight)?Number(V.fontWeight):900))),FONT_SIZE=Math.max(.3,Math.min(2,isFinite(Number(V.fontSize))&&Number(V.fontSize)>0?Number(V.fontSize):1)),LETTER_SP=Math.max(-.2,Math.min(1,isFinite(Number(V.letterSpacing))?Number(V.letterSpacing):.01)),FONT_STACK='"'+FONT+'", Gelasio, Georgia, serif';if(!/^(Helvetica|Arial|Gelasio|Georgia|serif|sans-serif|monospace)$/i.test(FONT)){const fl=document.createElement("link");fl.rel="stylesheet",fl.href="https://fonts.googleapis.com/css2?family="+encodeURIComponent(FONT).replace(/%20/g,"+")+":wght@"+FONT_WEIGHT+"&display=swap",document.head.appendChild(fl)}const BG=String(V.background||"#020805"),RETAINED_BREEZE=Math.max(0,Math.min(2,Number.isFinite(Number(V.retainedBreeze))?Number(V.retainedBreeze):1)),state=window.__cptState,WIND_SPEED=1.06,WIND_STRENGTH=2.5,TURBULENCE=.8,TEXT_Z=-5,BACKDROP_Z=-7.5,CAM_DIST=13.6,clamp=THREE.MathUtils.clamp,smoothstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};function hash2(x,y,seed){let n=Math.imul(x+seed*1013,374761393)+Math.imul(y-seed*79,668265263);return n=n^n>>>13,n=Math.imul(n,1274126177),((n^n>>>16)>>>0)/4294967295}document.getElementById("cpt-bg").style.background=BG,document.body.style.background=BG;const renderer=new THREE.WebGLRenderer({canvas:document.getElementById("cpt-canvas"),antialias:!0,powerPreference:"high-performance",alpha:!1});renderer.setSize(W,H,!1),renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2)),renderer.outputColorSpace=THREE.SRGBColorSpace,renderer.toneMapping=THREE.ACESFilmicToneMapping,renderer.toneMappingExposure=1.8,renderer.shadowMap.enabled=!0,renderer.shadowMap.type=THREE.PCFShadowMap;const scene=new THREE.Scene,bgColor=new THREE.Color(BG);scene.background=bgColor.clone(),scene.fog=new THREE.FogExp2(bgColor.clone(),.008);const camera=new THREE.PerspectiveCamera(41,W/H,.1,40);camera.position.set(0,.15,12.1),camera.lookAt(0,0,-1.5);const composer=new EffectComposer(renderer);composer.setSize(W,H),composer.copyPass.material.depthTest=!1,composer.copyPass.material.depthWrite=!1,composer.addPass(new RenderPass(scene,camera));const bokehPass=new BokehPass(scene,camera,{focus:16.4,aperture:.0016,maxblur:.0055});composer.addPass(bokehPass);const hemi=new THREE.HemisphereLight(10469531,397321,2);scene.add(hemi);const sun=new THREE.DirectionalLight(new THREE.Color("#ece5ff"),8.5);sun.position.set(-13.3,8.5,9),sun.target.position.set(0,-1,-3),sun.castShadow=!0,sun.shadow.mapSize.set(2048,2048),sun.shadow.camera.left=-20,sun.shadow.camera.right=20,sun.shadow.camera.top=20*.73,sun.shadow.camera.bottom=-20*.73,sun.shadow.camera.near=.5,sun.shadow.camera.far=28,sun.shadow.bias=.00105,sun.shadow.normalBias=.0525,sun.shadow.radius=2.5,scene.add(sun,sun.target);const fill=new THREE.DirectionalLight(new THREE.Color("#00bd03"),9.55);fill.position.set(-11.8,4.2,5.2),fill.target.position.set(.7,1,-2),scene.add(fill,fill.target);const wall=new THREE.Mesh(new THREE.PlaneGeometry(68,44),new THREE.MeshBasicMaterial({color:bgColor.clone(),fog:!1}));wall.position.z=BACKDROP_Z,scene.add(wall);const catcher=new THREE.Mesh(new THREE.PlaneGeometry(68,44),new THREE.ShadowMaterial({opacity:.28}));catcher.position.z=BACKDROP_Z+.05,catcher.receiveShadow=!0,scene.add(catcher);const palettes={monstera:[[22,77,46],[79,128,70],[170,184,104]],alocasia:[[18,55,43],[57,104,73],[190,206,149]],lance:[[15,74,42],[53,126,65],[145,172,84]],calathea:[[32,58,39],[82,117,72],[195,178,126]],fern:[[20,73,39],[64,126,65],[158,176,88]]};function leafWidth(kind,y){const s=Math.max(0,Math.sin(Math.PI*y));return kind==="lance"||kind==="fern"?Math.pow(s,1.28)*(.66+y*.12):kind==="alocasia"?Math.pow(s,.62)*(.88+.16*(1-y)):kind==="calathea"?Math.pow(s,.82)*.78:Math.pow(s,.55)*(.82+.15*y)}function makeLeafTexture(kind,seed){const colorCanvas=document.createElement("canvas"),bumpCanvas=document.createElement("canvas");colorCanvas.width=bumpCanvas.width=384,colorCanvas.height=bumpCanvas.height=768;const colorCtx=colorCanvas.getContext("2d"),bumpCtx=bumpCanvas.getContext("2d"),colorImage=colorCtx.createImageData(384,768),bumpImage=bumpCtx.createImageData(384,768),p=palettes[kind];for(let py=0;py<768;py++){const y=py/767,width=leafWidth(kind,y);for(let px=0;px<384;px++){const x=(px/383-.5)*2;let signed=1-Math.abs(x)/Math.max(.001,width),inside=signed>-.015&&y>.008&&y<.996;if(inside&&kind==="monstera"){const ax=Math.abs(x),side=x<0?-1:1;for(let k=0;k<6;k++){const jitter=(hash2(k,seed,44)-.5)*.034,root=.205+k*.083+jitter,inner=.23+k*.022+(hash2(k,seed,51)-.5)*.026,curve=root+(ax-inner)*(.14+k*.012)+Math.sin((ax+k)*13)*.008,slotWidth=(.009+k*.0018)*smoothstep(inner,Math.max(inner+.11,width),ax);if(ax>inner&&Math.abs(y-curve)<slotWidth&&ax<width*1.025&&(inside=!1),k<4){const cx=side*(.225+k*.052+(hash2(k,seed,61)-.5)*.025),cy=.31+k*.105+(hash2(k,seed,71)-.5)*.025,rx=.026+k*.003,ry=.038+k*.005,skewY=y-cy-(x-cx)*side*.26;(x-cx)**2/(rx*rx)+skewY**2/(ry*ry)<1&&(inside=!1)}}}inside&&kind==="alocasia"&&y<.105&&Math.abs(x)<.15*(1-y/.105)&&(inside=!1);const i=(py*384+px)*4;if(!inside){colorImage.data[i+3]=0,bumpImage.data[i]=bumpImage.data[i+1]=bumpImage.data[i+2]=112,bumpImage.data[i+3]=255;continue}const n0=hash2(px>>2,py>>2,seed),n1=hash2(px>>4,py>>4,seed+17),middle=Math.exp(-Math.abs(x)*(kind==="lance"?28:35)),ribWave=Math.abs((y*(kind==="lance"?12:8.5)+Math.abs(x)*1.85)%1-.5),sideVein=Math.exp(-ribWave*46)*smoothstep(.04,.82,Math.abs(x)),edge=smoothstep(0,.16,signed),stripe=kind==="calathea"?.5+.5*Math.cos(y*58+Math.abs(x)*10):0,mottling=(n0-.5)*.16+(n1-.5)*.12+stripe*.08,light=clamp(.42+y*.12+mottling+middle*.34+sideVein*.16-(1-edge)*.27,0,1),dry=hash2(px>>3,py>>3,seed+90)>.978?.16:0,c0=p[0],c1=p[1],c2=p[2],t=smoothstep(.08,.9,light),hi=smoothstep(.56,1,t);for(let ch=0;ch<3;ch++){const low=c0[ch]+(c1[ch]-c0[ch])*t,val=low+(c2[ch]-low)*hi*.58+dry*(ch===0?56:ch===1?35:10);colorImage.data[i+ch]=clamp(val,0,255)}colorImage.data[i+3]=clamp(edge*390,0,255);const bump2=clamp(112+(n0-.5)*22+middle*100+sideVein*52-(1-edge)*18,0,255);bumpImage.data[i]=bumpImage.data[i+1]=bumpImage.data[i+2]=bump2,bumpImage.data[i+3]=255}}colorCtx.putImageData(colorImage,0,0),bumpCtx.putImageData(bumpImage,0,0);const map=new THREE.CanvasTexture(colorCanvas);map.colorSpace=THREE.SRGBColorSpace,map.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());const bump=new THREE.CanvasTexture(bumpCanvas);return bump.anisotropy=map.anisotropy,{map,bump}}const assetUrl=path=>typeof __hfHost<"u"&&__hfHost.assetUrl?__hfHost.assetUrl(path):path,textureLoader=new THREE.TextureLoader,[photoSurface,photoNormal]=await Promise.all([textureLoader.loadAsync(__hfAsset(assetUrl("assets/leaf-surface-color.webp"))),textureLoader.loadAsync(__hfAsset(assetUrl("assets/leaf-surface-normal.webp")))]);photoSurface.colorSpace=THREE.SRGBColorSpace,photoSurface.wrapS=photoSurface.wrapT=THREE.RepeatWrapping,photoSurface.repeat.set(2.4,4.8),photoNormal.wrapS=photoNormal.wrapT=THREE.RepeatWrapping,photoNormal.repeat.set(2.4,4.8);const kinds=["monstera","alocasia","lance","calathea","fern"],textureSets=Object.fromEntries(kinds.map((kind,i)=>[kind,makeLeafTexture(kind,i*31+7)])),materials={},shaderMaterials=[];for(const[index,kind]of kinds.entries()){const tex=textureSets[kind],material=new THREE.MeshPhysicalMaterial({map:tex.map,bumpMap:tex.bump,bumpScale:(kind==="monstera"?.065:.045)*2.5,normalMap:photoNormal,normalScale:new THREE.Vector2(.35,.35),alphaTest:.42,side:THREE.DoubleSide,roughness:.5626,metalness:0,clearcoat:.5256,clearcoatRoughness:.4274,thickness:0,transmission:.015,sheen:.24,sheenColor:new THREE.Color(kind==="calathea"?13018765:8233066),sheenRoughness:.8,emissive:new THREE.Color(398346),emissiveIntensity:.18,shadowSide:THREE.DoubleSide});material.userData.timeUniform={value:0},material.onBeforeCompile=shader=>{shader.uniforms.uTime=material.userData.timeUniform,shader.uniforms.uWindStrength={value:WIND_STRENGTH},shader.uniforms.uTurbulence={value:TURBULENCE},shader.uniforms.uShapeNoise={value:2.5},shader.uniforms.uTextureNoise={value:2},shader.uniforms.uPhotoTexture={value:1.5},shader.uniforms.uPhotoSurface={value:photoSurface},shader.vertexShader=shader.vertexShader.replace("#include <common>",`#include <common>
                  uniform float uTime;
                  uniform float uWindStrength;
                  uniform float uTurbulence;
                  uniform float uShapeNoise;
                `).replace("#include <begin_vertex>",`
                  vec3 transformed = vec3(position);
                  float root = pow(uv.y, 1.28);
                  float worldPhase = dot(modelMatrix[3].xyz, vec3(0.71, 1.13, 0.43)) + ${index.toFixed(1)};
                  vec2 worldXY = modelMatrix[3].xy;
                  float gustCell = sin(uTime * 0.23 + worldXY.x * 0.42 + sin(worldXY.y * 0.37 + uTime * 0.11));
                  float localGust = pow(max(0.0, gustCell), 3.6);
                  float breath = sin(uTime * 0.46 + worldPhase) * 0.20 + sin(uTime * 1.17 + worldPhase * 1.7) * 0.07 + localGust * 0.62;
                  float flutter = (sin(uTime * 2.7 + uv.y * 8.0 + worldPhase * 2.2) * 0.012 + localGust * sin(uv.y * 11.0 + worldPhase) * 0.038) * uTurbulence;
                  float edgeNoise = sin(uv.y * 31.0 + worldPhase * 4.1) * pow(abs(uv.x - 0.5) * 2.0, 2.4) * 0.022 * uShapeNoise;
                  transformed.x += (breath * 0.075 * uWindStrength + flutter + edgeNoise) * root;
                  transformed.z += breath * 0.12 * root * uWindStrength + flutter * root * 0.8 + edgeNoise;
                  transformed.z += (1.0 - pow(abs(uv.x - 0.5) * 2.0, 1.65)) * 0.075;
                `),shader.fragmentShader=shader.fragmentShader.replace("#include <common>",`#include <common>
                  uniform float uTextureNoise;
                  uniform float uPhotoTexture;
                  uniform sampler2D uPhotoSurface;`).replace("#include <map_fragment>",`#include <map_fragment>
                  float leafNoise = fract(sin(dot(vMapUv * vec2(311.7, 917.3), vec2(12.9898, 78.233))) * 43758.5453);
                  diffuseColor.rgb *= 1.0 + (leafNoise - 0.5) * 0.18 * uTextureNoise;
                  vec3 photographedSurface = texture2D(uPhotoSurface, vMapUv * vec2(2.4, 4.8)).rgb;
                  diffuseColor.rgb *= mix(vec3(1.0), photographedSurface * 1.24, clamp(uPhotoTexture, 0.0, 1.0) * 0.26);
                `),material.userData.shader=shader},material.customProgramCacheKey=()=>`cpt-leaf-wind-photo-v6-${index}`,materials[kind]=material,shaderMaterials.push(material)}const geometryCache=new Map;function leafGeometry(width,length){const key=`${width.toFixed(2)}-${length.toFixed(2)}`;if(geometryCache.has(key))return geometryCache.get(key);const geo=new THREE.PlaneGeometry(width,length,12,22);geo.translate(0,length*.5,0);const position=geo.attributes.position,uv=geo.attributes.uv;for(let i=0;i<position.count;i++){const across=position.getX(i)/(width*.5),along=uv.getY(i),arch=(1-Math.pow(Math.abs(across),1.62))*Math.sin(Math.PI*along),twist=across*(along-.22),edgeRipple=Math.sin(along*Math.PI*5.4+across*2.1)*Math.pow(Math.abs(across),2.2);position.setZ(i,arch*length*.052+twist*length*.038+edgeRipple*length*.012)}return position.needsUpdate=!0,geo.computeVertexNormals(),geometryCache.set(key,geo),geo}const DIMS={monstera:[2.05,2.7],alocasia:[1.92,2.85],lance:[.68,3.45],calathea:[1.36,3.05],fern:[.46,1.5]},leaves=[];for(const batch of window.__cptBatches)for(const spec of batch){const dims=DIMS[spec.kind];if(spec.batch===2){const reach=Math.hypot(dims[0]*spec.widthMul*.5,dims[1]*spec.lengthMul)*spec.scale;spec.liftStartY=-Math.tan(THREE.MathUtils.degToRad(camera.fov*.5))*(CAM_DIST-spec.liftZ)-reach-2}const group=new THREE.Group,mesh=new THREE.Mesh(leafGeometry(dims[0]*spec.widthMul,dims[1]*spec.lengthMul),materials[spec.kind]);mesh.castShadow=!0,mesh.receiveShadow=spec.z<4.8,group.add(mesh),group.visible=!1,group.position.set(spec.xStart,spec.y0,spec.z),group.scale.setScalar(spec.scale),group.rotation.set(spec.tiltX,spec.tiltY,spec.rotation),scene.add(group),leaves.push({group,spec})}function headlineTexture(text){const c=document.createElement("canvas");c.width=4096,c.height=1024;const g=c.getContext("2d");g.clearRect(0,0,c.width,c.height),g.textAlign="center",g.textBaseline="middle";let size=380;const applyFont=()=>{g.font=`${FONT_WEIGHT} ${size}px ${FONT_STACK}`,g.letterSpacing=`${Math.round(size*LETTER_SP)}px`};applyFont();let tw=g.measureText(text).width;tw>3760&&(size=Math.floor(size*3760/tw),applyFont()),size=Math.round(size*FONT_SIZE),applyFont(),g.shadowColor="rgba(0,0,0,0.5)",g.shadowBlur=30,g.shadowOffsetY=8,g.fillStyle="#e4eedb",g.fillText(text,c.width/2+Math.round(size*LETTER_SP*.5),c.height/2+16);const t=new THREE.CanvasTexture(c);return t.colorSpace=THREE.SRGBColorSpace,t.anisotropy=16,t}function headlinePlane(text,second=!1){const mat=new THREE.MeshBasicMaterial({map:headlineTexture(text),transparent:!0,toneMapped:!1,fog:!1,depthWrite:!1}),uniforms={uIn:{value:-.05},uOut:{value:-.05},uLift:{value:-.05}};mat.onBeforeCompile=shader=>{shader.uniforms.uIn=uniforms.uIn,shader.uniforms.uOut=uniforms.uOut,shader.uniforms.uLift=uniforms.uLift,shader.fragmentShader=shader.fragmentShader.replace("#include <common>",`#include <common>
    uniform float uIn;
    uniform float uOut;
    uniform float uLift;`).replace("#include <map_fragment>",`#include <map_fragment>
                  float eIn = uIn + sin(vMapUv.y * 43.0) * 0.012;
                  float eOut = uOut + sin(vMapUv.y * 37.0 + 2.0) * 0.012;
                  float vis = smoothstep(eIn + 0.02, eIn - 0.02, vMapUv.x) * smoothstep(eOut - 0.02, eOut + 0.02, vMapUv.x);
                  float lifted = smoothstep(uLift - 0.08, uLift + 0.08, vMapUv.y);
                  diffuseColor.a *= vis * ${second?"(1.0 - lifted)":"lifted"};`)},mat.customProgramCacheKey=()=>"cpt-headline-lift-"+second;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(16.4,4.1),mat);return mesh.position.set(0,.15,TEXT_Z),mesh.renderOrder=2,mesh.layers.set(1),scene.add(mesh),{mesh,mat,uniforms,retex:t2=>{const previous=mat.map;mat.map=headlineTexture(t2),previous.dispose(),mat.needsUpdate=!0}}}const plane1=headlinePlane(HEADLINE1),plane2=headlinePlane(HEADLINE2,!0),DUST_COUNT=800,dustHome=Float32Array.from(window.__cptDust.home),dustSeeds=Float32Array.from(window.__cptDust.seeds),dustPositions=dustHome.slice(),dustGeo=new THREE.BufferGeometry;dustGeo.setAttribute("position",new THREE.BufferAttribute(dustPositions,3)),dustGeo.setAttribute("seed",new THREE.BufferAttribute(dustSeeds,1));const moteCanvas=document.createElement("canvas");moteCanvas.width=moteCanvas.height=64;const moteCtx=moteCanvas.getContext("2d"),moteGradient=moteCtx.createRadialGradient(32,32,0,32,32,31);moteGradient.addColorStop(0,"rgba(255,255,232,1)"),moteGradient.addColorStop(.16,"rgba(224,255,202,.92)"),moteGradient.addColorStop(.5,"rgba(180,228,160,.28)"),moteGradient.addColorStop(1,"rgba(140,205,125,0)"),moteCtx.fillStyle=moteGradient,moteCtx.fillRect(0,0,64,64);const moteSprite=new THREE.CanvasTexture(moteCanvas);moteSprite.colorSpace=THREE.SRGBColorSpace;const dustMat=new THREE.PointsMaterial({color:new THREE.Color("#daf9b4"),map:moteSprite,size:.1,transparent:!0,opacity:.55,depthWrite:!1,blending:THREE.AdditiveBlending}),dust=new THREE.Points(dustGeo,dustMat);scene.add(dust);const dofDepthMaterials=new Map;function depthMaterialFor(source){const key=source.uuid;if(dofDepthMaterials.has(key))return dofDepthMaterials.get(key);const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:source.map||null,alphaTest:source.alphaTest||.5,side:source.side,depthTest:!0,depthWrite:!0});return dofDepthMaterials.set(key,depth),depth}bokehPass.render=function(activeRenderer,writeBuffer,readBuffer){const swapped=[],dustVisible=dust.visible;dust.visible=!1,this.scene.traverse(object=>{object.isMesh&&(swapped.push([object,object.material]),object.material=depthMaterialFor(object.material))});try{activeRenderer.setRenderTarget(this._renderTargetDepth),activeRenderer.clear(),activeRenderer.render(this.scene,this.camera)}finally{for(const[object,material]of swapped)object.material=material;dust.visible=dustVisible}this.uniforms.tColor.value=readBuffer.texture,this.uniforms.tDepth.value=this._renderTargetDepth.texture,activeRenderer.setRenderTarget(writeBuffer),this.clear&&activeRenderer.clear(),this._fsQuad.render(activeRenderer);const copy=composer.copyPass;copy.renderToScreen=!1;const background=scene.background,autoClear=activeRenderer.autoClear,layers=camera.layers.mask,shadowAutoUpdate=activeRenderer.shadowMap.autoUpdate;try{scene.background=null,activeRenderer.autoClear=!1,activeRenderer.shadowMap.autoUpdate=!1,copy.render(activeRenderer,readBuffer,writeBuffer),camera.layers.set(1),activeRenderer.render(scene,camera)}finally{scene.background=background,activeRenderer.autoClear=autoClear,activeRenderer.shadowMap.autoUpdate=shadowAutoUpdate,camera.layers.mask=layers}copy.renderToScreen=this.renderToScreen,copy.render(activeRenderer,writeBuffer,readBuffer)};const cameraTarget=new THREE.Vector3(0,0,-1.5),cameraOffset=new THREE.Vector3,cameraOrbit=new THREE.Euler(0,0,0,"YXZ"),degToRad=THREE.MathUtils.degToRad,DJ=.5;function motionClock(t){const end=window.__cptWindows.s2+window.__cptWindows.d2,duration=Math.max(.1,10.5-end),p=clamp((t-end)/duration,0,1);return t<=end?t:end+duration*(p-p*p/2)}function openingWind(spec,t){const wt=motionClock(t)*WIND_SPEED,gust=Math.sin(wt*.23+spec.restX*.42+Math.sin(spec.y0*.37+wt*.11));return[(Math.sin(wt*.46+spec.phase)*.011+Math.sin(wt*.58+spec.y0*.74)*.007+Math.max(0,gust)**3.6*.03)*WIND_STRENGTH,Math.sin(wt*.31+spec.phase)*.02]}function retainedSweepPose(s,t){const w=window.__cptWindows;if(s.batch===2){const p2=clamp(clamp((t-w.s2)/w.d2,0,1)*1.28-s.liftDelay,0,1),lift=smoothstep(0,.58,p2),seat=smoothstep(.38,1,p2);return[THREE.MathUtils.lerp(s.liftX,s.restX,seat),THREE.MathUtils.lerp(s.liftY,s.restY,seat)-(s.liftY-s.liftStartY)*(1-smoothstep(0,.42,p2)),THREE.MathUtils.lerp(s.liftZ,s.z,lift),s.tiltX+seat*3.6*Math.sin(s.phase),s.tiltY+seat*3.6*Math.cos(s.phase*1.7),THREE.MathUtils.lerp(s.rotation,s.restRZ,seat)]}const p=clamp(clamp((t-.4)/w.d1,0,1)*1.5-s.delay,0,1),pe=1-Math.pow(1-p,3),rz=s.rotation+pe*s.spin*.55,turn=((s.restRZ-rz+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI,[wind,roll]=openingWind(s,t);return[s.xStart+(s.restX-s.xStart)*pe,s.y0+(s.restY-s.y0)*pe+Math.sin(pe*Math.PI*1.4+s.phase)*s.bobAmp*(1-pe)*.8+wind*.14,s.z,s.tiltX+wind,s.tiltY+wind*.65,rz+turn*smoothstep(.55,1,pe)+roll]}function retainedIdlePose(spec,t,handoff){const b=spec.breeze,age=t-handoff.start,a=age*b.rate,pose=handoff.center.slice();if(spec.batch===1){const[wind,roll]=openingWind(spec,t);pose[1]+=wind*.14,pose[3]+=wind,pose[4]+=wind*.65,pose[5]+=roll}const floatX=Math.sin(a+b.phase)*.72+Math.sin(a*.613+b.phase2)*.28,floatY=Math.sin(a*.79+b.phase2)*.76+Math.sin(a*1.137+b.phase3)*.24,floatZ=Math.sin(a*.53+b.phase3),offsets=[b.driftX*floatX,b.driftY*floatY,b.depth+b.driftZ*floatZ,b.tiltX*Math.sin(a*.67+b.phase2),b.tiltY*Math.sin(a*.47+b.phase3),b.roll*floatX+b.turn*age];return pose.map((v,i)=>v+RETAINED_BREEZE*offsets[i])}for(const{spec:s}of leaves){if(!s.stayer)continue;const w=window.__cptWindows,first=s.batch===1,rate=first?1.5/w.d1:1.28/w.d2,progress=(first?.64:.78)+s.breeze.arrival*.12,start=(first?.4:w.s2)+(progress+(first?s.delay:s.liftDelay))/rate,end=first?.4+w.d1:w.s2+w.d2,center=retainedSweepPose(s,end),incoming=retainedSweepPose(s,start);if(first){const[wind,roll]=openingWind(s,end);center[1]-=wind*.14,center[3]-=wind,center[4]-=wind*.65,center[5]-=roll}for(let i=3;i<6;i++)center[i]+=Math.round((incoming[i]-center[i])/(2*Math.PI))*2*Math.PI;const h=s.handoff={start,duration:(first?.52:.48)/rate,center},dt=.001,delta=time=>retainedSweepPose(s,time).map((v,i)=>v-retainedIdlePose(s,time,h)[i]),a=delta(start-dt),b=delta(start),c=delta(start+dt);h.correction=b.map((v,i)=>[v,(c[i]-a[i])/(2*dt),(c[i]-2*v+a[i])/(dt*dt)])}function applyRetainedMotion(group,spec,t){const h=spec.handoff;if(!h||!group.visible)return;if(t<h.start){const incoming=retainedSweepPose(spec,t);group.position.set(incoming[0],incoming[1],incoming[2]),group.rotation.set(incoming[3],incoming[4],incoming[5]);return}const pose=retainedIdlePose(spec,t,h),u=clamp((t-h.start)/h.duration,0,1),u2=u*u,u3=u2*u,u4=u3*u,u5=u4*u,p=1-10*u3+15*u4-6*u5,v=u-6*u3+8*u4-3*u5,a=(u2-3*u3+3*u4-u5)/2;for(let i=0;i<6;i++){const c=h.correction[i];pose[i]+=c[0]*p+c[1]*h.duration*v+c[2]*h.duration*h.duration*a}if(spec.batch===1){const m=clamp((t-window.__cptWindows.s2)/window.__cptWindows.d2,0,1),q=clamp(m*1.5-spec.delay2*.4,0,1),lift=q*q*q*(10+q*(-15+6*q));pose[1]+=lift*6,pose[2]+=lift*34,pose[5]+=lift*spec.spin*.55}group.position.set(pose[0],pose[1],pose[2]),group.rotation.set(pose[3],pose[4],pose[5])}let disposed=!1;function renderAt(t){if(disposed)return;t=clamp(t,0,DUR);const settleTime=window.__cptWindows.s2+window.__cptWindows.d2,settleDuration=Math.max(.1,10.5-settleTime),settleProgress=clamp((t-settleTime)/settleDuration,0,1),motionTime=t<=settleTime?t:settleTime+settleDuration*(settleProgress-settleProgress*settleProgress/2),wt=motionTime*WIND_SPEED,m1=state.sw1,m2=state.sw2;for(const{group,spec}of leaves){if(spec.batch===2){const p2=clamp(m2*1.28-spec.liftDelay,0,1);group.visible=!0;const entry=smoothstep(0,.42,p2),lift=smoothstep(0,.58,p2),exit=smoothstep(.38,1,p2),seat=smoothstep(.38,1,p2),z2=spec.stayer?THREE.MathUtils.lerp(spec.liftZ,spec.z,lift):spec.liftZ+lift*8*spec.depthResponse+exit*34,orbit=exit*1.15,x2=spec.stayer?THREE.MathUtils.lerp(spec.liftX,spec.restX,seat):spec.liftX+Math.cos(spec.phase+p2*1.3)*orbit,y2=(spec.stayer?THREE.MathUtils.lerp(spec.liftY,spec.restY,seat):spec.liftY+lift*2.2+exit*3.8)-(spec.liftY-spec.liftStartY)*(1-entry);group.position.set(x2,y2,z2),group.rotation.set(spec.tiltX+exit*3.6*Math.sin(spec.phase),spec.tiltY+exit*3.6*Math.cos(spec.phase*1.7),spec.stayer?THREE.MathUtils.lerp(spec.rotation,spec.restRZ,seat):spec.rotation+exit*3.6*.55);continue}const m=spec.batch===1?m1:m2,p=clamp(m*(1+DJ)-spec.delay,0,1);if(p<=5e-4){group.visible=!1;continue}group.visible=!0;const gustCell=Math.sin(wt*.23+spec.restX*.42+Math.sin(spec.y0*.37+wt*.11)),localGust=Math.max(0,gustCell)**3.6,slowWind=(Math.sin(wt*.46+spec.phase)*.011+Math.sin(wt*.58+spec.y0*.74)*.007+localGust*.03)*WIND_STRENGTH;let x,y,rz,z=spec.z;if(spec.stayer){const pe=1-Math.pow(1-p,3);x=spec.xStart+(spec.restX-spec.xStart)*pe,y=spec.y0+(spec.restY-spec.y0)*pe+Math.sin(pe*Math.PI*1.4+spec.phase)*spec.bobAmp*(1-pe)*.8;const travelRz=spec.rotation+pe*spec.spin*.55,seat=smoothstep(.55,1,pe),dRz=((spec.restRZ-travelRz+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;if(rz=travelRz+dRz*seat,spec.batch===1&&m2>0){const q=clamp(m2*1.5-spec.delay2*.4,0,1),qe=smoothstep(0,1,q);z+=qe*34,y+=qe*6,rz+=qe*spec.spin*.55}}else{const pe=p*p*(3-2*p);x=spec.xStart+(spec.xEnd-spec.xStart)*pe,y=spec.y0+Math.sin(pe*Math.PI*spec.bobN+spec.phase)*spec.bobAmp,rz=spec.rotation+pe*spec.spin}group.position.set(x,y+slowWind*.14,z),group.rotation.set(spec.tiltX+slowWind,spec.tiltY+slowWind*.65,rz+Math.sin(wt*.31+spec.phase)*.02)}for(const{group,spec}of leaves)applyRetainedMotion(group,spec,t);plane1.uniforms.uIn.value=clamp((m1-.3)/.52,0,1)*1.1-.05,plane1.uniforms.uOut.value=-.05,plane2.uniforms.uIn.value=1.05,plane1.uniforms.uLift.value=smoothstep(.25,.43,m2)*1.3-.15,plane2.uniforms.uLift.value=smoothstep(.4,.62,m2)*1.3-.15;const lens=smoothstep(.05,.28,m2)*(1-smoothstep(.72,1,m2));bokehPass.uniforms.aperture.value=.0016+lens*5e-4,bokehPass.uniforms.maxblur.value=.0055+lens*.0035,plane2.uniforms.uOut.value=-.05;for(const material of shaderMaterials)material.userData.timeUniform.value=wt;for(let i=0;i<DUST_COUNT;i++){const o=i*3,s=dustSeeds[i];dustPositions[o]=dustHome[o]+Math.sin(wt*.19+s*18)*.36,dustPositions[o+1]=dustHome[o+1]+Math.cos(wt*.14+s*27)*.38,dustPositions[o+2]=dustHome[o+2]+Math.sin(wt*.11+s*41)*.4}dustGeo.attributes.position.needsUpdate=!0;const swayX=Math.sin(motionTime*.31)*.6+Math.sin(motionTime*.127+2.1)*.5,swayY=Math.sin(motionTime*.083+1.7)*.7;cameraOrbit.set(degToRad(-swayY),degToRad(swayX),0,"YXZ"),cameraOffset.set(0,.15,CAM_DIST).applyEuler(cameraOrbit),camera.position.copy(cameraTarget).add(cameraOffset),camera.lookAt(cameraTarget),dust.rotation.x=degToRad(-swayY)*.6,dust.rotation.y=degToRad(swayX)*.6,composer.render()}function onSeek(event){const time=clamp(Number(event.detail?.time)||0,0,DUR);__hfTimelineSlot.get().totalTime(time,!0),renderAt(time)}__hfListen("hf-seek",onSeek),window.__cptInstance={dispose(){if(disposed)return;disposed=!0,window.removeEventListener("hf-seek",onSeek);const resources=new Set;scene.traverse(object=>{object.geometry&&resources.add(object.geometry);for(const mat of[object.material].flat().filter(Boolean)){resources.add(mat);for(const value of Object.values(mat))value?.isTexture&&resources.add(value)}});for(const mat of dofDepthMaterials.values())resources.add(mat);for(const resource of resources)resource.dispose();bokehPass.dispose(),composer.dispose(),renderer.dispose(),renderer.forceContextLoss(),window.__cptRender=null}},window.__cptRender=renderAt;const tl=__hfTimelineSlot.get();for(const{group}of leaves)group.visible=!0;renderer.compile(scene,camera),renderAt(0),renderAt(window.__hfThreeTime??(tl?tl.time():0));async function warmGpu(){const dur=tl?tl.duration():0;for(const f of[.25,.5,.75])await Promise.resolve(),renderAt(dur*f);renderAt(tl?tl.time():0),renderer.getContext().finish()}window.__hf=window.__hf||{},window.__hf.buildReady=window.__hf.buildReady||{},document.fonts&&document.fonts.ready?(window.__cptReady=Promise.all([document.fonts.load(__hfAsset(`${FONT_WEIGHT} 100px "${FONT}"`)).catch(()=>{}),document.fonts.ready]).then(()=>{if(!disposed)return plane1.retex(HEADLINE1),plane2.retex(HEADLINE2),renderAt(tl?tl.time():0),warmGpu()}).catch(()=>{}),window.__hf.buildReady["canopy-part-title"]=window.__cptReady):window.__hf.buildReady["canopy-part-title"]=warmGpu(),__hfRootElement.querySelectorAll("img").forEach(image=>{image.src=__hfAsset(image.getAttribute("src"))});
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#020805">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          data-hf-id="hf-idkp"
          id="cpt-root"
          data-composition-id="canopy-part-title"
          data-start="0"
          data-duration="12"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[&#123;"id":"headline1","type":"string","label":"Headline 1","default":"Understory"&#125;,&#123;"id":"headline2","type":"string","label":"Headline 2","default":"Move slowly"&#125;,&#123;"id":"font","type":"string","label":"Headline font","default":"Helvetica"&#125;,&#123;"id":"fontWeight","type":"number","label":"Font weight","default":900,"min":100,"max":900,"step":100&#125;,&#123;"id":"fontSize","type":"number","label":"Font size (1 = auto-fit)","default":1,"min":0.3,"max":2,"step":0.01&#125;,&#123;"id":"letterSpacing","type":"number","label":"Letter spacing (em)","default":0.01,"min":-0.2,"max":1,"step":0.01&#125;,&#123;"id":"background","type":"color","label":"Background","default":"#020805"&#125;,&#123;"id":"leafCount","type":"number","label":"Leaves per sweep","default":170,"min":40,"max":320,"step":1&#125;,&#123;"id":"stayCount","type":"number","label":"Leaves left behind","default":5,"min":0,"max":20,"step":1&#125;,&#123;"id":"sweepSpeed","type":"number","label":"Sweep speed","default":1,"min":0.3,"max":3,"step":0.05&#125;,&#123;"id":"retainedBreeze","type":"number","label":"Retained leaf breeze","default":1,"min":0,"max":2,"step":0.05&#125;]'>
          <section
            data-hf-id="hf-wrn4"
            id="cpt-scene"
            class="clip"
            data-start="0"
            data-duration="12"
            data-track-index="1"
          >
            <div
              style="font-family: &quot;Alan Sans&quot;, ui-sans-serif, system-ui, sans-serif"
              data-hf-id="hf-bank"
              id="cpt-bg"
            ></div>
          </section>
          <div data-hf-id="hf-p1fl" id="cpt-fontload" aria-hidden="true">
            <span data-hf-id="hf-grhl" style="font-weight: 500">Aa</span
            ><span data-hf-id="hf-7bxm" style="font-weight: 600">Aa</span>
          </div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #020805;
  }
  #cpt-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #cpt-scene {
    position: absolute;
    inset: 0;
  }
  /* Full-frame background paint on a child, never on the composition root.
  Plain flat colour — driven by the `background` variable, no gradients. */
  #cpt-bg {
    position: absolute;
    inset: 0;
    background: #020805;
  }
  #cpt-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  #cpt-fontload {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    font-family: Gelasio, Georgia, serif;
  }
}
</style>
