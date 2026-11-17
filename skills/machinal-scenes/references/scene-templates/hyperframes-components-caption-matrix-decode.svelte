<!-- Modified Svelte adaptation of registry/components/caption-matrix-decode/caption-matrix-decode.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-matrix-decode';
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

            var ALPHANUM = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            function scrambleChars(seed, length) {
              var rng = mulberry32(seed);
              var result = "";
              for (var i = 0; i < length; i++) {
                result += ALPHANUM[Math.floor(rng() * ALPHANUM.length)];
              }
              return result;
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

            var GROUPS = [
              { wordStart: 0, wordEnd: 3, start: 0.0, end: 1.35 },
              { wordStart: 4, wordEnd: 7, start: 1.1, end: 2.35 },
              { wordStart: 8, wordEnd: 8, start: 2.1, end: 2.9 },
              { wordStart: 9, wordEnd: 12, start: 2.65, end: 3.8 },
              { wordStart: 13, wordEnd: 15, start: 3.55, end: 4.7 },
              { wordStart: 16, wordEnd: 16, start: 3.95, end: 5.0 },
              { wordStart: 17, wordEnd: 19, start: 4.9, end: 5.7 },
              { wordStart: 20, wordEnd: 22, start: 5.65, end: 6.5 },
              { wordStart: 23, wordEnd: 24, start: 6.35, end: 7.05 },
              { wordStart: 25, wordEnd: 27, start: 6.8, end: 7.9 },
            ];

            var container = document.getElementById("sc-container");
            var tl = gsap.timeline({ paused: true });

            GROUPS.forEach(function (g, gi) {
              var groupWords = WORDS.slice(g.wordStart, g.wordEnd + 1);
              var groupText = groupWords
                .map(function (w) {
                  return w.text;
                })
                .join(" ");
              var fontSize = fitFontSize(groupText, 96, "700", "'Space Grotesk', sans-serif", 1760);
              var grp = document.createElement("div");
              grp.className = "sc-group";
              grp.id = "sc-grp-" + gi;

              groupWords.forEach(function (w, i) {
                var wi = g.wordStart + i;
                var wordWrap = document.createElement("span");
                wordWrap.className = "sc-word-wrap";
                wordWrap.id = "sc-ww-" + wi;
                wordWrap.style.fontSize = fontSize + "px";

                var real = document.createElement("span");
                real.className = "sc-real";
                real.id = "sc-real-" + wi;
                real.textContent = w.text;
                wordWrap.appendChild(real);

                var scr0 = document.createElement("span");
                scr0.className = "sc-scr0";
                scr0.id = "sc-scr0-" + wi;
                scr0.textContent = scrambleChars(wi * 1000 + 0, w.text.length);
                wordWrap.appendChild(scr0);

                var scr1 = document.createElement("span");
                scr1.className = "sc-scr1";
                scr1.id = "sc-scr1-" + wi;
                scr1.textContent = scrambleChars(wi * 1000 + 1, w.text.length);
                wordWrap.appendChild(scr1);

                grp.appendChild(wordWrap);
              });

              container.appendChild(grp);

              tl.set(grp, { visibility: "visible", opacity: 0 }, g.start);
              tl.fromTo(grp, { opacity: 0 }, { opacity: 1, duration: 0.1 }, g.start);

              groupWords.forEach(function (w, i) {
                var wi = g.wordStart + i;
                var realEl = document.getElementById("sc-real-" + wi);
                var scr0El = document.getElementById("sc-scr0-" + wi);
                var scr1El = document.getElementById("sc-scr1-" + wi);

                tl.set(scr0El, { autoAlpha: 1 }, w.start);
                tl.set(scr1El, { autoAlpha: 1 }, w.start + 0.1);
                tl.set(scr0El, { autoAlpha: 0 }, w.start + 0.1);
                tl.set(realEl, { autoAlpha: 1 }, w.start + 0.2);
                tl.set(scr1El, { autoAlpha: 0 }, w.start + 0.2);
              });

              tl.to(grp, { opacity: 0, duration: 0.12 }, g.end - 0.12);
              tl.set(grp, { opacity: 0, visibility: "hidden" }, g.end);
            });

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="matrix-decode"
          data-composition-id="caption-matrix-decode"
          data-timeline-locked
          data-start="0"
          data-duration="8"
          data-fps="30"
          data-width="1920"
          data-height="1080"
        >
          <div class="sc-overlay"></div>
          <div id="sc-container"></div>
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
  #matrix-decode {
    pointer-events: none;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }
  .sc-overlay {
    position: absolute;
    inset: 0;
    background: transparent;
    z-index: 1;
    pointer-events: none;
  }
  #sc-container {
    position: absolute;
    inset: 0;
    z-index: 10;
    pointer-events: none;
  }
  .sc-group {
    position: absolute;
    bottom: 120px;
    left: 0;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: center;
    gap: 24px;
    padding: 0 80px;
    opacity: 0;
    visibility: hidden;
  }
  .sc-word-wrap {
    font-family: "Space Grotesk", sans-serif;
    font-weight: 700;
    font-size: 96px;
    color: #00ff41;
    display: inline-block;
    letter-spacing: 0.04em;
    line-height: 1;
    position: relative;
  }
  .sc-real {
    opacity: 0;
    visibility: hidden;
  }
  .sc-scr0, .sc-scr1 {
    position: absolute;
    left: 0;
    top: 0;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
  }
}
</style>
