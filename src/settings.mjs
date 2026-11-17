import { join } from 'node:path';
import { normalizeEndpoint } from './connection.mjs';
import { InstallerError } from './errors.mjs';
import { stateDirectory } from './paths.mjs';
import { readPrivateJSON, writePrivateJSON } from './private-json.mjs';

export function settingsFile(context) {
  return join(stateDirectory(context), 'config.json');
}

export async function readSettings(context) {
  const value = await readPrivateJSON(settingsFile(context));
  if (value === null) return { version: 1 };
  if (value.version !== 1 || (value.connection && (!['server', 'custom', 'local'].includes(value.connection.mode)
    || normalizeEndpoint(value.connection.url) !== value.connection.url))) {
    throw new InstallerError('The Machinal settings file is invalid. Check machinal place; existing settings were not replaced.');
  }
  return value;
}

export async function saveSettings(patch, context) {
  const current = await readSettings(context);
  const next = { ...current, ...patch, version: 1 };
  if (JSON.stringify(current) !== JSON.stringify(next)) await writePrivateJSON(settingsFile(context), next);
  return next;
}
