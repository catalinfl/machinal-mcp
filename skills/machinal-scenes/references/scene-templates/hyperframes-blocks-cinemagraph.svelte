<!-- Modified Svelte adaptation of registry/blocks/cinemagraph/cinemagraph.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // Seeded PRNG — never Math.random()
            function mulberry32(a) {
              return function () {
                a |= 0;
                a = (a + 0x6d2b79f5) | 0;
                var t = Math.imul(a ^ (a >>> 15), 1 | a);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
              };
            }
            var rng = mulberry32(1897);

            var DUR = 10;
            // Each wisp cycles an integer number of times over DUR, so the frame at
            // t = DUR equals the frame at t = 0 and the render loops seamlessly.
            var WISPS = [];
            for (var i = 0; i < 14; i++) {
              WISPS.push({
                x0: 90 + rng() * 160, // birth x inside the window
                cycles: 1 + Math.floor(rng() * 2), // 1 or 2 full rises over DUR
                phase: rng(), // where in its cycle it starts
                sway: 14 + rng() * 26, // horizontal sway amplitude
                swayFreq: 1 + Math.floor(rng() * 2), // integer — keeps the loop seam clean
                width: 10 + rng() * 22, // wisp thickness
                rise: 300 + rng() * 80, // how far it climbs before dissolving
                alpha: 0.05 + rng() * 0.09,
              });
            }

            var canvas = document.getElementById("cmg-canvas");
            var ctx = canvas.getContext("2d");
            var W = 340,
              H = 420;

            // State proxy — GSAP animates t, the render function reads it.
            var st = { t: 0 };

            function renderScene() {
              ctx.clearRect(0, 0, W, H);
              for (var i = 0; i < WISPS.length; i++) {
                var w = WISPS[i];
                // p in [0,1): this wisp's position in its own rise cycle
                var p = (st.t / DUR) * w.cycles + w.phase;
                p = p - Math.floor(p);
                var y = H - 40 - p * w.rise;
                var sway = Math.sin(2 * Math.PI * (p * w.swayFreq + w.phase)) * w.sway * p;
                var x = w.x0 + sway;
                // born faint, fullest mid-rise, dissolves at the top
                var a = w.alpha * Math.sin(Math.PI * p);
                var r = w.width * (0.7 + p * 1.6);
                var g = ctx.createRadialGradient(x, y, 0, x, y, r * 2.4);
                g.addColorStop(0, "rgba(248,250,252," + a.toFixed(4) + ")");
                g.addColorStop(1, "rgba(248,250,252,0)");
                ctx.fillStyle = g;
                ctx.beginPath();
                ctx.ellipse(x, y, r * 1.1, r * 2.2, sway * 0.004, 0, 2 * Math.PI);
                ctx.fill();
              }
            }

            var tl = gsap.timeline({ paused: true });
            tl.to(st, { t: DUR, duration: DUR, ease: "none" }, 0);

            __hfTimelineSlot.set(tl);

            // Render from the timeline only — no requestAnimationFrame.
            tl.eventCallback("onUpdate", renderScene);
            renderScene();
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0b0e14">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root-cinemagraph"
          data-composition-id="cinemagraph"
          data-start="0"
          data-duration="10"
          data-width="1920"
          data-height="1080"
        >
          <div class="cmg-photo" id="cmg-photo">
            <div class="cmg-lightfall"></div>
            <div class="cmg-pane"></div>
            <div class="cmg-table"></div>
            <div class="cmg-saucer"></div>
            <div class="cmg-cup"></div>
            <div class="cmg-rim"></div>
            <div class="cmg-book"></div>
            <div class="cmg-line" style="bottom: 150px; width: 460px"></div>
            <div class="cmg-line" style="bottom: 108px; width: 300px"></div>
          </div>
          <div id="cmg-window">
            <canvas id="cmg-canvas" width="340" height="420"></canvas>
          </div>
          <div class="cmg-vignette"></div>
          <div
            id="drv-cinemagraph"
            class="clip"
            data-start="0"
            data-duration="10"
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
    background: #0b0e14;
    overflow: hidden;
  }
  #root-cinemagraph {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #0b0e14;
    --hf-ink: #f8fafc;
  }
  /* ---- the still photograph (placeholder scene, monochrome ink ramp) ---- */
  .cmg-photo {
    position: absolute;
    inset: 0;
  }
  /* window light falling across the scene */
  .cmg-lightfall {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      115deg,
      color-mix(in srgb, var(--hf-ink) 8%, transparent) 0%,
      transparent 46%
    );
  }
  /* table surface */
  .cmg-table {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 320px;
    background: color-mix(in srgb, var(--hf-ink) 8%, transparent);
    border-top: 1px solid color-mix(in srgb, var(--hf-ink) 14%, transparent);
  }
  /* window frame in the far wall */
  .cmg-pane {
    position: absolute;
    left: 1210px;
    top: 130px;
    width: 420px;
    height: 520px;
    background: color-mix(in srgb, var(--hf-ink) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--hf-ink) 14%, transparent);
  }
  .cmg-pane::before, .cmg-pane::after {
    content: "";
    position: absolute;
    background: color-mix(in srgb, var(--hf-ink) 14%, transparent);
  }
  .cmg-pane::before {
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1px;
  }
  .cmg-pane::after {
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
  }
  /* saucer + cup, the photograph's subject */
  .cmg-saucer {
    position: absolute;
    left: 760px;
    bottom: 236px;
    width: 400px;
    height: 56px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--hf-ink) 45%, transparent);
  }
  .cmg-cup {
    position: absolute;
    left: 830px;
    bottom: 262px;
    width: 260px;
    height: 190px;
    border-radius: 0 0 118px 118px;
    background: color-mix(in srgb, var(--hf-ink) 72%, transparent);
  }
  .cmg-cup::after {
    content: "";
    position: absolute;
    right: -64px;
    top: 18px;
    width: 88px;
    height: 96px;
    border: 22px solid color-mix(in srgb, var(--hf-ink) 72%, transparent);
    border-radius: 50%;
  }
  .cmg-rim {
    position: absolute;
    left: 822px;
    bottom: 436px;
    width: 276px;
    height: 34px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--hf-ink) 45%, transparent);
  }
  /* a closed book beside the cup */
  .cmg-book {
    position: absolute;
    left: 1180px;
    bottom: 250px;
    width: 330px;
    height: 44px;
    background: color-mix(in srgb, var(--hf-ink) 18%, transparent);
    border: 1px solid color-mix(in srgb, var(--hf-ink) 14%, transparent);
    transform: rotate(-2deg);
  }
  .cmg-book::after {
    content: "";
    position: absolute;
    left: 14px;
    right: 14px;
    top: 12px;
    height: 1px;
    background: color-mix(in srgb, var(--hf-ink) 14%, transparent);
  }
  /* skeleton caption lines, bottom left — content lives here */
  .cmg-line {
    position: absolute;
    left: 160px;
    height: 22px;
    border-radius: 11px;
    background: color-mix(in srgb, var(--hf-ink) 18%, transparent);
  }
  /* ---- the ONE living region: a feathered window where steam moves ---- */
  #cmg-window {
    position: absolute;
    left: 790px;
    bottom: 430px;
    width: 340px;
    height: 420px;
    -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 55%, transparent 78%);
    mask-image: radial-gradient(ellipse 50% 50% at 50% 55%, #000 55%, transparent 78%);
  }
  #cmg-canvas {
    position: absolute;
    inset: 0;
    width: 340px;
    height: 420px;
  }
  /* still vignette over everything, part of the photograph */
  .cmg-vignette {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse 78% 72% at 50% 46%,
      transparent 62%,
      rgba(4, 6, 10, 0.5) 100%
    );
    pointer-events: none;
  }
}
</style>
