import { SceneLibrary, LIBRARY_TOOLS, LIBRARY_TOPICS, LIBRARY_INSTRUCTIONS } from './scene-library.mjs';

const discovered = new Map();
export function hasSceneCandidates(sessionID) { return discovered.has(sessionID); }
export function clearSceneCandidates(sessionID) { discovered.delete(sessionID); }
function recordDiscovery(sessionID, data) {
  if (!sessionID || data?.topic !== 'component-discovery' || !data.entries?.length) return;
  discovered.set(sessionID, true);
  if (discovered.size > 128) discovered.delete(discovered.keys().next().value);
}

export async function installSceneLibrary(ctx, servers = []) {
  const library = new SceneLibrary();
  const names = [...servers];
  await ctx.tool.transform(editor => {
    for (const server of names) {
      editor.update(`${server}_get_editing_reference`.replace(/[^a-z\d_-]/gi, '_'), tool => {
        const original = tool.execute;
        const topic = tool.input?.properties?.topic;
        if (topic?.enum) topic.enum = [...new Set([...topic.enum, ...LIBRARY_TOPICS])];
        if (tool.input?.properties) {
          const { role, profiles, aspect } = LIBRARY_TOOLS[0].inputSchema.properties;
          Object.assign(tool.input.properties, { role, profiles, aspect });
        }
        tool.execute = async (input, context) => {
          if (!library.handles('get_editing_reference', input)) return original(input, context);
          const result = await library.call('get_editing_reference', input);
          recordDiscovery(context?.sessionID, result.structuredContent.data);
          return { content: JSON.stringify(result.structuredContent), output: result.structuredContent, ...(result.isError ? { isError: true } : {}) };
        };
      });
    }
    for (const [index, name] of ['machinal_library', 'machinal_hyperframes_source'].entries()) {
      const tool = LIBRARY_TOOLS[index];
      editor.add({
        name, description: tool.description, input: tool.inputSchema, options: { codemode: false },
        async execute(input, context) {
          const result = await library.call(tool.name, input);
          recordDiscovery(context?.sessionID, result.structuredContent.data);
          return { content: JSON.stringify(result.structuredContent), ...(result.isError ? { isError: true } : {}) };
        },
      });
    }
  });
  await ctx.session.hook('context', event => {
    event.system.push({ type: 'text', text: LIBRARY_INSTRUCTIONS
      + ' In OpenCode use machinal_library for all authoring guides, skills, cinema, profiles and templates, and machinal_hyperframes_source for original file reads. If those native tools are not registered, use get_library_reference/get_hyperframes_source on the installed stdio adapter; this is not a credential error. get_editing_reference is routed locally for authoring topics; scene-runtime, schema, credits and execution remain live service contracts. These native local tools remain available when the remote MCP is disconnected.' });
  });
}
