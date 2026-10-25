import type {LiveState,Vec3} from '../../shared/types';
export const IDLE_GESTURES=['look','head-scratch','belly-scratch','stretch','yawn','shrug','posture'] as const;
export type IdleGesture=typeof IDLE_GESTURES[number];
export function canIdle(state:LiveState,audioPlaying=false){return state.characters.homer.enabled&&!state.paused&&state.room==='living'&&!audioPlaying&&!state.speaking&&!state.speechQueue.length&&!state.interaction&&!state.movement&&state.characters.homer.activity!=='sleeping'&&(!state.game||state.game.status!=='playing');}
/** Local cosmetic clock: no AI/TTS requests, no state mutations, no camera changes. */
export class IdleDirector{
 private next=12;private active:{kind:IdleGesture;start:number;duration:number}|null=null;private recent:IdleGesture[]=[];
 constructor(private random= Math.random){}
 sample(time:number,allowed:boolean){
  if(!allowed){this.active=null;this.next=time+12;return null;}
  if(this.active&&time>=this.active.start+this.active.duration){this.active=null;this.next=time+14+this.random()*18;}
  if(!this.active&&time>=this.next){const choices=IDLE_GESTURES.filter(g=>!this.recent.includes(g));const kind=choices[Math.min(choices.length-1,Math.floor(this.random()*choices.length))];this.recent=[...this.recent,kind].slice(-3);this.active={kind,start:time,duration:3.5+this.random()*2};}
  return this.active?{kind:this.active.kind,progress:(time-this.active.start)/this.active.duration}:null;
 }
}
export function idlePose(kind:IdleGesture,progress:number){
 const p=Math.max(0,Math.min(1,progress)),weight=Math.sin(Math.PI*p)**2,wave=Math.sin(p*Math.PI*4);
 let hand:Vec3|undefined;
 if(kind==='head-scratch')hand=[-.28+wave*.025,1.72,.12];
 if(kind==='belly-scratch')hand=[-.2+wave*.035,1.02,.48];
 if(kind==='yawn')hand=[.03,1.45,.48];
 return {weight,hand,headYaw:kind==='look'?Math.sin(p*Math.PI*2)*.38:0,headTilt:kind==='head-scratch'?.09:kind==='shrug'?-.07:0,chest:kind==='stretch'?-.055:kind==='posture'?.035:0,shoulder:kind==='stretch'?.42:kind==='shrug'?.19:0};
}
