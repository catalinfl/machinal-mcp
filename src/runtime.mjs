import { createHash, randomUUID } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { cp, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VERSION } from './version.mjs';
import { stateDirectory } from './paths.mjs';

export { stateDirectory } from './paths.mjs';

const ROOT = fileURLToPath(new URL('../', import.meta.url));
const FILES = ['bin/machinal-stdio.mjs', 'src/bridge.mjs', 'src/connection.mjs', 'src/credential-store.mjs',
  'src/credits.mjs', 'src/endpoints.mjs', 'src/errors.mjs', 'src/presentation.mjs', 'src/paths.mjs',
  'src/private-json.mjs', 'src/request-scheduler.mjs', 'src/scene-library.mjs', 'src/component-discovery.mjs',
  'src/stdio-files.mjs', 'src/template-compile.mjs', 'src/hybrid-edit.mjs', 'src/version.mjs', 'package.json'];

export function isManagedRuntimeCommand(command, context = {}) {
  if (!Array.isArray(command) || !isAbsolute(command[1] ?? '')) return false;
  const parts = relative(join(stateDirectory(context), 'runtime'), command[1]).split(sep);
  return parts.length === 3 && /^\d+\.\d+\.\d+(?:-[\w.-]+)?-(?:win32|linux|darwin)-[\w]+-[a-f\d]{16}$/.test(parts[0])
    && parts[1] === 'bin' && parts[2] === 'machinal-stdio.mjs' && command[2] === 'serve';
}

export function sameManagedRuntime(left, right, context) {
  return isManagedRuntimeCommand(left, context) && isManagedRuntimeCommand(right, context)
    && isDeepStrictEqual([left[0], ...left.slice(2)], [right[0], ...right.slice(2)]);
}

export function endpointFiles(url, context) {
  const id = createHash('sha256').update(url).digest('hex').slice(0, 24);
  const root = stateDirectory(context);
  return { catalogFile: join(root, 'catalogs', `${id}.json`), localConfig: join(root, 'local', id, 'providers.env') };
}

// A stable, private runtime avoids npm-cache eviction and Windows .cmd spawning bugs.
export async function installRuntime(context) {
  const content = await Promise.all(FILES.map((file) => readFile(join(ROOT, file))));
  const hash = createHash('sha256');
  for (const data of content) hash.update(data);
  hash.update(await readFile(join(ROOT, 'library', 'manifest.json')));
  const root = join(stateDirectory(context), 'runtime');
  const destination = join(root, `${VERSION}-${process.platform}-${process.arch}-${hash.digest('hex').slice(0, 16)}`);
  const script = join(destination, 'bin', 'machinal-stdio.mjs');
  try { if ((await lstat(script)).isFile()) return script; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(root, { recursive: true, mode: 0o700 });
  const staging = join(root, `.install-${randomUUID()}`);
  await mkdir(staging, { mode: 0o700 });
  try {
    for (let index = 0; index < FILES.length; index++) {
      const file = join(staging, FILES[index]);
      await mkdir(join(file, '..'), { recursive: true, mode: 0o700 });
      await writeFile(file, content[index], { mode: 0o600, flag: 'wx' });
    }
    const library = join(ROOT, 'library');
    await cp(library, join(staging, 'library'), {
      recursive: true, errorOnExist: true, filter: file => file !== join(library, 'runtime'),
    });
    try {
      const scope = join(ROOT, 'node_modules', '@napi-rs');
      for (const name of await readdir(scope)) {
        if (/^keyring(?:-|$)/.test(name)) await cp(join(scope, name), join(staging, 'node_modules', '@napi-rs', name), { recursive: true, errorOnExist: true });
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    try { await rename(staging, destination); } catch (error) {
      if (!['EEXIST', 'ENOTEMPTY', 'EPERM'].includes(error.code) || !(await lstat(script)).isFile()) throw error;
    }
    return script;
  } finally { await rm(staging, { recursive: true, force: true }); }
}
