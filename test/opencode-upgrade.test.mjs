import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { parse } from 'jsonc-parser';
import { planConfiguration } from '../src/configuration.mjs';
import { configureOpenCodeAuth, isMachinalPlugin, OPENCODE_AUTH_PLUGIN, upgradeOpenCodeAuth } from '../src/opencode-configuration.mjs';
import { planOpenCodeUpgrade, saveOpenCodeUpgrade } from '../src/opencode-upgrade.mjs';
import { endpointFiles, isManagedRuntimeCommand, stateDirectory } from '../src/runtime.mjs';
import { VERSION } from '../src/version.mjs';
import { run } from '../src/cli.mjs';
import { workspace } from './helpers.mjs';
import { recordInstallation } from '../src/installations.mjs';

const endpoint = 'https://api.machinal.app/mcp';

function command(context, version = '0.4.2', url = endpoint) {
  return [process.execPath, join(stateDirectory(context), 'runtime', `${version}-win32-x64-${'a'.repeat(16)}`, 'bin', 'machinal-stdio.mjs'), 'serve', '--url', url,
    '--catalog-file', endpointFiles(url, context).catalogFile];
}

function configuration(cmd, extra = {}) {
  return { model: 'keep', plugins: ['unrelated', { package: '@machinal/mcp@0.4.2', options: {
    servers: { machinal: endpoint }, commands: { machinal: cmd }, toolRouting: { enabled: false },
  } }], mcp: { timeout: 80, servers: { machinal: { type: 'local', command: cmd }, other: { type: 'remote', url: 'https://other.example/mcp' } } }, ...extra };
}

test('managed runtime detection rejects arbitrary scripts and path traversal', async t => {
  const context = { home: await workspace(t), env: {} };
  assert.equal(isManagedRuntimeCommand(command(context), context), true);
  for (const script of ['relative/bin/machinal-stdio.mjs', join(context.home, 'elsewhere/bin/machinal-stdio.mjs'),
    join(stateDirectory(context), 'runtime', '..', 'untrusted', 'bin', 'machinal-stdio.mjs')]) {
    assert.equal(isManagedRuntimeCommand([process.execPath, script, 'serve'], context), false);
  }
});

test('upgrade synchronizes plugin and runtime while preserving endpoints, options and unrelated settings', async t => {
  const context = { home: await workspace(t), env: {} };
  const before = configuration(command(context));
  before.mcp.servers.machinal.timeout = 180;
  const script = command(context, VERSION)[1];
  const source = `// Keep this comment\r\n${JSON.stringify(before, null, 2)}\r\n`;
  const content = upgradeOpenCodeAuth(source, { ...context, script });
  const after = parse(content);
  const expected = structuredClone(before);
  expected.plugins[1].package = OPENCODE_AUTH_PLUGIN;
  expected.plugins[1].options.commands.machinal[1] = script;
  expected.mcp.servers.machinal.command[1] = script;
  assert.deepEqual(after, expected);
  assert.ok(content.startsWith('// Keep this comment\r\n'));
  assert.equal(upgradeOpenCodeAuth(content, { ...context, script }), content);
});

test('matching local development and npm companions consolidate without losing other registrations', () => {
  const content = JSON.stringify({ plugins: [
    { package: 'file:///D:/test-web/packages/mcp-installer/src/opencode-plugin', options: { servers: { machinal: endpoint } } },
    'unrelated', { package: '@machinal/mcp@0.4.1', options: { servers: { team: 'https://team.example/mcp' } } },
  ] });
  const config = parse(configureOpenCodeAuth(content, 'machinal', endpoint));
  assert.equal(config.plugins.length, 2);
  assert.equal(config.plugins[0].package, OPENCODE_AUTH_PLUGIN);
  assert.deepEqual(config.plugins[0].options.servers, { machinal: endpoint, team: 'https://team.example/mcp' });
  assert.equal(config.plugins[1], 'unrelated');
});

test('duplicate companion versions with only managed-runtime differences consolidate automatically', async t => {
  const context = { home: await workspace(t), env: {} };
  const config = configuration(command(context));
  config.plugins.push({ package: '@machinal/mcp@0.4.1', options: {
    servers: { machinal: endpoint }, commands: { machinal: command(context, '0.4.1') },
  } });
  const script = command(context, VERSION)[1];
  const content = upgradeOpenCodeAuth(JSON.stringify(config), { ...context, script });
  const updated = parse(content);
  assert.equal(updated.plugins.length, 2);
  assert.equal(updated.plugins[1].package, OPENCODE_AUTH_PLUGIN);
  assert.equal(updated.plugins[1].options.commands.machinal[1], script);
  assert.deepEqual(updated.plugins[1].options.commands.machinal, updated.mcp.servers.machinal.command);
  assert.equal(upgradeOpenCodeAuth(content, { ...context, script }), content);
});

