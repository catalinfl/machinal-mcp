import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateNativePort } from '../scripts/build-hyperframes-native.mjs';

const reference = new URL('../../../packages/mcp-installer/library/', import.meta.url);
const entry = { id: 'components-example', category: 'components', upstreamName: 'example', files: [{ path: 'registry/components/example/example.html' }] };
const metadata = {
  id: entry.id, nativePath: 'components/example.svelte', status: 'ported', visualMode: '2d',
  sourcePaths: [entry.files[0].path], requiredImages: [], requiredVideos: [],
};
const component = `<!-- Apache-2.0 modified native port --><script>import {SceneCanvas,useScene} from '@machinal/scenes/svelte';const scene=useScene();const design={label:'Example'};</script><SceneCanvas><div>{design.label} {scene.frame.progress}</div></SceneCanvas>`;

test('native migration validation rejects HTML wrappers, clocks, arbitrary imports and mismatched provenance', () => {
  assert.equal(validateNativePort(entry, metadata, Buffer.from(component)).nativePath, metadata.nativePath);
  const documentedDeterminism = component.replace('</script>', `
    // Math.random(), requestAnimationFrame() and setTimeout() are forbidden in executable code.
    /* Date.now() and performance.now() are also forbidden in executable code. */
  </script>`);
  assert.equal(validateNativePort(entry, metadata, Buffer.from(documentedDeterminism)).nativePath, metadata.nativePath);
  for (const forbidden of ['{@html original}', 'node.innerHTML = source', '<iframe src="old.html">', 'requestAnimationFrame(tick)', 'Math.random()', 'setTimeout(tick, 20)', "import gsap from 'gsap'"]) {
    assert.throws(() => validateNativePort(entry, metadata, Buffer.from(component + forbidden)), /Non-native/);
  }
  const relativeImport = component.replace('</script>', `\nimport old from './legacy.html';\n</script>`);
  assert.throws(() => validateNativePort(entry, metadata, Buffer.from(relativeImport)), /Non-native/);
  assert.throws(() => validateNativePort(entry, { ...metadata, status: 'blocked' }, Buffer.from(component)), /status/);
  assert.throws(() => validateNativePort(entry, { ...metadata, sourcePaths: ['../secret'] }, Buffer.from(component)), /provenance/);
  assert.throws(() => validateNativePort(entry, { ...metadata, visualMode: '3d' }, Buffer.from(component)), /visual mode/);
  assert.throws(() => validateNativePort(entry, { ...metadata, requiredImages: [{ id: 'image_5', role: 'unsupported' }] }, Buffer.from(component)), /attachment/);
  assert.throws(() => validateNativePort(entry, metadata, Buffer.alloc(64001)), /source limits/);
});

test('verbatim GSAP ports may import the upstream engine and build their own markup', () => {
  const verbatim = { ...metadata, animationRuntime: 'gsap' };
  const upstream = `${component}${"import { gsap } from 'gsap';"}${'node.innerHTML = rowTemplate;'}`;
  assert.equal(validateNativePort(entry, verbatim, Buffer.from(upstream)).nativePath, metadata.nativePath);
  // Everything non-deterministic still fails, whatever the runtime.
  for (const forbidden of ['requestAnimationFrame(tick)', 'Math.random()', 'setTimeout(tick, 20)']) {
    assert.throws(() => validateNativePort(entry, verbatim, Buffer.from(upstream + forbidden)), /Non-native/);
  }
  const remoteImport = upstream.replace('</script>', `\nimport remote from 'https://cdn.example/three.js';\n</script>`);
  assert.throws(() => validateNativePort(entry, verbatim, Buffer.from(remoteImport)), /Non-native/);
});

