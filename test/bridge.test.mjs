import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PassThrough } from 'node:stream';
import test from 'node:test';
import { MCPBridge, localCredentials, serveBridge, STATUS_TOOL } from '../src/bridge.mjs';
import { MACHINAL_SERVER_URL } from '../src/endpoints.mjs';
import { API_KEY, mcpHandler, memoryCredentialStore, reply, requestBody, serve, workspace } from './helpers.mjs';

const url = 'http://127.0.0.1:1/mcp';

test('long completion wait consumes only bounded reads of the same job, emits progress and stops at terminal status', async () => {
  const notifications = [];
  const bridge = new MCPBridge({ url, env: {}, credentialStore: null, maxWaitSeconds: 900, notify: msg => notifications.push(msg) });
  bridge.state = { status: 'connected' };
  bridge.tools = [{ name: 'wait_for_job' }];
  const calls = [];
  bridge.rpc = async (method, params) => {
    calls.push(params.arguments);
    assert.equal(method, 'tools/call');
    assert.equal(params.name, 'wait_for_job');
    return { structuredContent: { data: { status: calls.length === 3 ? 'completed' : 'running' } } };
  };
  const result = await bridge.handle('tools/call', {
    name: 'wait_for_job',
    arguments: { projectId: 'p', jobId: 'j', timeoutSeconds: 300 },
    _meta: { progressToken: 'tok-1' },
  });
  assert.equal(result.structuredContent.data.status, 'completed');
  assert.deepEqual(calls.map(args => [args.jobId, args.timeoutSeconds]), [['j', 120], ['j', 120], ['j', 60]]);
  assert.equal(notifications.length, 2);
  assert.equal(notifications[0].method, 'notifications/progress');
  assert.equal(notifications[0].params.progressToken, 'tok-1');
  assert.equal(notifications[0].params.total, 300);
});

test('wait_for_job caps single calls to 120s by default to prevent MCP client transport timeouts', async () => {
  const bridge = new MCPBridge({ url, env: {}, credentialStore: null });
  bridge.state = { status: 'connected' };
  bridge.tools = [{
    name: 'wait_for_job',
    description: 'Wait up to 900s.',
    inputSchema: { type: 'object', properties: { timeoutSeconds: { type: 'integer', minimum: 1, maximum: 900 } } },
  }];
  const listed = (await bridge.handle('tools/list')).tools.find(tool => tool.name === 'wait_for_job');
  assert.equal(listed.inputSchema.properties.timeoutSeconds.maximum, 120);
  const calls = [];
  bridge.rpc = async (_method, params) => {
    calls.push(params.arguments);
    return {
      content: [{ type: 'text', text: JSON.stringify({ statusCode: 200, data: { status: 'running', jobId: 'j' } }) }],
      structuredContent: { statusCode: 200, data: { status: 'running', jobId: 'j' } },
    };
  };
  const running = await bridge.handle('tools/call', { name: 'wait_for_job', arguments: { projectId: 'p', jobId: 'j', timeoutSeconds: 900 } });
  assert.deepEqual(calls, [{ projectId: 'p', jobId: 'j', timeoutSeconds: 120 }]);
  assert.equal(running.structuredContent.data.waitCappedSeconds, 120);
  assert.match(running.structuredContent.data.nextAction, /same jobId/);
  assert.equal(JSON.parse(running.content[0].text).data.waitCappedSeconds, 120);
});

test('diagnostics distinguish the official Machinal Server from custom deployments', () => {
  const official = new MCPBridge({ url: MACHINAL_SERVER_URL, env: {}, credentialStore: null });
  official.failure({ status: 401 });
  assert.equal(official.status().service, 'Machinal Server');
  assert.ok(official.status().nextAction.includes(MACHINAL_SERVER_URL));
  const custom = new MCPBridge({ url, env: {}, credentialStore: null });
  assert.equal(custom.status().service, 'Custom server');
});

test('stdio initialization and missing-login discovery work without credentials or a reachable backend', async () => {
  const bridge = new MCPBridge({ url, env: {}, credentialStore: null, fetchImpl: () => assert.fail('No key must mean no request') });
  const initialized = await bridge.handle('initialize', { protocolVersion: '2025-11-25' });
  assert.equal(initialized.serverInfo.name, 'machinal');
  assert.equal(initialized.capabilities.tools.listChanged, true);
  const tools = (await bridge.handle('tools/list')).tools;
  assert.ok(tools.some(tool => tool.name === STATUS_TOOL.name));
  assert.ok(tools.some(tool => tool.name === 'get_library_reference'));
  assert.equal(bridge.status().status, 'login_required');
  assert.equal(bridge.status().transport, 'connected');
  assert.match(bridge.status().message, /Login required/);
  assert.deepEqual(await bridge.handle('ping'), {});
});

