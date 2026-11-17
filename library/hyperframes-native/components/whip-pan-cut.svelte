<!-- Modified Svelte adaptation of registry/components/whip-pan-cut/whip-pan-cut.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "whip-pan-cut";
                var strip = root.querySelector(".wpc-strip");
                var seam = root.querySelector(".wpc-seam");
                var blurNode = root.querySelector(".wpc-blur-node");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var direction = vars.direction === "right" ? "right" : "left";
                var rawWhipAt = vars.whip_at == null ? 0.25 : Number(vars.whip_at);
                var whipAt = Number.isFinite(rawWhipAt) ? Math.max(0, Math.min(8, rawWhipAt)) : 0.25;
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

                root.dataset.direction = direction;
                root.style.setProperty("--wpc-accent", accentColors[accent]);

                // Travel measured in px ONCE at mount (cq units inside tweened
                // transform values are a seek trap). One frame-width lands scene
                // B exactly where scene A stood.
                var travel = root.clientWidth || 1920;
                var sign = direction === "left" ? -1 : 1;

                // RETIME RANGE: 0.6s to 3s. LEAD and WHIP scale together only when
                // D is too short. REST absorbs any remainder; this is a transition
                // profile (cut-the-curve precedent), so a short clip window may
                // end while the catch is still decelerating. Never timeScale().
                var WHIP_DURATION_BASE = 0.55;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "1.2"));
                var EXIT = exit === "none" ? 0 : Math.min(0.35, duration * 0.25);
                var scale =
                  duration - EXIT < whipAt + WHIP_DURATION_BASE
                    ? (duration - EXIT) / (whipAt + WHIP_DURATION_BASE)
                    : 1;
                var WHIP_AT = whipAt * scale;
                var WHIP_DURATION = WHIP_DURATION_BASE * scale;
                var WHIP_END = WHIP_AT + WHIP_DURATION;
                var CUT_AT = WHIP_AT + WHIP_DURATION / 2;
                var OUT_START = duration - EXIT;

                // Blur cap per the motion-blur-streak recipe: peak stdDeviation
                // stays well under the 30px readability ceiling.
                var PEAK_BLUR = 16;
                var blurProxy = { v: 0 };
                function writeBlur() {
                  blurNode.setAttribute("stdDeviation", blurProxy.v + " 0");
                }
                // Seed frame 0 so a seek to t=0 renders sharp, not a stale blur.
                writeBlur();

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                // Explicit both-endpoints state makes tl.seek(0) deterministic.
                gsap.set(strip, { x: 0, y: 0, opacity: 1 });
                gsap.set(seam, { autoAlpha: 0 });

                var tl = gsap.timeline({ paused: true });

                // WHIP: one strip, one speed-ramp tween. Both scenes share the
                // transform, so seam velocity is matched by construction.
                tl.fromTo(
                  strip,
                  { x: 0 },
                  { x: sign * travel, duration: WHIP_DURATION, ease: "power3.inOut" },
                  WHIP_AT,
                );

                // Blur envelope: peaks at mid-whip (peak velocity), zero at both
                // ends. power3.in up / power3.out down mirrors the inOut ramp.
                tl.to(
                  blurProxy,
                  { v: PEAK_BLUR, duration: WHIP_DURATION / 2, ease: "power3.in", onUpdate: writeBlur },
                  WHIP_AT,
                );
                tl.to(
                  blurProxy,
                  { v: 0, duration: WHIP_DURATION / 2, ease: "power3.out", onUpdate: writeBlur },
                  WHIP_AT + WHIP_DURATION / 2,
                );

                // Seam hairline: alive only while the whip runs.
                tl.fromTo(
                  seam,
                  { autoAlpha: 0 },
                  {
                    autoAlpha: 1,
                    duration: Math.min(0.1 * scale, WHIP_DURATION),
                    ease: "power1.out",
                    immediateRender: false,
                  },
                  WHIP_AT,
                );
                tl.to(
                  seam,
                  { autoAlpha: 0, duration: 0.15 * scale, ease: "power1.in" },
                  Math.max(WHIP_AT, WHIP_END - 0.15 * scale),
                );

                tl.call(
                  function () {
                    fireSfx("whip-cut", CUT_AT);
                  },
                  [],
                  CUT_AT,
                );

                // REST: dead still on scene B until the frame cuts.

                // EXIT: only when the exit variable asks for one; exit none holds
                // the landed scene (frame roots own transitions).
                if (exit !== "none") {
                  tl.to(strip, { opacity: 0, duration: EXIT, ease: "power2.in" }, OUT_START);
                  if (exit === "up") {
                    tl.to(strip, { y: "-6cqh", duration: EXIT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Shared travel direction for the outgoing and incoming scenes.", "default": "left", "options": [&#123; "value": "left", "label": "Left" &#125;, &#123; "value": "right", "label": "Right" &#125;] &#125;,
        &#123; "id": "whip_at", "type": "number", "role": "timing", "label": "Whip start", "description": "Seconds after mount start when the whip begins.", "default": 0.25, "min": 0, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Seam hairline and default after art tint.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure of the landed scene. Default none: it rests until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="1.2" data-composition-id="whip-pan-cut" data-duration="1.2" data-fps="30">
            
    
            <div
              id="whip-pan-cut-clip"
              class="wpc-clip clip"
              data-start="0"
              data-duration="1.2"
              data-track-index="0"
            >
              <svg width="0" height="0" aria-hidden="true" style="position: absolute">
                <defs>
                  <filter id="wpc-blur" x="-50%" y="-20%" width="200%" height="140%">
                    <feGaussianBlur class="wpc-blur-node" in="SourceGraphic" stdDeviation="0 0" />
                  </filter>
                </defs>
              </svg>
    
              <div class="wpc-strip">
                <section class="wpc-panel wpc-before" aria-label="Outgoing scene">
                  <div class="wpc-slot" data-slot="before">
                    
                    <div class="wpc-default" aria-hidden="true">
                      <div class="wpc-card">
                        <div class="wpc-bar"></div>
                        <div class="wpc-line"></div>
                        <div class="wpc-line"></div>
                        <div class="wpc-line"></div>
                      </div>
                    </div>
                  </div>
                </section>
    
                <section class="wpc-panel wpc-after" aria-label="Incoming scene">
                  <div class="wpc-slot" data-slot="after">
                    
                    <div class="wpc-default" aria-hidden="true">
                      <div class="wpc-card">
                        <div class="wpc-bar"></div>
                        <div class="wpc-line"></div>
                        <div class="wpc-line"></div>
                        <div class="wpc-line"></div>
                      </div>
                    </div>
                  </div>
                </section>
    
                <div class="wpc-seam" aria-hidden="true"></div>
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

  .wpc-clip, .wpc-strip, .wpc-panel, .wpc-slot {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .wpc-clip {
    overflow: hidden;
  }

  /* The strip is the ONE mover: it carries both scenes, the transform
  tween, and the directional blur filter. No 3D lives on it, so the
  filter has nothing to flatten. */
  .wpc-strip {
    filter: url("#wpc-blur");
    will-change: transform, filter;
  }

  .wpc-panel {
    overflow: hidden;
  }

  /* Scene B docks one frame-width beyond scene A along the travel
  direction, so the pan crosses one continuous surface. */
  #root[data-direction="left"] .wpc-after {
    left: 100%;
  }

  #root[data-direction="right"] .wpc-after {
    left: -100%;
  }

  /* The seam hairline rides the boundary between the two scenes and
  is timeline-owned: visible only while the whip runs. */
  .wpc-seam {
    position: absolute;
    z-index: 3;
    top: 0;
    bottom: 0;
    width: 0.35cqw;
    transform: translateX(-50%);
    background: var(--wpc-accent, #22c55e);
    pointer-events: none;
  }

  #root[data-direction="left"] .wpc-seam {
    left: 100%;
  }

  #root[data-direction="right"] .wpc-seam {
    left: 0;
  }

  /* Caller-supplied media covers its panel edge to edge. */
  .wpc-slot > img, .wpc-slot > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  /* Token-styled default slot content: a wireframe card that reads
  muted on the before layer and brand-tinted on the after layer.
  Callers replacing slot children never see any of this. */
  .wpc-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .wpc-before .wpc-default {
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

  .wpc-after .wpc-default {
    background: linear-gradient(
      135deg,
      color-mix(in srgb, var(--brand, #22c55e) 32%, var(--surface, #172033)) 0%,
      var(--surface, #172033) 58%,
      color-mix(in srgb, var(--wpc-accent, #22c55e) 22%, var(--surface, #172033)) 100%
    );
  }

  .wpc-card {
    width: 56cqw;
    height: 56cqh;
    padding: var(--space-3, 4cqh) var(--space-3, 4cqw);
    border: 0.16cqw solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
    box-shadow: 0 2cqh 5cqw color-mix(in srgb, var(--bg, #07111f) 45%, transparent);
  }

  .wpc-after .wpc-card {
    border-color: color-mix(
      in srgb,
      var(--wpc-accent, #22c55e) 52%,
      var(--border, #334155)
    );
    background: color-mix(in srgb, var(--surface, #172033) 86%, var(--brand, #22c55e));
  }

  .wpc-bar {
    width: 34%;
    height: 4.4cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.5;
  }

  .wpc-after .wpc-bar {
    background: var(--wpc-accent, #22c55e);
    opacity: 0.92;
  }

  .wpc-line {
    height: 2.4cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.4;
  }

  .wpc-line:nth-of-type(2) {
    width: 92%;
  }

  .wpc-line:nth-of-type(3) {
    width: 68%;
  }

  .wpc-line:nth-of-type(4) {
    width: 44%;
  }

  .wpc-after .wpc-line {
    background: color-mix(in srgb, var(--brand, #22c55e) 70%, var(--fg, #f8fafc));
    opacity: 0.75;
  }
}
</style>
