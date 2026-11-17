<!-- Modified Svelte adaptation of registry/components/animated-bar-chart/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              ".hf-catalog-animated-bar-chart",
              { "--hf-grow": 0, "--hf-dash": 900 },
              { "--hf-grow": 1, "--hf-dash": 0, duration: 1.2, ease: "power3.out" },
              startTime,
            );
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="animated-bar-chart-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-catalog-animated-bar-chart">
              <header>
                <div>
                  <h3>Animated Bar Chart</h3>
                  <p>A compact data card with deterministic bar growth and value callouts.</p>
                </div>
                <strong>+42%</strong>
              </header>
              <div class="bars">
                <span class="bar" style="--h: 42%"></span><span class="bar" style="--h: 72%"></span
                ><span class="bar" style="--h: 56%"></span><span class="bar" style="--h: 88%"></span
                ><span class="bar" style="--h: 64%"></span><span class="bar" style="--h: 95%"></span
                ><span class="bar" style="--h: 78%"></span>
              </div>
              <div class="chart-footer">
                <svg viewBox="0 0 700 210">
                  
                  <line x1="20" y1="185" x2="680" y2="185" stroke="#e4e4e7" stroke-width="1.5" />
                  <path
                    d="M20 172 C120 90, 190 118, 260 74 S430 112, 508 42 S620 82, 680 30"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="10"
                    stroke-linecap="round"
                  />
                </svg>
                <div class="bar-labels">
                  <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span
                  ><span>Jun</span><span>Jul</span>
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
    background: #f7f7f8;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    padding: 52px;
    transform: scale(1.6);
    transform-origin: center center;
  }
  .hf-catalog-animated-bar-chart {
    --hf-accent: var(--accent, #111827);
    --hf-ink: #111827;
    --hf-l1: rgba(17, 24, 39, 0.72);
    --hf-l2: rgba(17, 24, 39, 0.45);
    --hf-l3: rgba(17, 24, 39, 0.18);
    --hf-l4: rgba(17, 24, 39, 0.08);
    --hf-hair: rgba(17, 24, 39, 0.14);
    --hf-muted: #6b7280;
    --hf-surface: #ffffff;
    color: var(--hf-ink);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-catalog-animated-bar-chart {
    width: 760px;
    min-height: 420px;
    border-radius: 28px;
    background: #fff;
    padding: 34px;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.16);
    display: grid;
    gap: 22px;
  }
  .hf-catalog-animated-bar-chart header {
    display: flex;
    justify-content: space-between;
    align-items: end;
  }
  .hf-catalog-animated-bar-chart h3 {
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.04em;
    font-weight: 700;
    color: #111827;
  }
  .hf-catalog-animated-bar-chart header p {
    margin: 6px 0 0;
    font-size: 16px;
    color: #6b7280;
    font-weight: 400;
  }
  .hf-catalog-animated-bar-chart strong {
    font-size: 54px;
    letter-spacing: -0.06em;
    color: var(--hf-accent);
    font-weight: 700;
  }
  .hf-catalog-animated-bar-chart .bars {
    height: 210px;
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    align-items: end;
    gap: 14px;
  }
  .hf-catalog-animated-bar-chart .bar {
    height: calc(var(--h) * var(--hf-grow, 1));
    border-radius: 14px 14px 5px 5px;
    background: var(--hf-l1);
  }
  .hf-catalog-animated-bar-chart .chart-footer {
    display: grid;
    gap: 6px;
  }
  .hf-catalog-animated-bar-chart svg {
    width: 100%;
    height: 180px;
    overflow: visible;
  }
  .hf-catalog-animated-bar-chart path {
    color: var(--hf-l2);
    stroke-dasharray: 900;
    stroke-dashoffset: var(--hf-dash, 0);
  }
  .hf-catalog-animated-bar-chart .bar-labels {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    text-align: center;
    font-size: 13px;
    font-weight: 500;
    color: #9ca3af;
    padding: 0 2px;
  }
}
</style>
