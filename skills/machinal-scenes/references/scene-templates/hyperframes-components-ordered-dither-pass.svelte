<!-- Modified Svelte adaptation of registry/components/ordered-dither-pass/ordered-dither-pass.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

                var root = document.getElementById("root");
                var stage = root.querySelector(".odp-stage");
                var canvas = root.querySelector(".odp-canvas");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function num(value, fallback, min, max) {
                  var n = Number(value);
                  if (!isFinite(n)) n = fallback;
                  return Math.max(min, Math.min(max, n));
                }

                var matrixSize = vars.matrix === "2" || vars.matrix === "8" ? Number(vars.matrix) : 4;
                var direction = vars.direction === "out" ? "out" : "in";
                var levels = Math.round(num(vars.levels, 2, 2, 6));
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";
                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                // Bundler mirrors composition variables as scoped CSS custom
                // props; when this unit's accent variable shadows the --accent
                // token ("blue" is a valid CSS color), fall back to the literal.
                var computedAccent = getComputedStyle(root).getPropertyValue("--accent").trim();
                if (
                  computedAccent === "green" ||
                  computedAccent === "blue" ||
                  computedAccent === "violet"
                ) {
                  accentColors.blue = "#61a8ff";
                }

                // Envelope.
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "3.5"));
                var OUT = exit === "none" ? 0 : 0.45;
                var RAMP_AT = 0.4;
                var RAMP = Math.min(1.6, Math.max(0.6, duration - OUT - RAMP_AT - 0.4));
                var FADE_IN = 0.25;
                var OUT_START = duration - OUT;

                // Display canvas basis, fixed once at mount.
                var dpr = Math.min(2, Math.max(1, Number(window.devicePixelRatio) || 1));
                var box = root.getBoundingClientRect();
                var cssW = Math.max(1, Math.round(box.width) || 640);
                var cssH = Math.max(1, Math.round(box.height) || 360);
                canvas.width = Math.round(cssW * dpr);
                canvas.height = Math.round(cssH * dpr);
                var ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = false;

                // Reduced-resolution pixel buffer: one dither pixel is about 3
                // display px (capped 640 wide), the chunky retro read AND the
                // per-frame loop budget.
                var bufW = Math.max(8, Math.min(640, Math.round(cssW / 3)));
                var bufH = Math.max(8, Math.round(bufW * (cssH / cssW)));

                // Resolve tokens to concrete values once at mount.
                var hostDoc = root.ownerDocument;
                function resolveColor(cssColor, fallback) {
                  var probe = hostDoc.createElement("span");
                  probe.style.color = cssColor;
                  root.appendChild(probe);
                  var out = getComputedStyle(probe).color || fallback;
                  probe.remove();
                  return out;
                }
                function parseRgb(color, fallback) {
                  var m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(color);
                  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : fallback;
                }
                var bgColor = resolveColor("var(--bg, #0b0c0e)", "#0b0c0e");
                var bgRgb = parseRgb(bgColor, [11, 12, 14]);
                var accentRgb = parseRgb(
                  resolveColor(accentColors[accent], "#71f5a7"),
                  [113, 245, 167],
                );
                var monoFamily = (function () {
                  var probe = hostDoc.createElement("span");
                  probe.style.fontFamily =
                    'var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace)';
                  root.appendChild(probe);
                  var out = getComputedStyle(probe).fontFamily || "monospace";
                  probe.remove();
                  return out;
                })();

                // Bayer matrix, generated recursively; thresholds normalized to
                // (i + 0.5) / n^2 in [0, 1).
                var bayer = (function () {
                  var m = [[0]];
                  var size = 1;
                  while (size < matrixSize) {
                    var next = [];
                    for (var y = 0; y < size * 2; y += 1) next.push(new Array(size * 2));
                    for (var yy = 0; yy < size; yy += 1) {
                      for (var xx = 0; xx < size; xx += 1) {
                        var v = 4 * m[yy][xx];
                        next[yy][xx] = v;
                        next[yy][xx + size] = v + 2;
                        next[yy + size][xx] = v + 3;
                        next[yy + size][xx + size] = v + 1;
                      }
                    }
                    m = next;
                    size *= 2;
                  }
                  var n2 = matrixSize * matrixSize;
                  var flat = new Float64Array(n2);
                  for (var by = 0; by < matrixSize; by += 1) {
                    for (var bx = 0; bx < matrixSize; bx += 1) {
                      flat[by * matrixSize + bx] = (m[by][bx] + 0.5) / n2;
                    }
                  }
                  return flat;
                })();

                // Source raster at buffer resolution, composited over the bg.
                var raster = hostDoc.createElement("canvas");
                raster.width = bufW;
                raster.height = bufH;
                var rctx = raster.getContext("2d");

                var srcData = null; // Uint8ClampedArray, fixed after raster
                var rasterReady = false;

                function paintMonogram(target, w, h) {
                  var m = Math.min(w, h);
                  target.fillStyle = bgColor;
                  target.fillRect(0, 0, w, h);
                  var tile = m * 0.62;
                  var x = (w - tile) / 2;
                  var y = (h - tile) / 2;
                  target.fillStyle = resolveColor(
                    "color-mix(in srgb, var(--surface, #14171c) 72%, " + accentColors[accent] + ")",
                    "#1a2a22",
                  );
                  target.beginPath();
                  if (target.roundRect) target.roundRect(x, y, tile, tile, m * 0.06);
                  else target.rect(x, y, tile, tile);
                  target.fill();
                  target.fillStyle = resolveColor(
                    "color-mix(in srgb, var(--fg, #f8fafc) 30%, " + accentColors[accent] + ")",
                    "#a8f5c8",
                  );
                  target.font = "600 " + Math.round(m * 0.36) + "px " + monoFamily;
                  target.textAlign = "center";
                  target.textBaseline = "middle";
                  target.fillText("H", w / 2, h / 2 + m * 0.014);
                }

                function finishRaster() {
                  srcData = rctx.getImageData(0, 0, bufW, bufH).data;
                  rasterReady = true;
                  root.setAttribute("data-odp-raster", "ready");
                  paint(tl ? tl.time() : 0);
                }

                // SLOT. Rasterized through an SVG foreignObject snapshot of the
                // slot markup plus every host <style> tag and the resolved
                // contract tokens.
                var slotTemplate = null;
                try {
                  slotTemplate = hostDoc.querySelector(
                    'template[data-slot="ordered-dither-pass-scene"]',
                  );
                } catch (error) {
                  slotTemplate = null;
                }

                if (slotTemplate) {
                  var tokenNames = [
                    "--bg",
                    "--fg",
                    "--muted",
                    "--surface",
                    "--border",
                    "--brand",
                    "--accent",
                    "--accent-2",
                    "--font-display",
                    "--font-body",
                    "--font-mono",
                    "--radius",
                    "--space-1",
                    "--space-2",
                    "--space-3",
                    "--dur-beat",
                    "--ease-standard",
                    "--ease-emphasis",
                  ];
                  var rootStyle = getComputedStyle(root);
                  var tokenDecl = "";
                  for (var ti = 0; ti < tokenNames.length; ti += 1) {
                    var tv = rootStyle.getPropertyValue(tokenNames[ti]).trim();
                    if (tv) tokenDecl += tokenNames[ti] + ":" + tv + ";";
                  }
                  var styleTexts = "";
                  var styleTags = hostDoc.querySelectorAll("style");
                  for (var si = 0; si < styleTags.length; si += 1) {
                    styleTexts += styleTags[si].textContent || "";
                  }
                  // Snapshot at css size for faithful layout, then downsample
                  // into the buffer raster.
                  var wrapper = hostDoc.createElement("div");
                  wrapper.setAttribute(
                    "style",
                    "width:" +
                      cssW +
                      "px;height:" +
                      cssH +
                      "px;overflow:hidden;position:relative;" +
                      "display:grid;place-items:center;background:" +
                      bgColor +
                      ";" +
                      tokenDecl,
                  );
                  wrapper.appendChild(hostDoc.importNode(slotTemplate.content, true));
                  var styleEl = hostDoc.createElement("style");
                  styleEl.textContent = styleTexts;
                  wrapper.insertBefore(styleEl, wrapper.firstChild);
                  var serialized = new XMLSerializer().serializeToString(wrapper);
                  var svgMarkup =
                    // No xmlns on foreignObject: a default xmlns declaration
                    // applies to the declaring element itself and would eject
                    // foreignObject from the SVG namespace (renders blank). The
                    // serialized wrapper div already carries the XHTML namespace.
                    '<svg xmlns="http://www.w3.org/2000/svg" width="' +
                    cssW +
                    '" height="' +
                    cssH +
                    '"><foreignObject width="' +
                    cssW +
                    '" height="' +
                    cssH +
                    '">' +
                    serialized +
                    "</foreignObject></svg>";
                  var snapshot = new Image();
                  snapshot.onload = function () {
                    rctx.fillStyle = bgColor;
                    rctx.fillRect(0, 0, bufW, bufH);
                    rctx.drawImage(snapshot, 0, 0, bufW, bufH);
                    try {
                      finishRaster();
                    } catch (error) {
                      // Tainted or unreadable snapshot: fall back to the monogram.
                      paintMonogram(rctx, bufW, bufH);
                      finishRaster();
                    }
                  };
                  snapshot.onerror = function () {
                    paintMonogram(rctx, bufW, bufH);
                    finishRaster();
                  };
                  snapshot.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgMarkup);
                } else {
                  paintMonogram(rctx, bufW, bufH);
                  srcData = rctx.getImageData(0, 0, bufW, bufH).data;
                  rasterReady = true;
                  root.setAttribute("data-odp-raster", "ready");
                }

                var outImage = rctx.createImageData(bufW, bufH);

                function clamp01(v) {
                  return v < 0 ? 0 : v > 1 ? 1 : v;
                }

                // The whole pass is one scalar a(t) in [0, 1]: 1 = pure 2-tone
                // noise, 0 = clean source.
                //   contrast = clamp01((1 - a) * 1.6)  signal emerges under dither
                //   cleanMix = clamp01(((1 - a) - 0.55) / 0.45)  dither releases
                //   duoMix   = clamp01((a - 0.55) / 0.45)  noise phase is duotone
                function amountAt(t) {
                  var p = clamp01((t - RAMP_AT) / RAMP);
                  // power1.inOut
                  p = p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p);
                  return direction === "in" ? 1 - p : p;
                }

                // Pure repaint from (srcData, bayer, t): every output pixel is
                // rewritten, no state survives between frames.
                function paint(timeSeconds) {
                  ctx.fillStyle = bgColor;
                  ctx.fillRect(0, 0, canvas.width, canvas.height);
                  if (!rasterReady) return;
                  var fade = clamp01(timeSeconds / FADE_IN);
                  var a = amountAt(timeSeconds);
                  var contrast = clamp01((1 - a) * 1.6);
                  var cleanMix = clamp01((1 - a - 0.55) / 0.45);
                  var duoMix = clamp01((a - 0.55) / 0.45);
                  var L1 = levels - 1;
                  var out = outImage.data;
                  for (var y = 0; y < bufH; y += 1) {
                    var brow = (y % matrixSize) * matrixSize;
                    for (var x = 0; x < bufW; x += 1) {
                      var th = bayer[brow + (x % matrixSize)];
                      var i = (y * bufW + x) * 4;
                      var vr = 0.5 + (srcData[i] / 255 - 0.5) * contrast;
                      var vg = 0.5 + (srcData[i + 1] / 255 - 0.5) * contrast;
                      var vb = 0.5 + (srcData[i + 2] / 255 - 0.5) * contrast;
                      var qr = Math.floor(vr * L1 + th) / L1;
                      var qg = Math.floor(vg * L1 + th) / L1;
                      var qb = Math.floor(vb * L1 + th) / L1;
                      qr = qr < 0 ? 0 : qr > 1 ? 1 : qr;
                      qg = qg < 0 ? 0 : qg > 1 ? 1 : qg;
                      qb = qb < 0 ? 0 : qb > 1 ? 1 : qb;
                      // Noise phase is a BINARY luminance threshold, independent
                      // of levels: odd level counts put flat mid-gray exactly on
                      // a quantization step, which would render the "pure noise"
                      // pole as a flat field instead of the Bayer pattern.
                      var lum = 0.299 * vr + 0.587 * vg + 0.114 * vb;
                      var tone = lum > th ? 1 : 0;
                      var dr = bgRgb[0] + (accentRgb[0] - bgRgb[0]) * tone;
                      var dg = bgRgb[1] + (accentRgb[1] - bgRgb[1]) * tone;
                      var db = bgRgb[2] + (accentRgb[2] - bgRgb[2]) * tone;
                      var r = qr * 255 + (dr - qr * 255) * duoMix;
                      var g = qg * 255 + (dg - qg * 255) * duoMix;
                      var b = qb * 255 + (db - qb * 255) * duoMix;
                      r += (srcData[i] - r) * cleanMix;
                      g += (srcData[i + 1] - g) * cleanMix;
                      b += (srcData[i + 2] - b) * cleanMix;
                      out[i] = r;
                      out[i + 1] = g;
                      out[i + 2] = b;
                      out[i + 3] = 255;
                    }
                  }
                  rctx.putImageData(outImage, 0, 0);
                  ctx.globalAlpha = fade;
                  ctx.drawImage(raster, 0, 0, bufW, bufH, 0, 0, canvas.width, canvas.height);
                  ctx.globalAlpha = 1;
                  // putImageData reuses the raster canvas as a blit surface;
                  // srcData is a detached copy, so the source stays pristine.
                }

                gsap.set(stage, { opacity: 1, y: "0cqh" });

                var tl = gsap.timeline({
                  paused: true,
                  onUpdate: function () {
                    paint(tl.time());
                  },
                });

                // Anchor tween: spans the full authored duration so onUpdate
                // (the canvas repaint) fires for every eventful seek in [0, D]
                // and holds keep tl.time() honest.
                tl.to({ t: 0 }, { t: 1, duration: duration, ease: "none" }, 0);

                // HOLD: truly still (a(t) is constant past the ramp, the source
                // raster never changes).

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "up") {
                  tl.to(stage, { y: "-4cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                paint(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "matrix", "type": "enum", "role": "style", "label": "Matrix", "description": "Bayer matrix size: 2 is the coarsest crosshatch, 8 the smoothest ordered grain.", "default": "4", "options": [&#123; "value": "2", "label": "2 x 2" &#125;, &#123; "value": "4", "label": "4 x 4" &#125;, &#123; "value": "8", "label": "8 x 8" &#125;] &#125;,
        &#123; "id": "direction", "type": "enum", "role": "timing", "label": "Direction", "description": "in resolves noise to clean; out dissolves clean to noise and holds it.", "default": "in", "options": [&#123; "value": "in", "label": "Noise to clean" &#125;, &#123; "value": "out", "label": "Clean to noise" &#125;] &#125;,
        &#123; "id": "levels", "type": "number", "role": "style", "label": "Levels", "description": "Quantization levels per color channel during the dithered phase.", "default": 2, "min": 2, "max": 6, "step": 1 &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Light tone of the 2-tone noise phase: green rides --brand, blue rides --accent, violet rides --accent-2.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the final state holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="3.5" data-composition-id="ordered-dither-pass" data-duration="3.5" data-fps="30">
            
    
            <div
              id="ordered-dither-pass-clip"
              class="odp-clip clip"
              data-start="0"
              data-duration="3.5"
              data-track-index="0"
            >
              <div class="odp-stage">
                <canvas class="odp-canvas" aria-hidden="true"></canvas>
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
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }

  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, "Inter", system-ui, sans-serif);
    pointer-events: none;
  }

  .odp-clip {
    position: absolute;
    inset: 0;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .odp-stage {
    position: absolute;
    inset: 0;
    will-change: transform, opacity;
  }

  .odp-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
