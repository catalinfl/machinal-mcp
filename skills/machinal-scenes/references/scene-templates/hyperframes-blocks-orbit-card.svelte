<!-- Modified Svelte adaptation of registry/blocks/orbit-card/orbit-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { createOrbitScene } from '@machinal/hyperframes/vendor/orbit-scene';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-orbit-card';
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

          // Bare __hfHost is this composition's own in a module.
          const renderAt = createOrbitScene(
            (typeof __hfHost !== "undefined" && __hfHost.getVariables?.()) || {},
          );
          const state = { time: 0 };
          const timeline = gsap.timeline({ paused: true });
          timeline.to(state, {
            time: 10,
            duration: 10,
            ease: "none",
            onUpdate: () => renderAt(state.time),
          });
          __hfListen("hf-seek", (event) => {
            if (typeof event.detail?.time === "number") {
              timeline.totalTime(Math.max(0, Math.min(10, event.detail.time)), true);
              renderAt(event.detail.time);
            }
          });
          
          __hfTimelineSlot.set(timeline);
          const query = new URLSearchParams(location.search);
          if (query.has("play")) {
            timeline.repeat(query.has("loop") ? 999 : 0);
            timeline.play(0);
          }
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#161718">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="oc-root"
          data-composition-id="orbit-card"
          data-start="0"
          data-duration="10"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[&#123;"id":"feature1Title","type":"string","label":"Card title","default":"Always in sync","maxLength":28&#125;,&#123;"id":"feature1Desc","type":"string","label":"Card description","default":"Changes reach every screen the moment they happen.","maxLength":110&#125;,&#123;"id":"feature1Accent","type":"color","label":"Card accent","default":"#4cc9ff"&#125;,&#123;"id":"cardOrbitDegrees","type":"number","label":"Card orbit degrees","description":"Total card-only vertical orbit during Blender frames 150–180 (4.9667–5.9667 seconds). Enter 180, 360, 720, or any angle. The sphere keeps its independent spin. The final angle holds after frame 180.","default":360,"min":-36000,"max":36000,"step":1&#125;]'>
          <section
            id="oc-stage"
            class="clip"
            data-start="0"
            data-duration="10"
            data-track-index="1"
          ></section>
          <div id="oc-fontload" aria-hidden="true">
            <span style="font-weight: 400">Aa</span><span style="font-weight: 600">Aa</span>
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
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #161718;
  }
  #oc-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    font-family: Archivo, sans-serif;
  }
  #oc-stage {
    position: absolute;
    inset: 0;
  }
  #oc-stage canvas {
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #oc-fontload {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
