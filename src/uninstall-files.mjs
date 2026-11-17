import { lstat, rmdir, rm, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { InstallerError } from './errors.mjs';

async function statPath(path, cache) {
  if (cache?.has(path)) return cache.get(path);
  let info;
  try { info = await lstat(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    info = null;
  }
  cache?.set(path, info);
  return info;
}

export async function inspectRemoval(file, cache) {
  let result;
  for (let path = resolve(file); ; path = dirname(path)) {
    const info = await statPath(path, cache);
    if (path === resolve(file)) result = info;
    if (info?.isSymbolicLink() || (info && process.getuid && info.uid !== process.getuid() && path === resolve(file))) {
      throw new InstallerError(`Refusing to uninstall through a symlink or unowned path: ${file}. Nothing at that path was removed.`);
    }
    if (dirname(path) === path) break;
  }
  return result;
}

export async function removeFile(file) {
  const info = await inspectRemoval(file);
  if (!info) return false;
  if (!info.isFile()) throw new InstallerError(`Expected a regular installed file: ${file}. It was preserved.`);
  await unlink(file);
  return true;
}

export async function removeDirectory(file) {
  const info = await inspectRemoval(file);
  if (!info) return;
  if (!info.isDirectory()) throw new InstallerError(`Expected an installed directory: ${file}. It was preserved.`);
  await rm(file, { recursive: true });
}

export async function removeEmptyDirectory(file) {
  await inspectRemoval(file);
  try { await rmdir(file); } catch (error) {
    if (!['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) throw error;
  }
}
