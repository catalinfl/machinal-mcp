<!-- Modified Svelte adaptation of registry/components/testimonial-card/testimonial-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "testimonial-card";
                var card = root.querySelector(".tc-card");
                var proof = root.querySelector(".tc-proof");
                var quoteEl = root.querySelector(".tc-quote");
                var avatarEl = root.querySelector(".tc-avatar");
                var authorEl = root.querySelector(".tc-author");
                var handleEl = root.querySelector(".tc-handle");
                var ratingEl = root.querySelector(".tc-rating");
                var ratingValueEl = root.querySelector(".tc-rating-value");
                var attributionItems = root.querySelectorAll(".tc-attribution-item");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                /* INVARIANT: getVariables() is the sole owner of content. Missing
                   values use the declared defaults, while intentional empty
                   strings remain empty. Rating zero is valid and cannot fall
                   through to the default. */
                var quoteText = vars.quote == null ? "This changed how we ship." : String(vars.quote);
                var authorText = vars.author == null ? "Ken Tanaka" : String(vars.author);
                var handleText = vars.handle == null ? "@ken" : String(vars.handle);
                var rawRating = Number(vars.rating);
                var rating = Number.isFinite(rawRating) ? Math.max(0, Math.min(5, rawRating)) : 5;
                var ratingText = Number.isInteger(rating) ? String(rating) : rating.toFixed(1);
                var initials = authorText
                  .trim()
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map(function (part) {
                    return part.charAt(0);
                  })
                  .join("")
                  .toUpperCase();

                quoteEl.textContent = quoteText;
                authorEl.textContent = authorText;
                handleEl.textContent = handleText;
                avatarEl.textContent = initials === "" ? "?" : initials;
                ratingEl.style.setProperty("--tc-rating-fill", rating * 20 + "%");
                ratingEl.setAttribute("aria-label", ratingText + " out of 5 stars");
                ratingValueEl.textContent = ratingText + " / 5";

                /* RETIME RANGE: these constants own the complete lifecycle. The
                   reveal uses --ease-standard's GSAP form, power2.out, with the
                   quote first and three attribution items staggered beneath. */
                var IN_BASE = 1.5;
                var OUT_BASE = 0.45;
                var QUOTE_START_BASE = 0.12;
                var QUOTE_DURATION_BASE = 0.7;
                var ATTRIBUTION_START_BASE = 0.82;
                var ATTRIBUTION_DURATION_BASE = 0.56;
                var ATTRIBUTION_STAGGER_BASE = 0.06;
                var durationValue = Number(root.dataset.duration);
                var duration = Number.isFinite(durationValue) && durationValue > 0 ? durationValue : 4;
                var scale = duration < IN_BASE + OUT_BASE ? duration / (IN_BASE + OUT_BASE) : 1;
                var IN = IN_BASE * scale;
                var OUT = OUT_BASE * scale;
                var HOLD = Math.max(0, duration - IN - OUT);
                var OUT_START = IN + HOLD;

                var tl = gsap.timeline({ paused: true });

                tl.fromTo(
                  proof,
                  { y: "18%", opacity: 0 },
                  {
                    y: "0%",
                    opacity: 1,
                    duration: QUOTE_DURATION_BASE * scale,
                    ease: "power2.out",
                  },
                  QUOTE_START_BASE * scale,
                );
                tl.fromTo(
                  attributionItems,
                  { y: "34%", opacity: 0 },
                  {
                    y: "0%",
                    opacity: 1,
                    duration: ATTRIBUTION_DURATION_BASE * scale,
                    stagger: ATTRIBUTION_STAGGER_BASE * scale,
                    ease: "power2.out",
                  },
                  ATTRIBUTION_START_BASE * scale,
                );
                tl.to(card, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);

                tl.seek(0);

                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[
        &#123; "id": "quote", "type": "string", "role": "content", "label": "Quote", "description": "Customer testimonial copy revealed at reading pace.", "default": "This changed how we ship." &#125;,
        &#123; "id": "author", "type": "string", "role": "content", "label": "Author", "description": "Name attributed to the testimonial.", "default": "Ken Tanaka" &#125;,
        &#123; "id": "handle", "type": "string", "role": "content", "label": "Handle", "description": "Role or social handle shown beneath the author name.", "default": "@ken" &#125;,
        &#123; "id": "rating", "type": "number", "role": "content", "label": "Rating", "description": "Visible customer rating from zero to five stars.", "default": 5, "min": 0, "max": 5, "step": 0.1 &#125;
      ]' data-composition-id="testimonial-card" data-duration="4" data-fps="30">
            
    
            <div
              id="testimonial-card-clip"
              class="tc-clip clip"
              data-start="0"
              data-duration="4"
              data-track-index="0"
            >
              <article class="tc-card" aria-label="Customer testimonial">
                <div class="tc-proof">
                  <div class="tc-rating" role="img" aria-label="5 out of 5 stars">
                    <span class="tc-stars" aria-hidden="true">
                      ★★★★★
                      <span class="tc-stars-fill">★★★★★</span>
                    </span>
                    <span class="tc-rating-value" aria-hidden="true">5 / 5</span>
                  </div>
                  <blockquote class="tc-quote"></blockquote>
                </div>
    
                <footer class="tc-attribution">
                  <div class="tc-avatar tc-attribution-item" aria-hidden="true"></div>
                  <div class="tc-author tc-attribution-item"></div>
                  <div class="tc-handle tc-attribution-item"></div>
                </footer>
              </article>
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
    container-type: size;
    isolation: isolate;
    overflow: hidden;
    background: var(--bg, #070a12);
    color: var(--fg, #f8fafc);
    font-family: var(--font-body, Inter, system-ui, sans-serif);
  }

  .tc-clip {
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    padding: 6cqh 6cqw;
  }

  /* EDIT ZONE: card proportions and type scale. Paint is owned only
  by theme-contract tokens, and every measurement resolves from
  the host container. GSAP owns all transforms and opacity. */
  .tc-card {
    width: min(86cqw, 128cqh);
    display: grid;
    gap: min(4.6cqw, 4.6cqh);
    padding: min(6.5cqw, 6.5cqh);
    overflow: hidden;
    border: 0.16cqh solid var(--border, #34405a);
    border-radius: var(--radius, 28px);
    background: var(--surface, #151c2c);
    box-shadow: 0 3cqh 8cqh color-mix(in srgb, var(--bg, #070a12) 68%, transparent);
  }

  .tc-proof {
    display: grid;
    gap: min(3.2cqw, 3.2cqh);
    will-change: transform, opacity;
  }

  .tc-rating {
    display: flex;
    align-items: center;
    gap: min(2cqw, 2cqh);
    width: max-content;
    color: var(--muted, #a8b3c7);
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    font-size: min(2.4cqw, 2.4cqh);
    font-weight: 650;
    line-height: 1;
  }

  .tc-stars {
    position: relative;
    display: inline-block;
    color: var(--muted, #a8b3c7);
    font-size: min(3.4cqw, 3.4cqh);
    letter-spacing: 0.18em;
    line-height: 1;
    white-space: nowrap;
  }

  .tc-stars-fill {
    position: absolute;
    inset: 0 auto 0 0;
    width: var(--tc-rating-fill);
    overflow: hidden;
    /* The earned portion of the rating is the data. Flat ink over the
    muted track says it by value, with no second hue. */
    color: var(--fg, #f8fafc);
    white-space: nowrap;
  }

  .tc-quote {
    margin: 0;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(5.2cqw, 5.2cqh);
    font-weight: 650;
    line-height: 1.23;
    letter-spacing: -0.025em;
    text-wrap: balance;
  }

  .tc-attribution {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    grid-template-rows: auto auto;
    column-gap: min(2.7cqw, 2.7cqh);
    row-gap: min(0.65cqw, 0.65cqh);
    align-items: center;
  }

  .tc-avatar {
    grid-row: 1 / 3;
    display: grid;
    place-items: center;
    width: min(8.4cqw, 8.4cqh);
    aspect-ratio: 1;
    border: 0.16cqh solid color-mix(in srgb, var(--fg, #f8fafc) 20%, transparent);
    border-radius: 50%;
    /* Placeholder person: a single (front) avatar circle at L1, with
    the initials knocked out in the ground colour. */
    background: color-mix(in srgb, var(--fg, #f8fafc) 72%, var(--surface, #151c2c));
    color: var(--bg, #070a12);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(2.65cqw, 2.65cqh);
    font-weight: 780;
    letter-spacing: 0.03em;
  }

  .tc-author {
    min-width: 0;
    align-self: end;
    color: var(--fg, #f8fafc);
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-size: min(3.2cqw, 3.2cqh);
    font-weight: 700;
    line-height: 1.08;
  }

  .tc-handle {
    min-width: 0;
    align-self: start;
    color: var(--muted, #a8b3c7);
    font-size: min(2.35cqw, 2.35cqh);
    line-height: 1.15;
  }

  .tc-attribution-item {
    will-change: transform, opacity;
  }
}
</style>
