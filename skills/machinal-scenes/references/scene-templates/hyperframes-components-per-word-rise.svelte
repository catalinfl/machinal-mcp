<!-- Modified Svelte adaptation of registry/components/per-word-rise/per-word-rise.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".pwr-stage");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "WORDS IN MOTION" : String(vars.text);
                var split = vars.split === "char" ? "char" : "word";
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
                var cuesValue = vars.cues == null ? "" : String(vars.cues);
                var cues = cuesValue.split(",").reduce(function (result, token) {
                  var trimmed = token.trim();
                  if (trimmed === "") return result;
                  var seconds = Number(trimmed);
                  if (!Number.isFinite(seconds) || seconds < 0) return result;
                  result.push(seconds);
                  return result;
                }, []);

                root.style.setProperty("--pwr-accent", accentColors[accent]);
                stage.classList.toggle("pwr-char", split === "char");
                stage.setAttribute("aria-label", text);

                var characterCount = Math.max(1, Array.from(text).length);
                var fittedCqw = Math.min(9.5, 126 / characterCount);
                root.style.setProperty(
                  "--pwr-font-size",
                  "min(" + fittedCqw.toFixed(3) + "cqw, 15cqh)",
                );

                var segments = split === "char" ? Array.from(text) : text.trim().split(/\s+/);
                if (segments.length === 0) segments = [""];

                var units = segments.map(function (segment, index) {
                  var unit = document.createElement("span");
                  unit.id = "per-word-rise-unit-" + index;
                  unit.className = "pwr-unit";
                  if (split === "char" && /\s/.test(segment)) {
                    unit.classList.add("pwr-space");
                    unit.textContent = "\u00a0";
                  } else {
                    unit.textContent = segment;
                  }
                  unit.setAttribute("aria-hidden", "true");
                  stage.appendChild(unit);
                  return unit;
                });

                var IN_BASE = 1.45;
                var OUT_BASE = exit === "none" ? 0 : 0.5;
                var RISE_BASE = 0.74;
                var STAGGER_BASE = 0.62;
                var EXIT_STAGGER_BASE = 0.14;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var RISE = RISE_BASE * scale;
                var STAGGER = units.length > 1 ? STAGGER_BASE * scale : 0;
                var EXIT_STAGGER = units.length > 1 ? EXIT_STAGGER_BASE * scale : 0;
                var EXIT_MOVE = Math.max(0.001, OUT - EXIT_STAGGER);

                // Landing ease: overshoot-free decel with a settle tail. A plain
                // power3.out slams from fast to imperceptible in ~2 frames and the
                // words stop dead; this piecewise cubic keeps ~7% of the travel for
                // the last 22% of the duration and is C1-continuous at the seam,
                // so the word glides its final few pixels over the closing frames
                // (a settle) with monotonic velocity: no stall, no hop, no
                // overshoot. Pure function of progress, so it stays seek-safe.
                var LAND_SPLIT = 0.78; // progress where the settle tail begins
                var LAND_RESIDUAL = 0.07; // fraction of travel left for the tail
                var LAND_SEAM_SLOPE = ((1 - LAND_RESIDUAL) / LAND_SPLIT) * 0.5; // shared velocity at the seam
                function landEase(p) {
                  if (p <= 0) return 0;
                  if (p >= 1) return 1;
                  if (p < LAND_SPLIT) {
                    var x = p / LAND_SPLIT;
                    var inv = 1 - x;
                    // Half cubic-out, half linear: keeps end velocity for the seam.
                    return (1 - LAND_RESIDUAL) * (0.5 * (1 - inv * inv * inv) + 0.5 * x);
                  }
                  var u = (p - LAND_SPLIT) / (1 - LAND_SPLIT);
                  var b = LAND_SEAM_SLOPE * (1 - LAND_SPLIT);
                  var c = 3 * LAND_RESIDUAL - 2 * b;
                  var d = b - 2 * LAND_RESIDUAL;
                  return 1 - LAND_RESIDUAL + b * u + c * u * u + d * u * u * u;
                }

                // Cues own the word landings when provided; the authored cascade
                // otherwise. Landings beyond the cue list extrapolate at the cue
                // list's own gap, and every landing clamps ahead of any exit.
                var riseEnd = IN;
                var landings;
                if (cues.length > 0) {
                  var lastCue = cues[cues.length - 1];
                  var cueGap =
                    cues.length >= 2
                      ? Math.max(0.05, (lastCue - cues[0]) / (cues.length - 1))
                      : RISE * 0.4;
                  var latestLanding = Math.max(RISE * 0.5, duration - OUT);
                  landings = units.map(function (unit, index) {
                    var landing =
                      index < cues.length
                        ? cues[index]
                        : lastCue + (index - (cues.length - 1)) * cueGap;
                    return Math.min(latestLanding, Math.max(0.05, landing));
                  });
                  riseEnd = Math.min(duration - OUT, Math.max(IN, Math.max.apply(null, landings)));
                } else {
                  // Authored cascade: same left-to-right wave the stagger drew,
                  // expressed as explicit landings so every unit gets the settle.
                  var step = units.length > 1 ? STAGGER / (units.length - 1) : 0;
                  landings = units.map(function (unit, index) {
                    return index * step + RISE;
                  });
                }
                var HOLD_START = riseEnd;
                var HOLD = Math.max(0, duration - (HOLD_START + OUT));
                var OUT_START = HOLD_START + HOLD;

                gsap.set(units, { opacity: 0, y: "8cqh", "--pwr-blur": "1.4cqh" });

                var tl = gsap.timeline({ paused: true });

                units.forEach(function (unit, index) {
                  var landing = landings[index];
                  var startAt = Math.max(0, landing - RISE);
                  tl.to(
                    unit,
                    {
                      opacity: 1,
                      y: "0cqh",
                      "--pwr-blur": "0cqh",
                      duration: Math.max(0.08, landing - startAt),
                      ease: landEase,
                    },
                    startAt,
                  );
                });

                // TRUE hold: the finished line is dead still until the exit or
                // the cut. The old 0.55cqh drift was sub-perceptual at 1080p.

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(
                    units,
                    {
                      opacity: 0,
                      y: "-4.5cqh",
                      "--pwr-blur": "0.7cqh",
                      duration: EXIT_MOVE,
                      stagger: { amount: EXIT_STAGGER, from: "start" },
                      ease: "power2.in",
                    },
                    OUT_START,
                  );
                } else if (exit === "fade") {
                  tl.to(
                    units,
                    {
                      opacity: 0,
                      duration: EXIT_MOVE,
                      stagger: { amount: EXIT_STAGGER, from: "start" },
                      ease: "power2.in",
                    },
                    OUT_START,
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
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "Text whose words or characters rise into place.", "default": "WORDS IN MOTION" &#125;,
        &#123; "id": "split", "type": "enum", "role": "content", "label": "Split", "description": "Animate the text as words or individual characters.", "default": "word", "options": [&#123; "value": "word", "label": "Word" &#125;, &#123; "value": "char", "label": "Character" &#125;] &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds (from mount start) for each unit landing. Empty keeps the authored cascade rhythm.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Contract accent token used for the text color.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the line holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="per-word-rise" data-duration="3.5" data-fps="30">
            
    
            <div
              id="per-word-rise-clip"
              class="pwr-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="pwr-stage" role="img"></div>
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
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .pwr-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
  }

  .pwr-stage {
    display: flex;
    width: 88cqw;
    max-width: 88cqw;
    align-items: baseline;
    justify-content: center;
    flex-wrap: wrap;
    column-gap: var(--space-1, 1.8cqw);
    row-gap: var(--space-2, 2.8cqh);
    color: var(--pwr-accent);
    font-size: var(--pwr-font-size);
    font-weight: 780;
    line-height: 1.08;
    letter-spacing: -0.035em;
    text-align: center;
  }

  .pwr-stage.pwr-char {
    column-gap: 0.045em;
    letter-spacing: 0;
  }

  .pwr-unit {
    display: inline-block;
    flex: 0 0 auto;
    filter: blur(var(--pwr-blur, 0cqh));
    will-change: transform, filter, opacity;
  }

  .pwr-space {
    width: 0.36em;
  }
}
</style>