for (const [status, expected] of [[401, 'login_required'], [402, 'account_access_required'], [403, 'account_access_required'], [429, 'rate_limited'], [503, 'connection_unavailable']]) {
  test(`upstream HTTP ${status} does not fail the local MCP transport or leak its response`, async (t) => {
    let requests = 0;
    const endpoint = await serve(t, (_req, response) => { requests++; response.writeHead(status).end(API_KEY); });
    const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
    const state = await bridge.connect();
    assert.equal(state.status, expected);
    assert.equal(state.transport, 'connected');
    assert.equal(requests, 1);
    assert.ok(!JSON.stringify(state).includes(API_KEY));
    assert.equal((await bridge.handle('initialize')).serverInfo.name, 'machinal');
  });
}

test('network outage, invalid credentials and unreadable vault are distinguished without deleting secrets', async () => {
  const network = new MCPBridge({ url, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null, fetchImpl: async () => { throw new Error(API_KEY); } });
  assert.equal((await network.connect()).status, 'connection_unavailable');
  const invalid = new MCPBridge({ url, env: { MACHINAL_API_KEY: 'not-an-api-key' }, credentialStore: null });
  assert.equal((await invalid.connect()).status, 'login_required');
  const vault = new MCPBridge({ url, env: {}, credentialStore: { read: async () => { throw new Error(API_KEY); } } });
  assert.equal((await vault.connect()).status, 'credential_unavailable');
  for (const bridge of [network, invalid, vault]) assert.ok(!JSON.stringify(bridge.status()).includes(API_KEY));
});

test('transport overload reports bounded Retry-After without retrying the request or exposing its body', async t => {
  let calls = 0;
  const endpoint = await serve(t, (_request, response) => {
    calls++;
    response.writeHead(429, { 'Retry-After': '7' }).end(API_KEY);
  });
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
  const state = await bridge.connect();
  assert.equal(state.status, 'rate_limited');
  assert.equal(state.retryAfter, 7);
  assert.equal(calls, 1);
  assert.ok(!JSON.stringify(state).includes(API_KEY));
});

test('discovery caches the real tool schemas, forwards approvals unchanged and reconnects rotated saved keys', async (t) => {
  const calls = [];
  let submitted = 0;
  const handler = mcpHandler(calls);
  const endpoint = await serve(t, async (request, response) => {
    const body = await requestBody(request);
    if (body.method === 'tools/call' && body.params.name === 'list_projects') {
      submitted++;
      assert.equal(body.params.arguments.userApproved, true);
      reply(response, body, { content: [{ type: 'text', text: 'ok' }] });
      return;
    }
    request[Symbol.asyncIterator] = async function* () { yield Buffer.from(JSON.stringify(body)); };
    return handler(request, response);
  });
  const cwd = await workspace(t);
  const store = memoryCredentialStore(API_KEY);
  const notifications = [];
  const bridge = new MCPBridge({ url: endpoint, env: {}, credentialStore: store, catalogFile: join(cwd, 'catalog.json'), notify: (message) => notifications.push(message) });
  assert.equal((await bridge.connect()).status, 'connected');
  assert.ok((await bridge.handle('tools/list')).tools.some((tool) => tool.name === 'get_recipe_schema'));
  assert.equal(notifications[0].method, 'notifications/tools/list_changed');
  assert.ok(!(await readFile(join(cwd, 'catalog.json'), 'utf8')).includes(API_KEY));
  await bridge.handle('tools/call', { name: 'list_projects', arguments: { userApproved: true } });
  assert.equal(submitted, 1);
  const replacement = `mach_${'b'.repeat(64)}`;
  await store.write(replacement);
  assert.equal((await bridge.handle('tools/call', { name: 'connection_status', arguments: { action: 'reconnect' } })).structuredContent.status, 'connected');
  assert.equal(calls.at(-1).headers.authorization, `Bearer ${replacement}`);
  const offline = new MCPBridge({ url: endpoint, env: {}, credentialStore: null, catalogFile: join(cwd, 'catalog.json') });
  await offline.loadCatalog();
  assert.ok((await offline.handle('tools/list')).tools.some((tool) => tool.name === 'get_recipe_schema'));
  assert.equal(offline.status().status, 'login_required');
});

test('a failed submitted operation is never retried automatically and reports ambiguous acceptance', async (t) => {
  let calls = 0;
  const endpoint = await serve(t, async (request, response) => {
    const body = await requestBody(request);
    if (body.method === 'initialize') return reply(response, body, { protocolVersion: '2025-11-25', serverInfo: { name: 'machinal' } });
    if (body.method === 'notifications/initialized') return response.writeHead(202).end();
    if (body.method === 'tools/list') return reply(response, body, { tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'render_video' }] });
    calls++;
    request.socket.destroy();
  });
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
  await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'edit', includeBriefGuide: false } });
  const result = await bridge.handle('tools/call', { name: 'render_video', arguments: { userApproved: true, idempotencyKey: 'keep-me' } });
  assert.equal(calls, 1);
  assert.equal(result.isError, true);
  assert.equal(result.structuredContent.submissionState, 'unknown');
  assert.match(result.structuredContent.warning, /No automatic retry/);
});

