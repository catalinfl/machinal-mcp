import { realpath } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { filePermission, readBoundedUTF8 } from './opencode-recipes.mjs';
import { SceneLibrary } from './scene-library.mjs';
import { templateCompileSchema, resolveTemplateCompile, templateCompileHelp } from './template-compile.mjs';
import { RequestScheduler } from './request-scheduler.mjs';
import { hasSceneCandidates, clearSceneCandidates } from './opencode-library.mjs';

export const productionSkills = ['machinal-editing', 'machinal-recipes', 'machinal-scenes', 'machinal-cinema', 'machinal-review', 'machinal-credits', 'machinal-motion', 'machinal-choreography', 'machinal-spatial', 'machinal-visual-review', 'machinal-sound'];
export const startupSkills = ['machinal-editing', 'machinal-cinema'];

function briefAndComponentsFor(mode = 'cloud') {
  const reconfirmPhrase = mode === 'local'
    ? 'Do not reconfirm under a different tool, after a checkpoint or after preflight within scope.'
    : 'Do not reconfirm under a different tool, after a checkpoint or after a credit check within scope and budget.';
  const localParity = mode === 'local'
    ? ' Local zero-credit Docker mode requires the EXACT same collaborative brief (platform/aspect+resolution such as TikTok 9:16 vs YouTube 16:9, duration, visuals/AI-generated images vs procedural, narration/language/TTS model, captions, and sound effects) and explicit user approval as cloud mode; a short topic+style prompt is NOT a complete brief and never authorizes self-approving userApproved:true.'
    : ' A short topic+style prompt is NOT a complete brief; ask all missing decisions (platform/aspect+resolution, duration, visuals/images vs procedural, narration/language/TTS model, captions, sound effects) in one native question form before creating projects, compiling scenes or rendering.';
  return `Read the request and earlier replies before asking anything.${localParity} If sound is undecided, ask “sound effects or no sound effects?” in the same native form, separately from voice/captions and licensed music. Include only missing permissions; offer delegated CC0 search/import/use when needed. Reuse approval from chat or the brief through sound selection/import/mixing, paid generation, scene-frame rendering, final encoding and requested delivery wherever covered. ${reconfirmPhrase} Before writing each distinct animated beat, search the local library with topic=component-discovery and its visible action, role, applicable profiles and aspect. Compare two relevant native candidates by default; after a miss, browse the broader role once. Read the chosen exact scene-templates source, compile via the candidate’s templateId, and place the returned pinned scene on the timeline. Record beat → templateId → placed clip, or use customSceneReason to explain the specific mismatch. A catalog hit is not reuse. Do not force a component when none fits or ask the user to choose implementation IDs.`;
}
const maxComponentBytes = 64000;
const hybridWorkflow = 'For an image-led documentary or cinematic edit, use machinal_hybrid_edit after timing and before component discovery. Native camera moves on image clips do not need a component. Compile only the short independently animated beats using the returned compileSettings; keep explicit output choices and existing pins.';

async function installedSkills(ctx) {
  try {
    const result = await ctx.skill.list();
    const skills = Array.isArray(result) ? result : result?.data;
    if (!Array.isArray(skills)) throw new TypeError('Unsupported skill list response');
    return new Map(skills.filter(skill => typeof skill?.id === 'string').map(skill => [skill.id, skill]));
  } catch {
    return new Map();
  }
}

