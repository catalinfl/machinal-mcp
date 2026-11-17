<!-- Modified Svelte adaptation of registry/components/state-chip-rail/state-chip-rail.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

                // Literal id, never read off the DOM: the flattening step strips
                // data-composition-id from the mounted root (see toggle-flip).
                var compositionId = "state-chip-rail";
                var root = document.getElementById("root");
                var rail = root.querySelector(".scr-rail");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function commaList(value, max) {
                  return String(value == null ? "" : value)
                    .split(",")
                    .map(function (token) {
                      return token.trim();
                    })
                    .filter(function (token) {
                      return token !== "";
                    })
                    .slice(0, max);
                }

                var states = commaList(vars.states, 8);
                if (states.length === 0) states = ["Queued", "Reading", "Drafting", "Done"];
                var count = states.length;

                var badges = commaList(vars.badges, 4);
                var badgeStateRaw = Math.round(Number(vars.badge_state));
                var badgeState = Number.isFinite(badgeStateRaw)
                  ? Math.max(0, Math.min(count - 1, badgeStateRaw))
                  : Math.min(1, count - 1);

                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

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
                root.style.setProperty("--scr-accent", accentColors[accent]);

                // Build the rail: chips in machine order, badges directly after
                // the badge_state chip. State 0 is active from mount.
                var chips = states.map(function (label, index) {
                  var chip = document.createElement("div");
                  chip.className = "scr-chip";
                  chip.setAttribute("role", "listitem");
                  chip.setAttribute("data-state", index === 0 ? "active" : "pending");
                  var dot = document.createElement("span");
                  dot.className = "scr-dot";
                  dot.setAttribute("aria-hidden", "true");
                  var text = document.createElement("span");
                  text.textContent = label;
                  chip.appendChild(dot);
                  chip.appendChild(text);
                  return chip;
                });
                var badgeElements = badges.map(function (label) {
                  var badge = document.createElement("div");
                  badge.className = "scr-badge";
                  badge.textContent = label;
                  return badge;
                });
                chips.forEach(function (chip, index) {
                  rail.appendChild(chip);
                  if (index === badgeState) {
                    badgeElements.forEach(function (badge) {
                      rail.appendChild(badge);
                    });
                  }
                });
                rail.setAttribute("aria-label", states.join(", "));

                // Deterministic fit: wide-tracked mono at ~0.76em per glyph, plus
                // chip padding, dot, and rail gaps, all measured in em.
                var railEm = (count - 1 + badges.length) * 0.8;
                states.forEach(function (label) {
                  railEm += Array.from(label).length * 0.76 + 3.1;
                });
                badges.forEach(function (label) {
                  railEm += (Array.from(label).length * 0.76 + 2.5) * 0.82;
                });
                var fontCqw = Math.min(2.4, 90 / Math.max(1, railEm));
                root.style.setProperty("--scr-font", "min(" + fontCqw.toFixed(3) + "cqw, 9cqh)");

                // RETIME RANGE: fixed IN cascade + advance schedule, elastic
                // still HOLD, optional OUT.
                var OUT_BASE = 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var OUT = exit === "none" ? 0 : Math.min(OUT_BASE, duration * 0.2);
                var avail = duration - OUT;

                var CHIP = Math.min(0.45, Math.max(0.2, avail * 0.15));
                var entryGap = Math.min(0.08, Math.max(0.02, avail * 0.02));
                var entryEnd = 0.12 + entryGap * (count - 1) + CHIP;

                // Default rhythm: advances spread evenly from just after the
                // cascade to ~1s before the window closes.
                var firstAdvance = Math.min(Math.max(entryEnd + 0.15, 0.9), Math.max(0.2, avail - 0.6));
                var lastAdvance = Math.max(firstAdvance, avail - 1.0);
                var advanceCount = count - 1;
                var timesList = String(vars.times == null ? "" : vars.times).split(",");
                var previous = 0.15;
                var advances = [];
                for (var k = 0; k < advanceCount; k += 1) {
                  var fallback =
                    advanceCount > 1
                      ? firstAdvance + (k * (lastAdvance - firstAdvance)) / (advanceCount - 1)
                      : firstAdvance;
                  var cueText = (timesList[k] || "").trim();
                  var cue = Number(cueText);
                  var start = cueText !== "" && Number.isFinite(cue) ? cue : fallback;
                  start = Math.max(0.15, Math.min(start, Math.max(0.15, avail - 0.45)));
                  start = Math.max(start, previous + 0.05);
                  previous = start;
                  advances.push(start);
                }

                var tl = gsap.timeline({ paused: true });

                // IN: chips cascade into the rail. Explicit both-endpoints state
                // so any seek is exact. Badges hold at scale 0 until their pop
                // (they keep their layout slot, so the rail never reflows).
                chips.forEach(function (chip, index) {
                  gsap.set(chip, { opacity: 0, y: "2.5cqh" });
                  tl.fromTo(
                    chip,
                    { opacity: 0, y: "2.5cqh" },
                    { opacity: 1, y: "0cqh", duration: CHIP, ease: "power3.out" },
                    0.12 + entryGap * index,
                  );
                });

                // The snap machine: pure attribute flips. GSAP records the prior
                // value on first render in timeline order, so backward seeks
                // restore pending / active exactly.
                advances.forEach(function (start, index) {
                  var stateIndex = index + 1;
                  tl.set(chips[stateIndex], { attr: { "data-state": "active" } }, start);
                  tl.set(chips[stateIndex - 1], { attr: { "data-state": "done" } }, start);
                });

                // Badges pop beside their state as it activates.
                if (badgeElements.length > 0) {
                  var popStart = badgeState === 0 ? entryEnd + 0.1 : advances[badgeState - 1] + 0.12;
                  popStart = Math.min(popStart, Math.max(0.2, avail - 0.4));
                  badgeElements.forEach(function (badge, index) {
                    gsap.set(badge, { opacity: 0, scale: 0 });
                    tl.fromTo(
                      badge,
                      { opacity: 0, scale: 0 },
                      { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" },
                      popStart + 0.14 * index,
                    );
                  });
                }

                // HOLD: intentionally still. The resolved machine reads as a frame.

                // OUT: the whole rail leaves together.
                if (exit !== "none") {
                  var OUT_START = duration - OUT;
                  tl.to(rail, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(rail, { y: "-3cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "states", "type": "string", "role": "content", "label": "States", "description": "Comma-separated chip labels in machine order (2 to 8 states).", "default": "Queued,Reading,Drafting,Done" &#125;,
        &#123; "id": "times", "type": "string", "role": "timing", "label": "Times", "description": "Comma-separated activation times in seconds, one per advance (state 1 onward). Blank entries use the default even rhythm.", "default": "" &#125;,
        &#123; "id": "badge_state", "type": "number", "role": "content", "label": "Badge state", "description": "Index of the state the badges pop beside.", "default": 1, "min": 0, "max": 7, "step": 1 &#125;,
        &#123; "id": "badges", "type": "string", "role": "content", "label": "Badges", "description": "Comma-separated badge labels shown beside the badge state. Empty disables.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used by the active chip.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "How the rail leaves the frame. Default none: the hold ends the film.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5" data-composition-id="state-chip-rail" data-duration="5" data-fps="30">
            
    
            <div
              id="state-chip-rail-clip"
              class="scr-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <div class="scr-rail" role="list"></div>
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
    color: var(--fg, #f8fafc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    pointer-events: none;
  }

  .scr-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .scr-rail {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: nowrap;
    max-width: 94cqw;
    gap: var(--scr-gap, 0.8em);
    font-size: var(--scr-font, 2cqmin);
    will-change: transform, opacity;
  }

  .scr-chip, .scr-badge {
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: 0.55em;
    padding: 0.62em 1.05em;
    overflow: hidden;
    border: 0.16cqmin solid var(--border, #334155);
    border-radius: 100cqmax;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    white-space: nowrap;
    will-change: transform, opacity;
  }

  .scr-dot {
    flex: 0 0 auto;
    width: 0.5em;
    aspect-ratio: 1;
    border: 0.16cqmin solid var(--muted, #94a3b8);
    border-radius: 50%;
    background: transparent;
  }

  /* The snap machine: presentation is pure CSS on [data-state]; the
  timeline only flips the attribute. Dimming rides color, never
  opacity, so it cannot fight the entrance opacity tweens. */
  .scr-chip[data-state="pending"] {
    border-color: color-mix(in srgb, var(--border, #334155) 80%, transparent);
    background: transparent;
    color: color-mix(in srgb, var(--muted, #94a3b8) 78%, transparent);
  }

  .scr-chip[data-state="active"] {
    border-color: color-mix(in srgb, var(--scr-accent) 62%, var(--border, #334155));
    background: var(--surface, #131a24);
    color: var(--fg, #f8fafc);
  }
  .scr-chip[data-state="active"] .scr-dot {
    border-color: transparent;
    background: var(--scr-accent, var(--brand, #71f5a7));
  }

  .scr-chip[data-state="done"] {
    border-color: color-mix(in srgb, var(--border, #334155) 45%, transparent);
    background: transparent;
    color: color-mix(in srgb, var(--muted, #94a3b8) 42%, transparent);
  }
  .scr-chip[data-state="done"] .scr-dot {
    border-color: transparent;
    background: color-mix(in srgb, var(--scr-accent, #71f5a7) 38%, transparent);
  }

  .scr-badge {
    padding: 0.5em 0.9em;
    border-color: color-mix(in srgb, var(--border, #334155) 70%, transparent);
    color: color-mix(in srgb, var(--muted, #94a3b8) 88%, transparent);
    font-size: 0.82em;
  }
}
</style>
