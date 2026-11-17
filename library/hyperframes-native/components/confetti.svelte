<!-- Modified Svelte adaptation of registry/components/confetti/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-confetti .mesh",
              {
                "--hf-x1": "18%",
                "--hf-y1": "28%",
                "--hf-x2": "78%",
                "--hf-y2": "46%",
                "--hf-x3": "44%",
                "--hf-y3": "80%",
              },
              {
                "--hf-x1": "34%",
                "--hf-y1": "42%",
                "--hf-x2": "62%",
                "--hf-y2": "60%",
                "--hf-x3": "58%",
                "--hf-y3": "64%",
                duration: 4,
                ease: "sine.inOut",
              },
              startTime,
            );
            tl.fromTo(
              ".hf-catalog-confetti .spot",
              { "--hf-spot-x": "-120px", "--hf-spot-y": "-70px" },
              { "--hf-spot-x": "190px", "--hf-spot-y": "90px", duration: 3, ease: "sine.inOut" },
              startTime,
            );
            const particles_confetti = gsap.utils.toArray(".hf-catalog-confetti .particle");
            if (particles_confetti.length) {
              tl.fromTo(
                particles_confetti,
                { "--hf-po": 0, "--hf-px": "0px", "--hf-py": "0px", "--hf-pr": "0deg" },
                {
                  "--hf-po": 1,
                  "--hf-px": (i) => Math.cos(i * 0.83) * 250 + "px",
                  "--hf-py": (i) => -120 - Math.sin(i * 0.61) * 120 + "px",
                  "--hf-pr": (i) => 180 + i * 37 + "deg",
                  duration: 0.8,
                  stagger: 0.015,
                  ease: "power2.out",
                },
                startTime + 0.2,
              );
            }
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="confetti-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-catalog-confetti">
              <div class="mesh"></div>
              <div class="card">
                <div class="spot"></div>
                <div>
                  <h3>Confetti</h3>
                  <p>A deterministic celebration burst with seeded particles and gravity.</p>
                </div>
              </div>
              <span class="particle" style="--c: var(--accent, #f43f5e)"></span
              ><span class="particle" style="--c: var(--accent, #f59e0b)"></span
              ><span class="particle" style="--c: var(--accent, #22c55e)"></span
              ><span class="particle" style="--c: var(--accent, #38bdf8)"></span
              ><span class="particle" style="--c: var(--accent, #a855f7)"></span
              ><span class="particle" style="--c: var(--accent, #f43f5e)"></span
              ><span class="particle" style="--c: var(--accent, #f59e0b)"></span
              ><span class="particle" style="--c: var(--accent, #22c55e)"></span
              ><span class="particle" style="--c: var(--accent, #38bdf8)"></span
              ><span class="particle" style="--c: var(--accent, #a855f7)"></span
              ><span class="particle" style="--c: var(--accent, #f43f5e)"></span
              ><span class="particle" style="--c: var(--accent, #f59e0b)"></span
              ><span class="particle" style="--c: var(--accent, #22c55e)"></span
              ><span class="particle" style="--c: var(--accent, #38bdf8)"></span
              ><span class="particle" style="--c: var(--accent, #a855f7)"></span
              ><span class="particle" style="--c: var(--accent, #f43f5e)"></span
              ><span class="particle" style="--c: var(--accent, #f59e0b)"></span
              ><span class="particle" style="--c: var(--accent, #22c55e)"></span
              ><span class="particle" style="--c: var(--accent, #38bdf8)"></span
              ><span class="particle" style="--c: var(--accent, #a855f7)"></span
              ><span class="particle" style="--c: var(--accent, #f43f5e)"></span
              ><span class="particle" style="--c: var(--accent, #f59e0b)"></span>
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
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: var(--bg, #f7f7f8);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .demo-frame {
    display: grid;
    place-items: center;
    padding: 52px;
    transform: scale(1.6); /* ponytail: scale wrapper, not GSAP targets */
  }
  .hf-catalog-confetti {
    color: var(--fg, #111827);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }
  .hf-catalog-confetti {
    position: relative;
    width: 760px;
    height: 428px;
    overflow: hidden;
    border-radius: 30px;
    background: var(--bg, #080b12);
    box-shadow: 0 28px 80px color-mix(in srgb, var(--bg, #0f172a) 20%, transparent);
  }
  .hf-catalog-confetti .mesh {
    position: absolute;
    inset: -22%;
    filter: blur(44px);
    opacity: 0.88;
    background:
      radial-gradient(
        circle at var(--hf-x1, 20%) var(--hf-y1, 30%),
        var(--accent, #60a5fa) 0 18%,
        transparent 32%
      ),
      radial-gradient(
        circle at var(--hf-x2, 76%) var(--hf-y2, 52%),
        var(--accent-2, #f472b6) 0 16%,
        transparent 34%
      ),
      radial-gradient(
        circle at var(--hf-x3, 46%) var(--hf-y3, 78%),
        var(--brand, #34d399) 0 18%,
        transparent 34%
      );
  }
  .hf-catalog-confetti .card {
    position: absolute;
    inset: 74px 92px;
    border: 1px solid color-mix(in srgb, var(--border, #ffffff) 16%, transparent);
    border-radius: 26px;
    background: color-mix(in srgb, var(--surface, #ffffff) 8%, transparent);
    color: var(--fg, #fff);
    display: grid;
    place-items: center;
    text-align: center;
    overflow: hidden;
  }
  .hf-catalog-confetti .spot {
    position: absolute;
    width: 260px;
    height: 260px;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--fg, #ffffff) 50%, transparent),
      transparent 65%
    );
    transform: translate(var(--hf-spot-x, 0px), var(--hf-spot-y, 0px));
    mix-blend-mode: screen;
  }
  .hf-catalog-confetti .particle {
    position: absolute;
    left: 50%;
    top: 54%;
    width: 12px;
    height: 20px;
    border-radius: 3px;
    background: var(--c);
    transform: translate(var(--hf-px, 0px), var(--hf-py, 0px)) rotate(var(--hf-pr, 0deg));
    opacity: var(--hf-po, 0);
  }
  .hf-catalog-confetti h3 {
    margin: 0;
    font-size: 44px;
    letter-spacing: -0.04em;
  }
  .hf-catalog-confetti p {
    margin: 8px 0 0;
    font-size: 15px;
    color: color-mix(in srgb, var(--muted, #ffffff) 70%, transparent);
  }
}
</style>
