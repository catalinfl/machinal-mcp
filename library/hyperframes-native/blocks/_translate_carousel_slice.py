"""Mechanical translation of the assigned upstream carousel rigs, not a visual generator."""
import json
import pathlib
import re

ROOT = pathlib.Path("api/internal/platform/mcpserver/reference")
LIBRARY = ROOT / "hyperframes-library"
OUTPUT = ROOT / "hyperframes-native/blocks"
CATALOG = json.loads((ROOT / "hyperframes-components.json").read_text(encoding="utf8"))
ASSIGNED = [entry for entry in CATALOG if entry["category"] == "blocks"][12:35]

NATIVE = r'''
  const scene = useScene();
  let { images = {} } = $props();
  const t = $derived(scene.frame.time);
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));
  const { family, controls: ctl, comp, n, cards, motion, look } = design;
  const path = design.path ? buildPath(design.path.vertices, design.path.closed, 64, look.centerPath ? [comp.width / 2, comp.height / 2] : null) : null;
  const drives = Object.fromEntries(Object.entries(design.keys || {}).map(([name, keys]) => [
    name, chainedDrive(keys, /^(Move Carousel|Rotation [XYZ])$/.test(name) && Math.abs(keys.at(-1).value - keys[0].value) > 1e-6 ? 'accumulate' : 'pingpong')
  ]));
  const progress = buildProgress({duration: comp.duration, cruise: family === 'orbit' ? (motion.orbitSpinDegPerSec || 24) / 360 : (ctl.speed || 0) / 1000, ...motion});
  const limit = x => Math.max(0, Math.min(1, x));
  const out = x => 1 - (1 - limit(x)) ** 4;
  function posesAt(time) {
    const c = {...ctl};
    const names = {'Move Carousel':'moveCarousel', 'Depth Angle':'depthAngle', 'Rotation Follow':'rotationFollow', 'Rotation X':'rotationX', 'Rotation Y':'rotationY', 'Rotation Z':'rotationZ'};
    const clock = time * (motion.speedScale ?? 1);
    for (const [name, drive] of Object.entries(drives)) c[names[name]] = drive.at(clock);
    if (family === 'orbit') c.spinTurns = {x:0,y:0,z:0};
    const hasSpin = drives['Rotation X'] || drives['Rotation Y'] || drives['Rotation Z'];
    const u = family === 'orbit' ? (hasSpin ? 0 : progress.at(time)) : drives['Move Carousel'] ? (ctl.speed || 0) / 1000 * clock : progress.at(time);
    const poses = family === 'orbit' ? orbitRig(c, comp, n, u) : pathRig(path, c, comp, n, u);
    const txt = design.text;
    const start = txt ? (txt.words.length - 1) * txt.wordStagger : 0;
    return poses.map((p, i) => {
      const ring = design.ring;
      const entry = out((time - start - i * motion.entryStaggerTotal / n + (txt ? 0 : motion.entryLead || 0)) / motion.entryDuration);
      const factor = ring ? 1 + ((ring.from || 3) - 1) * (1 - out((time - start - i * (ring.stagger || .5) / n) / (ring.duration || .8))) : 1;
      let alpha = p.visible === false ? 0 : ring ? 1 : entry;
      if (path && !path.closed) alpha *= Math.min(1, Math.min(p.pct, 1 - p.pct) / (look.endFade ?? .06));
      const end = design.ending;
      const squeeze = end ? 1 + (end.imagesTo - 1) * limit((time - end.textScaleAt - (end.imagesDelay ?? .2)) / ((design.cutAt || comp.duration) - end.textScaleAt - (end.imagesDelay ?? .2))) ** 3 : 1;
      const zoom = (look.zoom || 1) * squeeze;
      return {...p, x:comp.width/2+(p.x-comp.width/2)*factor*zoom, y:comp.height/2+(p.y-comp.height/2)*factor*zoom, z:p.z*zoom, scale:p.scale*zoom*(ring ? 1 : .72+.28*entry), alpha};
    });
  }
  const poses = $derived(posesAt(t));
  function cardSize(i) {
    const card = cards[i];
    const k = look.imageHeight ? look.imageHeight / card.height : look.fitBox ? look.fitBox / Math.max(card.width, card.height) : 1;
    return [card.width*k, card.height*k];
  }
  function textScale(time) {
    const end = design.ending;
    return end ? 1+(end.textScaleTo-1)*limit((time-end.textScaleAt)/((design.cutAt||comp.duration)-end.textScaleAt))**3 : 1;
  }
  function drift(time) {
    const txt=design.text, start=txt.wordDuration*(txt.driftOverlapAt??.61);
    const p=limit((time-start)/((design.cutAt||comp.duration)-start));
    const mix=txt.driftEase?.linear??.35;
    const e=(1-mix)*(1-(1-p)**(txt.driftEase?.power||3))+mix*p;
    const px=txt.driftPx*(comp.width/comp.outWidth);
    return (txt.driftEndsCentered?px:0)-px*e;
  }
  async function setup({THREE, world, camera, resources}) {
    const textures = await Promise.all([1,2,3,4].map(i => images['image_'+i] ? loadSceneTexture(images['image_'+i], resources) : null));
    const planes = Array.from({length:n}, (_,i) => {
      const [w,h]=cardSize(i);
      const material=new THREE.MeshBasicMaterial({map:textures[i%4],transparent:true,side:THREE.DoubleSide,depthWrite:false});
      const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);
      world.add(mesh);
      return mesh;
    });
    camera.fov=2*Math.atan(comp.height/(2*comp.cameraZoom))*180/Math.PI;
    camera.near=.1; camera.far=50000;
    camera.position.set(0,0,comp.cameraDistance||comp.cameraZoom);
    camera.lookAt(0,0,0); camera.updateProjectionMatrix();
    return {update(frame) {
      const poses=posesAt(frame.time);
      planes.forEach((mesh,i)=>{
        const p=poses[i];
        mesh.visible=!!textures[i%4]&&p.alpha>0;
        mesh.position.set(p.x-comp.width/2,comp.height/2-p.y,-p.z);
        mesh.rotation.set(-(p.rotX||0)*Math.PI/180,(p.rotY||0)*Math.PI/180,-(p.rotZ||0)*Math.PI/180);
        mesh.scale.set(p.scale,p.scale,p.scale);
        mesh.material.opacity=p.alpha;
      });
    }};
  }
</script>
<SceneCanvas background={design.look.background}>
  <div class="safe" style:height="{safeHeight}px">
    {#if family === 'orbit' || family === 'vision'}
      <div class="spatial"><SceneThree {setup}/></div>
    {:else}
      <svg width="100%" height="100%" viewBox="0 0 {comp.width} {comp.height}" aria-label={design.id}>
        {#if design.text && t < design.cutAt}
          <g transform="translate({comp.width/2} {comp.height/2}) scale({textScale(t)})">
            <text text-anchor="middle" font-size={design.text.fontSize} fill={design.text.color} transform="translate({drift(t)} 0)">{#each design.text.words as word,i}<tspan opacity={out((t-i*design.text.wordStagger)/design.text.wordDuration)}>{word}{' '}</tspan>{/each}</text>
          </g>
        {/if}
        {#if !design.cutAt || t < design.cutAt}
          {#each [...poses].reverse() as p, j}
            {@const i=n-1-j}
            {@const size=cardSize(i)}
            {#if images['image_'+(i%4+1)]}
              <g opacity={p.alpha} transform="translate({p.x} {p.y}) rotate({p.rotZ||0}) scale({p.scale})">
                <image href={images['image_'+(i%4+1)]} x={-size[0]/2} y={-size[1]/2} width={size[0]} height={size[1]} preserveAspectRatio="xMidYMid meet"/>
              </g>
            {/if}
          {/each}
        {/if}
        {#if design.text && t < design.cutAt}
          <defs><clipPath id="front-half"><rect x={comp.width/2} y="0" width={comp.width/2} height={comp.height}/></clipPath></defs>
          <g clip-path="url(#front-half)">
            <g transform="translate({comp.width/2} {comp.height/2}) scale({textScale(t)})">
              <text text-anchor="middle" font-size={design.text.fontSize} fill={design.text.color} transform="translate({drift(t)} 0)">{#each design.text.words as word,i}<tspan opacity={out((t-i*design.text.wordStagger)/design.text.wordDuration)}>{word}{' '}</tspan>{/each}</text>
            </g>
          </g>
        {/if}
        {#if design.outro && t >= design.cutAt}
          {@const o=design.outro}
          {@const s=(o.scaleFrom??1.4)+((o.scaleTo??1)-(o.scaleFrom??1.4))*(1-(1-limit((t-design.cutAt)/(o.scaleDuration||.8)))**3)}
          <text x={comp.width/2} y={comp.height/2} text-anchor="middle" dominant-baseline="middle" font-size={o.fontSize||design.text?.fontSize||190} fill={o.color||'#111'} transform="translate({comp.width/2} {comp.height/2}) scale({s}) translate({-comp.width/2} {-comp.height/2})">{o.words.join(' ')}</text>
        {/if}
      </svg>
    {/if}
  </div>
</SceneCanvas>
<style>
  .safe{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;overflow:hidden}
  .spatial{position:relative;aspect-ratio:16/9;width:100%;max-height:100%}
  svg{display:block;font-family:'Direction Sans';font-weight:700;overflow:hidden}
</style>
'''

