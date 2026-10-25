import {AnimationMixer,AnimationClip,Object3D,Box3,Mesh,Bone,Quaternion,Vector3} from 'three';
import {clone} from 'three/examples/jsm/utils/SkeletonUtils.js';
import type {Vec3} from '../../shared/types';
export function createHomerRig(asset:{scene:Object3D;animations:AnimationClip[]}){
 const scene=clone(asset.scene),mixer=new AnimationMixer(scene);mixer.clipAction(asset.animations[0]).play();mixer.setTime(0);scene.updateMatrixWorld(true);
 const bounds=new Box3().setFromObject(scene),size=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3()),scale=2.15/size.y;
 const bones=new Map<string,Bone>();scene.traverse(o=>{if(o instanceof Bone)bones.set(o.name.replace(/[._]/g,''),o);if(o instanceof Mesh){o.castShadow=true;o.frustumCulled=false;}});
 const rest=[...bones.values()].map(b=>({bone:b,position:b.position.clone(),quaternion:b.quaternion.clone(),scale:b.scale.clone()}));
 mixer.setTime(asset.animations[0].duration/2);
 const legs=rest.filter(p=>/^DEF-(hips|femur|shin|foot|toes)/.test(p.bone.name)).map(p=>({bone:p.bone,position:p.position.clone().lerp(p.bone.position,.5),quaternion:p.quaternion.clone().slerp(p.bone.quaternion,.5),scale:p.scale.clone().lerp(p.bone.scale,.5)}));
 const restore=(poses:typeof rest)=>{for(const p of poses){p.bone.position.copy(p.position);p.bone.quaternion.copy(p.quaternion);p.bone.scale.copy(p.scale)}};restore(rest);
 return {scene,mixer,rest,legs,restore,scale,offset:[-center.x*scale,-bounds.min.y*scale,-center.z*scale]as Vec3,bone:(name:string)=>bones.get(name.replace(/[._]/g,''))};
}
export function rotateBoneInWorld(bone:Bone,rotation:Quaternion){
 const parent=bone.parent!.getWorldQuaternion(new Quaternion());bone.quaternion.premultiply(parent.clone().invert().multiply(rotation).multiply(parent));bone.updateWorldMatrix(false,true);
}
/** CCD preserves bone lengths. The middle finger base places the object in the palm. */
export function reachWithArm(root:Object3D,hand:Bone,joints:Bone[],target:Vector3){
 for(let i=0;i<18;i++)for(const joint of joints){
  root.updateMatrixWorld(true);const origin=joint.getWorldPosition(new Vector3()),a=hand.getWorldPosition(new Vector3()).sub(origin),b=target.clone().sub(origin);
  if(a.lengthSq()<1e-9||b.lengthSq()<1e-9)continue;
  const rotation=new Quaternion().setFromUnitVectors(a.normalize(),b.normalize());rotation.slerp(new Quaternion(),.15);rotateBoneInWorld(joint,rotation);
 }
 root.updateMatrixWorld(true);return hand.getWorldPosition(new Vector3()).distanceTo(target);
}
