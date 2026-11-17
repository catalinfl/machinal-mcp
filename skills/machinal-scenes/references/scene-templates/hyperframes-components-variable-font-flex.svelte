<!-- Modified Svelte adaptation of registry/components/variable-font-flex/variable-font-flex.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-variable-font-flex';
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
                var stage = root.querySelector(".vff-stage");
                var word = root.querySelector(".vff-word");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var text = vars.text == null || vars.text === "" ? "FLEX" : String(vars.text);
                var axis = vars.axis === "weight" || vars.axis === "width" ? vars.axis : "both";
                var staggerRaw = parseFloat(vars.stagger);
                var stagger = isFinite(staggerRaw) ? Math.min(0.25, Math.max(0, staggerRaw)) : 0.06;
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #52525b)",
                  blue: "var(--accent, #52525b)",
                  violet: "var(--accent-2, #52525b)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--vff-accent", accentColors[accent]);
                stage.setAttribute("aria-label", text);

                // Axis endpoints. Non-animated axes hold a fixed value so the
                // composed string is always complete and orderable.
                var WGHT_FROM = axis === "width" ? 620 : 120;
                var WGHT_TO = axis === "width" ? 620 : 840;
                var WDTH_FROM = axis === "weight" ? 100 : 40;
                var WDTH_TO = axis === "weight" ? 100 : 128;
                // Optical compensation strength per mode: how much of the mass
                // gain the font-size gives back so the box barely grows.
                var COMP = axis === "both" ? 0.16 : axis === "width" ? 0.12 : 0.08;

                // Build one span per character; spaces stay in flow (white-space:
                // pre) but never animate.
                var characters = Array.from(text);
                var hostDoc = root.ownerDocument;
                var chars = [];
                var fragment = hostDoc.createDocumentFragment();
                for (var i = 0; i < characters.length; i += 1) {
                  var span = hostDoc.createElement("span");
                  span.className = "vff-char";
                  span.textContent = characters[i];
                  fragment.appendChild(span);
                  if (!/\s/.test(characters[i])) chars.push({ el: span, index: i });
                }
                word.appendChild(fragment);

                // Fit for the FINAL (wide, black) state; compensation only ever
                // shrinks below this. cqw base capped by cqh so short words on
                // wide hosts stay inside the frame.
                var fitted = Math.min(21, 118 / Math.max(3, characters.length));
                var BASE_SIZE = "min(" + fitted.toFixed(3) + "cqw, 30cqh)";
                root.style.setProperty("--vff-size", BASE_SIZE);
                word.style.fontSize = "var(--vff-size)";

                // Envelope: fixed IN/OUT, elastic HOLD, never time-scaled.
                var LEAD = 0.12;
                var FLEX = 1.15;
                var MARGIN = 0.15;
                var IN_BASE = LEAD + Math.max(0, chars.length - 1) * stagger + FLEX + MARGIN;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var lead = LEAD * scale;
                var flex = FLEX * scale;
                var staggerEff = stagger * scale;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }
                // Carve ease: overshoots ~6% past the target, then settles. The
                // painter clamps composed axis values to the font's real ranges.
                function carve(u) {
                  var c1 = 0.9;
                  var c3 = c1 + 1;
                  var x = u - 1;
                  return 1 + c3 * x * x * x + c1 * x * x;
                }
                function clampAxis(v, lo, hi) {
                  return v < lo ? lo : v > hi ? hi : v;
                }

                // Pure per-update painter: every character's axis NUMBERS are a
                // function of tl.time() alone; the font-variation-settings
                // string is composed from those numbers (the number proxy; the
                // string itself is never tweened). The word-level font-size
                // eases inversely to the mean settled progress: optical
                // compensation, mass grows while the box holds.
                function applyTime(timeSeconds) {
                  var settledSum = 0;
                  for (var c = 0; c < chars.length; c += 1) {
                    var start = lead + c * staggerEff;
                    var u = clamp01(flex > 0 ? (timeSeconds - start) / flex : 1);
                    var e = u <= 0 ? 0 : u >= 1 ? 1 : carve(u);
                    var settled = e > 1 ? 1 : e;
                    settledSum += settled;
                    var wght = clampAxis(WGHT_FROM + (WGHT_TO - WGHT_FROM) * e, 100, 1000);
                    var wdth = clampAxis(WDTH_FROM + (WDTH_TO - WDTH_FROM) * e, 25, 151);
                    var el = chars[c].el;
                    el.style.fontVariationSettings =
                      '"wght" ' + wght.toFixed(1) + ', "wdth" ' + wdth.toFixed(2);
                    var oIn = clamp01(flex > 0 ? (timeSeconds - start) / (flex * 0.22) : 1);
                    el.style.opacity = (oIn * oIn * (3 - 2 * oIn)).toFixed(4);
                    el.style.top = ((1 - settled) * 0.14).toFixed(4) + "em";
                  }
                  var mean = chars.length > 0 ? settledSum / chars.length : 1;
                  word.style.fontSize = "calc(var(--vff-size) * " + (1 - COMP * mean).toFixed(4) + ")";
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    applyTime(tl.time());
                  },
                });

                // Anchor tween: an inert plain-object tween spanning [0, D] so
                // onUpdate fires for every eventful seek and holds never clamp.
                tl.to({ p: 0 }, { p: 1, duration: duration, ease: "none" }, 0);

                // HOLD: truly still; repeated repaints write identical values.

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                applyTime(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "The word whose variable-font axes flex.", "default": "FLEX" &#125;,
        &#123; "id": "axis", "type": "enum", "role": "style", "label": "Axis", "description": "Which variable-font axes animate: weight, width, or both.", "default": "both", "options": [&#123; "value": "weight", "label": "Weight" &#125;, &#123; "value": "width", "label": "Width" &#125;, &#123; "value": "both", "label": "Both" &#125;] &#125;,
        &#123; "id": "stagger", "type": "number", "role": "timing", "label": "Stagger", "description": "Seconds between per-character flex starts, clamped 0 to 0.25.", "default": 0.06 &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Word color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the carved word holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="variable-font-flex" data-duration="3.5" data-fps="30">
            
    
            <div
              id="variable-font-flex-clip"
              class="vff-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="vff-stage" role="img">
                <div class="vff-word" aria-hidden="true"></div>
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
  /* Pinned variable font: Fontsource build of Roboto Flex, latin
  standard subset, wght 100..1000 + wdth 25%..151% in one file.
  @fontsource-variable/roboto-flex@5.2.8 on jsdelivr. */


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
    font-family: "Roboto Flex Variable", system-ui, sans-serif;
    pointer-events: none;
  }

  .vff-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .vff-stage {
    display: block;
    max-width: 94cqw;
    will-change: transform, opacity;
  }

  .vff-word {
    display: flex;
    align-items: baseline;
    justify-content: center;
    color: var(--vff-accent);
    line-height: 1;
    white-space: pre;
  }

  .vff-char {
    position: relative;
    display: inline-block;
    white-space: pre;
    /* No will-change and no transform on chars: per-char compositor
    layer promotion makes glyph antialiasing depend on seek
    history (paint-level nondeterminism); the rise rides
    relative top instead. */
  }
}
</style>
