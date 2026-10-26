import {tick} from '../shared/engine';
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocket } from 'ws';
import { createServer, type ServerOptions } from '../server/index.ts';

async function fixture(options: ServerOptions = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'homer-http-'));
  const server = createServer({ dataDir: dir, env: {}, tickInterval: 0, log: () => {}, ...options });
  const { url, port } = await server.start(0);
  return { server, url, port, close: async () => { await server.close(); await rm(dir, { recursive: true, force: true }); } };
}
const post = (url: string, action: unknown, headers: Record<string,string> = {}) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(action) });
async function waitUntil(predicate: () => boolean, timeout = 2000) { const end = Date.now() + timeout; while (!predicate()) { if (Date.now() >= end) throw new Error('Timed out waiting for runtime state'); await delay(10); } }

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

test('Vite port 5173 origin works for HTTP and cookie-authenticated WebSocket; foreign origins do not', async () => {
  const f = await fixture({ env: { ADMIN_TOKEN: 'vite-token' } }); let ws: WebSocket | undefined;
  try {
    const session = await post(`${f.url}/api/session`, { token: 'vite-token' }, { Origin: 'http://localhost:5173' });
    assert.equal(session.status, 200);
    const cookie = session.headers.get('set-cookie')!.split(';')[0];
    const response = await post(`${f.url}/api/action`, { type: 'SET_TIME', hour: 19 }, { Origin: 'http://localhost:5173', Cookie: cookie });
    assert.equal(response.status, 200);
    ws = new WebSocket(`ws://127.0.0.1:${f.port}/ws`, { headers: { Origin: 'http://localhost:5173', Cookie: cookie } });
    const [snapshot] = await once(ws, 'message'); assert.equal(JSON.parse(snapshot.toString()).state.virtualHour, 19);
    assert.equal((await post(`${f.url}/api/action`, { type: 'SET_TIME', hour: 1 }, { Origin: 'http://localhost:9999', Cookie: cookie })).status, 403);
  } finally { ws?.terminate(); await f.close(); }
});

test('HTTP and WebSocket expose opaque game ids without answer-bank indexes or voter hashes', async () => {
  const f = await fixture(); let ws: WebSocket | undefined;
  try {
    await post(`${f.url}/api/action`, { type: 'START_GAME', game: 'hangman' });
    const first = await (await fetch(`${f.url}/api/state`)).json();
    assert.notEqual(first.game.id, f.server.state.game!.id); assert.ok(!first.game.id.includes(':'));
    assert.equal((await (await fetch(`${f.url}/api/state`)).json()).game.id, first.game.id);
    ws = new WebSocket(`ws://127.0.0.1:${f.port}/ws`);
    const [snapshot] = await once(ws, 'message'); assert.equal(JSON.parse(snapshot.toString()).state.game.id, first.game.id);
    await post(`${f.url}/api/action`, { type: 'STOP_GAME' });
    await post(`${f.url}/api/action`, { type: 'START_GAME', game: 'poll' });
    await post(`${f.url}/api/action`, { type: 'GAME_INPUT', value: 'A', user: 'viewer' });
    const poll = await (await fetch(`${f.url}/api/state`)).json();
    assert.deepEqual(poll.game.guesses, []); assert.equal(poll.game.votes['0'], 1); assert.equal(f.server.state.game!.guesses.length, 1);
  } finally { ws?.terminate(); await f.close(); }
});

test('Automatic external AI never runs in manual mode and discards responses after operator mode/provider/AI changes', async () => {
  for (const settings of [{ mode: 'manual' }, { aiEnabled: false }, { provider: 'demo' }]) {
    let release!: (response: Response) => void; let calls = 0;
    const fetchImpl: typeof fetch = async () => { calls++; return new Promise(resolve => { release = resolve; }); };
    const f = await fixture({ env: { AI_API_KEY: 'private' }, fetchImpl, tickInterval: 10 });
    try {
      await post(`${f.url}/api/action`, { type: 'SETTINGS', settings: { provider: 'openai-compatible', mode: 'manual' } });
      await post(`${f.url}/api/action`, { type: 'CHAT', user: 'viewer', text: 'Olá, Homer!' });
      await post(`${f.url}/api/action`, { type: 'SELECT_CHAT', messageId: f.server.state.chat[0].id });
      await delay(40); assert.equal(calls, 0);
      await post(`${f.url}/api/action`, { type: 'SETTINGS', settings: { mode: 'auto' } });
      await waitUntil(() => calls === 1);
      await post(`${f.url}/api/action`, { type: 'SETTINGS', settings });
      release(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ actions: [{ type: 'TALK', character: 'homer', text: 'Resposta externa obsoleta.' }] }) } }] })));
      await waitUntil(() => f.server.state.logs.some(log => log.message.startsWith('Resposta descartada:')));
      assert.ok(!f.server.state.speechQueue.some(speech => speech.text === 'Resposta externa obsoleta.'));
      assert.notEqual(f.server.state.speaking?.text, 'Resposta externa obsoleta.');
    } finally { await f.close(); }
  }
});

