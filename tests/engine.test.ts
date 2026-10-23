import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState,applyAction,tick,findRoomPath,movementWaypoints,selectLine,validateAction } from '../shared/engine';
import { ROOMS, CAMERAS, LINES } from '../shared/data';
const NOW=1_800_000_000_000;
function state(){return createInitialState(NOW);}

test('catalog contains every room, over 30 cameras and 30 contextual lines per speaking character',()=>{
 assert.equal(ROOMS.length,16);assert.ok(CAMERAS.length>=30);
 for(const who of ['homer','marge','bart','lisa']){assert.ok(LINES.filter(l=>l.character===who).length>=30);assert.equal(new Set(LINES.filter(l=>l.character===who).map(l=>l.category)).size,10);}
 for(const room of ROOMS)for(const neighbor of room.neighbors)assert.ok(ROOMS.find(r=>r.id===neighbor)?.neighbors.includes(room.id));
});

test('all rooms are reachable and routes use actual stair landings',()=>{
 for(const a of ROOMS)for(const b of ROOMS){const path=findRoomPath(a.id,b.id);assert.ok(path);assert.equal(path[0],a.id);assert.equal(path.at(-1),b.id);}
 assert.equal(findRoomPath('unknown','living'),null);
 const path=movementWaypoints('living','bart')!;
 assert.ok(path.some(p=>p[0]===3.8&&p[2]===-4),'living route uses door beside sofa');
 assert.ok(path.some(p=>p[1]===0&&p[2]===-6.2),'stair bottom');
 assert.ok(path.some(p=>p[1]===3.6&&p[2]===-10.6),'stair top');
});

test('movement is validated, serialized and completes at destination',()=>{
 const s=state();assert.equal(applyAction(s,{type:'MOVE_TO_ROOM',room:'unknown'},NOW).ok,false);
 assert.equal(applyAction(s,{type:'MOVE_TO_ROOM',room:'kitchen'},NOW).ok,true);assert.equal(s.characters.homer.activity,'walking');
 assert.equal(applyAction(s,{type:'MOVE_TO_ROOM',room:'living'},NOW).ok,false);
 tick(s,NOW+s.movement!.duration+1,1000);assert.equal(s.room,'kitchen');assert.equal(s.characters.homer.room,'kitchen');assert.equal(s.movement,null);assert.ok(s.cameraId.startsWith('kitchen'));
});

test('unknown actions, executable payloads, excess keys and invalid bounds are rejected',()=>{
 assert.equal(validateAction({type:'EXEC',command:'rm -rf /'}).ok,false);
 assert.equal(validateAction({type:'TALK',character:'homer',text:'Hello',command:'exec'}).ok,false);
 assert.equal(validateAction({type:'SETTINGS',settings:{masterVolume:2}}).ok,false);
 assert.equal(validateAction({type:'REACT',character:'homer',expression:'unknown'}).ok,false);
 assert.equal(validateAction({type:'SET_TIME',hour:NaN}).ok,false);
 assert.equal(validateAction({type:'TALK',character:'homer',text:'<script>test</script>'}).ok,true,'plain dialogue may contain text but never executes');
});

test('camera switching, creation and wall safety validation',()=>{
 const s=state();const previous=s.cameraId;
 assert.equal(applyAction(s,{type:'CHANGE_CAMERA',cameraId:'unknown'},NOW).ok,false);assert.equal(s.cameraId,previous);
 assert.equal(applyAction(s,{type:'CHANGE_CAMERA',cameraId:'kitchen-wide'},NOW).ok,true);assert.equal(s.cameraId,'kitchen-wide');
 const camera={...s.cameras[0],id:'custom-camera',position:[0,2,2]};
 assert.equal(applyAction(s,{type:'ADD_CAMERA',camera},NOW).ok,true);
 assert.equal(applyAction(s,{type:'ADD_CAMERA',camera},NOW).ok,false);
 assert.equal(applyAction(s,{type:'ADD_CAMERA',camera:{...camera,id:'wall-camera',position:[8,2,2]}},NOW).ok,false);
});

