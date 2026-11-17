<!-- Modified Svelte adaptation of registry/blocks/lt-clean-bar/lt-clean-bar.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

          var card = document.getElementById("lt");
          var tab = document.getElementById("lt-tab");
          var nameEl = document.getElementById("lt-name");
          var role = document.getElementById("lt-role");

          // Card wipes in from the left (clip-path), accent tab grows, text rises with a small stagger.
          gsap.set(card, { clipPath: "inset(0 100% 0 0)" });
          gsap.set(tab, { scaleY: 0, transformOrigin: "50% 0%" });
          gsap.set(nameEl, { y: 22, opacity: 0 });
          gsap.set(role, { y: 22, opacity: 0 });

          tl.to(card, { clipPath: "inset(0 0% 0 0)", duration: 0.55, ease: "power3.out" }, 0.1);
          tl.to(tab, { scaleY: 1, duration: 0.45, ease: "power2.out" }, 0.28);
          tl.to(nameEl, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.34);
          tl.to(role, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" }, 0.44);

          // Exit: settle out, then hard kill the inner element.
          tl.to(card, { y: 18, opacity: 0, duration: 0.35, ease: "power2.in" }, 4.3);
          tl.set(card, { visibility: "hidden" }, 4.75);

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="lt-clean-bar"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="4.8"
        >
          <div id="lt-clip" class="clip" data-start="0" data-duration="4.8" data-track-index="0">
            <div id="lt" class="lt">
              <div id="lt-tab" class="lt-tab"></div>
              <div class="lt-body">
                <div id="lt-name" class="lt-name">Dr. Maya Chen</div>
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
    display: flex;
    align-items: stretch;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 14px 44px rgba(15, 17, 21, 0.18);
    will-change: clip-path;
  }
  #root .lt-tab {
    width: 12px;
    background: #ff5a36;
    flex-shrink: 0;
  }
  #root .lt-body {
    background: #ffffff;
    padding: 22px 40px 24px 30px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }
  #root .lt-name {
    font-size: 52px;
    font-weight: 700;
    color: #0f1115;
    line-height: 1.06;
    letter-spacing: -0.015em;
    white-space: nowrap;
  }
  #root .lt-role {
    font-size: 27px;
    font-weight: 400;
    color: #5a6170;
    line-height: 1.2;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }
}
</style>
