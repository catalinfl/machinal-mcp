<!-- Modified Svelte adaptation of registry/components/count-up/count-up.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".cu-stage");
                var valueElement = root.querySelector(".cu-value");
                var prefixElement = root.querySelector(".cu-prefix");
                var suffixElement = root.querySelector(".cu-suffix");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var startCandidate = vars.start;
                var endCandidate = vars.end;
                var start = Number.isFinite(startCandidate) ? startCandidate : 0;
                var end = Number.isFinite(endCandidate) ? endCandidate : 100;
                var prefix = vars.prefix == null ? "" : String(vars.prefix);
                var suffix = vars.suffix == null ? "%" : String(vars.suffix);
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var glow = vars.glow === true || vars.glow === "true";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                function formatValue(value) {
                  return Math.round(value).toLocaleString("en-US");
                }

                prefixElement.textContent = prefix;
                suffixElement.textContent = suffix;

                // Optical trim: flex baseline alignment is metric, not optical.
                // At 0.55em a lone currency glyph hugs the baseline and a lone
                // math-axis glyph (+, ~) sits below the figures' visual middle,
                // so the two affixes land at different heights. Lift both onto
                // the figures' optical center; full-height strings (%, letters,
                // digits) stay on the shared baseline.
                function affixLift(text) {
                  if (/^[$€£¥₹₩]$/.test(text)) return "-0.31em";
                  if (/^[+−±×=~<>-]+$/.test(text)) return "-0.36em";
                  return "";
                }
                prefixElement.style.top = affixLift(prefix);
                suffixElement.style.top = affixLift(suffix);
                root.style.setProperty("--cu-accent", accentColors[accent]);
                stage.classList.toggle("cu-glow", glow);

                var startText = prefix + formatValue(start) + suffix;
                var endText = prefix + formatValue(end) + suffix;
                var characterCount = Math.max(
                  Array.from(startText).length,
                  Array.from(endText).length,
                  1,
                );
                var fittedCqw = Math.min(20, 150 / characterCount);
                root.style.setProperty("--cu-font-size", "min(" + fittedCqw.toFixed(3) + "cqw, 34cqh)");
                stage.setAttribute("aria-label", endText);

                var IN_BASE = 2.05;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var COUNT_BASE = 1.72;
                var PULSE_HALF_BASE = 0.165;
                var ARRIVAL_BASE = 0.38;
                var STILLNESS = 0.25;
                var FPS = 30;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var COUNT = COUNT_BASE * scale;
                var PULSE_HALF = PULSE_HALF_BASE * scale;
                var ARRIVAL = ARRIVAL_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;
                var lastFrame = Math.max(1, Math.round(COUNT * FPS));
                var countEase = gsap.parseEase("sine.inOut");
                var frameRows = [];

                for (var frame = 0; frame <= lastFrame; frame += 1) {
                  var progress = frame / lastFrame;
                  var easedProgress = countEase(progress);
                  frameRows.push(formatValue(start + (end - start) * easedProgress));
                }

                gsap.set(stage, { opacity: 0, y: "2.2cqh", scale: 0.98 });
                valueElement.textContent = frameRows[0];

                var tl = gsap.timeline({ paused: true });

                tl.to(stage, { opacity: 1, duration: ARRIVAL, ease: "power2.out" }, 0);
                tl.to(stage, { y: "0cqh", scale: 1, duration: ARRIVAL, ease: "power3.out" }, 0);

                frameRows.forEach(function (row, frameIndex) {
                  tl.set(valueElement, { textContent: row }, COUNT * (frameIndex / lastFrame));
                });

                tl.to(stage, { scale: 1.07, duration: PULSE_HALF, ease: "power3.out" }, COUNT);
                tl.to(
                  stage,
                  { scale: 1, duration: PULSE_HALF, ease: "power2.out" },
                  COUNT + PULSE_HALF,
                );

                var driftDuration = Math.max(0, HOLD - STILLNESS);
                if (driftDuration > 0) {
                  tl.to(
                    stage,
                    {
                      y: "-0.55cqh",
                      duration: driftDuration / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                    },
                    HOLD_START,
                  );
                }

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(stage, { y: "-2.2cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(
                    stage,
                    { opacity: 0, scale: 0.985, duration: OUT, ease: "power2.in" },
                    OUT_START,
                  );
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "start", "type": "number", "role": "content", "label": "Start value", "description": "First value shown by the count.", "default": 0, "step": 1 &#125;,
        &#123; "id": "end", "type": "number", "role": "content", "label": "End value", "description": "Final value where the count lands.", "default": 100, "step": 1 &#125;,
        &#123; "id": "prefix", "type": "string", "role": "content", "label": "Prefix", "description": "Optional text shown before the value.", "default": "" &#125;,
        &#123; "id": "suffix", "type": "string", "role": "content", "label": "Suffix", "description": "Optional text shown after the value.", "default": "%" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color used by the count.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "glow", "type": "boolean", "role": "style", "label": "Glow", "description": "Optional soft accent glow under the count. Off by default.", "default": false &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the landed value holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3" data-composition-id="count-up" data-duration="3" data-fps="30">
            
    
            <div
              id="count-up-clip"
              class="cu-clip clip"
              data-start="0"
              data-duration="3"
              data-track-index="0"
            >
              <div class="cu-stage" role="img">
                <span class="cu-affix cu-prefix" aria-hidden="true"></span>
                <span class="cu-value" aria-hidden="true"></span>
                <span class="cu-affix cu-suffix" aria-hidden="true"></span>
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
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .cu-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .cu-stage {
    display: flex;
    width: 92cqw;
    align-items: baseline;
    justify-content: center;
    overflow: hidden;
    color: var(--cu-accent);
    font-size: var(--cu-font-size);
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum" 1;
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.045em;
    text-align: center;
    transform-origin: 50% 58%;
    white-space: nowrap;
    will-change: transform, opacity;
  }

  /* Glow is opt-in via the glow variable; the register ships flat. */
  .cu-stage.cu-glow {
    text-shadow: 0 2.4cqh 7cqh color-mix(in srgb, var(--cu-accent) 24%, transparent);
  }

  .cu-affix {
    position: relative;
    flex: 0 0 auto;
    color: color-mix(in srgb, var(--cu-accent) 72%, var(--fg, #f8fafc));
    font-size: 0.55em;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  /* Affix gaps are font-relative (em of the affix), never layout
  spacing tokens, so the lockup scales with the figure. */
  .cu-prefix {
    margin-right: 0.14em;
  }

  .cu-suffix {
    margin-left: 0.14em;
  }

  .cu-affix:empty {
    display: none;
  }

  .cu-value {
    display: inline-block;
    min-width: 1ch;
  }
}
</style>
