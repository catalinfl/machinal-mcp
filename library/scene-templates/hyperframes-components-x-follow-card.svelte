<!-- Modified Svelte adaptation of registry/components/x-follow-card/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              ".hf-catalog-x-follow-card .stat",
              { "--hf-stat-y": "28px", opacity: 0 },
              { "--hf-stat-y": "0px", opacity: 1, duration: 0.46, ease: "back.out(1.6)" },
              startTime,
            );
            tl.fromTo(
              ".hf-catalog-x-follow-card .avatars span",
              { "--hf-avatar-y": "18px", "--hf-avatar-opacity": 0 },
              {
                "--hf-avatar-y": "0px",
                "--hf-avatar-opacity": 1,
                duration: 0.28,
                stagger: 0.05,
                ease: "power2.out",
              },
              startTime + 0.22,
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
          data-composition-id="x-follow-card-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="hf-catalog-x-follow-card">
              <header>
                <div class="avatar"></div>
                <div>
                  <h3>X Follow Card</h3>
                  <p>A social follow card with avatar, handle, and follower motion.</p>
                </div>
              </header>
              <div class="stat">30.6K</div>
              <div class="avatars">
                <span style="--c: var(--hf-l1)"></span><span style="--c: var(--hf-l2)"></span
                ><span style="--c: var(--hf-l2)"></span><span style="--c: var(--hf-l2)"></span
                ><span style="--c: var(--hf-l2)"></span><span style="--c: var(--hf-l2)"></span>
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
  .demo-frame {
    display: grid;
    place-items: center;
    padding: 52px;
    /* ponytail: scale wrapper (not a GSAP target) to fill ~65% of 1920px frame */
    transform: scale(1.9);
    transform-origin: center center;
  }
  .hf-catalog-x-follow-card {
    --hf-accent: var(--accent, #f8fafc);
    --hf-ink: #111827;
    --hf-l1: rgba(255, 255, 255, 0.72);
    --hf-l2: rgba(255, 255, 255, 0.45);
    --hf-muted: #6b7280;
    --hf-surface: #ffffff;
    color: var(--hf-ink);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-catalog-x-follow-card {
    width: 700px;
    border-radius: 30px;
    padding: 34px;
    background: #0f172a;
    color: #fff;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
  }
  .hf-catalog-x-follow-card header {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .hf-catalog-x-follow-card .avatar {
    width: 70px;
    height: 70px;
    border-radius: 22px;
    background: var(--hf-l1);
  }
  .hf-catalog-x-follow-card h3 {
    margin: 0;
    font-size: 36px;
    letter-spacing: -0.04em;
  }
  .hf-catalog-x-follow-card p {
    color: #94a3b8;
    margin: 4px 0 0;
    font-size: 18px;
  }
  .hf-catalog-x-follow-card .stat {
    margin-top: 30px;
    font-size: 82px;
    font-weight: 900;
    letter-spacing: -0.08em;
    transform: translateY(var(--hf-stat-y, 0px));
  }
  .hf-catalog-x-follow-card .avatars {
    display: flex;
    margin-top: 18px;
  }
  .hf-catalog-x-follow-card .avatars span {
    width: 46px;
    height: 46px;
    border-radius: 999px;
    border: 3px solid #0f172a;
    margin-left: -10px;
    background: var(--c);
    opacity: var(--hf-avatar-opacity, 1);
    transform: translateY(var(--hf-avatar-y, 0px));
  }
}
</style>
