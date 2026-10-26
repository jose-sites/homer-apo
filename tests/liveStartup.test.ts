import test from 'node:test';
import assert from 'node:assert/strict';
import {liveRequirements,activateLiveConversation} from '../server/liveStartup.ts';
import {createInitialState} from '../shared/engine.ts';
test('live startup requires external AI, selected Fish voice and enabled TikTok without paid calls',()=>{
 assert.ok(liveRequirements({}).includes('FISH_REFERENCE_ID_HOMER (voz escolhida)'));
 const env={AI_API_KEY:'test',FISH_API_KEY:'test',FISH_REFERENCE_ID_HOMER:'test-voice',TTS_PRIMARY:'fish',TIKTOK_ENABLED:'true',TIKTOK_USERNAME:'test'};
 assert.deepEqual(liveRequirements(env),[]);
 assert.ok(liveRequirements({...env,TTS_PRIMARY:'openai'}).includes('TTS_PRIMARY=fish'));
});
test('single startup selects automatic external AI and server voice, preserving camera and scene',()=>{
 const s=createInitialState();s.paused=true;const camera=s.cameraId;const room=s.room;
 activateLiveConversation(s);
 assert.equal(s.paused,false);assert.equal(s.settings.mode,'auto');assert.equal(s.settings.provider,'openai-compatible');assert.equal(s.settings.ttsProvider,'openai-compatible');assert.equal(s.cameraId,camera);assert.equal(s.room,room);
});
