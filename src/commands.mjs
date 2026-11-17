import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { checkConnection, normalizeEndpoint } from './connection.mjs';
import { localCredentials } from './bridge.mjs';
import { compactCreditSummaryLines, creditSummaryLines } from './credits.mjs';
import { MACHINAL_SERVER_URL, DEFAULT_LOCAL_URL } from './endpoints.mjs';
import { InstallerError } from './errors.mjs';
import { readKey } from './keys.mjs';
import { prepareIndependentLocal } from './local-setup.mjs';
import { endpointFiles } from './runtime.mjs';
import { readSettings, saveSettings, settingsFile } from './settings.mjs';

export async function showCredits(values, context) {
  const settings = await readSettings(context);
  const endpoint = normalizeEndpoint(values.url ?? settings.connection?.url ?? MACHINAL_SERVER_URL);
  const local = !values.url && settings.connection?.mode === 'local';
  const key = local ? await localCredentials(settings.connection.localConfig, endpoint)
    : (await readKey({ ...context, interactive: false })).key;
  const result = await (context.checkConnection ?? checkConnection)(endpoint, key, { local });
  if (local && !result.local) throw new InstallerError('The saved endpoint is not the independent local backend. No hosted key was sent.');
  if (result.local) {
    context.log('Local mode: no Machinal credits. AI is billed by your provider.');
    return 0;
  }
  if (!result.credits) throw new InstallerError(result.creditsWarning ?? 'Live credits unavailable. No balance was assumed.');
  for (const line of (context.verbose ? creditSummaryLines : compactCreditSummaryLines)(result.credits)) context.log(line);
  return 0;
}

async function existingDirectory(value) {
  if (!isAbsolute(value)) throw new InstallerError('Use an absolute folder path. No directory was created or scanned.');
  try {
    const path = await realpath(value);
    if (!(await lstat(path)).isDirectory()) throw new Error();
    return path;
  } catch { throw new InstallerError('The selected folder does not exist or is not accessible. No files were read or transferred.'); }
}

export async function managePlace(values, context) {
  const patch = {};
  if (values.downloads !== undefined) patch.downloadDirectory = await existingDirectory(values.downloads);
  if (values.uploads !== undefined) patch.uploadDirectory = await existingDirectory(values.uploads);
  const settings = Object.keys(patch).length ? await saveSettings(patch, context) : await readSettings(context);
  const { connection } = settings;
  context.log('Machinal locations', 'heading');
  context.log(`CLI backend: ${connection ? `${connection.mode} · ${connection.url}` : 'not configured; run machinal setup'}`);
  context.log(`Uploads: named project volume${settings.uploadDirectory ? ` · source folder ${settings.uploadDirectory}` : ' · choose exact source files'}`);
  context.log(`Downloads: ${settings.downloadDirectory ?? 'ask each time (or use the server-saved preference)'}`);
  context.log(`Settings: ${settingsFile(context)}`);
  if (context.credentialStore?.description?.path) context.log(`Key: ${context.credentialStore.description.path} (plaintext, owner-only)`);
  if (connection?.localConfig) context.log(`Local profile: ${connection.localConfig}`);
  if (Object.keys(patch).length) context.log('Folders saved. No files uploaded or downloaded.');
  return 0;
}

export async function manageLocal(action, values, context) {
  const settings = await readSettings(context);
  const endpoint = normalizeEndpoint(values.url ?? (settings.connection?.mode === 'local' ? settings.connection.url : DEFAULT_LOCAL_URL));
  const { localConfig } = endpointFiles(endpoint, context);
  if (action === 'status') {
    let installed;
    try { installed = await lstat(localConfig); } catch (error) { if (error.code !== 'ENOENT') throw new InstallerError('The local profile is not accessible.'); }
    if (!installed) { context.log('Local backend: not installed. Run machinal local install --docker-dir PATH.'); return 1; }
    let key;
    try { key = await localCredentials(localConfig, endpoint); } catch {
      context.log('Local backend: profile invalid or unreadable. Check its ownership, permissions and device token; no file was changed.');
      return 1;
    }
    try {
      const result = await (context.checkConnection ?? checkConnection)(endpoint, key, { local: true });
      if (!result.local) throw new InstallerError('The endpoint is not an independent local backend.');
      context.log(`Local backend: ready · ${endpoint}`);
      return 0;
    } catch { context.log('Local backend: configured, not verified. Run machinal local install to start it; check Docker and the local device token.'); return 1; }
  }
  const profile = await prepareIndependentLocal(values, endpoint, localConfig, context);
  let result;
  const verify = () => (context.checkConnection ?? checkConnection)(endpoint, profile.key, { local: true });
  try { result = await verify(); } catch (error) {
    if (error.code !== 'network') throw error;
    await profile.start();
    result = await verify();
  }
  if (!result.local) throw new InstallerError('The endpoint is not the independent local backend. Connection settings were not changed.');
  await saveSettings({ connection: { mode: 'local', url: endpoint, localConfig } }, context);
  context.log(`Local backend: ready · ${endpoint}`);
  context.log('Next: machinal setup --mode local to connect your agent.');
  return 0;
}
