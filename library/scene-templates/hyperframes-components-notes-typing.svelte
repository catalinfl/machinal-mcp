<!-- Modified Svelte adaptation of registry/components/notes-typing/notes-typing.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "notes-typing";
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};
                function text(v, fb, mx) {
                  if (typeof v !== "string") return fb;
                  var t = v.trim();
                  if (!t) return fb;
                  return t.length > mx ? t.slice(0, mx) : t;
                }
                function clampNumber(v, min, max, fb) {
                  var n = typeof v === "number" ? v : parseFloat(v);
                  if (!isFinite(n)) return fb;
                  return Math.min(max, Math.max(min, n));
                }
                var titleEl = document.getElementById("nty-title");
                titleEl.innerHTML = "";
                text(vars.title, "Things nobody told me|about video.", 60)
                  .split("|")
                  .forEach(function (line, i) {
                    if (i > 0) titleEl.appendChild(document.createElement("br"));
                    titleEl.appendChild(document.createTextNode(line));
                  });
                var lines = text(
                  vars.lines,
                  "my videos sucked|my tools cost $$$|and re-edits never end.",
                  240,
                )
                  .split("|")
                  .map(function (l) {
                    return l.trim();
                  })
                  .filter(Boolean)
                  .slice(0, 6);
                if (lines.length === 0) lines = ["my videos sucked"];
                var speed = clampNumber(vars.speed, 0.5, 2, 1);

                var linesEl = document.getElementById("nty-lines");
                var chars = [];
                lines.forEach(function (line, li) {
                  var p = document.createElement("div");
                  p.className = "nty-line";
                  p.setAttribute("data-layout-allow-overlap", "");
                  p.setAttribute("data-layout-allow-occlusion", "");
                  line.split("").forEach(function (ch) {
                    var s = document.createElement("span");
                    s.className = "nty-ch";
                    s.textContent = ch;
                    p.appendChild(s);
                    chars.push({ el: s, line: li });
                  });
                  linesEl.appendChild(p);
                });

                /* the measured human keystroke rhythm, cycled */
                var KEY_GAPS = [
                  0.1, 0.033, 0.2, 0.133, 0.2, 0.033, 0.067, 0.033, 0.1, 0.067, 0.033, 0.067, 0.067,
                  0.067, 0.133, 0.067, 0.033, 0.067, 0.1, 0.1, 0.067, 0.133, 0.1, 0.033, 0.1, 0.033,
                  0.167, 0.033, 0.1, 0.1,
                ];
                var LINE_PAUSE = 0.85; /* the measured breath before a new thought */

                var caret = document.getElementById("nty-caret");
                var body = document.getElementById("nty-body");
                var tl = gsap.timeline({ paused: true });
                function build() {
                  tl.clear();
                  var bodyRect = body.getBoundingClientRect();
                  var scale = bodyRect.width / body.offsetWidth || 1;
                  gsap.set(caret, { autoAlpha: 0 });
                  var t = 0.5;
                  var lastLine = -1;
                  chars.forEach(function (c, i) {
                    if (c.line !== lastLine) {
                      if (lastLine >= 0) t += LINE_PAUSE / speed;
                      lastLine = c.line;
                    }
                    var r = c.el.getBoundingClientRect();
                    var x = (r.right - bodyRect.left) / scale;
                    var y = (r.top - bodyRect.top) / scale;
                    tl.set(c.el, { opacity: 1 }, t);
                    tl.set(caret, { x: x + 2, y: y, autoAlpha: 1 }, t);
                    t += KEY_GAPS[i % KEY_GAPS.length] / speed;
                  });
                  /* settle blink, then rest */
                  for (var b = 0; b < 4; b += 1) {
                    tl.set(caret, { autoAlpha: b % 2 === 0 ? 0 : 1 }, t + 0.4 + b * 0.5333);
                  }
                  tl.set({}, {}, 10);
                  tl.seek(0);
                }
                build();
                if (document.fonts && document.fonts.ready) {
                  document.fonts.ready.then(function () {
                    build();
                    tl.pause(0);
                  });
                }
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[&#123;"id": "title", "type": "string", "role": "content", "label": "Title", "description": "Bold note title. A | breaks the line.", "default": "Things nobody told me|about video."&#125;, &#123;"id": "lines", "type": "string", "role": "content", "label": "Lines", "description": "Pipe-separated body lines, typed one after another.", "default": "my videos sucked|my tools cost $$|and re-edits never end."&#125;, &#123;"id": "speed", "type": "number", "role": "timing", "label": "Speed", "description": "Typing speed multiplier. 1 is the measured human rhythm.", "default": 1, "min": 0.5, "max": 2, "step": 0.1&#125;]' data-composition-duration="10" data-composition-id="notes-typing" data-duration="10" data-fps="30">
            
            <div class="nty-nav">
              <svg viewBox="0 0 40 40">
                <path
                  d="M26 4 L10 20 L26 36"
                  fill="none"
                  stroke="#111"
                  stroke-width="4.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="nty-check">
              <svg viewBox="0 0 56 46">
                <path
                  d="M6 24 L21 38 L50 6"
                  fill="none"
                  stroke="#fff"
                  stroke-width="7"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </div>
            <div class="nty-body" id="nty-body">
              <div class="nty-title" id="nty-title" data-layout-allow-overlap>
                Things nobody told me<br />about video.
              </div>
              <div id="nty-lines"></div>
              <div id="nty-caret"></div>
            </div>
            <div class="nty-fmt">
              <span class="aa">A<small>a</small></span>
              <svg viewBox="0 0 64 54">
                <circle cx="10" cy="12" r="9" fill="none" stroke="#111" stroke-width="4" />
                <path
                  d="M6 12 l3 3 6 -7"
                  fill="none"
                  stroke="#111"
                  stroke-width="3"
                  stroke-linecap="round"
                />
                <line
                  x1="28"
                  y1="12"
                  x2="60"
                  y2="12"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
                <circle cx="10" cy="42" r="9" fill="none" stroke="#111" stroke-width="4" />
                <line
                  x1="28"
                  y1="42"
                  x2="52"
                  y2="42"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
              <svg viewBox="0 0 62 62">
                <rect
                  x="3"
                  y="3"
                  width="56"
                  height="56"
                  rx="8"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                />
                <line x1="3" y1="22" x2="59" y2="22" stroke="#111" stroke-width="4" />
                <line x1="22" y1="3" x2="22" y2="59" stroke="#111" stroke-width="4" />
              </svg>
              <svg viewBox="0 0 46 70">
                <path
                  d="M33 14 v34 a11 11 0 0 1 -22 0 V16 a8 8 0 0 1 16 0 v30 a4 4 0 0 1 -8 0 V20"
                  fill="none"
                  stroke="#111"
                  stroke-width="4"
                  stroke-linecap="round"
                />
              </svg>
              <svg viewBox="0 0 62 62">
                <circle cx="31" cy="31" r="27" fill="none" stroke="#111" stroke-width="4" />
                <path d="M22 40 L36 18 a5 5 0 0 1 8 6 L30 46 l-10 4 z" fill="#111" />
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
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    box-sizing: border-box;
  }
  #root {
    position: absolute;
    inset: 0;
    overflow: hidden;
    container-type: size;
    isolation: isolate;
    background: #fefefe;
    font-family: var(
      --font-body,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif
    );
    pointer-events: none;
  }
  .nty-nav {
    position: absolute;
    left: 4cqw;
    top: 3.5cqh;
    width: 10cqmin;
    height: 10cqmin;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0.4cqmin 1.4cqmin rgba(0, 0, 0, 0.07);
  }
  .nty-nav svg {
    position: absolute;
    left: 32%;
    top: 30%;
    width: 36%;
    height: 40%;
  }
  .nty-check {
    position: absolute;
    right: 4cqw;
    top: 3.5cqh;
    width: 10cqmin;
    height: 10cqmin;
    border-radius: 50%;
    background: #fec909;
  }
  .nty-check svg {
    position: absolute;
    left: 26%;
    top: 30%;
    width: 50%;
    height: 42%;
  }
  .nty-body {
    position: absolute;
    left: 6cqw;
    right: 6cqw;
    top: 16cqh;
  }
  .nty-title {
    font-size: 8.4cqmin;
    font-weight: 700;
    letter-spacing: -0.005em;
    color: #191919;
    line-height: 1.15;
    margin: 0 0 3.4cqh;
  }
  .nty-line {
    font-size: 4.9cqmin;
    color: #191919;
    line-height: 1.5;
    margin: 0 0 2.6cqh;
    white-space: pre-wrap;
    min-height: 1.5em;
  }
  .nty-ch {
    opacity: 0;
  }
  #nty-caret {
    position: absolute;
    width: 0.42cqmin;
    height: 5.2cqmin;
    background: #ffca00;
    border-radius: 0.2cqmin;
    left: 0;
    top: 0;
    will-change: transform;
  }
  .nty-fmt {
    position: absolute;
    left: 4cqw;
    right: 4cqw;
    bottom: 4cqh;
    height: 8.5cqh;
    background: #fdfdfd;
    border-radius: 100cqmin;
    box-shadow: 0 0.4cqmin 1.6cqmin rgba(0, 0, 0, 0.05);
    display: flex;
    align-items: center;
    justify-content: space-around;
  }
  .nty-fmt .aa {
    font-size: 4.6cqmin;
    font-weight: 700;
    color: #111;
  }
  .nty-fmt .aa small {
    font-size: 0.65em;
    font-weight: 400;
  }
  .nty-fmt svg {
    width: 5.6cqmin;
    height: 5.6cqmin;
  }
}
</style>
