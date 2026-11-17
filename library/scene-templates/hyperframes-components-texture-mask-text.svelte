<!-- Modified Svelte adaptation of registry/components/texture-mask-text/demo.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import __hfAsset from '@machinal/hyperframes/media/components-texture-mask-text';
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
    __hfRootElement.style.setProperty("--hf-asset-1", 'url("' + __hfAsset("masks/${item.slug}.png") + '")');
    __hfRootElement.style.setProperty("--hf-asset-0", 'url("' + __hfAsset("masks/${item.slug}.png") + '")');

            const textureMaskTextGroups = [
              [
                "Masonry",
                "brick|Brick|MORTAR,bricks-104|Bricks 104|BRICK,bricks-102|Bricks 102|BRICK,bricks-101|Bricks 101|BRICK,bricks-075-a|Bricks 075 A|BRICK,concrete|Concrete|SCORED,concrete-034|Concrete 034|CONCRETE,concrete-047-a|Concrete 047 A|CONCRETE,concrete-046|Concrete 046|CONCRETE,concrete-042-a|Concrete 042 A|CONCRETE,plaster-001|Plaster 001|PLASTER,painted-plaster-017|Painted Plaster 017|PLASTER",
              ],
              [
                "Stone",
                "rock|Rock|RUINED,rock-063|Rock 063|ROCK,rock-058|Rock 058|ROCK,onyx|Onyx|VEINED,marble-012|Marble 012|MARBLE,marble-016|Marble 016|MARBLE,travertine-009|Travertine 009|STONE,paving-stones-150|Paving Stones 150|STONE,paving-stones-138|Paving Stones 138|STONE,tiles-138|Tiles 138|TILE",
              ],
              [
                "Ground / Road",
                "ground-103|Ground 103|GROUND,ground-037|Ground 037|GROUND,ground-054|Ground 054|GROUND,ground-104|Ground 104|GROUND,ground-068|Ground 068|GROUND,ground-080|Ground 080|GROUND,road-012-a|Road 012 A|ROAD,road-008-a|Road 008 A|ROAD,road-007|Road 007|ROAD,road-013-a|Road 013 A|ROAD,road-012-b|Road 012 B|ROAD,road-009-c|Road 009 C|ROAD,asphalt-031|Asphalt 031|ASPHALT",
              ],
              [
                "Wood",
                "wood|Wood|SLICED,wood-094|Wood 094|WOOD,wood-092|Wood 092|WOOD,wood-051|Wood 051|WOOD,wood-066|Wood 066|WOOD,wood-049|Wood 049|WOOD,wood-058|Wood 058|WOOD,wood-floor-051|Wood Floor 051|FLOOR,wood-floor-064|Wood Floor 064|FLOOR,wood-floor-070|Wood Floor 070|FLOOR,bark-014|Bark 014|BARK",
              ],
              [
                "Metal",
                "metal|Metal|FADING,metal-049-a|Metal 049 A|METAL,metal-055-a|Metal 055 A|METAL,metal-046-b|Metal 046 B|METAL,metal-061-b|Metal 061 B|METAL,metal-048-a|Metal 048 A|METAL,metal-032|Metal 032|METAL,metal-041-a|Metal 041 A|METAL,metal-038|Metal 038|METAL,diamond-plate-009|Diamond Plate 009|PLATE",
              ],
              [
                "Organic / Soft",
                "lava|Lava|MOLTEN,grass-005|Grass 005|GRASS,grass-001|Grass 001|GRASS,grass-004|Grass 004|GRASS,carpet|Carpet|WOVEN,fabric-083|Fabric 083|FABRIC,snow|Snow|THAW,snow-015|Snow 015|SNOW,leather-037|Leather 037|LEATHER,fabric-080|Fabric 080|FABRIC",
              ],
            ];
            const textureGroups = document.getElementById("texture-groups");
            for (const [groupName, rows] of textureMaskTextGroups) {
              const items = rows.split(",").map((row) => {
                const [slug, title, sample] = row.split("|");
                return { slug, title, sample };
              });
              const panel = document.createElement("section");
              panel.className = "group-panel";

              const groupHeader = document.createElement("div");
              groupHeader.className = "group-header";

              const name = document.createElement("div");
              name.className = "group-name";
              name.textContent = groupName;

              const count = document.createElement("div");
              count.className = "group-count";
              count.textContent = `${items.length} masks`;

              groupHeader.append(name, count);

              const groupGrid = document.createElement("div");
              groupGrid.className = "group-grid";

              for (const item of items) {
                const cell = document.createElement("div");
                cell.className = "cell";

                const label = document.createElement("div");
                label.className = "label";
                label.textContent = item.title;

                const shadowWrap = document.createElement("div");
                shadowWrap.className = "shadow-wrap";

                const sample = document.createElement("div");
                sample.className = "hf-texture-text sample";
                sample.style.webkitMaskImage = `var(--hf-asset-0)`;
                sample.style.maskImage = `var(--hf-asset-1)`;
                sample.textContent = item.sample;

                shadowWrap.appendChild(sample);
                cell.append(label, shadowWrap);
                groupGrid.appendChild(cell);
              }

              panel.append(groupHeader, groupGrid);
              textureGroups.appendChild(panel);
            }

            
            const textureMaskTextTimeline = {
              play() {},
              pause() {},
              seek() {},
              time() {
                return 0;
              },
              duration() {
                return 5;
              },
              add() {},
              paused() {},
              set() {},
            };
            __hfTimelineSlot.set(textureMaskTextTimeline);
          
    __hfRootElement.querySelectorAll("img").forEach(image => { image.src = __hfAsset(image.getAttribute("src")); });
    if (window.__hf?.buildReady) await Promise.all(Object.values(window.__hf.buildReady));
  }
