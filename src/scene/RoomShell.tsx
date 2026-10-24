import {portalStyle} from '../../shared/referenceLayout';
import {ArchSpandrel} from './ReferenceRooms';
import { useLayoutEffect, useMemo, useRef, useEffect } from 'react';
import { Color, InstancedMesh, Object3D, BufferGeometry, Float32BufferAttribute, DoubleSide, CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { useFrame } from '@react-three/fiber';
import type { Action, LiveState, Room, Vec3 } from '../../shared/types';
import {roomLook} from './artDirection';
import { LANDING_SLABS, ownsWall, roomWalls } from './sceneLayout';
import { Box,Cylinder,Window } from './Furniture';
import { Group } from 'three';

function Tiles({room}:{room:Room}) {
 const ref=useRef<InstancedMesh>(null);
 const tiled=['kitchen','bathroom'].includes(room.kind);
 const solid=['yard','exterior','bart','living'].includes(room.kind);
 const concrete=['garage','basement'].includes(room.kind);
 const nx=solid?1:tiled?10:concrete?6:8,nz=solid?1:tiled?8:concrete?5:24;
 useLayoutEffect(()=>{if(!ref.current)return;const o=new Object3D();let n=0;for(let x=0;x<nx;x++)for(let z=0;z<nz;z++){
  const px=-room.size[0]/2+(x+.5)*room.size[0]/nx,pz=-room.size[1]/2+(z+.5)*room.size[1]/nz;
  // Leave the shared staircase shaft open on every landing.
  if(room.kind==='hall'&&Math.abs(px)<1.4&&pz>-2.9&&pz<2)continue;
  o.position.set(px,-.04,pz);o.scale.set(room.size[0]/nx-.015,.08,room.size[1]/nz-.015);o.updateMatrix();ref.current.setMatrixAt(n,o.matrix);
  const palette=roomLook(room.id).floor;ref.current.setColorAt(n,new Color(palette[(x+z)%palette.length]));n++;
 }ref.current.count=n;ref.current.instanceMatrix.needsUpdate=true;if(ref.current.instanceColor)ref.current.instanceColor.needsUpdate=true;ref.current.computeBoundingSphere();},[room,nx,nz,tiled]);
 return <instancedMesh ref={ref} args={[undefined,undefined,nx*nz]} receiveShadow><boxGeometry/><meshStandardMaterial roughness={.95}/></instancedMesh>;
}
function Door({p,rotation,id,state,onAction,arch=false}:{p:Vec3;rotation:number;id:string;state:LiveState;onAction:(a:Action)=>void;arch?:boolean}){
 const door=useRef<Group>(null);const open=state.doors[id]??true;const initialAngle=useRef(open?-1.35:0);
 useFrame((_,dt)=>{if(door.current&&!state.paused){const target=open?-1.35:0;door.current.rotation.y+=(target-door.current.rotation.y)*Math.min(1,dt*6);}});
 return <group position={p} rotation={[0,rotation,0]} onClick={e=>{if(arch){e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:`door:${id}`});}}}><Box p={[-.93,1.28,0]} s={[.12,2.56,.24]} c="#d5b08a"/><Box p={[.93,1.28,0]} s={[.12,2.56,.24]} c="#d5b08a"/>{!arch&&<Box p={[0,2.59,0]} s={[1.98,.13,.24]} c="#d5b08a"/>}{(!arch||!open)&&<group position={[-.85,0,0]} rotation={[0,initialAngle.current,0]} ref={door} onClick={e=>{e.stopPropagation();onAction({type:'INTERACT_WITH_OBJECT',object:`door:${id}`});}}><Box p={[.84,1.23,0]} s={[1.68,2.46,.08]} c="#b0835b"/><Box p={[.84,1.65,.05]} s={[1.36,1.04,.025]} c="#bd956d"/><Box p={[.84,.52,.05]} s={[1.36,.62,.025]} c="#bc946b"/><Cylinder p={[1.48,1.14,.1]} r={.055} h={.12} c="#d7b960" rotation={[Math.PI/2,0,0]}/></group>}</group>
}
export function RoomShell({room,state,onAction,activeRoom,visibleRoomIds}:{room:Room;state:LiveState;onAction:(a:Action)=>void;activeRoom:string;visibleRoomIds:string[]}){
 const outdoors=['yard','exterior'].includes(room.kind);const [w,d]=room.size;const look=roomLook(room.id);const exteriorView=activeRoom==='front';
 const walls=useMemo(()=>roomWalls(room),[room]);
 const floorOpening=['hall','attic'].includes(room.kind);const ceilingOpening=['hall','basement'].includes(room.kind);
 return <group position={room.origin}>
  {floorOpening?LANDING_SLABS.map((slab,i)=><Box key={i} p={slab.p} s={slab.s} c={look.floor[0]}/>):<Tiles room={room}/>}
  {!outdoors&&(ceilingOpening?LANDING_SLABS.map((slab,i)=><Box key={`ceiling${i}`} p={[slab.p[0],3.49,slab.p[2]]} s={slab.s} c={room.kind==='attic'?'#c49564':'#ffe2bb'}/>):<Box p={[0,3.49,0]} s={[w,.08,d]} c={room.kind==='attic'?'#c49564':'#ffe2bb'}/>)}
  {!outdoors&&walls.map(wall=>{
   const {side,horizontal,sign,length,neighbor,offset,doorId}=wall;const style=portalStyle(doorId||'');const half=style.width/2;
   if(!ownsWall(room,wall,activeRoom,visibleRoomIds))return null;
   const p:Vec3=horizontal?[0,0,sign*d/2]:[sign*w/2,0,0];const rot=horizontal?0:Math.PI/2;
   const inner=(s:Vec3,pos:Vec3,c=exteriorView?'#efb975':look.wall,key='wall')=><Box key={key} p={pos} s={s} c={c}/>;
   return <group key={side} position={p} rotation={[0,rot,0]}>
    {neighbor?<>
     {inner([Math.max(.05,length/2+offset-half),3.55,.14],[(-length/2+offset-half)/2,1.775,0],exteriorView?'#efb975':look.wall,'left')}
     {inner([Math.max(.05,length/2-offset-half),3.55,.14],[(length/2+offset+half)/2,1.775,0],exteriorView?'#efb975':look.wall,'right')}
     {inner([style.width,3.55-style.height,.14],[offset,(3.55+style.height)/2,0],exteriorView?'#efb975':look.wall,'top')}
     {style.arch&&<group position={[offset,style.height-half,-.07]}><ArchSpandrel width={style.width} color={exteriorView?'#efb975':look.wall}/></group>}
     {!style.leaf&&state.doors[doorId!]===false&&<group position={[offset,0,0]} scale={[style.width/1.9,style.height/2.59,1]}><Door p={[0,0,0]} rotation={0} id={doorId!} state={state} onAction={onAction}/></group>}
     {style.leaf&&<Door p={[offset,0,0]} rotation={0} id={doorId!} state={state} onAction={onAction} arch={style.arch}/>}
    </>:inner([length,3.55,.14],[0,1.775,0])}
    <Box p={[0,3.45,.075]} s={[length,.12,.1]} c={look.trim}/>
    {!neighbor&&<><Box p={[0,.12,.085]} s={[length,.2,.08]} c={look.trim}/><Box p={[0,.9,.08]} s={[length,.035,.025]} c={look.trim}/></>}
   </group>
  })}
 </group>
}

