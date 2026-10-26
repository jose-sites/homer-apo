import {feeling} from '../shared/mood.ts';
import {participantKey} from './viewerMemory.ts';
import { ActionSchema } from '../shared/engine.ts';
import { ROOMS } from '../shared/data.ts';
import { donutPose, pointAlong } from '../shared/homerMotion.ts';
import { tourPose } from '../shared/irl.ts';
import type { Action, ChatMessage, LiveState } from '../shared/types.ts';

// Only capabilities supported by the existing engine. No operator/settings actions.
export const CAPABILITIES = {
 TALK: {character:'homer',text:'até 350 caracteres; resposta ou intenção futura, nunca conclusão antecipada'},
 REACT: {character:'homer',expression:['neutral','happy','confused','angry','sleepy']},
 MOVE_TO_ROOM: {room:ROOMS.map(r=>r.id)},
 INTERACT_WITH_OBJECT: {object:['donut','water','fridge','tv'],requirements:{donut:'sequência de 38s; prepara retorno à sala',water:'sequência de 38s; prepara retorno à sala',fridge:'cozinha; abrir/fechar',tv:'sala; trocar canal'}},
};
export function isQueuedAction(a:Action){return a.type==='MOVE_TO_ROOM'||a.type==='INTERACT_WITH_OBJECT'}
export function validateDecision(values:unknown[],state:LiveState):Action[]{
 if(!values.length||values.length>3)throw new Error('Plano deve conter entre 1 e 3 ações.');
 const actions=values.map(v=>ActionSchema.parse(v));
 for(const a of actions){
  if(!Object.hasOwn(CAPABILITIES,a.type))throw new Error('Capacidade não autorizada.');
  if('character' in a&&a.character!=='homer')throw new Error('Apenas Homer participa.');
  if(a.type==='TALK'&&(a.text.length>350||(a.priority??0)>4))throw new Error('Fala fora dos limites.');
  if(a.type==='MOVE_TO_ROOM'&&!ROOMS.some(r=>r.id===a.room))throw new Error('Cômodo inexistente.');
  if(a.type==='INTERACT_WITH_OBJECT'&&!CAPABILITIES.INTERACT_WITH_OBJECT.object.includes(a.object))throw new Error('Objeto não autorizado.');
  if(isQueuedAction(a)&&state.settings.aiCommands===false)throw new Error('Comandos por IA desativados.');
  if(state.irl&&isQueuedAction(a))throw new Error('Durante IRL, use somente conversa e expressão.');
 }
 if((state.operatorQueue?.length||0)+actions.filter(isQueuedAction).length>8)throw new Error('Fila de ações cheia.');
 return actions;
}
export function environmentContext(s:LiveState,now=Date.now()){
 const interaction=s.interaction?donutPose(now-s.interaction.startedAt):null;
 const tour=s.irl?tourPose(now-s.irl.startedAt,s.irl.plan):null;
 const movement=s.movement?pointAlong(s.movement.path,(now-s.movement.startedAt)/s.movement.duration):null;
 const movingRoom=movement?ROOMS.filter(r=>Math.abs(r.origin[1]-movement.position[1])<1.9&&Math.abs(r.origin[0]-movement.position[0])<=r.size[0]/2&&Math.abs(r.origin[2]-movement.position[2])<=r.size[1]/2).sort((a,b)=>Math.abs(a.origin[1]-movement.position[1])-Math.abs(b.origin[1]-movement.position[1]))[0]?.id:undefined;
 const room=interaction?.room||tour?.room||movingRoom||s.room;
 return {feeling:feeling(s,now),room,roomName:ROOMS.find(r=>r.id===room)?.name,mode:s.irl?'IRL':'Normal',destination:s.movement?.to||tour?.destination|| (interaction?(interaction.phase==='return'?'living':'kitchen'):null),position:interaction?.position||tour?.position||movement?.position,
 activity:interaction?`${s.interaction!.kind}:${interaction.phase}`:s.movement?'walking':tour?'tour':s.characters.homer.activity,
 nearby:room==='living'?['sofá','televisão','mesa']:room==='kitchen'?['mesa com rosquinhas','geladeira','fogão','pia']:[],
 busy:!!(s.interaction||s.movement),queued:s.operatorQueue||[],expression:s.characters.homer.expression,needs:s.homer,
 results:s.logs.filter(l=>['movement','object','action-result','error'].includes(l.type)).slice(0,6).map(l=>l.message)};
}
// Session conversations, exact source + handle. Never merge similar display names.
export function recentConversation(s:LiveState,message?:ChatMessage,now=Date.now()){
 const key=message?participantKey(message):undefined;
 return (s.conversations||[]).filter(t=>now-t.at<Math.min(s.settings.retentionDays*86400000,3600000)&&(!key||t.participant===key)).slice(-8);
}
export function rememberExchange(s:LiveState,message:ChatMessage|undefined,answer:string,now=Date.now()){
 if(!message)return;
 s.conversations=[...(s.conversations||[]).filter(t=>now-t.at<3600000),{participant:participantKey(message),question:message.text.slice(0,280),answer:answer.slice(0,700),at:now}].slice(-80);
}
