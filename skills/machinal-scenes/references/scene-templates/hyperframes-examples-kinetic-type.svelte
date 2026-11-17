<!-- Modified Svelte adaptation of registry/examples/kinetic-type/index.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/examples-kinetic-type';
  import __hfAsset from '@machinal/hyperframes/media/examples-kinetic-type';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { design = {} } = $props();
  const __hfScene = useScene();
  let root = $state();
  let timeline = $state.raw();

  // Host shim: the upstream page reads its editable variables from the
  // HyperFrames host. In the port they come from the approved `design` prop.
  const __hfHost = { getVariables: () => (design || {}), variables: design || {}, assetUrl: path => __hfAsset(path) };

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

          
          const tl = gsap.timeline({ paused: true });

          // The A-roll <video> is a host-root element, so the sub-composition
          // timeline cannot reach it. Drive its reveal here on the main timeline at
          // global time (the graphics sub-comp starts at 0, so scene-local == global).
          //
          // COUPLING: the reveal/hide times below (2.2 / 11.7 / 13.5) are hand-tuned
          // to the graphics-layer sub-composition's scene boundaries and assume it is
          // mounted at data-start="0". If you re-time the sub-composition's scenes or
          // change its data-start, these absolute times drift out of alignment and
          // must be updated to match the new scene boundaries.
          tl.set("#a-roll-video", { opacity: 0 }, 0);
          tl.set("#a-roll-video", { opacity: 1 }, 2.2); // reveal after the Scene 1 white wipe
          tl.to("#a-roll-video", { opacity: 0, duration: 0.4 }, 11.7); // hide for the Wes Anderson scene
          tl.set("#a-roll-video", { opacity: 1 }, 13.5); // back for the Vignelli outro

          __hfTimelineSlot.set(tl);
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0a0a0f">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="main"
          data-start="0"
          data-duration="15"
          data-width="1920"
          data-height="1080"
        >
          
          <video
            id="a-roll-video"
            class="clip"
            src={__hfAsset("https://static.heygen.ai/astral_assets/uploaded_assets/67cf5a05_e134ec83a57042b38776c952da595870.mp4")}
            data-start="0"
            data-duration="14.72"
            data-track-index="0"
            data-has-audio="true"
            playsinline
            style="
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: 0;
              opacity: 0;
            "
          ></video>
          <div
            id="graphics-layer"
            data-composition-id="main-graphics"
            data-composition-src="compositions/main-graphics.html"
            data-start="0"
            data-duration="15"
            data-track-index="1"
            data-width="1920"
            data-height="1080"
            style="position: absolute; inset: 0; z-index: 1"
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
    margin: 0;
    padding: 0;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background-color: #0a0a0f;
    font-family: "Inter", sans-serif;
  }
}
</style>
