import assert from 'node:assert/strict';
import { lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import crossSpawn from 'cross-spawn';
import { uninstallGlobalPackage } from '../src/uninstall-package.mjs';
import { workspace } from './helpers.mjs';

function npm(args, context) {
  return new Promise((resolve, reject) => {
    const child = crossSpawn('npm', args, {
      cwd: context.cwd, env: context.env, stdio: ['ignore', 'pipe', 'pipe'], timeout: 30_000,
    });
    let output = '';
    child.stdout.on('data', chunk => { output += chunk; });
    child.stderr.on('data', chunk => { output += chunk; });
    child.once('error', reject);
    child.once('close', code => code === 0 ? resolve(output.trim()) : reject(new Error(`Isolated npm fixture failed: ${output}`)));
  });
}

test('real npm cleanup removes only the isolated global Machinal package and both binary shims', { timeout: 60_000 }, async t => {
  const cwd = await workspace(t);
  const prefix = join(cwd, 'prefix');
  await mkdir(prefix);
  const fixtures = [];
  for (const name of ['mcp', 'unrelated']) {
    const directory = join(cwd, name);
    await mkdir(directory);
    await writeFile(join(directory, 'package.json'), JSON.stringify({
      name: `@machinal/${name}`, version: '0.0.0', ...(name === 'mcp' ? { bin: { machinal: 'cli.cjs', 'machinal-mcp': 'cli.cjs' } } : {}),
    }));
    await writeFile(join(directory, 'cli.cjs'), '#!/usr/bin/env node\nconsole.log("isolated fixture");\n');
    fixtures.push(directory);
  }
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.toLowerCase().startsWith('npm_config_')));
  const context = { cwd, env: { ...env, npm_config_prefix: prefix, npm_config_cache: join(cwd, 'cache'), HOME: cwd, USERPROFILE: cwd, XDG_CONFIG_HOME: join(cwd, '.config') } };
  const installOutput = await npm(['install', '--offline', '--global', '--prefix', prefix, '--ignore-scripts', '--no-audit', '--no-fund', ...fixtures], context);
  const root = await npm(['root', '--global'], context);
  assert.ok(await lstat(join(root, '@machinal/mcp')).catch(() => null), `npm did not install fixture under ${root}: ${installOutput}; prefix contents: ${(await readdir(prefix, { recursive: true })).join(', ')}`);
  assert.equal(await uninstallGlobalPackage(context), true);
  await assert.rejects(lstat(join(root, '@machinal/mcp')), { code: 'ENOENT' });
  for (const name of ['machinal', 'machinal-mcp']) {
    const binary = process.platform === 'win32' ? join(prefix, `${name}.cmd`) : join(prefix, 'bin', name);
    await assert.rejects(lstat(binary), { code: 'ENOENT' });
  }
  assert.equal(JSON.parse(await readFile(join(root, '@machinal/unrelated/package.json'), 'utf8')).name, '@machinal/unrelated');
  assert.equal(await uninstallGlobalPackage(context), false);
});
