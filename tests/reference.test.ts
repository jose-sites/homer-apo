import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spriteSvg} from '../src/scene/spriteArt';
import {ROOMS,DOORWAYS,doorId} from '../shared/data';
import {STAIR_BOTTOM,STAIR_TOP,STAIR_OPENING,portalStyle} from '../shared/referenceLayout';
import {movementWaypoints} from '../shared/engine';
import {LANDING_SLABS} from '../src/scene/sceneLayout';
import type {CharacterId} from '../shared/types';
test('reference composition uses a real left kitchen passage and right staircase',()=>{
 const living=ROOMS.find(r=>r.id==='living')!,kitchen=ROOMS.find(r=>r.id==='kitchen')!;
 assert.ok(kitchen.origin[0]<living.origin[0]);assert.equal(DOORWAYS[doorId('living','kitchen')][0],-5);
 const passage=portalStyle('hall-living');assert.ok(passage.width>3);assert.ok(STAIR_BOTTOM[0]>2);
 for(const [from,to]of [['living','parents'],['basement','attic']]){const path=movementWaypoints(from,to)!;assert.ok(path.some(p=>p[0]===STAIR_BOTTOM[0]&&p[2]===STAIR_BOTTOM[2]));assert.ok(path.some(p=>p[0]===STAIR_TOP[0]&&p[2]===STAIR_TOP[2]));}
});
test('landing slabs cover the hallway without covering the translated stair opening',()=>{
 for(let x=-4.9;x<5;x+=.2)for(let z=-3.9;z<4;z+=.2){
  const inside=x>STAIR_OPENING.left&&x<STAIR_OPENING.right&&z>STAIR_OPENING.back&&z<STAIR_OPENING.front;
  const supported=LANDING_SLABS.some(s=>Math.abs(x-s.p[0])<s.s[0]/2-.0001&&Math.abs(z-s.p[2])<s.s[2]/2-.0001);
  if(Math.min(Math.abs(z-STAIR_OPENING.front),Math.abs(z-STAIR_OPENING.back))<.001)continue;
  assert.equal(supported,!inside,`${x},${z}`);
 }
});
test('all five sprite designs export matching assets and visibly distinct expressions, blink and mouth frames',()=>{
 for(const id of ['homer','marge','bart','lisa','maggie'] as CharacterId[]){
  const designs=['neutral','happy','confused','angry','sleepy'].map(e=>spriteSvg(id,0,false,e).replace(/data-expression="[^"]*"/,''));
  assert.equal(new Set(designs).size,5,id);
  assert.notEqual(spriteSvg(id,0,false),spriteSvg(id,0,true));assert.notEqual(spriteSvg(id,0),spriteSvg(id,2));
  assert.equal(readFileSync(`public/sprites/${id}.svg`,'utf8'),spriteSvg(id));
  for(const svg of designs){assert.ok(!svg.includes('NaN'));assert.match(svg,/viewBox="0 0 300 420"/);}
 }
});