test('credentials never follow HTTP redirects and local provider keys never become remote API headers', async (t) => {
  let redirected = 0;
  const target = await serve(t, (_req, response) => { redirected++; response.end(); });
  const endpoint = await serve(t, (_req, response) => response.writeHead(307, { Location: target }).end());
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
  assert.equal((await bridge.connect()).status, 'connection_unavailable');
  assert.equal(redirected, 0);
  const cwd = await workspace(t);
  const file = join(cwd, 'providers.env');
  const token = `local_${'c'.repeat(64)}`;
  await writeFile(file, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='${token}'\nOPENROUTER_API_KEY='provider-secret'\n`);
  assert.equal(await localCredentials(file, endpoint), token);
  await assert.rejects(localCredentials(file, 'https://api.example/mcp'));
  await assert.rejects(localCredentials(file, target));
});

test('the actual stdio process uses JSON-RPC-only stdout, starts without login and exits on stdin close', async (t) => {
  const script = fileURLToPath(new URL('../bin/machinal-stdio.mjs', import.meta.url));
  const child = spawn(process.execPath, [script, 'serve', '--url', url], {
    env: { ...process.env, MACHINAL_API_KEY: 'invalid-test-key', DIRECTION_API_KEY: '' }, stdio: ['pipe', 'pipe', 'pipe'],
  });
  t.after(() => child.kill());
  let buffer = '';
  let stderr = '';
  const messages = [];
  let complete;
  const responses = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('stdio timed out')), 5000);
    complete = () => { clearTimeout(timer); resolve(); };
  });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.stdout.on('data', (chunk) => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      messages.push(JSON.parse(buffer.slice(0, end)));
      buffer = buffer.slice(end + 1);
      if (messages.filter((message) => message.id).length === 3) complete();
    }
  });
  const exited = new Promise((resolve) => child.once('close', resolve));
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25' } })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list' })}\n`);
  child.stdin.write(`${JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'connection_status' } })}\n`);
  await responses;
  child.stdin.end();
  assert.equal(await exited, 0);
  assert.equal(stderr, '');
  assert.equal(messages.find((message) => message.id === 3).result.structuredContent.status, 'login_required');
});

test('actual stdio dispatch serves metadata while eight long waits run and cancels a ninth before submission', { timeout: 10_000 }, async t => {
  const gate = Promise.withResolvers();
  const waiting = Promise.withResolvers();
  let submitted = 0;
  const endpoint = await serve(t, async (request, response) => {
    const body = await requestBody(request);
    if (body.method === 'initialize') return reply(response, body, { protocolVersion: '2025-11-25', serverInfo: { name: 'machinal' } });
    if (body.method === 'notifications/initialized') return response.writeHead(202).end();
    if (body.method === 'tools/list') return reply(response, body, { tools: [
      { name: 'list_projects', annotations: { readOnlyHint: true } },
      { name: 'get_recipe_schema', annotations: { readOnlyHint: true } },
      { name: 'wait_for_job', annotations: { readOnlyHint: true } },
    ] });
    if (body.params.name === 'wait_for_job') {
      submitted++;
      if (submitted === 8) waiting.resolve();
      await gate.promise;
    }
    return reply(response, body, { content: [{ type: 'text', text: 'ok' }] });
  });
  const input = new PassThrough();
  const output = new PassThrough();
  const pending = new Map();
  const received = new Map();
  let buffer = '';
  output.on('data', chunk => {
    buffer += chunk;
    let end;
    while ((end = buffer.indexOf('\n')) >= 0) {
      const message = JSON.parse(buffer.slice(0, end));
      buffer = buffer.slice(end + 1);
      received.set(message.id, message);
      pending.get(message.id)?.resolve(message);
    }
  });
  const result = id => {
    if (received.has(id)) return Promise.resolve(received.get(id));
    if (!pending.has(id)) pending.set(id, Promise.withResolvers());
    return pending.get(id).promise;
  };
  const send = (id, method, params) => input.write(`${JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, params })}\n`);
  const running = serveBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null }, { input, output });
  t.after(async () => { gate.resolve(); input.end(); await running; });
  send(1, 'tools/list', {});
  await result(1);
  for (let index = 0; index < 9; index++) send(index + 10, 'tools/call', { name: 'wait_for_job' });
  await waiting.promise;
  send(undefined, 'notifications/cancelled', { requestId: 18 });
  const cancelled = await result(18);
  assert.match(cancelled.error.message, /cancelled/);
  send(30, 'tools/call', { name: 'get_recipe_schema' });
  assert.ok((await result(30)).result);
  assert.equal(submitted, 8);
  gate.resolve();
  await Promise.all(Array.from({ length: 8 }, (_, index) => result(index + 10)));
});

