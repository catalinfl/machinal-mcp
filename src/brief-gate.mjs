const VALID_SOURCES = new Set(['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet']);
const VALID_ASPECTS = new Set(['portrait', 'landscape', 'classic', '9:16', '16:9', '4:3', 'undecided']);
const VALID_RESOLUTIONS = new Set(['480p', '720p', '1080p', '2k', '4k', 'undecided']);
const PLACEHOLDER_QUOTE_RE = /^(?:none|n\/a|na|default|assumed|inferred|implicit|auto|tbd|todo|unknown|unspecified|null|undefined|ok|yes|y|-|\.+)$/i;

export function normalizeAspect(value) {
  const raw = String(value ?? '').trim().toLowerCase();
  if (raw === '9:16' || raw === 'portrait' || raw === 'vertical') return 'portrait';
  if (raw === '16:9' || raw === 'landscape' || raw === 'horizontal') return 'landscape';
  if (raw === '4:3' || raw === 'classic') return 'classic';
  return raw;
}

export const CONFIRM_BRIEF_TOOL = Object.freeze({
  name: 'confirm_brief',
  description:
    'Record the user-confirmed video brief AFTER calling production_quickstart + list_speech_models and asking all missing options via your host native question tool (ask_question / question) and receiving the user reply (or verifying every required option was explicitly stated/delegated by the user). REQUIRED before create_project, compile_scene, generate_assets, render_video, or render_preview. If any required decision (format/aspect & resolution, duration, visual materials, narration/language/TTS speech model, captions, sound effects, or user approval) is still unanswered, pass source="not_asked_yet" or ask the user first — this tool blocks production and returns the exact missing questions rather than letting defaults be invented. Offline, free, zero credits.',
  inputSchema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'purpose',
      'askedUser',
      'format',
      'duration',
      'visuals',
      'narration',
      'captions',
      'soundEffects',
      'userApproval',
    ],
    properties: {
      purpose: {
        type: 'string',
        enum: ['create', 'edit'],
        description: 'Whether creating a new video ("create") or editing an existing project ("edit").',
      },
      projectId: {
        type: 'string',
        description: 'Owned projectId when purpose="edit" (binds this confirmed brief to that project).',
      },
      askedUser: {
        type: 'boolean',
        description: 'True if you already asked the user via ask_question / question and received their reply. False ONLY if the user prompt itself explicitly answered EVERY axis below or explicitly wrote "you decide" / "alegi tu".',
      },
      format: {
        type: 'object',
        additionalProperties: false,
        required: ['aspect', 'resolution', 'source'],
        properties: {
          platform: { type: 'string', description: 'Destination platform (e.g. TikTok/Reels, YouTube, web).' },
          aspect: { type: 'string', enum: ['portrait', 'landscape', 'classic', '9:16', '16:9', '4:3', 'undecided'] },
          resolution: { type: 'string', enum: ['480p', '720p', '1080p', '2k', '4k', 'undecided'] },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string', description: 'Short exact quote from the user supporting this choice (required unless source="existing_project").' },
        },
      },
      duration: {
        type: 'object',
        additionalProperties: false,
        required: ['target', 'source'],
        properties: {
          target: { type: 'string', description: 'Approximate target duration (e.g. "~30s", "~60s", "undecided").' },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string' },
        },
      },
      visuals: {
        type: 'object',
        additionalProperties: false,
        required: ['materials', 'source'],
        properties: {
          materials: { type: 'string', description: 'Agreed visual materials/presentation (e.g. "2D procedural Svelte + AI images", "2D procedural only", "existing footage").' },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string' },
        },
      },
      narration: {
        type: 'object',
        additionalProperties: false,
        required: ['enabled', 'source'],
        properties: {
          enabled: { type: 'boolean' },
          language: { type: 'string', description: 'Spoken language code or name (e.g. "en", "ro") when enabled=true.' },
          speechModel: {
            type: 'string',
            description: 'Exact TTS model ID from list_speech_models when enabled=true (e.g. "hexgrad/kokoro-82m", "google/gemini-3.8-flash-lite-tts", "google/gemini-3.8-flash-tts"). Never invent without asking the user.',
          },
          voice: { type: 'string', description: 'Optional chosen voice name (e.g. "Kore", "Charon").' },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string' },
        },
      },
      captions: {
        type: 'object',
        additionalProperties: false,
        required: ['enabled', 'source'],
        properties: {
          enabled: { type: 'boolean' },
          style: { type: 'string' },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string' },
        },
      },
      soundEffects: {
        type: 'object',
        additionalProperties: false,
        required: ['enabled', 'source'],
        properties: {
          enabled: { type: 'boolean' },
          scope: { type: 'string', description: 'e.g. "discrete CC0 SFX from Freesound/Openverse" or "none".' },
          source: { type: 'string', enum: ['user_reply', 'user_prompt', 'user_delegated', 'existing_project', 'not_asked_yet'] },
          userQuote: { type: 'string' },
        },
      },
      userApproval: {
        type: 'object',
        additionalProperties: false,
        required: ['approved', 'scope', 'userQuote'],
        properties: {
          approved: { type: 'boolean', description: 'True ONLY after explicit user authorization for the covered generation/render scope.' },
          scope: { type: 'string', description: 'Approved scope (e.g. "TTS speech, optional images, scene rendering, final MP4 render").' },
          userQuote: { type: 'string', description: 'Short exact quote from the user authorizing this work.' },
        },
      },
    },
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
});

