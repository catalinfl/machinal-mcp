<!-- Modified Svelte adaptation of registry/examples/warm-grain/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/examples-warm-grain';
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
    __hfRootElement.style.setProperty("--hf-asset-0", 'url("' + __hfAsset("https://www.transparenttextures.com/patterns/natural-paper.png") + '")');

              const grainTl = gsap.timeline({ paused: true });
              
              __hfTimelineSlot.set(grainTl);
            

            const tl = gsap.timeline({ paused: true });

            // A-Roll Framing Strategy
            // 1. 0s-1.8s: Intro scale up from small (60%) to medium (80%) - Shifted right slightly to clear speaker card
            // 2. 1.8s-4.6s: Grid view / Shift Left (x: 600, scale: 70%) for 47% graphic
            // 3. 4.6s-8.8s: Shift Center-Bottom (y: 800, scale: 70%) for 62% graphic (top)
            // 4. 8.8s-14s: Shift Right (x: 1320, scale: 75%) for Editing Skills graphic (left)
            // 5. 14s-17s: Final Reveal (Center, scale: 100%)

            // Initial state
            gsap.set("#a-roll", {
              x: 1100,
              y: 540,
              xPercent: -50,
              yPercent: -50,
              width: 1920 * 0.6,
              height: 1080 * 0.6,
            });

            // 1. Intro Scale Up (0s - 1.8s)
            tl.to(
              "#a-roll",
              {
                x: 1200,
                width: 1920 * 0.8,
                height: 1080 * 0.8,
                duration: 1.8,
                ease: "power2.inOut",
              },
              0,
            );

            // 2. Moment 1: 47% Graphic Trigger (1.8s) - Shift Left
            tl.to(
              "#a-roll",
              {
                x: 600,
                y: 540,
                width: 1920 * 0.7,
                height: 1080 * 0.7,
                duration: 0.5,
                ease: "power2.inOut",
              },
              1.8,
            );

            // 3. Moment 2: 62% Graphic Trigger (4.6s) - Shift Center-Bottom
            tl.to(
              "#a-roll",
              {
                x: 960,
                y: 750,
                width: 1920 * 0.7,
                height: 1080 * 0.7,
                duration: 0.5,
                ease: "power2.inOut",
              },
              4.6,
            );

            // 4. Moment 3: Editing Skills Trigger (8.8s) - Shift Right
            tl.to(
              "#a-roll",
              {
                x: 1320,
                y: 540,
                width: 1920 * 0.75,
                height: 1080 * 0.75,
                duration: 0.5,
                ease: "power2.inOut",
              },
              8.8,
            );

            // 5. Final Reveal (14s - 17s)
            tl.to(
              "#a-roll",
              {
                x: 960,
                y: 540,
                width: 1920 * 1.0,
                height: 1080 * 1.0,
                duration: 1.0,
                ease: "power2.inOut",
              },
              14,
            );

            __hfTimelineSlot.set(tl);
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#f5f0e0">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="main-composition"
          data-composition-id="main-video"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="__VIDEO_DURATION__"
        >
          
          <div
            id="grain-overlay-comp"
            data-composition-id="grain-overlay"
            data-width="1920"
            data-height="1080"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="100"
          >
            <div class="grain-texture"></div>
            
          </div>
    
          
          <video
            id="a-roll"
            src={__hfAsset("__VIDEO_SRC__")}
            playsinline
            data-has-audio="true"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="0"
          ></video>
    
          
          <div
            id="intro-layer"
            class="comp-layer"
            data-composition-id="intro"
            data-composition-src="compositions/intro.html"
            data-start="0"
            data-duration="2.5"
            data-track-index="1"
          ></div>
    
          <div
            id="graphics-layer"
            class="comp-layer"
            data-composition-id="graphics"
            data-composition-src="compositions/graphics.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="2"
          ></div>
    
          <div
            id="captions-layer"
            data-track-kind="captions"
            class="comp-layer"
            data-composition-id="captions"
            data-composition-src="compositions/captions.html"
            data-start="0"
            data-duration="__VIDEO_DURATION__"
            data-track-index="3"
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
    background-color: #f5f0e0; /* Cream background */
    font-family: "Outfit", sans-serif;
  }

  #main-composition {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }

  /* Paper texture and Grain overlay */
  #grain-overlay-comp {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 100;
  }

  /* Grain animation */
  @keyframes grain-noise {
    0%, 100% {
      transform: translate(0, 0);
    }
  10% {
    transform: translate(-5%, -5%);
  }
  20% {
    transform: translate(-10%, 5%);
  }
  30% {
    transform: translate(5%, -10%);
  }
  40% {
    transform: translate(-5%, 15%);
  }
  50% {
    transform: translate(-10%, 5%);
  }
  60% {
    transform: translate(15%, 0);
  }
  70% {
    transform: translate(0, 10%);
  }
  80% {
    transform: translate(-15%, 0);
  }
  90% {
    transform: translate(10%, 5%);
  }
  }

  .grain-texture {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: var(--hf-asset-0);
    opacity: 0.15;
    animation: grain-noise 0.5s steps(1) infinite;
  }

  #a-roll {
    position: absolute;
    border-radius: 16px;
    object-fit: cover;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  }

  .comp-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
}
</style>