test('stdio bridge supports local recipe, checkpoint, contract and Svelte componentFile without echoing large YAML', async t => {
  const cwd = await workspace(t);
  const outside = await workspace(t);
  const recipe = 'document:\n  version: 2\n  texts:\n    - text: "FC Argeș 1953 — ș ț"\n';
  const compositionVersion = `sha256:${'a'.repeat(64)}`;
  const captionVersion = `sha256:${'b'.repeat(64)}`;
  const upstreamCalls = [];
  const bridge = new MCPBridge({ url, env: {}, credentialStore: null, fileRoots: [cwd] });
  bridge.state = { status: 'connected' };
  await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'edit', includeBriefGuide: false } });
  bridge.tools = [
    { name: 'get_job_result', description: 'result', inputSchema: { type: 'object', required: ['projectId', 'jobId'], properties: { projectId: { type: 'string' }, jobId: { type: 'string' } } } },
    { name: 'validate_recipe', description: 'validate', inputSchema: { type: 'object', required: ['projectId', 'composition'], properties: { projectId: { type: 'string' }, composition: { type: 'string' } } } },
    { name: 'compile_recipe', description: 'compile', inputSchema: { type: 'object', required: ['projectId', 'composition'], properties: { projectId: { type: 'string' }, composition: { type: 'string' } } } },
    { name: 'render_video', description: 'render', inputSchema: { type: 'object', required: ['projectId', 'composition'], properties: { projectId: { type: 'string' }, composition: { type: 'string' } } } },
    { name: 'compile_scene', description: 'scene', inputSchema: { type: 'object', required: ['projectId', 'component'], properties: { projectId: { type: 'string' }, component: { type: 'string' } } } },
  ];
  bridge.rpc = async (_method, params) => {
    upstreamCalls.push({ name: params.name, arguments: params.arguments });
    const data = { status: 'completed', recipeYaml: recipe, compositionVersion, captionVersion, diagnostics: [], requirements: [] };
    return { content: [{ type: 'text', text: JSON.stringify({ statusCode: 200, data }) }], structuredContent: { statusCode: 200, data } };
  };

  const listed = new Map((await bridge.handle('tools/list')).tools.map(tool => [tool.name, tool]));
  assert.ok(listed.get('validate_recipe').inputSchema.properties.compositionFile);
  assert.ok(listed.get('validate_recipe').inputSchema.properties.captionBaselineRecipeFile);
  assert.ok(listed.get('compile_recipe').inputSchema.properties.productionContractFile);
  assert.ok(listed.get('get_job_result').inputSchema.properties.recipeFile);
  assert.ok(listed.get('compile_scene').inputSchema.properties.componentFile);
  assert.deepEqual(listed.get('compile_scene').inputSchema.required, ['projectId']);

  const baselineYaml = join(cwd, 'baseline.edit.yaml');
  const baselineCkpt = join(cwd, 'baseline.checkpoint.json');
  const saved = await bridge.handle('tools/call', {
    name: 'get_job_result',
    arguments: { projectId: 'owned', jobId: 'job-1', recipeFile: baselineYaml, checkpointFile: baselineCkpt },
  });
  assert.equal(saved.structuredContent.data.recipeYaml, undefined);
  assert.equal(saved.structuredContent.data.recipeFile.bytes, Buffer.byteLength(recipe));
  assert.equal(await readFile(baselineYaml, 'utf8'), recipe);
  assert.equal(JSON.parse(await readFile(baselineCkpt, 'utf8')).captionVersion, captionVersion);

  const conflict = await bridge.handle('tools/call', {
    name: 'get_job_result',
    arguments: { projectId: 'owned', jobId: 'job-1', recipeFile: baselineYaml },
  });
  assert.equal(conflict.structuredContent.data.recipeYaml, recipe);
  assert.match(conflict.structuredContent.data.recipeFileError, /exists/);

  const contractFile = join(cwd, 'contract.json');
  const contract = { version: 1, beats: [{ id: 'beat1' }] };
  await writeFile(contractFile, JSON.stringify(contract), 'utf8');
  const preflightCkpt = join(cwd, 'preflight.checkpoint.json');
  await bridge.handle('tools/call', {
    name: 'compile_recipe',
    arguments: {
      compositionFile: baselineYaml,
      captionBaselineRecipeFile: baselineYaml,
      captionBaselineFile: baselineCkpt,
      productionContractFile: contractFile,
      checkpointFile: preflightCkpt,
    },
  });
  const compiledCall = upstreamCalls.at(-1).arguments;
  assert.equal(compiledCall.projectId, 'owned');
  assert.equal(compiledCall.composition, recipe);
  assert.equal(compiledCall.captionBaseline, recipe);
  assert.equal(compiledCall.expectedCaptionVersion, captionVersion);
  assert.deepEqual(compiledCall.productionContract, contract);
  assert.equal(compiledCall.compositionFile, undefined);

  await bridge.handle('tools/call', {
    name: 'render_video',
    arguments: { compositionFile: baselineYaml, checkpointFile: preflightCkpt, captionBaselineFile: baselineCkpt, userApproved: false, idempotencyKey: 'keep' },
  });
  const renderCall = upstreamCalls.at(-1).arguments;
  assert.equal(renderCall.projectId, 'owned');
  assert.equal(renderCall.expectedCompositionVersion, compositionVersion);
  assert.equal(renderCall.expectedCaptionVersion, captionVersion);
  assert.equal(renderCall.userApproved, false);

  const sceneFile = join(cwd, 'scene1.svelte');
  const svelte = '<script>const x = 1;</script><h1>Argeș</h1>\n';
  await writeFile(sceneFile, svelte, 'utf8');
  await bridge.handle('tools/call', {
    name: 'compile_scene',
    arguments: { projectId: 'owned', sourceFile: 'remote.scene.json', componentFile: sceneFile },
  });
  assert.deepEqual(upstreamCalls.at(-1).arguments, { projectId: 'owned', sourceFile: 'remote.scene.json', component: svelte });

  const callsBeforeRejects = upstreamCalls.length;
  const outsideFile = join(outside, 'escape.svelte');
  await writeFile(outsideFile, svelte, 'utf8');
  for (const call of [
    { name: 'compile_scene', arguments: { projectId: 'owned', componentFile: outsideFile } },
    { name: 'compile_scene', arguments: { projectId: 'owned', component: '<p/>', componentFile: sceneFile } },
    { name: 'validate_recipe', arguments: { projectId: 'owned', compositionFile: join(cwd, '.env') } },
    { name: 'render_video', arguments: { projectId: 'other', compositionFile: baselineYaml, checkpointFile: preflightCkpt } },
  ]) {
    const err = await bridge.handle('tools/call', call);
    assert.equal(err.isError, true);
    assert.equal(err.structuredContent.submissionState, 'not-submitted');
  }
  assert.equal(upstreamCalls.length, callsBeforeRejects);
});

