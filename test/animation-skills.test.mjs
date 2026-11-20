import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import { planSkills } from '../src/skills.mjs';
import { syncReference } from '../scripts/sync-reference.mjs';
import { workspace } from './helpers.mjs';

const reference = new URL('../library/', import.meta.url);
const catalog = JSON.parse(await readFile(new URL('animation-skills.json', reference), 'utf8'));

test('all clients receive the exact MCP animation skill sources without loading an external runtime', async t => {
  assert.equal(catalog.length, 14);
  for (const client of ['opencode', 'claude', 'codex']) {
    const bundle = await planSkills({ client, scope: 'project', cwd: await workspace(t), style: 'auto' });
    for (const skill of catalog) {
      const source = await readFile(new URL(`animation-skills/${skill.id}.md`, reference), 'utf8');
      const installed = bundle.plans.find(plan => plan.file.endsWith(join(skill.id, 'SKILL.md')));
      assert.equal(installed?.content, source, `${client}: ${skill.id}`);
      assert.match(source, /(?:current.client|CURRENT client)/i);
      assert.match(source, /caption/i);
      assert.doesNotMatch(source, /npx.*(?:stewdio|remotion)/i);
    }
  }
});

test('sync path selection is bounded', async () => {
  await assert.rejects(syncReference({ installedSkills: ['../escape'] }), /Unsafe/);
  await syncReference({ check: true });
});