function isValidQuote(quote) {
  if (typeof quote !== 'string') return false;
  const trimmed = quote.trim();
  if (trimmed.length < 2) return false;
  return !PLACEHOLDER_QUOTE_RE.test(trimmed);
}

function checkAxisSource(label, axis, purpose, askedUser, missingDecisions) {
  if (!axis || typeof axis !== 'object' || Array.isArray(axis)) {
    missingDecisions.push(`${label}: missing decision — ask the user before proceeding.`);
    return false;
  }
  const source = axis.source;
  if (!VALID_SOURCES.has(source)) {
    missingDecisions.push(`${label}: invalid source "${source}".`);
    return false;
  }
  if (source === 'not_asked_yet') {
    missingDecisions.push(`${label}: not asked yet — include in your ask_question / question form.`);
    return false;
  }
  if (source === 'existing_project' && purpose !== 'edit') {
    missingDecisions.push(`${label}: source="existing_project" is only valid when purpose="edit" (this is a new video — ask the user).`);
    return false;
  }
  if (source === 'user_reply' && askedUser === false) {
    missingDecisions.push(`${label}: source="user_reply" conflicts with askedUser=false — ask the user first and wait for their reply.`);
    return false;
  }
  if (source !== 'existing_project' && !isValidQuote(axis.userQuote)) {
    missingDecisions.push(`${label}: missing a real userQuote from the user's prompt/reply (placeholders like "default", "assumed", "ok" are rejected — ask the user if they haven't explicitly answered this).`);
    return false;
  }
  return true;
}

