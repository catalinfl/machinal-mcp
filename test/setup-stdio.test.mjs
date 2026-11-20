import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { getStaticTOMLValue, parseTOML } from 'toml-eslint-parser';
import { run } from '../src/cli.mjs';
import { MACHINAL_SERVER_URL } from '../src/endpoints.mjs';
import { endpointFiles } from '../src/runtime.mjs';
import { API_KEY, mcpHandler, memoryCredentialStore, serve, workspace } from './helpers.mjs';

function context(cwd, extra = {}) {
  return { cwd, home: cwd, env: {}, interactive: false, credentialStore: null, log: () => {}, ...extra };
}

for (const client of ['opencode', 'claude', 'codex']) {
  test(`${client} Machinal Server setup needs only a saved key, not an API address`, async (t) => {
    const cwd = await workspace(t);
    const logs = [];
    const questions = [];
    const ctx = context(cwd, { interactive: true, env: { MACHINAL_API_ORIGIN: 'http://127.0.0.1:8080/mcp' },
      credentialStore: memoryCredentialStore(API_KEY), log: (message) => logs.push(message),
      ui: {
        select: async (question) => {
          questions.push(question);
          const choices = question.choices.map((choice) => choice.value);
          if (choices.includes('global')) return 'global';
          if (choices.includes('local')) return 'server';
          if (choices.includes('reuse')) return 'reuse';
          assert.fail(`Unexpected question: ${question.message}`);
        },
        input: async () => assert.fail('Machinal Server must never ask for a URL'),
        password: async () => assert.fail('The saved key must be reused'),
        confirm: async () => assert.fail('No replacement, key save or launch was requested'),
      },
      checkConnection: async (endpoint, key) => {
        assert.equal(endpoint, MACHINAL_SERVER_URL);
        assert.equal(key, API_KEY);
        return { toolCount: 40 };
      },
    });
    await run(['setup', '--client', client, '--no-skills', '--no-launch'], ctx);
    assert.ok(questions.some((question) => question.message === 'API location'));
    const scope = questions.find((question) => question.message === 'Available in');
    assert.equal(scope.choices.some((choice) => choice.name.includes('Codex discovery')), client === 'codex');
    const file = client === 'opencode' ? join(cwd, '.config/opencode/opencode.jsonc') : client === 'claude' ? join(cwd, '.claude.json') : join(cwd, '.codex/config.toml');
    const source = await readFile(file, 'utf8');
    assert.ok(source.includes(MACHINAL_SERVER_URL));
    assert.ok(!source.includes('http://127.0.0.1:8080'));
    assert.ok(logs.includes('Connection: Machinal Server'));
    assert.ok(!logs.join('\n').includes(API_KEY));
  });
}

for (const client of ['codex', 'claude', 'opencode']) {
  test(`${client} default setup installs a stable Node stdio runtime without a shell, plaintext API key or mandatory launch`, async (t) => {
    const cwd = await workspace(t);
    const endpoint = await serve(t, mcpHandler());
    const options = context(cwd, { env: { MACHINAL_API_KEY: API_KEY } });
    const args = ['setup', '--client', client, '--url', endpoint, '--no-skills', '--no-launch', '--yes'];
    assert.equal(await run(args, options), 0);
    const file = client === 'codex' ? join(cwd, '.codex/config.toml') : client === 'claude' ? join(cwd, '.mcp.json') : join(cwd, 'opencode.jsonc');
    const source = await readFile(file, 'utf8');
    assert.ok(!source.includes(API_KEY));
    const entry = client === 'codex' ? getStaticTOMLValue(parseTOML(source)).mcp_servers.machinal
      : client === 'claude' ? JSON.parse(source).mcpServers.machinal : JSON.parse(source).mcp.servers.machinal;
    const command = client === 'opencode' ? entry.command[0] : entry.command;
    const parameters = client === 'opencode' ? entry.command.slice(1) : entry.args;
    assert.equal(command, process.execPath);
    assert.match(parameters[0], /runtime.*machinal-stdio\.mjs$/);
    assert.match(await readFile(parameters[0], 'utf8'), /serveBridge/);
    assert.ok(parameters.includes(endpoint));
    if (client === 'codex') {
      assert.equal(entry.startup_timeout_sec, 30);
      assert.ok(entry.env_vars.includes('MACHINAL_API_KEY'));
    }
    const before = await readdir(dirname(file));
    assert.equal(await run(args, options), 0);
    assert.deepEqual(await readdir(dirname(file)), before);
  });
}

test('Codex defaults to global CODEX_HOME instead of an ignored untrusted project configuration', async (t) => {
  const cwd = await workspace(t);
  const home = await workspace(t);
  const codexHome = join(home, 'custom-codex');
  await run(['setup', '--client', 'codex', '--mode', 'server', '--url', 'https://api.example/mcp', '--defer-login', '--no-skills', '--yes'],
    context(cwd, { home, env: { CODEX_HOME: codexHome } }));
  assert.match(await readFile(join(codexHome, 'config.toml'), 'utf8'), /\[mcp_servers.machinal\]/);
  assert.deepEqual(await readdir(cwd), []);
});