test('local stdio bridge connects to machinal-local upstream while server mode rejects it', async (t) => {
  const cwd = await workspace(t);
  const endpoint = await serve(t, mcpHandler([], {
    serverName: 'machinal-local',
    tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'compile_scene' }],
  }));
  const localConfig = join(cwd, 'providers.env');
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='local_${'d'.repeat(64)}'\n`);
  const localBridge = new MCPBridge({ url: endpoint, localConfig, env: {}, credentialStore: null });
  const localStatus = await localBridge.connect();
  assert.equal(localStatus.status, 'connected');
  assert.equal(localStatus.toolCount, 3);
  assert.equal(localStatus.deployment.kind, 'local');
  assert.equal(localStatus.deployment.supportsCreditsTool, false);
  assert.equal(localStatus.deployment.supportsS3, false);
  const serverBridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
  assert.equal((await serverBridge.connect()).status, 'service_error');
});

test('Cloud and Local profiles are strictly separated across initialize, upstream identity, catalog cache and quickstart', async (t) => {
  const cwd = await workspace(t);
  const { endpointFiles } = await import('../src/runtime.mjs');
  const cloudEndpoint = await serve(t, mcpHandler([], {
    serverName: 'machinal',
    tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'get_credits' }],
  }));
  const localEndpoint = await serve(t, mcpHandler([], {
    serverName: 'machinal-local',
    tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }],
  }));
  const localConfig = join(cwd, 'providers.env');
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${localEndpoint}'\nMACHINAL_LOCAL_TOKEN='local_${'e'.repeat(64)}'\n`);
  const mismatchConfig = join(cwd, 'mismatch.env');
  await writeFile(mismatchConfig, `MACHINAL_LOCAL_URL='${cloudEndpoint}'\nMACHINAL_LOCAL_TOKEN='local_${'f'.repeat(64)}'\n`);

  // Local bridge MUST reject a hosted 'machinal' upstream (strict bidirectional separation).
  const localToCloud = new MCPBridge({ url: cloudEndpoint, localConfig: mismatchConfig, env: {}, credentialStore: null });
  assert.equal((await localToCloud.connect()).status, 'service_error');

  // Mode-separated catalog files for the same URL never collide.
  const localFiles = endpointFiles(localEndpoint, { home: cwd, env: {} }, { local: true });
  const serverFiles = endpointFiles(localEndpoint, { home: cwd, env: {} }, { local: false });
  assert.notEqual(localFiles.catalogFile, serverFiles.catalogFile);

  // Even if pointed at the same catalogFile path, mode mismatches never load stale tools/instructions across modes.
  const sharedCatalog = join(cwd, 'shared-catalog.json');
  const localBridge = new MCPBridge({ url: localEndpoint, localConfig, catalogFile: sharedCatalog, env: {}, credentialStore: null });
  assert.equal((await localBridge.connect()).status, 'connected');
  const serverReadingLocalCache = new MCPBridge({ url: localEndpoint, catalogFile: sharedCatalog, env: {}, credentialStore: null });
  await serverReadingLocalCache.loadCatalog();
  assert.deepEqual(serverReadingLocalCache.tools, []);
  assert.equal(serverReadingLocalCache.instructions, undefined);

  // Initialize instructions and production_quickstart are strictly mode-scoped with zero cross-contamination.
  const localInit = await localBridge.handle('initialize', { protocolVersion: '2025-11-25' });
  assert.match(localInit.instructions, /Independent Local Profile/i);
  assert.match(localInit.instructions, /storage: "volume"|storage=volume/i);
  assert.doesNotMatch(localInit.instructions, /Below 30 credits|cloud publication must complete|Never reveal signed S3 URLs/i);
  const localQuickstart = (await localBridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create', includeBriefGuide: false } })).structuredContent.data;
  assert.equal(localQuickstart.deploymentMode, 'local');
  assert.equal(localQuickstart.deployment.supportsCreditsTool, false);
  assert.equal(localQuickstart.liveBootstrapBatch.includes('get_credits'), false);
  assert.equal(localQuickstart.onDemandTopics.credits, undefined);

  const cloudBridge = new MCPBridge({ url: 'https://api.machinal.app/mcp', env: {}, credentialStore: null, fetchImpl() { assert.fail('offline initialize/quickstart'); } });
  const cloudInit = await cloudBridge.handle('initialize', { protocolVersion: '2025-11-25' });
  assert.match(cloudInit.instructions, /Machinal Cloud Profile/i);
  assert.match(cloudInit.instructions, /get_credits/);
  assert.doesNotMatch(cloudInit.instructions, /DEPLOYMENT PROFILE: INDEPENDENT LOCAL DOCKER/i);
  assert.equal(cloudBridge.status().deployment.kind, 'cloud');
  const cloudQuickstart = (await cloudBridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create', includeBriefGuide: false } })).structuredContent.data;
  assert.equal(cloudQuickstart.deploymentMode, 'cloud');
  assert.equal(cloudQuickstart.deployment.supportsCreditsTool, true);
  assert.equal(cloudQuickstart.liveBootstrapBatch.includes('get_credits'), true);
  assert.ok(cloudQuickstart.onDemandTopics.credits);
});

