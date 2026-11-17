<!-- Modified Svelte adaptation of registry/components/shimmer-sweep/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              // Inject shimmer masks
              document.querySelectorAll(".shimmer-sweep-target").forEach((el) => {
                if (!el.querySelector(".shimmer-mask")) {
                  const mask = document.createElement("div");
                  mask.className = "shimmer-mask";
                  el.appendChild(mask);
                }
              });

              const tl = gsap.timeline({ paused: true });

              // Fade in elements
              tl.to(".demo-heading", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.3);
              tl.to(".demo-subheading", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.6);
              tl.to(".demo-pill", { opacity: 1, duration: 0.6, ease: "power2.out" }, 0.9);

              // First shimmer sweep across all targets
              tl.fromTo(
                ".shimmer-sweep-target",
                { "--shimmer-pos": "-20%" },
                {
                  "--shimmer-pos": "120%",
                  duration: 1.2,
                  ease: "power2.inOut",
                  stagger: 0.15,
                },
                1.5,
              );

              // Second sweep
              tl.fromTo(
                ".shimmer-sweep-target",
                { "--shimmer-pos": "-20%" },
                {
                  "--shimmer-pos": "120%",
                  duration: 1.0,
                  ease: "power2.inOut",
                  stagger: 0.1,
                },
                3.5,
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
          data-composition-id="shimmer-sweep-demo"
          data-width="1920"
          data-height="1080"
          data-duration="6"
        >
          <div class="demo-canvas">
            
            <div class="shimmer-sweep-target" style="--shimmer-color: rgba(255, 255, 255, 0.5)">
              <div
                class="demo-heading"
                style="font-size: 120px; font-weight: 800; color: #ffffff; opacity: 0"
              >
                AI-Powered
              </div>
            </div>
    
            
            <div class="shimmer-sweep-target" style="--shimmer-color: rgba(100, 200, 255, 0.4)">
              <div
                class="demo-subheading"
                style="font-size: 48px; font-weight: 400; color: #888888; opacity: 0"
              >
                Video generation, reimagined
              </div>
            </div>
    
            
            <div
              class="shimmer-sweep-target"
              style="--shimmer-color: rgba(255, 255, 255, 0.3); --shimmer-width: 30%"
            >
              <div
                class="demo-pill"
                style="
                  background: linear-gradient(135deg, #1a1a2e, #2a2a4e);
                  border: 1px solid #333;
                  border-radius: 100px;
                  padding: 16px 40px;
                  font-size: 20px;
                  color: #aaa;
                  opacity: 0;
                "
              >
                Try it free →
              </div>
            </div>
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


  .demo-canvas {
    width: 1920px;
    height: 1080px;
    background: #0a0a0f;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 60px;
    font-family: "Inter", sans-serif;
  }

  .shimmer-sweep-target {
    position: relative;
    display: inline-block;
  }

  .shimmer-sweep-target .shimmer-mask {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    background: linear-gradient(
      var(--shimmer-angle, 120deg),
      transparent 0%,
      transparent calc(var(--shimmer-pos, -20%) - var(--shimmer-width, 20%) / 2),
      var(--shimmer-color, rgba(255, 255, 255, 0.6)) var(--shimmer-pos, -20%),
      transparent calc(var(--shimmer-pos, -20%) + var(--shimmer-width, 20%) / 2),
      transparent 100%
    );
    mix-blend-mode: overlay;
  }
}
</style>
