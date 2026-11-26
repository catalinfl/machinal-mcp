import { readFile, mkdir, writeFile, lstat, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { parseEnv } from 'node:util';
import { normalizeEndpoint, validateAPIKey, isLoopbackEndpoint } from './connection.mjs';
import { createCredentialStore } from './credential-store.mjs';
import { VERSION } from './version.mjs';
import { DEFAULT_LOCAL_URL, MACHINAL_SERVER_URL } from './endpoints.mjs';
import { describeDeployment } from './deployment.mjs';
import { RequestScheduler, requestClass, requestLimits } from './request-scheduler.mjs';
import { SceneLibrary, LIBRARY_TOOLS, LIBRARY_TOPICS, libraryInstructions } from './scene-library.mjs';
import { decorateStdioTool, parseAllowedRoots, prepareStdioToolCall } from './stdio-files.mjs';
import { attachLocalOpenRouterToQuickstart, formatOpenRouterAlert, inspectLocalOpenRouter } from './openrouter.mjs';
import { CONFIRM_BRIEF_TOOL, checkRecipeAgainstBrief, validateBriefConfirmation } from './brief-gate.mjs';
import { inspectRecipeTimeline, validateAudioIntegrity } from './recipe-validation.mjs';
import { endpointFiles } from './paths.mjs';
import { readSettings, saveSettings } from './settings.mjs';

const MAX_REQUEST = 4 * 1024 * 1024;
const MAX_RESPONSE = 2 * 1024 * 1024;
const MAX_PENDING_REQUESTS = 64;
const DEFAULT_MAX_WAIT_SECONDS = 120;
const SOUND_CACHE_TTL_MS = 5 * 60 * 1000;
const SOUND_CACHE_MAX_ENTRIES = 64;
const TRANSIENT_GATEWAY_STATUSES = new Set([502, 503, 504]);
const PRODUCTION_GATED_TOOLS = new Set(['create_project', 'compile_scene', 'generate_assets', 'render_video', 'render_preview']);
const PROTOCOL = '2025-11-25';
const VERSIONS = ['2025-03-26', '2025-06-18', PROTOCOL];
const CLIENT_VERSIONS = ['2024-11-05', ...VERSIONS];

function parseMaxWaitSeconds(option, env) {
  const candidate = option !== undefined ? option : env?.MACHINAL_MCP_MAX_WAIT_SECONDS;
  if (candidate === undefined || candidate === '') return DEFAULT_MAX_WAIT_SECONDS;
  const value = typeof candidate === 'number' ? candidate : /^\d+$/.test(String(candidate).trim()) ? Number(String(candidate).trim()) : NaN;
  if (!Number.isInteger(value) || value < 1 || value > 900) return DEFAULT_MAX_WAIT_SECONDS;
  return value;
}
export const STATUS_TOOL = Object.freeze({
  name: 'connection_status',
  description: 'Free connection diagnostics. Distinguishes login required, connection unavailable and account access from an MCP transport failure. Reconnect reloads credentials and tool discovery only; never retries submitted work. Never pass keys in tool arguments or chat.',
  inputSchema: { type: 'object', properties: { action: { type: 'string', enum: ['status', 'reconnect'] } }, additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
});

export const SWITCH_MODE_TOOL = Object.freeze({
  name: 'switch_mode',
  description: 'Switch the active Machinal MCP mode immediately between local (independent local Docker + BYOK OpenRouter) and cloud (Machinal Server https://api.machinal.app/mcp + Machinal API key) without restarting your client. Reconnects live, emits notifications/tools/list_changed, persists the selected mode for future sessions, and reports OpenRouter or Machinal API key readiness (`machinal key openrouter` for local, `machinal key api <key>` for cloud).',
  inputSchema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['local', 'cloud', 'server', 'toggle'],
        description: 'Target mode: "local", "cloud" (alias "server"), or "toggle" (switches to the opposite mode; default).',
      },
      url: {
        type: 'string',
        description: 'Optional endpoint override (loopback HTTP for local, HTTPS for cloud/custom).',
      },
    },
    additionalProperties: false,
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
});

async function privateFile(file, limit = MAX_RESPONSE) {
  const stat = await lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size > limit) throw new Error('Invalid connection file');
  return readFile(file, 'utf8');
}

export async function cacheCatalog(file, data) {
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(data), { flag: 'wx', mode: 0o600 });
    await rename(temporary, file);
  } finally { await unlink(temporary).catch((error) => { if (error.code !== 'ENOENT') throw error; }); }
}

export async function localCredentials(file, endpoint) {
  if (!isLoopbackEndpoint(endpoint)) throw new Error('Local credentials require loopback');
  const values = parseEnv(await privateFile(file, 64 * 1024));
  if (normalizeEndpoint(values.MACHINAL_LOCAL_URL) !== endpoint || !/^local_[a-f\d]{64}$/.test(values.MACHINAL_LOCAL_TOKEN ?? '')) {
    throw new Error('Local connection profile mismatch');
  }
  return values.MACHINAL_LOCAL_TOKEN;
}

async function jsonResponse(response) {
  if (!response.headers.get('content-type')?.startsWith('application/json')) {
    await response.body?.cancel();
    throw new Error('Invalid service response');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('Empty service response');
  let size = 0;
  const chunks = [];
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_RESPONSE) { await reader.cancel(); throw new Error('Service response too large'); }
      chunks.push(value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } finally { reader.releaseLock(); }
}

