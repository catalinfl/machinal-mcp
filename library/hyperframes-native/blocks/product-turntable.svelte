<!-- Modified Svelte adaptation of registry/blocks/product-turntable/product-turntable.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
  import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-product-turntable';
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
            var root = document.getElementById("pt-root");
            var duration = Math.max(0.001, parseFloat(root.dataset.duration) || 6);
            root.style.setProperty("--pt-bg", vars.background || "#e8e4dc");
            document.getElementById("pt-caption").textContent = vars.caption || "";

            var clock = { t: 0 };
            var scene = { vars: vars, duration: duration, clock: clock, render: null };
            window.__productTurntable = scene;
            window.__hf = window.__hf || {};
            window.__hf.buildReady = window.__hf.buildReady || {};
            window.__hf.buildReady["product-turntable"] = new Promise(function (resolve) {
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
            
            __hfTimelineSlot.set(tl);
          })();
        


          const host = window.__productTurntable;
          const V = host.vars;
          const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : fallback);
          const turns = Math.max(1, Math.min(4, Math.round(Number(V.turns) || 1)));

          const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("pt-canvas"),
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          });
          renderer.setPixelRatio(1);
          renderer.setSize(1920, 1080, false);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;
          renderer.toneMappingExposure = 1.3;

          const scene = new THREE.Scene();
          const pmrem = new THREE.PMREMGenerator(renderer);
          // Studio: two tall softbox strips (key 35 deg left, rim 120 deg right at 1.6x) over a dimmed room fill.
          const studio = new THREE.Scene();
          const room = new RoomEnvironment();
          room.traverse((o) => {
            if (o.isLight) o.intensity *= 0.3;
            if (o.material && o.material.emissiveIntensity) o.material.emissiveIntensity *= 0.3;
          });
          studio.add(room);
          for (const [deg, intensity] of [
            [-35, 5],
            [120, 8],
          ]) {
            const strip = new THREE.Mesh(
              new THREE.PlaneGeometry(1.2, 8),
              new THREE.MeshLambertMaterial({
                color: 0x000000,
                emissive: 0xffffff,
                emissiveIntensity: intensity,
                side: THREE.DoubleSide,
              }),
            );
            const a = THREE.MathUtils.degToRad(deg);
            strip.position.set(6 * Math.sin(a), 1, 6 * Math.cos(a));
            strip.lookAt(0, 1, 0);
            studio.add(strip);
          }
          scene.environment = pmrem.fromScene(studio, 0.02).texture;

          // Can and plinth vertically centred, about 140 px clear above and below.
          const camera = new THREE.PerspectiveCamera(24, 1920 / 1080, 0.1, 100);
          camera.position.set(0, 2.1, 9.4);
          camera.lookAt(0, 0.9, 0);

          const key = new THREE.DirectionalLight(0xffffff, 1.6);
          key.position.set(-3.5, 5, 4);
          scene.add(key);
          const rim = new THREE.DirectionalLight(0xfff1dc, 2.2);
          rim.position.set(4, 3, -4);
          scene.add(rim);

          // Plinth with a soft baked contact shadow: no shadow maps, no per-frame cost.
          const plinth = new THREE.Mesh(
            new THREE.CylinderGeometry(1.42, 1.46, 0.2, 96),
            new THREE.MeshStandardMaterial({ color: 0xf4f1ec, roughness: 0.55, metalness: 0 }),
          );
          plinth.position.y = -0.1;
          scene.add(plinth);

          function radialTexture(inner, outer) {
            const c = document.createElement("canvas");
            c.width = c.height = 256;
            const g = c.getContext("2d");
            const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
            grad.addColorStop(0, inner);
            grad.addColorStop(1, outer);
            g.fillStyle = grad;
            g.fillRect(0, 0, 256, 256);
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            return tex;
          }
          const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(2.4, 2.4),
            new THREE.MeshBasicMaterial({
              map: radialTexture("rgba(0,0,0,0.55)", "rgba(0,0,0,0)"),
              transparent: true,
              depthWrite: false,
            }),
          );
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = 0.002;
          scene.add(shadow);

          const turntable = new THREE.Group();
          scene.add(turntable);

          async function labelTexture() {
            try {
              const face = new FontFace(
                "PT Inter",
                hyperframeFontSource(__hfFonts, "inter-latin-800-normal.woff2"),
                { weight: "800" },
              );
              document.fonts.add(await face.load());
            } catch (error) {
              console.error("[product-turntable] label font failed to load, using system sans", error);
            }
            const c = document.createElement("canvas");
            // 2.35:1 matches the label's circumference to height, so type is not stretched.
            c.width = 2048;
            c.height = 872;
            const g = c.getContext("2d");
            const label = hex(V.label_color, "#f2c230");
            const ink = hex(V.ink_color, "#1d2a24");
            g.fillStyle = label;
            g.fillRect(0, 0, 2048, 872);
            g.fillStyle = ink;
            g.fillRect(0, 70, 2048, 12);
            g.fillRect(0, 790, 2048, 12);
            const name = String(V.product_name || "YUZU").toUpperCase();
            const flavor = String(V.flavor || "").toUpperCase();
            // Two faces, front and back, so the wordmark reads twice per revolution.
            for (const cx of [512, 1536]) {
              g.save();
              g.textAlign = "center";
              g.textBaseline = "middle";
              let size = 280;
              g.font = `800 ${size}px "PT Inter", system-ui, sans-serif`;
              while (g.measureText(name).width > 600 && size > 80) {
                size -= 10;
                g.font = `800 ${size}px "PT Inter", system-ui, sans-serif`;
              }
              g.fillText(name, cx, 400);
              g.font = `800 50px "PT Inter", system-ui, sans-serif`;
              g.globalAlpha = 0.8;
              g.fillText(flavor, cx, 590, 540);
              g.restore();
            }
            g.save();
            g.textAlign = "center";
            g.font = `800 34px "PT Inter", system-ui, sans-serif`;
            g.globalAlpha = 0.7;
            for (const cx of [0, 1024, 2048]) g.fillText("355 ML", cx, 450);
            g.restore();
            const tex = new THREE.CanvasTexture(c);
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            return tex;
          }

          async function builtInCan() {
            const can = new THREE.Group();
            const metal = new THREE.MeshStandardMaterial({
              color: 0xd4d7dc,
              metalness: 1,
              roughness: 0.24,
            });
            // Lathe profile (radius, height): domed base, straight wall, necked shoulder, rolled lip.
            const profile = [
              [0.0, 0.1],
              [0.46, 0.06],
              [0.6, 0.0],
              [0.66, 0.06],
              [0.67, 0.16],
              [0.67, 2.02],
              [0.63, 2.14],
              [0.56, 2.24],
              [0.555, 2.29],
              [0.575, 2.31],
              [0.56, 2.33],
              [0.5, 2.3],
              [0.0, 2.27],
            ].map(([x, y]) => new THREE.Vector2(x, y));
            can.add(new THREE.Mesh(new THREE.LatheGeometry(profile, 128), metal));
            const labelMat = new THREE.MeshPhysicalMaterial({
              map: await labelTexture(),
              metalness: 0.45,
              roughness: 0.32,
              clearcoat: 1,
              clearcoatRoughness: 0.12,
            });
            const label = new THREE.Mesh(
              new THREE.CylinderGeometry(0.674, 0.674, 1.8, 128, 1, true),
              labelMat,
            );
            label.position.y = 1.1;
            can.add(label);
            // Pull tab: a thin rounded plate on the lid.
            const tab = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.22, 4, 12), metal);
            tab.rotation.set(Math.PI / 2, 0, Math.PI / 2);
            tab.scale.set(1, 1, 0.25);
            tab.position.set(0.1, 2.285, 0);
            can.add(tab);
            return can;
          }

          function fitModel(object) {
            const box = new THREE.Box3().setFromObject(object);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const scale = Math.min(2.3 / size.y, 2.6 / Math.max(size.x, size.z));
            object.scale.setScalar(scale);
            object.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
            const wrapper = new THREE.Group();
            wrapper.add(object);
            return wrapper;
          }

          // A model_url that fails to load fails the render; it never swaps in a different product.
          async function product() {
            const url = String(V.model_url || "").trim();
            if (!url) return builtInCan();
            const gltf = await new GLTFLoader().loadAsync(url);
            return fitModel(gltf.scene);
          }

          turntable.add(await product());

          host.render = (t) => {
            turntable.rotation.y = (t / host.duration) * turns * Math.PI * 2;
            renderer.render(scene, camera);
          };
          host.render(host.clock.t);
          host.ready();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#e8e4dc">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="pt-root"
          data-composition-id="product-turntable"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[
        &#123; "id": "model_url", "type": "string", "role": "content", "label": "Model URL (.glb or .gltf)", "description": "Leave empty for the built-in drink can.", "default": "" &#125;,
        &#123; "id": "product_name", "type": "string", "role": "content", "label": "Label wordmark", "default": "YUZU", "maxLength": 10 &#125;,
        &#123; "id": "flavor", "type": "string", "role": "content", "label": "Label line", "default": "Sparkling Citrus", "maxLength": 28 &#125;,
        &#123; "id": "caption", "type": "string", "role": "content", "label": "Caption", "default": "Sparkling Citrus · 355 ml", "maxLength": 40 &#125;,
        &#123; "id": "label_color", "type": "color", "role": "style", "label": "Label color", "default": "#f2c230" &#125;,
        &#123; "id": "ink_color", "type": "color", "role": "style", "label": "Label ink", "default": "#1d2a24" &#125;,
        &#123; "id": "background", "type": "color", "role": "style", "label": "Backdrop", "default": "#e8e4dc" &#125;,
        &#123; "id": "turns", "type": "number", "role": "motion", "label": "Turns per clip", "default": 1, "min": 1, "max": 4, "step": 1 &#125;
      ]'>
          <canvas
            id="pt-canvas"
            class="clip"
            data-start="0"
            data-duration="6"
            data-track-index="1"
          ></canvas>
          <div id="pt-caption"></div>
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
    background: #e8e4dc;
  }
  #pt-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background:
      radial-gradient(1100px 760px at 50% 38%, rgba(255, 255, 255, 0.72), transparent 70%),
      var(--pt-bg, #e8e4dc);
  }
  #pt-canvas {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #pt-caption {
    position: absolute;
    left: 96px;
    bottom: 96px;
    font:
      500 30px/1 "PT Caption",
      system-ui,
      sans-serif;
    letter-spacing: 0.01em;
    color: rgba(20, 22, 24, 0.62);
  }
}
</style>
