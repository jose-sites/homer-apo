import {ttsOrder,type Env} from './config.ts';
import {applyAction} from '../shared/engine.ts';
import type {LiveState} from '../shared/types.ts';
/** Configuration only: never synthesize paid audio to probe readiness. */
export function liveRequirements(env:Env){
 const missing:string[]=[];
 if(!env.AI_API_KEY&&!env.OPENAI_API_KEY)missing.push('AI_API_KEY ou OPENAI_API_KEY');
 if(!env.FISH_API_KEY)missing.push('FISH_API_KEY');
 if(!env.FISH_REFERENCE_ID_HOMER&&!env.FISH_REFERENCE_ID)missing.push('FISH_REFERENCE_ID_HOMER (voz escolhida)');
 if(ttsOrder(env)[0]!=='fish')missing.push('TTS_PRIMARY=fish');
 if(env.TIKTOK_ENABLED!=='true')missing.push('TIKTOK_ENABLED=true');
 if(!env.TIKTOK_USERNAME?.trim())missing.push('TIKTOK_USERNAME');
 return missing;
}
export function activateLiveConversation(state:LiveState){
 applyAction(state,{type:'SETTINGS',settings:{mode:'auto',aiEnabled:true,provider:'openai-compatible',ttsProvider:'openai-compatible'}});
 applyAction(state,{type:'PAUSE',paused:false});
}

/** Credentials select actual providers even when an old SQLite snapshot saved demo mode. */
export function selectConfiguredProviders(state:LiveState,env:Env){
 if(env.HOMER_DEMO==='true')return;
 if(env.AI_API_KEY?.trim()||env.OPENAI_API_KEY?.trim())state.settings.provider='openai-compatible';
 if(state.settings.ttsProvider!=='silent'&&(env.FISH_API_KEY?.trim()||env.TTS_API_KEY?.trim()||env.OPENAI_API_KEY?.trim()))state.settings.ttsProvider='openai-compatible';
}
