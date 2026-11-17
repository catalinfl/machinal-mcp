<!-- Modified Svelte adaptation of registry/components/halftone-dissolve/halftone-dissolve.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".htd-stage");
                var sceneA = root.querySelector(".htd-scene-a");
                var sceneB = root.querySelector(".htd-scene-b");
                var canvas = root.querySelector(".htd-ink");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function num(value, fallback, min, max) {
                  var n = Number(value);
                  if (!isFinite(n)) n = fallback;
                  return Math.max(min, Math.min(max, n));
                }

                var dotSize =
                  vars.dot_size === "small" || vars.dot_size === "large" ? vars.dot_size : "medium";
                var direction =
                  vars.direction === "center" || vars.direction === "noise" ? vars.direction : "ltr";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
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
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable shadows the contract
                // --accent token inside the subtree ("blue" is a valid CSS color
                // and would render pure blue). When the shadow is present, fall
                // back to the literal contract value instead of var(--accent).
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentColors.blue = "#61a8ff";
                }
                root.style.setProperty("--htd-accent", accentColors[accent]);

                // SLOTS. Caller templates live at HOST DOCUMENT level (the mount
                // wipes host-clip children, and templates never render).
                var hostDoc = root.ownerDocument;
                function fillSlot(scene, slotName) {
                  var slotTemplate = null;
                  try {
                    slotTemplate = hostDoc.querySelector('template[data-slot="' + slotName + '"]');
                  } catch (error) {
                    slotTemplate = null;
                  }
                  if (slotTemplate) {
                    scene.querySelector(".htd-tile").remove();
                    scene.appendChild(hostDoc.importNode(slotTemplate.content, true));
                  }
                }
                fillSlot(sceneA, "halftone-dissolve-a");
                fillSlot(sceneB, "halftone-dissolve-b");

                // Envelope.
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var OUT = exit === "none" ? 0 : 0.45;
                var DISSOLVE = Math.min(1.3, Math.max(0.4, duration - OUT - 0.6));
                var maxAt = Math.max(0.2, duration - DISSOLVE - OUT - 0.05);
                var dissolveAt = num(vars.dissolve_at, 1.1, 0.2, maxAt);
                var OUT_START = duration - OUT;

                // Raster and clip-path basis, fixed once at mount.
                var dpr = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
                var box = root.getBoundingClientRect();
                var cssW = Math.max(1, Math.round(box.width) || 640);
                var cssH = Math.max(1, Math.round(box.height) || 360);
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                var ctx = canvas.getContext("2d");

                var probe = hostDoc.createElement("span");
                probe.style.color = accentColors[accent];
                root.appendChild(probe);
                var inkColor = getComputedStyle(probe).color || "#71f5a7";
                probe.remove();

                // The grid: fixed cells with alternate rows offset half a pitch
                // (the classic halftone stagger). Thresholds order the growth;
                // a seeded jitter keeps every front granular instead of ruled.
                var pitches = { small: 1 / 44, medium: 1 / 30, large: 1 / 20 };
                var cell = Math.max(8, cssW * pitches[dotSize]);
                var cols = Math.ceil(cssW / cell) + 2;
                var rows = Math.ceil(cssH / cell) + 1;
                var R_MAX = cell * 0.78; // overlapping full coverage
                var dots = (function () {
                  var state = 0x4a17f03d;
                  function next() {
                    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
                    return state / 4294967296;
                  }
                  var list = [];
                  var maxDist = Math.hypot(cssW / 2, cssH / 2);
                  for (var r = 0; r < rows; r += 1) {
                    for (var c = 0; c < cols; c += 1) {
                      var x = (c + (r % 2 === 0 ? 0.25 : 0.75)) * cell;
                      var y = (r + 0.5) * cell;
                      var base;
                      if (direction === "center") {
                        base = Math.hypot(x - cssW / 2, y - cssH / 2) / maxDist;
                      } else if (direction === "noise") {
                        base = next();
                      } else {
                        base = x / cssW;
                      }
                      var jitter = direction === "noise" ? 0 : (next() - 0.5) * 0.22;
                      var th = Math.max(0, Math.min(1, base + jitter));
                      list.push({ x: x, y: y, th: th * 0.62 });
                    }
                  }
                  return list;
                })();

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }
                function smooth(v) {
                  return v * v * (3 - 2 * v);
                }

                // Per-dot growth: the window opens over 38 percent of progress
                // after its threshold; the ink dot leads it by a small offset so
                // each site pops as accent ink before B fills it.
                function windowRadius(dot, p) {
                  return R_MAX * smooth(clamp01((p - dot.th) / 0.38));
                }
                function inkRadius(dot, p) {
                  return R_MAX * smooth(clamp01((p + 0.07 - dot.th) / 0.38));
                }

                // One progress object feeds one painter. The painter redraws the
                // ink canvas from scratch and rebuilds B's clip-path string, all
                // a pure function of P.p. The last applied clip string is cached
                // only to skip identical style writes, never to skip repaints of
                // changed frames.
                var P = { p: 0 };
                var lastClip = null;
                function applyClip(value) {
                  if (value !== lastClip) {
                    sceneB.style.clipPath = value;
                    lastClip = value;
                  }
                }
                function paint() {
                  var p = P.p;
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  if (p >= 1) {
                    applyClip("none");
                    return;
                  }
                  if (p <= 0) {
                    applyClip('path("M 0 0 Z")');
                    return;
                  }
                  ctx.fillStyle = inkColor;
                  var parts = [];
                  for (var i = 0; i < dots.length; i += 1) {
                    var dot = dots[i];
                    var ri = inkRadius(dot, p);
                    if (ri > 0.25) {
                      ctx.beginPath();
                      ctx.arc(dot.x * dpr, dot.y * dpr, ri * dpr, 0, Math.PI * 2);
                      ctx.fill();
                    }
                    var rw = windowRadius(dot, p);
                    if (rw > 0.25) {
                      var x0 = (dot.x + rw).toFixed(2);
                      var xr = rw.toFixed(2);
                      var yy = dot.y.toFixed(2);
                      parts.push(
                        "M " +
                          x0 +
                          " " +
                          yy +
                          " A " +
                          xr +
                          " " +
                          xr +
                          " 0 1 0 " +
                          (dot.x - rw).toFixed(2) +
                          " " +
                          yy +
                          " A " +
                          xr +
                          " " +
                          xr +
                          " 0 1 0 " +
                          x0 +
                          " " +
                          yy +
                          " Z",
                      );
                    }
                  }
                  applyClip(parts.length ? 'path("' + parts.join(" ") + '")' : 'path("M 0 0 Z")');
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: paint,
                });

                // Anchor tween: spans the full authored duration so onUpdate
                // (canvas + clip rebuild) fires for every eventful seek in [0, D]
                // and holds keep tl.time() honest.
                tl.to({ t: 0 }, { t: 1, duration: duration, ease: "none" }, 0);

                // The dissolve: one plain-object progress tween. power1.inOut
                // keeps the front unhurried at both ends (smallest-first pops,
                // unforced merge).
                tl.fromTo(P, { p: 0 }, { p: 1, duration: DISSOLVE, ease: "power1.inOut" }, dissolveAt);

                // HOLD: dead still on B (clip released, ink canvas clear).

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                paint();
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "dot_size", "type": "enum", "role": "style", "label": "Dot size", "description": "Grid pitch for the halftone field.", "default": "medium", "options": [&#123; "value": "small", "label": "Small" &#125;, &#123; "value": "medium", "label": "Medium" &#125;, &#123; "value": "large", "label": "Large" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "timing", "label": "Direction", "description": "Threshold ordering: ltr sweeps left to right, center grows from the middle, noise scatters.", "default": "ltr", "options": [&#123; "value": "ltr", "label": "Left to right" &#125;, &#123; "value": "center", "label": "Center out" &#125;, &#123; "value": "noise", "label": "Noise" &#125;] &#125;,
        &#123; "id": "dissolve_at", "type": "number", "role": "timing", "label": "Dissolve at", "description": "Seconds from mount start when the dissolve begins.", "default": 1.1, "min": 0.2, "max": 10, "step": 0.1, "unit": "s" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Ink dot color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: scene B holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="halftone-dissolve" data-duration="3.5" data-fps="30">
            
    
            <div
              id="halftone-dissolve-clip"
              class="htd-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="htd-stage">
                <div class="htd-scene htd-scene-a">
                  <div class="htd-tile" style="--htd-tile-tint: var(--muted, #94a3b8)">
                    <span class="htd-tile-glyph" aria-hidden="true">A</span>
                  </div>
                </div>
                <canvas class="htd-ink" aria-hidden="true"></canvas>
                <div class="htd-scene htd-scene-b">
                  <div class="htd-tile" style="--htd-tile-tint: var(--htd-accent, #71f5a7)">
                    <span class="htd-tile-glyph" aria-hidden="true">B</span>
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
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    pointer-events: none;
  }

  .htd-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .htd-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .htd-scene {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .htd-scene > img, .htd-scene > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .htd-scene-b {
    will-change: clip-path;
    /* B must be opaque: an open window that shows the ink canvas
    (or A) through a transparent incoming scene breaks the
    "B fully replaces A" contract for card-style slot content. */
    background: var(--bg, transparent);
  }

  .htd-ink {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .htd-tile {
    display: grid;
    place-items: center;
    width: 46cqmin;
    height: 46cqmin;
    border: 0.18cqmin solid
    color-mix(in srgb, var(--htd-tile-tint) 46%, var(--border, #475569));
    border-radius: var(--radius, 3cqmin);
    background: color-mix(in srgb, var(--surface, #14171c) 88%, var(--htd-tile-tint));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 35%, transparent);
  }

  .htd-tile-glyph {
    color: var(--htd-tile-tint);
    font-size: 22cqmin;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.02em;
  }
}
</style>
