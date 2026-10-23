import type { Room, Vec3 } from '../../shared/types';
import { DOORWAYS, ROOMS, doorId } from '../../shared/data';
export interface WallLayout {side:string;horizontal:boolean;sign:number;length:number;neighbor?:Room;doorId?:string;offset:number}
export function roomWalls(room:Room):WallLayout[]{
 return ['north','south','east','west'].map(side=>{
  const horizontal=side==='north'||side==='south';const sign=side==='north'||side==='west'?-1:1;
  const length=horizontal?room.size[0]:room.size[1];
  const neighbor=room.neighbors.map(id=>ROOMS.find(r=>r.id===id)!).find(r=>{
   const door=DOORWAYS[doorId(room.id,r.id)];if(!door)return false;
   return horizontal?Math.abs(door[2]-(room.origin[2]+sign*room.size[1]/2))<.001:Math.abs(door[0]-(room.origin[0]+sign*room.size[0]/2))<.001;
  });
  const key=neighbor?doorId(room.id,neighbor.id):undefined;const doorway=key?DOORWAYS[key]:undefined;
  return {side,horizontal,sign,length,neighbor,doorId:key,offset:doorway?(horizontal?doorway[0]-room.origin[0]:room.origin[2]-doorway[2]):0};
 });
}
/** One owner per shared physical wall. The active interior retains its own paint. */
export function ownsWall(room:Room,wall:WallLayout,activeRoom:string,visibleRoomIds:string[]):boolean{
 const other=wall.neighbor;if(!other||['yard','exterior'].includes(other.kind)||!visibleRoomIds.includes(other.id))return true;
 return room.id===activeRoom||(other.id!==activeRoom&&room.id<other.id);
}
/** Exact slabs leave the 2.5 m × 4.2 m staircase opening without tile-grid gaps. */
export const LANDING_SLABS:Array<{p:Vec3;s:Vec3}>=[
 {p:[-3.125,-.04,0],s:[3.75,.08,8]},{p:[3.125,-.04,0],s:[3.75,.08,8]},
 {p:[0,-.04,-3.35],s:[2.5,.08,1.3]},{p:[0,-.04,2.75],s:[2.5,.08,2.5]},
];
export function currentTravelRoom(point:Vec3,fallback:string):string{
 const candidates=ROOMS.filter(r=>Math.abs(r.origin[1]-point[1])<.35&&Math.abs(r.origin[0]-point[0])<r.size[0]/2-.02&&Math.abs(r.origin[2]-point[2])<r.size[1]/2-.02);
 return candidates[0]?.id||fallback;
}
