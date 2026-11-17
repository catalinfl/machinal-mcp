import { createHash } from 'node:crypto';
import { readFile, readdir, writeFile, mkdir, cp } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../library/', import.meta.url));
const skillRoot = fileURLToPath(new URL('../skills/', import.meta.url));
const skills = [];
await mkdir(join(root, 'skills'), { recursive: true });
for (const entry of (await readdir(skillRoot, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
  if (!entry.isDirectory() || !/^machinal-[a-z-]+$/.test(entry.name)) continue;
  const source = await readFile(join(skillRoot, entry.name, 'SKILL.md'), 'utf8');
  const description = source.match(/^description:\s*(.+)$/m)?.[1];
  if (!description) throw new Error(`Missing skill description: ${entry.name}`);
  const sourcePath = `skills/${entry.name}.md`;
  await writeFile(join(root, sourcePath), source);
  skills.push({ id: entry.name, label: entry.name, description, sourcePath });
}
await writeFile(join(root, 'skills.json'), JSON.stringify(skills, null, 2) + '\n');
if (process.argv.includes('--contracts')) {
  // Execution contracts remain renderer/API-owned; this is an explicitly
  // versioned offline snapshot, not the source of supported runtime features.
  await cp(new URL('../../../api/editengine/catalog/catalog.v1.json', import.meta.url), join(root, 'catalog.v1.json'));
  await cp(new URL('../../../api/editengine/scenecontract/runtime.md', import.meta.url), join(root, 'scene-runtime.md'));
}
const files = {};
async function visit(directory, prefix = '') {
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = prefix + entry.name;
    if (path === 'manifest.json' || path === 'runtime') continue;
    if (/^(?:\.gitignore|\.npmignore|package-lock\.json)\.upstream$/.test(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Library symlinks are not distributable: ${path}`);
    if (entry.isDirectory()) await visit(join(directory, entry.name), path + '/');
    else {
      const bytes = await readFile(join(directory, entry.name));
      const npmExcluded = ['.gitignore', '.npmignore', 'package-lock.json'].includes(entry.name);
      const storagePath = npmExcluded ? `${path}.upstream` : path;
      if (npmExcluded) await writeFile(join(root, storagePath), bytes);
      files[path] = { bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'),
        ...(npmExcluded ? { storagePath } : {}) };
    }
  }
}
await visit(root);
const version = createHash('sha256').update(JSON.stringify(files)).digest('hex');
await writeFile(join(root, 'manifest.json'), JSON.stringify({
  format: 1, version: `sha256:${version}`, files,
}, null, 2) + '\n');
console.log(`Client scene library: ${Object.keys(files).length} pinned files, sha256:${version}`);
