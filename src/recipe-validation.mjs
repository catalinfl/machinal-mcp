const INVALID_IMAGE_ASPECT_ALIASES = new Set(['portrait', 'landscape', 'square', 'classic', 'vertical', 'horizontal']);
const VALID_IMAGE_ASPECT_HINT = "'9:16', '16:9', '4:3', '3:4', or '1:1'";

export const RECIPE_CONTRACT_SUMMARY =
  'CRITICAL YAML recipe contract: Always wrap the edit DSL inside top-level `document:` with siblings `bindings: {}` and `assets: []` (`document.version: 2`, `document.mode: assemble`, `document.output: { aspect: portrait|landscape|classic, resolution: 1080p, fps: 30, format: mp4 }`). Put `captions.generate` in `document.after` (NEVER `document.captions` or `document.jobs`). For `image.generate` jobs use ratio strings like `aspect: "9:16"`, `"4:3"`, or `"1:1"` (NEVER `portrait`/`landscape`) and `background: transparent` (not `transparent: true`) with `openai/gpt-image-2.5-sunburst`. Always include `placements` (or an existing track) when running `generate_assets` with `speech.generate` or `image.generate` so composition duration > 0. Never overlap clips on the same `audio` track (use separate audio tracks for narration, ambience and spot SFX); audio `volume` is 0–200 PERCENT, not 0.0–1.0. NEVER guess audio `outPoint` or truncate narration — always match the exact full measured asset duration from `get_job_result` / `get_asset_metadata` and extend video clips to cover the full speech.';

export const PATCH_RECIPE_SUMMARY =
  'Preferred way to add compiled scenes, SFX, transitions, effects and caption fixes on top of a completed timing-first pass (`sourceJobId` or `baseRecipeRef`) without resending full YAML. Put simultaneous audio layers (narration, ambience, spot SFX) on SEPARATE audio tracks (same-track audio overlaps fail with collision); audio `volume` is 0–200 percent.';

function stripYamlComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (quote === '"' && ch === '\\') {
        i++;
        continue;
      }
      if (quote === '\'' && ch === '\'' && line[i + 1] === '\'') {
        i++;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '\'' || ch === '"') {
      quote = ch;
    } else if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) {
      return line.slice(0, i);
    }
  }
  return line;
}

function unquoteScalar(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed) return '';
  if (trimmed.length >= 2 && ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith('\'') && trimmed.endsWith('\'')))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseDurationSeconds(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;
  const trimmed = unquoteScalar(value).trim();
  if (!trimmed) return null;
  const match = /^(-?\d+(?:\.\d+)?)(ms|s)?$/i.exec(trimmed);
  if (!match) return null;
  const num = Number(match[1]);
  if (!Number.isFinite(num)) return null;
  const unit = match[2]?.toLowerCase();
  return unit === 'ms' ? num / 1000 : num;
}

