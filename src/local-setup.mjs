import { randomBytes } from 'node:crypto';
import { lstat, mkdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { parseEnv } from 'node:util';
import { InstallerError } from './errors.mjs';
import { findCheckout, runDocker } from './docker.mjs';
import { localCredentials } from './bridge.mjs';
import { planTextFile, saveConfiguration } from './configuration.mjs';

const MODELS = ['OPENROUTER_MODEL', 'OPENROUTER_SCENE_MODEL', 'OPENROUTER_STT_MODEL'];

async function fileExists(file) {
  try { const info = await lstat(file); if (!info.isFile() || info.isSymbolicLink()) throw new Error(); return true; } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new InstallerError('The local profile is not a readable regular file. No provider settings were replaced.');
  }
}

function providerKey(value) {
  const key = value?.trim();
  if (!/^sk-or-v1-[a-f\d]{64}$/i.test(key ?? '')) throw new InstallerError('Enter a complete OpenRouter key (sk-or-v1-…) through hidden entry or OPENROUTER_API_KEY, never command arguments.');
  return key;
}

async function providers(context) {
  const { env, interactive, ui } = context;
  let key = env.OPENROUTER_API_KEY;
  if (!key && interactive) key = await ui.password({ message: 'Your OpenRouter API key (hidden; charged directly by OpenRouter)', mask: '*',
    validate: (value) => { try { providerKey(value); return true; } catch (error) { return error.message; } } });
  const values = { OPENROUTER_API_KEY: providerKey(key) };
  for (const name of MODELS) {
    const fallback = name === 'OPENROUTER_SCENE_MODEL' ? values.OPENROUTER_MODEL : '';
    const hint = name === 'OPENROUTER_MODEL' ? 'required' : name === 'OPENROUTER_SCENE_MODEL' ? 'optional; falls back to OPENROUTER_MODEL' : 'optional; empty disables transcription';
    const value = interactive ? await ui.input({ message: `${name} (${hint})`,
      default: env[name] || fallback || '', required: name === 'OPENROUTER_MODEL' }) : env[name] || fallback || '';
    if ((name === 'OPENROUTER_MODEL' && !value) || (value && !/^[\w~./:@+-]{1,200}$/.test(value))) {
      throw new InstallerError(`Set ${name} to a provider/model identifier, not a URL or credential.`);
    }
    values[name] = value;
  }
  return values;
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
    if (!values['configure-local']) return { key, localConfig, start: () => startLocal(composeFile, context, values) };
  }
  let checkout = await findCheckout(cwd, values['docker-dir']);
  if (!checkout && interactive) {
    const path = await ui.input({ message: 'Machinal source checkout folder (Docker builds locally)', required: true });
    checkout = await findCheckout(cwd, path);
  }
  if (!checkout) throw new InstallerError('Independent local mode needs Docker/Compose and a Machinal source checkout. Use --docker-dir PATH. No public image is assumed and no Machinal account/API key is needed.');
  const configuration = await providers(context);
  const approved = values['start-docker'] || (interactive && await ui.confirm({
    message: `Install/start local API + renderer? Downloads dependencies, uses disk/CPU and saves provider secrets in ${directory}. OpenRouter bills your key.`, default: false,
  }));
  if (!approved) throw new InstallerError('Local setup cancelled. No provider files or containers were changed. --yes alone does not authorize Docker startup; use --start-docker.');
  const key = existing?.key ?? `local_${randomBytes(32).toString('hex')}`;
  const sceneToken = existing?.values.SCENE_SERVICE_TOKEN ?? randomBytes(32).toString('hex');
  const settings = { ...configuration, MACHINAL_LOCAL_URL: endpoint, MACHINAL_MODE: 'local', MACHINAL_LOCAL_CONTAINER: '1',
    MACHINAL_LOCAL_TOKEN: key, SCENE_SERVICE_TOKEN: sceneToken, SCENE_SERVICE_URL: 'http://scene-renderer:8091', DATA_DIR: '/data' };
  const port = new URL(endpoint).port || '80';
  const host = new URL(endpoint).hostname === '[::1]' ? '[::1]' : '127.0.0.1';
  const compose = {
    name: `machinal-local-${directory.split(/[\\/]/).at(-1)}`,
    services: {
      api: { build: { context: join(checkout, 'api'), target: 'runtime' }, ports: [`${host}:${port}:8080`],
        env_file: [localConfig], volumes: ['local-data:/data'], depends_on: ['scene-renderer'], restart: 'unless-stopped', stop_grace_period: '45s' },
      'scene-renderer': { init: true, build: { context: join(checkout, 'services', 'scene-renderer'), target: 'service',
        additional_contexts: { 'client-source': join(checkout, 'client') } },
        environment: { SCENE_SERVICE_TOKEN: sceneToken, SCENE_CACHE_DIR: '/var/cache/scene', SCENE_WORKERS: 'auto' },
        volumes: ['scene-cache:/var/cache/scene', 'scene-work:/tmp'], shm_size: '1gb', mem_limit: '3g', cpus: 4, pids_limit: 256,
        read_only: true, tmpfs: ['/home/scene:rw,nosuid,size=64m,uid=10001,gid=10001'], cap_drop: ['ALL'], security_opt: ['no-new-privileges:true'], restart: 'unless-stopped' },
    },
    volumes: { 'local-data': {}, 'scene-cache': {}, 'scene-work': {} },
  };
  await mkdir(directory, { recursive: true, mode: 0o700 });
  const profilePlan = await planTextFile(localConfig, Object.entries(settings).map(([name, value]) => `${name}='${value}'`).join('\n') + '\n');
  const composePlan = await planTextFile(composeFile, JSON.stringify(compose, null, 2));
  await saveConfiguration({ ...profilePlan, mode: 0o600 });
  await saveConfiguration({ ...composePlan, mode: 0o600 });
  log(`Local profile: ${localConfig}. Keep this file and backups private.`);
  await startLocal(composeFile, context, { ...values, 'start-docker': true });
  return { key, localConfig, start: () => startLocal(composeFile, context, values) };
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
