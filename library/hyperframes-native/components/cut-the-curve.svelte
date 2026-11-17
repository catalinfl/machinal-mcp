<!-- Modified Svelte adaptation of registry/components/cut-the-curve/cut-the-curve.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var outgoing = root.querySelector(".is-outgoing");
                var incoming = root.querySelector(".is-incoming");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var subject =
                  vars.subject === "card" || vars.subject === "scene" ? vars.subject : "cursor";
                var direction =
                  vars.direction === "right" || vars.direction === "up" || vars.direction === "down"
                    ? vars.direction
                    : "left";
                var rawCut = Number(vars.cutFraction);
                var cutFraction = Number.isFinite(rawCut) ? Math.max(0, Math.min(1, rawCut)) : 0.33;
                var rawBlur = Number(vars.blurPx);
                var blurPx = Number.isFinite(rawBlur) ? Math.max(0, rawBlur) : 12;
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.dataset.subject = subject;

                // Direction is the single owner of axis, sign, unit, and base travel.
                var vectors = {
                  left: { axis: "x", sign: -1, unit: "cqw", distance: 34 },
                  right: { axis: "x", sign: 1, unit: "cqw", distance: 34 },
                  up: { axis: "y", sign: -1, unit: "cqh", distance: 26 },
                  down: { axis: "y", sign: 1, unit: "cqh", distance: 26 },
                };
                var vector = vectors[direction];
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "1"));
                // Exit none keeps the whole duration for the cut profile. An
                // enabled exit reserves a short tail after the incoming lands.
                var EXIT = exit === "none" ? 0 : Math.min(0.35, duration * 0.25);
                var TRAVEL = Math.max(0.001, duration - EXIT);
                var CUT_AT = TRAVEL * cutFraction;
                var ENTRY_DURATION = TRAVEL - CUT_AT;
                var entryDistance =
                  CUT_AT > 0 ? vector.distance * (ENTRY_DURATION / CUT_AT) : vector.distance * 2;
                var seamBlur = "blur(" + blurPx + "px)";
                var clearBlur = "blur(0px)";
                var seamOpacity = 0.72;

                var outgoingEnd = { opacity: seamOpacity, filter: seamBlur };
                outgoingEnd[vector.axis] = vector.sign * vector.distance + vector.unit;

                var incomingStart = { x: 0, y: 0, opacity: 0, filter: seamBlur };
                incomingStart[vector.axis] = -vector.sign * entryDistance + vector.unit;

                var incomingEnd = { opacity: 1, filter: clearBlur };
                incomingEnd[vector.axis] = 0;

                gsap.set(outgoing, { x: 0, y: 0, opacity: 1, filter: clearBlur });
                gsap.set(incoming, incomingStart);

                var tl = gsap.timeline({ paused: true });

                if (CUT_AT > 0) {
                  tl.to(
                    outgoing,
                    Object.assign({}, outgoingEnd, { duration: CUT_AT, ease: "power4.in" }),
                    0,
                  );
                }

                // CUT: one visibility owner, matched blur and opacity on both sides.
                tl.set(outgoing, { opacity: 0 }, CUT_AT);
                tl.set(incoming, { opacity: seamOpacity }, CUT_AT);
                tl.call(
                  function () {
                    root.dispatchEvent(
                      new CustomEvent("hf:sfx", {
                        detail: { id: "whip-cut", t: CUT_AT },
                        bubbles: true,
                      }),
                    );
                  },
                  [],
                  CUT_AT,
                );

                if (ENTRY_DURATION > 0) {
                  tl.to(
                    incoming,
                    Object.assign({}, incomingEnd, {
                      duration: ENTRY_DURATION,
                      ease: "power4.out",
                    }),
                    CUT_AT,
                  );
                } else {
                  tl.set(incoming, incomingEnd, CUT_AT);
                }

                // Optional departure; exit none rests until the frame cuts.
                if (exit === "fade") {
                  tl.to(incoming, { opacity: 0, duration: EXIT, ease: "power2.in" }, TRAVEL);
                } else if (exit === "up") {
                  tl.to(
                    incoming,
                    { opacity: 0, y: "-6cqh", duration: EXIT, ease: "power2.in" },
                    TRAVEL,
                  );
                }

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "subject", "type": "enum", "role": "content", "label": "Subject", "description": "Visual payload used on both sides of the cut.", "default": "cursor", "options": [&#123; "value": "cursor", "label": "Cursor" &#125;, &#123; "value": "card", "label": "Card" &#125;, &#123; "value": "scene", "label": "Scene" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Shared screen direction for outgoing and incoming travel.", "default": "left", "options": [&#123; "value": "left", "label": "Left" &#125;, &#123; "value": "right", "label": "Right" &#125;, &#123; "value": "up", "label": "Up" &#125;, &#123; "value": "down", "label": "Down" &#125;] &#125;,
        &#123; "id": "cutFraction", "type": "number", "role": "timing", "label": "Cut fraction", "description": "Normalized point where the hard cut swaps subjects.", "default": 0.33, "min": 0, "max": 1, "step": 0.01 &#125;,
        &#123; "id": "blurPx", "type": "number", "role": "style", "label": "Cut blur", "description": "Blur in pixels shared by both subjects at the cut seam.", "default": 12, "min": 0, "max": 40, "step": 1, "unit": "px" &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure of the incoming subject. Default none: it rests until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-id="cut-the-curve" data-duration="1" data-fps="30">
            
    
            <div
              id="cut-the-curve-clip"
              class="ctc-clip clip"
              data-start="0"
              data-duration="1"
              data-track-index="0"
            >
              <div class="ctc-backdrop"></div>
    
              <div class="ctc-subject is-outgoing" aria-hidden="true">
                <div class="ctc-art ctc-cursor">
                  <span class="ctc-cursor-pulse"></span>
                  <svg viewBox="0 0 64 88" aria-hidden="true">
                    <path
                      class="ctc-cursor-shape"
                      d="M8 5 L54 43 L34 47 L45 75 L30 82 L19 53 L8 68 Z"
                    />
                  </svg>
                </div>
                <div class="ctc-art ctc-card">
                  <div class="ctc-card-chip"></div>
                  <div class="ctc-card-line"></div>
                  <div class="ctc-card-line"></div>
                </div>
                <div class="ctc-art ctc-scene">
                  <div class="ctc-scene-bar">
                    <span class="ctc-scene-dot"></span><span class="ctc-scene-dot"></span
                    ><span class="ctc-scene-dot"></span>
                  </div>
                  <div class="ctc-scene-body">
                    <div class="ctc-scene-panel"></div>
                    <div class="ctc-scene-copy">
                      <div class="ctc-scene-line"></div>
                      <div class="ctc-scene-line"></div>
                      <div class="ctc-scene-line"></div>
                    </div>
                  </div>
                </div>
              </div>
    
              <div class="ctc-subject is-incoming" aria-hidden="true">
                <div class="ctc-art ctc-cursor">
                  <span class="ctc-cursor-pulse"></span>
                  <svg viewBox="0 0 64 88" aria-hidden="true">
                    <path
                      class="ctc-cursor-shape"
                      d="M8 5 L54 43 L34 47 L45 75 L30 82 L19 53 L8 68 Z"
                    />
                  </svg>
                </div>
                <div class="ctc-art ctc-card">
                  <div class="ctc-card-chip"></div>
                  <div class="ctc-card-line"></div>
                  <div class="ctc-card-line"></div>
                </div>
                <div class="ctc-art ctc-scene">
                  <div class="ctc-scene-bar">
                    <span class="ctc-scene-dot"></span><span class="ctc-scene-dot"></span
                    ><span class="ctc-scene-dot"></span>
                  </div>
                  <div class="ctc-scene-body">
                    <div class="ctc-scene-panel"></div>
                    <div class="ctc-scene-copy">
                      <div class="ctc-scene-line"></div>
                      <div class="ctc-scene-line"></div>
                      <div class="ctc-scene-line"></div>
                    </div>
                  </div>
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
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .ctc-clip, .ctc-backdrop, .ctc-subject {
    position: absolute;
    inset: 0;
  }

  .ctc-clip {
    overflow: hidden;
  }

  .ctc-backdrop {
    background:
      radial-gradient(
        circle at var(--ctc-glow-x, 24%) var(--ctc-glow-y, 28%),
        color-mix(
          in srgb,
          var(--fg, #f8fafc) var(--ctc-glow-strength, 18%),
          var(--transparent, transparent)
        ),
      var(--transparent, transparent) var(--ctc-glow-radius, 42%)
      ),
      var(--bg, #0b1120);
  }

  .ctc-subject {
    display: grid;
    place-items: center;
    opacity: 0;
    will-change: transform, filter, opacity;
  }

  .ctc-subject.is-outgoing {
    opacity: 1;
    --ctc-primary: color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
    --ctc-secondary: color-mix(in srgb, var(--fg, #f8fafc) 18%, transparent);
  }

  .ctc-subject.is-incoming {
    --ctc-primary: color-mix(in srgb, var(--fg, #f8fafc) 72%, transparent);
    --ctc-secondary: color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
  }

  .ctc-art {
    display: none;
  }

  #root[data-subject="cursor"] .ctc-cursor, #root[data-subject="card"] .ctc-card, #root[data-subject="scene"] .ctc-scene {
    display: block;
  }

  .ctc-cursor {
    position: relative;
    width: var(--ctc-cursor-width, 15cqw);
    height: var(--ctc-cursor-height, 24cqh);
  }

  .ctc-cursor svg {
    width: var(--ctc-cursor-svg-width, 100%);
    height: var(--ctc-cursor-svg-height, 100%);
    overflow: visible;
    filter: drop-shadow(
      var(--ctc-shadow-x, 0cqw) var(--ctc-shadow-y, 1cqh) var(--ctc-shadow-blur, 1.6cqw)
      color-mix(
        in srgb,
        var(--bg, #0b1120) var(--ctc-shadow-strength, 65%),
        var(--transparent, transparent)
      )
    );
  }

  .ctc-cursor-shape {
    fill: var(--ctc-primary, var(--fg, #f8fafc));
    stroke: var(--fg, #f8fafc);
    stroke-width: var(--ctc-cursor-stroke, 1.8);
    stroke-linejoin: round;
  }

  .ctc-cursor-pulse {
    position: absolute;
    left: var(--ctc-pulse-left, -5cqw);
    top: var(--ctc-pulse-top, -5cqh);
    width: var(--ctc-pulse-size, 11cqw);
    aspect-ratio: var(--ctc-pulse-ratio, 1);
    border: var(--ctc-pulse-border, 0.25cqw) solid
    color-mix(
      in srgb,
      var(--ctc-secondary, var(--fg, #f8fafc)) var(--ctc-pulse-strength, 58%),
      var(--transparent, transparent)
    );
    border-radius: var(--ctc-round, 50%);
  }

  .ctc-card {
    width: var(--ctc-card-width, 42cqw);
    min-height: var(--ctc-card-height, 34cqh);
    padding: var(--ctc-card-padding-y, var(--space-3, 4.5cqh))
    var(--ctc-card-padding-x, var(--space-3, 4cqw));
    border: var(--ctc-border-width, 0.22cqw) solid var(--border, #334155);
    border-radius: var(--radius, 2cqw);
    background: var(--surface, #1e293b);
    box-shadow: var(--ctc-shadow-x, 0cqw) var(--ctc-card-shadow-y, 2.4cqh)
    var(--ctc-card-shadow-blur, 5cqw)
    color-mix(
      in srgb,
      var(--bg, #0b1120) var(--ctc-card-shadow-strength, 55%),
      var(--transparent, transparent)
    );
  }

  .ctc-card-chip {
    width: var(--ctc-chip-width, 9cqw);
    height: var(--ctc-chip-height, 2.2cqh);
    border-radius: var(--ctc-pill-radius, 99cqw);
    background: var(--ctc-primary, var(--fg, #f8fafc));
    margin-bottom: var(--ctc-card-gap, var(--space-3, 3.2cqh));
  }

  .ctc-card-line, .ctc-scene-line {
    height: var(--ctc-line-height, 1.8cqh);
    border-radius: var(--ctc-pill-radius, 99cqw);
    background: var(--fg, #f8fafc);
  }

  .ctc-card-line + .ctc-card-line {
    margin-top: var(--ctc-line-gap, var(--space-2, 2.2cqh));
  }

  .ctc-card-line:first-of-type {
    width: var(--ctc-line-long, 88%);
  }

  .ctc-card-line:last-of-type {
    width: var(--ctc-line-short, 58%);
    opacity: var(--ctc-muted-opacity, 0.42);
  }

  .ctc-scene {
    width: var(--ctc-scene-width, 68cqw);
    height: var(--ctc-scene-height, 58cqh);
    overflow: hidden;
    border: var(--ctc-border-width, 0.22cqw) solid var(--border, #334155);
    border-radius: var(--radius, 2cqw);
    background: var(--surface, #1e293b);
    box-shadow: var(--ctc-shadow-x, 0cqw) var(--ctc-card-shadow-y, 2.4cqh)
    var(--ctc-card-shadow-blur, 5cqw)
    color-mix(
      in srgb,
      var(--bg, #0b1120) var(--ctc-card-shadow-strength, 55%),
      var(--transparent, transparent)
    );
  }

  .ctc-scene-bar {
    display: flex;
    align-items: center;
    gap: var(--ctc-dot-gap, var(--space-1, 1cqw));
    height: var(--ctc-scene-bar-height, 8cqh);
    padding-inline: var(--ctc-scene-pad, var(--space-2, 2cqw));
    border-bottom: var(--ctc-border-width, 0.22cqw) solid var(--border, #334155);
  }

  .ctc-scene-dot {
    width: var(--ctc-dot-size, 1.4cqw);
    aspect-ratio: var(--ctc-pulse-ratio, 1);
    border-radius: var(--ctc-round, 50%);
    background: var(--ctc-primary, var(--fg, #f8fafc));
  }

  .ctc-scene-body {
    display: grid;
    grid-template-columns: var(--ctc-scene-columns, 1fr 2fr);
    gap: var(--ctc-scene-gap, var(--space-3, 3cqw));
    padding: var(--ctc-scene-body-pad, var(--space-3, 5cqh))
    var(--ctc-scene-pad, var(--space-3, 3cqw));
  }

  .ctc-scene-panel {
    min-height: var(--ctc-panel-height, 34cqh);
    border-radius: var(--ctc-panel-radius, var(--radius, 1.2cqw));
    background: color-mix(
      in srgb,
      var(--ctc-primary, var(--fg, #f8fafc)) var(--ctc-panel-strength, 24%),
      var(--surface, #1e293b)
    );
  }

  .ctc-scene-copy {
    padding-top: var(--ctc-copy-top, var(--space-2, 2cqh));
  }

  .ctc-scene-line + .ctc-scene-line {
    margin-top: var(--ctc-scene-line-gap, var(--space-3, 3cqh));
  }

  .ctc-scene-line:nth-child(1) {
    width: var(--ctc-scene-line-one, 92%);
  }

  .ctc-scene-line:nth-child(2) {
    width: var(--ctc-scene-line-two, 68%);
    opacity: var(--ctc-muted-opacity, 0.42);
  }

  .ctc-scene-line:nth-child(3) {
    width: var(--ctc-scene-line-three, 78%);
    background: var(--ctc-secondary, var(--fg, #f8fafc));
  }
}
</style>
