<!-- Modified Svelte adaptation of registry/components/caret-swap/caret-swap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { CustomEase } from 'gsap/dist/CustomEase';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caret-swap';
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
                var stage = document.getElementById("cs-stage");
                var source = document.getElementById("cs-source");
                var target = document.getElementById("cs-target");
                var targetText = document.getElementById("cs-target-text");
                var caret = document.getElementById("cs-caret");
                var cover = document.getElementById("cs-cover");
                // Read host timing before the runtime flattens its attributes.
                var mount = root.closest("[data-composition-id]") || root;
                var duration = Math.max(
                  0.001,
                  Number(mount.dataset.duration || mount.dataset.hfAuthoredDuration) || 100 / 30,
                );
                document.getElementById("cs-clip").dataset.duration = String(duration);
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};
                var fromText = typeof vars.from_text === "string" ? vars.from_text : "Executing it?";
                var toText =
                  typeof vars.to_text === "string" ? vars.to_text : "That's where everyone quits";
                fromText = fromText.replace(/[\r\n\u2028\u2029]+/g, " ");
                toText = toText.replace(/[\r\n\u2028\u2029]+/g, " ");
                var fontSize = Number(vars.font_size);
                fontSize = Number.isFinite(fontSize) ? Math.min(160, Math.max(36, fontSize)) : 72;
                var fontWeight = ["400", "500", "600", "700"].includes(vars.font_weight)
                  ? vars.font_weight
                  : "400";

                stage.style.fontSize = fontSize + "px";
                stage.style.fontWeight = fontWeight;
                stage.setAttribute("aria-label", fromText + " → " + toText);
                source.textContent = fromText;

                var segments = Array.from(
                  new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(toText),
                );
                var phrases = segments.map(function (part) {
                  return toText.slice(0, part.index + part.segment.length);
                });

                function geometry() {
                  var anchorWidth = stage.getBoundingClientRect().width;
                  targetText.textContent = toText;
                  var targetWidth = targetText.getBoundingClientRect().width;
                  var caretWidth = fontSize * 0.08;
                  var gap = fontSize * 0.06;
                  var shift = (anchorWidth - targetWidth - caretWidth - gap) / 2;
                  var prefixes = phrases.map(function (phrase) {
                    targetText.textContent = phrase;
                    return targetText.getBoundingClientRect().width;
                  });
                  targetText.textContent = toText;
                  var halfWidth = anchorWidth / 2;
                  prefixes.forEach(function (prefix, index) {
                    var start = -anchorWidth / 2 + (shift * (index + 1)) / phrases.length;
                    halfWidth = Math.max(
                      halfWidth,
                      Math.abs(start),
                      Math.abs(start + prefix + gap + caretWidth),
                    );
                  });
                  return {
                    anchorWidth: anchorWidth,
                    caretWidth: caretWidth,
                    shift: shift,
                    prefixes: prefixes,
                    width: halfWidth * 2,
                  };
                }

                function typeElapsed(count) {
                  return (1 - Math.pow(0.96, count)) / 0.04;
                }

                document.fonts.ready.then(function () {
                  var layout = geometry();
                  var fit = Math.min(
                    1,
                    (root.clientWidth * 0.9) / Math.max(1, layout.width),
                    (root.clientHeight * 0.8) / (fontSize * 1.15),
                  );
                  fontSize *= fit;
                  stage.style.fontSize = fontSize + "px";
                  layout = geometry();

                  var typeEnd = 40 + typeElapsed(phrases.length);
                  var timingScale = Math.min(1, (duration * 30) / (typeEnd + 8));
                  function at(frame) {
                    return (frame / 30) * timingScale;
                  }

                  gsap.registerPlugin(CustomEase);
                  var expandEase = CustomEase.create("cs-expand", "M0,0 C0.6,0 0.8,0.4 1,1");
                  var collapseEase = CustomEase.create("cs-collapse", "M0,0 C0.2,0.7 0.3,1 1,1");
                  gsap.set(source, { opacity: 1 });
                  gsap.set(cover, {
                    yPercent: -50,
                    width: layout.caretWidth,
                    x: layout.anchorWidth - layout.caretWidth,
                    opacity: 0,
                    "--cs-mask-stop": "100%",
                  });
                  gsap.set(target, { yPercent: -50, x: 0, opacity: 0 });
                  gsap.set(caret, { yPercent: -50, x: 0, opacity: 1 });
                  gsap.set(targetText, { textContent: "" });
                  gsap.set(stage, { opacity: 1 });

                  var tl = gsap.timeline({ paused: true });
                  tl.set(cover, { opacity: 1 }, at(13));
                  tl.fromTo(
                    cover,
                    {
                      width: layout.caretWidth,
                      x: layout.anchorWidth - layout.caretWidth,
                      "--cs-mask-stop": "100%",
                    },
                    {
                      width: layout.anchorWidth,
                      x: 0,
                      "--cs-mask-stop": "10%",
                      duration: at(6),
                      ease: expandEase,
                      immediateRender: false,
                    },
                    at(20),
                  );
                  tl.set(source, { opacity: 0 }, at(26));
                  tl.fromTo(
                    cover,
                    { width: layout.anchorWidth, "--cs-mask-stop": "10%" },
                    {
                      width: layout.caretWidth,
                      "--cs-mask-stop": "100%",
                      duration: at(7),
                      ease: collapseEase,
                      immediateRender: false,
                    },
                    at(26),
                  );
                  tl.set(cover, { opacity: 0 }, at(40));
                  tl.set(target, { opacity: 1 }, at(40));

                  phrases.forEach(function (phrase, index) {
                    var time = at(40 + typeElapsed(index));
                    tl.set(targetText, { textContent: phrase }, time);
                    tl.set(caret, { x: layout.prefixes[index] }, time);
                    tl.set(target, { x: (layout.shift * (index + 1)) / phrases.length }, time);
                  });
                  if (!phrases.length) tl.set(target, { x: layout.shift }, at(40));

                  for (
                    var frame = typeEnd + 8, blink = 0;
                    at(frame) < duration;
                    frame += 8, blink += 1
                  ) {
                    tl.set(caret, { opacity: blink % 2 }, at(frame));
                  }

                  
                  __hfTimelineSlot.set(tl);
                });
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="caret-swap"
            data-duration="3.3333333333333335"
            data-fps="30"
          >
            <div
              id="cs-clip"
              class="cs-clip clip"
              data-start="0"
              data-duration="3.3333333333333335"
              data-track-index="0"
            >
              <div id="cs-stage" class="cs-stage" role="img">
                <span
                  id="cs-source"
                  class="cs-source"
                  aria-hidden="true"
                  data-layout-allow-occlusion
                ></span>
                <span class="cs-spacer" aria-hidden="true"></span>
                <span id="cs-cover" class="cs-cover" aria-hidden="true"></span>
                <span id="cs-target" class="cs-target" aria-hidden="true">
                  <span id="cs-target-text" class="cs-target-text"></span>
                  <span id="cs-caret" class="cs-caret"></span>
                </span>
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
  #root, #root * {
    box-sizing: border-box;
  }

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    isolation: isolate;
    pointer-events: none;
    color: var(--color, #171717);
    font-family: var(--font-display, "Caret Swap Geist", system-ui, sans-serif);
  }

  .cs-clip {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .cs-stage {
    position: relative;
    display: inline-flex;
    align-items: center;
    white-space: pre;
    font-size: 72px;
    font-weight: 400;
    line-height: 1.15;
    letter-spacing: -0.02em;
    opacity: 0;
  }

  .cs-source, .cs-target-text {
    display: inline-block;
    white-space: pre;
  }

  .cs-spacer {
    flex-shrink: 0;
    width: 0.08em;
    height: 1.1em;
    margin-left: 0.06em;
  }

  .cs-cover, .cs-caret {
    position: absolute;
    top: 50%;
    height: 1.1em;
    border-radius: 0.03em;
    background: linear-gradient(
      180deg,
      var(--caret_color, #ff4daa),
      var(--caret_color_end, #8a5cf6)
    );
  }

  .cs-cover {
    left: 0;
    width: 100%;
    --cs-mask-stop: 100%;
    mask-image: linear-gradient(90deg, black var(--cs-mask-stop), transparent 100%);
  }

  .cs-target {
    position: absolute;
    left: 0;
    top: 50%;
    display: inline-flex;
    align-items: center;
  }

  .cs-caret {
    left: 0;
    width: 0.08em;
    margin-left: 0.06em;
  }
}
</style>
