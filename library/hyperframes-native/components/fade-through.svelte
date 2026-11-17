<!-- Modified Svelte adaptation of registry/components/fade-through/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var washes = {
                paper: "var(--hf-fade-through-wash, #f8f5ec)",
                white: "#ffffff",
                ink: "#0b0b0f",
                accent: "var(--accent, #38bdf8)",
              };

              var wash = Object.prototype.hasOwnProperty.call(washes, vars.wash) ? vars.wash : "paper";
              var shape = vars.shape === "bloom" ? "bloom" : "flat";

              var strength = parseFloat(vars.strength);
              if (!isFinite(strength)) strength = 1;
              strength = Math.min(1, Math.max(0.1, strength));

              var colour = washes[wash];
              var paint =
                shape === "bloom"
                  ? "radial-gradient(circle at 50% 50%, " + colour + " 0%, transparent 72%)"
                  : colour;

              var overlays = document.querySelectorAll(".hf-fade-through-wash");
              for (var i = 0; i < overlays.length; i += 1) {
                overlays[i].style.setProperty("--hf-fade-through-paint", paint);
                overlays[i].style.setProperty("--hf-fade-through-strength", String(strength));
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.to(".hf-fade-through-out", { opacity: 0, duration: 0.45, ease: "power2.inOut" }, 1.3);
            tl.to(".hf-fade-through-wash", { opacity: 1, duration: 0.35, ease: "power2.inOut" }, 1.3);
            tl.to(".hf-fade-through-wash", { opacity: 0, duration: 0.45, ease: "power2.inOut" }, 1.65);
            tl.to(".hf-fade-through-in", { opacity: 1, duration: 0.55, ease: "power2.out" }, 1.65);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="fade-through-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          
          <div class="scene a hf-fade-through-out">
            <div class="card">
              <div class="badge"><span class="badge-dot"></span>Light Mode</div>
              <h2 class="card-title">Your workspace,<br />beautifully lit.</h2>
              <p class="card-body">
                Clean surfaces, crisp type, and just enough contrast to keep you focused all day long.
              </p>
              <hr class="divider" />
              <div class="meta-row">
                <span class="meta-label">Appearance</span>
                <span class="mode-pill">Light</span>
              </div>
            </div>
          </div>
    
          
          <div class="scene b hf-fade-through-in">
            <div class="card">
              <div class="badge"><span class="badge-dot"></span>Dark Mode</div>
              <h2 class="card-title">Easy on the eyes,<br />night or day.</h2>
              <p class="card-body">
                Deep backgrounds, refined contrast, and thoughtful color for late-night sessions.
              </p>
              <hr class="divider" />
              <div class="meta-row">
                <span class="meta-label">Appearance</span>
                <span class="mode-pill">Dark</span>
              </div>
            </div>
          </div>
    
          <div
            class="hf-fade-through-wash"
            aria-hidden="true"
            data-composition-variables='[
        &#123; "id": "wash", "type": "enum", "role": "style", "label": "Wash", "description": "Colour of the mid-transition frame. Paper resolves through --hf-fade-through-wash, accent rides --accent.", "default": "paper", "options": [&#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "white", "label": "White" &#125;, &#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;,
        &#123; "id": "strength", "type": "number", "role": "style", "label": "Strength", "description": "How far the wash covers at its peak. 1 is a full flash, 0.3 a light veil.", "default": 1, "min": 0.1, "max": 1, "step": 0.05 &#125;,
        &#123; "id": "shape", "type": "enum", "role": "style", "label": "Shape", "description": "Flat fills the frame evenly, bloom concentrates the wash in the centre.", "default": "flat", "options": [&#123; "value": "flat", "label": "Flat" &#125;, &#123; "value": "bloom", "label": "Bloom" &#125;] &#125;
      ]'
          ></div>
          
          
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
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: Inter, system-ui, sans-serif;
    background: #f5f5f4;
  }
  .scene {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }
  /* Scene A — light neutral */
  .a {
    background: #fafafa;
  }
  /* Scene B — dark zinc */
  .b {
    background: #18181b;
    opacity: 0;
  }
  /* Shared card */
  .card {
    width: 820px;
    border-radius: 16px;
    padding: 72px 80px 80px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }
  .a .card {
    background: #ffffff;
    border: 1px solid #e4e4e7;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.08);
  }
  .b .card {
    background: #27272a;
    border: 1px solid #3f3f46;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.4);
  }
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 26px;
    font-weight: 500;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    width: fit-content;
    padding: 10px 22px;
    border-radius: 999px;
  }
  .a .badge {
    background: #f4f4f5;
    color: #71717a;
  }
  .b .badge {
    background: #3f3f46;
    color: #a1a1aa;
  }
  .badge-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }
  .a .badge-dot {
    background: #71717a;
  }
  .b .badge-dot {
    background: #a1a1aa;
  }
  .card-title {
    font-size: 72px;
    font-weight: 700;
    line-height: 1.08;
    letter-spacing: -0.02em;
    margin: 0;
  }
  .a .card-title {
    color: #18181b;
  }
  .b .card-title {
    color: #fafafa;
  }
  .card-body {
    font-size: 32px;
    font-weight: 400;
    line-height: 1.5;
    color: #71717a;
  }
  .b .card-body {
    color: #71717a;
  }
  .divider {
    height: 1px;
    background: #e4e4e7;
    border: none;
    margin: 0;
  }
  .b .divider {
    background: #3f3f46;
  }
  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .meta-label {
    font-size: 26px;
    font-weight: 500;
  }
  .a .meta-label {
    color: #71717a;
  }
  .b .meta-label {
    color: #71717a;
  }
  .mode-pill {
    font-size: 26px;
    font-weight: 600;
    padding: 10px 28px;
    border-radius: 999px;
  }
  .a .mode-pill {
    background: #18181b;
    color: #fafafa;
  }
  .b .mode-pill {
    background: #fafafa;
    color: #18181b;
  }
  .hf-fade-through-wash {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: #fafafa;
    z-index: 900;
  }


  .hf-fade-through-in {
    opacity: 0;
  }
  .hf-fade-through-wash {
    position: absolute;
    inset: 0;
    opacity: 0;
    pointer-events: none;
    background: var(--hf-fade-through-paint, var(--hf-fade-through-wash, #f8f5ec));
    filter: opacity(var(--hf-fade-through-strength, 1));
    z-index: 900;
  }
}
</style>
