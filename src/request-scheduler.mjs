export const requestLimits = Object.freeze({ read: 8, wait: 8, work: 4, control: 2, scene: 2, inspect: 1 });
const maxQueuedPerClass = 16;

export function requestClass(method, params, tools = []) {
  if (['tools/list', 'resources/list', 'resources/templates/list', 'resources/read', 'prompts/list', 'prompts/get'].includes(method)) return 'read';
  if (method !== 'tools/call' || params?.name === 'connection_status') return 'control';
  if (params.name === 'compile_scene') return 'scene';
  if (params.name === 'inspect_scene') return 'inspect';
  if (params?.name === 'wait_for_job' || params?.name === 'get_job' && params.arguments?.waitSeconds > 0) return 'wait';
  return tools.find(tool => tool.name === params?.name)?.annotations?.readOnlyHint === true ? 'read' : 'work';
}

// Waiting for a slot never resubmits an operation; cancellation removes queued work.
export class RequestScheduler {
  constructor(limits = requestLimits) {
    this.lanes = new Map(Object.entries(limits).map(([name, limit]) => [name, { limit, active: 0, queue: [] }]));
  }

  async run(kind, operation, signal) {
    const lane = this.lanes.get(kind);
    if (!lane) throw new Error('Unknown request class');
    signal?.throwIfAborted();
    if (lane.active >= lane.limit) {
      if (lane.queue.length >= maxQueuedPerClass) {
        throw Object.assign(new Error('Request queue is full'), { rpcCode: -32000, retryAfter: 1, submissionState: 'not-submitted' });
      }
      await new Promise((resolve, reject) => {
        const entry = { resolve: () => { signal?.removeEventListener('abort', abort); resolve(); } };
        const abort = () => {
          const index = lane.queue.indexOf(entry);
          if (index >= 0) lane.queue.splice(index, 1);
          reject(signal.reason);
        };
        lane.queue.push(entry);
        signal?.addEventListener('abort', abort, { once: true });
      });
    } else lane.active++;
    try {
      signal?.throwIfAborted();
      return await operation();
    } finally {
      const next = lane.queue.shift();
      if (next) next.resolve();
      else lane.active--;
    }
  }
}
