<!-- Modified Svelte adaptation of registry/components/oversized-cursor/oversized-cursor.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              // NOTE: once mounted, __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement is the HOST page's
              // root element, not this file's own (the mount contract discards
              // this file's head and html elements after the loader reads declared
              // variables/duration once, before cloning). html.getAttribute(...)
              // below therefore resolves to null under mount, and every read
              // falls through to its inline default (55 / 55 / "Generate" /
              // "light"), which match this file's own declared defaults above.
              var html = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              var root = document.getElementById("root");
              var cursor = document.getElementById("oc-cursor");
              var target = document.getElementById("oc-target");
              var targetLabel = document.getElementById("oc-target-label");

              // Declared defaults, then the render/preview engine's override object.
              var DEFAULTS = {};
              try {
                JSON.parse(html.getAttribute("data-composition-variables") || "[]").forEach(
                  function (variable) {
                    DEFAULTS[variable.id] = variable.default;
                  },
                );
              } catch (error) {
                /* malformed declaration falls back to hardcoded defaults below */
              }
              // Under mount, the runtime resolves this file's own declared
              // variables merged with the host clip's per-instance
              // data-variable-values through a scoped __hfHost,
              // shadowed in just for this file's script. __hfHost.variables
              // stays in the merge too, as a raw fallback for the (non-mount)
              // case where this file is driven by an older render/preview path.
              var scopedVariables = {};
              try {
                if (__hfHost && typeof __hfHost.getVariables === "function") {
                  scopedVariables = __hfHost.getVariables() || {};
                }
              } catch (error) {
                /* no scoped variables API in this context, fall through */
              }
              var vars = Object.assign({}, DEFAULTS, __hfHost.variables || {}, scopedVariables);

              function clampPercent(value, fallback) {
                var n = Number(value);
                if (!isFinite(n)) n = fallback;
                return Math.max(0, Math.min(100, n));
              }

              // Hardcoded per the mount contract: deriving the id from the document
              // returns null once the compositor rewrites the wrapper's attributes,
              // which registers the timeline under "null" and breaks seek binding.
              var compositionId = "oversized-cursor";
              var duration = Math.max(
                0.001,
                parseFloat(
                  root.dataset.duration || html.getAttribute("data-composition-duration") || "2.6",
                ),
              );
              var variant = vars.cursor_variant === "dark" ? "dark" : "light";
              var targetX = clampPercent(vars.target_x, 55);
              var targetY = clampPercent(vars.target_y, 55);
              var clickLabel = String(vars.click_label || "Generate");
              var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
              var stage = root.querySelector(".oc-stage");

              cursor.setAttribute("data-variant", variant);
              targetLabel.textContent = clickLabel;
              target.style.left = targetX + "%";
              target.style.top = targetY + "%";

              // Motion runs on transforms only (x/y px), never left/top: layout
              // props snap to integer device pixels under the seek-by-frame
              // capture engine and stutter on slow/eased motion. Stage size is
              // read once, synchronously, at load (deterministic: fixed viewport
              // per render, no resize mid-render) to convert the percent-based
              // target/off-screen positions (percent of the HOST box, not a fixed
              // 1920 stage) into the px x/y GSAP needs.
              var stageW = root.clientWidth || 1920;
              var stageH = root.clientHeight || 1080;
              function xAt(percent) {
                return (percent / 100) * stageW;
              }
              function yAt(percent) {
                return (percent / 100) * stageH;
              }

              // Tip-targeting: the family arrow's tip sits at (5/24, 3/24) of its box.
              // Anchoring the box by that offset makes every x/y below place the TIP.
              gsap.set(cursor, { xPercent: -20.83, yPercent: -12.5 });
              gsap.set(target, { xPercent: -50, yPercent: -50, scale: 1 });

              // entry and exit keep fixed durations; both shrink proportionally only
              // when the composition is too short to fit them.
              var IN_BASE = 1.02; // 0.5s glide + 0.2s aim + 0.1s press + 0.22s release
              var OUT_BASE = 0.4;
              var totalBase = IN_BASE + OUT_BASE;
              var IN = IN_BASE;
              var OUT = OUT_BASE;
              if (duration < totalBase) {
                var shrink = duration / totalBase;
                IN = IN_BASE * shrink;
                OUT = OUT_BASE * shrink;
              }
              var HOLD = Math.max(0, duration - (IN + OUT));
              var OUT_AT = IN + HOLD;
              var shrinkFactor = IN / IN_BASE;

              var glideDur = 0.5 * shrinkFactor;
              var clickInDur = 0.1 * shrinkFactor;
              var clickOutDur = 0.22 * shrinkFactor;
              // the click lands at a fixed offset into the entry, never in the stretchable hold.
              var CLICK_AT = (0.5 + 0.2) * shrinkFactor;
              var TIP_ORIGIN = "20.83% 12.5%";

              var offX = xAt(48);
              var offY = yAt(116); // resting pose IS off-screen, below the stage

              var tl = gsap.timeline({ paused: true });

              // ---- IN: off-screen entry, one continuous vector, aim, then the tap ----
              tl.set(cursor, { scale: 1 });
              tl.set(target, { "--oc-ignite": 0 });
              tl.fromTo(
                cursor,
                { x: offX, y: offY },
                { x: xAt(targetX), y: yAt(targetY), duration: glideDur, ease: "power3.out" },
                0,
              );
              tl.to(
                cursor,
                { scale: 0.9, duration: clickInDur, ease: "power2.in", transformOrigin: TIP_ORIGIN },
                CLICK_AT,
              );
              tl.to(
                cursor,
                { scale: 1, duration: clickOutDur, ease: "power2.out", transformOrigin: TIP_ORIGIN },
                CLICK_AT + clickInDur,
              );

              // ---- the click switches the target on, same frame as the release ----
              tl.to(target, { scale: 0.96, duration: clickInDur, ease: "power2.in" }, CLICK_AT);
              tl.to(
                target,
                { scale: 1, duration: clickOutDur, ease: "power2.out" },
                CLICK_AT + clickInDur,
              );
              tl.to(
                target,
                { "--oc-ignite": 1, duration: 0.3, ease: "power2.out" },
                CLICK_AT + clickInDur,
              );

              // ---- HOLD (elastic): settle just below the target, still pointing at it ----
              var driftDur = Math.min(0.4, HOLD);
              if (driftDur > 0.05) {
                var cq = stageW / 100;
                tl.to(
                  cursor,
                  {
                    x: xAt(targetX) + 2.5 * cq,
                    y: yAt(targetY) + 2.1 * cq,
                    duration: driftDur,
                    ease: "power2.inOut",
                  },
                  IN,
                );
              }

              // ---- OUT: leave the frame, physically, never a fade-in-place ----
              tl.to(cursor, { y: yAt(120), duration: OUT, ease: "power2.in" }, OUT_AT);

              // Optional whole-stage departure on top of the cursor's own exit;
              // exit none leaves the ignited target until the frame cuts.
              if (exit === "fade") {
                tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_AT);
              } else if (exit === "up") {
                tl.to(stage, { opacity: 0, y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_AT);
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
        &#123; "id": "cursor_variant", "type": "enum", "role": "style", "label": "Cursor fill", "default": "light", "options": [ &#123; "value": "light", "label": "Light (white body)" &#125;, &#123; "value": "dark", "label": "Dark (near-black body)" &#125; ] &#125;,
        &#123; "id": "target_x", "type": "number", "role": "layout", "label": "Target X", "default": 55, "min": 15, "max": 85, "step": 1, "unit": "%" &#125;,
        &#123; "id": "target_y", "type": "number", "role": "layout", "label": "Target Y", "default": 55, "min": 15, "max": 85, "step": 1, "unit": "%" &#125;,
        &#123; "id": "click_label", "type": "string", "role": "content", "label": "Click label", "default": "Generate" &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional whole-stage departure. Default none: the ignited target stays until the frame cuts.", "default": "none", "options": [ &#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125; ] &#125;
      ]' data-composition-duration="2.6" data-composition-id="oversized-cursor" data-duration="2.6">
            <div class="oc-stage">
              <div class="oc-target" id="oc-target">
                <div class="oc-target-row">
                  <svg class="oc-target-check" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span class="oc-target-label" id="oc-target-label"></span>
                </div>
              </div>
              <div class="oc-cursor" id="oc-cursor" data-variant="light" aria-hidden="true">
                <svg class="oc-cursor-svg" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 3 L5 19 L9 15 L12 22 L15 20.5 L11.5 14 L18 14 Z" />
                </svg>
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

  /* Root is styled by #root, never a class: the compositor scopes CSS to
  [data-composition-id="oversized-cursor"] as a descendant selector, so a
  rule keyed on the root's own class would never match the root itself.

  Elastic and position-blind: fills whatever box the host slot gives it
  (inset:0), owns its own stacking + container-query context, no
  position:fixed anywhere in this file. */
  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    isolation: isolate;
    container-type: size;
    container-name: oc-stage;
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .oc-stage {
    position: absolute;
    inset: 0;
    /* Transparent by design: this actor overlays whatever scene it is
    dropped into. demo.html supplies its own backdrop around it. */
  }

  /* EDIT ZONE: target look. Safe to retheme via tokens; keep it a simple,
  legible UI surface so the click reaction reads clearly. */
  .oc-target {
    position: absolute;
    left: 50%;
    top: 50%;
    padding: var(--space-2, 0.6cqw) var(--space-3, 1cqw);
    border-radius: var(--radius, 0.55cqw);
    border: 1px solid var(--border, rgba(0, 0, 0, 0.1));
    background: color-mix(
      in srgb,
      var(--surface, #f8fafc) calc((1 - var(--oc-ignite, 0)) * 100%),
      var(--brand, #0a84ff) calc(var(--oc-ignite, 0) * 100%)
    );
    box-shadow:
      0 1px 2px rgba(0, 0, 0, 0.08),
      0 0.3cqw 0.8cqw rgba(0, 0, 0, 0.08);
    --oc-ignite: 0;
    z-index: 10;
  }

  /* The check's slot is always laid out; idle, the row shifts left by half of it
  so the label sits centred, and the check slides in without a layout change. */
  .oc-target-row {
    display: flex;
    align-items: center;
    gap: 0.45cqw;
    transform: translateX(calc((var(--oc-ignite, 0) - 1) * 0.725cqw));
  }

  .oc-target-check {
    width: 1cqw;
    height: 1cqw;
    min-width: 14px;
    min-height: 14px;
    flex: none;
    fill: none;
    stroke: var(--fg, #ffffff);
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: clamp(0, var(--oc-ignite, 0), 1);
    transform: scale(calc(0.5 + var(--oc-ignite, 0) * 0.5));
  }

  .oc-target-label {
    font-size: clamp(12px, 1cqw, 20px);
    font-weight: 600;
    line-height: 1;
    white-space: nowrap;
    color: color-mix(
      in srgb,
      var(--fg, #0f172a) calc((1 - var(--oc-ignite, 0)) * 100%),
      var(--fg, #ffffff) calc(var(--oc-ignite, 0) * 100%)
    );
  }

  /* 224px at 1920 wide: the family's 64u arrow at 3.5x, shadow scaled with it. */
  .oc-cursor {
    position: absolute;
    left: 0;
    top: 0;
    width: 11.67cqw;
    height: 11.67cqw;
    pointer-events: none;
    will-change: transform;
    filter: drop-shadow(0 0.52cqw 0.73cqw rgba(0, 0, 0, 0.3));
    z-index: 20;
  }

  .oc-cursor-svg {
    display: block;
    width: 100%;
    height: 100%;
    stroke-linejoin: round;
    stroke-linecap: round;
  }

  /* EDIT ZONE: the two house-convention fill pairings. Pick per scene
  contrast, keep it constant per film. */
  .oc-cursor[data-variant="light"] .oc-cursor-svg {
    fill: #ffffff;
    stroke: #141414;
    stroke-width: 1.4;
  }
  .oc-cursor[data-variant="dark"] .oc-cursor-svg {
    fill: #1c1c1c;
    stroke: #ffffff;
    stroke-width: 1.4;
  }
}
</style>
