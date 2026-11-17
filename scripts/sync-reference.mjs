import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const repository = resolve(packageRoot, '../..');
const library = join(packageRoot, 'library');
const guideCopies = [
  ['media', 'machinal-media/references/workflow.md'],
  ['reference-overview', 'machinal-editing/references/workflow.md'],
  ['brief', 'machinal-editing/references/brief.md'],
  ['production', 'machinal-review/references/production.md'],
  ['styles', 'machinal-editing/references/styles.md'],
  ['transitions', 'machinal-editing/references/transitions.md'],
  ['effects', 'machinal-editing/references/effects.md'],
  ['looks-motion', 'machinal-editing/references/looks-motion.md'],
  ['yaml', 'machinal-recipes/references/yaml.md'],
  ['text-audio', 'machinal-recipes/references/text-audio.md'],
  ['jobs-scenes', 'machinal-recipes/references/jobs-scenes.md'],
  ['jobs-scenes', 'machinal-scenes/references/workflow.md'],
  ['scene-authoring', 'machinal-scenes/references/authoring.md'],
  ['scene-templates', 'machinal-scenes/references/scene-templates.md'],
  ['animation-skills', 'machinal-motion/references/index.md'],
  ['film-styles', 'machinal-cinema/references/workflow.md'],
  ['hyperframes', 'machinal-hyperframes/references/workflow.md'],
  ['commands', 'machinal-recipes/references/commands.md'],
  ['examples', 'machinal-recipes/references/examples.md'],
];

export async function referenceCopies() {
  const copies = guideCopies.map(([guide, target]) => ({
    source: join(library, 'guides', `${guide}.md`), target,
  }));
  copies.push(
    { source: join(library, 'scene-runtime.md'), target: 'machinal-scenes/references/runtime.md' },
    { source: join(library, 'styles.json'), target: 'machinal-editing/references/styles.json' },
    { source: join(library, 'scene-templates.json'), target: 'machinal-scenes/references/scene-templates.json' },
    { source: join(library, 'film-styles.json'), target: 'machinal-cinema/references/film-styles.json' },
    { source: join(library, 'film-techniques.json'), target: 'machinal-cinema/references/film-techniques.json' },
    { source: join(library, 'catalog.v1.json'), target: 'machinal-recipes/references/catalog.v1.json' },
  );
  const examples = (await readdir(join(library, 'examples'))).filter((name) => /^[a-z0-9-]+\.yaml$/.test(name)).sort();
  for (const name of examples) copies.push({ source: join(library, 'examples', name), target: `machinal-recipes/references/examples/${name}` });
  const templates = (await readdir(join(library, 'scene-templates'))).filter((name) => /^[a-z0-9-]+\.svelte$/.test(name)).sort();
  for (const name of templates) copies.push({ source: join(library, 'scene-templates', name), target: `machinal-scenes/references/scene-templates/${name}` });
  const animationSkills = JSON.parse(await readFile(join(library, 'animation-skills.json'), 'utf8'));
  for (const skill of animationSkills) {
    if (!/^machinal-[a-z]+(?:-[a-z]+)*$/.test(skill.id)) throw new Error('Unsafe animation skill ID');
    copies.push({ source: join(library, `animation-skills/${skill.id}.md`), target: `${skill.id}/SKILL.md` });
  }
  copies.push({ source: join(library, 'animation-skills.json'), target: 'machinal-motion/references/catalog.json' });
  const vendorRoot = join(library, 'film-library');
  const manifest = JSON.parse(await readFile(join(vendorRoot, 'manifest.json'), 'utf8'));
  for (const name of ['manifest.json', ...manifest.files.map((file) => file.path)]) {
    if (!/^[a-zA-Z0-9_./-]+$/.test(name) || name.startsWith('/') || name.split('/').some((part) => !part || part === '.' || part === '..')) throw new Error('Unsafe vendored reference path');
    copies.push({ source: join(vendorRoot, name), target: `machinal-cinema/references/film-library/${name}` });
  }
  for (const topic of ['components', 'skills', 'files', 'native']) {
    copies.push({ source: join(library, `hyperframes-${topic}.json`), target: `machinal-hyperframes/references/hyperframes-${topic}.json` });
  }
  const hyperframesRoot = join(library, 'hyperframes-library');
  const hyperframesManifest = JSON.parse(await readFile(join(hyperframesRoot, 'manifest.json'), 'utf8'));
  for (const name of ['manifest.json', ...hyperframesManifest.files.map(file => file.path)]) {
    if (!/^[a-zA-Z0-9_. /@()-]+$/.test(name) || name.startsWith('/') || name.split('/').some(part => !part || part === '.' || part === '..')) throw new Error('Unsafe Hyperframes reference path');
    const target = name.split('/').some(part => ['.gitignore', '.npmignore', 'package-lock.json'].includes(part)) ? `${name}.upstream` : name;
    copies.push({ source: join(hyperframesRoot, name), target: `machinal-hyperframes/references/hyperframes-library/${target}`, verbatim: true });
  }
  return copies;
}

async function syncText(destination, content, check, verbatim = false) {
  const normalized = verbatim ? content : content.replaceAll('\r\n', '\n');
  let current;
  try { current = await readFile(destination, 'utf8'); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    current = null;
  }
  if ((verbatim ? current : current?.replaceAll('\r\n', '\n')) === normalized) return;
  if (check) {
    throw new Error(`Bundled reference is stale: ${destination}. Run npm run sync:reference from packages/mcp-installer.`);
  }
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, normalized, 'utf8');
}

export async function syncReference({ check = false, installed = false, installedSkills = [] } = {}) {
  if (installedSkills.some(id => !/^machinal-[a-z]+(?:-[a-z]+)*$/.test(id))) throw new Error('Unsafe installed skill ID');
  const copies = await referenceCopies();
  const concurrency = 32;
  for (let offset = 0; offset < copies.length; offset += concurrency) {
    const batch = copies.slice(offset, offset + concurrency);
    const results = await Promise.allSettled(batch.map(async copy => {
      const content = await readFile(copy.source, 'utf8');
      await syncText(join(packageRoot, 'skills', copy.target), content, check, copy.verbatim);
      if (installed || installedSkills.includes(copy.target.split('/')[0])) {
        await syncText(join(repository, '.opencode/skills', copy.target), content, check, copy.verbatim);
      }
    }));
    const failure = results.find(result => result.status === 'rejected');
    if (failure) throw failure.reason;
  }
  const manifest = copies.map((copy) => copy.target).sort();
  await syncText(join(packageRoot, 'src/reference-files.json'), `${JSON.stringify(manifest, null, 2)}\n`, check);
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const selected = process.argv.find(arg => arg.startsWith('--installed-skills='))?.split('=')[1]?.split(',') ?? [];
  const files = await syncReference({ check: process.argv.includes('--check'), installed: process.argv.includes('--installed'), installedSkills: selected });
  console.log(`${process.argv.includes('--check') ? 'Verified' : 'Synced'} ${files.length} reference files from the client-owned MCP library and versioned execution-contract snapshots.`);
}
