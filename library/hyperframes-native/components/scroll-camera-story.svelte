<!-- Modified Svelte adaptation of registry/components/scroll-camera-story/scroll-camera-story.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var stage = root.querySelector(".scs-stage");
                var world = root.querySelector(".scs-world");
                var layerFar = root.querySelector(".scs-far");
                var layerMid = root.querySelector(".scs-mid");
                var layerFore = root.querySelector(".scs-fore");
                var sectionElements = Array.prototype.slice.call(root.querySelectorAll(".scs-section"));
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function num(value, fallback, min, max) {
                  var parsed = parseFloat(value);
                  if (!isFinite(parsed)) parsed = fallback;
                  return Math.min(max, Math.max(min, parsed));
                }

                var travel = num(vars.travel, 220, 100, 400);
                var sectionsVar = Math.round(num(vars.sections, 3, 2, 4));
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exitMode = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--scs-accent", accentColors[accent]);

                // SLOT. Caller templates live at HOST DOCUMENT level (the mount
                // wipes host-clip children, and templates never render). Each
                // direct child of the slot template becomes one section's card
                // content, in order.
                var hostDoc = root.ownerDocument;
                var slotChildren = [];
                try {
                  var slotTemplate = hostDoc.querySelector(
                    'template[data-slot="scroll-camera-story-sections"]',
                  );
                  if (slotTemplate)
                    slotChildren = Array.prototype.slice.call(slotTemplate.content.children);
                } catch (error) {
                  slotChildren = [];
                }

                var count = Math.min(4, Math.max(2, slotChildren.length || sectionsVar));
                sectionElements.forEach(function (section, index) {
                  if (index >= count) {
                    section.remove();
                    return;
                  }
                  if (slotChildren[index]) {
                    var card = section.querySelector(".scs-card");
                    while (card.firstChild) card.removeChild(card.firstChild);
                    card.appendChild(hostDoc.importNode(slotChildren[index], true));
                  }
                });
                var sections = sectionElements.slice(0, count);
                var cards = sections.map(function (section) {
                  return section.querySelector(".scs-card");
                });

                // World geometry, set ONCE at mount in cqh (static style, never
                // tweened; the seek trap is cq units INSIDE tweens). Section i
                // centers at camera progress i / (count - 1) along the travel.
                world.style.height = (100 + travel).toFixed(2) + "cqh";
                sections.forEach(function (section, index) {
                  var progress = index / (count - 1);
                  section.style.top = (50 + progress * travel - 42).toFixed(2) + "cqh";
                });

                /* ===== Camera (camera-servo law): one plain state object, one
                   writer. cam.t is the pass progress 0..1. The world translates
                   by percent of its OWN height (a pure number: travel out of
                   100 + travel), and each depth layer gets a derived parallax
                   offset so its net rate is RATE x the camera rate. No cq units
                   are ever tweened. ===== */
                var F = (100 * travel) / (100 + travel); // percent of world height per full pass
                var RATE_FAR = 0.35;
                var RATE_MID = 0.65;
                var RATE_FORE = 1.12;
                var cam = { t: 0 };
                var drift = { p: 0, dx: 0, dy: 0 };
                function applyCamera() {
                  var y = -cam.t * F;
                  world.style.transform = "translate(" + drift.dx + "%, " + (y + drift.dy) + "%)";
                  layerFar.style.transform = "translateY(" + cam.t * F * (1 - RATE_FAR) + "%)";
                  layerMid.style.transform = "translateY(" + cam.t * F * (1 - RATE_MID) + "%)";
                  layerFore.style.transform = "translateY(" + cam.t * F * (1 - RATE_FORE) + "%)";
                }
                applyCamera();

                // Envelope: fixed IN/OUT, elastic HOLD, never time-scaled.
                var IN_BASE = 0.85;
                var OUT_BASE = exitMode === "none" ? 0 : 0.5;
                var PASS_MIN = 1.2;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5.5"));
                var totalBase = IN_BASE + PASS_MIN + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var usable = duration - OUT;

                // Arrival schedule: defaults decelerate into a held final
                // section; the cues variable overrides arrivals for sections
                // after the first.
                var HOLD_MIN = Math.min(1.3, Math.max(0.45, usable * 0.24));
                var lastDefault = Math.max(IN + 0.9 * scale, usable - HOLD_MIN);
                var firstDefault = Math.min(lastDefault, IN + 1.15 * scale);
                var arrivals = [];
                var index;
                for (index = 1; index < count; index += 1) {
                  arrivals.push(
                    count === 2
                      ? lastDefault
                      : firstDefault + ((index - 1) / (count - 2)) * (lastDefault - firstDefault),
                  );
                }
                var cueValues = String(vars.cues == null ? "" : vars.cues)
                  .split(",")
                  .map(function (part) {
                    return parseFloat(part);
                  })
                  .filter(function (value) {
                    return isFinite(value);
                  });
                // Lenient by one: a list with an extra leading value is treated
                // as including the mount section's arrival.
                if (cueValues.length === count) cueValues = cueValues.slice(1);
                if (cueValues.length >= count - 1) {
                  arrivals = cueValues.slice(0, count - 1);
                }
                var floor = IN + 0.35 * scale;
                for (index = 0; index < arrivals.length; index += 1) {
                  var clamped = Math.min(usable - 0.3 * scale, Math.max(floor, arrivals[index]));
                  arrivals[index] = clamped;
                  floor = clamped + 0.4 * scale;
                }
                var lastArrival = arrivals.length > 0 ? arrivals[arrivals.length - 1] : IN;

                var tl = gsap.timeline({ paused: true });

                // IN: the stage fades up while the first section rises.
                tl.fromTo(
                  stage,
                  { opacity: 0 },
                  { opacity: 1, duration: Math.min(0.6 * scale, IN), ease: "power2.out" },
                  0,
                );

                // Section rises: each card lands exactly on its arrival cue.
                // yPercent only (percent of the card's own box), never cq units.
                cards.forEach(function (card, cardIndex) {
                  var arrive = cardIndex === 0 ? IN : arrivals[cardIndex - 1];
                  var rise = Math.min(
                    0.75 * scale,
                    Math.max(0.25, arrive - (cardIndex === 0 ? 0.1 : 0)),
                  );
                  tl.fromTo(
                    card,
                    { opacity: 0, yPercent: 10 },
                    { opacity: 1, yPercent: 0, duration: rise, ease: "power3.out" },
                    arrive - rise,
                  );
                });

                // Camera pass: one non-overlapping segment per arrival, quiet
                // register (L2). Each move ends exactly on its cue; the final
                // move runs longer, so the pass decelerates into the hold. No
                // segment starts before the previous ends (L1: no mid-motion
                // redirect exists to snap velocity).
                var previousEnd = IN * 0.7;
                arrivals.forEach(function (arrive, arriveIndex) {
                  var isLast = arriveIndex === arrivals.length - 1;
                  var gap = arrive - previousEnd - 0.1 * scale;
                  var move = Math.max(0.3, Math.min(isLast ? 1.7 : 1.25, gap));
                  tl.to(
                    cam,
                    {
                      t: (arriveIndex + 1) / (count - 1),
                      duration: move,
                      ease: "power2.inOut",
                      onUpdate: applyCamera,
                    },
                    arrive - move,
                  );
                  previousEnd = arrive;
                });

                // Micro-drift: 2 and 3 INTEGER sine cycles ending at exactly
                // zero when the final section lands, so the held final section
                // is byte-still and every seek reproduces the same frame.
                if (lastArrival >= 1.2) {
                  tl.to(
                    drift,
                    {
                      p: Math.PI * 2 * 2,
                      duration: lastArrival,
                      ease: "none",
                      onUpdate: function () {
                        drift.dx = Math.sin(drift.p) * 0.06;
                        drift.dy = Math.sin(drift.p * 1.5) * 0.08;
                        applyCamera();
                      },
                    },
                    0,
                  );
                }

                // OUT: only when exit != none; the default holds the last frame.
                if (exitMode !== "none") {
                  var outStart = duration - OUT;
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, outStart);
                  if (exitMode === "up") {
                    tl.to(stage, { yPercent: -4, duration: OUT, ease: "power2.in" }, outStart);
                  }
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "sections", "type": "number", "role": "content", "label": "Sections", "description": "How many skeleton sections ride the pass. A sections slot overrides this with its own child count.", "default": 3, "min": 2, "max": 4, "step": 1 &#125;,
        &#123; "id": "travel", "type": "number", "role": "content", "label": "Travel", "description": "Total camera travel in cqh. The world is 100 + travel cqh tall.", "default": 220, "min": 100, "max": 400, "step": 10, "unit": "cqh" &#125;,
        &#123; "id": "cues", "type": "string", "role": "timing", "label": "Cues", "description": "Comma-separated seconds: arrival times for the sections after the first. Empty keeps the authored default rhythm.", "default": "" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Token the skeleton accents and foreground motes ride.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "style", "label": "Exit", "description": "Optional departure. None holds the final section.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5.5" data-composition-id="scroll-camera-story" data-duration="5.5" data-fps="30">
            
    
            <div
              id="scroll-camera-story-clip"
              class="scs-clip clip"
              data-start="0"
              data-duration="5.5"
              data-track-index="0"
            >
              <div class="scs-stage" role="img" aria-label="Cinematic scroll pass over a tall scene">
                <div class="scs-world">
                  <div class="scs-layer scs-far" aria-hidden="true">
                    <span class="scs-blob"></span>
                    <span class="scs-blob"></span>
                    <span class="scs-blob"></span>
                    <span class="scs-blob"></span>
                  </div>
                  <div class="scs-layer scs-mid" aria-hidden="true">
                    <span class="scs-ring"></span>
                    <span class="scs-ring"></span>
                    <span class="scs-ring"></span>
                    <span class="scs-rule"></span>
                    <span class="scs-rule"></span>
                    <span class="scs-plus"></span>
                    <span class="scs-plus"></span>
                    <span class="scs-plus"></span>
                  </div>
                  <div class="scs-layer scs-content">
                    <div class="scs-section" aria-hidden="true">
                      <div class="scs-card">
                        <div class="scs-chiprow">
                          <span class="scs-chip">01</span>
                          <span class="scs-chiprule"></span>
                        </div>
                        <span class="scs-bar scs-heading"></span>
                        <span class="scs-bar" style="width: 74%"></span>
                        <span class="scs-bar scs-sub"></span>
                      </div>
                    </div>
                    <div class="scs-section" aria-hidden="true">
                      <div class="scs-card">
                        <div class="scs-chiprow">
                          <span class="scs-chip">02</span>
                          <span class="scs-chiprule"></span>
                        </div>
                        <span class="scs-bar scs-heading" style="width: 46%"></span>
                        <div class="scs-minis">
                          <div class="scs-mini">
                            <span class="scs-bar"></span>
                            <span class="scs-mini-block"></span>
                          </div>
                          <div class="scs-mini">
                            <span class="scs-bar"></span>
                            <span class="scs-mini-block"></span>
                          </div>
                          <div class="scs-mini">
                            <span class="scs-bar"></span>
                            <span class="scs-mini-block"></span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="scs-section" aria-hidden="true">
                      <div class="scs-card">
                        <div class="scs-chiprow">
                          <span class="scs-chip">03</span>
                          <span class="scs-chiprule"></span>
                        </div>
                        <span class="scs-bar scs-heading" style="width: 40%"></span>
                        <div class="scs-rowline">
                          <span class="scs-dot"></span>
                          <span class="scs-bar"></span>
                        </div>
                        <div class="scs-rowline">
                          <span class="scs-dot"></span>
                          <span class="scs-bar" style="max-width: 58%"></span>
                        </div>
                        <div class="scs-rowline">
                          <span class="scs-dot"></span>
                          <span class="scs-bar" style="max-width: 66%"></span>
                        </div>
                      </div>
                    </div>
                    <div class="scs-section" data-close aria-hidden="true">
                      <div class="scs-card">
                        <div class="scs-chiprow" style="align-self: stretch">
                          <span class="scs-chip">04</span>
                          <span class="scs-chiprule"></span>
                        </div>
                        <span class="scs-bar scs-heading"></span>
                        <span class="scs-bar scs-sub"></span>
                        <span class="scs-pill">&gt;_</span>
                      </div>
                    </div>
                  </div>
                  <div class="scs-layer scs-fore" aria-hidden="true">
                    <span class="scs-mote"></span>
                    <span class="scs-mote"></span>
                    <span class="scs-mote"></span>
                    <span class="scs-mote"></span>
                    <span class="scs-mote"></span>
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
    font-family: var(--font-body, ui-sans-serif, system-ui, sans-serif);
    pointer-events: none;
  }

  .scs-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .scs-stage {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(
        ellipse 120% 70% at 50% 0%,
        color-mix(in srgb, var(--scs-accent) 6%, transparent) 0%,
        transparent 60%
      ),
      var(--bg, #0b0c0e);
    will-change: transform, opacity;
  }

  /* ONE world wrapper: the camera translate lives here; depth layers
  below carry derived parallax offsets from the same writer. */
  .scs-world {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    will-change: transform;
  }

  .scs-layer {
    position: absolute;
    inset: 0;
    will-change: transform;
  }

  /* far layer: large soft washes, slowest */
  .scs-blob {
    position: absolute;
    width: 64cqmin;
    height: 64cqmin;
    border-radius: 50%;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--scs-accent) 11%, transparent) 0%,
      color-mix(in srgb, var(--scs-accent) 5%, transparent) 45%,
      transparent 70%
    );
  }

  .scs-blob:nth-child(1) {
    top: 2%;
    left: -14cqmin;
  }

  .scs-blob:nth-child(2) {
    top: 17%;
    right: -18cqmin;
    width: 78cqmin;
    height: 78cqmin;
    background: radial-gradient(
      circle,
      color-mix(in srgb, var(--fg, #f8fafc) 6%, transparent) 0%,
      color-mix(in srgb, var(--fg, #f8fafc) 3%, transparent) 45%,
      transparent 70%
    );
  }

  .scs-blob:nth-child(3) {
    top: 34%;
    left: 6cqw;
  }

  .scs-blob:nth-child(4) {
    top: 48%;
    right: 2cqw;
    width: 56cqmin;
    height: 56cqmin;
  }

  /* mid layer: hairline geometry */
  .scs-ring {
    position: absolute;
    width: 16cqmin;
    height: 16cqmin;
    border: 0.16cqmin solid color-mix(in srgb, var(--fg, #f8fafc) 12%, transparent);
    border-radius: 50%;
  }

  .scs-rule {
    position: absolute;
    width: 12cqmin;
    height: 0.16cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 14%, transparent);
  }

  .scs-plus {
    position: absolute;
    width: 3.4cqmin;
    height: 3.4cqmin;
  }

  .scs-plus::before, .scs-plus::after {
    position: absolute;
    content: "";
    background: color-mix(in srgb, var(--fg, #f8fafc) 18%, transparent);
  }

  .scs-plus::before {
    top: 0;
    bottom: 0;
    left: calc(50% - 0.08cqmin);
    width: 0.16cqmin;
  }

  .scs-plus::after {
    top: calc(50% - 0.08cqmin);
    right: 0;
    left: 0;
    height: 0.16cqmin;
  }

  .scs-ring:nth-of-type(1) {
    top: 6%;
    right: 12cqw;
  }

  .scs-ring:nth-of-type(2) {
    top: 30%;
    left: 9cqw;
    width: 10cqmin;
    height: 10cqmin;
  }

  .scs-ring:nth-of-type(3) {
    top: 52%;
    right: 8cqw;
    width: 22cqmin;
    height: 22cqmin;
    border-color: color-mix(in srgb, var(--fg, #f8fafc) 8%, transparent);
  }

  .scs-rule:nth-of-type(1) {
    top: 14%;
    left: 12cqw;
    transform: rotate(90deg);
  }

  .scs-rule:nth-of-type(2) {
    top: 40%;
    right: 16cqw;
  }

  .scs-plus:nth-of-type(1) {
    top: 22%;
    right: 22cqw;
  }

  .scs-plus:nth-of-type(2) {
    top: 47%;
    left: 18cqw;
  }

  .scs-plus:nth-of-type(3) {
    top: 9%;
    left: 30cqw;
  }

  /* foreground layer: small accent motes, fastest */
  .scs-mote {
    position: absolute;
    width: 1cqmin;
    height: 1cqmin;
    border-radius: 50%;
    background: color-mix(in srgb, var(--scs-accent) 55%, transparent);
  }

  .scs-mote:nth-child(1) {
    top: 7%;
    left: 8cqw;
  }

  .scs-mote:nth-child(2) {
    top: 21%;
    right: 10cqw;
    width: 0.7cqmin;
    height: 0.7cqmin;
  }

  .scs-mote:nth-child(3) {
    top: 43%;
    left: 6cqw;
    width: 1.3cqmin;
    height: 1.3cqmin;
    background: color-mix(in srgb, var(--scs-accent) 40%, transparent);
  }

  .scs-mote:nth-child(4) {
    top: 66%;
    right: 7cqw;
  }

  .scs-mote:nth-child(5) {
    top: 88%;
    left: 4cqw;
    width: 0.8cqmin;
    height: 0.8cqmin;
  }

  /* sections: a static positioner zone per section, a rising card in it */
  .scs-section {
    position: absolute;
    right: 10cqw;
    left: 10cqw;
    display: grid;
    place-items: center;
    height: 84cqh;
  }

  .scs-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-2, 2.2cqmin);
    width: min(64cqw, 150cqh);
    max-height: 76cqh;
    padding: var(--space-3, 3.4cqmin);
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 70%, transparent);
    border-radius: var(--radius, 2cqmin);
    background: color-mix(in srgb, var(--surface, #0b1016) 88%, var(--bg, #05070c));
    box-shadow: 0 2.4cqh 7cqh color-mix(in srgb, var(--bg, #000000) 34%, transparent);
    will-change: transform, opacity;
  }

  .scs-chiprow {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.6cqmin);
  }

  .scs-chip {
    padding: 0.7cqmin 1.5cqmin;
    border: 0.14cqmin solid color-mix(in srgb, var(--scs-accent) 45%, transparent);
    border-radius: 999px;
    color: color-mix(in srgb, var(--scs-accent) 80%, var(--fg, #f8fafc));
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2cqmin;
    font-weight: 600;
    letter-spacing: 0.14em;
    line-height: 1;
  }

  .scs-chiprule {
    flex: 1;
    height: 0.14cqmin;
    background: color-mix(in srgb, var(--border, #475569) 60%, transparent);
  }

  .scs-bar {
    height: 1.4cqmin;
    border-radius: 999px;
    background: color-mix(in srgb, var(--fg, #f8fafc) 12%, transparent);
  }

  .scs-bar.scs-heading {
    width: 62%;
    height: 3.4cqmin;
    background: color-mix(in srgb, var(--fg, #f8fafc) 24%, transparent);
  }

  .scs-bar.scs-sub {
    width: 44%;
  }

  .scs-minis {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2cqmin;
    margin-top: 0.6cqmin;
  }

  .scs-mini {
    display: flex;
    flex-direction: column;
    gap: 1.4cqmin;
    padding: 2cqmin;
    border: 0.14cqmin solid color-mix(in srgb, var(--border, #475569) 55%, transparent);
    border-radius: calc(var(--radius, 2cqmin) * 0.7);
    background: color-mix(in srgb, var(--bg, #05070c) 32%, transparent);
  }

  .scs-mini .scs-bar {
    width: 62%;
  }

  .scs-mini-block {
    height: 7cqmin;
    border-radius: calc(var(--radius, 2cqmin) * 0.5);
    background: color-mix(in srgb, var(--fg, #f8fafc) 7%, transparent);
  }

  .scs-mini:nth-child(2) .scs-mini-block {
    background: color-mix(in srgb, var(--scs-accent) 18%, transparent);
  }

  .scs-rowline {
    display: flex;
    align-items: center;
    gap: var(--space-1, 1.6cqmin);
  }

  .scs-dot {
    flex: 0 0 auto;
    width: 1.5cqmin;
    height: 1.5cqmin;
    border-radius: 50%;
    background: color-mix(in srgb, var(--fg, #f8fafc) 22%, transparent);
  }

  .scs-rowline:nth-of-type(2) .scs-dot {
    background: color-mix(in srgb, var(--scs-accent) 70%, transparent);
  }

  .scs-rowline .scs-bar {
    flex: 1;
    max-width: 72%;
  }

  .scs-section[data-close] .scs-card {
    align-items: center;
    text-align: center;
  }

  .scs-section[data-close] .scs-bar.scs-heading {
    width: 52%;
  }

  .scs-section[data-close] .scs-bar.scs-sub {
    width: 34%;
  }

  .scs-pill {
    margin-top: 1.2cqmin;
    padding: 1.4cqmin 3.4cqmin;
    border-radius: 999px;
    background: color-mix(in srgb, var(--scs-accent) 82%, var(--surface, #0b1016));
    color: var(--bg, #0b0c0e);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2.1cqmin;
    font-weight: 600;
    letter-spacing: 0.12em;
    line-height: 1;
  }
}
</style>