export function Facade({night}:{night:boolean}){return <group scale={[-1,1,1]}>
 <Box p={[5,3.62,4.08]} s={[20,.24,.2]} c="#a48468"/>
 {[[-2,1.8],[12,1.8],[-2,5.5],[8,5.5],[12,5.5]].map(([x,y])=><Window key={`${x}${y}`} p={[x,y,4.13]} night={night} exterior/>)}
 <group position={[0,0,4.23]}>{[-1.12,1.12].map(x=><Box key={x} p={[x,1.35,0]} s={[.2,2.7,.25]} c="#b85e3d"/>)}<mesh position={[0,2.65,0]}><torusGeometry args={[1.12,.1,8,32,Math.PI]}/><meshStandardMaterial color="#b85e3d"/></mesh><Box p={[1.7,1.9,.1]} s={[.12,.45,.2]} c="#7a4f33"/><Box p={[1.7,1.9,.21]} s={[.09,.27,.02]} c="#ffe7a4" emissive={night?'#ffd270':'#000'}/></group>
 <Box p={[0,.1,4.5]} s={[2.8,.2,1.05]} c="#ae997d"/>
 {[-12.525,-7.475].map(x=><group key={x}><Box p={[x,1.6,4.12]} s={[3.15,3.1,.12]} c="#e29480"/>{Array.from({length:7},(_,i)=><Box key={i} p={[x,.3+i*.43,4.2]} s={[3.15,.025,.02]} c="#b96358"/>)}</group>)}<Box p={[-10,2.95,4.12]} s={[1.9,.5,.12]} c="#e29480"/>
 <Roof x={-10} y={7.18} z={-8} w={10.8} d={8.8} rise={1.6}/><Roof x={5} y={7.18} z={-4} w={21} d={17} rise={2.8}/><Roof x={-10} y={3.58} z={0} w={10.8} d={8.9} rise={1.6}/>
 <Box p={[11,8.6,-5]} s={[1,3,1]} c="#cb7949"/>
 </group>}
function Roof({x,y,z,w,d,rise}:{x:number;y:number;z:number;w:number;d:number;rise:number}){const slope=Math.atan2(rise,d/2),len=Math.sqrt((d/2)**2+rise**2);const roofMap=useMemo(()=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d')!;ctx.fillStyle='#863b25';ctx.fillRect(0,0,256,256);for(let row=0;row<8;row++)for(let col=-1;col<5;col++){const x=col*64+(row%2)*32;ctx.fillStyle=['#b65e36','#c16a3d','#ad532e','#bc6338'][(row*3+col+5)%4];ctx.fillRect(x+1,row*32+2,62,29);ctx.fillStyle='#d47c49';ctx.fillRect(x+2,row*32+3,60,2);}const t=new CanvasTexture(canvas);t.colorSpace=SRGBColorSpace;t.wrapS=t.wrapT=RepeatWrapping;t.repeat.set(w/5,len/5);return t},[w,len]);useEffect(()=>()=>roofMap.dispose(),[roofMap]);const gable=useMemo(()=>{const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute([0,0,-d/2,0,rise,0,0,0,d/2],3));g.computeVertexNormals();return g},[d,rise]);useEffect(()=>()=>gable.dispose(),[gable]);return <group position={[x,y,z]}>{[-1,1].map(sign=><group key={sign}><mesh position={[sign*(w/2-.2),-.02,0]} geometry={gable}><meshStandardMaterial color="#e5ab60" side={DoubleSide}/></mesh><mesh position={[0,rise/2,sign*d/4]} rotation={[sign*slope,0,0]} castShadow receiveShadow><boxGeometry args={[w,.2,len]}/><meshStandardMaterial map={roofMap} roughness={.95}/></mesh></group>)}<Cylinder p={[0,rise+.13,0]} r={.12} h={w} rotation={[0,0,Math.PI/2]} c="#ca7044"/></group>}
