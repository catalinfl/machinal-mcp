<!-- Modified Svelte adaptation of registry/components/camera-rig-depth-stack/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            ".hf-advanced-camera-rig-depth-stack .panel",
            { "--hf-rotate-y": "-20deg", "--hf-rotate-x": "12deg", "--hf-z": "-80px", opacity: 0 },
            {
              "--hf-rotate-y": "10deg",
              "--hf-rotate-x": "-4deg",
              "--hf-z": "80px",
              opacity: 1,
              duration: 1.2,
              ease: "power3.out",
            },
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
          data-composition-id="camera-rig-depth-stack-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="hf-advanced-camera-rig-depth-stack">
            <div class="panel">
              <div>
                <h3>Camera Rig Depth Stack</h3>
                <p>A 3D camera-rig-style card stack with depth, parallax, and focus shift.</p>
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
  .hf-advanced-camera-rig-depth-stack {
    color: #111827;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-advanced-camera-rig-depth-stack {
    position: relative;
    width: 760px;
    height: 430px;
    perspective: 900px;
    border-radius: 30px;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a, #312e81);
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
    /* ponytail: scale root (not a GSAP target) to fill ~65% of 1080px height */
    transform: scale(1.65);
  }
  .hf-advanced-camera-rig-depth-stack .panel {
    position: absolute;
    inset: 56px 90px;
    border-radius: 30px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.52));
    border: 1px solid rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(18px);
    transform: rotateY(var(--hf-rotate-y, -16deg)) rotateX(var(--hf-rotate-x, 9deg))
    translateZ(var(--hf-z, 0px));
    box-shadow: 0 28px 90px rgba(0, 0, 0, 0.22);
    display: grid;
    place-items: center;
    text-align: center;
  }
  .hf-advanced-camera-rig-depth-stack h3 {
    margin: 0;
    color: #111827;
    font-size: 42px;
    letter-spacing: -0.05em;
  }
  .hf-advanced-camera-rig-depth-stack p {
    margin: 8px 0 0;
    color: #475569;
    font-size: 18px;
  }
}
</style>
