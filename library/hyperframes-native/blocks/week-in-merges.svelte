<!-- Modified Svelte adaptation of registry/blocks/week-in-merges/week-in-merges.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
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

              var FLOOR_SPEED = 10;
              var LEADER_SPEED = 300;

              function readVars() {
                var out = {};
                var root = document.getElementById("wim-root");
                try {
                  JSON.parse(root.getAttribute("data-composition-variables")).forEach(function (d) {
                    out[d.id] = d.default;
                  });
                } catch (err) {
                  // Declaration unreadable; the literal fallbacks below still render.
                }
                var hf = __hfHost;
                var overrides =
                  hf && typeof hf.getVariables === "function"
                    ? hf.getVariables()
                    : __hfHost.variables;
                if (overrides && typeof overrides === "object") {
                  for (var key in overrides) {
                    if (overrides[key] !== undefined) out[key] = overrides[key];
                  }
                }
                return out;
              }

              function num(value, fallback, lo, hi) {
                var n = typeof value === "number" ? value : Number.parseFloat(value);
                if (!Number.isFinite(n)) n = fallback;
                return Math.min(hi, Math.max(lo, n));
              }

              function str(value, fallback) {
                return typeof value === "string" && value.length > 0 ? value : fallback;
              }

              var FALLBACK_ROWS = [
                { name: "Ada", merges: 12, avatar: "" },
                { name: "Bao", merges: 7, avatar: "" },
                { name: "Cam", merges: 4, avatar: "" },
                { name: "Dee", merges: 2, avatar: "" },
                { name: "Eli", merges: 1, avatar: "" },
              ];

              function parseRows(text) {
                var raw;
                try {
                  raw = JSON.parse(String(text));
                } catch (err) {
                  return null;
                }
                if (!Array.isArray(raw)) return null;
                var out = [];
                for (var i = 0; i < raw.length; i++) {
                  var row = raw[i];
                  if (!row || typeof row.name !== "string" || row.name.trim().length === 0) continue;
                  var merges = Math.round(num(row.merges, 0, 0, 100000));
                  var avatar = typeof row.avatar === "string" ? row.avatar : "";
                  out.push({ name: row.name.trim(), merges: merges, avatar: avatar });
                }
                return out.length > 0 ? out : null;
              }

              function mergeLabel(merges) {
                return merges + (merges === 1 ? " merge" : " merges");
              }

              function overflowLine(hidden) {
                if (hidden.length === 0) return "";
                var n = hidden.length;
                var lo = hidden[0].merges;
                var hi = lo;
                for (var i = 1; i < hidden.length; i++) {
                  if (hidden[i].merges < lo) lo = hidden[i].merges;
                  if (hidden[i].merges > hi) hi = hidden[i].merges;
                }
                var who = n === 1 ? "1 more person" : n + " more people";
                var span = lo === hi ? mergeLabel(lo) : lo + "-" + hi + " merges";
                return "and " + who + " with " + span;
              }

              function initials(name) {
                var parts = name.trim().split(/\s+/);
                if (parts.length >= 2) {
                  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
                }
                return (parts[0] || "?").charAt(0).toUpperCase();
              }

              // Distance tracks merges / the leader's count. The floor is only for a
              // genuine zero, so a near-tie stays a near-tie.
              function speedFor(merges, maxM) {
                if (!(merges > 0)) return FLOOR_SPEED;
                if (!(maxM > 0)) return LEADER_SPEED;
                return (LEADER_SPEED * merges) / maxM;
              }

              function bounceX(distance, span) {
                var cycle = span * 2;
                if (!(cycle > 0)) return 0;
                var phase = distance % cycle;
                if (phase < 0) phase += cycle;
                return phase <= span ? phase : cycle - phase;
              }

              var root = document.getElementById("wim-root");
              var V = readVars();
              var DURATION = num(root.getAttribute("data-duration"), 16, 0.1, 600);
              var parsed = parseRows(V.rows) || FALLBACK_ROWS;
              var rowsMax = Math.round(num(V.rows_max, 12, 1, 12));
              var ranked = parsed.slice().sort(function (a, b) {
                return b.merges - a.merges;
              });
              var rows = ranked.slice(0, rowsMax);
              var hidden = ranked.slice(rowsMax);
              var maxM = rows[0].merges;
              for (var i = 1; i < rows.length; i++) {
                if (rows[i].merges > maxM) maxM = rows[i].merges;
              }

              document.getElementById("wim-eyebrow").textContent = str(
                V.eyebrow,
                "ACME / WEEK IN MERGES",
              );
              document.getElementById("wim-title").textContent = str(
                V.title,
                "Pull requests merged this week",
              );
              document.getElementById("wim-period").textContent = str(V.period, "");
              document.getElementById("wim-total").textContent = str(V.total, "");
              document.getElementById("wim-footer").textContent = str(
                V.footer,
                "Speed proportional to merges · By PR author",
              );
              document.getElementById("wim-source").textContent = str(V.source, "");
              var overflowEl = document.getElementById("wim-overflow");
              var overflowText = str(V.overflow, "") || overflowLine(hidden);
              overflowEl.textContent = overflowText;
              overflowEl.style.display = overflowText ? "block" : "none";

              var mount = document.getElementById("wim-rows");
              var avatars = [];
              for (var r = 0; r < rows.length; r++) {
                var row = rows[r];
                var rowEl = document.createElement("div");
                rowEl.className = "wim-row";
                rowEl.id = "wim-row-" + r;

                var meta = document.createElement("div");
                meta.className = "wim-meta";
                var nameEl = document.createElement("div");
                nameEl.className = "wim-name";
                nameEl.id = "wim-name-" + r;
                nameEl.textContent = row.name;
                var countEl = document.createElement("div");
                countEl.className = "wim-count";
                countEl.id = "wim-count-" + r;
                countEl.textContent = mergeLabel(row.merges);
                meta.appendChild(nameEl);
                meta.appendChild(countEl);

                var lane = document.createElement("div");
                lane.className = "wim-lane";
                lane.id = "wim-lane-" + r;

                var avatar = document.createElement("div");
                avatar.className =
                  "wim-avatar " + (row.merges === maxM ? "wim-avatar-lead" : "wim-avatar-rest");
                avatar.id = "wim-avatar-" + r;

                if (row.avatar) {
                  var img = document.createElement("img");
                  img.id = "wim-avatar-img-" + r;
                  img.alt = "";
                  img.src = row.avatar;
                  avatar.appendChild(img);
                } else {
                  var letters = document.createElement("div");
                  letters.className = "wim-initials";
                  letters.id = "wim-initials-" + r;
                  letters.textContent = initials(row.name);
                  avatar.appendChild(letters);
                }

                lane.appendChild(avatar);
                rowEl.appendChild(meta);
                rowEl.appendChild(lane);
                mount.appendChild(rowEl);
                avatars.push({ el: avatar, nameEl: nameEl, speed: speedFor(row.merges, maxM) });
              }

              var rowH = avatars.length ? document.getElementById("wim-row-0").clientHeight : 120;
              var avatarPx = Math.max(36, Math.min(96, Math.floor(rowH * 0.62)));
              var namePx = Math.max(18, Math.min(36, Math.floor(rowH * 0.26)));
              var countPx = Math.max(13, Math.min(16, Math.floor(namePx * 0.48)));
              root.style.setProperty("--wim-avatar", avatarPx + "px");
              for (var a = 0; a < avatars.length; a++) {
                avatars[a].nameEl.style.fontSize = namePx + "px";
                avatars[a].el.querySelector(".wim-initials") &&
                  (avatars[a].el.querySelector(".wim-initials").style.fontSize =
                    Math.round(avatarPx * 0.4) + "px");
                var count = document.getElementById("wim-count-" + a);
                if (count) count.style.fontSize = countPx + "px";
              }

              var laneW = avatars.length ? document.getElementById("wim-lane-0").clientWidth : 560;
              var span = Math.max(0, laneW - avatarPx);

              function render(t) {
                for (var i = 0; i < avatars.length; i++) {
                  var x = bounceX(avatars[i].speed * t, span);
                  avatars[i].el.style.transform = "translateX(" + x.toFixed(2) + "px)";
                }
              }

              // GSAP seek calls the setter. A timeline onUpdate does not run on seek.
              var driver = { _t: 0 };
              Object.defineProperty(driver, "t", {
                get: function () {
                  return this._t;
                },
                set: function (value) {
                  this._t = value;
                  render(value);
                },
              });

              var tl = gsap.timeline({ paused: true });
              tl.to(driver, { t: DURATION, duration: DURATION, ease: "none" }, 0);
              render(0);

              
              __hfTimelineSlot.set(tl);
            })();
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#ffffff">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="wim-root"
          data-composition-id="week-in-merges"
          data-width="1080"
          data-height="1350"
          data-start="0"
          data-duration="16"
          data-composition-variables='[
            &#123;"id":"eyebrow","type":"string","label":"Eyebrow","default":"ACME / WEEK IN MERGES"&#125;,
            &#123;"id":"title","type":"string","label":"Title","default":"Pull requests merged this week"&#125;,
            &#123;"id":"period","type":"string","label":"Period","default":"1 September - 7 September 2026 · America/Los_Angeles"&#125;,
            &#123;"id":"total","type":"string","label":"Total","default":"12 PRs"&#125;,
            &#123;"id":"footer","type":"string","label":"Footer","default":"Speed proportional to merges · By PR author"&#125;,
            &#123;"id":"source","type":"string","label":"Source line","default":"Example org · 1 repo · Bots · 0"&#125;,
            &#123;"id":"rows","type":"string","label":"Rows (JSON array of name, merges, avatar)","default":"[&#123;\"name\":\"Ada\",\"merges\":12,\"avatar\":\"\"&#125;,&#123;\"name\":\"Bao\",\"merges\":7,\"avatar\":\"\"&#125;,&#123;\"name\":\"Cam\",\"merges\":4,\"avatar\":\"\"&#125;,&#123;\"name\":\"Dee\",\"merges\":2,\"avatar\":\"\"&#125;,&#123;\"name\":\"Eli\",\"merges\":1,\"avatar\":\"\"&#125;]"&#125;,
            &#123;"id":"rows_max","type":"number","label":"Maximum rows","default":12,"min":1,"max":12,"step":1,"description":"Authors drawn, highest merge count first."&#125;,
            &#123;"id":"overflow","type":"string","label":"Overflow line","default":"","description":"Line for everyone past the cap. Empty writes it from the rows left out."&#125;
          ]'
        >
          <div id="wim-stage" class="clip" data-start="0" data-duration="16" data-track-index="0">
            <p id="wim-eyebrow"></p>
            <h1 id="wim-title"></h1>
            <div id="wim-sub">
              <p id="wim-period"></p>
              <p id="wim-total"></p>
            </div>
            <div id="wim-rows"></div>
            <p id="wim-overflow"></p>
            <div id="wim-rule"></div>
            <p id="wim-footer"></p>
            <p id="wim-source"></p>
          </div>
    
          
    
          
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1080px; height: 1350px; overflow: hidden;
  }
  .hf-port, .hf-port *, .hf-port *::before, .hf-port *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  .hf-port {
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background-color: #ffffff;
  }


  #wim-root {
    position: relative;
    width: 1080px;
    height: 1350px;
    overflow: hidden;
    background: #ffffff;
    color: #141414;
    font-family: Inter, sans-serif;
  }

  #wim-stage {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    padding: 64px 72px 52px;
  }

  #wim-eyebrow {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(20, 20, 20, 0.55);
  }

  #wim-title {
    margin-top: 16px;
    font-size: 52px;
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.05;
  }

  #wim-sub {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 24px;
    margin-top: 16px;
  }

  #wim-period {
    font-size: 20px;
    line-height: 1.3;
    color: rgba(20, 20, 20, 0.55);
  }

  #wim-total {
    flex: none;
    font-size: 22px;
    font-weight: 600;
    white-space: nowrap;
  }

  #wim-rows {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    margin-top: 28px;
  }

  .wim-row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 28px;
    min-height: 0;
  }

  .wim-meta {
    width: 280px;
    flex: none;
    min-width: 0;
  }

  .wim-name, .wim-count {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .wim-name {
    font-size: 36px;
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .wim-count {
    margin-top: 4px;
    font-size: 16px;
    line-height: 1.2;
    color: rgba(20, 20, 20, 0.55);
  }

  .wim-lane {
    position: relative;
    flex: 1;
    align-self: stretch;
    min-width: 0;
  }

  .wim-avatar {
    position: absolute;
    left: 0;
    top: 50%;
    width: var(--wim-avatar, 88px);
    height: var(--wim-avatar, 88px);
    margin-top: calc(var(--wim-avatar, 88px) / -2);
    border-radius: 50%;
    overflow: hidden;
  }

  .wim-avatar-lead {
    background: rgba(20, 20, 20, 0.72);
  }

  .wim-avatar-rest {
    background: rgba(20, 20, 20, 0.45);
  }

  .wim-avatar img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .wim-initials {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    color: #ffffff;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  #wim-rule {
    height: 1px;
    margin: 12px 0 18px;
    background: rgba(20, 20, 20, 0.14);
  }

  #wim-overflow {
    display: none;
    margin-top: 8px;
    font-size: 18px;
    line-height: 1.3;
    color: rgba(20, 20, 20, 0.55);
  }

  #wim-footer, #wim-source {
    font-size: 16px;
    line-height: 1.4;
    color: rgba(20, 20, 20, 0.55);
  }

  #wim-source {
    margin-top: 4px;
  }
}
</style>
