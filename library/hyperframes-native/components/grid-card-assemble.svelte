<!-- Modified Svelte adaptation of registry/components/grid-card-assemble/grid-card-assemble.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "grid-card-assemble";
                var root = document.getElementById("root");
                var stage = root.querySelector(".gca-stage");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var itemsValue =
                  vars.items == null || String(vars.items).trim() === ""
                    ? "Capture,Compose,Render,Publish"
                    : String(vars.items);
                var rawItems = itemsValue
                  .split(",")
                  .map(function (token) {
                    return token.trim();
                  })
                  .filter(function (token) {
                    return token !== "";
                  })
                  .slice(0, 12);
                if (rawItems.length === 0) rawItems = ["Capture", "Compose", "Render", "Publish"];

                // "Label: body" entries carry a one-line muted body; plain
                // entries are label-only cards.
                var entries = rawItems.map(function (raw) {
                  var split = raw.indexOf(":");
                  if (split > 0) {
                    return {
                      label: raw.slice(0, split).trim(),
                      body: raw.slice(split + 1).trim(),
                    };
                  }
                  return { label: raw, body: "" };
                });

                var layout = vars.layout === "list" ? "list" : "grid";
                var isList = layout === "list";
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
                root.style.setProperty("--gca-accent", accentColors[accent]);

                // Six generic thin-line glyphs cycled by index (48-box paths).
                var ICONS = [
                  ["M24 44s16-8 16-20V10L24 4 8 10v14c0 12 16 20 16 20z", "M17 23l5 5 10-10"],
                  ["M8 6v34h34", "M16 30l8-9 6 5 10-12"],
                  ["M36 20h-2.5A16 16 0 1 0 18 40h18a10 10 0 0 0 0-20z"],
                  ["M26 4L10 27h10l-3 17 17-24H23l3-16z"],
                  ["M24 6L4 16l20 10 20-10L24 6z", "M4 24l20 10 20-10", "M4 32l20 10 20-10"],
                  ["M14 4h14l8 8v32H14z", "M28 4v8h8", "M20 24h10", "M20 31h7"],
                ];
                var SVG_NS = "http://www.w3.org/2000/svg";

                // Content override: a fork may author its own cards inside the
                // [data-slot="items"] element; then the items variable only
                // supplies labels for accessibility, not markup.
                var cards = Array.prototype.slice.call(stage.children);
                if (cards.length === 0) {
                  cards = entries.map(function (entry, index) {
                    var card = document.createElement("div");
                    card.className = "gca-card";
                    card.setAttribute("role", "listitem");

                    var icon = document.createElementNS(SVG_NS, "svg");
                    icon.setAttribute("class", "gca-icon");
                    icon.setAttribute("viewBox", "0 0 48 48");
                    icon.setAttribute("aria-hidden", "true");
                    ICONS[index % ICONS.length].forEach(function (d) {
                      var path = document.createElementNS(SVG_NS, "path");
                      path.setAttribute("d", d);
                      icon.appendChild(path);
                    });
                    card.appendChild(icon);

                    var text = document.createElement("div");
                    text.className = "gca-text";
                    var label = document.createElement("div");
                    label.className = "gca-label";
                    label.textContent = entry.label;
                    text.appendChild(label);
                    if (entry.body !== "") {
                      var body = document.createElement("div");
                      body.className = "gca-body";
                      body.textContent = entry.body;
                      text.appendChild(body);
                    }
                    card.appendChild(text);
                    stage.appendChild(card);
                    return card;
                  });
                }
                var count = cards.length;
                stage.setAttribute("data-layout", layout);
                stage.setAttribute(
                  "aria-label",
                  entries
                    .map(function (entry) {
                      return entry.label;
                    })
                    .join(", "),
                );

                // Layout geometry: columns wrap the grid; list is one column.
                // 3 or fewer sit on one row; beyond that ceil(sqrt(N)) keeps the
                // grid near-square (4 -> 2x2, 9 -> 3x3, 12 -> 4x3).
                var autoColumns = count <= 3 ? count : Math.ceil(Math.sqrt(count));
                var requested = Math.round(Number(vars.columns)) || 0;
                var columns =
                  layout === "list"
                    ? 1
                    : Math.max(1, Math.min(4, requested > 0 ? requested : autoColumns));
                var rows = Math.ceil(count / columns);
                stage.style.gridTemplateColumns = "repeat(" + columns + ", minmax(0, 1fr))";

                var hasBodies = entries.some(function (entry) {
                  return entry.body !== "";
                });

                // The assembled wall fills the mount with intent: ~76cqh of
                // vertical budget split across rows (gap approximated at 3cqh).
                // Label-only grids take shorter rows so cards stay proportioned.
                var stageW = isList ? 64 : 88;
                var rowCap = isList ? 15 : hasBodies ? 38 : 30;
                var rowH = Math.max(6, Math.min(rowCap, (76 - 3 * (rows - 1)) / rows));
                root.style.setProperty("--gca-stage-w", stageW + "cqw");
                root.style.setProperty("--gca-row-h", rowH.toFixed(3) + "cqh");

                // Card internals scale off the row height (set once at mount,
                // never tweened: cq-unit custom-property tweens break seeks).
                var pad = rowH * (isList ? 0.16 : 0.12);
                var iconSize = isList ? rowH * 0.5 : Math.min(rowH * 0.3, 9.5);
                root.style.setProperty("--gca-pad", pad.toFixed(3) + "cqh");
                root.style.setProperty("--gca-icon", iconSize.toFixed(3) + "cqh");
                root.style.setProperty(
                  "--gca-body-gap",
                  (rowH * (isList ? 0.03 : 0.035)).toFixed(3) + "cqh",
                );

                // Deterministic text fitting: wide-tracked mono label at ~0.75em
                // per glyph, sans body at ~0.52em; each also bounded by row
                // height so short mounts stay composed.
                var maxChars = entries.reduce(function (max, entry) {
                  return Math.max(max, Array.from(entry.label).length);
                }, 1);
                var maxBody = entries.reduce(function (max, entry) {
                  return Math.max(max, Array.from(entry.body).length);
                }, 0);
                var cellW = stageW / columns;
                var textW = isList ? cellW * 0.62 : cellW * 0.78;
                var labelCqw = Math.min(2.6, textW / (maxChars * 0.75));
                var labelCqh = rowH * (isList ? 0.23 : 0.09);
                root.style.setProperty(
                  "--gca-font",
                  "min(" + labelCqw.toFixed(3) + "cqw, " + labelCqh.toFixed(3) + "cqh)",
                );
                if (maxBody > 0) {
                  var bodyCqw = Math.min(2.2, textW / (maxBody * 0.56));
                  var bodyCqh = rowH * (isList ? 0.19 : 0.095);
                  root.style.setProperty(
                    "--gca-body-font",
                    "min(" + bodyCqw.toFixed(3) + "cqw, " + bodyCqh.toFixed(3) + "cqh)",
                  );
                }

                // RETIME RANGE: fixed IN cascade, elastic still HOLD, optional OUT.
                var BASE_START = 0.15;
                var GAP = 0.1;
                var TILE_BASE = 0.65;
                var OUT_BASE = 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var OUT = exit === "none" ? 0 : Math.min(OUT_BASE, duration * 0.25);
                var avail = duration - OUT;
                var TILE = Math.min(TILE_BASE, Math.max(0.2, avail - BASE_START));
                var latestStart = Math.max(0, avail - TILE);
                // Default cascade: the last card lands (settle included) around
                // 60% of the authored duration, so the assembly occupies the
                // shot instead of finishing in the first quarter and holding
                // dead. Later cards land deeper, each icon drawing as its card
                // arrives; the still hold begins after the final landing. Short
                // mounts fall back to the compressed ~0.1s cascade, and nothing
                // ever starts past latestStart (every card lands before OUT).
                var firstStart = Math.min(BASE_START, latestStart);
                var targetLastStart = Math.min(
                  latestStart,
                  Math.max(0.6 * duration - TILE, BASE_START + GAP * (count - 1)),
                );
                var gap = count > 1 ? Math.max(0, targetLastStart - firstStart) / (count - 1) : 0;

                var cueList = String(vars.cues == null ? "" : vars.cues).split(",");
                var starts = cards.map(function (card, index) {
                  var cue = Number((cueList[index] || "").trim());
                  var hasCue = (cueList[index] || "").trim() !== "" && Number.isFinite(cue);
                  var start = hasCue ? cue : firstStart + gap * index;
                  return Math.max(0, Math.min(start, latestStart));
                });

                var tl = gsap.timeline({ paused: true });

                // IN: fade + short slide directly into the slot, long-tail settle,
                // no overshoot. Explicit both-endpoints state so any seek is exact.
                cards.forEach(function (card, index) {
                  gsap.set(card, { opacity: 0, y: "3cqh" });
                  tl.fromTo(
                    card,
                    { opacity: 0, y: "3cqh" },
                    { opacity: 1, y: "0cqh", duration: TILE, ease: "power3.out" },
                    starts[index],
                  );

                  // The icon outline draws on inside the card's settle window
                  // (dash-primed inline so a seek to 0 shows it undrawn).
                  // Attribute-driven (not style): CSS strokeDashoffset changes
                  // under-invalidate the path region in Chrome, leaving stale
                  // stroke fragments on reverse seeks; attributes repaint fully.
                  var paths = card.querySelectorAll(".gca-icon path");
                  var iconStart = TILE * 0.25;
                  var iconAvail = TILE * 0.7;
                  paths.forEach(function (path, j) {
                    var len = path.getTotalLength();
                    path.setAttribute("stroke-dasharray", String(len));
                    path.setAttribute("stroke-dashoffset", String(len));
                    tl.fromTo(
                      path,
                      { attr: { "stroke-dashoffset": len } },
                      {
                        attr: { "stroke-dashoffset": 0 },
                        duration: iconAvail * 0.55,
                        ease: "power2.out",
                        immediateRender: false,
                      },
                      starts[index] + iconStart + (j / paths.length) * iconAvail * 0.45,
                    );
                  });
                });

                // HOLD: intentionally still. Nothing floats, nothing pushes in.

                // OUT: whole assembled stage leaves together.
                if (exit !== "none") {
                  var OUT_START = duration - OUT;
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(stage, { y: "-3cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "items", "type": "string", "role": "content", "label": "Items", "description": "Comma-separated cards (3 to 12). \"Label: body\" adds a one-line muted body under the label.", "default": "Capture,Compose,Render,Publish" &#125;,
        &#123; "id": "layout", "type": "enum", "role": "layout", "label": "Layout", "description": "Grid wraps by columns; list stacks vertically.", "default": "grid", "options": [&#123; "value": "grid", "label": "Grid" &#125;, &#123; "value": "list", "label": "List" &#125;] &#125;,
        &#123; "id": "columns", "type": "number", "role": "layout", "label": "Columns", "description": "Grid column count (grid layout only). 0 picks automatically: one row up to 3 items, then ceil(sqrt(N)).", "default": 0, "min": 0, "max": 4, "step": 1 &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated per-item entrance times in seconds. Blank entries use the default cascade.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used by the card icons.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "How the assembled layout leaves the frame. Default none: the hold ends the film.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="grid-card-assemble" data-duration="4.5" data-fps="30">
            
    
            <div
              id="grid-card-assemble-clip"
              class="gca-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="gca-stage" data-slot="items" role="list"></div>
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

  .gca-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .gca-stage {
    display: grid;
    width: var(--gca-stage-w, 88cqw);
    grid-auto-rows: var(--gca-row-h, 34cqh);
    gap: var(--space-2, 2.2cqmin);
    will-change: transform, opacity;
  }

  .gca-card {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;
    min-height: 0;
    padding: var(--gca-pad, 4cqh);
    overflow: hidden;
    border: 1px solid var(--border, #38404e);
    border-radius: var(--radius, 1.8cqmin);
    /* Token surface with a subtle top light so the card reads as a
    real plane against the stage (no color-mix: keeps the
      contrast auditor honest). */
    background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.055), rgba(255, 255, 255, 0.01) 60%),
      var(--surface, #141a23);
    will-change: transform, opacity;
  }

  .gca-icon {
    flex: 0 0 auto;
    width: var(--gca-icon, 7cqh);
    height: var(--gca-icon, 7cqh);
  }

  .gca-icon path {
    fill: none;
    stroke: var(--gca-accent, var(--brand, #71f5a7));
    stroke-width: 2.2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .gca-text {
    min-width: 0;
  }

  .gca-label {
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-size: var(--gca-font, 2.2cqh);
    font-weight: 500;
    line-height: 1.25;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .gca-body {
    margin-top: var(--gca-body-gap, 1.1cqh);
    overflow: hidden;
    color: var(--muted, #94a3b8);
    font-family: var(--font-body, system-ui, -apple-system, "Segoe UI", sans-serif);
    font-size: var(--gca-body-font, 2.6cqh);
    font-weight: 400;
    line-height: 1.4;
    letter-spacing: 0.01em;
    white-space: nowrap;
  }

  /* List rows read horizontally: icon left, text block beside it. */
  .gca-stage[data-layout="list"] .gca-card {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: var(--space-2, 2.2cqmin);
  }

  .gca-stage[data-layout="list"] .gca-body {
    margin-top: var(--gca-body-gap, 0.6cqh);
  }
}
</style>
