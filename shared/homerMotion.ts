import type {Vec3} from './types';
export const HOMER_HOME:Vec3=[-.1,0,1.5];
export const DONUT_SPOT:Vec3=[-9.85,1.01,.3];
export const DONUT_DURATION=38000;
export const DONUT_TIMES={turn:1800,arrive:14000,pickup:16000,carry:18500,eaten:23000,return:24500,home:37000};
export const DONUT_BITE_TARGET:Vec3=[.02,1.43,.43];
// Rounded corners stay within the existing furniture aisle and the doorway at (-5, -2.4).
const corners:Vec3[]=[HOMER_HOME,[1.65,0,1.5],[1.65,0,-1.35],[-4.15,0,-1.35],[-4.15,0,-2.4],[-5.8,0,-2.4],[-6.1,0,-1.45],[-8.95,0,-1.45],[-8.95,0,.3]];
const mix=(a:Vec3,b:Vec3,t:number)=>a.map((v,i)=>v+(b[i]-v)*t)as Vec3;
function roundedRoute(points:Vec3[]){const out:Vec3[]=[points[0]];for(let i=1;i<points.length-1;i++){const p=points[i],a=points[i-1],b=points[i+1];const dist=(q:Vec3)=>Math.hypot(...q.map((v,j)=>v-p[j]));const radius=Math.min(.25,dist(a)/3,dist(b)/3),entry=mix(p,a,radius/dist(a)),exit=mix(p,b,radius/dist(b));out.push(entry);for(let j=1;j<=12;j++){const t=j/12;out.push(mix(mix(entry,p,t),mix(p,exit,t),t));}}out.push(points.at(-1)!);return out;}
export const DONUT_ROUTE=roundedRoute(corners);
export function pointAlong(path:Vec3[],progress:number):{position:Vec3;direction:Vec3}{
 const lengths=path.slice(1).map((p,i)=>Math.hypot(...p.map((v,j)=>v-path[i][j])));let d=Math.min(1,Math.max(0,progress))*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){if(d<=lengths[i]||i===lengths.length-1){const a=path[i],b=path[i+1],t=lengths[i]?Math.min(1,d/lengths[i]):1;return {position:a.map((v,j)=>v+(b[j]-v)*t)as Vec3,direction:b.map((v,j)=>v-a[j])as Vec3}}d-=lengths[i]}return {position:path[0],direction:[0,0,1]};
}
export function donutPose(elapsed:number){
 const t=Math.max(0,elapsed),T=DONUT_TIMES;
 const returning=t>=T.return,walking=t>=T.turn&&t<T.arrive||returning&&t<T.home;
 const p=pointAlong(returning?[...DONUT_ROUTE].reverse():DONUT_ROUTE,returning?(t-T.return)/(T.home-T.return):(t-T.turn)/(T.arrive-T.turn));
 if(t>=T.home)p.position=[...HOMER_HOME];
 if(t<T.turn){const angle=Math.PI/2*smooth(0,T.turn,t);p.direction=[Math.sin(angle),0,Math.cos(angle)];}
 return {...p,walking,phase:t<T.turn?'turn':t<T.arrive?'walk':t<T.pickup?'reach':t<T.eaten?'eat':t<T.return?'settle':t<T.home?'return':'done',held:t>=T.pickup&&t<T.eaten,taken:t>=T.pickup,room:p.position[0]<-5?'kitchen':'living'};
}
const smooth=(from:number,to:number,t:number)=>{const x=Math.max(0,Math.min(1,(t-from)/(to-from)));return x*x*(3-2*x)};
export function donutGesture(elapsed:number){
 const T=DONUT_TIMES,reach=smooth(T.arrive,T.pickup,elapsed),carry=smooth(T.pickup,T.carry,elapsed),release=smooth(T.eaten,T.return,elapsed);
 const bite=smooth(19500,20500,elapsed)*.42+smooth(22000,T.eaten,elapsed)*.58;
 return {reach,carry,release,lean:.9*reach*(1-carry),weight:reach*(1-release),scale:1-bite,faceCamera:smooth(16500,19000,elapsed)};
}
/** Temporary shots only; the operator's principal camera is never edited. */
export function donutCamera(elapsed:number){
 const pose=donutPose(elapsed),[x,y,z]=pose.position;
 if(elapsed>=DONUT_TIMES.home)return null;
 if(elapsed<8000){const d=pose.direction,n=Math.hypot(d[0],d[2])||1;return {id:'eyes',position:[x,y+1.65,z]as Vec3,target:[x+d[0]/n*2,y+1.6,z+d[2]/n*2]as Vec3,fov:70};}
 if(pose.room==='living')return {id:'door',position:[-3.3,3.15,-.3]as Vec3,target:[-5,1.15,-2.4]as Vec3,fov:80};
 return {id:'kitchen',position:[-6.5,2.45,2.8]as Vec3,target:[-9.65,1,.2]as Vec3,fov:65};
}
