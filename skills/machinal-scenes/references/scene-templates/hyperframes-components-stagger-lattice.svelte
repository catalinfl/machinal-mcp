<!-- Modified Svelte adaptation of registry/components/stagger-lattice/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    const tl = gsap.timeline({ paused: true });
          const startTime = 0.5;
          tl.fromTo(
            ".hf-advanced-stagger-lattice .cell",
            { "--hf-cell-y": "24px", "--hf-cell-scale": 0.72, "--hf-cell-opacity": 0 },
            {
              "--hf-cell-y": "0px",
              "--hf-cell-scale": 1,
              "--hf-cell-opacity": 1,
              duration: 0.28,
              stagger: { each: 0.018, from: "center", grid: [5, 8] },
              ease: "power2.out",
            },
            startTime,
          );
          tl.set({}, {}, 5);
          
          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="stagger-lattice-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="hf-advanced-stagger-lattice">
            <div class="grid">
              <span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span><span class="cell"></span><span class="cell"></span
              ><span class="cell"></span>
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
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f4f4f5;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-advanced-stagger-lattice {
    --hf-accent: var(--accent, rgba(17, 24, 39, 0.72));
    --hf-l1: rgba(17, 24, 39, 0.72);
    --hf-l3: rgba(17, 24, 39, 0.18);
    --hf-l4: rgba(17, 24, 39, 0.08);
    --hf-hair: rgba(17, 24, 39, 0.14);
    color: var(--hf-l1);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-advanced-stagger-lattice {
    width: 720px;
    min-height: 420px;
    border-radius: 30px;
    padding: 36px;
    background: #fff;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
    display: grid;
    place-items: center;
    /* ponytail: zoom scales the wrapper without touching GSAP transform targets (.cell) */
    zoom: 1.7;
  }
  .hf-advanced-stagger-lattice .grid {
    display: grid;
    grid-template-columns: repeat(8, 46px);
    gap: 10px;
  }
  .hf-advanced-stagger-lattice .cell {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: var(--hf-l1);
    transform: translateY(var(--hf-cell-y, 0px)) scale(var(--hf-cell-scale, 1));
    opacity: var(--hf-cell-opacity, 1);
  }
  .hf-advanced-stagger-lattice svg {
    width: 520px;
    height: 220px;
    overflow: visible;
  }
  .hf-advanced-stagger-lattice path {
    fill: none;
    stroke: var(--hf-accent);
    stroke-width: 14;
    stroke-linecap: round;
    stroke-dasharray: 900;
    stroke-dashoffset: var(--hf-dash, 0);
  }
  .hf-advanced-stagger-lattice .stack {
    position: relative;
    width: 520px;
    height: 260px;
  }
  .hf-advanced-stagger-lattice .card {
    position: absolute;
    inset: 0;
    border-radius: 26px;
    background: linear-gradient(var(--hf-l4), var(--hf-l4)), #ffffff;
    border: 1px solid var(--hf-hair);
    box-shadow: 0 20px 54px rgba(15, 23, 42, 0.14);
    transform: translateY(var(--hf-card-y, 0px)) scale(var(--hf-card-scale, 1));
    opacity: var(--hf-card-opacity, 1);
  }
}
</style>
