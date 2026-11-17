<!-- Modified Svelte adaptation of registry/components/outline-draw/outline-draw.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                "use strict";

                var root = document.getElementById("root");
                var outline = root.querySelector(".od-outline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // INVARIANT: invalid values return to declared defaults. Valid
                // zero values survive because each scalar is checked explicitly.
                var progressValue = Number(vars.progress);
                var thicknessValue = Number(vars.thickness);
                var radiusValue = Number(vars.radius);
                var progress = Number.isFinite(progressValue)
                  ? Math.max(0, Math.min(100, progressValue))
                  : 100;
                var thickness = Number.isFinite(thicknessValue)
                  ? Math.max(1, Math.min(20, thicknessValue))
                  : 6;
                var radius = Number.isFinite(radiusValue) ? Math.max(0, Math.min(80, radiusValue)) : 24;

                outline.style.setProperty("--od-thickness", String(thickness));
                outline.style.setProperty("--od-radius", String(radius));

                // RETIME RANGE: only these fixed envelope lengths may be tuned.
                // HOLD is the sole elastic phase. Never use timeScale.
                var IN_BASE = 0.8;
                var OUT_BASE = 0.4;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var envelope = IN_BASE + OUT_BASE;
                var scale = duration < envelope ? duration / envelope : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;

                gsap.set(outline, { "--od-progress": 0, opacity: 1 });

                var tl = gsap.timeline({ paused: true });
                // --ease-standard maps to the production GSAP name power2.out.
                // The registered scalar is tweened directly, with no proxy clock.
                tl.to(outline, { "--od-progress": progress, duration: IN, ease: "power2.out" }, 0);
                tl.to(outline, { opacity: 0, duration: OUT, ease: "power2.out" }, OUT_START);
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "progress", "type": "number", "role": "timing", "label": "Draw progress", "description": "Final percentage of the outline that is drawn.", "default": 100, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "thickness", "type": "number", "role": "layout", "label": "Stroke thickness", "description": "Outline stroke in tenths of the host width.", "default": 6, "min": 1, "max": 20, "step": 1, "unit": "0.1cqw" &#125;,
        &#123; "id": "radius", "type": "number", "role": "layout", "label": "Corner radius", "description": "Corner radius in tenths of the host smaller dimension.", "default": 24, "min": 0, "max": 80, "step": 1, "unit": "0.1cqmin" &#125;
      ]' data-composition-id="outline-draw" data-duration="4" data-fps="30">
            
    
            <div
              id="outline-draw-clip"
              class="od-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="od-outline" data-layout-ignore aria-hidden="true"></div>
            </div>
    
            
            
          </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  @property --od-progress {
    syntax: "<number>";
    inherits: false;
    initial-value: 0;
  }

  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    pointer-events: none;
  }

  .od-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  /* EDIT ZONE: --space-8 controls the safe inset. The public
  thickness and radius variables own the remaining geometry. */
  .od-outline {
    --od-progress: 0;
    --od-thickness: 6;
    --od-radius: 24;
    --od-seam-overlap: 0.5deg;
    position: absolute;
    inset: var(--space-8, 8cqmin);
    border: calc(var(--od-thickness) * 0.1cqw) solid transparent;
    border-radius: calc(var(--od-radius) * 0.1cqmin);
    background: conic-gradient(
      from -90deg,
      var(--accent, #38bdf8) 0deg calc(var(--od-progress) * 3.6deg),
      transparent calc(var(--od-progress) * 3.6deg + var(--od-seam-overlap)) 360deg
    );
    background-clip: border-box;
    background-origin: border-box;
    mask:
      linear-gradient(var(--fg, #f8fafc) 0 0) padding-box,
      linear-gradient(var(--fg, #f8fafc) 0 0) border-box;
    mask-composite: exclude;
    will-change: opacity;
  }

  /* INVARIANT: the 0.5deg feather overlaps the coincident conic
  edges at closure so 0deg and 360deg never expose a hard seam. */
}
</style>
