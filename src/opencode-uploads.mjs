import { filePermission } from './opencode-recipes.mjs';
import { projectAPI } from './opencode-media.mjs';
import { inspectUpload, MAX_UPLOAD_BYTES, uploadFile, validateUpload } from './upload.mjs';
import { requestTransfer, TransferError } from './transfer-http.mjs';

function failure(error, files, pending, signal) {
  const message = error instanceof TransferError ? error.message : signal?.aborted
    ? 'Upload cancelled or timed out. Do not automatically retry; recover any attempted remote filename first.'
    : 'Upload failed. Check file access, server storage limits and network. Do not automatically retry; recover any attempted remote filename first.';
  return { content: JSON.stringify({ status: files.length ? 'partial' : 'failed', files, ...(pending ? { pending } : {}), error: message }) };
}

export async function installOpenCodeUploads(ctx, { getConnection, signal: lifetime, request = requestTransfer } = {}) {
  await ctx.tool.transform(editor => {
    editor.add({
      name: 'machinal_upload',
      description: 'Upload 1–100 explicitly approved client-local media files into an owned project on the configured machinal server. Uses in-memory authentication and native streaming, not PowerShell/curl or S3. Originals remain read-only. Pass exact absolute file paths, projectId and userApproved; never pass a key or URL. Uses host upload/read permissions, refuses redirects and never retries uncertain transfers. Returns actual project filenames, bytes and transmitted SHA-256; no generation/render spending. For a Windows folder on your computer use this tool, not list_local_media (which accesses server-mounted roots).',
      input: { type: 'object', additionalProperties: false, required: ['projectId', 'files', 'userApproved'], properties: {
        projectId: { type: 'string' },
        files: { type: 'array', minItems: 1, maxItems: 100, items: { type: 'string' }, description: 'Exact approved absolute client-local media paths; no recursive folders or globs.' },
        server: { type: 'string', description: 'Approved MCP registration; required when multiple servers are configured.' },
        userApproved: { type: 'boolean', description: 'True only after explicit permission to read/upload these named sources to this project. Does not authorize generation or rendering.' },
      } },
      options: { codemode: false },
      async execute(input, context) {
        try { validateUpload(input); } catch (error) { return failure(error, []); }
        await ctx.permission.assert({ sessionID: context.sessionID, agent: context.agent,
          source: { type: 'tool', messageID: context.messageID, id: context.id },
          action: 'machinal_upload', resources: [`${input.server ?? 'machinal'}/${input.projectId}`], save: [],
        });
        for (const path of input.files) await filePermission(ctx, context, 'read', path);
        const signal = AbortSignal.any([context.signal, lifetime, AbortSignal.timeout(10 * 60 * 1000)].filter(Boolean));
        const files = [];
        let pending;
        try {
          signal.throwIfAborted();
          const sources = [];
          let total = 0;
          for (const path of input.files) {
            const source = await inspectUpload(path);
            total += source.info.size;
            if (total > MAX_UPLOAD_BYTES) throw new TransferError('The selected upload batch exceeds 2 GiB. Select a smaller explicitly approved batch.');
            sources.push(source);
          }
          const connection = await getConnection(input.server);
          await projectAPI(connection, signal, request)(`/v1/projects/${input.projectId}`);
          for (const source of sources) {
            signal.throwIfAborted();
            pending = { path: source.path, file: source.file, storage: 'volume', status: 'unknown' };
            await context.progress({ status: 'Uploading', filename: source.file, completedFiles: files.length, totalFiles: sources.length });
            files.push(await uploadFile(source, { connection, projectId: input.projectId, signal, progress: context.progress, request }));
            pending = undefined;
          }
          return { content: JSON.stringify({ status: 'completed', projectId: input.projectId, files, storage: 'volume', uploadsToS3: false, originalsReadOnly: true }) };
        } catch (error) { return failure(error, files, pending, signal); }
      },
    });
  });
}
