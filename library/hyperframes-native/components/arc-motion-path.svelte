<!-- Modified Svelte adaptation of registry/components/arc-motion-path/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { MotionPathPlugin } from 'gsap/dist/MotionPathPlugin';
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
          if (window.MotionPathPlugin) gsap.registerPlugin(MotionPathPlugin);
          tl.to(
            ".hf-advanced-arc-motion-path .chip-a",
            {
              motionPath: {
                path: "#arc-motion-path-path-a",
                align: "#arc-motion-path-path-a",
                alignOrigin: [0.5, 0.5],
                autoRotate: true,
              },
              duration: 2.4,
              ease: "power1.inOut",
            },
            startTime,
          );
          tl.to(
            ".hf-advanced-arc-motion-path .chip-b",
            {
              motionPath: {
                path: "#arc-motion-path-path-b",
                align: "#arc-motion-path-path-b",
                alignOrigin: [0.5, 0.5],
                autoRotate: true,
                start: 0.1,
                end: 0.92,
              },
              duration: 2.1,
              ease: "sine.inOut",
            },
            startTime + 0.25,
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
          data-composition-id="arc-motion-path-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="hf-advanced-arc-motion-path">
            <svg viewBox="0 0 760 430" aria-hidden="true">
              <path
                id="arc-motion-path-path-a"
                class="path"
                d="M104 310 C178 110, 334 74, 442 178 S592 306, 668 120"
              />
              <path id="arc-motion-path-path-b" class="path" d="M118 142 C224 300, 410 330, 642 206" />
            </svg>
            <div class="core">Arc Motion Path</div>
            <div class="chip chip-a"><span class="dot"></span>Plan</div>
            <div class="chip chip-b"><span class="dot"></span>Render</div>
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
    background: var(--bg, #f7f7f8);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .hf-advanced-arc-motion-path {
    color: var(--fg, #111827);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .hf-advanced-arc-motion-path {
    position: relative;
    width: 760px;
    height: 430px;
    border-radius: 30px;
    overflow: hidden;
    background: radial-gradient(
      circle at 50% 20%,
      var(--bg, #f4f4f5),
      var(--bg, #f8fafc) 54%,
      var(--bg, #e4e4e7)
    );
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.18);
    transform: scale(0.84);
  }
  .hf-advanced-arc-motion-path svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .hf-advanced-arc-motion-path .path {
    fill: none;
    stroke: color-mix(in srgb, var(--fg, #111827) 18%, transparent);
    stroke-width: 3;
    stroke-dasharray: 10 12;
  }
  .hf-advanced-arc-motion-path .core {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 176px;
    height: 176px;
    margin: -88px 0 0 -88px;
    border-radius: 42px;
    background: var(--fg, #111827);
    color: var(--bg, #fff);
    display: grid;
    place-items: center;
    text-align: center;
    font-size: 15px;
    font-weight: 900;
    letter-spacing: -0.04em;
    box-shadow: 0 22px 54px rgba(15, 23, 42, 0.25);
  }
  .hf-advanced-arc-motion-path .chip {
    position: absolute;
    left: 0;
    top: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    height: 42px;
    padding: 0 16px;
    border-radius: 999px;
    background: var(--surface, #fff);
    box-shadow: 0 16px 42px rgba(15, 23, 42, 0.14);
    font-size: 13px;
    font-weight: 800;
    transform-origin: 50% 50%;
  }
  .hf-advanced-arc-motion-path .dot {
    width: 10px;
    height: 10px;
    border-radius: 999px;
    background: var(--accent, #18181b);
  }
}
</style>
