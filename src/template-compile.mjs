const maxSceneBytes = 64000;
const maxEdits = 32;

export const templateCompileHelp = 'For a matching installed component, pass templateId and optional templateEdits to compile the actual pinned Svelte with subject-specific copy, colors and framing. Read its exact source first. Each edit replaces one unique literal source fragment (include context). Keep the original motion, licence and notices. This is a source shortcut, not a recipe field.';

export function templateCompileSchema(schema) {
  return { ...schema, required: (schema.required ?? []).filter(key => key !== 'component'), properties: {
    ...schema.properties,
    templateId: { type: 'string', maxLength: 128, description: 'Exact installed scene-templates ID from component-discovery; replaces component.' },
    templateEdits: { type: 'array', maxItems: maxEdits, items: { type: 'object', required: ['from', 'to'], additionalProperties: false,
      properties: { from: { type: 'string', minLength: 1 }, to: { type: 'string' } } } },
  } };
}

export async function resolveTemplateCompile(input, library) {
  const { templateId, templateEdits, ...args } = input;
  if (templateId === undefined) {
    if (templateEdits !== undefined) throw new Error('templateEdits requires templateId.');
    return args;
  }
  if (input.component !== undefined || input.componentFile !== undefined || input.sourceFile !== undefined)
    throw new Error('Use templateId for a new scene instead of component, componentFile or sourceFile.');
  if (typeof templateId !== 'string' || !templateId || templateId.length > 128) throw new Error('Use an exact installed templateId.');
  const edits = templateEdits === undefined ? [] : templateEdits;
  if (!Array.isArray(edits) || edits.length > maxEdits) throw new Error(`Use at most ${maxEdits} templateEdits.`);
  let { component } = await library.template(templateId);
  for (const [index, edit] of edits.entries()) {
    if (typeof edit?.from !== 'string' || !edit.from || typeof edit.to !== 'string') throw new Error(`Invalid templateEdits[${index}].`);
    const start = component.indexOf(edit.from);
    if (start < 0 || component.lastIndexOf(edit.from) !== start) throw new Error(`templateEdits[${index}].from must match exactly once in ${templateId}; read its source and include surrounding context.`);
    component = component.slice(0, start) + edit.to + component.slice(start + edit.from.length);
    if (!component.trim() || Buffer.byteLength(component) > maxSceneBytes) throw new Error('Adapted template must contain 1–64000 UTF-8 bytes.');
  }
  return { ...args, component };
}
