<!-- Modified Svelte adaptation of registry/components/match-cut/match-cut.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var shell = root.querySelector(".mc-shell");
                var sceneA = root.querySelector(".mc-scene-a");
                var sceneB = root.querySelector(".mc-scene-b");
                var circleA = root.querySelector(".mc-circle-a");
                var circleB = root.querySelector(".mc-circle-b");
                var labelA = root.querySelector(".mc-label-a");
                var labelB = root.querySelector(".mc-label-b");
                var revealB = root.querySelectorAll(".mc-kicker, .mc-label-b");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var accentName =
                  vars.accent === "blue" || vars.accent === "violet" ? vars.accent : "green";
                var accents = { green: "#4ade80", blue: "#60a5fa", violet: "#a78bfa" };
                var labelAText = vars.label_a == null ? "Start" : String(vars.label_a);
                var labelBText = vars.label_b == null ? "Done" : String(vars.label_b);

                root.style.setProperty("--mc-accent", accents[accentName]);
                labelA.textContent = labelAText;
                labelB.textContent = labelBText;

                var IN_BASE = 2.35;
                var OUT_BASE = 0.5;
                var CUT_AT_BASE = 1.4;
                var A_APPROACH_BASE = 0.45;
                var B_SETTLE_BASE = 0.65;
                var COPY_DELAY_BASE = 0.1;
                var COPY_IN_BASE = 0.55;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var envelopeBase = IN_BASE + OUT_BASE;
                var phaseScale = duration < envelopeBase ? duration / envelopeBase : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var CUT_AT = CUT_AT_BASE * phaseScale;
                var A_APPROACH = A_APPROACH_BASE * phaseScale;
                var B_SETTLE = B_SETTLE_BASE * phaseScale;
                var COPY_DELAY = COPY_DELAY_BASE * phaseScale;
                var COPY_IN = COPY_IN_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.set(shell, { opacity: 0 }, 0);
                tl.set(sceneA, { opacity: 1 }, 0);
                tl.set(sceneB, { opacity: 0 }, 0);
                tl.set(circleA, { scale: 0.54 }, 0);
                tl.set(circleB, { scale: 1, y: 0 }, 0);
                tl.set(revealB, { opacity: 0, y: "2.4cqh" }, 0);

                tl.to(shell, { opacity: 1, duration: Math.min(0.3, IN), ease: "power2.out" }, 0);
                tl.to(circleA, { scale: 0.64, duration: A_APPROACH, ease: "power3.out" }, 0);
                tl.to(
                  circleA,
                  {
                    scale: 1,
                    duration: Math.max(0, CUT_AT - A_APPROACH),
                    ease: "power4.in",
                  },
                  A_APPROACH,
                );

                // HARD CUT: both opacity states change at the exact same instant.
                tl.set(sceneA, { opacity: 0 }, CUT_AT);
                tl.set(sceneB, { opacity: 1 }, CUT_AT);

                // Scene B starts at the matching geometry and leaves the cut at
                // peak speed, then decelerates into its smaller resting pose.
                tl.to(circleB, { scale: 0.74, duration: B_SETTLE, ease: "power4.out" }, CUT_AT);
                tl.to(
                  revealB,
                  {
                    opacity: 1,
                    y: 0,
                    duration: COPY_IN,
                    stagger: 0.08 * phaseScale,
                    ease: "power3.out",
                  },
                  CUT_AT + COPY_DELAY,
                );

                if (HOLD > 0) {
                  tl.to(
                    circleB,
                    {
                      y: "-0.8cqh",
                      duration: HOLD / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                    },
                    HOLD_START,
                  );
                }

                tl.to(shell, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color shared by the matched circles.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "label_a", "type": "string", "role": "content", "label": "Scene A label", "description": "Text inside the outgoing button.", "default": "Start" &#125;,
        &#123; "id": "label_b", "type": "string", "role": "content", "label": "Scene B label", "description": "Result text revealed after the cut.", "default": "Done" &#125;
      ]' data-composition-duration="4" data-composition-id="match-cut" data-duration="4" data-fps="30">
            
    
            <div
              id="match-cut-clip"
              class="mc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="mc-shell">
                <section class="mc-scene mc-scene-a" aria-label="Outgoing scene">
                  <div class="mc-circle mc-circle-a">
                    <span class="mc-label-a"></span>
                  </div>
                </section>
    
                <section class="mc-scene mc-scene-b" aria-label="Incoming scene">
                  <div class="mc-circle mc-circle-b" aria-hidden="true">
                    <span class="mc-check"></span>
                  </div>
                  <div class="mc-copy-b">
                    <span class="mc-kicker">Match complete</span>
                    <span class="mc-label-b"></span>
                  </div>
                </section>
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
    color: #f8fafc;
    font-family: Inter, system-ui, sans-serif;
    pointer-events: none;
  }

  .mc-clip, .mc-shell, .mc-scene {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .mc-scene {
    display: grid;
    place-items: center;
  }

  .mc-scene-a {
    background: radial-gradient(circle at 50% 50%, #182032 0%, #0b0f18 68%);
  }

  .mc-scene-b {
    background: radial-gradient(circle at 50% 44%, #202b42 0%, #0d121d 72%);
    opacity: 0;
  }

  /* Both actors share this one geometry owner. At the cut, each is
  centered at scale 1, so their painted circles match exactly. */
  .mc-circle {
    display: grid;
    place-items: center;
    width: 32cqmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--mc-accent, #4ade80);
    box-shadow: 0 3.2cqh 8cqh color-mix(in srgb, var(--mc-accent, #4ade80) 30%, transparent);
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .mc-label-a {
    display: block;
    max-width: 78%;
    overflow: hidden;
    color: #081018;
    font-size: 5.2cqmin;
    font-weight: 780;
    letter-spacing: -0.035em;
    line-height: 1;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mc-circle-b {
    color: #081018;
  }

  .mc-check {
    width: 34%;
    height: 22%;
    border-left: 2.4cqmin solid currentColor;
    border-bottom: 2.4cqmin solid currentColor;
    transform: translateY(-8%) rotate(-45deg);
  }

  .mc-copy-b {
    position: absolute;
    top: 69%;
    left: 12cqw;
    right: 12cqw;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1.6cqh;
    text-align: center;
  }

  .mc-kicker, .mc-label-b {
    opacity: 0;
  }

  .mc-kicker {
    color: color-mix(in srgb, var(--mc-accent, #4ade80) 76%, #f8fafc);
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
    font-size: 2.1cqmin;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }

  .mc-label-b {
    display: block;
    max-width: 74cqw;
    overflow: hidden;
    color: #f8fafc;
    font-size: 6.8cqmin;
    font-weight: 760;
    letter-spacing: -0.04em;
    line-height: 1.05;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
