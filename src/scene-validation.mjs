const FORBIDDEN_RUNTIME_PROPS = new Set([
  'frame',
  'fps',
  'durationInFrames',
  'totalFrames',
  'time',
  'currentTime',
  'elapsed',
  'progress',
  'width',
  'height',
]);

const FORBIDDEN_MEDIA_ITEM_PROPS = new Set([
  'image_1', 'image_2', 'image_3', 'image_4',
  'video_1', 'video_2', 'video_3', 'video_4',
  'model_1', 'model_2',
]);

const RUNTIME_CONTRACT_FIX = [
  'Use Svelte context from `@direction/scene-svelte` instead:',
  "  import { SceneCanvas, useScene } from '@direction/scene-svelte';",
  '  let { images = {}, videos = {}, models = {}, parameters = {} } = $props();',
  '  const scene = useScene();',
  '  const t = $derived(scene.frame.time); // also scene.frame.frame, scene.frame.progress, scene.frame.config',
  'Wrap the scene in `<SceneCanvas background="...">...</SceneCanvas>` (or use `SceneThree` with `setup({ THREE, world, camera }) { return { update(frame) { ... } }; }`).',
  'Valid component `$props()` are ONLY `images`, `videos`, `models`, and `parameters` — read attachments as `images.image_1`, `videos.video_1`, `models.model_1` (NEVER top-level `image_1` / `video_1` / `model_1`).',
].join('\n');

export const SCENE_RUNTIME_CONTRACT_SUMMARY =
  'CRITICAL Svelte 5 runtime contract: NEVER declare frame, fps, durationInFrames, time, progress, width, height, image_1..image_4, video_1..video_2 or model_1..model_2 in $props() or export let — Machinal does NOT pass them as top-level props (frame stays frozen at 0 and image_1 stays empty!). Always import { SceneCanvas, useScene } from "@direction/scene-svelte", call const scene = useScene(), and derive motion reactively with $derived(scene.frame.time) (or SceneThree setup returning { update(frame) }). Valid $props() are ONLY images, videos, models, parameters — read attachments as images.image_1, videos.video_1, models.model_1. Verify compiled scenes with inspect_scene across frame 0, midpoint and hold before render_video.';

