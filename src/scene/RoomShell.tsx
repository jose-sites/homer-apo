import { useLayoutEffect, useMemo, useRef } from 'react';
import { Color, InstancedMesh, Object3D } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Action, LiveState, Room, Vec3 } from '../../shared/types';
import { ROOMS } from '../../shared/data';
import { Box,Cylinder,Window } from './Furniture';
import { Group } from 'three';

function Tiles({room}:{room:Room}) {
 const ref=useRef<InstancedMesh>(null);
 const tiled=['kitchen','bathroom'].includes(room.kind);
 const nx=tiled?10:12,nz=tiled?8:8;
 useLayoutEffect(()=>{if(!ref.current)return;const o=new Object3D();let n=0;for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){
  const px=-room.size[0]/2+(x+.5)*room.size[0]/nx,pz=-room.size[1]/2+(z+.5)*room.size[1]/nz;
  // Leave the shared staircase shaft open on every landing.
  if(room.kind==='hall'&&Math.abs(px)<1.4&&pz>-2.9&&pz<2)continue;
  o.position.set(px,-.04,pz);o.scale.set(room.size[0]/nx-.015,.08,room.size[1]/nz-.015);o.updateMatrix();ref.current.setMatrixAt(n,o.matrix);
  const palette=tiled?['#bbbda5','#e8dcc0']:room.kind==='yard'||room.kind==='exterior'?['#7e9b66','#809d68']:['#b18b61','#b58f65','#b99269'];ref.current.setColorAt(n,new Color(palette[(x+z)%palette.length]));n++;
 }ref.current.count=n;ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[room,nx,nz,tiled]);
 return <instancedMesh ref={ref} args={[undefined,undefined,nx*nz]} receiveShadow><boxGeometry/><meshStandardMaterial roughness={.95}/></instancedMesh>;
}
function Door({p,rotation,id,state,onAction}:{p:Vec3;rotation:number;id:string;state:LiveState;onAction:(a:Action)=>void}){
 const door=useRef<Group>(null);const open=state.doors[id]??true;
 useFrame((_,dt)=>{if(door.current)door.current.rotation.y+=(open?-1.35:0-door.current.rotation.y)*0; if(door.current){const target=open?-1.35:0;door.current.rotation.y+=(target-door.current.rotation.y)*Math.min(1,dt*6);}});
 return <group position={p} rotation={[0,rotation,0]}><Box p={[-.93,1.28,0]} s={[.12,2.56,.24]} c="#d5b08a"/><Box p={[.93,1.28,0]} s={[.12,2.56,.24]} c="#d5b08a"/><Box p={[0,2.59,0]} s={[1.98,.13,.24]} c="#d5b08a"/><group position={[-.85,0,0]} ref={door} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:`door:${id}`});}}><Box p={[.84,1.23,0]} s={[1.68,2.46,.08]} c="#b0835b"/><Box p={[.84,1.65,.05]} s={[1.36,1.04,.025]} c="#bd956d"/><Box p={[.84,.52,.05]} s={[1.36,.62,.025]} c="#bc946b"/><Cylinder p={[1.48,1.14,.1]} r={.055} h={.12} c="#d7b960" rotation={[Math.PI/2,0,0]}/></group></group>
}
export function RoomShell({room,state,onAction}:{room:Room;state:LiveState;onAction:(a:Action)=>void}){
 const outdoors=['yard','exterior'].includes(room.kind);const [w,d]=room.size;
 const walls=useMemo(()=>{
  return ['north','south','east','west'].map(side=>{
   const horizontal=side==='north'||side==='south';const sign=side==='north'||side==='west'?-1:1;
   const length=horizontal?w:d;
   const neighbors=room.neighbors.map(id=>ROOMS.find(r=>r.id===id)!).filter(r=>r&&r.floor===room.floor&&r.origin[1]===room.origin[1]);
   const nb=neighbors.find(r=>horizontal?sign*(r.origin[2]-room.origin[2])>0&&Math.abs(r.origin[0]-room.origin[0])<.01:sign*(r.origin[0]-room.origin[0])>0&&Math.abs(r.origin[2]-room.origin[2])<.01);
   // Wider exterior ground parcels cover the garage/dining exits, too.
   const broad=neighbors.find(r=>['yard','exterior'].includes(r.kind)&&(horizontal?sign*(r.origin[2]-room.origin[2])>0:false));
   const neighbor=nb||broad;const offset=(room.id==='living'&&side==='north')||(room.id==='hall'&&side==='south')?3.8:0;
   return {side,horizontal,sign,length,neighbor,offset};
  });
 },[room,w,d]);
 return <group position={room.origin}><Tiles room={room}/>{!outdoors&&walls.map(({side,horizontal,sign,length,neighbor,offset})=>{
  const p:Vec3=horizontal?[0,0,sign*d/2]:[sign*w/2,0,0];const rot=horizontal?0:Math.PI/2;
  const inner=(s:Vec3,pos:Vec3,c=room.color,key='wall')=><Box key={key} p={pos} s={s} c={c}/>;
  return <group key={side} position={p} rotation={[0,rot,0]}>
   {neighbor?<>
    {inner([Math.max(.05,length/2+offset-.95),3.55,.14],[(-length/2+offset-.95)/2,1.775,0],room.color,'left')}
    {inner([Math.max(.05,length/2-offset-.95),3.55,.14],[(length/2+offset+.95)/2,1.775,0],room.color,'right')}
    {inner([1.9,.96,.14],[offset,3.07,0],room.color,'top')}
    <Door p={[offset,0,0]} rotation={0} id={[room.id,neighbor.id].sort().join('-')} state={state} onAction={onAction}/>
   </>:inner([length,3.55,.14],[0,1.775,0])}
   <Box p={[0,3.45,.075]} s={[length,.12,.1]} c="#d5b38e"/>
   {!neighbor&&<><Box p={[0,.12,.085]} s={[length,.2,.08]} c="#c3a078"/><Box p={[0,.9,.08]} s={[length,.035,.025]} c="#ba8f7f"/></>}
  </group>
 })}</group>
}

