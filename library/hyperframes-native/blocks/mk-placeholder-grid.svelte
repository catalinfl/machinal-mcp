<!-- Modified Svelte adaptation of registry/blocks/mk-placeholder-grid/mk-placeholder-grid.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            /* ---- published parameters (inspector-style CONFIG) ---- */
            var CONFIG = {
              // no scheme param — scheme-agnostic; re-skin via the --mk-* tokens
              layout: "1+2", // "2up" | "3up" | "4up" | "3x2" | "1+2" (hero left + two stacked)
              margin: 120, // outer margin, px
              gap: 40, // px between cells
              radius: 40, // cell corner radius (rounded-edge look)
              // One entry per cell (in layout order). src: image path, or null for a
              // styled drop-zone well. insideScale: media scale inside the mask —
              // an "inside scale" convention (1 = cover-fit).
              cells: [
                { src: null, insideScale: 1 },
                { src: null, insideScale: 1 },
                { src: null, insideScale: 1 },
              ],
              kenBurns: true, // slow media settle inside the mask
              stagger: 0.15, // "box, box, box" entrance
              animationIn: true,
              animationOut: true,
            };

            /* decorative fills for empty wells (cycled) */
            var WELL_FILLS = [
              "linear-gradient(135deg, var(--mk-blob-1) 0%, var(--mk-blob-1-soft) 100%)",
              "linear-gradient(135deg, var(--mk-blob-2) 0%, var(--mk-blob-2-soft) 100%)",
              "linear-gradient(135deg, var(--mk-accent-dark) 0%, var(--mk-accent-dark-soft) 100%)",
              "linear-gradient(135deg, var(--mk-well-warm) 0%, var(--mk-well-warm-soft) 100%)",
              "linear-gradient(135deg, var(--mk-well-sky) 0%, var(--mk-well-sky-soft) 100%)",
              "linear-gradient(135deg, var(--mk-well-rose) 0%, var(--mk-well-rose-soft) 100%)",
            ];

            var W = 1920,
              H = 1080,
              DUR = 8;

            function rects(layout, m, g) {
              var iw = W - 2 * m,
                ih = H - 2 * m;
              function grid(cols, rows) {
                var cw = (iw - (cols - 1) * g) / cols,
                  ch = (ih - (rows - 1) * g) / rows,
                  out = [];
                for (var r = 0; r < rows; r++)
                  for (var c = 0; c < cols; c++)
                    out.push({ x: m + c * (cw + g), y: m + r * (ch + g), w: cw, h: ch });
                return out;
              }
              if (layout === "2up") return grid(2, 1);
              if (layout === "3up") return grid(3, 1);
              if (layout === "4up") return grid(2, 2);
              if (layout === "3x2") return grid(3, 2);
              /* "1+2": hero left (58%), two stacked right */
              var w1 = Math.round((iw - g) * 0.58),
                w2 = iw - g - w1,
                h2 = (ih - g) / 2;
              return [
                { x: m, y: m, w: w1, h: ih },
                { x: m + w1 + g, y: m, w: w2, h: h2 },
                { x: m + w1 + g, y: m + h2 + g, w: w2, h: h2 },
              ];
            }

            var root = document.getElementById("mk-pg-root");
            var grid = document.getElementById("mk-pg-grid");
            var R = rects(CONFIG.layout, CONFIG.margin, CONFIG.gap);

            var cells = [],
              medias = [];
            R.forEach(function (r, i) {
              var conf = CONFIG.cells[i] || {};
              var cell = document.createElement("div");
              cell.id = "mk-pg-cell-" + i;
              cell.className = "mk-pg-cell";
              cell.style.left = r.x + "px";
              cell.style.top = r.y + "px";
              cell.style.width = r.w + "px";
              cell.style.height = r.h + "px";
              cell.style.borderRadius = CONFIG.radius + "px";

              var inner;
              if (conf.src) {
                inner = document.createElement("img");
                inner.className = "mk-pg-media";
                inner.src = conf.src;
              } else {
                inner = document.createElement("div");
                inner.className = "mk-pg-well";
                inner.style.background = WELL_FILLS[i % WELL_FILLS.length];
                var num = document.createElement("span");
                num.className = "mk-pg-well-num";
                num.textContent = String(i + 1);
                inner.appendChild(num);
              }
              inner.id = "mk-pg-inner-" + i;
              inner.setAttribute("data-layout-allow-overflow", ""); // ken-burns scales past the mask by design
              cell.appendChild(inner);
              grid.appendChild(cell);
              cells.push(cell);
              medias.push(inner);

              gsap.set(inner, { scale: conf.insideScale || 1 });
            });

            var tl = gsap.timeline({ paused: true });

            cells.forEach(function (cell, i) {
              var t0 = (CONFIG.animationIn ? 0.3 : 0) + i * CONFIG.stagger;

              if (CONFIG.animationIn) {
                gsap.set(cell, { opacity: 0, scale: 0.92, y: 28 });
                tl.to(cell, { opacity: 1, scale: 1, y: 0, duration: 0.65, ease: "power3.out" }, t0);
              }

              if (CONFIG.kenBurns) {
                var base = (CONFIG.cells[i] && CONFIG.cells[i].insideScale) || 1;
                tl.fromTo(
                  medias[i],
                  { scale: base * 1.06 },
                  { scale: base, duration: DUR - t0 - 0.6, ease: "sine.out" },
                  t0,
                );
              }
            });

            /* exit + hard kill */
            if (CONFIG.animationOut) {
              tl.to(grid, { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, DUR - 0.5);
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
          id="mk-pg-root"
          data-composition-id="mk-placeholder-grid"
          data-start="0"
          data-duration="8"
          data-width="1920"
          data-height="1080"
        >
          <div id="mk-pg-grid"></div>
          <div
            id="mk-pg-drv"
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
  #mk-pg-root {
    /* ---- mk tokens: override in the host to re-skin the family ---- */
    --mk-font: "Inter", -apple-system, sans-serif;
    --mk-ink-dim: #6e6e73;
    --mk-paper: #ffffff;
    --mk-blob-1: #ff7ac8;
    --mk-blob-2: #45d6c8;
    --mk-accent-dark: #7d5cff;
    --mk-blob-1-soft: #ffd3ec;
    --mk-blob-2-soft: #d9fff8;
    --mk-accent-dark-soft: #cabdff;
    --mk-well-warm: #ffb86b;
    --mk-well-warm-soft: #ffe3c2;
    --mk-well-sky: #5cb8ff;
    --mk-well-sky-soft: #cfe9ff;
    --mk-well-rose: #ff8f8f;
    --mk-well-rose-soft: #ffd6d6;
    --mk-well-num: rgba(255, 255, 255, 0.9);
    --mk-radius-card: 40px;
    --mk-shadow: 0 24px 64px rgba(0, 0, 0, 0.16);

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent; /* pair with mk-background beneath for the gradient backdrop */
  }
  .mk-pg-cell {
    position: absolute;
    border-radius: var(--mk-radius-card);
    overflow: hidden;
    background: var(--mk-paper);
    box-shadow: var(--mk-shadow);
  }
  .mk-pg-media {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  /* empty drop-zone well: soft gradient + index numeral */
  .mk-pg-well {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mk-pg-well-num {
    font-family: var(--mk-font);
    font-weight: 600;
    font-size: 88px;
    letter-spacing: -0.02em;
    color: var(--mk-well-num);
  }
}
</style>
