<!-- Modified Svelte adaptation of registry/components/icon-swap/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var tones = {
                dark: { bg: "#18181b", fg: "#ffffff" },
                light: { bg: "#fafafa", fg: "#18181b" },
                accent: { bg: "var(--brand, #34d399)", fg: "#052e21" },
              };
              var sizes = {
                small: { box: "44px", font: "22px" },
                standard: { box: "58px", font: "28px" },
                large: { box: "76px", font: "38px" },
              };
              var shapes = { rounded: "16px", circle: "50%", square: "6px" };
              var blurScales = { soft: 0.45, standard: 1, heavy: 2.2 };

              var tone = tones[pick(tones, vars.tone, "dark")];
              var size = sizes[pick(sizes, vars.size, "standard")];
              var shape = shapes[pick(shapes, vars.shape, "rounded")];
              var blurScale = blurScales[pick(blurScales, vars.blur, "standard")];

              var roots = document.querySelectorAll(".hf-transition-icon-swap");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-icon-bg", tone.bg);
                roots[i].style.setProperty("--hf-icon-fg", tone.fg);
                roots[i].style.setProperty("--hf-icon-size", size.box);
                roots[i].style.setProperty("--hf-icon-font-size", size.font);
                roots[i].style.setProperty("--hf-icon-radius", shape);
                roots[i].style.setProperty("--hf-icon-blur-scale", String(blurScale));
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.to(
              ".hf-transition-icon-swap .from",
              {
                opacity: 0,
                "--hf-icon-scale": 0.55,
                "--hf-icon-blur": "8px",
                "--hf-icon-rotate": "-18deg",
                duration: 0.18,
                ease: "power2.in",
              },
              startTime,
            );
            tl.fromTo(
              ".hf-transition-icon-swap .to",
              {
                opacity: 0,
                "--hf-icon-scale": 1.35,
                "--hf-icon-blur": "8px",
                "--hf-icon-rotate": "18deg",
              },
              {
                opacity: 1,
                "--hf-icon-scale": 1,
                "--hf-icon-blur": "0px",
                "--hf-icon-rotate": "0deg",
                duration: 0.26,
                ease: "back.out(1.7)",
              },
              startTime + 0.12,
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
          data-composition-id="icon-swap-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <button
              class="hf-transition-icon-swap"
              type="button"
              data-composition-variables='[
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Button fill and glyph colour. Accent rides --brand.", "default": "dark", "options": [&#123; "value": "dark", "label": "Dark" &#125;, &#123; "value": "light", "label": "Light" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;,
        &#123; "id": "size", "type": "enum", "role": "layout", "label": "Size", "description": "Button box and glyph size, from a toolbar chip to a hero action.", "default": "standard", "options": [&#123; "value": "small", "label": "Small" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "large", "label": "Large" &#125;] &#125;,
        &#123; "id": "shape", "type": "enum", "role": "style", "label": "Shape", "description": "Corner treatment of the button box.", "default": "rounded", "options": [&#123; "value": "rounded", "label": "Rounded" &#125;, &#123; "value": "circle", "label": "Circle" &#125;, &#123; "value": "square", "label": "Square" &#125;] &#125;,
        &#123; "id": "blur", "type": "enum", "role": "motion", "label": "Blur", "description": "Scales the blur radius the timeline drives through the swap, from a light haze to a full smear.", "default": "standard", "options": [&#123; "value": "soft", "label": "Soft" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "heavy", "label": "Heavy" &#125;] &#125;
      ]'
            >
              <span class="from">+</span><span class="to">OK</span>
            </button>
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
    /* ponytail: scale wrapper (not a GSAP target) to fill ~65% of frame */
    transform: scale(1.47);
  }
  .hf-transition-icon-swap {
    position: relative;
    display: grid;
    place-items: center;
    width: 58px;
    height: 58px;
    border: 0;
    border-radius: 16px;
    background: #18181b;
    color: #fff;
    font:
      900 28px/1 Inter,
      system-ui,
      sans-serif;
    box-shadow: 0 18px 44px rgba(24, 24, 27, 0.22);
  }
  .hf-transition-icon-swap span {
    position: absolute;
    filter: blur(var(--hf-icon-blur, 0px));
    transform: scale(var(--hf-icon-scale, 1)) rotate(var(--hf-icon-rotate, 0deg));
    will-change: transform, filter, opacity;
  }
  .hf-transition-icon-swap .to {
    opacity: 0;
  }


  .hf-transition-icon-swap {
    position: relative;
    display: grid;
    place-items: center;
    width: var(--hf-icon-size, 58px);
    height: var(--hf-icon-size, 58px);
    border: 0;
    border-radius: var(--hf-icon-radius, 16px);
    background: var(--hf-icon-bg, #18181b);
    color: var(--hf-icon-fg, #fff);
    font:
      900 28px/1 Inter,
      system-ui,
      sans-serif;
    font-size: var(--hf-icon-font-size, 28px);
    box-shadow: 0 18px 44px rgba(24, 24, 27, 0.22);
  }
  .hf-transition-icon-swap span {
    position: absolute;
    filter: blur(calc(var(--hf-icon-blur, 0px) * var(--hf-icon-blur-scale, 1)));
    transform: scale(var(--hf-icon-scale, 1)) rotate(var(--hf-icon-rotate, 0deg));
    will-change: transform, filter, opacity;
  }
  .hf-transition-icon-swap .to {
    opacity: 0;
  }
}
</style>
