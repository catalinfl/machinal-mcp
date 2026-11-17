<!-- Modified Svelte adaptation of registry/blocks/spiral-galaxy/spiral-galaxy.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
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
            var COMP_ID = "spiral-galaxy";
            var DURATION = 10;
            var W = 1920,
              H = 1080;

            // ── Measured constants ────────────────────────────────────────────
            // Read from the three.js galaxy examples (MIT) during reference
            // research; reimplemented here, nothing copied.
            //   count 20000 · branches 3 · radius = ratio^1.5 * 5 · spin 1
            //   angle = branchAngle + spin * radius + t * (1 - radiusRatio)
            //   randomnessPower 3 · inside #ffa575 · outside #311599
            var DISC_RADIUS = 5.0; // world units, from `radius = ratio^1.5 * 5`
            var RADIUS_POWER = 1.5; // ratio -> radius exponent
            // Static Archimedean twist, radians per world unit. This is what draws
            // the arm across the WHOLE disc; the time term below then winds it.
            // Slightly under the example's 1.0 so the outer arms stay open.
            var SPIN = 0.78;
            var RANDOMNESS = 0.2; // arm thickness, as a fraction of DISC_RADIUS
            var RANDOM_POWER = 3.0; // pow(u, 3): most stars hug the arm, a few stray
            var TANGENT_SQUEEZE = 0.62; // arms are thin across, long along
            var DISC_FLATNESS = 0.3; // vertical jitter relative to in-plane jitter
            var SEED = 20240817; // fixes every per-star attribute

            // ── Variables ─────────────────────────────────────────────────────
            // Read ONCE at init. Variables never change mid-render.
            var vars =
              __hfHost && __hfHost.getVariables
                ? __hfHost.getVariables()
                : {};
            function clampNum(value, lo, hi, fallback) {
              var n = Number(value);
              if (!isFinite(n)) n = fallback;
              return Math.min(hi, Math.max(lo, n));
            }
            var STARS = Math.round(clampNum(vars.stars, 2000, 40000, 20000));
            var ARMS = Math.round(clampNum(vars.arms, 2, 8, 3));
            var RATE = clampNum(vars.rate, 0, 1.5, 0.25);
            var GLOW = clampNum(vars.glow, 0.2, 4, 1.9);
            var SIZE = clampNum(vars.size, 2, 40, 10);
            var CORE_COLOR = typeof vars.core === "string" ? vars.core : "#ffa575";
            var RIM_COLOR = typeof vars.rim === "string" ? vars.rim : "#311599";

            // ── Seeded PRNG (mulberry32) ──────────────────────────────────────
            function mulberry32(seed) {
              return function () {
                seed |= 0;
                seed = (seed + 0x6d2b79f5) | 0;
                var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
                t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
                return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
              };
            }

            // ── Per-star attributes, seeded once ──────────────────────────────
            // Nothing here depends on time. Every frame is computed from these
            // plus `uTime` alone, so frame N never reads frame N-1.
            var rng = mulberry32(SEED);
            var aRatio = new Float32Array(STARS); // 0 = core, 1 = rim
            var aBranch = new Float32Array(STARS); // base arm angle
            var aJitterR = new Float32Array(STARS); // offset along the arm's radial axis
            var aJitterT = new Float32Array(STARS); // offset along the arm's tangent
            var aJitterY = new Float32Array(STARS); // disc thickness
            var aSpark = new Float32Array(STARS); // per-star size variation

            function jitter() {
              var magnitude = Math.pow(rng(), RANDOM_POWER) * RANDOMNESS * DISC_RADIUS;
              return rng() < 0.5 ? -magnitude : magnitude;
            }
            for (var i = 0; i < STARS; i++) {
              aRatio[i] = rng();
              aBranch[i] = ((i % ARMS) / ARMS) * Math.PI * 2;
              aJitterR[i] = jitter();
              aJitterT[i] = jitter() * TANGENT_SQUEEZE;
              aJitterY[i] = jitter() * DISC_FLATNESS;
              aSpark[i] = rng();
            }

            // ── Scene ─────────────────────────────────────────────────────────
            var renderer = new THREE.WebGLRenderer({
              canvas: document.getElementById("sg-gl"),
              antialias: false,
              alpha: false,
              preserveDrawingBuffer: true, // survives seek-capture screenshots
            });
            renderer.setPixelRatio(1);
            renderer.setSize(W, H, false);
            renderer.setClearColor(0x03040a, 1);

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 200);
            camera.position.set(0, 2.9, 7.6);
            camera.lookAt(0, 0, 0);

            var uniforms = {
              uTime: { value: 0 },
              uRate: { value: RATE },
              uSpin: { value: SPIN },
              uRadius: { value: DISC_RADIUS },
              uPower: { value: RADIUS_POWER },
              uSize: { value: SIZE },
              uRefDist: { value: camera.position.length() },
              uGlow: { value: GLOW },
              uCore: { value: new THREE.Color(CORE_COLOR) },
              uRim: { value: new THREE.Color(RIM_COLOR) },
            };

            var VERT = [
              "attribute float aRatio;",
              "attribute float aBranch;",
              "attribute float aJitterR;",
              "attribute float aJitterT;",
              "attribute float aJitterY;",
              "attribute float aSpark;",
              "uniform float uTime;",
              "uniform float uRate;",
              "uniform float uSpin;",
              "uniform float uRadius;",
              "uniform float uPower;",
              "uniform float uSize;",
              "uniform float uRefDist;",
              "uniform float uGlow;",
              "uniform vec3 uCore;",
              "uniform vec3 uRim;",
              "varying vec3 vColor;",
              "varying float vBright;",
              "void main() {",
              "  float ratio = clamp(aRatio, 0.0, 1.0);",
              // Differential rotation. omega falls to zero at the rim, so the
              // core laps the outer disc and the arms wind up over time.
              // Solved directly from uTime — never integrated frame to frame.
              "  float omega = 1.0 - ratio;",
              "  float r = pow(ratio, uPower) * uRadius;",
              // uSpin * r is the static arm shape (time-independent, so it drops
              // out of any inner-vs-outer rotation measurement); uRate * uTime *
              // omega is the winding.
              "  float theta = aBranch + uSpin * r + uRate * uTime * omega;",
              "  vec2 radial = vec2(cos(theta), sin(theta));",
              "  vec2 tangent = vec2(-radial.y, radial.x);",
              // Jitter rides in the star's own rotating frame, so arm thickness
              // holds its shape instead of smearing as the disc turns.
              "  vec2 xz = radial * (r + aJitterR) + tangent * aJitterT;",
              "  vec4 mv = modelViewMatrix * vec4(xz.x, aJitterY, xz.y, 1.0);",
              "  gl_Position = projectionMatrix * mv;",
              "  gl_PointSize = uSize * (uRefDist / max(-mv.z, 0.001)) * (0.55 + 0.75 * aSpark);",
              // Lerp by r/R (i.e. ratio^1.5), matching the example's colour ramp:
              // the disc stays warm well past mid-radius and only the rim goes cold.
              "  vColor = mix(uCore, uRim, pow(ratio, uPower));",
              "  vBright = uGlow * (0.22 + 0.78 * exp(-ratio * 3.0));",
              "}",
            ].join("\n");

            var FRAG = [
              "varying vec3 vColor;",
              "varying float vBright;",
              "void main() {",
              "  float d = length(gl_PointCoord - vec2(0.5));",
              "  float a = smoothstep(0.5, 0.0, d);",
              "  a = a * a;",
              "  gl_FragColor = vec4(vColor * vBright, a);",
              "}",
            ].join("\n");

            var geometry = new THREE.BufferGeometry();
            // The vertex shader builds every position from the attributes below;
            // `position` exists only because three.js counts vertices from it.
            geometry.setAttribute(
              "position",
              new THREE.BufferAttribute(new Float32Array(STARS * 3), 3),
            );
            geometry.setAttribute("aRatio", new THREE.BufferAttribute(aRatio, 1));
            geometry.setAttribute("aBranch", new THREE.BufferAttribute(aBranch, 1));
            geometry.setAttribute("aJitterR", new THREE.BufferAttribute(aJitterR, 1));
            geometry.setAttribute("aJitterT", new THREE.BufferAttribute(aJitterT, 1));
            geometry.setAttribute("aJitterY", new THREE.BufferAttribute(aJitterY, 1));
            geometry.setAttribute("aSpark", new THREE.BufferAttribute(aSpark, 1));

            var material = new THREE.ShaderMaterial({
              uniforms: uniforms,
              vertexShader: VERT,
              fragmentShader: FRAG,
              blending: THREE.AdditiveBlending,
              transparent: true,
              depthTest: false,
              depthWrite: false,
            });

            var points = new THREE.Points(geometry, material);
            points.frustumCulled = false; // positions live in the shader, not in `position`
            scene.add(points);

            function draw(t) {
              uniforms.uTime.value = t;
              renderer.render(scene, camera);
            }

            // ── Timeline ──────────────────────────────────────────────────────
            // `tl.eventCallback("onUpdate", ...)` does NOT fire on tl.seek(), so
            // the repaint hangs off a property setter on the tweened driver —
            // that setter runs on every render, seek included.
            var driver = { _t: 0 };
            Object.defineProperty(driver, "t", {
              get: function () {
                return this._t;
              },
              set: function (value) {
                this._t = value;
                draw(value);
              },
            });

            
            var tl = gsap.timeline({ paused: true });
            // ease "none" over the full duration makes driver.t === tl.time().
            tl.to(driver, { t: DURATION, duration: DURATION, ease: "none", lazy: false }, 0);
            __hfTimelineSlot.set(tl);

            draw(0); // paint frame 0; GSAP skips the setter when the value is unchanged
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#03040a">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="sg-root"
          data-composition-id="spiral-galaxy"
          data-composition-variables='[
            &#123;"id":"stars","type":"number","label":"Star count","default":20000,"min":2000,"max":40000,"step":1000&#125;,
            &#123;"id":"arms","type":"number","label":"Arm count","default":3,"min":2,"max":8,"step":1&#125;,
            &#123;"id":"rate","type":"number","label":"Rotation rate","default":0.25,"min":0,"max":1.5,"step":0.05,"unit":"rad/s"&#125;,
            &#123;"id":"glow","type":"number","label":"Core brightness","default":1.9,"min":0.2,"max":4,"step":0.1&#125;,
            &#123;"id":"size","type":"number","label":"Star size","default":10,"min":2,"max":40,"step":1,"unit":"px"&#125;,
            &#123;"id":"core","type":"color","label":"Core colour","default":"#ffa575"&#125;,
            &#123;"id":"rim","type":"color","label":"Rim colour","default":"#311599"&#125;
          ]'
          data-start="0"
          data-duration="10"
          data-width="1920"
          data-height="1080"
        >
          <div id="sg-fill"></div>
          <canvas id="sg-gl" width="1920" height="1080"></canvas>
          <div id="sg-halo"></div>
    
          
          <div
            id="sg-drv"
            class="clip"
            data-start="0"
            data-duration="10"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #03040a;
  }
  #sg-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  /* Full-bleed child carries the scene fill; never the composition root. */
  #sg-fill {
    position: absolute;
    inset: 0;
    background: #03040a;
  }
  #sg-gl {
    position: absolute;
    inset: 0;
    display: block;
    width: 1920px;
    height: 1080px;
  }
  /* Ambient halo in the rim colour, screen-blended over the point cloud.
  Reads the declared `rim` variable. Variable ids are single lowercase
  words on purpose: the runtime injects `--<id>` while the compiler
  injects `--<slugify(id)>`, and those two only agree when the id has
  no capitals or separators. */
  #sg-halo {
    position: absolute;
    inset: 0;
    mix-blend-mode: screen;
    opacity: 0.12;
    background: radial-gradient(72% 46% at 50% 50%, var(--rim, #311599) 0%, #000000 70%);
  }
}
</style>
