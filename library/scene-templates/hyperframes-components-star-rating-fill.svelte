<!-- Modified Svelte adaptation of registry/components/star-rating-fill/star-rating-fill.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".srf-stage");
                var stars = root.querySelector(".srf-stars");
                var baseLayer = root.querySelector(".srf-base");
                var fillLayer = root.querySelector(".srf-fill");
                var valueElement = root.querySelector(".srf-value");
                var starTemplate = root.querySelector("#star-rating-fill-star-template");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                /* INVARIANT: zero is a valid rating. Missing values and zero are
                   handled separately, then every public number is clamped once. */
                var ratingValue = vars.rating == null || vars.rating === "" ? NaN : Number(vars.rating);
                var requestedRating = Number.isFinite(ratingValue)
                  ? Math.max(0, Math.min(5, ratingValue))
                  : 4.8;
                var starCountValue =
                  vars.starCount == null || vars.starCount === "" ? NaN : Number(vars.starCount);
                var starCount = Number.isFinite(starCountValue) ? Math.round(starCountValue) : 5;
                starCount = Math.max(1, Math.min(10, starCount));
                var rating = Math.min(requestedRating, starCount);
                var showValue = vars.showValue === "no" ? "no" : "yes";
                var fillPercent = (rating / starCount) * 100;

                stars.style.setProperty("--srf-count", String(starCount));
                stars.setAttribute("aria-label", rating.toFixed(1) + " out of " + starCount + " stars");
                valueElement.hidden = showValue === "no";

                /* The template is the single owner of star geometry. Both paint
                   layers clone it so their silhouettes cannot drift. */
                var baseFragment = document.createDocumentFragment();
                var fillFragment = document.createDocumentFragment();
                for (var index = 0; index < starCount; index += 1) {
                  baseFragment.appendChild(starTemplate.content.firstElementChild.cloneNode(true));
                  fillFragment.appendChild(starTemplate.content.firstElementChild.cloneNode(true));
                }
                baseLayer.replaceChildren(baseFragment);
                fillLayer.replaceChildren(fillFragment);

                var baseCells = baseLayer.querySelectorAll(".srf-star-cell");
                var fillCells = fillLayer.querySelectorAll(".srf-star-cell");
                var valueState = { current: 0 };

                /* RETIME RANGE: these values own the full lifecycle. The sweep
                   uses --ease-standard's GSAP owner, power2.out. */
                var IN_BASE = 1.5;
                var OUT_BASE = 0.4;
                var FILL_START_BASE = 0.2;
                var FILL_DURATION_BASE = 1.1;
                var POP_DURATION_BASE = 0.2;
                var durationValue = Number(root.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var scale = duration < IN_BASE + OUT_BASE ? duration / (IN_BASE + OUT_BASE) : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var FILL_START = FILL_START_BASE * scale;
                var FILL_DURATION = FILL_DURATION_BASE * scale;
                var POP_DURATION = POP_DURATION_BASE * scale;

                var timeline = gsap.timeline({ paused: true });

                timeline.fromTo(
                  fillLayer,
                  { clipPath: "inset(0 100% 0 0)" },
                  {
                    clipPath: "inset(0 " + (100 - fillPercent) + "% 0 0)",
                    duration: FILL_DURATION,
                    ease: "power2.out",
                  },
                  FILL_START,
                );

                if (showValue === "yes") {
                  timeline.to(
                    valueState,
                    {
                      current: rating,
                      duration: FILL_DURATION,
                      ease: "power2.out",
                      onUpdate: function () {
                        valueElement.textContent = valueState.current.toFixed(1);
                      },
                    },
                    FILL_START,
                  );
                }

                /* Per-star pops are subordinate to the sweep and occur in the
                   same left-to-right order. They never change the fill endpoint. */
                var popCount = Math.ceil(rating);
                for (var popIndex = 0; popIndex < popCount; popIndex += 1) {
                  var popAt = FILL_START + FILL_DURATION * (popIndex / Math.max(1, rating)) * 0.82;
                  var popTargets = [baseCells[popIndex], fillCells[popIndex]];
                  timeline.to(
                    popTargets,
                    { scale: 1.06, duration: POP_DURATION * 0.45, ease: "power2.out" },
                    popAt,
                  );
                  timeline.to(
                    popTargets,
                    { scale: 1, duration: POP_DURATION * 0.55, ease: "power2.out" },
                    popAt + POP_DURATION * 0.45,
                  );
                }

                timeline.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                timeline.seek(0);

                
                __hfTimelineSlot.set(timeline);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="star-rating-fill"
            data-start="0"
            data-duration="4"
            data-fps="30"
          >
            
    
            <div
              id="star-rating-fill-clip"
              class="srf-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="srf-stage">
                <div class="srf-stars" role="img" aria-label="0 out of 5 stars">
                  <div class="srf-layer srf-base" aria-hidden="true"></div>
                  <div class="srf-layer srf-fill" aria-hidden="true"></div>
                </div>
                <div class="srf-value" aria-hidden="true">0.0</div>
              </div>
            </div>
    
            <template id="star-rating-fill-star-template">
              <span class="srf-star-cell">
                <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
                  <path
                    d="M50 0 61.8 36.2 100 36.2 69.1 58.6 80.9 95 50 72.4 19.1 95 30.9 58.6 0 36.2 38.2 36.2Z"
                  />
                </svg>
              </span>
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

  /* INVARIANT: #root owns only the mount boundary. The host owns the
  box, while all internal geometry stays container-relative. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, CanvasText);
    font-family: var(--font-display, system-ui);
  }

  .srf-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .srf-stage {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 3cqw);
  }

  /* EDIT ZONE: the row owns only its responsive presentation size.
  --srf-count is supplied by the clamped public starCount value. */
  .srf-stars {
    --srf-count: 5;
    position: relative;
    width: min(68cqw, calc(72cqh * var(--srf-count)));
  }

  .srf-layer {
    width: 100%;
    display: flex;
    align-items: center;
  }

  .srf-base {
    color: color-mix(in srgb, var(--muted, currentColor) 68%, var(--surface, transparent));
  }

  .srf-fill {
    position: absolute;
    inset: 0;
    color: var(--brand, currentColor);
    clip-path: inset(0 100% 0 0);
  }

  .srf-star-cell {
    display: block;
    flex: 1 1 0;
    min-width: 0;
    aspect-ratio: 1;
    transform-origin: center;
  }

  .srf-star-cell svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
    fill: currentColor;
  }

  .srf-value {
    min-width: 2.2em;
    color: var(--fg, currentColor);
    font-size: min(9cqw, 16cqh);
    font-weight: 720;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.04em;
    line-height: 1;
    text-align: right;
  }
}
</style>
