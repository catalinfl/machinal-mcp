import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { InstallerError } from './errors.mjs';
import { isLoopbackEndpoint } from './connection.mjs';
import { findCheckout, runDocker } from './docker.mjs';
import { localCredentials } from './bridge.mjs';
import { planTextFile, saveConfiguration } from './configuration.mjs';
import { MACHINAL_STUDIO_URL } from './presentation.mjs';
import { readSettings, saveSettings } from './settings.mjs';
import {
  checkBackendOpenRouterStatus,
  inspectLocalOpenRouter,
  OPENROUTER_KEYS_URL,
  openRouterSetupInstructions,
  providerKey,
  syncOpenRouterKeyToBackend,
  verifyOpenRouterKey,
} from './openrouter.mjs';

export { checkBackendOpenRouterStatus, inspectLocalOpenRouter, OPENROUTER_KEYS_URL, openRouterSetupInstructions, syncOpenRouterKeyToBackend, verifyOpenRouterKey };

const DEFAULT_OPENROUTER_STT_MODEL = 'openai/whisper-large-v3';
export const DEFAULT_OPENROUTER_MODELS = Object.freeze({
  OPENROUTER_MODEL: 'deepseek/deepseek-v4.1-flash',
  OPENROUTER_VISION_MODEL: 'qwen/qwen3.7-flash',
  OPENROUTER_STT_MODEL: DEFAULT_OPENROUTER_STT_MODEL,
  OPENROUTER_IMAGE_MODEL: 'openai/gpt-image-2.5-sunburst',
  OPENROUTER_SPEECH_MODEL: 'fish-audio/s2.1-pro',
  OPENROUTER_JEV_MODEL: 'typesafe/jev-1.13',
});

async function fileExists(file) {
  try { const info = await lstat(file); if (!info.isFile() || info.isSymbolicLink()) throw new Error(); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new InstallerError('The local profile is not a readable regular file. No provider settings were replaced.');
  }
}

function modelIdentifier(name, value) {
  const normalized = value?.trim() ?? '';
  if (normalized && !/^[\w~./:@+-]{1,200}$/.test(normalized)) {
    throw new InstallerError(`Set ${name} to a provider/model identifier, not a URL or credential.`);
  }
  return normalized;
}

function qualifiedModel(value) {
  const normalized = value?.trim() ?? '';
  return /^[\w~.-]+\/[\w~./:@+-]{1,180}$/.test(normalized) ? normalized : '';
}

function checkOpenRouter(key, context = {}) {
  if (context.verifyOpenRouterKey) return context.verifyOpenRouterKey(key);
  return verifyOpenRouterKey(key, { fetchImpl: context.fetchImpl });
}

export async function checkSavedOpenRouterKey(localConfig, context = {}) {
  if (!await fileExists(localConfig)) return { status: 'invalid', message: 'The saved local profile is missing.' };
  const saved = parseEnv(await readFile(localConfig, 'utf8'));
  return checkOpenRouter(saved.OPENROUTER_API_KEY ?? '', context);
}

async function ensureBackendOpenRouterSynced(endpoint, apiKey, context = {}) {
  if (!apiKey || !isLoopbackEndpoint(endpoint)) return false;
  if (context.checkConnection && !context.fetchImpl) return false;
  const backend = await checkBackendOpenRouterStatus(endpoint, { fetchImpl: context.fetchImpl ?? fetch });
  if (!backend.known || backend.configured) return true;
  const synced = await syncOpenRouterKeyToBackend(endpoint, apiKey, context);
  if (synced) {
    context.log?.('Synced saved OpenRouter API key to the running local backend.');
    return true;
  }
  context.log?.(`Warning: Local backend reports OpenRouter is not configured and could not sync automatically. ${openRouterSetupInstructions(endpoint).summary}`);
  return false;
}

