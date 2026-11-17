<!-- Modified Svelte adaptation of registry/examples/product-promo/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/examples-product-promo';
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
    await loadHyperframeFonts(__hfFonts);

              (function () {
                const tl = gsap.timeline({ paused: true });
                const text = document.querySelector("#caption-text");

                tl.to(text, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0);
                tl.to(text, { opacity: 0, y: -20, duration: 0.3, ease: "power3.in" }, 3.2);
                tl.set(text, { innerText: "Three cursors. One file. Zero meetings.", y: 40 }, 3.5);
                tl.to(text, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 3.5);
                tl.to(text, { opacity: 0, y: -20, duration: 0.3, ease: "power3.in" }, 7.7);
                tl.set(
                  text,
                  { innerText: "Components in. Feedback resolved. No one waited.", y: 40 },
                  8.0,
                );
                tl.to(text, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 8.0);
                tl.to(text, { opacity: 0, y: -20, duration: 0.4, ease: "power3.in" }, 12.1);

                
                __hfTimelineSlot.set(tl);
              })();
            

          
          const mainTl = gsap.timeline({ paused: true });

          mainTl.set("#scene-2-4", { scale: 1, filter: "blur(0px)" }, 1.5);
          mainTl.to(
            "#scene-2-4",
            { duration: 0.25, scale: 0.94, filter: "blur(6px)", opacity: 0, ease: "power2.in" },
            13.75,
          );

          __hfTimelineSlot.set(mainTl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0a0a0f">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="main"
          data-start="0"
          data-duration="20"
          data-width="1920"
          data-height="1080"
        >
          
          <div
            id="scene-1"
            class="scene"
            data-composition-id="scene1-logo-intro"
            data-composition-src="compositions/scene1-logo-intro.html"
            data-start="0"
            data-duration="1.5"
            data-track-index="1"
            data-width="1920"
            data-height="1080"
          ></div>
    
          
          <div
            id="scene-2-4"
            class="scene"
            data-composition-id="scene2-4-canvas"
            data-composition-src="compositions/scene2-4-canvas.html"
            data-start="1.5"
            data-duration="12.5"
            data-track-index="1"
            data-width="1920"
            data-height="1080"
          ></div>
    
          
          <div
            id="scene-5"
            class="scene"
            data-composition-id="scene5-logo-outro"
            data-composition-src="compositions/scene5-logo-outro.html"
            data-start="14"
            data-duration="6"
            data-track-index="1"
            data-width="1920"
            data-height="1080"
          ></div>
    
          
          <div
            id="captions-comp"
            data-track-kind="captions"
            data-composition-id="captions"
            data-start="1.5"
            data-duration="12.5"
            data-track-index="2"
            data-width="1920"
            data-height="1080"
          >
            <div class="caption-text-wrapper">
              <div id="caption-text" class="caption-line">Starting with a blank canvas.</div>
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
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #0a0a0f;
    font-family: "Inter", sans-serif;
  }
  .scene {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
  .caption-text-wrapper {
    position: absolute;
    bottom: 150px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    pointer-events: none;
    overflow: hidden;
    padding: 10px 0;
  }
  .caption-line {
    color: white;
    font-size: 48px;
    font-weight: 600;
    letter-spacing: -0.02em;
    text-align: center;
    text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    transform: translateY(100%);
    opacity: 0;
  }
}
</style>
