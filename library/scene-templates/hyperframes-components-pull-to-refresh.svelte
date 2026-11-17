<!-- Modified Svelte adaptation of registry/components/pull-to-refresh/pull-to-refresh.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal by contract. Mounted roots lose data-composition-id
                // during flattening, so reading the id back from the DOM can
                // register the timeline under "null".
                var compositionId = "pull-to-refresh";
                var clip = root.querySelector(".ptr-clip");
                var indicator = root.querySelector(".ptr-indicator");
                var content = root.querySelector(".ptr-content");
                var pullLabel = root.querySelector(".ptr-pull-label");
                var releaseLabel = root.querySelector(".ptr-release-label");
                var loadingLabel = root.querySelector(".ptr-loading-label");
                var ring = root.querySelector(".ptr-ring-core");
                var arrow = root.querySelector(".ptr-arrow-glyph");
                var dots = Array.prototype.slice.call(root.querySelectorAll(".ptr-dot"));
                var updated = root.querySelector(".ptr-updated");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // INVARIANT: only finite 60–220 input reaches the physics owner.
                // Zero, NaN, and strings outside the range fall back explicitly.
                var rawPull = Number(vars.pullDistance);
                var pullDistance = Number.isFinite(rawPull)
                  ? Math.max(60, Math.min(220, rawPull))
                  : 120;
                // INVARIANT: only one of the declared indicator variants reaches
                // the renderer. Invalid overrides resolve to the declared default.
                var spinnerStyle =
                  vars.spinnerStyle === "arrow" || vars.spinnerStyle === "dots"
                    ? vars.spinnerStyle
                    : "ring";
                root.setAttribute("data-spinner-style", spinnerStyle);

                // Self-contained rubber-band mapping from the physics recipe:
                // displayed = x*c / (x*c/d + 1). REFERENCE is a normalized
                // preview dimension, then converted to cqh for host-relative
                // motion. This function alone owns resistance and displacement.
                var RESISTANCE = 0.55;
                var REFERENCE = 640;
                function rubberBand(distance) {
                  return (distance * RESISTANCE) / ((distance * RESISTANCE) / REFERENCE + 1);
                }
                var shownPeak = (rubberBand(pullDistance) / REFERENCE) * 100;
                var heldOffset = Math.min(shownPeak, Math.max(5.8, shownPeak * 0.76));
                var dragState = { raw: 0 };

                // RETIME RANGE: lifecycle ownership lives only in these constants.
                // IN and OUT scale together only when the composition duration is short.
                var IN_BASE = 1.8;
                var OUT_BASE = 0.65;
                var CONTACT_BASE = 0.12;
                var DRAG_BASE = 0.7;
                var ARM_AT_BASE = 0.61;
                var IMPACT_AT_BASE = 0.82;
                var HANDOFF_BASE = 0.22;
                var durationValue = Number(clip.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var CONTACT = CONTACT_BASE * scale;
                var DRAG = DRAG_BASE * scale;
                var ARM_AT = ARM_AT_BASE * scale;
                var IMPACT_AT = IMPACT_AT_BASE * scale;
                var HANDOFF = HANDOFF_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var ACTIVE_DURATION = Math.max(0.001, OUT_START - IMPACT_AT);

                function fireSfx(id, atTime) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", {
                      detail: { id: id, t: atTime },
                      bubbles: true,
                    }),
                  );
                }

                gsap.set(content, { y: "0cqh" });
                gsap.set(indicator, { "--ptr-progress": 0, opacity: 0 });
                gsap.set(pullLabel, { opacity: 1 });
                gsap.set(releaseLabel, { opacity: 0 });
                gsap.set(loadingLabel, { opacity: 0 });
                gsap.set(ring, { rotation: 0 });
                gsap.set(arrow, { rotation: 0 });
                gsap.set(dots, { y: "0cqh", scale: 1 });
                gsap.set(updated, { opacity: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN, contact and nonlinear pull. The distance is already
                // resistance-mapped, while power2.out controls drag timing.
                tl.fromTo(
                  indicator,
                  { "--ptr-progress": 0, opacity: 0 },
                  {
                    "--ptr-progress": 100,
                    opacity: 1,
                    duration: DRAG,
                    ease: "power2.out",
                    immediateRender: false,
                  },
                  CONTACT,
                );
                tl.fromTo(
                  dragState,
                  { raw: 0 },
                  {
                    raw: pullDistance,
                    duration: DRAG,
                    ease: "power2.out",
                    onUpdate: function () {
                      var displayed = (rubberBand(dragState.raw) / REFERENCE) * 100;
                      gsap.set(content, { y: displayed + "cqh" });
                    },
                    immediateRender: false,
                  },
                  CONTACT,
                );

                // Threshold arm, a fixed point in IN. The indicator geometry is
                // full and the label flips before release commits the refresh.
                tl.to(pullLabel, { opacity: 0, duration: 0.12 * scale, ease: "power2.in" }, ARM_AT);
                tl.to(releaseLabel, { opacity: 1, duration: 0.16 * scale, ease: "power2.out" }, ARM_AT);

                tl.addLabel("impact", IMPACT_AT);
                tl.fromTo(
                  content,
                  { y: shownPeak + "cqh" },
                  {
                    y: heldOffset + "cqh",
                    duration: HANDOFF,
                    ease: "power3.out",
                    immediateRender: false,
                  },
                  IMPACT_AT,
                );
                tl.to(
                  releaseLabel,
                  { opacity: 0, duration: 0.1 * scale, ease: "power2.in" },
                  IMPACT_AT,
                );
                tl.to(
                  loadingLabel,
                  { opacity: 1, duration: 0.16 * scale, ease: "power2.out" },
                  IMPACT_AT,
                );
                tl.call(
                  function () {
                    fireSfx("refresh-commit", IMPACT_AT);
                  },
                  [],
                  IMPACT_AT,
                );

                // Loading HOLD: every cycle count is finite and determined once.
                // Each style owns a distinct active motion, but only the resolved
                // style is authored into the timeline.
                if (spinnerStyle === "ring") {
                  var spinCount = Math.max(1, Math.round(ACTIVE_DURATION / 0.58));
                  tl.fromTo(
                    ring,
                    { rotation: 0 },
                    {
                      rotation: 360 * spinCount,
                      duration: ACTIVE_DURATION,
                      ease: "linear",
                      immediateRender: false,
                    },
                    IMPACT_AT,
                  );
                } else if (spinnerStyle === "arrow") {
                  var arrowSpinCount = Math.max(1, Math.round(ACTIVE_DURATION / 0.64));
                  tl.fromTo(
                    arrow,
                    { rotation: 0 },
                    {
                      rotation: 360 * arrowSpinCount,
                      duration: ACTIVE_DURATION,
                      ease: "linear",
                      immediateRender: false,
                    },
                    IMPACT_AT,
                  );
                } else {
                  var PULSE_HALF = 0.22 * scale;
                  dots.forEach(function (dot, index) {
                    var dotStart = IMPACT_AT + index * 0.1 * scale;
                    var available = Math.max(PULSE_HALF, OUT_START - dotStart);
                    var pulseRepeat = Math.max(1, Math.floor(available / PULSE_HALF) - 1);
                    tl.fromTo(
                      dot,
                      { y: "0cqh", scale: 1 },
                      {
                        y: "-1.15cqh",
                        scale: 1.28,
                        duration: PULSE_HALF,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: pulseRepeat,
                        immediateRender: false,
                      },
                      dotStart,
                    );
                  });
                }

                // OUT: opacity exits without overshoot. Content alone earns the
                // rare tactile back.out snap and lands exactly at zero.
                tl.fromTo(
                  indicator,
                  { opacity: 1 },
                  {
                    opacity: 0,
                    duration: Math.min(OUT, 0.2 * scale),
                    ease: "power2.in",
                    immediateRender: false,
                  },
                  OUT_START,
                );
                tl.fromTo(
                  content,
                  { y: heldOffset + "cqh" },
                  {
                    y: "0cqh",
                    duration: OUT,
                    ease: "back.out(1.7)",
                    immediateRender: false,
                  },
                  OUT_START,
                );
                tl.fromTo(
                  updated,
                  { opacity: 0 },
                  {
                    opacity: 1,
                    duration: Math.min(OUT, 0.28 * scale),
                    ease: "power2.out",
                    immediateRender: false,
                  },
                  OUT_START + OUT * 0.32,
                );
                tl.addLabel("settle", OUT_START + OUT);
                tl.call(
                  function () {
                    fireSfx("refresh-settle", OUT_START + OUT);
                  },
                  [],
                  OUT_START + OUT,
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
        &#123; "id": "pullDistance", "type": "number", "role": "layout", "label": "Pull distance", "description": "Raw pull distance before nonlinear rubber-band resistance.", "default": 120, "min": 60, "max": 220, "step": 5 &#125;,
        &#123; "id": "spinnerStyle", "type": "enum", "role": "content", "label": "Spinner style", "description": "Refresh indicator geometry and loading motion.", "default": "ring", "options": [&#123; "value": "arrow", "label": "Arrow" &#125;, &#123; "value": "dots", "label": "Dots" &#125;, &#123; "value": "ring", "label": "Ring" &#125;] &#125;
      ]' data-composition-id="pull-to-refresh" data-duration="4" data-fps="30">
            
    
            <div
              id="pull-to-refresh-clip"
              class="ptr-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="ptr-indicator" aria-hidden="true">
                <div class="ptr-indicator-visual ptr-ring">
                  <div class="ptr-ring-core"></div>
                </div>
                <div class="ptr-indicator-visual ptr-arrow">
                  <div class="ptr-arrow-progress">
                    <div class="ptr-arrow-glyph"></div>
                  </div>
                </div>
                <div class="ptr-indicator-visual ptr-dots">
                  <span class="ptr-dot"></span>
                  <span class="ptr-dot"></span>
                  <span class="ptr-dot"></span>
                </div>
                <div class="ptr-state">
                  <span class="ptr-pull-label">Pull to refresh</span>
                  <span class="ptr-release-label">Release to refresh</span>
                  <span class="ptr-loading-label">Refreshing</span>
                </div>
              </div>
    
              <section class="ptr-content" aria-label="Activity list">
                <header class="ptr-topbar">
                  <div class="ptr-title">Activity</div>
                  <div class="ptr-updated">Updated now</div>
                </header>
                <div class="ptr-search">Search activity</div>
                <div class="ptr-list">
                  <article class="ptr-card">
                    <div class="ptr-avatar">AL</div>
                    <div class="ptr-copy">
                      <div class="ptr-card-title">Alex shared a draft</div>
                      <div class="ptr-card-subtitle">Launch sequence, ready for review</div>
                    </div>
                    <div class="ptr-time">Now</div>
                  </article>
                  <article class="ptr-card">
                    <div class="ptr-avatar">MK</div>
                    <div class="ptr-copy">
                      <div class="ptr-card-title">Mika left feedback</div>
                      <div class="ptr-card-subtitle">Three comments on the new flow</div>
                    </div>
                    <div class="ptr-time">4m</div>
                  </article>
                  <article class="ptr-card">
                    <div class="ptr-avatar">NO</div>
                    <div class="ptr-copy">
                      <div class="ptr-card-title">Noah published an update</div>
                      <div class="ptr-card-subtitle">Mobile preview is available</div>
                    </div>
                    <div class="ptr-time">18m</div>
                  </article>
                  <article class="ptr-card">
                    <div class="ptr-avatar">SR</div>
                    <div class="ptr-copy">
                      <div class="ptr-card-title">Sara joined the project</div>
                      <div class="ptr-card-subtitle">Workspace access granted</div>
                    </div>
                    <div class="ptr-time">1h</div>
                  </article>
                </div>
              </section>
            </div>
    
            
            
          </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  @property --ptr-progress {
    syntax: "<number>";
    inherits: true;
    initial-value: 0;
  }

  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  /* INVARIANT: #root is the mount-box owner. The host supplies every
  dimension, and all descendants size against this container. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f4f7fb);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .ptr-clip {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: var(--bg, #0b1120);
  }

  .ptr-indicator {
    --ptr-progress: 0;
    position: absolute;
    z-index: 0;
    inset: 0 0 auto;
    height: 15cqh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 1.5cqh;
    opacity: 0;
    color: var(--brand, #35d6a0);
  }

  .ptr-indicator-visual {
    width: 6.2cqh;
    height: 6.2cqh;
    display: none;
    place-items: center;
  }

  #root[data-spinner-style="ring"] .ptr-ring, #root[data-spinner-style="arrow"] .ptr-arrow, #root[data-spinner-style="dots"] .ptr-dots {
    display: grid;
  }

  /* EDIT ZONE: all three styles read the same --ptr-progress scalar.
  Ring maps it to arc fill, arrow maps it to a threshold flip, and
  dots map it to a three-step reveal. Active motion stays separate
  so the selected style has a distinctive loading silhouette. */
  .ptr-ring-core {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: conic-gradient(
      from -90deg,
      var(--brand, #35d6a0) 0 calc(var(--ptr-progress) * 1%),
      color-mix(in srgb, var(--surface, #1e293b) 86%, transparent)
      calc(var(--ptr-progress) * 1%) 100%
    );
    -webkit-mask: radial-gradient(farthest-side, transparent 59%, var(--fg, #f4f7fb) 61%);
    mask: radial-gradient(farthest-side, transparent 59%, var(--fg, #f4f7fb) 61%);
  }

  .ptr-arrow-progress {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    border-radius: 50%;
    border: 0.35cqh solid
    color-mix(in srgb, var(--brand, #35d6a0) 58%, var(--border, #334155));
    background: color-mix(in srgb, var(--surface, #1e293b) 88%, transparent);
    transform: rotate(calc(var(--ptr-progress) * 1.8deg));
  }

  .ptr-arrow-glyph {
    position: relative;
    width: 1.5cqh;
    height: 2.7cqh;
    border-radius: 0.3cqh;
    background: var(--brand, #35d6a0);
  }

  .ptr-arrow-glyph::after {
    content: "";
    position: absolute;
    left: 50%;
    bottom: -0.8cqh;
    width: 2.3cqh;
    height: 2.3cqh;
    border-right: 0.55cqh solid var(--brand, #35d6a0);
    border-bottom: 0.55cqh solid var(--brand, #35d6a0);
    transform: translateX(-50%) rotate(45deg);
  }

  .ptr-dots {
    grid-template-columns: repeat(3, 1.7cqh);
    gap: 0.8cqh;
    align-content: center;
    width: auto;
  }

  .ptr-dot {
    width: 1.7cqh;
    height: 1.7cqh;
    border-radius: 50%;
    background: var(--brand, #35d6a0);
    box-shadow: 0 0 1.2cqh color-mix(in srgb, var(--brand, #35d6a0) 50%, transparent);
  }

  .ptr-dot:nth-child(1) {
    opacity: clamp(0.2, calc(var(--ptr-progress) / 30), 1);
  }

  .ptr-dot:nth-child(2) {
    opacity: clamp(0.2, calc((var(--ptr-progress) - 30) / 30), 1);
  }

  .ptr-dot:nth-child(3) {
    opacity: clamp(0.2, calc((var(--ptr-progress) - 60) / 30), 1);
  }

  .ptr-state {
    position: relative;
    width: 100%;
    height: 3.4cqh;
    margin-top: 0.9cqh;
    color: var(--muted, #94a3b8);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(1.35cqh, 1.8cqw, 2.05cqh);
    font-weight: 700;
    letter-spacing: 0.04em;
    text-align: center;
    text-transform: uppercase;
  }

  .ptr-state span {
    position: absolute;
    inset: 0;
    opacity: 0;
  }

  .ptr-content {
    position: absolute;
    z-index: 1;
    inset: 0;
    overflow: hidden;
    background: var(--bg, #0b1120);
    border-radius: inherit;
    box-shadow: 0 -1cqh 3cqh color-mix(in srgb, var(--bg, #0b1120) 65%, transparent);
  }

  .ptr-topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 10cqh;
    padding: 0 6cqw;
    border-bottom: 0.12cqh solid var(--border, #334155);
    background: color-mix(in srgb, var(--surface, #1e293b) 52%, var(--bg, #0b1120));
  }

  .ptr-title {
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(2.8cqh, 5.2cqw, 4.3cqh);
    font-weight: 760;
    letter-spacing: -0.035em;
  }

  .ptr-updated {
    display: flex;
    align-items: center;
    gap: 1.4cqw;
    color: var(--brand, #35d6a0);
    font-size: clamp(1.4cqh, 2.2cqw, 2cqh);
    font-weight: 700;
    opacity: 0;
  }

  .ptr-updated::before {
    content: "";
    width: 1.4cqh;
    height: 1.4cqh;
    border-radius: 50%;
    background: var(--brand, #35d6a0);
    box-shadow: 0 0 1.2cqh color-mix(in srgb, var(--brand, #35d6a0) 50%, transparent);
  }

  .ptr-search {
    display: flex;
    align-items: center;
    height: 7cqh;
    margin: 3cqh 5cqw 2cqh;
    padding: 0 4cqw;
    border: 0.12cqh solid var(--border, #334155);
    border-radius: 3.5cqh;
    background: var(--surface, #1e293b);
    color: var(--muted, #94a3b8);
    font-size: clamp(1.7cqh, 2.8cqw, 2.5cqh);
  }

  .ptr-list {
    display: grid;
    gap: 1.7cqh;
    padding: 0 5cqw 5cqh;
  }

  .ptr-card {
    display: grid;
    grid-template-columns: 8cqh 1fr auto;
    align-items: center;
    min-height: 11.5cqh;
    gap: 3cqw;
    padding: 2cqh 4cqw;
    border: 0.12cqh solid var(--border, #334155);
    border-radius: 2.4cqh;
    background: var(--surface, #1e293b);
    box-shadow: 0 1cqh 2.4cqh color-mix(in srgb, var(--bg, #0b1120) 55%, transparent);
  }

  .ptr-avatar {
    display: grid;
    place-items: center;
    width: 6.3cqh;
    height: 6.3cqh;
    border-radius: 2cqh;
    background: color-mix(in srgb, var(--brand, #35d6a0) 20%, var(--surface, #1e293b));
    color: var(--brand, #35d6a0);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 2.3cqh;
    font-weight: 800;
  }

  .ptr-copy {
    min-width: 0;
  }

  .ptr-card-title {
    color: var(--fg, #f4f7fb);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(1.9cqh, 3.1cqw, 2.7cqh);
    font-weight: 720;
  }

  .ptr-card-subtitle {
    margin-top: 0.5cqh;
    color: var(--muted, #94a3b8);
    font-size: clamp(1.45cqh, 2.3cqw, 2.05cqh);
    line-height: 1.25;
  }

  .ptr-time {
    align-self: start;
    color: var(--muted, #94a3b8);
    font-size: clamp(1.25cqh, 2cqw, 1.8cqh);
    font-weight: 650;
  }
}
</style>
