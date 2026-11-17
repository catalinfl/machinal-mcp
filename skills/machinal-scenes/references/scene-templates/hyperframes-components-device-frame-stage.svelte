<!-- Modified Svelte adaptation of registry/components/device-frame-stage/device-frame-stage.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var html = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              var root = document.getElementById("root");
              var frame = root.querySelector(".device-frame");
              var screen = root.querySelector(".device-screen");
              var viewport = root.querySelector(".screen-viewport");

              var declared = {};
              try {
                JSON.parse(html.getAttribute("data-composition-variables") || "[]").forEach(
                  function (variable) {
                    declared[variable.id] = variable.default;
                  },
                );
              } catch (error) {}
              var vars = Object.assign({}, declared, __hfHost.variables || {});

              var device = vars.device === "tablet" ? "tablet" : "phone";
              var cutout = vars.cutout === "island" || vars.cutout === "notch" ? vars.cutout : "none";
              var body = vars.body === "silver" ? "silver" : "graphite";

              frame.setAttribute("data-kind", device);
              frame.setAttribute("data-cutout", cutout);
              frame.setAttribute("data-body", body);

              var LOGICAL = { phone: [390, 844], tablet: [768, 1024] };
              var logicalWidth = LOGICAL[device][0];
              var logicalHeight = LOGICAL[device][1];
              viewport.style.setProperty("--logical-width", String(logicalWidth));
              viewport.style.setProperty("--logical-height", String(logicalHeight));

              function updateScreenScale() {
                var rect = screen.getBoundingClientRect();
                if (rect.width > 0)
                  viewport.style.setProperty("--screen-scale", String(rect.width / logicalWidth));
              }
              updateScreenScale();
              if (typeof ResizeObserver !== "undefined") {
                new ResizeObserver(updateScreenScale).observe(screen);
              }

              // NOTE: the timeline registration key below is a literal string,
              // not read from root.getAttribute("data-composition-id") -- when
              // this file is mounted via data-composition-src, the compiler
              // strips data-composition-id from the inlined root (the HOST
              // clip keeps its own copy instead), so a live read here would
              // return null and the host would never find this timeline (see
              // sub-compositions.md, Pitfall 2). registry/test-scenes/slots/empty.html
              // models the same literal-key pattern.
              var compositionId = "device-frame-stage";
              var duration = Math.max(
                0.001,
                parseFloat(
                  root.dataset.duration || html.getAttribute("data-composition-duration") || "5",
                ),
              );

              // INVARIANT: IN/OUT durations are fixed by device-frame-spec's entry
              // and exit law; only HOLD stretches or compresses to fit whatever
              // duration the host gives this instance. Never gsap.timeScale().
              var IN_DELAY = 0.18;
              var IN_RISE = 0.72;
              var IN_SETTLE = 0.18;
              var IN_BASE = IN_DELAY + IN_RISE + IN_SETTLE; // 1.08s
              var OUT_BASE = 0.56;
              var totalBase = IN_BASE + OUT_BASE;
              var IN = IN_BASE;
              var OUT = OUT_BASE;
              if (duration < totalBase) {
                var shrink = duration / totalBase;
                IN = IN_BASE * shrink;
                OUT = OUT_BASE * shrink;
              }
              var HOLD = Math.max(0, duration - (IN + OUT));
              var OUT_AT = IN + HOLD;
              // SYNC POINT: device-settled fires at t = IN (fixed offset into IN,
              // never inside the elastic HOLD).

              function easeOutCubic(x) {
                return 1 - Math.pow(1 - x, 3);
              }
              function easeInOutQuad(x) {
                return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
              }
              function easeInQuad(x) {
                return x * x;
              }

              function setPose(yCqh, scaleValue) {
                frame.style.setProperty("--device-y", yCqh.toFixed(3) + "cqh");
                frame.style.setProperty("--device-scale", scaleValue.toFixed(4));
              }

              function renderIn(t) {
                var delayEnd = IN_DELAY * (IN / IN_BASE);
                var riseEnd = delayEnd + IN_RISE * (IN / IN_BASE);
                if (t <= delayEnd) {
                  setPose(18, 0.94);
                  return;
                }
                if (t <= riseEnd) {
                  var p = easeOutCubic(
                    Math.min(1, (t - delayEnd) / Math.max(0.0001, riseEnd - delayEnd)),
                  );
                  setPose(18 + (-1.2 - 18) * p, 0.94 + (1.01 - 0.94) * p);
                  return;
                }
                var p2 = easeInOutQuad(Math.min(1, (t - riseEnd) / Math.max(0.0001, IN - riseEnd)));
                setPose(-1.2 + (0 - -1.2) * p2, 1.01 + (1 - 1.01) * p2);
              }

              // RETIME RANGE: the idle float is the only elastic segment. It
              // repeats for as long as HOLD lasts, so stretching the host duration
              // never re-times the fixed IN or OUT phases above.
              function renderHold(holdT) {
                var period = 3.2;
                var amp = 0.6;
                var phase = ((holdT % period) / period) * Math.PI * 2;
                setPose(Math.sin(phase) * amp, 1);
              }

              function renderOut(p) {
                var e = easeInQuad(Math.min(1, p));
                setPose(0 + 18 * e, 1 + (0.96 - 1) * e);
              }

              function render(t) {
                if (t <= IN) renderIn(t);
                else if (t < OUT_AT) renderHold(t - IN);
                else renderOut((t - OUT_AT) / Math.max(0.0001, OUT));
              }

              function fireSfx(id, atTime) {
                root.dispatchEvent(
                  new CustomEvent("hf:sfx", { detail: { id: id, t: atTime }, bubbles: true }),
                );
              }

              var proxy = { t: 0 };
              var tl = gsap.timeline({ paused: true });
              tl.to(proxy, {
                t: duration,
                duration: duration,
                ease: "none",
                onUpdate: function () {
                  render(proxy.t);
                },
              });
              tl.call(
                function () {
                  fireSfx("device-settle-soft", IN);
                },
                [],
                IN,
              );
              tl.to({}, { duration: Math.max(0, duration - tl.duration()) });
              render(0);
              tl.seek(0);
              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
            id="root"
            data-composition-id="device-frame-stage"
            data-width="1920"
            data-height="1080"
            data-duration="5"
          >
            <div class="device-stage">
              <div class="device-frame" data-kind="phone" data-cutout="none" data-body="graphite">
                <div class="device-screen">
                  <div class="screen-viewport">
                    <div class="screen-safe-area">
                      <div class="device-screen-slot" data-screen-slot>
                        
                      </div>
                    </div>
                  </div>
                </div>
                <div class="device-cutout" aria-hidden="true"></div>
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

  /* INVARIANT: root is styled by #root, never a class -- the compiler
  scopes CSS to [data-composition-id="device-frame-stage"] as a
  descendant selector, so a rule keyed on the root's own class would
  never match the root itself (see sub-compositions.md, Pitfall 3).
  This primitive is elastic and fills whatever box a host clip
  gives it, from a 960x540 slot up to a full 1920x1080 frame.

  The width/height !important below is load-bearing, not decoration:
    when this root gets inlined into a host, the compiler's
    flatten step (prepareFlattenedInnerRoot) reads this element's own
    data-width/data-height (required by the root_missing_dimensions
      lint rule) and force-writes them back as an inline
    style="width:1920px;height:1080px". Inline style beats a plain
    stylesheet rule, so without !important the root would render at a
    fixed 1920x1080 instead of filling the host box -- exactly the
    2x-oversized-and-bleeding bug this primitive was fixed for. */
    #root {
      position: absolute;
    inset: 0;
    width: 100% !important;
    height: 100% !important;
    container-type: size;
    isolation: isolate;
  }

  .device-stage {
    --stage-perspective: 1600px;
    position: absolute;
    inset: 0;
    perspective: var(--stage-perspective);
    perspective-origin: 50% 50%;
  }

  .device-frame {
    /* INVARIANT: geometry below is physical-material law from
    device-frame-spec.md (corner/bezel/aspect percentages, gradient,
      shadow), not brand paint. It may carry literal fallbacks per the
    primitive's material exception; do not swap in --radius/--space-*. */
    --device-color: #1b1d22;
    --device-color-hi: #343740;
    --device-color-dark: #111318;
    --device-radius: 46px;
    --device-bezel: 9px;
    --screen-radius: calc(var(--device-radius) - var(--device-bezel));
    --device-aspect: 9 / 19.5;
    --device-y: 18cqh;
    --device-scale: 0.94;

    position: absolute;
    left: 50%;
    top: 50%;
    height: 90cqh;
    aspect-ratio: var(--device-aspect);
    border-radius: var(--device-radius);
    padding: var(--device-bezel);
    background: linear-gradient(
      145deg,
      var(--device-color-hi),
      var(--device-color) 42%,
      var(--device-color-dark)
    );
    border: 1px solid rgba(255, 255, 255, 0.22);
    box-shadow:
      0 52px 110px rgba(7, 10, 20, 0.3),
      0 18px 38px rgba(7, 10, 20, 0.22),
      0 3px 9px rgba(7, 10, 20, 0.16),
      inset 0 1px 0 rgba(255, 255, 255, 0.24),
      inset 0 0 0 1px rgba(0, 0, 0, 0.48);
    transform: translate(-50%, calc(-50% + var(--device-y))) scale(var(--device-scale));
    transform-style: preserve-3d;
    transform-origin: 50% 88%;
    will-change: transform;
  }

  /* EDIT ZONE: kind/cutout/body are driven by data-composition-variables
  (see JS below); an installing agent may also override
  --device-color / --device-color-hi / --device-color-dark inline for
  a bespoke finish without touching the geometry laws. */
  .device-frame[data-kind="tablet"] {
    --device-radius: 48px;
    --device-bezel: 16px;
    --screen-radius: 34px;
    --device-aspect: 3 / 4;
    height: 82cqh;
  }

  .device-frame[data-body="silver"] {
    --device-color: #c9cdd3;
    --device-color-hi: #eef1f4;
    --device-color-dark: #9a9ea6;
  }

  .device-screen {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    border-radius: var(--screen-radius);
    background: var(--surface, #f5f6f8);
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.42);
    isolation: isolate;
    container-type: size;
  }

  .screen-viewport {
    /* Logical-pixel authoring space (390x844 phone / 768x1024 tablet),
    uniformly scaled to the actual screen box by JS-measured
    --screen-scale (device-frame-spec, "Screen content contract"). The
    scale is scene setup, not animation. */
    position: absolute;
    left: 0;
    top: 0;
    width: calc(var(--logical-width, 390) * 1px);
    height: calc(var(--logical-height, 844) * 1px);
    transform-origin: 0 0;
    transform: scale(var(--screen-scale, 1));
  }

  .screen-safe-area {
    height: 100%;
    box-sizing: border-box;
    padding-top: calc(var(--logical-height, 844) * 1px * 0.03);
  }

  .device-frame[data-cutout="island"] .screen-safe-area {
    padding-top: calc(var(--logical-height, 844) * 1px * 0.075);
  }

  .device-frame[data-cutout="notch"] .screen-safe-area {
    padding-top: calc(var(--logical-height, 844) * 1px * 0.06);
  }

  .device-screen-slot {
    position: relative;
    width: 100%;
    height: 100%;
  }

  /* Visible only while the slot is empty (comments do not count toward
    :empty); vanishes the moment an installing agent drops real content
  in, no cleanup required. */
  .device-screen-slot:empty {
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px dashed var(--border, rgba(15, 23, 42, 0.16));
    border-radius: calc(var(--screen-radius) * 0.4);
  }

  .device-screen-slot:empty::before {
    content: "screen slot: replace with reconstructed UI";
    padding: var(--space-2, 16px);
    color: var(--muted, #94a3b8);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    font-size: 15px;
    text-align: center;
  }

  .device-cutout {
    position: absolute;
    left: 50%;
    top: 0;
    z-index: 50;
    width: 0;
    height: 0;
    background: #050607;
    pointer-events: none;
    transform: translateX(-50%);
  }

  .device-frame[data-cutout="island"] .device-cutout {
    top: 1.4%;
    width: 28%;
    height: 3.2%;
    border-radius: 999px;
  }

  .device-frame[data-cutout="notch"] .device-cutout {
    top: 0;
    width: 52%;
    height: 3.8%;
    border-radius: 0 0 18px 18px;
  }
}
</style>
