import { lstat, mkdir, readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { InstallerError } from './errors.mjs';
import { planTextFile, saveConfiguration } from './configuration.mjs';
import { EDITING_STYLES } from './setup-options.mjs';
import referenceFiles from './reference-files.json' with { type: 'json' };

const READ_CONCURRENCY = 32;
const WRITE_CONCURRENCY = 16;

async function mapLimit(items, limit, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
  return results;
}

export const SKILL_FILES = [
  'machinal-editing/SKILL.md',
  'machinal-recipes/SKILL.md',
  'machinal-recipes/references/example.edit.yaml',
  'machinal-credits/SKILL.md',
  'machinal-scenes/SKILL.md',
  'machinal-cinema/SKILL.md',
  'machinal-review/SKILL.md',
  'machinal-media/SKILL.md',
  'machinal-support/SKILL.md',
  ...referenceFiles,
];
const bundle = fileURLToPath(new URL('../skills/', import.meta.url));

export function skillsDirectory({ client, scope, cwd = process.cwd(), home = homedir(), env = process.env }) {
  if (!['project', 'global'].includes(scope)) throw new InstallerError('Choose project or global skill scope.');
  if (client === 'opencode') return join(scope === 'project' ? join(cwd, '.opencode') : join(env.XDG_CONFIG_HOME || join(home, '.config'), 'opencode'), 'skills');
  if (client === 'claude') return join(scope === 'project' ? join(cwd, '.claude') : env.CLAUDE_CONFIG_DIR || join(home, '.claude'), 'skills');
  if (client === 'codex') return join(scope === 'project' ? cwd : home, '.agents', 'skills');
  if (client === 'antigravity') return scope === 'project' ? join(cwd, '.agents', 'skills') : join(home, '.gemini', 'config', 'skills');
  throw new InstallerError('Choose opencode, claude, codex, or antigravity.');
}

async function refuseSymlinkParents(files, root) {
  const directories = new Set();
  const boundary = dirname(root);
  for (const file of files) {
    let directory = dirname(file);
    while (directory.length >= boundary.length) {
      if (directories.has(directory)) break;
      directories.add(directory);
      if (directory === boundary) break;
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }
  await mapLimit([...directories], READ_CONCURRENCY, async (directory) => {
    try {
      if ((await lstat(directory)).isSymbolicLink()) throw new InstallerError('Skill directories must not be symlinks. Existing files were preserved.');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  });
}

export async function planSkills(options) {
  if (!EDITING_STYLES.includes(options.style)) throw new InstallerError('Unsupported editing style.');
  const root = skillsDirectory(options);
  const contents = await mapLimit(SKILL_FILES, READ_CONCURRENCY, async (file) => [file, await readFile(join(bundle, file), 'utf8')]);
  contents.push(['machinal-editing/references/preferences.md', `# Installed editing preference\n\nDefault style: **${options.style}**.\n\nUse this only when the user's current brief does not choose a different style. Read machinal://skills/editing for the profile definitions. This preference does not add YAML fields or authorize paid work.\n`]);
  const targets = contents.map(([relative, content]) => [join(root, relative), content]);
  await refuseSymlinkParents(targets.map(([file]) => file), root);
  const plans = await mapLimit(targets, READ_CONCURRENCY, ([file, content]) => planTextFile(file, content, { maxBytes: 4 * 1024 * 1024 }));
  return { root, plans, conflict: plans.some((plan) => plan.original !== null && plan.original !== plan.content) };
}

export async function saveSkills({ plans }) {
  const pending = plans.filter((plan) => plan.original !== plan.content);
  if (pending.length === 0) return { changed: 0, backups: [] };
  const saved = [];
  let failed = false;
  let cursor = 0;
  try {
    const directories = [...new Set(pending.map((plan) => dirname(plan.file)))];
    await mapLimit(directories, WRITE_CONCURRENCY, (directory) => mkdir(directory, { recursive: true }));
    const results = await Promise.allSettled(Array.from({ length: Math.min(WRITE_CONCURRENCY, pending.length) }, async () => {
      while (!failed && cursor < pending.length) {
        const plan = pending[cursor++];
        try {
          saved.push(await saveConfiguration(plan));
        } catch (error) {
          failed = true;
          throw error;
        }
      }
    }));
    const rejected = results.find((entry) => entry.status === 'rejected');
    if (rejected) throw rejected.reason;
  } catch {
    const backups = saved.filter((result) => result.backup).length;
    throw new InstallerError(`MCP configuration was saved, but skill installation was incomplete (${saved.filter((result) => result.changed).length} files updated). ${backups} completed skill backups were retained beside their originals under <filename>.machinal-backup-*. Check permissions/disk space and run setup again; any backup made during the failed write is also retained.`);
  }
  return { changed: saved.filter((result) => result.changed).length, backups: saved.map((result) => result.backup).filter(Boolean) };
}
