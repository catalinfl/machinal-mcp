<!-- Modified Svelte adaptation of registry/components/caption-pill-karaoke/caption-pill-karaoke.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-pill-karaoke';
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
          var SAFE_ZONE_WIDTH = 1400;
          var PILL_MAX_WIDTH = 1400;
          var PILL_MIN_PADDING_X = 30;
          var PILL_MAX_PADDING_X = 60;
          var FONT_WIDTH_SAFETY = 1.18;
          var FONT_FAMILY = "Poppins";
          var FONT_WEIGHT = "700";
          var BASE_FONT_SIZE = 72;
          var MIN_FONT_SIZE = 52;
          var MAX_WORDS_PER_GROUP = 4;
          var WORD_SPACING = 16;
          var PAUSE_THRESHOLD = 0.1;
          var GROUP_END_BUFFER = 0.3;
          var COLOR_INACTIVE = "#A6A6A6";
          var COLOR_ACTIVE = "#1C1E1D";
          var COLOR_FADE_DURATION = 0.1;
          var WORD_FADE_LEAD = 0.05;

          var TRANSCRIPT = [
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

          function normalizeWords(rawWords) {
            return rawWords
              .map(function (item) {
                var text = String(item.word || item.text || "").trim();
                return {
                  text: text,
                  start: Math.max(0, Number(item.start) || 0),
                  end: Math.min(DURATION, Math.max(Number(item.start) || 0, Number(item.end) || 0)),
                };
              })
              .filter(function (w) {
                return w.text.length > 0;
              });
          }

          var measureCanvas = document.createElement("canvas");
          var measureContext = measureCanvas.getContext("2d");

          function measureWordWidth(text, fontSize) {
            measureContext.font = FONT_WEIGHT + " " + fontSize + "px " + FONT_FAMILY;
            return measureContext.measureText(text).width * FONT_WIDTH_SAFETY;
          }

          function measureLineWidth(words, fontSize) {
            return words.reduce(function (total, word, index) {
              return (
                total + measureWordWidth(word.text.toLowerCase(), fontSize) + (index ? WORD_SPACING : 0)
              );
            }, 0);
          }

          function splitLinesForGroup(words, fontSize) {
            var maxLineWidth = PILL_MAX_WIDTH - PILL_MIN_PADDING_X * 2;
            if (
              words.some(function (w) {
                return measureWordWidth(w.text.toLowerCase(), fontSize) > maxLineWidth;
              })
            ) {
              return null;
            }
            if (measureLineWidth(words, fontSize) <= maxLineWidth) return [words];
            var bestSplit = null;
            var bestImbalance = Infinity;
            for (var split = 1; split < words.length; split++) {
              var firstLine = words.slice(0, split);
              var secondLine = words.slice(split);
              var firstWidth = measureLineWidth(firstLine, fontSize);
              var secondWidth = measureLineWidth(secondLine, fontSize);
              if (firstWidth <= maxLineWidth && secondWidth <= maxLineWidth) {
                var imbalance = Math.abs(firstWidth - secondWidth);
                if (imbalance < bestImbalance) {
                  bestSplit = [firstLine, secondLine];
                  bestImbalance = imbalance;
                }
              }
            }
            return bestSplit;
          }

          function fitsInTwoLinesAtSize(words, fontSize) {
            return splitLinesForGroup(words, fontSize) !== null;
          }

          function planPillLayout(words, fontSize) {
            var lines = splitLinesForGroup(words, fontSize) || [words];
            var widestLine = lines.reduce(function (max, lineWords) {
              return Math.max(max, measureLineWidth(lineWords, fontSize));
            }, 0);
            var availablePadding = Math.floor((PILL_MAX_WIDTH - widestLine) / 2);
            var padX = Math.max(PILL_MIN_PADDING_X, Math.min(PILL_MAX_PADDING_X, availablePadding));
            var pillWidth = Math.min(PILL_MAX_WIDTH, Math.ceil(widestLine + padX * 2));
            return { lines: lines, padX: padX, pillWidth: pillWidth };
          }

          function makeGroups(words) {
            var groups = [];
            var current = [];
            words.forEach(function (word, index) {
              var testGroup = current.concat([word]);
              var nextWord = words[index + 1];
              var wouldExceedMaxWords = testGroup.length > MAX_WORDS_PER_GROUP;
              var wouldExceedTwoLines = !fitsInTwoLinesAtSize(testGroup, BASE_FONT_SIZE);
              if (wouldExceedMaxWords || wouldExceedTwoLines) {
                if (current.length) {
                  groups.push({
                    words: current.slice(),
                    start: current[0].start,
                    end: current[current.length - 1].end,
                  });
                }
                current = [word];
                return;
              }
              current.push(word);
              var hasPunctuation = /[,.:!?]$/.test(word.text);
              var pauseDuration = nextWord ? nextWord.start - word.end : 0;
              var hasNaturalPause = pauseDuration >= PAUSE_THRESHOLD;
              var maxWordsReached = current.length >= MAX_WORDS_PER_GROUP;
              if (maxWordsReached || !nextWord || hasPunctuation || hasNaturalPause) {
                groups.push({
                  words: current.slice(),
                  start: current[0].start,
                  end: current[current.length - 1].end,
                });
                current = [];
              }
            });
            if (current.length)
              groups.push({
                words: current.slice(),
                start: current[0].start,
                end: current[current.length - 1].end,
              });
            return groups;
          }

          function fontSizeForGroup(words) {
            var size = BASE_FONT_SIZE;
            while (size > MIN_FONT_SIZE && !fitsInTwoLinesAtSize(words, size)) {
              size -= 2;
            }
            return size;
          }

          function buildCaptions(groups) {
            var stage = document.getElementById("caption-stage");
            groups.forEach(function (group, groupIndex) {
              var groupEl = document.createElement("div");
              var pillEl = document.createElement("div");
              var copyEl = document.createElement("div");
              var fontSize = fontSizeForGroup(group.words);
              groupEl.id = "caption-group-" + groupIndex;
              groupEl.className = "caption-group";
              pillEl.className = "caption-pill";
              copyEl.className = "caption-copy";
              copyEl.style.fontSize = fontSize + "px";
              var indexedWords = group.words.map(function (word, wordIndex) {
                return { text: word.text, start: word.start, end: word.end, wordIndex: wordIndex };
              });
              var layout = planPillLayout(indexedWords, fontSize);
              pillEl.style.width = layout.pillWidth + "px";
              pillEl.style.paddingLeft = layout.padX + "px";
              pillEl.style.paddingRight = layout.padX + "px";
              layout.lines.slice(0, 2).forEach(function (lineWords) {
                var lineEl = document.createElement("div");
                lineEl.className = "caption-line";
                lineWords.forEach(function (word) {
                  var wordEl = document.createElement("span");
                  wordEl.id = "caption-word-" + groupIndex + "-" + word.wordIndex;
                  wordEl.className = "caption-word";
                  wordEl.textContent = word.text.toLowerCase();
                  lineEl.appendChild(wordEl);
                });
                copyEl.appendChild(lineEl);
              });
              pillEl.appendChild(copyEl);
              groupEl.appendChild(pillEl);
              stage.appendChild(groupEl);
            });
          }

          var WORDS = normalizeWords(TRANSCRIPT);
          var GROUPS = makeGroups(WORDS);
          buildCaptions(GROUPS);

          
          var tl = gsap.timeline({ paused: true });

          GROUPS.forEach(function (group, groupIndex) {
            var groupEl = document.getElementById("caption-group-" + groupIndex);
            var nextGroup = GROUPS[groupIndex + 1];
            var isLastGroup = groupIndex === GROUPS.length - 1;
            var effectiveEnd = isLastGroup
              ? DURATION
              : Math.min(nextGroup.start, group.end + GROUP_END_BUFFER);
            var visibleStart = Math.max(0, group.start);
            var visibleEnd = Math.max(visibleStart + 0.01, effectiveEnd);

            tl.set(groupEl, { opacity: 1 }, visibleStart);
            tl.set(groupEl, { opacity: 0 }, visibleEnd);

            group.words.forEach(function (word, wordIndex) {
              var wordEl = document.getElementById("caption-word-" + groupIndex + "-" + wordIndex);
              var isFirstWord = wordIndex === 0;
              var wordStart = Math.max(visibleStart, word.start - WORD_FADE_LEAD);
              tl.set(wordEl, { color: isFirstWord ? COLOR_ACTIVE : COLOR_INACTIVE }, visibleStart);
              if (isFirstWord) return;
              tl.to(
                wordEl,
                { color: COLOR_ACTIVE, duration: COLOR_FADE_DURATION, ease: "none" },
                wordStart,
              );
            });
          });

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="pill-karaoke"
          data-composition-id="caption-pill-karaoke"
          data-timeline-locked
          data-start="0"
          data-duration="8"
          data-fps="30"
          data-width="1920"
          data-height="1080"
        >
          <div class="caption-layer" aria-hidden="true">
            <div id="caption-stage" class="safe-zone"></div>
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
    font-family: "Poppins", Arial, sans-serif;
  }

  #pill-karaoke {
    pointer-events: none;
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }

  .caption-layer {
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
    transform: translateZ(0);
  }

  .safe-zone {
    position: absolute;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    width: 1600px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .caption-group {
    position: absolute;
    left: 0;
    top: 0;
    width: 1600px;
    height: 220px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
  }

  .caption-pill {
    width: auto;
    max-width: 1600px;
    padding: 18px 60px 20px;
    border-radius: 22px;
    background: #e7e5e7;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    text-align: center;
    overflow: visible;
  }

  .caption-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    color: #a6a6a6;
    font-family: "Poppins", Arial, sans-serif;
    font-size: 72px;
    font-weight: 700;
    line-height: 1.16;
    letter-spacing: 0;
    white-space: nowrap;
    word-break: normal;
    overflow: visible;
  }

  .caption-line {
    display: flex;
    justify-content: center;
    gap: 16px;
    width: 100%;
    max-width: none;
    line-height: 1.16;
    white-space: nowrap;
    overflow: visible;
  }

  .caption-word {
    display: inline-block;
    color: #a6a6a6;
  }
}
</style>
