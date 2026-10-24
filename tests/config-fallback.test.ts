import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {loadEnvironment,configurationWarnings,ttsOrder} from '../server/config.ts';
import {AudioProvider} from '../server/providers.ts';
const mp3=()=>new Response(new Uint8Array([73,68,51,1,2]),{headers:{'content-type':'audio/mpeg'}});
test('Environment precedence and safe warnings; Git excludes secrets but includes example',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'env-test-'));try{await writeFile(join(dir,'.env'),'AI_API_KEY=base\nTTS_PRIMARY=fish');await writeFile(join(dir,'.env.local'),'AI_API_KEY=local');assert.equal(loadEnvironment(dir,{}).AI_API_KEY,'local');assert.equal(loadEnvironment(dir,{AI_API_KEY:'process'}).AI_API_KEY,'process');assert.ok(configurationWarnings({TTS_PRIMARY:'invalid',TTS_SPEED:'NaN'}).length);assert.deepEqual(ttsOrder({TTS_PRIMARY:'fish',TTS_SECONDARY:'fish'}),['fish']);const ignored=execFileSync('git',['check-ignore','--no-index','.env','.env.local','secrets/key.json','credentials/token.json'],{encoding:'utf8'});assert.match(ignored,/.env.local/);assert.equal(execFileSync('git',['ls-files','.env.example'],{encoding:'utf8'}).trim(),'.env.example')}finally{await rm(dir,{recursive:true,force:true})}
});
for(const status of [401,429,503])test(`Fish HTTP ${status} falls back exactly once; cached secondary; bounded failure`,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fallback-'));const calls:string[]=[];const env={TTS_PRIMARY:'fish',TTS_SECONDARY:'openai',FISH_API_KEY:'secret',TTS_API_KEY:'other'};
 try{const p=new AudioProvider(dir,env,async(url)=>{calls.push(String(url));return String(url).includes('fish')?new Response('secret',{status}):mp3()});await Promise.all([p.synthesize('Oi','homer'),p.synthesize('Oi','homer')]);assert.equal(calls.length,2);await p.synthesize('Oi','homer');assert.equal(calls.filter(x=>x.includes('openai')).length,1);
 let failures=0;const q=new AudioProvider(join(dir,'fail'),env,async()=>{failures++;throw Error('private')});await assert.rejects(q.synthesize('Oi','homer'),/TTS indisponível/);assert.equal(failures,2);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Missing primary credentials skips network and uses secondary; primary success skips fallback',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fallback-'));try{let calls=0;const p=new AudioProvider(dir,{TTS_PRIMARY:'fish',TTS_SECONDARY:'openai',TTS_API_KEY:'key'},async(url)=>{calls++;assert.match(String(url),/openai/);return mp3()});await p.synthesize('Olá','homer');assert.equal(calls,1);
 const q=new AudioProvider(join(dir,'fish'),{TTS_PRIMARY:'fish',TTS_SECONDARY:'openai',FISH_API_KEY:'key'},async(url)=>{assert.match(String(url),/fish/);return mp3()});await q.synthesize('Olá','homer');
 const empty=new AudioProvider(join(dir,'empty'),{TTS_PRIMARY:'fish',TTS_SECONDARY:'openai'},async()=>{throw Error('should not call')});await assert.rejects(empty.synthesize('Oi','homer'),/não configurado/);
 }finally{await rm(dir,{recursive:true,force:true})}
});
test('Timeout and non-audio payload fall back; cancellation never starts secondary',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'timeouts-'));try{let calls=0;const env={TTS_PRIMARY:'fish',TTS_SECONDARY:'openai',FISH_API_KEY:'key',TTS_API_KEY:'key',TTS_TIMEOUT_MS:'100'};
 const p=new AudioProvider(dir,env,async(_url,init)=>{calls++;if(calls===1)return new Promise((_resolve,reject)=>init!.signal!.addEventListener('abort',()=>reject(Error('timeout'))));return mp3()});const keepAlive=setInterval(()=>{},100);try{await p.synthesize('Timeout','homer')}finally{clearInterval(keepAlive)}assert.equal(calls,2);
 const controller=new AbortController();calls=0;const q=new AudioProvider(join(dir,'abort'),env,async()=>{calls++;controller.abort();throw Error('aborted')},controller.signal);await assert.rejects(q.synthesize('Oi','homer'),/cancelada/);assert.equal(calls,1);
 calls=0;const invalid=new AudioProvider(join(dir,'invalid'),env,async()=>++calls===1?Response.json({error:'invalid'}):mp3());await invalid.synthesize('Oi','homer');assert.equal(calls,2);
 }finally{await rm(dir,{recursive:true,force:true})}
});

test('Server without credentials remains healthy and reports voice failure without pausing',async()=>{
 const {createServer}=await import('../server/index.ts');const dir=await mkdtemp(join(tmpdir(),'server-empty-'));
 const app=createServer({dataDir:dir,env:{TTS_PRIMARY:'fish',TTS_SECONDARY:'openai'},tickInterval:0,log:()=>{}});
 try{const {url}=await app.start(0);assert.equal((await fetch(url+'/api/health')).status,200);const r=await fetch(url+'/api/tts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'Olá',character:'homer'})});assert.equal(r.status,503);assert.equal(app.state.paused,false);assert.ok(app.state.logs.some(x=>x.type==='audio'&&x.message.includes('indisponível')))}finally{await app.close();await rm(dir,{recursive:true,force:true})}
});
