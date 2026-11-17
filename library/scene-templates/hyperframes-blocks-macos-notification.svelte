<!-- Modified Svelte adaptation of registry/blocks/macos-notification/macos-notification.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-macos-notification';
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

          

          var tl = gsap.timeline({ paused: true });
          var notification = document.getElementById("notification");

          // Start off-screen to the right
          gsap.set(notification, { x: 420, opacity: 0 });

          // Slide in from right
          tl.to(
            notification,
            {
              x: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power3.out",
            },
            0.2,
          );

          // Slide out to right
          tl.to(
            notification,
            {
              x: 420,
              opacity: 0,
              duration: 0.3,
              ease: "power3.in",
            },
            4.2,
          );

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="macos-notification"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="5"
        >
          <div
            id="notification"
            class="clip notification-card"
            data-start="0"
            data-duration="5"
            data-track-index="0"
          >
            <div class="app-icon">
              <svg viewBox="0 0 36 36" fill="none">
                <defs>
                  <linearGradient
                    id="icon-grad"
                    x1="0"
                    y1="0"
                    x2="36"
                    y2="36"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop offset="0%" stop-color="#6366f1" />
                    <stop offset="100%" stop-color="#8b5cf6" />
                  </linearGradient>
                </defs>
                <rect width="36" height="36" rx="8" fill="url(#icon-grad)" />
                <text
                  x="18"
                  y="23"
                  text-anchor="middle"
                  font-family="Inter, sans-serif"
                  font-size="14"
                  font-weight="700"
                  fill="#fff"
                >
                  HF
                </text>
              </svg>
            </div>
            <div class="notification-content">
              <div class="notification-header">
                <span class="app-name">HyperFrames</span>
                <span class="time-label">now</span>
              </div>
              <div class="notification-title">Prompt to replace this title</div>
              <div class="notification-body">
                Prompt to change this body text, the app icon, and the app name to match your content.
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
    background: transparent;
    overflow: hidden;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    font-family: "Inter", sans-serif;
  }

  [data-composition-id="macos-notification"] .notification-card {
    position: absolute;
    top: 24px;
    right: 24px;
    width: 380px;
    background: rgba(30, 30, 30, 0.82);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-radius: 16px;
    padding: 16px;
    box-shadow:
      0 8px 32px rgba(0, 0, 0, 0.4),
      inset 0 0 0 0.5px rgba(255, 255, 255, 0.1);
    display: flex;
    gap: 12px;
    align-items: flex-start;
  }

  [data-composition-id="macos-notification"] .app-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    flex-shrink: 0;
    overflow: hidden;
  }

  [data-composition-id="macos-notification"] .app-icon svg {
    width: 36px;
    height: 36px;
    display: block;
  }

  [data-composition-id="macos-notification"] .notification-content {
    flex: 1;
    min-width: 0;
  }

  [data-composition-id="macos-notification"] .notification-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2px;
  }

  [data-composition-id="macos-notification"] .app-name {
    font-size: 13px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 0.02em;
  }

  [data-composition-id="macos-notification"] .time-label {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.35);
  }

  [data-composition-id="macos-notification"] .notification-title {
    font-size: 15px;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.3;
    margin-bottom: 2px;
  }

  [data-composition-id="macos-notification"] .notification-body {
    font-size: 13px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.6);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}
</style>
