import {tourPose,makeIRLPlan,IRL_DURATION} from './irl';
import {DONUT_DURATION,donutPose} from './homerMotion';
import {LAYOUT_REVISION,STAIR_BOTTOM,STAIR_TOP} from './referenceLayout';
import { z } from 'zod';
import { CAMERAS, DOORWAYS, EVENTS, LINES, MAGGIE_EFFECTS, ROOMS, ROOM_NAV_POINTS, doorId } from './data';
import { createGame, finishGame, submitGameInput, tickGame } from './games';
import type { Action, CameraPreset, CharacterId, EventDefinition, Line, LiveState, Room, Settings, Speech, Vec3 } from './types';

const character=z.enum(['homer','marge','bart','lisa','maggie']);
const expression=z.enum(['neutral','happy','confused','angry','sleepy']);
const activity=z.enum(['idle','talking','sitting','walking','sleeping','reacting']);
const id=z.string().min(1).max(100).regex(/^[\p{L}\p{N}_:.-]+$/u);
const text=z.string().trim().min(1).max(500);
const bounded=(min:number,max:number)=>z.number().finite().min(min).max(max);
const vec=z.tuple([bounded(-250,250),bounded(-20,50),bounded(-250,250)]);
export const SettingsSchema=z.object({mode:z.enum(['manual','semi','auto']),autoCamera:z.boolean(),aiEnabled:z.boolean(),familyEnabled:z.boolean(),eventsEnabled:z.boolean(),quality:z.enum(['low','medium','high']),adaptiveQuality:z.boolean(),masterVolume:bounded(0,1),effectsVolume:bounded(0,1),familyMin:bounded(30,1800),familyMax:bounded(30,3600),responseCooldown:bounded(5,600),cameraInterval:bounded(8,300),timeMode:z.enum(['real','accelerated','fixed']),timeScale:bounded(0.1,3600),retentionDays:bounded(1,90).int(),cleanOverlay:z.boolean(),provider:z.enum(['demo','openai-compatible']),ttsProvider:z.enum(['browser','openai-compatible','silent'])}).strict();
const cameraSchema=z.object({id,name:z.string().trim().min(1).max(100),room:id,position:vec,target:vec,fov:bounded(20,95),type:z.enum(['frontal','wide','reaction','first-person','environment','follow']),transition:z.enum(['cut','smooth','fade'])}).strict();
export const ActionSchema=z.discriminatedUnion('type',[
 z.object({type:z.literal('IRL'),enabled:z.boolean()}).strict(),
 z.object({type:z.literal('TALK'),character,text,priority:bounded(0,10).optional()}).strict(),
 z.object({type:z.literal('REACT'),character,expression}).strict(),
 z.object({type:z.literal('CHANGE_CAMERA'),cameraId:id}).strict(),
 z.object({type:z.literal('MOVE_TO_ROOM'),room:id}).strict(),
 z.object({type:z.literal('START_GAME'),game:z.enum(['hangman','quiz','guess','poll','challenge'])}).strict(),
 z.object({type:z.literal('STOP_GAME')}).strict(),
 z.object({type:z.literal('PLAY_ANIMATION'),character,activity}).strict(),
 z.object({type:z.literal('INTERACT_WITH_OBJECT'),object:z.union([z.enum(['tv','fridge','door','lights','sofa','bed','doorbell','donut']),z.string().regex(/^door:[a-z]+-[a-z]+$/)])}).strict(),
 z.object({type:z.literal('RESPOND_TO_FAMILY'),character}).strict(),
 z.object({type:z.literal('PAUSE'),paused:z.boolean()}).strict(),
 z.object({type:z.literal('SETTINGS'),settings:SettingsSchema.partial()}).strict(),
 z.object({type:z.literal('CHARACTER'),character,patch:z.object({enabled:z.boolean().optional(),volume:bounded(0,1).optional(),expression:expression.optional()}).strict()}).strict(),
 z.object({type:z.literal('TRIGGER_EVENT'),eventId:id}).strict(),
 z.object({type:z.literal('UPDATE_EVENT'),eventId:id,patch:z.object({enabled:z.boolean().optional(),probability:bounded(0,1).optional(),cooldown:bounded(10,86400).optional(),duration:bounded(1,600).optional(),priority:bounded(0,10).optional()}).strict()}).strict(),
 z.object({type:z.literal('ADD_CAMERA'),camera:cameraSchema}).strict(),
 z.object({type:z.literal('ADD_LINE'),line:z.object({id,character,category:z.string().min(1).max(60),text}).strict()}).strict(),
 z.object({type:z.literal('CHAT'),user:z.string().trim().min(1).max(30),text:z.string().trim().min(1).max(280),source:z.enum(['test','local','tiktok']).optional(),avatarUrl:z.string().max(2048).url().regex(/^https:\/\//).optional()}).strict(),
 z.object({type:z.literal('SELECT_CHAT'),messageId:id}).strict(),
 z.object({type:z.literal('GAME_INPUT'),value:z.string().trim().min(1).max(80),user:z.string().trim().min(1).max(30).optional()}).strict(),
 z.object({type:z.literal('APPROVE_PROPOSAL'),id}).strict(),
 z.object({type:z.literal('SET_TIME'),hour:bounded(0,24)}).strict(),
 z.object({type:z.literal('CLEAR_MEMORY')}).strict(),
]);
export function validateAction(value:unknown):{ok:true;action:Action}|{ok:false;error:string}{
 const result=ActionSchema.safeParse(value);
 return result.success?{ok:true,action:result.data as Action}:{ok:false,error:`Ação inválida: ${result.error.issues[0]?.path.join('.')||'tipo'} ${result.error.issues[0]?.message||''}`};
}
let seq=0;
const uid=(prefix:string,now:number)=>`${prefix}-${now}-${++seq}`;
const clone=<T>(v:T):T=>structuredClone(v);
const clamp=(n:number)=>Math.max(0,Math.min(100,n));
interface Runtime {lastCamera:number;lastDecision:number;lastResponse:number;lastEventCheck:number;lastSummary:number;recentLines:string[];activeEvents:Map<string,number>;lastChat:Map<string,number>;responses:Set<string>;eventSpeaker?:CharacterId;gameResult?:string;pausedAt?:number;speechActivity?:{character:CharacterId;activity:LiveState['characters'][CharacterId]['activity']}}
const runtimes=new WeakMap<LiveState,Runtime>();
function runtime(state:LiveState,now:number):Runtime{
 let rt=runtimes.get(state);if(!rt){rt={lastCamera:now,lastDecision:now,lastResponse:0,lastEventCheck:now,lastSummary:now,recentLines:[],activeEvents:new Map(),lastChat:new Map(),responses:new Set(),pausedAt:state.paused?now:undefined};runtimes.set(state,rt);}return rt;
}
export function logEvent(state:LiveState,type:string,message:string,now=Date.now()){
 state.logs.unshift({id:uid('log',now),at:now,type,message});state.logs=state.logs.slice(0,120);
}
export function createInitialState(now=Date.now()):LiveState{
 const settings:Settings={mode:'manual',autoCamera:true,aiEnabled:true,familyEnabled:true,eventsEnabled:true,quality:'medium',adaptiveQuality:true,masterVolume:.7,effectsVolume:.3,familyMin:180,familyMax:360,responseCooldown:15,cameraInterval:25,timeMode:'fixed',timeScale:60,retentionDays:7,cleanOverlay:false,provider:'demo',ttsProvider:'browser'};
 const characters=Object.fromEntries((['homer','marge','bart','lisa','maggie'] as CharacterId[]).map(id=>[id,{id,name:id[0].toUpperCase()+id.slice(1),enabled:true,expression:'neutral',activity:'sitting',room:'living',volume:id==='maggie'?.35:.8}])) as LiveState['characters'];
 const state:LiveState={version:1,layoutRevision:LAYOUT_REVISION,startedAt:now,paused:false,settings,characters,homer:{mood:78,energy:83,hunger:34,sleep:18,attention:85,interest:75,lastFamily:0},room:'living',cameraId:'living-family',cameras:clone(CAMERAS),speaking:null,speechQueue:[],chat:[],logs:[],events:clone(EVENTS),lines:clone(LINES),game:null,movement:null,virtualHour:17.5,weather:'clear',power:true,tvChannel:0,doors:{},memory:[],proposals:[],providers:{ai:'Regras locais · sem conexão com IA',tts:'Voz do navegador · requer ativação de áudio'},nextFamilyAt:now+240000};
 logEvent(state,'system','Estúdio iniciado. Chat de teste local; integrações externas não conectadas.',now);return state;
}
export function selectLine(state:LiveState,who:CharacterId,category?:string,random=Math.random):Line|undefined{
 const rt=runtime(state,Date.now());const all=state.lines.filter(l=>l.character===who);if(!all.length)return undefined;
 let candidates=all.filter(l=>(!category||l.category===category)&&!rt.recentLines.includes(l.id));
 if(!candidates.length)candidates=all.filter(l=>!rt.recentLines.includes(l.id));
 if(!candidates.length)candidates=all.filter(l=>l.id!==rt.recentLines.at(-1));
 const selected=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];
 if(selected){rt.recentLines.push(selected.id);rt.recentLines=rt.recentLines.slice(-12);}return selected;
}
function say(state:LiveState,who:CharacterId,text:string,now:number,priority=3,effect?:string):{ok:boolean;error?:string}{
 if(!state.characters[who].enabled)return {ok:false,error:'Personagem desativado.'};
 if(state.speechQueue.length>=12)return {ok:false,error:'Fila de áudio cheia. Aguarde uma fala terminar.'};
 const speech:Speech={id:uid('speech',now),character:who,text,priority,createdAt:now,duration:effect?1800:Math.min(22000,Math.max(2400,text.length/13*1000)),...(effect?{effect}:{} )};
 state.speechQueue.push(speech);state.speechQueue.sort((a,b)=>b.priority-a.priority||a.createdAt-b.createdAt);
 logEvent(state,'speech',`${state.characters[who].name}: ${text}`,now);return {ok:true};
}
function speakBank(state:LiveState,who:CharacterId,now:number,category?:string,priority=3){
 if(who==='maggie')return say(state,'maggie','Maggie faz um som suave.',now,1,MAGGIE_EFFECTS[Math.floor(Math.random()*MAGGIE_EFFECTS.length)]);
 const line=selectLine(state,who,category);return line?say(state,who,line.text,now,priority):{ok:false,error:'Nenhuma fala disponível.'};
}
export function roomPoint(room:Room):Vec3 {return [...ROOM_NAV_POINTS[room.id]];}
export function findRoomPath(from:string,to:string):string[]|null{
 if(!ROOMS.some(r=>r.id===from)||!ROOMS.some(r=>r.id===to))return null;
 const queue=[[from]];const seen=new Set([from]);
 while(queue.length){const path=queue.shift()!;if(path.at(-1)===to)return path;for(const neighbor of ROOMS.find(r=>r.id===path.at(-1))!.neighbors){if(!seen.has(neighbor)){seen.add(neighbor);queue.push([...path,neighbor]);}}}return null;
}
// Each approach stays inside its room and skirts fixed furnishings. Reversing it
// produces an equally safe arrival; adjacent rooms meet at exactly one portal.
export function doorwayApproach(room:Room,doorway:Vec3):Vec3[]{
 const [rx,y,rz]=room.origin,dx=doorway[0]-rx,dz=doorway[2]-rz;
 const local=(x:number,z:number):Vec3=>[rx+x,y,rz+z];
 const points:Vec3[]=[roomPoint(room)];
 const add=(...coords:Array<[number,number]>)=>points.push(...coords.map(([x,z])=>local(x,z)));
 if(room.kind==='hall'){
  if(dz>=room.size[1]/2-.01)add([-1,3.5],[dx,3.5]);
  else if(dz<=-room.size[1]/2+.01)add([-1,-2],[dx,-2]);
  else if(dx>0)add([-1,-2],[4.65,-2],[4.65,0]);
 }else if(room.id==='living'){
  if(dz<=-room.size[1]/2+.01)add([3.7,-2],[dx,-2]);
  else if(dz>=room.size[1]/2-.01)add([0,1.8]);
  else if(dx<0)add([-2.5,1.8],[-2.5,-.8],[-4.4,-.8],[-4.4,dz]);
  else add([3.7,0]);
 }else if(room.id==='kitchen'){
  add([3.9,2.7],[3.9,dz]);
 }else if(room.id==='dining'){
  if(dz<=-room.size[1]/2+.01)add([3.5,-2.4],[dx,-2.4]);
  else if(dz>=room.size[1]/2-.01)add([dx,2.6]);
  else add([Math.sign(dx)*3.5,2.6],[Math.sign(dx)*3.5,0]);
 }else if(room.id==='garage'){
  if(dz<=-room.size[1]/2+.01)add([1.7,0],[1.7,-3.2],[0,-3.2]);
  else if(dz>=room.size[1]/2-.01)add([2.2,3.3],[0,3.3]);else if(dx<0)add([2.2,3],[-2.2,3],[-2.2,0]);
 }else if(room.id==='parents'){
  if(dz<=-room.size[1]/2+.01)add([1.2,-1.5]);else if(dx<0)add([1.2,2.4],[-3.6,2.4],[-3.6,0]);else add([1.2,0]);
 }else if(room.id==='bart'){if(dx<0)add([1.2,2.7],[-3.5,2.7],[-3.5,0]);else add([1.2,0]);}
 else if(room.id==='lisa'){
  if(dz>=room.size[1]/2-.01)add([dx,1.5]);else add([1.2,2.7],[Math.sign(dx)*3.6,2.7],[Math.sign(dx)*3.6,0]);
 }else if(room.id==='maggie'){
  if(dz<=-room.size[1]/2+.01)add([dx,.5]);else add([-2,0]);
 }else if(room.id==='yard')add([dx,1.5]);
 else if(room.id==='front')add([0,-2],[dx,-2]);
 points.push([...doorway]);
 return points;
}
export function movementWaypoints(from:string,to:string):Vec3[]|null{
 const rooms=findRoomPath(from,to);if(!rooms)return null;
 const points:Vec3[]=[roomPoint(ROOMS.find(r=>r.id===from)!)];
 for(let i=1;i<rooms.length;i++){
  const a=ROOMS.find(r=>r.id===rooms[i-1])!,b=ROOMS.find(r=>r.id===rooms[i])!;
  const ay=a.origin[1],by=b.origin[1];
  if(ay!==by){
   const bottom=Math.min(ay,by);const stairs:Vec3[]=[[-1,bottom,-4.5],[STAIR_BOTTOM[0],bottom,STAIR_BOTTOM[2]],[STAIR_TOP[0],bottom+3.6,STAIR_TOP[2]],[3.1,bottom+3.6,-9.6],[-1,bottom+3.6,-9.6]];
   points.push(...(ay<by?stairs:[...stairs].reverse()),roomPoint(b));
  }else{
   const portal=DOORWAYS[doorId(a.id,b.id)];if(!portal)return null;
   points.push(...doorwayApproach(a,portal),...doorwayApproach(b,portal).reverse());
  }
 }
 return points.filter((p,i,all)=>i===0||p.some((v,j)=>Math.abs(v-all[i-1][j])>.01));
}
function safeCamera(camera:CameraPreset):boolean{
 const room=ROOMS.find(r=>r.id===camera.room);if(!room)return false;
 if(room.kind==='exterior'||room.kind==='yard')return true;
 const [x,y,z]=camera.position,[rx,ry,rz]=room.origin;
 return Math.abs(x-rx)<room.size[0]/2-.15&&Math.abs(z-rz)<room.size[1]/2-.15&&y>ry+.2&&y<ry+3.45;
}
function move(state:LiveState,to:string,now:number){
 if(state.movement)return {ok:false,error:'Homer já está em deslocamento.'};
 if(!state.characters.homer.enabled)return {ok:false,error:'Homer está desativado.'};
 if(to===state.room)return {ok:false,error:'Homer já está nesse ambiente.'};
 const path=movementWaypoints(state.room,to);if(!path)return {ok:false,error:'Não existe rota para esse ambiente.'};
 const length=path.reduce((sum,p,i)=>i?sum+Math.hypot(...p.map((v,j)=>v-path[i-1][j])):sum,0);
 const route=findRoomPath(state.room,to)!;
 for(let i=1;i<route.length;i++){const key=doorId(route[i-1],route[i]);if(DOORWAYS[key])state.doors[key]=true;}
 state.movement={from:state.room,to,path,startedAt:now,duration:Math.max(5000,length/2.4*1000)};
 state.characters.homer.activity='walking';
 say(state,'homer',`Vou até ${ROOMS.find(r=>r.id===to)!.name.toLowerCase()}. Já volto à conversa!`,now,5);
 logEvent(state,'movement',`Trajeto: ${route.map(id=>ROOMS.find(r=>r.id===id)!.name).join(' → ')}`,now);return {ok:true};
}
function eventPossible(state:LiveState,event:EventDefinition,now:number,manual=false):string|undefined{
 if(!event.enabled)return 'Evento desativado.';
 if(event.lastRun&&now-event.lastRun<event.cooldown*1000)return 'O evento está em intervalo de segurança.';
 const rt=runtime(state,now);
 if(rt.activeEvents.has(event.id))return 'Esse evento já está ativo.';
 if(event.id==='lightning'&&state.weather!=='rain')return 'Relâmpagos exigem chuva.';
 if(event.id==='wake'&&state.characters.homer.activity!=='sleeping')return 'Homer já está acordado.';
 if(event.id==='sleep'&&(state.movement||state.game?.status==='playing'))return 'Homer está ocupado.';
 if(event.id==='power'&&rt.activeEvents.has('lights')||event.id==='lights'&&rt.activeEvents.has('power'))return 'Outro evento controla a iluminação.';
 if(['bart','lisa','marge','maggie'].includes(event.id)){
  if(!state.characters[event.id as CharacterId].enabled)return 'Personagem desativado.';
  if(!manual&&(!state.settings.familyEnabled||now<state.nextFamilyAt))return 'Aguarde o próximo intervalo familiar.';
 }
 if(event.id==='sleep'&&state.speaking?.character==='homer')return 'Aguarde Homer terminar a fala.';
 if(!manual&&state.speaking&&event.priority<=state.speaking.priority)return 'Há uma fala importante em andamento.';
 if(rt.activeEvents.size>=2)return 'Há acontecimentos demais em andamento.';
 return undefined;
}
function triggerEvent(state:LiveState,event:EventDefinition,now:number,manual=false){
 const error=eventPossible(state,event,now,manual);if(error)return {ok:false,error};
 event.lastRun=now;runtime(state,now).activeEvents.set(event.id,now+event.duration*1000);
 logEvent(state,'event',event.name,now);
 if(['bart','lisa','marge','maggie'].includes(event.id)){state.homer.lastFamily=now;state.nextFamilyAt=now+(state.settings.familyMin+Math.random()*(state.settings.familyMax-state.settings.familyMin))*1000;}
 switch(event.id){
  case 'doorbell':say(state,'homer','Se for a pizza, podem abrir!',now,4);break;
  case 'telephone':say(state,'homer','Alguém atende? Estou muito ocupado sentado.',now,3);break;
  case 'power':case 'lights':state.power=!state.power;break;
  case 'tv':state.tvChannel=(state.tvChannel+1)%5;break;
  case 'hunger':state.homer.hunger=clamp(state.homer.hunger+15);speakBank(state,'homer',now,'comida');break;
  case 'sleep':state.characters.homer.activity='sleeping';state.characters.homer.expression='sleepy';break;
  case 'wake':state.characters.homer.activity='sitting';state.characters.homer.expression='confused';say(state,'homer','Eu estava só descansando os olhos!',now,4);break;
  case 'rain':state.weather='rain';break;
  case 'bart':case 'lisa':case 'marge':speakBank(state,event.id,now,'chat',4);break;
  case 'maggie':speakBank(state,'maggie',now);break;
  case 'fridge':state.doors.fridge=true;break;
  case 'garage':say(state,'homer','Bart… o que foi esse barulho na garagem?',now,3);break;
 }
 return {ok:true};
}
const PAUSED_ALLOWED=new Set(['PAUSE','SETTINGS','CHARACTER','UPDATE_EVENT','ADD_CAMERA','ADD_LINE','CHANGE_CAMERA','STOP_GAME','SET_TIME','CLEAR_MEMORY']);
export function applyAction(state:LiveState,value:unknown,now=Date.now()):{ok:boolean;error?:string}{
 const valid=validateAction(value);if(!valid.ok)return valid;
 const action=valid.action;
 if(state.paused&&!PAUSED_ALLOWED.has(action.type))return {ok:false,error:'A operação está pausada. Retome para executar esta ação.'};
 if(state.interaction&&(['CHANGE_CAMERA','MOVE_TO_ROOM','PLAY_ANIMATION','REACT','INTERACT_WITH_OBJECT','TRIGGER_EVENT'].includes(action.type)||(action.type==='CHARACTER'&&action.character==='homer')))return {ok:false,error:'Aguarde Homer voltar da cozinha.'};
 if(state.irl&&!state.interaction){
 if(action.type==='INTERACT_WITH_OBJECT'&&action.object==='donut'){state.irl.pendingDonuts=Math.min(3,state.irl.pendingDonuts+1);return {ok:true};}
 if(['MOVE_TO_ROOM','CHANGE_CAMERA','PLAY_ANIMATION','INTERACT_WITH_OBJECT','TRIGGER_EVENT'].includes(action.type))return {ok:false,error:'Aguarde o passeio IRL terminar.'};
 }
 const rt=runtime(state,now);
 let result:{ok:boolean;error?:string}={ok:true};
 switch(action.type){
  case 'IRL':if(state.interaction||state.movement)return {ok:false,error:'Aguarde a animação atual.'};if(action.enabled){if(state.room!=='living')return {ok:false,error:'Inicie na sala.'};state.irl??={enabled:true,startedAt:now,pendingDonuts:0};state.irl.enabled=true;prepareIRLTour(state);}else if(state.irl)state.irl.enabled=false;break;
  case 'TALK':result=say(state,action.character,action.text,now,action.priority??5);break;
  case 'REACT':state.characters[action.character].expression=action.expression;break;
  case 'CHANGE_CAMERA':if(!state.cameras.some(c=>c.id===action.cameraId))return {ok:false,error:'Câmera inexistente.'};state.cameraId=action.cameraId;rt.lastCamera=now;break;
  case 'MOVE_TO_ROOM':if(state.interaction)return {ok:false,error:'Aguarde a interação com a rosquinha terminar.'};result=move(state,action.room,now);break;
  case 'START_GAME':if(state.game?.status==='playing')return {ok:false,error:'Encerre a rodada atual primeiro.'};state.game=createGame(action.game,now);state.tvChannel=4;logEvent(state,'game',`Começou: ${state.game.title}`,now);break;
  case 'STOP_GAME':if(!state.game)return {ok:false,error:'Nenhum jogo em andamento.'};finishGame(state.game);state.game.status='ended';state.game.result='Encerrado pelo operador.';break;
  case 'PLAY_ANIMATION':if(action.activity==='walking')return {ok:false,error:'Use MOVE_TO_ROOM para caminhar em uma rota válida.'};if(state.movement&&action.character==='homer')return {ok:false,error:'Aguarde o deslocamento terminar.'};state.characters[action.character].activity=action.activity;break;
  case 'INTERACT_WITH_OBJECT':{
   if(action.object==='donut'){if(state.room!=='living'||state.movement||state.interaction)return {ok:false,error:'Homer precisa estar livre na sala.'};state.interaction={id:uid('donut',now),kind:'donut',startedAt:now,duration:DONUT_DURATION};state.doors['kitchen-living']=true;}
   else if(action.object==='fridge'){if(state.room!=='kitchen')return {ok:false,error:'A geladeira fica na cozinha.'};state.doors.fridge=!state.doors.fridge;state.homer.hunger=clamp(state.homer.hunger-20);}
   else if(action.object==='tv'){if(state.room!=='living')return {ok:false,error:'A televisão fica na sala.'};state.tvChannel=(state.tvChannel+1)%5;}
   else if(action.object==='lights')state.power=!state.power;
   else if(action.object==='door'||action.object.startsWith('door:')){
    const neighbor=ROOMS.find(r=>r.id===state.room)!.neighbors.find(id=>DOORWAYS[doorId(state.room,id)]);
    const key=action.object==='door'?(neighbor?doorId(state.room,neighbor):''):action.object.slice(5);
    if(!DOORWAYS[key])return {ok:false,error:'Porta inexistente ou identificador não canônico.'};
    const endpoints=key.split('-');if(!endpoints.includes(state.room))return {ok:false,error:'Homer precisa estar em um dos cômodos ligados a essa porta.'};
    const isOpen=state.doors[key]??true;
    if(isOpen&&state.movement){const path=findRoomPath(state.movement.from,state.movement.to)!;if(path.some((room,i)=>i>0&&doorId(path[i-1],room)===key))return {ok:false,error:'Aguarde o deslocamento terminar antes de fechar essa porta.'};}
    state.doors[key]=!isOpen;
   }
   else if(action.object==='sofa'){if(state.room!=='living')return {ok:false,error:'O sofá fica na sala.'};state.characters.homer.activity='sitting';}
   else if(action.object==='bed'){if(state.room!=='parents')return {ok:false,error:'A cama do Homer fica no quarto do casal.'};state.characters.homer.activity='sleeping';}
   else result=triggerEvent(state,state.events.find(e=>e.id==='doorbell')!,now,true);
   if(result.ok)logEvent(state,'object',`Interação: ${action.object}`,now);break;
  }
  case 'RESPOND_TO_FAMILY':result=speakBank(state,action.character,now,'família',4);if(result.ok&&action.character!=='homer')say(state,'homer',`Tudo bem, ${state.characters[action.character].name}. Estou ouvindo!`,now,3);break;
  case 'PAUSE':{
   if(action.paused&&!state.paused)rt.pausedAt=now;
   if(!action.paused&&state.paused){const elapsed=Math.max(0,now-(rt.pausedAt??now));if(state.speaking)state.speaking.createdAt+=elapsed;if(state.game?.status==='playing')state.game.endsAt+=elapsed;if(state.movement)state.movement.startedAt+=elapsed;if(state.interaction)state.interaction.startedAt+=elapsed;if(state.irl)state.irl.startedAt+=elapsed;state.nextFamilyAt+=elapsed;for(const [key,end]of rt.activeEvents)rt.activeEvents.set(key,end+elapsed);rt.lastCamera+=elapsed;rt.lastDecision+=elapsed;rt.lastEventCheck+=elapsed;rt.lastResponse+=elapsed;rt.pausedAt=undefined;}
   state.paused=action.paused;logEvent(state,'system',action.paused?'Operação pausada.':'Operação retomada.',now);break;
  }
  case 'SETTINGS':{
   const settings={...state.settings,...action.settings};if(settings.familyMax<settings.familyMin)return {ok:false,error:'O intervalo máximo deve ser maior que o mínimo.'};
   state.settings=settings;if(action.settings.familyMin!==undefined||action.settings.familyMax!==undefined)state.nextFamilyAt=now+settings.familyMin*1000;
   if(action.settings.mode)logEvent(state,'system',`Modo: ${settings.mode}`,now);break;
  }
  case 'CHARACTER':Object.assign(state.characters[action.character],action.patch);if(action.patch.enabled===false){state.speechQueue=state.speechQueue.filter(s=>s.character!==action.character);if(state.speaking?.character===action.character){state.speaking=null;state.characters[action.character].activity='idle';}}break;
  case 'TRIGGER_EVENT':{const event=state.events.find(e=>e.id===action.eventId);if(!event)return {ok:false,error:'Evento inexistente.'};result=triggerEvent(state,event,now,true);break;}
  case 'UPDATE_EVENT':{const event=state.events.find(e=>e.id===action.eventId);if(!event)return {ok:false,error:'Evento inexistente.'};Object.assign(event,action.patch);break;}
  case 'ADD_CAMERA':if(!safeCamera(action.camera))return {ok:false,error:'Posicione a câmera dentro do cômodo, afastada das paredes.'};if(state.cameras.some(c=>c.id===action.camera.id))return {ok:false,error:'ID de câmera já utilizado.'};state.cameras.push(action.camera);break;
  case 'ADD_LINE':if(state.lines.some(l=>l.id===action.line.id))return {ok:false,error:'ID de fala já utilizado.'};if(state.lines.length>=5000)return {ok:false,error:'Limite de 5.000 falas atingido.'};state.lines.push(action.line);break;
  case 'CHAT':{
   const key=action.user.toLowerCase();if(now-(rt.lastChat.get(key)??-Infinity)<2000)return {ok:false,error:'Aguarde dois segundos entre mensagens.'};
   if(state.chat.slice(-15).some(m=>m.user.toLowerCase()===key&&m.text===action.text&&now-m.at<60000))return {ok:false,error:'Mensagem repetida. Aguarde um minuto.'};
   rt.lastChat.set(key,now);if(rt.lastChat.size>500)rt.lastChat.delete(rt.lastChat.keys().next().value!);
   state.chat.push({id:uid('chat',now),user:action.user,text:action.text,at:now,source:action.source??'local',selected:false,avatarUrl:action.avatarUrl});state.chat=state.chat.slice(-80);
   if(state.game?.status==='playing')submitGameInput(state.game,action.text.replace(/^!(?:letra|resposta|voto)\s+/i,''),action.user,now);break;
  }
  case 'SELECT_CHAT':{const message=state.chat.find(m=>m.id===action.messageId);if(!message)return {ok:false,error:'Mensagem não encontrada.'};message.selected=true;break;}
  case 'GAME_INPUT':if(!state.game)return {ok:false,error:'Inicie um jogo primeiro.'};result=submitGameInput(state.game,action.value,action.user,now);break;
  case 'APPROVE_PROPOSAL':{const proposal=state.proposals.find(p=>p.id===action.id);if(!proposal)return {ok:false,error:'Sugestão não encontrada.'};state.proposals=state.proposals.filter(p=>p.id!==action.id);const previousIds=new Set(state.speechQueue.map(s=>s.id));result=applyAction(state,proposal.action,now);if(result.ok&&proposal.replyTo)for(const speech of state.speechQueue)if(speech.character==='homer'&&!previousIds.has(speech.id))speech.replyTo={...proposal.replyTo};break;}
  case 'SET_TIME':state.virtualHour=action.hour%24;break;
  case 'CLEAR_MEMORY':state.memory=[];state.chat=[];rt.responses.clear();logEvent(state,'memory','Memória de conversa apagada pelo operador.',now);break;
 }
 if(result.ok)state.version++;return result;
}
function familyInteraction(state:LiveState,now:number){
 const available=(['bart','lisa','marge','maggie'] as CharacterId[]).filter(id=>state.characters[id].enabled);
 if(!available.length)return;
 const previous=runtime(state,now).eventSpeaker;const candidates=available.filter(id=>id!==previous);const pool=candidates.length?candidates:available;
 const who=pool[Math.floor(Math.random()*pool.length)];runtime(state,now).eventSpeaker=who;
 const context=state.homer.hunger>70?'comida':state.virtualHour>21?'sono':state.game?.status==='playing'?'atividades':'chat';
 speakBank(state,who,now,context,3);
 if(who!=='maggie'&&state.characters.homer.enabled)speakBank(state,'homer',now,'família',2);
 state.homer.lastFamily=now;
 const clustered=Math.random()<.18;
 const min=clustered?Math.min(60,state.settings.familyMin):state.settings.familyMin;
 const max=clustered?Math.min(120,state.settings.familyMax):state.settings.familyMax;
 state.nextFamilyAt=now+(min+Math.random()*(max-min))*1000;
}
function localResponse(state:LiveState,now:number){
 const rt=runtime(state,now);if(now-rt.lastResponse<state.settings.responseCooldown*1000)return;
 const available=state.chat.filter(m=>!rt.responses.has(m.id)&&now-m.at<180000).sort((a,b)=>(b.priority||0)-(a.priority||0));
 const message=available.find(m=>m.selected)||available.find(m=>/\?|homer|rosquinha|jogo|olá|oi\b/i.test(m.text));
 if(!message||state.speechQueue.length>3)return;
 let response='Essa é uma boa conversa. Vou pensar nisso enquanto procuro uma rosquinha.';
 if(/rosquinha|comida|fome|pizza/i.test(message.text))response='Hmm… agora você falou a minha língua! Uma rosquinha cairia muito bem.';
 else if(/olá|oi\b|boa noite|bom dia|boa tarde/i.test(message.text))response='Olá! Puxe uma cadeira. Só não sente na minha rosquinha.';
 else if(/jogo|forca|quiz/i.test(message.text))response='Um jogo parece divertido! O operador pode escolher uma rodada no painel.';
 else if(/lisa|bart|marge|maggie/i.test(message.text))response='A família inteira está por aqui. Alguém sempre tem alguma coisa para dizer.';
 else if(/trabalho|usina/i.test(message.text))response='O trabalho está ótimo quando eu estou aqui no sofá.';
 // Never interpret chat as code or structured actions; it is untrusted dialogue only.
 const accepted=state.settings.mode==='semi'||say(state,'homer',response,now,message.priority||4).ok;
 if(accepted){
  if(state.settings.mode==='semi'){state.proposals.push({id:uid('proposal',now),action:{type:'TALK',character:'homer',text:response,priority:message.priority||4},reason:'Resposta local sugerida para uma mensagem do chat.',replyTo:{...message}});state.proposals=state.proposals.slice(-8);}
  if(state.settings.mode!=='semi'){const speech=state.speechQueue.find(s=>s.character==='homer'&&s.createdAt===now&&s.text===response);if(speech)speech.replyTo={...message};}
  rt.responses.add(message.id);message.selected=true;rt.lastResponse=now;state.memory.push(`Chat comentou: ${message.text.slice(0,140)} · ${state.settings.mode==='semi'?'Sugestão':'Homer'}: ${response}`);state.memory=state.memory.slice(-30);
 }
 if(rt.responses.size>160)rt.responses=new Set(state.chat.filter(m=>m.selected).map(m=>m.id));
}
function autonomousDecision(state:LiveState,now:number){
 const rt=runtime(state,now);if(now-rt.lastDecision<60000||state.interaction||state.movement||state.speaking||state.game?.status==='playing')return;
 rt.lastDecision=now;
 let action:Action;let reason:string;
 if(state.homer.hunger>72&&state.room!=='kitchen'){action={type:'MOVE_TO_ROOM',room:'kitchen'};reason='Homer está com fome.';}
 else if(state.room==='kitchen'&&state.homer.hunger>45){action={type:'INTERACT_WITH_OBJECT',object:'fridge'};reason='Homer pode pegar comida na cozinha.';}
 else if(state.homer.energy<25&&state.room!=='parents'){action={type:'MOVE_TO_ROOM',room:'parents'};reason='Homer precisa descansar.';}
 else if(state.room==='parents'&&state.homer.energy<35){action={type:'INTERACT_WITH_OBJECT',object:'bed'};reason='A cama está disponível.';}
 else if(Math.random()<.1){action={type:'START_GAME',game:Math.random()<.5?'quiz':'hangman'};reason='Momento de uma atividade breve com o chat.';}
 else if(Math.random()<.2&&state.room!=='living'){action={type:'MOVE_TO_ROOM',room:'living'};reason='Voltar para a família.';}
 else {const line=selectLine(state,'homer',state.homer.hunger>60?'comida':'chat');if(!line)return;action={type:'TALK',character:'homer',text:line.text,priority:2};reason='Continuar a conversa durante um intervalo.';}
 if(state.settings.mode==='semi'){state.proposals.push({id:uid('proposal',now),action,reason});state.proposals=state.proposals.slice(-8);}
 else applyAction(state,action,now);
}
export function tick(state:LiveState,now=Date.now(),dtMs=1000):void{
 if(state.paused)return;
 const rt=runtime(state,now),dt=Math.min(Math.max(dtMs,0),10000)/1000;
 if(state.settings.timeMode==='real'){const date=new Date(now);state.virtualHour=date.getHours()+date.getMinutes()/60;}
 else if(state.settings.timeMode==='accelerated')state.virtualHour=(state.virtualHour+dt*state.settings.timeScale/3600)%24;
 const sleeping=state.characters.homer.activity==='sleeping';
 state.homer.energy=clamp(state.homer.energy+dt*(sleeping?.12:-.012));state.homer.hunger=clamp(state.homer.hunger+dt*.018);
 state.homer.sleep=clamp(state.homer.sleep+dt*(sleeping?-.14:state.virtualHour>21||state.virtualHour<6?.025:.006));
 state.homer.attention=clamp(state.homer.energy*.65+state.homer.mood*.35);
 if(state.movement&&now>=state.movement.startedAt+state.movement.duration){
  state.room=state.movement.to;state.characters.homer.room=state.room;state.characters.homer.activity='idle';state.movement=null;
  state.cameraId=state.cameras.find(c=>c.room===state.room&&c.type==='wide')?.id??state.cameraId;rt.lastCamera=now;logEvent(state,'movement',`Homer chegou: ${ROOMS.find(r=>r.id===state.room)!.name}`,now);
 }
 if(state.irl&&!state.interaction){const tour=state.irl;state.room=tourPose(now-tour.startedAt,tour.plan).room;state.characters.homer.room=state.room;if(now-tour.startedAt>=(tour.plan?.duration||IRL_DURATION)){state.room='living';state.characters.homer.room='living';if(tour.pendingDonuts){tour.pendingDonuts--;state.interaction={id:uid('donut',now),kind:'donut',startedAt:now,duration:DONUT_DURATION};tour.startedAt=now+DONUT_DURATION;}else if(!tour.enabled){state.irl=undefined;rt.lastCamera=now;}else {tour.startedAt=now;tour.stopIndex=(tour.stopIndex||0)+1;prepareIRLTour(state);}}}
 if(state.interaction){state.room=donutPose(now-state.interaction.startedAt).room;state.characters.homer.room=state.room;}
 if(state.interaction&&now>=state.interaction.startedAt+state.interaction.duration){state.interaction=undefined;state.room='living';state.characters.homer.room='living';rt.lastCamera=now;state.homer.hunger=clamp(state.homer.hunger-15);logEvent(state,'object','Homer pegou a rosquinha e voltou ao seu lugar.',now);}
 if(state.speaking&&now>=state.speaking.createdAt+state.speaking.duration){const who=state.speaking.character;if(state.characters[who].activity==='talking')state.characters[who].activity=rt.speechActivity?.character===who?rt.speechActivity.activity:who==='homer'&&state.room!=='living'?'idle':'sitting';state.speaking=null;}
 if(!state.interaction&&!state.speaking&&state.speechQueue.length){
  const speech=state.speechQueue.shift()!;if(state.characters[speech.character].enabled){speech.createdAt=now;rt.speechActivity={character:speech.character,activity:state.characters[speech.character].activity};state.speaking=speech;if(!state.movement||speech.character!=='homer')state.characters[speech.character].activity='talking';
   if(!state.irl&&!state.interaction&&state.settings.autoCamera&&state.settings.mode!=='manual'&&!state.movement&&now-rt.lastCamera>8000){const room=state.characters[speech.character].room;const current=state.cameras.find(c=>c.id===state.cameraId);if(current?.room!==room||!['wide','frontal'].includes(current.type))state.cameraId=state.cameras.find(c=>c.room===room&&c.type==='frontal')?.id??state.cameraId;rt.lastCamera=now;}
  }
 }
 for(const [eventId,end]of rt.activeEvents){if(now>=end){rt.activeEvents.delete(eventId);if(eventId==='rain')state.weather='clear';if(eventId==='power'||eventId==='lights')state.power=true;if(eventId==='fridge')state.doors.fridge=false;if(eventId==='sleep'){state.characters.homer.activity='sitting';state.characters.homer.expression='neutral';}}}
 if(state.game){tickGame(state.game,now);if(state.game.status!=='playing'&&rt.gameResult!==state.game.id){
  rt.gameResult=state.game.id;logEvent(state,'game',state.game.result||'Rodada encerrada.',now);
  if(state.game.type==='poll'&&state.game.score>0&&state.game.result!=='Encerrado pelo operador.') {
   const winner=Object.entries(state.game.votes).sort((a,b)=>b[1]-a[1])[0]?.[0];
   const action:Action=winner==='0'?{type:'MOVE_TO_ROOM',room:'kitchen'}:winner==='1'?{type:'INTERACT_WITH_OBJECT',object:'tv'}:{type:'INTERACT_WITH_OBJECT',object:'sofa'};
   if(state.settings.mode==='auto'){const result=applyAction(state,action,now);if(!result.ok)logEvent(state,'game',`Escolha do público não executada: ${result.error}`,now);}
   else if(state.settings.mode==='semi'){state.proposals.push({id:uid('proposal',now),action,reason:'Atividade escolhida pela votação do público.'});state.proposals=state.proposals.slice(-8);}
  }
 }}
 if(state.irl&&!state.interaction&&state.settings.mode!=='manual'&&state.settings.aiEnabled&&state.settings.provider==='demo')localResponse(state,now);
 if(state.settings.mode!=='manual'&&!state.interaction&&!state.irl){
  if(state.settings.familyEnabled&&now>=state.nextFamilyAt&&!state.speaking&&!state.movement&&state.speechQueue.length<2)familyInteraction(state,now);
  if(state.settings.eventsEnabled&&now-rt.lastEventCheck>=30000){rt.lastEventCheck=now;const possible=state.events.filter(e=>!eventPossible(state,e,now));for(const event of possible.sort(()=>Math.random()-.5)){if(Math.random()<event.probability){triggerEvent(state,event,now);break;}}}
  if(state.settings.aiEnabled){if(state.settings.provider==='demo')localResponse(state,now);autonomousDecision(state,now);}
  if(!state.irl&&!state.interaction&&state.settings.autoCamera&&!state.movement&&!state.speaking&&now-rt.lastCamera>=state.settings.cameraInterval*1000){const candidates=state.cameras.filter(c=>c.room===state.room&&c.id!==state.cameraId&&c.type!=='first-person');if(candidates.length)state.cameraId=candidates[Math.floor(Math.random()*candidates.length)].id;rt.lastCamera=now;}
 }
 if(now-rt.lastSummary>=300000){rt.lastSummary=now;const summary=`${new Date(now).toLocaleTimeString('pt-BR')}: ${ROOMS.find(r=>r.id===state.room)!.name}; humor ${Math.round(state.homer.mood)}; ${state.logs.slice(0,3).map(l=>l.message).join(' / ')}`;state.memory.push(summary);state.memory=state.memory.slice(-30);}
 state.version++;
}

/** Each excursion starts and ends at the existing presenter mark, retaining safe gift handoff. */
function prepareIRLTour(state:LiveState){
 const tour=state.irl!;const stops=ROOMS.filter(r=>r.id!=='living');const destination=stops[(tour.stopIndex||0)%stops.length].id;
 const route=movementWaypoints('living',destination);if(!route)return;
 tour.plan=makeIRLPlan([[-.1,0,1.5],[1.65,0,1.5],[3.7,0,1.8],...route],destination);
 const rooms=findRoomPath('living',destination)!;for(let i=1;i<rooms.length;i++){const id=doorId(rooms[i-1],rooms[i]);if(DOORWAYS[id])state.doors[id]=true;}
}
