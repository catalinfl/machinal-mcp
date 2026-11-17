<!-- Modified Svelte adaptation of registry/components/parallax-unzoom/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/components-parallax-unzoom';
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
    await loadHyperframeFonts(__hfFonts);

            (function () {
              const grids = document.querySelectorAll(".parallax-unzoom-grid");
              grids.forEach((grid) => {
                const cards = Array.from(grid.querySelectorAll(".parallax-unzoom-card"));
                if (cards.length === 0) return;
                let focal = cards.find((c) => c.dataset.puFocus === "true");
                if (!focal) {
                  focal = cards[Math.floor(cards.length / 2)];
                  focal.dataset.puFocus = "true";
                }
                const focusRow = Number(focal.dataset.puRow ?? 0);
                const focusCol = Number(focal.dataset.puCol ?? 0);
                const push =
                  parseFloat(getComputedStyle(grid).getPropertyValue("--pu-sibling-push")) || 900;
                cards.forEach((card) => {
                  if (card === focal) return;
                  const row = Number(card.dataset.puRow ?? 0);
                  const col = Number(card.dataset.puCol ?? 0);
                  const dCol = col - focusCol;
                  const dRow = row - focusRow;
                  const mag = Math.hypot(dCol, dRow) || 1;
                  const nx = (dCol / mag) * push * mag;
                  const ny = (dRow / mag) * push * mag;
                  card.style.setProperty("--pu-dx", `${nx}px`);
                  card.style.setProperty("--pu-dy", `${ny}px`);
                });
              });

              const tl = gsap.timeline({ paused: true });

              tl.to(
                ".hero-headline",
                {
                  opacity: 0,
                  duration: 0.5,
                  ease: "power2.in",
                },
                0.3,
              );

              tl.fromTo(
                ".parallax-unzoom-grid",
                { "--pu-progress": 0 },
                {
                  "--pu-progress": 1,
                  duration: 3.0,
                  ease: "power2.inOut",
                },
                0.5,
              );

              tl.fromTo(
                ".parallax-unzoom-card:not([data-pu-focus='true'])",
                { opacity: 0 },
                {
                  opacity: 1,
                  duration: 1.5,
                  ease: "power2.out",
                  stagger: { each: 0.02, from: "center" },
                },
                2.0,
              );

              tl.to(
                ".focus-label",
                {
                  opacity: 1,
                  duration: 1.0,
                  ease: "power2.out",
                },
                2.5,
              );

              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#1a1a20">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="parallax-unzoom-demo"
          data-width="1920"
          data-height="1080"
          data-duration="6"
          data-start="0"
        >
          <div class="demo-canvas">
            <div class="hero-headline">Inspired by how people discover.</div>
    
            <div class="parallax-unzoom-grid">
              <div class="parallax-unzoom-card pu-c0" data-pu-row="0" data-pu-col="0">
                <span class="card-glyph">◇</span>
              </div>
              <div class="parallax-unzoom-card pu-c1" data-pu-row="0" data-pu-col="1">
                <span class="card-glyph">◐</span>
              </div>
              <div class="parallax-unzoom-card pu-c2" data-pu-row="0" data-pu-col="2">
                <span class="card-glyph">◯</span>
              </div>
              <div class="parallax-unzoom-card pu-c3" data-pu-row="0" data-pu-col="3">
                <span class="card-glyph">◑</span>
              </div>
              <div class="parallax-unzoom-card pu-c4" data-pu-row="0" data-pu-col="4">
                <span class="card-glyph">▲</span>
              </div>
    
              <div class="parallax-unzoom-card pu-c5" data-pu-row="1" data-pu-col="0">
                <span class="card-glyph">✦</span>
              </div>
              <div class="parallax-unzoom-card pu-c6" data-pu-row="1" data-pu-col="1">
                <span class="card-glyph">❖</span>
              </div>
              <div
                class="parallax-unzoom-card pu-c7-focus"
                data-pu-row="1"
                data-pu-col="2"
                data-pu-focus="true"
              >
                <div class="focus-label">
                  <small>EBAY PLAYBOOK</small>
                  DISCOVER
                </div>
              </div>
              <div class="parallax-unzoom-card pu-c8" data-pu-row="1" data-pu-col="3">
                <span class="card-glyph">✧</span>
              </div>
              <div class="parallax-unzoom-card pu-c9" data-pu-row="1" data-pu-col="4">
                <span class="card-glyph">◈</span>
              </div>
    
              <div class="parallax-unzoom-card pu-c10" data-pu-row="2" data-pu-col="0">
                <span class="card-glyph">▼</span>
              </div>
              <div class="parallax-unzoom-card pu-c11" data-pu-row="2" data-pu-col="1">
                <span class="card-glyph">◆</span>
              </div>
              <div class="parallax-unzoom-card pu-c12" data-pu-row="2" data-pu-col="2">
                <span class="card-glyph">●</span>
              </div>
              <div class="parallax-unzoom-card pu-c13" data-pu-row="2" data-pu-col="3">
                <span class="card-glyph">◭</span>
              </div>
              <div class="parallax-unzoom-card pu-c14" data-pu-row="2" data-pu-col="4">
                <span class="card-glyph" style="color: rgba(40, 40, 40, 0.7)">◇</span>
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
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .hf-port {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #1a1a20;
    font-family: "Inter", system-ui, sans-serif;
  }

  .demo-canvas {
    width: 1920px;
    height: 1080px;
    position: relative;
    overflow: hidden;
  }

  .parallax-unzoom-grid {
    display: grid;
    grid-template-columns: repeat(5, 360px);
    grid-template-rows: repeat(3, 341px);
    gap: 30px;
  }

  .parallax-unzoom-card {
    border-radius: 22px;
    overflow: hidden;
    position: relative;
    box-shadow: 0 12px 36px rgba(20, 20, 30, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .card-glyph {
    font-size: 92px;
    font-weight: 800;
    color: rgba(255, 255, 255, 0.92);
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.18);
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .pu-c0 {
    background: linear-gradient(135deg, #3a8b6f, #1d4d3d);
  }
  .pu-c1 {
    background: linear-gradient(135deg, #8b4a3a, #4a2418);
  }
  .pu-c2 {
    background: linear-gradient(135deg, #c89868, #8a6038);
  }
  .pu-c3 {
    background: linear-gradient(135deg, #3a6088, #1a2f4a);
  }
  .pu-c4 {
    background: linear-gradient(135deg, #b03838, #6a1818);
  }
  .pu-c5 {
    background: linear-gradient(135deg, #bcbcbc, #6e6e6e);
  }
  .pu-c6 {
    background: linear-gradient(135deg, #8a5fa0, #4a2860);
  }
  .pu-c7-focus {
    background: linear-gradient(135deg, #f5c93f, #d99a18);
  }
  .pu-c8 {
    background: linear-gradient(135deg, #d8d8d8, #9a9a9a);
  }
  .pu-c9 {
    background: linear-gradient(135deg, #5fa37e, #2a6a4a);
  }
  .pu-c10 {
    background: linear-gradient(135deg, #d1b66a, #8a7028);
  }
  .pu-c11 {
    background: linear-gradient(135deg, #4f7fc0, #1f3f80);
  }
  .pu-c12 {
    background: linear-gradient(135deg, #5a3a8f, #2a1858);
  }
  .pu-c13 {
    background: linear-gradient(135deg, #b85a3a, #6a2818);
  }
  .pu-c14 {
    background: linear-gradient(135deg, #f0f0e8, #c8c8be);
  }

  .parallax-unzoom-card[data-pu-focus="true"] {
    grid-column: 3;
    grid-row: 2;
  }

  .focus-label {
    font-weight: 900;
    font-size: 56px;
    letter-spacing: -0.04em;
    color: #1a1208;
    text-align: center;
    line-height: 1;
    opacity: 0;
  }

  .focus-label small {
    display: block;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 0.18em;
    margin-bottom: 14px;
    color: rgba(26, 18, 8, 0.7);
  }

  .hero-headline {
    position: absolute;
    top: 80px;
    left: 0;
    width: 100%;
    text-align: center;
    font-size: 68px;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: #1a1a1a;
    opacity: 1;
  }

  .parallax-unzoom-grid {
    --pu-progress: 0;
    --pu-focus-scale: 6;
    --pu-sibling-push: 900px;
    --pu-sibling-fade: 0;
    position: relative;
  }

  .parallax-unzoom-card {
    transform-origin: center center;
    will-change: transform, opacity;
    transform: translate3d(
      calc(var(--pu-dx, 0px) * (1 - var(--pu-progress))),
      calc(var(--pu-dy, 0px) * (1 - var(--pu-progress))),
      0
    )
    scale(calc(0.7 + 0.3 * var(--pu-progress)));
    opacity: calc(var(--pu-progress) * var(--pu-sibling-fade));
  }

  .parallax-unzoom-card[data-pu-focus="true"] {
    z-index: 10;
    transform: translate3d(0, 0, 0)
    scale(calc(var(--pu-focus-scale) - (var(--pu-focus-scale) - 1) * var(--pu-progress)));
    opacity: 1;
  }
}
</style>