test('native ledger exposes only verified Svelte ports and distinguishes runtime capture from source equivalence', async () => {
  const [catalog, ledger, templateCatalog] = await Promise.all([
    readFile(new URL('hyperframes-components.json', reference), 'utf8').then(JSON.parse),
    readFile(new URL('hyperframes-native.json', reference), 'utf8').then(JSON.parse),
    readFile(new URL('scene-templates.json', reference), 'utf8').then(JSON.parse),
  ]);
  assert.equal(catalog.length, 457);
  assert.equal(ledger.length, catalog.length);
  // Every entry is accounted for: a verbatim source-matched port, or a blocked
  // entry with the concrete reason it cannot be a self-contained port (shared
  // WebGL/three.js runtime, source media, missing upstream page, no timeline).
  const ported = ledger.filter(port => port.status === 'ported');
  const blocked = ledger.filter(port => port.status === 'blocked');
  const pending = ledger.filter(port => port.status === 'pending');
  assert.equal(ported.length + blocked.length + pending.length, ledger.length);
  assert.ok(blocked.every(port => port.limitations.length > 0), 'every blocked entry must document its blocker');
  assert.ok(pending.every(port => port.limitations.length > 0), 'every unreviewed entry must document why it is pending');
  assert.ok(ported.every(port => port.verification.compiled), 'every native Svelte port must pass landscape and portrait compilation');
  for (const port of ported) {
    const comparison = port.verification.originalComparison;
    if (comparison) {
      assert.equal(comparison.sampledPixelsIdentical, true, `${port.id} sampled PNGs differ`);
      assert.equal(comparison.snapshotDifferences, 0, `${port.id} source snapshot differs`);
    }
    const capture = port.verification.runtimeCapture;
    if (capture) {
      assert.equal(capture.rendered, true, port.id);
      assert.equal(capture.sourceVersion, port.sourceVersion, port.id);
      assert.match(capture.runtimeVersion, /^sha256:[a-f0-9]{64}$/, port.id);
      assert.match(capture.dependencySnapshot, /^sha256:[a-f0-9]{64}$/, port.id);
      assert.deepEqual(capture.checks.map(check => [check.width, check.height, check.rendered]), [
        [1920, 1080, true], [1080, 1920, true],
      ], port.id);
      assert.ok(capture.checks.every(check => check.samples.length === 3
        && check.samples.every(sample => sample.bytes > 0 && /^[a-f0-9]{64}$/.test(sample.sha256))), port.id);
      assert.equal(port.verification.visualInspection, false, port.id);
    }
  }

  const ports = new Map(ledger.map(port => [port.id, port]));
  const templates = new Map(templateCatalog.map(template => [template.id, template]));
  assert.equal(ports.size, ledger.length);
  for (const item of catalog) {
    const port = ports.get(item.id);
    assert.ok(port, `missing native ledger entry: ${item.id}`);
    assert.equal(item.nativeStatus, port.status, item.id);
    assert.equal(item.nativeTemplateId, port.nativeTemplateId, item.id);

    if (port.status !== 'ported') {
      assert.equal(port.nativeTemplateId, undefined, item.id);
      continue;
    }

    assert.equal(port.nativePath, `${item.category}/${item.upstreamName}.svelte`, item.id);
    const source = await readFile(new URL(`hyperframes-native/${port.nativePath}`, reference));
    const sourceVersion = `sha256:${createHash('sha256').update(source).digest('hex')}`;
    const opening = source.toString('utf8').split(/\r?\n/).slice(0, 4).join('\n');
    assert.match(opening, /Modified/);
    assert.match(opening, /8ec98be29a64e88239a0c05f7e5d09f36e181493/);
    assert.match(opening, /Apache-2\.0/);
    assert.equal(port.sourceVersion, sourceVersion, item.id);
    assert.equal(item.nativeSourceVersion, sourceVersion, item.id);
    assert.equal(item.nativeVerifiedCompiled, Boolean(port.verification.compiled), item.id);
    const metadata = JSON.parse(await readFile(new URL(`hyperframes-native/${port.nativePath.replace(/\.svelte$/, '.port.json')}`, reference), 'utf8'));
    assert.equal(metadata.id, item.id);
    assert.equal(metadata.nativePath, port.nativePath);
    assert.equal(metadata.status, 'ported');
    assert.ok(metadata.sourcePaths.length > 0 && metadata.sourcePaths.every(path => item.files.some(file => file.path === path)), item.id);
    assert.equal(metadata.verification.compiled, Boolean(port.verification.compiled), item.id);
    const template = templates.get(port.nativeTemplateId);
    assert.ok(template, `missing native scene-template entry: ${item.id}`);
    assert.deepEqual(template.requiredImages, metadata.requiredImages || [], item.id);
    assert.deepEqual(template.requiredVideos || [], metadata.requiredVideos || [], item.id);
    if (port.verification.compiled) {
      assert.deepEqual(port.verification.checks.map(check => [check.width, check.height, check.compiled]), [
        [1920, 1080, true],
        [1080, 1920, true],
      ], item.id);
    }
    const templateSource = await readFile(new URL(`scene-templates/${port.nativeTemplateId}.svelte`, reference));
    assert.deepEqual(templateSource, source, item.id);
  }
});
