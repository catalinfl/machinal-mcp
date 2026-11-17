<!-- Modified Svelte adaptation of registry/components/facet-morph/facet-morph.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

                var SVG_NS = "http://www.w3.org/2000/svg";
                var root = document.getElementById("root");
                // Literal id: mount flattening strips data-composition-id from the
                // live root before this timeline registers.
                var compositionId = "facet-morph";
                var stage = root.querySelector(".fm-stage");
                var mesh = root.querySelector(".fm-mesh");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                /* ---------------- variables ---------------- */

                var accentTokens = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentTokens, vars.accent)
                  ? vars.accent
                  : "green";
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable can shadow the contract
                // --accent token ("blue" is a valid CSS color). When the shadow is
                // present, fall back to the literal contract value.
                var shadowedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  shadowedAccent === "green" ||
                  shadowedAccent === "blue" ||
                  shadowedAccent === "violet"
                ) {
                  accentTokens.blue = "#38bdf8";
                }

                var holdLast = !(vars.hold_last === false || vars.hold_last === "false");
                // INVARIANT: only none | fade | up reaches the timeline.
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                /* ---------------- authored keyframe tables ----------------
                   Each silhouette is one row set: 18 outer radii, 18 outer
                   angular jitters (deg), 9 inner radii, 9 inner jitters (deg),
                   a center, and a whole-mass rotation (deg). Angles are fixed
                   spokes (outer every 20deg, inner every 40deg offset 20deg,
                   both starting at 12 o'clock), so any two rows interpolate
                   vertex-for-vertex. */

                var FORMS = {
                  // Irregular craggy rock, the reference's opening mass.
                  blob: {
                    outerR: [34, 39, 31, 36, 41, 33, 29, 37, 40, 32, 35, 30, 38, 34, 28, 36, 39, 33],
                    outerJ: [3, -5, 6, -2, 4, -6, 2, 5, -4, 3, -3, 6, -5, 2, 4, -2, -6, 5],
                    innerR: [16, 19, 14, 20, 17, 13, 18, 15, 19],
                    innerJ: [8, -10, 12, -6, 9, -12, 7, 11, -8],
                    cx: 50,
                    cy: 51,
                    rot: 0,
                  },
                  // A peaked asymmetric shard, the reference's closing frames.
                  mark: {
                    outerR: [48, 40, 28, 22, 19, 17, 16, 17, 19, 21, 23, 22, 19, 17, 19, 25, 34, 44],
                    outerJ: [-2, 6, -8, 4, -3, 5, -6, 2, 4, -5, 3, -4, 6, -2, 5, -7, 3, -4],
                    innerR: [20, 13, 10, 8, 9, 8, 10, 11, 15],
                    innerJ: [-6, 9, -11, 7, -8, 10, -7, 6, -9],
                    cx: 50,
                    cy: 56,
                    rot: -7,
                  },
                  // A wide-shouldered shield settling toward a point.
                  badge: {
                    outerR: [36, 37, 35, 34, 33, 30, 27, 25, 24, 33, 24, 25, 27, 30, 33, 34, 35, 37],
                    outerJ: [0, 2, -2, 1, -1, 2, -2, 1, 3, 0, -3, -1, 2, -2, 1, -1, 2, -2],
                    innerR: [18, 17, 16, 13, 12, 12, 13, 16, 17],
                    innerJ: [4, -5, 6, -4, 5, -6, 4, -5, 6],
                    cx: 50,
                    cy: 49,
                    rot: 5,
                  },
                };

                var requested = String(vars.forms == null ? "" : vars.forms)
                  .split(",")
                  .map(function (name) {
                    return name.trim().toLowerCase();
                  })
                  .filter(function (name) {
                    return Object.prototype.hasOwnProperty.call(FORMS, name);
                  });
                var formNames = requested.length > 0 ? requested : ["blob", "mark", "badge"];
                var formRows = formNames.map(function (name) {
                  return FORMS[name];
                });

                /* ---------------- fixed-seed facet tables ----------------
                   Wobble phases and per-facet tilts come from one LCG baked at
                   mount. Same seed, same mesh, every mount. */

                var OUTER = 18;
                var INNER = 9;
                var lcgState = 0x0f4c37ed;
                function lcg() {
                  lcgState = (Math.imul(1664525, lcgState) + 1013904223) >>> 0;
                  return lcgState / 4294967296;
                }
                var outerPhase = [];
                for (var i = 0; i < OUTER; i += 1) outerPhase.push(lcg());
                var innerPhase = [];
                for (var j = 0; j < INNER; j += 1) innerPhase.push(lcg());

                /* Triangulation: for each inner vertex j, spokes a=2j, b=2j+1,
                   c=2j+2 close the outer ring band (27 triangles), then the
                   inner ring fans to the center (9 triangles). 36 facets. */
                var facets = [];
                for (var k = 0; k < INNER; k += 1) {
                  var a = 2 * k;
                  var b = 2 * k + 1;
                  var c = (2 * k + 2) % OUTER;
                  facets.push(["o", a, "o", b, "i", k]);
                  facets.push(["o", b, "o", c, "i", k]);
                  facets.push(["o", c, "i", k, "i", (k + 1) % INNER]);
                }
                for (var f = 0; f < INNER; f += 1) {
                  facets.push(["i", f, "i", (f + 1) % INNER, "c", 0]);
                }
                var facetTilt = facets.map(function () {
                  return (lcg() - 0.5) * 0.62;
                });

                var polygons = facets.map(function () {
                  var polygon = document.createElementNS(SVG_NS, "polygon");
                  mesh.appendChild(polygon);
                  return polygon;
                });

                /* ---------------- token color resolution ----------------
                   Resolve contract tokens to concrete rgb once at mount via a
                   probe element, then mix numerically. Facet fills are literal
                   rgb() attribute strings; no var() ever reaches a tween. */

                var probe = document.createElement("span");
                probe.style.display = "none";
                root.appendChild(probe);
                function resolveColor(cssColor, fallback) {
                  probe.style.color = fallback;
                  probe.style.color = cssColor;
                  var raw = getComputedStyle(probe).color;
                  var match = raw.match(/rgba?\(([^)]+)\)/);
                  if (!match) return [128, 128, 128];
                  var parts = match[1].split(/[,\s/]+/).map(Number);
                  return [parts[0] || 0, parts[1] || 0, parts[2] || 0];
                }
                var fgRgb = resolveColor("var(--fg, #f8fafc)", "#f8fafc");
                var surfaceRgb = resolveColor("var(--surface, #14171c)", "#14171c");
                var accentRgb = resolveColor(accentTokens[accent], "#22c55e");
                probe.remove();

                function mix(colorA, colorB, amount) {
                  var w = Math.max(0, Math.min(1, amount));
                  return [
                    colorA[0] + (colorB[0] - colorA[0]) * w,
                    colorA[1] + (colorB[1] - colorA[1]) * w,
                    colorA[2] + (colorB[2] - colorA[2]) * w,
                  ];
                }
                function rgbString(color) {
                  return (
                    "rgb(" +
                    Math.round(color[0]) +
                    "," +
                    Math.round(color[1]) +
                    "," +
                    Math.round(color[2]) +
                    ")"
                  );
                }

                // Base mass tone contrasts the background on light and dark
                // hosts alike (fg-heavy). Lit facets climb toward a pale
                // accent-tinted white; shadow facets fall toward black.
                var baseRgb = mix(fgRgb, surfaceRgb, 0.24);
                var litTarget = mix([255, 255, 255], accentRgb, 0.2);
                var darkTarget = [8, 9, 11];

                /* ---------------- envelope ---------------- */

                var ENTER_BASE = 0.55;
                var LEG_BASE = 1.45;
                var DWELL_BASE = 0.35;
                var DECAY_BASE = 0.55;
                var steps = Math.max(0, formRows.length - 1);
                var MORPH_BASE = steps > 0 ? steps * LEG_BASE + (steps - 1) * DWELL_BASE : 0;
                var IN_BASE = ENTER_BASE + MORPH_BASE + DECAY_BASE;
                var OUT_BASE = exit === "none" ? 0 : 0.45;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var totalBase = IN_BASE + OUT_BASE;
                var envScale = duration < totalBase ? duration / totalBase : 1;
                var ENTER = ENTER_BASE * envScale;
                var LEG = LEG_BASE * envScale;
                var DWELL = DWELL_BASE * envScale;
                var DECAY = DECAY_BASE * envScale;
                var IN = IN_BASE * envScale;
                var OUT = OUT_BASE * envScale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var MORPH_START = ENTER * 0.55;
                var MORPH_END = MORPH_START + (MORPH_BASE > 0 ? MORPH_BASE * envScale : 0);
                var DECAY_END = MORPH_END + DECAY;

                /* ---------------- pure functions of time ---------------- */

                function smooth(s) {
                  // sine in-out, the quiet register's ease.
                  return 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, s)));
                }

                // Form progress p(t): one leg per silhouette step with a dwell
                // between legs, then (hold_last false) an endless slow breath
                // between the last two silhouettes. Continuous everywhere.
                function progressAt(t) {
                  if (steps === 0) return 0;
                  if (t <= MORPH_START) return 0;
                  var local = t - MORPH_START;
                  var span = LEG + DWELL;
                  for (var s = 0; s < steps; s += 1) {
                    var legStart = s * span;
                    if (local < legStart + LEG) {
                      return s + smooth((local - legStart) / LEG);
                    }
                    if (local < legStart + span) return s + 1;
                  }
                  if (holdLast || steps < 1) return steps;
                  // Breathe between the final two forms: depth 0.45, 6s period,
                  // starting and ending each cycle exactly on the final form.
                  var breathe = t - MORPH_END;
                  return steps - 0.45 * (0.5 - 0.5 * Math.cos((2 * Math.PI * breathe) / 6));
                }

                // Wobble amplitude a(t): ramps in with the entrance, then decays
                // to zero before the hold when hold_last is true.
                function wobbleAmpAt(t) {
                  var ramp = smooth(t / Math.max(0.001, ENTER));
                  if (!holdLast) return ramp;
                  if (t <= MORPH_END) return ramp;
                  return ramp * (1 - smooth((t - MORPH_END) / Math.max(0.001, DECAY)));
                }

                var WOBBLE_R = 1.6; // radial wobble, viewBox units
                var WOBBLE_HZ = 0.42;

                function lerp(valueA, valueB, w) {
                  return valueA + (valueB - valueA) * w;
                }

                // Light arrives from the upper left.
                var LIGHT_X = -0.62;
                var LIGHT_Y = -0.78;

                var outerPts = [];
                for (var oi = 0; oi < OUTER; oi += 1) outerPts.push([0, 0]);
                var innerPts = [];
                for (var ii = 0; ii < INNER; ii += 1) innerPts.push([0, 0]);
                var centerPt = [50, 50];

                function render(t) {
                  var p = progressAt(t);
                  var kA = Math.max(0, Math.min(formRows.length - 1, Math.floor(p)));
                  var kB = Math.min(formRows.length - 1, kA + 1);
                  var w = Math.max(0, Math.min(1, p - kA));
                  var rowA = formRows[kA];
                  var rowB = formRows[kB];
                  var amp = wobbleAmpAt(t) * WOBBLE_R;
                  var cx = lerp(rowA.cx, rowB.cx, w);
                  var cy = lerp(rowA.cy, rowB.cy, w);
                  var rot = (lerp(rowA.rot, rowB.rot, w) * Math.PI) / 180;

                  for (var o = 0; o < OUTER; o += 1) {
                    var wobO = amp * Math.sin(2 * Math.PI * (WOBBLE_HZ * t + outerPhase[o]));
                    var radO = lerp(rowA.outerR[o], rowB.outerR[o], w) + wobO;
                    var angO =
                      ((-90 + o * 20 + lerp(rowA.outerJ[o], rowB.outerJ[o], w)) * Math.PI) / 180 + rot;
                    outerPts[o][0] = cx + radO * Math.cos(angO);
                    outerPts[o][1] = cy + radO * Math.sin(angO);
                  }
                  for (var n = 0; n < INNER; n += 1) {
                    var wobI = amp * 0.7 * Math.sin(2 * Math.PI * (WOBBLE_HZ * t + innerPhase[n]));
                    var radI = lerp(rowA.innerR[n], rowB.innerR[n], w) + wobI;
                    var angI =
                      ((-70 + n * 40 + lerp(rowA.innerJ[n], rowB.innerJ[n], w)) * Math.PI) / 180 + rot;
                    innerPts[n][0] = cx + radI * Math.cos(angI);
                    innerPts[n][1] = cy + radI * Math.sin(angI);
                  }
                  centerPt[0] = cx;
                  centerPt[1] = cy + amp * 0.4 * Math.sin(2 * Math.PI * (WOBBLE_HZ * t + 0.31));

                  for (var fi = 0; fi < facets.length; fi += 1) {
                    var facet = facets[fi];
                    var pts = "";
                    var sumX = 0;
                    var sumY = 0;
                    for (var v = 0; v < 3; v += 1) {
                      var kind = facet[v * 2];
                      var index = facet[v * 2 + 1];
                      var pt =
                        kind === "o" ? outerPts[index] : kind === "i" ? innerPts[index] : centerPt;
                      pts += pt[0].toFixed(2) + "," + pt[1].toFixed(2) + (v < 2 ? " " : "");
                      sumX += pt[0];
                      sumY += pt[1];
                    }
                    var nx = sumX / 3 - cx;
                    var ny = sumY / 3 - cy;
                    var len = Math.hypot(nx, ny) || 1;
                    // Pseudo-normal: outward direction plus the facet's fixed
                    // tilt. Facets turned toward the upper-left light lift.
                    var shade = (nx / len) * LIGHT_X + (ny / len) * LIGHT_Y + facetTilt[fi];
                    shade = Math.max(-1, Math.min(1, shade));
                    var fill =
                      shade >= 0
                        ? mix(baseRgb, litTarget, shade * 0.85)
                        : mix(baseRgb, darkTarget, -shade * 0.78);
                    var fillString = rgbString(fill);
                    var polygon = polygons[fi];
                    polygon.setAttribute("points", pts);
                    polygon.setAttribute("fill", fillString);
                    polygon.setAttribute("stroke", fillString);
                  }
                }

                /* ---------------- timeline ---------------- */

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                gsap.set(stage, { opacity: 0, scale: 0.94, y: 0 });
                render(0);

                var tl = gsap.timeline({ paused: true });

                // ONE linear driver owns every vertex and every fill; render is a
                // pure function of the driver's time.
                var driver = { t: 0 };
                tl.fromTo(
                  driver,
                  { t: 0 },
                  {
                    t: duration,
                    duration: duration,
                    ease: "none",
                    onUpdate: function () {
                      render(driver.t);
                    },
                  },
                  0,
                );

                // IN: quiet entrance while the wobble ramps up.
                tl.to(stage, { opacity: 1, duration: ENTER, ease: "power2.out" }, 0);
                tl.to(stage, { scale: 1, duration: ENTER * 1.4, ease: "power2.out" }, 0);

                tl.call(
                  function () {
                    fireSfx("facet-settle-soft", MORPH_END);
                  },
                  [],
                  MORPH_END,
                );

                // HOLD: still (hold_last true) or the slow breath, both inside
                // the driver's pure function. No extra tweens.

                // OUT: only when the exit variable asks for one.
                if (exit !== "none") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(stage, { y: "-6cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  }
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
        &#123; "id": "forms", "type": "string", "role": "content", "label": "Forms", "description": "Comma-separated silhouette sequence from blob, mark, badge.", "default": "blob,mark,badge" &#125;,
        &#123; "id": "hold_last", "type": "boolean", "role": "timing", "label": "Hold last", "description": "True settles dead still on the final silhouette; false keeps the mass slowly breathing through the hold.", "default": true &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Tint of the lit facets.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. None holds the settled mass.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5" data-composition-id="facet-morph" data-duration="5" data-fps="30">
            
    
            <div
              id="facet-morph-clip"
              class="fm-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <div class="fm-stage">
                <svg
                  class="fm-svg"
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label="Reshaping faceted mass"
                >
                  <g class="fm-mesh"></g>
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
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .fm-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  /* A very soft stage vignette keeps the mass grounded on flat
  token backgrounds without inventing a light band (that is
    light-sweep-pass territory). */
  .fm-clip::before {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 42% 38%,
      color-mix(in srgb, var(--fg, #f8fafc) 4%, transparent) 0%,
      transparent 68%
    );
  }

  .fm-stage {
    display: grid;
    place-items: center;
    width: 100%;
    height: 100%;
    will-change: transform, opacity;
  }

  .fm-svg {
    width: 74cqmin;
    height: 74cqmin;
    overflow: visible;
  }

  .fm-svg polygon {
    stroke-width: 0.22;
    stroke-linejoin: round;
  }
}
</style>
