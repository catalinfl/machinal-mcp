<!-- Modified Svelte adaptation of registry/components/text-state-swap/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var reaches = { close: 0.5, standard: 1, far: 1.85 };
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              function text(value, fallback) {
                var resolved = value == null ? "" : String(value).trim();
                return resolved.length > 0 ? resolved : fallback;
              }

              var fromText = text(vars["from-text"], "Saving draft");
              var toText = text(vars["to-text"], "Saved");
              var reach = reaches[pick(reaches, vars.distance, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];

              var roots = document.querySelectorAll(".hf-transition-text-state-swap");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-text-reach", String(reach));
                root.style.setProperty("--hf-text-color", tone);
                root.querySelector(".from").textContent = fromText;
                root.querySelector(".to").textContent = toText;
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.to(
              ".hf-transition-text-state-swap .from",
              {
                opacity: 0,
                "--hf-text-y": "-18px",
                "--hf-text-blur": "8px",
                duration: 0.18,
                ease: "power2.in",
              },
              startTime,
            );
            tl.fromTo(
              ".hf-transition-text-state-swap .to",
              { opacity: 0, "--hf-text-y": "18px", "--hf-text-blur": "8px" },
              {
                opacity: 1,
                "--hf-text-y": "0px",
                "--hf-text-blur": "0px",
                duration: 0.26,
                ease: "power2.out",
              },
              startTime + 0.12,
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
          data-composition-id="text-state-swap-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="demo-card">
              <div class="demo-card-header">
                <span class="demo-card-title">Draft</span>
                <span class="demo-card-dot"></span>
              </div>
              <div class="demo-card-body">
                <div class="demo-card-line w-full"></div>
                <div class="demo-card-line w-3q"></div>
                <div class="demo-card-line w-full"></div>
                <div class="demo-card-line w-half"></div>
              </div>
              <div class="demo-card-footer">
                <div
                  class="hf-transition-text-state-swap"
                  data-composition-variables='[
        &#123;"id": "from-text", "type": "string", "role": "content", "label": "From text", "description": "The outgoing label, on screen before the swap.", "default": "Saving draft"&#125;,
        &#123;"id": "to-text", "type": "string", "role": "content", "label": "To text", "description": "The incoming label, on screen after the swap. It rests hidden until the timeline reveals it.", "default": "Saved"&#125;,
        &#123;"id": "distance", "type": "enum", "role": "motion", "label": "Distance", "description": "Scales the vertical offset the timeline drives, so each label covers a shorter or longer run in the same time.", "default": "standard", "options": [&#123;"value": "close", "label": "Close"&#125;, &#123;"value": "standard", "label": "Standard"&#125;, &#123;"value": "far", "label": "Far"&#125;]&#125;,
        &#123;"id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Label colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123;"value": "ink", "label": "Ink"&#125;, &#123;"value": "paper", "label": "Paper"&#125;, &#123;"value": "accent", "label": "Accent"&#125;]&#125;
      ]'
                >
                  <span class="from">Saving draft…</span><span class="to">Saved</span>
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
    background: #f5f5f4;
    font-family: Inter, system-ui, sans-serif;
  }
  /* ponytail: scale on non-GSAP wrapper, safe to use transform here */
  .demo-frame {
    display: grid;
    place-items: center;
    transform: scale(2.6);
    transform-origin: center center;
  }
  .demo-card {
    background: #ffffff;
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
    padding: 32px 40px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 340px;
  }
  .demo-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .demo-card-title {
    font-size: 13px;
    font-weight: 600;
    color: #71717a;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }
  .demo-card-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
  }
  .demo-card-body {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .demo-card-line {
    height: 10px;
    border-radius: 5px;
    background: #f4f4f5;
  }
  .demo-card-line.w-full {
    width: 100%;
  }
  .demo-card-line.w-3q {
    width: 75%;
  }
  .demo-card-line.w-half {
    width: 50%;
  }
  .demo-card-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding-top: 4px;
    border-top: 1px solid #f4f4f5;
  }
  .hf-transition-text-state-swap {
    position: relative;
    width: 140px;
    height: 22px;
    overflow: hidden;
    color: #18181b;
    font:
      700 14px/1 Inter,
      system-ui,
      sans-serif;
  }
  .hf-transition-text-state-swap span {
    position: absolute;
    left: 0;
    top: 0;
    filter: blur(var(--hf-text-blur, 0px));
    transform: translateY(var(--hf-text-y, 0px));
    will-change: transform, filter, opacity;
  }
  .hf-transition-text-state-swap .to {
    opacity: 0;
  }


  .hf-transition-text-state-swap {
    position: relative;
    width: 250px;
    height: 36px;
    color: var(--hf-text-color, #18181b);
    font:
      900 28px/1 Inter,
      system-ui,
      sans-serif;
  }
  .hf-transition-text-state-swap span {
    position: absolute;
    left: 0;
    top: 0;
    filter: blur(var(--hf-text-blur, 0px));
    transform: translateY(calc(var(--hf-text-y, 0px) * var(--hf-text-reach, 1)));
    will-change: transform, filter, opacity;
  }
  .hf-transition-text-state-swap .to {
    opacity: 0;
  }
}
</style>
