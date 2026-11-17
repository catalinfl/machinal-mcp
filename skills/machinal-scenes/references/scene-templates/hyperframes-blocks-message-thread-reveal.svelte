<!-- Modified Svelte adaptation of registry/blocks/message-thread-reveal/message-thread-reveal.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/blocks-message-thread-reveal';
  import { initializeNative } from '@machinal/hyperframes/native/blocks-message-thread-reveal';
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
    await initializeNative(__hfTimelineSlot, __hfRootElement, __hfHost, __hfScene);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="mtr-root"
          data-composition-id="message-thread-reveal"
          data-start="0"
          data-width="1080"
          data-height="1920"
          data-duration="25.7667"
         data-composition-variables='[
        &#123; "id": "contactName", "type": "string", "role": "content", "label": "Contact name", "description": "Name pill in the chat header; the avatar shows its first letter.", "default": "Rachel" &#125;,
        &#123; "id": "questionMessage", "type": "string", "role": "content", "label": "Opening question", "description": "First incoming message that establishes what the conversation is about.", "default": "what r u using for the launch video??" &#125;,
        &#123; "id": "teaserMessage", "type": "string", "role": "content", "label": "Teaser reply", "description": "First typed outgoing reply before the shared link card.", "default": "wait look 👀" &#125;,
        &#123; "id": "cardImage", "type": "image", "role": "content", "label": "Link card image", "description": "Preview image on the shared link card.", "default": "assets/card-image.jpg" &#125;,
        &#123; "id": "cardTitle", "type": "string", "role": "content", "label": "Link card title", "description": "Title of the shared link card. It leads with the real name of the brand this video promotes.", "portrays": ["subject_name"], "default": "HyperFrames | Write HTML, render pixel-perfect video" &#125;,
        &#123; "id": "cardDomain", "type": "string", "role": "content", "label": "Link card domain", "description": "Domain of the brand this video promotes, under the card title. Use the real domain.", "portrays": ["subject_domain"], "default": "hyperframes.heygen.com" &#125;,
        &#123; "id": "reactionMessage", "type": "string", "role": "content", "label": "Link reaction", "description": "Incoming reaction immediately after the shared link.", "default": "OMG IT&#39;S HTML" &#125;,
        &#123; "id": "reactionEmoji", "type": "string", "role": "content", "label": "Reaction emoji", "description": "Emoji-only reaction after the shared link.", "default": "🤯🤯🤯" &#125;,
        &#123; "id": "benefitMessage", "type": "string", "role": "content", "label": "Benefit reply", "description": "Typed outgoing reply that names the primary benefit.", "default": "renders in 4K. no editor" &#125;,
        &#123; "id": "discoveryMessage", "type": "string", "role": "content", "label": "Discovery question", "description": "Incoming question asking where the product was found.", "default": "where did u find this" &#125;,
        &#123; "id": "sourceMessage", "type": "string", "role": "content", "label": "Source reply", "description": "Typed outgoing reply naming where to find the brand this video promotes.", "default": "on heygen" &#125;,
        &#123; "id": "workflowMessage", "type": "string", "role": "content", "label": "Workflow reply", "description": "Typed outgoing reply describing how the product works.", "default": "u just write plain html tags" &#125;,
        &#123; "id": "ownershipMessage", "type": "string", "role": "content", "label": "Ownership reply", "description": "Typed outgoing reply that closes the product explanation.", "default": "the code is yours forever" &#125;,
        &#123; "id": "installMessage", "type": "string", "role": "content", "label": "Intent reply", "description": "Incoming message expressing intent to try the product.", "default": "installing rn" &#125;,
        &#123; "id": "thanksMessage", "type": "string", "role": "content", "label": "Closing reply", "description": "Final incoming message in the conversation.", "default": "ty bestie 💚" &#125;,
        &#123; "id": "brandLogo", "type": "image", "role": "content", "label": "Brand logo", "description": "Transparent horizontal wordmark of the brand this video promotes, on the closing card.", "portrays": ["subject_logo"], "default": "assets/hyperframes-logo-black.svg" &#125;,
        &#123; "id": "ecProof", "type": "string", "role": "content", "label": "End-card proof", "description": "Social-proof line under the stars. Claim only a figure the brand itself publishes; use neutral copy when there is none.", "portrays": ["authority_badge"], "default": "12,000+ creators" &#125;,
        &#123; "id": "ecFeature1", "type": "string", "role": "content", "label": "End-card feature 1", "description": "First two-line benefit; use | to break the line.", "default": "Write|plain HTML" &#125;,
        &#123; "id": "ecFeature2", "type": "string", "role": "content", "label": "End-card feature 2", "description": "Second two-line benefit; use | to break the line.", "default": "Render|pixel-perfect" &#125;,
        &#123; "id": "ecFeature3", "type": "string", "role": "content", "label": "End-card feature 3", "description": "Third two-line benefit; use | to break the line.", "default": "Own|every line" &#125;,
        &#123; "id": "ecCta", "type": "string", "role": "content", "label": "End-card CTA", "description": "Label on the closing card button.", "default": "Start rendering free" &#125;
      ]'>
          <div id="mtr-plate">
            <div id="mtr-phonebody"></div>
          </div>
          <section
            id="scene-chat"
            class="clip"
            data-start="0"
            data-duration="23.62"
            data-track-index="1"
          >
            <div id="mtr-screen">
              <div id="mtr-sb-time">9:41</div>
              <svg id="mtr-sb-icons" width="86" height="30" viewBox="0 0 86 30">
                <rect x="0" y="16" width="5" height="9" rx="1.5" fill="#fff" />
                <rect x="8" y="12" width="5" height="13" rx="1.5" fill="#fff" />
                <rect x="16" y="8" width="5" height="17" rx="1.5" fill="#fff" />
                <rect x="24" y="4" width="5" height="21" rx="1.5" fill="#fff" />
                <g transform="translate(44,2)">
                  <path
                    d="M18 21.5 L21.5 25 L25 21.5 A5 5 0 0 0 18 21.5"
                    fill="#fff"
                    transform="translate(-10,-2)"
                  />
                  <path
                    d="M4 13 A14 14 0 0 1 23 13"
                    stroke="#fff"
                    stroke-width="4"
                    fill="none"
                    transform="translate(-2,-2)"
                  />
                  <path
                    d="M8.5 17.5 A8 8 0 0 1 18.5 17.5"
                    stroke="#fff"
                    stroke-width="4"
                    fill="none"
                    transform="translate(-2,-2)"
                  />
                </g>
              </svg>
              <svg id="mtr-hdr-back" width="26" height="48" viewBox="0 0 26 48">
                <path
                  d="M23 3 L4 24 L23 45"
                  stroke="#E4E4E4"
                  stroke-width="6"
                  fill="none"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <div id="mtr-hdr-badge">12</div>
              <div id="mtr-hdr-avatar">R</div>
              <div id="mtr-hdr-name">Rachel<span class="chev">›</span></div>
              <svg id="mtr-hdr-cam" width="52" height="34" viewBox="0 0 52 34">
                <rect x="0" y="1" width="36" height="32" rx="9" fill="#fff" />
                <path d="M38 12 L50 4 V30 L38 22 Z" fill="#fff" />
              </svg>
              <div id="mtr-chatview">
                <div
                  class="item recv"
                  id="mtr-it-m1"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="bubble recv"
                      id="mtr-message-question"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      what r u using for the launch video??
                    </div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-dots"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div class="dotswrap">
                      <div class="dotsbubble">
                        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                      </div>
                      <div class="dtail1"></div>
                      <div class="dtail2"></div>
                    </div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m2"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div
                      class="bubble sent tail-sent"
                      id="mtr-message-teaser"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      wait look 👀
                    </div>
                    <div class="delivered">Delivered</div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m3"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div class="card">
                      <img
                        class="cardimg"
                        data-var-src="cardImage"
                        src="assets/card-image.jpg"
                        alt=""
                      />
                      <div class="cardmeta">
                        <div class="cardtxt">
                          <div class="cardtitle">
                            HyperFrames | Write HTML, render pixel-perfect video
                          </div>
                          <div class="carddomain">hyperframes.heygen.com</div>
                        </div>
                        <div class="cardchev">›</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-m4"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="bubble recv"
                      id="mtr-message-reaction"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      OMG IT&#39;S HTML
                    </div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-m5"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="emojirow"
                      id="mtr-message-emoji"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      🤯🤯🤯
                    </div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m6"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div
                      class="bubble sent tail-sent"
                      id="mtr-message-benefit"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      renders in 4K. no editor
                    </div>
                    <div class="delivered">Delivered</div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-dots2"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div class="dotswrap">
                      <div class="dotsbubble">
                        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
                      </div>
                      <div class="dtail1"></div>
                      <div class="dtail2"></div>
                    </div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-m7"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="bubble recv tail-recv"
                      id="mtr-message-discovery"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      where did u find this
                    </div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m8"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div
                      class="bubble sent"
                      id="mtr-message-source"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      on heygen
                    </div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m9"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div
                      class="bubble sent"
                      id="mtr-message-workflow"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      u just write plain html tags
                    </div>
                  </div>
                </div>
                <div
                  class="item sent"
                  id="mtr-it-m10"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-sent">
                    <div
                      class="bubble sent tail-sent"
                      id="mtr-message-ownership"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      the code is yours forever
                    </div>
                    <div class="delivered">Delivered</div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-m11"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="bubble recv"
                      id="mtr-message-install"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      installing rn
                    </div>
                  </div>
                </div>
                <div
                  class="item recv"
                  id="mtr-it-m12"
                  data-layout-allow-overflow
                  data-layout-allow-overlap
                  data-layout-allow-occlusion
                >
                  <div class="pop pop-recv">
                    <div
                      class="bubble recv tail-recv"
                      id="mtr-message-thanks"
                      data-layout-allow-overlap
                      data-layout-allow-occlusion
                    >
                      ty bestie 💚
                    </div>
                  </div>
                </div>
              </div>
              <div id="mtr-plusbtn">+</div>
              <div id="mtr-field"></div>
              <div id="mtr-ph">Message</div>
              <div id="mtr-typedwrap">
                <span class="typed" id="mtr-ty-1-0">o<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-1">wa<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-2">wai<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-3">wait<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-4">wait <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-5">wait l<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-6">wait lo<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-7">wait loo<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-8">wait look<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-9">wait look <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-1-10">wait look 👀<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-0">r<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-1">re<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-2">ren<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-3">rend<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-4">rende<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-5">render<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-6">renders<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-7">renders <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-8">renders i<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-9">renders in<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-10">renders in <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-11">renders in 4<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-12">renders in 4K<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-13">renders in 4K.<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-14">renders in 4K. <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-15">renders in 4K. n<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-16">renders in 4K. no<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-2-17"
                  >renders in 4K. no <span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-18"
                  >renders in 4K. no e<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-19"
                  >renders in 4K. no ed<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-20"
                  >renders in 4K. no edi<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-21"
                  >renders in 4K. no edit<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-22"
                  >renders in 4K. no edito<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-2-23"
                  >renders in 4K. no editor<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-3-0">o<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-1">on<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-2">on <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-3">on h<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-4">on he<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-5">on hey<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-6">on heyg<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-7">on heyge<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-3-8">on heygen<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-0">u<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-1">u <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-2">u j<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-3">u ju<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-4">u jus<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-5">u just<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-6">u just <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-7">u just w<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-8">u just wr<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-9">u just wri<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-10">u just writ<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-11">u just write<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-12">u just write <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-13">u just write p<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-14">u just write pl<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-15">u just write pla<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-16">u just write plai<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-4-17"
                  >u just write plain<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-18"
                  >u just write plain <span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-19"
                  >u just write plain h<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-20"
                  >u just write plain ht<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-21"
                  >u just write plain htm<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-22"
                  >u just write plain html<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-23"
                  >u just write plain html <span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-24"
                  >u just write plain html t<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-25"
                  >u just write plain html ta<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-26"
                  >u just write plain html tag<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-4-27"
                  >u just write plain html tags<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-0">r<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-1">th<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-2">the<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-3">the <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-4">the c<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-5">the co<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-6">the cod<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-7">the code<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-8">the code <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-9">the code i<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-10">the code is<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-11">the code is <span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-12">the code is y<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-13">the code is yo<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-14">the code is you<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-15">the code is your<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-16">the code is yours<span class="caret"></span></span>
                <span class="typed" id="mtr-ty-5-17"
                  >the code is yours <span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-18"
                  >the code is yours f<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-19"
                  >the code is yours fo<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-20"
                  >the code is yours for<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-21"
                  >the code is yours fore<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-22"
                  >the code is yours forev<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-23"
                  >the code is yours foreve<span class="caret"></span
                ></span>
                <span class="typed" id="mtr-ty-5-24"
                  >the code is yours forever<span class="caret"></span
                ></span>
              </div>
              <svg id="mtr-mic" width="26" height="42" viewBox="0 0 26 42">
                <rect x="8" y="0" width="10" height="22" rx="5" fill="#8E8E93" />
                <path
                  d="M2 16 A11 11 0 0 0 24 16"
                  stroke="#8E8E93"
                  stroke-width="3.5"
                  fill="none"
                  transform="translate(0,2)"
                />
                <line x1="13" y1="30" x2="13" y2="38" stroke="#8E8E93" stroke-width="3.5" />
                <line x1="6" y1="39" x2="20" y2="39" stroke="#8E8E93" stroke-width="3.5" />
              </svg>
              <div id="mtr-sendbtn">
                <svg width="26" height="30" viewBox="0 0 26 30">
                  <path
                    d="M13 28 V4 M3 13 L13 3 L23 13"
                    stroke="#fff"
                    stroke-width="5"
                    fill="none"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
          </section>
          <section
            id="scene-end"
            class="clip"
            data-start="23.2567"
            data-duration="2.53"
            data-track-index="2"
            style="z-index: 5"
          >
            <div id="mtr-ec-wrap" data-layout-allow-overlap data-layout-allow-occlusion>
              <img
                id="mtr-ec-logo"
                data-var-src="brandLogo"
                src="assets/hyperframes-logo-black.svg"
                alt="Brand logo"
              />
              <div id="mtr-ec-stars">
                <svg width="55" height="53" viewBox="0 0 24 23">
                  <path
                    d="M12 0 L15 8.2 L23.4 8.2 L16.6 13.4 L19.2 21.8 L12 16.8 L4.8 21.8 L7.4 13.4 L0.6 8.2 L9 8.2 Z"
                    fill="#FED059"
                  />
                </svg>
                <svg width="55" height="53" viewBox="0 0 24 23">
                  <path
                    d="M12 0 L15 8.2 L23.4 8.2 L16.6 13.4 L19.2 21.8 L12 16.8 L4.8 21.8 L7.4 13.4 L0.6 8.2 L9 8.2 Z"
                    fill="#FED059"
                  />
                </svg>
                <svg width="55" height="53" viewBox="0 0 24 23">
                  <path
                    d="M12 0 L15 8.2 L23.4 8.2 L16.6 13.4 L19.2 21.8 L12 16.8 L4.8 21.8 L7.4 13.4 L0.6 8.2 L9 8.2 Z"
                    fill="#FED059"
                  />
                </svg>
                <svg width="55" height="53" viewBox="0 0 24 23">
                  <path
                    d="M12 0 L15 8.2 L23.4 8.2 L16.6 13.4 L19.2 21.8 L12 16.8 L4.8 21.8 L7.4 13.4 L0.6 8.2 L9 8.2 Z"
                    fill="#FED059"
                  />
                </svg>
                <svg width="55" height="53" viewBox="0 0 24 23">
                  <path
                    d="M12 0 L15 8.2 L23.4 8.2 L16.6 13.4 L19.2 21.8 L12 16.8 L4.8 21.8 L7.4 13.4 L0.6 8.2 L9 8.2 Z"
                    fill="#FED059"
                  />
                </svg>
              </div>
              <div id="mtr-ec-fam">12,000+ creators</div>
              <div class="ec-icon" style="left: 150px">
                <svg width="58" height="58" viewBox="0 0 24 24">
                  <path
                    d="M3 17.2 V21 h3.8 L18 9.8 l-3.8-3.8 L3 17.2 Z M20.7 7.1 c0.4-0.4 0.4-1 0-1.4 l-2.4-2.4 c-0.4-0.4-1-0.4-1.4 0 l-1.8 1.8 3.8 3.8 1.8-1.8 Z"
                    fill="#F9F2E7"
                  />
                </svg>
              </div>
              <div class="ec-icon" style="left: 470px">
                <svg width="60" height="56" viewBox="0 0 24 22">
                  <path
                    d="M12 21 C12 21 1 14.4 1 7.6 C1 3.9 3.9 1 7.5 1 C9.4 1 11.1 1.9 12 3.3 C12.9 1.9 14.6 1 16.5 1 C20.1 1 23 3.9 23 7.6 C23 14.4 12 21 12 21 Z"
                    fill="#F9F2E7"
                  />
                </svg>
              </div>
              <div class="ec-icon" style="left: 790px">
                <svg width="60" height="60" viewBox="0 0 24 24">
                  <path
                    d="M12 2 C6.5 2 2 6.5 2 12 s4.5 10 10 10 c0.9 0 1.6-0.7 1.6-1.6 0-0.4-0.2-0.8-0.4-1.1 -0.3-0.3-0.4-0.7-0.4-1.1 0-0.9 0.7-1.6 1.6-1.6 h1.9 c3.1 0 5.7-2.6 5.7-5.7 C22 7 17.5 2 12 2 Z M6.5 12 c-0.8 0-1.5-0.7-1.5-1.5 S5.7 9 6.5 9 8 9.7 8 10.5 7.3 12 6.5 12 Z M9.5 8 C8.7 8 8 7.3 8 6.5 S8.7 5 9.5 5 s1.5 0.7 1.5 1.5 S10.3 8 9.5 8 Z M14.5 8 c-0.8 0-1.5-0.7-1.5-1.5 S13.7 5 14.5 5 16 5.7 16 6.5 15.3 8 14.5 8 Z M17.5 12 c-0.8 0-1.5-0.7-1.5-1.5 S16.7 9 17.5 9 19 9.7 19 10.5 18.3 12 17.5 12 Z"
                    fill="#F9F2E7"
                  />
                </svg>
              </div>
              <div class="ec-label" id="mtr-ec-feature-1" style="left: 100px">
                <div>Write</div>
                <div>plain HTML</div>
              </div>
              <div class="ec-label" id="mtr-ec-feature-2" style="left: 420px">
                <div>Render</div>
                <div>pixel-perfect</div>
              </div>
              <div class="ec-label" id="mtr-ec-feature-3" style="left: 740px">
                <div>Own</div>
                <div>every line</div>
              </div>
              <div id="mtr-ec-cta">Start rendering free</div>
            </div>
          </section>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1920px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    background: #000;
  }
  #mtr-root {
    position: relative;
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  #mtr-plate {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(
        ellipse 90% 60% at 30% 20%,
        rgba(60, 230, 172, 0.1) 0%,
        rgba(60, 230, 172, 0) 60%
      ),
      linear-gradient(168deg, #23262b 0%, #17191d 55%, #101114 100%);
  }
  #mtr-phonebody {
    position: absolute;
    left: 124px;
    top: 64px;
    width: 832px;
    height: 1797px;
    border-radius: 112px;
    background: #3a3d42;
    box-shadow:
      inset 0 2px 3px rgba(255, 255, 255, 0.25),
      0 40px 90px rgba(0, 0, 0, 0.6);
  }
  .clip {
    position: absolute;
    inset: 0;
  }
  /* ---------- phone screen ---------- */
  #mtr-screen {
    position: absolute;
    left: 140px;
    top: 80px;
    width: 800px;
    height: 1765px;
    border-radius: 100px;
    background: #000;
    overflow: hidden;
  }
  /* status bar */
  #mtr-sb-time {
    position: absolute;
    left: 88px;
    top: 57px;
    color: #fff;
    font-size: 34px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }
  #mtr-sb-icons {
    position: absolute;
    left: 578px;
    top: 66px;
  }
  /* header */
  #mtr-hdr-back {
    position: absolute;
    left: 48px;
    top: 158px;
  }
  #mtr-hdr-badge {
    position: absolute;
    left: 112px;
    top: 163px;
    height: 44px;
    padding: 0 22px;
    background: #262628;
    border-radius: 22px;
    color: #fff;
    font-size: 28px;
    line-height: 44px;
  }
  #mtr-hdr-avatar {
    position: absolute;
    left: 356px;
    top: 122px;
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: #9ce474;
    color: #12300c;
    font-size: 44px;
    font-weight: 600;
    display: grid;
    place-items: center;
  }
  #mtr-hdr-name {
    position: absolute;
    left: 400px;
    top: 213px;
    transform: translateX(-50%);
    height: 46px;
    padding: 0 20px;
    background: #232325;
    border-radius: 23px;
    color: #fff;
    font-size: 29px;
    line-height: 46px;
    white-space: nowrap;
  }
  #mtr-hdr-name .chev {
    color: #8e8e93;
    font-size: 26px;
    margin-left: 8px;
  }
  #mtr-hdr-cam {
    position: absolute;
    left: 699px;
    top: 166px;
  }
  /* chat viewport */
  #mtr-chatview {
    position: absolute;
    left: 0;
    top: 265px;
    width: 800px;
    height: 1367px;
    overflow: hidden;
  }
  .item {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    visibility: hidden;
  }
  .item.recv {
    padding-left: 44px;
    text-align: left;
  }
  .item.sent {
    padding-right: 45px;
    text-align: right;
  }
  .pop {
    display: inline-block;
    position: relative;
  }
  .pop-recv {
    transform-origin: left bottom;
  }
  .pop-sent {
    transform-origin: right bottom;
  }
  /* font 32.9px: artifact-closed-loop calibration (ref m1 ink 624x32 vs shipped-render 711x36 -> x0.876;
    the earlier 37.5px also overflowed max-width). padding 28px: ref ink inset 31/30 vs rep 26. */
  .bubble {
    display: inline-block;
    position: relative;
    max-width: 720px;
    padding: 0 28px;
    height: 81px;
    line-height: 81px;
    border-radius: 40px;
    font-size: 32.9px;
    color: #fff;
    white-space: nowrap;
    text-align: left;
  }
  .bubble.recv {
    background: #242428;
  }
  .bubble.sent {
    background: #0a80f8;
  }
  /* iMessage tails (screen bg is pure black -> cover circle trick) */
  .tail-recv::before {
    content: "";
    position: absolute;
    left: -10px;
    bottom: 0;
    width: 26px;
    height: 26px;
    background: #242428;
    border-bottom-right-radius: 20px 18px;
  }
  .tail-recv::after {
    content: "";
    position: absolute;
    left: -26px;
    bottom: -2px;
    width: 20px;
    height: 30px;
    background: #000;
    border-bottom-right-radius: 16px;
  }
  .tail-sent::before {
    content: "";
    position: absolute;
    right: -10px;
    bottom: 0;
    width: 26px;
    height: 26px;
    background: #0a80f8;
    border-bottom-left-radius: 20px 18px;
  }
  .tail-sent::after {
    content: "";
    position: absolute;
    right: -26px;
    bottom: -2px;
    width: 20px;
    height: 30px;
    background: #000;
    border-bottom-left-radius: 16px;
  }
  .delivered {
    color: #8e8e93;
    font-size: 28px;
    margin-top: 12px;
    padding-right: 7px;
    text-align: right;
  }
  /* 105.5px/ls2/ml12: artifact-closed-loop (ref yellow body h92, row w304, x203 vs rep 103/383/209) */
  .emojirow {
    font-size: 105.5px;
    line-height: 140px;
    letter-spacing: 2px;
    margin-left: 12px;
    white-space: nowrap;
    color: #fff;
  }
  /* typing indicator */
  .dotswrap {
    position: relative;
    display: inline-block;
  }
  .dotsbubble {
    width: 124px;
    height: 67px;
    background: #242428;
    border-radius: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  .dot {
    width: 17px;
    height: 17px;
    border-radius: 50%;
    background: #8e8e93;
    display: inline-block;
  }
  .dtail1 {
    position: absolute;
    left: -2px;
    bottom: -4px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: #242428;
  }
  .dtail2 {
    position: absolute;
    left: -14px;
    bottom: -14px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #242428;
  }
  /* link card */
  .card {
    display: inline-block;
    width: 443px;
    border-radius: 36px;
    overflow: hidden;
    text-align: left;
  }
  .cardimg {
    display: block;
    width: 443px;
    height: 432px;
    object-fit: cover;
  }
  .cardmeta {
    height: 178px;
    background: #28282c;
    display: flex;
    align-items: center;
    padding: 0 18px 0 26px;
  }
  .cardtxt {
    flex: 1;
    min-width: 0;
  }
  /* 26.8/23.3px: artifact-closed-loop (ref title ink w302 vs rep 350 -> x0.863); max-width keeps the
  measured 3-line wrap 'Where Are You? Dad / Edition | A personalized / book about him' */
  .cardtitle {
    color: #fff;
    font-size: 26.8px;
    font-weight: 600;
    line-height: 34px;
    max-width: 318px;
  }
  .carddomain {
    color: #8e8e93;
    font-size: 23.3px;
    margin-top: 4px;
  }
  .cardchev {
    color: #8e8e93;
    font-size: 48px;
    padding-left: 8px;
  }
  /* input bar */
  #mtr-plusbtn {
    position: absolute;
    left: 12px;
    top: 1653px;
    width: 86px;
    height: 86px;
    border-radius: 50%;
    background: #262628;
    color: #8e8e93;
    font-size: 52px;
    font-weight: 300;
    display: grid;
    place-items: center;
  }
  #mtr-field {
    position: absolute;
    left: 124px;
    top: 1646px;
    width: 665px;
    height: 93px;
    border: 2px solid #202022;
    border-radius: 47px;
  }
  #mtr-ph {
    position: absolute;
    left: 158px;
    top: 1668px;
    color: #8e8e93;
    font-size: 35px;
    line-height: 48px;
  }
  #mtr-typedwrap {
    position: absolute;
    left: 158px;
    top: 1668px;
    width: 600px;
    height: 48px;
    white-space: pre;
  }
  .typed {
    position: absolute;
    left: 0;
    top: 0;
    visibility: hidden;
    color: #fff;
    font-size: 36px;
    line-height: 48px;
    white-space: pre;
  }
  .caret {
    display: inline-block;
    width: 4px;
    height: 42px;
    background: #0a80f8;
    vertical-align: -8px;
    margin-left: 2px;
    border-radius: 2px;
  }
  #mtr-mic {
    position: absolute;
    left: 724px;
    top: 1664px;
  }
  #mtr-sendbtn {
    position: absolute;
    left: 698px;
    top: 1660px;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: #0a80f8;
    visibility: hidden;
    display: grid;
    place-items: center;
  }
  /* ---------- end card ---------- */
  #mtr-ec-wrap {
    position: absolute;
    inset: 0;
    background: #f9f2e7;
    font-family: Georgia, "Times New Roman", serif;
  }
  #mtr-ec-logo {
    position: absolute;
    left: 308px;
    top: 500px;
    width: 464px;
    height: 139px;
  }
  #mtr-ec-stars {
    position: absolute;
    left: 372px;
    top: 714px;
    width: 336px;
    display: flex;
    gap: 15px;
  }
  #mtr-ec-fam {
    position: absolute;
    left: 0;
    top: 796px;
    width: 100%;
    text-align: center;
    color: #185450;
    font-size: 35.5px;
    font-weight: 700;
  }
  .ec-icon {
    position: absolute;
    top: 934px;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: #185450;
    display: grid;
    place-items: center;
  }
  #mtr-ec-fam {
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .ec-label {
    position: absolute;
    top: 1098px;
    width: 240px;
    text-align: center;
    color: #205048;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 31px;
    line-height: 40px;
  }
  #mtr-ec-cta {
    position: absolute;
    left: 200px;
    top: 1298px;
    width: 680px;
    height: 118px;
    border-radius: 59px;
    background: #3ce6ac;
    color: #0d3b2b;
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    font-size: 46px;
    display: grid;
    place-items: center;
  }
}
</style>
