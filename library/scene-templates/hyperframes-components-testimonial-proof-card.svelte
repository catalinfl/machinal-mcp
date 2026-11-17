<!-- Modified Svelte adaptation of registry/components/testimonial-proof-card/testimonial-proof-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                // Literal key: the flattening step strips data-composition-id off
                // the mounted root, so reading it back would register "null".
                var compositionId = "testimonial-proof-card";
                var card = root.querySelector(".tq-card");
                var quoteEl = root.querySelector(".tq-quote");
                var bylineEl = root.querySelector(".tq-byline");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                function str(value, fallback) {
                  return (value == null ? fallback : String(value)).trim().replace(/\s+/g, " ");
                }
                var quote = str(vars.quote, "We shipped our launch video in a single afternoon");
                var name = str(vars.name, "Maya Chen");
                var role = str(vars.role, "Head of Product");
                var company = str(vars.company, "NORTHWIND");
                var emphasis = str(vars.emphasis, "single afternoon");

                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                root.style.setProperty("--tq-accent", accentColors[accent]);
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // Byline content. Empty strings hide their element.
                root.querySelector(".tq-name").textContent = name;
                var roleEl = root.querySelector(".tq-role");
                if (role) roleEl.textContent = role;
                else roleEl.setAttribute("hidden", "");
                var companyEl = root.querySelector(".tq-company");
                if (company) companyEl.textContent = company;
                else companyEl.setAttribute("hidden", "");

                // Avatar initials: only when the default initials span is still
                // in the slot (a user-supplied img replaces the slot children).
                var initialsEl = root.querySelector(".tq-avatar .tq-initials");
                if (initialsEl) {
                  var parts = name.split(" ").filter(Boolean);
                  var initials = parts
                    .slice(0, 2)
                    .map(function (part) {
                      return Array.from(part)[0].toUpperCase();
                    })
                    .join("");
                  initialsEl.textContent = initials;
                }

                // Emphasis match expanded to whole words so the quote tokenizes
                // cleanly into word spans (the underline never splits a word).
                var matchStart = -1;
                var matchEnd = -1;
                if (emphasis.length > 0) {
                  var index = quote.toLowerCase().indexOf(emphasis.toLowerCase());
                  if (index >= 0) {
                    matchStart = quote.lastIndexOf(" ", index) + 1;
                    matchEnd = quote.indexOf(" ", index + emphasis.length);
                    if (matchEnd < 0) matchEnd = quote.length;
                  }
                }

                // Deterministic fit: font size rides 1/sqrt(chars) so the quote
                // lands around two to three lines at any card width.
                var characters = Math.max(1, Array.from(quote).length);
                var fitted = Math.max(3.8, Math.min(7.2, 46 / Math.sqrt(characters)));
                root.style.setProperty("--tq-font-size", fitted.toFixed(3) + "cqmin");

                // Tokenize into inline-block word spans (emphasis is one nowrap
                // token), measure wrapped lines, then rebuild one mask per line.
                var tokens = [];
                function pushWords(text) {
                  text.split(" ").forEach(function (wordText) {
                    if (!wordText) return;
                    var span = document.createElement("span");
                    span.style.display = "inline-block";
                    span.textContent = wordText;
                    tokens.push(span);
                  });
                }
                var pathEl = null;
                var emEl = null;
                if (matchStart >= 0) {
                  pushWords(quote.slice(0, matchStart));
                  emEl = document.createElement("span");
                  emEl.className = "tq-em";
                  var svgNS = "http://www.w3.org/2000/svg";
                  var svg = document.createElementNS(svgNS, "svg");
                  svg.setAttribute("class", "tq-mark");
                  svg.setAttribute("viewBox", "0 0 100 12");
                  svg.setAttribute("preserveAspectRatio", "none");
                  svg.setAttribute("aria-hidden", "true");
                  pathEl = document.createElementNS(svgNS, "path");
                  // Authored wobble, marker-highlight underline law: dash reveal
                  // from getTotalLength, never pathLength, never
                  // non-scaling-stroke; the viewBox stretch is the nib feel.
                  pathEl.setAttribute("d", "M 2 7 C 20 4.5, 46 8.5, 66 6 C 80 4.5, 92 7.5, 98 5.5");
                  pathEl.setAttribute("fill", "none");
                  pathEl.setAttribute("stroke-width", "4.5");
                  pathEl.setAttribute("stroke-linecap", "round");
                  pathEl.setAttribute("stroke-linejoin", "round");
                  // style.stroke, not the presentation attribute: var() only
                  // resolves as a CSS value.
                  pathEl.style.stroke = accentColors[accent];
                  svg.appendChild(pathEl);
                  var emText = document.createElement("span");
                  emText.className = "tq-em-text";
                  emText.textContent = quote.slice(matchStart, matchEnd);
                  emEl.appendChild(svg);
                  emEl.appendChild(emText);
                  tokens.push(emEl);
                  pushWords(quote.slice(matchEnd));
                } else {
                  pushWords(quote);
                }
                tokens.forEach(function (token, i) {
                  if (i > 0) quoteEl.appendChild(document.createTextNode(" "));
                  quoteEl.appendChild(token);
                });
                quoteEl.setAttribute("aria-label", quote);

                // Group tokens by rendered row, then rebuild per-line masks.
                var rows = [];
                var lastTop = null;
                tokens.forEach(function (token) {
                  var top = token.offsetTop;
                  if (lastTop === null || Math.abs(top - lastTop) > 2) {
                    rows.push([]);
                    lastTop = top;
                  }
                  rows[rows.length - 1].push(token);
                });
                quoteEl.textContent = "";
                var lineEls = rows.map(function (row) {
                  var mask = document.createElement("div");
                  mask.className = "tq-line-mask";
                  var line = document.createElement("div");
                  line.className = "tq-line";
                  row.forEach(function (token, i) {
                    if (i > 0) line.appendChild(document.createTextNode(" "));
                    line.appendChild(token);
                  });
                  mask.appendChild(line);
                  quoteEl.appendChild(mask);
                  return line;
                });

                // RETIME RANGE: fixed phases; HOLD is the only elastic span.
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4.5"));
                var CARD_BASE = 0.5;
                var LINE_BASE = 0.6;
                var STAG_BASE = 0.18;
                var LINES_AT_BASE = 0.15;
                var BYLINE_BASE = 0.5;
                var DRAW_BASE = 0.55;
                var OUT_BASE = exit === "none" ? 0 : 0.45;
                var quoteEndBase =
                  LINES_AT_BASE + Math.max(0, lineEls.length - 1) * STAG_BASE + LINE_BASE;
                var bylineAtBase = Math.max(0, quoteEndBase - 0.15);
                var drawAtBase = quoteEndBase + 0.1;
                var inEndBase = Math.max(
                  CARD_BASE,
                  bylineAtBase + BYLINE_BASE,
                  pathEl ? drawAtBase + DRAW_BASE : 0,
                );
                var s = duration < inEndBase + OUT_BASE ? duration / (inEndBase + OUT_BASE) : 1;
                var OUT = OUT_BASE * s;
                var OUT_START = duration - OUT;

                gsap.set(card, { opacity: 0, y: "4cqh" });
                gsap.set(lineEls, { yPercent: 130, opacity: 0 });
                gsap.set(bylineEl, { opacity: 0, y: "2.5cqh" });

                var tl = gsap.timeline({ paused: true });

                // IN: the card surface settles up.
                tl.fromTo(
                  card,
                  { opacity: 0, y: "4cqh" },
                  { opacity: 1, y: "0cqh", duration: CARD_BASE * s, ease: "power3.out" },
                  0,
                );

                // Quote lines rise through their soft masks, top to bottom.
                lineEls.forEach(function (line, i) {
                  tl.fromTo(
                    line,
                    { yPercent: 130, opacity: 0 },
                    {
                      yPercent: 0,
                      opacity: 1,
                      duration: LINE_BASE * s,
                      ease: "power3.out",
                    },
                    (LINES_AT_BASE + i * STAG_BASE) * s,
                  );
                });

                // Byline fades up, overlapping the last line's landing.
                tl.fromTo(
                  bylineEl,
                  { opacity: 0, y: "2.5cqh" },
                  { opacity: 1, y: "0cqh", duration: BYLINE_BASE * s, ease: "power3.out" },
                  bylineAtBase * s,
                );

                // DRAW: the underline after the quote lands; both dash endpoints
                // explicit so any seek is correct without playing through. At
                // dashoffset == length the round cap still paints a dot at the
                // path start, so the ink is opacity 0 until the exact cue frame.
                if (pathEl) {
                  var length = pathEl.getTotalLength();
                  pathEl.style.strokeDasharray = String(length);
                  gsap.set(pathEl, { strokeDashoffset: length, opacity: 0 });
                  tl.set(pathEl, { opacity: 1 }, drawAtBase * s);
                  tl.fromTo(
                    pathEl,
                    { strokeDashoffset: length },
                    { strokeDashoffset: 0, duration: DRAW_BASE * s, ease: "power2.inOut" },
                    drawAtBase * s,
                  );
                }

                // HOLD: dead still.

                // OUT: optional departure; exit none holds until the frame cuts.
                if (exit === "fade") {
                  tl.to(card, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(card, { opacity: 0, y: "-6cqh", duration: OUT, ease: "power2.in" }, OUT_START);
                }

                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "quote", "type": "string", "role": "content", "label": "Quote", "description": "The testimonial line. Wraps inside the card; each rendered line reveals through its own mask.", "default": "We shipped our launch video in a single afternoon" &#125;,
        &#123; "id": "name", "type": "string", "role": "content", "label": "Name", "description": "Attribution name in mono. Also seeds the avatar initials.", "default": "Maya Chen" &#125;,
        &#123; "id": "role", "type": "string", "role": "content", "label": "Role", "description": "Attribution role in muted mono. Empty hides the line.", "default": "Head of Product" &#125;,
        &#123; "id": "company", "type": "string", "role": "content", "label": "Company", "description": "Company mark as wide-tracked mono text at the byline end. Empty hides it.", "default": "NORTHWIND" &#125;,
        &#123; "id": "emphasis", "type": "string", "role": "content", "label": "Emphasis", "description": "First case-insensitive substring match in quote, expanded to whole words, gets the accent underline. Empty disables the draw.", "default": "single afternoon" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Underline and glyph ink from the contract token map.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "timing", "label": "Exit", "description": "Optional departure. Default none: the card holds until the frame cuts.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4.5" data-composition-id="testimonial-proof-card" data-duration="4.5" data-fps="30">
            
    
            <div
              id="testimonial-proof-card-clip"
              class="tq-clip clip"
              data-start="0"
              data-duration="4.5"
              data-track-index="0"
            >
              <figure class="tq-card" style="margin: 0">
                <div class="tq-glyph" aria-hidden="true">&#8220;</div>
                <blockquote class="tq-quote" style="margin: 0"></blockquote>
                <figcaption class="tq-byline">
                  <div class="tq-avatar" data-slot="avatar">
                    <span class="tq-initials"></span>
                  </div>
                  <div class="tq-person">
                    <span class="tq-name"></span>
                    <span class="tq-role"></span>
                  </div>
                  <span class="tq-company"></span>
                </figcaption>
              </figure>
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
    display: grid;
    place-items: center;
    background: var(--bg, #0b0c0e);
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .tq-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
  }

  .tq-card {
    width: min(76cqw, 150cqh);
    padding: 6cqmin 7cqmin;
    border-radius: var(--radius, 24px);
    border: 1px solid color-mix(in srgb, var(--border, #343a46) 60%, transparent);
    background: color-mix(in srgb, var(--surface, #14171c) 88%, transparent);
    will-change: transform, opacity;
  }

  .tq-glyph {
    font-size: 9cqmin;
    line-height: 0.6;
    font-weight: 600;
    color: var(--tq-accent, var(--brand, #71f5a7));
    margin-bottom: 2.4cqmin;
  }

  .tq-quote {
    margin: 0;
    font-size: var(--tq-font-size, 5cqmin);
    font-weight: 600;
    line-height: 1.28;
    letter-spacing: -0.02em;
    text-wrap: balance;
  }

  /* Soft per-line mask. Negative margins cancel the padding so the
  expanded clip box (room for descenders and the underline ink
    below the baseline) never shifts layout. */
  .tq-line-mask {
    overflow: hidden;
    padding: 0.12em 0.24em 0.3em;
    margin: -0.12em -0.24em -0.3em;
  }

  .tq-line {
    will-change: transform, opacity;
  }

  .tq-em {
    position: relative;
    display: inline-block;
    white-space: nowrap;
  }

  .tq-em-text {
    position: relative;
    z-index: 1;
  }

  /* Underline box below the emphasized words; explicit width/height
  (svg is replaced), preserveAspectRatio="none" stretches the
  authored path so the stroke keeps its hand-swiped nib weight. */
  .tq-mark {
    position: absolute;
    left: -2%;
    bottom: -0.14em;
    width: 104%;
    height: 0.24em;
    overflow: visible;
    z-index: 2;
  }

  .tq-byline {
    display: flex;
    align-items: center;
    gap: 3cqmin;
    margin-top: 5cqmin;
    will-change: transform, opacity;
  }

  .tq-avatar {
    width: 10cqmin;
    height: 10cqmin;
    flex: none;
    border-radius: 50%;
    overflow: hidden;
    display: grid;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--border, #343a46) 70%, transparent);
    background: color-mix(in srgb, var(--tq-accent, #71f5a7) 16%, var(--surface, #14171c));
  }

  .tq-avatar img, .tq-avatar video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .tq-initials {
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 3.4cqmin;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--fg, #f8fafc);
  }

  .tq-person {
    display: grid;
    gap: 0.8cqmin;
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
  }

  .tq-name {
    font-size: 2.9cqmin;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .tq-role {
    font-size: 2.4cqmin;
    color: var(--muted, #94a3b8);
  }

  .tq-company {
    margin-left: auto;
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: 2.3cqmin;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--muted, #94a3b8);
  }
}
</style>
