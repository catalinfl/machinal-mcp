import assert from 'node:assert/strict';
import test from 'node:test';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
  validatePatchRecipeOperations,
  validateRecipeComposition,
} from '../src/recipe-validation.mjs';
import { MCPBridge } from '../src/bridge.mjs';
import { LIBRARY_ROOT, SceneLibrary } from '../src/scene-library.mjs';
import { installRecipeFiles } from '../src/opencode-recipes.mjs';

test('all bundled library/examples/*.yaml pass validateRecipeComposition with zero false positives', async () => {
  const dir = join(LIBRARY_ROOT, 'examples');
  const files = (await readdir(dir)).filter(name => name.endsWith('.yaml')).sort();
  assert.ok(files.includes('narrated-2d-scenes-sfx.yaml'));
  for (const name of files) {
    const yaml = await readFile(join(dir, name), 'utf8');
    assert.doesNotThrow(() => validateRecipeComposition(yaml, { tool: 'validate_recipe' }), `validate_recipe failed on ${name}`);
    assert.doesNotThrow(() => validateRecipeComposition(yaml, { tool: 'generate_assets' }), `generate_assets failed on ${name}`);
  }
});

test('validateRecipeComposition rejects wrong root envelope, document.captions, and misplaced output dimensions', () => {
  assert.throws(
    () => validateRecipeComposition([
      'version: 1',
      'document:',
      '  width: 1080',
      '  height: 1920',
      '  fps: 30',
      '  duration: 55',
      'jobs:',
      '  - id: speech_narration',
      '    type: speech.generate',
      'captions:',
      '  enabled: true',
    ].join('\n'), { tool: 'generate_assets' }),
    /Invalid top-level `captions:`.*Invalid field\(s\) directly under `document:`/s,
  );

  assert.throws(
    () => validateRecipeComposition([
      'version: 2',
      'mode: assemble',
      'before:',
      '  - id: voice',
      '    type: speech.generate',
    ].join('\n'), { tool: 'generate_assets' }),
    /Missing top-level `document:` envelope/,
  );

  assert.throws(
    () => validateRecipeComposition([
      'document:',
      '  version: 2',
      '  mode: assemble',
      '  catalogVersion: 1',
      '  compilerVersion: 1',
      '  output: { aspect: portrait, resolution: 1080p, fps: 30, format: mp4 }',
      'bindings: {}',
      'assets: []',
    ].join('\n')),
    /`document\.catalogVersion: 1` must be a quoted string.*`document\.compilerVersion: 1` must be a quoted string/s,
  );
});

test('validateRecipeComposition rejects image.generate aspect aliases, transparent:true, and zero-duration image batches', () => {
  const badAspectYaml = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  before:',
    '    - id: img_portrait_shadow',
    '      type: image.generate',
    '      aspect: portrait',
    '      prompt: "Constructivist woodcut poster, no text."',
    '  placements:',
    '    - { job: img_portrait_shadow, track: { type: video, role: main }, start: 0s, duration: 2s }',
    '  output: { aspect: portrait, resolution: 1080p, fps: 30, format: mp4 }',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(badAspectYaml, { tool: 'generate_assets' }),
    /image\.generate job "img_portrait_shadow" uses unsupported aspect "portrait".*'9:16'/s,
  );

  const badTransparentYaml = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  before:',
    '    - id: img_cutout',
    '      type: image.generate',
    '      aspect: "1:1"',
    '      transparent: true',
    '      prompt: "Cutout portrait, no text."',
    '  placements:',
    '    - { job: img_cutout, track: { type: video, role: main }, start: 0s, duration: 2s }',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(badTransparentYaml, { tool: 'generate_assets' }),
    /background: transparent.*openai\/gpt-image-2\.5-sunburst/s,
  );

  const zeroDurationBatch = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  before:',
    '    - id: img_1',
    '      type: image.generate',
    '      aspect: "9:16"',
    '      prompt: "Poster art, no text."',
    '  output: { aspect: portrait, resolution: 1080p, fps: 30, format: mp4 }',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(zeroDurationBatch, { tool: 'generate_assets' }),
    /422 invalid_duration.*placements/s,
  );

  const validImageBatch = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  before:',
    '    - id: img_1',
    '      type: image.generate',
    '      aspect: "9:16"',
    '      background: opaque',
    '      prompt: "Poster art, no text."',
    '    - id: img_cutout',
    '      type: image.generate',
    '      model: openai/gpt-image-2.5-sunburst',
    '      aspect: "1:1"',
    '      background: transparent',
    '      prompt: "Isolated portrait cutout, no text."',
    '  placements:',
    '    - { job: img_1, track: { type: video, role: main }, start: 0s, duration: 2s }',
    '  output: { aspect: portrait, resolution: 1080p, fps: 30, format: mp4 }',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.doesNotThrow(() => validateRecipeComposition(validImageBatch, { tool: 'generate_assets' }));
});