function parseFlowObject(raw) {
  const trimmed = String(raw ?? '').trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;
  const inner = trimmed.slice(1, -1);
  const entries = {};
  let depth = 0;
  let quote = null;
  let current = '';
  const parts = [];
  for (let i = 0; i <= inner.length; i++) {
    const ch = i < inner.length ? inner[i] : ',';
    if (quote) {
      current += ch;
      if (quote === '"' && ch === '\\' && i + 1 < inner.length) {
        current += inner[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '\'' || ch === '"') {
      quote = ch;
      current += ch;
    } else if (ch === '{' || ch === '[') {
      depth++;
      current += ch;
    } else if (ch === '}' || ch === ']') {
      depth = Math.max(0, depth - 1);
      current += ch;
    } else if (ch === ',' && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon <= 0) continue;
    const key = unquoteScalar(part.slice(0, colon));
    const val = part.slice(colon + 1).trim();
    if (key) entries[key] = val;
  }
  return entries;
}

function splitTopLevelSections(source) {
  const lines = source.replaceAll('\r\n', '\n').split('\n');
  const sections = [];
  let blockScalarIndent = null;
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNo = i + 1;
    const indent = rawLine.match(/^ */)?.[0].length ?? 0;

    if (blockScalarIndent !== null) {
      if (!rawLine.trim() || indent > blockScalarIndent) {
        if (current) current.lines.push({ lineNo, raw: rawLine, indent });
        continue;
      }
      blockScalarIndent = null;
    }

    const stripped = stripYamlComment(rawLine);
    if (!stripped.trim()) {
      if (current) current.lines.push({ lineNo, raw: rawLine, indent });
      continue;
    }

    if (indent === 0) {
      const keyMatch = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(stripped);
      if (keyMatch) {
        const [, key, rest] = keyMatch;
        current = { key, rest: rest.trim(), lineNo, lines: [] };
        sections.push(current);
        if (/^[|>][-+]?\d*$/.test(rest.trim())) blockScalarIndent = 0;
        continue;
      }
    }

    if (current) {
      current.lines.push({ lineNo, raw: rawLine, indent });
      const nestedMatch = /^ *([A-Za-z_][\w-]*|-\s*[A-Za-z_][\w-]*)\s*:\s*([|>][-+]?\d*)$/.exec(stripped);
      if (nestedMatch) blockScalarIndent = indent;
    }
  }

  return sections;
}

function splitDirectChildSections(sectionLines) {
  let childIndent = null;
  let blockScalarIndent = null;
  const children = [];
  let current = null;

  for (const entry of sectionLines) {
    const { raw, indent, lineNo } = entry;
    if (blockScalarIndent !== null) {
      if (!raw.trim() || indent > blockScalarIndent) {
        if (current) current.lines.push(entry);
        continue;
      }
      blockScalarIndent = null;
    }

    const stripped = stripYamlComment(raw);
    if (!stripped.trim()) {
      if (current) current.lines.push(entry);
      continue;
    }

    if (childIndent === null) childIndent = indent;
    if (indent === childIndent) {
      const keyMatch = /^ *([A-Za-z_][\w-]*)\s*:(.*)$/.exec(stripped);
      if (keyMatch) {
        const [, key, rest] = keyMatch;
        current = { key, rest: rest.trim(), lineNo, indent, lines: [] };
        children.push(current);
        if (/^[|>][-+]?\d*$/.test(rest.trim())) blockScalarIndent = indent;
        continue;
      }
    }

    if (current) {
      current.lines.push(entry);
      const scalarMatch = /^ *(?:-\s+)?[A-Za-z_][\w-]*\s*:\s*([|>][-+]?\d*)$/.exec(stripped);
      if (scalarMatch) blockScalarIndent = indent;
    }
  }

  return children;
}

function parseListItems(sectionLines) {
  let itemIndent = null;
  let blockScalarIndent = null;
  const items = [];
  let current = null;

  for (const entry of sectionLines) {
    const { raw, indent, lineNo } = entry;
    if (blockScalarIndent !== null) {
      if (!raw.trim() || indent > blockScalarIndent) {
        if (current) current.lines.push(entry);
        continue;
      }
      blockScalarIndent = null;
    }

    const stripped = stripYamlComment(raw);
    if (!stripped.trim()) {
      if (current) current.lines.push(entry);
      continue;
    }

    if (itemIndent === null) {
      if (!/^ *-(?:\s|$)/.test(stripped)) break;
      itemIndent = indent;
    }

    if (indent === itemIndent && /^ *-(?:\s|$)/.test(stripped)) {
      const afterDash = stripped.slice(indent + 1).trim();
      current = { lineNo, indent, fields: {}, rawInline: afterDash, lines: [] };
      items.push(current);

      if (afterDash.startsWith('{') && afterDash.endsWith('}')) {
        Object.assign(current.fields, parseFlowObject(afterDash) ?? {});
      } else if (afterDash) {
        const kv = /^([A-Za-z_][\w-]*)\s*:(.*)$/.exec(afterDash);
        if (kv) {
          current.fields[kv[1]] = kv[2].trim();
          if (/^[|>][-+]?\d*$/.test(kv[2].trim())) blockScalarIndent = indent;
        }
      }
      continue;
    }

    if (current && indent > itemIndent) {
      current.lines.push(entry);
      // Direct child key inside this list item (indent == itemIndent + 2 or first sub-indent)
      if (current.subIndent === undefined) current.subIndent = indent;
      if (indent === current.subIndent) {
        const kv = /^ *([A-Za-z_][\w-]*)\s*:(.*)$/.exec(stripped);
        if (kv) {
          current.fields[kv[1]] = kv[2].trim();
          if (/^[|>][-+]?\d*$/.test(kv[2].trim())) blockScalarIndent = indent;
        }
      } else {
        const nestedScalar = /^ *(?:-\s+)?[A-Za-z_][\w-]*\s*:\s*([|>][-+]?\d*)$/.exec(stripped);
        if (nestedScalar) blockScalarIndent = indent;
      }
    }
  }

  return items;
}

function validateAudioTracksList(tracks, errors) {
  if (!Array.isArray(tracks)) return;
  for (const track of tracks) {
    if (!track || typeof track !== 'object') continue;
    if (String(track.type ?? '').toLowerCase() !== 'audio') continue;
    const trackId = track.id || track.name || '(unnamed audio track)';
    const clips = Array.isArray(track.clips) ? track.clips : [];
    const intervals = [];

    for (const clip of clips) {
      if (!clip || typeof clip !== 'object') continue;
      const clipId = clip.id || clip.assetId || '(unnamed clip)';

      // Fractional volume check (0 < volume < 1 -> user confused 0.0-1.0 gain with 0-200%)
      if (clip.volume !== undefined && clip.volume !== null && clip.volume !== '') {
        const vol = typeof clip.volume === 'number' ? clip.volume : Number(unquoteScalar(clip.volume));
        if (Number.isFinite(vol) && vol > 0 && vol < 1) {
          errors.push(
            `Audio clip "${clipId}" on track "${trackId}" has fractional volume ${vol}. Machinal audio volume is 0–200 PERCENT (e.g. 100 for narration, 15–35 for subtle ambience/SFX), NOT 0.0–1.0 gain.`,
          );
        }
      }

      const start = parseDurationSeconds(clip.start);
      const inPoint = clip.inPoint !== undefined ? parseDurationSeconds(clip.inPoint) : 0;
      const outPoint = clip.outPoint !== undefined ? parseDurationSeconds(clip.outPoint) : null;
      const rateRaw = clip.playbackRate !== undefined ? Number(unquoteScalar(clip.playbackRate)) : 1;
      const playbackRate = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : 1;

      if (start !== null && inPoint !== null && outPoint !== null && outPoint > inPoint) {
        const end = start + (outPoint - inPoint) / playbackRate;
        intervals.push({ clipId, start, end });
      }
    }

    intervals.sort((a, b) => a.start - b.start || a.end - b.end);
    for (let i = 1; i < intervals.length; i++) {
      const prev = intervals[i - 1];
      const curr = intervals[i];
      if (prev.end > curr.start + 1e-4) {
        errors.push(
          `Audio track "${trackId}" has overlapping clips ("${prev.clipId}" [${prev.start.toFixed(2)}s–${prev.end.toFixed(2)}s] overlaps "${curr.clipId}" [${curr.start.toFixed(2)}s–${curr.end.toFixed(2)}s]). Machinal audio tracks do not allow overlaps — move simultaneous audio layers (narration, ambience/music, spot SFX) onto separate audio tracks.`,
        );
      }
    }
  }
}

function parseBoolScalar(value) {
  if (typeof value === 'boolean') return value;
  const raw = unquoteScalar(value).toLowerCase();
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return false;
}

function isNarrationClipInfo(track, clip, asset, speechJobAssetIds = new Set()) {
  const file = String(asset?.file ?? '').toLowerCase();
  if (file.startsWith('voice_') || file.startsWith('narration_')) return true;
  if (track?.id === 'recipe/audio/narration') return true;
  if (speechJobAssetIds.has(clip.assetId) || (asset?.file && speechJobAssetIds.has(asset.file))) return true;
  const meta = `${track?.name ?? ''} ${track?.id ?? ''} ${clip?.id ?? ''} ${clip?.assetId ?? ''}`.toLowerCase();
  if (/(?:sfx|sound_effect|sound-effect|music|ambience|ambient|bgm|foley)/.test(meta)) return false;
  if (/(?:narration|narrator|voiceover|voice-over|voice_over|voice|speech)/.test(meta)) return true;
  return /\bvo\b/.test(meta);
}

function extractYamlAssets(assetsSection) {
  if (!assetsSection) return [];
  if (assetsSection.rest === '[]') return [];
  return parseListItems(assetsSection.lines).map((item) => ({
    id: unquoteScalar(item.fields.id),
    file: unquoteScalar(item.fields.file),
    kind: unquoteScalar(item.fields.kind),
    duration: item.fields.duration !== undefined ? parseDurationSeconds(item.fields.duration) : null,
  }));
}

function extractYamlTracks(tracksSection) {
  const rawTracks = parseListItems(tracksSection.lines);
  return rawTracks.map((item) => {
    const type = unquoteScalar(item.fields.type);
    const id = unquoteScalar(item.fields.id);
    const name = unquoteScalar(item.fields.name);
    const muted = parseBoolScalar(item.fields.muted);
    const hidden = parseBoolScalar(item.fields.hidden);
    const children = splitDirectChildSections(item.lines);
    const clipsSection = children.find((child) => child.key === 'clips');
    let clips = [];
    if (clipsSection) {
      if (clipsSection.rest.startsWith('[') && clipsSection.rest.endsWith(']')) {
        // Inline clip array not expanded here unless trivial
        clips = [];
      } else {
        clips = parseListItems(clipsSection.lines).map((clipItem) => ({
          id: unquoteScalar(clipItem.fields.id),
          assetId: unquoteScalar(clipItem.fields.assetId),
          start: clipItem.fields.start,
          inPoint: clipItem.fields.inPoint,
          outPoint: clipItem.fields.outPoint,
          playbackRate: clipItem.fields.playbackRate,
          volume: clipItem.fields.volume,
          opacity: clipItem.fields.opacity,
          linkedClipId: unquoteScalar(clipItem.fields.linkedClipId),
        }));
      }
    }
    return { id, name, type, muted, hidden, clips };
  });
}

export function inspectRecipeTimeline(composition) {
  const empty = { assets: [], tracks: [], speechJobAssetIds: new Set() };
  if (typeof composition !== 'string' || !composition.trim()) return empty;
  const trimmed = composition.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      const doc = parsed?.document ?? parsed?.recipe;
      const assets = (Array.isArray(parsed?.assets) ? parsed.assets : []).map((asset) => ({
        id: String(asset?.id ?? ''),
        file: String(asset?.file ?? ''),
        kind: String(asset?.kind ?? ''),
        duration: asset?.duration !== undefined ? parseDurationSeconds(asset.duration) : null,
      }));
      const speechJobAssetIds = new Set();
      for (const job of [...(Array.isArray(doc?.before) ? doc.before : []), ...(Array.isArray(doc?.jobs) ? doc.jobs : [])]) {
        if (job?.type === 'speech.generate' && job?.resultAssetId) speechJobAssetIds.add(String(job.resultAssetId));
      }
      const tracks = (Array.isArray(doc?.tracks) ? doc.tracks : []).map((track) => ({
        id: String(track?.id ?? ''),
        name: String(track?.name ?? ''),
        type: String(track?.type ?? ''),
        muted: Boolean(track?.muted),
        hidden: Boolean(track?.hidden),
        clips: (Array.isArray(track?.clips) ? track.clips : []).map((clip) => ({
          id: String(clip?.id ?? ''),
          assetId: String(clip?.assetId ?? ''),
          start: clip?.start,
          inPoint: clip?.inPoint,
          outPoint: clip?.outPoint,
          playbackRate: clip?.playbackRate,
          volume: clip?.volume,
          opacity: clip?.opacity,
          linkedClipId: String(clip?.linkedClipId ?? ''),
        })),
      }));
      return { assets, tracks, speechJobAssetIds };
    } catch {
      return empty;
    }
  }

  const topSections = splitTopLevelSections(composition);
  const assets = extractYamlAssets(topSections.find((s) => s.key === 'assets'));
  const docSection = topSections.find((s) => s.key === 'document' || s.key === 'recipe');
  if (!docSection) return { assets, tracks: [], speechJobAssetIds: new Set() };
  const docChildren = splitDirectChildSections(docSection.lines);
  const childMap = new Map(docChildren.map((c) => [c.key, c]));
  const speechJobAssetIds = new Set();
  for (const section of [childMap.get('before'), childMap.get('jobs')].filter(Boolean)) {
    for (const item of parseListItems(section.lines)) {
      if (unquoteScalar(item.fields.type) === 'speech.generate') {
        const resId = unquoteScalar(item.fields.resultAssetId);
        if (resId) speechJobAssetIds.add(resId);
      }
    }
  }
  const tracksSection = childMap.get('tracks');
  const tracks = tracksSection ? extractYamlTracks(tracksSection) : [];
  return { assets, tracks, speechJobAssetIds };
}

