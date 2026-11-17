<!-- Modified Svelte adaptation of registry/components/grid-pixelate-wipe/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              const COLS = 16;
              const ROWS = 9;
              const overlay = document.getElementById("grid-pixelate-overlay");

              overlay.style.gridTemplateColumns = `repeat(${COLS}, 1fr)`;
              overlay.style.gridTemplateRows = `repeat(${ROWS}, 1fr)`;

              for (let i = 0; i < COLS * ROWS; i++) {
                const cell = document.createElement("div");
                cell.className = "grid-cell";
                overlay.appendChild(cell);
              }

              const tl = gsap.timeline({ paused: true });

              // Scene A visible for 2 seconds
              // Grid covers screen (transition out of A)
              tl.to(
                ".grid-cell",
                {
                  scale: 1,
                  duration: 0.6,
                  stagger: { amount: 0.6, from: "center" },
                  ease: "power2.inOut",
                },
                2.0,
              );

              // Swap scenes at midpoint
              tl.set("#scene-a", { opacity: 0 }, 3.0);
              tl.set("#scene-b", { opacity: 1 }, 3.0);

              // Grid reveals scene B
              tl.to(
                ".grid-cell",
                {
                  scale: 0,
                  duration: 0.6,
                  stagger: { amount: 0.6, from: "edges" },
                  ease: "power2.inOut",
                },
                3.0,
              );

              // Second transition: back to A using random pattern
              tl.to(
                ".grid-cell",
                {
                  scale: 1,
                  duration: 0.5,
                  stagger: { amount: 0.5, from: "random" },
                  ease: "power2.inOut",
                },
                5.5,
              );

              tl.set("#scene-b", { opacity: 0 }, 6.3);
              tl.set("#scene-a", { opacity: 1 }, 6.3);

              tl.to(
                ".grid-cell",
                {
                  scale: 0,
                  duration: 0.5,
                  stagger: { amount: 0.5, from: "random" },
                  ease: "power2.inOut",
                },
                6.3,
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
          data-composition-id="grid-pixelate-wipe-demo"
          data-width="1920"
          data-height="1080"
          data-duration="8"
        >
          
          <div id="scene-a" class="demo-scene scene-a">
            <div style="text-align: center; color: white">
              <div style="font-size: 80px; font-weight: 800">Scene A</div>
              <div style="font-size: 32px; margin-top: 20px; opacity: 0.7">
                The grid wipe dissolves this away
              </div>
            </div>
          </div>
    
          
          <div id="scene-b" class="demo-scene scene-b">
            <div style="text-align: center; color: white">
              <div style="font-size: 80px; font-weight: 800">Scene B</div>
              <div style="font-size: 32px; margin-top: 20px; opacity: 0.7">Revealed from the grid</div>
            </div>
          </div>
    
          
          <div
            id="grid-pixelate-overlay"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 999;
              display: grid;
            "
          ></div>
    
          
    
          
    
          
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


  #grid-pixelate-overlay {
    --grid-color: black;
  }

  #grid-pixelate-overlay .grid-cell {
    background: var(--grid-color);
    transform: scale(0);
    transform-origin: center center;
  }


  .demo-scene {
    position: absolute;
    width: 1920px;
    height: 1080px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "Inter", sans-serif;
  }

  .scene-a {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .scene-b {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    opacity: 0;
  }
}
</style>
