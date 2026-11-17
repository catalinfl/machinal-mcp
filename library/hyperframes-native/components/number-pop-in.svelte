<!-- Modified Svelte adaptation of registry/components/number-pop-in/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var lifts = { close: 0.5, standard: 1, far: 1.75 };
              var tones = {
                ink: { number: "#18181b", unit: "#71717a" },
                paper: { number: "#fafafa", unit: "#a1a1aa" },
                accent: { number: "var(--brand, #34d399)", unit: "var(--brand, #34d399)" },
              };

              function text(value, fallback) {
                return typeof value === "string" ? value : fallback;
              }

              var value = text(vars.value, "5.7");
              if (value === "") value = "5.7";
              var unit = text(vars.unit, "k");
              var lift = Object.prototype.hasOwnProperty.call(lifts, vars.lift)
                ? vars.lift
                : "standard";
              var tone = Object.prototype.hasOwnProperty.call(tones, vars.tone) ? vars.tone : "ink";

              var roots = document.querySelectorAll(".hf-transition-number-pop-in");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-number-lift", String(lifts[lift]));
                root.style.setProperty("--hf-number-color", tones[tone].number);
                root.style.setProperty("--hf-number-unit-color", tones[tone].unit);

                var next = [];
                for (var c = 0; c < value.length; c += 1) {
                  var span = document.createElement("span");
                  span.textContent = value.charAt(c);
                  next.push(span);
                }
                if (unit !== "") {
                  var small = document.createElement("small");
                  small.textContent = unit;
                  next.push(small);
                }
                root.replaceChildren.apply(root, next);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-transition-number-pop-in span, .hf-transition-number-pop-in small",
              {
                opacity: 0,
                "--hf-number-y": "24px",
                "--hf-number-scale": 0.82,
                "--hf-number-blur": "8px",
              },
              {
                opacity: 1,
                "--hf-number-y": "0px",
                "--hf-number-scale": 1,
                "--hf-number-blur": "0px",
                duration: 0.34,
                stagger: 0.055,
                ease: "back.out(1.8)",
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
          data-composition-id="number-pop-in-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-number-pop-in"
              data-composition-variables='[
        &#123; "id": "value", "type": "string", "role": "content", "label": "Value", "description": "The number itself. Every character becomes its own span, so the stagger still lands character by character.", "default": "5.7" &#125;,
        &#123; "id": "unit", "type": "string", "role": "content", "label": "Unit", "description": "Small suffix printed after the number. Pass an empty string to drop it.", "default": "k" &#125;,
        &#123; "id": "lift", "type": "enum", "role": "motion", "label": "Lift", "description": "Scales the offset the timeline drives, so the characters cover a shorter or longer run in the same time.", "default": "standard", "options": [&#123; "value": "close", "label": "Close" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "far", "label": "Far" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Number colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
            >
              <span>5</span><span>.</span><span>7</span><small>k</small>
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
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f7f7f8;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale non-GSAP wrapper so the stat fills ~65% of the frame */
    transform: scale(1.37);
  }
  .hf-transition-number-pop-in {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-transition-number-pop-in span {
    font-size: 96px;
    line-height: 0.9;
    filter: blur(var(--hf-number-blur, 0px));
    transform: translateY(var(--hf-number-y, 0px)) scale(var(--hf-number-scale, 1));
    will-change: transform, filter, opacity;
  }
  .hf-transition-number-pop-in small {
    margin-left: 4px;
    color: #71717a;
    font-size: 42px;
    font-weight: 700;
  }


  .hf-transition-number-pop-in {
    display: inline-flex;
    align-items: baseline;
    gap: 2px;
    color: var(--hf-number-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-transition-number-pop-in span {
    font-size: 76px;
    line-height: 0.9;
    filter: blur(var(--hf-number-blur, 0px));
    transform: translateY(calc(var(--hf-number-y, 0px) * var(--hf-number-lift, 1)))
    scale(var(--hf-number-scale, 1));
    will-change: transform, filter, opacity;
  }
  .hf-transition-number-pop-in small {
    margin-left: 2px;
    color: var(--hf-number-unit-color, #71717a);
    font-size: 34px;
    font-weight: 850;
  }
}
</style>
