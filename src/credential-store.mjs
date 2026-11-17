import { InstallerError } from './errors.mjs';
import { join } from 'node:path';
import { stateDirectory } from './paths.mjs';
import { deletePrivateJSON, readPrivateJSON, writePrivateJSON } from './private-json.mjs';

export const WINDOWS_CREDENTIAL = Object.freeze({
  service: 'Machinal/mcp',
  account: 'MACHINAL_API_KEY',
  target: 'Machinal/mcp.MACHINAL_API_KEY',
});

const LEGACY_WINDOWS_CREDENTIAL = Object.freeze({
  service: 'direction.al/mcp',
  account: 'DIRECTION_API_KEY',
});

export function createCredentialStore({
  platform = process.platform,
  load = () => import('@napi-rs/keyring'),
  service = WINDOWS_CREDENTIAL.service,
  account = WINDOWS_CREDENTIAL.account,
  home,
  env = process.env,
} = {}) {
  if (platform === 'linux') {
    const path = join(stateDirectory({ home, env, platform }), 'credentials.json');
    return {
      description: { name: 'Private credentials file', backend: 'file', path, plaintext: true },
      async read() {
        const value = await readPrivateJSON(path);
        if (value === null) return null;
        if (value.version !== 1 || typeof value.apiKey !== 'string') {
          throw new InstallerError('The saved credentials file is invalid. Run machinal set-key to replace it; no key was deleted.');
        }
        return value.apiKey;
      },
      async write(key) { await writePrivateJSON(path, { version: 1, apiKey: key }); },
      async delete() { return deletePrivateJSON(path); },
    };
  }
  if (platform !== 'win32') return null;

  let modulePromise;
  let entry;
  let legacyEntry;
  const getModule = () => modulePromise ??= load();
  const getEntry = () => entry ??= getModule().then(({ AsyncEntry }) => new AsyncEntry(service, account));
  const canReadLegacy = service === WINDOWS_CREDENTIAL.service && account === WINDOWS_CREDENTIAL.account;
  const getLegacyEntry = () => legacyEntry ??= getModule().then(({ AsyncEntry }) => new AsyncEntry(
    LEGACY_WINDOWS_CREDENTIAL.service, LEGACY_WINDOWS_CREDENTIAL.account,
  ));

  return {
    description: { name: 'Windows Credential Manager', ...WINDOWS_CREDENTIAL },
    async read() {
      try {
        const current = await (await getEntry()).getPassword();
        if (current != null || !canReadLegacy) return current;
        return await (await getLegacyEntry()).getPassword();
      } catch {
        throw new InstallerError('Could not read Windows Credential Manager. Retry, or use --session-key to bypass saved credentials.');
      }
    },
    async write(key) {
      try {
        await (await getEntry()).setPassword(key);
      } catch {
        throw new InstallerError('Could not save the API key in Windows Credential Manager. No plaintext fallback is used.');
      }
    },
    async delete() {
      try {
        const deleted = await (await getEntry()).deleteCredential();
        if (canReadLegacy) {
          return Boolean(await (await getLegacyEntry()).deleteCredential()) || Boolean(deleted);
        }
        return Boolean(deleted);
      } catch {
        throw new InstallerError('Could not delete the API key from Windows Credential Manager. Retry or remove its Machinal/mcp entry manually.');
      }
    },
  };
}
