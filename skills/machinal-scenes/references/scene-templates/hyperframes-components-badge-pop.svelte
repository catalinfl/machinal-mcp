<!-- Modified Svelte adaptation of registry/components/badge-pop/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              // The badge is the one accent-carrying element here. red is the literal
              // notification convention and stays; the decorative options ride the
              // composition's own tokens and fall back to ink.
              var accents = {
                red: "#ef4444",
                blue: "var(--accent, #18181b)",
                green: "var(--brand, #18181b)",
                violet: "var(--accent-2, #18181b)",
              };
              var surfaces = {
                light: { surface: "#ffffff", border: "#e4e4e7", ink: "#18181b" },
                dark: { surface: "#101014", border: "#2a2a32", ink: "#fafafa" },
              };

              var accent = accents[pick(accents, vars.accent, "red")];
              var surface = surfaces[pick(surfaces, vars.surface, "light")];
              var count =
                typeof vars.count === "string" && vars.count.trim()
                  ? vars.count.trim().slice(0, 4)
                  : "3";

              var roots = document.querySelectorAll(".hf-transition-badge-pop");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-badge-pop-accent", accent);
                root.style.setProperty("--hf-badge-pop-surface", surface.surface);
                root.style.setProperty("--hf-badge-pop-border", surface.border);
                root.style.setProperty("--hf-badge-pop-ink", surface.ink);
                var label = root.querySelector(".hf-transition-badge-count");
                if (label) {
                  label.textContent = count;
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-badge-button",
              { y: 18, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.34, ease: "power2.out" },
              0.35,
            );
            tl.fromTo(
              ".hf-transition-badge-count",
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.42, ease: "back.out(2.4)" },
              0.7,
            );
            tl.to(
              ".hf-transition-badge-count",
              { scale: 1.18, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" },
              1.15,
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
          data-composition-id="badge-pop-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-badge-pop"
              data-composition-variables='[
        &#123; "id": "count", "type": "string", "role": "style", "label": "Count", "description": "Text shown inside the notification badge, up to four characters.", "default": "3", "maxLength": 4 &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Colour family of the badge.", "default": "red", "options": [&#123; "value": "red", "label": "Red" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "green", "label": "Green" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "surface", "type": "enum", "role": "style", "label": "Surface", "description": "Chrome of the button and the badge ring: light for bright frames, dark for dark ones.", "default": "light", "options": [&#123; "value": "light", "label": "Light" &#125;, &#123; "value": "dark", "label": "Dark" &#125;] &#125;
      ]'
            >
              <button class="hf-transition-badge-button" type="button" aria-label="Notifications">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                  <path d="M10 20a2 2 0 004 0" />
                </svg>
              </button>
              <span class="hf-transition-badge-count">3</span>
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
    padding: 56px;
    transform: scale(
      3
    ); /* ponytail: scale wrapper (hugs content — no min-width inflation), not GSAP targets */
    transform-origin: center;
  }
  .hf-transition-badge-pop {
    position: relative;
    display: inline-grid;
    place-items: center;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-badge-button {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border: 1px solid #e4e4e7;
    border-radius: 22px;
    background: #ffffff;
    color: #18181b;
    box-shadow: 0 20px 58px rgba(0, 0, 0, 0.12);
  }
  .hf-transition-badge-button svg {
    width: 30px;
    height: 30px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .hf-transition-badge-count {
    position: absolute;
    right: -8px;
    top: -8px;
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    border: 3px solid #ffffff;
    border-radius: 999px;
    background: #ef4444;
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    transform-origin: center;
  }


  .hf-transition-badge-pop {
    --hf-badge-pop-accent: #ef4444;
    --hf-badge-pop-surface: #ffffff;
    --hf-badge-pop-border: #e4e4e7;
    --hf-badge-pop-ink: #18181b;
    position: relative;
    display: inline-grid;
    place-items: center;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-badge-button {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border: 1px solid var(--hf-badge-pop-border);
    border-radius: 22px;
    background: var(--hf-badge-pop-surface);
    color: var(--hf-badge-pop-ink);
    box-shadow: 0 20px 58px rgba(0, 0, 0, 0.12);
  }
  .hf-transition-badge-button svg {
    width: 30px;
    height: 30px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .hf-transition-badge-count {
    position: absolute;
    right: -8px;
    top: -8px;
    display: grid;
    place-items: center;
    min-width: 30px;
    height: 30px;
    padding: 0 8px;
    border: 3px solid var(--hf-badge-pop-surface);
    border-radius: 999px;
    background: var(--hf-badge-pop-accent);
    color: #ffffff;
    font-size: 13px;
    font-weight: 900;
    transform-origin: center;
  }
}
</style>
