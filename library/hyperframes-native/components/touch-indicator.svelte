<!-- Modified Svelte adaptation of registry/components/touch-indicator/touch-indicator.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              const FPS = 60;
              const q = (s) => Math.max(1, Math.round(s * FPS)) / FPS;
              const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

              // The actor owns x/y and opacity, the core owns scale.
              function buildTouchIndicator(tl, root, { at = 0, elasticity = 1 } = {}) {
                const defaults = { gesture: "tap", polarity: "light", targetX: 50, targetY: 55 };
                // Per-instance overrides (a host's data-variable-values) land in
                // window.__hfVariablesByComp, scoped by composition id. Reading
                // __hfHost.variables directly here would silently ignore every
                // host override -- __hfHost.getVariables() is the
                // scoped accessor, per the registry convention (see
                // lower-third-bild.html, caption-texture.html).
                const resolved =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : __hfHost.variables || {};
                const vars = Object.assign({}, defaults, resolved);
                const actor = root.querySelector(".hf-touch-indicator__actor");
                const core = root.querySelector(".hf-touch-indicator__core");
                if (vars.polarity === "dark") actor.classList.add("hf-touch-indicator__actor--dark");

                // Compute layout geometry once at setup, never inside an ease/callback.
                const hostW = root.clientWidth || 1;
                const hostH = root.clientHeight || 1;
                const x0 = (vars.targetX / 100) * hostW;
                const y0 = (vars.targetY / 100) * hostH;

                // --- IN: fixed, never stretched. ---
                const appear = q(0.06);
                tl.fromTo(
                  actor,
                  { x: x0, y: y0, xPercent: -50, yPercent: -50, autoAlpha: 0 },
                  {
                    x: x0,
                    y: y0,
                    xPercent: -50,
                    yPercent: -50,
                    autoAlpha: 1,
                    duration: appear,
                    ease: "power2.out",
                    immediateRender: false,
                  },
                  at,
                );
                tl.fromTo(
                  core,
                  { scale: 0.9 },
                  { scale: 1, duration: appear, ease: "power2.out", immediateRender: false },
                  at,
                );
                const touchDown = at + appear;

                // --- HOLD: the only elastic phase. Stretch it, never gsap.timeScale(). ---
                let holdEnd;
                if (vars.gesture === "swipe") {
                  // a swipe lasts 0.28s to 0.52s; elasticity scales its pacing.
                  const swipeDuration = q(clamp(0.34 * elasticity, 0.28, 0.52));
                  const travel = hostH * 0.4; // vertical scroll, 40% of host height (32-68% allowed)
                  const accel = q(swipeDuration * 0.41);
                  const decel = swipeDuration - accel;
                  const bendY = y0 - travel * 0.41;
                  const endY = y0 - travel;
                  tl.fromTo(
                    actor,
                    { x: x0, y: y0 },
                    { x: x0, y: bendY, duration: accel, ease: "power2.in", immediateRender: false },
                    touchDown,
                  );
                  tl.to(
                    actor,
                    { x: x0, y: endY, duration: decel, ease: "power3.out" },
                    touchDown + accel,
                  );
                  holdEnd = touchDown + swipeDuration;
                } else {
                  // a tap touches for 0.08s to 0.2s; any longer reads as a long-press.
                  holdEnd = touchDown + q(clamp(0.12 * elasticity, 0.08, 0.2));
                }

                // --- OUT: fixed, never stretched. ---
                const lift = q(0.2);
                tl.to(actor, { autoAlpha: 0, duration: lift, ease: "power1.in" }, holdEnd);
              }

              // Self-driving mount: build the paused timeline and register it
              // under this file's own data-composition-id, matching the host's
              // data-composition-src wiring (sub-compositions.md, Pitfall 2).
              const root = document.querySelector('[data-composition-id="touch-indicator"]');
              const tl = gsap.timeline({ paused: true });
              
              __hfTimelineSlot.set(tl);
              buildTouchIndicator(tl, root, { at: 0 });
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="touch-indicator"
            data-composition-variables='[
              &#123;"id":"gesture","type":"enum","label":"Gesture","default":"tap","options":[&#123;"value":"tap","label":"Tap"&#125;,&#123;"value":"swipe","label":"Swipe"&#125;]&#125;,
              &#123;"id":"polarity","type":"enum","label":"Polarity","default":"light","options":[&#123;"value":"light","label":"Light (on dark UI)"&#125;,&#123;"value":"dark","label":"Dark (on light UI)"&#125;]&#125;,
              &#123;"id":"targetX","type":"number","label":"Target X","default":50,"min":0,"max":100,"unit":"%"&#125;,
              &#123;"id":"targetY","type":"number","label":"Target Y","default":55,"min":0,"max":100,"unit":"%"&#125;
            ]'
          >
            <div class="hf-touch-indicator__actor">
              <div class="hf-touch-indicator__core"></div>
            </div>
          </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  /* INVARIANT: root fills the host's box, position-blind, elastic to
  whatever size a host slot gives it. No data-width/data-height on
  the root -- the host slot owns the size (see mount contract).
  Root is styled by #root, never a class (sub-compositions.md,
    Pitfall 3). */
  #root {
    position: absolute;
    inset: 0;
    container-type: inline-size;
    isolation: isolate;
    pointer-events: none;
  }

  .hf-touch-indicator__actor {
    /* sized to 18cqw of the host box, meant to be the phone screen,
    with a 46px floor and a 111px cap for wide hosts. */
    --hf-gesture-size: clamp(46px, 18cqw, 111px);
    position: absolute;
    left: 0;
    top: 0;
    width: var(--hf-gesture-size);
    height: var(--hf-gesture-size);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    will-change: transform, opacity;
  }

  .hf-touch-indicator__core {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    /* INVARIANT: circle geometry, hardcoded 50%, not var(--radius) -
    that token is for rectangular UI corners, not this actor's
    fixed disc. */
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.35);
    border: 1px solid rgba(255, 255, 255, 0.6);
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .hf-touch-indicator__actor--dark .hf-touch-indicator__core {
    background: rgba(0, 0, 0, 0.22);
    border-color: rgba(0, 0, 0, 0.45);
  }
}
</style>
