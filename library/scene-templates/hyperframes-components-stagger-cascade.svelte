<!-- Modified Svelte adaptation of registry/components/stagger-cascade/stagger-cascade.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "stagger-cascade";
                var grid = root.querySelector(".sc-grid");

                // EDIT ZONE: declarations above and clamped reads below are the
                // single source of truth for the primitive's three public knobs.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var rawItemCount = Number(vars.itemCount);
                var itemCount = Number.isFinite(rawItemCount) ? Math.round(rawItemCount) : 6;
                itemCount = Math.max(3, Math.min(12, itemCount));

                var rawStagger = Number(vars.stagger);
                var staggerMs = Number.isFinite(rawStagger) ? rawStagger : 60;
                staggerMs = Math.max(20, Math.min(150, staggerMs));

                // INVARIANT: only these four mappings can reach GSAP. Each option
                // has a distinct axis or sign at preview size.
                var offsets = {
                  up: { x: "0cqw", y: "12cqh" },
                  down: { x: "0cqw", y: "-12cqh" },
                  left: { x: "8cqw", y: "0cqh" },
                  right: { x: "-8cqw", y: "0cqh" },
                };
                var offset = Object.prototype.hasOwnProperty.call(offsets, vars.direction)
                  ? offsets[vars.direction]
                  : offsets.up;

                // itemCount owns both DOM count and the responsive grid shape.
                var fragment = document.createDocumentFragment();
                for (var index = 0; index < itemCount; index += 1) {
                  var tile = document.createElement("div");
                  var number = document.createElement("span");
                  tile.className = "sc-tile";
                  tile.setAttribute("aria-hidden", "true");
                  number.className = "sc-tile-index";
                  number.textContent = String(index + 1).padStart(2, "0");
                  tile.appendChild(number);
                  fragment.appendChild(tile);
                }
                grid.replaceChildren(fragment);
                grid.style.setProperty(
                  "--sc-columns",
                  String(Math.min(4, Math.ceil(Math.sqrt(itemCount)))),
                );

                var tiles = root.querySelectorAll(".sc-tile");

                // RETIME RANGE: change these four base values together. IN_BASE is
                // sized so 12 items at 150ms plus the entrance tween finish exactly
                // at its boundary. HOLD alone absorbs longer host durations.
                var IN_BASE = 2.4;
                var OUT_BASE = 0.4;
                var CASCADE_START_BASE = 0.1;
                var ENTRY_DURATION_BASE = 0.65;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var CASCADE_START = CASCADE_START_BASE * scale;
                var ENTRY_DURATION = ENTRY_DURATION_BASE * scale;
                var STAGGER_SECONDS = (staggerMs / 1000) * scale;

                var timeline = gsap.timeline({ paused: true });

                // IN: the sole mechanic. Explicit endpoints keep mounted re-seeks
                // deterministic. power2.out is --ease-standard.
                timeline.fromTo(
                  tiles,
                  { opacity: 0, x: offset.x, y: offset.y },
                  {
                    opacity: 1,
                    x: "0cqw",
                    y: "0cqh",
                    duration: ENTRY_DURATION,
                    ease: "power2.out",
                    stagger: { each: STAGGER_SECONDS, from: "start" },
                  },
                  CASCADE_START,
                );

                // HOLD: deliberately unanimated. OUT: one clean group fade with
                // power2.in, the GSAP form of --ease-exit.
                timeline.to(grid, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                timeline.seek(0);

                
                __hfTimelineSlot.set(timeline);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="stagger-cascade"
            data-start="0"
            data-duration="4"
            data-fps="30"
          >
            
    
            <div
              id="stagger-cascade-clip"
              class="sc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="sc-grid" aria-label="Cascading tile grid"></div>
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

  /* Root fills the host box. Every internal measurement uses cqw/cqh,
  and every painted color comes from the host theme contract. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f4f7fb);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .sc-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #090d16);
  }

  .sc-grid {
    width: 82cqw;
    height: 70cqh;
    display: grid;
    grid-template-columns: repeat(var(--sc-columns), minmax(0, 1fr));
    grid-auto-rows: minmax(0, 1fr);
    gap: min(2.2cqw, 3.8cqh);
  }

  .sc-tile {
    position: relative;
    min-width: 0;
    min-height: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    border: 0.16cqw solid var(--border, rgba(244, 247, 251, 0.14));
    border-radius: min(2.4cqw, 4cqh);
    background: color-mix(in srgb, var(--surface, #171e2d) 92%, var(--brand, #79a8ff));
    color: var(--fg, #f4f7fb);
  }

  .sc-tile::after {
    content: "";
    position: absolute;
    left: 14%;
    right: 14%;
    bottom: 12%;
    height: min(0.55cqw, 0.95cqh);
    border-radius: 50cqw;
    background: var(--brand, #79a8ff);
    opacity: 0.72;
  }

  .sc-tile-index {
    display: block;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(5cqw, 8cqh);
    font-weight: 700;
    line-height: 1;
    color: var(--fg, #f4f7fb);
  }
}
</style>