</script>

<SceneCanvas background="#111">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          id="demo"
          data-composition-id="texture-mask-text-demo"
          data-width="1920"
          data-height="1080"
          data-duration="5"
          data-start="0"
        >
          <div class="demo-canvas">
            <div class="header">
              <div class="title">Texture Mask Text</div>
              <div class="count">66 ambientCG luminance masks</div>
            </div>
            <div class="groups" id="texture-groups"></div>
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
    background: #111;
  }


  #demo {
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #111;
    color: #fff;
    font-family:
      Arial Black,
      Arial,
      sans-serif;
  }

  .hf-texture-text {
    color: #fff;
    -webkit-mask-size: var(--mask-size, cover);
    mask-size: var(--mask-size, cover);
    -webkit-mask-position: var(--mask-position, center);
    mask-position: var(--mask-position, center);
    -webkit-mask-mode: luminance;
    mask-mode: luminance;
    filter: contrast(var(--mask-contrast, 1));
  }

  .demo-canvas {
    width: 1920px;
    height: 1080px;
    background: #111;
    padding: 42px 44px 38px;
  }

  .header {
    height: 84px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
    margin-bottom: 18px;
  }

  .title {
    font-size: 34px;
    line-height: 1;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .count {
    font-family: Arial, sans-serif;
    font-size: 18px;
    line-height: 1;
    letter-spacing: 0;
    color: rgba(255, 255, 255, 0.55);
    text-transform: uppercase;
  }

  .groups {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 22px 24px;
    width: 1832px;
    height: 898px;
  }

  .group-panel {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }

  .group-header {
    height: 34px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 10px;
  }

  .group-name {
    font-family: Arial, sans-serif;
    font-size: 13px;
    line-height: 1;
    letter-spacing: 0;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.74);
  }

  .group-count {
    font-family: Arial, sans-serif;
    font-size: 10px;
    line-height: 1;
    letter-spacing: 0;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.52);
  }

  .group-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px 10px;
  }

  .cell {
    min-width: 0;
    height: 66px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 9px;
    overflow: hidden;
  }

  .label {
    width: 100%;
    font-family: Arial, sans-serif;
    font-size: 11px;
    line-height: 1.1;
    letter-spacing: 0;
    text-transform: uppercase;
    text-align: center;
    color: rgba(255, 255, 255, 0.5);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shadow-wrap {
    width: 100%;
    filter: drop-shadow(2px 3px 4px rgba(0, 0, 0, 0.46));
  }

  .sample {
    width: 100%;
    font-family:
      Impact,
      Arial Black,
      Arial,
      sans-serif;
    font-size: 31px;
    line-height: 0.9;
    letter-spacing: 0;
    text-transform: uppercase;
    text-align: center;
    white-space: nowrap;
  }
}
</style>