export class MCPBridge {
  constructor({ url, localConfig, catalogFile, home, env = process.env, credentialStore = createCredentialStore({ env, home }), fetchImpl = fetch, verifyOpenRouterKey, signal, notify = () => {}, maxWaitSeconds, fileRoots, soundRetryDelayMs = 500, requireQuickstart = true, requireBrief, persistMode = true }) {
    this.url = normalizeEndpoint(url);
    this.localConfig = localConfig;
    this.deployment = describeDeployment({ local: Boolean(localConfig), url: this.url });
    this.catalogFile = catalogFile;
    this.home = home;
    this.env = env;
    this.persistMode = persistMode;
    this.lastLocalUrl = localConfig ? this.url : null;
    this.lastLocalConfig = localConfig ?? null;
    this.lastCloudUrl = localConfig ? null : this.url;
    this.credentialStore = credentialStore;
    this.fetch = fetchImpl;
    this.verifyOpenRouterKey = verifyOpenRouterKey;
    this.signal = signal;
    this.notify = notify;
    this.maxWaitSeconds = parseMaxWaitSeconds(maxWaitSeconds, env);
    this.allowedRoots = parseAllowedRoots(fileRoots, env);
    this.soundRetryDelayMs = soundRetryDelayMs;
    this.requireQuickstart = requireQuickstart;
    this.requireBrief = requireBrief ?? requireQuickstart;
    this.quickstartCompleted = false;
    this.pendingBrief = null;
    this.confirmedProjects = new Map();
    this.assetDurations = new Map();
    this.soundSearchCache = new Map();
    this.tools = [];
    this.state = { status: 'unchecked', message: 'Connection has not been checked.' };
    this.openRouter = null;
    this.openRouterCheckedAt = 0;
    this.nextID = 0;
    this.key = null;
    this.library = new SceneLibrary(undefined, { mode: this.deployment.kind });
  }

