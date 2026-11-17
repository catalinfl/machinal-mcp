<!-- Modified Svelte adaptation of registry/components/svg-line-draw-loader/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            ".hf-advanced-svg-line-draw-loader path",
            { "--hf-dash": 900 },
            { "--hf-dash": 0, duration: 1.35, ease: "power3.inOut" },
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
          data-composition-id="svg-line-draw-loader-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="hf-advanced-svg-line-draw-loader">
            <svg viewBox="0 0 520 220">
              <path d="M24 160 C90 28, 188 40, 228 128 S356 234, 494 68" />
            </svg>
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
    background: var(--bg, #f4f4f5);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .hf-advanced-svg-line-draw-loader {
    color: var(--fg, #18181b);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .hf-advanced-svg-line-draw-loader {
    width: 720px;
    min-height: 420px;
    border-radius: 16px;
    padding: 48px;
    background: var(--surface, #ffffff);
    box-shadow:
      0 24px 70px rgba(0, 0, 0, 0.1),
      0 1px 0 var(--border, #e4e4e7) inset;
    border: 1px solid var(--border, #e4e4e7);
    display: grid;
    place-items: center;
    /* ponytail: scale wrapper — GSAP only targets path, not this element */
    transform: scale(1.7);
  }
  .hf-advanced-svg-line-draw-loader .grid {
    display: grid;
    grid-template-columns: repeat(8, 46px);
    gap: 10px;
  }
  .hf-advanced-svg-line-draw-loader .cell {
    width: 46px;
    height: 46px;
    border-radius: 14px;
    background: color-mix(in srgb, var(--fg, #111827) 45%, transparent);
    transform: translateY(var(--hf-cell-y, 0px)) scale(var(--hf-cell-scale, 1));
    opacity: var(--hf-cell-opacity, 1);
  }
  .hf-advanced-svg-line-draw-loader svg {
    width: 520px;
    height: 220px;
    overflow: visible;
  }
  .hf-advanced-svg-line-draw-loader path {
    fill: none;
    stroke: var(--accent, #18181b);
    stroke-width: 12;
    stroke-linecap: round;
    stroke-dasharray: 900;
    stroke-dashoffset: var(--hf-dash, 0);
  }
  .hf-advanced-svg-line-draw-loader .stack {
    position: relative;
    width: 520px;
    height: 260px;
  }
  .hf-advanced-svg-line-draw-loader .card {
    position: absolute;
    inset: 0;
    border-radius: 26px;
    background: linear-gradient(135deg, var(--surface, #fafafa), var(--surface, #e4e4e7));
    border: 1px solid var(--border, rgba(15, 23, 42, 0.08));
    box-shadow: 0 20px 54px rgba(15, 23, 42, 0.14);
    transform: translateY(var(--hf-card-y, 0px)) scale(var(--hf-card-scale, 1));
    opacity: var(--hf-card-opacity, 1);
  }
}
</style>
