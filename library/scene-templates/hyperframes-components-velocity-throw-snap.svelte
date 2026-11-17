<!-- Modified Svelte adaptation of registry/components/velocity-throw-snap/velocity-throw-snap.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var clip = root.querySelector(".vts-clip");
                var rail = root.querySelector(".vts-rail");
                var cards = Array.from(root.querySelectorAll(".vts-card"));
                var labels = Array.from(root.querySelectorAll(".vts-label"));
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var heroValue = Number(vars.hero_index);
                var heroIndex = Number.isFinite(heroValue)
                  ? Math.max(0, Math.min(4, Math.round(heroValue)))
                  : 2;
                var prefix = vars.card_label_prefix == null ? "Shot" : String(vars.card_label_prefix);
                var accentName =
                  vars.accent === "blue" || vars.accent === "violet" ? vars.accent : "green";
                var themeStyles = getComputedStyle(root);
                var palettes = {
                  green: {
                    accent: themeStyles.getPropertyValue("--brand").trim() || "#34d399",
                    dark: themeStyles.getPropertyValue("--brand").trim() || "#08795b",
                    glow: "rgba(52, 211, 153, 0.4)",
                  },
                  blue: {
                    accent: themeStyles.getPropertyValue("--accent").trim() || "#60a5fa",
                    dark: themeStyles.getPropertyValue("--accent").trim() || "#2563a8",
                    glow: "rgba(96, 165, 250, 0.42)",
                  },
                  violet: {
                    accent: themeStyles.getPropertyValue("--accent-2").trim() || "#a78bfa",
                    dark: themeStyles.getPropertyValue("--accent-2").trim() || "#6742b8",
                    glow: "rgba(167, 139, 250, 0.42)",
                  },
                };
                var palette = palettes[accentName];

                root.style.setProperty("--vts-hero-index", heroIndex);
                root.style.setProperty("--vts-accent", palette.accent);
                root.style.setProperty("--vts-accent-dark", palette.dark);

                labels.forEach(function (label, index) {
                  label.textContent = (prefix.length > 0 ? prefix + " " : "") + String(index + 1);
                });

                var heroCard = cards[heroIndex];
                var heroAura = heroCard.querySelector(".vts-aura");
                var nonHeroCards = cards.filter(function (_, index) {
                  return index !== heroIndex;
                });
                heroCard.setAttribute("aria-current", "true");

                var IN_BASE = 1.4;
                var THROW_BASE = 0.78;
                var SNAP_BASE = 0.62;
                var durationValue = parseFloat(root.dataset.duration || "4");
                var duration = Number.isFinite(durationValue) ? Math.max(0.001, durationValue) : 4;
                var IN = Math.min(IN_BASE, duration);
                var HOLD = Math.max(0, duration - IN);
                var motionScale = IN / IN_BASE;
                var THROW = THROW_BASE * motionScale;
                var SNAP = SNAP_BASE * motionScale;
                var SNAP_AT = THROW;

                gsap.set(clip, { opacity: 0 });
                gsap.set(rail, {
                  "--vts-throw-x": 140,
                  "--vts-throw-y": 7,
                  "--vts-tilt": 0.8,
                });
                gsap.set(cards, { opacity: 0.82, scale: 0.97 });
                gsap.set(heroAura, { opacity: 0, scale: 0.98 });

                var tl = gsap.timeline({ paused: true });

                tl.to(clip, { opacity: 1, duration: Math.min(0.2, IN), ease: "power2.out" }, 0);

                // Fast travel loses most of its velocity under the whip-out ease.
                tl.to(
                  rail,
                  {
                    "--vts-throw-x": 16,
                    "--vts-throw-y": -1.4,
                    "--vts-tilt": -0.22,
                    duration: THROW,
                    ease: "power4.out",
                  },
                  0,
                );

                // The final back curve crosses zero, then returns to the exact center.
                tl.to(
                  rail,
                  {
                    "--vts-throw-x": 0,
                    "--vts-throw-y": 0,
                    "--vts-tilt": 0,
                    duration: SNAP,
                    ease: "back.out(1.7)",
                  },
                  SNAP_AT,
                );
                tl.to(
                  nonHeroCards,
                  { opacity: 0.62, scale: 0.95, duration: SNAP, ease: "power2.out" },
                  SNAP_AT,
                );
                tl.to(
                  heroCard,
                  {
                    opacity: 1,
                    scale: 1.04,
                    borderColor: palette.accent,
                    boxShadow: "0 4.2cqh 10cqh " + palette.glow,
                    duration: SNAP,
                    ease: "back.out(1.7)",
                  },
                  SNAP_AT,
                );
                tl.to(
                  heroAura,
                  { opacity: 0.58, scale: 1, duration: SNAP * 0.7, ease: "power2.out" },
                  SNAP_AT + SNAP * 0.3,
                );

                if (HOLD > 0.4) {
                  var breathHalf = Math.min(0.65, HOLD / 2);
                  var breathRepeat = Math.max(0, Math.floor(HOLD / breathHalf) - 1);
                  tl.to(
                    heroAura,
                    {
                      opacity: 0.78,
                      scale: 1.015,
                      duration: breathHalf,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: breathRepeat,
                    },
                    IN,
                  );
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
        &#123; "id": "hero_index", "type": "number", "role": "content", "label": "Hero index", "description": "Zero-based index of the shot centered at the settle.", "default": 2, "min": 0, "max": 4, "step": 1 &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Highlight color used by the hero shot.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "card_label_prefix", "type": "string", "role": "content", "label": "Card label prefix", "description": "Text placed before each shot number.", "default": "Shot" &#125;
      ]' data-composition-duration="4" data-composition-id="velocity-throw-snap" data-duration="4" data-fps="30">
            
    
            <div
              id="velocity-throw-snap-clip"
              class="vts-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="vts-rail" role="list" aria-label="Feature shots">
                <article class="vts-card" role="listitem">
                  <span class="vts-aura" aria-hidden="true"></span>
                  <div class="vts-card-top">
                    <span class="vts-dots"><i></i><i></i><i></i></span><span class="vts-index">01</span>
                  </div>
                  <div class="vts-preview">
                    <span class="vts-panel"></span><span class="vts-stack"><i></i><i></i><i></i></span>
                  </div>
                  <span class="vts-label"></span>
                </article>
                <article class="vts-card" role="listitem">
                  <span class="vts-aura" aria-hidden="true"></span>
                  <div class="vts-card-top">
                    <span class="vts-dots"><i></i><i></i><i></i></span><span class="vts-index">02</span>
                  </div>
                  <div class="vts-preview">
                    <span class="vts-panel"></span><span class="vts-stack"><i></i><i></i><i></i></span>
                  </div>
                  <span class="vts-label"></span>
                </article>
                <article class="vts-card" role="listitem">
                  <span class="vts-aura" aria-hidden="true"></span>
                  <div class="vts-card-top">
                    <span class="vts-dots"><i></i><i></i><i></i></span><span class="vts-index">03</span>
                  </div>
                  <div class="vts-preview">
                    <span class="vts-panel"></span><span class="vts-stack"><i></i><i></i><i></i></span>
                  </div>
                  <span class="vts-label"></span>
                </article>
                <article class="vts-card" role="listitem">
                  <span class="vts-aura" aria-hidden="true"></span>
                  <div class="vts-card-top">
                    <span class="vts-dots"><i></i><i></i><i></i></span><span class="vts-index">04</span>
                  </div>
                  <div class="vts-preview">
                    <span class="vts-panel"></span><span class="vts-stack"><i></i><i></i><i></i></span>
                  </div>
                  <span class="vts-label"></span>
                </article>
                <article class="vts-card" role="listitem">
                  <span class="vts-aura" aria-hidden="true"></span>
                  <div class="vts-card-top">
                    <span class="vts-dots"><i></i><i></i><i></i></span><span class="vts-index">05</span>
                  </div>
                  <div class="vts-preview">
                    <span class="vts-panel"></span><span class="vts-stack"><i></i><i></i><i></i></span>
                  </div>
                  <span class="vts-label"></span>
                </article>
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
    --vts-card-width: 48;
    --vts-card-gap: 4.5;
    --vts-hero-index: 0;
    --vts-throw-x: 0;
    --vts-throw-y: 0;
    --vts-tilt: 0;
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .vts-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background:
      radial-gradient(
        circle at 50% 46%,
        color-mix(in srgb, var(--vts-accent) 13%, var(--bg, #172033)) 0%,
        var(--bg, #0b0c0e) 72%
      ),
      var(--bg, #0b0c0e);
  }

  .vts-rail {
    position: absolute;
    left: 0;
    top: 18cqh;
    display: flex;
    align-items: center;
    gap: calc(var(--vts-card-gap) * 1cqw);
    width: max-content;
    transform: translateX(
      calc(
        (
          50 - var(--vts-card-width) / 2 - var(--vts-hero-index) *
          (var(--vts-card-width) + var(--vts-card-gap)) + var(--vts-throw-x)
        ) *
      1cqw
    )
    )
    translateY(calc(var(--vts-throw-y) * 1cqh)) rotate(calc(var(--vts-tilt) * 1deg));
    transform-origin: 50% 50%;
    will-change: transform;
  }

  .vts-card {
    position: relative;
    flex: 0 0 calc(var(--vts-card-width) * 1cqw);
    height: 62cqh;
    overflow: hidden;
    border: 0.16cqmin solid color-mix(in srgb, var(--border, #475569) 76%, transparent);
    border-radius: var(--radius, 3.2cqmin);
    background: linear-gradient(
      150deg,
      var(--surface, #f8fafc) 0%,
      var(--surface, #dbe5f1) 100%
    );
    color: var(--fg, #101827);
    box-shadow: 0 3.6cqh 8cqh color-mix(in srgb, var(--bg, #000000) 46%, transparent);
    transform-origin: 50% 50%;
    will-change: transform, opacity, border-color, box-shadow;
  }

  .vts-aura {
    position: absolute;
    inset: -0.2cqmin;
    z-index: 2;
    border: 0.28cqmin solid var(--vts-accent);
    border-radius: inherit;
    box-shadow:
      inset 0 0 3cqmin color-mix(in srgb, var(--vts-accent) 16%, transparent),
      0 0 4cqmin color-mix(in srgb, var(--vts-accent) 36%, transparent);
    opacity: 0;
    pointer-events: none;
  }

  .vts-card-top {
    height: 8cqh;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2.6cqw;
    border-bottom: 0.1cqmin solid var(--border, #c4ceda);
    background: color-mix(in srgb, var(--surface, #ffffff) 58%, transparent);
  }

  .vts-dots {
    display: flex;
    gap: 0.45cqw;
  }

  .vts-dots i {
    width: 0.58cqw;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--muted, #91a0b3);
  }

  .vts-index {
    color: var(--vts-accent-dark);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 1.45cqw;
    font-weight: 760;
    letter-spacing: 0.12em;
  }

  .vts-preview {
    height: 38cqh;
    display: grid;
    grid-template-columns: 1.05fr 0.95fr;
    gap: 1.8cqw;
    padding: 3cqh 2.6cqw;
  }

  .vts-panel, .vts-stack {
    border: 0.1cqmin solid var(--border, #c4ceda);
    border-radius: 1.5cqmin;
    background: var(--surface, #edf2f7);
  }

  .vts-panel {
    position: relative;
    overflow: hidden;
    background: linear-gradient(
      145deg,
      color-mix(in srgb, var(--vts-accent) 30%, var(--surface, #eaf0f6)),
      var(--surface, #d7e0ea)
    );
  }

  .vts-panel::before, .vts-panel::after {
    content: "";
    position: absolute;
    border-radius: 1cqmin;
    background: color-mix(in srgb, var(--vts-accent) 72%, var(--surface, #ffffff));
  }

  .vts-panel::before {
    width: 11cqw;
    height: 11cqw;
    left: 3cqw;
    top: 5cqh;
  }

  .vts-panel::after {
    left: 3cqw;
    right: 3cqw;
    bottom: 4cqh;
    height: 1.2cqh;
  }

  .vts-stack {
    display: grid;
    align-content: center;
    gap: 2.2cqh;
    padding: 2cqw;
  }

  .vts-stack i {
    display: block;
    height: 1.2cqh;
    border-radius: 1cqh;
    background: var(--muted, #bcc8d6);
  }

  .vts-stack i:first-child {
    width: 72%;
    background: var(--vts-accent);
  }

  .vts-stack i:last-child {
    width: 56%;
  }

  .vts-label {
    display: block;
    max-width: 100%;
    padding: 0 2.6cqw;
    overflow: hidden;
    color: var(--fg, #101827);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 3.4cqw;
    font-weight: 780;
    line-height: 1;
    letter-spacing: -0.04em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vts-card:nth-child(2) .vts-preview, .vts-card:nth-child(5) .vts-preview {
    grid-template-columns: 0.78fr 1.22fr;
  }

  .vts-card:nth-child(3) .vts-panel::before {
    width: 14cqw;
    border-radius: 50%;
  }

  .vts-card:nth-child(4) .vts-preview {
    grid-template-columns: 1fr;
  }

  .vts-card:nth-child(4) .vts-stack {
    display: none;
  }
}
</style>