  async switchMode({ mode = 'toggle', url } = {}, { persist = this.persistMode } = {}) {
    const previousMode = this.localConfig ? 'local' : 'cloud';
    const normalizedMode = mode === 'server' ? 'cloud' : mode;
    if (!['local', 'cloud', 'toggle'].includes(normalizedMode)) {
      throw new Error('Choose mode "local", "cloud" (or "server"), or "toggle".');
    }
    const target = normalizedMode === 'toggle' ? (previousMode === 'local' ? 'cloud' : 'local') : normalizedMode;
    const settingsContext = { env: this.env, home: this.home };
    let settings = {};
    try { settings = await readSettings(settingsContext); } catch { /* Ignore unreadable settings during live mode switch. */ }

    let nextUrl;
    let nextLocalConfig;
    let nextCatalogFile;
    if (target === 'local') {
      const candidateUrl = url ?? this.lastLocalUrl ?? settings.lastLocalUrl
        ?? (settings.connection?.mode === 'local' ? settings.connection.url : null) ?? DEFAULT_LOCAL_URL;
      nextUrl = normalizeEndpoint(candidateUrl);
      if (new URL(nextUrl).protocol !== 'http:' || !isLoopbackEndpoint(nextUrl)) {
        throw new Error('Local mode requires a loopback HTTP endpoint (e.g. http://127.0.0.1:8080/mcp).');
      }
      const files = endpointFiles(nextUrl, settingsContext, { local: true });
      nextLocalConfig = (this.lastLocalUrl === nextUrl && this.lastLocalConfig)
        ? this.lastLocalConfig
        : (settings.connection?.mode === 'local' && settings.connection.url === nextUrl && settings.connection.localConfig)
          ? settings.connection.localConfig
          : files.localConfig;
      nextCatalogFile = files.catalogFile;
    } else {
      const candidateUrl = url ?? this.lastCloudUrl ?? settings.lastCloudUrl
        ?? (settings.connection?.mode && settings.connection.mode !== 'local' ? settings.connection.url : null) ?? MACHINAL_SERVER_URL;
      nextUrl = normalizeEndpoint(candidateUrl);
      const files = endpointFiles(nextUrl, settingsContext, { local: false });
      nextLocalConfig = undefined;
      nextCatalogFile = files.catalogFile;
    }

    if (this.localConfig) {
      this.lastLocalUrl = this.url;
      this.lastLocalConfig = this.localConfig;
    } else {
      this.lastCloudUrl = this.url;
    }

    const modeChanged = Boolean(this.localConfig) !== Boolean(nextLocalConfig) || this.url !== nextUrl;
    this.url = nextUrl;
    this.localConfig = nextLocalConfig;
    this.catalogFile = nextCatalogFile;
    this.deployment = describeDeployment({ local: Boolean(nextLocalConfig), url: this.url });
    this.library = new SceneLibrary(undefined, { mode: this.deployment.kind });
    this.tools = [];
    this.instructions = undefined;
    this.key = null;
    this.openRouter = null;
    this.openRouterCheckedAt = 0;
    this.quickstartCompleted = false;
    this.pendingBrief = null;
    this.confirmedProjects.clear();
    this.assetDurations.clear();
    this.soundSearchCache.clear();
    this.state = { status: 'unchecked', message: 'Switching mode...' };

    let persisted = false;
    if (persist) {
      const connectionMode = nextLocalConfig ? 'local' : (nextUrl === MACHINAL_SERVER_URL ? 'server' : 'custom');
      const override = { mode: connectionMode, url: nextUrl, ...(nextLocalConfig ? { localConfig: nextLocalConfig } : {}) };
      try {
        await saveSettings({
          connection: override,
          activeModeOverride: override,
          ...(this.lastLocalUrl ? { lastLocalUrl: this.lastLocalUrl } : {}),
          ...(this.lastCloudUrl ? { lastCloudUrl: this.lastCloudUrl } : {}),
          ...(nextLocalConfig ? { lastLocalUrl: nextUrl } : { lastCloudUrl: nextUrl }),
        }, settingsContext);
        persisted = true;
      } catch { /* Never fail a live MCP mode switch when settings storage is read-only. */ }
    }

    let notified = false;
    const originalNotify = this.notify;
    this.notify = (message) => {
      if (message?.method === 'notifications/tools/list_changed') notified = true;
      return originalNotify(message);
    };
    try {
      await this.loadCatalog();
      await this.connect();
    } finally {
      this.notify = originalNotify;
    }
    if (modeChanged && !notified) {
      this.notify({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    }
    return {
      switched: modeChanged,
      previousMode,
      persisted,
      ...this.status(),
    };
  }

  async checkOpenRouterStatus({ force = false } = {}) {
    if (!this.localConfig) return null;
    const now = Date.now();
    if (!force && this.openRouter?.ready && now - this.openRouterCheckedAt < 60_000) {
      return this.openRouter;
    }
    this.openRouter = await inspectLocalOpenRouter({
      localConfig: this.localConfig,
      endpoint: this.url,
      fetchImpl: this.fetch,
      verifyOpenRouterKey: this.verifyOpenRouterKey,
    });
    this.openRouterCheckedAt = Date.now();
    return this.openRouter;
  }

  status() {
    const readyAction = this.localConfig
      ? 'Ready (independent local Docker mode). For any new or edited video, call production_quickstart first alongside get_workflow_preferences, get_recipe_schema, get_capabilities and list_speech_models. Zero Machinal credits does NOT skip the collaborative brief or authorize userApproved:true — ask all missing brief choices (platform/aspect+resolution such as TikTok 9:16 vs YouTube 16:9, duration, visual materials/images vs procedural, narration/language/TTS model, captions, sound effects) in one native question form, wait for the user reply, then call confirm_brief before creating projects, compiling scenes, generating assets or rendering.'
      : 'Ready. For any new or edited video, call production_quickstart first alongside get_workflow_preferences, get_recipe_schema, get_capabilities, get_credits and list_speech_models, then ask all missing brief choices (format/aspect+resolution, duration, visuals, voice/TTS model, captions, sound effects, approval) in one native question form, wait for the user reply, and call confirm_brief before creating projects, compiling scenes, generating assets or rendering.';
    const openRouterWarning = this.localConfig ? formatOpenRouterAlert(this.openRouter) : null;
    const connectedAction = openRouterWarning ? `${openRouterWarning} | ${readyAction}` : readyAction;
    return { ...this.state, transport: 'connected', mode: this.localConfig ? 'local' : 'server', deployment: this.deployment, endpoint: this.url,
      requestConcurrency: requestLimits,
      maxWaitSeconds: this.maxWaitSeconds,
      credentialSource: this.credentialSource ?? 'unchecked',
      ...(this.localConfig ? {} : { credentialStore: this.credentialStore?.description ?? { supported: false } }),
      ...(this.localConfig && this.openRouter ? { openRouter: this.openRouter } : {}),
      ...(openRouterWarning ? { openRouterWarning } : {}),
      service: this.localConfig ? 'Local' : this.url === MACHINAL_SERVER_URL ? 'Machinal Server' : 'Custom server',
      toolCount: this.tools.length, nextAction: this.localConfig && this.state.status !== 'connected'
        ? 'Check the saved independent local profile and Docker services. Rerun setup --mode local if its generated device token is invalid (for OpenRouter key run `machinal key openrouter`), or call `switch_mode(mode="cloud")` to switch to Machinal Cloud.' : this.state.status === 'login_required'
        ? `Run \`machinal key api <mach_...>\` (or \`machinal set-key --url ${this.url}\`) in a terminal, or provide MACHINAL_API_KEY in the client environment. To use local Docker instead, call \`switch_mode(mode="local")\`. Never paste keys in chat.`
        : this.state.status === 'connected' ? connectedAction : 'Check the configured API/container and network, then reconnect. Do not replace keys for network or account-access errors.' };
  }

  async loadCatalog() {
    if (!this.catalogFile) return;
    try {
      const cached = JSON.parse(await privateFile(this.catalogFile));
      const expectedMode = this.localConfig ? 'local' : 'server';
      const modeMatches = cached.mode === expectedMode
        || (cached.mode === undefined && !this.localConfig
          && !/machinal-local|Independent local profile|No credit tool exists/i.test(cached.instructions ?? ''));
      if (cached.url === this.url && modeMatches) {
        this.tools = validTools(cached.tools);
        if (typeof cached.instructions === 'string') this.instructions = cached.instructions;
      }
    } catch { /* A cache is optional; never trust an unreadable or malformed one. */ }
  }

  async credentials() {
    if (this.localConfig) { this.credentialSource = 'local-profile'; return localCredentials(this.localConfig, this.url); }
    const environmentKey = this.env.MACHINAL_API_KEY || this.env.DIRECTION_API_KEY;
    if (environmentKey) {
      this.credentialSource = 'environment';
      try { return validateAPIKey(environmentKey); } catch { throw Object.assign(new Error('Invalid credential'), { invalidKey: true }); }
    }
    this.credentialSource = 'saved';
    const saved = await this.credentialStore?.read();
    if (!saved) this.credentialSource = 'none';
    try { return saved ? validateAPIKey(saved) : null; } catch { throw Object.assign(new Error('Invalid credential'), { invalidKey: true }); }
  }

  async rpc(method, params, { timeout = 150_000, signal, notification = false } = {}) {
    const id = notification ? undefined : ++this.nextID;
    const signals = [AbortSignal.timeout(timeout), this.signal, signal].filter(Boolean);
    const response = await this.fetch(this.url, {
      method: 'POST', redirect: 'error', signal: AbortSignal.any(signals),
      headers: { Authorization: `Bearer ${this.key}`, Accept: 'application/json, text/event-stream',
        'Content-Type': 'application/json', 'MCP-Protocol-Version': this.protocol ?? PROTOCOL },
      body: JSON.stringify({ jsonrpc: '2.0', ...(id !== undefined ? { id } : {}), method, ...(params ? { params } : {}) }),
    });
    if (!response.ok) {
      const retryAfter = response.headers.get('retry-after');
      await response.body?.cancel();
      throw Object.assign(new Error('Service unavailable'), { status: response.status,
        ...(/^\d{1,5}$/.test(retryAfter ?? '') ? { retryAfter: Math.min(86400, Number(retryAfter)) } : {}),
      });
    }
    if (notification) { await response.body?.cancel(); return; }
    const reply = await jsonResponse(response);
    if (reply.jsonrpc !== '2.0' || reply.id !== id || reply.error || !reply.result) throw Object.assign(new Error('Invalid MCP service response'), { protocolError: true });
    return reply.result;
  }

  failure(error) {
    const status = error.status === 401 ? 'login_required'
      : [402, 403].includes(error.status) ? 'account_access_required'
        : error.status === 429 ? 'rate_limited' : error.protocolError ? 'service_error' : 'connection_unavailable';
    const messages = {
      login_required: 'Login required: the Machinal API key is missing, invalid or rejected. The MCP adapter is running.',
      account_access_required: 'Account access is unavailable. Check membership/permissions; do not create another key.',
      rate_limited: 'The service is rate limited. Wait before reconnecting.',
      service_error: 'The endpoint did not provide a compatible Machinal MCP service. Check its URL/version.',
      connection_unavailable: 'Connection unavailable: check the API/container, URL, TLS and network. The MCP adapter is still running.',
    };
    this.state = { status, message: messages[status], ...(error.status ? { httpStatus: error.status } : {}),
      ...(Number.isInteger(error.retryAfter) && error.retryAfter >= 0 ? { retryAfter: error.retryAfter } : {}),
    };
    if (this.localConfig && error.status === 401) this.state = { status: 'local_configuration_required', message: 'The local device token was rejected. Rerun independent local setup; do not create a Machinal account key.' };
  }

  async connect() {
    if (this.connecting) return this.connecting;
    this.connecting = this.discover().finally(() => { this.connecting = null; });
    return this.connecting;
  }

  async discover() {
    try {
      try { this.key = await this.credentials(); } catch (error) {
        if (error.invalidKey) this.failure({ status: 401 });
        else this.state = { status: 'credential_unavailable', message: 'Credential source could not be read. Check secure storage/environment; no credential was deleted.' };
        return this.status();
      }
      if (!this.key) { this.failure({ status: 401 }); return this.status(); }
      const initialized = await this.rpc('initialize', { protocolVersion: PROTOCOL, capabilities: {}, clientInfo: { name: 'machinal-mcp-adapter', version: VERSION } }, { timeout: 3000 });
      const upstreamName = initialized.serverInfo?.name?.toLowerCase();
      const expectedUpstream = this.localConfig ? 'machinal-local' : 'machinal';
      const validUpstream = upstreamName === expectedUpstream;
      if (!validUpstream || !VERSIONS.includes(initialized.protocolVersion)) throw { protocolError: true };
      this.protocol = initialized.protocolVersion;
      await this.rpc('notifications/initialized', {}, { notification: true, timeout: 3000 });
      const tools = [];
      let cursor;
      for (let page = 0; page < 10; page++) {
        const catalog = await this.rpc('tools/list', cursor ? { cursor } : {}, { timeout: 3000 });
        tools.push(...validTools(catalog.tools));
        cursor = catalog.nextCursor;
        if (!cursor) break;
      }
      if (cursor || !tools.some((tool) => tool.name === 'list_projects') || !tools.some((tool) => tool.name === 'get_recipe_schema')) throw { protocolError: true };
      const changed = JSON.stringify(this.tools) !== JSON.stringify(tools);
      this.tools = tools;
      this.instructions = initialized.instructions;
      this.state = { status: 'connected', message: 'Connected to the configured service.' };
      if (this.localConfig) await this.checkOpenRouterStatus({ force: true });
      if (this.catalogFile) {
        try {
          await cacheCatalog(this.catalogFile, {
            url: this.url,
            mode: this.localConfig ? 'local' : 'server',
            deployment: this.deployment.kind,
            tools,
            instructions: this.instructions,
          });
        } catch { /* Losing the non-secret catalog cache must not break a live connection. */ }
      }
      if (changed) this.notify({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    } catch (error) { this.failure(error); }
    return this.status();
  }

  async handle(method, params = {}, signal) {
    if (method === 'initialize') {
      const adapterBanner = this.localConfig
        ? 'Machinal MCP adapter — Independent Local Profile (Docker / self-hosted on this machine). No Machinal cloud account, login, S3 bucket or Machinal credits apply. Call connection_status to diagnose local device-token, OpenRouter key or container issues. At the start of every local run, check openRouter status in connection_status / production_quickstart — if OpenRouter is missing, invalid, unreachable or not configured on the local backend, inform the user immediately at the beginning and explain how to set it. Never request keys in chat. Reconnect only retries free discovery, never jobs. Recover existing job IDs before retrying any ambiguous submission. User approval is still required for media access, provider-billed generation, rendering and downloads.'
        : `Machinal MCP adapter — ${this.deployment.kind === 'cloud' ? 'Machinal Cloud Profile (hosted server)' : 'Custom Hosted Server Profile'}. Call connection_status to distinguish login required, account restrictions or network problems. Never request keys in chat. Reconnect only retries free discovery, never jobs. Recover existing job IDs before retrying any ambiguous submission. User approval is still required for media access, generation, rendering and downloads.`;
      const profileGuide = this.localConfig ? 'guides/client-bootstrap-local.md' : 'guides/client-bootstrap-cloud.md';
      return {
        protocolVersion: CLIENT_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOL,
        serverInfo: { name: 'machinal', version: VERSION }, capabilities: { tools: { listChanged: true }, resources: {} },
        instructions: [
          adapterBanner,
          this.instructions,
          (await this.library.bytes(profileGuide)).toString('utf8'),
          (await this.library.bytes('guides/client-bootstrap-core.md')).toString('utf8'),
          libraryInstructions(this.deployment.kind),
        ].filter(Boolean).join('\n\n'),
      };
    }
    if (method === 'ping') return {};
    if (method === 'tools/list') {
      if (this.state.status === 'unchecked') await this.connect();
      const tools = this.tools.filter(tool => !LIBRARY_TOOLS.some(local => local.name === tool.name)).map(tool => {
        if (tool.name === 'get_editing_reference') {
          const schema = structuredClone(tool.inputSchema);
          const topic = schema.properties?.topic;
          if (topic?.enum) topic.enum = [...new Set([...topic.enum, ...LIBRARY_TOPICS])];
          if (schema.properties) {
            const { role, profiles, aspect } = LIBRARY_TOOLS[0].inputSchema.properties;
            Object.assign(schema.properties, { role, profiles, aspect });
          }
          return { ...tool, inputSchema: schema };
        }
        return decorateStdioTool(tool, { maxWaitSeconds: this.maxWaitSeconds, local: Boolean(this.localConfig) });
      });
      return { tools: [STATUS_TOOL, SWITCH_MODE_TOOL, CONFIRM_BRIEF_TOOL, ...LIBRARY_TOOLS, ...tools] };
    }
    if (method === 'tools/call' && params.name === STATUS_TOOL.name) {
      if (params.arguments?.action === 'reconnect' || this.state.status === 'unchecked') await this.connect();
      else if (this.localConfig && this.state.status === 'connected') await this.checkOpenRouterStatus({ force: !this.openRouter?.ready });
      return toolResult(this.status());
    }
    if (method === 'tools/call' && params.name === SWITCH_MODE_TOOL.name) {
      try {
        return toolResult(await this.switchMode(params.arguments ?? {}));
      } catch (error) {
        return toolResult({ status: 'error', message: error.message, ...this.status() }, true);
      }
    }
    if (method === 'tools/call' && params.name === CONFIRM_BRIEF_TOOL.name) {
      const verdict = validateBriefConfirmation(params.arguments ?? {}, {
        quickstartCompleted: !this.requireQuickstart || this.quickstartCompleted,
        deploymentKind: this.deployment.kind,
      });
      if (!verdict.ok) return toolResult(verdict.payload, true);
      if (verdict.brief.purpose === 'edit' && verdict.brief.projectId) {
        this.confirmedProjects.set(verdict.brief.projectId, verdict.brief);
      } else {
        this.pendingBrief = verdict.brief;
      }
      return toolResult(verdict.payload);
    }
    if (method === 'tools/call') {
      if (this.library.handles(params.name, params.arguments)) {
        const isQuickstart = params.name === 'production_quickstart'
          || ((params.name === 'get_library_reference' || params.name === 'get_editing_reference') && params.arguments?.topic === 'quickstart');
        const result = await this.library.call(params.name, params.arguments);
        if (isQuickstart && !result.isError) {
          this.quickstartCompleted = true;
          if (this.localConfig && result.structuredContent?.data) {
            const openRouter = await this.checkOpenRouterStatus({ force: !this.openRouter?.ready });
            const enriched = {
              ...result.structuredContent,
              data: attachLocalOpenRouterToQuickstart(result.structuredContent.data, openRouter),
            };
            return { ...result, content: [{ type: 'text', text: JSON.stringify(enriched) }], structuredContent: enriched };
          }
        }
        return result;
      }
      if (this.requireQuickstart && PRODUCTION_GATED_TOOLS.has(params.name) && !this.quickstartCompleted) {
        const liveBatch = this.localConfig
          ? 'get_workflow_preferences, get_recipe_schema, get_capabilities, list_speech_models'
          : 'get_workflow_preferences, get_recipe_schema, get_capabilities, get_credits, list_speech_models';
        return toolResult({
          status: 'blocked',
          submissionState: 'not-submitted',
          nextTool: 'production_quickstart',
          deploymentMode: this.deployment.kind,
          error: `Production bootstrap required before ${params.name}. Call production_quickstart first (in parallel with ${liveBatch}) in its own turn — do not batch it with ${params.name}. Ask ALL missing brief decisions in ONE native question form (destination/platform + aspect & resolution such as TikTok 9:16 vs YouTube 16:9, duration, visual materials/AI-generated images vs existing media vs procedural, narration/language/TTS model, captions, and sound effects), wait for the user's reply, then call confirm_brief before proceeding. A short prompt with only topic, style, or 2D/3D preference is INCOMPLETE. Local zero-credit Docker mode requires the exact same brief and explicit user approval as cloud mode; never self-approve userApproved:true. No action was executed.`,
        }, true);
      }
      if (this.requireBrief && PRODUCTION_GATED_TOOLS.has(params.name)) {
        const preliminaryProjectId = params.arguments?.projectId;
        const canProceedBeforeFileResolve = params.name === 'create_project'
          ? Boolean(this.pendingBrief)
          : Boolean(
              (preliminaryProjectId && this.confirmedProjects.has(preliminaryProjectId))
              || this.pendingBrief
              || (!preliminaryProjectId && this.confirmedProjects.size > 0 && (params.arguments?.checkpointFile || params.arguments?.captionBaselineFile)),
            );
        if (!canProceedBeforeFileResolve) {
          return toolResult(this.blockedBriefPayload(params.name), true);
        }
      }
      if (this.state.status !== 'connected') await this.connect();
      if (this.state.status !== 'connected') return toolResult(this.status(), true);
      if (!this.tools.some((tool) => tool.name === params.name)) return toolResult({ message: 'Unknown tool. Refresh the Machinal catalog.' }, true);
      if (this.localConfig && params.name === 'generate_assets') {
        const openRouter = await this.checkOpenRouterStatus({ force: !this.openRouter?.ready });
        if (openRouter && !openRouter.ready) {
          return toolResult({
            status: 'blocked',
            submissionState: 'not-submitted',
            deploymentMode: this.deployment.kind,
            openRouter,
            error: formatOpenRouterAlert(openRouter),
          }, true);
        }
      }
      let prepared;
      try {
        prepared = await prepareStdioToolCall(params.name, params.arguments ?? {}, {
          library: this.library,
          allowedRoots: this.allowedRoots,
          signal,
        });
      } catch (error) {
        return toolResult({ message: error.message, submissionState: 'not-submitted' }, true);
      }
      let callParams = prepared.args === params.arguments ? params : { ...params, arguments: prepared.args };
      const resolvedProjectId = callParams.arguments?.projectId;
      if (this.requireBrief && PRODUCTION_GATED_TOOLS.has(params.name) && params.name !== 'create_project') {
        const hasProjectBrief = Boolean((resolvedProjectId && this.confirmedProjects.has(resolvedProjectId)) || this.pendingBrief);
        if (!hasProjectBrief) {
          return toolResult(this.blockedBriefPayload(params.name), true);
        }
      }
      const activeBrief = (resolvedProjectId && this.confirmedProjects.get(resolvedProjectId)) || this.pendingBrief;
      if (typeof callParams.arguments?.composition === 'string') {
        try {
          if (activeBrief) {
            checkRecipeAgainstBrief(callParams.arguments.composition, activeBrief, { tool: params.name });
          }
          const knownDurations = this.projectAssetDurations(resolvedProjectId);
          if ((params.name === 'render_video' || params.name === 'render_preview')
            && resolvedProjectId
            && callParams.arguments?.userApproved === true
            && this.tools.some((tool) => tool.name === 'get_asset_metadata')) {
            await this.probeMissingAudioDurations(resolvedProjectId, callParams.arguments.composition, knownDurations, signal);
          }
          if (['validate_recipe', 'compile_recipe', 'render_video', 'render_preview', 'patch_recipe'].includes(params.name)) {
            validateAudioIntegrity(callParams.arguments.composition, { tool: params.name, knownDurations });
          }
        } catch (error) {
          return toolResult({ message: error.message, submissionState: 'not-submitted' }, true);
        }
      }
      let waitCapped = false;
      try {
        let result;
        if (params.name === 'wait_for_job') {
          const requestedWait = callParams.arguments?.timeoutSeconds;
          let effectiveWait = requestedWait;
          if (Number.isInteger(requestedWait) && requestedWait > this.maxWaitSeconds && requestedWait <= 900) {
            effectiveWait = this.maxWaitSeconds;
            waitCapped = true;
            callParams = { ...callParams, arguments: { ...callParams.arguments, timeoutSeconds: effectiveWait } };
          }
          result = Number.isInteger(effectiveWait) && effectiveWait > 120 && effectiveWait <= 900
            ? await this.waitForCompletion(callParams, effectiveWait, signal)
            : await this.rpc(method, callParams, { signal });
          if (waitCapped && !result.isError && ['queued', 'claimed', 'running'].includes(result.structuredContent?.data?.status)) {
            const updated = {
              ...result.structuredContent,
              data: {
                ...result.structuredContent.data,
                waitCappedSeconds: this.maxWaitSeconds,
                nextAction: 'Job is still running; call wait_for_job again for the same jobId without resubmitting.',
              },
            };
            result = { ...result, content: [{ type: 'text', text: JSON.stringify(updated) }], structuredContent: updated };
          }
        } else if (params.name === 'search_sound_effects') {
          result = await this.callSoundSearch(callParams, signal);
        } else {
          result = await this.rpc(method, callParams, { signal });
        }
        if ([401, 402, 403, 429].includes(result.structuredContent?.statusCode)) this.failure({ status: result.structuredContent.statusCode });
        if (!result.isError) {
          this.recordToolOutcome(params.name, callParams.arguments, result);
        }
        result = preserveMultimodalStructuredContent(result);
        return prepared.postProcess ? await prepared.postProcess(result) : result;
      } catch (error) {
        if (params.name === 'search_sound_effects' && TRANSIENT_GATEWAY_STATUSES.has(error?.status)) {
          return toolResult({ statusCode: error.status,
            message: 'Sound-effect catalog search returned a transient gateway error after one bounded retry. The MCP connection remains available; retry shortly or narrow the query.' }, true);
        }
        this.failure(error);
        return toolResult({ ...this.status(), submissionState: 'unknown',
          warning: 'No automatic retry was made. The service may have accepted the operation before the connection was lost. Recover its existing job/idempotency key before resubmitting.' }, true);
      }
    }
    if (method === 'prompts/list') return { prompts: [] };
    if (['resources/list', 'resources/templates/list', 'resources/read'].includes(method)) {
      if (method === 'resources/read') {
        const result = await this.library.resource(params.uri);
        if (result) return result;
      }
      if (this.state.status !== 'connected') await this.connect();
      if (method === 'resources/list') {
        const remote = this.state.status === 'connected' ? await this.rpc(method, params, { signal }) : { resources: [] };
        const local = this.library.resources();
        return { ...remote, resources: [...local, ...remote.resources.filter(entry => !local.some(item => item.uri === entry.uri))] };
      }
      if (method === 'resources/templates/list') {
        const remote = this.state.status === 'connected' ? await this.rpc(method, params, { signal }) : { resourceTemplates: [] };
        return { ...remote, resourceTemplates: [
          ...LIBRARY_TOPICS.map(topic => ({ name: `local-${topic}`, uriTemplate: `machinal://${topic}/{id}`, mimeType: 'application/json' })),
          ...remote.resourceTemplates,
        ] };
      }
      if (this.state.status === 'connected') return this.rpc(method, params, { signal });
      throw Object.assign(new Error('Connection unavailable'), { rpcCode: -32000 });
    }
    throw Object.assign(new Error('Method not found'), { rpcCode: -32601 });
  }
  // Keep each HTTP long poll below the hosted proxy timeout while exposing one tool call.
  async waitForCompletion(params, seconds, signal) {
    let result;
    const deadline = Date.now() + seconds * 1000;
    const progressToken = params._meta?.progressToken;
    for (let remaining = seconds; remaining > 0;) {
      const window = Math.min(120, remaining);
      result = await this.rpc('tools/call', { ...params, arguments: { ...params.arguments, timeoutSeconds: window } }, { signal });
      if (result.isError || !['queued', 'claimed', 'running'].includes(result.structuredContent?.data?.status)) break;
      remaining = Math.min(remaining - window, Math.ceil((deadline - Date.now()) / 1000));
      if (progressToken !== undefined && remaining > 0) {
        const status = result.structuredContent?.data?.status ?? 'running';
        this.notify({
          jsonrpc: '2.0',
          method: 'notifications/progress',
          params: {
            progressToken,
            progress: Math.min(seconds, seconds - remaining),
            total: seconds,
            message: `Job ${status}; continuing bounded wait`,
          },
        });
      }
    }
    return result;
  }

  // Strictly read-only free catalog search: bounded session cache + at most one retry on 502/503/504 gateway hiccups.
  async callSoundSearch(callParams, signal) {
    const key = canonicalJSON(callParams.arguments ?? {});
    const now = Date.now();
    const cached = this.soundSearchCache.get(key);
    if (cached && now - cached.storedAt < SOUND_CACHE_TTL_MS) {
      return structuredClone(cached.result);
    }
    if (cached) this.soundSearchCache.delete(key);

    const attempt = async () => this.rpc('tools/call', callParams, { signal });
    let result;
    try {
      result = await attempt();
      if (TRANSIENT_GATEWAY_STATUSES.has(result?.structuredContent?.statusCode)) {
        await abortableDelay(this.soundRetryDelayMs, signal);
        result = await attempt();
      }
    } catch (error) {
      if (!TRANSIENT_GATEWAY_STATUSES.has(error?.status)) throw error;
      await abortableDelay(this.soundRetryDelayMs, signal);
      result = await attempt();
    }
    if (!result?.isError && result?.structuredContent?.statusCode === 200) {
      this.soundSearchCache.set(key, { storedAt: Date.now(), result: structuredClone(result) });
      if (this.soundSearchCache.size > SOUND_CACHE_MAX_ENTRIES) {
        this.soundSearchCache.delete(this.soundSearchCache.keys().next().value);
      }
    }
    return result;
  }

  blockedBriefPayload(toolName) {
    return {
      status: 'blocked',
      submissionState: 'not-submitted',
      nextTool: 'confirm_brief',
      deploymentMode: this.deployment.kind,
      error: `STOP: Video brief has NOT been confirmed with the user before ${toolName}. Do NOT invent defaults (aspect ratio, duration, voice/TTS speech model, captions, or sound effects) or self-approve userApproved:true. First ask the user for ALL missing options in ONE native question form (ask_question / question): (1) platform + aspect ratio & resolution (e.g. TikTok/Reels 9:16 1080p vs YouTube 16:9 1080p), (2) approximate duration, (3) visual materials (AI-generated images vs existing media vs pure procedural 2D/3D), (4) voiceover/narration language & TTS speech model from list_speech_models (e.g. Kokoro, Gemini 3.8 Flash-Lite, Gemini 3.8 Flash), (5) captions/subtitles, (6) sound effects (separate question), and (7) explicit user approval. Wait for the user's reply, then call confirm_brief BEFORE calling ${toolName}. No action was executed.`,
    };
  }

  projectAssetDurations(projectId) {
    const key = projectId || '__default__';
    let map = this.assetDurations.get(key);
    if (!map) {
      map = new Map();
      this.assetDurations.set(key, map);
    }
    return map;
  }

  recordAssetDuration(projectId, file, id, duration) {
    const seconds = typeof duration === 'number' ? duration : Number(duration);
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    const map = this.projectAssetDurations(projectId);
    if (file) map.set(String(file), seconds);
    if (id) map.set(String(id), seconds);
  }

  recordToolOutcome(toolName, args, result) {
    const payload = result?.structuredContent ?? (() => {
      const text = result?.content?.find((part) => part?.type === 'text')?.text;
      if (!text) return null;
      try { return JSON.parse(text); } catch { return null; }
    })();
    const data = payload?.data;
    if (!data) return;

    if (toolName === 'create_project' && typeof data.id === 'string' && data.id) {
      if (this.pendingBrief) {
        this.confirmedProjects.set(data.id, { ...this.pendingBrief, projectId: data.id });
        this.pendingBrief = null;
      }
      return;
    }

    const projectId = args?.projectId;
    if (!projectId) return;

    if (toolName === 'get_asset_metadata' && Array.isArray(data)) {
      for (const item of data) {
        if (item && typeof item === 'object') {
          this.recordAssetDuration(projectId, item.file, item.id, item.duration);
        }
      }
      return;
    }

    if (toolName === 'compile_scene' && data.asset && typeof data.asset === 'object') {
      this.recordAssetDuration(projectId, data.asset.file, data.asset.id, data.asset.duration);
      return;
    }

    const assetLists = [data.assets, data.composition?.assets, data.recovery?.assets].filter(Array.isArray);
    for (const list of assetLists) {
      for (const item of list) {
        if (item && typeof item === 'object') {
          this.recordAssetDuration(projectId, item.file, item.id, item.duration);
        }
      }
    }
    if (typeof data.recipeYaml === 'string') {
      const parsed = inspectRecipeTimeline(data.recipeYaml);
      for (const item of parsed.assets) {
        if (item.duration !== null) this.recordAssetDuration(projectId, item.file, item.id, item.duration);
      }
    }
  }

  async probeMissingAudioDurations(projectId, composition, knownDurations, signal) {
    const { assets, tracks } = inspectRecipeTimeline(composition);
    if (!tracks.length) return;
    const assetsById = new Map(assets.filter((a) => a.id).map((a) => [a.id, a]));
    const toProbe = [];
    const seenFiles = new Set();

    for (const track of tracks) {
      if (track.hidden || track.muted || String(track.type ?? '').toLowerCase() !== 'audio') continue;
      for (const clip of track.clips) {
        const asset = assetsById.get(clip.assetId);
        const file = asset?.file || clip.assetId;
        if (!file || seenFiles.has(file)) continue;
        if (asset?.duration !== null && asset?.duration !== undefined) continue;
        if (knownDurations.has(file) || knownDurations.has(clip.assetId)) continue;
        seenFiles.add(file);
        toProbe.push({ id: clip.assetId || file, file });
      }
    }
    if (!toProbe.length) return;

    try {
      const metaResult = await this.rpc('tools/call', {
        name: 'get_asset_metadata',
        arguments: { projectId, files: toProbe, userApproved: true },
      }, { signal, timeout: 15_000 });
      if (!metaResult?.isError) {
        this.recordToolOutcome('get_asset_metadata', { projectId }, metaResult);
      }
    } catch {
      // Best-effort read-only metadata probe; never mask or fail on unavailable metadata endpoints.
    }
  }
}

function canonicalJSON(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJSON).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonicalJSON(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function abortableDelay(ms, signal) {
  if (!ms || ms <= 0) {
    signal?.throwIfAborted();
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason); return; }
    const onAbort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', onAbort); resolve(); }, ms);
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

function stripInlineImagePayloads(value) {
  if (Array.isArray(value)) return value.map(stripInlineImagePayloads);
  if (!value || typeof value !== 'object') return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (['data', 'base64', 'imageBase64', 'pngBase64', 'jpegBase64'].includes(key) && typeof item === 'string' && item.length > 256) continue;
    out[key] = stripInlineImagePayloads(item);
  }
  return out;
}

function preserveMultimodalStructuredContent(result) {
  if (!result || typeof result !== 'object' || !result.structuredContent || typeof result.structuredContent !== 'object') return result;
  if (!Array.isArray(result.content) || !result.content.some(part => part?.type === 'image')) return result;
  const alreadyHasStructuredJson = result.content.some(part => {
    if (part?.type !== 'text' || typeof part.text !== 'string') return false;
    const trimmed = part.text.trim();
    if (!trimmed.startsWith('{')) return false;
    try {
      const parsed = JSON.parse(trimmed);
      return Boolean(parsed && typeof parsed === 'object' && ('statusCode' in parsed || 'data' in parsed));
    } catch {
      return false;
    }
  });
  if (alreadyHasStructuredJson) return result;
  const sanitized = stripInlineImagePayloads(result.structuredContent);
  return {
    ...result,
    content: [...result.content, { type: 'text', text: JSON.stringify(sanitized) }],
  };
}

function validTools(tools) {
  if (!Array.isArray(tools)) throw new Error('Invalid catalog');
  return tools.filter((tool) => tool && typeof tool.name === 'string' && /^[\w-]{1,64}$/.test(tool.name) && tool.name !== STATUS_TOOL.name && tool.name !== SWITCH_MODE_TOOL.name)
    .map((tool) => ({ ...tool, inputSchema: tool.inputSchema ?? { type: 'object' } }));
}

function toolResult(value, isError = false) {
  return { content: [{ type: 'text', text: JSON.stringify(value) }], structuredContent: value, ...(isError ? { isError: true } : {}) };
}

export async function serveBridge(options, { input = process.stdin, output = process.stdout, refreshMs = 15_000, ...runtime } = {}) {
  const lifetime = new AbortController();
  const send = (message) => { if (!lifetime.signal.aborted) output.write(`${JSON.stringify(message)}\n`); };
  const bridge = new MCPBridge({ ...options, ...runtime, signal: lifetime.signal, notify: send });
  await bridge.loadCatalog();
  const calls = new Map();
  const scheduler = new RequestScheduler();
  let buffer = Buffer.alloc(0);
  const refresh = setInterval(() => {
    void (async () => {
      if (options.followModeOverride) {
        try {
          const settings = await readSettings({ env: bridge.env, home: bridge.home });
          const override = settings.activeModeOverride;
          if (override?.url) {
            const wantLocal = override.mode === 'local';
            if (Boolean(bridge.localConfig) !== wantLocal || bridge.url !== override.url) {
              await bridge.switchMode({ mode: wantLocal ? 'local' : 'cloud', url: override.url }, { persist: false });
              return;
            }
          }
        } catch { /* Ignore transient settings read errors during background refresh. */ }
      }
      if (bridge.state.status !== 'connected' || await bridge.credentials() !== bridge.key) await bridge.connect();
    })().catch(() => {});
  }, refreshMs);
  const receive = async (message) => {
    if (message?.method === 'notifications/cancelled') { calls.get(message.params?.requestId)?.abort(); return; }
    if (message?.id === undefined) return;
    const id = message.id;
    if (message.jsonrpc !== '2.0' || typeof message.method !== 'string' || !['string', 'number'].includes(typeof id)) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32600, message: 'Invalid request' } }); return;
    }
    if (calls.has(id)) { send({ jsonrpc: '2.0', id, error: { code: -32600, message: 'Duplicate active request ID' } }); return; }
    if (calls.size >= MAX_PENDING_REQUESTS) { send({ jsonrpc: '2.0', id, error: { code: -32000, message: 'Request capacity reached; no operation was submitted', data: { retryAfter: 1, submissionState: 'not-submitted' } } }); return; }
    const controller = new AbortController();
    calls.set(id, controller);
    try {
      const result = await scheduler.run(requestClass(message.method, message.params, bridge.tools),
        () => bridge.handle(message.method, message.params, controller.signal), controller.signal);
      send({ jsonrpc: '2.0', id, result });
    } catch (error) {
      send({ jsonrpc: '2.0', id, error: { code: error.rpcCode ?? -32603,
        message: error.submissionState === 'not-submitted' ? 'Request queue is full; no operation was submitted' : controller.signal.aborted ? 'Request cancelled' : error.rpcCode === -32601 ? 'Method not found' : 'Could not process the request. Use connection_status.',
        ...(error.submissionState ? { data: { retryAfter: error.retryAfter, submissionState: error.submissionState } } : {}),
      } });
    } finally { calls.delete(id); }
  };
  try {
    for await (const chunk of input) {
      buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
      let end;
      while ((end = buffer.indexOf(10)) >= 0) {
        const line = buffer.subarray(0, end);
        buffer = buffer.subarray(end + 1);
        if (line.length > MAX_REQUEST) throw new Error('Request too large');
        if (!line.toString('utf8').trim()) continue;
        try { void receive(JSON.parse(line.toString('utf8'))); } catch {
          send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
        }
      }
      if (buffer.length > MAX_REQUEST) throw new Error('Request too large');
    }
  } finally {
    clearInterval(refresh);
    lifetime.abort();
    for (const controller of calls.values()) controller.abort();
  }
  return 0;
}
