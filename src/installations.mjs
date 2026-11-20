import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';
import { stateDirectory } from './paths.mjs';
import { readPrivateJSON, writePrivateJSON } from './private-json.mjs';
import { InstallerError } from './errors.mjs';

const CLIENTS = ['opencode', 'claude', 'codex', 'antigravity'];
const ROOT_VARIABLES = ['XDG_CONFIG_HOME', 'CODEX_HOME', 'CLAUDE_CONFIG_DIR'];

export function installationsFile(context) {
  return join(stateDirectory(context), 'installations.json');
}

export async function readInstallations(context) {
  const value = await readPrivateJSON(installationsFile(context));
  if (value === null) return [];
  if (value.version !== 1 || !Array.isArray(value.installations) || value.installations.some(entry =>
    !entry || typeof entry !== 'object' || !CLIENTS.includes(entry.client) || !['global', 'project'].includes(entry.scope)
    || !isAbsolute(entry.cwd ?? '') || !/^[a-z\d][a-z\d_-]{0,63}$/i.test(entry.name ?? '')
    || !entry.env || typeof entry.env !== 'object' || Array.isArray(entry.env)
    || Object.entries(entry.env).some(([key, path]) => !ROOT_VARIABLES.includes(key) || typeof path !== 'string' || !isAbsolute(path)))) {
    throw new InstallerError('The Machinal installation registry is invalid. No installation paths were followed; inspect installations.json before uninstalling.');
  }
  return value.installations;
}

export async function recordInstallation(options) {
  const { client, scope, name, env = process.env } = options;
  const cwd = resolve(options.cwd ?? options.home ?? homedir());
  const roots = Object.fromEntries(ROOT_VARIABLES.filter(key => env[key] && isAbsolute(env[key])).map(key => [key, env[key]]));
  const entry = { client, scope, cwd, name, env: roots };
  const installations = await readInstallations(options);
  if (installations.some(previous => JSON.stringify(previous) === JSON.stringify(entry))) return;
  await writePrivateJSON(installationsFile(options), { version: 1, installations: [...installations, entry] });
}
