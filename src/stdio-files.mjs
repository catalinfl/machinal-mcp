import { createHash } from 'node:crypto';
import { lstat, open, realpath, unlink } from 'node:fs/promises';
import { basename, delimiter, dirname, isAbsolute, join, relative } from 'node:path';
import { resolveTemplateCompile, templateCompileHelp, templateCompileSchema } from './template-compile.mjs';

export const MAX_RECIPE_BYTES = 2 * 1024 * 1024;
export const MAX_COMPONENT_BYTES = 64_000;
export const RECIPE_TOOLS = Object.freeze(['validate_recipe', 'compile_recipe', 'generate_assets', 'render_video', 'render_preview']);
const PREFLIGHT_TOOLS = ['validate_recipe', 'compile_recipe'];
const FREE_CHECKPOINT_TOOLS = [...PREFLIGHT_TOOLS, 'get_job_result'];
const PAID_CHECKPOINT_TOOLS = ['render_video', 'render_preview', 'generate_assets'];
const VERSION_PATTERN = /^sha256:[a-f0-9]{64}$/;
const PROJECT_ID_PATTERN = /^[a-z\d_-]{1,64}$/i;

export function compositionVersionHash(composition) {
  return `sha256:${createHash('sha256').update(String(composition).replaceAll('\r\n', '\n'), 'utf8').digest('hex')}`;
}

export function hydrateProductionContractVersion(contract, composition) {
  if (!contract || typeof contract !== 'object' || Array.isArray(contract) || typeof composition !== 'string') return contract;
  if (contract.compositionVersion !== 'auto') return contract;
  return { ...contract, compositionVersion: compositionVersionHash(composition) };
}

export function parseAllowedRoots(fileRoots, env = process.env) {
  const raw = Array.isArray(fileRoots)
    ? fileRoots
    : typeof env?.MACHINAL_MCP_FILE_ROOTS === 'string' && env.MACHINAL_MCP_FILE_ROOTS.trim()
      ? env.MACHINAL_MCP_FILE_ROOTS.split(delimiter)
      : [];
  const roots = raw.map(entry => String(entry).trim()).filter(Boolean);
  for (const root of roots) {
    if (!isAbsolute(root)) throw new Error('MACHINAL_MCP_FILE_ROOTS entries must be absolute paths.');
  }
  return roots;
}

function insideRoot(root, candidate) {
  const from = process.platform === 'win32' ? root.toLowerCase() : root;
  const to = process.platform === 'win32' ? candidate.toLowerCase() : candidate;
  const rel = relative(from, to);
  return !isAbsolute(rel) && rel !== '..' && !rel.startsWith('../') && !rel.startsWith('..\\');
}

async function assertAllowedRoot(canonical, allowedRoots) {
  if (!allowedRoots?.length) return;
  const canonicalRoots = await Promise.all(allowedRoots.map(async root => {
    try { return await realpath(root); } catch { return root; }
  }));
  if (!canonicalRoots.some(root => insideRoot(root, canonical))) {
    throw new Error('Local file path is outside the configured allowed file roots (MACHINAL_MCP_FILE_ROOTS).');
  }
}

function assertPathType(filePath, pattern, errorMessage) {
  if (typeof filePath !== 'string' || !isAbsolute(filePath) || !pattern.test(filePath)) {
    throw new Error(errorMessage);
  }
  return filePath;
}

export async function readBoundedUTF8(filePath, { signal, maxBytes = MAX_RECIPE_BYTES, label = 'Recipe', allowedRoots = [] } = {}) {
  if (typeof filePath !== 'string' || !isAbsolute(filePath)) {
    throw new Error(`${label} path must be absolute.`);
  }
  const info = await lstat(filePath);
  const tooLarge = `${label} exceeds the ${maxBytes === MAX_RECIPE_BYTES ? '2 MiB' : `${maxBytes} byte`} limit.`;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error(`${label} must be a regular file, not a symbolic link.`);
  const canonical = await realpath(filePath);
  await assertAllowedRoot(canonical, allowedRoots);
  const handle = await open(canonical, 'r');
  try {
    const actual = await handle.stat();
    if (!actual.isFile() || actual.ino !== info.ino || actual.dev !== info.dev) {
      throw new Error(`${label} changed before it could be read.`);
    }
    if (actual.size > maxBytes) throw new Error(tooLarge);
    const buffer = Buffer.alloc(maxBytes + 1);
    let length = 0;
    while (length < buffer.length) {
      signal?.throwIfAborted();
      const { bytesRead } = await handle.read(buffer, length, buffer.length - length);
      if (!bytesRead) break;
      length += bytesRead;
    }
    if (length > maxBytes) throw new Error(tooLarge);
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(buffer.subarray(0, length));
  } finally {
    await handle.close();
  }
}

