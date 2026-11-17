<!-- Modified for Machinal: Svelte/frame-driven port of Hyperframes count-up.
     Upstream heygen-com/hyperframes, revision 8ec98be29a64e88239a0c05f7e5d09f36e181493.
     Apache-2.0; original licence/credits: ../hyperframes-library/. No GSAP dependency. -->
<script>
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  const scene = useScene();
  const design = { start: 0, end: 100, prefix: '', suffix: '%', accent: '#7dd3a8', background: '#10191c', label: '' };
  const time = $derived(scene.frame.time);
  const duration = $derived(scene.frame.config.durationInFrames / scene.frame.config.fps);
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));
  const entrance = $derived(Math.min(2.05, duration * 0.65));
  const arrival = $derived(ease(time / (entrance * 0.25)));
  const count = $derived(ease((time - entrance * 0.12) / (entrance * 0.72)));
  const value = $derived(Math.round(design.start + (design.end - design.start) * count));
  const landing = $derived(Math.max(0, 1 - Math.abs(time / entrance - 0.84) / 0.16));

  function ease(value) {
    const t = Math.max(0, Math.min(1, value));
    return 1 - (1 - t) ** 3;
  }
</script>

<SceneCanvas background={design.background}>
  <svg width="100%" height={safeHeight} viewBox="0 0 1000 700" aria-label="Deterministic statistic counter">
    <g opacity={arrival} transform="translate(500 {330 + 30 * (1 - arrival)}) scale({0.96 + 0.04 * arrival + 0.025 * landing})">
      <text x="0" y="0" text-anchor="middle" fill={design.accent} font-size="150" font-weight="700">
        <tspan font-size="74">{design.prefix}</tspan><tspan>{value}</tspan><tspan font-size="74">{design.suffix}</tspan>
      </text>
    </g>
    {#if design.label}<text x="500" y="440" text-anchor="middle" fill="#e9efed" font-size="34" opacity={arrival}>{design.label}</text>{/if}
  </svg>
</SceneCanvas>

<style>
  svg { display: block; font-family: 'Direction Sans'; font-variant-numeric: tabular-nums; }
</style>
