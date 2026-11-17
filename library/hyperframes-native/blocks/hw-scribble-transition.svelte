<!-- Modified Svelte adaptation of registry/blocks/hw-scribble-transition/hw-scribble-transition.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            /* ---- published parameters ----
               Overlay-transition (the mk-clone-wall model): fat scribble strokes
               sweep across and cover the frame, a solid backstop guarantees full
               coverage at the midpoint (the host hard-cuts beneath, ~0.9-1.4s
               local), then everything clears. Place spanning the host's cut. */
            var CONFIG = {
              color: null, // css color; null = --hw-accent (warm marker)
              bands: 7, // horizontal scribble bands
              strokeScale: 1.0,
              seed: 17,
            };

            var W = 1920,
              H = 1080,
              DUR = 2.2;

            window.hwHash = function (n, seed) {
              var x = Math.sin(n * 127.1 + (seed || 1) * 311.7) * 43758.5453;
              return (x - Math.floor(x)) * 2 - 1;
            };

            var root = document.getElementById("hw-st-root");
            if (CONFIG.color) root.style.setProperty("--hw-accent", CONFIG.color);
            var NS = "http://www.w3.org/2000/svg";
            var svg = document.getElementById("hw-st-svg");

            /* fat zigzag bands, each covering a horizontal slice edge-to-edge */
            var bandH = H / CONFIG.bands;
            var paths = [];
            for (var b = 0; b < CONFIG.bands; b++) {
              var y0 = b * bandH + bandH / 2;
              var d = "M -80 " + (y0 + window.hwHash(b * 17, CONFIG.seed) * 20).toFixed(1);
              var zigs = 7;
              for (var i = 1; i <= zigs; i++) {
                var x = (W + 160) * (i / zigs) - 80;
                var y =
                  y0 + (i % 2 ? -1 : 1) * bandH * 0.32 + window.hwHash(b * 17 + i, CONFIG.seed) * 16;
                d += " L " + x.toFixed(1) + " " + y.toFixed(1);
              }
              var p = document.createElementNS(NS, "path");
              p.setAttribute("d", d);
              p.setAttribute("stroke-width", Math.ceil(bandH * 0.85 * CONFIG.strokeScale));
              p.setAttribute("id", "hw-st-band-" + b);
              svg.appendChild(p);
              paths.push(p);
            }

            var tl = gsap.timeline({ paused: true });

            /* 0-0.85: bands scribble on (staggered, alternating direction) */
            paths.forEach(function (p, i) {
              var len = p.getTotalLength();
              gsap.set(p, { strokeDasharray: len, strokeDashoffset: i % 2 ? -len : len });
              tl.to(p, { strokeDashoffset: 0, duration: 0.55, ease: "power2.in" }, 0.04 * i);
            });
            /* 0.8: solid backstop snaps in beneath the finished scribble — full
               coverage guaranteed 0.85-1.35 (the host's cut window) */
            tl.to("#hw-st-solid", { opacity: 1, duration: 0.12, ease: "none" }, 0.8);

            /* 1.35-1.95: clear — bands scribble off the other way, backstop lifts */
            tl.to("#hw-st-solid", { opacity: 0, duration: 0.15, ease: "none" }, 1.42);
            paths.forEach(function (p, i) {
              var len = p.getTotalLength();
              tl.to(
                p,
                { strokeDashoffset: i % 2 ? len : -len, duration: 0.5, ease: "power2.out" },
                1.42 + 0.035 * i,
              );
            });

            /* hard kill the moment the last band clears (learning: kill roots
               when the final fade completes, not at DUR) */
            tl.set(root, { visibility: "hidden" }, 2.17);

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="hw-st-root"
          data-composition-id="hw-scribble-transition"
          data-start="0"
          data-duration="2.2"
          data-width="1920"
          data-height="1080"
        >
          <svg id="hw-st-svg" viewBox="0 0 1920 1080" data-layout-allow-overflow></svg>
          <div id="hw-st-solid"></div>
          <div
            id="hw-st-drv"
            class="clip"
            data-start="0"
            data-duration="2.2"
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
  #hw-st-root {
    /* Warm marker accent, consistent with the rest of the hw family.
    Override per use via CONFIG.color. */
    --hw-accent: #ffb020;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }
  #hw-st-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  #hw-st-svg path {
    fill: none;
    stroke: var(--hw-accent);
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  /* solid backstop that guarantees full coverage at the midpoint */
  #hw-st-solid {
    position: absolute;
    inset: 0;
    background: var(--hw-accent);
    opacity: 0;
  }
}
</style>
