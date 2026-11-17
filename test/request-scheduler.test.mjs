import assert from 'node:assert/strict';
import test from 'node:test';
import { RequestScheduler, requestClass, requestLimits } from '../src/request-scheduler.mjs';

test('eight long job waits do not occupy the eight independent read slots', async () => {
  const scheduler = new RequestScheduler();
  const gate = Promise.withResolvers();
  let active = 0;
  const waits = Array.from({ length: requestLimits.wait }, () => scheduler.run('wait', async () => { active++; await gate.promise; }));
  assert.equal(active, 8);
  try {
    const reads = Array.from({ length: 8 }, (_, index) => scheduler.run('read', async () => index));
    assert.deepEqual(await Promise.all(reads), [0, 1, 2, 3, 4, 5, 6, 7]);
  } finally { gate.resolve(); await Promise.all(waits); }
});

test('bursts queue without replay, preserve lane limits, and cancelled queued work is never submitted', async () => {
  const scheduler = new RequestScheduler({ work: 2 });
  const gate = Promise.withResolvers();
  let calls = 0;
  const first = scheduler.run('work', async () => { calls++; await gate.promise; });
  const second = scheduler.run('work', async () => { calls++; await gate.promise; });
  const cancel = new AbortController();
  const cancelled = scheduler.run('work', () => assert.fail('cancelled request was submitted'), cancel.signal);
  const rejected = assert.rejects(cancelled, { name: 'AbortError' });
  cancel.abort();
  const third = scheduler.run('work', async () => { calls++; });
  assert.equal(calls, 2);
  gate.resolve();
  await Promise.all([first, second, third, rejected]);
  assert.equal(calls, 3);
  assert.equal(scheduler.lanes.get('work').active, 0);
});

test('queue overload is explicitly not-submitted, and failures release capacity without retry', async () => {
  const scheduler = new RequestScheduler({ work: 1 });
  const gate = Promise.withResolvers();
  const tasks = Array.from({ length: 17 }, () => scheduler.run('work', () => gate.promise));
  await assert.rejects(scheduler.run('work', () => assert.fail('overloaded request ran')), error => error.submissionState === 'not-submitted');
  gate.resolve();
  await Promise.all(tasks);
  let calls = 0;
  await assert.rejects(scheduler.run('work', () => { calls++; throw new Error('failure'); }), /failure/);
  await scheduler.run('work', () => { calls++; });
  assert.equal(calls, 2);
});

test('classification separates waits from read-only hints and treats unknown calls conservatively', () => {
  const tools = [{ name: 'wait_for_job', annotations: { readOnlyHint: true } }, { name: 'get_project', annotations: { readOnlyHint: true } }];
  assert.equal(requestClass('tools/call', { name: 'wait_for_job' }, tools), 'wait');
  assert.equal(requestClass('tools/call', { name: 'get_project' }, tools), 'read');
  assert.equal(requestClass('tools/call', { name: 'get_job', arguments: { waitSeconds: 25 } }, tools), 'wait');
  assert.equal(requestClass('tools/call', { name: 'render_video' }, tools), 'work');
  assert.equal(requestLimits[requestClass('tools/call', { name: 'compile_scene' }, tools)], 1);
  assert.equal(requestClass('ping'), 'control');
  assert.equal(requestClass('resources/read'), 'read');
});
