import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {GIFT_LEGEND} from '../src/components/GiftColumn';import {applyAction,createInitialState} from '../shared/engine';
test('Gift legend uses four real local RGBA PNGs in the requested order',()=>{
 assert.deepEqual(GIFT_LEGEND.map(g=>g.id),['rose','dino','doughnut','heart']);assert.deepEqual(GIFT_LEGEND.map(g=>g.label),['ME RESPONDA PRIMEIRO','ME DÁ UM SALVE','HOMER COME UMA ROSQUINHA','A LIVE ACABA']);
 for(const gift of GIFT_LEGEND){const b=readFileSync('public/gifts/'+gift.image);assert.equal(b.subarray(1,4).toString(),'PNG');assert.ok(b.readUInt32BE(16)>=160);assert.equal(b[25],6,'true-color alpha PNG required');}
});
test('Gift overlay does not introduce gift commands into the engine',()=>{
 const s=createInitialState();assert.equal(applyAction(s,{type:'GIFT_DEMO',gift:'rose',messageId:'test'}).ok,false);assert.equal(s.speechQueue.length,0);assert.equal(s.paused,false);
});
