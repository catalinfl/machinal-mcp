<!-- Modified Svelte adaptation of registry/components/logo-wall/logo-wall.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "logo-wall";
                var stage = root.querySelector(".lw-stage");
                var grid = root.querySelector(".lw-grid");

                // EDIT ZONE: the runtime variable table is read once. These
                // clamped values own DOM count, grid tracks, and stagger timing.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var rawRows = Number(vars.rows);
                var rows = Number.isFinite(rawRows) ? Math.round(rawRows) : 3;
                rows = Math.max(2, Math.min(4, rows));

                var rawCols = Number(vars.cols);
                var cols = Number.isFinite(rawCols) ? Math.round(rawCols) : 5;
                cols = Math.max(3, Math.min(6, cols));

                var rawStagger = Number(vars.stagger);
                var staggerMs = Number.isFinite(rawStagger) ? rawStagger : 45;
                staggerMs = Math.max(20, Math.min(75, staggerMs));

                var lettermarks = [
                  "AX",
                  "BL",
                  "CY",
                  "DQ",
                  "EV",
                  "FK",
                  "GN",
                  "HT",
                  "IP",
                  "JR",
                  "KS",
                  "LU",
                  "MW",
                  "NX",
                  "OZ",
                  "PA",
                  "QC",
                  "RF",
                  "SG",
                  "TJ",
                  "VK",
                  "WL",
                  "XM",
                  "YN",
                ];
                var cellCount = rows * cols;
                var fragment = document.createDocumentFragment();

                for (var index = 0; index < cellCount; index += 1) {
                  var cell = document.createElement("div");
                  var mark = document.createElement("span");
                  cell.className = "lw-cell";
                  cell.setAttribute("aria-hidden", "true");
                  mark.className = "lw-mark";
                  mark.textContent = lettermarks[index];
                  cell.appendChild(mark);
                  fragment.appendChild(cell);
                }

                grid.replaceChildren(fragment);
                grid.style.setProperty("--lw-rows", String(rows));
                grid.style.setProperty("--lw-cols", String(cols));

                var cells = root.querySelectorAll(".lw-cell");

                // RETIME RANGE: the 2.50s IN fits the largest public wall of 24
                // cells at the maximum 75ms stagger plus the 0.55s cell settle.
                // HOLD alone absorbs longer host durations.
                var IN_BASE = 2.5;
                var OUT_BASE = 0.5;
                var ASSEMBLE_START_BASE = 0.15;
                var CELL_DURATION_BASE = 0.55;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var ASSEMBLE_START = ASSEMBLE_START_BASE * scale;
                var CELL_DURATION = CELL_DURATION_BASE * scale;
                var STAGGER_SECONDS = (staggerMs / 1000) * scale;

                var timeline = gsap.timeline({ paused: true });

                // IN: deterministic DOM-order assembly. power2.out is the GSAP
                // owner of the shared --ease-standard entrance token.
                timeline.fromTo(
                  cells,
                  { opacity: 0, scale: 0.94 },
                  {
                    opacity: 1,
                    scale: 1,
                    duration: CELL_DURATION,
                    ease: "power2.out",
                    stagger: { each: STAGGER_SECONDS, from: "start" },
                  },
                  ASSEMBLE_START,
                );

                // HOLD: deliberately still. OUT: the whole proof wall leaves once
                // with the production exit curve, never during the elastic hold.
                timeline.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                timeline.seek(0);

                
                __hfTimelineSlot.set(timeline);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "rows", "type": "number", "role": "layout", "label": "Rows", "description": "Number of logo rows in the wall.", "default": 3, "min": 2, "max": 4, "step": 1 &#125;,
        &#123; "id": "cols", "type": "number", "role": "layout", "label": "Columns", "description": "Number of logo columns in the wall.", "default": 5, "min": 3, "max": 6, "step": 1 &#125;,
        &#123; "id": "stagger", "type": "number", "role": "motion", "label": "Stagger", "description": "Delay between consecutive logo cell entrances.", "default": 45, "min": 20, "max": 75, "step": 1, "unit": "ms" &#125;
      ]' data-composition-id="logo-wall" data-start="0" data-duration="5" data-fps="30">
            
    
            <div
              id="logo-wall-clip"
              class="lw-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <section class="lw-stage" aria-label="Trusted by logo wall">
                <div class="lw-heading">Trusted by teams</div>
                <div class="lw-grid"></div>
              </section>
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

  /* Root fills the host box and consumes only the shared theme tokens.
  Every internal dimension is relative to this size container. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f5f6f8);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .lw-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b0c10);
  }

  .lw-stage {
    width: 86cqw;
    height: 82cqh;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    gap: var(--space-3, 3cqh);
    padding: var(--space-3, 3cqh);
  }

  .lw-heading {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 1.6cqh);
    color: var(--muted, #8b8f9a);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(2.6cqw, 4.4cqh);
    font-weight: 650;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
  }

  .lw-heading::before, .lw-heading::after {
    content: "";
    width: 8cqw;
    height: 0.14cqw;
    background: var(--border, #262931);
  }

  /* EDIT ZONE: grid geometry. rows and cols are the sole owners of
  track count. Spacing and surfaces remain theme-token driven. */
  .lw-grid {
    min-width: 0;
    min-height: 0;
    display: grid;
    grid-template-columns: repeat(var(--lw-cols), minmax(0, 1fr));
    grid-template-rows: repeat(var(--lw-rows), minmax(0, 1fr));
    gap: var(--space-2, 1.6cqh);
  }

  .lw-cell {
    min-width: 0;
    min-height: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 0.14cqw solid var(--border, #262931);
    border-radius: var(--radius, 2cqw);
    background: var(--surface, #16181d);
    box-shadow: 0 1.2cqh 3cqh color-mix(in srgb, var(--bg, #0b0c10) 58%, transparent);
  }

  .lw-mark {
    display: grid;
    place-items: center;
    width: min(5.5cqw, 9.5cqh);
    aspect-ratio: 1;
    border-radius: calc(var(--radius, 2cqw) * 0.72);
    background: color-mix(in srgb, var(--fg, #f5f6f8) 72%, transparent);
    color: var(--bg, #0b0c10);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(2.2cqw, 4cqh);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 1;
  }
}
</style>
