<!-- Modified Svelte adaptation of registry/blocks/glass-hero/glass-hero.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-glass-hero';
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
    await loadHyperframeFonts(__hfFonts);

          (function () {
            var html = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
            var defaults = {};
            try {
              JSON.parse(html.getAttribute("data-composition-variables") || "[]").forEach(function (v) {
                defaults[v.id] = v.default;
              });
            } catch (error) {
              /* malformed declaration: the scene module falls back to its own defaults */
            }
            var scoped =
              (__hfHost &&
                __hfHost.getVariables &&
                __hfHost.getVariables()) ||
              {};
            var vars = Object.assign({}, defaults, __hfHost.variables || {}, scoped);
            var root = document.getElementById("gh-root");
            var duration = Math.max(0.001, parseFloat(root.dataset.duration) || 5);
            var bg = /^#[0-9a-f]{6}$/i.test(String(vars.background)) ? vars.background : "#0b0b0c";
            root.style.background = bg;
            var subline = document.getElementById("gh-subline");
            subline.textContent = vars.subline || "";

            var clock = { t: 0 };
            var scene = { vars: vars, duration: duration, clock: clock, background: bg, render: null };
            window.__glassHero = scene;
            window.__hf = window.__hf || {};
            window.__hf.buildReady = window.__hf.buildReady || {};
            window.__hf.buildReady["glass-hero"] = new Promise(function (resolve) {
              scene.ready = resolve;
            });

            var tl = gsap.timeline({ paused: true });
            tl.to(clock, {
              t: duration,
              duration: duration,
              ease: "none",
              onUpdate: function () {
                if (scene.render) scene.render(clock.t);
              },
            });
            tl.fromTo(
              subline,
              { opacity: 0, y: 18 },
              { opacity: 1, y: 0, duration: 0.7, ease: "power2.out" },
              Math.min(1.5, duration * 0.3),
            );
            
            __hfTimelineSlot.set(tl);
          })();
        


          const host = window.__glassHero;
          const V = host.vars;
          const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : fallback);

          const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("gh-canvas"),
            antialias: true,
            preserveDrawingBuffer: true,
          });
          renderer.setPixelRatio(1);
          renderer.setSize(1920, 1080, false);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          // No tone mapping: the glass passes the ground and type through at their true values.

          const scene = new THREE.Scene();
          scene.background = new THREE.Color(host.background);
          const pmrem = new THREE.PMREMGenerator(renderer);
          // Studio light for the reflections: a soft key box overhead and two tall strips at the sides.
          const studio = new THREE.Scene();
          studio.background = new THREE.Color(0.08, 0.08, 0.08);
          const softbox = (w, h, x, y, z, level) => {
            const m = new THREE.Mesh(
              new THREE.PlaneGeometry(w, h),
              new THREE.MeshBasicMaterial({
                color: new THREE.Color(level, level, level),
                side: THREE.DoubleSide,
              }),
            );
            m.position.set(x, y, z);
            m.lookAt(0, 0, 0);
            studio.add(m);
          };
          softbox(8, 3, -1, 6, 2, 2.5);
          softbox(1.2, 9, -7, 0, -1, 4);
          softbox(1.2, 9, 7, 0, -1, 4);
          scene.environment = pmrem.fromScene(studio, 0.02).texture;

          const camera = new THREE.PerspectiveCamera(30, 1920 / 1080, 0.1, 100);
          camera.position.set(0, 0, 10);

          async function headlineTexture() {
            try {
              const face = new FontFace(
                "GH Inter",
                hyperframeFontSource(__hfFonts, "inter-latin-900-normal.woff2"),
                { weight: "900" },
              );
              document.fonts.add(await face.load());
            } catch (error) {
              console.error("[glass-hero] headline font failed to load, using system sans", error);
            }
            const c = document.createElement("canvas");
            c.width = 3840;
            c.height = 2160;
            const g = c.getContext("2d");
            g.fillStyle = host.background;
            g.fillRect(0, 0, c.width, c.height);
            const text = String(V.headline || "CLARITY").toUpperCase();
            let size = 1000;
            g.font = `900 ${size}px "GH Inter", system-ui, sans-serif`;
            while (g.measureText(text).width > 3100 && size > 200) {
              size -= 20;
              g.font = `900 ${size}px "GH Inter", system-ui, sans-serif`;
            }
            g.textAlign = "center";
            g.textBaseline = "middle";
            g.fillStyle = hex(V.type_color, "#f4efe4");
            g.fillText(text, c.width / 2, c.height * 0.47);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            return tex;
          }

          // The backdrop plane fills the frustum at z = -2, so it reads as the page itself.
          const planeHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 12;
          const backdrop = new THREE.Mesh(
            new THREE.PlaneGeometry(planeHeight * (1920 / 1080), planeHeight),
            new THREE.MeshBasicMaterial({ map: await headlineTexture() }),
          );
          backdrop.position.z = -2;
          scene.add(backdrop);

          const geometries = {
            ring: () => new THREE.TorusGeometry(1.25, 0.46, 96, 200),
            lens: () => {
              const g = new THREE.SphereGeometry(1.6, 128, 64);
              g.scale(1, 1, 0.42);
              return g;
            },
          };
          const glass = new THREE.Mesh(
            (geometries[V.shape] || geometries.lens)(),
            new THREE.MeshPhysicalMaterial({
              color: 0xffffff,
              transmission: 1,
              thickness: 0.6,
              ior: 1.3,
              roughness: 0.03,
              metalness: 0,
              dispersion: 0.6,
              attenuationColor: new THREE.Color(hex(V.glass_tint, "#cfe9ff")),
              attenuationDistance: 2.2,
              specularIntensity: 1,
              clearcoat: 1,
              clearcoatRoughness: 0.04,
            }),
          );
          scene.add(glass);

          const key = new THREE.DirectionalLight(0xffffff, 2.4);
          key.position.set(-4, 5, 6);
          scene.add(key);

          const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
          const lens = V.shape !== "ring";

          host.render = (t) => {
            // Rise and settle over the first 1.6 s, then keep turning; the turn never stops,
            // so a held frame still shows the type moving through the glass.
            const rise = easeOut(t / 1.8);
            glass.position.set(
              Math.sin(t * 0.55) * 0.35,
              -3.2 * (1 - rise) + Math.sin(t * 0.9) * 0.06,
              1.2,
            );
            glass.scale.setScalar(0.62 + 0.14 * rise);
            glass.rotation.set(
              lens ? Math.sin(t * 0.7) * 0.35 : 0.5 + t * 0.22,
              lens ? Math.sin(t * 0.5) * 0.5 + 0.2 : t * 0.34,
              lens ? 0 : 0.2 + t * 0.08,
            );
            renderer.render(scene, camera);
          };
          host.render(host.clock.t);
          host.ready();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0b0b0c">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="gh-root"
          data-composition-id="glass-hero"
          data-start="0"
          data-duration="5"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[
        &#123; "id": "headline", "type": "string", "role": "content", "label": "Headline behind the glass", "default": "CLARITY", "maxLength": 12 &#125;,
        &#123; "id": "subline", "type": "string", "role": "content", "label": "Subline", "default": "See every detail, nothing in the way.", "maxLength": 48 &#125;,
        &#123; "id": "shape", "type": "enum", "role": "style", "label": "Glass shape", "default": "lens", "options": [ &#123; "value": "lens", "label": "Lens" &#125;, &#123; "value": "ring", "label": "Ring" &#125; ] &#125;,
        &#123; "id": "glass_tint", "type": "color", "role": "style", "label": "Glass tint", "default": "#cfe9ff" &#125;,
        &#123; "id": "type_color", "type": "color", "role": "style", "label": "Headline color", "default": "#f4efe4" &#125;,
        &#123; "id": "background", "type": "color", "role": "style", "label": "Backdrop", "default": "#0b0b0c" &#125;
      ]'>
          <canvas
            id="gh-canvas"
            class="clip"
            data-start="0"
            data-duration="5"
            data-track-index="1"
          ></canvas>
          <div id="gh-subline"></div>
        </div>
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
    background: #0b0b0c;
  }
  #gh-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #0b0b0c;
  }
  #gh-canvas {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #gh-subline {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 118px;
    text-align: center;
    font:
      500 36px/1.2 "GH Caption",
      system-ui,
      sans-serif;
    letter-spacing: 0.01em;
    color: rgba(244, 239, 228, 0.78);
    opacity: 0;
  }
}
</style>
