<!-- Modified Svelte adaptation of registry/examples/play-mode/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/examples-play-mode';
  import __hfAsset from '@machinal/hyperframes/media/examples-play-mode';
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

              (function () {
                const tl = gsap.timeline({ paused: true });
                const bg = document.getElementById("background-layer");
                // Sync with A-roll framing 3 (4.659s)
                tl.to(bg, { backgroundColor: "#0057FF", duration: 0.5 }, 4.659);
                // Sync with A-roll framing 4 (8.88s)
                tl.to(bg, { backgroundColor: "#FFFFFF", duration: 0.5 }, 8.88);
                __hfTimelineSlot.set(tl);
              })();
            

              (function () {
                const tl = gsap.timeline({ paused: true });
                const container = document.getElementById("aroll-container");
                gsap.set(container, { y: -1100, scale: 0.8 });
                tl.to(container, { y: 0, duration: 1.2, ease: "elastic.out(1, 0.6)" }, 0);
                tl.to(container, { scale: 1.4, x: -300, duration: 1, ease: "back.out(1.7)" }, 1.839);
                tl.to(container, { scale: 0.7, x: 400, duration: 1, ease: "back.out(1.7)" }, 4.659);
                tl.to(container, { scale: 0.9, x: 0, duration: 1, ease: "back.out(1.7)" }, 8.88);
                __hfTimelineSlot.set(tl);
              })();
            

            
            const tl = gsap.timeline({ paused: true });
            __hfTimelineSlot.set(tl);
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#ffffff">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="main-composition"
          data-composition-id="main-video"
          data-start="0"
          data-duration="__VIDEO_DURATION__"
          data-width="1920"
          data-height="1080"
        >
          
          <div
            id="bg-comp"
            data-composition-id="background"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-width="1920"
            data-height="1080"
            data-track-index="1"
          >
            <div id="background-layer"></div>
            
            
          </div>
    
          
          <div
            id="aroll-comp"
            data-composition-id="aroll-layer"
            data-duration="__VIDEO_DURATION__"
            data-width="1920"
            data-height="1080"
            data-track-index="10"
          >
            <div id="aroll-container">
              <video
                id="short_mag_cut"
                src={__hfAsset("__VIDEO_SRC__")}
                playsinline
                data-has-audio="true"
                data-start="0"
                data-duration="__VIDEO_DURATION__"
                data-track-index="1"
                style="width: 100%; height: auto"
              ></video>
            </div>
            
            
          </div>
    
          
          <div
            id="intro-comp"
            data-composition-id="intro"
            data-composition-src="compositions/intro.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-width="1920"
            data-height="1080"
            data-track-index="100"
          ></div>
          <div
            id="captions-comp"
            data-track-kind="captions"
            data-composition-id="captions"
            data-composition-src="compositions/captions.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-width="1920"
            data-height="1080"
            data-track-index="200"
          ></div>
          <div
            id="stats-comp"
            data-composition-id="stats"
            data-composition-src="compositions/stats.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-width="1920"
            data-height="1080"
            data-track-index="150"
          ></div>
    
          
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port {
    margin: 0;
    padding: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background-color: #ffffff;
    font-family: "Nunito", sans-serif;
  }

  #main-composition {
    width: 1920px;
    height: 1080px;
    position: relative;
  }

  #bg-comp, #aroll-comp, #intro-comp, #stats-comp, #captions-comp {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  #bg-comp {
    z-index: 1;
  }

  #aroll-comp {
    z-index: 10;
  }

  #intro-comp {
    z-index: 100;
  }

  #stats-comp {
    z-index: 150;
  }

  #captions-comp {
    z-index: 200;
  }

  #aroll-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 0;
  }

  #short_mag_cut {
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    border: 8px solid #ffffff;
  }

  #background-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #ffffff;
    z-index: 0;
  }


  #background-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #ffffff;
  }


  #aroll-container {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  #short_mag_cut {
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    border: 8px solid #ffffff;
  }
}
</style>
