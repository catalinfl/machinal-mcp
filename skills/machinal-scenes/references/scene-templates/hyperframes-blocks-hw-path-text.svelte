<!-- Modified Svelte adaptation of registry/blocks/hw-path-text/hw-path-text.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-hw-path-text';
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

          (function () {
            

            /* ---- published parameters ----
               Handwriting along any path — custom path text, natively via
               SVG textPath (no Fusion overlay). CONFIG.d is the whole design. */
            var CONFIG = {
              text: "come on this wild journey with me...",
              d: "M 220 700 C 520 480, 900 820, 1230 560 S 1700 380, 1780 420",
              fontSize: 92,
              showGuide: true, // faint dotted guide under the writing
              typeCharDelay: 0.05,
              seed: 12,
              boil: { enabled: true, amp: 1.4, rot: 0.3, frameDrop: 3 },
              animationOut: true,
            };

            var DUR = 6;
            function clamp(v, lo, hi) {
              return Math.min(hi, Math.max(lo, v));
            }
            var OUT = clamp(DUR * 0.06, 0.25, 0.6);

            /* hw family runtime */
            window.hwOnUpdate = function (tl, fn) {
              if (!tl.__hwRenders) {
                tl.__hwRenders = [];
                tl.eventCallback("onUpdate", function () {
                  for (var i = 0; i < tl.__hwRenders.length; i++) tl.__hwRenders[i]();
                });
              }
              tl.__hwRenders.push(fn);
              fn();
            };
            window.hwHash = function (n, seed) {
              var x = Math.sin(n * 127.1 + (seed || 1) * 311.7) * 43758.5453;
              return (x - Math.floor(x)) * 2 - 1;
            };
            window.hwBoil = function (tl, target, opts) {
              opts = opts || {};
              var amp = opts.amp !== undefined ? opts.amp : 1.6;
              var rot = opts.rot !== undefined ? opts.rot : 0.5;
              var fps = opts.fps || 30;
              var drop = opts.frameDrop || 3;
              var seed = opts.seed || 1;
              var els = gsap.utils.toArray(target);
              window.hwOnUpdate(tl, function () {
                var step = Math.floor((tl.time() * fps) / drop);
                for (var i = 0; i < els.length; i++) {
                  gsap.set(els[i], {
                    x: window.hwHash(step * 3 + i * 97, seed) * amp,
                    y: window.hwHash(step * 3 + 1 + i * 97, seed) * amp,
                    rotation: (opts.baseRot || 0) + window.hwHash(step * 3 + 2 + i * 97, seed) * rot,
                  });
                }
              });
            };

            var pathEl = document.getElementById("hw-pt-path");
            var guide = document.getElementById("hw-pt-guide");
            pathEl.setAttribute("d", CONFIG.d);
            if (CONFIG.showGuide) guide.setAttribute("d", CONFIG.d);
            document.getElementById("hw-pt-text").setAttribute("font-size", CONFIG.fontSize);

            /* per-char tspans along the path */
            var NS = "http://www.w3.org/2000/svg";
            var tp = document.getElementById("hw-pt-tp");
            Array.from(CONFIG.text).forEach(function (ch) {
              var t = document.createElementNS(NS, "tspan");
              t.textContent = ch;
              tp.appendChild(t);
            });

            var tl = gsap.timeline({ paused: true });

            /* guide draws first, then the handwriting types along it */
            if (CONFIG.showGuide) {
              var glen = guide.getTotalLength();
              gsap.set(guide, { strokeDasharray: "2 14", strokeDashoffset: glen });
              tl.to(guide, { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut" }, 0.2);
            }
            var chars = tp.querySelectorAll("tspan");
            var delay = Math.min(CONFIG.typeCharDelay, 2.6 / Math.max(1, chars.length));
            tl.to(chars, { opacity: 1, duration: 0.03, stagger: delay, ease: "none" }, 0.7);

            if (CONFIG.boil.enabled) {
              window.hwBoil(tl, "#hw-pt-svg", {
                amp: CONFIG.boil.amp,
                rot: CONFIG.boil.rot,
                frameDrop: CONFIG.boil.frameDrop,
                seed: CONFIG.seed,
              });
            }

            if (CONFIG.animationOut) {
              tl.to("#hw-pt-svg", { opacity: 0, duration: OUT, ease: "power2.in" }, DUR - OUT - 0.05);
            }
            tl.set("#hw-pt-root", { visibility: "hidden" }, DUR - 0.02);

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="hw-pt-root"
          data-composition-id="hw-path-text"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
        >
          <svg id="hw-pt-svg" viewBox="0 0 1920 1080">
            <path id="hw-pt-path" d=""></path>
            <path id="hw-pt-guide" d=""></path>
            <text id="hw-pt-text" font-size="92">
              <textPath id="hw-pt-tp" href="#hw-pt-path" startOffset="4%"></textPath>
            </text>
          </svg>
          <div
            id="hw-pt-drv"
            class="clip"
            data-start="0"
            data-duration="6"
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
  #hw-pt-root {
    --hw-font-print: "Caveat", cursive;
    --hw-font-script: "Caveat", cursive;
    --hw-ink: #f4f2ec;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
    font-family: var(--hw-font-print, "Caveat", cursive);
  }
  #hw-pt-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  /* The textPath carrier is geometry only — without fill:none it inherits
  SVG's default black fill and renders as a solid blob under the text. */
  #hw-pt-path {
    fill: none;
  }
  #hw-pt-guide {
    fill: none;
    stroke: rgba(244, 242, 236, 0.22);
    stroke-width: 3;
    stroke-dasharray: 2 14;
    stroke-linecap: round;
  }
  #hw-pt-svg text {
    font-family: var(--hw-font-print, "Caveat", cursive);
    font-weight: 700;
    fill: var(--hw-ink);
  }
  #hw-pt-svg tspan {
    opacity: 0;
  }
}
</style>
