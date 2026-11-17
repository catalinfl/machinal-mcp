<!-- Modified Svelte adaptation of registry/components/paper-collage-reveal/paper-collage-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var content = document.getElementById("pcr-content");
                var scrapsHost = document.getElementById("pcr-scraps");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var panelsValue = parseInt(vars.panels, 10);
                var PANEL_COUNT = Number.isFinite(panelsValue)
                  ? Math.min(8, Math.max(4, panelsValue))
                  : 6;

                var tone = vars.tone === "cream" || vars.tone === "kraft" ? vars.tone : "mixed";
                var spread = vars.spread === "scatter" ? "scatter" : "outward";

                var toneColors = {
                  cream: "color-mix(in srgb, var(--surface, #fffdf8) 72%, #e8d9ae)",
                  kraft: "color-mix(in srgb, var(--accent-2, #b98a4e) 55%, #7d5a34)",
                  white: "var(--surface, #fffdf8)",
                };
                var toneKeys = ["cream", "kraft", "white"];

                // Slot. Caller templates live at the host document level (the
                // mount wipes host-clip children, and templates never render).
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector(
                    'template[data-slot="paper-collage-reveal-content"]',
                  );
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  var defaultMark = content.querySelector(".pcr-content-default");
                  if (defaultMark) defaultMark.remove();
                  content.appendChild(hostDoc.importNode(slotTemplate.content, true));
                }

                // Envelope: fixed IN, elastic HOLD, never time-scaled.
                var IN_BASE = 1.35;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2.6"));
                var squeeze = Math.min(1, duration / IN_BASE);
                var FIRST_LIFT = 0.1 * squeeze;
                var PANEL_TRAVEL = 0.45 * squeeze;
                var LAST_START = IN_BASE * squeeze - PANEL_TRAVEL;

                // Everything a scrap needs lives in this table, computed once
                // during synchronous timeline construction from a fixed seed.
                var state = 0x2c6b8f19;
                function next() {
                  state = (Math.imul(1664525, state) + 1013904223) >>> 0;
                  return state / 4294967296;
                }
                function range(lo, hi) {
                  return lo + next() * (hi - lo);
                }

                var COLS_BY_COUNT = { 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 };
                var cols = COLS_BY_COUNT[PANEL_COUNT];
                var rows = Math.ceil(PANEL_COUNT / cols);
                var OVERSCAN = 3.2;

                var scatterBaseAngle = range(75, 105);

                // Torn silhouette: each side wanders by up to TORN_AMP % of the
                // frame at SIDE_STEPS points, so no edge runs straight.
                var TORN_AMP = 1.1;
                var SIDE_STEPS = 6;
                var SIDES = [
                  [0, 0, 100, 0, 0, 1],
                  [100, 0, 100, 100, -1, 0],
                  [100, 100, 0, 100, 0, -1],
                  [0, 100, 0, 0, 1, 0],
                ];
                function tornPolygon(w, h) {
                  var pts = [];
                  SIDES.forEach(function (s) {
                    for (var k = 0; k < SIDE_STEPS; k += 1) {
                      var t = (k === 0 ? 0 : k + range(-0.3, 0.3)) / SIDE_STEPS;
                      var d = range(-TORN_AMP, TORN_AMP);
                      var px = s[0] + (s[2] - s[0]) * t + (s[4] * d * 100) / w;
                      var py = s[1] + (s[3] - s[1]) * t + (s[5] * d * 100) / h;
                      pts.push(px.toFixed(2) + "% " + py.toFixed(2) + "%");
                    }
                  });
                  return pts.join(", ");
                }

                var startGap = (LAST_START - FIRST_LIFT) / Math.max(1, PANEL_COUNT - 1);
                var panels = [];
                for (var i = 0; i < PANEL_COUNT; i += 1) {
                  var row = Math.floor(i / cols);
                  var panelsInRow = Math.min(cols, PANEL_COUNT - row * cols);
                  var colInRow = i % cols;
                  var cellW = 100 / panelsInRow;
                  var cellH = 100 / rows;

                  var jitterX = range(-1, 1);
                  var jitterY = range(-1, 1);
                  var x = colInRow * cellW - OVERSCAN + jitterX;
                  var y = row * cellH - OVERSCAN + jitterY;
                  var w = cellW + OVERSCAN * 2;
                  var h = cellH + OVERSCAN * 2;

                  var poly = tornPolygon(w, h);

                  var panelTone =
                    tone === "mixed" ? toneKeys[Math.floor(next() * toneKeys.length)] : tone;

                  var cx = x + w / 2;
                  var cy = y + h / 2;
                  var angleDeg;
                  if (spread === "outward") {
                    var dx = cx - 50;
                    var dy = cy - 50;
                    angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
                  } else {
                    angleDeg = scatterBaseAngle + range(-45, 45);
                  }
                  var rad = (angleDeg * Math.PI) / 180;
                  var ux = Math.cos(rad);
                  var uy = Math.sin(rad);
                  var travelPct = 130;
                  // The arc: a sideways hop perpendicular to the exit, biased
                  // upward, that eases out while the exit eases in.
                  var arcAmp = ux > 0 ? -9 : 9;
                  var rotation = range(8, 15) * (next() < 0.5 ? -1 : 1);

                  // Monotonic starts: the first scrap lifts at FIRST_LIFT, the
                  // rest follow in index order with a seeded offset.
                  var startAt = i === 0 ? FIRST_LIFT : FIRST_LIFT + (i - range(0, 0.4)) * startGap;

                  panels.push({
                    x: x,
                    y: y,
                    w: w,
                    h: h,
                    poly: poly,
                    tone: panelTone,
                    exitX: ux * travelPct,
                    exitY: uy * travelPct,
                    arcX: -uy * arcAmp,
                    arcY: ux * arcAmp,
                    rotation: rotation,
                    startAt: startAt,
                  });
                }

                // DOM per scrap: panel (exit, tilt, shadow) > arc (hop, deckle) >
                // fill (torn clip, colour) > grain. Scraps that lift first sit on top.
                var panelFrag = document.createDocumentFragment();
                var panelEls = panels.map(function (p, idx) {
                  var el = document.createElement("div");
                  el.className = "pcr-panel";
                  el.style.left = p.x + "%";
                  el.style.top = p.y + "%";
                  el.style.width = p.w + "%";
                  el.style.height = p.h + "%";
                  el.style.zIndex = String(PANEL_COUNT - idx);

                  var arc = document.createElement("div");
                  arc.className = "pcr-panel-arc";
                  var fill = document.createElement("div");
                  fill.className = "pcr-panel-fill";
                  fill.style.clipPath = "polygon(" + p.poly + ")";
                  fill.style.setProperty("--pcr-panel-color", toneColors[p.tone]);
                  var grain = document.createElement("div");
                  grain.className = "pcr-panel-grain";
                  fill.appendChild(grain);
                  arc.appendChild(fill);
                  el.appendChild(arc);

                  panelFrag.appendChild(el);
                  return el;
                });
                scrapsHost.appendChild(panelFrag);

                var tl = gsap.timeline({ paused: true });
                panels.forEach(function (p, idx) {
                  tl.fromTo(
                    panelEls[idx],
                    { x: 0, y: 0, rotation: 0, "--lift": 0 },
                    {
                      x: p.exitX + "cqw",
                      y: p.exitY + "cqh",
                      rotation: p.rotation,
                      "--lift": 1,
                      duration: PANEL_TRAVEL,
                      ease: "power2.in",
                      // 2D transforms only: a composited layer caches the filtered
                      // raster by seek history, so the same t can give different pixels.
                      force3D: false,
                    },
                    p.startAt,
                  );
                  tl.fromTo(
                    panelEls[idx].firstChild,
                    { x: 0, y: 0 },
                    {
                      x: p.arcX + "cqmin",
                      y: p.arcY + "cqmin",
                      duration: PANEL_TRAVEL,
                      ease: "power1.out",
                      force3D: false,
                    },
                    p.startAt,
                  );
                });
                tl.set({}, {}, duration);
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "panels", "type": "number", "role": "content", "label": "Panels", "description": "How many torn paper scraps cover the frame.", "default": 6, "min": 4, "max": 8, "step": 1 &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Paper tone", "description": "Color per scrap. Mixed seeds a different tone per scrap for a real scrapbook mix.", "default": "mixed", "options": [&#123; "value": "cream", "label": "Cream" &#125;, &#123; "value": "kraft", "label": "Kraft" &#125;, &#123; "value": "mixed", "label": "Mixed" &#125;] &#125;,
        &#123; "id": "spread", "type": "enum", "role": "motion", "label": "Spread", "description": "Outward sends each scrap away from the frame center. Scatter sends every scrap the same general direction with seeded variance.", "default": "outward", "options": [&#123; "value": "outward", "label": "Outward" &#125;, &#123; "value": "scatter", "label": "Scatter" &#125;] &#125;
      ]' data-composition-duration="2.6" data-composition-id="paper-collage-reveal" data-duration="2.6" data-fps="30">
            
    
            <div
              id="paper-collage-reveal-clip"
              class="pcr-clip clip"
              data-start="0"
              data-duration="2.6"
              data-track-index="0"
            >
              <svg aria-hidden="true" width="0" height="0" style="position: absolute">
                <defs>
                  
                  <filter
                    id="pcr-grain-filter"
                    x="0%"
                    y="0%"
                    width="100%"
                    height="100%"
                    color-interpolation-filters="sRGB"
                  >
                    <feTurbulence
                      type="fractalNoise"
                      baseFrequency="0.75"
                      numOctaves="3"
                      seed="41"
                      stitchTiles="stitch"
                    />
                    <feColorMatrix
                      type="matrix"
                      values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0 1"
                    />
                    <feComponentTransfer>
                      <feFuncR type="linear" slope="0.7" intercept="0.6" />
                      <feFuncG type="linear" slope="0.7" intercept="0.6" />
                      <feFuncB type="linear" slope="0.7" intercept="0.6" />
                    </feComponentTransfer>
                  </filter>
                  
                  <filter id="pcr-deckle-filter" x="-4%" y="-4%" width="108%" height="108%">
                    <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="4" seed="7" />
                    <feDisplacementMap
                      in="SourceGraphic"
                      scale="16"
                      xChannelSelector="R"
                      yChannelSelector="G"
                    />
                  </filter>
                </defs>
              </svg>
    
              <div class="pcr-content" id="pcr-content">
                <div class="pcr-content-default">
                  <span class="pcr-content-default-mark" aria-hidden="true">Revealed</span>
                </div>
              </div>
              <div class="pcr-scraps" id="pcr-scraps"></div>
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

  .pcr-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .pcr-content {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .pcr-content > img, .pcr-content > video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pcr-content-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: var(--bg, #111318);
  }

  .pcr-content-default-mark {
    font-size: 4.5cqmin;
    font-weight: 700;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--surface, #fffdf8);
  }

  .pcr-scraps {
    position: absolute;
    inset: 0;
  }

  /* Drop-shadow sits outside the clip-path so it is not clipped away;
  --lift (0 resting, 1 gone) grows it as the scrap rises. */
  .pcr-panel {
    --lift: 0;
    position: absolute;
    filter: drop-shadow(
      0 calc(0.3cqmin + var(--lift) * 2.4cqmin) calc(0.4cqmin + var(--lift) * 2.8cqmin)
      rgba(20, 14, 6, calc(0.42 - var(--lift) * 0.14))
    );
  }

  .pcr-panel-arc, .pcr-panel-fill, .pcr-panel-grain {
    position: absolute;
    inset: 0;
  }

  .pcr-panel-arc {
    filter: url(#pcr-deckle-filter);
  }

  .pcr-panel-fill {
    background: var(--pcr-panel-color, #f3ecda);
  }

  .pcr-panel-grain {
    filter: url(#pcr-grain-filter);
    mix-blend-mode: multiply;
  }
}
</style>
