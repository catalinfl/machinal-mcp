<!-- Modified Svelte adaptation of registry/components/logo-brand-close/logo-brand-close.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var lockup = root.querySelector(".lbc-lockup");
                var wordmarkElement = root.querySelector(".lbc-wordmark");
                var taglineElement = root.querySelector(".lbc-tagline");
                var urlElement = root.querySelector(".lbc-url");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var wordmark =
                  vars.wordmark == null
                    ? "HYPERFRAMES"
                    : String(vars.wordmark).trim().replace(/\s+/g, " ");
                if (wordmark.length === 0) wordmark = "HYPERFRAMES";
                var tagline =
                  vars.tagline == null
                    ? "Write HTML. Render video."
                    : String(vars.tagline).trim().replace(/\s+/g, " ");
                var url = vars.url == null ? "hyperframes.heygen.com" : String(vars.url).trim();
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                root.style.setProperty("--lbc-accent", accentColors[accent]);
                wordmarkElement.setAttribute("aria-label", wordmark);
                wordmarkElement.setAttribute("role", "img");

                // The brand period: an accent dot ends the wordmark. If the
                // wordmark already ends with "." that period takes the accent
                // instead of appending a second one.
                var characters = Array.from(wordmark);
                if (characters[characters.length - 1] !== ".") characters.push(".");

                var letters = characters.map(function (character, index) {
                  var letter = document.createElement("span");
                  letter.id = "logo-brand-close-letter-" + index;
                  letter.className = "lbc-letter";
                  if (/\s/.test(character)) {
                    letter.classList.add("lbc-space");
                    letter.textContent = " ";
                  } else {
                    letter.textContent = character;
                  }
                  if (index === characters.length - 1) letter.classList.add("lbc-period");
                  letter.setAttribute("aria-hidden", "true");
                  wordmarkElement.appendChild(letter);
                  return letter;
                });
                var periodLetter = letters[letters.length - 1];
                var cascadeLetters = letters.slice(0, -1);

                // Deterministic chars-aware fit: probe the set width at a fixed
                // 100px font (letter-spacing rides in em, so the em ratio is a
                // pure font metric), then size the wordmark so it lands at
                // ~76cqw. The 40cqh term caps it in short, wide mounts. If the
                // probe cannot measure (detached render), fall back to a
                // per-glyph advance estimate.
                wordmarkElement.style.fontSize = "100px";
                var probedWidth = wordmarkElement.getBoundingClientRect().width;
                wordmarkElement.style.fontSize = "";
                var setWidthEm;
                if (probedWidth > 0) {
                  setWidthEm = probedWidth / 100;
                } else {
                  setWidthEm = characters.reduce(function (total, character) {
                    if (/\s/.test(character)) return total + 0.34;
                    if (/[.,:;!'’|]/.test(character)) return total + 0.3;
                    if (/[Iijlftr]/.test(character)) return total + 0.42;
                    if (/[MWmw@]/.test(character)) return total + 0.92;
                    return total + 0.64;
                  }, 0);
                  setWidthEm -= characters.length * 0.035;
                }
                setWidthEm = Math.max(0.3, setWidthEm);
                var wordmarkSize = 76 / setWidthEm;
                root.style.setProperty(
                  "--lbc-wordmark-size",
                  "min(" + wordmarkSize.toFixed(3) + "cqw, 40cqh)",
                );

                if (tagline.length === 0) taglineElement.remove();
                else taglineElement.textContent = tagline;
                if (url.length === 0) urlElement.remove();
                else urlElement.textContent = url;

                var IN_BASE = 2.6;
                var OUT_BASE = exit === "none" ? 0 : 0.5;
                var CASCADE_RISE_BASE = 1.15;
                var CASCADE_STAGGER_BASE = 0.7;
                var SETTLE_BASE = 2.4;
                var PERIOD_AT_BASE = 0.95;
                var PERIOD_DURATION_BASE = 0.9;
                var TAGLINE_AT_BASE = 1.35;
                var TAGLINE_DURATION_BASE = 0.9;
                var URL_AT_BASE = 1.7;
                var URL_DURATION_BASE = 0.85;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "4"));
                var totalBase = IN_BASE + OUT_BASE;
                var scale = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var STAGGER = cascadeLetters.length > 1 ? CASCADE_STAGGER_BASE * scale : 0;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                // IN: per-letter fade plus rise with a long expo tail, while the
                // whole wordmark settles down from a slightly larger scale.
                if (cascadeLetters.length > 0) {
                  tl.fromTo(
                    cascadeLetters,
                    { opacity: 0, y: "0.62em" },
                    {
                      opacity: 1,
                      y: "0em",
                      duration: CASCADE_RISE_BASE * scale,
                      stagger: { amount: STAGGER, from: "start" },
                      ease: "expo.out",
                    },
                    0,
                  );
                }

                tl.fromTo(
                  wordmarkElement,
                  { scale: 1.04, transformOrigin: "50% 100%" },
                  { scale: 1, duration: SETTLE_BASE * scale, ease: "expo.out" },
                  0,
                );

                // The brand period lands last: a decisive accent pop.
                tl.fromTo(
                  periodLetter,
                  { opacity: 0, scale: 0.2, y: "0.08em", transformOrigin: "50% 65%" },
                  {
                    opacity: 1,
                    scale: 1,
                    y: "0em",
                    duration: PERIOD_DURATION_BASE * scale,
                    ease: "back.out(1.8)",
                  },
                  PERIOD_AT_BASE * scale,
                );

                if (taglineElement.isConnected) {
                  tl.fromTo(
                    taglineElement,
                    { opacity: 0, y: "0.9em" },
                    {
                      opacity: 1,
                      y: "0em",
                      duration: TAGLINE_DURATION_BASE * scale,
                      ease: "power3.out",
                    },
                    TAGLINE_AT_BASE * scale,
                  );
                }

                if (urlElement.isConnected) {
                  tl.fromTo(
                    urlElement,
                    // scaleX, not letterSpacing: tracking is a layout property, so
                    // the browser snaps it to integer device pixels and the
                    // ease-out tail stutters under seek-by-frame capture. The
                    // widening reads the same and stays on the compositor.
                    { opacity: 0, scaleX: 1.06 },
                    {
                      opacity: 1,
                      scaleX: 1,
                      duration: URL_DURATION_BASE * scale,
                      ease: "power2.out",
                    },
                    URL_AT_BASE * scale,
                  );
                }

                // HOLD: dead still. No drift, no breath; the confidence is the
                // stillness, and by default the film ends here.

                if (exit === "fade") {
                  tl.to(lockup, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(
                    lockup,
                    { opacity: 0, y: "-5cqh", duration: OUT, ease: "power2.in" },
                    OUT_START,
                  );
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
        &#123; "id": "wordmark", "type": "string", "role": "content", "label": "Wordmark", "description": "Brand name whose letters cascade into the centered lockup.", "default": "HYPERFRAMES" &#125;,
        &#123; "id": "tagline", "type": "string", "role": "content", "label": "Tagline", "description": "Optional tagline that settles beneath the wordmark. Empty hides it.", "default": "Write HTML. Render video." &#125;,
        &#123; "id": "url", "type": "string", "role": "content", "label": "URL", "description": "Optional mono URL line beneath the tagline. Empty hides it.", "default": "hyperframes.heygen.com" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Contract color used by the brand period at the end of the wordmark.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "style", "label": "Exit", "description": "Optional departure. Films end on the still hold, so the default is none.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="4" data-composition-id="logo-brand-close" data-duration="4" data-fps="30">
            
    
            <div
              id="logo-brand-close-clip"
              class="lbc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <div class="lbc-lockup">
                <h2 class="lbc-wordmark"></h2>
                <p class="lbc-tagline"></p>
                <p class="lbc-url"></p>
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
    font-family: var(--font-body, Inter, system-ui, sans-serif);
    pointer-events: none;
  }

  .lbc-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, #0b0c0e);
  }

  .lbc-lockup {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100cqw;
    text-align: center;
    will-change: transform, opacity;
  }

  /* Display scale: the JS chars-aware fit targets ~76cqw of set
  width; 40cqh caps it in short, wide mounts. */
  .lbc-wordmark {
    display: flex;
    align-items: baseline;
    justify-content: center;
    margin: 0;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: var(--lbc-wordmark-size, min(10.5cqw, 40cqh));
    font-weight: 600;
    line-height: 1.04;
    letter-spacing: -0.035em;
    white-space: nowrap;
    will-change: transform;
  }

  .lbc-letter {
    display: inline-block;
    flex: 0 0 auto;
    will-change: transform, opacity;
  }

  .lbc-space {
    width: 0.34em;
  }

  .lbc-period {
    color: var(--lbc-accent);
  }

  .lbc-tagline {
    max-width: 88cqw;
    margin: var(--space-2, 3cqmin) 0 0;
    color: var(--fg, #f8fafc);
    font-size: min(3.4cqw, 5.4cqmin);
    font-weight: 500;
    line-height: 1.3;
    letter-spacing: 0.01em;
    will-change: transform, opacity;
  }

  .lbc-url {
    margin: var(--space-3, 4.6cqmin) 0 0;
    color: var(--muted, #94a3b8);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: min(2.4cqw, 3.2cqmin);
    font-weight: 500;
    line-height: 1;
    letter-spacing: 0.28em;
    will-change: opacity;
  }
}
</style>
