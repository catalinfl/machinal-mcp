<!-- Modified Svelte adaptation of registry/components/chat-message/chat-message.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
                var compositionId = "chat-message";
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
                function pick(table, value, fallback) {
                  return table.indexOf(value) >= 0 ? value : fallback;
                }
                var type = pick(["recv", "sent", "emoji", "img", "card"], vars.type, "sent");
                var body = text(vars.text, "wait look \ud83d\udc40", 140);
                var tailOn = vars.tail !== "off";
                var deliveredOn = vars.delivered !== "off";

                var side = type === "sent" || type === "img" || type === "card" ? "sent" : "recv";
                var slot = document.getElementById("cm-slot");
                var pop = document.getElementById("cm-pop");
                slot.classList.add(side);
                if (type === "recv" || type === "sent") {
                  var bubble = document.createElement("div");
                  bubble.className = "cm-bubble " + type + (tailOn ? " cm-tail-" + type : "");
                  bubble.textContent = body;
                  pop.appendChild(bubble);
                } else if (type === "emoji") {
                  var row = document.createElement("div");
                  row.className = "cm-emoji";
                  row.textContent = body;
                  pop.appendChild(row);
                } else if (type === "img") {
                  pop.innerHTML = '<span class="cm-media"><span class="cm-play"></span></span>';
                } else {
                  var card = document.createElement("span");
                  card.className = "cm-card";
                  card.innerHTML = '<span class="cm-cardimg"><span class="cm-play"></span></span>';
                  var meta = document.createElement("span");
                  meta.className = "cm-cardmeta";
                  meta.style.display = "flex";
                  var txt = document.createElement("span");
                  txt.className = "cm-cardtxt";
                  var title = document.createElement("span");
                  title.className = "cm-cardtitle";
                  title.textContent = text(
                    vars.cardTitle,
                    "HyperFrames \u2014 Write HTML, render pixel-perfect video",
                    80,
                  );
                  txt.appendChild(title);
                  var domain = document.createElement("span");
                  domain.className = "cm-carddomain";
                  domain.textContent = text(vars.cardDomain, "hyperframes.heygen.com", 40);
                  txt.appendChild(domain);
                  meta.appendChild(txt);
                  var chev = document.createElement("span");
                  chev.className = "cm-cardchev";
                  chev.textContent = "\u203a";
                  meta.appendChild(chev);
                  card.appendChild(meta);
                  pop.appendChild(card);
                }
                if (deliveredOn && (type === "sent" || type === "card" || type === "img")) {
                  var receipt = document.createElement("div");
                  receipt.className = "cm-delivered";
                  receipt.textContent = "Delivered";
                  pop.appendChild(receipt);
                }

                var tl = gsap.timeline({ paused: true });
                /* the measured arrival, then hold */
                tl.set("#cm-slot", { autoAlpha: 0 }, 0.001);
                tl.set("#cm-slot", { autoAlpha: 1 }, 0.4);
                tl.fromTo(
                  "#cm-pop",
                  { scale: 0.75, autoAlpha: 0.6 },
                  { scale: 1, autoAlpha: 1, duration: 0.12, ease: "power2.out" },
                  0.4,
                );
                tl.set({}, {}, 3);
                tl.seek(0);
                
                __hfTimelineSlot.set(tl);
              })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas>
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div id="root" data-composition-variables='[&#123;"id": "type", "type": "enum", "role": "content", "label": "Type", "description": "Which message form arrives.", "default": "sent", "options": [&#123;"value": "recv", "label": "Received"&#125;, &#123;"value": "sent", "label": "Sent"&#125;, &#123;"value": "emoji", "label": "Emoji"&#125;, &#123;"value": "img", "label": "Image"&#125;, &#123;"value": "card", "label": "Link card"&#125;]&#125;, &#123;"id": "text", "type": "string", "role": "content", "label": "Text", "description": "Bubble text, or the emoji row for the Emoji type.", "default": "wait look 👀"&#125;, &#123;"id": "cardTitle", "type": "string", "role": "content", "label": "Card title", "description": "Link-card title (Link card type only).", "default": "HyperFrames — Write HTML, render pixel-perfect video"&#125;, &#123;"id": "cardDomain", "type": "string", "role": "content", "label": "Card domain", "description": "Link-card domain line (Link card type only).", "default": "hyperframes.heygen.com"&#125;, &#123;"id": "tail", "type": "enum", "role": "style", "label": "Tail", "description": "The bubble tail anchoring the message to its side.", "default": "on", "options": [&#123;"value": "on", "label": "On"&#125;, &#123;"value": "off", "label": "Off"&#125;]&#125;, &#123;"id": "delivered", "type": "enum", "role": "content", "label": "Delivered", "description": "The receipt under a sent message.", "default": "on", "options": [&#123;"value": "on", "label": "On"&#125;, &#123;"value": "off", "label": "Off"&#125;]&#125;]' data-composition-duration="3" data-composition-id="chat-message" data-duration="3" data-fps="30">
            
            <div class="cm-slot" id="cm-slot" data-layout-allow-overflow data-layout-allow-overlap>
              <div class="cm-pop" id="cm-pop"></div>
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
    background: #000;
    font-family: var(
      --font-body,
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif
    );
    pointer-events: none;
  }
  .cm-slot {
    position: absolute;
    left: 6cqw;
    right: 6cqw;
    bottom: 10cqh;
  }
  .cm-slot.sent {
    text-align: right;
  }
  .cm-pop {
    display: inline-block;
    transform-origin: left bottom;
    text-align: left;
  }
  .cm-slot.sent .cm-pop {
    transform-origin: right bottom;
  }
  .cm-bubble {
    display: inline-block;
    position: relative;
    max-width: 78cqw;
    padding: 2cqh 5cqw;
    border-radius: 6.4cqmin;
    font-size: 4.6cqmin;
    line-height: 1.35;
    color: #fff;
  }
  .cm-bubble.recv {
    background: #242428;
  }
  .cm-bubble.sent {
    background: #0a80f8;
  }
  .cm-tail-recv::before {
    content: "";
    position: absolute;
    left: -1.5cqmin;
    bottom: 0;
    width: 4cqmin;
    height: 4cqmin;
    background: #242428;
    border-bottom-right-radius: 3cqmin 2.8cqmin;
  }
  .cm-tail-recv::after {
    content: "";
    position: absolute;
    left: -4cqmin;
    bottom: -0.3cqmin;
    width: 3cqmin;
    height: 4.6cqmin;
    background: #000;
    border-bottom-right-radius: 2.4cqmin;
  }
  .cm-tail-sent::before {
    content: "";
    position: absolute;
    right: -1.5cqmin;
    bottom: 0;
    width: 4cqmin;
    height: 4cqmin;
    background: #0a80f8;
    border-bottom-left-radius: 3cqmin 2.8cqmin;
  }
  .cm-tail-sent::after {
    content: "";
    position: absolute;
    right: -4cqmin;
    bottom: -0.3cqmin;
    width: 3cqmin;
    height: 4.6cqmin;
    background: #000;
    border-bottom-left-radius: 2.4cqmin;
  }
  .cm-delivered {
    color: #8e8e93;
    font-size: 3.4cqmin;
    margin-top: 1.2cqh;
    padding-right: 1cqw;
    text-align: right;
  }
  .cm-emoji {
    font-size: 15cqmin;
    line-height: 1.25;
    letter-spacing: 0.02em;
    color: #fff;
    white-space: nowrap;
  }
  .cm-media {
    display: inline-block;
    width: 66cqw;
    aspect-ratio: 4 / 3;
    border-radius: 5cqmin;
    position: relative;
    background: linear-gradient(165deg, #0f3a2c 0%, #0a9c6b 78%, #3ce6ac 100%);
  }
  .cm-play {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 13cqmin;
    height: 13cqmin;
    border-radius: 50%;
    background: rgba(253, 253, 253, 0.94);
  }
  .cm-play::before {
    content: "";
    position: absolute;
    left: 38%;
    top: 30%;
    border-left: 4.4cqmin solid #0d0d0d;
    border-top: 2.6cqmin solid transparent;
    border-bottom: 2.6cqmin solid transparent;
  }
  .cm-card {
    display: inline-block;
    width: 70cqw;
    border-radius: 5cqmin;
    overflow: hidden;
    text-align: left;
  }
  .cm-cardimg {
    display: block;
    width: 100%;
    aspect-ratio: 1.02;
    position: relative;
    background: linear-gradient(165deg, #0f3a2c 0%, #0a9c6b 78%, #3ce6ac 100%);
  }
  .cm-cardmeta {
    background: #28282c;
    display: flex;
    align-items: center;
    padding: 1.8cqh 3cqw 1.8cqh 4cqw;
  }
  .cm-cardtxt {
    flex: 1;
    min-width: 0;
  }
  .cm-cardtitle {
    display: block;
    color: #fff;
    font-size: 3.5cqmin;
    font-weight: 600;
    line-height: 1.3;
  }
  .cm-carddomain {
    display: block;
    color: #8e8e93;
    font-size: 3cqmin;
    margin-top: 0.6cqh;
  }
  .cm-cardchev {
    color: #8e8e93;
    font-size: 6cqmin;
    padding-left: 1.4cqw;
  }
}
</style>
