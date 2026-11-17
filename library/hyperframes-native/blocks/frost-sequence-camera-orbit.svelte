<!-- Modified Svelte adaptation of registry/blocks/frost-sequence-camera-orbit/frost-sequence-camera-orbit.html; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0; original licence and CREDITS in hyperframes-library/.
     Subject markup, stylesheet declarations and the source animation are retained; fonts, media and initialization are localized
     as recorded in the sidecar. Host variables map to `design`, the timeline follows the scene clock, and document-level selectors
     (html/body/:root/*) are retargeted to `.hf-port` so the port cannot restyle the host page. -->
<svelte:options preserveWhitespace={true} />
<script>
  import { untrack } from 'svelte';
  import { gsap } from 'gsap';
  import { Frost } from '@machinal/hyperframes/vendor/frost';
  import __hfAsset from '@machinal/hyperframes/media/blocks-frost-sequence-camera-orbit';
  import { initializeNative } from '@machinal/hyperframes/native/blocks-frost-sequence-camera-orbit';
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

<SceneCanvas background="#030303">
  <div class="hf-port" data-hf-embedded-fonts bind:this={root}>
    <div
          data-hf-id="hf-b4of"
          id="frost-root"
          data-composition-variables='[&#123;"id":"headline1","type":"string","label":"First text (| = line break)","default":"Hard to|break.","maxLength":60&#125;,&#123;"id":"headline2","type":"string","label":"Second text (| = line break)","default":"Easy to|remember.","maxLength":60&#125;,&#123;"id":"logoUrl","type":"string","label":"Logo SVG asset path (upload in Assets, then paste path)","default":"assets/logo.svg","maxLength":200&#125;,&#123;"id":"assemblyMode","type":"enum","label":"Assembly response","default":"hybrid","options":[&#123;"value":"physical","label":"Physical attraction (100 = full strength)"&#125;,&#123;"value":"directed","label":"Direct progress (100 = assembled)"&#125;,&#123;"value":"hybrid","label":"Hybrid progress + physical flight"&#125;]&#125;,&#123;"id":"materialBaseColor","type":"color","label":"Base color","default":"#ffffff","materialSection":"Base","materialScope":"object"&#125;,&#123;"id":"baseRoughness","type":"number","label":"Base roughness","default":0.31,"min":0,"max":0.5,"step":0.005,"materialSection":"Base","materialScope":"object"&#125;,&#123;"id":"materialTransmission","type":"boolean","label":"Transmission","default":true,"materialSection":"Transmission","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"materialBacklight","type":"number","label":"Backlight through ice","default":0.27,"min":0,"max":2,"step":0.01,"materialSection":"Transmission","materialScope":"object"&#125;,&#123;"id":"ior","type":"number","label":"Index of refraction","default":1.675,"min":1,"max":2,"step":0.005,"materialSection":"Transmission","materialScope":"object"&#125;,&#123;"id":"thicknessScale","type":"number","label":"Thickness scale","default":2.04,"min":0.1,"max":3,"step":0.01,"materialSection":"Transmission","materialScope":"object"&#125;,&#123;"id":"materialAbsorption","type":"boolean","label":"Absorption / tint","default":true,"materialSection":"Absorption / tint","materialScope":"object","materialToggle":true,"materialRequires":["materialTransmission"],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"attenuationColor","type":"color","label":"Attenuation colour (white = no absorption, clear glass)","default":"#d5f4ff","materialSection":"Absorption / tint","materialScope":"object"&#125;,&#123;"id":"attenuationDistance","type":"number","label":"Attenuation distance","default":6.54,"min":0.05,"max":12,"step":0.01,"materialSection":"Absorption / tint","materialScope":"object"&#125;,&#123;"id":"materialDispersion","type":"boolean","label":"Dispersion","default":false,"materialSection":"Dispersion","materialScope":"object","materialToggle":true,"materialRequires":["materialTransmission"],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"dispersion","type":"number","label":"Dispersion (0 = off; on/off reloads)","default":0.12,"min":0,"max":0.3,"step":0.005,"materialSection":"Dispersion","materialScope":"object"&#125;,&#123;"id":"materialReflections","type":"boolean","label":"Reflections","default":true,"materialSection":"Reflections","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"envIntensity","type":"number","label":"Environment intensity","default":2.04,"min":0,"max":3,"step":0.01,"materialSection":"Reflections","materialScope":"object"&#125;,&#123;"id":"specularIntensity","type":"number","label":"Specular intensity","default":1.44,"min":0,"max":2,"step":0.01,"materialSection":"Reflections","materialScope":"object"&#125;,&#123;"id":"materialFrost","type":"boolean","label":"Frost","default":true,"materialSection":"Frost","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"materialInteriorFrost","type":"number","label":"Uniform frost","default":0,"min":0,"max":1,"step":0.01,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"frostScale","type":"number","label":"Scale","default":0.7,"min":0.2,"max":6,"step":0.05,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"frostThreshold","type":"number","label":"Threshold (1 = no frost, clear glass)","default":0.62,"min":0,"max":1,"step":0.01,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"frostSoftness","type":"number","label":"Softness","default":0.24,"min":0.01,"max":1,"step":0.01,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"frostRoughness","type":"number","label":"Roughness","default":0.73,"min":0,"max":1,"step":0.01,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"frostDiffuse","type":"number","label":"Diffuse (how much light frosted areas catch)","default":0.11,"min":0,"max":1,"step":0.01,"materialSection":"Frost","materialScope":"object"&#125;,&#123;"id":"materialSurfaceBumps","type":"boolean","label":"Object surface bumps / crack notches","default":false,"materialSection":"Surface bumps","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Disable crystal, grain, micro, ripple and crack normal perturbations and crack notches on the solid. Preserves their settings and the shard finish."&#125;,&#123;"id":"materialCrystals","type":"boolean","label":"Crystal bumps","default":true,"materialSection":"Crystal bumps","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"crystalBump","type":"number","label":"Crystal bump","default":0.01,"min":0,"max":1,"step":0.01,"materialSection":"Crystal bumps","materialScope":"object"&#125;,&#123;"id":"crystalScale","type":"number","label":"Crystal scale","default":4,"min":4,"max":80,"step":1,"materialSection":"Crystal bumps","materialScope":"object"&#125;,&#123;"id":"materialGrain","type":"boolean","label":"Grain bumps","default":true,"materialSection":"Grain bumps","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"materialGrainAmount","type":"number","label":"Grain strength","default":0.47,"min":0,"max":2,"step":0.01,"materialSection":"Grain bumps","materialScope":"object"&#125;,&#123;"id":"materialGrainScale","type":"number","label":"Grain scale","default":150,"min":1,"max":150,"step":1,"materialSection":"Grain bumps","materialScope":"object"&#125;,&#123;"id":"materialCutNormals","type":"boolean","label":"Fracture normals","default":true,"materialSection":"Fracture normals","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"materialMicro","type":"boolean","label":"Micro bumps","default":true,"materialSection":"Micro bumps","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"microBump","type":"number","label":"Micro bump","default":0.445,"min":0,"max":1,"step":0.005,"materialSection":"Micro bumps","materialScope":"object"&#125;,&#123;"id":"microScale","type":"number","label":"Micro scale","default":10,"min":10,"max":200,"step":1,"materialSection":"Micro bumps","materialScope":"object"&#125;,&#123;"id":"microCoverage","type":"number","label":"Micro coverage","default":0.25,"min":0,"max":1,"step":0.01,"materialSection":"Micro bumps","materialScope":"object"&#125;,&#123;"id":"bumpMaskScale","type":"number","label":"Mask scale","default":1.45,"min":0.1,"max":6,"step":0.05,"materialSection":"Micro bumps","materialScope":"object"&#125;,&#123;"id":"materialRipples","type":"boolean","label":"Ripples","default":true,"materialSection":"Ripples","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"rippleBump","type":"number","label":"Ripple bump","default":0.22,"min":0,"max":1,"step":0.01,"materialSection":"Ripples","materialScope":"object"&#125;,&#123;"id":"rippleScale","type":"number","label":"Ripple scale","default":23,"min":2,"max":30,"step":0.5,"materialSection":"Ripples","materialScope":"object"&#125;,&#123;"id":"materialSmudges","type":"boolean","label":"Smudges","default":true,"materialSection":"Smudges","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"smudgeAmount","type":"number","label":"Amount","default":0.78,"min":0,"max":1,"step":0.01,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeCoverage","type":"number","label":"Coverage","default":0.58,"min":0,"max":1,"step":0.01,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeMaskScale","type":"number","label":"Mask scale","default":1.85,"min":0.1,"max":6,"step":0.05,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeAnisotropy","type":"number","label":"Anisotropy","default":16.5,"min":1,"max":20,"step":0.5,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeRoughness","type":"number","label":"Roughness","default":0.75,"min":0,"max":1,"step":0.01,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeWhiteness","type":"number","label":"Whiteness","default":0.035,"min":0,"max":0.5,"step":0.005,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"smudgeScale","type":"number","label":"Scale","default":1.3,"min":0.5,"max":10,"step":0.1,"materialSection":"Smudges","materialScope":"object"&#125;,&#123;"id":"materialCracks","type":"boolean","label":"Cracks","default":true,"materialSection":"Cracks","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"crackLargeScale","type":"number","label":"Large scale","default":2.45,"min":0.3,"max":8,"step":0.05,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackWarp","type":"number","label":"Warp","default":0.22,"min":0,"max":1.5,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackCoverage","type":"number","label":"Coverage","default":0.19,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackRegionScale","type":"number","label":"Region scale","default":1.8,"min":0.1,"max":4,"step":0.05,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackRegionCoverage","type":"number","label":"Region coverage","default":0.6,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"veinScale","type":"number","label":"Vein scale","default":8,"min":1,"max":20,"step":0.25,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"veinContrast","type":"number","label":"Vein contrast","default":0.55,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackWidth","type":"number","label":"Width","default":0.0025,"min":0.0005,"max":0.02,"step":0.0005,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackBrightness","type":"number","label":"Brightness","default":0.65,"min":0,"max":3,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackDarkness","type":"number","label":"Darkness","default":0.69,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackRefraction","type":"number","label":"Refraction","default":0.076,"min":0,"max":0.1,"step":0.001,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"crackSurfaceStrength","type":"number","label":"Surface strength","default":0.16,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"fineScale","type":"number","label":"Fine scale","default":18.4,"min":2,"max":20,"step":0.1,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"fineAmount","type":"number","label":"Fine amount","default":0.52,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"fineCoverage","type":"number","label":"Fine coverage","default":1,"min":0,"max":1,"step":0.01,"materialSection":"Cracks","materialScope":"object"&#125;,&#123;"id":"materialScatter","type":"boolean","label":"Internal scattering","default":true,"materialSection":"Internal scattering","materialScope":"object","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"materialInclusionScale","type":"number","label":"Inclusion scale","default":0.05,"min":0.05,"max":3,"step":0.01,"materialSection":"Internal scattering","materialScope":"object"&#125;,&#123;"id":"materialInclusionAmount","type":"number","label":"Photographic inclusions","default":2,"min":0,"max":2,"step":0.01,"materialSection":"Internal scattering","materialScope":"object"&#125;,&#123;"id":"interiorScatter","type":"number","label":"Interior scatter","default":0.09,"min":0,"max":1,"step":0.01,"materialSection":"Internal scattering","materialScope":"object"&#125;,&#123;"id":"materialClearcoat","type":"boolean","label":"Clearcoat","default":true,"materialSection":"Clearcoat","materialScope":"object","materialToggle":true,"materialRequires":["materialReflections"],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"clearcoat","type":"number","label":"Clearcoat","default":0,"min":0,"max":1,"step":0.01,"materialSection":"Clearcoat","materialScope":"object"&#125;,&#123;"id":"clearcoatRoughness","type":"number","label":"Clearcoat roughness","default":0,"min":0,"max":1,"step":0.005,"materialSection":"Clearcoat","materialScope":"object"&#125;,&#123;"id":"materialShardNormals","type":"boolean","label":"Shard normals","default":true,"materialSection":"Shard normals","materialScope":"shards","materialToggle":true,"materialRequires":[],"description":"Switch off to remove this feature without losing its settings."&#125;,&#123;"id":"spriteNormal","type":"number","label":"Sprite normal strength","default":0.15,"min":0,"max":2.5,"step":0.05,"materialSection":"Shard normals","materialScope":"shards"&#125;,&#123;"id":"materialShardFrost","type":"boolean","label":"Shard frost","default":true,"materialSection":"Shard frost","materialScope":"shards","materialToggle":true,"materialRequires":[],"description":"Uses the shared material settings from Logo & text. This switch enables them on shards."&#125;,&#123;"id":"materialShardTransmission","type":"boolean","label":"Shard transparency","default":true,"materialSection":"Shard transparency","materialScope":"shards","materialToggle":true,"materialRequires":[],"description":"Uses the shared material settings from Logo & text. This switch enables them on shards."&#125;,&#123;"id":"spriteSeeThrough","type":"number","label":"See-through (0 = off; on/off reloads)","default":1,"min":0,"max":1,"step":0.01,"materialSection":"Shard transparency","materialScope":"shards"&#125;,&#123;"id":"materialShardReflections","type":"boolean","label":"Shard reflections","default":true,"materialSection":"Shard reflections","materialScope":"shards","materialToggle":true,"materialRequires":[],"description":"Uses the shared material settings from Logo & text. This switch enables them on shards."&#125;,&#123;"id":"minPixelSize","type":"number","label":"Minimum pixel size","default":0.25,"min":0,"max":4,"step":0.05,"materialSection":"Shard shape","materialScope":"shards"&#125;,&#123;"id":"grainSizeMultiplier","type":"number","label":"Grain size multiplier","default":1.05,"min":0.2,"max":4,"step":0.05,"materialSection":"Shard shape","materialScope":"shards"&#125;,&#123;"id":"spriteSize","type":"number","label":"Sprite size","default":1.9,"min":0.3,"max":4,"step":0.05,"materialSection":"Shard shape","materialScope":"shards"&#125;,&#123;"id":"spriteTilt","type":"number","label":"Sprite tilt","default":12,"min":0,"max":70,"step":1,"unit":"deg","materialSection":"Shard shape","materialScope":"shards"&#125;,&#123;"id":"spriteAlphaCut","type":"number","label":"Alpha cut","default":0.6,"min":0.05,"max":0.6,"step":0.01,"materialSection":"Shard shape","materialScope":"shards"&#125;,&#123;"id":"fontWeight","type":"enum","label":"Type - Weight (Geist)","default":"600","options":[&#123;"value":"400","label":"Regular 400"&#125;,&#123;"value":"600","label":"SemiBold 600"&#125;,&#123;"value":"700","label":"Bold 700"&#125;]&#125;,&#123;"id":"letterSpacing","type":"number","label":"Type - Letter spacing","default":0.01,"min":-0.1,"max":0.4,"step":0.005,"unit":"em"&#125;,&#123;"id":"shardAmount","type":"number","label":"Shards - Visible fraction of the broken volume (Powder amount)","default":0.44,"min":0.02,"max":1,"step":0.01&#125;,&#123;"id":"strayDust","type":"number","label":"Shards - Ambient dust motes around the object (the experiment had 40)","default":24,"min":0,"max":200,"step":1&#125;,&#123;"id":"sliceRadius","type":"number","label":"Break - First (diagonal) slice radius","default":0.6,"min":0.05,"max":1.5,"step":0.01&#125;,&#123;"id":"sliceStrength","type":"number","label":"Break - First slice strength","default":21.5,"min":1,"max":40,"step":0.5&#125;,&#123;"id":"finalEjectBoost","type":"number","label":"Break - Last break: eject speed and speed cap multiplier","default":2.5,"min":1,"max":6,"step":0.1&#125;,&#123;"id":"shatterRadius","type":"number","label":"Break - Follow-up slice radius (sets their spacing too)","default":0.45,"min":0.1,"max":1.5,"step":0.01&#125;,&#123;"id":"shatterStrength","type":"number","label":"Break - Follow-up slice strength","default":32.5,"min":1,"max":40,"step":0.5&#125;,&#123;"id":"cutThreshold","type":"number","label":"Tune break - Cut threshold (surface gone above this erosion)","default":0.3,"min":0.3,"max":0.98,"step":0.01&#125;,&#123;"id":"cutSoftness","type":"number","label":"Tune break - Cut softness","default":0.19,"min":0.005,"max":0.3,"step":0.005&#125;,&#123;"id":"edgeWidth","type":"number","label":"Tune break - Crumbly edge band width","default":0.19,"min":0.05,"max":0.8,"step":0.01&#125;,&#123;"id":"edgeInset","type":"number","label":"Tune break - Edge inset","default":0,"min":0,"max":0.3,"step":0.005&#125;,&#123;"id":"brushSoftness","type":"number","label":"Tune break - Brush softness (edge falloff of a slice)","default":0.15,"min":0.02,"max":1,"step":0.01&#125;,&#123;"id":"brushNoise","type":"number","label":"Tune break - Brush noise (ragged boundary)","default":0.4,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"crumbleRate","type":"number","label":"Tune break - Crumble rate along cracks (high = the whole shape goes at once)","default":4.3,"min":0,"max":6,"step":0.05&#125;,&#123;"id":"crumbleCrackBias","type":"number","label":"Tune break - Crumble crack bias","default":5.1,"min":0,"max":6,"step":0.05&#125;,&#123;"id":"crumbleDuration","type":"number","label":"Tune break - Crumble duration after a stroke","default":0.35,"min":0,"max":2,"step":0.01&#125;,&#123;"id":"ejectSpeed","type":"number","label":"Flight - Eject speed","default":0.91,"min":0,"max":4,"step":0.01&#125;,&#123;"id":"ejectSpread","type":"number","label":"Flight - Eject spread along the normal","default":0.48,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"ejectTurbulence","type":"number","label":"Flight - Eject turbulence","default":4,"min":0,"max":4,"step":0.01&#125;,&#123;"id":"drag","type":"number","label":"Flight - Drag (speed decays by this per second)","default":0,"min":0,"max":8,"step":0.01&#125;,&#123;"id":"gravity","type":"number","label":"Flight - Gravity (0 = shards never fall)","default":0,"min":0,"max":2,"step":0.005&#125;,&#123;"id":"turbulence","type":"number","label":"Flight - Turbulence strength (curl noise)","default":4,"min":0,"max":4,"step":0.01&#125;,&#123;"id":"turbulenceScale","type":"number","label":"Flight - Turbulence scale","default":2.65,"min":0.2,"max":8,"step":0.05&#125;,&#123;"id":"turbulenceDecay","type":"number","label":"Flight - Turbulence decay with age (low = keeps swirling)","default":3.65,"min":0.05,"max":4,"step":0.01&#125;,&#123;"id":"clumpCohesion","type":"number","label":"Flight - Clump cohesion (shards orbit a leader; 0 = none)","default":0.9,"min":0,"max":10,"step":0.05&#125;,&#123;"id":"followObject","type":"number","label":"Flight - Shards follow the object motion for (s; 30 = whole flight)","default":30,"min":0,"max":30,"step":0.5,"unit":"s"&#125;,&#123;"id":"settleTime","type":"number","label":"Flight - Settle time (velocity is killed after this; 12 = never)","default":2.2,"min":0.3,"max":12,"step":0.05&#125;,&#123;"id":"settledDrift","type":"number","label":"Flight - Organic drift once settled (curl noise)","default":1,"min":0,"max":1,"step":0.005&#125;,&#123;"id":"maxSpeed","type":"number","label":"Flight - Speed cap","default":26.3,"min":1,"max":40,"step":0.1&#125;,&#123;"id":"repelStrength","type":"number","label":"Flight - Push out of the solid shape while it breaks","default":30,"min":0,"max":30,"step":0.1&#125;,&#123;"id":"repelRange","type":"number","label":"Flight - Push range outside the surface","default":0.97,"min":0.02,"max":2,"step":0.01&#125;,&#123;"id":"repelRadial","type":"number","label":"Flight - Push away from the shape centre (clears pockets and the hole)","default":17.5,"min":0,"max":60,"step":0.5&#125;,&#123;"id":"repelRadialRange","type":"number","label":"Flight - Radial push range (object radii)","default":3.3,"min":1,"max":4,"step":0.05&#125;,&#123;"id":"tumble","type":"number","label":"Flight - Tumble rate","default":1.05,"min":0,"max":12,"step":0.05&#125;,&#123;"id":"returnGroupStagger","type":"number","label":"Assembly - Regional delay (seconds)","default":1.35,"min":0,"max":1.5,"step":0.05,"unit":"s"&#125;,&#123;"id":"returnGroupScale","type":"number","label":"Assembly - Region / noise size","default":2.55,"min":0.1,"max":3,"step":0.05,"description":"Larger values form broader connected patches. Noise is evaluated only on retarget."&#125;,&#123;"id":"returnGroupSeed","type":"number","label":"Return - Group timing seed","default":60765,"min":0,"max":65535,"step":1&#125;,&#123;"id":"formSpread","type":"number","label":"Return - Wave spread (nearest shards leave first, seconds)","default":0,"min":0,"max":4,"step":0.05,"unit":"s"&#125;,&#123;"id":"waveReach","type":"number","label":"Return - Distance over which the wave spreads","default":10,"min":0.2,"max":10,"step":0.1&#125;,&#123;"id":"formJitter","type":"number","label":"Return - Per-shard stagger (random delay up to this)","default":2.8,"min":0,"max":3,"step":0.05,"unit":"s"&#125;,&#123;"id":"formFill","type":"number","label":"Return - Fill-in rate for voxels no shard returns to","default":3,"min":0.05,"max":3,"step":0.05&#125;,&#123;"id":"returnSpring","type":"number","label":"Return - Spring stiffness","default":29.9,"min":0.5,"max":40,"step":0.1&#125;,&#123;"id":"returnDamping","type":"number","label":"Return - Spring damping","default":1.34,"min":0.2,"max":2,"step":0.01&#125;,&#123;"id":"returnRamp","type":"number","label":"Return - Spring ramp-in (seconds until it pulls at full strength)","default":0.45,"min":0,"max":3,"step":0.05&#125;,&#123;"id":"returnMaxSpeed","type":"number","label":"Return - Speed cap on the way home","default":60,"min":1,"max":60,"step":0.5&#125;,&#123;"id":"alignToSurface","type":"number","label":"Return - Shards turn to lie on the surface (0 = keep tumbling)","default":1,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"alignCurve","type":"number","label":"Return - Alignment curve over the flight home (1 linear, higher = later)","default":3.75,"min":0.2,"max":4,"step":0.05&#125;,&#123;"id":"healRate","type":"number","label":"Return - Neighbour heal rate","default":3,"min":0.02,"max":3,"step":0.01&#125;,&#123;"id":"cellRestore","type":"number","label":"Return - Cell restore rate","default":60,"min":0,"max":60,"step":0.5&#125;,&#123;"id":"landedFade","type":"number","label":"Return - Landed shard fade","default":1.65,"min":0,"max":2,"step":0.01&#125;,&#123;"id":"refrostTime","type":"number","label":"Return - Refrost time","default":10.6,"min":0.2,"max":12,"step":0.1&#125;,&#123;"id":"keyColor","type":"color","label":"Light - Key colour","default":"#f0f7ff"&#125;,&#123;"id":"keyIntensity","type":"number","label":"Light - Key intensity","default":5.05,"min":0,"max":12,"step":0.05&#125;,&#123;"id":"keyElevation","type":"number","label":"Light - Key elevation","default":42,"min":10,"max":89,"step":0.5,"unit":"deg"&#125;,&#123;"id":"keyAzimuth","type":"number","label":"Light - Key azimuth","default":-38,"min":-90,"max":90,"step":0.5,"unit":"deg"&#125;,&#123;"id":"keySize","type":"number","label":"Light - Key size (softbox)","default":1.25,"min":0.2,"max":3,"step":0.01&#125;,&#123;"id":"fill","type":"number","label":"Light - Fill intensity (hemisphere, diffuse only: barely shows on clear ice)","default":0.18,"min":0,"max":1.5,"step":0.005&#125;,&#123;"id":"fillColor","type":"color","label":"Light - Fill sky colour","default":"#cadde9"&#125;,&#123;"id":"fillGroundColor","type":"color","label":"Light - Fill ground colour","default":"#172635"&#125;,&#123;"id":"rim","type":"number","label":"Light - Rim spot intensity","default":2.5,"min":0,"max":5,"step":0.01&#125;,&#123;"id":"rimColor","type":"color","label":"Light - Rim colour","default":"#d9f1ff"&#125;,&#123;"id":"rimElevation","type":"number","label":"Light - Rim elevation (0 = straight behind)","default":20,"min":0,"max":89,"step":0.5,"unit":"deg"&#125;,&#123;"id":"swayAmplitude","type":"number","label":"Light - Key sway amplitude","default":0,"min":0,"max":0.15,"step":0.001&#125;,&#123;"id":"swayPeriod","type":"number","label":"Light - Key sway period","default":35,"min":2,"max":40,"step":0.5,"unit":"s"&#125;,&#123;"id":"envSoftbox","type":"number","label":"Light - Environment softbox (the main light on glass)","default":1.1,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"envRim","type":"number","label":"Light - Environment rim strip","default":1.4,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"envFill","type":"number","label":"Light - Environment front fill","default":0.22,"min":0,"max":1,"step":0.005&#125;,&#123;"id":"backdropTop","type":"color","label":"Backdrop - Top colour","default":"#050505"&#125;,&#123;"id":"backdropMid","type":"color","label":"Backdrop - Mid colour","default":"#050505"&#125;,&#123;"id":"backdropBottom","type":"color","label":"Backdrop - Bottom colour","default":"#050505"&#125;,&#123;"id":"backdropCenterX","type":"number","label":"Backdrop - Bloom centre X","default":0.73,"min":0,"max":1,"step":0.005&#125;,&#123;"id":"backdropCenterY","type":"number","label":"Backdrop - Bloom centre Y","default":0.22,"min":0,"max":2,"step":0.005&#125;,&#123;"id":"backdropRadius","type":"number","label":"Backdrop - Bloom radius","default":0.8,"min":0.1,"max":2,"step":0.005&#125;,&#123;"id":"backdropFalloff","type":"number","label":"Backdrop - Bloom falloff","default":0.85,"min":0.5,"max":6,"step":0.01&#125;,&#123;"id":"backdropNoise","type":"number","label":"Backdrop - Dither noise","default":0,"min":0,"max":3,"step":0.05&#125;,&#123;"id":"bloomThreshold","type":"number","label":"Post - Bloom threshold","default":3,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"bloomIntensity","type":"number","label":"Post - Bloom intensity","default":0.04,"min":0,"max":1.5,"step":0.005&#125;,&#123;"id":"bloomRadius","type":"number","label":"Post - Bloom radius","default":1,"min":0,"max":1,"step":0.005&#125;,&#123;"id":"monochrome","type":"number","label":"Post - Monochrome","default":0.04,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"tonemap","type":"enum","label":"Post - Tonemap","default":"aces","options":[&#123;"value":"agx","label":"AgX"&#125;,&#123;"value":"aces","label":"ACES"&#125;,&#123;"value":"neutral","label":"Neutral"&#125;,&#123;"value":"linear","label":"Linear"&#125;]&#125;,&#123;"id":"exposure","type":"number","label":"Post - Exposure","default":1,"min":0.1,"max":4,"step":0.01&#125;,&#123;"id":"contrast","type":"number","label":"Post - Contrast","default":1.03,"min":0.6,"max":1.6,"step":0.005&#125;,&#123;"id":"blackLift","type":"number","label":"Post - Black lift","default":0,"min":0,"max":0.1,"step":0.001&#125;,&#123;"id":"vignetteStrength","type":"number","label":"Post - Vignette strength","default":0.14,"min":0,"max":1,"step":0.005&#125;,&#123;"id":"vignetteSoftness","type":"number","label":"Post - Vignette softness","default":1.2,"min":0.1,"max":1.5,"step":0.005&#125;,&#123;"id":"vignetteRadius","type":"number","label":"Post - Vignette radius","default":1.2,"min":0.2,"max":1.6,"step":0.005&#125;,&#123;"id":"grainStrength","type":"number","label":"Post - Film grain","default":0,"min":0,"max":0.15,"step":0.001&#125;,&#123;"id":"quality","type":"enum","label":"Performance - Quality profile","default":"full","options":[&#123;"value":"full","label":"Full (baked look; needs a real GPU)"&#125;,&#123;"value":"lite","label":"Lite (the source ?lite profile for software WebGPU)"&#125;]&#125;,&#123;"id":"upscaler","type":"enum","label":"Performance - Upscaler","default":"fsr1","options":[&#123;"value":"fsr1","label":"FSR 1 (TRAA + EASU/RCAS)"&#125;,&#123;"value":"taau","label":"TAAU"&#125;,&#123;"value":"bilinear","label":"Bilinear"&#125;,&#123;"value":"native","label":"Native (no upscale)"&#125;]&#125;,&#123;"id":"renderScale","type":"number","label":"Performance - Scene resolution scale (upscaled to 1080p)","default":1,"min":0.35,"max":1,"step":0.05&#125;,&#123;"id":"shapeResolution","type":"enum","label":"Shape voxel resolution","default":"256","options":[&#123;"value":"128","label":"128 — draft"&#125;,&#123;"value":"256","label":"256 — high"&#125;,&#123;"value":"384","label":"384 — ultra"&#125;],"description":"Resolution of the logo and text distance fields. Rebuilds shapes; higher values increase startup time and memory. Independent of breakup resolution."&#125;,&#123;"id":"erosionResolution","type":"enum","label":"Performance - Erosion field resolution (voxels per axis)","default":"96","options":[&#123;"value":"64","label":"64"&#125;,&#123;"value":"96","label":"96"&#125;,&#123;"value":"128","label":"128"&#125;,&#123;"value":"192","label":"192 (baked)"&#125;]&#125;,&#123;"id":"particleCount","type":"enum","label":"Performance - Powder particles","default":"100k","options":[&#123;"value":"100k","label":"100k (baked)"&#125;,&#123;"value":"250k","label":"250k"&#125;,&#123;"value":"500k","label":"500k"&#125;,&#123;"value":"1M","label":"1M"&#125;]&#125;,&#123;"id":"logoMeshDetail","type":"number","label":"Shape - Logo mesh detail (1-4; higher = finer surface)","default":2,"min":1,"max":4,"step":1&#125;,&#123;"id":"deformStrength","type":"number","label":"Geometry - Ice deformation strength (0 = original)","default":0,"min":0,"max":0.08,"step":0.001&#125;,&#123;"id":"deformScale","type":"number","label":"Geometry - Noise feature size (larger = broader)","default":0.41,"min":0.001,"max":0.5,"step":0.001&#125;,&#123;"id":"deformSeed","type":"number","label":"Geometry - Deformation seed","default":7,"min":0,"max":65535,"step":1&#125;,&#123;"id":"rimAzimuth","type":"number","label":"Light - Rim azimuth","default":-146,"min":-180,"max":180,"step":1&#125;,&#123;"id":"rimAngle","type":"number","label":"Light - Rim beam angle","default":26,"min":10,"max":89,"step":1&#125;,&#123;"id":"rimSize","type":"number","label":"Light - Rim reflection size","default":0.45,"min":0.1,"max":3,"step":0.05&#125;,&#123;"id":"fillReflectionStrength","type":"number","label":"Light - Fill reflection strength","default":0.3,"min":0,"max":2,"step":0.01&#125;,&#123;"id":"accentCoolIntensity","type":"number","label":"Studio Cool accent - intensity","default":3.71,"min":0,"max":4,"step":0.01&#125;,&#123;"id":"accentCoolReflection","type":"number","label":"Studio Cool accent - reflection","default":2.31,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"accentCoolElevation","type":"number","label":"Studio Cool accent - elevation","default":63,"min":-85,"max":85,"step":1&#125;,&#123;"id":"accentCoolAzimuth","type":"number","label":"Studio Cool accent - azimuth","default":22,"min":-180,"max":180,"step":1&#125;,&#123;"id":"accentCoolSize","type":"number","label":"Studio Cool accent - size","default":2.65,"min":0.1,"max":3,"step":0.05&#125;,&#123;"id":"accentCoolColor","type":"color","label":"Studio Cool accent - color","default":"#ff5900"&#125;,&#123;"id":"accentWarmIntensity","type":"number","label":"Studio Warm accent - intensity","default":2.99,"min":0,"max":4,"step":0.01&#125;,&#123;"id":"accentWarmReflection","type":"number","label":"Studio Warm accent - reflection","default":0.34,"min":0,"max":3,"step":0.01&#125;,&#123;"id":"accentWarmElevation","type":"number","label":"Studio Warm accent - elevation","default":30,"min":-85,"max":85,"step":1&#125;,&#123;"id":"accentWarmAzimuth","type":"number","label":"Studio Warm accent - azimuth","default":-30,"min":-180,"max":180,"step":1&#125;,&#123;"id":"accentWarmSize","type":"number","label":"Studio Warm accent - size","default":1.2,"min":0.1,"max":3,"step":0.05&#125;,&#123;"id":"accentWarmColor","type":"color","label":"Studio Warm accent - color","default":"#75aaff"&#125;,&#123;"id":"returnNoiseAmount","type":"enum","label":"Assembly - Regional pattern","default":"2","options":[&#123;"value":"2","label":"Travelling seam + organic spread"&#125;,&#123;"value":"1","label":"Smooth noise regions"&#125;,&#123;"value":"0","label":"Original cell groups"&#125;]&#125;,&#123;"id":"assemblyFrontDuration","type":"number","label":"Assembly - Growth duration (seconds)","default":3.2,"min":0,"max":6,"step":0.05&#125;,&#123;"id":"assemblyOriginX","type":"number","label":"Assembly - Growth start X","default":-0.65,"min":-1,"max":1,"step":0.01&#125;,&#123;"id":"assemblyOriginY","type":"number","label":"Assembly - Growth start Y","default":0.55,"min":-1,"max":1,"step":0.01&#125;,&#123;"id":"assemblyAngle","type":"number","label":"Assembly - Seam direction (degrees)","default":-35,"min":-180,"max":180,"step":1&#125;,&#123;"id":"assemblySpread","type":"number","label":"Assembly - Outward spread vs seam travel","default":0.65,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"assemblyFrontNoise","type":"number","label":"Assembly - Growth edge irregularity","default":0.35,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"assemblySpeedVariation","type":"number","label":"Assembly - Return speed variation","default":0.65,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"assemblyBend","type":"number","label":"Assembly - Approach path bend","default":1.2,"min":0,"max":3,"step":0.05&#125;,&#123;"id":"assemblySwirl","type":"number","label":"Assembly - Approach twist","default":1.1,"min":0,"max":3,"step":0.05&#125;,&#123;"id":"assemblyLandingVariation","type":"number","label":"Assembly - Landing transition variation","default":0.8,"min":0,"max":1,"step":0.01&#125;,&#123;"id":"rendererProfile","type":"enum","label":"Renderer experiment (reload required)","default":"studio","options":[&#123;"value":"original","label":"Original glass + GPU startup"&#125;,&#123;"value":"lookup","label":"Original glass + material lookup"&#125;,&#123;"value":"mesh","label":"Mesh surface + original glass"&#125;,&#123;"value":"studio","label":"Studio glass approximation"&#125;,&#123;"value":"matcap","label":"Matcap glass approximation"&#125;]&#125;,&#123;"id":"textWidth","type":"number","label":"Type - Headline block width (the mark is 2.6 wide)","default":6.5,"min":1.2,"max":9,"step":0.05&#125;,&#123;"id":"textLineHeight","type":"number","label":"Type - Line height","default":0.95,"min":0.7,"max":1.4,"step":0.01,"unit":"em"&#125;,&#123;"id":"textDepth","type":"number","label":"Type - Extrusion depth (fraction of the font size)","default":0.16,"min":0.05,"max":0.8,"step":0.01&#125;,&#123;"id":"textBevel","type":"number","label":"Type - Bevel (fraction of the font size)","default":0.04,"min":0,"max":0.12,"step":0.005&#125;,&#123;"id":"textCorner","type":"number","label":"Type - Corner rounding (fraction of the font size)","default":0.008,"min":0,"max":0.06,"step":0.002&#125;,&#123;"id":"textMeshDetail","type":"number","label":"Type - Text mesh detail (1-4; higher = smoother deformation)","default":4,"min":1,"max":4,"step":1&#125;]'
          data-composition-id="frost-sequence-rig"
          data-start="0"
          data-duration="22.5"
          data-width="1920"
          data-height="1080"
          data-requires-webgpu=""
        >
          <div
            data-hf-id="hf-5a64"
            id="logo-position"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="1"
            data-name="Logo · Position XYZ"
            aria-label="Logo · Position XYZ"
          ></div>
          <div
            data-hf-id="hf-fjc6"
            id="logo-rotation"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="2"
            data-name="Logo · Rotation XYZ"
            aria-label="Logo · Rotation XYZ"
          ></div>
          <div
            data-hf-id="hf-speh"
            id="logo-breakup"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="3"
            data-name="Logo · Breakup %"
            aria-label="Logo · Breakup %"
          ></div>
          <div
            data-hf-id="hf-k8ny"
            id="logo-assembly"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="4"
            data-name="Logo · Assembly %"
            aria-label="Logo · Assembly %"
          ></div>
          <div
            data-hf-id="hf-uxt2"
            id="headline1-position"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="5"
            data-name="First text · Position XYZ"
            aria-label="First text · Position XYZ"
          ></div>
          <div
            data-hf-id="hf-y4rq"
            id="headline1-rotation"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="6"
            data-name="First text · Rotation XYZ"
            aria-label="First text · Rotation XYZ"
          ></div>
          <div
            data-hf-id="hf-35xb"
            id="headline1-breakup"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="7"
            data-name="First text · Breakup %"
            aria-label="First text · Breakup %"
          ></div>
          <div
            data-hf-id="hf-4hde"
            id="headline1-assembly"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="8"
            data-name="First text · Assembly %"
            aria-label="First text · Assembly %"
          ></div>
          <div
            data-hf-id="hf-tyaz"
            id="headline2-position"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="9"
            data-name="Second text · Position XYZ"
            aria-label="Second text · Position XYZ"
          ></div>
          <div
            data-hf-id="hf-2lbw"
            id="headline2-rotation"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="10"
            data-name="Second text · Rotation XYZ"
            aria-label="Second text · Rotation XYZ"
          ></div>
          <div
            data-hf-id="hf-xk1d"
            id="headline2-breakup"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="11"
            data-name="Second text · Breakup %"
            aria-label="Second text · Breakup %"
          ></div>
          <div
            data-hf-id="hf-9dhs"
            id="headline2-assembly"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="12"
            data-name="Second text · Assembly %"
            aria-label="Second text · Assembly %"
          ></div>
          <div
            data-hf-id="hf-b04i"
            id="camera-orbit"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="14"
            data-name="Camera · Orbit Y"
            aria-label="Camera · Orbit Y"
          ></div>
          <div
            data-hf-id="hf-flyz"
            id="scene-fade"
            class="clip"
            data-start="0"
            data-duration="22.5"
            data-track-index="13"
            data-name="Scene · Fade out %"
            aria-label="Scene · Fade out %"
          ></div>
        </div>
  </div>
</SceneCanvas>

<style>
:global {
  .hf-port {
    position: absolute; top: 0; left: 0; width: 1920px; height: 1080px; overflow: hidden;
  }
  .hf-port, .hf-port * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .hf-port {
    background: #030303;
  }
  #frost-root {
    position: relative;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    background: #030303;
  }
  #frost-stage {
    position: absolute;
    inset: 0;
    background: #030303;
  }
  #frost-stage canvas {
    position: absolute;
    inset: 0;
    width: 1920px;
    height: 1080px;
    display: block;
  }
  #frost-build-status {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 5;
    padding: 10px 14px;
    background: #000b;
    color: #eee;
    font: 16px system-ui;
  }
  #frost-stage.nogpu {
    background: radial-gradient(ellipse 78% 78% at 50% 150%, #2a2a2a, #050505 70%, #030303);
  }
  /* the motion checker needs a moving layout box on every frame: a background-coloured 1.5 px plate */
  #frost-plate {
    position: absolute;
    left: 0;
    top: 1078px;
    width: 1.5px;
    height: 1.5px;
    background: #030303;
    pointer-events: none;
  }
  #frost-root {
    pointer-events: none;
  }
  #frost-root > .clip {
    position: absolute;
    left: 0;
    top: 0;
    width: 1920px;
    height: 1080px;
    background: transparent;
    pointer-events: none;
  }
}
</style>
