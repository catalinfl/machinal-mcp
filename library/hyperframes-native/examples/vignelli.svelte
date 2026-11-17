<!-- Modified Svelte adaptation of registry/examples/vignelli/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/examples-vignelli';
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
    const tl = gsap.timeline({ paused: true });

            // Curtains rest off-screen left until their wipes begin.
            gsap.set("#curtain-black", { xPercent: -100 });
            gsap.set("#curtain-red", { xPercent: -100 });

            // Transition: Curtain Pull logic
            // A-roll leaves the screen at least once.
            // Timing: Let's do a curtain pull at 3.7s (transitioning to the 62% stat)
            // and return at 7.3s (end of attention stat).

            // Curtain Out (A-roll hidden)
            tl.to("#curtain-black", { xPercent: 0, duration: 0.2, ease: "power2.inOut" }, 3.5);
            tl.to("#a-roll-wrapper", { opacity: 0, duration: 0 }, 3.7);
            tl.to("#curtain-black", { xPercent: 100, duration: 0.4, ease: "power2.inOut" }, 3.7);

            // Curtain In (A-roll return)
            tl.set("#curtain-red", { xPercent: -100 }, 7.1);
            tl.to("#curtain-red", { xPercent: 0, duration: 0.2, ease: "power2.inOut" }, 7.1);
            tl.to("#a-roll-wrapper", { opacity: 1, duration: 0 }, 7.3);
            tl.to("#curtain-red", { xPercent: 100, duration: 0.4, ease: "power2.inOut" }, 7.3);

            
            __hfTimelineSlot.set(tl);
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#ffffff">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="main-composition"
          data-composition-id="main-comp"
          data-width="1080"
          data-height="1920"
          data-start="0"
          data-duration="__VIDEO_DURATION__"
        >
          
          <div id="curtain-black" class="curtain"></div>
          <div id="curtain-red" class="curtain red"></div>
    
          
          <div
            id="overlays-comp"
            data-composition-id="overlays"
            data-composition-src="compositions/overlays.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="2"
          ></div>
    
          
          <div
            id="captions-comp"
            data-track-kind="captions"
            data-composition-id="captions"
            data-composition-src="compositions/captions.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="3"
          ></div>
    
          
          <div class="grid-container">
            <div class="grid-column"></div>
            <div class="grid-column"></div>
            <div class="grid-column"></div>
            <div class="grid-column"></div>
            <div class="grid-column"></div>
            <div class="grid-column"></div>
          </div>
    
          
        </div>
    
        
        <div id="a-roll-wrapper">
          <video
            id="a-roll"
            src={__hfAsset("__VIDEO_SRC__")}
            playsinline
            data-has-audio="true"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="0"
          ></video>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; overflow: hidden;
  }
  .hf-port {
    margin: 0;
    padding: 0;
    background: #ffffff;
    overflow: hidden;
    width: 1080px;
    height: 1920px;
    font-family: "Helvetica", Arial, sans-serif;
  }

  /* 6-Column Grid System */
  .grid-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 1080px;
    height: 1920px;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    pointer-events: none;
    z-index: 1000;
    opacity: 0; /* Keep grid invisible but present for layout references */
  }

  .grid-column {
    border-right: 1px solid rgba(204, 0, 0, 0.2); /* Vignelli Red accent */
  }

  #main-composition {
    position: relative;
    width: 1080px;
    height: 1920px;
    background: #ffffff;
    overflow: hidden;
  }

  /* Layer Hosts */
  #a-roll-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    overflow: hidden;
  }

  #a-roll, #a-roll-wrapper img.__render_frame__, #a-roll-wrapper img.__preview_render_frame__ {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  #overlays-comp, #captions-comp {
    position: absolute;
    top: 0;
    left: 0;
    width: 1080px;
    height: 1920px;
    pointer-events: none;
  }

  #overlays-comp {
    z-index: 20;
  }

  #captions-comp {
    z-index: 30;
  }

  /* Curtain Transition Layer */
  .curtain {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: #1a1a1a;
    z-index: 25;
    pointer-events: none;
  }

  .curtain.red {
    background: #cc0000;
    z-index: 26;
  }
}
</style>