export async function installWorkflowStartup(ctx, servers = [], { mode = 'cloud' } = {}) {
  const names = [...servers];
  const prepared = new Map();
  const library = new SceneLibrary(undefined, { mode });
  const briefAndComponents = briefAndComponentsFor(mode);
  const scheduler = new RequestScheduler();
  if (ctx.skill?.transform) {
    await ctx.skill.transform(editor => {
      for (const id of [...productionSkills, 'machinal-media', 'machinal-support']) {
        const legacy = id.replace('machinal-', 'directional-');
        if (editor.get(id) && editor.get(legacy)) editor.remove(legacy);
      }
    });
  }
  await ctx.session.hook('prompt', async event => {
    const prompt = event.prompt;
    if (!prompt) return;
    const selected = new Set((prompt.skills ?? []).map(skill => skill.id));
    const explicit = productionSkills.some(id => selected.has(id));
    if (!explicit) return;
    const available = await installedSkills(ctx);
    for (const id of startupSkills) {
      if (available.has(id) && !selected.has(id)) {
        (prompt.skills ??= []).push({ id });
      }
    }
  });
  await ctx.tool.transform(editor => {
    editor.add({
      name: 'machinal_prepare_video',
      description: 'Start or resume video creation/editing in ANY language before the brief/media/production. Loads editing and cinema startup guidance; load recipe/scene/review/credit guides only for the current stage. Required before compile_scene/render_video. No provider calls, media access, jobs or spending. Not for MCP/code debugging or standalone images. Preparation is not production permission.',
      input: { type: 'object', additionalProperties: false, required: ['purpose'], properties: {
        purpose: { type: 'string', enum: ['create', 'edit'], description: 'The video task understood by the current agent, independent of the user’s language.' },
      } },
      options: { codemode: false },
      async execute(input, context) {
        if (!['create', 'edit'].includes(input.purpose) || !context.sessionID) return { content: JSON.stringify({ status: 'blocked', error: 'Use create/edit in a session.' }) };
        prepared.delete(context.sessionID);
        const installed = await installedSkills(ctx);
        const missing = startupSkills.filter(id => !installed.get(id)?.content?.trim());
        if (missing.length) return { content: JSON.stringify({ status: 'blocked', missingSkills: missing, error: 'Install/restore these production skills before video production. No production action was executed.' }) };
        await ctx.permission.assert({ sessionID: context.sessionID, agent: context.agent,
          source: { type: 'tool', messageID: context.messageID, id: context.id },
          action: 'skill', resources: startupSkills, save: startupSkills,
        });
        const skills = startupSkills.map(id => installed.get(id));
        prepared.delete(context.sessionID);
        prepared.set(context.sessionID, { skills, contextLoaded: false });
        clearSceneCandidates(context.sessionID);
        if (prepared.size > 128) prepared.delete(prepared.keys().next().value);
        return { content: JSON.stringify({ status: 'ready', purpose: input.purpose, loadedSkills: startupSkills,
          next: `${hybridWorkflow} ${briefAndComponents} ${templateCompileHelp} If not already authorized, offer exact transcription fixes against approved narration in the initial brief. Fetch stage-specific guides only as needed and resume existing jobs/assets.` }) };
      },
    });
    for (const server of names) {
      for (const name of ['compile_scene', 'render_video']) {
        editor.update(`${server}_${name}`.replace(/[^a-z\d_-]/gi, '_'), tool => {
          const execute = tool.execute;
          tool.description += ' Requires machinal_prepare_video in this session to load production guidance including cinema. Missing preparation executes no scene/render action.';
          if (name === 'compile_scene') {
            tool.input = templateCompileSchema({ ...tool.input, properties: {
              ...tool.input?.properties,
              componentFile: { type: 'string', description: 'Absolute client-local .svelte source (UTF-8, at most 64000 bytes). Use instead of inline component. Reads with host permission; attachments/sourceFile stay on the project server.' },
              customSceneReason: { type: 'string', maxLength: 400, description: 'For a new hand-authored scene after discovery: name the missing action or identify the template manually adapted in componentFile. An implementation note, not a user question.' },
            } });
            tool.description += ` Supply exactly one of component, componentFile or templateId. ${templateCompileHelp}`;
          }
          tool.execute = async (input, context) => {
            if (!prepared.get(context.sessionID)?.contextLoaded) return { content: JSON.stringify({ status: 'blocked', nextTool: 'machinal_prepare_video', error: 'Load video production guidance, including cinema, into the next model context before this action. Do not batch preparation and production in one model turn. No action was executed; no paid job was submitted.' }) };
            if (name !== 'compile_scene') return execute(input, context);
            const { customSceneReason, ...sourceInput } = input;
            if (!input.sourceFile && !input.templateId && hasSceneCandidates(context.sessionID) && !customSceneReason?.trim())
              throw new Error('Matching library candidates were returned in this session. Use templateId + templateEdits for a fitting beat, or supply customSceneReason explaining why this beat needs custom source. No compilation started; do not ask the user.');
            const { componentFile, ...args } = await resolveTemplateCompile(sourceInput, library);
            if ((componentFile === undefined) === (args.component === undefined)) throw new Error('Supply exactly one of component (complete Svelte source) or componentFile (absolute .svelte path). No compilation started.');
            if (componentFile !== undefined) {
              if (typeof componentFile !== 'string' || !isAbsolute(componentFile) || !/\.svelte$/i.test(componentFile)) throw new Error('Use an absolute client-local .svelte path for componentFile.');
              await filePermission(ctx, context, 'read', componentFile);
              const canonical = await realpath(componentFile);
              if (canonical !== componentFile) await filePermission(ctx, context, 'read', canonical);
              args.component = await readBoundedUTF8(componentFile, context.signal, maxComponentBytes, 'Svelte source');
            }
            if (typeof args.component !== 'string' || !args.component.trim() || Buffer.byteLength(args.component) > maxComponentBytes) throw new Error('Svelte source must contain 1–64000 UTF-8 bytes and must not be blank. No compilation started.');
            return scheduler.run('scene', () => execute(args, context), context.signal);
          };
        });
      }
    }
  });
  await ctx.session.hook('context', event => {
    event.system.push({ type: 'text', text: `machinal startup: the CURRENT agent understands video intent in any language. Call machinal_prepare_video before creating/editing video, not MCP/code debugging. Do not match keywords or use another classifier. Preparation loads editing/cinema only and grants no media/spending permission. ${briefAndComponents} Read/cache stage-specific guides and the exact chosen film-style source as needed. Resume saved recipes/jobs/assets after interruption; never submit duplicate paid work.` });
    const state = prepared.get(event.sessionID);
    for (const skill of state?.skills ?? []) {
      event.system.push({ type: 'text', text: `<skill_content name="${skill.id}">\n${skill.content}\n\nSkill source: ${skill.path ?? 'installed skill registry'}\n</skill_content>` });
    }
    if (state) state.contextLoaded = true;
  });
}
