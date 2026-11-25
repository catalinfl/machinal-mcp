import assert from 'node:assert/strict';
import test from 'node:test';
import { chooseEndpoint, chooseSkillOptions, DEFAULT_LOCAL_URL, MACHINAL_SERVER_URL } from '../src/setup-options.mjs';

test('the interactive wizard offers only Server Machinal (cloud) and Local without prompting for a Local API URL', async () => {
  const prompts = [];
  const ui = {
    select: async (question) => { prompts.push(question); return 'local'; },
    input: async (question) => assert.fail(`Local mode must not prompt for ${question.message}`),
  };
  assert.deepEqual(await chooseEndpoint({}, { env: {}, interactive: true, ui }), { mode: 'local', url: DEFAULT_LOCAL_URL });
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].message, 'API location');
  assert.deepEqual(prompts[0].choices.map((choice) => choice.value), ['server', 'local']);
  assert.equal(prompts[0].choices[0].name, 'Server Machinal (cloud)');
  assert.equal(prompts[0].choices[1].name, 'Local');
  assert.equal(prompts[0].default, 'server');
});

test('local mode always uses the default machinal-studio URL without prompting or reusing environment overrides', async () => {
  const ui = {
    select: async () => 'local',
    input: async (question) => assert.fail(`Local mode must never prompt for ${question.message}`),
  };
  for (const env of [{}, { MACHINAL_API_ORIGIN: 'https://hosted.example' }, { MACHINAL_API_ORIGIN: 'http://localhost:9090' }]) {
    assert.deepEqual(await chooseEndpoint({}, { env, interactive: true, ui }), { mode: 'local', url: DEFAULT_LOCAL_URL });
    assert.deepEqual(await chooseEndpoint({ mode: 'local' }, { env, interactive: true, ui }), { mode: 'local', url: DEFAULT_LOCAL_URL });
  }
});

test('Machinal Server uses its official endpoint without an address prompt or stale environment override', async () => {
  const ui = {
    select: async () => 'server',
    input: async () => assert.fail('Machinal Server must not ask for an address'),
  };
  for (const env of [{}, { MACHINAL_API_ORIGIN: DEFAULT_LOCAL_URL }, { DIRECTION_API_ORIGIN: 'https://old.example' }, { MACHINAL_API_ORIGIN: 'invalid ignored value' }]) {
    assert.deepEqual(await chooseEndpoint({}, { env, interactive: true, ui }), { mode: 'server', url: MACHINAL_SERVER_URL });
    assert.deepEqual(await chooseEndpoint({ mode: 'server' }, { env, interactive: false }), { mode: 'server', url: MACHINAL_SERVER_URL });
  }
  assert.deepEqual(await chooseEndpoint({ mode: 'hosted' }, { env: {}, interactive: false }), { mode: 'server', url: MACHINAL_SERVER_URL });
  assert.deepEqual(await chooseEndpoint({}, { env: {}, interactive: false }), { mode: 'server', url: MACHINAL_SERVER_URL });
});

test('explicit --mode custom asks for an API address, without a misleading localhost default', async () => {
  const ui = {
    input: async (question) => { assert.equal(question.default, undefined); assert.match(question.message, /Custom server/); return 'https://my-api.example'; },
  };
  assert.deepEqual(await chooseEndpoint({ mode: 'custom' }, { env: {}, interactive: true, ui }), { mode: 'custom', url: 'https://my-api.example/mcp' });
  await assert.rejects(chooseEndpoint({ mode: 'custom' }, { env: {}, interactive: false }), /requires --url/);
});

test('existing directional API-origin settings still work as a migration alias', async () => {
  const context = { env: { DIRECTION_API_ORIGIN: 'https://legacy.example' }, interactive: false };
  assert.deepEqual(await chooseEndpoint({}, context), { mode: 'custom', url: 'https://legacy.example/mcp' });
});

test('mode flags work unattended, infer existing --url usage, and reject contradictory addresses', async () => {
  const context = { env: {}, interactive: false };
  assert.deepEqual(await chooseEndpoint({ mode: 'local' }, context), { mode: 'local', url: DEFAULT_LOCAL_URL });
  assert.deepEqual(await chooseEndpoint({ url: 'https://api.example' }, context), { mode: 'custom', url: 'https://api.example/mcp' });
  assert.deepEqual(await chooseEndpoint({ mode: 'server', url: DEFAULT_LOCAL_URL }, context), { mode: 'custom', url: DEFAULT_LOCAL_URL });
  assert.deepEqual(await chooseEndpoint({ mode: 'hosted', url: DEFAULT_LOCAL_URL }, context), { mode: 'custom', url: DEFAULT_LOCAL_URL });
  assert.deepEqual(await chooseEndpoint({ url: DEFAULT_LOCAL_URL }, context), { mode: 'custom', url: DEFAULT_LOCAL_URL });
  assert.deepEqual(await chooseEndpoint({ mode: 'custom', url: 'https://api.example' }, context), { mode: 'custom', url: 'https://api.example/mcp' });
  for (const values of [{ mode: 'invalid' }, { mode: 'local', url: 'https://api.example' }]) {
    await assert.rejects(chooseEndpoint(values, context));
  }
});

test('interactive custom URLs are validated without exiting or echoing credentials', async () => {
  let validated = false;
  const ui = { input: async (question) => {
    validated = true;
    assert.match(question.validate('http://bad.example'), /HTTPS/);
    assert.match(question.validate('https://user:secret@api.example'), /credentials/);
    assert.equal(question.validate('https://api.example'), true);
    return 'https://api.example';
  } };
  assert.deepEqual(await chooseEndpoint({ mode: 'custom' }, { env: {}, interactive: true, ui }), { mode: 'custom', url: 'https://api.example/mcp' });
  assert.equal(validated, true);
});

test('bundled skills are optional and style selection is validated', async () => {
  assert.equal(await chooseSkillOptions({ 'no-skills': true }, { interactive: false }), null);
  assert.deepEqual(await chooseSkillOptions({}, { interactive: false }), { style: 'auto' });
  assert.deepEqual(await chooseSkillOptions({ style: 'cinematic' }, { interactive: false }), { style: 'cinematic' });
  for (const values of [{ style: 'unsupported' }, { style: 'social', 'no-skills': true }, { 'replace-skills': true, 'no-skills': true }]) {
    await assert.rejects(chooseSkillOptions(values, { interactive: false }));
  }
  assert.equal(await chooseSkillOptions({}, { interactive: true, ui: { confirm: async () => false } }), null);
});
