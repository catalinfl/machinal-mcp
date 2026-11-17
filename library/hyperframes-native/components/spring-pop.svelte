<!-- Modified Svelte adaptation of registry/components/spring-pop/spring-pop.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var badge = root.querySelector(".sp-badge");
                var label = root.querySelector(".sp-label");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                // INVARIANT: invalid numeric overrides return to declared
                // defaults. Explicit finite checks preserve every valid value.
                var overshootValue = vars.overshoot;
                var fromScaleValue = vars.fromScale;
                var overshoot = Number.isFinite(overshootValue)
                  ? Math.max(1.1, Math.min(2, overshootValue))
                  : 1.7;
                var fromScale = Number.isFinite(fromScaleValue)
                  ? Math.max(0.8, Math.min(0.97, fromScaleValue))
                  : 0.9;
                var text = vars.text == null ? "New" : String(vars.text);

                label.textContent = text;

                // RETIME RANGE: tune only the fixed entrance length. HOLD is
                // deliberately still, and this reveal has no exit phase.
                var IN_BASE = 0.6;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "2"));
                var IN = Math.min(IN_BASE, duration);
                var OPACITY_IN = Math.min(0.3, IN);

                var tl = gsap.timeline({ paused: true });

                // --ease-overshoot: the back curve owns the only scale arc. The
                // start is 0.9 by default, never 0, so the badge does not appear
                // from nothing. Opacity uses its own non-overshooting ease.
                tl.fromTo(
                  badge,
                  { scale: fromScale },
                  { scale: 1, duration: IN, ease: "back.out(" + overshoot + ")" },
                  0,
                );
                tl.fromTo(
                  badge,
                  { opacity: 0 },
                  { opacity: 1, duration: OPACITY_IN, ease: "power2.out" },
                  0,
                );
                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "overshoot", "type": "number", "role": "timing", "label": "Overshoot", "description": "Strength passed to the back.out entrance curve.", "default": 1.7, "min": 1.1, "max": 2, "step": 0.1 &#125;,
        &#123; "id": "fromScale", "type": "number", "role": "timing", "label": "Starting scale", "description": "Scale at the start of the entrance.", "default": 0.9, "min": 0.8, "max": 0.97, "step": 0.01 &#125;,
        &#123; "id": "text", "type": "string", "role": "content", "label": "Label", "description": "Text displayed inside the badge.", "default": "New" &#125;
      ]' data-composition-id="spring-pop" data-duration="2" data-fps="30">
            
    
            <div
              id="spring-pop-clip"
              class="sp-clip clip"
              data-start="0"
              data-duration="2"
              data-track-index="0"
            >
              <div class="sp-badge">
                <span class="sp-dot" aria-hidden="true"></span>
                <span class="sp-label"></span>
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
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .sp-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  /* EDIT ZONE: badge proportions only. The centered 82cqw ceiling
  reserves clearance for the overshoot at every allowed value. */
  .sp-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2, 2.4cqw);
    min-width: 48cqw;
    max-width: 82cqw;
    min-height: 32cqh;
    padding: var(--space-2, 2.4cqh) var(--space-3, 4cqw);
    border: 0.18cqmin solid var(--border, #334155);
    border-radius: var(--radius, 3cqmin);
    background: var(--surface, #1e293b);
    box-shadow: 0 2.4cqh 7cqh color-mix(in srgb, var(--bg, #0b1120) 42%, transparent);
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .sp-dot {
    flex: 0 0 auto;
    width: 3.2cqmin;
    aspect-ratio: 1;
    border-radius: 50%;
    background: var(--brand, #22c55e);
    box-shadow: 0 0 2.4cqmin color-mix(in srgb, var(--brand, #22c55e) 58%, transparent);
  }

  .sp-label {
    min-width: 0;
    overflow: hidden;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: clamp(14px, 9cqmin, 54px);
    font-weight: 720;
    line-height: 1.2;
    letter-spacing: -0.02em;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
