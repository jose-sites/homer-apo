import type {Action} from './types';
/** Operator text only. Never execute code or use this parser for TikTok messages. */
export function operatorIntent(text:string):Action|undefined{
 const t=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 if(!/\b(vai|va|volta|volte|beba|beber|coma|comer|ir|retorne|retorna|pegue|pega|tome|toma|tomar)\b/.test(t))return;
 if(/\bagua\b/.test(t))return {type:'INTERACT_WITH_OBJECT',object:'water'};
 if(/rosquinha/.test(t))return {type:'INTERACT_WITH_OBJECT',object:'donut'};
 if(/cozinha/.test(t))return {type:'MOVE_TO_ROOM',room:'kitchen'};
 if(/sala/.test(t))return {type:'MOVE_TO_ROOM',room:'living'};
}
