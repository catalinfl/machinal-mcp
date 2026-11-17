<!-- Modified Svelte adaptation of registry/components/number-wheel/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              const vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              // Unrecognised overrides return to their declared defaults.
              const spins = { single: 0, double: 1, triple: 2 };
              const gaps = { tight: "0em", standard: "0.02em", wide: "0.14em" };
              const tones = {
                inherit: "inherit",
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };
              const pick = (table, value, fallback) =>
                Object.prototype.hasOwnProperty.call(table, value) ? table[value] : table[fallback];

              const cycles = pick(spins, vars.spin, "single");
              const gap = pick(gaps, vars.spacing, "standard");
              const tone = pick(tones, vars.tone, "inherit");

              document.querySelectorAll(".hf-number-wheel").forEach((el) => {
                if (el.dataset.hfNumberWheelReady === "1") return;
                el.style.setProperty("--hf-wheel-gap", gap);
                el.style.setProperty("--hf-wheel-color", tone);
                const value = el.dataset.value || "0";
                el.textContent = "";
                for (const char of value) {
                  if (!/\d/.test(char)) {
                    el.append(document.createTextNode(char));
                    continue;
                  }
                  const stops = cycles * 10 + Number(char);
                  const frame = document.createElement("span");
                  frame.className = "hf-number-wheel-digit";
                  const strip = document.createElement("span");
                  strip.className = "hf-number-wheel-strip";
                  strip.style.setProperty("--hf-number-target-y", `${-stops}em`);
                  for (let i = 0; i <= stops; i++) {
                    const step = document.createElement("span");
                    step.textContent = String(i % 10);
                    strip.appendChild(step);
                  }
                  frame.appendChild(strip);
                  el.appendChild(frame);
                }
                el.dataset.hfNumberWheelReady = "1";
              });
            })();
          

            document.querySelectorAll(".hf-number-wheel").forEach((el) => {
              const value = el.dataset.value || "0";
              el.textContent = "";
              for (const char of value) {
                if (!/\d/.test(char)) {
                  el.append(document.createTextNode(char));
                  continue;
                }
                const digit = Number(char);
                const frame = document.createElement("span");
                frame.className = "hf-number-wheel-digit";
                const strip = document.createElement("span");
                strip.className = "hf-number-wheel-strip";
                strip.style.setProperty("--hf-number-target-y", `${-digit}em`);
                for (let i = 0; i <= digit; i++) {
                  const step = document.createElement("span");
                  step.textContent = String(i);
                  strip.appendChild(step);
                }
                frame.appendChild(strip);
                el.appendChild(frame);
              }
            });
            const tl = gsap.timeline({ paused: true });
            tl.from(".label", { opacity: 0, y: 18, duration: 0.5, ease: "power3.out" }, 0.2);
            tl.to(
              ".hf-number-wheel-strip",
              {
                y: (_, strip) => strip.style.getPropertyValue("--hf-number-target-y"),
                duration: 1.2,
                ease: "power3.out",
                stagger: 0.06,
              },
              0.65,
            );
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="number-wheel-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
          data-composition-variables='[
        &#123; "id": "spin", "type": "enum", "role": "motion", "label": "Spin", "description": "How many full 0 to 9 revolutions each column adds before it lands, which is how far the reel travels in the same time.", "default": "single", "options": [&#123; "value": "single", "label": "Single" &#125;, &#123; "value": "double", "label": "Double" &#125;, &#123; "value": "triple", "label": "Triple" &#125;] &#125;,
        &#123; "id": "spacing", "type": "enum", "role": "layout", "label": "Spacing", "description": "Gap between the digit columns.", "default": "standard", "options": [&#123; "value": "tight", "label": "Tight" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "wide", "label": "Wide" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Digit colour: inherit keeps the surrounding text colour, ink suits light frames, paper suits dark ones, accent rides --brand.", "default": "inherit", "options": [&#123; "value": "inherit", "label": "Inherit" &#125;, &#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
        >
          <div class="metric">
            <div class="label">GitHub stars</div>
            <span class="hf-number-wheel" data-value="30222"></span>
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
    background: #071b16;
    color: #ecfff8;
    font-family: Inter, system-ui, sans-serif;
  }
  .metric {
    text-align: center;
    /* ponytail: zoom scales the non-animated wrapper; GSAP owns .label and .hf-number-wheel-strip transforms */
    zoom: 2.8;
  }
  .label {
    color: #68d8b5;
    font-size: 38px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }
  .hf-number-wheel {
    margin-top: 36px;
    display: inline-flex;
    align-items: baseline;
    gap: 0.02em;
    font-size: 172px;
    font-weight: 900;
    font-variant-numeric: tabular-nums;
  }
  .hf-number-wheel-digit {
    display: inline-block;
    height: 1em;
    overflow: hidden;
  }
  .hf-number-wheel-strip {
    display: grid;
    transform: translateY(0em);
    will-change: transform;
  }
  .hf-number-wheel-strip span {
    height: 1em;
    line-height: 1em;
  }


  .hf-number-wheel {
    display: inline-flex;
    align-items: baseline;
    gap: var(--hf-wheel-gap, 0.02em);
    color: var(--hf-wheel-color, inherit);
    font-variant-numeric: tabular-nums;
  }
  .hf-number-wheel-digit {
    display: inline-block;
    height: 1em;
    overflow: hidden;
  }
  .hf-number-wheel-strip {
    display: grid;
    transform: translateY(0em);
    will-change: transform;
  }
  .hf-number-wheel-strip span {
    height: 1em;
    line-height: 1em;
  }
}
</style>
