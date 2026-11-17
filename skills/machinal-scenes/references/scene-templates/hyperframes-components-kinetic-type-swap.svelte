<!-- Modified Svelte adaptation of registry/components/kinetic-type-swap/kinetic-type-swap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  
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
    (function () {
                "use strict";

                var root = document.getElementById("root");
                var stage = root.querySelector(".kts-stage");
                var prefixElement = root.querySelector(".kts-prefix");
                var slotElement = root.querySelector(".kts-slot");
                var suffixElement = root.querySelector(".kts-suffix");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var defaultOptions = ["faster", "smarter", "together"];
                var prefix = vars.prefix == null ? "Ship" : String(vars.prefix).trim();
                var suffix = vars.suffix == null ? "" : String(vars.suffix).trim();
                var rawOptions = vars.options == null ? defaultOptions.join(",") : String(vars.options);
                var options = rawOptions
                  .split(",")
                  .map(function (option) {
                    return option.trim();
                  })
                  .filter(function (option) {
                    return option.length > 0;
                  });
                if (options.length === 0) options = defaultOptions.slice();

                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
                var cuesValue = vars.cues == null ? "" : String(vars.cues);
                var cues = cuesValue
                  .split(",")
                  .reduce(function (result, token) {
                    var trimmed = token.trim();
                    if (trimmed === "") return result;
                    var seconds = Number(trimmed);
                    if (!Number.isFinite(seconds) || seconds < 0) return result;
                    result.push(seconds);
                    return result;
                  }, [])
                  .sort(function (a, b) {
                    return a - b;
                  });

                root.style.setProperty("--kts-accent", accentColors[accent]);
                prefixElement.textContent = prefix;
                suffixElement.textContent = suffix;

                var words = options.map(function (option, index) {
                  var word = document.createElement("span");
                  word.className = "kts-word";
                  word.id = "kinetic-type-swap-word-" + index;
                  word.textContent = option;
                  slotElement.appendChild(word);
                  return word;
                });

                var finalSentence = [prefix, options[options.length - 1], suffix]
                  .filter(function (part) {
                    return part.length > 0;
                  })
                  .join(" ");
                stage.setAttribute("aria-label", finalSentence);

                var widestOptionLength = options.reduce(function (widest, option) {
                  return Math.max(widest, Array.from(option).length);
                }, 1);
                var sentenceLength =
                  Array.from(prefix).length + widestOptionLength + Array.from(suffix).length + 2;
                var fittedCqw = Math.min(12, 122 / Math.max(1, sentenceLength));
                root.style.setProperty(
                  "--kts-font-size",
                  "min(" + fittedCqw.toFixed(3) + "cqw, 22cqh)",
                );

                var IN_BASE = 2.25;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var ARRIVAL_BASE = 0.3;
                var SWAP_START_BASE = 0.48;
                var ROLL_BASE = 0.46;
                var SETTLE_TAIL_BASE = 0.18;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var ARRIVAL = ARRIVAL_BASE * scale;
                var SWAP_START = SWAP_START_BASE * scale;
                var ROLL = ROLL_BASE * scale;
                var SETTLE_TAIL = SETTLE_TAIL_BASE * scale;

                // Swap schedule: cues own the swap moments when provided; the
                // authored even spread otherwise. Swaps beyond the cue list
                // extrapolate at the cue list's own gap, and every swap clamps
                // so its roll and settle finish before any exit.
                var swapCount = words.length - 1;
                var swapTimes = [];
                var rollDuration = ROLL;
                if (swapCount > 0) {
                  if (cues.length > 0) {
                    var lastCue = cues[cues.length - 1];
                    var cueGap =
                      cues.length >= 2 ? Math.max(0.05, (lastCue - cues[0]) / (cues.length - 1)) : ROLL;
                    var latestSwap = Math.max(0, duration - OUT - ROLL - SETTLE_TAIL);
                    for (var cueIndex = 0; cueIndex < swapCount; cueIndex += 1) {
                      var cueAt =
                        cueIndex < cues.length
                          ? cues[cueIndex]
                          : lastCue + (cueIndex - (cues.length - 1)) * cueGap;
                      swapTimes.push(Math.min(latestSwap, Math.max(0, cueAt)));
                    }
                    var minGap = Infinity;
                    for (var gapIndex = 1; gapIndex < swapTimes.length; gapIndex += 1) {
                      minGap = Math.min(minGap, swapTimes[gapIndex] - swapTimes[gapIndex - 1]);
                    }
                    if (Number.isFinite(minGap)) {
                      rollDuration = Math.min(ROLL, Math.max(0.04, minGap * 0.72));
                    }
                  } else {
                    var lastSwapStart = Math.max(SWAP_START, IN - SETTLE_TAIL - ROLL);
                    var swapStep = swapCount === 1 ? 0 : (lastSwapStart - SWAP_START) / (swapCount - 1);
                    rollDuration =
                      swapCount <= 2 ? ROLL : Math.min(ROLL, Math.max(0.04, swapStep * 0.72));
                    for (var index = 1; index <= swapCount; index += 1) {
                      swapTimes.push(
                        swapCount === 1 ? lastSwapStart : SWAP_START + (index - 1) * swapStep,
                      );
                    }
                  }
                }
                var swapsEnd =
                  swapTimes.length > 0
                    ? swapTimes[swapTimes.length - 1] + rollDuration + SETTLE_TAIL
                    : IN;
                var HOLD_START = Math.min(Math.max(0, duration - OUT), Math.max(IN, swapsEnd));
                var HOLD = Math.max(0, duration - (HOLD_START + OUT));
                var OUT_START = HOLD_START + HOLD;

                gsap.set(stage, { opacity: 0 });
                gsap.set(words, { yPercent: 112, opacity: 0 });
                gsap.set(words[0], { yPercent: 0, opacity: 1 });

                var tl = gsap.timeline({ paused: true });
                tl.to(stage, { opacity: 1, duration: ARRIVAL, ease: "power2.out" }, 0);

                // Masked exchange: the outgoing word whips fully past the slot
                // mask (power4.in) before the incoming word crosses center. The
                // two phases overlap only for ~10% of the roll, while both words
                // are opposite-edge slivers, so every frame shows at most one
                // legible word at full ink and never a double exposure.
                swapTimes.forEach(function (swapAt, swapIndex) {
                  var wordIndex = swapIndex + 1;
                  var incomingEase = wordIndex === words.length - 1 ? "back.out(1.7)" : "power4.out";
                  var outDuration = rollDuration * 0.55;
                  var inDuration = rollDuration * 0.55;
                  var inStart = swapAt + rollDuration - inDuration;

                  tl.to(
                    words[wordIndex - 1],
                    { yPercent: -112, duration: outDuration, ease: "power4.in" },
                    swapAt,
                  );
                  tl.set(words[wordIndex - 1], { opacity: 0 }, swapAt + outDuration);
                  tl.set(words[wordIndex], { opacity: 1 }, inStart);
                  tl.to(
                    words[wordIndex],
                    { yPercent: 0, duration: inDuration, ease: incomingEase },
                    inStart,
                  );
                });

                var finalWord = words[words.length - 1];
                var beat = parseFloat(getComputedStyle(root).getPropertyValue("--dur-beat")) || 0.5;
                var pulseHalf = Math.min(beat, HOLD / 2);
                if (pulseHalf > 0) {
                  var maxRepeat = Math.floor(HOLD / pulseHalf) - 1;
                  var pulseRepeat = maxRepeat % 2 === 1 ? maxRepeat : maxRepeat - 1;
                  if (pulseRepeat >= 1) {
                    tl.to(
                      finalWord,
                      {
                        opacity: 0.9,
                        duration: pulseHalf,
                        ease: "sine.inOut",
                        yoyo: true,
                        repeat: pulseRepeat,
                      },
                      HOLD_START,
                    );
                  }
                }

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(stage, { opacity: 0, y: "-3cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "prefix", "type": "string", "role": "content", "label": "Prefix", "description": "Fixed sentence text before the rolling word slot.", "default": "Ship" &#125;,
        &#123; "id": "options", "type": "string", "role": "content", "label": "Options", "description": "Comma-separated words shown in the rolling slot.", "default": "faster,smarter,together" &#125;,
        &#123; "id": "suffix", "type": "string", "role": "content", "label": "Suffix", "description": "Fixed sentence text after the rolling word slot.", "default": "" &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds (from mount start) for each word swap. Empty keeps the authored even spread.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color used by the rolling word slot.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the sentence holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="kinetic-type-swap" data-duration="4" data-fps="30">
            
    
            <div
              id="kinetic-type-swap-clip"
              class="kts-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="kts-stage" role="img">
                <div class="kts-sentence">
                  <span class="kts-prefix"></span>
                  <span class="kts-slot" aria-hidden="true"></span>
                  <span class="kts-suffix"></span>
                </div>
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

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .kts-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .kts-stage {
    display: grid;
    place-items: center;
    width: 94cqw;
    height: 70cqh;
    opacity: 0;
  }

  .kts-sentence {
    display: flex;
    align-items: baseline;
    justify-content: center;
    /* Word gap must scale with the display type, never a host layout
    spacing token: --space-* is chrome-scale and jams the sentence
    ("Makemomentumvisible") when the type is auto-fitted large. */
    gap: 0.26em;
    max-width: 94cqw;
    color: var(--fg, #f8fafc);
    font-size: var(--kts-font-size);
    font-weight: 760;
    line-height: 1.08;
    letter-spacing: -0.045em;
    white-space: nowrap;
  }

  .kts-prefix, .kts-suffix {
    flex: 0 0 auto;
  }

  .kts-prefix:empty, .kts-suffix:empty {
    display: none;
  }

  /* Every word occupies one grid cell and contributes its intrinsic
  width. Transforms do not affect layout, so this masked slot stays
  as wide as the widest option for the entire composition. */
  .kts-slot {
    display: inline-grid;
    flex: 0 0 auto;
    overflow: hidden;
    color: var(--kts-accent);
    text-shadow: 0 0 2.8cqh color-mix(in srgb, var(--kts-accent) 28%, transparent);
    vertical-align: baseline;
  }

  .kts-word {
    grid-area: 1 / 1;
    width: max-content;
    justify-self: center;
    color: var(--kts-accent);
    will-change: transform, opacity;
  }
}
</style>
