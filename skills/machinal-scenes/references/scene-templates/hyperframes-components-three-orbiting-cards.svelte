<!-- Modified Svelte adaptation of registry/components/three-orbiting-cards/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    const host = document.querySelector(".hf-advanced-three-orbiting-cards");
          const canvas = host.querySelector("canvas");
          const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
          renderer.setPixelRatio(1);
          renderer.setSize(760, 430, false);
          renderer.setClearColor(0x050816, 1);

          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(36, 760 / 430, 0.1, 100);
          camera.position.set(0, 0, 7);

          const group = new THREE.Group();
          scene.add(group);
          const material = new THREE.MeshStandardMaterial({
            color: 0x60a5fa,
            metalness: 0.18,
            roughness: 0.38,
          });
          const accent = new THREE.MeshStandardMaterial({
            color: 0xa78bfa,
            metalness: 0.12,
            roughness: 0.44,
          });
          const geometry = new THREE.BoxGeometry(1.2, 1.2, 0.08);
          for (let i = 0; i < 9; i++) {
            const mesh = new THREE.Mesh(geometry, i % 2 ? accent : material);
            const angle = (i / 9) * Math.PI * 2;
            const radius = 2.15;
            mesh.position.set(
              Math.cos(angle) * radius,
              Math.sin(angle) * radius * 0.55,
              Math.sin(angle) * 0.7,
            );
            mesh.rotation.z = angle;
            group.add(mesh);
          }
          scene.add(new THREE.AmbientLight(0xffffff, 1.2));
          const light = new THREE.DirectionalLight(0xffffff, 2.2);
          light.position.set(2, 3, 4);
          scene.add(light);

          const state = { progress: 0 };
          function render() {
            const t = state.progress;
            group.rotation.y = t * Math.PI * 2;
            group.rotation.x = Math.sin(t * Math.PI * 2) * 0.22;
            camera.position.z = 6.4 - Math.sin(t * Math.PI) * 0.55;
            renderer.render(scene, camera);
          }
          render();

          window.__hfThreeRender_three_orbiting_cards = { state, render };

          const tl = gsap.timeline({ paused: true });
          tl.to(state, { progress: 1, duration: 4, ease: "none", onUpdate: render }, 0.5);
          tl.set({}, {}, 5);
          
          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="three-orbiting-cards-demo"
          data-start="0"
          data-width="1920"
          data-height="1080"
          data-duration="5"
        >
          <div class="hf-advanced-three-orbiting-cards">
            <canvas></canvas>
            <div class="label">
              <h3>Three Orbiting Cards</h3>
              <p>
                A Three.js-powered orbit scene driven by a paused GSAP timeline for deterministic
                renders.
              </p>
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
  .hf-advanced-three-orbiting-cards {
    color: #111827;
    font-family: Inter, system-ui, sans-serif;
  }
  .hf-advanced-three-orbiting-cards {
    position: relative;
    width: 760px;
    height: 430px;
    border-radius: 30px;
    overflow: hidden;
    background: #050816;
    box-shadow: 0 28px 80px rgba(15, 23, 42, 0.2);
    /* ponytail: zoom scales the whole card without touching GSAP-animated state */
    zoom: 1.65;
  }
  .hf-advanced-three-orbiting-cards canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  .hf-advanced-three-orbiting-cards .label {
    position: absolute;
    left: 28px;
    bottom: 26px;
    color: #fff;
  }
  .hf-advanced-three-orbiting-cards h3 {
    margin: 0;
    font-size: 34px;
    letter-spacing: -0.05em;
  }
  .hf-advanced-three-orbiting-cards p {
    margin: 6px 0 0;
    font-size: 15px;
    color: rgba(255, 255, 255, 0.72);
  }
}
</style>
