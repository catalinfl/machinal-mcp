<!-- Modified Svelte adaptation of registry/components/chart-story/chart-story.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

                var NS = "http://www.w3.org/2000/svg";
                var root = document.getElementById("root");
                var stage = root.querySelector(".cs-stage");
                var vars =
                  __hfHost && __hfHost.getVariables
                    ? __hfHost.getVariables()
                    : {};

                var typeOptions = { bars: 1, line: 1, donut: 1, progress: 1 };
                var type = Object.prototype.hasOwnProperty.call(typeOptions, vars.type)
                  ? vars.type
                  : "bars";
                var unit = vars.unit == null ? "%" : String(vars.unit);
                var exit = vars.exit === "fade" || vars.exit === "up" ? vars.exit : "none";

                // Each enum choice routes to a DIFFERENT contract token so the
                // variable stays meaningful under a theme.
                var accentColors = {
                  green: "var(--brand, #71f5a7)",
                  blue: "var(--accent, #61a8ff)",
                  violet: "var(--accent-2, #c5a3ff)",
                };
                var accent = Object.prototype.hasOwnProperty.call(accentColors, vars.accent)
                  ? vars.accent
                  : "green";
                var accentColor = accentColors[accent];
                var inkColor = "var(--fg, #f8fafc)";
                // Label ink: raw --muted fails contrast on near-white hosts
                // (#94a3b8 on #f8fafc is ~2.4:1). Pulling it halfway toward --fg
                // stays quiet next to inkColor yet passes 4.5:1 on light AND
                // dark hosts, since --fg is by definition high-contrast on --bg.
                var mutedColor = "color-mix(in srgb, var(--fg, #f8fafc) 50%, var(--muted, #94a3b8))";
                var borderColor = "var(--border, #475569)";
                var baseSeries = "color-mix(in srgb, var(--fg, #f8fafc) 44%, var(--surface, #10161f))";
                var lineSeries = "color-mix(in srgb, var(--fg, #f8fafc) 82%, var(--surface, #10161f))";
                var trackColor = "color-mix(in srgb, var(--border, #475569) 55%, transparent)";

                // Values keep their raw tokens: the displayed final numbers are
                // the exact supplied strings, never a re-rounded float.
                var tokens = String(vars.data == null ? "" : vars.data)
                  .split(",")
                  .map(function (token) {
                    return token.trim();
                  })
                  .filter(function (token) {
                    return token !== "" && Number.isFinite(Number(token));
                  });
                if (tokens.length === 0) tokens = ["12", "28", "45", "64"];
                var values = tokens.map(Number);
                var n = values.length;

                var labels = String(vars.labels == null ? "Q1, Q2, Q3, Q4" : vars.labels)
                  .split(",")
                  .map(function (label) {
                    return label.trim();
                  });
                while (labels.length < n) labels.push("");

                var emphasize = Math.round(Number(vars.emphasize));
                if (!Number.isFinite(emphasize)) emphasize = n - 1;
                emphasize = Math.min(Math.max(emphasize, 0), n - 1);

                var displays = tokens.map(function (token) {
                  return token + unit;
                });
                var emphasizedValue = values[emphasize];
                var emphasizedDecimals = (tokens[emphasize].split(".")[1] || "").length;

                var maxValue = Math.max(1e-9, Math.max.apply(null, values));
                var FPS = 30;

                stage.setAttribute(
                  "aria-label",
                  labels
                    .slice(0, n)
                    .map(function (label, index) {
                      return (label ? label + " " : "") + displays[index];
                    })
                    .join(", "),
                );

                var svg = document.createElementNS(NS, "svg");
                svg.setAttribute("viewBox", "0 0 1000 560");
                svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
                stage.appendChild(svg);

                function make(name, attrs, parent) {
                  var node = document.createElementNS(NS, name);
                  for (var key in attrs) node.setAttribute(key, String(attrs[key]));
                  (parent || svg).appendChild(node);
                  return node;
                }

                function text(x, y, size, fill, anchor, parent) {
                  var node = make(
                    "text",
                    {
                      x: x,
                      y: y,
                      "font-size": size,
                      "text-anchor": anchor || "middle",
                      class: "cs-mono",
                    },
                    parent,
                  );
                  node.style.fill = fill;
                  return node;
                }

                // Dashed draw setup: length comes from getTotalLength, never the
                // pathLength attribute, and dashed strokes never use
                // vector-effect: non-scaling-stroke.
                function dashPrepare(node) {
                  var length = node.getTotalLength();
                  node.style.strokeDasharray = length + " " + length;
                  gsap.set(node, { strokeDashoffset: length });
                  return length;
                }

                // Envelope (base seconds, all scaled together, never timeScaled)
                var IN_BASE = 3.3;
                var OUT_BASE = exit === "none" ? 0 : 0.5;
                var STILLNESS = 0.3;
                var duration = Math.max(0.001, parseFloat(root.dataset.duration || "5"));
                var totalBase = IN_BASE + OUT_BASE;
                var s = duration < totalBase ? duration / totalBase : 1;
                var IN = IN_BASE * s;
                var OUT = OUT_BASE * s;
                var HOLD = Math.max(0, duration - (IN + OUT));
                var HOLD_START = IN;
                var OUT_START = IN + HOLD;

                var AXIS_AT = 0.15;
                var AXIS_DUR = 0.5;
                var BUILD_AT = 0.55;
                var BUILD_DUR = 1.6;
                var LABELS_AT = 0.85;
                var CALLOUT_AT = 2.35;
                var POP_DUR = 0.45;
                var ROLL_DUR = 0.7;

                var tl = gsap.timeline({ paused: true });

                gsap.set(stage, { opacity: 0, y: "2.4cqh" });
                tl.to(stage, { opacity: 1, duration: 0.5 * s, ease: "power2.out" }, 0);
                tl.to(stage, { y: "0cqh", duration: 0.5 * s, ease: "power3.out" }, 0);

                function fadeIn(node, at, rise) {
                  gsap.set(node, rise ? { opacity: 0, y: 8 } : { opacity: 0 });
                  tl.to(
                    node,
                    rise
                      ? { opacity: 1, y: 0, duration: 0.4 * s, ease: "power2.out" }
                      : { opacity: 1, duration: 0.4 * s, ease: "power2.out" },
                    at * s,
                  );
                }

                function drawBaseline(x0, x1, y) {
                  var baseline = make("path", {
                    d: "M " + x0 + " " + y + " L " + x1 + " " + y,
                    fill: "none",
                    "stroke-width": 3,
                    "stroke-linecap": "round",
                  });
                  baseline.style.stroke = borderColor;
                  var length = dashPrepare(baseline);
                  tl.to(
                    baseline,
                    { strokeDashoffset: 0, duration: AXIS_DUR * s, ease: "power2.inOut" },
                    AXIS_AT * s,
                  );
                  return length;
                }

                // Callout chip: pops with a smooth settle, number rows are
                // authored frames that land on the exact supplied token.
                function makeCallout(anchorX, bottomY) {
                  var label = displays[emphasize];
                  var width = Math.max(96, Array.from(label).length * 17 + 44);
                  var height = 52;
                  var cx = Math.min(Math.max(anchorX, width / 2 + 8), 1000 - width / 2 - 8);
                  var group = make("g", {});
                  var chip = make(
                    "rect",
                    {
                      x: cx - width / 2,
                      y: bottomY - height,
                      width: width,
                      height: height,
                      rx: 12,
                    },
                    group,
                  );
                  chip.style.fill = accentColor;
                  var valueNode = text(
                    cx,
                    bottomY - height / 2 + 10,
                    29,
                    "var(--bg, #05070b)",
                    "middle",
                    group,
                  );
                  valueNode.setAttribute("font-weight", "600");
                  popAndRoll(group, valueNode, "50% 100%");
                }

                function popAndRoll(group, valueNode, origin) {
                  gsap.set(group, { opacity: 0, scale: 0.6, transformOrigin: origin });
                  tl.to(group, { opacity: 1, duration: 0.25 * s, ease: "power2.out" }, CALLOUT_AT * s);
                  tl.to(
                    group,
                    { scale: 1, duration: POP_DUR * s, ease: "back.out(1.7)" },
                    CALLOUT_AT * s,
                  );
                  var frames = Math.max(1, Math.round(ROLL_DUR * s * FPS));
                  var ease = gsap.parseEase("power2.out");
                  var suffix = valueNode.__rollUnitless ? "" : unit;
                  for (var frame = 0; frame <= frames; frame += 1) {
                    var row =
                      frame === frames
                        ? tokens[emphasize] + suffix
                        : (emphasizedValue * ease(frame / frames)).toFixed(emphasizedDecimals) + suffix;
                    tl.set(
                      valueNode,
                      { textContent: row },
                      (CALLOUT_AT + ROLL_DUR * (frame / frames)) * s,
                    );
                  }
                }

                function buildBars() {
                  var left = 80;
                  var right = 920;
                  var base = 470;
                  var top = 120;
                  var band = (right - left) / n;
                  var barWidth = Math.min(band * 0.62, 150);
                  drawBaseline(left, right, base);
                  var stagger = n > 1 ? (BUILD_DUR - 0.85) / (n - 1) : 0;

                  values.forEach(function (value, index) {
                    var height = Math.max((value / maxValue) * (base - top), 3);
                    var cx = left + band * (index + 0.5);
                    var at = BUILD_AT + stagger * index;
                    // Radius never exceeds half the bar height, so tiny data
                    // values render as clean low bars instead of radius-crushed
                    // slivers. Growth animates the rect geometry (not scaleY):
                    // the renderer re-clamps the corner radius against the
                    // current height every frame, so no growth frame shows a
                    // squashed pill either.
                    var bar = make("rect", {
                      x: cx - barWidth / 2,
                      y: base,
                      width: barWidth,
                      height: 0,
                      rx: Math.min(10, barWidth * 0.18, height / 2),
                    });
                    bar.style.fill = index === emphasize ? accentColor : baseSeries;
                    tl.to(
                      bar,
                      {
                        attr: { height: height, y: base - height },
                        duration: 0.85 * s,
                        ease: "power3.out",
                      },
                      at * s,
                    );

                    var axisLabel = text(cx, base + 42, 26, mutedColor);
                    axisLabel.textContent = labels[index];
                    fadeIn(axisLabel, LABELS_AT + index * 0.12, true);

                    if (index !== emphasize) {
                      var valueLabel = text(cx, base - height - 16, 27, inkColor);
                      valueLabel.textContent = displays[index];
                      fadeIn(valueLabel, at + 0.65, true);
                    }
                  });

                  var emphasizedHeight = Math.max((values[emphasize] / maxValue) * (base - top), 3);
                  makeCallout(left + band * (emphasize + 0.5), base - emphasizedHeight - 20);
                }

                function buildLine() {
                  var left = 80;
                  var right = 920;
                  var base = 470;
                  var top = 120;
                  drawBaseline(left, right, base);

                  var points = values.map(function (value, index) {
                    return {
                      x: left + (right - left) * (n === 1 ? 0.5 : index / (n - 1)),
                      y: base - (value / maxValue) * (base - top),
                    };
                  });
                  var lineD = points
                    .map(function (point, index) {
                      return (index === 0 ? "M " : "L ") + point.x + " " + point.y;
                    })
                    .join(" ");

                  // Translucent area fill fades in after the stroke finishes.
                  var area = make("path", {
                    d:
                      lineD +
                      " L " +
                      points[n - 1].x +
                      " " +
                      base +
                      " L " +
                      points[0].x +
                      " " +
                      base +
                      " Z",
                    stroke: "none",
                  });
                  area.style.fill = accentColor;
                  gsap.set(area, { opacity: 0 });
                  tl.to(
                    area,
                    { opacity: 0.14, duration: 0.45 * s, ease: "power2.out" },
                    (BUILD_AT + BUILD_DUR - 0.05) * s,
                  );

                  var line = make("path", {
                    d: lineD,
                    fill: "none",
                    "stroke-width": 6,
                    "stroke-linecap": "round",
                    "stroke-linejoin": "round",
                  });
                  line.style.stroke = lineSeries;
                  dashPrepare(line);
                  // ease "none" keeps the dash front aligned with the per-point
                  // cumulative-length timings below.
                  tl.to(
                    line,
                    { strokeDashoffset: 0, duration: (BUILD_DUR - 0.1) * s, ease: "none" },
                    BUILD_AT * s,
                  );

                  var cumulative = [0];
                  for (var index = 1; index < n; index += 1) {
                    cumulative.push(
                      cumulative[index - 1] +
                        Math.hypot(
                          points[index].x - points[index - 1].x,
                          points[index].y - points[index - 1].y,
                        ),
                    );
                  }
                  var totalLength = Math.max(cumulative[n - 1], 1e-9);

                  points.forEach(function (point, index) {
                    var at = BUILD_AT + (BUILD_DUR - 0.1) * (cumulative[index] / totalLength);
                    var dot = make("circle", {
                      cx: point.x,
                      cy: point.y,
                      r: index === emphasize ? 11 : 7,
                    });
                    dot.style.fill = index === emphasize ? accentColor : inkColor;
                    gsap.set(dot, { scale: 0, transformOrigin: "50% 50%" });
                    tl.to(dot, { scale: 1, duration: 0.35 * s, ease: "back.out(2)" }, at * s);

                    var axisLabel = text(point.x, base + 42, 26, mutedColor);
                    axisLabel.textContent = labels[index];
                    fadeIn(axisLabel, LABELS_AT + index * 0.12, true);

                    if (index !== emphasize) {
                      var valueLabel = text(point.x, point.y - 20, 25, inkColor);
                      valueLabel.textContent = displays[index];
                      fadeIn(valueLabel, at + 0.2, true);
                    }
                  });

                  makeCallout(points[emphasize].x, points[emphasize].y - 24);
                }

                function polar(cx, cy, radius, degrees) {
                  var radians = ((degrees - 90) * Math.PI) / 180;
                  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
                }

                function arcPath(cx, cy, radius, startDeg, endDeg) {
                  var start = polar(cx, cy, radius, startDeg);
                  var end = polar(cx, cy, radius, endDeg);
                  var large = endDeg - startDeg > 180 ? 1 : 0;
                  return (
                    "M " +
                    start.x +
                    " " +
                    start.y +
                    " A " +
                    radius +
                    " " +
                    radius +
                    " 0 " +
                    large +
                    " 1 " +
                    end.x +
                    " " +
                    end.y
                  );
                }

                function buildDonut() {
                  var cx = 500;
                  var cy = 252;
                  var radius = 168;
                  var strokeWidth = 54;
                  var total = Math.max(
                    values.reduce(function (sum, value) {
                      return sum + value;
                    }, 0),
                    1e-9,
                  );
                  var ladder = [72, 50, 36, 26, 18];

                  var track = make("circle", {
                    cx: cx,
                    cy: cy,
                    r: radius,
                    fill: "none",
                    "stroke-width": strokeWidth,
                  });
                  track.style.stroke = trackColor;
                  fadeIn(track, AXIS_AT);

                  var gap = n > 1 ? 3 : 0;
                  var cursor = 0;
                  values.forEach(function (value, index) {
                    var share = value / total;
                    var startDeg = cursor * 360;
                    var endDeg = (cursor + share) * 360;
                    cursor += share;
                    if (endDeg - startDeg <= gap * 2 + 0.05) return;
                    var segment = make("path", {
                      d: arcPath(
                        cx,
                        cy,
                        radius,
                        startDeg + gap / 2,
                        Math.min(endDeg - gap / 2, 359.98),
                      ),
                      fill: "none",
                      "stroke-width": strokeWidth,
                    });
                    segment.style.stroke =
                      index === emphasize
                        ? accentColor
                        : "color-mix(in srgb, var(--fg, #f8fafc) " +
                          ladder[index % ladder.length] +
                          "%, var(--surface, #10161f))";
                    dashPrepare(segment);
                    tl.to(
                      segment,
                      {
                        strokeDashoffset: 0,
                        duration: Math.max(BUILD_DUR * share, 0.05) * s,
                        ease: "none",
                      },
                      (BUILD_AT + BUILD_DUR * (cursor - share)) * s,
                    );
                  });

                  // Legend row beneath, reading order left to right.
                  var itemWidth = Math.min(230, 880 / n);
                  var startX = 500 - (itemWidth * n) / 2;
                  values.forEach(function (value, index) {
                    var x = startX + itemWidth * index;
                    var group = make("g", {});
                    var swatch = make("rect", { x: x, y: 506, width: 20, height: 20, rx: 5 }, group);
                    swatch.style.fill =
                      index === emphasize
                        ? accentColor
                        : "color-mix(in srgb, var(--fg, #f8fafc) " +
                          ladder[index % ladder.length] +
                          "%, var(--surface, #10161f))";
                    var entry = text(x + 32, 523, 24, mutedColor, "start", group);
                    entry.textContent = labels[index] ? labels[index] + " " : "";
                    var valueSpan = document.createElementNS(NS, "tspan");
                    valueSpan.style.fill = inkColor;
                    valueSpan.textContent = displays[index];
                    entry.appendChild(valueSpan);
                    fadeIn(group, LABELS_AT + index * 0.14, true);
                  });

                  // Center callout: the emphasized value rolls to the exact token.
                  var center = make("g", {});
                  var valueText = make(
                    "text",
                    {
                      x: cx,
                      y: cy + 14,
                      "font-size": 84,
                      "text-anchor": "middle",
                      class: "cs-display",
                    },
                    center,
                  );
                  valueText.style.fill = accentColor;
                  var numberSpan = document.createElementNS(NS, "tspan");
                  numberSpan.__rollUnitless = true;
                  valueText.appendChild(numberSpan);
                  var unitSpan = document.createElementNS(NS, "tspan");
                  unitSpan.setAttribute("font-size", 44);
                  unitSpan.style.fill = mutedColor;
                  unitSpan.textContent = unit;
                  valueText.appendChild(unitSpan);
                  if (labels[emphasize]) {
                    var centerLabel = text(cx, cy + 62, 26, mutedColor, "middle", center);
                    centerLabel.textContent = labels[emphasize];
                  }
                  popAndRoll(center, numberSpan, "50% 50%");
                }

                function buildProgress() {
                  var rowHeight = Math.min(92, 440 / n);
                  var top = Math.max(90, 285 - (rowHeight * n) / 2);
                  var trackX = 300;
                  var trackWidth = 560;
                  // Percent-flavored data fills against 100; otherwise the
                  // largest value owns the full track.
                  var denominator = unit.trim() === "%" ? Math.max(100, maxValue) : maxValue;
                  var stagger = n > 1 ? (BUILD_DUR - 0.9) / (n - 1) : 0;

                  values.forEach(function (value, index) {
                    var cy = top + rowHeight * (index + 0.5);
                    var at = BUILD_AT + stagger * index;
                    var fraction = Math.min(Math.max(value / denominator, 0), 1);

                    var track = make("rect", {
                      x: trackX,
                      y: cy - 10,
                      width: trackWidth,
                      height: 20,
                      rx: 10,
                    });
                    track.style.fill = trackColor;
                    fadeIn(track, AXIS_AT + index * 0.08);

                    // Same sliver guard as bars: radius clamped to half the fill
                    // width and growth via rect geometry, never scaleX.
                    var fillWidth = Math.max(trackWidth * fraction, 8);
                    var fill = make("rect", {
                      x: trackX,
                      y: cy - 10,
                      width: 0,
                      height: 20,
                      rx: Math.min(10, fillWidth / 2),
                    });
                    fill.style.fill = index === emphasize ? accentColor : baseSeries;
                    tl.to(
                      fill,
                      { attr: { width: fillWidth }, duration: 0.9 * s, ease: "power3.out" },
                      at * s,
                    );

                    var rowLabel = text(80, cy + 9, 26, mutedColor, "start");
                    rowLabel.textContent = labels[index];
                    fadeIn(rowLabel, LABELS_AT + index * 0.12, true);

                    if (index !== emphasize) {
                      var valueLabel = text(884, cy + 9, 27, inkColor, "start");
                      valueLabel.textContent = displays[index];
                      fadeIn(valueLabel, at + 0.65, true);
                    }
                  });

                  var emphasizedFraction = Math.min(Math.max(values[emphasize] / denominator, 0), 1);
                  makeCallout(
                    trackX + trackWidth * emphasizedFraction,
                    top + rowHeight * (emphasize + 0.5) - 26,
                  );
                }

                if (type === "bars") buildBars();
                else if (type === "line") buildLine();
                else if (type === "donut") buildDonut();
                else buildProgress();

                // HOLD: one finite drift, authored as two explicit tweens, then
                // stillness to the end (or to the exit).
                var driftDuration = Math.max(0, HOLD - STILLNESS);
                if (driftDuration > 0.1) {
                  var half = driftDuration / 2;
                  tl.to(stage, { y: "-0.5cqh", duration: half, ease: "sine.inOut" }, HOLD_START);
                  tl.to(stage, { y: "0cqh", duration: half, ease: "sine.inOut" }, HOLD_START + half);
                }

                if (exit === "fade") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                } else if (exit === "up") {
                  tl.to(stage, { opacity: 0, duration: OUT, ease: "power2.in" }, OUT_START);
                  tl.to(stage, { y: "-3cqh", duration: OUT, ease: "power2.in" }, OUT_START);
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
        &#123; "id": "type", "type": "enum", "role": "content", "label": "Chart type", "description": "Chart form the data builds into.", "default": "bars", "options": [&#123; "value": "bars", "label": "Bars" &#125;, &#123; "value": "line", "label": "Line" &#125;, &#123; "value": "donut", "label": "Donut" &#125;, &#123; "value": "progress", "label": "Progress" &#125;] &#125;,
        &#123; "id": "data", "type": "string", "role": "content", "label": "Data", "description": "Comma-separated numbers; the chart lands exactly on these values.", "default": "12, 28, 45, 64" &#125;,
        &#123; "id": "labels", "type": "string", "role": "content", "label": "Labels", "description": "Comma-separated labels, one per datum.", "default": "Q1, Q2, Q3, Q4" &#125;,
        &#123; "id": "emphasize", "type": "number", "role": "content", "label": "Emphasize", "description": "Index of the datum that takes the accent and the value callout. Clamped to the data range.", "default": 3, "step": 1 &#125;,
        &#123; "id": "unit", "type": "string", "role": "content", "label": "Unit", "description": "Suffix appended to every displayed value.", "default": "%" &#125;,
        &#123; "id": "accent", "type": "enum", "role": "style", "label": "Accent", "description": "Contract color used by the emphasized datum and its callout.", "default": "green", "options": [&#123; "value": "green", "label": "Green" &#125;, &#123; "value": "blue", "label": "Blue" &#125;, &#123; "value": "violet", "label": "Violet" &#125;] &#125;,
        &#123; "id": "exit", "type": "enum", "role": "style", "label": "Exit", "description": "Optional departure. Proof stats end on the still hold, so the default is none.", "default": "none", "options": [&#123; "value": "none", "label": "None" &#125;, &#123; "value": "fade", "label": "Fade" &#125;, &#123; "value": "up", "label": "Up" &#125;] &#125;
      ]' data-composition-duration="5" data-composition-id="chart-story" data-duration="5" data-fps="30">
            
    
            <div
              id="chart-story-clip"
              class="cs-clip clip"
              data-start="0"
              data-duration="5"
              data-track-index="0"
            >
              <div class="cs-stage" role="img"></div>
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

  .cs-clip {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    overflow: hidden;
    background: var(--bg, transparent);
  }

  .cs-stage {
    position: relative;
    width: 92cqw;
    height: 88cqh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-2, 2cqmin);
    will-change: transform, opacity;
  }

  .cs-stage svg {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }

  .cs-mono {
    font-family: var(--font-mono, ui-monospace, "SF Mono", Menlo, Consolas, monospace);
    letter-spacing: 0.03em;
  }

  .cs-display {
    font-family: var(--font-display, Inter, system-ui, sans-serif);
    font-weight: 600;
    letter-spacing: -0.02em;
  }
}
</style>
