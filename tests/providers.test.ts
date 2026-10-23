import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AudioProvider, parseModelActions, generateActions } from '../server/providers.ts';
import { createInitialState } from '../shared/engine.ts';

test('Provider parser rejects non-JSON, unknown actions and oversized action batches', () => {
  for (const content of ['exec("danger")', '{}', '{"actions":[{"type":"EXEC"}]}', JSON.stringify({ actions: Array(4).fill({ type: 'TALK' }) })]) assert.throws(() => parseModelActions(content));
  assert.equal(parseModelActions('{"actions":[{"type":"TALK","character":"homer","text":"Olá"}]}').length, 1);
});

test('External AI network failures are reported without treating them as successful dialogue', async () => {
  const mock: typeof fetch = async () => { throw new Error('network down'); };
  await assert.rejects(generateActions(createInitialState(), 'Olá', { AI_API_KEY: 'private' }, mock), /não respondeu/);
});

test('TTS caches audio, coalesces concurrent requests, and can clear its disk cache', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'homer-audio-')); let requests = 0;
  const mock: typeof fetch = async (_url, init) => { requests++; assert.match(String((init?.headers as Record<string,string>).Authorization), /^Bearer /); return new Response(new Uint8Array([73,68,51,1,2,3]), { status: 200, headers: { 'Content-Type': 'audio/mpeg' } }); };
  const provider = new AudioProvider(dir, { TTS_API_KEY: 'private' }, mock);
  try {
    const results = await Promise.all([provider.synthesize('Olá!', 'homer'), provider.synthesize('Olá!', 'homer')]);
    assert.deepEqual(results[0], results[1]); assert.equal(requests, 1);
    await provider.synthesize('Olá!', 'homer'); assert.equal(requests, 1);
    assert.equal((await provider.stats()).files, 1);
    await provider.clear(); assert.equal((await provider.stats()).files, 0);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
