<!-- Modified Svelte adaptation of registry/components/focus-rack/focus-rack.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".fr-stage");
                var cardA = root.querySelector(".fr-card-a");
                var cardB = root.querySelector(".fr-card-b");
                var labelA = root.querySelector(".fr-label-a");
                var labelB = root.querySelector(".fr-label-b");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var accent = vars.accent === "green" || vars.accent === "violet" ? vars.accent : "blue";
                var accents = { green: "#34d399", blue: "#60a5fa", violet: "#a78bfa" };

                labelA.textContent = vars.label_a == null ? "Draft" : String(vars.label_a);
                labelB.textContent = vars.label_b == null ? "Published" : String(vars.label_b);
                root.style.setProperty("--fr-accent", accents[accent]);

                var IN_BASE = 1.32;
                var OUT_BASE = 0.42;
                var STAGE_IN_BASE = 0.38;
                var RACK_AT_BASE = 0.62;
                var RACK_DURATION_BASE = 0.7;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var fixedDuration = IN_BASE + OUT_BASE;
                var phaseScale = duration < fixedDuration ? duration / fixedDuration : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var STAGE_IN = STAGE_IN_BASE * phaseScale;
                var RACK_AT = RACK_AT_BASE * phaseScale;
                var RACK_DURATION = RACK_DURATION_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.set(stage, { opacity: 0 }, 0);
                tl.set(
                  cardA,
                  {
                    "--fr-blur": 0,
                    opacity: 1,
                    x: "0cqw",
                    y: "-0.5cqh",
                    scale: 1.045,
                    rotation: -3,
                  },
                  0,
                );
                tl.set(
                  cardB,
                  {
                    "--fr-blur": 0.48,
                    opacity: 0.52,
                    x: "1.6cqw",
                    y: "0.8cqh",
                    scale: 0.93,
                    rotation: 2.4,
                  },
                  0,
                );

                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);

                tl.to(
                  cardA,
                  {
                    "--fr-blur": 0.48,
                    opacity: 0.5,
                    x: "-1.4cqw",
                    y: "0.8cqh",
                    scale: 0.94,
                    rotation: -1.6,
                    duration: RACK_DURATION,
                    ease: "sine.inOut",
                  },
                  RACK_AT,
                );
                tl.to(
                  cardB,
                  {
                    "--fr-blur": 0,
                    opacity: 1,
                    x: "-1.6cqw",
                    y: "-0.4cqh",
                    scale: 1.04,
                    rotation: 1.3,
                    duration: RACK_DURATION,
                    ease: "sine.inOut",
                  },
                  RACK_AT,
                );

                if (HOLD > 0) {
                  tl.to(cardA, { y: "1.15cqh", duration: HOLD, ease: "sine.inOut" }, HOLD_START);
                  tl.to(cardB, { y: "-0.75cqh", duration: HOLD, ease: "sine.inOut" }, HOLD_START);
                }

                tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "label_a", "type": "string", "role": "content", "label": "Card A label", "description": "Label on the card that begins in focus.", "default": "Draft" &#125;,
        &#123; "id": "label_b", "type": "string", "role": "content", "label": "Card B label", "description": "Label on the card that receives focus.", "default": "Published" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Highlight color shared by both cards.", "default": "blue", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="focus-rack" data-duration="3.5" data-fps="30">
            
    
            <div
              id="focus-rack-clip"
              class="fr-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="fr-stage">
                <article class="fr-card fr-card-a">
                  <div class="fr-card-top">
                    <span class="fr-kicker"><span class="fr-dot"></span>Workspace</span>
                    <span class="fr-index">A</span>
                  </div>
                  <div class="fr-label fr-label-a"></div>
                  <div class="fr-rule"></div>
                  <div class="fr-copy" aria-hidden="true">
                    <span class="fr-line"></span>
                    <span class="fr-line"></span>
                  </div>
                </article>
    
                <article class="fr-card fr-card-b">
                  <div class="fr-card-top">
                    <span class="fr-kicker"><span class="fr-dot"></span>Workspace</span>
                    <span class="fr-index">B</span>
                  </div>
                  <div class="fr-label fr-label-b"></div>
                  <div class="fr-rule"></div>
                  <div class="fr-copy" aria-hidden="true">
                    <span class="fr-line"></span>
                    <span class="fr-line"></span>
                  </div>
                </article>
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
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .fr-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: radial-gradient(
      ellipse at 52% 48%,
      color-mix(in srgb, var(--fr-accent) 12%, var(--surface, #18202d)) 0%,
      var(--bg, #0b0c0e) 72%
    );
  }

  .fr-stage {
    position: absolute;
    inset: 0;
    perspective: 120cqw;
    opacity: 0;
  }

  .fr-card {
    --fr-blur: 0;
    position: absolute;
    top: 21cqh;
    width: 39cqw;
    height: 58cqh;
    padding: 4.2cqh 3.4cqw;
    overflow: hidden;
    border: 0.1cqw solid color-mix(in srgb, var(--fr-accent) 28%, #cbd5e1);
    border-radius: 2.4cqmin;
    background: linear-gradient(145deg, #ffffff, #e9edf4);
    box-shadow:
      0 4.4cqh 10cqh rgba(0, 0, 0, 0.42),
      inset 0 0.12cqh 0 rgba(255, 255, 255, 0.86);
    color: #101827;
    filter: blur(calc(var(--fr-blur) * 1cqw));
    transform-origin: 50% 50%;
    will-change: transform, opacity, filter;
  }

  .fr-card-a {
    left: 8cqw;
  }

  .fr-card-b {
    right: 8cqw;
  }

  .fr-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .fr-kicker {
    display: flex;
    align-items: center;
    gap: 0.8cqw;
    color: #667085;
    font-size: 1.15cqw;
    font-weight: 760;
    letter-spacing: 0.13em;
    line-height: 1;
    text-transform: uppercase;
  }

  .fr-dot {
    width: 0.75cqw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--fr-accent);
    box-shadow: 0 0 1.4cqw color-mix(in srgb, var(--fr-accent) 52%, transparent);
  }

  .fr-index {
    color: #98a2b3;
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 1.05cqw;
    font-weight: 700;
  }

  .fr-label {
    margin-top: 7.4cqh;
    max-width: 100%;
    overflow: hidden;
    color: #101827;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 4.8cqw;
    font-weight: 790;
    letter-spacing: -0.055em;
    line-height: 0.94;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .fr-rule {
    width: 100%;
    height: 0.35cqh;
    margin-top: 5cqh;
    border-radius: 99cqh;
    background: color-mix(in srgb, var(--fr-accent) 76%, #d0d5dd);
  }

  .fr-copy {
    display: grid;
    gap: 1.4cqh;
    margin-top: 3.2cqh;
  }

  .fr-line {
    display: block;
    height: 1.15cqh;
    border-radius: 99cqh;
    background: #c9d0dc;
  }

  .fr-line:last-child {
    width: 68%;
  }
}
</style>