async function obtainVerifiedOpenRouterKey(context, endpoint) {
  const { env = {}, interactive, ui, log = () => {} } = context;
  const setup = openRouterSetupInstructions(endpoint);
  const envKey = env.OPENROUTER_API_KEY?.trim();
  if (envKey) {
    const normalized = providerKey(envKey);
    const check = await checkOpenRouter(normalized, context);
    if (check.status === 'valid') return normalized;
    if (check.status === 'rate_limited' || check.status === 'unavailable') {
      log(`Warning: ${check.message}`);
      log(`How to configure or update your OpenRouter key later: ${setup.summary}`);
      return normalized;
    }
    if (!interactive) throw new InstallerError(`${check.message} ${setup.summary}`);
    log(`OPENROUTER_API_KEY in the environment did not pass verification (${check.message})`);
  }
  if (!interactive) return providerKey('');
  let validatedKey = null;
  let validatedState = null;
  const entered = await ui.password({
    message: `Your OpenRouter API key from ${OPENROUTER_KEYS_URL} (hidden; charged directly by OpenRouter)`,
    mask: '*',
    validate: async (value) => {
      let normalized;
      try { normalized = providerKey(value); } catch (error) { return error.message; }
      const check = await checkOpenRouter(normalized, context);
      if (check.status === 'invalid') return check.message;
      validatedKey = normalized;
      validatedState = check;
      return true;
    },
  });
  const normalized = providerKey(entered);
  const state = validatedKey === normalized ? validatedState : await checkOpenRouter(normalized, context);
  if (state.status === 'invalid') throw new InstallerError(`${state.message} ${setup.summary}`);
  if (state.status !== 'valid') {
    log(`Warning: ${state.message}`);
    log(`How to update your OpenRouter key if needed: ${setup.summary}`);
  }
  return normalized;
}

function providerModels(env = {}, saved = {}) {
  const values = {};
  for (const [name, fallback] of Object.entries(DEFAULT_OPENROUTER_MODELS)) {
    values[name] = modelIdentifier(name, env[name]) || qualifiedModel(saved[name]) || fallback;
  }
  const sceneModel = modelIdentifier('OPENROUTER_SCENE_MODEL', env.OPENROUTER_SCENE_MODEL) || qualifiedModel(saved.OPENROUTER_SCENE_MODEL);
  if (sceneModel) values.OPENROUTER_SCENE_MODEL = sceneModel;
  const sttProvider = modelIdentifier('OPENROUTER_STT_PROVIDER', env.OPENROUTER_STT_PROVIDER)
    || modelIdentifier('OPENROUTER_STT_PROVIDER', saved.OPENROUTER_STT_PROVIDER)
    || (values.OPENROUTER_STT_MODEL === DEFAULT_OPENROUTER_STT_MODEL ? 'groq' : '');
  if (sttProvider) values.OPENROUTER_STT_PROVIDER = sttProvider;
  return values;
}

function formatEnv(settings) {
  return Object.entries(settings).map(([name, value]) => `${name}='${value}'`).join('\n') + '\n';
}

export async function setLocalOpenRouterKey(providedKey, endpoint, localConfig, context) {
  const { env = {}, interactive, ui, log = () => {} } = context;
  if (new URL(endpoint).protocol !== 'http:' || !isLoopbackEndpoint(endpoint)) {
    throw new InstallerError('OpenRouter local configuration requires a loopback HTTP endpoint (e.g. http://127.0.0.1:8080/mcp).');
  }
  const setup = openRouterSetupInstructions(endpoint);
  let candidate = providedKey?.trim();
  if (!candidate) {
    const envKey = env.OPENROUTER_API_KEY?.trim();
    if (envKey && !interactive) {
      candidate = envKey;
    } else if (interactive) {
      log(`Create or copy an active OpenRouter key at ${OPENROUTER_KEYS_URL}`);
      candidate = await ui.password({
        message: `Your OpenRouter API key from ${OPENROUTER_KEYS_URL} (hidden; charged directly by OpenRouter)`,
        mask: '*',
        validate: async (value) => {
          let normalized;
          try { normalized = providerKey(value); } catch (error) { return error.message; }
          const check = await checkOpenRouter(normalized, context);
          if (check.status === 'invalid') return check.message;
          return true;
        },
      });
    } else {
      throw new InstallerError(`Provide an OpenRouter key via \`machinal key openrouter <sk-or-v1-...>\`, run \`machinal key openrouter\` interactively, or set OPENROUTER_API_KEY. Get a key at ${OPENROUTER_KEYS_URL}.`);
    }
  }
  const key = providerKey(candidate);
  const check = await checkOpenRouter(key, context);
  if (check.status === 'invalid') throw new InstallerError(`${check.message} ${setup.summary}`);
  if (check.status !== 'valid') log(`Warning: ${check.message}`);

  let existingValues = {};
  let localToken = null;
  if (await fileExists(localConfig)) {
    existingValues = parseEnv(await readFile(localConfig, 'utf8'));
    try { localToken = await localCredentials(localConfig, endpoint); } catch { /* Preserve or generate fresh loopback device token below. */ }
  }
  localToken ??= /^local_[a-f\d]{64}$/.test(existingValues.MACHINAL_LOCAL_TOKEN ?? '')
    ? existingValues.MACHINAL_LOCAL_TOKEN
    : `local_${randomBytes(32).toString('hex')}`;
  const sceneToken = existingValues.SCENE_SERVICE_TOKEN || randomBytes(32).toString('hex');
  const models = providerModels(env, existingValues);
  const settings = {
    OPENROUTER_API_KEY: key,
    ...models,
    HOST: '0.0.0.0',
    MACHINAL_LOCAL_URL: endpoint,
    MACHINAL_MODE: 'local',
    MACHINAL_LOCAL_CONTAINER: '1',
    MACHINAL_LOCAL_TOKEN: localToken,
    SCENE_SERVICE_TOKEN: sceneToken,
    SCENE_SERVICE_URL: existingValues.SCENE_SERVICE_URL || 'http://scene-renderer:8091',
    DATA_DIR: existingValues.DATA_DIR || '/data',
  };
  await mkdir(dirname(localConfig), { recursive: true, mode: 0o700 });
  const plan = await planTextFile(localConfig, formatEnv(settings));
  await saveConfiguration({ ...plan, mode: 0o600 });
  const synced = await syncOpenRouterKeyToBackend(endpoint, key, context);
  if (synced) {
    log('OpenRouter API key verified, saved to local profile, and synced to the running local backend.');
  } else {
    log(`OpenRouter API key verified and saved to local profile (${localConfig}).`);
    log('If the local backend is not running yet, start it with `machinal local install`; otherwise verify with `machinal local status`.');
  }
  return 0;
}

