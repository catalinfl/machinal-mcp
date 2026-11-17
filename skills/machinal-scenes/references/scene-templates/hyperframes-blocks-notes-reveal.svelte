<!-- Modified Svelte adaptation of registry/blocks/notes-reveal/notes-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-notes-reveal';
  import __hfAsset from '@machinal/hyperframes/media/blocks-notes-reveal';
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
    await loadHyperframeFonts(__hfFonts);const NOTE_LINES=[];(function(){var vars=__hfHost&&typeof __hfHost.getVariables=="function"?__hfHost.getVariables():{};function t(v,fb,mx){if(typeof v!="string")return fb;var s=v.trim();return s?s.length>mx?s.slice(0,mx):s:fb}document.getElementById("title-l1").textContent=t(vars.titleL1,"Things nobody told me",34),document.getElementById("title-l2").textContent=t(vars.titleL2,"about video.",34);var BODY_DEFAULTS=["my videos sucked","my tools cost $$$","and re-edits never end.","then i tried writing html only","started HyperFrames three weeks ago","the grind is gone, but more than that \u2014","I ship videos weekly."];BODY_DEFAULTS.forEach(function(fallback,li){var text=t(vars["noteLine"+(li+1)],fallback,52);NOTE_LINES.push(text);var host=document.getElementById("line-"+li);host.textContent="";for(var ri=0;ri<text.length;ri++){var ch=document.createElement("span");ch.className="ch",ch.id="ch-"+li+"-"+ri,ch.textContent=text.charAt(ri),host.appendChild(ch)}}),document.getElementById("hl1").textContent=t(vars.cardTop,"THE POWER",16),document.getElementById("hl2").textContent=t(vars.cardMid,"OF",6);var bottom=t(vars.cardBottom,"ONE FILE",16),cut=bottom.indexOf(" "),head=cut===-1?bottom:bottom.slice(0,cut),tail=cut===-1?"":bottom.slice(cut+1),hl3Head=document.getElementById("hl3-head"),hl3Tail=document.getElementById("hl3-tail");hl3Head.textContent=head,hl3Tail.textContent=tail,hl3Tail.style.display=tail?"":"none";var labels=document.querySelectorAll(".cl-label"),values=document.querySelectorAll(".cl-value");labels[0].textContent=t(vars.check1Label,"WRITE",18),values[0].textContent=t(vars.check1Value,"HTML",18),labels[1].textContent=t(vars.check2Label,"RENDER",18),values[1].textContent=t(vars.check2Value,"IN 4K",18),labels[2].textContent=t(vars.check3Label,"SHIP",18),values[2].textContent=t(vars.check3Value,"TODAY",18),document.getElementById("brand-domain").textContent=t(vars.brandDomain,"hyperframes.heygen.com",30),typeof vars.brandLogo=="string"&&vars.brandLogo.trim()&&document.getElementById("brand-mark").setAttribute("src",__hfAsset(vars.brandLogo.trim()))})();const FPS=30,EV=[[0,0,40],[0,1,42],[0,2,46],[0,3,48],[0,4,50],[0,5,53],[0,6,56],[0,7,59],[0,8,60],[0,9,62],[0,10,66],[0,11,68],[0,12,72],[0,13,74],[0,14,77],[0,15,80],[1,0,106],[1,1,108],[1,2,110],[1,3,114],[1,4,116],[1,5,119],[1,6,120],[1,7,122],[1,8,125],[1,9,127],[1,10,131],[1,11,132],[1,12,134],[1,13,137],[1,14,139],[1,15,142],[1,16,144],[2,0,167],[2,1,170],[2,2,172],[2,3,174],[2,4,176],[2,5,180],[2,6,182],[2,7,185],[2,8,187],[2,9,190],[2,10,192],[2,11,194],[2,12,196],[2,13,198],[2,14,200],[2,15,203],[2,16,205],[2,17,208],[2,18,210],[2,19,212],[2,20,216],[2,21,218],[2,22,221],[3,0,256],[3,1,258],[3,2,262],[3,3,264],[3,4,266],[3,5,269],[3,6,271],[3,7,274],[3,8,275],[3,9,277],[3,10,280],[3,11,281],[3,12,282],[3,13,284],[3,14,287],[3,15,288],[3,16,290],[3,17,293],[3,18,295],[3,19,298],[3,20,299],[3,21,301],[3,22,304],[3,23,306],[3,24,310],[3,25,311],[3,26,313],[3,27,316],[3,28,318],[3,29,320],[4,0,349],[4,1,352],[4,2,354],[4,3,356],[4,4,359],[4,5,361],[4,6,364],[4,7,366],[4,8,368],[4,9,371],[4,10,372],[4,11,374],[4,12,378],[4,13,380],[4,14,382],[4,15,385],[4,16,388],[4,17,389],[4,18,390],[4,19,394],[4,20,395],[4,21,397],[4,22,400],[4,23,401],[4,24,403],[4,25,406],[4,26,408],[4,27,410],[4,28,412],[4,29,414],[4,30,416],[4,31,419],[4,32,421],[4,33,424],[4,34,425],[5,0,449],[5,1,450],[5,2,452],[5,3,455],[5,4,457],[5,5,460],[5,6,462],[5,7,466],[5,8,468],[5,9,469],[5,10,472],[5,11,474],[5,12,476],[5,13,479],[5,14,481],[5,15,482],[5,16,485],[5,17,487],[5,18,490],[5,19,492],[5,20,493],[5,21,496],[5,22,497],[5,23,499],[5,24,502],[5,25,504],[5,26,506],[5,27,509],[5,28,510],[5,29,512],[5,30,515],[5,31,517],[5,32,520],[5,33,522],[5,34,523],[5,35,526],[5,36,528],[5,37,530],[5,38,532],[6,0,558],[6,1,560],[6,2,563],[6,3,565],[6,4,568],[6,5,571],[6,6,574],[6,7,575],[6,8,577],[6,9,580],[6,10,581],[6,11,584],[6,12,587],[6,13,589],[6,14,592],[6,15,593],[6,16,595],[6,17,599],[6,18,602],[6,19,604],[6,20,606]],JUMPS=[[86,1],[149,2],[226,3],[325,4],[430,5],[537,6]],LINE_TOPS=[296,446,596,746,896,1046,1196],SCROLLS=[{f0:149,px:120,pts:[[150,21.74],[151,53.93],[152,77.33],[153,77.33],[154,94.06],[155,102.95],[156,111.73],[157,115.18],[158,118.01],[159,118.01],[160,119.35],[161,119.87],[162,119.87],[163,119.87],[164,119.87],[165,119.87],[166,120]]},{f0:226,px:150,pts:[[227,9.29],[228,44.61],[229,74.77],[230,102.53],[231,102.53],[232,117.91],[233,133.34],[234,140.03],[235,145.24],[236,148.87],[237,148.87],[238,149.85],[239,149.95],[240,149.95],[241,149.95],[242,149.95],[243,149.95],[244,150]]},{f0:325,px:150,pts:[[326,9.11],[327,9.11],[328,31.8],[329,73],[330,100.53],[331,118.84],[332,131.65],[333,131.65],[334,140.05],[335,144.79],[336,148.7],[337,149.91],[338,149.95],[339,149.95],[340,149.95],[341,149.95],[342,150]]},{f0:430,px:150,pts:[[431,28.09],[432,60.69],[433,92.33],[434,113.98],[435,113.98],[436,125.5],[437,136.13],[438,143.99],[439,147.13],[440,149.17],[441,149.17],[442,149.97],[443,149.97],[444,149.97],[445,149.97],[446,149.97],[447,150]]},{f0:537,px:150,pts:[[538,25.26],[539,61.96],[540,93.98],[541,105],[542,122.63],[543,122.63],[544,138.9],[545,144.2],[546,147.27],[547,149.63],[548,149.95],[549,149.95],[550,149.95],[551,149.95],[552,149.95],[553,149.95],[554,150]]}],EASE=[0,.062,.297,.498,.684,.786,.889,.934,.968,.992,.999,1],CARET_H=54,CARET_GAP=2,TEXT_X=62,VIEW_TOP=272,FIT_FLOOR=.45;function fitWidth(el,maxWidth,basePx){el.style.fontSize=basePx+"px";const floor=Math.max(8,basePx*FIT_FLOOR);let px=basePx;for(;px>floor&&el.offsetWidth>maxWidth;)px-=1,el.style.fontSize=px+"px";return px}const HL1_MAX=700,HL2_MAX=792,HL3_MAX=661,NOTE_MAX=1080-TEXT_X-40,CL_LABEL_X=74,CL_VALUE_X=389,CL_CHECK_X=715,CL_GAP=16,CL_LABEL_SCALE=.86;function markSpan(id,text){const el=document.createElement("span");return el.id=id,el.textContent=text,el.setAttribute("data-layout-allow-overlap",""),el.setAttribute("data-layout-allow-occlusion",""),el}function fitAll(){fitWidth(document.getElementById("title-l1"),NOTE_MAX,88),fitWidth(document.getElementById("title-l2"),NOTE_MAX,88);for(let li=0;li<7;li++)fitWidth(document.getElementById("line-"+li),NOTE_MAX,52.5);const CL_LABEL_MAX=(CL_VALUE_X-CL_LABEL_X-CL_GAP)/CL_LABEL_SCALE,CL_VALUE_MAX=CL_CHECK_X-CL_VALUE_X-CL_GAP;document.querySelectorAll(".cl-label").forEach(el=>fitWidth(el,CL_LABEL_MAX,44)),document.querySelectorAll(".cl-value").forEach(el=>fitWidth(el,CL_VALUE_MAX,50));const hl1=document.getElementById("hl1"),hl1Text=hl1.dataset.text||hl1.textContent.trim();hl1.dataset.text=hl1Text;const lastSpace=hl1Text.lastIndexOf(" ");hl1.textContent="";const hl1Head=markSpan("hl1-head",lastSpace===-1?"":hl1Text.slice(0,lastSpace+1)),hl1Tail=markSpan("hl1-tail",lastSpace===-1?hl1Text:hl1Text.slice(lastSpace+1));hl1.appendChild(hl1Head),hl1.appendChild(hl1Tail),fitWidth(hl1,HL1_MAX,110);const UL_LEAD=44/110,UL_TAIL=4/110,UL_DROP=124/160,ul=document.getElementById("hl-ul"),hl1Px=parseFloat(hl1.style.fontSize);ul.style.left=hl1.offsetLeft+hl1Tail.offsetLeft-UL_LEAD*hl1Px+"px",ul.style.width=Math.max(24,hl1Tail.offsetWidth+UL_TAIL*hl1Px)+"px",ul.style.top=hl1.offsetTop+UL_DROP*hl1.offsetHeight+"px";const hl2=document.getElementById("hl2");fitWidth(hl2,HL2_MAX,100),hl2.style.left=Math.round((840-hl2.offsetWidth)/2)+2+"px";const hl3=document.getElementById("hl3");fitWidth(hl3,HL3_MAX,110);const head=document.getElementById("hl3-head"),headPad=parseFloat(getComputedStyle(head).paddingLeft)||0,glyphW=head.offsetWidth-headPad,hl3Px=parseFloat(hl3.style.fontSize),ringW=Math.max(40,glyphW-6/110*hl3Px),ringH=Math.max(40,head.offsetHeight*(150/157)),ring=document.getElementById("hl-circle");ring.setAttribute("width",ringW),ring.setAttribute("height",ringH),ring.setAttribute("viewBox","0 0 "+ringW+" "+ringH),ring.style.left=head.offsetLeft+headPad-44/110*hl3Px+"px",ring.style.top=head.offsetTop-9/110*hl3Px+"px";const ellipse=ring.querySelector("ellipse");ellipse.setAttribute("cx",ringW/2-5/110*hl3Px),ellipse.setAttribute("cy",ringH/2-3/110*hl3Px),ellipse.setAttribute("rx",ringW/2-8/110*hl3Px),ellipse.setAttribute("ry",ringH/2-14/110*hl3Px)}const LINE_FRAMES=(()=>{const byLine=[];return EV.forEach(([li,,f])=>(byLine[li]=byLine[li]||[]).push(f)),byLine})();function typingEvents(lines){const out=[];return lines.forEach((text,li)=>{const packaged=LINE_FRAMES[li];if(!packaged||!packaged.length||!text.length)return;if(text.length===packaged.length){for(let ri=0;ri<text.length;ri++)out.push([li,ri,packaged[ri]]);return}const f0=packaged[0],f1=packaged[packaged.length-1],span=Math.max(1,f1-f0);for(let ri=0;ri<text.length;ri++){const f=text.length===1?f0:f0+Math.round(span*ri/(text.length-1));out.push([li,ri,f])}}),out}const EVENTS=typingEvents(NOTE_LINES),tl=gsap.timeline({paused:!0}),body=document.getElementById("note-body"),caret=document.getElementById("caret"),t_at=f=>(f-.25)/FPS;function build(){tl.clear(),fitAll();const bodyRect=body.getBoundingClientRect(),scale=bodyRect.width/1080;tl.set(caret,{x:TEXT_X,y:LINE_TOPS[0]-8},0),document.querySelectorAll(".ch").forEach(el=>tl.set(el,{autoAlpha:0},0)),EVENTS.forEach(([li,ri,f])=>{const el=document.getElementById(`ch-${li}-${ri}`);if(!el)return;const cx=(el.getBoundingClientRect().right-bodyRect.left)/scale+CARET_GAP,cy=LINE_TOPS[li]-8;tl.set(el,{autoAlpha:1},t_at(f)),tl.set(caret,{x:cx,y:cy},t_at(f))}),JUMPS.forEach(([f,li])=>{tl.set(caret,{x:TEXT_X,y:LINE_TOPS[li]-8},t_at(f)-5e-4)});let cum=0;SCROLLS.forEach(s=>{s.pts.forEach(([f,dy])=>tl.set(body,{y:-(cum+dy)},t_at(f)));const lastF=s.pts[s.pts.length-1][0];tl.set(body,{y:-(cum+s.px)},t_at(lastF+1)),cum+=s.px}),tl.fromTo("#notes-fade",{opacity:1},{opacity:0,duration:.2833,ease:"none"},21.375)}build(),document.fonts.ready.then(()=>{build(),tl.pause(0)}),__hfTimelineSlot.set(tl),__hfRootElement.querySelectorAll("img").forEach(image=>{image.src=__hfAsset(image.getAttribute("src"))});
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="notes-reveal"
          data-width="1080"
          data-height="1920"
          data-duration="24.85"
          data-fps="30"
          data-start="0"
         data-composition-variables='[
        &#123; "id": "titleL1", "type": "string", "role": "content", "label": "Note title line 1", "description": "First line of the note title.", "default": "Things nobody told me" &#125;,
        &#123; "id": "titleL2", "type": "string", "role": "content", "label": "Note title line 2", "description": "Second line of the note title.", "default": "about video." &#125;,
        &#123; "id": "noteLine1", "type": "string", "role": "content", "label": "Note body line 1", "description": "First typed line of the note. The seven body lines are the bulk of the video: they must be about the brand this video promotes, not about video-making.", "default": "my videos sucked" &#125;,
        &#123; "id": "noteLine2", "type": "string", "role": "content", "label": "Note body line 2", "description": "Second typed line of the note.", "default": "my tools cost $" &#125;,
        &#123; "id": "noteLine3", "type": "string", "role": "content", "label": "Note body line 3", "description": "Third typed line of the note.", "default": "and re-edits never end." &#125;,
        &#123; "id": "noteLine4", "type": "string", "role": "content", "label": "Note body line 4", "description": "Fourth typed line of the note — the turn, where the brand enters.", "default": "then i tried writing html only" &#125;,
        &#123; "id": "noteLine5", "type": "string", "role": "content", "label": "Note body line 5", "description": "Fifth typed line of the note — name the brand here.", "default": "started HyperFrames three weeks ago" &#125;,
        &#123; "id": "noteLine6", "type": "string", "role": "content", "label": "Note body line 6", "description": "Sixth typed line of the note.", "default": "the grind is gone, but more than that —" &#125;,
        &#123; "id": "noteLine7", "type": "string", "role": "content", "label": "Note body line 7", "description": "Last typed line of the note — the payoff.", "default": "I ship videos weekly." &#125;,
        &#123; "id": "cardTop", "type": "string", "role": "content", "label": "Card headline top", "description": "First marker line on the closing card. The underline follows its last word.", "default": "THE POWER" &#125;,
        &#123; "id": "cardMid", "type": "string", "role": "content", "label": "Card headline middle", "description": "Short connector line between the two headline lines, centred on the card.", "default": "OF" &#125;,
        &#123; "id": "cardBottom", "type": "string", "role": "content", "label": "Card headline bottom", "description": "Last marker line on the closing card. Its first word is ringed.", "default": "ONE FILE" &#125;,
        &#123; "id": "check1Label", "type": "string", "role": "content", "label": "Checklist 1 label", "description": "Typewriter label of the first checklist row.", "default": "WRITE" &#125;,
        &#123; "id": "check1Value", "type": "string", "role": "content", "label": "Checklist 1 value", "description": "Marker value of the first checklist row.", "default": "HTML" &#125;,
        &#123; "id": "check2Label", "type": "string", "role": "content", "label": "Checklist 2 label", "description": "Typewriter label of the second checklist row.", "default": "RENDER" &#125;,
        &#123; "id": "check2Value", "type": "string", "role": "content", "label": "Checklist 2 value", "description": "Marker value of the second checklist row.", "default": "IN 4K" &#125;,
        &#123; "id": "check3Label", "type": "string", "role": "content", "label": "Checklist 3 label", "description": "Typewriter label of the third checklist row.", "default": "SHIP" &#125;,
        &#123; "id": "check3Value", "type": "string", "role": "content", "label": "Checklist 3 value", "description": "Marker value of the third checklist row.", "default": "TODAY" &#125;,
        &#123; "id": "brandLogo", "type": "image", "role": "content", "label": "Brand logo", "description": "Transparent mark of the brand this video promotes, in the sign-off strip under the card.", "portrays": ["subject_logo"], "default": "assets/hyperframes-logo-black.svg" &#125;,
        &#123; "id": "brandDomain", "type": "string", "role": "content", "label": "Sign-off domain", "description": "Domain of the brand this video promotes, closing the sign-off strip. Use the real domain, or a call to action when no domain fits.", "portrays": ["subject_domain"], "default": "hyperframes.heygen.com" &#125;
      ]'>
          
          <div
            class="clip"
            data-start="21.3567"
            data-duration="3.53"
            data-track-index="0"
            id="card-clip"
          >
            <div id="card-scene">
              <div id="card-dots"></div>
              <div id="card">
                <div
                  class="mk"
                  id="hl1"
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                  style="left: 116px; top: 72px"
                >
                  THE POWER
                </div>
                <div id="hl-ul" style="left: 333px; top: 196px"></div>
                <div
                  class="mk"
                  id="hl2"
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                  style="left: 356px; top: 181px"
                >
                  OF
                </div>
                <div
                  class="mk"
                  id="hl3"
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                  style="left: 155px; top: 329px"
                >
                  <svg
                    id="hl-circle"
                    style="left: -20px; top: -8px"
                    width="220"
                    height="150"
                    viewBox="0 0 220 150"
                  >
                    <ellipse
                      cx="105"
                      cy="72"
                      rx="102"
                      ry="61"
                      fill="none"
                      stroke="#602640"
                      stroke-width="8"
                    /></svg
                  ><span
                    id="hl3-head"
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="padding-left: 24px"
                    >ONE</span
                  ><span
                    id="hl3-tail"
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="padding-left: 52px"
                    >FILE</span
                  >
                </div>
    
                <div class="cl-label" style="left: 74px; top: 1073px">WRITE</div>
                <div class="cl-value" style="left: 389px; top: 1051px">HTML</div>
                <svg
                  class="cl-check"
                  style="left: 715px; top: 1059px"
                  width="50"
                  height="46"
                  viewBox="0 0 86 80"
                >
                  <path
                    d="M6 46 L30 72 L80 8"
                    fill="none"
                    stroke="#602640"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="cl-rule" style="left: 72px; top: 1139px"></div>
                <div class="cl-label" style="left: 72px; top: 1212px">RENDER</div>
                <div class="cl-value" style="left: 390px; top: 1188px">IN 4K</div>
                <svg
                  class="cl-check"
                  style="left: 715px; top: 1196px"
                  width="50"
                  height="46"
                  viewBox="0 0 86 80"
                >
                  <path
                    d="M6 46 L30 72 L80 8"
                    fill="none"
                    stroke="#602640"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="cl-rule" style="left: 65px; top: 1276px"></div>
                <div class="cl-label" style="left: 72px; top: 1347px">SHIP</div>
                <div class="cl-value" style="left: 389px; top: 1324px">TODAY</div>
                <svg
                  class="cl-check"
                  style="left: 715px; top: 1334px"
                  width="50"
                  height="46"
                  viewBox="0 0 86 80"
                >
                  <path
                    d="M6 46 L30 72 L80 8"
                    fill="none"
                    stroke="#602640"
                    stroke-width="6"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="cl-rule" style="left: 58px; top: 1412px"></div>
              </div>
              <div id="brand-strip">
                <img id="brand-mark" src={__hfAsset("assets/hyperframes-logo-black.svg")} alt="" />
                <div id="brand-domain">hyperframes.heygen.com</div>
              </div>
              <div id="nrv-video">
                <div id="nrv-play">
                  <svg width="52" height="58" viewBox="0 0 44 48" fill="none">
                    <path
                      d="M40.5 20.6 C43.2 22.1 43.2 25.9 40.5 27.4 L6.2 46.6 C3.5 48.1 0.2 46.2 0.2 43.2 L0.2 4.8 C0.2 1.8 3.5 -0.1 6.2 1.4 Z"
                      fill="#0d0d0d"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
    
          
          <div class="clip" data-start="0" data-duration="21.687" data-track-index="1" id="notes-clip">
            <div id="notes-fade" class="ui">
              
              <div class="sb" id="sb-time">9:41</div>
              <svg
                class="navicon"
                style="left: 822px; top: 52px"
                width="220"
                height="40"
                viewBox="0 0 220 40"
              >
                
                <rect x="0" y="22" width="7" height="12" rx="2" fill="#111" />
                <rect x="11" y="16" width="7" height="18" rx="2" fill="#111" />
                <rect x="22" y="10" width="7" height="24" rx="2" fill="#111" />
                <rect x="33" y="4" width="7" height="30" rx="2" fill="#111" />
                
                <path
                  d="M78 15 a26 26 0 0 1 34 0"
                  fill="none"
                  stroke="#111"
                  stroke-width="6"
                  stroke-linecap="round"
                />
                <path
                  d="M84 23 a17 17 0 0 1 22 0"
                  fill="none"
                  stroke="#111"
                  stroke-width="6"
                  stroke-linecap="round"
                />
                <circle cx="95" cy="31" r="5" fill="#111" />
                
                <rect
                  x="140"
                  y="6"
                  width="52"
                  height="28"
                  rx="9"
                  fill="none"
                  stroke="#111"
                  stroke-width="3"
                  opacity="0.5"
                />
                <rect x="144" y="10" width="34" height="20" rx="5" fill="#111" />
                <path d="M196 14 v12 a7 7 0 0 0 0 -12" fill="#111" opacity="0.5" />
              </svg>
              
              <div class="pill" id="nav-back"></div>
              <svg
                class="navicon"
                style="left: 74px; top: 166px"
                width="40"
                height="40"
                viewBox="0 0 40 40"
              >
                <path
                  d="M26 4 L10 20 L26 36"
                  fill="none"
                  stroke="#111"
                  stroke-width="4.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div class="pill" id="nav-mid"></div>
              <svg
                class="navicon"
                style="left: 588px; top: 168px"
                width="44"
                height="40"
                viewBox="0 0 44 40"
              >
                <path
                  d="M8 12 a 14 14 0 1 1 -3 14"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
                <path
                  d="M8 2 v11 h11"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <svg
                class="navicon"
                style="left: 702px; top: 162px"
                width="44"
                height="48"
                viewBox="0 0 44 48"
              >
                <path
                  d="M22 4 v26 M12 12 l10 -9 10 9"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
                <path
                  d="M8 22 h-2 v22 h32 v-22 h-2"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                class="navicon"
                style="left: 806px; top: 186px"
                width="66"
                height="12"
                viewBox="0 0 66 12"
              >
                <circle cx="6" cy="6" r="5.5" fill="#111" />
                <circle cx="33" cy="6" r="5.5" fill="#111" />
                <circle cx="60" cy="6" r="5.5" fill="#111" />
              </svg>
              <div id="nav-check"></div>
              <svg
                class="navicon"
                style="left: 958px; top: 168px"
                width="56"
                height="46"
                viewBox="0 0 56 46"
              >
                <path
                  d="M6 24 L21 38 L50 6"
                  fill="none"
                  stroke="#fff"
                  stroke-width="7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
    
              
              <div id="note-viewport">
                <div id="note-body">
                  <div
                    id="title-l1"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                  >
                    Things nobody told me
                  </div>
                  <div
                    id="title-l2"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                  >
                    about video.
                  </div>
                  <div
                    class="bodyline"
                    id="line-0"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 283px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-1"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 433px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-2"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 583px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-3"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 733px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-4"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 883px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-5"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 1033px"
                  ></div>
                  <div
                    class="bodyline"
                    id="line-6"
                    data-layout-allow-overflow
                    data-layout-allow-overlap
                    data-layout-allow-occlusion
                    style="top: 1183px"
                  ></div>
                  <div id="caret"></div>
                </div>
              </div>
    
              
              <div id="fmtbar"></div>
              <div
                class="fmtaa ui"
                style="
                  left: 52px;
                  width: 100px;
                  top: 878px;
                  font-size: 54px;
                  font-weight: 700;
                  color: #111;
                "
              >
                A<span style="font-size: 36px; font-weight: 400; align-self: center; margin-top: 12px"
                  >a</span
                >
              </div>
              <svg
                class="fmticon icon"
                style="left: 252px; top: 910px"
                width="64"
                height="54"
                viewBox="0 0 64 54"
              >
                <circle cx="10" cy="12" r="9" fill="none" stroke="#111" stroke-width="4" />
                <path
                  d="M6 12 l3 3 6 -7"
                  fill="none"
                  stroke="#111"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  x1="28"
                  y1="12"
                  x2="60"
                  y2="12"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
                <circle cx="10" cy="42" r="9" fill="none" stroke="#111" stroke-width="4" />
                <line
                  x1="28"
                  y1="42"
                  x2="52"
                  y2="42"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                class="fmticon icon"
                style="left: 432px; top: 906px"
                width="62"
                height="62"
                viewBox="0 0 62 62"
              >
                <rect
                  x="3"
                  y="3"
                  width="56"
                  height="56"
                  rx="8"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                />
                <line x1="3" y1="22" x2="59" y2="22" stroke="#111" stroke-width="4" />
                <line x1="3" y1="40" x2="59" y2="40" stroke="#111" stroke-width="4" />
                <line x1="22" y1="3" x2="22" y2="59" stroke="#111" stroke-width="4" />
                <line x1="40" y1="3" x2="40" y2="59" stroke="#111" stroke-width="4" />
              </svg>
              <svg
                class="fmticon icon"
                style="left: 612px; top: 902px"
                width="46"
                height="70"
                viewBox="0 0 46 70"
              >
                <path
                  d="M33 14 v34 a11 11 0 0 1 -22 0 V16 a8 8 0 0 1 16 0 v30 a4 4 0 0 1 -8 0 V20"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
              <svg
                class="fmticon icon"
                style="left: 774px; top: 906px"
                width="62"
                height="62"
                viewBox="0 0 62 62"
              >
                <circle cx="31" cy="31" r="27" fill="none" stroke="#111" stroke-width="4" />
                <path d="M22 40 L36 18 a5 5 0 0 1 8 6 L30 46 l-10 4 z" fill="#111" />
              </svg>
              <svg
                class="fmticon icon"
                style="left: 944px; top: 906px"
                width="64"
                height="62"
                viewBox="0 0 64 62"
              >
                <ellipse
                  cx="32"
                  cy="31"
                  rx="28"
                  ry="12"
                  fill="none"
                  stroke="#111"
                  stroke-width="3.5"
                  transform="rotate(25 32 31)"
                />
                <ellipse
                  cx="32"
                  cy="31"
                  rx="28"
                  ry="12"
                  fill="none"
                  stroke="#111"
                  stroke-width="3.5"
                  transform="rotate(-25 32 31)"
                />
                <ellipse
                  cx="32"
                  cy="31"
                  rx="28"
                  ry="12"
                  fill="none"
                  stroke="#111"
                  stroke-width="3.5"
                  transform="rotate(90 32 31)"
                />
              </svg>
    
              
              <div id="keyboard">
                <div class="sug" style="left: 155px">The</div>
                <div class="sug" style="left: 513px">My</div>
                <div class="sug" style="left: 886px">I</div>
                <div class="sugsep" style="left: 360px"></div>
                <div class="sugsep" style="left: 717px"></div>
                <div class="key" style="left: 18px; top: 99px; width: 87px; height: 106px">q</div>
                <div class="key" style="left: 124px; top: 99px; width: 87px; height: 106px">w</div>
                <div class="key" style="left: 231px; top: 99px; width: 87px; height: 106px">e</div>
                <div class="key" style="left: 337px; top: 99px; width: 87px; height: 106px">r</div>
                <div class="key" style="left: 444px; top: 99px; width: 87px; height: 106px">t</div>
                <div class="key" style="left: 550px; top: 99px; width: 87px; height: 106px">y</div>
                <div class="key" style="left: 656px; top: 99px; width: 87px; height: 106px">u</div>
                <div class="key" style="left: 763px; top: 99px; width: 87px; height: 106px">i</div>
                <div class="key" style="left: 869px; top: 99px; width: 87px; height: 106px">o</div>
                <div class="key" style="left: 976px; top: 99px; width: 87px; height: 106px">p</div>
                <div class="key" style="left: 72px; top: 230px; width: 87px; height: 106px">a</div>
                <div class="key" style="left: 178px; top: 230px; width: 87px; height: 106px">s</div>
                <div class="key" style="left: 285px; top: 230px; width: 87px; height: 106px">d</div>
                <div class="key" style="left: 391px; top: 230px; width: 87px; height: 106px">f</div>
                <div class="key" style="left: 498px; top: 230px; width: 87px; height: 106px">g</div>
                <div class="key" style="left: 604px; top: 230px; width: 87px; height: 106px">h</div>
                <div class="key" style="left: 710px; top: 230px; width: 87px; height: 106px">j</div>
                <div class="key" style="left: 817px; top: 230px; width: 87px; height: 106px">k</div>
                <div class="key" style="left: 923px; top: 230px; width: 87px; height: 106px">l</div>
                <div class="key" style="left: 178px; top: 359px; width: 87px; height: 106px">z</div>
                <div class="key" style="left: 284px; top: 359px; width: 87px; height: 106px">x</div>
                <div class="key" style="left: 391px; top: 359px; width: 87px; height: 106px">c</div>
                <div class="key" style="left: 497px; top: 359px; width: 87px; height: 106px">v</div>
                <div class="key" style="left: 604px; top: 359px; width: 87px; height: 106px">b</div>
                <div class="key" style="left: 710px; top: 359px; width: 87px; height: 106px">n</div>
                <div class="key" style="left: 816px; top: 359px; width: 87px; height: 106px">m</div>
                <div class="key gkey" style="left: 16px; top: 359px; width: 144px; height: 106px">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <path
                      d="M22 6 L38 22 H30 V38 H14 V22 H6 Z"
                      fill="none"
                      stroke="#111"
                      stroke-width="3"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <div class="key gkey" style="left: 920px; top: 359px; width: 143px; height: 106px">
                  <svg width="52" height="38" viewBox="0 0 52 38">
                    <path
                      d="M16 2 H48 V36 H16 L2 19 Z"
                      fill="none"
                      stroke="#111"
                      stroke-width="3"
                      stroke-linejoin="round"
                    />
                    <path
                      d="M25 12 l14 14 M39 12 l-14 14"
                      stroke="#111"
                      stroke-width="3"
                      stroke-linecap="round"
                    />
                  </svg>
                </div>
                <div
                  class="key gkey"
                  style="left: 17px; top: 489px; width: 135px; height: 106px; font-size: 38px"
                >
                  123
                </div>
                <div class="key" style="left: 172px; top: 489px; width: 119px; height: 106px">
                  <svg width="44" height="44" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="19" fill="none" stroke="#111" stroke-width="3" />
                    <circle cx="15" cy="17" r="2.6" fill="#111" />
                    <circle cx="29" cy="17" r="2.6" fill="#111" />
                    <path d="M13 27 a10 10 0 0 0 18 0 z" fill="#111" />
                  </svg>
                </div>
                <div
                  class="key"
                  style="left: 314px; top: 489px; width: 554px; height: 106px; font-size: 40px"
                >
                  space
                </div>
                <div class="key gkey" style="left: 889px; top: 489px; width: 173px; height: 106px">
                  <svg width="44" height="36" viewBox="0 0 44 36">
                    <path
                      d="M40 4 v14 H10 M18 8 l-10 10 10 10"
                      fill="none"
                      stroke="#111"
                      stroke-width="3.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                </div>
                <svg
                  class="icon"
                  style="position: absolute; left: 64px; top: 640px"
                  width="48"
                  height="48"
                  viewBox="0 0 48 48"
                >
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#333" stroke-width="3" />
                  <ellipse cx="24" cy="24" rx="9" ry="20" fill="none" stroke="#333" stroke-width="3" />
                  <line x1="4" y1="24" x2="44" y2="24" stroke="#333" stroke-width="3" />
                </svg>
                <svg
                  class="icon"
                  style="position: absolute; left: 972px; top: 634px"
                  width="44"
                  height="58"
                  viewBox="0 0 44 58"
                >
                  <rect
                    x="14"
                    y="2"
                    width="16"
                    height="30"
                    rx="8"
                    fill="none"
                    stroke="#333"
                    stroke-width="3.5"
                  />
                  <path
                    d="M6 26 a16 16 0 0 0 32 0 M22 44 v10 M12 54 h20"
                    fill="none"
                    stroke="#333"
                    stroke-width="3.5"
                    stroke-linecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  #root {
    position: relative;
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    background: #000;
  }
  .clip {
    position: absolute;
    inset: 0;
  }
  .ui {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ---------- scene: card (under) ---------- */
  #card-scene {
    position: absolute;
    inset: 0;
    background: #ece1d5;
  }
  #card-dots {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(circle, rgba(178, 150, 138, 0.18) 2px, transparent 2.6px);
    background-size: 36px 36px;
    background-position: 8px 6px;
  }
  #card {
    position: absolute;
    left: 119px;
    top: 210px;
    width: 840px;
    height: 1498px;
    background: #fcfcfc;
    transform: rotate(-3.03deg);
    box-shadow: 0 12px 30px rgba(90, 60, 40, 0.12);
  }
  .mk {
    font-family: "Permanent Marker", cursive;
    color: #602640;
    position: absolute;
    white-space: nowrap;
  }
  #hl1 {
    font-size: 110px;
    letter-spacing: 2px;
  }
  #hl2 {
    font-size: 100px;
  }
  #hl3 {
    font-size: 110px;
  }
  #hl-ul {
    position: absolute;
    width: 415px;
    height: 8px;
    background: #602640;
    border-radius: 4px;
  }
  #hl-circle {
    position: absolute;
  }
  .cl-label {
    font-family: "Courier Prime", monospace;
    font-weight: 700;
    font-size: 44px;
    letter-spacing: 0;
    color: #602640;
    position: absolute;
    transform: scaleX(0.86);
    transform-origin: left top;
  }
  .cl-value {
    font-family: "Permanent Marker", cursive;
    font-size: 50px;
    letter-spacing: 0;
    color: #602640;
    position: absolute;
  }
  .cl-check {
    position: absolute;
  }
  .cl-rule {
    position: absolute;
    width: 695px;
    height: 2.5px;
    background: #602640;
    opacity: 0.92;
  }
  /* Sign-off strip: the card ends at y=1708, leaving 212px of dotted scene. The
  advertiser's identity lives here rather than inside the card, so the hand-lettered
  headline and checklist keep the geometry they were designed with. */
  #brand-strip {
    position: absolute;
    left: 0;
    top: 1742px;
    width: 1080px;
    height: 132px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  #brand-mark {
    display: block;
    height: 52px;
    width: auto;
  }
  #brand-domain {
    font-family: "Courier Prime", monospace;
    font-weight: 700;
    font-size: 27px;
    letter-spacing: 4px;
    color: #602640;
    opacity: 0.62;
  }
  #nrv-video {
    position: absolute;
    left: 380px;
    top: 740px;
    width: 320px;
    height: 480px;
    border-radius: 40px;
    background: linear-gradient(165deg, #0f3a2c 0%, #0a9c6b 78%, #3ce6ac 100%);
    box-shadow: 0 20px 48px rgba(90, 60, 40, 0.28);
    transform: rotate(-3.03deg);
  }
  #nrv-play {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: rgba(253, 253, 253, 0.94);
    display: grid;
    place-items: center;
  }

  /* ---------- scene: notes (over) ---------- */
  #notes-fade {
    position: absolute;
    inset: 0;
    background: #fefefe;
  }
  .sb {
    position: absolute;
    color: #111;
  }
  #sb-time {
    left: 63px;
    top: 48px;
    font-size: 38px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  .pill {
    position: absolute;
    background: #ffffff;
    border-radius: 70px;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  }
  #nav-back {
    left: 38px;
    top: 130px;
    width: 110px;
    height: 110px;
  }
  #nav-mid {
    left: 540px;
    top: 130px;
    width: 380px;
    height: 110px;
  }
  #nav-check {
    position: absolute;
    left: 932px;
    top: 136px;
    width: 110px;
    height: 110px;
    border-radius: 55px;
    background: #fec909;
  }
  .navicon {
    position: absolute;
  }
  #note-viewport {
    position: absolute;
    left: 0;
    top: 272px;
    width: 1080px;
    height: 593px;
    overflow: hidden;
  }
  #note-body {
    position: absolute;
    left: 0;
    top: 0;
    width: 1080px;
    height: 2400px;
  }
  #title-l1, #title-l2 {
    position: absolute;
    left: 62px;
    font-size: 88px;
    font-weight: 700;
    letter-spacing: -0.005em;
    color: #191919;
    white-space: nowrap;
  }
  #title-l1 {
    top: 52px;
  }
  #title-l2 {
    top: 152px;
  }
  .bodyline {
    position: absolute;
    left: 62px;
    font-size: 52.5px;
    font-weight: 400;
    letter-spacing: 0em;
    color: #191919;
    /* `pre`, not `nowrap`: the per-character spans are built at runtime from the line
    variables, and a leading or trailing space in a supplied line would collapse under
    `nowrap` — the caret then stalls on a zero-width span. */
    white-space: pre;
  }
  #caret {
    position: absolute;
    left: 0;
    top: 0;
    width: 4.5px;
    height: 54px;
    background: #ffca00;
    border-radius: 2px;
  }
  #fmtbar {
    position: absolute;
    left: 35px;
    top: 878px;
    width: 1010px;
    height: 118px;
    background: #fdfdfd;
    border-radius: 59px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }
  .fmticon {
    position: absolute;
  }
  .fmtaa {
    position: absolute;
    height: 118px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  #keyboard {
    position: absolute;
    left: 0;
    top: 1033px;
    width: 1080px;
    height: 887px;
    background: #cfd3da;
  }
  .sug {
    position: absolute;
    top: 40px;
    font-size: 40px;
    color: #1b1b1b;
  }
  .sugsep {
    position: absolute;
    top: 44px;
    width: 2px;
    height: 44px;
    background: #b9bdc4;
  }
  .key {
    position: absolute;
    background: #fdfdfe;
    border-radius: 12px;
    box-shadow: 0 3px 0 rgba(120, 125, 135, 0.55);
    color: #111;
    font-size: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .gkey {
    background: #a9aeb5;
  }
  svg.icon {
    display: block;
  }
}
</style>
