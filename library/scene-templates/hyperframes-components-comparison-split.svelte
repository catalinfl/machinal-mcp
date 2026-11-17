<!-- Modified Svelte adaptation of registry/components/comparison-split/comparison-split.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Hardcoded because mount flattening strips data-composition-id
                // from the live root before this timeline registers.
                var compositionId = "comparison-split";
                var stage = root.querySelector(".cs-stage");
                var labelAEl = root.querySelector(".cs-before .cs-label");
                var labelBEl = root.querySelector(".cs-after .cs-label");

                // EDIT ZONE: declarations above and registry metadata change
                // together. This API owns defaults plus per-instance overrides.
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var rawSplit = vars.split == null ? 50 : Number(vars.split);
                // INVARIANT: split always clamps into the declared 0 to 100 range.
                var splitPct = Number.isFinite(rawSplit) ? Math.max(0, Math.min(100, rawSplit)) : 50;
                // INVARIANT: only horizontal or vertical reaches the renderer.
                var orientation = vars.orientation === "vertical" ? "vertical" : "horizontal";
                var labelAText = vars.labelA == null ? "" : String(vars.labelA);
                var labelBText = vars.labelB == null ? "" : String(vars.labelB);

                root.setAttribute("data-orientation", orientation);
                labelAEl.textContent = labelAText;
                labelBEl.textContent = labelBText;

                // RETIME RANGE: fixed IN and OUT scale together only when D is too
                // short. HOLD is the sole elastic phase. Never use timeScale().
                var IN_BASE = 1.4;
                var OUT_BASE = 0.5;
                var STAGE_IN_BASE = 0.32;
                var WIPE_AT_BASE = 0.25;
                var WIPE_DURATION_BASE = 1.05;
                var WIPE_END_BASE = WIPE_AT_BASE + WIPE_DURATION_BASE;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGE_IN = STAGE_IN_BASE * scale;
                var WIPE_AT = WIPE_AT_BASE * scale;
                var WIPE_DURATION = WIPE_DURATION_BASE * scale;
                var WIPE_END = WIPE_END_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // Explicit both-endpoints state makes tl.seek(0) deterministic.
                // --cs-split is the only owner of both clip and divider progress.
                gsap.set(stage, { opacity: 0, "--cs-split": 0 });

                var tl = gsap.timeline({ paused: true });

                // IN: stage settle, then one shared wipe value travels to split.
                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);
                tl.to(
                  stage,
                  { "--cs-split": splitPct, duration: WIPE_DURATION, ease: "sine.inOut" },
                  WIPE_AT,
                );
                tl.call(
                  function () {
                    fireSfx("wipe-land-soft", WIPE_END);
                  },
                  [],
                  WIPE_END,
                );

                // HOLD: deliberately steady at the target split.

                // OUT: release fade.
                tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.out" }, OUT_START);

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "split", "type": "number", "role": "layout", "label": "Split position", "description": "Target resting position of the comparison divider.", "default": 50, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "orientation", "type": "enum", "role": "layout", "label": "Orientation", "description": "Axis and direction used by the comparison wipe.", "default": "horizontal", "options": [&#123; "value": "horizontal", "label": "Horizontal" &#125;, &#123; "value": "vertical", "label": "Vertical" &#125;] &#125;,
        &#123; "id": "labelA", "type": "string", "role": "content", "label": "Before label", "description": "Caption shown on the base before panel.", "default": "Before" &#125;,
        &#123; "id": "labelB", "type": "string", "role": "content", "label": "After label", "description": "Caption shown on the revealed after panel.", "default": "After" &#125;
      ]' data-composition-id="comparison-split" data-duration="4" data-fps="30">
            
    
            <div
              id="comparison-split-clip"
              class="cs-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="cs-stage">
                <section class="cs-panel cs-before" aria-label="Before panel">
                  <div class="cs-label"></div>
                  <div class="cs-window">
                    <div class="cs-toolbar">
                      <span class="cs-dot"></span>
                      <span class="cs-dot"></span>
                      <span class="cs-dot"></span>
                    </div>
                    <div class="cs-content">
                      <div class="cs-copy">
                        <div class="cs-line"></div>
                        <div class="cs-line"></div>
                        <div class="cs-line"></div>
                      </div>
                      <div class="cs-visual"></div>
                    </div>
                  </div>
                </section>
    
                <section class="cs-panel cs-after" aria-label="After panel">
                  <div class="cs-label"></div>
                  <div class="cs-window">
                    <div class="cs-toolbar">
                      <span class="cs-dot"></span>
                      <span class="cs-dot"></span>
                      <span class="cs-dot"></span>
                    </div>
                    <div class="cs-content">
                      <div class="cs-copy">
                        <div class="cs-line"></div>
                        <div class="cs-line"></div>
                        <div class="cs-line"></div>
                      </div>
                      <div class="cs-visual"></div>
                    </div>
                  </div>
                </section>
    
                <div class="cs-divider" aria-hidden="true"></div>
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

  /* Root fills the host-owned box. Every internal measurement uses
  cqw/cqh, and every painted color comes from a theme token. */
  #root {
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #07111f);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .cs-clip, .cs-stage, .cs-panel {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .cs-clip {
    overflow: hidden;
  }

  .cs-stage {
    --cs-split: 0;
    opacity: 0;
  }

  .cs-before {
    background:
      linear-gradient(
        color-mix(in srgb, var(--border, #334155) 38%, transparent) 0.12cqw,
        transparent 0.12cqw
      )
      0 0 / 5cqw 5cqw,
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--border, #334155) 38%, transparent) 0.12cqw,
        transparent 0.12cqw
      )
      0 0 / 5cqw 5cqw,
      var(--surface, #172033);
  }

  .cs-after {
    z-index: 2;
    clip-path: inset(0 calc((100 - var(--cs-split)) * 1%) 0 0);
    background: color-mix(in srgb, var(--fg, #f8fafc) 18%, var(--surface, #172033));
  }

  .cs-window {
    position: absolute;
    left: 14cqw;
    top: 18cqh;
    width: 72cqw;
    height: 64cqh;
    overflow: hidden;
    border-radius: min(3cqw, 5cqh);
    border: 0.16cqw solid var(--border, #334155);
    background: color-mix(in srgb, var(--surface, #172033) 90%, var(--muted, #94a3b8));
    box-shadow: 0 2.2cqh 6cqw color-mix(in srgb, var(--bg, #07111f) 50%, transparent);
  }

  .cs-after .cs-window {
    border-color: color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
    background: color-mix(in srgb, var(--fg, #f8fafc) 8%, var(--surface, #172033));
    box-shadow: 0 2.2cqh 7cqw rgba(0, 0, 0, 0.18);
  }

  .cs-toolbar {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.2cqw);
    height: 12cqh;
    padding: 0 var(--space-2, 2.4cqw);
    border-bottom: 0.14cqw solid var(--border, #334155);
  }

  .cs-dot {
    width: min(2.2cqw, 3.2cqh);
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--muted, #94a3b8);
    opacity: 0.55;
  }

  .cs-after .cs-dot {
    background: var(--accent, #f8fafc);
    opacity: 1;
  }

  .cs-content {
    position: relative;
    height: 52cqh;
  }

  .cs-copy {
    position: absolute;
    left: 7cqw;
    top: 9cqh;
    width: 31cqw;
  }

  .cs-line {
    height: 2.3cqh;
    margin-bottom: var(--space-2, 2.4cqh);
    border-radius: 2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.48;
  }

  .cs-line:nth-child(1) {
    width: 94%;
  }

  .cs-line:nth-child(2) {
    width: 72%;
  }

  .cs-line:nth-child(3) {
    width: 48%;
  }

  .cs-after .cs-line {
    background: color-mix(in srgb, var(--fg, #f8fafc) 72%, transparent);
    opacity: 1;
  }

  .cs-visual {
    position: absolute;
    right: 7cqw;
    top: 7cqh;
    width: min(22cqw, 32cqh);
    aspect-ratio: 1;
    border-radius: 36% 64% 58% 42%;
    border: 0.3cqw solid var(--border, #334155);
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .cs-after .cs-visual {
    border-color: color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
    background: color-mix(in srgb, var(--fg, #f8fafc) 72%, transparent);
    box-shadow: 0 0 5cqw rgba(0, 0, 0, 0.18);
    opacity: 1;
  }

  .cs-label {
    position: absolute;
    z-index: 4;
    top: var(--space-3, 4cqh);
    padding: var(--space-1, 1.2cqh) var(--space-2, 2.2cqw);
    border: 0.14cqw solid var(--border, #334155);
    border-radius: 999cqw;
    background: var(--surface, #172033);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(3cqw, 4.2cqh);
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .cs-before .cs-label {
    right: var(--space-3, 4cqw);
    color: var(--muted, #94a3b8);
  }

  .cs-after .cs-label {
    left: var(--space-3, 4cqw);
    border-color: color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
    background: color-mix(in srgb, var(--fg, #f8fafc) 8%, var(--surface, #172033));
  }

  .cs-divider {
    position: absolute;
    z-index: 5;
    top: 0;
    bottom: 0;
    left: calc(var(--cs-split) * 1%);
    width: 0.45cqw;
    transform: translateX(-50%);
    background: var(--fg, #f8fafc);
    box-shadow:
      0 0 1.4cqw color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent),
      0 0 3cqw rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }

  .cs-divider::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(5cqw, 7cqh);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border: 0.3cqw solid var(--bg, #07111f);
    border-radius: 50%;
    background: var(--fg, #f8fafc);
    box-shadow: 0 0 2.2cqw color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent);
  }

  /* INVARIANT: vertical changes only the axis mapping. The after clip
  and divider still read the same --cs-split value. */
  #root[data-orientation="vertical"] .cs-after {
    clip-path: inset(0 0 calc((100 - var(--cs-split)) * 1%) 0);
  }

  #root[data-orientation="vertical"] .cs-before .cs-label {
    top: auto;
    right: var(--space-3, 4cqw);
    bottom: var(--space-3, 4cqh);
  }

  #root[data-orientation="vertical"] .cs-divider {
    top: calc(var(--cs-split) * 1%);
    right: 0;
    bottom: auto;
    left: 0;
    width: 100%;
    height: 0.45cqh;
    transform: translateY(-50%);
  }
}
</style>