async function providers(context, endpoint) {
  const key = await obtainVerifiedOpenRouterKey(context, endpoint);
  return { OPENROUTER_API_KEY: key, ...providerModels(context.env) };
}

async function savedCheckout(composeFile, context) {
  const candidates = [];
  if (await fileExists(composeFile)) {
    try {
      const compose = JSON.parse(await readFile(composeFile, 'utf8'));
      const apiContext = compose?.services?.api?.build?.context;
      if (typeof apiContext === 'string' && apiContext.trim()) candidates.push(dirname(apiContext));
    } catch { /* Ignore unreadable legacy compose files during discovery. */ }
  }
  try {
    const settings = await readSettings(context);
    if (typeof settings.localCheckout === 'string' && settings.localCheckout.trim()) candidates.push(settings.localCheckout);
  } catch { /* Ignore invalid/unreadable settings during discovery. */ }
  for (const candidate of candidates) {
    const found = await findCheckout(context.cwd, candidate);
    if (found) return found;
  }
  return null;
}

const MIN_SCENE_PIDS_LIMIT = 512;

async function ensureLocalComposeDefaults(composeFile) {
  let compose;
  try { compose = JSON.parse(await readFile(composeFile, 'utf8')); } catch { return; }
  let updated = false;
  const api = compose?.services?.api;
  if (api && typeof api === 'object') {
    if (Array.isArray(api.environment)) {
      if (!api.environment.some((entry) => typeof entry === 'string' && entry.startsWith('HOST='))) {
        api.environment = [...api.environment, 'HOST=0.0.0.0'];
        updated = true;
      }
    } else if (api.environment?.HOST !== '0.0.0.0') {
      api.environment = { ...(api.environment && typeof api.environment === 'object' ? api.environment : {}), HOST: '0.0.0.0' };
      updated = true;
    }
  }
  const renderer = compose?.services?.['scene-renderer'];
  if (renderer && typeof renderer === 'object' && (!Number.isInteger(renderer.pids_limit) || renderer.pids_limit < MIN_SCENE_PIDS_LIMIT)) {
    renderer.pids_limit = MIN_SCENE_PIDS_LIMIT;
    updated = true;
  }
  if (!updated) return;
  const plan = await planTextFile(composeFile, JSON.stringify(compose, null, 2));
  await saveConfiguration({ ...plan, mode: 0o600 });
}

