<!-- Modified Svelte adaptation of registry/components/tracing-beam/tracing-beam.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".tb-stage");
                var beam = root.querySelector(".tb-beam");
                var nodes = root.querySelectorAll(".tb-node");
                var labels = root.querySelectorAll(".tb-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var defaultLabels = ["Search", "Preview", "Export"];
                var labelValue = vars.labels == null ? defaultLabels.join(",") : String(vars.labels);
                var labelParts = labelValue.split(",");
                for (var i = 0; i < labels.length; i += 1) {
                  var part = labelParts[i] == null ? "" : labelParts[i].trim();
                  labels[i].textContent = part === "" ? defaultLabels[i] : part;
                }

                var accentName =
                  vars.accent === "violet" || vars.accent === "amber" ? vars.accent : "cyan";
                var accentColors = {
                  cyan: "var(--accent, #5ee7ff)",
                  violet: "var(--accent-2, #a78bfa)",
                  amber: "var(--brand, #fbbf24)",
                };
                root.style.setProperty("--tb-accent", accentColors[accentName]);

                var routeLength = beam.getTotalLength();
                var dashLength = routeLength * 0.24;
                beam.style.strokeDasharray = dashLength + " " + routeLength;
                beam.style.strokeDashoffset = String(dashLength);

                var IN_BASE = 3;
                var OUT_BASE = 0.55;
                var BEAM_START_BASE = 0.35;
                var BEAM_TRAVEL_BASE = 2.35;
                var NODE_MOVE_BASE = 0.28;
                var NODE_DIM_DELAY_BASE = 0.65;
                var BEAM_EXIT_BASE = 0.28;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var fixedDuration = IN_BASE + OUT_BASE;
                var scale = duration < fixedDuration ? duration / fixedDuration : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var BEAM_START = BEAM_START_BASE * scale;
                var BEAM_TRAVEL = BEAM_TRAVEL_BASE * scale;
                var NODE_MOVE = NODE_MOVE_BASE * scale;
                var NODE_DIM_DELAY = NODE_DIM_DELAY_BASE * scale;
                var BEAM_EXIT = BEAM_EXIT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;
                var arrivals = [BEAM_START, BEAM_START + BEAM_TRAVEL * 0.5, BEAM_START + BEAM_TRAVEL];

                gsap.set(stage, { opacity: 0 });
                gsap.set(beam, { opacity: 0 });
                gsap.set(nodes, { y: 0 });
                gsap.set(root.querySelectorAll(".tb-halo"), { scale: 0.82 });

                var tl = gsap.timeline({ paused: true });

                function brighten(node, at) {
                  var card = node.querySelector(".tb-card");
                  var halo = node.querySelector(".tb-halo");
                  tl.to(node, { y: "-2.2cqh", duration: NODE_MOVE, ease: "power3.out" }, at);
                  tl.to(card, { opacity: 1, duration: NODE_MOVE, ease: "power2.out" }, at);
                  tl.to(halo, { opacity: 0.86, scale: 1, duration: NODE_MOVE, ease: "power3.out" }, at);
                }

                function dim(node, at) {
                  var card = node.querySelector(".tb-card");
                  var halo = node.querySelector(".tb-halo");
                  tl.to(node, { y: 0, duration: NODE_MOVE, ease: "power2.out" }, at);
                  tl.to(card, { opacity: 0.48, duration: NODE_MOVE, ease: "power2.out" }, at);
                  tl.to(halo, { opacity: 0, scale: 0.82, duration: NODE_MOVE, ease: "power2.out" }, at);
                }

                tl.to(stage, { opacity: 1, duration: Math.min(0.35, IN), ease: "power2.out" }, 0);
                tl.to(beam, { opacity: 1, duration: NODE_MOVE, ease: "power2.out" }, BEAM_START);
                tl.to(
                  beam,
                  {
                    strokeDashoffset: -(routeLength - dashLength),
                    duration: BEAM_TRAVEL,
                    ease: "sine.inOut",
                  },
                  BEAM_START,
                );

                brighten(nodes[0], arrivals[0]);
                brighten(nodes[1], arrivals[1]);
                brighten(nodes[2], arrivals[2]);
                dim(nodes[0], arrivals[0] + NODE_DIM_DELAY);
                dim(nodes[1], arrivals[1] + NODE_DIM_DELAY);

                if (HOLD > 0.2) {
                  tl.to(
                    nodes[2],
                    { y: "-2.7cqh", duration: HOLD * 0.5, ease: "sine.inOut" },
                    HOLD_START,
                  );
                  tl.to(
                    nodes[2],
                    { y: "-2.2cqh", duration: HOLD * 0.5, ease: "sine.inOut" },
                    HOLD_START + HOLD * 0.5,
                  );
                }

                tl.to(
                  beam,
                  {
                    strokeDashoffset: -routeLength,
                    opacity: 0,
                    duration: BEAM_EXIT,
                    ease: "power2.in",
                  },
                  OUT_START,
                );
                dim(nodes[2], OUT_START);
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
        &#123; "id": "labels", "type": "string", "role": "content", "label": "Labels", "description": "Three comma-separated labels shown in path order.", "default": "Search,Preview,Export" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Beam and active-element color.", "default": "cyan", "options": [&#123; "value": "cyan", "label": "Cyan" &#125;, &#123; "value": "violet", "label": "Violet" &#125;, &#123; "value": "amber", "label": "Amber" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="tracing-beam" data-duration="4.5" data-fps="30">
            
    
            <div
              id="tracing-beam-clip"
              class="tb-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="tb-stage">
                <svg
                  class="tb-route"
                  viewBox="0 0 1000 520"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <filter id="tracing-beam-glow" x="-30%" y="-30%" width="160%" height="160%">
                      <feGaussianBlur stdDeviation="7" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <path
                    class="tb-beam"
                    d="M 150 312 C 280 312 335 182 500 182 C 665 182 720 302 850 302"
                  />
                </svg>
    
                <div class="tb-nodes">
                  <div class="tb-anchor">
                    <div class="tb-node">
                      <div class="tb-halo"></div>
                      <div class="tb-card">
                        <div class="tb-icon">01</div>
                        <div class="tb-copy">
                          <div class="tb-kicker">Step one</div>
                          <div class="tb-label"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="tb-anchor">
                    <div class="tb-node">
                      <div class="tb-halo"></div>
                      <div class="tb-card">
                        <div class="tb-icon">02</div>
                        <div class="tb-copy">
                          <div class="tb-kicker">Step two</div>
                          <div class="tb-label"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="tb-anchor">
                    <div class="tb-node">
                      <div class="tb-halo"></div>
                      <div class="tb-card">
                        <div class="tb-icon">03</div>
                        <div class="tb-copy">
                          <div class="tb-kicker">Step three</div>
                          <div class="tb-label"></div>
                        </div>
                      </div>
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
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .tb-clip, .tb-stage {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .tb-stage {
    opacity: 0;
  }

  .tb-route {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }

  .tb-beam {
    fill: none;
    stroke: var(--tb-accent, #5ee7ff);
    stroke-width: 9;
    stroke-linecap: round;
    stroke-linejoin: round;
    filter: url(#tracing-beam-glow);
    opacity: 0;
    will-change: stroke-dashoffset, opacity;
  }

  .tb-anchor {
    position: absolute;
    width: 22cqw;
    height: 24cqh;
    transform: translate(-50%, -50%);
  }

  .tb-anchor:nth-child(1) {
    left: 15%;
    top: 60%;
  }

  .tb-anchor:nth-child(2) {
    left: 50%;
    top: 35%;
  }

  .tb-anchor:nth-child(3) {
    left: 85%;
    top: 58%;
  }

  .tb-node {
    position: relative;
    width: 100%;
    height: 100%;
    will-change: transform;
  }

  .tb-halo {
    position: absolute;
    inset: -24%;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--tb-accent, #5ee7ff) 42%, transparent) 0%,
      transparent 70%
    );
    opacity: 0;
    will-change: transform, opacity;
  }

  .tb-card {
    position: relative;
    z-index: 1;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 2.2cqw;
    padding: 2.4cqh 2.2cqw;
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 78%, transparent);
    border-radius: var(--radius, 2.8cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 92%, transparent);
    box-shadow: 0 2.4cqh 6cqh color-mix(in srgb, var(--bg, #0b0c0e) 56%, transparent);
    opacity: 0.48;
    will-change: opacity;
  }

  .tb-icon {
    flex: 0 0 auto;
    width: 7.5cqmin;
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border: 0.14cqmin solid color-mix(in srgb, var(--tb-accent, #5ee7ff) 52%, transparent);
    border-radius: 2cqmin;
    background: color-mix(in srgb, var(--tb-accent, #5ee7ff) 14%, var(--surface, #172033));
    color: var(--tb-accent, #5ee7ff);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace);
    font-size: clamp(13px, 3.5cqmin, 28px);
    font-weight: 760;
  }

  .tb-copy {
    min-width: 0;
  }

  .tb-kicker {
    margin-bottom: 0.8cqh;
    color: var(--muted, #94a3b8);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace);
    font-size: clamp(9px, 1.7cqmin, 16px);
    font-weight: 650;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  .tb-label {
    max-width: 100%;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(13px, 4.6cqmin, 38px);
    font-weight: 720;
    line-height: 1.05;
    letter-spacing: -0.025em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
