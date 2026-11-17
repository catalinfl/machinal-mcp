<!-- Modified Svelte adaptation of registry/blocks/lottie-character-walk/lottie-character-walk.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import lottie from 'lottie-web/build/player/lottie_light.js';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-lottie-character-walk';
  import __hfAsset from '@machinal/hyperframes/media/blocks-lottie-character-walk';
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

          (function () {
            var vars =
              __hfHost && typeof __hfHost.getVariables === "function"
                ? __hfHost.getVariables()
                : {};
            if (vars.title) document.getElementById("lcw-title").textContent = vars.title;
            if (vars.body) document.getElementById("lcw-body").textContent = vars.body;

            // Beside this file when mounted; a runtime without assetUrl keeps the plain path.
            const assetUrl = (path) =>
              typeof __hfHost !== "undefined" && __hfHost.assetUrl
                ? __hfHost.assetUrl(path)
                : path;
            // The character's body acting (walk, stop, point, idle) lives in the Lottie file.
            // The runtime seeks every player on window.__hfLottie to composition time.
            var mascot = lottie.loadAnimation({
              container: document.getElementById("lcw-mascot"),
              renderer: "svg",
              loop: false,
              autoplay: false,
              path: assetUrl("assets/mascot.json"),
            });
            window.__hfLottie = window.__hfLottie || [];
            window.__hfLottie.push(mascot);

            // The stage around the character is GSAP, timed to the Lottie's point at 5.2 s.
            var tl = gsap.timeline({ paused: true });
            tl.fromTo(
              "#lcw-card",
              { opacity: 0, x: 40, scale: 0.96 },
              { opacity: 1, x: 0, scale: 1, duration: 0.6, ease: "power3.out" },
              5.2,
            );
            tl.fromTo(
              ["#lcw-title", "#lcw-body"],
              { opacity: 0, y: 18 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", stagger: 0.1 },
              5.3,
            );
            tl.fromTo("#lcw-rule", { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease: "expo.out" }, 5.5);
            tl.to({}, { duration: 0 }, 7.5);

            
            __hfTimelineSlot.set(tl);
          })();
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="lcw-root"
          data-composition-id="lottie-character-walk"
          data-start="0"
          data-duration="7.5"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[&#123;"id":"title","type":"string","label":"Card title","default":"Meet your guide","maxLength":28&#125;,&#123;"id":"body","type":"string","label":"Card text","default":"Walks in on planted feet, then points the way.","maxLength":90&#125;]'>
          <div id="lcw-ground"></div>
          <div id="lcw-card">
            <div id="lcw-title">Meet your guide</div>
            <div id="lcw-rule"></div>
            <div id="lcw-body">Walks in on planted feet, then points the way.</div>
          </div>
          <div id="lcw-mascot"></div>
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
  #lcw-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #fcfcfd;
    font-family: Inter, sans-serif;
    color: #111827;
  }
  #lcw-ground {
    position: absolute;
    left: 0;
    right: 0;
    top: 906px;
    height: 1px;
    background: rgba(17, 24, 39, 0.14);
  }
  #lcw-mascot {
    position: absolute;
    inset: 0;
  }
  #lcw-card {
    position: absolute;
    left: 1100px;
    top: 300px;
    width: 660px;
    padding: 56px 60px 60px;
    border-radius: 28px;
    background: rgba(17, 24, 39, 0.08);
    border: 1px solid rgba(17, 24, 39, 0.14);
    opacity: 0;
  }
  #lcw-title {
    font-size: 64px;
    font-weight: 600;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  #lcw-rule {
    width: 120px;
    height: 8px;
    margin: 28px 0 30px;
    border-radius: 4px;
    background: #ff5a36;
    transform-origin: left center;
  }
  #lcw-body {
    font-size: 34px;
    line-height: 1.35;
    color: rgba(17, 24, 39, 0.72);
  }
}
</style>
