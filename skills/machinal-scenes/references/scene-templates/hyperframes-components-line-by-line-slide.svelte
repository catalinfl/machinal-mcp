<!-- Modified Svelte adaptation of registry/components/line-by-line-slide/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var sizes = { compact: "40px", standard: "52px", display: "68px" };
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };
              var gaps = { fine: "4px", standard: "10px", coarse: "20px" };
              var axes = { left: 1, right: -1 };

              var size = sizes[pick(sizes, vars.size, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];
              var gap = gaps[pick(gaps, vars.density, "standard")];
              var axis = axes[pick(axes, vars.direction, "left")];

              var roots = document.querySelectorAll(".hf-catalog-line-by-line-slide");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-line-size", size);
                root.style.setProperty("--hf-line-color", tone);
                root.style.setProperty("--hf-line-gap", gap);
                root.style.setProperty("--hf-line-axis-x", String(axis));
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-line-by-line-slide span",
              { opacity: 0, "--hf-line-x": "-36px", "--hf-line-y": "18px", "--hf-line-blur": "6px" },
              {
                opacity: 1,
                "--hf-line-x": "0px",
                "--hf-line-y": "0px",
                "--hf-line-blur": "0px",
                duration: 0.34,
                stagger: 0.08,
                ease: "power3.out",
              },
              startTime,
            );
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="line-by-line-slide-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-catalog-line-by-line-slide"
              data-composition-variables='[
        &#123;"id": "size", "type": "enum", "role": "layout", "label": "Size", "description": "Type size of the whole stack.", "default": "standard", "options": [&#123;"value": "compact", "label": "Compact"&#125;, &#123;"value": "standard", "label": "Standard"&#125;, &#123;"value": "display", "label": "Display"&#125;]&#125;,
        &#123;"id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Line colour: ink for light frames, paper for dark ones, accent rides the brand token.", "default": "ink", "options": [&#123;"value": "ink", "label": "Ink"&#125;, &#123;"value": "paper", "label": "Paper"&#125;, &#123;"value": "accent", "label": "Accent"&#125;]&#125;,
        &#123;"id": "density", "type": "enum", "role": "layout", "label": "Density", "description": "The gap between lines, from a tight block to an airy stack.", "default": "standard", "options": [&#123;"value": "fine", "label": "Fine"&#125;, &#123;"value": "standard", "label": "Standard"&#125;, &#123;"value": "coarse", "label": "Coarse"&#125;]&#125;,
        &#123;"id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Which side the lines slide in from as the timeline drives the offset.", "default": "left", "options": [&#123;"value": "left", "label": "Left"&#125;, &#123;"value": "right", "label": "Right"&#125;]&#125;
      ]'
            >
              <span>Design faster</span><span>Render cleaner</span><span>Ship louder</span>
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
    min-width: 900px;
    min-height: 500px;
    padding: 64px;
    /* ponytail: scale wrapper — not a GSAP target, so CSS transform is safe */
    transform: scale(2.8);
    transform-origin: center center;
  }
  .hf-catalog-line-by-line-slide {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-line-by-line-slide {
    display: grid;
    gap: 10px;
    font-size: 64px;
    line-height: 1.05;
    overflow: hidden;
  }
  .hf-catalog-line-by-line-slide span {
    display: block;
    transform: translate(var(--hf-line-x, 0px), var(--hf-line-y, 0px));
    filter: blur(var(--hf-line-blur, 0px));
    will-change: transform, filter, opacity;
  }


  .hf-catalog-line-by-line-slide {
    color: var(--hf-line-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-line-by-line-slide {
    display: grid;
    gap: var(--hf-line-gap, 10px);
    font-size: var(--hf-line-size, 52px);
    line-height: 1;
    overflow: hidden;
  }
  .hf-catalog-line-by-line-slide span {
    display: block;
    transform: translate(
      calc(var(--hf-line-x, 0px) * var(--hf-line-axis-x, 1)),
      var(--hf-line-y, 0px)
    );
    filter: blur(var(--hf-line-blur, 0px));
    will-change: transform, filter, opacity;
  }
}
</style>
