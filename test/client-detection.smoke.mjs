import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import crossSpawn from 'cross-spawn';
import { run } from '../src/cli.mjs';
import { workspace } from './helpers.mjs';

for (const client of ['codex', 'claude', 'antigravity']) {
  test(`installed ${client} CLI detects the generated stdio registration without running a model`, { timeout: 120_000 }, async (t) => {
    const cwd = await workspace(t);
    const env = { ...process.env, HOME: cwd, USERPROFILE: cwd, CODEX_HOME: join(cwd, '.codex'), XDG_CONFIG_HOME: join(cwd, '.config'),
      MACHINAL_API_KEY: 'invalid-test-key', DIRECTION_API_KEY: '' };
    const scope = client === 'codex' || client === 'antigravity' ? 'global' : 'project';
    await run(['setup', '--client', client, '--scope', scope, '--url', 'http://127.0.0.1:1/mcp', '--defer-login', '--no-skills', '--yes'],
      { cwd, home: cwd, env, credentialStore: null, log: () => {} });
    const command = client === 'antigravity' ? 'agy' : client;
    const commandArgs = client === 'antigravity' ? ['mcp', 'list'] : ['mcp', 'get', 'machinal'];
    const result = await new Promise((resolve, reject) => {
      const child = crossSpawn(command, commandArgs, { cwd, env, timeout: 20_000, stdio: ['ignore', 'pipe', 'pipe'] });
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (chunk) => { stdout += chunk; });
      child.stderr.on('data', (chunk) => { stderr += chunk; });
      child.once('error', (error) => error.code === 'ENOENT' ? resolve(null) : reject(error));
      child.once('close', (code) => resolve({ code, stdout, stderr }));
    });
    if (!result) { t.skip(`${command} CLI is not installed`); return; }
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /machinal/i);
    assert.match(result.stdout, /stdio|machinal-stdio/);
  });
}
