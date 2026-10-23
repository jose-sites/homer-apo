import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { MathUtils, PerspectiveCamera, Vector3, Color, BufferGeometry, Float32BufferAttribute, Points } from 'three';
import type { Action, LiveState, Vec3 } from '../../shared/types';
import { ROOMS, CAMERAS } from '../../shared/data';
import { RoomShell, Facade } from './RoomShell';
import { RoomContents, Stairs } from './RoomContents';
import { currentTravelRoom } from './sceneLayout';

export interface SceneMetrics {fps:number;drawCalls:number;triangles:number;memory:number|null}
interface Props {state:LiveState;onAction:(action:Action)=>void;onMetrics?:(metrics:SceneMetrics)=>void;explore?:boolean;onCameraPose?:(position:Vec3,target:Vec3)=>void}
export default function HouseScene(props:Props){
 const [fade,setFade]=useState(false);const quality=props.state.settings.quality;const container=useRef<HTMLDivElement>(null);
 const report=(metrics:SceneMetrics)=>{if(container.current){container.current.dataset.drawCalls=String(metrics.drawCalls);container.current.dataset.triangles=String(metrics.triangles);container.current.dataset.fps=String(metrics.fps);}props.onMetrics?.(metrics);};
 return <div ref={container} className="house-scene" style={{width:'100%',height:'100%',position:'relative',overflow:'hidden',background:'#202d33'}}>
  <Canvas shadows={quality!=='low'} dpr={quality==='low'?1:quality==='high'?[1,1.75]:[1,1.35]} camera={{position:[0,2.2,3.6],fov:55,near:.08,far:90}} gl={{antialias:quality!=='low',powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor('#71878b');gl.toneMappingExposure=1.0;gl.shadowMap.autoUpdate=false;gl.shadowMap.needsUpdate=true;}}>
   <Suspense fallback={null}><World {...props} onMetrics={report} onFade={setFade}/></Suspense>
  </Canvas>
  <div aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',background:'#151b1b',opacity:fade?1:0,transition:'opacity 180ms ease'}}/>
  <div aria-hidden="true" style={{position:'absolute',inset:0,pointerEvents:'none',boxShadow:'inset 0 0 80px #301f2025'}}/>
 </div>
}
function World({state,onAction,onMetrics,explore,onCameraPose,onFade}:Props&{onFade:(value:boolean)=>void}){
 const active=state.cameras.find(c=>c.id===state.cameraId)||CAMERAS[0];
 const room=ROOMS.find(r=>r.id===active.room)||ROOMS[0];const night=state.virtualHour<6||state.virtualHour>18;
 const exterior=room.kind==='exterior';const [travelRoom,setTravelRoom]=useState(room.id);
 const detailedRoom=state.movement?travelRoom:room.id;
 const visible=useMemo(()=>{
  if(exterior)return ROOMS.filter(r=>r.floor>=0&&r.floor<2&&!['yard','bathroom'].includes(r.id));
  const ids=new Set([room.id,...room.neighbors]);
  if(state.movement){const from=ROOMS.find(r=>r.id===state.movement!.from),to=ROOMS.find(r=>r.id===state.movement!.to);if(from){ids.add(from.id);from.neighbors.forEach(id=>ids.add(id));}if(to){ids.add(to.id);to.neighbors.forEach(id=>ids.add(id));} // Entire predefined route loaded during movement, released on arrival.
   for(const point of state.movement.path){const found=ROOMS.find(r=>Math.abs(r.origin[1]-point[1])<.5&&Math.abs(r.origin[0]-point[0])<=r.size[0]/2&&Math.abs(r.origin[2]-point[2])<=r.size[1]/2);if(found)ids.add(found.id);}
  }
  return ROOMS.filter(r=>ids.has(r.id));
 },[room,exterior,state.movement]);
 return <>
  <color attach="background" args={[night?'#182e43':'#62c9ec']}/><fog attach="fog" args={[night?'#182e43':'#62c9ec',38,85]}/>
  <ambientLight intensity={state.power?(night?.35:.55):.12} color={night?'#c5ccd7':'#fff0d9'}/>
  <hemisphereLight args={['#d6f0ff','#9c637d',state.power?.85:.2]}/>
  <directionalLight position={[7,14,9]} intensity={night?.25:2.1} color={night?'#a2c0e1':'#fff0d5'} castShadow={state.settings.quality!=='low'} shadow-mapSize={state.settings.quality==='high'?[1024,1024]:[512,512]} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-camera-far={45} shadow-bias={-.001}/>
  {visible.map(r=><group key={r.id}><RoomShell room={r} state={state} onAction={onAction} activeRoom={detailedRoom} visibleRoomIds={visible.map(v=>v.id)}/>{r.id===detailedRoom?<RoomContents room={r} state={state} onAction={onAction}/>:['hall','basement'].includes(r.kind)&&<group position={r.origin}><Stairs level={r.floor}/></group>}</group>)}
  <SceneUpdates state={state} fallbackRoom={room.id} onTravelRoom={setTravelRoom}/>
  {exterior&&<Facade night={night}/>}
  {state.weather==='rain'&&<Rain origin={room.origin} paused={state.paused}/>}
  <Director state={state} explore={Boolean(explore)} onCameraPose={onCameraPose} onFade={onFade}/>
  {explore&&!state.movement&&<OrbitControls makeDefault target={[room.origin[0],room.origin[1]+1.3,room.origin[2]-1]} maxPolarAngle={Math.PI*.75} minPolarAngle={.25} minDistance={.8} maxDistance={exterior?36:7} enableDamping dampingFactor={.08}/>}
  <Metrics onMetrics={onMetrics} adaptive={state.settings.adaptiveQuality} quality={state.settings.quality}/>
 </>
}
function SceneUpdates({state,fallbackRoom,onTravelRoom}:{state:LiveState;fallbackRoom:string;onTravelRoom:(room:string)=>void}){
 const {gl,camera}=useThree();const last=useRef(0);const reported=useRef(fallbackRoom);
 const doorState=JSON.stringify(state.doors);const movementId=state.movement?.startedAt;const shadowsUntil=useRef(0);
 useEffect(()=>{gl.shadowMap.needsUpdate=true;shadowsUntil.current=performance.now()+1000;},[gl,state.cameraId,state.power,doorState,state.settings.quality,movementId]);
 useFrame(()=>{if(performance.now()<shadowsUntil.current)gl.shadowMap.needsUpdate=true;});
 useFrame(({clock})=>{if(!state.movement||clock.elapsedTime-last.current<.25)return;last.current=clock.elapsedTime;
  const next=currentTravelRoom([camera.position.x,camera.position.y-1.68,camera.position.z],reported.current);if(next!==reported.current){reported.current=next;onTravelRoom(next);gl.shadowMap.needsUpdate=true;}
 });return null;
}
function Director({state,explore,onCameraPose,onFade}:{state:LiveState;explore:boolean;onCameraPose?:Props['onCameraPose'];onFade:(value:boolean)=>void}){
 const {camera}=useThree();const target=useRef(new Vector3(0,1.4,-2.3));const destination=useRef(new Vector3());const destinationTarget=useRef(new Vector3());const currentId=useRef('');const lastRoom=useRef('');const pending=useRef<{at:number;position:Vector3;target:Vector3;fov:number}|null>(null);const lastReport=useRef(0);const movementStart=useRef<{id:number;at:number;elapsed:number}|null>(null);
 useEffect(()=>{const preset=state.cameras.find(c=>c.id===state.cameraId)||CAMERAS[0];if(currentId.current===preset.id)return;const next=new Vector3(...preset.position),nextTarget=new Vector3(...preset.target);
 const cut=preset.transition==='cut'||!currentId.current;const crossesRoom=lastRoom.current&&lastRoom.current!==preset.room;
 if(cut){camera.position.copy(next);target.current.copy(nextTarget);(camera as PerspectiveCamera).fov=preset.fov;camera.lookAt(target.current);(camera as PerspectiveCamera).updateProjectionMatrix();}
 else if(crossesRoom||preset.transition==='fade'){onFade(true);pending.current={at:performance.now()+190,position:next,target:nextTarget,fov:preset.fov};}
 destination.current.copy(next);destinationTarget.current.copy(nextTarget);currentId.current=preset.id;lastRoom.current=preset.room;
 },[state.cameraId,state.cameras,camera,onFade]);
 useFrame((_,dt)=>{
  const now=performance.now();const preset=state.cameras.find(c=>c.id===state.cameraId)||CAMERAS[0];const room=ROOMS.find(r=>r.id===preset.room)||ROOMS[0];
  if(pending.current&&now>=pending.current.at){camera.position.copy(pending.current.position);target.current.copy(pending.current.target);(camera as PerspectiveCamera).fov=pending.current.fov;pending.current=null;onFade(false);}
  if(state.movement){
   if(movementStart.current?.id!==state.movement.startedAt)movementStart.current={id:state.movement.startedAt,at:now,elapsed:Math.max(0,Date.now()-state.movement.startedAt)};
   const m=movementStart.current;if(!state.paused)m.elapsed+=dt*1000;
   const progress=Math.min(.999,m.elapsed/state.movement.duration);const {point,look}=samplePath(state.movement.path,progress);
   camera.position.set(point.x,point.y+1.68,point.z);target.current.set(look.x,look.y+1.6,look.z);camera.lookAt(target.current);
   (camera as PerspectiveCamera).fov=MathUtils.damp((camera as PerspectiveCamera).fov,68,4,dt);
  }else if(!explore){
   if(movementStart.current){movementStart.current=null;camera.position.copy(destination.current);target.current.copy(destinationTarget.current);}
   if(!pending.current){const speed=3;camera.position.lerp(destination.current,1-Math.exp(-dt*speed));target.current.lerp(destinationTarget.current,1-Math.exp(-dt*speed));(camera as PerspectiveCamera).fov=MathUtils.damp((camera as PerspectiveCamera).fov,preset.fov,3,dt);}
   camera.lookAt(target.current);
  }else if(room.kind!=='exterior'&&room.kind!=='yard'){
   // Exploration stays inside the room envelope. Inter-room travel uses validated paths.
   camera.position.x=MathUtils.clamp(camera.position.x,room.origin[0]-room.size[0]/2+.22,room.origin[0]+room.size[0]/2-.22);
   camera.position.z=MathUtils.clamp(camera.position.z,room.origin[2]-room.size[1]/2+.22,room.origin[2]+room.size[1]/2-.22);
   camera.position.y=MathUtils.clamp(camera.position.y,room.origin[1]+.3,room.origin[1]+3.3);
  }
  (camera as PerspectiveCamera).updateProjectionMatrix();
  if(onCameraPose&&now-lastReport.current>500){lastReport.current=now;const forward=new Vector3();camera.getWorldDirection(forward);const look=camera.position.clone().addScaledVector(forward,5);onCameraPose(camera.position.toArray() as Vec3,look.toArray() as Vec3);}
 });return null;
}
export function samplePath(path:Vec3[],progress:number):{point:Vector3;look:Vector3}{
 if(path.length<2){const p=new Vector3(...(path[0]||[0,0,0]));return {point:p,look:p.clone().add(new Vector3(0,0,-1))};}
 const lengths=path.slice(1).map((p,i)=>new Vector3(...p).distanceTo(new Vector3(...path[i])));const total=lengths.reduce((a,b)=>a+b,0);let travel=MathUtils.clamp(progress,0,1)*total;
 for(let i=0;i<lengths.length;i++){if(travel<=lengths[i]||i===lengths.length-1){const a=new Vector3(...path[i]),b=new Vector3(...path[i+1]);const point=a.clone().lerp(b,lengths[i]?travel/lengths[i]:1);const look=point.clone().add(b.clone().sub(a).normalize().multiplyScalar(1.5));return {point,look};}travel-=lengths[i];}
 return {point:new Vector3(...path.at(-1)!),look:new Vector3(...path.at(-1)!)};
}
function Metrics({onMetrics,adaptive,quality}:{onMetrics?:Props['onMetrics'];adaptive:boolean;quality:string}){
 const {gl,setDpr}=useThree();const sample=useRef({at:0,frames:0,slow:0,fast:0});
 useFrame(({clock})=>{const s=sample.current;s.frames++;if(clock.elapsedTime-s.at<2)return;const fps=Math.round(s.frames/(clock.elapsedTime-s.at));s.frames=0;s.at=clock.elapsedTime;
 const heap=(performance as Performance&{memory?:{usedJSHeapSize:number}}).memory?.usedJSHeapSize;
 onMetrics?.({fps,drawCalls:gl.info.render.calls,triangles:gl.info.render.triangles,memory:heap?Math.round(heap/1024/1024):null});
 if(adaptive){s.slow=fps<30?s.slow+1:0;s.fast=fps>55?s.fast+1:0;if(s.slow>=2){setDpr(Math.max(.75,gl.getPixelRatio()-.2));s.slow=0;}else if(s.fast>=5){setDpr(Math.min(quality==='high'?1.75:quality==='low'?1:1.35,gl.getPixelRatio()+.1));s.fast=0;}}
 });return null;
}
function Rain({origin,paused}:{origin:Vec3;paused:boolean}){const points=useRef<Points>(null);const geometry=useMemo(()=>{const a=new Float32Array(150*3);for(let i=0;i<150;i++){a[i*3]=(Math.random()-.5)*32;a[i*3+1]=Math.random()*15;a[i*3+2]=(Math.random()-.5)*32;}const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(a,3));return g;},[]);useEffect(()=>()=>geometry.dispose(),[geometry]);useFrame((_,dt)=>{if(paused)return;const a=geometry.attributes.position;for(let i=0;i<a.count;i++)a.setY(i,(a.getY(i)-dt*6+15)%15);a.needsUpdate=true;});return <points ref={points} position={origin} geometry={geometry}><pointsMaterial size={.045} color="#c8dde0" transparent opacity={.45}/></points>}
