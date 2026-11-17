<!-- Modified Svelte adaptation of registry/components/gloss-sweep/gloss-sweep.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var card = root.querySelector(".gs-card");
                var label = root.querySelector(".gs-label");
                var gloss = root.querySelector(".gs-gloss");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var accents = {
                  green: {
                    surface: "#123b2c",
                    surfaceBright: "#1a513c",
                    edge: "#39d98a",
                    label: "#ecfff5",
                  },
                  blue: {
                    surface: "#123554",
                    surfaceBright: "#19486f",
                    edge: "#4db5ff",
                    label: "#eef8ff",
                  },
                  violet: {
                    surface: "#31205b",
                    surfaceBright: "#463078",
                    edge: "#a98cff",
                    label: "#f7f2ff",
                  },
                };
                var accent = accents[vars.accent] ? vars.accent : "green";
                var palette = accents[accent];
                var text = vars.text == null ? "Pro" : String(vars.text);
                var angleValue = Number(vars.sweep_angle);
                var sweepAngle = Number.isFinite(angleValue)
                  ? Math.max(-60, Math.min(60, angleValue))
                  : 25;

                label.textContent = text;
                card.style.setProperty("--gs-surface", palette.surface);
                card.style.setProperty("--gs-surface-bright", palette.surfaceBright);
                card.style.setProperty("--gs-edge", palette.edge);
                card.style.setProperty("--gs-label", palette.label);
                gloss.style.setProperty("--gs-angle", sweepAngle + "deg");

                var IN_BASE = 1.35;
                var LAND_BASE = 0.5;
                var SWEEP_AT_BASE = 0.65;
                var SWEEP_BASE = 0.7;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2.5"));
                var scale = duration < IN_BASE ? duration / IN_BASE : 1;
                var LAND = LAND_BASE * scale;
                var SWEEP_AT = SWEEP_AT_BASE * scale;
                var SWEEP = SWEEP_BASE * scale;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  card,
                  { y: "-5cqh", scale: 1.06 },
                  { y: "0cqh", scale: 1, duration: LAND, ease: "expo.out" },
                  0,
                );
                tl.set(gloss, { opacity: 1, "--gs-sweep": -30 }, SWEEP_AT);
                tl.to(gloss, { "--gs-sweep": 130, duration: SWEEP, ease: "power2.out" }, SWEEP_AT);
                tl.set(gloss, { opacity: 0 }, SWEEP_AT + SWEEP);
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Label", "description": "Text displayed on the card.", "default": "Pro" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color treatment for the card.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "sweep_angle", "type": "number", "role": "style", "label": "Sweep angle", "description": "Angle of the specular gloss in degrees.", "default": 25, "min": -60, "max": 60, "step": 1, "unit": "deg" &#125;
      ]' data-composition-duration="2.5" data-composition-id="gloss-sweep" data-duration="2.5" data-fps="30">
            
    
            <div
              id="gloss-sweep-clip"
              class="gs-clip clip"
              data-start="0"
              data-duration="2.5"
              data-track-index="0"
            >
              <div class="gs-card">
                <span class="gs-label"></span>
                <span class="gs-gloss" aria-hidden="true"></span>
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
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .gs-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .gs-card {
    position: relative;
    display: grid;
    min-width: 48cqw;
    max-width: 78cqw;
    min-height: 34cqh;
    padding: 7cqh 9cqw;
    place-items: center;
    overflow: hidden;
    border: 0.22cqmin solid var(--gs-edge);
    border-radius: 5cqmin;
    background: linear-gradient(145deg, var(--gs-surface-bright), var(--gs-surface));
    box-shadow:
      0 3cqh 8cqh color-mix(in srgb, var(--bg, #05070d) 62%, transparent),
      inset 0 0 0 0.12cqmin color-mix(in srgb, white 12%, transparent);
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .gs-label {
    position: relative;
    z-index: 1;
    max-width: 62cqw;
    overflow: hidden;
    color: var(--gs-label);
    font-size: clamp(8cqmin, 15cqmin, 18cqmin);
    font-weight: 780;
    line-height: 1;
    letter-spacing: -0.04em;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .gs-gloss {
    --gs-sweep: -30;
    --gs-angle: 25deg;
    position: absolute;
    inset: 0;
    z-index: 2;
    opacity: 0;
    background: linear-gradient(
      var(--gs-angle),
      transparent calc(var(--gs-sweep) * 1% - 22%),
      rgba(255, 255, 255, 0.06) calc(var(--gs-sweep) * 1% - 9%),
      rgba(255, 255, 255, 0.72) calc(var(--gs-sweep) * 1%),
      rgba(255, 255, 255, 0.08) calc(var(--gs-sweep) * 1% + 9%),
      transparent calc(var(--gs-sweep) * 1% + 22%)
    );
    pointer-events: none;
  }
}
</style>
