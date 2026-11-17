<!-- Modified Svelte adaptation of registry/components/native-notification-pop/native-notification-pop.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal id: mount flattening strips data-composition-id from the
                // live root before this timeline registers.
                var compositionId = "native-notification-pop";
                var clip = root.querySelector(".nnp-clip");
                var anchor = root.querySelector(".nnp-anchor");
                var banner = root.querySelector(".nnp-banner");

                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var title = vars.title == null ? "Render complete" : String(vars.title);
                var body = vars.body == null ? "launch-cut.mp4 is ready to preview" : String(vars.body);
                var appLabel = vars.app_label == null ? "HyperFrames" : String(vars.app_label);
                var os = vars.os === "macos" ? "macos" : "ios";
                var rawAt = vars.at == null ? 0.3 : Number(vars.at);
                var at = Number.isFinite(rawAt) ? Math.max(0, Math.min(8, rawAt)) : 0.3;
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                // The bundler mirrors composition variables as scoped CSS custom
                // props, so this unit's own accent variable shadows the contract
                // --accent token inside the subtree. When the shadow is present,
                // fall back to the literal contract value instead of var(--accent).
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentColors.blue = "#38bdf8";
                }
                root.style.setProperty("--nnp-accent", accentColors[accent]);

                anchor.setAttribute("data-os", os);
                root.querySelector(".nnp-app").textContent = appLabel;
                root.querySelector(".nnp-title").textContent = title;
                root.querySelector(".nnp-body").textContent = body;
                banner.setAttribute("aria-label", appLabel + ": " + title + ". " + body);

                // RETIME RANGE: fixed phases; HOLD is the only elastic span.
                var DROP = 0.9;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3"));
                var OUT = Math.min(OUT_BASE, duration * 0.2);
                var OUT_START = duration - OUT;
                // The spring always settles before any exit: no second tween ever
                // fights the sampler for banner y (Wave K L1 single-owner form).
                at = Math.min(at, Math.max(0, OUT_START - DROP));

                // Start fully above the frame: measured px at mount (cq-unit
                // transform tweens misbehave under seeks; px measured once do not).
                var clipTop = clip.getBoundingClientRect().top;
                var bannerBottom = banner.getBoundingClientRect().bottom;
                var offset = Math.max(1, bannerBottom - clipTop + 4);

                // System spring constants, tuned against the iOS/macOS banner
                // feel: first contact with rest at ~0.31s, ~3% soft overshoot,
                // visually settled by ~0.7s.
                var OMEGA = 15;
                var ZETA = 0.74;
                var OMEGA_D = OMEGA * Math.sqrt(1 - ZETA * ZETA);
                function springEnvelope(t) {
                  return (
                    Math.exp(-ZETA * OMEGA * t) *
                    (Math.cos(OMEGA_D * t) + ((ZETA * OMEGA) / OMEGA_D) * Math.sin(OMEGA_D * t))
                  );
                }
                var LAND = Math.PI / OMEGA_D; // first contact with rest

                function fireSfx(id, t) {
                  root.dispatchEvent(
                    new CustomEvent("hf:sfx", { detail: { id: id, t: t }, bubbles: true }),
                  );
                }

                gsap.set(banner, { y: -offset, opacity: 1 });

                var tl = gsap.timeline({ paused: true });

                // IN: the spring drop. A linear driver samples the closed form,
                // so position is a pure function of time and seeks in either
                // direction land on identical frames.
                var driver = { t: 0 };
                tl.to(
                  driver,
                  {
                    t: DROP,
                    duration: DROP,
                    ease: "none",
                    onUpdate: function () {
                      gsap.set(banner, { y: -offset * springEnvelope(driver.t) });
                    },
                  },
                  at,
                );
                // Pin exactly to rest for the hold (the envelope tail is ~0 but
                // not exactly 0).
                tl.set(banner, { y: 0 }, at + DROP);
                tl.call(
                  function () {
                    fireSfx("notification-pop", at + LAND);
                  },
                  [],
                  at + LAND,
                );

                // HOLD: settled mass. Dead still.

                // OUT: the banner tucks away only via exit; the scene holds
                // (frame roots own scene transitions).
                if (exit === "up") {
                  tl.to(banner, { y: -offset, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(banner, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "title", "type": "string", "role": "content", "label": "Title", "description": "The notification title line.", "default": "Render complete" &#125;,
        &#123; "id": "body", "type": "string", "role": "content", "label": "Body", "description": "One body line. Long lines truncate with an ellipsis.", "default": "launch-cut.mp4 is ready to preview" &#125;,
        &#123; "id": "app_label", "type": "string", "role": "content", "label": "App label", "description": "Small-caps app name row beside the app dot.", "default": "HyperFrames" &#125;,
        &#123; "id": "os", "type": "enum", "role": "style", "label": "OS", "description": "Banner geometry and placement: wide centered iOS or compact top-right macOS.", "default": "ios", "options": [&#123; "value": "ios", "label": "iOS" &#125;, &#123; "value": "macos", "label": "macOS" &#125;] &#125;,
        &#123; "id": "at", "type": "number", "role": "timing", "label": "Drop start", "description": "Seconds after mount start when the banner drops in.", "default": 0.3, "min": 0, "max": 8, "step": 0.05, "unit": "s" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "App dot color.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "None holds the banner; up tucks it back off the top; fade fades it in place.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3" data-composition-id="native-notification-pop" data-duration="3" data-fps="30">
            
    
            <div
              id="native-notification-pop-clip"
              class="nnp-clip clip"
              data-start="0"
              data-duration="3"
              data-track-index="0"
            >
              <div class="nnp-slot" data-slot="scene">
                
                <div class="nnp-default" aria-hidden="true">
                  <div class="nnp-card">
                    <div class="nnp-card-bar"></div>
                    <div class="nnp-card-line"></div>
                    <div class="nnp-card-line"></div>
                  </div>
                </div>
              </div>
    
              <div class="nnp-anchor" data-os="ios">
                <div class="nnp-banner" role="status">
                  <div class="nnp-dot" aria-hidden="true"></div>
                  <div class="nnp-copy">
                    <div class="nnp-app"></div>
                    <div class="nnp-title"></div>
                    <div class="nnp-body"></div>
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
    background: var(--bg, #07111f);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .nnp-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
  }

  .nnp-slot, .nnp-slot > img, .nnp-slot > video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .nnp-slot > img, .nnp-slot > video {
    object-fit: cover;
  }

  /* Token backdrop default: soft saturated color fields plus a
  skeleton card, so the banner blur has structure to smear.
  Callers replacing slot children never see any of this. */
  .nnp-default {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background:
      radial-gradient(
        50cqw 42cqh at 24% 12%,
        color-mix(in srgb, var(--brand, #22c55e) 34%, transparent) 0%,
        transparent 70%
      ),
      radial-gradient(
        46cqw 40cqh at 82% 26%,
        color-mix(in srgb, var(--accent-2, #c5a3ff) 30%, transparent) 0%,
        transparent 70%
      ),
      radial-gradient(
        ellipse at 50% 90%,
        color-mix(in srgb, var(--surface, #172033) 80%, var(--bg, #07111f)) 0%,
        var(--bg, #07111f) 78%
      );
  }

  .nnp-card {
    width: 52cqw;
    padding: var(--space-3, 4cqh) var(--space-3, 4cqw);
    border: 0.16cqmin solid var(--border, #334155);
    border-radius: var(--radius, 2.4cqmin);
    background: color-mix(in srgb, var(--surface, #172033) 88%, var(--bg, #07111f));
  }

  .nnp-card-bar {
    width: 34%;
    height: 4.2cqh;
    margin-bottom: var(--space-3, 4cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.55;
  }

  .nnp-card-line {
    height: 2.2cqh;
    margin-bottom: var(--space-2, 2.6cqh);
    border-radius: 1.2cqh;
    background: var(--muted, #94a3b8);
    opacity: 0.38;
  }

  .nnp-card-line:nth-of-type(2) {
    width: 90%;
  }

  .nnp-card-line:nth-of-type(3) {
    width: 62%;
  }

  /* The anchor owns placement so the banner transform belongs to the
  spring alone (a translateX(-50%) centering transform would be
    clobbered by the gsap y). */
  .nnp-anchor {
    position: absolute;
    inset: 0 0 auto 0;
    display: flex;
    z-index: 3;
  }

  .nnp-anchor[data-os="ios"] {
    justify-content: center;
    padding-top: 4.5cqh;
  }

  .nnp-anchor[data-os="macos"] {
    justify-content: flex-end;
    padding: 3.5cqh 2.2cqw 0 0;
  }

  .nnp-banner {
    display: flex;
    align-items: center;
    gap: var(--space-2, 2.4cqmin);
    border: 0.14cqmin solid color-mix(in srgb, var(--fg, #f8fafc) 16%, transparent);
    background: color-mix(in srgb, var(--surface, #172033) 62%, transparent);
    -webkit-backdrop-filter: blur(3.2cqmin) saturate(140%);
    backdrop-filter: blur(3.2cqmin) saturate(140%);
    box-shadow: 0 2.4cqh 7cqh color-mix(in srgb, var(--bg, #07111f) 50%, transparent);
    will-change: transform;
  }

  .nnp-anchor[data-os="ios"] .nnp-banner {
    width: 58cqw;
    border-radius: 3.6cqmin;
    padding: 2.6cqmin 3cqmin;
  }

  .nnp-anchor[data-os="macos"] .nnp-banner {
    width: 38cqw;
    border-radius: 2.2cqmin;
    padding: 2.2cqmin 2.6cqmin;
  }

  .nnp-dot {
    flex: 0 0 auto;
    width: 5.4cqmin;
    aspect-ratio: 1;
    border-radius: 30%;
    background: linear-gradient(
      160deg,
      color-mix(in srgb, var(--nnp-accent) 72%, var(--fg, #f8fafc)) 0%,
      var(--nnp-accent) 62%
    );
  }

  .nnp-anchor[data-os="macos"] .nnp-dot {
    width: 4.6cqmin;
    border-radius: 24%;
  }

  .nnp-copy {
    flex: 1 1 auto;
    min-width: 0;
  }

  .nnp-app, .nnp-title, .nnp-body {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .nnp-app {
    color: var(--muted, #94a3b8);
    font-size: 1.9cqmin;
    font-weight: 500;
    letter-spacing: 0.11em;
    line-height: 1.5;
    text-transform: uppercase;
  }

  .nnp-app:empty {
    display: none;
  }

  .nnp-title {
    color: var(--fg, #f8fafc);
    font-size: 2.7cqmin;
    font-weight: 600;
    line-height: 1.35;
  }

  .nnp-body {
    color: var(--muted, #94a3b8);
    font-size: 2.4cqmin;
    font-weight: 400;
    line-height: 1.4;
  }
}
</style>
