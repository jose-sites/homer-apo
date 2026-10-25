import {useEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {AnimationMixer,Box3,Group,Mesh,Bone,Quaternion,Vector3,MathUtils} from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {LiveState,Speech,Vec3} from '../../shared/types';
import {ROOM_NAV_POINTS} from '../../shared/data';
import {HOMER_HOME,DONUT_SPOT,donutPose,pointAlong} from '../../shared/homerMotion';
import {Donut} from './Furniture';

/** A skinned mesh, not a billboard. Facial shape keys are deliberately absent. */
export function Homer3D({state}:{state:LiveState}){
 const asset=useGLTF(`${import.meta.env.BASE_URL}models/homer/homer.glb`);
 const rig=useMemo(()=>{
  const scene=clone(asset.scene);const mixer=new AnimationMixer(scene);const action=mixer.clipAction(asset.animations[0]);action.play();mixer.setTime(0);
  scene.updateMatrixWorld(true);const bounds=new Box3().setFromObject(scene),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());const scale=2.15/size.y;
  const bones=new Map<string,Bone>();scene.traverse(o=>{if(o instanceof Bone)bones.set(o.name.replace(/[._]/g,''),o);if(o instanceof Mesh){o.castShadow=true;o.frustumCulled=false;}});
  const rest=[...bones.values()].map(b=>({bone:b,position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()}));
  mixer.setTime(asset.animations[0].duration/2);
  // Blend opposing steps in the baked coordinate system; bind-pose hips use a different orientation.
  const legs=rest.filter(p=>/^DEF-(hips|femur|shin|foot|toes)/.test(p.bone.name)).map(p=>({bone:p.bone,position:p.position.clone().lerp(p.bone.position,.5),quaternion:p.quaternion.clone().slerp(p.bone.quaternion,.5),scale:p.scale.clone().lerp(p.bone.scale,.5)}));
  for(const p of rest){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale)}
  return {scene,mixer,rest,legs,scale,offset:[-center.x*scale,-bounds.min.y*scale,-center.z*scale]as Vec3,bones};
 },[asset]);
 const root=useRef<Group>(null),held=useRef<Group>(null);const clock=useRef(0),walkingTime=useRef(0),speaking=useRef<Speech|null>(null),talkBlend=useRef(0),previousMove=useRef(false),path=useRef<Vec3[]>([]),lastInteraction=useRef<string|undefined>(undefined);
 const position=useRef(new Vector3(...(state.room==='living'?HOMER_HOME:ROOM_NAV_POINTS[state.room])));
 useEffect(()=>{rig.mixer.clipAction(asset.animations[0]).play();const handle=(event:Event)=>{const {speech,active}=(event as CustomEvent<{speech:Speech;active:boolean}>).detail;if(speech.character==='homer')speaking.current=active?speech:null;};window.addEventListener('homer:playback',handle);return()=>{window.removeEventListener('homer:playback',handle);rig.mixer.stopAllAction();rig.mixer.uncacheRoot(rig.scene)}},[rig,asset]);
 const bone=(name:string)=>rig.bones.get(name.replace(/[._]/g,''));
 // CCD rotates the existing shoulder and elbow toward a world-space target; no detached props or limbs.
 const reach=(target:Vector3)=>{const hand=bone('DEF-hand-middle.R');if(!hand)return;for(let i=0;i<5;i++)for(const name of ['DEF-arm.R','DEF-humerus.R']){const joint=bone(name);if(!joint)continue;root.current!.updateMatrixWorld(true);const origin=joint.getWorldPosition(new Vector3()),a=hand.getWorldPosition(new Vector3()).sub(origin).normalize(),b=target.clone().sub(origin).normalize();const q=new Quaternion().setFromUnitVectors(a,b);q.slerp(new Quaternion(),.3);const parentQ=joint.parent!.getWorldQuaternion(new Quaternion());joint.quaternion.premultiply(parentQ.clone().invert().multiply(q).multiply(parentQ));}};
 useFrame(({camera,gl},dt)=>{
  if(!root.current||state.paused)return;dt=Math.min(dt,.08);clock.current+=dt;const t=clock.current;
  let walking=false,direction:Vec3=[0,0,1];let donut=state.interaction?donutPose(Date.now()-state.interaction.startedAt):null;
  if(donut){position.current.set(...donut.position);walking=donut.walking;direction=donut.direction;lastInteraction.current=state.interaction!.id;}
  else if(lastInteraction.current){position.current.set(...HOMER_HOME);lastInteraction.current=undefined;}
  if(state.movement){if(!previousMove.current){path.current=[position.current.toArray()as Vec3,...state.movement.path,state.movement.to==='living'?HOMER_HOME:ROOM_NAV_POINTS[state.movement.to]];}const p=pointAlong(path.current,(Date.now()-state.movement.startedAt)/state.movement.duration);position.current.set(...p.position);direction=p.direction;walking=true;}
  else if(previousMove.current&&path.current.length)position.current.set(...path.current.at(-1)!);
  previousMove.current=!!state.movement;root.current.position.copy(position.current);
  const yaw=walking?Math.atan2(direction[0],direction[2]):donut&&donut.phase!=='done'?Math.PI:Math.atan2(camera.position.x-position.current.x,camera.position.z-position.current.z);
  root.current.rotation.y+=Math.atan2(Math.sin(yaw-root.current.rotation.y),Math.cos(yaw-root.current.rotation.y))*(1-Math.exp(-dt*7));
  for(const pose of rig.rest){pose.bone.position.copy(pose.position);pose.bone.quaternion.copy(pose.quaternion);pose.bone.scale.copy(pose.scale)}
  if(walking)walkingTime.current+=dt;rig.mixer.setTime(walking?walkingTime.current:0);
  if(!walking)for(const pose of rig.legs){pose.bone.position.copy(pose.position);pose.bone.quaternion.copy(pose.quaternion);pose.bone.scale.copy(pose.scale)}
  const speech=speaking.current||(state.settings.ttsProvider==='silent'&&state.speaking?.character==='homer'?state.speaking:null);
  talkBlend.current=MathUtils.damp(talkBlend.current,speech&&!walking&&!donut?1:0,5,dt);const w=talkBlend.current;
  const add=(name:string,x:number,y=0,z=0)=>{const b=bone(name);if(b){b.rotateX(x);b.rotateY(y);b.rotateZ(z)}};
  if(!walking){add('DEF-chest',Math.sin(t*.9)*.015,Math.sin(t*.7)*.025);add('DEF-head',Math.sin(t*1.9)*.035*w,Math.sin(t*.7)*.06);
   const mode=(speech?.text.length||0)%3;add('DEF-humerus.R',w*(.25+Math.sin(t*2.1)*.15),0,w*(mode===0?-.45:-.2));add('DEF-arm.R',w*(.5+Math.sin(t*1.8)*.2));add('DEF-humerus.L',w*.15,0,w*.15);add('DEF-arm.L',w*(.3+Math.sin(t*1.3)*.12));
   if(state.characters.homer.expression==='confused'){add('DEF-head',0,0,.12);add('DEF-arm.L',.3)}
   if(state.characters.homer.expression==='happy')add('DEF-head',0,0,Math.sin(t*2)*.03);
  }
  root.current.updateMatrixWorld(true);
  if(donut&&['reach','eat','settle'].includes(donut.phase)){
   const hand=bone('DEF-hand-middle.R');const head=bone('DEF-head');if(hand&&head){let target=new Vector3(...DONUT_SPOT);if(donut.phase==='eat')target.lerp(root.current!.localToWorld(new Vector3(0,1.62,.36)),MathUtils.smoothstep(Date.now()-state.interaction!.startedAt,4700,5700));
    const blend=donut.phase==='reach'?MathUtils.smoothstep(Date.now()-state.interaction!.startedAt,3500,4700):1;target.lerpVectors(hand.getWorldPosition(new Vector3()),target,blend);reach(target);
   }
  }
  if(held.current){held.current.visible=Boolean(donut?.held);const hand=bone('DEF-hand-middle.R');if(hand&&donut?.held){root.current.updateMatrixWorld(true);held.current.position.copy(hand.getWorldPosition(new Vector3()));held.current.rotation.set(.3,0,0);}}
  // Moving character shadows must not remain at the initial position.
  if(walking||donut||w>.01)gl.shadowMap.needsUpdate=true;
 });
 return <><group ref={root} position={position.current} name="homer-3d" visible={state.characters.homer.enabled}><group position={rig.offset} scale={rig.scale}><primitive object={rig.scene}/></group><mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><circleGeometry args={[.36,32]}/><meshBasicMaterial color="#332633" transparent opacity={.17} depthWrite={false}/></mesh></group><group ref={held} visible={false} name="held-donut"><Donut scale={.8}/></group></>;
}
