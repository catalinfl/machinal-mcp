<!-- Modified Svelte adaptation of registry/components/text-match-cut/text-match-cut.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                "use strict";

                var root = document.getElementById("root");
                var shell = root.querySelector(".tmx-shell");
                var texts = [root.querySelector(".tmx-text-a"), root.querySelector(".tmx-text-b")];
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var MODES = {
                  "scale-down": { prop: "scale", v0: 1.7, v1: 1.0, sweep: 1 },
                  "scale-up": { prop: "scale", v0: 0.6, v1: 1.0, sweep: 1 },
                  "tracking-in": { prop: "tracking", v0: 0.22, v1: -0.052, sweep: 1 },
                  "slide-left": { prop: "x", v0: 0.0885, v1: -0.0885, sweep: -1 },
                  "slide-right": { prop: "x", v0: -0.0885, v1: 0.0885, sweep: 1 },
                  "slide-up": { prop: "y", v0: 0.139, v1: -0.139, sweep: 1 },
                  "slide-down": { prop: "y", v0: -0.139, v1: 0.139, sweep: 1 },
                };
                var mode = MODES[vars.mode] ? MODES[vars.mode] : MODES["scale-down"];
                var textA = vars.text_a == null ? "Basic Interface Behavior" : String(vars.text_a);
                var textB = vars.text_b == null ? "Thoughtful Experience Design" : String(vars.text_b);
                shell.dataset.bg = vars.background === "transparent" ? "transparent" : "navy";
                shell.dataset.sweep = vars.sweep === "off" ? "off" : "on";
                var copy = [textA, textB];
                texts.forEach(function (el, i) {
                  el.querySelector(".tmx-white").textContent = copy[i];
                  el.querySelector(".tmx-grad").textContent = copy[i];
                });

                // cubic-bezier(a, 0, 1 - a, 1), solved by bisection. 0.85 is the
                // measured AE easy-ease influence; 0.87 is the gradient precomp's.
                function bez(a, x) {
                  var p1x = a,
                    p2x = 1 - a,
                    lo = 0,
                    hi = 1,
                    t,
                    bx;
                  for (var i = 0; i < 28; i++) {
                    t = (lo + hi) / 2;
                    bx = 3 * (1 - t) * (1 - t) * t * p1x + 3 * (1 - t) * t * t * p2x + t * t * t;
                    if (bx < x) lo = t;
                    else hi = t;
                  }
                  t = (lo + hi) / 2;
                  return 3 * (1 - t) * t * t + t * t * t;
                }
                var E85 = function (x) {
                  return bez(0.85, x);
                };
                var EBAR = function (x) {
                  return bez(0.87, x);
                };

                var IN_BASE = 2.0;
                var OUT_BASE = 0.3;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3"));
                var envelopeBase = IN_BASE + OUT_BASE;
                var phaseScale = duration < envelopeBase ? duration / envelopeBase : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var CUT_AT = IN / 2;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;
                var FPS = parseFloat(root.dataset.fps || "30") || 30;

                // Geometry, measured at build time so the tweens are pure functions of time.
                var W = root.clientWidth || 1920;
                var H = root.clientHeight || 1080;
                var FS = parseFloat(getComputedStyle(texts[0]).fontSize) || H * 0.082;
                var natW = texts.map(function (el, i) {
                  var w = el.querySelector(".tmx-white").getBoundingClientRect().width;
                  return w > 0 ? w : copy[i].length * FS * 0.47;
                });
                var CX = W / 2;
                var D_GRAD = (2316 / 1920) * W; // gradient bar travel
                var XG_CUT = CX - (12 / 1920) * W; // bar centre at the cut
                var BAR = (720 / 1920) * W; // bar width (~620 px of it reads as colour)
                texts.forEach(function (el, i) {
                  gsap.set(el, {
                    width: natW[i],
                    height: FS,
                    xPercent: -50,
                    yPercent: -50,
                    transformOrigin: "50% 50%",
                  });
                });

                // One value curve. p = E85(t / IN); value = v0 + (v1 - v0) * p; both texts read it.
                var clock = { t: 0 };
                function apply() {
                  var tt = Math.min(1, Math.max(0, clock.t));
                  var p = E85(tt);
                  var val = mode.v0 + (mode.v1 - mode.v0) * p;
                  var s = mode.prop === "scale" ? val : 1;
                  var x = mode.prop === "x" ? val * W : 0;
                  var y = mode.prop === "y" ? val * H : 0;
                  var ls = mode.prop === "tracking" ? val : -0.052;
                  var xg = XG_CUT + (EBAR(tt) - 0.5) * D_GRAD * mode.sweep;
                  // motion smear stands in for AE motion blur: proportional to px per frame
                  var dp =
                    (E85(Math.min(1, tt + 0.002)) - E85(Math.max(0, tt - 0.002))) / 0.004 / IN / FPS;
                  var v = 0;
                  if (mode.prop === "x") v = Math.abs((mode.v1 - mode.v0) * W * dp);
                  else if (mode.prop === "y") v = Math.abs((mode.v1 - mode.v0) * H * dp);
                  else if (mode.prop === "scale")
                    v = Math.abs(((mode.v1 - mode.v0) * dp * natW[tt < 0.5 ? 0 : 1]) / 2);
                  else v = Math.abs((mode.v1 - mode.v0) * dp * FS * 12);
                  var blur = Math.min(6, v * 0.07) * (H / 1080);
                  texts.forEach(function (el, i) {
                    var w = natW[i] + (ls + 0.052) * FS * copy[i].length;
                    if (mode.prop === "tracking") gsap.set(el, { width: w });
                    el.style.letterSpacing = ls + "em";
                    gsap.set(el, { scale: s, x: x, y: y, filter: "blur(" + blur.toFixed(2) + "px)" });
                    var bw = BAR / s;
                    var g = el.querySelector(".tmx-grad");
                    g.style.backgroundSize = bw + "px 100%";
                    g.style.backgroundPositionX = w / 2 + (xg - CX - x) / s - bw / 2 + "px";
                  });
                }

                var tl = gsap.timeline({ paused: true });

                tl.set(shell, { opacity: 0 }, 0);
                tl.set(texts[0], { autoAlpha: 1 }, 0);
                tl.set(texts[1], { autoAlpha: 0 }, 0);
                tl.to(shell, { opacity: 1, duration: Math.min(0.2, IN), ease: "power2.out" }, 0);
                tl.fromTo(
                  clock,
                  { t: 0 },
                  { t: 1, duration: IN, ease: "none", onUpdate: apply, immediateRender: false },
                  0,
                );

                // HARD CUT at the speed peak: text A leaves, text B arrives at the same value.
                tl.set(texts[0], { autoAlpha: 0 }, CUT_AT);
                tl.set(texts[1], { autoAlpha: 1 }, CUT_AT);

                tl.to(shell, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                apply();
                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "text_a", "type": "string", "role": "content", "label": "Outgoing text", "description": "The line on screen before the cut.", "default": "Basic Interface Behavior" &#125;,
        &#123; "id": "text_b", "type": "string", "role": "content", "label": "Incoming text", "description": "The line that continues the move after the cut.", "default": "Thoughtful Experience Design" &#125;,
        &#123; "id": "mode", "type": "enum", "role": "style", "label": "Move", "description": "Which property carries the cut. Both texts ride the same curve.", "default": "scale-down", "options": [
          &#123; "value": "scale-down", "label": "Scale down (tutorial)" &#125;, &#123; "value": "scale-up", "label": "Scale up" &#125;, &#123; "value": "tracking-in", "label": "Tracking in" &#125;,
          &#123; "value": "slide-left", "label": "Slide left" &#125;, &#123; "value": "slide-right", "label": "Slide right" &#125;, &#123; "value": "slide-up", "label": "Slide up" &#125;, &#123; "value": "slide-down", "label": "Slide down" &#125; ] &#125;,
        &#123; "id": "sweep", "type": "enum", "role": "style", "label": "Gradient sweep", "description": "Cyan-to-blue bar sweeping through the glyphs around the cut.", "default": "on", "options": [&#123; "value": "on", "label": "On" &#125;, &#123; "value": "off", "label": "Off" &#125;] &#125;,
        &#123; "id": "background", "type": "enum", "role": "style", "label": "Background", "description": "The tutorial navy glow, or transparent so the host shows through.", "default": "navy", "options": [&#123; "value": "navy", "label": "Navy glow" &#125;, &#123; "value": "transparent", "label": "Transparent" &#125;] &#125;
      ]' data-composition-duration="3" data-composition-id="text-match-cut" data-duration="3" data-fps="30">
            
    
            <div
              id="text-match-cut-clip"
              class="tmx-clip clip"
              data-start="0"
              data-duration="3"
              data-track-index="0"
            >
              <div class="tmx-shell" data-bg="navy" data-sweep="on">
                <div class="tmx-text tmx-text-a" aria-label="Outgoing text">
                  <span class="tmx-layer tmx-white" data-layout-allow-occlusion></span
                  ><span class="tmx-layer tmx-grad" aria-hidden="true"></span>
                </div>
                <div class="tmx-text tmx-text-b" aria-label="Incoming text">
                  <span class="tmx-layer tmx-white" data-layout-allow-occlusion></span
                  ><span class="tmx-layer tmx-grad" aria-hidden="true"></span>
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
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: #ffffff;
    font-family:
      Inter,
      system-ui,
      -apple-system,
      "Segoe UI",
      sans-serif;
    pointer-events: none;
  }

  .tmx-clip, .tmx-shell {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .tmx-shell[data-bg="navy"] {
    background: radial-gradient(
      48cqw 58cqh at 50% 104%,
      #05055e 0%,
      #030346 25%,
      #02022e 50%,
      #000012 80%,
      #000006 100%
    );
  }

  /* One text per layer. The wrapper is centred and carries the move;
  the two spans stack so the gradient reads through the glyphs. */
  .tmx-text {
    position: absolute;
    left: 50%;
    top: 50%;
    white-space: nowrap;
    font-size: 8.2cqmin;
    font-weight: 450;
    letter-spacing: -0.052em;
    line-height: 1;
    transform-origin: 50% 50%;
    will-change: transform, filter;
  }

  .tmx-layer {
    position: absolute;
    left: 0;
    top: 0;
    white-space: nowrap;
    letter-spacing: inherit;
  }

  .tmx-grad {
    color: transparent;
    -webkit-background-clip: text;
    background-clip: text;
    background-repeat: no-repeat;
    background-image: linear-gradient(
      90deg,
      rgba(0, 197, 255, 0) 0%,
      rgba(0, 197, 255, 1) 16%,
      rgba(0, 180, 255, 1) 30%,
      rgba(7, 38, 249, 1) 58%,
      rgba(66, 71, 255, 1) 76%,
      rgba(93, 86, 255, 0) 100%
    );
  }

  .tmx-shell[data-sweep="off"] .tmx-grad {
    display: none;
  }
}
</style>
