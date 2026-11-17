<!-- Modified Svelte adaptation of registry/components/push-in/push-in.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var camera = root.querySelector(".pi-camera");
                var headline = root.querySelector(".pi-headline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "Focus" : String(vars.text);
                var intensity =
                  vars.intensity === "subtle" || vars.intensity === "bold"
                    ? vars.intensity
                    : "standard";
                var scales = { subtle: 1.08, standard: 1.12, bold: 1.18 };
                var finalScale = scales[intensity];

                headline.textContent = text;

                var IN_BASE = 0.8;
                var OUT_BASE = 0.65;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var fixedDuration = IN_BASE + OUT_BASE;
                var phaseScale = duration < fixedDuration ? duration / fixedDuration : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var inScale = HOLD > 0 ? 1 + (finalScale - 1) * 0.24 : finalScale;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  camera,
                  { scale: 1, opacity: 1 },
                  { scale: inScale, opacity: 1, duration: IN, ease: "sine.inOut" },
                  0,
                );
                if (HOLD > 0) {
                  tl.to(camera, { scale: finalScale, duration: HOLD, ease: "none" }, IN);
                }
                tl.to(camera, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Headline", "description": "Text centered in the camera frame.", "default": "Focus" &#125;,
        &#123; "id": "intensity", "type": "enum", "role": "motion", "label": "Push intensity", "description": "Final camera scale reached by the push.", "default": "standard", "options": [&#123; "value": "subtle", "label": "Subtle" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "bold", "label": "Bold" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="push-in" data-duration="4" data-fps="30">
            
    
            <div
              id="push-in-clip"
              class="pi-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="pi-camera">
                <div class="pi-headline"></div>
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

  .pi-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .pi-camera {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background:
      radial-gradient(
        ellipse at 50% 48%,
        color-mix(in srgb, var(--surface, #303747) 92%, white) 0%,
        var(--surface, #303747) 27%,
        var(--bg, #0b0c0e) 100%
      ),
      var(--bg, #0b0c0e);
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .pi-camera::after {
    content: "";
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at 50% 48%,
      transparent 24%,
      color-mix(in srgb, var(--bg, #0b0c0e) 20%, transparent) 58%,
      color-mix(in srgb, var(--bg, #0b0c0e) 88%, transparent) 100%
    );
  }

  .pi-headline {
    position: relative;
    z-index: 1;
    width: min(78cqw, 116cqh);
    color: var(--fg, #f8fafc);
    font-size: clamp(24px, 12cqw, 144px);
    font-weight: 740;
    line-height: 0.94;
    letter-spacing: -0.055em;
    text-align: center;
    overflow-wrap: anywhere;
    text-shadow: 0 1.5cqh 5cqh color-mix(in srgb, var(--bg, #0b0c0e) 62%, transparent);
  }
}
</style>
