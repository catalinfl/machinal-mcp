<!-- Modified Svelte adaptation of registry/components/scroll-feed/scroll-feed.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var mainColumn = root.querySelector(".sf-main");
                var blurA = root.querySelector(".sf-blur-a");
                var blurB = root.querySelector(".sf-blur-b");
                var columns = root.querySelectorAll(".sf-column");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var speed = vars.speed === "frantic" ? "frantic" : "doom";
                var countValue = Number(vars.card_count);
                var cardCount = Number.isFinite(countValue)
                  ? Math.max(4, Math.min(10, Math.round(countValue)))
                  : 6;
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

                // Frantic mode travels farther in the same HOLD while still
                // completing exactly one full cycle at the final frame.
                var cardHeight = speed === "frantic" ? 32 : 24;
                var gap = speed === "frantic" ? 4 : 3;
                var cycleDistance = cardCount * (cardHeight + gap);
                root.style.setProperty("--sf-card-h", cardHeight + "cqh");
                root.style.setProperty("--sf-gap", gap + "cqh");

                var cycle = document.createElement("div");
                cycle.className = "sf-cycle";

                for (var index = 0; index < cardCount; index += 1) {
                  var card = document.createElement("article");
                  card.className = "sf-card";
                  card.style.setProperty("--sf-avatar", 3.2 + (index % 3) * 0.45 + "cqh");
                  card.style.setProperty("--sf-primary-w", 18 + ((index * 11) % 24) + "cqw");
                  card.style.setProperty("--sf-secondary-w", 12 + ((index * 7) % 19) + "cqw");
                  card.style.setProperty("--sf-meta-w", 7 + ((index * 5) % 9) + "cqw");
                  card.style.setProperty("--sf-media-x", 5 + ((index * 17) % 48) + "cqw");
                  card.style.setProperty("--sf-media-y", -8 + ((index * 13) % 10) + "cqh");
                  card.style.setProperty("--sf-action-w", 7 + ((index * 3) % 8) + "cqw");
                  card.innerHTML =
                    '<header class="sf-card-header"><span class="sf-avatar"></span><span class="sf-identity"><span class="sf-line sf-line-primary"></span><span class="sf-line sf-line-secondary"></span></span><span class="sf-meta"></span></header><div class="sf-media"></div><footer class="sf-card-footer"><span class="sf-action"></span><span class="sf-action"></span><span class="sf-action"></span></footer>';
                  cycle.appendChild(card);
                }

                // Three identical cycles keep the viewport covered before, during,
                // and after the exact one-cycle translation. The blur trails clone
                // this single deterministic source instead of recomputing cards.
                mainColumn.appendChild(cycle);
                mainColumn.appendChild(cycle.cloneNode(true));
                mainColumn.appendChild(cycle.cloneNode(true));
                blurA.innerHTML = mainColumn.innerHTML;
                blurB.innerHTML = mainColumn.innerHTML;

                // IN stays zero. Exit none keeps OUT at zero for a clean loop;
                // an enabled exit reserves a short tail after the scroll.
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var EXIT = exit === "none" ? 0 : Math.min(0.4, duration * 0.15);
                var SCROLL_END = Math.max(0.001, duration - EXIT);
                var finalY = -cycleDistance;

                var tl = gsap.timeline({ paused: true });

                // Stepped rhythm: each step advances the feed by exactly one
                // card pitch (thumb flick: fast start, power3 decay, settle).
                // Three stacked cycles keep the viewport covered through two
                // full cycles of steps. Without cues the default doomscroll
                // synthesizes one evenly spaced flick per card, so the column
                // still travels exactly one full cycle by SCROLL_END and the
                // first and final frames stay loop-compatible.
                var pitch = cardHeight + gap;
                var steps = [];
                var autoFlick = cues.length === 0;
                if (autoFlick) {
                  for (var step = 0; step < cardCount; step += 1) {
                    steps.push((SCROLL_END / cardCount) * step);
                  }
                } else {
                  cues.forEach(function (cueAt) {
                    if (steps.length >= cardCount * 2) return;
                    var at = Math.min(SCROLL_END, cueAt);
                    if (steps.length === 0 || at > steps[steps.length - 1] + 0.01) {
                      steps.push(at);
                    }
                  });
                }
                finalY = -pitch * steps.length;
                steps.forEach(function (cueAt, index) {
                  var next = index + 1 < steps.length ? steps[index + 1] : SCROLL_END;
                  // Auto flicks keep a longer rest so each card gets a read;
                  // explicit cues keep the documented cue-mode timing.
                  var stepDuration = autoFlick
                    ? Math.max(0.05, Math.min(0.45, (next - cueAt) * 0.6))
                    : Math.max(0.05, Math.min(0.5, (next - cueAt) * 0.8, duration - cueAt));
                  var target = { y: -pitch * (index + 1) + "cqh" };
                  if (index === 0) {
                    tl.fromTo(
                      columns,
                      { y: "0cqh" },
                      {
                        y: target.y,
                        duration: stepDuration,
                        ease: "power3.out",
                      },
                      cueAt,
                    );
                  } else {
                    tl.to(columns, { y: target.y, duration: stepDuration, ease: "power3.out" }, cueAt);
                  }
                });

                // Optional departure; exit none scrolls until the frame cuts.
                if (exit === "fade") {
                  tl.to(columns, { opacity: 0, duration: EXIT, ease: "power2.in" }, SCROLL_END);
                } else if (exit === "up") {
                  tl.to(columns, { opacity: 0, duration: EXIT, ease: "power2.in" }, SCROLL_END);
                  tl.to(
                    columns,
                    { y: finalY - 10 + "cqh", duration: EXIT, ease: "power2.in" },
                    SCROLL_END,
                  );
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
        &#123; "id": "speed", "type": "enum", "role": "timing", "label": "Scroll speed", "description": "Pace of the upward feed movement.", "default": "doom", "options": [&#123; "value": "doom", "label": "Doom" &#125;, &#123; "value": "frantic", "label": "Frantic" &#125;] &#125;,
        &#123; "id": "card_count", "type": "number", "role": "content", "label": "Card count", "description": "Number of skeleton posts in one repeated feed cycle.", "default": 6, "min": 4, "max": 10, "step": 1 &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds (from mount start); each cue advances the feed by one card. Empty synthesizes evenly spaced flicks, one per card.", "default": "" &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the feed scrolls until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="scroll-feed" data-duration="4" data-fps="30">
            
    
            <div
              id="scroll-feed-clip"
              class="sf-viewport clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="sf-column sf-blur sf-blur-a" aria-hidden="true"></div>
              <div class="sf-column sf-blur sf-blur-b" aria-hidden="true"></div>
              <div class="sf-column sf-main" aria-hidden="true"></div>
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
    background: linear-gradient(180deg, var(--bg, #171b23) 0%, var(--bg, #0f1218) 100%);
    color: var(--fg, #d8dee9);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .sf-viewport {
    position: absolute;
    inset: 0;
    overflow: hidden;
    /* Soft fade at both feed edges so cards never clip hard mid-media. */
    mask-image: linear-gradient(
      180deg,
      transparent 0,
      #000 7cqh,
      #000 calc(100% - 7cqh),
      transparent 100%
    );
  }

  .sf-column {
    position: absolute;
    top: -20cqh;
    left: 12cqw;
    width: 76cqw;
    will-change: transform;
  }

  .sf-cycle {
    display: flex;
    flex-direction: column;
  }

  .sf-card {
    flex: 0 0 var(--sf-card-h);
    width: 76cqw;
    height: var(--sf-card-h);
    margin-bottom: var(--sf-gap);
    padding: var(--space-2, 2.3cqh) var(--space-2, 2.4cqw);
    overflow: hidden;
    border: 0.12cqw solid var(--border, rgba(160, 174, 192, 0.2));
    border-radius: var(--radius, 2.2cqw);
    /* Second stop derives from --surface so the gradient survives a
    host theme instead of collapsing to a flat fill. */
    background: linear-gradient(
      145deg,
      var(--surface, #29303b) 0%,
      color-mix(in srgb, var(--surface, #29303b) 76%, var(--bg, #0f1218)) 100%
    );
    box-shadow: 0 1.8cqh 4cqh rgba(0, 0, 0, 0.28);
  }

  .sf-card-header {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.4cqw);
    height: 4.4cqh;
    margin-bottom: var(--space-1, 1.5cqh);
  }

  .sf-avatar {
    flex: 0 0 auto;
    width: var(--sf-avatar);
    height: var(--sf-avatar);
    border-radius: 50%;
    background: var(--muted, #758094);
  }

  .sf-identity {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    flex-direction: column;
    gap: var(--space-1, 0.65cqh);
  }

  .sf-line, .sf-meta, .sf-action {
    display: block;
    border-radius: 99cqw;
  }

  .sf-line {
    height: 0.85cqh;
    background: var(--muted, #7d8798);
  }

  .sf-line-primary {
    width: var(--sf-primary-w);
  }

  .sf-line-secondary {
    width: var(--sf-secondary-w);
    opacity: 0.62;
  }

  .sf-meta {
    flex: 0 0 auto;
    width: var(--sf-meta-w);
    height: 0.75cqh;
    background: var(--muted, #667184);
    opacity: 0.72;
  }

  .sf-media {
    position: relative;
    height: calc(var(--sf-card-h) - 12.2cqh);
    min-height: 6cqh;
    overflow: hidden;
    border-radius: var(--radius, 1.4cqw);
    /* The media block gets its own derivation (lifted toward --fg)
    so card and media stay distinct under any --surface. */
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--surface, #29303b) 88%, var(--fg, #d8dee9)) 0%,
      color-mix(in srgb, var(--surface, #29303b) 90%, var(--bg, #0f1218)) 100%
    );
  }

  .sf-media::before {
    position: absolute;
    top: var(--sf-media-y);
    left: var(--sf-media-x);
    width: 18cqw;
    height: 18cqw;
    border-radius: 50%;
    background: var(--muted, rgba(130, 143, 160, 0.16));
    content: "";
  }

  .sf-card-footer {
    display: flex;
    align-items: center;
    gap: var(--space-2, 2.4cqw);
    height: 2cqh;
    margin-top: var(--space-1, 1.35cqh);
  }

  .sf-action {
    width: var(--sf-action-w);
    height: 0.8cqh;
    background: var(--muted, #717c8e);
    opacity: 0.72;
  }

  .sf-blur {
    z-index: 0;
    opacity: 0.1;
    filter: blur(0.28cqh);
  }

  .sf-blur-a {
    top: -19.2cqh;
    left: 11.55cqw;
  }

  .sf-blur-b {
    top: -20.8cqh;
    left: 12.45cqw;
  }

  .sf-main {
    z-index: 1;
  }
}
</style>
