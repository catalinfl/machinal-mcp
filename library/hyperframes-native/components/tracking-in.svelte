<!-- Modified Svelte adaptation of registry/components/tracking-in/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var reaches = { tight: 0.6, standard: 1, wide: 1.8 };
              var rises = { subtle: "4px", standard: "8px", bold: "18px" };
              var tones = {
                inherit: "inherit",
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var reach = reaches[pick(reaches, vars.tracking, "standard")];
              var rise = rises[pick(rises, vars.rise, "standard")];
              var tone = tones[pick(tones, vars.tone, "inherit")];

              // The class is applied to arbitrary host elements, so the resolved values
              // ride the document root and inherit down to every one of them.
              var host = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              host.style.setProperty("--hf-tracking-reach", String(reach));
              host.style.setProperty("--hf-tracking-y", rise);
              host.style.setProperty("--hf-tracking-color", tone);
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.to(
              ".hf-tracking-in",
              {
                opacity: 1,
                "--hf-tracking-value": "0.02em",
                y: 0,
                duration: 0.9,
                ease: "power3.out",
                stagger: 0.16,
              },
              0.45,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#fafafa">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="tracking-in-demo"
          data-width="1920"
          data-height="1080"
          data-duration="4"
          data-composition-variables='[
        &#123; "id": "tracking", "type": "enum", "role": "style", "label": "Tracking", "description": "Multiplies the letter-spacing the timeline drives, so the reveal starts and settles proportionally wider or tighter.", "default": "standard", "options": [&#123; "value": "tight", "label": "Tight" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;,
        &#123; "id": "rise", "type": "enum", "role": "motion", "label": "Rise", "description": "Vertical offset the text starts from, which the timeline reads as the start of its travel and eases to zero.", "default": "standard", "options": [&#123; "value": "subtle", "label": "Subtle" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "bold", "label": "Bold" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Text colour: inherit keeps the surrounding page colour, ink suits light frames, paper dark ones, accent rides --brand.", "default": "inherit", "options": [&#123; "value": "inherit", "label": "Inherit" &#125;, &#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
        >
          <div class="panel">
            <div class="label hf-tracking-in">Editorial motion</div>
            <div class="headline hf-tracking-in">TRACKING IN</div>
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
    font-family: Inter, system-ui, sans-serif;
    background: #fafafa;
  }
  #demo {
    position: relative;
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #fafafa, #f4f4f5);
    color: #18181b;
  }
  .panel {
    text-align: center;
    width: 1260px;
  }
  .label {
    font-size: 28px;
    font-weight: 600;
    color: #71717a;
    text-transform: uppercase;
    letter-spacing: 0.18em;
  }
  .headline {
    margin-top: 28px;
    font-size: 118px;
    line-height: 1;
    font-weight: 900;
  }
  .hf-tracking-in {
    opacity: 0;
    letter-spacing: var(--hf-tracking-value, 0.28em);
    transform: translateY(8px);
    will-change: opacity, letter-spacing, transform;
  }


  .hf-tracking-in {
    opacity: 0;
    color: var(--hf-tracking-color, inherit);
    letter-spacing: calc(var(--hf-tracking-value, 0.28em) * var(--hf-tracking-reach, 1));
    transform: translateY(var(--hf-tracking-y, 8px));
    will-change: opacity, letter-spacing, transform;
  }
}
</style>
