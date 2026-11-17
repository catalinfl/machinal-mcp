<!-- Modified Svelte adaptation of registry/components/segmentation-flood/segmentation-flood.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".sgf-stage");
                var subject = root.querySelector(".sgf-subject");
                var scene = root.querySelector(".sgf-scene");
                var canvas = root.querySelector(".sgf-canvas");
                var overlay = root.querySelector(".sgf-overlay");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var labels = String(vars.regions == null ? "" : vars.regions)
                  .split(",")
                  .map(function (s) {
                    return s.trim();
                  })
                  .filter(Boolean)
                  .slice(0, 4);
                if (labels.length < 2) labels = ["Figure", "Signal", "Ground"];

                var floodAtRaw = parseFloat(vars.flood_at);
                var flicker = vars.flicker !== "off";
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
                root.style.setProperty("--sgf-accent", accentColors[accent]);

                // Region anchor cells (fractions of the stage), top-left to
                // bottom-right so the staggered flood reads as one pass.
                var anchors = [
                  { x: 0.07, y: 0.11, w: 0.34, h: 0.36 },
                  { x: 0.55, y: 0.08, w: 0.37, h: 0.4 },
                  { x: 0.12, y: 0.56, w: 0.3, h: 0.33 },
                  { x: 0.53, y: 0.58, w: 0.36, h: 0.31 },
                ];

                // SLOT. Caller templates live at HOST DOCUMENT level.
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector(
                    'template[data-slot="segmentation-flood-subject"]',
                  );
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  scene.remove();
                  subject.appendChild(hostDoc.importNode(slotTemplate.content, true));
                } else {
                  // Default token scene: muted shapes seated inside the region
                  // anchors so the machine-vision read has content to read.
                  for (var s = 0; s < labels.length; s += 1) {
                    var cell = anchors[s];
                    var shape = hostDoc.createElement("div");
                    shape.className = s % 2 === 1 ? "sgf-shape round" : "sgf-shape";
                    shape.style.left = (cell.x + cell.w * 0.16) * 100 + "%";
                    shape.style.top = (cell.y + cell.h * 0.18) * 100 + "%";
                    shape.style.width = cell.w * 0.68 * 100 + "%";
                    shape.style.height = cell.h * 0.64 * 100 + "%";
                    scene.appendChild(shape);
                  }
                }

                // Envelope. The pass length is fixed by the region count; the
                // start cue is clamped so pass + exit always fit.
                var fps = 30;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var OUT = exit === "none" ? 0 : 0.45;
                var STAGGER = 0.35;
                var REGION_DUR = 1.0;
                var CHIP_DUR = 0.3;
                var passLen = STAGGER * (labels.length - 1) + REGION_DUR + CHIP_DUR;
                var floodAt = isFinite(floodAtRaw) ? floodAtRaw : 0.8;
                floodAt = Math.min(
                  Math.max(0.2, floodAt),
                  Math.max(0.2, duration - passLen - OUT - 0.1),
                );
                var floodEnd = floodAt + STAGGER * (labels.length - 1) + REGION_DUR;
                var OUT_START = duration - OUT;

                // Canvas raster basis, fixed once at mount (elastic root: the
                // host box decides the resolution).
                var dpr = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
                var box = root.getBoundingClientRect();
                var cssW = Math.max(1, Math.round(box.width) || 640);
                var cssH = Math.max(1, Math.round(box.height) || 360);
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                var ctx = canvas.getContext("2d");

                // Resolve the accent token to a concrete color once at mount so
                // canvas fills never depend on style recalc during seeks.
                var probe = hostDoc.createElement("span");
                probe.style.color = accentColors[accent];
                root.appendChild(probe);
                var maskColor = getComputedStyle(probe).color || "#71f5a7";
                probe.remove();

                // Seeded region table: geometry jitter + per-region flood
                // quantum (2 or 3 frames) + scanline row count. Computed once;
                // painted frames are pure functions of (table, time).
                var regions = (function () {
                  var state = 0x5e6f100d;
                  function next() {
                    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
                    return state / 4294967296;
                  }
                  var rows = [];
                  for (var i = 0; i < labels.length; i += 1) {
                    var a = anchors[i];
                    rows.push({
                      x: a.x + (next() - 0.5) * 0.02,
                      y: a.y + (next() - 0.5) * 0.02,
                      w: a.w * (0.94 + next() * 0.1),
                      h: a.h * (0.94 + next() * 0.1),
                      start: floodAt + STAGGER * i,
                      quantum: next() < 0.5 ? 2 : 3,
                      rows: 11 + Math.floor(next() * 4),
                    });
                  }
                  return rows;
                })();

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }

                // Pure repaint: clear, then draw every mask's arrived rows and
                // the flicker wash from (table, t). Row arrival quantizes time
                // to the region's frame quantum, so rows land whole and hold
                // stable within a step.
                function paint(t) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  for (var i = 0; i < regions.length; i += 1) {
                    var r = regions[i];
                    var local = t - r.start;
                    if (local <= 0) continue;
                    var q = r.quantum / fps;
                    var quantized = Math.floor(local / q) * q;
                    var p = clamp01(quantized / REGION_DUR);
                    var visible = Math.min(r.rows, Math.floor(p * r.rows + 1e-6));
                    if (visible <= 0) continue;
                    var rx = r.x * canvas.width;
                    var rw = r.w * canvas.width;
                    var rowH = (r.h * canvas.height) / r.rows;
                    for (var k = 0; k < visible; k += 1) {
                      var leading = k === visible - 1 && visible < r.rows;
                      ctx.globalAlpha = leading ? 0.55 : 0.3;
                      ctx.fillStyle = maskColor;
                      // A hairline gap between rows keeps the scanline texture.
                      ctx.fillRect(
                        rx,
                        r.y * canvas.height + k * rowH,
                        rw,
                        Math.max(1, rowH - Math.max(1, dpr)),
                      );
                    }
                  }
                  // HUD flicker: pure function of the frame index, active only
                  // while the flood is in flight, gone the instant it settles.
                  if (flicker && t > floodAt && t < floodEnd) {
                    var frame = Math.floor(t * fps);
                    if (Math.floor(frame / 2) % 2 === 1) {
                      ctx.globalAlpha = 0.05;
                      ctx.fillStyle = "#ffffff";
                      ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                  }
                  ctx.globalAlpha = 1;
                }

                // Brackets + chips: DOM, positioned from the seeded table.
                var frames = [];
                var chips = [];
                for (var i = 0; i < regions.length; i += 1) {
                  var r = regions[i];
                  var frameEl = hostDoc.createElement("div");
                  frameEl.className = "sgf-frame";
                  frameEl.style.left = r.x * 100 + "%";
                  frameEl.style.top = r.y * 100 + "%";
                  frameEl.style.width = r.w * 100 + "%";
                  frameEl.style.height = r.h * 100 + "%";
                  ["tl", "tr", "bl", "br"].forEach(function (corner) {
                    var c = hostDoc.createElement("span");
                    c.className = "sgf-corner " + corner;
                    frameEl.appendChild(c);
                  });
                  overlay.appendChild(frameEl);
                  frames.push(frameEl);

                  var chip = hostDoc.createElement("div");
                  chip.className = "sgf-chip";
                  chip.style.left = r.x * 100 + "%";
                  // Chips sit above the region; bottom rows drop them inside
                  // the top edge so nothing leaves the stage.
                  if (r.y > 0.08) {
                    chip.style.top = "calc(" + r.y * 100 + "% - 3.9cqmin)";
                  } else {
                    chip.style.top = "calc(" + r.y * 100 + "% + 1cqmin)";
                  }
                  var dot = hostDoc.createElement("span");
                  dot.className = "sgf-chip-dot";
                  chip.appendChild(dot);
                  chip.appendChild(hostDoc.createTextNode(labels[i]));
                  overlay.appendChild(chip);
                  chips.push(chip);
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });
                gsap.set(subject, { opacity: 0 });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    paint(tl.time());
                  },
                });

                // Anchor tween: an inert plain-object tween spanning the full
                // authored duration so tl.time() covers [0, D] and onUpdate
                // repaints the canvas on every eventful seek.
                tl.to({ p: 0 }, { p: 1, duration: duration, ease: "none" }, 0);

                // IN: the subject settles up quietly before the read begins.
                tl.fromTo(
                  subject,
                  { opacity: 0 },
                  { opacity: 1, duration: 0.5, ease: "power2.out" },
                  0,
                );

                // Each region's bracket + chip land as its mask completes.
                for (var i = 0; i < regions.length; i += 1) {
                  var done = regions[i].start + REGION_DUR;
                  tl.fromTo(
                    frames[i],
                    { opacity: 0 },
                    { opacity: 1, duration: 0.22, ease: "power2.out" },
                    done - 0.16,
                  );
                  tl.fromTo(
                    chips[i],
                    { opacity: 0, y: "0.8cqh" },
                    { opacity: 1, y: "0cqh", duration: CHIP_DUR, ease: "power2.out" },
                    done,
                  );
                }

                // HOLD: truly still; the flood is complete, the flicker window
                // is closed, and the canvas repaints the same settled read.

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                paint(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "regions", "type": "string", "role": "content", "label": "Regions", "description": "Comma-separated region labels; 2 to 4 are used, one translucent mask + bracket + mono chip each.", "default": "Figure, Signal, Ground" &#125;,
        &#123; "id": "flood_at", "type": "number", "role": "timing", "label": "Flood at", "description": "Seconds from mount start when the segmentation pass begins. Clamped so the pass and any exit stay inside the clip.", "default": 0.8 &#125;,
        &#123; "id": "flicker", "type": "enum", "role": "style", "label": "Flicker", "description": "Deterministic 2-frame HUD luminance toggle riding the flood pass.", "default": "on", "options": [&#123; "value": "on", "label": "On" &#125;, &#123; "value": "off", "label": "Off" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Mask, bracket, and chip color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the labeled read holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="segmentation-flood" data-duration="4.5" data-fps="30">
            
    
            <div
              id="segmentation-flood-clip"
              class="sgf-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="sgf-stage">
                <div class="sgf-subject">
                  <div class="sgf-scene" aria-hidden="true"></div>
                </div>
                <canvas class="sgf-canvas" aria-hidden="true"></canvas>
                <div class="sgf-overlay"></div>
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
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    pointer-events: none;
  }

  .sgf-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .sgf-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .sgf-subject {
    position: absolute;
    inset: 0;
    overflow: hidden;
    will-change: opacity;
  }

  .sgf-subject > img, .sgf-subject > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .sgf-scene {
    position: absolute;
    inset: 0;
    background: color-mix(in srgb, var(--surface, #14171c) 88%, var(--bg, #0b0c0e));
  }

  .sgf-shape {
    position: absolute;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 70%, transparent);
    border-radius: var(--radius, 2cqmin);
    background: color-mix(in srgb, var(--muted, #94a3b8) 16%, var(--surface, #14171c));
  }

  .sgf-shape.round {
    border-radius: 50%;
  }

  .sgf-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .sgf-overlay {
    position: absolute;
    inset: 0;
  }

  .sgf-frame {
    position: absolute;
    will-change: opacity;
  }

  .sgf-corner {
    position: absolute;
    width: 2.6cqmin;
    height: 2.6cqmin;
    border: 0 solid var(--sgf-accent);
  }

  .sgf-corner.tl {
    left: 0;
    top: 0;
    border-left-width: 0.28cqmin;
    border-top-width: 0.28cqmin;
  }

  .sgf-corner.tr {
    right: 0;
    top: 0;
    border-right-width: 0.28cqmin;
    border-top-width: 0.28cqmin;
  }

  .sgf-corner.bl {
    left: 0;
    bottom: 0;
    border-left-width: 0.28cqmin;
    border-bottom-width: 0.28cqmin;
  }

  .sgf-corner.br {
    right: 0;
    bottom: 0;
    border-right-width: 0.28cqmin;
    border-bottom-width: 0.28cqmin;
  }

  .sgf-chip {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 0.9cqmin;
    padding: 0.7cqmin 1.4cqmin;
    border: 0.14cqmin solid
    color-mix(in srgb, var(--sgf-accent) 60%, var(--border, #475569));
    border-radius: calc(var(--radius, 2cqmin) * 0.4);
    background: color-mix(in srgb, var(--bg, #0b0c0e) 78%, var(--sgf-accent));
    color: var(--fg, #f8fafc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace);
    font-size: 1.9cqmin;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    will-change: opacity, transform;
  }

  .sgf-chip-dot {
    width: 0.9cqmin;
    height: 0.9cqmin;
    border-radius: 50%;
    background: var(--sgf-accent);
  }
}
</style>
