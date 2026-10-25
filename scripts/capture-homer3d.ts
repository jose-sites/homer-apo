/** One bounded visual check against an isolated server, no credentials or operator data. */
import {chromium} from 'playwright';
import {mkdir,mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import assert from 'node:assert/strict';
import {createServer} from '../server/index';import {applyAction,tick} from '../shared/engine';
const output='test-results/homer3d',dir=await mkdtemp(join(tmpdir(),'homer3d-'));
const app=createServer({dataDir:dir,env:{},tickInterval:0,log:()=>{}});Object.assign(app.state.settings,{mode:'manual',quality:'medium',adaptiveQuality:false,autoCamera:false,cleanOverlay:true,ttsProvider:'silent'});
const {url}=await app.start(0);const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||undefined,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader','--disable-dev-shm-usage']});
const errors:string[]=[];const page=await browser.newPage({viewport:{width:450,height:800}});page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
try{
 await mkdir(output,{recursive:true});await page.goto(url+'/overlay');await page.waitForFunction(()=>Number(document.querySelector('.house-scene')?.getAttribute('data-draw-calls'))>0);await page.waitForTimeout(1200);
 const rect=await page.locator('canvas').boundingBox();assert.ok(rect&&Math.abs(rect.width/rect.height-9/16)<.01);
 const cycle=await page.evaluate(()=>{const el=document.querySelector('.gift-column')!;const animation=el.getAnimations()[0];animation.pause();return [0,9999,10001,14999,15001].map(t=>{animation.currentTime=t;return {time:t,visible:getComputedStyle(el).visibility==='visible'}})});assert.deepEqual(cycle.map(c=>c.visible),[true,true,false,false,true]);await page.evaluate(()=>{const a=document.querySelector('.gift-column')!.getAnimations()[0];a.currentTime=0;a.play()});
 await page.screenshot({path:join(output,'standing.png'),timeout:20000});
 const now=Date.now();applyAction(app.state,{type:'TALK',character:'homer',text:'Hmm… uma rosquinha? Essa é a melhor ideia que ouvi hoje!',priority:4},now);app.state.speechQueue[0].replyTo={id:'visual-test',user:'visitante_demo',text:'Homer, come uma rosquinha aí?',source:'test',selected:true,at:now};tick(app.state,now,0);app.broadcast();await page.getByLabel('Comentário selecionado').waitFor();await page.waitForTimeout(800);await page.screenshot({path:join(output,'comment.png'),timeout:20000});
 app.state.speaking=null;app.broadcast();
 assert.equal(applyAction(app.state,{type:'INTERACT_WITH_OBJECT',object:'donut'},Date.now()).ok,true);
 for(const [label,elapsed]of [['walk',1700],['pickup',4300],['eat',5800],['return',9500]]as const){const frameTime=Date.now();await page.clock.setFixedTime(new Date(frameTime));app.state.interaction!.startedAt=frameTime-elapsed;app.broadcast();await page.waitForTimeout(1500);await page.screenshot({path:join(output,label+'.png'),timeout:20000});}
 tick(app.state,app.state.interaction!.startedAt+12001,0);app.broadcast();await page.waitForTimeout(400);assert.equal(app.state.interaction,undefined);await page.screenshot({path:join(output,'returned.png'),timeout:20000});
 await writeFile(join(output,'report.json'),JSON.stringify({errors,checks:['9:16 canvas','selected comment visible','donut action accepted and completed','WebGL rendered','gift legend: 10 seconds visible / 5 hidden'],at:new Date().toISOString()},null,2));assert.deepEqual(errors,[]);console.log('Visual capture completed: standing, comment, walking, pickup, eating and return.');
}finally{await browser.close();await app.close();await rm(dir,{recursive:true,force:true})}
