<!-- Modified Svelte adaptation of registry/blocks/organic-light-leak-overlay/organic-light-leak-overlay.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    var leak = document.getElementById("hf-light-leak");
          var host = leak && leak.closest("[data-composition-id]");
          if (!host) throw new Error("Organic Light Leak could not find its composition host");

          var compositionId = host.getAttribute("data-composition-id");
          var duration = Number(host.getAttribute("data-duration")) || 4;
          var tl = gsap.timeline({ paused: true });

          tl.to({}, { duration: duration, ease: "none" }, 0);
          tl.fromTo(
            leak,
            { opacity: 0 },
            { opacity: 0.9, duration: duration * 0.24, ease: "sine.out" },
            duration * 0.08,
          );
          tl.to(leak, { opacity: 0.46, duration: duration * 0.2, ease: "sine.inOut" }, duration * 0.42);
          tl.to(leak, { opacity: 0, duration: duration * 0.26, ease: "sine.in" }, duration * 0.68);
          tl.fromTo(
            ".hf-leak-amber",
            { xPercent: -20, scale: 0.92, rotation: -4 },
            { xPercent: 18, scale: 1.1, rotation: 2, duration: duration, ease: "sine.inOut" },
            0,
          );
          tl.fromTo(
            ".hf-leak-red",
            { xPercent: 20, yPercent: -8, scale: 1.08 },
            { xPercent: -16, yPercent: 8, scale: 0.94, duration: duration, ease: "sine.inOut" },
            0,
          );
          tl.fromTo(
            ".hf-leak-gold",
            { xPercent: -28, rotation: -6 },
            { xPercent: 24, rotation: 4, duration: duration, ease: "sine.inOut" },
            0,
          );

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="organic-light-leak-overlay"
          data-composition-id="organic-light-leak-overlay"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="hf-light-leak" aria-hidden="true">
            <div class="hf-leak-layer hf-leak-amber"></div>
            <div class="hf-leak-layer hf-leak-red"></div>
            <div class="hf-leak-layer hf-leak-gold"></div>
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

  #hf-light-leak {
    position: absolute;
    inset: -16%;
    opacity: 0;
    overflow: hidden;
    pointer-events: none;
    mix-blend-mode: screen;
  }

  #hf-light-leak .hf-leak-layer {
    position: absolute;
    inset: -20%;
    will-change: opacity, transform;
  }

  #hf-light-leak .hf-leak-amber {
    background:
      radial-gradient(ellipse 52% 110% at 10% 58%, rgb(255 241 197 / 92%), transparent 45%),
      radial-gradient(ellipse 72% 120% at 24% 54%, rgb(255 126 57 / 78%), transparent 66%);
    filter: blur(2.8vmin);
  }

  #hf-light-leak .hf-leak-red {
    background: radial-gradient(
      ellipse 58% 105% at 78% 34%,
      rgb(255 79 61 / 72%),
      rgb(255 44 92 / 28%) 48%,
      transparent 76%
    );
    filter: blur(4vmin);
  }

  #hf-light-leak .hf-leak-gold {
    background: linear-gradient(
      104deg,
      transparent 24%,
      rgb(255 144 62 / 30%) 40%,
      rgb(255 247 205 / 72%) 51%,
      rgb(255 124 48 / 22%) 62%,
      transparent 78%
    );
    filter: blur(2vmin);
  }
}
</style>