test('validateRecipeComposition and validatePatchRecipeOperations reject same-track audio overlaps and fractional volumes while allowing separate audio tracks and video transition overlaps', () => {
  const overlappingAudioYaml = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  tracks:',
    '    - id: audio_sfx',
    '      type: audio',
    '      clips:',
    '        - id: sfx_proj_open',
    '          assetId: sfx_projector',
    '          start: 0.05',
    '          inPoint: 0',
    '          outPoint: 5.2',
    '          volume: 14',
    '        - id: sfx_stamp_s1',
    '          assetId: sfx_stamp',
    '          start: 0.85',
    '          inPoint: 0',
    '          outPoint: 0.55',
    '          volume: 28',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(overlappingAudioYaml, { tool: 'validate_recipe' }),
    /Audio track "audio_sfx" has overlapping clips.*separate audio tracks/s,
  );

  const fractionalVolumeYaml = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  tracks:',
    '    - id: audio_sfx',
    '      type: audio',
    '      clips:',
    '        - id: sfx_hit',
    '          assetId: sfx_stamp',
    '          start: 1s',
    '          inPoint: 0s',
    '          outPoint: 0.5s',
    '          volume: 0.25',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(fractionalVolumeYaml, { tool: 'validate_recipe' }),
    /fractional volume 0\.25.*0–200 PERCENT/s,
  );

  assert.throws(
    () => validatePatchRecipeOperations([
      {
        op: 'upsertTracks',
        tracks: [{
          id: 'audio_sfx',
          type: 'audio',
          clips: [
            { id: 'amb', assetId: 'p', start: 0.05, inPoint: 0, outPoint: 5.2, volume: 14 },
            { id: 'hit', assetId: 's', start: 0.85, inPoint: 0, outPoint: 0.55, volume: 28 },
          ],
        }],
      },
    ]),
    /Audio track "audio_sfx" has overlapping clips/,
  );

  assert.doesNotThrow(() => validatePatchRecipeOperations([
    {
      op: 'upsertTracks',
      tracks: [
        {
          id: 'main_video',
          type: 'video',
          clips: [
            { id: 'c1', assetId: 's1', start: 0, inPoint: 0, outPoint: 7.8, volume: 0 },
            { id: 'c2', assetId: 's2', start: 7.5, inPoint: 0, outPoint: 8.9, volume: 0 },
          ],
        },
        {
          id: 'audio_ambience',
          type: 'audio',
          clips: [{ id: 'amb', assetId: 'p', start: 0.05, inPoint: 0, outPoint: 5.2, volume: 14 }],
        },
        {
          id: 'audio_sfx',
          type: 'audio',
          clips: [
            { id: 'hit1', assetId: 's', start: 0.85, inPoint: 0, outPoint: 0.55, volume: 28 },
            { id: 'hit2', assetId: 's', start: 7.65, inPoint: 0, outPoint: 0.55, volume: 30 },
          ],
        },
      ],
    },
  ]));
});

