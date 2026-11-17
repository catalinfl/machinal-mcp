<!-- Modified Svelte adaptation of registry/components/stop-motion-cadence/stop-motion-cadence.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".smc-stage");
                var shapes = root.querySelectorAll(".smc-shape");
                var shadows = root.querySelectorAll(".smc-shadow");
                var sparkles = root.querySelectorAll(".smc-sparkle");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var fps =
                  vars.fps === "8" || vars.fps === 8
                    ? 8
                    : vars.fps === "12" || vars.fps === 12
                      ? 12
                      : 10;
                var boil = vars.boil !== "off";
                var accentColors = {
                  green: "var(--brand, #52525b)",
                  blue: "var(--accent, #52525b)",
                  violet: "var(--accent-2, #52525b)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // The lead shape is the one accented element; the other two paper
                // cutouts separate by value step, not by a second and third hue.
                root.style.setProperty("--smc-c1", accentColors[accent]);
                root.style.setProperty(
                  "--smc-c2",
                  "color-mix(in srgb, var(--fg, #f8fafc) 72%, transparent)",
                );
                root.style.setProperty(
                  "--smc-c3",
                  "color-mix(in srgb, var(--fg, #f8fafc) 45%, transparent)",
                );

                // One-time stage measurement; all positions in px from here.
                var W = Math.max(1, stage.clientWidth);
                var H = Math.max(1, stage.clientHeight);
                var M = Math.min(W, H);
                var groundY = 0.72 * H;

                // Envelope: fixed IN/OUT, elastic HOLD; fps grid never scales.
                var IN_BASE = 3.0;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN_BASE * scale + OUT));
                var OUT_START = IN_BASE * scale + HOLD;

                // Choreography (seconds, scaled; converted to integer steps).
                // Each shape: launch, land, from (offstage), to (on the floor),
                // arc height, spin, squash amount, sparkle life in steps.
                function shapeSize(el) {
                  return { w: el.offsetWidth, h: el.offsetHeight };
                }
                var throws = [
                  {
                    t0: 0.15,
                    t1: 1.0,
                    from: { x: -0.12 * W, yB: 0.28 * H },
                    to: 0.3 * W,
                    arc: 0.3 * H,
                    rot0: -170,
                    rot1: 8,
                    squash: 0.3,
                    life: 2,
                  },
                  {
                    t0: 0.6,
                    t1: 1.5,
                    from: { x: 1.12 * W, yB: 0.2 * H },
                    to: 0.56 * W,
                    arc: 0.34 * H,
                    rot0: 150,
                    rot1: -6,
                    squash: 0.34,
                    life: 3,
                  },
                  {
                    t0: 1.25,
                    t1: 2.0,
                    from: { x: 0.78 * W, yB: -0.12 * H },
                    to: 0.72 * W,
                    arc: 0.06 * H,
                    rot0: -120,
                    rot1: 5,
                    squash: 0.26,
                    life: 2,
                  },
                  {
                    t0: 1.8,
                    t1: 2.55,
                    from: { x: -0.08 * W, yB: 0.1 * H },
                    to: 0.43 * W,
                    arc: 0.4 * H,
                    rot0: 200,
                    rot1: -12,
                    squash: 0.22,
                    life: 3,
                  },
                ];
                for (var s = 0; s < throws.length; s += 1) {
                  var th = throws[s];
                  th.t0 *= scale;
                  th.t1 *= scale;
                  th.landStep = Math.round(th.t1 * fps);
                  th.size = shapeSize(shapes[s]);
                  gsap.set(shapes[s], { transformOrigin: "50% 100%" });
                }

                // Deterministic per-index hash (sin fold; no Math.random).
                function rnd(n) {
                  var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
                  return x - Math.floor(x);
                }
                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }
                function lerp(a, b, p) {
                  return a + (b - a) * p;
                }

                // Squash schedule by steps-since-landing: hit, deep, rebound
                // stretch, settle. Positive widens (scaleX 1+a, scaleY 1-a).
                var SQUASH_ENV = [1, 0.55, -0.3, 0.1, 0];
                function squashAt(stepsSince, amount) {
                  if (stepsSince < 0) return 0;
                  if (stepsSince >= SQUASH_ENV.length) return 0;
                  return SQUASH_ENV[stepsSince] * amount;
                }

                // THE LAW: quantize first, then evaluate everything from ts.
                // The 1e-6 epsilon absorbs GSAP seek round-trip float error so
                // a seek landing exactly on a step boundary quantizes the same
                // way from either direction.
                function applyTime(timeSeconds) {
                  var step = Math.floor(timeSeconds * fps + 1e-6);
                  var ts = step / fps;
                  var boilIdx = Math.floor(step / 2);

                  for (var i = 0; i < throws.length; i += 1) {
                    var th = throws[i];
                    var el = shapes[i];
                    var sw = th.size.w;
                    var sh = th.size.h;
                    var landed = step >= th.landStep;
                    var u = clamp01((ts - th.t0) / Math.max(0.001, th.t1 - th.t0));
                    if (landed) u = 1;
                    var visible = ts >= th.t0;

                    // Ballistic arc: linear x, parabolic lift over the line
                    // from launch height to the ground.
                    var xC = lerp(th.from.x, th.to, u);
                    var yB = lerp(th.from.yB, groundY, u) - th.arc * 4 * u * (1 - u);
                    var rot = lerp(th.rot0, th.rot1, 1 - (1 - u) * (1 - u));

                    // Squash on the hit, keyed to integer steps since landing.
                    var a = squashAt(step - th.landStep, th.squash);
                    var sxq = 1 + a;
                    var syq = 1 - a * 0.85;

                    // 2-frame boil, seeded per boil window, per shape.
                    var bx = 0;
                    var by = 0;
                    var br = 0;
                    if (boil && visible) {
                      bx = (rnd(boilIdx * 13 + i * 101) - 0.5) * 0.008 * M;
                      by = (rnd(boilIdx * 29 + i * 211) - 0.5) * 0.008 * M;
                      br = (rnd(boilIdx * 47 + i * 331) - 0.5) * 1.6;
                    }

                    gsap.set(el, {
                      x: xC - sw / 2 + bx,
                      y: yB - sh + by,
                      rotation: rot + br,
                      scaleX: sxq,
                      scaleY: syq,
                      opacity: visible ? 1 : 0,
                    });

                    // Contact shadow: grows and darkens as the shape nears
                    // the floor, pinned to the landing spot.
                    var height = clamp01((groundY - yB) / (0.45 * H));
                    var shadowScale = lerp(1.05, 0.55, height);
                    gsap.set(shadows[i], {
                      x: xC - 0.06 * M,
                      y: groundY - 0.01 * M,
                      scaleX: shadowScale * (landed ? sxq : 1),
                      scaleY: shadowScale * 0.9,
                      opacity: visible ? lerp(0.85, 0.25, height) : 0,
                    });

                    // Sparkle: alive for EXACTLY life steps from the hit,
                    // frame-alternating big / small rotated 45deg.
                    var d = step - th.landStep;
                    var sp = sparkles[i];
                    if (d >= 0 && d < th.life) {
                      var side = i % 2 === 0 ? -1 : 1;
                      gsap.set(sp, {
                        x: xC + side * (sw * 0.62) - 0.0275 * M,
                        y: groundY - sh * 0.9,
                        scale: d % 2 === 0 ? 1 : 0.62,
                        rotation: d % 2 === 0 ? 0 : 45,
                        opacity: 1,
                      });
                    } else {
                      gsap.set(sp, { opacity: 0 });
                    }
                  }
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    applyTime(tl.time());
                  },
                });

                // Anchor tween: inert, spans [0, D] so onUpdate fires for
                // every eventful seek and holds never clamp short.
                tl.to({ p: 0 }, { p: 1, duration: duration, ease: "none" }, 0);

                // OUT: optional departure; exit none holds until the cut.
                if (exit === "up") {
                  tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                applyTime(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "fps", "type": "enum", "role": "timing", "label": "Cadence", "description": "Stepped-time cadence in frames per second.", "default": "10", "options": [&#123; "value": "8", "label": "8 fps" &#125;, &#123; "value": "10", "label": "10 fps" &#125;, &#123; "value": "12", "label": "12 fps" &#125;] &#125;,
        &#123; "id": "boil", "type": "enum", "role": "style", "label": "Boil", "description": "2-frame edge jitter, seeded per step. Off holds dead still.", "default": "on", "options": [&#123; "value": "on", "label": "On" &#125;, &#123; "value": "off", "label": "Off" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Lead shape color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the settled collage holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="stop-motion-cadence" data-duration="4" data-fps="30">
            
    
            <div
              id="stop-motion-cadence-clip"
              class="smc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="smc-stage">
                <div class="smc-floor"></div>
                <div class="smc-shadow" data-for="0"></div>
                <div class="smc-shadow" data-for="1"></div>
                <div class="smc-shadow" data-for="2"></div>
                <div class="smc-shadow" data-for="3"></div>
                <div class="smc-shape smc-circle"></div>
                <div class="smc-shape smc-square"></div>
                <div class="smc-shape smc-tri"></div>
                <div class="smc-shape smc-star"></div>
                <div class="smc-sparkle"></div>
                <div class="smc-sparkle"></div>
                <div class="smc-sparkle"></div>
                <div class="smc-sparkle"></div>
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
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    pointer-events: none;
  }

  .smc-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .smc-stage {
    position: absolute;
    inset: 0;
  }

  /* Paper-cut floor: a hairline plus a soft paper band. */
  .smc-floor {
    position: absolute;
    left: 14cqw;
    right: 14cqw;
    top: 72cqh;
    height: 0.35cqmin;
    border-radius: 0.2cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 22%, transparent);
  }

  .smc-shape {
    position: absolute;
    left: 0;
    top: 0;
    opacity: 0;
    filter: drop-shadow(
      0.5cqmin 0.7cqmin 0 color-mix(in srgb, var(--bg, #000000) 35%, transparent)
    );
  }

  .smc-shadow {
    position: absolute;
    left: 0;
    top: 0;
    width: 12cqmin;
    height: 2cqmin;
    border-radius: 50%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 14%, transparent);
    opacity: 0;
  }

  .smc-circle {
    width: 13cqmin;
    height: 13cqmin;
    border-radius: 50%;
    background: var(--smc-c1);
  }

  .smc-square {
    width: 15cqmin;
    height: 15cqmin;
    border-radius: 1.6cqmin;
    background: var(--smc-c2);
  }

  .smc-tri {
    width: 16cqmin;
    height: 14cqmin;
    clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
    background: var(--smc-c3);
  }

  .smc-star {
    width: 9cqmin;
    height: 9cqmin;
    clip-path: polygon(
      50% 0%,
      63% 34%,
      98% 35%,
      70% 57%,
      81% 91%,
      50% 70%,
      19% 91%,
      30% 57%,
      2% 35%,
      37% 34%
    );
    background: color-mix(in srgb, var(--fg, #f8fafc) 82%, var(--smc-c1));
  }

  .smc-sparkle {
    position: absolute;
    left: 0;
    top: 0;
    width: 5.5cqmin;
    height: 5.5cqmin;
    clip-path: polygon(
      50% 0%,
      60% 40%,
      100% 50%,
      60% 60%,
      50% 100%,
      40% 60%,
      0% 50%,
      40% 40%
    );
    background: var(--fg, #f8fafc);
    opacity: 0;
  }
}
</style>
