<!-- Modified Svelte adaptation of registry/examples/swiss-grid/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/examples-swiss-grid';
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
    const masterTL = gsap.timeline({ paused: true });
            const v = document.getElementById("short_mag_cut_frame");

            // --- A-ROLL MOVEMENT (Structured Swiss Layout) ---

            // 1. Entrance (0-1.86s): Slide in from left, settle centered for Intro
            masterTL.fromTo(
              v,
              { x: -1000, y: 120, width: 960, height: 840 },
              { x: 480, y: 120, width: 960, height: 840, duration: 0.8, ease: "power2.out" },
              0,
            );

            // 2. Stat 1 (1.86s - 4.68s): Move to right side (Graphic is on left)
            masterTL.to(
              v,
              {
                x: 1080,
                y: 120,
                width: 720,
                height: 720,
                duration: 0.25,
                ease: "expo.out",
              },
              1.86,
            );

            // 3. Stat 2 (4.68s - 8.88s): Stay right, zoom in slightly
            masterTL.to(
              v,
              {
                x: 1080,
                y: 60,
                width: 780,
                height: 780,
                duration: 0.25,
                ease: "expo.out",
              },
              4.68,
            );

            // 4. Stat 3 (8.88s - 14.2s): Move to left side (Graphic is on right)
            masterTL.to(
              v,
              {
                x: 120,
                y: 120,
                width: 720,
                height: 720,
                duration: 0.25,
                ease: "expo.out",
              },
              8.88,
            );

            // 5. Conclusion (14.2s - 16.04s): Center large
            masterTL.to(
              v,
              {
                x: 240,
                y: 60,
                width: 1440,
                height: 810,
                duration: 0.5,
                ease: "expo.out",
              },
              14.2,
            );

            __hfTimelineSlot.set(masterTL);
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#f2f2f2">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="master-root"
          data-composition-id="master"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="__VIDEO_DURATION__"
        >
          
          <img id="bg-grid" class="background-grid" src={__hfAsset("assets/swiss-grid.svg")} alt="Grid" />
    
          
          <div
            id="intro-comp"
            class="overlay-layer"
            data-composition-id="intro"
            data-composition-src="compositions/intro.html"
            data-start="0"
            data-duration="1.86"
            data-track-index="2"
          ></div>
    
          
          <div
            id="graphics-comp"
            class="overlay-layer"
            data-composition-id="graphics"
            data-composition-src="compositions/graphics.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="3"
          ></div>
    
          
          <div
            id="captions-comp"
            data-track-kind="captions"
            class="overlay-layer"
            data-composition-id="captions"
            data-composition-src="compositions/captions.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="4"
          ></div>
    
          
        </div>
    
        
        <div id="short_mag_cut_frame">
          <video
            id="short_mag_cut"
            src={__hfAsset("__VIDEO_SRC__")}
            playsinline
            data-has-audio="true"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="1"
          ></video>
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
    background-color: #f2f2f2;
    overflow: hidden;
    font-family: "Helvetica", Arial, sans-serif;
  }

  #master-root {
    width: 1920px;
    height: 1080px;
    position: relative;
  }

  .background-grid {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
  }

  /* A-roll styling */
  #short_mag_cut_frame {
    position: absolute;
    border-radius: 8px; /* Required */
    z-index: 1;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    overflow: hidden;
    background: #000;
  }

  #short_mag_cut, #short_mag_cut_frame > img.__render_frame__, #short_mag_cut_frame > img.__preview_render_frame__ {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
  }

  /* Overlay layers */
  .overlay-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  #intro-comp {
    z-index: 2;
  }
  #graphics-comp {
    z-index: 3;
  }
  #captions-comp {
    z-index: 4;
  }
}
</style>