async function prepareNewDestination(filePath, { pattern, errorMessage, allowedRoots }) {
  assertPathType(filePath, pattern, errorMessage);
  const canonicalParent = await realpath(dirname(filePath));
  const canonical = join(canonicalParent, basename(filePath));
  await assertAllowedRoot(canonical, allowedRoots);
  return canonical;
}

export async function saveNewUTF8(canonical, content, { signal, maxBytes = MAX_RECIPE_BYTES, label = 'Recipe' } = {}) {
  const bytes = Buffer.from(content, 'utf8');
  if (bytes.length > maxBytes) throw new Error(`${label} exceeds the ${maxBytes === MAX_RECIPE_BYTES ? '2 MiB' : `${maxBytes} byte`} limit.`);
  const handle = await open(canonical, 'wx', 0o600);
  try {
    await handle.writeFile(bytes, { signal });
  } catch (error) {
    await handle.close();
    await unlink(canonical).catch(() => {});
    throw error;
  }
  await handle.close();
  return { path: canonical, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
}

async function readRecipeFile(filePath, options) {
  assertPathType(filePath, /\.edit\.ya?ml$/i, 'Use an absolute client-local .edit.yaml path. This transfers recipe text only, not local media.');
  return readBoundedUTF8(filePath, { ...options, maxBytes: MAX_RECIPE_BYTES, label: 'Recipe' });
}

async function readProductionContractFile(filePath, options) {
  assertPathType(filePath, /\.json$/i, 'Use an absolute client-local production contract .json path.');
  const parsed = JSON.parse(await readBoundedUTF8(filePath, { ...options, maxBytes: MAX_RECIPE_BYTES, label: 'Production contract' }));
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Production contract file must contain a JSON object.');
  }
  return parsed;
}

async function readCheckpointFile(filePath, projectId, options) {
  assertPathType(filePath, /\.checkpoint\.json$/i, 'Use an absolute client-local .checkpoint.json path.');
  const checkpoint = JSON.parse(await readBoundedUTF8(filePath, { ...options, maxBytes: MAX_RECIPE_BYTES, label: 'Checkpoint' }));
  if (checkpoint?.version !== 1 || !PROJECT_ID_PATTERN.test(checkpoint.projectId ?? '')
    || projectId !== undefined && checkpoint.projectId !== projectId
    || !VERSION_PATTERN.test(checkpoint.compositionVersion)) {
    throw new Error('Checkpoint is invalid or belongs to another project.');
  }
  return checkpoint;
}

function buildCheckpointData(output, args, operation) {
  const data = output?.data;
  if (output?.statusCode !== 200 || !VERSION_PATTERN.test(data?.compositionVersion)) return null;
  const {
    compositionVersion, captionVersion, diagnostics = [], requirements = [],
    productionReview, editorialReview, captionReview, captionContentReview,
  } = data;
  if (!Array.isArray(diagnostics) || !Array.isArray(requirements)) return null;
  const valid = diagnostics.every(item => item?.severity !== 'error');
  return {
    version: 1,
    operation,
    projectId: args.projectId,
    ...(args.jobId ? { jobId: args.jobId } : {}),
    compositionVersion,
    ...(VERSION_PATTERN.test(captionVersion) ? { captionVersion } : {}),
    valid,
    ready: valid && requirements.length === 0,
    diagnostics,
    requirements,
    ...(productionReview ? { productionReview } : {}),
    ...(editorialReview ? { editorialReview } : {}),
    ...(captionReview ? { captionReview } : {}),
    ...(captionContentReview ? { captionContentReview } : {}),
    ...(args.productionContract ? { productionContract: args.productionContract } : {}),
    visualInspection: false,
  };
}

