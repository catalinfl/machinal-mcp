import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';
import crossSpawn from 'cross-spawn';
import { workspace } from './helpers.mjs';

const execute = promisify(execFile);
const root = fileURLToPath(new URL('../', import.meta.url));

test('the packed npm client contains every pinned library file and its installed adapter reads locally with no login or server', { timeout: 300_000 }, async t => {
  const directory = await workspace(t);
  const packed = await new Promise((resolve, reject) => {
    const child = crossSpawn('npm', ['pack', '--json', '--ignore-scripts', '--pack-destination', directory], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(JSON.parse(stdout.slice(stdout.search(/^\[/m)))[0]) : reject(new Error(stderr)));
  });
  await execute('tar', ['-xf', join(directory, packed.filename), '-C', directory]);
  const packageRoot = join(directory, 'package');
  const manifest = JSON.parse(await readFile(join(packageRoot, 'library/manifest.json'), 'utf8'));
  const paths = new Set(packed.files.map(file => file.path));
  assert.ok(![...paths].some(path => path.startsWith('library/runtime/')));
  for (const [name, entry] of Object.entries(manifest.files)) {
    assert.ok(paths.has(`library/${entry.storagePath ?? name}`), name);
  }
  const { installRuntime } = await import(pathToFileURL(join(packageRoot, 'src/runtime.mjs')));
  const script = await installRuntime({ home: directory, env: {} });
  const { SceneLibrary } = await import(pathToFileURL(join(dirname(script), '../src/scene-library.mjs')));
  const library = new SceneLibrary();
  const candidates = await library.reference({ topic: 'component-discovery', query: 'diagramă',
    role: 'diagram', profiles: ['educational', 'social'], aspect: 'portrait' });
  assert.ok(candidates.entries.some(entry => entry.family === 'hyperframes' && entry.format.verifiedAspects.includes('portrait')));
  for (const entry of await library.catalog('hyperframes-components')) {
    const result = await library.reference({ topic: 'hyperframes-components', id: entry.id });
    assert.equal(Boolean(result.entries[0].component), entry.nativeStatus === 'ported', entry.id);
  }
  for (const entry of await library.catalog('hyperframes-files')) {
    assert.ok((await library.source({ id: entry.id })).sourceBytes >= 0, entry.id);
  }
  for (const topic of ['film-styles', 'film-techniques', 'animation-skills', 'examples']) {
    const entries = await library.catalog(topic);
    assert.ok(entries.length > 0);
    for (const entry of entries) {
      const result = await library.reference({ topic, id: entry.id });
      assert.ok(result.entries[0].source || result.entries[0].composition, `${topic}/${entry.id}`);
    }
  }
  assert.match((await library.reference({ topic: 'brief' })).guide, /native question tool/);
  assert.match((await library.resource('machinal://reference/workflow')).contents[0].text, /CAPTION PRESERVATION/);
  const { MCPBridge } = await import(pathToFileURL(join(dirname(script), '../src/bridge.mjs')));
  for (const url of ['https://api.machinal.app/mcp', 'http://127.0.0.1:1/mcp']) {
    const bridge = new MCPBridge({ url, env: {}, credentialStore: {
      read() { assert.fail('offline installed reads must never access credentials'); },
    }, fetchImpl() { assert.fail('offline installed reads must never contact the server'); } });
    const initialized = await bridge.handle('initialize', { protocolVersion: '2025-03-26' });
    assert.equal(initialized.protocolVersion, '2025-03-26');
    assert.equal(initialized.serverInfo?.name, 'machinal');
    assert.match(initialized.instructions, /Machinal MCP adapter/);
    for (const name of ['get_library_reference', 'get_editing_reference']) {
      for (const [id, effectCode] of [['blocks-aurora', 'createHyperframeShader'], ['blocks-glitch', 'gl_FragColor']]) {
        const result = await bridge.handle('tools/call', { name, arguments: { topic: 'hyperframes-components', id } });
        assert.equal(result.structuredContent.statusCode, 200);
        const entry = result.structuredContent.data.entries[0];
        assert.equal(entry.id, id);
        assert.ok(entry.component.includes(effectCode), `${id} is missing its shader implementation`);
        assert.equal(entry.component, await readFile(join(packageRoot, 'library', 'scene-templates', `${entry.nativeTemplateId}.svelte`), 'utf8'));
      }
    }
  }
});
