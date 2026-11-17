<!-- Modified Svelte adaptation of registry/blocks/weight-wave/weight-wave.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-weight-wave';
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
              

              var FONT_FAMILY = '"Recursive Wave", sans-serif';
              /* The bundled font's real fvar bounds — declared once here, and
                 mirrored in the variable min/max above. A slider must not offer a
                 weight the font cannot render. */
              var WGHT_MIN = 300;
              var WGHT_MAX = 1000;
              var SLNT_MIN = -15;
              var LINE_MAX_WIDTH = 1760;
              var BASE_FONT_SIZE = 132;
              var MIN_FONT_SIZE = 40;

              var root = document.getElementById("ww-root");
              var line = document.getElementById("ww-line");
              var duration = Number(root.getAttribute("data-duration")) || 6;

              var vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              function num(value, fallback, min, max) {
                var n = Number(value);
                if (!Number.isFinite(n)) n = fallback;
                return Math.min(max, Math.max(min, n));
              }

              var TEXT =
                typeof vars.text === "string" && vars.text.length
                  ? vars.text
                  : "PRESSURE MOVES THROUGH TYPE";
              var W_FROM = num(vars.weightFrom, 400, WGHT_MIN, WGHT_MAX);
              var W_TO = num(vars.weightTo, 1000, WGHT_MIN, WGHT_MAX);
              var CREST = num(vars.crestWidth, 4, 1, 24);
              var SPEED = num(vars.sweepSpeed, 0.5, 0.05, 3);
              var SLANT = num(vars.slant, -12, SLNT_MIN, 0);
              var RTL = vars.direction === "rtl";

              /* ── Build one span per character ─────────────────────────────────
                 Spaces get a span too, so the crest travels at a constant rate in
                 index space and the visual gap between words is honoured. */
              var chars = Array.prototype.slice.call(TEXT);
              var spans = chars.map(function (ch) {
                var el = document.createElement("span");
                el.className = "ww-ch";
                el.textContent = ch;
                line.appendChild(el);
                return el;
              });
              var N = spans.length;

              /* Fit at the HEAVIEST instance so the line never overflows mid-sweep;
                 the crest widens glyphs as it passes. */
              var fitCanvas = document.createElement("canvas").getContext("2d");
              var heaviest = Math.max(W_FROM, W_TO);
              var fontSize = BASE_FONT_SIZE;
              while (fontSize > MIN_FONT_SIZE) {
                fitCanvas.font = heaviest + " " + fontSize + "px " + FONT_FAMILY;
                if (fitCanvas.measureText(TEXT).width <= LINE_MAX_WIDTH) break;
                fontSize -= 2;
              }
              line.style.fontSize = fontSize + "px";

              /* ── The wave ─────────────────────────────────────────────────────
                 Closed form, no accumulators: every frame's state is a pure
                 function of the timeline position p, so a direct seek to frame N
                 and playing through to frame N produce identical pixels.

                   crest(p) = -CREST + wrap(p * duration * SPEED) * (N - 1 + 2*CREST)
                   f_i      = clamp(0, 1, 1 - |i - crest| / CREST)
                   wght_i   = round(lerp(W_FROM, W_TO, f_i))
                   slnt_i   = lerp(0, SLANT, f_i)

                 Per-character stagger is not a separate mechanism — it falls out of
                 the crest's distance to each index. */
              var state = { p: 0 };
              var travel = N - 1 + 2 * CREST;

              function paint() {
                var pass = state.p * duration * SPEED;
                var phase = pass - Math.floor(pass); // wraps cleanly: f_i == 0 at both ends
                var crest = -CREST + phase * travel;
                if (RTL) crest = N - 1 - crest;
                for (var i = 0; i < N; i++) {
                  var f = 1 - Math.abs(i - crest) / CREST;
                  if (f < 0) f = 0;
                  else if (f > 1) f = 1;
                  var wght = Math.round(W_FROM + (W_TO - W_FROM) * f);
                  var slnt = SLANT * f;
                  spans[i].style.fontVariationSettings =
                    '"wght" ' + wght + ', "slnt" ' + slnt.toFixed(2);
                }
              }

              var tl = gsap.timeline({ paused: true });
              tl.to(state, { p: 1, duration: duration, ease: "none", onUpdate: paint }, 0);
              paint();
              __hfTimelineSlot.set(tl);

              /* ── The trap, made loud ──────────────────────────────────────────
                 A static font (or a failed load) renders every character at one
                 weight: the effect is invisible and nothing throws.

                 Measuring advance width does NOT detect that here. Recursive is
                 DUPLEXED — "HAMBURGEFONSTIV" measures exactly 925px at wght 300 and
                 at wght 1000, and identically at slnt 0 and -15. (Nice for layout:
                 the headline never reflows as the crest passes. Fatal for a
                 width-delta probe, which reads every weight as identical and cries
                 wolf on a perfectly healthy font.)

                 So rasterize and count ink, which cannot be duplexed away, AND ask
                 the font-loading API whether the family is actually there. Both are
                 needed: ink alone gives a false PASS when the family is missing,
                 because the fallback varies its ink with weight too. */
              function probeAxes() {
                var family = "Recursive Wave";
                var loaded = !!(document.fonts && document.fonts.check('100px "' + family + '"'));
                var c = document.createElement("canvas");
                c.width = 1000;
                c.height = 160;
                var ctx = c.getContext("2d", { willReadFrequently: true });
                function ink(weight) {
                  ctx.clearRect(0, 0, c.width, c.height);
                  ctx.font = weight + ' 100px "' + family + '"';
                  ctx.fillStyle = "#fff";
                  ctx.fillText("HAMBURGEFONSTIV", 10, 120);
                  var data = ctx.getImageData(0, 0, c.width, c.height).data;
                  var n = 0;
                  for (var i = 3; i < data.length; i += 4) if (data[i] > 8) n++;
                  return n;
                }
                var light = ink(WGHT_MIN);
                var black = ink(WGHT_MAX);
                // Only wght is probed: it is the axis whose absence is measurable
                // from JS, and both axes ship in the same file — if wght is live,
                // the variable font loaded. slnt is verified visually.
                return {
                  fontLoaded: loaded,
                  wghtLive: black > light * 1.2,
                  inkAtMinWeight: light,
                  inkAtMaxWeight: black,
                };
              }

              function publishProbe() {
                var status = probeAxes();
                status.ok = status.fontLoaded && status.wghtLive;
                window.__WW_FONT_STATUS = status;
                root.setAttribute("data-ww-font", status.ok ? "ok" : "missing-axes");
                if (!status.ok) {
                  console.error(
                    "weight-wave: the variable font is not usable (loaded=" +
                      status.fontLoaded +
                      ", ink at wght " +
                      WGHT_MIN +
                      "=" +
                      status.inkAtMinWeight +
                      " vs " +
                      WGHT_MAX +
                      "=" +
                      status.inkAtMaxWeight +
                      "). assets/fonts/Recursive-wght-slnt-latin.woff2 did not load, or was " +
                      "replaced with a static font — every character will render at one weight.",
                  );
                }
              }

              if (document.fonts && document.fonts.ready) {
                document.fonts.ready.then(publishProbe);
              } else {
                publishProbe();
              }
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="ww-root"
          data-composition-id="weight-wave"
          data-start="0"
          data-duration="6"
          data-width="1920"
          data-height="1080"
          data-composition-variables='[
            &#123;"id":"text","type":"string","label":"Headline","default":"PRESSURE MOVES THROUGH TYPE","maxLength":64&#125;,
            &#123;"id":"color","type":"color","label":"Text color","default":"#f5f5f7"&#125;,
            &#123;"id":"background","type":"color","label":"Background","default":"#0b0b0d"&#125;,
            &#123;"id":"weightFrom","type":"number","label":"Weight (rest)","default":400,"min":300,"max":1000,"step":10&#125;,
            &#123;"id":"weightTo","type":"number","label":"Weight (crest)","default":1000,"min":300,"max":1000,"step":10&#125;,
            &#123;"id":"crestWidth","type":"number","label":"Crest width","default":4,"min":1,"max":24,"step":0.5,"unit":"chars"&#125;,
            &#123;"id":"sweepSpeed","type":"number","label":"Sweep speed","default":0.5,"min":0.05,"max":3,"step":0.05,"unit":"passes/s"&#125;,
            &#123;"id":"slant","type":"number","label":"Slant at crest","default":-12,"min":-15,"max":0,"step":0.5,"unit":"deg"&#125;,
            &#123;"id":"direction","type":"enum","label":"Direction","default":"ltr","options":[&#123;"value":"ltr","label":"Left to right"&#125;,&#123;"value":"rtl","label":"Right to left"&#125;]&#125;
          ]'
        >
          <div id="ww-bg"></div>
    
          <div id="ww-stage" class="clip" data-start="0" data-duration="6" data-track-index="0">
            <div id="ww-line"></div>
          </div>
    
          
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  /*
  Real variable font, bundled locally — a CDN fetch would be a render-time
  network dependency, and a STATIC font would silently render every
  character at one weight (the whole effect vanishes while nothing errors).
  Subset of Recursive (SIL OFL 1.1) with every axis pinned except the two
  this block drives. Ranges below are the font's REAL fvar records, read
  out of the binary: wght 300..1000 (not 100..900) and slnt -15..0. The
  pinned three are MONO 0 (proportional sans, not the monospace face),
  CASL 0 (linear/neutral, not casual) and CRSV 0 (roman letterforms —
    Recursive's 0.5 default swaps in cursive singlestorey forms as soon as
    slnt goes negative, which would pop mid-wave instead of interpolating).
  */



  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
  }

  #ww-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }

  /* Full-bleed fill lives on a CHILD: the producer can drop a background
  painted on the composition root itself (frame renders black). */
  #ww-bg {
    position: absolute;
    inset: 0;
    background: var(--background, #0b0b0d);
  }

  #ww-stage {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  #ww-line {
    display: block;
    width: 1760px;
    text-align: center;
    white-space: pre;
    font-family: "Recursive Wave", sans-serif;
    font-size: 132px;
    line-height: 1.15;
    letter-spacing: 0.005em;
    color: var(--color, #f5f5f7);
    /* Default instance: the resting end of the wave. If the variable font
    fails to load, every glyph stays here and the probe below shouts. */
    font-variation-settings:
      "wght" 400,
      "slnt" 0;
  }

  /* Per-character axis stamping target: no transform, no opacity — the
  letterforms themselves change. */
  .ww-ch {
    display: inline-block;
  }
}
</style>
