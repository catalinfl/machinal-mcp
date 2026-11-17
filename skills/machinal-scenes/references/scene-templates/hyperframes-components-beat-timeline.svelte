<!-- Modified Svelte adaptation of registry/components/beat-timeline/beat-timeline.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal by contract: mounting strips data-composition-id from the
                // flattened inner root, so reading the attribute post-mount would
                // register under null and fail the timeline lookup.
                var compositionId = "beat-timeline";
                var stack = root.querySelector(".bt-stack");

                // EDIT ZONE: declarations live on <html>; this runtime call is the
                // single owner of declared defaults plus per-instance overrides.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var parsedBeatCount = Number(vars.beatCount);
                // INVARIANT: exactly 2..6 integer rows reach the DOM and timeline.
                var beatCount = Math.max(
                  2,
                  Math.min(6, Math.round(Number.isFinite(parsedBeatCount) ? parsedBeatCount : 4)),
                );
                var parsedInterval = Number(vars.interval);
                // INVARIANT: invalid timing falls back once, valid timing clamps to
                // the declared range before duration elasticity is calculated.
                var interval = Math.max(
                  0.2,
                  Math.min(2, Number.isFinite(parsedInterval) ? parsedInterval : 0.6),
                );
                // INVARIANT: labels is always a string; blank or missing entries
                // fall back per row, while authored extra entries stay unused.
                var labelsValue = vars.labels == null ? "One,Two,Three,Four" : String(vars.labels);
                var suppliedLabels = labelsValue.split(",").map(function (label) {
                  return label.trim();
                });

                var parsedDuration = parseFloat(root.dataset.duration || "5.5");
                // INVARIANT: the lifecycle remains finite even under a malformed
                // host duration. The authored and demo durations are both 5.5s.
                var duration = Math.max(0.001, Number.isFinite(parsedDuration) ? parsedDuration : 5.5);

                // RETIME RANGE: these values own the whole pacing decision. The
                // interval and row entrance compress together, never via timeScale.
                var ROW_IN_BASE = 0.4;
                var OUT_BASE = 0.4;
                var baseEntranceSpan = (beatCount - 1) * interval + ROW_IN_BASE;
                var OUT = duration <= OUT_BASE ? duration / 2 : OUT_BASE;
                var entranceBudget = duration - OUT;
                var scale = baseEntranceSpan > entranceBudget ? entranceBudget / baseEntranceSpan : 1;
                var timedInterval = interval * scale;
                var ROW_IN = ROW_IN_BASE * scale;
                var ENTRANCE_SPAN = (beatCount - 1) * timedInterval + ROW_IN;
                var HOLD = Math.max(0, duration - (ENTRANCE_SPAN + OUT));
                var OUT_START = ENTRANCE_SPAN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                var rows = [];
                for (var i = 0; i < beatCount; i += 1) {
                  var title = suppliedLabels[i] || "Beat " + (i + 1);
                  var row = document.createElement("div");
                  row.className = "bt-row";
                  row.innerHTML =
                    '<div class="bt-index" aria-hidden="true"></div>' +
                    '<div class="bt-copy"><div class="bt-title"></div><div class="bt-subtitle"></div></div>';
                  row.querySelector(".bt-index").textContent = String(i + 1).padStart(2, "0");
                  row.querySelector(".bt-title").textContent = title;
                  row.querySelector(".bt-subtitle").textContent =
                    "Cue " +
                    String(i + 1).padStart(2, "0") +
                    "  ·  " +
                    (i * timedInterval).toFixed(2) +
                    "s";
                  stack.appendChild(row);
                  rows.push(row);
                }

                // Explicit entrance and exit endpoints make a direct seek to t=0
                // correct without ever playing the timeline.
                gsap.set(rows, { opacity: 0, y: "2cqh", scale: 0.98 });

                var tl = gsap.timeline({ paused: true });

                // ORCHESTRATION SPINE: every row tween and its declared cue are
                // pinned to the named label, never to a duplicated numeric offset.
                for (var beatIndex = 0; beatIndex < beatCount; beatIndex += 1) {
                  var labelName = "beat" + beatIndex;
                  var cueTime = beatIndex * timedInterval;
                  var cueId = beatIndex === beatCount - 1 ? "beat-tick-final" : "beat-tick";
                  tl.addLabel(labelName, cueTime);
                  tl.to(
                    rows[beatIndex],
                    { opacity: 1, y: "0cqh", scale: 1, duration: ROW_IN, ease: "power2.out" },
                    labelName,
                  );
                  // SFX CUE (IN, beat N): one scene-mixed cue at this beat label.
                  tl.call(fireSfx, [cueId, cueTime], labelName);
                }

                // HOLD is deliberately still. OUT accelerates every landed row away
                // together, asymmetrically paired with the power2.out entrances.
                tl.to(rows, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

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
            data-composition-id="beat-timeline"
            data-start="0"
            data-duration="5.5"
            data-fps="30"
          >
            
    
            <div
              id="beat-timeline-clip"
              class="bt-clip clip"
              data-start="0"
              data-duration="5.5"
              data-track-index="0"
            >
              <div class="bt-stack" aria-label="Beat timeline"></div>
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

  /* Root is styled by ID for mounted CSS scoping. It owns no stage
  dimensions, only the host box and the container-unit basis. */
  #root {
    --ease-standard: cubic-bezier(0.215, 0.61, 0.355, 1);
    --ease-exit: cubic-bezier(0.55, 0.055, 0.675, 0.19);
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, Canvas);
    color: var(--fg, CanvasText);
    font-family: var(--font-body, system-ui, sans-serif);
  }

  .bt-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
  }

  .bt-stack {
    width: 84cqw;
    display: flex;
    flex-direction: column;
    gap: 1.4cqh;
  }

  /* EDIT ZONE: row geometry only. Motion timing is owned by the script's
  RETIME RANGE below, and theme paint remains token-driven here. */
  .bt-row {
    min-height: 10cqh;
    display: grid;
    grid-template-columns: 6cqw 1fr;
    align-items: center;
    column-gap: 2.6cqw;
    padding: 1.4cqh 2.4cqw;
    border: 0.12cqw solid var(--border, currentColor);
    border-radius: var(--radius, 2cqh);
    background: var(--surface, Canvas);
    box-shadow: 0 1.2cqh 4cqh color-mix(in srgb, var(--bg, Canvas) 52%, transparent);
  }

  .bt-index {
    width: 6cqw;
    height: 6cqw;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: var(--brand, currentColor);
    color: var(--bg, Canvas);
    font-family: var(--font-display, system-ui, sans-serif);
    font-size: 1.8cqw;
    font-weight: 750;
    line-height: 1;
  }

  .bt-copy {
    min-width: 0;
  }

  .bt-title {
    overflow: hidden;
    color: var(--fg, CanvasText);
    font-family: var(--font-display, system-ui, sans-serif);
    font-size: min(4.4cqw, 5.2cqh);
    font-weight: 700;
    line-height: 1.04;
    letter-spacing: -0.08cqw;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bt-subtitle {
    margin-top: 0.7cqh;
    color: var(--muted, currentColor);
    font-size: min(1.8cqw, 2.2cqh);
    font-weight: 550;
    line-height: 1.15;
    letter-spacing: 0.04cqw;
  }
}
</style>
