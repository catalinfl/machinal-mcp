<!-- Modified Svelte adaptation of registry/components/modal-morph/modal-morph.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".mm-stage");
                var card = root.querySelector(".mm-card");
                var panel = root.querySelector(".mm-panel");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var fromScaleRaw = parseFloat(vars.from_scale);
                var fromScale = isFinite(fromScaleRaw) ? Math.min(1.5, Math.max(0.5, fromScaleRaw)) : 1;
                var expandRaw = parseFloat(vars.expand_at);
                var expandVar = isFinite(expandRaw) ? Math.max(0.2, expandRaw) : 1.2;
                var register = vars.register === "snappy" ? "snappy" : "calm";
                var accentColors = {
                  green: "var(--brand, #52525b)",
                  blue: "var(--accent, #52525b)",
                  violet: "var(--accent-2, #52525b)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--mm-accent", accentColors[accent]);
                root.style.setProperty("--mm-from-scale", String(fromScale));

                // SLOT: same content cloned into BOTH layouts so measured
                // pairs exist for every key. Keyless slot content is wrapped
                // as one keyed block.
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector('template[data-slot="modal-morph-card"]');
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  var hosts = root.querySelectorAll(".mm-slot-host");
                  for (var h = 0; h < hosts.length; h += 1) {
                    var content = hostDoc.importNode(slotTemplate.content, true);
                    var probe = hostDoc.createElement("div");
                    probe.appendChild(content);
                    if (!probe.querySelector("[data-morph-key]")) {
                      probe.setAttribute("data-morph-key", "slot");
                    }
                    hosts[h].textContent = "";
                    hosts[h].appendChild(probe);
                  }
                }

                // ONE-TIME measurement of both real layouts (the FLIP "first"
                // and "last"). Everything after this line is pure f(t).
                var stageRect = stage.getBoundingClientRect();
                function measure(el) {
                  var r = el.getBoundingClientRect();
                  return {
                    x: r.left - stageRect.left,
                    y: r.top - stageRect.top,
                    w: Math.max(1, r.width),
                    h: Math.max(1, r.height),
                  };
                }
                var cardRect = measure(card);
                var panelRect = measure(panel);

                function collectKids(container) {
                  var map = {};
                  var nodes = container.querySelectorAll("[data-morph-key]");
                  for (var i = 0; i < nodes.length; i += 1) {
                    map[nodes[i].getAttribute("data-morph-key")] = {
                      el: nodes[i],
                      rect: measure(nodes[i]),
                    };
                  }
                  return map;
                }
                var cardKids = collectKids(card);
                var panelKids = collectKids(panel);

                // Matched pairs: for each layer we keep, per child, its OWN
                // layout rect (home) plus the counterpart rect (away).
                function pairs(ownKids, otherKids) {
                  var list = [];
                  for (var key in ownKids) {
                    if (Object.prototype.hasOwnProperty.call(otherKids, key)) {
                      list.push({
                        el: ownKids[key].el,
                        home: ownKids[key].rect,
                        away: otherKids[key].rect,
                      });
                    }
                  }
                  return list;
                }
                var panelPairs = pairs(panelKids, cardKids);
                var cardPairs = pairs(cardKids, panelKids);
                var fades = panel.querySelectorAll(".mm-body, .mm-foot");

                // Fixed origins so the rect math is exact.
                gsap.set([card, panel], { transformOrigin: "0 0" });
                for (var pp = 0; pp < panelPairs.length; pp += 1) {
                  gsap.set(panelPairs[pp].el, { transformOrigin: "0 0" });
                }
                for (var cp = 0; cp < cardPairs.length; cp += 1) {
                  gsap.set(cardPairs[cp].el, { transformOrigin: "0 0" });
                }

                // Envelope: fixed IN/OUT, elastic HOLD, never time-scaled.
                var MORPH_BASE = register === "snappy" ? 0.6 : 0.95;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var EXPAND_BASE = Math.min(expandVar, Math.max(0.2, duration - 0.6));
                var IN_BASE = EXPAND_BASE + MORPH_BASE + 0.15;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var EXPAND = EXPAND_BASE * scale;
                var MORPH = MORPH_BASE * scale;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;
                var ENTER = 0.3 * scale;

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }
                // calm: cubic inOut, no overshoot.
                function calmEase(u) {
                  return u < 0.5 ? 4 * u * u * u : 1 - 4 * (1 - u) * (1 - u) * (1 - u);
                }
                // snappy: back.out with c1 = 0.7; analytic max 1.0176, under
                // the 1.02 cap (and interpolating the rect keeps the scale
                // overshoot strictly below 2% of target).
                function snappyEase(u) {
                  var c1 = 0.7;
                  var c3 = c1 + 1;
                  var v = u - 1;
                  return 1 + c3 * v * v * v + c1 * v * v;
                }
                var ease = register === "snappy" ? snappyEase : calmEase;

                function lerp(a, b, p) {
                  return a + (b - a) * p;
                }
                function lerpRect(a, b, p) {
                  return {
                    x: lerp(a.x, b.x, p),
                    y: lerp(a.y, b.y, p),
                    w: lerp(a.w, b.w, p),
                    h: lerp(a.h, b.h, p),
                  };
                }

                // Apply one layer: container transformed onto rect R; each
                // matched child counter-scaled and translated onto the lerp of
                // its own two measured rects. Child x/y live in the scaled
                // container space, hence the divisions.
                function applyLayer(container, homeRect, kidPairs, R, p) {
                  var sx = R.w / homeRect.w;
                  var sy = R.h / homeRect.h;
                  gsap.set(container, {
                    x: R.x - homeRect.x,
                    y: R.y - homeRect.y,
                    scaleX: sx,
                    scaleY: sy,
                  });
                  for (var i = 0; i < kidPairs.length; i += 1) {
                    var pair = kidPairs[i];
                    var relHome = {
                      x: pair.home.x - homeRect.x,
                      y: pair.home.y - homeRect.y,
                    };
                    var want = lerpRect(pair.away, pair.home, container === panel ? p : 1 - p);
                    var baseX = R.x + relHome.x * sx;
                    var baseY = R.y + relHome.y * sy;
                    gsap.set(pair.el, {
                      x: (want.x - baseX) / sx,
                      y: (want.y - baseY) / sy,
                      scaleX: want.w / (pair.home.w * sx),
                      scaleY: want.h / (pair.home.h * sy),
                    });
                  }
                }

                // Pure per-update apply: every transform and opacity is a
                // function of tl.time() alone. Writes are idempotent.
                function applyTime(timeSeconds) {
                  var enter = clamp01(ENTER > 0 ? timeSeconds / ENTER : 1);
                  var u = clamp01(MORPH > 0 ? (timeSeconds - EXPAND) / MORPH : 1);
                  var p = ease(u);
                  var R = lerpRect(cardRect, panelRect, p);

                  applyLayer(panel, panelRect, panelPairs, R, p);
                  applyLayer(card, cardRect, cardPairs, R, p);

                  // Crossfade: card owns the pre-phase, hands off in the
                  // first 30% of the morph.
                  var hand = clamp01(u / 0.3);
                  gsap.set(card, { opacity: enter * (1 - hand) });
                  gsap.set(panel, { opacity: u <= 0 ? 0 : Math.max(0.001, hand) });

                  // Panel-only furniture: fades up over the back half.
                  var q = clamp01((u - 0.55) / 0.45);
                  var qe = 1 - (1 - q) * (1 - q);
                  for (var f = 0; f < fades.length; f += 1) {
                    gsap.set(fades[f], { opacity: qe, y: (1 - qe) * 12 });
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
        &#123; "id": "from_scale", "type": "number", "role": "style", "label": "From scale", "description": "Multiplies the authored card footprint, clamped 0.5 to 1.5.", "default": 1 &#125;,
        &#123; "id": "expand_at", "type": "number", "role": "timing", "label": "Expand at", "description": "Seconds after mount when the card grows into the panel.", "default": 1.2 &#125;,
        &#123; "id": "register", "type": "enum", "role": "timing", "label": "Register", "description": "Morph feel. Snappy is faster with a settle capped at 1.02 of the target rect.", "default": "calm", "options": [&#123; "value": "calm", "label": "Calm" &#125;, &#123; "value": "snappy", "label": "Snappy" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the settled panel holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="modal-morph" data-duration="4" data-fps="30">
            
    
            <div
              id="modal-morph-clip"
              class="mm-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="mm-stage">
                <div class="mm-cardbox">
                  <div class="mm-card">
                    <div class="mm-slot-host">
                      <div class="mm-dot" data-morph-key="dot"></div>
                      <div class="mm-title" data-morph-key="title"></div>
                      <div class="mm-meta" data-morph-key="meta"></div>
                    </div>
                  </div>
                </div>
                <div class="mm-panel">
                  <div class="mm-panel-head mm-slot-host">
                    <div class="mm-dot" data-morph-key="dot"></div>
                    <div class="mm-title" data-morph-key="title"></div>
                    <div class="mm-meta" data-morph-key="meta"></div>
                  </div>
                  <div class="mm-body">
                    <div class="mm-tile">
                      <div class="mm-tile-line"></div>
                      <div class="mm-tile-line short"></div>
                    </div>
                    <div class="mm-tile">
                      <div class="mm-tile-line"></div>
                      <div class="mm-tile-line short"></div>
                    </div>
                    <div class="mm-tile">
                      <div class="mm-tile-line"></div>
                      <div class="mm-tile-line short"></div>
                    </div>
                  </div>
                  <div class="mm-foot">
                    <div class="mm-chip lead">OPEN</div>
                    <div class="mm-chip">DETAILS</div>
                  </div>
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
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    pointer-events: none;
  }

  .mm-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .mm-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  /* Card layout: the small shared element, centered. */
  .mm-cardbox {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
  }

  .mm-card {
    width: calc(36cqmin * var(--mm-from-scale, 1));
    padding: var(--space-3, 3cqmin);
    display: grid;
    gap: var(--space-2, 2cqmin);
    border: 0.18cqmin solid var(--border, #475569);
    border-radius: var(--radius, 2.4cqmin);
    background: var(--surface, #14171c);
    box-shadow: 0 1.4cqmin 4.5cqmin color-mix(in srgb, var(--bg, #000000) 32%, transparent);
  }

  /* Panel layout: the destination surface. */
  .mm-panel {
    position: absolute;
    left: 14cqw;
    right: 14cqw;
    top: 13cqh;
    bottom: 13cqh;
    padding: var(--space-3, 3cqmin);
    display: grid;
    grid-template-rows: auto 1fr auto;
    gap: var(--space-3, 3cqmin);
    border: 0.18cqmin solid var(--border, #475569);
    border-radius: var(--radius, 2.4cqmin);
    background: var(--surface, #14171c);
    box-shadow: 0 2.2cqmin 7cqmin color-mix(in srgb, var(--bg, #000000) 36%, transparent);
  }

  .mm-panel-head {
    display: flex;
    align-items: center;
    gap: var(--space-2, 2cqmin);
  }

  .mm-dot {
    width: 3.4cqmin;
    height: 3.4cqmin;
    flex: none;
    border-radius: 50%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 72%, transparent);
  }

  .mm-title {
    height: 2.4cqmin;
    width: 24cqmin;
    border-radius: 1.2cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 30%, transparent);
  }

  .mm-meta {
    height: 1.5cqmin;
    width: 15cqmin;
    border-radius: 0.75cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 14%, transparent);
  }

  .mm-card .mm-title {
    width: 76%;
  }

  .mm-card .mm-meta {
    width: 52%;
  }

  /* Panel-only furniture: fades in late in the morph. */
  /* No will-change on morphing layers: cached composited rasters
  from a scaled state leak pixel noise into out-of-order seeks. */
  .mm-body {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-2, 2cqmin);
    align-content: stretch;
  }

  .mm-tile {
    border: 0.16cqmin solid var(--border, #475569);
    border-radius: calc(var(--radius, 2.4cqmin) * 0.7);
    background: color-mix(in srgb, var(--fg, #f8fafc) 5%, transparent);
    display: grid;
    align-content: end;
    gap: 1.2cqmin;
    padding: var(--space-2, 2cqmin);
  }

  .mm-tile-line {
    height: 1.3cqmin;
    border-radius: 0.65cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 16%, transparent);
  }

  .mm-tile-line.short {
    width: 58%;
  }

  .mm-foot {
    display: flex;
    gap: var(--space-2, 2cqmin);
  }

  .mm-chip {
    height: 3.4cqmin;
    border-radius: 1.7cqmin;
    padding: 0 2.4cqmin;
    display: grid;
    align-items: center;
    border: 0.16cqmin solid var(--border, #475569);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, monospace);
    font-size: 1.5cqmin;
    font-weight: 500;
    letter-spacing: 0.08em;
    color: var(--muted, #94a3b8);
  }

  .mm-chip.lead {
    border-color: color-mix(in srgb, var(--mm-accent) 55%, transparent);
    color: var(--mm-accent);
  }
}
</style>