export function validateAudioIntegrity(composition, { tool = 'validate_recipe', knownDurations } = {}) {
  const { assets, tracks, speechJobAssetIds } = inspectRecipeTimeline(composition);
  if (!tracks.length) return;
  const assetsById = new Map(assets.filter((a) => a.id).map((a) => [a.id, a]));
  const errors = [];
  const narrationCoverage = new Map();
  let maxVideoEnd = 0;
  let maxNarrationEnd = 0;

  for (const track of tracks) {
    if (track.hidden) continue;
    const type = String(track.type ?? '').toLowerCase();
    const clips = Array.isArray(track.clips) ? track.clips : [];

    if (type === 'video') {
      for (const clip of clips) {
        const opacity = clip.opacity !== undefined && clip.opacity !== '' ? Number(unquoteScalar(clip.opacity)) : 1;
        if (Number.isFinite(opacity) && opacity <= 0) continue;
        const start = parseDurationSeconds(clip.start) ?? 0;
        const inPoint = clip.inPoint !== undefined && clip.inPoint !== '' ? parseDurationSeconds(clip.inPoint) : 0;
        const outPoint = clip.outPoint !== undefined && clip.outPoint !== '' ? parseDurationSeconds(clip.outPoint) : null;
        const rateRaw = clip.playbackRate !== undefined && clip.playbackRate !== '' ? Number(unquoteScalar(clip.playbackRate)) : 1;
        const rate = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : 1;
        if (inPoint !== null && outPoint !== null && outPoint > inPoint) {
          const end = start + (outPoint - inPoint) / rate;
          if (end > maxVideoEnd) maxVideoEnd = end;
        }
      }
      continue;
    }

    if (type !== 'audio' || track.muted) continue;
    const trackId = track.id || track.name || '(unnamed audio track)';

    for (const clip of clips) {
      const clipId = clip.id || clip.assetId || '(unnamed clip)';
      const vol = clip.volume !== undefined && clip.volume !== null && clip.volume !== ''
        ? Number(unquoteScalar(clip.volume))
        : 100;
      if (Number.isFinite(vol) && vol <= 0) continue;

      const asset = assetsById.get(clip.assetId);
      const file = asset?.file || clip.assetId;
      const duration = asset?.duration ?? knownDurations?.get(file) ?? knownDurations?.get(clip.assetId) ?? null;
      const start = parseDurationSeconds(clip.start) ?? 0;
      const inPoint = clip.inPoint !== undefined && clip.inPoint !== '' ? parseDurationSeconds(clip.inPoint) : 0;
      const outPoint = clip.outPoint !== undefined && clip.outPoint !== '' ? parseDurationSeconds(clip.outPoint) : null;
      const rateRaw = clip.playbackRate !== undefined && clip.playbackRate !== '' ? Number(unquoteScalar(clip.playbackRate)) : 1;
      const rate = Number.isFinite(rateRaw) && rateRaw > 0 ? rateRaw : 1;

      if (outPoint === null && (tool === 'render_video' || tool === 'render_preview')) {
        const hint = duration !== null
          ? `Set \`inPoint: 0\` and \`outPoint: ${duration}\` to play the full "${file}" (${duration}s).`
          : `Call \`get_asset_metadata(files: [{ id: "${clip.assetId}", file: "${file}" }])\` and set \`inPoint: 0, outPoint: <exactDuration>\`.`;
        errors.push(`Audio clip "${clipId}" on track "${trackId}" is missing \`outPoint\`. ${hint}`);
        continue;
      }

      if (duration !== null && outPoint !== null && outPoint > duration + 0.01) {
        errors.push(
          `Audio clip "${clipId}" on track "${trackId}" has \`outPoint: ${outPoint}\` which exceeds "${file}" actual duration (${duration}s). Set \`outPoint: ${duration}\` (never guess a smaller number that truncates audio).`,
        );
        continue;
      }

      if (!clip.linkedClipId && isNarrationClipInfo(track, clip, asset, speechJobAssetIds)) {
        if (inPoint !== null && outPoint !== null && outPoint > inPoint) {
          const end = start + (outPoint - inPoint) / rate;
          if (end > maxNarrationEnd) maxNarrationEnd = end;
        }
        if (duration !== null && duration > 0 && outPoint !== null) {
          const key = file || clip.assetId;
          const prev = narrationCoverage.get(key);
          if (!prev || outPoint >= prev.maxOutPoint) {
            narrationCoverage.set(key, {
              file,
              duration,
              maxOutPoint: outPoint,
              lastClipId: clipId,
              start,
              rate,
            });
          }
        }
      }
    }
  }

  for (const cov of narrationCoverage.values()) {
    const missing = cov.duration - cov.maxOutPoint;
    if (missing > 0.15) {
      const requiredEnd = cov.start + cov.duration / cov.rate;
      errors.push(
        `Narration clip "${cov.lastClipId}" ends at \`outPoint: ${cov.maxOutPoint}s\`, cutting off the last ${missing.toFixed(2)}s of "${cov.file}" (full duration ${cov.duration}s). NEVER truncate narration audio — set \`outPoint: ${cov.duration}\` and extend your video clips/scenes to cover at least ${requiredEnd.toFixed(2)}s.`,
      );
    }
  }

  if (maxVideoEnd > 0 && maxNarrationEnd > 0 && maxVideoEnd < maxNarrationEnd - 0.15) {
    errors.push(
      `Visible video ends at ${maxVideoEnd.toFixed(2)}s while narration continues until ${maxNarrationEnd.toFixed(2)}s (${(maxNarrationEnd - maxVideoEnd).toFixed(2)}s of final speech has no video). Extend your visual clips/scenes to at least ${maxNarrationEnd.toFixed(2)}s.`,
    );
  }

  if (errors.length > 0) {
    throw new Error(formatRecipeErrors(errors));
  }
}

