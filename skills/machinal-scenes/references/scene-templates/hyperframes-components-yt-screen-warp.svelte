<!-- Modified Svelte adaptation of registry/components/yt-screen-warp/yt-screen-warp.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            window.ytScreenOn = function (tl, target, at) {
              tl.to(target, { opacity: 1, duration: 0.5, ease: "power2.out" }, at);
            };
            window.ytScreenOff = function (tl, target, at) {
              tl.to(target, { opacity: 0, duration: 0.4, ease: "power2.in" }, at);
            };

            // Self-preview timeline.
            var tl = gsap.timeline({ paused: true });
            gsap.set("#yt-sw-wrap", { opacity: 0, scale: 0.96 });
            tl.to("#yt-sw-wrap", { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" }, 0.2);
            window.ytScreenOn(tl, "#yt-sw-fx", 0.8);
            window.ytScreenOff(tl, "#yt-sw-fx", 3.1);
            tl.to("#yt-sw-wrap", { opacity: 0, duration: 0.35, ease: "power2.in" }, 3.5);
            tl.set("#yt-sw-root", { visibility: "hidden" }, 3.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="yt-sw-root"
          data-composition-id="yt-screen-warp"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="yt-sw-wrap" class="yt-screen-warp3d">
            <div id="yt-sw-fill">on screen</div>
            <div class="yt-screen-fx" id="yt-sw-fx"></div>
          </div>
          <div
            id="yt-sw-drv"
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
  /* ---- yt-screen-warp ---------------------------------------------------
  Make footage read as a physical display: add .yt-screen-warp3d to the
  media WRAPPER (subtle perspective), and place .yt-screen-fx overlay
  inside it (pixel grid + scanlines + vignette + sheen). */
  .yt-screen-warp3d {
    transform: perspective(1400px) rotateY(-3.5deg) rotateX(1.6deg);
  }
  .yt-screen-fx {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background:
      /* sheen */
      linear-gradient(115deg, rgba(255, 255, 255, 0.09) 0%, transparent 30%),
      /* scanlines */
      repeating-linear-gradient(0deg, rgba(0, 0, 0, 0.1) 0 1px, transparent 1px 3px),
      /* pixel grid */
      repeating-linear-gradient(90deg, rgba(0, 0, 0, 0.06) 0 1px, transparent 1px 4px);
    box-shadow:
      inset 0 0 90px rgba(0, 0, 0, 0.4),
      inset 0 0 8px rgba(0, 0, 0, 0.5);
  }
  /* self-preview stand-in */
  #yt-sw-wrap {
    position: absolute;
    left: 360px;
    top: 190px;
    width: 1200px;
    height: 700px;
    border-radius: 18px;
    overflow: hidden;
  }
  #yt-sw-fill {
    position: absolute;
    inset: 0;
    /* Placeholder footage: L3 of the ink over the dark ground, plus a 3px
    achromatic hatch so the plate reads as a media surface, not an empty box. */
    background:
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0 1px, transparent 1px 3px),
      rgba(255, 255, 255, 0.18);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Inter", ui-sans-serif, sans-serif;
    font-weight: 700;
    font-size: 92px;
    color: rgba(255, 255, 255, 0.93);
  }
}
</style>
