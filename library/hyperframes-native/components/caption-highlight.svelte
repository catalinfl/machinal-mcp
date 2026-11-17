<!-- Modified Svelte adaptation of registry/components/caption-highlight/caption-highlight.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-highlight';
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

            var RAW_GROUPS = [
              [0, 3],
              [4, 7],
              [8, 8],
              [9, 12],
              [13, 15],
              [16, 16],
              [17, 19],
              [20, 22],
              [23, 24],
              [25, 27],
            ];
            var GROUPS = RAW_GROUPS.map(function (pair, gi) {
              var ws = pair[0],
                we = pair[1];
              var nextStart =
                gi + 1 < RAW_GROUPS.length ? WORDS[RAW_GROUPS[gi + 1][0]].start : Infinity;
              var gEnd = Math.min(WORDS[we].end + 0.5, nextStart - 0.05);
              return { wordStart: ws, wordEnd: we, start: WORDS[ws].start, end: gEnd };
            });

            var container = document.getElementById("hl-container");
            var tl = gsap.timeline({ paused: true });

            GROUPS.forEach(function (g, gi) {
              var groupWords = WORDS.slice(g.wordStart, g.wordEnd + 1);
              var grp = document.createElement("div");
              grp.className = "hl-group";
              grp.id = "hl-grp-" + gi;

              var groupText = groupWords
                .map(function (w) {
                  return w.text.toUpperCase();
                })
                .join(" ");
              var computedSize = fitFontSize(groupText, 80, "800", "Montserrat", 1620);

              groupWords.forEach(function (w, i) {
                var wi = g.wordStart + i;
                var wordEl = document.createElement("span");
                wordEl.className = "hl-word";
                wordEl.id = "hl-w-" + wi;
                wordEl.style.fontSize = computedSize + "px";

                var bgEl = document.createElement("span");
                bgEl.className = "hl-word-bg";
                bgEl.id = "hl-bg-" + wi;

                var textEl = document.createElement("span");
                textEl.className = "hl-word-text";
                textEl.textContent = w.text.toUpperCase();

                wordEl.appendChild(bgEl);
                wordEl.appendChild(textEl);
                grp.appendChild(wordEl);
              });

              container.appendChild(grp);

              tl.set(grp, { visibility: "visible" }, g.start);
              tl.fromTo(
                grp,
                { opacity: 0 },
                { opacity: 1, duration: 0.12, ease: "power2.out" },
                g.start,
              );

              groupWords.forEach(function (w, i) {
                var wi = g.wordStart + i;
                var bgEl = document.getElementById("hl-bg-" + wi);
                var wordEl = document.getElementById("hl-w-" + wi);

                var fadeIn = Math.min(0.15, w.end - w.start);
                tl.to(bgEl, { opacity: 1, scaleX: 1, duration: fadeIn, ease: "power2.out" }, w.start);
                tl.to(
                  wordEl,
                  { filter: "brightness(1.05)", duration: 0.08, ease: "power2.out" },
                  w.start,
                );
                tl.to(
                  wordEl,
                  { filter: "brightness(1)", duration: 0.16, ease: "power2.out" },
                  w.start + 0.08,
                );
                tl.to(bgEl, { opacity: 0, scaleX: 1.02, duration: 0.1, ease: "power2.in" }, w.end);
                tl.set(bgEl, { scaleX: 0 }, w.end + 0.1);
              });

              tl.to(grp, { opacity: 0, duration: 0.1, ease: "power2.in" }, g.end - 0.1);
              tl.set(grp, { opacity: 0, visibility: "hidden" }, g.end);
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
          id="highlight"
          data-composition-id="caption-highlight"
          data-timeline-locked
          data-start="0"
          data-duration="8"
          data-fps="30"
          data-width="1920"
          data-height="1080"
        >
          <div class="hl-overlay"></div>
          <div id="hl-container"></div>
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
  #highlight {
    pointer-events: none;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }
  #hl-video {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .hl-overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    z-index: 1;
    pointer-events: none;
  }
  #hl-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }
  .hl-group {
    position: absolute;
    bottom: 140px;
    left: 0;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
    padding: 0 100px;
    opacity: 0;
    visibility: hidden;
  }
  .hl-word {
    font-family: "Montserrat", sans-serif;
    font-weight: 800;
    font-size: 80px;
    text-transform: uppercase;
    color: #ffffff;
    display: inline-block;
    letter-spacing: 0.02em;
    line-height: 1;
    position: relative;
    padding: 6px 12px 8px;
    text-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
    transform-origin: 50% 58%;
    will-change: transform, filter;
  }
  .hl-word-bg {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #ff1745 0%, #df1238 100%);
    border-radius: 10px;
    box-shadow: 0 12px 30px rgba(229, 20, 58, 0.32);
    opacity: 0;
    transform: scaleX(0);
    transform-origin: 0% 50%;
    z-index: -1;
  }
  .hl-word-text {
    position: relative;
    z-index: 1;
  }
}
</style>
