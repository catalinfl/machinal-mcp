import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSceneComponent, detectStaticInspectResult } from '../src/scene-validation.mjs';
import { MCPBridge } from '../src/bridge.mjs';
import { LIBRARY_ROOT, SceneLibrary } from '../src/scene-library.mjs';
import { installWorkflowStartup } from '../src/opencode-workflow.mjs';

test('all bundled scene-templates pass validateSceneComponent with zero false positives', async () => {
  const dir = join(LIBRARY_ROOT, 'scene-templates');
  const files = (await readdir(dir)).filter(name => name.endsWith('.svelte')).sort();
  assert.ok(files.length > 400);
  for (const name of files) {
    const source = await readFile(join(dir, name), 'utf8');
    assert.doesNotThrow(() => validateSceneComponent(source), `Template failed validation: ${name}`);
  }
});

test('validateSceneComponent rejects Remotion-style timing/canvas props in $props() and export let', () => {
  const badScenes = [
    `<script>
      let { frame = 0, fps = 30, durationInFrames = 180 } = $props();
      let t = $derived(frame / fps);
    </script><div style="opacity: {t}">Hi</div>`,
    `<script lang="ts">
      let { frame = 0, fps = 30, durationInFrames = 900, width = 1080, height = 1920 } = $props<{ frame?: number; fps?: number }>();
      let beat = $derived(frame < 150 ? 1 : 2);
    </script><div>{beat}</div>`,
    `<script>
      let { images = {}, frame = 0 } = $props();
      let t = $derived(frame / 30);
    </script><img src={images.image_1} style="opacity: {t}" />`,
    `<script>
      let { time = 0, progress = 0 } = $props();
    </script><div>{time} {progress}</div>`,
    `<script>
      let { frame: currentFrame = 0 } = $props();
    </script><div>{currentFrame}</div>`,
    `<script>
      const props = $props();
      let t = $derived(props.frame / 30);
    </script><div>{t}</div>`,
    `<script>
      const props = $props();
      let t = $derived(props['time']);
    </script><div>{t}</div>`,
    `<script>
      export let frame = 0;
      export let fps = 30;
    </script><div>{frame}</div>`,
  ];

  for (const source of badScenes) {
    assert.throws(
      () => validateSceneComponent(source),
      /Machinal does NOT pass .*useScene\(\)/s,
      `Expected rejection for:\n${source}`,
    );
  }
});

