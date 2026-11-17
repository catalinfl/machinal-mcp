<!-- Modified Svelte adaptation of registry/components/logo-sting/logo-sting.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var wordmark = root.querySelector(".ls-wordmark");
                var ring = root.querySelector(".ls-ring");
                var flash = root.querySelector(".ls-flash");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var accentColors = {
                  green: "var(--brand, #5df28b)",
                  blue: "var(--accent, #4da3ff)",
                  violet: "var(--accent-2, #a978ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var wordmarkText = vars.wordmark == null ? "HYPERFRAMES" : String(vars.wordmark);

                wordmark.textContent = wordmarkText;
                root.style.setProperty("--ls-accent", accentColors[accent]);

                var IN_BASE = 0.95;
                var IMPACT_BASE = 0.55;
                var parsedDuration = parseFloat(root.dataset.duration);
                var duration = Number.isFinite(parsedDuration) ? Math.max(0.001, parsedDuration) : 2.2;
                var IN = Math.min(IN_BASE, duration);
                var retime = IN / IN_BASE;
                var IMPACT = IMPACT_BASE * retime;
                var RING_DURATION = (IN_BASE - IMPACT_BASE) * retime;
                var FLASH_FRAME = Math.min(1 / 30, RING_DURATION);
                var HOLD = Math.max(0, duration - IN);

                gsap.set(ring, { scale: 0.34, opacity: 0 });
                gsap.set(flash, { opacity: 0 });

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  wordmark,
                  { scale: 1.15 },
                  { scale: 1, duration: IMPACT, ease: "expo.out" },
                  0,
                );
                tl.set(ring, { opacity: 0.92 }, IMPACT);
                tl.to(
                  ring,
                  { scale: 2.4, opacity: 0, duration: RING_DURATION, ease: "power3.out" },
                  IMPACT,
                );
                tl.set(flash, { opacity: 1 }, IMPACT);
                tl.set(flash, { opacity: 0 }, IMPACT + FLASH_FRAME);
                tl.addLabel("hold", IN);
                tl.addLabel("end", IN + HOLD);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "wordmark", "type": "string", "role": "content", "label": "Wordmark", "description": "Brand name displayed in the final lockup.", "default": "HYPERFRAMES" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color of the single impact ring.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="2.2" data-composition-id="logo-sting" data-duration="2.2" data-fps="30">
            
    
            <div
              id="logo-sting-clip"
              class="ls-clip clip"
              data-start="0"
              data-duration="2.2"
              data-track-index="0"
            >
              <div class="ls-ring" aria-hidden="true"></div>
              <div class="ls-wordmark"></div>
              <div class="ls-flash" aria-hidden="true"></div>
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
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .ls-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .ls-ring {
    position: absolute;
    z-index: 1;
    width: min(42cqw, 72cqh);
    aspect-ratio: 1;
    border: min(0.34cqw, 0.62cqh) solid var(--ls-accent);
    border-radius: 50%;
    opacity: 0;
    will-change: transform, opacity;
  }

  .ls-wordmark {
    position: relative;
    z-index: 2;
    max-width: 90cqw;
    color: var(--fg, #f8fafc);
    font-size: min(10.5cqw, 18cqh);
    font-weight: 850;
    line-height: 0.9;
    letter-spacing: -0.055em;
    text-align: center;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .ls-flash {
    position: absolute;
    inset: 0;
    z-index: 3;
    background: #ffffff;
    opacity: 0;
  }
}
</style>