export function validateBriefConfirmation(args = {}, { quickstartCompleted = true, deploymentKind = 'cloud' } = {}) {
  if (!quickstartCompleted) {
    return {
      ok: false,
      payload: {
        status: 'blocked',
        submissionState: 'not-submitted',
        nextTool: 'production_quickstart',
        deploymentMode: deploymentKind,
        error: 'Call production_quickstart (alongside list_speech_models and live bootstrap tools) first before confirm_brief.',
      },
    };
  }

  const missingDecisions = [];
  const purpose = args?.purpose;
  if (purpose !== 'create' && purpose !== 'edit') {
    missingDecisions.push('purpose: must be "create" or "edit".');
  }
  if (purpose === 'edit' && (typeof args?.projectId !== 'string' || !args.projectId.trim())) {
    missingDecisions.push('projectId: supply the existing owned projectId when purpose="edit".');
  }
  if (typeof args?.askedUser !== 'boolean') {
    missingDecisions.push('askedUser: must be boolean (true after asking via ask_question/question and getting a reply).');
  }
  const askedUser = Boolean(args?.askedUser);

  // 1. Format (aspect + resolution)
  if (checkAxisSource('format (platform, aspect ratio & resolution)', args?.format, purpose, askedUser, missingDecisions)) {
    const aspect = String(args.format.aspect ?? '').trim().toLowerCase();
    const resolution = String(args.format.resolution ?? '').trim().toLowerCase();
    if (!VALID_ASPECTS.has(aspect) || aspect === 'undecided') {
      missingDecisions.push('format.aspect: aspect ratio is undecided — ask the user (e.g. TikTok/Reels 9:16 portrait vs YouTube 16:9 landscape).');
    }
    if (!VALID_RESOLUTIONS.has(resolution) || resolution === 'undecided') {
      missingDecisions.push('format.resolution: output resolution is undecided — ask the user (e.g. 1080p vs 720p).');
    }
  }

  // 2. Duration
  if (checkAxisSource('duration', args?.duration, purpose, askedUser, missingDecisions)) {
    const target = String(args.duration.target ?? '').trim();
    if (!target || /^undecided$/i.test(target)) {
      missingDecisions.push('duration.target: approximate duration is undecided — ask the user (e.g. ~30s vs ~60s).');
    }
  }

  // 3. Visual materials
  if (checkAxisSource('visuals (materials & presentation)', args?.visuals, purpose, askedUser, missingDecisions)) {
    const materials = String(args.visuals.materials ?? '').trim();
    if (!materials || /^undecided$/i.test(materials)) {
      missingDecisions.push('visuals.materials: visual approach is undecided — ask the user (AI-generated images vs existing media vs pure procedural 2D/3D).');
    }
  }

  // 4. Narration & TTS speech model
  if (checkAxisSource('narration (voiceover, language & TTS speech model)', args?.narration, purpose, askedUser, missingDecisions)) {
    if (typeof args.narration.enabled !== 'boolean') {
      missingDecisions.push('narration.enabled: must be true or false.');
    } else if (args.narration.enabled && args.narration.source !== 'existing_project') {
      const lang = String(args.narration.language ?? '').trim();
      const model = String(args.narration.speechModel ?? '').trim();
      if (!lang || /^undecided$/i.test(lang)) {
        missingDecisions.push('narration.language: spoken language is missing.');
      }
      if (!model || /^undecided$/i.test(model) || !model.includes('/')) {
        missingDecisions.push('narration.speechModel: exact TTS speech model ID from list_speech_models is missing — ask the user to choose (e.g. Kokoro hexgrad/kokoro-82m, Gemini 3.8 Flash-Lite, or Gemini 3.8 Flash).');
      }
    }
  }

  // 5. Captions
  if (checkAxisSource('captions / subtitles', args?.captions, purpose, askedUser, missingDecisions)) {
    if (typeof args.captions.enabled !== 'boolean') {
      missingDecisions.push('captions.enabled: must be true or false — ask the user if they want captions/subtitles.');
    }
  }

  // 6. Sound effects (separate question)
  if (checkAxisSource('soundEffects (separate SFX choice)', args?.soundEffects, purpose, askedUser, missingDecisions)) {
    if (typeof args.soundEffects.enabled !== 'boolean') {
      missingDecisions.push('soundEffects.enabled: must be true or false — ask the user separately whether they want discrete CC0 sound effects or none.');
    }
  }

  // 7. Explicit user approval
  const approval = args?.userApproval;
  if (!approval || typeof approval !== 'object' || approval.approved !== true) {
    missingDecisions.push('userApproval.approved: explicit user approval for the covered generation/render scope is required — ask the user before proceeding.');
  } else {
    if (typeof approval.scope !== 'string' || approval.scope.trim().length < 3) {
      missingDecisions.push('userApproval.scope: describe the exact actions authorized by the user.');
    }
    if (!isValidQuote(approval.userQuote)) {
      missingDecisions.push('userApproval.userQuote: supply a real quote from the user authorizing this work (never self-approve).');
    }
  }

  if (missingDecisions.length > 0) {
    return {
      ok: false,
      payload: {
        status: 'needs_user_input',
        submissionState: 'not-submitted',
        deploymentMode: deploymentKind,
        missingDecisions,
        nextAction:
          'STOP. Do NOT guess defaults or call create_project, compile_scene, generate_assets, or render_video yet. Call your host native question tool (ask_question / question) RIGHT NOW in ONE interactive form asking the user about every item in missingDecisions above (including voice/TTS model from list_speech_models, format/aspect & resolution, duration, captions, sound effects, and explicit approval). Wait for the user reply, then call confirm_brief with their actual answers.',
      },
    };
  }

  const normalizedBrief = {
    purpose,
    ...(args.projectId ? { projectId: args.projectId.trim() } : {}),
    askedUser,
    confirmedAt: new Date().toISOString(),
    format: {
      ...(args.format.platform ? { platform: String(args.format.platform).trim() } : {}),
      aspect: normalizeAspect(args.format.aspect),
      resolution: String(args.format.resolution).trim().toLowerCase(),
      source: args.format.source,
    },
    duration: {
      target: String(args.duration.target).trim(),
      source: args.duration.source,
    },
    visuals: {
      materials: String(args.visuals.materials).trim(),
      source: args.visuals.source,
    },
    narration: {
      enabled: Boolean(args.narration.enabled),
      ...(args.narration.language ? { language: String(args.narration.language).trim() } : {}),
      ...(args.narration.speechModel ? { speechModel: String(args.narration.speechModel).trim() } : {}),
      ...(args.narration.voice ? { voice: String(args.narration.voice).trim() } : {}),
      source: args.narration.source,
    },
    captions: {
      enabled: Boolean(args.captions.enabled),
      ...(args.captions.style ? { style: String(args.captions.style).trim() } : {}),
      source: args.captions.source,
    },
    soundEffects: {
      enabled: Boolean(args.soundEffects.enabled),
      ...(args.soundEffects.scope ? { scope: String(args.soundEffects.scope).trim() } : {}),
      source: args.soundEffects.source,
    },
    userApproval: {
      approved: true,
      scope: String(approval.scope).trim(),
    },
  };

  return {
    ok: true,
    brief: normalizedBrief,
    payload: {
      status: 'confirmed',
      deploymentMode: deploymentKind,
      brief: normalizedBrief,
      nextAction:
        purpose === 'create'
          ? 'Brief confirmed. Proceed immediately with create_project and the authorized timing-first Pass 1 -> scene compilation -> validate_recipe/compile_recipe -> render_video workflow without asking redundant confirmation prompts.'
          : `Brief confirmed for project ${normalizedBrief.projectId}. Proceed with the authorized edit workflow.`,
    },
  };
}

