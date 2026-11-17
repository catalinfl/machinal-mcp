import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, symlink, truncate, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import test from 'node:test';
import { installOpenCodeUploads } from '../src/opencode-uploads.mjs';
import { requestTransfer } from '../src/transfer-http.mjs';
import { MAX_UPLOAD_BYTES } from '../src/upload.mjs';
import { API_KEY, serve, workspace } from './helpers.mjs';

async function host(options = {}) {
  const permissions = [];
  const progress = [];
  let tool;
  await installOpenCodeUploads({
    tool: { transform: async callback => callback({ add: definition => { tool = definition; } }) },
    permission: { assert: async input => { permissions.push(input); await options.permission?.(input); } },
  }, options);
  return { tool, permissions, progress, execute: async input => JSON.parse((await tool.execute(input, {
    signal: options.signal ?? new AbortController().signal, progress: async update => { progress.push(update); },
    sessionID: 'ses_upload', agent: 'build', messageID: 'msg_upload', id: 'call_upload',
  })).content) };
}

async function sources(t) {
  const directory = await workspace(t);
  const paths = [join(directory, "Assassin's_Creed.jpg"), join(directory, 'umbră.png')];
  for (const path of paths) await writeFile(path, Buffer.from('synthetic media bytes'));
  return paths;
}

async function api(t, { redirect = false, failSecond = false, invalidReceipt = false } = {}) {
  const calls = [];
  let uploads = 0;
  const endpoint = await serve(t, async (req, res) => {
    assert.equal(req.headers.authorization, `Bearer ${API_KEY}`);
    const call = { path: req.url, method: req.method };
    calls.push(call);
    if (req.url === '/v1/projects/owned') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"id":"owned"}');
      return;
    }
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = Buffer.concat(chunks);
    assert.equal(payload.length, Number(req.headers['content-length']));
    assert.match(req.headers['content-type'], /^multipart\/form-data; boundary=machinal-/);
    const headerEnd = payload.indexOf('\r\n\r\n');
    const header = payload.subarray(0, headerEnd).toString();
    const filename = header.match(/filename="([^"]+)"/)[1];
    assert.match(filename, /^upload-[a-f\d-]+\.(jpg|png)$/);
    const boundary = req.headers['content-type'].split('boundary=')[1];
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    assert.deepEqual(payload.subarray(-footer.length), footer);
    call.bytes = payload.subarray(headerEnd + 4, -footer.length);
    call.file = filename;
    uploads++;
    if (redirect) res.writeHead(307, { Location: 'https://untrusted.example/upload' }).end();
    else if (failSecond && uploads === 2) res.writeHead(503).end('private backend details');
    else res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({
      file: invalidReceipt ? '../untrusted.jpg' : filename, bytes: call.bytes.length, storage: 'volume', ignoredSecret: API_KEY,
    }));
  });
  return { calls, endpoint };
}

test('native streaming uploads exact approved sources to owned server volume with no local writes or leaked secrets', async t => {
  const paths = await sources(t);
  const server = await api(t);
  const h = await host({ getConnection: async name => { assert.equal(name, 'approved'); return { endpoint: server.endpoint, key: API_KEY }; } });
  assert.equal(h.tool.options.codemode, false);
  const result = await h.execute({ projectId: 'owned', files: paths, server: 'approved', userApproved: true });
  assert.equal(result.status, 'completed', JSON.stringify(result));
  assert.equal(result.uploadsToS3, false);
  assert.equal(result.originalsReadOnly, true);
  assert.equal(result.files.length, 2);
  for (const [index, file] of result.files.entries()) {
    const original = await readFile(paths[index]);
    assert.equal(file.path, paths[index]);
    assert.deepEqual(server.calls[index + 1].bytes, original);
    assert.equal(file.sha256, createHash('sha256').update(original).digest('hex'));
    assert.equal(file.file, server.calls[index + 1].file);
    assert.equal(file.storage, 'volume');
  }
  assert.deepEqual(h.permissions.map(p => p.action), ['machinal_upload', 'read', 'read']);
  assert.deepEqual(h.permissions.slice(1).map(p => p.resources[0]), paths);
  assert.ok(!JSON.stringify({ result, progress: h.progress, permissions: h.permissions }).includes(API_KEY));
  assert.deepEqual(server.calls.map(c => c.path), ['/v1/projects/owned', '/v1/projects/owned/upload', '/v1/projects/owned/upload']);
});

test('missing approval, unsupported or ambiguous inputs never access files, credentials or network', async () => {
  const h = await host({ getConnection: () => assert.fail('must not read credentials') });
  for (const input of [
    { projectId: 'owned', files: ['/a.jpg'] },
    { projectId: '../other', files: ['/a.jpg'], userApproved: true },
    { projectId: 'owned', files: [], userApproved: true },
    { projectId: 'owned', files: ['relative.jpg'], userApproved: true },
    { projectId: 'owned', files: ['https://example.org/a.jpg'], userApproved: true },
    { projectId: 'owned', files: [join(process.cwd(), '.env')], userApproved: true },
    { projectId: 'owned', files: [join(process.cwd(), 'a.jpg'), join(process.cwd(), 'a.jpg')], userApproved: true },
  ]) assert.equal((await h.execute(input)).status, 'failed');
  assert.deepEqual(h.permissions, []);
});

test('native upload and per-file read denials propagate before any credential or API access', async t => {
  for (const action of ['machinal_upload', 'read']) {
    const rejection = new Error('permission denied');
    const h = await host({ permission: input => { if (input.action === action) throw rejection; },
      getConnection: () => assert.fail('must not access credentials') });
    await assert.rejects(h.execute({ projectId: 'owned', files: await sources(t), userApproved: true }), error => error === rejection);
  }
});

