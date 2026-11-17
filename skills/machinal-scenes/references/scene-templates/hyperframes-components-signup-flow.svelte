<!-- Modified Svelte adaptation of registry/components/signup-flow/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              ".hf-ui-signup-flow",
              { opacity: 0, y: 26 },
              { opacity: 1, y: 0, duration: 0.36, ease: "power2.out" },
              0.25,
            );
            tl.fromTo(
              ".hf-ui-signup-flow > *",
              { y: 14, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.24, stagger: 0.05, ease: "power2.out" },
              0.48,
            );
            tl.to(
              ".hf-ui-signup-submit",
              { scale: 0.97, duration: 0.12, yoyo: true, repeat: 1, ease: "power1.inOut" },
              1.2,
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
          data-composition-id="signup-flow-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-ui-signup-flow">
              <h3>Create account</h3>
              <button class="hf-ui-signup-social" type="button">Continue with Google</button>
              <div class="hf-ui-signup-divider"><span></span><em>or</em><span></span></div>
              <div class="hf-ui-signup-field">email@company.com</div>
              <div class="hf-ui-signup-field muted">Password</div>
              <button class="hf-ui-signup-submit" type="button">Start building</button>
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
    background: #fafafa;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 520px;
    padding: 56px;
    /* ponytail: scale-up wrapper (not a GSAP target); card was ~20% of frame */
    transform: scale(2.2);
  }
  .hf-ui-signup-flow {
    display: grid;
    gap: 14px;
    width: 430px;
    padding: 30px;
    border: 1px solid #e4e4e7;
    border-radius: 28px;
    background: #ffffff;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    box-shadow: 0 28px 84px rgba(0, 0, 0, 0.12);
  }
  .hf-ui-signup-flow h3 {
    margin: 0 0 6px;
    text-align: center;
    font-size: 28px;
  }
  .hf-ui-signup-flow button, .hf-ui-signup-field {
    height: 50px;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 600;
  }
  .hf-ui-signup-social, .hf-ui-signup-field {
    border: 1px solid #e4e4e7;
    background: #ffffff;
    color: #18181b;
  }
  .hf-ui-signup-field {
    display: flex;
    align-items: center;
    padding: 0 15px;
  }
  .hf-ui-signup-field.muted {
    color: #a1a1aa;
  }
  .hf-ui-signup-divider {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    align-items: center;
    color: #a1a1aa;
    font-size: 13px;
    font-weight: 500;
  }
  .hf-ui-signup-divider span {
    height: 1px;
    background: #e4e4e7;
  }
  .hf-ui-signup-submit {
    border: 0;
    background: #18181b;
    color: #ffffff;
  }
}
</style>