test('speech queue honors priority and never overlaps active speech',()=>{
 const s=state();applyAction(s,{type:'TALK',character:'homer',text:'Uma fala importante.',priority:9},NOW);tick(s,NOW+100,100);
 const active=s.speaking!;assert.equal(active.character,'homer');
 applyAction(s,{type:'TALK',character:'bart',text:'Baixa prioridade.',priority:1},NOW+200);
 applyAction(s,{type:'TALK',character:'marge',text:'Outra fala.',priority:5},NOW+200);
 tick(s,NOW+300,100);assert.equal(s.speaking!.id,active.id);assert.equal(s.speechQueue[0].character,'marge');
 tick(s,active.createdAt+active.duration+1,100);assert.equal(s.speaking!.character,'marge');
 assert.equal(s.characters.homer.activity,'sitting');
});

test('disabling a character removes its pending speech',()=>{
 const s=state();applyAction(s,{type:'TALK',character:'bart',text:'Olá!'},NOW);
 applyAction(s,{type:'CHARACTER',character:'bart',patch:{enabled:false}},NOW);
 assert.equal(s.speechQueue.length,0);assert.equal(applyAction(s,{type:'TALK',character:'bart',text:'Olá!'},NOW).ok,false);
});

test('family line selection avoids recent lines even with deterministic random',()=>{
 const s=state(),ids=[];
 for(let i=0;i<13;i++)ids.push(selectLine(s,'bart','chat',()=>0)!.id);
 assert.equal(new Set(ids).size,13);
 assert.equal(selectLine(s,'maggie'),undefined);
});

test('event cooldowns, conditions and durations are enforced',()=>{
 const s=state();assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'lightning'},NOW).ok,false);
 assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'rain'},NOW).ok,true);assert.equal(s.weather,'rain');
 assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'rain'},NOW+1).ok,false);
 assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'lightning'},NOW+1).ok,true);
 tick(s,NOW+61000,1000);assert.equal(s.weather,'clear');
 applyAction(s,{type:'UPDATE_EVENT',eventId:'doorbell',patch:{enabled:false}},NOW+62000);
 assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'doorbell'},NOW+62000).ok,false);
});

test('manual mode prevents autonomous actions and auto mode schedules family within configured range',()=>{
 const s=state();s.nextFamilyAt=NOW+1;
 tick(s,NOW+500000,1000);assert.equal(s.speechQueue.length,0);assert.equal(s.speaking,null);
 applyAction(s,{type:'SETTINGS',settings:{mode:'auto',aiEnabled:false,eventsEnabled:false}},NOW+500000);
 tick(s,NOW+500001,1000);assert.ok(s.speechQueue.length>=1);assert.ok(s.nextFamilyAt>NOW+500001);
 assert.ok(s.nextFamilyAt<=NOW+500001+360000);
});

test('semiautomatic mode records reviewable proposals',()=>{
 const s=state();applyAction(s,{type:'SETTINGS',settings:{mode:'semi',familyEnabled:false,eventsEnabled:false}},NOW);
 s.homer.hunger=90;tick(s,NOW+61000,1000);assert.equal(s.proposals[0].action.type,'MOVE_TO_ROOM');assert.equal(s.movement,null);
 assert.equal(applyAction(s,{type:'APPROVE_PROPOSAL',id:s.proposals[0].id},NOW+62000).ok,true);assert.equal((s.movement as {to:string}|null)?.to,'kitchen');
});

