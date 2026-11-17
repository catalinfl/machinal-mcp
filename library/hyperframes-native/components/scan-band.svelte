<!-- Modified Svelte adaptation of registry/components/scan-band/scan-band.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".sb-stage");
                var wordmark = root.querySelector(".sb-wordmark");
                var band = root.querySelector(".sb-band");
                var clones = root.querySelectorAll(".sb-clone");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.wordmark == null ? "HYPERFRAMES" : String(vars.wordmark);
                var angleValue = vars.band_angle;
                var bandAngle = Number.isFinite(angleValue)
                  ? Math.max(-30, Math.min(30, angleValue))
                  : 12;

                wordmark.textContent = text;
                stage.setAttribute("aria-label", text);
                clones.forEach(function (clone) {
                  clone.textContent = text;
                });

                var lean = Math.tan((bandAngle * Math.PI) / 180) * 50;
                band.style.setProperty("--sb-lean", lean.toFixed(3) + "%");

                var IN_BASE = 0.45;
                var OUT_BASE = 0.45;
                var SWEEP_BASE = 1.65;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var fixedTotal = IN_BASE + OUT_BASE;
                var phaseScale = duration < fixedTotal ? duration / fixedTotal : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var SWEEP = Math.min(SWEEP_BASE, HOLD);

                gsap.set(stage, { opacity: 0 });
                gsap.set(band, { "--sb-band-position": "-60%" });

                var tl = gsap.timeline({ paused: true });
                tl.to(stage, { opacity: 1, duration: IN, ease: "power2.out" }, 0);

                if (SWEEP > 0) {
                  tl.fromTo(
                    band,
                    { "--sb-band-position": "-60%" },
                    {
                      "--sb-band-position": "160%",
                      duration: SWEEP,
                      ease: "power2.out",
                    },
                    IN,
                  );
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
        &#123; "id": "wordmark", "type": "string", "role": "content", "label": "Wordmark", "description": "Text displayed by the scan effect.", "default": "HYPERFRAMES" &#125;,
        &#123; "id": "band_angle", "type": "number", "role": "layout", "label": "Band angle", "description": "Diagonal angle of the distortion band in degrees.", "default": 12, "min": -30, "max": 30, "step": 1, "unit": "deg" &#125;
      ]' data-composition-duration="3.5" data-composition-id="scan-band" data-duration="3.5" data-fps="30">
            
    
            <div
              id="scan-band-clip"
              class="sb-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="sb-stage" role="img">
                <span class="sb-wordmark"></span>
                <div class="sb-band" aria-hidden="true">
                  <span class="sb-clone sb-clone-red"></span>
                  <span class="sb-clone sb-clone-cyan"></span>
                  <span class="sb-clone sb-clone-core"></span>
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
    color: var(--fg, #f7f8fa);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .sb-clip, .sb-stage, .sb-band, .sb-clone {
    position: absolute;
    inset: 0;
  }

  .sb-clip, .sb-stage, .sb-clone {
    display: grid;
    place-items: center;
  }

  .sb-stage {
    opacity: 0;
  }

  .sb-wordmark, .sb-clone {
    font-size: clamp(28px, 13cqw, 150px);
    font-weight: 850;
    line-height: 0.86;
    letter-spacing: -0.065em;
    white-space: nowrap;
  }

  .sb-wordmark {
    color: var(--fg, #f7f8fa);
    text-shadow: 0 1.2cqh 4cqh color-mix(in srgb, #000 45%, transparent);
  }

  .sb-band {
    --sb-band-position: -60%;
    --sb-half: 6%;
    --sb-lean: 10.6%;
    overflow: hidden;
    clip-path: polygon(
      calc(var(--sb-band-position) - var(--sb-half) - var(--sb-lean)) 0%,
      calc(var(--sb-band-position) + var(--sb-half) - var(--sb-lean)) 0%,
      calc(var(--sb-band-position) + var(--sb-half) + var(--sb-lean)) 100%,
      calc(var(--sb-band-position) - var(--sb-half) + var(--sb-lean)) 100%
    );
    will-change: clip-path;
  }

  .sb-clone {
    text-shadow: none;
  }

  .sb-clone-red {
    color: #ff3158;
    opacity: 0.9;
    transform: translateX(-0.8cqw);
  }

  .sb-clone-cyan {
    color: #36efff;
    opacity: 0.9;
    transform: translateX(1.7cqw);
  }

  .sb-clone-core {
    color: var(--fg, #f7f8fa);
    transform: translateX(0.65cqw);
  }
}
</style>
