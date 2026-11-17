<!-- Modified Svelte adaptation of registry/components/camera-scan-gate/camera-scan-gate.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal, not read from the DOM. Mounted flattening strips the
                // root's data-composition-id before timeline registration.
                var compositionId = "camera-scan-gate";
                var stage = root.querySelector(".csg-stage");
                var cornerLayer = root.querySelector(".csg-corner-layer");
                var sweep = root.querySelector(".csg-sweep");
                var target = root.querySelector(".csg-target");
                var ambient = root.querySelector(".csg-ambient");
                var pulse = root.querySelector(".csg-pulse");
                var check = root.querySelector(".csg-check");
                var label = root.querySelector(".csg-label");

                // EDIT ZONE: declared defaults and per-instance overrides have one
                // owner after mount, __hfHost.getVariables().
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};
                var scanColor =
                  vars.scanColor == null || String(vars.scanColor).trim() === ""
                    ? "var(--brand, #22c55e)"
                    : String(vars.scanColor);
                var targetLabel = vars.targetLabel == null ? "" : String(vars.targetLabel);
                var rawSweepSpeed = Number(vars.sweepSpeed);
                // INVARIANT: sweep speed is finite and clamped to the declared
                // 0.8 to 1.6 range. It never changes IN, HOLD, OUT, or sync points.
                var sweepSpeed = Number.isFinite(rawSweepSpeed)
                  ? Math.max(0.8, Math.min(1.6, rawSweepSpeed))
                  : 1;

                root.style.setProperty("--csg-scan-color", scanColor);
                label.textContent = targetLabel;

                var beatValue = parseFloat(getComputedStyle(root).getPropertyValue("--dur-beat"));
                var beat = Number.isFinite(beatValue) && beatValue > 0 ? beatValue : 0.5;
                var AMBIENT_HALF = beat * 1.5;

                // RETIME RANGE: IN_BASE and OUT_BASE own the interaction envelope.
                // The only elastic phase is HOLD. Short durations scale IN and OUT
                // together with one factor, never gsap.timeScale().
                var IN_BASE = 1.05;
                var OUT_BASE = 0.5;
                var STAGE_IN_BASE = 0.28;
                var SWEEP_DURATION_BASE = 0.4;
                var SWEEP_LANDS_BASE = 0.5;
                var LOCK_AT_BASE = 0.68;
                var LOCK_DURATION_BASE = 0.22;
                var CONFIRM_DURATION_BASE = 0.2;
                var PULSE_HALF_BASE = 0.18;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGE_IN = STAGE_IN_BASE * scale;
                var SWEEP_LANDS = SWEEP_LANDS_BASE * scale;
                var SWEEP_DURATION = (SWEEP_DURATION_BASE / sweepSpeed) * scale;
                var SWEEP_START = Math.max(0, SWEEP_LANDS - SWEEP_DURATION);
                var LOCK_AT = LOCK_AT_BASE * scale;
                var LOCK_DURATION = LOCK_DURATION_BASE * scale;
                var CONFIRM_DURATION = CONFIRM_DURATION_BASE * scale;
                var PULSE_HALF = PULSE_HALF_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // Explicit both-endpoints state before timeline construction keeps
                // direct seek to t=0 correct without playing through prior frames.
                gsap.set(stage, { opacity: 0, scale: 0.94 });
                gsap.set(cornerLayer, { scale: 1 });
                gsap.set(sweep, { opacity: 1, yPercent: 0 });
                gsap.set(target, { opacity: 0, scale: 0.96 });
                gsap.set(ambient, { opacity: 0, scale: 1 });
                gsap.set(pulse, { opacity: 0, scale: 0.9 });
                gsap.set(check, { opacity: 0, scale: 0.94 });
                gsap.set(label, { opacity: 0, y: "1.2cqh", scale: 0.96 });

                var tl = gsap.timeline({ paused: true });

                // IN: settle, scan, then lock. The sweep uses --ease-standard's
                // GSAP equivalent and lands at a fixed offset inside IN.
                tl.to(stage, { opacity: 1, scale: 1, duration: STAGE_IN, ease: "power2.out" }, 0);
                tl.to(
                  sweep,
                  { yPercent: 100, duration: SWEEP_DURATION, ease: "power2.out" },
                  SWEEP_START,
                );
                tl.set(sweep, { opacity: 0 }, SWEEP_LANDS);

                // recognition-lock is the single causal gate. Corner tightening is
                // the one moderate --ease-overshoot motion in this primitive.
                tl.to(
                  cornerLayer,
                  { scale: 0.6, duration: LOCK_DURATION, ease: "back.out(1.7)" },
                  LOCK_AT,
                );
                tl.to(
                  target,
                  { opacity: 1, scale: 1, duration: CONFIRM_DURATION, ease: "power2.out" },
                  LOCK_AT,
                );
                tl.to(
                  check,
                  { opacity: 1, scale: 1, duration: CONFIRM_DURATION, ease: "power2.out" },
                  LOCK_AT,
                );
                tl.to(
                  label,
                  { opacity: 1, y: 0, scale: 1, duration: CONFIRM_DURATION, ease: "power2.out" },
                  LOCK_AT,
                );
                tl.to(
                  pulse,
                  {
                    opacity: 0.9,
                    scale: 1.25,
                    duration: PULSE_HALF,
                    ease: "power2.out",
                    yoyo: true,
                    repeat: 1,
                  },
                  LOCK_AT,
                );
                // Side-effect invariant: this timeline callback is the only actor
                // that emits lock-chime, once at the recognition-lock sync point.
                tl.call(
                  function () {
                    fireSfx("lock-chime", LOCK_AT);
                  },
                  [],
                  LOCK_AT,
                );

                // HOLD: a separate layer breathes with a finite repeat count, so
                // the resolved gate stays alive without competing with lock tweens.
                if (HOLD > AMBIENT_HALF) {
                  var ambientRepeat = Math.max(0, Math.floor(HOLD / AMBIENT_HALF) - 1);
                  tl.to(
                    ambient,
                    {
                      opacity: 0.3,
                      scale: 1.015,
                      duration: AMBIENT_HALF,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: ambientRepeat,
                    },
                    HOLD_START,
                  );
                }

                // OUT: asymmetric release. HOLD alone absorbs duration changes.
                tl.to(stage, { opacity: 0, scale: 0.98, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="camera-scan-gate"
            data-start="0"
            data-duration="4"
            data-fps="30"
          >
            
    
            <div
              id="camera-scan-gate-clip"
              class="csg-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="csg-stage" role="img" aria-label="Camera recognition scanner">
                <div class="csg-frame">
                  <div class="csg-grid" aria-hidden="true"></div>
                </div>
                <div class="csg-ambient" aria-hidden="true"></div>
                <div class="csg-target" aria-hidden="true"></div>
                <div class="csg-scan-window" aria-hidden="true">
                  <div class="csg-sweep">
                    <div class="csg-scan-line"></div>
                  </div>
                </div>
                <div class="csg-corner-layer" aria-hidden="true">
                  <span class="csg-corner csg-corner-tl"></span>
                  <span class="csg-corner csg-corner-tr"></span>
                  <span class="csg-corner csg-corner-br"></span>
                  <span class="csg-corner csg-corner-bl"></span>
                </div>
                <div class="csg-confirmation">
                  <span class="csg-pulse" aria-hidden="true"></span>
                  <span class="csg-check" aria-hidden="true"></span>
                  <span class="csg-label"></span>
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

  /* INVARIANT: the host owns dimensions. #root fills that box and
  establishes the cqw/cqh basis for every visible measurement. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .csg-clip {
    position: relative;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b1120);
  }

  .csg-stage {
    position: relative;
    width: min(64cqw, 76cqh);
    aspect-ratio: 1;
    opacity: 0;
  }

  /* EDIT ZONE: the outer viewfinder is a square so one centered scale
  operation tightens all four brackets onto the target equally. */
  .csg-frame, .csg-corner-layer, .csg-scan-window {
    position: absolute;
    inset: 0;
  }

  .csg-frame {
    border: 0.16cqw solid color-mix(in srgb, var(--border, #334155) 74%, transparent);
    border-radius: var(--space-2, 2.4cqw);
    background: color-mix(in srgb, var(--surface, #1e293b) 34%, transparent);
    box-shadow: inset 0 0 5cqw color-mix(in srgb, var(--bg, #0b1120) 60%, transparent);
  }

  .csg-grid {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background-image:
      linear-gradient(
        to right,
        transparent 33%,
        color-mix(in srgb, var(--border, #334155) 32%, transparent) 33% 33.25%,
        transparent 33.25% 66.5%,
        color-mix(in srgb, var(--border, #334155) 32%, transparent) 66.5% 66.75%,
        transparent 66.75%
      ),
      linear-gradient(
        to bottom,
        transparent 33%,
        color-mix(in srgb, var(--border, #334155) 32%, transparent) 33% 33.25%,
        transparent 33.25% 66.5%,
        color-mix(in srgb, var(--border, #334155) 32%, transparent) 66.5% 66.75%,
        transparent 66.75%
      );
    opacity: 0.55;
  }

  .csg-ambient {
    position: absolute;
    inset: -4%;
    border: 0.45cqw solid
    color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 48%, transparent);
    border-radius: var(--space-3, 3.2cqw);
    box-shadow: 0 0 4.5cqw
    color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 38%, transparent);
    opacity: 0;
  }

  .csg-corner-layer {
    transform-origin: center;
    z-index: 3;
  }

  .csg-corner {
    position: absolute;
    width: 18%;
    height: 18%;
    border-color: var(--csg-scan-color, var(--brand, #22c55e));
    border-style: solid;
    filter: drop-shadow(
      0 0 0.9cqw
      color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 56%, transparent)
    );
  }

  .csg-corner-tl {
    top: 0;
    left: 0;
    border-width: 0.65cqw 0 0 0.65cqw;
    border-radius: var(--space-2, 2.4cqw) 0 0;
  }

  .csg-corner-tr {
    top: 0;
    right: 0;
    border-width: 0.65cqw 0.65cqw 0 0;
    border-radius: 0 var(--space-2, 2.4cqw) 0 0;
  }

  .csg-corner-br {
    right: 0;
    bottom: 0;
    border-width: 0 0.65cqw 0.65cqw 0;
    border-radius: 0 0 var(--space-2, 2.4cqw);
  }

  .csg-corner-bl {
    bottom: 0;
    left: 0;
    border-width: 0 0 0.65cqw 0.65cqw;
    border-radius: 0 0 0 var(--space-2, 2.4cqw);
  }

  .csg-scan-window {
    z-index: 2;
    inset: 3.5%;
    overflow: hidden;
  }

  .csg-sweep {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .csg-scan-line {
    position: absolute;
    inset: 0 0 auto;
    width: 100%;
    height: 0.38cqh;
    border-radius: 999cqw;
    background: var(--csg-scan-color, var(--brand, #22c55e));
    box-shadow:
      0 0 1.2cqw var(--csg-scan-color, var(--brand, #22c55e)),
      0 1.8cqh 3.6cqh
      color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 42%, transparent);
  }

  .csg-target {
    position: absolute;
    z-index: 1;
    width: 60%;
    height: 60%;
    top: 20%;
    left: 20%;
    border: 0.2cqw solid
    color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 65%, transparent);
    border-radius: var(--space-2, 2.4cqw);
    background: color-mix(
      in srgb,
      var(--csg-scan-color, var(--brand, #22c55e)) 7%,
      transparent
    );
    opacity: 0;
  }

  .csg-confirmation {
    position: absolute;
    z-index: 4;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 2.2cqh);
  }

  .csg-pulse {
    position: absolute;
    width: 30%;
    aspect-ratio: 1;
    border: 0.42cqw solid var(--csg-scan-color, var(--brand, #22c55e));
    border-radius: 50%;
    box-shadow: 0 0 4.5cqw
    color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 58%, transparent);
    opacity: 0;
  }

  .csg-check {
    display: block;
    width: 8.5%;
    height: 15%;
    margin-top: -5%;
    border-right: 0.8cqw solid var(--csg-scan-color, var(--brand, #22c55e));
    border-bottom: 0.8cqw solid var(--csg-scan-color, var(--brand, #22c55e));
    filter: drop-shadow(
      0 0 1.1cqw
      color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 65%, transparent)
    );
    opacity: 0;
    transform: rotate(45deg);
  }

  .csg-label {
    min-width: 34%;
    padding: var(--space-1, 1cqh) var(--space-3, 3cqw);
    border: 0.14cqw solid
    color-mix(in srgb, var(--csg-scan-color, var(--brand, #22c55e)) 48%, transparent);
    border-radius: 999cqw;
    background: color-mix(in srgb, var(--surface, #1e293b) 88%, transparent);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(2cqh, 2.8cqw, 3.3cqh);
    font-weight: 760;
    letter-spacing: 0.035em;
    line-height: 1.1;
    text-align: center;
    opacity: 0;
  }

  .csg-label:empty {
    display: none;
  }
}
</style>
