<!-- Modified Svelte adaptation of registry/components/per-word-crossfade/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var drifts = { close: 0.5, standard: 1, far: 1.85 };
              var blurScales = { soft: 0.45, standard: 1, heavy: 2.2 };
              var tones = {
                ink: "#18181b",
                paper: "#fafafa",
                accent: "var(--brand, #34d399)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var drift = drifts[pick(drifts, vars.drift, "standard")];
              var blurScale = blurScales[pick(blurScales, vars.blur, "standard")];
              var tone = tones[pick(tones, vars.tone, "ink")];

              var text = typeof vars.text === "string" ? vars.text.trim() : "";
              var words = (text || "Create once reuse everywhere").split(/\s+/);

              var roots = document.querySelectorAll(".hf-catalog-per-word-crossfade");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.style.setProperty("--hf-word-drift", String(drift));
                root.style.setProperty("--hf-word-blur-scale", String(blurScale));
                root.style.setProperty("--hf-word-color", tone);

                while (root.firstChild) {
                  root.removeChild(root.firstChild);
                }
                for (var w = 0; w < words.length; w += 1) {
                  var span = document.createElement("span");
                  span.textContent = words[w];
                  root.appendChild(span);
                }
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            const startTime = 0.5;

            // outgoing phrase fades out word-by-word
            tl.to(
              ".phrase-out span",
              {
                opacity: 0,
                duration: 0.25,
                stagger: 0.055,
                ease: "power2.in",
              },
              startTime,
            );

            // incoming phrase fades in word-by-word (the named component)
            tl.fromTo(
              ".hf-catalog-per-word-crossfade span",
              { opacity: 0, "--hf-word-y": "22px", "--hf-word-scale": 0.92, "--hf-word-blur": "5px" },
              {
                opacity: 1,
                "--hf-word-y": "0px",
                "--hf-word-scale": 1,
                "--hf-word-blur": "0px",
                duration: 0.3,
                stagger: 0.055,
                ease: "power3.out",
              },
              startTime + 0.1,
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
          data-composition-id="per-word-crossfade-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            
            <div class="phrase-out">
              <span>Write</span><span>once</span><span>publish</span><span>anywhere</span>
            </div>
            
            <div
              class="hf-catalog-per-word-crossfade"
              data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Text", "description": "The line to animate. It is split on whitespace and every word gets its own span, so the stagger picks up the new words.", "default": "Create once reuse everywhere" &#125;,
        &#123; "id": "drift", "type": "enum", "role": "motion", "label": "Drift", "description": "Scales the vertical offset, so the words cover a shorter or longer run in the same time.", "default": "standard", "options": [&#123; "value": "close", "label": "Close" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "far", "label": "Far" &#125;] &#125;,
        &#123; "id": "blur", "type": "enum", "role": "style", "label": "Blur", "description": "Scales the blur radius the timeline drives, from a light haze to a full smear.", "default": "standard", "options": [&#123; "value": "soft", "label": "Soft" &#125;, &#123; "value": "standard", "label": "Standard" &#125;, &#123; "value": "heavy", "label": "Heavy" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Word colour: ink for light frames, paper for dark ones, accent rides --brand.", "default": "ink", "options": [&#123; "value": "ink", "label": "Ink" &#125;, &#123; "value": "paper", "label": "Paper" &#125;, &#123; "value": "accent", "label": "Accent" &#125;] &#125;
      ]'
            >
              <span>Create</span><span>once</span><span>reuse</span><span>everywhere</span>
            </div>
            <div class="demo-label">per-word crossfade</div>
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
    background: #fafafa;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;
    width: 1920px;
    height: 1080px;
    padding: 120px 160px;
  }
  /* outgoing phrase — static, fades out */
  .phrase-out {
    display: inline-flex;
    gap: 28px;
    font-size: 128px;
    font-weight: 900;
    letter-spacing: -0.04em;
    line-height: 1;
    color: #71717a;
    font-family: Inter, system-ui, sans-serif;
    position: relative;
  }
  .phrase-out span {
    display: inline-block;
    will-change: opacity;
  }
  /* incoming phrase — the GSAP-animated element */
  .hf-catalog-per-word-crossfade {
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-per-word-crossfade {
    display: inline-flex;
    gap: 28px;
    font-size: 128px;
    line-height: 1;
  }
  .hf-catalog-per-word-crossfade span {
    display: inline-block;
    transform: translate(var(--hf-word-x, 0px), var(--hf-word-y, 0px))
    scale(var(--hf-word-scale, 1));
    filter: blur(var(--hf-word-blur, 0px));
    will-change: transform, filter, opacity;
  }
  /* label */
  .demo-label {
    font-size: 26px;
    font-weight: 500;
    color: #a1a1aa;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    margin-top: 24px;
  }


  .hf-catalog-per-word-crossfade {
    color: var(--hf-word-color, #18181b);
    font-family: Inter, system-ui, sans-serif;
    font-weight: 900;
    letter-spacing: -0.04em;
  }
  .hf-catalog-per-word-crossfade {
    display: inline-flex;
    gap: 12px;
    font-size: 56px;
    line-height: 1;
  }
  .hf-catalog-per-word-crossfade span {
    display: inline-block;
    transform: translate(
      var(--hf-word-x, 0px),
      calc(var(--hf-word-y, 0px) * var(--hf-word-drift, 1))
    )
    scale(var(--hf-word-scale, 1));
    filter: blur(calc(var(--hf-word-blur, 0px) * var(--hf-word-blur-scale, 1)));
    will-change: transform, filter, opacity;
  }
}
</style>
