import {DONUT_ROUTE,pointAlong} from './homerMotion';
export const IRL_DURATION=44000;
export function irlPose(elapsed:number){const t=Math.max(0,Math.min(IRL_DURATION,elapsed)),back=t>=24000;const p=pointAlong(back?[...DONUT_ROUTE].reverse():DONUT_ROUTE,back?(t-24000)/18000:Math.min(1,t/19000));return {...p,walking:t<19000||(back&&t<42000),room:p.position[0]<-5?'kitchen':'living',destination:back?'living':'kitchen'};}

import {ROOMS} from './data';
import type {Vec3} from './types';
export interface IRLPlan {path:Vec3[];destination:string;travel:number;duration:number}
export function makeIRLPlan(path:Vec3[],destination:string):IRLPlan{const length=path.slice(1).reduce((n,p,i)=>n+Math.hypot(...p.map((v,j)=>v-path[i][j])),0),travel=Math.ceil(Math.max(6000,length/1.05*1000));return {path,destination,travel,duration:travel*2+7000};}
export function tourPose(elapsed:number,plan?:IRLPlan){
 if(!plan)return irlPose(elapsed);
 const t=Math.max(0,elapsed),back=t>=plan.travel+5000,progress=back?(t-plan.travel-5000)/plan.travel:t/plan.travel;
 const p=pointAlong(back?[...plan.path].reverse():plan.path,progress);
 const room=ROOMS.filter(r=>Math.abs(r.origin[1]-p.position[1])<1.9&&Math.abs(r.origin[0]-p.position[0])<=r.size[0]/2&&Math.abs(r.origin[2]-p.position[2])<=r.size[1]/2).sort((a,b)=>Math.abs(a.origin[1]-p.position[1])-Math.abs(b.origin[1]-p.position[1]))[0]?.id||(back?'living':plan.destination);
 return {...p,room,destination:back?'living':plan.destination,walking:t<plan.travel||(back&&t<plan.duration-2000)};
}
