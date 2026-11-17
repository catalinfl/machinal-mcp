<!-- Modified Svelte adaptation of registry/components/mk-emphasis-type/mk-emphasis-type.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // ---- copy these helpers into the host script, then:
            //   mkEmphasisIn(tl, "#mk-my-word", 1.0, { drift: -120, hold: 6 });
            //   mkEmphasisOut(tl, "#mk-my-word", 7.5);
            window.mkEmphasisIn = function (tl, target, at, opts) {
              opts = opts || {};
              var drift = opts.drift === undefined ? -100 : opts.drift;
              var hold = opts.hold === undefined ? 5 : opts.hold;
              gsap.set(target, { opacity: 0, x: 40 });
              tl.to(target, { opacity: 1, duration: 1.0, ease: "power2.out" }, at);
              tl.to(target, { x: 40 + drift, duration: hold, ease: "sine.inOut" }, at);
            };
            window.mkEmphasisOut = function (tl, target, at) {
              tl.to(target, { opacity: 0, duration: 0.5, ease: "power2.in" }, at);
            };

            // Self-preview timeline (not part of the snippet you copy).
            var tl = gsap.timeline({ paused: true });
            window.mkEmphasisIn(tl, "#mk-emph-demo", 0.3, { drift: -110, hold: 3.2 });
            window.mkEmphasisOut(tl, "#mk-emph-demo", 3.4);
            tl.set("#mk-emph-root", { visibility: "hidden" }, 3.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="mk-emph-root"
          data-composition-id="mk-emphasis-type"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div
            class="mk-emphasis"
            id="mk-emph-demo"
            aria-hidden="true"
            data-layout-allow-overflow
            style="top: 400px; left: -40px"
          >
            Emphasis
          </div>
          <div
            id="mk-emph-drv"
            class="clip"
            data-start="0"
            data-duration="4"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  /* ---- mk-emphasis-type ------------------------------------------------
  Oversized low-contrast background word sliding slowly behind the
  subject (the promo's "EMPHASIS" texture type). Decorative only —
  keep it behind real content and mark it aria-hidden. */
  .mk-emphasis {
    --mk-font: "Inter", -apple-system, sans-serif;
    --mk-emph-color: rgba(29, 29, 31, 0.07); /* dark scheme: rgba(245,245,247,0.08) */

    position: absolute;
    font-family: var(--mk-font);
    font-weight: 600;
    font-size: 260px;
    letter-spacing: -0.02em;
    line-height: 1;
    white-space: nowrap;
    text-transform: uppercase;
    color: var(--mk-emph-color);
    pointer-events: none;
  }
}
</style>
