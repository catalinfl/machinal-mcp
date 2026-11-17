<!-- Modified Svelte adaptation of registry/components/variable-axis-type/variable-axis-type.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-variable-axis-type';
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
    await loadHyperframeFonts(__hfFonts);

              (function () {
                "use strict";

                var root = document.getElementById("root");
                var headline = root.querySelector(".vat-headline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "IMPACT" : String(vars.text);
                var axis = vars.axis === "wdth" ? "wdth" : "wght";
                var minimum = axis === "wdth" ? 25 : 100;
                var maximum = axis === "wdth" ? 151 : 1000;
                var fromNumber = Number(vars.fromValue);
                var toNumber = Number(vars.toValue);
                var fromValue = Number.isFinite(fromNumber) ? fromNumber : 200;
                var toValue = Number.isFinite(toNumber) ? toNumber : 900;
                fromValue = Math.max(minimum, Math.min(maximum, fromValue));
                toValue = Math.max(minimum, Math.min(maximum, toValue));

                headline.textContent = text;

                // Both endpoints list the same complete axis set in the same order.
                // Omitting even an unchanged axis can silently disable interpolation.
                var fromSettings =
                  axis === "wdth"
                    ? '"wght" 700, "wdth" ' + fromValue + ', "opsz" 96'
                    : '"wght" ' + fromValue + ', "wdth" 100, "opsz" 96';
                var toSettings =
                  axis === "wdth"
                    ? '"wght" 700, "wdth" ' + toValue + ', "opsz" 96'
                    : '"wght" ' + toValue + ', "wdth" 100, "opsz" 96';

                // RETIME RANGE: the morph is the fixed IN phase. Any time after it
                // is an elastic still HOLD, which preserves the landed emphasis.
                var IN_BASE = 1.4;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "1.6"));
                var IN = Math.min(IN_BASE, duration);

                // Font readiness owns timeline registration. This prevents fallback
                // glyph metrics from leaking into any captured or midpoint frame.
                document.fonts
                  .load('700 64px "Roboto Flex"', text)
                  .then(function () {
                    return document.fonts.ready;
                  })
                  .then(function () {
                    if (!document.fonts.check('700 64px "Roboto Flex"', text)) {
                      throw new Error("Roboto Flex failed to load");
                    }

                    var tl = gsap.timeline({ paused: true });
                    tl.fromTo(
                      headline,
                      { fontVariationSettings: fromSettings },
                      { fontVariationSettings: toSettings, duration: IN, ease: "expo.out" },
                      0,
                    );
                    tl.seek(0);

                    
                    __hfTimelineSlot.set(tl);
                  });
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "Word or short headline to emphasize.", "default": "IMPACT" &#125;,
        &#123; "id": "axis", "type": "enum", "role": "motion", "label": "Axis", "description": "Variable-font axis used for the emphasis morph.", "default": "wght", "options": [&#123; "value": "wght", "label": "Weight" &#125;, &#123; "value": "wdth", "label": "Width" &#125;] &#125;,
        &#123; "id": "fromValue", "type": "number", "role": "motion", "label": "From value", "description": "Starting coordinate on the selected font axis.", "default": 200, "min": 25, "max": 1000, "step": 1 &#125;,
        &#123; "id": "toValue", "type": "number", "role": "motion", "label": "To value", "description": "Ending coordinate on the selected font axis.", "default": 900, "min": 25, "max": 1000, "step": 1 &#125;
      ]' data-composition-id="variable-axis-type" data-duration="1.6" data-fps="30">
            
            
            
    
            
    
            <div
              id="variable-axis-type-clip"
              class="vat-clip clip"
              data-start="0"
              data-duration="1.6"
              data-track-index="0"
            >
              <div class="vat-lock">
                <div class="vat-headline">IMPACT</div>
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
    background: var(--bg, #0b1120);
    color: var(--fg, #f8fafc);
  }

  .vat-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  /* INVARIANT: width-axis changes may alter glyph advances, so the
  authored line lives in a fixed box and can never wrap mid-tween. */
  .vat-lock {
    width: 92cqw;
    height: 58cqh;
    display: grid;
    place-items: center;
    overflow: visible;
  }

  /* EDIT ZONE: font size and tracking are the only composition-level
  typography controls. Axis endpoints remain owned by variables. */
  .vat-headline {
    display: block;
    width: 100%;
    white-space: nowrap;
    text-align: center;
    color: var(--fg, #f8fafc);
    font-family: "Roboto Flex", var(--font-display, sans-serif);
    font-size: 19cqw;
    font-weight: 400;
    font-stretch: 100%;
    font-optical-sizing: none;
    font-synthesis: none;
    line-height: 0.9;
    letter-spacing: -0.045em;
  }
}
</style>
