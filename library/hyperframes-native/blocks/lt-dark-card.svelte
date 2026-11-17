<!-- Modified Svelte adaptation of registry/blocks/lt-dark-card/lt-dark-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
          var card = document.getElementById("lt-card");
          var nameEl = document.getElementById("lt-name");
          var underline = document.getElementById("lt-underline");
          var role = document.getElementById("lt-role");

          // Card slides up from below, name fades, accent underline draws, role fades.
          gsap.set(card, { y: 60, opacity: 0 });
          gsap.set(nameEl, { y: 14, opacity: 0 });
          gsap.set(underline, { scaleX: 0 });
          gsap.set(role, { opacity: 0 });

          tl.to(card, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.1);
          tl.to(nameEl, { y: 0, opacity: 1, duration: 0.45, ease: "power3.out" }, 0.26);
          tl.to(underline, { scaleX: 1, duration: 0.5, ease: "power4.out" }, 0.42);
          tl.to(role, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0.56);

          // Exit: slide down + hard kill.
          tl.to(card, { y: 24, opacity: 0, duration: 0.35, ease: "power2.in" }, 4.3);
          tl.set(wrap, { visibility: "hidden" }, 4.75);

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="lt-dark-card"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="4.8"
        >
          <div id="lt-clip" class="clip" data-start="0" data-duration="4.8" data-track-index="0">
            <div id="lt" class="lt">
              <div id="lt-card" class="lt-card">
                <div id="lt-name" class="lt-name">Dr. Maya Chen</div>
                <div id="lt-underline" class="lt-underline"></div>
                <div id="lt-role" class="lt-role">Host · Neuroscientist</div>
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
    left: 120px;
    bottom: 110px;
  }
  #root .lt-card {
    background: #16181d;
    border-radius: 14px;
    padding: 24px 38px 26px 32px;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  #root .lt-name {
    font-size: 48px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.02;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }
  #root .lt-underline {
    height: 4px;
    width: 100%;
    background: #f5b942;
    border-radius: 2px;
    transform-origin: 0% 50%;
  }
  #root .lt-role {
    font-size: 25px;
    font-weight: 400;
    color: #aeb6c2;
    line-height: 1.2;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }
}
</style>
