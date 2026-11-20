import { applyEdits, modify, parse } from 'jsonc-parser';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { configurationPath, planTextFile, saveConfiguration } from './configuration.mjs';
import { removeJSONServers, removeTOMLServers } from './formats.mjs';
import { isMachinalPlugin } from './opencode-configuration.mjs';
import { isManagedRuntimeCommand, stateDirectory } from './runtime.mjs';
import { SKILL_FILES, skillsDirectory } from './skills.mjs';
import { readInstallations } from './installations.mjs';
import { inspectRemoval, removeDirectory, removeEmptyDirectory, removeFile } from './uninstall-files.mjs';
import { uninstallGlobalPackage } from './uninstall-package.mjs';
import { InstallerError } from './errors.mjs';

const CLIENTS = ['opencode', 'claude', 'codex', 'antigravity'];
const STATE_FILES = ['config.json', 'credentials.json', 'installations.json'];
const STATE_DIRECTORIES = ['runtime', 'catalogs', 'local'];
const BUNDLED_FILES = [...new Set([...SKILL_FILES, 'machinal-editing/references/preferences.md'])];

async function installationTargets(context) {
  const recorded = await readInstallations(context);
  const targets = recorded.map(entry => ({ ...context, ...entry, env: { ...context.env,
    XDG_CONFIG_HOME: undefined, CODEX_HOME: undefined, CLAUDE_CONFIG_DIR: undefined, ...entry.env } }));
  const roots = [{ ...context }, ...targets];
  for (const root of roots) {
    for (const client of CLIENTS) {
      targets.push({ ...root, client, scope: 'global', name: undefined });
      if (client === 'antigravity') continue;
      for (let cwd = resolve(root.cwd); ; cwd = dirname(cwd)) {
        targets.push({ ...root, client, scope: 'project', cwd, name: undefined });
        if (dirname(cwd) === cwd) break;
      }
    }
  }
  return [...new Map(targets.map(entry => [JSON.stringify([entry.client, entry.scope, entry.cwd, entry.name,
    entry.env.XDG_CONFIG_HOME, entry.env.CODEX_HOME, entry.env.CLAUDE_CONFIG_DIR]), entry])).values()];
}

function removeConfiguration(content, options) {
  if (!content.trim()) return content;
  const config = options.client === 'opencode' ? parse(content) : {};
  const registrations = Object.create(null);
  const commands = Object.create(null);
  for (const key of ['plugins', 'plugin']) {
    if (config[key] !== undefined && !Array.isArray(config[key])) throw new InstallerError('OpenCode plugins must be an array. No configuration was changed.');
  }
  for (const entry of [...(config.plugins ?? []), ...(config.plugin ?? [])]) {
    if (isMachinalPlugin(entry)) {
      Object.assign(registrations, entry.options?.servers);
      Object.assign(commands, entry.options?.commands);
    }
  }
  const owns = (name, entry) => ['machinal', 'directional', options.name].includes(name)
    || (Object.hasOwn(registrations, name) && registrations[name] === entry.url)
    || (Array.isArray(commands[name]) && isDeepStrictEqual(commands[name], entry.command))
    || isManagedRuntimeCommand(Array.isArray(entry.command) ? entry.command : [entry.command, ...(entry.args ?? [])], options);
  if (options.client === 'codex') return removeTOMLServers(content, owns);
  let updated = removeJSONServers(content, options.client, owns);
  if (options.client !== 'opencode') return updated;
  for (const key of ['plugins', 'plugin']) {
    const entries = parse(updated)[key];
    if (!Array.isArray(entries)) continue;
    const kept = entries.filter(entry => !isMachinalPlugin(entry));
    if (kept.length !== entries.length) updated = applyEdits(updated, modify(updated, [key], kept, {
      formattingOptions: { insertSpaces: true, tabSize: 2, eol: content.includes('\r\n') ? '\r\n' : '\n' },
    }));
  }
  return updated;
}

