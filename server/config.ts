import {existsSync,readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
import {resolve} from 'node:path';
export type Env=Record<string,string|undefined>;
export function loadEnvironment(directory=process.cwd(), inherited:Env=process.env):Env {
 const files:Env={};for(const name of ['.env','.env.local']){const p=resolve(directory,name);if(existsSync(p))Object.assign(files,parseEnv(readFileSync(p,'utf8')))}
 return {...files,...inherited};
}
export function ttsOrder(env:Env):string[]{return [...new Set([env.TTS_PRIMARY||env.TTS_PROVIDER||(env.FISH_API_KEY?'fish':'openai'),env.TTS_SECONDARY||'none'])].filter(x=>x!=='none')}
export function configured(env:Env,p:string){return p==='fish'?!!env.FISH_API_KEY:p==='openai'?!!(env.TTS_API_KEY||env.OPENAI_API_KEY):false}
export function configurationWarnings(env:Env):string[]{
 const warnings:string[]=[];
 if(!env.AI_API_KEY&&!env.OPENAI_API_KEY)warnings.push('IA: preencha AI_API_KEY; modo local permanece disponível.');
 for(const p of ttsOrder(env)){if(!['fish','openai'].includes(p))warnings.push('TTS: seletor inválido; use fish, openai ou none (secundário).');else if(!configured(env,p))warnings.push(`${p}: falta ${p==='fish'?'FISH_API_KEY':'TTS_API_KEY (ou OPENAI_API_KEY)'}.`)}
 for(const [key,min,max] of [['TTS_TIMEOUT_MS',100,30000],['TTS_SPEED',.25,4],['FISH_SPEED',.5,2]] as const){if(env[key]&&(!Number.isFinite(Number(env[key]))||Number(env[key])<min||Number(env[key])>max))warnings.push(`${key}: valor inválido; usando padrão seguro.`)}
 for(const key of ['AI_BASE_URL','TTS_BASE_URL','OPENAI_BASE_URL'])if(env[key]){try{const u=new URL(env[key]!);if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw Error()}catch{warnings.push(`${key}: URL inválida; chamadas deste provedor serão rejeitadas.`)}}
 if(ttsOrder(env).includes('fish')&&!env.FISH_REFERENCE_ID&&!env.FISH_REFERENCE_ID_HOMER)warnings.push('Fish: referência de voz ausente; o sotaque da voz padrão não é garantido.');
 return warnings;
}
export function numeric(env:Env,key:string,fallback:number,min:number,max:number){const n=Number(env[key]);return env[key]&&Number.isFinite(n)&&n>=min&&n<=max?n:fallback}
