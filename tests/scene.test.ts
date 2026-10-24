import test from 'node:test';
import assert from 'node:assert/strict';
import { ROOMS, DOORWAYS, doorId } from '../shared/data';
import { LANDING_SLABS, ownsWall, roomWalls } from '../src/scene/sceneLayout';
import { parseSpriteManifest, selectSpriteAngle, spriteFramePaths } from '../src/scene/spriteAssets';
import { samplePath } from '../src/scene/HouseScene';

const interior=ROOMS.filter(room=>!['yard','exterior'].includes(room.kind));
test('every physical doorway aligns with its room-wall aperture',()=>{
 for(const room of interior){for(const neighbor of room.neighbors){const point=DOORWAYS[doorId(room.id,neighbor)];if(!point)continue;
  const wall=roomWalls(room).find(w=>w.neighbor?.id===neighbor);assert.ok(wall,`${room.id} -> ${neighbor} has a wall opening`);
  const world=wall.horizontal?[room.origin[0]+wall.offset,room.origin[1],room.origin[2]+wall.sign*room.size[1]/2]:[room.origin[0]+wall.sign*room.size[0]/2,room.origin[1],room.origin[2]-wall.offset];
  assert.deepEqual(world,point);assert.ok(Math.abs(wall.offset)+.95<=wall.length/2,`${room.id}: full door fits wall`);
 }}
});
test('adjacent interior rooms render exactly one shared wall, owned by active room',()=>{
 for(const room of interior){for(const wall of roomWalls(room)){const other=wall.neighbor;if(!other||['yard','exterior'].includes(other.kind))continue;const reverse=roomWalls(other).find(w=>w.neighbor?.id===room.id)!;
  for(const active of [room.id,other.id,'other']){const ids:string[]=[room.id,other.id];const count:number=Number(ownsWall(room,wall,active,ids))+Number(ownsWall(other,reverse,active,ids));assert.equal(count,1);if(active===room.id)assert.equal(ownsWall(room,wall,active,ids),true);}
 }}
});
test('stair landings support both path approaches without filling the shaft',()=>{
 const supported=(x:number,z:number)=>LANDING_SLABS.some(s=>Math.abs(x-s.p[0])<=s.s[0]/2&&Math.abs(z-s.p[2])<=s.s[2]/2);
 assert.ok(supported(3.1,3.4));assert.ok(supported(3.1,-1.6));assert.ok(supported(-1,-1.6));assert.ok(!supported(3.1,1));
});
test('path interpolation follows supplied corners instead of shortcutting through rooms',()=>{
 const path:[number,number,number][]=[[0,0,0],[4,0,0],[4,3,0]];
 assert.deepEqual(samplePath(path,0).point.toArray(),[0,0,0]);assert.deepEqual(samplePath(path,4/7).point.toArray(),[4,0,0]);assert.deepEqual(samplePath(path,1).point.toArray(),[4,3,0]);
 for(let n=0;n<=20;n++){const p=samplePath(path,n/20).point;assert.ok(p.y===0||p.x===4);}
});
test('front-only art is hidden for rear/unsafe profile views; supplied views are selected',()=>{
 assert.equal(selectSpriteAngle(0),'front');assert.equal(selectSpriteAngle(.6),'front');assert.equal(selectSpriteAngle(1.6),null);assert.equal(selectSpriteAngle(Math.PI),null);
 const art={front:'/sprites/front.png',left:'/sprites/left.png',profile:'/sprites/profile.png',back:'/sprites/back.png'};
 assert.equal(selectSpriteAngle(-.7,art),'left');assert.equal(selectSpriteAngle(1.6,art),'profile');assert.equal(selectSpriteAngle(Math.PI,art),'back');
});
test('sprite overrides accept local image sets, reject remote/traversal URLs, and fill missing frames',()=>{
 const parsed=parseSpriteManifest({characters:{homer:{front:'/sprites/new.png',right:'https://example.com/p.png',frames:{front:{closed:'/sprites/c.png',open:'/sprites/o.png'}}},bart:{front:'/../secret'},lisa:{front:'//evil.test/lisa.png'}}});
 assert.deepEqual(Object.keys(parsed),['homer']);assert.equal(parsed.homer!.right,undefined);
 assert.deepEqual(spriteFramePaths(parsed.homer!,'front'),['/sprites/c.png','/sprites/c.png','/sprites/o.png','/sprites/c.png','/sprites/c.png','/sprites/o.png']);
});