export async function prepareIndependentLocal(values, endpoint, localConfig, context) {
  const { cwd, interactive, ui, log } = context;
  if (new URL(endpoint).protocol !== 'http:') throw new InstallerError('The generated independent Docker profile uses HTTP on loopback only. Use --mode server for an existing TLS deployment.');
  const directory = dirname(localConfig);
  const composeFile = join(directory, 'compose.json');
  let existing;
  if (await fileExists(localConfig)) {
    const key = await localCredentials(localConfig, endpoint);
    existing = { key, values: parseEnv(await readFile(localConfig, 'utf8')) };
    if (!values['configure-local']) {
      const keyState = await checkOpenRouter(existing.values.OPENROUTER_API_KEY ?? '', context);
      if (keyState.status === 'valid') {
        return {
          key, localConfig, started: false,
          start: () => startLocal(composeFile, context, values),
          syncOpenRouter: () => ensureBackendOpenRouterSynced(endpoint, existing.values.OPENROUTER_API_KEY, context),
        };
      }
      if (keyState.status === 'rate_limited' || keyState.status === 'unavailable') {
        log(`Warning: ${keyState.message}`);
        log(`How to update your OpenRouter API key: ${openRouterSetupInstructions(endpoint).summary}`);
        return {
          key, localConfig, started: false,
          start: () => startLocal(composeFile, context, values),
          syncOpenRouter: () => ensureBackendOpenRouterSynced(endpoint, existing.values.OPENROUTER_API_KEY, context),
        };
      }
      log(`Saved OpenRouter API key is not valid (${keyState.message})`);
      const replacementKey = await obtainVerifiedOpenRouterKey(context, endpoint);
      const sceneToken = existing.values.SCENE_SERVICE_TOKEN ?? randomBytes(32).toString('hex');
      const models = providerModels(context.env, existing.values);
      const modelsChanged = Object.entries(models).some(([name, value]) => existing.values[name] !== value)
        || (Boolean(existing.values.OPENROUTER_SCENE_MODEL) && !models.OPENROUTER_SCENE_MODEL);
      const repairedSettings = {
        OPENROUTER_API_KEY: replacementKey,
        ...models,
        HOST: '0.0.0.0',
        MACHINAL_LOCAL_URL: endpoint,
        MACHINAL_MODE: 'local',
        MACHINAL_LOCAL_CONTAINER: '1',
        MACHINAL_LOCAL_TOKEN: key,
        SCENE_SERVICE_TOKEN: sceneToken,
        SCENE_SERVICE_URL: existing.values.SCENE_SERVICE_URL || 'http://scene-renderer:8091',
        DATA_DIR: existing.values.DATA_DIR || '/data',
      };
      const profilePlan = await planTextFile(localConfig, formatEnv(repairedSettings));
      await saveConfiguration({ ...profilePlan, mode: 0o600 });
      log('Updated OpenRouter API key in local profile.');
      const synced = await syncOpenRouterKeyToBackend(endpoint, replacementKey, context);
      if (synced) log('Synced OpenRouter API key to the running local backend.');
      let restarted = false;
      if (synced && modelsChanged && (values['start-docker'] || (interactive && await ui.confirm({
        message: 'Restart the local API container to apply repaired OpenRouter model defaults? Existing data volumes are preserved.', default: true,
      })))) {
        await startLocal(composeFile, context, { ...values, 'start-docker': true });
        restarted = true;
      }
      return {
        key, localConfig, started: restarted,
        start: () => startLocal(composeFile, context, values),
        syncOpenRouter: () => ensureBackendOpenRouterSynced(endpoint, replacementKey, context),
      };
    }
  }
  let checkout = await findCheckout(cwd, values['docker-dir']);
  if (!checkout && !values['docker-dir']) checkout = await savedCheckout(composeFile, context);
  if (!checkout && interactive) {
    log(`Local Machinal Studio checkout not detected. Get it at ${MACHINAL_STUDIO_URL}`);
    const path = await ui.input({ message: 'Machinal Studio folder path (leave empty to cancel)', required: false });
    if (path?.trim()) checkout = await findCheckout(cwd, path.trim());
  }
  if (!checkout) throw new InstallerError(`Local Machinal Studio was not detected. Clone ${MACHINAL_STUDIO_URL}, then rerun setup with --docker-dir PATH. Independent local mode needs Docker/Compose and no Machinal account/API key.`);
  const configuration = await providers(context, endpoint);
  const approved = values['start-docker'] || (interactive && await ui.confirm({
    message: `Install/start local API + renderer? Downloads dependencies, uses disk/CPU and saves provider secrets in ${directory}. OpenRouter bills your key.`, default: false,
  }));
  if (!approved) throw new InstallerError('Local setup cancelled. No provider files or containers were changed. --yes alone does not authorize Docker startup; use --start-docker.');
  const key = existing?.key ?? `local_${randomBytes(32).toString('hex')}`;
  const sceneToken = existing?.values.SCENE_SERVICE_TOKEN ?? randomBytes(32).toString('hex');
  const settings = { ...configuration, HOST: '0.0.0.0', MACHINAL_LOCAL_URL: endpoint, MACHINAL_MODE: 'local', MACHINAL_LOCAL_CONTAINER: '1',
    MACHINAL_LOCAL_TOKEN: key, SCENE_SERVICE_TOKEN: sceneToken, SCENE_SERVICE_URL: 'http://scene-renderer:8091', DATA_DIR: '/data' };
  const port = new URL(endpoint).port || '80';
  const host = new URL(endpoint).hostname === '[::1]' ? '[::1]' : '127.0.0.1';
  const compose = {
    name: `machinal-local-${directory.split(/[\\/]/).at(-1)}`,
    services: {
      api: { build: { context: join(checkout, 'api'), target: 'runtime' }, ports: [`${host}:${port}:8080`],
        environment: { HOST: '0.0.0.0' },
        env_file: [localConfig], volumes: ['local-data:/data'], depends_on: ['scene-renderer'], restart: 'unless-stopped', stop_grace_period: '45s' },
      'scene-renderer': { init: true, build: { context: join(checkout, 'services', 'scene-renderer'), target: 'service',
        additional_contexts: { 'client-source': join(checkout, 'client') } },
        environment: { SCENE_SERVICE_TOKEN: sceneToken, SCENE_CACHE_DIR: '/var/cache/scene', SCENE_WORKERS: 'auto' },
        volumes: ['scene-cache:/var/cache/scene', 'scene-work:/tmp'], shm_size: '1gb', mem_limit: '3g', cpus: 4, pids_limit: MIN_SCENE_PIDS_LIMIT,
        read_only: true, tmpfs: ['/home/scene:rw,nosuid,size=64m,uid=10001,gid=10001'], cap_drop: ['ALL'], security_opt: ['no-new-privileges:true'], restart: 'unless-stopped' },
    },
    volumes: { 'local-data': {}, 'scene-cache': {}, 'scene-work': {} },
  };
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const profilePlan = await planTextFile(localConfig, formatEnv(settings));
  const composePlan = await planTextFile(composeFile, JSON.stringify(compose, null, 2));
  await saveConfiguration({ ...profilePlan, mode: 0o600 });
  await saveConfiguration({ ...composePlan, mode: 0o600 });
  log(`Local profile: ${localConfig}. Keep this file and backups private.`);
  await startLocal(composeFile, context, { ...values, 'start-docker': true });
  await syncOpenRouterKeyToBackend(endpoint, configuration.OPENROUTER_API_KEY, context);
  await saveSettings({ localCheckout: checkout }, context);
  return { key, localConfig, started: true, start: () => startLocal(composeFile, context, values) };
}

