import assert from 'node:assert/strict';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import test from 'node:test';
import { MCPBridge, SWITCH_MODE_TOOL } from '../src/bridge.mjs';
import { run } from '../src/cli.mjs';
import { installOpenCodeAuth } from '../src/opencode-auth.mjs';
import { inspectLocalOpenRouter } from '../src/openrouter.mjs';
import { endpointFiles } from '../src/runtime.mjs';
import { readSettings } from '../src/settings.mjs';
import { API_KEY, mcpHandler, memoryCredentialStore, reply, requestBody, serve, workspace } from './helpers.mjs';

const VALID_OPENROUTER_KEY = `sk-or-v1-${'a'.repeat(64)}`;
const BAD_OPENROUTER_KEY = `sk-or-v1-${'0'.repeat(64)}`;
const LOCAL_TOKEN = `local_${'9'.repeat(64)}`;

async function localServer(t, { configured = false, tools = [
  { name: 'list_projects' },
  { name: 'get_recipe_schema' },
  { name: 'generate_assets', description: 'Generate assets.' },
], onOpenRouterPost, onToolCall } = {}) {
  let stateConfigured = configured;
  const endpoint = await serve(t, async (request, response) => {
    if (request.url === '/settings/openrouter' && request.method === 'GET') {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ configured: stateConfigured }));
      return;
    }
    if (request.url === '/settings/openrouter' && request.method === 'POST') {
      const body = await requestBody(request);
      onOpenRouterPost?.(body);
      stateConfigured = Boolean(body?.apiKey);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ configured: stateConfigured }));
      return;
    }
    const body = await requestBody(request);
    if (body.method === 'initialize') return reply(response, body, { protocolVersion: '2025-11-25', serverInfo: { name: 'machinal-local' } });
    if (body.method === 'notifications/initialized') return response.writeHead(202).end();
    if (body.method === 'tools/list') return reply(response, body, { tools });
    if (body.method === 'tools/call') {
      onToolCall?.(body.params);
      return reply(response, body, { content: [{ type: 'text', text: '{"statusCode":200,"data":{"ok":true}}' }], structuredContent: { statusCode: 200, data: { ok: true } } });
    }
    response.writeHead(400).end();
  });
  return {
    endpoint,
    setConfigured(value) { stateConfigured = value; },
  };
}

