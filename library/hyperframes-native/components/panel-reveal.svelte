<!-- Modified Svelte adaptation of registry/components/panel-reveal/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var widths = { narrow: "280px", standard: "360px", wide: "480px" };
              var tones = {
                paper: {
                  surface: "#fff",
                  border: "#e4e4e7",
                  text: "#18181b",
                  muted: "#71717a",
                },
                ink: {
                  surface: "#18181b",
                  border: "#3f3f46",
                  text: "#fafafa",
                  muted: "#a1a1aa",
                },
              };
              var reveals = { fade: 1, solid: 0 };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var width = widths[pick(widths, vars.width, "standard")];
              var tone = tones[pick(tones, vars.tone, "paper")];
              var fade = reveals[pick(reveals, vars.reveal, "fade")];

              var title = typeof vars.title === "string" ? vars.title.trim() : "";
              if (!title) {
                title = "Motion tokens";
              }

              var roots = document.querySelectorAll(".hf-transition-panel-reveal");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-panel-width", width);
                root.style.setProperty("--hf-panel-surface", tone.surface);
                root.style.setProperty("--hf-panel-border", tone.border);
                root.style.setProperty("--hf-panel-text", tone.text);
                root.style.setProperty("--hf-panel-muted", tone.muted);
                root.style.setProperty("--hf-panel-fade", String(fade));

                var header = root.querySelector("header");
                if (header) {
                  header.textContent = title;
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-transition-panel-reveal",
              { "--hf-panel-open": 0 },
              { "--hf-panel-open": 1, duration: 0.44, ease: "power3.inOut" },
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
          data-composition-id="panel-reveal-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <section
              class="hf-transition-panel-reveal"
              data-composition-variables='[
        &#123; "id": "title", "type": "string", "role": "content", "label": "Title", "description": "The header line that sits above the folded body.", "default": "Motion tokens" &#125;,
        &#123; "id": "width", "type": "enum", "role": "layout", "label": "Width", "description": "How wide the panel sits, 280, 360 or 480 px.", "default": "standard", "options": [&#123; "value": "narrow", "label": "Narrow" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Surface family: paper is the white card for light frames, ink inverts it for dark frames.", "default": "paper", "options": [&#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "ink", "label": "Ink" &#125;] &#125;,
        &#123; "id": "reveal", "type": "enum", "role": "motion", "label": "Reveal", "description": "Whether the body fades in with the height. fade is the shipped motion, solid opens the height only.", "default": "fade", "options": [&#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "solid", "label": "Solid" &#125;] &#125;
      ]'
            >
              <header>Motion tokens</header>
              <div>
                <p>Duration 420ms</p>
                <p>Easing power3.out</p>
              </div>
            </section>
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
    /* ponytail: scale wrapper — GSAP targets .hf-transition-panel-reveal, not this element */
    transform: scale(2.6);
    transform-origin: center center;
  }
  .hf-transition-panel-reveal {
    --hf-panel-open: 1;
    width: 380px;
    overflow: hidden;
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    background: #fff;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 24px 70px rgba(24, 24, 27, 0.1);
  }
  .hf-transition-panel-reveal header {
    padding: 18px 20px 14px;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .hf-transition-panel-reveal div {
    max-height: calc(var(--hf-panel-open) * 120px);
    opacity: var(--hf-panel-open);
    padding: 0 20px calc(var(--hf-panel-open) * 20px);
    overflow: hidden;
  }
  .hf-transition-panel-reveal p {
    margin: 0 0 8px;
    color: #71717a;
    font-size: 15px;
  }


  .hf-transition-panel-reveal {
    --hf-panel-open: 1;
    width: var(--hf-panel-width, 360px);
    overflow: hidden;
    border: 1px solid var(--hf-panel-border, #e4e4e7);
    border-radius: 14px;
    background: var(--hf-panel-surface, #fff);
    color: var(--hf-panel-text, #18181b);
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 20px 56px rgba(24, 24, 27, 0.1);
  }
  .hf-transition-panel-reveal header {
    padding: 15px 17px;
    font-weight: 900;
  }
  .hf-transition-panel-reveal div {
    max-height: calc(var(--hf-panel-open) * 120px);
    opacity: calc(1 - var(--hf-panel-fade, 1) * (1 - var(--hf-panel-open)));
    padding: 0 17px calc(var(--hf-panel-open) * 17px);
    overflow: hidden;
  }
  .hf-transition-panel-reveal p {
    margin: 0 0 8px;
    color: var(--hf-panel-muted, #71717a);
    font-size: 14px;
  }
}
</style>
