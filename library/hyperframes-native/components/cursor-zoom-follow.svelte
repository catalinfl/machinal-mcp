<!-- Modified Svelte adaptation of registry/components/cursor-zoom-follow/cursor-zoom-follow.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/components-cursor-zoom-follow';
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
    (function () {
              "use strict";

              var html = __hfRootElement.querySelector("[data-composition-id]") || __hfRootElement;
              var root = document.getElementById("root");
              var cam = document.getElementById("zf-cam");
              var cursor = document.getElementById("zf-cursor");
              var ripple = document.getElementById("zf-ripple");
              var range = document.getElementById("zf-range");
              var tip = document.getElementById("zf-tip");
              var exportBtn = document.getElementById("zf-export");
              var exportStates = exportBtn.children;
              var rangeLabel = document.getElementById("zf-range-label");
              var menu = document.getElementById("zf-menu");
              var rows = menu.children;
              var line = document.getElementById("zf-line");

              var DEFAULTS = {};
              try {
                JSON.parse(html.getAttribute("data-composition-variables") || "[]").forEach(
                  function (variable) {
                    DEFAULTS[variable.id] = variable.default;
                  },
                );
              } catch (error) {
                /* malformed declaration falls back to the inline defaults below */
              }
              var scopedVariables = {};
              try {
                if (__hfHost && typeof __hfHost.getVariables === "function") {
                  scopedVariables = __hfHost.getVariables() || {};
                }
              } catch (error) {
                /* no scoped variables API in this context */
              }
              var runtimeVars = Object.assign({}, __hfHost.variables || {}, scopedVariables);
              var vars = Object.assign({}, DEFAULTS, runtimeVars);

              function num(value, fallback, lo, hi) {
                var n = Number(value);
                if (!isFinite(n)) n = fallback;
                return Math.max(lo, Math.min(hi, n));
              }

              // Rebuilt from parsed digits, never the original string: a regex match
              // alone still carries the source text through, digit-by-digit reassembly
              // does not.
              function color(value, fallback) {
                var m = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(String(value == null ? "" : value));
                if (!m) return fallback;
                var hex = m[1].length === 3 ? m[1].replace(/(.)/g, "$1$1") : m[1];
                var r = parseInt(hex.slice(0, 2), 16);
                var g = parseInt(hex.slice(2, 4), 16);
                var b = parseInt(hex.slice(4, 6), 16);
                return "rgb(" + r + "," + g + "," + b + ")";
              }

              // Hardcoded: the compositor rewrites the wrapper's attributes on mount.
              var compositionId = "cursor-zoom-follow";
              var duration = Math.max(
                0.001,
                parseFloat(
                  root.dataset.duration || html.getAttribute("data-composition-duration") || "5.8",
                ),
              );
              var W = root.clientWidth || 1920;
              var H = root.clientHeight || 1080;
              var ZOOM = num(vars.zoom, 1.8, 1, 3);
              var accent = color(vars.accent, "rgb(10,132,255)");
              var u = W / 1920;
              // Mirrors @hyperframes/parsers' isSafeMediaUrl allowlist: this
              // composition has no build step to import it from, so the same
              // scheme rule (relative or http/https/blob/data:image only) is
              // inlined rather than trusting the raw variable into img.src.
              function safeImageUrl(value) {
                var s = typeof value === "string" ? value.trim() : "";
                if (s === "") return "";
                var stripped = s.replace(/[\u0000-\u0020]/g, "");
                var scheme = /^([a-z][a-z0-9+.-]*):/i.exec(stripped);
                if (!scheme) return s;
                var proto = scheme[1].toLowerCase();
                if (proto === "https" || proto === "http" || proto === "blob") return s;
                if (proto === "data") return /^data:image\//i.test(s) ? s : "";
                return "";
              }
              // Runtime variables only: the declared default is empty (the built-in
              // dashboard), and page markup never becomes an image URL.
              var image = safeImageUrl(runtimeVars.image);
              var builtIn = image === "";
              if (!builtIn) {
                var img = document.getElementById("zf-img");
                img.src = __hfAsset(image);
                img.style.display = "block";
                document.getElementById("zf-app").style.display = "none";
              }
              root.style.setProperty("--zf-accent", accent);
              ripple.style.borderWidth = 2 * u + "px";
              var ARROW = 64 * u;
              cursor.style.width = cursor.style.height = ARROW + "px";
              cursor.style.left = (-5 / 24) * ARROW + "px";
              cursor.style.top = (-3 / 24) * ARROW + "px";
              cursor.style.transformOrigin = (5 / 24) * ARROW + "px " + (3 / 24) * ARROW + "px";

              function pt(x, y) {
                return { x: (x / 100) * W, y: (y / 100) * H };
              }
              var CLICKS = [
                pt(num(vars.click1_x, 68.5, 0, 100), num(vars.click1_y, 7.5, 0, 100)),
                pt(num(vars.click2_x, 50, 0, 100), num(vars.click2_y, 48.5, 0, 100)),
                pt(num(vars.click3_x, 90.5, 0, 100), num(vars.click3_y, 7.5, 0, 100)),
              ];
              var START = pt(80, 88);
              var END = pt(104, 72);

              // Layout-space offsets inside the app, which ignore any transform a host puts on the player.
              function rowPoint(row) {
                return {
                  x: menu.offsetLeft + row.offsetLeft + row.offsetWidth * 0.35,
                  y: menu.offsetTop + row.offsetTop + row.offsetHeight * 0.5,
                };
              }

              var k = duration / 5.8;
              var T_C1 = 0.95 * k;
              var T_PICK = 1.45 * k;
              var T_C2 = 2.55 * k;
              var T_C3 = 3.65 * k;
              var EXIT_AT = 4.8 * k;
              var EXIT_END = 5.6 * k;
              function move(from, to, click, travel, dwell) {
                return {
                  from: from,
                  to: to,
                  at: click - (travel + dwell) * k,
                  end: click - dwell * k,
                  click: click,
                };
              }
              // With a user image there is no menu, so the pick beat is skipped and the click ring carries it.
              var MOVES = [move(START, CLICKS[0], T_C1, 0.5, 0.2)];
              if (builtIn) MOVES.push(move(CLICKS[0], rowPoint(rows[2]), T_PICK, 0.25, 0.15));
              MOVES.push(move(MOVES[MOVES.length - 1].to, CLICKS[1], T_C2, 0.5, 0.2));
              MOVES.push(move(CLICKS[1], CLICKS[2], T_C3, 0.5, 0.2));

              function clamp01(u) {
                return u < 0 ? 0 : u > 1 ? 1 : u;
              }
              function mix(a, b, u) {
                return a + (b - a) * u;
              }
              var arriveEase = gsap.parseEase("power3.out");
              var easeInOut = gsap.parseEase("power2.inOut");
              var easeOut = gsap.parseEase("power2.out");
              var easeIn = gsap.parseEase("power2.in");
              var camEase = gsap.parseEase("power3.inOut");

              function arc(p0, p1, u, bend) {
                var cx = (p0.x + p1.x) / 2 - (p1.y - p0.y) * bend;
                var cy = (p0.y + p1.y) / 2 + (p1.x - p0.x) * bend;
                var w = 1 - u;
                return {
                  x: w * w * p0.x + 2 * w * u * cx + u * u * p1.x,
                  y: w * w * p0.y + 2 * w * u * cy + u * u * p1.y,
                };
              }

              function cursorAt(t) {
                var here = START;
                for (var i = 0; i < MOVES.length; i++) {
                  var m = MOVES[i];
                  if (t < m.at) return here;
                  if (t <= m.end)
                    return arc(m.from, m.to, arriveEase(clamp01((t - m.at) / (m.end - m.at))), 0.12);
                  here = m.to;
                }
                if (t < EXIT_AT) return here;
                return arc(here, END, easeIn(clamp01((t - EXIT_AT) / (EXIT_END - EXIT_AT))), -0.1);
              }

              function zoomAt(t) {
                if (t < EXIT_AT) return mix(1, ZOOM, camEase(clamp01((t - 0.1 * k) / (0.85 * k))));
                return mix(ZOOM, 1, camEase(clamp01((t - EXIT_AT) / (1.0 * k))));
              }

              // The camera aims between the cursor and the click it is heading for, so the push leads.
              function aimAt(t) {
                var c = cursorAt(t);
                var next = null;
                for (var i = 0; i < MOVES.length; i++) {
                  if (t <= MOVES[i].click) {
                    next = MOVES[i].to;
                    break;
                  }
                }
                if (!next) return c;
                return { x: mix(c.x, next.x, 0.6), y: mix(c.y, next.y, 0.6) };
              }

              // A critically damped spring over the aim, integrated once at load and read back by time.
              var FPS = 60;
              var OMEGA = 6;
              var samples = [];
              var s = aimAt(0);
              var v = { x: 0, y: 0 };
              var SUB = 4;
              var dt = 1 / (FPS * SUB);
              var frames = Math.ceil(duration * FPS) + 1;
              for (var f = 0; f <= frames; f++) {
                samples.push({ x: s.x, y: s.y });
                for (var j = 0; j < SUB; j++) {
                  var aim = aimAt((f * SUB + j) * dt);
                  v.x += (OMEGA * OMEGA * (aim.x - s.x) - 2 * OMEGA * v.x) * dt;
                  v.y += (OMEGA * OMEGA * (aim.y - s.y) - 2 * OMEGA * v.y) * dt;
                  s.x += v.x * dt;
                  s.y += v.y * dt;
                }
              }
              function cameraAt(t) {
                var p = Math.max(0, Math.min(frames, t * FPS));
                var i = Math.floor(p);
                var a = samples[i];
                var b = samples[Math.min(frames, i + 1)];
                return { x: mix(a.x, b.x, p - i), y: mix(a.y, b.y, p - i) };
              }

              function lastClickBefore(t) {
                var hit = null;
                MOVES.forEach(function (m) {
                  if (t >= m.click) hit = { at: m.click, p: m.to };
                });
                return hit;
              }

              // 0..1: down over 80 ms, back up over 200 ms.
              function pressAt(since) {
                if (since < 0 || since >= 0.28) return 0;
                return since < 0.08 ? since / 0.08 : 1 - easeOut((since - 0.08) / 0.2);
              }
              // Elements at rest carry no transform: one left over from a transition drew different
              // pixels for the same t after a seek.
              function moving(u, css) {
                return u > 0 && u < 1 ? css : "";
              }
              function buttonPress(since) {
                var press = pressAt(since);
                return press ? "scale(" + (1 - 0.04 * press).toFixed(3) + ")" : "";
              }

              var LINE_30 = [40, 36, 38, 30, 31, 22, 25, 17, 19, 10, 12];
              var LINE_90 = [46, 44, 45, 40, 41, 35, 24, 19, 21, 15, 12];

              function render(t) {
                var z = zoomAt(t);
                var c = cameraAt(t);
                // Keep the zoomed window inside the screen so its edge never shows.
                var hw = W / (2 * z);
                var hh = H / (2 * z);
                var cx = Math.max(hw, Math.min(W - hw, c.x));
                var cy = Math.max(hh, Math.min(H - hh, c.y));
                cam.style.transform =
                  "translate(" +
                  (W / 2 - cx * z).toFixed(2) +
                  "px," +
                  (H / 2 - cy * z).toFixed(2) +
                  "px) scale(" +
                  z.toFixed(4) +
                  ")";

                var p = cursorAt(t);
                var hit = lastClickBefore(t);
                var since = hit ? t - hit.at : 99;
                cursor.style.transform =
                  "translate(" +
                  p.x.toFixed(2) +
                  "px," +
                  p.y.toFixed(2) +
                  "px) scale(" +
                  (1 - 0.15 * pressAt(since)).toFixed(3) +
                  ")";
                cursor.style.opacity = t >= duration ? "0" : "1";

                var ring = since / 0.35;
                ripple.style.opacity = ring < 1 ? (1 - ring).toFixed(3) : "0";
                if (ring < 1) {
                  var r = (12 + 32 * easeOut(ring)) * u;
                  ripple.style.width = ripple.style.height = (2 * r).toFixed(2) + "px";
                  ripple.style.transform =
                    "translate(" + (hit.p.x - r).toFixed(2) + "px," + (hit.p.y - r).toFixed(2) + "px)";
                }

                if (!builtIn) return;

                var picked = t >= T_PICK;
                var shown =
                  easeOut(clamp01((t - T_C1) / 0.18)) * (1 - clamp01((t - T_PICK - 0.05) / 0.12));
                menu.style.opacity = shown.toFixed(3);
                menu.style.transform = moving(
                  shown,
                  "translateY(" +
                    (-4 * u * (1 - shown)).toFixed(2) +
                    "px) scale(" +
                    (0.97 + 0.03 * shown).toFixed(4) +
                    ")",
                );
                range.classList.toggle("open", shown > 0);
                range.style.transform = buttonPress(t - T_C1);
                rangeLabel.textContent = picked ? "Last 90 days" : "Last 30 days";
                for (var i = 0; i < rows.length; i++) {
                  var row = rows[i];
                  var x = p.x - menu.offsetLeft - row.offsetLeft;
                  var y = p.y - menu.offsetTop - row.offsetTop;
                  var over = x >= 0 && y >= 0 && x < row.offsetWidth && y < row.offsetHeight;
                  row.classList.toggle("hover", shown > 0 && over);
                  row.lastElementChild.style.opacity = i === (picked ? 2 : 1) ? "1" : "0";
                }

                var redraw = easeInOut(clamp01((t - T_PICK - 0.05) / 0.4));
                line.setAttribute(
                  "d",
                  LINE_30.map(function (y30, i) {
                    return (i ? "L" : "M") + i * 10 + " " + mix(y30, LINE_90[i], redraw).toFixed(2);
                  }).join(" "),
                );

                var tipOn = clamp01((t - T_C2) / 0.25);
                tip.style.opacity = tipOn.toFixed(3);
                tip.style.transform = moving(
                  tipOn,
                  "translateY(" + ((1 - tipOn) * 8).toFixed(2) + "px)",
                );

                // Export, then Exporting…, then a check held until the camera pulls out.
                var busy = clamp01((t - T_C3 - 0.05) / 0.15);
                var done = clamp01((t - T_C3 - 0.55 * k) / 0.15);
                var reset = clamp01((t - EXIT_AT) / 0.15);
                exportStates[0].style.opacity = Math.max(1 - busy, reset).toFixed(3);
                exportStates[1].style.opacity = (busy * (1 - done)).toFixed(3);
                exportStates[2].style.opacity = (done * (1 - reset)).toFixed(3);
                exportStates[2].firstElementChild.style.transform = moving(
                  done,
                  "scale(" + (0.5 + 0.5 * easeOut(done)).toFixed(3) + ")",
                );
                exportBtn.style.transform = buttonPress(t - T_C3);
              }

              var clock = { t: 0 };
              var tl = gsap.timeline({ paused: true });
              tl.to(
                clock,
                {
                  t: duration,
                  duration: duration,
                  ease: "none",
                  onUpdate: function () {
                    render(clock.t);
                  },
                },
                0,
              );
              render(0);
              tl.seek(0);
              
              __hfTimelineSlot.set(tl);
            })();
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "image", "type": "image", "role": "content", "label": "Screenshot", "description": "Your own screen capture. Leave empty for the built-in dashboard.", "default": "" &#125;,
        &#123; "id": "zoom", "type": "number", "role": "style", "label": "Zoom", "default": 1.8, "min": 1.2, "max": 2.6, "step": 0.1 &#125;,
        &#123; "id": "click1_x", "type": "number", "role": "layout", "label": "Click 1 X", "default": 68.5, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "click1_y", "type": "number", "role": "layout", "label": "Click 1 Y", "default": 7.5, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "click2_x", "type": "number", "role": "layout", "label": "Click 2 X", "default": 50, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "click2_y", "type": "number", "role": "layout", "label": "Click 2 Y", "default": 48.5, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "click3_x", "type": "number", "role": "layout", "label": "Click 3 X", "default": 90.5, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "click3_y", "type": "number", "role": "layout", "label": "Click 3 Y", "default": 7.5, "min": 0, "max": 100, "step": 0.5, "unit": "%" &#125;,
        &#123; "id": "accent", "type": "color", "role": "style", "label": "Ripple", "default": "#0a84ff" &#125;
      ]' data-composition-duration="5.8" data-composition-id="cursor-zoom-follow" data-duration="5.8">
            <div class="zf-cam" id="zf-cam">
              <img class="zf-img" id="zf-img" alt="" />
              <div class="zf-app" id="zf-app">
                <div class="zf-side">
                  <p class="on">Overview</p>
                  <p>Revenue</p>
                  <p>Customers</p>
                  <p>Invoices</p>
                  <p>Settings</p>
                </div>
                <div class="zf-h" style="left: 18%; top: 4%">Revenue</div>
                <div class="zf-sub" style="left: 18%; top: 9.2%">Updated 2 minutes ago</div>
                <div
                  class="zf-pill zf-card zf-range"
                  id="zf-range"
                  style="left: 62%; top: 4.8%; width: 13%"
                >
                  <span id="zf-range-label">Last 30 days</span>
                  <svg class="zf-icon" viewBox="0 0 16 16" style="color: #7a7f93">
                    <path d="M4 6l4 4 4-4" />
                  </svg>
                </div>
                <div
                  class="zf-pill"
                  id="zf-export"
                  style="left: 85%; top: 4.8%; width: 11%; background: #171a26; color: #fff"
                >
                  <span class="zf-state">Export</span>
                  <span class="zf-state" style="opacity: 0">Exporting…</span>
                  <span class="zf-state" style="opacity: 0; gap: 0.5cqw"
                    ><svg class="zf-icon" viewBox="0 0 16 16"><path d="M3.5 8.5l3 3 6-7" /></svg
                    >Exported</span
                  >
                </div>
                <div
                  class="zf-card zf-kpi"
                  style="left: 18%; top: 16%; width: 24.5%; height: 13%; padding: 1.4cqw"
                >
                  <span>Net revenue</span><b>$84,210</b>
                </div>
                <div
                  class="zf-card zf-kpi"
                  style="left: 44.75%; top: 16%; width: 24.5%; height: 13%; padding: 1.4cqw"
                >
                  <span>Active customers</span><b>1,284</b>
                </div>
                <div
                  class="zf-card zf-kpi"
                  style="left: 71.5%; top: 16%; width: 24.5%; height: 13%; padding: 1.4cqw"
                >
                  <span>Churn</span><b>2.1%</b>
                </div>
                <div class="zf-card" style="left: 18%; top: 32%; width: 51.25%; height: 35%">
                  <svg
                    viewBox="0 0 100 50"
                    preserveAspectRatio="none"
                    style="position: absolute; inset: 12% 4% 8%; width: 92%; height: 80%"
                  >
                    <path
                      id="zf-line"
                      d="M0 40 L10 36 L20 38 L30 30 L40 31 L50 22 L60 25 L70 17 L80 19 L90 10 L100 12"
                      fill="none"
                      stroke="#0a84ff"
                      stroke-width="1.2"
                      vector-effect="non-scaling-stroke"
                    />
                  </svg>
                  <div
                    class="zf-card"
                    id="zf-tip"
                    style="
                      left: 60%;
                      top: 8%;
                      padding: 0.6cqw 0.9cqw;
                      font-size: 0.95cqw;
                      opacity: 0;
                      box-shadow: 0 0.6cqw 1.6cqw rgba(20, 24, 40, 0.16);
                    "
                  >
                    Aug 25 <b>$3,920</b>
                  </div>
                </div>
                <div
                  class="zf-card"
                  style="
                    left: 71.5%;
                    top: 32%;
                    width: 24.5%;
                    height: 35%;
                    padding: 1.4cqw;
                    font-size: 1cqw;
                  "
                >
                  <b>Top plans</b>
                  <div class="zf-bar" style="top: 26%">Team<i style="width: 46%"></i></div>
                  <div class="zf-bar" style="top: 50%">Business<i style="width: 32%"></i></div>
                  <div class="zf-bar" style="top: 74%">Starter<i style="width: 22%"></i></div>
                </div>
                <div class="zf-card" style="left: 18%; top: 70%; width: 78%; height: 26%">
                  <div class="zf-row" style="top: 0; border: 0; color: #7a7f93">
                    Customer<span>Plan</span><span>Amount</span>
                  </div>
                  <div class="zf-row" style="top: 20%">
                    Northwind Outfitters<span>Team</span><span>$1,240</span>
                  </div>
                  <div class="zf-row" style="top: 40%">
                    Lumen Dental<span>Starter</span><span>$320</span>
                  </div>
                  <div class="zf-row" style="top: 60%">
                    Parkside Studio<span>Business</span><span>$2,880</span>
                  </div>
                </div>
                <div class="zf-card zf-menu" id="zf-menu" style="left: 62%; top: 11%; width: 13%">
                  <p>
                    Last 7 days<svg class="zf-icon" style="opacity: 0" viewBox="0 0 16 16">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  </p>
                  <p>
                    Last 30 days<svg class="zf-icon" viewBox="0 0 16 16">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  </p>
                  <p>
                    Last 90 days<svg class="zf-icon" style="opacity: 0" viewBox="0 0 16 16">
                      <path d="M3.5 8.5l3 3 6-7" />
                    </svg>
                  </p>
                </div>
              </div>
              <div class="zf-ripple" id="zf-ripple"></div>
              <svg class="zf-cursor" id="zf-cursor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 3 L5 19 L9 15 L12 22 L15 20.5 L11.5 14 L18 14 Z" />
              </svg>
            </div>
          </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    isolation: isolate;
    container-type: size;
    background: #f4f5f9;
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    color: #171a26;
  }
  .zf-cam, .zf-app, .zf-img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .zf-cam {
    /* No will-change: a cached camera layer drew different pixels for the same t after a seek. */
    transform-origin: 0 0;
  }
  .zf-img {
    object-fit: cover;
    display: none;
  }
  .zf-app div {
    position: absolute;
  }
  .zf-card {
    border-radius: 1cqw;
    background: #ffffff;
    box-shadow: 0 0 0 1px rgba(20, 24, 40, 0.07);
  }
  .zf-menu {
    padding: 0.35cqw;
    font-size: 1cqw;
    opacity: 0;
    transform-origin: 50% 0;
    box-shadow:
      0 0 0 1px rgba(20, 24, 40, 0.07),
      0 0.8cqw 2cqw rgba(20, 24, 40, 0.14);
  }
  .zf-menu p {
    margin: 0;
    padding: 0.65cqw 0.8cqw;
    border-radius: 0.65cqw;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .zf-menu p.hover {
    background: #f1f3f7;
  }
  .zf-state {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .zf-icon {
    width: 1cqw;
    height: 1cqw;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .zf-menu .zf-icon {
    color: var(--zf-accent);
  }
  .zf-side {
    left: 0;
    top: 0;
    width: 15%;
    height: 100%;
    background: #ffffff;
    box-shadow: 1px 0 0 rgba(20, 24, 40, 0.07);
    padding: 2.2cqw 1.6cqw;
    font-size: 1.05cqw;
  }
  .zf-side p {
    margin: 0 0 1.5cqw;
    color: #5d6275;
  }
  .zf-side p.on {
    color: #171a26;
    font-weight: 650;
  }
  .zf-h {
    font-size: 2.1cqw;
    font-weight: 700;
    letter-spacing: -0.02em;
  }
  .zf-sub {
    font-size: 0.95cqw;
    color: #7a7f93;
  }
  .zf-pill {
    height: 5.4%;
    border-radius: 0.7cqw;
    font-size: 1.05cqw;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6cqw;
  }
  .zf-range.open {
    box-shadow: 0 0 0 2px var(--zf-accent);
  }
  .zf-kpi b {
    display: block;
    font-size: 2cqw;
    margin-top: 0.5cqw;
  }
  .zf-kpi span {
    font-size: 0.95cqw;
    color: #7a7f93;
  }
  .zf-row {
    left: 2%;
    right: 2%;
    height: 20%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 1cqw;
    border-top: 1px solid #eef0f5;
  }
  .zf-bar {
    left: 6%;
    right: 6%;
    color: #5d6275;
  }
  .zf-bar i {
    display: block;
    height: 0.7cqw;
    margin-top: 0.5cqw;
    border-radius: 0.35cqw;
    background: #b9d8ff;
  }
  .zf-ripple {
    position: absolute;
    left: 0;
    top: 0;
    box-sizing: border-box;
    border: 0 solid var(--zf-accent);
    border-radius: 50%;
    opacity: 0;
  }
  .zf-cursor {
    position: absolute;
    left: 0;
    top: 0;
    filter: drop-shadow(0 3px 4px rgba(0, 0, 0, 0.3));
  }
  .zf-cursor path {
    fill: #ffffff;
    stroke: #141414;
    stroke-width: 1.4;
    stroke-linejoin: round;
  }
}
</style>