test('multimodal tool results preserve structuredContent diagnostics alongside images without duplicating base64', async (t) => {
  const endpoint = await serve(t, async (request, response) => {
    const body = JSON.parse(await new Promise((resolve) => {
      let raw = '';
      request.on('data', chunk => { raw += chunk; });
      request.on('end', () => resolve(raw));
    }));
    const send = (result) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }));
    };
    if (body.method === 'initialize') return send({ protocolVersion: '2025-11-25', serverInfo: { name: 'machinal', version: '1.0.0' }, capabilities: { tools: {} } });
    if (body.method === 'notifications/initialized') { response.writeHead(202); response.end(); return; }
    if (body.method === 'tools/list') return send({ tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'inspect_render' }, { name: 'inspect_scene' }] });
    if (body.params?.name === 'inspect_render') {
      return send({
        content: [
          { type: 'text', text: 'Composed MP4 sample at 5 seconds.' },
          { type: 'image', data: 'iVBORw0KGgo=', mimeType: 'image/jpeg' },
        ],
        structuredContent: {
          statusCode: 200,
          data: {
            audio: { integratedLufs: -14.2, truePeakDbtp: -1.1, clippingRisk: false },
            frames: [{ index: 0, seconds: 5, imageBase64: 'A'.repeat(500) }],
          },
        },
      });
    }
    if (body.params?.name === 'inspect_scene') {
      return send({
        content: [
          { type: 'text', text: JSON.stringify({ statusCode: 200, data: { objects: [{ id: 'hero' }] } }) },
          { type: 'image', data: 'iVBORw0KGgo=', mimeType: 'image/png' },
        ],
        structuredContent: { statusCode: 200, data: { objects: [{ id: 'hero' }] } },
      });
    }
  });
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null });
  await bridge.connect();
  const renderRes = await bridge.handle('tools/call', { name: 'inspect_render', arguments: { projectId: 'p1', jobId: 'j1', userApproved: true } });
  assert.equal(renderRes.content.length, 3);
  const appended = JSON.parse(renderRes.content[2].text);
  assert.equal(appended.data.audio.integratedLufs, -14.2);
  assert.equal(appended.data.audio.clippingRisk, false);
  assert.equal(appended.data.frames[0].imageBase64, undefined, 'large inline base64 should not be duplicated into text JSON');
  // When upstream already includes a JSON text block, do not duplicate it.
  const sceneRes = await bridge.handle('tools/call', { name: 'inspect_scene', arguments: { projectId: 'p1', sourceFile: 's.scene.json', userApproved: true } });
  assert.equal(sceneRes.content.length, 2);
});

