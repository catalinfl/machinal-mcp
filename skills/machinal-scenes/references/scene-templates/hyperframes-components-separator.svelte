<!-- Modified Svelte adaptation of registry/components/separator/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
              var orientations = { horizontal: true, vertical: true };
              var thicknesses = { hairline: "1px", medium: "2px", bold: "4px" };
              var tones = {
                neutral: "var(--_hf-ui-control-border)",
                accent: "var(--_hf-ui-accent)",
                warning: "var(--_hf-ui-warning)",
              };

              function pick(table, value, fallback) {
                return Object.prototype.hasOwnProperty.call(table, value) ? value : fallback;
              }

              var orientation = pick(orientations, vars.orientation, "horizontal");
              var thickness = thicknesses[pick(thicknesses, vars.thickness, "hairline")];
              var tone = tones[pick(tones, vars.tone, "neutral")];

              var roots = document.querySelectorAll(".hf-ui-separator");
              for (var i = 0; i < roots.length; i += 1) {
                roots[i].setAttribute("data-orientation", orientation);
                roots[i].setAttribute("aria-orientation", orientation);
                roots[i].style.setProperty("--hf-separator-thickness", thickness);
                roots[i].style.setProperty("--hf-separator-fill", tone);
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.addLabel("start", 0);
            tl.set(".hf-ui-demo-stage", { opacity: 1 }, 0);
            tl.set(".hf-ui-separator", { "--hf-separator-progress": 0, immediateRender: true }, 0);
            tl.to(
              ".hf-ui-separator",
              { "--hf-separator-progress": 1, duration: 0.42, ease: "power3.out" },
              0.6,
            );
            tl.addLabel("end", 3.99);
            tl.to(".hf-ui-demo-stage", { opacity: 1, duration: 0.01 }, 3.99);
            
            __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0a0a0a">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <main
          class="hf-ui-demo-canvas"
          data-composition-id="separator-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="4"
          data-hf-rendering="true"
          data-hf-theme="dark"
        >
          
          <section class="hf-ui-demo-stage" aria-label="Separator specimen" inert>
            
    
    
    <div data-hf-ui-root class="hf-ui-separator" role="separator" aria-orientation="horizontal" data-composition-variables='[
        &#123; "id": "orientation", "type": "enum", "role": "layout", "label": "Orientation", "description": "Which way the rule runs, and so which way the reveal travels.", "default": "horizontal", "options": [&#123; "value": "horizontal", "label": "Horizontal" &#125;, &#123; "value": "vertical", "label": "Vertical" &#125;] &#125;,
        &#123; "id": "thickness", "type": "enum", "role": "style", "label": "Thickness", "description": "Size of the rule across its short edge, from a 1px hairline to a 4px bar.", "default": "hairline", "options": [&#123; "value": "hairline", "label": "Hairline" &#125;, &#123; "value": "medium", "label": "Medium" &#125;, &#123; "value": "bold", "label": "Bold" &#125;] &#125;,
        &#123; "id": "tone", "type": "enum", "role": "style", "label": "Tone", "description": "Colour of the revealed fill: neutral grey, the theme accent, or the warning hue.", "default": "neutral", "options": [&#123; "value": "neutral", "label": "Neutral" &#125;, &#123; "value": "accent", "label": "Accent" &#125;, &#123; "value": "warning", "label": "Warning" &#125;] &#125;
      ]'>
      <span></span>
    </div>
    
    
    
    
    
          </section>
          <p class="hf-ui-demo-caption">Separator</p>
          
          
        </main>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  .hf-port {
    background: #0a0a0a;
  }
  .hf-ui-demo-canvas {
    width: 1920px;
    height: 1080px;
    box-sizing: border-box;
    display: grid;
    grid-template-rows: 1fr auto;
    place-items: center;
    padding: 96px;
    background: #0a0a0a;
    color: #e5e5e5;
    font-family:
      ui-sans-serif,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;
  }
  .hf-ui-demo-stage {
    display: grid;
    place-items: center;
    width: min(720px, 100%);
    min-width: 0;
    max-width: 100%;
  }
  .hf-ui-demo-caption {
    justify-self: start;
    color: #929292;
    font:
      500 18px/1.4 ui-monospace,
      "SFMono-Regular",
      Menlo,
      Consolas,
      monospace;
    letter-spacing: 0.01em;
  }


  /* hf-ui:tokens:start */
  /* prettier-ignore */
  [data-hf-ui-root] {
    --_hf-ui-accent: var(--hf-ui-accent, #3ce6ac);
    --_hf-ui-action: var(--hf-ui-action, #eeeeee);
    --_hf-ui-action-contrast: var(--hf-ui-action-contrast, #111111);
    --_hf-ui-border: var(--hf-ui-border, #2a2a2a);
    --_hf-ui-border-strong: var(--hf-ui-border-strong, #383838);
    --_hf-ui-canvas: var(--hf-ui-canvas, #0a0a0a);
    --_hf-ui-control-border: var(--hf-ui-control-border, #686868);
    --_hf-ui-control-border-hover: var(--hf-ui-control-border-hover, #777777);
    --_hf-ui-control-height: var(--hf-ui-control-height, 40px);
    --_hf-ui-danger: var(--hf-ui-danger, #ff7878);
    --_hf-ui-data-1: var(--hf-ui-data-1, #3ce6ac);
    --_hf-ui-data-2: var(--hf-ui-data-2, #63a5ff);
    --_hf-ui-data-3: var(--hf-ui-data-3, #e9ab55);
    --_hf-ui-data-4: var(--hf-ui-data-4, #a78bfa);
    --_hf-ui-data-5: var(--hf-ui-data-5, #ff8a75);
    --_hf-ui-duration-drawer-enter: var(--hf-ui-duration-drawer-enter, 360ms);
    --_hf-ui-duration-drawer-exit: var(--hf-ui-duration-drawer-exit, 240ms);
    --_hf-ui-duration-modal-enter: var(--hf-ui-duration-modal-enter, 280ms);
    --_hf-ui-duration-modal-exit: var(--hf-ui-duration-modal-exit, 180ms);
    --_hf-ui-duration-overlay-enter: var(--hf-ui-duration-overlay-enter, 210ms);
    --_hf-ui-duration-overlay-exit: var(--hf-ui-duration-overlay-exit, 140ms);
    --_hf-ui-duration-press: var(--hf-ui-duration-press, 120ms);
    --_hf-ui-duration-state: var(--hf-ui-duration-state, 160ms);
    --_hf-ui-ease-enter: var(--hf-ui-ease-enter, cubic-bezier(0.32, 0.72, 0, 1));
    --_hf-ui-ease-exit: var(--hf-ui-ease-exit, cubic-bezier(0.23, 1, 0.32, 1));
    --_hf-ui-ease-response: var(--hf-ui-ease-response, cubic-bezier(0.23, 1, 0.32, 1));
    --_hf-ui-font-mono: var(--hf-ui-font-mono, ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace);
    --_hf-ui-font-sans: var(--hf-ui-font-sans, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    --_hf-ui-hit-target: var(--hf-ui-hit-target, 44px);
    --_hf-ui-radius-control: var(--hf-ui-radius-control, 5px);
    --_hf-ui-radius-overlay: var(--hf-ui-radius-overlay, 10px);
    --_hf-ui-radius-surface: var(--hf-ui-radius-surface, 7px);
    --_hf-ui-shadow-contact: var(--hf-ui-shadow-contact, 0 8px 18px rgba(0, 0, 0, 0.38));
    --_hf-ui-shadow-inset: var(--hf-ui-shadow-inset, inset 0 1px 0 rgba(255, 255, 255, 0.035));
    --_hf-ui-shadow-modal: var(--hf-ui-shadow-modal, 0 18px 46px rgba(0, 0, 0, 0.52));
    --_hf-ui-space-1: var(--hf-ui-space-1, 4px);
    --_hf-ui-space-12: var(--hf-ui-space-12, 48px);
    --_hf-ui-space-16: var(--hf-ui-space-16, 64px);
    --_hf-ui-space-2: var(--hf-ui-space-2, 8px);
    --_hf-ui-space-3: var(--hf-ui-space-3, 12px);
    --_hf-ui-space-4: var(--hf-ui-space-4, 16px);
    --_hf-ui-space-6: var(--hf-ui-space-6, 24px);
    --_hf-ui-space-8: var(--hf-ui-space-8, 32px);
    --_hf-ui-surface: var(--hf-ui-surface, #141414);
    --_hf-ui-surface-inset: var(--hf-ui-surface-inset, #101010);
    --_hf-ui-surface-raised: var(--hf-ui-surface-raised, #1a1a1a);
    --_hf-ui-text: var(--hf-ui-text, #e5e5e5);
    --_hf-ui-text-faint: var(--hf-ui-text-faint, #7e7e7e);
    --_hf-ui-text-muted: var(--hf-ui-text-muted, #929292);
    --_hf-ui-text-strong: var(--hf-ui-text-strong, #f3f3f3);
    --_hf-ui-warning: var(--hf-ui-warning, #e9ab55);
    --_hf-ui-weight-medium: var(--hf-ui-weight-medium, 500);
    --_hf-ui-weight-regular: var(--hf-ui-weight-regular, 400);
    --_hf-ui-weight-semibold: var(--hf-ui-weight-semibold, 600);
    box-sizing: border-box;
    color-scheme: dark;
    font-family: var(--_hf-ui-font-sans);
  }
  /* prettier-ignore */
  [data-hf-ui-root] *, [data-hf-ui-root] *::before, [data-hf-ui-root] *::after {
    box-sizing: border-box;
  }
  /* prettier-ignore */
  [data-hf-theme="light"] [data-hf-ui-root], [data-hf-ui-root][data-hf-theme="light"] {
    --_hf-ui-accent: var(--hf-ui-accent, #087a57);
    --_hf-ui-action: var(--hf-ui-action, #171717);
    --_hf-ui-action-contrast: var(--hf-ui-action-contrast, #ffffff);
    --_hf-ui-border: var(--hf-ui-border, #e0dfdb);
    --_hf-ui-border-strong: var(--hf-ui-border-strong, #cbc9c3);
    --_hf-ui-canvas: var(--hf-ui-canvas, #f6f5f1);
    --_hf-ui-control-border: var(--hf-ui-control-border, #888888);
    --_hf-ui-control-border-hover: var(--hf-ui-control-border-hover, #6f6e68);
    --_hf-ui-danger: var(--hf-ui-danger, #a61b1b);
    --_hf-ui-data-1: var(--hf-ui-data-1, #087a57);
    --_hf-ui-data-2: var(--hf-ui-data-2, #245ea8);
    --_hf-ui-data-3: var(--hf-ui-data-3, #8a4b00);
    --_hf-ui-data-4: var(--hf-ui-data-4, #6d3fc0);
    --_hf-ui-data-5: var(--hf-ui-data-5, #a83d2d);
    --_hf-ui-shadow-contact: var(--hf-ui-shadow-contact, 0 7px 16px rgba(26, 24, 20, 0.13));
    --_hf-ui-shadow-inset: var(--hf-ui-shadow-inset, inset 0 1px 0 rgba(255, 255, 255, 0.78));
    --_hf-ui-shadow-modal: var(--hf-ui-shadow-modal, 0 18px 46px rgba(26, 24, 20, 0.18));
    --_hf-ui-surface: var(--hf-ui-surface, #ffffff);
    --_hf-ui-surface-inset: var(--hf-ui-surface-inset, #f0efeb);
    --_hf-ui-surface-raised: var(--hf-ui-surface-raised, #ffffff);
    --_hf-ui-text: var(--hf-ui-text, #171717);
    --_hf-ui-text-faint: var(--hf-ui-text-faint, #6f6e68);
    --_hf-ui-text-muted: var(--hf-ui-text-muted, #5f5f5a);
    --_hf-ui-text-strong: var(--hf-ui-text-strong, #0a0a0a);
    --_hf-ui-warning: var(--hf-ui-warning, #8a4b00);
    color-scheme: light;
  }
  /* prettier-ignore */
  [data-hf-ui-root]:focus-visible {
    outline: 2px solid var(--_hf-ui-accent);
    outline-offset: 3px;
  }
  /* prettier-ignore */
  [data-hf-rendering="true"][data-hf-ui-root], [data-hf-rendering="true"] [data-hf-ui-root], [data-hf-rendering="true"][data-hf-ui-root] *, [data-hf-rendering="true"] [data-hf-ui-root] *, [data-hf-rendering="true"][data-hf-ui-root]::before, [data-hf-rendering="true"][data-hf-ui-root]::after, [data-hf-rendering="true"] [data-hf-ui-root]::before, [data-hf-rendering="true"] [data-hf-ui-root]::after, [data-hf-rendering="true"][data-hf-ui-root] *::before, [data-hf-rendering="true"][data-hf-ui-root] *::after, [data-hf-rendering="true"] [data-hf-ui-root] *::before, [data-hf-rendering="true"] [data-hf-ui-root] *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  /* prettier-ignore */
  @media (prefers-reduced-motion: reduce) {
    [data-hf-ui-root], [data-hf-ui-root] *, [data-hf-ui-root] *::before, [data-hf-ui-root] *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
  }
  /* hf-ui:tokens:end */
  .hf-ui-separator {
    --hf-separator-progress: 1;
    width: min(360px, 100%);
    height: 1px;
    background: var(--_hf-ui-border);
    overflow: hidden;
  }
  .hf-ui-separator span {
    display: block;
    width: calc(var(--hf-separator-progress) * 100%);
    height: 100%;
    background: var(--_hf-ui-control-border);
    transform-origin: left center;
  }
  .hf-ui-separator[data-orientation="vertical"] {
    width: 1px;
    height: 180px;
  }


  /* hf-ui:tokens:start */
  /* prettier-ignore */
  [data-hf-ui-root] {
    --_hf-ui-accent: var(--hf-ui-accent, #3ce6ac);
    --_hf-ui-action: var(--hf-ui-action, #eeeeee);
    --_hf-ui-action-contrast: var(--hf-ui-action-contrast, #111111);
    --_hf-ui-border: var(--hf-ui-border, #2a2a2a);
    --_hf-ui-border-strong: var(--hf-ui-border-strong, #383838);
    --_hf-ui-canvas: var(--hf-ui-canvas, #0a0a0a);
    --_hf-ui-control-border: var(--hf-ui-control-border, #686868);
    --_hf-ui-control-border-hover: var(--hf-ui-control-border-hover, #777777);
    --_hf-ui-control-height: var(--hf-ui-control-height, 40px);
    --_hf-ui-danger: var(--hf-ui-danger, #ff7878);
    --_hf-ui-data-1: var(--hf-ui-data-1, #3ce6ac);
    --_hf-ui-data-2: var(--hf-ui-data-2, #63a5ff);
    --_hf-ui-data-3: var(--hf-ui-data-3, #e9ab55);
    --_hf-ui-data-4: var(--hf-ui-data-4, #a78bfa);
    --_hf-ui-data-5: var(--hf-ui-data-5, #ff8a75);
    --_hf-ui-duration-drawer-enter: var(--hf-ui-duration-drawer-enter, 360ms);
    --_hf-ui-duration-drawer-exit: var(--hf-ui-duration-drawer-exit, 240ms);
    --_hf-ui-duration-modal-enter: var(--hf-ui-duration-modal-enter, 280ms);
    --_hf-ui-duration-modal-exit: var(--hf-ui-duration-modal-exit, 180ms);
    --_hf-ui-duration-overlay-enter: var(--hf-ui-duration-overlay-enter, 210ms);
    --_hf-ui-duration-overlay-exit: var(--hf-ui-duration-overlay-exit, 140ms);
    --_hf-ui-duration-press: var(--hf-ui-duration-press, 120ms);
    --_hf-ui-duration-state: var(--hf-ui-duration-state, 160ms);
    --_hf-ui-ease-enter: var(--hf-ui-ease-enter, cubic-bezier(0.32, 0.72, 0, 1));
    --_hf-ui-ease-exit: var(--hf-ui-ease-exit, cubic-bezier(0.23, 1, 0.32, 1));
    --_hf-ui-ease-response: var(--hf-ui-ease-response, cubic-bezier(0.23, 1, 0.32, 1));
    --_hf-ui-font-mono: var(--hf-ui-font-mono, ui-monospace, "SFMono-Regular", Menlo, Consolas, monospace);
    --_hf-ui-font-sans: var(--hf-ui-font-sans, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
    --_hf-ui-hit-target: var(--hf-ui-hit-target, 44px);
    --_hf-ui-radius-control: var(--hf-ui-radius-control, 5px);
    --_hf-ui-radius-overlay: var(--hf-ui-radius-overlay, 10px);
    --_hf-ui-radius-surface: var(--hf-ui-radius-surface, 7px);
    --_hf-ui-shadow-contact: var(--hf-ui-shadow-contact, 0 8px 18px rgba(0, 0, 0, 0.38));
    --_hf-ui-shadow-inset: var(--hf-ui-shadow-inset, inset 0 1px 0 rgba(255, 255, 255, 0.035));
    --_hf-ui-shadow-modal: var(--hf-ui-shadow-modal, 0 18px 46px rgba(0, 0, 0, 0.52));
    --_hf-ui-space-1: var(--hf-ui-space-1, 4px);
    --_hf-ui-space-12: var(--hf-ui-space-12, 48px);
    --_hf-ui-space-16: var(--hf-ui-space-16, 64px);
    --_hf-ui-space-2: var(--hf-ui-space-2, 8px);
    --_hf-ui-space-3: var(--hf-ui-space-3, 12px);
    --_hf-ui-space-4: var(--hf-ui-space-4, 16px);
    --_hf-ui-space-6: var(--hf-ui-space-6, 24px);
    --_hf-ui-space-8: var(--hf-ui-space-8, 32px);
    --_hf-ui-surface: var(--hf-ui-surface, #141414);
    --_hf-ui-surface-inset: var(--hf-ui-surface-inset, #101010);
    --_hf-ui-surface-raised: var(--hf-ui-surface-raised, #1a1a1a);
    --_hf-ui-text: var(--hf-ui-text, #e5e5e5);
    --_hf-ui-text-faint: var(--hf-ui-text-faint, #7e7e7e);
    --_hf-ui-text-muted: var(--hf-ui-text-muted, #929292);
    --_hf-ui-text-strong: var(--hf-ui-text-strong, #f3f3f3);
    --_hf-ui-warning: var(--hf-ui-warning, #e9ab55);
    --_hf-ui-weight-medium: var(--hf-ui-weight-medium, 500);
    --_hf-ui-weight-regular: var(--hf-ui-weight-regular, 400);
    --_hf-ui-weight-semibold: var(--hf-ui-weight-semibold, 600);
    box-sizing: border-box;
    color-scheme: dark;
    font-family: var(--_hf-ui-font-sans);
  }
  /* prettier-ignore */
  [data-hf-ui-root] *, [data-hf-ui-root] *::before, [data-hf-ui-root] *::after {
    box-sizing: border-box;
  }
  /* prettier-ignore */
  [data-hf-theme="light"] [data-hf-ui-root], [data-hf-ui-root][data-hf-theme="light"] {
    --_hf-ui-accent: var(--hf-ui-accent, #087a57);
    --_hf-ui-action: var(--hf-ui-action, #171717);
    --_hf-ui-action-contrast: var(--hf-ui-action-contrast, #ffffff);
    --_hf-ui-border: var(--hf-ui-border, #e0dfdb);
    --_hf-ui-border-strong: var(--hf-ui-border-strong, #cbc9c3);
    --_hf-ui-canvas: var(--hf-ui-canvas, #f6f5f1);
    --_hf-ui-control-border: var(--hf-ui-control-border, #888888);
    --_hf-ui-control-border-hover: var(--hf-ui-control-border-hover, #6f6e68);
    --_hf-ui-danger: var(--hf-ui-danger, #a61b1b);
    --_hf-ui-data-1: var(--hf-ui-data-1, #087a57);
    --_hf-ui-data-2: var(--hf-ui-data-2, #245ea8);
    --_hf-ui-data-3: var(--hf-ui-data-3, #8a4b00);
    --_hf-ui-data-4: var(--hf-ui-data-4, #6d3fc0);
    --_hf-ui-data-5: var(--hf-ui-data-5, #a83d2d);
    --_hf-ui-shadow-contact: var(--hf-ui-shadow-contact, 0 7px 16px rgba(26, 24, 20, 0.13));
    --_hf-ui-shadow-inset: var(--hf-ui-shadow-inset, inset 0 1px 0 rgba(255, 255, 255, 0.78));
    --_hf-ui-shadow-modal: var(--hf-ui-shadow-modal, 0 18px 46px rgba(26, 24, 20, 0.18));
    --_hf-ui-surface: var(--hf-ui-surface, #ffffff);
    --_hf-ui-surface-inset: var(--hf-ui-surface-inset, #f0efeb);
    --_hf-ui-surface-raised: var(--hf-ui-surface-raised, #ffffff);
    --_hf-ui-text: var(--hf-ui-text, #171717);
    --_hf-ui-text-faint: var(--hf-ui-text-faint, #6f6e68);
    --_hf-ui-text-muted: var(--hf-ui-text-muted, #5f5f5a);
    --_hf-ui-text-strong: var(--hf-ui-text-strong, #0a0a0a);
    --_hf-ui-warning: var(--hf-ui-warning, #8a4b00);
    color-scheme: light;
  }
  /* prettier-ignore */
  [data-hf-ui-root]:focus-visible {
    outline: 2px solid var(--_hf-ui-accent);
    outline-offset: 3px;
  }
  /* prettier-ignore */
  [data-hf-rendering="true"][data-hf-ui-root], [data-hf-rendering="true"] [data-hf-ui-root], [data-hf-rendering="true"][data-hf-ui-root] *, [data-hf-rendering="true"] [data-hf-ui-root] *, [data-hf-rendering="true"][data-hf-ui-root]::before, [data-hf-rendering="true"][data-hf-ui-root]::after, [data-hf-rendering="true"] [data-hf-ui-root]::before, [data-hf-rendering="true"] [data-hf-ui-root]::after, [data-hf-rendering="true"][data-hf-ui-root] *::before, [data-hf-rendering="true"][data-hf-ui-root] *::after, [data-hf-rendering="true"] [data-hf-ui-root] *::before, [data-hf-rendering="true"] [data-hf-ui-root] *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  /* prettier-ignore */
  @media (prefers-reduced-motion: reduce) {
    [data-hf-ui-root], [data-hf-ui-root] *, [data-hf-ui-root] *::before, [data-hf-ui-root] *::after {
      animation-duration: 0s !important;
      animation-delay: 0s !important;
      transition-duration: 0s !important;
      transition-delay: 0s !important;
      scroll-behavior: auto !important;
    }
  }
  /* hf-ui:tokens:end */
  .hf-ui-separator {
    --hf-separator-progress: 1;
    width: min(360px, 100%);
    height: var(--hf-separator-thickness, 1px);
    background: var(--_hf-ui-border);
    overflow: hidden;
  }
  .hf-ui-separator span {
    display: block;
    width: calc(var(--hf-separator-progress) * 100%);
    height: 100%;
    background: var(--hf-separator-fill, var(--_hf-ui-control-border));
    transform-origin: left center;
  }
  .hf-ui-separator[data-orientation="vertical"] {
    width: var(--hf-separator-thickness, 1px);
    height: 180px;
  }
  .hf-ui-separator[data-orientation="vertical"] span {
    width: 100%;
    height: calc(var(--hf-separator-progress) * 100%);
  }
}
</style>
