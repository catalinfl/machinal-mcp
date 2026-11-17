<!-- Modified Svelte adaptation of registry/components/input-feedback/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              function text(value, fallback) {
                return typeof value === "string" && value.trim() !== "" ? value : fallback;
              }

              var statuses = { valid: "OK", error: "!" };

              var status = pick(statuses, vars.status, "valid");
              var value = text(vars.value, "mia@example.com");
              var hint = text(vars.hint, "Looks good.");

              var roots = document.querySelectorAll(".hf-transition-input-feedback");
              for (var i = 0; i < roots.length; i += 1) {
                var root = roots[i];
                root.setAttribute("data-state", status);
                var valueEl = root.querySelector(".hf-transition-input-value");
                if (valueEl) valueEl.textContent = value;
                var hintEl = root.querySelector(".hf-transition-input-hint");
                if (hintEl) hintEl.textContent = hint;
                var chip = root.querySelector(".hf-transition-input-check");
                if (chip) chip.textContent = statuses[status];
              }
            })();
          

            const tl = gsap.timeline({ paused: true });
            tl.fromTo(
              ".hf-transition-input-feedback",
              { y: 22, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.34, ease: "power2.out" },
              0.3,
            );
            tl.to(
              ".hf-transition-input-shell",
              { x: -12, duration: 0.06, repeat: 5, yoyo: true, ease: "none" },
              0.72,
            );
            tl.fromTo(
              ".hf-transition-input-check",
              { scale: 0, opacity: 0 },
              { scale: 1, opacity: 1, duration: 0.28, ease: "back.out(2)" },
              1.18,
            );
            tl.fromTo(
              ".hf-transition-input-hint",
              { opacity: 0, y: -6 },
              { opacity: 1, y: 0, duration: 0.22, ease: "power2.out" },
              1.28,
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
          data-composition-id="input-feedback-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="demo-frame">
            <div
              class="hf-transition-input-feedback"
              data-state="valid"
              data-composition-variables='[
        &#123; "id": "status", "type": "enum", "role": "style", "label": "Status", "description": "Whether the field reads as accepted or rejected, colouring the border, chip and hint.", "default": "valid", "options": [&#123; "value": "valid", "label": "Valid" &#125;, &#123; "value": "error", "label": "Error" &#125;] &#125;,
        &#123; "id": "value", "type": "string", "role": "content", "label": "Value", "description": "Text held by the field.", "default": "mia@example.com" &#125;,
        &#123; "id": "hint", "type": "string", "role": "content", "label": "Hint", "description": "Helper line under the field.", "default": "Looks good." &#125;
      ]'
            >
              <label>Email</label>
              <div class="hf-transition-input-shell">
                <span class="hf-transition-input-value">mia@example.com</span>
                <button class="hf-transition-input-clear" type="button">x</button>
                <span class="hf-transition-input-check">OK</span>
              </div>
              <p class="hf-transition-input-hint">Looks good.</p>
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
    background: #f8fafc;
    font-family: Inter, system-ui, sans-serif;
  }
  .demo-frame {
    display: grid;
    place-items: center;
    min-width: 760px;
    min-height: 480px;
    padding: 56px;
    /* ponytail: scale up the static wrapper so the widget fills ~60% of frame; GSAP targets children, not this element */
    transform: scale(2.8);
  }
  .hf-transition-input-feedback {
    display: grid;
    gap: 10px;
    width: 430px;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-input-feedback label {
    color: #52525b;
    font-size: 15px;
    font-weight: 850;
  }
  .hf-transition-input-shell {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 62px;
    padding: 0 16px;
    border: 1px solid #d4d4d8;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
  }
  .hf-transition-input-value {
    flex: 1;
    font-size: 20px;
    font-weight: 760;
  }
  .hf-transition-input-clear, .hf-transition-input-check {
    display: grid;
    place-items: center;
    height: 28px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
  }
  .hf-transition-input-clear {
    width: 28px;
    border: 0;
    background: #f4f4f5;
    color: #71717a;
  }
  .hf-transition-input-check {
    min-width: 38px;
    padding: 0 8px;
    background: #dcfce7;
    color: #166534;
  }
  .hf-transition-input-hint {
    margin: 0;
    color: #16a34a;
    font-size: 14px;
    font-weight: 800;
  }


  .hf-transition-input-feedback {
    --hf-fb-border: #d4d4d8;
    --hf-fb-chip-bg: #dcfce7;
    --hf-fb-chip-fg: #166534;
    --hf-fb-hint: #16a34a;
    display: grid;
    gap: 10px;
    width: 430px;
    color: #18181b;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-transition-input-feedback label {
    color: #52525b;
    font-size: 15px;
    font-weight: 850;
  }
  .hf-transition-input-shell {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 62px;
    padding: 0 16px;
    border: 1px solid var(--hf-fb-border);
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 18px 50px rgba(0, 0, 0, 0.08);
  }
  .hf-transition-input-value {
    flex: 1;
    font-size: 20px;
    font-weight: 760;
  }
  .hf-transition-input-clear, .hf-transition-input-check {
    display: grid;
    place-items: center;
    height: 28px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
  }
  .hf-transition-input-clear {
    width: 28px;
    border: 0;
    background: #f4f4f5;
    color: #71717a;
  }
  .hf-transition-input-check {
    min-width: 38px;
    padding: 0 8px;
    background: var(--hf-fb-chip-bg);
    color: var(--hf-fb-chip-fg);
  }
  .hf-transition-input-hint {
    margin: 0;
    color: var(--hf-fb-hint);
    font-size: 14px;
    font-weight: 800;
  }
  .hf-transition-input-feedback[data-state="error"] {
    --hf-fb-border: #fca5a5;
    --hf-fb-chip-bg: #fee2e2;
    --hf-fb-chip-fg: #991b1b;
    --hf-fb-hint: #dc2626;
  }
}
</style>
