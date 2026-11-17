<!-- Modified Svelte adaptation of registry/components/ascii-trail-reveal/ascii-trail-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var content = root.querySelector(".atr-content");
                var label = root.querySelector(".atr-label");
                var grid = root.querySelector(".atr-grid");
                var guide = root.querySelector(".atr-path-guide");
                var actor = root.querySelector("#ascii-trail-reveal-actor");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var labelText = vars.label == null ? "The reveal" : String(vars.label);
                var accent = vars.accent === "blue" || vars.accent === "violet" ? vars.accent : "green";
                var trailWidth = vars.trail_width === "wide" ? "wide" : "narrow";
                var accentColors = {
                  green: "var(--brand, #4ade80)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #a78bfa)",
                };

                label.textContent = labelText;
                root.style.setProperty("--atr-accent", accentColors[accent]);

                var COLS = 24;
                var ROWS = 14;
                var GLYPHS = " .:-=+*#%@01/\\<>[]{}";
                var PATH_POINTS = [
                  [-80, 460],
                  [340, 460],
                  [660, 140],
                  [1080, 140],
                ];
                var cells = [];

                function sCurvePoint(progress) {
                  var inverse = 1 - progress;
                  var startWeight = inverse * inverse * inverse;
                  var firstWeight = 3 * inverse * inverse * progress;
                  var secondWeight = 3 * inverse * progress * progress;
                  var endWeight = progress * progress * progress;
                  return {
                    x:
                      startWeight * PATH_POINTS[0][0] +
                      firstWeight * PATH_POINTS[1][0] +
                      secondWeight * PATH_POINTS[2][0] +
                      endWeight * PATH_POINTS[3][0],
                    y:
                      startWeight * PATH_POINTS[0][1] +
                      firstWeight * PATH_POINTS[1][1] +
                      secondWeight * PATH_POINTS[2][1] +
                      endWeight * PATH_POINTS[3][1],
                  };
                }

                guide.setAttribute(
                  "d",
                  "M " +
                    PATH_POINTS[0].join(" ") +
                    " C " +
                    PATH_POINTS.slice(1)
                      .map(function (point) {
                        return point.join(" ");
                      })
                      .join(" "),
                );

                for (var row = 0; row < ROWS; row += 1) {
                  for (var column = 0; column < COLS; column += 1) {
                    var index = row * COLS + column;
                    var cell = document.createElement("span");
                    var glyphIndex = (index * 17 + row * 11 + column * 7) % GLYPHS.length;
                    cell.className = "atr-cell";
                    cell.textContent = GLYPHS.charAt(glyphIndex);
                    grid.appendChild(cell);
                    cells.push({ element: cell, row: row, column: column, index: index });
                  }
                }

                var IN_BASE = 3.2;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var IN = Math.min(IN_BASE, duration);
                var HOLD = Math.max(0, duration - IN);
                var phaseScale = IN / IN_BASE;
                var actorState = { progress: 0 };

                function updateActor() {
                  var point = sCurvePoint(actorState.progress);
                  actor.setAttribute("transform", "translate(" + point.x + " " + point.y + ")");
                }

                gsap.set(content, { scale: 0.985 });
                gsap.set(guide, { opacity: 0 });
                gsap.set(actor, { opacity: 0 });
                updateActor();

                var tl = gsap.timeline({ paused: true });

                tl.to(content, { scale: 1, duration: IN, ease: "power2.out" }, 0);
                tl.to(
                  guide,
                  { opacity: 0.72, duration: 0.24 * phaseScale, ease: "power2.out" },
                  0.18 * phaseScale,
                );
                tl.to(
                  actor,
                  { opacity: 1, duration: 0.24 * phaseScale, ease: "power2.out" },
                  0.22 * phaseScale,
                );
                tl.to(
                  actorState,
                  {
                    progress: 1,
                    duration: 2.35 * phaseScale,
                    ease: "power2.out",
                    onUpdate: updateActor,
                  },
                  0.34 * phaseScale,
                );

                cells.forEach(function (cellData) {
                  var progress = (cellData.column + 0.5) / COLS;
                  var pathPoint = sCurvePoint(progress);
                  var cellY = ((cellData.row + 0.5) / ROWS) * 600;
                  var distanceFromPath = Math.abs(cellY - pathPoint.y) / 600;
                  var distanceLag = distanceFromPath * (trailWidth === "wide" ? 0.5 : 0.8);
                  var indexJitter = ((cellData.index * 37) % 11) * 0.009;
                  var revealAt = (0.42 + progress * 1.92 + distanceLag + indexJitter) * phaseScale;
                  var flipDuration = (0.2 + ((cellData.index * 13) % 5) * 0.018) * phaseScale;

                  tl.to(
                    cellData.element,
                    {
                      rotationY: 88,
                      scaleX: 0.3,
                      opacity: 0,
                      duration: flipDuration,
                      ease: "power2.in",
                    },
                    revealAt,
                  );
                });

                tl.to(
                  guide,
                  { opacity: 0, duration: 0.24 * phaseScale, ease: "power2.in" },
                  2.82 * phaseScale,
                );
                tl.to(
                  actor,
                  { opacity: 0, duration: 0.24 * phaseScale, ease: "power2.in" },
                  2.92 * phaseScale,
                );

                if (HOLD > 0) {
                  tl.to(
                    content,
                    {
                      scale: 1.008,
                      duration: HOLD / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                    },
                    IN,
                  );
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "label", "type": "string", "role": "content", "label": "Panel label", "description": "Text shown on the revealed panel.", "default": "The reveal" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color used by the trail and revealed panel.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "trail_width", "type": "enum", "role": "layout", "label": "Trail width", "description": "Width of the cell reveal tail around the authored path.", "default": "narrow", "options": [&#123; "value": "narrow", "label": "Narrow" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="ascii-trail-reveal" data-duration="4" data-fps="30">
            
    
            <div
              id="ascii-trail-reveal-clip"
              class="atr-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="atr-panel">
                <div class="atr-content">
                  <div class="atr-label"></div>
                </div>
                <div class="atr-grid" aria-hidden="true"></div>
                <svg
                  class="atr-path-layer"
                  viewBox="0 0 1000 600"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path class="atr-path-guide"></path>
                  <g id="ascii-trail-reveal-actor">
                    <circle class="atr-actor-halo" r="42"></circle>
                    <circle class="atr-actor-core" r="13"></circle>
                  </g>
                </svg>
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
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .atr-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .atr-panel {
    position: relative;
    width: 88cqw;
    height: 76cqh;
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--atr-accent) 52%, #475569);
    border-radius: 3cqmin;
    background: #111820;
    box-shadow:
      0 4cqh 12cqh rgba(0, 0, 0, 0.45),
      inset 0 0 0 0.12cqmin rgba(255, 255, 255, 0.04);
    perspective: 80cqmin;
  }

  .atr-content {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    padding: 8cqw;
    background:
      radial-gradient(
        circle at 50% 45%,
        color-mix(in srgb, var(--atr-accent) 24%, transparent),
        transparent 48%
      ),
      linear-gradient(145deg, #17212c, #0c1219);
    transform-origin: 50% 50%;
  }

  .atr-label {
    max-width: 76cqw;
    color: #f8fafc;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(24px, 10cqmin, 112px);
    font-weight: 760;
    line-height: 0.96;
    letter-spacing: -0.045em;
    text-align: center;
    text-wrap: balance;
    text-shadow: 0 0 4cqmin color-mix(in srgb, var(--atr-accent) 28%, transparent);
  }

  .atr-grid {
    --atr-columns: 24;
    --atr-rows: 14;
    position: absolute;
    inset: 0;
    z-index: 2;
    display: grid;
    grid-template-columns: repeat(var(--atr-columns), 1fr);
    grid-template-rows: repeat(var(--atr-rows), 1fr);
    overflow: hidden;
    background: #0b1016;
    transform-style: preserve-3d;
  }

  .atr-cell {
    display: grid;
    place-items: center;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border-right: 0.06cqmin solid rgba(148, 163, 184, 0.08);
    border-bottom: 0.06cqmin solid rgba(148, 163, 184, 0.08);
    background: color-mix(in srgb, #111820 94%, var(--atr-accent));
    color: color-mix(in srgb, var(--atr-accent) 72%, #dbeafe);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace);
    font-size: clamp(7px, 2.35cqmin, 22px);
    font-weight: 650;
    line-height: 1;
    transform-origin: 50% 50%;
    backface-visibility: hidden;
    will-change: transform, opacity;
  }

  .atr-path-layer {
    position: absolute;
    inset: 0;
    z-index: 3;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .atr-path-guide {
    fill: none;
    stroke: color-mix(in srgb, var(--atr-accent) 34%, transparent);
    stroke-width: 2;
    stroke-linecap: round;
    stroke-dasharray: 3 14;
  }

  .atr-actor-halo {
    fill: color-mix(in srgb, var(--atr-accent) 22%, transparent);
  }

  .atr-actor-core {
    fill: #f8fafc;
    stroke: var(--atr-accent);
    stroke-width: 7;
    filter: drop-shadow(0 0 18px var(--atr-accent));
  }
}
</style>