test('inspectLocalOpenRouter distinguishes missing, invalid, unavailable, backend_unconfigured, configured and valid without leaking keys', async (t) => {
  const cwd = await workspace(t);
  const { endpoint, setConfigured } = await localServer(t, { configured: false });
  const localConfig = join(cwd, 'providers.env');

  // 1. Missing key in profile + backend unconfigured
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\n`);
  const missing = await inspectLocalOpenRouter({ localConfig, endpoint });
  assert.equal(missing.ready, false);
  assert.equal(missing.status, 'missing');
  assert.equal(missing.backendConfigured, false);
  assert.match(missing.setupInstructions, /https:\/\/openrouter\.ai\/keys/);
  assert.match(missing.setupInstructions, /machinal key openrouter/);
  assert.ok(Array.isArray(missing.howToSet) && missing.howToSet.length >= 3);

  // 2. Key missing from profile, but configured directly in local backend (e.g., Studio UI)
  setConfigured(true);
  const configured = await inspectLocalOpenRouter({ localConfig, endpoint });
  assert.equal(configured.ready, true);
  assert.equal(configured.status, 'configured');
  assert.equal(configured.backendConfigured, true);

  // 3. Invalid key rejected by OpenRouter
  setConfigured(false);
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\nOPENROUTER_API_KEY='${BAD_OPENROUTER_KEY}'\n`);
  const invalid = await inspectLocalOpenRouter({
    localConfig,
    endpoint,
    verifyOpenRouterKey: async () => ({ status: 'invalid', httpStatus: 401, message: 'OpenRouter rejected this API key.' }),
  });
  assert.equal(invalid.ready, false);
  assert.equal(invalid.status, 'invalid');
  assert.equal(invalid.httpStatus, 401);
  assert.match(invalid.setupInstructions, /machinal key openrouter/);
  assert.ok(!JSON.stringify(invalid).includes(BAD_OPENROUTER_KEY));

  // 4. OpenRouter unreachable
  const unavailable = await inspectLocalOpenRouter({
    localConfig,
    endpoint,
    verifyOpenRouterKey: async () => ({ status: 'unavailable', message: 'Could not reach OpenRouter.' }),
  });
  assert.equal(unavailable.ready, false);
  assert.equal(unavailable.status, 'unavailable');
  assert.match(unavailable.message, /Cannot connect to OpenRouter/i);
  assert.ok(!JSON.stringify(unavailable).includes(BAD_OPENROUTER_KEY));

  // 5. Valid key in profile, but running local backend has configured: false
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\nOPENROUTER_API_KEY='${VALID_OPENROUTER_KEY}'\n`);
  const backendUnconfigured = await inspectLocalOpenRouter({
    localConfig,
    endpoint,
    verifyOpenRouterKey: async () => ({ status: 'valid' }),
  });
  assert.equal(backendUnconfigured.ready, false);
  assert.equal(backendUnconfigured.status, 'backend_unconfigured');
  assert.equal(backendUnconfigured.backendConfigured, false);
  assert.ok(!JSON.stringify(backendUnconfigured).includes(VALID_OPENROUTER_KEY));

  // 6. Valid key in profile + running backend configured
  setConfigured(true);
  const valid = await inspectLocalOpenRouter({
    localConfig,
    endpoint,
    verifyOpenRouterKey: async () => ({ status: 'valid' }),
  });
  assert.equal(valid.ready, true);
  assert.equal(valid.status, 'valid');
  assert.equal(valid.backendConfigured, true);
  assert.ok(!JSON.stringify(valid).includes(VALID_OPENROUTER_KEY));
});

test('local MCPBridge reports OpenRouter blockers at the start in connection_status, production_quickstart, and blocks generate_assets until configured', async (t) => {
  const cwd = await workspace(t);
  const upstreamToolCalls = [];
  const { endpoint, setConfigured } = await localServer(t, {
    configured: false,
    onToolCall: (params) => upstreamToolCalls.push(params.name),
  });
  const localConfig = join(cwd, 'providers.env');
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\n`);

  const bridge = new MCPBridge({
    url: endpoint,
    localConfig,
    env: {},
    credentialStore: null,
    requireBrief: false,
    verifyOpenRouterKey: async (key) => ({ status: key === VALID_OPENROUTER_KEY ? 'valid' : 'invalid', message: 'Rejected.' }),
  });

  // initialize instructions tell agent to check OpenRouter at the start
  const init = await bridge.handle('initialize', { protocolVersion: '2025-11-25' });
  assert.match(init.instructions, /OpenRouter/i);
  assert.match(init.instructions, /machinal key openrouter/);

  // connection_status immediately surfaces missing OpenRouter key + how to set it
  const statusRes = (await bridge.handle('tools/call', { name: 'connection_status', arguments: { action: 'status' } })).structuredContent;
  assert.equal(statusRes.status, 'connected');
  assert.equal(statusRes.openRouter.ready, false);
  assert.equal(statusRes.openRouter.status, 'missing');
  assert.match(statusRes.openRouterWarning, /OPENROUTER KEY NOT READY/i);
  assert.match(statusRes.openRouterWarning, /https:\/\/openrouter\.ai\/keys/);
  assert.match(statusRes.nextAction, /OPENROUTER KEY NOT READY/i);
  assert.match(statusRes.nextAction, /machinal key openrouter/);

  // production_quickstart surfaces Step 0 + openRouterWarning right at the start of a video run
  const quickstartRes = (await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create', includeBriefGuide: false } })).structuredContent.data;
  assert.equal(quickstartRes.openRouter.ready, false);
  assert.match(quickstartRes.openRouterWarning, /OPENROUTER KEY NOT READY/i);
  assert.match(quickstartRes.stageChecklist[0], /^0\. OPENROUTER KEY NOT READY/);
  assert.match(quickstartRes.guide, /WARNING — OpenRouter key not ready/);
  assert.match(quickstartRes.guide, /machinal key openrouter/);

  // generate_assets fails immediately before submitting upstream with setup instructions
  const blockedGen = await bridge.handle('tools/call', { name: 'generate_assets', arguments: { projectId: 'p1', userApproved: true } });
  assert.equal(blockedGen.isError, true);
  assert.equal(blockedGen.structuredContent.status, 'blocked');
  assert.equal(blockedGen.structuredContent.submissionState, 'not-submitted');
  assert.equal(blockedGen.structuredContent.openRouter.status, 'missing');
  assert.match(blockedGen.structuredContent.error, /machinal key openrouter/);
  assert.deepEqual(upstreamToolCalls, []);

  // Once the user configures a valid key and backend reports configured: true, status, quickstart, and generate_assets clear immediately
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\nOPENROUTER_API_KEY='${VALID_OPENROUTER_KEY}'\n`);
  setConfigured(true);

  const healthyStatus = (await bridge.handle('tools/call', { name: 'connection_status', arguments: { action: 'status' } })).structuredContent;
  assert.equal(healthyStatus.openRouter.ready, true);
  assert.equal(healthyStatus.openRouterWarning, undefined);
  assert.ok(!JSON.stringify(healthyStatus).includes(VALID_OPENROUTER_KEY));

  const healthyQuickstart = (await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create', includeBriefGuide: false } })).structuredContent.data;
  assert.equal(healthyQuickstart.openRouter.ready, true);
  assert.equal(healthyQuickstart.openRouterWarning, undefined);
  assert.doesNotMatch(healthyQuickstart.stageChecklist[0], /^0\. OPENROUTER/);

  const okGen = await bridge.handle('tools/call', { name: 'generate_assets', arguments: { projectId: 'p1', userApproved: true } });
  assert.equal(okGen.isError, undefined);
  assert.deepEqual(upstreamToolCalls, ['generate_assets']);
});

test('machinal local status, local install sync, and doctor report OpenRouter setup steps upfront', async (t) => {
  const home = await workspace(t);
  const syncedKeys = [];
  const { endpoint, setConfigured } = await localServer(t, {
    configured: false,
    onOpenRouterPost: (body) => syncedKeys.push(body.apiKey),
  });
  const logs = [];
  const ctx = {
    cwd: home,
    home,
    env: {},
    platform: 'linux',
    interactive: false,
    log: (msg) => logs.push(msg),
    verifyOpenRouterKey: async (key) => ({ status: key === VALID_OPENROUTER_KEY ? 'valid' : 'invalid', message: 'OpenRouter rejected this API key.' }),
  };
  const { localConfig } = endpointFiles(endpoint, ctx);
  await mkdir(dirname(localConfig), { recursive: true });
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\nOPENROUTER_API_KEY='${VALID_OPENROUTER_KEY}'\n`);

  // local status catches backend_unconfigured and prints exact how-to-set instructions
  assert.equal(await run(['local', 'status', '--url', endpoint], ctx), 1);
  const statusOutput = logs.join('\n');
  assert.match(statusOutput, /OpenRouter is not ready \(backend_unconfigured\)/);
  assert.match(statusOutput, /How to set your OpenRouter API key:/);
  assert.match(statusOutput, /https:\/\/openrouter\.ai\/keys/);
  assert.match(statusOutput, /machinal key openrouter/);
  assert.ok(!statusOutput.includes(VALID_OPENROUTER_KEY));

  // doctor also returns exit code 1 when OpenRouter is not ready on local
  assert.equal(await run(['doctor', '--url', endpoint, '--local-config', localConfig], {
    env: {},
    credentialStore: null,
    verifyOpenRouterKey: ctx.verifyOpenRouterKey,
  }), 1);

  // local install automatically syncs the valid profile key to the running local backend
  logs.length = 0;
  assert.equal(await run(['local', 'install', '--url', endpoint], ctx), 0);
  assert.deepEqual(syncedKeys, [VALID_OPENROUTER_KEY]);
  assert.match(logs.join('\n'), /Synced saved OpenRouter API key to the running local backend/);

  // Now local status and doctor both pass with exit code 0
  logs.length = 0;
  assert.equal(await run(['local', 'status', '--url', endpoint], ctx), 0);
  assert.match(logs.join('\n'), /Local backend: ready/);
  assert.equal(await run(['doctor', '--url', endpoint, '--local-config', localConfig], {
    env: {},
    credentialStore: null,
    verifyOpenRouterKey: ctx.verifyOpenRouterKey,
  }), 0);

  // If OpenRouter becomes unreachable, local status fails and explains how to check/set it
  setConfigured(true);
  logs.length = 0;
  assert.equal(await run(['local', 'status', '--url', endpoint], {
    ...ctx,
    verifyOpenRouterKey: async () => ({ status: 'unavailable', message: 'Could not reach OpenRouter.' }),
  }), 1);
  assert.match(logs.join('\n'), /OpenRouter is not ready \(unavailable\)/);
  assert.match(logs.join('\n'), /How to set your OpenRouter API key:/);
});

