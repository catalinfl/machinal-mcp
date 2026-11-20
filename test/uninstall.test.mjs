import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { parse } from 'jsonc-parser';
import { getStaticTOMLValue, parseTOML } from 'toml-eslint-parser';
import { run } from '../src/cli.mjs';
import { configurationPath } from '../src/configuration.mjs';
import { readInstallations, recordInstallation } from '../src/installations.mjs';
import { stateDirectory } from '../src/paths.mjs';
import { skillsDirectory } from '../src/skills.mjs';
import { planSkills, saveSkills } from '../src/skills.mjs';
import { uninstallGlobalPackage } from '../src/uninstall-package.mjs';
import { API_KEY, memoryCredentialStore, workspace } from './helpers.mjs';

async function write(file, content) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  await writeFile(file, content, { mode: 0o600 });
}

async function context(t) {
  const root = await workspace(t);
  const logs = [];
  let packageRemovals = 0;
  return { cwd: join(root, 'project'), home: join(root, 'home'), env: {}, interactive: false,
    credentialStore: memoryCredentialStore(API_KEY), ui: {}, logs, log: line => logs.push(line),
    uninstallPackage: async () => { packageRemovals++; return true; }, packageRemovals: () => packageRemovals };
}

test('uninstall removes old 0.4.3 companions across global/project/ancestor configs without touching other integrations', async t => {
  const ctx = await context(t);
  const files = [
    join(ctx.home, '.config/opencode/opencode.jsonc'),
    join(dirname(ctx.cwd), 'opencode.jsonc'),
    join(ctx.cwd, 'opencode.jsonc'),
    join(ctx.cwd, '.opencode/opencode.jsonc'),
  ];
  const original = `// User comment\r\n${JSON.stringify({
    model: 'keep', plugins: ['other-plugin', '@machinal/mcp@0.4.3',
      { package: '@machinal/mcp@0.4.4', options: { servers: { team: 'https://team.example/mcp' } } }],
    mcp: { timeout: 120, servers: { machinal: { type: 'local', command: ['node', 'old.mjs'] },
      team: { type: 'remote', url: 'https://team.example/mcp' }, docs: { type: 'local', command: ['keep'] } } },
  }, null, 2)}\r\n`;
  for (const file of files) await write(file, original);
  await run(['uninstall', '--yes'], ctx);
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const config = parse(source);
    assert.ok(source.startsWith('// User comment\r\n'));
    assert.equal(config.model, 'keep');
    assert.deepEqual(config.plugins, ['other-plugin']);
    assert.deepEqual(config.mcp, { timeout: 120, servers: { docs: { type: 'local', command: ['keep'] } } });
    const backup = (await readdir(dirname(file))).find(name => name.startsWith(`${file.split(/[\\/]/).at(-1)}.machinal-backup-`));
    assert.equal(await readFile(join(dirname(file), backup), 'utf8'), original);
  }
  assert.deepEqual(ctx.credentialStore.calls, ['delete']);
  assert.equal(ctx.packageRemovals(), 1);
  assert.ok(!ctx.logs.join('\n').includes(API_KEY));
  await run(['uninstall', '--yes'], ctx);
  assert.equal(ctx.packageRemovals(), 2);
});

