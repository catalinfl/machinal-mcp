<!-- Modified Svelte adaptation of registry/components/morph-text/morph-text.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-morph-text';
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
            "use strict";

            var container = document.getElementById("morph-text");
            var display = document.getElementById("morph-display");
            var elA = document.getElementById("morph-a");
            var elB = document.getElementById("morph-b");

            var words = Array.from(document.querySelectorAll("#morph-words li"))
              .map(function (el) {
                return {
                  text: el.textContent.trim(),
                  font: el.dataset.font || "'Figtree', sans-serif",
                  color: el.dataset.color || "#111111",
                };
              })
              .filter(function (w) {
                return w.text;
              });

            if (words.length < 2) {
              words = [
                { text: "Morph", font: "'Figtree', sans-serif", color: "#111111" },
                { text: "Text", font: "'Figtree', sans-serif", color: "#111111" },
              ];
            }

            var morphSpeed = parseFloat(container.dataset.morphSpeed || "1");
            var morphPause = parseFloat(container.dataset.morphPause || "1.5");
            var duration = parseFloat(container.dataset.duration || "9");
            var stepDur = morphSpeed + morphPause;
            var totalWordDur = words.length * stepDur;

            function applyMorph(T) {
              var t = T % totalWordDur;
              var stepIdx = Math.floor(t / stepDur);
              var stepT = t - stepIdx * stepDur;
              var frac = Math.min(stepT / morphSpeed, 1);

              var wA = words[stepIdx % words.length];
              var wB = words[(stepIdx + 1) % words.length];

              elA.textContent = wA.text;
              elA.style.fontFamily = "var(--font-display, " + wA.font + ")";
              elA.style.color = "var(--fg, " + wA.color + ")";

              elB.textContent = wB.text;
              elB.style.fontFamily = "var(--font-display, " + wB.font + ")";
              elB.style.color = "var(--fg, " + wB.color + ")";

              if (frac <= 0) {
                display.style.filter = "none";
                elA.style.filter = "";
                elA.style.opacity = "1";
                elB.style.filter = "";
                elB.style.opacity = "0";
              } else if (frac >= 1) {
                display.style.filter = "none";
                elA.style.filter = "";
                elA.style.opacity = "0";
                elB.style.filter = "";
                elB.style.opacity = "1";
              } else {
                display.style.filter = "url(#morph-threshold)";
                var blurB = Math.max(0, Math.min(8 / frac - 8, 100));
                var blurA = Math.max(0, Math.min(8 / (1 - frac) - 8, 100));
                elB.style.filter = "blur(" + blurB + "px)";
                elB.style.opacity = frac;
                elA.style.filter = "blur(" + blurA + "px)";
                elA.style.opacity = 1 - frac;
              }
            }

            if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
              elA.textContent = words[0].text;
              elA.style.fontFamily = "var(--font-display, " + words[0].font + ")";
              elA.style.color = "var(--fg, " + words[0].color + ")";
              elA.style.opacity = "1";
              display.style.filter = "none";
              return;
            }

            var proxy = { t: 0 };
            var tl = gsap.timeline({ paused: true });

            tl.to(proxy, {
              t: duration,
              duration: duration,
              ease: "none",
              onUpdate: function () {
                applyMorph(proxy.t);
              },
            });

            applyMorph(0);
            tl.seek(0);

            
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="var(--bg, #fff)">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="morph-text"
          data-composition-id="morph-text"
          data-timeline-locked
          data-width="1920"
          data-height="1080"
          data-duration="15"
          data-fps="30"
          data-morph-speed="1"
          data-morph-pause="1.5"
        >
          
          <ol id="morph-words" aria-hidden="true">
            <li data-font="'Figtree', sans-serif" data-color="#000000">Do more with less.</li>
            <li data-font="'Figtree', sans-serif" data-color="#000000">Built for what's next.</li>
            <li data-font="'Figtree', sans-serif" data-color="#000000">Fast. Focused. Powerful.</li>
            <li data-font="'Figtree', sans-serif" data-color="#000000">Your work, amplified.</li>
            <li data-font="'Figtree', sans-serif" data-color="#000000">Start free today.</li>
          </ol>
    
          <svg id="morph-filter" aria-hidden="true" focusable="false">
            <defs>
              <filter id="morph-threshold">
                <feColorMatrix
                  in="SourceGraphic"
                  type="matrix"
                  values="1 0 0 0 0
                          0 1 0 0 0
                          0 0 1 0 0
                          0 0 0 255 -100"
                />
              </filter>
            </defs>
          </svg>
    
          <div id="morph-wrapper">
            <div id="morph-display">
              <span id="morph-a"></span>
              <span id="morph-b"></span>
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
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--bg, #fff);
  }

  #morph-text {
    position: relative;
    width: 1920px;
    height: 1080px;
  }

  /* Word list: hidden source of truth - edit <li> items in Studio. */
  #morph-words {
    display: none;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  #morph-filter {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
    pointer-events: none;
  }

  #morph-wrapper {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    width: 1920px;
    height: 210px;
    filter: drop-shadow(0 10px 44px rgba(0, 0, 0, 0.5))
    drop-shadow(0 3px 10px rgba(0, 0, 0, 0.25));
  }

  #morph-display {
    width: 100%;
    height: 100%;
    filter: none;
  }

  #morph-a, #morph-b {
    position: absolute;
    width: 100%;
    display: inline-block;
    text-align: center;
    font-size: 120pt;
    font-weight: 900;
    line-height: 1;
    user-select: none;
  }
}
</style>
