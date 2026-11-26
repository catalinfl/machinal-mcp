import { lstat, realpath } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { checkConnection, isLoopbackEndpoint, normalizeEndpoint } from './connection.mjs';
import { localCredentials } from './bridge.mjs';
import { compactCreditSummaryLines, creditSummaryLines } from './credits.mjs';
import { MACHINAL_SERVER_URL, DEFAULT_LOCAL_URL } from './endpoints.mjs';
import { InstallerError } from './errors.mjs';
import { readKey } from './keys.mjs';
import { inspectLocalOpenRouter, prepareIndependentLocal } from './local-setup.mjs';
import { MACHINAL_STUDIO_URL } from './presentation.mjs';
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
    if (!installed) { context.log(`Local backend: not installed. Clone ${MACHINAL_STUDIO_URL} and run machinal local install --docker-dir PATH.`); return 1; }
    let key;
    try { key = await localCredentials(localConfig, endpoint); } catch {
      context.log('Local backend: profile invalid or unreadable. Check its ownership, permissions and device token; no file was changed.');
      return 1;
    }
    try {
      const result = await (context.checkConnection ?? checkConnection)(endpoint, key, { local: true });
      if (!result.local) throw new InstallerError('The endpoint is not an independent local backend.');
    } catch { context.log('Local backend: configured, not verified. Run machinal local install to start it; check Docker and the local device token.'); return 1; }
    const openRouter = await inspectLocalOpenRouter({
      localConfig,
      endpoint,
      fetchImpl: context.fetchImpl,
      verifyOpenRouterKey: context.verifyOpenRouterKey,
      skipBackendProbe: Boolean(context.checkConnection && !context.fetchImpl),
    });
    if (!openRouter.ready) {
      context.log(`Local backend: MCP reachable at ${endpoint}, but OpenRouter is not ready (${openRouter.status}): ${openRouter.message}`);
      context.log('How to set your OpenRouter API key:');
      for (const step of openRouter.howToSet ?? []) context.log(`  - ${step}`);
      return 1;
    }
    context.log(`Local backend: ready · ${endpoint}`);
    return 0;
  }
  const profile = await prepareIndependentLocal(values, endpoint, localConfig, context);
  let result;
  const verify = () => (context.checkConnection ?? checkConnection)(endpoint, profile.key, { local: true });
  try { result = await verify(); } catch (error) {
    if (error.code !== 'network' || profile.started) throw error;
    await profile.start();
    result = await verify();
  }
  if (!result.local) throw new InstallerError('The endpoint is not the independent local backend. Connection settings were not changed.');
  await profile.syncOpenRouter?.();
  await saveSettings({ connection: { mode: 'local', url: endpoint, localConfig }, lastLocalUrl: endpoint }, context);
  context.log(`Local backend: ready · ${endpoint}`);
  context.log('Next: machinal setup --mode local to connect your agent.');
  return 0;
}

