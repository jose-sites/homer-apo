import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,Mesh,MeshBasicMaterial,TextureLoader,SRGBColorSpace,Vector3} from 'three';
import type {CharacterState,Speech,Vec3} from '../../shared/types';
import {spriteSvg} from './spriteArt';
import {RIG,chooseGesture,gesturePose,damp,type Gesture} from './characterMotion';
import {selectSpriteAngle} from './spriteAssets';
export function RigCharacter({character,position,height,speech,paused}:{character:CharacterState;position:Vec3;height:number;speech:Speech|null;paused:boolean}){
 const root=useRef<Group>(null),standingBody=useRef<Mesh>(null),body=useRef<Mesh>(null),head=useRef<Group>(null),face=useRef<Mesh>(null);
 const leftHand=useRef<Mesh>(null),rightHand=useRef<Mesh>(null);
 const left=useRef<Group>(null),right=useRef<Group>(null),leftElbow=useRef<Group>(null),rightElbow=useRef<Group>(null);
 const time=useRef(0),level=useRef(0),lastLevel=useRef(0),actual=useRef<Speech|null>(null),audioSeen=useRef(false),speechId=useRef(''),gesture=useRef<Gesture>('explain'),started=useRef(0),previousActivity=useRef(character.activity),stand=useRef(0);
 const [expression,setExpression]=useState(character.expression);const world=useMemo(()=>new Vector3(),[]);
 const rig=RIG[character.id],k=height/420;const x=(v:number)=>(v-150)*k,y=(v:number)=>(420-v)*k;
 const textures=useMemo(()=>{const loader=new TextureLoader();const make=(part:string,mouth=0,blink=false,seated=false)=>{const t=loader.load('data:image/svg+xml;charset=utf-8,'+encodeURIComponent(spriteSvg(character.id,mouth,blink,expression,part,seated)));t.colorSpace=SRGBColorSpace;return t};return {body:[make('body',0,false,true),make('body')],head:Array.from({length:6},(_,i)=>make('head',i%3,i>2)),leftUpper:make('leftUpper'),leftLower:make('leftLower'),rightUpper:make('rightUpper'),rightLower:make('rightLower'),leftPoint:make('leftPoint'),rightPoint:make('rightPoint')}},[character.id,expression]);
 useEffect(()=>()=>Object.values(textures).flat().forEach(t=>t.dispose()),[textures]);
 useEffect(()=>{setExpression(character.expression)},[character.expression]);
 useEffect(()=>{
  const onLevel=(e:Event)=>{const d=(e as CustomEvent).detail;if(d.character===character.id){level.current=Math.max(0,Math.min(1,d.level));lastLevel.current=performance.now()}};
  const playback=(e:Event)=>{const d=(e as CustomEvent<{speech:Speech;active:boolean}>).detail;if(d.speech.character!==character.id)return;audioSeen.current=true;actual.current=d.active?d.speech:null;};
  window.addEventListener('homer:audio-level',onLevel);window.addEventListener('homer:playback',playback);return()=>{window.removeEventListener('homer:audio-level',onLevel);window.removeEventListener('homer:playback',playback)};
 },[character.id]);
 useFrame(({camera},dt)=>{
  if(!root.current||!body.current||!head.current||!face.current)return;
  if(paused)return;
  time.current+=dt;const t=time.current;
  const playing=audioSeen.current?actual.current:speech?.character===character.id?speech:null;
  const speaking=!!playing;const isHomer=character.id==='homer';
  if(!speaking&&character.activity!=='talking')previousActivity.current=character.activity;
  if(playing&&speechId.current!==playing.id){speechId.current=playing.id;started.current=t;gesture.current=chooseGesture(playing.text,[...playing.id].reduce((a,c)=>a+c.charCodeAt(0),0),gesture.current);setExpression(character.expression==='neutral'?gesture.current==='doubt'?'confused':gesture.current==='irritation'?'angry':gesture.current==='celebrate'?'happy':'neutral':character.expression)}
  if(!playing&&speechId.current){speechId.current='';setExpression(character.expression)}
  const elapsed=t-started.current;
  // Refresh a long utterance only at a phrase boundary, never every audio sample.
  const beat=Math.floor(elapsed/4.7);if(playing&&beat>0&&Math.floor((elapsed-dt)/4.7)!==beat)gesture.current=chooseGesture('',beat+playing.text.length,gesture.current);
  const a=performance.now()-lastLevel.current<350?level.current:0;
  const pose=speaking?gesturePose(gesture.current,elapsed,a):[0,0,0,0,0];const amount=isHomer?1:.18;
  if(rightHand.current)(rightHand.current.material as MeshBasicMaterial).map=speaking&&gesture.current==='point'?textures.rightPoint:textures.rightLower;
  [left,right,leftElbow,rightElbow].forEach((ref,i)=>{if(ref.current)ref.current.rotation.z=damp(ref.current.rotation.z,pose[i]*amount,dt)});
  head.current.rotation.z=damp(head.current.rotation.z,pose[4]*amount+(speaking?Math.sin(t*1.8)*.008:0),dt);
  const seated=character.room==='living'&&(!isHomer||(!speaking&&previousActivity.current!=='idle'&&previousActivity.current!=='walking'));
  stand.current=damp(stand.current,seated?0:1,dt);
  // Seat-to-standing blend moves only within the existing footprint; no route changes.
  root.current.position.y=position[1]+(isHomer?(.15*(1-stand.current)):.2)+Math.sin(t*1.4+character.id.length)*.006;
  root.current.rotation.z=damp(root.current.rotation.z,speaking&&isHomer?Math.sin(t*.8)*.012:0,dt);
  const blend=character.id==='maggie'?1:stand.current;const bm=body.current.material as MeshBasicMaterial;bm.opacity=1-blend;body.current.visible=blend<.999;if(standingBody.current){(standingBody.current.material as MeshBasicMaterial).opacity=blend;standingBody.current.visible=blend>.001;}
  const blink=(t+character.id.length*.73)% (4.1+character.id.length*.17)<.13||character.activity==='sleeping'&&!speaking;
  const mouth=a>.22?2:a>.035?1:0;(face.current.material as MeshBasicMaterial).map=textures.head[(blink?3:0)+mouth];
  root.current.getWorldPosition(world);const yaw=Math.atan2(camera.position.x-world.x,camera.position.z-world.z);root.current.visible=character.enabled&&selectSpriteAngle(yaw)!==null;root.current.rotation.y=Math.max(-.43,Math.min(.43,yaw));
  root.current.userData.gesture=speaking?gesture.current:'rest';root.current.userData.speaking=speaking;
 });
 const plane=(map:typeof textures.leftUpper,px=0,py=0,ref?:React.Ref<Mesh>)=><mesh ref={ref} position={[-px,height/2-py,0]}><planeGeometry args={[height*300/420,height]}/><meshBasicMaterial map={map} transparent alphaTest={.05} depthWrite={true} toneMapped={false}/></mesh>;
 const arm=(side:'left'|'right')=>{const sx=x(rig.shoulders[side==='left'?0:1]),sy=y(rig.shoulders[2]),ex=x(rig.shoulders[side==='left'?0:1]+(side==='left'?-8:8)),ey=y(rig.elbow);return <group ref={side==='left'?left:right} position={[sx,sy,.005]}>{plane(textures[`${side}Upper`],sx,sy)}<group ref={side==='left'?leftElbow:rightElbow} position={[ex-sx,ey-sy,.001]}>{plane(textures[`${side}Lower`],ex,ey,side==='left'?leftHand:rightHand)}</group></group>};
 if(!character.enabled)return null;
 return <group ref={root} position={position} name={`rig-${character.id}`}>
  {arm('left')}{arm('right')}{plane(textures.body[0],0,0,body)}{plane(textures.body[1],0,0,standingBody)}
  <group ref={head} position={[x(rig.head[0]),y(rig.head[1]),.008]}>{plane(textures.head[0],x(rig.head[0]),y(rig.head[1]),face)}</group>
 </group>;
}
