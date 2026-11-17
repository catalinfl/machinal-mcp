<!-- Modified Svelte adaptation of registry/blocks/yt-comment-card/yt-comment-card.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
            

            /* ---- published parameters (inspector-style CONFIG) ----
               Social comments typing on over footage — creator-style
               comment cards. avatar: image path, or null -> initials chip. */
            var CONFIG = {
              scheme: "overlay", // "overlay" (white over footage) | "light" (ink on boards)
              comments: [
                {
                  avatar: null,
                  initials: "PW",
                  avatarHue: 210, // initials-chip hue when no image
                  username: "@pixelwaves",
                  time: "2 days ago",
                  text: "Your videos are the best!",
                  likes: 47,
                },
                {
                  avatar: null,
                  initials: "FR",
                  avatarHue: 340,
                  username: "@framerate",
                  time: "1 day ago",
                  text: "That camera move at 0:12 though 🔥",
                  likes: 12,
                },
              ],
              x: 140,
              y: null, // null = vertically centered
              typeCharDelay: 0.024, // s per character (capped so a comment types <= 2.2s)
              scanlines: false, // full-frame LCD pass while comments are up
              animationIn: true,
              animationOut: true,
            };

            var DUR = 8;
            function clamp(v, lo, hi) {
              return Math.min(hi, Math.max(lo, v));
            }
            var OUT = clamp(DUR * 0.06, 0.25, 0.6);

            var root = document.getElementById("yt-cc-root");
            var col = document.getElementById("yt-cc-col");
            root.classList.add(CONFIG.scheme === "light" ? "yt-light" : "yt-overlay");
            if (CONFIG.scanlines) document.getElementById("yt-cc-scan").style.display = "block";

            var THUMB =
              '<svg viewBox="0 0 24 24"><path d="M7 11v9M7 11l3.2-6.4a2 2 0 0 1 3.6 1.2V9h4.6a2 2 0 0 1 2 2.4l-1.2 6a2 2 0 0 1-2 1.6H7M7 11H4a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"/></svg>';

            /* build cards */
            CONFIG.comments.forEach(function (c, i) {
              var card = document.createElement("div");
              card.className = "yt-cc-card";
              card.id = "yt-cc-card-" + i;

              var av = document.createElement("div");
              av.className = "yt-cc-avatar";
              av.id = "yt-cc-av-" + i;
              if (c.avatar) {
                var img = document.createElement("img");
                img.src = c.avatar;
                av.appendChild(img);
              } else {
                av.textContent = c.initials || "?";
                av.style.background =
                  "linear-gradient(135deg, hsl(" +
                  (c.avatarHue || 210) +
                  ", 62%, 52%), hsl(" +
                  ((c.avatarHue || 210) + 40) +
                  ", 62%, 42%))";
              }
              card.appendChild(av);

              var body = document.createElement("div");
              var meta = document.createElement("div");
              meta.className = "yt-cc-meta";
              meta.id = "yt-cc-meta-" + i;
              var user = document.createElement("span");
              user.className = "yt-cc-user";
              user.textContent = c.username;
              var time = document.createElement("span");
              time.className = "yt-cc-time";
              time.textContent = c.time || "";
              meta.appendChild(user);
              meta.appendChild(time);
              body.appendChild(meta);

              var text = document.createElement("div");
              text.className = "yt-cc-text";
              text.id = "yt-cc-text-" + i;
              Array.from(c.text).forEach(function (ch) {
                var span = document.createElement("span");
                span.className = "ch";
                span.textContent = ch;
                text.appendChild(span);
              });
              body.appendChild(text);

              var row = document.createElement("div");
              row.className = "yt-cc-row";
              row.id = "yt-cc-row-" + i;
              row.innerHTML =
                THUMB + "<span>" + (c.likes || 0) + '</span><span class="yt-cc-reply">REPLY</span>';
              body.appendChild(row);
              card.appendChild(body);
              col.appendChild(card);
            });

            /* position (measure after building) */
            col.style.left = CONFIG.x + "px";
            var rect = col.getBoundingClientRect();
            col.style.top =
              (CONFIG.y === null ? Math.round((1080 - rect.height) / 2) : CONFIG.y) + "px";

            var tl = gsap.timeline({ paused: true });

            /* comments enter sequentially: avatar pops, meta fades, text types, row fades */
            var t = CONFIG.animationIn ? 0.3 : 0;
            CONFIG.comments.forEach(function (c, i) {
              var av = "#yt-cc-av-" + i,
                meta = "#yt-cc-meta-" + i,
                row = "#yt-cc-row-" + i;
              var chars = document.querySelectorAll("#yt-cc-text-" + i + " .ch");
              var delay = Math.min(CONFIG.typeCharDelay, 2.2 / Math.max(1, chars.length));

              gsap.set(av, { opacity: 0, scale: 0.5 });
              gsap.set(meta, { opacity: 0, y: 10 });
              tl.to(av, { opacity: 1, scale: 1, duration: 0.45, ease: "back.out(1.6)" }, t);
              tl.to(meta, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, t + 0.12);
              t += 0.4;
              tl.to(chars, { opacity: 1, duration: 0.02, stagger: delay, ease: "none" }, t);
              t += chars.length * delay + 0.15;
              tl.to(row, { opacity: 1, duration: 0.35, ease: "power2.out" }, t);
              t += 0.5;
            });

            /* exit + hard kill (auto-scaled out) */
            if (CONFIG.animationOut) {
              tl.to(col, { opacity: 0, y: -18, duration: OUT, ease: "power2.in" }, DUR - OUT - 0.05);
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
          id="yt-cc-root"
          data-composition-id="yt-comment-card"
          data-start="0"
          data-duration="8"
          data-width="1920"
          data-height="1080"
        >
          <div id="yt-cc-scan"></div>
          <div id="yt-cc-col"></div>
          <div
            id="yt-cc-drv"
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
  #yt-cc-root {
    /* ---- yt tokens: override in the host to re-skin the family ---- */
    --yt-font: "Inter", -apple-system, sans-serif;
    --yt-ink: #1d1d1f;
    --yt-ink-dim: #5a5a5f;
    /* overlay-scheme text over footage — distinct from the --yt-ink board tokens */
    --yt-text: #ffffff;
    --yt-text-dim: rgba(255, 255, 255, 0.72);
    --yt-red: #e62e2e;
    --yt-cyan: #35c8d9;
    --yt-scanline-alpha: 0.04;
    --yt-scanline-gap: 3px;

    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent; /* overlays footage or a yt-lcd board */
    font-family: var(--yt-font);
  }
  /* optional full-frame LCD pass while comments are up */
  #yt-cc-scan {
    position: absolute;
    inset: 0;
    display: none;
    background: repeating-linear-gradient(
      0deg,
      rgba(0, 0, 0, var(--yt-scanline-alpha)) 0 1px,
      transparent 1px var(--yt-scanline-gap)
    );
  }
  #yt-cc-col {
    position: absolute;
    display: flex;
    flex-direction: column;
    gap: 40px;
  }
  .yt-cc-card {
    display: flex;
    gap: 22px;
    align-items: flex-start;
  }
  .yt-cc-avatar {
    flex: none;
    width: 64px;
    height: 64px;
    border-radius: 50%;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 26px;
    color: #ffffff;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
  }
  .yt-cc-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .yt-cc-meta {
    display: flex;
    align-items: baseline;
    gap: 14px;
  }
  .yt-cc-user {
    font-weight: 700;
    font-size: 27px;
  }
  .yt-cc-time {
    font-weight: 400;
    font-size: 23px;
  }
  .yt-cc-text {
    margin-top: 8px;
    font-weight: 500;
    font-size: 34px;
    line-height: 1.35;
    letter-spacing: -0.01em;
    max-width: 860px;
  }
  .yt-cc-text .ch {
    opacity: 0;
  }
  .yt-cc-row {
    margin-top: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 600;
    font-size: 22px;
    opacity: 0;
  }
  .yt-cc-row svg {
    width: 24px;
    stroke-width: 2.4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .yt-cc-reply {
    margin-left: 18px;
    letter-spacing: 0.1em;
  }
  /* scheme: overlay (white over footage, w/ shadow) vs light (ink on boards) */
  .yt-overlay .yt-cc-user, .yt-overlay .yt-cc-text {
    color: var(--yt-text);
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.55);
  }
  .yt-overlay .yt-cc-time, .yt-overlay .yt-cc-row {
    color: var(--yt-text-dim);
    text-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  }
  .yt-overlay .yt-cc-row svg {
    stroke: var(--yt-text-dim);
  }
  .yt-light .yt-cc-user, .yt-light .yt-cc-text {
    color: var(--yt-ink);
  }
  .yt-light .yt-cc-time, .yt-light .yt-cc-row {
    color: var(--yt-ink-dim);
  }
  .yt-light .yt-cc-row svg {
    stroke: var(--yt-ink-dim);
  }
}
</style>