async function planUninstall(context) {
  const targets = await installationTargets(context);
  const configurations = new Map();
  const checks = new Map();
  const skillRoots = new Set();
  const stateRoots = new Set([stateDirectory(context)]);
  for (const options of targets) {
    const file = await configurationPath(options);
    const files = options.client === 'opencode' && options.scope === 'project'
      ? [file, ...['opencode.json', 'opencode.jsonc'].map(name => join(options.cwd, name))]
      : [file];
    for (const candidate of files) {
      await inspectRemoval(candidate, checks);
      const plan = configurations.get(candidate) ?? await planTextFile(candidate, '');
      if (plan.original === null) continue;
      const content = removeConfiguration(plan.content || plan.original, options);
      configurations.set(candidate, { ...plan, content });
    }
    skillRoots.add(skillsDirectory(options));
    stateRoots.add(stateDirectory(options));
  }
  const skills = new Set();
  for (const root of skillRoots) {
    if (!await inspectRemoval(root, checks)) continue;
    for (const relative of BUNDLED_FILES) {
      for (const name of [relative, relative.replace(/^machinal-/, 'directional-')]) {
        const file = join(root, name);
        const info = await inspectRemoval(file, checks);
        if (info && !info.isFile()) throw new InstallerError(`Expected a bundled skill file: ${file}. It was preserved.`);
        if (info) skills.add(file);
      }
    }
  }
  for (const root of stateRoots) {
    for (const name of [...STATE_FILES, ...STATE_DIRECTORIES]) await inspectRemoval(join(root, name), checks);
  }
  return { configurations: [...configurations.values()].filter(plan => plan.original !== plan.content), skills: [...skills], skillRoots, stateRoots };
}

async function removeSkills(files, roots) {
  const directories = new Set();
  for (const file of files) {
    await removeFile(file);
    for (let path = dirname(file); !roots.has(path); path = dirname(path)) {
      directories.add(path);
    }
  }
  for (const directory of [...directories].sort((left, right) => right.length - left.length)) await removeEmptyDirectory(directory);
  for (const root of roots) await removeEmptyDirectory(root);
}

export async function uninstall(values, context) {
  if (!values.yes && !context.interactive) throw new InstallerError('Run machinal uninstall interactively, or use machinal uninstall --yes to explicitly confirm cleanup.');
  const options = { ...context, home: context.home ?? homedir() };
  const plan = await planUninstall(options);
  context.log(`Will clean ${plan.configurations.length} client configurations, ${plan.skills.length} bundled skill files, saved keys, private runtimes and settings.`);
  context.log('Projects, media, Docker volumes, other plugins and unrelated files are preserved. Bundled skill edits are removed; configuration backups are retained.');
  if (!values.yes && !await context.ui.confirm({
    message: 'Uninstall Machinal integrations, bundled skills (including edits), saved keys and the global npm CLI?', default: false,
  })) {
    context.log('Uninstall cancelled. Nothing was changed.');
    return 0;
  }
  try {
    for (const current of plan.configurations) {
      if ((await planTextFile(current.file, '')).original !== current.original) throw new InstallerError('A client configuration changed. Rerun machinal uninstall; no settings were overwritten.');
    }
    for (const current of plan.configurations) {
      const saved = await saveConfiguration(current);
      if (saved.backup) context.log(`Backup: ${saved.backup}`);
    }
    await removeSkills(plan.skills, plan.skillRoots);
    // Delete through the native store without ever reading the secret.
    await context.credentialStore?.delete();
    for (const root of plan.stateRoots) {
      for (const name of STATE_DIRECTORIES) await removeDirectory(join(root, name));
      for (const name of STATE_FILES.filter(name => name !== 'installations.json')) await removeFile(join(root, name));
    }
    // Keep discovery evidence until every integration/runtime cleanup has succeeded.
    for (const root of plan.stateRoots) {
      await removeFile(join(root, 'installations.json'));
      await removeEmptyDirectory(root);
    }
  } catch (error) {
    if (error instanceof InstallerError) throw error;
    throw new InstallerError('Machinal cleanup could not finish. Some files may already be removed; close clients holding files open, check permissions, and rerun machinal uninstall. The npm CLI was kept for recovery.');
  }
  const removed = await (context.uninstallPackage ?? uninstallGlobalPackage)(options);
  context.log(`Machinal integrations removed.${removed ? ' Global npm CLI removed.' : ' No global npm CLI was installed.'}`);
  context.log('Saved keys were deleted, not revoked. Running clients/environment variables and local Docker services were not changed. OpenCode reloads configuration automatically; use /reload if its old failure badge remains.');
  return 0;
}