test('all sources are checked before transferring; empty files, directories and size limits fail closed', async t => {
  const directory = await workspace(t);
  const empty = join(directory, 'empty.jpg');
  const folder = join(directory, 'folder.jpg');
  const huge = join(directory, 'huge.glb');
  await writeFile(empty, '');
  await mkdir(folder);
  await writeFile(huge, 'x');
  await truncate(huge, 4 * 1024 * 1024 + 1);
  const h = await host({ getConnection: () => assert.fail('must validate all files first') });
  for (const path of [empty, folder, huge]) {
    assert.equal((await h.execute({ projectId: 'owned', files: [path], userApproved: true })).status, 'failed');
  }
  const big = join(directory, 'big.mp4');
  await writeFile(big, 'x');
  await truncate(big, MAX_UPLOAD_BYTES + 1);
  assert.equal((await h.execute({ projectId: 'owned', files: [big], userApproved: true })).status, 'failed');
});

test('symbolic links cannot redirect approved reads', async t => {
  const [path] = await sources(t);
  const link = join(path, '..', 'link.jpg');
  try { await symlink(path, link); } catch (error) { if (error.code === 'EPERM') return t.skip('Symlink privilege unavailable'); throw error; }
  const h = await host({ getConnection: () => assert.fail('must not access network') });
  assert.equal((await h.execute({ projectId: 'owned', files: [link], userApproved: true })).status, 'failed');
});

test('redirects are refused and uncertain uploads return their attempted filename, never auto-retry', async t => {
  for (const options of [{ redirect: true }, { invalidReceipt: true }]) {
    const paths = await sources(t);
    const server = await api(t, options);
    const h = await host({ getConnection: async () => ({ endpoint: server.endpoint, key: API_KEY }) });
    const result = await h.execute({ projectId: 'owned', files: paths, userApproved: true });
    assert.equal(result.status, 'failed');
    assert.equal(result.pending.file, server.calls[1].file);
    assert.equal(result.pending.status, 'unknown');
    assert.equal(server.calls.length, 2);
    assert.ok(!JSON.stringify(result).includes(API_KEY));
  }
});

test('partial failure retains successful files and the attempted second filename for deterministic recovery', async t => {
  const paths = await sources(t);
  const server = await api(t, { failSecond: true });
  const h = await host({ getConnection: async () => ({ endpoint: server.endpoint, key: API_KEY }) });
  const result = await h.execute({ projectId: 'owned', files: paths, userApproved: true });
  assert.equal(result.status, 'partial');
  assert.equal(result.files[0].file, server.calls[1].file);
  assert.equal(result.pending.file, server.calls[2].file);
  assert.equal(server.calls.length, 3);
  assert.ok(!JSON.stringify(result).includes('private backend details'));
});

test('project ownership failures and already-cancelled calls upload no source bytes', async t => {
  const paths = await sources(t);
  const controller = new AbortController();
  controller.abort();
  const cancelled = await host({ signal: controller.signal, getConnection: () => assert.fail('cancelled') });
  assert.equal((await cancelled.execute({ projectId: 'owned', files: paths, userApproved: true })).status, 'failed');
  let requests = 0;
  const h = await host({ getConnection: async () => ({ endpoint: 'https://approved.example/mcp', key: API_KEY }),
    request: async () => { requests++; return Object.assign(Readable.from([]), { statusCode: 403 }); } });
  assert.equal((await h.execute({ projectId: 'owned', files: paths, userApproved: true })).status, 'failed');
  assert.equal(requests, 1);
});

test('source mutations after preflight cannot be uploaded', async t => {
  const paths = await sources(t);
  const server = await api(t);
  const h = await host({ getConnection: async () => { await writeFile(paths[0], 'changed'); return { endpoint: server.endpoint, key: API_KEY }; }, request: requestTransfer });
  const result = await h.execute({ projectId: 'owned', files: paths, userApproved: true });
  assert.equal(result.status, 'failed');
  assert.equal(server.calls.length, 1);
});

test('a linked parent folder cannot broaden approved file reads', async t => {
  const directory = await workspace(t);
  const target = join(directory, 'target');
  const linked = join(directory, 'linked');
  await mkdir(target);
  await writeFile(join(target, 'photo.jpg'), 'synthetic');
  await symlink(target, linked, process.platform === 'win32' ? 'junction' : 'dir');
  const h = await host({ getConnection: () => assert.fail('must not follow linked folders') });
  assert.equal((await h.execute({ projectId: 'owned', files: [join(linked, 'photo.jpg')], userApproved: true })).status, 'failed');
});

test('cancellation during streaming closes source handles and preserves uncertain filenames without retrying', async t => {
  const paths = await sources(t);
  const controller = new AbortController();
  let requests = 0;
  const h = await host({ signal: controller.signal, getConnection: async () => ({ endpoint: 'https://approved.example/mcp', key: API_KEY }),
    request: async (_url, options) => {
      requests++;
      if (!options.body) return Object.assign(Readable.from([Buffer.from('{"id":"owned"}')]), { statusCode: 200, headers: { 'content-type': 'application/json' } });
      let chunks = 0;
      for await (const _chunk of options.body) {
        if (++chunks === 2) controller.abort();
      }
      assert.fail('Cannot complete a cancelled upload');
    } });
  const result = await h.execute({ projectId: 'owned', files: paths, userApproved: true });
  assert.equal(result.status, 'failed');
  assert.equal(result.pending?.status, 'unknown', JSON.stringify(result));
  assert.equal(requests, 2);
  await writeFile(paths[0], 'source still writable');
  assert.equal(await readFile(paths[0], 'utf8'), 'source still writable');
});