test('search_sound_effects caches successful searches and retries once on transient 502/504 without poisoning connection state', async (t) => {
  let attempts = 0;
  let failingAttempts = 0;
  const endpoint = await serve(t, async (request, response) => {
    const body = JSON.parse(await new Promise((resolve) => {
      let raw = '';
      request.on('data', chunk => { raw += chunk; });
      request.on('end', () => resolve(raw));
    }));
    const send = (result) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }));
    };
    if (body.method === 'initialize') return send({ protocolVersion: '2025-11-25', serverInfo: { name: 'machinal', version: '1.0.0' }, capabilities: { tools: {} } });
    if (body.method === 'notifications/initialized') { response.writeHead(202); response.end(); return; }
    if (body.method === 'tools/list') return send({ tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'search_sound_effects', annotations: { readOnlyHint: true } }] });
    if (body.params?.name === 'search_sound_effects') {
      const q = body.params.arguments?.query;
      if (q === 'stamp') {
        attempts++;
        if (attempts === 1) {
          return send({ isError: true, content: [{ type: 'text', text: '{"statusCode":504}' }], structuredContent: { statusCode: 504, data: { message: 'Openverse timeout' } } });
        }
        return send({ content: [{ type: 'text', text: '{"statusCode":200,"data":{"results":[{"id":"sfx-1"}]}}' }], structuredContent: { statusCode: 200, data: { results: [{ id: 'sfx-1' }] } } });
      }
      if (q === 'always-502') {
        failingAttempts++;
        response.writeHead(502);
        response.end();
        return;
      }
    }
  });
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null, soundRetryDelayMs: 0 });
  await bridge.connect();
  const first = await bridge.handle('tools/call', { name: 'search_sound_effects', arguments: { query: 'stamp', limit: 3 } });
  assert.equal(attempts, 2, 'should retry once after transient 504');
  assert.equal(first.structuredContent.statusCode, 200);
  // Second identical search hits session cache with zero extra upstream calls.
  const second = await bridge.handle('tools/call', { name: 'search_sound_effects', arguments: { limit: 3, query: 'stamp' } });
  assert.equal(attempts, 2, 'identical query should be served from session cache');
  assert.deepEqual(second.structuredContent.data.results, [{ id: 'sfx-1' }]);
  // Persistent 502 retries once, returns an error, and keeps the bridge connected.
  const failed = await bridge.handle('tools/call', { name: 'search_sound_effects', arguments: { query: 'always-502' } });
  assert.equal(failingAttempts, 2);
  assert.equal(failed.isError, true);
  assert.equal(bridge.state.status, 'connected');
});

test('compile_recipe hydrates productionContract.compositionVersion when set to auto and preserves omitted or explicit values verbatim', async (t) => {
  const cwd = await workspace(t);
  const { compositionVersionHash } = await import('../src/stdio-files.mjs');
  const upstreamCalls = [];
  const endpoint = await serve(t, async (request, response) => {
    const body = JSON.parse(await new Promise((resolve) => {
      let raw = '';
      request.on('data', chunk => { raw += chunk; });
      request.on('end', () => resolve(raw));
    }));
    const send = (result) => {
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ jsonrpc: '2.0', id: body.id, result }));
    };
    if (body.method === 'initialize') return send({ protocolVersion: '2025-11-25', serverInfo: { name: 'machinal', version: '1.0.0' }, capabilities: { tools: {} } });
    if (body.method === 'notifications/initialized') { response.writeHead(202); response.end(); return; }
    if (body.method === 'tools/list') return send({ tools: [{ name: 'list_projects' }, { name: 'get_recipe_schema' }, { name: 'compile_recipe' }] });
    if (body.method === 'tools/call') {
      upstreamCalls.push(body.params);
      return send({ content: [{ type: 'text', text: '{"statusCode":200,"data":{"diagnostics":[],"requirements":[]}}' }], structuredContent: { statusCode: 200, data: { diagnostics: [], requirements: [] } } });
    }
  });
  const bridge = new MCPBridge({ url: endpoint, env: { MACHINAL_API_KEY: API_KEY }, credentialStore: null, fileRoots: [cwd] });
  await bridge.connect();
  const recipe = 'document:\r\n  version: 2\r\n';
  const expected = compositionVersionHash(recipe);
  const recipePath = join(cwd, 'test.edit.yaml');
  const contractPath = join(cwd, 'contract.json');
  await writeFile(recipePath, recipe, 'utf8');
  await writeFile(contractPath, JSON.stringify({ version: 1, compositionVersion: 'auto', beats: [{ id: 'b1' }] }), 'utf8');

  await bridge.handle('tools/call', {
    name: 'compile_recipe',
    arguments: { projectId: 'owned', compositionFile: recipePath, productionContractFile: contractPath },
  });
  assert.equal(upstreamCalls.at(-1).arguments.productionContract.compositionVersion, expected);

  // Inline 'auto' is also hydrated.
  await bridge.handle('tools/call', {
    name: 'compile_recipe',
    arguments: { projectId: 'owned', composition: recipe, productionContract: { version: 1, compositionVersion: 'auto', beats: [{ id: 'b1' }] } },
  });
  assert.equal(upstreamCalls.at(-1).arguments.productionContract.compositionVersion, expected);

  // Omitted compositionVersion is passed verbatim without mutating the caller's contract.
  await bridge.handle('tools/call', {
    name: 'compile_recipe',
    arguments: { projectId: 'owned', composition: recipe, productionContract: { version: 1, beats: [{ id: 'b1' }] } },
  });
  assert.equal(upstreamCalls.at(-1).arguments.productionContract.compositionVersion, undefined);

  // Explicit hash is preserved untouched.
  const explicit = `sha256:${'9'.repeat(64)}`;
  await bridge.handle('tools/call', {
    name: 'compile_recipe',
    arguments: { projectId: 'owned', composition: recipe, productionContract: { version: 1, compositionVersion: explicit, beats: [{ id: 'b1' }] } },
  });
  assert.equal(upstreamCalls.at(-1).arguments.productionContract.compositionVersion, explicit);
});

