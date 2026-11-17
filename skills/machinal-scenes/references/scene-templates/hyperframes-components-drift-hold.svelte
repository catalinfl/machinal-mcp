<!-- Modified Svelte adaptation of registry/components/drift-hold/drift-hold.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var card = root.querySelector(".dh-card");
                var sweep = root.querySelector(".dh-sweep");
                var label = root.querySelector(".dh-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "Always alive" : String(vars.text);
                var intensity = vars.intensity === "whisper" ? "whisper" : "standard";
                var amplitudes = {
                  whisper: { rotation: 0.24, scale: 0.006, sweep: 30, light: 0.04 },
                  standard: { rotation: 0.6, scale: 0.015, sweep: 42, light: 0.08 },
                };
                var motion = amplitudes[intensity];

                label.textContent = text;

                var TAU = Math.PI * 2;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var state = { phase: 0 };

                function renderPose() {
                  // Literal phase zero at the endpoint removes floating point
                  // residue from Math.sin(2 * PI) and makes the seam exact.
                  var phase = state.phase === TAU ? 0 : state.phase;
                  var rotation = Math.sin(phase + Math.PI / 6) * motion.rotation;
                  var scale = 1 + Math.sin(phase + Math.PI / 2) * motion.scale;
                  var sweepX = Math.sin(phase - Math.PI / 2) * motion.sweep;
                  var sweepOpacity = 0.12 + Math.sin(phase + Math.PI / 3) * motion.light;

                  gsap.set(card, { rotation: rotation, scale: scale });
                  gsap.set(sweep, {
                    x: sweepX + "cqw",
                    rotation: 14,
                    opacity: sweepOpacity,
                  });
                }

                var tl = gsap.timeline({ paused: true });

                // HOLD: uniform phase travel drives only whole-cycle sine motion.
                tl.to(state, { phase: TAU, duration: duration, ease: "none", onUpdate: renderPose }, 0);

                renderPose();
                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "Text displayed in the default centered card.", "default": "Always alive" &#125;,
        &#123; "id": "intensity", "type": "enum", "role": "motion", "label": "Intensity", "description": "Amplitude of the ambient rotation, breathing, and light sweep.", "default": "standard", "options": [&#123; "value": "whisper", "label": "Whisper" &#125;, &#123; "value": "standard", "label": "Standard" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="drift-hold" data-duration="4" data-fps="30">
            
    
            <div
              id="drift-hold-clip"
              class="dh-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="dh-card">
                <div class="dh-sweep" aria-hidden="true"></div>
                <div class="dh-label"></div>
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

  .dh-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .dh-card {
    position: relative;
    display: grid;
    width: 68cqw;
    min-height: 44cqh;
    place-items: center;
    overflow: hidden;
    padding: var(--space-3, 5cqh) var(--space-3, 6cqw);
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 82%, transparent);
    border-radius: var(--radius, 3.2cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 94%, var(--accent, #38bdf8));
    box-shadow: 0 3.5cqh 10cqh color-mix(in srgb, var(--bg, #05070d) 58%, transparent);
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .dh-sweep {
    position: absolute;
    top: -45%;
    left: 42%;
    width: 20cqw;
    height: 190%;
    background: linear-gradient(
      90deg,
      transparent 0%,
      color-mix(in srgb, var(--accent, #38bdf8) 10%, transparent) 25%,
      color-mix(in srgb, var(--fg, #f8fafc) 28%, transparent) 50%,
      color-mix(in srgb, var(--accent, #38bdf8) 10%, transparent) 75%,
      transparent 100%
    );
    filter: blur(1.8cqmin);
    will-change: transform, opacity;
  }

  .dh-label {
    position: relative;
    z-index: 1;
    max-width: 56cqw;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(20px, 9cqmin, 76px);
    font-weight: 720;
    line-height: 1.05;
    letter-spacing: -0.035em;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
