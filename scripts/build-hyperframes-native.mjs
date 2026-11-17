import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../packages/mcp-installer/library/', import.meta.url));
const digest = value => createHash('sha256').update(value).digest('hex');
const nativePrefix = 'hyperframes-';
const decoder = new TextDecoder('utf8', { fatal: true });

export function validateNativePort(entry, metadata, source) {
  const nativePath = `${entry.category}/${entry.upstreamName}.svelte`;
  if (metadata.id !== entry.id || metadata.nativePath !== nativePath || metadata.status !== 'ported') throw new Error(`Native identity/status mismatch: ${entry.id}`);
  if (!source.length || source.length > 64000 && metadata.allowOversize !== true) throw new Error(`Native component exceeds source limits: ${entry.id}`);
  const component = decoder.decode(source);
  const executableComponent = stripJavaScriptComments(component);
  // A verbatim GSAP port imports the same paused timeline engine the upstream
  // page uses and may reproduce markup its source script builds with
  // innerHTML. Every other rule still applies to it.
  const verbatimGsapPort = metadata.animationRuntime === 'gsap';
  const forbidden = [
    /\{@html\b/,
    ...(verbatimGsapPort ? [] : [/\binnerHTML\b/, /(?:from|import)\s*['"]gsap/]),
    /<iframe\b/i,
    /<script[^>]*\bsrc\s*=/i,
    /\brequestAnimationFrame\s*\(/,
    /\bMath\.random\s*\(/,
    /\bset(?:Timeout|Interval)\s*\(/,
    /window\.__timelines/,
    /^\s*import\s+(?:[^;\n]*?\s+from\s*)?['"](?:https?:|\.\/|\.\.\/)/m,
  ];
  for (const pattern of forbidden) {
    if (pattern.test(executableComponent)) throw new Error(`Non-native or nondeterministic scene: ${entry.id} (${pattern})`);
  }
  if (!component.includes('useScene') || !component.includes('SceneCanvas') || !component.includes('Apache-2.0')) throw new Error(`Missing native runtime/licence contract: ${entry.id}`);
  if (!['2d', '3d'].includes(metadata.visualMode) || metadata.visualMode === '3d' && !component.includes('SceneThree')) throw new Error(`Invalid native visual mode: ${entry.id}`);
  if (!Array.isArray(metadata.sourcePaths) || metadata.sourcePaths.length === 0 || !metadata.sourcePaths.every(path => entry.files.some(file => file.path === path))) throw new Error(`Missing original source provenance: ${entry.id}`);
  for (const [key, prefix, maximum] of [['requiredImages', 'image', 4], ['requiredVideos', 'video', 2]]) {
    const media = metadata[key] || [];
    if (!Array.isArray(media) || media.length > maximum || new Set(media.map(item => item.id)).size !== media.length) throw new Error(`Invalid attachments: ${entry.id}`);
    if (media.some(item => !new RegExp(`^${prefix}_[1-${maximum}]$`).test(item.id) || !item.role)) throw new Error(`Invalid attachment role/id: ${entry.id}`);
  }
  return { component, nativePath, sha256: digest(source) };
}

function stripJavaScriptComments(source) {
  let result = '';
  let quote = '';
  let escaped = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (quote) {
      result += character;
      if (escaped) escaped = false;
      else if (character === '\\') escaped = true;
      else if (character === quote) quote = '';
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      result += character;
      continue;
    }

    if (character === '/' && next === '/') {
      while (index < source.length && source[index] !== '\n') index += 1;
      result += '\n';
      continue;
    }

    if (character === '/' && next === '*') {
      index += 2;
      while (index < source.length && !(source[index] === '*' && source[index + 1] === '/')) {
        if (source[index] === '\n') result += '\n';
        index += 1;
      }
      index += 1;
      result += ' ';
      continue;
    }

    result += character;
  }

  return result;
}

async function save(path, value) {
  const content = typeof value === 'string' ? value : `${JSON.stringify(value, null, 2)}\n`;
  try { if (await readFile(path, 'utf8') === content) return; } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await writeFile(path, content);
}

function templateEntry(entry, metadata) {
  return {
    id: nativePrefix + entry.id, version: '1', label: `Hyperframes: ${entry.label}`,
    category: `hyperframes-${entry.category}`, description: entry.description,
    visualMode: metadata.visualMode,
    whenToUse: [entry.description],
    avoid: ['Do not invent copy/data, replace essential artwork with placeholders or modify existing captions. Review the original port limitations before selecting.'],
    config: { width: 1920, height: 1080, fps: 30, duration: 5, captionSafeArea: true, ...metadata.config },
    parameters: (metadata.parameters || []).filter(path => /^design\.[a-zA-Z]\w*$/.test(path)).map(path => ({ path, description: 'Editable native source parameter; preserve approved copy/assets and the original effect mechanics.' })),
    requiredImages: metadata.requiredImages || [],
    requiredVideos: metadata.requiredVideos || [],
    choreography: metadata.choreography || {
      reveal: 'Read the native component for its frame-driven entrance and anticipation.',
      action: 'Preserve the component-specific signature action and independently moving objects.',
      hold: 'Retain the native readable hold at the actual approved duration.',
      exit: 'Use the implemented end state and matching handoff, not an extra generic fade.',
    },
    adaptation: [...metadata.adaptations, ...metadata.limitations, 'Modified native Svelte port. Preserve original Hyperframes Apache-2.0 and third-party notices in distributed source.'],
  };
}

export async function buildHyperframesNative({ allowIncomplete = false } = {}) {
  const catalogFile = join(root, 'hyperframes-components.json');
  const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
  const templateFile = join(root, 'scene-templates.json');
  const existingTemplates = JSON.parse(await readFile(templateFile, 'utf8'));
  let previousPortsList = [];
  try {
    previousPortsList = JSON.parse(await readFile(join(root, 'hyperframes-native.json'), 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  const previousPorts = new Map(previousPortsList.map(port => [port.id, port]));
  const templates = existingTemplates.filter(template => !template.id.startsWith(nativePrefix));
  const ports = [];
  const errors = [];
  for (const entry of catalog) {
    const nativePath = `${entry.category}/${entry.upstreamName}.svelte`;
    let metadata, source;
    try {
      metadata = JSON.parse(await readFile(join(root, 'hyperframes-native', nativePath.replace(/\.svelte$/, '.port.json')), 'utf8'));
      if (metadata.status !== 'ported') {
        ports.push({ id: entry.id, nativePath, status: metadata.status, limitations: metadata.limitations || [], verification: { compiled: false, visualInspection: false } });
        continue;
      }
      source = await readFile(join(root, 'hyperframes-native', nativePath));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      ports.push({ id: entry.id, nativePath, status: 'pending', limitations: ['Native implementation not yet completed.'], verification: { compiled: false, visualInspection: false } });
      continue;
    }
    try {
      const validated = validateNativePort(entry, metadata, source);
      if (!Array.isArray(metadata.adaptations) || !Array.isArray(metadata.limitations)) throw new Error(`Missing adaptation/limitations evidence: ${entry.id}`);
      const template = templateEntry(entry, metadata);
      await mkdir(join(root, 'scene-templates'), { recursive: true });
      await save(join(root, 'scene-templates', `${template.id}.svelte`), validated.component);
      const existing = templates.findIndex(item => item.id === template.id);
      if (existing !== -1) templates.splice(existing, 1);
      templates.push(template);
      const previousPort = previousPorts.get(entry.id);
      const sameSource = previousPort?.sourceVersion === `sha256:${validated.sha256}`;
      const verification = sameSource ? previousPort.verification || {} : {};
      const evidence = metadata.verification || {};
      ports.push({
        ...metadata, nativeTemplateId: template.id, sourceVersion: `sha256:${validated.sha256}`,
        verification: {
          ...evidence,
          ...verification,
          compiled: Boolean(verification.compiled ?? evidence.compiled),
          // Automated equivalence with the upstream page is recorded as
          // evidence, not as a human visual inspection.
          visualInspection: Boolean(verification.visualInspection),
          motionVerified: Boolean(verification.motionVerified ?? evidence.motionVerified),
          originalComparison: evidence.originalComparison,
          runtimeCapture: evidence.runtimeCapture,
          checks: verification.checks || evidence.checks,
        },
      });
    } catch (error) {
      errors.push(error.message);
      ports.push({ id: entry.id, nativePath, status: 'blocked', limitations: [error.message], verification: { compiled: false, visualInspection: false } });
    }
  }
  const pending = ports.filter(port => port.status === 'pending');
  if (pending.length && !allowIncomplete) throw new Error(`Native conversion incomplete: ${catalog.length - pending.length}/${catalog.length}. ${errors.join('\n')}`);
  const byID = new Map(ports.map(port => [port.id, port]));
  for (const entry of catalog) {
    const port = byID.get(entry.id);
    entry.nativeStatus = port.status;
    entry.nativeTemplateId = port.nativeTemplateId;
    entry.nativeLimitations = port.limitations;
    entry.nativeVerifiedCompiled = Boolean(port.verification.compiled);
    entry.nativeSourceVersion = port.sourceVersion;
  }
  await save(catalogFile, catalog);
  await save(templateFile, templates);
  await save(join(root, 'hyperframes-native.json'), ports);
  return {
    total: ports.length,
    ported: ports.filter(port => port.status === 'ported').length,
    pending: ports.filter(port => port.status === 'pending').length,
    blocked: ports.filter(port => port.status === 'blocked').length,
    errors,
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await buildHyperframesNative({ allowIncomplete: process.argv.includes('--allow-incomplete') }));
