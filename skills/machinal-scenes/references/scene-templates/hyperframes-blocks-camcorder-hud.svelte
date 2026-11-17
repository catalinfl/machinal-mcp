<!-- Modified Svelte adaptation of registry/blocks/camcorder-hud/camcorder-hud.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    var hud = document.getElementById("ch-hud");
          var counter = hud && hud.querySelector(".ch-counter-value");
          var recordDot = hud && hud.querySelector(".ch-record-dot");
          var host = hud && hud.closest("[data-composition-id]");
          if (!hud || !counter || !recordDot || !host) {
            throw new Error("Camcorder HUD could not find its composition host");
          }

          var compositionId = host.getAttribute("data-composition-id");
          var duration = Number(host.getAttribute("data-duration")) || 4;
          var counterStart = Number(hud.getAttribute("data-hf-counter-start")) || 0;
          var state = { seconds: 0 };

          function formatCounter(value) {
            var seconds = Math.max(0, Math.floor(value));
            var hours = Math.floor(seconds / 3600);
            var minutes = Math.floor((seconds % 3600) / 60);
            var remainder = seconds % 60;
            return [hours, minutes, remainder]
              .map(function (part) {
                return String(part).padStart(2, "0");
              })
              .join(":");
          }

          function updateHud() {
            counter.textContent = formatCounter(counterStart + state.seconds);
            recordDot.style.opacity = Math.floor(state.seconds / 0.55) % 2 === 0 ? "1" : "0.25";
          }

          var tl = gsap.timeline({ paused: true });
          tl.to(state, { seconds: duration, duration: duration, ease: "none", onUpdate: updateHud }, 0);
          updateHud();
          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="camcorder-hud"
          data-composition-id="camcorder-hud"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
        >
          <div id="ch-hud" data-hf-counter-start="0" aria-hidden="true">
            <div class="ch-corner ch-record"><span class="ch-record-dot"></span><span>REC</span></div>
            <div class="ch-corner ch-battery"></div>
            <div class="ch-corner ch-date">JAN 01 2000<br />12:00 AM</div>
            <div class="ch-corner ch-counter">
              <span class="ch-mode">SP · 16:9</span><span class="ch-counter-value">00:00:00</span>
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

  #ch-hud {
    --hf-camcorder-color: #fff;
    --hf-camcorder-accent: #f12c2c;
    --hf-camcorder-inset: 5vmin;
    --hf-camcorder-font-size: 3.7vmin;
    position: absolute;
    inset: 0;
    color: var(--hf-camcorder-color);
    font-family: monospace;
    font-size: var(--hf-camcorder-font-size);
    font-weight: 700;
    line-height: 1.25;
    pointer-events: none;
    -webkit-text-stroke: 0.12vmin rgb(0 0 0 / 92%);
    text-shadow: 0 0.2vmin 0.6vmin rgb(0 0 0 / 90%);
  }

  #ch-hud .ch-corner {
    position: absolute;
  }

  #ch-hud .ch-record {
    top: var(--hf-camcorder-inset);
    left: var(--hf-camcorder-inset);
    display: flex;
    align-items: center;
    gap: 1.8vmin;
  }

  #ch-hud .ch-record-dot {
    width: 2.2vmin;
    height: 2.2vmin;
    border-radius: 50%;
    background: var(--hf-camcorder-accent);
    box-shadow: 0 0 0.9vmin color-mix(in srgb, var(--hf-camcorder-accent) 55%, transparent);
  }

  #ch-hud .ch-battery {
    top: var(--hf-camcorder-inset);
    right: var(--hf-camcorder-inset);
    width: 7vmin;
    height: 3.5vmin;
    border: 0.35vmin solid currentcolor;
  }

  #ch-hud .ch-battery::before {
    position: absolute;
    top: 0.7vmin;
    left: 0.7vmin;
    width: 4.7vmin;
    height: 1.4vmin;
    background: currentcolor;
    content: "";
  }

  #ch-hud .ch-battery::after {
    position: absolute;
    top: 0.7vmin;
    right: -1vmin;
    width: 0.7vmin;
    height: 1.4vmin;
    background: currentcolor;
    content: "";
  }

  #ch-hud .ch-date {
    bottom: var(--hf-camcorder-inset);
    left: var(--hf-camcorder-inset);
  }

  #ch-hud .ch-counter {
    right: var(--hf-camcorder-inset);
    bottom: var(--hf-camcorder-inset);
    text-align: right;
  }

  #ch-hud .ch-mode {
    display: block;
    margin-bottom: 0.7vmin;
    font-size: 2.6vmin;
  }
}
</style>
