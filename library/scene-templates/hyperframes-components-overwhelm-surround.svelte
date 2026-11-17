<!-- Modified Svelte adaptation of registry/components/overwhelm-surround/overwhelm-surround.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal, not read off the DOM: once mounted, the framework's
                // flattening step strips data-composition-id from the mounted
                // root (see FLATTENED_INNER_ROOT_STRIP_ATTRS in
                // packages/core/src/runtime/flattenedRoot.ts), so
                // root.getAttribute("data-composition-id") would read null post-
                // mount and silently register the timeline under the key "null"
                // instead of "overwhelm-surround". Matches the convention in
                // sub-compositions.md and empty.html: hardcode the id this file is
                // always mounted under.
                var compositionId = "overwhelm-surround";
                var clipEl = root.querySelector(".os-clip");
                var crowdEl = root.querySelector(".os-crowd");
                var centerEl = root.querySelector(".os-center");
                var centerLabelEl = root.querySelector(".os-center-label");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // INVARIANT: one clamped value owns each visual decision. Empty
                // centerLabel remains distinct from a missing value.
                var countValue = Number(vars.count);
                var count = Math.round(
                  Math.max(8, Math.min(24, Number.isFinite(countValue) ? countValue : 16)),
                );
                var centerLabel = vars.centerLabel == null ? "You" : String(vars.centerLabel);
                var intensityValue = Number(vars.intensity);
                var intensity = Math.max(
                  0.5,
                  Math.min(2, Number.isFinite(intensityValue) ? intensityValue : 1),
                );

                centerLabelEl.textContent = centerLabel;

                var labels = [
                  "Inbox",
                  "99+",
                  "Due",
                  "@you",
                  "ASAP",
                  "12",
                  "Review",
                  "!",
                  "Call",
                  "3 pings",
                  "Sync",
                  "Today",
                  "Reply",
                  "8 tabs",
                  "Update",
                  "Now",
                  "Draft",
                  "4 alerts",
                  "Fix",
                  "Follow up",
                  "Queue",
                  "2 min",
                  "Waiting",
                  "+7",
                ];
                var chips = [];

                for (var i = 0; i < count; i += 1) {
                  var chip = document.createElement("div");
                  chip.className = "os-chip";
                  chip.dataset.kind = i % 5 === 1 ? "ping" : i % 3 === 0 ? "alert" : "task";
                  chip.textContent = labels[i];
                  crowdEl.appendChild(chip);
                  chips.push(chip);
                }

                // RETIME RANGE: these constants own global phase pacing. HOLD is
                // the only elastic phase. IN and OUT scale together only when the
                // composition duration is shorter than their combined base time.
                var IN_BASE = 2.2;
                var OUT_BASE = 0.5;
                var TRAVEL_BASE = 0.54;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var travelDuration = Math.min(IN, (TRAVEL_BASE * scale) / Math.sqrt(intensity));
                var arrivalSpan = Math.max(0, IN - travelDuration);
                var arrivalPower = 1.7 + intensity * 0.45;
                var pressure = (intensity - 0.5) / 1.5;

                // Explicit both-endpoints state (gsap.set, never gsap.from()) so a
                // seek to t=0 is always correct without playing the timeline.
                gsap.set(centerEl, { xPercent: -50, yPercent: -50, opacity: 1, scale: 1 });
                gsap.set(clipEl, { opacity: 1 });

                var tl = gsap.timeline({ paused: true });

                chips.forEach(function (chip, index) {
                  // Even angular distribution keeps every count deterministic and
                  // balanced. Index-derived banding creates a compact cluster
                  // without any random state.
                  var angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
                  var directionX = Math.cos(angle);
                  var directionY = Math.sin(angle);
                  var edgeScale = 0.64 / Math.max(Math.abs(directionX), Math.abs(directionY));
                  var entryX = directionX * edgeScale * 100;
                  var entryY = directionY * edgeScale * 100;
                  var band = ((index * 5) % 7) / 6;
                  var radiusX = 27 + band * 9 - pressure * (12 + band * 6);
                  var radiusY = 25 + band * 10 - pressure * (11 + band * 6);
                  var restX = directionX * radiusX;
                  var restY = directionY * radiusY;
                  var progress = index / (count - 1);
                  var arrivalT = arrivalSpan * (1 - Math.pow(1 - progress, arrivalPower));
                  var restRotation = ((index * 29) % 17) - 8;

                  gsap.set(chip, {
                    x: entryX + "cqw",
                    y: entryY + "cqh",
                    xPercent: -50,
                    yPercent: -50,
                    scale: 0.94,
                    opacity: 0,
                    rotation: restRotation * 1.8,
                  });

                  tl.to(
                    chip,
                    {
                      x: restX + "cqw",
                      y: restY + "cqh",
                      scale: 1,
                      opacity: 1,
                      rotation: restRotation,
                      duration: travelDuration,
                      ease: "power2.out",
                    },
                    arrivalT,
                  );
                });

                // HOLD: the peak-density crowd is deliberately still. The calm
                // center remains unchanged, making the surrounding pressure easy
                // to read even at the highest count and intensity.

                tl.to(clipEl, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-id="overwhelm-surround" data-duration="4.5" data-fps="30">
            
    
            <div
              id="overwhelm-surround-clip"
              class="os-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="os-crowd" aria-hidden="true"></div>
              <div class="os-center" data-anchor="overwhelm-surround">
                <span class="os-center-label"></span>
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

  /* Root: sized off the HOST box, never a fixed stage. inset:0 fills
  whatever box the host clip gives it. container-type establishes
  the cqw/cqh basis for every internal measurement below. Styled by
  #root, never a class, see the mount-contract note above. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #0b1120);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .os-clip {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .os-crowd {
    position: absolute;
    inset: 0;
    z-index: 2;
  }

  .os-chip {
    position: absolute;
    left: 50%;
    top: 50%;
    min-width: clamp(7cqw, 9.5cqw, 12cqw);
    min-height: clamp(5.5cqh, 7cqh, 9cqh);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-1, 1cqw);
    padding: var(--space-2, 1.4cqh) var(--space-3, 2cqw);
    border: 0.14cqw solid color-mix(in srgb, var(--border, #334155) 72%, transparent);
    border-radius: clamp(1.4cqw, 2.4cqw, 3.2cqw);
    background: color-mix(in srgb, var(--surface, #1e293b) 94%, var(--bg, #0b1120));
    color: var(--fg, #f8fafc);
    box-shadow:
      0 0.8cqh 2.4cqh color-mix(in srgb, var(--bg, #0b1120) 48%, transparent),
      inset 0 0 0 0.08cqw color-mix(in srgb, var(--fg, #f8fafc) 6%, transparent);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(1.8cqw, 2.4cqw, 3.2cqw);
    font-weight: 700;
    letter-spacing: 0.01em;
    line-height: 1;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .os-chip::before {
    content: "";
    width: clamp(1.2cqw, 1.7cqw, 2.2cqw);
    aspect-ratio: 1;
    flex: 0 0 auto;
    border-radius: 50%;
    background: var(--accent, #38bdf8);
    box-shadow: 0 0 1.5cqw color-mix(in srgb, var(--accent, #38bdf8) 62%, transparent);
  }

  .os-chip[data-kind="alert"] {
    border-color: color-mix(in srgb, var(--brand, #22c55e) 62%, var(--border, #334155));
  }

  .os-chip[data-kind="alert"]::before {
    background: var(--brand, #22c55e);
    box-shadow: 0 0 1.5cqw color-mix(in srgb, var(--brand, #22c55e) 62%, transparent);
  }

  .os-chip[data-kind="ping"] {
    border-radius: 50%;
    min-width: clamp(6cqw, 7.5cqw, 9cqw);
    min-height: auto;
    aspect-ratio: 1;
    padding: var(--space-2, 1.4cqh);
    color: var(--accent, #38bdf8);
  }

  .os-chip[data-kind="ping"]::before {
    display: none;
  }

  .os-center {
    position: absolute;
    left: 50%;
    top: 50%;
    z-index: 5;
    width: clamp(13cqw, 16cqw, 20cqw);
    aspect-ratio: 1.4 / 1;
    display: grid;
    place-items: center;
    border: 0.2cqw solid
    color-mix(in srgb, var(--accent, #38bdf8) 78%, var(--border, #334155));
    border-radius: clamp(2.2cqw, 3.4cqw, 4.5cqw);
    background: var(--surface, #1e293b);
    color: var(--fg, #f8fafc);
    box-shadow:
      0 0 0 0.75cqw color-mix(in srgb, var(--bg, #0b1120) 82%, transparent),
      0 1.2cqh 3.8cqh color-mix(in srgb, var(--accent, #38bdf8) 22%, transparent);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(2.5cqw, 3.6cqw, 4.8cqw);
    font-weight: 760;
    letter-spacing: -0.02em;
    line-height: 1;
    text-align: center;
    transform: translate(-50%, -50%);
  }

  .os-center-label:empty {
    display: none;
  }
}
</style>
