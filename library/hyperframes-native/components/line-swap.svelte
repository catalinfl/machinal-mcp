<!-- Modified Svelte adaptation of registry/components/line-swap/line-swap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal key: the flattening step strips data-composition-id off
                // the mounted root, so reading it back would register "null".
                var compositionId = "line-swap";
                var stage = root.querySelector(".ls-stage");
                var lineAEl = root.querySelector(".ls-line-a");
                var lineBEl = root.querySelector(".ls-line-b");
                var lineAInner = lineAEl.querySelector(".ls-line-inner");
                var lineBInner = lineBEl.querySelector(".ls-line-inner");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function asLine(value, fallback) {
                  return value == null ? fallback : String(value).trim().replace(/\s+/g, " ");
                }
                var lineA = asLine(vars.line_a, "Everyone promised you AI.");
                var lineB = asLine(vars.line_b, "Almost nobody promised you control.");
                var underlineWord = asLine(vars.underline_word, "control");
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                lineAInner.textContent = lineA;

                // Split line_b around the first case-insensitive underline match.
                // textContent nodes only, never innerHTML.
                var matchIndex =
                  underlineWord.length > 0
                    ? lineB.toLowerCase().indexOf(underlineWord.toLowerCase())
                    : -1;
                var underlineEl = null;
                if (matchIndex >= 0) {
                  var before = lineB.slice(0, matchIndex);
                  var matched = lineB.slice(matchIndex, matchIndex + underlineWord.length);
                  var after = lineB.slice(matchIndex + underlineWord.length);
                  if (before) lineBInner.appendChild(document.createTextNode(before));

                  var wrap = document.createElement("span");
                  wrap.className = "ls-ul-wrap";
                  wrap.appendChild(document.createTextNode(matched));
                  underlineEl = document.createElement("span");
                  underlineEl.className = "ls-underline";
                  underlineEl.setAttribute("aria-hidden", "true");
                  // style.background, not a class: var() resolves at point of use.
                  underlineEl.style.background = accentColors[accent];
                  wrap.appendChild(underlineEl);
                  lineBInner.appendChild(wrap);
                  if (after) lineBInner.appendChild(document.createTextNode(after));
                } else {
                  lineBInner.textContent = lineB;
                }
                stage.setAttribute("aria-label", lineA + " " + lineB);

                // Deterministic character-count fit against the longer line; both
                // lines are nowrap, so the fit keeps them inside the stage.
                var characters = Math.max(1, Array.from(lineA).length, Array.from(lineB).length);
                var fitted = Math.max(3.4, Math.min(9, 168 / characters));
                root.style.setProperty("--ls-font-size", "min(" + fitted.toFixed(3) + "cqw, 16cqh)");

                // RETIME RANGE: fixed phases; HOLD is the only elastic span.
                var IN_A_BASE = 0.5;
                var EXIT_A_BASE = 0.35;
                var LAG_BASE = 0.22; // line_b starts this long after the beat
                var IN_B_BASE = 0.5;
                var UL_BEAT_BASE = 0.15;
                var UL_BASE = underlineEl ? 0.45 : 0;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var swapSpanBase = LAG_BASE + IN_B_BASE;
                var ulSpanBase = underlineEl ? UL_BEAT_BASE + UL_BASE : 0;
                var totalBase = IN_A_BASE + swapSpanBase + ulSpanBase + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN_A = IN_A_BASE * scale;
                var EXIT_A = EXIT_A_BASE * scale;
                var LAG = LAG_BASE * scale;
                var IN_B = IN_B_BASE * scale;
                var UL_BEAT = UL_BEAT_BASE * scale;
                var UL = UL_BASE * scale;
                var OUT = OUT_BASE * scale;
                var OUT_START = duration - OUT;

                var swapAtRaw = Number(vars.swap_at);
                var swapAt = Number.isFinite(swapAtRaw) ? Math.max(0, swapAtRaw) : 1.5;
                // line_a fully arrives before the beat; the swap and the
                // underline always complete before the exit begins.
                swapAt = Math.min(swapAt, Math.max(IN_A, OUT_START - (LAG + IN_B + UL_BEAT + UL)));
                swapAt = Math.max(swapAt, IN_A);
                var landB = swapAt + LAG + IN_B;

                gsap.set(lineBEl, { yPercent: 115 });
                if (underlineEl) gsap.set(underlineEl, { scaleX: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN: line_a enters bottom-up through the mask. One move.
                tl.fromTo(
                  lineAEl,
                  { yPercent: 115 },
                  { yPercent: 0, duration: IN_A, ease: "power4.out" },
                  0,
                );

                // SWAP: the beat replacement. line_a exits up through the mask as
                // line_b slides in bottom-up. Single restrained slam, smooth ease.
                tl.fromTo(
                  lineAEl,
                  { yPercent: 0 },
                  { yPercent: -115, duration: EXIT_A, ease: "power2.in", immediateRender: false },
                  swapAt,
                );
                tl.fromTo(
                  lineBEl,
                  { yPercent: 115 },
                  { yPercent: 0, duration: IN_B, ease: "power4.out" },
                  swapAt + LAG,
                );

                // UNDERLINE: accent bar draws left to right after line_b lands.
                if (underlineEl) {
                  tl.fromTo(
                    underlineEl,
                    { scaleX: 0 },
                    { scaleX: 1, duration: UL, ease: "power2.out" },
                    landB + UL_BEAT,
                  );
                }

                // HOLD: completely still.

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(stage, { opacity: 0, y: "-7cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "line_a", "type": "string", "role": "content", "label": "Line A", "description": "First line; holds center inside the mask, then exits up on the swap beat.", "default": "Everyone promised you AI." &#125;,
        &#123; "id": "line_b", "type": "string", "role": "content", "label": "Line B", "description": "Replacement line; enters bottom-up on the swap beat and holds.", "default": "Almost nobody promised you control." &#125;,
        &#123; "id": "swap_at", "type": "number", "role": "timing", "label": "Swap at", "description": "Second (from mount start) of the beat replacement. Clamped so the swap and underline complete before any exit.", "default": 1.5, "min": 0, "step": 0.1, "unit": "s" &#125;,
        &#123; "id": "underline_word", "type": "string", "role": "content", "label": "Underline word", "description": "First case-insensitive substring match in line B gets the accent underline after landing. Empty disables it.", "default": "control" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Underline color from the contract token map.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the landed line holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="line-swap" data-duration="3.5" data-fps="30">
            
    
            <div
              id="line-swap-clip"
              class="ls-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="ls-stage" role="img">
                <div class="ls-mask">
                  <div class="ls-line ls-line-a"><span class="ls-line-inner"></span></div>
                  <div class="ls-line ls-line-b"><span class="ls-line-inner"></span></div>
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
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .ls-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .ls-stage {
    width: 94cqw;
    will-change: transform, opacity;
  }

  /* Beat mask: both lines live inside; the swap slides through it. */
  .ls-mask {
    position: relative;
    width: 100%;
    height: calc(var(--ls-font-size, min(7cqw, 16cqh)) * 1.42);
    overflow: hidden;
  }

  .ls-line {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--ls-font-size, min(7cqw, 16cqh));
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.02em;
    white-space: nowrap;
    will-change: transform;
  }

  /* One inline wrapper per line: a bare text node next to the
  underline span would become separate flex items and the boundary
  space would collapse ("youcontrol."). */
  .ls-line-inner {
    display: inline;
  }

  .ls-ul-wrap {
    position: relative;
    display: inline-block;
    white-space: nowrap;
  }

  .ls-underline {
    position: absolute;
    left: 0.02em;
    right: 0.02em;
    bottom: -0.14em;
    height: 0.055em;
    border-radius: 0.03em;
    transform-origin: left center;
  }
}
</style>
