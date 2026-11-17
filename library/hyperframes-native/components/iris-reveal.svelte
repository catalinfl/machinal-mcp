<!-- Modified Svelte adaptation of registry/components/iris-reveal/iris-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "iris-reveal";
                var stage = root.querySelector(".ir-stage");
                var after = root.querySelector(".ir-after");
                var rim = root.querySelector(".ir-rim");
                var rimCircle = root.querySelector(".ir-rim-circle");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function clampNumber(raw, fallback, min, max) {
                  var value = raw == null ? fallback : Number(raw);
                  if (!Number.isFinite(value)) return fallback;
                  return Math.max(min, Math.min(max, value));
                }

                // INVARIANT: iris origin always clamps into the declared 0-100 range.
                var irisX = clampNumber(vars.iris_x, 50, 0, 100);
                var irisY = clampNumber(vars.iris_y, 50, 0, 100);
                var openAt = clampNumber(vars.open_at, 0.35, 0, 8);
                var register = vars.register === "plain" ? "plain" : "color";
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
                // props, so this unit's own accent variable can shadow the
                // contract --accent token inside the subtree ("blue" is a valid
                // CSS color and would render pure blue). When the shadow is
                // present, fall back to the literal contract value.
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

                root.dataset.register = register;
                root.style.setProperty("--ir-accent", accentColors[accent]);
                root.style.setProperty("--ir-cx", irisX + "%");
                root.style.setProperty("--ir-cy", irisY + "%");

                // Geometry measured in px ONCE at mount (cq units inside tweened
                // values are a seek trap). The full radius clears the farthest
                // frame corner with a small margin so the landed frame has no
                // visible clip edge.
                var width = root.clientWidth || 1920;
                var height = root.clientHeight || 1080;
                var centerX = (irisX / 100) * width;
                var centerY = (irisY / 100) * height;
                var fullRadius =
                  Math.hypot(Math.max(centerX, width - centerX), Math.max(centerY, height - centerY)) *
                    1.02 +
                  2;

                rim.setAttribute("viewBox", "0 0 " + width + " " + height);
                rimCircle.setAttribute("cx", String(centerX));
                rimCircle.setAttribute("cy", String(centerY));
                rimCircle.setAttribute("stroke-width", String(Math.max(2, width * 0.0021)));

                // RETIME RANGE: fixed IN and OUT scale together only when D is too
                // short. HOLD is the sole elastic phase. Never use timeScale().
                var STAGE_IN_BASE = 0.32;
                var OPEN_DURATION_BASE = 1.1;
                var IN_BASE = openAt + OPEN_DURATION_BASE;
                var OUT_BASE = exit === "none" ? 0 : 0.5;

                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGE_IN = Math.min(STAGE_IN_BASE * scale, IN);
                var OPEN_AT = openAt * scale;
                var OPEN_DURATION = OPEN_DURATION_BASE * scale;
                var OPEN_END = IN;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // ONE radius proxy owns both the clip-path and the rim ring, so
                // the two edges are locked on every frame. Seeded before the
                // timeline builds so tl.seek(0) shows the closed iris.
                var radius = { value: 0 };
                function writeIris() {
                  after.style.setProperty("--ir-r", String(radius.value));
                  rimCircle.setAttribute("r", String(Math.max(0, radius.value)));
                }
                writeIris();

                // Explicit both-endpoints state makes tl.seek(0) deterministic.
                gsap.set(stage, { opacity: 0, y: 0 });
                gsap.set(rim, { autoAlpha: 0 });

                var tl = gsap.timeline({ paused: true });

                // IN: stage settle, then ONE confident iris pass (quiet register,
                // L2). The rim fades in as the pass starts and dissolves just
                // before the iris clears the frame corners.
                tl.to(stage, { opacity: 1, duration: STAGE_IN, ease: "power2.out" }, 0);
                tl.fromTo(
                  radius,
                  { value: 0 },
                  {
                    value: fullRadius,
                    duration: OPEN_DURATION,
                    ease: "power2.inOut",
                    onUpdate: writeIris,
                  },
                  OPEN_AT,
                );
                tl.fromTo(
                  rim,
                  { autoAlpha: 0 },
                  {
                    autoAlpha: 1,
                    duration: Math.min(0.18 * scale, OPEN_DURATION),
                    ease: "power1.out",
                    immediateRender: false,
                  },
                  OPEN_AT,
                );
                tl.to(
                  rim,
                  { autoAlpha: 0, duration: 0.24 * scale, ease: "power1.in" },
                  Math.max(OPEN_AT, OPEN_END - 0.24 * scale),
                );
                tl.call(
                  function () {
                    fireSfx("iris-land-soft", OPEN_END);
                  },
                  [],
                  OPEN_END,
                );

                // HOLD: deliberately still on the revealed state B.

                // OUT: only when the exit variable asks for one; exit none holds
                // the final revealed frame (frame roots own transitions).
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
        &#123; "id": "iris_x", "type": "number", "role": "layout", "label": "Iris origin X", "description": "Horizontal iris origin as a percent of the frame width.", "default": 50, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "iris_y", "type": "number", "role": "layout", "label": "Iris origin Y", "description": "Vertical iris origin as a percent of the frame height.", "default": 50, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "open_at", "type": "number", "role": "timing", "label": "Open start", "description": "Seconds after mount start when the iris begins opening.", "default": 0.35, "min": 0, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "register", "type": "enum", "role": "style", "label": "Register", "description": "Color dims and desaturates the before state so the after state lands in full color. Plain leaves both untouched.", "default": "color", "options": [&#123; "value": "color", "label": "Color" &#125;, &#123; "value": "plain", "label": "Plain" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Iris rim ring and default after art tint.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Outgoing transition. None holds the final revealed frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="iris-reveal" data-duration="3.5" data-fps="30">
            
    
            <div
              id="iris-reveal-clip"
              class="ir-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="ir-stage">
                <section class="ir-panel ir-before" aria-label="Before panel">
                  <div class="ir-slot" data-slot="before">
                    
                    <div class="ir-default" aria-hidden="true">
                      <div class="ir-card">
                        <div class="ir-bar"></div>
                        <div class="ir-line"></div>
                        <div class="ir-line"></div>
                        <div class="ir-line"></div>
                      </div>
                    </div>
                  </div>
                </section>
    
                <section class="ir-panel ir-after" aria-label="After panel">
                  <div class="ir-slot" data-slot="after">
                    
                    <div class="ir-default" aria-hidden="true">
                      <div class="ir-card">
                        <div class="ir-bar"></div>
                        <div class="ir-line"></div>
                        <div class="ir-line"></div>
                        <div class="ir-line"></div>
                      </div>
                    </div>
                  </div>
                </section>
    
                <svg class="ir-rim" aria-hidden="true">
                  <circle class="ir-rim-circle" cx="0" cy="0" r="0"></circle>
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

  .ir-clip, .ir-stage, .ir-panel, .ir-slot, .ir-rim {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .ir-clip {
    overflow: hidden;
  }

  .ir-stage {
    opacity: 0;
  }

  .ir-panel {
    overflow: hidden;
  }

  /* The after layer is revealed by one circle clip-path. --ir-r (px)
  is written by the radius proxy, the single owner of iris
  progress; --ir-cx/--ir-cy are set once at mount. */
  .ir-after {
    z-index: 2;
    clip-path: circle(calc(var(--ir-r, 0) * 1px) at var(--ir-cx, 50%) var(--ir-cy, 50%));
  }

  /* Classic register: state A reads dimmed and desaturated so state B
  lands in full color. Static CSS, never tweened. */
  #root[data-register="color"] .ir-before .ir-slot {
    filter: grayscale(1) brightness(0.76);
  }

  /* Caller-supplied media covers its panel edge to edge. */
  .ir-slot > img, .ir-slot > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* The rim ring rides the same radius proxy as the clip edge. Fixed
  stroke width in px (set at mount), fill none, no dashes. */
  .ir-rim {
    z-index: 3;
    overflow: visible;
    pointer-events: none;
  }

  .ir-rim circle {
    fill: none;
    stroke: var(--ir-accent, #22c55e);
  }

  /* Token-styled default slot content: a wireframe card that reads
  muted on the before layer and brand-tinted on the after layer.
  Callers replacing slot children never see any of this. */
  .ir-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .ir-before .ir-default {
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

  .ir-after .ir-default {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--brand, #22c55e) 32%, var(--surface, #172033)) 0%,
      var(--surface, #172033) 58%,
      color-mix(in srgb, var(--ir-accent, #22c55e) 22%, var(--surface, #172033)) 100%
    );
  }

  .ir-card {
    width: 56cqw;
    height: 56cqh;
    padding: var(--space-3, 4cqh) var(--space-3, 4cqw);
    border: 0.16cqw solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
    box-shadow: 0 2cqh 5cqw color-mix(in srgb, var(--bg, #07111f) 45%, transparent);
  }

  .ir-after .ir-card {
    border-color: color-mix(in srgb, var(--ir-accent, #22c55e) 52%, var(--border, #334155));
    background: color-mix(in srgb, var(--surface, #172033) 86%, var(--brand, #22c55e));
  }

  .ir-bar {
    width: 34%;
    height: 4.4cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .ir-after .ir-bar {
    background: var(--ir-accent, #22c55e);
    opacity: 0.92;
  }

  .ir-line {
    height: 2.4cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.4;
  }

  .ir-line:nth-of-type(2) {
    width: 92%;
  }

  .ir-line:nth-of-type(3) {
    width: 68%;
  }

  .ir-line:nth-of-type(4) {
    width: 44%;
  }

  .ir-after .ir-line {
    background: color-mix(in srgb, var(--brand, #22c55e) 70%, var(--fg, #f8fafc));
    opacity: 0.75;
  }
}
</style>
