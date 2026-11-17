<!-- Modified native adapter of Hyperframes blocks-spiral; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0.
Original shader runtime is vendored separately under MIT; see shaders.THIRD-PARTY-LICENSES.txt. -->
<script>
  import { untrack } from 'svelte';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';
  import { createHyperframeShader } from '@machinal/hyperframes/shaders';
  const scene = useScene();
  let root = $state();
  let shader = $state.raw();

  $effect(() => {
    if (!root) return;
    const runtime = createHyperframeShader(root.querySelector('canvas[data-shader]'));
    shader = runtime;
    scene.resources.track(runtime.ready);
    return () => { runtime.dispose(); shader = undefined; };
  });

  $effect(() => {
    const runtime = shader;
    const time = scene.frame.time;
    if (runtime) untrack(() => scene.resources.track(runtime.seek(time)));
  });
</script>
<SceneCanvas background="#000">
  <div class="hf-port" bind:this={root}>
    <div
      data-composition-id="spiral"
      data-start="0"
      data-duration="2"
      data-width="1920"
      data-height="1080"
      data-requires-webgpu
      data-no-timeline
      style="position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #000"
    >
      <canvas data-shader="Spiral" width="1920" height="1080"></canvas>
    </div>
    
  </div>
</SceneCanvas>
<style>
  :global(.hf-port) { position:relative; width:1920px; height:1080px; overflow:hidden; }
  :global { 
      [data-composition-id="spiral"] canvas[data-shader] {
        position: absolute;
        inset: 0;
        width: 1920px;
        height: 1080px;
        display: block;
        background: #000;
      }
     }
</style>
