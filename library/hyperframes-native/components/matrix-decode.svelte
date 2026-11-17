<!-- Modified Svelte adaptation of registry/components/matrix-decode/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var accents = {
                green: { color: "#16a34a", rgb: "22, 163, 74" },
                blue: { color: "#2563eb", rgb: "37, 99, 235" },
                violet: { color: "#7c3aed", rgb: "124, 58, 237" },
              };
              var glows = {
                none: { radius: "0px", alpha: "0" },
                standard: { radius: "18px", alpha: "0.28" },
                strong: { radius: "34px", alpha: "0.55" },
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var text = typeof vars.text === "string" ? vars.text.trim().slice(0, 32) : "";
              if (!text) {
                text = "HYPERFRAMES";
              }

              var size =
                typeof vars.size === "number" || typeof vars.size === "string"
                  ? Number(vars.size)
                  : NaN;
              size = isFinite(size) && size > 0 ? Math.min(160, Math.max(24, size)) : 64;

              var accent = accents[pick(accents, vars.accent, "green")];
              var glow = glows[pick(glows, vars.glow, "standard")];

              var roots = document.querySelectorAll(".hf-catalog-matrix-decode");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-matrix-size", size + "px");
                roots[i].style.setProperty("--hf-matrix-color", accent.color);
                roots[i].style.setProperty("--hf-matrix-glow-rgb", accent.rgb);
                roots[i].style.setProperty("--hf-matrix-glow-radius", glow.radius);
                roots[i].style.setProperty("--hf-matrix-glow-alpha", glow.alpha);
                roots[i].setAttribute("data-final", text);
                while (roots[i].firstChild) {
                  roots[i].removeChild(roots[i].firstChild);
                }
                for (var j = 0; j < text.length; j += 1) {
                  var cell = document.createElement("span");
                  cell.textContent = text.charAt(j) === " " ? "\u00a0" : "0";
                  roots[i].appendChild(cell);
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-matrix-decode span",
              { opacity: 0, y: 12 },
              { opacity: 1, y: 0, duration: 0.18, stagger: 0.035, ease: "power2.out" },
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
          data-composition-id="matrix-decode-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="demo-label">Matrix Decode</div>
            <div
              class="hf-catalog-matrix-decode"
              data-final="HYPERFRAMES"
              data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Target text", "description": "Word the scramble resolves into. One scrambling cell per character, up to 32.", "default": "HYPERFRAMES" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Colour family of the cells and their glow.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "size", "type": "number", "role": "style", "label": "Size", "description": "Type size of the cells in pixels. Cell width follows it.", "default": 64, "min": 24, "max": 160, "step": 4, "unit": "px" &#125;,
        &#123; "id": "glow", "type": "enum", "role": "style", "label": "Glow", "description": "Strength of the halo behind the cells, from none to a heavy bloom.", "default": "standard", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "strong", "label": "Strong" &#125;] &#125;
      ]'
            >
              <span>0</span><span>0</span><span>0</span><span>0</span><span>0</span><span>0</span
              ><span>0</span><span>0</span><span>0</span><span>0</span>
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
  /* ponytail: scale on wrapper (not a GSAP target), zooms content ~3× for thumbnail legibility */
  .demo-frame {
    display: grid;
    place-items: center;
    gap: 32px;
    padding: 72px 96px;
    background: #18181b;
    border-radius: 20px;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.22);
    transform: scale(3.2);
    transform-origin: center center;
  }
  .demo-label {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #71717a;
  }
  .hf-catalog-matrix-decode {
    display: inline-flex;
    gap: 4px;
    font:
      700 52px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    color: #4ade80;
    text-shadow: 0 0 24px rgba(74, 222, 128, 0.45);
  }
  .hf-catalog-matrix-decode span {
    display: inline-block;
    min-width: 0.64em;
    opacity: var(--hf-matrix-opacity, 1);
  }


  .hf-catalog-matrix-decode {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-matrix-decode {
    display: inline-flex;
    gap: 3px;
    font:
      900 64px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
    font-size: var(--hf-matrix-size, 64px);
    color: var(--hf-matrix-color, #16a34a);
    text-shadow: 0 0 var(--hf-matrix-glow-radius, 18px)
    rgba(var(--hf-matrix-glow-rgb, 22, 163, 74), var(--hf-matrix-glow-alpha, 0.28));
  }
  .hf-catalog-matrix-decode span {
    display: inline-block;
    min-width: 0.64em;
    opacity: var(--hf-matrix-opacity, 1);
  }
}
</style>
