<!-- Modified Svelte adaptation of registry/components/caption-neon-accent/caption-neon-accent.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-neon-accent';
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
          var BASE_FONT_SIZE = 88;
          var ACCENT_FONT_SIZE = 106;
          var MIN_FONT_SIZE = 62;
          var MAX_WORDS_PER_GROUP = 4;
          var WORD_SPACING = 16;
          var PAUSE_THRESHOLD = 0.1;
          var ENTRY_DURATION = 7 / 30;
          var WIGGLE_DISTANCE = 14;
          var WIGGLE_CYCLE = 2 / 1.3;
          var FONT_WIDTH_SAFETY = 1.14;
          var PRIMARY_COLOR = "#FFFFFF";
          var ACCENT_COLORS = ["#53FF01", "#FF0002", "#FCFF00"];
          var TRANSITION_WORDS = new Set([
            "the",
            "a",
            "an",
            "and",
            "or",
            "but",
            "is",
            "are",
            "was",
            "were",
            "to",
            "of",
            "in",
            "on",
            "at",
            "for",
            "with",
            "by",
            "from",
            "as",
            "it",
            "its",
            "this",
            "that",
            "these",
            "those",
            "be",
            "been",
            "have",
            "has",
            "had",
            "do",
            "does",
            "did",
            "will",
            "would",
            "could",
            "should",
            "may",
            "might",
            "must",
            "can",
            "if",
            "then",
            "so",
            "just",
            "not",
            "no",
            "yes",
            "up",
            "out",
            "about",
            "lets",
            "you",
            "write",
            "render",
          ]);
          var KEYWORDS = new Set(["hyperframes", "html", "professional", "code", "cinema"]);

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

          gsap.registerPlugin && gsap.registerPlugin();

          function cleanText(text) {
            return String(text || "").trim();
          }

          function normalizeWords(rawWords) {
            return rawWords
              .map(function (item) {
                return {
                  text: cleanText(item.word || item.text),
                  start: Math.max(0, Number(item.start) || 0),
                  end: Math.min(DURATION, Math.max(Number(item.start) || 0, Number(item.end) || 0)),
                };
              })
              .filter(function (word) {
                return word.text.length > 0;
              });
          }

          var measureCanvas = document.createElement("canvas");
          var measureContext = measureCanvas.getContext("2d");

          function seededRandom(seed) {
            var x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
          }

          function isKeyword(text) {
            return KEYWORDS.has(text.toLowerCase().replace(/[^\p{L}]/gu, ""));
          }

          function assignWordColors(words, groupIndex) {
            return words.map(function (word) {
              if (isKeyword(word.text)) {
                var colorIndex = Math.floor(seededRandom(groupIndex * 23 + 7) * ACCENT_COLORS.length);
                return ACCENT_COLORS[colorIndex];
              }
              var clean = word.text.toLowerCase().replace(/[^\p{L}']/gu, "");
              if (TRANSITION_WORDS.has(clean)) return PRIMARY_COLOR;
              var rand = seededRandom(groupIndex * 7 + words.indexOf(word));
              if (rand > 0.6) {
                var ci = Math.floor(rand * ACCENT_COLORS.length) % ACCENT_COLORS.length;
                return ACCENT_COLORS[ci];
              }
              return PRIMARY_COLOR;
            });
          }

          function measureWord(word, color, fontSize) {
            var size = color === PRIMARY_COLOR ? fontSize : fontSize * 1.2;
            measureContext.font = "800 " + size + "px Montserrat";
            return measureContext.measureText(word.text.toUpperCase()).width * FONT_WIDTH_SAFETY;
          }

          function measureLineWidth(words, colors, fontSize) {
            return words.reduce(function (total, word, index) {
              return (
                total +
                measureWord(word, colors[index] || PRIMARY_COLOR, fontSize) +
                (index ? WORD_SPACING : 0)
              );
            }, 0);
          }

          function splitLinesForGroup(words, colors, fontSize) {
            var maxLineWidth = SAFE_ZONE_WIDTH;
            if (
              words.some(function (word, i) {
                return measureWord(word, colors[i] || PRIMARY_COLOR, fontSize) > maxLineWidth;
              })
            )
              return null;
            if (measureLineWidth(words, colors, fontSize) <= maxLineWidth)
              return [{ words: words, colors: colors }];
            var best = null;
            var bestDiff = Infinity;
            for (var split = 1; split < words.length; split++) {
              var fw = words.slice(0, split),
                sw = words.slice(split);
              var fc = colors.slice(0, split),
                sc = colors.slice(split);
              var fW = measureLineWidth(fw, fc, fontSize);
              var sW = measureLineWidth(sw, sc, fontSize);
              if (fW <= maxLineWidth && sW <= maxLineWidth) {
                var diff = Math.abs(fW - sW);
                if (diff < bestDiff) {
                  best = [
                    { words: fw, colors: fc },
                    { words: sw, colors: sc },
                  ];
                  bestDiff = diff;
                }
              }
            }
            return best;
          }

          function makeGroups(words) {
            var groups = [];
            var current = [];
            words.forEach(function (word, index) {
              var nextWord = words[index + 1];
              var testGroup = current.concat([word]);
              var exceedsWords = testGroup.length > MAX_WORDS_PER_GROUP;
              var colors = assignWordColors(testGroup, groups.length);
              var exceedsFit = !splitLinesForGroup(testGroup, colors, BASE_FONT_SIZE);
              if (exceedsWords || exceedsFit) {
                if (current.length) groups.push(makeGroup(current, groups.length));
                current = [word];
                return;
              }
              current.push(word);
              var punctuation = /[,.:!?]$/.test(word.text);
              var pause = nextWord ? nextWord.start - word.end : 0;
              if (
                !nextWord ||
                punctuation ||
                pause >= PAUSE_THRESHOLD ||
                current.length >= MAX_WORDS_PER_GROUP
              ) {
                groups.push(makeGroup(current, groups.length));
                current = [];
              }
            });
            if (current.length) groups.push(makeGroup(current, groups.length));
            return groups;
          }

          function makeGroup(words, groupIndex) {
            var colors = assignWordColors(words, groupIndex);
            var groupText = words
              .map(function (w) {
                return w.text.toUpperCase();
              })
              .join(" ");
            var fontSize = fitFontSize(groupText, BASE_FONT_SIZE, "800", "Montserrat", SAFE_ZONE_WIDTH);
            while (fontSize > MIN_FONT_SIZE && !splitLinesForGroup(words, colors, fontSize)) {
              fontSize -= 2;
            }
            return {
              words: words.slice(),
              colors: colors,
              fontSize: fontSize,
              lines: splitLinesForGroup(words, colors, fontSize) || [{ words: words, colors: colors }],
              start: words[0].start,
              end: words[words.length - 1].end,
            };
          }

          function shadowForColor(color) {
            var hex = color.replace("#", "");
            var r = parseInt(hex.slice(0, 2), 16);
            var g = parseInt(hex.slice(2, 4), 16);
            var b = parseInt(hex.slice(4, 6), 16);
            var glow =
              "0 0 4px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",1), 0 0 10px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",0.9), 0 0 20px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",0.7), 0 0 40px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",0.4)";
            return "0 8px 16px rgba(0,0,0,0.8), 0 16px 40px rgba(0,0,0,0.6), " + glow;
          }

          function buildCaptions(groups) {
            var stage = document.getElementById("caption-stage");
            groups.forEach(function (group, groupIndex) {
              var groupEl = document.createElement("div");
              var copyEl = document.createElement("div");
              groupEl.id = "caption-group-" + groupIndex;
              groupEl.className = "caption-group";
              copyEl.className = "caption-copy";
              group.lines.slice(0, 2).forEach(function (line) {
                var lineEl = document.createElement("div");
                lineEl.className = "caption-line";
                line.words.forEach(function (word, wordIndex) {
                  var color = line.colors[wordIndex] || PRIMARY_COLOR;
                  var wordEl = document.createElement("span");
                  wordEl.className = color === PRIMARY_COLOR ? "caption-word" : "caption-word accent";
                  wordEl.textContent = word.text.toUpperCase();
                  wordEl.style.color = color;
                  wordEl.style.fontSize =
                    color === PRIMARY_COLOR ? group.fontSize + "px" : group.fontSize * 1.2 + "px";
                  wordEl.style.textShadow = shadowForColor(color);
                  lineEl.appendChild(wordEl);
                });
                copyEl.appendChild(lineEl);
              });
              groupEl.appendChild(copyEl);
              stage.appendChild(groupEl);
            });
          }

          var WORDS = normalizeWords(TRANSCRIPT);
          var GROUPS = makeGroups(WORDS);
          buildCaptions(GROUPS);

          
          var tl = gsap.timeline({ paused: true });

          var visibleStarts = GROUPS.map(function (group, groupIndex) {
            var prev = GROUPS[groupIndex - 1];
            var availableGap = prev ? Math.max(0, group.start - prev.end) : ENTRY_DURATION;
            var entryLead = Math.min(ENTRY_DURATION, availableGap);
            return Math.max(0, group.start - entryLead);
          });

          var allGroupEls = GROUPS.map(function (_, i) {
            return document.getElementById("caption-group-" + i);
          });

          GROUPS.forEach(function (group, groupIndex) {
            var groupEl = allGroupEls[groupIndex];
            var visibleStart = visibleStarts[groupIndex];
            var visibleEnd = groupIndex < GROUPS.length - 1 ? visibleStarts[groupIndex + 1] : DURATION;
            var direction = groupIndex % 2 === 0 ? -1 : 1;
            var D = WIGGLE_DISTANCE * direction;
            var wiggleCycles = Math.max(1, Math.ceil((visibleEnd - visibleStart) / WIGGLE_CYCLE));

            allGroupEls.forEach(function (otherEl, otherIndex) {
              if (otherIndex !== groupIndex) tl.set(otherEl, { opacity: 0 }, visibleStart);
            });

            tl.set(groupEl, { opacity: 0, scale: 0.65, x: 0, y: 0 }, visibleStart);
            tl.to(
              groupEl,
              { opacity: 1, scale: 1, duration: ENTRY_DURATION, ease: "power3.out", force3D: true },
              visibleStart,
            );
            tl.to(
              groupEl,
              {
                x: D,
                y: D,
                duration: WIGGLE_CYCLE / 2,
                ease: "sine.inOut",
                yoyo: true,
                repeat: Math.max(0, wiggleCycles * 2 - 1),
                force3D: true,
              },
              visibleStart,
            );
            tl.set(groupEl, { opacity: 0 }, visibleEnd);
          });

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="neon-accent"
          data-composition-id="caption-neon-accent"
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
    font-family: "Montserrat", Arial, sans-serif;
  }

  #neon-accent {
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
    width: 1400px;
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .caption-group {
    position: absolute;
    left: 0;
    top: 0;
    width: 1400px;
    height: 260px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform-origin: 50% 50%;
    will-change: transform;
    backface-visibility: hidden;
  }

  .caption-copy {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    max-width: 1400px;
    text-align: center;
  }

  .caption-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    width: max-content;
    max-width: 1400px;
    line-height: 1.1;
    white-space: nowrap;
  }

  .caption-word {
    display: inline-block;
    color: #ffffff;
    font-family: "Montserrat", Arial, sans-serif;
    font-weight: 800;
    font-size: 88px;
    line-height: 1.1;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .caption-word.accent {
    font-size: 106px;
  }
}
</style>
