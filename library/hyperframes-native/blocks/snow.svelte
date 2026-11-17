<!-- Modified Svelte adaptation of registry/blocks/snow/snow.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            var field = document.getElementById("hf-snow");
            // Mounted, the runtime strips data-duration off this file's root; the host clip carries it.
            var host = field.closest("[data-composition-id]");
            var vars =
              __hfHost && __hfHost.getVariables
                ? __hfHost.getVariables()
                : {};

            // The host's data-width/data-height are authoritative over this file's own root
            // (compositionLoader.ts) — read them instead of a third hardcoded 1920x1080.
            var W = Number(host.getAttribute("data-width")) || 1920;
            var H = Number(host.getAttribute("data-height")) || 1080;
            var duration = Number(host.getAttribute("data-duration")) || 6;

            var COUNT = vars.density === "dense" ? 280 : 120;
            var fallSeconds = vars.speed === "gust" ? 2.2 : 4.5;
            var swaySeconds = vars.speed === "gust" ? 2.2 : 4;

            // Even 2D coverage with no clumping and no seed to store (Weyl low-discrepancy
            // sequence): successive multiples of an irrational constant, taken mod 1.
            var PHI = 0.6180339887498949; // (sqrt(5) - 1) / 2
            var RT2 = 0.4142135623730951; // sqrt(2) - 1

            function frac(x) {
              return x - Math.floor(x);
            }

            // Deterministic per-index hash (sin fold; no Math.random) for scalars that only
            // need decorrelation, not even coverage. registry/components/stop-motion-cadence's
            // rnd(n).
            function rnd(n) {
              var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
              return x - Math.floor(x);
            }

            var TAU = 2 * Math.PI;

            // A whole number of cycles over the mount for a given per-cycle duration; the
            // loop invariant forces this to round to an integer, so callers that need distinct
            // speeds must space their inputs, not just their multipliers (rounding a sub-1
            // product always collapses to 1 on a short mount).
            function wholeCycles(cycleSeconds) {
              return Math.max(1, Math.round(duration / cycleSeconds));
            }

            // Flakes enter above the top edge and exit below the bottom before wrapping, so the
            // loop seam never pops one into view mid-frame. It must clear the largest flake's
            // radius plus its blur (9px + 4px at 1080 tall); a correctness bound, not taste.
            var WRAP_MARGIN = 0.02;

            var fallBase = wholeCycles(fallSeconds);
            var swayBase = wholeCycles(swaySeconds);

            var flakes = [];
            var fragment = document.createDocumentFragment();
            for (var i = 0; i < COUNT; i++) {
              var laneX = frac(i * PHI + 0.07);
              // One depth draw drives size and opacity, and buckets the flake into
              // one of three fall-speed layers (far/mid/near). Layer cycle counts are offsets
              // from the shared base, not products of it, so they stay distinct on any mount.
              var depth = rnd(i);
              var sizePx = 2 + depth * depth * 16;
              // The nearest flakes sit in front of the focal plane: large, soft and half see-through.
              var bokeh = depth > 0.85;
              var opacity = bokeh ? 0.5 : 0.35 + depth * 0.55;
              var layer = depth < 1 / 3 ? 0 : depth < 2 / 3 ? 1 : 2;

              var el = document.createElement("div");
              el.className = "hf-flake";
              el.style.width = sizePx + "px";
              el.style.height = sizePx + "px";
              el.style.opacity = opacity;
              if (bokeh) el.style.filter = "blur(2px)";
              fragment.appendChild(el);

              flakes.push({
                el: el,
                laneX: laneX,
                fallCycles: fallBase + layer,
                fallPhi: frac(i * RT2 + 0.37),
                swayPx: 6 + depth * 24,
                swayCycles: swayBase + Math.round(rnd(i + 5000) * 2),
                swayPhi: TAU * rnd(i + 3000),
              });
            }
            field.appendChild(fragment);

            var state = { phase: 0 };

            function render() {
              var p = state.phase;
              for (var s = 0; s < flakes.length; s++) {
                var f = flakes[s];
                var yFrac = frac(f.fallCycles * p + f.fallPhi);
                var y = (-WRAP_MARGIN + yFrac * (1 + 2 * WRAP_MARGIN)) * H;
                var x = f.laneX * W + f.swayPx * Math.sin(TAU * f.swayCycles * p + f.swayPhi);
                f.el.style.transform =
                  "translate(" + Math.round(x) + "px, " + Math.round(y) + "px) translate(-50%, -50%)";
              }
            }

            var tl = gsap.timeline({ paused: true });
            tl.to(state, { phase: 1, duration: duration, ease: "none", onUpdate: render }, 0);
            render();

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="snow"
          data-composition-id="snow"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
          data-composition-variables='[
            &#123; "id": "density", "type": "enum", "role": "style", "label": "Density", "description": "Flake count across the frame.", "default": "sparse", "options": [&#123; "value": "sparse", "label": "Sparse" &#125;, &#123; "value": "dense", "label": "Dense" &#125;] &#125;,
            &#123; "id": "speed", "type": "enum", "role": "style", "label": "Fall speed", "description": "How fast flakes fall and sway.", "default": "calm", "options": [&#123; "value": "calm", "label": "Calm" &#125;, &#123; "value": "gust", "label": "Gust" &#125;] &#125;
          ]'
        >
          <div id="hf-snow" aria-hidden="true" data-layout-allow-overflow=""></div>
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

  #hf-snow {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    /* Center clearance: a subject placed mid-frame stays readable by default. */
    -webkit-mask-image: radial-gradient(
      circle 230px at 50% 50%,
      transparent 0 230px,
      #000 653px
    );
    mask-image: radial-gradient(circle 230px at 50% 50%, transparent 0 230px, #000 653px);
  }

  #hf-snow .hf-flake {
    position: absolute;
    top: 0;
    left: 0;
    border-radius: 50%;
    background: #fff;
    will-change: transform;
  }
}
</style>
