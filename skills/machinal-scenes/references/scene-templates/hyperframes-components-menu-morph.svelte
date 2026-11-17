<!-- Modified Svelte adaptation of registry/components/menu-morph/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              // Anything missing or invalid returns to its declared default.
              // The button is the one accent-carrying element here, so the three
              // chromatic options ride the composition's own tokens and fall back to ink.
              var tones = {
                ink: "#18181b",
                green: "var(--brand, #18181b)",
                blue: "var(--accent, #18181b)",
                violet: "var(--accent-2, #18181b)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var labels = [];
              if (typeof vars.actions === "string") {
                var parts = vars.actions.split(",");
                for (var p = 0; p < parts.length && labels.length < 6; p += 1) {
                  var label = parts[p].trim();
                  if (label) {
                    labels.push(label);
                  }
                }
              }
              if (!labels.length) {
                labels = ["Text", "Image", "Audio"];
              }

              var size =
                typeof vars.size === "number" || typeof vars.size === "string"
                  ? Number(vars.size)
                  : NaN;
              size = isFinite(size) && size > 0 ? Math.min(112, Math.max(52, size)) : 68;

              var tone = tones[pick(tones, vars.tone, "ink")];

              var roots = document.querySelectorAll(".hf-transition-menu-morph");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-menu-size", size + "px");
                roots[i].style.setProperty("--hf-menu-bg", tone);
                var row = roots[i].querySelector(".hf-transition-menu-actions");
                if (!row) {
                  continue;
                }
                while (row.firstChild) {
                  row.removeChild(row.firstChild);
                }
                for (var j = 0; j < labels.length; j += 1) {
                  var pill = document.createElement("div");
                  pill.textContent = labels[j];
                  row.appendChild(pill);
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-menu-button",
              { scale: 0.72, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.34, ease: "back.out(1.8)" },
              0.3,
            );
            tl.to(
              ".hf-transition-menu-button span:nth-child(1)",
              { y: 8, rotation: 45, duration: 0.24, ease: "power2.inOut" },
              0.78,
            );
            tl.to(
              ".hf-transition-menu-button span:nth-child(2)",
              { opacity: 0, duration: 0.18, ease: "power1.out" },
              0.78,
            );
            tl.to(
              ".hf-transition-menu-button span:nth-child(3)",
              { y: -8, rotation: -45, duration: 0.24, ease: "power2.inOut" },
              0.78,
            );
            tl.fromTo(
              ".hf-transition-menu-actions div",
              { y: 28, opacity: 0, scale: 0.86 },
              { y: 0, opacity: 1, scale: 1, duration: 0.26, stagger: 0.06, ease: "back.out(1.6)" },
              0.96,
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
          data-composition-id="menu-morph-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-menu-morph"
              data-composition-variables='[
        &#123; "id": "actions", "type": "string", "role": "content", "label": "Actions", "description": "Comma separated labels for the pills that fan out under the button. Up to six.", "default": "Text, Image, Audio" &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Colour of the round button behind the white bars.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "size", "type": "number", "role": "layout", "label": "Button size", "description": "Diameter of the round button in pixels. The bars scale with it.", "default": 68, "min": 52, "max": 112, "step": 4, "unit": "px" &#125;
      ]'
            >
              <button class="hf-transition-menu-button" type="button" aria-label="Menu">
                <span></span><span></span><span></span>
              </button>
              <div class="hf-transition-menu-actions">
                <div>Text</div>
                <div>Image</div>
                <div>Audio</div>
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
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale the wrapper — GSAP animates children, not this element */
    transform: scale(3.4);
  }
  .hf-transition-menu-morph {
    position: relative;
    display: grid;
    place-items: center;
    width: 360px;
    height: 280px;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-menu-button {
    z-index: 2;
    display: grid;
    place-items: center;
    gap: 5px;
    width: 68px;
    height: 68px;
    border: 0;
    border-radius: 999px;
    background: #18181b;
    box-shadow: 0 22px 58px rgba(0, 0, 0, 0.22);
  }
  .hf-transition-menu-button span {
    width: 24px;
    height: 3px;
    border-radius: 999px;
    background: #ffffff;
    transform-origin: center;
  }
  .hf-transition-menu-actions {
    position: absolute;
    display: flex;
    gap: 10px;
    bottom: 20px;
  }
  .hf-transition-menu-actions div {
    padding: 10px 16px;
    border-radius: 999px;
    background: #ffffff;
    color: #18181b;
    font-size: 14px;
    font-weight: 700;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.12);
    border: 1px solid #e4e4e7;
  }


  .hf-transition-menu-morph {
    position: relative;
    display: grid;
    place-items: center;
    width: 360px;
    height: 220px;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-menu-button {
    z-index: 2;
    display: grid;
    place-items: center;
    gap: 5px;
    width: var(--hf-menu-size, 68px);
    height: var(--hf-menu-size, 68px);
    border: 0;
    border-radius: 999px;
    background: var(--hf-menu-bg, #18181b);
    box-shadow: 0 22px 58px rgba(0, 0, 0, 0.22);
  }
  .hf-transition-menu-button span {
    width: calc(var(--hf-menu-size, 68px) * 6 / 17);
    height: 3px;
    border-radius: 999px;
    background: #ffffff;
    transform-origin: center;
  }
  .hf-transition-menu-actions {
    position: absolute;
    display: flex;
    gap: 10px;
    bottom: 20px;
  }
  .hf-transition-menu-actions div {
    padding: 9px 13px;
    border-radius: 999px;
    background: #ffffff;
    color: #18181b;
    font-size: 13px;
    font-weight: 850;
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.12);
  }
}
</style>
