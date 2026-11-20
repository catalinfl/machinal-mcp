import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { safeHyperframesPath, HYPERFRAMES_REVISION } from '../scripts/import-hyperframes.mjs';
import { syncReference } from '../scripts/sync-reference.mjs';
import { planSkills } from '../src/skills.mjs';
import { workspace } from './helpers.mjs';

const reference = new URL('../library/', import.meta.url);
const bundle = new URL('../skills/machinal-hyperframes/references/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('hyperframes-library/manifest.json', reference), 'utf8'));

test('complete pinned component and skill source catalogs retain provenance and inactive original entrypoints', async () => {
  assert.equal(manifest.revision, HYPERFRAMES_REVISION);
  const components = JSON.parse(await readFile(new URL('hyperframes-components.json', reference), 'utf8'));
  const skills = JSON.parse(await readFile(new URL('hyperframes-skills.json', reference), 'utf8'));
  const native = JSON.parse(await readFile(new URL('hyperframes-native.json', reference), 'utf8'));
  assert.deepEqual(Object.fromEntries(['components', 'blocks', 'examples'].map(category => [category, components.filter(item => item.category === category).length])), { components: 238, blocks: 210, examples: 9 });
  assert.equal(skills.length, 21);
  assert.equal(skills.filter(skill => skill.category === 'published').length, 9);
  assert.equal(native.length, 457);
  assert.equal(new Set(components.map(item => item.id)).size, 457);
  assert.ok(manifest.excluded.length > 0);
  for (const file of manifest.files) {
    assert.ok(!file.path.endsWith('/SKILL.md'), file.path);
    const original = await readFile(new URL(`hyperframes-library/${file.path}`, reference));
    const offline = await readFile(new URL(`hyperframes-library/${file.path}`, bundle));
    assert.equal(original.length, file.bytes, file.path);
    assert.equal(createHash('sha256').update(original).digest('hex'), file.sha256, file.path);
    assert.deepEqual(offline, original, file.path);
  }
  assert.match(await readFile(new URL('hyperframes-library/LICENSE', bundle), 'utf8'), /Apache License/);
  assert.match(await readFile(new URL('hyperframes-library/CREDITS.md', bundle), 'utf8'), /GSAP Standard License/);
});

test('source paths reject traversal and retain safe upstream dot-directories', () => {
  for (const path of ['/LICENSE', '../secret', 'skills/../secret', 'C:/secret', 'skills\\secret', 'skills//secret']) {
    assert.throws(() => safeHyperframesPath(path), /Unsafe/);
  }
  assert.equal(safeHyperframesPath('.agents/skills/review/SKILL.upstream.md'), '.agents/skills/review/SKILL.upstream.md');
});

test('all client bundles contain adapted skills, original references and no active upstream skills', async t => {
  for (const client of ['opencode', 'claude', 'codex']) {
    const planned = await planSkills({ client, scope: 'project', cwd: await workspace(t), style: 'auto' });
    const active = planned.plans.filter(plan => /[\\/]machinal-hyperframes(?:-[a-z-]+)?[\\/]SKILL\.md$/.test(plan.file));
    assert.equal(active.length, 9, client);
    for (const plan of active) {
      assert.match(plan.content, /CURRENT client/);
      assert.match(plan.content, /Preserve ALL existing captions/);
      assert.match(plan.content, /reference-only/);
      assert.match(plan.content, /Apache-2.0/);
      assert.match(plan.content, /nativeTemplateId/);
      assert.doesNotMatch(plan.content, /Native starting points: `hyperframes-count-up`/);
    }
    assert.ok(planned.plans.some(plan => plan.file.endsWith('SKILL.upstream.md')));
    assert.ok(!planned.plans.some(plan => /hyperframes-library[\\/].*[\\/]SKILL\.md$/.test(plan.file)));
  }
  await syncReference({ check: true });
});
