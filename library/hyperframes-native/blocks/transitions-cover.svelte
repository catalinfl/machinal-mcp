<!-- Modified Svelte adaptation of registry/blocks/transitions-cover/transitions-cover.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            // Generate horizontal blind strips
            var blindsHTML = "";
            for (var i = 0; i < 8; i++) {
              blindsHTML +=
                '<div id="blind-' +
                i +
                '" style="position:absolute; left:0; width:1920px; height:135px; top:' +
                i * 135 +
                "px; background:" +
                [
                  "#3A0CA3",
                  "#4361EE",
                  "#4CC9F0",
                  "#F72585",
                  "#3A0CA3",
                  "#4361EE",
                  "#4CC9F0",
                  "#F72585",
                ][i] +
                '; transform:translateX(-1920px);"></div>';
            }
            document.getElementById("blinds-container").innerHTML = blindsHTML;

            // Generate vertical blind strips
            var vblindsHTML = "";
            for (var i = 0; i < 8; i++) {
              vblindsHTML +=
                '<div id="vblind-' +
                i +
                '" style="position:absolute; top:0; height:1080px; width:240px; left:' +
                i * 240 +
                "px; background:" +
                [
                  "#3A0CA3",
                  "#4361EE",
                  "#4CC9F0",
                  "#F72585",
                  "#3A0CA3",
                  "#4361EE",
                  "#4CC9F0",
                  "#F72585",
                ][i] +
                '; transform:translateY(-1080px);"></div>';
            }
            document.getElementById("vblinds-container").innerHTML = vblindsHTML;

            var tl = gsap.timeline({ paused: false });
            
            __hfTimelineSlot.set(tl);

            // Own the full transform via GSAP from the start (not CSS), so the
            // later x tweens below don't clobber a value GSAP never tracked.
            gsap.set(["#wipe-a", "#wipe-b"], { x: -1920 });

            // Transition demos config
            var demos = [
              { label: "STAGGERED BLOCKS", desc: "Use a staggered color blocks transition" },
              { label: "HORIZONTAL BLINDS", desc: "Use a horizontal blinds transition" },
              { label: "VERTICAL BLINDS", desc: "Use a vertical blinds transition" },
            ];

            // Reset scenes helper
            function resetScenes(t, demoIndex) {
              tl.set("#scene1", { opacity: 1 }, t);
              tl.set("#scene2", { opacity: 0 }, t);
              tl.set("#info-label-a", { textContent: demos[demoIndex].label }, t);
              tl.set("#info-desc-a", { textContent: demos[demoIndex].desc }, t);
              tl.set("#info-label-b", { textContent: demos[demoIndex].label }, t);
              tl.set("#info-desc-b", { textContent: demos[demoIndex].desc }, t);
              // Reset wipes
              tl.set("#wipe-a", { x: -1920 }, t);
              tl.set("#wipe-b", { x: -1920 }, t);
              // Reset horizontal blinds
              for (var i = 0; i < 8; i++) {
                tl.set("#blind-" + i, { x: -1920 }, t);
              }
              // Reset vertical blinds
              for (var i = 0; i < 8; i++) {
                tl.set("#vblind-" + i, { y: -1080 }, t);
              }
            }

            // ===== TITLE CARD (0s - 3s) =====
            tl.to("#title-h1", { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, 0.3);
            tl.to("#title-sub", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 0.6);
            tl.to("#title-card", { opacity: 0, duration: 0.4, ease: "power1.inOut" }, 2.5);

            // ===== DEMO 1: STAGGERED BLOCKS (3s - 8s) =====
            var T1 = 3;
            resetScenes(T1, 0);
            // Show Scene A for a beat, then transition at midpoint
            var T = T1 + 2;
            tl.set("#wipe-a", { x: -1920 }, T - 0.01);
            tl.set("#wipe-b", { x: -1920 }, T - 0.01);
            tl.to("#wipe-a", { x: 0, duration: 0.25, ease: "power3.inOut" }, T);
            tl.to("#wipe-b", { x: 0, duration: 0.25, ease: "power3.inOut" }, T + 0.06);
            tl.set("#scene1", { opacity: 0 }, T + 0.2);
            tl.set("#scene2", { opacity: 1 }, T + 0.2);
            tl.to("#wipe-a", { x: 1920, duration: 0.25, ease: "power3.inOut" }, T + 0.28);
            tl.to("#wipe-b", { x: 1920, duration: 0.25, ease: "power3.inOut" }, T + 0.34);

            // ===== DEMO 2: HORIZONTAL BLINDS (8s - 13s) =====
            var T2 = 8;
            resetScenes(T2, 1);
            T = T2 + 2;
            var stagger = 0.03;
            for (var i = 0; i < 8; i++) {
              tl.fromTo(
                "#blind-" + i,
                { x: -1920 },
                { x: 0, duration: 0.2, ease: "power3.inOut" },
                T + i * stagger,
              );
            }
            tl.set("#scene1", { opacity: 0 }, T + 0.5);
            tl.set("#scene2", { opacity: 1 }, T + 0.5);
            for (var i = 0; i < 8; i++) {
              tl.to(
                "#blind-" + i,
                { x: 1920, duration: 0.2, ease: "power3.inOut" },
                T + 0.55 + i * stagger,
              );
            }

            // ===== DEMO 3: VERTICAL BLINDS (13s - 18s) =====
            var T3 = 13;
            resetScenes(T3, 2);
            T = T3 + 2;
            for (var i = 0; i < 8; i++) {
              tl.fromTo(
                "#vblind-" + i,
                { y: -1080 },
                { y: 0, duration: 0.2, ease: "power3.inOut" },
                T + i * 0.03,
              );
            }
            tl.set("#scene1", { opacity: 0 }, T + 0.5);
            tl.set("#scene2", { opacity: 1 }, T + 0.5);
            for (var i = 0; i < 8; i++) {
              tl.to(
                "#vblind-" + i,
                { y: 1080, duration: 0.2, ease: "power3.inOut" },
                T + 0.55 + i * 0.03,
              );
            }

            // ===== OUTRO (18s - 21s) =====
            tl.to("#scene1", { opacity: 0, duration: 0.3 }, 18);
            tl.to("#scene2", { opacity: 0, duration: 0.3 }, 18);
            tl.to("#outro", { opacity: 1, duration: 0.4, ease: "power1.inOut" }, 18.2);
            tl.to("#outro-h2", { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, 18.5);
            tl.to("#outro-tag", { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, 18.8);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="comp"
          data-composition-id="main"
          data-start="0"
          data-duration="21"
          data-width="1920"
          data-height="1080"
          style="position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #000"
        >
          
          <div id="title-card">
            <h1 id="title-h1">Cover Transitions</h1>
            <div class="subtitle" id="title-sub">3 transition styles</div>
          </div>
    
          
          <div id="scene1">
            <div class="scene-number">ONE</div>
            <div class="scene-label">SCENE A</div>
            <div class="info-bar">
              <span class="label" id="info-label-a"></span>
              <span class="desc" id="info-desc-a"></span>
            </div>
          </div>
    
          
          <div id="scene2">
            <div class="scene-number">TWO</div>
            <div class="scene-label">SCENE B</div>
            <div class="info-bar">
              <span class="label" id="info-label-b"></span>
              <span class="desc" id="info-desc-b"></span>
            </div>
          </div>
    
          
          <div id="wipe-a" style="position: absolute; inset: 0; background: #f72585; z-index: 50"></div>
          <div id="wipe-b" style="position: absolute; inset: 0; background: #7209b7; z-index: 49"></div>
    
          
          <div
            id="blinds-container"
            style="position: absolute; inset: 0; z-index: 50; pointer-events: none"
          ></div>
    
          
          <div
            id="vblinds-container"
            style="position: absolute; inset: 0; z-index: 50; pointer-events: none"
          ></div>
    
          
          <div id="outro">
            <h2 id="outro-h2">Cover Transitions</h2>
            <div class="tag" id="outro-tag">End of showcase</div>
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
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }

  /* Title Card */
  #title-card {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 1;
  }
  #title-card h1 {
    font-size: 72px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -1px;
    opacity: 0;
    transform: translateY(30px);
  }
  #title-card .subtitle {
    font-size: 28px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.5);
    margin-top: 12px;
    opacity: 0;
    transform: translateY(20px);
  }

  /* Scenes */
  #scene1, #scene2 {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  #scene1 {
    background: #1b263b;
    z-index: 2;
    opacity: 0;
  }
  #scene2 {
    background: #e07a5f;
    z-index: 1;
    opacity: 0;
  }

  .scene-number {
    font-size: 180px;
    font-weight: 900;
    line-height: 1;
    opacity: 0.12;
    letter-spacing: -6px;
  }
  #scene1 .scene-number {
    color: #fff;
  }
  #scene2 .scene-number {
    color: #000;
  }

  .scene-label {
    font-size: 48px;
    font-weight: 700;
    margin-top: -20px;
  }
  #scene1 .scene-label {
    color: #fff;
  }
  #scene2 .scene-label {
    color: #fff;
  }

  /* Info bar */
  .info-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 48px;
  }
  #scene1 .info-bar {
    background: rgba(0, 0, 0, 0.3);
  }
  #scene2 .info-bar {
    background: rgba(0, 0, 0, 0.2);
  }
  .info-bar .label {
    font-size: 18px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
    letter-spacing: 2px;
  }
  .info-bar .desc {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
  }

  /* Outro */
  #outro {
    position: absolute;
    inset: 0;
    z-index: 10;
    background: linear-gradient(135deg, #0d1b2a 0%, #1b263b 100%);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    opacity: 0;
  }
  #outro h2 {
    font-size: 56px;
    font-weight: 800;
    color: #fff;
    opacity: 0;
    transform: translateY(20px);
  }
  #outro .tag {
    font-size: 22px;
    color: rgba(255, 255, 255, 0.4);
    margin-top: 10px;
    opacity: 0;
    transform: translateY(15px);
  }
}
</style>
