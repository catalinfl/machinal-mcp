<!-- Modified Svelte adaptation of registry/components/telemetry-hud/telemetry-hud.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal id: mount flattening strips data-composition-id from the
                // live root before this timeline registers.
                var compositionId = "telemetry-hud";
                var stage = root.querySelector(".th-stage");
                var brackets = root.querySelectorAll(".th-bracket path");
                var corners = [
                  root.querySelector(".th-corner-tl"),
                  root.querySelector(".th-corner-tr"),
                  root.querySelector(".th-corner-bl"),
                  root.querySelector(".th-corner-br"),
                ];

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var readoutsRaw =
                  vars.readouts == null
                    ? "fps:59.94,latency:11.8 ms,gpu:38%,heap:1.2 GB"
                    : String(vars.readouts);
                var emphasizeRaw = Number(vars.emphasize);
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable shadows the contract
                // --accent token inside the subtree. When the shadow is present,
                // fall back to the literal contract value instead of var(--accent).
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentColors.blue = "#38bdf8";
                }
                root.style.setProperty("--th-accent", accentColors[accent]);

                // Parse "label:value" pairs; the FIRST colon splits, later colons
                // stay in the value. Cap at 8 (two per corner).
                var readouts = readoutsRaw
                  .split(",")
                  .map(function (pair) {
                    var i = pair.indexOf(":");
                    var label = (i < 0 ? pair : pair.slice(0, i)).trim();
                    var value = (i < 0 ? "" : pair.slice(i + 1)).trim();
                    return { label: label, value: value };
                  })
                  .filter(function (r) {
                    return r.label.length > 0;
                  })
                  .slice(0, 8);
                var emphasize = Number.isFinite(emphasizeRaw)
                  ? Math.min(Math.round(emphasizeRaw), readouts.length - 1)
                  : 0;

                var cueList = String(vars.cues == null ? "" : vars.cues)
                  .split(",")
                  .map(function (token) {
                    return parseFloat(token);
                  })
                  .filter(function (value) {
                    return isFinite(value) && value >= 0;
                  });

                // RETIME RANGE: fixed phases; HOLD is the only elastic span.
                var STAGE_IN = 0.45;
                var BRACKET_AT = 0.12;
                var BRACKET_DRAW = 0.5;
                var READ_IN_AT = 0.45;
                var TICK = 0.5;
                var STILLNESS = 0.25;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var OUT = Math.min(OUT_BASE, duration * 0.2);
                var OUT_START = duration - OUT;
                // Every tick must land before the stillness that precedes OUT.
                var lastCueMax = Math.max(READ_IN_AT, OUT_START - STILLNESS - TICK);

                // Fixed-seed LCG: the only randomness source, consumed in one
                // deterministic order during this synchronous build.
                var lcgState = 0x2c9277b5;
                function rnd() {
                  lcgState = (Math.imul(1664525, lcgState) + 1013904223) >>> 0;
                  return lcgState / 4294967296;
                }
                var DIGITS = "0123456789";
                var UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
                var LOWER = "abcdefghijklmnopqrstuvwxyz";
                function standIn(ch) {
                  if (DIGITS.indexOf(ch) >= 0) return DIGITS[Math.floor(rnd() * 10)];
                  if (UPPER.indexOf(ch) >= 0) return UPPER[Math.floor(rnd() * 26)];
                  if (LOWER.indexOf(ch) >= 0) return LOWER[Math.floor(rnd() * 26)];
                  return ch;
                }

                // Build DOM + one text-at-time table per readout, all at once.
                // The timeline only ever reads the tables, so seeks in any
                // direction resolve the same string for the same time.
                var STEPS = 8;
                var readElements = [];
                var valueElements = [];
                var tables = [];
                var tickEnd = READ_IN_AT;
                readouts.forEach(function (readout, index) {
                  var row = document.createElement("div");
                  row.className = "th-read" + (index === emphasize ? " th-em" : "");
                  var labelEl = document.createElement("span");
                  labelEl.className = "th-label";
                  labelEl.textContent = readout.label;
                  var valueEl = document.createElement("span");
                  valueEl.className = "th-value";
                  valueEl.textContent = "--";
                  row.appendChild(labelEl);
                  row.appendChild(valueEl);
                  corners[index % 4].appendChild(row);
                  readElements.push(row);
                  valueElements.push(valueEl);

                  var cue = cueList[index] != null ? cueList[index] : 1.0 + index * 0.28;
                  cue = Math.max(READ_IN_AT, Math.min(cue, lastCueMax));
                  var chars = Array.from(readout.value);
                  var rows = [{ t: 0, x: "--" }];
                  for (var step = 1; step <= STEPS; step += 1) {
                    var resolved =
                      step === STEPS ? chars.length : Math.floor((chars.length * step) / STEPS);
                    var out = "";
                    for (var k = 0; k < chars.length; k += 1) {
                      out += k < resolved ? chars[k] : standIn(chars[k]);
                    }
                    rows.push({ t: cue + (TICK * step) / STEPS, x: out });
                  }
                  tables.push(rows);
                  tickEnd = Math.max(tickEnd, cue + TICK);
                });

                // 1ms tolerance: GSAP snaps a tween's end value below the row
                // table's accumulated float times, far under one frame.
                function textAt(rows, time) {
                  for (var i = rows.length - 1; i >= 0; i -= 1) {
                    if (time >= rows[i].t - 0.001) return rows[i].x;
                  }
                  return rows[0].x;
                }

                gsap.set(stage, { opacity: 0, y: 0 });
                readElements.forEach(function (el) {
                  gsap.set(el, { opacity: 0 });
                });

                var tl = gsap.timeline({ paused: true });

                // IN: one stage fade; the subject never moves.
                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);

                // Brackets draw on: dasharray/dashoffset as ATTRIBUTES (a CSS
                // strokeDashoffset tween can leave stale paint under reverse
                // seeks), both endpoints explicit.
                brackets.forEach(function (path, index) {
                  var length = path.getTotalLength();
                  path.setAttribute("stroke-dasharray", String(length));
                  path.setAttribute("stroke-dashoffset", String(length));
                  tl.fromTo(
                    path,
                    { attr: { "stroke-dashoffset": length } },
                    {
                      attr: { "stroke-dashoffset": 0 },
                      duration: BRACKET_DRAW,
                      ease: "power2.inOut",
                      immediateRender: false,
                    },
                    BRACKET_AT + index * 0.08,
                  );
                });

                // Readout lines fade in staggered; opacity only, no movement.
                readElements.forEach(function (el, index) {
                  tl.fromTo(
                    el,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.35, ease: "power1.out", immediateRender: false },
                    READ_IN_AT + index * 0.07,
                  );
                });

                // One shared driver reads every table; single owner of all values.
                var driver = { t: 0 };
                tl.to(
                  driver,
                  {
                    t: tickEnd,
                    duration: tickEnd,
                    ease: "none",
                    onUpdate: function () {
                      for (var i = 0; i < valueElements.length; i += 1) {
                        valueElements[i].textContent = textAt(tables[i], driver.t);
                      }
                    },
                  },
                  0,
                );

                // HOLD: the HUD breathes zero. Completely still.

                // OUT: only when the exit variable asks for one.
                if (exit !== "none") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(stage, { y: "-5cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "readouts", "type": "string", "role": "content", "label": "Readouts", "description": "Comma-separated label:value pairs, up to 8. The first colon splits label from value.", "default": "fps:59.94,latency:11.8 ms,gpu:38%,heap:1.2 GB" &#125;,
        &#123; "id": "emphasize", "type": "number", "role": "style", "label": "Emphasize", "description": "Index of the readout rendered in the accent color. -1 disables.", "default": 0, "min": -1, "max": 7, "step": 1 &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds relative to mount start; cue N starts readout N value tick. Empty uses the authored rhythm.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color of the emphasized readout.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. Frame roots own transitions; none holds the end frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="telemetry-hud" data-duration="4.5" data-fps="30">
            
    
            <div
              id="telemetry-hud-clip"
              class="th-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="th-stage">
                <div class="th-subject">
                  <div class="th-slot" data-slot="subject">
                    
                    <div class="th-default" aria-hidden="true">
                      <div class="th-card">
                        <div class="th-bar"></div>
                        <div class="th-line"></div>
                        <div class="th-line"></div>
                        <div class="th-line"></div>
                      </div>
                    </div>
                  </div>
                </div>
    
                <svg class="th-bracket th-bracket-tl" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M 46 3 L 12 3 Q 3 3 3 12 L 3 46"></path>
                </svg>
                <svg class="th-bracket th-bracket-tr" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M 46 3 L 12 3 Q 3 3 3 12 L 3 46"></path>
                </svg>
                <svg class="th-bracket th-bracket-bl" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M 46 3 L 12 3 Q 3 3 3 12 L 3 46"></path>
                </svg>
                <svg class="th-bracket th-bracket-br" viewBox="0 0 48 48" aria-hidden="true">
                  <path d="M 46 3 L 12 3 Q 3 3 3 12 L 3 46"></path>
                </svg>
    
                <div class="th-corner th-corner-tl"></div>
                <div class="th-corner th-corner-tr"></div>
                <div class="th-corner th-corner-bl"></div>
                <div class="th-corner th-corner-br"></div>
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
    background: var(--bg, #07111f);
    color: var(--fg, #f8fafc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    pointer-events: none;
  }

  .th-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .th-stage {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    will-change: transform, opacity;
  }

  /* Framed subject: centered, static for the whole hold. */
  .th-subject {
    position: relative;
    width: 56cqw;
    height: 58cqh;
    overflow: hidden;
    border-radius: var(--radius, 2.4cqmin);
  }

  .th-slot, .th-slot > img, .th-slot > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .th-slot > img, .th-slot > video {
    object-fit: cover;
  }

  /* Token skeleton default; callers replacing slot children never
  see any of this. */
  .th-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    border: 0.16cqmin solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 90%, var(--bg, #07111f));
  }

  .th-card {
    width: 72%;
  }

  .th-bar {
    width: 38%;
    height: 4.6cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.55;
  }

  .th-line {
    height: 2.4cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.38;
  }

  .th-line:nth-of-type(2) {
    width: 88%;
  }

  .th-line:nth-of-type(3) {
    width: 64%;
  }

  .th-line:nth-of-type(4) {
    width: 42%;
  }

  /* Corner brackets: square-capped strokes, drawn via measured
  dasharray/dashoffset ATTRIBUTES set from script. */
  .th-bracket {
    position: absolute;
    width: 8cqmin;
    height: 8cqmin;
    overflow: visible;
  }

  .th-bracket path {
    fill: none;
    stroke: color-mix(in srgb, var(--fg, #f8fafc) 62%, transparent);
    stroke-width: 3;
    stroke-linecap: butt;
  }

  .th-bracket-tl {
    top: var(--space-2, 2.4cqmin);
    left: var(--space-2, 2.4cqmin);
  }

  .th-bracket-tr {
    top: var(--space-2, 2.4cqmin);
    right: var(--space-2, 2.4cqmin);
    transform: scaleX(-1);
  }

  .th-bracket-bl {
    bottom: var(--space-2, 2.4cqmin);
    left: var(--space-2, 2.4cqmin);
    transform: scaleY(-1);
  }

  .th-bracket-br {
    bottom: var(--space-2, 2.4cqmin);
    right: var(--space-2, 2.4cqmin);
    transform: scale(-1, -1);
  }

  /* Readout groups sit just inside each bracket. */
  .th-corner {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 0.9cqmin;
  }

  .th-corner-tl {
    top: calc(var(--space-2, 2.4cqmin) + 1cqmin);
    left: calc(var(--space-2, 2.4cqmin) + 9.6cqmin);
  }

  .th-corner-tr {
    top: calc(var(--space-2, 2.4cqmin) + 1cqmin);
    right: calc(var(--space-2, 2.4cqmin) + 9.6cqmin);
    align-items: flex-end;
  }

  .th-corner-bl {
    bottom: calc(var(--space-2, 2.4cqmin) + 1cqmin);
    left: calc(var(--space-2, 2.4cqmin) + 9.6cqmin);
  }

  .th-corner-br {
    bottom: calc(var(--space-2, 2.4cqmin) + 1cqmin);
    right: calc(var(--space-2, 2.4cqmin) + 9.6cqmin);
    align-items: flex-end;
  }

  .th-read {
    display: flex;
    align-items: baseline;
    gap: 1.1cqmin;
    font-size: 2.3cqmin;
    line-height: 1.35;
    white-space: nowrap;
    will-change: opacity;
  }

  .th-label {
    color: var(--muted, #94a3b8);
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .th-value {
    color: var(--fg, #f8fafc);
    font-weight: 500;
    font-variant-numeric: tabular-nums;
  }

  .th-read.th-em .th-label, .th-read.th-em .th-value {
    color: var(--th-accent);
  }

  .th-read.th-em .th-value {
    font-weight: 600;
  }
}
</style>
