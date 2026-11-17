<!-- Modified Svelte adaptation of registry/blocks/tiktok-follow/tiktok-follow.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-tiktok-follow';
  import __hfAsset from '@machinal/hyperframes/media/blocks-tiktok-follow';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { design = {} } = $props();
  const __hfScene = useScene();
  let root = $state();
  let timeline = $state.raw();

  // Host shim: the upstream page reads its editable variables from the
  // HyperFrames host. In the port they come from the approved `design` prop.
  const __hfHost = { getVariables: () => (design || {}), variables: design || {}, assetUrl: path => __hfAsset(path) };

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

          var card = document.getElementById("card");
          var btn = document.getElementById("follow-btn");
          var textFollow = document.getElementById("btn-follow");
          var textFollowing = document.getElementById("btn-following");

          // Start off-screen
          gsap.set(card, { y: 300, opacity: 0 });

          // Slide in from bottom
          tl.to(
            card,
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power3.out",
            },
            0.1,
          );

          // Hold, then button press-in
          tl.to(
            btn,
            {
              scale: 0.92,
              duration: 0.15,
              ease: "power2.out",
            },
            1.0,
          );

          // Button release with spring bounce
          tl.to(
            btn,
            {
              scale: 1,
              duration: 0.4,
              ease: "elastic.out(1, 0.4)",
            },
            1.15,
          );

          // Button background: rose-red → dark gray
          tl.to(
            btn,
            {
              backgroundColor: "#2f2f2f",
              duration: 0.12,
              ease: "none",
            },
            1.15,
          );

          // Fade out "Follow", fade in "Following"
          tl.to(
            textFollow,
            {
              opacity: 0,
              duration: 0.08,
              ease: "none",
            },
            1.15,
          );

          tl.to(
            textFollowing,
            {
              opacity: 1,
              duration: 0.08,
              ease: "none",
            },
            1.18,
          );

          // Slide out to bottom
          tl.to(
            card,
            {
              y: 300,
              opacity: 0,
              duration: 0.25,
              ease: "power3.in",
            },
            3.8,
          );

          __hfTimelineSlot.set(tl);
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="root"
          data-composition-id="tiktok-follow"
          data-width="1080"
          data-height="1920"
          data-start="0"
          data-duration="4.5"
        >
          <div
            id="card"
            class="clip lower-third"
            data-start="0"
            data-duration="4.5"
            data-track-index="0"
          >
            <img class="avatar" src={__hfAsset("assets/avatar.jpg")} alt="HeyGen" crossorigin="anonymous" />
            <div class="profile-info">
              <div class="display-name">HeyGen</div>
              <div class="handle">@heygen.com</div>
              <div class="follower-count">1,999 followers</div>
            </div>
            <div id="follow-btn" class="follow-btn">
              <span id="btn-follow" class="btn-text btn-text-follow">Follow</span>
              <span id="btn-following" class="btn-text btn-text-following">
                <span>Following</span>
                <span class="check-icon"
                  ><svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#fff"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline></svg
                ></span>
              </span>
            </div>
          </div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  .hf-port {
    width: 1080px;
    height: 1920px;
    font-family: "DM Sans", sans-serif;
  }

  [data-composition-id="tiktok-follow"] .lower-third {
    position: absolute;
    bottom: 160px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 30px;
    background: #1a1a1a;
    border-radius: 75px;
    padding: 25px 40px 25px 25px;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
  }

  [data-composition-id="tiktok-follow"] .avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
    border: 3px solid #333;
  }

  [data-composition-id="tiktok-follow"] .profile-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-right: 20px;
  }

  [data-composition-id="tiktok-follow"] .display-name {
    font-size: 42px;
    font-weight: 700;
    color: #ffffff;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  [data-composition-id="tiktok-follow"] .handle {
    font-size: 28px;
    font-weight: 400;
    color: #a0a0a0;
    line-height: 1.3;
  }

  [data-composition-id="tiktok-follow"] .follower-count {
    font-size: 25px;
    font-weight: 400;
    color: #737373;
    line-height: 1.3;
  }

  [data-composition-id="tiktok-follow"] .follow-btn {
    position: relative;
    width: 250px;
    height: 80px;
    border-radius: 40px;
    background: #fe2c55;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  [data-composition-id="tiktok-follow"] .btn-text {
    position: absolute;
    font-family: "DM Sans", sans-serif;
    font-size: 30px;
    font-weight: 700;
    color: #ffffff;
    letter-spacing: 0.02em;
    white-space: nowrap;
  }

  [data-composition-id="tiktok-follow"] .btn-text-follow {
    opacity: 1;
  }

  [data-composition-id="tiktok-follow"] .btn-text-following {
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-composition-id="tiktok-follow"] .check-icon {
    display: inline-block;
    width: 22px;
    height: 22px;
  }

  [data-composition-id="tiktok-follow"] .check-icon svg {
    width: 22px;
    height: 22px;
    display: block;
  }
}
</style>
