<!-- Modified Svelte adaptation of registry/components/trust-strip/trust-strip.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var strip = root.querySelector(".ts-strip");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var marks = String(vars.marks == null ? "" : vars.marks)
                  .split(",")
                  .map(function (mark) {
                    return mark.trim();
                  })
                  .filter(Boolean);
                if (marks.length === 0)
                  marks = ["Northwind", "Acme Corp", "Globex", "Initech", "Umbra"];

                var tone = vars.tone === "ink" ? "ink" : "muted";
                var toneColors = {
                  muted: "var(--muted, #93939f)",
                  ink: "var(--fg, #f8fafc)",
                };
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
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--ts-tone", toneColors[tone]);
                root.style.setProperty("--ts-accent", accentColors[accent]);
                strip.setAttribute("aria-label", marks.join(", "));

                var spans = marks.map(function (mark) {
                  var span = document.createElement("span");
                  span.className = "ts-mark";
                  span.textContent = mark;
                  span.setAttribute("aria-hidden", "true");
                  strip.appendChild(span);
                  return span;
                });

                var LEAD_BASE = 0.2;
                var GAP_BASE = 0.15;
                var FADE_BASE = 0.5;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));

                // Reveal starts: caller cues win; missing tail entries extend from
                // the last known start by the authored gap.
                var cues = String(vars.cues == null ? "" : vars.cues)
                  .split(",")
                  .map(function (cue) {
                    return parseFloat(cue);
                  })
                  .filter(function (cue) {
                    return isFinite(cue) && cue >= 0;
                  });
                var starts = marks.map(function (mark, index) {
                  if (index < cues.length) return cues[index];
                  if (cues.length > 0)
                    return cues[cues.length - 1] + GAP_BASE * (index - cues.length + 1);
                  return LEAD_BASE + GAP_BASE * index;
                });

                var IN_BASE = Math.max.apply(null, starts) + FADE_BASE;
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var FADE = FADE_BASE * scale;
                var OUT = OUT_BASE * scale;
                var OUT_START = duration - OUT;

                var tl = gsap.timeline({ paused: true });

                // IN: opacity-only stagger, left to right in reading order.
                spans.forEach(function (span, index) {
                  tl.fromTo(
                    span,
                    { opacity: 0 },
                    { opacity: 1, duration: FADE, ease: "power2.out" },
                    starts[index] * scale,
                  );
                });

                // HOLD: dead still. Nothing is authored here on purpose.

                // OUT: optional whole-strip departure; frame roots own transitions
                // by default, so exit "none" holds to the last frame.
                if (exit === "fade") {
                  tl.to(strip, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(strip, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(strip, { y: "-1.6cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "marks", "type": "string", "role": "content", "label": "Marks", "description": "Comma-separated wordmark texts (3 to 7 recommended).", "default": "Northwind, Acme Corp, Globex, Initech, Umbra" &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Mark color: quiet muted or full-contrast ink.", "default": "muted", "options": [&#123; "value": "muted", "label": "Muted" &#125;, &#123; "value": "ink", "label": "Ink" &#125;] &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated reveal starts in seconds from mount start. Empty uses the authored 0.15s stagger.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Faint palette tint mixed into the mark color.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "End-of-clip behavior. None holds to the last frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="trust-strip" data-duration="3.5" data-fps="30">
            
    
            <div
              id="trust-strip-clip"
              class="ts-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="ts-strip" role="img"></div>
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
    background: var(--bg, transparent);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    pointer-events: none;
  }

  .ts-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .ts-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    width: 86cqw;
    max-width: 86cqw;
    column-gap: var(--space-3, 4.8cqw);
    row-gap: var(--space-2, 4.2cqh);
    will-change: transform, opacity;
  }

  .ts-mark {
    /* Monochrome by law: the tone token carries the color; the accent
    token only tints it 10% so the strip sits in the palette. */
    color: color-mix(in srgb, var(--ts-tone) 90%, var(--ts-accent));
    font-size: min(1.9cqw, 6.4cqh);
    font-weight: 400;
    line-height: 1;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    white-space: nowrap;
    will-change: opacity;
  }
}
</style>