test('local OpenCode companion surfaces OpenRouter blockers in machinal_connection, machinal_quickstart and machinal_prepare_video', async (t) => {
  const cwd = await workspace(t);
  const endpoint = 'http://127.0.0.1:8080/mcp';
  const localConfig = join(cwd, 'providers.env');
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\n`);
  const command = [process.execPath, join(cwd, 'machinal-stdio.mjs'), 'serve', '--url', endpoint, '--local-config', localConfig];
  const current = new Map([['machinal', { type: 'local', command }]]);
  const addedTools = new Map();
  const hooks = [];
  const ctx = {
    options: { servers: { machinal: endpoint }, commands: { machinal: command }, localConfigs: { machinal: localConfig } },
    mcp: {
      transform: async (fn) => fn({ get: (name) => current.get(name), update: (name, u) => u(current.get(name)), remove: (name) => current.delete(name) }),
      reload: async () => {},
      list: async () => ({ data: [{ name: 'machinal', status: { status: 'connected' } }] }),
    },
    tool: { transform: async (fn) => fn({ add: (def) => addedTools.set(def.name, def), update: () => {} }) },
    session: { hook: async (_, fn) => hooks.push(fn) },
    permission: { assert: async () => {} },
    skill: { list: async () => [{ id: 'machinal-editing', content: 'edit' }, { id: 'machinal-cinema', content: 'cinema' }] },
  };

  t.after(await installOpenCodeAuth(ctx, {
    env: {},
    credentialStore: null,
    inspectOpenRouter: async () => ({
      status: 'missing',
      ready: false,
      backendConfigured: false,
      profileKeyPresent: false,
      message: 'No OpenRouter API key is configured for local mode.',
      howToSet: ['Get a key at https://openrouter.ai/keys', 'Run machinal local install --configure-local'],
      setupInstructions: 'Get an active OpenRouter API key from https://openrouter.ai/keys, then run `machinal local install --configure-local`.',
    }),
  }));

  const conn = JSON.parse((await addedTools.get('machinal_connection').execute({ action: 'status' }, { signal: new AbortController().signal, progress: async () => {} })).content);
  assert.equal(conn.openRouter.ready, false);
  assert.match(conn.openRouterWarning, /OPENROUTER KEY NOT READY/i);
  assert.match(conn.openRouterWarning, /machinal local install --configure-local/);

  const quickstart = JSON.parse((await addedTools.get('machinal_quickstart').execute({ purpose: 'create', includeBriefGuide: false }, {})).content);
  assert.equal(quickstart.data.openRouter.ready, false);
  assert.match(quickstart.data.openRouterWarning, /OPENROUTER KEY NOT READY/i);
  assert.match(quickstart.data.stageChecklist[0], /^0\. OPENROUTER KEY NOT READY/);

  const prepared = JSON.parse((await addedTools.get('machinal_prepare_video').execute({ purpose: 'create' }, { sessionID: 's1', agent: 'a1', messageID: 'm1', id: 't1' })).content);
  assert.equal(prepared.openRouter.ready, false);
  assert.match(prepared.openRouterWarning, /OPENROUTER KEY NOT READY/i);
  assert.match(prepared.next, /OPENROUTER KEY NOT READY/i);
  assert.match(prepared.next, /machinal local install --configure-local/);
});

test('machinal key openrouter and machinal key api verify, save, and sync keys without echoing secrets', async (t) => {
  const home = await workspace(t);
  const syncedKeys = [];
  const { endpoint: localEndpoint } = await localServer(t, {
    configured: false,
    onOpenRouterPost: (body) => syncedKeys.push(body.apiKey),
  });
  const cloudCalls = [];
  const cloudEndpoint = await serve(t, mcpHandler(cloudCalls));
  const store = memoryCredentialStore();
  const logs = [];
  const baseCtx = {
    cwd: home,
    home,
    env: {},
    platform: 'linux',
    interactive: false,
    credentialStore: store,
    log: (msg) => logs.push(msg),
    verifyOpenRouterKey: async (key) => ({ status: key === VALID_OPENROUTER_KEY ? 'valid' : 'invalid', message: 'OpenRouter rejected this API key.' }),
  };

  // 1. machinal key openrouter <key> verifies, writes local profile, syncs to running backend, and never logs the key
  assert.equal(await run(['key', 'openrouter', VALID_OPENROUTER_KEY, '--url', localEndpoint], baseCtx), 0);
  const { localConfig } = endpointFiles(localEndpoint, baseCtx, { local: true });
  const savedProfile = await readFile(localConfig, 'utf8');
  assert.ok(savedProfile.includes(`OPENROUTER_API_KEY='${VALID_OPENROUTER_KEY}'`));
  assert.deepEqual(syncedKeys, [VALID_OPENROUTER_KEY]);
  assert.match(logs.join('\n'), /synced to the running local backend/);
  assert.ok(!logs.join('\n').includes(VALID_OPENROUTER_KEY));

  // Rejected OpenRouter key fails without overwriting the working profile
  await assert.rejects(run(['key', 'openrouter', BAD_OPENROUTER_KEY, '--url', localEndpoint], baseCtx), /OpenRouter/);
  assert.ok((await readFile(localConfig, 'utf8')).includes(VALID_OPENROUTER_KEY));

  // Interactive hidden prompt for `machinal key openrouter` (without positional key)
  logs.length = 0;
  assert.equal(await run(['key', 'openrouter', '--url', localEndpoint], {
    ...baseCtx,
    interactive: true,
    ui: { password: async () => VALID_OPENROUTER_KEY },
  }), 0);
  assert.ok(!logs.join('\n').includes(VALID_OPENROUTER_KEY));

  // 2. machinal key api <key> verifies against cloud MCP and saves to credentialStore without echoing the key
  logs.length = 0;
  assert.equal(await run(['key', 'api', API_KEY, '--url', cloudEndpoint], baseCtx), 0);
  assert.equal(store.peek(), API_KEY);
  assert.match(logs.join('\n'), /Machinal API key verified and saved/);
  assert.ok(!logs.join('\n').includes(API_KEY));
  assert.ok(cloudCalls.some((c) => c.method === 'initialize'));

  // Invalid format or rejected key never overwrites the existing saved key
  await assert.rejects(run(['key', 'api', 'not-a-valid-key', '--url', cloudEndpoint], baseCtx), /application key/);
  assert.equal(store.peek(), API_KEY);
  const failingEndpoint = await serve(t, (_req, res) => { res.writeHead(401).end(); });
  const otherKey = `mach_${'b'.repeat(64)}`;
  await assert.rejects(run(['key', 'api', otherKey, '--url', failingEndpoint], baseCtx), /401/);
  assert.equal(store.peek(), API_KEY);
});

test('MCP switch_mode switches live between local and cloud, updates tools, persists mode, and reports key status immediately', async (t) => {
  const home = await workspace(t);
  const { endpoint: localEndpoint } = await localServer(t, { configured: true });
  const cloudEndpoint = await serve(t, mcpHandler([], {
    serverName: 'machinal',
    tools: [
      { name: 'list_projects' },
      { name: 'get_recipe_schema' },
      { name: 'get_credits', annotations: { readOnlyHint: true } },
    ],
  }));

  const ctx = { home, env: {} };
  const { localConfig } = endpointFiles(localEndpoint, ctx, { local: true });
  await mkdir(dirname(localConfig), { recursive: true });
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${localEndpoint}'\nMACHINAL_LOCAL_TOKEN='${LOCAL_TOKEN}'\nOPENROUTER_API_KEY='${VALID_OPENROUTER_KEY}'\n`);

  const store = memoryCredentialStore(API_KEY);
  const notifications = [];
  const bridge = new MCPBridge({
    url: localEndpoint,
    localConfig,
    home,
    env: {},
    credentialStore: store,
    notify: (msg) => notifications.push(msg),
    verifyOpenRouterKey: async () => ({ status: 'valid' }),
  });

  // Starts in local mode with switch_mode tool exposed and no get_credits
  const initialTools = (await bridge.handle('tools/list')).tools.map((tool) => tool.name);
  assert.ok(initialTools.includes(SWITCH_MODE_TOOL.name));
  assert.equal(initialTools.includes('get_credits'), false);
  assert.equal(bridge.status().mode, 'local');
  assert.equal(bridge.status().openRouter.ready, true);

  // Switch live to Cloud via MCP switch_mode
  notifications.length = 0;
  const toCloud = (await bridge.handle('tools/call', {
    name: 'switch_mode',
    arguments: { mode: 'cloud', url: cloudEndpoint },
  })).structuredContent;
  assert.equal(toCloud.switched, true);
  assert.equal(toCloud.previousMode, 'local');
  assert.equal(toCloud.mode, 'server');
  assert.equal(toCloud.status, 'connected');
  assert.equal(toCloud.persisted, true);
  assert.equal(notifications.filter((n) => n.method === 'notifications/tools/list_changed').length, 1);

  const cloudTools = (await bridge.handle('tools/list')).tools.map((tool) => tool.name);
  assert.ok(cloudTools.includes('get_credits'));
  const cloudQuickstart = (await bridge.handle('tools/call', {
    name: 'production_quickstart',
    arguments: { purpose: 'create', includeBriefGuide: false },
  })).structuredContent.data;
  assert.equal(cloudQuickstart.deploymentMode, 'custom-server');
  assert.ok(cloudQuickstart.liveBootstrapBatch.includes('get_credits'));

  const savedAfterCloud = await readSettings(ctx);
  assert.equal(savedAfterCloud.activeModeOverride.url, cloudEndpoint);
  assert.equal(savedAfterCloud.lastLocalUrl, localEndpoint);

  // Toggle live right back to Local (remembers lastLocalUrl & localConfig automatically)
  notifications.length = 0;
  const backToLocal = (await bridge.handle('tools/call', {
    name: 'switch_mode',
    arguments: { mode: 'toggle' },
  })).structuredContent;
  assert.equal(backToLocal.switched, true);
  assert.equal(backToLocal.previousMode, 'cloud');
  assert.equal(backToLocal.mode, 'local');
  assert.equal(backToLocal.endpoint, localEndpoint);
  assert.equal(backToLocal.status, 'connected');
  assert.equal(backToLocal.openRouter.ready, true);
  assert.equal(notifications.filter((n) => n.method === 'notifications/tools/list_changed').length, 1);

  const localToolsAgain = (await bridge.handle('tools/list')).tools.map((tool) => tool.name);
  assert.equal(localToolsAgain.includes('get_credits'), false);

  // Switching to Cloud without a saved Machinal API key tells user to run `machinal key api`
  await store.delete();
  const cloudNoKey = (await bridge.handle('tools/call', {
    name: 'switch_mode',
    arguments: { mode: 'cloud' },
  })).structuredContent;
  assert.equal(cloudNoKey.status, 'login_required');
  assert.match(cloudNoKey.nextAction, /machinal key api/);

  // CLI `machinal mode` toggles and reports active mode cleanly
  const modeLogs = [];
  const modeCtx = {
    cwd: home,
    home,
    env: {},
    platform: 'linux',
    interactive: false,
    credentialStore: store,
    log: (m) => modeLogs.push(m),
    verifyOpenRouterKey: async () => ({ status: 'valid' }),
  };
  assert.equal(await run(['mode', 'local', '--url', localEndpoint], modeCtx), 0);
  assert.match(modeLogs.join('\n'), /Switched active Machinal mode to local/);
  assert.match(modeLogs.join('\n'), /OpenRouter status: ready/);
  assert.equal((await readSettings(ctx)).activeModeOverride.mode, 'local');
});