function extractResultPayload(result) {
  if (result?.structuredContent && typeof result.structuredContent === 'object') return result.structuredContent;
  const text = result?.content?.filter(part => part?.type === 'text').map(part => part.text).join('\n');
  if (!text) return undefined;
  try { return JSON.parse(text); } catch { return undefined; }
}

function replaceResultPayload(result, updated) {
  return {
    ...result,
    content: [{ type: 'text', text: JSON.stringify(updated) }],
    ...(result?.structuredContent === undefined ? {} : { structuredContent: updated }),
  };
}

export function decorateStdioTool(tool, { maxWaitSeconds = 120, local = false } = {}) {
  const briefGateNotice = local
    ? 'Requires production_quickstart in this session first. Local zero-credit Docker mode requires the EXACT same collaborative brief (platform/destination + aspect & resolution such as TikTok 9:16 vs YouTube 16:9, duration, visual materials/AI-generated images vs existing media vs procedural, narration/language/TTS model, captions, sound effects) and explicit user approval as cloud mode; never self-approve userApproved:true.'
    : 'Requires production_quickstart in this session first and completing the collaborative brief for all missing decisions (platform/destination + aspect & resolution, duration, visual materials/images vs procedural, narration/language/TTS model, captions, sound effects) with explicit user approval; never self-approve userApproved:true.';

  if (tool.name === 'create_project') {
    return {
      ...tool,
      description: `${tool.description} ${briefGateNotice}`,
    };
  }

  if (tool.name === 'compile_scene') {
    const schema = templateCompileSchema(structuredClone(tool.inputSchema ?? { type: 'object' }));
    schema.properties = {
      ...schema.properties,
      ...(schema.properties?.userApproved ? {
        userApproved: {
          ...schema.properties.userApproved,
          description: `${schema.properties.userApproved.description ?? ''} Never set userApproved:true without the user's explicit brief/scope approval, even in local zero-credit Docker mode.`.trim(),
        },
      } : {}),
      componentFile: {
        type: 'string',
        description: 'Absolute client-local .svelte source (UTF-8, 1–64000 bytes). Read locally instead of repeating Svelte inline in component.',
      },
    };
    return {
      ...tool,
      description: `${tool.description} ${briefGateNotice} Supply component, componentFile (local .svelte path) or templateId. ${templateCompileHelp}`,
      inputSchema: schema,
    };
  }

  if (RECIPE_TOOLS.includes(tool.name)) {
    const schema = structuredClone(tool.inputSchema ?? { type: 'object' });
    const paid = PAID_CHECKPOINT_TOOLS.includes(tool.name);
    const preview = tool.name === 'render_preview';
    schema.required = (schema.required ?? []).filter(key =>
      key !== 'composition' && key !== 'projectId' && !(preview && key === 'expectedCompositionVersion'),
    );
    schema.properties = {
      ...schema.properties,
      ...(paid && schema.properties?.userApproved ? {
        userApproved: {
          ...schema.properties.userApproved,
          description: `${schema.properties.userApproved.description ?? ''} Never self-approve userApproved:true without explicit user approval of the brief/scope, even in local zero-credit Docker mode.`.trim(),
        },
      } : {}),
      ...(schema.properties?.projectId ? {
        projectId: {
          ...schema.properties.projectId,
          description: 'Owned project ID. May be omitted only when supplied by checkpointFile, captionBaselineFile or productionBaselineFile; conflicting IDs are rejected before submission.',
        },
      } : {}),
      compositionFile: {
        type: 'string',
        description: 'Absolute client-local .edit.yaml path to read verbatim as UTF-8 instead of passing composition inline. Transfers recipe text only, never local media.',
      },
      checkpointFile: {
        type: 'string',
        description: paid
          ? 'Optional saved .checkpoint.json from free preflight. Applies its exact compositionVersion guard and projectId before submission; never creates spending consent.'
          : 'Optional absolute new .checkpoint.json path. Saves compact versions, project/job IDs and diagnostics without overwriting.',
      },
      ...(PREFLIGHT_TOOLS.includes(tool.name) ? {
        captionBaselineRecipeFile: {
          type: 'string',
          description: 'Absolute client-local baseline .edit.yaml path for complete caption comparison instead of inline captionBaseline.',
        },
      } : {}),
      ...(!preview ? {
        captionBaselineFile: {
          type: 'string',
          description: 'Optional saved .checkpoint.json from the resolved baseline. Applies its exact expectedCaptionVersion before submission.',
        },
      } : {}),
      ...(tool.name === 'compile_recipe' ? {
        productionContractFile: {
          type: 'string',
          description: 'Absolute client-local .json file containing the structured production contract instead of inline productionContract. Set compositionVersion to "auto" to have the stdio bridge compute the exact normalized SHA-256 from the submitted recipe automatically.',
        },
        productionBaselineFile: {
          type: 'string',
          description: 'Original contract-bearing .checkpoint.json file. Applies productionBaseline to verify original beat IDs survive review.',
        },
      } : {}),
    };
    return {
      ...tool,
      description: `${tool.description}${paid ? ` ${briefGateNotice}` : ''} Client stdio bridge: prefer compositionFile, captionBaselineRecipeFile and checkpointFile over repeating large YAML inline. Existing consent, validation, idempotency and spending rules still apply.`,
      inputSchema: schema,
    };
  }

  if (tool.name === 'get_job_result') {
    const schema = structuredClone(tool.inputSchema ?? { type: 'object' });
    schema.properties = {
      ...schema.properties,
      recipeFile: {
        type: 'string',
        description: 'Optional absolute new .edit.yaml path. Saves returned recipeYaml verbatim as UTF-8 without overwriting and returns a compact receipt instead of echoing full YAML.',
      },
      checkpointFile: {
        type: 'string',
        description: 'Optional absolute new .checkpoint.json path. Saves compact composition/caption versions and job ID without overwriting.',
      },
    };
    return {
      ...tool,
      description: `${tool.description} Client stdio bridge: pass recipeFile and checkpointFile to save resolved YAML and hashes directly to local files without copying large YAML through chat context.`,
      inputSchema: schema,
    };
  }

  if (tool.name === 'wait_for_job') {
    const schema = structuredClone(tool.inputSchema ?? { type: 'object' });
    if (schema.properties?.timeoutSeconds) {
      schema.properties.timeoutSeconds = {
        ...schema.properties.timeoutSeconds,
        maximum: maxWaitSeconds,
        description: `Maximum completion wait per call, 1-${maxWaitSeconds} seconds (default ${Math.min(120, maxWaitSeconds)}). Larger values are capped by the client stdio bridge to prevent MCP client transport timeouts; call wait_for_job again for the SAME jobId while still running.`,
      };
    }
    return {
      ...tool,
      description: `${tool.description} Client stdio bridge caps each call to at most ${maxWaitSeconds}s to stay below client transport timeouts; if still running, call wait_for_job again for the SAME jobId.`,
      inputSchema: schema,
    };
  }

  return tool;
}

