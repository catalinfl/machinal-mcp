import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import crossSpawn from 'cross-spawn';
import { VERSION } from '../src/version.mjs';
import { API_KEY, mcpHandler, serve, TOOLS, workspace } from './helpers.mjs';
import { createCredentialStore } from '../src/credential-store.mjs';
import { createHash } from 'node:crypto';

const commandTimeout = 360_000;

function command(name, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = crossSpawn(name, args, {
      cwd, env: { ...process.env, HOME: cwd, USERPROFILE: cwd, CODEX_HOME: join(cwd, '.codex'), XDG_CONFIG_HOME: join(cwd, '.config'), ...env }, stdio: ['ignore', 'pipe', 'pipe'], timeout: commandTimeout,
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (signal) return reject(new Error(`${name} ${args[0]} terminated by ${signal} (command timeout: ${commandTimeout / 1000}s)\n${stderr}`));
      resolve({ code, stdout, stderr });
    });
  });
}

test('the actual npm tarball installs through offline npx with all runtime knowledge files present', { timeout: 1_200_000 }, async (t) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const packDirectory = await workspace(t);
  t.diagnostic('Packing the allowlisted npm archive');
  const packed = await command('npm', ['pack', '--json', '--pack-destination', packDirectory], root);
  assert.equal(packed.code, 0, packed.stderr);
  const start = packed.stdout.search(/^\[/m);
  assert.ok(start >= 0, 'npm pack did not return a JSON manifest');
  const manifest = JSON.parse(packed.stdout.slice(start));
  const packedPackage = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.equal(packedPackage.bin.machinal, packedPackage.bin['machinal-mcp']);
  const extracted = await command('tar', ['-xf', join(packDirectory, manifest[0].filename), '-C', packDirectory], root);
  assert.equal(extracted.code, 0, extracted.stderr);
  const { installWorkflowStartup } = await import(pathToFileURL(join(packDirectory, 'package/src/opencode-workflow.mjs')).href);
  const { installRuntime } = await import(pathToFileURL(join(packDirectory, 'package/src/runtime.mjs')).href);
  const runtimeScript = await installRuntime({ home: packDirectory, env: {} });
  const installedBridge = await import(pathToFileURL(join(dirname(runtimeScript), '../src/bridge.mjs')).href);
  assert.equal(typeof installedBridge.serveBridge, 'function', 'stable runtime must contain every adapter dependency');
  const localBridge = new installedBridge.MCPBridge({
    url: 'http://127.0.0.1:1/mcp', env: {}, credentialStore: null,
    fetchImpl() { assert.fail('the installed library must not need a server'); },
  });
  const local = await localBridge.handle('tools/call', {
    name: 'get_library_reference', arguments: { topic: 'hyperframes-components', id: 'blocks-aurora' },
  });
  assert.equal(local.structuredContent.statusCode, 200);
  assert.match(local.structuredContent.data.entries[0].component, /createHyperframeShader/);
  const pinned = JSON.parse(await readFile(join(packDirectory, 'package/library/manifest.json'), 'utf8'));
  const packedFiles = new Set(manifest[0].files.map(file => file.path));
  const missing = Object.entries(pinned.files).filter(([name, entry]) => !packedFiles.has(`library/${entry.storagePath ?? name}`)).map(([name]) => name);
  assert.deepEqual(missing, [], 'Pinned library files absent from npm archive');
  const hooks = new Map();
  const tools = new Map();
  const productionIds = ['machinal-editing', 'machinal-recipes', 'machinal-scenes', 'machinal-cinema', 'machinal-review', 'machinal-credits'];
  await installWorkflowStartup({
    skill: { list: async () => ({ location: { directory: packDirectory }, data: productionIds.map(id => ({ id, content: `${id} instructions` })) }) },
    permission: { assert: async () => {} },
    tool: { transform: async callback => callback({ add: tool => tools.set(tool.name, tool) }) },
    session: { hook: async (name, callback) => hooks.set(name, callback) },
  });
  assert.equal(JSON.parse((await tools.get('machinal_prepare_video').execute({ purpose: 'create' }, { sessionID: 'ses_pack' })).content).status, 'ready');
  const context = { sessionID: 'ses_pack', system: [] };
  await hooks.get('context')(context);
  assert.ok(context.system.some(part => part.text.includes('machinal-cinema instructions')));
  for (const file of manifest[0].files) {
    assert.ok(!file.path.startsWith('library/runtime/'), 'Renderer dependencies must stay on the backend');
    const original = file.path.match(/^(?:library\/|skills\/machinal-hyperframes\/references\/)(hyperframes-library\/\.agents\/.+)$/)?.[1];
    if (original && pinned.files[original]) {
      const bytes = await readFile(join(packDirectory, 'package', file.path));
      assert.equal(createHash('sha256').update(bytes).digest('hex'), pinned.files[original].sha256);
      continue;
    }
    assert.doesNotMatch(file.path, /(?:^|\/)(?:\.agents|\.codex|\.opencode|node_modules|test)(?:\/|$)|^(?:examples|documentaries)\/|opencode\.json|\.env|\.(?:tgz|mp4|mp3|wav)$/);
  }
  const cwd = await workspace(t);
  const calls = [];
  const endpoint = await serve(t, mcpHandler(calls, { tools: [...TOOLS, { name: 'get_editing_reference', annotations: { readOnlyHint: true } }] }));
  t.diagnostic('Installing the real archive with offline npx against the isolated mock API');
  const result = await command('npx', [
    '--offline', '--yes', '--package', join(packDirectory, `machinal-mcp-${VERSION}.tgz`), 'machinal-mcp',
    'setup', '--client', 'codex', '--scope', 'project', '--url', endpoint, '--style', 'retro', '--yes', '--no-launch',
  ], cwd, { MACHINAL_API_KEY: API_KEY, MACHINAL_API_ORIGIN: '' });
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /API credits: 900 available/);
  assert.ok(!`${result.stdout}${result.stderr}`.includes(API_KEY));
  const skills = join(cwd, '.agents', 'skills');
  assert.match(await readFile(join(skills, 'machinal-editing/references/preferences.md'), 'utf8'), /\*\*retro\*\*/);
  const brief = await readFile(join(skills, 'machinal-editing/references/brief.md'), 'utf8');
  assert.match(brief, /output resolution/);
  assert.match(brief, /Do not automatically add production labels/);
  assert.match(await readFile(join(skills, 'machinal-scenes/SKILL.md'), 'utf8'), /scene.generate/);
  assert.match(await readFile(join(skills, 'machinal-scenes/references/workflow.md'), 'utf8'), /animated Svelte components/);
  assert.match(await readFile(join(skills, 'machinal-cinema/SKILL.md'), 'utf8'), /film-styles/);
  const filmStyles = JSON.parse(await readFile(join(skills, 'machinal-cinema/references/film-styles.json'), 'utf8'));
  assert.equal(filmStyles.length, 66);
  assert.match(await readFile(join(skills, 'machinal-cinema/references/film-library/LICENSE'), 'utf8'), /Copyright \(c\) 2026 LemoLab/);
  assert.match(await readFile(join(skills, 'machinal-cinema/references/film-library/core/lib.js'), 'utf8'), /function monotone/);
  assert.match(await readFile(join(skills, 'machinal-scenes/references/scene-templates/paper-stage-3d.svelte'), 'utf8'), /SceneThree/);
  for (const id of ['machinal-motion', 'machinal-choreography', 'machinal-spatial', 'machinal-visual-review', 'machinal-sound']) {
    assert.match(await readFile(join(skills, id, 'SKILL.md'), 'utf8'), new RegExp(`name: ${id}\\n`));
  }
  for (const id of ['comparison-wipe', 'route-journey', 'piston-cycle']) {
    assert.match(await readFile(join(skills, 'machinal-scenes/references/scene-templates', `${id}.svelte`), 'utf8'), /useScene/);
  }
  assert.match(await readFile(join(skills, 'machinal-media/SKILL.md'), 'utf8'), /get_video_result/);
  assert.match(await readFile(join(skills, 'machinal-media/references/workflow.md'), 'utf8'), /S3_INTERNAL_ENDPOINT/);
  assert.match(await readFile(join(skills, 'machinal-support/SKILL.md'), 'utf8'), /Machinal\/mcp\.MACHINAL_API_KEY/);
  assert.match(await readFile(join(skills, 'machinal-review/SKILL.md'), 'utf8'), /Before code/);
  assert.match(await readFile(join(skills, 'machinal-review/references/production.md'), 'utf8'), /editorialReview/);
  assert.match(await readFile(join(skills, 'machinal-recipes/references/examples/scene-generation.yaml'), 'utf8'), /type: scene.generate/);
  const sceneInsert = await readFile(join(skills, 'machinal-recipes/references/examples/scene-image-insert.yaml'), 'utf8');
  assert.match(sceneInsert, /type: scene.generate/);
  assert.match(sceneInsert, /file: supplied-product.png/);
  assert.match(sceneInsert, /start: 4s/);
  const catalog = JSON.parse(await readFile(join(skills, 'machinal-recipes/references/catalog.v1.json'), 'utf8'));
  assert.ok(catalog.effects.some((effect) => effect.id === 'film-grain' && effect.parameters.length > 0));
  assert.ok(calls.every((call) => call.method !== 'tools/call' || call.tool === 'get_credits'));
  t.diagnostic('Checking the machinal binary alias and default npx command');
  const shortCLI = await command('npx', ['--offline', '--yes', '--package', join(packDirectory, manifest[0].filename), 'machinal', '--help'], cwd);
  assert.equal(shortCLI.code, 0, shortCLI.stderr);
  assert.match(shortCLI.stdout, /set-key/);
  assert.match(shortCLI.stdout, /getcredit/);
  assert.match(shortCLI.stdout, /local install/);
  // A bare existing .tgz path is treated as an executable by npm, not as a package.
  const defaultBin = await command('npx', ['--offline', '--yes', `file:${join(packDirectory, manifest[0].filename)}`, 'place'], cwd);
  assert.equal(defaultBin.code, 0, defaultBin.stderr);
  assert.match(defaultBin.stdout, /CLI backend:/, JSON.stringify(defaultBin));
  if (process.platform === 'linux') {
    await createCredentialStore({ home: cwd, env: {} }).write(API_KEY);
    const credit = await command('npx', ['--offline', '--yes', '--package', join(packDirectory, manifest[0].filename), 'machinal', 'getcredit'], cwd,
      { MACHINAL_API_KEY: '', DIRECTION_API_KEY: '' });
    assert.equal(credit.code, 0, credit.stderr);
    assert.match(credit.stdout, /API credits: 900 available/);
    assert.ok(!`${credit.stdout}${credit.stderr}`.includes(API_KEY));
  }
  t.diagnostic('Checking global machinal install → clean uninstall → reinstall in an isolated npm prefix');
  const lifecycle = await workspace(t);
  const prefix = join(lifecycle, 'npm-global');
  const archive = join(packDirectory, manifest[0].filename);
  const lifecycleEnv = { npm_config_prefix: prefix, MACHINAL_API_KEY: '', DIRECTION_API_KEY: '' };
  const install = () => command('npm', ['install', '--offline', '--global', '--prefix', prefix,
    '--ignore-scripts', '--no-audit', '--no-fund', archive], lifecycle, lifecycleEnv);
  const installed = await install();
  assert.equal(installed.code, 0, installed.stderr);
  t.diagnostic('Isolated global install completed; configuring without login');
  const binary = join(prefix, process.platform === 'win32' ? 'machinal.cmd' : 'bin/machinal');
  const setupArgs = ['setup', '--client', 'opencode', '--scope', 'project', '--mode', 'server',
    '--defer-login', '--no-skills', '--no-launch', '--yes'];
  const firstSetup = await command(binary, setupArgs, lifecycle, lifecycleEnv);
  assert.equal(firstSetup.code, 0, firstSetup.stderr);
  t.diagnostic('Isolated setup completed; cleaning integrations and global npm CLI');
  const globalRoot = process.platform === 'win32' ? join(prefix, 'node_modules') : join(prefix, 'lib/node_modules');
  const installedCLI = join(globalRoot, '@machinal/mcp/src/cli.mjs');
  // Never access the real Windows vault, even while testing a full npm uninstall.
  const cleanup = await command(process.execPath, ['--input-type=module', '-e',
    `import { run } from ${JSON.stringify(pathToFileURL(installedCLI).href)}; await run(['uninstall','--yes'], { credentialStore: null });`],
  lifecycle, lifecycleEnv);
  assert.equal(cleanup.code, 0, cleanup.stderr);
  t.diagnostic('Isolated cleanup completed; checking the same archive reinstalls cleanly');
  assert.match(cleanup.stdout, /Global npm CLI removed/);
  await assert.rejects(readFile(installedCLI), { code: 'ENOENT' });
  await assert.rejects(readFile(binary), { code: 'ENOENT' });
  const cleaned = JSON.parse(await readFile(join(lifecycle, 'opencode.jsonc'), 'utf8'));
  assert.deepEqual(cleaned.plugins ?? [], []);
  assert.deepEqual(cleaned.mcp.servers, {});
  const reinstalled = await install();
  assert.equal(reinstalled.code, 0, reinstalled.stderr);
  const secondSetup = await command(binary, setupArgs, lifecycle, lifecycleEnv);
  assert.equal(secondSetup.code, 0, secondSetup.stderr);
  assert.match(secondSetup.stdout, /Setup ready/);
  if (process.platform !== 'win32') return;
  t.diagnostic('Checking pinned companion/runtime upgrades in isolated OpenCode configs');
  const opencode = await workspace(t);
  const oldCommand = [process.execPath, join(opencode, '.config/machinal/runtime/0.4.2-win32-x64-aaaaaaaaaaaaaaaa/bin/machinal-stdio.mjs'), 'serve', '--url', endpoint];
  const config = { model: 'keep', plugins: [{ package: '@machinal/mcp@0.4.2', options: { servers: { machinal: endpoint }, commands: { machinal: oldCommand }, toolRouting: { enabled: false } } }],
    mcp: { servers: { machinal: { type: 'local', command: oldCommand } } } };
  const globalDirectory = join(opencode, '.config/opencode');
  await mkdir(globalDirectory, { recursive: true });
  for (const file of [join(globalDirectory, 'opencode.jsonc'), join(opencode, 'opencode.jsonc')]) await writeFile(file, JSON.stringify(config));
  const upgraded = await command('npx', ['--offline', '--yes', '--package', join(packDirectory, `machinal-mcp-${VERSION}.tgz`), 'machinal-mcp',
    'setup', '--client', 'opencode', '--scope', 'project', '--url', endpoint, '--no-skills', '--no-launch', '--yes', '--replace'], opencode,
  { MACHINAL_API_KEY: API_KEY, MACHINAL_API_ORIGIN: '' });
  assert.equal(upgraded.code, 0, upgraded.stderr);
  for (const file of [join(globalDirectory, 'opencode.jsonc'), join(opencode, 'opencode.jsonc')]) {
    const updated = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(updated.plugins[0].package, `@machinal/mcp@${VERSION}`);
    assert.deepEqual(updated.plugins[0].options.commands.machinal, updated.mcp.servers.machinal.command);
    assert.equal(updated.model, 'keep');
    assert.deepEqual(updated.plugins[0].options.toolRouting, { enabled: false });
    assert.ok(updated.mcp.servers.machinal.command[1].includes(`${VERSION}-${process.platform}-${process.arch}-`));
  }
});
