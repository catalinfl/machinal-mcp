<!-- Modified Svelte adaptation of registry/components/vignette/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              const tl = gsap.timeline({ paused: true });

              // Reveal the backdrop subject and haze first so the vignette has
              // something to frame. Without a subject the effect reads as a flat
              // dark gradient — uninteresting in a still preview.
              tl.to(".haze-far", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0.0);
              tl.to(".haze-near", { opacity: 1, duration: 0.8, ease: "power2.out" }, 0.15);
              tl.to(".demo-subject", { opacity: 1, scale: 1, duration: 1.0, ease: "power3.out" }, 0.1);

              // Title + subtitle settle in. The letters settle from wider spacing to their
              // resting spacing — the faithful smooth equivalent of a letter-spacing tween is a
              // per-glyph x spread (transform, sub-pixel smooth), NOT a uniform scale (which
              // would resize the glyphs instead of closing the gaps). letter-spacing holds at
              // its CSS resting 0.18em; each glyph starts offset by the extra gap the original
              // tween opened — (0.32em − 0.18em) × 108px ≈ 15.12px per gap — and converges to 0,
              // centered about the word (8 chars → center at index 3.5).
              tl.fromTo(
                ".demo-title",
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 1.0, ease: "power3.out" },
                0.6,
              );
              tl.from(
                ".demo-title .ch",
                { x: (i) => (i - 3.5) * 15.12, duration: 1.0, ease: "power3.out" },
                0.6,
              );
              tl.to(".demo-subtitle", { opacity: 1, duration: 0.8, ease: "power3.out" }, 1.0);

              // Vignette: start visibly soft (so viewers see the unframed scene),
              // then ramp to a strong cinematic vignette and hold through the
              // capture-time peak (~3.0s, picked to match the catalog thumbnail
              // sampling at `Math.min(3.0, duration * 0.6)` for duration=5).
              gsap.set("#hf-vignette", {
                "--vignette-color": "rgba(0, 0, 0, 0.35)",
                "--vignette-size": "70%",
                "--vignette-edge": "100%",
              });
              tl.to(
                "#hf-vignette",
                {
                  "--vignette-color": "rgba(0, 0, 0, 0.92)",
                  "--vignette-size": "26%",
                  duration: 1.6,
                  ease: "power2.inOut",
                },
                1.4,
              );

              // Gentle breathing for the video loop so the effect reads as alive,
              // not static. Keeps the still-frame at peak intensity around t≈3s.
              tl.to(
                "#hf-vignette",
                { "--vignette-size": "32%", duration: 0.9, ease: "sine.inOut" },
                3.4,
              );
              tl.to(
                "#hf-vignette",
                { "--vignette-size": "26%", duration: 0.9, ease: "sine.inOut" },
                4.3,
              );

              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="vignette-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          
          <div class="demo-bg">
            
            <div class="demo-haze haze-far"></div>
            <div class="demo-haze haze-near"></div>
            <div class="demo-subject"></div>
    
            <div class="demo-text">
              <div class="demo-title">
                <span class="ch">V</span><span class="ch">I</span><span class="ch">G</span
                ><span class="ch">N</span><span class="ch">E</span><span class="ch">T</span
                ><span class="ch">T</span><span class="ch">E</span>
              </div>
              <div class="demo-subtitle">Frame the eye. Hold the moment.</div>
            </div>
          </div>
    
          
          <div
            id="hf-vignette"
            style="
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 90;
            "
          ></div>
    
          
    
          
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #000;
  }


  .demo-bg {
    width: 1920px;
    height: 1080px;
    background:
      radial-gradient(
        circle at 22% 28%,
        rgba(255, 196, 130, 0.85),
        rgba(255, 196, 130, 0) 38%
      ),
      radial-gradient(circle at 78% 78%, rgba(64, 175, 200, 0.55), rgba(64, 175, 200, 0) 42%),
      radial-gradient(circle at 50% 50%, #3b2616 0%, #1a0e07 68%, #060403 100%);
    position: relative;
    overflow: hidden;
    font-family: "Inter", "Helvetica Neue", Helvetica, Arial, sans-serif;
  }

  .demo-haze {
    position: absolute;
    left: 50%;
    top: 50%;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(1);
    pointer-events: none;
    opacity: 0;
  }
  .haze-far {
    width: 1400px;
    height: 1400px;
    background: radial-gradient(
      circle,
      rgba(255, 220, 180, 0.18),
      rgba(255, 220, 180, 0) 65%
    );
    filter: blur(40px);
  }
  .haze-near {
    width: 900px;
    height: 900px;
    background: radial-gradient(
      circle,
      rgba(255, 240, 210, 0.32),
      rgba(255, 240, 210, 0) 60%
    );
    filter: blur(20px);
  }

  .demo-subject {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 520px;
    height: 520px;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    background: radial-gradient(
      circle at 35% 32%,
      #fff6e0 0%,
      #f4c47e 28%,
      #b87a3f 62%,
      #6b3d1c 88%,
      #2a1607 100%
    );
    box-shadow:
      inset -40px -40px 80px rgba(0, 0, 0, 0.55),
      0 0 120px rgba(255, 180, 100, 0.35);
    opacity: 0;
  }

  .demo-text {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 12%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    pointer-events: none;
    /* Sits above the subject in document order; below the vignette in z-index */
    z-index: 5;
  }

  .demo-title {
    font-size: 108px;
    font-weight: 800;
    letter-spacing: 0.18em;
    color: #f6ecd0;
    text-shadow: 0 4px 24px rgba(0, 0, 0, 0.55);
    opacity: 0;
  }
  .demo-title .ch {
    display: inline-block;
  }

  .demo-subtitle {
    font-size: 30px;
    font-weight: 400;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: rgba(246, 236, 208, 0.72);
    opacity: 0;
  }

  #hf-vignette {
    background: radial-gradient(
      var(--vignette-shape, ellipse) at center,
      transparent var(--vignette-size, 45%),
      var(--vignette-color, rgba(0, 0, 0, 0.7)) var(--vignette-edge, 100%)
    );
  }
}
</style>
