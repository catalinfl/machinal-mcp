<!-- Modified Svelte adaptation of registry/components/aurora-drift/aurora-drift.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // Invalid enum overrides return to their declared defaults.
                var accentTokens = {
                  green: "var(--brand, #34d399)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #a78bfa)",
                };
                var moodStyles = {
                  deep: { base: "#050711", strength: "0.42", vignette: "0.62" },
                  bright: { base: "#111827", strength: "0.56", vignette: "0.46" },
                };
                var accent = Object.prototype.hasOwnProperty.call(accentTokens, vars.accent)
                  ? vars.accent
                  : "green";
                var mood = vars.mood === "bright" ? "bright" : "deep";
                var moodStyle = moodStyles[mood];

                root.style.setProperty("--ad-color", accentTokens[accent]);
                root.style.setProperty("--ad-base", moodStyle.base);
                root.style.setProperty("--ad-strength", moodStyle.strength);
                root.style.setProperty("--ad-vignette", moodStyle.vignette);

                var TAU = Math.PI * 2;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var state = { phase: 0 };
                var paths = [
                  { element: root.querySelector(".ad-blob-a"), offset: 0, x: 4.6, y: 3.2 },
                  {
                    element: root.querySelector(".ad-blob-b"),
                    offset: TAU / 3,
                    x: 4.1,
                    y: 3.8,
                  },
                  {
                    element: root.querySelector(".ad-blob-c"),
                    offset: (TAU * 2) / 3,
                    x: 3.6,
                    y: 3,
                  },
                ];

                function renderPose() {
                  // The endpoint uses literal phase zero, avoiding the floating
                  // point residue from Math.sin(2 * PI).
                  var phase = state.phase === TAU ? 0 : state.phase;
                  paths.forEach(function (path) {
                    gsap.set(path.element, {
                      x: Math.sin(phase + path.offset) * path.x + "cqw",
                      y: Math.sin(phase + path.offset + Math.PI / 2) * path.y + "cqh",
                    });
                  });
                }

                var tl = gsap.timeline({ paused: true });

                // HOLD: uniform phase travel produces smooth sine motion. Exactly
                // one whole cycle is completed at the duration boundary.
                tl.to(state, { phase: TAU, duration: duration, ease: "none", onUpdate: renderPose }, 0);

                renderPose();
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used to derive the aurora hues.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "mood", "type": "enum", "role": "style", "label": "Mood", "description": "Base luminance and aurora field strength.", "default": "deep", "options": [&#123; "value": "deep", "label": "Deep" &#125;, &#123; "value": "bright", "label": "Bright" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="aurora-drift" data-duration="4" data-fps="30">
            
    
            <div
              id="aurora-drift-clip"
              class="ad-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="ad-base"></div>
              <div class="ad-blob ad-blob-a"></div>
              <div class="ad-blob ad-blob-b"></div>
              <div class="ad-blob ad-blob-c"></div>
              <div class="ad-vignette"></div>
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
    pointer-events: none;
  }

  .ad-clip, .ad-base, .ad-vignette {
    position: absolute;
    inset: 0;
  }

  .ad-clip {
    overflow: hidden;
  }

  .ad-base {
    background:
      radial-gradient(
        ellipse at 50% 42%,
        color-mix(in srgb, var(--ad-color) 8%, var(--ad-base)) 0%,
        var(--ad-base) 68%
      ),
      var(--ad-base);
  }

  .ad-blob {
    --ad-blob-opacity: 1;
    position: absolute;
    display: block;
    border-radius: 50%;
    filter: blur(12cqmin) saturate(0.84) opacity(var(--ad-blob-opacity));
    mix-blend-mode: screen;
    opacity: var(--ad-strength);
    will-change: transform;
  }

  .ad-blob-a {
    width: 76cqw;
    height: 72cqh;
    left: -18cqw;
    top: -22cqh;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--ad-color) 88%, white) 0%,
      color-mix(in srgb, var(--ad-color) 42%, transparent) 48%,
      transparent 76%
    );
  }

  .ad-blob-b {
    width: 84cqw;
    height: 78cqh;
    right: -28cqw;
    top: -2cqh;
    --ad-blob-opacity: 0.82;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--ad-color) 72%, var(--accent, #38bdf8)) 0%,
      color-mix(in srgb, var(--ad-color) 36%, transparent) 52%,
      transparent 78%
    );
  }

  .ad-blob-c {
    width: 72cqw;
    height: 74cqh;
    left: 18cqw;
    bottom: -34cqh;
    --ad-blob-opacity: 0.68;
    background: radial-gradient(
      ellipse at center,
      color-mix(in srgb, var(--ad-color) 72%, var(--accent-2, #a78bfa)) 0%,
      color-mix(in srgb, var(--ad-color) 32%, transparent) 50%,
      transparent 76%
    );
  }

  .ad-vignette {
    background: radial-gradient(
      ellipse at center,
      transparent 35%,
      rgb(0 0 0 / var(--ad-vignette)) 100%
    );
  }
}
</style>
