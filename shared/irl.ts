import {DONUT_ROUTE,pointAlong} from './homerMotion';
export const IRL_DURATION=44000;
export function irlPose(elapsed:number){const t=Math.max(0,Math.min(IRL_DURATION,elapsed)),back=t>=24000;const p=pointAlong(back?[...DONUT_ROUTE].reverse():DONUT_ROUTE,back?(t-24000)/18000:Math.min(1,t/19000));return {...p,walking:t<19000||(back&&t<42000),room:p.position[0]<-5?'kitchen':'living',destination:back?'living':'kitchen'};}
