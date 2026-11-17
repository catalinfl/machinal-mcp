import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installWorkflowStartup, productionSkills, startupSkills } from '../src/opencode-workflow.mjs';
import { installSceneLibrary } from '../src/opencode-library.mjs';

const skills = productionSkills.map(id => ({ id, content: `Instructions for ${id}`, path: `/skills/${id}/SKILL.md` }));

async function fixture({ list = async () => ({ location: {}, data: skills }), permission = async () => {},
  upstream = async () => ({ content: 'original result' }) } = {}) {
  const hooks = new Map();
  const transforms = [];
  const permissions = [];
  const calls = [];
  let tools;
  const replay = () => {
    tools = new Map(['compile_scene', 'render_video', 'generate_assets'].map(name => [`custom_${name}`, {
      input: { type: 'object', required: name === 'compile_scene' ? ['projectId', 'component'] : [], properties: { component: { type: 'string' } } },
      description: name, execute: async input => { calls.push(input); return upstream(name, input); },
    }]));
    for (const transform of transforms) transform({ add: tool => tools.set(tool.name, tool), update: (id, update) => { if (tools.has(id)) update(tools.get(id)); } });
  };
  await installWorkflowStartup({
    skill: { list },
    permission: { assert: async input => { permissions.push(input); await permission(input); } },
    tool: { transform: async transform => { transforms.push(transform); replay(); } },
    session: { hook: async (name, callback) => hooks.set(name, callback) },
  }, ['custom'].values());
  return { hooks, permissions, calls, replay, definition: name => tools.get(name),
    execute: async (name, input = {}, sessionID = 'ses_one') => tools.get(name).execute(input, { sessionID }),
    prepare: async (sessionID = 'ses_one') => JSON.parse((await tools.get('machinal_prepare_video').execute({ purpose: 'create' }, { sessionID })).content),
    context: async (sessionID = 'ses_one') => { const event = { sessionID, system: [] }; await hooks.get('context')(event); return event.system.map(part => part.text).join('\n'); },
  };
}

test('preparation loads only startup editing/cinema guidance, leaving other stages on demand', async () => {
  const h = await fixture();
  const result = await h.prepare();
  assert.equal(result.status, 'ready');
  assert.match(result.next, /sound effects or no sound effects.*same native form/);
  assert.match(result.next, /each distinct animated beat.*component-discovery.*two relevant native candidates/i);
  const context = await h.context();
  for (const guidance of [result.next, context]) {
    assert.match(guidance, /If sound is undecided/);
    assert.match(guidance, /Include only missing permissions/);
    assert.match(guidance, /Reuse approval from chat or the brief through sound selection\/import\/mixing, paid generation, scene-frame rendering, final encoding and requested delivery/);
    assert.match(guidance, /Do not reconfirm.*credit check within scope and budget/);
  }
  for (const skill of skills) assert.equal(context.includes(skill.content), startupSkills.includes(skill.id));
  assert.deepEqual(h.permissions[0].resources, startupSkills);
  assert.ok(!(await h.context('ses_other')).includes('Instructions for machinal-cinema'));
  assert.deepEqual(h.calls, []);
});

test('scene compilation reads UTF-8 componentFile with host permission and forwards complete inline source', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'machinal-component-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const source = '<h1>Scenă animată</h1>\n';
  const componentFile = join(directory, 'scene.svelte');
  await writeFile(componentFile, source);
  const h = await fixture();
  await h.prepare();
  await h.context();
  h.replay();
  assert.deepEqual(h.definition('custom_compile_scene').input.required, ['projectId']);
  assert.equal(h.definition('custom_compile_scene').input.properties.componentFile.type, 'string');
  const passThrough = { projectId: 'owned', userApproved: false, sourceFile: 'remote.scene.json', idempotencyKey: 'exact' };
  assert.equal((await h.execute('custom_compile_scene', { ...passThrough, componentFile })).content, 'original result');
  assert.deepEqual(h.calls, [{ ...passThrough, component: source }]);
  assert.deepEqual(h.permissions[1].resources, [componentFile]);
  assert.equal(h.permissions[1].action, 'read');
  await h.execute('custom_compile_scene', { ...passThrough, component: source });
  assert.deepEqual(h.calls[1], { ...passThrough, component: source });
});

test('missing, conflicting, oversized and denied scene sources never reach MCP compile_scene', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'machinal-component-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const componentFile = join(directory, 'scene.svelte');
  await writeFile(componentFile, 'é'.repeat(32001));
  const h = await fixture();
  await h.prepare();
  await h.context();
  for (const input of [{}, { component: '<p/>', componentFile }]) {
    await assert.rejects(h.execute('custom_compile_scene', input), /exactly one of component or componentFile|exactly one of component /);
  }
  await assert.rejects(h.execute('custom_compile_scene', { componentFile: 'relative.svelte' }), /absolute client-local/);
  await assert.rejects(h.execute('custom_compile_scene', { componentFile }), /64000 byte limit/);
  await assert.rejects(h.execute('custom_compile_scene', { component: ' ' }), /must not be blank/);
  const denied = await fixture({ permission: async input => { if (input.action === 'read') throw new Error('read blocked'); } });
  await denied.prepare();
  await denied.context();
  await assert.rejects(denied.execute('custom_compile_scene', { componentFile }), /read blocked/);
  assert.deepEqual(h.calls, []);
  assert.deepEqual(denied.calls, []);
});

