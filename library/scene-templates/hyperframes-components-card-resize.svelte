<!-- Modified Svelte adaptation of registry/components/card-resize/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              // Unrecognised overrides return to their declared defaults.
              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var surfaces = {
                paper: {
                  bg: "#ffffff",
                  ink: "#18181b",
                  muted: "#71717a",
                  border: "#e4e4e7",
                  l2: "rgba(24, 24, 27, 0.45)",
                  l3: "rgba(24, 24, 27, 0.18)",
                  hair: "rgba(24, 24, 27, 0.14)",
                },
                ink: {
                  bg: "#16161a",
                  ink: "#fafafa",
                  muted: "#a1a1aa",
                  border: "#2f2f37",
                  l2: "rgba(250, 250, 250, 0.45)",
                  l3: "rgba(250, 250, 250, 0.18)",
                  hair: "rgba(250, 250, 250, 0.14)",
                },
              };
              // Media treatments, not hue families: the plate itself, the plate hatched,
              // and the plate with a horizon-and-disc glyph that reads as a photo. Each
              // one is written in the surface's own ink ramp, so both surfaces work.
              var medias = {
                ocean: "var(--hf-card-l3)",
                forest:
                  "repeating-linear-gradient(135deg, var(--hf-card-hair) 0 2px, transparent 2px 4px), var(--hf-card-l3)",
                ember:
                  "radial-gradient(circle 11px at 64px 28px, var(--hf-card-l2) 0 100%, transparent 100%), linear-gradient(to top, var(--hf-card-l2) 0 24px, transparent 24px), var(--hf-card-l3)",
              };
              var shadows = {
                flat: "0 2px 10px rgba(0, 0, 0, 0.1)",
                raised: "0 26px 80px rgba(0, 0, 0, 0.12)",
                floating: "0 46px 120px rgba(0, 0, 0, 0.3)",
              };

              var surface = surfaces[pick(surfaces, vars.surface, "paper")];
              var media = medias[pick(medias, vars.accent, "ocean")];
              var shadow = shadows[pick(shadows, vars.elevation, "raised")];

              var roots = document.querySelectorAll(".hf-transition-card-resize");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-card-bg", surface.bg);
                roots[i].style.setProperty("--hf-card-ink", surface.ink);
                roots[i].style.setProperty("--hf-card-muted", surface.muted);
                roots[i].style.setProperty("--hf-card-border", surface.border);
                roots[i].style.setProperty("--hf-card-l2", surface.l2);
                roots[i].style.setProperty("--hf-card-l3", surface.l3);
                roots[i].style.setProperty("--hf-card-hair", surface.hair);
                roots[i].style.setProperty("--hf-card-media", media);
                roots[i].style.setProperty("--hf-card-shadow", shadow);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-card-resize",
              { "--hf-card-w": "330px", "--hf-card-h": "132px", opacity: 0, y: 24 },
              {
                "--hf-card-w": "560px",
                "--hf-card-h": "210px",
                opacity: 1,
                y: 0,
                duration: 0.68,
                ease: "power3.inOut",
              },
              0.35,
            );
            tl.fromTo(
              ".hf-transition-card-copy p",
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.28, ease: "power2.out" },
              0.82,
            );
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="card-resize-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-card-resize"
              data-composition-variables='[
        &#123; "id": "surface", "type": "enum", "role": "style", "label": "Surface", "description": "Card colour scheme: paper is the original white card, ink is a dark card for dark frames.", "default": "paper", "options": [&#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "ink", "label": "Ink" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Treatment of the media thumbnail: a plain plate, a hatched surface, or an image plate with a horizon-and-disc glyph.", "default": "ocean", "options": [&#123; "value": "ocean", "label": "Ocean" &#125;, &#123; "value": "forest", "label": "Forest" &#125;, &#123; "value": "ember", "label": "Ember" &#125;] &#125;,
        &#123; "id": "elevation", "type": "enum", "role": "style", "label": "Elevation", "description": "How far the card lifts off the frame, from a contact shadow to a deep drop.", "default": "raised", "options": [&#123; "value": "flat", "label": "Flat" &#125;, &#123; "value": "raised", "label": "Raised" &#125;, &#123; "value": "floating", "label": "Floating" &#125;] &#125;
      ]'
            >
              <div class="hf-transition-card-media"></div>
              <div class="hf-transition-card-copy">
                <span>Project status</span>
                <strong>Ready to render</strong>
                <p>All scenes validated and queued for export.</p>
              </div>
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
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #fafafa;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale wrapper (not GSAP target) to fill ~60% of 1920px frame */
    transform: scale(2);
    transform-origin: center center;
  }
  .hf-transition-card-resize {
    --hf-card-w: 330px;
    --hf-card-h: 132px;
    display: grid;
    grid-template-columns: 92px 1fr;
    gap: 18px;
    width: var(--hf-card-w);
    height: var(--hf-card-h);
    padding: 18px;
    overflow: hidden;
    border: 1px solid #e4e4e7;
    border-radius: 26px;
    background: #ffffff;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 26px 80px rgba(0, 0, 0, 0.12);
    will-change: width, height, transform;
  }
  .hf-transition-card-media {
    width: 92px;
    height: 92px;
    border-radius: 20px;
    background: rgba(24, 24, 27, 0.18);
    box-shadow: inset 0 0 0 1px rgba(24, 24, 27, 0.14);
  }
  .hf-transition-card-copy {
    display: grid;
    align-content: center;
    gap: 7px;
    min-width: 0;
  }
  .hf-transition-card-copy span {
    color: #71717a;
    font-size: 13px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .hf-transition-card-copy strong {
    white-space: nowrap;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .hf-transition-card-copy p {
    margin: 0;
    color: #71717a;
    font-size: 15px;
    line-height: 1.45;
  }


  .hf-transition-card-resize {
    --hf-card-w: 330px;
    --hf-card-h: 132px;
    /* Placeholder ramp: the surface's own ink at fixed alphas, so the media
    plate inverts with the surface instead of needing a second palette. */
    --hf-card-l2: rgba(24, 24, 27, 0.45);
    --hf-card-l3: rgba(24, 24, 27, 0.18);
    --hf-card-hair: rgba(24, 24, 27, 0.14);
    display: grid;
    grid-template-columns: 92px 1fr;
    gap: 18px;
    width: var(--hf-card-w);
    height: var(--hf-card-h);
    padding: 18px;
    overflow: hidden;
    border: 1px solid var(--hf-card-border, #e4e4e7);
    border-radius: 26px;
    background: var(--hf-card-bg, #ffffff);
    color: var(--hf-card-ink, #18181b);
    font-family: Inter, system-ui, sans-serif;
    box-shadow: var(--hf-card-shadow, 0 26px 80px rgba(0, 0, 0, 0.12));
    will-change: width, height, transform;
  }
  .hf-transition-card-media {
    width: 92px;
    height: 92px;
    border-radius: 20px;
    background: var(--hf-card-media, var(--hf-card-l3));
    box-shadow: inset 0 0 0 1px var(--hf-card-hair);
  }
  .hf-transition-card-copy {
    display: grid;
    align-content: center;
    gap: 7px;
    min-width: 0;
  }
  .hf-transition-card-copy span {
    color: var(--hf-card-muted, #71717a);
    font-size: 13px;
    font-weight: 850;
    text-transform: uppercase;
  }
  .hf-transition-card-copy strong {
    white-space: nowrap;
    font-size: 22px;
    letter-spacing: -0.01em;
  }
  .hf-transition-card-copy p {
    margin: 0;
    color: var(--hf-card-muted, #71717a);
    font-size: 15px;
    line-height: 1.45;
  }
}
</style>