function validateJsonComposition(parsed, { tool } = {}) {
  const errors = [];
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return errors;
  const doc = parsed.document ?? parsed.recipe;
  if (!doc || typeof doc !== 'object') {
    const keys = Object.keys(parsed);
    const dslKeys = keys.filter((k) => ['version', 'mode', 'before', 'after', 'placements', 'jobs', 'tracks', 'captions', 'output'].includes(k));
    if (dslKeys.length > 0) {
      errors.push(
        `Missing top-level \`document:\` envelope (found root key(s): ${dslKeys.join(', ')}). Wrap the edit DSL inside \`document:\` with siblings \`bindings: {}\` and \`assets: []\`.`,
      );
    }
    return errors;
  }

  if ('captions' in parsed || 'captions' in doc) {
    errors.push(
      'Invalid `captions` field. Captions are NOT a top-level or document block — put `{ id: captions-ro, type: captions.generate, language: ..., maxWords: 4, style: { ... } }` inside `document.after`.',
    );
  }
  const misplacedOutput = ['width', 'height', 'fps', 'duration'].filter((k) => k in doc);
  if (misplacedOutput.length > 0) {
    errors.push(
      `Invalid field(s) directly under \`document:\` (${misplacedOutput.join(', ')}). Put output settings under \`document.output: { aspect: portrait|landscape|classic, resolution: 1080p, fps: 30, format: mp4 }\` (duration is derived from clips/placements).`,
    );
  }
  for (const pin of ['catalogVersion', 'compilerVersion']) {
    if (typeof doc[pin] === 'number') {
      errors.push(`\`document.${pin}\` must be a quoted string (e.g. "${doc[pin]}"), never a bare number.`);
    }
  }

  const allJobs = [...(Array.isArray(doc.before) ? doc.before : []), ...(Array.isArray(doc.jobs) ? doc.jobs : [])];
  const pendingImages = [];
  const pendingSpeech = [];
  for (const job of allJobs) {
    if (!job || typeof job !== 'object') continue;
    if (job.type === 'speech.generate' && !job.resultAssetId) {
      pendingSpeech.push(job);
    }
    if (job.type === 'image.generate') {
      if (!job.resultAssetId) pendingImages.push(job);
      const aspect = String(job.aspect ?? '').trim().toLowerCase();
      if (INVALID_IMAGE_ASPECT_ALIASES.has(aspect)) {
        errors.push(
          `image.generate job "${job.id || '(unnamed)'}" uses unsupported aspect "${job.aspect}". Only \`document.output.aspect\` uses portrait/landscape/classic — \`image.generate\` requires an explicit ratio string such as ${VALID_IMAGE_ASPECT_HINT}.`,
        );
      }
      if ('transparent' in job) {
        errors.push(
          `image.generate job "${job.id || '(unnamed)'}" uses \`transparent\`. Use \`background: transparent\` with \`model: openai/gpt-image-2.5-sunburst\` (or \`openai/gpt-image-2.5-flare\`) instead.`,
        );
      }
    }
  }

  if (tool === 'generate_assets' && (pendingImages.length > 0 || pendingSpeech.length > 0)) {
    const hasTimeline =
      (Array.isArray(doc.placements) && doc.placements.length > 0) ||
      (Array.isArray(doc.tracks) && doc.tracks.length > 0) ||
      Boolean(doc.sequence) ||
      Boolean(doc.montage) ||
      Boolean(parsed.snapshot);
    if (!hasTimeline) {
      if (pendingSpeech.length > 0) {
        const sampleId = pendingSpeech[0].id || 'voice-main';
        errors.push(
          `generate_assets has ${pendingSpeech.length} speech.generate job(s) in \`document.before\` but no \`placements\` or \`tracks\`. Without a placement, the backend fails with 422 invalid_duration AFTER paying for speech generation and skips captions. Add \`placements: [{ job: ${sampleId}, track: { type: audio, role: narration }, start: 0s }]\` so the full measured voiceover is placed automatically.`,
        );
      }
      if (pendingImages.length > 0) {
        const sampleId = pendingImages[0].id || 'img_1';
        errors.push(
          `generate_assets has ${pendingImages.length} image.generate job(s) in \`document.before\` but no \`placements\`, \`tracks\`, \`sequence\`, or \`montage\`. The backend requires a positive composition duration (> 0s) after materialization and will fail with 422 invalid_duration even after images generate. Add at least one placement (e.g. \`placements: [{ job: ${sampleId}, track: { type: video, role: main }, start: 0s, duration: 1s }]\`) or keep the resolved Pass 1 narration track/assets.`,
        );
      }
    }
  }

  validateAudioTracksList(doc.tracks, errors);
  return errors;
}

