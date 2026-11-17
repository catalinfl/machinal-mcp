<!-- Modified Svelte adaptation of registry/components/titlecard-calm/titlecard-calm.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var lockup = root.querySelector(".tc-lockup");
                var kicker = root.querySelector(".tc-kicker");
                var headline = root.querySelector(".tc-headline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var headlineText = vars.headline == null ? "Less, but better" : String(vars.headline);
                var kickerText = vars.kicker == null ? "DESIGN PRINCIPLE" : String(vars.kicker);

                headline.textContent = headlineText;
                kicker.textContent = kickerText;

                var IN_BASE = 1.2;
                var OUT_BASE = 0.55;
                var parsedDuration = Number.parseFloat(root.dataset.duration);
                var duration = Number.isFinite(parsedDuration) ? Math.max(0.001, parsedDuration) : 4;
                var totalBase = IN_BASE + OUT_BASE;
                var phaseScale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * phaseScale;
                var OUT = OUT_BASE * phaseScale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;
                var KICKER_IN = 0.5 * phaseScale;
                var HEADLINE_AT = 0.28 * phaseScale;
                var HEADLINE_IN = 0.72 * phaseScale;

                gsap.set(lockup, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  kicker,
                  { opacity: 0, y: "2.2cqh" },
                  { opacity: 1, y: "0cqh", duration: KICKER_IN, ease: "power2.out" },
                  0,
                );
                tl.fromTo(
                  headline,
                  { opacity: 0, y: "3.2cqh" },
                  { opacity: 1, y: "0cqh", duration: HEADLINE_IN, ease: "power3.out" },
                  HEADLINE_AT,
                );

                if (HOLD > 0) {
                  tl.to(lockup, { y: "-0.65cqh", duration: HOLD, ease: "sine.inOut" }, HOLD_START);
                }

                tl.to(
                  lockup,
                  { opacity: 0, y: "-2.1cqh", duration: OUT, ease: "power2.in" },
                  OUT_START,
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
        &#123; "id": "headline", "type": "string", "role": "content", "label": "Headline", "description": "Primary title displayed in the card.", "default": "Less, but better" &#125;,
        &#123; "id": "kicker", "type": "string", "role": "content", "label": "Kicker", "description": "Small uppercase label displayed above the headline.", "default": "DESIGN PRINCIPLE" &#125;
      ]' data-composition-duration="4" data-composition-id="titlecard-calm" data-duration="4" data-fps="30">
            
    
            <div
              id="titlecard-calm-clip"
              class="tc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="tc-lockup">
                <span class="tc-kicker"></span>
                <span class="tc-headline"></span>
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
    color: var(--fg, #f7f7f2);
    font-family: var(--font-display, "Helvetica Neue", Helvetica, Arial, sans-serif);
    pointer-events: none;
  }

  .tc-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .tc-lockup {
    display: flex;
    width: 78cqw;
    flex-direction: column;
    align-items: flex-start;
    gap: 6cqh;
    transform-origin: 50% 50%;
    will-change: transform, opacity;
  }

  .tc-kicker {
    display: block;
    width: 100%;
    color: var(--muted, #b8c0cc);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 3.2cqmin;
    font-weight: 600;
    line-height: 1;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    will-change: transform, opacity;
  }

  .tc-headline {
    display: block;
    width: 100%;
    color: var(--fg, #f7f7f2);
    font-family: var(--font-display, "Helvetica Neue", Helvetica, Arial, sans-serif);
    font-size: 17cqmin;
    font-weight: 600;
    line-height: 0.94;
    letter-spacing: -0.055em;
    overflow-wrap: anywhere;
    text-wrap: balance;
    will-change: transform, opacity;
  }
}
</style>
