<!-- Modified Svelte adaptation of registry/components/yt-circle-pointer/yt-circle-pointer.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // ---- copy these helpers into the host script ----
            window.ytCircleOn = function (tl, target, at, dur) {
              var el = document.querySelector(target + " ellipse");
              var len = el.getTotalLength();
              gsap.set(el, { strokeDasharray: len, strokeDashoffset: len });
              tl.to(
                el,
                { strokeDashoffset: 0, duration: dur === undefined ? 0.7 : dur, ease: "power2.inOut" },
                at,
              );
            };
            window.ytCircleOff = function (tl, target, at) {
              tl.to(target, { opacity: 0, duration: 0.35, ease: "power2.in" }, at);
            };
            window.ytCountIn = function (tl, target, at) {
              gsap.set(target, { y: -18, scale: 0.9 });
              tl.to(target, { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.5)" }, at);
            };
            window.ytCountdown = function (tl, target, at, from) {
              var num = document.querySelector(target + " .num");
              var st = { v: from };
              tl.to(
                st,
                {
                  v: 0,
                  duration: from,
                  ease: "none",
                  onUpdate: function () {
                    num.textContent = String(Math.ceil(st.v));
                  },
                },
                at,
              );
              for (var i = 1; i <= from; i++) {
                tl.to(target, { scale: 1.07, duration: 0.09, ease: "sine.out" }, at + i - 0.09);
                tl.to(target, { scale: 1, duration: 0.14, ease: "sine.in" }, at + i);
              }
            };

            // Self-preview timeline.
            var tl = gsap.timeline({ paused: true });
            window.ytCountIn(tl, "#yt-ptr-count", 0.3);
            window.ytCountdown(tl, "#yt-ptr-count", 0.7, 3);
            window.ytCircleOn(tl, "#yt-ptr-circle", 1.0);
            window.ytCircleOff(tl, "#yt-ptr-circle", 4.2);
            tl.to("#yt-ptr-count", { opacity: 0, duration: 0.3, ease: "power2.in" }, 4.3);
            tl.set("#yt-ptr-root", { visibility: "hidden" }, 4.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="yt-ptr-root"
          data-composition-id="yt-circle-pointer"
          data-start="0"
          data-duration="5"
          data-width="1920"
          data-height="1080"
        >
          <div id="yt-ptr-scene"><span>the thing</span></div>
          <div
            class="yt-circle"
            id="yt-ptr-circle"
            style="left: 760px; top: 440px; width: 420px; height: 210px"
          >
            <svg viewBox="0 0 420 210"><ellipse cx="210" cy="105" rx="196" ry="88"></ellipse></svg>
          </div>
          <div class="yt-count" id="yt-ptr-count" style="right: 140px; top: 110px">
            <span class="num">5</span><span>sec</span>
          </div>
          <div
            id="yt-ptr-drv"
            class="clip"
            data-start="0"
            data-duration="5"
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
  /* ---- yt-circle-pointer -----------------------------------------------
  Annotation tools: a hand-drawn-feel circle that draws on around a
  target, and a countdown chip. Position instances via top/left with
  explicit width/height. */
  .yt-circle {
    --yt-red: #e62e2e;
    position: absolute;
    pointer-events: none;
  }
  .yt-circle svg {
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .yt-circle ellipse {
    fill: none;
    stroke: var(--yt-ptr-color, var(--yt-red));
    stroke-width: 6;
    stroke-linecap: round;
    transform: rotate(-6deg);
    transform-origin: 50% 50%;
  }
  .yt-count {
    position: absolute;
    display: inline-flex;
    align-items: center;
    gap: 14px;
    padding: 16px 32px;
    border-radius: 999px;
    font-family: "Inter", ui-sans-serif, sans-serif;
    font-weight: 700;
    font-size: 40px;
    background: var(--yt-count-bg, var(--yt-red));
    color: #ffffff;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    opacity: 0;
  }
  .yt-count .num {
    font-variant-numeric: tabular-nums;
    min-width: 1.2em;
    text-align: center;
  }
  /* self-preview scene */
  #yt-ptr-scene {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #35c8d9 0%, #2a7fff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Inter", ui-sans-serif, sans-serif;
    font-weight: 700;
    font-size: 60px;
    color: rgba(255, 255, 255, 0.92);
  }
}
</style>