test('discovered Panel Reveal reaches the compiler with its timeline and adapted Romanian content', async () => {
  const h = await fixture();
  await h.prepare();
  await h.context();
  const local = new Map();
  await installSceneLibrary({ tool: { transform: fn => fn({ add: t => local.set(t.name, t) }) }, session: { hook() {} } });
  const found = await local.get('machinal_library').execute({ topic: 'component-discovery', query: 'panel reveal' }, { sessionID: 'ses_one' });
  const candidate = JSON.parse(found.content).data.entries.find(c => c.id === 'hyperframes-components-panel-reveal');
  const compile = args => h.execute('custom_compile_scene', args);
  await assert.rejects(compile({ component: '<h1>Erlang</h1>' }), /customSceneReason/);
  await assert.rejects(compile({ ...candidate.compileInput, templateEdits: [{ from: 'Motion tokens', to: 'Erlang' }] }), /exactly once/);
  assert.equal(h.calls.length, 0);
  await compile({ ...candidate.compileInput, userApproved: false, templateEdits: [
    { from: 'title = "Motion tokens";', to: 'title = "Procese Erlang";' },
    { from: 'background: #f7f7f8;', to: 'background: #10295A;' },
  ] });
  const [submitted] = h.calls;
  assert.equal(submitted.userApproved, false);
  assert.equal(submitted.templateId, undefined);
  for (const marker of ['Procese Erlang', '#10295A', 'gsap.timeline', '--hf-panel-open', 'Apache-2.0']) assert.ok(submitted.component.includes(marker));
});

test('Erlang discovery-to-timeline round trip uses two adapted Hyperframes ports and allows a custom restart beat', async () => {
  const assets = [];
  const h = await fixture({ upstream: async (name, input) => {
    if (name === 'compile_scene') {
      const id = input.title;
      const asset = { id, kind: 'video', file: `${id}.scene.json`, version: `fixture:${id}`, duration: input.duration };
      assets.push(asset);
      return { content: JSON.stringify({ asset }) };
    }
    for (const asset of assets) {
      assert.ok(input.composition.includes(`file: ${asset.file}, version: '${asset.version}'`));
      assert.ok(input.composition.includes(`assetId: ${asset.id}, start:`));
    }
    assert.equal(input.userApproved, false);
    return { content: 'mock timeline received' };
  } });
  await h.prepare();
  await h.context();
  const local = new Map();
  await installSceneLibrary({ tool: { transform: fn => fn({ add: tool => local.set(tool.name, tool) }) }, session: { hook() {} } });
  const lookup = async input => JSON.parse((await local.get('machinal_library').execute(input, { sessionID: 'ses_one' })).content).data;
  const context = { topic: 'component-discovery', profiles: ['educational', 'social'], aspect: 'portrait' };
  const beats = [
    { id: 'title', query: 'titlu animat Erlang', role: 'title', template: 'hyperframes-components-text-stagger',
      from: 'var DEFAULT_TEXT = "Build motion systems fast";', to: 'var DEFAULT_TEXT = "Erlang, pe scurt";' },
    { id: 'messages', query: 'mesaje între procese', role: 'diagram', template: 'hyperframes-blocks-hw-pipeline',
      from: 'nodes: [{ label: "Idea" }, { label: "Record" }, { label: "Shine!" }]',
      to: 'nodes: [{ label: "Proces A" }, { label: "Mesaj" }, { label: "Proces B" }]' },
  ];
  for (const { id, query, role, template, from, to } of beats) {
    let page = await lookup({ ...context, query, role, limit: 3 });
    if (!page.entries.length) page = await lookup({ ...context, role, limit: 8 });
    const candidate = page.entries.find(entry => entry.id === template);
    assert.ok(candidate, query);
    assert.ok((await lookup(candidate.source)).entries[0].component.includes(from));
    await h.execute('custom_compile_scene', { ...candidate.compileInput, title: id, duration: 5,
      width: 1080, height: 1920, userApproved: false, templateEdits: [{ from, to }] });
    const compiledSource = h.calls.at(-1).component;
    assert.ok(compiledSource.includes(to) && !compiledSource.includes(from));
    assert.match(compiledSource, /gsap\.timeline/);
    assert.match(compiledSource, /Apache-2\.0/);
  }
  assert.deepEqual((await lookup({ ...context, query: 'restart supervisor process failed', role: 'diagram' })).entries, []);
  await h.execute('custom_compile_scene', { title: 'restart', duration: 5, component: '<p>Supraveghetorul repornește procesul.</p>',
    userApproved: false, customSceneReason: 'Flowcharts do not show a process failing and recovering while peers continue.' });

  const clips = assets.map(({ id, duration }, index) => `        - {id: clip-${id}, assetId: ${id}, start: ${index * 5}, inPoint: 0, outPoint: ${duration}}`);
  const sources = assets.map(({ id, file, version, duration }) => `  - {id: ${id}, kind: video, file: ${file}, version: '${version}', duration: ${duration}}`);
  const composition = ['document:', '  version: 2', '  mode: assemble', '  tracks:', '    - id: video',
    '      type: video', '      clips:', ...clips, '  output: {aspect: portrait, resolution: 1080p, fps: 30, format: mp4}',
    'bindings: {}', 'assets:', ...sources].join('\n');
  assert.equal((await h.execute('custom_render_video', { composition, userApproved: false })).content, 'mock timeline received');
});

