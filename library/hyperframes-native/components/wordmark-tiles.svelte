<!-- Modified Svelte adaptation of registry/components/wordmark-tiles/wordmark-tiles.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "wordmark-tiles";
                var stage = root.querySelector(".wt-stage");
                var grid = root.querySelector(".wt-grid");

                // EDIT ZONE: declarations above and clamped reads below are the
                // single source of truth for the three public variables.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "LAUNCH" : String(vars.text).trim().slice(0, 12);
                if (text.length === 0) text = "LAUNCH";

                var rawColumns = Number(vars.columns);
                var columns = Number.isFinite(rawColumns) ? Math.round(rawColumns) : 12;
                columns = Math.max(8, Math.min(14, columns));

                var rawWaveStagger = Number(vars.waveStagger);
                var waveStaggerMs = Number.isFinite(rawWaveStagger) ? rawWaveStagger : 40;
                waveStaggerMs = Math.max(15, Math.min(50, waveStaggerMs));

                // INVARIANT: rows derive only from columns. This keeps one density
                // owner and gives the 86:48 stage near-square tiles at every value.
                var rows = Math.max(4, Math.round((columns * 5) / 12));
                var tileCount = columns * rows;
                var fontSize = Math.max(7, Math.min(19, 86 / Math.max(4, text.length * 0.62)));

                grid.style.setProperty("--wt-columns", String(columns));
                grid.style.setProperty("--wt-rows", String(rows));
                grid.style.setProperty("--wt-font-size", String(fontSize) + "cqw");
                grid.setAttribute("aria-label", text);

                // Fixed-seed LCG. Noise faces vary, while every rebuild with the
                // same variables produces the same tile field and wave order.
                var seed = 0x57a7c1e;
                function seededUnit() {
                  seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
                  return seed / 4294967296;
                }

                var fragment = document.createDocumentFragment();
                var tiles = [];
                for (var index = 0; index < tileCount; index += 1) {
                  var row = Math.floor(index / columns);
                  var column = index % columns;
                  var tile = document.createElement("span");
                  var noise = document.createElement("span");
                  var resolved = document.createElement("span");
                  var wordmark = document.createElement("span");
                  var noiseVariant = 1 + Math.floor(seededUnit() * 3);

                  tile.className = "wt-tile";
                  tile.setAttribute("aria-hidden", "true");
                  tile.dataset.waveRank = String(
                    column + row * 0.68 + Math.sin(row * 1.7 + column * 0.42) * 2.15,
                  );

                  noise.className = "wt-noise wt-noise-" + ["a", "b", "c"][noiseVariant - 1];
                  noise.dataset.startOpacity = String(0.72 + seededUnit() * 0.28);

                  resolved.className = "wt-resolved";
                  wordmark.className = "wt-fragment";
                  wordmark.textContent = text;
                  wordmark.style.setProperty(
                    "--wt-fragment-x",
                    String((-86 * column) / columns) + "cqw",
                  );
                  wordmark.style.setProperty("--wt-fragment-y", String((-48 * row) / rows) + "cqh");

                  resolved.appendChild(wordmark);
                  tile.appendChild(resolved);
                  tile.appendChild(noise);
                  fragment.appendChild(tile);
                  tiles.push(tile);
                }
                grid.replaceChildren(fragment);

                // The source mechanic combines travel with spatial sine waves.
                // Sorting by the stored rank creates the same rolling behavior,
                // including row reversals and pockets that lead adjacent columns.
                var waveTiles = tiles.slice().sort(function (a, b) {
                  return Number(a.dataset.waveRank) - Number(b.dataset.waveRank);
                });
                var resolvedByWave = waveTiles.map(function (tile) {
                  return tile.querySelector(".wt-resolved");
                });
                var noiseByWave = waveTiles.map(function (tile) {
                  return tile.querySelector(".wt-noise");
                });

                // RETIME RANGE: these five base values own global pacing. HOLD is
                // the only elastic phase, and the reveal never exceeds IN.
                var IN_BASE = 4.8;
                var OUT_BASE = 0.5;
                var STAGE_IN_BASE = 0.38;
                var WAVE_START_BASE = 0.2;
                var TILE_DURATION_BASE = 0.5;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "6.5"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var STAGE_IN = STAGE_IN_BASE * scale;
                var WAVE_START = WAVE_START_BASE * scale;
                var TILE_DURATION = TILE_DURATION_BASE * scale;
                var maxStep = Math.max(
                  0,
                  (IN - WAVE_START - TILE_DURATION) / Math.max(1, tileCount - 1),
                );
                var STAGGER_SECONDS = Math.min((waveStaggerMs / 1000) * scale, maxStep);

                gsap.set(stage, { opacity: 0 });
                gsap.set(resolvedByWave, { opacity: 0, scale: 0.82 });
                gsap.set(noiseByWave, {
                  opacity: function (_index, element) {
                    return Number(element.dataset.startOpacity);
                  },
                  scale: 1,
                });

                var timeline = gsap.timeline({ paused: true });

                timeline.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);

                // IN: each tile resolves with --ease-standard's GSAP owner,
                // power2.out. The spatial rank supplies wave order to the stagger.
                timeline.to(
                  resolvedByWave,
                  {
                    opacity: 1,
                    scale: 1,
                    duration: TILE_DURATION,
                    ease: "power2.out",
                    stagger: { each: STAGGER_SECONDS, from: "start" },
                  },
                  WAVE_START,
                );
                timeline.to(
                  noiseByWave,
                  {
                    opacity: 0,
                    scale: 1.18,
                    duration: TILE_DURATION,
                    ease: "power2.out",
                    stagger: { each: STAGGER_SECONDS, from: "start" },
                  },
                  WAVE_START,
                );

                // HOLD is deliberately still. OUT uses the catalog exit ease.
                timeline.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

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
            data-composition-id="wordmark-tiles"
            data-start="0"
            data-duration="6.5"
            data-fps="30"
          >
            
    
            <div
              id="wordmark-tiles-clip"
              class="wt-clip clip"
              data-start="0"
              data-duration="6.5"
              data-track-index="0"
            >
              <div class="wt-stage">
                <div class="wt-grid" role="img" aria-label="LAUNCH"></div>
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

  /* Root fills the host box. Internal layout uses only cqw/cqh, and
  every painted color is owned by the host theme tokens. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f5f7ff);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .wt-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #070a12);
  }

  .wt-stage {
    width: 86cqw;
    height: 48cqh;
    position: relative;
    opacity: 0;
  }

  /* EDIT ZONE: stage proportions above and tile line weight below are
  the visual density controls. The public columns knob owns the grid
  count, and no second density decision exists in CSS. */
  .wt-grid {
    width: 100%;
    height: 100%;
    display: grid;
    grid-template-columns: repeat(var(--wt-columns), minmax(0, 1fr));
    grid-template-rows: repeat(var(--wt-rows), minmax(0, 1fr));
    overflow: hidden;
    border: min(0.12cqw, 0.22cqh) solid var(--border, rgba(245, 247, 255, 0.14));
    border-radius: var(--radius, 16px);
    background: var(--surface, #151b2b);
  }

  .wt-tile {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    box-shadow: inset 0 0 0 min(0.08cqw, 0.14cqh) var(--border, rgba(245, 247, 255, 0.14));
    background: var(--surface, #151b2b);
  }

  .wt-noise, .wt-resolved {
    position: absolute;
    inset: 0;
    display: block;
    transform-origin: center;
  }

  .wt-noise-a {
    background: color-mix(in srgb, var(--surface, #151b2b) 64%, var(--muted, #7f8aa3));
  }

  .wt-noise-b {
    background: color-mix(in srgb, var(--surface, #151b2b) 58%, var(--brand, #7c9dff));
  }

  .wt-noise-c {
    background: color-mix(in srgb, var(--surface, #151b2b) 56%, var(--accent, #64e2c2));
  }

  .wt-resolved {
    overflow: hidden;
    background: color-mix(in srgb, var(--surface, #151b2b) 92%, var(--brand, #7c9dff));
  }

  /* Every tile contains one crop of the same stable wordmark surface.
  JS computes only the crop offsets from the canonical grid shape. */
  .wt-fragment {
    position: absolute;
    left: var(--wt-fragment-x);
    top: var(--wt-fragment-y);
    width: 86cqw;
    height: 48cqh;
    display: grid;
    place-items: center;
    color: var(--fg, #f5f7ff);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: var(--wt-font-size);
    font-weight: 800;
    line-height: 1;
    letter-spacing: -0.035em;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap;
  }
}
</style>
