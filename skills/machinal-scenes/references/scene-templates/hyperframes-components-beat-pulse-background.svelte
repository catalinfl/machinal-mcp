<!-- Modified Svelte adaptation of registry/components/beat-pulse-background/beat-pulse-background.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var pulse = root.querySelector(".bpb-pulse");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var accentTokens = {
                  green: "var(--brand, #34d399)",
                  blue: "var(--accent, #38bdf8)",
                  violet: "var(--accent-2, #a78bfa)",
                };
                var intensityLevels = {
                  subtle: { baseOpacity: 0.2, peakOpacity: 0.5, peakSaturation: 1.3 },
                  club: { baseOpacity: 0.26, peakOpacity: 0.72, peakSaturation: 1.65 },
                };
                var accent = Object.prototype.hasOwnProperty.call(accentTokens, vars.accent)
                  ? vars.accent
                  : "green";
                var intensity = vars.intensity === "club" ? "club" : "subtle";
                var level = intensityLevels[intensity];

                root.style.setProperty("--bpb-accent", accentTokens[accent]);

                var durationValue = Number(root.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var defaultBeats = "0.5,1.0,1.5,2.0,2.5,3.0,3.5";
                var beatsValue = vars.beats == null ? defaultBeats : String(vars.beats);
                var beats = beatsValue.split(",").reduce(function (result, token) {
                  var trimmed = token.trim();
                  if (trimmed === "") return result;

                  var seconds = Number(trimmed);
                  if (!Number.isFinite(seconds)) return result;

                  result.push(Math.max(0, Math.min(duration, seconds)));
                  return result;
                }, []);

                var ATTACK = 0.08;
                var DECAY = 0.36;

                gsap.set(pulse, { opacity: level.baseOpacity, "--bpb-saturation": 1 });

                var tl = gsap.timeline({ paused: true });

                beats.forEach(function (beat) {
                  tl.to(
                    pulse,
                    {
                      opacity: level.peakOpacity,
                      "--bpb-saturation": level.peakSaturation,
                      duration: ATTACK,
                      ease: "expo.out",
                    },
                    beat,
                  );
                  tl.to(
                    pulse,
                    {
                      opacity: level.baseOpacity,
                      "--bpb-saturation": 1,
                      duration: DECAY,
                      ease: "power2.in",
                    },
                    beat + ATTACK,
                  );
                });

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "beats", "type": "string", "role": "timing", "label": "Beats", "description": "Comma-separated beat times in seconds. Invalid entries are ignored and numeric values are clamped to the composition duration.", "default": "0.5,1.0,1.5,2.0,2.5,3.0,3.5" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Accent token family used by the pulsing glow.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "intensity", "type": "enum", "role": "style", "label": "Intensity", "description": "Strength of the glow and saturation pulse.", "default": "subtle", "options": [&#123; "value": "subtle", "label": "Subtle" &#125;, &#123; "value": "club", "label": "Club" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="beat-pulse-background" data-duration="4" data-fps="30">
            
    
            <div
              id="beat-pulse-background-clip"
              class="bpb-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="bpb-base"></div>
              <div class="bpb-pulse"></div>
              <div class="bpb-vignette"></div>
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
    pointer-events: none;
  }

  .bpb-clip, .bpb-base, .bpb-pulse, .bpb-vignette {
    position: absolute;
    inset: 0;
  }

  .bpb-clip {
    overflow: hidden;
  }

  .bpb-base {
    background:
      radial-gradient(
        ellipse at 50% 42%,
        color-mix(in srgb, var(--bpb-accent) 10%, var(--bg, #070a12)) 0%,
        var(--bg, #070a12) 70%
      ),
      var(--bg, #070a12);
  }

  .bpb-pulse {
    background:
      radial-gradient(
        ellipse at 24% 30%,
        color-mix(in srgb, var(--bpb-accent) 74%, transparent) 0%,
        color-mix(in srgb, var(--bpb-accent) 28%, transparent) 34%,
        transparent 66%
      ),
      radial-gradient(
        ellipse at 76% 68%,
        color-mix(in srgb, var(--bpb-accent) 60%, var(--accent-2, #a78bfa)) 0%,
        color-mix(in srgb, var(--bpb-accent) 20%, transparent) 38%,
        transparent 70%
      );
    filter: saturate(var(--bpb-saturation, 1));
    mix-blend-mode: screen;
    opacity: 0.2;
    will-change: opacity, filter;
  }

  .bpb-vignette {
    background: radial-gradient(
      ellipse at center,
      transparent 34%,
      color-mix(in srgb, var(--bg, #000000) 58%, transparent) 100%
    );
  }
}
</style>
