<!-- Modified Svelte adaptation of registry/components/decline-chart/decline-chart.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var layout = root.querySelector(".dc-layout");
                var ambient = root.querySelector(".dc-ambient");
                var gloom = root.querySelector(".dc-gloom");
                var label = root.querySelector(".dc-label");
                var value = root.querySelector(".dc-value");
                var line = root.querySelector(".dc-line");
                var endpoint = root.querySelector(".dc-endpoint");
                var lineLength = line.getTotalLength();
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                line.style.strokeDasharray = lineLength + " " + lineLength;

                var startValue = Number.isFinite(vars.start_value) ? vars.start_value : 82;
                var endValue = Number.isFinite(vars.end_value) ? vars.end_value : 34;
                var labelText = vars.label == null ? "Retention" : String(vars.label);

                label.textContent = labelText;

                var IN_BASE = 0.55;
                var OUT_BASE = 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var fixedTotal = IN_BASE + OUT_BASE;
                var phaseScale = duration < fixedTotal ? duration / fixedTotal : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var progress = { value: 0 };

                function renderProgress() {
                  var p = progress.value;
                  line.style.strokeDashoffset = String(lineLength * (1 - p));
                  ambient.style.filter =
                    "saturate(" + (1 - p * 0.72) + ") brightness(" + (1 - p * 0.52) + ")";
                  gloom.style.opacity = String(p * 0.46);
                  endpoint.style.opacity = String(Math.max(0, (p - 0.94) / 0.06));
                  value.textContent = String(Math.round(startValue + (endValue - startValue) * p));
                }

                renderProgress();

                var tl = gsap.timeline({ paused: true });
                tl.fromTo(
                  layout,
                  { opacity: 0, y: "2.5cqh" },
                  { opacity: 1, y: 0, duration: IN, ease: "power2.out" },
                  0,
                );

                if (HOLD > 0) {
                  tl.to(
                    progress,
                    { value: 1, duration: HOLD, ease: "power2.out", onUpdate: renderProgress },
                    IN,
                  );
                } else {
                  tl.call(
                    function () {
                      progress.value = 1;
                      renderProgress();
                    },
                    [],
                    IN,
                  );
                }

                tl.fromTo(
                  endpoint,
                  { scale: 0.72 },
                  { scale: 1, duration: OUT, ease: "power2.out" },
                  OUT_START,
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
        &#123; "id": "label", "type": "string", "role": "content", "label": "Metric label", "description": "Label shown above the declining value.", "default": "Retention" &#125;,
        &#123; "id": "start_value", "type": "number", "role": "content", "label": "Start value", "description": "Metric value at the start of the decline.", "default": 82, "min": 0, "max": 100, "step": 1 &#125;,
        &#123; "id": "end_value", "type": "number", "role": "content", "label": "End value", "description": "Metric value at the bottom of the decline.", "default": 34, "min": 0, "max": 100, "step": 1 &#125;
      ]' data-composition-duration="4" data-composition-id="decline-chart" data-duration="4" data-fps="30">
            
    
            <div
              id="decline-chart-clip"
              class="dc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="dc-ambient"></div>
              <div class="dc-gloom"></div>
              <div class="dc-layout">
                <div class="dc-header">
                  <div class="dc-label"></div>
                  <div class="dc-value"></div>
                </div>
                <svg
                  class="dc-chart"
                  viewBox="0 0 260 240"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <line class="dc-grid" x1="8" y1="55" x2="252" y2="55"></line>
                  <line class="dc-grid" x1="8" y1="120" x2="252" y2="120"></line>
                  <line class="dc-grid" x1="8" y1="185" x2="252" y2="185"></line>
                  <path
                    class="dc-line"
                    d="M 8 24 C 28 28, 44 43, 61 56 S 93 76, 112 92 S 144 111, 163 134 S 193 159, 213 186 S 239 211, 252 222"
                  ></path>
                  <circle class="dc-endpoint" cx="252" cy="222" r="6"></circle>
                </svg>
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
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .dc-clip, .dc-ambient, .dc-gloom {
    position: absolute;
    inset: 0;
  }

  .dc-clip {
    overflow: hidden;
  }

  .dc-ambient {
    background:
      radial-gradient(circle at 24% 16%, rgba(47, 129, 150, 0.55), transparent 46%),
      linear-gradient(145deg, #152f3c 0%, #101a25 48%, #0c1118 100%);
    transform: scale(1.02);
    transform-origin: center;
    will-change: filter;
  }

  .dc-gloom {
    background: #030507;
    opacity: 0;
  }

  .dc-layout {
    position: absolute;
    inset: 9cqh 9cqw 8cqh;
    display: grid;
    /* minmax(0, 1fr): a bare 1fr row inflates to the svg's intrinsic
    aspect height (min-height auto), overflowing the card. */
    grid-template-rows: auto minmax(0, 1fr);
    gap: 5cqh;
    opacity: 0;
  }

  .dc-header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 5cqw;
  }

  .dc-label {
    max-width: 58cqw;
    overflow: hidden;
    color: rgba(226, 232, 240, 0.72);
    font-size: clamp(12px, 3.6cqh, 38px);
    font-weight: 620;
    letter-spacing: 0.05em;
    line-height: 1.1;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .dc-value {
    flex: 0 0 auto;
    color: #f8fafc;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(30px, 12cqh, 118px);
    font-variant-numeric: tabular-nums;
    font-weight: 760;
    letter-spacing: -0.07em;
    line-height: 0.8;
  }

  .dc-chart {
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .dc-grid {
    stroke: rgba(148, 163, 184, 0.18);
    stroke-width: 1;
    vector-effect: non-scaling-stroke;
  }

  .dc-line {
    fill: none;
    stroke: #fb7185;
    stroke-linecap: round;
    stroke-linejoin: round;
    /* No non-scaling-stroke here: with preserveAspectRatio=none Chromium
    applies the dash pattern in screen space, so the user-space
    dasharray from getTotalLength() splits the draw into two visible
    segments. Scaled stroke keeps dashes in user space. */
    stroke-width: 4;
  }

  .dc-endpoint {
    fill: #fecdd3;
    opacity: 0;
    transform-box: fill-box;
    transform-origin: center;
  }
}
</style>