export function Facade({night}:{night:boolean}){return <group>
 <Box p={[5,3.62,4.08]} s={[20,.24,.2]} c="#a48468"/>
 {[[-2,1.8],[12,1.8],[-2,5.5],[8,5.5],[12,5.5]].map(([x,y])=><Window key={`${x}${y}`} p={[x,y,4.13]} night={night}/>)}
 <Box p={[0,.1,4.5]} s={[2.8,.2,1.05]} c="#ae997d"/>
 <Box p={[-10,1.6,4.12]} s={[8.2,3.1,.12]} c="#b5997c"/>{Array.from({length:7},(_,i)=><Box key={i} p={[-10,.3+i*.43,4.2]} s={[8,.025,.02]} c="#917b68"/>)}
 <Roof x={5} y={7.18} z={-4} w={21} d={17} rise={2.8}/><Roof x={-10} y={3.58} z={0} w={10.8} d={8.9} rise={1.6}/>
 <Box p={[11,8.6,-5]} s={[1,3,1]} c="#a87662"/>
 </group>}
function Roof({x,y,z,w,d,rise}:{x:number;y:number;z:number;w:number;d:number;rise:number}){const slope=Math.atan2(rise,d/2),len=Math.sqrt((d/2)**2+rise**2);return <group position={[x,y,z]}>{[-1,1].map(sign=><group key={sign}><Box p={[0,rise/2,sign*d/4]} s={[w,.2,len]} r={[sign*slope,0,0]} c="#705348"/>{Array.from({length:12},(_,i)=><Box key={i} p={[0,rise*(1-(i+.5)/12),sign*(i+.5)/12*d/2]} s={[w,.035,.045]} c="#563e38"/>)}</group>)}</group>}
