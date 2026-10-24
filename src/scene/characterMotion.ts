import type {CharacterId} from '../../shared/types';
export const GESTURES=['explain','point','agree','celebrate','surprise','doubt','irritation'] as const;
export type Gesture=typeof GESTURES[number];
export const RIG:Record<CharacterId,{shoulders:[number,number,number];head:[number,number];elbow:number;hand:number}>={homer:{shoulders:[78,220,207],head:[150,173],elbow:245,hand:277},marge:{shoulders:[120,180,236],head:[150,222],elbow:276,hand:315},bart:{shoulders:[105,195,225],head:[150,204],elbow:250,hand:280},lisa:{shoulders:[118,182,228],head:[150,216],elbow:252,hand:282},maggie:{shoulders:[113,184,245],head:[150,235],elbow:267,hand:284}};
export function chooseGesture(text:string,seed:number,previous?:Gesture):Gesture{
 let g:Gesture=/!|viva|conseguimos/i.test(text)?'celebrate':/não acredito|surpresa|uau/i.test(text)?'surprise':/talvez|será|\?/i.test(text)?'doubt':/chega|irrit|pare/i.test(text)?'irritation':/isso|ali|olha/i.test(text)?'point':/sim|concordo|exato/i.test(text)?'agree':GESTURES[Math.abs(seed)%GESTURES.length];
 if(g===previous)g=GESTURES[(GESTURES.indexOf(g)+1)%GESTURES.length];return g;
}
export function gesturePose(g:Gesture,time:number,level:number){
 // Deliberate phrases separated by resting beats, with smoothly eased onset/release.
 const phase=time%4.7;const envelope=Math.sin(Math.PI*Math.min(1,phase/3.3))**2*(phase<3.3?1:0);
 const a=Math.min(1,Math.max(0,level));const strength=envelope*(.7+.3*a);
 const poses:Record<Gesture,number[]>={explain:[-.45,.5,-.7,.8,.03],point:[-.1,1.25,-.15,.25,-.04],agree:[-.18,.2,-.3,.35,.065],celebrate:[-1.8,1.8,-.5,.5,-.025],surprise:[-.9,.9,-1,1,-.06],doubt:[-.25,.7,-.2,1.3,.09],irritation:[-.55,.55,-.8,.8,-.04]};
 return poses[g].map(x=>x*strength);
}
export function damp(current:number,target:number,dt:number){return current+(target-current)*(1-Math.exp(-Math.min(1,Math.max(0,dt))*9))}