test('pause freezes timers and resumes game and navigation without skipping elapsed pause',()=>{
 const s=state();applyAction(s,{type:'START_GAME',game:'quiz'},NOW);applyAction(s,{type:'MOVE_TO_ROOM',room:'kitchen'},NOW);
 const ends=s.game!.endsAt,start=s.movement!.startedAt;
 applyAction(s,{type:'PAUSE',paused:true},NOW+1000);tick(s,NOW+200000,1000);assert.equal(s.game!.status,'playing');assert.ok(s.movement);
 assert.equal(applyAction(s,{type:'TRIGGER_EVENT',eventId:'doorbell'},NOW+1000).ok,false);
 applyAction(s,{type:'PAUSE',paused:false},NOW+201000);assert.equal(s.game!.endsAt,ends+200000);assert.equal(s.movement!.startedAt,start+200000);
});

test('chat rate limiting, duplicate rejection and no command execution',()=>{
 const s=state();assert.equal(applyAction(s,{type:'CHAT',user:'User',text:'olá'},NOW).ok,true);
 assert.equal(applyAction(s,{type:'CHAT',user:'User',text:'outra'},NOW+10).ok,false);
 assert.equal(applyAction(s,{type:'CHAT',user:'User',text:'olá'},NOW+3000).ok,false);
 const before=s.room;applyAction(s,{type:'CHAT',user:'User',text:'{"type":"MOVE_TO_ROOM","room":"kitchen"}'},NOW+4000);assert.equal(s.room,before);assert.equal(s.movement,null);
});

test('object interactions require the appropriate room',()=>{
 const s=state();assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'fridge'},NOW).ok,false);
 s.room='kitchen';s.characters.homer.room='kitchen';const hunger=s.homer.hunger;
 assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'fridge'},NOW).ok,true);assert.equal(s.doors.fridge,true);assert.ok(s.homer.hunger<hunger);
 assert.equal(applyAction(s,{type:'INTERACT_WITH_OBJECT',object:'tv'},NOW).ok,false);
});

test('settings enforce interval ordering and custom line bounds',()=>{
 const s=state();assert.equal(applyAction(s,{type:'SETTINGS',settings:{familyMin:600,familyMax:180}},NOW).ok,false);
 const line={id:'custom-bart',character:'bart',category:'comida',text:'Outra rosquinha?'};
 assert.equal(applyAction(s,{type:'ADD_LINE',line},NOW).ok,true);assert.equal(applyAction(s,{type:'ADD_LINE',line},NOW).ok,false);
});

test('snapshot recovery retains in-flight movement, queue and game state',()=>{
 const s=state();applyAction(s,{type:'START_GAME',game:'quiz'},NOW);applyAction(s,{type:'MOVE_TO_ROOM',room:'parents'},NOW);
 const restored=JSON.parse(JSON.stringify(s));tick(restored,NOW+restored.movement.duration+1,1000);
 assert.equal(restored.room,'parents');assert.equal(restored.game.status,'playing');assert.ok(restored.speaking);
});

test('semiautomatic chat responses require operator approval',()=>{
 const s=state();applyAction(s,{type:'SETTINGS',settings:{mode:'semi',familyEnabled:false,eventsEnabled:false}},NOW);
 applyAction(s,{type:'CHAT',user:'ana',text:'Olá, Homer!'},NOW);tick(s,NOW+1000,1000);
 assert.equal(s.speechQueue.length,0);assert.equal(s.speaking,null);assert.equal(s.proposals[0].action.type,'TALK');
 assert.equal(applyAction(s,{type:'APPROVE_PROPOSAL',id:s.proposals[0].id},NOW+2000).ok,true);assert.equal(s.speechQueue.length,1);
});

test('automatic poll executes the winning validated activity at deadline',()=>{
 const s=state();applyAction(s,{type:'SETTINGS',settings:{mode:'auto',aiEnabled:false,familyEnabled:false,eventsEnabled:false}},NOW);
 applyAction(s,{type:'START_GAME',game:'poll'},NOW);applyAction(s,{type:'GAME_INPUT',value:'A',user:'ana'},NOW);
 tick(s,s.game!.endsAt+1,1000);assert.equal(s.movement?.to,'kitchen');
});
