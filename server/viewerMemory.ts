import {createHash} from 'node:crypto';
import type {ChatMessage} from '../shared/types.ts';
export function viewerKey(id:unknown){return typeof id==='string'&&/^[0-9]{1,30}$/.test(id)?createHash('sha256').update(`tiktok:${id}`).digest('hex'):undefined;}
// Store only explicitly requested harmless interests from a small vocabulary, never raw messages.
const TOPICS=['rosquinhas','pizza','futebol','matemática','música','videogames','cinema','ciência','simpsons','livros','cozinha','saxofone'];
export function preferences(text:string){
 if(!/\b(lembre|lembra|guarde|memorize)\b/i.test(text)||!/\b(gosto|adoro|curto|prefiro)\b/i.test(text)||/\b(não|nao|nunca|odeio)\b/i.test(text))return [];
 const normalized=text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 return TOPICS.filter(t=>new RegExp(`\\b${t.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}\\b`,'i').test(normalized)).slice(0,3);
}
export interface ViewerMemory {key:string;name:string;visits:number;lastSeen:number;preferences:string[]}
export function participantKey(message:ChatMessage){return message.viewerKey?`tiktok:${message.viewerKey}`:`${message.source}:${message.user}`;}
