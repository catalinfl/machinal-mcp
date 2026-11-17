<!-- Modified Svelte adaptation of registry/blocks/editorial-flash-overlay/editorial-flash-overlay.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    var flash = document.getElementById("ef-flash");
          var host = flash && flash.closest("[data-composition-id]");
          if (!host) throw new Error("Editorial Flash could not find its composition host");

          var compositionId = host.getAttribute("data-composition-id");
          var duration = Number(host.getAttribute("data-duration")) || 4;
          var hit = Math.max(0.12, duration * 0.58);
          var tl = gsap.timeline({ paused: true });

          tl.to({}, { duration: duration, ease: "none" }, 0);
          tl.to("#ef-wash", { opacity: 0.92, duration: 0.04, ease: "power4.in" }, hit);
          tl.fromTo(
            "#ef-core",
            { opacity: 0, scale: 0.86, rotation: -5 },
            { opacity: 1, scale: 1, rotation: -5, duration: 0.05, ease: "power4.in" },
            hit - 0.01,
          );
          tl.fromTo(
            "#ef-sweep",
            { opacity: 0, xPercent: -12, rotation: -2 },
            { opacity: 0.9, xPercent: 8, rotation: -2, duration: 0.04, ease: "power4.in" },
            hit,
          );
          tl.to("#ef-wash", { opacity: 0, duration: 0.18, ease: "power3.out" }, hit + 0.04);
          tl.to(
            "#ef-core",
            { opacity: 0, scale: 1.18, rotation: -5, duration: 0.34, ease: "power2.out" },
            hit + 0.04,
          );
          tl.to(
            "#ef-sweep",
            { opacity: 0, xPercent: 28, rotation: -2, duration: 0.3, ease: "power2.out" },
            hit + 0.04,
          );

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="editorial-flash-overlay"
          data-composition-id="editorial-flash-overlay"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="ef-flash" aria-hidden="true">
            <div id="ef-wash" class="ef-layer"></div>
            <div id="ef-core" class="ef-layer" data-layout-allow-overflow></div>
            <div id="ef-sweep" class="ef-layer" data-layout-allow-overflow></div>
          </div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  .hf-port {
    width: 1920px;
    height: 1080px;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }

  #ef-flash {
    --hf-editorial-flash-wash: 255 253 250;
    --hf-editorial-flash-warm: 255 174 105;
    --hf-editorial-flash-cool: 183 218 255;
    position: absolute;
    inset: -12%;
    overflow: hidden;
    pointer-events: none;
  }

  #ef-flash .ef-layer {
    position: absolute;
    inset: 0;
    opacity: 0;
    will-change: opacity, transform;
  }

  #ef-wash {
    background: rgb(var(--hf-editorial-flash-wash));
  }

  #ef-core {
    inset: -18%;
    background: radial-gradient(
      ellipse 68% 92% at 37% 47%,
      rgb(255 255 255) 0%,
      rgb(255 255 255 / 98%) 20%,
      rgb(var(--hf-editorial-flash-wash) / 86%) 45%,
      rgb(var(--hf-editorial-flash-warm) / 32%) 67%,
      transparent 86%
    );
    mix-blend-mode: screen;
    transform-origin: 38% 48%;
  }

  #ef-sweep {
    inset: -28%;
    background: linear-gradient(
      108deg,
      transparent 21%,
      rgb(var(--hf-editorial-flash-warm) / 10%) 38%,
      rgb(var(--hf-editorial-flash-wash) / 90%) 49%,
      rgb(255 255 255 / 98%) 53%,
      rgb(var(--hf-editorial-flash-cool) / 24%) 62%,
      transparent 79%
    );
    mix-blend-mode: screen;
  }
}
</style>
