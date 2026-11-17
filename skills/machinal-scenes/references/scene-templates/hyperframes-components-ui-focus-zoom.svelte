<!-- Modified Svelte adaptation of registry/components/ui-focus-zoom/ui-focus-zoom.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".ufz-stage");
                var world = root.querySelector(".ufz-world");
                var surface = root.querySelector(".ufz-surface");
                var halo = root.querySelector(".ufz-halo");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function num(value, fallback, min, max) {
                  var parsed = parseFloat(value);
                  if (!isFinite(parsed)) parsed = fallback;
                  return Math.min(max, Math.max(min, parsed));
                }

                var anchorX = num(vars.anchor_x, 64, 0, 100);
                var anchorY = num(vars.anchor_y, 36, 0, 100);
                var zoom = num(vars.zoom, 1.6, 1, 3);
                var zoomAt = num(vars.zoom_at, 1.4, 0, 30);
                var haloOn = vars.halo !== "hide";
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
                var exitMode = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--ufz-accent", accentColors[accent]);

                // SLOT. Caller templates live at HOST DOCUMENT level (the mount
                // wipes host-clip children, and templates never render). The
                // scoped `document` proxy filters queries to this composition's
                // subtree, so the lookup deliberately goes through ownerDocument.
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector('template[data-slot="ui-focus-zoom-screen"]');
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  surface.querySelector(".ufz-skel").remove();
                  surface.appendChild(hostDoc.importNode(slotTemplate.content, true));
                }

                /* ===== Camera (camera-servo law): translate(x, y) scale(S) on the
                   ONE world wrapper. Translate percentages resolve against the
                   world's own box, which fills the viewport, so a world point at
                   offset o percent from center lands at S * o + T and the target
                   transform is T = -(anchor - 50) * S, no measurement needed.
                   The pan is clamped so the scaled world always covers the
                   viewport (|T| <= 50 * (S - 1) minus the drift amplitude). ===== */
                var DRIFT_X = 0.16;
                var DRIFT_Y = 0.11;
                var panMax = Math.max(0, 50 * (zoom - 1) - Math.max(DRIFT_X, DRIFT_Y) - 0.2);
                var targetX = Math.min(panMax, Math.max(-panMax, -(anchorX - 50) * zoom));
                var targetY = Math.min(panMax, Math.max(-panMax, -(anchorY - 50) * zoom));

                var cam = { s: 1, x: 0, y: 0 };
                var drift = { p: 0, dx: 0, dy: 0 };
                function applyCamera() {
                  world.style.transform =
                    "translate(" +
                    (cam.x + drift.dx) +
                    "%, " +
                    (cam.y + drift.dy) +
                    "%) scale(" +
                    cam.s +
                    ")";
                }
                applyCamera();

                // Halo pinned to the anchor in world space; it rides the camera.
                // Explicit both-endpoint state BEFORE the timeline exists: the
                // bloom fromTo sits mid-timeline, so without this set a seek that
                // lands before the cue would show the halo unstyled.
                halo.style.left = anchorX + "%";
                halo.style.top = anchorY + "%";
                if (!haloOn) halo.remove();
                else
                  gsap.set(halo, {
                    opacity: 0,
                    scale: 0.55,
                    xPercent: -50,
                    yPercent: -50,
                    transformOrigin: "50% 50%",
                  });

                // Envelope: fixed IN/ZOOM/OUT, elastic HOLD, never time-scaled.
                var IN_BASE = 0.9;
                var ZOOM_BASE = 1.1;
                var OUT_BASE = exitMode === "none" ? 0 : 0.5;
                var STILLNESS = 0.35;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var totalBase = IN_BASE + ZOOM_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var ZOOM = ZOOM_BASE * scale;
                var OUT = OUT_BASE * scale;
                var OUT_START = duration - OUT;

                // The camera departs on its cue, clamped so the move never fights
                // the entrance or the exit.
                var zoomStart = Math.min(Math.max(zoomAt, IN), Math.max(IN, OUT_START - ZOOM - 0.05));

                var tl = gsap.timeline({ paused: true });

                // IN: one settle. Rise + soft scale + fade, smooth ease-out.
                tl.fromTo(
                  stage,
                  { opacity: 0, y: "4.5cqh", scale: 0.965, transformOrigin: "50% 60%" },
                  { opacity: 1, y: "0cqh", scale: 1, duration: IN, ease: "power3.out" },
                  0,
                );

                // Camera servo: one move to the anchored region, then hold zoomed.
                tl.to(
                  cam,
                  {
                    s: zoom,
                    x: targetX,
                    y: targetY,
                    duration: ZOOM,
                    ease: "power2.inOut",
                    onUpdate: applyCamera,
                  },
                  zoomStart,
                );

                // Micro-drift: 2 and 3 INTEGER sine cycles that end at exactly
                // zero before the authored stillness, so the final hold is dead
                // still and every seek reproduces the same frame.
                var driftDuration = Math.max(0, OUT_START - STILLNESS);
                if (driftDuration >= 1.2) {
                  tl.to(
                    drift,
                    {
                      p: Math.PI * 2 * 2,
                      duration: driftDuration,
                      ease: "none",
                      onUpdate: function () {
                        drift.dx = Math.sin(drift.p) * DRIFT_X;
                        drift.dy = Math.sin(drift.p * 1.5) * DRIFT_Y;
                        applyCamera();
                      },
                    },
                    0,
                  );
                }

                // Halo: soft bloom at the anchor as the camera arrives, then hold.
                if (haloOn) {
                  tl.fromTo(
                    halo,
                    { opacity: 0, scale: 0.55, xPercent: -50, yPercent: -50 },
                    {
                      opacity: 0.85,
                      scale: 1,
                      xPercent: -50,
                      yPercent: -50,
                      duration: 0.75 * scale,
                      ease: "power2.out",
                    },
                    zoomStart + ZOOM * 0.5,
                  );
                }

                // OUT: only when exit != none; the default holds the last frame.
                if (exitMode !== "none") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  if (exitMode === "up") {
                    tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "anchor_x", "type": "number", "role": "content", "label": "Anchor X", "description": "Focus anchor, percent from the left edge of the surface.", "default": 64, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "anchor_y", "type": "number", "role": "content", "label": "Anchor Y", "description": "Focus anchor, percent from the top edge of the surface.", "default": 36, "min": 0, "max": 100, "step": 1, "unit": "%" &#125;,
        &#123; "id": "zoom", "type": "number", "role": "content", "label": "Zoom", "description": "Camera scale at the focused state.", "default": 1.6, "min": 1, "max": 3, "step": 0.05 &#125;,
        &#123; "id": "zoom_at", "type": "number", "role": "timing", "label": "Zoom at", "description": "Seconds from mount start when the camera departs for the anchor. Clamped inside the hold.", "default": 1.4, "min": 0, "max": 30, "step": 0.1, "unit": "s" &#125;,
        &#123; "id": "halo", "type": "enum", "role": "style", "label": "Halo", "description": "Soft accent bloom at the anchor as the camera arrives.", "default": "show", "options": [&#123; "value": "show", "label": "Show" &#125;, &#123; "value": "hide", "label": "Hide" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Token the halo and skeleton accent elements ride.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "style", "label": "Exit", "description": "Optional departure. None holds the final frame.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="ui-focus-zoom" data-duration="4.5" data-fps="30">
            
    
            <div
              id="ui-focus-zoom-clip"
              class="ufz-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="ufz-stage">
                <div class="ufz-frame" role="img" aria-label="App surface with a camera focus zoom">
                  <div class="ufz-world">
                    <div class="ufz-surface">
                      <div class="ufz-skel" aria-hidden="true">
                        <div class="ufz-skel-top">
                          <span class="ufz-skel-mark"></span>
                          <span class="ufz-skel-line"></span>
                          <span class="ufz-skel-line"></span>
                          <span class="ufz-skel-spring"></span>
                          <span class="ufz-skel-chip"></span>
                          <span class="ufz-skel-avatar"></span>
                        </div>
                        <div class="ufz-skel-body">
                          <div class="ufz-skel-side">
                            <span class="ufz-skel-line"></span>
                            <span class="ufz-skel-line"></span>
                            <span class="ufz-skel-line"></span>
                            <span class="ufz-skel-line"></span>
                            <span class="ufz-skel-line"></span>
                          </div>
                          <div class="ufz-skel-main">
                            <span class="ufz-skel-heading"></span>
                            <span class="ufz-skel-sub"></span>
                            <div class="ufz-skel-cards">
                              <div class="ufz-skel-card">
                                <span class="ufz-skel-line"></span>
                                <span class="ufz-skel-block"></span>
                              </div>
                              <div class="ufz-skel-card">
                                <span class="ufz-skel-line"></span>
                                <span class="ufz-skel-block"></span>
                              </div>
                              <div class="ufz-skel-card">
                                <span class="ufz-skel-line"></span>
                                <span class="ufz-skel-block"></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="ufz-halo" aria-hidden="true"></div>
                  </div>
                </div>
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

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
    pointer-events: none;
  }

  .ufz-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .ufz-stage {
    position: relative;
    width: 100%;
    height: 100%;
    will-change: transform, opacity;
  }

  /* the fixed frame: the camera moves the world inside this window */
  .ufz-frame {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 85%, transparent);
    border-radius: calc(var(--radius, 2cqmin) * 1.2);
    background: color-mix(in srgb, var(--surface, #0b1016) 96%, var(--ufz-accent));
    box-shadow: 0 3cqh 9cqh color-mix(in srgb, var(--bg, #000000) 45%, transparent);
  }

  /* ONE world wrapper: all camera motion is this element's transform */
  .ufz-world {
    position: absolute;
    inset: 0;
    will-change: transform;
  }

  .ufz-surface {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: color-mix(in srgb, var(--surface, #0b1016) 88%, var(--bg, #05070c));
  }

  .ufz-surface > img, .ufz-surface > video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ufz-halo {
    position: absolute;
    z-index: 2;
    width: 30cqmin;
    height: 30cqmin;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--ufz-accent) 26%, transparent) 0%,
      color-mix(in srgb, var(--ufz-accent) 12%, transparent) 42%,
      transparent 70%
    );
    will-change: transform, opacity;
  }

  /* default skeleton surface: pure token furniture, no branding */
  .ufz-skel {
    position: absolute;
    inset: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
  }

  .ufz-skel-top {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.6cqmin);
    padding: 1.8cqmin 2.6cqmin;
    border-bottom: 0.14cqmin solid
    color-mix(in srgb, var(--border, #475569) 55%, transparent);
  }

  .ufz-skel-mark {
    width: 2.6cqmin;
    height: 2.6cqmin;
    border-radius: 0.8cqmin;
    background: color-mix(in srgb, var(--ufz-accent) 74%, var(--surface, #0b1016));
  }

  .ufz-skel-line {
    height: 1.25cqmin;
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg, #f8fafc) 13%, transparent);
  }

  .ufz-skel-top .ufz-skel-line:nth-of-type(1) {
    width: 9cqmin;
  }

  .ufz-skel-top .ufz-skel-line:nth-of-type(2) {
    width: 6.5cqmin;
  }

  .ufz-skel-spring {
    flex: 1;
  }

  .ufz-skel-chip {
    width: 8.5cqmin;
    height: 2.9cqmin;
    border: 0.14cqmin solid color-mix(in srgb, var(--ufz-accent) 55%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--ufz-accent) 28%, transparent);
  }

  .ufz-skel-avatar {
    width: 2.8cqmin;
    height: 2.8cqmin;
    border-radius: 50%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 18%, transparent);
  }

  .ufz-skel-body {
    display: grid;
    grid-template-columns: 22% minmax(0, 1fr);
    min-height: 0;
  }

  .ufz-skel-side {
    display: flex;
    flex-direction: column;
    gap: 2cqmin;
    padding: 2.6cqmin;
    border-right: 0.14cqmin solid
    color-mix(in srgb, var(--border, #475569) 55%, transparent);
  }

  .ufz-skel-side .ufz-skel-line:nth-child(1) {
    width: 78%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 22%, transparent);
  }

  .ufz-skel-side .ufz-skel-line:nth-child(2) {
    width: 56%;
  }

  .ufz-skel-side .ufz-skel-line:nth-child(3) {
    width: 66%;
  }

  .ufz-skel-side .ufz-skel-line:nth-child(4) {
    width: 44%;
  }

  .ufz-skel-side .ufz-skel-line:nth-child(5) {
    width: 60%;
  }

  .ufz-skel-main {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 1.8cqmin);
    min-height: 0;
    padding: var(--space-3, 2.8cqmin);
  }

  .ufz-skel-heading {
    width: 34%;
    height: 2.5cqmin;
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg, #f8fafc) 21%, transparent);
  }

  .ufz-skel-sub {
    width: 52%;
    height: 1.25cqmin;
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg, #f8fafc) 9%, transparent);
  }

  .ufz-skel-cards {
    display: grid;
    flex: 1;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.1cqmin;
    min-height: 0;
    margin-top: 0.8cqmin;
  }

  .ufz-skel-card {
    display: flex;
    flex-direction: column;
    gap: 1.5cqmin;
    min-height: 0;
    padding: 2.1cqmin;
    border: 0.14cqmin solid color-mix(in srgb, var(--border, #475569) 60%, transparent);
    border-radius: var(--radius, 1.6cqmin);
    background: color-mix(in srgb, var(--bg, #05070c) 30%, transparent);
  }

  .ufz-skel-card .ufz-skel-line {
    width: 55%;
  }

  .ufz-skel-block {
    flex: 1;
    min-height: 3cqmin;
    border-radius: calc(var(--radius, 1.6cqmin) * 0.6);
    background: color-mix(in srgb, var(--fg, #f8fafc) 7%, transparent);
  }

  .ufz-skel-card:nth-child(2) .ufz-skel-block {
    background: color-mix(in srgb, var(--ufz-accent) 17%, transparent);
  }
}
</style>
