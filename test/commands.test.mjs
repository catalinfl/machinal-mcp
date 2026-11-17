import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { run } from '../src/cli.mjs';
import { createCredentialStore } from '../src/credential-store.mjs';
import { endpointFiles } from '../src/runtime.mjs';
import { readSettings, saveSettings } from '../src/settings.mjs';
import { API_KEY, mcpHandler, memoryCredentialStore, serve, workspace } from './helpers.mjs';

function context(home, extra = {}) {
  const logs = [];
  return { cwd: home, home, env: {}, platform: 'linux', interactive: false,
    log: message => logs.push(message), logs, ...extra };
}

test('set-key verifies before saving the shared Linux file; no key is echoed or put in project config', async t => {
  const home = await workspace(t);
  const calls = [];
  const endpoint = await serve(t, mcpHandler(calls));
  const ctx = context(home, { interactive: true, ui: { password: async () => API_KEY,
    confirm: async question => {
      assert.equal(question.default, false);
      assert.match(question.message, /plaintext, owner-only/);
      assert.ok(calls.some(call => call.tool === 'get_credits'));
      return true;
    } } });
  assert.equal(await run(['set-key', '--url', endpoint], ctx), 0);
  const store = createCredentialStore(ctx);
  assert.equal(await store.read(), API_KEY);
  assert.deepEqual(await readdir(home), ['.config']);
  assert.ok(!ctx.logs.join('\n').includes(API_KEY));
  assert.ok(calls.every(call => call.method !== 'tools/call' || call.tool === 'get_credits'));
});

test('set-key preserves the previous saved key on rejection or cancellation', async t => {
  const home = await workspace(t);
  const store = memoryCredentialStore(API_KEY);
  const ctx = context(home, { interactive: true, credentialStore: store,
    ui: { password: async () => `mach_${'b'.repeat(64)}`, confirm: async () => false },
    checkConnection: async () => { throw Object.assign(new Error('Rejected'), { status: 401 }); } });
  await assert.rejects(run(['set-key'], ctx), /Rejected/);
  ctx.checkConnection = async () => ({ toolCount: 3 });
  assert.equal(await run(['set-key'], ctx), 0);
  assert.equal(store.peek(), API_KEY);
  assert.deepEqual(store.calls, []);
});

test('getcredit and credits use the saved connection and Linux key without prompting or spending', async t => {
  const home = await workspace(t);
  const calls = [];
  const endpoint = await serve(t, mcpHandler(calls));
  const ctx = context(home, { interactive: true, ui: { password: () => assert.fail('No prompt needed') } });
  await saveSettings({ connection: { mode: 'custom', url: endpoint } }, ctx);
  await createCredentialStore(ctx).write(API_KEY);
  for (const command of ['getcredit', 'credits']) assert.equal(await run([command], ctx), 0);
  assert.match(ctx.logs.join('\n'), /API credits: 900 available/);
  assert.ok(!ctx.logs.join('\n').includes(API_KEY));
  assert.ok(calls.every(call => call.method !== 'tools/call' || call.tool === 'get_credits'));
});

test('unavailable credits fail honestly instead of printing a zero balance', async t => {
  const home = await workspace(t);
  const endpoint = await serve(t, mcpHandler([], { creditStatus: 503 }));
  const ctx = context(home, { credentialStore: memoryCredentialStore(API_KEY) });
  await assert.rejects(run(['getcredit', '--url', endpoint], ctx), /unavailable/);
  assert.doesNotMatch(ctx.logs.join('\n'), /0 available/);
});

test('place saves host-only folder preferences without browsing, transferring or exposing the key', async t => {
  const home = await workspace(t);
  const downloads = join(home, 'download folder');
  const uploads = join(home, 'media');
  for (const path of [downloads, uploads]) await mkdir(path);
  const ctx = context(home, { credentialStore: { read: () => assert.fail('place must not read keys') } });
  assert.equal(await run(['place', '--downloads', downloads, '--uploads', uploads], ctx), 0);
  const settings = await readSettings(ctx);
  assert.equal(settings.downloadDirectory, downloads);
  assert.equal(settings.uploadDirectory, uploads);
  assert.match(ctx.logs.join('\n'), /No files uploaded or downloaded/);
  assert.deepEqual(await readdir(downloads), []);
  assert.deepEqual(await readdir(uploads), []);
  const text = await readFile(join(home, '.config/machinal/config.json'), 'utf8');
  assert.ok(!text.includes(API_KEY));
  assert.equal(await run(['place'], ctx), 0);
});

