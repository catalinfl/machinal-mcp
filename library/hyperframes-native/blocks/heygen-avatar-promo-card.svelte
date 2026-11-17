<!-- Modified Svelte adaptation of registry/blocks/heygen-avatar-promo-card/heygen-avatar-promo-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-heygen-avatar-promo-card';
  import __hfAsset from '@machinal/hyperframes/media/blocks-heygen-avatar-promo-card';
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
    await loadHyperframeFonts(__hfFonts);

          const variables =
            __hfHost && typeof __hfHost.getVariables === "function"
              ? __hfHost.getVariables()
              : {};
          const root = document.getElementById("heygen-avatar-promo-card");
          const text = (id, fallback) =>
            typeof variables[id] === "string" && variables[id].trim() ? variables[id] : fallback;
          const color = (id, fallback) => text(id, fallback);

          root.style.setProperty("--apc-canvas", color("canvasColor", "#eaf6fa"));
          root.style.setProperty("--apc-ink", color("inkColor", "#0a1418"));
          root.style.setProperty("--apc-muted", color("mutedInkColor", "#47545b"));
          root.style.setProperty("--apc-accent", color("accentColor", "#00c3ff"));
          root.style.setProperty("--apc-light-tile", color("lightTileColor", "#f7fcfe"));
          root.style.setProperty("--apc-dark-tile", color("darkTileColor", "#0b1215"));
          document.querySelectorAll(".brand-tile img, #apc-hdr-logo img").forEach((image) => {
            image.src = __hfAsset(text("brandLogo", "assets/heygen-logo.svg"));
          });
          document.getElementById("apc-hdr-title").firstChild.nodeValue = text(
            "titleLine1",
            "Your avatar,",
          );
          document.getElementById("apc-title-line-2").textContent = text("titleLine2", "by HeyGen.");
          document.getElementById("apc-hdr-subhead").textContent = text(
            "subhead",
            "AI video, camera-free.",
          );
          document.getElementById("apc-pill-1").textContent = text("pill1", "4K AVATARS");
          document.getElementById("apc-pill-2").textContent = text("pill2", "NO CAMERA NEEDED");
          document.getElementById("apc-offer-value").textContent = text("offerValue", "25%");
          document.getElementById("apc-offer-suffix").textContent = text("offerSuffix", "OFF");
          document.getElementById("apc-code-label").textContent = text("codeLabel", "CODE");
          document.getElementById("apc-promo-prefix").textContent = text("promoPrefix", "GEN");
          document.getElementById("apc-promo-suffix").textContent = text("promoSuffix", "25");

          const tl = gsap.timeline({ paused: true });

          // Belt conveyor — measured from reference: 93.601 px/s constant, leftward
          tl.fromTo("#apc-belt-linear", { x: 0 }, { x: -936.01, duration: 10, ease: "none" }, 0);
          // Belt entry — measured offset table, one keyframe per source frame, linear between
          const entryX = [
            0, -11.39, -21.64, -30.9, -39.04, -46.29, -52.55, -57.98, -62.72, -66.71, -69.99, -72.75,
            -74.86, -76.52, -77.85, -78.8, -79.36, -79.75, -79.87, -79.94, -80.0,
          ];
          for (let i = 1; i < entryX.length; i++) {
            tl.fromTo(
              "#apc-belt-entry",
              { x: entryX[i - 1] },
              { x: entryX[i], duration: 0.04, ease: "none", immediateRender: i === 1 },
              (i - 1) * 0.04,
            );
          }

          // Header waterfall — measured fades
          tl.fromTo(
            "#apc-hdr-logo",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
            0.0,
          );
          tl.fromTo(
            "#apc-hdr-title",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.6, ease: "power2.out" },
            0.1,
          );
          tl.fromTo(
            "#apc-hdr-subhead",
            { autoAlpha: 0 },
            { autoAlpha: 1, duration: 0.4, ease: "power2.out" },
            0.5,
          );
          // pills static from frame 0

          
          __hfTimelineSlot.set(tl);
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="heygen-avatar-promo-card"
          data-composition-id="heygen-avatar-promo-card"
          data-start="0"
          data-width="1080"
          data-height="1920"
          data-duration="10"
          data-fps="25"
         data-composition-variables='[
        &#123; "id": "brandLogo", "type": "image", "role": "content", "label": "Brand logo", "description": "Horizontal transparent wordmark used in the header and belt.", "default": "assets/heygen-logo.svg" &#125;,
        &#123; "id": "titleLine1", "type": "string", "role": "content", "label": "Headline line 1", "description": "First headline line.", "default": "Your avatar," &#125;,
        &#123; "id": "titleLine2", "type": "string", "role": "content", "label": "Headline line 2", "description": "Second headline line.", "default": "by HeyGen." &#125;,
        &#123; "id": "subhead", "type": "string", "role": "content", "label": "Subhead", "description": "Supporting line under the headline.", "default": "AI video, camera-free." &#125;,
        &#123; "id": "pill1", "type": "string", "role": "content", "label": "Pill 1", "description": "First feature pill.", "default": "4K AVATARS" &#125;,
        &#123; "id": "pill2", "type": "string", "role": "content", "label": "Pill 2", "description": "Second feature pill.", "default": "NO CAMERA NEEDED" &#125;,
        &#123; "id": "offerValue", "type": "string", "role": "content", "label": "Offer value", "description": "Large offer value in the light tile.", "default": "25%" &#125;,
        &#123; "id": "offerSuffix", "type": "string", "role": "content", "label": "Offer suffix", "description": "Large offer suffix in the adjacent light tile.", "default": "OFF" &#125;,
        &#123; "id": "codeLabel", "type": "string", "role": "content", "label": "Promo code label", "description": "Small label above the promo code.", "default": "CODE" &#125;,
        &#123; "id": "promoPrefix", "type": "string", "role": "content", "label": "Promo code prefix", "description": "Accent-colored promo-code prefix.", "default": "GEN" &#125;,
        &#123; "id": "promoSuffix", "type": "string", "role": "content", "label": "Promo code suffix", "description": "Light promo-code suffix.", "default": "25" &#125;,
        &#123; "id": "canvasColor", "type": "color", "role": "style", "label": "Canvas color", "description": "Main card background.", "default": "#eaf6fa" &#125;,
        &#123; "id": "inkColor", "type": "color", "role": "style", "label": "Ink color", "description": "Primary headline, pill, and offer ink.", "default": "#0a1418" &#125;,
        &#123; "id": "mutedInkColor", "type": "color", "role": "style", "label": "Muted ink color", "description": "Subhead ink.", "default": "#47545b" &#125;,
        &#123; "id": "accentColor", "type": "color", "role": "style", "label": "Accent color", "description": "Brand accent used by tiles and promo-code prefix.", "default": "#00c3ff" &#125;,
        &#123; "id": "lightTileColor", "type": "color", "role": "style", "label": "Light tile color", "description": "Light belt-tile surface.", "default": "#f7fcfe" &#125;,
        &#123; "id": "darkTileColor", "type": "color", "role": "style", "label": "Dark tile color", "description": "Dark belt-tile surface.", "default": "#0b1215" &#125;
      ]'>
          <div class="bgfill"></div>
    
          
          <div id="apc-belt-linear">
            <div id="apc-belt-entry">
              
              <div class="tile row1 cyan brand-tile" style="left: 139.1px">
                <img src={__hfAsset("assets/heygen-logo.svg?t=1")} alt="" />
              </div>
              <video
                class="tile row1 clip"
                id="apc-v-r1k1"
                src={__hfAsset("assets/av_r1k1.mp4")}
                style="left: 523.4px"
                data-start="0"
                data-duration="8.60"
                data-track-index="1"
                muted
                playsinline
              ></video>
              <div id="apc-offer-value" class="tile row1 light serif-tile" style="left: 907.7px">
                25%
              </div>
              <video
                class="tile row1 clip"
                id="apc-v-r1k3"
                src={__hfAsset("assets/av_r1k3.mp4")}
                style="left: 1292px"
                data-start="1.44"
                data-duration="8.56"
                data-track-index="2"
                muted
                playsinline
              ></video>
              <video
                class="tile row1 clip"
                id="apc-v-r1k4"
                src={__hfAsset("assets/av_r1k4.mp4")}
                style="left: 1676.3px"
                data-start="5.56"
                data-duration="4.44"
                data-track-index="3"
                muted
                playsinline
              ></video>
              <div class="tile row1 cyan" style="left: 2060.6px"></div>
              
              <video
                class="tile row2 clip"
                id="apc-v-r2k0"
                src={__hfAsset("assets/av_r2k0.mp4")}
                style="left: 139.1px"
                data-start="0"
                data-duration="4.48"
                data-track-index="4"
                muted
                playsinline
              ></video>
              <div
                id="apc-offer-suffix"
                class="tile row2 light serif-tile"
                style="left: 523.4px; font-size: 146px"
              >
                OFF
              </div>
              <video
                class="tile row2 clip"
                id="apc-v-r2k2"
                src={__hfAsset("assets/av_r2k2.mp4")}
                style="left: 907.7px"
                data-start="0"
                data-duration="10"
                data-track-index="5"
                muted
                playsinline
              ></video>
              <div class="tile row2 dark code-tile" style="left: 1292px">
                <div id="apc-code-label" class="code">CODE</div>
                <div class="promo">
                  <span id="apc-promo-prefix" class="gen">GEN</span
                  ><span id="apc-promo-suffix" class="n25">25</span>
                </div>
              </div>
              <div class="tile row2 light brand-tile" style="left: 1676.3px">
                <img src={__hfAsset("assets/heygen-logo.svg?t=2")} alt="" />
              </div>
              <div class="tile row2 dark" style="left: 2060.6px"></div>
            </div>
          </div>
    
          
          <div class="hdr" id="apc-hdr-logo"><img src={__hfAsset("assets/heygen-logo.svg")} alt="HeyGen" /></div>
          <div class="hdr" id="apc-hdr-title">
            Your avatar,
            <div id="apc-title-line-2">by HeyGen.</div>
          </div>
          <div class="hdr" id="apc-hdr-subhead">AI video, camera-free.</div>
          <div class="hdr" id="apc-hdr-pills">
            <div id="apc-pill-1" class="pill">4K AVATARS</div>
            <div id="apc-pill-2" class="pill">NO CAMERA NEEDED</div>
          </div>
    
          <audio
            id="apc-bgm"
            class="clip"
            src={__hfAsset("assets/bgm.m4a")}
            data-start="0"
            data-duration="10"
            data-track-index="0"
          ></audio>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; overflow: hidden;
  }
  /* The source project used proprietary HeyGen brand fonts. These OFL faces
  keep the public catalog block self-contained and redistributable. */






  .hf-port {
    margin: 0;
    padding: 0;
    background: #000;
    font-family: "AvatarSans", sans-serif;
  }
  /* palette: canvas #EAF6FA · ink #0A1418 · light tile #F7FCFE · dark tile #0B1215 ·
  cyan #00C3FF (fills / dark-bg display only) · subhead #47545B */
  #heygen-avatar-promo-card {
    position: relative;
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    --apc-canvas: #eaf6fa;
    --apc-ink: #0a1418;
    --apc-muted: #47545b;
    --apc-accent: #00c3ff;
    --apc-light-tile: #f7fcfe;
    --apc-dark-tile: #0b1215;
  }
  .bgfill {
    position: absolute;
    inset: 0;
    background: var(--apc-canvas);
  }

  .hdr {
    position: absolute;
    left: 0;
    width: 1080px;
    text-align: center;
    color: var(--apc-ink);
  }
  #apc-hdr-logo {
    top: 118px;
    height: 44px;
  }
  #apc-hdr-logo img {
    height: 44px;
  }
  #apc-hdr-title {
    top: 205px;
    font-family: "AvatarDisplay", serif;
    font-weight: 700;
    font-size: 148px;
    line-height: 150px;
    letter-spacing: -0.02em;
  }
  #apc-hdr-subhead {
    top: 524px;
    font-family: "AvatarSans", sans-serif;
    font-weight: 500;
    font-size: 37px;
    color: var(--apc-muted);
    letter-spacing: -0.01em;
  }
  #apc-hdr-pills {
    top: 1590px;
    display: flex;
    justify-content: center;
    gap: 28px;
  }
  .pill {
    border: 2px solid var(--apc-ink);
    border-radius: 999px;
    padding: 0 42px;
    height: 92px;
    line-height: 88px;
    font-family: "AvatarSans", sans-serif;
    font-weight: 600;
    font-size: 27px;
    letter-spacing: 0.12em;
    color: var(--apc-ink);
  }

  #apc-belt-linear {
    position: absolute;
    top: 640px;
    left: 0;
    width: 2600px;
    height: 784px;
  }
  #apc-belt-entry {
    position: absolute;
    inset: 0;
  }
  .tile {
    position: absolute;
    width: 362px;
    height: 380px;
    border-radius: 30px;
    overflow: hidden;
    display: block;
  }
  .row1 {
    top: 0;
  }
  .row2 {
    top: 404px;
  }
  .tile video {
    width: 362px;
    height: 380px;
    object-fit: cover;
    display: block;
  }
  .light {
    background: var(--apc-light-tile);
  }
  .dark {
    background: var(--apc-dark-tile);
  }
  .cyan {
    background: var(--apc-accent);
  }
  .serif-tile {
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "AvatarDisplay", serif;
    font-weight: 500;
    font-size: 165px;
    color: var(--apc-ink);
  }
  .brand-tile {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .brand-tile img {
    width: 240px;
  }
  .code-tile {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 26px;
  }
  .code-tile .code {
    font-family: "AvatarSans", sans-serif;
    font-weight: 600;
    font-size: 26px;
    letter-spacing: 0.42em;
    color: #8fa3ad;
    text-indent: 0.42em;
  }
  .code-tile .promo {
    font-family: "AvatarSans", sans-serif;
    font-weight: 800;
    font-size: 92px;
    letter-spacing: -0.01em;
  }
  .code-tile .promo .gen {
    color: var(--apc-accent);
  }
  .code-tile .promo .n25 {
    color: #fbfcfc;
  }
}
</style>
