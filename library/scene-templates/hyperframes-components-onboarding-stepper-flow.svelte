<!-- Modified Svelte adaptation of registry/components/onboarding-stepper-flow/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              ".hf-ui-onboarding-steps span",
              { scale: 0.7, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.28, stagger: 0.08, ease: "back.out(1.8)" },
              0.3,
            );
            tl.fromTo(
              ".hf-ui-onboarding-card",
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.42, ease: "power3.out" },
              0.62,
            );
            tl.to(
              ".hf-ui-onboarding-steps .active",
              { scale: 1.16, duration: 0.16, yoyo: true, repeat: 1, ease: "power1.inOut" },
              1.1,
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
          data-composition-id="onboarding-stepper-flow-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-ui-onboarding-flow">
              <div class="hf-ui-onboarding-steps">
                <span class="done">1</span><span class="active">2</span><span>3</span>
              </div>
              <div class="hf-ui-onboarding-card">
                <small>Step 2 of 3</small>
                <strong>Choose your visual style</strong>
                <p>Pick a direction so the agent can generate matching motion primitives.</p>
                <button type="button">Continue</button>
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
    background: #fafafa;
    font-family: Inter, system-ui, sans-serif;
  }
  /* ponytail: scale on .demo-frame (not a GSAP target) — safe CSS transform */
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 520px;
    padding: 56px;
    transform: scale(2.3);
  }
  .hf-ui-onboarding-flow {
    display: grid;
    gap: 22px;
    width: 520px;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-ui-onboarding-steps {
    display: flex;
    justify-content: center;
    gap: 18px;
  }
  .hf-ui-onboarding-steps span {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border: 2px solid #e4e4e7;
    border-radius: 999px;
    background: #ffffff;
    color: #71717a;
    font-size: 15px;
    font-weight: 600;
  }
  .hf-ui-onboarding-steps .done, .hf-ui-onboarding-steps .active {
    border-color: #18181b;
    background: #18181b;
    color: #ffffff;
  }
  .hf-ui-onboarding-card {
    display: grid;
    gap: 14px;
    padding: 34px;
    border: 1px solid #e4e4e7;
    border-radius: 28px;
    background: #ffffff;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.1);
  }
  .hf-ui-onboarding-card small {
    color: #71717a;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .hf-ui-onboarding-card strong {
    font-size: 30px;
    font-weight: 700;
    line-height: 1.1;
  }
  .hf-ui-onboarding-card p {
    margin: 0;
    color: #71717a;
    font-size: 16px;
    line-height: 1.5;
  }
  .hf-ui-onboarding-card button {
    justify-self: start;
    height: 46px;
    padding: 0 22px;
    border: 0;
    border-radius: 12px;
    background: #18181b;
    color: #ffffff;
    font-size: 15px;
    font-weight: 600;
    cursor: default;
  }
}
</style>
