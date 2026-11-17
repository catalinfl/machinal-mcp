<!-- Modified Svelte adaptation of registry/components/torn-paper-rip/torn-paper-rip.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var fromLayer = document.getElementById("tpr-from");
                var fromClip = document.getElementById("tpr-from-clip");
                var toLayer = document.getElementById("tpr-to");
                var rimLayer = document.getElementById("tpr-rim");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var direction = vars.direction === "right-to-left" ? "right-to-left" : "left-to-right";

                var rimColors = {
                  cream: "#f6f1e7",
                  kraft: "#d8c29c",
                  white: "#fbfaf8",
                };
                var tone = Object.prototype.hasOwnProperty.call(rimColors, vars.tone)
                  ? vars.tone
                  : "cream";
                root.style.setProperty("--tpr-rim-color", rimColors[tone]);

                var roughnessValue = parseFloat(vars.roughness);
                var roughness = Number.isFinite(roughnessValue)
                  ? Math.min(90, Math.max(20, roughnessValue))
                  : 55;
                var roughnessNorm = (roughness - 20) / 70;

                // Slots. Caller templates live at the host document level (the
                // mount wipes host-clip children, and templates never render),
                // so the lookup deliberately goes through ownerDocument.
                var hostDoc = root.ownerDocument;
                function mountSlot(slotName, layer) {
                  var tpl = null;
                  try {
                    tpl = hostDoc.querySelector('template[data-slot="' + slotName + '"]');
                  } catch (error) {
                    tpl = null;
                  }
                  if (!tpl) return;
                  var defaultMark = layer.querySelector(".tpr-default");
                  if (defaultMark) defaultMark.remove();
                  layer.appendChild(hostDoc.importNode(tpl.content, true));
                }
                mountSlot("torn-paper-rip-from", fromClip);
                mountSlot("torn-paper-rip-to", toLayer);

                // Envelope: fixed IN, elastic HOLD, never time-scaled.
                var IN_BASE = 1.0;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2.4"));
                var IN = Math.min(IN_BASE, duration);

                // Edge table, built once. Sizes are px at 1920 wide, stored as %
                // of width: a low-frequency wander (~40 px at roughness 55), a
                // 2-4 px per-vertex fibre, and a 6-14 px paper-core band.
                var PX = 100 / 1920;
                var ROWS = 180;
                var WANDER_PX = 22 + roughnessNorm * 36;
                var FIBRE_PX = 2 + roughnessNorm * 2;
                var DIAGONAL_PCT = 1 + roughnessNorm * 4;
                var RIM_MIN_PX = 6;
                var RIM_MAX_PX = 14;

                var state = 0x7a9e11cf;
                function rand() {
                  state = (Math.imul(1664525, state) + 1013904223) >>> 0;
                  return state / 4294967296;
                }
                // Seeded value noise over [0, 1] with smoothstep between knots.
                function valueNoise(knots) {
                  var k = [];
                  for (var i = 0; i <= knots; i += 1) k.push(rand() * 2 - 1);
                  return function (v) {
                    var f = v * knots;
                    var i = Math.min(knots - 1, Math.floor(f));
                    var u = f - i;
                    u = u * u * (3 - 2 * u);
                    return k[i] + (k[i + 1] - k[i]) * u;
                  };
                }
                var wander = valueNoise(6);
                var coreWidth = valueNoise(14);
                var edge = [];
                for (var r = 0; r <= ROWS; r += 1) {
                  var v = r / ROWS;
                  var rimPx = RIM_MIN_PX + (RIM_MAX_PX - RIM_MIN_PX) * (coreWidth(v) * 0.5 + 0.5);
                  rimPx = Math.min(
                    RIM_MAX_PX,
                    Math.max(RIM_MIN_PX, rimPx + (rand() * 2 - 1) * FIBRE_PX),
                  );
                  edge.push({
                    y: (v * 100).toFixed(2) + "%",
                    offset:
                      (v - 0.5) * DIAGONAL_PCT +
                      (wander(v) * WANDER_PX + (rand() * 2 - 1) * FIBRE_PX) * PX,
                    rim: rimPx * PX,
                  });
                }

                var maxOffset = edge.reduce(function (m, row) {
                  return Math.max(m, Math.abs(row.offset));
                }, 0);
                // Clears the worst row plus the core band and its feather, so no
                // edge is on screen at p=0 or p=1.
                var MARGIN = maxOffset + RIM_MAX_PX * PX + 0.5;
                // side: which side of the boundary still shows "from" (ltr tears
                // from the left, so "from" lives on the right; rtl mirrors).
                var side = direction === "left-to-right" ? "right" : "left";
                var START = side === "right" ? -MARGIN : 100 + MARGIN;
                var END = side === "right" ? 100 + MARGIN : -MARGIN;
                var CORNER_X = side === "right" ? "100%" : "0%";
                var RIM_SIGN = side === "right" ? -1 : 1;
                var LIFT_SIGN = -RIM_SIGN;
                fromLayer.style.transformOrigin = CORNER_X + " 100%";

                // power2.in over the first 20% of travel in 30% of the time,
                // then power3.out; the speed jump is the paper giving way.
                var RESIST_T = 0.3;
                function tearEase(p) {
                  if (p < RESIST_T) return 0.2 * Math.pow(p / RESIST_T, 2);
                  return 0.2 + 0.8 * (1 - Math.pow(1 - (p - RESIST_T) / (1 - RESIST_T), 3));
                }

                function paint(p) {
                  var e = tearEase(Math.max(0, Math.min(1, p)));
                  var bx = START + (END - START) * e;

                  var fromPts = CORNER_X + " 0%, " + CORNER_X + " 100%";
                  var rimPts = fromPts;
                  for (var i = ROWS; i >= 0; i -= 1) {
                    var row = edge[i];
                    var x = bx + row.offset;
                    fromPts += ", " + x.toFixed(2) + "% " + row.y;
                    rimPts += ", " + (x + RIM_SIGN * row.rim).toFixed(2) + "% " + row.y;
                  }
                  fromClip.style.clipPath = "polygon(" + fromPts + ")";
                  rimLayer.style.clipPath = "polygon(" + rimPts + ")";

                  // The sheet lifts toward the tear: up to 3% travel, 1.5deg,
                  // and a shadow growing to 0 12px 24px (1080 tall).
                  fromLayer.style.transform =
                    "translateX(" +
                    (LIFT_SIGN * 3 * e).toFixed(3) +
                    "%) rotate(" +
                    (LIFT_SIGN * 1.5 * e).toFixed(3) +
                    "deg)";
                  fromLayer.style.filter =
                    "drop-shadow(0 " +
                    (1.111 * e).toFixed(3) +
                    "cqmin " +
                    (2.222 * e).toFixed(3) +
                    "cqmin rgba(0, 0, 0, 0.25))";
                }

                paint(0);

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    paint(this.progress());
                  },
                });
                tl.to({}, { duration: IN, ease: "none" }, 0);
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Which way the tear travels across the frame.", "default": "left-to-right", "options": [&#123; "value": "left-to-right", "label": "Left to right" &#125;, &#123; "value": "right-to-left", "label": "Right to left" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Paper tone", "description": "Color of the exposed paper cross-section riding the tear.", "default": "cream", "options": [&#123; "value": "cream", "label": "Cream" &#125;, &#123; "value": "kraft", "label": "Kraft" &#125;, &#123; "value": "white", "label": "White" &#125;] &#125;,
        &#123; "id": "roughness", "type": "number", "role": "style", "label": "Roughness", "description": "How jagged and fibrous the tear edge is. Low is a clean deckle edge, high is roughly torn.", "default": 55, "min": 20, "max": 90, "step": 1 &#125;
      ]' data-composition-duration="2.4" data-composition-id="torn-paper-rip" data-duration="2.4" data-fps="30">
            
    
            <div
              id="torn-paper-rip-clip"
              class="tpr-clip clip"
              data-start="0"
              data-duration="2.4"
              data-track-index="0"
            >
              <svg aria-hidden="true" width="0" height="0" style="position: absolute">
                <defs>
                  
                  <filter
                    id="tpr-grain-filter"
                    x="0%"
                    y="0%"
                    width="100%"
                    height="100%"
                    color-interpolation-filters="sRGB"
                  >
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.9"
                      numOctaves="2"
                      seed="27"
                      stitchTiles="stitch"
                      result="noise"
                    />
                    <feColorMatrix
                      in="noise"
                      type="matrix"
                      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.18 0.18 0.18 0 0"
                    />
                  </filter>
                </defs>
              </svg>
    
              <div class="tpr-stage">
                <div class="tpr-layer tpr-to" id="tpr-to">
                  <div class="tpr-default">
                    <span class="tpr-default-mark" aria-hidden="true">Chapter two</span>
                  </div>
                </div>
                <div class="tpr-layer tpr-from" id="tpr-from">
                  <div class="tpr-rim">
                    <div class="tpr-rim-shape" id="tpr-rim">
                      <div class="tpr-rim-grain"></div>
                    </div>
                  </div>
                  <div class="tpr-from-clip" id="tpr-from-clip">
                    <div class="tpr-default">
                      <span class="tpr-default-mark" aria-hidden="true">Chapter one</span>
                    </div>
                  </div>
                </div>
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
    color: var(--fg, #1d1b16);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
  }

  .tpr-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .tpr-stage {
    position: absolute;
    inset: 0;
  }

  .tpr-layer {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .tpr-layer > img, .tpr-layer > video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* .tpr-from carries the per-frame lift transform and drop-shadow.
  Filter and clip-path never share an element: CSS applies filter
  first, so a clip on the same node would clip the shadow away. */

  .tpr-from-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .tpr-from-clip > img, .tpr-from-clip > video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tpr-rim {
    position: absolute;
    inset: 0;
    filter: blur(0.12cqmin);
  }

  .tpr-rim-shape {
    position: absolute;
    inset: 0;
    background: var(--tpr-rim-color, #f6f1e7);
  }

  .tpr-rim-grain {
    position: absolute;
    inset: 0;
    filter: url(#tpr-grain-filter);
    opacity: 0.5;
    mix-blend-mode: multiply;
  }

  .tpr-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .tpr-default-mark {
    font-size: 5cqmin;
    font-weight: 700;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    opacity: 0.5;
  }

  .tpr-from .tpr-default {
    background: #f4f4f5;
    color: #111318;
  }

  .tpr-to .tpr-default {
    background: #111318;
    color: #f4f4f5;
  }
}
</style>
