import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const HYPERFRAMES_REVISION = '8ec98be29a64e88239a0c05f7e5d09f36e181493';
const referenceRoot = fileURLToPath(new URL('../../../packages/mcp-installer/library/', import.meta.url));
const textExtensions = new Set(['.md', '.mdx', '.html', '.css', '.js', '.mjs', '.cjs', '.ts', '.tsx', '.json', '.yaml', '.yml', '.svg', '.txt', '.glsl', '.frag', '.vert', '.py', '.sh', '.gitignore', '.gitkeep']);
const decoder = new TextDecoder('utf-8', { fatal: true });
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fileID = path => `file-${digest(path).slice(0, 24)}`;
const origin = { repository: 'https://github.com/heygen-com/hyperframes', revision: HYPERFRAMES_REVISION, license: 'Apache-2.0' };

export function safeHyperframesPath(path) {
  if (!/^[a-zA-Z0-9_. /@()-]+$/.test(path) || path.startsWith('/') || path.split('/').some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe Hyperframes path: ${path}`);
  }
  return path;
}

async function walk(root, path) {
  const files = [];
  for (const entry of (await readdir(join(root, path), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
    const child = safeHyperframesPath(`${path}/${entry.name}`);
    if (entry.isSymbolicLink()) throw new Error(`Refusing upstream symlink: ${child}`);
    if (entry.isDirectory()) files.push(...await walk(root, child));
    else if (entry.isFile()) files.push(child);
  }
  return files;
}

async function saveJSON(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function referenceEntry(id, label, category, description, path, files, extra = {}) {
  const primary = files.find(file => file.path === path);
  if (!primary) throw new Error(`Missing primary source: ${path}`);
  return {
    id, label, category, description, sourcePath: path, sha256: primary.sha256,
    origin, referenceOnly: true, adaptationGuideUri: 'machinal://reference/hyperframes',
    files: files.filter(file => file.path.startsWith(`${dirname(path).replaceAll('\\', '/')}/`)).map(file => ({
      id: file.id, path: file.path, bytes: file.bytes, sha256: file.sha256,
    })),
    ...extra,
  };
}

export async function importHyperframes(checkout, destination = referenceRoot) {
  const revision = execFileSync('git', ['-C', checkout, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (revision !== HYPERFRAMES_REVISION) throw new Error('Review and pin the new upstream revision before importing.');
  const vendor = join(destination, 'hyperframes-library');
  let previousManifest;
  try { previousManifest = JSON.parse(await readFile(join(vendor, 'manifest.json'), 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const roots = ['registry', 'skills', '.agents/skills', '.claude/skills', 'themes'];
  const paths = ['LICENSE', 'README.md', 'CREDITS.md', 'skills-manifest.json'];
  for (const optional of ['NOTICE', 'NOTICE.md']) {
    try { await readFile(join(checkout, optional)); paths.push(optional); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  for (const root of roots) paths.push(...await walk(checkout, root));
  const files = [];
  const excluded = [];
  for (const upstreamPath of paths.sort()) {
    const bytes = await readFile(join(checkout, upstreamPath));
    const path = upstreamPath
      .replace(/^\.agents\//, 'internal-agents/')
      .replace(/^\.claude\//, 'internal-claude/')
      .replace(/\/SKILL\.md$/, '/SKILL.upstream.md');
    const metadata = { path, upstreamPath, bytes: bytes.length, sha256: digest(bytes) };
    const basename = path.split('/').at(-1);
    if (!/^(LICENSE|NOTICE|COPYING|\.gitignore|\.gitkeep)([.-].*)?$/i.test(basename) && !textExtensions.has(extname(path))) {
      excluded.push({ ...metadata, reason: 'Preview/media binary; requires separate source/licence review and project-use approval.' });
      continue;
    }
    decoder.decode(bytes);
    if (bytes.length > 4 * 1024 * 1024) throw new Error(`Review oversized source: ${path}`);
    if (bytes.subarray(0, 42).toString().startsWith('version https://git-lfs.github.com/spec/')) throw new Error(`Unresolved Git LFS source: ${path}`);
    const target = join(vendor, path);
    await mkdir(dirname(target), { recursive: true });
    try {
      const currentHash = digest(await readFile(target));
      const previous = previousManifest?.files.find(file => file.path === path);
      if (currentHash !== metadata.sha256 && currentHash !== previous?.sha256) throw new Error(`Preserving modified vendored source: ${path}`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await writeFile(target, bytes);
    files.push({ id: fileID(path), label: path, category: 'source-file', description: `Original Hyperframes source: ${path}`, ...metadata, sourcePath: path, origin, referenceOnly: true, adaptationGuideUri: 'machinal://reference/hyperframes' });
  }
  const components = [];
  for (const file of files.filter(file => /^registry\/(components|blocks|examples)\/[^/]+\/registry-item\.json$/.test(file.path))) {
    const item = JSON.parse(await readFile(join(vendor, file.path), 'utf8'));
    const group = file.path.split('/')[1];
    components.push(referenceEntry(`${group}-${item.name}`, item.title || item.name, group, item.description || `${item.name}: ${item.type}`, file.path, files, {
      upstreamName: item.name, upstreamType: item.type, tags: item.tags || [],
      variables: item.variables || [], dependencies: item.dependencies || [], registryDependencies: item.registryDependencies || [],
    }));
  }
  const registry = JSON.parse(await readFile(join(vendor, 'registry/registry.json'), 'utf8'));
  for (const item of registry.items) {
    if (!components.some(entry => entry.upstreamName === item.name && entry.upstreamType === item.type)) {
      throw new Error(`Registry item missing from imported catalog: ${item.name} (${item.type})`);
    }
  }
  const skills = files.filter(file => /^(skills|internal-agents\/skills|internal-claude\/skills)\/[^/]+\/SKILL\.upstream\.md$/.test(file.path)).map(file => {
    const scope = file.path.startsWith('skills/') ? 'published' : file.path.startsWith('internal-agents/') ? 'internal-agents' : 'internal-claude';
    const name = file.path.split('/').at(-2);
    return referenceEntry(`${scope}-${name}`, name, scope, `${scope} Hyperframes skill; adapt to Machinal, do not execute upstream tooling.`, file.path, files);
  });
  const manifest = {
    ...origin, sourceBytesUnmodified: true,
    scope: 'All registry component/block/example source trees, all published and internal skills and supporting text/scripts, themes, licence and credits. No upstream renderer installation.',
    mediaPolicy: 'Preview and demo binary media are inventoried but not redistributed or approved for project use. External URLs and fonts in upstream sources are not bundled assets.',
    skillEntrypoints: 'Original SKILL.md files are renamed SKILL.upstream.md, bytes unchanged, to prevent automatic activation by agent clients.',
    files: files.map(({ id, path, upstreamPath, bytes, sha256 }) => ({ id, path, upstreamPath, bytes, sha256 })),
    excluded,
  };
  for (const previous of previousManifest?.files || []) {
    safeHyperframesPath(previous.path);
    if (files.some(file => file.path === previous.path)) continue;
    const target = join(vendor, previous.path);
    if (digest(await readFile(target)) !== previous.sha256) throw new Error(`Preserving modified old source: ${previous.path}`);
    await unlink(target);
  }
  await saveJSON(join(vendor, 'manifest.json'), manifest);
  await saveJSON(join(destination, 'hyperframes-components.json'), components);
  await saveJSON(join(destination, 'hyperframes-skills.json'), skills);
  await saveJSON(join(destination, 'hyperframes-files.json'), files);
  return { revision, components: components.length, skills: skills.length, files: files.length, excludedMedia: excluded.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv[2]) throw new Error('Pass an existing trusted, pinned Hyperframes checkout. No download or code execution is performed.');
  console.log(await importHyperframes(resolve(process.argv[2])));
}
