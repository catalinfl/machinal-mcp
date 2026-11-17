<!-- Modified Svelte adaptation of registry/components/mk-usage-arc/mk-usage-arc.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // ---- copy these helpers into the host script, then:
            //   mkArcIn(tl, "#mk-my-arc", 1.0, 0.76);  // draw to 76%, count the numeral
            //   mkArcOut(tl, "#mk-my-arc", 8.5);
            window.mkArcIn = function (tl, target, at, value) {
              var el = document.querySelector(target);
              var fill = el.querySelector(".mk-arc-fill");
              var num = el.querySelector(".mk-arc-num");
              var C = 2 * Math.PI * parseFloat(fill.getAttribute("r"));
              gsap.set(el, { opacity: 0, y: 16 });
              gsap.set(fill, { strokeDasharray: C, strokeDashoffset: C });
              tl.to(el, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, at);
              tl.to(
                fill,
                { strokeDashoffset: C * (1 - value), duration: 1.1, ease: "power2.inOut" },
                at + 0.15,
              );
              var st = { v: 0 };
              tl.to(
                st,
                {
                  v: value,
                  duration: 1.1,
                  ease: "power2.inOut",
                  onUpdate: function () {
                    num.textContent = Math.round(st.v * 100) + "%";
                  },
                },
                at + 0.15,
              );
            };
            window.mkArcOut = function (tl, target, at) {
              tl.to(target, { opacity: 0, y: -12, duration: 0.35, ease: "power2.in" }, at);
            };

            // Self-preview timeline (not part of the snippet you copy).
            var tl = gsap.timeline({ paused: true });
            window.mkArcIn(tl, "#mk-arc-demo", 0.4, 0.76);
            window.mkArcOut(tl, "#mk-arc-demo", 3.4);
            tl.set("#mk-arc-root", { visibility: "hidden" }, 3.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="mk-arc-root"
          data-composition-id="mk-usage-arc"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div class="mk-arc" id="mk-arc-demo" style="top: 430px; left: 850px">
            <svg viewBox="0 0 220 220">
              <circle class="mk-arc-track" cx="110" cy="110" r="92"></circle>
              <circle
                class="mk-arc-fill"
                cx="110"
                cy="110"
                r="92"
                transform="rotate(-90 110 110)"
              ></circle>
            </svg>
            <div class="mk-arc-center">
              <span class="mk-arc-num">0%</span>
              <span class="mk-arc-label">Usage</span>
            </div>
          </div>
          <div
            id="mk-arc-drv"
            class="clip"
            data-start="0"
            data-duration="4"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  /* ---- mk-usage-arc ----------------------------------------------------
  Hairline circular gauge: draw-on arc + centered value + tiny label.
  The promo's "Usage" arc. Recolor via --mk-arc-color. */
  .mk-arc {
    --mk-font: "Inter", -apple-system, sans-serif;
    --mk-ink: #1d1d1f;
    --mk-ink-dim: #6e6e73;
    --mk-accent: #0071e3;
    --mk-arc-color: var(--mk-accent);
    --mk-hairline: 3px;

    position: absolute;
    width: 220px;
    height: 220px;
    pointer-events: none;
  }
  .mk-arc svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .mk-arc-track {
    fill: none;
    stroke: rgba(29, 29, 31, 0.1);
    stroke-width: var(--mk-hairline);
  }
  .mk-arc-fill {
    fill: none;
    stroke: var(--mk-arc-color);
    stroke-width: var(--mk-hairline);
    stroke-linecap: round;
  }
  .mk-arc-center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-family: var(--mk-font);
  }
  .mk-arc-num {
    font-weight: 600;
    font-size: 46px;
    letter-spacing: -0.02em;
    color: var(--mk-ink);
    font-variant-numeric: tabular-nums;
  }
  .mk-arc-label {
    font-weight: 500;
    font-size: 20px;
    color: var(--mk-ink);
  }
}
</style>
