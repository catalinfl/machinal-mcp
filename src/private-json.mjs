import { randomUUID } from 'node:crypto';
import { constants } from 'node:fs';
import { chmod, lstat, mkdir, open, rename, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { InstallerError } from './errors.mjs';

const MAX_BYTES = 64 * 1024;

function owned(info) {
  return !process.getuid || info.uid === process.getuid();
}

async function directory(file, create) {
  const path = dirname(file);
  if (create) await mkdir(path, { recursive: true, mode: 0o700 });
  const info = await lstat(path);
  if (!info.isDirectory() || info.isSymbolicLink() || !owned(info)) throw new Error('Unsafe directory');
  if (process.platform !== 'win32' && (info.mode & 0o077)) {
    if (!create) throw new Error('Directory permissions');
    await chmod(path, 0o700);
  }
}

async function inspect(file) {
  const info = await lstat(file);
  if (!info.isFile() || info.isSymbolicLink() || !owned(info) || info.size > MAX_BYTES
    || (process.platform !== 'win32' && (info.mode & 0o077))) throw new Error('Unsafe file');
  return info;
}

export async function readPrivateJSON(file) {
  let handle;
  try {
    await directory(file, false);
    const before = await inspect(file);
    handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    const info = await handle.stat();
    if (info.ino !== before.ino || info.dev !== before.dev || info.size > MAX_BYTES) throw new Error('File changed');
    const buffer = Buffer.alloc(MAX_BYTES + 1);
    let size = 0;
    while (size < buffer.length) {
      const { bytesRead } = await handle.read(buffer, size, buffer.length - size, null);
      if (!bytesRead) break;
      size += bytesRead;
    }
    if (size > MAX_BYTES) throw new Error('File too large');
    return JSON.parse(buffer.subarray(0, size).toString('utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new InstallerError('Could not read the private Machinal file. Check ownership, directory mode 0700 and file mode 0600; symlinks are not supported. Nothing was deleted.');
  } finally { await handle?.close(); }
}

export async function writePrivateJSON(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  let handle;
  try {
    await directory(file, true);
    try { await inspect(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const text = `${JSON.stringify(value, null, 2)}\n`;
    if (Buffer.byteLength(text) > MAX_BYTES) throw new Error('File too large');
    handle = await open(temporary, 'wx', 0o600);
    await handle.writeFile(text, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, file);
  } catch {
    throw new InstallerError('Could not save the private Machinal file. Check ownership, permissions and free disk space. No plaintext backup or alternate location was created.');
  } finally {
    await handle?.close();
    await unlink(temporary).catch(() => {});
  }
}

export async function deletePrivateJSON(file) {
  try {
    await directory(file, false);
    await inspect(file);
    await unlink(file);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new InstallerError('Could not delete the private Machinal file. Check ownership and permissions; nothing else was removed.');
  }
}
