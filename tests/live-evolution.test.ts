import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {StateDatabase} from '../server/db.ts';
import {UsageMeter,emptyUsage} from '../server/usage.ts';
import {viewerKey,preferences} from '../server/viewerMemory.ts';
import {TikTokBridge} from '../server/tiktok.ts';
import {AudioProvider} from '../server/providers.ts';
import {createInitialState,applyAction,tick} from '../shared/engine.ts';
import {feeling,idleMood} from '../shared/mood.ts';
import {recentConversation,rememberExchange} from '../server/brain.ts';
async function until(f:()=>boolean){for(let i=0;i<400;i++){if(f())return;await delay(5)}throw Error('Timed out')}
class Connection extends EventEmitter{async connect(){} async fetchAvailableGifts(){return [{id:123,name:'Tiny Diny',diamond_count:10}]}disconnect(){this.emit('disconnected')}}
const events={error:'error',disconnected:'disconnected',chat:'chat',gift:'gift'};
test('TikTok reconnects, ignores stale callbacks and duplicate gifts; manual stop cancels retries',async()=>{
 const s=createInitialState();const connections:Connection[]=[];
 const bridge=new TikTokBridge(s,{TIKTOK_ENABLED:'true',TIKTOK_USERNAME:'test'},()=>{},()=>{},async()=>({events,create:()=>{const c=new Connection();connections.push(c);return c}}),5);
 try{
 await bridge.start();const first=connections[0];const gift={giftId:123,user:{displayId:'viewer'},common:{msgId:'gift-1'}};
 first.emit('gift',gift);assert.equal(s.speechQueue.length,1);first.emit('disconnected');
 await until(()=>connections.length===2&&bridge.status==='conectado');
 connections[1].emit('gift',gift);assert.equal(s.speechQueue.length,1);
 first.emit('chat',{common:{msgId:'old'},user:{displayId:'old'},content:'old'});assert.equal(s.chat.length,0);
 connections[1].emit('disconnected');bridge.stop();await delay(30);assert.equal(connections.length,2);assert.equal(bridge.status,'desconectado');
 }finally{bridge.stop()}
});
test('TikTok retry budget ends after eight retries, without infinite reconnect loop',async()=>{
 let attempts=0;
 const b=new TikTokBridge(createInitialState(),{TIKTOK_ENABLED:'true',TIKTOK_USERNAME:'test'},()=>{},()=>{},async()=>({events,create:()=>{const c=new Connection();c.connect=async()=>{attempts++;throw Error('network')};return c}}),1);
 try{await assert.rejects(b.start());await until(()=>b.status.includes('esgotada'));assert.equal(attempts,9)}finally{b.stop()}
});
test('persistent viewer interests use stable ids, avoid similar-name collisions and honor expiry/delete',()=>{
 const db=new StateDatabase(':memory:');try{
 const a=viewerKey('111')!,b=viewerKey('112')!;assert.notEqual(a,b);assert.equal(viewerKey('displayName'),undefined);
 assert.deepEqual(preferences('Meu telefone é 123456 e tenho uma doença'),[]);
 assert.deepEqual(preferences('lembre que gosto de futebol, meu telefone é 123'),['futebol']);
 assert.deepEqual(preferences('não lembre que gosto de pizza'),[]);
 db.rememberViewer(a,'ana','lembre que gosto de matemática',7,1000);db.rememberViewer(b,'ana','lembre que gosto de música',7,1000);
 db.rememberViewer(a,'novo-nome','olá',7,2000000);assert.deepEqual(db.viewer(a)?.preferences,['matemática']);assert.equal(db.viewer(a)?.visits,2);assert.deepEqual(db.viewer(b)?.preferences,['música']);
 db.clearViewers(a);assert.equal(db.viewer(a),undefined);db.pruneViewers(1,86402000);assert.equal(db.viewers().length,0);
 }finally{db.close()}
});
test('TikTok stable ids link conversation despite handle change without merging other ids',()=>{
 const s=createInitialState(),b=new TikTokBridge(s,{},()=>{});
 b.receiveChat({common:{msgId:'1'},user:{idStr:'123',displayId:'ana'},content:'Raiz de 67?'});
 rememberExchange(s,s.chat[0],'8,19.');
 const m={...s.chat[0],user:'novo-nome'};assert.equal(recentConversation(s,m).length,1);
 assert.equal(recentConversation(s,{...m,viewerKey:viewerKey('124')}).length,0);
});
test('usage limits persist, reserve before request and reject exceeding monetary estimates',()=>{
 const s=createInitialState(),db=new StateDatabase(':memory:');try{
 s.settings.aiRequestLimit=1;s.settings.aiEstimatedPerCall=.02;s.settings.budgetUSD=.03;
 const meter=new UsageMeter(emptyUsage(),()=>s.settings,u=>db.saveUsage(u));meter.reserve('ai');assert.throws(()=>meter.reserve('ai'),/Limite/);
 assert.equal(db.loadUsage().ai,1);assert.equal(db.loadUsage().estimatedUSD,.02);
 s.settings.fishEstimatedPer1k=.02;assert.throws(()=>meter.reserve('fish',1000),/orçamento/);
 assert.throws(()=>meter.reserve('openai',10),/estimativas/);assert.equal(meter.value.fish,0);meter.reset();assert.equal(db.loadUsage().ai,0);
 }finally{db.close()}
});
test('paid TTS counts actual network attempts including fallback, but not cached playback',async()=>{
 const directory=await mkdtemp(join(tmpdir(),'homer-limit-'));let calls=0;const s=createInitialState();
 const meter=new UsageMeter(emptyUsage(),()=>s.settings,()=>{});
 const audio=new AudioProvider(directory,{TTS_PRIMARY:'fish',TTS_SECONDARY:'openai',FISH_API_KEY:'fake',OPENAI_API_KEY:'fake'},async()=>{calls++;return calls===1?new Response('',{status:503}):new Response(new Uint8Array([73,68,51]),{headers:{'Content-Type':'audio/mpeg'}})},undefined,()=>{},(kind,n)=>meter.reserve(kind,n));
 try{await audio.synthesize('Teste','homer');assert.equal(meter.value.fish,1);assert.equal(meter.value.openai,1);
 // Main will be tried again; successful secondary cache prevents a second secondary request.
 await audio.synthesize('Teste','homer');assert.equal(meter.value.fish,2);
 await audio.synthesize('Teste','homer');assert.equal(meter.value.fish,2);
 s.settings.ttsRequestLimit=3;await assert.rejects(audio.synthesize('Outra fala','homer'),/Limite/);assert.equal(calls,3);
 }finally{await rm(directory,{recursive:true,force:true})}
});
test('mood responds to food, sleep and active chat without overriding critical gestures',()=>{
 const s=createInitialState(0);assert.equal(feeling(s,1000),'curioso');s.homer.hunger=90;assert.equal(feeling(s,1000),'impaciente');
 s.homer.hunger=20;s.logs.unshift({id:'x',at:1000,type:'object',message:'Homer pegou a rosquinha e voltou ao seu lugar.'});assert.equal(feeling(s,2000),'satisfeito');
 s.homer.energy=10;assert.equal(feeling(s,2000),'sonolento');s.interaction={id:'x',startedAt:0,duration:38000,kind:'donut'};const before=s.characters.homer.expression;idleMood(s,35000);assert.equal(s.characters.homer.expression,before);
 s.interaction=undefined;s.characters.homer.activity='idle';idleMood(s,40000);assert.equal(s.characters.homer.expression,'sleepy');
});
test('IRL poll uses real rooms, waits for home and preserves queued donut priority',()=>{
 const s=createInitialState(1000);s.settings.eventsEnabled=false;s.settings.mode='manual';
 applyAction(s,{type:'IRL',enabled:true},1000);const original=s.irl!.plan;
 applyAction(s,{type:'START_GAME',game:'poll'},1001);assert.equal(s.game!.roomChoices!.length,3);const chosen=s.game!.roomChoices![1];
 applyAction(s,{type:'GAME_INPUT',user:'viewer',value:'B'},1002);
 tick(s,s.game!.endsAt+1,1);assert.equal(s.irl!.nextDestination,chosen);const plan=s.irl!.plan!;
 applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'},s.game!.endsAt+2);
 tick(s,s.irl!.startedAt+plan.duration+1,1);assert.ok(s.interaction);assert.equal(s.irl!.nextDestination,chosen);assert.ok(original);
});
test('usage and viewer profiles survive reopening SQLite without raw chat contents',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'homer-viewer-db-'));const file=join(dir,'state.sqlite');let db=new StateDatabase(file);
 try{db.rememberViewer(viewerKey('999')!,'viewer','lembre que gosto de pizza, minha senha é segredo');db.saveUsage({...emptyUsage(),ai:3});db.close();db=new StateDatabase(file);assert.equal(db.loadUsage().ai,3);assert.deepEqual(db.viewers()[0].preferences,['pizza']);assert.doesNotMatch(JSON.stringify(db.viewers()),/segredo|senha/)}finally{db.close();await rm(dir,{recursive:true,force:true})}
});
test('IRL winning room becomes next route only after reaching home',()=>{
 const s=createInitialState(1000);s.settings.mode='manual';s.settings.eventsEnabled=false;applyAction(s,{type:'IRL',enabled:true},1000);applyAction(s,{type:'START_GAME',game:'poll'},1001);
 const chosen=s.game!.roomChoices![2];applyAction(s,{type:'GAME_INPUT',user:'viewer',value:'C'},1002);s.game!.endsAt=1003;
 const initial=s.irl!.plan;tick(s,1004,1);assert.equal(s.irl!.plan,initial);assert.equal(s.irl!.nextDestination,chosen);
 tick(s,s.irl!.startedAt+s.irl!.plan!.duration+1,1);assert.equal(s.irl!.plan!.destination,chosen);assert.equal(s.irl!.nextDestination,undefined);
});
