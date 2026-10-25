import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {HOMER_HOME,donutPose,DONUT_DURATION} from '../shared/homerMotion';
import {applyAction,createInitialState,tick} from '../shared/engine';
test('Homer GLB has a complete symmetric skinned mesh, walk animation and no facial morphs',()=>{
 const b=readFileSync('public/models/homer/homer.glb');assert.equal(b.toString('utf8',0,4),'glTF');const json=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 assert.equal(json.skins.length,1);assert.ok(json.skins[0].joints.length>20);assert.ok(json.animations.some((a:any)=>a.name==='Walk'));
 let minX=Infinity,maxX=-Infinity,count=0;for(const mesh of json.meshes)for(const primitive of mesh.primitives){assert.ok(primitive.attributes.JOINTS_0!==undefined);assert.ok(primitive.attributes.WEIGHTS_0!==undefined);assert.equal(primitive.targets,undefined);const a=json.accessors[primitive.attributes.POSITION];minX=Math.min(minX,a.min[0]);maxX=Math.max(maxX,a.max[0]);count+=a.count;}
 assert.ok(minX<-.2&&maxX>.2,`both halves required: ${minX}, ${maxX}`);assert.ok(count>10000);
 const binaryStart=28+b.readUInt32LE(12);const animation=json.animations.find((a:any)=>a.name==='Walk');
 for(const channel of animation.channels){const name=json.nodes[channel.target.node].name;if(!/^DEF-foot\./.test(name)||channel.target.path!=='translation')continue;const accessor=json.accessors[animation.samplers[channel.sampler].output],view=json.bufferViews[accessor.bufferView],offset=binaryStart+(view.byteOffset||0)+(accessor.byteOffset||0);for(let axis=0;axis<3;axis++)assert.ok(Math.abs(b.readFloatLE(offset+axis*4)-b.readFloatLE(offset+((accessor.count-1)*3+axis)*4))<.001,'walk cycle must close without a foot jump');}

});
test('Donut route is continuous, finishes at home and keeps feet in front of the table',()=>{
 assert.deepEqual(donutPose(0).position,HOMER_HOME);assert.deepEqual(donutPose(DONUT_DURATION).position,HOMER_HOME);assert.equal(donutPose(DONUT_DURATION).walking,false);
 for(let t=10;t<=DONUT_DURATION;t+=10){const a=donutPose(t-10),b=donutPose(t);assert.ok(Math.hypot(...b.position.map((v,i)=>v-a.position[i]))<.03);assert.ok(b.position[2]>=1);assert.equal(b.position[1],0)}
 assert.equal(donutPose(5000).held,true);assert.equal(donutPose(7900).held,false);
});
test('Donut action rejects overlap, freezes during pause and completes once',()=>{
 const now=1800000000000,s=createInitialState(now);s.settings.mode='manual';const startHunger=s.homer.hunger;
 assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'},now).ok,true);
 assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'},now).ok,false);assert.equal(applyAction(s,{type:'MOVE_TO_ROOM',room:'kitchen'},now).ok,false);
 applyAction(s,{type:'PAUSE',paused:true},now+1000);tick(s,now+20000,0);assert.ok(s.interaction);applyAction(s,{type:'PAUSE',paused:false},now+21000);assert.equal(s.interaction!.startedAt,now+20000);
 tick(s,now+32001,0);assert.equal(s.interaction,undefined);assert.equal(s.homer.hunger,startHunger-15);tick(s,now+40000,0);assert.equal(s.homer.hunger,startHunger-15);
 s.room='kitchen';assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'donut'},now+40001).ok,false);
});
test('Local response carries the selected comment and validates optional profile photos',()=>{
 const now=1800000000000,s=createInitialState(now);s.settings.mode='auto';s.settings.familyEnabled=false;s.settings.eventsEnabled=false;
 assert.equal(applyAction(s,{type:'CHAT',user:'visitor',text:'Oi Homer!',avatarUrl:'javascript:alert(1)'},now).ok,false);
 assert.equal(applyAction(s,{type:'CHAT',user:'visitor',text:'Oi Homer!',avatarUrl:'https://example.org/photo.png'},now).ok,true);
 tick(s,now+20000,0);const reply=s.speechQueue.find(q=>q.replyTo);assert.equal(reply?.replyTo?.text,'Oi Homer!');assert.equal(reply?.replyTo?.avatarUrl,'https://example.org/photo.png');
});
