<!-- Modified Svelte adaptation of registry/components/typewriter/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };
              var carets = {
                line: { width: "3px", display: "block" },
                block: { width: "22px", display: "block" },
                none: { width: "3px", display: "none" },
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var tone = tones[pick(tones, vars.tone, "ink")];
              var caret = carets[pick(carets, vars.caret, "line")];
              var text = typeof vars.text === "string" && vars.text !== "" ? vars.text : null;

              var roots = document.querySelectorAll(".hf-catalog-typewriter");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-type-color", tone);
                root.style.setProperty("--hf-caret-width", caret.width);
                root.style.setProperty("--hf-caret-display", caret.display);

                var line = root.querySelector("span");
                if (text !== null && line) {
                  line.textContent = text;
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-typewriter",
              { "--hf-type-progress": 0 },
              { "--hf-type-progress": 1, duration: 1.2, ease: "steps(28)" },
              startTime,
            );
            tl.to(
              ".hf-catalog-typewriter i",
              { "--hf-caret-opacity": 0.2, duration: 0.24, repeat: 7, yoyo: true, ease: "none" },
              startTime + 0.2,
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
          data-composition-id="typewriter-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-catalog-typewriter"
              data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "Line that types itself out character by character.", "default": "hyperframes add typewriter" &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Colour of the text and the caret: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;,
        &#123; "id": "caret", "type": "enum", "role": "style", "label": "Caret", "description": "Caret shape: a thin rule, a terminal-style block, or no caret at all.", "default": "line", "options": [&#123; "value": "line", "label": "Line" &#125;, &#123; "value": "block", "label": "Block" &#125;, &#123; "value": "none", "label": "None" &#125;] &#125;
      ]'
            >
              <span>hyperframes add typewriter</span><i></i>
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
    min-width: 900px;
    min-height: 500px;
    padding: 64px;
    /* ponytail: scale-up only; GSAP targets .hf-catalog-typewriter with CSS vars, not transforms */
    transform: scale(2);
  }
  .hf-catalog-typewriter {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-typewriter {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font:
      800 52px/1.2 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .hf-catalog-typewriter span {
    display: inline-block;
    max-width: calc(var(--hf-type-progress, 1) * 100%);
    overflow: hidden;
    white-space: nowrap;
  }
  .hf-catalog-typewriter i {
    width: 3px;
    height: 52px;
    border-radius: 999px;
    background: #18181b;
    opacity: var(--hf-caret-opacity, 1);
  }


  .hf-catalog-typewriter {
    color: var(--hf-type-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-typewriter {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font:
      800 42px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .hf-catalog-typewriter span {
    display: inline-block;
    max-width: calc(var(--hf-type-progress, 1) * 100%);
    overflow: hidden;
    white-space: nowrap;
  }
  .hf-catalog-typewriter i {
    display: var(--hf-caret-display, block);
    width: var(--hf-caret-width, 3px);
    height: 42px;
    border-radius: 999px;
    background: var(--hf-type-color, #18181b);
    opacity: var(--hf-caret-opacity, 1);
  }
}
</style>
