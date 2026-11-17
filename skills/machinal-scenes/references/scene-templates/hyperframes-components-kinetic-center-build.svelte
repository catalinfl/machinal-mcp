<!-- Modified Svelte adaptation of registry/components/kinetic-center-build/kinetic-center-build.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { CustomEase } from 'gsap/dist/CustomEase';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-kinetic-center-build';
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

                var root = document.getElementById("root");
                var stage = document.getElementById("kcb-stage");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function numberBetween(value, fallback, min, max) {
                  var parsed = Number(value);
                  if (!Number.isFinite(parsed)) return fallback;
                  return Math.min(max, Math.max(min, parsed));
                }

                var text = typeof vars.text === "string" ? vars.text.trim() : "";
                if (!text) text = "Words push left.";

                var words = text.split(/\s+/);
                var requestedFontSize = numberBetween(vars.font_size, 72, 36, 160);
                var entryOffset = numberBetween(vars.entry_offset, 88, 20, 160);
                var fontWeight =
                  vars.font_weight === "500" || vars.font_weight === "700" || vars.font_weight === "800"
                    ? vars.font_weight
                    : "600";

                stage.style.fontWeight = fontWeight;
                stage.setAttribute("aria-label", text);

                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var measureFont = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
                var gapRatio = 10 / 72;

                function measure(fontSize) {
                  if (!context) {
                    return words.map(function (word) {
                      return word.length * fontSize * 0.55;
                    });
                  }
                  context.font = fontWeight + " " + fontSize + "px " + measureFont;
                  return words.map(function (word) {
                    return context.measureText(word).width;
                  });
                }

                var fontSize = requestedFontSize;
                var widths = measure(fontSize);
                var gap = fontSize * gapRatio;
                var fullWidth = widths.reduce(
                  function (total, width) {
                    return total + width;
                  },
                  gap * Math.max(0, words.length - 1),
                );
                var maxWidth = Math.max(1, root.clientWidth * 0.9);

                if (fullWidth > maxWidth) {
                  fontSize = Math.max(24, fontSize * (maxWidth / fullWidth));
                  widths = measure(fontSize);
                  gap = fontSize * gapRatio;
                }

                stage.style.fontSize = fontSize + "px";

                var positionsAt = [];
                for (var count = 1; count <= words.length; count += 1) {
                  var total = gap * (count - 1);
                  for (var widthIndex = 0; widthIndex < count; widthIndex += 1) {
                    total += widths[widthIndex];
                  }

                  var cursor = -total / 2;
                  var positions = [];
                  for (var positionIndex = 0; positionIndex < count; positionIndex += 1) {
                    positions.push(cursor + widths[positionIndex] / 2);
                    cursor += widths[positionIndex] + gap;
                  }
                  positionsAt.push(positions);
                }

                var elements = words.map(function (word, index) {
                  var element = document.createElement("span");
                  element.id = "kcb-word-" + index;
                  element.className = "kcb-word";
                  element.textContent = word;
                  element.setAttribute("aria-hidden", "true");
                  stage.appendChild(element);
                  return element;
                });

                gsap.registerPlugin(CustomEase);
                var entryEase = CustomEase.create("kcb-entry-ease", "M0,0 C0.2,0.8 0.2,1 1,1");
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2"));
                var firstDuration = 10 / 30;
                var pushDuration = 13 / 30;
                var authoredBuildDuration =
                  firstDuration + Math.max(0, words.length - 1) * pushDuration;
                var availableBuildDuration = Math.max(0.25, duration - 0.5);
                var timingScale = Math.min(1, availableBuildDuration / authoredBuildDuration);
                firstDuration *= timingScale;
                pushDuration *= timingScale;

                var tl = gsap.timeline({ paused: true });

                elements.forEach(function (element, index) {
                  var targetX = positionsAt[index][index];
                  var start = index === 0 ? 0 : firstDuration + (index - 1) * pushDuration;
                  var moveDuration = index === 0 ? firstDuration : pushDuration;
                  var fromX = index === 0 ? targetX : targetX + entryOffset;
                  var fromY = index === 0 ? 6 : 0;

                  tl.fromTo(
                    element,
                    {
                      x: fromX,
                      y: fromY,
                      xPercent: -50,
                      yPercent: -50,
                      scale: 0.992,
                      opacity: 0,
                      "--kcb-blur": "3.5px",
                    },
                    {
                      x: targetX,
                      y: 0,
                      xPercent: -50,
                      yPercent: -50,
                      scale: 1,
                      opacity: 1,
                      "--kcb-blur": "0px",
                      duration: moveDuration,
                      ease: entryEase,
                      immediateRender: index === 0,
                    },
                    start,
                  );

                  if (index === 0) return;

                  for (var priorIndex = 0; priorIndex < index; priorIndex += 1) {
                    var priorElement = elements[priorIndex];
                    var nextX = positionsAt[index][priorIndex];
                    var blurPeak = start + moveDuration / 2;

                    tl.to(priorElement, { x: nextX, duration: moveDuration, ease: entryEase }, start);
                    tl.to(
                      priorElement,
                      { "--kcb-blur": "0.8px", duration: moveDuration / 2, ease: "none" },
                      start,
                    );
                    tl.to(
                      priorElement,
                      { "--kcb-blur": "0px", duration: moveDuration / 2, ease: "none" },
                      blurPeak,
                    );
                  }
                });

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "Short phrase that builds one word at a time.", "default": "Words push left." &#125;,
        &#123; "id": "font_size", "type": "number", "role": "style", "label": "Font size", "description": "Maximum text size in pixels. Longer phrases shrink to stay inside the frame.", "default": 72, "min": 36, "max": 160, "step": 2, "unit": "px" &#125;,
        &#123; "id": "entry_offset", "type": "number", "role": "motion", "label": "Entry offset", "description": "Horizontal distance each new word travels before it lands.", "default": 88, "min": 20, "max": 160, "step": 4, "unit": "px" &#125;,
        &#123; "id": "color", "type": "color", "role": "style", "label": "Color", "description": "Text color for the full phrase.", "default": "#171717" &#125;,
        &#123; "id": "font_weight", "type": "enum", "role": "style", "label": "Font weight", "description": "Weight used by every word in the phrase.", "default": "600", "options": [&#123; "value": "500", "label": "Medium" &#125;, &#123; "value": "600", "label": "Semibold" &#125;, &#123; "value": "700", "label": "Bold" &#125;, &#123; "value": "800", "label": "Extra bold" &#125;] &#125;
      ]' data-composition-duration="2" data-composition-id="kinetic-center-build" data-duration="2" data-fps="30">
            <div
              id="kcb-clip"
              class="kcb-clip clip"
              data-start="0"
              data-duration="2"
              data-track-index="0"
            >
              <div id="kcb-stage" class="kcb-stage" role="img"></div>
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

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--color, #171717);
    font-family: var(--font-display, Geist, system-ui, sans-serif);
    pointer-events: none;
  }

  .kcb-clip, .kcb-stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .kcb-stage {
    letter-spacing: -0.03em;
    white-space: nowrap;
  }

  .kcb-word {
    --kcb-blur: 0px;
    position: absolute;
    left: 50%;
    top: 50%;
    display: inline-block;
    color: inherit;
    line-height: 1;
    white-space: nowrap;
    opacity: 0;
    filter: blur(var(--kcb-blur));
    backface-visibility: hidden;
    will-change: transform, filter, opacity;
  }
}
</style>
