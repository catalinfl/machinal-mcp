import { createHash, randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { lstat, open, realpath } from 'node:fs/promises';
import { basename, extname, isAbsolute, relative, resolve } from 'node:path';
import { downloadFilename } from './download.mjs';
import { readTransferJSON, requestTransfer, TransferError } from './transfer-http.mjs';

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024 * 1024;
const extensions = new Set('mp4 mov mkv webm avi m4v png jpg jpeg webp gif bmp mp3 wav m4a aac ogg flac glb'.split(' '));

export function validateUpload(input) {
  if (input.userApproved !== true) throw new TransferError('Ask for approval to upload the exact named local files to this project first. Listing consent is insufficient.');
  if (!/^[a-z\d_-]{1,64}$/i.test(input.projectId ?? '')) throw new TransferError('Use a projectId returned by list_projects or create_project.');
  if (!Array.isArray(input.files) || !input.files.length || input.files.length > 100) throw new TransferError('Choose 1–100 exact local media files, not a folder or glob.');
  for (const path of input.files) {
    if (typeof path !== 'string' || !isAbsolute(path) || /[\x00-\x1f\x7f]/.test(path)
      || !extensions.has(extname(path).slice(1).toLowerCase())) {
      throw new TransferError('Use absolute client-local paths to supported images, video, audio or GLB files; no URLs, directories, secrets or recipes.');
    }
    downloadFilename(basename(path));
  }
  if (new Set(input.files.map(path => resolve(path))).size !== input.files.length) throw new TransferError('Select each local file only once.');
}

function sameFile(a, b) {
  return a.isFile() && b.isFile() && a.ino === b.ino && a.dev === b.dev
    && a.size === b.size && a.mtimeMs === b.mtimeMs && a.ctimeMs === b.ctimeMs;
}

export async function inspectUpload(path) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink() || relative(resolve(path), await realpath(path))) {
    throw new TransferError('Upload only regular files at their real approved paths, not symbolic links, linked folders or directories.');
  }
  const extension = extname(path).toLowerCase();
  const limit = extension === '.glb' ? 4 * 1024 * 1024 : MAX_UPLOAD_BYTES;
  if (!Number.isSafeInteger(info.size) || info.size < 1 || info.size > limit) {
    throw new TransferError(extension === '.glb' ? 'GLB uploads must be nonempty and at most 4 MiB.' : 'Uploads must be nonempty and at most 2 GiB.');
  }
  return { path, info, file: `upload-${randomUUID()}${extension}` };
}

async function* multipart(source, handle, header, footer, hash, signal, progress, state) {
  yield header;
  let bytes = 0;
  let lastProgress = Date.now();
  for await (const chunk of handle.createReadStream({ autoClose: false, start: 0, end: source.info.size - 1, signal })) {
    signal?.throwIfAborted();
    bytes += chunk.length;
    hash.update(chunk);
    if (Date.now() - lastProgress >= 1000) {
      lastProgress = Date.now();
      await progress({ status: 'Uploading', bytes, totalBytes: source.info.size });
    }
    yield chunk;
  }
  if (bytes !== source.info.size || !sameFile(source.info, await handle.stat())) throw new TransferError('The local source changed during upload. Recover the attempted remote filename before retrying.');
  yield footer;
  state.completed = true;
}

export async function uploadFile(source, { connection, projectId, signal, progress = async () => {}, request = requestTransfer }) {
  const controller = new AbortController();
  const combined = AbortSignal.any([signal, controller.signal].filter(Boolean));
  const handle = await open(source.path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0) | (constants.O_NONBLOCK ?? 0));
  let response;
  let body;
  try {
    if (!sameFile(source.info, await handle.stat()) || relative(resolve(source.path), await realpath(source.path))) throw new TransferError('The local source changed after approval. No file was uploaded.');
    const boundary = `machinal-${randomUUID()}`;
    const header = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${source.file}"\r\nContent-Type: application/octet-stream\r\n\r\n`);
    const footer = Buffer.from(`\r\n--${boundary}--\r\n`);
    const hash = createHash('sha256');
    const state = { completed: false };
    body = multipart(source, handle, header, footer, hash, combined, progress, state);
    const origin = new URL(connection.endpoint).origin;
    response = await request(new URL(`/v1/projects/${projectId}/upload`, origin), {
      trustedOrigin: origin, signal: combined, method: 'POST', body,
      headers: { Authorization: `Bearer ${connection.key}`, Accept: 'application/json',
        'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': header.length + source.info.size + footer.length },
    });
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new TransferError(`Upload failed (HTTP ${response.statusCode}). Redirects are refused; no credentials were forwarded. Do not automatically retry uploads.`);
    }
    const receipt = await readTransferJSON(response);
    if (!state.completed || receipt.file !== source.file || receipt.bytes !== source.info.size || receipt.storage !== 'volume') {
      throw new TransferError('The API returned an invalid upload receipt. Recover the attempted remote filename before retrying.');
    }
    return { path: source.path, file: source.file, bytes: receipt.bytes, storage: 'volume', sha256: hash.digest('hex') };
  } finally {
    controller.abort();
    response?.destroy();
    await body?.return();
    await handle.close();
  }
}
