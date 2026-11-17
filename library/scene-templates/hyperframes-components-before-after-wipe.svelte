<!-- Modified Svelte adaptation of registry/components/before-after-wipe/before-after-wipe.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal id: mount flattening strips data-composition-id from the
                // live root before this timeline registers.
                var compositionId = "before-after-wipe";
                var stage = root.querySelector(".baw-stage");
                var divider = root.querySelector(".baw-divider");
                var chipA = root.querySelector(".baw-chip-a");
                var chipB = root.querySelector(".baw-chip-b");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var labelA = vars.label_a == null ? "Before" : String(vars.label_a);
                var labelB = vars.label_b == null ? "After" : String(vars.label_b);
                var rawSplit = vars.rest_split == null ? 50 : Number(vars.rest_split);
                // INVARIANT: rest_split always clamps into the declared 0-100 range.
                var restSplit = Number.isFinite(rawSplit) ? Math.max(0, Math.min(100, rawSplit)) : 50;
                var rawWipeAt = vars.wipe_at == null ? 0.25 : Number(vars.wipe_at);
                var wipeAt = Number.isFinite(rawWipeAt) ? Math.max(0, Math.min(8, rawWipeAt)) : 0.25;
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable shadows the contract
                // --accent token inside the subtree ("blue" is a valid CSS color
                // and would render pure blue). When the shadow is present, fall
                // back to the literal contract value instead of var(--accent).
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentColors.blue = "#38bdf8";
                }
                // INVARIANT: only none | fade | up reaches the timeline.
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                chipA.textContent = labelA;
                chipB.textContent = labelB;
                root.style.setProperty("--baw-accent", accentColors[accent]);

                // RETIME RANGE: fixed IN and OUT scale together only when D is too
                // short. HOLD is the sole elastic phase. Never use timeScale().
                var STAGE_IN_BASE = 0.32;
                var WIPE_DURATION_BASE = 1.05;
                var IN_BASE = wipeAt + WIPE_DURATION_BASE;
                var OUT_BASE = exit === "none" ? 0 : 0.5;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGE_IN = Math.min(STAGE_IN_BASE * scale, IN);
                var WIPE_AT = wipeAt * scale;
                var WIPE_DURATION = WIPE_DURATION_BASE * scale;
                var WIPE_END = IN;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // Explicit both-endpoints state makes tl.seek(0) deterministic.
                // --baw-split is the only owner of both clip and divider progress.
                // The divider starts hidden: at split 0 its knob would render
                // half-clipped at the frame edge for the whole lead-in.
                gsap.set(stage, { opacity: 0, y: 0, "--baw-split": 0 });
                gsap.set(divider, { autoAlpha: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN: stage settle, then ONE wipe pass travels to rest_split and
                // stays there. The divider fades in as it departs the left edge.
                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);
                tl.to(
                  stage,
                  { "--baw-split": restSplit, duration: WIPE_DURATION, ease: "sine.inOut" },
                  WIPE_AT,
                );
                tl.fromTo(
                  divider,
                  { autoAlpha: 0 },
                  {
                    autoAlpha: 1,
                    duration: Math.min(0.22 * scale, WIPE_DURATION),
                    ease: "power1.out",
                    immediateRender: false,
                  },
                  WIPE_AT,
                );
                tl.call(
                  function () {
                    fireSfx("wipe-land-soft", WIPE_END);
                  },
                  [],
                  WIPE_END,
                );

                // HOLD: deliberately steady at the resting split.

                // OUT: only when the exit variable asks for one; exit none holds
                // the final comparison frame (frame roots own transitions).
                if (exit !== "none") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(stage, { y: "-6cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "label_a", "type": "string", "role": "content", "label": "Before label", "description": "Chip shown on the base before panel. Blank hides the chip.", "default": "Before" &#125;,
        &#123; "id": "label_b", "type": "string", "role": "content", "label": "After label", "description": "Chip shown on the revealed after panel. Blank hides the chip.", "default": "After" &#125;,
        &#123; "id": "rest_split", "type": "number", "role": "layout", "label": "Resting split", "description": "Divider resting position after the wipe lands.", "default": 50, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "wipe_at", "type": "number", "role": "timing", "label": "Wipe start", "description": "Seconds after mount start when the wipe begins.", "default": 0.25, "min": 0, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Divider handle and after chip color.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. None holds the final comparison frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="before-after-wipe" data-duration="4" data-fps="30">
            
    
            <div
              id="before-after-wipe-clip"
              class="baw-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="baw-stage">
                <section class="baw-panel baw-before" aria-label="Before panel">
                  <div class="baw-slot" data-slot="before">
                    
                    <div class="baw-default" aria-hidden="true">
                      <div class="baw-card">
                        <div class="baw-bar"></div>
                        <div class="baw-line"></div>
                        <div class="baw-line"></div>
                        <div class="baw-line"></div>
                      </div>
                    </div>
                  </div>
                  <div class="baw-chip baw-chip-a"></div>
                </section>
    
                <section class="baw-panel baw-after" aria-label="After panel">
                  <div class="baw-slot" data-slot="after">
                    
                    <div class="baw-default" aria-hidden="true">
                      <div class="baw-card">
                        <div class="baw-bar"></div>
                        <div class="baw-line"></div>
                        <div class="baw-line"></div>
                        <div class="baw-line"></div>
                      </div>
                    </div>
                  </div>
                  <div class="baw-chip baw-chip-b"></div>
                </section>
    
                <div class="baw-divider" aria-hidden="true"></div>
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

  /* Root fills the host-owned box. Internal measurements use cqw/cqh
  and every painted color comes from a contract token. */
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

  .baw-clip, .baw-stage, .baw-panel, .baw-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .baw-clip {
    overflow: hidden;
  }

  .baw-stage {
    --baw-split: 0;
    opacity: 0;
  }

  .baw-panel {
    overflow: hidden;
  }

  /* The after layer wipes over the base via one clip-path driven by
  --baw-split, the single owner of wipe progress. */
  .baw-after {
    z-index: 2;
    clip-path: inset(0 calc((100 - var(--baw-split)) * 1%) 0 0);
  }

  /* Caller-supplied media covers its panel edge to edge. */
  .baw-slot > img, .baw-slot > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Token-styled default slot content: a wireframe card that reads
  muted on the before layer and brand-tinted on the after layer.
  Callers replacing slot children never see any of this. */
  .baw-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .baw-before .baw-default {
    background:
      linear-gradient(
        color-mix(in srgb, var(--border, #334155) 34%, transparent) 0.12cqw,
        transparent 0.12cqw
      )
      0 0 / 5cqw 5cqw,
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--border, #334155) 34%, transparent) 0.12cqw,
        transparent 0.12cqw
      )
      0 0 / 5cqw 5cqw,
      var(--surface, #172033);
  }

  .baw-after .baw-default {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--brand, #22c55e) 32%, var(--surface, #172033)) 0%,
      var(--surface, #172033) 58%,
      color-mix(in srgb, var(--baw-accent, #22c55e) 22%, var(--surface, #172033)) 100%
    );
  }

  .baw-card {
    width: 56cqw;
    height: 56cqh;
    padding: var(--space-3, 4cqh) var(--space-3, 4cqw);
    border: 0.16cqw solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
    box-shadow: 0 2cqh 5cqw color-mix(in srgb, var(--bg, #07111f) 45%, transparent);
  }

  .baw-after .baw-card {
    border-color: color-mix(
      in srgb,
      var(--baw-accent, #22c55e) 52%,
      var(--border, #334155)
    );
    background: color-mix(in srgb, var(--surface, #172033) 86%, var(--brand, #22c55e));
  }

  .baw-bar {
    width: 34%;
    height: 4.4cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .baw-after .baw-bar {
    background: var(--baw-accent, #22c55e);
    opacity: 0.92;
  }

  .baw-line {
    height: 2.4cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.4;
  }

  .baw-line:nth-of-type(2) {
    width: 92%;
  }

  .baw-line:nth-of-type(3) {
    width: 68%;
  }

  .baw-line:nth-of-type(4) {
    width: 44%;
  }

  .baw-after .baw-line {
    background: color-mix(in srgb, var(--brand, #22c55e) 70%, var(--fg, #f8fafc));
    opacity: 0.75;
  }

  /* Label chips live outside the slots so they always render above
  caller content. The after chip is clipped with its own panel, so
  it appears only once the wipe has passed it. */
  .baw-chip {
    position: absolute;
    z-index: 4;
    top: var(--space-3, 4cqh);
    padding: var(--space-1, 1.2cqh) var(--space-2, 2.2cqw);
    border: 0.14cqw solid var(--border, #334155);
    border-radius: 999cqw;
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
    color: var(--muted, #94a3b8);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(3cqw, 4.2cqh);
    font-weight: 600;
    letter-spacing: 0.08em;
    line-height: 1;
    text-transform: uppercase;
    white-space: nowrap;
  }

  .baw-chip:empty {
    display: none;
  }

  .baw-before .baw-chip {
    right: var(--space-3, 4cqw);
  }

  .baw-after .baw-chip {
    left: var(--space-3, 4cqw);
    border-color: color-mix(
      in srgb,
      var(--baw-accent, #22c55e) 62%,
      var(--border, #334155)
    );
    color: var(--fg, #f8fafc);
  }

  .baw-divider {
    position: absolute;
    z-index: 5;
    top: 0;
    bottom: 0;
    left: calc(var(--baw-split) * 1%);
    width: 0.4cqw;
    transform: translateX(-50%);
    background: var(--fg, #f8fafc);
    pointer-events: none;
  }

  .baw-divider::after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    width: min(5cqw, 7cqh);
    aspect-ratio: 1;
    transform: translate(-50%, -50%);
    border: 0.3cqw solid var(--baw-accent, #22c55e);
    border-radius: 50%;
    background: var(--fg, #f8fafc);
  }
}
</style>
