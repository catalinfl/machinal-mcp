const actions = ['camera', 'layers', 'spatial'];
const aspects = ['landscape', 'portrait', 'classic'];
const resolutions = ['1080p', '720p'];
const beatFields = {
  id: { type: 'string', minLength: 1, maxLength: 128, description: 'Stable clip ID.' },
  action: { type: 'string', enum: actions, description: 'camera = a still with native timeline treatment; layers = independent 2D action; spatial = genuine 3D action.' },
  duration: { type: 'number', minimum: 0.1, maximum: 86400, description: 'Measured beat seconds until the next cue. An outgoing dissolve adds a source handle, not time to this cue.' },
  dissolve: { type: 'number', minimum: 0.1, description: 'Optional outgoing native cross-dissolve in seconds. Omit for a cut.' },
  look: { type: 'string', minLength: 1, maxLength: 128, description: 'Camera beat: chosen catalog look ID. Defaults to creator-natural.' },
  motion: { type: 'string', minLength: 1, maxLength: 128, description: 'Camera beat: chosen catalog motion ID, e.g. ken-burns or none. Defaults to drift.' },
  assetId: { type: 'string', minLength: 1, maxLength: 256, description: 'Actual approved project image or matching pinned scene asset ID. Omit when still to be bound; never invent one.' },
};
const properties = {
  beats: { type: 'array', minItems: 1, maxItems: 64, items: {
    type: 'object', additionalProperties: false, required: ['id', 'action', 'duration'], properties: beatFields,
  } },
  fps: { type: 'integer', minimum: 1, maximum: 60, default: 24, description: 'For a new cinematic edit. Supply the agreed cadence when different.' },
  aspect: { type: 'string', enum: aspects, default: 'landscape' },
  resolution: { type: 'string', enum: resolutions, default: '1080p', description: 'Resolution of this plan only. Choose 720p explicitly for a separate draft.' },
};
export const HYBRID_EDIT_TOOL = {
  name: 'plan_hybrid_edit',
  description: 'Build a local visual track for an image-led cinematic edit from measured beat durations. Use native images for camera moves, 2D Svelte for independent layers and 3D only for spatial action. Returns recipe fields, settings for new scenes and a cold capture-frame budget. Does not read media, modify projects, compile or render.',
  inputSchema: { type: 'object', additionalProperties: false, required: ['beats'], properties },
  annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
};

function knownFields(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !Object.hasOwn(allowed, key)))
    throw new Error(`Invalid fields in ${label}.`);
}
function microseconds(value, label) {
  if (!Number.isFinite(value) || value < 0.1 || value > 86400) throw new Error(`${label} must be 0.1–86400 seconds.`);
  return Math.round(value * 1e6);
}
function identifier(value, max) {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

export function planHybridEdit(input) {
  knownFields(input, properties, 'plan');
  const { beats, fps = 24, aspect = 'landscape', resolution = '1080p' } = input;
  if (!Array.isArray(beats) || !beats.length || beats.length > 64) throw new Error('Supply 1–64 ordered beats.');
  if (!Number.isInteger(fps) || fps < 1 || fps > 60 || !aspects.includes(aspect) || !resolutions.includes(resolution))
    throw new Error('Use a supported aspect, resolution and integer scene/output fps (1–60).');
  const ids = new Set();
  const shots = beats.map((beat, i) => {
    knownFields(beat, beatFields, `beat ${i + 1}`);
    if (!identifier(beat.id, 128) || ids.has(beat.id) || !actions.includes(beat.action)
      || beat.assetId !== undefined && !identifier(beat.assetId, 256)) throw new Error(`Beat ${i + 1} needs a unique ID, a supported action and a valid asset ID when supplied.`);
    for (const field of ['look', 'motion']) {
      if (beat[field] !== undefined && (beat.action !== 'camera' || !identifier(beat[field], 128)))
        throw new Error(`${field} must be a catalog ID on a camera beat.`);
    }
    ids.add(beat.id);
    const span = microseconds(beat.duration, `${beat.id}.duration`);
    const handle = beat.dissolve === undefined ? 0 : microseconds(beat.dissolve, `${beat.id}.dissolve`);
    const source = span + handle;
    if (beat.action !== 'camera' && (source > 60e6 || !beat.assetId && source < 1e6))
      throw new Error(`Scene ${beat.id} exceeds source limits including its outgoing handle (60s maximum; 1s minimum for a new scene).`);
    return { ...beat, span, handle, source };
  });

  const short = resolution === '720p' ? 720 : 1080;
  const long = short * 16 / 9;
  const [width, height] = aspect === 'portrait' ? [short, long] : [aspect === 'classic' ? short * 4 / 3 : long, short];
  const track = { id: 'hybrid-visuals', type: 'video', clips: [] };
  const transitions = [], newScenes = [], missingAssetFor = [], pinnedScenes = [];
  let start = 0, newSceneFrames = 0;
  for (const [i, shot] of shots.entries()) {
    const { id, assetId, action, source, span, handle } = shot;
    const duration = source / 1e6;
    if (start + source > 86400e6) throw new Error('Timeline exceeds 24 hours.');
    if (handle) {
      const next = shots[i + 1];
      if (!next) throw new Error('The last beat has no outgoing junction.');
      const reserve = action === 'camera' && next.action === 'camera' ? 0 : 100000;
      if (handle > next.span || 2 * handle > Math.min(source, next.source) - reserve)
        throw new Error(`Dissolve after ${id} exceeds available handles; shorten it without shifting the cue.`);
      transitions.push({ id: `hybrid-dissolve-${i + 1}`, trackId: track.id, leftClipId: id, rightClipId: next.id, preset: 'cross-dissolve', duration: handle / 1e6 });
    }
    const clip = { id, ...(assetId ? { assetId } : {}), start: start / 1e6, inPoint: 0, outPoint: duration };
    if (!assetId) missingAssetFor.push(id);
    if (action === 'camera') Object.assign(clip, { look: shot.look ?? 'creator-natural', motion: shot.motion ?? 'drift' });
    else if (assetId) pinnedScenes.push(id);
    else {
      const frames = Math.ceil(source * fps / 1e6);
      newSceneFrames += frames;
      newScenes.push({ clipId: id, frames, compileSettings: { visualMode: action === 'layers' ? '2d' : '3d', width, height, fps, duration } });
    }
    track.clips.push(clip);
    start += span;
  }
  return {
    duration: start / 1e6, documentFields: { tracks: [track], transitions, output: { aspect, resolution, fps, format: 'mp4' } },
    newScenes, missingAssetFor, captureBudget: { newSceneFrames, pinnedSceneClipIdsNotEstimated: pinnedScenes },
    next: 'Merge only the intended visual fields into the resolved recipe. Bind every missing clip.assetId and retain real asset metadata. For new scenes combine compileSettings with the selected component and approved attachments. Reuse matching scene pins on later edits. Capture counts exclude cache, pinned sources and final composition; validate/compile the exact YAML.',
  };
}