test('validateSceneComponent rejects top-level image_1/video_1/model_1 props and unread media attachments', () => {
  assert.throws(
    () => validateSceneComponent(`<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      let { image_1 = '' } = $props();
      const scene = useScene();
      const t = $derived(scene.frame.time);
    </script><SceneCanvas><img src={image_1} style="opacity:{t}" alt="" /></SceneCanvas>`),
    /Machinal does NOT pass `image_1` as top-level props.*images\.image_1/s,
  );

  assert.throws(
    () => validateSceneComponent(
      `<script>
        import { SceneCanvas, useScene } from '@direction/scene-svelte';
        const scene = useScene();
        const t = $derived(scene.frame.time);
      </script><SceneCanvas><div style="opacity:{t}">Hi</div></SceneCanvas>`,
      { images: [{ id: 'image_1', file: 'card.png', name: 'Card' }] },
    ),
    /compile_scene attached `images`.*does not read `images` from `\$props\(\)`/s,
  );

  assert.doesNotThrow(() => validateSceneComponent(
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      let { images = {} } = $props();
      const scene = useScene();
      const t = $derived(scene.frame.time);
    </script><SceneCanvas><img src={images.image_1} style="opacity:{t}" alt="" /></SceneCanvas>`,
    { images: [{ id: 'image_1', file: 'card.png', name: 'Card' }] },
  ));
});

test('validateSceneComponent rejects non-reactive top-level scene.frame snapshots and destructuring', () => {
  const frozenSnapshots = [
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const { frame } = useScene();
      const t = $derived(frame.time);
    </script><SceneCanvas>{t}</SceneCanvas>`,
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const scene = useScene();
      const t = scene.frame.time;
    </script><SceneCanvas><div style="opacity: {t}">Hi</div></SceneCanvas>`,
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const scene = useScene();
      const progress = Math.min(1, scene.frame.time / 0.5);
    </script><SceneCanvas><div style="opacity: {progress}">Hi</div></SceneCanvas>`,
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const scene = useScene();
      const { time } = scene.frame;
    </script><SceneCanvas>{time}</SceneCanvas>`,
  ];

  for (const source of frozenSnapshots) {
    assert.throws(
      () => validateSceneComponent(source),
      /Invalid Machinal scene runtime contract/,
      `Expected non-reactive snapshot rejection for:\n${source}`,
    );
  }
});

test('validateSceneComponent rejects animated scenes without useScene/SceneThree and wall-clock timers', () => {
  assert.throws(
    () => validateSceneComponent(`<script>
      let x = $state(0);
      let op = $derived(Math.min(1, x));
    </script><div style="opacity: {op}">Hi</div>`),
    /does not read frame time from `useScene\(\)` or `SceneThree`/,
  );

  assert.throws(
    () => validateSceneComponent(`<script>
      import { progressAt } from '@direction/scene-runtime';
      const op = progressAt(0, 0, 1);
    </script><div style="opacity: {op}">Hi</div>`),
    /does not read frame time from `useScene\(\)` or `SceneThree`/,
  );

  assert.throws(
    () => validateSceneComponent(`<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const scene = useScene();
      requestAnimationFrame(() => {});
    </script><SceneCanvas>{scene.frame.time}</SceneCanvas>`),
    /requestAnimationFrame\(\)` is non-deterministic/,
  );

  assert.throws(
    () => validateSceneComponent(`<script>
      setInterval(() => {}, 16);
    </script><div>Hi</div>`),
    /setInterval\(\)` is non-deterministic/,
  );
});

test('validateSceneComponent allows valid useScene, SceneThree, static config reads, and minimal static markup', () => {
  const validScenes = [
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      let { images = {}, parameters = {} } = $props();
      const scene = useScene();
      const { width, height, fps } = scene.frame.config;
      const t = $derived(scene.frame.time);
      const op = $derived(Math.min(1, t / 0.4));
    </script><SceneCanvas background="#F4F1EA"><div style="width:{width}px;height:{height}px;opacity:{op}"><img src={images.image_1} alt="" /></div></SceneCanvas>`,
    `<script>
      import { SceneCanvas, useScene } from '@direction/scene-svelte';
      const scene = useScene();
      const val = $derived.by(() => {
        const t = scene.frame.time;
        return t * 2;
      });
      $effect(() => {
        const now = scene.frame.time;
        void now;
      });
    </script><SceneCanvas>{val}</SceneCanvas>`,
    `<script>
      import { SceneCanvas, SceneThree } from '@direction/scene-svelte';
      let { models = {} } = $props();
      function setup({ THREE, world, camera }) {
        return { update(frame) { void frame.time; } };
      }
    </script><SceneCanvas background="#000"><SceneThree {setup} /></SceneCanvas>`,
    `<script>const x = 1;</script><h1>Argeș</h1>`,
    `<p>Plain static fixture</p>`,
  ];

  for (const source of validScenes) {
    assert.doesNotThrow(() => validateSceneComponent(source), `Unexpected rejection for:\n${source}`);
  }
});

test('detectStaticInspectResult flags identical frames across distinct frame indices and ignores animated scenes', () => {
  const identical = detectStaticInspectResult({
    content: [
      { type: 'text', text: 'Frame 0' },
      { type: 'image', data: 'SAME_JPEG_BYTES', mimeType: 'image/jpeg' },
      { type: 'image', data: 'SAME_JPEG_BYTES', mimeType: 'image/jpeg' },
      { type: 'text', text: JSON.stringify({ statusCode: 200, data: { evidence: { frames: [{ frame: 0 }, { frame: 120 }] } } }) },
    ],
    structuredContent: { statusCode: 200, data: { evidence: { frames: [{ frame: 0 }, { frame: 120 }] } } },
  });
  assert.equal(identical.structuredContent.data.evidence.allSampledFramesIdentical, true);
  assert.match(identical.structuredContent.data.staticSceneWarning, /identical pixels/);
  assert.equal(identical.content.filter(p => p.type === 'image').length, 2);

  const animated = detectStaticInspectResult({
    content: [
      { type: 'image', data: 'FRAME_0_BYTES', mimeType: 'image/jpeg' },
      { type: 'image', data: 'FRAME_120_BYTES', mimeType: 'image/jpeg' },
      { type: 'text', text: JSON.stringify({ statusCode: 200, data: { evidence: { frames: [{ frame: 0 }, { frame: 120 }] } } }) },
    ],
    structuredContent: { statusCode: 200, data: { evidence: { frames: [{ frame: 0 }, { frame: 120 }] } } },
  });
  assert.equal(animated.structuredContent.data.staticSceneWarning, undefined);
  assert.equal(animated.structuredContent.data.evidence.allSampledFramesIdentical, undefined);
});

test('MCPBridge blocks broken compile_scene before upstream RPC, exposes runtime rules in quickstart, and flags static inspect_scene', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'machinal-scene-guard-'));
  try {
    const upstreamCalls = [];
    const bridge = new MCPBridge({
      url: 'http://127.0.0.1:8080/mcp',
      env: {},
      credentialStore: null,
      allowedRoots: [dir],
      requireQuickstart: false,
    });
    bridge.state = { status: 'connected' };
    bridge.tools = [
      { name: 'compile_scene', description: 'Compile scene.', inputSchema: { type: 'object', required: ['projectId', 'component'], properties: { projectId: { type: 'string' }, component: { type: 'string' } } } },
      { name: 'inspect_scene', description: 'Inspect scene.', inputSchema: { type: 'object', required: ['projectId', 'file', 'sourceVersion', 'frames', 'userApproved'], properties: { projectId: { type: 'string' } } } },
    ];
    bridge.rpc = async (_method, params) => {
      upstreamCalls.push(params);
      if (params.name === 'inspect_scene') {
        const payload = { statusCode: 200, data: { file: 's.scene.json', evidence: { frames: [{ frame: 0, time: 0 }, { frame: 90, time: 3 }] } } };
        return {
          content: [
            { type: 'image', data: 'FROZEN_BASE64', mimeType: 'image/jpeg' },
            { type: 'image', data: 'FROZEN_BASE64', mimeType: 'image/jpeg' },
          ],
          structuredContent: payload,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify({ statusCode: 200, data: { ok: true } }) }], structuredContent: { statusCode: 200, data: { ok: true } } };
    };

    const listed = new Map((await bridge.handle('tools/list')).tools.map(tool => [tool.name, tool]));
    assert.match(listed.get('compile_scene').description, /NEVER declare frame, fps/);
    assert.match(listed.get('compile_scene').inputSchema.properties.component.description, /useScene\(\)/);

    const quickstart = (await bridge.handle('tools/call', { name: 'production_quickstart', arguments: {} })).structuredContent.data;
    assert.ok(Array.isArray(quickstart.sceneRuntimeRules));
    assert.ok(quickstart.sceneRuntimeRules.some(rule => rule.includes('useScene()')));
    assert.ok(quickstart.yamlRules.some(rule => rule.includes('document.after')));

    // Inline broken component is blocked locally
    const inlineBlocked = await bridge.handle('tools/call', {
      name: 'compile_scene',
      arguments: {
        projectId: 'p_1',
        component: '<script>let { frame = 0, fps = 30 } = $props(); let t = $derived(frame / fps);</script><div style="opacity:{t}">Hi</div>',
      },
    });
    assert.equal(inlineBlocked.isError, true);
    assert.equal(inlineBlocked.structuredContent.submissionState, 'not-submitted');
    assert.match(inlineBlocked.structuredContent.message, /useScene\(\)/);
    assert.equal(upstreamCalls.length, 0);

    // Local .svelte file with broken props is also blocked locally
    const badFile = join(dir, 'frozen.svelte');
    await writeFile(badFile, '<script>export let frame = 0;</script><div>{frame}</div>', 'utf8');
    const fileBlocked = await bridge.handle('tools/call', {
      name: 'compile_scene',
      arguments: { projectId: 'p_1', componentFile: badFile },
    });
    assert.equal(fileBlocked.isError, true);
    assert.equal(upstreamCalls.length, 0);

    // Valid useScene() component passes through to upstream
    const goodRes = await bridge.handle('tools/call', {
      name: 'compile_scene',
      arguments: {
        projectId: 'p_1',
        component: `<script>import { SceneCanvas, useScene } from '@direction/scene-svelte'; const scene = useScene(); const t = $derived(scene.frame.time);</script><SceneCanvas><div style="opacity:{t}">Hi</div></SceneCanvas>`,
      },
    });
    assert.equal(goodRes.isError, undefined);
    assert.equal(upstreamCalls.length, 1);

    // inspect_scene flags identical frames automatically
    const inspected = await bridge.handle('tools/call', {
      name: 'inspect_scene',
      arguments: { projectId: 'p_1', file: 's.scene.json', sourceVersion: 'sha256:abc', frames: [0, 90], userApproved: true },
    });
    assert.equal(inspected.structuredContent.data.evidence.allSampledFramesIdentical, true);
    assert.match(inspected.structuredContent.data.staticSceneWarning, /identical pixels/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('OpenCode workflow compile_scene wrapper rejects frozen Remotion-style props before upstream execution', async () => {
  const upstreamCalls = [];
  const tools = new Map([
    ['machinal_compile_scene', {
      name: 'machinal_compile_scene',
      description: 'Compile scene.',
      input: { type: 'object', properties: { component: { type: 'string' } } },
      execute: async (input) => { upstreamCalls.push(input); return { content: '{}' }; },
    }],
    ['machinal_render_video', {
      name: 'machinal_render_video',
      description: 'Render.',
      input: { type: 'object', properties: {} },
      execute: async () => ({ content: '{}' }),
    }],
  ]);
  const hooks = [];
  const skills = new Map([
    ['machinal-editing', { id: 'machinal-editing', content: 'editing' }],
    ['machinal-cinema', { id: 'machinal-cinema', content: 'cinema' }],
  ]);
  await installWorkflowStartup({
    skill: { list: async () => [...skills.values()] },
    permission: { assert: async () => {} },
    tool: {
      transform: async fn => fn({
        add: tool => tools.set(tool.name, tool),
        update: (name, fn2) => { if (tools.has(name)) fn2(tools.get(name)); },
      }),
    },
    session: { hook: async (type, fn) => hooks.push({ type, fn }) },
  }, ['machinal'], { mode: 'local' });

  const ctx = { sessionID: 'ses_guard', agent: 'test', messageID: 'm1', id: 't1' };
  await tools.get('machinal_prepare_video').execute({ purpose: 'create' }, ctx);
  for (const h of hooks.filter(x => x.type === 'context')) h.fn({ sessionID: 'ses_guard', system: [] });

  assert.match(tools.get('machinal_compile_scene').description, /NEVER declare frame, fps/);
  await assert.rejects(
    tools.get('machinal_compile_scene').execute({
      component: '<script>let { frame = 0, fps = 30 } = $props(); let t = $derived(frame / fps);</script><div style="opacity:{t}">Hi</div>',
    }, ctx),
    /Machinal does NOT pass `frame`, `fps`/,
  );
  assert.equal(upstreamCalls.length, 0);

  // Confirm SceneLibrary quickstart markdown includes Svelte 5 runtime section
  const lib = new SceneLibrary(undefined, { mode: 'local' });
  const md = lib.quickstartMarkdown(await lib.quickstart({ purpose: 'create' }));
  assert.match(md, /Critical Svelte 5 Scene Runtime Rules/);
  assert.match(md, /useScene\(\)/);
});
