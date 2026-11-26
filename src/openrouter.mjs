import { lstat, readFile } from 'node:fs/promises';
import { parseEnv } from 'node:util';
import { isLoopbackEndpoint } from './connection.mjs';
import { InstallerError } from './errors.mjs';

export const OPENROUTER_KEY_CHECK_URL = 'https://openrouter.ai/api/v1/key';
export const OPENROUTER_KEYS_URL = 'https://openrouter.ai/keys';
const MAX_PROFILE_BYTES = 64 * 1024;

export function providerKey(value) {
  const key = value?.trim();
  if (!/^sk-or-v1-[a-f\d]{64}$/i.test(key ?? '')) {
    throw new InstallerError(
      `Enter a complete OpenRouter key (sk-or-v1-…) from ${OPENROUTER_KEYS_URL} via \`machinal key openrouter\` (hidden prompt) or \`machinal key openrouter <key>\`, or OPENROUTER_API_KEY.`,
    );
  }
  return key;
}

export function openRouterSetupInstructions(endpoint) {
  let studioUrl = 'http://127.0.0.1:8080';
  if (endpoint) {
    try { studioUrl = new URL(endpoint).origin; } catch { /* Keep default local Studio origin. */ }
  }
  const commands = [
    'machinal key openrouter',
    'machinal key openrouter <sk-or-v1-...>',
    'machinal local install --configure-local',
  ];
  const verifyCommand = 'machinal local status';
  const steps = [
    `Create or copy an active OpenRouter API key (sk-or-v1-...) at ${OPENROUTER_KEYS_URL}.`,
    'In your terminal, run `machinal key openrouter` (hidden prompt) or `machinal key openrouter <sk-or-v1-...>` — this verifies, saves to the local profile, and syncs directly to the running local backend. (For Cloud mode, use `machinal key api <mach_...>` instead, or switch mode with MCP `switch_mode`.)',
    `Alternatively, open local Machinal Studio at ${studioUrl} (Settings -> OpenRouter) or run \`machinal local install --configure-local\`.`,
    'Verify with `machinal local status` or reconnect via `connection_status(action="reconnect")`.',
  ];
  const summary = `Get an active OpenRouter API key (sk-or-v1-...) from ${OPENROUTER_KEYS_URL}, then run \`machinal key openrouter\` (or \`machinal key openrouter <sk-or-v1-...>\`) in your terminal — or save it in Machinal Studio local settings (${studioUrl}) / run \`machinal local install --configure-local\`. Verify with \`machinal local status\` or \`connection_status(action="reconnect")\`.`;
  return { keysUrl: OPENROUTER_KEYS_URL, commands, verifyCommand, studioUrl, steps, summary };
}

export async function verifyOpenRouterKey(apiKey, { fetchImpl = fetch, timeout = 15_000 } = {}) {
  let key;
  try { key = providerKey(apiKey); } catch (error) {
    return { status: 'invalid', message: error.message };
  }
  let response;
  try {
    response = await fetchImpl(OPENROUTER_KEY_CHECK_URL, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(timeout),
      headers: { Authorization: `Bearer ${key}` },
    });
  } catch {
    return { status: 'unavailable', message: 'Could not reach OpenRouter to verify the API key. Check your internet connection.' };
  }
  await response.body?.cancel();
  if (response.status === 200) return { status: 'valid' };
  if (response.status === 401 || response.status === 403) {
    return { status: 'invalid', httpStatus: response.status, message: `OpenRouter rejected this API key. Enter an active key from ${OPENROUTER_KEYS_URL}.` };
  }
  if (response.status === 429) {
    return { status: 'rate_limited', httpStatus: 429, message: 'OpenRouter rate-limited key verification (429). Wait a moment and retry.' };
  }
  return { status: 'unavailable', httpStatus: response.status, message: `OpenRouter could not verify the API key (HTTP ${response.status}).` };
}

async function readLocalProfileEnv(localConfig) {
  if (!localConfig) return { exists: false, values: {} };
  try {
    const info = await lstat(localConfig);
    if (!info.isFile() || info.isSymbolicLink() || info.size > MAX_PROFILE_BYTES) {
      return { exists: false, invalidFile: true, values: {} };
    }
    return { exists: true, values: parseEnv(await readFile(localConfig, 'utf8')) };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, values: {} };
    return { exists: false, invalidFile: true, values: {} };
  }
}

export async function checkBackendOpenRouterStatus(endpoint, { fetchImpl = fetch, timeout = 3_000, skipProbe = false } = {}) {
  if (skipProbe || !endpoint) return { known: false, configured: null };
  try {
    if (!isLoopbackEndpoint(endpoint)) return { known: false, configured: null };
  } catch {
    return { known: false, configured: null };
  }
  let response;
  try {
    response = await fetchImpl(new URL('/settings/openrouter', endpoint).href, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(timeout),
      headers: { Accept: 'application/json' },
    });
  } catch {
    return { known: false, configured: null };
  }
  if (!response.ok) {
    await response.body?.cancel();
    return { known: false, configured: null };
  }
  try {
    const payload = await response.json();
    if (typeof payload?.configured === 'boolean') {
      return { known: true, configured: payload.configured };
    }
  } catch { /* Ignore non-JSON status responses from incompatible/mock servers. */ }
  return { known: false, configured: null };
}

