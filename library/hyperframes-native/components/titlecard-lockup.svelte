<!-- Modified Svelte adaptation of registry/components/titlecard-lockup/titlecard-lockup.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var lockup = root.querySelector(".tl-lockup");
                var kicker = root.querySelector(".tl-kicker");
                var wordmark = root.querySelector(".tl-wordmark");
                var ruleSvg = root.querySelector(".tl-rule-svg");
                var ruleLine = root.querySelector(".tl-rule");
                var label = root.querySelector(".tl-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function readText(value, fallback) {
                  if (value == null) return fallback;
                  return String(value).trim().replace(/\s+/g, " ");
                }

                var wordmarkText = readText(vars.wordmark, "HYPERFRAMES");
                var labelText = readText(vars.label, "WRITE HTML. RENDER VIDEO.");
                var kickerText = readText(vars.kicker, "INTRODUCING");
                var ruleShown = vars.rule !== "hide";
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                wordmark.textContent = wordmarkText;
                lockup.setAttribute("aria-label", wordmarkText);
                root.style.setProperty("--tl-accent", accentColors[accent]);

                if (kickerText) kicker.textContent = kickerText;
                else kicker.setAttribute("hidden", "hidden");
                if (labelText) label.textContent = labelText;
                else label.setAttribute("hidden", "hidden");
                if (!ruleShown) ruleSvg.setAttribute("hidden", "hidden");

                // Deterministic character-count fit keeps the wordmark on one line
                // with air on both sides before the template is laid out. The 0.78
                // advance estimate is conservative so wide themed display faces
                // (serifs) still fit inside the frame.
                var characters = Math.max(1, Array.from(wordmarkText).length);
                var fittedCqw = Math.min(12, 84 / (characters * 0.78));
                root.style.setProperty(
                  "--tl-wordmark-size",
                  "min(" + fittedCqw.toFixed(3) + "cqw, 22cqh)",
                );

                var IN_BASE = 1.8;
                var OUT_BASE = exit === "none" ? 0 : 0.5;
                var parsedDuration = Number.parseFloat(root.dataset.duration);
                var duration = Number.isFinite(parsedDuration) ? Math.max(0.001, parsedDuration) : 4;
                var totalBase = IN_BASE + OUT_BASE;
                var phaseScale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var KICKER_IN = 0.45 * phaseScale;
                var WORD_AT = 0.25 * phaseScale;
                var WORD_IN = 0.85 * phaseScale;
                var RULE_AT = 0.9 * phaseScale;
                var RULE_IN = 0.55 * phaseScale;
                var LABEL_AT = 1.3 * phaseScale;
                var LABEL_IN = 0.5 * phaseScale;

                var tl = gsap.timeline({ paused: true });

                // Optional kicker fades up first. An empty kicker leaves a beat of
                // quiet instead of reflowing the schedule.
                if (kickerText) {
                  tl.fromTo(
                    kicker,
                    { autoAlpha: 0, y: "2.2cqh" },
                    { autoAlpha: 1, y: "0cqh", duration: KICKER_IN, ease: "power2.out" },
                    0,
                  );
                }

                // The ONE move: the wordmark settles dead-center, scale 0.96 to 1,
                // smooth ease-out, entrance half only, no bounce.
                tl.fromTo(
                  wordmark,
                  { autoAlpha: 0, scale: 0.96 },
                  { autoAlpha: 1, scale: 1, duration: WORD_IN, ease: "power3.out" },
                  WORD_AT,
                );

                // Hairline rule draws left to right via measured-length dash.
                if (ruleShown) {
                  var ruleLength = ruleLine.getTotalLength();
                  ruleLine.style.strokeDasharray = String(ruleLength);
                  ruleLine.style.strokeDashoffset = String(ruleLength);
                  tl.fromTo(
                    ruleLine,
                    { strokeDashoffset: ruleLength },
                    { strokeDashoffset: 0, duration: RULE_IN, ease: "power2.out" },
                    RULE_AT,
                  );
                }

                // Mono label fades up beneath the rule.
                if (labelText) {
                  tl.fromTo(
                    label,
                    { autoAlpha: 0, y: "1.8cqh" },
                    { autoAlpha: 1, y: "0cqh", duration: LABEL_IN, ease: "power2.out" },
                    LABEL_AT,
                  );
                }

                // TRUE hold: dead still. No drift, no breath; sub-perceptual
                // motion reads as noise at 1080p, and the stillness is the point.

                // Optional exit. Frame roots own transitions; none is the default
                // and leaves the held lockup as the final frame.
                if (exit !== "none") {
                  var exitProps = { autoAlpha: 0, duration: OUT, ease: "power2.in" };
                  if (exit === "up") exitProps.y = "-2.4cqh";
                  tl.to(lockup, exitProps, OUT_START);
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
        &#123; "id": "wordmark", "type": "string", "role": "content", "label": "Wordmark", "description": "Display wordmark that settles dead-center.", "default": "HYPERFRAMES" &#125;,
        &#123; "id": "label", "type": "string", "role": "content", "label": "Label", "description": "Mono caption under the rule. Empty hides it.", "default": "WRITE HTML. RENDER VIDEO." &#125;,
        &#123; "id": "kicker", "type": "string", "role": "content", "label": "Kicker", "description": "Small mono label above the wordmark. Empty hides it.", "default": "INTRODUCING" &#125;,
        &#123; "id": "rule", "type": "enum", "role": "style", "label": "Rule", "description": "Hairline rule drawn left to right under the wordmark.", "default": "show", "options": [&#123; "value": "show", "label": "Show" &#125;, &#123; "value": "hide", "label": "Hide" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Contract color carried by the hairline rule.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "style", "label": "Exit", "description": "Optional departure. Frame roots own transitions, so none is the default.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="titlecard-lockup" data-duration="4" data-fps="30">
            
    
            <div
              id="titlecard-lockup-clip"
              class="tl-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="tl-lockup">
                <span class="tl-kicker"></span>
                <span class="tl-wordmark"></span>
                <svg
                  class="tl-rule-svg"
                  viewBox="0 0 560 2"
                  preserveAspectRatio="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <line class="tl-rule" x1="0" y1="1" x2="560" y2="1" />
                </svg>
                <span class="tl-label"></span>
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

  #root [hidden] {
    display: none !important;
  }

  .tl-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
  }

  .tl-lockup {
    display: flex;
    flex-direction: column;
    align-items: center;
    max-width: 92cqw;
    text-align: center;
    will-change: transform, opacity;
  }

  .tl-kicker {
    display: block;
    margin-bottom: var(--space-2, 3.4cqh);
    /* Light-safe ink derived from the host's own fg/bg instead of
    --muted (whose fallback is dark-tuned and fails contrast on
      light hosts). 62% fg clears 4.5:1 on both dark and light. */
    color: color-mix(in srgb, var(--fg, #f8fafc) 62%, var(--bg, #0b0c0e));
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2.6cqmin;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.3em;
    text-indent: 0.3em; /* balances the trailing tracking so the line optically centers */
    text-transform: uppercase;
    will-change: transform, opacity;
  }

  .tl-wordmark {
    display: block;
    max-width: 92cqw;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: var(--tl-wordmark-size, min(14cqw, 22cqh));
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.03em;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .tl-rule-svg {
    display: block;
    width: 34cqw;
    height: max(1px, 0.2cqmin);
    margin-top: var(--space-2, 4cqh);
  }

  .tl-rule-svg line {
    stroke: color-mix(
      in srgb,
      var(--tl-accent, var(--brand, #71f5a7)) 60%,
      var(--fg, #f8fafc)
    );
    stroke-width: 2;
    stroke-opacity: 0.62;
  }

  .tl-label {
    display: block;
    margin-top: var(--space-2, 3.2cqh);
    /* Same fg/bg-derived ink as the kicker: contrast-safe on any host. */
    color: color-mix(in srgb, var(--fg, #f8fafc) 62%, var(--bg, #0b0c0e));
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2.2cqmin;
    font-weight: 600;
    line-height: 1.4;
    letter-spacing: 0.34em;
    text-indent: 0.34em;
    text-transform: uppercase;
    will-change: transform, opacity;
  }
}
</style>
