<!-- Modified Svelte adaptation of registry/components/notification-stack/notification-stack.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "notification-stack";
                var root = document.getElementById("root");
                var stage = root.querySelector(".ns-stage");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function toList(value, fallback) {
                  var raw = value == null || String(value).trim() === "" ? fallback : String(value);
                  return raw.split(",").map(function (token) {
                    return token.trim();
                  });
                }

                var titles = toList(vars.titles, "Build queued,Checks passed,Deploy live")
                  .filter(function (token) {
                    return token !== "";
                  })
                  .slice(0, 5);
                if (titles.length === 0) titles = ["Build queued", "Checks passed", "Deploy live"];
                var bodies = toList(
                  vars.bodies,
                  "Pipeline started for main,All 42 checks green,Now serving version 2.4",
                );
                var count = titles.length;

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
                root.style.setProperty("--ns-accent", accentColors[accent]);

                // Focus card: index into the titles list; -1 / out of range means
                // the newest card, which finishes on top of the stack.
                var expandRaw = Math.round(Number(vars.expand));
                var expand =
                  Number.isFinite(expandRaw) && expandRaw >= 0 && expandRaw < count
                    ? expandRaw
                    : count - 1;

                // Geometry: cards fill up to ~74cqh of the stack region; the
                // stage box is the FINAL stack size so the clip centers it once.
                var GAP_CQH = 2;
                var cardH = Math.min(15, (74 - (count - 1) * GAP_CQH) / count);
                var slotH = cardH + GAP_CQH;
                root.style.setProperty("--ns-card-h", cardH.toFixed(3) + "cqh");
                stage.style.height = (count * cardH + (count - 1) * GAP_CQH).toFixed(3) + "cqh";
                stage.setAttribute("aria-label", titles.join(", "));

                var cards = titles.map(function (title, index) {
                  var card = document.createElement("div");
                  card.className = "ns-card";
                  card.setAttribute("role", "listitem");
                  // Static stacking: the focus card sits above its dimmed
                  // neighbors so its slight grow overlaps them cleanly.
                  card.style.zIndex = index === expand ? "2" : "1";
                  var dot = document.createElement("span");
                  dot.className = "ns-dot";
                  dot.setAttribute("aria-hidden", "true");
                  card.appendChild(dot);
                  var text = document.createElement("span");
                  text.className = "ns-text";
                  var titleEl = document.createElement("span");
                  titleEl.className = "ns-title";
                  titleEl.textContent = title;
                  text.appendChild(titleEl);
                  var body = (bodies[index] || "").trim();
                  if (body !== "") {
                    var bodyEl = document.createElement("span");
                    bodyEl.className = "ns-body";
                    bodyEl.textContent = body;
                    text.appendChild(bodyEl);
                  }
                  card.appendChild(text);
                  stage.appendChild(card);
                  return card;
                });

                // RETIME RANGE: arrivals on cues, fixed resolve, elastic still
                // HOLD, optional OUT.
                var BASE = 0.2;
                var GAP = 0.55;
                var ENTER = 0.55;
                var SHIFT = 0.45;
                var RESOLVE_DUR = 0.5;
                var OUT_BASE = 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var OUT = exit === "none" ? 0 : Math.min(OUT_BASE, duration * 0.25);
                var avail = duration - OUT;
                var latestStart = Math.max(0, avail - 1.05);

                var cueList = String(vars.cues == null ? "" : vars.cues).split(",");
                var starts = [];
                for (var i = 0; i < count; i++) {
                  var cue = Number((cueList[i] || "").trim());
                  var hasCue = (cueList[i] || "").trim() !== "" && Number.isFinite(cue);
                  var start = hasCue ? cue : BASE + GAP * i;
                  if (i > 0) start = Math.max(start, starts[i - 1] + 0.05);
                  starts.push(Math.max(0, Math.min(start, latestStart)));
                }
                for (i = 1; i < count; i++) starts[i] = Math.max(starts[i], starts[i - 1]);

                var last = starts[count - 1];
                var resolve = Math.max(last + 0.1, Math.min(last + 0.65, avail - RESOLVE_DUR));
                var resolveDur = Math.min(RESOLVE_DUR, Math.max(0.001, avail - resolve));

                // Tween distances in px, derived once from the measured mount
                // height (what 1cqh resolves to). GSAP interpolates chained
                // cqh-unit transform tweens incorrectly mid-tween, so transforms
                // ride px while all layout stays in container units.
                var rootH = root.offsetHeight || window.innerHeight || 1080;
                var cqhPx = rootH / 100;
                var yFor = function (slot) {
                  return slot * slotH * cqhPx;
                };
                var enterY = -(cardH * 0.6 * cqhPx);

                var tl = gsap.timeline({ paused: true });

                // IN: each card drops into the TOP slot with a fade and a smooth
                // long-tail settle while every earlier card shifts down one slot.
                // Event durations are capped at the gap to the next event so no
                // two tweens on the same property ever overlap.
                cards.forEach(function (card, index) {
                  var eventStart = starts[index];
                  var nextEvent = index + 1 < count ? starts[index + 1] : resolve;
                  var eventCap = Math.max(0.001, nextEvent - eventStart);
                  gsap.set(card, { opacity: 0, y: enterY });
                  tl.fromTo(
                    card,
                    { opacity: 0, y: enterY },
                    {
                      opacity: 1,
                      y: yFor(0),
                      duration: Math.min(ENTER, eventCap),
                      ease: "power3.out",
                    },
                    eventStart,
                  );
                  for (var j = 0; j < index; j++) {
                    // immediateRender false: a build-time render of this from
                    // state would park the card at a mid-stack slot before its
                    // own entrance has run.
                    tl.fromTo(
                      cards[j],
                      { y: yFor(index - 1 - j) },
                      {
                        y: yFor(index - j),
                        duration: Math.min(SHIFT, eventCap),
                        ease: "power3.out",
                        immediateRender: false,
                      },
                      eventStart,
                    );
                  }
                });

                // RESOLVE: the focus card grows slightly and brightens; the rest
                // dim by stack position (deeper cards dim more). Filter tweens
                // stay numeric; no var() color string is ever tweened.
                cards.forEach(function (card, index) {
                  var stackPos = count - 1 - index;
                  if (index === expand) {
                    tl.fromTo(
                      card,
                      { scale: 1, filter: "brightness(1)" },
                      {
                        scale: 1.045,
                        filter: "brightness(1.1)",
                        duration: resolveDur,
                        ease: "power2.out",
                        immediateRender: false,
                      },
                      resolve,
                    );
                  } else {
                    tl.fromTo(
                      card,
                      { opacity: 1 },
                      {
                        opacity: Math.max(0.42, 0.72 - 0.07 * stackPos),
                        duration: resolveDur,
                        ease: "power2.out",
                        immediateRender: false,
                      },
                      resolve,
                    );
                  }
                });

                // HOLD: intentionally still. Nothing floats, nothing pushes in.

                // OUT: the whole resolved stack leaves together.
                if (exit !== "none") {
                  var OUT_START = duration - OUT;
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(stage, { y: -3 * cqhPx, duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "titles", "type": "string", "role": "content", "label": "Titles", "description": "Comma-separated card titles (1 to 5 cards).", "default": "Build queued,Checks passed,Deploy live" &#125;,
        &#123; "id": "bodies", "type": "string", "role": "content", "label": "Bodies", "description": "Comma-separated body lines matched to titles by index. Blank entries hide that body line.", "default": "Pipeline started for main,All 42 checks green,Now serving version 2.4" &#125;,
        &#123; "id": "expand", "type": "number", "role": "content", "label": "Expand", "description": "Index of the focus card in the titles list. -1 focuses the newest card (top of the stack).", "default": -1, "min": -1, "max": 4, "step": 1 &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated per-card arrival times in seconds. Blank entries use the default rhythm.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used by the icon dots.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "How the stack leaves the frame. Default none: the hold ends the film.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="notification-stack" data-duration="4" data-fps="30">
            
    
            <div
              id="notification-stack-clip"
              class="ns-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="ns-stage" role="list"></div>
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
    font-family: var(--font-body, system-ui, -apple-system, "Segoe UI", sans-serif);
    pointer-events: none;
  }

  .ns-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .ns-stage {
    position: relative;
    width: min(54cqw, 110cqh);
    will-change: transform, opacity;
  }

  .ns-card {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: var(--ns-card-h, 14cqh);
    display: flex;
    align-items: center;
    gap: var(--space-2, 2.2cqmin);
    padding: 0 var(--space-2, 2.2cqmin);
    overflow: hidden;
    border: 0.16cqmin solid var(--border, #334155);
    border-radius: var(--radius, 1.8cqmin);
    background: var(--surface, #131a24);
    box-shadow: 0 1cqmin 3cqmin color-mix(in srgb, var(--bg, #05070a) 45%, transparent);
    will-change: transform, opacity, filter;
  }

  .ns-dot {
    flex: 0 0 auto;
    width: min(1.7cqmin, calc(var(--ns-card-h, 14cqh) * 0.14));
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--ns-accent, var(--brand, #71f5a7));
  }

  .ns-text {
    display: flex;
    flex-direction: column;
    gap: min(0.7cqmin, calc(var(--ns-card-h, 14cqh) * 0.06));
    min-width: 0;
  }

  .ns-title {
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-size: min(3.2cqmin, calc(var(--ns-card-h, 14cqh) * 0.24));
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.01em;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ns-body {
    overflow: hidden;
    color: var(--muted, #94a3b8);
    font-size: min(2.5cqmin, calc(var(--ns-card-h, 14cqh) * 0.19));
    font-weight: 400;
    line-height: 1.25;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
}
</style>
