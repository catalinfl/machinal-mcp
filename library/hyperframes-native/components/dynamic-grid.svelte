<!-- Modified Svelte adaptation of registry/components/dynamic-grid/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              // Unrecognised overrides return to their declared defaults.
              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var sizes = { fine: "44px", standard: "72px", coarse: "112px" };
              var weights = { hairline: "1px", standard: "2px", bold: "3px" };
              var tones = {
                neutral: "rgba(255, 255, 255, 0.16)",
                green: "color-mix(in srgb, var(--brand, #34d399) 34%, transparent)",
                blue: "color-mix(in srgb, var(--accent, #38bdf8) 34%, transparent)",
                violet: "color-mix(in srgb, var(--accent-2, #a78bfa) 34%, transparent)",
              };

              var size = sizes[pick(sizes, vars.density, "standard")];
              var line = weights[pick(weights, vars.weight, "hairline")];
              var color = tones[pick(tones, vars.tone, "neutral")];

              var roots = document.querySelectorAll(".hf-dynamic-grid");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-grid-size", size);
                roots[i].style.setProperty("--hf-grid-line", line);
                roots[i].style.setProperty("--hf-grid-color", color);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.from(".content", { opacity: 0, y: 32, duration: 0.7, ease: "power3.out" }, 0.25);
            tl.to(
              ".hf-dynamic-grid",
              { "--hf-grid-x": "72px", "--hf-grid-y": "-72px", duration: 6, ease: "none" },
              0,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="dynamic-grid-demo"
          data-width="1920"
          data-height="1080"
          data-duration="6"
        >
          <div
            class="hf-dynamic-grid"
            aria-hidden="true"
            data-composition-variables='[
        &#123; "id": "density", "type": "enum", "role": "style", "label": "Density", "description": "Cell size of the grid: fine reads as graph paper, coarse as a few large panels.", "default": "standard", "options": [&#123; "value": "fine", "label": "Fine" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "coarse", "label": "Coarse" &#125;] &#125;,
        &#123; "id": "weight", "type": "enum", "role": "style", "label": "Weight", "description": "Thickness of the grid lines, from a hairline rule to a bold structural grid.", "default": "hairline", "options": [&#123; "value": "hairline", "label": "Hairline" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "bold", "label": "Bold" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Line colour: neutral is the translucent white the original ships with, and the accents ride --brand, --accent and --accent-2.", "default": "neutral", "options": [&#123; "value": "neutral", "label": "Neutral" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]'
          ></div>
          <div class="content">
            <div class="title">Dynamic grid motion</div>
            <div class="copy">
              A web-native background primitive for product demos, explainers, and data scenes.
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
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: linear-gradient(135deg, #07131d, #13312d);
    color: white;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-dynamic-grid {
    --hf-grid-size: 72px;
    --hf-grid-color: rgba(255, 255, 255, 0.16);
    --hf-grid-x: 0px;
    --hf-grid-y: 0px;
    --hf-grid-opacity: 1;
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--hf-grid-opacity);
    background-image:
      linear-gradient(var(--hf-grid-color) 1px, transparent 1px),
      linear-gradient(90deg, var(--hf-grid-color) 1px, transparent 1px);
    background-size: var(--hf-grid-size) var(--hf-grid-size);
    background-position: var(--hf-grid-x) var(--hf-grid-y);
  }
  .content {
    position: absolute;
    left: 180px;
    bottom: 170px;
    width: 1020px;
  }
  .title {
    font-size: 118px;
    line-height: 0.96;
    font-weight: 900;
    letter-spacing: -0.035em;
  }
  .copy {
    margin-top: 34px;
    width: 760px;
    font-size: 38px;
    line-height: 1.2;
    color: rgba(255, 255, 255, 0.65);
  }


  .hf-dynamic-grid {
    --hf-grid-size: 72px;
    --hf-grid-line: 1px;
    --hf-grid-color: rgba(255, 255, 255, 0.16);
    --hf-grid-x: 0px;
    --hf-grid-y: 0px;
    --hf-grid-opacity: 1;
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--hf-grid-opacity);
    background-image:
      linear-gradient(
        var(--hf-grid-color) var(--hf-grid-line),
        transparent var(--hf-grid-line)
      ),
      linear-gradient(
        90deg,
        var(--hf-grid-color) var(--hf-grid-line),
        transparent var(--hf-grid-line)
      );
    background-size: var(--hf-grid-size) var(--hf-grid-size);
    background-position: var(--hf-grid-x) var(--hf-grid-y);
  }
}
</style>