export async function prepareStdioToolCall(name, rawArgs = {}, { library, allowedRoots = [], signal } = {}) {
  if (name === 'compile_scene') {
    const resolved = await resolveTemplateCompile(rawArgs, library);
    const { componentFile, ...args } = resolved;
    if (componentFile !== undefined) {
      if (args.component !== undefined) {
        throw new Error('Supply at most one of component, componentFile or templateId.');
      }
      assertPathType(componentFile, /\.svelte$/i, 'Use an absolute client-local .svelte path for componentFile.');
      const source = await readBoundedUTF8(componentFile, { signal, maxBytes: MAX_COMPONENT_BYTES, label: 'Svelte source', allowedRoots });
      if (!source.trim()) throw new Error('Svelte source must contain 1–64000 UTF-8 bytes and must not be blank.');
      args.component = source;
    }
    return { args };
  }

  if (!RECIPE_TOOLS.includes(name) && name !== 'get_job_result') {
    return { args: rawArgs };
  }

  const {
    compositionFile, captionBaselineRecipeFile, productionContractFile,
    checkpointFile, captionBaselineFile, productionBaselineFile, recipeFile,
    ...args
  } = rawArgs;

  const hasLocalFileArgs = [
    compositionFile, captionBaselineRecipeFile, productionContractFile,
    checkpointFile, captionBaselineFile, productionBaselineFile, recipeFile,
  ].some(value => value !== undefined);

  if (!hasLocalFileArgs) {
    if (name === 'compile_recipe' && rawArgs.productionContract && typeof rawArgs.composition === 'string') {
      const hydrated = hydrateProductionContractVersion(rawArgs.productionContract, rawArgs.composition);
      if (hydrated !== rawArgs.productionContract) return { args: { ...rawArgs, productionContract: hydrated } };
    }
    return { args: rawArgs };
  }

  const ioOptions = { signal, allowedRoots };
  const paid = PAID_CHECKPOINT_TOOLS.includes(name);
  const preview = name === 'render_preview';
  let recipeDestination;
  let checkpointDestination;
  let usedCheckpointInput = false;

  if (recipeFile !== undefined) {
    if (name !== 'get_job_result') throw new Error('recipeFile is supported on get_job_result only.');
    recipeDestination = await prepareNewDestination(recipeFile, {
      pattern: /\.edit\.ya?ml$/i,
      errorMessage: 'Use an absolute client-local .edit.yaml path. This transfers recipe text only, not local media.',
      allowedRoots,
    });
  }

  if (productionContractFile !== undefined) {
    if (name !== 'compile_recipe' || args.productionContract !== undefined) {
      throw new Error('Use one productionContractFile on compile_recipe only.');
    }
    args.productionContract = await readProductionContractFile(productionContractFile, ioOptions);
  }

  if (productionBaselineFile !== undefined) {
    if (name !== 'compile_recipe' || args.productionBaseline !== undefined) {
      throw new Error('Use one productionBaselineFile on compile_recipe only.');
    }
    const baseline = await readCheckpointFile(productionBaselineFile, args.projectId, ioOptions);
    usedCheckpointInput = true;
    args.projectId = baseline.projectId;
    if (!baseline.productionContract) {
      throw new Error('Production baseline has no original structured contract. Keep the original beat-level contract; do not substitute a generic summary.');
    }
    args.productionBaseline = baseline.productionContract;
  }

  if (captionBaselineRecipeFile !== undefined) {
    if (!PREFLIGHT_TOOLS.includes(name) || args.captionBaseline !== undefined) {
      throw new Error('Use one caption baseline source on free recipe preflight only.');
    }
    args.captionBaseline = await readRecipeFile(captionBaselineRecipeFile, ioOptions);
  }

  if (captionBaselineFile !== undefined) {
    if (preview || name === 'get_job_result') {
      throw new Error('Compare captions during free preflight, then use its checkpointFile on render_preview.');
    }
    const baseline = await readCheckpointFile(captionBaselineFile, args.projectId, ioOptions);
    usedCheckpointInput = true;
    args.projectId = baseline.projectId;
    if (!VERSION_PATTERN.test(baseline.captionVersion)) {
      throw new Error('Baseline has no text/caption fingerprint. Retrieve the existing resolved result; never regenerate it.');
    }
    if (args.expectedCaptionVersion !== undefined && args.expectedCaptionVersion !== baseline.captionVersion) {
      throw new Error('Conflicting caption baseline versions.');
    }
    args.expectedCaptionVersion = baseline.captionVersion;
  }

  if (compositionFile !== undefined) {
    if (!RECIPE_TOOLS.includes(name)) throw new Error('compositionFile is supported on recipe tools only.');
    if (args.composition !== undefined || args.sourceJobId !== undefined || args.recipeRef !== undefined) {
      throw new Error('Choose compositionFile, composition, recipeRef or sourceJobId, not multiple recipe sources.');
    }
    args.composition = await readRecipeFile(compositionFile, ioOptions);
  }

  if (name === 'compile_recipe' && args.productionContract && typeof args.composition === 'string') {
    args.productionContract = hydrateProductionContractVersion(args.productionContract, args.composition);
  }

  if (checkpointFile !== undefined) {
    if (paid) {
      const checkpoint = await readCheckpointFile(checkpointFile, args.projectId, ioOptions);
      usedCheckpointInput = true;
      args.projectId = checkpoint.projectId;
      const isRender = name === 'render_video' || preview;
      if (!(isRender ? checkpoint.ready : checkpoint.valid)
        || !PREFLIGHT_TOOLS.includes(checkpoint.operation)
        || isRender && ['revision_required', 'not_ready'].includes(checkpoint.productionReview?.status)) {
        throw new Error('Checkpoint has unresolved preflight/review findings. Repair and save a new free preflight; no paid action was submitted.');
      }
      if (args.expectedCompositionVersion !== undefined && args.expectedCompositionVersion !== checkpoint.compositionVersion) {
        throw new Error('Conflicting composition checkpoint versions.');
      }
      args.expectedCompositionVersion = checkpoint.compositionVersion;
    } else if (FREE_CHECKPOINT_TOOLS.includes(name)) {
      checkpointDestination = await prepareNewDestination(checkpointFile, {
        pattern: /\.checkpoint\.json$/i,
        errorMessage: 'Use an absolute client-local .checkpoint.json path.',
        allowedRoots,
      });
    } else {
      throw new Error(`checkpointFile is not supported on ${name}.`);
    }
  }

  if (usedCheckpointInput && !PROJECT_ID_PATTERN.test(args.projectId ?? '')) {
    throw new Error('Use an owned projectId or a matching baseline/preflight checkpoint. No project was guessed.');
  }
  if (preview && checkpointFile !== undefined && !VERSION_PATTERN.test(args.expectedCompositionVersion)) {
    throw new Error('Preview needs a matching preflight checkpointFile or exact expectedCompositionVersion.');
  }

  if (!recipeDestination && !checkpointDestination) {
    return { args };
  }

  return {
    args,
    postProcess: async result => {
      if (result?.isError) return result;
      const output = extractResultPayload(result);
      if (!output || typeof output !== 'object' || !output.data || typeof output.data !== 'object') return result;

      let nextData = { ...output.data };
      let changed = false;

      if (recipeDestination && typeof nextData.recipeYaml === 'string') {
        try {
          const receipt = await saveNewUTF8(recipeDestination, nextData.recipeYaml, { signal, maxBytes: MAX_RECIPE_BYTES, label: 'Resolved recipe' });
          const { recipeYaml: _stripped, ...summary } = nextData;
          nextData = { ...summary, recipeFile: receipt };
          changed = true;
        } catch (error) {
          nextData = {
            ...nextData,
            recipeFileError: error.code === 'EEXIST'
              ? 'Destination exists; no overwrite. Use the returned YAML or a new filename.'
              : 'Could not save the recipe. Use the intact returned YAML; no generation was repeated.',
          };
          changed = true;
        }
      }

      if (checkpointDestination) {
        const checkpoint = buildCheckpointData(output, args, name);
        if (checkpoint) {
          try {
            const receipt = await saveNewUTF8(checkpointDestination, `${JSON.stringify(checkpoint, null, 2)}\n`, { signal, maxBytes: MAX_RECIPE_BYTES, label: 'Checkpoint' });
            nextData = { ...nextData, checkpointFile: receipt };
            changed = true;
          } catch (error) {
            nextData = {
              ...nextData,
              checkpointFileError: error.code === 'EEXIST'
                ? 'Checkpoint exists; no overwrite. Keep this result or choose a new checkpoint filename.'
                : 'Checkpoint saving failed; retain this intact result. No operation was repeated.',
            };
            changed = true;
          }
        }
      }

      return changed ? replaceResultPayload(result, { ...output, data: nextData }) : result;
    },
  };
}
