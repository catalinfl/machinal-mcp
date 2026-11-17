<!-- Modified Svelte adaptation of registry/components/perspective-marquee/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var tilts = { flat: "6deg", standard: "18deg", steep: "34deg" };
              var reaches = { short: 0.55, standard: 1, long: 1.8 };
              var tones = {
                ink: { bg: "#18181b", fg: "#fff" },
                paper: { bg: "#fafafa", fg: "#18181b" },
                accent: { bg: "var(--brand, #34d399)", fg: "#fff" },
              };
              var defaultWords = "COMPONENTS, PRIMITIVES, TRANSITIONS, AGENTS";

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              function parseWords(value) {
                var source = typeof value === "string" ? value : "";
                var parts = source.split(",");
                var words = [];
                for (var i = 0; i < parts.length; i += 1) {
                  var word = parts[i].trim();
                  if (word) words.push(word);
                }
                return words.length ? words : parseWords(defaultWords);
              }

              var tilt = tilts[pick(tilts, vars.tilt, "standard")];
              var reach = reaches[pick(reaches, vars.travel, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];
              var words = parseWords(vars.words);

              var roots = document.querySelectorAll(".hf-catalog-perspective-marquee");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].style.setProperty("--hf-marquee-tilt", tilt);
                roots[i].style.setProperty("--hf-marquee-reach", String(reach));
                roots[i].style.setProperty("--hf-marquee-pill-bg", tone.bg);
                roots[i].style.setProperty("--hf-marquee-pill-fg", tone.fg);

                var strip = roots[i].querySelector("div");
                if (!strip) continue;
                var markup = "";
                for (var pass = 0; pass < 2; pass += 1) {
                  for (var w = 0; w < words.length; w += 1) {
                    markup +=
                      "<span>" + words[w].replace(/&/g, "&amp;").replace(/</g, "&lt;") + "</span>";
                  }
                }
                strip.innerHTML = markup;
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;
            tl.fromTo(
              ".hf-catalog-perspective-marquee div",
              { "--hf-marquee-x": "0px" },
              { "--hf-marquee-x": "-360px", duration: 4.5, ease: "none" },
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
          data-composition-id="perspective-marquee-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-catalog-perspective-marquee"
              data-composition-variables='[
        &#123; "id": "tilt", "type": "enum", "role": "style", "label": "Tilt", "description": "How far the marquee plane leans back toward the horizon.", "default": "standard", "options": [&#123; "value": "flat", "label": "Flat" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "steep", "label": "Steep" &#125;] &#125;,
        &#123; "id": "travel", "type": "enum", "role": "motion", "label": "Travel", "description": "Scales the offset the timeline drives, so the strip covers a shorter or longer run in the same time.", "default": "standard", "options": [&#123; "value": "short", "label": "Short" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "long", "label": "Long" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Pill colour: ink for light frames, paper for dark ones, accent rides the brand token.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;,
        &#123; "id": "words", "type": "string", "role": "content", "label": "Words", "description": "Comma separated pill labels. The list is laid down twice so the strip still reads as a continuous loop.", "default": "COMPONENTS, PRIMITIVES, TRANSITIONS, AGENTS" &#125;
      ]'
            >
              <div>
                <span>COMPONENTS</span><span>PRIMITIVES</span><span>TRANSITIONS</span><span>AGENTS</span
                ><span>COMPONENTS</span><span>PRIMITIVES</span><span>TRANSITIONS</span
                ><span>AGENTS</span>
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
    display: grid;
    place-items: center;
    /* ponytail: scale on wrapper — GSAP only targets the inner div, so CSS transform is safe here */
    transform: scale(3);
  }
  .hf-catalog-perspective-marquee {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-perspective-marquee {
    width: 580px;
    perspective: 900px;
    overflow: hidden;
    transform: rotateX(18deg);
  }
  .hf-catalog-perspective-marquee div {
    display: inline-flex;
    gap: 22px;
    white-space: nowrap;
    transform: translateX(var(--hf-marquee-x, 0px));
  }
  .hf-catalog-perspective-marquee span {
    padding: 12px 18px;
    border-radius: 999px;
    background: #18181b;
    color: #fff;
    font-size: 28px;
    box-shadow: 0 18px 44px rgba(24, 24, 27, 0.18);
  }


  .hf-catalog-perspective-marquee {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-perspective-marquee {
    width: 720px;
    perspective: 900px;
    overflow: hidden;
    transform: rotateX(var(--hf-marquee-tilt, 18deg));
  }
  .hf-catalog-perspective-marquee div {
    display: inline-flex;
    gap: 22px;
    white-space: nowrap;
    transform: translateX(calc(var(--hf-marquee-x, 0px) * var(--hf-marquee-reach, 1)));
  }
  .hf-catalog-perspective-marquee span {
    padding: 12px 18px;
    border-radius: 999px;
    background: var(--hf-marquee-pill-bg, #18181b);
    color: var(--hf-marquee-pill-fg, #fff);
    font-size: 28px;
    box-shadow: 0 18px 44px rgba(24, 24, 27, 0.18);
  }
}
</style>
