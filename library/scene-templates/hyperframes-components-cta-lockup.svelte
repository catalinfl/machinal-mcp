<!-- Modified Svelte adaptation of registry/components/cta-lockup/cta-lockup.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var lockup = root.querySelector(".cl-lockup");
                var actionLine = root.querySelector(".cl-action");
                var button = root.querySelector(".cl-button");
                var microcopy = root.querySelector(".cl-microcopy");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var actionText =
                  vars.action_line == null ? "Start building today" : String(vars.action_line);
                var buttonText =
                  vars.button_label == null ? "Get HyperFrames" : String(vars.button_label);
                var microcopyText =
                  vars.microcopy == null ? "Free while in beta" : String(vars.microcopy);
                var accentColors = {
                  green: "var(--brand, #22c55e)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #a78bfa)",
                };
                var accentName = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";

                actionLine.textContent = actionText;
                button.textContent = buttonText;
                microcopy.textContent = microcopyText;
                root.style.setProperty("--cl-accent", accentColors[accentName]);

                var IN_BASE = 1.6;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var envelopeScale = Math.min(1, duration / IN_BASE);
                var IN = IN_BASE * envelopeScale;
                var HOLD = Math.max(0, duration - IN);

                var ACTION_DURATION = 0.5 * envelopeScale;
                var BUTTON_AT = 0.56 * envelopeScale;
                var BUTTON_DURATION = 0.6 * envelopeScale;
                var BUTTON_OPACITY_DURATION = 0.24 * envelopeScale;
                var MICROCOPY_AT = 1.18 * envelopeScale;
                var MICROCOPY_DURATION = 0.42 * envelopeScale;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  actionLine,
                  { opacity: 0, y: "3.4cqh" },
                  { opacity: 1, y: 0, duration: ACTION_DURATION, ease: "power3.out" },
                  0,
                );
                tl.fromTo(
                  button,
                  { scale: 0.72, y: "2.2cqh" },
                  {
                    scale: 1,
                    y: 0,
                    duration: BUTTON_DURATION,
                    ease: "back.out(1.7)",
                  },
                  BUTTON_AT,
                );
                tl.fromTo(
                  button,
                  { opacity: 0 },
                  {
                    opacity: 1,
                    duration: BUTTON_OPACITY_DURATION,
                    ease: "power2.out",
                  },
                  BUTTON_AT,
                );
                tl.fromTo(
                  microcopy,
                  { opacity: 0, y: "1.8cqh" },
                  {
                    opacity: 1,
                    y: 0,
                    duration: MICROCOPY_DURATION,
                    ease: "power2.out",
                  },
                  MICROCOPY_AT,
                );

                if (HOLD > 0) {
                  tl.fromTo(
                    lockup,
                    { y: 0 },
                    {
                      y: "-0.35cqh",
                      duration: HOLD / 2,
                      ease: "sine.inOut",
                      yoyo: true,
                      repeat: 1,
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
        &#123; "id": "action_line", "type": "string", "role": "content", "label": "Action line", "description": "Primary action statement shown above the CTA.", "default": "Start building today" &#125;,
        &#123; "id": "button_label", "type": "string", "role": "content", "label": "Button label", "description": "Text displayed inside the CTA capsule.", "default": "Get HyperFrames" &#125;,
        &#123; "id": "microcopy", "type": "string", "role": "content", "label": "Microcopy", "description": "Supporting detail shown below the CTA capsule.", "default": "Free while in beta" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Fill color used by the CTA capsule.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="cta-lockup" data-duration="4" data-fps="30">
            
    
            <div
              id="cta-lockup-clip"
              class="cl-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="cl-lockup">
                <h2 class="cl-action"></h2>
                <button class="cl-button" type="button" tabindex="-1"></button>
                <p class="cl-microcopy"></p>
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
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .cl-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .cl-lockup {
    width: min(88cqw, 150cqh);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    will-change: transform;
  }

  .cl-action {
    max-width: 86cqw;
    margin: 0 0 6.5cqh;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(10cqw, 14cqh);
    font-weight: 760;
    line-height: 1.02;
    letter-spacing: -0.045em;
    text-wrap: balance;
    will-change: transform, opacity;
  }

  .cl-button {
    min-width: 34cqw;
    max-width: 78cqw;
    margin: 0 0 3.8cqh;
    padding: 3.2cqh 5.5cqw;
    overflow: hidden;
    border: 0;
    border-radius: 50cqh;
    background: var(--cl-accent, #22c55e);
    box-shadow: 0 2.2cqh 6cqh color-mix(in srgb, var(--cl-accent, #22c55e) 28%, transparent);
    color: #07110d;
    font: inherit;
    font-size: min(4.3cqw, 6.8cqh);
    font-weight: 760;
    line-height: 1;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .cl-microcopy {
    max-width: 76cqw;
    margin: 0;
    color: var(--muted, #cbd5e1);
    font-size: min(3cqw, 4.2cqh);
    font-weight: 520;
    line-height: 1.25;
    letter-spacing: 0.01em;
    text-wrap: balance;
    will-change: transform, opacity;
  }
}
</style>
