import {Vector3} from 'three';
import {ROOMS,DOORWAYS} from '../../shared/data';
/** Keep a selfie camera within masonry, except at an open, aligned portal. */
export function constrainSelfie(position:Vector3,roomId:string,doors:Record<string,boolean>){
 const room=ROOMS.find(r=>r.id===roomId);if(!room||['exterior','yard'].includes(room.kind))return position;
 for(const axis of [0,2]as const){const value=axis===0?position.x:position.z,center=room.origin[axis],half=room.size[axis===0?0:1]/2;if(Math.abs(value-center)<=half-.25)continue;
 const other=axis===0?2:0,across=other===0?position.x:position.z;
 const open=Object.entries(DOORWAYS).some(([id,p])=>id.split('-').includes(roomId)&&doors[id]!==false&&Math.abs(p[axis]-(center+Math.sign(value-center)*half))<.05&&Math.abs(across-p[other])<.65);
 if(!open){const safe=center+Math.sign(value-center)*(half-.25);if(axis===0)position.x=safe;else position.z=safe;}
 }
 return position;
}
