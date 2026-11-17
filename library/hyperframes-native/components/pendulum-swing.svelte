<!-- Modified Svelte adaptation of registry/components/pendulum-swing/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var pivots = {
                "top-center": "50% 0%",
                "top-left": "0% 0%",
                "top-right": "100% 0%",
              };
              var amplitudes = { gentle: "18deg", standard: "34deg", wide: "52deg" };
              var directions = { right: 1, left: -1 };
              // Each tone is a fill/text pair so the sign keeps AA contrast.
              var tones = {
                ink: { bg: "#18181b", fg: "#fafafa" },
                paper: { bg: "#fafafa", fg: "#18181b" },
                accent: { bg: "var(--brand, #34d399)", fg: "#0b0b0c" },
              };

              var origin = pivots[pick(pivots, vars.pivot, "top-center")];
              var maxAngle = amplitudes[pick(amplitudes, vars.amplitude, "standard")];
              var dir = directions[pick(directions, vars.direction, "right")];
              var tone = tones[pick(tones, vars.tone, "ink")];

              var roots = document.querySelectorAll(".hf-catalog-pendulum-swing");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-swing-origin", origin);
                root.style.setProperty("--hf-swing-max", maxAngle);
                root.style.setProperty("--hf-swing-dir", String(dir));
                root.style.setProperty("--hf-swing-bg", tone.bg);
                root.style.setProperty("--hf-swing-fg", tone.fg);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.4;
            // A pendulum does not snap upright in a single overshoot; it swings
            // through the rest point several times, each pass smaller, until
            // friction stills it. This ease is that motion: a cosine (the swings)
            // inside an exponential decay (the damping). It is normalised so the
            // tween still lands exactly upright (angle 0) at the end, and rotation
            // stays sub-pixel under the seek-by-frame capture engine.
            const swingSettle = (p) => 1 - Math.exp(-2.3 * p) * Math.cos(3.5 * Math.PI * p);
            tl.fromTo(
              ".hf-catalog-pendulum-swing",
              { "--hf-swing-angle": 1 },
              {
                "--hf-swing-angle": 0,
                duration: 2.9,
                ease: swingSettle,
              },
              startTime,
            );
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="pendulum-swing-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="swing-label">Pendulum Swing</div>
          <div class="demo-frame">
            <div class="swing-rig">
              <div class="swing-hook"></div>
              <div
                class="hf-catalog-pendulum-swing"
                data-composition-variables='[
        &#123; "id": "pivot", "type": "enum", "role": "layout", "label": "Pivot", "description": "Where the content hangs from. The swing rotates about this point, so the top edge stays pinned.", "default": "top-center", "options": [&#123; "value": "top-center", "label": "Top center" &#125;, &#123; "value": "top-left", "label": "Top left" &#125;, &#123; "value": "top-right", "label": "Top right" &#125;] &#125;,
        &#123; "id": "amplitude", "type": "enum", "role": "motion", "label": "Amplitude", "description": "How far the first swing reaches before it settles. Every later swing scales with it, so the pendulum still comes to rest upright.", "default": "standard", "options": [&#123; "value": "gentle", "label": "Gentle" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Which side the pendulum swings in from: right lifts the first swing clockwise, left mirrors it.", "default": "right", "options": [&#123; "value": "right", "label": "Right" &#125;, &#123; "value": "left", "label": "Left" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Content colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
              >
                <span class="hf-catalog-pendulum-swing__body">Hanging&nbsp;Sign</span>
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
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    position: relative;
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f7f7f8;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
    /* ponytail: scale on non-GSAP wrapper — safe, GSAP only animates
    --hf-swing-angle on the pendulum root below. */
    transform: scale(1.4);
    transform-origin: center center;
  }
  /* The hook the sign hangs from, drawn above the pivot for context. */
  .swing-rig {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .swing-hook {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #a1a1aa;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.18);
  }
  /* Pinned to the frame bottom, clear of the sign at its widest swing. */
  .swing-label {
    position: absolute;
    bottom: 160px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #71717a;
  }
  .hf-catalog-pendulum-swing {
    display: inline-block;
    transform-origin: var(--hf-swing-origin, 50% 0%);
    transform: rotate(
      calc(var(--hf-swing-angle, 0) * var(--hf-swing-dir, 1) * var(--hf-swing-max, 34deg))
    );
  }
  .hf-catalog-pendulum-swing__body {
    display: inline-block;
    padding: 22px 40px;
    border-radius: 14px;
    background: var(--hf-swing-bg, #18181b);
    color: var(--hf-swing-fg, #fafafa);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 800;
    font-size: 54px;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
}
</style>
