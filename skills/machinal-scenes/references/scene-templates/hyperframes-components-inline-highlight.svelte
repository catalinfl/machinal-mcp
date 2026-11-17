<!-- Modified Svelte adaptation of registry/components/inline-highlight/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var tints = {
                yellow: "#fff06a",
                green: "var(--brand, #34d399)",
                blue: "var(--accent, #38bdf8)",
                violet: "var(--accent-2, #a78bfa)",
              };
              var heights = { thin: "0.22em", standard: "0.38em", thick: "0.62em" };
              var origins = { left: "left center", right: "right center", center: "center" };

              var root = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              root.style.setProperty("--hf-highlight-color", tints[pick(tints, vars.tint, "yellow")]);
              root.style.setProperty(
                "--hf-highlight-height",
                heights[pick(heights, vars.thickness, "standard")],
              );
              root.style.setProperty(
                "--hf-highlight-origin",
                origins[pick(origins, vars.origin, "left")],
              );
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.from(".copy", { opacity: 0, y: 24, duration: 0.55, ease: "power3.out" }, 0.3);
            tl.to(
              ".hf-inline-highlight",
              { "--hf-highlight-scale": 1, duration: 0.6, ease: "power2.out" },
              0.95,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="inline-highlight-demo"
          data-width="1920"
          data-height="1080"
          data-duration="4"
          data-composition-variables='[
        &#123; "id": "tint", "type": "enum", "role": "style", "label": "Tint", "description": "Marker colour. Green, blue and violet ride --brand, --accent and --accent-2.", "default": "yellow", "options": [&#123; "value": "yellow", "label": "Yellow" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "thickness", "type": "enum", "role": "style", "label": "Thickness", "description": "Height of the marker band behind the text, as a share of the font size.", "default": "standard", "options": [&#123; "value": "thin", "label": "Thin" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "thick", "label": "Thick" &#125;] &#125;,
        &#123; "id": "origin", "type": "enum", "role": "motion", "label": "Origin", "description": "Edge the marker grows out of as the scale variable runs from 0 to 1.", "default": "left", "options": [&#123; "value": "left", "label": "Left" &#125;, &#123; "value": "right", "label": "Right" &#125;, &#123; "value": "center", "label": "Center" &#125;] &#125;
      ]'
        >
          <div class="copy">
            Turn the important words into
            <span class="hf-inline-highlight">animated emphasis</span> without rebuilding the scene.
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
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f5f5f4;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
  }
  .copy {
    width: 1200px;
    font-size: 88px;
    line-height: 1.14;
    font-weight: 800;
    letter-spacing: -0.025em;
    text-align: left;
  }
  .hf-inline-highlight {
    --hf-highlight-scale: 0;
    --hf-highlight-color: #facc15;
    position: relative;
    display: inline;
    isolation: isolate;
  }
  .hf-inline-highlight::after {
    content: "";
    position: absolute;
    left: -0.05em;
    right: -0.05em;
    bottom: 0.06em;
    height: 0.35em;
    background: var(--hf-highlight-color);
    border-radius: 3px;
    transform: scaleX(var(--hf-highlight-scale));
    transform-origin: left center;
    z-index: -1;
  }


  .hf-inline-highlight {
    --hf-highlight-scale: 0;
    position: relative;
    display: inline;
    z-index: 0;
  }
  .hf-inline-highlight::after {
    content: "";
    position: absolute;
    left: -0.08em;
    right: -0.08em;
    bottom: 0.05em;
    height: var(--hf-highlight-height, 0.38em);
    background: var(--hf-highlight-color, #fff06a);
    transform: scaleX(var(--hf-highlight-scale));
    transform-origin: var(--hf-highlight-origin, left center);
    z-index: -1;
  }
}
</style>
