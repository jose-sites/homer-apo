import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {IdleDirector,IDLE_GESTURES,canIdle,idlePose} from '../src/scene/homerIdle';
import {createInitialState,applyAction} from '../shared/engine';
import {shouldComment} from '../server/providers';

test('Idle gestures have quiet gaps, exclude last three gestures and cancel for priority work',()=>{
 const director=new IdleDirector(()=>0),seen:string[]=[];let previous:string|undefined;
 for(let t=0;t<180;t+=.1){const frame=director.sample(t,true);if(frame&&frame.kind!==previous){assert.ok(!seen.slice(-3).includes(frame.kind));seen.push(frame.kind);}previous=frame?.kind;}
 assert.ok(seen.length>=6&&seen.length<=11);
 assert.equal(director.sample(181,false),null);assert.equal(director.sample(190,true),null);
 const s=createInitialState();assert.equal(canIdle(s),true);assert.equal(canIdle(s,true),false);
 applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'});assert.equal(canIdle(s),false);
 s.interaction=undefined;s.room='kitchen';assert.equal(canIdle(s),false);s.room='living';s.paused=true;assert.equal(canIdle(s),false);
 s.paused=false;applyAction(s,{type:'TALK',character:'homer',text:'Uma resposta.'});assert.equal(canIdle(s),false);
});
test('Idle poses ease in and out and preserve real rig bone lengths and root position',async()=>{
 const {GLTFLoader}=await import('three/examples/jsm/loaders/GLTFLoader.js');const {Group,Vector3}=await import('three');const {createHomerRig,reachWithArm}=await import('../src/scene/homerRig');
 const b=readFileSync('public/models/homer/homer.glb'),asset=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');const rig=createHomerRig(asset),root=new Group(),offset=new Group();offset.position.set(...rig.offset);offset.scale.setScalar(rig.scale);offset.add(rig.scene);root.add(offset);root.position.set(-.1,0,1.5);
 for(const kind of IDLE_GESTURES){assert.equal(idlePose(kind,0).weight,0);assert.ok(idlePose(kind,1).weight<1e-20);for(const progress of [.25,.5,.75]){rig.restore(rig.rest);rig.restore(rig.legs);const p=idlePose(kind,progress),hand=rig.bone('DEF-hand-middle1.R')!,arm=rig.bone('DEF-arm.R')!,shoulder=rig.bone('DEF-humerus.R')!;root.updateMatrixWorld(true);const length=shoulder.getWorldPosition(new Vector3()).distanceTo(arm.getWorldPosition(new Vector3()));if(p.hand){const aim=root.localToWorld(new Vector3(...p.hand));aim.lerpVectors(hand.getWorldPosition(new Vector3()),aim,p.weight);assert.ok(reachWithArm(root,hand,[arm,shoulder],aim)<.12,kind);assert.ok(Math.abs(length-shoulder.getWorldPosition(new Vector3()).distanceTo(arm.getWorldPosition(new Vector3())))<1e-5);}assert.deepEqual(root.position.toArray(),[-.1,0,1.5]);for(const pose of rig.rest){assert.deepEqual(pose.bone.scale.toArray(),pose.scale.toArray());assert.deepEqual(pose.bone.position.toArray(),(rig.legs.find(l=>l.bone===pose.bone)||pose).position.toArray());}}}
 rig.mixer.stopAllAction();rig.mixer.uncacheRoot(rig.scene);
});
test('Idle voice waits for donut, selected messages, speech queue and active games',()=>{
 const s=createInitialState();s.settings.provider='openai-compatible';s.settings.mode='auto';assert.equal(shouldComment(s,300000,0,0),true);
 applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'});assert.equal(shouldComment(s,300000,0,0),false);s.interaction=undefined;
 applyAction(s,{type:'CHAT',user:'viewer',text:'Olá Homer'});s.chat[0].selected=true;assert.equal(shouldComment(s,Date.now()+300000,0,0),false);s.chat=[];
 applyAction(s,{type:'TALK',character:'homer',text:'Salve!'});assert.equal(shouldComment(s,300000,0,0),false);
});
