<!-- Modified Svelte adaptation of registry/blocks/gallery-tunnel/gallery-tunnel.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import * as THREE from 'three';
  import __hfAsset from '@machinal/hyperframes/media/blocks-gallery-tunnel';
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
    (function () {
            var DUR = 12;
            var W = 1920;
            var H = 1080;

            // Fixed tunnel geometry, measured off the reference.
            var TUNNEL_WIDTH = 2;
            var TUNNEL_HEIGHT = 1.8;
            var SEGMENT_DEPTH = 1;
            var NUM_SEGMENTS = 15;
            var LINE_RADIUS = 0.003;
            var FOV = 75;
            var INSET = 0.94; // slab gutter inside its cell, so tiles read as discrete
            var SKIN = 0.002; // push slabs just behind the wall plane so edges stay on top

            var ROOT = document.getElementById("gt-root");
            var CS = getComputedStyle(ROOT);

            // `data-composition-variables` is the single owner of every declared
            // default — parse it rather than repeating each default a second time
            // in JS. `__hfHost` is NOT guaranteed to exist yet when this
            // inline script runs, so it can only ever be an override, never the
            // source. Precedence: host CSS custom property, runtime variable bag,
            // declared default.
            var DECL = {};
            JSON.parse(ROOT.getAttribute("data-composition-variables") || "[]").forEach(function (v) {
              DECL[v.id] = v.default;
            });
            var HF = __hfHost;
            var V = (HF && HF.getVariables && HF.getVariables()) || {};

            function raw(id) {
              var css = CS.getPropertyValue("--" + id.toLowerCase()).trim();
              if (css !== "") return css;
              if (V[id] !== undefined && V[id] !== "") return V[id];
              return DECL[id];
            }
            function num(id) {
              var n = parseFloat(raw(id));
              return isFinite(n) ? n : 0;
            }
            function str(id) {
              var s = raw(id);
              return typeof s === "string" ? s.trim() : "";
            }
            function list(id) {
              return str(id)
                .split(",")
                .map(function (s) {
                  return s.trim();
                })
                .filter(function (s) {
                  return s !== "";
                });
            }

            var SPEED = num("speed");
            var GRID = Math.max(1, Math.min(4, Math.round(num("grid"))));
            var FILL = num("fill");
            var IMAGE_MIX = num("imageMix");
            var FOG_FAR = Math.max(3, Math.min(14.5, num("fog")));
            var EDGE_OPACITY = num("edgeOpacity");
            var EDGE_COLOR = str("edgeColor");
            var BACKDROP = str("backdrop");
            var PALETTE = list("palette");
            var IMAGE_SRCS = list("images");

            document.getElementById("gt-backdrop").style.background = BACKDROP;

            // How far behind the camera a segment travels before it recycles. Tying
            // it to the fog distance is the whole trick: the recycle boundary lands
            // at exactly FOG_FAR, so a segment reappears already fogged to pure
            // backdrop and nothing ever pops in at the far end. One owner for the
            // invariant — move the fog and the boundary follows.
            var BACK = Math.max(0, Math.min(1.5, NUM_SEGMENTS * SEGMENT_DEPTH - FOG_FAR));

            // Deterministic 2D integer hash — the only source of "randomness".
            // Content at frame N is a pure function of (absolute segment, slot).
            function hash2(a, b) {
              var h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul(b | 0, 0x165667b1);
              h = Math.imul(h ^ (h >>> 15), 0x2545f491);
              h ^= h >>> 13;
              return (h >>> 0) / 4294967296;
            }

            var THREEJS = THREE;
            var canvas = document.getElementById("gt-canvas");
            var renderer = new THREEJS.WebGLRenderer({
              canvas: canvas,
              antialias: true,
              alpha: false,
              preserveDrawingBuffer: true,
            });
            renderer.setPixelRatio(1);
            renderer.setSize(W, H, false);
            renderer.setClearColor(new THREEJS.Color(BACKDROP), 1);

            var scene = new THREEJS.Scene();
            scene.fog = new THREEJS.Fog(new THREEJS.Color(BACKDROP), 1, FOG_FAR * SEGMENT_DEPTH);

            // Camera sits still at the origin looking down -z; the corridor moves.
            // Same picture as a moving camera, and the modulo keeps every coordinate
            // bounded no matter how long the clip runs.
            var camera = new THREEJS.PerspectiveCamera(FOV, W / H, 0.05, 40);
            camera.position.set(0, 0, 0);
            camera.lookAt(0, 0, -1);

            var PLANE = new THREEJS.PlaneGeometry(1, 1);

            var COLOR_MATS = PALETTE.map(function (hex) {
              return new THREEJS.MeshBasicMaterial({ color: new THREEJS.Color(hex), fog: true });
            });
            if (COLOR_MATS.length === 0) {
              COLOR_MATS.push(new THREEJS.MeshBasicMaterial({ color: 0xffffff, fog: true }));
            }

            // Caller-supplied content slots. Real <img> elements (so the page load
            // event waits for the decode) used directly as WebGL textures.
            var assets = document.getElementById("gt-assets");
            var IMAGES = IMAGE_SRCS.map(function (src, k) {
              var el = document.createElement("img");
              el.id = "gt-img-" + k;
              el.alt = "";
              el.src = __hfAsset(src);
              assets.appendChild(el);

              var tex = new THREEJS.Texture(el);
              tex.minFilter = THREEJS.LinearFilter;
              tex.magFilter = THREEJS.LinearFilter;
              tex.generateMipmaps = false;
              var rec = {
                aspect: 0,
                mat: new THREEJS.MeshBasicMaterial({ map: tex, fog: true }),
              };
              function ready() {
                if (!el.naturalWidth) return;
                rec.aspect = el.naturalWidth / el.naturalHeight;
                tex.needsUpdate = true;
              }
              el.addEventListener("load", ready);
              ready(); // a cache hit can complete before the listener is attached
              return rec;
            });

            var edgeMat = new THREEJS.MeshBasicMaterial({
              color: new THREEJS.Color(EDGE_COLOR),
              fog: true,
              transparent: true,
              opacity: EDGE_OPACITY,
            });

            var HW = TUNNEL_WIDTH / 2;
            var HH = TUNNEL_HEIGHT / 2;
            var cellZ = SEGMENT_DEPTH / GRID;
            var cellX = TUNNEL_WIDTH / GRID;
            var cellY = TUNNEL_HEIGHT / GRID;

            // Four faces of a segment box. `place` maps a cell to a world position
            // inside the segment (origin at the segment's near boundary, growing
            // toward -z); `rot` orients the unit plane into that face, inward-facing.
            // `cw`/`ch` are the cell's extent in the plane's own local axes.
            var FACES = [
              {
                // floor
                rot: [-Math.PI / 2, 0, 0],
                cw: cellX,
                ch: cellZ,
                place: function (iu, iz) {
                  return [-HW + (iu + 0.5) * cellX, -HH - SKIN, -(iz + 0.5) * cellZ];
                },
              },
              {
                // ceiling
                rot: [Math.PI / 2, 0, 0],
                cw: cellX,
                ch: cellZ,
                place: function (iu, iz) {
                  return [-HW + (iu + 0.5) * cellX, HH + SKIN, -(iz + 0.5) * cellZ];
                },
              },
              {
                // left wall
                rot: [0, Math.PI / 2, 0],
                cw: cellZ,
                ch: cellY,
                place: function (iu, iz) {
                  return [-HW - SKIN, -HH + (iu + 0.5) * cellY, -(iz + 0.5) * cellZ];
                },
              },
              {
                // right wall
                rot: [0, -Math.PI / 2, 0],
                cw: cellZ,
                ch: cellY,
                place: function (iu, iz) {
                  return [HW + SKIN, -HH + (iu + 0.5) * cellY, -(iz + 0.5) * cellZ];
                },
              },
            ];

            var UP = new THREEJS.Vector3(0, 1, 0);
            // Edges are solid tube geometry, not lines: a cylinder thickens with
            // perspective the way a real moulding does, which is the whole reason
            // the corridor reads as built rather than drawn.
            function tube(group, ax, ay, az, bx, by, bz) {
              var dx = bx - ax,
                dy = by - ay,
                dz = bz - az;
              var len = Math.sqrt(dx * dx + dy * dy + dz * dz);
              if (len < 1e-6) return;
              var mesh = new THREEJS.Mesh(
                new THREEJS.CylinderGeometry(LINE_RADIUS, LINE_RADIUS, len, 6, 1),
                edgeMat,
              );
              mesh.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
              mesh.quaternion.setFromUnitVectors(UP, new THREEJS.Vector3(dx / len, dy / len, dz / len));
              group.add(mesh);
            }

            function buildEdges(group) {
              var D = SEGMENT_DEPTH;
              var k, j, u, z;
              // The four corner runs (and any interior wall divisions) come from the
              // side walls; floor/ceiling only contribute their interior lines, so
              // corners are drawn once and never double-blend at 50% opacity.
              for (k = 1; k < GRID; k++) {
                u = -HW + k * cellX;
                tube(group, u, -HH, 0, u, -HH, -D);
                tube(group, u, HH, 0, u, HH, -D);
              }
              for (k = 0; k <= GRID; k++) {
                u = -HH + k * cellY;
                tube(group, -HW, u, 0, -HW, u, -D);
                tube(group, HW, u, 0, HW, u, -D);
              }
              // Ring lines at each depth boundary. The far boundary belongs to the
              // next segment, so stop one short and the tiling stays seamless.
              for (j = 0; j < GRID; j++) {
                z = -j * cellZ;
                tube(group, -HW, -HH, z, HW, -HH, z);
                tube(group, -HW, HH, z, HW, HH, z);
                tube(group, -HW, -HH, z, -HW, HH, z);
                tube(group, HW, -HH, z, HW, HH, z);
              }
            }

            var segs = [];
            for (var i = 0; i < NUM_SEGMENTS; i++) {
              var group = new THREEJS.Group();
              var panels = [];
              for (var f = 0; f < FACES.length; f++) {
                var face = FACES[f];
                for (var iz = 0; iz < GRID; iz++) {
                  for (var iu = 0; iu < GRID; iu++) {
                    var mesh = new THREEJS.Mesh(PLANE, COLOR_MATS[0]);
                    var p = face.place(iu, iz);
                    mesh.position.set(p[0], p[1], p[2]);
                    mesh.rotation.set(face.rot[0], face.rot[1], face.rot[2]);
                    mesh.visible = false;
                    group.add(mesh);
                    panels.push({ mesh: mesh, cw: face.cw * INSET, ch: face.ch * INSET });
                  }
                }
              }
              buildEdges(group);
              scene.add(group);
              segs.push({ group: group, panels: panels });
            }

            // Contain-fit so a supplied screenshot keeps its aspect inside the slot
            // instead of being squashed to the cell (wall cells are portrait).
            function fit(p, ar) {
              if (!ar) {
                p.mesh.scale.set(p.cw, p.ch, 1);
                return;
              }
              if (ar > p.cw / p.ch) p.mesh.scale.set(p.cw, p.cw / ar, 1);
              else p.mesh.scale.set(p.ch * ar, p.ch, 1);
            }

            // Everything about frame t is computed from t alone. `d` is the distance
            // flown in segments; `a` is the ABSOLUTE segment number occupying pool
            // slot i right now, which is what content hashes and the every-other
            // rhythm key off — so a segment carries the same panels every time it is
            // looked at, no matter how the timeline is scrubbed.
            function draw(t) {
              var d = SPEED * t;
              for (var i = 0; i < NUM_SEGMENTS; i++) {
                var seg = segs[i];
                var a = i + NUM_SEGMENTS * Math.ceil((d - i - BACK) / NUM_SEGMENTS);
                seg.group.position.z = -(a - d) * SEGMENT_DEPTH;

                var lit = a % 2 === 0;
                var panels = seg.panels;
                for (var s = 0; s < panels.length; s++) {
                  var p = panels[s];
                  if (!lit || hash2(a, s * 4 + 1) >= FILL) {
                    p.mesh.visible = false;
                    continue;
                  }
                  p.mesh.visible = true;
                  if (IMAGES.length > 0 && hash2(a, s * 4 + 2) < IMAGE_MIX) {
                    var im = IMAGES[Math.floor(hash2(a, s * 4 + 4) * IMAGES.length) % IMAGES.length];
                    p.mesh.material = im.mat;
                    fit(p, im.aspect);
                  } else {
                    var ci = Math.floor(hash2(a, s * 4 + 3) * COLOR_MATS.length) % COLOR_MATS.length;
                    p.mesh.material = COLOR_MATS[ci];
                    p.mesh.scale.set(p.cw, p.ch, 1);
                  }
                }
              }
              renderer.render(scene, camera);
            }

            
            var tl = gsap.timeline({ paused: true });

            // Repaint from a property SETTER, not from onUpdate: gsap's seek(t)
            // suppresses events by default, so an onUpdate callback silently never
            // fires on a scrub and the canvas freezes on frame 0. Tweened values are
            // always written during render, suppressed or not.
            var driver = { _t: 0 };
            Object.defineProperty(driver, "t", {
              get: function () {
                return this._t;
              },
              set: function (v) {
                this._t = v;
                draw(v);
              },
            });
            tl.to(driver, { t: DUR, duration: DUR, ease: "none" }, 0);
            __hfTimelineSlot.set(tl);

            draw(0);
          })();
        
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#000">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="gt-root"
          data-composition-id="gallery-tunnel"
          data-root="true"
          data-width="1920"
          data-height="1080"
          data-start="0"
          data-duration="12"
          data-composition-variables='[
            &#123;"id":"images","type":"string","label":"Image slots: comma-separated paths, tiled into the panels (e.g. assets/shot-1.png,assets/shot-2.png)","default":"","placeholder":"assets/shot-1.png,assets/shot-2.png"&#125;,
            &#123;"id":"imageMix","type":"number","label":"Image share of filled slots (0 = all colour, 1 = all images)","default":0.5,"min":0,"max":1,"step":0.05&#125;,
            &#123;"id":"speed","type":"number","label":"Flight speed","default":3,"min":0,"max":8,"step":0.1,"unit":"segments/s"&#125;,
            &#123;"id":"palette","type":"string","label":"Slab palette: comma-separated hex colours","default":"#FF6A00,#AB54F7,#EA3737,#0072E3,#00AA3C,#FFB200"&#125;,
            &#123;"id":"grid","type":"number","label":"Grid density: slots per wall face per axis (2 = 4 per face, 16 per segment)","default":2,"min":1,"max":4,"step":1&#125;,
            &#123;"id":"fill","type":"number","label":"Slot fill rate","default":0.5,"min":0,"max":1,"step":0.05&#125;,
            &#123;"id":"fog","type":"number","label":"Fog distance: depth at which the corridor reaches pure backdrop","default":14.25,"min":3,"max":14.5,"step":0.25,"unit":"segments"&#125;,
            &#123;"id":"edgeColor","type":"color","label":"Edge line colour","default":"#B0B0B0"&#125;,
            &#123;"id":"edgeOpacity","type":"number","label":"Edge line opacity","default":0.5,"min":0,"max":1,"step":0.05&#125;,
            &#123;"id":"backdrop","type":"color","label":"Backdrop and fog colour","default":"#000000"&#125;
          ]'
        >
          <div id="gt-backdrop"></div>
          <canvas id="gt-canvas" width="1920" height="1080"></canvas>
          <div id="gt-assets" aria-hidden="true" data-layout-allow-overflow></div>
    
          
          <div
            id="gt-drv"
            class="clip"
            data-start="0"
            data-duration="12"
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
    background: #000;
    overflow: hidden;
  }
  #gt-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
  }
  #gt-backdrop {
    position: absolute;
    inset: 0;
    background: #000000;
  }
  #gt-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 1920px;
    height: 1080px;
  }
  /* Off-screen decode well: the <img> elements live in the DOM so the page
  load event waits for them, but they are never composited themselves —
  WebGL reads them as textures. The well is clipped to 1px; the images
  inside keep their natural layout size on purpose, because texImage2D
  uploads an <img> at its LAID-OUT size — sizing them down with CSS
  uploads a 1x1 texture and every panel samples one dark pixel. */
  #gt-assets {
    position: absolute;
    top: 0;
    left: 0;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }
}
</style>
