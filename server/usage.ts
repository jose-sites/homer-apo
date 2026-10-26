import type {Settings} from '../shared/types.ts';
export type UsageKind='ai'|'fish'|'openai';
export interface Usage {startedAt:number;ai:number;fish:number;openai:number;characters:number;estimatedUSD:number}
export const emptyUsage=():Usage=>({startedAt:Date.now(),ai:0,fish:0,openai:0,characters:0,estimatedUSD:0});
export class UsageLimitError extends Error{}
/** Conservative reservations BEFORE a paid request; failed requests count too. Not a billing invoice. */
export class UsageMeter{
 constructor(public value:Usage,private settings:()=>Settings,private save:(usage:Usage)=>void){}
 reserve(kind:UsageKind,characters=0){
  const s=this.settings(),v=this.value,aiLimit=s.aiRequestLimit??300,ttsLimit=s.ttsRequestLimit??600;
  const cost=kind==='ai'?(s.aiEstimatedPerCall??0):characters/1000*(kind==='fish'?(s.fishEstimatedPer1k??0):(s.openaiEstimatedPer1k??0));
  if(kind==='ai'?v.ai>=aiLimit:v.fish+v.openai>=ttsLimit)throw new UsageLimitError('Limite de chamadas desta live atingido. Ajuste o limite ou inicie uma nova contagem em Configurações.');
  if((s.budgetUSD??0)>0){
   if(cost<=0)throw new UsageLimitError('Informe as estimativas de preço antes de ativar o orçamento em dólares.');
   if(v.estimatedUSD+cost>s.budgetUSD!)throw new UsageLimitError('Limite de orçamento estimado atingido.');
  }
  const next={...v,[kind]:v[kind]+1,characters:v.characters+(kind==='ai'?0:characters),estimatedUSD:v.estimatedUSD+cost};
  this.save(next);this.value=next;
 }
 reset(){const next=emptyUsage();this.save(next);this.value=next;}
 info(){const s=this.settings();return {...this.value,aiLimit:s.aiRequestLimit??300,ttsLimit:s.ttsRequestLimit??600,budgetUSD:s.budgetUSD??0,warning:this.value.ai>=(s.aiRequestLimit??300)*.8||this.value.fish+this.value.openai>=(s.ttsRequestLimit??600)*.8||!!s.budgetUSD&&this.value.estimatedUSD>=s.budgetUSD*.8};}
}
