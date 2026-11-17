<!-- Modified Svelte adaptation of registry/blocks/transitions-grid/transitions-grid.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            var tl = gsap.timeline({ defaults: { ease: "none" } });
            
            __hfTimelineSlot.set(tl);

            // Generate grid cells
            var gridColors = [
              "#F72585",
              "#7209B7",
              "#3A0CA3",
              "#4361EE",
              "#4CC9F0",
              "#F72585",
              "#7209B7",
              "#3A0CA3",
              "#4361EE",
              "#4CC9F0",
              "#F72585",
              "#7209B7",
            ];
            var gridHTML = "";
            for (var g = 0; g < 12; g++) {
              gridHTML +=
                '<div id="cell-' +
                g +
                '" style="background:' +
                gridColors[g % gridColors.length] +
                '; opacity:0;"></div>';
            }
            document.getElementById("grid-container").innerHTML = gridHTML;

            function resetScenes() {
              tl.set("#scene1", { opacity: 1 });
              tl.set("#scene2", { opacity: 0 });
              tl.set("#s1", { x: 0, y: 0, scale: 1, filter: "blur(0px)", opacity: 1 });
              tl.set("#s2", { x: 0, y: 0, scale: 1, filter: "blur(0px)", opacity: 1 });
              for (var g = 0; g < 12; g++) {
                tl.set("#cell-" + g, { opacity: 0 });
              }
            }

            // ===== TITLE CARD (0–3s) =====
            tl.set("#title-card", { opacity: 1 }, 0);
            tl.fromTo(
              ".card-title",
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
              0.4,
            );
            tl.fromTo(
              ".card-sub",
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
              0.8,
            );
            tl.to("#title-card", { opacity: 0, duration: 0.4, ease: "power2.in" }, 2.6);

            // ===== DEMO 1: Grid Dissolve (3–8s) =====
            var T;

            tl.call(function () {}, [], 3);
            resetScenes();

            // Show info bar
            tl.to("#info1", { opacity: 1, duration: 0.3, ease: "power2.out" }, 3);

            // Hold 1.5s, transition at T=4.5
            T = 4.5;

            // Cell positions (col, row) and distance from center (1.5, 1)
            var cells = [];
            for (var g = 0; g < 12; g++) {
              var col = g % 4;
              var row = Math.floor(g / 4);
              var dist = Math.sqrt(Math.pow(col - 1.5, 2) + Math.pow(row - 1, 2));
              cells.push({ id: g, dist: dist });
            }
            cells.sort(function (a, b) {
              return a.dist - b.dist;
            });

            // Ripple in from center
            var stag = 0.04;
            for (var c = 0; c < cells.length; c++) {
              tl.to(
                "#cell-" + cells[c].id,
                { opacity: 1, duration: 0.15, ease: "power2.out" },
                T + c * stag,
              );
            }

            // Swap scenes at midpoint
            tl.set("#scene1", { opacity: 0 }, T + 0.35);
            tl.set("#scene2", { opacity: 1 }, T + 0.35);

            // Ripple out
            for (var c = 0; c < cells.length; c++) {
              tl.to(
                "#cell-" + cells[c].id,
                { opacity: 0, duration: 0.15, ease: "power2.in" },
                T + 0.5 + c * stag,
              );
            }

            // Hold 1.0s, hide info, gap 0.5s
            tl.to("#info1", { opacity: 0, duration: 0.3, ease: "power2.in" }, 7.0);

            // ===== OUTRO (8–11s) =====
            tl.set("#scene1", { opacity: 0 }, 8);
            tl.set("#scene2", { opacity: 0 }, 8);
            tl.set("#outro-card", { opacity: 1 }, 8);
            tl.fromTo(
              "#outro-card .card-title",
              { y: 30, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
              8.3,
            );
            tl.fromTo(
              "#outro-card .card-sub",
              { y: 20, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
              8.7,
            );
            tl.to("#outro-card", { opacity: 0, duration: 0.4, ease: "power2.in" }, 10.5);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="main"
          data-composition-id="main"
          data-start="0"
          data-duration="11"
          data-width="1920"
          data-height="1080"
          style="position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #000"
        >
          
          <div id="title-card">
            <div class="card-title">Grid Transitions</div>
            <div class="card-sub">Grid Dissolve</div>
          </div>
    
          
          <div id="scene1" class="scene" style="opacity: 0">
            <div id="s1" class="scene-inner">
              <div class="scene-num">ONE</div>
              <div class="scene-label">Scene A</div>
            </div>
          </div>
    
          
          <div id="scene2" class="scene" style="opacity: 0">
            <div id="s2" class="scene-inner">
              <div class="scene-num">TWO</div>
              <div class="scene-label">Scene B</div>
            </div>
          </div>
    
          
          <div
            id="grid-container"
            style="
              position: absolute;
              inset: 0;
              z-index: 50;
              pointer-events: none;
              display: grid;
              grid-template-columns: repeat(4, 480px);
              grid-template-rows: repeat(3, 360px);
            "
          ></div>
    
          
          <div id="info1" class="info-bar">
            <div class="info-name">Grid Dissolve</div>
            <div class="info-cat">Grid</div>
          </div>
    
          
          <div id="outro-card">
            <div class="card-title">Grid Transitions</div>
            <div class="card-sub">End</div>
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
    background: #000;
    overflow: hidden;
  }

  .scene {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .scene-inner {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  #scene1 .scene-inner {
    background: #1b263b;
  }
  #scene2 .scene-inner {
    background: #e07a5f;
  }

  .scene-num {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 200px;
    font-weight: 900;
    color: rgba(255, 255, 255, 0.08);
    line-height: 1;
  }
  .scene-label {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 48px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.25);
    letter-spacing: 12px;
    text-transform: uppercase;
    margin-top: 10px;
  }

  .info-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 100;
    background: rgba(0, 0, 0, 0.88);
    padding: 28px 60px;
    opacity: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .info-bar .info-name {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 32px;
    font-weight: 700;
    color: #fff;
  }
  .info-bar .info-cat {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 18px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.4);
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  /* Title / Outro */
  #title-card, #outro-card {
    position: absolute;
    inset: 0;
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    background: #0d1117;
    opacity: 0;
  }
  .card-title {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 72px;
    font-weight: 800;
    color: #fff;
  }
  .card-sub {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 28px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 16px;
    letter-spacing: 6px;
    text-transform: uppercase;
  }
}
</style>
