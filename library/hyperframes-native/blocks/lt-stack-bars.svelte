<!-- Modified Svelte adaptation of registry/blocks/lt-stack-bars/lt-stack-bars.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
          var namebar = document.getElementById("lt-namebar");
          var rolebar = document.getElementById("lt-rolebar");

          // Name bar wipes in from the left; role bar wipes in from the right (opposing).
          gsap.set(namebar, { clipPath: "inset(0 100% 0 0)" });
          gsap.set(rolebar, { clipPath: "inset(0 0 0 100%)" });

          tl.to(namebar, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power4.out" }, 0.1);
          tl.to(rolebar, { clipPath: "inset(0 0% 0 0%)", duration: 0.5, ease: "power4.out" }, 0.34);

          // Exit: both wipe back out, hard kill.
          tl.to(rolebar, { clipPath: "inset(0 0 0 100%)", duration: 0.32, ease: "power3.in" }, 4.25);
          tl.to(namebar, { clipPath: "inset(0 100% 0 0)", duration: 0.36, ease: "power3.in" }, 4.32);
          tl.set(wrap, { visibility: "hidden" }, 4.75);

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="lt-stack-bars"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="4.8"
        >
          <div id="lt-clip" class="clip" data-start="0" data-duration="4.8" data-track-index="0">
            <div id="lt" class="lt">
              <div id="lt-namebar" class="lt-namebar">
                <div id="lt-name" class="lt-name">Maya Chen</div>
              </div>
              <div id="lt-rolebar" class="lt-rolebar">
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
  }

  #root .lt {
    position: absolute;
    left: 120px;
    bottom: 116px;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  #root .lt-namebar {
    background: #141518;
    padding: 14px 30px;
    will-change: clip-path;
  }
  #root .lt-name {
    font-family: "Archivo Black", sans-serif;
    font-size: 52px;
    font-weight: 400;
    color: #ffffff;
    line-height: 1;
    letter-spacing: -0.015em;
    text-transform: uppercase;
    white-space: nowrap;
  }
  #root .lt-rolebar {
    background: #ffd23f;
    padding: 9px 22px;
    margin-left: 14px;
    will-change: clip-path;
  }
  #root .lt-role {
    font-family: "Space Mono", monospace;
    font-size: 23px;
    font-weight: 700;
    color: #141518;
    line-height: 1;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space: nowrap;
  }
}
</style>
