import {viewerKey} from './viewerMemory';
import {randomUUID} from 'node:crypto';
import type {LiveState} from '../shared/types';
import {applyAction} from '../shared/engine';
export const GIFTS={rose:['Rose',1],dino:['Tiny Diny',10],donut:['Doughnut',30],heart:['Hand Heart',100]}as const;
export class TikTokBridge{
 private connection:any;private seen=new Set<string>();private lastGift=new Map<string,number>();private mappings=new Map<string,keyof typeof GIFTS>();private pendingRose=new Set<string>();private busy=false;private wanted=false;private attempt=0;private retry?:ReturnType<typeof setTimeout>;private generation=0;
 status='desconectado';pendingEnd:{id:string;user:string;expiresAt:number}|null=null;
 constructor(private state:LiveState,private env:NodeJS.ProcessEnv,private notify:()=>void,private onViewer:(key:string,user:string,text:string)=>void=()=>{},private connector?:()=>Promise<{create:()=>any;events:{error:string;disconnected:string;chat:string;gift:string}}>,private retryDelay=5000){}
 catalog(rows:any[]){this.mappings.clear();for(const [key,[name,coins]]of Object.entries(GIFTS)){const matches=rows.filter(g=>g.name===name&&Number(g.diamond_count)===coins);if(matches.length===1&&matches[0].id)this.mappings.set(String(matches[0].id),key as keyof typeof GIFTS)}return Object.fromEntries(this.mappings)}
 private once(id:string){if(!id||this.seen.has(id))return false;this.seen.add(id);if(this.seen.size>2000)this.seen.delete(this.seen.values().next().value!);return true}
 chat(id:string,user:string,text:string,real=true,avatar?:string,stableId?:string){if(!this.once('chat:'+id))return;const result=applyAction(this.state,{type:'CHAT',user:user.slice(0,30),text:text.slice(0,280),source:real?'tiktok':'test',...(avatar?.startsWith('https://')?{avatarUrl:avatar}: {})});if(result.ok){const message=this.state.chat.at(-1)!;message.selected=true;const key=real?viewerKey(stableId):undefined;if(key){message.viewerKey=key;this.onViewer(key,user,text);}if(this.pendingRose.delete(user)){message.priority=9;}}this.notify();}
 gift(id:string,user:string,gift:keyof typeof GIFTS){if(!this.once('gift:'+id)||this.state.paused)return;const now=Date.now(),key=user+gift;if(now-(this.lastGift.get(key)||0)<3000)return;this.lastGift.set(key,now);if(this.lastGift.size>500)this.lastGift.delete(this.lastGift.keys().next().value!);
 if(gift==='rose'){const m=[...this.state.chat].reverse().find(m=>m.user===user);if(m){m.selected=true;m.priority=9;for(const s of this.state.speechQueue)if(s.replyTo?.id===m.id)s.priority=9;this.state.speechQueue.sort((a,b)=>b.priority-a.priority);}else{this.pendingRose.add(user);if(this.pendingRose.size>200)this.pendingRose.delete(this.pendingRose.values().next().value!);}}
 if(gift==='dino')applyAction(this.state,{type:'TALK',character:'homer',text:`Um salve para ${user.slice(0,30)}! Obrigado pela companhia!`,priority:6});
 if(gift==='donut')applyAction(this.state,{type:'INTERACT_WITH_OBJECT',object:'donut'});
 if(gift==='heart'){this.pendingEnd={id:randomUUID(),user,expiresAt:now+60000};this.state.logs.unshift({id:randomUUID(),at:now,type:'confirmation',message:'Coração recebido: solicitação de encerramento aguarda confirmação do operador (60 s).'});}
 this.notify();}
 receiveChat(d:any){const user=d.user?.displayId;if(d.common?.msgId&&typeof user==='string'&&typeof d.content==='string')this.chat(String(d.common.msgId),user,d.content,true,d.user.avatarThumb?.urlList?.[0],typeof d.user.idStr==='string'?d.user.idStr:undefined);}
 receiveGift(d:any){if((d.gift?.combo||d.gift?.type===1)&&!d.repeatEnd)return;const gift=this.mappings.get(String(d.giftId));if(gift&&d.user?.displayId&&d.common?.msgId)this.gift(String(d.common.msgId),d.user.displayId,gift);}
 confirm(id:string){if(!this.pendingEnd||this.pendingEnd.id!==id||Date.now()>this.pendingEnd.expiresAt)return false;this.pendingEnd=null;applyAction(this.state,{type:'PAUSE',paused:true});this.stop();this.state.logs.unshift({id:randomUUID(),at:Date.now(),type:'system',message:'Operação local pausada por confirmação. Encerre a transmissão no TikTok Live Studio; nenhuma API de encerramento foi acionada.'});this.notify();return true;}
 private schedule(){
  if(!this.wanted||this.retry||this.attempt>=8){if(this.wanted&&this.attempt>=8){this.status='reconexão esgotada; tente conectar manualmente';this.notify();}return;}
  const delay=Math.min(60000,this.retryDelay*2**this.attempt++);this.status=`reconectando em ${Math.ceil(delay/1000)}s (${this.attempt}/8)`;this.notify();
  this.retry=setTimeout(()=>{this.retry=undefined;void this.connect().catch(()=>{});},delay);this.retry.unref?.();
 }
 async start(){
  if(this.env.TIKTOK_ENABLED!=='true')throw Error('Defina TIKTOK_ENABLED=true para permitir conexão.');
  if(!this.env.TIKTOK_USERNAME)throw Error('Falta TIKTOK_USERNAME.');
  if(this.busy||this.connection)throw Error('Conexão já iniciada.');
  if(this.retry)clearTimeout(this.retry);this.retry=undefined;this.attempt=0;this.wanted=true;await this.connect();
 }
 private async connect(){
  if(!this.wanted||this.busy)return;this.busy=true;const generation=this.generation;
  try{
   const loaded=this.connector?await this.connector():await import('tiktok-live-connector').then(({TikTokLiveConnection,WebcastEvent,ControlEvent})=>({create:()=>new TikTokLiveConnection(this.env.TIKTOK_USERNAME!,{processInitialData:false,enableExtendedGiftInfo:true,...(this.env.TIKTOK_SIGN_API_KEY?{signApiKey:this.env.TIKTOK_SIGN_API_KEY}:{})}),events:{error:ControlEvent.ERROR,disconnected:ControlEvent.DISCONNECTED,chat:WebcastEvent.CHAT,gift:WebcastEvent.GIFT}}));
   if(!this.wanted||generation!==this.generation)return;
   const c=loaded.create();this.connection=c;
   const lost=()=>{if(this.connection!==c)return;this.connection=null;this.mappings.clear();c.disconnect();this.schedule();};
   c.on(loaded.events.error,lost);c.on(loaded.events.disconnected,lost);
   c.on(loaded.events.chat,(d:any)=>{if(this.connection===c)this.receiveChat(d)});c.on(loaded.events.gift,(d:any)=>{if(this.connection===c)this.receiveGift(d)});
   await c.connect();if(this.connection!==c||!this.wanted){c.disconnect();return;}
   const catalog=await c.fetchAvailableGifts();if(this.connection!==c)return;this.catalog(catalog);this.status='conectado';this.attempt=0;this.notify();
  }catch{
   if(generation===this.generation){const c=this.connection;this.connection=null;this.mappings.clear();c?.disconnect();this.status='falha: confira usuário, live ativa e acesso ao serviço de assinatura';this.schedule();}
   throw Error(this.status);
  }finally{this.busy=false;}
 }
 stop(){this.wanted=false;this.generation++;if(this.retry)clearTimeout(this.retry);this.retry=undefined;this.attempt=0;const c=this.connection;this.connection=null;this.mappings.clear();c?.disconnect();this.status='desconectado';this.notify()}
 info(){return {status:this.status,reconnecting:!!this.retry,attempt:this.attempt,gifts:Object.fromEntries(this.mappings),pendingEnd:this.pendingEnd&&this.pendingEnd.expiresAt>Date.now()?this.pendingEnd:null,official:false}}
}
