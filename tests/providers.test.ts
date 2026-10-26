import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AudioProvider, shouldComment, parseModelActions, generateActions } from '../server/providers.ts';
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

test('Fish uses official endpoint, model header, voice reference and MP3; caches response', async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fish-test-'));let calls=0;
 const mock:typeof fetch=async(url,init)=>{calls++;assert.equal(url,'https://api.fish.audio/v1/tts');assert.equal((init!.headers as any).model,'s2.1-pro');assert.equal((init!.headers as any).Authorization,'Bearer secret');assert.deepEqual(JSON.parse(String(init!.body)),{text:'Olá, pessoal!',format:'mp3',reference_id:'licensed-voice'});return new Response(new Uint8Array([73,68,51,1]),{headers:{'content-type':'audio/mpeg'}})};
 try{const p=new AudioProvider(dir,{TTS_PROVIDER:'fish',FISH_API_KEY:'secret',FISH_REFERENCE_ID:'licensed-voice'},mock);await p.synthesize('Olá, pessoal!','homer');await p.synthesize('Olá, pessoal!','homer');assert.equal(calls,1)}finally{await rm(dir,{recursive:true,force:true})}
});
test('Fish missing credentials and HTTP failures remain recoverable and never cached',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fish-errors-'));
 try{await assert.rejects(new AudioProvider(dir,{TTS_PROVIDER:'fish',OPENAI_API_KEY:'unrelated'}).synthesize('Olá','homer'),/não configurado/);
 for(const status of [401,429,500]){const p=new AudioProvider(dir,{TTS_PROVIDER:'fish',FISH_API_KEY:'secret'},async()=>new Response('secret',{status}));await assert.rejects(p.synthesize('Olá','homer'),new RegExp(`HTTP ${status}`));assert.equal((await p.stats()).files,0)}}finally{await rm(dir,{recursive:true,force:true})}
});
test('AI receives recent memory and Brazilian conversational instructions',async()=>{
 const state=createInitialState();state.memory=['Homer conversou sobre futebol.'];
 await generateActions(state,'E o jogo?',{AI_API_KEY:'secret'},async(_url,init)=>{const body=JSON.parse(String(init!.body));assert.match(body.messages[0].content,/português brasileiro/);assert.match(body.messages[1].content,/futebol/);assert.match(body.messages[0].content,/priorize respostas corretas/);assert.match(body.messages[0].content,/Duff/);assert.match(body.messages[0].content,/sem narrar gestos/);assert.equal(body.messages[2].content,'E o jogo?');return Response.json({choices:[{message:{content:'{"actions":[{"type":"TALK","character":"homer","text":"Que jogo!"}]}'}}]})});

});
test('Idle commentary respects quiet interval, manual/semi, pause and disabled Homer',()=>{
 const s=createInitialState();s.settings.provider='openai-compatible';s.settings.mode='auto';s.settings.aiEnabled=true;
 assert.equal(shouldComment(s,130000,0,0),true);assert.equal(shouldComment(s,119000,0,0),false);assert.equal(shouldComment(s,130000,100000,0),false);
 for(const mode of ['manual','semi'] as const){s.settings.mode=mode;assert.equal(shouldComment(s,130000,0,0),false)}s.settings.mode='auto';s.paused=true;assert.equal(shouldComment(s,130000,0,0),false);s.paused=false;s.characters.homer.enabled=false;assert.equal(shouldComment(s,130000,0,0),false);
});
