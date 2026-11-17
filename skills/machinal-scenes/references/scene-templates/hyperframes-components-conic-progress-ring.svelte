<!-- Modified Svelte adaptation of registry/components/conic-progress-ring/conic-progress-ring.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "conic-progress-ring";
                var stage = root.querySelector(".ring-stage");
                var ring = root.querySelector(".ring");
                var label = root.querySelector(".ring-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                /* INVARIANT: zero is a valid progress value, so missing and zero
                   are handled separately. Both numeric controls clamp to their
                   declared ranges before they reach layout or animation. */
                var progressValue = Number(vars.progress);
                var targetProgress = Number.isFinite(progressValue)
                  ? Math.max(0, Math.min(100, progressValue))
                  : 100;
                var thicknessValue = Number(vars.thickness);
                var thickness = Number.isFinite(thicknessValue)
                  ? Math.max(4, Math.min(30, thicknessValue))
                  : 12;
                var labelText = vars.label == null ? "100" : String(vars.label);
                var labelMatch = labelText.trim().match(/^(-?\d+(?:\.\d+)?)(.*)$/);
                var labelTarget = labelMatch ? Number(labelMatch[1]) : null;
                var labelSuffix = labelMatch ? labelMatch[2] : "";

                ring.style.setProperty("--ring-thickness", thickness + "%");

                function updateLabel(fillPercent) {
                  var ratio = targetProgress > 0 ? fillPercent / targetProgress : 1;
                  label.textContent =
                    labelTarget == null ? labelText : Math.round(labelTarget * ratio) + labelSuffix;
                  ring.setAttribute("aria-valuenow", String(Math.round(fillPercent)));
                }

                updateLabel(0);

                /* RETIME RANGE: IN_BASE and OUT_BASE own the lifecycle timing.
                   The fill uses --ease-standard's GSAP form, power2.out. */
                var IN_BASE = 1.4;
                var OUT_BASE = 0.5;
                var durationValue = Number(root.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var scale = duration < IN_BASE + OUT_BASE ? duration / (IN_BASE + OUT_BASE) : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  ring,
                  { "--ring-progress": "0%" },
                  {
                    "--ring-progress": targetProgress + "%",
                    duration: IN,
                    ease: "power2.out",
                    onUpdate: function () {
                      updateLabel(parseFloat(ring.style.getPropertyValue("--ring-progress")) || 0);
                    },
                  },
                  0,
                );
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
        &#123; "id": "progress", "type": "number", "role": "content", "label": "Progress", "description": "Target angular fill from 0 to 100.", "default": 100, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "thickness", "type": "number", "role": "layout", "label": "Thickness", "description": "Ring stroke thickness as a percent of the ring radius.", "default": 12, "min": 4, "max": 30, "step": 1, "unit": "%" &#125;,
        &#123; "id": "label", "type": "string", "role": "content", "label": "Center label", "description": "Numeric target shown in the center and counted in sync with the fill.", "default": "100" &#125;
      ]' data-composition-id="conic-progress-ring" data-duration="4" data-fps="30">
            
    
            <div
              id="conic-progress-ring-clip"
              class="ring-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="ring-stage">
                <div
                  class="ring"
                  role="progressbar"
                  aria-label="Progress"
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-valuenow="0"
                ></div>
                <div class="ring-label" aria-hidden="true">0</div>
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
  /* The registration must live in this document-level stylesheet.
  Registrations inside shadow roots are ignored by the platform. */
  @property --ring-progress {
    syntax: "<percentage>";
    inherits: false;
    initial-value: 0%;
  }

  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  /* INVARIANT: #root is the mount contract owner. The host owns the
  box, and every internal measurement is relative to that box. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f4f7fb);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
  }

  .ring-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  .ring-stage {
    position: relative;
    width: min(68cqw, 68cqh);
    aspect-ratio: 1;
  }

  /* EDIT ZONE: --ring-thickness is the only geometry control.
  --ring-progress is the only registered animation scalar. Paint
  comes only from the host theme's surface and brand tokens. */
  .ring {
    --ring-thickness: 12%;
    --ring-progress: 0%;
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: conic-gradient(
      from -90deg,
      var(--brand, #35d6a0) 0 var(--ring-progress),
      var(--surface, #1b2938) var(--ring-progress) 100%
    );
    -webkit-mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--ring-thickness)),
      var(--fg, #f4f7fb) 0
    );
    mask: radial-gradient(
      farthest-side,
      transparent calc(100% - var(--ring-thickness)),
      var(--fg, #f4f7fb) 0
    );
  }

  .ring-label {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    color: var(--fg, #f4f7fb);
    font-size: min(18cqw, 18cqh);
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    letter-spacing: -0.04em;
    line-height: 1;
    text-align: center;
  }
}
</style>
