<!-- Modified Svelte adaptation of registry/blocks/mk-background/mk-background.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            /* ---- published parameters (inspector-style CONFIG) ---- */
            var CONFIG = {
              scheme: "light", // "light" | "dark"
              animationIn: true, // fade/settle entrance
              animationOut: true, // fade exit
              drift: true, // ambient blob motion
              // Soft BG blobs: center as fraction of canvas, radius in px
              blob1: { x: 0.28, y: 0.32, r: 950, opacity: 0.85 },
              blob2: { x: 0.74, y: 0.66, r: 1100, opacity: 0.8 },
              // Bar mask (rounded-rect card). demo:true plays full-bleed -> card -> full-bleed
              bar: {
                demo: true, // full-bleed -> rounded card -> full-bleed showcase
                x: 240,
                y: 140,
                width: 1440,
                height: 800,
                roundness: 40,
              },
              // Content opacity + frost only matter with footage beneath the block
              contentOpacity: 1,
              frostBlur: 0, // px; e.g. 24 for the frosted-card look over footage
            };

            var W = 1920,
              H = 1080,
              DUR = 10;

            var root = document.getElementById("mk-bg-root");
            var card = document.getElementById("mk-bg-card");
            var blob1 = document.getElementById("mk-bg-blob1");
            var blob2 = document.getElementById("mk-bg-blob2");

            if (CONFIG.scheme === "dark") root.classList.add("mk-dark");

            function placeBlob(el, b) {
              var d = b.r * 2;
              el.style.width = d + "px";
              el.style.height = d + "px";
              el.style.left = b.x * W - b.r + "px";
              el.style.top = b.y * H - b.r + "px";
              el.style.opacity = String(b.opacity);
            }
            placeBlob(blob1, CONFIG.blob1);
            placeBlob(blob2, CONFIG.blob2);

            card.style.opacity = String(CONFIG.contentOpacity);
            if (CONFIG.frostBlur > 0) {
              card.style.backdropFilter = "blur(" + CONFIG.frostBlur + "px) saturate(1.4)";
            }

            var tl = gsap.timeline({ paused: true });

            /* entrance — fade + blobs settle (power3, no bounce) */
            if (CONFIG.animationIn) {
              tl.from(root, { opacity: 0, duration: 0.7, ease: "power2.out" }, 0);
              tl.from([blob1, blob2], { scale: 1.14, duration: 1.2, ease: "power3.out" }, 0);
            }

            /* ambient drift — slow sine yoyo, seek-safe timeline tweens */
            if (CONFIG.drift) {
              tl.to(
                blob1,
                { x: 70, y: 42, duration: 2.35, ease: "sine.inOut", yoyo: true, repeat: 3 },
                0.3,
              );
              tl.to(
                blob2,
                { x: -84, y: -36, duration: 2.35, ease: "sine.inOut", yoyo: true, repeat: 3 },
                0.3,
              );
            }

            /* bar-mask demo: full-bleed -> rounded card over the stage -> full-bleed.
               Offset via x/y transforms, not top/left: layout properties snap to
               integer device pixels and stutter under seek-by-frame capture. The
               card's CSS base is top:0/left:0, so the transform values match 1:1. */
            if (CONFIG.bar.demo) {
              tl.to(
                card,
                {
                  y: CONFIG.bar.y,
                  x: CONFIG.bar.x,
                  width: CONFIG.bar.width,
                  height: CONFIG.bar.height,
                  borderRadius: CONFIG.bar.roundness,
                  duration: 1.1,
                  ease: "power3.inOut",
                },
                3.8,
              );
              tl.to(
                card,
                {
                  y: 0,
                  x: 0,
                  width: W,
                  height: H,
                  borderRadius: 0,
                  duration: 1.0,
                  ease: "power3.inOut",
                },
                7.6,
              );
            }

            /* exit + hard kill */
            if (CONFIG.animationOut) {
              tl.to(root, { opacity: 0, duration: 0.4, ease: "power2.in" }, DUR - 0.45);
            }
            tl.set(root, { visibility: "hidden" }, DUR - 0.02);

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="mk-bg-root"
          data-composition-id="mk-background"
          data-start="0"
          data-duration="10"
          data-width="1920"
          data-height="1080"
        >
          <div id="mk-bg-card">
            <div id="mk-bg-blob1" class="mk-bg-blob" data-layout-allow-overflow></div>
            <div id="mk-bg-blob2" class="mk-bg-blob" data-layout-allow-overflow></div>
          </div>
          <div
            id="mk-bg-drv"
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
    background: transparent;
    overflow: hidden;
  }
  #mk-bg-root {
    /* ---- mk tokens: override these in the host to re-skin the family ---- */
    --mk-font: "Inter", -apple-system, sans-serif;
    --mk-stage: #f5f5f7;
    --mk-base: #ffffff;
    --mk-blob-1: #ff7ac8;
    --mk-blob-2: #45d6c8;
    --mk-stage-dark: #000000;
    --mk-base-dark: #0a0a0c;
    --mk-blob-1-dark: #7d5cff;
    --mk-blob-2-dark: #2d1b69;
    --mk-radius-card: 40px;
    --mk-shadow: 0 30px 80px rgba(0, 0, 0, 0.18);

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--mk-stage);
  }
  #mk-bg-root.mk-dark {
    background: var(--mk-stage-dark);
  }
  /* The "Bar" — an animatable rounded-rect mask. Full-bleed by default,
  animatable down to a floating card over the stage. */
  #mk-bg-card {
    position: absolute;
    top: 0;
    left: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    border-radius: 0;
    background: var(--mk-base);
    box-shadow: var(--mk-shadow);
  }
  .mk-dark #mk-bg-card {
    background: var(--mk-base-dark);
  }
  /* Soft radial blobs — the procedural "mesh gradient". Two oversized
  radial gradients with a long falloff, drifting slowly. */
  .mk-bg-blob {
    position: absolute;
    border-radius: 50%;
    will-change: transform;
  }
  #mk-bg-blob1 {
    background: radial-gradient(
      circle closest-side,
      var(--mk-blob-1) 0%,
      rgba(255, 255, 255, 0) 72%
    );
  }
  #mk-bg-blob2 {
    background: radial-gradient(
      circle closest-side,
      var(--mk-blob-2) 0%,
      rgba(255, 255, 255, 0) 72%
    );
  }
  .mk-dark #mk-bg-blob1 {
    background: radial-gradient(
      circle closest-side,
      var(--mk-blob-1-dark) 0%,
      rgba(0, 0, 0, 0) 72%
    );
  }
  .mk-dark #mk-bg-blob2 {
    background: radial-gradient(
      circle closest-side,
      var(--mk-blob-2-dark) 0%,
      rgba(0, 0, 0, 0) 72%
    );
  }
}
</style>
