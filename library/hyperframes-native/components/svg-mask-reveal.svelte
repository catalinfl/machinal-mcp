<!-- Modified Svelte adaptation of registry/components/svg-mask-reveal/svg-mask-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "svg-mask-reveal";
                var stage = root.querySelector(".smr-stage");
                var svg = root.querySelector(".smr-svg");
                var maskText = root.querySelector("#svg-mask-reveal-text");
                var outlineText = root.querySelector("#svg-mask-reveal-outline");
                var mediaRect = root.querySelector(".smr-media");

                // EDIT ZONE: declared defaults are merged with per-instance host
                // overrides by the runtime. Missing and zero are distinct here.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};
                var textValue = vars.text == null ? "REVEAL" : String(vars.text);
                var progressValue = vars.revealProgress == null ? NaN : Number(vars.revealProgress);
                var revealProgress = Number.isFinite(progressValue)
                  ? Math.max(0, Math.min(100, progressValue))
                  : 100;
                var featherValue = vars.featherPx == null ? NaN : Number(vars.featherPx);
                var featherPx = Number.isFinite(featherValue)
                  ? Math.max(0, Math.min(120, featherValue))
                  : 24;

                maskText.textContent = textValue;
                outlineText.textContent = textValue;
                svg.setAttribute("aria-label", textValue);

                // INVARIANT: the word and sweep masks are independent layers on
                // the media rect. This initialization owns their feather geometry.
                var VIEW_WIDTH = 1200;
                var featherPercent = (featherPx / VIEW_WIDTH) * 100;
                var hiddenSweepPercent = -featherPercent;
                mediaRect.style.maskImage =
                  "url(#svg-mask-reveal-word-mask), linear-gradient(to right, black var(--svg-mask-reveal-sweep-x, -10%), transparent calc(var(--svg-mask-reveal-sweep-x, -10%) + " +
                  featherPercent +
                  "%))";

                // RETIME RANGE: IN_BASE and OUT_BASE define the burst envelope.
                // The sweep uses --ease-standard's GSAP owner, power2.out.
                var IN_BASE = 0.9;
                var OUT_BASE = 0.45;
                var SWEEP_START_BASE = 0.08;
                var SWEEP_LANDS_BASE = 0.8;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var envelopeBase = IN_BASE + OUT_BASE;
                var scale = duration < envelopeBase ? duration / envelopeBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var SWEEP_START = SWEEP_START_BASE * scale;
                var SWEEP_DURATION = (SWEEP_LANDS_BASE - SWEEP_START_BASE) * scale;
                var targetSweepPercent = revealProgress === 0 ? hiddenSweepPercent : revealProgress;

                gsap.set(stage, { opacity: 1 });
                gsap.set(mediaRect, {
                  "--svg-mask-reveal-sweep-x": hiddenSweepPercent + "%",
                });

                var tl = gsap.timeline({ paused: true });
                tl.to(
                  mediaRect,
                  {
                    "--svg-mask-reveal-sweep-x": targetSweepPercent + "%",
                    duration: SWEEP_DURATION,
                    ease: "power2.out",
                  },
                  SWEEP_START,
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
    <div
            id="root"
            data-composition-id="svg-mask-reveal"
            data-start="0"
            data-duration="4"
            data-fps="30"
          >
            
    
            <div
              id="svg-mask-reveal-clip"
              class="smr-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="smr-stage">
                <svg
                  class="smr-svg"
                  viewBox="0 0 1200 500"
                  role="img"
                  aria-label="REVEAL"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    
                    <linearGradient
                      id="svg-mask-reveal-media-gradient"
                      gradientUnits="userSpaceOnUse"
                      x1="80"
                      y1="420"
                      x2="1120"
                      y2="80"
                    >
                      <stop class="smr-media-start" offset="0" />
                      <stop class="smr-media-middle" offset="0.52" />
                      <stop class="smr-media-end" offset="1" />
                    </linearGradient>
    
                    
                    <mask
                      id="svg-mask-reveal-word-mask"
                      mask-type="alpha"
                      maskUnits="userSpaceOnUse"
                      maskContentUnits="userSpaceOnUse"
                      x="0"
                      y="0"
                      width="1200"
                      height="500"
                    >
                      <text
                        id="svg-mask-reveal-text"
                        class="smr-mask-text"
                        x="600"
                        y="260"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        textLength="1000"
                        lengthAdjust="spacingAndGlyphs"
                      >
                        REVEAL
                      </text>
                    </mask>
                  </defs>
    
                  
                  <text
                    id="svg-mask-reveal-outline"
                    class="smr-outline"
                    x="600"
                    y="260"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    textLength="1000"
                    lengthAdjust="spacingAndGlyphs"
                  >
                    REVEAL
                  </text>
                  <rect
                    class="smr-media"
                    x="0"
                    y="0"
                    width="1200"
                    height="500"
                    fill="url(#svg-mask-reveal-media-gradient)"
                  />
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
  @property --svg-mask-reveal-sweep-x {
    syntax: "<percentage>";
    inherits: false;
    initial-value: -10%;
  }

  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  /* INVARIANT: the host owns dimensions. All visible layout derives
  from this size container, and the root is styled only by #root. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #101d31);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .smr-clip, .smr-stage {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .smr-stage {
    display: grid;
    place-items: center;
  }

  /* EDIT ZONE: presentation scale. The SVG keeps its 12:5 viewBox
  while these container-relative limits make it fit wide and tall
  hosts without stage-pixel assumptions. */
  .smr-svg {
    display: block;
    width: min(92cqw, 168cqh);
    height: auto;
    overflow: visible;
  }

  .smr-media-start {
    stop-color: var(--brand, #ff7a33);
  }

  .smr-media-middle {
    stop-color: var(--accent, #22d3ee);
  }

  .smr-media-end {
    stop-color: var(--fg, #f8fafc);
  }

  .smr-mask-text {
    fill: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 240px;
    font-weight: 850;
    letter-spacing: 0.02em;
  }

  .smr-media {
    mask-mode: alpha, alpha;
    mask-composite: intersect;
  }

  .smr-outline {
    fill: none;
    stroke: var(--border, rgba(248, 250, 252, 0.22));
    stroke-width: 2;
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 240px;
    font-weight: 850;
    letter-spacing: 0.02em;
  }
}
</style>
