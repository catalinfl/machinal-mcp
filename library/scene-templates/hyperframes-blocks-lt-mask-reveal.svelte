<!-- Modified Svelte adaptation of registry/blocks/lt-mask-reveal/lt-mask-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    var tl = gsap.timeline({ paused: true });

          var wrap = document.getElementById("lt");
          var nameEl = document.getElementById("lt-name");
          var sweep = document.getElementById("lt-sweep");
          var role = document.getElementById("lt-role");

          // An accent sweep crosses left→right; the name is revealed by a clip-path wipe behind it; role fades up.
          // Sweep travel: left:"100%" was parent-relative (offsetParent = .lt-namewrap). Since the sweep is
          // only 8px wide, xPercent would travel just 8px, so translate by the container width in pixels instead.
          // The .lt-namewrap shrink-wraps the name "Dr. Maya Chen" to 536px (no horizontal padding/border, so
          // clientWidth == content width), which is exactly what left:"100%" resolved to.
          var SWEEP_TRAVEL = 536;
          gsap.set(nameEl, { clipPath: "inset(0 100% 0 0)" });
          gsap.set(sweep, { x: 0, opacity: 0 });
          gsap.set(role, { y: 14, opacity: 0 });

          tl.to(sweep, { opacity: 1, duration: 0.12, ease: "none" }, 0.1);
          tl.to(sweep, { x: SWEEP_TRAVEL, duration: 0.55, ease: "power2.inOut" }, 0.12);
          tl.to(nameEl, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power2.inOut" }, 0.16);
          tl.to(sweep, { opacity: 0, duration: 0.15, ease: "none" }, 0.6);
          tl.to(role, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.55);

          // Exit: name un-wipes, role fades, hard kill.
          tl.to(role, { opacity: 0, duration: 0.3, ease: "power2.in" }, 4.25);
          tl.to(nameEl, { clipPath: "inset(0 0 0 100%)", duration: 0.4, ease: "power2.in" }, 4.3);
          tl.set(wrap, { visibility: "hidden" }, 4.75);

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="lt-mask-reveal"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="4.8"
        >
          <div id="lt-clip" class="clip" data-start="0" data-duration="4.8" data-track-index="0">
            <div id="lt" class="lt">
              <div class="lt-namewrap">
                <div id="lt-name" class="lt-name">Dr. Maya Chen</div>
                <div id="lt-sweep" class="lt-sweep"></div>
              </div>
              <div id="lt-role" class="lt-role">Host · Neuroscientist</div>
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
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    font-family: "Montserrat", sans-serif;
  }

  #root .lt {
    position: absolute;
    left: 130px;
    bottom: 122px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
  }
  #root .lt-namewrap {
    position: relative;
    overflow: hidden;
    padding: 2px 0;
  }
  #root .lt-name {
    font-size: 72px;
    font-weight: 900;
    color: #ffffff;
    line-height: 0.98;
    letter-spacing: -0.02em;
    white-space: nowrap;
    text-shadow: 0 2px 22px rgba(0, 0, 0, 0.45);
    will-change: clip-path;
  }
  #root .lt-sweep {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: 8px;
    background: #ffd23f;
  }
  #root .lt-role {
    font-size: 28px;
    font-weight: 500;
    color: #e7eaf0;
    line-height: 1.2;
    letter-spacing: 0.02em;
    white-space: nowrap;
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.45);
  }
}
</style>
