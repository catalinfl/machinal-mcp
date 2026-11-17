<!-- Modified Svelte adaptation of registry/components/text-shimmer/text-shimmer.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var headline = root.querySelector(".ts-headline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "Effortless" : String(vars.text);
                var accent = vars.accent === "blue" || vars.accent === "violet" ? vars.accent : "green";
                var accentTokens = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #a78bfa)",
                };
                var accentColor = accentTokens[accent];
                var sweepAtValue = vars.sweep_at;
                var sweepAt =
                  typeof sweepAtValue === "number" && Number.isFinite(sweepAtValue)
                    ? Math.max(0.2, Math.min(2, sweepAtValue))
                    : 1.2;

                headline.textContent = text;
                headline.style.setProperty("--ts-accent", accentColor);

                var SWEEP_BASE = 0.9;
                var durationValue = parseFloat(root.dataset.duration || "3");
                var duration = Number.isFinite(durationValue) ? Math.max(0.001, durationValue) : 3;
                var SWEEP = Math.min(SWEEP_BASE, duration);
                var SWEEP_START = Math.min(sweepAt, Math.max(0, duration - SWEEP));
                var IN = SWEEP_START + SWEEP;
                var HOLD = Math.max(0, duration - IN);

                var tl = gsap.timeline({ paused: true });
                tl.fromTo(
                  headline,
                  { backgroundPosition: "100% 50%" },
                  { backgroundPosition: "0% 50%", duration: SWEEP, ease: "sine.inOut" },
                  SWEEP_START,
                );

                if (HOLD > 0) {
                  tl.to(
                    headline,
                    { backgroundPosition: "4% 50%", duration: HOLD, ease: "sine.inOut" },
                    IN,
                  );
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Headline", "description": "Text receiving the single shimmer pass.", "default": "Effortless" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Hue of the specular shimmer band.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "sweep_at", "type": "number", "role": "timing", "label": "Sweep start", "description": "Requested start time for the shimmer sweep.", "default": 1.2, "min": 0.2, "max": 2, "step": 0.1, "unit": "s" &#125;
      ]' data-composition-duration="3" data-composition-id="text-shimmer" data-duration="3" data-fps="30">
            
    
            <div
              id="text-shimmer-clip"
              class="ts-clip clip"
              data-start="0"
              data-duration="3"
              data-track-index="0"
            >
              <span class="ts-headline"></span>
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
    background: var(--bg, transparent);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .ts-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    padding: var(--space-3, 4cqmin);
    background: var(--surface, transparent);
  }

  .ts-headline {
    --ts-base: var(--fg, #f8fafc);
    --ts-accent: var(--brand, #22c55e);
    display: block;
    max-width: 90cqw;
    color: transparent;
    font-size: clamp(28px, 16cqmin, 176px);
    font-weight: 780;
    line-height: 0.96;
    letter-spacing: -0.055em;
    overflow-wrap: anywhere;
    text-align: center;
    background-image: linear-gradient(
      110deg,
      var(--ts-base) 0%,
      var(--ts-base) 40%,
      color-mix(in srgb, var(--ts-accent) 58%, var(--fg, white)) 47%,
      var(--fg, white) 50%,
      color-mix(in srgb, var(--ts-accent) 72%, var(--fg, white)) 53%,
      var(--ts-base) 60%,
      var(--ts-base) 100%
    );
    background-position: 100% 50%;
    background-repeat: no-repeat;
    background-size: 300% 100%;
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    will-change: background-position;
  }
}
</style>
