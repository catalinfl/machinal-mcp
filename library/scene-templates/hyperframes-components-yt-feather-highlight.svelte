<!-- Modified Svelte adaptation of registry/components/yt-feather-highlight/yt-feather-highlight.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            // ---- copy these helpers into the host script ----
            window.ytHighlightIn = function (tl, target, at, opts) {
              opts = opts || {};
              var vars = { opacity: 1, duration: 0.5, ease: "power2.out" };
              if (opts.x !== undefined) vars["--yt-hl-x"] = opts.x;
              if (opts.y !== undefined) vars["--yt-hl-y"] = opts.y;
              if (opts.rx !== undefined) vars["--yt-hl-rx"] = opts.rx;
              if (opts.ry !== undefined) vars["--yt-hl-ry"] = opts.ry;
              gsap.set(target, {
                "--yt-hl-x": opts.x !== undefined ? opts.x : "50%",
                "--yt-hl-y": opts.y !== undefined ? opts.y : "50%",
                "--yt-hl-rx": opts.rx !== undefined ? opts.rx : "22%",
                "--yt-hl-ry": opts.ry !== undefined ? opts.ry : "26%",
              });
              tl.to(target, { opacity: 1, duration: 0.5, ease: "power2.out" }, at);
            };
            window.ytHighlightTo = function (tl, target, at, opts, dur) {
              opts = opts || {};
              var vars = { duration: dur === undefined ? 0.8 : dur, ease: "power2.inOut" };
              if (opts.x !== undefined) vars["--yt-hl-x"] = opts.x;
              if (opts.y !== undefined) vars["--yt-hl-y"] = opts.y;
              if (opts.rx !== undefined) vars["--yt-hl-rx"] = opts.rx;
              if (opts.ry !== undefined) vars["--yt-hl-ry"] = opts.ry;
              tl.to(target, vars, at);
            };
            window.ytHighlightOut = function (tl, target, at) {
              tl.to(target, { opacity: 0, duration: 0.4, ease: "power2.in" }, at);
            };

            // Self-preview timeline: spotlight box A, glide to box B, release.
            var tl = gsap.timeline({ paused: true });
            window.ytHighlightIn(tl, "#yt-hl-demo", 0.5, { x: "26%", y: "50%", rx: "17%", ry: "24%" });
            window.ytHighlightTo(tl, "#yt-hl-demo", 2.2, { x: "74%" }, 0.9);
            window.ytHighlightOut(tl, "#yt-hl-demo", 4.2);
            tl.set("#yt-hl-root", { visibility: "hidden" }, 4.98);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="yt-hl-root"
          data-composition-id="yt-feather-highlight"
          data-start="0"
          data-duration="5"
          data-width="1920"
          data-height="1080"
        >
          <div id="yt-hl-scene">
            <div class="box">A</div>
            <div class="box">B</div>
          </div>
          <div class="yt-hl" id="yt-hl-demo"></div>
          <div
            id="yt-hl-drv"
            class="clip"
            data-start="0"
            data-duration="5"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  /* ---- yt-feather-highlight --------------------------------------------
  Spotlight part of the frame: a dim layer with a feathered ellipse
  hole. The hole's position/size are CSS variables, so the helpers
  tween them directly (GSAP animates CSS vars). */
  .yt-hl {
    --yt-hl-x: 50%;
    --yt-hl-y: 50%;
    --yt-hl-rx: 22%;
    --yt-hl-ry: 26%;
    --yt-hl-dim: 0.55;

    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0;
    background: rgba(6, 8, 12, var(--yt-hl-dim));
    -webkit-mask-image: radial-gradient(
      ellipse var(--yt-hl-rx) var(--yt-hl-ry) at var(--yt-hl-x) var(--yt-hl-y),
      transparent 0%,
      transparent 52%,
      black 88%
    );
    mask-image: radial-gradient(
      ellipse var(--yt-hl-rx) var(--yt-hl-ry) at var(--yt-hl-x) var(--yt-hl-y),
      transparent 0%,
      transparent 52%,
      black 88%
    );
  }
  /* self-preview stand-in scene (not part of the snippet) */
  #yt-hl-scene {
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, #2a7fff 0%, #7d5cff 100%);
    display: flex;
    align-items: center;
    justify-content: space-around;
    font-family: "Inter", ui-sans-serif, sans-serif;
    font-weight: 700;
    font-size: 64px;
    color: rgba(255, 255, 255, 0.92);
  }
  #yt-hl-scene .box {
    width: 420px;
    height: 300px;
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.16);
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