test('stdio bridge blocks production tools until production_quickstart completes and enforces local brief parity', async (t) => {
  const cwd = await workspace(t);
  const upstreamCalls = [];
  const endpoint = await serve(t, async (request, response) => {
    const body = await requestBody(request);
    if (body.method === 'initialize') return reply(response, body, { protocolVersion: '2025-11-25', serverInfo: { name: 'machinal-local' } });
    if (body.method === 'notifications/initialized') return response.writeHead(202).end();
    if (body.method === 'tools/list') {
      return reply(response, body, {
        tools: [
          { name: 'list_projects' },
          { name: 'get_recipe_schema' },
          { name: 'create_project', description: 'Create project.', inputSchema: { type: 'object', properties: { name: { type: 'string' } } } },
          { name: 'compile_scene', description: 'Compile scene.', inputSchema: { type: 'object', required: ['projectId', 'component'], properties: { projectId: { type: 'string' }, component: { type: 'string' }, userApproved: { type: 'boolean', description: 'Approval.' } } } },
          { name: 'generate_assets', description: 'Generate assets.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, userApproved: { type: 'boolean', description: 'Approval.' } } } },
          { name: 'render_video', description: 'Render video.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, userApproved: { type: 'boolean', description: 'Approval.' } } } },
          { name: 'render_preview', description: 'Render preview.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, userApproved: { type: 'boolean', description: 'Approval.' } } } },
        ],
      });
    }
    upstreamCalls.push(body.params.name);
    return reply(response, body, { content: [{ type: 'text', text: '{"statusCode":200,"data":{"ok":true}}' }], structuredContent: { statusCode: 200, data: { ok: true } } });
  });
  const localConfig = join(cwd, 'providers.env');
  await writeFile(localConfig, `MACHINAL_LOCAL_URL='${endpoint}'\nMACHINAL_LOCAL_TOKEN='local_${'a'.repeat(64)}'\n`);
  const bridge = new MCPBridge({ url: endpoint, localConfig, env: {}, credentialStore: null });
  const status = await bridge.connect();
  assert.equal(status.status, 'connected');
  assert.match(status.nextAction, /production_quickstart/);
  assert.match(status.nextAction, /Zero Machinal credits does NOT skip the collaborative brief/i);
  assert.match(status.nextAction, /TikTok 9:16 vs YouTube 16:9/);

  const listed = new Map((await bridge.handle('tools/list')).tools.map(tool => [tool.name, tool]));
  for (const name of ['create_project', 'compile_scene', 'generate_assets', 'render_video', 'render_preview']) {
    assert.match(listed.get(name).description, /production_quickstart/);
    assert.match(listed.get(name).description, /Local zero-credit Docker mode requires the EXACT same collaborative brief/);
  }
  assert.match(listed.get('compile_scene').inputSchema.properties.userApproved.description, /Never set userApproved:true/);
  assert.match(listed.get('render_video').inputSchema.properties.userApproved.description, /Never self-approve userApproved:true/);

  // Every production tool is blocked before production_quickstart with zero upstream calls.
  for (const name of ['create_project', 'compile_scene', 'generate_assets', 'render_video', 'render_preview']) {
    const blocked = await bridge.handle('tools/call', { name, arguments: { projectId: 'p1', name: 'demo', component: '<p/>', userApproved: true } });
    assert.equal(blocked.isError, true);
    assert.equal(blocked.structuredContent.status, 'blocked');
    assert.equal(blocked.structuredContent.submissionState, 'not-submitted');
    assert.equal(blocked.structuredContent.nextTool, 'production_quickstart');
    assert.equal(blocked.structuredContent.deploymentMode, 'local');
    assert.match(blocked.structuredContent.error, /TikTok 9:16 vs YouTube 16:9/);
    assert.match(blocked.structuredContent.error, /Local zero-credit Docker mode requires the exact same brief/);
  }
  assert.deepEqual(upstreamCalls, []);

  // Batching production_quickstart and create_project in the same parallel turn still blocks create_project.
  const [quickRes, racedProject] = await Promise.all([
    bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create' } }),
    bridge.handle('tools/call', { name: 'create_project', arguments: { name: 'raced' } }),
  ]);
  assert.equal(quickRes.structuredContent.statusCode, 200);
  assert.equal(racedProject.isError, true);
  assert.equal(racedProject.structuredContent.status, 'blocked');
  assert.deepEqual(upstreamCalls, []);

  // Once production_quickstart has completed, subsequent production calls proceed normally.
  const created = await bridge.handle('tools/call', { name: 'create_project', arguments: { name: 'approved-after-brief' } });
  assert.equal(created.isError, undefined);
  assert.deepEqual(upstreamCalls, ['create_project']);
});
