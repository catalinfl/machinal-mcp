<!-- Modified Svelte adaptation of registry/blocks/extruded-logo/extruded-logo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import { FontLoader } from 'three/addons/loaders/FontLoader.js';
  import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-extruded-logo';
  import __hfAsset from '@machinal/hyperframes/media/blocks-extruded-logo';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { design = {} } = $props();
  const __hfScene = useScene();
  let root = $state();
  let timeline = $state.raw();

  // Host shim: the upstream page reads its editable variables from the
  // HyperFrames host. In the port they come from the approved `design` prop.
  const __hfHost = { getVariables: () => (design || {}), variables: design || {}, assetUrl: path => __hfAsset(path) };

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
            var root = document.getElementById("el-root");
            var duration = Math.max(0.001, parseFloat(root.dataset.duration) || 5);
            if (/^#[0-9a-f]{6}$/i.test(String(vars.background)))
              root.style.setProperty("--el-bg", vars.background);
            var tagline = document.getElementById("el-tagline");
            tagline.textContent = vars.tagline || "";

            var clock = { t: 0 };
            var scene = { vars: vars, duration: duration, clock: clock, render: null };
            window.__extrudedLogo = scene;
            window.__hf = window.__hf || {};
            window.__hf.buildReady = window.__hf.buildReady || {};
            window.__hf.buildReady["extruded-logo"] = new Promise(function (resolve) {
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
              tagline,
              { opacity: 0, y: 16 },
              { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
              Math.min(1.7, duration * 0.34),
            );
            
            __hfTimelineSlot.set(tl);
          })();
        


          const host = window.__extrudedLogo;
          const V = host.vars;
          const hex = (v, fallback) => (/^#[0-9a-f]{6}$/i.test(String(v)) ? String(v) : fallback);

          const renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById("el-canvas"),
            antialias: true,
            alpha: true,
            preserveDrawingBuffer: true,
          });
          renderer.setPixelRatio(1);
          renderer.setSize(1920, 1080, false);
          renderer.outputColorSpace = THREE.SRGBColorSpace;
          renderer.toneMapping = THREE.ACESFilmicToneMapping;

          const scene = new THREE.Scene();
          // Softbox studio: bright strips on black, so chrome shows crisp bands instead of grey.
          const studio = new THREE.Scene();
          studio.background = new THREE.Color(0x040406);
          const softbox = (w, h, x, y, z, color, power) => {
            const mat = new THREE.MeshBasicMaterial({
              color: new THREE.Color(color).multiplyScalar(power),
              side: THREE.DoubleSide,
            });
            const panel = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
            panel.position.set(x, y, z);
            panel.lookAt(0, 0, 0);
            studio.add(panel);
          };
          softbox(10, 2.2, 0, 7, 1, 0xffffff, 3);
          softbox(1.2, 7, -7, 1, 2, 0xffffff, 2.2);
          softbox(1.2, 7, 7, 1, -1, 0xffffff, 1.6);
          // Behind the camera: the panel the letter faces mirror. Vertical bars sweep across
          // the faces as the word swings.
          const bars = document.createElement("canvas");
          bars.width = 1024;
          bars.height = 256;
          const bg = bars.getContext("2d");
          const fade = bg.createLinearGradient(0, 0, 0, 256);
          fade.addColorStop(0, "#9a9ca3");
          fade.addColorStop(1, "#15161a");
          bg.fillStyle = fade;
          bg.fillRect(0, 0, 1024, 256);
          bg.fillStyle = "#ffffff";
          for (const [x, w] of [
            [150, 60],
            [430, 140],
            [760, 36],
          ])
            bg.fillRect(x, 0, w, 256);
          const mirror = new THREE.Mesh(
            new THREE.PlaneGeometry(22, 8),
            new THREE.MeshBasicMaterial({
              map: new THREE.CanvasTexture(bars),
              color: new THREE.Color(2.2, 2.2, 2.2),
              side: THREE.DoubleSide,
            }),
          );
          mirror.position.set(0, 1, 9);
          mirror.lookAt(0, 1, 0);
          studio.add(mirror);
          softbox(9, 1.4, 0, 0.5, -7, hex(V.rim_color, "#fff4e6"), 2);
          const pmrem = new THREE.PMREMGenerator(renderer);
          scene.environment = pmrem.fromScene(studio, 0.01).texture;

          const camera = new THREE.PerspectiveCamera(26, 1920 / 1080, 0.1, 100);
          camera.position.set(0, 0.9, 11);
          camera.lookAt(0, 0.35, 0);

          const rim = new THREE.DirectionalLight(new THREE.Color(hex(V.rim_color, "#fff4e6")), 5);
          rim.position.set(0, 3, -6);
          scene.add(rim);
          const key = new THREE.DirectionalLight(0xffffff, 1.4);
          key.position.set(-5, 4, 6);
          scene.add(key);

          const finishes = {
            chrome: { color: 0xe9ecf2, metalness: 1, roughness: 0.16 },
            gold: { color: 0xe7bf6a, metalness: 1, roughness: 0.2 },
            matte: { color: 0xe8e2d8, metalness: 0, roughness: 0.62 },
          };
          const material = new THREE.MeshStandardMaterial(finishes[V.finish] || finishes.chrome);

          // Beside this file when mounted; a runtime without assetUrl keeps the plain path.
          const assetUrl = (path) =>
            typeof __hfHost !== "undefined" && __hfHost.assetUrl
              ? __hfHost.assetUrl(path)
              : path;
          // Geist Bold (OFL), basic Latin only, converted to three.js typeface JSON.
          const font = await new FontLoader().loadAsync(
            __hfAsset(assetUrl("assets/fonts/Geist-Bold.typeface.json")),
          );
          const text = String(V.text || "NOVA")
            .toUpperCase()
            .slice(0, 8)
            .split("");
          const SIZE = 1.5;
          const scale = SIZE / font.data.resolution;
          const tracking = 0.08;
          const word = new THREE.Group();
          scene.add(word);

          // One mesh per letter, pivoting on its baseline so each can flip up on its own beat.
          const letters = [];
          let cursor = 0;
          for (const ch of text) {
            const advance = ((font.data.glyphs[ch] || font.data.glyphs["?"]).ha || 600) * scale;
            if (ch.trim()) {
              const geometry = new TextGeometry(ch, {
                font,
                size: SIZE,
                depth: 0.42,
                curveSegments: 10,
                bevelEnabled: true,
                bevelThickness: 0.06,
                bevelSize: 0.035,
                bevelSegments: 5,
              });
              geometry.computeBoundingBox();
              const b = geometry.boundingBox;
              geometry.translate(-(b.min.x + b.max.x) / 2, 0, -0.21);
              const pivot = new THREE.Group();
              pivot.position.x = cursor + advance / 2;
              pivot.add(new THREE.Mesh(geometry, material));
              word.add(pivot);
              letters.push(pivot);
            }
            cursor += advance + tracking;
          }
          const width = cursor - tracking;
          for (const p of letters) p.position.x -= width / 2;
          // Longer words shrink to keep a margin either side.
          word.scale.setScalar(Math.min(1, 7.4 / width));

          const shadowCanvas = document.createElement("canvas");
          shadowCanvas.width = 512;
          shadowCanvas.height = 128;
          const sg = shadowCanvas.getContext("2d");
          const grad = sg.createRadialGradient(256, 64, 0, 256, 64, 256);
          grad.addColorStop(0, "rgba(0,0,0,0.6)");
          grad.addColorStop(1, "rgba(0,0,0,0)");
          sg.setTransform(1, 0, 0, 0.25, 0, 48);
          sg.fillStyle = grad;
          sg.fillRect(0, 0, 512, 512);
          const shadow = new THREE.Mesh(
            new THREE.PlaneGeometry(Math.min(width, 7.4) * 1.25, 1.4),
            new THREE.MeshBasicMaterial({
              map: new THREE.CanvasTexture(shadowCanvas),
              transparent: true,
              depthWrite: false,
            }),
          );
          shadow.rotation.x = -Math.PI / 2;
          shadow.position.y = -0.02;
          scene.add(shadow);

          const clamp01 = (x) => Math.min(1, Math.max(0, x));
          const easeOutBack = (x) => {
            const u = clamp01(x) - 1;
            return 1 + 2.2 * u * u * u + 1.2 * u * u;
          };
          const easeInOut = (x) => {
            const u = clamp01(x);
            return u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
          };

          host.render = (t) => {
            const D = host.duration;
            const k = Math.min(1, D / 5);
            letters.forEach((p, i) => {
              const u = easeOutBack((t - 0.1 * k - i * 0.13 * k) / (0.9 * k));
              // Lying face-down behind the baseline at 0, standing at 1.
              p.rotation.x = (1 - u) * (-Math.PI / 2);
              p.position.y = (1 - clamp01(u)) * -0.2;
              p.visible = t >= 0.1 * k + i * 0.13 * k;
            });
            const swing = easeInOut((t - 0.9 * k) / (D - 0.9 * k - 0.7 * k));
            word.rotation.y = -0.42 + swing * 0.42;
            word.rotation.x = 0.04 - swing * 0.04;
            renderer.render(scene, camera);
          };
          host.render(host.clock.t);
          host.ready();
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0c0d12">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="el-root"
          data-composition-id="extruded-logo"
          data-start="0"
          data-duration="5"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[
        &#123; "id": "text", "type": "string", "role": "content", "label": "Word or lettermark", "description": "Basic Latin letters, digits and punctuation only; other characters render as ?", "default": "NOVA", "maxLength": 8 &#125;,
        &#123; "id": "tagline", "type": "string", "role": "content", "label": "Tagline", "default": "Ships Thursday", "maxLength": 40 &#125;,
        &#123; "id": "finish", "type": "enum", "role": "style", "label": "Finish", "default": "chrome", "options": [ &#123; "value": "chrome", "label": "Chrome" &#125;, &#123; "value": "gold", "label": "Gold" &#125;, &#123; "value": "matte", "label": "Matte clay" &#125; ] &#125;,
        &#123; "id": "rim_color", "type": "color", "role": "style", "label": "Rim light", "default": "#fff4e6" &#125;,
        &#123; "id": "background", "type": "color", "role": "style", "label": "Backdrop", "default": "#0c0d12" &#125;
      ]'>
          <canvas
            id="el-canvas"
            class="clip"
            data-start="0"
            data-duration="5"
            data-track-index="1"
          ></canvas>
          <div id="el-tagline"></div>
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
    background: #0c0d12;
  }
  #el-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background:
      radial-gradient(900px 560px at 50% 46%, rgba(255, 255, 255, 0.09), transparent 70%),
      var(--el-bg, #0c0d12);
  }
  #el-canvas {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #el-tagline {
    position: absolute;
    left: 0;
    right: 0;
    top: 790px;
    text-align: center;
    font:
      500 38px/1.2 "EL Inter",
      system-ui,
      sans-serif;
    letter-spacing: 0.02em;
    color: rgba(236, 238, 245, 0.72);
    opacity: 0;
  }
}
</style>
