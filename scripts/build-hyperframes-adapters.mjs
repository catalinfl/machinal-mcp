import { readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../packages/mcp-installer/library/', import.meta.url));
const skills = [
  ['hyperframes', 'Hyperframes component library', 'Use Hyperframes components, blocks, examples and skills alongside Cinema; adapt original HTML/GSAP to editable Machinal Svelte/SceneThree scenes.', 'Choose a relevant concrete component rather than inventing its construction. Combine the selected Cinema style with that component, then port its hierarchy and motion.'],
  ['hyperframes-registry', 'Hyperframes registry', 'Discover reusable Hyperframes effects, charts, titles, UI scenes, captions and transitions in the complete bundled source catalog.', 'Search hyperframes-components by subject/effect; fetch the descriptor and actual HTML/CSS/JS using its file IDs. Read variable, slot, dependency and timing contracts before adapting.'],
  ['hyperframes-cli', 'Hyperframes workflow translation', 'Translate Hyperframes authoring, lint, preview and render concepts to the existing Machinal MCP tools without installing another engine.', 'Translate init to an owned Machinal project, check to scene compilation and exact YAML preflight, preview to authorized scene inspection and render to render_video. Do not run the upstream CLI, beacon, bootstrap or renderer.'],
  ['media-use', 'Hyperframes media adaptation', 'Adapt Hyperframes media and licence guidance to approved Machinal images, footage, models and audio without activating HeyGen accounts or providers.', 'Use machinal-media and machinal-sound for actual sourcing/imports. Read original CREDITS.md and excluded-media inventory. Search approval is not named-source use permission; never fetch demo assets automatically.'],
  ['reverse-any-video', 'Reference-video decomposition', 'Decompose an explicitly approved reference video into shots, spatial hierarchy and measured motion, then implement the result in Machinal.', 'Obtain permission for the exact reference and inspect actual frames with supported tools. Record observed timing separately from guesses. Reuse verified structure, not unlicensed media, invented pixel observations or copied dialogue.'],
  ['style-sampling', 'Reference style sampling', 'Sample approved reference palette, typography, materials, camera and rhythm, pairing Hyperframes construction references with Cinema direction.', 'Separate factual reference observations from proposed interpretation. Apply the visual language to the actual subject; do not merely recolor a generic demo or override an explicit minimal/no-generation brief.'],
  ['slideshow', 'Hyperframes slideshow adaptation', 'Build an approved image-led sequence with measured timing, readable holds and deliberate handoffs in the existing Machinal timeline.', 'Use real approved filenames and YAML image tracks; animate through scenes only when in scope. Preserve aspect/crop, hold time and requested silence. Do not silently add music or turn an animation request into a slideshow.'],
  ['remotion-to-hyperframes', 'Video-component migration to Machinal', 'Adapt supplied Remotion or Hyperframes source concepts directly to native Machinal Svelte/SceneThree without adding a competing render engine.', 'Inspect the supplied source and its licence; decompose frame functions, assets, parameters, geometry and sequencing. Port directly to the deployed scene runtime. Report unsupported dependencies instead of silently replacing them.'],
  ['figma', 'Design-export adaptation', 'Translate approved supplied Figma/design exports into editable native scenes, respecting layer hierarchy, artwork and the Machinal runtime.', 'Work from explicitly approved supplied exports/design data. Keep layers and typography editable, use attached artwork where needed and map motion to absolute frame time. No Figma account access, API integration or unsupported import tool is installed.'],
];

const templates = [
  {
    slug: 'count-up', label: 'Hyperframes: count up / statistică',
    description: 'Native deterministic statistic counter adapted from Hyperframes count-up; eased values and a restrained landing pulse.',
    parameters: ['start', 'end', 'prefix', 'suffix', 'accent', 'label'],
    images: [], when: 'A verified supplied number is the subject, not a substitute for an illustrative scene.',
    avoid: 'Unverified claims, invented statistics or copy too long for a single numeric lockup.',
    reveal: '0–0.13: the counter arrives.', action: '0.08–0.55: eased interpolation and landing pulse.', hold: '0.65–0.94: exact final number remains readable.', exit: '0.94–1: hold the number for a cut.',
  },
  {
    slug: 'before-after-wipe', label: 'Hyperframes: before/after wipe',
    description: 'Native image-backed comparison adapted from Hyperframes before-after-wipe; one mask owns the reveal and divider.',
    parameters: ['before', 'after', 'accent', 'revealStart', 'revealEnd'],
    images: [{ id: 'image_1', role: 'Approved before state.' }, { id: 'image_2', role: 'Approved after state with matching framing.' }],
    when: 'Two approved, aligned states demonstrate an actual transformation.',
    avoid: 'Mismatched viewpoints, absent image permissions or misleading before/after evidence.',
    reveal: '0–0.20: before state holds.', action: '0.20–0.62: after image wipes over the before state.', hold: '0.62–0.94: after state stays fully visible.', exit: '0.94–1: matched cut, no additional fade.',
  },
  {
    slug: 'chat-thread', label: 'Hyperframes: chat thread',
    description: 'Native sequential conversation adapted from Hyperframes chat-thread; independent bubble arrivals and a readable final hold.',
    parameters: ['messages', 'accent', 'stagger'],
    images: [], when: 'Up to three short supplied messages are the visible subject.',
    avoid: 'Invented quotations, long messages, private conversation without approval or treating dialogue as captions.',
    reveal: '0.08–0.24: first bubble arrives.', action: '0.26–0.60: independent alternating message arrivals.', hold: '0.60–0.94: complete thread stays readable.', exit: '0.94–1: all messages remain for a cut.',
  },
];

export async function buildHyperframesAdapters() {
  const skillEntries = [];
  for (const [name, label, description, task] of skills) {
    const id = name === 'hyperframes' ? 'machinal-hyperframes' : `machinal-hyperframes-${name.replace(/^hyperframes-/, '')}`;
    const content = `---\nname: ${id}\ndescription: ${description}\n---\n\n# ${label}\n\n${task}\n\n${id === 'machinal-hyperframes' ? 'Read' : 'Load `machinal-hyperframes` and read'} \`get_editing_reference(topic: hyperframes-components)\` for the adaptation guide. Offline guide: ${id === 'machinal-hyperframes' ? 'references/workflow.md' : '../machinal-hyperframes/references/workflow.md'}. Original skill: \`get_editing_reference(topic: hyperframes-skills, id: published-${name})\`; supporting files are available via the returned file IDs and \`get_hyperframes_source\`.\n\nFor an incomplete new-video brief use machinal-editing and the native question tool, not a numbered chat questionnaire. Ask only missing requirements and permissions; a cancelled form grants none. With a complete brief or answered form, proceed immediately within actual authorization without a separate plan confirmation.\n\nThe CURRENT client inspects the original source and writes/repairs the Svelte/SceneThree port. Use the deployed scene-runtime, production contract, \`compile_scene\`, exact YAML preflight and authorized server rendering. Keep Cinema for visual direction. Native starting points: \`hyperframes-count-up\`, \`hyperframes-before-after-wipe\`, \`hyperframes-chat-thread\` under scene-templates. The rest of the source catalog requires porting, not direct HTML execution.\n\nUpstream source is reference-only. Never execute upstream scripts, telemetry, CLI/bootstrap, installers, local rendering, release/deploy instructions, provider/account setup or media downloads. Do not inject HTML, external GSAP/CDN dependencies or global styles into the application. Preserve ALL existing captions verbatim (text/whitespace, grouping, IDs, timing, layout and effects), successful media and audio. Narration, music, sound effects and captions are distinct choices; no upstream default authorizes them or any spending. Compilation is not visual/audio approval.\n\nPreserve original Apache-2.0 licence, copyright and third-party notices from \`machinal-hyperframes/references/hyperframes-library/\` in distributed source. Review GSAP/font/media terms separately. These adapted instructions are Machinal modifications, not original Hyperframes instructions; no on-screen attribution/watermark is added.\n`;
    const nativeContent = content
      .replace('The CURRENT client inspects the original source and writes/repairs the Svelte/SceneThree port.', 'The CURRENT client selects the native Svelte/SceneThree component returned by its exact catalog ID, inspects its source and customizes the port.')
      .replace('Native starting points: `hyperframes-count-up`, `hyperframes-before-after-wipe`, `hyperframes-chat-thread` under scene-templates. The rest of the source catalog requires porting, not direct HTML execution.', 'Native ports are linked through nativeTemplateId in each exact catalog entry; pending entries must not be represented as completed Svelte ports.');
    await writeFile(join(root, 'animation-skills', `${id}.md`), nativeContent);
    skillEntries.push({ id, version: '1', label, description, templates: templates.map(template => `hyperframes-components-${template.slug}`) });
  }
  const skillPath = join(root, 'animation-skills.json');
  const previousSkills = JSON.parse(await readFile(skillPath, 'utf8'));
  await writeFile(skillPath, `${JSON.stringify([...previousSkills.filter(skill => !skill.id.startsWith('machinal-hyperframes')), ...skillEntries], null, 2)}\n`);
  return { skills: skillEntries.length, nativeTemplateReferences: templates.length };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await buildHyperframesAdapters());