export async function manageMode(action, values, context) {
  const settings = await readSettings(context);
  const current = settings.activeModeOverride ?? settings.connection;
  const currentMode = current?.mode === 'local' ? 'local' : (current ? 'cloud' : 'unset');

  if (!action || action === 'status') {
    if (!current) {
      context.log('Active mode: not configured yet. Run `machinal mode local`, `machinal mode cloud`, or `machinal setup`.');
      return 0;
    }
    context.log(`Active mode: ${currentMode} · ${current.url}`);
    if (currentMode === 'local') {
      const localConfig = current.localConfig ?? endpointFiles(current.url, context, { local: true }).localConfig;
      const openRouter = await inspectLocalOpenRouter({
        localConfig,
        endpoint: current.url,
        fetchImpl: context.fetchImpl,
        verifyOpenRouterKey: context.verifyOpenRouterKey,
        skipBackendProbe: Boolean(context.checkConnection && !context.fetchImpl),
      });
      if (!openRouter.ready) {
        context.log(`OpenRouter status: NOT READY (${openRouter.status}) — ${openRouter.message}`);
        context.log('Set OpenRouter key: machinal key openrouter');
      } else {
        context.log(`OpenRouter status: ready (${openRouter.status})`);
      }
    } else {
      const hasEnvKey = Boolean(context.env?.MACHINAL_API_KEY || context.env?.DIRECTION_API_KEY);
      let hasSavedKey = false;
      try { hasSavedKey = Boolean(await context.credentialStore?.read()); } catch { /* Ignore vault errors in status display. */ }
      if (!hasEnvKey && !hasSavedKey) {
        context.log('Machinal API key: missing. Set it with: machinal key api <mach_...>');
      } else {
        context.log(`Machinal API key: ${hasEnvKey ? 'environment' : 'saved'}`);
      }
    }
    return 0;
  }

  const normalized = action === 'server' ? 'cloud' : action;
  if (!['local', 'cloud', 'toggle'].includes(normalized)) {
    throw new InstallerError('Use `machinal mode local`, `machinal mode cloud`, `machinal mode toggle`, or `machinal mode status`.');
  }
  const target = normalized === 'toggle' ? (currentMode === 'local' ? 'cloud' : 'local') : normalized;
  let endpoint;
  let connection;
  if (target === 'local') {
    endpoint = normalizeEndpoint(values.url ?? settings.lastLocalUrl ?? (current?.mode === 'local' ? current.url : null) ?? DEFAULT_LOCAL_URL);
    if (new URL(endpoint).protocol !== 'http:' || !isLoopbackEndpoint(endpoint)) {
      throw new InstallerError('Local mode requires a loopback HTTP endpoint (e.g. http://127.0.0.1:8080/mcp).');
    }
    const localConfig = (current?.mode === 'local' && current.url === endpoint && current.localConfig)
      ? current.localConfig
      : endpointFiles(endpoint, context, { local: true }).localConfig;
    connection = { mode: 'local', url: endpoint, localConfig };
  } else {
    endpoint = normalizeEndpoint(values.url ?? settings.lastCloudUrl ?? (current?.mode && current.mode !== 'local' ? current.url : null) ?? MACHINAL_SERVER_URL);
    connection = { mode: endpoint === MACHINAL_SERVER_URL ? 'server' : 'custom', url: endpoint };
  }

  await saveSettings({
    connection,
    activeModeOverride: connection,
    ...(target === 'local' ? { lastLocalUrl: endpoint } : { lastCloudUrl: endpoint }),
  }, context);

  context.log(`Switched active Machinal mode to ${target} · ${endpoint}`);
  if (target === 'local') {
    const openRouter = await inspectLocalOpenRouter({
      localConfig: connection.localConfig,
      endpoint,
      fetchImpl: context.fetchImpl,
      verifyOpenRouterKey: context.verifyOpenRouterKey,
      skipBackendProbe: Boolean(context.checkConnection && !context.fetchImpl),
    });
    if (!openRouter.ready) {
      context.log(`Warning: OpenRouter is not ready (${openRouter.status}) — ${openRouter.message}`);
      context.log('Set your OpenRouter key with: machinal key openrouter');
    } else {
      context.log(`OpenRouter status: ready (${openRouter.status})`);
    }
  } else {
    const hasEnvKey = Boolean(context.env?.MACHINAL_API_KEY || context.env?.DIRECTION_API_KEY);
    let hasSavedKey = false;
    try { hasSavedKey = Boolean(await context.credentialStore?.read()); } catch { /* Ignore vault errors during mode switch. */ }
    if (!hasEnvKey && !hasSavedKey) {
      context.log('Warning: No Machinal API key is configured yet. Set it with: machinal key api <mach_...>');
    }
  }
  context.log('Running MCP stdio adapters pick up this mode change automatically, or call MCP `switch_mode` directly in your client.');
  return 0;
}
