<!-- Modified Svelte adaptation of registry/components/caption-parallax-layers/caption-parallax-layers.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-parallax-layers';
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

          var DURATION = 8;
          var BEHIND_WIDTH = 1800;
          var FRONT_WIDTH = 1750;
          var ENTRY_DUR = 0.1;
          var SLIDE_DUR = 0.2;

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

          var W = [
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

          // behind=red 3D emphasis words, front=normal white words
          var BLOCKS = [
            { behind: null, front: [[0], [1], [2]] },
            { behind: [[3]], front: [[4], [5]] },
            { behind: [[6]], front: [[7]] },
            { behind: [[8]], front: [[9], [10], [11]] },
            { behind: [[12]], front: [[13], [14]] },
            { behind: [[15]], front: [[16]] },
            { behind: null, front: [[17], [18]] },
            { behind: null, front: [[19], [20], [21], [22]] },
            { behind: [[24]], front: [[23], [25], [26]] },
            { behind: [[27]], front: null },
          ];

          var behindStage = document.getElementById("behind-stage");
          var frontStage = document.getElementById("front-stage");

          BLOCKS.forEach(function (block, bi) {
            var bEl = document.createElement("div");
            bEl.className = "caption-block";
            bEl.id = "bb" + bi;
            if (block.behind) {
              var behindText = block.behind
                .map(function (wi_arr) {
                  return W[wi_arr[0]].text;
                })
                .join(" ");
              var behindSize = fitFontSize(behindText, 220, "400", "Instrument Serif", BEHIND_WIDTH);
              var bLine = document.createElement("div");
              bLine.className = "caption-line caption-line--behind";
              block.behind.forEach(function (wi_arr, wi) {
                var span = document.createElement("span");
                span.className = "word word--behind";
                span.id = "bb" + bi + "w" + wi;
                span.textContent = W[wi_arr[0]].text;
                span.style.fontSize = behindSize + "px";
                bLine.appendChild(span);
              });
              bEl.appendChild(bLine);
            }
            behindStage.appendChild(bEl);

            var fEl = document.createElement("div");
            fEl.className = "caption-block";
            fEl.id = "fb" + bi;
            if (block.front) {
              var frontText = block.front
                .map(function (wi_arr) {
                  return W[wi_arr[0]].text;
                })
                .join(" ");
              var frontSize = fitFontSize(frontText, 130, "400", "Instrument Serif", FRONT_WIDTH);
              var fLine = document.createElement("div");
              fLine.className = "caption-line";
              block.front.forEach(function (wi_arr, wi) {
                var span = document.createElement("span");
                var isItalic = wi_arr[0] === 7 || wi_arr[0] === 18; // frame., timeline.
                span.className = "word " + (isItalic ? "word--front-italic" : "word--front-normal");
                span.id = "fb" + bi + "w" + wi;
                span.textContent = W[wi_arr[0]].text;
                span.style.fontSize = frontSize + "px";
                fLine.appendChild(span);
              });
              fEl.appendChild(fLine);
            }
            frontStage.appendChild(fEl);
          });

          var allBehind = BLOCKS.map(function (_, i) {
            return document.getElementById("bb" + i);
          });
          var allFront = BLOCKS.map(function (_, i) {
            return document.getElementById("fb" + i);
          });

          function applyBehindScales() {
            BLOCKS.forEach(function (block, bi) {
              if (block.behind) {
                var line = allBehind[bi].querySelector(".caption-line");
                if (line) {
                  var natW = line.scrollWidth;
                  if (natW > 0) {
                    var s = BEHIND_WIDTH / natW;
                    line.style.transform = "scaleX(" + s + ") scaleY(2.8)";
                  }
                }
              }
            });
          }
          applyBehindScales();

          
          var tl = gsap.timeline({ paused: true });

          function blockStart(bi) {
            var b = BLOCKS[bi];
            var firstIdx = b.behind ? b.behind[0][0] : b.front[0][0];
            return W[firstIdx].start;
          }

          BLOCKS.forEach(function (block, bi) {
            var start = blockStart(bi);
            var nextStart = bi < BLOCKS.length - 1 ? blockStart(bi + 1) : DURATION;
            var bEl = allBehind[bi];
            var fEl = allFront[bi];

            allBehind.forEach(function (other, oi) {
              if (oi !== bi) tl.set(other, { opacity: 0 }, start);
            });
            allFront.forEach(function (other, oi) {
              if (oi !== bi) tl.set(other, { opacity: 0 }, start);
            });

            if (block.behind) {
              tl.set(bEl, { opacity: 1 }, start);
              block.behind.forEach(function (wi_arr, wi) {
                var wordEl = document.getElementById("bb" + bi + "w" + wi);
                var wordStart = W[wi_arr[0]].start;
                tl.set(wordEl, { opacity: 0 }, start);
                tl.to(wordEl, { opacity: 1, duration: ENTRY_DUR, ease: "power2.out" }, wordStart);
              });
            }

            if (block.front) {
              tl.set(fEl, { opacity: 1 }, start);
              block.front.forEach(function (wi_arr, wi) {
                var wordEl = document.getElementById("fb" + bi + "w" + wi);
                var wordStart = W[wi_arr[0]].start;
                tl.set(wordEl, { opacity: 0 }, start);
                tl.set(wordEl, { opacity: 1 }, wordStart);
              });
            }

            tl.set(bEl, { opacity: 0 }, nextStart);
            tl.set(fEl, { opacity: 0 }, nextStart);
          });

          tl.to({}, { duration: DURATION }, 0);
          __hfTimelineSlot.set(tl);

          document.fonts.ready.then(function () {
            applyBehindScales();
          });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="parallax-layers"
          data-composition-id="caption-parallax-layers"
          data-timeline-locked
          data-start="0"
          data-duration="8"
          data-fps="30"
          data-width="1920"
          data-height="1080"
        >
          <div class="behind-caption-layer" aria-hidden="true">
            <div id="behind-stage" class="behind-safe-zone"></div>
          </div>
    
          <div class="front-caption-layer" aria-hidden="true">
            <div id="front-stage" class="front-safe-zone"></div>
          </div>
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
    font-family: "Instrument Serif", serif;
  }

  #parallax-layers {
    pointer-events: none;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }

  /* Behind captions: big red 3D text */
  .behind-caption-layer {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
    transform: translateZ(0);
  }

  /* Front captions */
  .front-caption-layer {
    position: absolute;
    inset: 0;
    z-index: 30;
    pointer-events: none;
    transform: translateZ(0);
  }

  .behind-safe-zone {
    position: absolute;
    top: 40px;
    left: 0;
    width: 1920px;
    height: 500px;
  }

  .front-safe-zone {
    position: absolute;
    top: 700px;
    left: 0;
    width: 1920px;
    height: 300px;
  }

  .caption-block {
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    opacity: 0;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .caption-line {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 14px;
    line-height: 1.1;
    white-space: nowrap;
  }

  .caption-line--behind {
    transform: scaleY(2.8);
    transform-origin: 50% 0%;
  }

  .word {
    display: inline-block;
    will-change: transform, opacity;
    backface-visibility: hidden;
  }

  .word--behind {
    font-family: "Instrument Serif", serif;
    font-size: 220px;
    font-weight: 400;
    font-style: normal;
    line-height: 0.9;
    color: #e50914;
    -webkit-text-stroke: 5px #e50914;
    text-shadow: 2px 4px 4px #a30610;
  }

  .word--front-normal {
    font-family: "Instrument Serif", serif;
    font-size: 130px;
    font-weight: 400;
    font-style: normal;
    color: #eeeeee;
    text-shadow:
      0 2px 12px rgba(0, 0, 0, 0.6),
      0 4px 24px rgba(0, 0, 0, 0.35);
  }

  .word--front-italic {
    font-family: "Instrument Serif", serif;
    font-size: 130px;
    font-weight: 400;
    font-style: italic;
    color: #eeeeee;
    text-shadow:
      0 2px 12px rgba(0, 0, 0, 0.6),
      0 4px 24px rgba(0, 0, 0, 0.35);
  }
}
</style>
