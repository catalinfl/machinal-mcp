<!-- Modified Svelte adaptation of registry/components/offset-path-traveler/offset-path-traveler.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var route = root.querySelector(".opt-route");
                var guide = root.querySelector(".opt-guide");
                var traveler = root.querySelector(".opt-traveler-slot");
                var label = root.querySelector(".opt-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var DEFAULT_PATH =
                  "M -90 390 C 150 490 190 70 430 185 C 650 300 720 105 850 145 C 970 180 1030 85 1090 35";
                var requestedPath = vars.path == null ? "" : String(vars.path).trim();
                var pathData = requestedPath === "" ? DEFAULT_PATH : requestedPath;
                var travelerLabel =
                  vars.traveler_label == null ? "Live preview" : String(vars.traveler_label);
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";

                guide.setAttribute("d", pathData);
                label.textContent = travelerLabel;
                root.style.setProperty("--opt-accent", accentColors[accent]);

                var totalLength;
                try {
                  totalLength = guide.getTotalLength();
                } catch (_error) {
                  totalLength = 0;
                }
                if (!Number.isFinite(totalLength) || totalLength <= 0) {
                  guide.setAttribute("d", DEFAULT_PATH);
                  totalLength = guide.getTotalLength();
                }

                var VIEWBOX_WIDTH = 1000;
                var VIEWBOX_HEIGHT = 500;
                var travel = { progress: 0 };

                function renderTraveler() {
                  var distance = Math.max(0, Math.min(1, travel.progress)) * totalLength;
                  var tangentStep = Math.max(0.5, totalLength * 0.002);
                  var before = guide.getPointAtLength(Math.max(0, distance - tangentStep));
                  var after = guide.getPointAtLength(Math.min(totalLength, distance + tangentStep));
                  var scaleX = route.clientWidth / VIEWBOX_WIDTH;
                  var scaleY = route.clientHeight / VIEWBOX_HEIGHT;
                  var point = guide.getPointAtLength(distance);
                  var rotation =
                    (Math.atan2((after.y - before.y) * scaleY, (after.x - before.x) * scaleX) * 180) /
                    Math.PI;

                  gsap.set(traveler, {
                    x: point.x * scaleX,
                    y: point.y * scaleY,
                    xPercent: -50,
                    yPercent: -50,
                    rotation: rotation,
                  });
                }

                var IN_BASE = 1.2;
                var OUT_BASE = 0.65;
                var STILLNESS = 0.3;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var driftHalf = Math.max(0, HOLD - STILLNESS) / 2;

                gsap.set(traveler, { opacity: 0, scale: 0.9 });
                renderTraveler();

                var tl = gsap.timeline({ paused: true });

                tl.to(
                  travel,
                  { progress: 0.72, duration: IN, ease: "power3.out", onUpdate: renderTraveler },
                  0,
                );
                tl.to(traveler, { opacity: 1, duration: Math.min(0.28, IN), ease: "power2.out" }, 0);
                tl.to(traveler, { scale: 1, duration: Math.min(0.5, IN), ease: "back.out(1.7)" }, 0);

                if (driftHalf > 0) {
                  tl.to(
                    travel,
                    {
                      progress: 0.78,
                      duration: driftHalf,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
                      onUpdate: renderTraveler,
                    },
                    IN,
                  );
                }

                tl.to(
                  travel,
                  { progress: 1, duration: OUT, ease: "power2.in", onUpdate: renderTraveler },
                  OUT_START,
                );
                tl.to(traveler, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "path", "type": "string", "role": "content", "label": "Path", "description": "SVG path data authored in a 1000 by 500 route viewBox.", "default": "M -90 390 C 150 490 190 70 430 185 C 650 300 720 105 850 145 C 970 180 1030 85 1090 35" &#125;,
        &#123; "id": "traveler_label", "type": "string", "role": "content", "label": "Traveler label", "description": "Text displayed inside the default traveler chip.", "default": "Live preview" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color used by the traveler and route.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="offset-path-traveler" data-duration="4" data-fps="30">
            
    
            <div
              id="offset-path-traveler-clip"
              class="opt-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="opt-route">
                <svg viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
                  <path class="opt-guide"></path>
                </svg>
                <div class="opt-traveler-slot" data-slot="traveler">
                  <div class="opt-chip">
                    <span class="opt-dot" aria-hidden="true"></span>
                    <span class="opt-label"></span>
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
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .opt-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .opt-route {
    position: absolute;
    inset: 8cqh 4cqw;
  }

  .opt-route svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .opt-guide {
    fill: none;
    stroke: color-mix(in srgb, var(--opt-accent) 34%, var(--border, #475569));
    stroke-width: 0.42cqmin;
    stroke-linecap: round;
    stroke-dasharray: 1.1cqmin 1.5cqmin;
    opacity: 0.62;
    vector-effect: non-scaling-stroke;
  }

  .opt-traveler-slot {
    position: absolute;
    left: 0;
    top: 0;
    display: block;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .opt-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1, 1.4cqmin);
    max-width: 34cqw;
    min-height: 8cqh;
    padding: var(--space-1, 1.6cqh) var(--space-2, 2.6cqw);
    overflow: hidden;
    border: 0.18cqmin solid
    color-mix(in srgb, var(--opt-accent) 68%, var(--border, #475569));
    border-radius: var(--radius, 999px);
    background: color-mix(in srgb, var(--surface, #18212f) 88%, var(--opt-accent));
    box-shadow:
      0 2.2cqh 5cqh color-mix(in srgb, var(--bg, #020617) 48%, transparent),
      0 0 3.5cqh color-mix(in srgb, var(--opt-accent) 24%, transparent);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(12px, 3.5cqmin, 30px);
    font-weight: 760;
    line-height: 1;
    letter-spacing: -0.01em;
    white-space: nowrap;
  }

  .opt-dot {
    flex: 0 0 auto;
    width: 2.4cqmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--opt-accent);
    box-shadow: 0 0 2cqmin color-mix(in srgb, var(--opt-accent) 58%, transparent);
  }

  .opt-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
