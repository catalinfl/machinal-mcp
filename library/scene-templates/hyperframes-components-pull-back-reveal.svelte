<!-- Modified Svelte adaptation of registry/components/pull-back-reveal/pull-back-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var world = root.querySelector(".pbr-world");
                var headline = root.querySelector(".pbr-headline");
                var detail = root.querySelector(".pbr-detail-chip");
                var ground = root.querySelector(".pbr-ground");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var detailText = vars.detail_text == null ? "+312%" : String(vars.detail_text);
                var headlineText = vars.headline == null ? "Growth compounds" : String(vars.headline);
                var accentColors = {
                  green: "var(--brand, #a1a1aa)",
                  blue: "var(--accent, #a1a1aa)",
                  violet: "var(--accent-2, #a1a1aa)",
                };
                var accentColor = accentColors[vars.accent] || accentColors.green;

                detail.textContent = detailText;
                headline.textContent = headlineText;
                root.style.setProperty("--pbr-accent", accentColor);

                // RETIME RANGE: IN owns the tight beat and complete camera move.
                // HOLD is the only elastic phase. This reveal has no exit.
                var IN_BASE = 2.4;
                var TIGHT_HOLD_BASE = 0.55;
                var WHIP_BASE = 1.2;
                var DRIFT_BASE = 0.65;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var phaseScale = Math.min(1, duration / IN_BASE);
                var TIGHT_HOLD = TIGHT_HOLD_BASE * phaseScale;
                var WHIP = WHIP_BASE * phaseScale;
                var DRIFT = DRIFT_BASE * phaseScale;
                var IN = TIGHT_HOLD + WHIP + DRIFT;
                var HOLD = Math.max(0, duration - IN);

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  world,
                  { scale: 2.2, y: 0 },
                  { scale: 1.055, y: "0.7cqh", duration: WHIP, ease: "power4.out" },
                  TIGHT_HOLD,
                );
                tl.to(
                  world,
                  { scale: 1, y: 0, duration: DRIFT, ease: "sine.inOut" },
                  TIGHT_HOLD + WHIP,
                );
                tl.fromTo(
                  ground,
                  { opacity: 0, scaleX: 0.72, scaleY: 0.72 },
                  { opacity: 0.78, scaleX: 1, scaleY: 1, duration: DRIFT, ease: "power2.out" },
                  TIGHT_HOLD + WHIP,
                );

                if (HOLD > 0) {
                  tl.to(
                    ground,
                    { opacity: 0.68, scaleX: 0.97, duration: HOLD * 0.5, ease: "sine.inOut" },
                    IN,
                  );
                  tl.to(
                    ground,
                    { opacity: 0.78, scaleX: 1, duration: HOLD * 0.5, ease: "sine.inOut" },
                    IN + HOLD * 0.5,
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
        &#123; "id": "detail_text", "type": "string", "role": "content", "label": "Detail text", "description": "Stat shown in the detail chip at the center of the reveal.", "default": "+312%" &#125;,
        &#123; "id": "headline", "type": "string", "role": "content", "label": "Headline", "description": "Headline revealed around the focused detail.", "default": "Growth compounds" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Highlight color used across the composed scene.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="pull-back-reveal" data-duration="4.5" data-fps="30">
            
    
            <div
              id="pull-back-reveal-clip"
              class="pbr-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <div class="pbr-world">
                <div class="pbr-headline"></div>
    
                <section class="pbr-card pbr-detail-card">
                  <div class="pbr-detail-label">Net growth</div>
                  <div class="pbr-detail-chip"></div>
                  <div class="pbr-detail-context">Across every active workspace</div>
                </section>
    
                <section class="pbr-card pbr-support-card pbr-support-card-a">
                  <div class="pbr-support-label">Retention</div>
                  <div class="pbr-support-value">94%</div>
                  <div class="pbr-support-rule"></div>
                </section>
    
                <section class="pbr-card pbr-support-card pbr-support-card-b">
                  <div class="pbr-support-label">Teams</div>
                  <div class="pbr-support-value">48</div>
                  <div class="pbr-support-rule"></div>
                </section>
    
                <div class="pbr-ground"></div>
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
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .pbr-clip, .pbr-world {
    position: absolute;
    inset: 0;
  }

  .pbr-clip {
    overflow: hidden;
    background: var(--bg, #0b0c0e);
  }

  .pbr-world {
    overflow: hidden;
    transform-origin: 50% 50%;
    background:
      radial-gradient(
        circle at 48% 50%,
        color-mix(in srgb, var(--pbr-accent) 19%, transparent),
        transparent 27%
      ),
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--surface, #18202d) 82%, var(--bg, #0b0c0e)),
        var(--bg, #0b0c0e) 72%
      );
    will-change: transform;
  }

  .pbr-headline {
    position: absolute;
    z-index: 1;
    top: 8cqh;
    left: 8cqw;
    width: 76cqw;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 7.6cqw;
    font-weight: 780;
    line-height: 0.92;
    letter-spacing: -0.055em;
    overflow-wrap: anywhere;
    text-shadow: 0 1.8cqh 5cqh color-mix(in srgb, var(--bg, #0b0c0e) 72%, transparent);
  }

  .pbr-card {
    position: absolute;
    z-index: 1;
    overflow: hidden;
    border: 0.11cqw solid color-mix(in srgb, var(--border, #334155) 78%, transparent);
    border-radius: var(--radius, 2.4cqw);
    background: color-mix(in srgb, var(--surface, #1e293b) 92%, transparent);
    box-shadow:
      0 2.2cqh 5.5cqh color-mix(in srgb, var(--bg, #0b0c0e) 54%, transparent),
      inset 0 0.1cqh 0 color-mix(in srgb, var(--fg, #f8fafc) 9%, transparent);
  }

  .pbr-detail-card {
    top: 31cqh;
    left: 8cqw;
    width: 56cqw;
    height: 56cqh;
    padding: 5cqh 4cqw;
  }

  .pbr-detail-label, .pbr-support-label {
    color: var(--muted, #94a3b8);
    font-size: 1.35cqw;
    font-weight: 680;
    line-height: 1;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .pbr-detail-chip {
    position: absolute;
    top: 13cqh;
    left: 31cqw;
    width: 20cqw;
    min-height: 12cqh;
    display: grid;
    place-items: center;
    padding: 1.8cqh 1.5cqw;
    border: 0.12cqw solid color-mix(in srgb, var(--pbr-accent) 72%, var(--fg, #f8fafc));
    border-radius: calc(var(--radius, 2.4cqw) * 0.72);
    background: color-mix(in srgb, var(--pbr-accent) 22%, var(--surface, #1e293b));
    box-shadow: 0 1.8cqh 4.5cqh color-mix(in srgb, var(--pbr-accent) 28%, transparent);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 4.4cqw;
    font-weight: 820;
    line-height: 1;
    letter-spacing: -0.055em;
    overflow: hidden;
    text-align: center;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .pbr-detail-context {
    position: absolute;
    bottom: 5cqh;
    left: 4cqw;
    color: var(--muted, #94a3b8);
    font-size: 1.6cqw;
    font-weight: 560;
    line-height: 1.25;
  }

  .pbr-support-card {
    left: 75cqw;
    width: 17cqw;
    height: 25cqh;
    padding: 3.6cqh 2.2cqw;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .pbr-support-card-a {
    top: 31cqh;
  }

  .pbr-support-card-b {
    top: 62cqh;
  }

  .pbr-support-value {
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: 3.7cqw;
    font-weight: 780;
    line-height: 0.9;
    letter-spacing: -0.05em;
  }

  .pbr-support-rule {
    width: 100%;
    height: 0.5cqh;
    border-radius: 999cqw;
    background: color-mix(in srgb, var(--pbr-accent) 72%, var(--border, #334155));
  }

  .pbr-ground {
    position: absolute;
    z-index: 0;
    left: 15cqw;
    bottom: 2cqh;
    width: 70cqw;
    height: 10cqh;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pbr-accent) 16%, var(--bg, #0b0c0e));
    filter: blur(3.2cqh);
    opacity: 0;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }
}
</style>
