import { readFile, mkdir, writeFile, lstat, rename, unlink } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { dirname } from 'node:path';
import { parseEnv } from 'node:util';
import { normalizeEndpoint, validateAPIKey, isLoopbackEndpoint } from './connection.mjs';
import { createCredentialStore } from './credential-store.mjs';
import { VERSION } from './version.mjs';
import { MACHINAL_SERVER_URL } from './endpoints.mjs';
import { RequestScheduler, requestClass, requestLimits } from './request-scheduler.mjs';
import { SceneLibrary, LIBRARY_TOOLS, LIBRARY_TOPICS, LIBRARY_INSTRUCTIONS } from './scene-library.mjs';
import { decorateStdioTool, parseAllowedRoots, prepareStdioToolCall } from './stdio-files.mjs';

const MAX_REQUEST = 4 * 1024 * 1024;
const MAX_RESPONSE = 2 * 1024 * 1024;
const MAX_PENDING_REQUESTS = 64;
const DEFAULT_MAX_WAIT_SECONDS = 120;
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
  constructor({ url, localConfig, catalogFile, env = process.env, credentialStore = createCredentialStore({ env }), fetchImpl = fetch, signal, notify = () => {}, maxWaitSeconds, fileRoots }) {
    this.url = normalizeEndpoint(url);
    this.localConfig = localConfig;
    this.catalogFile = catalogFile;
    this.env = env;
    this.credentialStore = credentialStore;
    this.fetch = fetchImpl;
    this.signal = signal;
    this.notify = notify;
    this.maxWaitSeconds = parseMaxWaitSeconds(maxWaitSeconds, env);
    this.allowedRoots = parseAllowedRoots(fileRoots, env);
    this.tools = [];
    this.state = { status: 'unchecked', message: 'Connection has not been checked.' };
    this.nextID = 0;
    this.key = null;
    this.library = new SceneLibrary();
  }

  status() {
    return { ...this.state, transport: 'connected', mode: this.localConfig ? 'local' : 'server', endpoint: this.url,
      requestConcurrency: requestLimits,
      maxWaitSeconds: this.maxWaitSeconds,
      credentialSource: this.credentialSource ?? 'unchecked',
      ...(this.localConfig ? {} : { credentialStore: this.credentialStore?.description ?? { supported: false } }),
      service: this.localConfig ? 'Local' : this.url === MACHINAL_SERVER_URL ? 'Machinal Server' : 'Custom server',
      toolCount: this.tools.length, nextAction: this.localConfig && this.state.status !== 'connected'
        ? 'Check the saved independent local profile and Docker services. Rerun setup --mode local if its generated device token is invalid; a Machinal login is not needed.' : this.state.status === 'login_required'
        ? `Run machinal set-key --url ${this.url} in a terminal, or provide MACHINAL_API_KEY in the client environment. Never paste it in chat.`
        : this.state.status === 'connected' ? 'Ready.' : 'Check the configured API/container and network, then reconnect. Do not replace keys for network or account-access errors.' };
  }

  async loadCatalog() {
    if (!this.catalogFile) return;
    try {
      const cached = JSON.parse(await privateFile(this.catalogFile));
      if (cached.url === this.url) {
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
      const validUpstream = upstreamName === 'machinal' || (Boolean(this.localConfig) && upstreamName === 'machinal-local');
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
      if (this.catalogFile) {
        try {
          await cacheCatalog(this.catalogFile, { url: this.url, tools, instructions: this.instructions });
        } catch { /* Losing the non-secret catalog cache must not break a live connection. */ }
      }
      if (changed) this.notify({ jsonrpc: '2.0', method: 'notifications/tools/list_changed' });
    } catch (error) { this.failure(error); }
    return this.status();
  }

  async handle(method, params = {}, signal) {
    if (method === 'initialize') return {
      protocolVersion: CLIENT_VERSIONS.includes(params.protocolVersion) ? params.protocolVersion : PROTOCOL,
      serverInfo: { name: 'machinal', version: VERSION }, capabilities: { tools: { listChanged: true }, resources: {} },
      instructions: ['Machinal MCP adapter. Call connection_status to distinguish login required, account restrictions or network problems. Never request keys in chat. Reconnect only retries free discovery, never jobs. Recover existing job IDs before retrying any ambiguous submission. User approval is still required for media access, generation, rendering and downloads.',
         this.localConfig ? 'Independent local profile: no Machinal account, subscription or credits. AI usage is billed directly to the owner\'s provider key; local rendering uses their hardware. Use storage=volume for local media; there is no configured S3 bucket. Never fabricate a hosted credit balance.' : '', this.instructions,
         (await this.library.bytes('guides/client-bootstrap.md')).toString('utf8'), LIBRARY_INSTRUCTIONS].filter(Boolean).join('\n\n'),
    };
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
        return decorateStdioTool(tool, { maxWaitSeconds: this.maxWaitSeconds });
      });
      return { tools: [STATUS_TOOL, ...LIBRARY_TOOLS, ...tools] };
    }
    if (method === 'tools/call' && params.name === STATUS_TOOL.name) {
      if (params.arguments?.action === 'reconnect' || this.state.status === 'unchecked') await this.connect();
      return toolResult(this.status());
    }
    if (method === 'tools/call') {
      if (this.library.handles(params.name, params.arguments)) return this.library.call(params.name, params.arguments);
      if (this.state.status !== 'connected') await this.connect();
      if (this.state.status !== 'connected') return toolResult(this.status(), true);
      if (!this.tools.some((tool) => tool.name === params.name)) return toolResult({ message: 'Unknown tool. Refresh the Machinal catalog.' }, true);
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
        } else {
          result = await this.rpc(method, callParams, { signal });
        }
        if ([401, 402, 403, 429].includes(result.structuredContent?.statusCode)) this.failure({ status: result.structuredContent.statusCode });
        return prepared.postProcess ? await prepared.postProcess(result) : result;
      } catch (error) {
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
}

function validTools(tools) {
  if (!Array.isArray(tools)) throw new Error('Invalid catalog');
  return tools.filter((tool) => tool && typeof tool.name === 'string' && /^[\w-]{1,64}$/.test(tool.name) && tool.name !== STATUS_TOOL.name)
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