test('MCPBridge blocks invalid generate_assets and patch_recipe locally before RPC, exposes yamlTemplates and toolSignatures in quickstart, and enriches tool hints', async () => {
  const upstreamCalls = [];
  const bridge = new MCPBridge({
    url: 'http://127.0.0.1:8080/mcp',
    env: {},
    credentialStore: null,
    requireQuickstart: false,
  });
  bridge.state = { status: 'connected' };
  bridge.tools = [
    { name: 'generate_assets', description: 'Generate assets.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, composition: { type: 'string' }, userApproved: { type: 'boolean' } } } },
    { name: 'patch_recipe', description: 'Patch recipe.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, operations: { type: 'array' } } } },
    { name: 'import_sound_effect', description: 'Import sound.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, id: { type: 'string' } } } },
    { name: 'get_asset_metadata', description: 'Get metadata.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' }, files: { type: 'array' } } } },
    { name: 'search_sound_effects', description: 'Search sounds.', inputSchema: { type: 'object', properties: { query: { type: 'string' } } } },
    { name: 'get_project', description: 'Get project.', inputSchema: { type: 'object', properties: { projectId: { type: 'string' } } } },
  ];
  bridge.rpc = async (_method, params) => {
    upstreamCalls.push(params);
    return { content: [{ type: 'text', text: '{"statusCode":200}' }], structuredContent: { statusCode: 200 } };
  };

  // Tool descriptions include parameter reminders
  const listed = new Map((await bridge.handle('tools/list')).tools.map(t => [t.name, t]));
  assert.match(listed.get('generate_assets').description, /aspect: "9:16"/);
  assert.match(listed.get('patch_recipe').description, /SEPARATE audio tracks/);
  assert.match(listed.get('import_sound_effect').description, /NOT soundId/);
  assert.match(listed.get('get_asset_metadata').description, /files: \[\{ id, file \}\]/);
  assert.match(listed.get('search_sound_effects').description, /userApproved: true/);
  assert.match(listed.get('get_project').description, /fullResult: true/);

  // Quickstart exposes copy-ready yamlTemplates and toolSignatures
  const qs = (await bridge.handle('tools/call', { name: 'production_quickstart', arguments: { purpose: 'create' } })).structuredContent.data;
  assert.match(qs.yamlTemplates.pass1TimingSpeechAndCaptions, /type: speech\.generate/);
  assert.match(qs.yamlTemplates.pass1TimingSpeechAndCaptions, /after:/);
  assert.match(qs.yamlTemplates.pass2ImageBatch, /aspect: "9:16"/);
  assert.match(qs.yamlTemplates.pass2ImageBatch, /placements:/);
  assert.equal(qs.yamlTemplates.pass3PatchRecipeAssembly.tool, 'patch_recipe');
  assert.match(qs.toolSignatures.import_sound_effect, /NOT `soundId`/);
  assert.match(qs.toolSignatures.get_asset_metadata, /NOT `file`/);

  // Blocked generate_assets never hits upstream RPC
  const blockedGen = await bridge.handle('tools/call', {
    name: 'generate_assets',
    arguments: {
      projectId: 'p1',
      idempotencyKey: 'k1',
      userApproved: true,
      composition: 'document:\n  version: 2\n  mode: assemble\n  before:\n    - id: img_1\n      type: image.generate\n      aspect: portrait\n      prompt: test\nbindings: {}\nassets: []\n',
    },
  });
  assert.equal(blockedGen.isError, true);
  assert.equal(blockedGen.structuredContent.submissionState, 'not-submitted');
  assert.match(blockedGen.structuredContent.message, /unsupported aspect "portrait"/);
  assert.match(blockedGen.structuredContent.message, /422 invalid_duration/);
  assert.equal(upstreamCalls.length, 0);

  // Blocked patch_recipe audio collision never hits upstream RPC
  const blockedPatch = await bridge.handle('tools/call', {
    name: 'patch_recipe',
    arguments: {
      projectId: 'p1',
      operations: [{
        op: 'upsertTracks',
        tracks: [{
          id: 'audio_sfx',
          type: 'audio',
          clips: [
            { id: 'a', assetId: 'x', start: 0, inPoint: 0, outPoint: 4, volume: 20 },
            { id: 'b', assetId: 'y', start: 1, inPoint: 0, outPoint: 0.5, volume: 30 },
          ],
        }],
      }],
    },
  });
  assert.equal(blockedPatch.isError, true);
  assert.equal(blockedPatch.structuredContent.submissionState, 'not-submitted');
  assert.match(blockedPatch.structuredContent.message, /overlapping clips/);
  assert.equal(upstreamCalls.length, 0);
});