export async function syncOpenRouterKeyToBackend(endpoint, apiKey, context = {}) {
  if (!endpoint || !isLoopbackEndpoint(endpoint)) return false;
  if (context.checkConnection && !context.fetchImpl) return false;
  const fetchImpl = context.fetchImpl ?? fetch;
  try {
    const response = await fetchImpl(new URL('/settings/openrouter', endpoint).href, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    await response.body?.cancel();
    return response.ok;
  } catch {
    return false;
  }
}

export async function inspectLocalOpenRouter({
  localConfig,
  endpoint,
  fetchImpl = fetch,
  verifyOpenRouterKey: verifyImpl,
  timeout = 5_000,
  skipBackendProbe = false,
} = {}) {
  const setup = openRouterSetupInstructions(endpoint);
  const [profile, backend] = await Promise.all([
    readLocalProfileEnv(localConfig),
    checkBackendOpenRouterStatus(endpoint, { fetchImpl, timeout: Math.min(timeout, 3_000), skipProbe: skipBackendProbe }),
  ]);
  const savedKey = profile.values.OPENROUTER_API_KEY?.trim() ?? '';
  const profileKeyPresent = Boolean(savedKey);
  const backendConfigured = backend.known ? backend.configured : null;

  const blocked = (status, message, extra = {}) => ({
    status,
    ready: false,
    backendConfigured,
    profileKeyPresent,
    message,
    ...extra,
    keysUrl: setup.keysUrl,
    commands: setup.commands,
    verifyCommand: setup.verifyCommand,
    studioUrl: setup.studioUrl,
    howToSet: setup.steps,
    setupInstructions: setup.summary,
  });

  if (!profileKeyPresent) {
    if (backend.known && backend.configured === true) {
      return {
        status: 'configured',
        ready: true,
        backendConfigured: true,
        profileKeyPresent: false,
        message: 'OpenRouter API key is configured in the running local backend.',
      };
    }
    return blocked(
      'missing',
      profile.invalidFile
        ? 'The saved local profile could not be read and no OpenRouter API key is active on the local backend.'
        : 'No OpenRouter API key is configured for local mode. AI features (image generation, TTS speech, captions) cannot connect without a working OpenRouter API key.',
    );
  }

  const check = verifyImpl
    ? await verifyImpl(savedKey)
    : await verifyOpenRouterKey(savedKey, { fetchImpl, timeout });

  if (check.status === 'invalid') {
    return blocked(
      'invalid',
      `Cannot connect with the saved OpenRouter API key: ${check.message}`,
      check.httpStatus ? { httpStatus: check.httpStatus } : {},
    );
  }
  if (check.status === 'unavailable' || check.status === 'rate_limited') {
    return blocked(
      check.status,
      `Cannot connect to OpenRouter to verify the saved API key: ${check.message}`,
      check.httpStatus ? { httpStatus: check.httpStatus } : {},
    );
  }
  if (backend.known && backend.configured === false) {
    return blocked(
      'backend_unconfigured',
      'A valid OpenRouter API key exists in the local profile, but the running local backend does NOT have an OpenRouter key loaded. Sync or restart the local backend so AI tools can connect.',
    );
  }
  return {
    status: 'valid',
    ready: true,
    backendConfigured,
    profileKeyPresent: true,
    message: 'OpenRouter API key verified and ready.',
  };
}

export function formatOpenRouterAlert(openRouter) {
  if (!openRouter || openRouter.ready) return null;
  return `OPENROUTER KEY NOT READY (${openRouter.status}): ${openRouter.message} Inform the user IMMEDIATELY at the start before starting production or AI generation, and tell them how to set it: ${openRouter.setupInstructions}`;
}

export function attachLocalOpenRouterToQuickstart(data, openRouter) {
  if (!data || typeof data !== 'object' || !openRouter) return data;
  const warning = formatOpenRouterAlert(openRouter);
  if (!warning) {
    return { ...data, openRouter };
  }
  const stepZero = `0. OPENROUTER KEY NOT READY (${openRouter.status}): ${openRouter.message} Inform the user IMMEDIATELY at the start of this run and explain how to set it before starting AI production: ${openRouter.setupInstructions} (Pure procedural 2D/3D renders without AI images, TTS speech, or captions can run locally without OpenRouter, but all AI generation will fail until OpenRouter is configured.)`;
  const guideBanner = `> **WARNING — OpenRouter key not ready (${openRouter.status}):** ${openRouter.message}\n> **How to set it:** ${openRouter.setupInstructions}\n\n`;
  return {
    ...data,
    openRouter,
    openRouterWarning: warning,
    stageChecklist: [stepZero, ...(Array.isArray(data.stageChecklist) ? data.stageChecklist : [])],
    guide: typeof data.guide === 'string' ? `${guideBanner}${data.guide}` : guideBanner.trim(),
  };
}
