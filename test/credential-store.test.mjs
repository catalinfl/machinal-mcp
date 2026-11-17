import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import test from 'node:test';
import { createCredentialStore } from '../src/credential-store.mjs';
import { InstallerError } from '../src/errors.mjs';
import { API_KEY, workspace } from './helpers.mjs';
import { chmod, mkdir, readFile, readdir, stat, symlink, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

test('the Windows adapter loads lazily and delegates read, overwrite and delete to the native API', async () => {
  let loads = 0;
  let saved = null;
  const calls = [];
  class AsyncEntry {
    constructor(service, account) { calls.push([service, account]); }
    async getPassword() { return saved; }
    async setPassword(value) { saved = value; }
    async deleteCredential() { const existed = saved !== null; saved = null; return existed; }
  }
  const store = createCredentialStore({ platform: 'win32', load: async () => { loads++; return { AsyncEntry }; } });
  assert.equal(loads, 0);
  assert.equal(await store.read(), null);
  await store.write(API_KEY);
  assert.equal(await store.read(), API_KEY);
  await store.write('replacement');
  assert.equal(await store.read(), 'replacement');
  assert.equal(await store.delete(), true);
  assert.equal(await store.delete(), false);
  assert.equal(loads, 1);
  assert.deepEqual(calls, [['Machinal/mcp', 'MACHINAL_API_KEY'], ['direction.al/mcp', 'DIRECTION_API_KEY']]);
});

test('saved legacy credentials are read as fallback and removed on explicit delete', async () => {
  const values = new Map([['direction.al/mcp|DIRECTION_API_KEY', API_KEY]]);
  class AsyncEntry {
    constructor(service, account) { this.key = `${service}|${account}`; }
    async getPassword() { return values.get(this.key) ?? null; }
    async setPassword(value) { values.set(this.key, value); }
    async deleteCredential() { return values.delete(this.key); }
  }
  const store = createCredentialStore({ platform: 'win32', load: async () => ({ AsyncEntry }) });
  assert.equal(await store.read(), API_KEY);
  await store.write(`mach_${'b'.repeat(64)}`);
  assert.equal(await store.read(), `mach_${'b'.repeat(64)}`);
  assert.equal(await store.delete(), true);
  assert.equal(values.has('direction.al/mcp|DIRECTION_API_KEY'), false);
});

test('legacy credential deletion failures are reported instead of claiming complete cleanup', async () => {
  class AsyncEntry {
    constructor(service) { this.service = service; }
    async deleteCredential() {
      if (this.service === 'direction.al/mcp') throw new Error(API_KEY);
      return true;
    }
  }
  const store = createCredentialStore({ platform: 'win32', load: async () => ({ AsyncEntry }) });
  await assert.rejects(store.delete(), error => /Could not delete/.test(error.message) && !error.message.includes(API_KEY));
});

test('unsupported platforms do not load a native module or fall back to plaintext storage', () => {
  assert.equal(createCredentialStore({ platform: 'darwin', load: () => assert.fail('Must not load') }), null);
});

test('Linux saves and detects one UTF-8 key outside the project, without a keyring dependency or backups', async t => {
  const home = await workspace(t);
  const options = { platform: 'linux', home, env: {}, load: () => assert.fail('Linux must not load keyring') };
  const store = createCredentialStore(options);
  assert.equal(await store.read(), null);
  await store.write(API_KEY);
  assert.equal(await createCredentialStore(options).read(), API_KEY);
  const file = join(home, '.config/machinal/credentials.json');
  assert.equal(store.description.path, file);
  assert.equal(JSON.parse(await readFile(file, 'utf8')).apiKey, API_KEY);
  await store.write(`mach_${'b'.repeat(64)}`);
  assert.equal(await store.read(), `mach_${'b'.repeat(64)}`);
  assert.deepEqual(await readdir(dirname(file)), ['credentials.json']);
  if (process.platform !== 'win32') {
    assert.equal((await stat(file)).mode & 0o777, 0o600);
    assert.equal((await stat(dirname(file))).mode & 0o777, 0o700);
  }
  assert.equal(await store.delete(), true);
  assert.equal(await store.delete(), false);
  assert.equal(await store.read(), null);
});

test('Linux uses absolute XDG_CONFIG_HOME consistently, including after a new process/store', async t => {
  const home = await workspace(t);
  const xdg = join(home, 'custom');
  const store = createCredentialStore({ platform: 'linux', home, env: { XDG_CONFIG_HOME: xdg } });
  await store.write(API_KEY);
  assert.equal(store.description.path, join(xdg, 'machinal/credentials.json'));
  assert.equal(await createCredentialStore({ platform: 'linux', env: { HOME: home, XDG_CONFIG_HOME: xdg } }).read(), API_KEY);
  assert.equal(createCredentialStore({ platform: 'linux', home, env: { XDG_CONFIG_HOME: 'relative' } }).description.path,
    join(home, '.config/machinal/credentials.json'));
});

test('malformed, oversized and directory credential files fail without printing secrets or deleting them', async t => {
  for (const content of [API_KEY, JSON.stringify({ version: 2, apiKey: API_KEY }), 'x'.repeat(65 * 1024), null]) {
    const home = await workspace(t);
    const store = createCredentialStore({ platform: 'linux', home, env: {} });
    const file = store.description.path;
    await mkdir(dirname(file), { recursive: true, mode: 0o700 });
    if (content === null) await mkdir(file);
    else await writeFile(file, content, { mode: 0o600 });
    await assert.rejects(store.read(), error => !error.message.includes(API_KEY));
    assert.ok(await stat(file));
  }
});

test('Linux rejects exposed credentials and linked files without reading or replacing targets', { skip: process.platform === 'win32' }, async t => {
  const home = await workspace(t);
  const store = createCredentialStore({ platform: 'linux', home, env: {} });
  await store.write(API_KEY);
  await chmod(store.description.path, 0o644);
  await assert.rejects(store.read(), /0600/);
  await assert.rejects(store.write('replacement'), /Could not save/);
  await chmod(store.description.path, 0o600);
  assert.equal(await store.read(), API_KEY);
  await store.delete();
  const target = join(home, 'target.json');
  await writeFile(target, JSON.stringify({ version: 1, apiKey: API_KEY }), { mode: 0o600 });
  await symlink(target, store.description.path);
  for (const action of ['read', 'write', 'delete']) await assert.rejects(store[action]('replacement'));
  assert.equal(JSON.parse(await readFile(target, 'utf8')).apiKey, API_KEY);
});

test('native module and credential access failures are sanitized, including deletion failures', async () => {
  for (const method of ['read', 'write', 'delete']) {
    const store = createCredentialStore({ platform: 'win32', load: async () => { throw new Error(API_KEY); } });
    await assert.rejects(store[method](API_KEY), (error) => error instanceof InstallerError && !error.message.includes(API_KEY));
  }
  const fail = async () => { throw new Error(API_KEY); };
  class AsyncEntry {
    getPassword = fail;
    setPassword = fail;
    deleteCredential = fail;
  }
  const store = createCredentialStore({ platform: 'win32', load: async () => ({ AsyncEntry }) });
  for (const method of ['read', 'write', 'delete']) {
    await assert.rejects(store[method](API_KEY), (error) => error instanceof InstallerError && !error.message.includes(API_KEY));
  }
});

test('real Windows Credential Manager round-trips, replaces and deletes an isolated fake credential', {
  skip: process.platform !== 'win32' || process.env.MACHINAL_TEST_CREDENTIAL_MANAGER !== '1',
}, async (t) => {
  const store = createCredentialStore({ service: `Machinal/mcp-test/${randomUUID()}` });
  t.after(() => store.delete());
  assert.equal(await store.read(), null);
  await store.write(API_KEY);
  assert.equal(await store.read(), API_KEY);
  const replacement = `mach_${'b'.repeat(64)}`;
  await store.write(replacement);
  assert.equal(await store.read(), replacement);
  assert.equal(await store.delete(), true);
  assert.equal(await store.read(), null);
  assert.equal(await store.delete(), false);
});
