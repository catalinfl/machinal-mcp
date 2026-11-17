<!-- Modified Svelte adaptation of registry/components/slot-machine-roll/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var directions = { up: 1, down: -1 };
              var sizes = { small: 48, standard: 74, large: 104 };
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };

              var dir = directions[pick(directions, vars.direction, "up")];
              var row = sizes[pick(sizes, vars.size, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];
              var result = (typeof vars.result === "string" ? vars.result : "").replace(/\s+/g, "");
              if (result.length === 0) result = "A7K";

              var roots = document.querySelectorAll(".hf-catalog-slot-machine-roll");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-slot-row", row + "px");
                root.style.setProperty("--hf-slot-gain", String(row / 74));
                root.style.setProperty("--hf-slot-dir", String(dir));
                // Rolling down starts one row up, so the zero still sits in frame at rest.
                root.style.setProperty("--hf-slot-base", (dir === 1 ? 0 : -row) + "px");
                root.style.setProperty("--hf-slot-color", tone);
                root.textContent = "";
                for (var j = 0; j < result.length; j += 1) {
                  var reel = document.createElement("i");
                  reel.appendChild(document.createTextNode(dir === 1 ? "0" : result.charAt(j)));
                  reel.appendChild(document.createElement("br"));
                  reel.appendChild(document.createTextNode(dir === 1 ? result.charAt(j) : "0"));
                  var slot = document.createElement("span");
                  slot.appendChild(reel);
                  root.appendChild(slot);
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-slot-machine-roll i",
              { "--hf-slot-y": "0px" },
              { "--hf-slot-y": "-74px", duration: 0.52, stagger: 0.06, ease: "power3.inOut" },
              startTime,
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
          data-composition-id="slot-machine-roll-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div class="slot-card">
              <div class="slot-label">Slot Machine Roll</div>
              <div
                class="hf-catalog-slot-machine-roll"
                data-composition-variables='[
        &#123; "id": "result", "type": "string", "role": "content", "label": "Result", "description": "Characters the reels land on, one reel column per character. Whitespace is stripped and every reel starts on a zero.", "default": "A7K" &#125;,
        &#123; "id": "direction", "type": "enum", "role": "motion", "label": "Direction", "description": "Which way the reels roll: up lifts the zero out through the top, down drops it out through the bottom.", "default": "up", "options": [&#123; "value": "up", "label": "Up" &#125;, &#123; "value": "down", "label": "Down" &#125;] &#125;,
        &#123; "id": "size", "type": "enum", "role": "layout", "label": "Size", "description": "Reel height and type size. The roll distance scales with it so the reel always lands exactly one row on.", "default": "standard", "options": [&#123; "value": "small", "label": "Small" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "large", "label": "Large" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Character colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
              >
                <span
                  ><i>0<br />A</i></span
                ><span
                  ><i>0<br />7</i></span
                ><span
                  ><i>0<br />K</i></span
                >
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
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
    /* ponytail: scale on non-GSAP wrapper — safe, GSAP only animates --hf-slot-y on inner <i> */
    transform: scale(1.85);
    transform-origin: center center;
  }
  .slot-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    background: #ffffff;
    border: 1px solid #e4e4e7;
    border-radius: 14px;
    padding: 40px 56px;
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.1);
  }
  .slot-label {
    font-family: Inter, system-ui, sans-serif;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #71717a;
  }
  .hf-catalog-slot-machine-roll {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-slot-machine-roll {
    display: inline-flex;
    gap: 6px;
    height: 74px;
    overflow: hidden;
    font:
      900 74px/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .hf-catalog-slot-machine-roll span {
    display: block;
    height: 74px;
    overflow: hidden;
  }
  .hf-catalog-slot-machine-roll i {
    display: block;
    font-style: normal;
    transform: translateY(var(--hf-slot-y, 0px));
  }


  .hf-catalog-slot-machine-roll {
    color: var(--hf-slot-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-slot-machine-roll {
    display: inline-flex;
    gap: 6px;
    height: var(--hf-slot-row, 74px);
    overflow: hidden;
    font:
      900 var(--hf-slot-row, 74px)/1 ui-monospace,
      SFMono-Regular,
      Menlo,
      monospace;
  }
  .hf-catalog-slot-machine-roll span {
    display: block;
    height: var(--hf-slot-row, 74px);
    overflow: hidden;
  }
  .hf-catalog-slot-machine-roll i {
    display: block;
    font-style: normal;
    transform: translateY(
      calc(
        var(--hf-slot-base, 0px) + var(--hf-slot-y, 0px) * var(--hf-slot-dir, 1) *
        var(--hf-slot-gain, 1)
      )
    );
  }
}
</style>
