<!-- Modified Svelte/frame-driven adaptation of Hyperframes before-after-wipe.
     heygen-com/hyperframes @ 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0.
     Licence and credits retained in ../hyperframes-library/. No upstream media included. -->
<script>
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  let { images = {} } = $props();
  const scene = useScene();
  const design = { before: 'Înainte', after: 'După', accent: '#d7ed96', background: '#172125', revealStart: 0.2, revealEnd: 0.62 };
  const progress = $derived(scene.frame.progress);
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));
  const reveal = $derived(smooth((progress - design.revealStart) / Math.max(0.01, design.revealEnd - design.revealStart)));
  const boundary = $derived(900 - 800 * reveal);

  function smooth(value) {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  }
</script>

<SceneCanvas background={design.background}>
  <svg width="100%" height={safeHeight} viewBox="0 0 1000 700" aria-label="Aligned approved images with a full before-after reveal">
    <defs><clipPath id="hf-after"><rect x={boundary} y="90" width={900 - boundary} height="440" /></clipPath></defs>
    <image href={images.image_1} x="100" y="90" width="800" height="440" preserveAspectRatio="xMidYMid meet" />
    <image href={images.image_2} x="100" y="90" width="800" height="440" preserveAspectRatio="xMidYMid meet" clip-path="url(#hf-after)" />
    <g opacity={Math.sin(Math.PI * reveal)}>
      <path d="M{boundary} 80 V540" stroke={design.accent} stroke-width="4" />
      <circle cx={boundary} cy="310" r="20" fill={design.accent} />
      <path d="M{boundary - 8} 310 H{boundary + 8}" stroke={design.background} stroke-width="3" />
    </g>
    <text x="100" y="615" fill="#edf2ec" font-size="38" opacity={1 - reveal}>{design.before}</text>
    <text x="900" y="615" fill={design.accent} font-size="38" text-anchor="end" opacity={reveal}>{design.after}</text>
  </svg>
</SceneCanvas>

<style>
  svg { display: block; font-family: 'Direction Sans'; }
</style>
