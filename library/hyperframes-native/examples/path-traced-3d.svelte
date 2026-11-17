<!-- Modified native adapter of Hyperframes examples-path-traced-3d; upstream 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0.
Original shader runtime is vendored separately under MIT; see shaders.THIRD-PARTY-LICENSES.txt. -->
<script>
  import { untrack } from 'svelte';
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';
  import { mountPathtracer } from '@machinal/hyperframes/vendor/pathtracer';
  const scene = useScene();
  let root = $state();
  let shader = $state.raw();

  $effect(() => {
    if (!root) return;
    const runtime = mountPathtracer();
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
      id="root"
      data-composition-id="main"
      data-start="0"
      data-duration="6"
      data-width="1920"
      data-height="1080"
      data-no-timeline
    >
      <canvas
        id="pt-canvas"
        class="clip"
        data-start="0"
        data-duration="6"
        data-track-index="1"
      ></canvas>
    </div>
    
  </div>
</SceneCanvas>
<style>
  :global(.hf-port) { position:relative; width:1920px; height:1080px; overflow:hidden; }
  :global { 
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      html,
      body {
        width: 1920px;
        height: 1080px;
        overflow: hidden;
        background: #0e1115;
      }
      #root {
        position: relative;
        width: 100%;
        height: 100%;
      }
      #pt-canvas {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
      }
     }
</style>
