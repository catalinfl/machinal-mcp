<!-- Modified Svelte adaptation of registry/components/avatar-group-hover/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              // Unrecognised overrides return to their declared defaults.
              var sizes = { small: 42, standard: 54, large: 70 };
              var fonts = { small: "0.8em", standard: "1em", large: "1.3em" };
              // Overlap is a share of the diameter, so the two knobs stay independent.
              var overlaps = { tight: 0.5, standard: 1 / 3, loose: 0.12 };
              var accents = { blue: "#0ea5e9", violet: "#a78bfa", green: "#34d399" };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var sizeName = pick(sizes, vars.size, "standard");
              var overlapName = pick(overlaps, vars.overlap, "standard");
              var accent = accents[pick(accents, vars.accent, "blue")];
              var diameter = sizes[sizeName];
              var overlap = Math.round(diameter * overlaps[overlapName]);

              var roots = document.querySelectorAll(".hf-transition-avatar-group-hover");
              for (var i = 0; i < roots.length; i += 1) {
                var style = roots[i].style;
                style.setProperty("--hf-avatar-size", diameter + "px");
                style.setProperty("--hf-avatar-font", fonts[sizeName]);
                style.setProperty("--hf-avatar-overlap", overlap + "px");
                style.setProperty("--hf-avatar-accent", accent);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.to(
              ".hf-transition-avatar-group-hover span",
              {
                "--hf-avatar-y": "-18px",
                duration: 0.28,
                stagger: { each: 0.035, from: "center" },
                ease: "back.out(1.8)",
              },
              startTime,
            );
            tl.to(
              ".hf-transition-avatar-group-hover span",
              {
                "--hf-avatar-y": "0px",
                duration: 0.42,
                stagger: { each: 0.035, from: "center" },
                ease: "bounce.out",
              },
              startTime + 0.36,
            );
            tl.set({}, {}, 5);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="avatar-group-hover-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-avatar-group-hover"
              data-composition-variables='[
        &#123; "id": "size", "type": "enum", "role": "style", "label": "Size", "description": "Avatar diameter, with the initials scaling alongside it.", "default": "standard", "options": [&#123; "value": "small", "label": "Small" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "large", "label": "Large" &#125;] &#125;,
        &#123; "id": "overlap", "type": "enum", "role": "style", "label": "Overlap", "description": "How far each avatar tucks under the one before it, as a share of its own diameter.", "default": "standard", "options": [&#123; "value": "tight", "label": "Tight" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "loose", "label": "Loose" &#125;] &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Colour the avatar gradient resolves into.", "default": "blue", "options": [&#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;, &#123; "value": "green", "label": "Green" &#125;] &#125;
      ]'
            >
              <span>A</span><span>B</span><span>C</span><span>D</span>
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
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #demo {
    width: 1920px;
    height: 1080px;
    display: grid;
    place-items: center;
    background: #f7f7f8;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale-only fix — GSAP animates the spans inside, not this wrapper */
    transform: scale(3.5);
  }
  .hf-transition-avatar-group-hover {
    display: inline-flex;
    align-items: center;
    padding-left: 18px;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-avatar-group-hover span {
    display: grid;
    place-items: center;
    width: 54px;
    height: 54px;
    margin-left: -18px;
    border: 3px solid #fff;
    border-radius: 999px;
    background: linear-gradient(135deg, #111827, #0ea5e9);
    color: #fff;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.01em;
    box-shadow: 0 12px 30px rgba(24, 24, 27, 0.18);
    transform: translateY(var(--hf-avatar-y, 0px));
  }


  .hf-transition-avatar-group-hover {
    display: inline-flex;
    align-items: center;
    padding-left: var(--hf-avatar-overlap, 18px);
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-avatar-group-hover span {
    display: grid;
    place-items: center;
    width: var(--hf-avatar-size, 54px);
    height: var(--hf-avatar-size, 54px);
    margin-left: calc(-1 * var(--hf-avatar-overlap, 18px));
    border: 3px solid #fff;
    border-radius: 999px;
    background: linear-gradient(135deg, #111827, var(--hf-avatar-accent, #0ea5e9));
    color: #fff;
    font-size: var(--hf-avatar-font, 1em);
    font-weight: 900;
    box-shadow: 0 12px 30px rgba(24, 24, 27, 0.18);
    transform: translateY(var(--hf-avatar-y, 0px));
  }
}
</style>
