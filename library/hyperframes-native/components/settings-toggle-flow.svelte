<!-- Modified Svelte adaptation of registry/components/settings-toggle-flow/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            tl.fromTo(
              ".hf-ui-settings-flow",
              { opacity: 0, y: 24 },
              { opacity: 1, y: 0, duration: 0.34, ease: "power2.out" },
              0.28,
            );
            tl.fromTo(
              ".hf-ui-settings-row",
              { x: -18, opacity: 0 },
              { x: 0, opacity: 1, duration: 0.28, stagger: 0.08, ease: "power2.out" },
              0.55,
            );
            tl.fromTo(
              ".hf-ui-settings-row i.on",
              { scale: 0.92 },
              { scale: 1, duration: 0.28, stagger: 0.08, ease: "back.out(1.8)" },
              0.88,
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
          data-composition-id="settings-toggle-flow-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-ui-settings-flow">
              <div class="hf-ui-settings-row">
                <div><strong>Auto captions</strong><span>Generate timed captions</span></div>
                <i class="on"></i>
              </div>
              <div class="hf-ui-settings-row">
                <div><strong>Brand kit</strong><span>Apply saved colors</span></div>
                <i class="on"></i>
              </div>
              <div class="hf-ui-settings-row">
                <div><strong>Sound effects</strong><span>Layer subtle UI sounds</span></div>
                <i></i>
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
    background: #f8fafc;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 520px;
    padding: 56px;
    transform: scale(
      1.2
    ); /* ponytail: scale wrapper not GSAP target; GSAP animates .hf-ui-settings-flow and children */
    transform-origin: center center;
  }
  .hf-ui-settings-flow {
    display: grid;
    gap: 12px;
    width: 520px;
    padding: 18px;
    border: 1px solid #e4e4e7;
    border-radius: 28px;
    background: #ffffff;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 26px 80px rgba(0, 0, 0, 0.1);
  }
  .hf-ui-settings-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 72px;
    padding: 0 16px;
    border-radius: 18px;
    background: #f8fafc;
  }
  .hf-ui-settings-row div {
    display: grid;
    gap: 4px;
  }
  .hf-ui-settings-row strong {
    font-size: 18px;
  }
  .hf-ui-settings-row span {
    color: #71717a;
    font-size: 13px;
    font-weight: 500;
  }
  .hf-ui-settings-row i {
    position: relative;
    width: 50px;
    height: 28px;
    border-radius: 999px;
    background: #d4d4d8;
  }
  .hf-ui-settings-row i::after {
    content: "";
    position: absolute;
    left: 4px;
    top: 4px;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #ffffff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
  }
  .hf-ui-settings-row i.on {
    background: #18181b;
  }
  .hf-ui-settings-row i.on::after {
    transform: translateX(22px);
  }
}
</style>
