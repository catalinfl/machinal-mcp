<!-- Modified Svelte adaptation of registry/components/tilt-card/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var insets = { tight: "-18%", standard: "-30%", wide: "-46%" };
              var accents = {
                indigo: {
                  accent: "#312e81",
                  glow: "rgba(125, 211, 252, 0.5)",
                  label: "#a5b4fc",
                  shadow: "rgba(49, 46, 129, 0.34)",
                },
                emerald: {
                  accent: "#065f46",
                  glow: "rgba(110, 231, 183, 0.5)",
                  label: "#6ee7b7",
                  shadow: "rgba(6, 95, 70, 0.34)",
                },
                violet: {
                  accent: "#5b21b6",
                  glow: "rgba(216, 180, 254, 0.5)",
                  label: "#d8b4fe",
                  shadow: "rgba(91, 33, 182, 0.34)",
                },
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              function text(value, fallback) {
                var resolved = value == null ? "" : String(value).trim();
                return resolved.length > 0 ? resolved : fallback;
              }

              var eyebrow = text(vars.eyebrow, "Primitive");
              var headline = text(vars.headline, "Agent-ready motion");
              var inset = insets[pick(insets, vars.glow, "standard")];
              var accent = accents[pick(accents, vars.accent, "indigo")];

              var roots = document.querySelectorAll(".hf-transition-tilt-card");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-tilt-glow-inset", inset);
                root.style.setProperty("--hf-tilt-accent", accent.accent);
                root.style.setProperty("--hf-tilt-glow", accent.glow);
                root.style.setProperty("--hf-tilt-label", accent.label);
                root.style.setProperty("--hf-tilt-shadow", accent.shadow);
                root.querySelector(".hf-transition-tilt-content span").textContent = eyebrow;
                root.querySelector(".hf-transition-tilt-content strong").textContent = headline;
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-tilt-card",
              { opacity: 0, y: 30, rotateX: 0, rotateY: 0 },
              { opacity: 1, y: 0, duration: 0.38, ease: "power2.out" },
              0.3,
            );
            tl.to(
              ".hf-transition-tilt-card",
              { rotateX: -7, rotateY: 10, duration: 0.72, ease: "power3.inOut" },
              0.75,
            );
            tl.to(
              ".hf-transition-tilt-glow",
              { xPercent: 12, yPercent: 10, duration: 0.72, ease: "power3.inOut" },
              0.75,
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
          data-composition-id="tilt-card-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-tilt-card"
              data-composition-variables='[
        &#123;"id": "eyebrow", "type": "string", "role": "content", "label": "Eyebrow", "description": "Small uppercase kicker above the headline.", "default": "Primitive"&#125;,
        &#123;"id": "headline", "type": "string", "role": "content", "label": "Headline", "description": "Large card headline.", "default": "Agent-ready motion"&#125;,
        &#123;"id": "glow", "type": "enum", "role": "motion", "label": "Glow", "description": "How far the corner glow reaches past the card edges, which sets both its spread at rest and how far the timeline drift carries it.", "default": "standard", "options": [&#123;"value": "tight", "label": "Tight"&#125;, &#123;"value": "standard", "label": "Standard"&#125;, &#123;"value": "wide", "label": "Wide"&#125;]&#125;,
        &#123;"id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Colour family of the card gradient, corner glow, eyebrow and drop shadow.", "default": "indigo", "options": [&#123;"value": "indigo", "label": "Indigo"&#125;, &#123;"value": "emerald", "label": "Emerald"&#125;, &#123;"value": "violet", "label": "Violet"&#125;]&#125;
      ]'
            >
              <div class="hf-transition-tilt-glow"></div>
              <div class="hf-transition-tilt-content">
                <span>Primitive</span>
                <strong>Agent-ready motion</strong>
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
    background: #eef2ff;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    transform: scale(2.5); /* ponytail: card was ~16% of frame; 2.5× brings it to ~60% */
  }
  .hf-transition-tilt-card {
    position: relative;
    width: 420px;
    height: 260px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 30px;
    background: linear-gradient(135deg, #18181b, #312e81);
    color: #ffffff;
    font-family: Inter, system-ui, sans-serif;
    transform-style: preserve-3d;
    box-shadow: 0 32px 90px rgba(49, 46, 129, 0.34);
  }
  .hf-transition-tilt-glow {
    position: absolute;
    inset: -30%;
    background: radial-gradient(circle at 30% 20%, rgba(125, 211, 252, 0.5), transparent 36%);
  }
  .hf-transition-tilt-content {
    position: relative;
    display: grid;
    align-content: end;
    gap: 10px;
    height: 100%;
    padding: 34px;
    transform: translateZ(38px);
  }
  .hf-transition-tilt-content span {
    color: #a5b4fc;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hf-transition-tilt-content strong {
    max-width: 280px;
    font-size: 34px;
    line-height: 0.96;
  }


  .hf-transition-tilt-card {
    position: relative;
    width: 420px;
    height: 260px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.18);
    border-radius: 30px;
    background: linear-gradient(135deg, #18181b, var(--hf-tilt-accent, #312e81));
    color: #ffffff;
    font-family: Inter, system-ui, sans-serif;
    transform-style: preserve-3d;
    box-shadow: 0 32px 90px var(--hf-tilt-shadow, rgba(49, 46, 129, 0.34));
  }
  .hf-transition-tilt-glow {
    position: absolute;
    inset: var(--hf-tilt-glow-inset, -30%);
    background: radial-gradient(
      circle at 30% 20%,
      var(--hf-tilt-glow, rgba(125, 211, 252, 0.5)),
      transparent 36%
    );
  }
  .hf-transition-tilt-content {
    position: relative;
    display: grid;
    align-content: end;
    gap: 10px;
    height: 100%;
    padding: 34px;
    transform: translateZ(38px);
  }
  .hf-transition-tilt-content span {
    color: var(--hf-tilt-label, #a5b4fc);
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .hf-transition-tilt-content strong {
    max-width: 280px;
    font-size: 34px;
    line-height: 0.96;
  }
}
</style>
