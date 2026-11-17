<!-- Modified Svelte adaptation of registry/components/headline-slam/headline-slam.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".hs-stage");
                var headline = root.querySelector(".hs-headline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "Ship it today" : String(vars.text);
                var indexValue = Number(vars.accent_word_index);
                var accentWordIndex = Number.isFinite(indexValue) ? Math.trunc(indexValue) : 1;
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #b895ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var shadow = !(vars.shadow === false || vars.shadow === "false");
                var words = text.trim() === "" ? [] : text.trim().split(/\s+/);

                root.style.setProperty("--hs-accent", accentColors[accent]);
                headline.classList.toggle("hs-shadow", shadow);
                headline.setAttribute("aria-label", text);

                words.forEach(function (word, index) {
                  var span = document.createElement("span");
                  span.className = index === accentWordIndex ? "hs-word hs-word-accent" : "hs-word";
                  span.textContent = word;
                  span.setAttribute("aria-hidden", "true");
                  headline.appendChild(span);
                });

                // Deterministic fit from character count: DOM measurement is zero at
                // mount time (the template is not laid out yet), so it never fires.
                // 0.62 approximates the average glyph/em width of the bold face; the
                // 56cqw rest-state cap keeps the 1.6x overshoot peak inside 90cqw.
                var approxWidthCqw = text.length * 10.5 * 0.62;
                if (approxWidthCqw > 56) {
                  var fitted = Math.max(3.5, 56 / (text.length * 0.62));
                  root.style.setProperty("--hs-font-size", fitted.toFixed(2) + "cqw");
                }

                var IN_BASE = 0.72;
                var OUT_BASE = 0.46;
                var LAND_AT_BASE = 0.58;
                var SHAKE_FRAME_BASE = 1 / 30;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var baseTotal = IN_BASE + OUT_BASE;
                var envelopeScale = duration < baseTotal ? duration / baseTotal : 1;
                var IN = IN_BASE * envelopeScale;
                var OUT = OUT_BASE * envelopeScale;
                var LAND_AT = LAND_AT_BASE * envelopeScale;
                var SHAKE_FRAME = SHAKE_FRAME_BASE * envelopeScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  headline,
                  { scale: 1.6, opacity: 0, y: 0 },
                  { scale: 1, opacity: 1, y: 0, duration: LAND_AT, ease: "expo.out" },
                  0,
                );

                tl.to(
                  stage,
                  { x: "0.55cqw", y: "-0.3cqh", duration: SHAKE_FRAME, ease: "power2.out" },
                  LAND_AT,
                );
                tl.to(stage, {
                  x: "-0.38cqw",
                  y: "0.2cqh",
                  duration: SHAKE_FRAME,
                  ease: "power2.out",
                });
                tl.to(stage, { x: 0, y: 0, duration: SHAKE_FRAME, ease: "power2.out" });

                if (HOLD > 0) {
                  tl.fromTo(
                    headline,
                    { y: 0 },
                    {
                      y: "-0.55cqh",
                      duration: HOLD / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                      immediateRender: false,
                    },
                    HOLD_START,
                  );
                }

                tl.to(headline, { y: "-120cqh", duration: OUT, ease: "power4.in" }, OUT_START);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Headline", "description": "Text displayed as the headline.", "default": "Ship it today" &#125;,
        &#123; "id": "accent_word_index", "type": "number", "role": "content", "label": "Accent word index", "description": "Zero-based word index to color. Out of range leaves the headline unaccented.", "default": 1, "step": 1 &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color applied to the selected word.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "shadow", "type": "boolean", "role": "style", "label": "Shadow", "description": "Drop shadow cast under the headline. On by default; set false for a flat matte look.", "default": true &#125;
      ]' data-composition-duration="3.5" data-composition-id="headline-slam" data-duration="3.5" data-fps="30">
            
    
            <div
              id="headline-slam-clip"
              class="hs-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="hs-stage">
                <div class="hs-headline" role="heading" aria-level="1"></div>
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

  .hs-clip, .hs-stage {
    position: absolute;
    inset: 0;
    width: 100cqw;
    height: 100cqh;
  }

  .hs-clip {
    overflow: hidden;
  }

  .hs-stage {
    display: grid;
    place-items: center;
    will-change: transform;
  }

  .hs-headline {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2cqw;
    width: 90cqw;
    min-height: 22cqh;
    color: var(--fg, #f8fafc);
    font-size: var(--hs-font-size, 10.5cqw);
    font-weight: 900;
    line-height: 0.88;
    letter-spacing: -0.5cqw;
    text-align: center;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  /* Shadow is on by default; the shadow variable opts out of it. */
  .hs-headline.hs-shadow {
    text-shadow: 0 1.2cqh 4.5cqh color-mix(in srgb, #000 52%, transparent);
  }

  .hs-word {
    display: inline-block;
  }

  .hs-word-accent {
    color: var(--hs-accent, #71f5a7);
  }
}
</style>
