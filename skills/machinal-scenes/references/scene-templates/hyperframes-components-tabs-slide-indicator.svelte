<!-- Modified Svelte adaptation of registry/components/tabs-slide-indicator/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              // The pill is the one accent-carrying element here, so the three chromatic
              // options ride the composition's own tokens and fall back to ink.
              var accents = {
                ink: "#18181b",
                green: "var(--brand, #18181b)",
                blue: "var(--accent, #18181b)",
                violet: "var(--accent-2, #18181b)",
              };
              var widths = { compact: 72, standard: 86, wide: 104 };
              var shapes = { pill: "999px", rounded: "12px", square: "4px" };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var accent = accents[pick(accents, vars.accent, "ink")];
              var width = widths[pick(widths, vars.width, "standard")];
              var radius = shapes[pick(shapes, vars.shape, "pill")];
              var labels =
                typeof vars.labels === "string"
                  ? vars.labels.split(",").map(function (part) {
                      return part.trim();
                    })
                  : [];
              labels = labels.filter(function (part) {
                return part.length > 0;
              });

              var roots = document.querySelectorAll(".hf-transition-tabs-slide-indicator");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-tab-fill", accent);
                roots[i].style.setProperty("--hf-tab-width", width + "px");
                // The timeline slides the pill by one standard tab, so scale that slide
                // to whatever a tab is actually worth here.
                roots[i].style.setProperty("--hf-tab-step", String(width / 86));
                roots[i].style.setProperty("--hf-tab-radius", radius);
                // A single tab has nowhere to slide to, so it is left as authored.
                if (labels.length > 1) {
                  var old = roots[i].querySelectorAll("button");
                  for (var j = 0; j < old.length; j += 1) {
                    old[j].parentNode.removeChild(old[j]);
                  }
                  for (var k = 0; k < labels.length; k += 1) {
                    var button = document.createElement("button");
                    button.textContent = labels[k];
                    button.style.setProperty("--hf-tab-index", String(k));
                    roots[i].appendChild(button);
                  }
                  roots[i].style.setProperty("--hf-tab-count", String(labels.length));
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-transition-tabs-slide-indicator",
              { "--hf-tab-x": "0px" },
              { "--hf-tab-x": "86px", duration: 0.42, ease: "power3.inOut" },
              startTime,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="tabs-slide-indicator-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-tabs-slide-indicator"
              data-composition-variables='[
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Fill of the sliding pill. ink is literal; the rest ride the composition theme tokens.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "width", "type": "enum", "role": "layout", "label": "Tab width", "description": "Width of one tab. The slide the timeline drives is scaled to match, so the pill still lands on the next tab.", "default": "standard", "options": [&#123; "value": "compact", "label": "Compact" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;,
        &#123; "id": "shape", "type": "enum", "role": "style", "label": "Shape", "description": "Corner radius of the track and the pill.", "default": "pill", "options": [&#123; "value": "pill", "label": "Pill" &#125;, &#123; "value": "rounded", "label": "Rounded" &#125;, &#123; "value": "square", "label": "Square" &#125;] &#125;,
        &#123; "id": "labels", "type": "string", "role": "content", "label": "Labels", "description": "The tab names, separated by commas. Two or more names rebuild the row.", "default": "Plan,Debug,Ask" &#125;
      ]'
            >
              <span class="indicator"></span><button style="--hf-tab-index: 0">Plan</button
              ><button style="--hf-tab-index: 1">Debug</button
              ><button style="--hf-tab-index: 2">Ask</button>
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
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f7f7f8;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale wrapper only — GSAP targets .indicator inside, not this element */
    transform: scale(3.5);
  }
  .hf-transition-tabs-slide-indicator {
    --hf-tab-x: 0px;
    --hf-tab-offset: var(--hf-tab-x);
    position: relative;
    display: inline-grid;
    grid-template-columns: repeat(3, 86px);
    padding: 4px;
    border: 1px solid #e4e4e7;
    border-radius: 999px;
    background: #f4f4f5;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-tabs-slide-indicator .indicator {
    position: absolute;
    top: 4px;
    left: 4px;
    width: 86px;
    height: 36px;
    border-radius: 999px;
    background: #18181b;
    transform: translateX(var(--hf-tab-offset));
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
  }
  .hf-transition-tabs-slide-indicator button {
    --hf-tab-highlight-start: clamp(
      0px,
      calc(var(--hf-tab-offset) - var(--hf-tab-index) * 86px),
      86px
    );
    --hf-tab-highlight-end: clamp(
      0px,
      calc(var(--hf-tab-offset) + 86px - var(--hf-tab-index) * 86px),
      86px
    );
    position: relative;
    z-index: 1;
    height: 36px;
    border: 0;
    background-color: transparent;
    background-image: linear-gradient(
      to right,
      #6f6f78 0 var(--hf-tab-highlight-start),
      #fff var(--hf-tab-highlight-start) var(--hf-tab-highlight-end),
      #6f6f78 var(--hf-tab-highlight-end) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-weight: 600;
  }


  .hf-transition-tabs-slide-indicator {
    --hf-tab-x: 0px;
    --hf-tab-offset: calc(var(--hf-tab-x) * var(--hf-tab-step, 1));
    position: relative;
    display: inline-grid;
    grid-template-columns: repeat(var(--hf-tab-count, 3), var(--hf-tab-width, 86px));
    padding: 4px;
    border: 1px solid #e4e4e7;
    border-radius: var(--hf-tab-radius, 999px);
    background: #f4f4f5;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-tabs-slide-indicator .indicator {
    position: absolute;
    top: 4px;
    left: 4px;
    width: var(--hf-tab-width, 86px);
    height: 36px;
    border-radius: var(--hf-tab-radius, 999px);
    background: var(--hf-tab-fill, #18181b);
    transform: translateX(var(--hf-tab-offset));
    box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
  }
  .hf-transition-tabs-slide-indicator button {
    --hf-tab-highlight-start: clamp(
      0px,
      calc(var(--hf-tab-offset) - var(--hf-tab-index) * var(--hf-tab-width, 86px)),
      var(--hf-tab-width, 86px)
    );
    --hf-tab-highlight-end: clamp(
      0px,
      calc(
        var(--hf-tab-offset) + var(--hf-tab-width, 86px) - var(--hf-tab-index) *
        var(--hf-tab-width, 86px)
      ),
    var(--hf-tab-width, 86px)
    );
    position: relative;
    z-index: 1;
    height: 36px;
    border: 0;
    background-color: transparent;
    background-image: linear-gradient(
      to right,
      #6f6f78 0 var(--hf-tab-highlight-start),
      #fff var(--hf-tab-highlight-start) var(--hf-tab-highlight-end),
      #6f6f78 var(--hf-tab-highlight-end) 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    color: transparent;
    font-weight: 850;
  }
}
</style>
