<script>
  import { SceneCanvas, SceneThree, useScene } from '@direction/scene-svelte';

  const scene = useScene();
  const design = { stone: '#b0aaa1', gate: '#805c40', traveler: '#be634c' };
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));
  function ease(p) {
    const t = Math.max(0, Math.min(1, p));
    return t * t * (3 - 2 * t);
  }
  function setup({ THREE, world, camera }) {
    function box(parent, w, h, d, x, y, z, color) {
      const object = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color }));
      object.position.set(x, y, z);
      parent.add(object);
      return object;
    }
    box(world, 10, 0.2, 9, 0, -0.13, 0, '#637665');
    box(world, 1.8, 0.05, 9, 0, 0, 0, '#c7ad88');
    const gates = [-1, 1].map(side => {
      box(world, 2.7, 1.9, 0.45, side * 2.6, 0.95, 0, design.stone);
      box(world, 0.55, 2.9, 0.8, side * 1.24, 1.45, 0, design.stone);
      const hinge = new THREE.Group();
      hinge.position.set(side, 0, 0);
      box(hinge, 0.98, 2.1, 0.12, -side * 0.49, 1.05, 0, design.gate);
      world.add(hinge);
      return { side, hinge };
    });
    const traveler = new THREE.Group();
    const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.86, 16), new THREE.MeshStandardMaterial({ color: design.traveler }));
    cloak.position.y = 0.49;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 16, 12), new THREE.MeshStandardMaterial({ color: '#d6b99c' }));
    head.position.y = 0.97;
    traveler.add(cloak, head);
    world.add(traveler, new THREE.HemisphereLight(0xfff1d7, 0x3c5160, 2.5));
    const sun = new THREE.DirectionalLight(0xffdfa9, 3);
    sun.position.set(-4, 7, 3);
    world.add(sun);
    return { update(frame) {
      const p = frame.progress;
      for (const { side, hinge } of gates) hinge.rotation.y = -side * 1.35 * ease((p - 0.12) / 0.30);
      traveler.position.z = 3.3 - 5.3 * ease((p - 0.27) / 0.54);
      const wide = camera.aspect < 1 ? 1 / camera.aspect : 1;
      camera.position.set(wide * (3.5 - ease(p) * 0.8), wide * 3.1, wide * (7.2 - ease(p) * 0.9));
      camera.lookAt(0, 1, 0.3);
    } };
  }
</script>

<SceneCanvas background="#aabdc3">
  <SceneThree {setup} width={scene.frame.config.width} height={safeHeight} label="A traveler arrives and passes through opening gate leaves" />
</SceneCanvas>
