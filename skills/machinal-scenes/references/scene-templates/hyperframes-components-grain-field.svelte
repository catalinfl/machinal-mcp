<!-- Modified Svelte adaptation of registry/components/grain-field/grain-field.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var field = root.querySelector(".gf-field");
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
                var densityStyles = {
                  fine: { cell: "3.2cqmin", dot: "0.48cqmin" },
                  coarse: { cell: "5.8cqmin", dot: "0.86cqmin" },
                };
                var accent = Object.prototype.hasOwnProperty.call(accentTokens, vars.accent)
                  ? vars.accent
                  : "green";
                var density = vars.density === "coarse" ? "coarse" : "fine";

                root.style.setProperty("--gf-color", accentTokens[accent]);
                root.style.setProperty("--gf-base", "var(--bg, #080a10)");
                root.style.setProperty("--gf-cell", densityStyles[density].cell);
                root.style.setProperty("--gf-dot", densityStyles[density].dot);

                var TAU = Math.PI * 2;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var state = { phase: 0 };

                function renderPose() {
                  var phase = state.phase === TAU ? 0 : state.phase;
                  var drift = Math.sin(phase);
                  gsap.set(field, { x: drift * 2.8 + "cqw", y: drift * 2.2 + "cqh" });
                }

                var tl = gsap.timeline({ paused: true });

                // HOLD: uniform phase travel becomes a smooth sine drift. One full
                // cycle restores the exact starting pose at the duration boundary.
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
        &#123; "id": "density", "type": "enum", "role": "style", "label": "Density", "description": "Dot size and spacing across the grain field.", "default": "fine", "options": [&#123; "value": "fine", "label": "Fine" &#125;, &#123; "value": "coarse", "label": "Coarse" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used to color the dots and luminance wash.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="grain-field" data-duration="4" data-fps="30">
            
    
            <div
              id="grain-field-clip"
              class="gf-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="gf-base"></div>
              <div class="gf-field"></div>
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

  .gf-clip, .gf-base, .gf-field {
    position: absolute;
  }

  .gf-clip, .gf-base {
    inset: 0;
  }

  .gf-clip {
    overflow: hidden;
  }

  .gf-base {
    background:
      radial-gradient(
        ellipse at 28% 20%,
        color-mix(in srgb, var(--gf-color) 18%, transparent) 0%,
        transparent 56%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--gf-base) 90%, var(--gf-color)) 0%,
        var(--gf-base) 72%
      );
  }

  .gf-field {
    inset: -8cqw;
    background-image: radial-gradient(
      circle,
      color-mix(in srgb, var(--gf-color) 70%, white) 0 var(--gf-dot),
      transparent calc(var(--gf-dot) + 0.12cqmin)
    );
    background-position: 0 0;
    background-size: var(--gf-cell) var(--gf-cell);
    opacity: 0.82;
    will-change: transform;
  }
}
</style>