test('uninstall cleans recorded projects and custom names from every client, then permits clean setup', async t => {
  const ctx = await context(t);
  for (const client of ['opencode', 'claude', 'codex', 'antigravity']) {
    const scope = client === 'antigravity' ? 'global' : 'project';
    const options = { ...ctx, cwd: join(dirname(ctx.cwd), `other-${client}`), client, scope, name: 'video' };
    await recordInstallation(options);
    await recordInstallation(options);
    const file = await configurationPath(options);
    const own = client === 'antigravity' ? { url: 'https://api.machinal.app/mcp' } : { type: 'http', url: 'https://api.machinal.app/mcp' };
    await write(file, client === 'codex'
      ? '# Keep me\nmodel = "keep"\n[mcp_servers.video]\nurl = "https://api.machinal.app/mcp"\n[mcp_servers.video.headers]\nX = "own"\n[mcp_servers.docs]\ncommand = "keep"\n'
      : JSON.stringify(client === 'claude' || client === 'antigravity'
        ? { other: 'keep', mcpServers: { video: own, docs: { command: 'keep' } } }
        : { model: 'keep', plugins: ['@machinal/mcp@0.4.3', 'other'], mcp: { servers: { video: own, docs: { type: 'local', command: ['keep'] } } } }));
    await write(join(skillsDirectory(options), 'machinal-editing/SKILL.md'), 'Bundled file with user edits');
  }
  assert.equal((await readInstallations(ctx)).length, 4);
  await write(join(stateDirectory(ctx), 'runtime/0.4.3-old/bin/machinal-stdio.mjs'), 'old');
  await write(join(stateDirectory(ctx), 'catalogs/old.json'), '{}');
  await write(join(stateDirectory(ctx), 'local/device/providers.env'), 'private local fixture');
  await write(join(stateDirectory(ctx), 'config.json'), '{}');
  const media = join(ctx.cwd, 'my-video.mp4');
  await write(media, 'keep media');
  await run(['uninstall', '--yes'], ctx);
  assert.deepEqual(await readInstallations(ctx), []);
  await assert.rejects(readdir(stateDirectory(ctx)), { code: 'ENOENT' });
  assert.equal(await readFile(media, 'utf8'), 'keep media');
  for (const client of ['opencode', 'claude', 'codex', 'antigravity']) {
    const scope = client === 'antigravity' ? 'global' : 'project';
    const options = { ...ctx, cwd: join(dirname(ctx.cwd), `other-${client}`), client, scope };
    const source = await readFile(await configurationPath(options), 'utf8');
    const config = client === 'codex' ? getStaticTOMLValue(parseTOML(source)) : parse(source);
    const servers = client === 'codex' ? config.mcp_servers : client === 'claude' || client === 'antigravity' ? config.mcpServers : config.mcp.servers;
    assert.deepEqual(Object.keys(servers), ['docs']);
    await assert.rejects(readFile(join(skillsDirectory(options), 'machinal-editing/SKILL.md')), { code: 'ENOENT' });
  }
  await run(['setup', '--client', 'opencode', '--mode', 'server', '--scope', 'project', '--defer-login', '--no-skills', '--yes'], ctx);
  const fresh = parse(await readFile(join(ctx.cwd, 'opencode.jsonc'), 'utf8'));
  assert.equal(fresh.plugins.length, 1);
  assert.ok(!JSON.stringify(fresh).includes('0.4.3'));
  assert.equal((await readInstallations(ctx)).length, 1);
});

test('uninstall preserves user-only skill files, skill backups, media and unknown state files', async t => {
  const ctx = await context(t);
  const root = join(ctx.cwd, '.opencode/skills');
  const kept = ['other/SKILL.md', 'machinal-editing/my-notes.md', 'machinal-editing/SKILL.md.machinal-backup-user'];
  for (const file of kept) await write(join(root, file), 'keep');
  await write(join(root, 'machinal-editing/SKILL.md'), 'remove');
  await write(join(root, 'directional-editing/SKILL.md'), 'remove legacy');
  await write(join(stateDirectory(ctx), 'user-note.txt'), 'keep');
  await run(['uninstall', '--yes'], ctx);
  for (const file of kept) assert.equal(await readFile(join(root, file), 'utf8'), 'keep');
  await assert.rejects(readFile(join(root, 'machinal-editing/SKILL.md')), { code: 'ENOENT' });
  await assert.rejects(readFile(join(root, 'directional-editing/SKILL.md')), { code: 'ENOENT' });
  assert.equal(await readFile(join(stateDirectory(ctx), 'user-note.txt'), 'utf8'), 'keep');
});

test('uninstall confirmation, cancellation and invalid flags never delete files or access keys', async t => {
  const ctx = await context(t);
  const file = join(ctx.cwd, 'opencode.jsonc');
  const original = '{"plugins":["@machinal/mcp@0.4.3"]}';
  await write(file, original);
  await assert.rejects(run(['uninstall'], ctx), /explicitly confirm/);
  await run(['uninstall'], { ...ctx, interactive: true, ui: { confirm: async question => {
    assert.equal(question.default, false);
    return false;
  } } });
  for (const args of [['uninstall', '--client', 'opencode'], ['uninstall', API_KEY], ['uninstall', '--', '--yes']]) {
    await assert.rejects(run(args, ctx), error => !error.message.includes(API_KEY));
  }
  assert.equal(await readFile(file, 'utf8'), original);
  assert.deepEqual(ctx.credentialStore.calls, []);
  assert.equal(ctx.packageRemovals(), 0);
});

test('invalid and concurrently changed configuration is not replaced; npm removal is not attempted', async t => {
  const ctx = await context(t);
  const file = join(ctx.cwd, 'opencode.jsonc');
  await write(file, '{"plugins":[');
  await assert.rejects(run(['uninstall', '--yes'], ctx));
  assert.equal(await readFile(file, 'utf8'), '{"plugins":[');
  await write(file, '{"plugins":["@machinal/mcp@0.4.3"]}');
  await assert.rejects(run(['uninstall'], { ...ctx, interactive: true, ui: { confirm: async () => {
    await writeFile(file, '{"model":"user-change"}');
    return true;
  } } }), /changed/);
  assert.equal(await readFile(file, 'utf8'), '{"model":"user-change"}');
  assert.deepEqual(ctx.credentialStore.calls, []);
  assert.equal(ctx.packageRemovals(), 0);
});