for entry in ASSIGNED:
    name = entry["upstreamName"]
    path = next(f["path"] for f in entry["files"] if f["path"].endswith(name + ".html"))
    html = (LIBRARY / path).read_text(encoding="utf8")
    descriptor = json.loads((LIBRARY / entry["sourcePath"]).read_text(encoding="utf8"))
    # Every file supplies its OWN rig and complete authored DATA. No upstream script is executed.
    rig = html[html.index("const DEG ="):html.index("global.CarouselRig =")]
    data = re.search(r"const DATA = ([\s\S]*?);\s*\(async", html).group(1)
    data = re.sub(r'file:\s*"[^"]+",\s*', "", data)
    data = re.sub(r'\s*registry:\s*\{[\s\S]*?speedVar:\s*"speed",?\s*\},', "", data)
    header = f"""<!-- Modified standalone Svelte adaptation of {path}.
Hyperframes revision 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0.
Original licence and CREDITS: hyperframes-library/. -->
<script>
  import {{ SceneCanvas, SceneThree, useScene, loadSceneTexture }} from '@machinal/scenes/svelte';
"""
    content = header + rig + "\nconst design = " + data + ";\n" + NATIVE
    assert len(content.encode("utf8")) < 64000
    target = OUTPUT / (name + ".svelte")
    if target.exists():
        raise RuntimeError(f"Refusing to overwrite {target}")
    target.write_text(content, encoding="utf8")
    spatial = 'family: "orbit"' in data or 'family: "vision"' in data
    sidecar = {
        "id": entry["id"], "nativePath": "blocks/" + name + ".svelte", "status": "ported",
        "sourcePaths": [path], "visualMode": "3d" if spatial else "2d",
        "requiredImages": [{"id": "image_" + str(i), "role": "Carousel card artwork, repeated cyclically across original slots; PNG required for spatial texture maps." if spatial else "Carousel card artwork, repeated cyclically across original slots."} for i in range(1, 5)],
        "requiredVideos": [],
        "parameters": ["design.controls", "design.path", "design.keys", "design.motion", "design.look", "design.text", "design.ending", "design.outro"],
        "adaptations": ["Copied this exact composition's pure CarouselRig functions and complete authored path, control, AE keyframe and staging data; GSAP clock replaced by scene.frame.time.", "Original 12/24 image slots and their individual dimensions retained; four supplied attachments repeat cyclically instead of fetching 12/24 demo files.", "Spatial variants use genuine Three.js textured planes and a camera matching the authored perspective; flat variants use native SVG images and source path transforms.", "Caption-safe area uses contain framing; source word/ring entrance, squeeze and outro are evaluated without timeline state."],
        "limitations": ["Four unique artworks maximum; spatial artworks must be PNG for loadSceneTexture.", "Embedded Direction Sans replaces upstream font; text-circle word entrances use opacity rather than individual horizontal masks, and front/back type uses a fixed right-half clip rather than the source CSS mask." ] if 'text: null' not in data else ["Four unique artworks maximum; spatial artworks must be PNG for loadSceneTexture."],
        "verification": {"compiled": False, "visualInspection": False}
    }
    (OUTPUT / (name + ".port.json")).write_text(json.dumps(sidecar, ensure_ascii=False, indent=2) + "\n", encoding="utf8")
    print(name, len(content.encode("utf8")))
