<!-- Modified Svelte adaptation of registry/components/caption-kinetic-slam/caption-kinetic-slam.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-kinetic-slam';
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
            

            var _fitCanvas = document.createElement("canvas");
            var _fitCtx = _fitCanvas.getContext("2d");
            function fitFontSize(text, baseFontSize, fontWeight, fontFamily, maxWidth) {
              var size = baseFontSize;
              var minSize = Math.floor(baseFontSize * 0.45);
              while (size > minSize) {
                _fitCtx.font = fontWeight + " " + size + "px " + fontFamily;
                if (_fitCtx.measureText(text).width <= maxWidth) return size;
                size -= 2;
              }
              return minSize;
            }

            function mulberry32(seed) {
              return function () {
                seed |= 0;
                seed = (seed + 0x6d2b79f5) | 0;
                var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
              };
            }

            var WORDS = [
              { text: "Every", start: 0.0, end: 0.3 },
              { text: "great", start: 0.3, end: 0.55 },
              { text: "video", start: 0.55, end: 0.85 },
              { text: "starts", start: 0.85, end: 1.1 },
              { text: "with", start: 1.1, end: 1.25 },
              { text: "a", start: 1.25, end: 1.35 },
              { text: "single", start: 1.35, end: 1.65 },
              { text: "frame.", start: 1.65, end: 2.0 },
              { text: "HyperFrames", start: 2.1, end: 2.65 },
              { text: "lets", start: 2.65, end: 2.85 },
              { text: "you", start: 2.85, end: 2.95 },
              { text: "write", start: 2.95, end: 3.15 },
              { text: "HTML", start: 3.15, end: 3.55 },
              { text: "and", start: 3.55, end: 3.65 },
              { text: "render", start: 3.65, end: 3.95 },
              { text: "professional", start: 3.95, end: 4.45 },
              { text: "video.", start: 4.45, end: 4.8 },
              { text: "No", start: 4.9, end: 5.05 },
              { text: "timeline.", start: 5.05, end: 5.45 },
              { text: "No", start: 5.5, end: 5.65 },
              { text: "drag", start: 5.65, end: 5.85 },
              { text: "and", start: 5.85, end: 5.95 },
              { text: "drop.", start: 5.95, end: 6.25 },
              { text: "Just", start: 6.35, end: 6.55 },
              { text: "code", start: 6.55, end: 6.8 },
              { text: "that", start: 6.8, end: 6.95 },
              { text: "becomes", start: 6.95, end: 7.3 },
              { text: "cinema.", start: 7.3, end: 7.7 },
            ];

            var KEYWORDS = new Set([8, 12, 15, 24, 27]); // HyperFrames, HTML, professional, code, cinema.

            var container = document.getElementById("kt-container");
            var tl = gsap.timeline({ paused: true });

            WORDS.forEach(function (w, wi) {
              var el = document.createElement("div");
              el.className = "kt-word";
              el.id = "kt-w-" + wi;
              el.textContent = w.text.toUpperCase();
              el.style.fontSize =
                fitFontSize(w.text.toUpperCase(), 220, "400", "'Anton', sans-serif", 1720) + "px";
              if (KEYWORDS.has(wi)) el.style.color = "#FFD700";
              container.appendChild(el);

              gsap.set(el, { yPercent: -50 });

              var entranceMode = wi % 4;
              tl.set(el, { visibility: "visible" }, w.start);
              if (entranceMode === 0) {
                tl.fromTo(
                  el,
                  { y: -120, opacity: 0 },
                  { y: 0, opacity: 1, duration: 0.22, ease: "back.out(1.7)" },
                  w.start,
                );
              } else if (entranceMode === 1) {
                tl.fromTo(
                  el,
                  { x: -300, opacity: 0 },
                  { x: 0, opacity: 1, duration: 0.2, ease: "expo.out" },
                  w.start,
                );
              } else if (entranceMode === 2) {
                tl.fromTo(
                  el,
                  { x: 300, opacity: 0 },
                  { x: 0, opacity: 1, duration: 0.2, ease: "expo.out" },
                  w.start,
                );
              } else {
                tl.fromTo(
                  el,
                  { scale: 0.4, opacity: 0 },
                  { scale: 1, opacity: 1, duration: 0.24, ease: "back.out(2.2)" },
                  w.start,
                );
              }

              tl.to(el, { opacity: 0, duration: 0.1, ease: "power2.in" }, w.end);
              tl.set(el, { opacity: 0, visibility: "hidden" }, w.end + 0.1);
            });

            tl.seek(0);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="kinetic-slam"
          data-composition-id="caption-kinetic-slam"
          data-timeline-locked
          data-start="0"
          data-duration="8"
          data-fps="30"
          data-width="1920"
          data-height="1080"
        >
          <div class="kt-overlay"></div>
          <div id="kt-container"></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }
  #kinetic-slam {
    pointer-events: none;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }
  .kt-overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    z-index: 1;
    pointer-events: none;
  }
  #kt-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }
  .kt-word {
    font-family: "Anton", sans-serif;
    font-weight: 400;
    text-transform: uppercase;
    color: #ffffff;
    position: absolute;
    left: 0;
    width: 100%;
    text-align: center;
    top: 50%;
    letter-spacing: 0.04em;
    line-height: 1;
    opacity: 0;
    visibility: hidden;
  }
}
</style>
