<!-- Modified Svelte/frame-driven adaptation of Hyperframes chat-thread.
     heygen-com/hyperframes @ 8ec98be29a64e88239a0c05f7e5d09f36e181493, Apache-2.0.
     Licence/credits retained in ../hyperframes-library/. -->
<script>
  import { SceneCanvas, useScene } from '@machinal/scenes/svelte';

  const scene = useScene();
  const design = { messages: ['Întrebarea ta', 'Răspunsul tău', 'Pasul următor'], accent: '#b9dcb8', background: '#142023', stagger: 0.18 };
  const progress = $derived(scene.frame.progress);
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));

  function arrival(index) {
    const t = Math.max(0, Math.min(1, (progress - 0.08 - index * design.stagger) / 0.16));
    return 1 - (1 - t) ** 3;
  }
</script>

<SceneCanvas background={design.background}>
  <svg width="100%" height={safeHeight} viewBox="0 0 1000 700" aria-label="A supplied conversation revealed as independently moving messages">
    {#each design.messages.slice(0, 3) as message, index}
      {@const amount = arrival(index)}
      {@const own = index % 2 === 1}
      <g opacity={amount} transform="translate({own ? 270 : 100} {105 + index * 160 + 26 * (1 - amount)})">
        <rect width="630" height="115" rx="26" fill={own ? design.accent : '#2a3c40'} />
        <text x="32" y="69" font-size="34" fill={own ? '#172125' : '#edf2ec'}>{message}</text>
        <path d={own ? 'M600 90 L630 130 V85' : 'M30 90 L0 130 V85'} fill={own ? design.accent : '#2a3c40'} />
      </g>
    {/each}
  </svg>
</SceneCanvas>

<style>
  svg { display: block; font-family: 'Direction Sans'; }
</style>