test('missing authentication and a backend outage still install an adapter with honest diagnostic output', async (t) => {
  for (const mode of ['missing', 'offline']) {
    const cwd = await workspace(t);
    const logs = [];
    await run(['setup', '--client', 'claude', '--url', 'http://127.0.0.1:1/mcp', '--no-skills', '--yes'], context(cwd, {
      env: mode === 'offline' ? { MACHINAL_API_KEY: API_KEY } : {}, log: (message) => logs.push(message),
      checkConnection: async () => { throw Object.assign(new Error(API_KEY), { code: 'network' }); },
    }));
    assert.match(await readFile(join(cwd, '.mcp.json'), 'utf8'), /stdio/);
    assert.match(logs.join('\n'), mode === 'missing' ? /Login required/ : /Connection unavailable/);
    assert.doesNotMatch(logs.join('\n'), /Service verified/);
    assert.ok(!logs.join('\n').includes(API_KEY));
  }
});

test('saved credentials work for Codex/Claude without a separate keyed launcher', async (t) => {
  for (const client of ['codex', 'claude']) {
    const cwd = await workspace(t);
    const store = memoryCredentialStore(API_KEY);
    await run(['setup', '--client', client, '--url', 'https://api.example/mcp', '--no-skills', '--no-launch', '--yes'], context(cwd, {
      credentialStore: store, checkConnection: async (_url, key) => { assert.equal(key, API_KEY); return { toolCount: 10 }; },
      launch: () => assert.fail('No launcher required'),
    }));
    assert.equal(store.peek(), API_KEY);
  }
});

test('local provider provisioning needs explicit approval, never asks for a Machinal key and keeps secrets out of client config', async (t) => {
  const cwd = await workspace(t);
  const checkout = join(cwd, 'checkout');
  for (const file of ['api/Dockerfile', 'services/scene-renderer/Dockerfile', 'compose.editengine.yaml']) {
    await mkdir(dirname(join(checkout, file)), { recursive: true });
    await writeFile(join(checkout, file), '# fixture');
  }
  const logs = [];
  const commands = [];
  const provider = `sk-or-v1-${'a'.repeat(64)}`;
  const ctx = context(cwd, { env: { OPENROUTER_API_KEY: provider, OPENROUTER_MODEL: 'provider/model' }, log: (message) => logs.push(message),
    docker: async (args) => { commands.push(args); return args[0] === 'context' ? 'npipe:////./pipe/docker_engine' : ''; },
    checkConnection: async (_url, key, options) => { assert.match(key, /^local_/); assert.equal(options.local, true); return { toolCount: 10, local: true }; },
  });
  const files = endpointFiles('http://127.0.0.1:8080/mcp', ctx);
  const args = ['setup', '--client', 'claude', '--mode', 'local', '--docker-dir', checkout, '--no-skills', '--yes'];
  await assert.rejects(run(args, ctx), /--yes alone/);
  assert.deepEqual(commands, []);
  assert.equal(await run([...args, '--start-docker'], ctx), 0);
  const profile = await readFile(files.localConfig, 'utf8');
  assert.ok(profile.includes(provider));
  assert.doesNotMatch(profile, /POCKETBASE|MACHINAL_API_KEY|PB_SERVICE_TOKEN/);
  const compose = JSON.parse(await readFile(join(dirname(files.localConfig), 'compose.json'), 'utf8'));
  assert.deepEqual(compose.services.api.ports, ['127.0.0.1:8080:8080']);
  assert.equal(compose.services.api.env_file[0], files.localConfig);
  const config = await readFile(join(cwd, '.mcp.json'), 'utf8');
  assert.ok(!config.includes(provider) && !config.includes('local_'));
  assert.ok(commands.some((args) => args.includes('up')));
  assert.ok(!logs.join('\n').includes(provider));
  commands.length = 0;
  await run(args, ctx);
  assert.deepEqual(commands, [], 'A running independent API must not trigger Docker inspection');
});

test('server setup never accepts Docker flags or provider setup, and unknown transport is rejected', async (t) => {
  const cwd = await workspace(t);
  for (const flags of [['--start-docker'], ['--configure-local'], ['--transport', 'bogus']]) {
    await assert.rejects(run(['setup', '--client', 'claude', '--url', 'https://api.example/mcp', '--no-skills', '--yes', ...flags], context(cwd)));
  }
});

test('Google Antigravity (and agy alias) configures global ~/.gemini/config/mcp_config.json and global skills', async (t) => {
  const cwd = await workspace(t);
  const home = await workspace(t);
  const endpoint = await serve(t, mcpHandler());
  const args = ['setup', '--client', 'agy', '--url', endpoint, '--no-launch', '--yes'];
  assert.equal(await run(args, context(cwd, { home, env: { MACHINAL_API_KEY: API_KEY } })), 0);
  const file = join(home, '.gemini', 'config', 'mcp_config.json');
  const parsed = JSON.parse(await readFile(file, 'utf8'));
  const entry = parsed.mcpServers.machinal;
  assert.equal(entry.command, process.execPath);
  assert.match(entry.args[0], /runtime.*machinal-stdio\.mjs$/);
  assert.ok(entry.args.includes(endpoint));
  assert.equal(entry.type, undefined);
  assert.ok(!JSON.stringify(parsed).includes(API_KEY));
  assert.match(await readFile(join(home, '.gemini', 'config', 'skills', 'machinal-credits', 'SKILL.md'), 'utf8'), /get_credits/);
  assert.deepEqual(await readdir(cwd), []);
  const before = await readdir(dirname(file));
  assert.equal(await run(args, context(cwd, { home, env: { MACHINAL_API_KEY: API_KEY } })), 0);
  assert.deepEqual(await readdir(dirname(file)), before);
});