export function validateRecipeComposition(composition, { tool = 'validate_recipe', knownDurations } = {}) {
  if (typeof composition !== 'string' || !composition.trim()) return;
  const trimmed = composition.trim();

  // Support JSON compositions cleanly when callers submit JSON.
  if (trimmed.startsWith('{')) {
    let parsed;
    try {
      parsed = JSON.parse(trimmed);
    } catch {
      return; // Let the strict server parser report exact syntax errors.
    }
    const jsonErrors = validateJsonComposition(parsed, { tool });
    if (jsonErrors.length > 0) {
      throw new Error(formatRecipeErrors(jsonErrors));
    }
    validateAudioIntegrity(composition, { tool, knownDurations });
    return;
  }

  const errors = [];
  const topSections = splitTopLevelSections(composition);
  const topKeys = new Set(topSections.map((s) => s.key));

  const docSection = topSections.find((s) => s.key === 'document' || s.key === 'recipe');
  if (!docSection) {
    const dslKeys = ['version', 'mode', 'before', 'after', 'placements', 'jobs', 'tracks', 'captions', 'output'].filter((k) => topKeys.has(k));
    if (dslKeys.length > 0) {
      errors.push(
        `Missing top-level \`document:\` envelope (found root key(s): ${dslKeys.join(', ')}). Wrap the edit DSL inside \`document:\` with siblings \`bindings: {}\` and \`assets: []\`.`,
      );
    }
  }

  if (topKeys.has('captions')) {
    errors.push(
      'Invalid top-level `captions:` block. Put `{ id: captions-ro, type: captions.generate, language: ..., maxWords: 4, style: { ... } }` inside `document.after`.',
    );
  }

  if (docSection) {
    const docChildren = splitDirectChildSections(docSection.lines);
    const childMap = new Map(docChildren.map((c) => [c.key, c]));

    if (childMap.has('captions')) {
      errors.push(
        'Invalid `document.captions` field. Put `captions.generate` inside `document.after` (not `document.captions` or `document.jobs`).',
      );
    }

    const misplacedOutput = ['width', 'height', 'fps', 'duration'].filter((k) => childMap.has(k));
    if (misplacedOutput.length > 0) {
      errors.push(
        `Invalid field(s) directly under \`document:\` (${misplacedOutput.join(', ')}). Move output configuration under \`document.output: { aspect: portrait|landscape|classic, resolution: 1080p, fps: 30, format: mp4 }\` (composition duration is computed from clips/placements).`,
      );
    }

    for (const pin of ['catalogVersion', 'compilerVersion']) {
      const entry = childMap.get(pin);
      if (entry && /^\d+(?:\.\d+)?$/.test(entry.rest)) {
        errors.push(`\`document.${pin}: ${entry.rest}\` must be a quoted string (e.g. \`${pin}: "${entry.rest}"\`), never a bare number.`);
      }
    }

    const jobSections = [childMap.get('before'), childMap.get('jobs')].filter(Boolean);
    const pendingImages = [];
    const pendingSpeech = [];
    for (const section of jobSections) {
      const items = parseListItems(section.lines);
      for (const item of items) {
        const type = unquoteScalar(item.fields.type);
        const id = unquoteScalar(item.fields.id) || '(unnamed)';
        if (type === 'speech.generate' && !unquoteScalar(item.fields.resultAssetId)) {
          pendingSpeech.push({ id });
        }
        if (type === 'image.generate') {
          if (!unquoteScalar(item.fields.resultAssetId)) pendingImages.push({ id });
          const aspectRaw = unquoteScalar(item.fields.aspect);
          if (INVALID_IMAGE_ASPECT_ALIASES.has(aspectRaw.toLowerCase())) {
            errors.push(
              `image.generate job "${id}" uses unsupported aspect "${aspectRaw}". Only \`document.output.aspect\` uses portrait/landscape/classic — \`image.generate\` MUST use an explicit ratio string like ${VALID_IMAGE_ASPECT_HINT}.`,
            );
          }
          if (item.fields.transparent !== undefined) {
            errors.push(
              `image.generate job "${id}" uses \`transparent\`. Use \`background: transparent\` with \`model: openai/gpt-image-2.5-sunburst\` (or \`openai/gpt-image-2.5-flare\`) instead.`,
            );
          }
        }
      }
    }

    if (tool === 'generate_assets' && (pendingImages.length > 0 || pendingSpeech.length > 0)) {
      const placementsSec = childMap.get('placements');
      const tracksSec = childMap.get('tracks');
      const hasPlacements = Boolean(placementsSec && (parseListItems(placementsSec.lines).length > 0 || (placementsSec.rest && placementsSec.rest !== '[]')));
      const hasTracks = Boolean(tracksSec && (parseListItems(tracksSec.lines).length > 0 || (tracksSec.rest && tracksSec.rest !== '[]')));
      const hasSequence = childMap.has('sequence');
      const hasMontage = childMap.has('montage');
      const hasSnapshot = topKeys.has('snapshot');

      if (!hasPlacements && !hasTracks && !hasSequence && !hasMontage && !hasSnapshot) {
        if (pendingSpeech.length > 0) {
          const sampleId = pendingSpeech[0].id;
          errors.push(
            `generate_assets has ${pendingSpeech.length} speech.generate job(s) in \`document.before\` but no \`placements\` or \`tracks\`. Without a placement, the backend fails with 422 invalid_duration AFTER paying for speech generation and skips captions. Add \`placements: [{ job: ${sampleId}, track: { type: audio, role: narration }, start: 0s }]\` so the full measured voiceover is placed automatically.`,
          );
        }
        if (pendingImages.length > 0) {
          const sampleId = pendingImages[0].id;
          errors.push(
            `generate_assets has ${pendingImages.length} image.generate job(s) in \`document.before\` but no \`placements\`, \`tracks\`, \`sequence\`, or \`montage\`. The backend requires a positive composition duration (> 0s) after materialization and will fail with 422 invalid_duration after generating images. Add at least one placement (e.g. \`placements: [{ job: ${sampleId}, track: { type: video, role: main }, start: 0s, duration: 1s }]\`) or preserve the Pass 1 narration track/assets.`,
          );
        }
      }
    }

    const tracksSection = childMap.get('tracks');
    if (tracksSection) {
      const tracks = extractYamlTracks(tracksSection);
      validateAudioTracksList(tracks, errors);
    }

    const audioSection = childMap.get('audio');
    if (audioSection) {
      const audioItems = parseListItems(audioSection.lines);
      for (const item of audioItems) {
        if (item.fields.volume !== undefined) {
          const vol = Number(unquoteScalar(item.fields.volume));
          if (Number.isFinite(vol) && vol > 0 && vol < 1) {
            errors.push(
              `Audio item "${unquoteScalar(item.fields.id) || unquoteScalar(item.fields.use) || '(unnamed)'}" uses fractional volume ${vol}. Machinal audio volume is 0–200 PERCENT, not 0.0–1.0 gain.`,
            );
          }
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(formatRecipeErrors(errors));
  }
  validateAudioIntegrity(composition, { tool, knownDurations });
}

export function validatePatchRecipeOperations(operations) {
  if (!Array.isArray(operations)) return;
  const errors = [];
  for (const operation of operations) {
    if (!operation || typeof operation !== 'object') continue;
    if (operation.op === 'upsertTracks' && Array.isArray(operation.tracks)) {
      validateAudioTracksList(operation.tracks, errors);
    }
    if (operation.op === 'replaceClipAsset' && typeof operation.volume === 'number' && operation.volume > 0 && operation.volume < 1) {
      errors.push(
        `replaceClipAsset for "${operation.clipId || '(unnamed)'}" uses fractional volume ${operation.volume}. Machinal audio volume is 0–200 PERCENT, not 0.0–1.0 gain.`,
      );
    }
  }
  if (errors.length > 0) {
    throw new Error(formatRecipeErrors(errors));
  }
}

function formatRecipeErrors(errors) {
  return [
    'Invalid Machinal YAML recipe contract (blocked locally before submitting upstream):',
    ...errors.map((err) => `- ${err}`),
    '',
    'Fix these fields first. For complete copy-ready Pass 1 / Pass 2 / Pass 3 templates, see `production_quickstart.yamlTemplates` or `get_library_reference(topic="examples", id="narrated-2d-scenes-sfx")`.',
  ].join('\n');
}
