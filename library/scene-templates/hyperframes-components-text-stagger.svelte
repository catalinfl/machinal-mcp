<!-- Modified Svelte adaptation of registry/components/text-stagger/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var DEFAULT_TEXT = "Build motion systems fast";
              var tones = { ink: "#111827", paper: "#f8fafc" };
              var accents = { blue: "#38bdf8", green: "#34d399", violet: "#a78bfa" };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var words = String(vars.text == null ? DEFAULT_TEXT : vars.text)
                .split(/\s+/)
                .filter(function (word) {
                  return word.length > 0;
                });
              if (words.length === 0) words = DEFAULT_TEXT.split(" ");

              // Number(null) is 0, so null has to miss the numeric branch and clamp back
              // to the declared default instead of snapping to the minimum.
              var size = typeof vars.size === "number" ? vars.size : parseFloat(vars.size);
              if (!isFinite(size)) size = 74;
              size = Math.min(160, Math.max(24, size));

              var tone = tones[pick(tones, vars.tone, "ink")];
              var accent = accents[pick(accents, vars.accent, "blue")];

              var roots = document.querySelectorAll(".hf-transition-text-stagger");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-stagger-size", size + "px");
                root.style.setProperty("--hf-stagger-ink", tone);
                root.style.setProperty("--hf-stagger-accent", accent);
                // Rebuilt without whitespace between the spans: whitespace-only text
                // between flex items is not rendered, so this matches the markup above.
                root.textContent = "";
                for (var w = 0; w < words.length; w += 1) {
                  var span = document.createElement("span");
                  span.textContent = words[w];
                  root.appendChild(span);
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-text-stagger span",
              { opacity: 0, y: 48, filter: "blur(14px)" },
              {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.54,
                stagger: 0.09,
                ease: "power3.out",
              },
              0.35,
            );
            tl.to(
              ".hf-transition-text-stagger span",
              { backgroundPosition: "100% 0%", duration: 0.72, stagger: 0.04, ease: "power2.inOut" },
              1.05,
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
          data-composition-id="text-stagger-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="demo-label">text-stagger</div>
            <div
              class="hf-transition-text-stagger"
              data-composition-variables='[
        &#123;"id": "text", "type": "string", "role": "content", "label": "Text", "description": "Headline copy. Every whitespace-separated word becomes one staggered span.", "default": "Build motion systems fast"&#125;,
        &#123;"id": "size", "type": "number", "role": "layout", "label": "Size", "description": "Type size of every word in pixels, clamped to 24-160. Line height stays proportional.", "default": 74, "min": 24, "max": 160, "step": 1, "unit": "px"&#125;,
        &#123;"id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Base word colour: ink for light frames, paper for dark ones.", "default": "ink", "options": [&#123;"value": "ink", "label": "Ink"&#125;, &#123;"value": "paper", "label": "Paper"&#125;]&#125;,
        &#123;"id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Colour of the shimmer the second timeline step sweeps across the words.", "default": "blue", "options": [&#123;"value": "blue", "label": "Blue"&#125;, &#123;"value": "green", "label": "Green"&#125;, &#123;"value": "violet", "label": "Violet"&#125;]&#125;
      ]'
            >
              <span>Build</span>
              <span>motion</span>
              <span>systems</span>
              <span>fast</span>
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
    background: #fafafa;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    gap: 28px;
    /* Scale the non-GSAP wrapper while keeping the full phrase inside the frame. */
    transform: scale(1.9);
    transform-origin: center center;
  }
  .demo-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #737379;
  }
  .hf-transition-text-stagger {
    display: flex;
    flex-wrap: wrap;
    gap: 0.24em;
    color: #18181b;
    font:
      900 74px/0.95 Inter,
      system-ui,
      sans-serif;
    letter-spacing: -0.045em;
  }
  .hf-transition-text-stagger span {
    display: inline-block;
    background: linear-gradient(90deg, #18181b, #18181b, #71717a, #18181b);
    background-size: 240% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    will-change: transform, opacity, filter, background-position;
  }


  .hf-transition-text-stagger {
    display: flex;
    flex-wrap: wrap;
    gap: 0.24em;
    color: var(--hf-stagger-ink, #111827);
    font:
      900 74px/0.95 Inter,
      system-ui,
      sans-serif;
    font-size: var(--hf-stagger-size, 74px);
    letter-spacing: -0.045em;
  }
  .hf-transition-text-stagger span {
    display: inline-block;
    background: linear-gradient(
      90deg,
      var(--hf-stagger-ink, #111827),
      var(--hf-stagger-ink, #111827),
      var(--hf-stagger-accent, #38bdf8),
      var(--hf-stagger-ink, #111827)
    );
    background-size: 240% 100%;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    will-change: transform, opacity, filter, background-position;
  }
}
</style>
