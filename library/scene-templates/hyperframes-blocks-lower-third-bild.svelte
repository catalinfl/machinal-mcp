<!-- Modified Svelte adaptation of registry/blocks/lower-third-bild/lower-third-bild.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-lower-third-bild';
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
    await loadHyperframeFonts(__hfFonts);

            (function () {
              

              var vars =
                __hfHost && __hfHost.getVariables
                  ? __hfHost.getVariables()
                  : {};

              var mainText = (vars.TXT_MAIN_1_Line || "BILD EXKLUSIV").trim();
              var subText = (vars.TXT_SUB || "Sonderbericht").trim();

              var dur = parseFloat(document.getElementById("lb-drv").dataset.duration) || 8;

              document.getElementById("lb-main-text").textContent = mainText;
              document.getElementById("lb-sub-text").textContent = subText || " ";

              var mainOuter = document.getElementById("lb-main-outer");
              var subOuter = document.getElementById("lb-sub-outer");

              var tl = gsap.timeline({ paused: true });

              gsap.set([mainOuter, subOuter], { opacity: 1 });

              tl.set([mainOuter, subOuter], { opacity: 0, visibility: "hidden" }, dur);

              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="transparent">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="lb-root"
          data-composition-id="lower-third-bild"
          data-composition-variables='[&#123;"id":"TXT_MAIN_1_Line","type":"string","label":"Main line","default":"BILD EXKLUSIV"&#125;,&#123;"id":"TXT_SUB","type":"string","label":"Sub line","default":"Sonderbericht"&#125;]'
          data-start="0"
          data-duration="8"
          data-width="1920"
          data-height="1080"
        >
          <div
            id="lb-drv"
            class="clip"
            data-start="0"
            data-duration="8"
            data-track-index="0"
            style="position: absolute; width: 1px; height: 1px; opacity: 0; pointer-events: none"
          ></div>
    
          <div id="lb-main-outer">
            <div id="lb-main-text"></div>
          </div>
    
          <div id="lb-sub-outer">
            <div id="lb-sub-text"></div>
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
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    background: transparent;
    overflow: hidden;
  }
  .hf-port {
    width: 1920px;
    height: 1080px;
  }

  #lb-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: transparent;
  }

  #lb-main-outer {
    position: absolute;
    bottom: 215px;
    left: 80px;
    padding-right: 14px;
    padding-bottom: 14px;
  }

  #lb-main-text {
    font-family: "Barlow Condensed", sans-serif;
    font-size: 88px;
    font-weight: 800;
    line-height: 1.05;
    color: #212529;
    background: #ffffff;
    padding: 10px 22px 8px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    box-shadow: 12px 12px 0 0 #dd0000;
  }

  #lb-sub-outer {
    position: absolute;
    bottom: 135px;
    left: 80px;
    padding-right: 10px;
    padding-bottom: 10px;
  }

  #lb-sub-text {
    font-family: "Barlow Condensed", sans-serif;
    font-size: 48px;
    font-weight: 700;
    line-height: 1.1;
    color: #ffffff;
    background: #dd0000;
    padding: 6px 18px 5px;
    white-space: nowrap;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    box-shadow: 8px 8px 0 0 #ffffff;
  }
}
</style>
