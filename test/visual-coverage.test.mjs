import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import { planSkills } from '../src/skills.mjs';
import { workspace } from './helpers.mjs';

test('all clients receive video-wide image coverage guidance without changing spending or edit scope', async (t) => {
  const cwd = await workspace(t);
  const files = [
    ['machinal-editing', 'SKILL.md'],
    ['machinal-scenes', 'SKILL.md'],
    ['machinal-scenes', 'references', 'workflow.md'],
    ['machinal-scenes', 'references', 'authoring.md'],
    ['machinal-recipes', 'references', 'jobs-scenes.md'],
    ['machinal-review', 'references', 'production.md'],
  ];
  for (const client of ['opencode', 'claude', 'codex']) {
    const bundle = await planSkills({ client, scope: 'project', cwd, style: 'auto' });
    for (const parts of files) {
      const file = join(...parts);
      const content = bundle.plans.find((plan) => plan.file.endsWith(file))?.content.toLowerCase();
      assert.ok(content, `${client}: missing ${file}`);
      for (const guidance of ['overly simplistic', 'svg/css', '5–10', 'per scene, not per video',
        'geographic context', 'period-grounded', 'approved budget', 'make the video cheap', 'procedural-only']) {
        assert.ok(content.includes(guidance), `${client}: ${file} lacks ${guidance}`);
      }
    }
    const workflow = bundle.plans.find((plan) => plan.file.endsWith(join('machinal-scenes', 'references', 'workflow.md'))).content;
    for (const guidance of ['YAML job type, not an MCP tool', 'generate_assets', 'compile_scene', 'timing-first checkpoint',
      'wait_for_job', 'get_job_result', 'inspect_scene', 'routing recommendation is not authorization']) {
      assert.ok(workflow.includes(guidance), `${client}: image workflow lacks ${guidance}`);
    }
  }
});