async function startLocal(composeFile, context, values) {
  const { interactive, ui, log, env } = context;
  if (!await fileExists(composeFile)) throw new InstallerError('The local Compose profile is missing. Rerun setup --mode local --configure-local --docker-dir PATH.');
  const docker = context.docker ?? ((args, options = {}) => runDocker(args, { env, cwd: dirname(composeFile), ...options }));
  await docker(['info', '--format', '{{.ServerVersion}}']);
  const host = !env.DOCKER_CONTEXT && env.DOCKER_HOST ? env.DOCKER_HOST
    : await docker(['context', 'inspect', ...(env.DOCKER_CONTEXT ? [env.DOCKER_CONTEXT] : []), '--format', '{{.Endpoints.docker.Host}}']);
  if (!/^(unix:|npipe:|tcp:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::|\/|$))/.test(host)) throw new InstallerError('Local mode requires a local Docker daemon. No remote daemon was changed.');
  await docker(['compose', 'version', '--short']);
  if (!values['start-docker'] && !(interactive && await ui.confirm({ message: 'Start the saved independent local Docker profile? Existing data volumes are preserved.', default: false }))) {
    throw new InstallerError('Local API is unavailable. Start its saved Docker profile or rerun with --start-docker. The MCP adapter can still report the connection problem.');
  }
  await ensureLocalComposeDefaults(composeFile);
  const compose = ['compose', '-f', resolve(composeFile)];
  const images = (await docker([...compose, 'config', '--images'])).split(/\r?\n/).filter(Boolean);
  let build = images.length === 0;
  for (const image of images) {
    try { await docker(['image', 'inspect', '--format', '{{.Id}}', image]); } catch (error) {
      if (error.code !== 'docker-failed') throw error;
      build = true;
    }
  }
  log(build ? 'Local backend: installing missing images. First build may take several minutes.' : 'Local backend: reusing installed images.');
  await docker([...compose, 'up', '-d', ...(build ? ['--build'] : []), '--wait', '--wait-timeout', '180'], { timeout: 20 * 60_000, discardOutput: true });
}
