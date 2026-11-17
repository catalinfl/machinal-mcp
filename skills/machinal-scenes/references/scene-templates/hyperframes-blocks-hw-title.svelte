<!-- Modified Svelte adaptation of registry/blocks/hw-title/hw-title.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-hw-title';
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
               Handwritten title with the highlight-sweep scalar (the shared
               mk-callout-highlight mechanic) + squiggle underline + the boil.
               Demonstrates the dispatcher composing sweep + boil on one
               timeline (learning: one onUpdate — everything through hwOnUpdate). */
            var CONFIG = {
              text: "shine like the star you are",
              fontSize: 120,
              scheme: "chalk", // "chalk" (white, over footage) | "ink" (dark, boards)
              sweep: { enabled: true, start: 0.8, end: 3.2 },
              underline: { enabled: true, wobble: 6 },
              boil: { enabled: true, amp: 1.4, rot: 0.3, frameDrop: 3 },
              seed: 8,
              x: null, // null = centered
              y: null,
              animationIn: true,
              animationOut: true,
            };

            var DUR = 6;
            function clamp(v, lo, hi) {
              return Math.min(hi, Math.max(lo, v));
            }
            var IN = clamp(DUR * 0.08, 0.3, 0.8);
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

            var FULL = CONFIG.scheme === "ink" ? "#26241f" : "#f4f2ec";
            var FAINT = CONFIG.scheme === "ink" ? "rgba(38,36,31,0.3)" : "rgba(244,242,236,0.32)";

            var wrap = document.getElementById("hw-t-wrap");
            var line = document.getElementById("hw-t-line");
            line.style.fontSize = CONFIG.fontSize + "px";

            /* word spans */
            var wordEls = [];
            CONFIG.text.split(/\s+/).forEach(function (w, i) {
              if (i > 0) line.appendChild(document.createTextNode(" "));
              var span = document.createElement("span");
              span.className = "w";
              span.textContent = w;
              span.style.color = CONFIG.sweep.enabled ? FAINT : FULL;
              line.appendChild(span);
              wordEls.push(span);
            });

            /* measure + position; build squiggle underline to match width */
            var rect = line.getBoundingClientRect();
            wrap.style.left =
              (CONFIG.x === null ? Math.round((1920 - rect.width) / 2) : CONFIG.x) + "px";
            wrap.style.top =
              (CONFIG.y === null ? Math.round((1080 - rect.height) / 2) - 20 : CONFIG.y) + "px";

            var underPath = document.getElementById("hw-t-under-path");
            if (CONFIG.underline.enabled) {
              var uw = Math.round(rect.width);
              var svg = document.getElementById("hw-t-under");
              svg.setAttribute("width", uw);
              svg.setAttribute("viewBox", "0 0 " + uw + " 34");
              var segs = Math.max(6, Math.round(uw / 90));
              var d = "M 2 " + (16 + window.hwHash(0, CONFIG.seed) * 4).toFixed(1);
              for (var i = 1; i <= segs; i++) {
                var x = (uw / segs) * i;
                var y = 16 + window.hwHash(i * 5 + 1, CONFIG.seed) * CONFIG.underline.wobble;
                var cxp = x - uw / segs / 2 + window.hwHash(i * 5 + 2, CONFIG.seed) * 10;
                var cyp = 16 + (i % 2 ? -1 : 1) * (8 + window.hwHash(i * 5 + 3, CONFIG.seed) * 4);
                d +=
                  " Q " +
                  cxp.toFixed(1) +
                  " " +
                  cyp.toFixed(1) +
                  " " +
                  x.toFixed(1) +
                  " " +
                  y.toFixed(1);
              }
              underPath.setAttribute("d", d);
            } else {
              document.getElementById("hw-t-under").style.display = "none";
            }

            var tl = gsap.timeline({ paused: true });

            if (CONFIG.animationIn) {
              gsap.set(wrap, { opacity: 0 });
              tl.to(wrap, { opacity: 1, duration: IN, ease: "power2.out" }, 0.1);
            }

            /* the sweep scalar — registered through the dispatcher so it
               coexists with the boil on the same timeline */
            if (CONFIG.sweep.enabled) {
              var mix = gsap.utils.interpolate(FAINT, FULL);
              var st = { p: 0 };
              window.hwOnUpdate(tl, function () {
                var k = st.p * wordEls.length;
                for (var i = 0; i < wordEls.length; i++) {
                  var f = Math.max(0, Math.min(1, k - i));
                  wordEls[i].style.color = mix(f);
                }
              });
              tl.to(
                st,
                { p: 1, duration: CONFIG.sweep.end - CONFIG.sweep.start, ease: "none" },
                CONFIG.sweep.start,
              );
            }

            /* underline draws as the sweep lands */
            if (CONFIG.underline.enabled) {
              var len = underPath.getTotalLength();
              gsap.set(underPath, { strokeDasharray: len, strokeDashoffset: len });
              var uAt = CONFIG.sweep.enabled ? CONFIG.sweep.end - 0.2 : 0.8;
              tl.to(underPath, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, uAt);
            }

            if (CONFIG.boil.enabled) {
              window.hwBoil(tl, "#hw-t-wrap", {
                amp: CONFIG.boil.amp,
                rot: CONFIG.boil.rot,
                frameDrop: CONFIG.boil.frameDrop,
                seed: CONFIG.seed,
              });
            }

            if (CONFIG.animationOut) {
              tl.to(wrap, { opacity: 0, duration: OUT, ease: "power2.in" }, DUR - OUT - 0.05);
            }
            tl.set("#hw-t-root", { visibility: "hidden" }, DUR - 0.02);

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="hw-t-root"
          data-composition-id="hw-title"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
        >
          <div id="hw-t-wrap">
            <div id="hw-t-line"></div>
            <svg id="hw-t-under" width="10" height="34"><path id="hw-t-under-path"></path></svg>
          </div>
          <div
            id="hw-t-drv"
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
  #hw-t-root {
    /* ---- hw tokens ---- */
    --hw-font-print: "Caveat", cursive;
    --hw-font-script: "Caveat", cursive;
    --hw-ink: #f4f2ec;
    --hw-ink-dark: #26241f;
    --hw-accent-warm: #ffb020;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent; /* overlays footage or a board */
    font-family: var(--hw-font-print, "Caveat", cursive);
  }
  #hw-t-wrap {
    position: absolute;
    pointer-events: none;
  }
  #hw-t-line {
    font-weight: 700;
    line-height: 1.1;
    white-space: nowrap;
    text-shadow: 0 2px 18px rgba(0, 0, 0, 0.4);
  }
  #hw-t-line .w {
    display: inline;
  }
  #hw-t-under {
    overflow: visible;
    display: block;
  }
  #hw-t-under path {
    fill: none;
    stroke: var(--hw-accent-warm);
    stroke-width: 7;
    stroke-linecap: round;
  }
}
</style>
