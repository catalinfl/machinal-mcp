<!-- Modified Svelte adaptation of registry/components/grain-overlay/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { design = {} } = $props();
  const __hfScene = useScene();
  let root = $state();
  let timeline = $state.raw();

  // Host shim: the upstream page reads its editable variables from the
  // HyperFrames host. In the port they come from the approved `design` prop.
  const __hfHost = { getVariables: () => (design || {}), variables: design || {} };

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
    (function () {
              const tl = gsap.timeline({ paused: true });

              tl.to(
                ".demo-title",
                {
                  opacity: 1,
                  y: -10,
                  duration: 1,
                  ease: "power3.out",
                },
                0.5,
              );

              tl.to(
                ".demo-subtitle",
                {
                  opacity: 1,
                  y: -5,
                  duration: 0.8,
                  ease: "power3.out",
                },
                1.0,
              );

              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="grain-overlay-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          
          <div class="demo-bg">
            <div style="text-align: center; z-index: 1">
              <div
                class="demo-title"
                style="font-size: 80px; font-weight: 700; color: #2c1e16; opacity: 0"
              >
                Grain Overlay
              </div>
              <div
                class="demo-subtitle"
                style="font-size: 32px; color: #5a4a3a; margin-top: 20px; opacity: 0"
              >
                Adds warmth and analog character
              </div>
            </div>
          </div>
    
          
          <div
            id="grain-overlay"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 100;
            "
          >
            <div class="grain-texture"></div>
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
  }


  .demo-bg {
    width: 1920px;
    height: 1080px;
    background: linear-gradient(135deg, #f5f0e0 0%, #e8d8b8 50%, #d4c4a0 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Inter", sans-serif;
    position: relative;
  }

  @keyframes hf-grain-noise {
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

  #grain-overlay .grain-texture {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    opacity: 0.15;
    animation: hf-grain-noise 0.5s steps(1) infinite;
  }
}
</style>
