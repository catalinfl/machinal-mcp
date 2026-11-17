<!-- Modified Svelte adaptation of registry/components/shared-axis-y/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var signs = { up: 1, down: -1 };
              var reaches = { close: 0.5, standard: 1, far: 1.85 };
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var sign = signs[pick(signs, vars.direction, "up")];
              var reach = reaches[pick(reaches, vars.distance, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];

              var roots = document.querySelectorAll(".hf-catalog-shared-axis-y");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-word-axis-y", String(sign * reach));
                roots[i].style.setProperty("--hf-word-color", tone);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-shared-axis-y span",
              { opacity: 0, "--hf-word-y": "32px" },
              { opacity: 1, "--hf-word-y": "0px", duration: 0.22, stagger: 0.075, ease: "power2.out" },
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
          data-composition-id="shared-axis-y-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="demo-card">
              <span class="demo-label">Mode</span>
              <div class="demo-tabs">
                <div class="demo-tab active">Plan</div>
                <div class="demo-tab">Debug</div>
                <div class="demo-tab">Ask</div>
              </div>
              <div class="demo-divider"></div>
              <div
                class="hf-catalog-shared-axis-y"
                data-composition-variables='[
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Which side of the baseline the words travel in from.", "default": "up", "options": [&#123; "value": "up", "label": "Up" &#125;, &#123; "value": "down", "label": "Down" &#125;] &#125;,
        &#123; "id": "distance", "type": "enum", "role": "motion", "label": "Distance", "description": "Scales the vertical offset, so the words cover a shorter or longer run in the same time.", "default": "standard", "options": [&#123; "value": "close", "label": "Close" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "far", "label": "Far" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Word colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
              >
                <span>Plan</span><span>Debug</span><span>Ask</span>
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
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f4f4f5;
    font-family: Inter, system-ui, sans-serif;
  }
  /* ponytail: zoom on .demo-frame (non-GSAP wrapper) keeps GSAP inline transforms on the child untouched */
  .demo-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    zoom: 2.2;
  }
  .demo-card {
    background: #fafafa;
    border: 1px solid #e4e4e7;
    border-radius: 16px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.1);
    padding: 48px 56px 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    min-width: 480px;
  }
  .demo-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #71717a;
  }
  .demo-tabs {
    display: flex;
    gap: 4px;
    background: #f4f4f5;
    border-radius: 10px;
    padding: 4px;
  }
  .demo-tab {
    font-size: 13px;
    font-weight: 500;
    color: #71717a;
    padding: 6px 16px;
    border-radius: 7px;
    cursor: default;
  }
  .demo-tab.active {
    background: #fff;
    color: #18181b;
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  }
  .demo-divider {
    width: 100%;
    height: 1px;
    background: #e4e4e7;
  }
  .hf-catalog-shared-axis-y {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 800;
    letter-spacing: -0.03em;
    display: inline-flex;
    gap: 10px;
    font-size: 48px;
    line-height: 1;
  }
  .hf-catalog-shared-axis-y span {
    display: inline-block;
    transform: translate(var(--hf-word-x, 0px), var(--hf-word-y, 0px))
    scale(var(--hf-word-scale, 1));
    filter: blur(var(--hf-word-blur, 0px));
    will-change: transform, filter, opacity;
  }


  .hf-catalog-shared-axis-y {
    color: var(--hf-word-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-shared-axis-y {
    display: inline-flex;
    gap: 12px;
    font-size: 56px;
    line-height: 1;
  }
  .hf-catalog-shared-axis-y span {
    display: inline-block;
    transform: translate(
      var(--hf-word-x, 0px),
      calc(var(--hf-word-y, 0px) * var(--hf-word-axis-y, 1))
    )
    scale(var(--hf-word-scale, 1));
    filter: blur(var(--hf-word-blur, 0px));
    will-change: transform, filter, opacity;
  }
}
</style>
