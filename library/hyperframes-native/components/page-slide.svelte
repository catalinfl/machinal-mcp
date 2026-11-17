<!-- Modified Svelte adaptation of registry/components/page-slide/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var accents = {
                green: { from: "#155e75", to: "#10b981" },
                blue: { from: "#1e3a8a", to: "#38bdf8" },
                violet: { from: "#4c1d95", to: "#a78bfa" },
              };
              var corners = { square: "0px", soft: "14px", round: "30px" };

              function text(value, fallback) {
                return typeof value === "string" && value !== "" ? value : fallback;
              }
              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var labelA = text(vars.label_a, "Dashboard");
              var labelB = text(vars.label_b, "Analytics");
              var accent = accents[pick(accents, vars.accent, "green")];
              var corner = corners[pick(corners, vars.corner, "round")];

              var roots = document.querySelectorAll(".hf-transition-page-slide");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-page-radius", corner);
                root.style.setProperty("--hf-page-from", accent.from);
                root.style.setProperty("--hf-page-to", accent.to);
                var oldLabel = root.querySelector(".hf-transition-page.old span");
                var newLabel = root.querySelector(".hf-transition-page.new span");
                if (oldLabel) oldLabel.textContent = labelA;
                if (newLabel) newLabel.textContent = labelB;
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-page-slide",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" },
              0.25,
            );
            tl.fromTo(
              ".hf-transition-page.new",
              { xPercent: 100 },
              { xPercent: 0, duration: 0.74, ease: "power3.inOut" },
              0.78,
            );
            tl.to(
              ".hf-transition-page.old",
              { xPercent: -28, scale: 0.94, duration: 0.74, ease: "power3.inOut" },
              0.78,
            );
            tl.fromTo(
              ".hf-transition-page.new span",
              { y: 24, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.28, ease: "power2.out" },
              1.24,
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
          data-composition-id="page-slide-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-page-slide"
              data-composition-variables='[
        &#123; "id": "label_a", "type": "string", "role": "content", "label": "Outgoing label", "description": "Label printed on the page that slides out.", "default": "Dashboard" &#125;,
        &#123; "id": "label_b", "type": "string", "role": "content", "label": "Incoming label", "description": "Label printed on the page that slides in.", "default": "Analytics" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Gradient family painted on the incoming page. The outgoing page stays slate.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "corner", "type": "enum", "role": "style", "label": "Corner", "description": "Corner radius of the frame the pages slide inside.", "default": "round", "options": [&#123; "value": "square", "label": "Square" &#125;, &#123; "value": "soft", "label": "Soft" &#125;, &#123; "value": "round", "label": "Round" &#125;] &#125;
      ]'
            >
              <section class="hf-transition-page old"><span>Dashboard</span></section>
              <section class="hf-transition-page new"><span>Analytics</span></section>
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
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale wrapper (not the GSAP target) to fill ~63% of frame */
    transform: scale(2.2);
    transform-origin: center center;
  }
  .hf-transition-page-slide {
    position: relative;
    width: 560px;
    height: 320px;
    overflow: hidden;
    border-radius: 30px;
    background: #111827;
    box-shadow: 0 28px 90px rgba(0, 0, 0, 0.22);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-page {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .hf-transition-page span {
    padding: 14px 20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-size: 28px;
    font-weight: 900;
  }
  .hf-transition-page.old {
    background: linear-gradient(135deg, #0f172a, #334155);
  }
  .hf-transition-page.new {
    background: linear-gradient(135deg, #155e75, #10b981);
  }


  .hf-transition-page-slide {
    position: relative;
    width: 560px;
    height: 320px;
    overflow: hidden;
    border-radius: var(--hf-page-radius, 30px);
    background: #111827;
    box-shadow: 0 28px 90px rgba(0, 0, 0, 0.22);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-page {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  .hf-transition-page span {
    padding: 14px 20px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.14);
    color: #ffffff;
    font-size: 28px;
    font-weight: 900;
  }
  .hf-transition-page.old {
    background: linear-gradient(135deg, #0f172a, #334155);
  }
  .hf-transition-page.new {
    background: linear-gradient(
      135deg,
      var(--hf-page-from, #155e75),
      var(--hf-page-to, #10b981)
    );
  }
}
</style>