test('Shutdown aborts an in-flight provider request and prevents late state mutation', async () => {
  let providerSignal: AbortSignal | undefined;
  const fetchImpl: typeof fetch = async (_url, options) => new Promise((_resolve, reject) => { providerSignal = options!.signal!; providerSignal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }); });
  const f = await fixture({ env: { AI_API_KEY: 'private' }, fetchImpl });
  try {
    await post(`${f.url}/api/action`, { type: 'SETTINGS', settings: { provider: 'openai-compatible' } });
    const pending = post(`${f.url}/api/ai/respond`, {});
    await waitUntil(() => !!providerSignal);
    await f.server.close();
    assert.equal(providerSignal!.aborted, true); assert.equal((await pending).status, 502); assert.equal(f.server.state.speechQueue.length, 0);
  } finally { await f.close(); }
});

test('TikTok routes authenticate, accept offline demo and require explicit end confirmation', async () => {
 const f=await fixture({env:{ADMIN_TOKEN:'test-token'}}),headers={Authorization:'Bearer test-token'};
 try {
  assert.equal((await post(`${f.url}/api/tiktok/demo`,{kind:'gift',user:'visitor',gift:'heart'})).status,401);
  assert.equal((await post(`${f.url}/api/tiktok/connect`,{},headers)).status,503);
  assert.equal((await post(`${f.url}/api/tiktok/demo`,{kind:'chat',user:'visitor',text:'Olá Homer'},headers)).status,200);
  assert.equal(f.server.state.chat.at(-1)?.selected,true);
  const event=await (await post(`${f.url}/api/tiktok/demo`,{kind:'gift',user:'visitor',gift:'heart'},headers)).json();
  assert.equal(f.server.state.paused,false);
  assert.equal((await post(`${f.url}/api/tiktok/confirm-end`,{id:'wrong'},headers)).status,409);
  assert.equal((await post(`${f.url}/api/tiktok/confirm-end`,{id:event.pendingEnd.id},headers)).status,200);
  assert.equal(f.server.state.paused,true);
 } finally {await f.close();}
});

test('An in-flight idle remark yields to a donut gift before queuing voice',async()=>{
 let finish:((r:Response)=>void)|undefined;const realNow=Date.now;
 let f:Awaited<ReturnType<typeof fixture>>;
 // Age only server startup; live timers and the actual request use the real clock.
 Date.now=()=>realNow()-300000;
 try{f=await fixture({tickInterval:10,env:{AI_API_KEY:'test-only'},fetchImpl:async()=>new Promise<Response>(resolve=>{finish=resolve})});}finally{Date.now=realNow;}
 try{
  Object.assign(f.server.state.settings,{mode:'auto',provider:'openai-compatible',eventsEnabled:false,familyEnabled:false});
  await waitUntil(()=>!!finish);
  assert.equal((await post(`${f.url}/api/action`,{type:'INTERACT_WITH_OBJECT',object:'donut'})).status,200);
  finish!(Response.json({choices:[{message:{content:JSON.stringify({actions:[{type:'TALK',character:'homer',text:'Comentário que deve ceder prioridade.'}]})}}]}));
  await waitUntil(()=>f.server.state.logs.some(l=>l.message.includes('uma interação recebeu prioridade')));
  assert.ok(f.server.state.interaction);assert.equal(f.server.state.speechQueue.length,0);assert.equal(f.server.state.speaking,null);
 }finally{await f.close();}
});

test('Playback lease keeps speech alive through TTS generation and releases on end',async()=>{const f=await fixture();try{await post(`${f.url}/api/action`,{type:'TALK',character:'homer',text:'Olá!'});tick(f.server.state,Date.now(),0);const speech=f.server.state.speaking!;assert.ok(speech);const original=speech.duration;assert.equal((await post(`${f.url}/api/playback`,{speechId:speech.id,active:true})).status,200);assert.ok(speech.duration>=10000&&speech.duration>original);await post(`${f.url}/api/playback`,{speechId:'wrong',active:false});assert.ok(speech.duration>=10000);await post(`${f.url}/api/playback`,{speechId:speech.id,active:false});tick(f.server.state,Date.now()+1,0);assert.equal(f.server.state.speaking,null);}finally{await f.close();}});
