import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SceneLibrary, LIBRARY_ROOT } from '../src/scene-library.mjs';
import { MCPBridge } from '../src/bridge.mjs';
import { installSceneLibrary } from '../src/opencode-library.mjs';

test('all 455 published ports and original files are on the client, searchable and lazily readable offline', async () => {
  const library = new SceneLibrary();
  const page = await library.reference({ topic: 'hyperframes-components', limit: 2 });
  assert.equal(page.total, 457);
  assert.equal(page.nextOffset, 2);
  assert.equal(page.origin, 'installed-client-library');
  assert.ok(page.entries.every(entry => !entry.component && !entry.source));
  assert.match(page.guide, /user's computer/);
  const ledger = await library.catalog('hyperframes-native');
  assert.equal(ledger.filter(entry => entry.status === 'ported').length, 455);
  for (const entry of await library.catalog('hyperframes-components')) {
    const result = await library.reference({ topic: 'hyperframes-components', id: entry.id });
    if (entry.nativeStatus === 'ported') {
      assert.match(result.entries[0].component, /useScene/);
      assert.ok(Buffer.byteLength(result.entries[0].component) <= 64000);
    } else assert.equal(result.entries[0].component, undefined);
  }
  for (const entry of await library.catalog('scene-templates')) {
    const result = await library.template(entry.id);
    assert.match(result.component, /useScene/);
    assert.ok(result.trustNotice.includes('permission'));
  }
  for (const id of ['swiss-grid-motion', 'blueprint-mechanism', 'paper-stage-3d']) {
    assert.ok((await library.template(id)).component.length > 0);
  }
  const original = (await library.catalog('hyperframes-files')).find(entry => entry.bytes > 48 * 1024);
  const first = await library.source({ id: original.id });
  assert.equal(first.sourceOffset, 0);
  assert.ok(first.sourceNextOffset > 0);
  const second = await library.source({ id: original.id, offset: first.sourceNextOffset });
  assert.ok(second.sourceBytes > second.sourceOffset);
  await assert.rejects(library.source({ id: '../secret' }), /Unknown/);
  await assert.rejects(library.source({ id: original.id, offset: -1 }), /UTF-8/);
  await assert.rejects(library.reference({ topic: 'unknown' }), /supported/);
  await assert.rejects(library.bytes('../package.json'), /Unknown/);
  await assert.rejects(library.template('../package.json'), /Unknown/);
});

test('stdio local discovery, compatibility lookups and resources never request credentials or contact the API', async () => {
  const bridge = new MCPBridge({ url: 'http://127.0.0.1:1/mcp', env: {},
    credentialStore: { read() { assert.fail('local reads must not access credentials'); } },
    fetchImpl() { assert.fail('local reads must not call the server'); } });
  for (const name of ['get_library_reference', 'get_editing_reference']) {
    const result = await bridge.handle('tools/call', { name, arguments: { topic: 'hyperframes-components', id: 'blocks-aurora' } });
    assert.equal(result.structuredContent.statusCode, 200);
    assert.match(result.structuredContent.data.entries[0].component, /hyperframes\/shaders/);
  }
  const resource = await bridge.handle('resources/read', { uri: 'machinal://scene-templates/hyperframes-blocks-aurora' });
  assert.match(resource.contents[0].text, /component/);
  assert.equal(bridge.state.status, 'unchecked');
});

test('local read errors are bounded and never sent upstream', async () => {
  const bridge = new MCPBridge({ url: 'http://127.0.0.1:1/mcp', credentialStore: null, env: {},
    fetchImpl() { assert.fail('invalid library inputs must not be forwarded'); } });
  const error = await bridge.handle('tools/call', { name: 'get_hyperframes_source', arguments: { id: '../secret' } });
  assert.equal(error.isError, true);
  assert.equal(error.structuredContent.statusCode, 400);
  assert.doesNotMatch(JSON.stringify(error), /Bearer|API_KEY/);
});

test('action-oriented discovery ranks compact native candidates and resolves exact Svelte offline', async () => {
  const bridge = new MCPBridge({ url: 'http://127.0.0.1:1/mcp', env: {},
    credentialStore: { read() { assert.fail('component discovery must not access credentials'); } },
    fetchImpl() { assert.fail('component discovery must not call the server'); } });
  const query = { topic: 'component-discovery', query: 'kinetic type' };
  const page = (await bridge.handle('tools/call', { name: 'get_library_reference', arguments: query })).structuredContent.data;
  assert.equal(page.entries.length, 2);
  assert.equal(page.nextOffset, 2);
  assert.ok(page.entries.some(entry => entry.id === 'kinetic-type'));
  assert.ok(page.entries.some(entry => entry.id.startsWith('hyperframes-')));
  for (const entry of page.entries) {
    assert.equal(entry.component, undefined);
    const exact = (await bridge.handle('tools/call', { name: 'get_library_reference', arguments: entry.source })).structuredContent.data;
    assert.match(exact.entries[0].component, /useScene/);
  }
  const more = (await bridge.handle('tools/call', { name: 'get_library_reference', arguments: { ...query, offset: 2 } })).structuredContent.data;
  assert.ok(more.entries.every(entry => !page.entries.some(prev => prev.id === entry.id)));
  const empty = (await bridge.handle('tools/call', { name: 'get_library_reference', arguments: { ...query, query: 'qzx-no-match' } })).structuredContent.data;
  assert.deepEqual(empty.entries, []);
  assert.match(empty.next, /without forcing/);
});

test('educational portrait discovery uses a general diagram fallback for an unmatched subject', async () => {
  const library = new SceneLibrary();
  const context = { topic: 'component-discovery', profiles: ['educational', 'social'], aspect: 'portrait', role: 'diagram' };
  assert.deepEqual((await library.reference({ ...context, query: 'mesaje între procese' })).entries, []);
  const title = await library.reference({ ...context, role: 'title', query: 'titlu animat Erlang' });
  assert.ok(title.entries.every(entry => entry.roles.includes('title')));
  assert.ok(title.entries.some(entry => entry.family === 'hyperframes' && entry.editableParameters.includes('design.text')));
  const fallback = await library.reference(context);
  assert.equal(fallback.entries[0].id, 'hyperframes-blocks-flowchart-vertical');
  assert.equal(fallback.entries[0].format.defaultAspect, 'portrait');
  assert.equal(fallback.entries[0].format.captionSafeArea, false);
  assert.ok(fallback.entries[0].format.verifiedAspects.includes('portrait'));
  assert.ok(fallback.entries[0].profiles.includes('educational'));
  const noFit = await library.reference({ ...context, query: 'restart supervisor process failed' });
  assert.deepEqual(noFit.entries, []);
});

test('general visual roles work across unrelated briefs and languages', async () => {
  const library = new SceneLibrary();
  for (const [query, role, profile] of [
    ['Cronologie a explorării spațiale', 'timeline', 'documentary'],
    ['GRAFIC al precipitațiilor', 'chart', 'educational'],
    ['Product showcase for a kitchen scale', 'showcase', 'product'],
    ['Titlu animat pentru festival', 'title', 'social'],
  ]) {
    const { entries } = await library.reference({ topic: 'component-discovery', query, role, profiles: [profile] });
    assert.ok(entries.some(entry => entry.roles.includes(role) && entry.family === 'hyperframes'), query);
  }
});

test('discovery hints rank rather than hide installed matches, and reject invalid input', async () => {
  const library = new SceneLibrary();
  const search = { topic: 'component-discovery', query: 'panel reveal' };
  const plain = await library.reference(search);
  const withHints = await library.reference({ ...search, profiles: ['documentary'], role: 'diagram', aspect: 'square' });
  assert.equal(plain.total, withHints.total);
  assert.equal(withHints.entries[0].id, 'hyperframes-components-panel-reveal');
  for (const input of [
    { ...search, profiles: ['social', 'social'] },
    { ...search, role: 'unknown' },
    { ...search, aspect: '9:16' },
    { topic: 'scene-templates', role: 'title' },
  ]) await assert.rejects(library.reference(input), /valid ID\/query\/pagination/);
});

test('OpenCode native tools expose the same local library without weakening permissions', async () => {
  const tools = new Map();
  const hooks = [];
  await installSceneLibrary({
    tool: { transform: async fn => fn({ add: tool => tools.set(tool.name, tool) }) },
    session: { hook: async (_, fn) => hooks.push(fn) },
  });
  const tool = tools.get('machinal_library');
  assert.equal(tool.options.codemode, false);
  const quickstartTool = tools.get('machinal_quickstart');
  assert.equal(quickstartTool.options.codemode, false);
  const quickstartResult = JSON.parse((await quickstartTool.execute({ purpose: 'create', profile: 'documentary' })).content);
  assert.equal(quickstartResult.statusCode, 200);
  assert.equal(quickstartResult.data.styleProfile.id, 'documentary');
  assert.match(quickstartResult.data.localFileShortcuts.validate_recipe, /compositionFile/);
  assert.match(quickstartResult.data.localFileShortcuts.compile_scene, /componentFile/);
  const result = JSON.parse((await tool.execute({ topic: 'scene-templates', id: 'paper-stage-3d' })).content);
  assert.equal(result.statusCode, 200);
  assert.match(result.data.entries[0].component, /SceneThree/);
  const event = { system: [] };
  for (const hook of hooks) hook(event);
  assert.match(event.system[0].text, /available when the remote MCP is disconnected/);
});

test('tampered installed library files fail integrity verification', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'machinal-library-test-'));
  try {
    await mkdir(join(directory, 'scene-templates'));
    const manifest = JSON.parse(await readFile(join(LIBRARY_ROOT, 'manifest.json'), 'utf8'));
    const name = 'scene-templates.json';
    const files = { [name]: manifest.files[name] };
    await writeFile(join(directory, 'manifest.json'), JSON.stringify({
      format: 1, files, version: `sha256:${createHash('sha256').update(JSON.stringify(files)).digest('hex')}`,
    }));
    await writeFile(join(directory, name), '[]');
    await assert.rejects(new SceneLibrary(directory).catalog('scene-templates'), /integrity mismatch/);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test('all skills, cinema styles, workflow guides and recipe examples are client-owned and readable offline', async () => {
  const library = new SceneLibrary();
  const installedSkills = await library.catalog('skills');
  assert.ok(installedSkills.some(skill => skill.id === 'machinal-editing'));
  assert.ok(installedSkills.some(skill => skill.id === 'machinal-scenes'));
  assert.ok(installedSkills.some(skill => skill.id === 'machinal-hyperframes'));
  for (const skill of installedSkills) assert.match(
    (await library.reference({ topic: 'skills', id: skill.id })).entries[0].source, /^---/);
  const skills = await library.reference({ topic: 'animation-skills', limit: 2 });
  assert.equal(skills.total, 14);
  assert.equal(skills.entries[0].source, undefined);
  for (const skill of await library.catalog('animation-skills')) {
    const selected = await library.reference({ topic: 'animation-skills', id: skill.id });
    assert.match(selected.entries[0].source, new RegExp(`name: ${skill.id}`));
    for (const id of skill.templates ?? []) assert.ok((await library.template(id)).component);
  }
  assert.equal((await library.catalog('film-styles')).length, 66);
  for (const topic of ['film-styles', 'film-techniques']) {
    for (const entry of await library.catalog(topic)) {
      const result = await library.reference({ topic, id: entry.id });
      assert.ok(result.entries[0].source);
      assert.equal(result.entries[0].referenceOnly, true);
      const resource = await library.resource(`machinal://${topic}/${entry.id}`);
      assert.ok(resource.contents[0].text);
    }
  }
  for (const topic of ['brief', 'production', 'yaml', 'media', 'effects', 'transitions', 'styles', 'audio', 'scenes', 'scene-authoring']) {
    const result = await library.reference({ topic });
    assert.ok(result.guide.length > 500, topic);
    assert.equal(result.origin, 'installed-client-library');
  }
  const examples = await library.catalog('examples');
  assert.ok(examples.some(entry => entry.id === 'hybrid-documentary'));
  for (const entry of examples) {
    assert.match((await library.reference({ topic: 'examples', id: entry.id })).entries[0].composition, /document:/);
  }
  assert.match((await library.resource('machinal://recipes/guide')).contents[0].text, /CAPTION PRESERVATION/);
  assert.match((await library.resource('machinal://reference/workflow')).contents[0].text, /CAPTION PRESERVATION/);
});

test('OpenCode compatibility routes authoring locally, preserves live runtime execution and survives transform replays', async () => {
  const transforms = [];
  await installSceneLibrary({
    tool: { transform: async fn => transforms.push(fn) },
    session: { hook: async () => {} },
  }, new Map([['machinal', true]]).keys());
  for (let reload = 0; reload < 2; reload++) {
    let live = 0;
    const tool = { input: { properties: { topic: { enum: ['scene-runtime'] } } },
      options: { permission: 'keep' }, execute: async (input, context) => {
        live++;
        assert.equal(input.topic, 'scene-runtime');
        assert.equal(context.marker, 'original');
        return { content: 'live runtime' };
      } };
    for (const transform of transforms) transform({
      add() {},
      update: (id, update) => { assert.equal(id, 'machinal_get_editing_reference'); update(tool); },
    });
    const local = await tool.execute({ topic: 'brief' }, {});
    const brief = JSON.parse(local.content);
    assert.deepEqual(local.output, brief, 'compatibility route must preserve the declared structured output');
    assert.equal(brief.statusCode, 200);
    assert.match(brief.data.guide, /native question tool/);
    assert.match(brief.data.guide, /separate sound-effects question/);
    assert.equal(live, 0);
    assert.equal(tool.options.permission, 'keep');
    assert.equal((await tool.execute({ topic: 'scene-runtime' }, { marker: 'original' })).content, 'live runtime');
    assert.equal(live, 1);
  }
});

test('production_quickstart returns single-call offline workflow, local file shortcuts, brief and style profile without credentials', async () => {
  const bridge = new MCPBridge({ url: 'http://127.0.0.1:1/mcp', env: {},
    credentialStore: { read() { assert.fail('quickstart must not access credentials'); } },
    fetchImpl() { assert.fail('quickstart must not call the server'); } });
  const tools = (await bridge.handle('tools/list')).tools;
  assert.ok(tools.some(tool => tool.name === 'production_quickstart'));
  const response = await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create', profile: 'documentary' } });
  assert.equal(response.structuredContent.statusCode, 200);
  const data = response.structuredContent.data;
  assert.equal(data.origin, 'installed-client-library');
  assert.equal(data.styleProfile.id, 'documentary');
  assert.ok(data.liveBootstrapBatch.includes('get_recipe_schema'));
  assert.match(data.localFileShortcuts.validate_recipe, /compositionFile/);
  assert.match(data.localFileShortcuts.compile_scene, /componentFile/);
  assert.equal(data.waitAndConcurrency.maxWaitSecondsDefault, 120);
  assert.equal(data.waitAndConcurrency.compileSceneConcurrency, 2);
  assert.match(data.briefGuide, /native question tool/);
  const viaRef = await bridge.handle('tools/call', { name: 'get_library_reference', arguments: { topic: 'quickstart', id: 'social', includeGuide: false } });
  assert.equal(viaRef.structuredContent.data.styleProfile.id, 'social');
  assert.equal(viaRef.structuredContent.data.briefGuide, undefined);
  const viaResource = await bridge.handle('resources/read', { uri: 'machinal://reference/quickstart' });
  assert.match(viaResource.contents[0].text, /Machinal Production Quickstart/);
  const unknown = await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { profile: 'nonexistent' } });
  assert.equal(unknown.isError, true);
  assert.equal(unknown.structuredContent.statusCode, 400);
});