test('symlinked state and skills cannot redirect cleanup to user data', async t => {
  for (const area of ['state', 'skills']) {
    const ctx = await context(t);
    const outside = join(dirname(ctx.cwd), 'outside');
    await write(join(outside, 'machinal-editing/SKILL.md'), 'keep');
    const target = area === 'state' ? stateDirectory(ctx) : join(ctx.cwd, '.opencode/skills');
    await mkdir(dirname(target), { recursive: true });
    await symlink(outside, target, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(run(['uninstall', '--yes'], ctx));
    assert.equal(await readFile(join(outside, 'machinal-editing/SKILL.md'), 'utf8'), 'keep');
    assert.equal(ctx.packageRemovals(), 0);
  }
});

test('credential deletion failure retains the CLI and registry for a retry without exposing secrets', async t => {
  const ctx = await context(t);
  await recordInstallation({ ...ctx, client: 'claude', scope: 'project', name: 'machinal' });
  await assert.rejects(run(['uninstall', '--yes'], { ...ctx, credentialStore: {
    delete: async () => { throw new Error(API_KEY); },
  } }), error => !error.message.includes(API_KEY) && /kept for recovery/.test(error.message));
  assert.equal((await readInstallations(ctx)).length, 1);
  assert.equal(ctx.packageRemovals(), 0);
});

test('recorded custom names are not removed from other clients or unrecorded projects', async t => {
  const ctx = await context(t);
  const options = { ...ctx, client: 'claude', scope: 'project', name: 'video' };
  await recordInstallation(options);
  await write(join(ctx.cwd, '.mcp.json'), '{"mcpServers":{"video":{"command":"remove"}}}');
  const other = join(ctx.cwd, 'opencode.jsonc');
  const original = '{"mcp":{"servers":{"video":{"type":"local","command":["keep"]}}},"plugins":["unrelated"]}';
  await write(other, original);
  await run(['uninstall', '--yes'], ctx);
  assert.equal(await readFile(other, 'utf8'), original);
  assert.deepEqual(JSON.parse(await readFile(join(ctx.cwd, '.mcp.json'), 'utf8')).mcpServers, {});
});

test('a custom server named servers cannot delete the containing OpenCode server map', async t => {
  const ctx = await context(t);
  await recordInstallation({ ...ctx, client: 'opencode', scope: 'project', name: 'servers' });
  const file = join(ctx.cwd, 'opencode.jsonc');
  await write(file, '{"mcp":{"timeout":120,"servers":{"servers":{"type":"local","command":["remove"]},"docs":{"type":"local","command":["keep"]}}}}');
  await run(['uninstall', '--yes'], ctx);
  assert.deepEqual(parse(await readFile(file, 'utf8')).mcp, { timeout: 120, servers: { docs: { type: 'local', command: ['keep'] } } });
});

test('a real installed skill bundle can be uninstalled and reinstalled without replacement flags', async t => {
  const ctx = await context(t);
  const options = { ...ctx, client: 'opencode', scope: 'project', name: 'machinal', style: 'auto' };
  await saveSkills(await planSkills(options));
  await recordInstallation(options);
  const args = ['setup', '--client', 'opencode', '--scope', 'project', '--mode', 'server', '--defer-login', '--no-launch', '--yes'];
  await run(['uninstall', '--yes'], ctx);
  await assert.rejects(readFile(join(skillsDirectory(options), 'machinal-support/SKILL.md')), { code: 'ENOENT' });
  await run(args, ctx);
  const fresh = await planSkills(options);
  assert.equal(fresh.conflict, false);
  assert.match(await readFile(join(skillsDirectory(options), 'machinal-support/SKILL.md'), 'utf8'), /machinal set-key/);
});

test('global CLI removal uses only npm global uninstall with lifecycle scripts disabled', async t => {
  const root = await workspace(t);
  const calls = [];
  const runNpm = async args => { calls.push(args); return root; };
  assert.equal(await uninstallGlobalPackage({}, { runNpm }), false);
  assert.deepEqual(calls, [['root', '--global']]);
  await write(join(root, '@machinal/mcp/package.json'), '{"name":"@machinal/mcp"}');
  assert.equal(await uninstallGlobalPackage({}, { runNpm }), true);
  assert.deepEqual(calls.at(-1), ['uninstall', '--global', '--ignore-scripts', '--no-audit', '--no-fund', '@machinal/mcp']);
  await assert.rejects(uninstallGlobalPackage({}, { runNpm: async () => '' }), /valid global package directory/);
});
