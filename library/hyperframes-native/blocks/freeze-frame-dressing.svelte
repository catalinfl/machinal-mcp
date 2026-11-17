<!-- Modified Svelte adaptation of registry/blocks/freeze-frame-dressing/freeze-frame-dressing.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    var paper = document.getElementById("hf-freeze-paper");
          var host = paper && paper.closest("[data-composition-id]");
          if (!host) throw new Error("Freeze-Frame Dressing could not find its composition host");

          var compositionId = host.getAttribute("data-composition-id");
          var duration = Number(host.getAttribute("data-duration")) || 4;
          var hit = Math.max(0.1, duration * 0.24);
          var exit = Math.max(hit + 0.7, duration - 0.3);
          var tl = gsap.timeline({ paused: true });

          tl.to({}, { duration: duration, ease: "none" }, 0);
          tl.to("#hf-freeze-flash", { opacity: 0.95, duration: 0.06, ease: "power2.out" }, hit);
          tl.to("#hf-freeze-flash", { opacity: 0, duration: 0.24, ease: "power2.in" }, hit + 0.06);
          tl.to("#hf-freeze-paper", { opacity: 0.64, duration: 0.18, ease: "power2.out" }, hit + 0.04);
          tl.fromTo(
            "#hf-freeze-tape-a",
            { opacity: 0, scale: 1.18 },
            { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
            hit + 0.3,
          );
          tl.fromTo(
            "#hf-freeze-tape-b",
            { opacity: 0, scale: 1.18 },
            { opacity: 1, scale: 1, duration: 0.24, ease: "power2.out" },
            hit + 0.42,
          );
          tl.to(
            ["#hf-freeze-paper", "#hf-freeze-tape-a", "#hf-freeze-tape-b"],
            { opacity: 0, duration: 0.24, ease: "power2.in" },
            exit,
          );

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="freeze-frame-dressing"
          data-composition-id="freeze-frame-dressing"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="hf-freeze-paper" aria-hidden="true"></div>
          <div id="hf-freeze-tape-a" class="hf-freeze-tape" aria-hidden="true"></div>
          <div id="hf-freeze-tape-b" class="hf-freeze-tape" aria-hidden="true"></div>
          <div id="hf-freeze-flash" aria-hidden="true"></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  .hf-port {
    width: 1920px;
    height: 1080px;
    margin: 0;
    overflow: hidden;
    background: transparent;
  }

  #hf-freeze-paper {
    position: absolute;
    inset: 0;
    opacity: 0;
    background:
      linear-gradient(115deg, rgb(248 84 73 / 86%) 0 16%, transparent 16%),
      linear-gradient(345deg, rgb(255 221 82 / 92%) 0 17%, transparent 17%),
      linear-gradient(rgb(244 240 224 / 78%), rgb(244 240 224 / 78%));
    clip-path: polygon(2% 8%, 97% 2%, 94% 94%, 6% 98%);
    mix-blend-mode: screen;
    pointer-events: none;
  }

  .hf-freeze-tape {
    position: absolute;
    width: 12.5vmin;
    height: 2.9vmin;
    opacity: 0;
    background: rgb(255 236 168 / 76%);
    border: 1px solid rgb(110 91 55 / 18%);
    box-shadow: 0 0.3vmin 0.8vmin rgb(20 16 10 / 18%);
    pointer-events: none;
  }

  #hf-freeze-tape-a {
    top: 8%;
    left: 12.5%;
    transform: rotate(-8deg);
  }

  #hf-freeze-tape-b {
    right: 12.5%;
    bottom: 7%;
    transform: rotate(7deg);
  }

  #hf-freeze-flash {
    position: absolute;
    inset: 0;
    opacity: 0;
    background: #fff;
    pointer-events: none;
  }
}
</style>