test('place validates all requested folders before changing saved preferences', async t => {
  const home = await workspace(t);
  const ctx = context(home);
  await saveSettings({ downloadDirectory: home }, ctx);
  await assert.rejects(run(['place', '--downloads', home, '--uploads', 'relative'], ctx), /absolute/);
  assert.equal((await readSettings(ctx)).uploadDirectory, undefined);
  assert.equal((await readSettings(ctx)).downloadDirectory, home);
  await assert.rejects(run(['place', '--downloads', join(home, 'missing')], ctx), /does not exist/);
});

test('new commands reject secret arguments and unrelated options before accessing credentials', async t => {
  const ctx = context(await workspace(t), { credentialStore: { read: () => assert.fail('No key access') } });
  for (const args of [['set-key', API_KEY], ['getcredit', API_KEY], ['place', API_KEY], ['set-key', '--yes'],
    ['getcredit', '--downloads', '/somewhere'], ['local', 'status', '--start-docker'], ['place', '--', API_KEY]]) {
    await assert.rejects(run(args, ctx), error => !error.message.includes(API_KEY));
  }
});

test('local status detects missing installation without Docker, providers or file changes', async t => {
  const home = await workspace(t);
  const ctx = context(home, { docker: () => assert.fail('Status must not install or inspect Docker') });
  assert.equal(await run(['local', 'status'], ctx), 1);
  assert.match(ctx.logs.join('\n'), /not installed/);
  assert.deepEqual(await readdir(home), []);
});

test('local installation builds missing images, reuses the saved token and never requires a hosted key', async t => {
  const home = await workspace(t);
  const checkout = join(home, 'source');
  for (const file of ['api/Dockerfile', 'services/scene-renderer/Dockerfile', 'compose.editengine.yaml']) {
    await mkdir(dirname(join(checkout, file)), { recursive: true });
    await writeFile(join(checkout, file), '# fixture');
  }
  const commands = [];
  const provider = `sk-or-v1-${'a'.repeat(64)}`;
  let online = false;
  const ctx = context(home, { env: { OPENROUTER_API_KEY: provider, OPENROUTER_MODEL: 'provider/model' },
    credentialStore: { read: () => assert.fail('No hosted key in Local mode') },
    docker: async args => {
      commands.push(args);
      if (args[0] === 'context') return 'unix:///var/run/docker.sock';
      if (args.includes('up')) online = true;
      return '';
    },
    checkConnection: async (_, key, options) => {
      assert.match(key, /^local_/);
      assert.equal(options.local, true);
      if (!online) throw Object.assign(new Error('Offline'), { code: 'network' });
      return { local: true, toolCount: 3 };
    } });
  const args = ['local', 'install', '--docker-dir', checkout, '--yes'];
  await assert.rejects(run(args, ctx), /--yes alone/);
  assert.deepEqual(commands, []);
  assert.equal(await run([...args, '--start-docker'], ctx), 0);
  assert.ok(commands.some(args => args.includes('--build')));
  const files = endpointFiles('http://127.0.0.1:8080/mcp', ctx);
  const profile = await readFile(files.localConfig, 'utf8');
  commands.length = 0;
  assert.equal(await run(['local', 'install'], ctx), 0);
  assert.equal(await run(['local', 'status'], ctx), 0);
  assert.equal(await run(['getcredit'], ctx), 0);
  assert.deepEqual(commands, [], 'A running local backend does not need Docker inspection or rebuild');
  assert.equal(await readFile(files.localConfig, 'utf8'), profile);
  online = false;
  ctx.docker = async args => {
    commands.push(args);
    if (args[0] === 'context') return 'unix:///var/run/docker.sock';
    if (args.includes('--images')) return 'installed-api\ninstalled-scene';
    if (args.includes('up')) online = true;
    return '';
  };
  assert.equal(await run(['local', 'install', '--start-docker', '--yes'], ctx), 0);
  assert.ok(commands.some(args => args.includes('up')));
  assert.ok(!commands.some(args => args.includes('--build')), 'Existing images are started without rebuilding');
  assert.match(ctx.logs.join('\n'), /no Machinal credits/);
  assert.ok(!ctx.logs.join('\n').includes(provider));
  await assert.rejects(run(['set-key'], ctx), /device token/);
});
