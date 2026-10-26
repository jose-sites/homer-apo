import test from 'node:test';
import assert from 'node:assert/strict';
import {providerFailure} from '../server/providerErrors.ts';
import {selectConfiguredProviders} from '../server/liveStartup.ts';
import {createInitialState} from '../shared/engine.ts';
import {ttsOrder} from '../server/config.ts';
test('402, quota and rate limits are distinct and never expose raw provider messages',()=>{
 assert.match(providerFailure('Fish',402,{}),/Pagamento\/créditos/);
 const quota=providerFailure('OpenAI',429,{error:{type:'insufficient_quota',message:'secret-api-key'}});
 assert.match(quota,/Quota\/créditos/);assert.doesNotMatch(quota,/secret/);
 assert.match(providerFailure('OpenAI',429,{error:{code:'rate_limit_exceeded'}}),/temporário/);
 assert.match(providerFailure('OpenAI',429,{}),/não distingue/);
});
test('configured AI and Fish replace saved demo/browser selections without changing mode, camera or silent choice',()=>{
 const s=createInitialState();const camera=s.cameraId;
 selectConfiguredProviders(s,{OPENAI_API_KEY:'fake',FISH_API_KEY:'fake'});
 assert.equal(s.settings.provider,'openai-compatible');assert.equal(s.settings.ttsProvider,'openai-compatible');assert.equal(s.settings.mode,'manual');assert.equal(s.cameraId,camera);
 s.settings.ttsProvider='silent';selectConfiguredProviders(s,{FISH_API_KEY:'fake'});assert.equal(s.settings.ttsProvider,'silent');
 const demo=createInitialState();selectConfiguredProviders(demo,{OPENAI_API_KEY:'fake',HOMER_DEMO:'true'});assert.equal(demo.settings.provider,'demo');
 assert.equal(ttsOrder({FISH_API_KEY:'fake'})[0],'fish');
});
