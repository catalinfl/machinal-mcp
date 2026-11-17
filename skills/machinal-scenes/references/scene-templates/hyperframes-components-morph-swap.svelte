<!-- Modified Svelte adaptation of registry/components/morph-swap/morph-swap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "morph-swap";
                var stage = root.querySelector(".msw-stage");
                var panelA = root.querySelector(".msw-a");
                var panelB = root.querySelector(".msw-b");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var rawSwapAt = vars.swap_at == null ? 1.4 : Number(vars.swap_at);
                // INVARIANT: swap_at always clamps into the declared 0.1-8 range.
                var swapAt = Number.isFinite(rawSwapAt) ? Math.max(0.1, Math.min(8, rawSwapAt)) : 1.4;
                // INVARIANT: only condense | reshape reaches the timeline.
                var register = vars.register === "reshape" ? "reshape" : "condense";
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
                // INVARIANT: only none | fade | up reaches the timeline.
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--msw-accent", accentColors[accent]);

                // RETIME RANGE: fixed IN and OUT scale together only when D is too
                // short. HOLD is the sole elastic phase. Never use timeScale().
                var STAGE_IN_BASE = 0.32;
                var SPAN_BASE = register === "condense" ? 0.75 : 1.05;
                var IN_BASE = swapAt + SPAN_BASE;
                var OUT_BASE = exit === "none" ? 0 : 0.5;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGE_IN = Math.min(STAGE_IN_BASE * scale, IN);
                var SWAP = swapAt * scale;
                var SWAP_END = IN;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // Explicit both-endpoints state makes tl.seek(0) deterministic:
                // A fully present, B parked hidden at its pre-morph shape.
                gsap.set(stage, { opacity: 0, y: 0 });
                gsap.set(panelA, { scale: 1, scaleX: 1, scaleY: 1, autoAlpha: 1 });
                gsap.set(panelB, { scale: 1, scaleX: 1, scaleY: 1, autoAlpha: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN part 1: the stage settles and A holds alone.
                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);

                // IN part 2: the morph, both registers on the shared 50% 50% origin.
                if (register === "condense") {
                  // A condenses toward center as B scales up through the same
                  // silhouette, 0.15s overlap (flagship close morph).
                  tl.to(
                    panelA,
                    { scale: 0.72, autoAlpha: 0, duration: 0.35 * scale, ease: "power2.in" },
                    SWAP,
                  );
                  tl.fromTo(
                    panelB,
                    { scale: 0.72, autoAlpha: 0 },
                    {
                      scale: 1,
                      autoAlpha: 1,
                      duration: 0.55 * scale,
                      ease: "back.out(1.6)",
                      immediateRender: false,
                    },
                    SWAP + 0.2 * scale,
                  );
                } else {
                  // A reshapes its silhouette on scaleX/scaleY (NEVER width or
                  // height tweens) while fading; B picks up from the same
                  // mid-morph silhouette and relaxes to its natural shape.
                  tl.to(
                    panelA,
                    { scaleX: 0.68, scaleY: 1.34, duration: 0.6 * scale, ease: "power2.inOut" },
                    SWAP,
                  );
                  tl.to(
                    panelA,
                    { autoAlpha: 0, duration: 0.45 * scale, ease: "power1.in" },
                    SWAP + 0.15 * scale,
                  );
                  tl.fromTo(
                    panelB,
                    { scaleX: 0.68, scaleY: 1.34, autoAlpha: 0 },
                    {
                      scaleX: 1,
                      scaleY: 1,
                      autoAlpha: 1,
                      duration: 0.65 * scale,
                      ease: "power2.out",
                      immediateRender: false,
                    },
                    SWAP + 0.4 * scale,
                  );
                }
                tl.call(
                  function () {
                    fireSfx("morph-land-soft", SWAP_END);
                  },
                  [],
                  SWAP_END,
                );

                // HOLD: B dead-still at its natural shape.

                // OUT: only when the exit variable asks for one; exit none holds
                // the final frame (frame roots own transitions).
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
        &#123; "id": "swap_at", "type": "number", "role": "timing", "label": "Swap start", "description": "Seconds after mount start when the morph begins.", "default": 1.4, "min": 0.1, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "register", "type": "enum", "role": "style", "label": "Register", "description": "Morph mechanic: condense shrink-fades A into B at center; reshape morphs the silhouette on scaleX/scaleY.", "default": "condense", "options": [&#123; "value": "condense", "label": "Condense" &#125;, &#123; "value": "reshape", "label": "Reshape" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Incoming card accent color.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. None holds the final frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="morph-swap" data-duration="3.5" data-fps="30">
            
    
            <div
              id="morph-swap-clip"
              class="msw-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="msw-stage">
                <section class="msw-panel msw-a" aria-label="Outgoing panel">
                  <div class="msw-slot" data-slot="a">
                    
                    <div class="msw-card" aria-hidden="true">
                      <div class="msw-bar"></div>
                      <div class="msw-line"></div>
                      <div class="msw-line"></div>
                      <div class="msw-line"></div>
                    </div>
                  </div>
                </section>
    
                <section class="msw-panel msw-b" aria-label="Incoming panel">
                  <div class="msw-slot" data-slot="b">
                    
                    <div class="msw-card" aria-hidden="true">
                      <div class="msw-bar"></div>
                      <div class="msw-line"></div>
                      <div class="msw-line"></div>
                      <div class="msw-line"></div>
                    </div>
                  </div>
                </section>
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

  .msw-clip, .msw-stage {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .msw-clip {
    overflow: hidden;
  }

  .msw-stage {
    opacity: 0;
  }

  /* Both panels stack full-bleed and center their content, so the two
  siblings share one center and one transform origin. All morph
  motion is transforms on the panel; slot content never reflows. */
  .msw-panel {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    transform-origin: 50% 50%;
  }

  /* Caller-supplied media keeps a sane footprint at center. */
  .msw-slot > img, .msw-slot > video {
    max-width: 84cqw;
    max-height: 84cqh;
    border-radius: var(--radius, 2.4cqmin);
  }

  .msw-slot {
    display: grid;
    place-items: center;
  }

  /* Token-styled default slot content: a muted wireframe card on the
  outgoing side, a taller brand-tinted card on the incoming side.
  Callers replacing slot children never see any of this. */
  .msw-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-3, 4cqh) var(--space-3, 4cqw);
    border: 0.16cqw solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
    box-shadow: 0 2cqh 5cqw color-mix(in srgb, var(--bg, #07111f) 45%, transparent);
  }

  .msw-a .msw-card {
    width: 52cqw;
    height: 46cqh;
  }

  .msw-b .msw-card {
    width: 36cqw;
    height: 62cqh;
    border-color: color-mix(
      in srgb,
      var(--msw-accent, #22c55e) 52%,
      var(--border, #334155)
    );
    background: color-mix(in srgb, var(--surface, #172033) 86%, var(--msw-accent, #22c55e));
  }

  .msw-bar {
    width: 34%;
    height: 4.4cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .msw-b .msw-bar {
    width: 46%;
    background: var(--msw-accent, #22c55e);
    opacity: 0.92;
  }

  .msw-line {
    height: 2.4cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.4;
  }

  .msw-line:nth-of-type(2) {
    width: 92%;
  }

  .msw-line:nth-of-type(3) {
    width: 68%;
  }

  .msw-line:nth-of-type(4) {
    width: 44%;
  }

  .msw-b .msw-line {
    background: color-mix(in srgb, var(--msw-accent, #22c55e) 70%, var(--fg, #f8fafc));
    opacity: 0.7;
  }
}
</style>
