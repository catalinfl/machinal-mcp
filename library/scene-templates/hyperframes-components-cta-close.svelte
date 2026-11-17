<!-- Modified Svelte adaptation of registry/components/cta-close/cta-close.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var lockup = root.querySelector(".cc-lockup");
                var actionLine = root.querySelector(".cc-action");
                var button = root.querySelector(".cc-button");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var actionText =
                  vars.action_line == null
                    ? "Make it happen"
                    : String(vars.action_line).trim().replace(/\s+/g, " ");
                var buttonText =
                  vars.button_label == null
                    ? "Start now"
                    : String(vars.button_label).trim().replace(/\s+/g, " ");
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // The line lands per word: one span per word, natural spaces kept
                // between them so the display tracking never crushes word gaps.
                actionLine.setAttribute("aria-label", actionText);
                var words = actionText ? actionText.split(" ") : [];
                words.forEach(function (word, index) {
                  if (index > 0) actionLine.appendChild(document.createTextNode(" "));
                  var span = document.createElement("span");
                  span.className = "cc-w";
                  span.setAttribute("aria-hidden", "true");
                  span.textContent = word;
                  actionLine.appendChild(span);
                });
                var wordEls = actionLine.querySelectorAll(".cc-w");
                button.textContent = buttonText;
                root.style.setProperty("--cc-accent", accentColors[accent]);

                // Character-count fitting is deterministic before the template is
                // laid out. The 0.47em advance estimate lands common display faces
                // at 70 to 85 percent of the frame width; short lines cap on
                // height instead so two-word closes stay monumental without
                // touching the edges.
                var actionCharacters = Math.max(1, Array.from(actionText).length);
                var actionSize = Math.min(24, 76 / (actionCharacters * 0.47));
                var buttonCharacters = Math.max(1, Array.from(buttonText).length);
                var buttonSize = Math.min(3.5, 50 / (buttonCharacters * 0.5));
                root.style.setProperty(
                  "--cc-action-size",
                  "min(" + actionSize.toFixed(3) + "cqw, 30cqh)",
                );
                root.style.setProperty(
                  "--cc-button-size",
                  "min(" + buttonSize.toFixed(3) + "cqw, 6cqh)",
                );

                var IN_BASE = 1.32;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var envelopeScale = Math.min(1, duration / (IN_BASE + OUT_BASE));
                var WORDS_AT = 0.06 * envelopeScale;
                var WORD_DURATION = 0.62 * envelopeScale;
                var WORD_STAGGER = 0.1 * envelopeScale;
                var BUTTON_AT = 0.72 * envelopeScale;
                var BUTTON_DURATION = 0.6 * envelopeScale;
                var BUTTON_FADE = 0.22 * envelopeScale;
                var OUT = OUT_BASE * envelopeScale;
                var OUT_START = duration - OUT;

                var tl = gsap.timeline({ paused: true });

                // IN, phase one: the action line lands per word at display scale.
                tl.fromTo(
                  wordEls,
                  { opacity: 0, y: "8cqh" },
                  {
                    opacity: 1,
                    y: 0,
                    duration: WORD_DURATION,
                    ease: "power3.out",
                    stagger: WORD_STAGGER,
                  },
                  WORDS_AT,
                );

                // IN, phase two: the capsule pops beneath with ONE restrained
                // overshoot (back.out), a real button under a monumental line.
                tl.fromTo(
                  button,
                  { scale: 0.85, y: "3cqh" },
                  { scale: 1, y: 0, duration: BUTTON_DURATION, ease: "back.out(1.5)" },
                  BUTTON_AT,
                );
                tl.fromTo(
                  button,
                  { opacity: 0 },
                  { opacity: 1, duration: BUTTON_FADE, ease: "power2.out" },
                  BUTTON_AT,
                );

                // HOLD: dead still. The empty set pins the timeline to the full
                // mount duration so seeks inside the hold land on the held pose.
                tl.set({}, {}, duration);

                // OUT: optional departure; exit none holds the still lockup
                // until the frame cuts (this primitive closes films).
                if (exit === "fade") {
                  tl.to(lockup, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(
                    lockup,
                    { opacity: 0, y: "-5cqh", duration: OUT, ease: "power2.in" },
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
        &#123; "id": "action_line", "type": "string", "role": "content", "label": "Action line", "description": "Two to four word action that closes the film.", "default": "Make it happen" &#125;,
        &#123; "id": "button_label", "type": "string", "role": "content", "label": "Button label", "description": "Text displayed inside the single CTA capsule.", "default": "Start now" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Contract color used by the CTA capsule.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the lockup holds until the frame cuts (this primitive closes films).", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="cta-close" data-duration="3.5" data-fps="30">
            
    
            <div
              id="cta-close-clip"
              class="cc-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="cc-lockup">
                <h2 class="cc-action"></h2>
                <button class="cc-button" type="button" tabindex="-1"></button>
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
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .cc-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
  }

  .cc-lockup {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7cqh;
    max-width: 96cqw;
    text-align: center;
  }

  .cc-action {
    margin: 0;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: var(--cc-action-size, min(10.4cqw, 30cqh));
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.035em;
    white-space: nowrap;
  }

  .cc-w {
    display: inline-block;
    will-change: transform, opacity;
  }

  .cc-button {
    margin: 0;
    padding: 2.9cqh 5cqw;
    overflow: hidden;
    border: 0;
    border-radius: 999px;
    background: var(--cc-accent);
    color: var(--bg, #0b0c0e);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    font-size: var(--cc-button-size, min(3.4cqw, 6cqh));
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.01em;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }
}
</style>
