import type {Vec3} from './types';
export const HOMER_HOME:Vec3=[-.1,0,1.5];
export const DONUT_SPOT:Vec3=[.3,.81,-.1];
export const DONUT_DURATION=12000;
const route:Vec3[]=[HOMER_HOME,[-.1,0,1.1],[.3,0,1.1],[.3,0,1.0]];
export function pointAlong(path:Vec3[],progress:number):{position:Vec3;direction:Vec3}{
 const lengths=path.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-path[i][j])));let d=Math.min(1,Math.max(0,progress))*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const a=path[i],b=path[i+1],t=lengths[i]?Math.min(1,d/lengths[i]):1;return {position:a.map((v,j)=>v+(b[j]-v)*t)as Vec3,direction:b.map((v,j)=>v-a[j])as Vec3}}d-=lengths[i]}return {position:path[0],direction:[0,0,1]};
}
export function donutPose(elapsed:number){
 const t=Math.max(0,elapsed);const walking=t<3500||(t>8000&&t<12000);
 const path=t>8000?[...route].reverse():route;const p=pointAlong(path,t>8000?(t-8000)/4000:Math.min(1,t/3500));
 return {...p,walking,phase:t<3500?'walk':t<4700?'reach':t<7500?'eat':t<8000?'settle':t<12000?'return':'done',held:t>=4700&&t<7500,taken:t>=4700};
}
