<!-- Modified Svelte adaptation of registry/components/store-badge-lockup/store-badge-lockup.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "store-badge-lockup";
                var lockup = root.querySelector(".sbl-lockup");
                var headlineElement = root.querySelector(".sbl-headline");
                var appleBadge = root.querySelector(".sbl-apple");
                var googleBadge = root.querySelector(".sbl-google");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                /* INVARIANT: getVariables() owns all three public decisions.
                   Missing values use the declared defaults. Only an explicit
                   "no" removes a badge, while an empty headline remains empty. */
                var headline = vars.headline == null ? "Get the app" : String(vars.headline);
                var showApple = vars.showApple === "no" ? "no" : "yes";
                var showGoogle = vars.showGoogle === "no" ? "no" : "yes";

                headlineElement.textContent = headline;
                if (showApple === "no") {
                  appleBadge.remove();
                }
                if (showGoogle === "no") {
                  googleBadge.remove();
                }

                var badgeElements = root.querySelectorAll(".sbl-badge");

                /* RETIME RANGE: these constants own the complete lifecycle. The
                   headline finishes first. Both badges then rise and fade on
                   --ease-standard's GSAP owner, power2.out, with a small stagger. */
                var IN_BASE = 1.2;
                var OUT_BASE = 0.45;
                var HEADLINE_START_BASE = 0.05;
                var HEADLINE_DURATION_BASE = 0.48;
                var BADGE_START_BASE = 0.22;
                var BADGE_DURATION_BASE = 0.68;
                var BADGE_STAGGER_BASE = 0.1;
                var durationValue = Number(root.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var scale = duration < IN_BASE + OUT_BASE ? duration / (IN_BASE + OUT_BASE) : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;

                var timeline = gsap.timeline({ paused: true });

                timeline.fromTo(
                  headlineElement,
                  { y: "22%", opacity: 0 },
                  {
                    y: "0%",
                    opacity: 1,
                    duration: HEADLINE_DURATION_BASE * scale,
                    ease: "power2.out",
                  },
                  HEADLINE_START_BASE * scale,
                );

                if (badgeElements.length > 0) {
                  timeline.fromTo(
                    badgeElements,
                    { y: "28%", opacity: 0 },
                    {
                      y: "0%",
                      opacity: 1,
                      duration: BADGE_DURATION_BASE * scale,
                      stagger: BADGE_STAGGER_BASE * scale,
                      ease: "power2.out",
                    },
                    BADGE_START_BASE * scale,
                  );
                }

                timeline.to(lockup, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                timeline.seek(0);

                
                __hfTimelineSlot.set(timeline);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "headline", "type": "string", "role": "content", "label": "Headline", "description": "Short action line shown above the store badges.", "default": "Get the app" &#125;,
        &#123; "id": "showApple", "type": "enum", "role": "content", "label": "Show App Store", "description": "Show or hide the App Store badge.", "default": "yes", "options": [&#123; "value": "yes", "label": "Yes" &#125;, &#123; "value": "no", "label": "No" &#125;] &#125;,
        &#123; "id": "showGoogle", "type": "enum", "role": "content", "label": "Show Google Play", "description": "Show or hide the Google Play badge.", "default": "yes", "options": [&#123; "value": "yes", "label": "Yes" &#125;, &#123; "value": "no", "label": "No" &#125;] &#125;
      ]' data-composition-id="store-badge-lockup" data-duration="4" data-fps="30">
            
    
            <div
              id="store-badge-lockup-clip"
              class="sbl-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <section class="sbl-lockup" aria-label="Download the app">
                <h1 class="sbl-headline"></h1>
                <div class="sbl-badges">
                  <div class="sbl-badge sbl-apple" role="img" aria-label="Download on the App Store">
                    <span class="sbl-glyph" aria-hidden="true">
                      <span class="sbl-apple-mark">A</span>
                    </span>
                    <span class="sbl-copy" aria-hidden="true">
                      <span class="sbl-microcopy">Download on the</span>
                      <span class="sbl-label">App Store</span>
                    </span>
                  </div>
    
                  <div class="sbl-badge sbl-google" role="img" aria-label="Get it on Google Play">
                    <span class="sbl-glyph" aria-hidden="true">
                      <span class="sbl-play-mark"></span>
                    </span>
                    <span class="sbl-copy" aria-hidden="true">
                      <span class="sbl-microcopy">GET IT ON</span>
                      <span class="sbl-label">Google Play</span>
                    </span>
                  </div>
                </div>
              </section>
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
    color: var(--fg, #f7f9fc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .sbl-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: var(--space-3, 4.8cqh);
    overflow: hidden;
    background: var(--bg, #080b13);
  }

  .sbl-lockup {
    width: min(88cqw, 154cqh);
    display: grid;
    justify-items: center;
    gap: min(6cqw, 7cqh);
  }

  .sbl-headline {
    margin: 0;
    max-width: 82cqw;
    color: var(--fg, #f7f9fc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(8.2cqw, 12.5cqh);
    font-weight: 750;
    line-height: 1;
    letter-spacing: -0.045em;
    text-align: center;
    text-wrap: balance;
    will-change: transform, opacity;
  }

  .sbl-badges {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 2.4cqh);
  }

  /* EDIT ZONE: both destinations share one badge geometry and one
  text hierarchy. This single rule owns sizing, spacing, and order
  so the pair cannot drift into mismatched lockups. */
  .sbl-badge {
    width: min(40cqw, 67cqh);
    aspect-ratio: 3.12 / 1;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-1, 1.2cqh);
    padding: min(2.2cqw, 3.2cqh) min(3cqw, 4.8cqh);
    border: 0.16cqh solid var(--border, #3b4659);
    border-radius: calc(var(--radius, 2.4cqh) * 4);
    background: var(--surface, #151c29);
    color: var(--fg, #f7f9fc);
    box-shadow: 0 1.5cqh 3.8cqh color-mix(in srgb, var(--bg, #080b13) 70%, transparent);
    will-change: transform, opacity;
  }

  .sbl-glyph {
    width: min(6.7cqw, 10.5cqh);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    flex: none;
    border: 0.16cqh solid color-mix(in srgb, var(--fg, #f7f9fc) 28%, transparent);
    border-radius: calc(var(--radius, 2.4cqh) * 0.72);
    background: color-mix(in srgb, var(--brand, #7c6cff) 20%, var(--surface, #151c29));
    color: var(--fg, #f7f9fc);
  }

  .sbl-apple-mark {
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(3.2cqw, 5.2cqh);
    font-weight: 800;
    line-height: 1;
  }

  .sbl-play-mark {
    width: 42%;
    aspect-ratio: 0.88;
    clip-path: polygon(8% 0, 100% 50%, 8% 100%);
    background: currentColor;
  }

  .sbl-copy {
    min-width: 0;
    display: grid;
    gap: min(0.4cqw, 0.6cqh);
  }

  .sbl-microcopy {
    color: var(--muted, #aab4c5);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    font-size: min(1.65cqw, 2.65cqh);
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .sbl-label {
    color: var(--fg, #f7f9fc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(3.75cqw, 5.8cqh);
    font-weight: 720;
    line-height: 1;
    letter-spacing: -0.025em;
    white-space: nowrap;
  }
}
</style>