function stripComments(source) {
  let out = '';
  let i = 0;
  let quote = null;
  let templateDepth = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < source.length) {
        out += next;
        i += 2;
        continue;
      }
      if (quote === '`' && ch === '$' && next === '{') {
        out += next;
        templateDepth++;
        quote = null;
        i += 2;
        continue;
      }
      if (ch === quote) quote = null;
      i++;
      continue;
    }
    if (templateDepth > 0 && ch === '}') {
      out += ch;
      templateDepth--;
      quote = '`';
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      out += '  ';
      i += 2;
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        out += source[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < source.length) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function maskStringsAndComments(source) {
  let out = '';
  let i = 0;
  let quote = null;
  let templateDepth = 0;
  while (i < source.length) {
    const ch = source[i];
    const next = source[i + 1];
    if (quote) {
      if (ch === '\\' && i + 1 < source.length) {
        out += '  ';
        i += 2;
        continue;
      }
      if (quote === '`' && ch === '$' && next === '{') {
        out += '${';
        templateDepth++;
        quote = null;
        i += 2;
        continue;
      }
      if (ch === quote) {
        out += ch;
        quote = null;
        i++;
        continue;
      }
      out += ch === '\n' ? '\n' : ' ';
      i++;
      continue;
    }
    if (templateDepth > 0 && ch === '}') {
      out += ch;
      templateDepth--;
      quote = '`';
      i++;
      continue;
    }
    if (ch === '/' && next === '/') {
      out += '  ';
      i += 2;
      while (i < source.length && source[i] !== '\n') {
        out += ' ';
        i++;
      }
      continue;
    }
    if (ch === '/' && next === '*') {
      out += '  ';
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) {
        out += source[i] === '\n' ? '\n' : ' ';
        i++;
      }
      if (i < source.length) {
        out += '  ';
        i += 2;
      }
      continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') {
      quote = ch;
      out += ch;
      i++;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

function extractTopLevelKeys(objectInterior) {
  const keys = [];
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let angleDepth = 0;
  let current = '';
  for (let i = 0; i <= objectInterior.length; i++) {
    const ch = i < objectInterior.length ? objectInterior[i] : ',';
    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (ch === '<') angleDepth++;
    else if (ch === '>') angleDepth = Math.max(0, angleDepth - 1);

    if (ch === ',' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0 && angleDepth === 0) {
      const entry = current.trim();
      if (entry && !entry.startsWith('...')) {
        const key = entry.split(/[:=\s]/)[0]?.trim();
        if (key && /^[A-Za-z_$][\w$]*$/.test(key)) keys.push(key);
      }
      current = '';
    } else {
      current += ch;
    }
  }
  return keys;
}

function findMatchingOpenBrace(text, closeIndex) {
  let depth = 0;
  for (let i = closeIndex; i >= 0; i--) {
    if (text[i] === '}') depth++;
    else if (text[i] === '{') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function skipTypeAnnotationBackward(text, index) {
  // Handle optional TS type annotation on LHS before `=`: e.g. `let { frame }: Props = $props()`
  let end = index;
  while (end >= 0 && /\s/.test(text[end])) end--;
  if (end < 0) return end;
  // Walk back if we see `:` at top level right after `}`
  let scan = end;
  let depth = 0;
  while (scan >= 0) {
    const ch = text[scan];
    if (ch === '>' || ch === '}' || ch === ')' || ch === ']') depth++;
    else if (ch === '<' || ch === '{' || ch === '(' || ch === '[') {
      if (depth === 0) break;
      depth--;
    } else if (depth === 0 && (ch === ';' || ch === '\n')) {
      break;
    } else if (depth === 0 && ch === ':') {
      let beforeColon = scan - 1;
      while (beforeColon >= 0 && /\s/.test(text[beforeColon])) beforeColon--;
      if (text[beforeColon] === '}' || /[A-Za-z0-9_$]/.test(text[beforeColon] ?? '')) {
        return beforeColon;
      }
      break;
    }
    scan--;
  }
  return end;
}

function collectDeclaredProps(maskedScript, noCommentsScript) {
  const destructured = new Set();
  const exportLets = new Set();
  const objectAccesses = new Set();

  for (const match of maskedScript.matchAll(/\bexport\s+let\s+([A-Za-z_$][\w$]*)/g)) {
    exportLets.add(match[1]);
  }

  for (const match of maskedScript.matchAll(/\$props\b/g)) {
    const propsIdx = match.index;
    let eqIdx = propsIdx - 1;
    while (eqIdx >= 0 && /\s/.test(maskedScript[eqIdx])) eqIdx--;
    if (maskedScript[eqIdx] !== '=') continue;
    let lhsEnd = eqIdx - 1;
    while (lhsEnd >= 0 && /\s/.test(maskedScript[lhsEnd])) lhsEnd--;
    if (lhsEnd < 0) continue;

    if (maskedScript[lhsEnd] !== '}') {
      const beforeType = skipTypeAnnotationBackward(maskedScript, lhsEnd);
      if (beforeType >= 0 && maskedScript[beforeType] === '}') {
        lhsEnd = beforeType;
      }
    }

    if (maskedScript[lhsEnd] === '}') {
      const openIdx = findMatchingOpenBrace(maskedScript, lhsEnd);
      if (openIdx >= 0) {
        const interior = maskedScript.slice(openIdx + 1, lhsEnd);
        for (const key of extractTopLevelKeys(interior)) {
          destructured.add(key);
        }
      }
    } else {
      const lhsSlice = maskedScript.slice(Math.max(0, lhsEnd - 120), lhsEnd + 1);
      const identMatch = lhsSlice.match(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)(?:\s*:[^=]+)?\s*$/);
      if (identMatch) {
        const propsVar = identMatch[1];
        const dotPattern = new RegExp(`\\b${propsVar}\\s*(?:\\?\\.)?\\.\\s*([A-Za-z_$][\\w$]*)`, 'g');
        for (const access of maskedScript.matchAll(dotPattern)) {
          objectAccesses.add(access[1]);
        }
        const bracketPattern = new RegExp(`\\b${propsVar}\\s*\\[\\s*['"]([A-Za-z_$][\\w$]*)['"]\\s*\\]`, 'g');
        for (const access of noCommentsScript.matchAll(bracketPattern)) {
          objectAccesses.add(access[1]);
        }
      }
    }
  }

  return { destructured, exportLets, objectAccesses, all: new Set([...destructured, ...exportLets, ...objectAccesses]) };
}

function splitTopLevelStatements(maskedScript) {
  const statements = [];
  let braceDepth = 0;
  let parenDepth = 0;
  let bracketDepth = 0;
  let start = 0;
  for (let i = 0; i < maskedScript.length; i++) {
    const ch = maskedScript[i];
    if (ch === '{') braceDepth++;
    else if (ch === '}') braceDepth = Math.max(0, braceDepth - 1);
    else if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth = Math.max(0, parenDepth - 1);
    else if (ch === '[') bracketDepth++;
    else if (ch === ']') bracketDepth = Math.max(0, bracketDepth - 1);
    else if (ch === ';' && braceDepth === 0 && parenDepth === 0 && bracketDepth === 0) {
      const stmt = maskedScript.slice(start, i).trim();
      if (stmt) statements.push(stmt);
      start = i + 1;
    }
  }
  const tail = maskedScript.slice(start).trim();
  if (tail) statements.push(tail);
  return statements;
}

function findTopLevelNonReactiveFrameSnapshots(maskedScript, sceneVars) {
  const issues = [];

  // 1. Destructuring `{ frame } = useScene()` at top level freezes `frame` at frame 0.
  for (const match of maskedScript.matchAll(/\buseScene\s*\(\s*\)/g)) {
    let eqIdx = match.index - 1;
    while (eqIdx >= 0 && /\s/.test(maskedScript[eqIdx])) eqIdx--;
    if (maskedScript[eqIdx] !== '=') continue;
    let lhsEnd = eqIdx - 1;
    while (lhsEnd >= 0 && /\s/.test(maskedScript[lhsEnd])) lhsEnd--;
    if (maskedScript[lhsEnd] === '}') {
      const openIdx = findMatchingOpenBrace(maskedScript, lhsEnd);
      if (openIdx >= 0) {
        const keys = extractTopLevelKeys(maskedScript.slice(openIdx + 1, lhsEnd));
        if (keys.includes('frame')) {
          issues.push('Do not destructure `const { frame } = useScene()` at component top level — that captures frame 0 once non-reactively. Use `const scene = useScene(); const t = $derived(scene.frame.time);`.');
        }
      }
    }
  }

  // 2. Top-level variable declarations that read `<sceneVar>.frame` (outside `.config`) without `$derived` or a function/arrow.
  if (sceneVars.length) {
    const statements = splitTopLevelStatements(maskedScript);
    for (const stmt of statements) {
      const decl = stmt.match(/^(?:const|let|var)\s+([\s\S]+?)\s*=\s*([\s\S]+)$/);
      if (!decl) continue;
      const rhs = decl[2].trim();
      if (/^\$derived(?:\.by)?\s*\(/.test(rhs) || /\bfunction\b|=>/.test(rhs)) continue;
      for (const sceneVar of sceneVars) {
        // Ignore static `<sceneVar>.frame.config` reads; flag `.frame.time`, `.frame.frame`, `.frame.progress`, or destructuring/aliasing `.frame`.
        const withoutConfig = rhs.replace(new RegExp(`\\b${sceneVar}\\.frame\\.config\\b`, 'g'), '');
        const frameRead = new RegExp(`\\b${sceneVar}\\.frame\\b`);
        if (frameRead.test(withoutConfig)) {
          issues.push(`Non-reactive top-level read of \`${sceneVar}.frame\` stays stuck at frame 0 in Svelte 5. Wrap it in \`$derived(${sceneVar}.frame.time)\` (or read inside \`$derived.by\` / \`$effect\`).`);
          break;
        }
      }
    }
  }

  return issues;
}

export function validateSceneComponent(source, { images, videos, models } = {}) {
  if (typeof source !== 'string' || !source.trim()) return { valid: true };

  const scriptBlocks = [];
  for (const match of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = match[1] ?? '';
    if (/\b(?:module|context\s*=\s*['"]module['"])\b/i.test(attrs)) continue;
    scriptBlocks.push(match[2] ?? '');
  }
  if (!scriptBlocks.length) return { valid: true };

  const rawScript = scriptBlocks.join('\n');
  const noCommentsScript = stripComments(rawScript);
  const maskedScript = maskStringsAndComments(rawScript);
  const template = source
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '');

  const declaredProps = collectDeclaredProps(maskedScript, noCommentsScript);

  // 1a. Reject Remotion-style / non-existent runtime timing/canvas props in `$props()` or `export let`.
  const forbiddenProps = [...declaredProps.all].filter(key => FORBIDDEN_RUNTIME_PROPS.has(key));
  if (forbiddenProps.length) {
    throw new Error(
      `Invalid Machinal scene runtime contract: Machinal does NOT pass \`${forbiddenProps.join('`, `')}\` via \`$props()\` or \`export let\`. Those props stay stuck at 0, freezing every animation and leaving only static elements visible.\n${RUNTIME_CONTRACT_FIX}`,
    );
  }

  // 1b. Reject top-level `image_1`, `video_1`, `model_1` props — attachments are passed inside `images`, `videos`, `models` objects.
  const forbiddenMediaProps = [...declaredProps.all].filter(key => FORBIDDEN_MEDIA_ITEM_PROPS.has(key));
  if (forbiddenMediaProps.length) {
    const examples = forbiddenMediaProps.map(id => {
      const group = id.startsWith('image_') ? 'images' : id.startsWith('video_') ? 'videos' : 'models';
      return `${group}.${id}`;
    });
    throw new Error(
      `Invalid Machinal scene runtime contract: Machinal does NOT pass \`${forbiddenMediaProps.join('`, `')}\` as top-level props — they stay empty and render blank boxes! Destructure \`let { images = {}, videos = {}, models = {} } = $props();\` and reference \`${examples.join('`, `')}\` instead.\n${RUNTIME_CONTRACT_FIX}`,
    );
  }

  // 1c. Verify attached media arrays are actually read via the matching `$props()` group (`images`, `videos`, `models`).
  for (const [group, attachments] of [['images', images], ['videos', videos], ['models', models]]) {
    if (Array.isArray(attachments) && attachments.length > 0 && !declaredProps.all.has(group)) {
      const ids = attachments.map(item => item?.id).filter(Boolean).join(', ');
      throw new Error(
        `Invalid Machinal scene runtime contract: compile_scene attached \`${group}\` (${ids || attachments.length}), but the Svelte component does not read \`${group}\` from \`$props()\`. Add \`let { ${group} = {} } = $props();\` and use \`${group}.${attachments[0]?.id ?? `${group.slice(0, -1)}_1`}\` so the attached media actually renders.\n${RUNTIME_CONTRACT_FIX}`,
      );
    }
  }

  // 2. Reject non-deterministic browser timers / wall-clock animation loops.
  const timerMatch = maskedScript.match(/\b(requestAnimationFrame|setInterval|setTimeout)\s*\(/);
  if (timerMatch) {
    throw new Error(
      `Invalid Machinal scene runtime contract: \`${timerMatch[1]}()\` is non-deterministic and breaks headless frame-by-frame capture.\n${RUNTIME_CONTRACT_FIX}`,
    );
  }

  // 3. Detect Machinal runtime clock bindings (`useScene` or `SceneThree`).
  const importsRuntimePkg = /from\s+['"](?:@direction\/scene-svelte|@machinal\/scenes(?:\/svelte)?)['"]/.test(noCommentsScript);
  const hasUseSceneImport = importsRuntimePkg && /\buseScene\b/.test(noCommentsScript) && /\buseScene\s*\(/.test(maskedScript);
  const hasSceneThree = importsRuntimePkg && /\bSceneThree\b/.test(noCommentsScript) && /<SceneThree\b/.test(template);

  if (hasUseSceneImport) {
    const sceneVars = [];
    for (const match of maskedScript.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*useScene\s*\(\s*\)/g)) {
      sceneVars.push(match[1]);
    }
    const snapshotIssues = findTopLevelNonReactiveFrameSnapshots(maskedScript, sceneVars);
    if (snapshotIssues.length) {
      throw new Error(`Invalid Machinal scene runtime contract: ${snapshotIssues.join(' ')}\n${RUNTIME_CONTRACT_FIX}`);
    }
  }

  // 4. Reject animated/reactive scenes that never bind to `useScene()` or `SceneThree`.
  if (!hasUseSceneImport && !hasSceneThree) {
    const usesReactiveRunes = /\$(?:derived|effect|state)\b/.test(maskedScript);
    const importsSceneHelpers = /from\s+['"](?:@direction\/scene-runtime|@machinal\/scenes\/runtime)['"]/.test(noCommentsScript);
    const hasAnimatedTemplateStyle = /\bstyle\s*=\s*(?:\{|["'][^"']*(?:opacity|transform|clip-path|stroke-dashoffset)\s*:[^"']*\{)/i.test(template);
    if (usesReactiveRunes || importsSceneHelpers || hasAnimatedTemplateStyle) {
      throw new Error(
        `Invalid Machinal scene runtime contract: reactive/animated scene does not read frame time from \`useScene()\` or \`SceneThree\`, so animated elements will stay frozen on frame 0.\n${RUNTIME_CONTRACT_FIX}`,
      );
    }
  }

  return { valid: true };
}

export function detectStaticInspectResult(result) {
  if (!result || typeof result !== 'object' || result.isError || !Array.isArray(result.content)) return result;
  const images = result.content.filter(part => part?.type === 'image' && typeof part.data === 'string' && part.data.length > 0);
  if (images.length < 2) return result;
  const firstData = images[0].data;
  if (!images.every(img => img.data === firstData)) return result;

  let payload = result.structuredContent && typeof result.structuredContent === 'object'
    ? structuredClone(result.structuredContent)
    : null;
  let jsonPartIndex = -1;
  for (let i = 0; i < result.content.length; i++) {
    const part = result.content[i];
    if (part?.type !== 'text' || typeof part.text !== 'string') continue;
    const trimmed = part.text.trim();
    if (!trimmed.startsWith('{')) continue;
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && ('statusCode' in parsed || 'data' in parsed)) {
        jsonPartIndex = i;
        if (!payload) payload = parsed;
        break;
      }
    } catch { /* ignore non-JSON text parts */ }
  }
  if (!payload?.data) return result;

  const frames = payload.data?.evidence?.frames;
  if (!Array.isArray(frames) || new Set(frames.map(item => item?.frame)).size < 2) return result;

  const frameList = frames.map(item => item.frame).join(', ');
  const warning = `All sampled frames (${frameList}) rendered identical pixels. If this scene is meant to animate, verify it uses \`const scene = useScene()\` with \`$derived(scene.frame.time)\` (or \`SceneThree\` \`update(frame)\`) rather than \`$props()\` \`frame\`/\`fps\` or a non-reactive top-level snapshot. Fix and recompile before rendering.`;
  payload.data = {
    ...payload.data,
    staticSceneWarning: warning,
    evidence: {
      ...payload.data.evidence,
      allSampledFramesIdentical: true,
    },
  };

  const content = [...result.content];
  if (jsonPartIndex >= 0) {
    content[jsonPartIndex] = { type: 'text', text: JSON.stringify(payload) };
  } else {
    content.push({ type: 'text', text: JSON.stringify(payload) });
  }
  return {
    ...result,
    content,
    ...(result.structuredContent === undefined ? {} : { structuredContent: payload }),
  };
}