test('OpenCode installRecipeFiles blocks invalid YAML compositions before upstream execution', async () => {
  let upstreamCount = 0;
  const tools = new Map([
    ['machinal_generate_assets', {
      description: 'Generate',
      input: { required: ['composition'], properties: { composition: { type: 'string' } } },
      execute: async () => { upstreamCount++; return { content: '{}' }; },
    }],
  ]);
  await installRecipeFiles({
    tool: { transform: async fn => fn({ update: (id, update) => { if (tools.has(id)) update(tools.get(id)); } }) },
    permission: { assert: async () => {} },
  }, ['machinal']);

  await assert.rejects(
    tools.get('machinal_generate_assets').execute({
      projectId: 'p1',
      composition: 'document:\n  version: 2\n  mode: assemble\n  before:\n    - id: img_1\n      type: image.generate\n      aspect: portrait\n      prompt: test\nbindings: {}\nassets: []\n',
    }, {}),
    /unsupported aspect "portrait"/,
  );
  assert.equal(upstreamCount, 0);
});

test('SceneLibrary serves the new narrated-2d-scenes-sfx example offline', async () => {
  const library = new SceneLibrary();
  const example = await library.reference({ topic: 'examples', id: 'narrated-2d-scenes-sfx' });
  assert.equal(example.entries.length, 1);
  assert.match(example.entries[0].composition, /id: audio_ambience/);
  assert.match(example.entries[0].composition, /id: audio_sfx/);
  assert.match(example.entries[0].composition, /preset: film-grain/);
});

test('validateRecipeComposition blocks zero-duration speech.generate batches and truncated narration audio clips', () => {
  const speechWithoutPlacement = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  before:',
    '    - id: vo_gen',
    '      type: speech.generate',
    '      model: google/gemini-3.8-flash-tts',
    '      text: "Hello world"',
    '  output: { aspect: portrait, resolution: 1080p, fps: 30, format: mp4 }',
    'bindings: {}',
    'assets: []',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(speechWithoutPlacement, { tool: 'generate_assets' }),
    /speech\.generate.*422 invalid_duration.*placements/s,
  );

  const truncatedNarration = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  tracks:',
    '    - id: main',
    '      type: video',
    '      clips:',
    '        - { id: c1, assetId: s1, start: 0, inPoint: 0, outPoint: 25.25 }',
    '    - id: narration',
    '      type: audio',
    '      clips:',
    '        - { id: vo_clip, assetId: vo_audio, start: 0, inPoint: 0, outPoint: 20, volume: 100 }',
    'bindings: {}',
    'assets:',
    '  - { id: s1, kind: video, file: s1.scene.json, duration: 25.25 }',
    '  - { id: vo_audio, kind: audio, file: voice_if_you.mp3, duration: 23.904 }',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(truncatedNarration, { tool: 'render_video' }),
    /cutting off the last 3\.90s.*23\.904s/s,
  );

  const missingOutPointRender = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  tracks:',
    '    - id: narration',
    '      type: audio',
    '      clips:',
    '        - { id: vo_clip, assetId: vo_audio, start: 0, volume: 100 }',
    'bindings: {}',
    'assets:',
    '  - { id: vo_audio, kind: audio, file: voice_if_you.mp3, duration: 23.904 }',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(missingOutPointRender, { tool: 'render_video' }),
    /missing `outPoint`.*23\.904/s,
  );

  const videoShorterThanNarration = [
    'document:',
    '  version: 2',
    '  mode: assemble',
    '  tracks:',
    '    - id: main',
    '      type: video',
    '      clips:',
    '        - { id: c1, assetId: s1, start: 0, inPoint: 0, outPoint: 20 }',
    '    - id: narration',
    '      type: audio',
    '      clips:',
    '        - { id: vo_clip, assetId: vo_audio, start: 0, inPoint: 0, outPoint: 23.904, volume: 100 }',
    'bindings: {}',
    'assets:',
    '  - { id: s1, kind: video, file: s1.scene.json, duration: 20 }',
    '  - { id: vo_audio, kind: audio, file: voice_if_you.mp3, duration: 23.904 }',
  ].join('\n');
  assert.throws(
    () => validateRecipeComposition(videoShorterThanNarration, { tool: 'render_video' }),
    /Visible video ends at 20\.00s while narration continues until 23\.90s/s,
  );
});
