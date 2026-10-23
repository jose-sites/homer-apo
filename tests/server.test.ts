import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { WebSocket } from 'ws';
import { createServer, type ServerOptions } from '../server/index.ts';

async function fixture(options: ServerOptions = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'homer-http-'));
  const server = createServer({ dataDir: dir, env: {}, tickInterval: 0, log: () => {}, ...options });
  const { url, port } = await server.start(0);
  return { server, url, port, close: async () => { await server.close(); await rm(dir, { recursive: true, force: true }); } };
}
const post = (url: string, action: unknown, headers: Record<string,string> = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(action) });

test('HTTP returns authoritative state and applies only validated actions', async () => {
  const f = await fixture();
  try {
    const health = await (await fetch(`${f.url}/api/health`)).json();
    assert.equal(health.providers.ai.configured, false); assert.equal(health.providers.chat.connected, false);
    assert.equal((await post(`${f.url}/api/action`, { type: 'TALK', character: 'homer', text: 'Olá, chat!' })).status, 200);
    assert.equal((await post(`${f.url}/api/action`, { type: 'EXEC', command: 'rm -rf /' })).status, 400);
    const state = await (await fetch(`${f.url}/api/state`)).json(); assert.equal(state.speechQueue.length, 1);
    assert.equal((await post(`${f.url}/api/action`, { type: 'PAUSE', paused: true }, { Origin: 'https://malicious.example' })).status, 403);
    const diag = await (await fetch(`${f.url}/api/diagnostics`)).json(); assert.equal(diag.database.engine, 'SQLite'); assert.ok(diag.processMemoryMB > 0);
  } finally { await f.close(); }
});

test('WebSocket reconnect receives latest snapshot; socket writes are rejected', async () => {
  const f = await fixture(); let first: WebSocket | undefined; let second: WebSocket | undefined;
  try {
    first = new WebSocket(`ws://127.0.0.1:${f.port}/ws`);
    const [initial] = await once(first, 'message'); assert.equal(JSON.parse(initial.toString()).state.paused, false);
    first.close(); await once(first, 'close');
    await post(`${f.url}/api/action`, { type: 'PAUSE', paused: true });
    second = new WebSocket(`ws://127.0.0.1:${f.port}/ws`);
    const [reconnected] = await once(second, 'message'); assert.equal(JSON.parse(reconnected.toString()).state.paused, true);
    second.send(JSON.stringify({ type: 'PAUSE', paused: false }));
    const [code] = await once(second, 'close'); assert.equal(code, 1008); assert.equal(f.server.state.paused, true);
  } finally { first?.terminate(); second?.terminate(); await f.close(); }
});

test('Optional token protects HTTP and establishes cookie authentication for WebSocket', async () => {
  const f = await fixture({ env: { ADMIN_TOKEN: 'test-secret-value' } }); let ws: WebSocket | undefined;
  try {
    assert.equal((await fetch(`${f.url}/api/state`)).status, 401);
    assert.equal((await fetch(`${f.url}/api/state`, { headers: { Authorization: 'Bearer test-secret-value' } })).status, 200);
    assert.equal((await post(`${f.url}/api/session`, { token: 'wrong' })).status, 401);
    const response = await post(`${f.url}/api/session`, { token: 'test-secret-value' }); assert.equal(response.status, 200);
    const cookie = response.headers.get('set-cookie')!.split(';')[0]; assert.ok(response.headers.get('set-cookie')!.includes('HttpOnly'));
    ws = new WebSocket(`ws://127.0.0.1:${f.port}/ws`, { headers: { Cookie: cookie } });
    const [data] = await once(ws, 'message'); assert.equal(JSON.parse(data.toString()).type, 'state');
  } finally { ws?.terminate(); await f.close(); }
});

test('Missing TTS configuration gives explicit 503; local AI is labeled demo', async () => {
  const f = await fixture();
  try {
    const missing = await post(`${f.url}/api/tts`, { character: 'homer', text: 'Olá!' }); assert.equal(missing.status, 503);
    assert.match((await missing.json()).error, /não configurado/);
    const ai = await post(`${f.url}/api/ai/respond`, {}); assert.equal(ai.status, 200); assert.equal((await ai.json()).source, 'demo');
    assert.equal(f.server.state.speechQueue.length, 1);
  } finally { await f.close(); }
});

test('Clear memory also erases historical dialogue instead of repopulating it on the next save', async () => {
  const f = await fixture();
  try {
    await post(`${f.url}/api/action`, { type: 'TALK', character: 'homer', text: 'Uma conversa antiga.' });
    f.server.state.memory.push('Memória antiga.');
    f.server.database.save(f.server.state);
    assert.ok(f.server.database.recentEvents().some(e => e.message.includes('conversa antiga')));
    assert.equal((await post(`${f.url}/api/action`, { type: 'CLEAR_MEMORY' })).status, 200);
    assert.deepEqual(f.server.state.memory, []);
    assert.ok(!f.server.database.recentEvents().some(e => e.message.includes('conversa antiga')));
    assert.deepEqual((f.server.database.load() as {memory:string[]}).memory, []);
  } finally { await f.close(); }
});

test('Provider output cannot change settings or execute arbitrary commands', async () => {
  const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ actions: [{ type: 'SETTINGS', settings: { mode: 'auto' } }] }) } }] }), { status: 200 });
  const f = await fixture({ env: { AI_API_KEY: 'server-only' }, fetchImpl });
  try {
    await post(`${f.url}/api/action`, { type: 'SETTINGS', settings: { provider: 'openai-compatible' } });
    const response = await post(`${f.url}/api/ai/respond`, {}); assert.equal(response.status, 502);
    assert.equal(f.server.state.settings.mode, 'manual'); assert.equal(f.server.state.speechQueue.length, 0);
    assert.ok(!JSON.stringify(await (await fetch(`${f.url}/api/health`)).json()).includes('server-only'));
  } finally { await f.close(); }
});

test('Semiautomatic external AI becomes an operator proposal after validation', async () => {
  const fetchImpl: typeof fetch = async () => new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ actions: [{ type: 'TALK', character: 'homer', text: 'Uma resposta validada.' }] }) } }] }), { status: 200 });
  const f = await fixture({ env: { AI_API_KEY: 'server-only' }, fetchImpl });
  try {
    await post(`${f.url}/api/action`, { type: 'SETTINGS', settings: { provider: 'openai-compatible', mode: 'semi' } });
    assert.equal((await post(`${f.url}/api/ai/respond`, {})).status, 200);
    assert.equal(f.server.state.speechQueue.length, 0); assert.equal(f.server.state.proposals.length, 1);
    assert.equal((await post(`${f.url}/api/action`, { type: 'APPROVE_PROPOSAL', id: f.server.state.proposals[0].id })).status, 200);
    assert.equal(f.server.state.speechQueue.length, 1);
  } finally { await f.close(); }
});
