import test from 'node:test';
import assert from 'node:assert/strict';
import {createInitialState,applyAction,tick} from '../shared/engine.ts';
import {validateDecision,environmentContext,rememberExchange,recentConversation} from '../server/brain.ts';
import {generateActions} from '../server/providers.ts';
import type {ChatMessage} from '../shared/types.ts';
const msg=(user:string,text='Como você descobriu?'):ChatMessage=>({id:user,user,text,at:1000,selected:true,source:'tiktok'});
test('conversation continuation isolates exact participant and expires',()=>{
 const s=createInitialState(0);rememberExchange(s,msg('ana','Raiz de 67?'),'Aproximadamente 8,19.',1000);
 rememberExchange(s,msg('anna','Capital da França?'),'Paris.',2000);
 assert.match(recentConversation(s,msg('ana'),3000)[0].answer,/8,19/);
 assert.equal(recentConversation(s,msg('ANa'),3000).length,0);
 assert.equal(recentConversation(s,msg('ana'),4000000).length,0);
 applyAction(s,{type:'CLEAR_MEMORY'},3000);assert.equal(s.conversations?.length,0);
});
test('capabilities reject injection, arbitrary properties, unknown objects and priorities',()=>{
 const s=createInitialState();
 for(const a of [{type:'SETTINGS',settings:{mode:'auto'}},{type:'EXEC',command:'curl secret'}, {type:'INTERACT_WITH_OBJECT',object:'shell'}, {type:'MOVE_TO_ROOM',room:'moon'}, {type:'TALK',character:'homer',text:'hi',priority:10}, {type:'TALK',character:'homer',text:'hi',command:'exec'}])assert.throws(()=>validateDecision([a],s));
 s.settings.aiCommands=false;
 assert.throws(()=>validateDecision([{type:'MOVE_TO_ROOM',room:'kitchen'}],s));
 assert.equal(validateDecision([{type:'TALK',character:'homer',text:'A raiz é 8,19.'}],s).length,1);
});
test('environment uses actual donut phase and ordinary travel destination',()=>{
 const s=createInitialState(0);s.interaction={id:'d',kind:'donut',startedAt:0,duration:38000};
 assert.equal(environmentContext(s,18000).room,'kitchen');assert.equal(environmentContext(s,26000).destination,'living');
 s.interaction=undefined;applyAction(s,{type:'MOVE_TO_ROOM',room:'kitchen'},0);
 assert.equal(environmentContext(s,1000).destination,'kitchen');assert.equal(environmentContext(s,1000).activity,'walking');
});
test('composed queue waits for voice then travels to fridge without returning to living',()=>{
 const s=createInitialState(0);s.settings.mode='manual';s.settings.eventsEnabled=false;
 s.operatorQueue=validateDecision([{type:'MOVE_TO_ROOM',room:'kitchen'},{type:'INTERACT_WITH_OBJECT',object:'fridge'}],s);
 applyAction(s,{type:'TALK',character:'homer',text:'Vou olhar a geladeira.'},0);
 tick(s,10,10);assert.equal(Boolean(s.movement),false);
 s.speaking=null;s.speechQueue=[];tick(s,20,10);assert.equal(s.movement?.to,'kitchen');
 const arrived=20+s.movement!.duration+1;tick(s,arrived,10);tick(s,arrived+1,1);assert.equal(s.room,'kitchen');assert.equal(s.doors.fridge,true);assert.equal(s.operatorQueue.length,0);
});
test('external semantic decisions receive catalog, identity context and untrusted user data',async()=>{
 const s=createInitialState();rememberExchange(s,msg('ana','Raiz de 67?'),'8,19.');
 for(const text of ['Bateu sede, rola uma aguinha?','toma um copo dagua pra mim']){
 const mock:typeof fetch=async(_url,init)=>{
 const body=JSON.parse(String(init?.body));assert.match(body.messages[1].content,/8,19/);assert.match(body.messages[1].content,/INTERACT_WITH_OBJECT/);
 assert.equal(body.messages.at(-1).content,text);
 return Response.json({choices:[{message:{content:JSON.stringify({actions:[{type:'INTERACT_WITH_OBJECT',object:'water'}]})}}]});};
 const actions=await generateActions(s,text,{AI_API_KEY:'mock-only'},mock,undefined,msg('ana',text));
 assert.equal(validateDecision(actions,s)[0].type,'INTERACT_WITH_OBJECT');
 }
});
test('IRL return destination comes from current phase, not outbound plan',()=>{
 const s=createInitialState(0);s.irl={enabled:true,startedAt:0,pendingDonuts:0};
 assert.equal(environmentContext(s,30000).destination,'living');
 assert.throws(()=>validateDecision([{type:'INTERACT_WITH_OBJECT',object:'donut'}],s));
 assert.equal(validateDecision([{type:'TALK',character:'homer',text:'Estou voltando para a sala.'}],s).length,1);
});
