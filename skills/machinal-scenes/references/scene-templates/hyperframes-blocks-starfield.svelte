<!-- Modified Svelte adaptation of registry/blocks/starfield/starfield.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            var field = document.getElementById("hf-starfield");
            // Mounted, the runtime strips data-duration off this file's root; the host clip carries it.
            var host = field.closest("[data-composition-id]");
            var vars =
              __hfHost && __hfHost.getVariables
                ? __hfHost.getVariables()
                : {};

            var TONES = {
              warm: ["#fff7e0", "#ffe08a"],
              cool: ["#f2f8ff", "#a9d6ff"],
              white: ["#ffffff", "#ffffff"],
            };

            var COUNT = vars.density === "dense" ? 420 : 180;
            var palette = Object.prototype.hasOwnProperty.call(TONES, vars.tone)
              ? TONES[vars.tone]
              : TONES.warm;
            var cycleSeconds = vars.speed === "fast" ? 0.9 : 1.6;

            // Deterministic per-index hash (sin fold; no Math.random). registry/components/
            // stop-motion-cadence's rnd(n).
            function rnd(n) {
              var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
              return x - Math.floor(x);
            }

            var W = 1920;
            var H = 1080;
            var duration = Number(host.getAttribute("data-duration")) || 6;
            var TAU = 2 * Math.PI;
            var FADE = 0.12; // share of a star's drift spent fading in, and again fading out

            function smooth(x) {
              x = Math.min(1, Math.max(0, x / FADE));
              return x * x * (3 - 2 * x);
            }

            var stars = [];
            for (var i = 0; i < COUNT; i++) {
              // 70% faint 1 px far stars, 25% 1.6 px and 5% bright 2.6 px glowing near stars.
              var r = rnd(i + 7000);
              var tier = r < 0.7 ? 0 : r < 0.95 ? 1 : 2;
              var sizePx = [1, 1.6, 2.6][tier];
              var color = i % 3 === 0 ? palette[1] : palette[0];

              var el = document.createElement("div");
              el.className = "hf-star";
              el.style.width = sizePx + "px";
              el.style.height = sizePx + "px";
              el.style.background = color;
              if (tier === 2) {
                el.style.borderRadius = "50%";
                el.style.boxShadow = "0 0 3px 1px " + color + ", 0 0 8px 2px " + color + "80";
              }
              field.appendChild(el);

              // Whole cycles per star over the mount, drawn independently so the field as a
              // whole repeats only at t = duration, not every cycleSeconds.
              var cycles = Math.max(1, Math.round((duration / cycleSeconds) * (2 + rnd(i + 4000) * 2)));
              stars.push({
                el: el,
                x: rnd(i + 5000) * W - sizePx / 2,
                // Whole-pixel rows keep 1 px stars crisp; x stays fractional so drift is smooth.
                y: Math.round(rnd(i + 6000) * H - sizePx / 2),
                drift: (tier === 0 ? 2 : 5) * duration,
                lag: rnd(i + 8000),
                omega: TAU * cycles,
                phi: TAU * rnd(i + 1000),
                base: 0.75 + rnd(i + 2000) * 0.25,
                amp: tier === 2 ? 0.12 : 0.2 + rnd(i + 3000) * 0.2,
              });
            }

            var state = { phase: 0 };

            function render() {
              var p = state.phase;
              for (var s = 0; s < stars.length; s++) {
                var star = stars[s];
                var u = (p + star.lag) % 1;
                var twinkle = Math.min(1, star.base + star.amp * Math.sin(star.omega * p + star.phi));
                star.el.style.transform =
                  "translate3d(" + (star.x - star.drift * (u - 0.5)) + "px," + star.y + "px,0)";
                star.el.style.opacity = twinkle * smooth(u) * smooth(1 - u);
              }
            }

            var tl = gsap.timeline({ paused: true });
            tl.to(state, { phase: 1, duration: duration, ease: "none", onUpdate: render }, 0);
            render();

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="starfield"
          data-composition-id="starfield"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
          data-composition-variables='[
            &#123; "id": "density", "type": "enum", "role": "style", "label": "Density", "description": "Star count across the frame.", "default": "sparse", "options": [&#123; "value": "sparse", "label": "Sparse" &#125;, &#123; "value": "dense", "label": "Dense" &#125;] &#125;,
            &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Star color mix.", "default": "warm", "options": [&#123; "value": "warm", "label": "Warm (white + yellow)" &#125;, &#123; "value": "cool", "label": "Cool (white + blue)" &#125;, &#123; "value": "white", "label": "White only" &#125;] &#125;,
            &#123; "id": "speed", "type": "enum", "role": "style", "label": "Twinkle speed", "description": "How fast stars pulse.", "default": "slow", "options": [&#123; "value": "slow", "label": "Slow" &#125;, &#123; "value": "fast", "label": "Fast" &#125;] &#125;
          ]'
        >
          <div id="hf-starfield" aria-hidden="true"></div>
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

  #hf-starfield {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    /* Center clearance: a subject placed mid-frame stays readable by default. */
    -webkit-mask-image: radial-gradient(
      circle 230px at 50% 50%,
      transparent 0 230px,
      #000 653px
    );
    mask-image: radial-gradient(circle 230px at 50% 50%, transparent 0 230px, #000 653px);
  }

  #hf-starfield .hf-star {
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
