<!-- Modified Svelte adaptation of registry/blocks/yt-vertical-fill/yt-vertical-fill.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            /* ---- published parameters ----
               Vertical media filling a 16:9 frame — three fill modes:
               mode "scale" (big blurred copy behind), "mirror" (flanking
               mirrored copies), "copy" (flanking straight copies).
               IMAGES ONLY inside this block: the runtime never seeks media
               elements inside a sub-composition (renders black). For live
               vertical FOOTAGE, keep the media element in the HOST root
               positioned over the fg slot (left:656px width:608px) and feed
               this block a representative still for the fill layers. */
            var CONFIG = {
              src: null, // portrait IMAGE path; null -> stand-in gradient (demo)
              mode: "scale", // "scale" | "mirror" | "copy"
              fgContrast: 1.06,
              fgBrightness: 1.03,
              fgSaturation: 1.08,
              grid: { enabled: true },
              kenBurns: true,
              animationIn: true,
              animationOut: true,
            };

            var DUR = 8;
            function clamp(v, lo, hi) {
              return Math.min(hi, Math.max(lo, v));
            }
            var IN = clamp(DUR * 0.08, 0.3, 0.8);
            var OUT = clamp(DUR * 0.06, 0.25, 0.6);

            var root = document.getElementById("yt-vf-root");
            var bg = document.getElementById("yt-vf-bg");
            var sideL = document.getElementById("yt-vf-side-l");
            var sideR = document.getElementById("yt-vf-side-r");
            var fg = document.getElementById("yt-vf-fg");
            var grid = document.getElementById("yt-vf-grid");

            if (!CONFIG.grid.enabled) grid.style.display = "none";

            function media(id) {
              if (!CONFIG.src) {
                var d = document.createElement("div");
                d.className = "yt-vf-fill";
                d.textContent = "9:16";
                return d;
              }
              var img = document.createElement("img");
              img.src = CONFIG.src;
              img.id = id;
              return img;
            }

            fg.appendChild(media("yt-vf-m-fg"));
            fg.style.filter =
              "contrast(" +
              CONFIG.fgContrast +
              ") brightness(" +
              CONFIG.fgBrightness +
              ") saturate(" +
              CONFIG.fgSaturation +
              ")";

            if (CONFIG.mode === "scale") {
              bg.appendChild(media("yt-vf-m-bg"));
              sideL.style.display = "none";
              sideR.style.display = "none";
            } else {
              bg.style.display = "none";
              sideL.appendChild(media("yt-vf-m-l"));
              sideR.appendChild(media("yt-vf-m-r"));
              if (CONFIG.mode === "mirror") {
                sideL.firstChild.style.transform = "scaleX(-1)";
                sideR.firstChild.style.transform = "scaleX(-1)";
              }
              sideL.style.filter = "blur(6px) brightness(0.72)";
              sideR.style.filter = "blur(6px) brightness(0.72)";
            }

            var tl = gsap.timeline({ paused: true });

            if (CONFIG.animationIn) {
              tl.from(root, { opacity: 0, duration: IN, ease: "power2.out" }, 0);
              gsap.set(fg, { y: 34, opacity: 0 });
              tl.to(fg, { y: 0, opacity: 1, duration: IN * 1.6, ease: "power3.out" }, IN * 0.5);
            }
            if (CONFIG.kenBurns) {
              tl.fromTo(
                fg.firstChild,
                { scale: 1.05 },
                { scale: 1, duration: DUR - 1, ease: "sine.out" },
                0.4,
              );
            }

            if (CONFIG.animationOut) {
              tl.to(root, { opacity: 0, duration: OUT, ease: "power2.in" }, DUR - OUT - 0.05);
            }
            tl.set(root, { visibility: "hidden" }, DUR - 0.02);

            __hfTimelineSlot.set(tl);
          })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="yt-vf-root"
          data-composition-id="yt-vertical-fill"
          data-start="0"
          data-duration="8"
          data-width="1920"
          data-height="1080"
        >
          <div class="yt-vf-media" id="yt-vf-bg" data-layout-allow-overflow></div>
          <div class="yt-vf-media yt-vf-side" id="yt-vf-side-l" style="left: 0"></div>
          <div class="yt-vf-media yt-vf-side" id="yt-vf-side-r" style="right: 0"></div>
          <div id="yt-vf-scrim"></div>
          <div id="yt-vf-grid"></div>
          <div class="yt-vf-media" id="yt-vf-fg"></div>
          <div
            id="yt-vf-drv"
            class="clip"
            data-start="0"
            data-duration="8"
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
    background: transparent;
    overflow: hidden;
  }
  #yt-vf-root {
    /* ---- yt tokens ---- */
    --yt-font: "Inter", -apple-system, sans-serif;
    --yt-grid-size: 28px;
    --yt-grid-alpha: 0.05;
    --yt-stage: #101012;
    --yt-scrim: rgba(8, 8, 10, 0.28);
    --yt-cyan: #35c8d9;
    --yt-prism-b: #2a7fff;
    --yt-violet: #7d5cff;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: var(--yt-stage);
    font-family: var(--yt-font);
  }
  .yt-vf-media {
    position: absolute;
    overflow: hidden;
  }
  .yt-vf-media img, .yt-vf-media .yt-vf-fill {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  #yt-vf-bg {
    inset: -60px;
    filter: blur(42px) brightness(0.75);
  }
  .yt-vf-side {
    top: 0;
    bottom: 0;
    width: 656px;
  }
  #yt-vf-scrim {
    position: absolute;
    inset: 0;
    background: var(--yt-scrim);
  }
  #yt-vf-grid {
    position: absolute;
    inset: 0;
    background:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, var(--yt-grid-alpha)) 0 1px,
        transparent 1px var(--yt-grid-size)
      ),
      repeating-linear-gradient(
        90deg,
        rgba(255, 255, 255, var(--yt-grid-alpha)) 0 1px,
        transparent 1px var(--yt-grid-size)
      );
  }
  #yt-vf-fg {
    top: 0;
    bottom: 0;
    left: 656px;
    width: 608px;
    box-shadow: 0 0 90px rgba(0, 0, 0, 0.55);
  }
  /* stand-in portrait when no media is configured (self-demo) */
  .yt-vf-fill {
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 120px;
    color: rgba(255, 255, 255, 0.9);
    background: linear-gradient(
      160deg,
      var(--yt-cyan) 0%,
      var(--yt-prism-b) 50%,
      var(--yt-violet) 100%
    );
  }
}
</style>
