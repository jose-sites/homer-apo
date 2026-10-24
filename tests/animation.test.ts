import test from 'node:test';
import assert from 'node:assert/strict';
import {GESTURES,chooseGesture,gesturePose,damp,RIG} from '../src/scene/characterMotion';
import {spriteSvg} from '../src/scene/spriteArt';
import {createInitialState,applyAction,tick} from '../shared/engine';
test('All gestures differ, ease to rest and avoid immediate repetition',()=>{
 assert.equal(new Set(GESTURES.map(g=>JSON.stringify(gesturePose(g,1.65,.7)))).size,7);
 for(const g of GESTURES){assert.ok(gesturePose(g,4,.7).every(x=>x===0));assert.notEqual(chooseGesture('',GESTURES.indexOf(g),g),g);for(const v of gesturePose(g,1.2,3))assert.ok(Number.isFinite(v)&&Math.abs(v)<2)}
 assert.equal(damp(0,1,0),0);assert.ok(damp(0,1,.1)>0&&damp(0,1,.1)<1);
});
test('Layered sprites preserve art and provide independent limbs and head for every character',()=>{
 for(const id of Object.keys(RIG) as (keyof typeof RIG)[]){const parts=['head','body','leftUpper','leftLower','rightUpper','rightLower'].map(layer=>spriteSvg(id,0,false,'neutral',layer));assert.equal(new Set(parts).size,6);for(const svg of parts){assert.match(svg,/<svg/);assert.ok(!svg.includes('undefined'));assert.ok(!svg.includes('NaN'))}assert.notEqual(spriteSvg(id,0,false,'neutral','head'),spriteSvg(id,2,false,'neutral','head'));}
});
test('Speech restores previous activity and keeps an already safe family framing',()=>{
 const now=1800000000000,s=createInitialState(now);s.settings.mode='auto';s.settings.aiEnabled=false;s.settings.eventsEnabled=false;s.settings.familyEnabled=false;s.cameraId='living-family';s.characters.homer.activity='sleeping';
 applyAction(s,{type:'TALK',character:'homer',text:'Olá pessoal'},now);tick(s,now+10,10);assert.equal(s.characters.homer.activity,'talking');assert.equal(s.cameraId,'living-family');const end=s.speaking!.createdAt+s.speaking!.duration+1;tick(s,end,10);assert.equal(s.characters.homer.activity,'sleeping');
});

test('Articulated limbs have no visible circular joint overlays and babies have a distinct seated pose',()=>{
 for(const id of Object.keys(RIG) as (keyof typeof RIG)[])for(const layer of ['leftUpper','rightUpper','leftLower','rightLower'])assert.ok(!spriteSvg(id,0,false,'neutral',layer).includes('<ellipse'));
 assert.match(spriteSvg('maggie',0,false,'neutral','body',true),/M112 298/);
 assert.match(spriteSvg('marge',0,false,'neutral','body',true),/M120 296/);
});
