<!-- Modified Svelte adaptation of registry/blocks/data-chart/data-chart.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { loadHyperframeFonts, hyperframeFontSource } from '@machinal/hyperframes/assets';
  import __hfFonts from '@machinal/hyperframes/fonts/blocks-data-chart';
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
              const svg = document.querySelector('[data-composition-id="data-chart"] .chart-svg');
              const tl = gsap.timeline({ paused: true });

              // Data
              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
              const revenueData = [8, 12, 15, 11, 18, 22];
              const conversionData = [2.1, 2.8, 3.2, 2.9, 3.8, 4.2];

              // Chart Dimensions
              const chartWidth = 1400;
              const chartHeight = 500;
              const startX = 100;
              const startY = 600;
              const barWidth = 80;
              const spacing = (chartWidth - barWidth * months.length) / (months.length + 1);

              // Scales
              const maxRevenue = 25;
              const maxConversion = 5;

              const getBarY = (val) => startY - (val / maxRevenue) * chartHeight;
              const getLineY = (val) => startY - (val / maxConversion) * chartHeight;
              const getX = (i) => startX + spacing + i * (barWidth + spacing) + barWidth / 2;

              // Setup Elements
              const gridGroup = svg.querySelector(".gridlines");
              const xAxisGroup = svg.querySelector(".x-axis-labels");
              const barsGroup = svg.querySelector(".bars-group");
              const barLabelsGroup = svg.querySelector(".bar-labels-group");
              const lineLabelsGroup = svg.querySelector(".line-labels-group");
              const conversionPath = svg.querySelector(".conversion-path");
              const lineDot = svg.querySelector(".line-dot");

              // Create Gridlines
              for (let i = 1; i <= 5; i++) {
                const y = startY - i * (chartHeight / 5);
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", startX);
                line.setAttribute("y1", y);
                line.setAttribute("x2", startX + chartWidth);
                line.setAttribute("y2", y);
                line.setAttribute("class", "grid-line");
                gridGroup.appendChild(line);
              }

              // Create X-Axis Labels & Bars & Bar Labels
              const linePoints = [];
              months.forEach((month, i) => {
                const x = getX(i);

                const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
                label.setAttribute("x", x);
                label.setAttribute("y", startY + 30);
                label.setAttribute("class", "axis-label");
                label.textContent = month;
                xAxisGroup.appendChild(label);

                const barHeight = (revenueData[i] / maxRevenue) * chartHeight;
                const bar = document.createElementNS("http://www.w3.org/2000/svg", "rect");
                bar.setAttribute("x", x - barWidth / 2);
                bar.setAttribute("y", startY);
                bar.setAttribute("width", barWidth);
                bar.setAttribute("height", 0);
                bar.setAttribute("class", "bar");
                barsGroup.appendChild(bar);

                const barLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                barLabel.setAttribute("x", x);
                barLabel.setAttribute("y", getBarY(revenueData[i]) - 10);
                barLabel.setAttribute("class", "bar-label");
                barLabel.textContent = `$${revenueData[i]}K`;
                barLabelsGroup.appendChild(barLabel);

                linePoints.push(`${x},${getLineY(conversionData[i])}`);

                const lineLabel = document.createElementNS("http://www.w3.org/2000/svg", "text");
                lineLabel.setAttribute("x", x);
                lineLabel.setAttribute("y", getLineY(conversionData[i]) - 15);
                lineLabel.setAttribute("class", "line-label");
                lineLabel.textContent = `${conversionData[i]}%`;
                lineLabelsGroup.appendChild(lineLabel);
              });

              // Set Path Data
              conversionPath.setAttribute("d", `M ${linePoints.join(" L ")}`);
              const pathLength = conversionPath.getTotalLength();
              conversionPath.style.strokeDasharray = pathLength;
              conversionPath.style.strokeDashoffset = pathLength;

              // --- ANIMATION TIMELINE ---

              tl.to(
                '[data-composition-id="data-chart"] .headline',
                {
                  clipPath: "inset(0 0% 0 0)",
                  duration: 1.2,
                  ease: "power1.inOut",
                },
                0,
              );

              tl.to(
                '[data-composition-id="data-chart"] .subtitle',
                {
                  clipPath: "inset(0 0% 0 0)",
                  duration: 1.2,
                  ease: "power1.inOut",
                },
                0.2,
              );

              tl.to(
                '[data-composition-id="data-chart"] .key',
                {
                  opacity: 1,
                  duration: 0.4,
                  ease: "power2.out",
                },
                1.0,
              );

              tl.to(
                '[data-composition-id="data-chart"] .grid-line',
                {
                  opacity: 1,
                  duration: 0.5,
                  stagger: 0.25,
                  ease: "power2.out",
                },
                0.5,
              );

              // Bars
              const bars = barsGroup.querySelectorAll(".bar");
              const barLabels = barLabelsGroup.querySelectorAll(".bar-label");

              bars.forEach((bar, i) => {
                const barHeight = (revenueData[i] / maxRevenue) * chartHeight;
                const startTime = 1.5 + i * 0.5;

                tl.to(
                  bar,
                  {
                    attr: { height: barHeight, y: startY - barHeight },
                    duration: 0.8,
                    ease: "power2.out",
                  },
                  startTime,
                );

                tl.to(
                  barLabels[i],
                  {
                    opacity: 1,
                    duration: 0.3,
                    ease: "power2.out",
                  },
                  startTime + 0.8,
                );
              });

              // Line
              const lastBarStartTime = 1.5 + (months.length - 1) * 0.5;
              const lineStartTime = lastBarStartTime + 0.5;

              tl.to(
                conversionPath,
                {
                  strokeDashoffset: 0,
                  duration: 3,
                  ease: "none",
                },
                lineStartTime,
              );

              // Line Dot & Labels
              tl.set(
                lineDot,
                {
                  opacity: 1,
                  attr: { cx: getX(0), cy: getLineY(conversionData[0]) },
                },
                lineStartTime,
              );

              const lineLabels = lineLabelsGroup.querySelectorAll(".line-label");
              months.forEach((_, i) => {
                if (i > 0) {
                  const x = getX(i);
                  const y = getLineY(conversionData[i]);
                  tl.to(
                    lineDot,
                    {
                      attr: { cx: x, cy: y },
                      duration: 3 / (months.length - 1),
                      ease: "none",
                    },
                    lineStartTime + ((i - 1) / (months.length - 1)) * 3,
                  );
                }

                const labelTime = lineStartTime + (i / (months.length - 1)) * 3 + 0.2;

                lineLabels[i].textContent = "0.0%";

                tl.to(
                  lineLabels[i],
                  {
                    opacity: 1,
                    duration: 0.1,
                    ease: "power2.out",
                  },
                  labelTime,
                );

                const dummy = { val: 0 };
                tl.to(
                  dummy,
                  {
                    val: conversionData[i],
                    duration: 0.8,
                    ease: "power2.out",
                    onUpdate: () => {
                      lineLabels[i].textContent = dummy.val.toFixed(1) + "%";
                    },
                  },
                  labelTime,
                );
              });

              // Source Line
              tl.to(
                '[data-composition-id="data-chart"] .source',
                {
                  opacity: 1,
                  duration: 0.5,
                  ease: "power2.out",
                },
                ">+0.5",
              );

              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#faf9f6">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="data-chart"
          data-composition-id="data-chart"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="15"
        >
          <div class="chart-container">
            
            <div class="header">
              <h1 class="headline">Monthly Revenue vs. Conversion Rate</h1>
              <p class="subtitle">Jan–Jun 2024, in thousands</p>
              <div class="key">
                <div class="key-item">
                  <div class="key-box revenue-box"></div>
                  <span class="key-text">Revenue</span>
                </div>
                <div class="key-item">
                  <div class="key-line conversion-line"></div>
                  <span class="key-text">Conversion Rate</span>
                </div>
              </div>
            </div>
    
            
            <svg class="chart-svg" viewBox="0 0 1600 700" preserveAspectRatio="xMidYMid meet">
              
              <g class="gridlines"></g>
    
              
              <g class="x-axis-labels"></g>
    
              
              <g class="bars-group"></g>
    
              
              <g class="bar-labels-group"></g>
    
              
              <g class="line-group">
                <path class="conversion-path" fill="none" stroke="#326FA8" stroke-width="1.5" />
                <circle class="line-dot" r="5" fill="#326FA8" style="opacity: 0" />
              </g>
    
              
              <g class="line-labels-group"></g>
    
              
              <line x1="100" y1="600" x2="1500" y2="600" stroke="black" stroke-width="1" />
            </svg>
    
            
            <div class="source">Source: Internal analytics</div>
          </div>
    
          
    
          
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    margin: 0;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background-color: #faf9f6;
  }


  [data-composition-id="data-chart"] {
    width: 1920px;
    height: 1080px;
    background-color: #faf9f6;
    font-family: "Libre Franklin", sans-serif;
    color: #333;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
  }

  [data-composition-id="data-chart"] .chart-container {
    width: 1600px;
    height: 900px;
    display: flex;
    flex-direction: column;
    position: relative;
    transform: scale(1.15);
    transform-origin: center center;
  }

  [data-composition-id="data-chart"] .header {
    margin-bottom: 40px;
    text-align: left;
  }

  [data-composition-id="data-chart"] .headline {
    font-family: "Libre Baskerville", serif;
    font-size: 42px;
    margin: 0;
    padding: 0;
    clip-path: inset(0 100% 0 0);
    white-space: nowrap;
  }

  [data-composition-id="data-chart"] .subtitle {
    font-size: 16px;
    color: #666;
    margin: 8px 0 16px 0;
    clip-path: inset(0 100% 0 0);
    white-space: nowrap;
  }

  [data-composition-id="data-chart"] .key {
    display: flex;
    gap: 24px;
    opacity: 0;
  }

  [data-composition-id="data-chart"] .key-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  [data-composition-id="data-chart"] .key-box {
    width: 10px;
    height: 10px;
    background-color: #5c5c5c;
  }

  [data-composition-id="data-chart"] .key-line {
    width: 16px;
    height: 1.5px;
    background-color: #326fa8;
  }

  [data-composition-id="data-chart"] .key-text {
    font-size: 13px;
    color: #666;
  }

  [data-composition-id="data-chart"] .chart-svg {
    width: 100%;
    height: 600px;
    overflow: visible;
  }

  [data-composition-id="data-chart"] .source {
    position: absolute;
    bottom: 0;
    left: 0;
    font-size: 11px;
    color: #999;
    opacity: 0;
  }

  [data-composition-id="data-chart"] .grid-line {
    stroke: #e8e8e8;
    stroke-width: 0.5px;
    opacity: 0;
  }

  [data-composition-id="data-chart"] .axis-label {
    font-size: 14px;
    fill: #666;
    text-anchor: middle;
  }

  [data-composition-id="data-chart"] .bar {
    fill: #5c5c5c;
  }

  [data-composition-id="data-chart"] .bar-label {
    font-size: 14px;
    fill: #333;
    text-anchor: middle;
    opacity: 0;
  }

  [data-composition-id="data-chart"] .line-label {
    font-size: 14px;
    fill: #326fa8;
    font-weight: 600;
    text-anchor: middle;
    opacity: 0;
  }
}
</style>
