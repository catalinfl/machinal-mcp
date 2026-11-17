<!-- Modified Svelte adaptation of registry/blocks/camera-dolly-zoom/camera-dolly-zoom.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            var DEFAULTS = {
              direction: "out",
              strength: 2,
              subjectDistance: 1400,
              easing: "power2.inOut",
            };
            var declared =
              __hfHost && __hfHost.getVariables
                ? __hfHost.getVariables()
                : {};
            var vars = Object.assign({}, DEFAULTS, declared);

            function clamp(value, lo, hi, fallback) {
              var n = Number(value);
              if (!isFinite(n)) return fallback;
              return Math.min(hi, Math.max(lo, n));
            }
            function oneOf(value, allowed, fallback) {
              return allowed.indexOf(String(value)) >= 0 ? String(value) : fallback;
            }

            var direction = oneOf(vars.direction, ["in", "out"], DEFAULTS.direction);
            var strength = clamp(vars.strength, 1.1, 4, DEFAULTS.strength);
            var ease = oneOf(
              vars.easing,
              ["none", "sine.inOut", "power1.inOut", "power2.inOut", "power3.inOut"],
              DEFAULTS.easing,
            );

            // d0 = camera-to-subject distance at the start of the move (px).
            // d1 = distance at the end. "out" pulls the camera back and zooms in;
            // "in" pushes the camera forward and zooms out.
            var d0 = clamp(vars.subjectDistance, 600, 3000, DEFAULTS.subjectDistance);
            var d1 = direction === "in" ? d0 / strength : d0 * strength;

            // ---- the solve --------------------------------------------------
            // Subject size is fixed iff  d * tan(FOV/2) = const. With CSS 3D,
            // tan(FOV/2) = (width/2) / perspective, so that invariant is exactly
            // perspective / distance = SUBJECT_SCALE. Focal length is therefore
            // derived from the dolly, never animated alongside it.
            var SUBJECT_SCALE = 1; // subject renders 1:1 => its plane is z = 0

            var stage = document.getElementById("dz-stage");
            var rig = document.getElementById("dz-rig");

            function applyCamera(u) {
              var d = d0 + (d1 - d0) * u; // dolly -- pure function of u
              var P = SUBJECT_SCALE * d; // focal length solved from d
              var camZ = P - d; // put the subject plane at camera distance d
              stage.style.perspective = P + "px";
              rig.style.transform = "translateZ(" + camZ + "px)";
            }

            // GSAP suppresses timeline-level onUpdate during seek(), so the camera
            // is driven by a property setter on the tweened object instead: that
            // fires on every render, seeks included.
            var camera = {
              _u: 0,
              get u() {
                return this._u;
              },
              set u(value) {
                this._u = value;
                applyCamera(value);
              },
            };

            applyCamera(0);

            var tl = gsap.timeline({ paused: true });
            tl.to(camera, { u: 1, duration: 4, ease: ease }, 0);
            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="dz-root"
          data-composition-id="camera-dolly-zoom"
          data-start="0"
          data-duration="4"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[
        &#123;
          "id": "direction",
          "type": "enum",
          "label": "Dolly direction",
          "default": "out",
          "options": [
            &#123; "value": "out", "label": "Dolly out + zoom in (background rushes in)" &#125;,
            &#123; "value": "in", "label": "Dolly in + zoom out (background falls away)" &#125;
          ]
        &#125;,
        &#123;
          "id": "strength",
          "type": "number",
          "label": "Move strength (end / start distance ratio)",
          "default": 2,
          "min": 1.1,
          "max": 4,
          "step": 0.1
        &#125;,
        &#123;
          "id": "subjectDistance",
          "type": "number",
          "label": "Camera-to-subject distance at the start of the move",
          "default": 1400,
          "min": 600,
          "max": 3000,
          "step": 50,
          "unit": "px"
        &#125;,
        &#123;
          "id": "easing",
          "type": "enum",
          "label": "Dolly easing",
          "default": "power2.inOut",
          "options": [
            &#123; "value": "none", "label": "Linear" &#125;,
            &#123; "value": "sine.inOut", "label": "Sine in-out" &#125;,
            &#123; "value": "power1.inOut", "label": "Power1 in-out" &#125;,
            &#123; "value": "power2.inOut", "label": "Power2 in-out" &#125;,
            &#123; "value": "power3.inOut", "label": "Power3 in-out" &#125;
          ]
        &#125;
      ]'>
          
    
          <div id="dz-stage" class="clip" data-start="0" data-duration="4" data-track-index="0">
            <div id="dz-rig">
              <div id="dz-backwall" data-layout-allow-overflow style="transform: translateZ(-3200px)">
                <div id="dz-portal"></div>
              </div>
    
              <div
                class="dz-arch"
                data-layout-allow-overflow
                style="transform: translateZ(-2360px); border-color: #384166"
              ></div>
              <div
                class="dz-arch"
                data-layout-allow-overflow
                style="transform: translateZ(-1720px); border-color: #465280"
              ></div>
              <div
                class="dz-arch"
                data-layout-allow-overflow
                style="transform: translateZ(-1120px); border-color: #57669c"
              ></div>
              <div
                class="dz-arch"
                data-layout-allow-overflow
                style="transform: translateZ(-560px); border-color: #6b7cb8"
              ></div>
              <div
                class="dz-arch"
                data-layout-allow-overflow
                style="transform: translateZ(0px); border-color: #8194d4"
              ></div>
    
              <div id="dz-subject" style="transform: translateZ(0px)">
                <div class="dz-fig-head"></div>
                <div class="dz-fig-body"></div>
              </div>
            </div>
          </div>
    
          <div class="dz-label">Dolly zoom &middot; d &times; tan(fov/2) = const</div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }


  #dz-root {
    width: 1920px;
    height: 1080px;
    position: relative;
    overflow: hidden;
    background: #0b1020;
    font-family: Inter, sans-serif;
  }

  /* The camera. `perspective` is the focal length and is solved from
  the dolly distance every frame -- see the script. */
  #dz-stage {
    position: absolute;
    inset: 0;
    perspective-origin: 50% 50%;
  }

  /* The rig root. Carries the camera's z offset so the subject plane
  always sits exactly `d` in front of the camera. */
  #dz-rig {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
  }

  /* --- authored depth layers ------------------------------------ */

  .dz-arch {
    position: absolute;
    left: -140px;
    top: -80px;
    width: 2200px;
    height: 1240px;
    border: 16px solid #465280;
    border-radius: 8px;
    transform-style: preserve-3d;
  }

  #dz-backwall {
    position: absolute;
    left: -3040px;
    top: -1710px;
    width: 8000px;
    height: 4500px;
    background: #10162c;
    transform-style: preserve-3d;
  }

  /* Bright doorway on the back wall -- the layer whose on-screen size
  changes while the subject's does not. */
  #dz-portal {
    position: absolute;
    left: 3300px;
    top: 1850px;
    width: 1400px;
    height: 1500px;
    background: #cfe4ff;
  }

  /* --- the subject: z = 0, the plane the solve holds ------------- */

  #dz-subject {
    position: absolute;
    left: 840px;
    top: 300px;
    width: 240px;
    height: 620px;
    transform-style: preserve-3d;
  }
  .dz-fig-head {
    width: 120px;
    height: 120px;
    margin: 0 auto;
    border-radius: 50%;
    background: #f2b134;
  }
  .dz-fig-body {
    width: 240px;
    height: 470px;
    margin-top: 30px;
    border-radius: 120px 120px 10px 10px;
    background: #f2b134;
  }

  /* --- flat overlay (outside the 3D rig) ------------------------- */

  .dz-label {
    position: absolute;
    left: 64px;
    bottom: 56px;
    padding: 14px 22px;
    border-radius: 8px;
    background: #0b1020;
    color: #e9eeff;
    font-size: 26px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
}
</style>