test('conflicting duplicate options, invalid JSON and command overrides fail without changing files', async t => {
  const context = { home: await workspace(t), env: {} };
  const config = configuration(command(context));
  config.mcp.servers.machinal.command = ['untrusted.exe', ...command(context).slice(1)];
  assert.throws(() => upgradeOpenCodeAuth(JSON.stringify(config), { ...context, script: command(context, VERSION)[1] }), /differs from its approved/);
  for (const source of ['{broken', '{"model":"one","model":"two"}', JSON.stringify({ plugins: [
    { package: '@machinal/mcp@0.4.1', options: { servers: { machinal: endpoint } } },
    { package: '@machinal/mcp@0.4.2', options: { servers: { machinal: 'https://different.example/mcp' } } },
  ] })]) assert.throws(() => upgradeOpenCodeAuth(source, { ...context, script: command(context, VERSION)[1] }));
});

test('setup replaces split 0.4.3/0.5.1 versions in global, ancestor, project and recorded OpenCode configurations', async t => {
  const root = await workspace(t);
  const context = { cwd: join(root, 'project', 'child'), home: join(root, 'home'), env: {} };
  const recorded = join(root, 'another-project');
  const files = [join(context.home, '.config/opencode/opencode.jsonc'), join(root, 'opencode.jsonc'),
    join(root, '.opencode/opencode.jsonc'), join(recorded, 'opencode.jsonc'), join(context.cwd, 'opencode.jsonc')];
  const originals = new Map();
  for (const file of files) {
    const config = configuration(command(context, file === files[0] ? '0.5.1' : '0.4.3'));
    config.plugins[1].package = file === files[0] ? '@machinal/mcp@0.5.1' : '@machinal/mcp@0.4.3';
    if (file === files[1]) config.plugins[1].options.commands.machinal = command(context, '0.5.1');
    if (file === files.at(-1)) config.mcp.servers.machinal.timeout = { execution: 90_000 };
    if (file === files.at(-1)) config.plugins.push('@machinal/mcp@0.5.1');
    const original = JSON.stringify(config, null, 2);
    originals.set(file, original);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, original);
  }
  await recordInstallation({ ...context, cwd: recorded, client: 'opencode', scope: 'project', name: 'machinal' });
  const options = { ...context, client: 'opencode', scope: 'project', platform: 'win32', name: 'machinal', url: endpoint,
    transport: 'stdio', script: command(context, VERSION)[1], catalogFile: endpointFiles(endpoint, context).catalogFile };
  const plan = await planConfiguration(options);
  assert.equal(plan.conflict, false, 'A managed version-only upgrade must not require --replace');
  const related = await planOpenCodeUpgrade(plan, options);
  assert.deepEqual(new Set(related.map(entry => entry.file)), new Set(files.slice(0, -1)));
  const saved = await saveOpenCodeUpgrade(plan, related);
  for (const result of saved) {
    assert.equal(await readFile(result.backup, 'utf8'), originals.get(result.file));
    const config = parse(await readFile(result.file, 'utf8'));
    assert.equal(config.plugins.filter(isMachinalPlugin).length, 1);
    assert.equal(config.plugins[1].package, OPENCODE_AUTH_PLUGIN);
    assert.equal(config.plugins[1].options.commands.machinal[1], options.script);
    assert.equal(config.mcp.servers.machinal.command[1], options.script);
    assert.equal(config.model, 'keep');
    assert.deepEqual(config.mcp.servers.machinal.timeout, parse(originals.get(result.file)).mcp.servers.machinal.timeout);
  }
  const repeated = await planConfiguration(options);
  assert.equal(repeated.original, repeated.content);
  assert.deepEqual(await planOpenCodeUpgrade(repeated, options), []);
});

test('a changed related configuration aborts synchronization before any planned write', async t => {
  const root = await workspace(t);
  const first = join(root, 'one.jsonc');
  const second = join(root, 'two.jsonc');
  await writeFile(first, '{}');
  await writeFile(second, '{"model":"user-change"}');
  await assert.rejects(saveOpenCodeUpgrade({ file: second, original: '{}', content: '{"plugins":[]}' }, [
    { file: first, original: '{}', content: '{"plugins":[]}' },
  ]), /changed during setup/);
  assert.equal(await readFile(first, 'utf8'), '{}');
  assert.deepEqual(await readdir(root), ['one.jsonc', 'two.jsonc']);
});

test('stdio setup automatically repairs a prior global/project version split without login or paid work', { skip: process.platform !== 'win32' }, async t => {
  const root = await workspace(t);
  const context = { cwd: join(root, 'project'), home: join(root, 'home'), env: {}, interactive: false,
    credentialStore: null, log: () => {}, checkConnection: () => assert.fail('Deferred login must not make authenticated requests') };
  const files = [join(context.home, '.config/opencode/opencode.jsonc'), join(context.cwd, 'opencode.jsonc')];
  const source = JSON.stringify(configuration(command(context)));
  for (const file of files) {
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, source);
  }
  await run(['setup', '--client', 'opencode', '--mode', 'server', '--defer-login', '--no-skills', '--yes'], context);
  const configs = await Promise.all(files.map(async file => parse(await readFile(file, 'utf8'))));
  assert.equal(configs[0].plugins[1].package, configs[1].plugins[1].package);
  assert.deepEqual(configs[0].plugins[1].options.commands, configs[1].plugins[1].options.commands);
  assert.deepEqual(configs[0].mcp.servers.machinal.command, configs[1].mcp.servers.machinal.command);
});
