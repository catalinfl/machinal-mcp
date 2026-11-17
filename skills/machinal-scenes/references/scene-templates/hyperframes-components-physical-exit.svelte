<!-- Modified Svelte adaptation of registry/components/physical-exit/physical-exit.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var card = root.querySelector(".pe-card");
                var label = root.querySelector(".pe-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var mode = vars.mode === "drop" || vars.mode === "slide" ? vars.mode : "toss";
                var text = vars.text == null ? "Later" : String(vars.text);
                var accent = vars.accent === "blue" || vars.accent === "violet" ? vars.accent : "green";
                var accentColors = {
                  green: "var(--brand, #34d399)",
                  blue: "var(--accent, #60a5fa)",
                  violet: "var(--accent-2, #a78bfa)",
                };

                label.textContent = text;
                card.style.setProperty("--pe-accent", accentColors[accent]);

                var IN_BASE = 0.45;
                var OUT_BASE = 0.85;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3"));
                var baseDuration = IN_BASE + OUT_BASE;
                var envelopeScale = duration < baseDuration ? duration / baseDuration : 1;
                var IN = IN_BASE * envelopeScale;
                var OUT = OUT_BASE * envelopeScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  card,
                  { y: "4cqh", scale: 0.98, rotation: -1 },
                  { y: 0, scale: 1, rotation: 0, duration: IN, ease: "power2.out" },
                  0,
                );

                if (HOLD > 0) {
                  tl.to(
                    card,
                    {
                      y: "-0.7cqh",
                      rotation: 0.5,
                      duration: HOLD / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                    },
                    HOLD_START,
                  );
                }

                if (mode === "drop") {
                  tl.to(
                    card,
                    {
                      y: "108cqh",
                      rotation: 9,
                      duration: OUT,
                      ease: "power2.in",
                    },
                    OUT_START,
                  );
                } else if (mode === "slide") {
                  var slidePeak = OUT * 0.72;
                  tl.to(
                    card,
                    {
                      x: "90cqw",
                      skewX: -12,
                      scaleX: 1.08,
                      rotation: -2,
                      duration: slidePeak,
                      ease: "power4.in",
                    },
                    OUT_START,
                  );
                  tl.to(
                    card,
                    {
                      x: "125cqw",
                      skewX: -3,
                      scaleX: 1,
                      rotation: -5,
                      duration: OUT - slidePeak,
                      ease: "power4.out",
                    },
                    OUT_START + slidePeak,
                  );
                } else {
                  var tossApex = OUT * 0.42;
                  tl.to(
                    card,
                    {
                      x: "34cqw",
                      y: "-36cqh",
                      rotation: 8,
                      duration: tossApex,
                      ease: "power3.out",
                    },
                    OUT_START,
                  );
                  tl.to(
                    card,
                    {
                      x: "118cqw",
                      y: "86cqh",
                      rotation: 18,
                      duration: OUT - tossApex,
                      ease: "power2.in",
                    },
                    OUT_START + tossApex,
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
        &#123; "id": "mode", "type": "enum", "role": "motion", "label": "Exit mode", "description": "Physical behavior used to carry the card offscreen.", "default": "toss", "options": [&#123; "value": "toss", "label": "Toss" &#125;, &#123; "value": "drop", "label": "Drop" &#125;, &#123; "value": "slide", "label": "Slide" &#125;] &#125;,
        &#123; "id": "text", "type": "string", "role": "content", "label": "Card text", "description": "Word displayed on the exiting card.", "default": "Later" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color applied to the card edge.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="3" data-composition-id="physical-exit" data-duration="3" data-fps="30">
            
    
            <div
              id="physical-exit-clip"
              class="pe-clip clip"
              data-start="0"
              data-duration="3"
              data-track-index="0"
            >
              <div class="pe-card">
                <span class="pe-label"></span>
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

  .pe-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .pe-card {
    position: relative;
    display: grid;
    place-items: center;
    width: 58cqw;
    min-height: 32cqh;
    padding: 5cqh 6cqw;
    overflow: hidden;
    border: 0.22cqmin solid color-mix(in srgb, var(--pe-accent) 62%, #ffffff);
    border-radius: 4cqmin;
    background: #f8fafc;
    box-shadow:
      0 2.4cqh 7cqh color-mix(in srgb, #020617 48%, transparent),
      inset 1.2cqw 0 0 var(--pe-accent);
    color: #0b0c0e;
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .pe-label {
    display: block;
    max-width: 48cqw;
    overflow: hidden;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 11cqmin;
    font-weight: 760;
    line-height: 1;
    letter-spacing: -0.045em;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
