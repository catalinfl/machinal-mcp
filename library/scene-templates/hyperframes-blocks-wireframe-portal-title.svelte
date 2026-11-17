<!-- Modified Svelte adaptation of registry/blocks/wireframe-portal-title/wireframe-portal-title.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import { FontLoader } from 'three/addons/loaders/FontLoader.js';
  import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
  import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
  import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
  import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
  import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
  import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
  import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
  import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
  import ClipperLib from 'clipper-lib';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-wireframe-portal-title';
  import __hfAsset from '@machinal/hyperframes/media/blocks-wireframe-portal-title';
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
    await loadHyperframeFonts(__hfFonts),(function(){var vars={};try{__hfHost&&__hfHost.getVariables&&(vars=__hfHost.getVariables()||{})}catch{}var title=String(vars.title||"BREAKTHROUGH").trim().toUpperCase()||"BREAKTHROUGH",subtitle=String(vars.subtitle||"HYPERFRAMES PORTAL TITLE");window.__wptPhrase=String(vars.replacementPhrase||"BEYOND LIMITS").trim().toUpperCase().replace(/\s+/g," ")||"BEYOND LIMITS";function numberVar(id,fallback,min,max){var value=vars[id]===void 0?fallback:Number(vars[id]);return isFinite(value)?Math.max(min,Math.min(max,value)):fallback}window.__wptTransition={start:2.85,duration:numberVar("phraseDuration",1.85,.65,2.9),easing:numberVar("phraseEasing",4,1,8),glitch:numberVar("settleGlitch",1,0,4),fog:vars.depthFog!==!1};var accent=String(vars.accent||"#F5C518");__hfRootElement.querySelector("[data-composition-id]")||__hfRootElement.style.setProperty("--wpt-accent",accent),window.__wptAccent=accent;var bc=Number(vars.burstChaos);window.__wptBurstChaos=isFinite(bc)?Math.max(0,Math.min(2,bc)):1;function fillHeadline(id,text,prefix){for(var hl=document.getElementById(id),i=0;i<text.length;i++){var ch=text[i],span=document.createElement("span");ch===" "?span.innerHTML="&nbsp;":(span.textContent=ch,span.setAttribute("data-3d-char",prefix+i)),hl.appendChild(span)}}fillHeadline("wpt-headline",title,"t-"),document.getElementById("wpt-subtitle").textContent=subtitle,["wpt-three","wpt-warp"].forEach(function(id){var canvas=document.createElement("canvas");canvas.id=id,canvas.width=1920,canvas.height=1080,document.getElementById("wpt-scene").insertBefore(canvas,document.getElementById("wpt-white"))})})();{const S={portal:0,push:0,glitch:0,warp:0,travel:0,exitFx:0};window.__wptState=S;const tl=gsap.timeline({paused:!0});tl.from("#wpt-kicker",{y:-24,opacity:0,duration:.45,ease:"power3.out"},0),tl.from("#wpt-headline span",{y:44,opacity:0,duration:.5,stagger:.025,ease:"power3.out"},.03),tl.from("#wpt-subtitle",{y:18,opacity:0,duration:.45,ease:"power3.out"},.22),tl.to(S,{portal:1,duration:2.05,ease:"power2.inOut"},.45),tl.set(["#wpt-headline","#wpt-kicker","#wpt-subtitle"],{autoAlpha:0},2.5),tl.to(S,{warp:1,duration:1,ease:"sine.in"},.45),tl.to(S,{warp:.28,duration:1.2,ease:"sine.out"},1.5),tl.to(S,{warp:.85,duration:.8,ease:"power1.in"},6),tl.to(S,{travel:16,duration:2.05,ease:"sine.inOut"},.45),tl.to(S,{travel:22,duration:3.5,ease:"none"},2.5),tl.to(S,{travel:38,duration:2,ease:"power2.in"},6),tl.to(S,{glitch:.55,duration:.09,ease:"power1.in"},3.8),tl.to(S,{glitch:0,duration:.24,ease:"power2.out"},3.89),tl.to(S,{glitch:.55,duration:.09,ease:"power1.in"},5.2),tl.to(S,{glitch:0,duration:.24,ease:"power2.out"},5.29),tl.to(S,{push:1,duration:1.6,ease:"power2.in"},6),tl.to(S,{exitFx:1,duration:1.6,ease:"power2.in"},6.4),tl.to("#wpt-white",{opacity:1,duration:.95,ease:"sine.inOut"},6.9),tl.addLabel("light-card",.8),tl.addLabel("portal-alignment",1.47),tl.addLabel("phrase-handoff",window.__wptTransition.start+window.__wptTransition.duration*.6),tl.addLabel("phrase-hold",window.__wptTransition.start+window.__wptTransition.duration),tl.addLabel("white-empty",7.9),tl.eventCallback("onUpdate",function(){window.__wptRender&&window.__wptRender(tl.time())}),__hfListen("hf-seek",function(event){var d=event&&event.detail;d&&typeof d.time=="number"&&tl.totalTime(Math.min(d.time,tl.totalDuration()),!0);var fn=tl.eventCallback("onUpdate");fn&&fn()}),__hfTimelineSlot.set(tl)}{let mulberry32=function(a){return function(){a|=0,a=a+1831565813|0;let t=Math.imul(a^a>>>15,1|a);return t=t+Math.imul(t^t>>>7,61|t)^t,((t^t>>>14)>>>0)/4294967296}},triangleShape=function(size){const shape=new THREE.Shape,h=size*Math.sqrt(3)/2;return shape.moveTo(0,h*.66),shape.lineTo(-size/2,-h*.33),shape.lineTo(size/2,-h*.33),shape.closePath(),shape},rectToWorld=function(r){return{x:((r.left+r.width/2)/W-.5)*visW,y:(.5-(r.top+r.height/2)/H)*visH,w:r.width/W*visW,h:r.height/H*visH}},offsetRect=function(el){let left=el.offsetLeft,top=el.offsetTop,node=el.offsetParent;for(;node&&node.id!=="wpt-card"&&node!==document.body;)left+=node.offsetLeft,top+=node.offsetTop,node=node.offsetParent;return{left,top,width:el.offsetWidth,height:el.offsetHeight}},cleanShapes=function(shapes){const cleaned=[];for(const shape of shapes){const pts=shape.extractPoints(12),paths=[pts.shape,...pts.holes].map(ring=>ring.map(p=>({X:Math.round(p.x*1e3),Y:Math.round(p.y*1e3)})));let simp;try{simp=ClipperLib.Clipper.SimplifyPolygons(paths,ClipperLib.PolyFillType.pftNonZero)}catch{cleaned.push(shape);continue}const outerRings=[],holeRings=[];for(const ring of simp)ring.length<3||(ClipperLib.Clipper.Orientation(ring)?outerRings:holeRings).push(ring);const outShapes=outerRings.map(r=>new THREE.Shape(r.map(p=>new THREE.Vector2(p.X/1e3,p.Y/1e3))));for(const hr of holeRings){let owner=outShapes[0];for(let oi=0;oi<outerRings.length;oi++)if(ClipperLib.Clipper.PointInPolygon(hr[0],outerRings[oi])!==0){owner=outShapes[oi];break}owner&&owner.holes.push(new THREE.Path(hr.map(p=>new THREE.Vector2(p.X/1e3,p.Y/1e3))))}cleaned.push(...outShapes)}return cleaned},cleanTextGeometry=function(text,size,depth){const shapes=cleanShapes(font.generateShapes(text,size));return new THREE.ExtrudeGeometry(shapes,{depth,bevelEnabled:!1})},createLetterAt=function(char,wr,random=rand){const g=new THREE.Group,geo=cleanTextGeometry(char,10,P.textDepthMax);geo.computeBoundingBox();const bb=geo.boundingBox,geoW=bb.max.x-bb.min.x,geoH=bb.max.y-bb.min.y;geo.center();const xyScale=Math.min(wr.w/(geoW||1),wr.h/(geoH||1));g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:"#050505",side:THREE.DoubleSide,transparent:!0})));const edges=new THREE.EdgesGeometry(geo,20),lineGeo=new LineSegmentsGeometry;lineGeo.setPositions(edges.attributes.position.array);const lineMat=new LineMaterial({color:new THREE.Color(P.outlineColor).getHex(),linewidth:P.outlineWidth,transparent:!0,resolution:lineResolution});g.add(new LineSegments2(lineGeo,lineMat)),edges.dispose(),g.scale.set(xyScale,xyScale,.01),g.position.set(wr.x,wr.y,0),g.userData.char=char,g.userData.baseX=wr.x,g.userData.baseY=wr.y,g.userData.xyScale=xyScale,g.userData.targetZ=(random()-.5)*P.letterZSpread;const ratio=P.textDepthMin/P.textDepthMax;return g.userData.depthScale=ratio+random()*(1-ratio),g.userData.isLetter=!0,contentGroup.add(g),textMeshes.push(g),g},createFlatLine=function(text,wr,widthMult,opacity){const geo=cleanTextGeometry(text,1,.02);geo.computeBoundingBox();const bb=geo.boundingBox,geoW=bb.max.x-bb.min.x,geoH=bb.max.y-bb.min.y;geo.center();const s=Math.min(wr.h/(geoH||1),wr.w/(geoW||1)),g=new THREE.Group;g.add(new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:"#050505",side:THREE.DoubleSide,transparent:!0})));const edges=new THREE.EdgesGeometry(geo,40),lineGeo=new LineSegmentsGeometry;lineGeo.setPositions(edges.attributes.position.array);const lineMat=new LineMaterial({color:new THREE.Color(P.outlineColor).getHex(),linewidth:P.outlineWidth*widthMult,transparent:!0,opacity,resolution:lineResolution});g.add(new LineSegments2(lineGeo,lineMat)),edges.dispose(),g.scale.set(s,s,1),g.position.set(wr.x,wr.y,0),g.userData.baseY=wr.y,g.userData.isSupporting=!0,g.userData.faceColor=g.children[0].material.color.clone(),contentGroup.add(g),textMeshes.push(g)},layoutPhrase=function(text){const measure=document.createElement("canvas").getContext("2d");measure.font="700 176px Geist";const tracking=176*.03,advance=char=>measure.measureText(char).width+tracking,width=line=>Array.from(line).reduce((sum,char)=>sum+advance(char),-tracking),words=text.split(" "),widest=Math.max(...words.map(width)),total=width(text);let best=null;const candidates=new Set([total,widest]);for(let first=0;first<words.length;first++){let line="";for(let last=first;last<words.length;last++)line+=(line?" ":"")+words[last],candidates.add(width(line))}for(const limit of candidates){if(limit<widest)continue;const lines=[];let line="";for(const word of words){const next=line?line+" "+word:word;line&&width(next)>limit+.01?(lines.push(line),line=word):line=next}line&&lines.push(line);const widths=lines.map(width),scale=Math.min(1,1520/Math.max(...widths),620/(lines.length*176*1.18)),balance=Math.min(...widths)/Math.max(...widths),score=scale*(.94+.06*balance);(!best||score>best.score)&&(best={lines,widths,scale,score})}const glyphs=[],lineHeight=176*1.18*best.scale;return best.lines.forEach((line,row)=>{let left=(W-best.widths[row]*best.scale)/2;for(const char of Array.from(line)){const step=advance(char)*best.scale;char.trim()&&glyphs.push({char,row,rect:{left,top:H/2+(row-(best.lines.length-1)/2)*lineHeight-88*best.scale,width:(advance(char)-tracking)*best.scale,height:176*best.scale}}),left+=step}}),{...best,glyphs}},phraseEase=function(progress){const x=clamp01(progress),a=Math.pow(x*.38,transition.easing),b=Math.pow((1-x)*.62,transition.easing);return a/(a+b)},opacityFor=function(obj,opacity){for(const child of obj.children)child.material.opacity=opacity,child.material.depthWrite=opacity>.995},depthFade=function(obj,amount,baseOpacity=1){const opacity=1-smooth((amount-.005)/.13);opacityFor(obj,opacity);const haze=transition.fog?1-smooth(amount/.15):1;return obj.children[1].material.color.set(P.outlineColor).lerp(endCol,1-haze),obj.children[1].material.opacity=baseOpacity*opacity,obj.visible=opacity>.001,opacity},handoffLetters=function(t,portal){let glitchEnvelope=0;for(let i=0;i<slots.length;i++){const slot=slots[i],progress=clamp01((t-transition.start-slot.delay)/(transition.duration*.74)),motion=phraseEase(progress),incoming=motion>=.5,start=slot.start,end=slot.end;if(!slot.to){const depart=smooth((t-transition.start-i%3*.025)/Math.min(.75,transition.duration*.45)),obj=slot.from;obj.position.set(start.baseX,start.baseY,start.targetZ*portal-depart*125),obj.rotation.set(0,depart*.3,0),obj.scale.set(start.xyScale,start.xyScale,THREE.MathUtils.lerp(.01,start.depthScale,portal)),depthFade(obj,depart);continue}const x=THREE.MathUtils.lerp(start.baseX,end.baseX,motion),y=THREE.MathUtils.lerp(start.baseY,end.baseY,motion)+Math.sin(t*.6+i*.7)*.12*portal,exitDelay=i/Math.max(1,replacementLetters.length-1)*.2,flyPast=Math.pow(clamp01((t-6-exitDelay)/1.25),3),z=THREE.MathUtils.lerp(start.targetZ,end.targetZ,motion)*portal-Math.sin(Math.PI*motion)*1.8+flyPast*38,passedCamera=new THREE.Vector3(x,y,z+P.contentZOffset*portal).applyMatrix4(camera.matrixWorldInverse).z>P.textDepthMax*2,edge=Math.pow(Math.abs(2*motion-1),.65),swapPulse=Math.exp(-Math.pow((progress-.62)/.045,2)),settlePulse=Math.exp(-Math.pow((progress-.86)/.065,2));glitchEnvelope=Math.max(glitchEnvelope,swapPulse*.65,settlePulse);const tick=Math.sin(Math.floor(t*36)*17.1+i*4.7)*settlePulse*transition.glitch;for(const[obj,isIncoming]of[[slot.from,!1],[slot.to,!0]]){if(!obj)continue;const isActive=slot.sameGlyph?!isIncoming:incoming===isIncoming,extra=!slot.from,opacity=extra?smooth(motion/.34):1;obj.visible=(extra||isActive)&&opacity>.001&&!passedCamera,opacityFor(obj,opacity),obj.position.set(x+tick*.12,y+tick*.04,z),obj.rotation.set(0,slot.sameGlyph?Math.sin(Math.PI*motion)*.55:extra?-Math.PI*.75*(1-motion):incoming?-Math.PI*(1-motion):Math.PI*motion,tick*.012);const xyScale=THREE.MathUtils.lerp(start.xyScale,end.xyScale,motion);obj.scale.set(xyScale,xyScale,THREE.MathUtils.lerp(.01,end.depthScale,portal)*(extra||slot.sameGlyph?1:.015+.985*edge))}}return glitchEnvelope},recedeSupportingLines=function(t){supportingLines.forEach((obj,i)=>{const travel=smooth((t-2.65-i*.09)/1.3);obj.position.z=-145*travel,depthFade(obj,travel,.6)})},drawWarpDots=function(S){wctx.clearRect(0,0,W,H);const vis=S.warp;if(vis<.01)return;const cx=W/2,cy=H/2;for(let i=0;i<warpDots.length;i++){const d=warpDots[i];let z=((d.z-S.travel)%WARP_MAX_Z+WARP_MAX_Z)%WARP_MAX_Z;z<.05&&(z+=WARP_MAX_Z);const scale=300/z,sx=cx+d.x*scale,sy=cy+d.y*scale,size=P.warpDotSize/z*3;if(size<.3||sx<-10||sx>W+10||sy<-10||sy>H+10)continue;const alpha=Math.min(1,2/z)*vis*P.warpDotOpacity;if(wctx.globalAlpha=alpha,wctx.fillStyle=P.warpDotColor,wctx.beginPath(),wctx.arc(sx,sy,size,0,Math.PI*2),wctx.fill(),z<2&&size>1){const streakLen=(2-z)*20*vis,dx=sx-cx,dy=sy-cy,dist=Math.sqrt(dx*dx+dy*dy)||1;wctx.globalAlpha=alpha*.3,wctx.beginPath(),wctx.moveTo(sx,sy),wctx.lineTo(sx+dx/dist*streakLen,sy+dy/dist*streakLen),wctx.strokeStyle=P.warpDotColor,wctx.lineWidth=size*.5,wctx.stroke()}}wctx.globalAlpha=1},renderScene=function(t){const S=window.__wptState,portal=S.portal,push=S.push,transAmount=1-Math.abs(portal*2-1),effTrans=Math.min(1,Math.max(transAmount,S.exitFx*.85));camera.fov=THREE.MathUtils.lerp(P.initialFOV,P.finalFOV,portal)+push*10,camera.position.z=THREE.MathUtils.lerp(P.cameraDistance,P.cameraDistance3D,portal)-push*52+Math.sin(t*.34)*1.6*portal*(1-push);const driftAmp=portal*(1-.7*push);camera.rotation.x=Math.cos(t*.47)*.04*driftAmp,camera.rotation.y=Math.sin(t*.62+1.2)*.06*driftAmp,camera.position.x=Math.sin(t*.41)*1.4*driftAmp,camera.position.y=Math.cos(t*.29)*1*driftAmp,camera.updateProjectionMatrix(),camera.updateMatrixWorld(),portalPass.uniforms.uPortalRadius.value=portal*P.portalScale,portalPass.uniforms.uPortalProgress.value=portal,portalPass.uniforms.uTime.value=t,postfxPass.uniforms.uVignetteIntensity.value=P.vignetteIntensity*portal,postfxPass.uniforms.uChromaticAberration.value=P.chromaticAberration*portal,postfxPass.uniforms.uScanlineIntensity.value=P.scanlineIntensity*portal,postfxPass.uniforms.uTime.value=t;const blurAmount=P.edgeBlur*portal;blurPassH.uniforms.uBlurAmount.value=blurAmount,blurPassV.uniforms.uBlurAmount.value=blurAmount,transFXPass.uniforms.uTransAmount.value=effTrans,glitchPass.uniforms.uTime.value=t,glitchPass.uniforms.uShakePower.value=P.glitchPower*S.glitch,glitchPass.uniforms.uShakeRate.value=S.glitch>.001?1:0,glitchPass.uniforms.uShakeColorRate.value=P.glitchColorRate*Math.min(1,S.glitch*1.8);const showContent=portal>.01;gridLines.visible=showContent,contentGroup.visible=showContent,bgPlane.visible=showContent;const colorT=Math.min(1,Math.max(0,(portal-.15)*P.portalColorSpeed));bgPlaneMat.color.copy(startCol).lerp(endCol,colorT),gridMat.uniforms.uCameraPos.value.copy(camera.position),gridMat.uniforms.uTime.value=t;for(let i=0;i<floatingShapes.length;i++){const mesh=floatingShapes[i],base=mesh.userData.basePos,phase=i*2.17;mesh.position.x=base.x+Math.sin(t*.15+phase)*1.2+Math.sin(t*.07+phase*3)*.5,mesh.position.y=base.y+Math.sin(t*.12+phase*1.4)*.8+Math.cos(t*.09+phase*2)*.3,mesh.position.z=base.z+Math.sin(t*.1+phase*.7)*.6+P.contentZOffset*portal,mesh.rotation.x=Math.sin(t*.08+phase)*.4,mesh.rotation.y=t*.05*(i%2===0?1:-1)+phase,mesh.rotation.z=Math.sin(t*.06+phase*1.3)*.3}contentGroup.position.z=P.contentZOffset*portal;for(let i=0;i<textMeshes.length;i++){const obj=textMeshes[i];if(obj.userData.isLetter){obj.position.z=obj.userData.targetZ*portal;const zScale=THREE.MathUtils.lerp(.01,obj.userData.depthScale,portal);obj.scale.z=zScale}obj.position.y=obj.userData.baseY+Math.sin(t*.6+i*.7)*.12*portal}const handoffGlitch=handoffLetters(t,portal);recedeSupportingLines(t);const glitch=Math.max(S.glitch*.5,handoffGlitch*.35)*transition.glitch;if(glitchPass.uniforms.uShakePower.value=P.glitchPower*glitch,glitchPass.uniforms.uShakeRate.value=glitch>.001?1:0,glitchPass.uniforms.uShakeColorRate.value=P.glitchColorRate*glitch*1.8,portal<.001){renderer.clear(),wctx.clearRect(0,0,W,H);return}composer.render(),drawWarpDots(S)};const rand=mulberry32(20260824),phraseRand=mulberry32(20260831),P={gridLineColor:"#ffffff",gridSpacing:29,gridSize:500,gridOpacity:.15,gridFadeStart:1,gridFadeEnd:175,gridOffsetX:-14.5,gridGlowSpeed:8.7,gridGlowIntensity:1.3,textDepthMin:.28,textDepthMax:2,letterZSpread:4,outlineColor:"#ffffff",outlineWidth:1.5,starburstPoints:24,portalChromatic:0,portalEdgeBlur:.15,portalIrregularity:window.__wptBurstChaos!==void 0?window.__wptBurstChaos:1,portalStartColor:"#e8e8e8",portalScale:.8,portalColorSpeed:1.7,warpDotCount:1e3,warpDotSize:2,warpDotOpacity:.7,warpDotColor:"#888888",transChromatic:.01,transZoomBlur:3.2,transDistortion:.05,transBrightness:1.6,transContrast:1.25,transSaturation:0,cameraDistance:22,initialFOV:100,cameraDistance3D:66,finalFOV:72,contentZOffset:30,vignetteIntensity:1.7,chromaticAberration:.006,scanlineIntensity:.25,edgeBlur:50,edgeBlurSpread:.15,glitchPower:.2,glitchSpeed:3,glitchBlockSize:15,glitchColorRate:.009,ambientIntensity:.5,keyLightIntensity:4.25,keyLightX:2,keyLightY:-2.5,keyLightZ:4.5,bgColor:"#000000"},W=1920,H=1080,ACCENT=window.__wptAccent||"#F5C518",PortalCompositeShader={uniforms:{tDiffuse:{value:null},uPortalRadius:{value:0},uPortalCenter:{value:new THREE.Vector2(.5,.5)},uStarburstPoints:{value:P.starburstPoints},uChromaticStrength:{value:P.portalChromatic},uEdgeBlur:{value:P.portalEdgeBlur},uIrregularity:{value:P.portalIrregularity},uStartColor:{value:new THREE.Color(P.portalStartColor)},uPortalProgress:{value:0},uTime:{value:0},uOuterBlur:{value:0}},vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform sampler2D tDiffuse;
              uniform float uPortalRadius;
              uniform vec2 uPortalCenter;
              uniform int uStarburstPoints;
              uniform float uChromaticStrength;
              uniform float uEdgeBlur;
              uniform float uIrregularity;
              uniform vec3 uStartColor;
              uniform float uPortalProgress;
              uniform float uTime;
              uniform float uOuterBlur;
              varying vec2 vUv;

              float hash(float n) { return fract(sin(n) * 43758.5453); }

              void main() {
                vec2 uv = vUv;
                vec2 center = uPortalCenter;
                vec2 delta = uv - center;
                float dist = length(delta);
                float angle = atan(delta.y, delta.x);

                float points = float(uStarburstPoints);
                float spikeLength = 0.2 * uPortalRadius;
                float valleyDepth = 0.08 * uPortalRadius;
                float baseR = uPortalRadius - valleyDepth;

                float seed = floor(uTime * 0.4) * 7.13;

                // Low-frequency undulation: the base ellipse itself wobbles.
                float wob = sin(angle * 2.0 + seed * 1.7)
                          * 0.45 + sin(angle * 3.0 - seed * 2.3 + 1.9) * 0.33
                          + sin(angle * 5.0 + seed * 0.9 + 4.2) * 0.22;
                baseR *= 1.0 + wob * 0.16 * uIrregularity;

                // Warp the angle before segmenting: spikes cluster and gap
                // instead of sitting on an even sunburst lattice.
                float aw = angle
                         + (sin(angle * 3.0 + seed + 0.7) * 0.55
                          + sin(angle * 5.0 - seed * 1.3 + 2.3) * 0.35)
                           * 0.45 * uIrregularity;

                float segAngle = 6.28318 / points;
                float localAngle = mod(aw + 3.14159, segAngle);
                float segIndex = floor((aw + 3.14159) / segAngle);

                float t = localAngle / segAngle;

                // Per-spike character: off-centre tips, fat-to-needle sharpness,
                // broad length spread with occasional dominant spikes.
                float h1 = hash(segIndex * 17.3 + seed);
                float h2 = hash(segIndex * 31.7 + seed + 5.1);
                float h3 = hash(segIndex * 47.9 + seed + 9.7);
                float tip = mix(0.5, mix(0.2, 0.8, h2), min(uIrregularity, 1.0));
                float spike = t < tip ? t / max(tip, 1e-3)
                                      : (1.0 - t) / max(1.0 - tip, 1e-3);
                spike = pow(clamp(spike, 0.0, 1.0),
                            mix(1.0, mix(0.55, 3.2, h3), min(uIrregularity, 1.0)));
                float lenVar = mix(0.35, 1.15, h1) + pow(h2, 6.0) * 1.8;
                float spikeScale = mix(1.0, lenVar, min(uIrregularity, 1.5));

                float thisSpike = spike * spikeLength * spikeScale;
                float starShape = baseR + thisSpike;

                float feather = max(0.002, uEdgeBlur);
                float mask = smoothstep(starShape + feather, starShape - feather, dist);

                if (mask < 0.001) {
                  gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
                  return;
                }

                float edgeDist = abs(dist - starShape);
                float edgeFactor = smoothstep(feather * 3.0, 0.0, edgeDist) * uChromaticStrength;
                vec2 chrDir = normalize(delta + 0.001) * edgeFactor;

                float r = texture2D(tDiffuse, uv + chrDir).r;
                float g = texture2D(tDiffuse, uv).g;
                float b = texture2D(tDiffuse, uv - chrDir).b;
                vec3 sceneColor = vec3(r, g, b);

                gl_FragColor = vec4(sceneColor, mask);
              }
            `},TransitionFXShader={uniforms:{tDiffuse:{value:null},uTransAmount:{value:0},uChromatic:{value:P.transChromatic},uZoomBlur:{value:P.transZoomBlur},uDistortion:{value:P.transDistortion},uBrightness:{value:P.transBrightness},uContrast:{value:P.transContrast},uSaturation:{value:P.transSaturation}},vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform sampler2D tDiffuse;
              uniform float uTransAmount;
              uniform float uChromatic;
              uniform float uZoomBlur;
              uniform float uDistortion;
              uniform float uBrightness;
              uniform float uContrast;
              uniform float uSaturation;
              varying vec2 vUv;

              void main() {
                if (uTransAmount < 0.001) {
                  gl_FragColor = texture2D(tDiffuse, vUv);
                  return;
                }

                vec2 uv = vUv;
                vec2 center = uv - 0.5;
                float dist = length(center);

                vec2 distortedUV = uv + center * dist * dist * uDistortion * uTransAmount;
                distortedUV = clamp(distortedUV, 0.0, 1.0);

                vec3 color = vec3(0.0);
                float totalWeight = 0.0;
                float blurAmount = uZoomBlur * uTransAmount * 0.1;
                for (int i = 0; i < 10; i++) {
                  float t = float(i) / 9.0;
                  float weight = 1.0 - t * 0.6;
                  vec2 sampleUV = clamp(distortedUV + center * blurAmount * t, 0.0, 1.0);
                  color += texture2D(tDiffuse, sampleUV).rgb * weight;
                  totalWeight += weight;
                }
                color /= totalWeight;

                float caAmount = uChromatic * uTransAmount;
                vec2 caDir = normalize(center + 0.001) * caAmount;
                color.r = mix(color.r, texture2D(tDiffuse, clamp(distortedUV + caDir, 0.0, 1.0)).r, uTransAmount);
                color.b = mix(color.b, texture2D(tDiffuse, clamp(distortedUV - caDir, 0.0, 1.0)).b, uTransAmount);

                float brightness = mix(1.0, uBrightness, uTransAmount);
                color *= brightness;

                float contrast = mix(1.0, uContrast, uTransAmount);
                color = (color - 0.5) * contrast + 0.5;

                float saturation = mix(1.0, uSaturation, uTransAmount);
                float lum = dot(color, vec3(0.299, 0.587, 0.114));
                color = mix(vec3(lum), color, saturation);

                gl_FragColor = vec4(clamp(color, 0.0, 1.0), texture2D(tDiffuse, uv).a);
              }
            `},GlitchShader={uniforms:{tDiffuse:{value:null},uTime:{value:0},uShakePower:{value:0},uShakeRate:{value:0},uShakeSpeed:{value:P.glitchSpeed},uShakeBlockSize:{value:P.glitchBlockSize},uShakeColorRate:{value:0}},vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform sampler2D tDiffuse;
              uniform float uTime;
              uniform float uShakePower;
              uniform float uShakeRate;
              uniform float uShakeSpeed;
              uniform float uShakeBlockSize;
              uniform float uShakeColorRate;
              varying vec2 vUv;

              float random(float seed) {
                return fract(543.2543 * sin(dot(vec2(seed, seed), vec2(3525.46, -54.3415))));
              }

              void main() {
                float enable_shift = float(
                  random(trunc(uTime * uShakeSpeed)) < uShakeRate
                );

                vec2 fixed_uv = vUv;
                fixed_uv.x += (
                  random(
                    (trunc(vUv.y * uShakeBlockSize) / uShakeBlockSize) + uTime
                  ) - 0.5
                ) * uShakePower * enable_shift;

                vec4 pixel_color = texture2D(tDiffuse, fixed_uv);
                pixel_color.r = mix(
                  pixel_color.r,
                  texture2D(tDiffuse, fixed_uv + vec2(uShakeColorRate, 0.0)).r,
                  enable_shift
                );
                pixel_color.b = mix(
                  pixel_color.b,
                  texture2D(tDiffuse, fixed_uv + vec2(-uShakeColorRate, 0.0)).b,
                  enable_shift
                );

                gl_FragColor = pixel_color;
              }
            `},EdgeBlurShader={uniforms:{tDiffuse:{value:null},uDirection:{value:new THREE.Vector2(1,0)},uBlurAmount:{value:0},uSpread:{value:P.edgeBlurSpread},uResolution:{value:new THREE.Vector2(W,H)}},vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform sampler2D tDiffuse;
              uniform vec2 uDirection;
              uniform float uBlurAmount;
              uniform float uSpread;
              uniform vec2 uResolution;
              varying vec2 vUv;

              void main() {
                vec2 center = vUv - 0.5;
                float dist = length(center);
                float blurStart = (1.0 - uSpread) * 0.5;
                float edgeFactor = smoothstep(blurStart, blurStart + 0.3, dist);
                float radius = edgeFactor * uBlurAmount;

                if (radius < 0.5) {
                  gl_FragColor = texture2D(tDiffuse, vUv);
                  return;
                }

                vec2 texelSize = 1.0 / uResolution;
                vec2 step = uDirection * texelSize * radius;

                vec4 result = vec4(0.0);
                result += texture2D(tDiffuse, vUv - step * 6.0) * 0.002;
                result += texture2D(tDiffuse, vUv - step * 5.0) * 0.009;
                result += texture2D(tDiffuse, vUv - step * 4.0) * 0.028;
                result += texture2D(tDiffuse, vUv - step * 3.0) * 0.066;
                result += texture2D(tDiffuse, vUv - step * 2.0) * 0.121;
                result += texture2D(tDiffuse, vUv - step * 1.0) * 0.175;
                result += texture2D(tDiffuse, vUv)               * 0.198;
                result += texture2D(tDiffuse, vUv + step * 1.0) * 0.175;
                result += texture2D(tDiffuse, vUv + step * 2.0) * 0.121;
                result += texture2D(tDiffuse, vUv + step * 3.0) * 0.066;
                result += texture2D(tDiffuse, vUv + step * 4.0) * 0.028;
                result += texture2D(tDiffuse, vUv + step * 5.0) * 0.009;
                result += texture2D(tDiffuse, vUv + step * 6.0) * 0.002;

                gl_FragColor = result;
              }
            `},PostFXShader={uniforms:{tDiffuse:{value:null},uVignetteIntensity:{value:0},uChromaticAberration:{value:0},uScanlineIntensity:{value:0},uTime:{value:0}},vertexShader:`
              varying vec2 vUv;
              void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `,fragmentShader:`
              uniform sampler2D tDiffuse;
              uniform float uVignetteIntensity;
              uniform float uChromaticAberration;
              uniform float uScanlineIntensity;
              uniform float uTime;
              varying vec2 vUv;

              void main() {
                vec2 uv = vUv;
                vec2 center = uv - 0.5;
                float dist = length(center);
                float dist2 = dot(center, center);

                float edgeFactor = smoothstep(0.2, 0.6, dist);
                float caStrength = uChromaticAberration * edgeFactor;
                vec2 caDir = normalize(center + 0.001) * caStrength;
                vec3 color;
                color.r = texture2D(tDiffuse, clamp(uv + caDir, 0.0, 1.0)).r;
                color.g = texture2D(tDiffuse, uv).g;
                color.b = texture2D(tDiffuse, clamp(uv - caDir, 0.0, 1.0)).b;

                float scanline = sin(uv.y * 800.0 + uTime * 2.0) * 0.5 + 0.5;
                scanline = pow(scanline, 8.0) * uScanlineIntensity;
                color -= scanline * 0.08;
                float noiseLine = fract(sin(floor(uv.y * 400.0 + uTime * 5.0) * 43758.5453)) * uScanlineIntensity * 0.03;
                color += noiseLine;

                float vignette = 1.0 - dist2 * uVignetteIntensity;
                vignette = smoothstep(0.0, 0.5, clamp(vignette, 0.0, 1.0));
                color *= vignette;

                gl_FragColor = vec4(color, texture2D(tDiffuse, uv).a);
              }
            `},GridLineShader={uniforms:{uColor:{value:new THREE.Color(P.gridLineColor)},uOpacity:{value:P.gridOpacity},uFadeStart:{value:P.gridFadeStart},uFadeEnd:{value:P.gridFadeEnd},uCameraPos:{value:new THREE.Vector3},uTime:{value:0},uGlowSpeed:{value:P.gridGlowSpeed},uGlowIntensity:{value:P.gridGlowIntensity}},vertexShader:`
              varying vec3 vWorldPos;
              void main() {
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPos = worldPos.xyz;
                gl_Position = projectionMatrix * viewMatrix * worldPos;
              }
            `,fragmentShader:`
              uniform vec3 uColor;
              uniform float uOpacity;
              uniform float uFadeStart;
              uniform float uFadeEnd;
              uniform vec3 uCameraPos;
              uniform float uTime;
              uniform float uGlowSpeed;
              uniform float uGlowIntensity;
              varying vec3 vWorldPos;

              float hash(float n) { return fract(sin(n) * 43758.5453); }

              void main() {
                float dist = distance(vWorldPos, uCameraPos);
                float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);
                if (fade < 0.01) discard;

                float dotGlow = 0.0;
                float dotRadius = 0.4;

                for (int d = 0; d < 5; d++) {
                  float di = float(d);
                  float seedX = hash(floor(vWorldPos.y * 10.0) * 137.0 + floor(vWorldPos.z * 10.0) * 311.0 + di * 73.0);
                  float dotPosX = mod(uTime * uGlowSpeed * (0.5 + seedX * 2.0) + seedX * 200.0, 300.0) - 150.0;
                  dotGlow += exp(-pow((vWorldPos.x - dotPosX) / dotRadius, 2.0)) * 0.5;

                  float seedY = hash(floor(vWorldPos.x * 10.0) * 173.0 + floor(vWorldPos.z * 10.0) * 271.0 + di * 91.0);
                  float dotPosY = mod(uTime * uGlowSpeed * (0.5 + seedY * 2.0) + seedY * 200.0, 300.0) - 150.0;
                  dotGlow += exp(-pow((vWorldPos.y - dotPosY) / dotRadius, 2.0)) * 0.5;

                  float seedZ = hash(floor(vWorldPos.x * 10.0) * 251.0 + floor(vWorldPos.y * 10.0) * 197.0 + di * 59.0);
                  float dotPosZ = mod(uTime * uGlowSpeed * (0.5 + seedZ * 2.0) + seedZ * 200.0, 300.0) - 150.0;
                  dotGlow += exp(-pow((vWorldPos.z - dotPosZ) / dotRadius, 2.0)) * 0.5;
                }

                dotGlow *= uGlowIntensity;

                float finalAlpha = (uOpacity + dotGlow) * fade;
                vec3 finalColor = uColor * (1.0 + dotGlow * 3.0);

                gl_FragColor = vec4(finalColor, min(finalAlpha, 1.0));
              }
            `},assetUrl=path=>typeof __hfHost<"u"&&__hfHost.assetUrl?__hfHost.assetUrl(path):path,ttfBuffer=await fetch(__hfAsset(assetUrl("assets/fonts/Geist-Bold.ttf"))).then(r=>r.arrayBuffer()),font=new FontLoader().parse(new TTFLoader().parse(ttfBuffer));try{await document.fonts.ready}catch{}for(const id of["wpt-headline"]){const el=document.getElementById(id);el.scrollWidth>1760&&(el.style.fontSize=Math.floor(176*(1760/el.scrollWidth))+"px")}const canvas=document.getElementById("wpt-three"),renderer=new THREE.WebGLRenderer({canvas,antialias:!0,alpha:!0,stencil:!0,preserveDrawingBuffer:!0});renderer.setSize(W,H,!1),renderer.setPixelRatio(1),renderer.setClearColor(0,0),renderer.toneMapping=THREE.NoToneMapping;const scene=new THREE.Scene,gridScene=new THREE.Scene,camera=new THREE.PerspectiveCamera(P.initialFOV,W/H,.1,500);camera.position.set(0,0,P.cameraDistance),camera.lookAt(0,0,0),scene.add(new THREE.AmbientLight(16777215,P.ambientIntensity));const dirLight=new THREE.DirectionalLight(16777215,P.keyLightIntensity);dirLight.position.set(P.keyLightX,P.keyLightY,P.keyLightZ),scene.add(dirLight);const bgPlaneMat=new THREE.MeshBasicMaterial({color:P.portalStartColor,side:THREE.DoubleSide}),bgPlane=new THREE.Mesh(new THREE.PlaneGeometry(500,500),bgPlaneMat);bgPlane.position.z=-100,bgPlane.renderOrder=-10,gridScene.add(bgPlane);const gridPositions=[];{const count=Math.floor(P.gridSize/P.gridSpacing),he=P.gridSize;for(let a=-count;a<=count;a++)for(let b=-count;b<=count;b++){const ca=a*P.gridSpacing,cb=b*P.gridSpacing;gridPositions.push(-he,ca,cb,he,ca,cb),gridPositions.push(ca,-he,cb,ca,he,cb),gridPositions.push(ca,cb,-he,ca,cb,he)}}const gridGeo=new THREE.BufferGeometry;gridGeo.setAttribute("position",new THREE.Float32BufferAttribute(gridPositions,3));const gridMat=new THREE.ShaderMaterial({uniforms:THREE.UniformsUtils.clone(GridLineShader.uniforms),vertexShader:GridLineShader.vertexShader,fragmentShader:GridLineShader.fragmentShader,transparent:!0,depthWrite:!1}),gridLines=new THREE.LineSegments(gridGeo,gridMat);gridLines.position.x=P.gridOffsetX,gridLines.visible=!1,gridScene.add(gridLines);const floatingShapes=[],shapeConfigs=[{size:1.8,basePos:[-8,5,2],color:ACCENT},{size:1.4,basePos:[7,-3,1],color:ACCENT},{size:1,basePos:[-6,-6,3],color:"#1a1a1a"},{size:1.2,basePos:[9,6,2],color:ACCENT}];for(const cfg of shapeConfigs){const geo=new THREE.ExtrudeGeometry(triangleShape(cfg.size),{depth:.3,bevelEnabled:!0,bevelThickness:.02,bevelSize:.02,bevelSegments:2});geo.center();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:cfg.color,roughness:.4,metalness:.1}));mesh.position.set(cfg.basePos[0],cfg.basePos[1],cfg.basePos[2]),mesh.userData.basePos=new THREE.Vector3(...cfg.basePos),scene.add(mesh),floatingShapes.push(mesh)}const contentGroup=new THREE.Group;contentGroup.visible=!1,scene.add(contentGroup);const textMeshes=[],fovRad=P.initialFOV*Math.PI/180,visH=2*P.cameraDistance*Math.tan(fovRad/2),visW=visH*(W/H),lineResolution=new THREE.Vector2(W,H);document.querySelectorAll("#wpt-headline [data-3d-char]").forEach(span=>{const ch=span.textContent;if(!ch||ch.trim()==="")return;const r=offsetRect(span);r.width<1||r.height<1||createLetterAt(ch,rectToWorld(r))});const sourceLetters=textMeshes.slice(),kickEl=document.getElementById("wpt-kicker-text");kickEl&&kickEl.textContent.trim()&&createFlatLine(kickEl.textContent,rectToWorld(offsetRect(kickEl)),.7,.6);const subEl=document.getElementById("wpt-subtitle");subEl&&subEl.textContent.trim()&&createFlatLine(subEl.textContent,rectToWorld(offsetRect(subEl)),.7,.6);const supportingLines=textMeshes.filter(obj=>obj.userData.isSupporting),replacementLetters=[],transition=window.__wptTransition,clamp01=v=>Math.max(0,Math.min(1,v)),smooth=v=>{const x=clamp01(v);return x*x*(3-2*x)},phraseLayout=layoutPhrase(window.__wptPhrase);for(const{char,rect,row}of phraseLayout.glyphs){const letter=createLetterAt(char,rectToWorld(rect),phraseRand),distance2=P.cameraDistance3D-P.contentZOffset,perspective=(distance2-letter.userData.targetZ)/distance2;letter.userData.baseX*=perspective,letter.userData.baseY*=perspective,letter.userData.xyScale*=perspective,letter.userData.row=row,replacementLetters.push(letter)}const slots=replacementLetters.map(to=>({from:null,to})),remaining=new Set(sourceLetters),distance=(a,b)=>Math.hypot(a.baseX-b.baseX,a.baseY-b.baseY);for(const exactOnly of[!0,!1])for(const slot of slots){if(slot.from)continue;let closest=null,cost=1/0;for(const letter of remaining){if(exactOnly&&letter.userData.char!==slot.to.userData.char)continue;const candidateCost=distance(letter.userData,slot.to.userData);candidateCost<cost&&(closest=letter,cost=candidateCost)}closest&&(slot.from=closest,remaining.delete(closest))}for(const from of remaining)slots.push({from,to:null});slots.forEach((slot,i)=>{const target=slot.to||slot.from;slot.start=slot.from?slot.from.userData:{baseX:target.userData.baseX*1.25,baseY:target.userData.baseY*1.25,targetZ:-60-phraseRand()*65,xyScale:target.userData.xyScale},slot.end=(slot.to||slot.from).userData;const rank=i/Math.max(1,replacementLetters.length-1);slot.delay=clamp01(rank)*transition.duration*.26,slot.sameGlyph=!!(slot.from&&slot.to&&slot.from.userData.char===slot.to.userData.char),slot.sameGlyph&&(slot.to.visible=!1)});const renderTarget=new THREE.WebGLRenderTarget(W,H,{format:THREE.RGBAFormat,type:THREE.HalfFloatType,depthBuffer:!0,samples:4}),composer=new EffectComposer(renderer,renderTarget);composer.setSize(W,H);const gridRenderPass=new RenderPass(gridScene,camera);gridRenderPass.clearAlpha=0,composer.addPass(gridRenderPass);const contentRenderPass=new RenderPass(scene,camera);contentRenderPass.clear=!1,composer.addPass(contentRenderPass);const blurPassH=new ShaderPass(EdgeBlurShader);blurPassH.uniforms.uDirection.value.set(1,0),composer.addPass(blurPassH);const blurPassV=new ShaderPass(EdgeBlurShader);blurPassV.uniforms.uDirection.value.set(0,1),composer.addPass(blurPassV);const postfxPass=new ShaderPass(PostFXShader);composer.addPass(postfxPass);const glitchPass=new ShaderPass(GlitchShader);composer.addPass(glitchPass);const transFXPass=new ShaderPass(TransitionFXShader);composer.addPass(transFXPass);const portalPass=new ShaderPass(PortalCompositeShader);portalPass.material.transparent=!0,composer.addPass(portalPass),composer.addPass(new OutputPass);const wctx=document.getElementById("wpt-warp").getContext("2d",{willReadFrequently:!0}),warpDots=[];{const count=P.warpDotCount,depthLayers=Math.ceil(Math.cbrt(count)*2),sideCount=Math.ceil(Math.sqrt(count/depthLayers));outer:for(let iz=0;iz<depthLayers;iz++)for(let iy=0;iy<sideCount;iy++)for(let ix=0;ix<sideCount;ix++){if(warpDots.length>=count)break outer;warpDots.push({x:(ix-(sideCount-1)/2)*1,y:(iy-(sideCount-1)/2)*1,z:iz*1+.5})}}const WARP_MAX_Z=Math.max(10,Math.ceil(Math.cbrt(P.warpDotCount)*2)),startCol=new THREE.Color(P.portalStartColor),endCol=new THREE.Color(P.bgColor);window.__wptRender=renderScene;const tl=__hfTimelineSlot.get();renderScene(tl?tl.time():0),window.__hf=window.__hf||{},window.__hf.buildReady=window.__hf.buildReady||{},window.__hf.buildReady["wireframe-portal-title"]=(async()=>{const warmDur=tl?tl.duration():0;for(const f of[.3,.5,.7])await Promise.resolve(),renderScene(warmDur*f);renderScene(tl?tl.time():0),renderer.getContext().finish()})()}__hfRootElement.querySelectorAll("img").forEach(image=>{image.src=__hfAsset(image.getAttribute("src"))});
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          data-hf-id="hf-ek69"
          id="root"
          data-composition-id="wireframe-portal-title"
          data-start="0"
          data-duration="8"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[&#123;"id":"title","type":"string","label":"Title","default":"BREAKTHROUGH","maxLength":18&#125;,&#123;"id":"replacementPhrase","type":"string","label":"3D replacement phrase (auto layout)","default":"Lets do this sir!","description":"Every word is preserved. Whole-word line wrapping and type size adapt to the 3D frame."&#125;,&#123;"id":"phraseDuration","type":"number","label":"Phrase transition duration (s)","default":1.85,"min":0.65,"max":2.9,"step":0.05,"unit":"s","description":"Total time for the letter transition, including the stagger. Lower is faster. The opening and white return keep their original timing."&#125;,&#123;"id":"phraseEasing","type":"number","label":"Transition easing (1 gentle – 8 snap)","default":8,"min":1,"max":8,"step":0.25,"description":"Higher values keep the beginning slow and concentrate acceleration at the letter swap, then settle gently. 4 is the default."&#125;,&#123;"id":"settleGlitch","type":"number","label":"Letter settle glitch strength","default":0.2,"min":0,"max":4,"step":0.05,"description":"Scales the deterministic block glitch and letter jitter around swap and settling. 0 disables it; 4 makes it strongest."&#125;,&#123;"id":"depthFog","type":"boolean","label":"Depth fog (early fade always on)","default":true,"description":"Dims receding outlines into the dark scene. Early opacity fades remain active when fog is off."&#125;,&#123;"id":"subtitle","type":"string","label":"Subtitle","default":"HYPERFRAMES PORTAL TITLE","maxLength":48&#125;,&#123;"id":"accent","type":"color","label":"Accent","default":"#F5C518"&#125;,&#123;"id":"burstChaos","type":"number","label":"Burst chaos (0-2)","default":1,"min":0,"max":2,"step":0.01&#125;]'>
          <section
            data-hf-id="hf-50tz"
            id="wpt-scene"
            class="clip"
            data-start="0"
            data-duration="8"
            data-track-index="1"
          >
            <div data-hf-id="hf-6av1" id="wpt-under"></div>
    
            <div data-hf-id="hf-r32l" id="wpt-card" data-layout-allow-occlusion="">
              <div data-hf-id="hf-0bgu" id="wpt-kicker">
                <span data-hf-id="hf-m027" id="wpt-kicker-text">HYPERFRAMES PRESENTS</span>
              </div>
              <h1 data-hf-id="hf-pwyf" id="wpt-headline"></h1>
              <div data-hf-id="hf-jivp" id="wpt-subtitle"></div>
            </div>
    
            <div data-hf-id="hf-dugk" id="wpt-white" data-layout-allow-occlusion=""></div>
          </section>
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
    background: #000;
  }
  .hf-port {
    font-family: "Geist", "Inter", system-ui, sans-serif;
  }
  #root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  .clip {
    position: absolute;
    inset: 0;
  }
  /* dark underlay (never on the root itself) */
  #wpt-under {
    position: absolute;
    inset: 0;
    background: #0b0b0b;
  }
  /* ---- flat 2D title card ---- */
  #wpt-card {
    position: absolute;
    inset: 0;
    background: #e8e8e8;
    color: #0a0a0a;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  #wpt-kicker {
    font-weight: 600;
    font-size: 22px;
    letter-spacing: 0;
    text-indent: 0;
    color: #1f1f1f;
    margin-bottom: 34px;
    display: flex;
    align-items: center;
    gap: 18px;
  }
  #wpt-headline {
    font-weight: 700;
    font-size: 176px;
    line-height: 1;
    letter-spacing: 0.03em;
    white-space: nowrap;
    color: #0a0a0a;
  }
  #wpt-headline span {
    display: inline-block;
  }
  #wpt-subtitle {
    margin-top: 40px;
    font-weight: 400;
    font-size: 34px;
    letter-spacing: 0.02em;
    color: #3d3d3d;
  }
  /* ---- canvas layers (intentionally cover the 2D card once the portal opens) ---- */
  #wpt-three, #wpt-warp {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #wpt-white {
    position: absolute;
    inset: 0;
    background: #ffffff;
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
