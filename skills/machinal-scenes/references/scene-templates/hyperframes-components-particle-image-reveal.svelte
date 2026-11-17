<!-- Modified Svelte adaptation of registry/components/particle-image-reveal/particle-image-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".pir-stage");
                var imageLayer = root.querySelector(".pir-image");
                var canvas = root.querySelector(".pir-canvas");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var densityCounts = { low: 320, med: 640, high: 1100 };
                var density = Object.prototype.hasOwnProperty.call(densityCounts, vars.density)
                  ? vars.density
                  : "med";
                var direction = vars.direction === "center" ? "center" : "ltr";
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--pir-accent", accentColors[accent]);

                // SLOT. Caller templates live at HOST DOCUMENT level (the mount
                // wipes host-clip children, and templates never render). The
                // scoped document proxy filters queries to this composition's
                // subtree, so the lookup deliberately goes through ownerDocument.
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector(
                    'template[data-slot="particle-image-reveal-image"]',
                  );
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  imageLayer.querySelector(".pir-monogram").remove();
                  imageLayer.appendChild(hostDoc.importNode(slotTemplate.content, true));
                }

                // Envelope: fixed IN/OUT, elastic HOLD, never time-scaled.
                var IN_BASE = 2.8;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                // Canvas raster basis is fixed once at mount. Elastic root: the
                // host box decides the resolution; the same host always yields
                // the same raster, so painted frames stay byte-stable.
                var dpr = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
                var box = root.getBoundingClientRect();
                var cssW = Math.max(1, Math.round(box.width) || 640);
                var cssH = Math.max(1, Math.round(box.height) || 360);
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                var ctx = canvas.getContext("2d");
                var minDim = Math.min(canvas.width, canvas.height);

                // Resolve the accent token to a concrete color once at mount so
                // canvas fills never depend on style recalc during seeks.
                var probe = hostDoc.createElement("span");
                probe.style.color = accentColors[accent];
                root.appendChild(probe);
                var particleColor = getComputedStyle(probe).color || "#71f5a7";
                probe.remove();

                // The LCG and every per-particle decision live here. This IIFE
                // runs once before timeline construction, then only the table is
                // read. Particle state at any time is a pure function of
                // (table row, timeline time).
                var COUNT = densityCounts[density];
                var particles = (function () {
                  var state = 0x50a71c1e;
                  function next() {
                    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
                    return state / 4294967296;
                  }
                  var rows = [];
                  for (var i = 0; i < COUNT; i += 1) {
                    var tx = next();
                    var ty = next();
                    var key =
                      direction === "center"
                        ? Math.min(1, Math.hypot(tx - 0.5, ty - 0.5) / 0.7071)
                        : tx;
                    // Arrival and birth are fractions of IN. Arrivals sweep with
                    // the reveal front; every fade completes by p = 1 exactly.
                    var arrive = 0.24 + 0.66 * key + 0.04 * next();
                    var travel = 0.2 + 0.12 * next();
                    var fade = 0.05 + 0.04 * next();
                    var angle;
                    if (direction === "center") {
                      // Converge inward: start displaced radially outward.
                      angle = Math.atan2(ty - 0.5, tx - 0.5);
                      if (tx === 0.5 && ty === 0.5) angle = next() * Math.PI * 2;
                    } else {
                      // Fly in from the left, within a 90 degree cone.
                      angle = Math.PI + (next() - 0.5) * (Math.PI / 2);
                    }
                    rows.push({
                      tx: tx,
                      ty: ty,
                      arrive: Math.min(0.94, arrive),
                      birth: Math.max(0, arrive - travel),
                      fade: fade,
                      offset: (0.06 + 0.14 * next()) * minDim,
                      ox: Math.cos(angle),
                      oy: Math.sin(angle),
                      radius: (0.28 + 0.62 * next()) * (minDim / 100),
                      dim: 0.55 + 0.45 * next(),
                    });
                  }
                  return rows;
                })();

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }

                // Pure repaint: clear, then draw every particle from (row, p).
                function paint(timeSeconds) {
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  var p = IN > 0 ? clamp01(timeSeconds / IN) : 1;
                  // Global end clamp: the whole field is gone exactly at p = 1,
                  // and the trail thins as the reveal completes.
                  var endClamp = clamp01((1 - p) / 0.05);
                  if (endClamp === 0) return;
                  var thin = 1 - 0.4 * clamp01((p - 0.72) / 0.28);
                  ctx.fillStyle = particleColor;
                  for (var i = 0; i < particles.length; i += 1) {
                    var row = particles[i];
                    var u = clamp01((p - row.birth) / (row.arrive - row.birth));
                    if (u <= 0) continue;
                    var settled = clamp01((p - row.arrive) / row.fade);
                    var alpha = clamp01(u / 0.14) * (1 - settled) * endClamp * thin * row.dim * 0.92;
                    if (alpha <= 0.002) continue;
                    var e = 1 - Math.pow(1 - u, 3);
                    var x = row.tx * canvas.width + row.ox * row.offset * (1 - e);
                    var y = row.ty * canvas.height + row.oy * row.offset * (1 - e);
                    var r = row.radius * dpr * (0.6 + 0.4 * (1 - settled));
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.arc(x, y, r, 0, Math.PI * 2);
                    ctx.fill();
                  }
                  ctx.globalAlpha = 1;
                }

                // Image reveal geometry follows the particle sweep.
                var clipFrom =
                  direction === "center" ? "circle(0% at 50% 50%)" : "inset(0% 100% 0% 0%)";
                var clipTo = direction === "center" ? "circle(75% at 50% 50%)" : "inset(0% 0% 0% 0%)";

                gsap.set(stage, { opacity: 1, y: "0cqh" });
                gsap.set(imageLayer, { opacity: 0, clipPath: clipFrom });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    paint(tl.time());
                  },
                });

                // Anchor tween: an inert plain-object tween spanning the full
                // authored duration. Without it the timeline would end at the
                // last DOM tween (2.69s) and seeks into the hold would clamp
                // tl.time() below IN, freezing the particle field short of its
                // authored zero. It also guarantees onUpdate fires (and the
                // canvas repaints) for every eventful seek anywhere in [0, D].
                tl.to({ p: 0 }, { p: 1, duration: duration, ease: "none" }, 0);

                // IN: the image fades up beneath the particles and reveals along
                // the same front the arrivals sweep. Both endpoints authored.
                tl.fromTo(
                  imageLayer,
                  { opacity: 0 },
                  { opacity: 1, duration: IN * 0.42, ease: "power2.out" },
                  IN * 0.18,
                );
                tl.fromTo(
                  imageLayer,
                  { clipPath: clipFrom },
                  { clipPath: clipTo, duration: IN * 0.74, ease: "power2.inOut" },
                  IN * 0.22,
                );

                // HOLD: truly still, deliberately. Fractional transform drift
                // re-rasters the slot/canvas layer at history-dependent subpixel
                // offsets and breaks byte-identical seeks (the K1 cq-transform
                // trap); the reveal supplies the life, the hold supplies calm.

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
        &#123; "id": "density", "type": "enum", "role": "style", "label": "Density", "description": "Particle count for the converging field.", "default": "med", "options": [&#123; "value": "low", "label": "Low" &#125;, &#123; "value": "med", "label": "Medium" &#125;, &#123; "value": "high", "label": "High" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "timing", "label": "Direction", "description": "ltr sweeps the reveal left to right; center opens an iris from the middle outward.", "default": "ltr", "options": [&#123; "value": "ltr", "label": "Left to right" &#125;, &#123; "value": "center", "label": "Center out" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Particle and monogram color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the revealed image holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="particle-image-reveal" data-duration="4" data-fps="30">
            
    
            <div
              id="particle-image-reveal-clip"
              class="pir-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="pir-stage">
                <div class="pir-image">
                  <div class="pir-monogram">
                    <span class="pir-monogram-glyph" aria-hidden="true">H</span>
                  </div>
                </div>
                <canvas class="pir-canvas" aria-hidden="true"></canvas>
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

  .pir-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .pir-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .pir-image {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    will-change: clip-path, opacity;
  }

  .pir-image > img, .pir-image > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .pir-monogram {
    display: grid;
    place-items: center;
    width: 52cqmin;
    height: 52cqmin;
    border: 0.18cqmin solid
    color-mix(in srgb, var(--pir-accent) 52%, var(--border, #475569));
    border-radius: var(--radius, 3cqmin);
    background: color-mix(in srgb, var(--surface, #14171c) 90%, var(--pir-accent));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 40%, transparent);
  }

  .pir-monogram-glyph {
    color: var(--pir-accent);
    font-size: 26cqmin;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
  }

  .pir-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
