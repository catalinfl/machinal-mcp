<!-- Modified Svelte adaptation of registry/components/soft-blur-in/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var distances = { close: 14, standard: 28, far: 52 };
              var directions = { up: 1, down: -1 };
              var blurs = { soft: 8, standard: 18, heavy: 34 };

              var distance = distances[pick(distances, vars.distance, "standard")];
              var direction = directions[pick(directions, vars.direction, "up")];
              var blur = blurs[pick(blurs, vars.blur, "standard")];

              // Set on the root so every element carrying the class inherits the values,
              // whether it exists yet or not.
              var root = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              root.style.setProperty("--hf-soft-blur-y", distance * direction + "px");
              root.style.setProperty("--hf-soft-blur-radius", blur + "px");
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.to(
              ".hf-soft-blur-in",
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.8,
                ease: "power3.out",
                stagger: 0.12,
              },
              0.35,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#101418">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="soft-blur-in-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
          data-composition-variables='[
        &#123; "id": "distance", "type": "enum", "role": "motion", "label": "Distance", "description": "How far the element is offset before it slides home: 14px, 28px or 52px.", "default": "standard", "options": [&#123; "value": "close", "label": "Close" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "far", "label": "Far" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "up starts the element below its resting place so it rises in, down starts it above so it drops in.", "default": "up", "options": [&#123; "value": "up", "label": "Up" &#125;, &#123; "value": "down", "label": "Down" &#125;] &#125;,
        &#123; "id": "blur", "type": "enum", "role": "style", "label": "Blur", "description": "Starting blur radius, from a light haze to a full smear.", "default": "standard", "options": [&#123; "value": "soft", "label": "Soft" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "heavy", "label": "Heavy" &#125;] &#125;
      ]'
        >
          <div class="wrap">
            <div class="eyebrow hf-soft-blur-in">Motion Primitive</div>
            <div class="title hf-soft-blur-in">Soft blur reveals that feel cinematic.</div>
            <div class="copy hf-soft-blur-in">
              Use it for titles, labels, stats, and scene intros without adding a framework.
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
  .hf-port {
    background: #101418;
    font-family: Inter, system-ui, sans-serif;
  }
  #demo {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background:
      radial-gradient(circle at 25% 20%, #3b5b7a 0, transparent 30%),
      linear-gradient(135deg, #101418, #20282f);
    color: white;
  }
  .wrap {
    position: absolute;
    left: 180px;
    top: 310px;
    width: 1200px;
  }
  .eyebrow {
    color: #80d9ff;
    font-size: 40px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }
  .title {
    margin-top: 28px;
    font-size: 132px;
    line-height: 0.92;
    font-weight: 850;
    letter-spacing: -0.02em;
  }
  .copy {
    margin-top: 42px;
    width: 780px;
    color: #d7e3ea;
    font-size: 42px;
    line-height: 1.18;
  }
  .hf-soft-blur-in {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
    filter: blur(18px);
    will-change: transform, opacity, filter;
  }


  .hf-soft-blur-in {
    opacity: 0;
    transform: translate3d(0, var(--hf-soft-blur-y, 28px), 0);
    filter: blur(var(--hf-soft-blur-radius, 18px));
    will-change: transform, opacity, filter;
  }
}
</style>