test('prompts in any language remain untouched; semantic tool selection belongs to the current agent', async () => {
  const h = await fixture();
  for (const text of ['Fa-mi un video despre pozele care sunt in D:assassination', '映像を作って', 'أنشئ فيديو', 'Hazme un vídeo', 'Create a video', 'Repară rendererul video', 'arbitrary language']) {
    const prompt = { text, files: [{ uri: 'file:///source.jpg' }] };
    const before = structuredClone(prompt);
    await h.hooks.get('prompt')({ prompt });
    assert.deepEqual(prompt, before);
  }
  const context = await h.context();
  assert.match(context, /CURRENT agent/);
  assert.match(context, /Do not match keywords/);
});

test('scene compilation and final rendering cannot bypass preparation, also after catalog refresh', async () => {
  const h = await fixture();
  for (const name of ['custom_compile_scene', 'custom_render_video']) {
    assert.equal(JSON.parse((await h.execute(name)).content).status, 'blocked');
  }
  assert.deepEqual(h.calls, []);
  await h.prepare();
  assert.equal(JSON.parse((await h.execute('custom_render_video')).content).status, 'blocked', 'Cannot batch preparation and production before context loading');
  await h.context();
  h.replay();
  const input = { userApproved: false, idempotencyKey: 'preserve', expectedCompositionVersion: 'preserve' };
  assert.equal((await h.execute('custom_render_video', input)).content, 'original result');
  assert.deepEqual(h.calls, [input]);
  assert.equal(JSON.parse((await h.execute('custom_render_video', {}, 'ses_other')).content).status, 'blocked');
  assert.equal((await h.execute('custom_generate_assets')).content, 'original result');
});

test('missing or malformed skill catalogs block production clearly, not plugin setup; errors stay private', async () => {
  for (const list of [async () => null, async () => ({}), async () => { throw new Error('private failure'); },
    async () => ({ data: skills.filter(skill => skill.id !== 'machinal-cinema') }),
    async () => ({ data: [{ id: 'machinal-cinema' }, null, { id: 42 }] })]) {
    const h = await fixture({ list });
    const result = await h.prepare();
    assert.equal(result.status, 'blocked');
    assert.ok(result.missingSkills.includes('machinal-cinema'));
    assert.ok(!JSON.stringify(result).includes('private failure'));
    assert.equal(JSON.parse((await h.execute('custom_render_video')).content).status, 'blocked');
  }
});

test('skill permission rejection propagates and cannot mark a session prepared', async () => {
  const rejection = new Error('permission denied');
  const h = await fixture({ permission: async () => { throw rejection; } });
  await assert.rejects(h.prepare(), error => error === rejection);
  assert.equal(JSON.parse((await h.execute('custom_render_video')).content).status, 'blocked');
});

test('explicitly selected skills still use native prompt resolution without duplication or keyword matching', async () => {
  const h = await fixture({ list: async () => skills });
  const prompt = { text: 'anything', skills: [{ id: 'machinal-scenes' }] };
  await h.hooks.get('prompt')({ prompt });
  await h.hooks.get('prompt')({ prompt });
  assert.equal(prompt.skills.length, startupSkills.length + 1);
  assert.deepEqual(new Set(prompt.skills.map(skill => skill.id)), new Set(['machinal-scenes', ...startupSkills]));
});

test('legacy skill duplicates disappear only when their machinal replacement exists', async () => {
  const installed = new Map(['machinal-editing', 'directional-editing', 'directional-support', 'unrelated'].map(id => [id, { id }]));
  await installWorkflowStartup({
    skill: { transform: async callback => callback({ get: id => installed.get(id), remove: id => installed.delete(id) }) },
    tool: { transform: async () => {} }, session: { hook: async () => {} },
  });
  assert.deepEqual([...installed.keys()], ['machinal-editing', 'directional-support', 'unrelated']);
});
