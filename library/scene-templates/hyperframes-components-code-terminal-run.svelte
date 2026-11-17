<!-- Modified Svelte adaptation of registry/components/code-terminal-run/code-terminal-run.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".ctr-stage");
                var slot = root.querySelector('[data-slot="content"]');
                var commandElement = slot ? slot.querySelector('[data-terminal="command"]') : null;
                var outputElements = slot
                  ? Array.prototype.slice.call(slot.querySelectorAll('[data-terminal="output"]'))
                  : [];
                var tailElement = root.querySelector(".ctr-tail");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var promptGlyph = vars.prompt_glyph == null ? "$" : String(vars.prompt_glyph);
                var cadence = vars.cadence === "uniform" ? "uniform" : "human";
                var exitMode = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // The runtime mirrors every composition variable as a --<id>
                // custom property (host inline style + a compiled rule), so the
                // accent VARIABLE shadows the --accent contract TOKEN with its
                // enum keyword whenever the caller passes variables. Theme packs
                // re-declare --accent with !important on the same elements and
                // stay clean; only the unthemed mirror leaks through. Detect
                // exactly that leak (the computed token IS an enum keyword) and
                // pin the token's exact contract fallback instead, keeping live
                // var() resolution everywhere else.
                var accentToken = "var(--accent, #61a8ff)";
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentToken = "#61a8ff";
                }
                root.style.setProperty("--ctr-accent-token", accentToken);

                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: accentToken,
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                root.style.setProperty("--ctr-accent", accentColors[accent]);
                // JSON.stringify yields a valid CSS quoted string for content:.
                root.style.setProperty("--ctr-glyph", JSON.stringify(promptGlyph));
                if (promptGlyph === "") root.style.setProperty("--ctr-glyph-gap", "0ch");

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
                var TYPE_START = 0.4;
                var EXEC_BEAT = 0.22;
                var LEAD_BEAT = 0.3;
                var OUT_STEP = 0.3;
                var TAIL_GAP = 0.35;
                var PRINT = 0.12;
                var OUT_BASE = 0.45;
                var STILLNESS = 0.3;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var OUT = exitMode === "none" ? 0 : Math.min(OUT_BASE, duration * 0.2);
                var maxEnd = Math.max(TYPE_START + 0.3, duration - OUT - STILLNESS);

                // Fixed-seed LCG: the only randomness source, consumed in one
                // deterministic order during this synchronous build.
                var lcgState = 0x51ec0ded;
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
                  if (cadence === "uniform") return chunk.length * 0.05;
                  return chunk.length * (0.04 + rnd() * 0.03);
                }

                // Typing preserves the authored coloring spans: characters reveal
                // across the command's text nodes in document order, so a given
                // count always renders the same colored string in either seek
                // direction. The caret is appended last, after node collection,
                // so empty trailing nodes keep it hugging the visible end.
                var textNodes = [];
                if (commandElement) {
                  var walker = document.createTreeWalker(commandElement, NodeFilter.SHOW_TEXT, null);
                  while (walker.nextNode()) {
                    textNodes.push({ node: walker.currentNode, full: walker.currentNode.data });
                  }
                }
                var fullText = textNodes
                  .map(function (entry) {
                    return entry.full;
                  })
                  .join("");
                function showChars(count) {
                  var remaining = count;
                  for (var i = 0; i < textNodes.length; i += 1) {
                    var entry = textNodes[i];
                    var take = Math.min(entry.full.length, Math.max(0, remaining));
                    entry.node.data = entry.full.slice(0, take);
                    remaining -= entry.full.length;
                  }
                }
                var caretElement = null;
                if (commandElement) {
                  caretElement = document.createElement("span");
                  caretElement.className = "ctr-caret";
                  caretElement.setAttribute("aria-hidden", "true");
                  commandElement.appendChild(caretElement);
                }
                stage.setAttribute("aria-label", (promptGlyph + " " + fullText).trim());

                // The complete chars-at-time table. Built exactly once; the
                // timeline only ever reads it (the typed-prompt law).
                var rows = [{ t: 0, n: 0 }];
                (function buildRows() {
                  var t = TYPE_START;
                  var n = 0;
                  fullText.split(/(\s+)/).forEach(function (segment) {
                    if (segment === "") return;
                    if (/^\s+$/.test(segment)) {
                      t += cadence === "uniform" ? 0.11 : 0.1 + rnd() * 0.1;
                      n += segment.length;
                      rows.push({ t: t, n: n });
                      return;
                    }
                    chunksOf(segment).forEach(function (chunk) {
                      t += chunkGap(chunk);
                      n += chunk.length;
                      rows.push({ t: t, n: n });
                    });
                  });
                })();

                // Natural schedule: type, execute beat, one output per step after
                // a leading beat, then the trailing prompt.
                var typeEnd = Math.max(rows[rows.length - 1].t, TYPE_START + 0.01);
                var execAt = typeEnd + EXEC_BEAT;
                var outAts = outputElements.map(function (element, index) {
                  return execAt + LEAD_BEAT + index * OUT_STEP;
                });
                var tailAt = (outAts.length > 0 ? outAts[outAts.length - 1] : execAt) + TAIL_GAP;

                // Compress the whole schedule proportionally only if it would
                // overflow the window before OUT; extra duration becomes HOLD,
                // never timeScale.
                var naturalEnd = tailAt + PRINT;
                if (naturalEnd > maxEnd) {
                  var factor = (maxEnd - TYPE_START) / (naturalEnd - TYPE_START);
                  var squeeze = function (time) {
                    return time <= TYPE_START ? time : TYPE_START + (time - TYPE_START) * factor;
                  };
                  rows.forEach(function (row) {
                    row.t = squeeze(row.t);
                  });
                  typeEnd = Math.max(rows[rows.length - 1].t, TYPE_START + 0.01);
                  execAt = squeeze(execAt);
                  outAts = outAts.map(squeeze);
                  tailAt = squeeze(tailAt);
                }

                // Cue overrides: cue N pins output line N, clamped after execute
                // and inside the window; un-cued lines follow the previous line.
                if (cueList.length > 0) {
                  var previous = execAt + LEAD_BEAT - OUT_STEP;
                  outAts = outAts.map(function (defaultAt, index) {
                    var at = cueList[index] != null ? cueList[index] : previous + OUT_STEP;
                    at = Math.max(execAt + 0.05, Math.min(maxEnd - PRINT, at));
                    at = Math.max(at, previous + 0.05);
                    previous = at;
                    return at;
                  });
                  tailAt = (outAts.length > 0 ? outAts[outAts.length - 1] : execAt) + TAIL_GAP;
                }
                tailAt = Math.max(execAt + 0.1, Math.min(maxEnd - PRINT, tailAt));

                // 1ms tolerance: GSAP snaps a tween's end value below the row
                // table's accumulated float times, far under one frame.
                function charsAt(time) {
                  for (var i = rows.length - 1; i >= 0; i -= 1) {
                    if (time >= rows[i].t - 0.001) return rows[i].n;
                  }
                  return 0;
                }

                // Fit the mono size to the widest line and the line count.
                var lineElements = [commandElement].concat(outputElements, [tailElement]);
                var maxLength = lineElements.reduce(function (best, element) {
                  if (!element) return best;
                  var length = (element === commandElement ? fullText : element.textContent).length;
                  return Math.max(best, length + promptGlyph.length + 3);
                }, 12);
                var fittedCqw = Math.max(2, Math.min(3.2, 108 / maxLength));
                var cappedCqh = Math.max(3.2, Math.min(6.4, 46 / (lineElements.length * 1.6)));
                root.style.setProperty(
                  "--ctr-font-size",
                  "min(" + fittedCqw.toFixed(3) + "cqw, " + cappedCqh.toFixed(3) + "cqh)",
                );

                gsap.set(stage, { opacity: 0, y: "2.6cqh" });
                if (outputElements.length > 0) gsap.set(outputElements, { opacity: 0 });
                if (tailElement) gsap.set(tailElement, { opacity: 0 });
                showChars(0);

                var tl = gsap.timeline({ paused: true });

                // IN: one panel settle, then the table drives every typed frame.
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
                      showChars(charsAt(typeDriver.t));
                    },
                  },
                  0,
                );

                // Caret: integer sine cycles across exactly the typing window,
                // then a pin to solid, then hidden at execute (the command has
                // been submitted; the trailing prompt owns the caret from there).
                if (caretElement) {
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
                  tl.set(caretElement, { opacity: 0 }, execAt);
                }

                // Output lines print on their cues: a print-fast fade, no motion.
                outputElements.forEach(function (element, index) {
                  tl.fromTo(
                    element,
                    { opacity: 0 },
                    { opacity: 1, duration: PRINT, ease: "none" },
                    outAts[index],
                  );
                });

                // The run completes: a fresh prompt with a solid caret appears.
                if (tailElement) {
                  tl.fromTo(
                    tailElement,
                    { opacity: 0 },
                    { opacity: 1, duration: PRINT, ease: "none" },
                    tailAt,
                  );
                }

                // HOLD: barely-there drift ending at exactly zero, then authored
                // stillness before any departure.
                var OUT_START = duration - OUT;
                var settleEnd = tailAt + PRINT;
                var holdSpan = OUT_START - settleEnd;
                if (holdSpan > 0.9) {
                  var driftHalf = (holdSpan - STILLNESS) / 2;
                  tl.to(stage, { y: "-0.45cqh", duration: driftHalf, ease: "sine.inOut" }, settleEnd);
                  tl.to(
                    stage,
                    { y: "0cqh", duration: driftHalf, ease: "sine.inOut" },
                    settleEnd + driftHalf,
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
    <div id="root" data-composition-variables='[
        &#123; "id": "prompt_glyph", "type": "string", "role": "style", "label": "Prompt glyph", "description": "Leading glyph before the command and the trailing prompt. Empty string hides it.", "default": "$" &#125;,
        &#123; "id": "cadence", "type": "enum", "role": "timing", "label": "Cadence", "description": "Keystroke rhythm: uniform fixed steps or seeded human chunks.", "default": "human", "options": [&#123; "value": "uniform", "label": "Uniform" &#125;, &#123; "value": "human", "label": "Human" &#125;] &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds relative to mount start; cue N sets when output line N prints. Empty uses the authored rhythm.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Color of the prompt glyph and caret.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. Frame roots own transitions; none holds the end frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5" data-composition-id="code-terminal-run" data-duration="5" data-fps="30">
            
    
            <div
              id="code-terminal-run-clip"
              class="ctr-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <div class="ctr-stage" role="img">
                <div class="ctr-panel">
                  <div class="ctr-bar" aria-hidden="true">
                    <span class="ctr-dot"></span>
                    <span class="ctr-dot"></span>
                    <span class="ctr-dot"></span>
                  </div>
                  <div class="ctr-body">
                    <div class="ctr-slot" data-slot="content">
                      
                      <div data-terminal="command">
                        run build <span class="ct-path">src/app</span>
                        <span class="ct-flag">--minify</span> <span class="ct-flag">--out</span>
                        <span class="ct-str">"dist/app"</span>
                      </div>
                      <div data-terminal="output">
                        <span class="ct-muted">-</span> resolving 128 modules
                      </div>
                      <div data-terminal="output">
                        <span class="ct-muted">-</span> bundling <span class="ct-path">src/app</span>
                      </div>
                      <div data-terminal="output">
                        <span class="ct-ok">ok</span> 128 modules in 412 ms
                      </div>
                      <div data-terminal="output">
                        <span class="ct-ok">ok</span> wrote <span class="ct-path">dist/app</span>
                        <span class="ct-muted">(96 kB)</span>
                      </div>
                    </div>
                    <div class="ctr-tail" aria-hidden="true"><span class="ctr-caret"></span></div>
                  </div>
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

  .ctr-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .ctr-stage {
    width: 84cqw;
    max-width: 84cqw;
    will-change: transform, opacity;
  }

  .ctr-panel {
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 72%, transparent);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #0b1016) 96%, var(--ctr-accent));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 38%, transparent);
  }

  .ctr-bar {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.2cqw);
    padding: var(--space-1, 1.6cqh) var(--space-2, 2.4cqw);
    border-bottom: 0.14cqmin solid
    color-mix(in srgb, var(--border, #475569) 55%, transparent);
    background: color-mix(in srgb, var(--surface, #0b1016) 88%, var(--bg, #000000));
  }

  .ctr-dot {
    width: 1.5cqmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: color-mix(in srgb, var(--muted, #94a3b8) 52%, transparent);
  }

  .ctr-body {
    padding: var(--space-2, 3cqh) var(--space-2, 3cqw);
    min-height: 40cqh;
  }

  .ctr-slot {
    display: block;
  }

  [data-terminal="command"], [data-terminal="output"], .ctr-tail {
    font-size: var(--ctr-font-size, min(2.6cqw, 5.4cqh));
    font-weight: 500;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  [data-terminal="command"]::before, .ctr-tail::before {
    content: var(--ctr-glyph, "$");
    margin-right: var(--ctr-glyph-gap, 0.9ch);
    color: var(--ctr-accent);
    font-weight: 600;
  }

  /* Authored token coloring: spans in the slot content, no parser.
  Each class routes to one contract token. */
  .ct-str {
    color: var(--brand, #71f5a7);
  }

  .ct-flag {
    color: var(--ctr-accent-token, var(--accent, #61a8ff));
  }

  .ct-path {
    color: var(--accent-2, #c5a3ff);
  }

  .ct-ok {
    color: var(--brand, #71f5a7);
    font-weight: 600;
  }

  .ct-muted {
    color: var(--muted, #94a3b8);
  }

  .ctr-caret {
    display: inline-block;
    width: 0.55ch;
    height: 1.05em;
    margin-left: 0.08ch;
    background: var(--ctr-accent);
    vertical-align: text-bottom;
    will-change: opacity;
  }
}
</style>
