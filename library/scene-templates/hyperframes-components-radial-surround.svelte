<!-- Modified Svelte adaptation of registry/components/radial-surround/radial-surround.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "radial-surround";
                var root = document.getElementById("root");
                var stage = root.querySelector(".rs-stage");
                var center = root.querySelector('[data-slot="center"]');
                var ring = root.querySelector(".rs-ring");
                var vignette = root.querySelector(".rs-vignette");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var centerLabel =
                  vars.center_label == null || String(vars.center_label).trim() === ""
                    ? "Your team"
                    : String(vars.center_label).trim();
                var chipsValue =
                  vars.chips == null || String(vars.chips).trim() === ""
                    ? "Docs,Tickets,Dashboards,Inbox,Chat,Sheets"
                    : String(vars.chips);
                var labels = chipsValue
                  .split(",")
                  .map(function (token) {
                    return token.trim();
                  })
                  .filter(function (token) {
                    return token !== "";
                  })
                  .slice(0, 12);
                if (labels.length === 0)
                  labels = ["Docs", "Tickets", "Dashboards", "Inbox", "Chat", "Sheets"];

                var closeIn = !(vars.close_in === false || vars.close_in === "false");
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
                root.style.setProperty("--rs-accent", accentColors[accent]);

                // Slot: a fork may author its own subject inside
                // [data-slot="center"]; then the default token card is skipped.
                if (center.children.length === 0) {
                  center.classList.add("rs-card");
                  var label = document.createElement("span");
                  label.className = "rs-card-label";
                  label.textContent = centerLabel;
                  center.appendChild(label);
                }
                stage.setAttribute("aria-label", centerLabel + ": " + labels.join(", "));

                // Deterministic center-label fitting inside the 28cqw card.
                var chars = Array.from(centerLabel).length;
                var fontCqw = Math.min(3.4, 23 / (Math.max(1, chars) * 0.62));
                root.style.setProperty("--rs-center-font", "min(" + fontCqw.toFixed(3) + "cqw, 6cqh)");

                /* Elliptical ring, baked once (deterministic). FAR is the wide
                   assembly ring; NEAR is the close-in ring, pressing corner chips
                   up against the 28cqw center card so the crowding reads (chips
                   paint above the card). Angles alternate sides from the top so
                   consecutive entries pop on opposite compass points. */
                var FAR_RX = 30; /* cqw */
                var FAR_RY = 31; /* cqh */
                var NEAR_RX = 20;
                var NEAR_RY = 23;
                var count = labels.length;
                var step = 360 / count;
                function ringPosition(index, rx, ry) {
                  var degrees = -90 + Math.ceil(index / 2) * step * (index % 2 === 1 ? 1 : -1);
                  var a = (degrees * Math.PI) / 180;
                  return {
                    ox: (Math.cos(a) * rx).toFixed(3) + "cqw",
                    oy: (Math.sin(a) * ry).toFixed(3) + "cqh",
                  };
                }
                var positions = [];
                var chips = labels.map(function (text, index) {
                  var pos = document.createElement("div");
                  pos.className = "rs-pos";
                  var far = ringPosition(index, FAR_RX, FAR_RY);
                  pos.style.setProperty("--rs-ox", far.ox);
                  pos.style.setProperty("--rs-oy", far.oy);
                  var chip = document.createElement("div");
                  chip.className = "rs-chip";
                  chip.textContent = text;
                  pos.appendChild(chip);
                  ring.appendChild(pos);
                  positions.push(pos);
                  return chip;
                });

                // RETIME RANGE: fixed IN cascade (+ close-in), elastic still HOLD,
                // optional OUT. The close-in window is reserved off the top so the
                // converge always completes inside the clip.
                var CENTER_AT = 0.05;
                var BASE_START = 0.9;
                var GAP = 0.3;
                var ENTRY = 0.55;
                var CLOSE_DUR = 0.75;
                var CLOSE_STAG = 0.09;
                var BREATH = 0.35;
                var OUT_BASE = 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var OUT = exit === "none" ? 0 : Math.min(OUT_BASE, duration * 0.2);
                var avail = duration - OUT;
                var closeSpan = closeIn ? (count - 1) * CLOSE_STAG + CLOSE_DUR : 0;
                var latestStart = Math.max(0, avail - ENTRY - closeSpan);
                // Compress the cascade together when the duration cannot fit it.
                var gap =
                  count > 1 ? Math.min(GAP, Math.max(0, latestStart - BASE_START) / (count - 1)) : GAP;

                var cueList = String(vars.cues == null ? "" : vars.cues).split(",");
                var starts = chips.map(function (chip, index) {
                  var cue = Number((cueList[index] || "").trim());
                  var hasCue = (cueList[index] || "").trim() !== "" && Number.isFinite(cue);
                  var start = hasCue ? cue : Math.min(BASE_START, latestStart) + gap * index;
                  return Math.max(0, Math.min(start, latestStart));
                });

                var tl = gsap.timeline({ paused: true });

                // Center seats first: gentle fade + subtle scale settle. After
                // this the center NEVER moves again (surrounded, not zoomed).
                gsap.set(center, { opacity: 0, scale: 0.94 });
                tl.fromTo(
                  center,
                  { opacity: 0, scale: 0.94 },
                  {
                    opacity: 1,
                    scale: 1,
                    duration: Math.min(0.7, Math.max(0.2, avail * 0.25)),
                    ease: "power3.out",
                  },
                  Math.min(CENTER_AT, latestStart),
                );

                // IN: chips assemble on the FAR ring in a measured stagger.
                // Explicit both-endpoints state so any seek is exact.
                chips.forEach(function (chip, index) {
                  gsap.set(chip, { scale: 0, opacity: 0 });
                  tl.fromTo(
                    chip,
                    { scale: 0, opacity: 0 },
                    { scale: 1, opacity: 1, duration: ENTRY, ease: "power3.out" },
                    starts[index],
                  );
                });

                // Close-in: chips converge from all compass points toward the
                // subject while the edges dim slightly. The center holds still.
                if (closeIn) {
                  var maxEntryEnd =
                    starts.reduce(function (max, start) {
                      return Math.max(max, start);
                    }, 0) + ENTRY;
                  var closeStart = Math.max(
                    maxEntryEnd,
                    Math.min(maxEntryEnd + BREATH, avail - closeSpan),
                  );
                  positions.forEach(function (pos, index) {
                    var far = ringPosition(index, FAR_RX, FAR_RY);
                    var near = ringPosition(index, NEAR_RX, NEAR_RY);
                    tl.fromTo(
                      pos,
                      { "--rs-ox": far.ox, "--rs-oy": far.oy },
                      {
                        "--rs-ox": near.ox,
                        "--rs-oy": near.oy,
                        duration: CLOSE_DUR,
                        ease: "power2.inOut",
                      },
                      closeStart + index * CLOSE_STAG,
                    );
                  });
                  gsap.set(vignette, { opacity: 0 });
                  tl.fromTo(
                    vignette,
                    { opacity: 0 },
                    {
                      opacity: 1,
                      duration: Math.min(0.9, Math.max(0.2, closeSpan)),
                      ease: "power1.inOut",
                    },
                    closeStart + 0.05,
                  );
                }

                // HOLD: intentionally still. Crowded, quiet, nothing floats.

                // OUT: the whole surrounded stage leaves together.
                if (exit !== "none") {
                  var OUT_START = duration - OUT;
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    // yPercent, not a cq-unit y: percent transforms seek exactly.
                    tl.to(stage, { yPercent: -4, duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "center_label", "type": "string", "role": "content", "label": "Center label", "description": "Label on the default center token card.", "default": "Your team" &#125;,
        &#123; "id": "chips", "type": "string", "role": "content", "label": "Chips", "description": "Comma-separated chip labels that surround the center (up to 12).", "default": "Docs,Tickets,Dashboards,Inbox,Chat,Sheets" &#125;,
        &#123; "id": "close_in", "type": "boolean", "role": "timing", "label": "Close in", "description": "Converge the ring inward with a subtle edge dim after assembly. The center never moves.", "default": true &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated per-chip entrance times in seconds. Blank entries use the default cascade.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used by the center card tint.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "How the surrounded stage leaves the frame. Default none: the crowded hold ends the film.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5" data-composition-id="radial-surround" data-duration="5" data-fps="30">
            
    
            <div
              id="radial-surround-clip"
              class="rs-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <div class="rs-stage" role="img">
                <div class="rs-center-layer">
                  <div class="rs-center" data-slot="center"></div>
                </div>
                <div class="rs-ring" aria-hidden="true"></div>
                <div class="rs-vignette"></div>
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
    background: var(--bg, transparent);
    color: var(--fg, #f8fafc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    pointer-events: none;
  }

  .rs-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .rs-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .rs-center-layer {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .rs-center {
    display: grid;
    place-items: center;
    will-change: transform, opacity;
  }

  .rs-center > img, .rs-center > video {
    max-width: 34cqw;
    max-height: 30cqh;
    object-fit: cover;
    border-radius: var(--radius, 2.2cqmin);
  }

  .rs-card {
    width: 28cqw;
    min-height: 22cqh;
    padding: var(--space-2, 2.2cqmin);
    border: 0.16cqmin solid color-mix(in srgb, var(--rs-accent) 46%, var(--border, #475569));
    border-radius: var(--radius, 2.2cqmin);
    background: color-mix(in srgb, var(--surface, #131a24) 94%, var(--rs-accent));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 40%, transparent);
  }

  .rs-card-label {
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(
      --font-display,
      var(--font-body, ui-sans-serif, system-ui, sans-serif)
    );
    font-size: var(--rs-center-font, 4cqmin);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: 0.04em;
    text-align: center;
    white-space: nowrap;
  }

  .rs-ring {
    position: absolute;
    inset: 0;
  }

  /* Positioning wrapper: the baked ring offsets live in the --rs-ox
  and --rs-oy custom properties (plain cq values) and the close-in
  tweens THOSE, never x/y or a GSAP-written calc() string. GSAP
  misconverts vertical cq units to px mid-tween when it has to
  re-init a layout property under a seek, so the calc stays in the
  stylesheet and only the var strings interpolate; the inner
  chip's unitless scale and opacity are the only transforms. */
  .rs-pos {
    position: absolute;
    top: calc(50% + var(--rs-oy, 0cqh));
    left: calc(50% + var(--rs-ox, 0cqw));
    width: max-content;
    transform: translate(-50%, -50%);
    will-change: top, left;
  }

  .rs-chip {
    padding: 1.15cqmin 2.1cqmin;
    border: 0.14cqmin solid var(--border, #475569);
    border-radius: 0.6cqmin;
    background: var(--surface, #131a24);
    color: var(--fg, #f8fafc);
    font-size: 2.1cqmin;
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  /* Close-in edge dim: very subtle, content stays legible. */
  .rs-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      transparent 60%,
      color-mix(in srgb, var(--bg, #05070c) 34%, transparent) 100%
    );
    opacity: 0;
    pointer-events: none;
  }
}
</style>