export function checkRecipeAgainstBrief(composition, brief, { tool } = {}) {
  if (!brief || typeof composition !== 'string' || !composition.trim()) return;
  const errors = [];

  // Check speech.generate model / unrequested narration
  if (tool === 'generate_assets' || tool === 'render_video') {
    const speechMatches = [...composition.matchAll(/type\s*:\s*['"]?speech\.generate['"]?/gi)];
    if (speechMatches.length > 0 && brief.narration?.enabled === false) {
      errors.push('Recipe contains a `speech.generate` job, but the confirmed brief has narration disabled (`narration.enabled: false`). Remove narration or confirm with the user first.');
    }
    if (speechMatches.length > 0 && brief.narration?.speechModel) {
      // Extract model field inside speech.generate blocks (YAML or JSON)
      const expectedModel = brief.narration.speechModel.trim().toLowerCase();
      const blocks = composition.split(/(?=^\s*-\s+)/m);
      for (const block of blocks) {
        if (!/type\s*:\s*['"]?speech\.generate['"]?/i.test(block)) continue;
        if (/resultAssetId\s*:/i.test(block)) continue;
        const modelMatch = /^\s*(?:-\s*)?model\s*:\s*['"]?([^\s'"#,}]+)['"]?/im.exec(block);
        if (modelMatch) {
          const actualModel = modelMatch[1].trim().toLowerCase();
          if (actualModel !== expectedModel) {
            errors.push(
              `speech.generate uses model "${modelMatch[1]}", which does not match the user's confirmed TTS model "${brief.narration.speechModel}" from confirm_brief. Use "${brief.narration.speechModel}" or ask the user before switching speech models.`,
            );
          }
        }
      }
    }
  }

  // Check output aspect ratio consistency on final render
  if (tool === 'render_video' && brief.format?.aspect) {
    const outputBlock = /output\s*:\s*(?:\{([^}]*)\}|([\s\S]{0,240}))/i.exec(composition);
    if (outputBlock) {
      const region = outputBlock[1] ?? outputBlock[2] ?? '';
      const aspectMatch = /\baspect\s*:\s*['"]?([^\s'",}]+)['"]?/i.exec(region);
      if (aspectMatch) {
        const recipeAspect = normalizeAspect(aspectMatch[1]);
        if (recipeAspect && recipeAspect !== brief.format.aspect) {
          errors.push(
            `Recipe output.aspect "${aspectMatch[1]}" (${recipeAspect}) contradicts the user's confirmed format "${brief.format.aspect}" from confirm_brief. Update document.output.aspect or confirm a format change with the user.`,
          );
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new Error([
      'Recipe contradicts the user-confirmed video brief (blocked locally before submitting upstream):',
      ...errors.map((err) => `- ${err}`),
    ].join('\n'));
  }
}
