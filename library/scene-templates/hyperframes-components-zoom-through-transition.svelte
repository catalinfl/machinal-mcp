<!-- Modified Svelte adaptation of registry/components/zoom-through-transition/zoom-through-transition.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // Unrecognised overrides return to their declared defaults.
                var depths = { close: 0.55, standard: 1, far: 1.7 };
                // Each choice routes to a different contract token so the variable stays
                // meaningful under a theme rather than collapsing into one themed accent.
                var HAIRLINE = "rgba(255, 255, 255, 0.28)";
                var accents = {
                  blue: "var(--accent, " + HAIRLINE + ")",
                  green: "var(--brand, " + HAIRLINE + ")",
                  violet: "var(--accent-2, " + HAIRLINE + ")",
                };

                function pick(table, value, fallback) {
                  return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
                }

                function label(value) {
                  return typeof value === "string" && value !== "" ? value : null;
                }

                var depth = depths[pick(depths, vars.depth, "standard")];
                var accent = accents[pick(accents, vars.accent, "blue")];
                var fromLabel = label(vars["from-label"]);
                var toLabel = label(vars["to-label"]);

                var roots = document.querySelectorAll(".hf-catalog-zoom-through-transition");
                var mountRoot = document.getElementById("root");
                for (var i = 0; i < roots.length; i += 1) {
                  var root = roots[i];
                  root.style.setProperty("--hf-depth", String(depth));
                  root.style.setProperty("--hf-accent", accent);

                  var fromScene = root.querySelector(".from");
                  var toScene = root.querySelector(".to");
                  if (fromLabel !== null && fromScene) {
                    fromScene.textContent = fromLabel;
                  }
                  if (toLabel !== null && toScene) {
                    toScene.textContent = toLabel;
                  }
                }

                // The motion used to live only in this file's demo page, so an installed
                // copy rendered the finished pose and never moved. The timeline belongs
                // with the markup it drives: build it here, paused, and register it under
                // this composition's own id so the runtime seeks it frame by frame.
                if (!mountRoot || !gsap) return;

                var SELF = ".hf-catalog-zoom-through-transition";
                var duration = Math.max(0.001, parseFloat(mountRoot.dataset.duration || "3"));
                // The push reads as a transition only with a beat of the outgoing scene
                // before it. Clamped so the wipe always lands inside the duration.
                var PUSH = 0.9;
                var START = Math.max(0, Math.min(0.35, duration - PUSH));

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  SELF + " .to",
                  { "--hf-clip-right": "100%", "--hf-to-x": "60px", "--hf-to-scale": 1.04 },
                  {
                    "--hf-clip-right": "0%",
                    "--hf-to-x": "0px",
                    "--hf-to-scale": 1,
                    duration: PUSH,
                    ease: "power3.inOut",
                  },
                  START,
                );
                tl.fromTo(
                  SELF + " .from",
                  { "--hf-from-x": "0px", "--hf-from-scale": 1, "--hf-from-blur": "0px" },
                  {
                    "--hf-from-x": "-70px",
                    "--hf-from-scale": 0.96,
                    "--hf-from-blur": "5px",
                    duration: PUSH,
                    ease: "power3.inOut",
                  },
                  START,
                );
                tl.fromTo(
                  SELF + " .fx",
                  { "--hf-fx-x": "-110%" },
                  { "--hf-fx-x": "110%", duration: 0.58, ease: "power2.inOut" },
                  START + 0.18,
                );
                // repeat/yoyo resolves from absolute time on every seek, so the strobe is
                // reproducible at any frame rather than accumulated across ticks.
                tl.fromTo(
                  SELF + " .rgb",
                  { "--hf-rgb-opacity": 0, "--hf-rgb-x": "-16px" },
                  {
                    "--hf-rgb-opacity": 1,
                    "--hf-rgb-x": "16px",
                    repeat: 3,
                    yoyo: true,
                    duration: 0.07,
                    ease: "steps(1)",
                  },
                  START + 0.32,
                );

                // HOLD: the incoming scene rests for whatever is left of the duration.
                tl.set({}, {}, duration);

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "from-label", "type": "string", "role": "content", "label": "Outgoing label", "description": "Caption on the outgoing scene, the one on screen when the transition starts.", "default": "Before" &#125;,
        &#123; "id": "to-label", "type": "string", "role": "content", "label": "Incoming label", "description": "Caption on the incoming scene, the one the timeline wipes into frame.", "default": "Zoom Through Transition" &#125;,
        &#123; "id": "depth", "type": "enum", "role": "motion", "label": "Depth", "description": "Multiplies how far both scenes travel and how hard the outgoing one blurs, so the push covers a shorter or longer run in the same time.", "default": "standard", "options": [&#123; "value": "close", "label": "Close" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "far", "label": "Far" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Theme token for the ring marking the incoming scene. Blue rides --accent, green --brand, violet --accent-2; each falls back to a neutral hairline.", "default": "blue", "options": [&#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="3" data-composition-id="zoom-through-transition" data-duration="3" data-fps="30">
            
    
            <div class="hf-catalog-zoom-through-transition">
              >
              <div class="scene from">Before</div>
              <div class="scene to">Zoom Through Transition</div>
              <div class="fx"></div>
              <div class="rgb"></div>
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

  /* Root fills the host-owned box; the scenes measure against it. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: #111827;
  }

  .hf-catalog-zoom-through-transition {
    --hf-accent: var(--accent, rgba(255, 255, 255, 0.28));
    --hf-l1: rgba(255, 255, 255, 0.72);
    --hf-l3: rgba(255, 255, 255, 0.18);
    --hf-l4: rgba(255, 255, 255, 0.08);
    --hf-hair: rgba(255, 255, 255, 0.14);
    --hf-ink: #111827;
    --hf-muted: #6b7280;
    --hf-surface: #ffffff;
    color: var(--hf-ink);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-catalog-zoom-through-transition {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: #111827;
  }
  .hf-catalog-zoom-through-transition .scene {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-weight: 900;
    font-size: 13.5cqmin;
    letter-spacing: -0.05em;
    color: #fff;
  }
  .hf-catalog-zoom-through-transition .from {
    background:
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.04) 0 1px,
        transparent 1px 4px
      ),
      var(--hf-l4);
    transform: translate(
      calc(var(--hf-from-x, 0px) * var(--hf-depth, 1)),
      calc(var(--hf-from-y, 0px) * var(--hf-depth, 1))
    )
    scale(var(--hf-from-scale, 1));
    filter: blur(calc(var(--hf-from-blur, 0px) * var(--hf-depth, 1)));
  }
  .hf-catalog-zoom-through-transition .to {
    background:
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, 0.05) 0 1px,
        transparent 1px 4px
      ),
      var(--hf-l3);
    box-shadow: inset 0 0 0 2px var(--hf-accent);
    transform: translate(
      calc(var(--hf-to-x, 0px) * var(--hf-depth, 1)),
      calc(var(--hf-to-y, 0px) * var(--hf-depth, 1))
    )
    scale(var(--hf-to-scale, 1));
    clip-path: inset(
      var(--hf-clip-top, 0%) var(--hf-clip-right, 100%) var(--hf-clip-bottom, 0%)
      var(--hf-clip-left, 0%)
    );
  }
  .hf-catalog-zoom-through-transition .fx {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.75), transparent);
    mix-blend-mode: screen;
    transform: translateX(var(--hf-fx-x, -110%));
  }
  .hf-catalog-zoom-through-transition .rgb {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: var(--hf-rgb-opacity, 0);
    background: linear-gradient(
      90deg,
      rgba(239, 68, 68, 0.35),
      transparent,
      rgba(34, 211, 238, 0.35)
    );
    transform: translateX(var(--hf-rgb-x, 0px));
  }
}
</style>
