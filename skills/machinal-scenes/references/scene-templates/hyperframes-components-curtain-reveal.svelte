<!-- Modified Svelte adaptation of registry/components/curtain-reveal/curtain-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = document.getElementById("cvr-stage");
                var spotlight = document.getElementById("cvr-spotlight");
                var curtainLeft = document.getElementById("cvr-curtain-left");
                var curtainRight = document.getElementById("cvr-curtain-right");
                var pelmet = document.getElementById("cvr-pelmet");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // fold: [dark, mid, light, sheen]
                var toneTable = {
                  red: { fold: ["#3d0810", "#8a1a26", "#b23345", "#cc5c6e"], pelmet: "#4a0e1a" },
                  burgundy: { fold: ["#2b0912", "#5c1a2c", "#7d2c42", "#a04c62"], pelmet: "#3a0f1e" },
                  navy: { fold: ["#070d1f", "#152a5c", "#274a8f", "#4f72b4"], pelmet: "#0c1836" },
                  forest: { fold: ["#0c1f13", "#1f4a2b", "#356b3f", "#5c9166"], pelmet: "#12291a" },
                };
                var tone = Object.prototype.hasOwnProperty.call(toneTable, vars.tone)
                  ? vars.tone
                  : "burgundy";
                var palette = toneTable[tone];
                root.style.setProperty("--cvr-fold-dark", palette.fold[0]);
                root.style.setProperty("--cvr-fold-mid", palette.fold[1]);
                root.style.setProperty("--cvr-fold-light", palette.fold[2]);
                root.style.setProperty("--cvr-fold-sheen", palette.fold[3]);
                root.style.setProperty("--cvr-pelmet-color", palette.pelmet);

                var pelmetOn = vars.pelmet !== "off";
                var spotlightOn = vars.spotlight !== "off";
                pelmet.style.display = pelmetOn ? "" : "none";

                // Slot. Caller templates live at the host document level (the
                // mount wipes host-clip children, and templates never render).
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector('template[data-slot="curtain-reveal-stage"]');
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  var defaultMark = stage.querySelector(".cvr-stage-default");
                  if (defaultMark) defaultMark.remove();
                  stage.appendChild(hostDoc.importNode(slotTemplate.content, true));
                }

                // Closed-form scalloped hem: a fixed point count sampled from a
                // sine wave, never randomised, so the trim is identical on every
                // render of every instance.
                function hemPolygon(scallops, ampPct, baseY) {
                  var STEPS = 24;
                  var pts = ["0% 0%", "100% 0%"];
                  for (var i = 0; i <= STEPS; i += 1) {
                    var t = i / STEPS;
                    var y = baseY + Math.sin(t * Math.PI * scallops) * ampPct;
                    pts.push((100 - t * 100).toFixed(2) + "% " + y.toFixed(2) + "%");
                  }
                  return "polygon(" + pts.join(", ") + ")";
                }

                root.style.setProperty("--cvr-pelmet-hem", hemPolygon(5, 14, 78));

                // Fold widths in px at 1920 wide, outer edge first. Both sum to
                // 1075 px: from 5cqw off frame to just past center.
                var PX = 100 / 1920;
                function buildCurtain(el, dir, widths) {
                  var total = 0;
                  var folds = widths.map(function (w, i) {
                    var fold = document.createElement("div");
                    fold.className = "cvr-fold";
                    // Slight overlap hides seams between neighbouring folds.
                    fold.style.width = w * PX + 0.2 + "cqw";
                    fold.style.setProperty("--crest", 44 + ((i * 5) % 13) + "%");
                    el.appendChild(fold);
                    total += w;
                    return { el: fold, w: w * PX, u: i / (widths.length - 1) };
                  });
                  return { folds: folds, dir: dir, anchor: 51 - total * PX };
                }
                var curtains = [
                  buildCurtain(curtainLeft, 1, [88, 124, 70, 106, 136, 80, 112, 62, 98, 130, 69]),
                  buildCurtain(curtainRight, -1, [104, 66, 128, 84, 120, 62, 100, 134, 76, 112, 89]),
                ];

                // p = eased draw progress. Folds nearer the outer edge compress
                // harder, and the hem sweeps up toward the lead edge.
                function poseCurtains(p) {
                  curtains.forEach(function (c) {
                    var x = c.anchor;
                    c.folds.forEach(function (f) {
                      var sx = 1 - p * (0.86 - 0.16 * f.u);
                      var sy = 1 - p * 0.07 * f.u * f.u;
                      f.el.style.transform =
                        "translateX(" +
                        (c.dir * x).toFixed(3) +
                        "cqw) scale(" +
                        sx.toFixed(4) +
                        ", " +
                        sy.toFixed(4) +
                        ")";
                      f.el.style.setProperty("--shade", (0.34 * (1 - sx)).toFixed(3));
                      x += f.w * sx;
                    });
                  });
                }

                // Envelope: fixed IN, elastic HOLD, never time-scaled.
                var IN_BASE = 1.1;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2.4"));
                var IN = Math.min(IN_BASE, duration);

                gsap.set(spotlight, { opacity: 0 });

                // Seek-safe driver: GSAP assigns `p` on every render, seek()
                // included, so the setter re-poses the folds; onUpdate is
                // suppressed on seek.
                var drawn = 0;
                var draw = {};
                Object.defineProperty(draw, "p", {
                  get: function () {
                    return drawn;
                  },
                  set: function (next) {
                    drawn = next;
                    poseCurtains(next);
                  },
                });
                poseCurtains(0);

                var tl = gsap.timeline({ paused: true });
                tl.fromTo(draw, { p: 0 }, { p: 1, duration: IN, ease: "power2.inOut" }, 0);
                if (spotlightOn) {
                  // Clamped to end by IN: uncapped, start (IN * 0.25) + duration
                  // (IN * 0.85) lands at IN * 1.10 -- fine while the hold covers
                  // it, but a short composition that compresses the hold away
                  // would push GSAP's auto-extended timeline past data-duration.
                  var spotlightStart = IN * 0.25;
                  var spotlightDuration = Math.min(IN * 0.85, IN - spotlightStart);
                  tl.fromTo(
                    spotlight,
                    { opacity: 0 },
                    { opacity: 0.9, duration: spotlightDuration, ease: "power1.out" },
                    spotlightStart,
                  );
                }
                tl.set({}, {}, duration);
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Curtain tone", "description": "Curtain color.", "default": "burgundy", "options": [&#123; "value": "red", "label": "Red" &#125;, &#123; "value": "burgundy", "label": "Burgundy" &#125;, &#123; "value": "navy", "label": "Navy" &#125;, &#123; "value": "forest", "label": "Forest" &#125;] &#125;,
        &#123; "id": "pelmet", "type": "enum", "role": "style", "label": "Pelmet", "description": "Static valance framing the top of the stage.", "default": "on", "options": [&#123; "value": "on", "label": "On" &#125;, &#123; "value": "off", "label": "Off" &#125;] &#125;,
        &#123; "id": "spotlight", "type": "enum", "role": "style", "label": "Spotlight", "description": "Soft glow blooming over the stage as the curtains part.", "default": "on", "options": [&#123; "value": "on", "label": "On" &#125;, &#123; "value": "off", "label": "Off" &#125;] &#125;
      ]' data-composition-duration="2.4" data-composition-id="curtain-reveal" data-duration="2.4" data-fps="30">
            
    
            <div
              id="curtain-reveal-clip"
              class="cvr-clip clip"
              data-start="0"
              data-duration="2.4"
              data-track-index="0"
            >
              <div class="cvr-stage" id="cvr-stage">
                <div class="cvr-stage-default">
                  <span class="cvr-stage-default-mark" aria-hidden="true">Stage</span>
                </div>
              </div>
              <div class="cvr-spotlight" id="cvr-spotlight"></div>
    
              <div class="cvr-curtain" id="cvr-curtain-left"></div>
              <div class="cvr-curtain cvr-curtain-right" id="cvr-curtain-right"></div>
    
              <div class="cvr-pelmet" id="cvr-pelmet"></div>
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
    color: var(--fg, #1d1b16);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    background: #060607;
  }

  .cvr-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .cvr-stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .cvr-stage > img, .cvr-stage > video {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cvr-stage-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: radial-gradient(60% 60% at 50% 42%, #2a2a2e 0%, #0c0c0d 78%);
  }

  .cvr-stage-default-mark {
    font-size: 4.5cqmin;
    font-weight: 700;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: #fff;
    opacity: 0.4;
  }

  .cvr-spotlight {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      34% 52% at 50% 44%,
      rgba(255, 196, 128, 0.42) 0%,
      rgba(255, 196, 128, 0) 72%
    );
    mix-blend-mode: screen;
    opacity: 0;
    pointer-events: none;
  }

  .cvr-curtain {
    position: absolute;
    inset: 0;
  }

  .cvr-fold {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    transform-origin: 0 0;
    border-radius: 0 0 50% 50% / 0 0 1.6cqh 1.6cqh;
    background:
      linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.45) 0%,
        rgba(0, 0, 0, 0) 16%,
        rgba(0, 0, 0, 0) 82%,
        rgba(0, 0, 0, 0.5) 100%
      ),
      linear-gradient(
        90deg,
        var(--cvr-fold-dark) 0%,
        var(--cvr-fold-mid) 20%,
        var(--cvr-fold-light) calc(var(--crest) - 14%),
        var(--cvr-fold-sheen) var(--crest),
        var(--cvr-fold-light) calc(var(--crest) + 10%),
        var(--cvr-fold-mid) 80%,
        var(--cvr-fold-dark) 100%
      );
  }
  .cvr-fold::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: #000;
    opacity: var(--shade, 0);
  }
  .cvr-fold:last-child {
    box-shadow: 1.2cqw 0 2.4cqw rgba(0, 0, 0, 0.55);
  }
  /* The right curtain lays out from the right edge. */
  .cvr-curtain-right .cvr-fold {
    left: auto;
    right: 0;
    transform-origin: 100% 0;
  }
  .cvr-curtain-right .cvr-fold:last-child {
    box-shadow: -1.2cqw 0 2.4cqw rgba(0, 0, 0, 0.55);
  }

  .cvr-pelmet {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 11%;
    background: var(--cvr-pelmet-color, #4a0e1f);
    box-shadow: 0 0.6cqmin 1.4cqmin rgba(0, 0, 0, 0.55);
    clip-path: var(--cvr-pelmet-hem);
  }
}
</style>
