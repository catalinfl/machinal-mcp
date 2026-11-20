<script>
  import { SceneCanvas, SceneThree, useScene } from '@direction/scene-svelte';

  const scene = useScene();
  const design = { first: '#cf815b', second: '#648c94', turn: 0.50 };
  const safeHeight = $derived(scene.frame.config.height * (1 - (scene.frame.config.captionSafeBottom ?? 0)));

  function setup({ THREE, world, camera }) {
    const mesh = (geometry, color) => new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness: 0.84 }));
    const table = mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.16, 40), '#9a7154');
    table.position.y = 1;
    world.add(table);
    const base = mesh(new THREE.CylinderGeometry(0.28, 0.54, 1, 20), '#564235');
    base.position.y = 0.5;
    world.add(base);

    function figure(side, color) {
      const person = new THREE.Group();
      person.position.x = side * 1.65;
      const coat = mesh(new THREE.CylinderGeometry(0.24, 0.48, 1.2, 20), color);
      coat.position.y = 0.65;
      const head = mesh(new THREE.SphereGeometry(0.29, 24, 16), '#d7b99a');
      head.position.y = 1.65;
      const arm = new THREE.Group();
      arm.position.set(-side * 0.20, 1.08, 0.12);
      const sleeve = mesh(new THREE.CylinderGeometry(0.09, 0.12, 0.64, 12), color);
      sleeve.position.y = -0.32;
      arm.add(sleeve);
      person.add(coat, head, arm);
      world.add(person);
      return { person, arm, side };
    }
    const actors = [figure(-1, design.first), figure(1, design.second)];
    const floor = mesh(new THREE.CylinderGeometry(5, 5, 0.20, 48), '#4b5554');
    floor.position.y = -0.10;
    world.add(floor, new THREE.HemisphereLight(0xffecd3, 0x425260, 2.4));
    const key = new THREE.DirectionalLight(0xffdfbc, 3);
    key.position.set(-3, 5, 4);
    world.add(key);
    return { update(frame) {
      const p = frame.progress;
      const turn = Math.min(0.85, Math.max(0.15, design.turn));
      actors.forEach(({ person, arm, side }, i) => {
        const local = i ? (p - turn) / (1 - turn) : p / turn;
        const gesture = Math.sin(Math.PI * Math.max(0, Math.min(1, local))) ** 2;
        arm.rotation.z = -side * (0.20 + gesture * 1.15);
        person.rotation.z = side * gesture * 0.06;
      });
      const shift = Math.tanh((p - turn) * 8);
      camera.position.set(0.65 * shift, 2.45, camera.aspect < 1 ? 10 / camera.aspect : 6.3);
      camera.lookAt(0.32 * shift, 1, 0);
    } };
  }
</script>

<SceneCanvas background="#293337">
  <SceneThree {setup} width={scene.frame.config.width} height={safeHeight} label="Two figures exchange turns across a table" />
</SceneCanvas>
