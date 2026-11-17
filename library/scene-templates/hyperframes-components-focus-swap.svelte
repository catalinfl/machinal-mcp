<!-- Modified Svelte adaptation of registry/components/focus-swap/focus-swap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var cardA = root.querySelector('[data-focus-card="a"]');
                var cardB = root.querySelector('[data-focus-card="b"]');
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // INVARIANT: focus is the only owner of which card advances and
                // which recedes. Invalid input resolves to the declared default.
                var targetIsB = vars.focus !== "a";
                var initialFocused = targetIsB ? cardA : cardB;
                var targetFocused = targetIsB ? cardB : cardA;

                var rawBlur = Number(vars.blurPx);
                var blurPx = Number.isFinite(rawBlur) ? Math.max(0, Math.min(20, rawBlur)) : 6;
                var rawDim = Number(vars.dim);
                var dim = Number.isFinite(rawDim) ? Math.max(0, Math.min(1, rawDim)) : 0.5;
                var blurred = "blur(" + blurPx + "px)";
                var sharp = "blur(0px)";

                // RETIME RANGE: keep the standard 0.20s lead and 0.70s swap. Only
                // short host durations compress them so focus always lands by D.
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "1.5"));
                var SWAP_START = Math.min(0.2, duration * 0.2);
                var SWAP_DURATION = Math.min(0.7, Math.max(0.001, duration - SWAP_START));

                gsap.set(initialFocused, { opacity: 1, scale: 1, filter: sharp });
                gsap.set(targetFocused, { opacity: dim, scale: 0.92, filter: blurred });

                var tl = gsap.timeline({ paused: true });
                tl.to(
                  initialFocused,
                  {
                    opacity: dim,
                    scale: 0.92,
                    filter: blurred,
                    duration: SWAP_DURATION,
                    ease: "power2.out",
                  },
                  SWAP_START,
                );
                tl.to(
                  targetFocused,
                  {
                    opacity: 1,
                    scale: 1,
                    filter: sharp,
                    duration: SWAP_DURATION,
                    ease: "power2.out",
                  },
                  SWAP_START,
                );

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "focus", "type": "enum", "role": "motion", "label": "Final focus", "description": "Card that ends sharp, full-size, and fully opaque.", "default": "b", "options": [&#123; "value": "a", "label": "Card A" &#125;, &#123; "value": "b", "label": "Card B" &#125;] &#125;,
        &#123; "id": "blurPx", "type": "number", "role": "style", "label": "Unfocused blur", "description": "Blur applied to the card outside the viewer focus.", "default": 6, "min": 0, "max": 20, "step": 1, "unit": "px" &#125;,
        &#123; "id": "dim", "type": "number", "role": "style", "label": "Unfocused opacity", "description": "Opacity of the card outside the viewer focus.", "default": 0.5, "min": 0, "max": 1, "step": 0.05 &#125;
      ]' data-composition-id="focus-swap" data-duration="1.5" data-fps="30">
            
    
            <div class="fs-clip clip" data-start="0" data-duration="1.5" data-track-index="0">
              <div class="fs-pair">
                <article class="fs-card" data-focus-card="a" aria-label="Card A, plan">
                  <div class="fs-card-head">
                    <span class="fs-card-letter">A</span>
                    <span class="fs-status">Plan</span>
                  </div>
                  <div class="fs-copy">
                    <h2 class="fs-title">Shape the idea</h2>
                    <p class="fs-detail">Define the brief and align the team.</p>
                  </div>
                  <div class="fs-meter" aria-hidden="true">
                    <div class="fs-meter-fill" style="--fs-meter-width: 58%"></div>
                  </div>
                </article>
    
                <article class="fs-card" data-focus-card="b" aria-label="Card B, launch">
                  <div class="fs-card-head">
                    <span class="fs-card-letter">B</span>
                    <span class="fs-status">Launch</span>
                  </div>
                  <div class="fs-copy">
                    <h2 class="fs-title">Ship the result</h2>
                    <p class="fs-detail">Move from approved work to live impact.</p>
                  </div>
                  <div class="fs-meter" aria-hidden="true">
                    <div class="fs-meter-fill" style="--fs-meter-width: 86%"></div>
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
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #070a12);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .fs-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 7cqh 6cqw;
  }

  .fs-pair {
    width: 100%;
    height: min(72cqh, 52cqw);
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 4cqw;
    align-items: stretch;
  }

  /* EDIT ZONE: visual payload only. Keep the card frames and their
  initial states transform-free because GSAP owns scale and blur. */
  .fs-card {
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 5cqh 3.2cqw;
    overflow: hidden;
    border: 0.16cqw solid var(--border, #34405a);
    border-radius: var(--radius, 22px);
    background: var(--surface, #151c2c);
    box-shadow: 0 2.2cqh 5cqh color-mix(in srgb, var(--bg, #070a12) 72%, transparent);
    transform-origin: center;
    will-change: transform, filter, opacity;
    /* Both cards are the same placeholder material. Which one holds
    attention is said by blur, scale, and opacity, never by hue. */
    --fs-card-accent: color-mix(in srgb, var(--fg, #f8fafc) 72%, var(--surface, #151c2c));
  }

  .fs-card::before {
    content: "";
    position: absolute;
    inset: 0 0 auto;
    height: 0.75cqh;
    background: var(--fs-card-accent);
  }

  .fs-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2, 16px);
  }

  .fs-card-letter {
    display: grid;
    place-items: center;
    width: 5cqw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 13%, var(--surface, #151c2c));
    color: var(--fg, #f8fafc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2.3cqw;
    font-weight: 700;
  }

  .fs-status {
    color: var(--muted, #94a3b8);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 1.25cqw;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .fs-copy {
    display: grid;
    gap: var(--space-1, 8px);
  }

  .fs-title {
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 3.4cqw;
    font-weight: 680;
    line-height: 1;
    letter-spacing: -0.025em;
  }

  .fs-detail {
    color: var(--muted, #94a3b8);
    font-size: 1.45cqw;
    line-height: 1.35;
  }

  .fs-meter {
    height: 1.1cqh;
    overflow: hidden;
    border-radius: var(--radius, 22px);
    background: color-mix(in srgb, var(--border, #34405a) 60%, transparent);
  }

  .fs-meter-fill {
    width: var(--fs-meter-width);
    height: 100%;
    border-radius: inherit;
    background: var(--fs-card-accent);
  }
}
</style>
