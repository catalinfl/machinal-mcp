<!-- Modified Svelte adaptation of registry/components/echo-trail/echo-trail.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".et-stage");
                var lead = root.querySelector(".et-lead");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var echoesRaw = parseFloat(vars.echoes);
                var echoes = isFinite(echoesRaw) ? Math.min(6, Math.max(2, Math.round(echoesRaw))) : 4;
                var deltaRaw = parseFloat(vars.delta);
                var deltaVar = isFinite(deltaRaw) ? Math.min(0.3, Math.max(0.03, deltaRaw)) : 0.09;
                var pathName = vars.path === "rise" || vars.path === "arc" ? vars.path : "sweep";
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #52525b)",
                  blue: "var(--accent, #52525b)",
                  violet: "var(--accent-2, #52525b)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--et-accent", accentColors[accent]);

                // SLOT. Caller templates live at HOST DOCUMENT level (the mount
                // wipes host-clip children, and templates never render).
                var hostDoc = root.ownerDocument;
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector('template[data-slot="echo-trail-subject"]');
                } catch (error) {
                  slotTemplate = null;
                }
                if (slotTemplate) {
                  lead.querySelector(".et-card").remove();
                  lead.appendChild(hostDoc.importNode(slotTemplate.content, true));
                }

                // Ghosts: deep clones of the subject, inserted BEFORE the lead
                // so the lead always renders on top. ghosts[0] is the nearest
                // past copy (highest stepped opacity).
                var ghosts = [];
                for (var g = 0; g < echoes; g += 1) {
                  var ghost = hostDoc.createElement("div");
                  ghost.className = "et-ghost";
                  ghost.setAttribute("aria-hidden", "true");
                  for (var c = 0; c < lead.children.length; c += 1) {
                    ghost.appendChild(lead.children[c].cloneNode(true));
                  }
                  stage.insertBefore(ghost, lead);
                  ghosts.push(ghost);
                }

                // Envelope: fixed IN/OUT, elastic HOLD, never time-scaled.
                var TRAVEL_BASE = 2.1;
                var IN_BASE = TRAVEL_BASE + echoes * deltaVar + 0.2;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var totalBase = Math.max(0.001, IN_BASE + OUT_BASE);
                var scale = duration < totalBase ? duration / totalBase : 1;
                var TRAVEL = TRAVEL_BASE * scale;
                var delta = deltaVar * scale;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                // Path presets in percent-of-stage coordinates; the subject is
                // centered on the point via a one-time -50%/-50% translate.
                function pathPoint(u) {
                  if (pathName === "rise") {
                    return { x: 50 + 6 * Math.sin(Math.PI * u), y: 76 - 44 * u };
                  }
                  if (pathName === "arc") {
                    return { x: 16 + 68 * u, y: 64 - 34 * Math.sin(Math.PI * u) };
                  }
                  // sweep: a shallow S from left to right through center.
                  return { x: 18 + 64 * u, y: 50 + 10 * Math.cos(Math.PI * u) };
                }

                function easeInOut(t) {
                  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t);
                }
                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }

                function posAt(timeSeconds) {
                  var u = easeInOut(clamp01(TRAVEL > 0 ? timeSeconds / TRAVEL : 1));
                  return pathPoint(u);
                }

                // One-time static transforms: center anchor plus a slight
                // per-ghost scale step for depth. GSAP owns the transform, the
                // per-update writes touch only left/top/opacity.
                gsap.set(lead, { xPercent: -50, yPercent: -50 });
                for (var i = 0; i < ghosts.length; i += 1) {
                  gsap.set(ghosts[i], {
                    xPercent: -50,
                    yPercent: -50,
                    scale: 1 - 0.015 * (i + 1),
                  });
                }

                // Stepped ghost bases: nearest past copy strongest.
                var bases = [];
                for (var b = 0; b < echoes; b += 1) {
                  bases.push(0.55 * (1 - b / echoes));
                }

                // Pure per-update apply: every position and every ghost alpha
                // is a function of tl.time() alone. Ghost alpha is its stepped
                // base times a separation ramp, so echoes are invisible before
                // motion starts and collapse to exactly zero at rest. Writes
                // are idempotent, so the HOLD repaints identically.
                function applyTime(timeSeconds) {
                  var leadPos = posAt(timeSeconds);
                  gsap.set(lead, {
                    left: leadPos.x.toFixed(4) + "%",
                    top: leadPos.y.toFixed(4) + "%",
                  });
                  for (var n = 0; n < ghosts.length; n += 1) {
                    var p = posAt(timeSeconds - (n + 1) * delta);
                    var dist = Math.hypot(p.x - leadPos.x, p.y - leadPos.y);
                    var alpha = bases[n] * clamp01(dist / 2.2);
                    gsap.set(ghosts[n], {
                      left: p.x.toFixed(4) + "%",
                      top: p.y.toFixed(4) + "%",
                      opacity: alpha < 0.002 ? 0 : alpha,
                    });
                  }
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    applyTime(tl.time());
                  },
                });

                // Anchor tween: an inert plain-object tween spanning the full
                // authored duration so the timeline covers [0, D], onUpdate
                // fires for every eventful seek, and holds never clamp short.
                tl.to({ p: 0 }, { p: 1, duration: duration, ease: "none" }, 0);

                // Lead entrance: both endpoints authored. Ghosts need no
                // entrance; the separation ramp keeps them at zero until the
                // traversal opens a gap.
                tl.fromTo(
                  lead,
                  { opacity: 0 },
                  { opacity: 1, duration: 0.22 * scale, ease: "power2.out" },
                  0,
                );

                // HOLD: truly still. The lead rests at path(1) and every ghost
                // is coincident at opacity exactly zero.

                // OUT: optional departure; exit none holds until the frame cuts.
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
        &#123; "id": "echoes", "type": "number", "role": "style", "label": "Echoes", "description": "Ghost copy count, clamped 2 to 6.", "default": 4 &#125;,
        &#123; "id": "delta", "type": "number", "role": "timing", "label": "Delta", "description": "Lag between successive ghosts in seconds, clamped 0.03 to 0.3.", "default": 0.09 &#125;,
        &#123; "id": "path", "type": "enum", "role": "timing", "label": "Path", "description": "Authored traversal preset.", "default": "sweep", "options": [&#123; "value": "sweep", "label": "Sweep" &#125;, &#123; "value": "rise", "label": "Rise" &#125;, &#123; "value": "arc", "label": "Arc" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Subject accent color: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the settled element holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="echo-trail" data-duration="3.5" data-fps="30">
            
    
            <div
              id="echo-trail-clip"
              class="et-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="et-stage">
                <div class="et-lead">
                  <div class="et-card">
                    <div class="et-card-dot"></div>
                    <div class="et-card-line"></div>
                    <div class="et-card-line short"></div>
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

  .et-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .et-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .et-ghost, .et-lead {
    position: absolute;
    left: 0;
    top: 0;
    will-change: opacity;
  }

  .et-ghost {
    opacity: 0;
  }

  .et-lead {
    opacity: 0;
  }

  .et-card {
    width: 30cqmin;
    padding: var(--space-3, 3cqmin);
    display: grid;
    gap: var(--space-2, 2cqmin);
    border: 0.18cqmin solid var(--border, #475569);
    border-radius: var(--radius, 2.4cqmin);
    background: var(--surface, #14171c);
    box-shadow: 0 1.6cqmin 5cqmin color-mix(in srgb, var(--bg, #000000) 30%, transparent);
  }

  .et-card-dot {
    width: 3.2cqmin;
    height: 3.2cqmin;
    border-radius: 50%;
    background: var(--et-accent);
  }

  .et-card-line {
    height: 1.6cqmin;
    border-radius: 0.8cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 16%, transparent);
  }

  .et-card-line.short {
    width: 62%;
  }
}
</style>
