import {irlPose} from '../../shared/irl';
import {IdleDirector,canIdle,idlePose} from './homerIdle';
import {useEffect,useMemo,useRef} from 'react';
import {useGLTF} from '@react-three/drei';
import {useFrame} from '@react-three/fiber';
import {Group,Bone,Quaternion,Vector3,MathUtils} from 'three';
import {createHomerRig,reachWithArm,rotateBoneInWorld} from './homerRig';
import type {LiveState,Speech,Vec3} from '../../shared/types';
import {ROOM_NAV_POINTS} from '../../shared/data';
import {HOMER_HOME,DONUT_TIMES,DONUT_SPOT,DONUT_BITE_TARGET,donutPose,donutGesture,pointAlong} from '../../shared/homerMotion';
import {Donut} from './Furniture';

/** A skinned mesh, not a billboard. Facial shape keys are deliberately absent. */
export function Homer3D({state}:{state:LiveState}){
 const asset=useGLTF(`${import.meta.env.BASE_URL}models/homer/homer.glb`);
 const rig=useMemo(()=>createHomerRig(asset),[asset]);
 const stick=useRef<Group>(null);const root=useRef<Group>(null),held=useRef<Group>(null);const clock=useRef(0),walkingTime=useRef(0),speaking=useRef<Speech|null>(null),talkBlend=useRef(0),previousMove=useRef(false),path=useRef<Vec3[]>([]),lastInteraction=useRef<string|undefined>(undefined);
 const position=useRef(new Vector3(...(state.room==='living'?HOMER_HOME:ROOM_NAV_POINTS[state.room])));
 useEffect(()=>{rig.mixer.clipAction(asset.animations[0]).play();const handle=(event:Event)=>{const {speech,active}=(event as CustomEvent<{speech:Speech;active:boolean}>).detail;if(speech.character==='homer')speaking.current=active?speech:null;};window.addEventListener('homer:playback',handle);return()=>{window.removeEventListener('homer:playback',handle);rig.mixer.stopAllAction();rig.mixer.uncacheRoot(rig.scene)}},[rig,asset]);
 const idle=useRef(new IdleDirector());const idleTime=useRef(0);
 const bone=rig.bone;
 useFrame(({camera,gl},dt)=>{
  if(!root.current||state.paused)return;idleTime.current+=dt;dt=Math.min(dt,.08);clock.current+=dt;const t=clock.current;
  let walking=false,direction:Vec3=[0,0,1];const elapsed=state.interaction?Date.now()-state.interaction.startedAt:0;const gesture=donutGesture(elapsed);let donut=state.interaction?donutPose(elapsed):null;
  if(donut){position.current.set(...donut.position);walking=donut.walking;direction=donut.direction;lastInteraction.current=state.interaction!.id;}
  else if(state.irl){const p=irlPose(Date.now()-state.irl.startedAt);position.current.set(...p.position);walking=p.walking;direction=p.direction;}
  else if(lastInteraction.current){position.current.set(...HOMER_HOME);lastInteraction.current=undefined;}
  if(state.movement){if(!previousMove.current){path.current=[position.current.toArray()as Vec3,...state.movement.path,state.movement.to==='living'?HOMER_HOME:ROOM_NAV_POINTS[state.movement.to]];}const p=pointAlong(path.current,(Date.now()-state.movement.startedAt)/state.movement.duration);position.current.set(...p.position);direction=p.direction;walking=true;}
  else if(previousMove.current&&path.current.length)position.current.set(...path.current.at(-1)!);
  previousMove.current=!!state.movement;root.current.position.copy(position.current);
  const facingCamera=Math.atan2(camera.position.x-position.current.x,camera.position.z-position.current.z);
  const eatingYaw=-Math.PI/2+Math.atan2(Math.sin(facingCamera+Math.PI/2),Math.cos(facingCamera+Math.PI/2))*gesture.faceCamera;
  root.current.visible=state.characters.homer.enabled&&!(donut&&elapsed<8000);
  const yaw=(state.irl&&!donut)||walking||donut?.phase==='turn'?Math.atan2(direction[0],direction[2]):donut&&donut.phase!=='done'?eatingYaw:facingCamera;
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
  const idleFrame=idle.current.sample(idleTime.current,canIdle(state,!!speaking.current||!!state.irl));
  const idleMotion=idleFrame?idlePose(idleFrame.kind,idleFrame.progress):null;
  if(idleMotion){const q=idleMotion;add('DEF-head',0,q.headYaw,q.headTilt*q.weight);add('DEF-chest',q.chest*q.weight,0,q.chest*q.weight);add('DEF-humerus.R',q.shoulder*q.weight,0,-q.shoulder*q.weight);add('DEF-humerus.L',q.shoulder*q.weight,0,q.shoulder*q.weight);add('DEF-arm.R',q.shoulder*q.weight);add('DEF-arm.L',q.shoulder*q.weight);}
  if(state.irl&&!donut){add('DEF-humerus.L',.45,0,.2);add('DEF-arm.L',.7);}
  root.current.updateMatrixWorld(true);
  const hand=bone('DEF-hand-middle1.R');
  if(idleMotion?.hand&&hand){const rest=hand.getWorldPosition(new Vector3()),aim=root.current.localToWorld(new Vector3(...idleMotion.hand));aim.lerpVectors(rest,aim,idleMotion.weight);reachWithArm(root.current,hand,['DEF-arm.R','DEF-humerus.R'].map(bone).filter((b):b is Bone=>!!b),aim);}
  if(donut&&gesture.weight>0&&hand){
   const hips=bone('DEF-hips');if(hips){const axis=new Vector3(1,0,0).applyQuaternion(root.current.quaternion);rotateBoneInWorld(hips,new Quaternion().setFromAxisAngle(axis,gesture.lean));root.current.updateMatrixWorld(true);}
   const restHand=hand.getWorldPosition(new Vector3());
   // Mouth position follows Homer's rotation; never aim at the neck bone behind his face.
   const mouth=root.current.localToWorld(new Vector3(...DONUT_BITE_TARGET));
   const target=new Vector3(...DONUT_SPOT).lerp(mouth,gesture.carry);
   target.lerpVectors(restHand,target,gesture.weight);
   reachWithArm(root.current,hand,['DEF-arm.R','DEF-humerus.R'].map(bone).filter((b):b is Bone=>!!b),target);
  }
  if(held.current){held.current.visible=Boolean(donut?.held)&&state.characters.homer.enabled;if(hand&&donut?.held){root.current.updateMatrixWorld(true);held.current.position.lerpVectors(new Vector3(...DONUT_SPOT),hand.getWorldPosition(new Vector3()),MathUtils.smoothstep(elapsed,DONUT_TIMES.pickup,DONUT_TIMES.pickup+300));held.current.quaternion.copy(root.current.quaternion).multiply(new Quaternion().setFromAxisAngle(new Vector3(1,0,0),gesture.carry*Math.PI/2));held.current.scale.setScalar(gesture.scale);}}
  if(stick.current){stick.current.visible=!!state.irl&&!donut;const palm=bone('DEF-hand-middle1.L');if(stick.current.visible&&palm){root.current.updateMatrixWorld(true);const a=palm.getWorldPosition(new Vector3()),b=camera.position.clone().add(new Vector3(0,-.12,0)),delta=b.clone().sub(a);stick.current.position.copy(a).add(b).multiplyScalar(.5);stick.current.quaternion.setFromUnitVectors(new Vector3(0,1,0),delta.clone().normalize());stick.current.scale.set(1,delta.length(),1);}}
  // Moving character shadows must not remain at the initial position.
  if(walking||donut||idleMotion||w>.01)gl.shadowMap.needsUpdate=true;
 });
 return <><group ref={stick} visible={false}><mesh><cylinderGeometry args={[.012,.018,1,8]}/><meshStandardMaterial color="#31343b"/></mesh><mesh position={[0,.5,0]}><boxGeometry args={[.09,.04,.05]}/><meshStandardMaterial color="#20232a"/></mesh></group><group ref={root} position={position.current} name="homer-3d" visible={state.characters.homer.enabled}><group position={rig.offset} scale={rig.scale}><primitive object={rig.scene}/></group><mesh rotation={[-Math.PI/2,0,0]} position={[0,.012,0]}><circleGeometry args={[.36,32]}/><meshBasicMaterial color="#332633" transparent opacity={.17} depthWrite={false}/></mesh></group><group ref={held} visible={false} name="held-donut"><Donut scale={.8}/></group></>;
}
