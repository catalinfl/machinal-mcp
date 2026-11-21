import assert from 'node:assert/strict';
import test from 'node:test';
import { planHybridEdit } from '../src/hybrid-edit.mjs';
import { MCPBridge } from '../src/bridge.mjs';
import { installSceneLibrary } from '../src/opencode-library.mjs';

const beats = [
  { id: 'title', action: 'layers', duration: 4 },
  { id: 'street', action: 'camera', duration: 13, dissolve: 0.5, assetId: 'street-photo' },
  { id: 'window', action: 'camera', duration: 14, motion: 'zoom-in' },
  { id: 'comparison', action: 'layers', duration: 4 },
  { id: 'detail', action: 'camera', duration: 12, dissolve: 0.5 },
  { id: 'dusk', action: 'camera', duration: 13, motion: 'none' },
];

test('one minute of timed visuals needs only two browser captures; dissolves do not shorten narration coverage', () => {
  const plan = planHybridEdit({ beats });
  const { tracks: [{ clips }], transitions, output } = plan.documentFields;
  assert.equal(plan.duration, 60);
  assert.deepEqual(clips.map(c => c.start), [0, 4, 17, 31, 35, 47]);
  assert.equal(clips.at(-1).start + clips.at(-1).outPoint, 60);
  assert.equal(clips[1].assetId, 'street-photo');
  assert.ok(!plan.missingAssetFor.includes('street'));
  assert.equal(clips[2].assetId, undefined);
  assert.ok(plan.missingAssetFor.includes('window'));
  assert.equal(clips[2].motion, 'zoom-in');
  for (const tr of transitions) {
    const left = clips.find(c => c.id === tr.leftClipId), right = clips.find(c => c.id === tr.rightClipId);
    assert.equal((left.start + left.outPoint) - right.start, tr.duration);
  }
  assert.deepEqual(plan.newScenes.map(s => s.clipId), ['title', 'comparison']);
  assert.ok(plan.newScenes.every(s => s.compileSettings.visualMode === '2d' && s.compileSettings.fps === output.fps));
  assert.equal(plan.captureBudget.newSceneFrames, 192);
  assert.equal(output.fps, 24);
});

test('explicit format, fractional outgoing handles and pinned sources survive a draft/revision', () => {
  const { captureBudget, newScenes, documentFields } = planHybridEdit({ fps: 30, resolution: '720p', aspect: 'portrait', beats: [
    { id: 'orbit', action: 'spatial', duration: 1.01, dissolve: 0.125 },
    { id: 'reuse', assetId: 'existing-version', action: 'layers', duration: 3 },
  ] });
  assert.deepEqual(newScenes, [{ clipId: 'orbit', frames: 35, compileSettings: { width: 720, height: 1280, fps: 30, duration: 1.135, visualMode: '3d' } }]);
  assert.equal(documentFields.tracks[0].clips[1].assetId, 'existing-version');
  assert.equal(documentFields.output.fps, 30);
  assert.deepEqual(captureBudget, { newSceneFrames: 35, pinnedSceneClipIdsNotEstimated: ['reuse'] });
});

test('rejects out-of-bounds source handles, conflicting cue geometry and invalid timing instead of silently retiming', () => {
  for (const input of [
    { beats: [] }, { beats, fps: 61 }, { beats: [beats[0], beats[0]] }, { beats: [{ ...beats[0], duration: NaN }] },
    { beats: [{ ...beats[0], duration: 59.9, dissolve: 0.2 }, beats[2]] },
    { beats: [{ ...beats[0], duration: 1, dissolve: 0.5 }, { ...beats[2], duration: 1 }] },
    { beats: [{ ...beats[1], dissolve: 1 }, { ...beats[2], duration: 0.2, dissolve: 2 }, beats[5]] },
    { beats: [{ ...beats[0], dissolve: 0.5 }] }, { beats: [null] },
  ]) assert.throws(() => planHybridEdit(input));
});

test('stdio and OpenCode expose the same offline plan without reading media, credentials or project state', async () => {
  const bridge = new MCPBridge({ url: 'http://127.0.0.1:1/mcp', credentialStore: null, env: {},
    fetchImpl: async () => assert.fail('unexpected remote call') });
  assert.ok((await bridge.handle('tools/list')).tools.some(t => t.name === 'plan_hybrid_edit'));
  const run = args => bridge.handle('tools/call', { name: 'plan_hybrid_edit', arguments: args });
  const tools = new Map();
  await installSceneLibrary({ tool: { transform: fn => fn({ add: t => tools.set(t.name, t) }) }, session: { hook() {} } });
  const local = await tools.get('machinal_hybrid_edit').execute({ beats });
  assert.deepEqual(JSON.parse(local.content), (await run({ beats })).structuredContent);
  assert.equal((await run({ beats: [] })).isError, true);
});
