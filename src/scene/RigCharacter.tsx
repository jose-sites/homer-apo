import {ContactShade} from './Furniture';
import {CHARACTER_LAYOUT} from './characterLayout';
import {useEffect,useMemo,useRef,useState} from 'react';
import {useFrame} from '@react-three/fiber';
import {Group,Mesh,MeshStandardMaterial,TextureLoader,SRGBColorSpace,Vector3,PlaneGeometry} from 'three';
import type {CharacterState,Speech,Vec3} from '../../shared/types';
import {spriteSvg} from './spriteArt';
import {RIG,chooseGesture,gesturePose,damp,type Gesture} from './characterMotion';
import {selectSpriteAngle} from './spriteAssets';
export function RigCharacter({character,position,height,speech,paused}:{character:CharacterState;position:Vec3;height:number;speech:Speech|null;paused:boolean}){
 const root=useRef<Group>(null),standingBody=useRef<Mesh>(null),body=useRef<Mesh>(null),head=useRef<Group>(null),face=useRef<Mesh>(null);
 const leftHand=useRef<Mesh>(null),rightHand=useRef<Mesh>(null);
 const left=useRef<Group>(null),right=useRef<Group>(null),leftElbow=useRef<Group>(null),rightElbow=useRef<Group>(null);
 const time=useRef(0),level=useRef(0),lastLevel=useRef(0),actual=useRef<Speech|null>(null),audioSeen=useRef(false),speechId=useRef(''),gesture=useRef<Gesture>('explain'),started=useRef(0),previousActivity=useRef(character.activity),stand=useRef(character.id==='homer'?1:0);
 const [expression,setExpression]=useState(character.expression);const world=useMemo(()=>new Vector3(),[]);
 const rig=RIG[character.id],k=height/420;const x=(v:number)=>(v-150)*k,y=(v:number)=>(420-v)*k;
 const surface=useMemo(()=>{const g=new PlaneGeometry(height*300/420,height,12,12),a=g.attributes.position;for(let i=0;i<a.count;i++)a.setZ(i,.035*(1-(a.getX(i)/(height*300/840))**2)+(character.id!=='homer'?.28*Math.max(0,Math.min(1,(.65-position[1]-(a.getY(i)+height*.5))/.4)):0));g.computeVertexNormals();return g},[height,character.id,position[1]]);
 useEffect(()=>()=>surface.dispose(),[surface]);
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
  const idleBeat=Math.max(0,Math.sin((t+character.id.length*2)%9.7/2))* .018;
  const pose=speaking?gesturePose(gesture.current,elapsed,a):[0,0,0,0,idleBeat];const amount=isHomer?1:.18;
  if(rightHand.current)(rightHand.current.material as MeshStandardMaterial).map=speaking&&gesture.current==='point'?textures.rightPoint:textures.rightLower;
  [left,right,leftElbow,rightElbow].forEach((ref,i)=>{if(ref.current)ref.current.rotation.z=damp(ref.current.rotation.z,pose[i]*amount+(!isHomer?[.08,-.08,.6,-.6][i]:0),dt)});
  head.current.rotation.y=damp(head.current.rotation.y,!isHomer?Math.sin(t*.6+character.id.length)*idleBeat*3:0,dt);
  head.current.rotation.z=damp(head.current.rotation.z,pose[4]*amount+(speaking?Math.sin(t*1.8)*.008:0),dt);
  const seated=character.room==='living'&&!isHomer;
  stand.current=damp(stand.current,seated?0:1,dt);
  // Seat-to-standing blend moves only within the existing footprint; no route changes.
  root.current.position.y=position[1]+0+Math.sin(t*1.4+character.id.length)*.006;
  root.current.rotation.z=damp(root.current.rotation.z,speaking&&isHomer?Math.sin(t*.8)*.012:0,dt);
  const blend=stand.current;const bm=body.current.material as MeshStandardMaterial;bm.opacity=1-blend;body.current.visible=blend<.999;if(standingBody.current){(standingBody.current.material as MeshStandardMaterial).opacity=blend;standingBody.current.visible=blend>.001;}
  const blink=(t+character.id.length*.73)% (4.1+character.id.length*.17)<.13||character.activity==='sleeping'&&!speaking;
  const mouth=a>.22?2:a>.035?1:0;(face.current.material as MeshStandardMaterial).map=textures.head[(blink?3:0)+mouth];
  root.current.getWorldPosition(world);const yaw=Math.atan2(camera.position.x-world.x,camera.position.z-world.z);root.current.visible=character.enabled&&selectSpriteAngle(yaw)!==null;root.current.rotation.y=Math.max(-.43,Math.min(.43,yaw));
  root.current.userData.gesture=speaking?gesture.current:'rest';root.current.userData.speaking=speaking;
 });
 const plane=(map:typeof textures.leftUpper,px=0,py=0,ref?:React.Ref<Mesh>)=><mesh ref={ref} position={[-px,height/2-py,0]}><primitive object={surface} attach="geometry"/><meshStandardMaterial map={map} emissiveMap={map} emissive="#ffffff" emissiveIntensity={.12} color="#c8bc9e" roughness={1} transparent alphaTest={.05} depthWrite={true}/></mesh>;
 const arm=(side:'left'|'right')=>{const sx=x(rig.shoulders[side==='left'?0:1]),sy=y(rig.shoulders[2]),ex=x(rig.shoulders[side==='left'?0:1]+(side==='left'?-8:8)),ey=y(rig.elbow);return <group ref={side==='left'?left:right} position={[sx,sy,-.018]}>{plane(textures[`${side}Upper`],sx,sy)}<group ref={side==='left'?leftElbow:rightElbow} position={[ex-sx,ey-sy,.075]}>{plane(textures[`${side}Lower`],ex,ey,side==='left'?leftHand:rightHand)}</group></group>};
 if(!character.enabled)return null;
 return <><ContactShade p={[position[0],character.room==='living'?CHARACTER_LAYOUT[character.id].contact:position[1]+.008,position[2]]} size={character.id==='homer'?[.9,.55]:[.55,.4]}/><group ref={root} position={position} name={`rig-${character.id}`}>
  {arm('left')}{arm('right')}{plane(textures.body[0],0,0,body)}{plane(textures.body[1],0,0,standingBody)}
  <group ref={head} position={[x(rig.head[0]),y(rig.head[1]),.045]}>{plane(textures.head[0],x(rig.head[0]),y(rig.head[1]),face)}</group>
 </group></>;
}
