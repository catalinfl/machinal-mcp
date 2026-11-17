<!-- Modified Svelte adaptation of registry/components/beat-accent/beat-accent.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".ba-stage");
                var flash = root.querySelector(".ba-flash");
                var subject = root.querySelector(".ba-subject");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "BOOM" : String(vars.text);
                var flashChoice =
                  vars.flashColor === "soft" || vars.flashColor === "bright"
                    ? vars.flashColor
                    : "accent";
                var intensityValue = Number(vars.intensity);
                var intensity = Number.isFinite(intensityValue)
                  ? Math.max(0.5, Math.min(2, intensityValue))
                  : 1;

                var flashColors = {
                  accent: "var(--accent, #ff4f8b)",
                  soft: "color-mix(in srgb, var(--accent, #ff4f8b) 70%, var(--bg, #0b1120))",
                  bright: "color-mix(in srgb, var(--accent, #ff4f8b) 72%, var(--fg, #f8fafc))",
                };

                subject.textContent = text;
                root.style.setProperty("--ba-flash-color", flashColors[flashChoice]);

                var IN_BASE = 0.9;
                var OUT_BASE = 0.4;
                var IMPACT_AT_BASE = 0.25;
                var SNAP_BASE = 0.12;
                var SETTLE_BASE = 0.28;
                var FLASH_IN_BASE = 0.08;
                var FLASH_OUT_BASE = 0.28;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var envelopeScale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * envelopeScale;
                var OUT = OUT_BASE * envelopeScale;
                var IMPACT_AT = IMPACT_AT_BASE * envelopeScale;
                var SNAP = SNAP_BASE * envelopeScale;
                var SETTLE = SETTLE_BASE * envelopeScale;
                var FLASH_IN = FLASH_IN_BASE * envelopeScale;
                var FLASH_OUT = FLASH_OUT_BASE * envelopeScale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                var restScale = 1 - 0.06 * intensity;
                var peakScale = 1 + 0.18 * intensity;
                var flashPeakScale = 0.78 + 0.3 * intensity;
                var flashEndScale = 1.08 + 0.32 * intensity;
                var flashPeakOpacity = Math.min(0.96, 0.5 + 0.23 * intensity);
                var shakeX = 0.9 * intensity;
                var shakeY = 0.34 * intensity;

                gsap.set(stage, { x: 0, y: 0, opacity: 1 });
                gsap.set(subject, { scale: restScale });
                gsap.set(flash, { scale: 0.25, opacity: 0 });

                var tl = gsap.timeline({ paused: true });

                tl.to(subject, { scale: peakScale, duration: SNAP, ease: "expo.out" }, IMPACT_AT);
                tl.to(subject, { scale: 1, duration: SETTLE, ease: "power3.out" }, IMPACT_AT + SNAP);

                tl.to(
                  flash,
                  {
                    scale: flashPeakScale,
                    opacity: flashPeakOpacity,
                    duration: FLASH_IN,
                    ease: "expo.out",
                  },
                  IMPACT_AT,
                );
                tl.to(
                  flash,
                  { scale: flashEndScale, opacity: 0, duration: FLASH_OUT, ease: "power3.out" },
                  IMPACT_AT + FLASH_IN,
                );

                tl.to(
                  stage,
                  {
                    x: shakeX + "cqw",
                    y: -shakeY + "cqh",
                    duration: 0.04 * envelopeScale,
                    ease: "none",
                  },
                  IMPACT_AT,
                );
                tl.to(
                  stage,
                  {
                    x: -shakeX * 0.7 + "cqw",
                    y: shakeY * 0.75 + "cqh",
                    duration: 0.05 * envelopeScale,
                    ease: "none",
                  },
                  IMPACT_AT + 0.04 * envelopeScale,
                );
                tl.to(
                  stage,
                  {
                    x: shakeX * 0.3 + "cqw",
                    y: -shakeY * 0.35 + "cqh",
                    duration: 0.05 * envelopeScale,
                    ease: "none",
                  },
                  IMPACT_AT + 0.09 * envelopeScale,
                );
                tl.to(
                  stage,
                  {
                    x: 0,
                    y: 0,
                    duration: 0.12 * envelopeScale,
                    ease: "power3.out",
                  },
                  IMPACT_AT + 0.14 * envelopeScale,
                );

                tl.call(
                  function () {
                    root.dispatchEvent(
                      new CustomEvent("hf:sfx", {
                        detail: { id: "impact-hard", t: IMPACT_AT },
                        bubbles: true,
                      }),
                    );
                  },
                  [],
                  IMPACT_AT,
                );

                tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.out" }, OUT_START);
                tl.seek(0);

                
                // Literal id is required. Mount flattening strips data-composition-id
                // from this inner root, so reading the id from root would register
                // under null and leave the host unable to find this timeline.
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Accent text", "description": "Word or short label emphasized by the beat hit.", "default": "BOOM" &#125;,
        &#123; "id": "flashColor", "type": "enum", "role": "style", "label": "Flash color", "description": "Token-backed accent tone used by the radial flash.", "default": "accent", "options": [&#123; "value": "accent", "label": "Accent" &#125;, &#123; "value": "soft", "label": "Soft accent" &#125;, &#123; "value": "bright", "label": "Bright accent" &#125;] &#125;,
        &#123; "id": "intensity", "type": "number", "role": "timing", "label": "Intensity", "description": "Strength of the scale pulse, flash, and shake.", "default": 1, "min": 0.5, "max": 2, "step": 0.1 &#125;
      ]' data-composition-id="beat-accent" data-duration="4" data-fps="30">
            
    
            <div
              id="beat-accent-clip"
              class="ba-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="ba-stage">
                <div class="ba-flash" aria-hidden="true"></div>
                <div class="ba-subject"></div>
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
    --ease-slam: cubic-bezier(0.19, 1, 0.22, 1);
    --ba-flash-color: var(--accent, #ff4f8b);
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #0b1120);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, system-ui, sans-serif);
    pointer-events: none;
  }

  .ba-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .ba-stage {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    will-change: transform, opacity;
  }

  .ba-flash {
    position: absolute;
    width: 62cqw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--ba-flash-color) 92%, transparent) 0%,
      color-mix(in srgb, var(--ba-flash-color) 54%, transparent) 24%,
      color-mix(in srgb, var(--ba-flash-color) 16%, transparent) 48%,
      transparent 72%
    );
    opacity: 0;
    will-change: transform, opacity;
  }

  .ba-flash::after {
    content: "";
    position: absolute;
    inset: 22%;
    border: 0.45cqmin solid color-mix(in srgb, var(--ba-flash-color) 78%, transparent);
    border-radius: 50%;
  }

  .ba-subject {
    position: relative;
    z-index: 1;
    display: block;
    width: 86cqw;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, var(--font-body, system-ui, sans-serif));
    font-size: 20cqmin;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.055em;
    text-align: center;
    text-transform: uppercase;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-shadow:
      0 0 2cqmin color-mix(in srgb, var(--accent, #ff4f8b) 46%, transparent),
      0 1.2cqh 3.8cqh color-mix(in srgb, var(--bg, #0b1120) 68%, transparent);
    transform-origin: 50% 50%;
    will-change: transform;
  }
}
</style>
