<!-- Modified Svelte adaptation of registry/components/yt-camera-move/yt-camera-move.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // ---- copy these helpers into the host script ----
            // Punch-in / camera move on any wrapper. A talking-head base:
            // zoom 0.11, cubic ease. tilt/pan are degrees (rotationX/rotationY,
            // perspective is set for you); slideX/slideY in px; roll in degrees.
            window.ytCameraMove = function (tl, target, at, opts) {
              opts = opts || {};
              var dur = opts.dur === undefined ? 1.2 : opts.dur;
              gsap.set(target, {
                transformPerspective: 1200,
                transformOrigin: opts.origin || "50% 50%",
              });
              tl.to(
                target,
                {
                  scale: 1 + (opts.zoom === undefined ? 0.11 : opts.zoom),
                  x: opts.slideX || 0,
                  y: opts.slideY || 0,
                  rotationX: opts.tilt || 0,
                  rotationY: opts.pan || 0,
                  rotation: opts.roll || 0,
                  duration: dur,
                  ease: opts.ease || "power2.inOut",
                },
                at,
              );
            };
            // Return to rest (same easing family).
            window.ytCameraReset = function (tl, target, at, opts) {
              opts = opts || {};
              tl.to(
                target,
                {
                  scale: 1,
                  x: 0,
                  y: 0,
                  rotationX: 0,
                  rotationY: 0,
                  rotation: 0,
                  duration: opts.dur === undefined ? 1.2 : opts.dur,
                  ease: opts.ease || "power2.inOut",
                },
                at,
              );
            };
            // Edge-defocus pulse synced to a move (overlay fades in then out).
            window.ytDefocusPulse = function (tl, target, at, dur) {
              dur = dur === undefined ? 1.2 : dur;
              tl.to(target, { opacity: 1, duration: dur * 0.45, ease: "power2.out" }, at);
              tl.to(target, { opacity: 0, duration: dur * 0.55, ease: "power2.in" }, at + dur * 0.45);
            };

            // Self-preview timeline (not part of the snippet you copy):
            // punch in with a slight tilt, hold, return.
            var tl = gsap.timeline({ paused: true });
            window.ytCameraMove(tl, "#yt-cm-stage", 0.4, { zoom: 0.11, slideY: -26, tilt: 3, pan: -2 });
            window.ytDefocusPulse(tl, "#yt-cm-defocus", 0.4, 1.2);
            window.ytCameraReset(tl, "#yt-cm-stage", 2.5);
            window.ytDefocusPulse(tl, "#yt-cm-defocus", 2.5, 1.2);
            tl.set("#yt-cm-root", { visibility: "hidden" }, 3.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="yt-cm-root"
          data-composition-id="yt-camera-move"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="yt-cm-stage">
            <div class="yt-cm-grid" data-layout-allow-overflow></div>
            <div class="yt-cm-label">FOOTAGE</div>
          </div>
          <div class="yt-cm-defocus" id="yt-cm-defocus"></div>
          <div
            id="yt-cm-drv"
            class="clip"
            data-start="0"
            data-duration="4"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  /* ---- yt-camera-move --------------------------------------------------
  The creator-video punch-in as reusable GSAP helpers: dynamic
  zoom + slide + 3D tilt/pan on any wrapper (a #video-wrap, a
    sub-composition include, an image card). A talking-head recipe
  is the default: cubic easing, ~11% zoom.

  Optional: .yt-cm-defocus is an edge-blur overlay that pulses during
  the move to sell the 3D feel — place it ABOVE the moving layer,
  covering the same region. */
  .yt-cm-defocus {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    backdrop-filter: blur(7px);
    -webkit-backdrop-filter: blur(7px);
    /* blur only the frame edges; center stays sharp */
    -webkit-mask-image: radial-gradient(
      ellipse 62% 58% at 50% 50%,
      transparent 58%,
      rgba(0, 0, 0, 0.85) 92%
    );
    mask-image: radial-gradient(
      ellipse 62% 58% at 50% 50%,
      transparent 58%,
      rgba(0, 0, 0, 0.85) 92%
    );
  }
  /* ---- self-preview stand-in "footage" (not part of the snippet) ---- */
  #yt-cm-stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: linear-gradient(135deg, #35c8d9 0%, #2a7fff 55%, #7d5cff 100%);
  }
  /* Grid is the only cue that reveals the camera move on a flat gradient
  plate; at 0.14/2px the zoom and slide were nearly imperceptible. */
  #yt-cm-stage .yt-cm-grid {
    position: absolute;
    inset: -60px;
    background:
      repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.3) 0 3px, transparent 3px 120px),
      repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.3) 0 3px, transparent 3px 120px);
  }
  #yt-cm-stage .yt-cm-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: "Inter", ui-sans-serif, sans-serif;
    font-weight: 700;
    font-size: 120px;
    letter-spacing: -0.02em;
    color: rgba(255, 255, 255, 0.92);
  }
}
</style>
