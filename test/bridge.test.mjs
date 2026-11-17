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
