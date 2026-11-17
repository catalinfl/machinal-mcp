<!-- Modified Svelte adaptation of registry/blocks/code-snippet-apple-terminal-pro/code-snippet-apple-terminal-pro.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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
    const command = "npm run build";
          const typedEl = document.querySelector(".typed-command");
          const cursorEl = document.querySelector(".cursor-block");
          const outputLines = document.querySelectorAll(".output-line");

          const tl = gsap.timeline({ paused: true });

          tl.set(typedEl, { text: "" }, 0);

          const charDuration = 1.5 / command.length;
          command.split("").forEach((char, i) => {
            tl.add(
              () => {
                typedEl.textContent = command.slice(0, i + 1);
              },
              0.5 + i * charDuration,
            );
          });

          tl.set(cursorEl, { opacity: 0 }, 2.2);
          tl.set(outputLines[0], { opacity: 1 }, 2.3);

          tl.add(() => {
            typedEl.textContent = "";
          }, 2.5);

          outputLines.forEach((line, i) => {
            if (i === 0) return;
            tl.set(line, { opacity: 1 }, 2.8 + i * 0.1);
          });

          tl.add(() => {
            const inputLine = document.querySelector(".input-line");
            const newPrompt = document.createElement("div");
            newPrompt.className = "input-line";
            newPrompt.innerHTML =
              '<span class="prompt">user@Mac myapp % </span><span class="typed-command"></span><span class="cursor-block" id="final-cursor"></span>';
            inputLine.style.display = "none";
            inputLine.parentNode.appendChild(newPrompt);
          }, 4.2);

          const blinkTimes = [4.4, 4.8, 5.2, 5.6, 6.0, 6.4];
          blinkTimes.forEach((t, i) => {
            tl.add(() => {
              const fc = document.getElementById("final-cursor");
              if (fc) fc.style.opacity = i % 2 === 0 ? "0" : "1";
            }, t);
          });
          tl.add(() => {
            const fc = document.getElementById("final-cursor");
            if (fc) fc.style.opacity = "1";
          }, 6.8);

          __hfTimelineSlot.set(tl);
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="scene"
          data-composition-id="code-snippet-apple-terminal-pro"
          data-width="1920"
          data-height="1080"
        >
          <div class="terminal-window">
            <div class="titlebar">
              <div class="traffic-lights">
                <span class="close"></span>
                <span class="minimize"></span>
                <span class="fullscreen"></span>
              </div>
              <span class="window-title">bash — 80×24</span>
            </div>
            <div class="terminal-canvas">
              <div class="output-lines">
                <span class="output-line dim">Last login: Mon Jun 2 09:14:22 on ttys008</span>
                <span class="output-line dim">Building production bundle...</span>
                <span class="output-line"> vite v5.3.1 building for production...</span>
                <span class="output-line"> ✓ 142 modules transformed.</span>
                <span class="output-line"> dist/index.html 0.48 kB</span>
                <span class="output-line"> dist/assets/index-Cv3rN.js 284.12 kB</span>
                <span class="output-line"> dist/assets/index-Du4mP.css 42.08 kB</span>
                <span class="output-line accent"> ✓ built in 2.31s</span>
              </div>
              <div class="input-line">
                <span class="prompt">user@Mac myapp % </span><span class="typed-command"></span
                ><span class="cursor-block"></span>
              </div>
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
  .hf-port {
    margin: 0;
    padding: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #000000;
    font-family: "SF Mono", Menlo, Monaco, Consolas, "Courier New", monospace;
  }

  #scene {
    width: 1920px;
    height: 1080px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at center, #141414 0%, #000000 70%);
  }

  .terminal-window {
    width: 1400px;
    height: 700px;
    border-radius: 10px;
    overflow: hidden;
    box-shadow:
      0 30px 80px rgba(136, 255, 103, 0.08),
      0 10px 30px rgba(0, 0, 0, 0.9);
    display: flex;
    flex-direction: column;
  }

  .titlebar {
    height: 38px;
    background: #1c1c1c;
    display: flex;
    align-items: center;
    padding: 0 14px;
    flex-shrink: 0;
    border-bottom: 1px solid #333333;
    position: relative;
  }

  .traffic-lights {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .traffic-lights span {
    width: 13px;
    height: 13px;
    border-radius: 50%;
    display: inline-block;
  }

  .traffic-lights .close {
    background: #ff5f57;
    border: 1px solid #e0443e;
  }

  .traffic-lights .minimize {
    background: #ffbd2e;
    border: 1px solid #dfa123;
  }

  .traffic-lights .fullscreen {
    background: #28c840;
    border: 1px solid #1aab29;
  }

  .window-title {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    font-size: 13px;
    color: #bbbbbb;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
    font-weight: 500;
    letter-spacing: -0.1px;
  }

  .terminal-canvas {
    flex: 1;
    background: #000000;
    padding: 18px 20px;
    overflow: hidden;
    font-size: 14px;
    line-height: 1.6;
    color: #bbbbbb;
  }

  .output-lines {
    margin-bottom: 4px;
  }

  .output-line {
    display: block;
    white-space: pre;
    opacity: 0;
    color: #bbbbbb;
  }

  .output-line.bold {
    font-weight: bold;
    color: #ffffff;
  }

  .output-line.accent {
    color: #88ff67;
    font-weight: bold;
  }

  .output-line.dim {
    color: #666666;
  }

  .input-line {
    display: flex;
    align-items: center;
    white-space: pre;
  }

  .prompt {
    color: #88ff67;
    font-weight: bold;
    user-select: none;
  }

  .typed-command {
    color: #bbbbbb;
  }

  .cursor-block {
    display: inline-block;
    width: 9px;
    height: 16px;
    background: #88ff67;
    vertical-align: text-bottom;
    margin-left: 1px;
  }
}
</style>
