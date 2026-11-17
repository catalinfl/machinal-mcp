<!-- Modified Svelte adaptation of registry/components/light-sweep-pass/light-sweep-pass.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "light-sweep-pass";
                var stage = root.querySelector(".lsp-stage");
                var band = root.querySelector(".lsp-band");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function clampNumber(raw, fallback, min, max) {
                  var value = raw == null ? fallback : Number(raw);
                  if (!Number.isFinite(value)) return fallback;
                  return Math.max(min, Math.min(max, value));
                }

                var angle = clampNumber(vars.angle, 115, 60, 160);
                var sweepAt = clampNumber(vars.sweep_at, 0.9, 0, 8);
                var strength = vars.strength === "subtle" ? "subtle" : "standard";
                var accentTokens = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentTokens, vars.accent)
                  ? vars.accent
                  : "green";
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable can shadow the contract
                // --accent token ("blue" is a valid CSS color). When the shadow is
                // present, fall back to the literal contract value.
                var shadowedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  shadowedAccent === "green" ||
                  shadowedAccent === "blue" ||
                  shadowedAccent === "violet"
                ) {
                  accentTokens.blue = "#38bdf8";
                }
                // INVARIANT: only none | fade | up reaches the timeline.
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.dataset.strength = strength;
                root.style.setProperty("--lsp-angle", String(angle));
                root.style.setProperty("--lsp-accent", accentTokens[accent]);

                // RETIME RANGE: fixed IN and OUT scale together only when D is
                // too short. HOLD is the sole elastic phase. Never timeScale().
                var SWEEP_BASE = 1.6;
                var SETTLE_BASE = 0.55;
                var STAGE_IN_BASE = 0.5;
                var IN_BASE = sweepAt + SWEEP_BASE + SETTLE_BASE;
                var OUT_BASE = exit === "none" ? 0 : 0.5;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var SWEEP = SWEEP_BASE * scale;
                var SETTLE = SETTLE_BASE * scale;
                var STAGE_IN = Math.min(STAGE_IN_BASE * scale, IN_BASE * scale);
                var SWEEP_AT = sweepAt * scale;
                var SWEEP_END = SWEEP_AT + SWEEP;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                // The light's authored waypoints: parked off-frame left, fully
                // crossed off-frame right, then the resting key in the upper
                // third of the travel. All in --light-x units (frame percent).
                var LIGHT_START = -35;
                var LIGHT_CROSSED = 118;
                var LIGHT_REST = 62;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // ONE proxy owns --light-x; every highlight, shadow, ambient
                // lift, and the band transform read it via calc in static CSS.
                var light = { x: LIGHT_START };
                function writeLight() {
                  root.style.setProperty("--light-x", light.x.toFixed(3));
                }
                writeLight();

                gsap.set(stage, { opacity: 0, y: "1.5cqh" });
                gsap.set(band, { autoAlpha: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN: the scene settles first, then one confident crossing.
                tl.to(stage, { opacity: 1, y: "0cqh", duration: STAGE_IN, ease: "power2.out" }, 0);
                tl.fromTo(
                  light,
                  { x: LIGHT_START },
                  {
                    x: LIGHT_CROSSED,
                    duration: SWEEP,
                    ease: "sine.inOut",
                    onUpdate: writeLight,
                  },
                  SWEEP_AT,
                );
                tl.fromTo(
                  band,
                  { autoAlpha: 0 },
                  {
                    autoAlpha: 1,
                    duration: Math.min(0.3 * scale, SWEEP),
                    ease: "power1.out",
                    immediateRender: false,
                  },
                  SWEEP_AT,
                );
                tl.to(
                  band,
                  { autoAlpha: 0, duration: 0.35 * scale, ease: "power1.in" },
                  Math.max(SWEEP_AT, SWEEP_END - 0.35 * scale),
                );

                // The settle: the band is gone; the key light glides back to its
                // resting position and the per-element shading follows it there.
                tl.to(
                  light,
                  { x: LIGHT_REST, duration: SETTLE, ease: "power2.out", onUpdate: writeLight },
                  SWEEP_END,
                );
                tl.call(
                  function () {
                    fireSfx("light-settle-soft", IN);
                  },
                  [],
                  IN,
                );

                // HOLD: deliberately still under the settled key.

                // OUT: only when the exit variable asks for one.
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
        &#123; "id": "angle", "type": "number", "role": "style", "label": "Angle", "description": "Band and highlight gradient angle in degrees.", "default": 115, "min": 60, "max": 160, "step": 1, "unit": "deg" &#125;,
        &#123; "id": "sweep_at", "type": "number", "role": "timing", "label": "Sweep start", "description": "Seconds after mount start when the band starts crossing.", "default": 0.9, "min": 0, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "strength", "type": "enum", "role": "style", "label": "Strength", "description": "Band opacity and highlight bloom multiplier.", "default": "standard", "options": [&#123; "value": "subtle", "label": "Subtle" &#125;, &#123; "value": "standard", "label": "Standard" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Tint inside the band and the highlight blooms.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. None holds the settled key.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="light-sweep-pass" data-duration="4" data-fps="30">
            
    
            <div
              id="light-sweep-pass-clip"
              class="lsp-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="lsp-stage">
                <div class="lsp-scene" data-slot="scene">
                  
                  <div class="lsp-default" aria-hidden="true">
                    <div class="lsp-hero" data-lit style="--lsp-x: 50">
                      <div class="lsp-hero-bar"></div>
                      <div class="lsp-hero-line"></div>
                      <div class="lsp-hero-line"></div>
                    </div>
                    <div class="lsp-row">
                      <div class="lsp-card" data-lit style="--lsp-x: 31">
                        <div class="lsp-dot"></div>
                        <div class="lsp-line"></div>
                        <div class="lsp-line"></div>
                      </div>
                      <div class="lsp-card" data-lit style="--lsp-x: 50">
                        <div class="lsp-dot"></div>
                        <div class="lsp-line"></div>
                        <div class="lsp-line"></div>
                      </div>
                      <div class="lsp-card" data-lit style="--lsp-x: 69">
                        <div class="lsp-dot"></div>
                        <div class="lsp-line"></div>
                        <div class="lsp-line"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="lsp-ambient" aria-hidden="true"></div>
                <div class="lsp-band" aria-hidden="true"></div>
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

  /* --light-x starts off-frame left; the timeline is its only
  writer. --lsp-angle and --lsp-strength are set once at mount. */
  #root {
    --light-x: -35;
    --lsp-angle: 115;
    --lsp-strength: 1;
    position: absolute;
    inset: 0;
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .lsp-clip, .lsp-stage, .lsp-scene, .lsp-ambient, .lsp-band {
    position: absolute;
    inset: 0;
  }

  .lsp-clip {
    overflow: hidden;
  }

  .lsp-stage {
    opacity: 0;
  }

  .lsp-scene {
    overflow: hidden;
  }

  /* Every lit element derives its whole treatment from the ONE
  --light-x scalar: distance d to the band, |d| via max(d, -d),
  a 0..1 proximity bloom, a shadow that slides away from the
  light and deepens as the band passes. Elements opt in with
  data-lit and an inline --lsp-x (center along the sweep axis,
    percent of frame width). */
  [data-lit] {
    --lsp-d: calc(var(--light-x) - var(--lsp-x, 50));
    --lsp-abs: max(var(--lsp-d), calc(-1 * var(--lsp-d)));
    --lsp-glow: clamp(0, calc(1 - var(--lsp-abs) / 26), 1);
    position: relative;
    box-shadow: calc(clamp(-30, var(--lsp-d), 30) * -0.05cqw)
    calc(0.8cqh + var(--lsp-glow) * 0.7cqh) calc(2.2cqh + var(--lsp-glow) * 2.4cqh)
    color-mix(in srgb, #000000 26%, transparent);
  }

  /* The highlight bloom: a static angle-matched gradient whose
  opacity is the proximity term. No transitions, no tweens. */
  [data-lit]::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(
      calc(var(--lsp-angle) * 1deg),
      color-mix(in srgb, #ffffff 86%, var(--lsp-accent, #22c55e)) 0%,
      transparent 62%
    );
    opacity: calc(var(--lsp-glow) * 0.32 * var(--lsp-strength));
  }

  /* Ambient lift: the scene starts a touch dim and brightens for
  good once the band has entered the frame. Monotonic in
  --light-x, so the settle never re-dims it. */
  .lsp-ambient {
    pointer-events: none;
    background: #000000;
    opacity: calc(clamp(0, (26 - var(--light-x)) / 130, 0.16) * var(--lsp-strength));
  }

  /* The band: an oversized angle-matched gradient sheet that only
  ever translates along X, driven by the same scalar. Screen
  blend keeps it a light, never a paint. */
  .lsp-band {
    inset: -55%;
    pointer-events: none;
    mix-blend-mode: screen;
    background: linear-gradient(
      calc(var(--lsp-angle) * 1deg),
      transparent 36%,
      color-mix(in srgb, #ffffff 24%, transparent) 46%,
      color-mix(in srgb, #ffffff 78%, var(--lsp-accent, #22c55e)) 50%,
      color-mix(in srgb, #ffffff 24%, transparent) 54%,
      transparent 64%
    );
    opacity: 0;
    transform: translateX(calc((var(--light-x) - 50) * 1.4cqw));
    will-change: transform, opacity;
  }

  #root[data-strength="subtle"] {
    --lsp-strength: 0.55;
  }

  /* ---------- default slot scene: token hero + three cards ---------- */

  .lsp-default {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto auto;
    align-content: center;
    justify-items: center;
    row-gap: var(--space-3, 5cqh);
    padding: var(--space-3, 6cqh) 10cqw;
    background: linear-gradient(
      calc(var(--lsp-angle) * 1deg),
      color-mix(in srgb, var(--fg, #f8fafc) 3%, var(--bg, #0b0c0e)) 0%,
      var(--bg, #0b0c0e) 55%,
      color-mix(in srgb, #000000 6%, var(--bg, #0b0c0e)) 100%
    );
  }

  .lsp-hero {
    display: grid;
    align-content: center;
    row-gap: var(--space-2, 2.4cqh);
    width: 58cqw;
    height: 30cqh;
    padding: var(--space-3, 4cqh) var(--space-3, 3cqw);
    border: 0.16cqw solid var(--border, #343a46);
    border-radius: var(--radius, 2.4cqmin);
    background: var(--surface, #14171c);
  }

  .lsp-hero-bar {
    width: 46%;
    height: 4.6cqh;
    border-radius: 1.4cqh;
    background: color-mix(in srgb, var(--fg, #f8fafc) 82%, var(--surface, #14171c));
  }

  .lsp-hero-line {
    height: 2.2cqh;
    border-radius: 1.1cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.55;
  }

  .lsp-hero-line:nth-of-type(3) {
    width: 72%;
  }

  .lsp-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: var(--space-2, 2cqw);
    width: 58cqw;
  }

  .lsp-card {
    display: grid;
    align-content: start;
    row-gap: var(--space-1, 1.6cqh);
    height: 24cqh;
    padding: var(--space-2, 2.6cqh) var(--space-2, 1.6cqw);
    border: 0.16cqw solid var(--border, #343a46);
    border-radius: var(--radius, 2.4cqmin);
    background: var(--surface, #14171c);
  }

  .lsp-dot {
    width: 3.4cqh;
    height: 3.4cqh;
    border-radius: 50%;
    background: color-mix(in srgb, var(--lsp-accent, #22c55e) 72%, var(--surface, #14171c));
  }

  .lsp-line {
    height: 1.9cqh;
    border-radius: 1cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .lsp-line:nth-of-type(3) {
    width: 64%;
  }
}
</style>
