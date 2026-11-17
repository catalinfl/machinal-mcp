<!-- Modified Svelte adaptation of registry/components/caption-emoji-pop/caption-emoji-pop.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-caption-emoji-pop';
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
          var CAPTION_FONT_SIZE = 72;
          var MAX_WORDS_PER_GROUP = 3;
          var WORD_SPACING = 14;
          var PAUSE_THRESHOLD = 0.1;
          var ENTRY_FRAMES = 4;
          var EXIT_FRAMES = 3;
          var FPS = 30;
          var ENTRY_DURATION = ENTRY_FRAMES / FPS;
          var EXIT_DURATION = EXIT_FRAMES / FPS;
          var FONT_WIDTH_SAFETY = 1.14;
          var PRIMARY_COLOR = "#FFFFFF";
          var ACCENT_COLORS = ["#FF76FF", "#FF0002", "#B2F7FF"];
          var KEYWORDS = new Set(["hyperframes", "html", "professional", "code", "cinema"]);
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
          ]);

          // Emoji map for key words
          var WORD_EMOJI = {
            hyperframes: "🎬",
            html: "💻",
            professional: "✨",
            code: "⌨️",
            cinema: "🎥",
            video: "📹",
            frame: "🖼️",
          };

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
                var clean = text.toLowerCase().replace(/[^\p{L}]/gu, "");
                return {
                  text: text,
                  start: Math.max(0, Number(item.start) || 0),
                  end: Math.min(DURATION, Math.max(Number(item.start) || 0, Number(item.end) || 0)),
                  emoji: WORD_EMOJI[clean] || null,
                };
              })
              .filter(function (word) {
                return word.text.length > 0;
              });
          }

          function seededRandom(seed) {
            var x = Math.sin(seed * 9999) * 10000;
            return x - Math.floor(x);
          }

          function assignWordColors(words, groupIndex) {
            return words.map(function (word, index) {
              var clean = word.text.toLowerCase().replace(/[^\p{L}]/gu, "");
              if (KEYWORDS.has(clean)) {
                var ci = Math.floor(seededRandom(groupIndex * 23 + index * 31) * ACCENT_COLORS.length);
                return ACCENT_COLORS[ci];
              }
              if (TRANSITION_WORDS.has(clean)) return PRIMARY_COLOR;
              var rand = seededRandom(groupIndex * 13 + index);
              if (rand > 0.55) {
                var ci2 = Math.floor(rand * ACCENT_COLORS.length) % ACCENT_COLORS.length;
                return ACCENT_COLORS[ci2];
              }
              return PRIMARY_COLOR;
            });
          }

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

          var measureCanvas = document.createElement("canvas");
          var measureContext = measureCanvas.getContext("2d");

          function measureWord(word, fontSize) {
            measureContext.font = "900 " + fontSize + "px Gabarito";
            return measureContext.measureText(word.text.toUpperCase()).width * FONT_WIDTH_SAFETY;
          }

          function measureLineWidth(words, fontSize) {
            return words.reduce(function (total, word, index) {
              return total + measureWord(word, fontSize) + (index ? WORD_SPACING : 0);
            }, 0);
          }

          function fitsLine(words) {
            return measureLineWidth(words, CAPTION_FONT_SIZE) <= SAFE_ZONE_WIDTH;
          }

          function makeGroups(words) {
            var groups = [];
            var current = [];
            words.forEach(function (word, index) {
              var nextWord = words[index + 1];
              var testGroup = current.concat([word]);
              if (testGroup.length > MAX_WORDS_PER_GROUP || !fitsLine(testGroup)) {
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
            var emoji = null;
            for (var i = 0; i < words.length; i++) {
              if (words[i].emoji) {
                emoji = words[i].emoji;
                break;
              }
            }
            return {
              words: words.slice(),
              colors: colors,
              emoji: emoji,
              start: words[0].start,
              end: words[words.length - 1].end,
            };
          }

          function shadowForColor(color) {
            var hex = color.replace("#", "");
            var r = parseInt(hex.slice(0, 2), 16);
            var g = parseInt(hex.slice(2, 4), 16);
            var b = parseInt(hex.slice(4, 6), 16);
            return (
              "0 4px 8px rgba(0,0,0,0.7), 0 0 2px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",1), 0 0 8px rgba(" +
              r +
              "," +
              g +
              "," +
              b +
              ",0.6)"
            );
          }

          function buildCaptions(groups) {
            var stage = document.getElementById("caption-stage");
            groups.forEach(function (group, groupIndex) {
              var groupText = group.words
                .map(function (w) {
                  return w.text.toUpperCase();
                })
                .join(" ");
              var computedSize = fitFontSize(
                groupText,
                CAPTION_FONT_SIZE,
                "900",
                "Gabarito",
                SAFE_ZONE_WIDTH,
              );
              var groupEl = document.createElement("div");
              groupEl.id = "caption-group-" + groupIndex;
              groupEl.className = "caption-group";

              if (group.emoji) {
                var emojiEl = document.createElement("div");
                emojiEl.className = "caption-emoji";
                emojiEl.textContent = group.emoji;
                groupEl.appendChild(emojiEl);
              }

              var lineEl = document.createElement("div");
              lineEl.className = "caption-line";
              group.words.forEach(function (word, wordIndex) {
                var color = group.colors[wordIndex] || PRIMARY_COLOR;
                var wordEl = document.createElement("span");
                wordEl.className = "caption-word";
                wordEl.textContent = word.text.toUpperCase();
                wordEl.style.color = color;
                wordEl.style.fontSize = computedSize + "px";
                wordEl.style.textShadow = shadowForColor(color);
                lineEl.appendChild(wordEl);
              });

              groupEl.appendChild(lineEl);
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
            var exitStart = Math.max(visibleStart, visibleEnd - EXIT_DURATION);

            allGroupEls.forEach(function (otherEl, otherIndex) {
              if (otherIndex !== groupIndex) tl.set(otherEl, { opacity: 0 }, visibleStart);
            });

            tl.set(groupEl, { opacity: 0, scaleX: 0.8, scaleY: 1 }, visibleStart);
            tl.to(
              groupEl,
              { opacity: 1, scaleX: 1, duration: ENTRY_DURATION, ease: "power3.out", force3D: true },
              visibleStart,
            );
            tl.to(
              groupEl,
              { scaleX: 0.75, opacity: 0.8, duration: EXIT_DURATION, ease: "power2.in", force3D: true },
              exitStart,
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
          id="emoji-pop"
          data-composition-id="caption-emoji-pop"
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
    font-family: "Gabarito", Arial, sans-serif;
  }

  #emoji-pop {
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
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 1400px;
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .caption-group {
    position: absolute;
    left: 0;
    top: 0;
    width: 1400px;
    height: 280px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transform-origin: 50% 50%;
    will-change: transform;
    backface-visibility: hidden;
  }

  .caption-emoji {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, calc(-50% - 70px));
    font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    font-size: 56px;
    line-height: 1;
    text-align: center;
  }

  .caption-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: max-content;
    max-width: 1400px;
    line-height: 1.1;
    white-space: nowrap;
  }

  .caption-word {
    display: inline-block;
    color: #ffffff;
    font-family: "Gabarito", Arial, sans-serif;
    font-weight: 900;
    font-size: 72px;
    line-height: 1.1;
    letter-spacing: -0.03em;
    text-transform: uppercase;
    -webkit-text-stroke: 3px #000000;
    paint-order: stroke fill;
  }
}
</style>
