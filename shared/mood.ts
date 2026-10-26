import type {LiveState} from './types';
export type Feeling='animado'|'confuso'|'impaciente'|'sonolento'|'curioso'|'satisfeito';
export function feeling(s:LiveState,now=Date.now()):Feeling{
 if(s.characters.homer.expression==='confused'&&s.feeling!=='confuso')return 'confuso';
 if(s.homer.sleep>65||s.homer.energy<25)return 'sonolento';
 if(s.homer.hunger>75)return 'impaciente';
 if(s.logs.some(l=>l.type==='object'&&/pegou a rosquinha|bebeu água/.test(l.message)&&now-l.at<180000))return 'satisfeito';
 if(s.chat.filter(m=>now-m.at<60000).length>=3)return 'animado';
 return 'curioso';
}
export function idleMood(s:LiveState,now:number){
 if(s.interaction||s.movement||s.irl||s.speaking||s.speechQueue.length||s.characters.homer.activity!=='idle'&&s.characters.homer.activity!=='sitting')return;
 if(now-(s.lastMoodAt||0)<30000)return;s.lastMoodAt=now;
 const mood=feeling(s,now);s.feeling=mood;
 s.characters.homer.expression=mood==='sonolento'?'sleepy':mood==='animado'||mood==='satisfeito'?'happy':mood==='impaciente'?'angry':mood==='confuso'?'confused':'neutral';
}
