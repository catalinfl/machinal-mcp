<!-- Modified Svelte adaptation of registry/components/typed-prompt/typed-prompt.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".tp-stage");
                var glyphElement = root.querySelector(".tp-glyph");
                var textElement = root.querySelector(".tp-text");
                var caretElement = root.querySelector(".tp-caret");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null ? "Generate a product launch video" : String(vars.text);
                var promptGlyph = vars.prompt_glyph == null ? ">" : String(vars.prompt_glyph);
                var cadence = vars.cadence === "uniform" ? "uniform" : "human";
                var caretMode = vars.caret === "solid" ? "solid" : "blink";
                var correction = vars.correction == null ? "" : String(vars.correction).trim();
                var exitMode = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                root.style.setProperty("--tp-accent", accentColors[accent]);
                glyphElement.textContent = promptGlyph;
                if (promptGlyph === "") glyphElement.style.display = "none";
                stage.setAttribute("aria-label", text);

                var cueList = String(vars.cues == null ? "" : vars.cues)
                  .split(",")
                  .map(function (token) {
                    return parseFloat(token);
                  })
                  .filter(function (value) {
                    return isFinite(value) && value >= 0;
                  })
                  .sort(function (a, b) {
                    return a - b;
                  });

                var ENTER = 0.5;
                var TYPE_START = 0.35;
                var OUT_BASE = 0.45;
                var STILLNESS = 0.3;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var OUT = exitMode === "none" ? 0 : Math.min(OUT_BASE, duration * 0.2);

                // Fixed-seed LCG: the only randomness source, consumed in one
                // deterministic order during this synchronous build.
                var lcgState = 0x7f4a7c15;
                function rnd() {
                  lcgState = (Math.imul(1664525, lcgState) + 1013904223) >>> 0;
                  return lcgState / 4294967296;
                }
                function chunksOf(word) {
                  if (cadence === "uniform") return Array.from(word);
                  var out = [];
                  var i = 0;
                  while (i < word.length) {
                    var n = 1 + Math.floor(rnd() * 3);
                    out.push(word.slice(i, i + n));
                    i += n;
                  }
                  return out;
                }
                function chunkGap(chunk) {
                  if (cadence === "uniform") return chunk.length * 0.055;
                  return chunk.length * (0.05 + rnd() * 0.04);
                }

                // The complete text-at-time table. Built exactly once; the
                // timeline only ever reads it, so seeks in any direction resolve
                // the same string for the same time.
                var rows = [{ t: 0, x: "" }];
                var words = text.split(/\s+/).filter(function (word) {
                  return word.length > 0;
                });
                var hasCorrection = correction !== "" && words.length > 0;
                (function buildRows() {
                  var t = TYPE_START;
                  var acc = "";
                  words.forEach(function (word, wordIndex) {
                    var isLast = wordIndex === words.length - 1;
                    var typedWord = hasCorrection && isLast ? correction : word;
                    if (wordIndex > 0) acc += " ";
                    if (cueList[wordIndex] != null) {
                      t = Math.max(t, cueList[wordIndex]);
                    } else if (wordIndex > 0) {
                      t += cadence === "uniform" ? 0.11 : 0.1 + rnd() * 0.1;
                    }
                    chunksOf(typedWord).forEach(function (chunk) {
                      t += chunkGap(chunk);
                      acc += chunk;
                      rows.push({ t: t, x: acc });
                    });
                    if (hasCorrection && isLast) {
                      t += 0.4; // the beat of realizing the typo
                      for (var back = 1; back <= correction.length; back += 1) {
                        t += 0.055;
                        rows.push({ t: t, x: acc.slice(0, acc.length - back) });
                      }
                      acc = acc.slice(0, acc.length - correction.length);
                      t += 0.22;
                      chunksOf(word).forEach(function (chunk) {
                        t += chunkGap(chunk);
                        acc += chunk;
                        rows.push({ t: t, x: acc });
                      });
                    }
                  });
                })();

                // Compress typing proportionally only if it would overflow the
                // window before OUT; extra duration becomes HOLD, never timeScale.
                var naturalEnd = rows[rows.length - 1].t;
                var maxEnd = Math.max(TYPE_START + 0.2, duration - OUT - STILLNESS);
                if (naturalEnd > maxEnd) {
                  var factor = (maxEnd - TYPE_START) / (naturalEnd - TYPE_START);
                  rows.forEach(function (row) {
                    if (row.t > TYPE_START) row.t = TYPE_START + (row.t - TYPE_START) * factor;
                  });
                }
                var typeEnd = Math.max(rows[rows.length - 1].t, TYPE_START + 0.01);

                // 1ms tolerance: GSAP snaps a tween's end value below the row
                // table's accumulated float times, and 1ms is far under one frame.
                function textAt(time) {
                  for (var i = rows.length - 1; i >= 0; i -= 1) {
                    if (time >= rows[i].t - 0.001) return rows[i].x;
                  }
                  return "";
                }

                // +2: leave room for the trailing caret so it never wraps alone.
                var maxLength =
                  rows.reduce(function (best, row) {
                    return Math.max(best, row.x.length);
                  }, 1) + 2;
                var fittedCqw = Math.max(2.2, Math.min(4.2, 118 / maxLength));
                root.style.setProperty("--tp-font-size", "min(" + fittedCqw.toFixed(3) + "cqw, 9cqh)");

                gsap.set(stage, { opacity: 0, y: "2.6cqh" });
                textElement.textContent = "";

                var tl = gsap.timeline({ paused: true });

                // IN: one panel settle, then the table drives every visible frame.
                tl.to(stage, { opacity: 1, duration: ENTER, ease: "power2.out" }, 0);
                tl.to(stage, { y: "0cqh", duration: ENTER, ease: "power3.out" }, 0);

                var typeDriver = { t: 0 };
                tl.to(
                  typeDriver,
                  {
                    t: typeEnd,
                    duration: typeEnd,
                    ease: "none",
                    onUpdate: function () {
                      textElement.textContent = textAt(typeDriver.t);
                    },
                  },
                  0,
                );

                // Caret: integer sine cycles across exactly the typing window,
                // then a single pin to solid. Solid mode never blinks.
                if (caretMode === "blink") {
                  var cycles = Math.max(1, Math.round(typeEnd / 0.9));
                  var blink = { p: 0 };
                  tl.to(
                    blink,
                    {
                      p: Math.PI * 2 * cycles,
                      duration: typeEnd,
                      ease: "none",
                      onUpdate: function () {
                        // >= 0 keeps phase 0 identical to the caret's unrendered
                        // initial state (opacity 1) for forward vs backward seeks.
                        caretElement.style.opacity = Math.sin(blink.p) >= 0 ? "1" : "0";
                      },
                    },
                    0,
                  );
                  tl.set(caretElement, { opacity: 1 }, typeEnd);
                }

                // HOLD: barely-there drift ending at exactly zero, then authored
                // stillness before any departure.
                var OUT_START = duration - OUT;
                var holdSpan = OUT_START - typeEnd;
                if (holdSpan > 0.9) {
                  var driftHalf = (holdSpan - STILLNESS) / 2;
                  tl.to(stage, { y: "-0.45cqh", duration: driftHalf, ease: "sine.inOut" }, typeEnd);
                  tl.to(
                    stage,
                    { y: "0cqh", duration: driftHalf, ease: "sine.inOut" },
                    typeEnd + driftHalf,
                  );
                }

                // OUT: only when the exit variable asks for one.
                if (exitMode !== "none") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exitMode === "up") {
                    tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  }
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-id="typed-prompt" data-duration="4" data-fps="30">
            
    
            <div
              id="typed-prompt-clip"
              class="tp-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="tp-stage" role="img">
                <div class="tp-shell">
                  <span class="tp-glyph" aria-hidden="true"></span>
                  <span class="tp-line" aria-hidden="true"
                    ><span class="tp-text"></span><span class="tp-caret"></span
                  ></span>
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
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    pointer-events: none;
  }

  .tp-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .tp-stage {
    width: 82cqw;
    max-width: 82cqw;
    will-change: transform, opacity;
  }

  .tp-shell {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1, 1.6cqw);
    min-height: 18cqh;
    padding: var(--space-2, 3.4cqh) var(--space-2, 3cqw);
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 72%, transparent);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #0b1016) 94%, var(--tp-accent));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 38%, transparent);
  }

  .tp-glyph {
    flex: 0 0 auto;
    color: var(--tp-accent);
    font-size: var(--tp-font-size);
    font-weight: 600;
    line-height: 1.45;
  }

  .tp-line {
    flex: 1 1 auto;
    min-width: 0;
    color: var(--fg, #f8fafc);
    font-size: var(--tp-font-size);
    font-weight: 500;
    line-height: 1.45;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .tp-caret {
    display: inline-block;
    width: 0.55ch;
    height: 1.05em;
    margin-left: 0.08ch;
    background: var(--tp-accent);
    vertical-align: text-bottom;
    will-change: opacity;
  }
}
</style>
