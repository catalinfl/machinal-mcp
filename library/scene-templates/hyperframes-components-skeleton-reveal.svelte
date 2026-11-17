<!-- Modified Svelte adaptation of registry/components/skeleton-reveal/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                light: null,
                dark: {
                  "--hf-sr-surface": "#18181b",
                  "--hf-sr-border": "#27272a",
                  "--hf-sr-bar": "#27272a",
                  "--hf-sr-bar-strong": "#3f3f46",
                  "--hf-sr-ink": "#fafafa",
                  "--hf-sr-muted": "#a1a1aa",
                },
              };
              var defaultName = "Jane Cooper";
              var defaultDetail = "jane@example.com";

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              function text(value, fallback) {
                return typeof value === "string" && value.trim() ? value.trim() : fallback;
              }

              var tone = tones[pick(tones, vars.tone, "light")];
              var name = text(vars.name, defaultName);
              var detail = text(vars.detail, defaultDetail);

              var roots = document.querySelectorAll(".hf-transition-skeleton-reveal");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                if (tone) {
                  for (var key in tone) root.style.setProperty(key, tone[key]);
                }
                var strong = root.querySelector(".content strong");
                var span = root.querySelector(".content span");
                if (strong) strong.textContent = name;
                if (span) span.textContent = detail;
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.to(
              ".hf-transition-skeleton-reveal .skeleton",
              { backgroundPosition: "100% 0", duration: 0.7, ease: "none" },
              startTime,
            );
            tl.to(
              ".hf-transition-skeleton-reveal .skeleton",
              { opacity: 0, duration: 0.22 },
              startTime + 0.72,
            );
            tl.to(
              ".hf-transition-skeleton-reveal .content",
              { opacity: 1, duration: 0.24 },
              startTime + 0.78,
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
          data-composition-id="skeleton-reveal-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-skeleton-reveal"
              data-composition-variables='[
        &#123; "id": "name", "type": "string", "role": "content", "label": "Name", "description": "Primary line revealed once the skeleton fades out.", "default": "Jane Cooper" &#125;,
        &#123; "id": "detail", "type": "string", "role": "content", "label": "Detail", "description": "Secondary line under the name, such as an email or a role.", "default": "jane@example.com" &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Card palette. Light is the paper card, dark is a near-black card with the matching skeleton bars and text.", "default": "light", "options": [&#123; "value": "light", "label": "Light" &#125;, &#123; "value": "dark", "label": "Dark" &#125;] &#125;
      ]'
            >
              <div class="skeleton"></div>
              <div class="content"><strong>Jane Cooper</strong><span>jane@example.com</span></div>
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
    /* ponytail: scale wrapper (not a GSAP target) to fill ~60% of frame */
    transform: scale(1.51);
  }
  .hf-transition-skeleton-reveal {
    position: relative;
    width: 400px;
    height: 96px;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-skeleton-reveal .skeleton, .hf-transition-skeleton-reveal .content {
    position: absolute;
    inset: 0;
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    background: #fff;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
  }
  .hf-transition-skeleton-reveal .skeleton {
    background: linear-gradient(90deg, #f4f4f5, #e4e4e7, #f4f4f5);
    background-size: 240% 100%;
    opacity: 1;
    box-shadow: none;
  }
  .hf-transition-skeleton-reveal .content {
    display: grid;
    align-content: center;
    gap: 6px;
    padding: 20px 22px;
    opacity: 0;
    color: #18181b;
  }
  .hf-transition-skeleton-reveal strong {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .hf-transition-skeleton-reveal span {
    color: #71717a;
    font-size: 15px;
  }


  .hf-transition-skeleton-reveal {
    position: relative;
    width: 340px;
    height: 76px;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-skeleton-reveal .skeleton, .hf-transition-skeleton-reveal .content {
    position: absolute;
    inset: 0;
    border: 1px solid var(--hf-sr-border, #e4e4e7);
    border-radius: 14px;
    background: var(--hf-sr-surface, #fff);
  }
  .hf-transition-skeleton-reveal .skeleton {
    background: linear-gradient(
      90deg,
      var(--hf-sr-bar, #f4f4f5),
      var(--hf-sr-bar-strong, #e4e4e7),
      var(--hf-sr-bar, #f4f4f5)
    );
    background-size: 240% 100%;
    opacity: 1;
  }
  .hf-transition-skeleton-reveal .content {
    display: grid;
    align-content: center;
    gap: 5px;
    padding: 15px;
    opacity: 0;
    color: var(--hf-sr-ink, #18181b);
  }
  .hf-transition-skeleton-reveal span {
    color: var(--hf-sr-muted, #71717a);
    font-size: 14px;
  }
}
</style>
