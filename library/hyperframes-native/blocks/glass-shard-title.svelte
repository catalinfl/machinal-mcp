<!-- Modified Svelte adaptation of registry/blocks/glass-shard-title/glass-shard-title.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as d3 from 'd3-delaunay';
  import { mountGlassShard } from '@machinal/hyperframes/vendor/glass-shard';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-glass-shard-title';
  import __hfAsset from '@machinal/hyperframes/media/blocks-glass-shard-title';
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

          /* ================================================================
             glass-shard-title — iridescent glass shards fly in from the left
             and right edges, assemble into the headline, idle with a slight
             rotation, then fly back out and leave the frame empty.

             The ONLY content is the headline. Flat dark background.

             Seek-safety: the timeline drives two master progresses (tin, tout)
             plus the material resolve; every per-shard position/rotation is a
             pure function of those masters and st.time. No rAF, no
             integrators, no Math.random(). Shard layout is seeded and built
             after fonts load (cell selection samples the rasterised text).
             ================================================================ */
          
          /* Studio's variables/SDK parser fails on any composition with a <canvas>
             in its MARKUP (verified by bisection) — so the canvas is created at
             runtime instead. Identical for preview/render; invisible to the parser.

             Guarded: if this script is evaluated twice in one document a second
             <canvas id="gst-canvas"> would be appended, getElementById would keep
             returning the FIRST one, and the second three.js renderer would be
             built on a canvas that already owns a live WebGL context. */
          (function () {
            if (document.getElementById("gst-canvas")) return;
            var c = document.createElement("canvas");
            c.id = "gst-canvas";
            c.width = 1920;
            c.height = 1080;
            document.getElementById("gst-canvas-clip").appendChild(c);
          })();

          window.gstMulberry32 = gstMulberry32;
          function gstMulberry32(seed) {
            return function () {
              var s = (seed = (seed + 0x6d2b79f5) | 0);
              var t = Math.imul(s ^ (s >>> 15), 1 | s);
              t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
              return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
            };
          }

          (function () {
            var DUR = 9;

            /* ---- Studio variables ---- */
            var vars = {
              headline: "Designed in glass",
              tileCount: 8,
              roundness: 0.4,
              bevel: 0.35,
              meshSmooth: 0.6,
              flyInTime: 2.3,
              flyOutTime: 2.4,
              stagger: 0.27,
              flyInRotation: 5,
              flyOutRotation: 6,
              chaos: 0.25,
              padding: 1,
              sizeVariance: 0.35,
              gap: 0.03,
              easePow: 10,
              sideDist: 3,
              zDist: -42,
              zOut: 14,
              fog: 36,
            };
            try {
              if (__hfHost && __hfHost.getVariables) {
                var v = __hfHost.getVariables() || {};
                if (v.headline) vars.headline = String(v.headline);
                if (v.title) vars.headline = String(v.title); /* legacy id */
                if (v.tileCount !== undefined && isFinite(Number(v.tileCount)))
                  vars.tileCount = Number(v.tileCount);
                if (v.roundness !== undefined && isFinite(Number(v.roundness)))
                  vars.roundness = Number(v.roundness);
                if (v.bevel !== undefined && isFinite(Number(v.bevel))) vars.bevel = Number(v.bevel);
                if (v.meshSmooth !== undefined && isFinite(Number(v.meshSmooth)))
                  vars.meshSmooth = Number(v.meshSmooth);
                if (v.flyInTime !== undefined && isFinite(Number(v.flyInTime)))
                  vars.flyInTime = Number(v.flyInTime);
                if (v.flyOutTime !== undefined && isFinite(Number(v.flyOutTime)))
                  vars.flyOutTime = Number(v.flyOutTime);
                if (v.stagger !== undefined && isFinite(Number(v.stagger)))
                  vars.stagger = Number(v.stagger);
                /* Legacy callers may still provide spin. New controls override it
                   independently; the old multiplier/default keeps its meaning. */
                if (v.spin !== undefined && isFinite(Number(v.spin))) {
                  vars.flyInRotation = vars.flyOutRotation = Math.max(0, Math.min(6, Number(v.spin)));
                }
                if (v.flyInRotation !== undefined && isFinite(Number(v.flyInRotation)))
                  vars.flyInRotation = Number(v.flyInRotation);
                if (v.flyOutRotation !== undefined && isFinite(Number(v.flyOutRotation)))
                  vars.flyOutRotation = Number(v.flyOutRotation);
                if (v.zOut !== undefined && isFinite(Number(v.zOut))) vars.zOut = Number(v.zOut);
                if (v.chaos !== undefined && isFinite(Number(v.chaos))) vars.chaos = Number(v.chaos);
                if (v.padding !== undefined && isFinite(Number(v.padding)))
                  vars.padding = Number(v.padding);
                if (v.sizeVariance !== undefined && isFinite(Number(v.sizeVariance)))
                  vars.sizeVariance = Number(v.sizeVariance);
                if (v.gap !== undefined && isFinite(Number(v.gap))) vars.gap = Number(v.gap);
                if (v.easePow !== undefined && isFinite(Number(v.easePow)))
                  vars.easePow = Number(v.easePow);
                if (v.sideDist !== undefined && isFinite(Number(v.sideDist)))
                  vars.sideDist = Number(v.sideDist);
                if (v.zDist !== undefined && isFinite(Number(v.zDist))) vars.zDist = Number(v.zDist);
                if (v.fog !== undefined && isFinite(Number(v.fog))) vars.fog = Number(v.fog);
              }
            } catch (e) {
              /* keep defaults */
            }
            vars.tileCount = Math.max(1, Math.min(400, Math.round(vars.tileCount)));
            vars.roundness = Math.max(0, Math.min(1, vars.roundness));
            vars.bevel = Math.max(0, Math.min(1, vars.bevel));
            vars.meshSmooth = Math.max(0, Math.min(1, vars.meshSmooth));
            vars.flyInTime = Math.max(0.2, Math.min(6, vars.flyInTime));
            vars.flyOutTime = Math.max(0.2, Math.min(6, vars.flyOutTime));
            vars.stagger = Math.max(0, Math.min(1, vars.stagger));
            vars.flyInRotation = Math.max(0, Math.min(60, vars.flyInRotation));
            vars.flyOutRotation = Math.max(0, Math.min(6, vars.flyOutRotation));
            vars.zOut = Math.max(-400, Math.min(60, vars.zOut));
            vars.chaos = Math.max(0, Math.min(1, vars.chaos));
            vars.padding = Math.max(0, Math.min(1, vars.padding));
            vars.sizeVariance = Math.max(0, Math.min(1, vars.sizeVariance));
            vars.gap = Math.max(0, Math.min(0.3, vars.gap));
            vars.easePow = Math.max(1, Math.min(10, vars.easePow));
            vars.sideDist = Math.max(0, Math.min(60, vars.sideDist));
            /* zDist is a coordinate: accept "-200" style input, clamp behind pane. */
            vars.zDist = Math.min(0, Math.max(-400, vars.zDist > 0 ? -vars.zDist : vars.zDist));
            vars.fog = Math.max(0, Math.min(400, vars.fog));

            /* ---- Phase windows (speed compresses fly phases, hold absorbs) ---- */
            var IN_START = 0.12;
            var OUT_END = DUR - 0.35;
            /* Explicit flight durations; if in + out + a minimum hold exceed the
               composition, both scale down proportionally. */
            var MIN_HOLD = 0.5;
            var avail = OUT_END - IN_START - MIN_HOLD;
            var tIn = vars.flyInTime,
              tOut = vars.flyOutTime;
            if (tIn + tOut > avail) {
              var k = avail / (tIn + tOut);
              tIn *= k;
              tOut *= k;
            }
            var IN_WINDOW = tIn;
            var OUT_WINDOW = tOut;
            var OUT_START = OUT_END - OUT_WINDOW;

            /* Scripted state read by renderScene. */
            var st = {
              time: 0,
              tin: 0 /* master fly-in progress 0..1 */,
              tout: 0 /* master fly-out progress 0..1 */,
              thickness: 0.5,
              roughness: 0.07,
              ior: 1.52,
            };

            window.__GST = { DUR: DUR, st: st, vars: vars };

            /* ---- Timeline: paused, registered, hf-seek wired ---- */
            var tl = gsap.timeline({ paused: true });
            tl.eventCallback("onUpdate", function () {
              if (window.__gstRender) window.__gstRender();
            });
            /* Studio's player seeks with GSAP events suppressed and dispatches an
               hf-seek CustomEvent instead — re-sync and repaint so the stage follows. */
            /* Exactly one listener and one live timeline per document. A second
               evaluation of this script would otherwise stack another hf-seek
               listener and leave the previous paused timeline registered, so every
               seek would drive N timelines and repaint N times. Declared as a
               named function (not an arrow) so the reference read back off window
               is identical and removeEventListener actually matches. */
            function gstOnSeek(event) {
              var d = event && event.detail;
              if (d && typeof d.time === "number")
                tl.totalTime(Math.min(d.time, tl.totalDuration()), true);
              var fn = tl.eventCallback("onUpdate");
              if (fn) fn();
            }
            if (window.__gstSeekHandler) window.removeEventListener("hf-seek", window.__gstSeekHandler);
            if (window.__gstTimeline && window.__gstTimeline !== tl) {
              try {
                window.__gstTimeline.kill();
              } catch (e) {
                /* best effort */
              }
            }
            window.__gstSeekHandler = gstOnSeek;
            window.__gstTimeline = tl;
            __hfListen("hf-seek", gstOnSeek);
            /* Release the listener and the timeline with the document. Skipped for
               a bfcache'd page, which is coming back with this stage still live. */
            __hfListen("pagehide", function (event) {
              if (event && event.persisted === true) return;
              window.removeEventListener("hf-seek", gstOnSeek);
              window.__gstSeekHandler = null;
              window.__gstTimeline = null;
              try {
                tl.kill();
              } catch (e) {
                /* best effort */
              }
            });

            tl.to(st, { time: DUR, duration: DUR, ease: "none" }, 0);
            tl.to(st, { tin: 1, duration: IN_WINDOW, ease: "none" }, IN_START);
            tl.to(st, { tout: 1, duration: OUT_WINDOW, ease: "none" }, OUT_START);

            /* Glass stays clear throughout. The old frosted->clear resolve made
               still-flying shards transmit a BLURRED copy of the already-seated
               text — the ghost headline — so it is gone. */

            __hfTimelineSlot.set(tl);
          })();
        

          
        
    const disposeGlass = await mountGlassShard(); __hfScene.resources.signal.addEventListener("abort", disposeGlass, { once: true });
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#0a0a0f">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          data-hf-id="hf-51pv"
          id="gst-root"
          data-composition-id="glass-shard-title"
          data-start="0"
          data-duration="12.16"
          data-width="1920"
          data-height="1080"
         data-composition-variables='[&#123;"id":"headline","type":"string","label":"Headline","default":"Designed in glass","maxLength":40&#125;,&#123;"id":"tileCount","type":"number","label":"Tiles","default":8,"min":1,"max":400,"step":1&#125;,&#123;"id":"roundness","type":"number","label":"Roundness (0-1)","default":0.4,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"bevel","type":"number","label":"Bevel (0-1)","default":0.35,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"meshSmooth","type":"number","label":"Surface smoothness (0-1)","default":0.6,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"flyInTime","type":"number","label":"Fly-in time (s)","default":2.3,"min":0.2,"max":6,"step":0.05&#125;,&#123;"id":"flyOutTime","type":"number","label":"Fly-out time (s)","default":2.4,"min":0.2,"max":6,"step":0.05&#125;,&#123;"id":"stagger","type":"number","label":"Stagger (0-1)","default":0.27,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"flyInRotation","type":"number","label":"Fly-in rotation (0-60)","description":"Amount of inbound tumbling over the entire flight. 0 disables flight rotation; final orientation lands with each shard position.","default":5,"min":0,"max":60,"step":0.1&#125;,&#123;"id":"flyOutRotation","type":"number","label":"Fly-out rotation (0-6)","default":6,"min":0,"max":6,"step":0.1&#125;,&#123;"id":"chaos","type":"number","label":"Outline chaos (0-1)","default":0.25,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"padding","type":"number","label":"Edge padding (0-1)","default":1,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"sizeVariance","type":"number","label":"Size variance (0-1)","default":0.35,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"gap","type":"number","label":"Tile gap","default":0.03,"min":0,"max":0.3,"step":0.002&#125;,&#123;"id":"easePow","type":"number","label":"Fly-in position ease (1-10)","description":"Shapes lateral and depth travel. Rotation uses the same staggered flight window with a gentle settle through arrival.","default":10,"min":1,"max":10,"step":0.1&#125;,&#123;"id":"sideDist","type":"number","label":"Side fly distance","default":3,"min":0,"max":60,"step":0.5&#125;,&#123;"id":"zDist","type":"number","label":"Z fly-from (negative)","default":-42,"min":-400,"max":0,"step":2&#125;,&#123;"id":"zOut","type":"number","label":"Z fly-out to (+ = past camera)","default":14,"min":-400,"max":60,"step":2&#125;,&#123;"id":"fog","type":"number","label":"Fog distance (0 = off)","default":36,"min":0,"max":400,"step":2&#125;]'>
          <div
            data-hf-id="hf-lsju"
            id="gst-canvas-clip"
            class="clip"
            data-start="0"
            data-duration="12.16"
            data-track-index="1"
            data-media-start="0"
          ></div>
          <div
            data-hf-id="hf-uo1i"
            id="gst-fontload"
            aria-hidden="true"
            data-start="0"
            data-duration="12.16"
            data-media-start="0"
          >
            <span data-hf-id="hf-kqtg" style="font-weight: 400">Aa</span
            ><span data-hf-id="hf-7bxm" style="font-weight: 600">Aa</span>
          </div>
          
          <a hidden id="gst-hdr" href={__hfAsset("assets/ferndale_studio_01_1k.hdr")}></a>
          <a hidden id="gst-matcap" href={__hfAsset("assets/matcap-1.png")}></a>
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
    background: #0a0a0f;
  }
  .hf-port {
    font-family: "Geist", ui-sans-serif, system-ui, sans-serif;
  }
  #gst-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #0a0a0f; /* flat — no gradients, no glow */
  }
  .clip {
    position: absolute;
    inset: 0;
  }
  #gst-canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
  #gst-fontload {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
